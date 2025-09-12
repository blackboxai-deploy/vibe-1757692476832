'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AutoFixEngine, FixResult } from '@/lib/salesforce/autofix';
import { SalesforceValidator } from '@/lib/salesforce/validation';
import { AssetUploader } from '@/components/AssetUploader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';

function AutoFixContent() {
  const searchParams = useSearchParams();
  const [currentAsset, setCurrentAsset] = useState<any>(null);
  const [fixResult, setFixResult] = useState<FixResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState('asset.json');

  useEffect(() => {
    const assetParam = searchParams.get('asset');
    if (assetParam) {
      try {
        const asset = JSON.parse(decodeURIComponent(assetParam));
        setCurrentAsset(asset);
        setFileName('uploaded-asset.json');
      } catch (error) {
        console.error('Error parsing asset from URL:', error);
      }
    }
  }, [searchParams]);

  const handleAssetUploaded = (asset: any, name?: string) => {
    setCurrentAsset(asset);
    setFileName(name || 'asset.json');
    setFixResult(null); // Reset previous results
  };

  const runAutoFix = async () => {
    if (!currentAsset) return;

    setIsProcessing(true);
    try {
      // First, validate the asset to get issues
      const validationResult = SalesforceValidator.validateAsset(currentAsset);
      
      // Apply fixes to the fixable issues
      const result = AutoFixEngine.applyFixes(currentAsset, validationResult.fixableIssues);
      
      setFixResult(result);
    } catch (error) {
      console.error('AutoFix error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadAsset = (asset: any, suffix: string = '') => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(asset, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${fileName.replace('.json', '')}${suffix}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AutoFix Engine</h1>
        <p className="text-gray-600">
          Automatically detect and fix common Salesforce CRM Analytics asset issues with intelligent recommendations.
        </p>
      </div>

      {/* Asset Upload Section */}
      {!currentAsset && (
        <AssetUploader onAssetUploaded={handleAssetUploaded} />
      )}

      {/* Asset Loaded Section */}
      {currentAsset && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Asset Loaded</CardTitle>
                <p className="text-sm text-gray-600">File: {fileName}</p>
              </div>
              <div className="flex space-x-2">
                <Button 
                  onClick={runAutoFix} 
                  disabled={isProcessing}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    'Run AutoFix'
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setCurrentAsset(null);
                    setFixResult(null);
                  }}
                >
                  Load Different Asset
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">Asset Type:</span>
                <span className="ml-2">{currentAsset.ui ? 'Recipe' : 'Dataflow'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Version:</span>
                <span className="ml-2">{currentAsset.version || 'Not specified'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Nodes:</span>
                <span className="ml-2">{
                  Array.isArray(currentAsset.nodes) 
                    ? currentAsset.nodes.length 
                    : Object.keys(currentAsset.nodes || {}).length
                }</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fix Results Section */}
      {fixResult && (
        <div className="space-y-6">
          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle>AutoFix Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {fixResult.appliedFixes.length}
                  </div>
                  <div className="text-sm text-gray-600">Fixes Applied</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {fixResult.remainingIssues.length}
                  </div>
                  <div className="text-sm text-gray-600">Manual Review</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {fixResult.changeLog.length}
                  </div>
                  <div className="text-sm text-gray-600">Changes Made</div>
                </div>
              </div>

              {fixResult.success ? (
                <Alert className="border-green-200 bg-green-50">
                  <AlertDescription className="text-green-800">
                    ✅ AutoFix completed successfully! {fixResult.appliedFixes.length} issues were automatically resolved.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertDescription className="text-yellow-800">
                    ⚠️ No automatic fixes could be applied. Manual review required for remaining issues.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex flex-wrap gap-3 mt-4">
                {fixResult.success && (
                  <Button onClick={() => downloadAsset(fixResult.fixedAsset, '-fixed')}>
                    Download Fixed Asset
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  onClick={() => downloadAsset(fixResult.originalAsset, '-original')}
                >
                  Download Original
                </Button>
                <Link href={`/wizard?asset=${encodeURIComponent(JSON.stringify(fixResult.fixedAsset))}`}>
                  <Button variant="outline">
                    Continue to Wizard
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Results */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Changes</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="changes" className="w-full">
                <TabsList>
                  <TabsTrigger value="changes">Changes Applied</TabsTrigger>
                  <TabsTrigger value="remaining">Remaining Issues</TabsTrigger>
                  <TabsTrigger value="comparison">Before/After</TabsTrigger>
                </TabsList>

                <TabsContent value="changes" className="space-y-4">
                  {fixResult.changeLog.length > 0 ? (
                    fixResult.changeLog.map((change, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <Badge className="bg-green-100 text-green-800">
                            {change.type}
                          </Badge>
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {change.location}
                          </code>
                        </div>
                        <h4 className="font-medium mb-2">{change.description}</h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="font-medium text-red-600 mb-1">Before:</div>
                            <code className="block bg-red-50 p-2 rounded text-xs">
                              {change.before}
                            </code>
                          </div>
                          <div>
                            <div className="font-medium text-green-600 mb-1">After:</div>
                            <code className="block bg-green-50 p-2 rounded text-xs">
                              {change.after}
                            </code>
                          </div>
                        </div>
                        
                        <div className="mt-3 p-3 bg-blue-50 rounded text-sm">
                          <strong>Reasoning:</strong> {change.reasoning}
                        </div>
                      </div>
                    ))
                  ) : (
                    <Alert>
                      <AlertDescription>
                        No changes were applied automatically. All issues require manual review.
                      </AlertDescription>
                    </Alert>
                  )}
                </TabsContent>

                <TabsContent value="remaining" className="space-y-4">
                  {fixResult.remainingIssues.length > 0 ? (
                    fixResult.remainingIssues.map((issue, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <Badge 
                            className={
                              issue.severity === 'error' ? 'bg-red-100 text-red-800' :
                              issue.severity === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }
                          >
                            {issue.severity}
                          </Badge>
                          {issue.location && (
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {issue.location}
                            </code>
                          )}
                        </div>
                        <h4 className="font-medium mb-1">{issue.message}</h4>
                        <p className="text-sm text-gray-600">{issue.suggestion}</p>
                      </div>
                    ))
                  ) : (
                    <Alert className="border-green-200 bg-green-50">
                      <AlertDescription className="text-green-800">
                        🎉 All issues have been resolved! Your asset is ready for use.
                      </AlertDescription>
                    </Alert>
                  )}
                </TabsContent>

                <TabsContent value="comparison" className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base text-red-700">Original Asset</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <pre className="text-xs bg-gray-50 p-4 rounded overflow-auto max-h-96">
                          {JSON.stringify(fixResult.originalAsset, null, 2)}
                        </pre>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base text-green-700">Fixed Asset</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <pre className="text-xs bg-gray-50 p-4 rounded overflow-auto max-h-96">
                          {JSON.stringify(fixResult.fixedAsset, null, 2)}
                        </pre>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle>AutoFix Capabilities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-green-700 mb-3">Automatic Fixes</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 mr-3 flex-shrink-0"></div>
                  <span>Add missing version fields</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 mr-3 flex-shrink-0"></div>
                  <span>Replace deprecated SAQL "like" operators with contains/startsWith/endsWith</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 mr-3 flex-shrink-0"></div>
                  <span>Update date part references (field_Month → Month(field))</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 mr-3 flex-shrink-0"></div>
                  <span>Remove date attributes that belong in Data Prep Settings</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-yellow-700 mb-3">Manual Review Required</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-1.5 mr-3 flex-shrink-0"></div>
                  <span>Self-referential computeRelative operations</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-1.5 mr-3 flex-shrink-0"></div>
                  <span>Complex multivalue field conversions</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-1.5 mr-3 flex-shrink-0"></div>
                  <span>Field precision and scale attribute overrides</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-1.5 mr-3 flex-shrink-0"></div>
                  <span>Custom date_diff implementations</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AutoFixPage() {
  return (
    <Suspense fallback={
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AutoFix Engine</h1>
          <p className="text-gray-600">Loading...</p>
        </div>
        <div className="flex justify-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    }>
      <AutoFixContent />
    </Suspense>
  );
}
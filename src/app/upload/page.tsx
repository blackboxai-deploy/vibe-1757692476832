'use client';

import { useState } from 'react';
import { AssetUploader } from '@/components/AssetUploader';
import { SalesforceValidator, ValidationResult } from '@/lib/salesforce/validation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';

export default function UploadPage() {
  const [uploadedAsset, setUploadedAsset] = useState<any>(null);
  const [uploadedSchema, setUploadedSchema] = useState<any>(null);
  const [fileName, setFileName] = useState<string>('');
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const handleAssetUploaded = async (asset: any, name?: string) => {
    setUploadedAsset(asset);
    setFileName(name || 'Pasted Content');
    setIsValidating(true);
    
    try {
      // Perform validation
      const result = SalesforceValidator.validateAsset(asset);
      
      // If schema is available, add schema validation
      if (uploadedSchema) {
        const schemaIssues = SalesforceValidator.validateSchema(uploadedSchema, asset);
        result.issues.push(...schemaIssues);
        result.fixableIssues.push(...schemaIssues.filter(issue => issue.autoFixable));
        result.manualIssues.push(...schemaIssues.filter(issue => !issue.autoFixable));
      }
      
      setValidationResult(result);
    } catch (error) {
      console.error('Validation error:', error);
    } finally {
      setIsValidating(false);
    }
  };

  const handleSchemaUploaded = (schema: any) => {
    setUploadedSchema(schema);
    
    // Re-validate if asset is already uploaded
    if (uploadedAsset) {
      handleAssetUploaded(uploadedAsset, fileName);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Asset</h1>
        <p className="text-gray-600">
          Upload your Salesforce CRM Analytics recipe or dataflow asset for validation and optimization.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Section */}
        <div className="lg:col-span-2">
          <AssetUploader 
            onAssetUploaded={handleAssetUploaded}
            onSchemaUploaded={handleSchemaUploaded}
          />
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/fix">
                <Button 
                  className="w-full" 
                  disabled={!uploadedAsset}
                  variant={uploadedAsset ? "default" : "outline"}
                >
                  Run AutoFix
                </Button>
              </Link>
              
              <Link href="/wizard">
                <Button 
                  className="w-full" 
                  variant="outline"
                  disabled={!uploadedAsset}
                >
                  Start Enhancement Wizard
                </Button>
              </Link>
              
              <Link href="/saql-builder">
                <Button 
                  className="w-full" 
                  variant="outline"
                >
                  Build New SAQL
                </Button>
              </Link>
            </CardContent>
          </Card>

          {validationResult && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Validation Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Overall Status:</span>
                    <Badge 
                      className={validationResult.isValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                    >
                      {validationResult.isValid ? 'Valid' : 'Issues Found'}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Asset Type:</span>
                    <Badge variant="outline">
                      {validationResult.assetType || 'Unknown'}
                    </Badge>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Total Issues:</span>
                      <span className="font-medium">{validationResult.issues.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Auto-Fixable:</span>
                      <span className="font-medium text-green-600">{validationResult.fixableIssues.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Manual Review:</span>
                      <span className="font-medium text-yellow-600">{validationResult.manualIssues.length}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Validation Results */}
      {isValidating && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Validating asset...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {validationResult && !isValidating && (
        <Card>
          <CardHeader>
            <CardTitle>Validation Results</CardTitle>
            <p className="text-sm text-gray-600">
              File: {fileName} | Type: {validationResult.assetType}
            </p>
          </CardHeader>
          <CardContent>
            {validationResult.issues.length === 0 ? (
              <Alert className="border-green-200 bg-green-50">
                <AlertDescription className="text-green-800">
                  🎉 Your asset passed all validation checks! No issues found.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge className="bg-green-100 text-green-800">
                    {validationResult.fixableIssues.length} Auto-fixable
                  </Badge>
                  <Badge className="bg-yellow-100 text-yellow-800">
                    {validationResult.manualIssues.length} Manual review
                  </Badge>
                </div>

                <div className="space-y-3">
                  {validationResult.issues.map((issue, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${getSeverityColor(issue.severity)}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant="outline" 
                            className={issue.autoFixable ? 'border-green-500 text-green-700' : 'border-gray-500 text-gray-700'}
                          >
                            {issue.autoFixable ? 'Auto-fixable' : 'Manual'}
                          </Badge>
                          <span className="text-xs font-medium uppercase tracking-wide">
                            {issue.severity}
                          </span>
                        </div>
                        {issue.location && (
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {issue.location}
                          </code>
                        )}
                      </div>
                      <h4 className="font-medium mb-1">{issue.message}</h4>
                      <p className="text-sm opacity-75">{issue.suggestion}</p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-3 pt-4 border-t">
                  {validationResult.fixableIssues.length > 0 && (
                    <Link href={`/fix?asset=${encodeURIComponent(JSON.stringify(uploadedAsset))}`}>
                      <Button>
                        Fix {validationResult.fixableIssues.length} Issues
                      </Button>
                    </Link>
                  )}
                  
                  <Link href={`/wizard?asset=${encodeURIComponent(JSON.stringify(uploadedAsset))}`}>
                    <Button variant="outline">
                      Start Enhancement Wizard
                    </Button>
                  </Link>
                  
                  <Button 
                    variant="outline"
                    onClick={() => {
                      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(uploadedAsset, null, 2));
                      const downloadAnchorNode = document.createElement('a');
                      downloadAnchorNode.setAttribute("href", dataStr);
                      downloadAnchorNode.setAttribute("download", `${fileName}.json`);
                      document.body.appendChild(downloadAnchorNode);
                      downloadAnchorNode.click();
                      downloadAnchorNode.remove();
                    }}
                  >
                    Download Asset
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
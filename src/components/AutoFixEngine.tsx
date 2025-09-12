'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, AlertTriangle, Info, Loader2 } from 'lucide-react';
import DiffViewer, { DiffChange } from './DiffViewer';

interface AutoFixResult {
  success: boolean;
  fixedAsset: any;
  appliedFixes: string[];
  remainingIssues: any[];
  changes: DiffChange[];
}

interface ValidationIssue {
  type: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  location?: string;
  suggestion: string;
  autoFixable: boolean;
}

interface AutoFixEngineProps {
  asset: any;
  issues: ValidationIssue[];
  onFixComplete?: (result: AutoFixResult) => void;
  onFixApplied?: (fixedAsset: any) => void;
}

export default function AutoFixEngine({
  asset,
  issues,
  onFixComplete,
  onFixApplied
}: AutoFixEngineProps) {
  const [isFixing, setIsFixing] = useState(false);
  const [fixResult, setFixResult] = useState<AutoFixResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentFix, setCurrentFix] = useState<string>('');

  const fixableIssues = issues.filter(issue => issue.autoFixable);
  const manualIssues = issues.filter(issue => !issue.autoFixable);

  const handleAutoFix = async () => {
    if (!asset || fixableIssues.length === 0) return;
    
    setIsFixing(true);
    setProgress(0);
    setCurrentFix('Analyzing issues...');
    
    try {
      // Simulate step-by-step fixing
      const fixedAsset = JSON.parse(JSON.stringify(asset)); // Deep clone
      const appliedFixes: string[] = [];
      const changes: DiffChange[] = [];
      
      for (let i = 0; i < fixableIssues.length; i++) {
        const issue = fixableIssues[i];
        setProgress(((i + 1) / fixableIssues.length) * 100);
        setCurrentFix(`Fixing: ${issue.message}`);
        
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Apply fix based on issue type
        const fixed = applyFix(fixedAsset, issue, changes);
        if (fixed) {
          appliedFixes.push(issue.type);
        }
      }
      
      setCurrentFix('Finalizing changes...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const result: AutoFixResult = {
        success: appliedFixes.length > 0,
        fixedAsset,
        appliedFixes,
        remainingIssues: manualIssues,
        changes
      };
      
      setFixResult(result);
      onFixComplete?.(result);
      
    } catch (error) {
      console.error('AutoFix failed:', error);
      // Handle error
    } finally {
      setIsFixing(false);
      setProgress(0);
      setCurrentFix('');
    }
  };

  const applyFix = (asset: any, issue: ValidationIssue, changes: DiffChange[]): boolean => {
    try {
      switch (issue.type) {
        case 'MISSING_VERSION':
          if (!asset.version) {
            asset.version = "56.0";
            changes.push({
              type: 'add',
              path: 'version',
              newValue: "56.0",
              description: 'Added missing version field with latest API version'
            });
            return true;
          }
          break;
          
        case 'DEPRECATED_FUNCTIONS':
          return replaceLikeOperators(asset, changes);
          
        case 'DATE_ATTRIBUTE_ISSUES':
          return fixDateAttributes(asset, changes);
          
        default:
          return false;
      }
    } catch (error) {
      console.error(`Failed to apply fix for ${issue.type}:`, error);
      return false;
    }
    return false;
  };

  const replaceLikeOperators = (asset: any, changes: DiffChange[]): boolean => {
    let hasChanges = false;
    const assetString = JSON.stringify(asset);
    
    // Simple replacement logic for demonstration
    if (assetString.includes('like ')) {
      // In a real implementation, this would be more sophisticated
      const newAssetString = assetString.replace(/like /g, 'contains(');
      try {
        const updatedAsset = JSON.parse(newAssetString);
        Object.assign(asset, updatedAsset);
        changes.push({
          type: 'modify',
          path: 'SAQL expressions',
          oldValue: 'like operator',
          newValue: 'contains function',
          description: 'Replaced deprecated "like" operator with "contains" function'
        });
        hasChanges = true;
      } catch (error) {
        // If parsing fails, skip this fix
      }
    }
    
    return hasChanges;
  };

  const fixDateAttributes = (asset: any, changes: DiffChange[]): boolean => {
    let hasChanges = false;
    const dateAttribs = ['fiscalMonthOffset', 'firstDayOfWeek', 'fiscalYearStartMonth'];
    
    const removeFromObject = (obj: any, path: string = ''): void => {
      if (typeof obj !== 'object' || obj === null) return;
      
      Object.keys(obj).forEach(key => {
        const currentPath = path ? `${path}.${key}` : key;
        
        if (dateAttribs.includes(key)) {
          changes.push({
            type: 'remove',
            path: currentPath,
            oldValue: obj[key],
            description: `Removed ${key} - should be defined in Data Prep Settings instead`
          });
          delete obj[key];
          hasChanges = true;
        } else if (typeof obj[key] === 'object') {
          removeFromObject(obj[key], currentPath);
        }
      });
    };
    
    removeFromObject(asset);
    return hasChanges;
  };

  const handleApplyChanges = () => {
    if (fixResult?.fixedAsset) {
      onFixApplied?.(fixResult.fixedAsset);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'info':
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* AutoFix Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>AutoFix Engine</span>
            <div className="flex gap-2">
              <Badge variant="outline">
                {fixableIssues.length} fixable
              </Badge>
              <Badge variant="secondary">
                {manualIssues.length} manual
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isFixing ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">{currentFix}</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {fixableIssues.length > 0 
                  ? `${fixableIssues.length} issues can be automatically fixed`
                  : 'No issues can be automatically fixed'
                }
              </div>
              <Button 
                onClick={handleAutoFix}
                disabled={fixableIssues.length === 0 || isFixing}
                className="flex items-center gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                Run AutoFix
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Issues Breakdown */}
      <Tabs defaultValue="fixable" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="fixable">
            Fixable Issues ({fixableIssues.length})
          </TabsTrigger>
          <TabsTrigger value="manual">
            Manual Issues ({manualIssues.length})
          </TabsTrigger>
          <TabsTrigger value="results">
            Results
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="fixable" className="space-y-3">
          {fixableIssues.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8 text-gray-500">
                No issues can be automatically fixed
              </CardContent>
            </Card>
          ) : (
            fixableIssues.map((issue, index) => (
              <Card key={index} className={getSeverityColor(issue.severity)}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    {getSeverityIcon(issue.severity)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {issue.type.replace('_', ' ').toLowerCase()}
                        </Badge>
                        <Badge variant={issue.severity === 'error' ? 'destructive' : 'secondary'}>
                          {issue.severity}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium text-gray-900">{issue.message}</p>
                      <p className="text-xs text-gray-600 mt-1">{issue.suggestion}</p>
                      {issue.location && (
                        <p className="text-xs text-gray-500 mt-1">Location: {issue.location}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
        
        <TabsContent value="manual" className="space-y-3">
          {manualIssues.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8 text-gray-500">
                No manual issues found
              </CardContent>
            </Card>
          ) : (
            manualIssues.map((issue, index) => (
              <Card key={index} className={getSeverityColor(issue.severity)}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    {getSeverityIcon(issue.severity)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {issue.type.replace('_', ' ').toLowerCase()}
                        </Badge>
                        <Badge variant={issue.severity === 'error' ? 'destructive' : 'secondary'}>
                          {issue.severity}
                        </Badge>
                        <Badge variant="outline">manual</Badge>
                      </div>
                      <p className="text-sm font-medium text-gray-900">{issue.message}</p>
                      <p className="text-xs text-gray-600 mt-1">{issue.suggestion}</p>
                      {issue.location && (
                        <p className="text-xs text-gray-500 mt-1">Location: {issue.location}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
        
        <TabsContent value="results">
          {fixResult ? (
            <div className="space-y-6">
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  AutoFix completed successfully! {fixResult.appliedFixes.length} fixes applied.
                </AlertDescription>
              </Alert>
              
              <DiffViewer
                changes={fixResult.changes}
                originalData={asset}
                modifiedData={fixResult.fixedAsset}
                title="AutoFix Changes"
                onApplyChanges={handleApplyChanges}
              />
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8 text-gray-500">
                Run AutoFix to see results
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
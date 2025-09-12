'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

import JSONEditor from '@/components/JSONEditor';
import AutoFixEngine from '@/components/AutoFixEngine';
import DiffViewer, { DiffChange } from '@/components/DiffViewer';

interface WizardStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

interface ValidationIssue {
  type: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  location?: string;
  suggestion: string;
  autoFixable: boolean;
}

export default function WizardPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [asset, setAsset] = useState('');
  const [parsedAsset, setParsedAsset] = useState<any>(null);
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
  const [isValid, setIsValid] = useState(false);
  const [changes, setChanges] = useState<DiffChange[]>([]);

  const steps: WizardStep[] = [
    {
      id: 'upload',
      title: 'Upload Asset',
      description: 'Upload or paste your JSON asset for analysis',
      completed: false
    },
    {
      id: 'analyze',
      title: 'Analyze Issues',
      description: 'Review detected issues and validation results',
      completed: false
    },
    {
      id: 'autofix',
      title: 'Apply AutoFixes',
      description: 'Automatically fix common issues',
      completed: false
    },
    {
      id: 'manual',
      title: 'Manual Enhancements',
      description: 'Review and apply manual improvements',
      completed: false
    },
    {
      id: 'preview',
      title: 'Preview Changes',
      description: 'Review all changes before finalizing',
      completed: false
    },
    {
      id: 'export',
      title: 'Export Asset',
      description: 'Download your optimized asset',
      completed: false
    }
  ];

  const mockValidationIssues: ValidationIssue[] = [
    {
      type: 'MISSING_VERSION',
      severity: 'error',
      message: 'Missing required version field',
      suggestion: 'Add version field with latest API version',
      autoFixable: true
    },
    {
      type: 'DEPRECATED_FUNCTIONS',
      severity: 'warning',
      message: 'Deprecated "like" operator found',
      location: 'nodes.filter.saqlExpression',
      suggestion: 'Replace with startsWith, endsWith, or contains function',
      autoFixable: true
    },
    {
      type: 'DATE_ATTRIBUTE_ISSUES',
      severity: 'info',
      message: 'Date attributes found in asset',
      location: 'nodes.compute.parameters',
      suggestion: 'Move date attributes to Data Prep Settings',
      autoFixable: true
    },
    {
      type: 'SELF_REFERENTIAL_COMPUTE',
      severity: 'warning',
      message: 'Self-referential computeRelative detected',
      location: 'nodes.compute.saqlExpression',
      suggestion: 'Replace with aggregate or join operations',
      autoFixable: false
    }
  ];

  const handleAssetChange = (value: string) => {
    setAsset(value);
    
    if (value.trim()) {
      try {
        const parsed = JSON.parse(value);
        setParsedAsset(parsed);
        setValidationIssues(mockValidationIssues);
        setIsValid(true);
        updateStepCompletion('upload', true);
      } catch (error) {
        setParsedAsset(null);
        setValidationIssues([{
          type: 'INVALID_JSON',
          severity: 'error',
          message: 'Invalid JSON format',
          suggestion: 'Fix JSON syntax errors',
          autoFixable: false
        }]);
        setIsValid(false);
      }
    } else {
      setParsedAsset(null);
      setValidationIssues([]);
      setIsValid(false);
      updateStepCompletion('upload', false);
    }
  };

  const updateStepCompletion = (stepId: string, completed: boolean) => {
    // Update step completion status
    const stepIndex = steps.findIndex(s => s.id === stepId);
    if (stepIndex !== -1) {
      steps[stepIndex].completed = completed;
    }
  };

  const handleNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (stepIndex: number) => {
    // Only allow navigation to completed steps or the next step
    const canNavigate = stepIndex <= currentStep + 1;
    if (canNavigate) {
      setCurrentStep(stepIndex);
    }
  };

  const handleFixComplete = (result: any) => {
    setChanges(result.changes);
    updateStepCompletion('autofix', true);
    // Move to next step automatically
    handleNextStep();
  };

  const handleAssetUpdate = (updatedAsset: any) => {
    const newAssetString = JSON.stringify(updatedAsset, null, 2);
    setAsset(newAssetString);
    setParsedAsset(updatedAsset);
    updateStepCompletion('preview', true);
  };

  const renderStepContent = () => {
    const step = steps[currentStep];
    
    switch (step.id) {
      case 'upload':
        return (
          <div className="space-y-4">
            <JSONEditor
              value={asset}
              onChange={handleAssetChange}
              title="Upload Your Asset"
              placeholder="Paste your Salesforce recipe or dataflow JSON here..."
            />
            {asset && (
              <Alert>
                <AlertDescription>
                  Asset uploaded successfully! Click "Next" to proceed with analysis.
                </AlertDescription>
              </Alert>
            )}
          </div>
        );
        
      case 'analyze':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Validation Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex gap-4">
                    <Badge variant="outline">
                      {validationIssues.filter(i => i.severity === 'error').length} Errors
                    </Badge>
                    <Badge variant="secondary">
                      {validationIssues.filter(i => i.severity === 'warning').length} Warnings
                    </Badge>
                    <Badge variant="default">
                      {validationIssues.filter(i => i.severity === 'info').length} Info
                    </Badge>
                  </div>
                  <Badge variant={isValid ? 'default' : 'destructive'}>
                    {isValid ? 'Valid JSON' : 'Invalid JSON'}
                  </Badge>
                </div>
                
                <div className="space-y-3">
                  {validationIssues.map((issue, index) => (
                    <Alert key={index} variant={issue.severity === 'error' ? 'destructive' : 'default'}>
                      <AlertDescription>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium">{issue.message}</p>
                            <p className="text-xs mt-1">{issue.suggestion}</p>
                            {issue.location && (
                              <p className="text-xs text-gray-500 mt-1">Location: {issue.location}</p>
                            )}
                          </div>
                          <Badge variant={issue.autoFixable ? 'default' : 'secondary'}>
                            {issue.autoFixable ? 'Auto-fixable' : 'Manual'}
                          </Badge>
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );
        
      case 'autofix':
        return (
          <AutoFixEngine
            asset={parsedAsset}
            issues={validationIssues}
            onFixComplete={handleFixComplete}
            onFixApplied={handleAssetUpdate}
          />
        );
        
      case 'manual':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Manual Enhancements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <AlertDescription>
                    The following issues require manual attention and cannot be automatically fixed.
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-3">
                  {validationIssues.filter(issue => !issue.autoFixable).map((issue, index) => (
                    <Card key={index}>
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                          <Badge variant="secondary">Manual</Badge>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{issue.message}</p>
                            <p className="text-xs text-gray-600 mt-1">{issue.suggestion}</p>
                            {issue.location && (
                              <p className="text-xs text-gray-500 mt-2">Location: {issue.location}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                <div className="pt-4">
                  <Button onClick={() => {
                    updateStepCompletion('manual', true);
                    handleNextStep();
                  }}>
                    Continue to Preview
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
        
      case 'preview':
        return (
          <div className="space-y-6">
            <DiffViewer
              changes={changes}
              originalData={parsedAsset}
              modifiedData={parsedAsset}
              title="Final Changes Preview"
              onApplyChanges={() => {
                updateStepCompletion('preview', true);
                handleNextStep();
              }}
            />
          </div>
        );
        
      case 'export':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Export Your Asset</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <AlertDescription>
                    Your asset has been successfully optimized and is ready for export.
                  </AlertDescription>
                </Alert>
                
                <div className="flex gap-4">
                  <Button onClick={() => {
                    const blob = new Blob([asset], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'optimized-asset.json';
                    a.click();
                    URL.revokeObjectURL(url);
                  }}>
                    Download JSON
                  </Button>
                  
                  <Button variant="outline" onClick={() => {
                    navigator.clipboard.writeText(asset);
                  }}>
                    Copy to Clipboard
                  </Button>
                </div>
                
                <div className="pt-4">
                  <h4 className="font-medium mb-2">Summary of Changes:</h4>
                  <ul className="text-sm space-y-1 text-gray-600">
                    <li>• {changes.filter(c => c.type === 'add').length} additions</li>
                    <li>• {changes.filter(c => c.type === 'modify').length} modifications</li>
                    <li>• {changes.filter(c => c.type === 'remove').length} deletions</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        );
        
      default:
        return <div>Step not implemented</div>;
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Enhancement Wizard
        </h1>
        <p className="text-gray-600">
          Step-by-step guidance to optimize your Salesforce CRM Analytics assets
        </p>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm text-gray-500">
                Step {currentStep + 1} of {steps.length}
              </span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        </CardContent>
      </Card>

      {/* Step Navigation */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        {steps.map((step, index) => (
          <Button
            key={step.id}
            variant={index === currentStep ? 'default' : index < currentStep ? 'outline' : 'ghost'}
            size="sm"
            onClick={() => handleStepClick(index)}
            disabled={index > currentStep + 1}
            className="text-xs"
          >
            <div className="text-center">
              <div className="font-medium">{index + 1}</div>
              <div className="text-xs">{step.title}</div>
            </div>
          </Button>
        ))}
      </div>

      {/* Current Step */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{steps[currentStep]?.title}</span>
            <Badge variant="outline">
              Step {currentStep + 1}
            </Badge>
          </CardTitle>
          <p className="text-sm text-gray-600">
            {steps[currentStep]?.description}
          </p>
        </CardHeader>
        <CardContent>
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevStep}
          disabled={currentStep === 0}
        >
          Previous
        </Button>
        <Button
          onClick={handleNextStep}
          disabled={currentStep === steps.length - 1}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
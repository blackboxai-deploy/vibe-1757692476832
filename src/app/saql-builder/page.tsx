'use client';

import { useState, useEffect, useCallback } from 'react';
import { SAQLParser, SAQLValidationResult } from '@/lib/salesforce/saql-parser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SUPPORTED_SAQL_FUNCTIONS, MULTIVALUE_FUNCTIONS, DATE_DIFF_REPLACEMENT } from '@/lib/constants';

export default function SAQLBuilderPage() {
  const [saqlQuery, setSaqlQuery] = useState('');
  const [validationResult, setValidationResult] = useState<SAQLValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  const validateQuery = useCallback(async () => {
    setIsValidating(true);
    try {
      const result = SAQLParser.validateSAQL(saqlQuery);
      setValidationResult(result);
    } catch (error) {
      console.error('Validation error:', error);
    } finally {
      setIsValidating(false);
    }
  }, [saqlQuery]);

  useEffect(() => {
    if (saqlQuery.trim()) {
      const timeoutId = setTimeout(() => {
        validateQuery();
      }, 500); // Debounce validation

      return () => clearTimeout(timeoutId);
    } else {
      setValidationResult(null);
    }
  }, [saqlQuery, validateQuery]);

  const loadTemplate = (templateType: string) => {
    const template = SAQLParser.generateSAQLTemplate(templateType as any);
    setSaqlQuery(template);
    setSelectedTemplate(templateType);
  };

  const formatQuery = () => {
    const formatted = SAQLParser.formatSAQL(saqlQuery);
    setSaqlQuery(formatted);
  };

  const insertFunction = (functionName: string) => {
    const textarea = document.getElementById('saql-query') as HTMLTextAreaElement;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    let insertion = '';
    if (functionName === 'case') {
      insertion = 'case when condition then "value1" else "value2" end';
    } else if (functionName === 'coalesce') {
      insertion = 'coalesce(field1, field2, "default")';
    } else {
      insertion = `${functionName}(field)`;
    }
    
    const newQuery = saqlQuery.substring(0, start) + insertion + saqlQuery.substring(end);
    setSaqlQuery(newQuery);
    
    // Focus and set cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + insertion.length, start + insertion.length);
    }, 0);
  };



  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">SAQL Builder & Validator</h1>
        <p className="text-gray-600">
          Build, validate, and optimize your SAQL queries with real-time feedback and function documentation.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Query Builder */}
        <div className="lg:col-span-3 space-y-6">
          {/* Templates and Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Query Builder</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Select value={selectedTemplate} onValueChange={loadTemplate}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Load template..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic Query</SelectItem>
                    <SelectItem value="join">Join Query</SelectItem>
                    <SelectItem value="aggregate">Aggregate Query</SelectItem>
                    <SelectItem value="compute">Compute Expression</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button onClick={formatQuery} variant="outline">
                  Format Query
                </Button>
                
                <Button onClick={validateQuery} variant="outline" disabled={!saqlQuery.trim()}>
                  {isValidating ? 'Validating...' : 'Validate'}
                </Button>
              </div>

              <div>
                <Textarea
                  id="saql-query"
                  placeholder="Enter your SAQL query here...&#10;&#10;Example:&#10;q = load &quot;MyDataset&quot;;&#10;q = foreach q generate Id, Name, Amount;"
                  value={saqlQuery}
                  onChange={(e) => setSaqlQuery(e.target.value)}
                  className="min-h-[300px] font-mono text-sm"
                />
              </div>

              {/* Real-time Validation */}
              {validationResult && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Validation Results</h3>
                    <Badge 
                      className={validationResult.isValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                    >
                      {validationResult.isValid ? 'Valid' : 'Issues Found'}
                    </Badge>
                  </div>

                  {/* Errors */}
                  {validationResult.errors.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-red-700">Errors:</h4>
                      {validationResult.errors.map((error, index) => (
                        <Alert key={index} className="border-red-200 bg-red-50">
                          <AlertDescription className="text-red-800">
                            <Badge className="bg-red-100 text-red-800 mr-2">
                              {error.type}
                            </Badge>
                            {error.message}
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  )}

                  {/* Warnings */}
                  {validationResult.warnings.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-yellow-700">Warnings:</h4>
                      {validationResult.warnings.map((warning, index) => (
                        <Alert key={index} className="border-yellow-200 bg-yellow-50">
                          <AlertDescription className="text-yellow-800">
                            <Badge className="bg-yellow-100 text-yellow-800 mr-2">
                              {warning.type}
                            </Badge>
                            {warning.message}
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  )}

                  {/* Suggestions */}
                  {validationResult.suggestions.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-blue-700">Suggestions:</h4>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <ul className="space-y-1 text-sm text-blue-800">
                          {validationResult.suggestions.map((suggestion, index) => (
                            <li key={index} className="flex items-start">
                              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                              {suggestion}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Query Analysis */}
          {saqlQuery && (
            <Card>
              <CardHeader>
                <CardTitle>Query Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Detected Datasets:</h4>
                    <div className="space-y-1">
                      {SAQLParser.extractDatasets(saqlQuery).map((dataset, index) => (
                        <Badge key={index} variant="outline" className="mr-2">
                          {dataset}
                        </Badge>
                      ))}
                      {SAQLParser.extractDatasets(saqlQuery).length === 0 && (
                        <span className="text-gray-500 text-sm">No datasets detected</span>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Referenced Fields:</h4>
                    <div className="space-y-1">
                      {SAQLParser.extractFields(saqlQuery).slice(0, 10).map((field, index) => (
                        <Badge key={index} variant="secondary" className="mr-2 mb-1">
                          {field}
                        </Badge>
                      ))}
                      {SAQLParser.extractFields(saqlQuery).length > 10 && (
                        <span className="text-gray-500 text-sm">
                          ... and {SAQLParser.extractFields(saqlQuery).length - 10} more
                        </span>
                      )}
                      {SAQLParser.extractFields(saqlQuery).length === 0 && (
                        <span className="text-gray-500 text-sm">No fields detected</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Function Reference Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Function Reference</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="functions" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="functions">Functions</TabsTrigger>
                  <TabsTrigger value="multivalue">Multivalue</TabsTrigger>
                </TabsList>
                
                <TabsContent value="functions" className="space-y-2">
                  <div className="max-h-96 overflow-y-auto space-y-1">
                    {SUPPORTED_SAQL_FUNCTIONS.map((func) => (
                      <Button
                        key={func}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-left font-mono text-xs"
                        onClick={() => insertFunction(func)}
                      >
                        {func}()
                      </Button>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="multivalue" className="space-y-3">
                  <div className="space-y-3">
                    {Object.entries(MULTIVALUE_FUNCTIONS).map(([func, info]) => (
                      <div key={func} className="border rounded p-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start font-mono text-xs mb-2 p-0"
                          onClick={() => insertFunction(func)}
                        >
                          {func}()
                        </Button>
                        <p className="text-xs text-gray-600 mb-1">{info.description}</p>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded block">
                          {info.example}
                        </code>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Date Functions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-xs text-gray-600 mb-3">
                Modern replacements for deprecated patterns:
              </div>
              
              <div className="space-y-3">
                <div className="border rounded p-3">
                  <div className="font-mono text-xs font-medium mb-1">Date Arithmetic</div>
                  <p className="text-xs text-gray-600 mb-2">{DATE_DIFF_REPLACEMENT.description}</p>
                  <div className="space-y-1">
                    {Object.entries(DATE_DIFF_REPLACEMENT.examples).map(([key, value]) => (
                      <div key={key} className="text-xs">
                        <span className="font-medium">{key}:</span>
                        <code className="ml-2 bg-gray-100 px-1 rounded">{String(value)}</code>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="border rounded p-3">
                  <div className="font-mono text-xs font-medium mb-2">Date Part Functions</div>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    {['Year', 'Month', 'Day', 'Hour', 'Minute', 'Second'].map((func) => (
                      <Button
                        key={func}
                        variant="ghost"
                        size="sm"
                        className="justify-start font-mono text-xs h-6"
                        onClick={() => insertFunction(func)}
                      >
                        {func}()
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
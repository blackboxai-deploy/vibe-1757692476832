'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ValidationError {
  line?: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

interface JSONEditorProps {
  value: string;
  onChange: (value: string) => void;
  onValidate?: (isValid: boolean, errors: ValidationError[]) => void;
  placeholder?: string;
  readOnly?: boolean;
  showLineNumbers?: boolean;
  title?: string;
}

export default function JSONEditor({
  value,
  onChange,
  onValidate,
  placeholder = 'Paste your JSON asset here...',
  readOnly = false,
  showLineNumbers = true,
  title = 'JSON Editor'
}: JSONEditorProps) {
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isValid, setIsValid] = useState(true);
  const [formatted, setFormatted] = useState(false);

  const validateJSON = useCallback((jsonText: string) => {
    const newErrors: ValidationError[] = [];
    let valid = true;

    if (!jsonText.trim()) {
      setErrors([]);
      setIsValid(true);
      onValidate?.(true, []);
      return;
    }

    try {
      const parsed = JSON.parse(jsonText);
      
      // Basic Salesforce asset validation
      if (!parsed.version) {
        newErrors.push({
          message: 'Missing required "version" field',
          severity: 'error'
        });
        valid = false;
      }

      if (!parsed.nodes) {
        newErrors.push({
          message: 'Missing required "nodes" field',
          severity: 'warning'
        });
      }

      // Check for deprecated functions
      const jsonString = JSON.stringify(parsed);
      if (jsonString.includes('like ')) {
        newErrors.push({
          message: 'Deprecated "like" operator found. Use startsWith, endsWith, or contains instead.',
          severity: 'warning'
        });
      }

      if (jsonString.includes('date_diff')) {
        newErrors.push({
          message: 'Deprecated "date_diff" function found. Use interval arithmetic instead.',
          severity: 'warning'
        });
      }

      if (jsonString.includes('fiscalMonthOffset') || jsonString.includes('firstDayOfWeek')) {
        newErrors.push({
          message: 'Date attributes should be defined in Data Prep Settings',
          severity: 'info'
        });
      }

    } catch (error) {
      valid = false;
      const errorMessage = error instanceof Error ? error.message : 'Invalid JSON format';
      
      // Extract line number from error message if possible
      const lineMatch = errorMessage.match(/line (\d+)/);
      const line = lineMatch ? parseInt(lineMatch[1]) : undefined;
      
      newErrors.push({
        line,
        message: errorMessage,
        severity: 'error'
      });
    }

    setErrors(newErrors);
    setIsValid(valid);
    onValidate?.(valid, newErrors);
  }, [onValidate]);

  const handleChange = (newValue: string) => {
    onChange(newValue);
    validateJSON(newValue);
    setFormatted(false);
  };

  const formatJSON = () => {
    try {
      const parsed = JSON.parse(value);
      const formatted = JSON.stringify(parsed, null, 2);
      onChange(formatted);
      setFormatted(true);
      validateJSON(formatted);
    } catch (error) {
      // JSON is invalid, cannot format
    }
  };

  const minifyJSON = () => {
    try {
      const parsed = JSON.parse(value);
      const minified = JSON.stringify(parsed);
      onChange(minified);
      setFormatted(false);
      validateJSON(minified);
    } catch (error) {
      // JSON is invalid, cannot minify
    }
  };

  const clearEditor = () => {
    onChange('');
    setErrors([]);
    setIsValid(true);
    setFormatted(false);
  };



  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {title}
            <Badge variant={isValid ? 'default' : 'destructive'}>
              {isValid ? 'Valid' : 'Invalid'}
            </Badge>
            {formatted && <Badge variant="outline">Formatted</Badge>}
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={formatJSON}
              disabled={!value.trim() || !isValid}
            >
              Format
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={minifyJSON}
              disabled={!value.trim() || !isValid}
            >
              Minify
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearEditor}
              disabled={!value.trim()}
            >
              Clear
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="editor" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          
          <TabsContent value="editor" className="space-y-4">
            <div className="relative">
              <div className="flex border rounded-lg overflow-hidden">
                {showLineNumbers && (
                  <div className="bg-gray-50 px-2 py-3 text-xs text-gray-500 select-none border-r">
                    {value.split('\n').map((_, index) => (
                      <div key={index} className="leading-6">
                        {index + 1}
                      </div>
                    ))}
                  </div>
                )}
                <textarea
                  value={value}
                  onChange={(e) => handleChange(e.target.value)}
                  placeholder={placeholder}
                  readOnly={readOnly}
                  className="flex-1 min-h-[400px] p-3 text-sm font-mono resize-none outline-none border-none"
                  spellCheck={false}
                />
              </div>
            </div>

            {errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-red-600">Validation Issues:</h4>
                {errors.map((error, index) => (
                  <Alert key={index} variant={error.severity === 'error' ? 'destructive' : 'default'}>
                    <AlertDescription>
                      {error.line && `Line ${error.line}: `}
                      {error.message}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="preview" className="space-y-4">
            <div className="border rounded-lg p-4 bg-gray-50 min-h-[400px]">
              {isValid && value.trim() ? (
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(JSON.parse(value), null, 2)}
                </pre>
              ) : (
                <div className="text-gray-500 text-center py-20">
                  {value.trim() ? 'Invalid JSON - cannot preview' : 'No content to preview'}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
          <span>
            {value.length} characters, {value.split('\n').length} lines
          </span>
          <span>
            {errors.length > 0 && `${errors.length} issue${errors.length > 1 ? 's' : ''} found`}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

interface SchemaField {
  name: string;
  type: string;
  required: boolean;
  description?: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fieldMatches: { [key: string]: boolean };
  coverage: number;
}

interface SchemaValidatorProps {
  assetData?: any;
  onValidationComplete?: (result: ValidationResult) => void;
}

export default function SchemaValidator({ 
  assetData, 
  onValidationComplete 
}: SchemaValidatorProps) {
  const [schema, setSchema] = useState('');
  const [csvData, setCsvData] = useState('');
  const [validationMode, setValidationMode] = useState<'schema' | 'csv'>('schema');
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [progress, setProgress] = useState(0);

  const sampleSchema = `{
  "fields": [
    {
      "name": "Id",
      "type": "string",
      "required": true,
      "description": "Unique identifier"
    },
    {
      "name": "Name",
      "type": "string",
      "required": true,
      "description": "Record name"
    },
    {
      "name": "CreatedDate",
      "type": "datetime",
      "required": true,
      "description": "Creation timestamp"
    },
    {
      "name": "Amount",
      "type": "number",
      "required": false,
      "description": "Monetary value"
    }
  ]
}`;

  const sampleCSV = `Id,Name,CreatedDate,Amount,Status
001,Sample Record 1,2023-01-01T10:00:00Z,1000,Active
002,Sample Record 2,2023-01-02T11:30:00Z,2000,Inactive
003,Sample Record 3,2023-01-03T09:15:00Z,1500,Active`;

  useEffect(() => {
    if (assetData && validationResult) {
      onValidationComplete?.(validationResult);
    }
  }, [assetData, validationResult, onValidationComplete]);

  const validateWithSchema = async (): Promise<ValidationResult> => {
    try {
      const schemaObj = JSON.parse(schema);
      const errors: string[] = [];
      const warnings: string[] = [];
      const fieldMatches: { [key: string]: boolean } = {};
      
      if (!schemaObj.fields || !Array.isArray(schemaObj.fields)) {
        errors.push('Schema must contain a "fields" array');
        return { isValid: false, errors, warnings, fieldMatches, coverage: 0 };
      }

      if (!assetData) {
        errors.push('No asset data provided for validation');
        return { isValid: false, errors, warnings, fieldMatches, coverage: 0 };
      }

      // Extract field references from asset nodes
      const assetFields = extractFieldsFromAsset(assetData);
      const schemaFields = schemaObj.fields.map((f: SchemaField) => f.name);
      
      let matchedFields = 0;
      
      // Check field matches
      schemaFields.forEach((schemaField: string) => {
        const isMatched = assetFields.includes(schemaField);
        fieldMatches[schemaField] = isMatched;
        if (isMatched) matchedFields++;
      });
      
      // Check for missing required fields
      schemaObj.fields.forEach((field: SchemaField) => {
        if (field.required && !fieldMatches[field.name]) {
          errors.push(`Required field "${field.name}" not found in asset`);
        }
      });
      
      // Check for extra fields in asset
      assetFields.forEach(assetField => {
        if (!schemaFields.includes(assetField)) {
          warnings.push(`Asset contains field "${assetField}" not defined in schema`);
        }
      });
      
      const coverage = schemaFields.length > 0 ? (matchedFields / schemaFields.length) * 100 : 0;
      
      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        fieldMatches,
        coverage
      };
      
    } catch (error) {
      return {
        isValid: false,
        errors: ['Invalid JSON schema format'],
        warnings: [],
        fieldMatches: {},
        coverage: 0
      };
    }
  };

  const validateWithCSV = async (): Promise<ValidationResult> => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const fieldMatches: { [key: string]: boolean } = {};
    
    if (!csvData.trim()) {
      errors.push('No CSV data provided');
      return { isValid: false, errors, warnings, fieldMatches, coverage: 0 };
    }

    const lines = csvData.trim().split('\n');
    if (lines.length < 2) {
      errors.push('CSV must contain at least a header row and one data row');
      return { isValid: false, errors, warnings, fieldMatches, coverage: 0 };
    }
    
    const headers = lines[0].split(',').map(h => h.trim());
    const assetFields = assetData ? extractFieldsFromAsset(assetData) : [];
    
    let matchedFields = 0;
    
    // Check field matches
    headers.forEach(header => {
      const isMatched = assetFields.includes(header);
      fieldMatches[header] = isMatched;
      if (isMatched) matchedFields++;
    });
    
    // Analyze data types
    if (lines.length > 1) {
      const sampleRow = lines[1].split(',').map(v => v.trim());
      headers.forEach((header, index) => {
        const value = sampleRow[index];
        if (value && !isNaN(Number(value))) {
          // Numeric field
          if (!assetFields.includes(header)) {
            warnings.push(`Numeric field "${header}" from CSV not used in asset`);
          }
        } else if (value && isDateString(value)) {
          // Date field
          warnings.push(`Date field "${header}" detected - ensure proper handling in asset`);
        }
      });
    }
    
    const coverage = headers.length > 0 ? (matchedFields / headers.length) * 100 : 0;
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      fieldMatches,
      coverage
    };
  };

  const extractFieldsFromAsset = (asset: any): string[] => {
    const fields: string[] = [];
    const assetString = JSON.stringify(asset);
    
    // Simple field extraction - in production this would be more sophisticated
    const fieldMatches = assetString.match(/["'](\w+)["']\s*:/g);
    if (fieldMatches) {
      fieldMatches.forEach(match => {
        const field = match.replace(/["':]/g, '').trim();
        if (!fields.includes(field) && !isSystemField(field)) {
          fields.push(field);
        }
      });
    }
    
    return fields;
  };

  const isSystemField = (field: string): boolean => {
    const systemFields = [
      'action', 'parameters', 'version', 'nodes', 'ui', 'label', 
      'description', 'x', 'y', 'source', 'target'
    ];
    return systemFields.includes(field);
  };

  const isDateString = (value: string): boolean => {
    return /^\d{4}-\d{2}-\d{2}/.test(value) || !isNaN(Date.parse(value));
  };

  const handleValidation = async () => {
    setIsValidating(true);
    setProgress(0);
    
    try {
      // Simulate validation progress
      const intervals = [20, 40, 60, 80, 100];
      for (let i = 0; i < intervals.length; i++) {
        setProgress(intervals[i]);
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      const result = validationMode === 'schema' 
        ? await validateWithSchema()
        : await validateWithCSV();
      
      setValidationResult(result);
      onValidationComplete?.(result);
      
    } catch (error) {
      setValidationResult({
        isValid: false,
        errors: ['Validation failed'],
        warnings: [],
        fieldMatches: {},
        coverage: 0
      });
    } finally {
      setIsValidating(false);
      setProgress(0);
    }
  };

  const loadSampleData = () => {
    if (validationMode === 'schema') {
      setSchema(sampleSchema);
    } else {
      setCsvData(sampleCSV);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Schema Validation</CardTitle>
            <Badge variant={assetData ? 'default' : 'secondary'}>
              {assetData ? 'Asset Loaded' : 'No Asset'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={validationMode} onValueChange={(v) => setValidationMode(v as 'schema' | 'csv')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="schema">JSON Schema</TabsTrigger>
              <TabsTrigger value="csv">CSV Data</TabsTrigger>
            </TabsList>
            
            <TabsContent value="schema" className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>JSON Schema</Label>
                  <Button size="sm" variant="outline" onClick={loadSampleData}>
                    Load Sample
                  </Button>
                </div>
                <Textarea
                  value={schema}
                  onChange={(e) => setSchema(e.target.value)}
                  placeholder="Paste your JSON schema here..."
                  className="min-h-[200px] font-mono text-sm"
                />
                <p className="text-xs text-gray-500">
                  Provide a JSON schema with a "fields" array containing field definitions
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="csv" className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>CSV Sample Data</Label>
                  <Button size="sm" variant="outline" onClick={loadSampleData}>
                    Load Sample
                  </Button>
                </div>
                <Textarea
                  value={csvData}
                  onChange={(e) => setCsvData(e.target.value)}
                  placeholder="Paste your CSV data here..."
                  className="min-h-[200px] font-mono text-sm"
                />
                <p className="text-xs text-gray-500">
                  Include header row and at least one sample data row
                </p>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="flex gap-4 mt-6">
            <Button 
              onClick={handleValidation}
              disabled={isValidating || (!schema.trim() && !csvData.trim()) || !assetData}
            >
              {isValidating ? 'Validating...' : 'Validate Against Asset'}
            </Button>
            
            {!assetData && (
              <Alert>
                <AlertDescription>
                  Load an asset first to enable validation
                </AlertDescription>
              </Alert>
            )}
          </div>
          
          {isValidating && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-gray-600">Analyzing schema compatibility...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Validation Results */}
      {validationResult && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Validation Results</CardTitle>
              <Badge variant={validationResult.isValid ? 'default' : 'destructive'}>
                {validationResult.isValid ? 'Valid' : 'Issues Found'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Coverage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Field Coverage</Label>
                <Badge variant="outline">{validationResult.coverage.toFixed(1)}%</Badge>
              </div>
              <Progress value={validationResult.coverage} className="w-full" />
            </div>
            
            {/* Field Matches */}
            <div className="space-y-2">
              <Label>Field Matches</Label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(validationResult.fieldMatches).map(([field, matched]) => (
                  <Badge
                    key={field}
                    variant={matched ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {field} {matched ? '✓' : '✗'}
                  </Badge>
                ))}
              </div>
            </div>
            
            {/* Errors */}
            {validationResult.errors.length > 0 && (
              <div className="space-y-2">
                <Label className="text-red-600">Errors</Label>
                {validationResult.errors.map((error, index) => (
                  <Alert key={index} variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ))}
              </div>
            )}
            
            {/* Warnings */}
            {validationResult.warnings.length > 0 && (
              <div className="space-y-2">
                <Label className="text-yellow-600">Warnings</Label>
                {validationResult.warnings.map((warning, index) => (
                  <Alert key={index}>
                    <AlertDescription>{warning}</AlertDescription>
                  </Alert>
                ))}
              </div>
            )}
            
            {/* Success Message */}
            {validationResult.isValid && validationResult.errors.length === 0 && (
              <Alert>
                <AlertDescription>
                  ✅ Schema validation passed! All required fields are present in the asset.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
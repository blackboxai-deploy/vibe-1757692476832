'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SUPPORTED_SAQL_FUNCTIONS, MULTIVALUE_FUNCTIONS } from '@/lib/constants';

interface SAQLQuery {
  select: string[];
  from: string;
  where: string[];
  groupBy: string[];
  orderBy: string[];
  limit?: number;
}

interface SAQLBuilderProps {
  onQueryChange?: (query: string) => void;
  onQueryValidate?: (isValid: boolean, errors: string[]) => void;
  initialQuery?: string;
}

export default function SAQLBuilder({
  onQueryChange,
  onQueryValidate,
  initialQuery = ''
}: SAQLBuilderProps) {
  const [query, setQuery] = useState<SAQLQuery>({
    select: ['*'],
    from: '',
    where: [],
    groupBy: [],
    orderBy: [],
    limit: undefined
  });
  
  const [rawQuery, setRawQuery] = useState(initialQuery);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isValid, setIsValid] = useState(true);


  const buildQuery = (): string => {
    let queryStr = '';
    
    // SELECT clause
    if (query.select.length > 0) {
      queryStr += `SELECT ${query.select.join(', ')}\n`;
    }
    
    // FROM clause
    if (query.from) {
      queryStr += `FROM ${query.from}\n`;
    }
    
    // WHERE clause
    if (query.where.length > 0) {
      queryStr += `WHERE ${query.where.join(' AND ')}\n`;
    }
    
    // GROUP BY clause
    if (query.groupBy.length > 0) {
      queryStr += `GROUP BY ${query.groupBy.join(', ')}\n`;
    }
    
    // ORDER BY clause
    if (query.orderBy.length > 0) {
      queryStr += `ORDER BY ${query.orderBy.join(', ')}\n`;
    }
    
    // LIMIT clause
    if (query.limit) {
      queryStr += `LIMIT ${query.limit}`;
    }
    
    return queryStr.trim();
  };

  const validateQuery = (queryText: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (!queryText.trim()) {
      return { isValid: true, errors: [] };
    }
    
    const lowerQuery = queryText.toLowerCase();
    
    // Check for required clauses
    if (!lowerQuery.includes('select')) {
      errors.push('Missing SELECT clause');
    }
    
    if (!lowerQuery.includes('from')) {
      errors.push('Missing FROM clause');
    }
    
    // Check for deprecated functions
    if (lowerQuery.includes('like ')) {
      errors.push('Deprecated "like" operator found. Use startsWith, endsWith, or contains instead.');
    }
    
    if (lowerQuery.includes('date_diff')) {
      errors.push('Deprecated "date_diff" function found. Use interval arithmetic instead.');
    }
    
    // Check for date part references
    const datePartPattern = /_(?:year|month|day|hour|minute|second|quarter|week)/i;
    if (datePartPattern.test(queryText)) {
      errors.push('Date part references found (e.g., CreatedDate_Month). Use functions like Year(), Month(), etc.');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const handleRawQueryChange = (value: string) => {
    setRawQuery(value);
    const validation = validateQuery(value);
    setValidationErrors(validation.errors);
    setIsValid(validation.isValid);
    
    onQueryChange?.(value);
    onQueryValidate?.(validation.isValid, validation.errors);
  };

  const handleBuilderChange = (field: keyof SAQLQuery, value: any) => {
    const newQuery = { ...query, [field]: value };
    setQuery(newQuery);
    
    const builtQuery = buildQuery();
    setRawQuery(builtQuery);
    handleRawQueryChange(builtQuery);
  };

  const addSelectField = () => {
    const newSelect = [...query.select, ''];
    handleBuilderChange('select', newSelect);
  };

  const updateSelectField = (index: number, value: string) => {
    const newSelect = [...query.select];
    newSelect[index] = value;
    handleBuilderChange('select', newSelect);
  };

  const removeSelectField = (index: number) => {
    if (query.select.length > 1) {
      const newSelect = query.select.filter((_, i) => i !== index);
      handleBuilderChange('select', newSelect);
    }
  };

  const addWhereCondition = () => {
    const newWhere = [...query.where, ''];
    handleBuilderChange('where', newWhere);
  };

  const updateWhereCondition = (index: number, value: string) => {
    const newWhere = [...query.where];
    newWhere[index] = value;
    handleBuilderChange('where', newWhere);
  };

  const removeWhereCondition = (index: number) => {
    const newWhere = query.where.filter((_, i) => i !== index);
    handleBuilderChange('where', newWhere);
  };

  const insertFunction = (functionName: string) => {
    const functions = {
      ...Object.keys(MULTIVALUE_FUNCTIONS).reduce((acc, key) => {
        acc[key] = MULTIVALUE_FUNCTIONS[key as keyof typeof MULTIVALUE_FUNCTIONS].syntax;
        return acc;
      }, {} as Record<string, string>),
      'Year': 'Year(field)',
      'Month': 'Month(field)',
      'Day': 'Day(field)',
      'startsWith': 'startsWith(field, "value")',
      'endsWith': 'endsWith(field, "value")',
      'contains': 'contains(field, "value")',
      'sum': 'sum(field)',
      'count': 'count(field)',
      'avg': 'avg(field)',
      'coalesce': 'coalesce(field1, field2)'
    };
    
    const functionSyntax = functions[functionName as keyof typeof functions] || `${functionName}()`;
    
    // Insert at cursor position in raw query
    const textarea = document.querySelector('textarea[data-testid="raw-query"]') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = rawQuery.substring(0, start) + functionSyntax + rawQuery.substring(end);
      handleRawQueryChange(newValue);
      
      // Restore cursor position
      setTimeout(() => {
        textarea.setSelectionRange(start + functionSyntax.length, start + functionSyntax.length);
        textarea.focus();
      }, 0);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>SAQL Query Builder</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="builder" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="builder">Visual Builder</TabsTrigger>
              <TabsTrigger value="raw">Raw Query</TabsTrigger>
              <TabsTrigger value="functions">Function Reference</TabsTrigger>
            </TabsList>
            
            <TabsContent value="builder" className="space-y-6">
              {/* SELECT Fields */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">SELECT Fields</Label>
                  <Button size="sm" variant="outline" onClick={addSelectField}>
                    Add Field
                  </Button>
                </div>
                {query.select.map((field, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={field}
                      onChange={(e) => updateSelectField(index, e.target.value)}
                      placeholder="Field name or expression"
                      className="flex-1"
                    />
                    {query.select.length > 1 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeSelectField(index)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {/* FROM */}
              <div className="space-y-2">
                <Label className="text-base font-medium">FROM Dataset</Label>
                <Input
                  value={query.from}
                  onChange={(e) => handleBuilderChange('from', e.target.value)}
                  placeholder="Dataset name"
                />
              </div>

              {/* WHERE Conditions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">WHERE Conditions</Label>
                  <Button size="sm" variant="outline" onClick={addWhereCondition}>
                    Add Condition
                  </Button>
                </div>
                {query.where.map((condition, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={condition}
                      onChange={(e) => updateWhereCondition(index, e.target.value)}
                      placeholder="condition (e.g., field = 'value')"
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeWhereCondition(index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>

              {/* GROUP BY */}
              <div className="space-y-2">
                <Label className="text-base font-medium">GROUP BY Fields</Label>
                <Input
                  value={query.groupBy.join(', ')}
                  onChange={(e) => handleBuilderChange('groupBy', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                  placeholder="field1, field2, ..."
                />
              </div>

              {/* ORDER BY */}
              <div className="space-y-2">
                <Label className="text-base font-medium">ORDER BY Fields</Label>
                <Input
                  value={query.orderBy.join(', ')}
                  onChange={(e) => handleBuilderChange('orderBy', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                  placeholder="field1 ASC, field2 DESC, ..."
                />
              </div>

              {/* LIMIT */}
              <div className="space-y-2">
                <Label className="text-base font-medium">LIMIT</Label>
                <Input
                  type="number"
                  value={query.limit || ''}
                  onChange={(e) => handleBuilderChange('limit', e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="Number of rows"
                />
              </div>
            </TabsContent>
            
            <TabsContent value="raw" className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">SAQL Query</Label>
                  <div className="flex items-center gap-2">
                    <Badge variant={isValid ? 'default' : 'destructive'}>
                      {isValid ? 'Valid' : 'Invalid'}
                    </Badge>
                    <Select onValueChange={insertFunction}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Insert function" />
                      </SelectTrigger>
                      <SelectContent>
                        {SUPPORTED_SAQL_FUNCTIONS.map(func => (
                          <SelectItem key={func} value={func}>{func}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Textarea
                  data-testid="raw-query"
                  value={rawQuery}
                  onChange={(e) => handleRawQueryChange(e.target.value)}
                  placeholder="Enter your SAQL query here..."
                  className="min-h-[300px] font-mono text-sm"
                />
              </div>

              {validationErrors.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-red-600">Validation Errors:</Label>
                  {validationErrors.map((error, index) => (
                    <Alert key={index} variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="functions" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Multivalue Functions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {Object.entries(MULTIVALUE_FUNCTIONS).map(([func, details]) => (
                      <div key={func} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">{func}</Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => insertFunction(func)}
                          >
                            Insert
                          </Button>
                        </div>
                        <p className="text-xs text-gray-600">{details.description}</p>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded block">
                          {details.example}
                        </code>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Date Functions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {['Year', 'Month', 'Day', 'Hour', 'Minute', 'Second'].map(func => (
                      <div key={func} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">{func}</Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => insertFunction(func)}
                          >
                            Insert
                          </Button>
                        </div>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded block">
                          {func}(DateField)
                        </code>
                      </div>
                    ))}
                    
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <h4 className="text-sm font-medium text-yellow-800 mb-2">Date Arithmetic</h4>
                      <div className="space-y-1 text-xs text-yellow-700">
                        <div><strong>Days between:</strong> EndDate - StartDate</div>
                        <div><strong>Hours between:</strong> (EndDateTime - StartDateTime) / interval 1 hours</div>
                        <div><strong>Add time:</strong> DateTimeField + interval 6 hours</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
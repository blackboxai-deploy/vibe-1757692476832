'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

import { Alert, AlertDescription } from '@/components/ui/alert';
import JSONEditor from '@/components/JSONEditor';
import SAQLBuilder from '@/components/SAQLBuilder';

interface RecipeTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  template: any;
}

export default function CreatePage() {
  const [creationMethod, setCreationMethod] = useState<'saql' | 'template' | 'data'>('saql');
  const [saqlQuery, setSaqlQuery] = useState('');
  const [dataSchema, setDataSchema] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [generatedRecipe, setGeneratedRecipe] = useState<any>(null);
  const [recipeName, setRecipeName] = useState('');
  const [recipeDescription, setRecipeDescription] = useState('');

  const templates: RecipeTemplate[] = [
    {
      id: 'basic-analytics',
      name: 'Basic Analytics Recipe',
      description: 'Simple data transformation with filters and aggregations',
      category: 'Analytics',
      template: {
        version: '56.0',
        nodes: {
          'source': {
            action: 'sfdcDigest',
            parameters: {
              object: 'Opportunity'
            }
          },
          'filter': {
            action: 'filter',
            parameters: {
              filterExpressions: []
            }
          },
          'aggregate': {
            action: 'aggregate',
            parameters: {
              groupings: [],
              measurements: []
            }
          }
        },
        ui: {
          nodes: {},
          connectors: []
        }
      }
    },
    {
      id: 'sales-pipeline',
      name: 'Sales Pipeline Analysis',
      description: 'Comprehensive sales pipeline analysis with stage tracking',
      category: 'Sales',
      template: {
        version: '56.0',
        nodes: {
          'opportunities': {
            action: 'sfdcDigest',
            parameters: {
              object: 'Opportunity'
            }
          },
          'accounts': {
            action: 'sfdcDigest',
            parameters: {
              object: 'Account'
            }
          },
          'join': {
            action: 'join',
            parameters: {
              joinType: 'INNER',
              leftKeys: ['AccountId'],
              rightKeys: ['Id']
            }
          }
        },
        ui: {
          nodes: {},
          connectors: []
        }
      }
    },
    {
      id: 'customer-360',
      name: 'Customer 360 View',
      description: 'Complete customer view with account, contact, and activity data',
      category: 'Customer',
      template: {
        version: '56.0',
        nodes: {
          'accounts': {
            action: 'sfdcDigest',
            parameters: {
              object: 'Account'
            }
          },
          'contacts': {
            action: 'sfdcDigest',
            parameters: {
              object: 'Contact'
            }
          },
          'activities': {
            action: 'sfdcDigest',
            parameters: {
              object: 'Task'
            }
          }
        },
        ui: {
          nodes: {},
          connectors: []
        }
      }
    }
  ];

  const handleSAQLGeneration = () => {
    if (!saqlQuery.trim()) return;
    
    // Mock recipe generation from SAQL
    const recipe = {
      version: '56.0',
      label: recipeName || 'Generated Recipe',
      description: recipeDescription || 'Auto-generated from SAQL query',
      nodes: generateNodesFromSAQL(saqlQuery),
      ui: {
        nodes: {},
        connectors: []
      }
    };
    
    setGeneratedRecipe(recipe);
  };

  const generateNodesFromSAQL = (saql: string) => {
    // Simple SAQL to nodes conversion
    const nodes: any = {};
    let nodeCounter = 1;
    
    // Extract FROM clause
    const fromMatch = saql.match(/from\s+(\w+)/i);
    if (fromMatch) {
      nodes[`source_${nodeCounter}`] = {
        action: 'sfdcDigest',
        parameters: {
          object: fromMatch[1]
        }
      };
      nodeCounter++;
    }
    
    // Extract WHERE clause
    if (saql.toLowerCase().includes('where')) {
      nodes[`filter_${nodeCounter}`] = {
        action: 'filter',
        parameters: {
          filterExpressions: [{
            type: 'TEXT',
            field: 'SampleField',
            operator: 'EQUAL',
            operands: ['SampleValue']
          }]
        }
      };
      nodeCounter++;
    }
    
    // Extract GROUP BY
    if (saql.toLowerCase().includes('group by')) {
      nodes[`aggregate_${nodeCounter}`] = {
        action: 'aggregate',
        parameters: {
          groupings: [{
            field: 'SampleGroupField',
            type: 'TEXT'
          }],
          measurements: [{
            field: 'count()',
            function: 'COUNT'
          }]
        }
      };
    }
    
    return nodes;
  };

  const handleTemplateSelection = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      const customizedTemplate = {
        ...template.template,
        label: recipeName || template.name,
        description: recipeDescription || template.description
      };
      setGeneratedRecipe(customizedTemplate);
    }
  };

  const handleDataSchemaGeneration = () => {
    if (!dataSchema.trim()) return;
    
    try {
      const schema = JSON.parse(dataSchema);
      
      // Generate recipe based on data schema
      const recipe = {
        version: '56.0',
        label: recipeName || 'Schema-based Recipe',
        description: recipeDescription || 'Generated from data schema',
        nodes: generateNodesFromSchema(schema),
        ui: {
          nodes: {},
          connectors: []
        }
      };
      
      setGeneratedRecipe(recipe);
    } catch (error) {
      console.error('Invalid schema JSON:', error);
    }
  };

  const generateNodesFromSchema = (schema: any) => {
    const nodes: any = {};
    
    // Basic source node
    nodes['source_1'] = {
      action: 'csvDigest',
      parameters: {
        file: 'sample-data.csv'
      }
    };
    
    // Generate transformations based on schema fields
    if (schema.fields && Array.isArray(schema.fields)) {
      const dateFields = schema.fields.filter((f: any) => f.type === 'date');
      const numericFields = schema.fields.filter((f: any) => f.type === 'number');
      
      if (dateFields.length > 0) {
        nodes['date_transform'] = {
          action: 'computeExpression',
          parameters: {
            expressions: dateFields.map((field: any) => ({
              name: `${field.name}_Year`,
              saqlExpression: `Year(${field.name})`
            }))
          }
        };
      }
      
      if (numericFields.length > 0) {
        nodes['aggregation'] = {
          action: 'aggregate',
          parameters: {
            measurements: numericFields.map((field: any) => ({
              field: field.name,
              function: 'SUM'
            }))
          }
        };
      }
    }
    
    return nodes;
  };

  const downloadRecipe = () => {
    if (!generatedRecipe) return;
    
    const blob = new Blob([JSON.stringify(generatedRecipe, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${recipeName || 'recipe'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Create New Recipe
        </h1>
        <p className="text-gray-600">
          Generate optimized recipes from SAQL queries, templates, or data schemas
        </p>
      </div>

      {/* Recipe Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Recipe Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="recipe-name">Recipe Name</Label>
              <Input
                id="recipe-name"
                value={recipeName}
                onChange={(e) => setRecipeName(e.target.value)}
                placeholder="Enter recipe name"
              />
            </div>
            <div>
              <Label htmlFor="recipe-description">Description</Label>
              <Input
                id="recipe-description"
                value={recipeDescription}
                onChange={(e) => setRecipeDescription(e.target.value)}
                placeholder="Enter recipe description"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Creation Method Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Creation Method</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant={creationMethod === 'saql' ? 'default' : 'outline'}
              onClick={() => setCreationMethod('saql')}
              className="h-20"
            >
              <div className="text-center">
                <div className="font-medium">From SAQL</div>
                <div className="text-xs text-gray-500">Convert SAQL queries</div>
              </div>
            </Button>
            
            <Button
              variant={creationMethod === 'template' ? 'default' : 'outline'}
              onClick={() => setCreationMethod('template')}
              className="h-20"
            >
              <div className="text-center">
                <div className="font-medium">From Template</div>
                <div className="text-xs text-gray-500">Use predefined templates</div>
              </div>
            </Button>
            
            <Button
              variant={creationMethod === 'data' ? 'default' : 'outline'}
              onClick={() => setCreationMethod('data')}
              className="h-20"
            >
              <div className="text-center">
                <div className="font-medium">From Data Schema</div>
                <div className="text-xs text-gray-500">Based on data structure</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Creation Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Input</CardTitle>
          </CardHeader>
          <CardContent>
            {creationMethod === 'saql' && (
              <div className="space-y-4">
                <SAQLBuilder
                  onQueryChange={setSaqlQuery}
                  initialQuery={saqlQuery}
                />
                <Button onClick={handleSAQLGeneration} className="w-full">
                  Generate Recipe from SAQL
                </Button>
              </div>
            )}

            {creationMethod === 'template' && (
              <div className="space-y-4">
                <Label>Select Template</Label>
                <Select onValueChange={handleTemplateSelection}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className="text-left">
                          <div className="font-medium">{template.name}</div>
                          <div className="text-xs text-gray-500">{template.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {selectedTemplate && (
                  <Alert>
                    <AlertDescription>
                      Template selected! You can customize the recipe name and description above.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {creationMethod === 'data' && (
              <div className="space-y-4">
                <Label>Data Schema (JSON)</Label>
                <Textarea
                  value={dataSchema}
                  onChange={(e) => setDataSchema(e.target.value)}
                  placeholder="Paste your data schema or sample data here..."
                  className="min-h-[200px] font-mono text-sm"
                />
                <Button onClick={handleDataSchemaGeneration} className="w-full">
                  Generate Recipe from Schema
                </Button>
                
                <Alert>
                  <AlertDescription>
                    <strong>Expected format:</strong> JSON schema with fields array containing field names and types.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Output Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Generated Recipe
              {generatedRecipe && (
                <Button size="sm" onClick={downloadRecipe}>
                  Download
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {generatedRecipe ? (
              <div className="space-y-4">
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="default">Generated</Badge>
                  <Badge variant="outline">Version {generatedRecipe.version}</Badge>
                  <Badge variant="secondary">
                    {Object.keys(generatedRecipe.nodes).length} nodes
                  </Badge>
                </div>
                
                <JSONEditor
                  value={JSON.stringify(generatedRecipe, null, 2)}
                  onChange={() => {}} // Read-only for now
                  readOnly={true}
                  title="Generated Recipe"
                />
              </div>
            ) : (
              <div className="text-center py-20 text-gray-500">
                <p className="mb-2">No recipe generated yet</p>
                <p className="text-sm">Select a creation method and generate your recipe</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recipe Templates Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Available Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map(template => (
              <Card key={template.id} className="border">
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{template.category}</Badge>
                    </div>
                    <h4 className="font-medium text-sm">{template.name}</h4>
                    <p className="text-xs text-gray-600">{template.description}</p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleTemplateSelection(template.id)}
                      className="w-full"
                    >
                      Use Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
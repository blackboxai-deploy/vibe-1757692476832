'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface AssetUploaderProps {
  onAssetUploaded: (asset: any, fileName?: string) => void;
  onSchemaUploaded?: (schema: any, fileName?: string) => void;
  acceptedTypes?: string[];
}

export function AssetUploader({ 
  onAssetUploaded, 
  onSchemaUploaded, 
  acceptedTypes = ['.json', '.txt'] 
}: AssetUploaderProps) {
  const [jsonContent, setJsonContent] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files) as File[];
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, []);

  const handleFileUpload = async (file: File) => {
    if (!acceptedTypes.some(type => file.name.toLowerCase().endsWith(type.replace('.', '')))) {
      setUploadStatus({
        type: 'error',
        message: `File type not supported. Please upload: ${acceptedTypes.join(', ')}`
      });
      return;
    }

    try {
      const content = await file.text();
      const parsedContent = JSON.parse(content);
      
      // Detect if it's a schema file
      const isSchema = file.name.toLowerCase().includes('schema') || 
                      parsedContent.hasOwnProperty('fields') ||
                      parsedContent.hasOwnProperty('$schema');

      if (isSchema && onSchemaUploaded) {
        onSchemaUploaded(parsedContent, file.name);
        setUploadStatus({
          type: 'success',
          message: `Schema uploaded successfully: ${file.name}`
        });
      } else {
        onAssetUploaded(parsedContent, file.name);
        setUploadStatus({
          type: 'success',
          message: `Asset uploaded successfully: ${file.name}`
        });
      }

      // Update textarea if it's the main asset
      if (!isSchema) {
        setJsonContent(JSON.stringify(parsedContent, null, 2));
      }

    } catch (error) {
      setUploadStatus({
        type: 'error',
        message: `Error parsing JSON: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handlePasteContent = () => {
    if (!jsonContent.trim()) {
      setUploadStatus({
        type: 'error',
        message: 'Please enter JSON content to process'
      });
      return;
    }

    try {
      const parsedContent = JSON.parse(jsonContent);
      onAssetUploaded(parsedContent);
      setUploadStatus({
        type: 'success',
        message: 'JSON content processed successfully'
      });
    } catch (error) {
      setUploadStatus({
        type: 'error',
        message: `Invalid JSON format: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  };

  const loadSampleAsset = (type: 'recipe' | 'dataflow') => {
    const samples = {
      recipe: {
        version: "58.0",
        nodes: {
          "SOURCE_0": {
            action: "sfdcDigest",
            parameters: {
              object: "Account",
              fields: [
                { name: "Id" },
                { name: "Name" },
                { name: "Industry" },
                { name: "AnnualRevenue" }
              ]
            }
          },
          "TRANSFORM_0": {
            action: "computeExpression",
            parameters: {
              source: "SOURCE_0",
              mergeWithSource: true,
              computedFields: [
                {
                  name: "RevenueCategory",
                  saqlExpression: "case when 'AnnualRevenue' > 1000000 then \"Large\" when 'AnnualRevenue' > 100000 then \"Medium\" else \"Small\" end"
                }
              ]
            }
          }
        },
        ui: {
          nodes: {
            "SOURCE_0": { x: 100, y: 100 },
            "TRANSFORM_0": { x: 300, y: 100 }
          }
        }
      },
      dataflow: {
        version: "58.0",
        nodes: [
          {
            action: "sfdcDigest",
            parameters: {
              object: "Opportunity",
              fields: [
                { name: "Id" },
                { name: "Name" },
                { name: "Amount" },
                { name: "CloseDate" },
                { name: "StageName" }
              ]
            }
          },
          {
            action: "sfdcRegister",
            parameters: {
              source: "0",
              alias: "OpportunityDataset",
              name: "Opportunity Analysis"
            }
          }
        ]
      }
    };

    const sample = samples[type];
    setJsonContent(JSON.stringify(sample, null, 2));
    setUploadStatus({
      type: 'info',
      message: `Sample ${type} loaded. Click "Process JSON" to continue.`
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload or Paste Asset</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upload">File Upload</TabsTrigger>
              <TabsTrigger value="paste">Paste JSON</TabsTrigger>
              <TabsTrigger value="sample">Sample Data</TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-4">
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="space-y-4">
                  <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                    <div className="w-8 h-8 bg-gray-400 rounded"></div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Drop files here or click to upload
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Supports: {acceptedTypes.join(', ')} files
                    </p>
                    <input
                      type="file"
                      accept={acceptedTypes.join(',')}
                      onChange={handleFileInputChange}
                      className="hidden"
                      id="file-upload"
                    />
                    <Label htmlFor="file-upload">
                      <Button variant="outline" className="cursor-pointer">
                        Choose File
                      </Button>
                    </Label>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="paste" className="space-y-4">
              <div>
                <Label htmlFor="json-content">JSON Content</Label>
                <Textarea
                  id="json-content"
                  placeholder="Paste your JSON asset here..."
                  value={jsonContent}
                  onChange={(e) => setJsonContent(e.target.value)}
                  className="min-h-[300px] font-mono text-sm"
                />
              </div>
              <Button onClick={handlePasteContent} className="w-full">
                Process JSON
              </Button>
            </TabsContent>

            <TabsContent value="sample" className="space-y-4">
              <div className="text-center space-y-4">
                <p className="text-sm text-gray-600 mb-4">
                  Load sample assets to test the platform capabilities
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => loadSampleAsset('recipe')}>
                    <CardContent className="p-4 text-center">
                      <Badge className="mb-2">Recipe</Badge>
                      <h4 className="font-medium mb-2">Sample Recipe</h4>
                      <p className="text-xs text-gray-500">Account data with computed revenue categories</p>
                    </CardContent>
                  </Card>
                  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => loadSampleAsset('dataflow')}>
                    <CardContent className="p-4 text-center">
                      <Badge variant="outline" className="mb-2">Dataflow</Badge>
                      <h4 className="font-medium mb-2">Sample Dataflow</h4>
                      <p className="text-xs text-gray-500">Opportunity analysis dataflow</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {uploadStatus && (
            <Alert className={`mt-4 ${
              uploadStatus.type === 'error' ? 'border-red-200 bg-red-50' : 
              uploadStatus.type === 'success' ? 'border-green-200 bg-green-50' :
              'border-blue-200 bg-blue-50'
            }`}>
              <AlertDescription className={
                uploadStatus.type === 'error' ? 'text-red-800' : 
                uploadStatus.type === 'success' ? 'text-green-800' :
                'text-blue-800'
              }>
                {uploadStatus.message}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {onSchemaUploaded && (
        <Card>
          <CardHeader>
            <CardTitle>Optional: Schema Validation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Upload a schema file or CSV data sample to validate your asset structure and field mappings.
            </p>
            <input
              type="file"
              accept=".json,.csv,.txt"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
              className="hidden"
              id="schema-upload"
            />
            <Label htmlFor="schema-upload">
              <Button variant="outline" className="cursor-pointer">
                Upload Schema/CSV Sample
              </Button>
            </Label>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


export interface DiffChange {
  type: 'add' | 'remove' | 'modify';
  path: string;
  oldValue?: any;
  newValue?: any;
  description: string;
  severity?: 'info' | 'warning' | 'error';
}

interface DiffViewerProps {
  changes: DiffChange[];
  originalData?: any;
  modifiedData?: any;
  title?: string;
  onApplyChanges?: () => void;
  onRejectChanges?: () => void;
  showActions?: boolean;
}

export default function DiffViewer({
  changes,
  originalData,
  modifiedData,
  title = 'Changes Preview',
  onApplyChanges,
  onRejectChanges,
  showActions = true
}: DiffViewerProps) {
  
  const formatValue = (value: any): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return `"${value}"`;
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value, null, 2);
      } catch {
        return '[Complex Object]';
      }
    }
    return String(value);
  };

  const getChangeIcon = (type: DiffChange['type']) => {
    switch (type) {
      case 'add':
        return <span className="text-green-600 font-bold">+</span>;
      case 'remove':
        return <span className="text-red-600 font-bold">-</span>;
      case 'modify':
        return <span className="text-blue-600 font-bold">~</span>;
      default:
        return null;
    }
  };

  const getChangeBadgeVariant = (type: DiffChange['type']) => {
    switch (type) {
      case 'add':
        return 'default' as const;
      case 'remove':
        return 'destructive' as const;
      case 'modify':
        return 'secondary' as const;
      default:
        return 'outline' as const;
    }
  };

  const getSeverityColor = (severity?: string) => {
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

  const groupedChanges = changes.reduce((acc, change) => {
    const key = change.type;
    if (!acc[key]) acc[key] = [];
    acc[key].push(change);
    return acc;
  }, {} as Record<string, DiffChange[]>);

  const totalChanges = changes.length;
  const addCount = groupedChanges.add?.length || 0;
  const removeCount = groupedChanges.remove?.length || 0;
  const modifyCount = groupedChanges.modify?.length || 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle>{title}</CardTitle>
            <Badge variant="outline">{totalChanges} changes</Badge>
          </div>
          
          {showActions && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onRejectChanges}
                disabled={totalChanges === 0}
              >
                Reject All
              </Button>
              <Button
                size="sm"
                onClick={onApplyChanges}
                disabled={totalChanges === 0}
              >
                Apply Changes
              </Button>
            </div>
          )}
        </div>
        
        {totalChanges > 0 && (
          <div className="flex gap-4 text-sm">
            {addCount > 0 && (
              <span className="text-green-600">+{addCount} additions</span>
            )}
            {modifyCount > 0 && (
              <span className="text-blue-600">~{modifyCount} modifications</span>
            )}
            {removeCount > 0 && (
              <span className="text-red-600">-{removeCount} deletions</span>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        {totalChanges === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No changes to display
          </div>
        ) : (
          <Tabs defaultValue="changes" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="changes">Changes</TabsTrigger>
              <TabsTrigger value="before">Before</TabsTrigger>
              <TabsTrigger value="after">After</TabsTrigger>
            </TabsList>
            
            <TabsContent value="changes" className="space-y-4 mt-4">
              <div className="space-y-3">
                {changes.map((change, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 ${getSeverityColor(change.severity)}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {getChangeIcon(change.type)}
                        <Badge variant={getChangeBadgeVariant(change.type)} className="text-xs">
                          {change.type}
                        </Badge>
                        <span className="font-medium text-sm">{change.path}</span>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <p className="text-sm text-gray-700 mb-3">{change.description}</p>
                      
                      {change.type === 'modify' && (
                        <div className="space-y-2">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <div className="text-xs font-medium text-red-600 mb-1">Before:</div>
                              <div className="bg-red-50 border border-red-200 rounded p-2 text-xs font-mono">
                                {formatValue(change.oldValue)}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs font-medium text-green-600 mb-1">After:</div>
                              <div className="bg-green-50 border border-green-200 rounded p-2 text-xs font-mono">
                                {formatValue(change.newValue)}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {change.type === 'add' && (
                        <div>
                          <div className="text-xs font-medium text-green-600 mb-1">Added:</div>
                          <div className="bg-green-50 border border-green-200 rounded p-2 text-xs font-mono">
                            {formatValue(change.newValue)}
                          </div>
                        </div>
                      )}
                      
                      {change.type === 'remove' && (
                        <div>
                          <div className="text-xs font-medium text-red-600 mb-1">Removed:</div>
                          <div className="bg-red-50 border border-red-200 rounded p-2 text-xs font-mono">
                            {formatValue(change.oldValue)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="before" className="mt-4">
              <div className="border rounded-lg">
                <div className="bg-gray-50 px-3 py-2 border-b">
                  <span className="text-sm font-medium">Original Asset</span>
                </div>
                <div className="p-4">
                  {originalData ? (
                    <pre className="text-xs overflow-auto max-h-96">
                      {JSON.stringify(originalData, null, 2)}
                    </pre>
                  ) : (
                    <div className="text-gray-500 text-center py-8">
                      No original data available
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="after" className="mt-4">
              <div className="border rounded-lg">
                <div className="bg-gray-50 px-3 py-2 border-b">
                  <span className="text-sm font-medium">Modified Asset</span>
                </div>
                <div className="p-4">
                  {modifiedData ? (
                    <pre className="text-xs overflow-auto max-h-96">
                      {JSON.stringify(modifiedData, null, 2)}
                    </pre>
                  ) : (
                    <div className="text-gray-500 text-center py-8">
                      No modified data available
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
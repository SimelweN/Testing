import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Clock, Search, RefreshCw } from "lucide-react";
import { EdgeFunctionDebugger, EdgeFunctionDiagnostic } from "@/utils/edgeFunctionDebugger";

export default function EdgeFunctionDebugPanel() {
  const [diagnostics, setDiagnostics] = useState<EdgeFunctionDiagnostic[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    try {
      const debugger = new EdgeFunctionDebugger();
      const results = await debugger.diagnoseAllFunctions();
      setDiagnostics(results);
    } catch (error) {
      console.error('Failed to run diagnostics:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'not_found':
        return <Search className="h-4 w-4 text-orange-500" />;
      case 'timeout':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      success: 'default',
      error: 'destructive',
      not_found: 'secondary',
      timeout: 'outline'
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Edge Function Diagnostics
          </CardTitle>
          <CardDescription>
            Advanced debugging tool to diagnose edge function failures with detailed HTTP responses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={runDiagnostics}
            disabled={isRunning}
            className="mb-4"
          >
            {isRunning ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Running Diagnostics...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Run Enhanced Diagnostics
              </>
            )}
          </Button>

          {diagnostics.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Results</h3>
                <div className="text-sm text-muted-foreground">
                  {diagnostics.filter(d => d.status === 'success').length} / {diagnostics.length} working
                </div>
              </div>

              <div className="grid gap-4">
                {diagnostics.map((diagnostic, index) => (
                  <Card key={index} className="border-l-4" style={{
                    borderLeftColor: diagnostic.status === 'success' ? '#10b981' : 
                                   diagnostic.status === 'error' ? '#ef4444' :
                                   diagnostic.status === 'not_found' ? '#f59e0b' : '#6b7280'
                  }}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          {getStatusIcon(diagnostic.status)}
                          {diagnostic.functionName}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(diagnostic.status)}
                          <Badge variant="outline">{diagnostic.timing.toFixed(0)}ms</Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-sm">
                        <div className="font-medium text-muted-foreground">URL:</div>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {diagnostic.url}
                        </code>
                      </div>

                      {diagnostic.httpStatus && (
                        <div className="text-sm">
                          <div className="font-medium text-muted-foreground">HTTP Status:</div>
                          <div className="flex items-center gap-2">
                            <Badge variant={diagnostic.httpStatus >= 400 ? "destructive" : "default"}>
                              {diagnostic.httpStatus}
                            </Badge>
                            <span className="text-muted-foreground">{diagnostic.httpStatusText}</span>
                          </div>
                        </div>
                      )}

                      {diagnostic.error && (
                        <div className="text-sm space-y-2">
                          <div className="font-medium text-red-600">Error Details:</div>
                          <div className="bg-red-50 border border-red-200 rounded p-3 space-y-1">
                            <div><strong>Message:</strong> {diagnostic.error.message}</div>
                            {diagnostic.error.details && (
                              <div><strong>Details:</strong> {diagnostic.error.details}</div>
                            )}
                            {diagnostic.error.name && (
                              <div><strong>Type:</strong> {diagnostic.error.name}</div>
                            )}
                          </div>
                        </div>
                      )}

                      {diagnostic.response && diagnostic.status === 'success' && (
                        <div className="text-sm">
                          <div className="font-medium text-green-600">Response:</div>
                          <pre className="bg-green-50 border border-green-200 rounded p-3 text-xs overflow-auto">
                            {JSON.stringify(diagnostic.response, null, 2)}
                          </pre>
                        </div>
                      )}

                      {diagnostic.response && diagnostic.status === 'error' && (
                        <div className="text-sm">
                          <div className="font-medium text-red-600">Error Response:</div>
                          <pre className="bg-red-50 border border-red-200 rounded p-3 text-xs overflow-auto">
                            {typeof diagnostic.response === 'string' 
                              ? diagnostic.response 
                              : JSON.stringify(diagnostic.response, null, 2)}
                          </pre>
                        </div>
                      )}

                      {diagnostic.headers && Object.keys(diagnostic.headers).length > 0 && (
                        <details className="text-sm">
                          <summary className="font-medium text-muted-foreground cursor-pointer">
                            Response Headers ({Object.keys(diagnostic.headers).length})
                          </summary>
                          <pre className="bg-muted rounded p-3 text-xs mt-2 overflow-auto">
                            {JSON.stringify(diagnostic.headers, null, 2)}
                          </pre>
                        </details>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
import React, { useState } from "react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { AlertCircle, CheckCircle, Loader2, Zap } from "lucide-react";

interface TestResult {
  success: boolean;
  data?: any;
  error?: string;
  duration?: number;
}

const EdgeFunctionTestButton: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  const testEdgeFunction = async () => {
    setIsLoading(true);
    setResult(null);

    const startTime = Date.now();

    try {
      const response = await fetch("/api/test-edge", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const duration = Date.now() - startTime;

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      setResult({
        success: true,
        data,
        duration,
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      setResult({
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        duration,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Vercel Edge Function Tester
          </CardTitle>
          <CardDescription>
            Test your Vercel edge functions to ensure they're working correctly
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={testEdgeFunction}
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Testing Edge Function...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Test Edge Function
              </>
            )}
          </Button>

          {result && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {result.success ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span className="font-medium">
                    {result.success ? "Test Successful" : "Test Failed"}
                  </span>
                </div>
                <Badge variant={result.success ? "default" : "destructive"}>
                  {result.duration}ms
                </Badge>
              </div>

              {result.success && result.data && (
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <h4 className="font-semibold text-sm mb-2">Response Data:</h4>
                  <pre className="text-xs overflow-x-auto text-gray-700 dark:text-gray-300">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>
              )}

              {!result.success && result.error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <h4 className="font-semibold text-sm mb-2 text-red-700 dark:text-red-300">
                    Error Details:
                  </h4>
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {result.error}
                  </p>
                </div>
              )}

              <div className="text-xs text-gray-500 space-y-1">
                <p>
                  <strong>Endpoint:</strong> /api/test-edge
                </p>
                <p>
                  <strong>Runtime:</strong> Edge
                </p>
                <p>
                  <strong>Method:</strong> GET
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EdgeFunctionTestButton;

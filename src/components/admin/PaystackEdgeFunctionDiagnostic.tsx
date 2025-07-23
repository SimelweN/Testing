import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  TestTube,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
} from "lucide-react";

interface FunctionTestResult {
  name: string;
  status: "success" | "error" | "warning";
  message: string;
  response?: any;
  error?: string;
  timing?: number;
}

const PaystackEdgeFunctionDiagnostic: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<FunctionTestResult[]>([]);

  const paystackFunctions = [
    "initialize-paystack-payment",
    "verify-paystack-payment",
    "paystack-split-management",
    // "paystack-transfer-management", - removed - no automated transfers
    "manage-paystack-subaccount",
    "paystack-refund-management",
  ];

  const testFunction = async (
    functionName: string,
  ): Promise<FunctionTestResult> => {
    const startTime = performance.now();

    try {
      console.log(`🔧 Testing ${functionName}...`);

      // Try health check via query parameter first
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { health: true },
      });

      const timing = performance.now() - startTime;

      if (error) {
        return {
          name: functionName,
          status: "error",
          message: `Failed: ${error.message}`,
          error: error.message,
          timing,
        };
      }

      if (data?.success && data?.service) {
        return {
          name: functionName,
          status: "success",
          message: `Health check passed (${data.service})`,
          response: data,
          timing,
        };
      }

      return {
        name: functionName,
        status: "warning",
        message: "Responded but unexpected format",
        response: data,
        timing,
      };
    } catch (error) {
      const timing = performance.now() - startTime;
      return {
        name: functionName,
        status: "error",
        message: `Exception: ${error.message}`,
        error: error.message,
        timing,
      };
    }
  };

  const runDiagnostic = async () => {
    setIsRunning(true);
    setResults([]);

    try {
      console.log("🔍 Starting Paystack Edge Function diagnostic...");
      toast.info("Testing Paystack Edge Functions...");

      const testResults: FunctionTestResult[] = [];

      for (const functionName of paystackFunctions) {
        const result = await testFunction(functionName);
        testResults.push(result);
        setResults([...testResults]); // Update UI progressively
      }

      const successCount = testResults.filter(
        (r) => r.status === "success",
      ).length;
      const errorCount = testResults.filter((r) => r.status === "error").length;

      if (errorCount === 0) {
        toast.success(`✅ All ${successCount} Edge Functions are working!`);
      } else {
        toast.error(`❌ ${errorCount} Edge Functions are failing`);
      }
    } catch (error) {
      console.error("Diagnostic error:", error);
      toast.error(`Diagnostic failed: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: FunctionTestResult["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <TestTube className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: FunctionTestResult["status"]) => {
    const variants = {
      success: "bg-green-100 text-green-800",
      error: "bg-red-100 text-red-800",
      warning: "bg-yellow-100 text-yellow-800",
    };

    return <Badge className={variants[status]}>{status.toUpperCase()}</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Paystack Edge Function Diagnostic
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-blue-200 bg-blue-50">
            <AlertTriangle className="h-4 w-4 text-blue-600" />
            <AlertDescription>
              <strong>Edge Function Health Check</strong>
              <p className="text-sm mt-1">
                This tool tests connectivity to all Paystack-related Edge
                Functions. All functions must be working for payment processing
                to function properly.
              </p>
            </AlertDescription>
          </Alert>

          <Button
            onClick={runDiagnostic}
            disabled={isRunning}
            className="w-full"
          >
            {isRunning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing Functions...
              </>
            ) : (
              <>
                <TestTube className="mr-2 h-4 w-4" />
                Run Edge Function Diagnostic
              </>
            )}
          </Button>

          {results.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold">Test Results:</h4>

              {results.map((result, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(result.status)}
                    <div>
                      <p className="font-medium">{result.name}</p>
                      <p className="text-sm text-gray-600">{result.message}</p>
                      {result.timing && (
                        <p className="text-xs text-gray-500">
                          {Math.round(result.timing)}ms
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(result.status)}
                  </div>
                </div>
              ))}

              {!isRunning && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h5 className="font-semibold mb-2">Summary:</h5>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {results.filter((r) => r.status === "success").length}
                      </div>
                      <div>Working</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {results.filter((r) => r.status === "error").length}
                      </div>
                      <div>Failed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">
                        {results.filter((r) => r.status === "warning").length}
                      </div>
                      <div>Warnings</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <Alert className="border-gray-200 bg-gray-50">
            <AlertDescription>
              <strong>If functions are failing:</strong>
              <ul className="list-disc ml-6 mt-2 space-y-1 text-sm">
                <li>Check that Edge Functions are deployed to Supabase</li>
                <li>Verify environment variables are configured</li>
                <li>Check Supabase project logs for deployment errors</li>
                <li>
                  Ensure PAYSTACK_SECRET_KEY is set in Edge Function environment
                </li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaystackEdgeFunctionDiagnostic;

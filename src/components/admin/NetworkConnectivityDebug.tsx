import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/lib/supabase";
import { ENV } from "@/config/environment";
import { CheckCircle, XCircle, AlertTriangle, Wifi, Globe, Database } from "lucide-react";
import { toast } from "sonner";

interface TestResult {
  name: string;
  status: "success" | "error" | "warning";
  message: string;
  details?: any;
}

export default function NetworkConnectivityDebug() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);

  const runConnectivityTests = async () => {
    setTesting(true);
    setResults([]);
    const testResults: TestResult[] = [];

    // Test 1: Environment Variables
    try {
      if (!ENV.VITE_SUPABASE_URL || !ENV.VITE_SUPABASE_ANON_KEY) {
        testResults.push({
          name: "Environment Variables",
          status: "error",
          message: "Missing Supabase environment variables",
          details: {
            url: ENV.VITE_SUPABASE_URL ? "✓ Set" : "✗ Missing",
            key: ENV.VITE_SUPABASE_ANON_KEY ? "✓ Set" : "✗ Missing"
          }
        });
      } else {
        testResults.push({
          name: "Environment Variables",
          status: "success",
          message: "All required environment variables are set",
          details: {
            url: ENV.VITE_SUPABASE_URL.substring(0, 30) + "...",
            key: ENV.VITE_SUPABASE_ANON_KEY.substring(0, 30) + "..."
          }
        });
      }
    } catch (error) {
      testResults.push({
        name: "Environment Variables",
        status: "error",
        message: "Error checking environment variables",
        details: error
      });
    }
    setResults([...testResults]);

    // Test 2: Basic Fetch Test
    try {
      const response = await fetch(ENV.VITE_SUPABASE_URL + "/rest/v1/", {
        method: "HEAD",
        headers: {
          "apikey": ENV.VITE_SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${ENV.VITE_SUPABASE_ANON_KEY}`
        }
      });

      if (response.ok) {
        testResults.push({
          name: "Supabase API Reachability",
          status: "success",
          message: "Supabase API is reachable",
          details: {
            status: response.status,
            headers: Object.fromEntries(response.headers.entries())
          }
        });
      } else {
        testResults.push({
          name: "Supabase API Reachability",
          status: "error",
          message: `API returned status ${response.status}`,
          details: {
            status: response.status,
            statusText: response.statusText
          }
        });
      }
    } catch (error) {
      testResults.push({
        name: "Supabase API Reachability",
        status: "error",
        message: "Failed to reach Supabase API",
        details: error
      });
    }
    setResults([...testResults]);

    // Test 3: Supabase Client Auth Check
    try {
      const { data: session, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        testResults.push({
          name: "Supabase Auth Session",
          status: "warning",
          message: "Auth session error (may be normal if not logged in)",
          details: sessionError
        });
      } else {
        testResults.push({
          name: "Supabase Auth Session",
          status: "success",
          message: session?.session ? "User authenticated" : "No active session (normal)",
          details: {
            hasSession: !!session?.session,
            user: session?.session?.user?.email || "Not logged in"
          }
        });
      }
    } catch (error) {
      testResults.push({
        name: "Supabase Auth Session",
        status: "error",
        message: "Error checking auth session",
        details: error
      });
    }
    setResults([...testResults]);

    // Test 4: Database Query Test
    try {
      const { data, error, count } = await supabase
        .from("profiles")
        .select("id", { count: "exact" })
        .limit(1);

      if (error) {
        testResults.push({
          name: "Database Query Test",
          status: "error",
          message: "Database query failed",
          details: {
            error: error.message,
            code: error.code,
            hint: error.hint,
            details: error.details
          }
        });
      } else {
        testResults.push({
          name: "Database Query Test",
          status: "success",
          message: `Database query successful (${count || 0} total profiles)`,
          details: {
            recordCount: count,
            sampleData: data
          }
        });
      }
    } catch (error) {
      testResults.push({
        name: "Database Query Test",
        status: "error",
        message: "Exception during database query",
        details: error
      });
    }
    setResults([...testResults]);

        // Test 5: CORS and Headers Test
    try {
      // Use a simpler endpoint that's more likely to exist
      const corsTestUrl = ENV.VITE_SUPABASE_URL + "/rest/v1/";
      const corsResponse = await fetch(corsTestUrl, {
        method: "HEAD",
        headers: {
          "apikey": ENV.VITE_SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${ENV.VITE_SUPABASE_ANON_KEY}`
        }
      });

      if (corsResponse.ok) {
        testResults.push({
          name: "CORS and Headers",
          status: "success",
          message: "CORS and headers working correctly",
          details: {
            status: corsResponse.status,
            corsHeaders: {
              "access-control-allow-origin": corsResponse.headers.get("access-control-allow-origin"),
              "access-control-allow-methods": corsResponse.headers.get("access-control-allow-methods")
            }
          }
        });
      } else if (corsResponse.status === 404) {
        testResults.push({
          name: "CORS and Headers",
          status: "warning",
          message: "Database schema issue - tables may not exist",
          details: {
            status: corsResponse.status,
            explanation: "404 usually means tables haven't been created or wrong schema",
            suggestion: "Check if Supabase database is properly set up"
          }
        });
      } else {
        testResults.push({
          name: "CORS and Headers",
          status: "error",
          message: `CORS test failed with status ${corsResponse.status}`,
          details: {
            status: corsResponse.status,
            statusText: corsResponse.statusText,
            explanation: corsResponse.status === 401 ? "Authentication issue" : "Unknown error"
          }
        });
      }
    } catch (error) {
      testResults.push({
        name: "CORS and Headers",
        status: "error",
        message: "CORS test failed with network error",
        details: error
      });
    }
        setResults([...testResults]);

    // Test 6: API Endpoints Deployment Check
    try {
      // Test a few key API endpoints to see if they're deployed
      const apiEndpoints = [
        "/api/create-order",
        "/api/initialize-paystack-payment",
        "/api/auto-expire-commits"
      ];

      let workingEndpoints = 0;
      let totalEndpoints = apiEndpoints.length;
      const endpointResults: string[] = [];

      for (const endpoint of apiEndpoints) {
        try {
          const response = await fetch(endpoint, {
            method: "OPTIONS", // Use OPTIONS to avoid triggering the actual function
          });

          if (response.status !== 404) {
            workingEndpoints++;
            endpointResults.push(`✅ ${endpoint}: ${response.status}`);
          } else {
            endpointResults.push(`❌ ${endpoint}: 404 Not Found`);
          }
        } catch {
          endpointResults.push(`❌ ${endpoint}: Network Error`);
        }
      }

      if (workingEndpoints === totalEndpoints) {
        testResults.push({
          name: "API Endpoints Deployment",
          status: "success",
          message: `All ${totalEndpoints} API endpoints are accessible`,
          details: {
            workingEndpoints,
            totalEndpoints,
            endpointResults
          }
        });
      } else if (workingEndpoints > 0) {
        testResults.push({
          name: "API Endpoints Deployment",
          status: "warning",
          message: `${workingEndpoints}/${totalEndpoints} API endpoints are accessible`,
          details: {
            workingEndpoints,
            totalEndpoints,
            endpointResults,
            suggestion: "Some API functions may not be deployed properly"
          }
        });
      } else {
        testResults.push({
          name: "API Endpoints Deployment",
          status: "error",
          message: "No API endpoints are accessible - deployment issue",
          details: {
            workingEndpoints,
            totalEndpoints,
            endpointResults,
            explanation: "This appears to be a Fly.dev deployment, but /api functions are designed for Vercel",
            solution: "Use Mock Mode in API Testing or deploy functions to Supabase Edge Functions"
          }
        });
      }
    } catch (error) {
      testResults.push({
        name: "API Endpoints Deployment",
        status: "error",
        message: "Failed to test API endpoints",
        details: error
      });
    }
    setResults([...testResults]);

    setTesting(false);
    
    const successCount = testResults.filter(r => r.status === "success").length;
    const errorCount = testResults.filter(r => r.status === "error").length;
    
    if (errorCount === 0) {
      toast.success(`All ${successCount} connectivity tests passed!`);
    } else {
      toast.error(`${errorCount} tests failed, ${successCount} passed`);
    }
  };

  const getStatusIcon = (status: "success" | "error" | "warning") => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: "success" | "error" | "warning") => {
    const variants = {
      success: "default",
      error: "destructive",
      warning: "secondary"
    } as const;
    
    return <Badge variant={variants[status]}>{status.toUpperCase()}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wifi className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Network Connectivity Debug</h3>
        </div>
        <Button onClick={runConnectivityTests} disabled={testing}>
          <Globe className="h-4 w-4 mr-2" />
          {testing ? "Testing..." : "Run Connectivity Tests"}
        </Button>
      </div>

      {results.length > 0 && (
        <div className="space-y-3">
          {results.map((result, index) => (
            <Card key={index} className={`border-l-4 ${
              result.status === "success" ? "border-l-green-500" : 
              result.status === "error" ? "border-l-red-500" : "border-l-yellow-500"
            }`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(result.status)}
                    <CardTitle className="text-base">{result.name}</CardTitle>
                  </div>
                  {getStatusBadge(result.status)}
                </div>
                <CardDescription>{result.message}</CardDescription>
              </CardHeader>
              {result.details && (
                <CardContent className="pt-0">
                  <details className="text-xs">
                    <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                      View Details
                    </summary>
                    <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </details>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {results.length === 0 && !testing && (
        <Alert>
          <Database className="h-4 w-4" />
          <AlertDescription>
            Run the connectivity tests to diagnose potential network or configuration issues.
            This will help identify why profile fetching is failing.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

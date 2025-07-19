import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  TestTube,
  Settings,
  Activity,
  Database,
  CreditCard,
  Server,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PAYSTACK_CONFIG } from "@/config/paystack";
import PaystackSystemTestComponent from "@/components/admin/PaystackSystemTestComponent";

interface ConfigCheck {
  name: string;
  status: "success" | "error" | "warning" | "info";
  message: string;
  details?: any;
}

const PaystackVerification: React.FC = () => {
  const [configChecks, setConfigChecks] = useState<ConfigCheck[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  useEffect(() => {
    runConfigurationCheck();
  }, []);

  const runConfigurationCheck = async () => {
    setIsLoading(true);
    const checks: ConfigCheck[] = [];

    // 1. Environment Variables Check
    const envVars = {
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
      supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      paystackPublicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
      nodeEnv: import.meta.env.NODE_ENV,
    };

    const missingEnvVars = [];
    if (!envVars.supabaseUrl) missingEnvVars.push("VITE_SUPABASE_URL");
    if (!envVars.supabaseAnonKey) missingEnvVars.push("VITE_SUPABASE_ANON_KEY");
    if (!envVars.paystackPublicKey)
      missingEnvVars.push("VITE_PAYSTACK_PUBLIC_KEY");

    if (missingEnvVars.length > 0) {
      checks.push({
        name: "Environment Variables",
        status: "error",
        message: `Missing: ${missingEnvVars.join(", ")}`,
        details: { missing: missingEnvVars, env: envVars },
      });
    } else {
      checks.push({
        name: "Environment Variables",
        status: "success",
        message: "All required environment variables configured",
        details: envVars,
      });
    }

    // 2. Paystack Configuration Check
    try {
      const paystackConfig = {
        isConfigured: PAYSTACK_CONFIG.isConfigured(),
        isTestMode: PAYSTACK_CONFIG.isTestMode(),
        isLiveMode: PAYSTACK_CONFIG.isLiveMode(),
        publicKey: PAYSTACK_CONFIG.getPublicKey(),
      };

      if (!paystackConfig.isConfigured) {
        checks.push({
          name: "Paystack Configuration",
          status: "warning",
          message:
            "Using development fallback - Paystack not properly configured",
          details: paystackConfig,
        });
      } else if (paystackConfig.isTestMode) {
        checks.push({
          name: "Paystack Configuration",
          status: "info",
          message: "Configured in TEST mode",
          details: paystackConfig,
        });
      } else if (paystackConfig.isLiveMode) {
        checks.push({
          name: "Paystack Configuration",
          status: "success",
          message: "Configured in LIVE mode",
          details: paystackConfig,
        });
      }
    } catch (error) {
      checks.push({
        name: "Paystack Configuration",
        status: "error",
        message: `Configuration error: ${error.message}`,
      });
    }

    // 3. Database Connectivity Check
    try {
      const { data, error } = await supabase
        .from("books")
        .select("count")
        .limit(1);
      if (error) throw error;

      checks.push({
        name: "Database Connectivity",
        status: "success",
        message: "Supabase database connection successful",
        details: { result: data },
      });
    } catch (error) {
      checks.push({
        name: "Database Connectivity",
        status: "error",
        message: `Database connection failed: ${error.message}`,
      });
    }

    // 4. Edge Functions Availability Check
    const edgeFunctions = [
      "paystack-split-management",
      "paystack-transfer-management",
      "manage-paystack-subaccount",
      "paystack-refund-management",
    ];

    let functionalFunctions = 0;
    for (const funcName of edgeFunctions) {
      try {
        const { data, error } = await supabase.functions.invoke(funcName, {
          body: { health: true },
          method: "GET",
        });

        if (!error && (data?.success || data?.service || data?.data)) {
          functionalFunctions++;
        }
      } catch (error) {
        // Function not available or error
      }
    }

    if (functionalFunctions === edgeFunctions.length) {
      checks.push({
        name: "Edge Functions",
        status: "success",
        message: `All ${edgeFunctions.length} Paystack edge functions are operational`,
        details: { functions: edgeFunctions, operational: functionalFunctions },
      });
    } else if (functionalFunctions > 0) {
      checks.push({
        name: "Edge Functions",
        status: "warning",
        message: `${functionalFunctions}/${edgeFunctions.length} edge functions operational`,
        details: { functions: edgeFunctions, operational: functionalFunctions },
      });
    } else {
      checks.push({
        name: "Edge Functions",
        status: "error",
        message: "Edge functions not responding - check deployment",
        details: { functions: edgeFunctions, operational: functionalFunctions },
      });
    }

    // 5. Paystack API Connectivity Check
    try {
      const { data, error } = await supabase.functions.invoke(
        "paystack-transfer-management",
        {
          body: { action: "banks" },
          method: "GET",
        },
      );

      if (!error && data?.success) {
        checks.push({
          name: "Paystack API",
          status: "success",
          message: "Paystack API connectivity verified",
          details: data,
        });
      } else {
        checks.push({
          name: "Paystack API",
          status: "warning",
          message: "Paystack API response unexpected - may need configuration",
          details: { data, error },
        });
      }
    } catch (error) {
      checks.push({
        name: "Paystack API",
        status: "error",
        message: `Paystack API connectivity failed: ${error.message}`,
      });
    }

    setConfigChecks(checks);
    setLastChecked(new Date());
    setIsLoading(false);

    // Show summary toast
    const successCount = checks.filter((c) => c.status === "success").length;
    const errorCount = checks.filter((c) => c.status === "error").length;

    if (errorCount === 0) {
      toast.success(
        `✅ System check passed: ${successCount}/${checks.length} components healthy`,
      );
    } else {
      toast.error(
        `❌ System check found issues: ${errorCount} errors detected`,
      );
    }
  };

  const getStatusIcon = (status: ConfigCheck["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case "info":
        return <Activity className="h-4 w-4 text-blue-600" />;
      default:
        return <TestTube className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: ConfigCheck["status"]) => {
    const variants = {
      success: "bg-green-100 text-green-800",
      error: "bg-red-100 text-red-800",
      warning: "bg-yellow-100 text-yellow-800",
      info: "bg-blue-100 text-blue-800",
    };

    return (
      <Badge className={variants[status] || "bg-gray-100 text-gray-800"}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const getCategoryIcon = (name: string) => {
    if (name.includes("Environment")) return <Settings className="h-4 w-4" />;
    if (name.includes("Paystack")) return <CreditCard className="h-4 w-4" />;
    if (name.includes("Database")) return <Database className="h-4 w-4" />;
    if (name.includes("Edge")) return <Server className="h-4 w-4" />;
    if (name.includes("API")) return <Zap className="h-4 w-4" />;
    return <TestTube className="h-4 w-4" />;
  };

  const successCount = configChecks.filter(
    (c) => c.status === "success",
  ).length;
  const errorCount = configChecks.filter((c) => c.status === "error").length;
  const warningCount = configChecks.filter(
    (c) => c.status === "warning",
  ).length;
  const totalChecks = configChecks.length;

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Paystack System Verification</h1>
        <p className="text-gray-600 mt-2">
          Comprehensive verification of Paystack configuration, connectivity,
          and functionality
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">System Overview</TabsTrigger>
          <TabsTrigger value="tests">Functionality Tests</TabsTrigger>
          <TabsTrigger value="config">Configuration Details</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Quick Status */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  System Status
                </CardTitle>
                <Button
                  onClick={runConfigurationCheck}
                  disabled={isLoading}
                  variant="outline"
                  size="sm"
                >
                  {isLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Refresh
                </Button>
              </div>
              {lastChecked && (
                <p className="text-sm text-gray-600">
                  Last checked: {lastChecked.toLocaleString()}
                </p>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {successCount}
                  </div>
                  <div className="text-sm text-green-700">Passed</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {warningCount}
                  </div>
                  <div className="text-sm text-yellow-700">Warnings</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {errorCount}
                  </div>
                  <div className="text-sm text-red-700">Errors</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {totalChecks}
                  </div>
                  <div className="text-sm text-blue-700">Total Checks</div>
                </div>
              </div>

              <div className="space-y-3">
                {configChecks.map((check, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {getCategoryIcon(check.name)}
                      {getStatusIcon(check.status)}
                      <div>
                        <div className="font-medium">{check.name}</div>
                        <div className="text-sm text-gray-600">
                          {check.message}
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(check.status)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Overall Status Alert */}
          <Alert
            className={
              errorCount > 0
                ? "border-red-200 bg-red-50"
                : successCount === totalChecks
                  ? "border-green-200 bg-green-50"
                  : "border-yellow-200 bg-yellow-50"
            }
          >
            {errorCount > 0 ? (
              <XCircle className="h-4 w-4 text-red-600" />
            ) : successCount === totalChecks ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            )}
            <AlertDescription>
              {errorCount > 0 && (
                <div>
                  <strong>System Issues Detected:</strong> {errorCount} critical
                  error(s) found. Paystack functionality may not work properly.
                  Please resolve these issues before proceeding.
                </div>
              )}
              {errorCount === 0 && warningCount > 0 && (
                <div>
                  <strong>Configuration Warnings:</strong> {warningCount}{" "}
                  warning(s) detected. System is functional but some features
                  may be limited.
                </div>
              )}
              {successCount === totalChecks && (
                <div>
                  <strong>System Healthy:</strong> All configuration checks
                  passed! Paystack system is properly configured and ready for
                  use.
                </div>
              )}
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="tests">
          <PaystackSystemTestComponent />
        </TabsContent>

        <TabsContent value="config" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuration Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {configChecks.map(
                  (check, index) =>
                    check.details && (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusIcon(check.status)}
                          <h3 className="font-medium">{check.name}</h3>
                          {getStatusBadge(check.status)}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {check.message}
                        </p>
                        <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">
                          {JSON.stringify(check.details, null, 2)}
                        </pre>
                      </div>
                    ),
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PaystackVerification;

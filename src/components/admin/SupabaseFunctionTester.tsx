import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Play,
  PlayCircle,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Database,
  DollarSign,
  Truck,
  Mail,
  RefreshCw,
  Zap,
  Shield,
  TestTube,
  Download,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import RLSPolicyTester from "./RLSPolicyTester";
import FunctionTestingGuide from "./FunctionTestingGuide";

interface FunctionTest {
  name: string;
  category:
    | "orders"
    | "payments"
    | "shipping"
    | "communication"
    | "database"
    | "system";
  description: string;
  endpoint: string;
  method: "POST" | "GET";
  requiresAuth: boolean;
  requiresAdmin: boolean;
  testPayload?: Record<string, any>;
  expectedStatus: number;
  icon: React.ComponentType<any>;
}

interface TestResult {
  name: string;
  status: "pending" | "success" | "error" | "warning";
  statusCode?: number;
  responseTime?: number;
  error?: string;
  response?: any;
  timestamp: Date;
}

const SUPABASE_FUNCTIONS: FunctionTest[] = [
  // Order & Commerce Management
  {
    name: "auto-expire-commits",
    category: "orders",
    description: "Auto-expires orders pending seller commitment after 48 hours",
    endpoint: "auto-expire-commits",
    method: "POST",
    requiresAuth: false,
    requiresAdmin: true,
    expectedStatus: 200,
    icon: Clock,
  },
  {
    name: "check-expired-orders",
    category: "orders",
    description: "Comprehensive expiry checking for all order types",
    endpoint: "check-expired-orders",
    method: "POST",
    requiresAuth: false,
    requiresAdmin: true,
    expectedStatus: 200,
    icon: AlertTriangle,
  },
  {
    name: "commit-to-sale",
    category: "orders",
    description: "Seller commits to fulfill an order",
    endpoint: "commit-to-sale",
    method: "POST",
    requiresAuth: true,
    requiresAdmin: false,
    testPayload: { commitmentId: "test-commit-id" },
    expectedStatus: 200,
    icon: CheckCircle,
  },
  {
    name: "decline-commit",
    category: "orders",
    description: "Seller declines order, triggers refund",
    endpoint: "decline-commit",
    method: "POST",
    requiresAuth: true,
    requiresAdmin: false,
    testPayload: { commitmentId: "test-commit-id", reason: "Test decline" },
    expectedStatus: 200,
    icon: XCircle,
  },
  {
    name: "create-order",
    category: "orders",
    description: "Creates orders from successful payments",
    endpoint: "create-order",
    method: "POST",
    requiresAuth: true,
    requiresAdmin: false,
    testPayload: { paymentReference: "test-ref" },
    expectedStatus: 200,
    icon: Database,
  },
  {
    name: "mark-collected",
    category: "orders",
    description: "Updates order status when courier collects",
    endpoint: "mark-collected",
    method: "POST",
    requiresAuth: true,
    requiresAdmin: false,
    testPayload: { orderId: "test-order-id" },
    expectedStatus: 200,
    icon: Truck,
  },

  // Payment Processing
  {
    name: "initialize-paystack-payment",
    category: "payments",
    description: "Initialize Paystack payments with splits",
    endpoint: "initialize-paystack-payment",
    method: "POST",
    requiresAuth: true,
    requiresAdmin: false,
    testPayload: {
      items: [{ bookId: "test-book", sellerId: "test-seller", amount: 100 }],
      shippingFee: 50,
    },
    expectedStatus: 200,
    icon: DollarSign,
  },
  {
    name: "verify-paystack-payment",
    category: "payments",
    description: "Verify payment status and create orders",
    endpoint: "verify-paystack-payment",
    method: "POST",
    requiresAuth: true,
    requiresAdmin: false,
    testPayload: { reference: "test-payment-ref" },
    expectedStatus: 200,
    icon: Shield,
  },
  {
    name: "paystack-webhook",
    category: "payments",
    description: "Handle Paystack webhooks",
    endpoint: "paystack-webhook",
    method: "POST",
    requiresAuth: false,
    requiresAdmin: false,
    testPayload: { event: "charge.success", data: { reference: "test" } },
    expectedStatus: 200,
    icon: Zap,
  },
  {
    name: "pay-seller",
    category: "payments",
    description: "Process seller payouts",
    endpoint: "pay-seller",
    method: "POST",
    requiresAuth: false,
    requiresAdmin: true,
    testPayload: { sellerId: "test-seller", amount: 100 },
    expectedStatus: 200,
    icon: DollarSign,
  },
  {
    name: "create-paystack-subaccount",
    category: "payments",
    description: "Create/update seller banking subaccounts",
    endpoint: "create-paystack-subaccount",
    method: "POST",
    requiresAuth: true,
    requiresAdmin: false,
    testPayload: {
      business_name: "Test Business",
      bank_code: "044",
      account_number: "0123456789",
    },
    expectedStatus: 200,
    icon: Database,
  },

  // Shipping & Delivery
  {
    name: "get-delivery-quotes",
    category: "shipping",
    description: "Get unified delivery quotes",
    endpoint: "get-delivery-quotes",
    method: "POST",
    requiresAuth: true,
    requiresAdmin: false,
    testPayload: {
      fromAddress: { city: "Cape Town", province: "Western Cape" },
      toAddress: { city: "Johannesburg", province: "Gauteng" },
      parcelDetails: { weight: 1, length: 20, width: 15, height: 5 },
    },
    expectedStatus: 200,
    icon: Truck,
  },
  {
    name: "courier-guy-quote",
    category: "shipping",
    description: "Get Courier Guy shipping quotes",
    endpoint: "courier-guy-quote",
    method: "POST",
    requiresAuth: true,
    requiresAdmin: false,
    testPayload: {
      fromAddress: { city: "Cape Town" },
      toAddress: { city: "Johannesburg" },
      parcelDetails: { weight: 1 },
    },
    expectedStatus: 200,
    icon: Truck,
  },
  {
    name: "fastway-quote",
    category: "shipping",
    description: "Get Fastway shipping quotes",
    endpoint: "fastway-quote",
    method: "POST",
    requiresAuth: true,
    requiresAdmin: false,
    testPayload: {
      fromAddress: { suburb: "Cape Town" },
      toAddress: { suburb: "Johannesburg" },
      parcelDetails: { weight: 1 },
    },
    expectedStatus: 200,
    icon: Truck,
  },

  // Communication
  {
    name: "send-email",
    category: "communication",
    description: "Send emails using Brevo SMTP",
    endpoint: "send-email",
    method: "POST",
    requiresAuth: false,
    requiresAdmin: false,
    testPayload: {
      to: "test@example.com",
      subject: "Test Email",
      templateName: "test",
      templateData: { name: "Test User" },
    },
    expectedStatus: 200,
    icon: Mail,
  },
  {
    name: "process-order-reminders",
    category: "communication",
    description: "Send automated reminder emails",
    endpoint: "process-order-reminders",
    method: "POST",
    requiresAuth: false,
    requiresAdmin: true,
    expectedStatus: 200,
    icon: RefreshCw,
  },

  // Database Functions
  {
    name: "is_admin",
    category: "database",
    description: "Check if user has admin privileges",
    endpoint: "",
    method: "POST",
    requiresAuth: true,
    requiresAdmin: false,
    expectedStatus: 200,
    icon: Shield,
  },
  {
    name: "generate_api_key",
    category: "database",
    description: "Generate API key for user",
    endpoint: "",
    method: "POST",
    requiresAuth: true,
    requiresAdmin: false,
    expectedStatus: 200,
    icon: Database,
  },
];

const categoryIcons = {
  orders: Database,
  payments: DollarSign,
  shipping: Truck,
  communication: Mail,
  database: Database,
  system: Zap,
};

const categoryColors = {
  orders: "bg-blue-100 text-blue-800",
  payments: "bg-green-100 text-green-800",
  shipping: "bg-orange-100 text-orange-800",
  communication: "bg-purple-100 text-purple-800",
  database: "bg-gray-100 text-gray-800",
  system: "bg-red-100 text-red-800",
};

const SupabaseFunctionTester = () => {
  const { user, isAdmin } = useAuth();
  const [testResults, setTestResults] = useState<Record<string, TestResult>>(
    {},
  );
  const [isTestingAll, setIsTestingAll] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [customPayload, setCustomPayload] = useState<string>("{}");
  const [testingFunction, setTestingFunction] = useState<string | null>(null);

  const getSupabaseUrl = useCallback(() => {
    const url = import.meta.env.VITE_SUPABASE_URL;
    if (!url) {
      throw new Error("VITE_SUPABASE_URL not configured");
    }
    return url.replace(/\/$/, ""); // Remove trailing slash
  }, []);

  const testFunction = useCallback(
    async (func: FunctionTest, customData?: any) => {
      if (!user && func.requiresAuth) {
        toast.error("Authentication required for this function");
        return;
      }

      if (func.requiresAdmin && !isAdmin) {
        toast.error("Admin privileges required for this function");
        return;
      }

      setTestingFunction(func.name);

      const startTime = Date.now();

      // Initialize result as pending
      setTestResults((prev) => ({
        ...prev,
        [func.name]: {
          name: func.name,
          status: "pending",
          timestamp: new Date(),
        },
      }));

      try {
        let response;
        const payload = customData || func.testPayload || {};

        if (func.category === "database") {
          // Test database functions via RPC
          if (func.name === "is_admin") {
            response = await supabase.rpc("is_admin", { user_id: user?.id });
          } else if (func.name === "generate_api_key") {
            response = await supabase.rpc("generate_api_key", {
              user_id: user?.id,
            });
          } else {
            throw new Error(
              `Database function ${func.name} not implemented in tester`,
            );
          }

          const responseTime = Date.now() - startTime;

          setTestResults((prev) => ({
            ...prev,
            [func.name]: {
              name: func.name,
              status: response.error ? "error" : "success",
              statusCode: response.error ? 400 : 200,
              responseTime,
              error: response.error?.message,
              response: response.data,
              timestamp: new Date(),
            },
          }));
        } else {
          // Test edge functions
          const url = `${getSupabaseUrl()}/functions/v1/${func.endpoint}`;
          const headers: Record<string, string> = {
            "Content-Type": "application/json",
          };

          if (func.requiresAuth && user) {
            const {
              data: { session },
            } = await supabase.auth.getSession();
            if (session?.access_token) {
              headers["Authorization"] = `Bearer ${session.access_token}`;
            }
          }

          const fetchResponse = await fetch(url, {
            method: func.method,
            headers,
            body: func.method === "POST" ? JSON.stringify(payload) : undefined,
          });

          const responseTime = Date.now() - startTime;
          let responseData;

                    const responseClone = fetchResponse.clone();
          try {
            responseData = await fetchResponse.json();
          } catch {
            try {
              responseData = await responseClone.text();
            } catch {
              responseData = { error: "Failed to read response" };
            }
          }

          const status = fetchResponse.ok
            ? "success"
            : fetchResponse.status >= 400 && fetchResponse.status < 500
              ? "warning"
              : "error";

          setTestResults((prev) => ({
            ...prev,
            [func.name]: {
              name: func.name,
              status,
              statusCode: fetchResponse.status,
              responseTime,
              error: !fetchResponse.ok
                ? `HTTP ${fetchResponse.status}: ${JSON.stringify(responseData)}`
                : undefined,
              response: responseData,
              timestamp: new Date(),
            },
          }));
        }
      } catch (error) {
        const responseTime = Date.now() - startTime;

        setTestResults((prev) => ({
          ...prev,
          [func.name]: {
            name: func.name,
            status: "error",
            responseTime,
            error: error instanceof Error ? error.message : String(error),
            timestamp: new Date(),
          },
        }));
      } finally {
        setTestingFunction(null);
      }
    },
    [user, isAdmin, getSupabaseUrl],
  );

  const testAllFunctions = useCallback(async () => {
    setIsTestingAll(true);
    toast.info("Starting comprehensive function tests...");

    const functionsToTest =
      selectedCategory === "all"
        ? SUPABASE_FUNCTIONS
        : SUPABASE_FUNCTIONS.filter((f) => f.category === selectedCategory);

    for (const func of functionsToTest) {
      await testFunction(func);
      // Small delay between tests to prevent overwhelming the server
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    setIsTestingAll(false);
    toast.success(`Completed testing ${functionsToTest.length} functions`);
  }, [selectedCategory, testFunction]);

  const exportResults = useCallback(() => {
    const results = Object.values(testResults);
    const summary = {
      timestamp: new Date().toISOString(),
      totalTests: results.length,
      successful: results.filter((r) => r.status === "success").length,
      failed: results.filter((r) => r.status === "error").length,
      warnings: results.filter((r) => r.status === "warning").length,
      averageResponseTime:
        results.reduce((acc, r) => acc + (r.responseTime || 0), 0) /
        results.length,
      results: results,
    };

    const blob = new Blob([JSON.stringify(summary, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `supabase-function-test-results-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [testResults]);

  const getStatusIcon = (status: TestResult["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case "pending":
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const filteredFunctions =
    selectedCategory === "all"
      ? SUPABASE_FUNCTIONS
      : SUPABASE_FUNCTIONS.filter((f) => f.category === selectedCategory);

  const categories = Array.from(
    new Set(SUPABASE_FUNCTIONS.map((f) => f.category)),
  );
  const results = Object.values(testResults);
  const successCount = results.filter((r) => r.status === "success").length;
  const errorCount = results.filter((r) => r.status === "error").length;
  const warningCount = results.filter((r) => r.status === "warning").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <TestTube className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold">Supabase Function Tester</h2>
        </div>

        <div className="flex items-center space-x-2">
          {results.length > 0 && (
            <Button variant="outline" onClick={exportResults} size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Results
            </Button>
          )}
          <Button onClick={testAllFunctions} disabled={isTestingAll} size="sm">
            {isTestingAll ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <PlayCircle className="h-4 w-4 mr-2" />
            )}
            Test All Functions
          </Button>
        </div>
      </div>

      {/* Test Summary */}
      {results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Successful</p>
                  <p className="text-2xl font-bold text-green-600">
                    {successCount}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm text-gray-600">Warnings</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {warningCount}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-sm text-gray-600">Failed</p>
                  <p className="text-2xl font-bold text-red-600">
                    {errorCount}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Avg Response</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {results.length > 0
                      ? Math.round(
                          results.reduce(
                            (acc, r) => acc + (r.responseTime || 0),
                            0,
                          ) / results.length,
                        )
                      : 0}
                    ms
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="functions" className="w-full">
        <TabsList>
          <TabsTrigger value="functions">Function Tests</TabsTrigger>
          <TabsTrigger value="rls">RLS Policies</TabsTrigger>
          <TabsTrigger value="custom">Custom Test</TabsTrigger>
          <TabsTrigger value="results">Results History</TabsTrigger>
          <TabsTrigger value="guide">Testing Guide</TabsTrigger>
        </TabsList>

        <TabsContent value="functions" className="space-y-4">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 items-center">
            <Label>Filter by category:</Label>
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("all")}
            >
              All ({SUPABASE_FUNCTIONS.length})
            </Button>
            {categories.map((category) => {
              const count = SUPABASE_FUNCTIONS.filter(
                (f) => f.category === category,
              ).length;
              const CategoryIcon =
                categoryIcons[category as keyof typeof categoryIcons];
              return (
                <Button
                  key={category}
                  variant={
                    selectedCategory === category ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="capitalize"
                >
                  <CategoryIcon className="h-3 w-3 mr-1" />
                  {category} ({count})
                </Button>
              );
            })}
          </div>

          {/* Function Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredFunctions.map((func) => {
              const result = testResults[func.name];
              const Icon = func.icon;
              const isCurrentlyTesting = testingFunction === func.name;

              return (
                <Card
                  key={func.name}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Icon className="h-5 w-5 text-blue-600" />
                        <CardTitle className="text-lg">{func.name}</CardTitle>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge
                          className={categoryColors[func.category]}
                          variant="secondary"
                        >
                          {func.category}
                        </Badge>
                        {result && getStatusIcon(result.status)}
                      </div>
                    </div>
                    <CardDescription className="text-sm">
                      {func.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-2 text-xs">
                      <Badge variant="outline">{func.method}</Badge>
                      {func.requiresAuth && (
                        <Badge variant="outline">Auth Required</Badge>
                      )}
                      {func.requiresAdmin && (
                        <Badge variant="outline">Admin Only</Badge>
                      )}
                    </div>

                    {result && (
                      <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Status: {result.statusCode}</span>
                          <span>Time: {result.responseTime}ms</span>
                        </div>

                        {result.error && (
                          <div className="text-red-600 text-xs font-mono bg-red-50 p-2 rounded">
                            {result.error}
                          </div>
                        )}

                        {result.response && (
                          <div className="text-green-600 text-xs font-mono bg-green-50 p-2 rounded max-h-20 overflow-y-auto">
                            {typeof result.response === "object"
                              ? JSON.stringify(result.response, null, 2)
                              : String(result.response)}
                          </div>
                        )}
                      </div>
                    )}

                    <Button
                      onClick={() => testFunction(func)}
                      disabled={isCurrentlyTesting || isTestingAll}
                      size="sm"
                      className="w-full"
                    >
                      {isCurrentlyTesting ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4 mr-2" />
                      )}
                      Test Function
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="rls" className="space-y-4">
          <RLSPolicyTester />
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Custom Function Test</CardTitle>
              <CardDescription>
                Test any function with custom payload data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="customPayload">Custom Payload (JSON)</Label>
                <Textarea
                  id="customPayload"
                  value={customPayload}
                  onChange={(e) => setCustomPayload(e.target.value)}
                  placeholder='{"key": "value"}'
                  className="font-mono"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {SUPABASE_FUNCTIONS.map((func) => (
                  <Button
                    key={func.name}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      try {
                        const payload = JSON.parse(customPayload);
                        testFunction(func, payload);
                      } catch (error) {
                        toast.error("Invalid JSON payload");
                      }
                    }}
                    disabled={testingFunction === func.name}
                  >
                    <func.icon className="h-3 w-3 mr-1" />
                    {func.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Results History</CardTitle>
              <CardDescription>
                Detailed results from all function tests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {results.map((result) => (
                    <div
                      key={`${result.name}-${result.timestamp.getTime()}`}
                      className="border rounded-lg p-3"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(result.status)}
                          <span className="font-medium">{result.name}</span>
                          {result.statusCode && (
                            <Badge variant="outline">{result.statusCode}</Badge>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {result.timestamp.toLocaleTimeString()}
                        </span>
                      </div>

                      {result.error && (
                        <div className="text-red-600 text-sm bg-red-50 p-2 rounded mb-2">
                          {result.error}
                        </div>
                      )}

                      {result.response && (
                        <div className="text-green-600 text-sm bg-green-50 p-2 rounded font-mono">
                          {typeof result.response === "object"
                            ? JSON.stringify(result.response, null, 2)
                            : String(result.response)}
                        </div>
                      )}
                    </div>
                  ))}

                  {results.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                      No test results yet. Run some function tests to see
                      results here.
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guide" className="space-y-4">
          <FunctionTestingGuide />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SupabaseFunctionTester;

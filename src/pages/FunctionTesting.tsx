import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle, Clock, Play } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface FunctionTestResult {
  status: "success" | "error" | "pending" | "idle";
  response?: any;
  error?: string;
  statusCode?: number;
  timing?: number;
  detailedError?: string;
}

interface FunctionConfig {
  name: string;
  endpoint: string;
  method: "POST" | "GET" | "PUT" | "DELETE";
  category: "order" | "payment" | "delivery" | "email" | "admin";
  description: string;
  samplePayload: any;
  requiredFields: string[];
  requiresAuth?: boolean;
  adminOnly?: boolean;
}

const FUNCTIONS: FunctionConfig[] = [
  // Order Management Functions
  {
    name: "create-order",
    endpoint: "/functions/v1/create-order",
    method: "POST",
    category: "order",
    description: "Creates new orders for buyers",
    requiredFields: ["user_id", "items", "total_amount", "payment_reference"],
    requiresAuth: true,
    samplePayload: {
      user_id: "test-user-123",
      items: [
        {
          book_id: "book-123",
          seller_id: "seller-456",
          price: 100,
          title: "Sample Book",
        },
      ],
      total_amount: 100,
      shipping_address: {
        street: "123 Test St",
        city: "Cape Town",
        postal_code: "8001",
      },
      payment_reference: "pay_test123",
      payment_data: {
        method: "paystack",
        status: "success",
      },
    },
  },
  {
    name: "commit-to-sale",
    endpoint: "/functions/v1/commit-to-sale",
    method: "POST",
    category: "order",
    description: "Seller commits to fulfilling an order",
    requiredFields: ["orderId", "sellerId"],
    requiresAuth: true,
    samplePayload: {
      orderId: "ORD_test123",
      sellerId: "seller-456",
    },
  },
  {
    name: "decline-commit",
    endpoint: "/functions/v1/decline-commit",
    method: "POST",
    category: "order",
    description: "Seller declines to fulfill an order",
    requiredFields: ["orderId", "sellerId"],
    requiresAuth: true,
    samplePayload: {
      orderId: "ORD_test123",
      sellerId: "seller-456",
      reason: "Out of stock",
    },
  },
  {
    name: "auto-expire-commits",
    endpoint: "/functions/v1/auto-expire-commits",
    method: "POST",
    category: "order",
    description: "Automatically expires orders past their deadline",
    requiredFields: [],
    adminOnly: true,
    samplePayload: {},
  },
  {
    name: "check-expired-orders",
    endpoint: "/functions/v1/check-expired-orders",
    method: "POST",
    category: "order",
    description: "Checks for and handles expired orders",
    requiredFields: [],
    adminOnly: true,
    samplePayload: {},
  },
  {
    name: "mark-collected",
    endpoint: "/functions/v1/mark-collected",
    method: "POST",
    category: "order",
    description: "Marks an order as collected by buyer",
    requiredFields: ["order_id"],
    requiresAuth: true,
    samplePayload: {
      order_id: "ORD_test123",
    },
  },

  // Payment Functions
  {
    name: "initialize-paystack-payment",
    endpoint: "/functions/v1/initialize-paystack-payment",
    method: "POST",
    category: "payment",
    description: "Initialize Paystack payment transaction",
    requiredFields: ["user_id", "items", "total_amount", "email"],
    requiresAuth: true,
    samplePayload: {
      user_id: "test-user-123",
      items: [
        {
          book_id: "book-123",
          seller_id: "seller-456",
          price: 100,
        },
      ],
      total_amount: 100,
      email: "test@example.com",
      shipping_address: {
        street: "123 Test St",
        city: "Cape Town",
      },
    },
  },
  {
    name: "verify-paystack-payment",
    endpoint: "/functions/v1/verify-paystack-payment",
    method: "POST",
    category: "payment",
    description: "Verify Paystack payment status",
    requiredFields: ["reference"],
    requiresAuth: true,
    samplePayload: {
      reference: "T123456789",
      user_id: "test-user-123",
    },
  },
  {
    name: "paystack-webhook",
    endpoint: "/functions/v1/paystack-webhook",
    method: "POST",
    category: "payment",
    description: "Handle Paystack webhook events",
    requiredFields: ["event"],
    adminOnly: true,
    samplePayload: {
      event: "charge.success",
      data: {
        reference: "pay_test123",
        status: "success",
      },
    },
  },
  {
    name: "create-paystack-subaccount",
    endpoint: "/functions/v1/create-paystack-subaccount",
    method: "POST",
    category: "payment",
    description: "Create Paystack subaccount for seller",
    requiredFields: ["business_name", "settlement_bank", "account_number"],
    requiresAuth: true,
    samplePayload: {
      business_name: "Test Seller",
      settlement_bank: "044",
      account_number: "0123456789",
      percentage_charge: 90,
      user_id: "test-user-123",
    },
  },
  {
    name: "pay-seller",
    endpoint: "/functions/v1/pay-seller",
    method: "POST",
    category: "payment",
    description: "Process payment to seller after order completion",
    requiredFields: ["order_id"],
    adminOnly: true,
    samplePayload: {
      order_id: "ORD_test123",
    },
  },
  {
    name: "process-book-purchase",
    endpoint: "/functions/v1/process-book-purchase",
    method: "POST",
    category: "payment",
    description: "Process completed book purchase",
    requiredFields: ["payment_reference"],
    requiresAuth: true,
    samplePayload: {
      payment_reference: "pay_test123",
    },
  },
  {
    name: "process-multi-seller-purchase",
    endpoint: "/functions/v1/process-multi-seller-purchase",
    method: "POST",
    category: "payment",
    description: "Process purchase with multiple sellers",
    requiredFields: ["payment_reference"],
    requiresAuth: true,
    samplePayload: {
      payment_reference: "pay_test123",
    },
  },

  // Delivery Functions
  {
    name: "get-delivery-quotes",
    endpoint: "/functions/v1/get-delivery-quotes",
    method: "POST",
    category: "delivery",
    description: "Get delivery quotes from multiple providers",
    requiredFields: ["from_address", "to_address"],
    requiresAuth: true,
    samplePayload: {
      from_address: {
        street: "123 Seller St",
        city: "Cape Town",
        postal_code: "8001",
      },
      to_address: {
        street: "456 Buyer Ave",
        city: "Johannesburg",
        postal_code: "2000",
      },
      items: [
        {
          weight: 0.5,
          dimensions: { length: 20, width: 15, height: 3 },
        },
      ],
    },
  },
  {
    name: "courier-guy-quote",
    endpoint: "/functions/v1/courier-guy-quote",
    method: "POST",
    category: "delivery",
    description: "Get quote from Courier Guy",
    requiredFields: ["fromAddress", "toAddress", "weight"],
    requiresAuth: true,
    samplePayload: {
      fromAddress: {
        streetAddress: "123 Seller St",
        city: "Cape Town",
        postalCode: "8001",
        province: "Western Cape",
      },
      toAddress: {
        streetAddress: "456 Buyer Ave",
        city: "Johannesburg",
        postalCode: "2000",
        province: "Gauteng",
      },
      weight: 0.5,
      dimensions: {
        length: 20,
        width: 15,
        height: 3,
      },
    },
  },
  {
    name: "courier-guy-shipment",
    endpoint: "/functions/v1/courier-guy-shipment",
    method: "POST",
    category: "delivery",
    description: "Create shipment with Courier Guy",
    requiredFields: ["order_id"],
    requiresAuth: true,
    samplePayload: {
      order_id: "ORD_test123",
    },
  },
  {
    name: "courier-guy-track",
    endpoint: "/functions/v1/courier-guy-track",
    method: "POST",
    category: "delivery",
    description: "Track Courier Guy shipment",
    requiredFields: ["tracking_number"],
    requiresAuth: true,
    samplePayload: {
      tracking_number: "CG123456789",
    },
  },
  {
    name: "fastway-quote",
    endpoint: "/functions/v1/fastway-quote",
    method: "POST",
    category: "delivery",
    description: "Get quote from Fastway",
    requiredFields: ["fromAddress", "toAddress"],
    requiresAuth: true,
    samplePayload: {
      fromAddress: {
        streetAddress: "123 Seller St",
        city: "Cape Town",
        postalCode: "8001",
        province: "Western Cape",
      },
      toAddress: {
        streetAddress: "456 Buyer Ave",
        city: "Johannesburg",
        postalCode: "2000",
        province: "Gauteng",
      },
      parcel: {
        weight: 0.5,
        length: 20,
        width: 15,
        height: 3,
      },
    },
  },
  {
    name: "fastway-shipment",
    endpoint: "/functions/v1/fastway-shipment",
    method: "POST",
    category: "delivery",
    description: "Create shipment with Fastway",
    requiredFields: ["order_id"],
    requiresAuth: true,
    samplePayload: {
      order_id: "ORD_test123",
    },
  },
  {
    name: "fastway-track",
    endpoint: "/functions/v1/fastway-track",
    method: "POST",
    category: "delivery",
    description: "Track Fastway shipment",
    requiredFields: ["tracking_number"],
    requiresAuth: true,
    samplePayload: {
      tracking_number: "FW123456789",
    },
  },
  {
    name: "automate-delivery",
    endpoint: "/functions/v1/automate-delivery",
    method: "POST",
    category: "delivery",
    description: "Automatically create delivery for committed orders",
    requiredFields: ["order_id"],
    requiresAuth: true,
    samplePayload: {
      order_id: "ORD_test123",
    },
  },

  // Email Functions
  {
    name: "send-email",
    endpoint: "/functions/v1/send-email",
    method: "POST",
    category: "email",
    description: "Send email notifications",
    requiredFields: ["to", "subject"],
    requiresAuth: true,
    samplePayload: {
      to: "test@example.com",
      subject: "Test Email",
      template: {
        name: "welcome",
        data: {
          userName: "Test User",
          loginUrl: "https://example.com/login",
        },
      },
    },
  },
  {
    name: "process-order-reminders",
    endpoint: "/functions/v1/process-order-reminders",
    method: "POST",
    category: "email",
    description: "Send reminder emails for pending orders",
    requiredFields: [],
    adminOnly: true,
    samplePayload: {},
  },
];

export default function FunctionTesting() {
  const [results, setResults] = useState<Record<string, FunctionTestResult>>(
    {},
  );
  const [customPayloads, setCustomPayloads] = useState<Record<string, string>>(
    {},
  );
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const getSupabaseUrl = () => {
    // In development, use the local Supabase URL
    return import.meta.env.VITE_SUPABASE_URL || "http://localhost:54321";
  };

  const getAuthHeaders = (func: FunctionConfig) => {
    // Get the stored auth session
    const session = JSON.parse(
      localStorage.getItem("sb-localhost-auth-token") || "{}",
    );
    const userToken = session?.access_token;

    // For admin-only functions, try to use service role key or fallback to user token
    if (func.adminOnly) {
      const serviceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
      return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceKey || userToken || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      };
    }

    // For regular functions that require auth
    if (func.requiresAuth) {
      return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userToken || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      };
    }

    // For public functions
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    };
  };

  const analyzeError = (error: any, statusCode?: number): string => {
    if (statusCode === 400) {
      return "Bad Request - Check if all required fields are provided and properly formatted";
    }
    if (statusCode === 401) {
      return "Unauthorized - Check authentication token or API keys. Admin functions require service role key.";
    }
    if (statusCode === 403) {
      return "Forbidden - User doesn't have permission for this operation";
    }
    if (statusCode === 404) {
      return "Not Found - Function endpoint doesn't exist or resource not found";
    }
    if (statusCode === 422) {
      return "Unprocessable Entity - Data validation failed";
    }
    if (statusCode === 500) {
      return "Internal Server Error - Function crashed or database connection failed";
    }
    if (statusCode === 502) {
      return "Bad Gateway - Function timeout or deployment issue";
    }
    if (statusCode === 503) {
      return "Service Unavailable - Function is down or overloaded";
    }

    // Analyze error message content
    const errorStr = error?.message || error?.toString() || "";

    if (errorStr.includes("Missing required fields")) {
      return "Missing Required Fields - Check that all required parameters are included in the request";
    }
    if (errorStr.includes("Order ID and Seller ID are required")) {
      return "Missing Order/Seller ID - The function expects 'orderId' and 'sellerId' fields";
    }
    if (errorStr.includes("Missing fields: fromAddress, toAddress, weight")) {
      return "Missing Address/Weight - Courier functions need 'fromAddress', 'toAddress', and 'weight' fields";
    }
    if (errorStr.includes("Missing address or parcel information")) {
      return "Missing Address/Parcel - Fastway needs proper address and parcel information";
    }
    if (errorStr.includes("not found")) {
      return "Resource Not Found - The requested user, order, or other resource doesn't exist in the database";
    }
    if (errorStr.includes("Paystack")) {
      return "Paystack API Error - Issue with payment provider (check API keys, network, or Paystack service status)";
    }
    if (errorStr.includes("Supabase") || errorStr.includes("database")) {
      return "Database Error - Issue connecting to or querying the database";
    }
    if (errorStr.includes("email")) {
      return "Email Service Error - Failed to send email notification";
    }
    if (errorStr.includes("permission") || errorStr.includes("unauthorized")) {
      return "Permission Error - User lacks required permissions for this operation";
    }
    if (errorStr.includes("expired")) {
      return "Expiration Error - Token, session, or resource has expired";
    }
    if (errorStr.includes("network") || errorStr.includes("fetch")) {
      return "Network Error - Unable to reach external service or API";
    }
    if (errorStr.includes("timeout")) {
      return "Timeout Error - Request took too long to complete";
    }
    if (errorStr.includes("validation")) {
      return "Validation Error - Input data doesn't meet required format or constraints";
    }
    if (errorStr.includes("pattern is not defined")) {
      return "Template Error - Email template is using an undefined variable 'pattern'. Check template implementation.";
    }

    return errorStr || "Unknown error occurred";
  };

  const testFunction = async (func: FunctionConfig) => {
    const startTime = Date.now();

    setResults((prev) => ({
      ...prev,
      [func.name]: { status: "pending" },
    }));

    try {
      const payload = customPayloads[func.name]
        ? JSON.parse(customPayloads[func.name])
        : func.samplePayload;

      const url = `${getSupabaseUrl()}${func.endpoint}`;

      const response = await fetch(url, {
        method: func.method,
        headers: getAuthHeaders(func),
        body: func.method !== "GET" ? JSON.stringify(payload) : undefined,
      });

      const timing = Date.now() - startTime;
      const responseData = await response.json();

      if (response.ok) {
        setResults((prev) => ({
          ...prev,
          [func.name]: {
            status: "success",
            response: responseData,
            statusCode: response.status,
            timing,
          },
        }));
      } else {
        const detailedError = analyzeError(responseData, response.status);
        setResults((prev) => ({
          ...prev,
          [func.name]: {
            status: "error",
            error:
              responseData.error || responseData.message || "Unknown error",
            statusCode: response.status,
            timing,
            detailedError,
          },
        }));
      }
    } catch (error: any) {
      const timing = Date.now() - startTime;
      const detailedError = analyzeError(error);

      setResults((prev) => ({
        ...prev,
        [func.name]: {
          status: "error",
          error: error.message,
          timing,
          detailedError,
        },
      }));
    }
  };

  const testAllFunctions = async () => {
    const functionsToTest =
      selectedCategory === "all"
        ? FUNCTIONS
        : FUNCTIONS.filter((f) => f.category === selectedCategory);

    for (const func of functionsToTest) {
      await testFunction(func);
      // Small delay between tests to avoid overwhelming the server
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  };

  const getStatusIcon = (status: FunctionTestResult["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500 animate-spin" />;
      default:
        return <div className="h-4 w-4 rounded-full bg-gray-300" />;
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      order: "bg-blue-100 text-blue-800",
      payment: "bg-green-100 text-green-800",
      delivery: "bg-orange-100 text-orange-800",
      email: "bg-purple-100 text-purple-800",
      admin: "bg-red-100 text-red-800",
    };
    return (
      colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800"
    );
  };

  const filteredFunctions =
    selectedCategory === "all"
      ? FUNCTIONS
      : FUNCTIONS.filter((f) => f.category === selectedCategory);

  const categories = [
    "all",
    ...Array.from(new Set(FUNCTIONS.map((f) => f.category))),
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Function Testing Dashboard</h1>
          <p className="text-gray-600">
            Test all {FUNCTIONS.length} functions with detailed error analysis
          </p>
        </div>
        <Button onClick={testAllFunctions} size="lg">
          <Play className="mr-2 h-4 w-4" />
          Test All Functions
        </Button>
      </div>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList>
          {categories.map((category) => (
            <TabsTrigger key={category} value={category} className="capitalize">
              {category}{" "}
              {category !== "all" &&
                `(${FUNCTIONS.filter((f) => f.category === category).length})`}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedCategory} className="space-y-4">
          <div className="grid gap-4">
            {filteredFunctions.map((func) => {
              const result = results[func.name] || { status: "idle" };

              return (
                <Card key={func.name} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(result.status)}
                        <CardTitle className="text-lg">{func.name}</CardTitle>
                        <Badge className={getCategoryColor(func.category)}>
                          {func.category}
                        </Badge>
                        <Badge variant="outline">{func.method}</Badge>
                        {func.adminOnly && (
                          <Badge variant="destructive">Admin Only</Badge>
                        )}
                        {func.requiresAuth && !func.adminOnly && (
                          <Badge variant="secondary">Auth Required</Badge>
                        )}
                        {result.timing && (
                          <Badge variant="secondary">{result.timing}ms</Badge>
                        )}
                        {result.statusCode && (
                          <Badge
                            variant={
                              result.statusCode < 400
                                ? "default"
                                : "destructive"
                            }
                          >
                            {result.statusCode}
                          </Badge>
                        )}
                      </div>
                      <Button
                        onClick={() => testFunction(func)}
                        disabled={result.status === "pending"}
                      >
                        Test
                      </Button>
                    </div>
                    <p className="text-sm text-gray-600">{func.description}</p>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Endpoint:</label>
                      <code className="block text-sm bg-gray-100 p-2 rounded mt-1">
                        {func.method} {func.endpoint}
                      </code>
                    </div>

                    <div>
                      <label className="text-sm font-medium">
                        Required Fields:
                      </label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {func.requiredFields.map((field) => (
                          <Badge
                            key={field}
                            variant="outline"
                            className="text-xs"
                          >
                            {field}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium">
                        Test Payload:
                      </label>
                      <Textarea
                        placeholder="Enter custom JSON payload or use default"
                        value={
                          customPayloads[func.name] ||
                          JSON.stringify(func.samplePayload, null, 2)
                        }
                        onChange={(e) =>
                          setCustomPayloads((prev) => ({
                            ...prev,
                            [func.name]: e.target.value,
                          }))
                        }
                        className="mt-1 font-mono text-sm"
                        rows={6}
                      />
                    </div>

                    {result.status === "error" && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <div className="space-y-2">
                            <div>
                              <strong>Error:</strong> {result.error}
                            </div>
                            {result.detailedError && (
                              <div>
                                <strong>Analysis:</strong>{" "}
                                {result.detailedError}
                              </div>
                            )}
                            {result.statusCode && (
                              <div>
                                <strong>Status Code:</strong>{" "}
                                {result.statusCode}
                              </div>
                            )}
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}

                    {result.status === "success" && (
                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                          <div className="space-y-2">
                            <div>
                              <strong>Success!</strong> Function executed
                              successfully
                            </div>
                            <details>
                              <summary className="cursor-pointer font-medium">
                                View Response
                              </summary>
                              <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-auto">
                                {JSON.stringify(result.response, null, 2)}
                              </pre>
                            </details>
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

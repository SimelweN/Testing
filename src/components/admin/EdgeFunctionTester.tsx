import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Server,
  Play,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Copy,
  Clock,
  Database,
  Mail,
  CreditCard,
  Truck,
  ShoppingCart,
  Zap,
  Code,
  AlertCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TestResult {
  success: boolean;
  response?: any;
  error?: string;
  duration?: number;
  timestamp: string;
  status?: number;
  details?: any;
}

interface EdgeFunction {
  name: string;
  category: string;
  description: string;
  icon: React.ReactNode;
  template: any;
  parameters: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
    example?: any;
  }>;
}

const EdgeFunctionTester: React.FC = () => {
  const [selectedFunction, setSelectedFunction] = useState<string>("");
  const [customPayload, setCustomPayload] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<Record<string, TestResult>>({});
  const [activeTab, setActiveTab] = useState("orders");

  // Define all Edge Functions with their templates and parameters
  const edgeFunctions: EdgeFunction[] = [
    // Order Management Functions
    {
      name: "process-book-purchase",
      category: "orders",
      description: "Process a single book purchase after payment",
      icon: <ShoppingCart className="h-4 w-4" />,
      template: {
        user_id: "user-uuid-here",
        book_id: "book-uuid-here",
        email: "buyer@example.com",
        shipping_address: {
          name: "John Doe",
          phone: "0123456789",
          street: "123 Test Street",
          city: "Cape Town",
          province: "Western Cape",
          postal_code: "8000",
        },
        payment_reference: "pay_test_123",
        total_amount: 150.0,
        delivery_details: {
          method: "courierGuy",
          courier: "courier-guy",
          price: 25.0,
          estimated_days: 3,
        },
      },
      parameters: [
        {
          name: "user_id",
          type: "string",
          required: true,
          description: "Buyer's user ID",
        },
        {
          name: "book_id",
          type: "string",
          required: true,
          description: "Book UUID to purchase",
        },
        {
          name: "email",
          type: "string",
          required: true,
          description: "Buyer's email",
        },
        {
          name: "shipping_address",
          type: "object",
          required: true,
          description: "Delivery address",
        },
        {
          name: "payment_reference",
          type: "string",
          required: true,
          description: "Paystack reference",
        },
        {
          name: "total_amount",
          type: "number",
          required: true,
          description: "Total amount paid",
        },
      ],
    },
    {
      name: "commit-to-sale",
      category: "orders",
      description: "Seller commits to fulfilling an order",
      icon: <CheckCircle className="h-4 w-4" />,
      template: {
        order_id: "ORD_1234567890",
        seller_id: "seller-uuid-here",
      },
      parameters: [
        {
          name: "order_id",
          type: "string",
          required: true,
          description: "Order ID to commit to",
        },
        {
          name: "seller_id",
          type: "string",
          required: true,
          description: "Seller's user ID",
        },
      ],
    },
    {
      name: "decline-commit",
      category: "orders",
      description: "Seller declines an order, triggers refund",
      icon: <AlertTriangle className="h-4 w-4" />,
      template: {
        order_id: "ORD_1234567890",
        seller_id: "seller-uuid-here",
        reason: "Book no longer available",
      },
      parameters: [
        {
          name: "order_id",
          type: "string",
          required: true,
          description: "Order ID to decline",
        },
        {
          name: "seller_id",
          type: "string",
          required: true,
          description: "Seller's user ID",
        },
        {
          name: "reason",
          type: "string",
          required: false,
          description: "Reason for declining",
        },
      ],
    },
    {
      name: "mark-collected",
      category: "orders",
      description: "Mark order as collected by courier",
      icon: <Truck className="h-4 w-4" />,
      template: {
        order_id: "ORD_1234567890",
        collected_by: "courier",
        tracking_reference: "TRK123456",
        collection_notes: "Package collected successfully",
      },
      parameters: [
        {
          name: "order_id",
          type: "string",
          required: true,
          description: "Order ID",
        },
        {
          name: "collected_by",
          type: "string",
          required: true,
          description: "Who collected (courier name)",
        },
        {
          name: "tracking_reference",
          type: "string",
          required: false,
          description: "Tracking number",
        },
        {
          name: "collection_notes",
          type: "string",
          required: false,
          description: "Collection notes",
        },
      ],
    },
    {
      name: "auto-expire-commits",
      category: "orders",
      description: "Process expired orders (48+ hours old)",
      icon: <Clock className="h-4 w-4" />,
      template: {},
      parameters: [],
    },
    {
      name: "check-expired-orders",
      category: "orders",
      description: "Comprehensive order expiry health check",
      icon: <Database className="h-4 w-4" />,
      template: {},
      parameters: [],
    },

    // Payment Functions
    {
      name: "initialize-paystack-payment",
      category: "payments",
      description: "Initialize Paystack payment for checkout",
      icon: <CreditCard className="h-4 w-4" />,
      template: {
        user_id: "buyer-uuid-here",
        items: [
          {
            book_id: "book-uuid-here",
            seller_id: "seller-uuid-here",
            price: 150.0,
            title: "Test Book",
            condition: "good",
          },
        ],
        total_amount: 175.0,
        shipping_address: {
          name: "John Doe",
          phone: "0123456789",
          street: "123 Test Street",
          city: "Cape Town",
          province: "Western Cape",
          postal_code: "8000",
        },
        email: "buyer@example.com",
      },
      parameters: [
        {
          name: "user_id",
          type: "string",
          required: true,
          description: "Buyer's user ID",
        },
        {
          name: "items",
          type: "array",
          required: true,
          description: "Array of items to purchase",
        },
        {
          name: "total_amount",
          type: "number",
          required: true,
          description: "Total checkout amount",
        },
        {
          name: "shipping_address",
          type: "object",
          required: true,
          description: "Delivery address",
        },
        {
          name: "email",
          type: "string",
          required: true,
          description: "Buyer's email",
        },
      ],
    },
    {
      name: "verify-paystack-payment",
      category: "payments",
      description: "Verify Paystack payment and create orders",
      icon: <CheckCircle className="h-4 w-4" />,
      template: {
        reference: "paystack_ref_12345",
      },
      parameters: [
        {
          name: "reference",
          type: "string",
          required: true,
          description: "Paystack payment reference",
        },
      ],
    },
    {
      name: "pay-seller",
      category: "payments",
      description: "Transfer payment to seller after delivery",
      icon: <CreditCard className="h-4 w-4" />,
      template: {
        order_id: "ORD_1234567890",
        seller_id: "seller-uuid-here",
        amount: 95.0,
        trigger: "manual",
      },
      parameters: [
        {
          name: "order_id",
          type: "string",
          required: true,
          description: "Order ID for payment",
        },
        {
          name: "seller_id",
          type: "string",
          required: true,
          description: "Seller's user ID",
        },
        {
          name: "amount",
          type: "number",
          required: true,
          description: "Amount to transfer",
        },
        {
          name: "trigger",
          type: "string",
          required: false,
          description: "Payment trigger (manual/auto)",
        },
      ],
    },
    {
      name: "create-paystack-subaccount",
      category: "payments",
      description: "Create/update seller Paystack subaccount",
      icon: <Database className="h-4 w-4" />,
      template: {
        business_name: "John's Books",
        email: "john@example.com",
        bank_name: "Standard Bank",
        bank_code: "051001",
        account_number: "1234567890",
        is_update: false,
      },
      parameters: [
        {
          name: "business_name",
          type: "string",
          required: true,
          description: "Business name",
        },
        {
          name: "email",
          type: "string",
          required: true,
          description: "Seller email",
        },
        {
          name: "bank_name",
          type: "string",
          required: true,
          description: "Bank name",
        },
        {
          name: "bank_code",
          type: "string",
          required: true,
          description: "Bank code",
        },
        {
          name: "account_number",
          type: "string",
          required: true,
          description: "Account number",
        },
        {
          name: "is_update",
          type: "boolean",
          required: false,
          description: "Is this an update",
        },
      ],
    },

    // Delivery Functions
    {
      name: "get-delivery-quotes",
      category: "delivery",
      description: "Get quotes from multiple courier providers",
      icon: <Truck className="h-4 w-4" />,
      template: {
        fromAddress: {
          suburb: "Rosebank",
          postal_code: "2196",
          province: "Gauteng",
        },
        toAddress: {
          suburb: "Claremont",
          postal_code: "7708",
          province: "Western Cape",
        },
        weight: 1,
      },
      parameters: [
        {
          name: "fromAddress",
          type: "object",
          required: true,
          description: "Pickup address",
        },
        {
          name: "toAddress",
          type: "object",
          required: true,
          description: "Delivery address",
        },
        {
          name: "weight",
          type: "number",
          required: true,
          description: "Package weight in kg",
        },
      ],
    },
    {
      name: "courier-guy-quote",
      category: "delivery",
      description: "Get Courier Guy delivery quotes",
      icon: <Truck className="h-4 w-4" />,
      template: {
        fromAddress: {
          suburb: "Rosebank",
          postal_code: "2196",
          province: "Gauteng",
        },
        toAddress: {
          suburb: "Claremont",
          postal_code: "7708",
          province: "Western Cape",
        },
        weight: 1,
        serviceType: "standard",
      },
      parameters: [
        {
          name: "fromAddress",
          type: "object",
          required: true,
          description: "Pickup address",
        },
        {
          name: "toAddress",
          type: "object",
          required: true,
          description: "Delivery address",
        },
        {
          name: "weight",
          type: "number",
          required: true,
          description: "Package weight in kg",
        },
        {
          name: "serviceType",
          type: "string",
          required: false,
          description: "Service type",
        },
      ],
    },
    {
      name: "courier-guy-track",
      category: "delivery",
      description: "Track Courier Guy package",
      icon: <Truck className="h-4 w-4" />,
      template: {
        tracking_number: "CG123456789",
      },
      parameters: [
        {
          name: "tracking_number",
          type: "string",
          required: true,
          description: "Courier Guy tracking number",
        },
      ],
    },
    {
      name: "automate-delivery",
      category: "delivery",
      description: "Automatically schedule courier pickup",
      icon: <Zap className="h-4 w-4" />,
      template: {
        order_id: "ORD_1234567890",
        seller_address: {
          suburb: "Rosebank",
          postal_code: "2196",
          province: "Gauteng",
        },
        buyer_address: {
          suburb: "Claremont",
          postal_code: "7708",
          province: "Western Cape",
        },
        weight: 1.5,
      },
      parameters: [
        {
          name: "order_id",
          type: "string",
          required: true,
          description: "Order ID",
        },
        {
          name: "seller_address",
          type: "object",
          required: true,
          description: "Pickup address",
        },
        {
          name: "buyer_address",
          type: "object",
          required: true,
          description: "Delivery address",
        },
        {
          name: "weight",
          type: "number",
          required: true,
          description: "Package weight",
        },
      ],
    },

    // Communication Functions
    {
      name: "send-email",
      category: "communication",
      description: "Send emails using Brevo SMTP",
      icon: <Mail className="h-4 w-4" />,
      template: {
        to: "recipient@example.com",
        subject: "Test Email from Edge Function Tester",
        html: "<h1>Test Email</h1><p>This is a test email sent from the Edge Function Tester.</p>",
        text: "Test Email - This is a test email sent from the Edge Function Tester.",
        from: "noreply@rebookedsolutions.co.za",
      },
      parameters: [
        {
          name: "to",
          type: "string",
          required: true,
          description: "Recipient email",
        },
        {
          name: "subject",
          type: "string",
          required: true,
          description: "Email subject",
        },
        {
          name: "html",
          type: "string",
          required: false,
          description: "HTML content",
        },
        {
          name: "text",
          type: "string",
          required: false,
          description: "Text content",
        },
        {
          name: "from",
          type: "string",
          required: false,
          description: "Sender email",
        },
      ],
    },
    {
      name: "debug-email-template",
      category: "communication",
      description: "Test email template rendering",
      icon: <Code className="h-4 w-4" />,
      template: {
        templateName: "order-confirmation",
        data: {
          name: "John Doe",
          order_id: "ORD_123456",
        },
      },
      parameters: [
        {
          name: "templateName",
          type: "string",
          required: true,
          description: "Template name",
        },
        {
          name: "data",
          type: "object",
          required: true,
          description: "Template data",
        },
      ],
    },
  ];

  const categories = [
    {
      id: "orders",
      name: "Order Management",
      icon: <ShoppingCart className="h-4 w-4" />,
    },
    {
      id: "payments",
      name: "Payments",
      icon: <CreditCard className="h-4 w-4" />,
    },
    { id: "delivery", name: "Delivery", icon: <Truck className="h-4 w-4" /> },
    {
      id: "communication",
      name: "Communication",
      icon: <Mail className="h-4 w-4" />,
    },
  ];

  const testFunction = async () => {
    if (!selectedFunction) {
      toast.error("Please select a function to test");
      return;
    }

    setIsLoading(true);
    const startTime = Date.now();

    try {
      let payload;
      try {
        payload = customPayload ? JSON.parse(customPayload) : {};
      } catch (e) {
        throw new Error("Invalid JSON payload");
      }

      const { data, error } = await supabase.functions.invoke(
        selectedFunction,
        {
          body: payload,
        },
      );

      const duration = Date.now() - startTime;

      if (error) {
        setResults((prev) => ({
          ...prev,
          [selectedFunction]: {
            success: false,
            error: error.message || "Unknown error",
            details: error,
            duration,
            timestamp: new Date().toISOString(),
          },
        }));
        toast.error(`Function failed: ${error.message}`);
      } else {
        setResults((prev) => ({
          ...prev,
          [selectedFunction]: {
            success: true,
            response: data,
            duration,
            timestamp: new Date().toISOString(),
          },
        }));
        toast.success(`Function executed successfully in ${duration}ms`);
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      setResults((prev) => ({
        ...prev,
        [selectedFunction]: {
          success: false,
          error: errorMessage,
          details: error,
          duration,
          timestamp: new Date().toISOString(),
        },
      }));
      toast.error(`Test failed: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTemplate = (functionName: string) => {
    const func = edgeFunctions.find((f) => f.name === functionName);
    if (func) {
      setCustomPayload(JSON.stringify(func.template, null, 2));
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const clearResults = () => {
    setResults({});
    toast.success("Results cleared");
  };

  const getFilteredFunctions = (category: string) => {
    return edgeFunctions.filter((func) => func.category === category);
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Supabase Edge Function Tester
          </CardTitle>
          <p className="text-sm text-gray-600">
            Test all Supabase Edge Functions with detailed error reporting and
            performance metrics
          </p>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              {categories.map((category) => (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  className="flex items-center gap-2"
                >
                  {category.icon}
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {categories.map((category) => (
              <TabsContent
                key={category.id}
                value={category.id}
                className="space-y-4"
              >
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="function-select">Select Function</Label>
                    <Select
                      value={selectedFunction}
                      onValueChange={(value) => {
                        setSelectedFunction(value);
                        loadTemplate(value);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a function to test" />
                      </SelectTrigger>
                      <SelectContent>
                        {getFilteredFunctions(category.id).map((func) => (
                          <SelectItem key={func.name} value={func.name}>
                            <div className="flex items-center gap-2">
                              {func.icon}
                              <div>
                                <div className="font-medium">{func.name}</div>
                                <div className="text-xs text-gray-500">
                                  {func.description}
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedFunction && (
                    <>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label htmlFor="payload">
                            Request Payload (JSON)
                          </Label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => loadTemplate(selectedFunction)}
                          >
                            Load Template
                          </Button>
                        </div>
                        <Textarea
                          id="payload"
                          value={customPayload}
                          onChange={(e) => setCustomPayload(e.target.value)}
                          placeholder="Enter JSON payload here..."
                          className="min-h-[200px] font-mono text-sm"
                        />
                      </div>

                      <div className="flex gap-3">
                        <Button
                          onClick={testFunction}
                          disabled={isLoading}
                          className="flex items-center gap-2"
                        >
                          {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                          {isLoading ? "Testing..." : "Test Function"}
                        </Button>

                        {Object.keys(results).length > 0 && (
                          <Button variant="outline" onClick={clearResults}>
                            Clear Results
                          </Button>
                        )}
                      </div>

                      {/* Function Documentation */}
                      {(() => {
                        const func = edgeFunctions.find(
                          (f) => f.name === selectedFunction,
                        );
                        return func && func.parameters.length > 0 ? (
                          <Card className="mt-4">
                            <CardHeader>
                              <CardTitle className="text-sm">
                                Parameters Documentation
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                {func.parameters.map((param) => (
                                  <div
                                    key={param.name}
                                    className="flex items-start gap-3 text-sm"
                                  >
                                    <Badge
                                      variant={
                                        param.required ? "default" : "secondary"
                                      }
                                    >
                                      {param.type}
                                    </Badge>
                                    <div className="flex-1">
                                      <div className="font-medium">
                                        {param.name}
                                        {param.required && (
                                          <span className="text-red-500 ml-1">
                                            *
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-gray-600">
                                        {param.description}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        ) : null;
                      })()}
                    </>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Results Section */}
      {Object.keys(results).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Test Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(results).map(([functionName, result]) => (
              <Alert
                key={functionName}
                className={`${
                  result.success
                    ? "border-green-200 bg-green-50"
                    : "border-red-200 bg-red-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  {result.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  )}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{functionName}</div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        {result.duration && formatDuration(result.duration)}
                        <span>•</span>
                        {new Date(result.timestamp).toLocaleTimeString()}
                      </div>
                    </div>

                    <AlertDescription
                      className={`text-sm ${
                        result.success ? "text-green-800" : "text-red-800"
                      }`}
                    >
                      {result.success ? (
                        <div>
                          <div className="font-medium mb-2">
                            ✅ Function executed successfully
                          </div>
                          <details className="cursor-pointer">
                            <summary className="font-medium mb-2">
                              📄 Response Data
                            </summary>
                            <div className="bg-white p-3 rounded border">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-gray-600">
                                  JSON Response
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    copyToClipboard(
                                      JSON.stringify(result.response, null, 2),
                                    )
                                  }
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                              <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto max-h-64">
                                {JSON.stringify(result.response, null, 2)}
                              </pre>
                            </div>
                          </details>
                        </div>
                      ) : (
                        <div>
                          <div className="font-medium mb-2">
                            ❌ Function failed
                          </div>
                          <div className="bg-white p-3 rounded border space-y-3">
                            <div>
                              <div className="text-xs font-medium text-gray-600 mb-1">
                                Error Message
                              </div>
                              <div className="bg-red-50 p-2 rounded text-red-800 font-mono text-sm">
                                {result.error}
                              </div>
                            </div>

                            {result.details && (
                              <details className="cursor-pointer">
                                <summary className="text-xs font-medium text-gray-600 mb-1">
                                  🔍 Detailed Error Information
                                </summary>
                                <div className="bg-gray-50 p-2 rounded mt-2">
                                  <pre className="text-xs overflow-auto max-h-40">
                                    {JSON.stringify(result.details, null, 2)}
                                  </pre>
                                </div>
                              </details>
                            )}

                            <div className="text-xs text-gray-600">
                              <strong>💡 Troubleshooting Tips:</strong>
                              <ul className="list-disc list-inside mt-1 space-y-1">
                                <li>
                                  Check that all required parameters are
                                  provided
                                </li>
                                <li>
                                  Verify the JSON payload format is correct
                                </li>
                                <li>
                                  Ensure you have the necessary permissions
                                </li>
                                <li>
                                  Check if the referenced resources (user_id,
                                  book_id, etc.) exist
                                </li>
                                <li>
                                  Verify environment variables are properly
                                  configured
                                </li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EdgeFunctionTester;

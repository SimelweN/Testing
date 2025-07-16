import React, { useState } from "react";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  CheckCircle,
  Loader2,
  Zap,
  Copy,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface TestResult {
  success: boolean;
  data?: any;
  error?: string;
  duration?: number;
  function_name?: string;
  timestamp?: string;
}

interface FunctionDefinition {
  name: string;
  description: string;
  category: string;
  parameters: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
    default?: string;
  }>;
  examplePayload?: object;
}

const SupabaseFunctionTester: React.FC = () => {
  const [selectedFunction, setSelectedFunction] = useState<string>("");
  const [customPayload, setCustomPayload] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [parameterValues, setParameterValues] = useState<
    Record<string, string>
  >({});

  // Define all available Supabase functions
  const functions: FunctionDefinition[] = [
    {
      name: "create-order",
      description: "Creates a new order from cart items",
      category: "Orders",
      parameters: [
        {
          name: "buyer_id",
          type: "string",
          required: true,
          description: "User ID of the buyer",
        },
        {
          name: "delivery_address",
          type: "object",
          required: true,
          description: "Delivery address object",
        },
        {
          name: "books",
          type: "array",
          required: true,
          description: "Array of book objects to order",
        },
      ],
      examplePayload: {
        buyer_id: "user-id-here",
        delivery_address: {
          street: "123 Test Street",
          city: "Cape Town",
          province: "Western Cape",
          postal_code: "8001",
          country: "South Africa",
        },
        books: [
          {
            book_id: "book-id-here",
            seller_id: "seller-id-here",
            quantity: 1,
            price: 250.0,
          },
        ],
      },
    },
    {
      name: "commit-to-sale",
      description: "Commits a seller to a sale order",
      category: "Orders",
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
          description: "Seller ID committing to sale",
        },
      ],
      examplePayload: {
        order_id: "order-id-here",
        seller_id: "seller-id-here",
      },
    },
    {
      name: "decline-commit",
      description: "Declines a commit request",
      category: "Orders",
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
          description: "Seller ID declining",
        },
        {
          name: "reason",
          type: "string",
          required: false,
          description: "Reason for declining",
        },
      ],
      examplePayload: {
        order_id: "order-id-here",
        seller_id: "seller-id-here",
        reason: "Book no longer available",
      },
    },
    {
      name: "initialize-paystack-payment",
      description: "Initializes a Paystack payment",
      category: "Payments",
      parameters: [
        {
          name: "order_id",
          type: "string",
          required: true,
          description: "Order ID for payment",
        },
        {
          name: "amount",
          type: "number",
          required: true,
          description: "Amount in cents (ZAR)",
        },
        {
          name: "email",
          type: "string",
          required: true,
          description: "Customer email",
        },
      ],
      examplePayload: {
        order_id: "order-id-here",
        amount: 25000,
        email: "customer@example.com",
      },
    },
    {
      name: "verify-paystack-payment",
      description: "Verifies a Paystack payment",
      category: "Payments",
      parameters: [
        {
          name: "reference",
          type: "string",
          required: true,
          description: "Payment reference from Paystack",
        },
      ],
      examplePayload: {
        reference: "paystack-reference-here",
      },
    },
    {
      name: "create-paystack-subaccount",
      description: "Creates a Paystack subaccount for seller",
      category: "Banking",
      parameters: [
        {
          name: "business_name",
          type: "string",
          required: true,
          description: "Business name for subaccount",
        },
        {
          name: "settlement_bank",
          type: "string",
          required: true,
          description: "Bank code for settlement",
        },
        {
          name: "account_number",
          type: "string",
          required: true,
          description: "Account number",
        },
        {
          name: "user_id",
          type: "string",
          required: true,
          description: "User ID for the subaccount",
        },
      ],
      examplePayload: {
        business_name: "Test Business",
        settlement_bank: "011",
        account_number: "0123456789",
        user_id: "user-id-here",
      },
    },
    {
      name: "automate-delivery",
      description: "Automates delivery scheduling and tracking",
      category: "Delivery",
      parameters: [
        {
          name: "order_id",
          type: "string",
          required: true,
          description: "Order ID for delivery automation",
        },
      ],
      examplePayload: {
        order_id: "order-id-here",
      },
    },
    {
      name: "courier-guy-quote",
      description: "Gets delivery quote from Courier Guy",
      category: "Delivery",
      parameters: [
        {
          name: "from_address",
          type: "object",
          required: true,
          description: "Pickup address",
        },
        {
          name: "to_address",
          type: "object",
          required: true,
          description: "Delivery address",
        },
        {
          name: "parcel_dimensions",
          type: "object",
          required: false,
          description: "Package dimensions",
        },
      ],
      examplePayload: {
        from_address: {
          street: "123 Seller Street",
          city: "Cape Town",
          postal_code: "8001",
        },
        to_address: {
          street: "456 Buyer Avenue",
          city: "Johannesburg",
          postal_code: "2001",
        },
      },
    },
    {
      name: "mark-collected",
      description: "Marks an order as collected",
      category: "Orders",
      parameters: [
        {
          name: "order_id",
          type: "string",
          required: true,
          description: "Order ID to mark as collected",
        },
        {
          name: "tracking_number",
          type: "string",
          required: false,
          description: "Courier tracking number",
        },
      ],
      examplePayload: {
        order_id: "order-id-here",
        tracking_number: "TRK123456789",
      },
    },
    {
      name: "pay-seller",
      description: "Processes payment to seller",
      category: "Payments",
      parameters: [
        {
          name: "order_id",
          type: "string",
          required: true,
          description: "Order ID for seller payment",
        },
        {
          name: "amount",
          type: "number",
          required: true,
          description: "Amount to pay seller",
        },
      ],
      examplePayload: {
        order_id: "order-id-here",
        amount: 20000,
      },
    },
    {
      name: "auto-expire-commits",
      description: "Auto-expires old commit requests",
      category: "Maintenance",
      parameters: [],
      examplePayload: {},
    },
    {
      name: "check-expired-orders",
      description: "Checks and handles expired orders",
      category: "Maintenance",
      parameters: [],
      examplePayload: {},
    },
  ];

  const selectedFunctionDef = functions.find(
    (f) => f.name === selectedFunction,
  );

  const testFunction = async () => {
    if (!selectedFunction) {
      toast.error("Please select a function to test");
      return;
    }

    setIsLoading(true);
    const startTime = Date.now();

    try {
      let payload: any = {};

      // Use custom payload if provided, otherwise use parameter values
      if (customPayload.trim()) {
        try {
          payload = JSON.parse(customPayload);
        } catch (e) {
          throw new Error("Invalid JSON in custom payload");
        }
      } else if (selectedFunctionDef) {
        // Build payload from parameter values
        selectedFunctionDef.parameters.forEach((param) => {
          const value = parameterValues[param.name];
          if (value) {
            if (param.type === "object" || param.type === "array") {
              try {
                payload[param.name] = JSON.parse(value);
              } catch (e) {
                payload[param.name] = value;
              }
            } else if (param.type === "number") {
              payload[param.name] = Number(value);
            } else {
              payload[param.name] = value;
            }
          }
        });
      }

      console.log(
        `Testing function ${selectedFunction} with payload:`,
        payload,
      );

      const { data, error } = await supabase.functions.invoke(
        selectedFunction,
        {
          body: payload,
        },
      );

      const duration = Date.now() - startTime;

      const result: TestResult = {
        success: !error,
        data: data,
        error:
          error?.message ||
          (data?.error ? JSON.stringify(data.error) : undefined),
        duration,
        function_name: selectedFunction,
        timestamp: new Date().toISOString(),
      };

      setResults((prev) => [result, ...prev.slice(0, 9)]); // Keep last 10 results

      if (result.success) {
        toast.success(`Function ${selectedFunction} executed successfully!`, {
          description: `Completed in ${duration}ms`,
        });
      } else {
        toast.error(`Function ${selectedFunction} failed`, {
          description: result.error,
        });
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      const result: TestResult = {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        duration,
        function_name: selectedFunction,
        timestamp: new Date().toISOString(),
      };

      setResults((prev) => [result, ...prev.slice(0, 9)]);

      toast.error("Test failed", {
        description: result.error,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadExamplePayload = () => {
    if (selectedFunctionDef?.examplePayload) {
      setCustomPayload(
        JSON.stringify(selectedFunctionDef.examplePayload, null, 2),
      );
    }
  };

  const copyResult = (result: TestResult) => {
    const resultText = JSON.stringify(result, null, 2);
    navigator.clipboard.writeText(resultText);
    toast.success("Result copied to clipboard");
  };

  const clearResults = () => {
    setResults([]);
    toast.success("Results cleared");
  };

  const categories = [...new Set(functions.map((f) => f.category))];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-500" />
            Supabase Edge Functions Tester
          </CardTitle>
          <CardDescription>
            Test and debug all Supabase Edge Functions from the admin dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Function Selection */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="function-select">Select Function</Label>
              <Select
                value={selectedFunction}
                onValueChange={setSelectedFunction}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a function to test..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <div key={category}>
                      <div className="px-2 py-1 text-sm font-semibold text-gray-500">
                        {category}
                      </div>
                      {functions
                        .filter((f) => f.category === category)
                        .map((func) => (
                          <SelectItem key={func.name} value={func.name}>
                            <div className="flex flex-col">
                              <span>{func.name}</span>
                              <span className="text-xs text-gray-500">
                                {func.description}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedFunctionDef && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">
                  {selectedFunctionDef.name}
                </h4>
                <p className="text-sm text-blue-700 mb-3">
                  {selectedFunctionDef.description}
                </p>

                {selectedFunctionDef.parameters.length > 0 && (
                  <div>
                    <h5 className="font-medium text-blue-800 mb-2">
                      Parameters:
                    </h5>
                    <div className="space-y-2">
                      {selectedFunctionDef.parameters.map((param) => (
                        <div
                          key={param.name}
                          className="flex items-center gap-2 text-sm"
                        >
                          <Badge
                            variant={
                              param.required ? "destructive" : "secondary"
                            }
                          >
                            {param.type}
                          </Badge>
                          <span className="font-medium">{param.name}</span>
                          {param.required && (
                            <span className="text-red-500">*</span>
                          )}
                          <span className="text-gray-600">
                            - {param.description}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Parameter Inputs */}
          {selectedFunctionDef && selectedFunctionDef.parameters.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Function Parameters</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadExamplePayload}
                  disabled={!selectedFunctionDef.examplePayload}
                >
                  Load Example
                </Button>
              </div>

              <div className="grid gap-4">
                {selectedFunctionDef.parameters.map((param) => (
                  <div key={param.name} className="space-y-2">
                    <Label htmlFor={param.name}>
                      {param.name}
                      {param.required && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                      <span className="text-sm text-gray-500 ml-2">
                        ({param.type})
                      </span>
                    </Label>
                    {param.type === "object" || param.type === "array" ? (
                      <Textarea
                        id={param.name}
                        placeholder={`JSON for ${param.name}`}
                        value={parameterValues[param.name] || ""}
                        onChange={(e) =>
                          setParameterValues((prev) => ({
                            ...prev,
                            [param.name]: e.target.value,
                          }))
                        }
                        className="font-mono text-sm"
                      />
                    ) : (
                      <Input
                        id={param.name}
                        type={param.type === "number" ? "number" : "text"}
                        placeholder={param.description}
                        value={parameterValues[param.name] || ""}
                        onChange={(e) =>
                          setParameterValues((prev) => ({
                            ...prev,
                            [param.name]: e.target.value,
                          }))
                        }
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Custom Payload */}
          <div className="space-y-2">
            <Label htmlFor="custom-payload">
              Custom JSON Payload (Optional)
            </Label>
            <Textarea
              id="custom-payload"
              placeholder="Enter custom JSON payload to override parameter inputs..."
              className="min-h-[120px] font-mono text-sm"
              value={customPayload}
              onChange={(e) => setCustomPayload(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              If provided, this will override the parameter inputs above
            </p>
          </div>

          {/* Test Button */}
          <Button
            onClick={testFunction}
            disabled={isLoading || !selectedFunction}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Testing {selectedFunction}...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Test Function
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                Test Results
                <Badge variant="secondary">{results.length}</Badge>
              </CardTitle>
              <Button variant="outline" size="sm" onClick={clearResults}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Clear Results
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {results.map((result, index) => (
              <div
                key={index}
                className={`border rounded-lg p-4 ${
                  result.success
                    ? "border-green-200 bg-green-50"
                    : "border-red-200 bg-red-50"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {result.success ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                    <span className="font-medium">{result.function_name}</span>
                    <Badge variant={result.success ? "default" : "destructive"}>
                      {result.duration}ms
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {new Date(result.timestamp!).toLocaleTimeString()}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyResult(result)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {result.success && result.data && (
                  <div className="bg-white rounded border p-3">
                    <h4 className="font-semibold text-sm mb-2 text-green-800">
                      Response Data:
                    </h4>
                    <pre className="text-xs overflow-x-auto text-gray-700 bg-gray-50 p-2 rounded">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </div>
                )}

                {!result.success && result.error && (
                  <div className="bg-white rounded border border-red-200 p-3">
                    <h4 className="font-semibold text-sm mb-2 text-red-800">
                      Error Details:
                    </h4>
                    <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
                      {result.error}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SupabaseFunctionTester;

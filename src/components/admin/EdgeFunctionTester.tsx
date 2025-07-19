import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/lib/supabase";
import { Loader2, Play, CheckCircle, XCircle, Clock, Zap } from "lucide-react";

interface EdgeFunction {
  name: string;
  description: string;
  category: string;
  method: string;
  testPayload: any;
  requiredFields: string[];
  expectedResponse: string;
}

const edgeFunctions: EdgeFunction[] = [
  {
    name: "auto-expire-commits",
    description:
      "Automatically expires orders that have been pending commit for 48+ hours",
    category: "automation",
    method: "POST",
    testPayload: {},
    requiredFields: [],
    expectedResponse: "Returns count of expired orders processed",
  },
  {
    name: "automate-delivery",
    description:
      "Schedules automatic courier pickup and delivery after order commitment",
    category: "delivery",
    method: "POST",
    testPayload: {
      order_id: "ORD_test_123",
      seller_address: {
        streetAddress: "123 Test Street",
        suburb: "Rosebank",
        city: "Johannesburg",
        province: "Gauteng",
        postalCode: "2196",
      },
      buyer_address: {
        streetAddress: "456 Delivery Ave",
        suburb: "Sandton",
        city: "Johannesburg",
        province: "Gauteng",
        postalCode: "2146",
      },
      weight: 0.5,
    },
    requiredFields: ["order_id", "seller_address", "buyer_address", "weight"],
    expectedResponse: "Schedules pickup and returns delivery confirmation",
  },
  {
    name: "check-expired-orders",
    description:
      "Checks for and processes expired orders (alternative to auto-expire)",
    category: "automation",
    method: "POST",
    testPayload: {},
    requiredFields: [],
    expectedResponse: "Returns list of expired orders found",
  },
  {
    name: "commit-to-sale",
    description:
      "Commits seller to an order, updates status and schedules delivery",
    category: "orders",
    method: "POST",
    testPayload: {
      order_id: "ORD_test_456",
      seller_id: "seller_test_123",
    },
    requiredFields: ["order_id", "seller_id"],
    expectedResponse: "Confirms commitment and schedules pickup",
  },
  {
    name: "courier-guy-quote",
    description: "Gets delivery quote from Courier Guy API",
    category: "delivery",
    method: "POST",
    testPayload: {
      fromAddress: {
        streetAddress: "123 Pickup Street",
        suburb: "Rosebank",
        city: "Johannesburg",
        province: "Gauteng",
        postalCode: "2196",
      },
      toAddress: {
        streetAddress: "456 Delivery Ave",
        suburb: "Sandton",
        city: "Johannesburg",
        province: "Gauteng",
        postalCode: "2146",
      },
      weight: 0.5,
    },
    requiredFields: ["fromAddress", "toAddress", "weight"],
    expectedResponse: "Returns delivery quote with price and estimated days",
  },
  {
    name: "courier-guy-shipment",
    description: "Creates actual shipment with Courier Guy",
    category: "delivery",
    method: "POST",
    testPayload: {
      order_id: "ORD_test_789",
      pickup_address: {
        streetAddress: "123 Pickup Street",
        suburb: "Rosebank",
        city: "Johannesburg",
        province: "Gauteng",
        postalCode: "2196",
      },
      delivery_address: {
        streetAddress: "456 Delivery Ave",
        suburb: "Sandton",
        city: "Johannesburg",
        province: "Gauteng",
        postalCode: "2146",
      },
      weight: 0.5,
      reference: "TEST_REF_123",
    },
    requiredFields: [
      "order_id",
      "pickup_address",
      "delivery_address",
      "weight",
      "reference",
    ],
    expectedResponse: "Returns tracking number and shipment details",
  },
  {
    name: "courier-guy-track",
    description: "Tracks Courier Guy shipment by tracking number",
    category: "delivery",
    method: "POST",
    testPayload: {
      tracking_number: "CG123456789",
    },
    requiredFields: ["tracking_number"],
    expectedResponse: "Returns current tracking status and event history",
  },
  {
    name: "create-order",
    description: "Creates new order(s) from cart items and sends notifications",
    category: "orders",
    method: "POST",
    testPayload: {
      user_id: "test_buyer_123",
      items: [
        {
          book_id: "book_test_456",
          seller_id: "seller_test_789",
          price: 150,
          title: "Test Book",
        },
      ],
      total_amount: 150,
      shipping_address: {
        streetAddress: "456 Delivery Ave",
        suburb: "Sandton",
        city: "Johannesburg",
        province: "Gauteng",
        postalCode: "2146",
      },
      payment_reference: "PAY_TEST_123",
    },
    requiredFields: ["user_id", "items", "total_amount", "payment_reference"],
    expectedResponse: "Creates order(s) and sends email notifications",
  },
  {
    name: "create-paystack-subaccount",
    description: "Creates Paystack subaccount for seller payment splitting",
    category: "payments",
    method: "POST",
    testPayload: {
      business_name: "Test Seller Business",
      bank_code: "058",
      account_number: "1234567890",
      percentage_charge: 10.0,
      description: "Test seller account",
    },
    requiredFields: [
      "business_name",
      "bank_code",
      "account_number",
      "percentage_charge",
    ],
    expectedResponse: "Returns Paystack subaccount code and details",
  },
  {
    name: "debug-email-template",
    description: "Tests email template rendering and delivery",
    category: "utilities",
    method: "POST",
    testPayload: {
      template: "order_confirmation",
      to: "test@example.com",
      data: {
        buyer_name: "Test Buyer",
        order_id: "ORD_TEST_123",
        total_amount: 150,
      },
    },
    requiredFields: ["template", "to", "data"],
    expectedResponse: "Sends test email and returns delivery status",
  },
  {
    name: "decline-commit",
    description: "Declines an order commitment and processes refund",
    category: "orders",
    method: "POST",
    testPayload: {
      order_id: "ORD_test_decline",
      seller_id: "seller_test_456",
      reason: "Test decline reason",
    },
    requiredFields: ["order_id", "seller_id", "reason"],
    expectedResponse: "Declines order, processes refund, sends notifications",
  },
  {
    name: "fastway-quote",
    description: "Gets delivery quote from Fastway API",
    category: "delivery",
    method: "POST",
    testPayload: {
      fromAddress: {
        streetAddress: "123 Pickup Street",
        suburb: "Rosebank",
        city: "Johannesburg",
        province: "Gauteng",
        postalCode: "2196",
      },
      toAddress: {
        streetAddress: "456 Delivery Ave",
        suburb: "Sandton",
        city: "Johannesburg",
        province: "Gauteng",
        postalCode: "2146",
      },
      weight: 0.5,
    },
    requiredFields: ["fromAddress", "toAddress", "weight"],
    expectedResponse: "Returns Fastway delivery quote with pricing",
  },
  {
    name: "fastway-shipment",
    description: "Creates shipment with Fastway courier",
    category: "delivery",
    method: "POST",
    testPayload: {
      order_id: "ORD_fastway_test",
      pickup_address: {
        streetAddress: "123 Pickup Street",
        suburb: "Rosebank",
        city: "Johannesburg",
        province: "Gauteng",
        postalCode: "2196",
      },
      delivery_address: {
        streetAddress: "456 Delivery Ave",
        suburb: "Sandton",
        city: "Johannesburg",
        province: "Gauteng",
        postalCode: "2146",
      },
      weight: 0.5,
    },
    requiredFields: [
      "order_id",
      "pickup_address",
      "delivery_address",
      "weight",
    ],
    expectedResponse: "Creates Fastway shipment and returns tracking info",
  },
  {
    name: "fastway-track",
    description: "Tracks Fastway shipment status",
    category: "delivery",
    method: "POST",
    testPayload: {
      tracking_number: "FW123456789",
    },
    requiredFields: ["tracking_number"],
    expectedResponse: "Returns Fastway tracking status and events",
  },
  {
    name: "get-delivery-quotes",
    description: "Gets quotes from multiple courier providers",
    category: "delivery",
    method: "POST",
    testPayload: {
      fromAddress: {
        streetAddress: "123 Pickup Street",
        suburb: "Rosebank",
        city: "Johannesburg",
        province: "Gauteng",
        postalCode: "2196",
      },
      toAddress: {
        streetAddress: "456 Delivery Ave",
        suburb: "Sandton",
        city: "Johannesburg",
        province: "Gauteng",
        postalCode: "2146",
      },
      weight: 0.5,
    },
    requiredFields: ["fromAddress", "toAddress", "weight"],
    expectedResponse: "Returns quotes from all available couriers",
  },
  {
    name: "initialize-paystack-payment",
    description: "Initializes Paystack payment with split configuration",
    category: "payments",
    method: "POST",
    testPayload: {
      user_id: "test_user_123",
      items: [
        {
          seller_id: "seller_test_456",
          price: 150,
          title: "Test Book",
        },
      ],
      total_amount: 150,
      email: "test@example.com",
      shipping_address: {
        streetAddress: "456 Delivery Ave",
        suburb: "Sandton",
        city: "Johannesburg",
        province: "Gauteng",
        postalCode: "2146",
      },
    },
    requiredFields: ["user_id", "items", "total_amount", "email"],
    expectedResponse: "Returns Paystack authorization URL and reference",
  },
  {
    name: "mark-collected",
    description: "Marks order as collected and triggers seller payment",
    category: "orders",
    method: "POST",
    testPayload: {
      order_id: "ORD_collected_test",
      tracking_number: "TRK123456789",
      delivery_date: new Date().toISOString(),
    },
    requiredFields: ["order_id", "tracking_number"],
    expectedResponse: "Marks as delivered and processes seller payment",
  },
  {
    name: "pay-seller",
    description: "Processes payment to seller after successful delivery",
    category: "payments",
    method: "POST",
    testPayload: {
      order_id: "ORD_payment_test",
      seller_id: "seller_test_789",
      amount: 135,
    },
    requiredFields: ["order_id", "seller_id", "amount"],
    expectedResponse: "Initiates Paystack transfer to seller",
  },
  {
    name: "paystack-webhook",
    description: "Handles Paystack webhook events for payment processing",
    category: "payments",
    method: "POST",
    testPayload: {
      event: "charge.success",
      data: {
        reference: "TEST_REF_123",
        amount: 15000,
        status: "success",
      },
    },
    requiredFields: ["event", "data"],
    expectedResponse: "Processes webhook and updates transaction status",
  },
  {
    name: "process-book-purchase",
    description: "Processes single book purchase transaction",
    category: "orders",
    method: "POST",
    testPayload: {
      book_id: "book_test_123",
      buyer_id: "buyer_test_456",
      seller_id: "seller_test_789",
      amount: 150,
      payment_reference: "PAY_SINGLE_TEST",
    },
    requiredFields: [
      "book_id",
      "buyer_id",
      "seller_id",
      "amount",
      "payment_reference",
    ],
    expectedResponse: "Creates transaction and sends notifications",
  },
  {
    name: "process-multi-seller-purchase",
    description: "Processes cart with books from multiple sellers",
    category: "orders",
    method: "POST",
    testPayload: {
      buyer_id: "buyer_test_123",
      items: [
        {
          book_id: "book_test_1",
          seller_id: "seller_test_1",
          price: 100,
        },
        {
          book_id: "book_test_2",
          seller_id: "seller_test_2",
          price: 120,
        },
      ],
      total_amount: 220,
      payment_reference: "PAY_MULTI_TEST",
    },
    requiredFields: ["buyer_id", "items", "total_amount", "payment_reference"],
    expectedResponse: "Creates multiple transactions with payment splits",
  },
  {
    name: "process-order-reminders",
    description: "Sends reminder emails for pending commitments",
    category: "automation",
    method: "POST",
    testPayload: {},
    requiredFields: [],
    expectedResponse: "Sends reminder emails and returns count",
  },
  {
    name: "send-email",
    description: "Sends transactional emails via SMTP",
    category: "utilities",
    method: "POST",
    testPayload: {
      to: "test@example.com",
      subject: "Test Email",
      html: "<h1>Test Email</h1><p>This is a test email from the edge function tester.</p>",
      text: "Test Email\n\nThis is a test email from the edge function tester.",
    },
    requiredFields: ["to", "subject"],
    expectedResponse: "Sends email and returns delivery confirmation",
  },
  {
    name: "verify-paystack-payment",
    description: "Verifies Paystack payment status and processes order",
    category: "payments",
    method: "POST",
    testPayload: {
      reference: "TEST_VERIFY_REF_123",
    },
    requiredFields: ["reference"],
    expectedResponse: "Verifies payment and updates order status",
  },
];

// Verify we have all 24 functions
console.log(`EdgeFunctionTester: ${edgeFunctions.length} functions loaded`);
if (edgeFunctions.length !== 24) {
  console.warn(`Expected 24 functions but got ${edgeFunctions.length}`);
}

interface TestResult {
  function: string;
  status: "idle" | "loading" | "success" | "error";
  response?: any;
  error?: string;
  duration?: number;
}

export default function EdgeFunctionTester() {
  // Debug: Log function count on component mount
  React.useEffect(() => {
    console.log(`EdgeFunctionTester: ${edgeFunctions.length} functions loaded`);
    console.log("Function names:", edgeFunctions.map((f) => f.name).sort());
  }, []);

  const [testResults, setTestResults] = useState<Record<string, TestResult>>(
    {},
  );
  const [selectedFunction, setSelectedFunction] = useState<EdgeFunction | null>(
    null,
  );
  const [customPayload, setCustomPayload] = useState("");
  const [allTestsRunning, setAllTestsRunning] = useState(false);

  const updateTestResult = (
    functionName: string,
    result: Partial<TestResult>,
  ) => {
    setTestResults((prev) => ({
      ...prev,
      [functionName]: {
        ...prev[functionName],
        function: functionName,
        ...result,
      },
    }));
  };

  const testFunction = async (func: EdgeFunction, payload?: any) => {
    const startTime = Date.now();
    updateTestResult(func.name, { status: "loading" });

    try {
      const testPayload = payload || func.testPayload;
      const { data, error } = await supabase.functions.invoke(func.name, {
        body: testPayload,
      });

      const duration = Date.now() - startTime;

      if (error) {
        updateTestResult(func.name, {
          status: "error",
          error: error.message,
          duration,
        });
      } else {
        updateTestResult(func.name, {
          status: "success",
          response: data,
          duration,
        });
      }
    } catch (error: any) {
      const duration = Date.now() - startTime;
      updateTestResult(func.name, {
        status: "error",
        error: error.message,
        duration,
      });
    }
  };

  const testAllFunctions = async () => {
    setAllTestsRunning(true);

    // Reset all results
    const resetResults: Record<string, TestResult> = {};
    edgeFunctions.forEach((func) => {
      resetResults[func.name] = { function: func.name, status: "idle" };
    });
    setTestResults(resetResults);

    // Test functions in batches to avoid overwhelming the system
    const batchSize = 3;
    for (let i = 0; i < edgeFunctions.length; i += batchSize) {
      const batch = edgeFunctions.slice(i, i + batchSize);
      await Promise.all(batch.map((func) => testFunction(func)));

      // Small delay between batches
      if (i + batchSize < edgeFunctions.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    setAllTestsRunning(false);
  };

  const testCustomPayload = async () => {
    if (!selectedFunction) return;

    try {
      const payload = JSON.parse(customPayload);
      await testFunction(selectedFunction, payload);
    } catch (error: any) {
      updateTestResult(selectedFunction.name, {
        status: "error",
        error: `Invalid JSON: ${error.message}`,
      });
    }
  };

  const getStatusIcon = (status: TestResult["status"]) => {
    switch (status) {
      case "loading":
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "orders":
        return "bg-blue-100 text-blue-800";
      case "payments":
        return "bg-green-100 text-green-800";
      case "delivery":
        return "bg-purple-100 text-purple-800";
      case "automation":
        return "bg-orange-100 text-orange-800";
      case "utilities":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const categories = [
    "all",
    ...Array.from(new Set(edgeFunctions.map((f) => f.category))),
  ];
  const [activeCategory, setActiveCategory] = useState("all");

  const filteredFunctions =
    activeCategory === "all"
      ? edgeFunctions
      : edgeFunctions.filter((f) => f.category === activeCategory);

  const successCount = Object.values(testResults).filter(
    (r) => r.status === "success",
  ).length;
  const errorCount = Object.values(testResults).filter(
    (r) => r.status === "error",
  ).length;
  const totalTested = Object.values(testResults).filter(
    (r) => r.status !== "idle",
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">
            Edge Functions Testing Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Test all {edgeFunctions.length} Supabase Edge Functions at once or
            individually
            {filteredFunctions.length !== edgeFunctions.length &&
              ` (${filteredFunctions.length} showing in current category)`}
          </p>
        </div>

        <div className="flex gap-2 items-center">
          {totalTested > 0 && (
            <div className="flex gap-2 mr-4">
              <Badge
                variant="outline"
                className="text-green-600 border-green-600"
              >
                ✓ {successCount}
              </Badge>
              <Badge variant="outline" className="text-red-600 border-red-600">
                ✗ {errorCount}
              </Badge>
            </div>
          )}

          <Button
            onClick={testAllFunctions}
            disabled={allTestsRunning}
            className="bg-primary hover:bg-primary/90"
          >
            {allTestsRunning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing All...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Test All Functions
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="grid w-full grid-cols-6">
          {categories.map((category) => (
            <TabsTrigger key={category} value={category} className="capitalize">
              {category}{" "}
              {category !== "all" &&
                `(${edgeFunctions.filter((f) => f.category === category).length})`}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeCategory} className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredFunctions.map((func) => {
              const result = testResults[func.name] || {
                function: func.name,
                status: "idle",
              };

              return (
                <Card key={func.name} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {getStatusIcon(result.status)}
                          {func.name}
                        </CardTitle>
                        <div className="flex gap-2 mt-2">
                          <Badge className={getCategoryColor(func.category)}>
                            {func.category}
                          </Badge>
                          <Badge variant="outline">{func.method}</Badge>
                        </div>
                      </div>
                    </div>
                    <CardDescription className="text-sm">
                      {func.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {func.requiredFields.length > 0 && (
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground">
                          Required Fields
                        </Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {func.requiredFields.map((field) => (
                            <Badge
                              key={field}
                              variant="secondary"
                              className="text-xs"
                            >
                              {field}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">
                        Expected Response
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        {func.expectedResponse}
                      </p>
                    </div>

                    {result.status !== "idle" && (
                      <div className="space-y-2">
                        {result.duration && (
                          <p className="text-xs text-muted-foreground">
                            Duration: {result.duration}ms
                          </p>
                        )}

                        {result.status === "success" && result.response && (
                          <div>
                            <Label className="text-xs font-medium text-green-600">
                              Response
                            </Label>
                            <pre className="text-xs bg-green-50 p-2 rounded mt-1 overflow-x-auto max-h-32">
                              {JSON.stringify(result.response, null, 2)}
                            </pre>
                          </div>
                        )}

                        {result.status === "error" && result.error && (
                          <div>
                            <Label className="text-xs font-medium text-red-600">
                              Error
                            </Label>
                            <pre className="text-xs bg-red-50 p-2 rounded mt-1 overflow-x-auto max-h-32">
                              {result.error}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => testFunction(func)}
                        disabled={result.status === "loading"}
                        className="flex-1"
                      >
                        {result.status === "loading" ? (
                          <>
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            Testing...
                          </>
                        ) : (
                          <>
                            <Play className="mr-1 h-3 w-3" />
                            Test
                          </>
                        )}
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedFunction(func);
                          setCustomPayload(
                            JSON.stringify(func.testPayload, null, 2),
                          );
                        }}
                      >
                        Customize
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {selectedFunction && (
        <Card>
          <CardHeader>
            <CardTitle>Custom Test: {selectedFunction.name}</CardTitle>
            <CardDescription>
              Modify the payload below to test with custom data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="custom-payload">Payload (JSON)</Label>
              <Textarea
                id="custom-payload"
                value={customPayload}
                onChange={(e) => setCustomPayload(e.target.value)}
                className="font-mono text-sm min-h-32"
                placeholder="Enter custom JSON payload..."
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={testCustomPayload}>
                <Play className="mr-2 h-4 w-4" />
                Test with Custom Payload
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectedFunction(null)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Alert>
        <Zap className="h-4 w-4" />
        <AlertTitle>Testing Notes</AlertTitle>
        <AlertDescription>
          • Some functions require real data (orders, users) to work properly
          <br />
          • Payment functions are in test mode and won't charge real money
          <br />
          • Email functions will send to test addresses only
          <br />• Delivery functions use sandbox APIs where available
        </AlertDescription>
      </Alert>
    </div>
  );
}

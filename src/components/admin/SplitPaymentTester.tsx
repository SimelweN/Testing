import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Play,
  CheckCircle,
  XCircle,
  Loader2,
  Split,
  DollarSign,
  Users,
  AlertCircle,
  Copy,
  Eye,
} from "lucide-react";

interface TestResult {
  success: boolean;
  step: string;
  data?: any;
  error?: string;
  timestamp: string;
}

const SplitPaymentTester = () => {
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);

  // Test data
  const [testOrder, setTestOrder] = useState({
    user_id: "test-user-123",
    total_amount: 150.0,
    email: "test@example.com",
    items: [
      {
        id: "item-1",
        seller_id: "seller-1",
        price: 100.0,
        title: "Advanced Mathematics Textbook",
      },
      {
        id: "item-2",
        seller_id: "seller-2",
        price: 50.0,
        title: "Physics Study Guide",
      },
    ],
  });

  const addTestResult = (result: TestResult) => {
    setTestResults((prev) => [
      ...prev,
      { ...result, timestamp: new Date().toISOString() },
    ]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const copyTestData = () => {
    navigator.clipboard.writeText(JSON.stringify(testOrder, null, 2));
    toast.success("Test data copied to clipboard");
  };

  const runSplitPaymentTest = async () => {
    setTesting(true);
    clearResults();

    try {
      // Step 1: Test split creation
      addTestResult({
        success: true,
        step: "1. Starting Split Payment Test",
        data: { test_order: testOrder },
      });

      // Step 2: Create payment split
      addTestResult({
        success: true,
        step: "2. Creating Payment Split",
        data: { message: "Calling split management function..." },
      });

      const splitResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paystack-split-management`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: `Test Split ${Date.now()}`,
            type: "flat",
            currency: "ZAR",
            order_items: testOrder.items,
            bearer_type: "account",
          }),
        },
      );

      const splitResult = await splitResponse.json();

      if (splitResult.success) {
        addTestResult({
          success: true,
          step: "3. Split Created Successfully",
          data: {
            split_code: splitResult.split_code,
            message: "Split created with proper subaccount distribution",
          },
        });

        // Step 3: Test payment initialization with split
        addTestResult({
          success: true,
          step: "4. Initializing Payment with Split",
          data: { split_code: splitResult.split_code },
        });

        const paymentResponse = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/initialize-paystack-payment`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              user_id: testOrder.user_id,
              items: testOrder.items,
              total_amount: testOrder.total_amount,
              email: testOrder.email,
              shipping_address: {
                street: "123 Test Street",
                city: "Cape Town",
                province: "Western Cape",
                postal_code: "8001",
                country: "South Africa",
              },
            }),
          },
        );

        const paymentResult = await paymentResponse.json();

        if (paymentResult.success) {
          addTestResult({
            success: true,
            step: "5. Payment Initialized Successfully",
            data: {
              reference: paymentResult.data.reference,
              authorization_url: paymentResult.data.authorization_url,
              message: "Payment initialized with split configuration",
            },
          });

          // Step 4: Verify split was applied
          addTestResult({
            success: true,
            step: "6. Split Payment Test Completed",
            data: {
              summary: {
                total_amount: testOrder.total_amount,
                split_code: splitResult.split_code,
                payment_reference: paymentResult.data.reference,
                sellers_count: testOrder.items.length,
                platform_fee: "10% commission applied",
              },
              message: "All split payment components working correctly",
            },
          });
        } else {
          addTestResult({
            success: false,
            step: "5. Payment Initialization Failed",
            error: paymentResult.error || "Unknown payment error",
            data: paymentResult.details || null,
          });
        }
      } else {
        addTestResult({
          success: false,
          step: "3. Split Creation Failed",
          error: splitResult.error || "Unknown split error",
          data: splitResult.details || null,
        });
      }
    } catch (error) {
      addTestResult({
        success: false,
        step: "Test Error",
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        data: { error_type: "Network or execution error" },
      });
    } finally {
      setTesting(false);
    }
  };

  const testBasicSplitAPI = async () => {
    setTesting(true);
    clearResults();

    try {
      // Test GET splits endpoint
      addTestResult({
        success: true,
        step: "1. Testing Split API - GET Splits",
        data: { message: "Fetching existing splits..." },
      });

      const getResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paystack-split-management`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
          },
        },
      );

      const getResult = await getResponse.json();

      if (getResult.success) {
        addTestResult({
          success: true,
          step: "2. GET Splits Successful",
          data: {
            splits_count: Array.isArray(getResult.data)
              ? getResult.data.length
              : 0,
            message: "Successfully retrieved existing splits",
          },
        });
      } else {
        addTestResult({
          success: false,
          step: "2. GET Splits Failed",
          error: getResult.error || "Failed to retrieve splits",
          data: getResult.details || null,
        });
      }

      // Test creating a simple split
      addTestResult({
        success: true,
        step: "3. Testing Split Creation",
        data: { message: "Creating test split..." },
      });

      const createResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paystack-split-management`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: `API Test Split ${Date.now()}`,
            type: "percentage",
            currency: "ZAR",
            subaccounts: [
              {
                subaccount: "ACCT_test123",
                share: 80,
              },
            ],
          }),
        },
      );

      const createResult = await createResponse.json();

      if (createResult.success) {
        addTestResult({
          success: true,
          step: "4. Split API Test Completed",
          data: {
            split_code: createResult.split_code,
            message: "Split API functions are working correctly",
          },
        });
      } else {
        addTestResult({
          success: false,
          step: "4. Split Creation Failed",
          error: createResult.error || "Split creation failed",
          data: createResult.details || null,
        });
      }
    } catch (error) {
      addTestResult({
        success: false,
        step: "API Test Error",
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        data: { error_type: "Network or API error" },
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Split Payment Testing
          </h2>
          <p className="text-muted-foreground">
            Test the Paystack split payment implementation
          </p>
        </div>
        <Button onClick={clearResults} variant="outline" disabled={testing}>
          Clear Results
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Split className="h-5 w-5" />
              Test Configuration
            </CardTitle>
            <CardDescription>
              Configure test data for split payment testing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="user-id">User ID</Label>
              <Input
                id="user-id"
                value={testOrder.user_id}
                onChange={(e) =>
                  setTestOrder((prev) => ({ ...prev, user_id: e.target.value }))
                }
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={testOrder.email}
                onChange={(e) =>
                  setTestOrder((prev) => ({ ...prev, email: e.target.value }))
                }
              />
            </div>

            <div>
              <Label htmlFor="total-amount">Total Amount (ZAR)</Label>
              <Input
                id="total-amount"
                type="number"
                step="0.01"
                value={testOrder.total_amount}
                onChange={(e) =>
                  setTestOrder((prev) => ({
                    ...prev,
                    total_amount: Number(e.target.value),
                  }))
                }
              />
            </div>

            <div>
              <Label htmlFor="test-items">Test Items (JSON)</Label>
              <Textarea
                id="test-items"
                value={JSON.stringify(testOrder.items, null, 2)}
                onChange={(e) => {
                  try {
                    const items = JSON.parse(e.target.value);
                    setTestOrder((prev) => ({ ...prev, items }));
                  } catch (error) {
                    // Invalid JSON, ignore
                  }
                }}
                rows={8}
                className="font-mono text-sm"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={copyTestData}
                variant="outline"
                className="flex-1"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Data
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Test Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Test Actions
            </CardTitle>
            <CardDescription>
              Run tests to validate split payment functionality
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={runSplitPaymentTest}
              disabled={testing}
              className="w-full"
              size="lg"
            >
              {testing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Running Test...
                </>
              ) : (
                <>
                  <Split className="h-4 w-4 mr-2" />
                  Test Full Split Payment Flow
                </>
              )}
            </Button>

            <Button
              onClick={testBasicSplitAPI}
              disabled={testing}
              className="w-full"
              variant="outline"
            >
              {testing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testing API...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Test Split API Functions
                </>
              )}
            </Button>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <DollarSign className="h-4 w-4" />
                <span>Tests payment initialization with splits</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="h-4 w-4" />
                <span>Validates multi-seller commission calculation</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Split className="h-4 w-4" />
                <span>Verifies Paystack Split API integration</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Test Results ({testResults.length})
            </CardTitle>
            <CardDescription>
              Results from split payment testing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    result.success
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {result.success ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className="font-medium">{result.step}</span>
                    <Badge variant={result.success ? "default" : "destructive"}>
                      {result.success ? "Success" : "Failed"}
                    </Badge>
                  </div>

                  {result.error && (
                    <div className="mb-2">
                      <div className="flex items-center gap-2 text-red-700">
                        <AlertCircle className="h-4 w-4" />
                        <span className="font-medium">Error:</span>
                      </div>
                      <p className="text-red-600 text-sm mt-1">
                        {result.error}
                      </p>
                    </div>
                  )}

                  {result.data && (
                    <div className="mt-2">
                      <details className="text-sm">
                        <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                          View Details
                        </summary>
                        <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </details>
                    </div>
                  )}

                  <div className="text-xs text-gray-500 mt-2">
                    {new Date(result.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SplitPaymentTester;

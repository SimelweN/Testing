import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Code, Play, AlertCircle, CheckCircle, Copy, PlayCircle, Zap, Database, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface APIEndpoint {
  name: string;
  path: string;
  method: string;
  description: string;
  requiredFields: string[];
  samplePayload: object;
}

const apiEndpoints: APIEndpoint[] = [
  {
    name: "Create Order",
    path: "/api/create-order",
    method: "POST",
    description: "Create a new order for books",
    requiredFields: ["user_id", "items", "total_amount", "payment_reference"],
    samplePayload: {
      user_id: "user-uuid-here",
      items: [{ book_id: "book-id-1", seller_id: "seller-uuid", price: 150, title: "Sample Book" }],
      total_amount: 150,
      shipping_address: { street: "123 Main St", city: "Cape Town", province: "Western Cape", postal_code: "8001" },
      payment_reference: "PAY_" + Date.now()
    }
  },
  {
    name: "Initialize Paystack Payment",
    path: "/api/initialize-paystack-payment",
    method: "POST",
    description: "Initialize a Paystack payment with split configuration",
    requiredFields: ["user_id", "items", "total_amount", "email"],
    samplePayload: {
      user_id: "user-uuid-here",
      email: "test@example.com",
      total_amount: 150,
      items: [{ book_id: "book-id-1", seller_id: "seller-uuid", price: 150 }],
      shipping_address: { street: "123 Main St", city: "Cape Town" }
    }
  },
  {
    name: "Verify Paystack Payment",
    path: "/api/verify-paystack-payment",
    method: "POST",
    description: "Verify a Paystack payment transaction",
    requiredFields: ["reference"],
    samplePayload: { reference: "paystack-reference-here" }
  },
  {
    name: "Create Paystack Subaccount",
    path: "/api/create-paystack-subaccount",
    method: "POST",
    description: "Create a seller subaccount for split payments",
    requiredFields: ["user_id", "business_name", "bank_code", "account_number"],
    samplePayload: {
      user_id: "user-uuid-here",
      business_name: "Test Business",
      bank_code: "044",
      account_number: "0123456789",
      percentage_charge: 0.5
    }
  },
  {
    name: "Mark Order Collected",
    path: "/api/mark-collected",
    method: "POST",
    description: "Mark an order as collected from seller",
    requiredFields: ["order_id"],
    samplePayload: { order_id: "ORD_1234567890", collection_notes: "Package collected successfully" }
  },
  {
    name: "Pay Seller",
    path: "/api/pay-seller",
    method: "POST",
    description: "Process payment to seller after delivery",
    requiredFields: ["order_id"],
    samplePayload: { order_id: "ORD_1234567890", payment_notes: "Payment processed" }
  },
  {
    name: "Process Refund",
    path: "/api/process-refund",
    method: "POST",
    description: "Process a refund for a transaction",
    requiredFields: ["transaction_id", "reason"],
    samplePayload: { transaction_id: "TXN_1234567890", reason: "Customer requested refund", amount: 150 }
  },
  {
    name: "Auto Expire Commits",
    path: "/api/auto-expire-commits",
    method: "POST",
    description: "Automatically expire old order commits",
    requiredFields: [],
    samplePayload: {}
  },
  {
    name: "Check Expired Orders",
    path: "/api/check-expired-orders",
    method: "POST",
    description: "Check and handle expired orders",
    requiredFields: [],
    samplePayload: {}
  },
  {
    name: "Process Multi-Seller Purchase",
    path: "/api/process-multi-seller-purchase",
    method: "POST",
    description: "Process a purchase with multiple sellers",
    requiredFields: ["payment_reference", "user_id"],
    samplePayload: {
      payment_reference: "PAY_1234567890",
      user_id: "user-uuid-here"
    }
  },
  {
    name: "Paystack Webhook",
    path: "/api/paystack-webhook",
    method: "POST",
    description: "Handle Paystack webhook events",
    requiredFields: ["event"],
    samplePayload: {
      event: "charge.success",
      data: {
        reference: "paystack-reference-here",
        amount: 15000,
        status: "success"
      }
    }
  },
  {
    name: "Paystack Split Management",
    path: "/api/paystack-split-management",
    method: "POST",
    description: "Manage Paystack split payment configurations",
    requiredFields: ["action"],
    samplePayload: {
      action: "create",
      name: "Multi-seller Split",
      type: "percentage",
      currency: "ZAR",
      subaccounts: [
        {
          subaccount: "ACCT_xxx",
          share: 80
        }
      ]
    }
  }
];

interface TestResult {
  endpoint: string;
  status: number;
  statusText: string;
  data: any;
  success: boolean;
  error?: string;
}

export default function APIFunctionTester() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<APIEndpoint>(apiEndpoints[0]);
  const [requestBody, setRequestBody] = useState<string>(JSON.stringify(apiEndpoints[0].samplePayload, null, 2));
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // Test All functionality
  const [testingAll, setTestingAll] = useState(false);
  const [testAllResults, setTestAllResults] = useState<TestResult[]>([]);
  const [testAllProgress, setTestAllProgress] = useState(0);
  const [currentlyTesting, setCurrentlyTesting] = useState<string>("");

  const handleEndpointChange = (endpointName: string) => {
    const endpoint = apiEndpoints.find(e => e.name === endpointName);
    if (endpoint) {
      setSelectedEndpoint(endpoint);
      setRequestBody(JSON.stringify(endpoint.samplePayload, null, 2));
      setResponse(null);
      setError("");
    }
  };

  const testFunction = async () => {
    setLoading(true);
    setError("");
    setResponse(null);

    try {
      const parsedBody = JSON.parse(requestBody);
      
      const fetchResponse = await fetch(selectedEndpoint.path, {
        method: selectedEndpoint.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedBody),
      });

      const result = await fetchResponse.json();
      setResponse({
        status: fetchResponse.status,
        statusText: fetchResponse.statusText,
        data: result
      });

      if (fetchResponse.ok) {
        toast.success(`${selectedEndpoint.name} executed successfully`);
      } else {
        toast.error(`${selectedEndpoint.name} failed: ${result.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
      toast.error(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

    const testSingleFunction = async (endpoint: APIEndpoint, payload?: any): Promise<TestResult> => {
    try {
      const body = payload || endpoint.samplePayload;

      const fetchResponse = await fetch(endpoint.path, {
        method: endpoint.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await fetchResponse.json();

      return {
        endpoint: endpoint.name,
        status: fetchResponse.status,
        statusText: fetchResponse.statusText,
        data: result,
        success: fetchResponse.ok
      };
    } catch (err: any) {
      return {
        endpoint: endpoint.name,
        status: 0,
        statusText: "Network Error",
        data: null,
        success: false,
        error: err.message
      };
    }
  };

  const testAllFunctions = async () => {
    setTestingAll(true);
    setTestAllResults([]);
    setTestAllProgress(0);
    setResponse(null);
    setError("");

    const results: TestResult[] = [];

    for (let i = 0; i < apiEndpoints.length; i++) {
      const endpoint = apiEndpoints[i];
      setCurrentlyTesting(endpoint.name);
      setTestAllProgress(((i + 1) / apiEndpoints.length) * 100);

      const result = await testSingleFunction(endpoint);
      results.push(result);
      setTestAllResults([...results]);

      // Small delay between requests to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setCurrentlyTesting("");
    setTestingAll(false);

    const successCount = results.filter(r => r.success).length;
    const failCount = results.length - successCount;

    toast.success(`Test All completed: ${successCount} passed, ${failCount} failed`);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
        <Code className="h-5 w-5 text-yellow-600" />
        <h3 className="text-lg font-semibold">API Function Tester</h3>
        <Badge variant="outline" className="ml-auto">
          {apiEndpoints.length} Functions
        </Badge>
      </div>

      {/* Test All Section */}
      <Card className="border-2 border-dashed border-yellow-200 bg-yellow-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-600" />
              <CardTitle className="text-base">Test All Functions</CardTitle>
            </div>
            <Button
              onClick={testAllFunctions}
              disabled={testingAll || loading}
              variant="outline"
              size="sm"
              className="border-yellow-300 hover:bg-yellow-100"
            >
              <PlayCircle className="h-4 w-4 mr-2" />
              {testingAll ? "Testing..." : "Test All 12 Functions"}
            </Button>
          </div>
          {testingAll && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Testing: {currentlyTesting}</span>
                <span>{Math.round(testAllProgress)}%</span>
              </div>
              <Progress value={testAllProgress} className="h-2" />
            </div>
          )}
        </CardHeader>
        {testAllResults.length > 0 && (
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {testAllResults.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-white rounded border text-sm">
                  <span className="flex items-center gap-2">
                    {result.success ? (
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    ) : (
                      <AlertCircle className="h-3 w-3 text-red-600" />
                    )}
                    {result.endpoint}
                  </span>
                  <Badge variant={result.success ? "default" : "destructive"} className="text-xs">
                    {result.status || "ERR"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Function Selection & Configuration */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Select Function</CardTitle>
              <CardDescription>Choose an API function to test</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedEndpoint.name} onValueChange={handleEndpointChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {apiEndpoints.map((endpoint) => (
                    <SelectItem key={endpoint.name} value={endpoint.name}>
                      <div className="flex items-center gap-2">
                        <Badge variant={endpoint.method === "POST" ? "default" : "secondary"} className="text-xs">
                          {endpoint.method}
                        </Badge>
                        {endpoint.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Function Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground mb-2">{selectedEndpoint.description}</p>
                <div className="flex items-center gap-2 text-xs">
                  <Badge variant="outline">{selectedEndpoint.method}</Badge>
                  <code className="bg-muted px-2 py-1 rounded text-xs">{selectedEndpoint.path}</code>
                </div>
              </div>
              
              {selectedEndpoint.requiredFields.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-1">Required Fields:</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedEndpoint.requiredFields.map((field) => (
                      <Badge key={field} variant="secondary" className="text-xs">
                        {field}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Request Body</CardTitle>
              <CardDescription>Modify the JSON payload as needed</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={requestBody}
                onChange={(e) => setRequestBody(e.target.value)}
                className="font-mono text-xs"
                rows={12}
                placeholder="Enter JSON request body..."
              />
              <Button
                onClick={testFunction}
                disabled={loading}
                className="w-full mt-3"
                size="sm"
              >
                <Play className="h-4 w-4 mr-2" />
                {loading ? "Testing..." : `Test ${selectedEndpoint.name}`}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Response */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Response</CardTitle>
              {response && (
                <div className="flex items-center justify-between">
                  <Badge 
                    variant={response.status < 400 ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {response.status} {response.statusText}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(JSON.stringify(response.data, null, 2))}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {response && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    {response.status < 400 ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className="text-sm font-medium">
                      {response.status < 400 ? "Success" : "Error"}
                    </span>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <Textarea
                      value={JSON.stringify(response.data, null, 2)}
                      readOnly
                      className="font-mono text-xs"
                      rows={15}
                    />
                  </div>
                </div>
              )}

                            {!response && !error && !testingAll && testAllResults.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Select a function and click "Test" to see the response
                </div>
              )}

              {/* Test All Results Summary */}
              {!testingAll && testAllResults.length > 0 && (
                <div className="space-y-3 border-t pt-4 mt-4">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <PlayCircle className="h-4 w-4" />
                    Test All Results Summary
                  </h4>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                      <span className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        Passed
                      </span>
                      <Badge variant="default" className="bg-green-600">
                        {testAllResults.filter(r => r.success).length}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-red-50 rounded">
                      <span className="flex items-center gap-2">
                        <AlertCircle className="h-3 w-3 text-red-600" />
                        Failed
                      </span>
                      <Badge variant="destructive">
                        {testAllResults.filter(r => !r.success).length}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {testAllResults.filter(r => !r.success).map((result, index) => (
                      <div key={index} className="p-2 bg-red-50 rounded text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{result.endpoint}</span>
                          <Badge variant="destructive" className="text-xs">
                            {result.status || "ERR"}
                          </Badge>
                        </div>
                        {result.error && (
                          <div className="text-red-600 mt-1 truncate">
                            {result.error}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Tips */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Testing Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              <p>• Replace placeholder UUIDs with actual user IDs from your database</p>
              <p>• Ensure required environment variables are set (PAYSTACK_SECRET_KEY, etc.)</p>
              <p>• Some functions require valid database records to work properly</p>
              <p>• Check browser console for additional debug information</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

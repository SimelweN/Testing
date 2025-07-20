import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Code, Play, AlertCircle, CheckCircle, Copy, PlayCircle, Zap, Database, RefreshCw, AlertTriangle } from "lucide-react";
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

const SUPABASE_FUNCTIONS_BASE_URL = "https://kbpjqzaqbqukutflwixf.supabase.co/functions/v1";

const apiEndpoints: APIEndpoint[] = [
  {
    name: "Create Order",
    path: `${SUPABASE_FUNCTIONS_BASE_URL}/create-order`,
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
    path: `${SUPABASE_FUNCTIONS_BASE_URL}/initialize-paystack-payment`,
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
    path: `${SUPABASE_FUNCTIONS_BASE_URL}/verify-paystack-payment`,
    method: "POST",
    description: "Verify a Paystack payment transaction",
    requiredFields: ["reference"],
    samplePayload: { reference: "paystack-reference-here" }
  },
  {
    name: "Create Paystack Subaccount",
    path: `${SUPABASE_FUNCTIONS_BASE_URL}/create-paystack-subaccount`,
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
    path: `${SUPABASE_FUNCTIONS_BASE_URL}/mark-collected`,
    method: "POST",
    description: "Mark an order as collected from seller",
    requiredFields: ["order_id"],
    samplePayload: { order_id: "ORD_1234567890", collection_notes: "Package collected successfully" }
  },
  {
    name: "Pay Seller",
    path: `${SUPABASE_FUNCTIONS_BASE_URL}/pay-seller`,
    method: "POST",
    description: "Process payment to seller after delivery",
    requiredFields: ["order_id"],
    samplePayload: { order_id: "ORD_1234567890", payment_notes: "Payment processed" }
  },
  {
    name: "Paystack Refund Management",
    path: `${SUPABASE_FUNCTIONS_BASE_URL}/paystack-refund-management`,
    method: "POST",
    description: "Process a refund for a transaction",
    requiredFields: ["transaction_id", "reason"],
    samplePayload: { transaction_id: "TXN_1234567890", reason: "Customer requested refund", amount: 150 }
  },
  {
    name: "Auto Expire Commits",
    path: `${SUPABASE_FUNCTIONS_BASE_URL}/auto-expire-commits`,
    method: "POST",
    description: "Automatically expire old order commits",
    requiredFields: [],
    samplePayload: {}
  },
  {
    name: "Check Expired Orders",
    path: `${SUPABASE_FUNCTIONS_BASE_URL}/check-expired-orders`,
    method: "POST",
    description: "Check and handle expired orders",
    requiredFields: [],
    samplePayload: {}
  },
  {
    name: "Process Multi-Seller Purchase",
    path: `${SUPABASE_FUNCTIONS_BASE_URL}/process-multi-seller-purchase`,
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
    path: `${SUPABASE_FUNCTIONS_BASE_URL}/paystack-webhook`,
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
    path: `${SUPABASE_FUNCTIONS_BASE_URL}/paystack-split-management`,
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
  },
  {
    name: "Commit to Sale",
    path: `${SUPABASE_FUNCTIONS_BASE_URL}/commit-to-sale`,
    method: "POST",
    description: "Commit seller to an order",
    requiredFields: ["order_id", "seller_id"],
    samplePayload: {
      order_id: "ORD_1234567890",
      seller_id: "seller-uuid-here"
    }
  },
  {
    name: "Decline Commit",
    path: `${SUPABASE_FUNCTIONS_BASE_URL}/decline-commit`,
    method: "POST",
    description: "Decline an order commitment",
    requiredFields: ["order_id"],
    samplePayload: {
      order_id: "ORD_1234567890",
      reason: "Item no longer available"
    }
  },
  {
    name: "Automate Delivery",
    path: `${SUPABASE_FUNCTIONS_BASE_URL}/automate-delivery`,
    method: "POST",
    description: "Schedule automatic courier pickup and delivery",
    requiredFields: ["order_id", "seller_address", "buyer_address"],
    samplePayload: {
      order_id: "ORD_1234567890",
      seller_address: {
        streetAddress: "123 Seller Street",
        suburb: "Rosebank",
        city: "Johannesburg",
        province: "Gauteng",
        postalCode: "2196"
      },
      buyer_address: {
        streetAddress: "456 Buyer Ave",
        suburb: "Sandton",
        city: "Johannesburg",
        province: "Gauteng",
        postalCode: "2146"
      },
      weight: 0.5
    }
  },
  {
    name: "Get Delivery Quotes",
    path: `${SUPABASE_FUNCTIONS_BASE_URL}/get-delivery-quotes`,
    method: "POST",
    description: "Get delivery quotes from multiple courier services",
    requiredFields: ["from_address", "to_address"],
    samplePayload: {
      from_address: {
        streetAddress: "123 Pickup Street",
        suburb: "Rosebank",
        city: "Johannesburg",
        province: "Gauteng",
        postalCode: "2196"
      },
      to_address: {
        streetAddress: "456 Delivery Ave",
        suburb: "Sandton",
        city: "Johannesburg",
        province: "Gauteng",
        postalCode: "2146"
      },
      weight: 0.5,
      length: 20,
      width: 15,
      height: 10
    }
  },
  {
    name: "Send Email",
    path: `${SUPABASE_FUNCTIONS_BASE_URL}/send-email`,
    method: "POST",
    description: "Send transactional emails",
    requiredFields: ["to", "subject", "html"],
    samplePayload: {
      to: "test@example.com",
      from: "noreply@rebookedsolutions.co.za",
      subject: "Test Email",
      html: "<h1>Test Email</h1><p>This is a test email.</p>",
      text: "Test Email\n\nThis is a test email."
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

interface RealData {
  users: any[];
  orders: any[];
  books: any[];
  transactions: any[];
}

export default function APIFunctionTester() {
  const { user } = useAuth();
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

    // Real data for testing
  const [realData, setRealData] = useState<RealData>({ users: [], orders: [], books: [], transactions: [] });
  const [loadingRealData, setLoadingRealData] = useState(false);
  const [useRealData, setUseRealData] = useState(false);

  // Mock API mode for when real APIs are not available
  const [useMockMode, setUseMockMode] = useState(false);

    const fetchRealData = async () => {
    setLoadingRealData(true);
    try {
      // Fetch real users (profiles)
      const { data: users } = await supabase
        .from('profiles')
        .select('*')
        .limit(5);

      // Fetch real orders
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .limit(5);

      // Fetch real books
      const { data: books } = await supabase
        .from('books')
        .select('*')
        .limit(5);

      // Fetch real transactions
      const { data: transactions } = await supabase
        .from('payment_transactions')
        .select('*')
        .limit(5);

      setRealData({
        users: users || [],
        orders: orders || [],
        books: books || [],
        transactions: transactions || []
      });

      toast.success("Real data loaded successfully");
    } catch (error: any) {
      toast.error(`Failed to load real data: ${error.message}`);
    } finally {
      setLoadingRealData(false);
    }
  };

  const generateRealisticPayload = (endpoint: APIEndpoint) => {
    if (!useRealData || realData.users.length === 0) {
      return endpoint.samplePayload;
    }

    const realUser = realData.users[0];
    const realOrder = realData.orders[0];
    const realBook = realData.books[0];
    const realTransaction = realData.transactions[0];

    switch (endpoint.name) {
      case "Create Order":
        return {
          user_id: realUser.id,
          items: realBook ? [{
            book_id: realBook.id,
            seller_id: realBook.seller_id,
            price: realBook.price || 150,
            title: realBook.title || "Real Book"
          }] : endpoint.samplePayload.items,
          total_amount: realBook?.price || 150,
          shipping_address: {
            street: "123 Real Test St",
            city: "Cape Town",
            province: "Western Cape",
            postal_code: "8001"
          },
          payment_reference: "PAY_" + Date.now()
        };

      case "Initialize Paystack Payment":
        return {
          user_id: realUser.id,
          email: realUser.email,
          total_amount: realBook?.price || 150,
          items: realBook ? [{
            book_id: realBook.id,
            seller_id: realBook.seller_id,
            price: realBook.price || 150
          }] : endpoint.samplePayload.items,
          shipping_address: { street: "123 Real Test St", city: "Cape Town" }
        };

      case "Mark Order Collected":
      case "Pay Seller":
        return {
          order_id: realOrder?.id || "ORD_test_" + Date.now(),
          collection_notes: "Test collection/payment"
        };

      case "Process Refund":
        return {
          transaction_id: realTransaction?.id || "TXN_test_" + Date.now(),
          reason: "Test refund",
          amount: 150
        };

      case "Process Multi-Seller Purchase":
        return {
          payment_reference: realTransaction?.reference || "PAY_test_" + Date.now(),
          user_id: realUser.id
        };

      case "Create Paystack Subaccount":
        return {
          user_id: realUser.id,
          business_name: `${realUser.name || 'Test'} Books`,
          bank_code: "044",
          account_number: "0123456789",
          percentage_charge: 0.5
        };

      default:
        return endpoint.samplePayload;
    }
  };

  const handleEndpointChange = (endpointName: string) => {
    const endpoint = apiEndpoints.find(e => e.name === endpointName);
    if (endpoint) {
      setSelectedEndpoint(endpoint);
      const payload = generateRealisticPayload(endpoint);
      setRequestBody(JSON.stringify(payload, null, 2));
      setResponse(null);
      setError("");
    }
  };

  // Auto-update payload when useRealData changes
  useEffect(() => {
    if (selectedEndpoint) {
      const payload = generateRealisticPayload(selectedEndpoint);
      setRequestBody(JSON.stringify(payload, null, 2));
    }
  }, [useRealData, realData]);

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

      // Handle response reading safely
      let result;
      try {
        result = await fetchResponse.json();
      } catch {
        // If JSON parsing fails, try reading as text
        const responseClone = fetchResponse.clone();
        try {
          const responseText = await responseClone.text();
          result = { message: responseText || "Empty response" };
        } catch {
          result = { message: "Failed to read response" };
        }
      }

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

          const generateMockResponse = (endpoint: APIEndpoint): TestResult => {
    // Generate realistic mock responses for each endpoint
        const mockResponses: Record<string, any> = {
      "Create Order": {
        success: true,
        orders: [{
          id: "ORD_" + Date.now(),
          buyer_id: "user-123",
          seller_id: "seller-456",
          status: "pending_commit",
          total_amount: 150,
          created_at: new Date().toISOString()
        }],
        message: "Created 1 order(s) successfully"
      },
      "Initialize Paystack Payment": {
        success: true,
        data: {
          authorization_url: "https://checkout.paystack.com/mock-session",
          reference: "PSK_" + Date.now(),
          access_code: "mock_access_code"
        }
      },
      "Verify Paystack Payment": {
        success: true,
        data: {
          reference: "PSK_verified",
          amount: 15000,
          status: "success",
          gateway_response: "Successful"
        }
      },
      "Create Paystack Subaccount": {
        success: true,
        data: {
          subaccount_code: "ACCT_mock_" + Date.now(),
          business_name: "Mock Business",
          account_number: "0123456789"
        }
      },
      "Mark Order Collected": {
        success: true,
        message: "Order marked as collected successfully",
        order_id: "ORD_collected_" + Date.now()
      },
      "Pay Seller": {
        success: true,
        message: "Payment processed successfully",
        payment_reference: "PAY_" + Date.now()
      },
      "Paystack Refund Management": {
        success: true,
        message: "Refund processed successfully",
        refund_reference: "REF_" + Date.now()
      },
      "Auto Expire Commits": {
        success: true,
        expired_orders: 3,
        message: "Processed 3 expired orders"
      },
      "Check Expired Orders": {
        success: true,
        expired_orders: [{
          id: "ORD_exp_" + Date.now(),
          status: "expired"
        }],
        count: 1
      },
      "Process Multi-Seller Purchase": {
        success: true,
        orders_created: 2,
        message: "Multi-seller purchase processed"
      },
      "Paystack Webhook": {
        success: true,
        event: "charge.success",
        message: "Webhook processed successfully"
      },
      "Paystack Split Management": {
        success: true,
        split_code: "SPL_mock_" + Date.now(),
        message: "Split payment configuration created"
      },
      "Commit to Sale": {
        success: true,
        message: "Order commitment successful",
        order_id: "ORD_committed_" + Date.now()
      },
      "Decline Commit": {
        success: true,
        message: "Order commitment declined",
        order_id: "ORD_declined_" + Date.now()
      },
      "Automate Delivery": {
        success: true,
        message: "Delivery automation scheduled",
        tracking_number: "TRK_" + Date.now(),
        pickup_scheduled: new Date(Date.now() + 24*60*60*1000).toISOString()
      },
      "Get Delivery Quotes": {
        success: true,
        quotes: [
          {
            courier: "Courier Guy",
            price: 65.50,
            delivery_time: "1-2 business days"
          },
          {
            courier: "Fastway",
            price: 72.00,
            delivery_time: "2-3 business days"
          },
          {
            courier: "ShipLogic",
            price: 58.75,
            delivery_time: "1-3 business days"
          }
        ]
      },
      "Send Email": {
        success: true,
        message: "Email sent successfully",
        email_id: "EMAIL_" + Date.now()
      }
    };

    return {
      endpoint: endpoint.name,
      status: 200,
      statusText: "OK (Mock)",
      data: mockResponses[endpoint.name] || { success: true, message: "Mock response" },
      success: true
    };
  };

  const testSingleFunction = async (endpoint: APIEndpoint, payload?: any): Promise<TestResult> => {
    // If mock mode is enabled, return mock response immediately
    if (useMockMode) {
      // Add a small delay to simulate network request
      await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
      return generateMockResponse(endpoint);
    }

    try {
      const body = payload || endpoint.samplePayload;

      const fetchResponse = await fetch(endpoint.path, {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
          'X-Test-Mode': 'true', // Add test mode header
          'X-Admin-Test': user?.id || 'admin-test'
        },
        body: JSON.stringify(body),
      });

            // Capture response properties before reading the body
      const status = fetchResponse.status;
      const statusText = fetchResponse.statusText;
      const isOk = fetchResponse.ok;

      // Handle different response types
      let result;
      try {
        // Clone the response to avoid "body stream already read" error
        const responseClone = fetchResponse.clone();

        // First, try to read as JSON
        try {
          result = await fetchResponse.json();
        } catch {
          // If JSON parsing fails, try reading as text from the clone
          try {
            const responseText = await responseClone.text();
            result = responseText ? { message: responseText } : { message: "Empty response" };
          } catch {
            result = { message: "Failed to read response" };
          }
        }
      } catch (error) {
        result = { message: "Failed to read response", error: error.message };
      }

      return {
        endpoint: endpoint.name,
        status,
        statusText,
        data: result,
        success: isOk
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

                  {/* Supabase Functions Info */}
      <Alert className="border-blue-500 bg-blue-50 text-blue-800">
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Using Supabase Edge Functions:</strong> All endpoints now point to your Supabase project
          (<code>https://kbpjqzaqbqukutflwixf.supabase.co/functions/v1/</code>).
          If functions return errors, use <strong>"Mock Mode"</strong> to test with simulated responses,
          or ensure the functions are properly deployed with <code>supabase functions deploy</code>.
        </AlertDescription>
      </Alert>

      {/* Real Data Controls */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-blue-600" />
              <CardTitle className="text-base">Data Source</CardTitle>
                            <Badge variant={useRealData ? "default" : "secondary"}>
                {useRealData ? "Real Database Data" : "Mock Test Data"}
              </Badge>
              {useMockMode && (
                <Badge variant="destructive" className="ml-2">
                  Mock API Mode
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setUseMockMode(!useMockMode)}
                variant={useMockMode ? "destructive" : "outline"}
                size="sm"
                className="border-orange-300"
              >
                {useMockMode ? "Disable Mock Mode" : "Enable Mock Mode"}
              </Button>
              <Button
                onClick={fetchRealData}
                disabled={loadingRealData || useMockMode}
                variant="outline"
                size="sm"
                className="border-blue-300"
              >
                <RefreshCw className={`h-3 w-3 mr-2 ${loadingRealData ? 'animate-spin' : ''}`} />
                Load Real Data
              </Button>
              <Button
                onClick={() => setUseRealData(!useRealData)}
                disabled={realData.users.length === 0 || useMockMode}
                variant={useRealData ? "default" : "outline"}
                size="sm"
              >
                {useRealData ? "Using Real Data" : "Use Real Data"}
              </Button>
            </div>
          </div>
          {realData.users.length > 0 && (
            <div className="flex gap-4 text-xs text-blue-700">
              <span>{realData.users.length} Users</span>
              <span>{realData.orders.length} Orders</span>
              <span>{realData.books.length} Books</span>
              <span>{realData.transactions.length} Transactions</span>
            </div>
          )}
        </CardHeader>
      </Card>

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
                            {testingAll ? "Testing..." : `Test All ${apiEndpoints.length} Functions`}
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
                            <p>• <strong>Mock Mode:</strong> Use when API endpoints are not available (404 errors)</p>
              <p>• <strong>Load Real Data</strong> first to get actual database IDs</p>
              <p>• <strong>Use Real Data</strong> toggle for realistic test scenarios</p>
              <p>• Functions send X-Test-Mode header to indicate admin testing</p>
              <p>• 404 errors mean API endpoints aren't deployed/configured properly</p>
              <p>• Check browser console for detailed error information</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

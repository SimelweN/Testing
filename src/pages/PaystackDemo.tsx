import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  CreditCard, 
  Webhook, 
  Building2, 
  DollarSign, 
  CheckCircle,
  XCircle,
  RefreshCw,
  Copy,
  Play,
  AlertTriangle,
  ArrowLeftRight,
  Eye,
  TestTube,
  Settings,
  Zap,
  FileText,
  Split,
  TrendingUp
} from "lucide-react";
import Layout from "@/components/Layout";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Demo test data as provided in the user prompt
const DEMO_DATA = {
  testCards: [
    { number: "4084 0840 8408 4081", expiry: "Any", cvv: "Any", type: "Success Card" },
    { number: "4084 0840 8408 4082", expiry: "Any", cvv: "Any", type: "Declined Card" },
  ],
  testCustomer: {
    email: "test@example.com",
    name: "Demo Student"
  },
  testAmount: 5000, // R50.00 in cents
  webhookEvents: [
    {
      event: "charge.success",
      description: "Payment completed successfully",
      sample: {
        event: "charge.success",
        data: {
          amount: 5000,
          currency: "ZAR",
          customer: { email: "test@example.com" },
          metadata: { order_id: "demo-order-123" },
          reference: "demo_ref_12345",
          status: "success"
        }
      }
    },
    {
      event: "charge.failed",
      description: "Payment failed or declined",
      sample: {
        event: "charge.failed",
        data: {
          amount: 5000,
          currency: "ZAR",
          customer: { email: "test@example.com" },
          metadata: { order_id: "demo-order-124" },
          reference: "demo_ref_12346",
          status: "failed"
        }
      }
    }
  ],
  testSubaccount: {
    business_name: "Demo University Bookstore",
    settlement_bank: "044",
    account_number: "0193274682",
    percentage_charge: 90, // Seller gets 90%
  }
};

const PaystackDemo = () => {
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [results, setResults] = useState<{ [key: string]: any }>({});
  const [functionStatus, setFunctionStatus] = useState<{ [key: string]: any }>({});
  const [environmentStatus, setEnvironmentStatus] = useState<any>(null);

  // Form states for different functions
  const [paymentForm, setPaymentForm] = useState({
    email: DEMO_DATA.testCustomer.email,
    amount: "50.00",
    userId: "demo-user-123"
  });

  const [subaccountForm, setSubaccountForm] = useState({
    businessName: DEMO_DATA.testSubaccount.business_name,
    email: "seller@example.com",
    bankCode: DEMO_DATA.testSubaccount.settlement_bank,
    accountNumber: DEMO_DATA.testSubaccount.account_number
  });

  const [transferForm, setTransferForm] = useState({
    sellerId: "demo-seller-789",
    amount: "45.00",
    orderId: "demo-order-123"
  });

  const [refundForm, setRefundForm] = useState({
    transactionReference: "",
    amount: "50.00",
    reason: "Customer requested refund"
  });

  const [verifyForm, setVerifyForm] = useState({
    reference: ""
  });

  const [splitForm, setSplitForm] = useState({
    name: "Demo Order Split",
    type: "flat",
    currency: "ZAR"
  });

  const setTestLoading = (key: string, value: boolean) => {
    setLoading(prev => ({ ...prev, [key]: value }));
  };

    const setTestResult = (key: string, value: any) => {
    setResults(prev => ({ ...prev, [key]: value }));
  };

  // Function to check all Paystack functions availability
  const checkAllFunctions = async () => {
    setTestLoading("function-check", true);
    const functions = [
      "initialize-paystack-payment",
      "verify-paystack-payment",
      "create-paystack-subaccount",
      "manage-paystack-subaccount",
      "pay-seller",
      "paystack-refund-management",
      "paystack-transfer-management",
      "paystack-split-management",
      "paystack-webhook"
    ];

    const status = {};
    const environmentData = {
      supabaseUrl: supabase.supabaseUrl,
      supabaseKey: supabase.supabaseKey?.substring(0, 20) + "...",
      timestamp: new Date().toISOString()
    };

    for (const funcName of functions) {
      try {
        console.log(`🔍 Checking function: ${funcName}`);

                // Just try to call the function - don't worry about health check
        const response = await supabase.functions.invoke(funcName, {
          body: { test: true }
        });

        // Function is available if we get any response (even error responses)
        const isAvailable = response.error?.name !== 'FunctionsHttpError';

        status[funcName] = {
          available: isAvailable,
          error: response.error,
          data: response.data,
          errorType: response.error?.name,
          description: isAvailable ? "Function responded" : "Function not accessible"
        };

        console.log(`✅ ${funcName} status:`, status[funcName]);
      } catch (error) {
        status[funcName] = {
          available: false,
          error: error,
          healthCheck: false,
          errorMessage: error.message
        };
        console.error(`❌ ${funcName} failed:`, error);
      }
    }

    setFunctionStatus(status);
    setEnvironmentStatus(environmentData);
    setTestLoading("function-check", false);

    const availableCount = Object.values(status).filter((s: any) => s.available).length;
    const totalCount = functions.length;

        if (availableCount === totalCount) {
      toast.success(`✅ All ${totalCount} functions are available!`);
    } else {
      toast.error(`❌ Only ${availableCount}/${totalCount} functions are available`);
    }
  };

    // Direct HTTP test (bypass Supabase client)
  const testDirectHTTP = async () => {
    setTestLoading("direct-http", true);
    try {
      const supabaseUrl = supabase.supabaseUrl;
      const functionUrl = `${supabaseUrl}/functions/v1/initialize-paystack-payment`;

      console.log(`🔗 Testing direct HTTP call to: ${functionUrl}`);

      // Try health check with proper health parameter
      const healthResponse = await fetch(`${functionUrl}?health=true`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabase.supabaseKey}`
        }
      });

      // Clone the response to read it multiple times if needed
      const responseClone = healthResponse.clone();
      const responseText = await responseClone.text();

      console.log(`📡 Direct HTTP health response:`, {
        status: healthResponse.status,
        statusText: healthResponse.statusText,
        headers: Object.fromEntries(healthResponse.headers.entries()),
        body: responseText
      });

      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = responseText;
      }

      setTestResult("direct-http", {
        success: healthResponse.ok,
        status: healthResponse.status,
        statusText: healthResponse.statusText,
        data: responseData,
        url: functionUrl,
        method: 'GET with health=true'
      });

      if (healthResponse.ok) {
        toast.success("✅ Direct HTTP health check successful!");
      } else {
        toast.error(`❌ Direct HTTP failed: ${healthResponse.status} ${healthResponse.statusText}`);
      }
    } catch (error) {
      console.error("Direct HTTP test failed:", error);
      setTestResult("direct-http", {
        success: false,
        error: error.message,
        errorType: error.constructor.name
      });
      toast.error("Direct HTTP test failed: " + error.message);
    } finally {
      setTestLoading("direct-http", false);
    }
  };

      // Helper function for better error handling
  const debugFunctionCall = async (functionName: string, payload: any) => {
    console.log(`🔍 Calling function: ${functionName}`);
    console.log(`📤 Payload:`, payload);

    try {
      // Skip health check for now and go straight to the actual call
      const response = await supabase.functions.invoke(functionName, {
        body: payload
      });

      console.log(`📥 Response from ${functionName}:`, response);

      // Log additional debug info
      console.log(`🔍 Debug info:`, {
        functionName,
        hasError: !!response.error,
        hasData: !!response.data,
        errorType: response.error?.name,
        errorContext: response.error?.context
      });

      return response;
    } catch (error) {
      console.error(`❌ Error calling ${functionName}:`, error);
      return { error, data: null };
    }
  };

  // 1. Initialize Payment Function
  const testInitializePayment = async () => {
    setTestLoading("init-payment", true);
    try {
      const payload = {
        email: paymentForm.email,
        amount: parseFloat(paymentForm.amount),
        user_id: paymentForm.userId,
        items: [
          {
            book_id: "demo-book-456",
            title: "Test Textbook",
            price: parseFloat(paymentForm.amount),
            seller_id: "demo-seller-789"
          }
        ],
        metadata: {
          order_id: "demo-order-" + Date.now(),
          test_mode: true
        }
      };

      const response = await debugFunctionCall("initialize-paystack-payment", payload);

      setTestResult("init-payment", {
        success: !response.error,
        data: response.data,
        error: response.error,
        debug: {
          functionName: "initialize-paystack-payment",
          payload,
          rawResponse: response
        }
      });

      if (response.data) {
        toast.success("✅ Payment initialization successful!");
      } else {
        toast.error("❌ Payment initialization failed - check console for details");
      }
    } catch (error) {
      console.error("Caught error in testInitializePayment:", error);
      setTestResult("init-payment", {
        success: false,
        error: error.message || error,
        debug: {
          caughtError: error,
          errorType: typeof error,
          errorConstructor: error?.constructor?.name
        }
      });
      toast.error("Payment test failed: " + (error.message || "Unknown error"));
    } finally {
      setTestLoading("init-payment", false);
    }
  };

  // 2. Verify Payment Function
  const testVerifyPayment = async () => {
    setTestLoading("verify-payment", true);
    try {
      const response = await supabase.functions.invoke("verify-paystack-payment", {
        body: {
          reference: verifyForm.reference
        }
      });

      setTestResult("verify-payment", {
        success: !response.error,
        data: response.data,
        error: response.error
      });

      if (response.data) {
        toast.success("✅ Payment verification successful!");
      } else {
        toast.error("❌ Payment verification failed");
      }
    } catch (error) {
      setTestResult("verify-payment", {
        success: false,
        error: error.message
      });
      toast.error("Verify test failed: " + error.message);
    } finally {
      setTestLoading("verify-payment", false);
    }
  };

  // 3. Create Subaccount Function
  const testCreateSubaccount = async () => {
    setTestLoading("create-subaccount", true);
    try {
      const response = await supabase.functions.invoke("create-paystack-subaccount", {
        body: {
          business_name: subaccountForm.businessName,
          email: subaccountForm.email,
          bank_code: subaccountForm.bankCode,
          account_number: subaccountForm.accountNumber,
          user_id: "demo-seller-789"
        }
      });

      setTestResult("create-subaccount", {
        success: !response.error,
        data: response.data,
        error: response.error
      });

      if (response.data) {
        toast.success("✅ Subaccount creation successful!");
      } else {
        toast.error("❌ Subaccount creation failed");
      }
    } catch (error) {
      setTestResult("create-subaccount", {
        success: false,
        error: error.message
      });
      toast.error("Subaccount test failed: " + error.message);
    } finally {
      setTestLoading("create-subaccount", false);
    }
  };

  // 4. Manage Subaccount Function
  const testManageSubaccount = async () => {
    setTestLoading("manage-subaccount", true);
    try {
      const response = await supabase.functions.invoke("manage-paystack-subaccount", {
        body: {
          action: "fetch",
          subaccount_code: "ACCT_demo123456789"
        }
      });

      setTestResult("manage-subaccount", {
        success: !response.error,
        data: response.data,
        error: response.error
      });

      if (response.data) {
        toast.success("✅ Subaccount management successful!");
      } else {
        toast.error("❌ Subaccount management failed");
      }
    } catch (error) {
      setTestResult("manage-subaccount", {
        success: false,
        error: error.message
      });
      toast.error("Manage subaccount test failed: " + error.message);
    } finally {
      setTestLoading("manage-subaccount", false);
    }
  };

  // 5. Pay Seller Function
  const testPaySeller = async () => {
    setTestLoading("pay-seller", true);
    try {
      const response = await supabase.functions.invoke("pay-seller", {
        body: {
          seller_id: transferForm.sellerId,
          amount: parseFloat(transferForm.amount) * 100, // Convert to cents
          reference: "demo_transfer_" + Date.now(),
          order_id: transferForm.orderId
        }
      });

      setTestResult("pay-seller", {
        success: !response.error,
        data: response.data,
        error: response.error
      });

      if (response.data) {
        toast.success("✅ Seller payment successful!");
      } else {
        toast.error("❌ Seller payment failed");
      }
    } catch (error) {
      setTestResult("pay-seller", {
        success: false,
        error: error.message
      });
      toast.error("Pay seller test failed: " + error.message);
    } finally {
      setTestLoading("pay-seller", false);
    }
  };

  // 6. Refund Management Function
  const testRefundManagement = async () => {
    setTestLoading("refund-mgmt", true);
    try {
      const response = await supabase.functions.invoke("paystack-refund-management", {
        body: {
          action: "initiate",
          transaction_reference: refundForm.transactionReference,
          amount: parseFloat(refundForm.amount) * 100, // Convert to cents
          reason: refundForm.reason
        }
      });

      setTestResult("refund-mgmt", {
        success: !response.error,
        data: response.data,
        error: response.error
      });

      if (response.data) {
        toast.success("✅ Refund management successful!");
      } else {
        toast.error("❌ Refund management failed");
      }
    } catch (error) {
      setTestResult("refund-mgmt", {
        success: false,
        error: error.message
      });
      toast.error("Refund test failed: " + error.message);
    } finally {
      setTestLoading("refund-mgmt", false);
    }
  };

  // 7. Transfer Management Function
  const testTransferManagement = async () => {
    setTestLoading("transfer-mgmt", true);
    try {
      const response = await supabase.functions.invoke("paystack-transfer-management", {
        body: {
          action: "initiate",
          recipient_code: "RCP_demo123456789",
          amount: parseFloat(transferForm.amount) * 100,
          reason: "Seller payout for order " + transferForm.orderId
        }
      });

      setTestResult("transfer-mgmt", {
        success: !response.error,
        data: response.data,
        error: response.error
      });

      if (response.data) {
        toast.success("✅ Transfer management successful!");
      } else {
        toast.error("❌ Transfer management failed");
      }
    } catch (error) {
      setTestResult("transfer-mgmt", {
        success: false,
        error: error.message
      });
      toast.error("Transfer management test failed: " + error.message);
    } finally {
      setTestLoading("transfer-mgmt", false);
    }
  };

  // 8. Split Management Function
  const testSplitManagement = async () => {
    setTestLoading("split-mgmt", true);
    try {
      const response = await supabase.functions.invoke("paystack-split-management", {
        body: {
          action: "create",
          name: splitForm.name,
          type: splitForm.type,
          currency: splitForm.currency,
          order_items: [
            {
              book_id: "demo-book-456",
              seller_id: "demo-seller-789",
              price: 50.00
            }
          ]
        }
      });

      setTestResult("split-mgmt", {
        success: !response.error,
        data: response.data,
        error: response.error
      });

      if (response.data) {
        toast.success("✅ Split management successful!");
      } else {
        toast.error("❌ Split management failed");
      }
    } catch (error) {
      setTestResult("split-mgmt", {
        success: false,
        error: error.message
      });
      toast.error("Split management test failed: " + error.message);
    } finally {
      setTestLoading("split-mgmt", false);
    }
  };

  // 9. Webhook Simulation Function
  const testWebhook = async (eventType: string) => {
    setTestLoading(`webhook-${eventType}`, true);
    try {
      const webhookData = DEMO_DATA.webhookEvents.find(e => e.event === eventType);
      
      const response = await supabase.functions.invoke("paystack-webhook", {
        body: webhookData?.sample
      });

      setTestResult(`webhook-${eventType}`, {
        success: !response.error,
        data: response.data,
        error: response.error
      });

      if (response.data) {
        toast.success(`✅ Webhook ${eventType} processed successfully!`);
      } else {
        toast.error(`❌ Webhook ${eventType} failed`);
      }
    } catch (error) {
      setTestResult(`webhook-${eventType}`, {
        success: false,
        error: error.message
      });
      toast.error(`Webhook test failed: ${error.message}`);
    } finally {
      setTestLoading(`webhook-${eventType}`, false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const TestResultCard = ({ testKey, title }: { testKey: string; title: string }) => {
    const result = results[testKey];
    if (!result) return null;

    return (
      <Alert className={`mt-4 ${result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
        <div className="flex items-center gap-2 mb-2">
          {result.success ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <XCircle className="h-4 w-4 text-red-600" />
          )}
          <span className="font-semibold">
            {title} {result.success ? 'Success' : 'Failed'}
          </span>
        </div>
        <AlertDescription>
          <pre className="text-xs bg-white/50 p-2 rounded overflow-auto max-h-40">
            {JSON.stringify(result, null, 2)}
          </pre>
        </AlertDescription>
      </Alert>
    );
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
                    <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Complete Paystack Functions Demo</h1>
            <p className="text-gray-600">
              Test all Paystack functionality with demo data and live edge function calls
            </p>
          </div>

          {/* Environment Diagnostics */}
          <Card className="mb-6 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                Environment Diagnostics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    Check if all Paystack edge functions are deployed and accessible
                  </p>
                  {environmentStatus && (
                    <div className="text-xs text-gray-500 space-y-1">
                      <div>Supabase URL: {environmentStatus.supabaseUrl}</div>
                      <div>API Key: {environmentStatus.supabaseKey}</div>
                      <div>Last Check: {new Date(environmentStatus.timestamp).toLocaleString()}</div>
                    </div>
                  )}
                </div>
                                <div className="flex gap-2">
                  <Button
                    onClick={checkAllFunctions}
                    disabled={loading["function-check"]}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {loading["function-check"] ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <TestTube className="h-4 w-4 mr-2" />
                    )}
                    Check Functions
                  </Button>
                  <Button
                    onClick={testDirectHTTP}
                    disabled={loading["direct-http"]}
                    variant="outline"
                  >
                    {loading["direct-http"] ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Zap className="h-4 w-4 mr-2" />
                    )}
                    Direct HTTP Test
                  </Button>
                </div>
              </div>

              {Object.keys(functionStatus).length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-4">
                  {Object.entries(functionStatus).map(([funcName, status]: [string, any]) => (
                    <div
                      key={funcName}
                      className={`flex items-center gap-2 p-2 rounded text-xs ${
                        status.available
                          ? 'bg-green-100 text-green-800 border border-green-200'
                          : 'bg-red-100 text-red-800 border border-red-200'
                      }`}
                    >
                      {status.available ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      <span className="truncate">{funcName}</span>
                    </div>
                  ))}
                </div>
              )}

                            {Object.keys(functionStatus).length > 0 && (
                <Alert className="mt-4">
                  <AlertDescription>
                    <details>
                      <summary className="cursor-pointer font-semibold">Function Status Details</summary>
                      <pre className="text-xs mt-2 bg-gray-50 p-2 rounded overflow-auto max-h-40">
                        {JSON.stringify(functionStatus, null, 2)}
                      </pre>
                    </details>
                  </AlertDescription>
                </Alert>
              )}

              <TestResultCard testKey="direct-http" title="Direct HTTP Test" />
            </CardContent>
          </Card>

          <Tabs defaultValue="payment" className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="payment">Payments</TabsTrigger>
              <TabsTrigger value="subaccounts">Subaccounts</TabsTrigger>
              <TabsTrigger value="transfers">Transfers</TabsTrigger>
              <TabsTrigger value="refunds">Refunds</TabsTrigger>
              <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
              <TabsTrigger value="management">Management</TabsTrigger>
            </TabsList>

            {/* Payment Functions */}
            <TabsContent value="payment">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Initialize Payment */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Initialize Payment
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="pay-email">Customer Email</Label>
                      <Input
                        id="pay-email"
                        value={paymentForm.email}
                        onChange={(e) => setPaymentForm(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pay-amount">Amount (ZAR)</Label>
                      <Input
                        id="pay-amount"
                        type="number"
                        step="0.01"
                        value={paymentForm.amount}
                        onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pay-user">User ID</Label>
                      <Input
                        id="pay-user"
                        value={paymentForm.userId}
                        onChange={(e) => setPaymentForm(prev => ({ ...prev, userId: e.target.value }))}
                      />
                    </div>

                    <Button
                      onClick={testInitializePayment}
                      disabled={loading["init-payment"]}
                      className="w-full"
                    >
                      {loading["init-payment"] ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4 mr-2" />
                      )}
                      Test Initialize Payment
                    </Button>

                    <TestResultCard testKey="init-payment" title="Initialize Payment" />
                  </CardContent>
                </Card>

                {/* Verify Payment */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      Verify Payment
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="verify-ref">Payment Reference</Label>
                      <Input
                        id="verify-ref"
                        value={verifyForm.reference}
                        onChange={(e) => setVerifyForm(prev => ({ ...prev, reference: e.target.value }))}
                        placeholder="Enter payment reference to verify"
                      />
                    </div>

                    <Button
                      onClick={testVerifyPayment}
                      disabled={loading["verify-payment"] || !verifyForm.reference}
                      className="w-full"
                    >
                      {loading["verify-payment"] ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Eye className="h-4 w-4 mr-2" />
                      )}
                      Test Verify Payment
                    </Button>

                    <TestResultCard testKey="verify-payment" title="Verify Payment" />
                  </CardContent>
                </Card>

                {/* Test Card Information */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Test Card Numbers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {DEMO_DATA.testCards.map((card, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <div>
                            <Badge className="mr-2">{card.type}</Badge>
                            <code className="text-sm">{card.number}</code>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(card.number)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Subaccount Functions */}
            <TabsContent value="subaccounts">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Create Subaccount */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Create Subaccount
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="sub-business">Business Name</Label>
                      <Input
                        id="sub-business"
                        value={subaccountForm.businessName}
                        onChange={(e) => setSubaccountForm(prev => ({ ...prev, businessName: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sub-email">Email</Label>
                      <Input
                        id="sub-email"
                        type="email"
                        value={subaccountForm.email}
                        onChange={(e) => setSubaccountForm(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sub-bank">Bank Code</Label>
                      <Input
                        id="sub-bank"
                        value={subaccountForm.bankCode}
                        onChange={(e) => setSubaccountForm(prev => ({ ...prev, bankCode: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sub-account">Account Number</Label>
                      <Input
                        id="sub-account"
                        value={subaccountForm.accountNumber}
                        onChange={(e) => setSubaccountForm(prev => ({ ...prev, accountNumber: e.target.value }))}
                      />
                    </div>

                    <Button
                      onClick={testCreateSubaccount}
                      disabled={loading["create-subaccount"]}
                      className="w-full"
                    >
                      {loading["create-subaccount"] ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Building2 className="h-4 w-4 mr-2" />
                      )}
                      Test Create Subaccount
                    </Button>

                    <TestResultCard testKey="create-subaccount" title="Create Subaccount" />
                  </CardContent>
                </Card>

                {/* Manage Subaccount */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Manage Subaccount
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Alert>
                      <AlertDescription>
                        This tests the manage-paystack-subaccount function which can fetch, update, or delete subaccounts.
                      </AlertDescription>
                    </Alert>

                    <Button
                      onClick={testManageSubaccount}
                      disabled={loading["manage-subaccount"]}
                      className="w-full"
                    >
                      {loading["manage-subaccount"] ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Settings className="h-4 w-4 mr-2" />
                      )}
                      Test Manage Subaccount
                    </Button>

                    <TestResultCard testKey="manage-subaccount" title="Manage Subaccount" />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Transfer Functions */}
            <TabsContent value="transfers">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pay Seller */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Pay Seller
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="transfer-seller">Seller ID</Label>
                      <Input
                        id="transfer-seller"
                        value={transferForm.sellerId}
                        onChange={(e) => setTransferForm(prev => ({ ...prev, sellerId: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="transfer-amount">Amount (ZAR)</Label>
                      <Input
                        id="transfer-amount"
                        type="number"
                        step="0.01"
                        value={transferForm.amount}
                        onChange={(e) => setTransferForm(prev => ({ ...prev, amount: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="transfer-order">Order ID</Label>
                      <Input
                        id="transfer-order"
                        value={transferForm.orderId}
                        onChange={(e) => setTransferForm(prev => ({ ...prev, orderId: e.target.value }))}
                      />
                    </div>

                    <Button
                      onClick={testPaySeller}
                      disabled={loading["pay-seller"]}
                      className="w-full"
                    >
                      {loading["pay-seller"] ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <DollarSign className="h-4 w-4 mr-2" />
                      )}
                      Test Pay Seller
                    </Button>

                    <TestResultCard testKey="pay-seller" title="Pay Seller" />
                  </CardContent>
                </Card>

                {/* Transfer Management */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ArrowLeftRight className="h-5 w-5" />
                      Transfer Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Alert>
                      <AlertDescription>
                        This tests the paystack-transfer-management function for advanced transfer operations.
                      </AlertDescription>
                    </Alert>

                    <Button
                      onClick={testTransferManagement}
                      disabled={loading["transfer-mgmt"]}
                      className="w-full"
                    >
                      {loading["transfer-mgmt"] ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <ArrowLeftRight className="h-4 w-4 mr-2" />
                      )}
                      Test Transfer Management
                    </Button>

                    <TestResultCard testKey="transfer-mgmt" title="Transfer Management" />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Refund Functions */}
            <TabsContent value="refunds">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Refund Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="refund-ref">Transaction Reference</Label>
                      <Input
                        id="refund-ref"
                        value={refundForm.transactionReference}
                        onChange={(e) => setRefundForm(prev => ({ ...prev, transactionReference: e.target.value }))}
                        placeholder="Enter transaction reference to refund"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="refund-amount">Refund Amount (ZAR)</Label>
                      <Input
                        id="refund-amount"
                        type="number"
                        step="0.01"
                        value={refundForm.amount}
                        onChange={(e) => setRefundForm(prev => ({ ...prev, amount: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="refund-reason">Reason</Label>
                      <Textarea
                        id="refund-reason"
                        value={refundForm.reason}
                        onChange={(e) => setRefundForm(prev => ({ ...prev, reason: e.target.value }))}
                        placeholder="Reason for refund"
                      />
                    </div>

                    <Button
                      onClick={testRefundManagement}
                      disabled={loading["refund-mgmt"]}
                      className="w-full"
                    >
                      {loading["refund-mgmt"] ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <TrendingUp className="h-4 w-4 mr-2" />
                      )}
                      Test Refund Management
                    </Button>

                    <TestResultCard testKey="refund-mgmt" title="Refund Management" />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Webhook Testing */}
            <TabsContent value="webhooks">
              <div className="space-y-6">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Important:</strong> Webhook functions must NOT require Supabase Auth 
                    as they receive calls from Paystack servers.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {DEMO_DATA.webhookEvents.map((webhook, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Webhook className="h-5 w-5" />
                          {webhook.event}
                        </CardTitle>
                        <p className="text-sm text-gray-600">{webhook.description}</p>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h4 className="font-semibold mb-2">Sample Payload</h4>
                          <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto">
                            {JSON.stringify(webhook.sample, null, 2)}
                          </pre>
                        </div>

                        <Button
                          onClick={() => testWebhook(webhook.event)}
                          disabled={loading[`webhook-${webhook.event}`]}
                          className="w-full"
                        >
                          {loading[`webhook-${webhook.event}`] ? (
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Webhook className="h-4 w-4 mr-2" />
                          )}
                          Test {webhook.event}
                        </Button>

                        <TestResultCard testKey={`webhook-${webhook.event}`} title={`Webhook ${webhook.event}`} />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Management Functions */}
            <TabsContent value="management">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Split Management */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Split className="h-5 w-5" />
                      Split Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="split-name">Split Name</Label>
                      <Input
                        id="split-name"
                        value={splitForm.name}
                        onChange={(e) => setSplitForm(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="split-type">Split Type</Label>
                      <Input
                        id="split-type"
                        value={splitForm.type}
                        onChange={(e) => setSplitForm(prev => ({ ...prev, type: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="split-currency">Currency</Label>
                      <Input
                        id="split-currency"
                        value={splitForm.currency}
                        onChange={(e) => setSplitForm(prev => ({ ...prev, currency: e.target.value }))}
                      />
                    </div>

                    <Button
                      onClick={testSplitManagement}
                      disabled={loading["split-mgmt"]}
                      className="w-full"
                    >
                      {loading["split-mgmt"] ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Split className="h-4 w-4 mr-2" />
                      )}
                      Test Split Management
                    </Button>

                    <TestResultCard testKey="split-mgmt" title="Split Management" />
                  </CardContent>
                </Card>

                {/* Function Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle>All Paystack Functions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">✅</Badge>
                        <span>initialize-paystack-payment</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">✅</Badge>
                        <span>verify-paystack-payment</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">✅</Badge>
                        <span>create-paystack-subaccount</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">✅</Badge>
                        <span>manage-paystack-subaccount</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">✅</Badge>
                        <span>pay-seller</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">✅</Badge>
                        <span>paystack-refund-management</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">✅</Badge>
                        <span>paystack-transfer-management</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">✅</Badge>
                        <span>paystack-split-management</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">✅</Badge>
                        <span>paystack-webhook</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* Environment Status */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Environment Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Paystack Keys</Badge>
                  <span>Test mode enabled</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Edge Functions</Badge>
                  <span>All 9 functions available</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Demo Data</Badge>
                  <span>Safe testing environment</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default PaystackDemo;

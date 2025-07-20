import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  AlertTriangle
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

  const setTestLoading = (key: string, value: boolean) => {
    setLoading(prev => ({ ...prev, [key]: value }));
  };

  const setTestResult = (key: string, value: any) => {
    setResults(prev => ({ ...prev, [key]: value }));
  };

  // Test payment initialization
  const testPaymentInitialization = async () => {
    setTestLoading("payment", true);
    try {
      const response = await supabase.functions.invoke("initialize-paystack-payment", {
        body: {
          email: DEMO_DATA.testCustomer.email,
          amount: DEMO_DATA.testAmount / 100, // Convert cents to rands
          user_id: "demo-user-123",
          items: [
            {
              book_id: "demo-book-456",
              title: "Test Textbook",
              price: 50.00,
              seller_id: "demo-seller-789"
            }
          ],
          metadata: {
            order_id: "demo-order-" + Date.now(),
            test_mode: true
          }
        }
      });

      setTestResult("payment", {
        success: !response.error,
        data: response.data,
        error: response.error
      });

      if (response.data) {
        toast.success("✅ Payment initialization successful!");
      } else {
        toast.error("❌ Payment initialization failed");
      }
    } catch (error) {
      setTestResult("payment", {
        success: false,
        error: error.message
      });
      toast.error("Payment test failed: " + error.message);
    } finally {
      setTestLoading("payment", false);
    }
  };

  // Test webhook simulation
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

  // Test subaccount creation
  const testSubaccountCreation = async () => {
    setTestLoading("subaccount", true);
    try {
      const response = await supabase.functions.invoke("create-paystack-subaccount", {
        body: {
          ...DEMO_DATA.testSubaccount,
          user_id: "demo-seller-789",
          email: "seller@example.com"
        }
      });

      setTestResult("subaccount", {
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
      setTestResult("subaccount", {
        success: false,
        error: error.message
      });
      toast.error("Subaccount test failed: " + error.message);
    } finally {
      setTestLoading("subaccount", false);
    }
  };

  // Test payment to seller
  const testPaySeller = async () => {
    setTestLoading("pay-seller", true);
    try {
      const response = await supabase.functions.invoke("pay-seller", {
        body: {
          seller_id: "demo-seller-789",
          amount: 4500, // R45.00 in cents (after commission)
          reference: "demo_transfer_" + Date.now(),
          order_id: "demo-order-123"
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
          <pre className="text-xs bg-white/50 p-2 rounded overflow-auto">
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
            <h1 className="text-3xl font-bold mb-2">Paystack Demo Testing</h1>
            <p className="text-gray-600">
              Test all Paystack functionality with demo data and mock transactions
            </p>
          </div>

          <Tabs defaultValue="payment" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="payment">Payment Init</TabsTrigger>
              <TabsTrigger value="webhook">Webhooks</TabsTrigger>
              <TabsTrigger value="subaccount">Subaccounts</TabsTrigger>
              <TabsTrigger value="transfer">Transfers</TabsTrigger>
            </TabsList>

            {/* Payment Initialization Testing */}
            <TabsContent value="payment">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Payment Initialization
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Test Card Numbers</h4>
                      {DEMO_DATA.testCards.map((card, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded mb-2">
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

                    <div className="space-y-2">
                      <h4 className="font-semibold">Test Payment Details</h4>
                      <div className="text-sm space-y-1">
                        <div>Email: <code>{DEMO_DATA.testCustomer.email}</code></div>
                        <div>Amount: <code>R{DEMO_DATA.testAmount / 100}</code></div>
                        <div>Currency: <code>ZAR</code></div>
                      </div>
                    </div>

                    <Button
                      onClick={testPaymentInitialization}
                      disabled={loading.payment}
                      className="w-full"
                    >
                      {loading.payment ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4 mr-2" />
                      )}
                      Test Payment Initialization
                    </Button>

                    <TestResultCard testKey="payment" title="Payment Initialization" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Integration Code Example</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs bg-gray-50 p-4 rounded overflow-auto">
{`// Initialize Payment
const response = await supabase.functions.invoke(
  "initialize-paystack-payment", {
  body: {
    email: "${DEMO_DATA.testCustomer.email}",
    amount: ${DEMO_DATA.testAmount / 100}, // Rands
    user_id: "demo-user-123",
    items: [{
      book_id: "demo-book-456",
      title: "Test Textbook",
      price: 50.00,
      seller_id: "demo-seller-789"
    }],
    metadata: {
      order_id: "demo-order-123",
      test_mode: true
    }
  }
});`}
                    </pre>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Webhook Testing */}
            <TabsContent value="webhook">
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
                            <Play className="h-4 w-4 mr-2" />
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

            {/* Subaccount Testing */}
            <TabsContent value="subaccount">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Create Subaccount
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Test Subaccount Data</h4>
                      <div className="text-sm space-y-1">
                        <div>Business: <code>{DEMO_DATA.testSubaccount.business_name}</code></div>
                        <div>Bank: <code>{DEMO_DATA.testSubaccount.settlement_bank}</code></div>
                        <div>Account: <code>{DEMO_DATA.testSubaccount.account_number}</code></div>
                        <div>Commission: <code>{DEMO_DATA.testSubaccount.percentage_charge}%</code></div>
                      </div>
                    </div>

                    <Button
                      onClick={testSubaccountCreation}
                      disabled={loading.subaccount}
                      className="w-full"
                    >
                      {loading.subaccount ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4 mr-2" />
                      )}
                      Test Subaccount Creation
                    </Button>

                    <TestResultCard testKey="subaccount" title="Subaccount Creation" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Subaccount Benefits</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-2">
                      <li>• Automatic payment splitting</li>
                      <li>• Direct seller payouts</li>
                      <li>• Commission handling</li>
                      <li>• Settlement tracking</li>
                      <li>• Dispute management</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Transfer Testing */}
            <TabsContent value="transfer">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Pay Seller
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Test Transfer Details</h4>
                      <div className="text-sm space-y-1">
                        <div>Seller ID: <code>demo-seller-789</code></div>
                        <div>Amount: <code>R45.00</code> (after 10% commission)</div>
                        <div>Original: <code>R50.00</code></div>
                        <div>Platform Fee: <code>R5.00</code></div>
                      </div>
                    </div>

                    <Alert>
                      <AlertDescription className="text-xs">
                        In test mode, no actual money transfer occurs. 
                        Paystack simulates the transfer process.
                      </AlertDescription>
                    </Alert>

                    <Button
                      onClick={testPaySeller}
                      disabled={loading["pay-seller"]}
                      className="w-full"
                    >
                      {loading["pay-seller"] ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4 mr-2" />
                      )}
                      Test Pay Seller
                    </Button>

                    <TestResultCard testKey="pay-seller" title="Seller Payment" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Transfer Flow</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold">1</div>
                        <span>Buyer pays R50.00</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold">2</div>
                        <span>Platform takes R5.00 (10%)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-xs font-bold">3</div>
                        <span>Seller receives R45.00</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-xs font-bold">4</div>
                        <span>Delivery fee handled separately</span>
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
                  <Badge variant="outline">Webhooks</Badge>
                  <span>No auth required</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Transactions</Badge>
                  <span>Simulated responses</span>
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

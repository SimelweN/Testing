import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

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
    description: "Create a new order for books from one or multiple sellers",
    requiredFields: ["user_id", "items", "total_amount", "payment_reference"],
    samplePayload: {
      user_id: "user-uuid-here",
      items: [
        {
          book_id: "book-id-1",
          seller_id: "seller-uuid",
          price: 150,
          title: "Sample Book"
        }
      ],
      total_amount: 150,
      shipping_address: {
        street: "123 Main St",
        city: "Cape Town",
        province: "Western Cape",
        postal_code: "8001"
      },
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
      items: [
        {
          book_id: "book-id-1",
          seller_id: "seller-uuid",
          price: 150
        }
      ],
      shipping_address: {
        street: "123 Main St",
        city: "Cape Town"
      }
    }
  },
  {
    name: "Verify Paystack Payment",
    path: "/api/verify-paystack-payment",
    method: "POST",
    description: "Verify a Paystack payment transaction",
    requiredFields: ["reference"],
    samplePayload: {
      reference: "paystack-reference-here"
    }
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
    samplePayload: {
      order_id: "ORD_1234567890",
      collection_notes: "Package collected successfully"
    }
  },
  {
    name: "Pay Seller",
    path: "/api/pay-seller",
    method: "POST",
    description: "Process payment to seller after delivery",
    requiredFields: ["order_id"],
    samplePayload: {
      order_id: "ORD_1234567890",
      payment_notes: "Payment processed"
    }
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
    name: "Process Refund",
    path: "/api/process-refund",
    method: "POST",
    description: "Process a refund for a transaction",
    requiredFields: ["transaction_id", "reason"],
    samplePayload: {
      transaction_id: "TXN_1234567890",
      reason: "Customer requested refund",
      amount: 150
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

export default function APITesting() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<APIEndpoint>(apiEndpoints[0]);
  const [requestBody, setRequestBody] = useState<string>(JSON.stringify(apiEndpoints[0].samplePayload, null, 2));
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(parsedBody),
      });

      const result = await fetchResponse.json();
      setResponse({
        status: fetchResponse.status,
        statusText: fetchResponse.statusText,
        data: result
      });
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const formatResponse = (response: any) => {
    return JSON.stringify(response, null, 2);
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">API Function Testing Interface</h1>
        <p className="text-muted-foreground">
          Test and debug API functions from the /api folder
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar - Function List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Available Functions</CardTitle>
              <CardDescription>
                Select a function to test
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {apiEndpoints.map((endpoint) => (
                <Button
                  key={endpoint.name}
                  variant={selectedEndpoint.name === endpoint.name ? "default" : "outline"}
                  className="w-full justify-start text-left h-auto p-3"
                  onClick={() => handleEndpointChange(endpoint.name)}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={endpoint.method === "POST" ? "default" : "secondary"}>
                        {endpoint.method}
                      </Badge>
                      <span className="font-medium">{endpoint.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground text-left">
                      {endpoint.description}
                    </p>
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Function Details */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{selectedEndpoint.method}</Badge>
                <CardTitle>{selectedEndpoint.name}</CardTitle>
              </div>
              <CardDescription>{selectedEndpoint.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Endpoint:</Label>
                <code className="block mt-1 p-2 bg-muted rounded text-sm">
                  {selectedEndpoint.method} {selectedEndpoint.path}
                </code>
              </div>
              
              {selectedEndpoint.requiredFields.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Required Fields:</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
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

          {/* Request Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Request Configuration</CardTitle>
              <CardDescription>
                Modify the request payload as needed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="request-body" className="text-sm font-medium">
                  Request Body (JSON)
                </Label>
                <Textarea
                  id="request-body"
                  value={requestBody}
                  onChange={(e) => setRequestBody(e.target.value)}
                  className="mt-1 font-mono text-sm"
                  rows={15}
                  placeholder="Enter JSON request body..."
                />
              </div>

              <Button
                onClick={testFunction}
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? "Testing..." : `Test ${selectedEndpoint.name}`}
              </Button>
            </CardContent>
          </Card>

          {/* Response */}
          {(response || error) && (
            <Card>
              <CardHeader>
                <CardTitle>Response</CardTitle>
              </CardHeader>
              <CardContent>
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {response && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={response.status < 400 ? "default" : "destructive"}
                      >
                        {response.status} {response.statusText}
                      </Badge>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Response Data:</Label>
                      <Textarea
                        value={formatResponse(response.data)}
                        readOnly
                        className="mt-1 font-mono text-sm"
                        rows={20}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Quick Tips */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Testing Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>• Replace placeholder UUIDs with actual user IDs from your database</p>
          <p>• Ensure required environment variables are set (PAYSTACK_SECRET_KEY, SUPABASE_URL, etc.)</p>
          <p>• Some functions require valid database records to work properly</p>
          <p>• Check the browser console for additional debug information</p>
          <p>• Functions may have rate limiting - wait between successive calls if needed</p>
        </CardContent>
      </Card>
    </div>
  );
}

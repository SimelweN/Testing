import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Code,
  CheckCircle,
  XCircle,
  CreditCard,
  Database,
  Zap,
  Package,
  DollarSign,
} from "lucide-react";
import PaystackPopup, { usePaystackPopup } from "@/components/PaystackPopup";
import OrderCommitButton from "@/components/orders/OrderCommitButton";
import OrderDeclineButton from "@/components/orders/OrderDeclineButton";

import { toast } from "sonner";

const AdminUsageExamples: React.FC = () => {
  const [selectedExample, setSelectedExample] = useState<string>("paystack");
  const { initializePayment, isLoading, isReady } = usePaystackPopup();

  const examples = [
    {
      id: "paystack",
      title: "Paystack Popup Integration",
      description: "Test the new Paystack popup payment system",
      icon: CreditCard,
      color: "text-blue-600",
    },
    {
      id: "commit",
      title: "Order Commit System",
      description: "Test order commit and decline functionality",
      icon: Package,
      color: "text-green-600",
    },
    {
      id: "functions",
      title: "Supabase Functions",
      description: "Test all Supabase Edge Functions from admin panel",
      icon: Zap,
      color: "text-purple-600",
    },
    {
      id: "subaccounts",
      title: "Subaccount Attachment",
      description: "Verify subaccount codes are attached to listings",
      icon: DollarSign,
      color: "text-yellow-600",
    },
  ];

  const handlePaystackSuccess = (response: {
    reference: string;
    status: string;
    trans: string;
    transaction: string;
    trxref: string;
    redirecturl: string;
  }) => {
    console.log("Test payment successful:", response);
    toast.success("Test payment completed successfully!", {
      description: `Reference: ${response.reference}`,
    });
  };

  const handlePaystackError = (error: string) => {
    console.error("Test payment error:", error);
    toast.error("Test payment failed", {
      description: error,
    });
  };

  const handleCommitSuccess = () => {
    toast.success("Test commit completed successfully!");
  };

  const handleDeclineSuccess = () => {
    toast.success("Test decline completed successfully!");
  };

  const testPaystackHook = async () => {
    try {
      const response = await initializePayment({
        email: "test@example.com",
        amount: 5000, // R50 in kobo
        currency: "ZAR",
        ref: `TEST-${Date.now()}`,
        metadata: {
          test: true,
          admin_test: "paystack_hook_test",
        },
        callback: handlePaystackSuccess,
        onClose: () => {
          toast.info("Test payment cancelled");
        },
      });

      console.log("Hook payment response:", response);
    } catch (error) {
      console.error("Hook payment error:", error);
      handlePaystackError(
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  };

  const renderExampleContent = () => {
    switch (selectedExample) {
      case "paystack":
        return (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">
                Paystack Integration Features
              </h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Modern popup-based payment interface</li>
                <li>• Automatic subaccount splitting for sellers</li>
                <li>• Built-in error handling and user feedback</li>
                <li>• Support for metadata and custom fields</li>
                <li>• ZAR currency support with proper kobo conversion</li>
              </ul>
            </div>

            <div className="space-y-3">
              <div>
                <Badge variant="secondary" className="mb-2">
                  Component Usage
                </Badge>
                <PaystackPopup
                  email="admin@example.com"
                  amount={25.99}
                  subaccountCode="ACCT_test_subaccount"
                  metadata={{
                    test_type: "admin_component_test",
                    admin_user: true,
                  }}
                  onSuccess={handlePaystackSuccess}
                  onError={handlePaystackError}
                  buttonText="Test Payment Component (R25.99)"
                  className="w-full"
                />
              </div>

              <div>
                <Badge variant="secondary" className="mb-2">
                  Hook Usage
                </Badge>
                <Button
                  onClick={testPaystackHook}
                  disabled={!isReady || isLoading}
                  variant="outline"
                  className="w-full"
                >
                  {isLoading ? "Processing..." : "Test Payment Hook (R50.00)"}
                </Button>
              </div>

              <div className="text-xs text-gray-500">
                <strong>Ready:</strong>{" "}
                <Badge variant={isReady ? "default" : "destructive"}>
                  {isReady ? "Yes" : "No"}
                </Badge>
                <br />
                <strong>Loading:</strong>{" "}
                <Badge variant={isLoading ? "destructive" : "default"}>
                  {isLoading ? "Yes" : "No"}
                </Badge>
              </div>
            </div>
          </div>
        );

      case "commit":
        return (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">
                Order Management Features
              </h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Automated commit-to-sale process</li>
                <li>• Decline orders with reason tracking</li>
                <li>• Automatic email notifications</li>
                <li>• Refund processing for declined orders</li>
                <li>• Delivery automation triggers</li>
              </ul>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Badge variant="default" className="mb-2">
                  Commit Button
                </Badge>
                <OrderCommitButton
                  orderId="test-order-123"
                  sellerId="test-seller-456"
                  bookTitle="Test Book Title"
                  buyerName="Test Buyer"
                  orderStatus="pending_commit"
                  onCommitSuccess={handleCommitSuccess}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Badge variant="destructive" className="mb-2">
                  Decline Button
                </Badge>
                <OrderDeclineButton
                  orderId="test-order-123"
                  sellerId="test-seller-456"
                  bookTitle="Test Book Title"
                  buyerName="Test Buyer"
                  orderStatus="pending_commit"
                  onDeclineSuccess={handleDeclineSuccess}
                  className="w-full"
                />
              </div>
            </div>

            <div className="text-xs text-gray-500">
              <p>
                <strong>Note:</strong> These are test buttons with mock data. In
                production, they will use real order IDs and seller IDs.
              </p>
            </div>
          </div>
        );

      case "functions":
        return (
          <div className="space-y-4">
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <h4 className="font-semibold text-purple-800 mb-2">
                Supabase Functions Testing
              </h4>
              <ul className="text-sm text-purple-700 space-y-1">
                <li>• Test all 20+ Supabase Edge Functions</li>
                <li>• Interactive parameter input forms</li>
                <li>• Real-time response display</li>
                <li>• Error debugging and logging</li>
                <li>• Example payload templates</li>
              </ul>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                🔧 Function testing is now available in the dedicated "Edge
                Functions" tab with comprehensive testing capabilities.
              </p>
            </div>
          </div>
        );

      case "subaccounts":
        return (
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-semibold text-yellow-800 mb-2">
                Subaccount Management
              </h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Automatic subaccount attachment when listing books</li>
                <li>• Seller banking details validation</li>
                <li>• Easy access to seller payment information</li>
                <li>• Integrated with Paystack subaccount system</li>
                <li>• Supports commission splitting</li>
              </ul>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-white border rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Subaccount Field</span>
                  <Badge variant="default">seller_subaccount_code</Badge>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Automatically populated from user profile when creating book
                  listings
                </p>
              </div>

              <div className="p-3 bg-white border rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Database Location</span>
                  <Badge variant="outline">books.seller_subaccount_code</Badge>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Stored in books table for easy access during checkout
                </p>
              </div>

              <div className="p-3 bg-white border rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Payment Integration
                  </span>
                  <Badge variant="default">Paystack Subaccounts</Badge>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Used for automatic payment splitting during checkout
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5 text-blue-500" />
            Admin Implementation Examples
          </CardTitle>
          <CardDescription>
            Test and explore the new features implemented in the admin dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Example Selector */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
            {examples.map((example) => {
              const Icon = example.icon;
              return (
                <Button
                  key={example.id}
                  variant={
                    selectedExample === example.id ? "default" : "outline"
                  }
                  onClick={() => setSelectedExample(example.id)}
                  className="flex flex-col h-auto p-3 text-left"
                >
                  <Icon className={`h-5 w-5 ${example.color} mb-1`} />
                  <span className="text-xs font-medium">{example.title}</span>
                </Button>
              );
            })}
          </div>

          {/* Example Content */}
          <div className="min-h-[300px]">{renderExampleContent()}</div>
        </CardContent>
      </Card>

      {/* Implementation Status */}
      <Card>
        <CardHeader>
          <CardTitle>Implementation Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium">Supabase Functions Testing</p>
                <p className="text-sm text-gray-600">
                  Complete admin interface for testing all edge functions
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium">Subaccount Attachment</p>
                <p className="text-sm text-gray-600">
                  Automatic linking during book listing creation
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium">Commit Actions</p>
                <p className="text-sm text-gray-600">
                  Full commit workflow with automation triggers
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium">Decline Actions</p>
                <p className="text-sm text-gray-600">
                  Order decline with refund processing
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium">Paystack Popup</p>
                <p className="text-sm text-gray-600">
                  Modern popup-based payment interface
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUsageExamples;

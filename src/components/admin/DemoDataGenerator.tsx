import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Database,
  Plus,
  Trash2,
  Loader2,
  CheckCircle,
  AlertTriangle,
  CreditCard,
  ShoppingCart,
  RefreshCw,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DemoDataResult {
  success: boolean;
  message: string;
  data?: any;
}

const DemoDataGenerator: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [results, setResults] = useState<DemoDataResult[]>([]);

  const generateDemoBook = async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error("Must be logged in");

    const demoBook = {
      id: crypto.randomUUID(),
      title: "Demo Textbook for Testing",
      author: "Demo Author",
      description:
        "This is a demo book created for testing payments and refunds",
      price: 150.0,
      condition: "good",
      category: "textbook",
      grade: "Grade 12",
      university_year: "First Year",
      seller_id: user.user.id,
      image_url:
        "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400",
      sold: false,
      province: "Gauteng",
      pickup_address: {
        street: "123 Demo Street",
        city: "Johannesburg",
        province: "Gauteng",
        postal_code: "2000",
      },
    };

    const { error } = await supabase.from("books").insert(demoBook);
    if (error) throw error;

    return demoBook;
  };

  const generateDemoOrder = async (bookId: string) => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user || !user.user.email)
      throw new Error("Must be logged in with email");

    const paymentRef = `demo_pay_${Date.now()}`;

    const demoOrder = {
      id: crypto.randomUUID(),
      buyer_email: user.user.email,
      seller_id: user.user.id, // Same user for demo
      amount: 17500, // R175.00 in kobo/cents
      paystack_ref: paymentRef,
      status: "pending_commit",
      items: [
        {
          book_id: bookId,
          title: "Demo Textbook for Testing",
          price: 15000, // R150.00 in kobo/cents
          condition: "good",
          seller_id: user.user.id,
        },
      ],
      shipping_address: {
        name: "Demo User",
        phone: "0123456789",
        street: "456 Test Avenue",
        city: "Cape Town",
        province: "Western Cape",
        postal_code: "8000",
      },
      delivery_data: {
        method: "courierGuy",
        price: 2500, // R25.00 in kobo/cents
        estimated_days: 3,
      },
      metadata: {
        demo: true,
        delivery_fee: 2500,
        book_price: 15000,
        total_amount: 17500,
      },
      payment_held: false,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("orders").insert(demoOrder);
    if (error) throw error;

    return demoOrder;
  };

  const generateDemoPaymentTransaction = async (
    orderId: string,
    paymentRef: string,
  ) => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error("Must be logged in");

    const demoPayment = {
      id: crypto.randomUUID(),
      reference: paymentRef,
      order_id: orderId,
      user_id: user.user.id,
      amount: 175.0,
      currency: "ZAR",
      status: "success",
      payment_method: "card",
      customer_email: user.user.email,
      customer_name: "Demo User",
      paystack_response: {
        id: Date.now(),
        domain: "test",
        status: "success",
        reference: paymentRef,
        amount: 17500, // In kobo
        message: "Demo payment successful",
        gateway_response: "Successful",
        paid_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        channel: "card",
        currency: "ZAR",
        authorization: {
          authorization_code: "AUTH_demo123",
          bin: "408408",
          last4: "4081",
          exp_month: "12",
          exp_year: "2030",
          channel: "card",
          card_type: "visa DEBIT",
          bank: "Test Bank",
          country_code: "ZA",
          brand: "visa",
        },
      },
      metadata: {
        demo: true,
        user_id: user.user.id,
        order_id: orderId,
      },
      verified_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("payment_transactions")
      .insert(demoPayment);
    if (error) throw error;

    return demoPayment;
  };

  const generateCompleteDemo = async () => {
    setIsGenerating(true);
    setResults([]);

    try {
      // Step 1: Create demo book
      const book = await generateDemoBook();
      setResults((prev) => [
        ...prev,
        {
          success: true,
          message: "Demo book created",
          data: { id: book.id, title: book.title, price: book.price },
        },
      ]);

      // Step 2: Create demo order
      const order = await generateDemoOrder(book.id);
      setResults((prev) => [
        ...prev,
        {
          success: true,
          message: "Demo order created",
          data: {
            id: order.id,
            total_amount: order.total_amount,
            status: order.status,
          },
        },
      ]);

      // Step 3: Create demo payment transaction
      const payment = await generateDemoPaymentTransaction(
        order.id,
        order.payment_reference,
      );
      setResults((prev) => [
        ...prev,
        {
          success: true,
          message: "Demo payment transaction created",
          data: {
            reference: payment.reference,
            amount: payment.amount,
            status: payment.status,
          },
        },
      ]);

      // Step 4: Update book as sold
      await supabase
        .from("books")
        .update({
          sold: true,
          buyer_id: order.buyer_id,
          sold_at: new Date().toISOString(),
        })
        .eq("id", book.id);

      setResults((prev) => [
        ...prev,
        {
          success: true,
          message: "Demo data generation completed!",
          data: {
            bookId: book.id,
            orderId: order.id,
            paymentReference: payment.reference,
            note: "You can now test refunds with these IDs",
          },
        },
      ]);

      toast.success(
        "Demo data created successfully! You can now test refunds.",
      );
    } catch (error) {
      setResults((prev) => [
        ...prev,
        {
          success: false,
          message: `Demo generation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        },
      ]);
      toast.error("Failed to generate demo data");
    } finally {
      setIsGenerating(false);
    }
  };

  const clearDemoData = async () => {
    setIsClearing(true);

    try {
      // Clear in reverse order due to foreign key constraints
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Must be logged in");

      // Delete payment transactions
      await supabase
        .from("payment_transactions")
        .delete()
        .eq("customer_email", user.user.email)
        .ilike("reference", "demo_%");

      // Delete refund transactions
      await supabase
        .from("refund_transactions")
        .delete()
        .ilike("transaction_reference", "demo_%");

      // Delete orders
      await supabase
        .from("orders")
        .delete()
        .eq("buyer_id", user.user.id)
        .ilike("payment_reference", "demo_%");

      // Delete books
      await supabase
        .from("books")
        .delete()
        .eq("seller_id", user.user.id)
        .eq("title", "Demo Textbook for Testing");

      setResults([
        {
          success: true,
          message: "All demo data cleared successfully",
        },
      ]);

      toast.success("Demo data cleared");
    } catch (error) {
      setResults([
        {
          success: false,
          message: `Failed to clear demo data: ${error instanceof Error ? error.message : "Unknown error"}`,
        },
      ]);
      toast.error("Failed to clear demo data");
    } finally {
      setIsClearing(false);
    }
  };

  const generateQuickRefundableOrder = async () => {
    setIsGenerating(true);

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Must be logged in");

      const quickOrderId = crypto.randomUUID();
      const quickPaymentRef = `demo_refund_${Date.now()}`;

      // Create a quick order that's ready for refund testing
      const quickOrder = {
        id: quickOrderId,
        buyer_id: user.user.id,
        seller_id: user.user.id,
        amount: 200.0,
        total_amount: 225.0,
        delivery_fee: 25.0,
        status: "committed", // Refundable status
        delivery_status: "pending", // Not delivered yet
        payment_reference: quickPaymentRef,
        refund_status: "none",
        total_refunded: 0,
        created_at: new Date().toISOString(),
      };

      await supabase.from("orders").insert(quickOrder);

      // Create corresponding payment transaction
      const quickPayment = {
        id: crypto.randomUUID(),
        reference: quickPaymentRef,
        order_id: quickOrderId,
        user_id: user.user.id,
        amount: 225.0,
        status: "success",
        customer_email: user.user.email,
        verified_at: new Date().toISOString(),
      };

      await supabase.from("payment_transactions").insert(quickPayment);

      setResults([
        {
          success: true,
          message: "Quick refund test order created!",
          data: {
            orderId: quickOrderId,
            paymentReference: quickPaymentRef,
            amount: 225.0,
            note: "Ready for refund testing",
          },
        },
      ]);

      toast.success(`Refund test order created! Order ID: ${quickOrderId}`);
    } catch (error) {
      setResults([
        {
          success: false,
          message: `Failed to create quick order: ${error instanceof Error ? error.message : "Unknown error"}`,
        },
      ]);
      toast.error("Failed to create quick order");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Demo Data Generator
        </CardTitle>
        <p className="text-sm text-gray-600">
          Generate test data for refunds, payments, and money transfers
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            onClick={generateCompleteDemo}
            disabled={isGenerating || isClearing}
            className="flex items-center gap-2"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Generate Complete Demo
          </Button>

          <Button
            variant="outline"
            onClick={generateQuickRefundableOrder}
            disabled={isGenerating || isClearing}
            className="flex items-center gap-2"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Quick Refund Test Order
          </Button>

          <Button
            variant="destructive"
            onClick={clearDemoData}
            disabled={isGenerating || isClearing}
            className="flex items-center gap-2"
          >
            {isClearing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Clear Demo Data
          </Button>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-800 mb-2">Complete Demo</h3>
            <p className="text-sm text-blue-600">
              Creates: Demo book → Order → Payment transaction with full data
              for comprehensive testing
            </p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <h3 className="font-medium text-green-800 mb-2">
              Quick Refund Test
            </h3>
            <p className="text-sm text-green-600">
              Creates: Just an order with payment ready for immediate refund
              testing
            </p>
          </div>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium">Generation Results:</h3>
            {results.map((result, index) => (
              <Alert
                key={index}
                className={`${
                  result.success
                    ? "border-green-200 bg-green-50"
                    : "border-red-200 bg-red-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  {result.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <AlertDescription
                      className={`text-sm ${
                        result.success ? "text-green-800" : "text-red-800"
                      }`}
                    >
                      <strong>{result.message}</strong>
                      {result.data && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-xs font-medium">
                            View Details
                          </summary>
                          <pre className="text-xs bg-black/5 p-2 rounded overflow-auto max-h-32 mt-1">
                            {JSON.stringify(result.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            ))}
          </div>
        )}

        {/* Usage Instructions */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-sm mb-2">How to Use Demo Data:</h4>
          <div className="text-xs text-gray-600 space-y-1">
            <p>
              • <strong>After generating:</strong> Copy the Order ID and Payment
              Reference from results
            </p>
            <p>
              • <strong>For refund testing:</strong> Go to Paystack Testing tab
              and use these IDs
            </p>
            <p>
              • <strong>For transfer testing:</strong> Use the Order ID in
              seller payment tests
            </p>
            <p>
              • <strong>Cleanup:</strong> Always clear demo data after testing
              to avoid clutter
            </p>
            <p>
              • <strong>Quick tip:</strong> Use "Quick Refund Test Order" for
              faster refund testing
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DemoDataGenerator;

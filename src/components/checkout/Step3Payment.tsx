import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CreditCard,
  Package,
  Truck,
  ArrowLeft,
  Loader2,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { OrderSummary, OrderConfirmation } from "@/types/checkout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import PaystackPopup, { formatAmount } from "@/components/PaystackPopup";

interface Step3PaymentProps {
  orderSummary: OrderSummary;
  onBack: () => void;
  onPaymentSuccess: (orderData: OrderConfirmation) => void;
  onPaymentError: (error: string) => void;
  userId: string;
}

const Step3Payment: React.FC<Step3PaymentProps> = ({
  orderSummary,
  onBack,
  onPaymentSuccess,
  onPaymentError,
  userId,
}) => {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");

  // Fetch user email on component mount
  React.useEffect(() => {
    const fetchUserEmail = async () => {
      try {
        const email = await getUserEmail();
        setUserEmail(email);
      } catch (err) {
        console.error("Failed to fetch user email:", err);
      }
    };
    fetchUserEmail();
  }, []);

  const handlePaystackSuccess = async (paystackResponse: {
    reference: string;
    status: string;
    trans: string;
    transaction: string;
    trxref: string;
    redirecturl: string;
  }) => {
    setProcessing(true);
    try {
      console.log("Paystack payment successful:", paystackResponse);

      // Call the process-book-purchase function to finalize the order
      const { data, error } = await supabase.functions.invoke(
        "process-book-purchase",
        {
          body: {
            paystack_reference: paystackResponse.reference,
            order_details: {
              book_id: orderSummary.book.id,
              seller_id: orderSummary.book.seller_id,
              buyer_id: userId,
              book_price: orderSummary.book_price,
              delivery_price: orderSummary.delivery_price,
              total_amount: orderSummary.total_price,
              delivery_method: orderSummary.delivery.service_name,
              delivery_courier: orderSummary.delivery.courier,
              buyer_address: orderSummary.buyer_address,
              seller_address: orderSummary.seller_address,
              estimated_delivery_days: orderSummary.delivery.estimated_days,
            },
          },
        },
      );

      if (error) {
        throw new Error(error.message || "Failed to process purchase");
      }

      // Success - proceed to confirmation with complete order data
      onPaymentSuccess({
        order_id: data.order_id,
        payment_reference: paystackResponse.reference,
        book_id: orderSummary.book.id,
        seller_id: orderSummary.book.seller_id,
        buyer_id: userId,
        book_title: orderSummary.book.title,
        book_price: orderSummary.book_price,
        delivery_method: orderSummary.delivery.service_name,
        delivery_price: orderSummary.delivery_price,
        total_paid: orderSummary.total_price,
        created_at: new Date().toISOString(),
        status: "completed",
      });
    } catch (error) {
      console.error("Payment processing error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Payment processing failed";
      setError(errorMessage);
      onPaymentError(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const handlePaystackError = (error: string) => {
    setError(error);
    onPaymentError(error);
  };

  const handlePaystackClose = () => {
    console.log("Payment popup closed");
  };

  // Get user email for payment
  const getUserEmail = async () => {
    const { data: userData, error } = await supabase.auth.getUser();
    if (error || !userData.user?.email) {
      throw new Error("User authentication error");
    }
    return userData.user.email;
  };

  /**
   * Legacy payment initialization method - keeping for reference
   * Now using PaystackPopup component for better UX
   */
  const initiatePaymentLegacy = async () => {
    setProcessing(true);
    setError(null);

    try {
      console.log(
        "💳 POST /api/payment/initiate - Initiating payment for order:",
        orderSummary,
      );

      // Verify user authentication first
      const { data: authCheck, error: authError } =
        await supabase.auth.getSession();
      if (authError || !authCheck.session) {
        throw new Error("User authentication failed. Please log in again.");
      }

      console.log("User authenticated:", {
        userId: userId,
        email: authCheck.session.user?.email,
        authenticated: !!authCheck.session,
      });

      // Debug mode: Test payment initialization with simplified data
      const debugMode = import.meta.env.DEV && false; // Set to true for debugging

      if (debugMode) {
        console.log("🔍 DEBUG MODE: Testing payment initialization directly");

        const simplePaymentRequest = {
          order_id: "test-order-" + Date.now(),
          email: authCheck.session.user?.email,
          amount: orderSummary.total_price,
          currency: "ZAR",
          callback_url: `${window.location.origin}/checkout/success`,
          metadata: {
            debug: true,
            book_title: orderSummary.book.title,
            buyer_id: userId,
          },
        };

        console.log("🔍 DEBUG: Testing payment with:", simplePaymentRequest);

        const { data: testData, error: testError } =
          await supabase.functions.invoke("initialize-paystack-payment", {
            body: simplePaymentRequest,
          });

        console.log("🔍 DEBUG: Payment test result:", { testData, testError });

        if (testError) {
          throw new Error(`DEBUG: Payment test failed - ${testError.message}`);
        }

        return; // Exit early in debug mode
      }

      // Create order data
      const orderRequest = {
        book_id: orderSummary.book.id,
        seller_id: orderSummary.book.seller_id,
        buyer_id: userId,
        book_price: orderSummary.book_price,
        delivery_price: orderSummary.delivery_price,
        total_amount: orderSummary.total_price,
        delivery_method: orderSummary.delivery.service_name,
        delivery_courier: orderSummary.delivery.courier,
        buyer_address: orderSummary.buyer_address,
        seller_address: orderSummary.seller_address,
        estimated_delivery_days: orderSummary.delivery.estimated_days,
      };

      // Get user email first
      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      if (userError || !userData.user?.email) {
        throw new Error("User authentication error");
      }

      // Seller subaccount should already be available from books table
      if (!orderSummary.book.seller_subaccount_code) {
        throw new Error(
          "Seller payment setup is incomplete. The seller needs to set up their banking details before accepting payments.",
        );
      }

      // Step 1: Create order first
      const createOrderRequest = {
        bookId: orderSummary.book.id,
        buyerId: userId,
        buyerEmail: userData.user.email,
        sellerId: orderSummary.book.seller_id,
        amount: orderSummary.total_price,
        deliveryOption: orderSummary.delivery.service_name,
        shippingAddress: orderSummary.buyer_address,
        deliveryData: {
          courier: orderSummary.delivery.courier,
          service_name: orderSummary.delivery.service_name,
          estimated_days: orderSummary.delivery.estimated_days,
          price: orderSummary.delivery_price,
        },
        paystackReference: `order_${Date.now()}_${userId}`, // Temporary reference
        paystackSubaccount: orderSummary.book.seller_subaccount_code,
      };

      console.log("Creating order with data:", createOrderRequest);

      // Create the order first
      console.log("📦 Calling create-order function...");

      let orderInvokeResult;
      try {
        orderInvokeResult = await supabase.functions.invoke("create-order", {
          body: createOrderRequest,
        });
        console.log("📎 Raw create-order response:", orderInvokeResult);
      } catch (invokeError) {
        console.error("🚫 Function invoke failed:", invokeError);

        let errorMessage = "Function call failed";
        if (invokeError.message) {
          errorMessage = invokeError.message;
        } else if (typeof invokeError === "string") {
          errorMessage = invokeError;
        } else {
          errorMessage = `Function invoke error: ${JSON.stringify(invokeError)}`;
        }

        // Check for specific Edge Function errors
        if (errorMessage.includes("non-2xx status code")) {
          errorMessage += ". The order service may be temporarily unavailable.";
        }

        throw new Error(errorMessage);
      }

      const { data: orderData, error: orderError } = orderInvokeResult;

      if (orderError) {
        console.error("Order creation error details:", {
          error: orderError.message || orderError,
          errorCode: orderError.code,
          details: orderError.details,
          hint: orderError.hint,
          request: createOrderRequest,
          userId: userId,
        });

        // Extract more specific error information
        let errorMessage = "Failed to create order";

        if (orderError.message) {
          errorMessage = orderError.message;
        } else if (orderError.details) {
          errorMessage = orderError.details;
        } else if (typeof orderError === "string") {
          errorMessage = orderError;
        } else {
          errorMessage = `Order service error: ${JSON.stringify(orderError)}`;
        }

        throw new Error(`Order creation failed: ${errorMessage}`);
      }

      if (!orderData?.success || !orderData?.order?.id) {
        throw new Error("Failed to create order - no order ID returned");
      }

      console.log("Order created successfully:", orderData);

      // Step 2: Initialize payment with the correct parameters for the function
      const paymentRequest = {
        user_id: userId,
        email: userData.user.email,
        total_amount: orderSummary.total_price * 100, // Convert to kobo
        items: [
          {
            book_id: orderSummary.book.id,
            title: orderSummary.book.title,
            price: orderSummary.book_price * 100, // Convert to kobo
            seller_id: orderSummary.book.seller_id,
            condition: orderSummary.book.condition,
          },
        ],
        shipping_address: orderSummary.buyer_address,
        metadata: {
          order_id: orderData.order.id,
          order_data: orderData,
          book_title: orderSummary.book.title,
          delivery_method: orderSummary.delivery.service_name,
          delivery_price: orderSummary.delivery_price * 100, // Convert to kobo
          buyer_id: userId,
        },
      };

      console.log("Initializing payment with data:", paymentRequest);

      // Initialize Paystack payment with correct format
      console.log("📦 Calling initialize-paystack-payment function...");

      let paymentInvokeResult;
      try {
        paymentInvokeResult = await supabase.functions.invoke(
          "initialize-paystack-payment",
          {
            body: paymentRequest,
          },
        );
        console.log(
          "📎 Raw payment initialization response:",
          paymentInvokeResult,
        );
      } catch (invokeError) {
        console.error("🚫 Payment function invoke failed:", invokeError);

        let errorMessage = "Payment function call failed";
        if (invokeError.message) {
          errorMessage = invokeError.message;
        } else if (typeof invokeError === "string") {
          errorMessage = invokeError;
        } else {
          errorMessage = `Function invoke error: ${JSON.stringify(invokeError)}`;
        }

        // Check for specific Edge Function errors
        if (errorMessage.includes("non-2xx status code")) {
          errorMessage +=
            ". The payment service may be temporarily unavailable.";
        }

        throw new Error(errorMessage);
      }

      const { data: paymentData, error: paymentError } = paymentInvokeResult;

      if (paymentError) {
        console.error("Payment initialization error details:", {
          error: paymentError.message || paymentError,
          errorCode: paymentError.code,
          details: paymentError.details,
          hint: paymentError.hint,
          request: paymentRequest,
          orderData: orderData,
        });

        // Extract more specific error information
        let errorMessage = "Failed to initialize payment";

        if (paymentError.message) {
          errorMessage = paymentError.message;
        } else if (paymentError.details) {
          errorMessage = paymentError.details;
        } else if (typeof paymentError === "string") {
          errorMessage = paymentError;
        } else {
          errorMessage = `Payment service error: ${JSON.stringify(paymentError)}`;
        }

        throw new Error(`Payment initialization failed: ${errorMessage}`);
      }

      if (!paymentData) {
        throw new Error("No response received from payment service");
      }

      if (!paymentData.success) {
        throw new Error(paymentData.message || "Payment initialization failed");
      }

      // Use Paystack popup instead of redirect
      console.log("🔍 Payment data received:", paymentData);

      if (!paymentData.data?.reference) {
        console.error("❌ No reference in payment data:", paymentData);
        throw new Error("No payment reference received from Paystack");
      }

      if (paymentData.data?.access_code && paymentData.data?.reference) {
        console.log(
          "Opening Paystack popup with access code:",
          paymentData.data.access_code,
        );

        // Import and use PaystackPop for modal experience
        const { PaystackPaymentService } = await import(
          "@/services/paystackPaymentService"
        );

        // Create order in database first so it appears in purchase history
        // Validate required data before creating order
        if (
          !userData.user.email ||
          !orderSummary.book.seller_id ||
          !orderSummary.book.id ||
          !paymentData.data.reference
        ) {
          throw new Error("Missing required order data");
        }

        console.log("🔄 Creating order with data:", {
          buyer_id: userId,
          buyer_email: userData.user.email,
          seller_id: orderSummary.book.seller_id,
          book_id: orderSummary.book.id,
          paystack_ref: paymentData.data.reference,
          book_price: orderSummary.book_price,
          delivery_price: orderSummary.delivery_price,
          total_price: orderSummary.total_price,
        });

        const { data: createdOrder, error: orderError } = await supabase
          .from("orders")
          .insert([
            {
              // Required fields matching actual schema
              buyer_email: userData.user.email,
              seller_id: orderSummary.book.seller_id,
              amount: Math.round(orderSummary.total_price * 100), // Total amount in kobo
              status: "pending",
              paystack_ref: paymentData.data.reference,

              // Order items as JSONB array
              items: [
                {
                  type: "book",
                  book_id: orderSummary.book.id,
                  book_title: orderSummary.book.title,
                  price: Math.round(orderSummary.book_price * 100), // Book price in kobo
                  quantity: 1,
                  condition: orderSummary.book.condition,
                  seller_id: orderSummary.book.seller_id,
                  seller_subaccount_code:
                    orderSummary.book.seller_subaccount_code,
                },
              ],

              // Shipping address as JSONB
              shipping_address: orderSummary.buyer_address,

              // Delivery data as JSONB
              delivery_data: {
                delivery_method: orderSummary.delivery.service_name,
                delivery_price: Math.round(orderSummary.delivery_price * 100), // In kobo
                courier: orderSummary.delivery.courier,
                estimated_days: orderSummary.delivery.estimated_days,
                pickup_address: orderSummary.seller_address,
                delivery_quote: orderSummary.delivery,
              },

              // Additional metadata
              metadata: {
                buyer_id: userId,
                order_data: orderData,
                platform_fee: Math.round(orderSummary.book_price * 0.1 * 100), // 10% platform fee in kobo
                seller_amount: Math.round(orderSummary.book_price * 0.9 * 100), // 90% to seller in kobo
                original_total: orderSummary.total_price, // Keep original prices for reference
                original_book_price: orderSummary.book_price,
                original_delivery_price: orderSummary.delivery_price,
              },
            },
          ])
          .select()
          .single();

        if (orderError) {
          console.error(
            "❌ Failed to create order - Full error object:",
            orderError,
          );
          console.error("❌ Error message:", orderError.message);
          console.error("❌ Error details:", orderError.details);
          console.error("❌ Error code:", orderError.code);
          console.error("❌ Error hint:", orderError.hint);

          let errorMessage = "Unknown database error";
          if (orderError.message) {
            errorMessage = orderError.message;
          } else if (orderError.details) {
            errorMessage = orderError.details;
          }

          // Add more context for common errors
          if (orderError.code === "23505") {
            errorMessage = `Duplicate order reference: ${errorMessage}`;
          } else if (orderError.code === "23502") {
            errorMessage = `Missing required field: ${errorMessage}`;
          } else if (orderError.code === "23503") {
            errorMessage = `Invalid reference (foreign key): ${errorMessage}`;
          }

          throw new Error(`Failed to create order: ${errorMessage}`);
        }

        console.log("✅ Order created in database:", createdOrder);

        try {
          const result = await PaystackPaymentService.initializePayment({
            email: userData.user.email,
            amount: orderSummary.total_price * 100,
            reference: paymentData.data.reference,
            subaccount: orderSummary.book.seller_subaccount_code,
            metadata: {
              order_id: createdOrder.id,
              order_data: orderData,
              book_title: orderSummary.book.title,
              delivery_method: orderSummary.delivery.service_name,
              buyer_id: userId,
            },
          });

          if (result.cancelled) {
            console.log("❌ Paystack payment cancelled by user");
            toast.warning("Payment cancelled");
            setProcessing(false);
            return;
          }

          console.log("✅ Paystack payment successful:", result);

          // Extract book item data for processing
          const bookItem = createdOrder.items[0]; // Get the book item

          // Update order status to paid
          const { error: updateError } = await supabase
            .from("orders")
            .update({
              status: "paid",
              paid_at: new Date().toISOString(),
              metadata: {
                ...createdOrder.metadata,
                paystack_data: result,
              },
            })
            .eq("id", createdOrder.id);

          if (updateError) {
            console.warn("Failed to update order status:", updateError);
          }

          // Mark book as sold
          const { error: bookError } = await supabase
            .from("books")
            .update({
              sold: true,
              availability: "sold",
              sold_at: new Date().toISOString(),
            })
            .eq("id", bookItem.book_id);

          if (bookError) {
            console.warn("Failed to mark book as sold:", bookError);
          }

          // Create order confirmation data using the database order
          const orderConfirmation = {
            order_id: createdOrder.id,
            payment_reference: result.reference,
            book_id: bookItem.book_id,
            seller_id: createdOrder.seller_id,
            buyer_id: createdOrder.metadata.buyer_id,
            book_title: bookItem.book_title,
            book_price: bookItem.price / 100, // Convert back from kobo to rands
            delivery_method: createdOrder.delivery_data.delivery_method,
            delivery_price: createdOrder.delivery_data.delivery_price / 100, // Convert back from kobo
            total_paid: createdOrder.amount / 100, // Convert back from kobo
            created_at: createdOrder.created_at,
            status: "paid",
          };

          // Call the success handler to show Step4Confirmation
          onPaymentSuccess(orderConfirmation);
          toast.success("Payment completed successfully! 🎉");
        } catch (paymentError) {
          console.error("Payment processing error:", paymentError);

          // Clean up pending order if payment failed/cancelled
          const { error: cleanupError } = await supabase
            .from("orders")
            .update({
              status: "cancelled",
              metadata: {
                ...createdOrder.metadata,
                cancelled_at: new Date().toISOString(),
                cancellation_reason: "payment_failed",
                error: paymentError.message,
              },
            })
            .eq("id", createdOrder.id);

          if (cleanupError) {
            console.warn("Failed to update cancelled order:", cleanupError);
          }

          let errorMessage = "Payment failed";
          if (paymentError.message?.includes("cancelled")) {
            errorMessage = "Payment cancelled";
            toast.warning(errorMessage);
          } else if (
            paymentError.message?.includes("popup") ||
            paymentError.message?.includes("blocked")
          ) {
            errorMessage =
              "Payment popup was blocked. Please allow popups and try again.";
            toast.error(errorMessage);
          } else if (paymentError.message?.includes("library not available")) {
            errorMessage =
              "Payment system not available. Please refresh the page and try again.";
            toast.error(errorMessage);
          } else {
            errorMessage = paymentError.message || "Payment failed";
            toast.error(errorMessage);
          }

          onPaymentError(errorMessage);
          setProcessing(false);
        }
      } else {
        console.error("Payment response:", paymentData);
        throw new Error("No payment access code received from Paystack");
      }
    } catch (err) {
      console.error("Payment initialization error:", err);

      let errorMessage = "Payment failed";
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === "string") {
        errorMessage = err;
      } else {
        errorMessage = `Payment error: ${JSON.stringify(err)}`;
      }

      setError(errorMessage);
      onPaymentError(errorMessage);

      // Show user-friendly error message
      if (errorMessage.includes("temporarily unavailable")) {
        toast.error(
          "Payment service is temporarily unavailable. Please try again in a moment.",
        );
      } else if (errorMessage.includes("Missing required fields")) {
        toast.error(
          "Payment setup error. Please refresh the page and try again.",
        );
      } else {
        toast.error("Payment failed: " + errorMessage);
      }
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment</h1>
        <p className="text-gray-600">Review and complete your purchase</p>
      </div>

      {/* Order Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Order Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Book Details */}
          <div className="flex items-center gap-3">
            {orderSummary.book.image_url && (
              <img
                src={orderSummary.book.image_url}
                alt={orderSummary.book.title}
                className="w-16 h-20 object-cover rounded border"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg";
                }}
              />
            )}
            <div className="flex-1">
              <h3 className="font-medium">{orderSummary.book.title}</h3>
              <p className="text-sm text-gray-600">
                {orderSummary.book.author}
              </p>
              <p className="text-sm text-gray-500">
                {orderSummary.book.condition}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold">
                R{orderSummary.book_price.toFixed(2)}
              </p>
            </div>
          </div>

          <Separator />

          {/* Delivery Details */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded">
              <Truck className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium">
                {orderSummary.delivery.service_name}
              </p>
              <p className="text-sm text-gray-600">
                {orderSummary.delivery.description}
              </p>
              <p className="text-sm text-gray-500">
                Estimated: {orderSummary.delivery.estimated_days} business day
                {orderSummary.delivery.estimated_days > 1 ? "s" : ""}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold">
                R{orderSummary.delivery_price.toFixed(2)}
              </p>
            </div>
          </div>

          <Separator />

          {/* Total */}
          <div className="flex justify-between items-center text-lg font-bold">
            <span>Total</span>
            <span className="text-green-600">
              R{orderSummary.total_price.toFixed(2)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Delivery Address Card */}
      <Card>
        <CardHeader>
          <CardTitle>Delivery Address</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm">
            <p>{orderSummary.buyer_address.street}</p>
            <p>
              {orderSummary.buyer_address.city},{" "}
              {orderSummary.buyer_address.province}{" "}
              {orderSummary.buyer_address.postal_code}
            </p>
            <p>{orderSummary.buyer_address.country}</p>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Payment Information */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium">Secure Payment</h3>
              <p className="text-sm text-gray-600">
                Powered by Paystack - Your payment information is encrypted and
                secure
              </p>
            </div>
          </div>

          <div className="text-sm text-gray-600 space-y-2">
            <p>• Payment will be processed immediately</p>
            <p>• You'll receive an email confirmation</p>
            <p>• Seller will be notified to prepare shipment</p>
            <p>• You can track your order in your account</p>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={onBack} disabled={processing}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <PaystackPopup
          email={userEmail}
          amount={orderSummary.total_price}
          subaccountCode={orderSummary.book.seller_subaccount_code}
          orderReference={`ORDER-${Date.now()}-${userId}`}
          metadata={{
            book_id: orderSummary.book.id,
            book_title: orderSummary.book.title,
            seller_id: orderSummary.book.seller_id,
            buyer_id: userId,
            delivery_method: orderSummary.delivery.service_name,
            custom_fields: [
              {
                display_name: "Book Title",
                variable_name: "book_title",
                value: orderSummary.book.title,
              },
              {
                display_name: "Delivery Method",
                variable_name: "delivery_method",
                value: orderSummary.delivery.service_name,
              },
            ],
          }}
          onSuccess={handlePaystackSuccess}
          onError={handlePaystackError}
          onClose={handlePaystackClose}
          disabled={processing}
          className="px-8 py-3 text-lg"
          buttonText={`Pay Now - ${formatAmount(orderSummary.total_price)}`}
        />
      </div>
    </div>
  );
};

export default Step3Payment;

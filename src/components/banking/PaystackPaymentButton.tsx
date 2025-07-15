import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CreditCard,
  Loader2,
  ShieldCheck,
  AlertCircle,
  CheckCircle,
  Lock,
} from "lucide-react";
import { PAYSTACK_CONFIG, calculatePaymentSplit } from "@/config/paystack";
import { PaymentService } from "@/services/paymentService";
import { PaystackPaymentService } from "@/services/PaystackPaymentService";
import { useAuth } from "@/contexts/AuthContext";
import type { ShippingAddress, Order } from "@/types/banking";

// Declare Paystack types for window object
declare global {
  interface Window {
    PaystackPop?: {
      setup: (config: {
        key: string;
        email: string;
        amount: number;
        currency: string;
        ref: string;
        subaccount?: string;
        transaction_charge?: number;
        bearer?: string;
        metadata?: Record<string, unknown>;
        onSuccess: (transaction: {
          reference: string;
          trans: string;
          message: string;
          status: string;
        }) => void;
        onCancel: () => void;
      }) => {
        openIframe: () => void;
      };
    };
  }
}

interface PaystackPaymentButtonProps {
  amount: number; // in cents (ZAR)
  bookIds: string[];
  sellerId: string;
  shippingAddress: ShippingAddress;
  deliveryMethod: "pickup" | "delivery";
  deliveryFee?: number;
  onSuccess?: (reference: string) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const PaystackPaymentButton: React.FC<PaystackPaymentButtonProps> = ({
  amount,
  bookIds,
  sellerId,
  shippingAddress,
  deliveryMethod,
  deliveryFee = 0,
  onSuccess,
  onError,
  onCancel,
  disabled = false,
  className = "",
  children,
}) => {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<
    "idle" | "initializing" | "pending" | "verifying" | "completed" | "failed"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  // Seller subaccount state removed
  const createdOrderRef = useRef<Order | null>(null);

  // Paystack script loading now handled by PaystackPaymentService

  // Seller subaccount initialization removed

  // Calculate payment breakdown (convert from cents to rands first)
  const amountInRands = amount / 100;
  const paymentSplit = calculatePaymentSplit(amountInRands, deliveryFee);

  const initializePayment = async (): Promise<{
    success: boolean;
    authorization_url?: string;
    reference?: string;
    createdOrder?: Order;
    error?: string;
  }> => {
    if (!user?.email) {
      return { success: false, error: "Please sign in to make a payment" };
    }

    setPaymentStatus("initializing");

    try {
      // STEP 4A: ORDER CREATION (First Database Write)
      // Generate payment reference first
      const paymentReference = `RS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Get book data from IDs following checkout specifications
      const { data: bookData, error: bookError } = await supabase
        .from("books")
        .select(
          `
          id, title, author, price, condition, isbn, image_url,
          seller_id, seller_subaccount_code, seller_city, seller_province,
          frontCover, backCover, sold, availability
        `,
        )
        .in("id", bookIds);

      if (bookError || !bookData?.length) {
        console.error("Book fetch error:", bookError);
        return { success: false, error: "Failed to fetch book data" };
      }

      // No subaccount validation needed
      const firstBook = bookData[0];

      // Calculate amounts (convert from cents to rands for calculations)
      const bookPrice = bookData.reduce((sum, book) => sum + book.price, 0);
      const totalPrice = bookPrice + deliveryFee / 100; // deliveryFee comes in cents

      // 🔍 DATABASE INSERT 1: Create order record
      const { data: createdOrder, error: orderError } = await supabase
        .from("orders")
        .insert({
          buyer_email: user.email,
          seller_id: sellerId,
          amount: Math.round(totalPrice * 100), // In kobo
          status: "pending",
          paystack_ref: paymentReference,

          // Order items as JSONB array
          items: bookData.map((book) => ({
            type: "book",
            book_id: book.id,
            book_title: book.title,
            price: Math.round(book.price * 100),
            quantity: 1,
            seller_id: book.seller_id,
          })),

          // Shipping address as JSONB
          shipping_address: shippingAddress,

          // Delivery data as JSONB
          delivery_data: {
            delivery_method: deliveryMethod,
            delivery_price: Math.round((deliveryFee / 100) * 100), // Convert to kobo
            estimated_days: 3, // Default estimate
            pickup_address: null, // Will be filled by seller
          },

          // Additional metadata
          metadata: {
            buyer_id: user.id,
            platform_fee: Math.round(bookPrice * 0.1 * 100),
            seller_amount: Math.round(bookPrice * 0.9 * 100),
          },
        })
        .select()
        .single();

      if (orderError) {
        console.error("Order creation error:", orderError);
        return { success: false, error: "Failed to create order" };
      }

      // STEP 4B: PAYSTACK PAYMENT - Initialize payment
      const result = await PaymentService.initializePayment({
        email: user.email,
        amount: paymentSplit.totalAmount,
        bookIds,
        sellerId,
        shipping_address: shippingAddress,
        delivery_method: deliveryMethod,
        delivery_fee: deliveryFee,
      });

      if (!result.success) {
        // Cleanup order if payment initialization fails
        await supabase.from("orders").delete().eq("id", createdOrder.id);
        return {
          success: false,
          error: result.error || "Failed to initialize payment",
        };
      }

      return {
        success: true,
        authorization_url: result.authorization_url,
        reference: paymentReference,
        createdOrder,
      };
    } catch (error) {
      console.error("Payment initialization error:", error);
      return { success: false, error: "An unexpected error occurred" };
    }
  };

  const verifyPayment = async (
    reference: string,
    createdOrder?: Order,
  ): Promise<boolean> => {
    setPaymentStatus("verifying");

    try {
      const result = await PaymentService.verifyPayment(reference);

      if (result.success && result.verification?.status === "success") {
        // STEP 5: PAYMENT SUCCESS PROCESSING

        // STEP 5A: UPDATE ORDER STATUS
        const { error: updateError } = await supabase
          .from("orders")
          .update({
            status: "paid",
            paid_at: new Date().toISOString(),
            metadata: {
              ...createdOrder?.metadata,
              paystack_data: result.verification,
            },
          })
          .eq("paystack_ref", reference);

        if (updateError) {
          console.error("Error updating order status:", updateError);
          setPaymentStatus("failed");
          setErrorMessage("Payment successful but order update failed");
          onError?.("Payment successful but order update failed");
          return false;
        }

        // STEP 5B: MARK BOOK AS SOLD
        const { error: bookError } = await supabase
          .from("books")
          .update({
            sold: true,
            availability: "sold",
            sold_at: new Date().toISOString(),
          })
          .in("id", bookIds);

        if (bookError) {
          console.error("Error marking books as sold:", bookError);
          // Don't fail the payment for this - it's a secondary action
        }

        setPaymentStatus("completed");
        onSuccess?.(reference);
        return true;
      } else {
        setPaymentStatus("failed");
        setErrorMessage(result.error || "Payment verification failed");
        onError?.(result.error || "Payment verification failed");
        return false;
      }
    } catch (error) {
      console.error("Payment verification error:", error);
      setPaymentStatus("failed");
      setErrorMessage("Payment verification failed");
      onError?.("Payment verification failed");
      return false;
    }
  };

  const handlePaystackSuccess = async (transaction: {
    reference: string;
    trans: string;
    message: string;
    status: string;
  }) => {
    console.log("Paystack success:", transaction);
    // Pass the created order data to verification
    await verifyPayment(transaction.reference, createdOrderRef.current);
  };

  const handlePaystackCancel = () => {
    console.log("Payment cancelled by user");
    setPaymentStatus("idle");
    setIsProcessing(false);
    onCancel?.();
  };

  const handlePayment = async () => {
    if (!user) {
      setErrorMessage("Please sign in to make a payment");
      return;
    }

    setIsProcessing(true);
    setErrorMessage("");
    setPaymentStatus("initializing");

    try {
      const paymentInit = await initializePayment();

      if (!paymentInit.success) {
        setErrorMessage(paymentInit.error || "Failed to initialize payment");
        setPaymentStatus("failed");
        onError?.(paymentInit.error || "Failed to initialize payment");
        return;
      }

      // Store created order for verification step
      createdOrderRef.current = paymentInit.createdOrder;

      // Check if Paystack is configured for production
      if (!PAYSTACK_CONFIG.isConfigured()) {
        // Development fallback - simulate successful payment
        console.warn("🛠️ Using development payment fallback");
        setTimeout(async () => {
          if (paymentInit.reference) {
            await verifyPayment(
              paymentInit.reference,
              paymentInit.createdOrder,
            );
          }
        }, 2000);
        return;
      }

      // Use new PaystackPaymentService for popup
      setPaymentStatus("pending");

      const paymentResponse = await PaystackPaymentService.initializePayment({
        email: user.email,
        amount: paymentSplit.totalAmountKobo,
        reference: paymentInit.reference,
        metadata: {
          seller_id: sellerId,
          delivery_fee: deliveryFee,
          seller_amount: paymentSplit.sellerAmount,
          platform_commission: paymentSplit.platformAmount,
          books: bookIds.join(", "),
          delivery_method: deliveryMethod,
        },
        onSuccess: handlePaystackSuccess,
        onCancel: handlePaystackCancel,
      });

      if (!paymentResponse.success) {
        throw new Error(
          paymentResponse.error || "Failed to initialize payment",
        );
      }
    } catch (error) {
      console.error("Payment error:", error);
      setErrorMessage("An unexpected error occurred. Please try again.");
      setPaymentStatus("failed");
      onError?.("An unexpected error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  const getButtonText = () => {
    switch (paymentStatus) {
      case "initializing":
        return "Preparing payment...";
      case "pending":
        return "Complete payment in popup";
      case "verifying":
        return "Verifying payment...";
      case "completed":
        return "Payment successful!";
      case "failed":
        return "Payment failed - Retry";
      default:
        return (
          children || `Pay R${(paymentSplit.totalAmount / 100).toFixed(2)}`
        );
    }
  };

  const getButtonIcon = () => {
    switch (paymentStatus) {
      case "initializing":
      case "verifying":
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "failed":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  const isButtonDisabled =
    disabled || isProcessing || paymentStatus === "completed";

  return (
    <div className="space-y-4">
      {/* Error Message */}
      {errorMessage && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {errorMessage}
          </AlertDescription>
        </Alert>
      )}

      {/* Payment Summary */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>R{(amount / 100).toFixed(2)}</span>
        </div>
        {deliveryFee > 0 && (
          <div className="flex justify-between">
            <span>Delivery fee:</span>
            <span>R{(deliveryFee / 100).toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between font-semibold text-base border-t pt-2">
          <span>Total:</span>
          <span>R{(paymentSplit.totalAmount / 100).toFixed(2)}</span>
        </div>
      </div>

      {/* Payment Button */}
      <Button
        onClick={handlePayment}
        disabled={isButtonDisabled}
        className={`w-full ${paymentStatus === "completed" ? "bg-green-600 hover:bg-green-600" : "bg-blue-600 hover:bg-blue-700"} ${className}`}
        size="lg"
      >
        <div className="flex items-center justify-center gap-2">
          {getButtonIcon()}
          {getButtonText()}
        </div>
      </Button>

      {/* Security Badge */}
      <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
        <ShieldCheck className="h-3 w-3" />
        <span>Secured by Paystack</span>
        <Lock className="h-3 w-3" />
        <span>256-bit SSL encryption</span>
      </div>

      {/* Development Notice */}
      {PAYSTACK_CONFIG.isDevelopment() && !PAYSTACK_CONFIG.isConfigured() && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800 text-xs">
            🛠️ Development mode: Payments will be simulated
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

// Extend window object for Paystack
declare global {
  interface Window {
    PaystackPop: {
      setup: (options: Record<string, unknown>) => {
        openIframe: () => void;
      };
    };
  }
}

export default PaystackPaymentButton;

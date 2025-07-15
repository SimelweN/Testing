import React, { useState, useRef } from "react";
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
  deliveryFee?: number; // in cents
  onSuccess?: (reference: string) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const PaystackPaymentButtonFixed: React.FC<PaystackPaymentButtonProps> = ({
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
  const createdOrderRef = useRef<Order | null>(null);

  // ✅ FIXED: Convert amounts to consistent units (all in cents)
  const amountInCents = amount; // Already in cents
  const deliveryFeeInCents = deliveryFee; // Already in cents
  const totalAmountInCents = amountInCents + deliveryFeeInCents;

  // ✅ FIXED: Calculate payment breakdown with consistent units
  const bookPriceInRands = amountInCents / 100;
  const deliveryFeeInRands = deliveryFeeInCents / 100;
  const paymentSplit = calculatePaymentSplit(
    bookPriceInRands,
    deliveryFeeInRands,
  );

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
    setErrorMessage("");

    try {
      // ✅ FIXED: Generate payment reference first
      const paymentReference = `RS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // ✅ FIXED: Use database transaction for atomic operations
      const { data: transactionResult, error: transactionError } =
        await supabase.rpc("create_order_transaction", {
          p_buyer_email: user.email,
          p_seller_id: sellerId,
          p_book_ids: bookIds,
          p_amount: totalAmountInCents,
          p_paystack_ref: paymentReference,
          p_shipping_address: shippingAddress,
          p_delivery_method: deliveryMethod,
          p_delivery_fee: deliveryFeeInCents,
          p_platform_fee: Math.round(bookPriceInRands * 0.1 * 100),
          p_seller_amount: Math.round(bookPriceInRands * 0.9 * 100),
        });

      if (transactionError) {
        console.error("Transaction error:", transactionError);
        return { success: false, error: transactionError.message };
      }

      if (!transactionResult?.success) {
        return {
          success: false,
          error: transactionResult?.error || "Failed to create order",
        };
      }

      const createdOrder = transactionResult.order;
      createdOrderRef.current = createdOrder;

      // ✅ FIXED: Only proceed with payment if order creation succeeded
      // Initialize payment via PaymentService
      const result = await PaymentService.initializePayment({
        email: user.email,
        amount: totalAmountInCents,
        bookIds,
        sellerId,
        shipping_address: shippingAddress,
        delivery_method: deliveryMethod,
        delivery_fee: deliveryFeeInCents,
      });

      if (!result.success) {
        // ✅ FIXED: Cleanup order if payment initialization fails (using transaction)
        await supabase.rpc("cleanup_failed_order", {
          p_order_id: createdOrder.id,
          p_paystack_ref: paymentReference,
        });

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
      setPaymentStatus("failed");
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      };
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
        // ✅ FIXED: Use atomic update for payment success
        const { error: updateError } = await supabase.rpc(
          "complete_payment_transaction",
          {
            p_paystack_ref: reference,
            p_book_ids: bookIds,
            p_verification_data: result.verification,
          },
        );

        if (updateError) {
          console.error("Error completing payment:", updateError);
          setPaymentStatus("failed");
          setErrorMessage("Payment successful but order update failed");
          onError?.("Payment successful but order update failed");
          return false;
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
      createdOrderRef.current = paymentInit.createdOrder || null;

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

      // Use PaystackPaymentService for popup
      setPaymentStatus("pending");

      const paymentResponse = await PaystackPaymentService.initializePayment({
        email: user.email,
        amount: paymentSplit.totalAmountKobo,
        reference: paymentInit.reference,
        metadata: {
          seller_id: sellerId,
          delivery_fee: deliveryFeeInCents,
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
        return children || `Pay R${(totalAmountInCents / 100).toFixed(2)}`;
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
          <span>R{(amountInCents / 100).toFixed(2)}</span>
        </div>
        {deliveryFeeInCents > 0 && (
          <div className="flex justify-between">
            <span>Delivery fee:</span>
            <span>R{(deliveryFeeInCents / 100).toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between font-semibold text-base border-t pt-2">
          <span>Total:</span>
          <span>R{(totalAmountInCents / 100).toFixed(2)}</span>
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

export default PaystackPaymentButtonFixed;

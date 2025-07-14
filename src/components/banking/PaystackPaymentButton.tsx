import React, { useState, useEffect } from "react";
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
import { useAuth } from "@/contexts/AuthContext";
import type { ShippingAddress } from "@/types/banking";

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

  // Load Paystack script
  useEffect(() => {
    if (!window.PaystackPop && PAYSTACK_CONFIG.isConfigured()) {
      const script = document.createElement("script");
      script.src = "https://js.paystack.co/v1/inline.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // Calculate payment breakdown
  const paymentSplit = calculatePaymentSplit(amount, deliveryFee);

  const initializePayment = async (): Promise<{
    success: boolean;
    authorization_url?: string;
    reference?: string;
    error?: string;
  }> => {
    if (!user?.email) {
      return { success: false, error: "Please sign in to make a payment" };
    }

    setPaymentStatus("initializing");

    try {
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
        return {
          success: false,
          error: result.error || "Failed to initialize payment",
        };
      }

      return {
        success: true,
        authorization_url: result.authorization_url,
        reference: result.reference,
      };
    } catch (error) {
      console.error("Payment initialization error:", error);
      return { success: false, error: "An unexpected error occurred" };
    }
  };

  const verifyPayment = async (reference: string): Promise<boolean> => {
    setPaymentStatus("verifying");

    try {
      const result = await PaymentService.verifyPayment(reference);

      if (result.success && result.verification?.status === "success") {
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

  const handlePaystackSuccess = async (transaction: any) => {
    console.log("Paystack success:", transaction);
    await verifyPayment(transaction.reference);
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

      // Check if Paystack is configured for production
      if (!PAYSTACK_CONFIG.isConfigured()) {
        // Development fallback - simulate successful payment
        console.warn("🛠️ Using development payment fallback");
        setTimeout(async () => {
          if (paymentInit.reference) {
            await verifyPayment(paymentInit.reference);
          }
        }, 2000);
        return;
      }

      // Use Paystack popup for production
      if (window.PaystackPop && paymentInit.reference) {
        setPaymentStatus("pending");

        const handler = window.PaystackPop.setup({
          key: PAYSTACK_CONFIG.getPublicKey(),
          email: user.email,
          amount: paymentSplit.totalAmountKobo,
          currency: "ZAR",
          ref: paymentInit.reference,
          subaccount: sellerId ? `ACCT_${sellerId}` : undefined,
          transaction_charge: paymentSplit.platformAmountKobo,
          bearer: "subaccount",
          metadata: {
            seller_id: sellerId,
            delivery_fee: deliveryFee,
            seller_amount: paymentSplit.sellerAmount,
            platform_commission: paymentSplit.platformAmount,
            custom_fields: [
              {
                display_name: "Books",
                variable_name: "books",
                value: bookIds.join(", "),
              },
              {
                display_name: "Delivery Method",
                variable_name: "delivery_method",
                value: deliveryMethod,
              },
              {
                display_name: "Seller ID",
                variable_name: "seller_id",
                value: sellerId,
              },
            ],
          },
          onSuccess: handlePaystackSuccess,
          onCancel: handlePaystackCancel,
        });

        handler.openIframe();
      } else {
        // Fallback to redirect if popup not available
        if (paymentInit.authorization_url) {
          window.location.href = paymentInit.authorization_url;
        } else {
          throw new Error("No payment method available");
        }
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
      setup: (options: any) => {
        openIframe: () => void;
      };
    };
  }
}

export default PaystackPaymentButton;

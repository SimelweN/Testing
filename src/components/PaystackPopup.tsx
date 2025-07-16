import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CreditCard, Loader2 } from "lucide-react";
import { PAYSTACK_CONFIG } from "@/config/paystack";

// Extend the global Window interface to include PaystackPop
declare global {
  interface Window {
    PaystackPop: {
      setup: (config: PaystackConfig) => {
        openIframe: () => void;
      };
    };
  }
}

interface PaystackConfig {
  key: string;
  email: string;
  amount: number; // Amount in kobo (cents)
  currency?: string;
  ref: string;
  subaccount?: string;
  metadata?: {
    custom_fields?: Array<{
      display_name: string;
      variable_name: string;
      value: string;
    }>;
    [key: string]: unknown;
  };
  callback: (response: PaystackResponse) => void;
  onClose: () => void;
}

interface PaystackResponse {
  reference: string;
  status: string;
  trans: string;
  transaction: string;
  trxref: string;
  redirecturl: string;
}

interface PaystackPopupProps {
  email: string;
  amount: number; // Amount in Rands (will be converted to kobo)
  subaccountCode?: string;
  orderReference?: string;
  metadata?: Record<string, unknown>;
  onSuccess: (response: PaystackResponse) => void;
  onClose?: () => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
  buttonText?: string;
}

const PaystackPopup: React.FC<PaystackPopupProps> = ({
  email,
  amount,
  subaccountCode,
  orderReference,
  metadata = {},
  onSuccess,
  onClose,
  onError,
  disabled = false,
  className = "",
  children,
  buttonText = "Pay Now",
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Load Paystack script on component mount
  useEffect(() => {
    const loadPaystackScript = () => {
      // Check if script is already loaded
      if (window.PaystackPop) {
        setScriptLoaded(true);
        return;
      }

      // Check if script element already exists
      if (document.querySelector('script[src*="paystack"]')) {
        // Script exists but PaystackPop might not be ready yet
        const checkInterval = setInterval(() => {
          if (window.PaystackPop) {
            setScriptLoaded(true);
            clearInterval(checkInterval);
          }
        }, 100);

        // Clear interval after 10 seconds to prevent infinite checking
        setTimeout(() => clearInterval(checkInterval), 10000);
        return;
      }

      // Load the script
      const script = document.createElement("script");
      script.src = "https://js.paystack.co/v1/inline.js";
      script.async = true;
      script.onload = () => {
        console.log("Paystack script loaded successfully");
        setScriptLoaded(true);
      };
      script.onerror = () => {
        console.error("Failed to load Paystack script");
        onError?.("Failed to load payment system");
        toast.error("Failed to load payment system");
      };

      document.head.appendChild(script);
    };

    loadPaystackScript();

    // Cleanup function to remove script if component unmounts
    return () => {
      const script = document.querySelector('script[src*="paystack"]');
      if (script) {
        script.remove();
      }
    };
  }, [onError]);

  const generateReference = () => {
    return (
      orderReference ||
      `RBK-${Date.now()}-${Math.floor(Math.random() * 1000000)}`
    );
  };

  const handlePayment = () => {
    if (!scriptLoaded || !window.PaystackPop) {
      toast.error("Payment system not ready. Please try again.");
      onError?.("Payment system not ready");
      return;
    }

    if (!PAYSTACK_CONFIG.isConfigured()) {
      toast.error("Payment system not properly configured");
      onError?.("Payment system not configured");
      return;
    }

    if (!email || !amount || amount <= 0) {
      toast.error("Invalid payment details");
      onError?.("Invalid payment details");
      return;
    }

    setIsLoading(true);

    try {
      const amountInKobo = Math.round(amount * 100); // Convert Rands to kobo
      const reference = generateReference();

      console.log("Initiating Paystack payment:", {
        email,
        amount: amountInKobo,
        reference,
        subaccountCode,
        metadata,
      });

      const config: PaystackConfig = {
        key: PAYSTACK_CONFIG.getPublicKey(),
        email: email,
        amount: amountInKobo,
        currency: "ZAR",
        ref: reference,
        metadata: {
          ...metadata,
          custom_fields: [
            {
              display_name: "Order Reference",
              variable_name: "order_reference",
              value: reference,
            },
            ...(metadata.custom_fields || []),
          ],
        },
        callback: (response: PaystackResponse) => {
          console.log("Payment successful:", response);
          setIsLoading(false);

          toast.success("Payment successful!", {
            description: `Transaction reference: ${response.reference}`,
          });

          onSuccess(response);
        },
        onClose: () => {
          console.log("Payment popup closed");
          setIsLoading(false);

          toast.info("Payment cancelled", {
            description: "You can try again anytime",
          });

          onClose?.();
        },
      };

      // Add subaccount if provided
      if (subaccountCode) {
        config.subaccount = subaccountCode;
        console.log("Payment will be split to subaccount:", subaccountCode);
      }

      const handler = window.PaystackPop.setup(config);
      handler.openIframe();
    } catch (error) {
      console.error("Payment initiation error:", error);
      setIsLoading(false);

      const errorMessage =
        error instanceof Error ? error.message : "Payment failed to initialize";
      toast.error(errorMessage);
      onError?.(errorMessage);
    }
  };

  return (
    <>
      {children ? (
        <div onClick={handlePayment} className={className}>
          {children}
        </div>
      ) : (
        <Button
          onClick={handlePayment}
          disabled={disabled || isLoading || !scriptLoaded}
          className={`${className} ${!scriptLoaded ? "opacity-50" : ""}`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4 mr-2" />
              {buttonText}
            </>
          )}
        </Button>
      )}
    </>
  );
};

export default PaystackPopup;

// Hook for programmatic usage
export const usePaystackPopup = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    const loadScript = () => {
      if (window.PaystackPop) {
        setScriptLoaded(true);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://js.paystack.co/v1/inline.js";
      script.async = true;
      script.onload = () => setScriptLoaded(true);
      document.head.appendChild(script);
    };

    loadScript();
  }, []);

  const initializePayment = (config: Omit<PaystackConfig, "key">) => {
    return new Promise<PaystackResponse>((resolve, reject) => {
      if (!scriptLoaded || !window.PaystackPop) {
        reject(new Error("Paystack not loaded"));
        return;
      }

      if (!PAYSTACK_CONFIG.isConfigured()) {
        reject(new Error("Paystack not configured"));
        return;
      }

      setIsLoading(true);

      const fullConfig: PaystackConfig = {
        ...config,
        key: PAYSTACK_CONFIG.getPublicKey(),
        callback: (response: PaystackResponse) => {
          setIsLoading(false);
          resolve(response);
        },
        onClose: () => {
          setIsLoading(false);
          reject(new Error("Payment cancelled"));
        },
      };

      try {
        const handler = window.PaystackPop.setup(fullConfig);
        handler.openIframe();
      } catch (error) {
        setIsLoading(false);
        reject(error);
      }
    });
  };

  return {
    initializePayment,
    isLoading,
    scriptLoaded,
    isReady: scriptLoaded && PAYSTACK_CONFIG.isConfigured(),
  };
};

// Utility function to format amount for display
export const formatAmount = (amount: number): string => {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

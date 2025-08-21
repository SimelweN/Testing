import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CreditCard, Loader2, AlertTriangle } from "lucide-react";
import { PAYSTACK_CONFIG } from "@/config/paystack";
import { useIsMobile } from "@/hooks/use-mobile";

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

interface PaystackPopupMobileProps {
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

const PaystackPopupMobile: React.FC<PaystackPopupMobileProps> = ({
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
  const [retryCount, setRetryCount] = useState(0);
  const isMobile = useIsMobile();

  // Load Paystack script on component mount with mobile optimizations
  useEffect(() => {
    const loadPaystackScript = () => {
      // Check if script is already loaded
      if (window.PaystackPop) {
        setScriptLoaded(true);
        return;
      }

      // Remove any existing scripts first (mobile cleanup)
      const existingScripts = document.querySelectorAll('script[src*="paystack"]');
      existingScripts.forEach(script => script.remove());

      // Load the script with mobile-specific optimizations
      const script = document.createElement("script");
      script.src = "https://js.paystack.co/v1/inline.js";
      script.async = true;
      script.defer = true; // Better for mobile performance
      
      // Mobile-specific script loading with longer timeout
      const timeout = isMobile ? 15000 : 10000;
      
      script.onload = () => {
        console.log("Paystack script loaded successfully (mobile optimized)");
        
        // Mobile: Wait a bit longer for PaystackPop to be available
        const checkPaystackReady = () => {
          if (window.PaystackPop) {
            setScriptLoaded(true);
            return;
          }
          
          // Try again in 100ms
          setTimeout(checkPaystackReady, 100);
        };
        
        if (isMobile) {
          setTimeout(checkPaystackReady, 200); // Wait 200ms on mobile
        } else {
          checkPaystackReady();
        }
      };
      
      script.onerror = () => {
        console.error("Failed to load Paystack script");
        const errorMsg = isMobile 
          ? "Payment system failed to load. Please check your internet connection and try again."
          : "Failed to load payment system";
        onError?.(errorMsg);
        toast.error(errorMsg);
      };

      // Set timeout for script loading
      setTimeout(() => {
        if (!scriptLoaded && !window.PaystackPop) {
          console.error("Paystack script loading timeout");
          onError?.("Payment system loading timeout");
          toast.error("Payment system took too long to load. Please try again.");
        }
      }, timeout);

      document.head.appendChild(script);
    };

    loadPaystackScript();

    // Cleanup function
    return () => {
      // Don't remove script on unmount in case other components need it
    };
  }, [onError, scriptLoaded, isMobile]);

  const generateReference = () => {
    return (
      orderReference ||
      `RBK-${Date.now()}-${Math.floor(Math.random() * 1000000)}`
    );
  };

  const handlePayment = () => {
    if (!scriptLoaded || !window.PaystackPop) {
      const message = isMobile 
        ? "Payment system not ready. Please wait a moment and try again."
        : "Payment system not ready. Please try again.";
      toast.error(message);
      onError?.(message);
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

      console.log("Initiating mobile-optimized Paystack payment:", {
        email,
        amount: amountInKobo,
        reference,
        subaccountCode,
        metadata,
        isMobile,
      });

      const config: PaystackConfig = {
        key: PAYSTACK_CONFIG.getPublicKey(),
        email: email,
        amount: amountInKobo,
        currency: "ZAR",
        ref: reference,
        metadata: {
          ...metadata,
          mobile_optimized: isMobile,
          user_agent: navigator.userAgent,
          custom_fields: [
            {
              display_name: "Order Reference",
              variable_name: "order_reference",
              value: reference,
            },
            {
              display_name: "Platform",
              variable_name: "platform",
              value: isMobile ? "mobile" : "desktop",
            },
            ...(metadata.custom_fields || []),
          ],
        },
        callback: (response: PaystackResponse) => {
          console.log("Mobile payment successful:", response);
          setIsLoading(false);

          toast.success("Payment successful!", {
            description: `Transaction reference: ${response.reference}`,
            duration: isMobile ? 6000 : 4000,
          });

          onSuccess(response);
        },
        onClose: () => {
          console.log("Mobile payment popup closed");
          setIsLoading(false);

          // On mobile, be more understanding about payment cancellation
          if (isMobile) {
            toast.info("Payment cancelled", {
              description: "You can try again anytime",
              duration: 4000,
            });
          } else {
            toast.info("Payment cancelled", {
              description: "You can try again anytime",
            });
          }

          onClose?.();
        },
      };

      // Add subaccount if provided
      if (subaccountCode) {
        config.subaccount = subaccountCode;
        console.log("Payment will be split to subaccount:", subaccountCode);
      }

      // Mobile-specific iframe setup
      if (isMobile) {
        // Ensure viewport is properly set for mobile payment
        let viewport = document.querySelector('meta[name="viewport"]');
        if (!viewport) {
          viewport = document.createElement('meta');
          viewport.setAttribute('name', 'viewport');
          document.head.appendChild(viewport);
        }
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
      }

      const handler = window.PaystackPop.setup(config);
      
      // Add small delay on mobile to ensure proper setup
      if (isMobile) {
        setTimeout(() => {
          handler.openIframe();
        }, 100);
      } else {
        handler.openIframe();
      }
      
    } catch (error) {
      console.error("Mobile payment initiation error:", error);
      setIsLoading(false);

      const errorMessage = error instanceof Error 
        ? error.message 
        : "Payment failed to initialize";
        
      const userMessage = isMobile
        ? `Payment setup failed: ${errorMessage}. Please try again or use a different browser.`
        : errorMessage;
        
      toast.error(userMessage, {
        duration: isMobile ? 8000 : 5000,
      });
      onError?.(userMessage);
    }
  };

  const handleRetry = () => {
    if (retryCount < 3) {
      setRetryCount(prev => prev + 1);
      console.log(`Mobile payment retry attempt ${retryCount + 1}`);
      
      // Reset script loading state and retry
      setScriptLoaded(false);
      
      // Small delay before retry
      setTimeout(() => {
        const script = document.querySelector('script[src*="paystack"]') as HTMLScriptElement;
        if (script) {
          script.remove();
        }
        // Trigger script reload
        setScriptLoaded(false);
      }, 1000);
      
      toast.info(`Retrying payment setup... (Attempt ${retryCount + 1}/3)`);
    } else {
      toast.error("Multiple payment setup failures. Please refresh the page and try again.");
      onError?.("Multiple payment setup failures");
    }
  };

  const renderButton = () => {
    if (!scriptLoaded && isMobile) {
      return (
        <Button
          onClick={handleRetry}
          disabled={disabled}
          className={`${className} bg-orange-500 hover:bg-orange-600`}
          variant="outline"
        >
          <AlertTriangle className="w-4 h-4 mr-2" />
          Payment Setup Failed - Retry
        </Button>
      );
    }

    return (
      <Button
        onClick={handlePayment}
        disabled={disabled || isLoading || !scriptLoaded}
        className={`${className} ${!scriptLoaded ? "opacity-50" : ""} ${isMobile ? "min-h-[48px] text-base" : ""}`}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {isMobile ? "Processing..." : "Processing..."}
          </>
        ) : !scriptLoaded ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {isMobile ? "Loading..." : "Loading Payment..."}
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4 mr-2" />
            {buttonText}
          </>
        )}
      </Button>
    );
  };

  return (
    <>
      {children ? (
        <div onClick={handlePayment} className={className}>
          {children}
        </div>
      ) : (
        renderButton()
      )}
    </>
  );
};

export default PaystackPopupMobile;

// Hook for programmatic mobile-optimized usage
export const usePaystackPopupMobile = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const loadScript = () => {
      if (window.PaystackPop) {
        setScriptLoaded(true);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://js.paystack.co/v1/inline.js";
      script.async = true;
      script.defer = isMobile; // Use defer on mobile for better performance
      script.onload = () => {
        // Mobile: wait a bit longer for PaystackPop to be available
        if (isMobile) {
          setTimeout(() => setScriptLoaded(true), 200);
        } else {
          setScriptLoaded(true);
        }
      };
      document.head.appendChild(script);
    };

    loadScript();
  }, [isMobile]);

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
        
        if (isMobile) {
          // Small delay on mobile for better UX
          setTimeout(() => {
            handler.openIframe();
          }, 100);
        } else {
          handler.openIframe();
        }
      } catch (error) {
        setIsLoading(false);
        reject(error);
      }
    });
  };

  return {
    initializePayment,
    isLoading,
    isReady: scriptLoaded,
    isMobile,
  };
};

// Utility function for mobile-specific amount formatting
export const formatAmountMobile = (amount: number): string => {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 2,
  }).format(amount);
};

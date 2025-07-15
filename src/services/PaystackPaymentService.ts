import { toast } from "sonner";

export interface PaymentInitialization {
  email: string;
  amount: number; // in kobo (ZAR cents)
  reference: string;
  subaccount?: string;
  metadata?: Record<string, any>;
  onSuccess?: (response: any) => void;
  onCancel?: () => void;
}

export interface PaymentResponse {
  success: boolean;
  reference?: string;
  error?: string;
}

declare global {
  interface Window {
    PaystackPop?: any;
  }
}

export class PaystackPaymentService {
  private static PAYSTACK_PUBLIC_KEY =
    import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || "pk_test_default";

  /**
   * Dynamically loads the Paystack inline script
   */
  static async loadPaystackScript(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      // Check if script is already loaded
      if (window.PaystackPop) {
        resolve(true);
        return;
      }

      // Check if script element already exists
      const existingScript = document.querySelector(
        'script[src*="js.paystack.co"]',
      );
      if (existingScript) {
        // Wait for it to load
        existingScript.addEventListener("load", () => resolve(true));
        existingScript.addEventListener("error", () => reject(false));
        return;
      }

      // Create and load script
      const script = document.createElement("script");
      script.src = "https://js.paystack.co/v1/inline.js";
      script.async = true;

      script.onload = () => {
        if (window.PaystackPop) {
          resolve(true);
        } else {
          reject(false);
        }
      };

      script.onerror = () => reject(false);

      document.body.appendChild(script);
    });
  }

  /**
   * Initialize payment popup using the correct Paystack pattern
   */
  static async initializePayment(
    params: PaymentInitialization,
  ): Promise<PaymentResponse> {
    try {
      // Load Paystack script first
      const scriptLoaded = await this.loadPaystackScript();
      if (!scriptLoaded) {
        return { success: false, error: "Failed to load Paystack script" };
      }

      // Get PaystackPop from global window object
      const PaystackPop = window.PaystackPop;
      if (!PaystackPop) {
        return { success: false, error: "Paystack not available" };
      }

      const paystack = new PaystackPop();

      const transactionParams = {
        key: this.PAYSTACK_PUBLIC_KEY, // From environment
        email: params.email,
        amount: params.amount, // in kobo (ZAR cents)
        reference: params.reference,
        currency: "ZAR",
        subaccount: params.subaccount, // For split payments
        metadata: params.metadata || {},
        onSuccess: (response: any) => {
          // Auto-verify payment on success
          if (params.onSuccess) {
            params.onSuccess(response);
          }
          // You can add verification logic here
          this.verifyPayment(response.reference);
        },
        onCancel: () => {
          // Handle user cancellation
          toast.info("Payment was cancelled");
          if (params.onCancel) {
            params.onCancel();
          }
        },
      };

      // Initialize the transaction
      paystack.newTransaction(transactionParams);

      return { success: true, reference: params.reference };
    } catch (error) {
      console.error("Payment initialization error:", error);
      return { success: false, error: "Failed to initialize payment" };
    }
  }

  /**
   * Verify payment (placeholder for actual verification)
   */
  static async verifyPayment(reference: string): Promise<PaymentResponse> {
    try {
      // Here you would typically call your backend to verify the payment
      console.log("Verifying payment:", reference);

      // For now, return success
      // In production, this should make an API call to your backend
      return { success: true, reference };
    } catch (error) {
      console.error("Payment verification error:", error);
      return { success: false, error: "Failed to verify payment" };
    }
  }
}

// Simple Paystack payment service for popup/modal payments

interface PaystackConfig {
  email: string;
  amount: number; // in kobo
  reference: string;
  subaccount?: string;
  metadata?: Record<string, any>;
}

interface PaystackResult {
  success: boolean;
  reference: string;
  cancelled?: boolean;
  message?: string;
}

export class PaystackPaymentService {
  static async initializePayment(
    config: PaystackConfig,
  ): Promise<PaystackResult> {
    return new Promise((resolve) => {
      try {
        // Check if PaystackPop is available
        if (typeof window === "undefined" || !window.PaystackPop) {
          throw new Error("Paystack library not available");
        }

        const handler = window.PaystackPop.setup({
          key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || "pk_test_dummy_key",
          email: config.email,
          amount: config.amount,
          ref: config.reference,
          subaccount: config.subaccount,
          metadata: config.metadata,
          callback: function (response: any) {
            console.log("✅ Paystack payment successful:", response);
            resolve({
              success: true,
              reference: response.reference,
              message: "Payment completed successfully",
            });
          },
          onClose: function () {
            console.log("❌ Paystack payment closed by user");
            resolve({
              success: false,
              reference: config.reference,
              cancelled: true,
              message: "Payment was cancelled",
            });
          },
        });

        // Open the payment modal
        handler.openIframe();
      } catch (error) {
        console.error("Paystack payment error:", error);
        resolve({
          success: false,
          reference: config.reference,
          message: error instanceof Error ? error.message : "Payment failed",
        });
      }
    });
  }
}

// Extend window interface for TypeScript
declare global {
  interface Window {
    PaystackPop: {
      setup: (config: any) => {
        openIframe: () => void;
      };
    };
  }
}

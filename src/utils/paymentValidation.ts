import { PAYSTACK_CONFIG } from "@/config/paystack";
import { supabase } from "@/integrations/supabase/client";

export interface PaymentSystemStatus {
  component: string;
  status: "healthy" | "warning" | "error";
  message: string;
  details?: any;
}

export interface PaymentValidationResult {
  overall: "healthy" | "warning" | "error";
  systems: PaymentSystemStatus[];
  summary: string;
}

export class PaymentValidator {
  /**
   * Comprehensive validation of all payment-related systems
   */
  static async validatePaymentSystems(): Promise<PaymentValidationResult> {
    const systems: PaymentSystemStatus[] = [];

    // 1. Validate Paystack Configuration
    systems.push(this.validatePaystackConfig());

    // 2. Validate Database Tables
    systems.push(await this.validateDatabaseTables());

    // 3. Validate API Endpoints
    systems.push(await this.validateApiEndpoints());

    // 4. Validate Webhook Configuration
    systems.push(await this.validateWebhookSetup());

    // 5. Validate Refund System
    systems.push(await this.validateRefundSystem());

    // Determine overall status
    const errorCount = systems.filter((s) => s.status === "error").length;
    const warningCount = systems.filter((s) => s.status === "warning").length;

    let overall: "healthy" | "warning" | "error";
    let summary: string;

    if (errorCount > 0) {
      overall = "error";
      summary = `${errorCount} critical payment system(s) failing`;
    } else if (warningCount > 0) {
      overall = "warning";
      summary = `${warningCount} payment system(s) have warnings`;
    } else {
      overall = "healthy";
      summary = "All payment systems operational";
    }

    return {
      overall,
      systems,
      summary,
    };
  }

  /**
   * Validate Paystack configuration
   */
  private static validatePaystackConfig(): PaymentSystemStatus {
    const config = PAYSTACK_CONFIG;

    if (!config.isConfigured()) {
      return {
        component: "Paystack Configuration",
        status: "error",
        message: "Paystack public key not configured",
        details: {
          publicKey: config.PUBLIC_KEY,
          isDevelopment: config.isDevelopment(),
        },
      };
    }

    if (config.isDevelopment() && config.isTestMode()) {
      return {
        component: "Paystack Configuration",
        status: "warning",
        message:
          "Using test mode - ensure production keys are set for live deployment",
        details: {
          isTestMode: config.isTestMode(),
          isLiveMode: config.isLiveMode(),
        },
      };
    }

    return {
      component: "Paystack Configuration",
      status: "healthy",
      message: `Paystack configured correctly (${config.isTestMode() ? "test" : "live"} mode)`,
      details: {
        isTestMode: config.isTestMode(),
        isLiveMode: config.isLiveMode(),
      },
    };
  }

  /**
   * Validate database tables exist and have proper structure
   */
  private static async validateDatabaseTables(): Promise<PaymentSystemStatus> {
    try {
      // Check if payment_transactions table exists and is accessible
      const { data: paymentTransactions, error: ptError } = await supabase
        .from("payment_transactions")
        .select("count")
        .limit(1);

      if (ptError) {
        return {
          component: "Database Tables",
          status: "error",
          message: "payment_transactions table not accessible",
          details: { error: ptError.message },
        };
      }

      // Check if refund_transactions table exists
      const { data: refundTransactions, error: rtError } = await supabase
        .from("refund_transactions")
        .select("count")
        .limit(1);

      if (rtError) {
        return {
          component: "Database Tables",
          status: "error",
          message: "refund_transactions table not accessible",
          details: { error: rtError.message },
        };
      }

      // Check if orders table has payment-related columns
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("payment_reference, refund_status, refunded_at")
        .limit(1);

      if (ordersError) {
        return {
          component: "Database Tables",
          status: "warning",
          message: "Orders table missing payment columns",
          details: { error: ordersError.message },
        };
      }

      return {
        component: "Database Tables",
        status: "healthy",
        message: "All payment database tables accessible",
      };
    } catch (error) {
      return {
        component: "Database Tables",
        status: "error",
        message: "Database connection failed",
        details: {
          error: error instanceof Error ? error.message : "Unknown error",
        },
      };
    }
  }

  /**
   * Validate API endpoints are accessible
   */
  private static async validateApiEndpoints(): Promise<PaymentSystemStatus> {
    const endpoints = [
      "/api/initialize-paystack-payment",
      "/api/process-book-purchase",
      "/api/process-refund",
      "/api/paystack-webhook",
      "/api/pay-seller",
    ];

    const results = [];

    for (const endpoint of endpoints) {
      try {
        // Make a basic OPTIONS request to check if endpoint exists
        const response = await fetch(endpoint, { method: "OPTIONS" });
        results.push({
          endpoint,
          accessible: response.ok || response.status === 405, // 405 is expected for unsupported method
          status: response.status,
        });
      } catch (error) {
        results.push({
          endpoint,
          accessible: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const inaccessibleEndpoints = results.filter((r) => !r.accessible);

    if (inaccessibleEndpoints.length > 0) {
      return {
        component: "API Endpoints",
        status: "error",
        message: `${inaccessibleEndpoints.length} payment API endpoints not accessible`,
        details: { inaccessibleEndpoints },
      };
    }

    return {
      component: "API Endpoints",
      status: "healthy",
      message: "All payment API endpoints accessible",
      details: { endpoints: results },
    };
  }

  /**
   * Validate webhook configuration
   */
  private static async validateWebhookSetup(): Promise<PaymentSystemStatus> {
    // This is a basic validation - in production you'd want to check with Paystack API
    // to verify webhook URLs are properly configured

    try {
      // Check if we have a webhook handler
      const response = await fetch("/api/paystack-webhook", {
        method: "OPTIONS",
      });

      if (!response.ok && response.status !== 405) {
        return {
          component: "Webhook Setup",
          status: "error",
          message: "Paystack webhook endpoint not accessible",
          details: { status: response.status },
        };
      }

      return {
        component: "Webhook Setup",
        status: "warning",
        message:
          "Webhook endpoint accessible - verify Paystack dashboard configuration",
        details: {
          webhookUrl: "/api/paystack-webhook",
          requiredEvents: [
            "charge.success",
            "charge.failed",
            "transfer.success",
            "transfer.failed",
          ],
        },
      };
    } catch (error) {
      return {
        component: "Webhook Setup",
        status: "error",
        message: "Webhook validation failed",
        details: {
          error: error instanceof Error ? error.message : "Unknown error",
        },
      };
    }
  }

  /**
   * Validate refund system functionality
   */
  private static async validateRefundSystem(): Promise<PaymentSystemStatus> {
    try {
      // Check if refund API endpoint is accessible
      const response = await fetch("/api/process-refund", {
        method: "OPTIONS",
      });

      if (!response.ok && response.status !== 405) {
        return {
          component: "Refund System",
          status: "error",
          message: "Refund API endpoint not accessible",
          details: { status: response.status },
        };
      }

      // Check if we can access refund transactions table
      const { error: refundTableError } = await supabase
        .from("refund_transactions")
        .select("count")
        .limit(1);

      if (refundTableError) {
        return {
          component: "Refund System",
          status: "error",
          message: "Refund transactions table not accessible",
          details: { error: refundTableError.message },
        };
      }

      return {
        component: "Refund System",
        status: "healthy",
        message: "Refund system operational",
      };
    } catch (error) {
      return {
        component: "Refund System",
        status: "error",
        message: "Refund system validation failed",
        details: {
          error: error instanceof Error ? error.message : "Unknown error",
        },
      };
    }
  }

  /**
   * Quick health check for critical payment functions
   */
  static async quickHealthCheck(): Promise<boolean> {
    try {
      // Check Paystack config
      if (!PAYSTACK_CONFIG.isConfigured() && !PAYSTACK_CONFIG.isDevelopment()) {
        return false;
      }

      // Check database connectivity
      const { error } = await supabase
        .from("payment_transactions")
        .select("count")
        .limit(1);

      return !error;
    } catch {
      return false;
    }
  }
}

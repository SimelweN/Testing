import { PaymentValidator } from "./paymentValidation";
import { RefundService } from "@/services/refundService";

/**
 * Test utility to validate and debug payment system issues
 */
export class PaymentSystemTester {
  /**
   * Run comprehensive payment system tests
   */
  static async runTests(): Promise<void> {
    console.log("🧪 Starting Payment System Tests...\n");

    // 1. Validate all payment systems
    console.log("1️⃣ Validating Payment Systems...");
    const validation = await PaymentValidator.validatePaymentSystems();

    console.log(`Overall Status: ${validation.overall.toUpperCase()}`);
    console.log(`Summary: ${validation.summary}\n`);

    // Print detailed results
    validation.systems.forEach((system, index) => {
      const emoji =
        system.status === "healthy"
          ? "✅"
          : system.status === "warning"
            ? "⚠️"
            : "❌";
      console.log(`${emoji} ${system.component}: ${system.message}`);

      if (system.details) {
        console.log(`   Details:`, system.details);
      }
    });

    console.log("\n" + "=".repeat(50) + "\n");

    // 2. Test configuration
    console.log("2️⃣ Testing Configuration...");
    await this.testConfiguration();

    console.log("\n" + "=".repeat(50) + "\n");

    // 3. Test database operations
    console.log("3️⃣ Testing Database Operations...");
    await this.testDatabaseOperations();

    console.log("\n" + "=".repeat(50) + "\n");

    // 4. Show recommendations
    console.log("4️⃣ Recommendations...");
    this.showRecommendations(validation);

    console.log("\n🏁 Payment System Tests Complete!");
  }

  /**
   * Test payment configuration
   */
  private static async testConfiguration(): Promise<void> {
    try {
      // Test environment variables
      const envVars = [
        "VITE_PAYSTACK_PUBLIC_KEY",
        "VITE_SUPABASE_URL",
        "VITE_SUPABASE_ANON_KEY",
      ];

      envVars.forEach((envVar) => {
        const value = import.meta.env[envVar];
        if (value) {
          console.log(`✅ ${envVar}: Configured`);
        } else {
          console.log(`❌ ${envVar}: Missing`);
        }
      });

      // Test Paystack configuration
      const { PAYSTACK_CONFIG } = await import("@/config/paystack");
      console.log(
        `✅ Paystack Config: ${PAYSTACK_CONFIG.isConfigured() ? "Valid" : "Invalid"}`,
      );
      console.log(`   Mode: ${PAYSTACK_CONFIG.isTestMode() ? "Test" : "Live"}`);
    } catch (error) {
      console.error("❌ Configuration test failed:", error);
    }
  }

  /**
   * Test database operations
   */
  private static async testDatabaseOperations(): Promise<void> {
    try {
      const { supabase } = await import("@/integrations/supabase/client");

      // Test payment_transactions table
      const { data: ptData, error: ptError } = await supabase
        .from("payment_transactions")
        .select("count")
        .limit(1);

      if (ptError) {
        console.log("❌ payment_transactions table:", ptError.message);
      } else {
        console.log("✅ payment_transactions table: Accessible");
      }

      // Test refund_transactions table
      const { data: rtData, error: rtError } = await supabase
        .from("refund_transactions")
        .select("count")
        .limit(1);

      if (rtError) {
        console.log("❌ refund_transactions table:", rtError.message);
      } else {
        console.log("✅ refund_transactions table: Accessible");
      }

      // Test orders table payment columns
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("payment_reference, refund_status")
        .limit(1);

      if (ordersError) {
        console.log("❌ orders table payment columns:", ordersError.message);
      } else {
        console.log("✅ orders table payment columns: Available");
      }
    } catch (error) {
      console.error("❌ Database operations test failed:", error);
    }
  }

  /**
   * Show actionable recommendations based on test results
   */
  private static showRecommendations(validation: any): void {
    const errors = validation.systems.filter((s: any) => s.status === "error");
    const warnings = validation.systems.filter(
      (s: any) => s.status === "warning",
    );

    if (errors.length === 0 && warnings.length === 0) {
      console.log("🎉 All systems are healthy! No action required.");
      return;
    }

    console.log("📋 Action Items:\n");

    errors.forEach((error: any, index: number) => {
      console.log(`${index + 1}. ❌ CRITICAL: ${error.component}`);
      console.log(`   Issue: ${error.message}`);
      console.log(`   Action: ${this.getRecommendation(error.component)}\n`);
    });

    warnings.forEach((warning: any, index: number) => {
      console.log(
        `${errors.length + index + 1}. ⚠️ WARNING: ${warning.component}`,
      );
      console.log(`   Issue: ${warning.message}`);
      console.log(`   Action: ${this.getRecommendation(warning.component)}\n`);
    });
  }

  /**
   * Get specific recommendations for each component
   */
  private static getRecommendation(component: string): string {
    const recommendations: Record<string, string> = {
      "Paystack Configuration":
        "Set VITE_PAYSTACK_PUBLIC_KEY and VITE_PAYSTACK_SECRET_KEY environment variables",
      "Database Tables":
        "Run database migration: `supabase migration up` or create missing tables",
      "API Endpoints":
        "Ensure all payment API files exist in /api directory and deploy properly",
      "Webhook Setup":
        "Configure webhook URL in Paystack dashboard pointing to /api/paystack-webhook",
      "Refund System":
        "Verify refund service is properly deployed and database tables exist",
    };

    return (
      recommendations[component] || "Check logs for specific error details"
    );
  }

  /**
   * Quick diagnostic for common issues
   */
  static async quickDiagnose(): Promise<void> {
    console.log("🔍 Quick Payment System Diagnosis...\n");

    // Check if system is healthy
    const isHealthy = await PaymentValidator.quickHealthCheck();

    if (isHealthy) {
      console.log("✅ Payment system appears healthy");
    } else {
      console.log("❌ Payment system has issues");
      console.log("\nRun PaymentSystemTester.runTests() for detailed analysis");
    }

    // Test a simple refund operation (dry run)
    try {
      console.log("\n🧪 Testing refund service initialization...");

      // This just tests if the service can be instantiated
      const refundResult = await RefundService.getUserRefunds("test-user-id");
      console.log("✅ Refund service: Functional");
    } catch (error) {
      console.log(
        "❌ Refund service:",
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  }
}

// Export for console access
if (typeof window !== "undefined") {
  (window as any).PaymentSystemTester = PaymentSystemTester;
  console.log("💡 Payment testing tools available:");
  console.log("   PaymentSystemTester.runTests() - Full system test");
  console.log("   PaymentSystemTester.quickDiagnose() - Quick health check");
}

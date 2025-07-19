import { supabase } from "@/integrations/supabase/client";
import { PAYSTACK_CONFIG } from "@/config/paystack";

export interface PaystackTestResult {
  component: string;
  status: "success" | "error" | "warning" | "info";
  message: string;
  details?: any;
  timing?: number;
}

export class PaystackSystemTester {
  private results: PaystackTestResult[] = [];

  async runComprehensiveTest(): Promise<PaystackTestResult[]> {
    this.results = [];

    console.log("🔍 Starting comprehensive Paystack system test...");

    // 1. Environment Configuration Check
    await this.testEnvironmentConfiguration();

    // 2. Paystack Public Key Validation
    await this.testPaystackConfiguration();

    // 3. Database Connectivity
    await this.testDatabaseConnectivity();

    // 4. Edge Function Health Checks
    await this.testEdgeFunctionHealth();

    // 5. Paystack API Connectivity (via edge functions)
    await this.testPaystackApiConnectivity();

    // 6. Subaccount Management
    await this.testSubaccountFunctionality();

    // 7. Split Management
    await this.testSplitManagement();

    // 8. Transfer Management
    await this.testTransferManagement();

    // 9. Payment Flow Testing
    await this.testPaymentFlow();

    // 10. Refund System Testing
    await this.testRefundSystem();

    return this.results;
  }

  private addResult(
    component: string,
    status: PaystackTestResult["status"],
    message: string,
    details?: any,
    timing?: number,
  ) {
    this.results.push({ component, status, message, details, timing });
    console.log(`${this.getStatusIcon(status)} ${component}: ${message}`);
  }

  private getStatusIcon(status: PaystackTestResult["status"]): string {
    switch (status) {
      case "success":
        return "✅";
      case "error":
        return "❌";
      case "warning":
        return "⚠️";
      case "info":
        return "ℹ️";
      default:
        return "📋";
    }
  }

  private async measureTime<T>(
    fn: () => Promise<T>,
  ): Promise<{ result: T; timing: number }> {
    const start = performance.now();
    const result = await fn();
    const timing = performance.now() - start;
    return { result, timing };
  }

  // Test 1: Environment Configuration
  private async testEnvironmentConfiguration() {
    try {
      const config = {
        supabaseUrl: !!import.meta.env.VITE_SUPABASE_URL,
        supabaseAnonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
        paystackPublicKey: !!import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
        nodeEnv: import.meta.env.NODE_ENV,
        isDev: import.meta.env.DEV,
        isProd: import.meta.env.PROD,
      };

      const missingEnvVars = [];
      if (!config.supabaseUrl) missingEnvVars.push("VITE_SUPABASE_URL");
      if (!config.supabaseAnonKey)
        missingEnvVars.push("VITE_SUPABASE_ANON_KEY");
      if (!config.paystackPublicKey)
        missingEnvVars.push("VITE_PAYSTACK_PUBLIC_KEY");

      if (missingEnvVars.length > 0) {
        this.addResult(
          "Environment",
          "error",
          `Missing environment variables: ${missingEnvVars.join(", ")}`,
          config,
        );
      } else {
        this.addResult(
          "Environment",
          "success",
          "All required environment variables are configured",
          config,
        );
      }
    } catch (error) {
      this.addResult(
        "Environment",
        "error",
        `Configuration check failed: ${error.message}`,
      );
    }
  }

  // Test 2: Paystack Configuration
  private async testPaystackConfiguration() {
    try {
      const config = {
        isConfigured: PAYSTACK_CONFIG.isConfigured(),
        isTestMode: PAYSTACK_CONFIG.isTestMode(),
        isLiveMode: PAYSTACK_CONFIG.isLiveMode(),
        publicKey: PAYSTACK_CONFIG.getPublicKey(),
        isDevelopment: PAYSTACK_CONFIG.isDevelopment(),
      };

      if (!config.isConfigured) {
        this.addResult(
          "Paystack Config",
          "warning",
          "Paystack not configured - using development fallback",
          config,
        );
      } else if (config.isTestMode) {
        this.addResult(
          "Paystack Config",
          "info",
          "Paystack configured in TEST mode",
          config,
        );
      } else if (config.isLiveMode) {
        this.addResult(
          "Paystack Config",
          "success",
          "Paystack configured in LIVE mode",
          config,
        );
      }
    } catch (error) {
      this.addResult(
        "Paystack Config",
        "error",
        `Configuration validation failed: ${error.message}`,
      );
    }
  }

  // Test 3: Database Connectivity
  private async testDatabaseConnectivity() {
    try {
      const { result, timing } = await this.measureTime(async () => {
        // Test basic connectivity
        const { data, error } = await supabase
          .from("books")
          .select("count")
          .limit(1);
        if (error) throw error;
        return data;
      });

      this.addResult(
        "Database",
        "success",
        "Database connectivity verified",
        { result },
        timing,
      );
    } catch (error) {
      this.addResult(
        "Database",
        "error",
        `Database connection failed: ${error.message}`,
      );
    }
  }

  // Test 4: Edge Function Health
  private async testEdgeFunctionHealth() {
    const functions = [
      "paystack-split-management",
      "paystack-transfer-management",
      "manage-paystack-subaccount",
      "paystack-refund-management",
      "initialize-paystack-payment",
      "verify-paystack-payment",
    ];

    for (const funcName of functions) {
      try {
        const { result, timing } = await this.measureTime(async () => {
          const { data, error } = await supabase.functions.invoke(funcName, {
            body: { health: true },
            method: "GET",
          });
          if (error) throw error;
          return data;
        });

        if (result?.success || result?.service) {
          this.addResult(
            `Edge Function: ${funcName}`,
            "success",
            "Health check passed",
            result,
            timing,
          );
        } else {
          this.addResult(
            `Edge Function: ${funcName}`,
            "warning",
            "Health check returned unexpected format",
            result,
            timing,
          );
        }
      } catch (error) {
        this.addResult(
          `Edge Function: ${funcName}`,
          "error",
          `Health check failed: ${error.message}`,
        );
      }
    }
  }

  // Test 5: Paystack API Connectivity
  private async testPaystackApiConnectivity() {
    try {
      const { result, timing } = await this.measureTime(async () => {
        const { data, error } = await supabase.functions.invoke(
          "paystack-transfer-management",
          {
            body: null,
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          },
        );
        if (error) throw error;
        return data;
      });

      if (result?.success) {
        this.addResult(
          "Paystack API",
          "success",
          "Paystack API connectivity verified",
          result,
          timing,
        );
      } else {
        this.addResult(
          "Paystack API",
          "warning",
          "Paystack API test returned unexpected format",
          result,
          timing,
        );
      }
    } catch (error) {
      this.addResult(
        "Paystack API",
        "error",
        `Paystack API connectivity failed: ${error.message}`,
      );
    }
  }

  // Test 6: Subaccount Management
  private async testSubaccountFunctionality() {
    try {
      const { result, timing } = await this.measureTime(async () => {
        const { data, error } = await supabase.functions.invoke(
          "manage-paystack-subaccount",
          {
            method: "GET",
            body: null,
          },
        );
        if (error) throw error;
        return data;
      });

      if (result?.success || result?.error === "NO_SUBACCOUNT_FOUND") {
        this.addResult(
          "Subaccount Management",
          "success",
          "Subaccount management function operational",
          result,
          timing,
        );
      } else {
        this.addResult(
          "Subaccount Management",
          "warning",
          "Subaccount function returned unexpected format",
          result,
          timing,
        );
      }
    } catch (error) {
      this.addResult(
        "Subaccount Management",
        "error",
        `Subaccount management test failed: ${error.message}`,
      );
    }
  }

  // Test 7: Split Management
  private async testSplitManagement() {
    try {
      const { result, timing } = await this.measureTime(async () => {
        const { data, error } = await supabase.functions.invoke(
          "paystack-split-management",
          {
            method: "GET",
            body: null,
          },
        );
        if (error) throw error;
        return data;
      });

      if (result?.success || result?.data) {
        this.addResult(
          "Split Management",
          "success",
          "Split management function operational",
          result,
          timing,
        );
      } else {
        this.addResult(
          "Split Management",
          "warning",
          "Split management returned unexpected format",
          result,
          timing,
        );
      }
    } catch (error) {
      this.addResult(
        "Split Management",
        "error",
        `Split management test failed: ${error.message}`,
      );
    }
  }

  // Test 8: Transfer Management
  private async testTransferManagement() {
    try {
      const { result, timing } = await this.measureTime(async () => {
        const { data, error } = await supabase.functions.invoke(
          "paystack-transfer-management",
          {
            method: "GET",
            body: { action: "banks" },
          },
        );
        if (error) throw error;
        return data;
      });

      if (result?.success || result?.data) {
        this.addResult(
          "Transfer Management",
          "success",
          "Transfer management function operational",
          result,
          timing,
        );
      } else {
        this.addResult(
          "Transfer Management",
          "warning",
          "Transfer management returned unexpected format",
          result,
          timing,
        );
      }
    } catch (error) {
      this.addResult(
        "Transfer Management",
        "error",
        `Transfer management test failed: ${error.message}`,
      );
    }
  }

  // Test 9: Payment Flow
  private async testPaymentFlow() {
    try {
      // Test payment initialization without actually creating a charge
      const testPayload = {
        amount: 1000, // R10.00 in kobo
        email: "test@example.com",
        reference: `test_${Date.now()}`,
        callback_url: window.location.origin + "/payment/callback",
        metadata: {
          test: true,
          user_id: "test-user",
        },
      };

      const { result, timing } = await this.measureTime(async () => {
        const { data, error } = await supabase.functions.invoke(
          "initialize-paystack-payment",
          {
            method: "POST",
            body: testPayload,
          },
        );
        if (error) throw error;
        return data;
      });

      if (result?.success || result?.authorization_url) {
        this.addResult(
          "Payment Flow",
          "success",
          "Payment initialization working",
          result,
          timing,
        );
      } else {
        this.addResult(
          "Payment Flow",
          "warning",
          "Payment initialization returned unexpected format",
          result,
          timing,
        );
      }
    } catch (error) {
      this.addResult(
        "Payment Flow",
        "error",
        `Payment flow test failed: ${error.message}`,
      );
    }
  }

  // Test 10: Refund System
  private async testRefundSystem() {
    try {
      const { result, timing } = await this.measureTime(async () => {
        const { data, error } = await supabase.functions.invoke(
          "paystack-refund-management",
          {
            method: "GET",
            body: null,
          },
        );
        if (error) throw error;
        return data;
      });

      if (result?.success || result?.data) {
        this.addResult(
          "Refund System",
          "success",
          "Refund management system operational",
          result,
          timing,
        );
      } else {
        this.addResult(
          "Refund System",
          "warning",
          "Refund system returned unexpected format",
          result,
          timing,
        );
      }
    } catch (error) {
      this.addResult(
        "Refund System",
        "error",
        `Refund system test failed: ${error.message}`,
      );
    }
  }

  // Generate test report
  generateReport(): string {
    const successCount = this.results.filter(
      (r) => r.status === "success",
    ).length;
    const errorCount = this.results.filter((r) => r.status === "error").length;
    const warningCount = this.results.filter(
      (r) => r.status === "warning",
    ).length;
    const totalTests = this.results.length;

    const report = `
🔍 PAYSTACK SYSTEM TEST REPORT
=====================================

📊 SUMMARY:
✅ Passed: ${successCount}/${totalTests}
❌ Failed: ${errorCount}/${totalTests}
⚠️ Warnings: ${warningCount}/${totalTests}

📋 DETAILED RESULTS:
${this.results.map((r) => `${this.getStatusIcon(r.status)} ${r.component}: ${r.message}${r.timing ? ` (${r.timing.toFixed(0)}ms)` : ""}`).join("\n")}

🎯 RECOMMENDATIONS:
${errorCount > 0 ? "❌ CRITICAL: Fix errors before using Paystack in production" : ""}
${warningCount > 0 ? "⚠️ WARNING: Address warnings for optimal performance" : ""}
${successCount === totalTests ? "🎉 ALL TESTS PASSED: Paystack system is fully operational!" : ""}

Generated: ${new Date().toLocaleString()}
    `;

    return report;
  }
}

// Export convenience function
export async function runPaystackSystemTest(): Promise<PaystackTestResult[]> {
  const tester = new PaystackSystemTester();
  return await tester.runComprehensiveTest();
}

export default PaystackSystemTester;

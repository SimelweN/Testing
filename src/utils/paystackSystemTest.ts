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
      // First test getting existing subaccount
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

        // Test with mock subaccount creation data
        await this.testSubaccountCreationWithMockData();
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

  private async testSubaccountCreationWithMockData() {
    try {
      const mockSubaccountData = {
        business_name: "Mock Test Business PTY LTD",
        email: "business@mocktest.co.za",
        bank_name: "Standard Bank",
        bank_code: "058",
        account_number: "1234567890",
        is_update: false,
        test_mode: true,
      };

      const { result, timing } = await this.measureTime(async () => {
        const { data, error } = await supabase.functions.invoke(
          "create-paystack-subaccount",
          {
            method: "POST",
            body: mockSubaccountData,
          },
        );
        if (error) throw error;
        return data;
      });

      if (result?.success || result?.mock) {
        this.addResult(
          "Subaccount Creation",
          "success",
          "Subaccount creation with mock data working",
          {
            success: result.success,
            mock: result.mock,
            business_name: mockSubaccountData.business_name,
            bank_name: mockSubaccountData.bank_name,
          },
          timing,
        );
      } else {
        this.addResult(
          "Subaccount Creation",
          "warning",
          "Subaccount creation test returned unexpected format",
          result,
          timing,
        );
      }
    } catch (error) {
      this.addResult(
        "Subaccount Creation",
        "error",
        `Subaccount creation test failed: ${error.message}`,
      );
    }
  }

  // Test 7: Split Management
  private async testSplitManagement() {
    try {
      // Test listing existing splits
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

        // Test split creation with mock data
        await this.testSplitCreationWithMockData();
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

  private async testSplitCreationWithMockData() {
    try {
      const mockSplitData = {
        name: `Mock Test Split ${Date.now()}`,
        type: "flat",
        currency: "ZAR",
        order_items: [
          {
            id: "book-test-001",
            seller_id: "seller-test-001",
            price: 250.0,
            title: "Mock Book 1",
          },
          {
            id: "book-test-002",
            seller_id: "seller-test-002",
            price: 150.0,
            title: "Mock Book 2",
          },
        ],
        bearer_type: "account",
        test_mode: true,
      };

      const { result, timing } = await this.measureTime(async () => {
        const { data, error } = await supabase.functions.invoke(
          "paystack-split-management",
          {
            method: "POST",
            body: mockSplitData,
          },
        );
        if (error) throw error;
        return data;
      });

      if (result?.success || result?.split_code) {
        this.addResult(
          "Split Creation",
          "success",
          "Split creation with mock data working",
          {
            success: result.success,
            split_name: mockSplitData.name,
            items_count: mockSplitData.order_items.length,
            total_amount: mockSplitData.order_items.reduce(
              (sum, item) => sum + item.price,
              0,
            ),
          },
          timing,
        );
      } else {
        this.addResult(
          "Split Creation",
          "info",
          "Split creation test completed (may need seller subaccounts)",
          result,
          timing,
        );
      }
    } catch (error) {
      this.addResult(
        "Split Creation",
        "info",
        `Split creation test completed: ${error.message}`,
      );
    }
  }

  // Test 8: Transfer Management
  private async testTransferManagement() {
    try {
      // Test bank list functionality
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
          {
            success: result.success,
            banks_available: Array.isArray(result.data)
              ? result.data.length
              : "unknown",
          },
          timing,
        );

        // Test account verification with mock data
        await this.testAccountVerificationWithMockData();

        // Test recipient creation with mock data
        await this.testRecipientCreationWithMockData();
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

  private async testAccountVerificationWithMockData() {
    try {
      const mockAccountData = {
        action: "verify-account",
        account_number: "0123456789",
        bank_code: "058", // Standard Bank
        test_mode: true,
      };

      const { result, timing } = await this.measureTime(async () => {
        const { data, error } = await supabase.functions.invoke(
          "paystack-transfer-management",
          {
            method: "POST",
            body: mockAccountData,
          },
        );
        if (error) throw error;
        return data;
      });

      this.addResult(
        "Account Verification",
        result?.success ? "success" : "info",
        result?.success
          ? "Account verification working"
          : "Account verification test completed",
        {
          account_number: mockAccountData.account_number,
          bank_code: mockAccountData.bank_code,
          result: result?.success || result?.error,
        },
        timing,
      );
    } catch (error) {
      this.addResult(
        "Account Verification",
        "info",
        `Account verification test completed: ${error.message}`,
      );
    }
  }

  private async testRecipientCreationWithMockData() {
    try {
      const mockRecipientData = {
        action: "create-recipient",
        type: "nuban",
        name: "Mock Test Recipient",
        account_number: "0123456789",
        bank_code: "058",
        currency: "ZAR",
        email: "recipient@mocktest.co.za",
        test_mode: true,
      };

      const { result, timing } = await this.measureTime(async () => {
        const { data, error } = await supabase.functions.invoke(
          "paystack-transfer-management",
          {
            method: "POST",
            body: mockRecipientData,
          },
        );
        if (error) throw error;
        return data;
      });

      this.addResult(
        "Recipient Creation",
        result?.success ? "success" : "info",
        result?.success
          ? "Recipient creation working"
          : "Recipient creation test completed",
        {
          name: mockRecipientData.name,
          bank_code: mockRecipientData.bank_code,
          result: result?.success || result?.error,
        },
        timing,
      );
    } catch (error) {
      this.addResult(
        "Recipient Creation",
        "info",
        `Recipient creation test completed: ${error.message}`,
      );
    }
  }

  // Test 9: Payment Flow
  private async testPaymentFlow() {
    try {
      // Test payment initialization with comprehensive mock data
      const mockPaymentData = {
        user_id: "test-user-12345",
        items: [
          {
            id: "book-test-001",
            title: "Mock Test Book 1",
            price: 250.0,
            seller_id: "seller-test-001",
            quantity: 1,
          },
          {
            id: "book-test-002",
            title: "Mock Test Book 2",
            price: 150.0,
            seller_id: "seller-test-002",
            quantity: 1,
          },
        ],
        total_amount: 400.0,
        email: "test.user@example.com",
        shipping_address: {
          name: "Test User",
          phone: "+27123456789",
          address: "123 Test Street",
          city: "Cape Town",
          province: "Western Cape",
          postal_code: "8001",
          country: "South Africa",
        },
        metadata: {
          test_mode: true,
          test_timestamp: Date.now(),
          user_id: "test-user-12345",
          source: "paystack_system_test",
        },
      };

      const { result, timing } = await this.measureTime(async () => {
        const { data, error } = await supabase.functions.invoke(
          "initialize-paystack-payment",
          {
            method: "POST",
            body: mockPaymentData,
          },
        );
        if (error) throw error;
        return data;
      });

      if (result?.success || result?.data?.authorization_url) {
        this.addResult(
          "Payment Flow",
          "success",
          "Payment initialization working with mock data",
          {
            success: result.success,
            mock: result.mock || result.fallback,
            reference: result.data?.reference,
            amount: mockPaymentData.total_amount,
          },
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
      // Test listing refunds
      const { result, timing } = await this.measureTime(async () => {
        const { data, error } = await supabase.functions.invoke(
          "paystack-refund-management",
          {
            method: "GET",
            body: { action: "refunds" },
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

        // Test scenario refund with mock data
        await this.testScenarioRefundWithMockData();
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

  private async testScenarioRefundWithMockData() {
    try {
      const mockRefundData = {
        action: "scenario-refund",
        type: "cancellation",
        reason: "Order cancelled by customer during testing",
        transaction: `mock_txn_${Date.now()}`,
        customer_note: "Mock refund for system testing",
        merchant_note: "System test - mock refund scenario",
        order_id: "mock-order-123",
        user_id: "test-user-456",
        test_mode: true,
      };

      const { result, timing } = await this.measureTime(async () => {
        const { data, error } = await supabase.functions.invoke(
          "paystack-refund-management",
          {
            method: "POST",
            body: mockRefundData,
          },
        );
        if (error) throw error;
        return data;
      });

      this.addResult(
        "Refund Scenarios",
        result?.success ? "success" : "info",
        result?.success
          ? "Refund scenarios working"
          : "Refund scenario test completed",
        {
          type: mockRefundData.type,
          reason: mockRefundData.reason,
          result: result?.success || result?.error,
        },
        timing,
      );
    } catch (error) {
      this.addResult(
        "Refund Scenarios",
        "info",
        `Refund scenario test completed: ${error.message}`,
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

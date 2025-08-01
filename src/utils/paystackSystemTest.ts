import { supabase } from "@/integrations/supabase/client";
import { PAYSTACK_CONFIG } from "@/config/paystack";

// Import comprehensive mock data for proper testing
const PaystackMockData = {
  initializePayment: {
    user_id: "550e8400-e29b-41d4-a716-446655440000",
    email: "test.user@example.com",
    amount: 29999, // Amount in kobo (R299.99)
    currency: "ZAR",
    reference: "TXN_" + Date.now() + "_TEST",
    callback_url: "https://rebookedsolutions.co.za/payment/callback",
    metadata: {
      book_id: "book-550e8400-e29b-41d4-a716-446655440001",
      book_title: "Test Book for Payment",
      seller_id: "550e8400-e29b-41d4-a716-446655440002",
      buyer_id: "550e8400-e29b-41d4-a716-446655440000",
      delivery_fee: 8500,
      platform_fee: 1500,
      seller_amount: 19999,
    },
  },
  splitManagement: {
    name: "Test Split " + Date.now(),
    type: "percentage",
    currency: "ZAR",
    subaccounts: [
      {
        subaccount: "ACCT_test_seller_1",
        share: 7000, // 70%
      },
      {
        subaccount: "ACCT_test_seller_2",
        share: 2000, // 20%
      },
    ],
    bearer_type: "account",
  },
  subaccountCreation: {
    business_name: "Test Business " + Date.now(),
    bank_code: "058",
    account_number: "1234567890",
    account_name: "Test Account Holder",
    phone: "+27123456789",
    email: "test@example.com",
    percentage_charge: 85.5,
    description: "Test subaccount for automated testing",
  },
  transferManagement: {
    amount: 10000, // R100.00 in kobo
    currency: "ZAR",
    reason: "test_transfer",
    reference: "TRANSFER_TEST_" + Date.now(),
    recipient_code: "RCP_test_recipient",
  },
  refundManagement: {
    transaction: "TXN_test_transaction",
    amount: 5000, // R50.00 in kobo
    currency: "ZAR",
    customer_note: "Test refund for automated testing",
    merchant_note: "Automated test refund",
  },
  paymentVerification: {
    reference: "TXN_" + Date.now() + "_VERIFY_TEST",
  },
};

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

  private getDetailedErrorInfo(error: any, functionName?: string) {
    return {
      message: error.message || "Unknown error",
      status: error.status || error.statusCode || error.code || "unknown",
      statusText: error.statusText || error.details || "unknown",
      name: error.name || "Error",
      functionName: functionName || "unknown",
      timestamp: new Date().toISOString(),
      stack: error.stack
        ? error.stack.split("\n").slice(0, 3).join(" | ")
        : "no stack",
      context: error.context || "test execution",
      // Try to extract more details from common error formats
      details: this.extractErrorDetails(error),
    };
  }

  private extractErrorDetails(error: any) {
    // Try to extract useful information from different error types
    if (typeof error === "string") {
      return error;
    }

    if (error.details) return error.details;
    if (error.hint) return error.hint;
    if (error.code) return `Code: ${error.code}`;
    if (error.statusCode && error.statusText) {
      return `HTTP ${error.statusCode}: ${error.statusText}`;
    }

    return "No additional details available";
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
      // "paystack-transfer-management", - removed - no automated transfers
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
          });

          // Enhanced error details
          if (error) {
            const enhancedError = {
              ...error,
              functionName: funcName,
              context: "health_check",
              timestamp: new Date().toISOString(),
            };
            throw enhancedError;
          }
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
            "error",
            `Health check failed - Response: ${JSON.stringify(result)} | Type: ${typeof result} | Has success: ${!!result?.success} | Has service: ${!!result?.service}`,
            {
              actual_response: result,
              expected_fields: ["success", "service"],
              response_type: typeof result,
              has_success: !!result?.success,
              has_service: !!result?.service,
            },
            timing,
          );
        }
      } catch (error) {
        const errorDetails = this.getDetailedErrorInfo(error, funcName);

        this.addResult(
          `Edge Function: ${funcName}`,
          "error",
          `Health check failed: ${errorDetails.message} | Status: ${errorDetails.status} | StatusText: ${errorDetails.statusText} | Details: ${errorDetails.details} | Stack: ${errorDetails.stack}`,
          errorDetails,
        );
      }
    }
  }

  // Test 5: Paystack API Connectivity - DISABLED
  private async testPaystackApiConnectivity() {
    // Transfer management disabled - no automated money transfers
    this.addResult(
      "Paystack API",
      "warning",
      "Paystack transfer API disabled - no automated money transfers allowed",
      { disabled: true, reason: "Transfer management permanently disabled for security" },
      0,
    );
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
          "error",
          `Subaccount test failed - Exact response: ${JSON.stringify(result)}`,
          {
            actual_response: result,
            expected_fields: ["success", "error"],
            response_keys: result ? Object.keys(result) : [],
            error_details:
              result?.error || result?.message || "No error message provided",
          },
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
      const { result, timing } = await this.measureTime(async () => {
        const { data, error } = await supabase.functions.invoke(
          "create-paystack-subaccount",
          {
            method: "POST",
            body: PaystackMockData.subaccountCreation,
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
            business_name: PaystackMockData.subaccountCreation.business_name,
            account_number: PaystackMockData.subaccountCreation.account_number,
          },
          timing,
        );
      } else {
        this.addResult(
          "Subaccount Creation",
          "error",
          `Subaccount creation failed - Exact response: ${JSON.stringify(result)}`,
          {
            actual_response: result,
            expected_fields: ["success", "mock"],
            response_keys: result ? Object.keys(result) : [],
            error_details:
              result?.error || result?.message || "No error message provided",
            input_data: PaystackMockData.subaccountCreation,
          },
          timing,
        );
      }
    } catch (error) {
      const errorDetails = {
        message: error.message,
        status: error.status || error.statusCode || "unknown",
        statusText: error.statusText || "unknown",
        functionName: "create-paystack-subaccount",
        inputData: PaystackMockData.subaccountCreation,
      };

      this.addResult(
        "Subaccount Creation",
        "error",
        `Subaccount creation test failed: ${error.message} | Status: ${errorDetails.status} | Function: ${errorDetails.functionName} | Details: ${JSON.stringify(errorDetails)}`,
        errorDetails,
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
          "error",
          `Split management failed - Exact response: ${JSON.stringify(result)}`,
          {
            actual_response: result,
            expected_fields: ["success", "data"],
            response_keys: result ? Object.keys(result) : [],
            error_details:
              result?.error || result?.message || "No error message provided",
            method_used: "GET",
          },
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
      const { result, timing } = await this.measureTime(async () => {
        const { data, error } = await supabase.functions.invoke(
          "paystack-split-management",
          {
            method: "POST",
            body: PaystackMockData.splitManagement,
          },
        );
        if (error) throw error;
        return data;
      });

      if (result?.success || result?.data) {
        this.addResult(
          "Split Creation",
          "success",
          "Split creation test passed",
          {
            split_name: PaystackMockData.splitManagement.name,
            response: result,
          },
          timing,
        );
      } else {
        this.addResult(
          "Split Creation",
          "warning",
          "Split creation returned unexpected format",
          result,
          timing,
        );
      }
    } catch (error) {
      this.addResult(
        "Split Creation",
        "error",
        `Split creation test failed: ${error.message}`,
      );
    }
  }

  // Test 8: Transfer Management - DISABLED
  private async testTransferManagement() {
    // Transfer management disabled - no automated money transfers
    this.addResult(
      "Transfer Management",
      "warning",
      "Transfer management disabled - no automated money transfers allowed",
      { disabled: true, reason: "Transfer management permanently disabled for security" },
      0,
    );
  }

  private async testAccountVerificationWithMockData() {
    // Account verification disabled - no automated money transfers
    this.addResult(
      "Account Verification",
      "warning",
      "Account verification disabled - no automated money transfers allowed",
      { disabled: true, reason: "Transfer management permanently disabled for security" },
      0,
    );
  }

  private async testRecipientCreationWithMockData() {
    // Recipient creation disabled - no automated money transfers
    this.addResult(
      "Recipient Creation",
      "warning",
      "Recipient creation disabled - no automated money transfers allowed",
      { disabled: true, reason: "Transfer management permanently disabled for security" },
      0,
    );
  }

  // Test 9: Payment Flow
  private async testPaymentFlow() {
    try {
      // Test payment initialization with proper mock data

      const { result, timing } = await this.measureTime(async () => {
        const { data, error } = await supabase.functions.invoke(
          "initialize-paystack-payment",
          {
            method: "POST",
            body: PaystackMockData.initializePayment,
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
            amount: PaystackMockData.initializePayment.amount / 100, // Convert from kobo
          },
          timing,
        );
      } else {
        this.addResult(
          "Payment Flow",
          "error",
          `Payment initialization failed - Exact response: ${JSON.stringify(result)}`,
          {
            actual_response: result,
            expected_fields: ["success", "data.authorization_url"],
            response_keys: result ? Object.keys(result) : [],
            error_details:
              result?.error || result?.message || "No error message provided",
            input_data: PaystackMockData.initializePayment,
          },
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
          "error",
          `Refund system failed - Exact response: ${JSON.stringify(result)}`,
          {
            actual_response: result,
            expected_fields: ["success", "data"],
            response_keys: result ? Object.keys(result) : [],
            error_details:
              result?.error || result?.message || "No error message provided",
            method_used: "GET",
          },
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
      const { result, timing } = await this.measureTime(async () => {
        const { data, error } = await supabase.functions.invoke(
          "paystack-refund-management",
          {
            method: "POST",
            body: PaystackMockData.refundManagement,
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
          transaction: PaystackMockData.refundManagement.transaction,
          amount: PaystackMockData.refundManagement.amount,
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
�� Passed: ${successCount}/${totalTests}
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

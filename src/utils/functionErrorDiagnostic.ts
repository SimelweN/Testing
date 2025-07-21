/**
 * Function Error Diagnostic Utility
 * Helps diagnose common edge function errors
 */

import { supabase } from "@/integrations/supabase/client";

export interface DiagnosticResult {
  test: string;
  status: "pass" | "fail" | "warning";
  message: string;
  details?: any;
}

export const diagnoseFunctionError = async (): Promise<DiagnosticResult[]> => {
  const results: DiagnosticResult[] = [];

  // Test 1: Check if essential database tables exist
  const essentialTables = ['profiles', 'orders', 'payment_transactions', 'banking_subaccounts'];
  
  for (const table of essentialTables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select("*", { count: "exact", head: true });
      
      if (error) {
        results.push({
          test: `Database Table: ${table}`,
          status: "fail",
          message: `Table '${table}' missing or inaccessible`,
          details: { error: error.message, table }
        });
      } else {
        results.push({
          test: `Database Table: ${table}`,
          status: "pass",
          message: `Table '${table}' exists (${count || 0} records)`,
          details: { count, table }
        });
      }
    } catch (error) {
      results.push({
        test: `Database Table: ${table}`,
        status: "fail", 
        message: `Failed to check table '${table}'`,
        details: { error: error instanceof Error ? error.message : "Unknown error", table }
      });
    }
  }

  // Test 2: Check function deployment and accessibility
  try {
    const { data, error } = await supabase.functions.invoke('initialize-paystack-payment', {
      body: {
        email: "test@example.com",
        amount: 100,
        metadata: { diagnostic: true }
      }
    });

    if (error) {
      // Specific handling for different error types
      if (error.name === "FunctionsFetchError") {
        results.push({
          test: "Function Deployment",
          status: "fail",
          message: "Function not deployed or not accessible",
          details: {
            error: error.message,
            name: error.name,
            context: error.context || {},
            possibleCauses: [
              "Function 'initialize-paystack-payment' is not deployed to Supabase",
              "Function name mismatch",
              "Network connectivity issues",
              "Supabase project configuration issues"
            ],
            troubleshooting: [
              "Check if function is deployed: Go to Supabase Dashboard > Edge Functions",
              "Deploy function: supabase functions deploy initialize-paystack-payment",
              "Verify function name matches exactly",
              "Check Supabase project URL and keys"
            ]
          }
        });
      } else {
        results.push({
          test: "Function Basic Test",
          status: "warning",
          message: "Function is deployed but has internal errors",
          details: {
            error: error.message,
            name: error.name,
            context: error.context || {},
            note: "This is actually good - function is reachable but has configuration issues"
          }
        });
      }
    } else {
      results.push({
        test: "Function Basic Test",
        status: "pass",
        message: "Function responded successfully",
        details: { data }
      });
    }
  } catch (error) {
    results.push({
      test: "Function Basic Test",
      status: "fail",
      message: "Unexpected error during function test",
      details: {
        error: error instanceof Error ? error.message : "Unknown error",
        type: "Unexpected Error"
      }
    });
  }

  // Test 3: Check environment configuration
  const envTests = [
    { key: 'VITE_SUPABASE_URL', value: import.meta.env.VITE_SUPABASE_URL },
    { key: 'VITE_SUPABASE_ANON_KEY', value: import.meta.env.VITE_SUPABASE_ANON_KEY },
    { key: 'VITE_PAYSTACK_PUBLIC_KEY', value: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY }
  ];

  for (const env of envTests) {
    if (!env.value || env.value === 'undefined' || env.value.trim() === '') {
      results.push({
        test: `Environment: ${env.key}`,
        status: "fail",
        message: `${env.key} is not set or empty`,
        details: { key: env.key, hasValue: !!env.value }
      });
    } else {
      results.push({
        test: `Environment: ${env.key}`,
        status: "pass", 
        message: `${env.key} is configured`,
        details: { 
          key: env.key, 
          valueLength: env.value.length,
          preview: env.value.substring(0, 10) + "..." 
        }
      });
    }
  }

  // Test 4: Check multiple Paystack functions to see deployment status
  const paystackFunctions = [
    'initialize-paystack-payment',
    'verify-paystack-payment',
    'create-paystack-subaccount',
    'paystack-transfer-management',
    'paystack-refund-management'
  ];

  let deployedCount = 0;
  let functionsChecked = 0;

  for (const functionName of paystackFunctions) {
    try {
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { health: true }
      });

      functionsChecked++;

      // If we get ANY response (even an error), the function is deployed
      if (error && error.name !== "FunctionsFetchError") {
        deployedCount++;
      } else if (data) {
        deployedCount++;
      }

      // Don't check more than 3 functions to avoid spam
      if (functionsChecked >= 3) break;

    } catch (e) {
      functionsChecked++;
    }
  }

  if (deployedCount === 0) {
    results.push({
      test: "Paystack Functions Deployment",
      status: "fail",
      message: "No Paystack functions appear to be deployed",
      details: {
        functionsChecked,
        deployedCount,
        message: "You need to deploy your edge functions to Supabase",
        instructions: [
          "1. Make sure you have the Supabase CLI installed",
          "2. Login to Supabase: supabase login",
          "3. Link your project: supabase link --project-ref YOUR_PROJECT_REF",
          "4. Deploy functions: supabase functions deploy",
          "5. Or deploy specific function: supabase functions deploy initialize-paystack-payment"
        ]
      }
    });
  } else {
    results.push({
      test: "Paystack Functions Deployment",
      status: "pass",
      message: `${deployedCount}/${functionsChecked} Paystack functions are deployed`,
      details: {
        functionsChecked,
        deployedCount,
        note: "At least some functions are deployed and responding"
      }
    });
  }

  return results;
};

export const generateDiagnosticReport = (results: DiagnosticResult[]): string => {
  const failed = results.filter(r => r.status === "fail");
  const warnings = results.filter(r => r.status === "warning"); 
  const passed = results.filter(r => r.status === "pass");

  let report = `🔍 Function Error Diagnostic Report\n\n`;
  report += `📊 Summary: ${passed.length} passed, ${failed.length} failed, ${warnings.length} warnings\n\n`;

  if (failed.length > 0) {
    report += `❌ FAILURES (${failed.length}):\n`;
    failed.forEach(result => {
      report += `  • ${result.test}: ${result.message}\n`;
      if (result.details) {
        report += `    Details: ${JSON.stringify(result.details, null, 2)}\n`;
      }
    });
    report += `\n`;
  }

  if (warnings.length > 0) {
    report += `⚠️  WARNINGS (${warnings.length}):\n`;
    warnings.forEach(result => {
      report += `  • ${result.test}: ${result.message}\n`;
    });
    report += `\n`;
  }

  if (passed.length > 0) {
    report += `✅ PASSING (${passed.length}):\n`;
    passed.forEach(result => {
      report += `  • ${result.test}: ${result.message}\n`;
    });
  }

  // Recommendations
  report += `\n🔧 RECOMMENDATIONS:\n`;
  if (failed.some(r => r.test.includes("Database Table"))) {
    report += `  • Run database setup: Go to Admin Dashboard → Paystack DB Setup → Run database-setup.sql\n`;
  }
  if (failed.some(r => r.test.includes("Environment"))) {
    report += `  • Check environment variables in .env file and Supabase function settings\n`;
  }
  if (failed.some(r => r.test.includes("Function Basic Test"))) {
    report += `  • Check Supabase function logs for detailed error information\n`;
    report += `  • Verify function is deployed: supabase functions list\n`;
  }

  return report;
};

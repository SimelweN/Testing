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

  // Test 2: Check function with minimal payload
  try {
    const { data, error } = await supabase.functions.invoke('initialize-paystack-payment', {
      body: { 
        email: "test@example.com",
        amount: 100,
        metadata: { diagnostic: true }
      }
    });

    if (error) {
      results.push({
        test: "Function Basic Test",
        status: "fail",
        message: "Function returned error",
        details: { 
          error: error.message,
          name: error.name,
          context: error.context || {}
        }
      });
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
      message: "Function call failed",
      details: { error: error instanceof Error ? error.message : "Unknown error" }
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

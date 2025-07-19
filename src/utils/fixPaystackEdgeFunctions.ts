/**
 * This utility helps fix Edge Function health check issues
 * by providing the correct calling pattern
 */

import { supabase } from "@/integrations/supabase/client";

export const testEdgeFunctionHealth = async (functionName: string) => {
  try {
    console.log(`🔧 Testing ${functionName}...`);

    // Try POST with health check body
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: { health: true },
    });

    if (error) {
      console.error(`❌ ${functionName} error:`, error);
      return { success: false, error: error.message };
    }

    console.log(`✅ ${functionName} response:`, data);
    return { success: true, data };
  } catch (error) {
    console.error(`❌ ${functionName} exception:`, error);
    return { success: false, error: error.message };
  }
};

export const testAllPaystackFunctions = async () => {
  const functions = [
    "initialize-paystack-payment",
    "verify-paystack-payment",
    "paystack-split-management",
    "paystack-transfer-management",
    "manage-paystack-subaccount",
    "paystack-refund-management",
  ];

  console.log("🔍 Testing all Paystack Edge Functions...");

  const results = [];

  for (const funcName of functions) {
    const result = await testEdgeFunctionHealth(funcName);
    results.push({ function: funcName, ...result });
  }

  console.log("📊 Test Results:", results);

  const working = results.filter((r) => r.success).length;
  const total = results.length;

  console.log(`✅ ${working}/${total} functions working`);

  return results;
};

export default testAllPaystackFunctions;

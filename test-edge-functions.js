#!/usr/bin/env node

const functions = [
  "paystack-split-management",
  "paystack-transfer-management",
  "manage-paystack-subaccount",
  "paystack-refund-management",
  "initialize-paystack-payment",
  "verify-paystack-payment",
];

async function testEdgeFunction(funcName) {
  const baseUrl =
    process.env.SUPABASE_URL || "https://zlhdnxkfcxjnnyeqcmsj.supabase.co";
  const url = `${baseUrl}/functions/v1/${funcName}`;

  console.log(`Testing ${funcName}...`);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsaGRueGtmY3hqbm55ZXFjbXNqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMTA3NjA1NywiZXhwIjoyMDQ2NjUyMDU3fQ.gJGGfumVp6rCCCdU0e-8VgqMhBfIV0MKXwKGUUz5-es"}`,
      },
      body: JSON.stringify({ health: true }),
    });

    const result = await response.json();

    if (response.ok && (result.success || result.service)) {
      console.log(`✅ ${funcName}: OK (${response.status})`);
      return true;
    } else {
      console.log(`❌ ${funcName}: FAILED (${response.status})`);
      console.log(`   Response:`, JSON.stringify(result, null, 2));
      return false;
    }
  } catch (error) {
    console.log(`❌ ${funcName}: ERROR - ${error.message}`);
    return false;
  }
}

async function testAllFunctions() {
  console.log("🧪 Testing Edge Function Health Checks\n");

  let passed = 0;
  let total = functions.length;

  for (const funcName of functions) {
    const success = await testEdgeFunction(funcName);
    if (success) passed++;
    console.log(); // Empty line for readability
  }

  console.log(`📊 Results: ${passed}/${total} functions passed health checks`);

  if (passed === total) {
    console.log("🎉 All health checks passed!");
  } else {
    console.log("⚠️  Some health checks failed. Check the logs above.");
  }
}

testAllFunctions().catch(console.error);

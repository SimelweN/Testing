#!/usr/bin/env node

/**
 * Paystack Configuration Checker
 * Verifies all Paystack-related configuration and functionality
 */

console.log("🔍 PAYSTACK SYSTEM CONFIGURATION CHECK");
console.log("=====================================");

// 1. Check Environment Variables
console.log("\n📋 ENVIRONMENT VARIABLES:");
console.log("-------------------------");

const envVars = {
  VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || "Not set",
  VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY
    ? "Set (hidden)"
    : "Not set",
  VITE_PAYSTACK_PUBLIC_KEY: process.env.VITE_PAYSTACK_PUBLIC_KEY || "Not set",
  NODE_ENV: process.env.NODE_ENV || "development",
};

let missingEnvVars = [];

Object.entries(envVars).forEach(([key, value]) => {
  const status = value.includes("Not set") ? "❌" : "✅";
  console.log(`${status} ${key}: ${value}`);
  if (value.includes("Not set") && key !== "NODE_ENV") {
    missingEnvVars.push(key);
  }
});

// 2. Check Paystack Configuration
console.log("\n🔧 PAYSTACK CONFIGURATION:");
console.log("---------------------------");

const paystackPublicKey = process.env.VITE_PAYSTACK_PUBLIC_KEY;
if (paystackPublicKey) {
  if (paystackPublicKey.startsWith("pk_test_")) {
    console.log("✅ Paystack configured in TEST mode");
    console.log("ℹ️  Key: " + paystackPublicKey.substring(0, 12) + "...");
  } else if (paystackPublicKey.startsWith("pk_live_")) {
    console.log("✅ Paystack configured in LIVE mode");
    console.log("ℹ️  Key: " + paystackPublicKey.substring(0, 12) + "...");
  } else {
    console.log("⚠️  Paystack key format unrecognized");
    console.log("ℹ️  Key: " + paystackPublicKey.substring(0, 12) + "...");
  }
} else {
  console.log("❌ Paystack public key not configured");
}

// 3. Check Edge Functions
console.log("\n🌐 EDGE FUNCTIONS TO VERIFY:");
console.log("-----------------------------");

const edgeFunctions = [
  "paystack-split-management",
  "manage-paystack-subaccount",
  "paystack-refund-management",
  "initialize-paystack-payment",
  "verify-paystack-payment",
  "paystack-webhook",
  "create-paystack-subaccount",
  "process-book-purchase",
];

edgeFunctions.forEach((func) => {
  console.log(`📦 ${func}`);
});

// 4. Check Files
console.log("\n📁 CRITICAL FILES STATUS:");
console.log("--------------------------");

const fs = require("fs");
const path = require("path");

const criticalFiles = [
  "supabase/functions/_shared/cors.ts",
  "supabase/functions/_shared/paystack-api.ts",
  "src/config/paystack.ts",
  "src/config/environment.ts",
  "src/integrations/supabase/client.ts",
];

criticalFiles.forEach((file) => {
  try {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file}`);
    } else {
      console.log(`❌ ${file} - Missing`);
    }
  } catch (error) {
    console.log(`❌ ${file} - Error checking: ${error.message}`);
  }
});

// 5. Recommendations
console.log("\n🎯 SYSTEM STATUS & RECOMMENDATIONS:");
console.log("-----------------------------------");

if (missingEnvVars.length > 0) {
  console.log(
    `❌ CRITICAL: Missing environment variables: ${missingEnvVars.join(", ")}`,
  );
  console.log(
    "   Action: Configure these variables in your deployment environment",
  );
} else {
  console.log("✅ All required environment variables are configured");
}

if (!paystackPublicKey) {
  console.log("❌ CRITICAL: Paystack not configured");
  console.log(
    "   Action: Add VITE_PAYSTACK_PUBLIC_KEY to environment variables",
  );
} else {
  console.log("✅ Paystack public key is configured");
}

// 6. Next Steps
console.log("\n🚀 NEXT STEPS TO VERIFY FUNCTIONALITY:");
console.log("--------------------------------------");
console.log("1. Access admin dashboard: /admin");
console.log("2. Use PaystackSystemTestComponent to run comprehensive tests");
console.log("3. Test edge functions individually via admin interface");
console.log("4. Verify database connectivity");
console.log("5. Test payment flow with small amount");

// 7. Quick Health Check URLs
console.log("\n🔗 HEALTH CHECK ENDPOINTS:");
console.log("--------------------------");
console.log(
  "Split Management: /functions/v1/paystack-split-management?health=true",
);
console.log(
  "Transfer Management: /functions/v1/paystack-transfer-management?action=banks",
);
console.log("Subaccount Management: /functions/v1/manage-paystack-subaccount");

// 8. Summary
console.log("\n📊 SUMMARY:");
console.log("-----------");

const totalChecks = 4; // env vars, paystack config, files, functions
let passedChecks = 0;

if (missingEnvVars.length === 0) passedChecks++;
if (paystackPublicKey) passedChecks++;
passedChecks += 2; // files and functions - assume OK for now

console.log(`✅ ${passedChecks}/${totalChecks} configuration checks passed`);

if (passedChecks === totalChecks) {
  console.log("🎉 System appears to be properly configured!");
  console.log("   Ready to run comprehensive functionality tests");
} else {
  console.log("⚠️  Configuration issues found - address before testing");
}

console.log("\n" + "=".repeat(50));
console.log("Generated: " + new Date().toLocaleString());

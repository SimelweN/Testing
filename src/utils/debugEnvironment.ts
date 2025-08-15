/**
 * Environment debugging utility to help diagnose configuration issues
 */

import { ENV } from "@/config/environment";

export const debugEnvironmentVariables = () => {
  console.log("🔍 Environment Debug Information");
  console.log("================================");
  
  console.log("Node Environment:", import.meta.env.NODE_ENV);
  console.log("Development Mode:", import.meta.env.DEV);
  console.log("Production Mode:", import.meta.env.PROD);
  
  console.log("\n📋 Environment Variables Status:");
  console.log("================================");
  
  // Check Supabase configuration
  const supabaseUrl = ENV.VITE_SUPABASE_URL;
  const supabaseKey = ENV.VITE_SUPABASE_ANON_KEY;
  
  console.log("VITE_SUPABASE_URL:", supabaseUrl ? "✅ Set" : "❌ Missing");
  if (supabaseUrl) {
    console.log("  URL value:", supabaseUrl.substring(0, 30) + "...");
    try {
      new URL(supabaseUrl);
      console.log("  URL format: ✅ Valid");
    } catch {
      console.log("  URL format: ❌ Invalid");
    }
  }
  
  console.log("VITE_SUPABASE_ANON_KEY:", supabaseKey ? "✅ Set" : "❌ Missing");
  if (supabaseKey) {
    console.log("  Key length:", supabaseKey.length);
    console.log("  Key preview:", supabaseKey.substring(0, 20) + "...");
  }
  
  // Check other important variables
  console.log("VITE_APP_URL:", ENV.VITE_APP_URL ? "✅ Set" : "❌ Missing");
  console.log("VITE_PAYSTACK_PUBLIC_KEY:", ENV.VITE_PAYSTACK_PUBLIC_KEY ? "✅ Set" : "❌ Missing");
  
  // Check raw import.meta.env values
  console.log("\n🔧 Raw Environment Values:");
  console.log("==========================");
  console.log("import.meta.env.VITE_SUPABASE_URL:", import.meta.env.VITE_SUPABASE_URL || "undefined");
  console.log("import.meta.env.VITE_SUPABASE_ANON_KEY:", import.meta.env.VITE_SUPABASE_ANON_KEY ? "Set" : "undefined");
  
  // Recommendations
  console.log("\n💡 Recommendations:");
  console.log("===================");
  
  if (!supabaseUrl || !supabaseKey) {
    console.log("❌ Supabase configuration is incomplete!");
    console.log("   This will cause 'Failed to fetch' errors");
    console.log("   ");
    console.log("   To fix this:");
    console.log("   1. Connect to Supabase MCP: [Open MCP popover](#open-mcp-popover)");
    console.log("   2. Or manually set environment variables:");
    console.log("      - VITE_SUPABASE_URL=https://your-project.supabase.co");
    console.log("      - VITE_SUPABASE_ANON_KEY=your-anon-key");
  } else {
    console.log("✅ Supabase configuration appears complete");
  }
  
  return {
    isComplete: !!(supabaseUrl && supabaseKey),
    supabaseUrl,
    hasSupabaseKey: !!supabaseKey,
    environment: import.meta.env.NODE_ENV
  };
};

export const testSupabaseConnection = async () => {
  console.log("🧪 Testing Supabase Connection");
  console.log("==============================");
  
  const config = debugEnvironmentVariables();
  
  if (!config.isComplete) {
    console.log("❌ Cannot test connection - configuration incomplete");
    return false;
  }
  
  try {
    // Test basic connectivity to Supabase
    const response = await fetch(`${config.supabaseUrl}/rest/v1/`, {
      method: 'HEAD',
      headers: {
        'apikey': ENV.VITE_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${ENV.VITE_SUPABASE_ANON_KEY}`
      }
    });
    
    console.log("Connection test response:", response.status);
    
    if (response.ok) {
      console.log("✅ Supabase connection successful");
      return true;
    } else {
      console.log("❌ Supabase connection failed:", response.statusText);
      return false;
    }
  } catch (error) {
    console.log("❌ Supabase connection error:", error);
    return false;
  }
};

// Run debug on module load if in development
if (import.meta.env.DEV) {
  debugEnvironmentVariables();
}

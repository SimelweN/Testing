import { supabase } from '@/integrations/supabase/client';

export async function diagnosticEdgeFunction() {
  console.log("🧪 EDGE FUNCTION DIAGNOSTIC STARTING");
  console.log("📍 Supabase URL:", import.meta.env.VITE_SUPABASE_URL);
  
  // Test 1: Basic connectivity with health-test
  console.log("\n🔍 TEST 1: Basic edge function connectivity");
  try {
    const { data: healthData, error: healthError } = await supabase.functions.invoke('health-test', {
      body: { test: true }
    });
    
    console.log("✅ Health test result:", { data: healthData, error: healthError });
    
    if (healthError) {
      console.log("❌ Basic connectivity failed. Edge functions may not be deployed.");
      return { connectivity: false, error: healthError };
    }
  } catch (e) {
    console.log("💥 Health test exception:", e);
    return { connectivity: false, error: e };
  }

  // Test 2: Get current user for valid request
  console.log("\n🔍 TEST 2: User authentication");
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    console.log("❌ User not authenticated:", userError);
    return { connectivity: true, userAuth: false, error: userError };
  }
  console.log("✅ User authenticated:", userData.user.email);

  // Test 3: Process book purchase with minimal valid payload
  console.log("\n🔍 TEST 3: Process-book-purchase with minimal payload");
  const minimalPayload = {
    book_id: "test-book-123",
    buyer_id: userData.user.id,
    seller_id: "test-seller-456",
    amount: 100,
    payment_reference: `diagnostic-${Date.now()}`,
    buyer_email: userData.user.email,
    shipping_address: {
      street: "123 Test Street",
      city: "Cape Town",
      province: "Western Cape",
      postal_code: "8000",
      country: "South Africa"
    }
  };

  console.log("📤 Sending payload:", JSON.stringify(minimalPayload, null, 2));

  try {
    const startTime = performance.now();
    const { data, error } = await supabase.functions.invoke('process-book-purchase', {
      body: minimalPayload
    });
    const duration = performance.now() - startTime;

    console.log(`⏱️ Function call took ${duration.toFixed(2)}ms`);
    console.log("📥 Raw response data:", data);
    console.log("📥 Raw response error:", error);

    if (error) {
      console.log("\n🔍 DETAILED ERROR ANALYSIS:");
      console.log("  - Type:", typeof error);
      console.log("  - Constructor:", error?.constructor?.name);
      console.log("  - instanceof Error:", error instanceof Error);
      console.log("  - Object.prototype.toString:", Object.prototype.toString.call(error));
      console.log("  - Keys:", Object.keys(error || {}));
      console.log("  - Enumerable props:", Object.getOwnPropertyNames(error || {}));

      // Try different ways to extract message
      console.log("\n📝 MESSAGE EXTRACTION ATTEMPTS:");
      console.log("  - error.message:", error?.message);
      console.log("  - error.details:", error?.details);
      console.log("  - error.hint:", error?.hint);
      console.log("  - error.code:", error?.code);
      console.log("  - error.context:", error?.context);
      console.log("  - String(error):", String(error));
      console.log("  - error.toString():", error.toString?.());
      
      try {
        console.log("  - JSON.stringify:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
      } catch (jsonError) {
        console.log("  - JSON.stringify failed:", jsonError.message);
      }

      return {
        connectivity: true,
        userAuth: true,
        functionCall: false,
        error: error,
        errorAnalysis: {
          type: typeof error,
          constructor: error?.constructor?.name,
          isError: error instanceof Error,
          toString: Object.prototype.toString.call(error),
          keys: Object.keys(error || {}),
          message: error?.message,
          details: error?.details,
          hint: error?.hint,
          code: error?.code
        }
      };
    } else {
      console.log("✅ Function call successful!");
      return {
        connectivity: true,
        userAuth: true,
        functionCall: true,
        data: data,
        duration: duration
      };
    }

  } catch (invokeError) {
    console.log("💥 Function invoke exception:", invokeError);
    console.log("   Type:", typeof invokeError);
    console.log("   Message:", invokeError?.message);
    console.log("   Stack:", invokeError?.stack);

    return {
      connectivity: true,
      userAuth: true,
      functionCall: false,
      invokeError: invokeError,
      errorAnalysis: {
        type: typeof invokeError,
        constructor: invokeError?.constructor?.name,
        message: invokeError?.message,
        stack: invokeError?.stack
      }
    };
  }
}

// Make available globally for console testing
if (typeof window !== 'undefined') {
  (window as any).diagnosticEdgeFunction = diagnosticEdgeFunction;
  console.log("🧪 Diagnostic loaded. Run: diagnosticEdgeFunction()");
}

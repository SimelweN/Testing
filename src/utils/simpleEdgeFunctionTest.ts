import { supabase } from '@/integrations/supabase/client';

export async function simpleEdgeFunctionTest() {
  console.log("🔍 SIMPLE EDGE FUNCTION TEST");
  console.log("============================");
  
  try {
    // Get current user
    const { data: authData, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authData.user) {
      console.log("❌ User not authenticated:", authError);
      return { error: "User not authenticated", success: false };
    }
    
    console.log("✅ User authenticated:", authData.user.email);
    
    // Simple test payload
    const testPayload = {
      book_id: "simple-test-123",
      buyer_id: authData.user.id,
      seller_id: "simple-seller-456",
      amount: 50,
      payment_reference: `simple-test-${Date.now()}`,
      buyer_email: authData.user.email,
      shipping_address: {
        street: "123 Simple Test St",
        city: "Test City",
        province: "Test Province",
        postal_code: "1234",
        country: "South Africa"
      }
    };
    
    console.log("📤 Sending simple test payload:", testPayload);
    
    // Call edge function
    const response = await supabase.functions.invoke('process-book-purchase', {
      body: testPayload
    });
    
    console.log("📥 Raw response object:", response);
    console.log("📥 Response.data:", response.data);
    console.log("📥 Response.error:", response.error);
    
    // Analyze error if present
    if (response.error) {
      console.log("🔍 ERROR ANALYSIS:");
      console.log("  typeof error:", typeof response.error);
      console.log("  error constructor:", response.error?.constructor?.name);
      console.log("  error instanceof Error:", response.error instanceof Error);
      console.log("  Object.keys(error):", Object.keys(response.error || {}));
      
      // Try different extraction methods
      console.log("🔍 EXTRACTION ATTEMPTS:");
      console.log("  String(error):", String(response.error));
      console.log("  error.toString():", response.error?.toString?.());
      console.log("  error.message:", response.error?.message);
      console.log("  error.details:", response.error?.details);
      console.log("  error.context:", response.error?.context);
      console.log("  error.hint:", response.error?.hint);
      
      try {
        console.log("  JSON.stringify(error):", JSON.stringify(response.error, null, 2));
      } catch (jsonError) {
        console.log("  JSON.stringify failed:", jsonError.message);
      }
      
      try {
        console.log("  JSON.stringify with getOwnPropertyNames:", 
          JSON.stringify(response.error, Object.getOwnPropertyNames(response.error), 2));
      } catch (jsonError) {
        console.log("  Advanced JSON.stringify failed:", jsonError.message);
      }
      
      // Determine what should be shown to user
      let userMessage = "Unknown error";
      if (typeof response.error === 'string') {
        userMessage = response.error;
      } else if (response.error?.context?.message) {
        userMessage = response.error.context.message;
      } else if (response.error?.message) {
        userMessage = response.error.message;
      } else if (response.error?.details) {
        userMessage = response.error.details;
      } else {
        userMessage = `Error type: ${typeof response.error}`;
      }
      
      console.log("🎯 USER-FRIENDLY MESSAGE:", userMessage);
      
      return {
        success: false,
        error: response.error,
        userMessage: userMessage,
        analysis: {
          type: typeof response.error,
          constructor: response.error?.constructor?.name,
          keys: Object.keys(response.error || {}),
          stringified: String(response.error)
        }
      };
      
    } else if (response.data) {
      console.log("✅ Success! Data:", response.data);
      return {
        success: true,
        data: response.data
      };
    } else {
      console.log("⚠️ No data and no error - unusual response");
      return {
        success: false,
        error: "No data or error in response",
        userMessage: "Edge function returned empty response"
      };
    }
    
  } catch (error) {
    console.error("💥 Test function exception:", error);
    return {
      success: false,
      error: error,
      userMessage: `Test failed: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

// Make available globally for console testing
if (typeof window !== 'undefined') {
  (window as any).simpleEdgeFunctionTest = simpleEdgeFunctionTest;
  console.log("🔍 Simple test loaded. Run: simpleEdgeFunctionTest()");
}

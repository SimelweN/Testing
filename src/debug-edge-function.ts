import { supabase } from '@/integrations/supabase/client';

export async function debugProcessBookPurchase() {
  console.log("🧪 DEBUGGING PROCESS-BOOK-PURCHASE EDGE FUNCTION");
  
  // Get current user for test
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    console.error("❌ User not authenticated");
    return { success: false, error: "User not authenticated" };
  }

  const testRequest = {
    book_id: "test-book-123",
    buyer_id: userData.user.id,
    seller_id: "test-seller-456", 
    amount: 100,
    payment_reference: `debug-test-${Date.now()}`,
    buyer_email: userData.user.email,
    shipping_address: {
      street: "123 Test Street",
      city: "Cape Town", 
      province: "Western Cape",
      postal_code: "8000",
      country: "South Africa"
    }
  };

  console.log("📤 Request payload:", JSON.stringify(testRequest, null, 2));

  try {
    const { data, error } = await supabase.functions.invoke('process-book-purchase', {
      body: testRequest
    });

    console.log("📥 Raw response data:", data);
    console.log("📥 Raw response error:", error);

    if (error) {
      console.log("🔍 Error analysis:");
      console.log("  - Type:", typeof error);
      console.log("  - Constructor:", error?.constructor?.name);
      console.log("  - Keys:", error ? Object.keys(error) : "none");
      console.log("  - Message:", error?.message);
      console.log("  - Details:", error?.details);
      console.log("  - Code:", error?.code);
      console.log("  - Hint:", error?.hint);
      console.log("  - JSON stringified:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      
      // Try different extraction methods
      console.log("🔍 Extraction attempts:");
      console.log("  - String(error):", String(error));
      console.log("  - error.toString():", error.toString?.());
      console.log("  - error + '':", error + '');
      
      return { success: false, error, analysis: "Edge function returned error" };
    } else {
      console.log("✅ Success! Data:", data);
      return { success: true, data };
    }
  } catch (invokeError) {
    console.error("💥 Invoke error:", invokeError);
    console.log("🔍 Invoke error analysis:");
    console.log("  - Type:", typeof invokeError);
    console.log("  - Constructor:", invokeError?.constructor?.name);
    console.log("  - Message:", invokeError?.message);
    console.log("  - JSON stringified:", JSON.stringify(invokeError, Object.getOwnPropertyNames(invokeError), 2));
    
    return { success: false, error: invokeError, analysis: "Function invoke failed" };
  }
}

// Helper to run in console
(window as any).debugEdgeFunction = debugProcessBookPurchase;
console.log("🧪 Debug function loaded. Run: debugEdgeFunction()");

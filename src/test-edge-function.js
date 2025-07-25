// Immediate test script to diagnose edge function
console.log("🧪 IMMEDIATE EDGE FUNCTION TEST");

async function testEdgeFunction() {
  console.log("🔍 Testing edge function...");
  
  // Get Supabase client
  const { createClient } = await import('@supabase/supabase-js');
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  console.log("📍 URL:", supabaseUrl);
  console.log("🔑 Key exists:", !!supabaseKey);
  
  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase configuration");
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Test 1: Simple health check
  console.log("\n🏥 Testing health-test function...");
  try {
    const { data, error } = await supabase.functions.invoke('health-test');
    console.log("Health result:", { data, error });
    
    if (error) {
      console.log("❌ Health test failed - edge functions may not be deployed");
      console.log("Error type:", typeof error);
      console.log("Error object:", error);
      return;
    }
  } catch (e) {
    console.log("💥 Health test exception:", e);
    return;
  }
  
  // Test 2: Process book purchase
  console.log("\n📚 Testing process-book-purchase function...");
  
  // Get user first
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) {
    console.log("❌ User not logged in");
    return;
  }
  
  const testPayload = {
    book_id: "test-123",
    buyer_id: authData.user.id,
    seller_id: "seller-123", 
    amount: 100,
    payment_reference: "test-ref-123",
    buyer_email: authData.user.email,
    shipping_address: {
      street: "123 Test St",
      city: "Test City",
      province: "Test Province", 
      postal_code: "1234",
      country: "South Africa"
    }
  };
  
  try {
    console.log("📤 Sending payload:", testPayload);
    const { data, error } = await supabase.functions.invoke('process-book-purchase', {
      body: testPayload
    });
    
    console.log("📥 Response data:", data);
    console.log("📥 Response error:", error);
    
    if (error) {
      console.log("\n🔍 ERROR ANALYSIS:");
      console.log("Type:", typeof error);
      console.log("Constructor:", error?.constructor?.name);
      console.log("Keys:", Object.keys(error || {}));
      console.log("Message:", error?.message);
      console.log("Details:", error?.details);
      console.log("Code:", error?.code);
      console.log("Context:", error?.context);
      
      // Try to extract readable message
      let readableError = "Unknown error";
      if (typeof error === 'string') {
        readableError = error;
      } else if (error?.message) {
        readableError = error.message;
      } else if (error?.details) {
        readableError = error.details;
      } else if (error?.context?.message) {
        readableError = error.context.message;
      }
      
      console.log("🎯 READABLE ERROR:", readableError);
      
      // This is likely what should be shown instead of [object Object]
      window.lastEdgeFunctionError = readableError;
      
    } else {
      console.log("✅ Success!");
    }
    
  } catch (e) {
    console.log("💥 Exception:", e);
    console.log("Exception type:", typeof e);
    console.log("Exception message:", e?.message);
  }
}

// Run test automatically
testEdgeFunction().catch(console.error);

// Also make available globally
window.testEdgeFunction = testEdgeFunction;

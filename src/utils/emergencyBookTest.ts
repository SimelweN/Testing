import { supabase } from "@/integrations/supabase/client";

export const emergencyBookTest = async () => {
  console.log("🆘 EMERGENCY BOOK TEST STARTING...");

  try {
    // Test 1: Check if we can connect to Supabase at all
    console.log("🔌 Testing Supabase connection...");
    const { data: testData, error: testError } = await supabase
      .from("books")
      .select("count")
      .limit(0);
    
    if (testError) {
      console.error("❌ SUPABASE CONNECTION FAILED:", testError);
      return { error: "Cannot connect to Supabase", details: testError };
    }
    console.log("✅ Supabase connection OK");

    // Test 2: Get total count of ALL books (regardless of status)
    console.log("📊 Counting ALL books in database...");
    const { count: totalBooks, error: countError } = await supabase
      .from("books")
      .select("*", { count: "exact", head: true });

    console.log("📊 TOTAL BOOKS IN DATABASE:", totalBooks);
    
    if (countError) {
      console.error("❌ COUNT ERROR:", countError);
    }

    // Test 3: Get first 5 books with basic info
    console.log("📚 Fetching first 5 books...");
    const { data: sampleBooks, error: sampleError } = await supabase
      .from("books")
      .select("id, title, sold, seller_id, created_at")
      .limit(5);

    if (sampleError) {
      console.error("❌ SAMPLE BOOKS ERROR:", sampleError);
    } else {
      console.log("📚 SAMPLE BOOKS:", sampleBooks);
    }

    // Test 4: Count sold vs available books
    const { count: soldCount } = await supabase
      .from("books")
      .select("*", { count: "exact", head: true })
      .eq("sold", true);

    const { count: availableCount } = await supabase
      .from("books")
      .select("*", { count: "exact", head: true })
      .eq("sold", false);

    console.log("📈 BOOK STATUS BREAKDOWN:");
    console.log("  - Total books:", totalBooks);
    console.log("  - Sold books:", soldCount);
    console.log("  - Available books:", availableCount);

    // Test 5: Check seller profiles
    console.log("👥 Checking seller profiles...");
    const { data: profileCheck, error: profileError } = await supabase
      .from("profiles")
      .select("id, pickup_address")
      .limit(3);

    if (profileError) {
      console.error("❌ PROFILE CHECK ERROR:", profileError);
    } else {
      console.log("👥 SAMPLE PROFILES:", profileCheck?.map(p => ({
        id: p.id,
        hasPickupAddress: !!p.pickup_address
      })));
    }

    // Test 6: Try the EXACT query that's failing
    console.log("🎯 Testing EXACT book query that's used in the app...");
    const { data: exactQueryBooks, error: exactError } = await supabase
      .from("books")
      .select(`
        *,
        seller_profile:profiles!seller_id(
          id,
          pickup_address
        )
      `)
      .eq("sold", false)
      .order("created_at", { ascending: false })
      .limit(3);

    if (exactError) {
      console.error("❌ EXACT QUERY ERROR:", exactError);
    } else {
      console.log("🎯 EXACT QUERY RESULT:", exactQueryBooks?.length || 0, "books");
      if (exactQueryBooks && exactQueryBooks.length > 0) {
        console.log("🎯 SAMPLE EXACT BOOKS:", exactQueryBooks.map(b => ({
          id: b.id,
          title: b.title,
          seller_id: b.seller_id,
          hasSellerProfile: !!b.seller_profile,
          hasPickupAddress: !!b.seller_profile?.pickup_address
        })));
      }
    }

    return {
      success: true,
      totalBooks,
      availableBooks: availableCount,
      soldBooks: soldCount,
      exactQueryResult: exactQueryBooks?.length || 0
    };

  } catch (error) {
    console.error("💥 EMERGENCY TEST FAILED:", error);
    return {
      error: "Emergency test failed",
      details: error
    };
  }
};

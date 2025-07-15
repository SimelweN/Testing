import { supabase } from "@/integrations/supabase/client";

/**
 * Immediate cleanup execution - call this to clean up the database right now
 */
export const runCleanupNow = async () => {
  console.log("🧹 Starting immediate database cleanup...");

  try {
    // 1. Reset all books to available
    const { error: booksError } = await supabase
      .from("books")
      .update({
        sold: false,
        availability: "available",
        sold_at: null,
      })
      .neq("id", "");

    if (booksError) {
      console.error("Error resetting books:", booksError);
    } else {
      console.log("✅ All books reset to available");
    }

    // 2. Remove obviously fake/test data
    const mockEmailPatterns = [
      "test@",
      "mock@",
      "fake@",
      "demo@",
      "example@",
      "@test.com",
      "@mock.com",
      "@fake.com",
      "@example.com",
    ];

    // Get profiles with mock emails
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email");

    if (profiles) {
      const mockProfileIds = profiles
        .filter(
          (p) =>
            p.email &&
            mockEmailPatterns.some((pattern) =>
              p.email.toLowerCase().includes(pattern.toLowerCase()),
            ),
        )
        .map((p) => p.id);

      if (mockProfileIds.length > 0) {
        // Remove books from mock sellers
        await supabase.from("books").delete().in("seller_id", mockProfileIds);

        // Remove orders from mock users
        await supabase.from("orders").delete().in("seller_id", mockProfileIds);

        // Remove mock profiles
        await supabase.from("profiles").delete().in("id", mockProfileIds);

        console.log(
          `✅ Removed ${mockProfileIds.length} mock profiles and their data`,
        );
      }
    }

    // 3. Clean up test transactions
    await supabase
      .from("transactions")
      .delete()
      .or(
        "status.eq.test,status.eq.mock,buyer_email.ilike.%test%,buyer_email.ilike.%mock%",
      );

    console.log("✅ Cleaned up test transactions");

    // 4. Clean up any test orders
    await supabase
      .from("orders")
      .delete()
      .or(
        "buyer_email.ilike.%test%,buyer_email.ilike.%mock%,buyer_email.ilike.%fake%",
      );

    console.log("✅ Cleaned up test orders");

    console.log("🎉 Database cleanup completed successfully!");
    return { success: true, message: "Database cleanup completed" };
  } catch (error) {
    console.error("❌ Cleanup failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

// Auto-run cleanup when this module is imported (for immediate effect)
runCleanupNow().then((result) => {
  if (result.success) {
    console.log("🎉 Auto-cleanup completed:", result.message);
  } else {
    console.error("❌ Auto-cleanup failed:", result.error);
  }
});

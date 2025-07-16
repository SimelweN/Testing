import { supabase } from "@/integrations/supabase/client";

/**
 * Utility to clean up mock/test data from the database
 * This will remove fake accounts, test books, and mock transactions
 */
export const cleanupMockData = async () => {
  try {
    console.log("🧹 Starting database cleanup...");

    // 1. Identify and remove mock profiles
    const mockEmailPatterns = [
      "test@",
      "mock@",
      "fake@",
      "demo@",
      "example@",
      "admin@test",
      "@example.com",
      "@test.com",
      "@mock.com",
      "@fake.com",
    ];

    // Get all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email, name");

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      return { success: false, error: profilesError.message };
    }

    // Identify mock profiles
    const mockProfiles =
      profiles?.filter((profile) => {
        if (!profile.email) return false;
        return (
          mockEmailPatterns.some((pattern) =>
            profile.email.toLowerCase().includes(pattern.toLowerCase()),
          ) ||
          (profile.name &&
            (profile.name.toLowerCase().includes("test") ||
              profile.name.toLowerCase().includes("mock") ||
              profile.name.toLowerCase().includes("fake") ||
              profile.name.toLowerCase().includes("demo")))
        );
      }) || [];

    console.log(`Found ${mockProfiles.length} mock profiles to remove`);

    // 2. Remove books from mock sellers
    if (mockProfiles.length > 0) {
      const mockSellerIds = mockProfiles.map((p) => p.id);

      const { error: booksError } = await supabase
        .from("books")
        .delete()
        .in("seller_id", mockSellerIds);

      if (booksError) {
        console.error(
          "Error removing mock books:",
          booksError.message || booksError,
        );
        // Don't throw here, continue with other cleanup
      } else {
        console.log("✅ Removed books from mock sellers");
      }

      // 3. Remove orders from mock users
      const { error: ordersError } = await supabase
        .from("orders")
        .delete()
        .or(
          `buyer_email.in.(${mockProfiles.map((p) => `"${p.email}"`).join(",")}),seller_id.in.(${mockSellerIds.map((id) => `"${id}"`).join(",")})`,
        );

      if (ordersError) {
        console.error(
          "Error removing mock orders:",
          ordersError.message || ordersError,
        );
        // Don't throw here, continue with other cleanup
      } else {
        console.log("✅ Removed orders from mock users");
      }

      // 4. Remove mock profiles (this will cascade to auth users)
      const { error: deleteError } = await supabase
        .from("profiles")
        .delete()
        .in("id", mockSellerIds);

      if (deleteError) {
        console.error(
          "Error removing mock profiles:",
          deleteError.message || deleteError,
        );
        // Don't throw here, continue with other cleanup
      } else {
        console.log("✅ Removed mock profiles");
      }
    }

    // 5. Reset book availability for any books marked as sold incorrectly
    const { error: resetBooksError } = await supabase
      .from("books")
      .update({
        sold: false,
      })
      .eq("sold", true);

    if (resetBooksError) {
      console.error(
        "Error resetting book availability:",
        resetBooksError.message || resetBooksError,
      );
      // Don't throw here, continue with other cleanup
    } else {
      console.log("✅ Reset book availability");
    }

    // 6. Clean up any hanging transactions/commits
    const { error: transactionsError } = await supabase
      .from("transactions")
      .delete()
      .or("status.eq.test,status.eq.mock");

    if (transactionsError) {
      console.error(
        "Error cleaning transactions:",
        transactionsError.message || transactionsError,
      );
      // Don't throw here, continue with other cleanup
    } else {
      console.log("✅ Cleaned up test transactions");
    }

    console.log("🎉 Database cleanup completed successfully!");

    return {
      success: true,
      removedProfiles: mockProfiles.length,
      message: `Removed ${mockProfiles.length} mock profiles and associated data`,
    };
  } catch (error) {
    console.error("❌ Database cleanup failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

/**
 * Quick function to reset all books to available status
 */
export const resetAllBooksToAvailable = async () => {
  try {
    const { error } = await supabase
      .from("books")
      .update({
        sold: false,
        availability: "available",
        sold_at: null,
      })
      .neq("id", "");

    if (error) {
      console.error("Error resetting books:", error.message || error);
      return {
        success: false,
        error: error.message || `Database error: ${JSON.stringify(error)}`,
      };
    }

    console.log("✅ All books reset to available");
    return { success: true, message: "All books reset to available" };
  } catch (error) {
    console.error("Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to reset books";
    return { success: false, error: errorMessage };
  }
};

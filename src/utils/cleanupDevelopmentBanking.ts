import { supabase } from "@/lib/supabase";

export interface CleanupResult {
  success: boolean;
  removedSubaccounts: number;
  removedBookSubaccounts: number;
  errors: string[];
}

/**
 * Remove all development/mock banking details from the system
 * This includes:
 * - Mock subaccount codes (ACCT_mock_*, ACCT_dev_*)
 * - Fallback subaccount codes (ACCT_dev_fallback_*, ACCT_dev_basic_*)
 * - Banking subaccounts marked as mock
 * - Book subaccount codes that are development/mock
 */
export async function cleanupDevelopmentBanking(): Promise<CleanupResult> {
  const result: CleanupResult = {
    success: false,
    removedSubaccounts: 0,
    removedBookSubaccounts: 0,
    errors: [],
  };

  try {
    console.log("🧹 Starting cleanup of development banking details...");

    // Patterns to identify development/mock subaccounts
    const developmentPatterns = [
      "ACCT_mock_%",
      "ACCT_dev_%",
      "ACCT_%fallback%",
      "ACCT_%basic%",
    ];

    // 1. Remove mock banking subaccounts
    for (const pattern of developmentPatterns) {
      try {
        const { data: mockSubaccounts, error: fetchError } = await supabase
          .from("banking_subaccounts")
          .select("id, user_id, subaccount_code, business_name")
          .like("subaccount_code", pattern);

        if (fetchError) {
          result.errors.push(
            `Error fetching mock subaccounts for pattern ${pattern}: ${fetchError.message}`,
          );
          continue;
        }

        if (mockSubaccounts && mockSubaccounts.length > 0) {
          console.log(
            `Found ${mockSubaccounts.length} mock subaccounts matching pattern: ${pattern}`,
          );

          // Log what we're about to remove
          mockSubaccounts.forEach((acc) => {
            console.log(
              `  - Removing mock subaccount: ${acc.subaccount_code} (${acc.business_name})`,
            );
          });

          const { error: deleteError } = await supabase
            .from("banking_subaccounts")
            .delete()
            .like("subaccount_code", pattern);

          if (deleteError) {
            result.errors.push(
              `Error deleting mock subaccounts for pattern ${pattern}: ${deleteError.message}`,
            );
          } else {
            result.removedSubaccounts += mockSubaccounts.length;
          }
        }
      } catch (error) {
        result.errors.push(
          `Unexpected error with pattern ${pattern}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    // 2. Remove subaccount codes from profiles table
    for (const pattern of developmentPatterns) {
      try {
        const { data: profilesData, error: profileUpdateError } = await supabase
          .from("profiles")
          .update({ subaccount_code: null })
          .like("subaccount_code", pattern)
          .select("id, subaccount_code");

        if (profileUpdateError) {
          result.errors.push(
            `Error updating profiles for pattern ${pattern}: ${profileUpdateError.message}`,
          );
        } else if (profilesData && profilesData.length > 0) {
          console.log(
            `Removed ${profilesData.length} mock subaccount codes from profiles`,
          );
        }
      } catch (error) {
        result.errors.push(
          `Unexpected error updating profiles for pattern ${pattern}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    // 3. Remove subaccount codes from books table
    for (const pattern of developmentPatterns) {
      try {
        const { data: booksData, error: bookUpdateError } = await supabase
          .from("books")
          .update({ seller_subaccount_code: null })
          .like("seller_subaccount_code", pattern)
          .select("id, title, seller_subaccount_code");

        if (bookUpdateError) {
          result.errors.push(
            `Error updating books for pattern ${pattern}: ${bookUpdateError.message}`,
          );
        } else if (booksData && booksData.length > 0) {
          console.log(
            `Removed ${booksData.length} mock subaccount codes from books`,
          );
          result.removedBookSubaccounts += booksData.length;
        }
      } catch (error) {
        result.errors.push(
          `Unexpected error updating books for pattern ${pattern}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    // 4. Also check for any banking subaccounts with mock: true in paystack_response
    try {
      const { data: mockResponseSubaccounts, error: mockResponseError } =
        await supabase
          .from("banking_subaccounts")
          .select("id, user_id, subaccount_code")
          .contains("paystack_response", { mock: true });

      if (mockResponseError) {
        result.errors.push(
          `Error fetching mock response subaccounts: ${mockResponseError.message}`,
        );
      } else if (
        mockResponseSubaccounts &&
        mockResponseSubaccounts.length > 0
      ) {
        console.log(
          `Found ${mockResponseSubaccounts.length} subaccounts marked as mock in paystack_response`,
        );

        const { error: deleteMockError } = await supabase
          .from("banking_subaccounts")
          .delete()
          .contains("paystack_response", { mock: true });

        if (deleteMockError) {
          result.errors.push(
            `Error deleting mock response subaccounts: ${deleteMockError.message}`,
          );
        } else {
          result.removedSubaccounts += mockResponseSubaccounts.length;
        }
      }
    } catch (error) {
      result.errors.push(
        `Unexpected error with mock response cleanup: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    result.success = result.errors.length === 0;

    console.log("🧹 Cleanup completed!");
    console.log(`  - Removed ${result.removedSubaccounts} mock subaccounts`);
    console.log(
      `  - Removed ${result.removedBookSubaccounts} mock book subaccount codes`,
    );

    if (result.errors.length > 0) {
      console.log(`  - ${result.errors.length} errors occurred:`);
      result.errors.forEach((error) => console.log(`    ❌ ${error}`));
    }

    return result;
  } catch (error) {
    result.errors.push(
      `Fatal error during cleanup: ${error instanceof Error ? error.message : String(error)}`,
    );
    result.success = false;
    return result;
  }
}

/**
 * Admin-only function to run cleanup
 * Should only be called by authorized administrators
 */
export async function runBankingCleanup(): Promise<CleanupResult> {
  try {
    // Verify user is authenticated and admin
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return {
        success: false,
        removedSubaccounts: 0,
        removedBookSubaccounts: 0,
        errors: ["Authentication required"],
      };
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("isAdmin")
      .eq("id", session.user.id)
      .single();

    if (profileError || !profile?.isAdmin) {
      return {
        success: false,
        removedSubaccounts: 0,
        removedBookSubaccounts: 0,
        errors: ["Admin access required"],
      };
    }

    // Run the cleanup
    return await cleanupDevelopmentBanking();
  } catch (error) {
    return {
      success: false,
      removedSubaccounts: 0,
      removedBookSubaccounts: 0,
      errors: [
        `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
      ],
    };
  }
}

import { supabase } from "@/integrations/supabase/client";
import { logError } from "@/utils/errorUtils";

export interface BulkDeleteResult {
  success: boolean;
  deletedCount: number;
  message: string;
  errors?: string[];
}

/**
 * Admin utility service for bulk operations and data management
 */
export class AdminUtilityService {
  /**
   * Delete all books from the platform (use with caution)
   */
  static async deleteAllBooks(): Promise<BulkDeleteResult> {
    try {
      console.log("Starting bulk deletion of all books...");

      // First, get count of books to be deleted
      const { count: totalBooks, error: countError } = await supabase
        .from("books")
        .select("*", { count: "exact", head: true });

      if (countError) {
        logError("AdminUtilityService.deleteAllBooks - count", countError);
        return {
          success: false,
          deletedCount: 0,
          message: "Failed to count books before deletion",
        };
      }

      if (!totalBooks || totalBooks === 0) {
        return {
          success: true,
          deletedCount: 0,
          message: "No books found to delete",
        };
      }

      // Delete all books in batches to avoid timeout
      const batchSize = 100;
      let deletedCount = 0;
      const errors: string[] = [];

      console.log(`Found ${totalBooks} books to delete`);

      while (deletedCount < totalBooks) {
        try {
          // Get a batch of book IDs
          const { data: bookBatch, error: fetchError } = await supabase
            .from("books")
            .select("id")
            .limit(batchSize);

          if (fetchError) {
            logError(
              "AdminUtilityService.deleteAllBooks - fetch batch",
              fetchError,
            );
            errors.push(`Failed to fetch batch: ${fetchError.message}`);
            break;
          }

          if (!bookBatch || bookBatch.length === 0) {
            break; // No more books to delete
          }

          // Delete this batch
          const bookIds = bookBatch.map((book) => book.id);
          const { error: deleteError } = await supabase
            .from("books")
            .delete()
            .in("id", bookIds);

          if (deleteError) {
            logError(
              "AdminUtilityService.deleteAllBooks - delete batch",
              deleteError,
            );
            errors.push(`Failed to delete batch: ${deleteError.message}`);
            break;
          }

          deletedCount += bookBatch.length;
          console.log(`Deleted ${deletedCount}/${totalBooks} books`);

          // Small delay to prevent overwhelming the database
          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (batchError) {
          logError(
            "AdminUtilityService.deleteAllBooks - batch error",
            batchError,
          );
          errors.push(
            `Batch error: ${batchError instanceof Error ? batchError.message : String(batchError)}`,
          );
          break;
        }
      }

      const success = errors.length === 0;
      const message = success
        ? `Successfully deleted all ${deletedCount} books`
        : `Deleted ${deletedCount} books with ${errors.length} errors`;

      console.log(`Bulk deletion completed: ${message}`);

      return {
        success,
        deletedCount,
        message,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      logError("AdminUtilityService.deleteAllBooks", error);
      return {
        success: false,
        deletedCount: 0,
        message: `Failed to delete books: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Delete all demo/test books (books with specific markers)
   */
  static async deleteDemoBooks(): Promise<BulkDeleteResult> {
    try {
      console.log("Starting deletion of demo/test books...");

      // Define patterns that identify demo/test books (case insensitive)
      const demoPatterns = [
        "test",
        "demo",
        "sample",
        "example",
        "placeholder",
        "dummy",
        "lorem ipsum",
        "fake",
        "mock",
        "temp",
        "temporary",
        "trial",
        "practice",
        "training",
        "tutorial",
        "debugging",
        "debug",
      ];

      console.log("Searching for demo books with patterns:", demoPatterns);

      // First check if we can access the books table
      try {
        const { count, error: testError } = await supabase
          .from("books")
          .select("*", { count: "exact", head: true });

        if (testError) {
          console.error("Cannot access books table:", testError);
          throw testError;
        }

        console.log(`Books table accessible, found ${count || 0} total books`);
      } catch (accessError) {
        console.error("Books table access test failed:", accessError);
        throw accessError;
      }

      // Get all books first, then filter on the frontend for more aggressive matching
      const { data: allBooks, error: fetchError } = await supabase
        .from("books")
        .select("id, title, author, isbn");

      if (fetchError) {
        console.error(
          "AdminUtilityService.deleteDemoBooks - fetch all books error:",
          {
            message: fetchError.message,
            code: fetchError.code,
            details: fetchError.details,
            hint: fetchError.hint,
          },
        );
        logError(
          "AdminUtilityService.deleteDemoBooks - fetch all books",
          fetchError,
        );
        return {
          success: false,
          deletedCount: 0,
          message: `Failed to fetch books for demo detection: ${fetchError.message || fetchError.code || "Unknown error"}`,
        };
      }

      if (!allBooks || allBooks.length === 0) {
        return {
          success: true,
          deletedCount: 0,
          message: "No books found to check",
        };
      }

      // Filter books that match demo patterns (more aggressive matching)
      const demoBooks = allBooks.filter((book) => {
        const title = book.title?.toLowerCase() || "";
        const author = book.author?.toLowerCase() || "";
        const isbn = book.isbn?.toLowerCase() || "";

        return demoPatterns.some(
          (pattern) =>
            title.includes(pattern) ||
            author.includes(pattern) ||
            isbn.includes(pattern) ||
            title.match(/^(book|title|name)\s*\d*$/i) || // Generic titles like "Book 1", "Title", "Name"
            title.match(/^[a-z]{1,5}$/i) || // Very short random titles
            title.includes("untitled") ||
            title.includes("no title") ||
            title.includes("new book"),
        );
      });

      if (!demoBooks || demoBooks.length === 0) {
        return {
          success: true,
          deletedCount: 0,
          message: "No demo books found to delete",
        };
      }

      console.log(
        `Found ${demoBooks.length} demo books:`,
        demoBooks.map((b) => b.title),
      );

      // Delete demo books
      const bookIds = demoBooks.map((book) => book.id);
      const { error: deleteError } = await supabase
        .from("books")
        .delete()
        .in("id", bookIds);

      if (deleteError) {
        console.error("AdminUtilityService.deleteDemoBooks - delete error:", {
          message: deleteError.message,
          code: deleteError.code,
          details: deleteError.details,
          hint: deleteError.hint,
        });
        logError("AdminUtilityService.deleteDemoBooks - delete", deleteError);
        return {
          success: false,
          deletedCount: 0,
          message: `Failed to delete demo books: ${deleteError.message || deleteError.code || "Unknown error"}`,
        };
      }

      console.log(`Successfully deleted ${demoBooks.length} demo books`);

      return {
        success: true,
        deletedCount: demoBooks.length,
        message: `Successfully deleted ${demoBooks.length} demo books`,
      };
    } catch (error) {
      console.error(
        "AdminUtilityService.deleteDemoBooks - catch block error:",
        {
          error,
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
      );
      logError("AdminUtilityService.deleteDemoBooks", error);
      return {
        success: false,
        deletedCount: 0,
        message: `Failed to delete demo books: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Get database statistics for admin dashboard
   */
  static async getDatabaseStats(): Promise<{
    totalBooks: number;
    totalUsers: number;
    totalStudyResources: number;
    totalStudyTips: number;
    activeListings: number;
    soldBooks: number;
  }> {
    try {
      const [
        { count: totalBooks },
        { count: totalUsers },
        { count: totalStudyResources },
        { count: totalStudyTips },
        { count: activeListings },
        { count: soldBooks },
      ] = await Promise.all([
        supabase.from("books").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase
          .from("study_resources")
          .select("*", { count: "exact", head: true }),
        supabase.from("study_tips").select("*", { count: "exact", head: true }),
        supabase
          .from("books")
          .select("*", { count: "exact", head: true })
          .eq("sold", false),
        supabase
          .from("books")
          .select("*", { count: "exact", head: true })
          .eq("sold", true),
      ]);

      return {
        totalBooks: totalBooks || 0,
        totalUsers: totalUsers || 0,
        totalStudyResources: totalStudyResources || 0,
        totalStudyTips: totalStudyTips || 0,
        activeListings: activeListings || 0,
        soldBooks: soldBooks || 0,
      };
    } catch (error) {
      logError("AdminUtilityService.getDatabaseStats", error);
      return {
        totalBooks: 0,
        totalUsers: 0,
        totalStudyResources: 0,
        totalStudyTips: 0,
        activeListings: 0,
        soldBooks: 0,
      };
    }
  }

  /**
   * Clear all user sessions (force logout)
   */
  static async clearAllUserSessions(): Promise<BulkDeleteResult> {
    try {
      console.log("Clearing all user sessions...");

      // This would typically involve invalidating all JWT tokens
      // For Supabase, we can't directly clear all sessions, but we can
      // update a flag in the database that forces re-authentication

      const { error } = await supabase
        .from("profiles")
        .update({ force_logout: true });

      if (error) {
        logError("AdminUtilityService.clearAllUserSessions", error);
        return {
          success: false,
          deletedCount: 0,
          message: "Failed to clear user sessions",
        };
      }

      return {
        success: true,
        deletedCount: 0,
        message: "All user sessions cleared - users will need to re-login",
      };
    } catch (error) {
      logError("AdminUtilityService.clearAllUserSessions", error);
      return {
        success: false,
        deletedCount: 0,
        message: `Failed to clear sessions: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }
}

export default AdminUtilityService;

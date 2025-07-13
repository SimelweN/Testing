import { supabase } from "@/integrations/supabase/client";
import { logError } from "@/utils/errorUtils";

export interface TargetedDeletionResult {
  success: boolean;
  deletedCount: number;
  message: string;
  deletedTitles?: string[];
  errors?: string[];
}

/**
 * Service for deleting specific books by title
 */
export class TargetedBookDeletionService {
  /**
   * Delete all books with the specific titles mentioned by the user
   */
  static async deleteSpecificBooks(): Promise<TargetedDeletionResult> {
    try {
      console.log("Starting targeted deletion of specific book titles...");

      // Exact titles to delete (from user's list)
      const titlesToDelete = [
        "Data Structures and Algorithms Mastery",
        "Advanced Physics Mechanics",
        "Constitutional Law of South Africa",
        "Business Management Fundamentals",
        "Psychology: The Science of Mind",
        "Human Anatomy and Physiology",
        "Calculus and Analytical Geometry",
        "Financial Accounting Principles",
        "Organic Chemistry 3rd Edition",
        "Introduction to Computer Science",
        "Environmental Science Today",
      ];

      console.log("Targeting these titles for deletion:", titlesToDelete);

      // Get all books that match these exact titles
      const { data: allBooks, error: fetchError } = await supabase
        .from("books")
        .select("id, title, author")
        .in("title", titlesToDelete);

      if (fetchError) {
        logError(
          "TargetedBookDeletionService.deleteSpecificBooks - fetch",
          fetchError,
        );
        return {
          success: false,
          deletedCount: 0,
          message: "Failed to fetch books for deletion",
        };
      }

      if (!allBooks || allBooks.length === 0) {
        return {
          success: true,
          deletedCount: 0,
          message: "No matching books found to delete",
        };
      }

      console.log(
        `Found ${allBooks.length} books to delete:`,
        allBooks.map((b) => b.title),
      );

      // Delete all matching books
      const bookIds = allBooks.map((book) => book.id);
      const { error: deleteError } = await supabase
        .from("books")
        .delete()
        .in("id", bookIds);

      if (deleteError) {
        logError(
          "TargetedBookDeletionService.deleteSpecificBooks - delete",
          deleteError,
        );
        return {
          success: false,
          deletedCount: 0,
          message: "Failed to delete books",
        };
      }

      const deletedTitles = allBooks.map((book) => book.title);
      console.log(
        `Successfully deleted ${allBooks.length} books:`,
        deletedTitles,
      );

      return {
        success: true,
        deletedCount: allBooks.length,
        message: `Successfully deleted ${allBooks.length} books`,
        deletedTitles,
      };
    } catch (error) {
      logError("TargetedBookDeletionService.deleteSpecificBooks", error);
      return {
        success: false,
        deletedCount: 0,
        message: `Failed to delete books: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Delete ALL books from Anonymous users (cleanup)
   */
  static async deleteAnonymousBooks(): Promise<TargetedDeletionResult> {
    try {
      console.log("Starting deletion of all Anonymous user books...");

      // Get all profiles where name is Anonymous or null to get their IDs
      const { data: anonymousProfiles, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .or("name.eq.Anonymous,name.is.null");

      if (profileError) {
        logError(
          "TargetedBookDeletionService.deleteAnonymousBooks - profiles",
          profileError,
        );
        return {
          success: false,
          deletedCount: 0,
          message: "Failed to fetch anonymous profiles",
        };
      }

      if (!anonymousProfiles || anonymousProfiles.length === 0) {
        return {
          success: true,
          deletedCount: 0,
          message: "No anonymous profiles found",
        };
      }

      const anonymousUserIds = anonymousProfiles.map((p) => p.id);
      console.log(`Found ${anonymousUserIds.length} anonymous user profiles`);

      // Get all books by anonymous users
      const { data: anonymousBooks, error: booksError } = await supabase
        .from("books")
        .select("id, title, user_id")
        .in("user_id", anonymousUserIds);

      if (booksError) {
        logError(
          "TargetedBookDeletionService.deleteAnonymousBooks - books",
          booksError,
        );
        return {
          success: false,
          deletedCount: 0,
          message: "Failed to fetch anonymous books",
        };
      }

      if (!anonymousBooks || anonymousBooks.length === 0) {
        return {
          success: true,
          deletedCount: 0,
          message: "No books from anonymous users found",
        };
      }

      console.log(`Found ${anonymousBooks.length} books from anonymous users`);

      // Delete all anonymous books
      const bookIds = anonymousBooks.map((book) => book.id);
      const { error: deleteError } = await supabase
        .from("books")
        .delete()
        .in("id", bookIds);

      if (deleteError) {
        logError(
          "TargetedBookDeletionService.deleteAnonymousBooks - delete",
          deleteError,
        );
        return {
          success: false,
          deletedCount: 0,
          message: "Failed to delete anonymous books",
        };
      }

      const deletedTitles = anonymousBooks.map((book) => book.title);
      console.log(
        `Successfully deleted ${anonymousBooks.length} anonymous books`,
      );

      return {
        success: true,
        deletedCount: anonymousBooks.length,
        message: `Successfully deleted ${anonymousBooks.length} books from anonymous users`,
        deletedTitles,
      };
    } catch (error) {
      logError("TargetedBookDeletionService.deleteAnonymousBooks", error);
      return {
        success: false,
        deletedCount: 0,
        message: `Failed to delete anonymous books: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Delete books by author names (for cleanup)
   */
  static async deleteBooksByAuthors(): Promise<TargetedDeletionResult> {
    try {
      console.log("Starting deletion of books by specific authors...");

      // Authors from the user's list
      const authorsToDelete = [
        "Prof. Code Master",
        "Prof. Albert Newton",
        "Prof. James Mitchell",
        "Robert Anderson",
        "Dr. Emma Taylor",
        "Dr. Lisa Chen",
        "Prof. David Wilson",
        "Michael Brown",
        "Dr. Sarah Johnson",
        "John Smith",
        "Dr. Green Planet",
      ];

      console.log("Targeting books by these authors:", authorsToDelete);

      // Get all books by these authors
      const { data: authorBooks, error: fetchError } = await supabase
        .from("books")
        .select("id, title, author")
        .in("author", authorsToDelete);

      if (fetchError) {
        logError(
          "TargetedBookDeletionService.deleteBooksByAuthors - fetch",
          fetchError,
        );
        return {
          success: false,
          deletedCount: 0,
          message: "Failed to fetch books by authors",
        };
      }

      if (!authorBooks || authorBooks.length === 0) {
        return {
          success: true,
          deletedCount: 0,
          message: "No books by specified authors found",
        };
      }

      console.log(`Found ${authorBooks.length} books by target authors`);

      // Delete all books by these authors
      const bookIds = authorBooks.map((book) => book.id);
      const { error: deleteError } = await supabase
        .from("books")
        .delete()
        .in("id", bookIds);

      if (deleteError) {
        logError(
          "TargetedBookDeletionService.deleteBooksByAuthors - delete",
          deleteError,
        );
        return {
          success: false,
          deletedCount: 0,
          message: "Failed to delete books by authors",
        };
      }

      const deletedTitles = authorBooks.map(
        (book) => `${book.title} by ${book.author}`,
      );
      console.log(
        `Successfully deleted ${authorBooks.length} books by target authors`,
      );

      return {
        success: true,
        deletedCount: authorBooks.length,
        message: `Successfully deleted ${authorBooks.length} books by specified authors`,
        deletedTitles,
      };
    } catch (error) {
      logError("TargetedBookDeletionService.deleteBooksByAuthors", error);
      return {
        success: false,
        deletedCount: 0,
        message: `Failed to delete books by authors: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Run comprehensive cleanup (all methods)
   */
  static async runComprehensiveCleanup(): Promise<{
    specificBooks: TargetedDeletionResult;
    anonymousBooks: TargetedDeletionResult;
    authorBooks: TargetedDeletionResult;
    summary: {
      totalDeleted: number;
      success: boolean;
      message: string;
    };
  }> {
    console.log("Starting comprehensive book cleanup...");

    const specificBooks = await this.deleteSpecificBooks();
    const anonymousBooks = await this.deleteAnonymousBooks();
    const authorBooks = await this.deleteBooksByAuthors();

    const totalDeleted =
      specificBooks.deletedCount +
      anonymousBooks.deletedCount +
      authorBooks.deletedCount;
    const allSuccessful =
      specificBooks.success && anonymousBooks.success && authorBooks.success;

    return {
      specificBooks,
      anonymousBooks,
      authorBooks,
      summary: {
        totalDeleted,
        success: allSuccessful,
        message: `Cleanup completed: ${totalDeleted} books deleted total`,
      },
    };
  }
}

export default TargetedBookDeletionService;

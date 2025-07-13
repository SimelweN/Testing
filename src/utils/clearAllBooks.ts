import { supabase } from "@/integrations/supabase/client";

export const clearAllBooks = async (): Promise<{
  success: boolean;
  message: string;
  deletedCount: number;
}> => {
  try {
    console.log("Starting to clear all books from database...");

    // First, get the count of books to be deleted
    const { count: totalBooks, error: countError } = await supabase
      .from("books")
      .select("*", { count: "exact", head: true });

    if (countError) {
      console.error(
        "Error counting books:",
        countError.message || String(countError),
      );
      throw countError;
    }

    const booksCount = totalBooks || 0;
    console.log(`Found ${booksCount} books to delete`);

    if (booksCount === 0) {
      return {
        success: true,
        message: "No books found to delete",
        deletedCount: 0,
      };
    }

    // Delete all books in batches to avoid timeout
    const batchSize = 1000;
    let totalDeleted = 0;

    // Delete all books (this will cascade to related tables like notifications)
    const { error: deleteError } = await supabase
      .from("books")
      .delete()
      .gte("created_at", "1900-01-01"); // This will match all records safely

    if (deleteError) {
      console.error(
        "Error deleting books:",
        deleteError.message || String(deleteError),
      );
      throw deleteError;
    }

    console.log(`Successfully deleted all ${booksCount} books`);

    return {
      success: true,
      message: `Successfully deleted ${booksCount} books from the database`,
      deletedCount: booksCount,
    };
  } catch (error) {
    console.error(
      "Error in clearAllBooks:",
      error instanceof Error ? error.message : String(error),
    );
    return {
      success: false,
      message: `Failed to clear books: ${error instanceof Error ? error.message : "Unknown error"}`,
      deletedCount: 0,
    };
  }
};

import { supabase } from "@/integrations/supabase/client";

export const clearAllBrowseBooks = async (): Promise<{
  success: boolean;
  message: string;
  deletedCount: number;
}> => {
  try {
    console.log("Clearing all books from Browse Books...");

    // Get count first
    const { count, error: countError } = await supabase
      .from("books")
      .select("*", { count: "exact", head: true });

    if (countError) {
      console.error(
        "Error counting books:",
        countError.message || String(countError),
      );
      return {
        success: false,
        message: `Failed to count books: ${countError.message}`,
        deletedCount: 0,
      };
    }

    const totalBooks = count || 0;

    if (totalBooks === 0) {
      return {
        success: true,
        message: "No books found to delete",
        deletedCount: 0,
      };
    }

    // Delete all books
    const { error: deleteError } = await supabase
      .from("books")
      .delete()
      .gte("created_at", "1900-01-01"); // This will match all records safely

    if (deleteError) {
      console.error(
        "Error deleting books:",
        deleteError.message || String(deleteError),
      );
      return {
        success: false,
        message: `Failed to delete books: ${deleteError.message}`,
        deletedCount: 0,
      };
    }

    console.log(`Successfully cleared ${totalBooks} books from Browse Books`);

    return {
      success: true,
      message: `Successfully cleared ${totalBooks} books from Browse Books`,
      deletedCount: totalBooks,
    };
  } catch (error) {
    console.error(
      "Error in clearAllBrowseBooks:",
      error instanceof Error ? error.message : String(error),
    );
    return {
      success: false,
      message: `Failed to clear books: ${error instanceof Error ? error.message : "Unknown error"}`,
      deletedCount: 0,
    };
  }
};

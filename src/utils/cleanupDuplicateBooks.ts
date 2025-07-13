import { supabase } from "@/integrations/supabase/client";

/**
 * Simple cleanup function to remove duplicate books
 */
export const cleanupDuplicateBooks = async (): Promise<void> => {
  try {
    console.log("🧹 Starting cleanup of duplicate books...");

    // Get all books named "Psychology: The Science of Mind" and other duplicates
    const duplicatesTitles = [
      "Psychology: The Science of Mind",
      "Data Structures and Algorithms Mastery",
      "Advanced Physics Mechanics",
      "Constitutional Law of South Africa",
      "Business Management Fundamentals",
      "Human Anatomy and Physiology",
      "Calculus and Analytical Geometry",
      "Financial Accounting Principles",
      "Organic Chemistry 3rd Edition",
      "Introduction to Computer Science",
    ];

    const { data: duplicateBooks, error } = await supabase
      .from("books")
      .select("id, title")
      .in("title", duplicatesTitles);

    if (error) {
      console.error(
        "❌ Error finding duplicate books:",
        error.message || String(error),
      );
      return;
    }

    if (!duplicateBooks || duplicateBooks.length === 0) {
      console.log("✨ No duplicate books found!");
      return;
    }

    console.log(`🎯 Found ${duplicateBooks.length} duplicate books to delete`);

    // Delete all duplicates
    const { error: deleteError } = await supabase
      .from("books")
      .delete()
      .in(
        "id",
        duplicateBooks.map((book) => book.id),
      );

    if (deleteError) {
      console.error(
        "❌ Error deleting books:",
        deleteError.message || String(deleteError),
      );
      return;
    }

    console.log(
      `✅ Successfully deleted ${duplicateBooks.length} duplicate books!`,
    );
  } catch (error) {
    console.error(
      "💥 Cleanup failed:",
      error instanceof Error ? error.message : String(error),
    );
  }
};

// Auto-run cleanup if called directly in browser console
if (typeof window !== "undefined") {
  (window as any).cleanupDuplicateBooks = cleanupDuplicateBooks;
  console.log(
    "📚 Cleanup function available: call cleanupDuplicateBooks() in console",
  );
}

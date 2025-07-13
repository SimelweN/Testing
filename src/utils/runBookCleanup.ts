import TargetedBookDeletionService from "@/services/admin/targetedBookDeletion";
import { toast } from "sonner";

/**
 * Run immediate book cleanup
 */
export const runImmediateBookCleanup = async () => {
  try {
    console.log("🧹 Starting immediate book cleanup...");
    toast.loading("Cleaning up duplicate/test books...", { id: "cleanup" });

    // Run comprehensive cleanup
    const results = await TargetedBookDeletionService.runComprehensiveCleanup();

    console.log("📊 Cleanup Results:", results);

    if (results.summary.success) {
      toast.success(
        `✅ Cleanup completed! Deleted ${results.summary.totalDeleted} books total`,
        {
          id: "cleanup",
          duration: 5000,
        },
      );

      console.log("✅ Cleanup breakdown:");
      console.log(
        `  📚 Specific titles: ${results.specificBooks.deletedCount}`,
      );
      console.log(
        `  👤 Anonymous books: ${results.anonymousBooks.deletedCount}`,
      );
      console.log(`  ✍️ Author books: ${results.authorBooks.deletedCount}`);

      // Force page reload to show clean data
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } else {
      toast.error("⚠️ Cleanup partially failed. Check console for details.", {
        id: "cleanup",
      });
    }

    return results;
  } catch (error) {
    console.error("❌ Cleanup failed:", error);
    toast.error("Failed to run cleanup. Check console for details.", {
      id: "cleanup",
    });
    throw error;
  }
};

// Auto-run cleanup if needed
if (typeof window !== "undefined" && window.location.pathname === "/") {
  // Only run on homepage and if there's a specific flag
  const shouldCleanup = localStorage.getItem("run-book-cleanup");
  if (shouldCleanup === "true") {
    localStorage.removeItem("run-book-cleanup");
    console.log("🚀 Auto-running book cleanup...");
    runImmediateBookCleanup();
  }
}

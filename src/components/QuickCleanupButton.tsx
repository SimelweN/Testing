import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, RefreshCw } from "lucide-react";
import { runCleanupNow } from "@/utils/runCleanupNow";
import { toast } from "sonner";

const QuickCleanupButton: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);

  const handleCleanup = async () => {
    setIsRunning(true);
    try {
      const result = await runCleanupNow();
      if (result.success) {
        toast.success("🎉 Database cleanup completed!");
        toast.info("All books are now available for purchase");
      } else {
        const errorMsg = result.error || "Unknown error occurred";
        console.error("Cleanup failed with error:", errorMsg);
        toast.error("❌ Cleanup failed: " + errorMsg);
      }
    } catch (error) {
      toast.error(
        "❌ Cleanup error: " +
          (error instanceof Error ? error.message : "Unknown error"),
      );
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Button
      onClick={handleCleanup}
      disabled={isRunning}
      variant="outline"
      size="sm"
      className="fixed bottom-4 right-4 z-50 bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
    >
      {isRunning ? (
        <>
          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          Cleaning...
        </>
      ) : (
        <>
          <Trash2 className="w-4 h-4 mr-2" />
          Quick Cleanup
        </>
      )}
    </Button>
  );
};

export default QuickCleanupButton;

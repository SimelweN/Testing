import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trash2, RefreshCw, AlertTriangle, CheckCircle } from "lucide-react";
import {
  cleanupMockData,
  resetAllBooksToAvailable,
} from "@/utils/cleanupMockData";
import { toast } from "sonner";

const DatabaseCleanup: React.FC = () => {
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [isResettingBooks, setIsResettingBooks] = useState(false);
  const [lastCleanupResult, setLastCleanupResult] = useState<any>(null);

  const handleCleanupMockData = async () => {
    if (
      !confirm(
        "Are you sure you want to remove all mock/test data? This cannot be undone.",
      )
    ) {
      return;
    }

    setIsCleaningUp(true);
    try {
      const result = await cleanupMockData();
      setLastCleanupResult(result);

      if (result.success) {
        toast.success(result.message || "Mock data cleanup completed");
      } else {
        const errorMsg = result.error || "Cleanup failed";
        console.error("Admin cleanup failed:", errorMsg);
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error("Cleanup error:", error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      toast.error("Failed to cleanup mock data: " + errorMsg);
    } finally {
      setIsCleaningUp(false);
    }
  };

  const handleResetBooks = async () => {
    if (
      !confirm(
        "Reset all books to available status? This will make all books purchasable again.",
      )
    ) {
      return;
    }

    setIsResettingBooks(true);
    try {
      const result = await resetAllBooksToAvailable();

      if (result.success) {
        toast.success(result.message || "Books reset successfully");
      } else {
        toast.error(result.error || "Failed to reset books");
      }
    } catch (error) {
      console.error("Reset error:", error);
      toast.error("Failed to reset books");
    } finally {
      setIsResettingBooks(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="w-5 h-5" />
            Database Cleanup Tools
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Warning:</strong> These operations cannot be undone. Use
              with caution in production.
            </AlertDescription>
          </Alert>

          <div className="grid gap-4">
            {/* Mock Data Cleanup */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium mb-2">Remove Mock/Test Data</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Removes all accounts with test/mock/fake emails and their
                  associated data (books, orders, etc.)
                </p>
                <Button
                  onClick={handleCleanupMockData}
                  disabled={isCleaningUp}
                  variant="destructive"
                  className="w-full"
                >
                  {isCleaningUp ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Cleaning Up...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clean Up Mock Data
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Book Status Reset */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium mb-2">Reset Book Availability</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Resets all books to "available" status, making them
                  purchasable again
                </p>
                <Button
                  onClick={handleResetBooks}
                  disabled={isResettingBooks}
                  variant="outline"
                  className="w-full"
                >
                  {isResettingBooks ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Reset All Books to Available
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Last Cleanup Result */}
          {lastCleanupResult && (
            <Card
              className={
                lastCleanupResult.success
                  ? "border-green-200 bg-green-50"
                  : "border-red-200 bg-red-50"
              }
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  {lastCleanupResult.success ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  )}
                  <h3 className="font-medium">
                    {lastCleanupResult.success
                      ? "Cleanup Successful"
                      : "Cleanup Failed"}
                  </h3>
                </div>
                <p className="text-sm">
                  {lastCleanupResult.message || lastCleanupResult.error}
                </p>
                {lastCleanupResult.removedProfiles && (
                  <p className="text-xs text-gray-600 mt-1">
                    Removed {lastCleanupResult.removedProfiles} profiles and
                    associated data
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DatabaseCleanup;

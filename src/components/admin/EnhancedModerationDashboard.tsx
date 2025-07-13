import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RefreshCw, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReportFilters from "./reports/ReportFilters";
import ErrorFallback from "@/components/ErrorFallback";
import { Button } from "@/components/ui/button";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { useIsMobile } from "@/hooks/use-mobile";
import { ModerationReportCard } from "./reports/ModerationReportCard";
import { ModerationTableRow } from "./reports/ModerationTableRow";
import {
  loadModerationData,
  updateReportStatus,
  updateUserStatus,
  unsuspendUser,
  Report,
  SuspendedUser,
  ModerationData,
} from "@/services/admin/moderationDataService";
import { copyEmailToClipboard } from "@/utils/emailCopyUtils";
import LoadingSpinner from "@/components/LoadingSpinner";

const EnhancedModerationDashboard = () => {
  const isMobile = useIsMobile();
  const [reports, setReports] = useState<Report[]>([]);
  const [suspendedUsers, setSuspendedUsers] = useState<SuspendedUser[]>([]);
  const [filteredData, setFilteredData] = useState<Report[] | SuspendedUser[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [activeTab, setActiveTab] = useState<
    "pending" | "resolved" | "dismissed" | "suspended" | "all"
  >("pending");
  const [actionReason, setActionReason] = useState("");
  const { handleError } = useErrorHandler();

  // Define functions before useEffect to avoid temporal dead zone
  const loadData = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);

      const data: ModerationData = await loadModerationData();
      setReports(data.reports);
      setSuspendedUsers(data.suspendedUsers);
      setRetryCount(0); // Reset retry count on success
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to load moderation data";
      console.error("Error loading moderation data:", error);
      setError(errorMessage);

      // Only show toast for user if not a retry
      if (retryCount === 0) {
        handleError(error, "Load Moderation Data");
      }

      setRetryCount((prev) => prev + 1);
    } finally {
      setIsLoading(false);
    }
  }, [retryCount, handleError]);

  const setupRealtimeSubscription = useCallback(() => {
    try {
      const reportsChannel = supabase
        .channel("reports-changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "reports",
          },
          () => {
            console.log("Reports updated, reloading...");
            loadData();
          },
        )
        .subscribe();

      const profilesChannel = supabase
        .channel("profiles-changes")
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "profiles",
          },
          () => {
            console.log("User profiles updated, reloading...");
            loadData();
          },
        )
        .subscribe();

      return () => {
        supabase.removeChannel(reportsChannel);
        supabase.removeChannel(profilesChannel);
      };
    } catch (error) {
      console.warn("Failed to set up realtime subscription:", error);
    }
  }, [loadData]);

  const filterData = useCallback(() => {
    if (activeTab === "suspended") {
      setFilteredData(suspendedUsers);
    } else if (activeTab === "all") {
      setFilteredData(reports);
    } else {
      setFilteredData(reports.filter((report) => report.status === activeTab));
    }
  }, [activeTab, suspendedUsers, reports]);

  // useEffect hooks after function definitions
  useEffect(() => {
    loadData();
    // Don't set up realtime subscription immediately to avoid overload
    const timer = setTimeout(() => {
      loadData();
      setupRealtimeSubscription();
    }, 2000);

    return () => clearTimeout(timer);
  }, [loadData, setupRealtimeSubscription]);

  useEffect(() => {
    filterData();
  }, [reports, suspendedUsers, activeTab, filterData]);

  const handleUpdateReportStatus = async (
    reportId: string,
    status: "resolved" | "dismissed",
  ) => {
    if (isActionLoading === reportId) return; // Prevent duplicate actions

    try {
      setIsActionLoading(reportId);
      await updateReportStatus(reportId, status);
      toast.success(`Report ${status} successfully`);
      await loadData(); // Reload data after action
    } catch (error) {
      console.error("Error updating report status:", error);
      toast.error(`Failed to ${status} report. Please try again.`);
      handleError(error, "Update Report Status");
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleUserAction = async (
    userId: string,
    action: "ban" | "suspend",
    reason: string,
  ) => {
    if (isActionLoading === userId) return; // Prevent duplicate actions

    try {
      setIsActionLoading(userId);
      await updateUserStatus(userId, action, reason);
      toast.success(`User ${action}ned successfully`);
      await loadData(); // Reload data after action
    } catch (error) {
      console.error("Error updating user status:", error);
      toast.error(`Failed to ${action} user. Please try again.`);
      handleError(error, "User Action");
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleUnsuspendUser = async (userId: string) => {
    if (isActionLoading === userId) return; // Prevent duplicate actions

    try {
      setIsActionLoading(userId);
      await unsuspendUser(userId);
      toast.success("User unsuspended successfully");
      await loadData(); // Reload data after action
    } catch (error) {
      console.error("Error unsuspending user:", error);
      toast.error("Failed to unsuspend user. Please try again.");
      handleError(error, "Unsuspend User");
    } finally {
      setIsActionLoading(null);
    }
  };

  // Show error state with retry option
  if (error && retryCount > 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Unable to Load Reports
          </h3>
          <p className="text-sm text-gray-600 mt-1">{error}</p>
        </div>
        <Button onClick={loadData} variant="outline" className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  // Show loading state
  if (isLoading && reports.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="lg" text="Loading moderation data..." />
      </div>
    );
  }

  const stats = {
    pending: reports.filter((r) => r.status === "pending").length,
    resolved: reports.filter((r) => r.status === "resolved").length,
    dismissed: reports.filter((r) => r.status === "dismissed").length,
    suspended: suspendedUsers.length,
    total: reports.length,
  };

  return (
    <div className={`space-y-4 ${isMobile ? "px-2" : ""}`}>
      {/* Mobile-optimized stats cards */}
      <div
        className={`grid ${isMobile ? "grid-cols-2 gap-2" : "grid-cols-5 gap-4"}`}
      >
        <Card className={isMobile ? "p-2" : ""}>
          <CardHeader className={`${isMobile ? "pb-2 px-2 pt-2" : "pb-2"}`}>
            <CardTitle
              className={`${isMobile ? "text-xs" : "text-sm"} font-medium text-gray-600`}
            >
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent className={isMobile ? "px-2 pb-2" : "pt-0"}>
            <div
              className={`${isMobile ? "text-lg" : "text-2xl"} font-bold text-orange-600`}
            >
              {stats.pending}
            </div>
          </CardContent>
        </Card>

        <Card className={isMobile ? "p-2" : ""}>
          <CardHeader className={`${isMobile ? "pb-2 px-2 pt-2" : "pb-2"}`}>
            <CardTitle
              className={`${isMobile ? "text-xs" : "text-sm"} font-medium text-gray-600`}
            >
              Resolved
            </CardTitle>
          </CardHeader>
          <CardContent className={isMobile ? "px-2 pb-2" : "pt-0"}>
            <div
              className={`${isMobile ? "text-lg" : "text-2xl"} font-bold text-green-600`}
            >
              {stats.resolved}
            </div>
          </CardContent>
        </Card>

        <Card className={isMobile ? "p-2" : ""}>
          <CardHeader className={`${isMobile ? "pb-2 px-2 pt-2" : "pb-2"}`}>
            <CardTitle
              className={`${isMobile ? "text-xs" : "text-sm"} font-medium text-gray-600`}
            >
              Dismissed
            </CardTitle>
          </CardHeader>
          <CardContent className={isMobile ? "px-2 pb-2" : "pt-0"}>
            <div
              className={`${isMobile ? "text-lg" : "text-2xl"} font-bold text-gray-600`}
            >
              {stats.dismissed}
            </div>
          </CardContent>
        </Card>

        <Card className={isMobile ? "p-2" : ""}>
          <CardHeader className={`${isMobile ? "pb-2 px-2 pt-2" : "pb-2"}`}>
            <CardTitle
              className={`${isMobile ? "text-xs" : "text-sm"} font-medium text-gray-600`}
            >
              Suspended
            </CardTitle>
          </CardHeader>
          <CardContent className={isMobile ? "px-2 pb-2" : "pt-0"}>
            <div
              className={`${isMobile ? "text-lg" : "text-2xl"} font-bold text-red-600`}
            >
              {stats.suspended}
            </div>
          </CardContent>
        </Card>

        {!isMobile && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Reports
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-blue-600">
                {stats.total}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader className={isMobile ? "p-4" : ""}>
          <div
            className={`flex ${isMobile ? "flex-col space-y-2" : "flex-row items-center justify-between"}`}
          >
            <div>
              <CardTitle className={isMobile ? "text-lg" : "text-xl"}>
                Moderation Dashboard
              </CardTitle>
              <CardDescription className={isMobile ? "text-sm" : ""}>
                Manage reports and user moderation
              </CardDescription>
            </div>
            <Button
              onClick={loadData}
              variant="outline"
              size={isMobile ? "sm" : "default"}
              disabled={isLoading}
              className={isMobile ? "w-full" : ""}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className={isMobile ? "p-4 pt-0" : ""}>
          <ReportFilters
            activeTab={activeTab}
            onTabChange={setActiveTab}
            isMobile={isMobile}
          />
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardContent className={isMobile ? "p-2" : "p-6"}>
          {filteredData.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                No{" "}
                {activeTab === "suspended"
                  ? "suspended users"
                  : `${activeTab} reports`}{" "}
                found.
              </p>
            </div>
          ) : isMobile ? (
            // Mobile card view
            <div className="space-y-3">
              {filteredData.map((item) => (
                <ModerationReportCard
                  key={item.id}
                  data={item}
                  isReport={activeTab !== "suspended"}
                  onUpdateStatus={handleUpdateReportStatus}
                  onUserAction={handleUserAction}
                  onUnsuspendUser={handleUnsuspendUser}
                  onCopyEmail={copyEmailToClipboard}
                  isLoading={isActionLoading === item.id}
                />
              ))}
            </div>
          ) : (
            // Desktop table view
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    {activeTab === "suspended" ? (
                      <>
                        <TableHead>User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Suspended</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Actions</TableHead>
                      </>
                    ) : (
                      <>
                        <TableHead>Book</TableHead>
                        <TableHead>Seller</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Reported</TableHead>
                        <TableHead>Actions</TableHead>
                      </>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((item) => (
                    <ModerationTableRow
                      key={item.id}
                      data={item}
                      isReport={activeTab !== "suspended"}
                      onUpdateStatus={handleUpdateReportStatus}
                      onUserAction={handleUserAction}
                      onUnsuspendUser={handleUnsuspendUser}
                      onCopyEmail={copyEmailToClipboard}
                      isLoading={isActionLoading === item.id}
                    />
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedModerationDashboard;

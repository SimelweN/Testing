import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  getAdminStats,
  getAllUsers,
  getAllListings,
  AdminStats as AdminStatsType,
  AdminUser,
  AdminListing,
} from "@/services/admin/adminQueries";
import {
  updateUserStatus,
  deleteBookListing,
  sendBroadcastMessage,
} from "@/services/admin/adminMutations";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import AdminStats from "@/components/admin/AdminStats";
import AdminEarningsTab from "@/components/admin/AdminEarningsTab";
import AdminUsersTab from "@/components/admin/AdminUsersTab";
import AdminListingsTab from "@/components/admin/AdminListingsTab";
import AdminSettingsTab from "@/components/admin/AdminSettingsTab";
import AdminContactTab from "@/components/admin/AdminContactTab";
import AdminResourcesTab from "@/components/admin/AdminResourcesTab";
import AdminProgramsTab from "@/components/admin/AdminProgramsTab";

import ErrorFallback from "@/components/ErrorFallback";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import {
  TrendingUp,
  Users,
  BookOpen,
  MessageSquare,
  FileText,
  Settings,
  GraduationCap,
  Lightbulb,
} from "lucide-react";

const AdminDashboard = () => {
  const isMobile = useIsMobile();
  const { handleError } = useErrorHandler();
  const { user } = useAuth();

  const [stats, setStats] = useState<AdminStatsType>({
    totalUsers: 0,
    activeListings: 0,
    booksSold: 0,
    reportedIssues: 0,
    newUsersThisWeek: 0,
    salesThisMonth: 0,
    weeklyCommission: 0,
    monthlyCommission: 0,
    pendingReports: 0,
    unreadMessages: 0,
  });

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log("Loading admin dashboard data...");

      // Load data with individual error handling to prevent cascading failures
      const results = await Promise.allSettled([
        getAdminStats().catch((e) => ({ error: e })),
        getAllUsers().catch((e) => ({ error: e })),
        getAllListings().catch((e) => ({ error: e })),
      ]);

      // Handle stats
      if (results[0].status === "fulfilled") {
        setStats(results[0].value);
        console.log("Stats loaded successfully");
      } else {
        console.error("Failed to load stats:", results[0].reason);
        handleError(results[0].reason, "Load Admin Stats", {
          showToast: false,
        });
      }

      // Handle users
      if (results[1].status === "fulfilled") {
        setUsers(results[1].value);
        console.log("Users loaded successfully:", results[1].value.length);
      } else {
        console.error("Failed to load users:", results[1].reason);
        handleError(results[1].reason, "Load Users", { showToast: false });
        setUsers([]); // Set empty array as fallback
      }

      // Handle listings
      if (results[2].status === "fulfilled") {
        setListings(results[2].value);
        console.log("Listings loaded successfully:", results[2].value.length);
      } else {
        console.error("Failed to load listings:", results[2].reason);
        handleError(results[2].reason, "Load Listings", { showToast: false });
        setListings([]); // Set empty array as fallback
      }

      // Check if all operations failed
      const allFailed = results.every((result) => result.status === "rejected");
      if (allFailed) {
        throw new Error("Failed to load all dashboard data");
      }

      // Show warning if some operations failed
      const failedCount = results.filter(
        (result) => result.status === "rejected",
      ).length;
      if (failedCount > 0) {
        toast.warning(`${failedCount} out of 3 data sections failed to load`);
      }

      setRetryCount(0); // Reset retry count on success
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to load dashboard data";
      setError(errorMessage);
      handleError(error, "Admin Dashboard");
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
    loadDashboardData();
  };

  const handleUserAction = async (
    userId: string,
    action: "suspend" | "activate",
  ) => {
    try {
      const status = action === "suspend" ? "suspended" : "active";
      await updateUserStatus(userId, status);

      setUsers(
        users.map((user) => (user.id === userId ? { ...user, status } : user)),
      );

      toast.success(`User ${action}d successfully`);

      // Reload stats to reflect the change
      try {
        const newStats = await getAdminStats();
        setStats(newStats);
      } catch (error) {
        console.error("Failed to reload stats after user action:", error);
      }
    } catch (error) {
      console.error(`Error ${action}ing user:`, error);
      handleError(error, `${action} User`);
    }
  };

  const handleListingAction = async (listingId: string, action: "delete") => {
    if (action !== "delete") return;

    try {
      console.log(
        `[AdminDashboard] Attempting to delete listing: ${listingId}`,
      );

      // Get current user for admin tracking
      const adminId = user?.id;

      if (!adminId) {
        throw new Error("Admin user ID is required for deletion tracking");
      }

      // Perform deletion with admin tracking
      await deleteBookListing(listingId, adminId);

      // Remove from local state immediately for better UX
      setListings((prevListings) =>
        prevListings.filter((listing) => listing.id !== listingId),
      );

      toast.success("Listing deleted successfully");
      console.log(
        `[AdminDashboard] Successfully deleted listing: ${listingId}`,
      );

      // Reload stats and full listings to ensure accuracy
      try {
        const [newStats, updatedListings] = await Promise.all([
          getAdminStats(),
          getAllListings(),
        ]);
        setStats(newStats);
        setListings(updatedListings);
        console.log(`[AdminDashboard] Data reloaded after deletion`);
      } catch (reloadError) {
        console.error(
          "Failed to reload data after listing deletion:",
          reloadError,
        );
        // If reload fails, trigger full dashboard reload
        loadDashboardData();
      }
    } catch (error) {
      console.error(`Error deleting listing ${listingId}:`, error);

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      toast.error(`Failed to delete listing: ${errorMessage}`);

      handleError(error, "Delete Listing");

      // Reload listings in case of error to show current state
      try {
        const updatedListings = await getAllListings();
        setListings(updatedListings);
      } catch (reloadError) {
        console.error("Failed to reload listings after error:", reloadError);
        // If even reload fails, trigger full dashboard reload
        loadDashboardData();
      }
    }
  };

  const handleSendBroadcast = async () => {
    if (!broadcastMessage.trim()) {
      toast.error("Please enter a message");
      return;
    }

    try {
      await sendBroadcastMessage(broadcastMessage);
      toast.success(`Broadcast message sent to all ${stats.totalUsers} users`);
      setBroadcastMessage("");
    } catch (error) {
      console.error("Error sending broadcast:", error);
      handleError(error, "Send Broadcast");
    }
  };

  if (error && retryCount < 3) {
    return (
      <ErrorFallback
        error={new Error(error)}
        resetError={handleRetry}
        title="Dashboard Error"
        description="Failed to load admin dashboard. Click 'Try Again' to retry."
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Loading admin dashboard..." />
      </div>
    );
  }

  // Define tab configuration with icons
  const tabConfig = [
    {
      value: "earnings",
      label: "Earnings",
      icon: TrendingUp,
      color: "text-green-600",
      description: "Revenue and commission tracking",
    },
    {
      value: "users",
      label: "Users",
      icon: Users,
      color: "text-blue-600",
      badge: stats.totalUsers,
      description: "User management and analytics",
    },
    {
      value: "listings",
      label: "Listings",
      icon: BookOpen,
      color: "text-purple-600",
      badge: listings.length,
      description: "Book listings and inventory",
    },
    {
      value: "programs",
      label: "Programs",
      icon: GraduationCap,
      color: "text-indigo-600",
      description: "University program submissions",
    },
    {
      value: "resources",
      label: "Resources",
      icon: Lightbulb,
      color: "text-amber-600",
      description: "Study resources and tips",
    },

    {
      value: "contact",
      label: "Messages",
      icon: MessageSquare,
      color: "text-rose-600",
      badge: stats.unreadMessages,
      description: "Contact form messages",
    },
    {
      value: "settings",
      label: "Settings",
      icon: Settings,
      color: "text-gray-600",
      description: "System configuration",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Enhanced Stats Section */}
      <div className="bg-gradient-to-r from-book-50 to-blue-50 rounded-lg p-4 md:p-6 border border-book-200">
        <AdminStats stats={stats} />
      </div>

      {/* Modern Tabs Design */}
      <Tabs defaultValue="earnings" className="w-full">
        {isMobile ? (
          // Mobile: Scrollable horizontal tabs with improved spacing
          <div className="w-full overflow-x-auto scrollbar-hide">
            <TabsList className="inline-flex w-max min-w-full h-auto p-1 bg-white border border-gray-200 rounded-lg shadow-sm">
              {tabConfig.map((tab) => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="flex flex-col items-center justify-center px-2.5 py-2.5 min-w-[75px] data-[state=active]:bg-book-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 rounded-md mx-0.5"
                  >
                    <div className="relative">
                      <Icon className="h-3.5 w-3.5 mb-1" />
                      {tab.badge && tab.badge > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1 min-w-[14px] h-3.5 flex items-center justify-center text-[10px]">
                          {tab.badge > 99 ? "99+" : tab.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-medium truncate max-w-[65px] leading-tight">
                      {tab.label}
                    </span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>
        ) : (
          // Desktop: Proper TabsList with grid styling
          <TabsList className="grid grid-cols-8 gap-2 p-2 bg-white border border-gray-200 rounded-lg shadow-sm h-auto">
            {tabConfig.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="flex flex-col items-center justify-center p-3 h-auto data-[state=active]:bg-book-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-lg hover:bg-gray-50 data-[state=active]:hover:bg-book-700 group"
                >
                  <div className="relative mb-2">
                    <Icon
                      className={`h-5 w-5 ${tab.color} group-data-[state=active]:text-white transition-colors`}
                    />
                    {tab.badge && tab.badge > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] h-4 flex items-center justify-center">
                        {tab.badge > 99 ? "99+" : tab.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-medium mb-1 text-center">
                    {tab.label}
                  </span>
                  <span className="text-[10px] opacity-70 text-center line-clamp-2 leading-tight">
                    {tab.description}
                  </span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        )}

        {/* Tab Content with improved styling */}
        <div className="mt-6">
          <TabsContent value="earnings" className="space-y-4 mt-0">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-x-auto">
              <AdminEarningsTab stats={stats} />
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-4 mt-0">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-x-auto">
              <AdminUsersTab users={users} onUserAction={handleUserAction} />
            </div>
          </TabsContent>

          <TabsContent value="listings" className="space-y-4 mt-0">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-x-auto">
              <AdminListingsTab
                listings={listings}
                onListingAction={handleListingAction}
              />
            </div>
          </TabsContent>

          <TabsContent value="programs" className="space-y-4 mt-0">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 md:p-6">
              <AdminProgramsTab />
            </div>
          </TabsContent>

          <TabsContent value="resources" className="space-y-4 mt-0">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 md:p-6">
              <AdminResourcesTab />
            </div>
          </TabsContent>

          <TabsContent value="contact" className="space-y-4 mt-0">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <AdminContactTab />
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4 mt-0">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <AdminSettingsTab
                broadcastMessage={broadcastMessage}
                setBroadcastMessage={setBroadcastMessage}
                onSendBroadcast={handleSendBroadcast}
              />
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;

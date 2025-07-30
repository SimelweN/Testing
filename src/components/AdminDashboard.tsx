import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  deleteUser,
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
import AdminPayoutTab from "@/components/admin/AdminPayoutTab";
import AdminUtilitiesTab from "@/components/admin/AdminUtilitiesTab";
import EmailDiagnosticsDashboard from "@/components/admin/EmailDiagnosticsDashboard";
import MailQueueFix from "@/components/admin/MailQueueFix";



import ErrorFallback from "@/components/ErrorFallback";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import {
  BarChart3,
  Users,
  BookOpen,
  MessageSquare,
  Settings,
  GraduationCap,
  Lightbulb,
  CreditCard,
  Terminal,
  Activity,
  TrendingUp,
  DollarSign,
  UserCheck,
  Bell,
  ChevronRight,
  Code,
  Banknote,
  Wrench,
  Mail,
} from "lucide-react";

const AdminDashboard = () => {
  const navigate = useNavigate();
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
  const [activeTab, setActiveTab] = useState("overview");

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
    action: "suspend" | "activate" | "delete",
  ) => {
    try {
      if (action === "delete") {
        // Handle user deletion
        toast.loading("Deleting user and all associated data...", {
          id: `delete-${userId}`,
          duration: 30000
        });

        const deletionReport = await deleteUser(userId);

        if (deletionReport.success) {
          // Remove user from local state
          setUsers(users.filter((user) => user.id !== userId));

          toast.success(
            `User deleted successfully. Removed ${Object.values(deletionReport.deletedRecords).reduce((sum, count) => sum + count, 0)} records.`,
            {
              id: `delete-${userId}`,
              duration: 6000
            }
          );

          console.log("User deletion report:", deletionReport);
        } else {
          toast.error(
            `User deletion failed: ${deletionReport.errors.join(", ")}`,
            {
              id: `delete-${userId}`,
              duration: 8000
            }
          );
        }
      } else {
        // Handle suspend/activate
        const status = action === "suspend" ? "suspended" : "active";
        await updateUserStatus(userId, status);

        setUsers(
          users.map((user) => (user.id === userId ? { ...user, status } : user)),
        );

        toast.success(`User ${action}d successfully`);
      }

      // Reload stats to reflect the change
      try {
        const newStats = await getAdminStats();
        setStats(newStats);
      } catch (error) {
        console.error("Failed to reload stats after user action:", error);
      }
    } catch (error) {
      console.error(`Error ${action}ing user:`, error);
      if (action === "delete") {
        const errorMessage = error instanceof Error ? error.message : String(error);
        toast.error(`Failed to delete user: ${errorMessage}`, { id: `delete-${userId}` });
      }
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
      <div className="flex items-center justify-center min-h-[600px]">
        <LoadingSpinner size="lg" text="Loading admin dashboard..." />
      </div>
    );
  }

  // Quick stats for the header
  const quickStats = [
    {
      label: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      change: `+${stats.newUsersThisWeek}`,
      changeLabel: "this week",
    },
    {
      label: "Active Listings",
      value: stats.activeListings,
      icon: BookOpen,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      change: null,
      changeLabel: "books available",
    },
    {
      label: "Monthly Revenue",
      value: `R${stats.monthlyCommission.toFixed(0)}`,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50",
      change: `+R${stats.weeklyCommission.toFixed(0)}`,
      changeLabel: "this week",
    },
    {
      label: "Pending Items",
      value: stats.pendingReports + stats.unreadMessages,
      icon: Bell,
      color: stats.pendingReports + stats.unreadMessages > 0 ? "text-amber-600" : "text-gray-600",
      bgColor: stats.pendingReports + stats.unreadMessages > 0 ? "bg-amber-50" : "bg-gray-50",
      change: null,
      changeLabel: "need attention",
    },
  ];

  // Tab configuration with improved organization
  const tabConfig = [
    {
      value: "overview",
      label: "Overview",
      icon: BarChart3,
      color: "text-blue-600",
      description: "Dashboard overview and key metrics",
    },
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
      color: "text-violet-600",
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
      value: "payout",
      label: "Payout",
      icon: Banknote,
      color: "text-green-600",
      description: "Seller payouts and recipients",
    },
    {
      value: "utilities",
      label: "Utilities",
      icon: Wrench,
      color: "text-orange-600",
      description: "Testing tools and database management",
    },
    {
      value: "email",
      label: "Email",
      icon: Mail,
      color: "text-blue-600",
      description: "Email system diagnostics and monitoring",
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Modern Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg">
                  <Activity className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Admin Dashboard
                  </h1>
                  <p className="text-sm text-gray-500">
                    Manage your platform
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Developer Tools */}
              <Button
                onClick={() => navigate("/developer")}
                variant="outline"
                size="sm"
                className="hidden sm:flex items-center space-x-2 bg-slate-900 text-white border-slate-900 hover:bg-slate-800"
              >
                <Terminal className="h-4 w-4" />
                <span>Developer Tools</span>
              </Button>

              {/* Notification Bell */}
              {(stats.pendingReports > 0 || stats.unreadMessages > 0) && (
                <div className="relative">
                  <Bell className="h-5 w-5 text-gray-600" />
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center text-xs text-white">
                    {stats.pendingReports + stats.unreadMessages}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="relative overflow-hidden border-0 shadow-sm bg-white hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600 mb-1">
                        {stat.label}
                      </p>
                      <p className={`text-2xl font-bold ${stat.color} mb-1`}>
                        {stat.value}
                      </p>
                      {stat.change && (
                        <div className="flex items-center space-x-1">
                          <span className="text-xs text-green-600 font-medium">
                            {stat.change}
                          </span>
                          <span className="text-xs text-gray-500">
                            {stat.changeLabel}
                          </span>
                        </div>
                      )}
                      {!stat.change && (
                        <span className="text-xs text-gray-500">
                          {stat.changeLabel}
                        </span>
                      )}
                    </div>
                    <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                      <Icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 sm:px-6 lg:px-8 pb-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Navigation Tabs */}
          {isMobile ? (
            // Mobile: Horizontal scrollable tabs
            <div className="w-full overflow-x-auto scrollbar-hide">
              <TabsList className="inline-flex w-max min-w-full h-auto p-1 bg-white rounded-lg shadow-sm border border-gray-200">
                {tabConfig.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="flex flex-col items-center justify-center px-3 py-3 min-w-[80px] data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all duration-200 rounded-md mx-0.5"
                    >
                      <div className="relative mb-1">
                        <Icon className="h-4 w-4" />
                        {tab.badge && tab.badge > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1 min-w-[14px] h-3.5 flex items-center justify-center text-[10px]">
                            {tab.badge > 99 ? "99+" : tab.badge}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-medium truncate max-w-[70px] leading-tight">
                        {tab.label}
                      </span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>
          ) : (
            // Desktop: Grid layout with sections
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <TabsList className="grid grid-cols-3 lg:grid-cols-5 gap-3 h-auto p-0 bg-transparent">
                {tabConfig.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.value;

                  return (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className={`flex flex-col items-center justify-center p-4 h-auto rounded-lg border transition-all duration-200 ${
                        isActive
                          ? "bg-blue-600 text-white shadow-lg border-blue-600 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                          : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                      }`}
                    >
                      <div className="relative mb-3">
                        <Icon className={`h-6 w-6 ${isActive ? "text-white" : tab.color}`} />
                        {tab.badge && tab.badge > 0 && (
                          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] h-4 flex items-center justify-center">
                            {tab.badge > 99 ? "99+" : tab.badge}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-medium mb-1 text-center">
                        {tab.label}
                      </span>
                      <span className={`text-xs text-center leading-tight ${
                        isActive ? "text-blue-100" : "text-gray-500"
                      }`}>
                        {tab.description}
                      </span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>
          )}

          {/* Tab Content */}
          <div className="space-y-6">
            <TabsContent value="overview" className="mt-0 space-y-6">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <AdminStats stats={stats} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="earnings" className="mt-0 space-y-6">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-0">
                  <AdminEarningsTab stats={stats} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users" className="mt-0 space-y-6">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-0">
                  <AdminUsersTab users={users} onUserAction={handleUserAction} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="listings" className="mt-0 space-y-6">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-0">
                  <AdminListingsTab
                    listings={listings}
                    onListingAction={handleListingAction}
                  />
                </CardContent>
              </Card>
            </TabsContent>





            <TabsContent value="programs" className="mt-0 space-y-6">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <AdminProgramsTab />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="resources" className="mt-0 space-y-6">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <AdminResourcesTab />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="contact" className="mt-0 space-y-6">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-0">
                  <AdminContactTab />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payout" className="mt-0 space-y-6">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-0">
                  <AdminPayoutTab />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="utilities" className="mt-0 space-y-6">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <AdminUtilitiesTab />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="email" className="mt-0 space-y-6">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <MailQueueFix />
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <EmailDiagnosticsDashboard />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="mt-0 space-y-6">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-0">
                  <AdminSettingsTab
                    broadcastMessage={broadcastMessage}
                    setBroadcastMessage={setBroadcastMessage}
                    onSendBroadcast={handleSendBroadcast}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;

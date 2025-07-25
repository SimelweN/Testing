import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityService, Activity } from "@/services/activityService";
import { useCommit } from "@/hooks/useCommit";
import {
  ArrowLeft,
  Check,
  Clock,
  ShoppingCart,
  Star,
  BookIcon,
  HeartIcon,
  User,
  Search,
  Eye,
  Edit,
  Trash2,
  LogIn,
  AlertCircle,
  RefreshCw,
  Package,
  TrendingUp,
  X,
  Bell,
} from "lucide-react";
import OrderManagementView from "@/components/orders/OrderManagementView";
import OrderNotificationSystem from "@/components/notifications/OrderNotificationSystem";
import EnhancedOrderCommitButton from "@/components/orders/EnhancedOrderCommitButton";
import { clearAllTestData, clearAllUserData } from "@/utils/clearTestData";

const ActivityLog = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const {
    commitBook,
    declineBook,
    pendingCommits,
    refreshPendingCommits,
    isCommitting,
    isDeclining,
  } = useCommit();
  const [activeTab, setActiveTab] = useState("orders");
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadActivities = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      setActivities([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log("Loading activities for user:", user.id);
      const userActivities = await ActivityService.getUserActivities(
        user.id,
        100,
      );

      console.log("Loaded activities:", userActivities.length);
      setActivities(userActivities);

      if (userActivities.length === 0) {
        console.log("No activities found, but this is expected for new users");
      }
    } catch (error) {
      console.error("Error loading activities:", error);
      setError("Failed to load activities. Please try again.");
      // Don't clear activities on error - keep any existing data
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const handleDebugTestData = async () => {
    console.log("🔍 Starting test data debug...");
    await debugTestData();
    const count = await countTestData();
    alert(`Found ${count} test data items. Check console for details.`);
  };

  const handleClearTestData = async () => {
    // First show what we'll delete
    const count = await countTestData();

    const confirmClear = window.confirm(
      `This will permanently delete ${count} test/demo data items including 'Unknown Book' orders. Are you sure?`
    );

    if (!confirmClear) return;

    const success = await clearAllTestData();
    if (success) {
      // Reload activities after clearing
      await loadActivities();
      // Also refresh pending commits
      refreshPendingCommits().catch(console.error);
    }
  };

  const handleClearAllUserData = async () => {
    if (!user) return;

    const confirmClear = window.confirm(
      "⚠️ WARNING: This will permanently delete ALL your orders and notifications. This cannot be undone. Are you absolutely sure?"
    );

    if (!confirmClear) return;

    const doubleConfirm = window.confirm(
      "This is your final warning. All your data will be permanently deleted. Continue?"
    );

    if (!doubleConfirm) return;

    const success = await clearAllUserData(user.id);
    if (success) {
      // Reload activities after clearing
      await loadActivities();
      // Also refresh pending commits
      refreshPendingCommits().catch(console.error);
    }
  };

  useEffect(() => {
    loadActivities();
  }, [user, loadActivities]);

  useEffect(() => {
    if (user) {
      // Safely attempt to refresh pending commits
      refreshPendingCommits().catch((error) => {
        console.warn("Could not load pending commits:", error);
        // Silently fail to prevent UI crashes
      });
    }
  }, [user, refreshPendingCommits]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "purchase":
        return <ShoppingCart className="h-5 w-5 text-blue-500" />;
      case "sale":
        return <Check className="h-5 w-5 text-green-500" />;
      case "wishlist_added":
      case "wishlist_removed":
        return <HeartIcon className="h-5 w-5 text-red-500" />;
      case "rating_given":
      case "rating_received":
        return <Star className="h-5 w-5 text-yellow-500" />;
      case "listing_created":
      case "listing_updated":
      case "listing_deleted":
        return <BookIcon className="h-5 w-5 text-purple-500" />;
      case "book_viewed":
        return <Eye className="h-5 w-5 text-gray-500" />;
      case "search":
        return <Search className="h-5 w-5 text-blue-400" />;
      case "profile_updated":
        return <User className="h-5 w-5 text-indigo-500" />;
      case "login":
        return <LogIn className="h-5 w-5 text-green-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (activity: Activity) => {
    switch (activity.type) {
      case "purchase":
      case "sale":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            Completed
          </Badge>
        );
      case "listing_created":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            Active
          </Badge>
        );
      case "listing_deleted":
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
            Removed
          </Badge>
        );
      case "wishlist_added":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            Watching
          </Badge>
        );
      case "login":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            Session
          </Badge>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 1) {
      return "Just now";
    } else if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes > 1 ? "s" : ""} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    } else {
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  const getActivityTypeLabel = (type: string) => {
    switch (type) {
      case "purchase":
        return "Purchases";
      case "sale":
        return "Sales";
      case "listing_created":
        return "Listings";
      case "listing_updated":
        return "Listings";
      case "listing_deleted":
        return "Listings";
      case "wishlist_added":
        return "Wishlist";
      case "wishlist_removed":
        return "Wishlist";
      case "rating_given":
        return "Ratings";
      case "rating_received":
        return "Ratings";
      case "book_viewed":
        return "Views";
      case "search":
        return "Searches";
      case "profile_updated":
        return "Profile";
      case "login":
        return "Sessions";
      default:
        return "Other";
    }
  };

  const filteredActivities =
    activeTab === "all"
      ? activities
      : activities.filter((activity) => {
          switch (activeTab) {
            case "purchases":
              return activity.type === "purchase";
            case "sales":
              return activity.type === "sale";
            case "listings":
              return [
                "listing_created",
                "listing_updated",
                "listing_deleted",
              ].includes(activity.type);
            case "social":
              return [
                "rating_given",
                "rating_received",
                "wishlist_added",
                "wishlist_removed",
              ].includes(activity.type);
            default:
              return true;
          }
        });

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-gray-600">
              Please log in to view your activity history.
            </p>
            <Button onClick={() => navigate("/login")} className="mt-4">
              Log In
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 text-book-600"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>

        <div className="bg-white rounded-xl shadow-xl p-6 md:p-8 border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Activity Center
              </h1>
              <p className="text-gray-600 mt-1">
                Track your commitments, sales, and marketplace activity
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDebugTestData}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Debug Data
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearTestData}
                className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Test Data
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAllUserData}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="h-4 w-4 mr-2" />
                Clear All Data
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={loadActivities}
                disabled={isLoading}
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Refresh
              </Button>
            </div>
          </div>

          {error && (
            <Alert className="mb-6 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <Tabs
            defaultValue="orders"
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <TabsList className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-8 mb-8 h-auto overflow-x-auto bg-gradient-to-r from-blue-50 to-purple-50">
              <TabsTrigger
                value="orders"
                className="min-w-0 px-2 py-2 text-xs sm:text-sm"
              >
                <Package className="h-3 w-3 mr-1" />
                Orders
              </TabsTrigger>
              <TabsTrigger
                value="notifications"
                className="min-w-0 px-2 py-2 text-xs sm:text-sm"
              >
                <Bell className="h-3 w-3 mr-1" />
                Notifications
              </TabsTrigger>
              <TabsTrigger
                value="commits"
                className="min-w-0 px-2 py-2 text-xs sm:text-sm"
              >
                <Package className="h-3 w-3 mr-1" />
                Commits
              </TabsTrigger>
              <TabsTrigger
                value="all"
                className="min-w-0 px-2 py-2 text-xs sm:text-sm"
              >
                All
              </TabsTrigger>
              <TabsTrigger
                value="purchases"
                className="min-w-0 px-2 py-2 text-xs sm:text-sm"
              >
                Purchases
              </TabsTrigger>
              <TabsTrigger
                value="sales"
                className="min-w-0 px-2 py-2 text-xs sm:text-sm"
              >
                Sales
              </TabsTrigger>
              <TabsTrigger
                value="listings"
                className="min-w-0 px-2 py-2 text-xs sm:text-sm"
              >
                Listings
              </TabsTrigger>
              <TabsTrigger
                value="social"
                className="min-w-0 px-2 py-2 text-xs sm:text-sm"
              >
                Social
              </TabsTrigger>
            </TabsList>

            {/* Orders Tab - New Enhanced Order Management */}
            <TabsContent value="orders">
              <OrderManagementView />
            </TabsContent>

            {/* Notifications Tab - New Notification System */}
            <TabsContent value="notifications">
              <OrderNotificationSystem />
            </TabsContent>

            {/* Commits Tab - Enhanced */}
            <TabsContent value="commits">
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                    <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                    <CardContent className="p-4 text-center">
                      <Package className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-orange-900">
                        {pendingCommits.length}
                      </div>
                      <div className="text-sm text-orange-700">Pending</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Pending Commits */}
                {pendingCommits.length > 0 ? (
                  <div className="space-y-4">
                    <Alert className="border-orange-200 bg-gradient-to-r from-orange-50 to-red-50">
                      <Clock className="h-4 w-4 text-orange-600" />
                      <AlertDescription className="text-orange-800">
                        <strong>⚡ Urgent Action Required:</strong> You have{" "}
                        {pendingCommits.length} sale(s) that require your
                        commitment within 48 hours. Failing to commit may affect
                        your seller rating.
                      </AlertDescription>
                    </Alert>

                    {pendingCommits.map((commit) => {
                      const timeRemaining = Math.max(
                        0,
                        Math.floor(
                          (new Date(commit.expiresAt).getTime() -
                            new Date().getTime()) /
                            (1000 * 60 * 60),
                        ),
                      );
                      const isUrgent = timeRemaining < 12;

                      return (
                        <Card
                          key={commit.id}
                          className={`border-2 shadow-lg transition-all hover:shadow-xl ${
                            isUrgent
                              ? "border-red-300 bg-gradient-to-r from-red-50 to-orange-50"
                              : "border-orange-300 bg-gradient-to-r from-orange-50 to-yellow-50"
                          }`}
                        >
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                              <div className="flex-grow">
                                <div className="flex items-center gap-2 mb-3">
                                  <h3 className="font-bold text-xl text-gray-800">
                                    {commit.bookTitle}
                                  </h3>
                                  {isUrgent && (
                                    <Badge className="bg-red-500 text-white animate-pulse">
                                      URGENT
                                    </Badge>
                                  )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                  <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-blue-600" />
                                    <span className="text-sm font-medium">
                                      Buyer:
                                    </span>
                                    <span className="text-sm text-gray-700">
                                      {commit.buyerName}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <ShoppingCart className="h-4 w-4 text-green-600" />
                                    <span className="text-sm font-medium">
                                      Price:
                                    </span>
                                    <span className="text-sm font-bold text-green-700">
                                      R{commit.price}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 p-3 rounded-lg bg-white/60">
                                  <Clock
                                    className={`h-5 w-5 ${isUrgent ? "text-red-500" : "text-orange-500"}`}
                                  />
                                  <span
                                    className={`font-bold ${isUrgent ? "text-red-600" : "text-orange-600"}`}
                                  >
                                    {timeRemaining} hours remaining
                                  </span>
                                  <Badge variant="outline" className="ml-2">
                                    {timeRemaining < 6
                                      ? "⚠️ Critical"
                                      : timeRemaining < 12
                                        ? "🔥 Urgent"
                                        : "⏰ Pending"}
                                  </Badge>
                                </div>
                              </div>

                              <div className="ml-6 flex flex-col gap-3">
                                <EnhancedOrderCommitButton
                                  orderId={commit.id}
                                  sellerId={user?.id || ""}
                                  bookTitle={commit.bookTitle}
                                  buyerName={commit.buyerName}
                                  onCommitSuccess={() => {
                                    // Refresh pending commits after successful commit
                                    refreshPendingCommits().catch(console.error);
                                    // Scroll to top
                                    setTimeout(() => {
                                      window.scrollTo({
                                        top: 0,
                                        behavior: "smooth",
                                      });
                                    }, 500);
                                  }}
                                  disabled={isCommitting || isDeclining}
                                  className="px-8 py-3 text-lg shadow-lg hover:shadow-xl transition-all"
                                />
                                <Button
                                  onClick={async (e) => {
                                    e.preventDefault();
                                    try {
                                      await declineBook(commit.bookId);
                                      // Scroll to top after successful decline
                                      setTimeout(() => {
                                        window.scrollTo({
                                          top: 0,
                                          behavior: "smooth",
                                        });
                                      }, 500);
                                    } catch (error) {
                                      // Error is already handled in declineBook
                                    }
                                  }}
                                  disabled={isCommitting || isDeclining}
                                  variant="destructive"
                                  size="lg"
                                  className="text-white font-bold px-8 py-3 text-lg shadow-lg hover:shadow-xl transition-all"
                                >
                                  {isDeclining ? (
                                    <>
                                      <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                                      Processing...
                                    </>
                                  ) : (
                                    <>
                                      <X className="h-5 w-5 mr-2" />
                                      Decline Sale
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
                    <CardContent className="text-center py-12">
                      <div className="relative">
                        <Check className="h-16 w-16 text-green-400 mx-auto mb-4" />
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      </div>
                      <h3 className="text-xl font-semibold text-green-800 mb-2">
                        ✅ All Clear!
                      </h3>
                      <p className="text-green-600 mb-4">
                        You don't have any pending commitments right now.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto mt-6">
                        <div className="p-4 bg-white/60 rounded-lg">
                          <BookIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                          <h4 className="font-medium text-gray-800">
                            List More Books
                          </h4>
                          <p className="text-gray-600 text-sm">
                            Add more textbooks to sell
                          </p>
                        </div>
                        <div className="p-4 bg-white/60 rounded-lg">
                          <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                          <h4 className="font-medium text-gray-800">
                            Boost Visibility
                          </h4>
                          <p className="text-gray-600 text-sm">
                            Optimize your listings
                          </p>
                        </div>
                        <div className="p-4 bg-white/60 rounded-lg">
                          <Star className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                          <h4 className="font-medium text-gray-800">
                            Build Reputation
                          </h4>
                          <p className="text-gray-600 text-sm">
                            Earn positive reviews
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Commit System Info */}
                <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-800">
                      <AlertCircle className="h-5 w-5" />
                      How the 48-Hour Commit System Works
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-blue-800 mb-2">
                          🎯 For Buyers:
                        </h4>
                        <ul className="space-y-1 text-blue-700 text-sm">
                          <li>• Payment securely held in escrow</li>
                          <li>• Seller has exactly 48 hours to commit</li>
                          <li>
                            • <strong>Automatic full refund</strong> if seller
                            doesn't commit
                          </li>
                          <li>• Refund processed immediately after 48 hours</li>
                          <li>• Order confirmed once seller commits</li>
                          <li>• No penalties or fees for failed commits</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-blue-800 mb-2">
                          📚 For Sellers:
                        </h4>
                        <ul className="space-y-1 text-blue-700 text-sm">
                          <li>
                            • <strong>Must commit within 48 hours</strong> or
                            buyer gets full refund
                          </li>
                          <li>• Verify book availability before committing</li>
                          <li>• Can decline sale if book not available</li>
                          <li>• Missed commits affect seller reputation</li>
                          <li>
                            • Payment released after delivery confirmation
                          </li>
                          <li>• Automatic refund system protects buyers</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Other Tabs */}
            <TabsContent value={activeTab === "commits" ? "all" : activeTab}>
              {isLoading ? (
                <div className="flex justify-center items-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-book-600"></div>
                </div>
              ) : filteredActivities.length > 0 ? (
                <div className="space-y-4">
                  {filteredActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start">
                        <div className="bg-white p-2 rounded-full shadow-sm mr-4">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-grow">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium text-gray-800">
                                {activity.title}
                              </h3>
                              <p className="text-sm text-gray-600 mt-1">
                                {activity.description}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-500">
                                {formatDate(activity.created_at)}
                              </div>
                              <div className="text-xs text-gray-400 mt-1">
                                {getActivityTypeLabel(activity.type)}
                              </div>
                            </div>
                          </div>

                          {/* Activity metadata */}
                          {activity.metadata &&
                            Object.keys(activity.metadata).length > 0 && (
                              <div className="mt-2 text-xs text-gray-500">
                                {activity.metadata.price && (
                                  <span className="inline-block mr-3">
                                    Amount: R{activity.metadata.price}
                                  </span>
                                )}
                                {activity.metadata.rating && (
                                  <div className="flex items-center mt-1">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`h-3 w-3 ${i < activity.metadata!.rating! ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`}
                                      />
                                    ))}
                                  </div>
                                )}
                                {activity.metadata.search_query && (
                                  <span className="inline-block">
                                    Query: "{activity.metadata.search_query}"
                                  </span>
                                )}
                              </div>
                            )}

                          <div className="mt-2 flex justify-between items-center">
                            {getStatusBadge(activity)}

                            {activity.metadata?.book_id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-book-600 hover:text-book-800"
                                onClick={() =>
                                  navigate(
                                    `/books/${activity.metadata!.book_id}`,
                                  )
                                }
                              >
                                View Book
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">
                    No {activeTab === "all" ? "activities" : activeTab} found.
                  </p>
                  <p className="text-sm text-gray-400">
                    Start using ReBooked Solutions to see your activity here!
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default ActivityLog;

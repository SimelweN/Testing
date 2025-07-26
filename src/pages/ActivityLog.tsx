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
  LogIn,
  AlertCircle,
  RefreshCw,
  Package,
  TrendingUp,
  X,
  Bell,
  Plus,
  Filter,
  Calendar,
  Activity as ActivityIcon,
} from "lucide-react";
import OrderManagementView from "@/components/orders/OrderManagementView";
import OrderNotificationSystem from "@/components/notifications/OrderNotificationSystem";
import EnhancedOrderCommitButton from "@/components/orders/EnhancedOrderCommitButton";

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
  const [activeTab, setActiveTab] = useState("overview");
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
      const userActivities = await ActivityService.getUserActivities(
        user.id,
        50,
      );
      setActivities(userActivities);
    } catch (error) {
      console.error("Error loading activities:", error);
      setError("Failed to load activities. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadActivities();
  }, [user, loadActivities]);

  useEffect(() => {
    if (user) {
      refreshPendingCommits().catch((error) => {
        console.warn("Could not load pending commits:", error);
      });
    }
  }, [user, refreshPendingCommits]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "purchase":
        return <ShoppingCart className="h-4 w-4 text-emerald-600" />;
      case "sale":
        return <Check className="h-4 w-4 text-green-600" />;
      case "wishlist_added":
      case "wishlist_removed":
        return <HeartIcon className="h-4 w-4 text-rose-500" />;
      case "rating_given":
      case "rating_received":
        return <Star className="h-4 w-4 text-amber-500" />;
      case "listing_created":
      case "listing_updated":
      case "listing_deleted":
        return <BookIcon className="h-4 w-4 text-blue-600" />;
      case "book_viewed":
        return <Eye className="h-4 w-4 text-slate-500" />;
      case "search":
        return <Search className="h-4 w-4 text-indigo-500" />;
      case "profile_updated":
        return <User className="h-4 w-4 text-purple-500" />;
      case "login":
        return <LogIn className="h-4 w-4 text-teal-600" />;
      default:
        return <ActivityIcon className="h-4 w-4 text-slate-500" />;
    }
  };

  const getStatusBadge = (activity: Activity) => {
    switch (activity.type) {
      case "purchase":
      case "sale":
        return (
          <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200">
            Completed
          </Badge>
        );
      case "listing_created":
        return (
          <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
            Active
          </Badge>
        );
      case "listing_deleted":
        return (
          <Badge variant="secondary" className="bg-slate-50 text-slate-700 border-slate-200">
            Removed
          </Badge>
        );
      case "wishlist_added":
        return (
          <Badge variant="secondary" className="bg-rose-50 text-rose-700 border-rose-200">
            Saved
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
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) {
      return "Just now";
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      });
    }
  };

  const getActivitySummary = () => {
    const summary = {
      total: activities.length,
      purchases: activities.filter(a => a.type === "purchase").length,
      sales: activities.filter(a => a.type === "sale").length,
      listings: activities.filter(a => a.type === "listing_created").length,
      pending: pendingCommits.length,
    };
    return summary;
  };

  const filteredActivities = activeTab === "overview" ? activities.slice(0, 10) :
    activeTab === "all" ? activities :
    activities.filter((activity) => {
      switch (activeTab) {
        case "purchases":
          return activity.type === "purchase";
        case "sales":
          return activity.type === "sale";
        case "listings":
          return ["listing_created", "listing_updated", "listing_deleted"].includes(activity.type);
        case "social":
          return ["rating_given", "rating_received", "wishlist_added", "wishlist_removed"].includes(activity.type);
        default:
          return true;
      }
    });

  if (!user) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
          <Card className="w-full max-w-md">
            <CardContent className="text-center p-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ActivityIcon className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-slate-800 mb-2">Sign in to continue</h2>
              <p className="text-slate-600 mb-6">
                Access your activity center to track orders, commitments, and marketplace activity.
              </p>
              <Button onClick={() => navigate("/login")} className="w-full">
                Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const summary = getActivitySummary();

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="mb-4 text-slate-600 hover:text-slate-800"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Activity Center
                </h1>
                <p className="text-slate-600 mt-1">
                  Monitor your marketplace activity and commitments
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadActivities}
                  disabled={isLoading}
                  className="border-slate-200"
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
          </div>

          {error && (
            <Alert className="mb-6 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 mb-8 bg-white/60 backdrop-blur-sm">
              <TabsTrigger value="overview" className="text-xs sm:text-sm">
                <TrendingUp className="h-4 w-4 mr-1" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="orders" className="text-xs sm:text-sm">
                <Package className="h-4 w-4 mr-1" />
                Orders
              </TabsTrigger>
              <TabsTrigger value="commits" className="text-xs sm:text-sm">
                <Clock className="h-4 w-4 mr-1" />
                Commits
              </TabsTrigger>
              <TabsTrigger value="notifications" className="text-xs sm:text-sm">
                <Bell className="h-4 w-4 mr-1" />
                Alerts
              </TabsTrigger>
              <TabsTrigger value="purchases" className="text-xs sm:text-sm">
                <ShoppingCart className="h-4 w-4 mr-1" />
                Purchases
              </TabsTrigger>
              <TabsTrigger value="all" className="text-xs sm:text-sm">
                <ActivityIcon className="h-4 w-4 mr-1" />
                All
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-700 text-sm font-medium">Total Activity</p>
                        <p className="text-2xl font-bold text-blue-900">{summary.total}</p>
                      </div>
                      <ActivityIcon className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-emerald-700 text-sm font-medium">Purchases</p>
                        <p className="text-2xl font-bold text-emerald-900">{summary.purchases}</p>
                      </div>
                      <ShoppingCart className="h-8 w-8 text-emerald-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-700 text-sm font-medium">Listings</p>
                        <p className="text-2xl font-bold text-purple-900">{summary.listings}</p>
                      </div>
                      <BookIcon className="h-8 w-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-amber-700 text-sm font-medium">Pending</p>
                        <p className="text-2xl font-bold text-amber-900">{summary.pending}</p>
                      </div>
                      <Clock className="h-8 w-8 text-amber-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {pendingCommits.length > 0 && (
                <Alert className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800">
                    <span className="font-semibold">Action Required:</span> You have {pendingCommits.length} pending commitment{pendingCommits.length > 1 ? 's' : ''} that require attention.
                  </AlertDescription>
                </Alert>
              )}

              <Card className="bg-white/60 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-slate-800">Recent Activity</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveTab("all")}
                      className="text-slate-600"
                    >
                      View All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
                    </div>
                  ) : filteredActivities.length > 0 ? (
                    <div className="space-y-3">
                      {filteredActivities.map((activity) => (
                        <div
                          key={activity.id}
                          className="flex items-center gap-3 p-3 rounded-lg bg-white/60 hover:bg-white/80 transition-colors border border-slate-100"
                        >
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                              {getActivityIcon(activity.type)}
                            </div>
                          </div>
                          <div className="flex-grow min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">
                              {activity.title}
                            </p>
                            <p className="text-xs text-slate-600 truncate">
                              {activity.description}
                            </p>
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <p className="text-xs text-slate-500">
                              {formatDate(activity.created_at)}
                            </p>
                            {getStatusBadge(activity)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Activity className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-slate-500 text-sm">No recent activity</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="orders">
              <Card className="bg-white/60 backdrop-blur-sm">
                <OrderManagementView />
              </Card>
            </TabsContent>

            <TabsContent value="notifications">
              <Card className="bg-white/60 backdrop-blur-sm">
                <OrderNotificationSystem />
              </Card>
            </TabsContent>

            <TabsContent value="commits" className="space-y-6">
              {pendingCommits.length > 0 ? (
                <div className="space-y-4">
                  <Alert className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
                    <Clock className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800">
                      <span className="font-semibold">Urgent:</span> You have {pendingCommits.length} sale{pendingCommits.length > 1 ? 's' : ''} requiring commitment within 48 hours.
                    </AlertDescription>
                  </Alert>

                  {pendingCommits.map((commit) => {
                    const timeRemaining = Math.max(
                      0,
                      Math.floor(
                        (new Date(commit.expiresAt).getTime() - new Date().getTime()) /
                        (1000 * 60 * 60),
                      ),
                    );
                    const isUrgent = timeRemaining < 12;

                    return (
                      <Card
                        key={commit.id}
                        className={`transition-all hover:shadow-lg ${
                          isUrgent
                            ? "border-red-200 bg-gradient-to-r from-red-50 to-amber-50"
                            : "border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50"
                        }`}
                      >
                        <CardContent className="p-6">
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div className="flex-grow">
                              <div className="flex items-center gap-2 mb-3">
                                <h3 className="font-semibold text-lg text-slate-800">
                                  {commit.bookTitle}
                                </h3>
                                {isUrgent && (
                                  <Badge className="bg-red-500 text-white animate-pulse">
                                    URGENT
                                  </Badge>
                                )}
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-slate-600" />
                                  <span className="text-sm text-slate-600">
                                    Buyer: <span className="font-medium">{commit.buyerName}</span>
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <ShoppingCart className="h-4 w-4 text-emerald-600" />
                                  <span className="text-sm text-slate-600">
                                    Price: <span className="font-bold text-emerald-700">R{commit.price}</span>
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 p-3 rounded-lg bg-white/60">
                                <Clock className={`h-4 w-4 ${isUrgent ? "text-red-500" : "text-amber-500"}`} />
                                <span className={`font-medium text-sm ${isUrgent ? "text-red-600" : "text-amber-600"}`}>
                                  {timeRemaining} hours remaining
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-row lg:flex-col gap-2 lg:ml-6">
                              <EnhancedOrderCommitButton
                                orderId={commit.id}
                                sellerId={user?.id || ""}
                                bookTitle={commit.bookTitle}
                                buyerName={commit.buyerName}
                                onCommitSuccess={() => {
                                  refreshPendingCommits().catch(console.error);
                                }}
                                disabled={isCommitting || isDeclining}
                                className="flex-1 lg:flex-none"
                              />
                              <Button
                                onClick={async (e) => {
                                  e.preventDefault();
                                  try {
                                    await declineBook(commit.bookId);
                                  } catch (error) {
                                    console.error("Decline error:", error);
                                  }
                                }}
                                disabled={isCommitting || isDeclining}
                                variant="destructive"
                                className="flex-1 lg:flex-none"
                              >
                                {isDeclining ? (
                                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <X className="h-4 w-4 mr-2" />
                                )}
                                Decline
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200">
                  <CardContent className="text-center py-12">
                    <Check className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-emerald-800 mb-2">
                      All caught up!
                    </h3>
                    <p className="text-emerald-600 mb-6">
                      No pending commitments at the moment.
                    </p>
                    <Button
                      onClick={() => navigate("/sell")}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      List a Book
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value={activeTab === "commits" ? "all" : activeTab}>
              <Card className="bg-white/60 backdrop-blur-sm">
                <CardContent className="p-6">
                  {isLoading ? (
                    <div className="flex justify-center py-12">
                      <RefreshCw className="h-8 w-8 animate-spin text-slate-400" />
                    </div>
                  ) : filteredActivities.length > 0 ? (
                    <div className="space-y-4">
                      {filteredActivities.map((activity) => (
                        <div
                          key={activity.id}
                          className="flex items-start gap-4 p-4 rounded-lg bg-white/60 hover:bg-white/80 transition-colors border border-slate-100"
                        >
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                              {getActivityIcon(activity.type)}
                            </div>
                          </div>
                          <div className="flex-grow min-w-0">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-medium text-slate-800">{activity.title}</h3>
                              <div className="text-right flex-shrink-0 ml-4">
                                <div className="text-sm text-slate-500">
                                  {formatDate(activity.created_at)}
                                </div>
                                {getStatusBadge(activity)}
                              </div>
                            </div>
                            <p className="text-sm text-slate-600 mb-2">{activity.description}</p>
                            
                            {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                              <div className="flex items-center gap-4 text-xs text-slate-500">
                                {activity.metadata.price && (
                                  <span>Amount: R{activity.metadata.price}</span>
                                )}
                                {activity.metadata.rating && (
                                  <div className="flex items-center gap-1">
                                    <span>Rating:</span>
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`h-3 w-3 ${i < activity.metadata!.rating! ? "text-amber-400 fill-amber-400" : "text-slate-300"}`}
                                      />
                                    ))}
                                  </div>
                                )}
                                {activity.metadata.search_query && (
                                  <span>Query: "{activity.metadata.search_query}"</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Activity className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-slate-600 mb-2">
                        No {activeTab === "all" ? "activities" : activeTab} yet
                      </h3>
                      <p className="text-slate-500 text-sm mb-6">
                        Start using ReBooked Solutions to build your activity history!
                      </p>
                      <Button
                        onClick={() => navigate("/books")}
                        variant="outline"
                        className="border-slate-200"
                      >
                        Browse Books
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default ActivityLog;

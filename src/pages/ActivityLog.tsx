import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
} from "lucide-react";

const ActivityLog = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { commitBook, pendingCommits, refreshPendingCommits, isCommitting } =
    useCommit();
  const [activeTab, setActiveTab] = useState("all");
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

        <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">
              Activity History
            </h1>
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

          {error && (
            <Alert className="mb-6 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <Tabs
            defaultValue="all"
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <TabsList className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 mb-8 h-auto overflow-x-auto">
              <TabsTrigger
                value="all"
                className="min-w-0 px-2 py-2 text-xs sm:text-sm"
              >
                All
              </TabsTrigger>
              <TabsTrigger
                value="commits"
                className="min-w-0 px-2 py-2 text-xs sm:text-sm"
              >
                <Package className="h-3 w-3 mr-1" />
                Commits
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

            {/* Commits Tab */}
            <TabsContent value="commits">
              {pendingCommits.length > 0 ? (
                <div className="space-y-4">
                  <Alert className="border-orange-200 bg-orange-50">
                    <Clock className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-800">
                      <strong>Pending Commits:</strong> You have{" "}
                      {pendingCommits.length} sale(s) that require your
                      commitment within 48 hours.
                    </AlertDescription>
                  </Alert>

                  {pendingCommits.map((commit) => (
                    <div
                      key={commit.id}
                      className="bg-white rounded-lg p-4 border border-orange-200 shadow-sm"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-grow">
                          <h3 className="font-medium text-gray-800 mb-2">
                            {commit.bookTitle}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            Buyer: {commit.buyerName} • Price: R{commit.price}
                          </p>
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-orange-500" />
                            <span className="text-orange-600 font-medium">
                              {Math.max(
                                0,
                                Math.floor(
                                  (new Date(commit.expiresAt).getTime() -
                                    new Date().getTime()) /
                                    (1000 * 60 * 60),
                                ),
                              )}{" "}
                              hours remaining
                            </span>
                          </div>
                        </div>

                        <Button
                          onClick={() => commitBook(commit.bookId)}
                          disabled={isCommitting}
                          className="bg-book-600 hover:bg-book-700"
                        >
                          {isCommitting ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Committing...
                            </>
                          ) : (
                            <>
                              <Check className="h-4 w-4 mr-2" />
                              Commit Sale
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">
                    No Pending Commits
                  </h3>
                  <p className="text-gray-500">
                    You don't have any sales waiting for commitment.
                  </p>
                </div>
              )}
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

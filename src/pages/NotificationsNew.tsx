import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Bell,
  Gift,
  Package,
  ShoppingCart,
  Star,
  Truck,
  Heart,
  Check,
  Settings,
  BookOpen,
  Users,
  TrendingUp,
  Award,
  MessageCircle,
  Clock,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import { getActiveBroadcasts } from "@/services/broadcastService";
import { toast } from "sonner";

interface NotificationCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  notifications: NotificationItem[];
  enabled: boolean;
}

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: "high" | "medium" | "low";
  actionUrl?: string;
  metadata?: Record<string, any>;
}

const NotificationsNew = () => {
  const { user, profile } = useAuth();
  const {
    notifications,
    unreadCount,
    totalCount,
    isLoading,
    refreshNotifications,
  } = useNotifications();
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [broadcasts, setBroadcasts] = useState([]);
  const [notificationSettings, setNotificationSettings] = useState({
    commits: true,
    purchases: true,
    deliveries: true,
  });

  // Convert database notifications to our category format
  const categorizeNotifications = (dbNotifications: any[]) => {
    const commitNotifications = dbNotifications.filter(
      (n) =>
        n.type === "commit" ||
        n.title?.toLowerCase().includes("commit") ||
        n.message?.toLowerCase().includes("commit"),
    );

    const purchaseNotifications = dbNotifications.filter(
      (n) =>
        n.type === "purchase" ||
        n.type === "order" ||
        n.title?.toLowerCase().includes("purchase") ||
        n.title?.toLowerCase().includes("order"),
    );

    const deliveryNotifications = dbNotifications.filter(
      (n) =>
        n.type === "delivery" ||
        n.type === "shipping" ||
        n.title?.toLowerCase().includes("delivery") ||
        n.title?.toLowerCase().includes("shipping"),
    );

    return {
      commits: commitNotifications,
      purchases: purchaseNotifications,
      deliveries: deliveryNotifications,
    };
  };

  const categorizedNotifications = categorizeNotifications(notifications);

  const [categories, setCategories] = useState<NotificationCategory[]>([
    {
      id: "welcome",
      title: "Welcome to ReBooked Solutions!",
      description: "Get started with buying and selling textbooks",
      icon: <Gift className="h-5 w-5" />,
      color: "purple",
      enabled: true,
      notifications: [
        {
          id: "welcome-1",
          type: "welcome",
          title: "Welcome to ReBooked Solutions! 🎉",
          message:
            "We're South Africa's premier textbook marketplace, connecting students across universities. Buy and sell textbooks easily, track your orders, and join a community of learners!",
          timestamp: new Date().toISOString(),
          read: false,
          priority: "high",
        },
        {
          id: "welcome-2",
          type: "info",
          title: "How ReBooked Works",
          message:
            "📚 Browse thousands of textbooks → 💰 Buy at student-friendly prices → 🚚 Get delivery nationwide → ✅ Sell your old books when done!",
          timestamp: new Date().toISOString(),
          read: false,
          priority: "medium",
        },
        {
          id: "welcome-3",
          type: "tip",
          title: "Quick Start Guide",
          message:
            "🔹 Complete your profile setup\\n🔹 Add your addresses for delivery\\n🔹 Set up banking for selling\\n🔹 Start browsing or list your first book!",
          timestamp: new Date().toISOString(),
          read: false,
          priority: "medium",
        },
      ],
    },
    {
      id: "commits",
      title: "Sale Commitments",
      description: "48-hour commitment system for sellers",
      icon: <Award className="h-5 w-5" />,
      color: "orange",
      enabled: notificationSettings.commits,
      notifications: categorizedNotifications.commits.map((n) => ({
        id: n.id,
        type: n.type || "commit",
        title: n.title,
        message: n.message,
        timestamp: n.created_at || n.createdAt,
        read: n.read,
        priority: "medium" as const,
      })),
    },
    {
      id: "purchases",
      title: "Purchase Updates",
      description: "Order confirmations and payment updates",
      icon: <ShoppingCart className="h-5 w-5" />,
      color: "green",
      enabled: notificationSettings.purchases,
      notifications: categorizedNotifications.purchases.map((n) => ({
        id: n.id,
        type: n.type || "purchase",
        title: n.title,
        message: n.message,
        timestamp: n.created_at || n.createdAt,
        read: n.read,
        priority: "medium" as const,
      })),
    },
    {
      id: "deliveries",
      title: "Delivery Tracking",
      description: "Shipping updates and delivery notifications",
      icon: <Truck className="h-5 w-5" />,
      color: "blue",
      enabled: notificationSettings.deliveries,
      notifications: categorizedNotifications.deliveries.map((n) => ({
        id: n.id,
        type: n.type || "delivery",
        title: n.title,
        message: n.message,
        timestamp: n.created_at || n.createdAt,
        read: n.read,
        priority: "medium" as const,
      })),
    },
  ]);

  // Load broadcasts on component mount
  useEffect(() => {
    const loadBroadcasts = async () => {
      try {
        const activeBroadcasts = await getActiveBroadcasts();
        setBroadcasts(activeBroadcasts);
        console.log("📢 Loaded broadcasts:", activeBroadcasts);
      } catch (error) {
        console.error("Failed to load broadcasts:", error);
      }
    };

    loadBroadcasts();
  }, []);

  // Check if this is a first-time user
  useEffect(() => {
    if (user && profile) {
      const hasSeenWelcome = localStorage.getItem(`welcome_seen_${user.id}`);
      const hasDismissedWelcome = localStorage.getItem(
        `welcome_dismissed_${user.id}`,
      );

      // Only show welcome if user hasn't seen it AND hasn't dismissed it
      if (!hasSeenWelcome && !hasDismissedWelcome) {
        setIsFirstTime(true);
        setShowWelcome(true);
      } else {
        // If user has already seen/dismissed welcome, ensure states are correct
        setIsFirstTime(false);
        setShowWelcome(false);
        // Remove welcome category from state if it exists
        setCategories((prev) =>
          prev.filter((category) => category.id !== "welcome"),
        );
      }
    }
  }, [user, profile]);

  // Update categories when notifications change
  useEffect(() => {
    const categorizedNotifications = categorizeNotifications(notifications);

    setCategories((prev) =>
      prev.map((category) => {
        if (category.id === "commits") {
          return {
            ...category,
            notifications: categorizedNotifications.commits.map((n) => ({
              id: n.id,
              type: n.type || "commit",
              title: n.title,
              message: n.message,
              timestamp: n.created_at || n.createdAt,
              read: n.read,
              priority: "medium" as const,
            })),
          };
        }
        if (category.id === "purchases") {
          return {
            ...category,
            notifications: categorizedNotifications.purchases.map((n) => ({
              id: n.id,
              type: n.type || "purchase",
              title: n.title,
              message: n.message,
              timestamp: n.created_at || n.createdAt,
              read: n.read,
              priority: "medium" as const,
            })),
          };
        }
        if (category.id === "deliveries") {
          return {
            ...category,
            notifications: categorizedNotifications.deliveries.map((n) => ({
              id: n.id,
              type: n.type || "delivery",
              title: n.title,
              message: n.message,
              timestamp: n.created_at || n.createdAt,
              read: n.read,
              priority: "medium" as const,
            })),
          };
        }
        return category;
      }),
    );
  }, [notifications]);

  const markWelcomeAsSeen = () => {
    if (user) {
      // Set multiple localStorage keys to ensure it's permanently dismissed
      localStorage.setItem(`welcome_seen_${user.id}`, "true");
      localStorage.setItem(
        `welcome_dismissed_${user.id}`,
        new Date().toISOString(),
      );

      // Update all state to ensure it's hidden immediately and permanently
      setShowWelcome(false);
      setIsFirstTime(false);

      // Remove welcome notifications from categories
      setCategories((prev) =>
        prev.filter((category) => category.id !== "welcome"),
      );

      toast.success(
        "Welcome! You're all set to start using ReBooked Solutions.",
      );
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "welcome":
        return <Gift className="h-4 w-4 text-purple-500" />;
      case "commit":
        return <Award className="h-4 w-4 text-orange-500" />;
      case "purchase":
        return <ShoppingCart className="h-4 w-4 text-green-500" />;
      case "delivery":
        return <Truck className="h-4 w-4 text-blue-500" />;
      case "review":
        return <Star className="h-4 w-4 text-yellow-500" />;
      case "social":
        return <Users className="h-4 w-4 text-pink-500" />;
      case "info":
        return <MessageCircle className="h-4 w-4 text-blue-500" />;
      case "tip":
        return <BookOpen className="h-4 w-4 text-green-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const markAsRead = (categoryId: string, notificationId: string) => {
    setCategories((prev) =>
      prev.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              notifications: category.notifications.map((notif) =>
                notif.id === notificationId ? { ...notif, read: true } : notif,
              ),
            }
          : category,
      ),
    );
  };

  const dismissNotification = (categoryId: string, notificationId: string) => {
    setCategories((prev) =>
      prev.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              notifications: category.notifications.filter(
                (notif) => notif.id !== notificationId,
              ),
            }
          : category,
      ),
    );
  };

  const totalNotifications = categories.reduce(
    (total, category) => total + category.notifications.length,
    0,
  );

  const unreadCount = categories.reduce(
    (total, category) =>
      total + category.notifications.filter((notif) => !notif.read).length,
    0,
  );

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            <Bell className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Notifications
              </h1>
              <p className="text-sm sm:text-base text-gray-500">
                Stay updated with your ReBooked activity
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <Badge className="bg-red-500 text-white self-start sm:self-auto">
              {unreadCount} new
            </Badge>
          )}
        </div>

        {/* Welcome Message for First-Time Users */}
        {showWelcome && (
          <Alert className="mb-8 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
            <Gift className="h-5 w-5 text-purple-600" />
            <AlertDescription>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-purple-900 mb-2">
                    🎉 Welcome to ReBooked Solutions!
                  </h3>
                  <p className="text-purple-800 mb-3">
                    You've joined South Africa's leading textbook marketplace!
                    We've prepared some helpful notifications to get you
                    started.
                  </p>
                  <Button
                    onClick={markWelcomeAsSeen}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                    size="sm"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Got it, let's explore!
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markWelcomeAsSeen}
                  className="text-purple-600 hover:bg-purple-100"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Notification Categories */}
        <div className="space-y-6">
          {categories.map((category) => {
            if (!category.enabled && category.id !== "welcome") return null;
            if (category.id === "welcome" && !isFirstTime && !showWelcome)
              return null;

            const colorClasses = {
              purple: "border-purple-200 bg-purple-50",
              orange: "border-orange-200 bg-orange-50",
              green: "border-green-200 bg-green-50",
              blue: "border-blue-200 bg-blue-50",
              pink: "border-pink-200 bg-pink-50",
            };

            return (
              <Card
                key={category.id}
                className={`${colorClasses[category.color as keyof typeof colorClasses]} border-2`}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    {category.icon}
                    <div>
                      <div className="text-lg">{category.title}</div>
                      <div className="text-sm font-normal text-gray-600">
                        {category.description}
                      </div>
                    </div>
                    {category.notifications.length > 0 && (
                      <Badge variant="secondary">
                        {category.notifications.length}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {category.notifications.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No {category.title.toLowerCase()} yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {category.notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 rounded-lg border transition-all ${
                            notification.read
                              ? "bg-white border-gray-200"
                              : "bg-white border-blue-300 shadow-md"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              {getNotificationIcon(notification.type)}
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900 mb-1">
                                  {notification.title}
                                </h4>
                                <p className="text-gray-700 text-sm whitespace-pre-line mb-2">
                                  {notification.message}
                                </p>
                                <div className="text-xs text-gray-500">
                                  {formatTimestamp(notification.timestamp)}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              {!notification.read && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    markAsRead(category.id, notification.id)
                                  }
                                  className="text-blue-600 hover:bg-blue-100"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  dismissNotification(
                                    category.id,
                                    notification.id,
                                  )
                                }
                                className="text-gray-500 hover:bg-gray-100"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Empty State */}
        {totalNotifications === 0 && !showWelcome && (
          <Card className="text-center py-12">
            <CardContent>
              <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                All caught up!
              </h3>
              <p className="text-gray-500 mb-6">
                You don't have any notifications right now. We'll notify you
                when something important happens.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <ShoppingCart className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <h4 className="font-medium text-blue-900">Start Shopping</h4>
                  <p className="text-blue-700 text-sm">
                    Browse textbooks and make your first purchase
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <BookOpen className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <h4 className="font-medium text-green-900">List Books</h4>
                  <p className="text-green-700 text-sm">
                    Sell your textbooks to earn money
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <Users className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <h4 className="font-medium text-purple-900">
                    Join Community
                  </h4>
                  <p className="text-purple-700 text-sm">
                    Connect with other students
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default NotificationsNew;

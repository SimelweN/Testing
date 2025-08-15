import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { getSafeErrorMessage } from "@/utils/errorMessageUtils";
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
  CheckCircle,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import { toast } from "sonner";
import { NotificationService } from "@/services/notificationService";
import { supabase } from "@/integrations/supabase/client";
import { testConnection, getConnectionErrorMessage, type ConnectionTestResult } from "@/utils/connectionTester";

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

  const [notificationSettings, setNotificationSettings] = useState({
    commits: true,
    purchases: true,
    deliveries: true,
  });
  const [connectionStatus, setConnectionStatus] = useState<ConnectionTestResult | null>(null);
  const [showConnectionDetails, setShowConnectionDetails] = useState(false);
  const [dismissingNotifications, setDismissingNotifications] = useState<Set<string>>(new Set());

  // Convert database notifications to our category format
  const categorizeNotifications = (dbNotifications: any[]) => {
    const commitNotifications = dbNotifications.filter(
      (n) =>
        n.title?.toLowerCase().includes("commit") ||
        n.message?.toLowerCase().includes("commit") ||
        n.title?.includes("⏰") ||
        (n.type === "warning" && (n.title?.includes("Commit") || n.message?.includes("commit"))),
    );

    const purchaseNotifications = dbNotifications.filter(
      (n) =>
        n.title?.toLowerCase().includes("purchase") ||
        n.title?.toLowerCase().includes("order") ||
        n.title?.toLowerCase().includes("payment") ||
        n.title?.includes("🛒") ||
        n.title?.includes("📦") ||
        n.title?.includes("💳") ||
        n.title?.includes("✅") ||
        n.title?.includes("🎉") ||
        (n.type === "success" && (n.title?.includes("Order") || n.title?.includes("Payment"))),
    );

    const deliveryNotifications = dbNotifications.filter(
      (n) =>
        n.title?.toLowerCase().includes("delivery") ||
        n.title?.toLowerCase().includes("shipping") ||
        n.title?.toLowerCase().includes("tracking") ||
        n.title?.includes("📦") ||
        (n.type === "info" && (n.title?.includes("Delivery") || n.title?.includes("Shipping"))),
    );

    const adminNotifications = dbNotifications.filter(
      (n) =>
        n.type === "admin_action" ||
        n.type === "admin" ||
        n.type === "broadcast" ||
        n.title?.toLowerCase().includes("removed") ||
        n.title?.toLowerCase().includes("deleted") ||
        n.title?.toLowerCase().includes("listing") ||
        n.title?.toLowerCase().includes("rebooked solutions team") ||
        n.title?.toLowerCase().includes("system announcement") ||
        n.message?.toLowerCase().includes("admin") ||
        n.message?.toLowerCase().includes("violation"),
    );

    return {
      commits: commitNotifications,
      purchases: purchaseNotifications,
      deliveries: deliveryNotifications,
      admin: adminNotifications,
    };
  };

  const categorizedNotifications = categorizeNotifications(notifications);

  const [categories, setCategories] = useState<NotificationCategory[]>([
    {
      id: "welcome-disabled",
      title: "Welcome to ReBooked Solutions!",
      description: "Get started with buying and selling textbooks",
      icon: <Gift className="h-5 w-5" />,
      color: "purple",
      enabled: false,
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
          title: "How ReBooked Solutions Works",
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
            "🔹 Complete your profile setup\\n��� Add your addresses for delivery\\n🔹 Set up banking for selling\\n🔹 Start browsing or list your first book!",
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
    {
      id: "admin",
      title: "System Messages & Admin Actions",
      description: "Official communications and administrative actions",
      icon: <Settings className="h-5 w-5" />,
      color: "red",
      enabled: true,
      notifications: categorizedNotifications.admin.map((n) => ({
        id: n.id,
        type: n.type || "admin",
        title: n.title,
        message: n.message,
        timestamp: n.created_at || n.createdAt,
        read: n.read,
        priority: "high" as const,
      })),
    },
  ]);

  // Test connection on component mount
  useEffect(() => {

    const checkConnection = async () => {
      try {
        const result = await testConnection();
        setConnectionStatus(result);

        if (!result.supabaseReachable || !result.databaseWorking) {
          console.warn('⚠️ Connection issues detected:', result);
          toast.warning('Connection issues detected. Some features may not work properly.');
        }
      } catch (error) {
        const safeConnectionErrorMessage = getSafeErrorMessage(error, 'Connection test failed');
        console.error('❌ Connection test failed:', {
          message: safeConnectionErrorMessage,
          code: error?.code,
          details: error?.details
        });
        const errorMessage = getConnectionErrorMessage(error);
        setConnectionStatus({
          isOnline: navigator.onLine,
          supabaseReachable: false,
          authWorking: false,
          databaseWorking: false,
          error: errorMessage
        });
      }
    };

    checkConnection();
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
        if (category.id === "admin") {
          return {
            ...category,
            notifications: categorizedNotifications.admin.map((n) => ({
              id: n.id,
              type: n.type || "admin",
              title: n.title,
              message: n.message,
              timestamp: n.created_at || n.createdAt,
              read: n.read,
              priority: "high" as const,
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

  const getNotificationIcon = (type: string, title?: string, message?: string) => {
    // Content-based icon detection (more specific)
    if (title?.includes("🧪") || title?.includes("Test")) {
      return <Bell className="h-4 w-4 text-gray-500" />;
    }
    if (title?.includes("⏰") || title?.includes("Commit") || message?.includes("commit")) {
      return <Award className="h-4 w-4 text-orange-500" />;
    }
    if (title?.includes("🛒") || title?.includes("📦") || title?.includes("💳") || title?.includes("Order") || title?.includes("Purchase") || title?.includes("Payment")) {
      return <ShoppingCart className="h-4 w-4 text-green-500" />;
    }
    if (title?.includes("📦") || title?.includes("Delivery") || title?.includes("Shipping")) {
      return <Truck className="h-4 w-4 text-blue-500" />;
    }

    // Fallback to type-based icons
    switch (type) {
      case "welcome":
        return <Gift className="h-4 w-4 text-purple-500" />;
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "info":
        return <MessageCircle className="h-4 w-4 text-blue-500" />;
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

  const dismissNotification = async (categoryId: string, notificationId: string) => {
    // Set dismissing state
    setDismissingNotifications(prev => new Set(prev).add(notificationId));

    try {
      console.log('🗑️ Starting dismissNotification:', {
        categoryId,
        notificationId,
        userId: user?.id,
        isOnline: navigator.onLine,
        timestamp: new Date().toISOString()
      });

      // Check network connectivity first
      if (!navigator.onLine) {
        console.error('❌ No internet connection');
        toast.error('No internet connection. Please check your network.');
        return;
      }

      // Check if user is authenticated
      if (!user?.id) {
        console.error('❌ No authenticated user');
        toast.error('You must be logged in to delete notifications');
        return;
      }

      // First, let's verify the notification exists
      console.log('🔍 Checking if notification exists...');
      const { data: existingNotification, error: checkError } = await supabase
        .from('notifications')
        .select('id, user_id, title')
        .eq('id', notificationId)
        .single();

      if (checkError) {
        const safeErrorMessage = getSafeErrorMessage(checkError, 'Unknown error checking notification');
        console.error('❌ Error checking notification existence:', {
          message: safeErrorMessage,
          code: checkError.code,
          details: checkError.details,
          hint: checkError.hint,
          originalError: checkError
        });
        toast.error(`Notification not found: ${safeErrorMessage}`);
        return;
      }

      if (!existingNotification) {
        console.error('❌ Notification not found in database');
        toast.error('Notification not found');
        return;
      }

      console.log('✅ Notification found:', existingNotification);

      // Verify ownership
      if (existingNotification.user_id !== user.id) {
        console.error('❌ User does not own this notification');
        toast.error('You can only delete your own notifications');
        return;
      }

      // Now delete from database
      console.log('🗑️ Attempting to delete notification from database...');
      const { data: deleteData, error: deleteError } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user.id); // Double-check ownership in delete query

      console.log('Delete operation result:', { data: deleteData, error: deleteError });

      if (deleteError) {
        const safeDeleteErrorMessage = getSafeErrorMessage(deleteError, 'Unknown delete error');
        console.error('❌ Database error deleting notification:', {
          notificationId,
          code: deleteError.code,
          message: safeDeleteErrorMessage,
          details: deleteError.details,
          hint: deleteError.hint,
          originalError: deleteError
        });

        // Handle specific error cases
        if (deleteError.code === 'PGRST116') {
          toast.error('Notification not found or already deleted');
        } else if (deleteError.code === '42501') {
          toast.error('Permission denied. You can only delete your own notifications.');
        } else if (safeDeleteErrorMessage?.includes('Failed to fetch') || safeDeleteErrorMessage?.includes('network')) {
          toast.error('Network error. Please check your connection and try again.');
        } else {
          toast.error(`Failed to remove notification: ${safeDeleteErrorMessage}`);
        }
        return;
      }

      console.log('✅ Successfully deleted notification from database');

      // Update local state to remove from UI immediately (before showing success message)
      console.log('🔄 Updating local state to remove notification from UI...');
      setCategories((prev) => {
        const updatedCategories = prev.map((category) =>
          category.id === categoryId
            ? {
                ...category,
                notifications: category.notifications.filter(
                  (notif) => notif.id !== notificationId,
                ),
              }
            : category,
        );
        console.log('✅ Local state updated - notification removed from UI');
        return updatedCategories;
      });

      // Show success message immediately after UI update
      toast.success('✅ Notification permanently removed');
      console.log('✅ Notification removed from UI - dismissNotification completed successfully');

      // Refresh notifications to ensure consistency (in background)
      console.log('🔄 Refreshing notifications in background...');
      try {
        await refreshNotifications();
        console.log('✅ Background notifications refresh completed');
      } catch (refreshError) {
        const safeRefreshErrorMessage = getSafeErrorMessage(refreshError, 'Failed to refresh notifications');
        console.warn('⚠️ Failed to refresh notifications after deletion:', {
          message: safeRefreshErrorMessage,
          code: refreshError?.code,
          details: refreshError?.details
        });
        // Don't show error toast for refresh failure since deletion succeeded
      }

    } catch (error) {
      console.error('💥 Exception while dismissing notification:', {
        error,
        notificationId,
        categoryId,
        isOnline: navigator.onLine,
        timestamp: new Date().toISOString(),
        stack: error instanceof Error ? error.stack : undefined
      });

      // Handle network errors specifically
      const safeCatchErrorMessage = getSafeErrorMessage(error, 'An unexpected error occurred');

      if (error instanceof TypeError && safeCatchErrorMessage.includes('Failed to fetch')) {
        toast.error('Network error. Please check your internet connection and try again.');
      } else {
        toast.error(`Error: ${safeCatchErrorMessage}`);
      }
    } finally {
      // Clear dismissing state
      setDismissingNotifications(prev => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
    }
  };

  // Use real notification counts from the hook
  const totalNotifications = totalCount;
  const unreadNotifications = unreadCount;

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
                Stay updated with your ReBooked Solutions activity
              </p>
            </div>
          </div>
          {unreadNotifications > 0 && (
            <Badge className="bg-red-500 text-white self-start sm:self-auto">
              {unreadNotifications} new
            </Badge>
          )}
          {isLoading && (
            <Badge variant="outline" className="self-start sm:self-auto">
              Loading...
            </Badge>
          )}
          {connectionStatus && !connectionStatus.databaseWorking && (
            <Badge
              variant="destructive"
              className="self-start sm:self-auto cursor-pointer"
              onClick={() => setShowConnectionDetails(!showConnectionDetails)}
            >
              Connection Issues
            </Badge>
          )}



        </div>

        {/* Connection Status Details */}
        {showConnectionDetails && connectionStatus && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-800">
                <XCircle className="h-5 w-5" />
                Connection Diagnostics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Internet Connection:</span>
                  <Badge variant={connectionStatus.isOnline ? "default" : "destructive"}>
                    {connectionStatus.isOnline ? "✅ Online" : "❌ Offline"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Supabase Reachable:</span>
                  <Badge variant={connectionStatus.supabaseReachable ? "default" : "destructive"}>
                    {connectionStatus.supabaseReachable ? "✅ Yes" : "❌ No"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Authentication:</span>
                  <Badge variant={connectionStatus.authWorking ? "default" : "destructive"}>
                    {connectionStatus.authWorking ? "✅ Working" : "❌ Failed"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Database Access:</span>
                  <Badge variant={connectionStatus.databaseWorking ? "default" : "destructive"}>
                    {connectionStatus.databaseWorking ? "✅ Working" : "❌ Failed"}
                  </Badge>
                </div>
                {connectionStatus.latency && (
                  <div className="flex justify-between">
                    <span>Response Time:</span>
                    <Badge variant="outline">{connectionStatus.latency}ms</Badge>
                  </div>
                )}
                {connectionStatus.error && (
                  <div className="mt-3 p-2 bg-red-100 rounded text-red-800 text-xs">
                    <strong>Error:</strong> {connectionStatus.error}
                  </div>
                )}
              </div>
              <div className="mt-4 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    const result = await testConnection();
                    setConnectionStatus(result);
                    toast.info('Connection test completed');
                  }}
                >
                  Retest Connection
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowConnectionDetails(false)}
                >
                  Hide Details
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Welcome Message for First-Time Users */}
        {showWelcome && (
          <Alert className="mb-6 sm:mb-8 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
            <Gift className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 flex-shrink-0" />
            <AlertDescription>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-purple-900 mb-2 text-sm sm:text-base">
                    🎉 Welcome to ReBooked Solutions!
                  </h3>
                  <p className="text-purple-800 mb-3 text-sm sm:text-base leading-relaxed">
                    You've joined South Africa's leading textbook marketplace!
                    We've prepared some helpful notifications to get you
                    started.
                  </p>
                  <Button
                    onClick={markWelcomeAsSeen}
                    className="bg-purple-600 hover:bg-purple-700 text-white w-full sm:w-auto"
                    size="sm"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    <span className="text-sm">Got it, let's explore!</span>
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markWelcomeAsSeen}
                  className="text-purple-600 hover:bg-purple-100 self-end sm:self-start min-h-[44px] min-w-[44px]"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}



        {/* Check if we have any notifications to show */}
        {(() => {
          const hasVisibleCategories = categories.some(category => {
            if (!category.enabled && category.id !== "welcome") return false;
            if (category.id === "welcome" && !isFirstTime && !showWelcome) return false;
            return category.notifications.length > 0;
          });

          const shouldShowWelcome = showWelcome && isFirstTime;

          if (!hasVisibleCategories && !shouldShowWelcome) {
            return (
              <Card className="text-center py-16">
                <CardContent>
                  <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    No notifications yet
                  </h3>
                  <p className="text-gray-500 mb-6">
                    You're all caught up! We'll notify you when something important happens.
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
                      <h4 className="font-medium text-purple-900">Join Community</h4>
                      <p className="text-purple-700 text-sm">
                        Connect with other students
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          }

          return null;
        })()}

        {/* Notification Categories */}
        <div className="space-y-6">
          {categories.map((category) => {
            if (!category.enabled && category.id !== "welcome") return null;
            if (category.id === "welcome" && !isFirstTime && !showWelcome)
              return null;
            // Hide categories with no notifications (except welcome)
            if (category.id !== "welcome" && category.notifications.length === 0)
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
                data-category={category.id}
                className={`${colorClasses[category.color as keyof typeof colorClasses]} border-2`}
              >
                <CardHeader className="px-4 sm:px-6">
                  <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                    <div className="flex items-center gap-2 sm:gap-3 flex-1">
                      <div className="flex-shrink-0">
                        {category.icon}
                      </div>
                      <div className="flex-1">
                        <div className="text-base sm:text-lg font-semibold">{category.title}</div>
                        <div className="text-xs sm:text-sm font-normal text-gray-600">
                          {category.description}
                        </div>
                      </div>
                    </div>
                    {category.notifications.length > 0 && (
                      <Badge variant="secondary" className="self-start sm:self-auto">
                        {category.notifications.length}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                      {category.notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-3 sm:p-4 rounded-lg border transition-all ${
                            (notification.title.includes('🧪') || notification.title.includes('Test Notification')) && !notification.read
                              ? "bg-gradient-to-r from-green-50 to-blue-50 border-green-400 shadow-lg ring-2 ring-green-300 ring-opacity-50"
                              : notification.read
                              ? "bg-white border-gray-200"
                              : "bg-white border-blue-300 shadow-md"
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-0">
                            <div className="flex items-start gap-2 sm:gap-3 flex-1">
                              <div className="flex-shrink-0 mt-0.5">
                                {getNotificationIcon(notification.type, notification.title, notification.message)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold text-gray-900 text-sm sm:text-base line-clamp-2">
                                    {notification.title}
                                  </h4>
                                  {(notification.title.includes('🧪') || notification.title.includes('Test Notification')) && (
                                    <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                                      TEST
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-gray-700 text-xs sm:text-sm whitespace-pre-line mb-2 leading-relaxed">
                                  {notification.message}
                                </p>
                                <div className="text-xs text-gray-500">
                                  {formatTimestamp(notification.timestamp)}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center justify-end gap-1 sm:gap-2 sm:ml-4 self-end sm:self-start">
                              {!notification.read && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    markAsRead(category.id, notification.id)
                                  }
                                  className="text-blue-600 hover:bg-blue-100 min-h-[44px] min-w-[44px] p-2"
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
                                disabled={dismissingNotifications.has(notification.id)}
                                className="text-gray-500 hover:bg-gray-100 min-h-[44px] min-w-[44px] p-2 disabled:opacity-50"
                              >
                                {dismissingNotifications.has(notification.id) ? (
                                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                                ) : (
                                  <X className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>


      </div>
    </Layout>
  );
};

export default NotificationsNew;

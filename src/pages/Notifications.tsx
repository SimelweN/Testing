import { useState, useEffect, useMemo } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Bell,
  Trash2,
  AlertCircle,
  CheckCircle,
  Info,
  RefreshCw,
  WifiOff,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import {
  markNotificationAsRead,
  deleteNotification,
  markMultipleAsRead,
  deleteMultipleNotifications,
} from "@/services/notificationService";

interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error";
  read: boolean;
  createdAt: string;
}

const Notifications = () => {
  const { user } = useAuth();
  const {
    notifications,
    unreadCount,
    isLoading,
    hasError,
    lastError,
    refreshNotifications,
    clearError,
  } = useNotifications();

  const [isProcessing, setIsProcessing] = useState(false);

  // Convert notifications to the expected format
  const formattedNotifications: NotificationItem[] = useMemo(() => {
    return notifications.map((notification) => ({
      id: notification.id,
      userId: notification.user_id,
      title: notification.title,
      message: notification.message,
      type: notification.type as "info" | "warning" | "success" | "error",
      read: notification.read,
      createdAt: notification.created_at,
    }));
  }, [notifications]);

  const getIcon = (type: string) => {
    switch (type) {
      case "info":
        return <Info className="h-5 w-5 text-blue-500" />;
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const minutes = Math.floor(diff / (1000 * 60));
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (days > 0) {
        return `${days} day${days > 1 ? "s" : ""} ago`;
      } else if (hours > 0) {
        return `${hours} hour${hours > 1 ? "s" : ""} ago`;
      } else if (minutes > 0) {
        return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
      } else {
        return "Just now";
      }
    } catch (error) {
      return "Unknown time";
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      toast.success("Notification marked as read");

      // Refresh notifications to show updated state
      await refreshNotifications();
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast.error("Failed to mark notification as read");
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      await deleteNotification(id);
      toast.success("Notification deleted");

      // Refresh notifications to show updated state
      await refreshNotifications();
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error("Failed to delete notification");
    }
  };

  const markAllAsRead = async () => {
    if (unreadCount === 0) return;

    setIsProcessing(true);
    try {
      const unreadIds = formattedNotifications
        .filter((n) => !n.read)
        .map((n) => n.id);

      await markMultipleAsRead(unreadIds);
      toast.success(`Marked ${unreadIds.length} notifications as read`);

      // Refresh notifications to show updated state
      await refreshNotifications();
    } catch (error) {
      console.error("Error marking all as read:", error);
      toast.error("Failed to mark all as read");
    } finally {
      setIsProcessing(false);
    }
  };

  const clearAll = async () => {
    if (formattedNotifications.length === 0) return;

    setIsProcessing(true);
    try {
      const allIds = formattedNotifications.map((n) => n.id);
      await deleteMultipleNotifications(allIds);
      toast.success(`Cleared ${allIds.length} notifications`);

      // Refresh notifications to show updated state
      await refreshNotifications();
    } catch (error) {
      console.error("Error clearing all notifications:", error);
      toast.error("Failed to clear all notifications");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetry = () => {
    clearError();
    refreshNotifications();
  };

  if (isLoading && formattedNotifications.length === 0) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-book-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading notifications...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-4 sm:py-8 max-w-4xl">
        {/* Error Alert */}
        {hasError && (
          <Alert className="mb-6 border-yellow-200 bg-yellow-50">
            <WifiOff className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium">Connection Issues</span>
                  <p className="text-sm mt-1">
                    {lastError || "Unable to load notifications"}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRetry}
                  disabled={isLoading}
                  className="ml-4"
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
                  />
                  Retry
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <div className="flex items-center flex-wrap">
            <Bell className="h-6 w-6 text-book-600 mr-2 flex-shrink-0" />
            <h1 className="text-2xl sm:text-3xl font-bold text-book-800">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full flex-shrink-0">
                {unreadCount}
              </span>
            )}
            {isLoading && formattedNotifications.length > 0 && (
              <RefreshCw className="ml-2 h-4 w-4 animate-spin text-gray-500" />
            )}
          </div>

          {formattedNotifications.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={markAllAsRead}
                disabled={unreadCount === 0 || isProcessing}
                className="w-full sm:w-auto text-sm"
                size="sm"
              >
                {isProcessing ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Mark All Read ({unreadCount})
              </Button>
              <Button
                variant="outline"
                onClick={clearAll}
                disabled={isProcessing}
                className="w-full sm:w-auto text-sm"
                size="sm"
              >
                {isProcessing ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Clear All ({formattedNotifications.length})
              </Button>
            </div>
          )}
        </div>

        {formattedNotifications.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12 sm:py-16">
              <Bell className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No notifications</h3>
              <p className="text-gray-500 text-sm sm:text-base px-4">
                You're all caught up! We'll notify you when something new
                happens.
              </p>
              {hasError && (
                <Button
                  variant="outline"
                  onClick={handleRetry}
                  className="mt-4"
                  disabled={isLoading}
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
                  />
                  Try Loading Again
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {formattedNotifications.map((notification, index) => (
              <Card
                key={notification.id}
                className={`
                  transition-all duration-200 relative
                  ${!notification.read ? "bg-blue-50 border-blue-200 shadow-md" : "shadow-sm"}
                  hover:shadow-lg z-10
                `}
                style={{
                  zIndex: formattedNotifications.length - index + 10,
                  position: "relative",
                }}
              >
                <CardHeader className="pb-3 p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex items-start space-x-3 flex-1 min-w-0">
                      <div className="flex-shrink-0 mt-0.5">
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base sm:text-lg leading-tight pr-2">
                          {notification.title}
                        </CardTitle>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                          {formatTimestamp(notification.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 flex-shrink-0 relative z-20">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-100 text-xs sm:text-sm px-2 sm:px-3 relative z-30"
                        >
                          Mark Read
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNotification(notification.id);
                        }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-100 p-1 sm:p-2 relative z-30"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 p-4 sm:p-6 sm:pt-0">
                  <p className="text-gray-700 text-sm sm:text-base leading-relaxed break-words">
                    {notification.message}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Loading overlay for batch operations */}
        {isProcessing && (
          <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <div className="flex items-center">
                <RefreshCw className="h-5 w-5 animate-spin mr-3" />
                <span>Processing notifications...</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Notifications;

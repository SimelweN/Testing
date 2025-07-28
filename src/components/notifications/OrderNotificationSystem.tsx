import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  Calendar,
  TruckIcon,
  X,
  RefreshCw,
  Package,
  DollarSign,
  Clock,
  Mail,
  Smartphone,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { markNotificationAsRead } from "@/services/notificationService";

interface OrderNotification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error";
  read: boolean;
  created_at: string;
  order_id?: string;
  action_required?: boolean;
  action_type?: string;
}

interface NotificationStats {
  total: number;
  unread: number;
  actionRequired: number;
  orderUpdates: number;
  systemAlerts: number;
}

const OrderNotificationSystem: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] =
    useState<OrderNotification | null>(null);
  const [filter, setFilter] = useState<"all" | "unread" | "actions">("all");

  useEffect(() => {
    if (user) {
      fetchNotifications();

      // Note: Real-time notifications are handled by the global NotificationManager
      // in useNotifications hook to prevent duplicate subscriptions.
      // This component will receive updates through the centralized system.
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Error fetching notifications:", error);
        toast.error("Failed to load notifications");
        return;
      }

      setNotifications(data || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast.error("Failed to mark notification as read");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);

      if (unreadIds.length === 0) {
        toast.info("All notifications are already read");
        return;
      }

      // Mark all as read in the database
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .in("id", unreadIds);

      if (error) throw error;

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

      toast.success(`Marked ${unreadIds.length} notifications as read`);
    } catch (error) {
      console.error("Error marking all as read:", error);
      toast.error("Failed to mark all notifications as read");
    }
  };

  const getNotificationIcon = (notification: OrderNotification) => {
    if (notification.action_required) {
      return <AlertTriangle className="h-5 w-5 text-orange-500" />;
    }

    switch (notification.type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "error":
        return <X className="h-5 w-5 text-red-500" />;
      default:
        return <Bell className="h-5 w-5 text-blue-500" />;
    }
  };

  const getNotificationCategory = (notification: OrderNotification) => {
    const message = notification.message.toLowerCase();
    const title = notification.title.toLowerCase();

    if (notification.action_required) return "action";
    if (
      title.includes("order") ||
      title.includes("purchase") ||
      title.includes("sale")
    )
      return "order";
    if (
      title.includes("delivery") ||
      title.includes("pickup") ||
      title.includes("courier")
    )
      return "delivery";
    if (title.includes("payment") || title.includes("refund")) return "payment";
    if (title.includes("reschedule") || title.includes("cancel"))
      return "change";
    return "system";
  };

  const getCategoryBadge = (category: string) => {
    const config = {
      action: { label: "Action Required", color: "bg-orange-500" },
      order: { label: "Order", color: "bg-blue-500" },
      delivery: { label: "Delivery", color: "bg-green-500" },
      payment: { label: "Payment", color: "bg-purple-500" },
      change: { label: "Change", color: "bg-yellow-500" },
      system: { label: "System", color: "bg-gray-500" },
    };

    const { label, color } =
      config[category as keyof typeof config] || config.system;

    return <Badge className={`${color} text-white text-xs`}>{label}</Badge>;
  };

  const getStats = (): NotificationStats => {
    return {
      total: notifications.length,
      unread: notifications.filter((n) => !n.read).length,
      actionRequired: notifications.filter((n) => n.action_required).length,
      orderUpdates: notifications.filter(
        (n) =>
          getNotificationCategory(n) === "order" ||
          getNotificationCategory(n) === "delivery",
      ).length,
      systemAlerts: notifications.filter(
        (n) => getNotificationCategory(n) === "system",
      ).length,
    };
  };

  const getFilteredNotifications = () => {
    switch (filter) {
      case "unread":
        return notifications.filter((n) => !n.read);
      case "actions":
        return notifications.filter((n) => n.action_required);
      default:
        return notifications;
    }
  };

  const stats = getStats();
  const filteredNotifications = getFilteredNotifications();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600">Loading notifications...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notification Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Bell className="h-6 w-6 mx-auto mb-2 text-gray-600" />
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-sm text-gray-600">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Mail className="h-6 w-6 mx-auto mb-2 text-blue-600" />
            <p className="text-2xl font-bold">{stats.unread}</p>
            <p className="text-sm text-gray-600">Unread</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-orange-600" />
            <p className="text-2xl font-bold">{stats.actionRequired}</p>
            <p className="text-sm text-gray-600">Action Required</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Package className="h-6 w-6 mx-auto mb-2 text-green-600" />
            <p className="text-2xl font-bold">{stats.orderUpdates}</p>
            <p className="text-sm text-gray-600">Order Updates</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Smartphone className="h-6 w-6 mx-auto mb-2 text-purple-600" />
            <p className="text-2xl font-bold">{stats.systemAlerts}</p>
            <p className="text-sm text-gray-600">System Alerts</p>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            All Notifications
          </Button>
          <Button
            variant={filter === "unread" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("unread")}
          >
            Unread
            {stats.unread > 0 && (
              <Badge variant="secondary" className="ml-1">
                {stats.unread}
              </Badge>
            )}
          </Button>
          <Button
            variant={filter === "actions" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("actions")}
          >
            Action Required
            {stats.actionRequired > 0 && (
              <Badge variant="destructive" className="ml-1">
                {stats.actionRequired}
              </Badge>
            )}
          </Button>
        </div>

        {stats.unread > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark All Read
          </Button>
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Bell className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">No notifications</h3>
              <p className="text-gray-600">
                {filter === "unread"
                  ? "All notifications have been read."
                  : filter === "actions"
                    ? "No actions required at the moment."
                    : "You haven't received any notifications yet."}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredNotifications.map((notification) => (
            <Card
              key={notification.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                !notification.read ? "bg-blue-50 border-blue-200" : ""
              } ${
                notification.action_required
                  ? "border-orange-200 bg-orange-50"
                  : ""
              }`}
              onClick={() => setSelectedNotification(notification)}
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4
                          className={`text-sm font-semibold ${
                            !notification.read
                              ? "text-gray-900"
                              : "text-gray-700"
                          }`}
                        >
                          {notification.title}
                        </h4>
                        <p
                          className={`text-sm mt-1 ${
                            !notification.read
                              ? "text-gray-700"
                              : "text-gray-600"
                          }`}
                        >
                          {notification.message.length > 120
                            ? `${notification.message.substring(0, 120)}...`
                            : notification.message}
                        </p>
                      </div>

                      <div className="flex flex-col items-end space-y-2 ml-4">
                        {getCategoryBadge(
                          getNotificationCategory(notification),
                        )}
                        <span className="text-xs text-gray-500">
                          {new Date(notification.created_at).toLocaleDateString(
                            "en-ZA",
                            {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </span>
                      </div>
                    </div>

                    {notification.action_required && (
                      <Alert className="mt-3 border-orange-200 bg-orange-50">
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                        <AlertDescription className="text-orange-800 text-sm">
                          This notification requires your attention. Click to
                          view details and take action.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  {!notification.read && (
                    <div
                      className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"
                      title="Unread"
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Notification Detail Dialog */}
      <Dialog
        open={!!selectedNotification}
        onOpenChange={(open) => !open && setSelectedNotification(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              {selectedNotification &&
                getNotificationIcon(selectedNotification)}
              <span>{selectedNotification?.title}</span>
            </DialogTitle>
            <DialogDescription>
              {selectedNotification && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-700">
                    {selectedNotification.message}
                  </p>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                      {new Date(
                        selectedNotification.created_at,
                      ).toLocaleDateString("en-ZA", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {getCategoryBadge(
                      getNotificationCategory(selectedNotification),
                    )}
                  </div>

                  {selectedNotification.action_required && (
                    <Alert className="border-orange-200 bg-orange-50">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <AlertDescription className="text-orange-800 text-sm">
                        <strong>Action Required:</strong> Please visit your
                        orders page to take the necessary action.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-2 pt-2">
                    {!selectedNotification.read && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          handleMarkAsRead(selectedNotification.id);
                          setSelectedNotification(null);
                        }}
                        className="flex-1"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark as Read
                      </Button>
                    )}

                    {selectedNotification.order_id && (
                      <Button
                        size="sm"
                        onClick={() => {
                          // Navigate to order details
                          window.location.href = `/orders/${selectedNotification.order_id}`;
                        }}
                        className="flex-1"
                      >
                        <Package className="h-4 w-4 mr-2" />
                        View Order
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderNotificationSystem;

import { supabase } from "@/integrations/supabase/client";

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error";
  read: boolean;
  createdAt: string;
}

export interface NotificationInput {
  userId: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error";
  read: boolean;
}

// Cache for notifications to reduce API calls
const notificationCache = new Map<
  string,
  { data: Notification[]; timestamp: number }
>();
const CACHE_DURATION = 30000; // 30 seconds cache
const MAX_CACHE_SIZE = 100; // Maximum number of cached entries

// Abort controller for request cancellation
let currentFetchController: AbortController | null = null;

// Track recent notifications to prevent duplicates
const recentNotifications = new Map<string, number>();
const DUPLICATE_PREVENTION_WINDOW = 60000; // 1 minute window

export const getNotifications = async (
  userId: string,
): Promise<Notification[]> => {
  if (!userId) {
    console.warn("getNotifications called without userId");
    return [];
  }

  // Check cache first
  const cached = notificationCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  // Cancel any ongoing request
  if (currentFetchController) {
    currentFetchController.abort();
  }

  // Create new controller for this request
  currentFetchController = new AbortController();

  try {
    // Optimized timeout for better UX - 4 seconds
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => {
        if (currentFetchController) {
          currentFetchController.abort();
        }
        reject(new Error("Request timeout"));
      }, 4000),
    );

    const queryPromise = supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50) // Limit to 50 notifications for performance
      .abortSignal(currentFetchController.signal);

    const { data, error } = (await Promise.race([
      queryPromise,
      timeoutPromise,
    ])) as any;

    if (error) {
      // Handle specific error types gracefully
      if (error.message?.includes("aborted")) {
        console.warn("Notification request was cancelled");
        return []; // Return cached data if available
      }

      if (
        error.message?.includes("Failed to fetch") ||
        error.message?.includes("network")
      ) {
        console.warn(
          "Network issue while fetching notifications - returning cached or empty array",
        );
        return cached ? cached.data : [];
      }

      console.warn("Database error fetching notifications:", error.message);
      return cached ? cached.data : [];
    }

    if (!data || !Array.isArray(data)) {
      console.warn("Invalid notification data received:", data);
      return cached ? cached.data : [];
    }

    const notifications = data.map((notification) => ({
      id: notification.id,
      userId: notification.user_id,
      title: notification.title,
      message: notification.message,
      type: notification.type as "info" | "warning" | "success" | "error",
      read: notification.read,
      createdAt: notification.created_at,
    }));

    // Update cache
    notificationCache.set(userId, {
      data: notifications,
      timestamp: Date.now(),
    });

    // Clean up cache periodically
    if (Math.random() < 0.1) {
      // 10% chance to run cleanup
      cleanupCache();
    }

    return notifications;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    // Don't spam console with timeout errors in production
    if (import.meta.env.DEV) {
      console.warn("Notification fetch failed:", errorMessage);

      // Log connection health for debugging timeouts
      if (
        errorMessage.includes("timeout") ||
        errorMessage.includes("fetch") ||
        errorMessage.includes("aborted")
      ) {
        import("../utils/connectionHealthCheck")
          .then(({ logConnectionHealth }) => {
            logConnectionHealth();
          })
          .catch(() => {
            // Silently handle connection check errors
          });
      }
    }

    // Return cached data if available, otherwise empty array
    const cached = notificationCache.get(userId);
    return cached ? cached.data : [];
  } finally {
    currentFetchController = null;
  }
};

export const addNotification = async (
  notification: NotificationInput,
): Promise<void> => {
  try {
    // Create a comprehensive unique key for this notification to prevent duplicates
    const messageHash = btoa(notification.message).slice(0, 10); // Simple hash of message
    const notificationKey = `${notification.userId}-${notification.title}-${notification.type}-${messageHash}`;
    const now = Date.now();

    // Enhanced duplicate prevention for "Welcome back!" notifications
    let duplicateWindow = DUPLICATE_PREVENTION_WINDOW; // Default 1 minute
    if (notification.title.includes("Welcome back")) {
      duplicateWindow = 1800000; // 30 minutes for welcome back notifications
    }

    // Check if we recently sent a similar notification
    const lastSent = recentNotifications.get(notificationKey);
    if (lastSent && now - lastSent < duplicateWindow) {
      console.log(
        `[NotificationService] Preventing duplicate notification: ${notification.title} (within ${duplicateWindow / 1000}s window)`,
      );
      return; // Skip sending duplicate notification
    }

    // Check database for recent similar notifications (additional protection)
    const { data: recentDbNotifications, error: checkError } = await supabase
      .from("notifications")
      .select("id, created_at")
      .eq("user_id", notification.userId)
      .eq("title", notification.title)
      .eq("type", notification.type)
      .gte("created_at", new Date(now - duplicateWindow).toISOString())
      .limit(1);

    if (checkError) {
      console.warn("Failed to check for duplicate notifications:", checkError);
      // Continue with insertion - don't fail completely
    } else if (recentDbNotifications && recentDbNotifications.length > 0) {
      console.log(
        `[NotificationService] Found recent similar notification in database, skipping: ${notification.title}`,
      );
      return;
    }

    // Mark this notification as sent before inserting
    recentNotifications.set(notificationKey, now);

    const { error } = await supabase.from("notifications").insert([
      {
        user_id: notification.userId,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        read: notification.read,
      },
    ]);

    if (error) {
      console.error("Error adding notification:", error);
      // Remove from recent notifications if failed
      recentNotifications.delete(notificationKey);
      throw error;
    }

    console.log(
      `[NotificationService] Successfully added notification: ${notification.title}`,
    );

    // Invalidate cache after adding new notification
    notificationCache.delete(notification.userId);

    // Clean up old entries from recentNotifications map
    cleanupRecentNotifications();
  } catch (error) {
    console.error("Error in addNotification:", error);
    throw error;
  }
};

// Helper function to clean up old entries from the recent notifications map
const cleanupRecentNotifications = () => {
  const now = Date.now();
  for (const [key, timestamp] of recentNotifications.entries()) {
    if (now - timestamp > DUPLICATE_PREVENTION_WINDOW) {
      recentNotifications.delete(key);
    }
  }
};

// Helper function to clean up cache to prevent memory issues
const cleanupCache = () => {
  const now = Date.now();

  // Remove expired entries
  for (const [key, entry] of notificationCache.entries()) {
    if (now - entry.timestamp > CACHE_DURATION) {
      notificationCache.delete(key);
    }
  }

  // If cache is still too large, remove oldest entries
  if (notificationCache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(notificationCache.entries()).sort(
      (a, b) => a[1].timestamp - b[1].timestamp,
    );

    const toDelete = entries.slice(0, notificationCache.size - MAX_CACHE_SIZE);
    toDelete.forEach(([key]) => notificationCache.delete(key));
  }
};

export const markNotificationAsRead = async (
  notificationId: string,
): Promise<void> => {
  try {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", notificationId);

    if (error) {
      console.error("Error marking notification as read:", {
        message: error.message,
        code: error.code,
        details: error.details,
      });

      if (error.code === "42P01") {
        throw new Error(
          "Notifications table does not exist. Please run database migrations.",
        );
      }

      throw new Error(`Failed to mark notification as read: ${error.message}`);
    }

    // Update cache for all users (simple approach - clear all cache)
    notificationCache.clear();
  } catch (error) {
    console.error("Error in markNotificationAsRead:", error);
    throw error;
  }
};

export const deleteNotification = async (
  notificationId: string,
): Promise<void> => {
  try {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId);

    if (error) {
      console.error("Error deleting notification:", {
        message: error.message,
        code: error.code,
        details: error.details,
      });

      if (error.code === "42P01") {
        throw new Error(
          "Notifications table does not exist. Please run database migrations.",
        );
      }

      throw new Error(`Failed to delete notification: ${error.message}`);
    }

    // Clear cache after deletion
    notificationCache.clear();
  } catch (error) {
    console.error("Error in deleteNotification:", error);
    throw error;
  }
};

// Batch operations for better performance
export const markMultipleAsRead = async (
  notificationIds: string[],
): Promise<void> => {
  if (notificationIds.length === 0) return;

  try {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .in("id", notificationIds);

    if (error) {
      console.error("Error marking multiple notifications as read:", {
        message: error.message,
        code: error.code,
        details: error.details,
      });

      if (error.code === "42P01") {
        throw new Error(
          "Notifications table does not exist. Please run database migrations.",
        );
      }

      throw new Error(`Failed to mark notifications as read: ${error.message}`);
    }

    notificationCache.clear();
  } catch (error) {
    console.error("Error in markMultipleAsRead:", error);
    throw error;
  }
};

export const deleteMultipleNotifications = async (
  notificationIds: string[],
): Promise<void> => {
  if (notificationIds.length === 0) return;

  try {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .in("id", notificationIds);

    if (error) {
      console.error("Error deleting multiple notifications:", error);
      throw error;
    }

    notificationCache.clear();
  } catch (error) {
    console.error("Error in deleteMultipleNotifications:", error);
    throw error;
  }
};

// Utility to clear cache manually
export const clearNotificationCache = (userId?: string): void => {
  if (userId) {
    notificationCache.delete(userId);
  } else {
    notificationCache.clear();
  }
};

// Keep the old export name for backward compatibility
export const clearNotification = deleteNotification;

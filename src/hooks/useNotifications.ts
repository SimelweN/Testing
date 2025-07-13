import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  getNotifications,
  clearNotificationCache,
} from "@/services/notificationService";
import { Database } from "@/integrations/supabase/types";

type Notification = Database["public"]["Tables"]["notifications"]["Row"];

// Global singleton state for notifications to prevent multiple subscriptions
class NotificationManager {
  private static instance: NotificationManager;
  private subscriptionRef: { unsubscribe: () => void } | null = null;
  private subscribingRef: boolean = false;
  private currentUserId: string | null = null;
  private listeners: Set<(notifications: Notification[]) => void> = new Set();
  private notifications: Notification[] = [];

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  addListener(callback: (notifications: Notification[]) => void) {
    this.listeners.add(callback);
    // Immediately call with current data if available
    if (this.notifications.length > 0) {
      callback(this.notifications);
    }
  }

  removeListener(callback: (notifications: Notification[]) => void) {
    this.listeners.delete(callback);
  }

  private notifyListeners() {
    this.listeners.forEach((callback) => callback(this.notifications));
  }

  updateNotifications(notifications: Notification[]) {
    this.notifications = notifications;
    this.notifyListeners();
  }

  get listenersCount() {
    return this.listeners.size;
  }

  setupSubscription(userId: string, refreshCallback: () => Promise<void>) {
    // If we already have a subscription for this user, don't create another
    if (
      this.subscribingRef ||
      (this.subscriptionRef && this.currentUserId === userId)
    ) {
      console.log(
        "[NotificationManager] Subscription already exists for user:",
        userId,
      );
      return;
    }

    // Clean up any existing subscription for a different user
    if (this.subscriptionRef && this.currentUserId !== userId) {
      console.log(
        "[NotificationManager] Switching subscription from",
        this.currentUserId,
        "to",
        userId,
      );
      this.cleanup();
    }

    this.currentUserId = userId;
    this.subscribingRef = true;

    const channelName = `notifications_${userId}_${Date.now()}`;
    console.log(
      "[NotificationManager] Setting up subscription for user:",
      userId,
      "channel:",
      channelName,
    );

    try {
      const channel = supabase.channel(channelName);

      channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log(
            "[NotificationManager] Received event:",
            payload.eventType,
          );
          if (payload.eventType === "INSERT") {
            clearNotificationCache(userId);
            refreshCallback().catch(console.error);
          }
        },
      );

      channel.subscribe((status) => {
        console.log("[NotificationManager] Subscription status:", status);
        if (status === "SUBSCRIBED") {
          this.subscribingRef = false;
        } else if (status === "CHANNEL_ERROR" || status === "CLOSED") {
          this.subscriptionRef = null;
          this.subscribingRef = false;
        }
      });

      this.subscriptionRef = channel;
    } catch (error) {
      console.error(
        "[NotificationManager] Error setting up subscription:",
        error,
      );
      this.subscriptionRef = null;
      this.subscribingRef = false;
    }
  }

  cleanup() {
    if (this.subscriptionRef) {
      try {
        this.subscriptionRef.unsubscribe();
        console.log("[NotificationManager] Cleaned up subscription");
      } catch (error) {
        console.error("[NotificationManager] Error during cleanup:", error);
      } finally {
        this.subscriptionRef = null;
      }
    }
    this.subscribingRef = false;
    this.currentUserId = null;
    this.notifications = [];
  }
}

interface NotificationHookReturn {
  unreadCount: number;
  totalCount: number;
  notifications: Notification[];
  isLoading: boolean;
  hasError: boolean;
  lastError?: string;
  refreshNotifications: () => Promise<void>;
  clearError: () => void;
}

export const useNotifications = (): NotificationHookReturn => {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [lastError, setLastError] = useState<string | undefined>();
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const isInitialLoadRef = useRef(true);
  const refreshingRef = useRef(false); // Prevent concurrent refreshes
  const notificationManager = useRef(NotificationManager.getInstance());

  const MAX_RETRY_ATTEMPTS = 3;
  const RETRY_DELAYS = [5000, 15000, 30000]; // Progressive retry delays

  const clearError = useCallback(() => {
    setHasError(false);
    setLastError(undefined);
    retryCountRef.current = 0;
  }, []);

  const refreshNotifications = useCallback(
    async (isRetry = false) => {
      if (!isAuthenticated || !user) {
        setNotifications([]);
        setHasError(false);
        setLastError(undefined);
        return;
      }

      // Prevent concurrent refresh calls
      if (refreshingRef.current) {
        return;
      }

      refreshingRef.current = true;

      // Only show loading on initial load or manual refresh (not on retries)
      if (!isRetry || isInitialLoadRef.current) {
        setIsLoading(true);
      }

      try {
        const userNotifications = await getNotifications(user.id);

        // Check if we got valid data
        if (Array.isArray(userNotifications)) {
          // Deduplicate notifications by ID to prevent duplicates
          const uniqueNotifications = userNotifications.filter(
            (notification, index, array) =>
              array.findIndex((n) => n.id === notification.id) === index,
          );

          // Additional check to prevent setting duplicate data
          const newNotificationIds = new Set(
            uniqueNotifications.map((n) => n.id),
          );
          const currentNotificationIds = new Set(
            notifications.map((n) => n.id),
          );

          // Only update if the notifications have actually changed
          const hasChanges =
            uniqueNotifications.length !== notifications.length ||
            !Array.from(newNotificationIds).every((id) =>
              currentNotificationIds.has(id),
            );

          if (hasChanges) {
            setNotifications(uniqueNotifications);
            // Update the global manager
            notificationManager.current.updateNotifications(
              uniqueNotifications,
            );
          }
          setHasError(false);
          setLastError(undefined);
          retryCountRef.current = 0;
          isInitialLoadRef.current = false;

          // Clear any pending retry
          if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
            retryTimeoutRef.current = null;
          }
        } else {
          throw new Error("Invalid data format received");
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        console.error(
          `[NotificationHook] Error fetching notifications:`,
          errorMessage,
        );

        // Handle 403 errors with session refresh
        if (
          errorMessage.includes("403") ||
          errorMessage.includes("forbidden")
        ) {
          console.log(
            "[NotificationHook] 403 error detected, attempting session refresh",
          );
          try {
            const {
              data: { session },
            } = await supabase.auth.refreshSession();
            if (session) {
              console.log(
                "[NotificationHook] Session refreshed, retrying notification fetch",
              );
              // Clear error and retry immediately
              setHasError(false);
              setLastError(undefined);
              setTimeout(() => refreshNotifications(true), 1000);
              return;
            }
          } catch (refreshError) {
            console.error(
              "[NotificationHook] Session refresh failed:",
              refreshError,
            );
          }
        }

        // Set user-friendly error state
        setHasError(true);
        setLastError(error instanceof Error ? error : new Error(errorMessage));

        // Only retry on network or temporary errors, not on auth errors
        if (
          errorMessage.includes("network") ||
          errorMessage.includes("timeout") ||
          errorMessage.includes("Failed to fetch")
        ) {
          if (retryCountRef.current < MAX_RETRY_ATTEMPTS) {
            retryCountRef.current++;
            const retryDelay =
              RETRY_DELAYS[retryCountRef.current - 1] ||
              RETRY_DELAYS[RETRY_DELAYS.length - 1];

            console.log(
              `[NotificationHook] Scheduling retry ${retryCountRef.current}/${MAX_RETRY_ATTEMPTS} in ${retryDelay}ms`,
            );

            retryTimeoutRef.current = setTimeout(() => {
              refreshNotifications(true);
            }, retryDelay);
          } else {
            console.warn(
              `[NotificationHook] Max retry attempts reached (${MAX_RETRY_ATTEMPTS})`,
            );
          }
        } else {
          console.warn(
            `[NotificationHook] Non-retryable error: ${errorMessage}`,
          );
        }
      } finally {
        setIsLoading(false);
        refreshingRef.current = false;
      }
    },
    [user, isAuthenticated],
  );

  // Initial load effect with better duplicate prevention
  useEffect(() => {
    if (isAuthenticated && user) {
      // Only refresh if we haven't loaded data for this user yet
      if (isInitialLoadRef.current || notifications.length === 0) {
        refreshNotifications();
      }
    } else {
      // Clear state when user logs out
      setNotifications([]);
      setHasError(false);
      setLastError(undefined);
      retryCountRef.current = 0;
      isInitialLoadRef.current = true;

      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }

      if (subscriptionRetryRef.current) {
        clearTimeout(subscriptionRetryRef.current);
        subscriptionRetryRef.current = null;
      }
    }
  }, [user?.id, isAuthenticated]); // Only depend on user ID and auth status

  // Set up listener for global notification manager
  useEffect(() => {
    const manager = notificationManager.current;

    const handleNotificationUpdate = (newNotifications: Notification[]) => {
      setNotifications(newNotifications);
    };

    // Add this component as a listener
    manager.addListener(handleNotificationUpdate);

    // Set up subscription if user is authenticated
    if (isAuthenticated && user?.id) {
      manager.setupSubscription(user.id, () => refreshNotifications(false));
    } else {
      // Clean up when user logs out
      manager.cleanup();
    }

    // Cleanup function
    return () => {
      manager.removeListener(handleNotificationUpdate);
    };
  }, [user?.id, isAuthenticated]);

  // Cleanup retry timeout and subscription on unmount
  useEffect(() => {
    // Set up periodic cleanup to prevent memory issues
    const cleanupInterval = setInterval(() => {
      // Force garbage collection of old notification data
      if (notifications.length > 200) {
        console.log(
          "[NotificationHook] Cleaning up old notifications for performance",
        );
        setNotifications((prev) => prev.slice(-100)); // Keep only last 100 notifications
      }
    }, 60000); // Every minute

    return () => {
      console.log(
        "[NotificationHook] Component unmounting - cleaning up all resources",
      );

      clearInterval(cleanupInterval);

      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }

      // Clean up global manager when the last component unmounts
      if (notificationManager.current.listenersCount === 0) {
        notificationManager.current.cleanup();
      }

      // Reset state
      refreshingRef.current = false;
      isInitialLoadRef.current = true;
    };
  }, [notifications.length]);

  // Performance optimization: memoize computed values
  const unreadCount = notifications.filter((n) => !n.read).length;
  const totalCount = notifications.length;

  return {
    unreadCount,
    totalCount,
    notifications,
    isLoading,
    hasError,
    lastError,
    refreshNotifications: () => refreshNotifications(false),
    clearError,
  };
};

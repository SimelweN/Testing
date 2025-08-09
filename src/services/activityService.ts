import { supabase } from "@/integrations/supabase/client";

// Define activity types
export type ActivityType =
  | "profile_updated"
  | "purchase"
  | "sale"
  | "listing_created"
  | "login"
  | "banking_updated";

export interface Activity {
  id: string;
  user_id: string;
  type: ActivityType;
  title: string;
  description: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

// Silent activities that don't need notifications
const SILENT_ACTIVITY_TYPES = new Set<ActivityType>(["login"]);

export class ActivityService {
  /**
   * Log a profile update activity
   */
  static async logProfileUpdate(userId: string): Promise<void> {
    try {
      if (!userId) {
        console.warn("❌ No userId provided for profile update logging");
        return;
      }

      // Log to console
      console.log(`📝 Profile updated for user: ${userId}`);

      // Create notification for profile update
      try {
        const { NotificationService } = await import('./notificationService');
        await NotificationService.createNotification({
          userId: userId,
          type: "success",
          title: "Profile Updated",
          message: "Your profile has been successfully updated",
        });
      } catch (notifError) {
        console.warn('Failed to create profile update notification:', notifError);
      }


    } catch (error) {
      console.error("Error logging profile update activity:", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
  }

  /**
   * Log a banking details update activity
   */
  static async logBankingUpdate(userId: string, isUpdate: boolean = true): Promise<void> {
    try {
      if (!userId) {
        console.warn("❌ No userId provided for banking update logging");
        return;
      }

      const title = isUpdate ? "Banking Details Updated" : "Banking Details Added";
      const description = isUpdate
        ? "Your banking information has been successfully updated"
        : "Your banking information has been successfully added";

      // Log to console
      console.log(`🏦 Banking details ${isUpdate ? 'updated' : 'added'} for user: ${userId}`);

      // Log the activity
      const result = await this.logActivity(
        userId,
        "banking_updated",
        title,
        description,
        {
          action: isUpdate ? "update" : "create",
          timestamp: new Date().toISOString(),
          secure: true
        }
      );

      if (result.success) {
        console.log("✅ Banking update activity logged successfully");
      } else {
        console.warn("⚠️ Banking update activity logging failed:", result.error);
      }

    } catch (error) {
      console.error("Error logging banking update activity:", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
  }

  /**
   * Generic activity logging method
   */
  static async logActivity(
    userId: string,
    type: ActivityType,
    title: string,
    description: string,
    metadata?: Record<string, unknown>,
  ): Promise<{ success: boolean; error?: string; details?: unknown }> {
    try {
      // Validate required parameters
      if (!userId || !type || !title || !description) {
        const error = "Missing required parameters for activity logging";
        console.warn("❌ Activity validation failed:", {
          userId: !!userId,
          type: !!type,
          title: !!title,
          description: !!description,
        });
        return { success: false, error };
      }

      // For silent activities, we can create a simple log without notification
      if (SILENT_ACTIVITY_TYPES.has(type)) {
        console.log(`📝 Silent activity logged: ${type} - ${title}`);
        return { success: true };
      }

      // For important activities, create a notification (if table exists)
      try {
        const { error: notificationError } = await supabase
          .from("notifications")
          .insert({
            user_id: userId,
            title: `Activity: ${title}`,
            message: description,
            type: this.getNotificationTypeForActivity(type),
            read: false,
          });

        if (notificationError) {
          // Check if it's a table not found error
          if (
            notificationError.code === "42P01" ||
            notificationError.message?.includes("relation") ||
            notificationError.message?.includes("does not exist") ||
            notificationError.message?.includes("schema cache")
          ) {
            console.log(
              "📝 Notifications table not available, activity logged to console only",
            );
            return { success: true };
          }
          throw notificationError;
        }

        console.log(`✅ Activity notification created: ${type} - ${title}`);
        return { success: true };
      } catch (notificationError) {
        console.warn(
          "⚠️ Failed to create activity notification:",
          notificationError.message || notificationError,
        );
        return {
          success: true, // Don't fail the whole operation for notification issues
          warning: "Notification not created",
        };
      }
    } catch (error) {
      this.logDetailedError("Exception during activity logging", error);
      return {
        success: false,
        error: "Exception occurred during activity logging",
        details: error,
      };
    }
  }

  /**
   * Get user activities by reading from notifications table
   */
  static async getUserActivities(
    userId: string,
    limit: number = 50,
    type?: ActivityType,
  ): Promise<Activity[]> {
    try {
      if (!userId) {
        console.warn("⚠️ No userId provided for getUserActivities");
        return [];
      }

      console.log(`🔄 Fetching activities for user: ${userId}`);

      // Try to get activities from a dedicated activity_logs table first
      try {
        let activitiesQuery = supabase
          .from("activity_logs")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(limit);

        if (type) {
          activitiesQuery = activitiesQuery.eq("type", type);
        }

        const { data: activities, error } = await activitiesQuery;

        if (!error && activities && activities.length > 0) {
          console.log(
            `✅ Found ${activities.length} activities from activity_logs table`,
          );
          return activities.map((activity) => ({
            id: activity.id,
            user_id: activity.user_id,
            type: activity.type,
            title: activity.title,
            description: activity.description,
            metadata: activity.metadata,
            created_at: activity.created_at,
          }));
        }
      } catch (activitiesError) {
        // Activity_logs table might not exist, fall back to notifications
        console.log(
          "Activity_logs table not available, falling back to notifications",
        );
      }

      // Fallback: Get activities from notifications table AND create sample activities
      console.log("🔄 Fetching activities from notifications table...");

      try {
        const notifQuery = supabase
          .from("notifications")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(limit);

        const { data: notifications, error: notifError } = await notifQuery;

        if (notifError) {
          // Check if it's a table not found error
          if (
            notifError.code === "42P01" ||
            notifError.message?.includes("relation") ||
            notifError.message?.includes("does not exist") ||
            notifError.message?.includes("schema cache")
          ) {
            console.log(
              "📝 Notifications table not available, using sample activities",
            );
            return [];
          }

          // Only log errors that aren't table-not-found issues
          console.warn(
            "⚠️ Non-critical error fetching notifications, falling back to sample data:",
            notifError.message || notifError,
          );
          // Return empty array as fallback
          return [];
        }

        console.log(
          `✅ Found ${notifications?.length || 0} activities in notifications table`,
        );

        // If no notifications found, return empty array
        if (!notifications || notifications.length === 0) {
          console.log("No activities found, returning empty array");
          return [];
        }

        // Convert notifications to activities with safety checks
        return (notifications || []).map((notif) => {
          return {
            id: notif.id || `notif-${Date.now()}-${Math.random()}`,
            user_id: notif.user_id || userId,
            type: this.mapNotificationToActivityType(notif.type || "info"),
            title: notif.title || "Activity",
            description:
              notif.message || notif.description || "Activity recorded",
            metadata: {
              notificationId: notif.id,
              read: notif.read || false,
              originalType: notif.type,
            },
            created_at: notif.created_at || new Date().toISOString(),
          };
        });
      } catch (fallbackError) {
        this.logDetailedError(
          "Exception during notifications fallback",
          fallbackError,
        );
        return [];
      }
    } catch (error) {
      this.logDetailedError("Error fetching user activities", error);
      return [];
    }
  }

  /**
   * Helper method to get notification type for activity
   */
  private static getNotificationTypeForActivity(
    activityType: ActivityType,
  ): string {
    const typeMap: Record<ActivityType, string> = {
      profile_updated: "success",
      purchase: "info",
      sale: "success",
      listing_created: "info",
      login: "info",
      banking_updated: "success",
    };
    return typeMap[activityType] || "info";
  }



  /**
   * Maps notification types to activity types
   */
  private static mapNotificationToActivityType(
    notificationType: string,
  ): ActivityType {
    switch (notificationType?.toLowerCase()) {
      case "purchase":
      case "bought":
        return "purchase";
      case "sale":
      case "sold":
        return "sale";
      case "listing":
      case "listing_created":
        return "listing_created";
      case "login":
        return "login";
      case "profile":
      case "profile_updated":
        return "profile_updated";
      case "banking":
      case "banking_updated":
        return "banking_updated";
      default:
        return "profile_updated";
    }
  }

  /**
   * Helper method for detailed error logging
   */
  private static logDetailedError(message: string, error: unknown): void {
    let errorMessage = "Unknown error";
    let errorDetails = null;
    let errorStack = null;

    if (error instanceof Error) {
      errorMessage = error.message;
      errorStack = error.stack;
    } else if (typeof error === "object" && error !== null) {
      // Handle Supabase errors and other objects
      const errorObj = error as any;
      errorMessage =
        errorObj.message ||
        errorObj.error_description ||
        errorObj.msg ||
        "Database operation failed";
      errorDetails = errorObj.details || errorObj.hint || errorObj.code;
      errorStack = errorObj.stack;

      // Better logging for debugging
      try {
        console.error(
          `❌ ${message} - Full error object:`,
          JSON.stringify(error, null, 2),
        );
      } catch (stringifyError) {
        console.error(`❌ ${message} - Error object (unstringifiable):`, error);
      }
    } else if (typeof error === "string") {
      errorMessage = error;
    } else {
      errorMessage = String(error);
    }

    console.error(`❌ ${message}:`, {
      message: errorMessage,
      details: errorDetails,
      stack: errorStack,
      timestamp: new Date().toISOString(),
      originalError: import.meta.env.DEV ? error : undefined, // Only log full error in development
    });
  }
}

import { toast } from "sonner";
import { deleteMultipleNotifications } from "@/services/notificationService";
import { supabase } from "@/lib/supabase";

/**
 * Safe wrapper for deleting notifications with user-friendly error handling
 */
export const safeDeleteNotifications = async (
  notificationIds: string[]
): Promise<boolean> => {
  if (notificationIds.length === 0) {
    toast.info("No notifications to delete");
    return true;
  }

  try {
    await deleteMultipleNotifications(notificationIds);
    toast.success(`Successfully deleted ${notificationIds.length} notification${notificationIds.length === 1 ? '' : 's'}`);
    return true;
  } catch (error) {
    console.error("Error deleting notifications:", error);
    
    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch')) {
        toast.error("Network error: Unable to delete notifications. Please check your connection and try again.");
      } else if (error.message.includes('timeout')) {
        toast.error("Request timed out. Please try deleting fewer notifications at once.");
      } else if (error.message.includes('aborted')) {
        toast.error("Delete operation was cancelled. Please try again.");
      } else {
        toast.error(`Failed to delete notifications: ${error.message}`);
      }
    } else {
      toast.error("An unexpected error occurred while deleting notifications.");
    }
    
    return false;
  }
};

/**
 * Safe wrapper for deleting all notifications with confirmation
 */
export const safeDeleteAllNotifications = async (): Promise<boolean> => {
  const confirmed = window.confirm(
    "⚠️ Are you sure you want to delete ALL notifications? This cannot be undone."
  );
  
  if (!confirmed) return false;

  try {
    // Get all notification IDs first (safer than bulk delete)
    const { data: notifications, error: fetchError } = await supabase
      .from("notifications")
      .select("id")
      .limit(1000); // Reasonable batch size

    if (fetchError) {
      throw new Error(`Failed to fetch notifications: ${fetchError.message}`);
    }

    if (!notifications || notifications.length === 0) {
      toast.info("No notifications to delete");
      return true;
    }

    const notificationIds = notifications.map(n => n.id);
    return await safeDeleteNotifications(notificationIds);
  } catch (error) {
    console.error("Error deleting all notifications:", error);
    
    if (error instanceof Error) {
      toast.error(`Failed to delete all notifications: ${error.message}`);
    } else {
      toast.error("An unexpected error occurred while deleting all notifications.");
    }
    
    return false;
  }
};

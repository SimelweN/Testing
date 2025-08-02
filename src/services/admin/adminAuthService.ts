import { supabase } from "@/integrations/supabase/client";
import { logError, getErrorMessage } from "@/utils/errorUtils";
import { verifyAdminStatus } from "@/utils/adminVerification";

export const isAdminUser = async (userId: string): Promise<boolean> => {
  try {
    console.log("🔍 Checking admin status for user:", userId);

    if (!userId) {
      console.log("❌ No userId provided for admin check");
      return false;
    }

    // Use the improved verification utility that doesn't generate false errors
    const isAdmin = await verifyAdminStatus(userId);

    if (isAdmin) {
      console.log("🔐 Admin user detected:", userId);
    } else {
      console.log("👤 Regular user (not admin):", userId);
    }

    return isAdmin;
  } catch (error) {
    // Only log if it's an actual unexpected error
    console.warn("⚠️ Unexpected error during admin check, assuming non-admin");
    logError("Unexpected error in isAdminUser", error);
    return false;
  }
};

export const logAdminAction = async (
  adminId: string,
  actionType: string,
  targetId?: string,
  targetType?: string,
  description?: string,
) => {
  try {
    // Log admin action as notification
    const { NotificationService } = await import('../notificationService');
    const success = await NotificationService.createNotification({
      userId: adminId,
      type: "info",
      title: `Admin Action: ${actionType}`,
      message: description || `Admin performed ${actionType} on ${targetType}: ${targetId}`,
    });

    if (success) {
      console.log(`📝 Admin action logged: ${actionType}`);
    } else {
      console.warn(`⚠️ Failed to log admin action: ${actionType}`);
    }
  } catch (error) {
    console.error("Error in admin action logging:", error);
  }
};

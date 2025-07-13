import { supabase } from "@/integrations/supabase/client";
import { logDatabaseError } from "@/utils/errorUtils";
import { BookDeletionService } from "@/services/bookDeletionService";

export const updateUserStatus = async (
  userId: string,
  status: string,
): Promise<void> => {
  try {
    const { error } = await supabase
      .from("profiles")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) {
      console.error("Error updating user status:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error in updateUserStatus:", error);
    throw new Error("Failed to update user status");
  }
};

export const deleteBookListing = async (
  bookId: string,
  adminId?: string,
): Promise<void> => {
  try {
    // Use the enhanced deletion service that sends notifications
    await BookDeletionService.deleteBookWithNotification(
      bookId,
      "admin_action",
      adminId,
    );
  } catch (error) {
    console.error("Error in deleteBookListing:", error);
    throw new Error("Failed to delete book listing");
  }
};

export const sendBroadcastMessage = async (message: string): Promise<void> => {
  try {
    console.log("Attempting to send broadcast message:", message);

    // Get all users first
    const { data: users, error: usersError } = await supabase
      .from("profiles")
      .select("id")
      .neq("status", "deleted")
      .limit(1000); // Limit to prevent overwhelming the system

    if (usersError) {
      logDatabaseError("sendBroadcastMessage - fetch users", usersError);
      throw usersError;
    }

    if (!users || users.length === 0) {
      throw new Error("No users found to send broadcast to");
    }

    console.log(`Broadcasting to ${users.length} users`);

    // Try to check if notifications table exists first
    const { data: tableCheck, error: tableError } = await supabase
      .from("notifications")
      .select("id")
      .limit(1);

    if (tableError && tableError.code === "42P01") {
      // Table doesn't exist - log this and provide alternative
      console.warn(
        "Notifications table does not exist. Broadcast message logged but not stored.",
      );
      console.log("BROADCAST MESSAGE:", {
        message,
        timestamp: new Date().toISOString(),
        userCount: users.length,
        recipients: users.map((u) => u.id),
      });

      // For now, just log that the message would be sent
      // In the future, you might want to use a different notification system
      return;
    }

    // Try the most common notification types first
    const commonTypes = ["info", "warning", "success"];
    let successfulType = null;

    for (const tryType of commonTypes) {
      try {
        // Test with one user first
        const testNotification = {
          user_id: users[0].id,
          title: "System Announcement",
          message: message,
          type: tryType,
        };

        const { error: testError } = await supabase
          .from("notifications")
          .insert([testNotification]);

        if (!testError) {
          // This type works, clean up test record and use it
          await supabase
            .from("notifications")
            .delete()
            .eq("user_id", users[0].id)
            .eq("message", message)
            .eq("type", tryType);

          successfulType = tryType;
          console.log(`Using notification type: ${tryType}`);
          break;
        }
      } catch (error) {
        continue; // Try next type
      }
    }

    if (!successfulType) {
      // No types worked, fall back to logging
      console.warn(
        "No valid notification types found. Logging broadcast instead.",
      );
      console.log("BROADCAST MESSAGE (TYPE CONSTRAINT ISSUE):", {
        message,
        timestamp: new Date().toISOString(),
        userCount: users.length,
        testedTypes: commonTypes,
      });
      return;
    }

    // Create notifications for all users with the successful type
    const notifications = users.map((user) => ({
      user_id: user.id,
      title: "System Announcement",
      message: message,
      type: successfulType,
    }));

    // Insert in batches to avoid overwhelming the database
    const batchSize = 100;
    for (let i = 0; i < notifications.length; i += batchSize) {
      const batch = notifications.slice(i, i + batchSize);

      const { error: notificationError } = await supabase
        .from("notifications")
        .insert(batch);

      if (notificationError) {
        logDatabaseError(
          "sendBroadcastMessage - insert notifications batch",
          notificationError,
          {
            batchIndex: Math.floor(i / batchSize),
            batchSize: batch.length,
          },
        );
        throw notificationError;
      }
    }

    console.log(
      "Broadcast message sent successfully to",
      users.length,
      "users",
    );
  } catch (error) {
    console.error("Error in sendBroadcastMessage:", error);
    throw new Error("Failed to send broadcast message");
  }
};

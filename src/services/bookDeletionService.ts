import { supabase } from "@/integrations/supabase/client";
import { addNotification } from "./notificationService";
import { logError } from "@/utils/errorUtils";

export interface BookDeletionNotificationData {
  bookId: string;
  bookTitle: string;
  sellerId: string;
  reason: "admin_action" | "violation_reports" | "content_policy";
  adminId?: string;
}

/**
 * Service to handle book deletion notifications
 */
export class BookDeletionService {
  /**
   * Send notification when a book listing is deleted
   */
  static async notifyBookDeletion(
    data: BookDeletionNotificationData,
  ): Promise<void> {
    try {
      console.log("Sending book deletion notification:", data);

      // Prepare notification message based on deletion reason
      const subject = "Book Listing Removed";
      let message = `Your book listing "${data.bookTitle}" has been removed because it did not comply with ReBooked Solutions' guidelines outlined in our Terms and Conditions.\n\n`;

      if (data.reason === "violation_reports") {
        message +=
          "This may be due to multiple user reports or a violation of our content policies. ";
      } else if (data.reason === "admin_action") {
        message += "This action was taken by our moderation team. ";
      } else if (data.reason === "content_policy") {
        message += "This may be due to a violation of our content policies. ";
      }

      message +=
        "You may list the book again if it meets our standards.\n\nThank you for understanding.";

      // Send in-app notification
      await addNotification({
        userId: data.sellerId,
        title: subject,
        message: message,
        type: "warning",
        read: false,
      });

      // Log the notification for potential email/push notification processing
      console.log("Book deletion notification sent successfully:", {
        sellerId: data.sellerId,
        bookTitle: data.bookTitle,
        reason: data.reason,
      });
    } catch (error) {
      logError("BookDeletionService.notifyBookDeletion", error, {
        bookId: data.bookId,
        sellerId: data.sellerId,
      });
      throw new Error("Failed to send book deletion notification");
    }
  }

  /**
   * Delete a book and send notification to seller
   */
  static async deleteBookWithNotification(
    bookId: string,
    reason: "admin_action" | "violation_reports" | "content_policy",
    adminId?: string,
  ): Promise<void> {
    try {
      console.log("Deleting book with notification:", {
        bookId,
        reason,
        adminId,
      });

      // First, get book details before deletion
      const { data: book, error: bookError } = await supabase
        .from("books")
        .select("id, title, seller_id")
        .eq("id", bookId)
        .single();

      if (bookError) {
        logError(
          "BookDeletionService.deleteBookWithNotification - fetch book",
          bookError,
        );
        throw new Error("Failed to fetch book details before deletion");
      }

      if (!book) {
        throw new Error("Book not found");
      }

      // Delete the book directly
      const { error: deleteError } = await supabase
        .from("books")
        .delete()
        .eq("id", bookId);

      if (deleteError) {
        logError(
          "BookDeletionService.deleteBookWithNotification - delete",
          deleteError,
        );
        throw new Error(`Failed to delete book: ${deleteError.message}`);
      }

      // Send notification to the seller
      try {
        await BookDeletionService.notifyBookDeletion({
          bookId: book.id,
          bookTitle: book.title,
          sellerId: book.seller_id,
          reason,
          adminId,
        });
      } catch (notificationError) {
        console.warn(
          "Book deleted but notification failed:",
          notificationError,
        );
        // Don't fail the entire operation if notification fails
      }

      console.log("Book deleted and notification sent successfully:", bookId);
    } catch (error) {
      logError("BookDeletionService.deleteBookWithNotification", error, {
        bookId,
        reason,
        adminId,
      });
      throw error;
    }
  }

  /**
   * Check if a user has pickup address for listing validation
   */
  static async validateUserCanListBooks(userId: string): Promise<{
    canList: boolean;
    message?: string;
  }> {
    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("pickup_address")
        .eq("id", userId)
        .single();

      if (error) {
        logError("BookDeletionService.validateUserCanListBooks", error, {
          userId,
        });
        return {
          canList: false,
          message: "Unable to verify profile information",
        };
      }

      if (!profile?.pickup_address) {
        return {
          canList: false,
          message: "You need to add a pickup address before listing a book.",
        };
      }

      // Check if pickup address has required fields
      const pickupAddr = profile.pickup_address as any;
      if (
        !pickupAddr.streetAddress ||
        !pickupAddr.city ||
        !pickupAddr.province ||
        !pickupAddr.postalCode
      ) {
        return {
          canList: false,
          message:
            "Please complete your pickup address information before listing a book.",
        };
      }

      return { canList: true };
    } catch (error) {
      logError("BookDeletionService.validateUserCanListBooks", error, {
        userId,
      });
      return {
        canList: false,
        message: "Unable to verify pickup address",
      };
    }
  }

  /**
   * Deactivate all user listings when pickup address is removed
   */
  static async deactivateUserListings(userId: string): Promise<void> {
    try {
      console.log("Deactivating all listings for user:", userId);

      // Update all active listings to be unavailable
      const { error: updateError } = await supabase
        .from("books")
        .update({
          status: "unavailable",
          updated_at: new Date().toISOString(),
        })
        .eq("seller_id", userId)
        .eq("sold", false);

      if (updateError) {
        logError(
          "BookDeletionService.deactivateUserListings - update books",
          updateError,
        );
        throw new Error("Failed to deactivate user listings");
      }

      // Send notification to user about deactivated listings
      await addNotification({
        userId,
        title: "Listings Deactivated",
        message:
          "Your listing is currently unavailable because you removed your pickup address. Please add a pickup address to reactivate your listing(s).",
        type: "warning",
        read: false,
      });

      console.log("Successfully deactivated all listings for user:", userId);
    } catch (error) {
      logError("BookDeletionService.deactivateUserListings", error, {
        userId,
      });
      throw error;
    }
  }

  /**
   * Reactivate user listings when pickup address is added back
   */
  static async reactivateUserListings(userId: string): Promise<void> {
    try {
      console.log("Reactivating listings for user:", userId);

      // Update unavailable listings back to active
      const { error: updateError } = await supabase
        .from("books")
        .update({
          status: "active",
          updated_at: new Date().toISOString(),
        })
        .eq("seller_id", userId)
        .eq("status", "unavailable")
        .eq("sold", false);

      if (updateError) {
        logError(
          "BookDeletionService.reactivateUserListings - update books",
          updateError,
        );
        throw new Error("Failed to reactivate user listings");
      }

      // Send positive notification
      await addNotification({
        userId,
        title: "Listings Reactivated",
        message:
          "Your listings have been reactivated now that you have added a pickup address.",
        type: "success",
        read: false,
      });

      console.log("Successfully reactivated listings for user:", userId);
    } catch (error) {
      logError("BookDeletionService.reactivateUserListings", error, {
        userId,
      });
      throw error;
    }
  }
}

export default BookDeletionService;

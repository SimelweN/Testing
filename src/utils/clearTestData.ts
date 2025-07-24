import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Clears all test/demo data from the orders table
 * This includes orders with:
 * - No book title (showing as "Unknown Book")
 * - Undefined buyer/seller names
 * - Test order IDs with specific patterns
 */
export const clearAllTestData = async (): Promise<boolean> => {
  try {
    console.log("🗑️ Starting to clear test data...");

    // Delete orders where book title is null/empty or buyer/seller names are null
    const { error: ordersError, count } = await supabase
      .from("orders")
      .delete({ count: "exact" })
      .or(
        "book_id.is.null," +
        "buyer_id.is.null," +
        "seller_id.is.null," +
        "total_amount.is.null," +
        "total_amount.eq.0"
      );

    if (ordersError) {
      console.error("Error deleting test orders:", {
        message: ordersError.message,
        details: ordersError.details,
        hint: ordersError.hint,
        code: ordersError.code
      });
      toast.error("Failed to clear test orders: " + (ordersError.message || ordersError.details || "Unknown error"));
      return false;
    }

    console.log(`🗑️ Deleted ${count} test orders`);

    // Also delete any orders with specific test patterns - using individual queries to avoid complex OR syntax
    let totalPatternCount = 0;
    const testOrderIds = [
      "2480907b", "b327b100", "5bb5a0c3", "8e1acd99", "d4e850bb",
      "dcbc8287", "7b8aa076", "9d6a6c72", "62d0eafa", "d162836e",
      "ca22899e", "a4b2aeb1", "56656692", "a6812da3", "9db2dae7",
      "f6dffab3", "f35d4f5e", "56014b83", "d2afffbc", "bbccd49d",
      "2003aa6c", "ecff28c9", "e81559e6", "2bfa5fd3", "38803ce8"
    ];

    for (const orderId of testOrderIds) {
      try {
        const { error: patternError, count: patternCount } = await supabase
          .from("orders")
          .delete({ count: "exact" })
          .ilike("id", `%${orderId}%`);

        if (patternError) {
          console.error(`Error deleting order ${orderId}:`, {
            message: patternError.message,
            details: patternError.details,
            hint: patternError.hint,
            code: patternError.code
          });
        } else if (patternCount && patternCount > 0) {
          console.log(`🗑️ Deleted ${patternCount} orders matching ${orderId}`);
          totalPatternCount += patternCount;
        }
      } catch (err) {
        console.error(`Exception deleting order ${orderId}:`, err);
      }
    }

    // Clear any notifications related to test data
    let notifCount = 0;
    try {
      const { error: notifError, count: notifDeleteCount } = await supabase
        .from("notifications")
        .delete({ count: "exact" })
        .or(
          "title.ilike.%unknown book%," +
          "message.ilike.%undefined%," +
          "title.ilike.%system announcement%"
        );

      if (notifError) {
        console.error("Error deleting test notifications:", {
          message: notifError.message,
          details: notifError.details,
          hint: notifError.hint,
          code: notifError.code
        });
        // Don't fail the whole operation for notification errors
      } else {
        notifCount = notifDeleteCount || 0;
        if (notifCount > 0) {
          console.log(`🗑️ Deleted ${notifCount} test notifications`);
        }
      }
    } catch (err) {
      console.error("Exception deleting notifications:", err);
    }

    const totalDeleted = (count || 0) + totalPatternCount;
    
    if (totalDeleted > 0) {
      toast.success(`Successfully cleared ${totalDeleted} test orders and ${notifCount || 0} test notifications`);
    } else {
      toast.info("No test data found to clear");
    }

    console.log("✅ Test data clearing completed");
    return true;

  } catch (error) {
    console.error("Fatal error clearing test data:", error);
    const errorMessage = error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : JSON.stringify(error);
    toast.error("Failed to clear test data: " + errorMessage);
    return false;
  }
};

/**
 * Clears all data for the current user (more aggressive cleanup)
 */
export const clearAllUserData = async (userId: string): Promise<boolean> => {
  try {
    console.log("🗑️ Starting to clear all user data...");

    // Delete all orders for this user
    const { error: ordersError, count: orderCount } = await supabase
      .from("orders")
      .delete({ count: "exact" })
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);

    if (ordersError) {
      console.error("Error deleting user orders:", ordersError);
      toast.error("Failed to clear orders: " + ordersError.message);
      return false;
    }

    // Delete all notifications for this user
    const { error: notifError, count: notifCount } = await supabase
      .from("notifications")
      .delete({ count: "exact" })
      .eq("user_id", userId);

    if (notifError) {
      console.error("Error deleting user notifications:", notifError);
    }

    const totalDeleted = (orderCount || 0) + (notifCount || 0);
    toast.success(`Successfully cleared all user data: ${orderCount || 0} orders and ${notifCount || 0} notifications`);
    
    console.log("✅ User data clearing completed");
    return true;

  } catch (error) {
    console.error("Fatal error clearing user data:", error);
    toast.error("Failed to clear user data: " + (error as Error).message);
    return false;
  }
};

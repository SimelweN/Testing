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
      console.error("Error deleting test orders:", ordersError);
      toast.error("Failed to clear test orders: " + ordersError.message);
      return false;
    }

    console.log(`🗑️ Deleted ${count} test orders`);

    // Also delete any orders with specific test patterns
    const { error: patternError, count: patternCount } = await supabase
      .from("orders")
      .delete({ count: "exact" })
      .like("id", "%2480907b%")
      .or("id.like.%b327b100%,id.like.%5bb5a0c3%,id.like.%8e1acd99%,id.like.%d4e850bb%");

    if (patternError) {
      console.error("Error deleting pattern orders:", patternError);
    } else {
      console.log(`🗑️ Deleted ${patternCount} pattern-matched orders`);
    }

    // Clear any notifications related to test data
    const { error: notifError, count: notifCount } = await supabase
      .from("notifications")
      .delete({ count: "exact" })
      .or(
        "title.ilike.%unknown book%," +
        "message.ilike.%undefined%," +
        "title.ilike.%system announcement%"
      );

    if (notifError) {
      console.error("Error deleting test notifications:", notifError);
    } else {
      console.log(`🗑️ Deleted ${notifCount} test notifications`);
    }

    const totalDeleted = (count || 0) + (patternCount || 0);
    
    if (totalDeleted > 0) {
      toast.success(`Successfully cleared ${totalDeleted} test orders and ${notifCount || 0} test notifications`);
    } else {
      toast.info("No test data found to clear");
    }

    console.log("✅ Test data clearing completed");
    return true;

  } catch (error) {
    console.error("Fatal error clearing test data:", error);
    toast.error("Failed to clear test data: " + (error as Error).message);
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

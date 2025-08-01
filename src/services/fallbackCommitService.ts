import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface CommitData {
  order_id: string;
  seller_id: string;
  delivery_method?: "home" | "locker";
  locker_id?: string;
}

interface CommitResult {
  success: boolean;
  error?: string;
  data?: any;
}

/**
 * Fallback commit service that directly updates the database
 * when edge functions are unavailable
 */
export class FallbackCommitService {
  
  static async commitToSale(commitData: CommitData): Promise<CommitResult> {
    try {
      console.log("🔄 Using fallback commit service...");
      
      const { order_id, seller_id, delivery_method = "home", locker_id } = commitData;

      // Validate inputs
      if (!order_id || !seller_id) {
        return {
          success: false,
          error: "Missing required fields: order_id or seller_id"
        };
      }

      // Get current order to verify permissions
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", order_id)
        .eq("seller_id", seller_id)
        .single();

      if (orderError || !order) {
        console.error("Order not found or access denied:", orderError);
        return {
          success: false,
          error: "Order not found or access denied"
        };
      }

      // Check if already committed
      if (order.status === "committed" || order.status === "shipped") {
        return {
          success: false,
          error: "Order is already committed"
        };
      }

      // Prepare update data
      const updateData: any = {
        status: "committed",
        delivery_method: delivery_method,
        committed_at: new Date().toISOString(),
      };

      // Add locker-specific data
      if (delivery_method === "locker" && locker_id) {
        updateData.locker_id = locker_id;
        // Set earlier payment date (3 days earlier)
        const paymentDate = new Date();
        paymentDate.setDate(paymentDate.getDate() + 4); // 7 days standard - 3 days = 4 days
        updateData.estimated_payment_date = paymentDate.toISOString();
      }

      // Update order status
      const { data: updatedOrder, error: updateError } = await supabase
        .from("orders")
        .update(updateData)
        .eq("id", order_id)
        .select()
        .single();

      if (updateError) {
        console.error("Failed to update order:", updateError);
        return {
          success: false,
          error: "Failed to update order status"
        };
      }

      // Create notification for buyer (if notifications table exists)
      try {
        const notificationMessage = delivery_method === "locker" 
          ? `Your order has been committed with locker delivery. You'll receive tracking information soon.`
          : `Your order has been committed. Courier pickup has been scheduled.`;

        await supabase
          .from("notifications")
          .insert({
            user_id: order.buyer_id,
            title: "✅ Order Committed",
            message: notificationMessage,
            type: "success",
            metadata: {
              order_id: order_id,
              delivery_method: delivery_method,
              ...(locker_id && { locker_id })
            }
          });
      } catch (notifError) {
        console.warn("Could not create notification (non-critical):", notifError);
      }

      console.log("✅ Fallback commit completed successfully");

      return {
        success: true,
        data: {
          order: updatedOrder,
          message: `Order committed with ${delivery_method} delivery`,
          delivery_method: delivery_method
        }
      };

    } catch (error) {
      console.error("❌ Fallback commit service error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      };
    }
  }

  /**
   * Check if edge functions are available
   */
  static async testEdgeFunctionAvailability(): Promise<boolean> {
    try {
      const { error } = await supabase.functions.invoke("health-test", {
        body: { test: true },
      });
      
      return !error;
    } catch (error) {
      console.log("Edge functions not available:", error);
      return false;
    }
  }

  /**
   * Get commit method recommendation based on service availability
   */
  static async getRecommendedCommitMethod(): Promise<"edge-function" | "fallback"> {
    const edgeFunctionsAvailable = await this.testEdgeFunctionAvailability();
    return edgeFunctionsAvailable ? "edge-function" : "fallback";
  }
}

export default FallbackCommitService;

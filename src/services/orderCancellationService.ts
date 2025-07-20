import { supabase } from "@/integrations/supabase/client";
import { emailService } from "@/services/emailService";
import { addNotification } from "@/services/notificationService";
import { RefundService } from "@/services/refundService";

export interface Order {
  id: string;
  buyer_id: string;
  seller_id: string;
  book_id: string;
  status: string;
  delivery_status?: string;
  courier_booking_id?: string;
  courier_service?: string;
  pickup_scheduled_at?: string;
  total_amount: number;
  created_at: string;
  buyer?: {
    id: string;
    name: string;
    email: string;
  };
  seller?: {
    id: string;
    name: string;
    email: string;
  };
  book?: {
    title: string;
    isbn?: string;
  };
}

export interface CancellationResult {
  success: boolean;
  message: string;
  refund_amount?: number;
  error?: string;
}

export interface RescheduleQuote {
  courier_service: string;
  reschedule_fee: number;
  available_times: string[];
  quote_id: string;
}

export class OrderCancellationService {
  /**
   * Buyer cancels delivery before courier pickup
   */
    static async cancelDeliveryByBuyer(
    orderId: string,
    reason?: string,
  ): Promise<CancellationResult> {
    try {
      console.log(`🔁 Processing buyer cancellation for order ${orderId}`);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Use the new edge function for comprehensive cancellation handling
      const { data, error } = await supabase.functions.invoke('cancel-order', {
        body: {
          order_id: orderId,
          buyer_id: user.id,
          cancellation_reason: reason,
        },
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        return {
          success: false,
          message: data.error || "Cancellation failed",
        };
      }

            return {
        success: true,
        message: data.message || "Order cancelled successfully",
        refund_amount: data.refund_amount,
      };
    } catch (error) {
      console.error("Order cancellation failed:", error);
      return {
        success: false,
        message: "Failed to cancel order",
        error: error.message,
      };
        }
  }

      return {
        success: true,
        message:
          "Order cancelled successfully. Full refund will be processed within 3-5 business days.",
        refund_amount: order.total_amount,
      };
    } catch (error) {
      console.error("❌ Buyer cancellation failed:", error);
      return {
        success: false,
        message: "Failed to cancel order. Please contact support.",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Seller declines the commit
   */
  static async declineCommitBySeller(
    orderId: string,
    reason?: string,
  ): Promise<CancellationResult> {
    try {
      console.log(`❌ Processing seller decline for order ${orderId}`);

      const { data: order, error: fetchError } = await supabase
        .from("orders")
        .select(
          `
          *,
          buyer:profiles!buyer_id(id, name, email),
          seller:profiles!seller_id(id, name, email),
          book:books(title, isbn)
        `,
        )
        .eq("id", orderId)
        .single();

      if (fetchError || !order) {
        throw new Error("Order not found");
      }

      // Cancel delivery booking if exists
      if (order.courier_booking_id) {
        await this.cancelCourierBooking(
          order.courier_service,
          order.courier_booking_id,
        );
      }

      // Process full refund
      const refundResult = await this.processRefund(
        order.id,
        order.total_amount,
      );
      if (!refundResult.success) {
        throw new Error(`Refund failed: ${refundResult.error}`);
      }

      // Update order status
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          status: "declined_by_seller",
          declined_at: new Date().toISOString(),
          decline_reason: reason || "Seller declined the commit",
        })
        .eq("id", orderId);

      if (updateError) {
        throw new Error("Failed to update order status");
      }

      // Send notifications
      await this.notifyBuyerOfSellerDecline(order, reason);
      await this.notifySellerDeclineConfirmation(order);

      // Log activity
      await this.logCancellationActivity(orderId, "seller_declined", {
        reason,
        refund_amount: order.total_amount,
      });

      console.log(`✅ Seller decline completed for order ${orderId}`);

      return {
        success: true,
        message:
          "Order declined. Buyer has been notified and will receive a full refund.",
        refund_amount: order.total_amount,
      };
    } catch (error) {
      console.error("❌ Seller decline failed:", error);
      return {
        success: false,
        message: "Failed to decline order. Please contact support.",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Handle missed courier pickup
   */
  static async handleMissedPickup(
    orderId: string,
    courierFeedback?: string,
  ): Promise<CancellationResult> {
    try {
      console.log(`⚠️ Processing missed pickup for order ${orderId}`);

      const { data: order, error: fetchError } = await supabase
        .from("orders")
        .select(
          `
          *,
          buyer:profiles!buyer_id(id, name, email),
          seller:profiles!seller_id(id, name, email),
          book:books(title, isbn)
        `,
        )
        .eq("id", orderId)
        .single();

      if (fetchError || !order) {
        throw new Error("Order not found");
      }

      // Update delivery status
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          delivery_status: "pickup_failed",
          pickup_failed_at: new Date().toISOString(),
          pickup_failure_reason:
            courierFeedback || "Seller was not available for pickup",
        })
        .eq("id", orderId);

      if (updateError) {
        throw new Error("Failed to update delivery status");
      }

      // Notify seller about missed pickup
      await this.notifySellerMissedPickup(order);

      // Notify buyer about delay
      await this.notifyBuyerOfPickupDelay(order);

      // Log activity
      await this.logCancellationActivity(orderId, "pickup_missed", {
        courier_feedback: courierFeedback,
      });

      console.log(`✅ Missed pickup handling completed for order ${orderId}`);

      return {
        success: true,
        message:
          "Pickup failure recorded. Seller has been notified to take action.",
      };
    } catch (error) {
      console.error("❌ Missed pickup handling failed:", error);
      return {
        success: false,
        message: "Failed to handle missed pickup. Please contact support.",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get reschedule quote for missed pickup
   */
  static async getRescheduleQuote(
    orderId: string,
  ): Promise<RescheduleQuote | null> {
    try {
      console.log(`🎯 Getting reschedule quote for order ${orderId}`);

      const { data: order, error: fetchError } = await supabase
        .from("orders")
        .select(
          `
          *,
          delivery_info
        `,
        )
        .eq("id", orderId)
        .single();

      if (fetchError || !order) {
        throw new Error("Order not found");
      }

      // Get quote from courier service
      const quote = await this.getCourierRescheduleQuote(
        order.courier_service,
        order.delivery_info,
      );

      return quote;
    } catch (error) {
      console.error("❌ Failed to get reschedule quote:", error);
      return null;
    }
  }

  /**
   * Process pickup rescheduling with fee payment
   */
  static async reschedulePickup(
    orderId: string,
    newPickupTime: string,
    paymentReference: string,
  ): Promise<CancellationResult> {
    try {
      console.log(`🔁 Processing pickup reschedule for order ${orderId}`);

      const { data: order, error: fetchError } = await supabase
        .from("orders")
        .select(
          `
          *,
          buyer:profiles!buyer_id(id, name, email),
          seller:profiles!seller_id(id, name, email),
          book:books(title, isbn)
        `,
        )
        .eq("id", orderId)
        .single();

      if (fetchError || !order) {
        throw new Error("Order not found");
      }

      // Verify payment for reschedule fee
      const paymentVerified =
        await this.verifyReschedulePayment(paymentReference);
      if (!paymentVerified) {
        throw new Error("Reschedule fee payment not verified");
      }

      // Rebook with courier
      const rebookResult = await this.rebookCourierPickup(
        order.courier_service,
        order.courier_booking_id,
        newPickupTime,
      );

      if (!rebookResult.success) {
        throw new Error("Failed to rebook with courier service");
      }

      // Update order
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          delivery_status: "rescheduled_by_seller",
          pickup_scheduled_at: newPickupTime,
          rescheduled_at: new Date().toISOString(),
          courier_booking_id: rebookResult.new_booking_id,
        })
        .eq("id", orderId);

      if (updateError) {
        throw new Error("Failed to update order");
      }

      // Notify both parties
      await this.notifyRescheduleSuccess(order, newPickupTime);

      // Log activity
      await this.logCancellationActivity(orderId, "pickup_rescheduled", {
        new_pickup_time: newPickupTime,
        payment_reference: paymentReference,
      });

      console.log(`✅ Pickup rescheduled successfully for order ${orderId}`);

      return {
        success: true,
        message: `Pickup rescheduled successfully for ${new Date(newPickupTime).toLocaleDateString()}`,
      };
    } catch (error) {
      console.error("❌ Pickup reschedule failed:", error);
      return {
        success: false,
        message: "Failed to reschedule pickup. Please contact support.",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Seller cancels after missed pickup
   */
  static async cancelAfterMissedPickup(
    orderId: string,
    reason?: string,
  ): Promise<CancellationResult> {
    try {
      console.log(
        `🛑 Processing seller cancellation after missed pickup for order ${orderId}`,
      );

      const { data: order, error: fetchError } = await supabase
        .from("orders")
        .select(
          `
          *,
          buyer:profiles!buyer_id(id, name, email),
          seller:profiles!seller_id(id, name, email),
          book:books(title, isbn)
        `,
        )
        .eq("id", orderId)
        .single();

      if (fetchError || !order) {
        throw new Error("Order not found");
      }

      // Cancel delivery
      if (order.courier_booking_id) {
        await this.cancelCourierBooking(
          order.courier_service,
          order.courier_booking_id,
        );
      }

      // Process full refund
      const refundResult = await this.processRefund(
        order.id,
        order.total_amount,
      );
      if (!refundResult.success) {
        throw new Error(`Refund failed: ${refundResult.error}`);
      }

      // Update order status
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          status: "cancelled_by_seller_after_missed_pickup",
          cancelled_at: new Date().toISOString(),
          cancellation_reason:
            reason || "Seller cancelled after missing pickup",
        })
        .eq("id", orderId);

      if (updateError) {
        throw new Error("Failed to update order status");
      }

      // Send notifications
      await this.notifyBuyerOfSellerCancellation(order, reason);
      await this.notifySellerCancellationConfirmation(order);

      // Check for repeated missed pickups and warn seller
      await this.checkSellerReliability(order.seller_id);

      // Log activity
      await this.logCancellationActivity(
        orderId,
        "seller_cancelled_after_missed_pickup",
        {
          reason,
          refund_amount: order.total_amount,
        },
      );

      console.log(
        `✅ Seller cancellation after missed pickup completed for order ${orderId}`,
      );

      return {
        success: true,
        message:
          "Order cancelled. Buyer has been notified and will receive a full refund.",
        refund_amount: order.total_amount,
      };
    } catch (error) {
      console.error(
        "❌ Seller cancellation after missed pickup failed:",
        error,
      );
      return {
        success: false,
        message: "Failed to cancel order. Please contact support.",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Helper methods

  private static async canBuyerCancelDelivery(
    order: Order,
  ): Promise<{ allowed: boolean; reason?: string }> {
    // Check if courier pickup has not been completed
    if (
      order.delivery_status === "picked_up" ||
      order.delivery_status === "in_transit" ||
      order.delivery_status === "delivered"
    ) {
      return {
        allowed: false,
        reason: "Cannot cancel - item has already been picked up by courier",
      };
    }

    // Check if seller has marked as dispatched
    if (order.status === "dispatched") {
      return {
        allowed: false,
        reason: "Cannot cancel - seller has already dispatched the item",
      };
    }

    return { allowed: true };
  }

  private static async cancelCourierBooking(
    courierService: string,
    bookingId: string,
  ): Promise<boolean> {
    try {
      // Implementation would call the actual courier API
      console.log(`🚫 Cancelling ${courierService} booking ${bookingId}`);

      // Placeholder for actual API calls
      switch (courierService) {
        case "courier-guy":
          // Call Courier Guy cancel API
          break;
        case "fastway":
          // Call Fastway cancel API
          break;
        default:
          console.warn(`Unknown courier service: ${courierService}`);
      }

      return true;
    } catch (error) {
      console.error("Failed to cancel courier booking:", error);
      return false;
    }
  }

  private static async processRefund(
    orderId: string,
    amount: number,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`💸 Processing refund of R${amount} for order ${orderId}`);

      // Get the order to find the payment reference
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select("payment_reference")
        .eq("id", orderId)
        .single();

      if (orderError || !order?.payment_reference) {
        throw new Error("Payment reference not found for order");
      }

      // Use the proper refund service
      const refundResult = await RefundService.processRefund(
        orderId,
        order.payment_reference,
        amount,
        "Order cancelled by buyer",
      );

      if (!refundResult.success) {
        throw new Error(refundResult.error || "Refund processing failed");
      }

      console.log(
        `✅ Refund processed successfully: ${refundResult.refundReference}`,
      );
      return { success: true };
    } catch (error) {
      console.error("Refund processing failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown refund error",
      };
    }
  }

  private static async getCourierRescheduleQuote(
    courierService: string,
    deliveryInfo: any,
  ): Promise<RescheduleQuote> {
    // Placeholder for actual courier API quote calls
    console.log(`🎯 Getting reschedule quote from ${courierService}`);

    return {
      courier_service: courierService,
      reschedule_fee: 50, // R50 reschedule fee
      available_times: [
        new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // Day after tomorrow
        new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(), // 3 days from now
      ],
      quote_id: `quote_${Date.now()}`,
    };
  }

  private static async verifyReschedulePayment(
    paymentReference: string,
  ): Promise<boolean> {
    try {
      // Verify payment with Paystack
      console.log(`💳 Verifying reschedule payment ${paymentReference}`);

      // Placeholder for actual Paystack verification
      return true;
    } catch (error) {
      console.error("Payment verification failed:", error);
      return false;
    }
  }

  private static async rebookCourierPickup(
    courierService: string,
    oldBookingId: string,
    newPickupTime: string,
  ): Promise<{ success: boolean; new_booking_id?: string }> {
    try {
      console.log(`🚚 Rebooking ${courierService} pickup for ${newPickupTime}`);

      // Placeholder for actual courier rebooking API
      return {
        success: true,
        new_booking_id: `booking_${Date.now()}`,
      };
    } catch (error) {
      console.error("Courier rebooking failed:", error);
      return { success: false };
    }
  }

  private static async checkSellerReliability(sellerId: string): Promise<void> {
    try {
      // Check for repeated missed pickups in the last 30 days
      const { data: missedPickups, error } = await supabase
        .from("orders")
        .select("id")
        .eq("seller_id", sellerId)
        .eq("delivery_status", "pickup_failed")
        .gte(
          "created_at",
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        )
        .limit(3);

      if (!error && missedPickups && missedPickups.length >= 2) {
        // Warn seller about reliability
        await addNotification({
          userId: sellerId,
          title: "⚠️ Pickup Reliability Warning",
          message:
            "You've missed multiple courier pickups recently. This affects your seller rating and buyer trust. Please ensure you're available for scheduled pickups.",
          type: "warning",
          read: false,
        });
      }
    } catch (error) {
      console.error("Failed to check seller reliability:", error);
    }
  }

  private static async logCancellationActivity(
    orderId: string,
    action: string,
    details: any,
  ): Promise<void> {
    try {
      await supabase.from("order_activity_log").insert({
        order_id: orderId,
        action,
        details,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Failed to log cancellation activity:", error);
    }
  }

  // Notification methods

  private static async notifyBuyerCancellation(order: Order): Promise<void> {
    if (!order.buyer) return;

    await Promise.all([
      // In-app notification
      addNotification({
        userId: order.buyer.id,
        title: "🔁 Order Cancelled",
        message: `Your order for "${order.book?.title}" has been cancelled. You will receive a full refund within 3-5 business days.`,
        type: "info",
        read: false,
      }),

      // Email notification
      emailService.sendEmail({
        to: order.buyer.email,
        subject: "Order Cancelled - ReBooked Solutions",
        html: `
          <h2>Order Cancelled</h2>
          <p>Hi ${order.buyer.name},</p>
          <p>Your order for "<strong>${order.book?.title}</strong>" has been cancelled as requested.</p>
          <p><strong>Refund Amount:</strong> R${order.total_amount}</p>
          <p>Your refund will be processed within 3-5 business days.</p>
          <p>Best regards,<br>ReBooked Solutions Team</p>
        `,
      }),
    ]);
  }

  private static async notifySellerOfBuyerCancellation(
    order: Order,
  ): Promise<void> {
    if (!order.seller) return;

    await Promise.all([
      // In-app notification
      addNotification({
        userId: order.seller.id,
        title: "🔁 Buyer Cancelled Order",
        message: `The buyer has cancelled their order for "${order.book?.title}". The delivery has been cancelled and the buyer will be refunded.`,
        type: "info",
        read: false,
      }),

      // Email notification
      emailService.sendEmail({
        to: order.seller.email,
        subject: "Order Cancelled by Buyer - ReBooked Solutions",
        html: `
          <h2>Order Cancelled by Buyer</h2>
          <p>Hi ${order.seller.name},</p>
          <p>The buyer has cancelled their order for "<strong>${order.book?.title}</strong>".</p>
          <p>The delivery has been cancelled and the buyer will receive a full refund.</p>
          <p>Your book is now available for other buyers to purchase.</p>
          <p>Best regards,<br>ReBooked Solutions Team</p>
        `,
      }),
    ]);
  }

  private static async notifyBuyerOfSellerDecline(
    order: Order,
    reason?: string,
  ): Promise<void> {
    if (!order.buyer) return;

    await Promise.all([
      // In-app notification
      addNotification({
        userId: order.buyer.id,
        title: "❌ Seller Declined Order",
        message: `The seller has declined your order for "${order.book?.title}". You will receive a full refund within 3-5 business days.`,
        type: "warning",
        read: false,
      }),

      // Email notification
      emailService.sendEmail({
        to: order.buyer.email,
        subject: "Order Declined by Seller - ReBooked Solutions",
        html: `
          <h2>Order Declined</h2>
          <p>Hi ${order.buyer.name},</p>
          <p>Unfortunately, the seller has declined your order for "<strong>${order.book?.title}</strong>".</p>
          ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
          <p><strong>Refund Amount:</strong> R${order.total_amount}</p>
          <p>Your refund will be processed within 3-5 business days.</p>
          <p>You can browse other available books on our platform.</p>
          <p>Best regards,<br>ReBooked Solutions Team</p>
        `,
      }),
    ]);
  }

  private static async notifySellerDeclineConfirmation(
    order: Order,
  ): Promise<void> {
    if (!order.seller) return;

    await addNotification({
      userId: order.seller.id,
      title: "✅ Order Decline Confirmed",
      message: `You have declined the order for "${order.book?.title}". The buyer has been notified and will receive a full refund.`,
      type: "info",
      read: false,
    });
  }

  private static async notifySellerMissedPickup(order: Order): Promise<void> {
    if (!order.seller) return;

    await Promise.all([
      // In-app notification
      addNotification({
        userId: order.seller.id,
        title: "⚠️ Courier Pickup Missed",
        message: `The courier attempted to pick up "${order.book?.title}" but you were unavailable. Please choose to reschedule or cancel the order.`,
        type: "warning",
        read: false,
      }),

      // Email notification
      emailService.sendEmail({
        to: order.seller.email,
        subject: "Missed Courier Pickup - Action Required",
        html: `
          <h2>Missed Courier Pickup</h2>
          <p>Hi ${order.seller.name},</p>
          <p>The courier attempted to pick up "<strong>${order.book?.title}</strong>" but you were not available.</p>
          <p><strong>Action Required:</strong> Please log into your account and choose to either:</p>
          <ul>
            <li>Reschedule the pickup (additional fee may apply)</li>
            <li>Cancel the order (buyer will receive full refund)</li>
          </ul>
          <p>Please take action within 24 hours to avoid automatic cancellation.</p>
          <p>Best regards,<br>ReBooked Solutions Team</p>
        `,
      }),
    ]);
  }

  private static async notifyBuyerOfPickupDelay(order: Order): Promise<void> {
    if (!order.buyer) return;

    await Promise.all([
      // In-app notification
      addNotification({
        userId: order.buyer.id,
        title: "📦 Pickup Delayed",
        message: `The pickup for "${order.book?.title}" was missed by the seller. They must reschedule or cancel. We'll update you once they take action.`,
        type: "info",
        read: false,
      }),

      // Email notification
      emailService.sendEmail({
        to: order.buyer.email,
        subject: "Delivery Delayed - Pickup Missed",
        html: `
          <h2>Delivery Update</h2>
          <p>Hi ${order.buyer.name},</p>
          <p>There has been a delay with your order for "<strong>${order.book?.title}</strong>".</p>
          <p>The courier attempted pickup but the seller was unavailable. The seller must now choose to either reschedule the pickup or cancel the order.</p>
          <p>We'll notify you immediately once the seller takes action. If no action is taken within 24 hours, the order will be automatically cancelled and you'll receive a full refund.</p>
          <p>Thank you for your patience.</p>
          <p>Best regards,<br>ReBooked Solutions Team</p>
        `,
      }),
    ]);
  }

  private static async notifyRescheduleSuccess(
    order: Order,
    newPickupTime: string,
  ): Promise<void> {
    const formattedDate = new Date(newPickupTime).toLocaleDateString("en-ZA", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Notify buyer
    if (order.buyer) {
      await Promise.all([
        addNotification({
          userId: order.buyer.id,
          title: "🔁 Delivery Rescheduled",
          message: `The seller has rescheduled the pickup for "${order.book?.title}". New pickup date: ${formattedDate}`,
          type: "info",
          read: false,
        }),

        emailService.sendEmail({
          to: order.buyer.email,
          subject: "Delivery Rescheduled - ReBooked Solutions",
          html: `
            <h2>Delivery Rescheduled</h2>
            <p>Hi ${order.buyer.name},</p>
            <p>The seller has rescheduled the pickup for "<strong>${order.book?.title}</strong>".</p>
            <p><strong>New Pickup Date:</strong> ${formattedDate}</p>
            <p>Your delivery may be delayed by 1-2 days. We apologize for any inconvenience.</p>
            <p>Best regards,<br>ReBooked Solutions Team</p>
          `,
        }),
      ]);
    }

    // Notify seller
    if (order.seller) {
      await addNotification({
        userId: order.seller.id,
        title: "✅ Pickup Rescheduled",
        message: `You have successfully rescheduled the pickup for "${order.book?.title}" to ${formattedDate}. Please be available at the scheduled time.`,
        type: "success",
        read: false,
      });
    }
  }

  private static async notifyBuyerOfSellerCancellation(
    order: Order,
    reason?: string,
  ): Promise<void> {
    if (!order.buyer) return;

    await Promise.all([
      // In-app notification
      addNotification({
        userId: order.buyer.id,
        title: "🛑 Order Cancelled by Seller",
        message: `The seller has cancelled your order for "${order.book?.title}" after missing the pickup. You will receive a full refund within 3-5 business days.`,
        type: "warning",
        read: false,
      }),

      // Email notification
      emailService.sendEmail({
        to: order.buyer.email,
        subject: "Order Cancelled by Seller - ReBooked Solutions",
        html: `
          <h2>Order Cancelled</h2>
          <p>Hi ${order.buyer.name},</p>
          <p>The seller has cancelled your order for "<strong>${order.book?.title}</strong>" after missing the scheduled pickup.</p>
          ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
          <p><strong>Refund Amount:</strong> R${order.total_amount}</p>
          <p>Your refund will be processed within 3-5 business days.</p>
          <p>You can browse other available books on our platform.</p>
          <p>Best regards,<br>ReBooked Solutions Team</p>
        `,
      }),
    ]);
  }

  private static async notifySellerCancellationConfirmation(
    order: Order,
  ): Promise<void> {
    if (!order.seller) return;

    await addNotification({
      userId: order.seller.id,
      title: "✅ Order Cancellation Confirmed",
      message: `You have cancelled the order for "${order.book?.title}". The buyer has been notified and will receive a full refund.`,
      type: "info",
      read: false,
    });
  }
}

export default OrderCancellationService;
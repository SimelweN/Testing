import { supabase } from "@/lib/supabase";

export interface CreateNotificationData {
  userId: string;
  type: string;
  title: string;
  message: string;
  metadata?: Record<string, any>;
  priority?: 'high' | 'medium' | 'low';
}

export class NotificationService {
  /**
   * Create a notification for a user
   */
  static async createNotification(data: CreateNotificationData) {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          metadata: data.metadata || {},
          priority: data.priority || 'medium',
          read: false,
          created_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Failed to create notification:', error);
        return false;
      }

      console.log(`📧 Notification created for user ${data.userId}:`, data.title);
      return true;
    } catch (error) {
      console.error('Error creating notification:', error);
      return false;
    }
  }

  /**
   * Create commit reminder notification
   */
  static async createCommitReminder(userId: string, orderId: string, bookTitle: string, hoursRemaining: number) {
    return this.createNotification({
      userId,
      type: 'commit',
      title: 'Commit to Sale Reminder',
      message: `You have ${hoursRemaining} hours remaining to commit to selling "${bookTitle}". Please complete your commitment to avoid order cancellation.`,
      metadata: {
        order_id: orderId,
        book_title: bookTitle,
        hours_remaining: hoursRemaining,
        action_required: true,
      },
      priority: hoursRemaining < 12 ? 'high' : 'medium',
    });
  }

  /**
   * Create delivery update notification
   */
  static async createDeliveryUpdate(userId: string, orderId: string, status: string, message: string) {
    return this.createNotification({
      userId,
      type: 'delivery',
      title: 'Delivery Update',
      message,
      metadata: {
        order_id: orderId,
        delivery_status: status,
      },
      priority: 'medium',
    });
  }

  /**
   * Create order confirmation notification
   */
  static async createOrderConfirmation(userId: string, orderId: string, bookTitle: string, isForSeller = false) {
    if (isForSeller) {
      return this.createNotification({
        userId,
        type: 'purchase',
        title: 'New Order Received',
        message: `Great news! You've received a new order for "${bookTitle}". Please commit to this sale within 48 hours.`,
        metadata: {
          order_id: orderId,
          book_title: bookTitle,
          action_required: true,
        },
        priority: 'high',
      });
    } else {
      return this.createNotification({
        userId,
        type: 'purchase',
        title: 'Order Confirmed',
        message: `Your order for "${bookTitle}" has been confirmed. The seller will commit to the sale within 48 hours.`,
        metadata: {
          order_id: orderId,
          book_title: bookTitle,
        },
        priority: 'medium',
      });
    }
  }

  /**
   * Create payment confirmation notification
   */
  static async createPaymentConfirmation(userId: string, orderId: string, amount: number, bookTitle: string) {
    return this.createNotification({
      userId,
      type: 'purchase',
      title: 'Payment Successful',
      message: `Payment of R${amount.toFixed(2)} for "${bookTitle}" has been processed successfully. Your order is now confirmed.`,
      metadata: {
        order_id: orderId,
        book_title: bookTitle,
        amount,
      },
      priority: 'medium',
    });
  }
}

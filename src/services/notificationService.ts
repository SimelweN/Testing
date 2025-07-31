import { supabase } from "@/lib/supabase";

export interface CreateNotificationData {
  userId: string;
  type: string;
  title: string;
  message: string;
  metadata?: Record<string, any>; // Will be ignored for now
  priority?: 'high' | 'medium' | 'low'; // Will be ignored for now
}

type Notification = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
};

// Simple cache to store notifications for users
const notificationCache = new Map<string, { data: Notification[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get notifications for a user with caching
 */
export async function getNotifications(userId: string): Promise<Notification[]> {
  try {
    // Check cache first
    const cached = notificationCache.get(userId);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }

    const notifications = data || [];

    // Update cache
    notificationCache.set(userId, {
      data: notifications,
      timestamp: Date.now()
    });

    return notifications;
  } catch (error) {
    console.error('Failed to get notifications:', error);
    throw error;
  }
}

/**
 * Clear notification cache for a user
 */
export function clearNotificationCache(userId: string): void {
  notificationCache.delete(userId);
  console.log(`🗑️ Cleared notification cache for user ${userId}`);
}

/**
 * Add a notification (wrapper around NotificationService.createNotification)
 */
export async function addNotification(data: CreateNotificationData): Promise<boolean> {
  return NotificationService.createNotification(data);
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('Failed to mark notification as read:', error);
      return false;
    }

    console.log(`📖 Marked notification ${notificationId} as read`);
    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
}

export class NotificationService {
  /**
   * Create a notification for a user
   */
  static async createNotification(data: CreateNotificationData) {
    try {
      // Validate required fields
      if (!data.userId || !data.type || !data.title || !data.message) {
        throw new Error('Missing required notification data: userId, type, title, and message are required');
      }

      console.log('Creating notification with data:', {
        user_id: data.userId,
        type: data.type,
        title: data.title,
        message: data.message.substring(0, 100) + '...' // Log truncated message
      });

      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          read: false,
        });

      if (error) {
        console.error('Failed to create notification:', {
          message: error.message || 'Unknown error',
          code: error.code,
          details: error.details,
          hint: error.hint,
          data: data,
          timestamp: new Date().toISOString()
        });
        return false;
      }

      console.log(`📧 Notification created for user ${data.userId}:`, data.title);
      return true;
    } catch (error) {
      console.error('Error creating notification:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        data: data,
        timestamp: new Date().toISOString()
      });
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
      message: `You have ${hoursRemaining} hours remaining to commit to selling "${bookTitle}". Please complete your commitment to avoid order cancellation. Order ID: ${orderId}`,
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
      message: `${message} (Order: ${orderId}, Status: ${status})`,
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
        message: `Great news! You've received a new order for "${bookTitle}". Please commit to this sale within 48 hours. Order ID: ${orderId}`,
      });
    } else {
      return this.createNotification({
        userId,
        type: 'purchase',
        title: 'Order Confirmed',
        message: `Your order for "${bookTitle}" has been confirmed. The seller will commit to the sale within 48 hours. Order ID: ${orderId}`,
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
      message: `Payment of R${amount.toFixed(2)} for "${bookTitle}" has been processed successfully. Your order is now confirmed. Order ID: ${orderId}`,
    });
  }
}

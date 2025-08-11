import { supabase } from "@/lib/supabase";

// Utility to properly serialize errors for logging (prevents [object Object])
const serializeError = (error: any): any => {
  if (!error) return { message: 'Unknown error' };

  if (typeof error === 'string') return { message: error };

  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      stack: error.stack,
    };
  }

  // Handle Supabase error objects
  if (typeof error === 'object') {
    return {
      message: error.message || error.error_description || error.msg || 'Unknown error',
      code: error.code || error.error || error.status,
      details: error.details || error.error_description,
      hint: error.hint,
      timestamp: new Date().toISOString(),
      originalError: error // Include full original object
    };
  }

  return { message: String(error) };
};

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
      const serializedError = serializeError(error);
      console.error('Error fetching notifications:', serializedError);
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
    const serializedError = serializeError(error);
    console.error('Failed to get notifications:', serializedError);
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
      const serializedError = serializeError(error);
      console.error('Failed to mark notification as read:', serializedError);
      return false;
    }

    console.log(`📖 Marked notification ${notificationId} as read`);
    return true;
  } catch (error) {
    const serializedError = serializeError(error);
    console.error('Error marking notification as read:', serializedError);
    return false;
  }
}

export class NotificationService {
  /**
   * Create a notification for a user with retry logic
   */
  static async createNotification(data: CreateNotificationData, retryCount = 0) {
    const maxRetries = 2;

    try {
      // Validate required fields
      if (!data.userId || !data.type || !data.title || !data.message) {
        throw new Error('Missing required notification data: userId, type, title, and message are required');
      }

      // Validate userId format (should be UUID)
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(data.userId)) {
        throw new Error(`Invalid userId format: ${data.userId}`);
      }

      console.log('Creating notification with data:', {
        user_id: data.userId,
        type: data.type,
        title: data.title,
        message: data.message.substring(0, 100) + '...',
        retry_attempt: retryCount
      });

      const { data: insertedData, error } = await supabase
        .from('notifications')
        .insert({
          user_id: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          read: false,
        })
        .select('id')
        .single();

      if (error) {
        const serializedError = serializeError(error);
        console.error('Failed to create notification:', {
          ...serializedError,
          attemptedData: data,
          timestamp: new Date().toISOString(),
          retry_attempt: retryCount
        });

        // Retry on certain errors (network issues, temporary database errors)
        if (retryCount < maxRetries &&
            (error.message?.includes('network') ||
             error.message?.includes('timeout') ||
             error.message?.includes('connection'))) {
          console.log(`🔄 Retrying notification creation (attempt ${retryCount + 1}/${maxRetries + 1})`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
          return this.createNotification(data, retryCount + 1);
        }

        return false;
      }

      console.log(`📧 Notification created successfully for user ${data.userId}:`, {
        id: insertedData?.id,
        title: data.title,
        type: data.type
      });

      // Clear cache for this user so they get fresh notifications
      clearNotificationCache(data.userId);

      return true;
    } catch (error) {
      const serializedError = serializeError(error);
      console.error('Error creating notification:', {
        ...serializedError,
        attemptedData: data,
        timestamp: new Date().toISOString(),
        retry_attempt: retryCount
      });

      // Retry on network errors
      if (retryCount < maxRetries && error instanceof Error &&
          (error.message.includes('network') || error.message.includes('fetch'))) {
        console.log(`🔄 Retrying notification creation after error (attempt ${retryCount + 1}/${maxRetries + 1})`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return this.createNotification(data, retryCount + 1);
      }

      return false;
    }
  }

  /**
   * Create commit reminder notification
   */
  static async createCommitReminder(userId: string, orderId: string, bookTitle: string, hoursRemaining: number) {
    return this.createNotification({
      userId,
      type: 'warning',
      title: '⏰ Commit to Sale Reminder',
      message: `You have ${hoursRemaining} hours remaining to commit to selling "${bookTitle}". Please complete your commitment to avoid order cancellation. Order ID: ${orderId}`,
    });
  }

  /**
   * Create delivery update notification
   */
  static async createDeliveryUpdate(userId: string, orderId: string, status: string, message: string) {
    return this.createNotification({
      userId,
      type: 'info',
      title: '📦 Delivery Update',
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
        type: 'info',
        title: '📦 New Order Received',
        message: `Great news! You've received a new order for "${bookTitle}". Please commit to this sale within 48 hours. Order ID: ${orderId}`,
      });
    } else {
      return this.createNotification({
        userId,
        type: 'success',
        title: '✅ Order Confirmed',
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
      type: 'success',
      title: '💳 Payment Successful',
      message: `Payment of R${amount.toFixed(2)} for "${bookTitle}" has been processed successfully. Your order is now confirmed. Order ID: ${orderId}`,
    });
  }
}

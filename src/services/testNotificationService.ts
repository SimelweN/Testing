import { NotificationService } from './notificationService';

export const createTestNotification = async (userId: string) => {
  const testNotification = {
    userId,
    type: 'test',
    title: 'Test Notification',
    message: `This is a test notification to verify the system is working properly. Created at: ${new Date().toISOString()}`,
  };

  try {
    const result = await NotificationService.createNotification(testNotification);
    console.log('Test notification created:', result);
    return result;
  } catch (error) {
    console.error('Failed to create test notification:', error);
    return false;
  }
};

export const createWelcomeNotification = async (userId: string) => {
  return await NotificationService.createNotification({
    userId,
    type: 'welcome',
    title: 'Welcome to ReBooked!',
    message: 'Welcome to South Africa\'s premier textbook marketplace! Start buying and selling textbooks today.',
  });
};

export const createSampleCommitNotification = async (userId: string) => {
  return await NotificationService.createCommitReminder(
    userId,
    'test-order-123',
    'Mathematics Grade 12 Textbook',
    24
  );
};

export const createSamplePurchaseNotification = async (userId: string) => {
  return await NotificationService.createOrderConfirmation(
    userId,
    'test-order-456',
    'Biology Grade 11 Workbook',
    false
  );
};

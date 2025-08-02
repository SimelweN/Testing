import { supabase } from '@/integrations/supabase/client';

/**
 * Utility to check and verify the notification database table
 */

export interface NotificationTableInfo {
  exists: boolean;
  canRead: boolean;
  canWrite: boolean;
  sampleNotifications: any[];
  error?: string;
}

/**
 * Check if notification table exists and is accessible
 */
export const checkNotificationTable = async (): Promise<NotificationTableInfo> => {
  const result: NotificationTableInfo = {
    exists: false,
    canRead: false,
    canWrite: false,
    sampleNotifications: []
  };

  try {
    // Test if we can read from the notifications table
    console.log('🔍 Testing notification table read access...');
    const { data: readData, error: readError } = await supabase
      .from('notifications')
      .select('id, type, title, created_at')
      .limit(5)
      .order('created_at', { ascending: false });

    if (readError) {
      console.error('❌ Cannot read from notifications table:', readError);
      result.error = `Read error: ${readError.message}`;
      return result;
    }

    result.exists = true;
    result.canRead = true;
    result.sampleNotifications = readData || [];
    console.log('✅ Can read from notifications table');

    // Test if we can write to the notifications table
    console.log('🔍 Testing notification table write access...');
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      result.error = 'No authenticated user for write test';
      return result;
    }

    const testNotification = {
      user_id: user.id,
      type: 'info',
      title: '🧪 Database Access Test',
      message: 'This is a test notification to verify database write access.',
      read: false
    };

    const { data: writeData, error: writeError } = await supabase
      .from('notifications')
      .insert(testNotification)
      .select()
      .single();

    if (writeError) {
      console.error('❌ Cannot write to notifications table:', writeError);
      result.error = `Write error: ${writeError.message}`;
      return result;
    }

    result.canWrite = true;
    console.log('✅ Can write to notifications table');

    // Clean up test notification
    if (writeData?.id) {
      await supabase
        .from('notifications')
        .delete()
        .eq('id', writeData.id);
      console.log('🧹 Cleaned up test notification');
    }

    console.log('✅ Notification table check completed successfully');
    return result;

  } catch (error) {
    console.error('💥 Error checking notification table:', error);
    result.error = `Exception: ${error instanceof Error ? error.message : String(error)}`;
    return result;
  }
};

/**
 * Get notification statistics for a user
 */
export const getNotificationStats = async (userId?: string): Promise<{
  total: number;
  unread: number;
  byType: Record<string, number>;
  recent: any[];
  error?: string;
}> => {
  try {
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No authenticated user');
      }
      userId = user.id;
    }

    // Get total and unread counts
    const { data: allData, error: allError } = await supabase
      .from('notifications')
      .select('id, type, read, created_at')
      .eq('user_id', userId);

    if (allError) {
      throw allError;
    }

    const total = allData?.length || 0;
    const unread = allData?.filter(n => !n.read).length || 0;

    // Count by type
    const byType: Record<string, number> = {};
    allData?.forEach(notification => {
      byType[notification.type] = (byType[notification.type] || 0) + 1;
    });

    // Get recent notifications
    const { data: recentData, error: recentError } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (recentError) {
      throw recentError;
    }

    return {
      total,
      unread,
      byType,
      recent: recentData || []
    };

  } catch (error) {
    console.error('Error getting notification stats:', error);
    return {
      total: 0,
      unread: 0,
      byType: {},
      recent: [],
      error: error instanceof Error ? error.message : String(error)
    };
  }
};

/**
 * Test notification creation and retrieval
 */
export const testNotificationFlow = async (): Promise<{
  success: boolean;
  steps: Record<string, boolean>;
  error?: string;
}> => {
  const steps = {
    authentication: false,
    creation: false,
    retrieval: false,
    deletion: false
  };

  try {
    // Step 1: Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Authentication failed');
    }
    steps.authentication = true;

    // Step 2: Create test notification
    const { data: createData, error: createError } = await supabase
      .from('notifications')
      .insert({
        user_id: user.id,
        type: 'info',
        title: '🧪 Flow Test Notification',
        message: 'This notification tests the complete flow from creation to deletion.',
        read: false
      })
      .select()
      .single();

    if (createError || !createData) {
      throw new Error(`Creation failed: ${createError?.message}`);
    }
    steps.creation = true;

    // Step 3: Retrieve the notification
    const { data: retrieveData, error: retrieveError } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', createData.id)
      .single();

    if (retrieveError || !retrieveData) {
      throw new Error(`Retrieval failed: ${retrieveError?.message}`);
    }
    steps.retrieval = true;

    // Step 4: Delete the test notification
    const { error: deleteError } = await supabase
      .from('notifications')
      .delete()
      .eq('id', createData.id);

    if (deleteError) {
      throw new Error(`Deletion failed: ${deleteError.message}`);
    }
    steps.deletion = true;

    return { success: true, steps };

  } catch (error) {
    console.error('Notification flow test failed:', error);
    return {
      success: false,
      steps,
      error: error instanceof Error ? error.message : String(error)
    };
  }
};

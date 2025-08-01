import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NotificationService } from '@/services/notificationService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const NotificationDebugger: React.FC = () => {
  const { user } = useAuth();

  const testNotification = async () => {
    if (!user) {
      toast.error('You must be logged in to test notifications');
      return;
    }

    console.log('🧪 Testing notification creation...');
    console.log('User ID:', user.id);

    try {
      const result = await NotificationService.createNotification({
        userId: user.id,
        type: 'test',
        title: 'Debug Test Notification',
        message: 'This is a test notification to debug the notification system.',
      });

      if (result) {
        toast.success('✅ Notification created successfully!');
        console.log('✅ Notification creation succeeded');
      } else {
        toast.error('❌ Notification creation failed (returned false)');
        console.log('❌ Notification creation returned false');
      }
    } catch (error) {
      console.error('❌ Exception during notification creation:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        error: error
      });
      toast.error(`Exception: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const testInvalidNotification = async () => {
    console.log('🧪 Testing invalid notification (missing userId)...');

    try {
      const result = await NotificationService.createNotification({
        userId: '', // Invalid - empty userId
        type: 'test',
        title: 'Invalid Test',
        message: 'This should fail validation.',
      });
      console.log('Result:', result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message :
        (typeof error === 'object' && error !== null) ?
          (error.message || error.details || error.hint || JSON.stringify(error)) :
          String(error);
      console.error('Expected error for invalid data:', errorMessage, error);
      toast.info('Expected validation error logged to console');
    }
  };

  if (!user) {
    return (
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>🔐 Notification Debugger</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Please log in to test notifications.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>🧪 Notification Debugger</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-gray-600 mb-2">
            User ID: <code className="bg-gray-100 px-1 rounded">{user.id}</code>
          </p>
        </div>
        
        <Button 
          onClick={testNotification}
          className="w-full"
        >
          🧪 Test Valid Notification
        </Button>
        
        <Button 
          onClick={testInvalidNotification}
          variant="outline"
          className="w-full"
        >
          🚫 Test Invalid Notification
        </Button>
        
        <div className="text-xs text-gray-500">
          <p>Check browser console for detailed error logs.</p>
          <p>Errors should show message, code, details instead of [object Object].</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationDebugger;

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NotificationService } from '@/services/notificationService';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle, XCircle, Info } from 'lucide-react';

export const EnhancedNotificationDebugger: React.FC = () => {
  const { user } = useAuth();
  const [testType, setTestType] = useState('service');
  const [notificationType, setNotificationType] = useState('info');
  const [title, setTitle] = useState('Debug Test Notification');
  const [message, setMessage] = useState('This is a test notification to debug the system.');
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  const testViaService = async () => {
    if (!user) {
      toast.error('You must be logged in to test notifications');
      return;
    }

    setIsLoading(true);
    try {
      console.log('🧪 Testing via NotificationService...');
      const result = await NotificationService.createNotification({
        userId: user.id,
        type: notificationType,
        title,
        message,
      });

      setLastResult({ success: result, method: 'service', timestamp: new Date() });
      
      if (result) {
        toast.success('✅ Notification created via service!');
      } else {
        toast.error('❌ Service returned false (check console for details)');
      }
    } catch (error) {
      console.error('Service test error:', error);
      const errorMessage = error instanceof Error ? error.message : 
        (typeof error === 'object' && error !== null) ? 
          (error.message || error.details || error.hint || JSON.stringify(error)) :
          String(error);
      
      setLastResult({ error: errorMessage, method: 'service', timestamp: new Date() });
      toast.error(`Service error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testDirectDB = async () => {
    if (!user) {
      toast.error('You must be logged in to test notifications');
      return;
    }

    setIsLoading(true);
    try {
      console.log('🧪 Testing direct database insert...');
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          type: notificationType,
          title,
          message,
          read: false,
        })
        .select();

      if (error) {
        console.error('Direct DB error:', error);
        const errorMessage = error.message || error.details || error.hint || JSON.stringify(error);
        setLastResult({ error: errorMessage, method: 'direct', timestamp: new Date() });
        toast.error(`DB error: ${errorMessage}`);
      } else {
        console.log('Direct DB success:', data);
        setLastResult({ success: true, data, method: 'direct', timestamp: new Date() });
        toast.success('✅ Notification created via direct DB!');
      }
    } catch (error) {
      console.error('Direct DB exception:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setLastResult({ error: errorMessage, method: 'direct', timestamp: new Date() });
      toast.error(`DB exception: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const checkSessionAndPermissions = async () => {
    setIsLoading(true);
    try {
      console.log('🔍 Checking session and permissions...');
      
      // Check session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        toast.error(`Session error: ${sessionError.message}`);
        return;
      }
      
      if (!session) {
        toast.error('No active session found');
        return;
      }
      
      console.log('Session valid, expires:', new Date(session.expires_at * 1000));
      
      // Check read permissions
      const { data: readTest, error: readError } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', user?.id)
        .limit(1);
        
      if (readError) {
        toast.error(`Read permission error: ${readError.message}`);
        return;
      }
      
      console.log('Read permissions OK, found', readTest?.length || 0, 'notifications');
      
      // Test invalid insert (should fail due to RLS)
      const { error: rlsError } = await supabase
        .from('notifications')
        .insert({
          user_id: '00000000-0000-0000-0000-000000000000',
          type: 'test',
          title: 'RLS Test',
          message: 'This should fail',
          read: false
        });
        
      if (rlsError) {
        console.log('RLS is working:', rlsError.message);
        toast.success('✅ Session and permissions are OK!');
      } else {
        toast.warning('⚠️ RLS might not be working properly');
      }
      
    } catch (error) {
      console.error('Permission check error:', error);
      toast.error(`Permission check failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Enhanced Notification Debugger
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>Please log in to use the notification debugger.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5 text-blue-500" />
          Enhanced Notification Debugger
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
          <strong>User ID:</strong> <code className="bg-white px-1 rounded">{user.id}</code>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Notification Type</label>
            <Select value={notificationType} onValueChange={setNotificationType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="info">Info (Test)</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Title</label>
            <Input 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Notification title"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Message</label>
          <Textarea 
            value={message} 
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Notification message"
            rows={3}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <Button 
            onClick={testViaService}
            disabled={isLoading}
            className="w-full"
          >
            🔧 Test via Service
          </Button>
          
          <Button 
            onClick={testDirectDB}
            disabled={isLoading}
            variant="outline"
            className="w-full"
          >
            🔍 Test Direct DB
          </Button>
          
          <Button 
            onClick={checkSessionAndPermissions}
            disabled={isLoading}
            variant="secondary"
            className="w-full"
          >
            🔐 Check Permissions
          </Button>
        </div>
        
        {lastResult && (
          <div className={`p-3 rounded border ${
            lastResult.error ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {lastResult.error ? (
                <XCircle className="h-4 w-4 text-red-500" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
              <strong>
                Last Result ({lastResult.method}) - {lastResult.timestamp.toLocaleTimeString()}
              </strong>
            </div>
            
            {lastResult.error ? (
              <div className="text-red-700 text-sm font-mono bg-red-100 p-2 rounded">
                {lastResult.error}
              </div>
            ) : (
              <div className="text-green-700 text-sm">
                Success! {lastResult.data && (
                  <span className="font-mono bg-green-100 p-1 rounded">
                    ID: {lastResult.data[0]?.id}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
        
        <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded">
          <p><strong>Debug Tips:</strong></p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Check browser console for detailed error logs</li>
            <li>Verify user is authenticated and session is valid</li>
            <li>Ensure RLS policies allow the user to insert notifications</li>
            <li>Test both service wrapper and direct database access</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedNotificationDebugger;

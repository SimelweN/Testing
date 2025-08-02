import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { NotificationService } from '@/services/notificationService';
import { useAuth } from '@/contexts/AuthContext';
import { TestTube, CheckCircle, XCircle, Clock, AlertTriangle, Database, BarChart } from 'lucide-react';
import { checkNotificationTable, getNotificationStats, testNotificationFlow } from '@/utils/notificationDatabaseChecker';

const NotificationTester = () => {
  const { user } = useAuth();
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});
  const [isRunning, setIsRunning] = useState(false);
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [isCheckingDb, setIsCheckingDb] = useState(false);

  const notificationTests = [
    {
      id: 'basic',
      name: 'Basic Notification',
      description: 'Test basic notification creation',
      test: () => NotificationService.createNotification({
        userId: user?.id || '',
        type: 'info',
        title: '🧪 Test Basic Notification',
        message: 'This is a basic test notification to verify the notification system is working correctly.'
      })
    },
    {
      id: 'order_confirmation_buyer',
      name: 'Order Confirmation (Buyer)',
      description: 'Test buyer order confirmation notification',
      test: () => NotificationService.createOrderConfirmation(
        user?.id || '',
        'TEST_ORDER_123',
        'Test Textbook Title',
        false // isBuyer
      )
    },
    {
      id: 'order_confirmation_seller',
      name: 'Order Confirmation (Seller)',
      description: 'Test seller order confirmation notification',
      test: () => NotificationService.createOrderConfirmation(
        user?.id || '',
        'TEST_ORDER_456',
        'Test Textbook Title',
        true // isSeller
      )
    },
    {
      id: 'payment_confirmation',
      name: 'Payment Confirmation',
      description: 'Test payment confirmation notification',
      test: () => NotificationService.createPaymentConfirmation(
        user?.id || '',
        'TEST_ORDER_789',
        250.00,
        'Test Textbook Title'
      )
    },
    {
      id: 'delivery_update',
      name: 'Delivery Update',
      description: 'Test delivery update notification',
      test: () => NotificationService.createDeliveryUpdate(
        user?.id || '',
        'TEST_ORDER_101',
        'shipped',
        'Your order has been shipped and is on its way!'
      )
    },
    {
      id: 'commit_reminder',
      name: 'Commit Reminder',
      description: 'Test commit reminder notification',
      test: () => NotificationService.createCommitReminder(
        user?.id || '',
        'TEST_ORDER_202',
        'Test Textbook Title',
        24 // hours remaining
      )
    },
    {
      id: 'listing_success',
      name: 'Listing Success',
      description: 'Test listing creation notification',
      test: () => NotificationService.createNotification({
        userId: user?.id || '',
        type: 'success',
        title: '📚 Book Listed Successfully!',
        message: 'Your book "Test Textbook" has been listed successfully. Students can now find and purchase your book.'
      })
    },
    {
      id: 'admin_message',
      name: 'Admin Message',
      description: 'Test admin/system message notification',
      test: () => NotificationService.createNotification({
        userId: user?.id || '',
        type: 'info',
        title: 'ReBooked Solutions Team',
        message: 'This is a test message from the ReBooked Solutions team to verify admin notifications are working correctly.'
      })
    }
  ];

  const runSingleTest = async (test: typeof notificationTests[0]) => {
    if (!user?.id) {
      toast.error('You must be logged in to run notification tests');
      return;
    }

    try {
      console.log(`🧪 Running test: ${test.name}`);
      const result = await test.test();
      
      setTestResults(prev => ({ ...prev, [test.id]: result }));
      
      if (result) {
        toast.success(`✅ ${test.name} test passed`);
        console.log(`✅ ${test.name} test passed`);
      } else {
        toast.error(`❌ ${test.name} test failed`);
        console.error(`❌ ${test.name} test failed`);
      }
    } catch (error) {
      console.error(`💥 ${test.name} test error:`, error);
      setTestResults(prev => ({ ...prev, [test.id]: false }));
      toast.error(`💥 ${test.name} test error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const checkDatabase = async () => {
    setIsCheckingDb(true);
    try {
      console.log('🔍 Checking notification database...');

      // Check table access
      const tableInfo = await checkNotificationTable();
      setDbStatus(tableInfo);

      if (tableInfo.exists && tableInfo.canRead) {
        // Get user stats
        const userStats = await getNotificationStats();
        setStats(userStats);

        // Test complete flow
        const flowTest = await testNotificationFlow();

        if (tableInfo.canRead && tableInfo.canWrite && flowTest.success) {
          toast.success('✅ Database verification passed!');
        } else {
          toast.warning('⚠️ Database has some issues - check details below');
        }
      } else {
        toast.error('❌ Database verification failed');
      }

    } catch (error) {
      console.error('Database check error:', error);
      toast.error(`Database check failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsCheckingDb(false);
    }
  };

  const runAllTests = async () => {
    if (!user?.id) {
      toast.error('You must be logged in to run notification tests');
      return;
    }

    setIsRunning(true);
    setTestResults({});
    
    toast.info('🧪 Running all notification tests...');
    
    for (const test of notificationTests) {
      await runSingleTest(test);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setIsRunning(false);
    
    const passedTests = Object.values(testResults).filter(Boolean).length;
    const totalTests = notificationTests.length;
    
    if (passedTests === totalTests) {
      toast.success(`🎉 All ${totalTests} notification tests passed!`);
    } else {
      toast.warning(`⚠️ ${passedTests}/${totalTests} notification tests passed`);
    }
  };

  const getTestStatus = (testId: string) => {
    if (!(testId in testResults)) return 'pending';
    return testResults[testId] ? 'passed' : 'failed';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-gray-400" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-600">Please log in to test notifications</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Notification System Tester
        </CardTitle>
        <p className="text-sm text-gray-600">
          Test all notification types to ensure they're working correctly and saving to the database
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            onClick={runAllTests}
            disabled={isRunning}
            className="flex-1"
          >
            {isRunning ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Running Tests...
              </>
            ) : (
              <>
                <TestTube className="h-4 w-4 mr-2" />
                Run All Tests
              </>
            )}
          </Button>

          <Button
            onClick={checkDatabase}
            disabled={isCheckingDb}
            variant="outline"
          >
            {isCheckingDb ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                Checking...
              </>
            ) : (
              <>
                <Database className="h-4 w-4 mr-2" />
                Check DB
              </>
            )}
          </Button>
        </div>

        {/* Database Status */}
        {dbStatus && (
          <div className="border rounded-lg p-4 bg-gray-50">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Database className="h-4 w-4" />
              Database Status
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                {dbStatus.exists ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />}
                <span>Table Exists: {dbStatus.exists ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex items-center gap-2">
                {dbStatus.canRead ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />}
                <span>Can Read: {dbStatus.canRead ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex items-center gap-2">
                {dbStatus.canWrite ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />}
                <span>Can Write: {dbStatus.canWrite ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex items-center gap-2">
                <BarChart className="h-4 w-4 text-blue-600" />
                <span>Sample Count: {dbStatus.sampleNotifications?.length || 0}</span>
              </div>
            </div>
            {dbStatus.error && (
              <div className="mt-3 p-2 bg-red-100 border border-red-200 rounded text-red-800 text-xs">
                <strong>Error:</strong> {dbStatus.error}
              </div>
            )}
          </div>
        )}

        {/* User Stats */}
        {stats && (
          <div className="border rounded-lg p-4 bg-blue-50">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <BarChart className="h-4 w-4" />
              Your Notification Stats
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>Total Notifications: <strong>{stats.total}</strong></div>
              <div>Unread: <strong>{stats.unread}</strong></div>
            </div>
            <div className="mt-2 text-xs">
              <strong>By Type:</strong> {Object.entries(stats.byType).map(([type, count]: [string, any]) => `${type}: ${count}`).join(', ') || 'None'}
            </div>
          </div>
        )}

        <div className="grid gap-3">
          {notificationTests.map((test) => {
            const status = getTestStatus(test.id);
            return (
              <div
                key={test.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusIcon(status)}
                    <span className="font-medium text-sm">{test.name}</span>
                    <Badge 
                      variant={status === 'passed' ? 'default' : status === 'failed' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {status}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600">{test.description}</p>
                </div>
                <Button
                  onClick={() => runSingleTest(test)}
                  disabled={isRunning}
                  variant="outline"
                  size="sm"
                >
                  Test
                </Button>
              </div>
            );
          })}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">How to Verify Results:</h4>
          <ol className="text-sm text-blue-800 space-y-1">
            <li>1. Run the tests above</li>
            <li>2. Go to the Notifications page to see if notifications appear</li>
            <li>3. Check the browser console for detailed logs</li>
            <li>4. Verify notifications are stored in the database table</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationTester;

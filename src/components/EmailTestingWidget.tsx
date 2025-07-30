import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Mail, Send, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { emailTriggerFix } from '@/utils/emailTriggerFix';

interface TestResult {
  success: boolean;
  message: string;
  timestamp: string;
}

const EmailTestingWidget: React.FC = () => {
  const [testEmail, setTestEmail] = useState('');
  const [isTestingSystem, setIsTestingSystem] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [systemStatus, setSystemStatus] = useState<'unknown' | 'healthy' | 'issues'>('unknown');
  const [lastTestResult, setLastTestResult] = useState<TestResult | null>(null);

  const quickHealthCheck = async () => {
    setIsTestingSystem(true);
    try {
      // Run a quick health check focusing on key components
      const tests = await emailTriggerFix.diagnoseAllEmailTriggers();
      
      const criticalTests = [
        'Mail Queue Access',
        'Send Email Function', 
        'Direct Email Queue Test'
      ];
      
      const criticalIssues = tests
        .filter(test => criticalTests.includes(test.name) && !test.success)
        .length;
      
      const status = criticalIssues === 0 ? 'healthy' : 'issues';
      setSystemStatus(status);
      
      const result: TestResult = {
        success: status === 'healthy',
        message: status === 'healthy' 
          ? `✅ Email system is healthy (${tests.filter(t => t.success).length}/${tests.length} checks passed)`
          : `⚠️ Found ${criticalIssues} critical issues out of ${criticalTests.length} core components`,
        timestamp: new Date().toLocaleString()
      };
      
      setLastTestResult(result);
      
      if (status === 'healthy') {
        toast.success('Email system is working correctly!');
      } else {
        toast.warning('Email system has issues - check admin dashboard for details');
      }
      
    } catch (error) {
      setSystemStatus('issues');
      const result: TestResult = {
        success: false,
        message: '❌ Failed to test email system',
        timestamp: new Date().toLocaleString()
      };
      setLastTestResult(result);
      toast.error('Failed to test email system');
    } finally {
      setIsTestingSystem(false);
    }
  };

  const sendTestEmail = async () => {
    if (!testEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSendingTest(true);
    try {
      // Send a test order confirmation email
      const result = await emailTriggerFix.createTestOrderEmail(testEmail);
      
      if (result.success) {
        toast.success('✅ Test email queued successfully!');
        toast.info('Check your email in a few minutes. The email will be processed automatically.');
        
        // Try to process the queue immediately
        try {
          await emailTriggerFix.forceProcessAllPendingEmails();
          toast.info('📤 Mail queue processed - check your email now!');
        } catch (processError) {
          console.warn('Queue processing failed:', processError);
        }
        
        setLastTestResult({
          success: true,
          message: `Test email sent to ${testEmail}`,
          timestamp: new Date().toLocaleString()
        });
      } else {
        toast.error(`Failed to send test email: ${result.message}`);
        setLastTestResult({
          success: false,
          message: result.message || 'Failed to send test email',
          timestamp: new Date().toLocaleString()
        });
      }
    } catch (error) {
      toast.error('Error sending test email');
      setLastTestResult({
        success: false,
        message: 'Error sending test email',
        timestamp: new Date().toLocaleString()
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  const getStatusBadge = () => {
    switch (systemStatus) {
      case 'healthy':
        return <Badge className="bg-green-100 text-green-800">Healthy</Badge>;
      case 'issues':
        return <Badge variant="destructive">Issues Found</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getStatusIcon = () => {
    switch (systemStatus) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'issues':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Mail className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          Email System Test
        </CardTitle>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Status:</span>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Health Check */}
        <div>
          <Button
            onClick={quickHealthCheck}
            disabled={isTestingSystem}
            variant="outline"
            className="w-full flex items-center gap-2"
          >
            <Loader2 className={`w-4 h-4 ${isTestingSystem ? 'animate-spin' : 'hidden'}`} />
            <Mail className={`w-4 h-4 ${isTestingSystem ? 'hidden' : 'block'}`} />
            {isTestingSystem ? 'Testing...' : 'Check Email System'}
          </Button>
        </div>

        {/* Test Email Sending */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Test Email Address</label>
          <Input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="your.email@example.com"
          />
          <Button
            onClick={sendTestEmail}
            disabled={isSendingTest || !testEmail}
            className="w-full flex items-center gap-2"
          >
            <Loader2 className={`w-4 h-4 ${isSendingTest ? 'animate-spin' : 'hidden'}`} />
            <Send className={`w-4 h-4 ${isSendingTest ? 'hidden' : 'block'}`} />
            {isSendingTest ? 'Sending...' : 'Send Test Email'}
          </Button>
        </div>

        {/* Last Test Result */}
        {lastTestResult && (
          <Alert className={lastTestResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            <AlertDescription>
              <div className="text-sm">
                <p className="font-medium">{lastTestResult.message}</p>
                <p className="text-xs text-gray-500 mt-1">{lastTestResult.timestamp}</p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Quick Instructions */}
        {systemStatus === 'issues' && (
          <Alert>
            <AlertCircle className="w-4 h-4" />
            <AlertDescription className="text-xs">
              Email system has issues. If you're an admin, check the Admin Dashboard → Email tab for detailed diagnostics and fixes.
            </AlertDescription>
          </Alert>
        )}

        {systemStatus === 'healthy' && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <AlertDescription className="text-xs text-green-700">
              Email system is working correctly. Test emails should arrive within a few minutes.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default EmailTestingWidget;

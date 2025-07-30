import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Mail, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Play,
  Settings,
  Database,
  Send,
  Clock,
  Eye,
  Wrench
} from 'lucide-react';
import { toast } from 'sonner';
import { emailTriggerFix, EmailTriggerTest } from '@/utils/emailTriggerFix';
import EmailPatternDebugger from './EmailPatternDebugger';

interface EmailDiagnosticsState {
  isRunning: boolean;
  tests: EmailTriggerTest[];
  lastRun: string | null;
  overallStatus: 'healthy' | 'warning' | 'critical' | 'unknown';
}

interface RecentEmail {
  id: string;
  subject: string;
  status: string;
  created_at: string;
  email: string;
  retry_count?: number;
}

const EmailDiagnosticsDashboard: React.FC = () => {
  const [diagnostics, setDiagnostics] = useState<EmailDiagnosticsState>({
    isRunning: false,
    tests: [],
    lastRun: null,
    overallStatus: 'unknown'
  });

  const [recentEmails, setRecentEmails] = useState<RecentEmail[]>([]);
  const [testEmail, setTestEmail] = useState('');
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);

  const runDiagnostics = async () => {
    setDiagnostics(prev => ({ ...prev, isRunning: true }));
    
    try {
      console.log('🔍 Running comprehensive email diagnostics...');
      const results = await emailTriggerFix.diagnoseAllEmailTriggers();

      // Determine overall status
      const hasFailures = results.some(test => !test.success);
      const hasWarnings = results.some(test => test.success && test.message.includes('warning'));

      let overallStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
      if (hasFailures) {
        overallStatus = 'critical';
      } else if (hasWarnings) {
        overallStatus = 'warning';
      }

      setDiagnostics({
        isRunning: false,
        tests: results,
        lastRun: new Date().toISOString(),
        overallStatus
      });

      // Show summary toast
      const successCount = results.filter(test => test.success).length;
      const failureCount = results.length - successCount;

      // More detailed feedback about edge functions
      const edgeFunctionIssues = results.filter(test =>
        !test.success && test.message.includes('not accessible')
      ).length;

      if (failureCount === 0) {
        toast.success(`✅ All ${successCount} email system checks passed!`);
      } else if (edgeFunctionIssues > 0) {
        toast.warning(`⚠️ ${edgeFunctionIssues} edge functions not deployed, ${successCount} checks passed`);
      } else {
        toast.error(`��� ${failureCount} issues found, ${successCount} checks passed`);
      }

    } catch (error) {
      console.error('Diagnostics error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Create a mock result to show the error
      const errorResult = {
        name: 'Diagnostics System',
        success: false,
        message: `Failed to run diagnostics: ${errorMessage}`,
        details: { error: errorMessage },
        fix: [
          'Check browser console for detailed errors',
          'Verify Supabase project is accessible',
          'Try refreshing the page'
        ]
      };

      setDiagnostics({
        isRunning: false,
        tests: [errorResult],
        lastRun: new Date().toISOString(),
        overallStatus: 'critical'
      });

      toast.error(`Failed to run diagnostics: ${errorMessage}`);
    }
  };

  const loadRecentEmails = async () => {
    try {
      const result = await emailTriggerFix.debugEmailSubjects();
      if (result.success && result.details?.recentEmailSamples) {
        setRecentEmails(result.details.recentEmailSamples);
      }
    } catch (error) {
      console.error('Failed to load recent emails:', error);
    }
  };

  const processMailQueue = async () => {
    setIsProcessingQueue(true);
    try {
      const result = await emailTriggerFix.forceProcessAllPendingEmails();
      
      if (result.success) {
        toast.success(result.message);
        await loadRecentEmails(); // Refresh the email list
        await runDiagnostics(); // Re-run diagnostics
      } else {
        toast.error(`Queue processing failed: ${result.message}`);
      }
    } catch (error) {
      toast.error('Failed to process mail queue');
    } finally {
      setIsProcessingQueue(false);
    }
  };

  const sendTestEmail = async (emailType: 'order' | 'commit') => {
    if (!testEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSendingTest(true);
    try {
      const result = emailType === 'order' 
        ? await emailTriggerFix.createTestOrderEmail(testEmail)
        : await emailTriggerFix.createTestCommitEmail(testEmail);
      
      if (result.success) {
        toast.success(`✅ Test ${emailType} email queued successfully!`);
        toast.info('Check your email in a few minutes. Process the queue if needed.');
        await loadRecentEmails();
      } else {
        toast.error(`Failed to queue test email: ${result.message}`);
      }
    } catch (error) {
      toast.error(`Error sending test ${emailType} email`);
    } finally {
      setIsSendingTest(false);
    }
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="w-5 h-5 text-green-600" />
    ) : (
      <XCircle className="w-5 h-5 text-red-600" />
    );
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'healthy': 'default',
      'warning': 'secondary', 
      'critical': 'destructive',
      'unknown': 'outline'
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  useEffect(() => {
    runDiagnostics();
    loadRecentEmails();
  }, []);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Mail className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold">Email System Diagnostics</h1>
            <p className="text-gray-600">Monitor and troubleshoot email functionality</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {getStatusBadge(diagnostics.overallStatus)}
          <Button
            onClick={runDiagnostics}
            disabled={diagnostics.isRunning}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${diagnostics.isRunning ? 'animate-spin' : ''}`} />
            {diagnostics.isRunning ? 'Running...' : 'Run Diagnostics'}
          </Button>
        </div>
      </div>

      {diagnostics.lastRun && (
        <Alert>
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>
            Last diagnostic run: {new Date(diagnostics.lastRun).toLocaleString()}
            {diagnostics.overallStatus === 'critical' && (
              <span className="ml-2 font-semibold text-red-600">
                Critical issues found - emails may not be working!
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="diagnostics" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="diagnostics" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Diagnostics
          </TabsTrigger>
          <TabsTrigger value="queue" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Mail Queue
          </TabsTrigger>
          <TabsTrigger value="test" className="flex items-center gap-2">
            <Send className="w-4 h-4" />
            Test Emails
          </TabsTrigger>
          <TabsTrigger value="recent" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Recent Emails
          </TabsTrigger>
          <TabsTrigger value="debug" className="flex items-center gap-2">
            <Wrench className="w-4 h-4" />
            Debug
          </TabsTrigger>
        </TabsList>

        <TabsContent value="diagnostics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="w-5 h-5" />
                System Health Checks
              </CardTitle>
            </CardHeader>
            <CardContent>
              {diagnostics.tests.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No diagnostics run yet. Click "Run Diagnostics" to start.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {diagnostics.tests.map((test, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(test.success)}
                          <div>
                            <h3 className="font-semibold">{test.name}</h3>
                            <p className="text-sm text-gray-600">{test.message}</p>
                          </div>
                        </div>
                        {getStatusBadge(test.success ? 'healthy' : 'critical')}
                      </div>
                      
                      {test.details && (
                        <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                          <strong>Details:</strong>
                          <pre className="mt-1 overflow-x-auto">
                            {JSON.stringify(test.details, null, 2)}
                          </pre>
                        </div>
                      )}
                      
                      {test.fix && test.fix.length > 0 && (
                        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded">
                          <strong className="text-amber-800">How to fix:</strong>
                          <ul className="mt-1 list-disc list-inside text-amber-700">
                            {test.fix.map((step, i) => (
                              <li key={i} className="text-sm">{step}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="queue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Mail Queue Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Clock className="w-4 h-4" />
                <AlertDescription>
                  The mail queue processes emails automatically, but you can manually trigger processing here.
                </AlertDescription>
              </Alert>
              
              <Button
                onClick={processMailQueue}
                disabled={isProcessingQueue}
                className="flex items-center gap-2 w-full"
              >
                <Play className={`w-4 h-4 ${isProcessingQueue ? 'animate-spin' : ''}`} />
                {isProcessingQueue ? 'Processing Queue...' : 'Process Mail Queue Now'}
              </Button>
              
              <div className="text-sm text-gray-600">
                <p>This will attempt to send all pending emails in the queue.</p>
                <p>Failed emails will be retried up to 3 times.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="w-5 h-5" />
                Send Test Emails
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Test Email Address
                </label>
                <Input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={() => sendTestEmail('order')}
                  disabled={isSendingTest || !testEmail}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Test Order Confirmation
                </Button>
                
                <Button
                  onClick={() => sendTestEmail('commit')}
                  disabled={isSendingTest || !testEmail}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Test Commit Notification
                </Button>
              </div>
              
              <Alert>
                <Mail className="w-4 h-4" />
                <AlertDescription>
                  Test emails are added to the queue and will be sent when the queue is processed.
                  After sending, process the mail queue or wait for automatic processing.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Recent Email Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentEmails.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No recent emails found</p>
                  <Button 
                    onClick={loadRecentEmails} 
                    variant="outline" 
                    className="mt-2"
                  >
                    Refresh
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentEmails.map((email, index) => (
                    <div key={email.id || `email-${index}`} className="border rounded p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{email.subject}</h4>
                          <p className="text-sm text-gray-600">To: {email.email}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(email.created_at).toLocaleString()}
                          </p>
                        </div>
                        <Badge variant={
                          email.status === 'sent' ? 'default' :
                          email.status === 'failed' ? 'destructive' : 'secondary'
                        }>
                          {email.status}
                          {email.retry_count && email.retry_count > 0 && ` (${email.retry_count})`}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  
                  <Button 
                    onClick={loadRecentEmails} 
                    variant="outline" 
                    className="w-full mt-4"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh Recent Emails
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="debug" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="w-5 h-5" />
                Email Pattern Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EmailPatternDebugger />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmailDiagnosticsDashboard;

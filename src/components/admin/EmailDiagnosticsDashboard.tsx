import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Mail, 
  Send, 
  Clock, 
  Database,
  Settings,
  MessageSquare,
  FileText
} from 'lucide-react';
import { emailDiagnosticsService, EmailSystemStatus, EmailDiagnosticResult } from '../../utils/emailDiagnostics';
import { emailTriggerFix, EmailTriggerTest } from '../../utils/emailTriggerFix';
import { toast } from 'sonner';

export const EmailDiagnosticsDashboard: React.FC = () => {
  const [diagnosticsStatus, setDiagnosticsStatus] = useState<EmailSystemStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [recentEmails, setRecentEmails] = useState<EmailDiagnosticResult | null>(null);
  const [triggerTests, setTriggerTests] = useState<EmailTriggerTest[] | null>(null);
  const [processingEmails, setProcessingEmails] = useState(false);
  const [debuggingSubjects, setDebuggingSubjects] = useState(false);
  const [subjectDebugResult, setSubjectDebugResult] = useState<any>(null);

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    setLoading(true);
    try {
      const status = await emailDiagnosticsService.runFullDiagnostics();
      setDiagnosticsStatus(status);
      
      if (status.overallStatus === 'healthy') {
        toast.success('Email system is healthy!');
      } else if (status.overallStatus === 'degraded') {
        toast.warning('Email system has some issues but is partially working');
      } else {
        toast.error('Email system has critical issues');
      }
    } catch (error) {
      console.error('Diagnostics error:', error);
      toast.error('Failed to run diagnostics');
    } finally {
      setLoading(false);
    }
  };

  const loadRecentEmails = async () => {
    try {
      const result = await emailDiagnosticsService.getRecentEmailLogs(50);
      setRecentEmails(result);
      
      if (result.success) {
        toast.success(`Loaded ${result.details?.emails?.length || 0} recent emails`);
      } else {
        toast.error(result.error || 'Failed to load emails');
      }
    } catch (error) {
      console.error('Load emails error:', error);
      toast.error('Failed to load recent emails');
    }
  };

  const sendTestEmail = async () => {
    if (!testEmail) {
      toast.error('Please enter an email address');
      return;
    }

    try {
      const result = await emailDiagnosticsService.addTestEmailToQueue(testEmail);

      if (result.success) {
        toast.success('Test email added to queue successfully!');
        setTestEmail('');
        // Refresh the diagnostics to show updated queue status
        setTimeout(runDiagnostics, 1000);
      } else {
        toast.error(result.error || 'Failed to add test email');
      }
    } catch (error) {
      console.error('Test email error:', error);
      toast.error('Failed to send test email');
    }
  };

  const runTriggerTests = async () => {
    try {
      const tests = await emailTriggerFix.diagnoseAllEmailTriggers();
      setTriggerTests(tests);

      const failedTests = tests.filter(test => !test.success);
      if (failedTests.length === 0) {
        toast.success('All email triggers are working correctly!');
      } else {
        toast.warning(`${failedTests.length} email trigger issues found`);
      }
    } catch (error) {
      console.error('Trigger test error:', error);
      toast.error('Failed to run trigger tests');
    }
  };

  const processStuckEmails = async () => {
    setProcessingEmails(true);
    try {
      const result = await emailTriggerFix.forceProcessAllPendingEmails();

      if (result.success) {
        toast.success(result.message);
        // Refresh diagnostics and trigger tests
        setTimeout(() => {
          runDiagnostics();
          runTriggerTests();
        }, 1000);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Process emails error:', error);
      toast.error('Failed to process stuck emails');
    } finally {
      setProcessingEmails(false);
    }
  };

  const sendTestOrderEmail = async () => {
    if (!testEmail) {
      toast.error('Please enter an email address');
      return;
    }

    try {
      const result = await emailTriggerFix.createTestOrderEmail(testEmail);

      if (result.success) {
        toast.success('Test order email created and queued!');
        setTimeout(runDiagnostics, 1000);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Test order email error:', error);
      toast.error('Failed to create test order email');
    }
  };

  const sendTestCommitEmail = async () => {
    if (!testEmail) {
      toast.error('Please enter an email address');
      return;
    }

    try {
      const result = await emailTriggerFix.createTestCommitEmail(testEmail);

      if (result.success) {
        toast.success('Test commit email created and queued!');
        setTimeout(runDiagnostics, 1000);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Test commit email error:', error);
      toast.error('Failed to create test commit email');
    }
  };

  const debugEmailSubjects = async () => {
    setDebuggingSubjects(true);
    try {
      const result = await emailTriggerFix.debugEmailSubjects();
      setSubjectDebugResult(result);

      if (result.success) {
        toast.success(`Found ${result.details?.totalEmails || 0} recent emails to analyze`);
      } else {
        toast.error('Failed to debug email subjects');
      }
    } catch (error) {
      console.error('Subject debug error:', error);
      toast.error('Failed to debug email subjects');
    } finally {
      setDebuggingSubjects(false);
    }
  };

  const getStatusIcon = (result: EmailDiagnosticResult) => {
    if (result.success) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getOverallStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge className="bg-green-100 text-green-800">Healthy</Badge>;
      case 'degraded':
        return <Badge className="bg-yellow-100 text-yellow-800">Degraded</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (!diagnosticsStatus) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email System Diagnostics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Button onClick={runDiagnostics} disabled={loading}>
              {loading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Running Diagnostics...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Run Diagnostics
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email System Status
            </div>
            <div className="flex items-center gap-2">
              {getOverallStatusBadge(diagnosticsStatus.overallStatus)}
              <Button variant="outline" size="sm" onClick={runDiagnostics} disabled={loading}>
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Monitor and troubleshoot your email system
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="triggers">Email Triggers</TabsTrigger>
          <TabsTrigger value="tests">Component Tests</TabsTrigger>
          <TabsTrigger value="queue">Mail Queue</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="triggers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Email Trigger Analysis
                </div>
                <Button variant="outline" size="sm" onClick={runTriggerTests}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Test All Triggers
                </Button>
              </CardTitle>
              <CardDescription>
                Deep analysis of all email triggers in the order and commit flow
              </CardDescription>
            </CardHeader>
            <CardContent>
              {triggerTests ? (
                <div className="space-y-4">
                  {triggerTests.map((test, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon({ success: test.success, message: test.message })}
                          <span className="font-medium">{test.name}</span>
                        </div>
                        <Badge variant={test.success ? 'default' : 'destructive'}>
                          {test.success ? 'PASS' : 'FAIL'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{test.message}</p>

                      {test.details && (
                        <div className="mt-2 p-3 bg-gray-50 rounded-md">
                          <pre className="text-xs overflow-auto">
                            {JSON.stringify(test.details, null, 2)}
                          </pre>
                        </div>
                      )}

                      {test.fix && test.fix.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-red-600 mb-2">How to fix:</p>
                          <ul className="list-disc list-inside space-y-1">
                            {test.fix.map((fixStep, fixIndex) => (
                              <li key={fixIndex} className="text-sm text-gray-600">{fixStep}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 space-y-4">
                  <Button onClick={runTriggerTests}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Run Email Trigger Tests
                  </Button>

                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={debugEmailSubjects}
                      variant="outline"
                      disabled={debuggingSubjects}
                    >
                      {debuggingSubjects ? (
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <FileText className="mr-2 h-4 w-4" />
                      )}
                      Debug Email Subjects
                    </Button>
                  </div>
                </div>
              )}

              {subjectDebugResult && (
                <div className="mt-6 p-4 border rounded-lg bg-blue-50">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Email Subject Debug Results
                  </h4>

                  {subjectDebugResult.success ? (
                    <div className="space-y-3">
                      <p className="text-sm text-green-600 font-medium">
                        ✅ {subjectDebugResult.message}
                      </p>

                      {subjectDebugResult.details?.subjectGroups && (
                        <div>
                          <h5 className="font-medium text-sm mb-2">Email Subjects Found (with counts):</h5>
                          <div className="space-y-1">
                            {Object.entries(subjectDebugResult.details.subjectGroups).map(([subject, count]) => (
                              <div key={subject} className="text-xs p-2 bg-white rounded border">
                                <span className="font-mono text-blue-600">"{subject}"</span>
                                <span className="ml-2 text-gray-500">({count} emails)</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {subjectDebugResult.details?.recentEmailSamples && (
                        <div>
                          <h5 className="font-medium text-sm mb-2">Recent Email Samples:</h5>
                          <div className="space-y-1 max-h-40 overflow-y-auto">
                            {subjectDebugResult.details.recentEmailSamples.map((email, index) => (
                              <div key={index} className="text-xs p-2 bg-white rounded border">
                                <div className="font-mono text-blue-600">"{email.subject}"</div>
                                <div className="text-gray-500 mt-1">
                                  {email.created_at} • {email.status}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-red-600">
                      ❌ {subjectDebugResult.message}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Environment Setup</CardTitle>
                {getStatusIcon(diagnosticsStatus.environmentVariablesCheck)}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {diagnosticsStatus.environmentVariablesCheck.success ? 'Configured' : 'Missing'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {diagnosticsStatus.environmentVariablesCheck.message}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Mail Queue</CardTitle>
                {getStatusIcon(diagnosticsStatus.mailQueueCheck)}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {diagnosticsStatus.mailQueueCheck.details?.pendingEmails || 0} Pending
                </div>
                <p className="text-xs text-muted-foreground">
                  {diagnosticsStatus.mailQueueCheck.details?.failedEmails || 0} failed emails
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Send Function</CardTitle>
                {getStatusIcon(diagnosticsStatus.sendEmailFunctionCheck)}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {diagnosticsStatus.sendEmailFunctionCheck.success ? 'Online' : 'Offline'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Email sending service status
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Queue Processor</CardTitle>
                {getStatusIcon(diagnosticsStatus.mailQueueProcessorCheck)}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {diagnosticsStatus.mailQueueProcessorCheck.success ? 'Active' : 'Inactive'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Mail queue processing service
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Test Specific Email Types
              </CardTitle>
              <CardDescription>
                Test the exact email types that should be triggered during order flow
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="test-email">Email Address</Label>
                <Input
                  id="test-email"
                  type="email"
                  placeholder="test@example.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2 md:grid-cols-3">
                <Button onClick={sendTestOrderEmail} variant="outline">
                  <Mail className="mr-2 h-4 w-4" />
                  Order Receipt
                </Button>
                <Button onClick={sendTestCommitEmail} variant="outline">
                  <Clock className="mr-2 h-4 w-4" />
                  Commit Request
                </Button>
                <Button onClick={sendTestEmail} variant="outline">
                  <Send className="mr-2 h-4 w-4" />
                  General Test
                </Button>
              </div>
              <div className="mt-4">
                <Button onClick={processStuckEmails} disabled={processingEmails} className="w-full">
                  {processingEmails ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Processing Emails...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Process All Pending Emails
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tests" className="space-y-4">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Environment Variables Check
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-2">
                  {getStatusIcon(diagnosticsStatus.environmentVariablesCheck)}
                  <span className="font-medium">{diagnosticsStatus.environmentVariablesCheck.message}</span>
                </div>
                {diagnosticsStatus.environmentVariablesCheck.error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{diagnosticsStatus.environmentVariablesCheck.error}</AlertDescription>
                  </Alert>
                )}
                {diagnosticsStatus.environmentVariablesCheck.details && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-md">
                    <pre className="text-sm">{JSON.stringify(diagnosticsStatus.environmentVariablesCheck.details, null, 2)}</pre>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Mail Queue Table Check
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-2">
                  {getStatusIcon(diagnosticsStatus.mailQueueCheck)}
                  <span className="font-medium">{diagnosticsStatus.mailQueueCheck.message}</span>
                </div>
                {diagnosticsStatus.mailQueueCheck.details && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-md">
                    <div className="text-sm space-y-1">
                      <div>Total emails: {diagnosticsStatus.mailQueueCheck.details.totalEmails}</div>
                      <div>Pending: {diagnosticsStatus.mailQueueCheck.details.pendingEmails}</div>
                      <div>Failed: {diagnosticsStatus.mailQueueCheck.details.failedEmails}</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Send Email Function Test
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-2">
                  {getStatusIcon(diagnosticsStatus.sendEmailFunctionCheck)}
                  <span className="font-medium">{diagnosticsStatus.sendEmailFunctionCheck.message}</span>
                </div>
                {diagnosticsStatus.sendEmailFunctionCheck.error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{diagnosticsStatus.sendEmailFunctionCheck.error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Mail Queue Processor Test
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-2">
                  {getStatusIcon(diagnosticsStatus.mailQueueProcessorCheck)}
                  <span className="font-medium">{diagnosticsStatus.mailQueueProcessorCheck.message}</span>
                </div>
                {diagnosticsStatus.mailQueueProcessorCheck.details && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-md">
                    <pre className="text-sm">{JSON.stringify(diagnosticsStatus.mailQueueProcessorCheck.details, null, 2)}</pre>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="queue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Recent Emails
                </div>
                <Button variant="outline" size="sm" onClick={loadRecentEmails}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentEmails ? (
                <div className="space-y-4">
                  {recentEmails.success ? (
                    <div>
                      <div className="mb-4 grid gap-4 md:grid-cols-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold">{recentEmails.details?.summary?.total || 0}</div>
                          <div className="text-sm text-muted-foreground">Total</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{recentEmails.details?.summary?.sent || 0}</div>
                          <div className="text-sm text-muted-foreground">Sent</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-yellow-600">{recentEmails.details?.summary?.pending || 0}</div>
                          <div className="text-sm text-muted-foreground">Pending</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600">{recentEmails.details?.summary?.failed || 0}</div>
                          <div className="text-sm text-muted-foreground">Failed</div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {recentEmails.details?.emails?.slice(0, 10).map((email: any) => (
                          <div key={email.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex-1">
                              <div className="font-medium">{email.subject}</div>
                              <div className="text-sm text-muted-foreground">{email.email}</div>
                              <div className="text-xs text-muted-foreground">{formatDate(email.created_at)}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={
                                email.status === 'sent' ? 'default' : 
                                email.status === 'pending' ? 'secondary' : 'destructive'
                              }>
                                {email.status}
                              </Badge>
                              {email.retry_count > 0 && (
                                <Badge variant="outline">{email.retry_count} retries</Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{recentEmails.error}</AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Button onClick={loadRecentEmails}>
                    <Database className="mr-2 h-4 w-4" />
                    Load Recent Emails
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Recommendations
              </CardTitle>
              <CardDescription>
                Steps to fix email system issues
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {diagnosticsStatus.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <MessageSquare className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">{recommendation}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmailDiagnosticsDashboard;

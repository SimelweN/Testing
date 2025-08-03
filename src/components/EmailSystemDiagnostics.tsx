import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  Mail, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Send, 
  Database,
  Zap,
  Clock,
  Users,
  ShoppingCart,
  CreditCard
} from "lucide-react";
import { emailService, EmailRequest } from "@/services/emailService";
import { emailTriggerFix } from "@/utils/emailTriggerFix";
import { supabase } from "@/lib/supabase";

interface EmailTest {
  id: string;
  name: string;
  description: string;
  category: 'system' | 'order' | 'commit' | 'purchase' | 'admin';
  icon: React.ReactNode;
  testFunction: () => Promise<{success: boolean; message: string; details?: any}>;
}

interface DiagnosticResult {
  test: EmailTest;
  result: {success: boolean; message: string; details?: any};
  timestamp: Date;
}

const EmailSystemDiagnostics: React.FC = () => {
  const [testEmail, setTestEmail] = useState("");
  const [customEmailSubject, setCustomEmailSubject] = useState("Test Email from ReBooked Solutions");
  const [customEmailBody, setCustomEmailBody] = useState("This is a test email to verify the email system is working correctly.");
  const [selectedTestType, setSelectedTestType] = useState<string>("");
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [diagnosticResults, setDiagnosticResults] = useState<DiagnosticResult[]>([]);
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);

  // Define all email tests
  const emailTests: EmailTest[] = [
    {
      id: "system-health",
      name: "Email System Health Check",
      description: "Tests mail queue access, edge functions, and SMTP connectivity",
      category: "system",
      icon: <Zap className="h-4 w-4" />,
      testFunction: async () => {
        const results = await emailTriggerFix.diagnoseAllEmailTriggers();
        const failedTests = results.filter(r => !r.success);
        
        if (failedTests.length === 0) {
          return {
            success: true,
            message: "All email system components are working correctly",
            details: results
          };
        } else {
          return {
            success: false,
            message: `${failedTests.length} email system issues detected`,
            details: {
              allResults: results,
              failedTests: failedTests.map(t => ({ name: t.name, message: t.message, fix: t.fix }))
            }
          };
        }
      }
    },
    {
      id: "direct-email",
      name: "Direct Email Send Test",
      description: "Tests direct email sending via edge function",
      category: "system",
      icon: <Send className="h-4 w-4" />,
      testFunction: async () => {
        if (!testEmail) {
          return { success: false, message: "Please enter a test email address first" };
        }

        try {
          const emailRequest: EmailRequest = {
            to: testEmail,
            subject: "✅ Direct Email Test - ReBooked Solutions",
            html: `
              <!DOCTYPE html>
              <html>
              <head><meta charset="utf-8"><title>Direct Email Test</title></head>
              <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9;">
                <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px;">
                  <h1 style="color: #22c55e;">✅ Direct Email Test Successful!</h1>
                  <p>This email was sent directly via the send-email edge function.</p>
                  <div style="background: #f0f9ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h3>Test Details:</h3>
                    <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
                    <p><strong>Method:</strong> Direct edge function call</p>
                    <p><strong>Recipient:</strong> ${testEmail}</p>
                  </div>
                  <p>If you receive this email, the direct email sending system is working correctly!</p>
                </div>
              </body>
              </html>
            `,
            text: `Direct Email Test Successful! 

This email was sent directly via the send-email edge function.

Test Details:
- Timestamp: ${new Date().toISOString()}
- Method: Direct edge function call
- Recipient: ${testEmail}

If you receive this email, the direct email sending system is working correctly!`
          };

          const result = await emailService.sendEmail(emailRequest);
          
          if (result.success) {
            return {
              success: true,
              message: `Direct email sent successfully to ${testEmail}`,
              details: result
            };
          } else {
            return {
              success: false,
              message: `Direct email failed: ${result.error}`,
              details: result
            };
          }
        } catch (error) {
          return {
            success: false,
            message: `Direct email error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            details: error
          };
        }
      }
    },
    {
      id: "queue-insertion",
      name: "Mail Queue Insertion Test",
      description: "Tests inserting emails directly into mail_queue table",
      category: "system",
      icon: <Database className="h-4 w-4" />,
      testFunction: async () => {
        if (!testEmail) {
          return { success: false, message: "Please enter a test email address first" };
        }

        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            return { success: false, message: "User not authenticated" };
          }

          const testEmailData = {
            user_id: user.id,
            email: testEmail,
            subject: "📨 Mail Queue Test - ReBooked Solutions",
            body: `
              <!DOCTYPE html>
              <html>
              <head><meta charset="utf-8"><title>Mail Queue Test</title></head>
              <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9;">
                <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px;">
                  <h1 style="color: #3b82f6;">📨 Mail Queue Test Successful!</h1>
                  <p>This email was queued in the mail_queue table and processed automatically.</p>
                  <div style="background: #eff6ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h3>Test Details:</h3>
                    <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
                    <p><strong>Method:</strong> Mail queue insertion + processing</p>
                    <p><strong>Recipient:</strong> ${testEmail}</p>
                  </div>
                  <p>If you receive this email, the mail queue system is working correctly!</p>
                </div>
              </body>
              </html>
            `,
            status: 'pending',
            created_at: new Date().toISOString()
          };

          const { error: insertError } = await supabase
            .from('mail_queue')
            .insert(testEmailData);

          if (insertError) {
            return {
              success: false,
              message: `Failed to insert into mail queue: ${insertError.message}`,
              details: insertError
            };
          }

          // Try to process the queue
          const processResult = await emailTriggerFix.forceProcessAllPendingEmails();
          
          return {
            success: true,
            message: `Email queued successfully and processing initiated for ${testEmail}`,
            details: { insertion: true, processing: processResult }
          };

        } catch (error) {
          return {
            success: false,
            message: `Queue insertion error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            details: error
          };
        }
      }
    },
    {
      id: "order-flow-test",
      name: "Order Creation Email Flow",
      description: "Tests the complete order creation email sequence",
      category: "order",
      icon: <ShoppingCart className="h-4 w-4" />,
      testFunction: async () => {
        if (!testEmail) {
          return { success: false, message: "Please enter a test email address first" };
        }

        try {
          const orderTestResult = await emailTriggerFix.createTestOrderEmail(testEmail);
          
          if (orderTestResult.success) {
            // Also try to process pending emails
            const processResult = await emailTriggerFix.forceProcessAllPendingEmails();
            
            return {
              success: true,
              message: `Order confirmation email created and queued for ${testEmail}`,
              details: { orderEmail: orderTestResult, processing: processResult }
            };
          } else {
            return {
              success: false,
              message: `Order email creation failed: ${orderTestResult.message}`,
              details: orderTestResult
            };
          }
        } catch (error) {
          return {
            success: false,
            message: `Order flow test error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            details: error
          };
        }
      }
    },
    {
      id: "commit-flow-test",
      name: "Seller Commit Email Flow",
      description: "Tests seller commit notification emails",
      category: "commit",
      icon: <Users className="h-4 w-4" />,
      testFunction: async () => {
        if (!testEmail) {
          return { success: false, message: "Please enter a test email address first" };
        }

        try {
          const commitTestResult = await emailTriggerFix.createTestCommitEmail(testEmail);
          
          if (commitTestResult.success) {
            // Also try to process pending emails
            const processResult = await emailTriggerFix.forceProcessAllPendingEmails();
            
            return {
              success: true,
              message: `Commit notification email created and queued for ${testEmail}`,
              details: { commitEmail: commitTestResult, processing: processResult }
            };
          } else {
            return {
              success: false,
              message: `Commit email creation failed: ${commitTestResult.message}`,
              details: commitTestResult
            };
          }
        } catch (error) {
          return {
            success: false,
            message: `Commit flow test error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            details: error
          };
        }
      }
    },
    {
      id: "custom-email-test",
      name: "Custom Email Test",
      description: "Send a custom test email with your own content",
      category: "admin",
      icon: <Mail className="h-4 w-4" />,
      testFunction: async () => {
        if (!testEmail) {
          return { success: false, message: "Please enter a test email address first" };
        }

        try {
          const emailRequest: EmailRequest = {
            to: testEmail,
            subject: customEmailSubject,
            html: `
              <!DOCTYPE html>
              <html>
              <head><meta charset="utf-8"><title>Custom Test Email</title></head>
              <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9;">
                <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px;">
                  <h1 style="color: #8b5cf6;">📝 Custom Test Email</h1>
                  <div style="background: #faf5ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    ${customEmailBody.split('\n').map(line => `<p>${line}</p>`).join('')}
                  </div>
                  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 14px; color: #666;">
                    <p><strong>Custom Test Email</strong><br>
                    Sent: ${new Date().toISOString()}<br>
                    To: ${testEmail}</p>
                  </div>
                </div>
              </body>
              </html>
            `,
            text: `Custom Test Email

${customEmailBody}

--
Custom Test Email
Sent: ${new Date().toISOString()}
To: ${testEmail}`
          };

          const result = await emailService.sendEmail(emailRequest);
          
          if (result.success) {
            return {
              success: true,
              message: `Custom email sent successfully to ${testEmail}`,
              details: result
            };
          } else {
            return {
              success: false,
              message: `Custom email failed: ${result.error}`,
              details: result
            };
          }
        } catch (error) {
          return {
            success: false,
            message: `Custom email error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            details: error
          };
        }
      }
    }
  ];

  const runSingleTest = async (test: EmailTest) => {
    setIsRunningTests(true);
    
    try {
      toast.info(`Running test: ${test.name}...`);
      const result = await test.testFunction();
      
      const diagnosticResult: DiagnosticResult = {
        test,
        result,
        timestamp: new Date()
      };
      
      setDiagnosticResults(prev => [diagnosticResult, ...prev.slice(0, 9)]); // Keep last 10 results
      
      if (result.success) {
        toast.success(`✅ ${test.name} passed: ${result.message}`);
      } else {
        toast.error(`❌ ${test.name} failed: ${result.message}`);
      }
      
    } catch (error) {
      toast.error(`Exception in ${test.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRunningTests(false);
    }
  };

  const runAllTests = async () => {
    if (!testEmail) {
      toast.error("Please enter a test email address first");
      return;
    }

    setIsRunningDiagnostics(true);
    setDiagnosticResults([]);
    
    try {
      toast.info("Running comprehensive email system diagnostics...");
      
      for (const test of emailTests) {
        await runSingleTest(test);
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      const successCount = diagnosticResults.filter(r => r.result.success).length;
      const totalCount = emailTests.length;
      
      if (successCount === totalCount) {
        toast.success(`🎉 All ${totalCount} email tests passed!`);
      } else {
        toast.warning(`⚠️ ${successCount}/${totalCount} tests passed. Check failed tests for details.`);
      }
      
    } catch (error) {
      toast.error(`Diagnostics error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRunningDiagnostics(false);
    }
  };

  const processAllPendingEmails = async () => {
    try {
      toast.info("Processing all pending emails...");
      const result = await emailTriggerFix.forceProcessAllPendingEmails();
      
      if (result.success) {
        toast.success(`✅ ${result.message}`);
      } else {
        toast.error(`❌ Processing failed: ${result.message}`);
      }
    } catch (error) {
      toast.error(`Processing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'system': return <Zap className="h-4 w-4" />;
      case 'order': return <ShoppingCart className="h-4 w-4" />;
      case 'commit': return <Users className="h-4 w-4" />;
      case 'purchase': return <CreditCard className="h-4 w-4" />;
      case 'admin': return <Mail className="h-4 w-4" />;
      default: return <Mail className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'system': return 'bg-blue-100 text-blue-800';
      case 'order': return 'bg-green-100 text-green-800';
      case 'commit': return 'bg-yellow-100 text-yellow-800';
      case 'purchase': return 'bg-purple-100 text-purple-800';
      case 'admin': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">📧 Email System Diagnostics</h1>
        <p className="text-gray-600">Comprehensive testing and debugging for the ReBooked Solutions email system</p>
      </div>

      {/* Test Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Test Configuration
          </CardTitle>
          <CardDescription>Configure email testing parameters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="testEmail">Test Email Address *</Label>
              <Input
                id="testEmail"
                type="email"
                placeholder="your.email@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="customSubject">Custom Email Subject</Label>
              <Input
                id="customSubject"
                placeholder="Test Email Subject"
                value={customEmailSubject}
                onChange={(e) => setCustomEmailSubject(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="customBody">Custom Email Body</Label>
            <Textarea
              id="customBody"
              placeholder="Enter your custom email content here..."
              value={customEmailBody}
              onChange={(e) => setCustomEmailBody(e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={runAllTests}
              disabled={!testEmail || isRunningDiagnostics}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isRunningDiagnostics ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Running All Tests...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Run All Tests
                </>
              )}
            </Button>
            
            <Button 
              onClick={processAllPendingEmails}
              variant="outline"
            >
              <Clock className="h-4 w-4 mr-2" />
              Process Pending Emails
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Individual Tests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Individual Email Tests
          </CardTitle>
          <CardDescription>Run specific email tests individually</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {emailTests.map((test) => (
              <div key={test.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {test.icon}
                    <Badge className={getCategoryColor(test.category)}>
                      {test.category}
                    </Badge>
                  </div>
                </div>
                
                <h3 className="font-semibold mb-2">{test.name}</h3>
                <p className="text-sm text-gray-600 mb-4">{test.description}</p>
                
                <Button
                  onClick={() => runSingleTest(test)}
                  disabled={!testEmail || isRunningTests}
                  size="sm"
                  className="w-full"
                  variant="outline"
                >
                  {isRunningTests ? (
                    <>
                      <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <Send className="h-3 w-3 mr-2" />
                      Run Test
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      {diagnosticResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Test Results
            </CardTitle>
            <CardDescription>Recent test execution results</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {diagnosticResults.map((result, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {result.result.success ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      <h4 className="font-semibold">{result.test.name}</h4>
                      <Badge className={getCategoryColor(result.test.category)}>
                        {result.test.category}
                      </Badge>
                    </div>
                    <span className="text-xs text-gray-500">
                      {result.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  
                  <p className={`text-sm mb-2 ${result.result.success ? 'text-green-700' : 'text-red-700'}`}>
                    {result.result.message}
                  </p>
                  
                  {result.result.details && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                        View Details
                      </summary>
                      <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto">
                        {JSON.stringify(result.result.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Instructions:</strong>
          <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
            <li>Enter your test email address in the configuration section</li>
            <li>Run "Run All Tests" for comprehensive diagnostics</li>
            <li>Check individual test results to identify specific issues</li>
            <li>Use "Process Pending Emails" if emails are stuck in the queue</li>
            <li>Failed tests will show detailed error information and suggested fixes</li>
          </ol>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default EmailSystemDiagnostics;

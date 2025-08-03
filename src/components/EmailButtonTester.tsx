import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { 
  Mail, 
  Send, 
  CheckCircle, 
  Users, 
  ShoppingCart, 
  CreditCard,
  RefreshCw,
  AlertTriangle,
  Package,
  Clock,
  X
} from "lucide-react";
import { emailService, EmailRequest } from "@/services/emailService";
import { EnhancedCommitService } from "@/services/enhancedCommitService";
import { EnhancedPurchaseEmailService } from "@/services/enhancedPurchaseEmailService";
import { emailTriggerFix } from "@/utils/emailTriggerFix";
import { supabase } from "@/lib/supabase";

interface EmailButtonScenario {
  id: string;
  name: string;
  description: string;
  category: 'order' | 'commit' | 'purchase' | 'direct' | 'queue';
  icon: React.ReactNode;
  buttonText: string;
  buttonVariant: 'default' | 'destructive' | 'outline' | 'secondary';
  emailFunction: (testEmail: string) => Promise<{success: boolean; message: string; details?: any}>;
}

const EmailButtonTester: React.FC = () => {
  const [testEmail, setTestEmail] = useState("");
  const [loadingScenarios, setLoadingScenarios] = useState<Set<string>>(new Set());

  // Mock data for testing scenarios
  const mockOrderData = {
    orderId: `TEST-ORDER-${Date.now()}`,
    bookId: "test-book-123",
    bookTitle: "Advanced JavaScript Programming",
    bookPrice: 299.99,
    sellerName: "John Seller",
    sellerEmail: "",
    buyerName: "Jane Buyer", 
    buyerEmail: "",
    orderTotal: 299.99,
    orderDate: new Date().toISOString()
  };

  const mockCommitData = {
    orderId: `TEST-COMMIT-${Date.now()}`,
    sellerId: "test-seller-123",
    sellerName: "John Seller",
    sellerEmail: "",
    buyerId: "test-buyer-123", 
    buyerName: "Jane Buyer",
    buyerEmail: "",
    bookTitle: "React Development Handbook",
    bookPrice: 199.99
  };

  // Define all email button scenarios
  const emailScenarios: EmailButtonScenario[] = [
    {
      id: "purchase-complete",
      name: "Purchase Complete Button",
      description: "Simulates clicking 'Complete Purchase' - sends buyer receipt and seller notification",
      category: "purchase",
      icon: <CreditCard className="h-4 w-4" />,
      buttonText: "Complete Purchase",
      buttonVariant: "default",
      emailFunction: async (testEmail: string) => {
        try {
          const purchaseData = {
            ...mockOrderData,
            sellerEmail: testEmail,
            buyerEmail: testEmail
          };

          const result = await EnhancedPurchaseEmailService.sendPurchaseEmailsWithFallback(purchaseData);

          return {
            success: result.sellerEmailSent || result.buyerEmailSent,
            message: result.message,
            details: result
          };
        } catch (error) {
          console.error("Purchase email test failed:", error);
          return {
            success: false,
            message: `Purchase email test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            details: { error }
          };
        }
      }
    },
    {
      id: "commit-to-sale",
      name: "Commit to Sale Button",
      description: "Simulates seller clicking 'Commit to Sale' - sends commitment confirmations to both parties",
      category: "commit",
      icon: <Users className="h-4 w-4" />,
      buttonText: "Commit to Sale",
      buttonVariant: "default",
      emailFunction: async (testEmail: string) => {
        // Use the real commit service but skip actual database operations for testing
        const testResult = await emailTriggerFix.createTestCommitEmail(testEmail);
        
        if (testResult.success) {
          // Also try to process the queued email
          const processResult = await emailTriggerFix.forceProcessAllPendingEmails();
          
          return {
            success: true,
            message: "Commit email sent and processed successfully",
            details: { testResult, processResult }
          };
        } else {
          return {
            success: false,
            message: testResult.message,
            details: testResult
          };
        }
      }
    },
    {
      id: "new-order-alert",
      name: "New Order Alert",
      description: "Simulates new order creation - sends 'Action Required' email to seller",
      category: "order",
      icon: <ShoppingCart className="h-4 w-4" />,
      buttonText: "Place Order",
      buttonVariant: "default",
      emailFunction: async (testEmail: string) => {
        try {
          // Create a detailed new order email
          const { data: { user } } = await supabase.auth.getUser();
          
          if (!user) {
            return { success: false, message: "User not authenticated" };
          }

          const newOrderHtml = `
            <!DOCTYPE html>
            <html>
            <head><meta charset="utf-8"><title>📚 New Order - Action Required!</title></head>
            <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f3fef7;">
              <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px;">
                <h1 style="color: #ff6b6b;">📚 New Order - Action Required!</h1>
                <p><strong>You have a new order from ${mockOrderData.buyerName}!</strong></p>
                
                <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <h3>Order Details:</h3>
                  <p><strong>Book:</strong> ${mockOrderData.bookTitle}</p>
                  <p><strong>Price:</strong> R${mockOrderData.bookPrice}</p>
                  <p><strong>Order ID:</strong> ${mockOrderData.orderId}</p>
                  <p><strong>Buyer:</strong> ${mockOrderData.buyerName}</p>
                </div>
                
                <div style="background: #fef2f2; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <h3 style="color: #dc2626;">⏰ Important - 48 Hour Deadline</h3>
                  <p>You have <strong>48 hours</strong> to commit to this order.</p>
                  <p>If you don't respond within 48 hours, the order will be automatically cancelled and the buyer will be refunded.</p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="#" style="background: #00b894; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                    View & Commit to Order
                  </a>
                </div>
                
                <div style="background: #f0f9ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <h4>What happens next:</h4>
                  <ol>
                    <li>Review the order details</li>
                    <li>Commit to the sale within 48 hours</li>
                    <li>We'll arrange courier pickup</li>
                    <li>Get paid once delivered!</li>
                  </ol>
                </div>
                
                <p style="font-size: 14px; color: #666;">
                  <strong>ReBooked Solutions</strong><br>
                  Order ID: ${mockOrderData.orderId}<br>
                  Generated: ${new Date().toLocaleString()}
                </p>
              </div>
            </body>
            </html>
          `;

          const { error } = await supabase
            .from('mail_queue')
            .insert({
              user_id: user.id,
              email: testEmail,
              subject: '📚 New Order - Action Required (48 hours) - ReBooked Solutions',
              body: newOrderHtml,
              status: 'pending',
              created_at: new Date().toISOString()
            });

          if (error) {
            return {
              success: false,
              message: `Failed to queue new order email: ${error.message}`,
              details: error
            };
          }

          // Try to process the email immediately
          const processResult = await emailTriggerFix.forceProcessAllPendingEmails();
          
          return {
            success: true,
            message: `New order alert queued and processed for ${testEmail}`,
            details: { queueSuccess: true, processResult }
          };

        } catch (error) {
          return {
            success: false,
            message: `New order email error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            details: error
          };
        }
      }
    },
    {
      id: "order-decline",
      name: "Decline Order Button",
      description: "Simulates seller clicking 'Decline Order' - sends decline notification with refund info",
      category: "order",
      icon: <X className="h-4 w-4" />,
      buttonText: "Decline Order",
      buttonVariant: "destructive",
      emailFunction: async (testEmail: string) => {
        try {
          // Call the actual decline-commit edge function with test data
          const { data, error } = await supabase.functions.invoke("decline-commit", {
            body: { 
              order_id: mockCommitData.orderId,
              seller_id: mockCommitData.sellerId,
              reason: "Testing decline email functionality"
            }
          });

          if (error) {
            // If edge function fails, send a test decline email directly
            const declineEmail: EmailRequest = {
              to: testEmail,
              subject: "📋 Order Declined - Refund Processed - ReBooked Solutions",
              html: `
                <!DOCTYPE html>
                <html>
                <head><meta charset="utf-8"><title>Order Declined</title></head>
                <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #fef2f2;">
                  <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px;">
                    <h1 style="color: #dc2626;">📋 Order Declined</h1>
                    <p>Unfortunately, the seller has declined your order for <strong>"${mockCommitData.bookTitle}"</strong>.</p>
                    
                    <div style="background: #fef2f2; padding: 15px; border-radius: 5px; margin: 20px 0;">
                      <h3>Order Details:</h3>
                      <p><strong>Order ID:</strong> ${mockCommitData.orderId}</p>
                      <p><strong>Book:</strong> ${mockCommitData.bookTitle}</p>
                      <p><strong>Amount:</strong> R${mockCommitData.bookPrice}</p>
                      <p><strong>Seller:</strong> ${mockCommitData.sellerName}</p>
                    </div>
                    
                    <div style="background: #d1fae5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                      <h3 style="color: #059669;">💰 Refund Information</h3>
                      <p>Your payment has been automatically refunded and will appear in your account within 3-5 business days.</p>
                      <p><strong>Refund Amount:</strong> R${mockCommitData.bookPrice}</p>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="#" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                        Browse Similar Books
                      </a>
                    </div>
                    
                    <p>We apologize for any inconvenience. Please browse our marketplace for similar books or contact support if you need assistance.</p>
                  </div>
                </body>
                </html>
              `,
              text: `Order Declined - Refund Processed

Unfortunately, the seller has declined your order for "${mockCommitData.bookTitle}".

Order Details:
- Order ID: ${mockCommitData.orderId}
- Book: ${mockCommitData.bookTitle}
- Amount: R${mockCommitData.bookPrice}
- Seller: ${mockCommitData.sellerName}

Refund Information:
Your payment has been automatically refunded and will appear in your account within 3-5 business days.
Refund Amount: R${mockCommitData.bookPrice}

We apologize for any inconvenience.`
            };

            const emailResult = await emailService.sendEmail(declineEmail);
            
            return {
              success: emailResult.success,
              message: emailResult.success 
                ? `Decline notification sent to ${testEmail} (via fallback)` 
                : `Decline email failed: ${emailResult.error}`,
              details: { edgeFunctionError: error, emailResult }
            };
          }

          return {
            success: true,
            message: `Decline notification sent via edge function to ${testEmail}`,
            details: data
          };

        } catch (error) {
          return {
            success: false,
            message: `Decline email error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            details: error
          };
        }
      }
    },
    {
      id: "pickup-scheduled",
      name: "Pickup Scheduled Alert",
      description: "Simulates courier pickup scheduling - sends pickup details to seller",
      category: "order",
      icon: <Package className="h-4 w-4" />,
      buttonText: "Schedule Pickup",
      buttonVariant: "outline",
      emailFunction: async (testEmail: string) => {
        const pickupEmail: EmailRequest = {
          to: testEmail,
          subject: "🚚 Courier Pickup Scheduled - ReBooked Solutions",
          html: `
            <!DOCTYPE html>
            <html>
            <head><meta charset="utf-8"><title>Courier Pickup Scheduled</title></head>
            <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f0f9ff;">
              <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px;">
                <h1 style="color: #3b82f6;">🚚 Courier Pickup Scheduled!</h1>
                <p>Great news! Your courier pickup has been scheduled for the following order:</p>
                
                <div style="background: #dbeafe; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <h3>Pickup Details:</h3>
                  <p><strong>Date:</strong> ${new Date(Date.now() + 24*60*60*1000).toLocaleDateString()}</p>
                  <p><strong>Time Window:</strong> 09:00 - 17:00</p>
                  <p><strong>Tracking Number:</strong> RSA${Date.now()}</p>
                  <p><strong>Courier:</strong> CourierGuy</p>
                </div>
                
                <div style="background: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <h3>Order Information:</h3>
                  <p><strong>Book:</strong> ${mockCommitData.bookTitle}</p>
                  <p><strong>Buyer:</strong> ${mockCommitData.buyerName}</p>
                  <p><strong>Order ID:</strong> ${mockCommitData.orderId}</p>
                  <p><strong>Sale Amount:</strong> R${mockCommitData.bookPrice}</p>
                </div>
                
                <div style="background: #fef2f2; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <h3 style="color: #dc2626;">📋 Important Instructions:</h3>
                  <ul>
                    <li>Package your book securely</li>
                    <li>Be available during the pickup window</li>
                    <li>Have your book ready for collection</li>
                    <li>Provide the tracking number to the courier</li>
                  </ul>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="#" style="background: #f59e0b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                    Track Shipment
                  </a>
                </div>
                
                <p>You'll be paid once the book is successfully delivered to the buyer!</p>
              </div>
            </body>
            </html>
          `,
          text: `Courier Pickup Scheduled!

Great news! Your courier pickup has been scheduled for the following order:

Pickup Details:
- Date: ${new Date(Date.now() + 24*60*60*1000).toLocaleDateString()}
- Time Window: 09:00 - 17:00
- Tracking Number: RSA${Date.now()}
- Courier: CourierGuy

Order Information:
- Book: ${mockCommitData.bookTitle}
- Buyer: ${mockCommitData.buyerName}
- Order ID: ${mockCommitData.orderId}
- Sale Amount: R${mockCommitData.bookPrice}

Important Instructions:
- Package your book securely
- Be available during the pickup window
- Have your book ready for collection
- Provide the tracking number to the courier

You'll be paid once the book is successfully delivered to the buyer!`
        };

        const result = await emailService.sendEmail(pickupEmail);
        
        return {
          success: result.success,
          message: result.success 
            ? `Pickup notification sent to ${testEmail}` 
            : `Pickup email failed: ${result.error}`,
          details: result
        };
      }
    },
    {
      id: "direct-send-test",
      name: "Direct Send Test",
      description: "Tests direct email sending via send-email edge function",
      category: "direct",
      icon: <Send className="h-4 w-4" />,
      buttonText: "Send Test Email",
      buttonVariant: "outline",
      emailFunction: async (testEmail: string) => {
        const directEmail: EmailRequest = {
          to: testEmail,
          subject: "✅ Direct Send Test - ReBooked Solutions",
          html: `
            <!DOCTYPE html>
            <html>
            <head><meta charset="utf-8"><title>Direct Send Test</title></head>
            <body style="font-family: Arial, sans-serif; padding: 20px;">
              <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; border: 2px solid #22c55e;">
                <h1 style="color: #22c55e;">✅ Direct Send Test Successful!</h1>
                <p>This email was sent directly via the send-email edge function to test immediate delivery.</p>
                <div style="background: #f0fdf4; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <h3>Test Information:</h3>
                  <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
                  <p><strong>Method:</strong> Direct edge function call</p>
                  <p><strong>Recipient:</strong> ${testEmail}</p>
                  <p><strong>Purpose:</strong> Button click email testing</p>
                </div>
                <p style="color: #059669;"><strong>If you receive this email, your button-triggered email system is working correctly!</strong></p>
              </div>
            </body>
            </html>
          `,
          text: `Direct Send Test Successful!

This email was sent directly via the send-email edge function to test immediate delivery.

Test Information:
- Timestamp: ${new Date().toISOString()}
- Method: Direct edge function call
- Recipient: ${testEmail}
- Purpose: Button click email testing

If you receive this email, your button-triggered email system is working correctly!`
        };

        const result = await emailService.sendEmail(directEmail);
        
        return {
          success: result.success,
          message: result.success 
            ? `Direct email sent successfully to ${testEmail}` 
            : `Direct email failed: ${result.error}`,
          details: result
        };
      }
    }
  ];

  const runEmailScenario = async (scenario: EmailButtonScenario) => {
    if (!testEmail) {
      toast.error("Please enter a test email address first");
      return;
    }

    setLoadingScenarios(prev => new Set(prev).add(scenario.id));
    
    try {
      toast.info(`Testing "${scenario.name}"...`);
      const result = await scenario.emailFunction(testEmail);
      
      if (result.success) {
        toast.success(`✅ ${scenario.name}: ${result.message}`);
      } else {
        toast.error(`❌ ${scenario.name}: ${result.message}`);
      }
      
    } catch (error) {
      toast.error(`Exception in ${scenario.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoadingScenarios(prev => {
        const newSet = new Set(prev);
        newSet.delete(scenario.id);
        return newSet;
      });
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'order': return 'bg-green-100 text-green-800';
      case 'commit': return 'bg-yellow-100 text-yellow-800';
      case 'purchase': return 'bg-purple-100 text-purple-800';
      case 'direct': return 'bg-blue-100 text-blue-800';
      case 'queue': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Button Testing Scenarios
        </CardTitle>
        <CardDescription>
          Test email sending for various button click scenarios to ensure all user actions properly trigger emails
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Test Configuration */}
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <Label htmlFor="testEmail" className="text-sm font-medium">
            Test Email Address *
          </Label>
          <Input
            id="testEmail"
            type="email"
            placeholder="your.email@example.com"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            className="mt-1"
            required
          />
        </div>

        {/* Email Scenarios Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {emailScenarios.map((scenario) => {
            const isLoading = loadingScenarios.has(scenario.id);
            
            return (
              <div key={scenario.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {scenario.icon}
                    <Badge className={getCategoryColor(scenario.category)}>
                      {scenario.category}
                    </Badge>
                  </div>
                </div>
                
                <h3 className="font-semibold mb-2">{scenario.name}</h3>
                <p className="text-sm text-gray-600 mb-4">{scenario.description}</p>
                
                <Button
                  onClick={() => runEmailScenario(scenario)}
                  disabled={!testEmail || isLoading}
                  variant={scenario.buttonVariant}
                  size="sm"
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      {scenario.icon}
                      <span className="ml-2">{scenario.buttonText}</span>
                    </>
                  )}
                </Button>
              </div>
            );
          })}
        </div>

        {/* Instructions */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Testing Instructions:</strong>
            <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
              <li>Enter your email address in the field above</li>
              <li>Click any scenario button to test that specific email flow</li>
              <li>Check your email inbox (and spam folder) for test emails</li>
              <li>Each button simulates a real user action that should trigger emails</li>
              <li>Green toasts = success, red toasts = issues that need fixing</li>
            </ol>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default EmailButtonTester;

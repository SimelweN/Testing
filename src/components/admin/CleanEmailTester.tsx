import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Mail, Send, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

const CleanEmailTester = () => {
  const [testEmail, setTestEmail] = useState("");
  const [selectedEmailType, setSelectedEmailType] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  // Common styles for all email templates - EXACTLY matching the required format
  const emailStyles = `
    body {
      font-family: Arial, sans-serif;
      background-color: #f3fef7;
      padding: 20px;
      color: #1f4e3d;
      margin: 0;
    }
    .container {
      max-width: 500px;
      margin: auto;
      background-color: #ffffff;
      padding: 30px;
      border-radius: 10px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }
    .header {
      background: #3ab26f;
      color: white;
      padding: 20px;
      text-align: center;
      border-radius: 10px 10px 0 0;
      margin: -30px -30px 20px -30px;
    }
    .footer {
      background: #f3fef7;
      color: #1f4e3d;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      line-height: 1.5;
      margin: 30px -30px -30px -30px;
      border-radius: 0 0 10px 10px;
      border-top: 1px solid #e5e7eb;
    }
    .btn {
      display: inline-block;
      padding: 12px 20px;
      background-color: #3ab26f;
      color: white;
      text-decoration: none;
      border-radius: 5px;
      margin-top: 20px;
      font-weight: bold;
    }
    .link {
      color: #3ab26f;
    }
    .info-box {
      background: #f3fef7;
      border: 1px solid #3ab26f;
      padding: 15px;
      border-radius: 5px;
      margin: 15px 0;
    }
    .success-box {
      background: #dcfce7;
      border: 1px solid #22c55e;
      padding: 15px;
      border-radius: 5px;
      margin: 15px 0;
    }
    .urgent-box {
      background: #fef2f2;
      border: 1px solid #dc2626;
      padding: 15px;
      border-radius: 5px;
      margin: 15px 0;
    }
    .amount-box {
      background: #f0f9ff;
      border: 1px solid #3ab26f;
      padding: 15px;
      border-radius: 5px;
      margin: 15px 0;
      text-align: center;
    }
    .stats-box {
      background: #f0f9ff;
      border: 1px solid #3ab26f;
      padding: 15px;
      border-radius: 5px;
      margin: 15px 0;
    }
    .error-section {
      background: #fef2f2;
      border: 1px solid #dc2626;
      padding: 15px;
      border-radius: 5px;
      margin: 15px 0;
    }
    .order-item {
      background: #f9fafb;
      border-left: 3px solid #dc2626;
      padding: 10px;
      margin: 5px 0;
    }
    .reminder-item {
      background: #f9fafb;
      border-left: 3px solid #3ab26f;
      padding: 10px;
      margin: 5px 0;
    }
  `;

  const footerHtml = `
    <div class="footer">
      <p><strong>This is an automated message from ReBooked Solutions.</strong><br>
      Please do not reply to this email.</p>
      <p>For help, contact support@rebookedsolutions.co.za<br>
      Visit our website: www.rebookedsolutions.co.za<br>
      T&Cs apply</p>
      <p><em>"Pre-Loved Pages, New Adventures"</em></p>
    </div>
  `;

  const adminFooterHtml = `
        ${adminFooterHtml}
  `;

  // ALL EMAIL TEMPLATES - Updated with templates from our actual functions
  const emailExamples = [
    {
      value: "test-basic",
      label: "Basic Test Email",
      html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Test Email - ReBooked Solutions</title>
  <style>${emailStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Test Email</h1>
    </div>
    <h2>Email System Test</h2>
    <p>This is a test email from ReBooked Solutions with proper styling.</p>
    <p>If you're seeing beautiful green styling, the direct HTML approach is working!</p>
    ${footerHtml}
  </div>
</body>
</html>`,
    },
    {
      value: "seller-new-order",
      label: "Seller New Order (48h Commit)",
      html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Order - Action Required</title>
  <style>${emailStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📚 New Order - Action Required (48 hours)</h1>
    </div>

    <h2>Hello [Seller Name]!</h2>
    <p>You have received a new order! Please review and commit within 48 hours.</p>

    <div class="info-box">
      <h3>📋 Order Details</h3>
      <p><strong>Order ID:</strong> #TEST123</p>
      <p><strong>Buyer:</strong> Test Student</p>
      <p><strong>Book:</strong> Sample Textbook</p>
      <p><strong>Total Amount:</strong> R250.00</p>
      <p><strong>Expires:</strong> ${new Date(Date.now() + 48 * 60 * 60 * 1000).toLocaleString()}</p>
    </div>

    <div class="urgent-box">
      <p><strong>⏰ Action Required:</strong> Please commit to this order within 48 hours or it will expire automatically.</p>
    </div>

    <div style="text-align: center;">
      <a href="https://rebookedsolutions.co.za/activity" class="btn">
        📋 View Order & Commit
      </a>
    </div>

    ${footerHtml}
  </div>
</body>
</html>`,
    },
    {
      value: "buyer-order-pending",
      label: "Buyer Order Confirmed (Awaiting Seller)",
      html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order Confirmed - Awaiting Seller Response</title>
  <style>${emailStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⏳ Order Confirmed - Awaiting Seller Response</h1>
    </div>

    <h2>Hello [Buyer Name]!</h2>
    <p>Your order has been confirmed and sent to the seller. They have 48 hours to respond.</p>

    <div class="info-box">
      <h3>📦 Order Summary</h3>
      <p><strong>Order ID:</strong> #TEST456</p>
      <p><strong>Seller:</strong> Test Seller</p>
      <p><strong>Book:</strong> Sample Textbook</p>
      <p><strong>Total Amount:</strong> R250.00</p>
    </div>

    <p>We'll notify you as soon as the seller confirms your order. If they don't respond within 48 hours, your payment will be automatically refunded.</p>

    <div style="text-align: center;">
      <a href="https://rebookedsolutions.co.za/orders/TEST456" class="btn">
        📱 Check Order Status
      </a>
    </div>

    ${footerHtml}
  </div>
</body>
</html>`,
    },
    {
      value: "shipping-notification",
      label: "Shipping Notification (Courier Guy)",
      html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your Order Has Shipped - ReBooked Solutions</title>
  <style>${emailStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📦 Your Order Has Shipped!</h1>
    </div>

    <h2>Hello [Customer Name]!</h2>
    <p>Great news! Your order #TEST789 has been shipped and is on its way to you.</p>

    <div class="info-box">
      <h3>📱 Tracking Information</h3>
      <p><strong>Tracking Number:</strong> TEST123456</p>
      <p><strong>Carrier:</strong> Courier Guy</p>
      <p><strong>Estimated Delivery:</strong> 2-3 business days</p>
    </div>

    <p>You can track your package using the tracking number above on the Courier Guy website.</p>

    <p>Thank you for choosing ReBooked Solutions!</p>

    ${footerHtml}
  </div>
</body>
</html>`,
    },
    {
      value: "seller-payout-notification",
      label: "Seller Payout Notification",
      html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Payment Processing - ReBooked Solutions</title>
  <style>${emailStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💰 Your Payment is on the Way!</h1>
    </div>

    <h2>Hello [Seller Name]!</h2>
    <p>Great news! Your payment for order #TEST123 has been processed and is on its way to your bank account.</p>

    <div class="amount-box">
      <h3>💳 Payment Details</h3>
      <p><strong>Your Amount:</strong> R212.50</p>
      <p><strong>Platform Fee:</strong> R37.50</p>
      <p><strong>Order Total:</strong> R250.00</p>
      <p><strong>Transfer Reference:</strong> TEST_REF_123</p>
    </div>

    <p>The payment should reflect in your bank account within 1-3 business days.</p>
    
    <p>Thank you for being part of the ReBooked Solutions community!</p>

    ${footerHtml}
  </div>
</body>
</html>`,
    },
    {
      value: "buyer-order-collected",
      label: "Buyer Order Collected (On the Way)",
      html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order Collected - ReBooked Solutions</title>
  <style>${emailStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📦 Your Order is on the Way!</h1>
    </div>

    <h2>Hello [Buyer Name]!</h2>
    <p>Great news! Your order #TEST123 has been collected from the seller and is now being shipped to you.</p>

    <div class="info-box">
      <h3>📱 Tracking Information</h3>
      <p><strong>Tracking Reference:</strong> TEST_TRACK_456</p>
      <p><strong>Estimated Delivery:</strong> 3-5 business days</p>
      <p><strong>Collected At:</strong> ${new Date().toLocaleString()}</p>
    </div>

    <div class="info-box">
      <h3>🏠 Delivery Address</h3>
      <p>123 Test Street<br>
      Test City, 1234</p>
    </div>

    <p>You'll receive another notification with tracking details once your package is dispatched.</p>
    
    <p>Thank you for choosing ReBooked Solutions!</p>

    ${footerHtml}
  </div>
</body>
</html>`,
    },
    {
      value: "seller-order-collected",
      label: "Seller Order Collected (Success)",
      html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order Collected - ReBooked Solutions</title>
  <style>${emailStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Order Collected Successfully!</h1>
    </div>

    <h2>Hello [Seller Name]!</h2>
    <p>Your order #TEST123 has been successfully collected and is now being shipped to the buyer.</p>

    <div class="success-box">
      <h3>📋 Collection Details</h3>
      <p><strong>Collected At:</strong> ${new Date().toLocaleString()}</p>
      <p><strong>Collected By:</strong> Test Courier</p>
      <p><strong>Tracking Reference:</strong> TEST_TRACK_789</p>
    </div>

    <p>The buyer will be notified about the shipment and you can expect your payment to be processed soon.</p>
    
    <p>Thank you for being part of the ReBooked Solutions community!</p>

    ${footerHtml}
  </div>
</body>
</html>`,
    },
    {
      value: "seller-commit-reminder-urgent",
      label: "Seller Commit Reminder (URGENT)",
      html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order Commit Reminder - ReBooked Solutions</title>
  <style>${emailStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header" style="background: #dc2626;">
      <h1>🚨 URGENT Order Reminder</h1>
    </div>

    <h2>Hello [Seller Name]!</h2>
    <p>This is an urgent reminder that you have a pending order that needs your attention.</p>

    <div class="urgent-box">
      <h3>🚨 Action Required</h3>
      <p><strong>Time Remaining:</strong> 6 hours</p>
      <p><strong>Expires At:</strong> ${new Date(Date.now() + 6 * 60 * 60 * 1000).toLocaleString()}</p>
      <p><strong>This order will expire soon if not committed!</strong></p>
    </div>

    <div class="info-box">
      <h3>📋 Order Details</h3>
      <p><strong>Order ID:</strong> #TEST123</p>
      <p><strong>Buyer:</strong> Test Student</p>
      <p><strong>Total Amount:</strong> R250.00</p>
      <p><strong>Ordered:</strong> ${new Date(Date.now() - 42 * 60 * 60 * 1000).toLocaleString()}</p>
    </div>

    <div style="text-align: center;">
      <a href="https://rebookedsolutions.co.za/activity" class="btn">
        📋 View Order & Commit
      </a>
    </div>

    <p><strong>What you need to do:</strong></p>
    <ul>
      <li>Review the order details</li>
      <li>Commit to the sale within the time limit</li>
      <li>Prepare your book for collection</li>
    </ul>

    ${footerHtml}
  </div>
</body>
</html>`,
    },
    {
      value: "admin-auto-expire-report",
      label: "Admin Auto-Expire Report",
      html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Auto-Expire Report - ReBooked Solutions</title>
  <style>${emailStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header" style="background: #dc2626;">
      <h1>⏰ Auto-Expire Report</h1>
    </div>

    <h2>Orders Automatically Expired</h2>
    <p>Report generated on: ${new Date().toLocaleString()}</p>

    <div class="stats-box">
      <h3>📊 Summary</h3>
      <p><strong>Orders Processed:</strong> 5</p>
      <p><strong>Errors:</strong> 0</p>
      <p><strong>Total Refund Amount:</strong> R1,250.00</p>
    </div>

    <h3>📋 Processed Orders (showing first 10)</h3>
    <div class="order-item">
      <p><strong>Order ID:</strong> TEST_001</p>
      <p><strong>Buyer:</strong> buyer1@example.com</p>
      <p><strong>Seller:</strong> seller1@example.com</p>
      <p><strong>Amount:</strong> R250.00</p>
    </div>
    <div class="order-item">
      <p><strong>Order ID:</strong> TEST_002</p>
      <p><strong>Buyer:</strong> buyer2@example.com</p>
      <p><strong>Seller:</strong> seller2@example.com</p>
      <p><strong>Amount:</strong> R300.00</p>
    </div>

        ${adminFooterHtml}
  </div>
</body>
</html>`,
    },
    {
      value: "admin-expiry-check-report",
      label: "Admin Expiry Check Report",
      html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order Expiry Check Report - ReBooked Solutions</title>
  <style>${emailStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Order Expiry Check Report</h1>
    </div>

    <h2>System Health Check</h2>
    <p>Report generated on: ${new Date().toLocaleString()}</p>

    <div class="stats-box">
      <h3>📈 Processing Summary</h3>
      <p><strong>Total Processed:</strong> 25</p>
      <p><strong>Total Errors:</strong> 0</p>
    </div>

    <div class="stats-box">
      <h3>⏰ Expiry Categories</h3>
      <p><strong>Commit Expiry:</strong> 3 orders</p>
      <p><strong>Collection Timeouts:</strong> 1 orders</p>
      <p><strong>Delivery Timeouts:</strong> 0 orders</p>
      <p><strong>Reservation Expiry:</strong> 2 orders</p>
    </div>

    <div class="stats-box">
      <h3>✅ System Status</h3>
      <p>All expiry checks completed successfully with no errors.</p>
    </div>

        ${adminFooterHtml}
  </div>
</body>
</html>`,
    },
    {
      value: "admin-reminder-report",
      label: "Admin Reminder Report",
      html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Reminder Report - ReBooked Solutions</title>
  <style>${emailStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📨 Order Reminders Report</h1>
    </div>

    <h2>Reminder Batch Summary</h2>
    <p>Report generated on: ${new Date().toLocaleString()}</p>

    <div class="stats-box">
      <h3>📊 Summary</h3>
      <p><strong>Total Reminders Sent:</strong> 8</p>
      <p><strong>Errors:</strong> 0</p>
      <p><strong>Urgent Reminders:</strong> 3</p>
    </div>

    <div class="urgent-box">
      <h3>🚨 Urgent Reminders</h3>
      <p>3 urgent reminders were sent for orders expiring soon.</p>
    </div>

    <h3>📋 Reminder Details (first 10)</h3>
    <div class="reminder-item">
      <p><strong>Order ID:</strong> TEST_001</p>
      <p><strong>Seller:</strong> seller1@example.com</p>
      <p><strong>Time Left:</strong> 6 hours</p>
      <p><strong>Urgent:</strong> Yes</p>
    </div>
    <div class="reminder-item">
      <p><strong>Order ID:</strong> TEST_002</p>
      <p><strong>Seller:</strong> seller2@example.com</p>
      <p><strong>Time Left:</strong> 24 hours</p>
      <p><strong>Urgent:</strong> No</p>
    </div>

        ${adminFooterHtml}
  </div>
</body>
</html>`,
    },
  ];

  const sendTestEmail = async () => {
    if (!testEmail) {
      toast.error("Please enter an email address");
      return;
    }

    if (!selectedEmailType) {
      toast.error("Please select an email type");
      return;
    }

    const emailTemplate = emailExamples.find(
      (t) => t.value === selectedEmailType,
    );
    if (!emailTemplate) {
      toast.error("Email template not found");
      return;
    }

    setIsSending(true);
    setLastResult(null);

    try {
      console.log(`Sending ${emailTemplate.label} to ${testEmail}...`);

      const { data, error } = await supabase.functions.invoke("send-email", {
        body: {
          to: testEmail,
          subject: `${emailTemplate.label} - ReBooked Solutions Test`,
          html: emailTemplate.html,
          text: `${emailTemplate.label} Test\n\nThis is a test of the ${emailTemplate.label} using direct HTML with proper ReBooked Solutions styling.\n\nReBooked Solutions\n"Pre-Loved Pages, New Adventures"`,
        },
      });

      if (error) {
        console.error("Email test failed:", error);
        setLastResult({
          success: false,
          template: emailTemplate.label,
          error: error.message || "Unknown error",
        });
        toast.error(`Failed to send ${emailTemplate.label}`);
      } else {
        console.log("Email sent successfully:", data);
        setLastResult({
          success: true,
          template: emailTemplate.label,
          data: data,
        });
        toast.success(
          `${emailTemplate.label} sent successfully to ${testEmail}!`,
        );
      }
    } catch (err: any) {
      console.error("Email test error:", err);
      setLastResult({
        success: false,
        template: emailTemplate.label,
        error: err.message || "Network error",
      });
      toast.error("Failed to send email - network error");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Template Tester
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="test-email">Test Email Address</Label>
              <Input
                id="test-email"
                type="email"
                placeholder="your-email@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email-type">Email Template</Label>
              <Select
                value={selectedEmailType}
                onValueChange={setSelectedEmailType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select email type" />
                </SelectTrigger>
                <SelectContent>
                  {emailExamples.map((example) => (
                    <SelectItem key={example.value} value={example.value}>
                      {example.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={sendTestEmail}
            disabled={isSending || !testEmail || !selectedEmailType}
            className="w-full"
          >
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Test Email
              </>
            )}
          </Button>

          {lastResult && (
            <Alert
              className={
                lastResult.success
                  ? "border-green-200 bg-green-50"
                  : "border-red-200 bg-red-50"
              }
            >
              {lastResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      {lastResult.success ? "Success" : "Failed"}
                    </span>
                    <Badge
                      variant={lastResult.success ? "default" : "destructive"}
                    >
                      {lastResult.template}
                    </Badge>
                  </div>
                  {lastResult.error && (
                    <div className="text-sm text-red-600">
                      {lastResult.error}
                    </div>
                  )}
                  {lastResult.success && (
                    <div className="text-sm text-green-600">
                      Email sent successfully using direct HTML approach!
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Available Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {emailExamples.map((example) => (
              <Badge
                key={example.value}
                variant="outline"
                className="justify-start text-xs p-2"
              >
                {example.label}
              </Badge>
            ))}
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <p>
              ✅ All templates use proper HTML structure with ReBooked Solutions
              styling
            </p>
            <p>
              ✅ All templates include required CSS: body, .container, .btn,
              .link styles
            </p>
            <p>
              ✅ Templates match the actual email functions used in production
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CleanEmailTester;

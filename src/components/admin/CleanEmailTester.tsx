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

  // Common styles for all email templates
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
    .link { color: #3ab26f; }
    .info-box {
      background: #f3fef7;
      border: 1px solid #3ab26f;
      padding: 15px;
      border-radius: 5px;
      margin: 15px 0;
    }
    .order-item {
      border-bottom: 1px solid #ddd;
      padding: 10px 0;
    }
    .total {
      font-weight: bold;
      font-size: 18px;
      color: #3ab26f;
    }
    .urgent {
      background: #fff3cd;
      border: 1px solid #ffc107;
      padding: 10px;
      border-radius: 5px;
      margin: 10px 0;
    }
  `;

  const footerHtml = `
    <div class="footer">
      <p><strong>This is an automated message from ReBooked Solutions.</strong><br>
      Please do not reply to this email.</p>
      <p>For assistance, contact: <a href="mailto:support@rebookedsolutions.co.za" class="link">support@rebookedsolutions.co.za</a><br>
      Visit us at: <a href="https://rebookedsolutions.co.za" class="link">https://rebookedsolutions.co.za</a></p>
      <p>T&Cs apply.</p>
      <p><em>"Pre-Loved Pages, New Adventures"</em></p>
    </div>
  `;

  // Pre-defined HTML email examples with proper ReBooked Solutions styling
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
      value: "order-confirmation",
      label: "Order Confirmation",
      html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order Confirmation - ReBooked Solutions</title>
  <style>${emailStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Order Confirmed!</h1>
      <p>Thank you for your purchase!</p>
    </div>
    
    <h2>Order #ORD_TEST_123456</h2>
    <p>Your order has been confirmed and is being processed.</p>
    
    <h3>Order Details:</h3>
    <div class="order-item">
      <strong>Physics Textbook (Grade 12)</strong><br>
      Quantity: 1 × R250<br>
      Subtotal: R250.00
    </div>
    <div class="order-item">
      <strong>Math Workbook (Grade 11)</strong><br>
      Quantity: 2 × R150<br>
      Subtotal: R300.00
    </div>
    
    <div class="total">
      <p>Total: R550.00</p>
    </div>
    
    <p><strong>Estimated Delivery:</strong> 2-3 business days</p>
    
    <p>We'll send you another email when your order ships with tracking information.</p>
    
    ${footerHtml}
  </div>
</body>
</html>`,
    },
    {
      value: "welcome",
      label: "Welcome Email",
      html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome to ReBooked Solutions</title>
  <style>${emailStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Welcome to ReBooked Solutions!</h1>
    </div>
    
    <h2>Hello John Doe!</h2>
    <p>Thank you for joining ReBooked Solutions, South Africa's premier platform for pre-loved textbooks!</p>
    
    <div class="info-box">
      <h3>Getting Started</h3>
      <ul>
        <li>Browse thousands of affordable textbooks</li>
        <li>List your own books for sale</li>
        <li>Connect with students across South Africa</li>
        <li>Enjoy fast and reliable delivery</li>
      </ul>
    </div>
    
    <p>Ready to start your journey with pre-loved pages and new adventures?</p>
    
    <a href="https://app.rebookedsolutions.co.za/dashboard" class="btn">Explore Books Now</a>
    
    ${footerHtml}
  </div>
</body>
</html>`,
    },
    {
      value: "shipping-notification",
      label: "Shipping Notification",
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
    
    <h2>Hello Sarah!</h2>
    <p>Great news! Your order #ORD_987654 has been shipped and is on its way to you.</p>
    
    <div class="info-box">
      <h3>Shipping Details</h3>
      <p><strong>Tracking Number:</strong> TRK123456789</p>
      <p><strong>Carrier:</strong> CourierGuy</p>
      <p><strong>Estimated Delivery:</strong> 2-3 business days</p>
      <p><strong>Items:</strong> Biology Textbook (Grade 12)</p>
    </div>
    
    <p>You can track your package using the tracking number above.</p>
    
    <a href="https://app.rebookedsolutions.co.za/track/TRK123456789" class="btn">Track Your Package</a>
    
    ${footerHtml}
  </div>
</body>
</html>`,
    },
    {
      value: "contact-form",
      label: "Contact Form Submission",
      html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Contact Form Submission - ReBooked Solutions</title>
  <style>${emailStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📧 New Contact Form Submission</h1>
    </div>
    
    <h2>Contact Form Message Received</h2>
    
    <div class="info-box">
      <p><strong>Name:</strong> Alex Johnson</p>
      <p><strong>Email:</strong> alex@example.com</p>
      <p><strong>Subject:</strong> Question about textbook availability</p>
      <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
    </div>
    
    <h3>Message:</h3>
    <p style="background: #f9f9f9; padding: 15px; border-radius: 5px; border-left: 3px solid #3ab26f;">
      Hi, I'm looking for Grade 10 Accounting textbooks. Do you have any available? Also, what are your delivery options to Durban?
    </p>
    
    <p><strong>Action Required:</strong> Please respond to this inquiry within 24 hours.</p>
    
    ${footerHtml}
  </div>
</body>
</html>`,
    },
    {
      value: "booking-confirmation",
      label: "Booking Confirmation",
      html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Booking Confirmation - ReBooked Solutions</title>
  <style>${emailStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Booking Confirmed!</h1>
    </div>
    
    <h2>Hello Michael!</h2>
    <p>Your book collection appointment has been confirmed.</p>
    
    <div class="info-box">
      <h3>Booking Details</h3>
      <p><strong>Booking ID:</strong> BK_789123</p>
      <p><strong>Book:</strong> Engineering Mathematics Textbook</p>
      <p><strong>Pickup Date:</strong> Tomorrow, 2:00 PM - 4:00 PM</p>
      <p><strong>Location:</strong> UCT Upper Campus, Engineering Building</p>
      <p><strong>Contact:</strong> +27 82 123 4567</p>
    </div>
    
    <p>Please have your book ready for collection during the specified time window.</p>
    
    <a href="https://app.rebookedsolutions.co.za/bookings/BK_789123" class="btn">View Booking Details</a>
    
    ${footerHtml}
  </div>
</body>
</html>`,
    },
    {
      value: "seller-pickup-notification",
      label: "Seller Pickup Notification",
      html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Courier Pickup Scheduled - ReBooked Solutions</title>
  <style>${emailStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚚 Courier Pickup Scheduled</h1>
    </div>
    
    <h2>Hello Emma!</h2>
    <p>A courier has been scheduled to collect your book for order #ORD_456789.</p>
    
    <div class="info-box">
      <h3>Pickup Details</h3>
      <p><strong>Book:</strong> Computer Science Textbook</p>
      <p><strong>Pickup Date:</strong> Friday, March 15, 2024</p>
      <p><strong>Time Window:</strong> 9:00 AM - 12:00 PM</p>
      <p><strong>Courier:</strong> FastWay Couriers</p>
      <p><strong>Tracking:</strong> FW123456789</p>
      <p><strong>Address:</strong> 123 Student Rd, Stellenbosch, Western Cape</p>
    </div>
    
    <div class="urgent">
      <p><strong>⚠️ Important:</strong> Please have your book packaged and ready for collection.</p>
    </div>
    
    <a href="https://app.rebookedsolutions.co.za/orders/ORD_456789" class="btn">View Order Details</a>
    
    ${footerHtml}
  </div>
</body>
</html>`,
    },
    {
      value: "buyer-order-confirmed",
      label: "Buyer Order Confirmed",
      html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your Order is Confirmed - ReBooked Solutions</title>
  <style>${emailStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Order Confirmed!</h1>
    </div>
    
    <h2>Hello David!</h2>
    <p>Great news! The seller has confirmed your order and it's now being prepared for delivery.</p>
    
    <div class="info-box">
      <h3>Order Details</h3>
      <p><strong>Order ID:</strong> ORD_321654</p>
      <p><strong>Book:</strong> History Textbook (Grade 11)</p>
      <p><strong>Seller:</strong> Lisa M.</p>
      <p><strong>Expected Delivery:</strong> Tuesday, March 19, 2024</p>
    </div>
    
    <p>We'll send you tracking information once your book is shipped.</p>
    
    <a href="https://app.rebookedsolutions.co.za/orders/ORD_321654" class="btn">Track Your Order</a>
    
    ${footerHtml}
  </div>
</body>
</html>`,
    },
    {
      value: "commit-confirmation-basic",
      label: "Commit Confirmation (Basic)",
      html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order Commitment Confirmed - ReBooked Solutions</title>
  <style>${emailStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Commitment Confirmed</h1>
    </div>
    
    <h2>Hello Rachel!</h2>
    <p>Thank you for committing to order #ORD_147258. Your book sale has been confirmed!</p>
    
    <div class="info-box">
      <h3>Commitment Details</h3>
      <p><strong>Order ID:</strong> ORD_147258</p>
      <p><strong>Book:</strong> Physics Textbook (Grade 12)</p>
      <p><strong>Buyer:</strong> student@example.com</p>
      <p><strong>Status:</strong> Committed - Awaiting Pickup</p>
    </div>
    
    <p>We'll contact you shortly with pickup arrangements.</p>
    
    <a href="https://app.rebookedsolutions.co.za/activity" class="btn">View Activity</a>
    
    ${footerHtml}
  </div>
</body>
</html>`,
    },
    {
      value: "order-committed-buyer",
      label: "Order Committed (Buyer)",
      html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order Confirmed - Preparing for Delivery</title>
  <style>${emailStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Order Confirmed!</h1>
      <p>Preparing for Delivery</p>
    </div>
    
    <h2>Hello Jessica!</h2>
    <p>Excellent news! Your order has been confirmed by the seller and is now being prepared for delivery.</p>
    
    <div class="info-box">
      <h3>Order Summary</h3>
      <p><strong>Order ID:</strong> ORD_963852</p>
      <p><strong>Seller:</strong> Mark T.</p>
      <p><strong>Books:</strong> Mathematics Grade 12 Textbook, Chemistry Workbook</p>
      <p><strong>Estimated Delivery:</strong> 3-5 business days</p>
    </div>
    
    <p>We'll send you tracking details once your books are shipped.</p>
    
    <a href="https://app.rebookedsolutions.co.za/orders/ORD_963852" class="btn">View Order Status</a>
    
    ${footerHtml}
  </div>
</body>
</html>`,
    },
    {
      value: "order-committed-seller",
      label: "Order Committed (Seller)",
      html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order Commitment Confirmed - Prepare for Pickup</title>
  <style>${emailStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📦 Prepare for Pickup</h1>
    </div>
    
    <h2>Hello Robert!</h2>
    <p>You've successfully committed to order #ORD_741852. Please prepare your books for courier pickup.</p>
    
    <div class="info-box">
      <h3>Order Details</h3>
      <p><strong>Order ID:</strong> ORD_741852</p>
      <p><strong>Buyer:</strong> Sophie K.</p>
      <p><strong>Books:</strong> Geography Textbook, Life Sciences Study Guide</p>
    </div>
    
    <div class="urgent">
      <h3>Pickup Instructions:</h3>
      <ul>
        <li>Package books securely in a box or envelope</li>
        <li>Attach the shipping label (will be provided separately)</li>
        <li>Be available during the pickup window</li>
        <li>Have your ID ready for courier verification</li>
      </ul>
    </div>
    
    <p>A courier will contact you within 24 hours to arrange pickup.</p>
    
    <a href="https://app.rebookedsolutions.co.za/activity" class="btn">View Activity</a>
    
    ${footerHtml}
  </div>
</body>
</html>`,
    },
    {
      value: "seller-new-order",
      label: "Seller New Order",
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
      <h1>📚 New Order Received!</h1>
    </div>
    
    <h2>Hello Jennifer!</h2>
    <p>You have received a new order! Please review and commit within 48 hours.</p>
    
    <div class="info-box">
      <h3>Order Details</h3>
      <p><strong>Order ID:</strong> ORD_159753</p>
      <p><strong>Buyer:</strong> Chris M.</p>
      <p><strong>Items:</strong></p>
      <ul>
        <li>Afrikaans Textbook x1 - R120.00</li>
        <li>English Literature Guide x1 - R80.00</li>
      </ul>
      <p><strong>Total Amount:</strong> R200.00</p>
      <p><strong>Expires:</strong> Monday, March 18, 2024 at 3:30 PM</p>
    </div>
    
    <div class="urgent">
      <p><strong>⏰ Action Required:</strong> Please commit to this order within 48 hours or it will expire.</p>
    </div>
    
    <a href="https://app.rebookedsolutions.co.za/activity" class="btn">View Order & Commit</a>
    
    ${footerHtml}
  </div>
</body>
</html>`,
    },
    {
      value: "buyer-order-pending",
      label: "Buyer Order Pending",
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
      <h1>⏳ Order Confirmed</h1>
      <p>Awaiting Seller Response</p>
    </div>
    
    <h2>Hello Amanda!</h2>
    <p>Your order has been confirmed and sent to the seller. They have 48 hours to respond.</p>
    
    <div class="info-box">
      <h3>Order Summary</h3>
      <p><strong>Order ID:</strong> ORD_357159</p>
      <p><strong>Seller:</strong> Kevin P.</p>
      <p><strong>Items:</strong></p>
      <ul>
        <li>Economics Textbook x1 - R180.00</li>
        <li>Business Studies Workbook x1 - R95.00</li>
      </ul>
      <p><strong>Total Amount:</strong> R275.00</p>
    </div>
    
    <p>We'll notify you as soon as the seller confirms your order. If they don't respond within 48 hours, your payment will be automatically refunded.</p>
    
    <a href="https://app.rebookedsolutions.co.za/orders/ORD_357159" class="btn">Check Order Status</a>
    
    ${footerHtml}
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
          subject: `✅ ${emailTemplate.label} - ReBooked Solutions Test`,
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
          messageId: data?.messageId,
        });
        toast.success(`${emailTemplate.label} sent successfully!`);
      }
    } catch (error: any) {
      console.error("Email test error:", error);
      setLastResult({
        success: false,
        template: selectedEmailType,
        error: error.message || "Unknown error",
      });
      toast.error(`Error sending email: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          ReBooked Solutions Email Tester
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Test all 12 email templates with proper ReBooked Solutions styling
          (excluding password reset)
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email">Test Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="your@email.com"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email-type">
            Select Email Type ({emailExamples.length} available)
          </Label>
          <Select
            value={selectedEmailType}
            onValueChange={setSelectedEmailType}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose an email type to test" />
            </SelectTrigger>
            <SelectContent>
              {emailExamples.map((template) => (
                <SelectItem key={template.value} value={template.value}>
                  {template.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={sendTestEmail}
          disabled={isSending || !testEmail || !selectedEmailType}
          className="w-full"
          size="lg"
        >
          {isSending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          Send Test Email
        </Button>

        {lastResult && (
          <Alert
            className={
              lastResult.success
                ? "border-green-200 bg-green-50"
                : "border-red-200 bg-red-50"
            }
          >
            <div className="flex items-center gap-2">
              {lastResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{lastResult.template}</span>
                  <Badge
                    variant={lastResult.success ? "default" : "destructive"}
                  >
                    {lastResult.success ? "Sent" : "Failed"}
                  </Badge>
                </div>
                <AlertDescription>
                  {lastResult.success ? (
                    <div>
                      <p>Email sent successfully to {testEmail}</p>
                      {lastResult.messageId && (
                        <p className="text-xs mt-1">
                          Message ID: {lastResult.messageId}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-red-600">{lastResult.error}</p>
                  )}
                </AlertDescription>
              </div>
            </div>
          </Alert>
        )}

        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">📧 Available Email Templates:</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-blue-800">
            {emailExamples.map((template, index) => (
              <div key={template.value} className="flex items-center gap-1">
                <span className="text-blue-600">•</span>
                <span>{template.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-blue-200">
            <p className="text-sm text-blue-700">
              <strong>✅ What You Should See:</strong> Professional green
              styling (#3ab26f), ReBooked Solutions branding, proper footer with
              contact info, and "Pre-Loved Pages, New Adventures" signature.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CleanEmailTester;

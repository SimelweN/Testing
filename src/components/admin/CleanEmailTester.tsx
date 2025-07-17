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
  <style>
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
    .link { color: #3ab26f; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Test Email</h1>
    </div>
    <h2>Email System Test</h2>
    <p>This is a test email from ReBooked Solutions with proper styling.</p>
    <p>If you're seeing beautiful green styling, the direct HTML approach is working!</p>
    <div class="footer">
      <p><strong>This is an automated message from ReBooked Solutions.</strong><br>
      Please do not reply to this email.</p>
      <p>For assistance, contact: <a href="mailto:support@rebookedsolutions.co.za" class="link">support@rebookedsolutions.co.za</a><br>
      Visit us at: <a href="https://rebookedsolutions.co.za" class="link">https://rebookedsolutions.co.za</a></p>
      <p>T&Cs apply.</p>
      <p><em>"Pre-Loved Pages, New Adventures"</em></p>
    </div>
  </div>
</body>
</html>`,
    },
    {
      value: "order-confirmation",
      label: "Order Confirmation Example",
      html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order Confirmation - ReBooked Solutions</title>
  <style>
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
    .total {
      font-weight: bold;
      font-size: 18px;
      color: #3ab26f;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Order Confirmed!</h1>
      <p>Thank you for your purchase!</p>
    </div>
    
    <h2>Order #TEST_123456</h2>
    <p>Your order has been confirmed and is being processed.</p>
    
    <h3>Order Details:</h3>
    <div style="border-bottom: 1px solid #ddd; padding: 10px 0;">
      <strong>Physics Textbook</strong><br>
      Quantity: 1 × R250<br>
      Subtotal: R250.00
    </div>
    <div style="border-bottom: 1px solid #ddd; padding: 10px 0;">
      <strong>Math Workbook</strong><br>
      Quantity: 2 × R150<br>
      Subtotal: R300.00
    </div>
    
    <div class="total">
      <p>Total: R550.00</p>
    </div>
    
    <p><strong>Estimated Delivery:</strong> 2-3 business days</p>
    
    <p>We'll send you another email when your order ships with tracking information.</p>
    
    <div class="footer">
      <p><strong>This is an automated message from ReBooked Solutions.</strong><br>
      Please do not reply to this email.</p>
      <p>For assistance, contact: <a href="mailto:support@rebookedsolutions.co.za" class="link">support@rebookedsolutions.co.za</a><br>
      Visit us at: <a href="https://rebookedsolutions.co.za" class="link">https://rebookedsolutions.co.za</a></p>
      <p>T&Cs apply.</p>
      <p><em>"Pre-Loved Pages, New Adventures"</em></p>
    </div>
  </div>
</body>
</html>`,
    },
    {
      value: "seller-notification",
      label: "Seller Notification Example",
      html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Order - ReBooked Solutions</title>
  <style>
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
    .info-box {
      background: #f3fef7;
      border: 1px solid #3ab26f;
      padding: 15px;
      border-radius: 5px;
      margin: 15px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📚 New Order Received!</h1>
    </div>
    
    <h2>Hello Test Seller!</h2>
    <p>You have received a new order from Test Buyer.</p>
    
    <div class="info-box">
      <h3>Order Details</h3>
      <p><strong>Order ID:</strong> ORD_TEST123</p>
      <p><strong>Buyer:</strong> Test Buyer</p>
      <p><strong>Items:</strong> Chemistry Textbook</p>
      <p><strong>Total Amount:</strong> R300.00</p>
      <p><strong>Expires:</strong> 48 hours from now</p>
    </div>
    
    <p><strong>Action Required:</strong> Please commit to this order within 48 hours.</p>
    
    <a href="https://app.rebookedsolutions.co.za/activity" class="btn">View Order & Commit</a>
    
    <div class="footer">
      <p><strong>This is an automated message from ReBooked Solutions.</strong><br>
      Please do not reply to this email.</p>
      <p>For assistance, contact: <a href="mailto:support@rebookedsolutions.co.za" class="link">support@rebookedsolutions.co.za</a><br>
      Visit us at: <a href="https://rebookedsolutions.co.za" class="link">https://rebookedsolutions.co.za</a></p>
      <p>T&Cs apply.</p>
      <p><em>"Pre-Loved Pages, New Adventures"</em></p>
    </div>
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
          Direct HTML Email Tester
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Test pre-built HTML emails with proper ReBooked Solutions styling
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
          <Label htmlFor="email-type">Select Email Type</Label>
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
          <h4 className="font-medium mb-2">✅ What You Should See:</h4>
          <ul className="text-sm space-y-1 text-blue-800">
            <li>• Light green background (#f3fef7)</li>
            <li>• White container with rounded corners</li>
            <li>• Green header and buttons (#3ab26f)</li>
            <li>• Professional ReBooked Solutions footer</li>
            <li>• "Pre-Loved Pages, New Adventures" signature</li>
            <li>• Contact: support@rebookedsolutions.co.za</li>
            <li>• NO raw CSS visible in email client</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default CleanEmailTester;

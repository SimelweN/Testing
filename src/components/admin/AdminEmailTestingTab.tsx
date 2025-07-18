import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, Send, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  requiredParams: string[];
}

const emailTemplates: EmailTemplate[] = [
  {
    id: "order_created_seller",
    name: "New Order - Seller Notification",
    description: "Email sent to seller when a new order is created",
    requiredParams: ["seller_name", "buyer_name", "order_id", "total_amount"],
  },
  {
    id: "order_created_buyer",
    name: "Order Confirmation - Buyer",
    description: "Email sent to buyer confirming their order",
    requiredParams: ["buyer_name", "seller_name", "order_id", "total_amount"],
  },
  {
    id: "order_declined_refund",
    name: "Order Declined - Refund Processed",
    description: "Email sent to buyer when seller declines order",
    requiredParams: ["buyer_name", "order_id", "total_amount", "reason"],
  },
  {
    id: "seller_payment",
    name: "Payment Sent - Seller",
    description: "Email sent to seller when payment is processed",
    requiredParams: [
      "seller_name",
      "order_id",
      "seller_amount",
      "platform_fee",
    ],
  },
  {
    id: "refund_processed",
    name: "Refund Processed - Buyer",
    description: "Email sent to buyer when refund is completed",
    requiredParams: [
      "buyer_name",
      "order_id",
      "refund_amount",
      "refund_reference",
    ],
  },
];

const AdminEmailTestingTab: React.FC = () => {
  const [recipientEmail, setRecipientEmail] = useState("");
  const [sending, setSending] = useState<string | null>(null);
  const [results, setResults] = useState<
    Record<string, { success: boolean; message: string }>
  >({});

  const handleTemplateSelect = (templateId: string) => {
    const template = emailTemplates.find((t) => t.id === templateId);
    if (template) {
      setSelectedTemplate(template);
      // Initialize test parameters with default values
      const defaultParams: Record<string, string> = {};
      template.requiredParams.forEach((param) => {
        switch (param) {
          case "seller_name":
            defaultParams[param] = "John Seller";
            break;
          case "buyer_name":
            defaultParams[param] = "Jane Buyer";
            break;
          case "order_id":
            defaultParams[param] = `TEST_ORDER_${Date.now()}`;
            break;
          case "total_amount":
            defaultParams[param] = "150.00";
            break;
          case "seller_amount":
            defaultParams[param] = "135.00";
            break;
          case "platform_fee":
            defaultParams[param] = "15.00";
            break;
          case "refund_amount":
            defaultParams[param] = "150.00";
            break;
          case "refund_reference":
            defaultParams[param] = `REF_${Date.now()}`;
            break;
          case "reason":
            defaultParams[param] = "Test decline reason";
            break;
          default:
            defaultParams[param] = `test_${param}`;
        }
      });
      setTestParams(defaultParams);
    }
  };

  const handleParamChange = (param: string, value: string) => {
    setTestParams((prev) => ({
      ...prev,
      [param]: value,
    }));
  };

  const sendTestEmail = async () => {
    if (!selectedTemplate || !recipientEmail) {
      toast.error("Please select a template and enter recipient email");
      return;
    }

    setSending(true);
    setLastResult(null);

    try {
      let emailBody = "";
      let subject = "";

      // Generate email content based on template
      switch (selectedTemplate.id) {
        case "order_created_seller":
          subject = "📚 New Order - Action Required (48 hours)";
          emailBody = generateSellerOrderEmail(testParams);
          break;
        case "order_created_buyer":
          subject = "🎉 Order Confirmed - Thank You!";
          emailBody = generateBuyerOrderEmail(testParams);
          break;
        case "order_declined_refund":
          subject = "Order Declined - Refund Processed";
          emailBody = generateRefundEmail(testParams);
          break;
        case "seller_payment":
          subject = "💰 Your payment is on the way!";
          emailBody = generateSellerPaymentEmail(testParams);
          break;
        case "refund_processed":
          subject = "💰 Refund Processed - ReBooked Solutions";
          emailBody = generateRefundProcessedEmail(testParams);
          break;
        default:
          throw new Error("Unknown template");
      }

      // Use custom subject/message if provided
      if (customSubject.trim()) {
        subject = customSubject;
      }
      if (customMessage.trim()) {
        emailBody = customMessage;
      }

      // Send test email via Supabase function
      const { data, error } = await supabase.functions.invoke("send-email", {
        body: {
          to: recipientEmail,
          from: "noreply@rebookedsolutions.co.za",
          subject: `[TEST] ${subject}`,
          html: emailBody,
          text: `Test Email: ${subject}\n\nThis is a test email sent from the admin dashboard.`,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      setLastResult({
        success: true,
        message: `Test email sent successfully to ${recipientEmail}`,
      });
      toast.success("Test email sent successfully!");
    } catch (error) {
      console.error("Failed to send test email:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setLastResult({
        success: false,
        message: `Failed to send email: ${errorMessage}`,
      });
      toast.error("Failed to send test email");
    } finally {
      setSending(false);
    }
  };

  const generateSellerOrderEmail = (params: Record<string, string>) => {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Order - Action Required</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f3fef7;
      padding: 20px;
      color: #1f4e3d;
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
    .link {
      color: #3ab26f;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>📚 New Order - Action Required!</h1>
    
    <p>Hi ${params.seller_name}!</p>
    <p>Great news! You have a new order from <strong>${params.buyer_name}</strong>.</p>
    
    <p><strong>Order Details:</strong></p>
    <p>Order ID: ${params.order_id}<br>
    Buyer: ${params.buyer_name}<br>
    Total Amount: R${params.total_amount}</p>
    
    <p style="background: #fff3cd; padding: 15px; border-radius: 5px;">
      <strong>⏰ Action Required Within 48 Hours</strong><br>
      This is a test email - no action needed
    </p>
    
    <p>Once you commit, we'll arrange pickup and you'll be paid after delivery!</p>
    
    <a href="https://rebookedsolutions.co.za/activity" class="btn">Commit to Order</a>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    
    <p style="font-size: 12px; color: #6b7280;">
      <strong>This is a TEST email from ReBooked Solutions.</strong><br>
      Please do not reply to this email.<br><br>
      For assistance, contact: <a href="mailto:support@rebookedsolutions.co.za" class="link">support@rebookedsolutions.co.za</a><br>
      Visit us at: <a href="https://rebookedsolutions.co.za" class="link">https://rebookedsolutions.co.za</a><br><br>
      T&Cs apply. <em>"Pre-Loved Pages, New Adventures"</em>
    </p>
  </div>
</body>
</html>`;
  };

  const generateBuyerOrderEmail = (params: Record<string, string>) => {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order Confirmed - Thank You!</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f3fef7;
      padding: 20px;
      color: #1f4e3d;
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
    .link {
      color: #3ab26f;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🎉 Order Confirmed!</h1>
    
    <p>Thank you, ${params.buyer_name}!</p>
    <p>Your order has been confirmed and <strong>${params.seller_name}</strong> has been notified.</p>
    
    <p><strong>Order Details:</strong></p>
    <p>Order ID: ${params.order_id}<br>
    Seller: ${params.seller_name}<br>
    Total Amount: R${params.total_amount}</p>
    
    <p><strong>📦 What happens next?</strong></p>
    <ul>
      <li>The seller has 48 hours to commit to your order</li>
      <li>Once committed, we'll arrange pickup and delivery</li>
      <li>You'll receive tracking information via email</li>
      <li>Your book(s) will be delivered within 2-3 business days</li>
    </ul>
    
    <p>We'll notify you as soon as the seller confirms your order!</p>
    
    <a href="https://rebookedsolutions.co.za/activity" class="btn">Track Your Order</a>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    
    <p style="font-size: 12px; color: #6b7280;">
      <strong>This is a TEST email from ReBooked Solutions.</strong><br>
      Please do not reply to this email.<br><br>
      For assistance, contact: <a href="mailto:support@rebookedsolutions.co.za" class="link">support@rebookedsolutions.co.za</a><br>
      Visit us at: <a href="https://rebookedsolutions.co.za" class="link">https://rebookedsolutions.co.za</a><br><br>
      T&Cs apply. <em>"Pre-Loved Pages, New Adventures"</em>
    </p>
  </div>
</body>
</html>`;
  };

  const generateRefundEmail = (params: Record<string, string>) => {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order Declined - Refund Processed</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f3fef7;
      padding: 20px;
      color: #1f4e3d;
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
    .link {
      color: #3ab26f;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>❌ Order Declined</h1>

    <p>Hello ${params.buyer_name},</p>
    <p>We're sorry to inform you that your order has been declined by the seller.</p>

    <p><strong>Order Details:</strong></p>
    <p>Order ID: ${params.order_id}<br>
    Amount: R${params.total_amount}<br>
    Reason: ${params.reason}</p>

    <p><strong>✅ Your refund has been successfully processed and will appear in your account within 3-5 business days.</strong></p>

    <p>We apologize for any inconvenience. Please feel free to browse our marketplace for similar books from other sellers.</p>

    <a href="https://rebookedsolutions.co.za/books" class="btn">Browse Books</a>

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    
    <p style="font-size: 12px; color: #6b7280;">
      <strong>This is a TEST email from ReBooked Solutions.</strong><br>
      Please do not reply to this email.<br><br>
      For assistance, contact: <a href="mailto:support@rebookedsolutions.co.za" class="link">support@rebookedsolutions.co.za</a><br>
      Visit us at: <a href="https://rebookedsolutions.co.za" class="link">https://rebookedsolutions.co.za</a><br><br>
      T&Cs apply. <em>"Pre-Loved Pages, New Adventures"</em>
    </p>
  </div>
</body>
</html>`;
  };

  const generateSellerPaymentEmail = (params: Record<string, string>) => {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your Payment is on the Way - ReBooked Solutions</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f3fef7;
      padding: 20px;
      color: #1f4e3d;
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
    .link {
      color: #3ab26f;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>💰 Your Payment is on the Way!</h1>

    <p>Great news, ${params.seller_name}!</p>
    <p>Your payment for the completed order has been processed and is on its way to your account.</p>

    <p><strong>Payment Details:</strong></p>
    <p>Order ID: ${params.order_id}<br>
    Your Earnings: R${params.seller_amount}<br>
    Platform Fee: R${params.platform_fee}<br>
    Total Order Value: R${params.total_amount}</p>

    <p style="font-weight: bold; font-size: 18px; color: #3ab26f;">You will receive: R${params.seller_amount}</p>

    <p>The payment should reflect in your account within 2-3 business days.</p>
    <p>Thank you for selling with ReBooked Solutions! 📚</p>

    <a href="https://rebookedsolutions.co.za/activity" class="btn">View Your Sales</a>

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    
    <p style="font-size: 12px; color: #6b7280;">
      <strong>This is a TEST email from ReBooked Solutions.</strong><br>
      Please do not reply to this email.<br><br>
      For assistance, contact: <a href="mailto:support@rebookedsolutions.co.za" class="link">support@rebookedsolutions.co.za</a><br>
      Visit us at: <a href="https://rebookedsolutions.co.za" class="link">https://rebookedsolutions.co.za</a><br><br>
      T&Cs apply. <em>"Pre-Loved Pages, New Adventures"</em>
    </p>
  </div>
</body>
</html>`;
  };

  const generateRefundProcessedEmail = (params: Record<string, string>) => {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Refund Processed - ReBooked Solutions</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f3fef7;
      padding: 20px;
      color: #1f4e3d;
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
    .link {
      color: #3ab26f;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>💰 Refund Processed</h1>
    
    <p>Hi ${params.buyer_name}!</p>
    <p>Your refund has been processed successfully.</p>

    <p><strong>Refund Details:</strong></p>
    <p>Order ID: ${params.order_id}<br>
    Refund Amount: R${params.refund_amount}<br>
    Refund Reference: ${params.refund_reference}</p>

    <p>Your refund will appear in your account within 3-5 business days.</p>
    <p>Thank you for using ReBooked Solutions!</p>

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    
    <p style="font-size: 12px; color: #6b7280;">
      <strong>This is a TEST email from ReBooked Solutions.</strong><br>
      Please do not reply to this email.<br><br>
      For assistance, contact: <a href="mailto:support@rebookedsolutions.co.za" class="link">support@rebookedsolutions.co.za</a><br>
      Visit us at: <a href="https://rebookedsolutions.co.za" class="link">https://rebookedsolutions.co.za</a><br><br>
      T&Cs apply. <em>"Pre-Loved Pages, New Adventures"</em>
    </p>
  </div>
</body>
</html>`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Email Testing</h2>
        <p className="text-gray-600">
          Test email templates and send sample emails
        </p>
      </div>

      {/* Template Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Template
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Select Template</Label>
            <Select onValueChange={handleTemplateSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an email template to test" />
              </SelectTrigger>
              <SelectContent>
                {emailTemplates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedTemplate && (
            <Alert>
              <AlertDescription>
                <strong>{selectedTemplate.name}</strong>
                <br />
                {selectedTemplate.description}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Test Parameters */}
      {selectedTemplate && (
        <Card>
          <CardHeader>
            <CardTitle>Test Parameters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedTemplate.requiredParams.map((param) => (
              <div key={param}>
                <Label htmlFor={param}>
                  {param.replace(/_/g, " ").toUpperCase()}
                </Label>
                <Input
                  id={param}
                  value={testParams[param] || ""}
                  onChange={(e) => handleParamChange(param, e.target.value)}
                  placeholder={`Enter ${param}`}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Email Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Email Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="recipient">Recipient Email</Label>
            <Input
              id="recipient"
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="Enter email address to send test to"
            />
          </div>

          <div>
            <Label htmlFor="subject">Custom Subject (Optional)</Label>
            <Input
              id="subject"
              value={customSubject}
              onChange={(e) => setCustomSubject(e.target.value)}
              placeholder="Override default subject line"
            />
          </div>

          <div>
            <Label htmlFor="message">Custom Message (Optional)</Label>
            <Textarea
              id="message"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Override default email content with custom HTML"
              rows={6}
            />
          </div>
        </CardContent>
      </Card>

      {/* Send Button */}
      <Card>
        <CardContent className="pt-6">
          <Button
            onClick={sendTestEmail}
            disabled={!selectedTemplate || !recipientEmail || sending}
            className="w-full"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            {sending ? "Sending..." : "Send Test Email"}
          </Button>

          {lastResult && (
            <Alert
              className={`mt-4 ${lastResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}
            >
              {lastResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription
                className={
                  lastResult.success ? "text-green-800" : "text-red-800"
                }
              >
                {lastResult.message}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminEmailTestingTab;

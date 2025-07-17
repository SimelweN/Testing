import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, Send, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface EmailTestResult {
  success: boolean;
  messageId?: string;
  error?: string;
  timing?: number;
}

const EmailTestingComponent = () => {
  const [testEmail, setTestEmail] = useState({
    to: "",
    subject: "",
    template: "",
    customData: "",
    htmlContent: "",
    textContent: "",
  });

  const [isSending, setIsSending] = useState(false);
  const [lastResult, setLastResult] = useState<EmailTestResult | null>(null);

  // Available email templates with sample data
  const templates = [
    {
      name: "welcome",
      label: "Welcome Email",
      sampleData: {
        userName: "Test User",
        loginUrl: "https://example.com/login",
      },
    },
    {
      name: "order-confirmation",
      label: "Order Confirmation",
      sampleData: {
        orderNumber: "ORD_TEST123",
        customerName: "Test Customer",
        items: [{ name: "Sample Book", quantity: 1, price: 100 }],
        total: 100,
        estimatedDelivery: "2-3 business days",
      },
    },
    {
      name: "order-committed-buyer",
      label: "Order Committed (Buyer)",
      sampleData: {
        buyer_name: "Test Buyer",
        order_id: "ORD_TEST123",
        seller_name: "Test Seller",
        book_titles: "Sample Textbook",
        estimated_delivery: "2-3 business days",
      },
    },
    {
      name: "order-committed-seller",
      label: "Order Committed (Seller)",
      sampleData: {
        seller_name: "Test Seller",
        order_id: "ORD_TEST123",
        buyer_name: "Test Buyer",
        book_titles: "Sample Textbook",
        pickup_instructions:
          "A courier will contact you within 24 hours to arrange pickup",
      },
    },
    {
      name: "seller-new-order",
      label: "New Order (Seller)",
      sampleData: {
        sellerName: "Test Seller",
        buyerName: "Test Buyer",
        orderId: "ORD_TEST123",
        items: [{ title: "Sample Book", price: 100 }],
        totalAmount: 100,
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        commitUrl: "https://example.com/activity",
      },
    },
    {
      name: "buyer-order-pending",
      label: "Order Pending (Buyer)",
      sampleData: {
        buyerName: "Test Buyer",
        sellerName: "Test Seller",
        orderId: "ORD_TEST123",
        items: [{ title: "Sample Book", price: 100 }],
        totalAmount: 100,
        statusUrl: "https://example.com/activity",
      },
    },
    {
      name: "password-reset",
      label: "Password Reset",
      sampleData: {
        userName: "Test User",
        resetUrl: "https://example.com/reset-password?token=test123",
        expiryTime: "1 hour",
      },
    },
  ];

  const handleTemplateChange = (templateName: string) => {
    const template = templates.find((t) => t.name === templateName);
    setTestEmail((prev) => ({
      ...prev,
      template: templateName === "custom" ? "" : templateName,
      customData: template ? JSON.stringify(template.sampleData, null, 2) : "",
      subject: template ? `Test ${template.label}` : "",
    }));
  };

  const sendTestEmail = async () => {
    if (!testEmail.to || !testEmail.subject) {
      toast.error("Please provide email address and subject");
      return;
    }

    setIsSending(true);
    setLastResult(null);
    const startTime = Date.now();

    try {
      let emailPayload: any = {
        to: testEmail.to,
        subject: testEmail.subject,
      };

      // Use template if selected
      if (testEmail.template) {
        try {
          const templateData = testEmail.customData
            ? JSON.parse(testEmail.customData)
            : {};
          emailPayload.template = {
            name: testEmail.template,
            data: templateData,
          };
        } catch (error) {
          toast.error("Invalid JSON in template data");
          return;
        }
      } else {
        // Use custom HTML/text content
        if (testEmail.htmlContent) {
          emailPayload.html = testEmail.htmlContent;
        }
        if (testEmail.textContent) {
          emailPayload.text = testEmail.textContent;
        }

        if (!testEmail.htmlContent && !testEmail.textContent) {
          emailPayload.html =
            "<p>Test email from ReBooked Solutions admin panel</p>";
          emailPayload.text = "Test email from ReBooked Solutions admin panel";
        }
      }

      console.log("Sending test email with payload:", emailPayload);

      const { data, error } = await supabase.functions.invoke("send-email", {
        body: emailPayload,
      });

      const timing = Date.now() - startTime;

      if (error) {
        throw error;
      }

      setLastResult({
        success: true,
        messageId: data?.messageId,
        timing,
      });

      toast.success(
        `Test email sent successfully! ${data?.messageId ? `Message ID: ${data.messageId}` : ""}`,
      );
    } catch (error: any) {
      console.error("Email send error:", error);
      const timing = Date.now() - startTime;

      setLastResult({
        success: false,
        error: error.message || "Failed to send email",
        timing,
      });

      toast.error(
        `Failed to send test email: ${error.message || "Unknown error"}`,
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Testing
        </CardTitle>
        <CardDescription>
          Test email templates and send test emails to verify email
          functionality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="test-email-to">Test Email Address</Label>
            <Input
              id="test-email-to"
              type="email"
              placeholder="test@example.com"
              value={testEmail.to}
              onChange={(e) =>
                setTestEmail((prev) => ({ ...prev, to: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="test-email-subject">Subject</Label>
            <Input
              id="test-email-subject"
              placeholder="Test Email Subject"
              value={testEmail.subject}
              onChange={(e) =>
                setTestEmail((prev) => ({ ...prev, subject: e.target.value }))
              }
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email-template">Email Template (Optional)</Label>
          <Select
            value={testEmail.template || "custom"}
            onValueChange={handleTemplateChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a template or use custom content" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="custom">Custom Content</SelectItem>
              {templates.map((template) => (
                <SelectItem key={template.name} value={template.name}>
                  {template.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {testEmail.template ? (
          <div className="space-y-2">
            <Label htmlFor="template-data">Template Data (JSON)</Label>
            <Textarea
              id="template-data"
              placeholder="Template data in JSON format"
              value={testEmail.customData}
              onChange={(e) =>
                setTestEmail((prev) => ({
                  ...prev,
                  customData: e.target.value,
                }))
              }
              rows={8}
              className="font-mono text-sm"
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="html-content">HTML Content (Optional)</Label>
              <Textarea
                id="html-content"
                placeholder="<p>Your HTML email content here</p>"
                value={testEmail.htmlContent}
                onChange={(e) =>
                  setTestEmail((prev) => ({
                    ...prev,
                    htmlContent: e.target.value,
                  }))
                }
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="text-content">Text Content (Optional)</Label>
              <Textarea
                id="text-content"
                placeholder="Your plain text email content here"
                value={testEmail.textContent}
                onChange={(e) =>
                  setTestEmail((prev) => ({
                    ...prev,
                    textContent: e.target.value,
                  }))
                }
                rows={3}
              />
            </div>
          </div>
        )}

        <Button
          onClick={sendTestEmail}
          disabled={isSending || !testEmail.to || !testEmail.subject}
          className="w-full"
        >
          {isSending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Sending Test Email...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Send Test Email
            </>
          )}
        </Button>

        {lastResult && (
          <Alert variant={lastResult.success ? "default" : "destructive"}>
            {lastResult.success ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={lastResult.success ? "default" : "destructive"}
                  >
                    {lastResult.success ? "Success" : "Error"}
                  </Badge>
                  {lastResult.timing && (
                    <Badge variant="outline">{lastResult.timing}ms</Badge>
                  )}
                </div>
                {lastResult.success ? (
                  <div>
                    <p>Email sent successfully!</p>
                    {lastResult.messageId && (
                      <p className="text-sm font-mono">
                        Message ID: {lastResult.messageId}
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    <p>
                      <strong>Error:</strong> {lastResult.error}
                    </p>
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="text-sm text-gray-600 space-y-1">
          <p>
            <strong>Available Templates:</strong>
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
            {templates.map((template) => (
              <Badge key={template.name} variant="outline" className="text-xs">
                {template.label}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmailTestingComponent;

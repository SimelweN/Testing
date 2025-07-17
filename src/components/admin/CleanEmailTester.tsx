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
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  // Email templates with sample data
  const templates = [
    {
      value: "welcome",
      label: "Welcome Email",
      data: {
        userName: "Test User",
        loginUrl: "https://app.rebookedsolutions.co.za/login",
      },
    },
    {
      value: "order-confirmation",
      label: "Order Confirmation",
      data: {
        orderNumber: "TEST_123456",
        customerName: "Test Customer",
        items: [
          { name: "Physics Textbook", quantity: 1, price: 250 },
          { name: "Math Workbook", quantity: 2, price: 150 },
        ],
        total: "550.00",
        estimatedDelivery: "2-3 business days",
      },
    },
    {
      value: "password-reset",
      label: "Password Reset",
      data: {
        userName: "Test User",
        resetUrl: "https://app.rebookedsolutions.co.za/reset?token=test123",
        expiryTime: "1 hour",
      },
    },
    {
      value: "shipping-notification",
      label: "Shipping Notification",
      data: {
        customerName: "Test Customer",
        orderNumber: "SHIP_123456",
        trackingNumber: "TRK789012",
        carrier: "Courier Guy",
        estimatedDelivery: "2024-01-20",
      },
    },
    {
      value: "contact-form",
      label: "Contact Form",
      data: {
        name: "Test User",
        email: "test@example.com",
        subject: "Test Inquiry",
        message: "This is a test contact form message.",
        timestamp: new Date().toLocaleString(),
      },
    },
    {
      value: "booking-confirmation",
      label: "Booking Confirmation",
      data: {
        customerName: "Test Customer",
        bookingId: "BOOK_123456",
        bookTitle: "Advanced Chemistry",
        pickupDate: "2024-01-20",
        pickupLocation: "UCT Campus Bookstore",
        contactInfo: "021-555-0123",
      },
    },
    {
      value: "seller-new-order",
      label: "Seller New Order",
      data: {
        sellerName: "Test Seller",
        buyerName: "Test Buyer",
        orderId: "SELL_123456",
        items: [{ name: "Chemistry Textbook", quantity: 1, price: 300 }],
        totalAmount: "300.00",
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        commitUrl: "https://app.rebookedsolutions.co.za/activity",
      },
    },
    {
      value: "buyer-order-pending",
      label: "Buyer Order Pending",
      data: {
        buyerName: "Test Buyer",
        sellerName: "Test Seller",
        orderId: "PEND_123456",
        items: [{ name: "Biology Textbook", quantity: 1, price: 400 }],
        totalAmount: "400.00",
        statusUrl: "https://app.rebookedsolutions.co.za/orders/PEND_123456",
      },
    },
    {
      value: "order-committed-buyer",
      label: "Order Committed (Buyer)",
      data: {
        buyer_name: "Test Buyer",
        order_id: "COMMIT_123456",
        seller_name: "Test Seller",
        book_titles: "Physics & Math Textbooks",
        estimated_delivery: "2-3 business days",
      },
    },
    {
      value: "order-committed-seller",
      label: "Order Committed (Seller)",
      data: {
        seller_name: "Test Seller",
        order_id: "COMMIT_123456",
        buyer_name: "Test Buyer",
        book_titles: "Physics & Math Textbooks",
        pickup_instructions:
          "A courier will contact you within 24 hours to arrange pickup",
      },
    },
    {
      value: "seller-pickup-notification",
      label: "Seller Pickup Notification",
      data: {
        sellerName: "Test Seller",
        bookTitle: "Advanced Physics",
        orderId: "PICKUP_123456",
        pickupDate: "2024-01-20",
        pickupTimeWindow: "9:00 AM - 5:00 PM",
        courierProvider: "courier-guy",
        trackingNumber: "CG123456789",
        shippingLabelUrl: "https://example.com/label.pdf",
        pickupAddress: {
          streetAddress: "123 Main Street",
          city: "Cape Town",
          province: "Western Cape",
        },
      },
    },
    {
      value: "buyer-order-confirmed",
      label: "Buyer Order Confirmed",
      data: {
        buyerName: "Test Buyer",
        bookTitle: "Advanced Physics",
        orderId: "CONFIRMED_123456",
        sellerName: "Test Seller",
        expectedDelivery: "2-3 business days",
      },
    },
    {
      value: "commit-confirmation-basic",
      label: "Commit Confirmation (Basic)",
      data: {
        sellerName: "Test Seller",
        bookTitle: "Advanced Physics",
        orderId: "BASIC_123456",
        buyerEmail: "buyer@example.com",
      },
    },
  ];

  const sendTestEmail = async () => {
    if (!testEmail) {
      toast.error("Please enter an email address");
      return;
    }

    if (!selectedTemplate) {
      toast.error("Please select a template");
      return;
    }

    const template = templates.find((t) => t.value === selectedTemplate);
    if (!template) {
      toast.error("Template not found");
      return;
    }

    setIsSending(true);
    setLastResult(null);

    try {
      console.log(`Sending ${template.label} template to ${testEmail}...`);

      const { data, error } = await supabase.functions.invoke("send-email", {
        body: {
          to: testEmail,
          subject: `✅ ${template.label} - ReBooked Solutions Test`,
          template: {
            name: selectedTemplate,
            data: template.data,
          },
        },
      });

      if (error) {
        console.error("Email test failed:", error);
        setLastResult({
          success: false,
          template: template.label,
          error: error.message || "Unknown error",
        });
        toast.error(`Failed to send ${template.label}`);
      } else {
        console.log("Email sent successfully:", data);
        setLastResult({
          success: true,
          template: template.label,
          data: data,
          messageId: data?.messageId,
        });
        toast.success(`${template.label} sent successfully!`);
      }
    } catch (error: any) {
      console.error("Email test error:", error);
      setLastResult({
        success: false,
        template: selectedTemplate,
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
          Email Template Tester
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Test individual email templates with the new ReBooked Solutions
          styling
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
          <Label htmlFor="template">Select Email Template</Label>
          <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a template to test" />
            </SelectTrigger>
            <SelectContent>
              {templates.map((template) => (
                <SelectItem key={template.value} value={template.value}>
                  {template.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={sendTestEmail}
          disabled={isSending || !testEmail || !selectedTemplate}
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
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default CleanEmailTester;

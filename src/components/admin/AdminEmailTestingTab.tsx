import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AdminEmailTestingTab: React.FC = () => {
  const [recipientEmail, setRecipientEmail] = useState("");
  const [sending, setSending] = useState<string | null>(null);
  const [results, setResults] = useState<
    Record<string, { success: boolean; message: string }>
  >({});

  const sendTestEmail = async (emailType: string) => {
    if (!recipientEmail.trim()) {
      toast.error("Please enter recipient email");
      return;
    }

    setSending(emailType);
    setResults((prev) => ({
      ...prev,
      [emailType]: { success: false, message: "Sending..." },
    }));

    try {
      const testData = generateTestData();
      let emailBody = "";
      let subject = "";

      // Generate email content based on type
      switch (emailType) {
        case "order_created_seller":
          subject = "📚 New Order - Action Required (48 hours)";
          emailBody = generateSellerOrderEmail(testData);
          break;
        case "order_created_buyer":
          subject = "🎉 Order Confirmed - Thank You!";
          emailBody = generateBuyerOrderEmail(testData);
          break;
        case "order_declined_refund":
          subject = "Order Declined - Refund Processed";
          emailBody = generateRefundEmail(testData);
          break;
        case "seller_payment":
          subject = "💰 Payment Information";
          emailBody = "Seller payment emails are disabled - all payments are manual";
          break;
        case "refund_processed":
          subject = "💰 Refund Processed - ReBooked Solutions";
          emailBody = generateRefundProcessedEmail(testData);
          break;
        default:
          throw new Error("Unknown email type");
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

      setResults((prev) => ({
        ...prev,
        [emailType]: {
          success: true,
          message: `✅ Sent to ${recipientEmail}`,
        },
      }));
      toast.success(`${subject} sent successfully!`);
    } catch (error) {
      console.error("Failed to send test email:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setResults((prev) => ({
        ...prev,
        [emailType]: {
          success: false,
          message: `❌ Failed: ${errorMessage}`,
        },
      }));
      toast.error("Failed to send test email");
    } finally {
      setSending(null);
    }
  };

  const generateTestData = () => {
    const timestamp = Date.now();
    return {
      seller_name: "John Seller",
      buyer_name: "Jane Buyer",
      order_id: `TEST_ORDER_${timestamp}`,
      total_amount: "150.00",
      seller_amount: "135.00",
      platform_fee: "15.00",
      refund_amount: "150.00",
      refund_reference: `REF_${timestamp}`,
      reason: "Test decline reason - this is just a test",
    };
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
      <strong>⏰ This is a TEST email - no action needed</strong><br>
      In real emails, sellers have 48 hours to commit to orders.
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
    <h1>❌ Order Declined - Refund Processed</h1>

    <p>Hello ${params.buyer_name},</p>
    <p>We're sorry to inform you that your order has been declined by the seller.</p>

    <p><strong>Order Details:</strong></p>
    <p>Order ID: ${params.order_id}<br>
    Amount: R${params.total_amount}<br>
    Reason: ${params.reason}</p>

    <p><strong>Refund Details:</strong></p>
    <p>Refund Reference: ${params.refund_reference}<br>
    Refund Amount: R${params.refund_amount}<br>
    Expected Processing: 3-5 business days</p>

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
    return "Seller payment emails are disabled - all payments are manual";
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
          One-click email testing - just enter your email and click any button
          to test
        </p>
      </div>

      {/* Email Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Your Email Address
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="recipient">
              Where should we send the test emails?
            </Label>
            <Input
              id="recipient"
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="Enter your email address"
              className="mt-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Quick Test Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Email Tests</CardTitle>
          <p className="text-sm text-gray-600">
            Click any button to instantly send a test email with mock data
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Order Created - Seller */}
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2">📚 New Order (Seller)</h4>
              <p className="text-sm text-gray-600 mb-3">
                Email sent to seller when buyer places order
              </p>
              <Button
                onClick={() => sendTestEmail("order_created_seller")}
                disabled={
                  !recipientEmail.trim() || sending === "order_created_seller"
                }
                className="w-full"
                size="sm"
              >
                {sending === "order_created_seller" ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Test Seller Order Email
              </Button>
              {results.order_created_seller && (
                <p
                  className={`text-xs mt-2 ${results.order_created_seller.success ? "text-green-600" : "text-red-600"}`}
                >
                  {results.order_created_seller.message}
                </p>
              )}
            </div>

            {/* Order Created - Buyer */}
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2">
                🎉 Order Confirmation (Buyer)
              </h4>
              <p className="text-sm text-gray-600 mb-3">
                Email sent to buyer confirming their order
              </p>
              <Button
                onClick={() => sendTestEmail("order_created_buyer")}
                disabled={
                  !recipientEmail.trim() || sending === "order_created_buyer"
                }
                className="w-full"
                size="sm"
              >
                {sending === "order_created_buyer" ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Test Buyer Confirmation
              </Button>
              {results.order_created_buyer && (
                <p
                  className={`text-xs mt-2 ${results.order_created_buyer.success ? "text-green-600" : "text-red-600"}`}
                >
                  {results.order_created_buyer.message}
                </p>
              )}
            </div>

            {/* Order Declined + Refund */}
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2">❌ Order Declined + Refund</h4>
              <p className="text-sm text-gray-600 mb-3">
                Email when seller declines and refund is processed
              </p>
              <Button
                onClick={() => sendTestEmail("order_declined_refund")}
                disabled={
                  !recipientEmail.trim() || sending === "order_declined_refund"
                }
                className="w-full"
                size="sm"
              >
                {sending === "order_declined_refund" ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Test Decline + Refund
              </Button>
              {results.order_declined_refund && (
                <p
                  className={`text-xs mt-2 ${results.order_declined_refund.success ? "text-green-600" : "text-red-600"}`}
                >
                  {results.order_declined_refund.message}
                </p>
              )}
            </div>

            {/* Seller Payment */}
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2">💰 Seller Payment</h4>
              <p className="text-sm text-gray-600 mb-3">
                Email when seller receives payment
              </p>
              <Button
                onClick={() => sendTestEmail("seller_payment")}
                disabled={
                  !recipientEmail.trim() || sending === "seller_payment"
                }
                className="w-full"
                size="sm"
              >
                {sending === "seller_payment" ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Test Seller Payment
              </Button>
              {results.seller_payment && (
                <p
                  className={`text-xs mt-2 ${results.seller_payment.success ? "text-green-600" : "text-red-600"}`}
                >
                  {results.seller_payment.message}
                </p>
              )}
            </div>

            {/* General Refund */}
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2">💰 Refund Processed</h4>
              <p className="text-sm text-gray-600 mb-3">
                Email when any refund is processed
              </p>
              <Button
                onClick={() => sendTestEmail("refund_processed")}
                disabled={
                  !recipientEmail.trim() || sending === "refund_processed"
                }
                className="w-full"
                size="sm"
              >
                {sending === "refund_processed" ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Test Refund Email
              </Button>
              {results.refund_processed && (
                <p
                  className={`text-xs mt-2 ${results.refund_processed.success ? "text-green-600" : "text-red-600"}`}
                >
                  {results.refund_processed.message}
                </p>
              )}
            </div>

            {/* Send All */}
            <div className="border rounded-lg p-4 md:col-span-2">
              <h4 className="font-medium mb-2">🚀 Send All Test Emails</h4>
              <p className="text-sm text-gray-600 mb-3">
                Send all 5 test emails at once to see the full email flow
              </p>
              <Button
                onClick={() => {
                  sendTestEmail("order_created_seller");
                  setTimeout(() => sendTestEmail("order_created_buyer"), 1000);
                  setTimeout(
                    () => sendTestEmail("order_declined_refund"),
                    2000,
                  );
                  setTimeout(() => sendTestEmail("seller_payment"), 3000);
                  setTimeout(() => sendTestEmail("refund_processed"), 4000);
                }}
                disabled={!recipientEmail.trim() || sending}
                className="w-full"
              >
                {sending ? "Sending..." : "Send All Test Emails"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-sm text-gray-600 space-y-2">
            <p>
              <strong>How to test:</strong>
            </p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Enter your email address above</li>
              <li>Click any test button</li>
              <li>Check your email inbox (including spam folder)</li>
              <li>All emails use clean, consistent styling</li>
            </ol>
            <p className="text-xs text-gray-500 mt-4">
              All test emails are clearly marked as [TEST] and contain mock data
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminEmailTestingTab;

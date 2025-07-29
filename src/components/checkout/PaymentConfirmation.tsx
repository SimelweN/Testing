import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Package,
  Mail,
  Clock,
  ArrowRight,
  Download,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PaymentData {
  order_id: string;
  payment_reference: string;
  book_id: string;
  seller_id: string;
  buyer_id: string;
  book_title: string;
  book_price: number;
  delivery_method: string;
  delivery_price: number;
  total_paid: number;
  created_at: string;
  status: string;
}

interface PaymentConfirmationProps {
  paymentData: PaymentData;
  onContinueShopping: () => void;
}

const PaymentConfirmation: React.FC<PaymentConfirmationProps> = ({
  paymentData,
  onContinueShopping,
}) => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(true);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Trigger order creation and email notifications
    finalizeOrder();
  }, []);

  const finalizeOrder = async () => {
    try {
      console.log("🔄 Finalizing order after payment success...");

      // Get user details for email
      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      if (userError || !userData.user) {
        throw new Error("User authentication error");
      }

      // Create order via API
      const response = await fetch("/api/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: paymentData.buyer_id,
          items: [
            {
              book_id: paymentData.book_id,
              seller_id: paymentData.seller_id,
              title: paymentData.book_title,
              price: paymentData.book_price,
            },
          ],
          total_amount: paymentData.total_paid,
          shipping_address: {
            name: userData.user.user_metadata?.name || "Customer",
            email: userData.user.email,
          },
          payment_reference: paymentData.payment_reference,
          payment_data: {
            reference: paymentData.payment_reference,
            amount: paymentData.total_paid,
            status: "success",
            verified_at: new Date().toISOString(),
          },
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to create order");
      }

      console.log("✅ Order created successfully:", result);
      setOrderDetails(result.orders[0]);

      // Store payment transaction
      const { error: paymentError } = await supabase
        .from("payment_transactions")
        .insert({
          reference: paymentData.payment_reference,
          order_id: result.orders[0].id,
          user_id: paymentData.buyer_id,
          amount: paymentData.total_paid,
          currency: "ZAR",
          status: "success",
          customer_email: userData.user.email,
          customer_name: userData.user.user_metadata?.name || "Customer",
          verified_at: new Date().toISOString(),
          metadata: {
            book_id: paymentData.book_id,
            book_title: paymentData.book_title,
            delivery_method: paymentData.delivery_method,
          },
        });

      if (paymentError) {
        console.error("Failed to store payment transaction:", paymentError);
        // Don't fail the entire process for this
      }

      // Send confirmation emails
      await sendConfirmationEmails(result.orders[0], userData.user);

      toast.success("Order confirmed! Confirmation emails sent.", {
        description: `Order #${result.orders[0].id}`,
      });
    } catch (error) {
      console.error("Order finalization error:", error);
      setError(
        error instanceof Error ? error.message : "Failed to finalize order",
      );
      toast.error("Order finalization failed", {
        description: "Please contact support with your payment reference",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const sendConfirmationEmails = async (order: any, user: any) => {
    try {
      // Import email service to use proper Supabase function endpoint
      const { emailService } = await import("@/services/emailService");

      // Send buyer confirmation email
      await emailService.sendEmail({
        to: user.email,
        subject: "🎉 Payment Confirmed - Your Custom Receipt from ReBooked Marketplace",
        html: generateBuyerConfirmationEmail(order, paymentData),
        text: `Payment Confirmed - Your Custom Receipt\n\n✅ Your payment has been successfully processed!\n\nORDER SUMMARY:\nOrder ID: ${order.id}\nPayment Reference: ${paymentData.payment_reference}\nBook: ${paymentData.book_title}\nTotal Paid: R${paymentData.total_paid.toFixed(2)}\nDelivery Method: ${paymentData.delivery_method}\n\nWHAT HAPPENS NEXT (Step-by-Step):\n\n1. SELLER NOTIFICATION (Right Now)\n   The seller has been automatically notified of your order.\n\n2. SELLER COMMITMENT (Within 48 Hours)\n   The seller has exactly 48 hours to commit to fulfilling your order.\n   If they don't respond, you'll get an automatic full refund.\n\n3. COURIER PICKUP (Same Day as Commitment)\n   Once seller commits, we arrange courier pickup immediately.\n\n4. SHIPPING & TRACKING (1-2 Days After Pickup)\n   You'll receive tracking details via email and SMS.\n\n5. DELIVERY (2-3 Business Days)\n   Expected delivery: 2-3 business days after pickup.\n\nTOTAL TIMEFRAME: 3-5 business days from now to delivery\n\nTrack your order: https://rebookedsolutions.co.za/orders/${order.id}\n\nThis is your official receipt from ReBooked Marketplace.\n\nFor assistance: support@rebookedsolutions.co.za\nReBooked Marketplace - "Pre-Loved Pages, New Adventures"`,
      });

      console.log("✅ Confirmation emails sent");
    } catch (error) {
      console.error("Email sending error:", error);
      // Don't fail the process for email errors
    }
  };

  const generateBuyerConfirmationEmail = (order: any, payment: PaymentData) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Payment Confirmed - ReBooked Marketplace</title>
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
    .link {
      color: #3ab26f;
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
    .info-box {
      background: #f3fef7;
      border: 1px solid #3ab26f;
      padding: 15px;
      border-radius: 5px;
      margin: 15px 0;
    }
    .info-box-success {
      background: #f0fdf4;
      border: 1px solid #10b981;
      padding: 15px;
      border-radius: 5px;
      margin: 15px 0;
    }
    .info-box-warning {
      background: #fffbeb;
      border: 1px solid #f59e0b;
      padding: 15px;
      border-radius: 5px;
      margin: 15px 0;
    }
    .total {
      font-weight: bold;
      font-size: 18px;
      color: #3ab26f;
    }
    .timeline-step {
      display: flex;
      align-items: flex-start;
      margin: 15px 0;
      padding: 10px 0;
      border-bottom: 1px dashed #e5e7eb;
    }
    .timeline-step:last-child {
      border-bottom: none;
    }
    .step-number {
      background: #3ab26f;
      color: white;
      width: 25px;
      height: 25px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 12px;
      margin-right: 15px;
      flex-shrink: 0;
    }
    .success-box {
      background: #d1fae5;
      border: 1px solid #10b981;
      padding: 15px;
      border-radius: 5px;
      margin: 20px 0;
      text-align: center;
    }
    .info-box {
      background: #f3fef7;
      border: 1px solid #3ab26f;
      padding: 15px;
      border-radius: 5px;
      margin: 15px 0;
    }
    .timeline-step {
      display: flex;
      align-items: flex-start;
      margin: 15px 0;
      padding: 10px 0;
      border-bottom: 1px dashed #e5e7eb;
    }
    .timeline-step:last-child {
      border-bottom: none;
    }
    .step-number {
      background: #3ab26f;
      color: white;
      width: 25px;
      height: 25px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 12px;
      margin-right: 15px;
      flex-shrink: 0;
    }
    .link {
      color: #3ab26f;
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
      <h1>🎉 Payment Confirmed!</h1>
      <p>Your custom receipt from ReBooked Marketplace</p>
    </div>

    <div class="success-box">
      <h2 style="margin: 0; color: #10b981;">✅ Payment Successfully Processed</h2>
      <p style="margin: 10px 0 0 0; font-size: 14px;">Thank you for your purchase! Your order is now being processed.</p>
    </div>

    <div class="info-box">
      <h3 style="margin-top: 0;">📋 Order Summary</h3>
      <p><strong>Order ID:</strong> ${order.id}</p>
      <p><strong>Payment Reference:</strong> ${payment.payment_reference}</p>
      <p><strong>Book:</strong> ${payment.book_title}</p>
      <p><strong>Delivery Method:</strong> ${payment.delivery_method}</p>
      <div class="total">
        <p>Total Paid: R${payment.total_paid.toFixed(2)}</p>
      </div>
    </div>

    <div class="info-box">
      <h3 style="margin-top: 0;">📦 What Happens Next? (Step-by-Step)</h3>
      <p><strong>We know waiting can be nerve-wracking, so here's exactly what happens:</strong></p>

      <div class="timeline-step">
        <div class="step-number">1</div>
        <div>
          <h4 style="margin: 0 0 5px 0;">Seller Notification (Right Now)</h4>
          <p style="margin: 0; font-size: 14px; color: #666;">The seller has been automatically notified of your order and payment. They can see all order details in their dashboard.</p>
        </div>
      </div>

      <div class="timeline-step">
        <div class="step-number">2</div>
        <div>
          <h4 style="margin: 0 0 5px 0;">Seller Commitment (Within 48 Hours)</h4>
          <p style="margin: 0; font-size: 14px; color: #666;">The seller has exactly <strong>48 hours</strong> to commit to fulfilling your order. If they don't respond, you'll get an automatic full refund.</p>
        </div>
      </div>

      <div class="timeline-step">
        <div class="step-number">3</div>
        <div>
          <h4 style="margin: 0 0 5px 0;">Courier Pickup Arranged (Same Day as Commitment)</h4>
          <p style="margin: 0; font-size: 14px; color: #666;">Once the seller commits, we immediately arrange courier pickup from their location. No action required from you!</p>
        </div>
      </div>

      <div class="timeline-step">
        <div class="step-number">4</div>
        <div>
          <h4 style="margin: 0 0 5px 0;">Shipping & Tracking (1-2 Days After Pickup)</h4>
          <p style="margin: 0; font-size: 14px; color: #666;">You'll receive tracking details via email and SMS as soon as the book is collected and in transit to you.</p>
        </div>
      </div>

      <div class="timeline-step">
        <div class="step-number">5</div>
        <div>
          <h4 style="margin: 0 0 5px 0;">Delivery (2-3 Business Days)</h4>
          <p style="margin: 0; font-size: 14px; color: #666;">Your book will be delivered to your address. Expected delivery: <strong>2-3 business days</strong> after pickup.</p>
        </div>
      </div>
    </div>

    <div class="info-box" style="border-color: #fbbf24; background: #fef3c7;">
      <h3 style="margin-top: 0; color: #92400e;">⏰ Important Timeline</h3>
      <p style="margin: 0; color: #92400e;"><strong>Total Expected Timeframe:</strong> 3-5 business days from now to delivery</p>
      <p style="margin: 10px 0 0 0; font-size: 14px; color: #92400e;">We'll update you at every step via email and SMS notifications.</p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="https://rebookedsolutions.co.za/orders/${order.id}" class="btn">Track Your Order Live</a>
    </div>

    <div class="info-box" style="border-color: #06b6d4; background: #e0f7fa;">
      <h3 style="margin-top: 0; color: #0e7490;">💡 Pro Tips</h3>
      <ul style="margin: 0; padding-left: 20px; color: #0e7490;">
        <li>Check your email regularly for updates</li>
        <li>Save our contact info: <strong>support@rebookedsolutions.co.za</strong></li>
        <li>Your payment is 100% protected until delivery confirmation</li>
        <li>Rate your experience after delivery to help other students</li>
      </ul>
    </div>

    <div class="footer">
      <p><strong>This is an automated message from ReBooked Marketplace.</strong><br>
      Please do not reply to this email.</p>
      <p>For assistance, contact: <a href="mailto:support@rebookedsolutions.co.za" class="link">support@rebookedsolutions.co.za</a><br>
      Visit us at: <a href="https://rebookedsolutions.co.za" class="link">https://rebookedsolutions.co.za</a></p>
      <p>T&Cs apply. <em>"Pre-Loved Pages, New Adventures"</em></p>
    </div>
  </div>
</body>
</html>`;

  const getDeliveryEstimate = () => {
    const days = paymentData.delivery_method.includes("Express")
      ? "1-2"
      : "2-3";
    return `${days} business days`;
  };

  if (isProcessing) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-green-600" />
            <h2 className="text-xl font-semibold mb-2">
              Processing Your Order...
            </h2>
            <p className="text-gray-600">
              We're confirming your payment and setting up your order.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Order Processing Error</strong>
            <p className="mt-1">{error}</p>
            <div className="mt-3">
              <p className="text-sm">
                <strong>Your payment was successful!</strong> Reference:{" "}
                {paymentData.payment_reference}
              </p>
              <p className="text-sm mt-1">
                Please contact support at support@rebookedsolutions.co.za with
                this reference.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Success Header */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-green-800 mb-2">
            Payment Successful! 🎉
          </h1>
          <p className="text-green-700">
            Your order has been confirmed and is being processed.
          </p>
        </CardContent>
      </Card>

      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Order Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold">{paymentData.book_title}</h3>
              <p className="text-sm text-gray-600">
                Order #{orderDetails?.id || paymentData.order_id}
              </p>
              <Badge variant="outline" className="mt-1">
                {paymentData.status}
              </Badge>
            </div>
            <div className="text-right">
              <p className="font-semibold">
                R{paymentData.total_paid.toFixed(2)}
              </p>
              <p className="text-sm text-gray-600">Total Paid</p>
            </div>
          </div>

          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Book Price:</span>
              <span>R{paymentData.book_price.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Delivery ({paymentData.delivery_method}):</span>
              <span>R{paymentData.delivery_price.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold border-t pt-2">
              <span>Total:</span>
              <span>R{paymentData.total_paid.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            What Happens Next
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-semibold text-green-600">1</span>
              </div>
              <div>
                <p className="font-medium">Seller Notification</p>
                <p className="text-sm text-gray-600">
                  The seller has been notified and has 48 hours to commit to
                  your order.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-semibold text-blue-600">2</span>
              </div>
              <div>
                <p className="font-medium">Pickup & Processing</p>
                <p className="text-sm text-gray-600">
                  Once committed, we'll arrange pickup from the seller.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-semibold text-purple-600">3</span>
              </div>
              <div>
                <p className="font-medium">Delivery</p>
                <p className="text-sm text-gray-600">
                  Expected delivery: {getDeliveryEstimate()}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Confirmation */}
      <Alert className="border-blue-200 bg-blue-50">
        <Mail className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Confirmation Email Sent</strong>
          <p className="text-sm mt-1">
            Check your inbox for order details and tracking information.
          </p>
        </AlertDescription>
      </Alert>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={() =>
            navigate(`/orders/${orderDetails?.id || paymentData.order_id}`)
          }
          className="flex-1"
        >
          <Package className="h-4 w-4 mr-2" />
          Track Order
        </Button>
        <Button
          variant="outline"
          onClick={onContinueShopping}
          className="flex-1"
        >
          <ArrowRight className="h-4 w-4 mr-2" />
          Continue Shopping
        </Button>
      </div>

      {/* Support Info */}
      <div className="text-center text-sm text-gray-600">
        <p>
          Need help? Contact us at{" "}
          <a
            href="mailto:support@rebookedsolutions.co.za"
            className="text-green-600 hover:underline"
          >
            support@rebookedsolutions.co.za
          </a>
        </p>
        <p className="mt-1">
          Payment Reference: {paymentData.payment_reference}
        </p>
      </div>
    </div>
  );
};

export default PaymentConfirmation;

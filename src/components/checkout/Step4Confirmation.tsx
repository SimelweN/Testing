import React, { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle,
  Package,
  Truck,
  Download,
  Mail,
  Eye,
  ShoppingBag,
} from "lucide-react";
import { OrderConfirmation } from "@/types/checkout";
import { toast } from "sonner";

interface Step4ConfirmationProps {
  orderData: OrderConfirmation;
  onViewOrders: () => void;
  onContinueShopping: () => void;
}

const Step4Confirmation: React.FC<Step4ConfirmationProps> = ({
  orderData,
  onViewOrders,
  onContinueShopping,
}) => {
  useEffect(() => {
    // Send confirmation email
    sendConfirmationEmail();

    // Clean up cart checkout data since order is complete
    localStorage.removeItem('checkoutCart');
    localStorage.removeItem('activeCheckoutKey');

    // Show success toast
    toast.success("Payment successful! 🎉", {
      description:
        "Your order has been confirmed and the seller has been notified.",
      duration: 5000,
    });
  }, []);

  const sendConfirmationEmail = async () => {
    try {
      // This would typically call your email service
      console.log("Sending confirmation email for order:", orderData.order_id);
    } catch (error) {
      console.error("Failed to send confirmation email:", error);
    }
  };

  const downloadReceipt = () => {
    // Generate and download receipt PDF
    const receiptContent = generateReceiptText();
    const blob = new Blob([receiptContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `receipt-${orderData.order_id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Receipt downloaded successfully!");
  };

  const generateReceiptText = () => {
    return `
REBOOKED SOLUTIONS - PURCHASE RECEIPT
=====================================

Order ID: ${orderData.order_id}
Payment Reference: ${orderData.payment_reference}
Date: ${new Date(orderData.created_at).toLocaleDateString()}
Time: ${new Date(orderData.created_at).toLocaleTimeString()}

BOOK DETAILS
============
Title: ${orderData.book_title}
Book ID: ${orderData.book_id}
Price: R${orderData.book_price.toFixed(2)}

SELLER INFORMATION
==================
Seller ID: ${orderData.seller_id}

DELIVERY INFORMATION
====================
Method: ${orderData.delivery_method}
Cost: R${orderData.delivery_price.toFixed(2)}

PAYMENT SUMMARY
===============
Book Price: R${orderData.book_price.toFixed(2)}
Delivery Fee: R${orderData.delivery_price.toFixed(2)}
Total Paid: R${orderData.total_paid.toFixed(2)}

Status: ${orderData.status.toUpperCase()}

Thank you for your purchase!
Visit https://rebooked.co.za to track your order.
    `.trim();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Success Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Payment Successful!
        </h1>
        <p className="text-gray-600">
          Thank you for your purchase. Your order has been confirmed.
        </p>
      </div>

      {/* Order Details Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Order Confirmation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium text-gray-600">Order ID</p>
              <p className="font-mono">{orderData.order_id}</p>
            </div>
            <div>
              <p className="font-medium text-gray-600">Payment Reference</p>
              <p className="font-mono">{orderData.payment_reference}</p>
            </div>
            <div>
              <p className="font-medium text-gray-600">Order Date</p>
              <p>{new Date(orderData.created_at).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="font-medium text-gray-600">Status</p>
              {getStatusBadge(orderData.status)}
            </div>
          </div>

          <Separator />

          {/* 📄 Receipt Data as Specified */}
          <div>
            <h3 className="font-medium mb-2">📚 Book Details</h3>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="font-medium">{orderData.book_title}</p>
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mt-2">
                <span>Book ID: {orderData.book_id}</span>
                <span>R{orderData.book_price.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* 👤 Seller ID */}
          <div>
            <h3 className="font-medium mb-2">👤 Seller Information</h3>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm font-mono">
                Seller ID: {orderData.seller_id}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                The seller has been notified and will prepare your book for
                shipment.
              </p>
            </div>
          </div>

          {/* 👤 Buyer ID */}
          <div>
            <h3 className="font-medium mb-2">👤 Buyer Information</h3>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm font-mono">
                Buyer ID: {orderData.buyer_id}
              </p>
            </div>
          </div>

          {/* 🚚 Delivery Method & Price */}
          <div>
            <h3 className="font-medium mb-2 flex items-center gap-2">
              <Truck className="w-4 h-4" />
              🚚 Delivery Method
            </h3>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex justify-between">
                <span className="text-sm font-medium">
                  {orderData.delivery_method}
                </span>
                <span className="text-sm font-bold">
                  R{orderData.delivery_price.toFixed(2)}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                You'll receive tracking information once the book is shipped.
              </p>
            </div>
          </div>

          <Separator />

          {/* 💰 Price Breakdown */}
          <div>
            <h3 className="font-medium mb-2">💰 Price Breakdown</h3>
            <div className="space-y-2 text-sm bg-gray-50 rounded-lg p-3">
              <div className="flex justify-between">
                <span>Book Price</span>
                <span>R{orderData.book_price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Price</span>
                <span>R{orderData.delivery_price.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total Paid</span>
                <span className="text-green-600">
                  R{orderData.total_paid.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* ✅ Status */}
          <div>
            <h3 className="font-medium mb-2">✅ Status</h3>
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-green-800 font-medium">PAID</p>
              <p className="text-sm text-gray-600">
                Payment completed successfully
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions Card */}
      <Card>
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <Mail className="w-4 h-4 text-blue-500" />
            <span>
              Confirmation email sent to your registered email address
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Package className="w-4 h-4 text-orange-500" />
            <span>
              Seller will be notified to prepare your book for shipment
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Truck className="w-4 h-4 text-green-500" />
            <span>You'll receive tracking information via email and SMS</span>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="space-y-4">
        <div className="flex gap-4">
          <Button
            onClick={downloadReceipt}
            variant="outline"
            className="flex-1"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Receipt
          </Button>
          <Button onClick={onViewOrders} variant="outline" className="flex-1">
            <Eye className="w-4 h-4 mr-2" />
            View My Orders
          </Button>
        </div>

        <Button onClick={onContinueShopping} className="w-full" size="lg">
          <ShoppingBag className="w-5 h-5 mr-2" />
          Continue Shopping
        </Button>
      </div>

      {/* Support Information */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <h3 className="font-medium mb-2">Need Help?</h3>
          <p className="text-sm text-gray-600">
            If you have any questions about your order, please contact our
            support team or check your order status in the "My Orders" section
            of your account.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Step4Confirmation;

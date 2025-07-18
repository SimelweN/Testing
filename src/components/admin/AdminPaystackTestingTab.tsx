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
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  DollarSign,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Loader2,
  ArrowLeftRight,
  Eye,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TestResult {
  success: boolean;
  message: string;
  data?: any;
}

const AdminPaystackTestingTab: React.FC = () => {
  const [refundOrderId, setRefundOrderId] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [refundTesting, setRefundTesting] = useState(false);
  const [refundResult, setRefundResult] = useState<TestResult | null>(null);

  const [paymentOrderId, setPaymentOrderId] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentTesting, setPaymentTesting] = useState(false);
  const [paymentResult, setPaymentResult] = useState<TestResult | null>(null);

  const [statusCheckRef, setStatusCheckRef] = useState("");
  const [statusChecking, setStatusChecking] = useState(false);
  const [statusResult, setStatusResult] = useState<TestResult | null>(null);

  const [systemTesting, setSystemTesting] = useState(false);
  const [systemResult, setSystemResult] = useState<TestResult | null>(null);

  const testRefund = async () => {
    if (!refundOrderId.trim()) {
      toast.error("Please enter an order ID");
      return;
    }

    setRefundTesting(true);
    setRefundResult(null);

    try {
      // Call the refund API
      const response = await fetch("/api/process-refund", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          order_id: refundOrderId,
          reason: refundReason || "Admin test refund",
          admin_action: true,
          amount: refundAmount ? parseFloat(refundAmount) : undefined,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setRefundResult({
          success: true,
          message: `Refund processed successfully`,
          data: result.refund,
        });
        toast.success("Test refund completed");
      } else {
        setRefundResult({
          success: false,
          message: result.error || "Refund failed",
        });
        toast.error("Refund test failed");
      }
    } catch (error) {
      console.error("Refund test error:", error);
      setRefundResult({
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      });
      toast.error("Refund test failed");
    } finally {
      setRefundTesting(false);
    }
  };

  const testSellerPayment = async () => {
    if (!paymentOrderId.trim() || !paymentAmount.trim()) {
      toast.error("Please enter order ID and amount");
      return;
    }

    setPaymentTesting(true);
    setPaymentResult(null);

    try {
      // Get order details first
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", paymentOrderId)
        .single();

      if (orderError || !order) {
        throw new Error("Order not found");
      }

      // Call the pay seller API
      const response = await fetch("/api/pay-seller", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          order_id: paymentOrderId,
          seller_id: order.seller_id,
          amount: parseFloat(paymentAmount),
          trigger: "admin_test",
        }),
      });

      const result = await response.json();

      if (result.success) {
        setPaymentResult({
          success: true,
          message: `Payment initiated successfully`,
          data: result.payout,
        });
        toast.success("Test payment completed");
      } else {
        setPaymentResult({
          success: false,
          message: result.error || "Payment failed",
        });
        toast.error("Payment test failed");
      }
    } catch (error) {
      console.error("Payment test error:", error);
      setPaymentResult({
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      });
      toast.error("Payment test failed");
    } finally {
      setPaymentTesting(false);
    }
  };

  const checkTransactionStatus = async () => {
    if (!statusCheckRef.trim()) {
      toast.error("Please enter a transaction reference");
      return;
    }

    setStatusChecking(true);
    setStatusResult(null);

    try {
      // Check payment transaction status
      const { data: paymentTx, error: paymentError } = await supabase
        .from("payment_transactions")
        .select("*")
        .eq("reference", statusCheckRef)
        .single();

      if (paymentTx) {
        setStatusResult({
          success: true,
          message: "Payment transaction found",
          data: {
            type: "payment",
            status: paymentTx.status,
            amount: paymentTx.amount,
            created_at: paymentTx.created_at,
            verified_at: paymentTx.verified_at,
          },
        });
        return;
      }

      // Check refund transaction status
      const { data: refundTx, error: refundError } = await supabase
        .from("refund_transactions")
        .select("*")
        .eq("refund_reference", statusCheckRef)
        .single();

      if (refundTx) {
        setStatusResult({
          success: true,
          message: "Refund transaction found",
          data: {
            type: "refund",
            status: refundTx.status,
            amount: refundTx.amount,
            created_at: refundTx.created_at,
            reason: refundTx.reason,
          },
        });
        return;
      }

      setStatusResult({
        success: false,
        message: "Transaction not found in database",
      });
    } catch (error) {
      console.error("Status check error:", error);
      setStatusResult({
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setStatusChecking(false);
    }
  };

  const testPaymentSystem = async () => {
    setSystemTesting(true);
    setSystemResult(null);

    try {
      // Import and run the payment system tester
      const { PaymentValidator } = await import("@/utils/paymentValidation");
      const result = await PaymentValidator.validatePaymentSystems();

      setSystemResult({
        success: result.overall === "healthy",
        message: result.summary,
        data: result.systems,
      });

      if (result.overall === "healthy") {
        toast.success("Payment system is healthy");
      } else {
        toast.warning("Payment system has issues");
      }
    } catch (error) {
      console.error("System test error:", error);
      setSystemResult({
        success: false,
        message: error instanceof Error ? error.message : "System test failed",
      });
      toast.error("System test failed");
    } finally {
      setSystemTesting(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "success":
      case "completed":
      case "healthy":
        return "bg-green-100 text-green-800";
      case "pending":
      case "processing":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
      case "error":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Paystack & Refund Testing</h2>
        <p className="text-gray-600">
          Test payment processing, refunds, and system health
        </p>
      </div>

      {/* System Health Check */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Payment System Health Check
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={testPaymentSystem}
              disabled={systemTesting}
              variant="outline"
            >
              {systemTesting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {systemTesting ? "Testing..." : "Run System Check"}
            </Button>
          </div>

          {systemResult && (
            <Alert
              className={`${systemResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}
            >
              {systemResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription
                className={
                  systemResult.success ? "text-green-800" : "text-red-800"
                }
              >
                <strong>{systemResult.message}</strong>
                {systemResult.data && (
                  <div className="mt-2 space-y-1">
                    {systemResult.data.map((component: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm">{component.component}</span>
                        <Badge
                          className={getStatusBadgeColor(component.status)}
                        >
                          {component.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Refund Testing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5" />
            Test Refund Processing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="refund-order">Order ID</Label>
              <Input
                id="refund-order"
                value={refundOrderId}
                onChange={(e) => setRefundOrderId(e.target.value)}
                placeholder="Enter order ID to refund"
              />
            </div>
            <div>
              <Label htmlFor="refund-amount">Amount (Optional)</Label>
              <Input
                id="refund-amount"
                type="number"
                step="0.01"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                placeholder="Leave blank for full refund"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="refund-reason">Reason</Label>
            <Input
              id="refund-reason"
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              placeholder="Reason for refund (optional)"
            />
          </div>

          <Button
            onClick={testRefund}
            disabled={refundTesting || !refundOrderId.trim()}
          >
            {refundTesting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <ArrowLeftRight className="h-4 w-4 mr-2" />
            )}
            {refundTesting ? "Processing..." : "Test Refund"}
          </Button>

          {refundResult && (
            <Alert
              className={`${refundResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}
            >
              {refundResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription
                className={
                  refundResult.success ? "text-green-800" : "text-red-800"
                }
              >
                <strong>{refundResult.message}</strong>
                {refundResult.data && (
                  <div className="mt-2">
                    <p className="text-sm">
                      Refund ID: {refundResult.data.id}
                      <br />
                      Amount: R{refundResult.data.amount}
                      <br />
                      Status: {refundResult.data.status}
                    </p>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Seller Payment Testing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Test Seller Payment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="payment-order">Order ID</Label>
              <Input
                id="payment-order"
                value={paymentOrderId}
                onChange={(e) => setPaymentOrderId(e.target.value)}
                placeholder="Enter order ID for payment"
              />
            </div>
            <div>
              <Label htmlFor="payment-amount">Amount</Label>
              <Input
                id="payment-amount"
                type="number"
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Payment amount"
              />
            </div>
          </div>

          <Button
            onClick={testSellerPayment}
            disabled={
              paymentTesting || !paymentOrderId.trim() || !paymentAmount.trim()
            }
          >
            {paymentTesting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <DollarSign className="h-4 w-4 mr-2" />
            )}
            {paymentTesting ? "Processing..." : "Test Payment"}
          </Button>

          {paymentResult && (
            <Alert
              className={`${paymentResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}
            >
              {paymentResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription
                className={
                  paymentResult.success ? "text-green-800" : "text-red-800"
                }
              >
                <strong>{paymentResult.message}</strong>
                {paymentResult.data && (
                  <div className="mt-2">
                    <p className="text-sm">
                      Transfer Reference:{" "}
                      {paymentResult.data.transfer_reference}
                      <br />
                      Amount: R{paymentResult.data.amount}
                      <br />
                      Status: {paymentResult.data.status}
                    </p>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Transaction Status Check */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Check Transaction Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="status-ref">Transaction Reference</Label>
            <Input
              id="status-ref"
              value={statusCheckRef}
              onChange={(e) => setStatusCheckRef(e.target.value)}
              placeholder="Enter payment or refund reference"
            />
          </div>

          <Button
            onClick={checkTransactionStatus}
            disabled={statusChecking || !statusCheckRef.trim()}
          >
            {statusChecking ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Eye className="h-4 w-4 mr-2" />
            )}
            {statusChecking ? "Checking..." : "Check Status"}
          </Button>

          {statusResult && (
            <Alert
              className={`${statusResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}
            >
              {statusResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription
                className={
                  statusResult.success ? "text-green-800" : "text-red-800"
                }
              >
                <strong>{statusResult.message}</strong>
                {statusResult.data && (
                  <div className="mt-2">
                    <p className="text-sm">
                      Type: {statusResult.data.type}
                      <br />
                      Status: {statusResult.data.status}
                      <br />
                      Amount: R{statusResult.data.amount}
                      <br />
                      Created:{" "}
                      {new Date(statusResult.data.created_at).toLocaleString()}
                      {statusResult.data.reason && (
                        <>
                          <br />
                          Reason: {statusResult.data.reason}
                        </>
                      )}
                    </p>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Documentation */}
      <Card>
        <CardHeader>
          <CardTitle>Testing Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600 space-y-2">
            <p>
              <strong>System Health Check:</strong> Validates all payment system
              components including database tables, API endpoints, and
              configurations.
            </p>
            <p>
              <strong>Refund Testing:</strong> Tests the complete refund flow
              including Paystack API calls and database updates. Use actual
              order IDs from the system.
            </p>
            <p>
              <strong>Seller Payment:</strong> Tests seller payout processing.
              Requires orders in "delivered" or "completed" status.
            </p>
            <p>
              <strong>Status Check:</strong> Look up any payment or refund
              transaction by its reference ID to check current status.
            </p>
            <p className="text-red-600">
              <strong>Warning:</strong> Refund and payment tests will process
              real transactions in production. Use with caution!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPaystackTestingTab;

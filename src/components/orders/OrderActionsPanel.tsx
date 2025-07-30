import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  Calendar,
  CreditCard,
  RefreshCw,
  X,
  Clock,
  TruckIcon,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import OrderCancellationService, {
  Order,
  RescheduleQuote,
} from "@/services/orderCancellationService";

interface OrderActionsPanelProps {
  order: Order;
  userRole: "buyer" | "seller";
  onOrderUpdate: () => void;
}

const OrderActionsPanel: React.FC<OrderActionsPanelProps> = ({
  order,
  userRole,
  onOrderUpdate,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [rescheduleQuote, setRescheduleQuote] =
    useState<RescheduleQuote | null>(null);
  const [selectedRescheduleTime, setSelectedRescheduleTime] = useState("");
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  const canBuyerCancel =
    userRole === "buyer" &&
    order.status === "confirmed" &&
    order.delivery_status !== "picked_up" &&
    order.delivery_status !== "in_transit" &&
    order.delivery_status !== "delivered";

  const canSellerDecline = userRole === "seller" && order.status === "pending";

  const showMissedPickupActions =
    userRole === "seller" && order.delivery_status === "pickup_failed";

  const handleBuyerCancel = async () => {
    setIsLoading(true);
    try {
      const result = await OrderCancellationService.cancelDeliveryByBuyer(
        order.id,
        cancelReason,
      );

      if (result.success) {
        toast.success(result.message);
        setShowCancelDialog(false);
        onOrderUpdate();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to cancel order. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSellerDecline = async () => {
    setIsLoading(true);
    try {
      const result = await OrderCancellationService.declineCommitBySeller(
        order.id,
        cancelReason,
      );

      if (result.success) {
        toast.success(result.message);
        setShowCancelDialog(false);
        onOrderUpdate();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to decline order. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetRescheduleQuote = async () => {
    setIsLoading(true);
    try {
      const quote = await OrderCancellationService.getRescheduleQuote(order.id);
      if (quote) {
        setRescheduleQuote(quote);
        setShowRescheduleDialog(true);
      } else {
        toast.error("Unable to get reschedule quote. Please contact support.");
      }
    } catch (error) {
      toast.error("Failed to get reschedule quote.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReschedulePayment = async () => {
    if (!rescheduleQuote || !selectedRescheduleTime) {
      toast.error("Please select a reschedule time.");
      return;
    }

    setPaymentProcessing(true);
    try {
      // Initialize Paystack payment for reschedule fee
      // This would integrate with your existing payment system
      const paymentReference = `reschedule_${order.id}_${Date.now()}`;

      // Placeholder for Paystack integration
      toast.info("Payment processing...");

      // Simulate payment success for demo
      setTimeout(async () => {
        const result = await OrderCancellationService.reschedulePickup(
          order.id,
          selectedRescheduleTime,
          paymentReference,
        );

        if (result.success) {
          toast.success(result.message);
          setShowRescheduleDialog(false);
          onOrderUpdate();
        } else {
          toast.error(result.message);
        }
        setPaymentProcessing(false);
      }, 2000);
    } catch (error) {
      toast.error("Payment failed. Please try again.");
      setPaymentProcessing(false);
    }
  };

  const handleCancelAfterMissedPickup = async () => {
    setIsLoading(true);
    try {
      const result = await OrderCancellationService.cancelAfterMissedPickup(
        order.id,
        cancelReason,
      );

      if (result.success) {
        toast.success(result.message);
        setShowCancelDialog(false);
        onOrderUpdate();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to cancel order. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getOrderStatusBadge = () => {
    const statusConfig = {
      pending: { label: "Pending", color: "bg-yellow-500" },
      confirmed: { label: "Confirmed", color: "bg-blue-500" },
      cancelled_by_buyer: { label: "Cancelled by Buyer", color: "bg-red-500" },
      declined_by_seller: { label: "Declined by Seller", color: "bg-red-500" },
      cancelled_by_seller_after_missed_pickup: {
        label: "Cancelled by Seller",
        color: "bg-red-500",
      },
      delivered: { label: "Delivered", color: "bg-green-500" },
    };

    const config = statusConfig[order.status as keyof typeof statusConfig] || {
      label: order.status,
      color: "bg-gray-500",
    };

    return (
      <Badge className={`${config.color} text-white`}>{config.label}</Badge>
    );
  };

  const getDeliveryStatusBadge = () => {
    if (!order.delivery_status) return null;

    const statusConfig = {
      pending: { label: "Pickup Pending", color: "bg-yellow-500", icon: Clock },
      pickup_failed: {
        label: "Pickup Failed",
        color: "bg-red-500",
        icon: AlertTriangle,
      },
      rescheduled_by_seller: {
        label: "Rescheduled",
        color: "bg-blue-500",
        icon: Calendar,
      },
      picked_up: { label: "Picked Up", color: "bg-green-500", icon: TruckIcon },
      in_transit: {
        label: "In Transit",
        color: "bg-blue-500",
        icon: TruckIcon,
      },
      delivered: {
        label: "Delivered",
        color: "bg-green-500",
        icon: CheckCircle,
      },
    };

    const config =
      statusConfig[order.delivery_status as keyof typeof statusConfig];
    if (!config) return null;

    const IconComponent = config.icon;

    return (
      <Badge className={`${config.color} text-white flex items-center gap-1`}>
        <IconComponent className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Order Actions</span>
          <div className="flex gap-2">
            {getOrderStatusBadge()}
            {getDeliveryStatusBadge()}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Buyer Actions */}
        {canBuyerCancel && (
          <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
            <DialogTrigger asChild>
              <Button variant="destructive" className="w-full">
                <X className="w-4 h-4 mr-2" />
                Cancel Order
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cancel Order</DialogTitle>
                <DialogDescription>
                  Are you sure you want to cancel this order? You will receive a
                  full refund.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">
                    Reason (optional)
                  </label>
                  <Textarea
                    placeholder="Please let us know why you're cancelling..."
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowCancelDialog(false)}
                    className="flex-1"
                  >
                    Keep Order
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleBuyerCancel}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {isLoading ? "Cancelling..." : "Cancel Order"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Seller Decline */}
        {canSellerDecline && (
          <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
            <DialogTrigger asChild>
              <Button variant="destructive" className="w-full">
                <X className="w-4 h-4 mr-2" />
                Decline Order
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Decline Order</DialogTitle>
                <DialogDescription>
                  Are you sure you want to decline this order? The buyer will
                  receive a full refund.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">
                    Reason (optional)
                  </label>
                  <Textarea
                    placeholder="Please let the buyer know why you're declining..."
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowCancelDialog(false)}
                    className="flex-1"
                  >
                    Accept Order
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleSellerDecline}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {isLoading ? "Declining..." : "Decline Order"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Missed Pickup Actions */}
        {showMissedPickupActions && (
          <div className="space-y-3">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                The courier attempted pickup but you were unavailable. Please
                choose an action below.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button
                onClick={handleGetRescheduleQuote}
                disabled={isLoading}
                className="flex items-center justify-center"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reschedule Pickup
              </Button>

              <Dialog
                open={showCancelDialog}
                onOpenChange={setShowCancelDialog}
              >
                <DialogTrigger asChild>
                  <Button variant="destructive">
                    <X className="w-4 h-4 mr-2" />
                    Cancel Order
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Cancel Order</DialogTitle>
                    <DialogDescription>
                      Cancel this order after missing pickup. The buyer will
                      receive a full refund.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">
                        Reason (optional)
                      </label>
                      <Textarea
                        placeholder="Please explain why you're cancelling..."
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowCancelDialog(false)}
                        className="flex-1"
                      >
                        Keep Order
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleCancelAfterMissedPickup}
                        disabled={isLoading}
                        className="flex-1"
                      >
                        {isLoading ? "Cancelling..." : "Cancel Order"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        )}

        {/* Reschedule Dialog */}
        <Dialog
          open={showRescheduleDialog}
          onOpenChange={setShowRescheduleDialog}
        >
          <DialogContent className="w-[90vw] max-w-[90vw] sm:max-w-md mx-auto my-auto">
            <DialogHeader>
              <DialogTitle>Reschedule Pickup</DialogTitle>
              <DialogDescription>
                Choose a new pickup time. A reschedule fee will apply.
              </DialogDescription>
            </DialogHeader>

            {rescheduleQuote && (
              <div className="space-y-4">
                <Alert>
                  <CreditCard className="h-4 w-4" />
                  <AlertDescription>
                    <strong>
                      Reschedule Fee: R{rescheduleQuote.reschedule_fee}
                    </strong>
                    <br />
                    This fee covers the additional courier coordination costs.
                  </AlertDescription>
                </Alert>

                <div>
                  <label className="text-sm font-medium">
                    Select New Pickup Time
                  </label>
                  <Select
                    value={selectedRescheduleTime}
                    onValueChange={setSelectedRescheduleTime}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a time..." />
                    </SelectTrigger>
                    <SelectContent>
                      {rescheduleQuote.available_times.map((time) => (
                        <SelectItem key={time} value={time}>
                          {new Date(time).toLocaleDateString("en-ZA", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowRescheduleDialog(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleReschedulePayment}
                    disabled={!selectedRescheduleTime || paymentProcessing}
                    className="flex-1"
                  >
                    {paymentProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4 mr-2" />
                        Pay R{rescheduleQuote.reschedule_fee}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Order Information */}
        <div className="pt-4 border-t">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Book:</span>
              <p className="text-gray-600">{order.book?.title}</p>
            </div>
            <div>
              <span className="font-medium">Amount:</span>
              <p className="text-gray-600">R{order.total_amount}</p>
            </div>
            {order.pickup_scheduled_at && (
              <div className="col-span-2">
                <span className="font-medium">Pickup Scheduled:</span>
                <p className="text-gray-600">
                  {new Date(order.pickup_scheduled_at).toLocaleDateString(
                    "en-ZA",
                    {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    },
                  )}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderActionsPanel;

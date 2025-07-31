import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2, XCircle, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface OrderDeclineButtonProps {
  orderId: string;
  sellerId: string;
  bookTitle?: string;
  buyerName?: string;
  orderStatus?: string;
  onDeclineSuccess?: () => void;
  disabled?: boolean;
  className?: string;
}

const OrderDeclineButton: React.FC<OrderDeclineButtonProps> = ({
  orderId,
  sellerId,
  bookTitle = "this book",
  buyerName = "the buyer",
  orderStatus,
  onDeclineSuccess,
  disabled = false,
  className = "",
}) => {
  const [isDeclining, setIsDeclining] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState("");

  // Check if order can be declined
  const canDecline = orderStatus === "pending_commit";

  const handleDecline = async () => {
    if (!declineReason.trim()) {
      toast.error("Please provide a reason for declining");
      return;
    }

    setIsDeclining(true);

    try {
      console.log(
        `🚫 Declining order: ${orderId} with reason: ${declineReason}`,
      );

      // Call the decline-commit Supabase Edge Function
      const { data, error } = await supabase.functions.invoke(
        "decline-commit",
        {
          body: {
            order_id: orderId,
            seller_id: sellerId,
            reason: declineReason,
          },
        },
      );

      if (error) {
        console.error("Supabase function error:", {
          message: error?.message || 'Unknown error',
          code: error?.code || 'NO_CODE',
          details: error?.details || 'No details'
        });
        console.error("Error details:", {
          errorType: typeof error,
          dataReceived: data,
          timestamp: new Date().toISOString()
        });

        // More specific error handling for edge functions
        let errorMessage = "Failed to call decline function";
        if (error.message?.includes('FunctionsHttpError')) {
          errorMessage = "Edge Function service is unavailable. This feature requires proper Supabase setup.";
        } else if (error.message?.includes('CORS')) {
          errorMessage = "CORS error - Edge Function configuration issue";
        } else {
          errorMessage = error.message || errorMessage;
        }

        throw new Error(errorMessage);
      }

      if (!data?.success) {
        console.error("Decline function returned error:", data);
        throw new Error(data?.error || "Failed to decline order");
      }

      console.log("✅ Order declined successfully:", data);

      // Show success messages
      toast.success("Order declined successfully", {
        description: "The buyer has been notified and will receive a refund.",
        duration: 5000,
      });

      toast.info("Refund Processing", {
        description: `Refund of R${data.refund_amount} is being processed for the buyer.`,
        duration: 7000,
      });

      // Reset form and close dialog
      setDeclineReason("");
      setIsDialogOpen(false);

      // Call success callback
      onDeclineSuccess?.();
    } catch (error: unknown) {
      console.error("💥 Decline error:", error);

      let errorMessage = "Failed to decline order";
      const errorObj = error as Error;

      // Handle specific error messages
      if (errorObj.message?.includes("not found")) {
        errorMessage = "Order not found or cannot be declined";
        toast.error(errorMessage, {
          description: "Please check if the order is still in pending status.",
        });
      } else if (errorObj.message?.includes("not in pending")) {
        errorMessage = "Order is no longer in pending status";
        toast.error(errorMessage, {
          description: "Please refresh the page to see the latest status.",
        });
      } else {
        toast.error(errorMessage, {
          description:
            errorObj.message || "Please try again or contact support.",
          duration: 8000,
        });
      }
    } finally {
      setIsDeclining(false);
    }
  };

  // If order cannot be declined, show disabled state
  if (!canDecline) {
    return (
      <Button
        variant="outline"
        disabled
        className={`${className} cursor-not-allowed opacity-60`}
      >
        <XCircle className="w-4 h-4 mr-2 text-gray-400" />
        Cannot Decline
      </Button>
    );
  }

  return (
    <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          disabled={disabled || isDeclining}
          className={`${className}`}
        >
          {isDeclining ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Declining...
            </>
          ) : (
            <>
              <XCircle className="w-4 h-4 mr-2" />
              Decline Order
            </>
          )}
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent className="w-[90vw] max-w-[90vw] sm:max-w-md mx-auto my-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Decline Order
          </AlertDialogTitle>
          <div className="text-sm text-muted-foreground space-y-3">
            <p>
              You are about to decline the order for{" "}
              <strong>"{bookTitle}"</strong> from {buyerName}.
            </p>

            <div className="bg-red-50 p-3 rounded-lg border border-red-200">
              <h4 className="font-semibold text-red-800 mb-2">
                What happens when you decline:
              </h4>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• The buyer will be automatically refunded</li>
                <li>• Both you and the buyer will be notified by email</li>
                <li>• The order will be marked as declined</li>
                <li>• This action cannot be undone</li>
              </ul>
            </div>
          </div>
        </AlertDialogHeader>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="decline-reason">
              Reason for declining <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="decline-reason"
              placeholder="Please provide a reason for declining this order..."
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              className="min-h-[80px]"
              required
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={isDeclining}
            onClick={() => {
              setDeclineReason("");
              setIsDialogOpen(false);
            }}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDecline}
            disabled={isDeclining || !declineReason.trim()}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeclining ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Declining...
              </>
            ) : (
              "Decline Order"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default OrderDeclineButton;

// Hook for easier usage
export const useOrderDecline = () => {
  const [isDeclining, setIsDeclining] = useState(false);

  const declineOrder = async (
    orderId: string,
    sellerId: string,
    reason: string,
  ) => {
    setIsDeclining(true);

    try {
      const { data, error } = await supabase.functions.invoke(
        "decline-commit",
        {
          body: { order_id: orderId, seller_id: sellerId, reason },
        },
      );

      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || "Failed to decline");

      return { success: true, data };
    } catch (error: unknown) {
      const errorObj = error as Error;
      return { success: false, error: errorObj.message };
    } finally {
      setIsDeclining(false);
    }
  };

  return { declineOrder, isDeclining };
};

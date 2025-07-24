import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
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

interface OrderCommitButtonProps {
  orderId: string;
  sellerId: string;
  bookTitle?: string;
  buyerName?: string;
  orderStatus?: string;
  onCommitSuccess?: () => void;
  disabled?: boolean;
  className?: string;
}

const OrderCommitButton: React.FC<OrderCommitButtonProps> = ({
  orderId,
  sellerId,
  bookTitle = "this book",
  buyerName = "the buyer",
  orderStatus,
  onCommitSuccess,
  disabled = false,
  className = "",
}) => {
  const [isCommitting, setIsCommitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Check if order is already committed
  const isAlreadyCommitted =
    orderStatus === "committed" ||
    orderStatus === "courier_scheduled" ||
    orderStatus === "shipped";

  const handleCommit = async () => {
    setIsCommitting(true);
    setIsDialogOpen(false);

    try {
      console.log(`🚀 Committing to sale for order: ${orderId}`);

      // 🚀 CALL COMMIT-TO-SALE SUPABASE EDGE FUNCTION
      const { data, error } = await supabase.functions.invoke(
        "commit-to-sale",
        {
          body: {
            order_id: orderId,
            seller_id: sellerId,
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
        let errorMessage = "Failed to call commit function";
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
        console.error("Commit function returned error:", data);
        throw new Error(data?.error || "Failed to commit to sale");
      }

      console.log("✅ Commit successful:", data);

      // Show success messages with enhanced delivery info
      toast.success("✅ Order committed successfully!", {
        description:
          "🚚 Delivery/shipping processes have been triggered automatically!",
        duration: 5000,
      });

      toast.info(
        "📧 Courier pickup is being scheduled. Check your email for details.",
        {
          description:
            "You'll receive tracking information once the courier collects the book.",
          duration: 7000,
        },
      );

      toast.info(
        "🔄 Delivery automation started - this may take a few minutes to complete.",
        {
          duration: 5000,
        },
      );

      // Call success callback
      onCommitSuccess?.();
    } catch (error: unknown) {
      console.error("💥 Commit error:", error);

      let errorMessage = "Failed to commit to sale";
      const errorObj = error as Error;

      // Handle specific error messages
      if (errorObj.message?.includes("already committed")) {
        errorMessage = "This order has already been committed";
        toast.error(errorMessage, {
          description: "Please refresh the page to see the latest status.",
        });
      } else if (errorObj.message?.includes("not found")) {
        errorMessage = "Order not found or access denied";
        toast.error(errorMessage, {
          description:
            "Please check if you have permission to commit this order.",
        });
      } else {
        toast.error(errorMessage, {
          description:
            errorObj.message || "Please try again or contact support.",
          duration: 8000,
        });
      }
    } finally {
      setIsCommitting(false);
    }
  };

  // If already committed, show status
  if (isAlreadyCommitted) {
    return (
      <Button
        variant="outline"
        disabled
        className={`${className} cursor-not-allowed opacity-60`}
      >
        <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
        Already Committed
      </Button>
    );
  }

  return (
    <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="default"
          disabled={disabled || isCommitting}
          className={`${className} bg-green-600 hover:bg-green-700 text-white`}
        >
          {isCommitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Committing...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Commit to Sale
            </>
          )}
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            Confirm Sale Commitment
          </AlertDialogTitle>
          <AlertDialogDescription>
            You are about to commit to selling <strong>"{bookTitle}"</strong>{" "}
            to {buyerName}.
          </AlertDialogDescription>

          <div className="space-y-3 mt-4">
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2">
                What happens next:
              </h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Courier pickup will be automatically scheduled</li>
                <li>
                  • You'll receive pickup details and shipping label via email
                </li>
                <li>
                  • The buyer will be notified that their order is confirmed
                </li>
                <li>• You must be available during the pickup time window</li>
              </ul>
            </div>

            <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
              <p className="text-sm text-amber-700">
                <strong>Important:</strong> Once committed, you are obligated to
                fulfill this order. Failure to provide the book for pickup may
                result in penalties.
              </p>
            </div>
          </div>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isCommitting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleCommit}
            disabled={isCommitting}
            className="bg-green-600 hover:bg-green-700"
          >
            {isCommitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Committing...
              </>
            ) : (
              "Yes, Commit to Sale"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default OrderCommitButton;

// Hook for easier usage
export const useOrderCommit = () => {
  const [isCommitting, setIsCommitting] = useState(false);

  const commitToSale = async (orderId: string, sellerId: string) => {
    setIsCommitting(true);

    try {
      const { data, error } = await supabase.functions.invoke(
        "commit-to-sale",
        {
          body: { order_id: orderId, seller_id: sellerId },
        },
      );

      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || "Failed to commit");

      return { success: true, data };
    } catch (error: unknown) {
      const errorObj = error as Error;
      return { success: false, error: errorObj.message };
    } finally {
      setIsCommitting(false);
    }
  };

  return { commitToSale, isCommitting };
};

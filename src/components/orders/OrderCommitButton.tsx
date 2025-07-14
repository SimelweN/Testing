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

      // 🚀 HANDLE COMMIT DIRECTLY IN DATABASE
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          status: "committed",
          committed_at: new Date().toISOString(),
        })
        .eq("id", orderId)
        .eq("seller_id", sellerId)
        .eq("status", "pending_commit");

      if (updateError) {
        console.error("Database update error:", updateError);
        throw new Error(updateError.message || "Failed to update order status");
      }

      console.log("✅ Commit successful:", data);

      // Show success messages
      toast.success("✅ Order committed successfully!", {
        description: "Courier pickup will be scheduled automatically.",
        duration: 5000,
      });

      toast.info("📧 Check your email for pickup details and shipping label.", {
        duration: 7000,
      });

      // Call success callback
      onCommitSuccess?.();
    } catch (error: unknown) {
      console.error("💥 Commit error:", error);

      let errorMessage = "Failed to commit to sale";
      const errorObj = error as Error;

      // Handle specific error messages
      if (error.message?.includes("already committed")) {
        errorMessage = "This order has already been committed";
        toast.error(errorMessage, {
          description: "Please refresh the page to see the latest status.",
        });
      } else if (error.message?.includes("not found")) {
        errorMessage = "Order not found or access denied";
        toast.error(errorMessage, {
          description:
            "Please check if you have permission to commit this order.",
        });
      } else {
        toast.error(errorMessage, {
          description: error.message || "Please try again or contact support.",
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
          <AlertDialogDescription className="space-y-3">
            <p>
              You are about to commit to selling <strong>"{bookTitle}"</strong>{" "}
              to {buyerName}.
            </p>

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
          </AlertDialogDescription>
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
      const { error } = await supabase
        .from("orders")
        .update({
          status: "committed",
          committed_at: new Date().toISOString(),
        })
        .eq("id", orderId)
        .eq("seller_id", sellerId)
        .eq("status", "pending_commit");

      if (error) throw new Error(error.message);

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      setIsCommitting(false);
    }
  };

  return { commitToSale, isCommitting };
};

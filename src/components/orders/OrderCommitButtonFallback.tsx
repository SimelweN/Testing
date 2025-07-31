import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, CheckCircle, AlertCircle, Wifi, WifiOff } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import {
  fallbackService,
  useServiceStatus,
  type ServiceResponse,
} from "@/services/fallbackService";

interface OrderCommitButtonFallbackProps {
  orderId: string;
  sellerId: string;
  bookTitle?: string;
  buyerName?: string;
  orderStatus?: string;
  onCommitSuccess?: (response: ServiceResponse) => void;
  disabled?: boolean;
  className?: string;
  showServiceStatus?: boolean;
}

const OrderCommitButtonFallback: React.FC<OrderCommitButtonFallbackProps> = ({
  orderId,
  sellerId,
  bookTitle = "this book",
  buyerName = "the buyer",
  orderStatus,
  onCommitSuccess,
  disabled = false,
  className = "",
  showServiceStatus = false,
}) => {
  const [isCommitting, setIsCommitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { supabase, vercel, lastChecked } = useServiceStatus();

  // Check if order is already committed
  const isAlreadyCommitted =
    orderStatus === "committed" ||
    orderStatus === "courier_scheduled" ||
    orderStatus === "shipped";

  const handleCommit = async () => {
    setIsCommitting(true);
    setIsDialogOpen(false);

    try {
      console.log(
        `🚀 Committing to sale for order: ${orderId} using fallback service`,
      );

      // Use fallback service for commit-to-sale
      const response = await fallbackService.commitToSale({
        order_id: orderId,
        seller_id: sellerId,
      });

      if (!response.success) {
        throw new Error(response.error || "Failed to commit to sale");
      }

      console.log(
        "✅ Commit successful via",
        response.source,
        ":",
        response.data,
      );

      // Show success messages with service source info
      toast.success("✅ Order committed successfully!", {
        description: `Processed via ${response.source.toUpperCase()}${response.retryCount ? ` (retry ${response.retryCount})` : ""}`,
        duration: 5000,
      });

      toast.info("📧 Check your email for pickup details and shipping label.", {
        duration: 7000,
      });

      // Call success callback with full response
      onCommitSuccess?.(response);
    } catch (error: unknown) {
      const errorObj = error as Error;
      console.error("💥 Commit error:", error);

      let errorMessage = "Failed to commit to sale";

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
      } else if (errorObj.message?.includes("All service endpoints failed")) {
        errorMessage = "All services are currently unavailable";
        toast.error(errorMessage, {
          description:
            "Please try again later. Both Supabase and Vercel endpoints are down.",
          duration: 10000,
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

  // Service status indicator
  const getServiceStatusBadge = () => {
    if (!showServiceStatus) return null;

    const bothOnline = supabase && vercel;
    const bothOffline = !supabase && !vercel;

    return (
      <div className="flex items-center gap-1 mb-2">
        <Badge
          variant={
            bothOnline ? "default" : bothOffline ? "destructive" : "secondary"
          }
          className="text-xs"
        >
          {bothOnline ? (
            <>
              <Wifi className="w-3 h-3 mr-1" />
              All Services Online
            </>
          ) : bothOffline ? (
            <>
              <WifiOff className="w-3 h-3 mr-1" />
              Services Offline
            </>
          ) : (
            <>
              <Wifi className="w-3 h-3 mr-1" />
              {supabase ? "Supabase" : "Vercel"} Online
            </>
          )}
        </Badge>
      </div>
    );
  };

  // If already committed, show status
  if (isAlreadyCommitted) {
    return (
      <div>
        {getServiceStatusBadge()}
        <Button
          variant="outline"
          disabled
          className={`${className} cursor-not-allowed opacity-60`}
        >
          <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
          Already Committed
        </Button>
      </div>
    );
  }

  return (
    <div>
      {getServiceStatusBadge()}

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
            <div className="text-sm text-muted-foreground space-y-3">
              <p>
                You are about to commit to selling{" "}
                <strong>"{bookTitle}"</strong> to {buyerName}.
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

              {/* Service Status in Dialog */}
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-800 mb-2">
                  Service Status:
                </h4>
                <div className="flex gap-2 text-xs">
                  <Badge variant={supabase ? "default" : "destructive"}>
                    Supabase: {supabase ? "Online" : "Offline"}
                  </Badge>
                  <Badge variant={vercel ? "default" : "destructive"}>
                    Vercel: {vercel ? "Online" : "Offline"}
                  </Badge>
                </div>
                {(!supabase || !vercel) && (
                  <p className="text-xs text-gray-600 mt-1">
                    {!supabase && !vercel
                      ? "Both services are offline. The system will retry automatically."
                      : "Fallback service is available if the primary service fails."}
                  </p>
                )}
              </div>

              <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                <p className="text-sm text-amber-700">
                  <strong>Important:</strong> Once committed, you are obligated
                  to fulfill this order. Failure to provide the book for pickup
                  may result in penalties.
                </p>
              </div>
            </div>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCommitting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCommit}
              disabled={isCommitting || (!supabase && !vercel)}
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
    </div>
  );
};

export default OrderCommitButtonFallback;

// Hook for easier usage with fallback service
export const useOrderCommitFallback = () => {
  const [isCommitting, setIsCommitting] = useState(false);

  const commitToSale = async (
    orderId: string,
    sellerId: string,
  ): Promise<ServiceResponse> => {
    setIsCommitting(true);

    try {
      const response = await fallbackService.commitToSale({
        order_id: orderId,
        seller_id: sellerId,
      });

      return response;
    } finally {
      setIsCommitting(false);
    }
  };

  return { commitToSale, isCommitting };
};

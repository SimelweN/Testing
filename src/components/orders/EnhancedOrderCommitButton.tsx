import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  Home, 
  Package, 
  Clock, 
  DollarSign,
  Info,
  QrCode,
  MapPin
} from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import FallbackCommitService from "@/services/fallbackCommitService";
// import { lockerService, LockerLocation } from "@/services/lockerService"; // DISABLED - Locker functionality removed

interface EnhancedOrderCommitButtonProps {
  orderId: string;
  sellerId: string;
  bookTitle?: string;
  buyerName?: string;
  orderStatus?: string;
  onCommitSuccess?: () => void;
  disabled?: boolean;
  className?: string;
}

// DISABLED - Locker interfaces removed

const EnhancedOrderCommitButton: React.FC<EnhancedOrderCommitButtonProps> = ({
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
  const [deliveryMethod, setDeliveryMethod] = useState<"home">("home"); // DISABLED - Locker option removed
  // const [selectedLockerId, setSelectedLockerId] = useState<string>(""); // DISABLED
  // const [lockers, setLockers] = useState<LockerLocation[]>([]); // DISABLED
  // const [loadingLockers, setLoadingLockers] = useState(false); // DISABLED
  
  // Pre-commit checklist states
  const [isPackagedSecurely, setIsPackagedSecurely] = useState(false);
  const [canFulfillOrder, setCanFulfillOrder] = useState(false);

  // Check if order is already committed
  const isAlreadyCommitted =
    orderStatus === "committed" ||
    orderStatus === "courier_scheduled" ||
    orderStatus === "shipped";

  // Check if form is valid - SIMPLIFIED: Only home delivery available
  const isValidOrderStatus = !orderStatus || orderStatus === 'pending_commit';
  const isFormValid = isPackagedSecurely && canFulfillOrder && isValidOrderStatus;

  // DISABLED - Locker loading functionality removed
  // useEffect(() => {
  //   if (deliveryMethod === "locker" && lockers.length === 0) {
  //     loadLockers();
  //   }
  // }, [deliveryMethod]);

  // DISABLED - Locker loading function removed
  // const loadLockers = async () => { ... }

  const handleCommit = async () => {
    // Check order status before attempting commit
    if (orderStatus && orderStatus !== 'pending_commit') {
      console.error('❌ Cannot commit order with status:', orderStatus);
      toast.error(`Cannot commit order. Order status is "${orderStatus}" but should be "pending_commit"`);
      return;
    }

    setIsCommitting(true);
    setIsDialogOpen(false);

    try {
      console.log(`🚀 Committing to sale for order: ${orderId} with delivery method: ${deliveryMethod}, current status: ${orderStatus}`);

      // Prepare the commit data with delivery method
      const commitData = {
        order_id: orderId,
        seller_id: sellerId,
        delivery_method: deliveryMethod
        // DISABLED - Locker options removed
      };

      let data, error;

      // Try enhanced function first, fallback to original if it doesn't exist
      try {
        console.log("📞 Attempting enhanced-commit-to-sale function with data:", commitData);
        const result = await supabase.functions.invoke(
          "enhanced-commit-to-sale",
          {
            body: commitData,
          },
        );
        console.log("📄 Enhanced function response:", { data: result.data, error: result.error });
        data = result.data;
        error = result.error;
      } catch (enhancedError) {
        console.warn("⚠️ Enhanced function not available, trying original function:", enhancedError);

        try {
          // Fallback to original commit function with basic data
          const basicCommitData = {
            order_id: orderId,
            seller_id: sellerId,
          };

          const result = await supabase.functions.invoke(
            "commit-to-sale",
            {
              body: basicCommitData,
            },
          );
          data = result.data;
          error = result.error;

          // DISABLED - Locker-specific messaging removed
        } catch (originalError) {
          console.warn("⚠️ Original function also failed, using fallback service:", originalError);

          // Final fallback to direct database service
          const fallbackResult = await FallbackCommitService.commitToSale({
            order_id: orderId,
            seller_id: sellerId,
            delivery_method: deliveryMethod,
            // DISABLED - Locker ID removed
          });

          if (fallbackResult.success) {
            data = fallbackResult.data;
            error = null;

            toast.info("🔄 Using offline commit mode - some features may be limited", {
              duration: 5000,
            });
          } else {
            throw new Error(fallbackResult.error || "All commit methods failed");
          }
        }
      }

      if (error) {
        console.error("🚨 Supabase function error details:", {
          error,
          errorName: error.name,
          errorMessage: error.message,
          data,
          stack: error.stack
        });

        // More specific error handling for edge functions
        let errorMessage = "Failed to call commit function";

        // Handle FunctionsHttpError (non-2xx status codes)
        if (error.name === 'FunctionsHttpError' || error.message?.includes('non-2xx status code')) {
          console.log("🔍 FunctionsHttpError detected, response data:", data);

          // Try to extract the actual error from the edge function response
          if (data?.error) {
            errorMessage = data.error;
          } else if (data?.message) {
            errorMessage = data.message;
          } else if (typeof data === 'string') {
            errorMessage = data;
          } else {
            errorMessage = "Order commit failed. Please check order status and try again.";
            console.log("❓ No specific error message found in response data");
          }
        } else if (error.message?.includes('FunctionsFetchError')) {
          errorMessage = "Edge Function service is temporarily unavailable. Please try again.";
        } else if (error.message?.includes('CORS')) {
          errorMessage = "CORS error - Edge Function configuration issue";
        } else {
          errorMessage = error.message || errorMessage;
        }

        console.error("💥 Final error message to user:", errorMessage);
        throw new Error(errorMessage);
      }

      if (!data?.success) {
        console.error("Commit function returned error:", data);
        throw new Error(data?.error || "Failed to commit to sale");
      }

      console.log("✅ Commit successful:", data);

      // Show success message for home delivery
      toast.success("✅ Order committed with Home Pick-Up!", {
        description: "🚚 Courier pickup will be scheduled automatically.",
        duration: 5000,
      });

      toast.info(
        "📧 Courier pickup details sent to your email.",
        {
          duration: 7000,
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
          description: "Please check if you have permission to commit this order.",
        });
      } else if (errorObj.message?.includes("FunctionsFetchError") || errorObj.message?.includes("Edge Function")) {
        errorMessage = "Service temporarily unavailable";
        toast.error(errorMessage, {
          description: "The commit service is temporarily down. Please try again in a few minutes.",
          duration: 10000,
        });
      } else if (errorObj.message?.includes("Failed to send a request")) {
        errorMessage = "Network connection issue";
        toast.error(errorMessage, {
          description: "Please check your internet connection and try again.",
          duration: 8000,
        });
      } else {
        toast.error(errorMessage, {
          description: errorObj.message || "Please try again or contact support.",
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
          disabled={disabled || isCommitting || !isValidOrderStatus}
          className={`${className} ${isValidOrderStatus ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400'} text-white`}
          title={!isValidOrderStatus ? `Cannot commit: Order status is "${orderStatus}" (expected "pending_commit")` : undefined}
        >
          {isCommitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Committing...
            </>
          ) : !isValidOrderStatus ? (
            <>
              <AlertCircle className="w-4 h-4 mr-2" />
              Invalid Status ({orderStatus})
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Commit to Sale
            </>
          )}
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            Commit to Sale - Enhanced Options
          </AlertDialogTitle>
          <AlertDialogDescription>
            You are about to commit to selling <strong>"{bookTitle}"</strong> to {buyerName}.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-6 mt-4">
          {/* Pre-commit Checklist */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="w-5 h-5" />
                Pre-Commit Checklist
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <Checkbox 
                  id="packaged-securely"
                  checked={isPackagedSecurely}
                  onCheckedChange={(checked) => setIsPackagedSecurely(checked as boolean)}
                />
                <Label htmlFor="packaged-securely" className="text-sm leading-relaxed">
                  I confirm this item is packaged securely (e.g., padded envelope or sturdy box).
                </Label>
              </div>
              
              <div className="flex items-start space-x-3">
                <Checkbox 
                  id="can-fulfill"
                  checked={canFulfillOrder}
                  onCheckedChange={(checked) => setCanFulfillOrder(checked as boolean)}
                />
                <Label htmlFor="can-fulfill" className="text-sm leading-relaxed">
                  I commit to fulfilling this order and understand my obligations.
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Method Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Choose Delivery Method
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* SIMPLIFIED - Only home delivery available, locker functionality disabled */}
              <div className="space-y-4">
                <div className="flex items-start space-x-3 p-4 border rounded-lg bg-blue-50 border-blue-200">
                  <div className="flex-1">
                    <Label className="flex items-center gap-2 font-medium">
                      <Home className="w-4 h-4" />
                      Home Pick-Up (Courier Collection)
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Our courier will collect the book from your address at a scheduled time.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Standard Information */}
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">
              What happens after commitment:
            </h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Courier pickup will be automatically scheduled</li>
              <li>• You'll receive pickup details via email</li>
              <li>• You must be available during pickup time window</li>
              <li>• Standard payment processing timeline</li>
            </ul>
          </div>

          <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
            <p className="text-sm text-amber-700">
              <strong>Important:</strong> Once committed, you are obligated to fulfill this order. 
              Failure to complete the pickup may result in penalties.
            </p>
          </div>
        </div>

        <AlertDialogFooter className="mt-6">
          <AlertDialogCancel disabled={isCommitting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleCommit}
            disabled={isCommitting || !isFormValid}
            className="bg-green-600 hover:bg-green-700"
          >
            {isCommitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Committing...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 w-4 mr-2" />
                Commit with Home Pick-Up
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default EnhancedOrderCommitButton;

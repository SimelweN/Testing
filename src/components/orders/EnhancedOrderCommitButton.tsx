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
import { lockerService, LockerLocation } from "@/services/lockerService";

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

// Use LockerLocation from lockerService instead of custom Locker interface

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
  const [deliveryMethod, setDeliveryMethod] = useState<"home" | "locker">("home");
  const [selectedLockerId, setSelectedLockerId] = useState<string>("");
  const [lockers, setLockers] = useState<LockerLocation[]>([]);
  const [loadingLockers, setLoadingLockers] = useState(false);
  
  // Pre-commit checklist states
  const [isPackagedSecurely, setIsPackagedSecurely] = useState(false);
  const [canFulfillOrder, setCanFulfillOrder] = useState(false);

  // Check if order is already committed
  const isAlreadyCommitted =
    orderStatus === "committed" ||
    orderStatus === "courier_scheduled" ||
    orderStatus === "shipped";

  // Check if form is valid
  const isFormValid = isPackagedSecurely && canFulfillOrder && 
    (deliveryMethod === "home" || (deliveryMethod === "locker" && selectedLockerId));

  // Load lockers when locker delivery is selected
  useEffect(() => {
    if (deliveryMethod === "locker" && lockers.length === 0) {
      loadLockers();
    }
  }, [deliveryMethod]);

  const loadLockers = async () => {
    setLoadingLockers(true);
    try {
      console.log('🔄 Loading real PUDO locker locations...');
      const realLockers = await lockerService.getLockers();
      setLockers(realLockers);
      console.log(`✅ Loaded ${realLockers.length} real PUDO lockers for order commit`);
      
      // In production, this would be:
      /*
      const response = await fetch("https://api.pudo.co.za/lockers", {
        headers: { 
          "ApiKey": import.meta.env.VITE_COURIER_GUY_LOCKER_API_KEY 
        },
      });
      const data = await response.json();
      setLockers(data.lockers || []);
      */
      
    } catch (error) {
      console.error("Error loading lockers:", error);
      toast.error("Failed to load lockers. Please try again.");
    } finally {
      setLoadingLockers(false);
    }
  };

  const handleCommit = async () => {
    setIsCommitting(true);
    setIsDialogOpen(false);

    try {
      console.log(`🚀 Committing to sale for order: ${orderId} with delivery method: ${deliveryMethod}`);

      // Prepare the commit data with delivery method
      const commitData = {
        order_id: orderId,
        seller_id: sellerId,
        delivery_method: deliveryMethod,
        ...(deliveryMethod === "locker" && {
          locker_id: selectedLockerId,
          use_locker_api: true
        })
      };

      let data, error;

      // Try enhanced function first, fallback to original if it doesn't exist
      try {
        console.log("📞 Attempting enhanced-commit-to-sale function...");
        const result = await supabase.functions.invoke(
          "enhanced-commit-to-sale",
          {
            body: commitData,
          },
        );
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

          // Show a note about fallback mode
          if (deliveryMethod === "locker") {
            toast.info("🔄 Using standard commit process - enhanced locker features temporarily unavailable", {
              duration: 5000,
            });
          }
        } catch (originalError) {
          console.warn("⚠️ Original function also failed, using fallback service:", originalError);

          // Final fallback to direct database service
          const fallbackResult = await FallbackCommitService.commitToSale({
            order_id: orderId,
            seller_id: sellerId,
            delivery_method: deliveryMethod,
            locker_id: deliveryMethod === "locker" ? selectedLockerId : undefined,
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
        console.error("Supabase function error:", error);

        // More specific error handling for edge functions
        let errorMessage = "Failed to call commit function";
        if (error.message?.includes('FunctionsFetchError')) {
          errorMessage = "Edge Function service is temporarily unavailable. Please try again.";
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

      // Show success messages based on delivery method
      if (deliveryMethod === "locker") {
        toast.success("✅ Order committed with Locker Drop-Off!", {
          description: "🚀 Get paid 3 days earlier with locker delivery!",
          duration: 5000,
        });

        if (data.qrCode || data.waybill) {
          toast.info("📱 QR Code generated for locker drop-off", {
            description: "Check your email for the QR code and drop-off instructions.",
            duration: 7000,
          });
        }
      } else {
        toast.success("✅ Order committed with Home Pick-Up!", {
          description: "🚚 Courier pickup will be scheduled automatically.",
          duration: 5000,
        });
      }

      toast.info(
        deliveryMethod === "locker" 
          ? "📧 Locker drop-off instructions sent to your email."
          : "📧 Courier pickup details sent to your email.",
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
              <RadioGroup 
                value={deliveryMethod} 
                onValueChange={(value) => setDeliveryMethod(value as "home" | "locker")}
                className="space-y-4"
              >
                {/* Home Pick-Up Option */}
                <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50">
                  <RadioGroupItem value="home" id="home-pickup" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="home-pickup" className="flex items-center gap-2 font-medium cursor-pointer">
                      <Home className="w-4 h-4" />
                      Home Pick-Up (Standard)
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Courier will collect from your address. Traditional pickup service.
                    </p>
                  </div>
                </div>

                {/* Locker Drop-Off Option */}
                <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 relative">
                  <RadioGroupItem value="locker" id="locker-dropoff" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="locker-dropoff" className="flex items-center gap-2 font-medium cursor-pointer">
                      <Package className="w-4 h-4" />
                      Locker Drop-Off 
                      <Badge className="bg-green-100 text-green-800 text-xs">
                        💰 3 Days Earlier Payment
                      </Badge>
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Drop off at a secure locker location. Faster and more reliable.
                    </p>
                    
                    {/* Incentive Info */}
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                      <div className="flex items-start gap-2">
                        <DollarSign className="w-4 h-4 text-green-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-green-800">
                            Get paid 3 days earlier when using locker drop-off.
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            <Info className="w-3 h-3 text-green-600" />
                            <p className="text-xs text-green-700">
                              Locker shipments are faster and more reliable. Payments are processed earlier.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </RadioGroup>

              {/* Locker Selection */}
              {deliveryMethod === "locker" && (
                <div className="mt-4 p-4 border rounded-lg bg-blue-50">
                  <Label className="text-sm font-medium mb-2 block">
                    Select a Locker Location
                  </Label>
                  
                  {loadingLockers ? (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading locker locations...
                    </div>
                  ) : (
                    <Select 
                      value={selectedLockerId} 
                      onValueChange={setSelectedLockerId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a locker near you" />
                      </SelectTrigger>
                      <SelectContent>
                        {lockers.map((locker) => (
                          <SelectItem key={locker.id} value={locker.id}>
                            <div className="text-left">
                              <div className="font-medium">{locker.name}</div>
                              <div className="text-sm text-gray-600">
                                {locker.city} • {locker.operatingHours}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  
                  {selectedLockerId && (
                    <div className="mt-3 p-3 bg-white border rounded text-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <QrCode className="w-4 h-4 text-blue-600" />
                        <span className="font-medium">What happens next:</span>
                      </div>
                      <ul className="text-gray-700 space-y-1 ml-6">
                        <li>• You'll receive a QR code and drop-off instructions via email</li>
                        <li>• Drop off your package at the selected locker using the QR code</li>
                        <li>• Payment will be processed 3 days earlier than standard pickup</li>
                        <li>• Tracking updates will be sent automatically</li>
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Standard Information */}
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">
              What happens after commitment:
            </h4>
            <ul className="text-sm text-blue-700 space-y-1">
              {deliveryMethod === "locker" ? (
                <>
                  <li>• QR code and drop-off instructions sent to your email</li>
                  <li>• Drop off at selected locker within 24 hours</li>
                  <li>• Automatic tracking and buyer notifications</li>
                  <li>• Payment processed 3 days earlier than standard</li>
                </>
              ) : (
                <>
                  <li>• Courier pickup will be automatically scheduled</li>
                  <li>• You'll receive pickup details via email</li>
                  <li>• You must be available during pickup time window</li>
                  <li>• Standard payment processing timeline</li>
                </>
              )}
            </ul>
          </div>

          <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
            <p className="text-sm text-amber-700">
              <strong>Important:</strong> Once committed, you are obligated to fulfill this order. 
              Failure to complete the {deliveryMethod === "locker" ? "drop-off" : "pickup"} may result in penalties.
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
                {deliveryMethod === "locker" ? "Commit with Locker Drop-Off" : "Commit with Home Pick-Up"}
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default EnhancedOrderCommitButton;

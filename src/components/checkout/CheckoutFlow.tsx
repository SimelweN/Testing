import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { EnhancedPurchaseEmailService } from "@/services/enhancedPurchaseEmailService";
import {
  CheckoutState,
  CheckoutBook,
  CheckoutAddress,
  DeliveryOption,
  OrderSummary,
  OrderConfirmation,
} from "@/types/checkout";
import {
  getSellerDeliveryAddress,
  getSimpleUserAddresses,
} from "@/services/simplifiedAddressService";
import {
  validateCheckoutStart,
  getSellerCheckoutData,
  getBuyerCheckoutData,
} from "@/services/checkoutValidationService";
import { supabase } from "@/integrations/supabase/client";
import Step1OrderSummary from "./Step1OrderSummary";
import Step2DeliveryOptions from "./Step2DeliveryOptions";
import Step3Payment from "./Step3Payment";
import Step4Confirmation from "./Step4Confirmation";
import AddressInput from "./AddressInput";
import { toast } from "sonner";

interface CheckoutFlowProps {
  book: CheckoutBook;
}

const CheckoutFlow: React.FC<CheckoutFlowProps> = ({ book }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { removeFromCart, removeFromSellerCart } = useCart();

  const [checkoutState, setCheckoutState] = useState<CheckoutState>({
    step: { current: 1, completed: [] },
    book,
    buyer_address: null,
    seller_address: null,
    delivery_options: [],
    selected_delivery: null,
    order_summary: null,
    loading: true,
    error: null,
  });

  const [orderConfirmation, setOrderConfirmation] =
    useState<OrderConfirmation | null>(null);

  useEffect(() => {
    initializeCheckout();
  }, [book.id, user?.id]);

  const initializeCheckout = async () => {
    if (!user?.id) {
      setCheckoutState((prev) => ({
        ...prev,
        error: "Please log in to continue",
        loading: false,
      }));
      return;
    }

    try {
      setCheckoutState((prev) => ({ ...prev, loading: true, error: null }));

      console.log("🚀 Using book table seller data for checkout...");

      // Get fresh book data with seller information from books table
      const { data: bookData, error: bookError } = await supabase
        .from("books")
        .select("*")
        .eq("id", book.id)
        .single();

      if (bookError || !bookData) {
        throw new Error("Failed to load book details");
      }

      // Get seller profile separately
      const { data: sellerProfile, error: sellerError } = await supabase
        .from("profiles")
        .select("id, name, email")
        .eq("id", bookData.seller_id)
        .single();

      if (sellerError) {
        console.warn("Could not fetch seller profile:", sellerError);
      }

      // Check if book has seller_subaccount_code, otherwise fall back to seller profile
      let sellerSubaccountCode = bookData.seller_subaccount_code;

      if (!sellerSubaccountCode) {
        // Fallback: check seller's profile for subaccount
        const { data: sellerProfile, error: sellerProfileError } = await supabase
          .from("profiles")
          .select("subaccount_code")
          .eq("id", bookData.seller_id)
          .single();

        if (sellerProfileError || !sellerProfile?.subaccount_code) {
          throw new Error(
            "Seller payment setup is incomplete. The seller needs to set up their banking details.",
          );
        }

        sellerSubaccountCode = sellerProfile.subaccount_code;

        // Update the book with the subaccount code for future purchases
        await supabase
          .from("books")
          .update({ seller_subaccount_code: sellerSubaccountCode })
          .eq("id", bookData.id);
      }

      // Get seller address from profile (since book table columns don't exist yet)
      const { data: sellerProfileData, error: sellerProfileError } =
        await supabase
          .from("profiles")
          .select("pickup_address")
          .eq("id", bookData.seller_id)
          .single();

      if (sellerProfileError || !sellerProfileData?.pickup_address) {
        throw new Error(
          "Seller address is incomplete. The seller needs to update their pickup address.",
        );
      }

      const pickupAddress = sellerProfileData.pickup_address as any;
      const sellerAddress = {
        street: pickupAddress.streetAddress || pickupAddress.street || "",
        city: pickupAddress.city || "",
        province: pickupAddress.province || "",
        postal_code:
          pickupAddress.postalCode || pickupAddress.postal_code || "",
        country: "South Africa",
      };

      if (
        !sellerAddress.street ||
        !sellerAddress.city ||
        !sellerAddress.province ||
        !sellerAddress.postal_code
      ) {
        throw new Error(
          "Seller address is incomplete. The seller needs to update their pickup address.",
        );
      }

      // Update book with complete seller data
      const updatedBook = {
        ...book,
        seller_subaccount_code: sellerSubaccountCode,
        seller: {
          id: sellerProfile?.id || bookData.seller_id,
          name: sellerProfile?.name || "Seller",
          email: sellerProfile?.email || "",
          hasAddress: true,
          hasSubaccount: true,
          isReadyForOrders: true,
        },
      };

      // Get buyer address (optional initially)
      const buyerData = await getBuyerCheckoutData(user.id).catch(() => null);

      console.log("📦 Checkout data loaded from books table:", {
        seller_address: sellerAddress,
        buyer_data: buyerData,
        book: updatedBook,
      });

      setCheckoutState((prev) => ({
        ...prev,
        book: updatedBook,
        seller_address: sellerAddress,
        buyer_address: buyerData?.address || null,
        loading: false,
      }));

      if (!buyerData) {
        toast.info(
          "Please add your delivery address to continue with checkout",
        );
      }
    } catch (error) {
      console.error("❌ Checkout initialization error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to initialize checkout";
      setCheckoutState((prev) => ({
        ...prev,
        error: errorMessage,
        loading: false,
      }));
      toast.error(errorMessage);
    }
  };

  const goToStep = (step: 1 | 2 | 3 | 4) => {
    setCheckoutState((prev) => ({
      ...prev,
      step: {
        current: step,
        completed: prev.step.completed.includes(step - 1)
          ? prev.step.completed
          : [...prev.step.completed, step - 1].filter((s) => s > 0),
      },
    }));
  };

  const handleDeliverySelection = (delivery: DeliveryOption) => {
    if (!checkoutState.buyer_address) {
      toast.error("Please set your delivery address first");
      return;
    }

    const orderSummary: OrderSummary = {
      book: checkoutState.book!,
      delivery,
      buyer_address: checkoutState.buyer_address,
      seller_address: checkoutState.seller_address!,
      book_price: checkoutState.book!.price,
      delivery_price: delivery.price,
      total_price: checkoutState.book!.price + delivery.price,
    };

    setCheckoutState((prev) => ({
      ...prev,
      selected_delivery: delivery,
      order_summary: orderSummary,
    }));

    goToStep(3);
  };

  const handlePaymentSuccess = async (orderData: OrderConfirmation) => {
    setOrderConfirmation(orderData);

    // Remove book from cart after successful purchase
    // This fixes the bug where books remain in cart after Buy Now purchase
    try {
      // Remove from legacy cart
      removeFromCart(book.id);

      // Also remove from seller carts if it exists there
      if (book.seller?.id) {
        removeFromSellerCart(book.seller.id, book.id);
      }

      console.log("✅ Book removed from cart after successful purchase:", book.id);
    } catch (error) {
      console.warn("Failed to remove book from cart after purchase:", error);
      // Don't block the checkout success flow if cart removal fails
    }

    // 📧 GUARANTEED EMAIL FALLBACK SYSTEM
    // Send purchase confirmation emails with multiple fallback layers
    try {
      console.log("📧 Triggering guaranteed purchase emails...");

      const purchaseEmailData = {
        orderId: orderData.orderId || book.id,
        bookId: book.id,
        bookTitle: book.title,
        bookPrice: book.price,
        sellerName: book.seller?.name || "Seller",
        sellerEmail: book.seller?.email || "",
        buyerName: user?.name || "Buyer",
        buyerEmail: user?.email || "",
        orderTotal: orderData.totalAmount || book.price,
        orderDate: new Date().toISOString()
      };

      // Use enhanced email service with guaranteed fallbacks
      const emailResult = await EnhancedPurchaseEmailService.sendPurchaseEmailsWithFallback(purchaseEmailData);

      console.log("📧 Purchase email result:", emailResult);

      // Show user feedback about email status
      if (emailResult.sellerEmailSent && emailResult.buyerEmailSent) {
        toast.success("📧 Confirmation emails sent to all parties");
      } else {
        toast.info("📧 Confirmation emails are being processed", {
          description: "You'll receive your receipt shortly via our backup system."
        });
      }

    } catch (emailError) {
      console.error("⚠️ Purchase email system failed:", emailError);
      // Don't block checkout completion if emails fail
      toast.warning("📧 Emails are being processed manually", {
        description: "Your purchase is complete but notifications may be delayed."
      });
    }

    goToStep(4);
  };

    const handlePaymentError = (error: string) => {
    const errorMessage = typeof error === 'string' ? error : String(error || 'Unknown error');
    const safeMessage = errorMessage === '[object Object]' ? 'Payment processing failed' : errorMessage;
    toast.error(`Payment failed: ${safeMessage}`);
    setCheckoutState((prev) => ({
      ...prev,
      error: "Payment failed. Please try again.",
    }));
  };

  const handleViewOrders = () => {
    navigate("/activity");
  };

  const handleContinueShopping = () => {
    navigate("/books");
  };

  const handleCancelCheckout = () => {
    // Navigate back to the book details page
    navigate(`/book/${book.id}`);
  };

  const handleAddressSubmit = (address: CheckoutAddress) => {
    setCheckoutState((prev) => ({
      ...prev,
      buyer_address: address,
    }));
    toast.success("Address saved! Loading delivery options...");
  };

  const handleSaveAddressToProfile = async (address: CheckoutAddress) => {
    if (!user?.id) return;

    try {
      const { saveSimpleUserAddresses } = await import(
        "@/services/simplifiedAddressService"
      );

      const simpleAddress = {
        streetAddress: address.street,
        city: address.city,
        province: address.province,
        postalCode: address.postal_code,
        additional_info: address.additional_info,
      };

      await saveSimpleUserAddresses(
        user.id,
        simpleAddress, // Use as pickup address
        simpleAddress, // Use as shipping address
        true, // Addresses are the same
      );

      toast.success("Address saved to your profile!");
    } catch (error) {
      console.error("Failed to save address to profile:", error);
      toast.error(
        "Failed to save address to profile, but proceeding with order",
      );
    }
  };

  const getProgressValue = () => {
    switch (checkoutState.step.current) {
      case 1:
        return 25;
      case 2:
        return 50;
      case 3:
        return 75;
      case 4:
        return 100;
      default:
        return 0;
    }
  };

  const getStepTitle = () => {
    switch (checkoutState.step.current) {
      case 1:
        return "Order Summary";
      case 2:
        return "Delivery Options";
      case 3:
        return "Payment";
      case 4:
        return "Confirmation";
      default:
        return "Checkout";
    }
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto mt-4 sm:mt-8 px-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm sm:text-base">
            Please log in to continue with your purchase.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (checkoutState.loading) {
    return (
      <div className="max-w-2xl mx-auto mt-4 sm:mt-8 px-4">
        <div className="text-center">
          <div className="animate-spin w-6 h-6 sm:w-8 sm:h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm sm:text-base">Initializing checkout...</p>
        </div>
      </div>
    );
  }

  if (checkoutState.error) {
    return (
      <div className="max-w-2xl mx-auto mt-4 sm:mt-8 px-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm sm:text-base">{checkoutState.error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress Bar */}
        <div className="mb-6 sm:mb-8">
          <div className="text-center mb-3 sm:mb-4">
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900 px-2">
              <span className="hidden sm:inline">Step {checkoutState.step.current}: {getStepTitle()}</span>
              <span className="sm:hidden">{getStepTitle()}</span>
            </h1>
          </div>
          <Progress value={getProgressValue()} className="h-2 mx-2 sm:mx-0" />
          <div className="flex justify-between mt-2 text-xs sm:text-sm text-gray-500 px-2 sm:px-0">
            <span className="text-center flex-1">Summary</span>
            <span className="text-center flex-1">Delivery</span>
            <span className="text-center flex-1">Payment</span>
            <span className="text-center flex-1">Complete</span>
          </div>
        </div>

        {/* Step Content */}
        {checkoutState.step.current === 1 && (
          <Step1OrderSummary
            book={checkoutState.book!}
            sellerAddress={checkoutState.seller_address}
            onNext={() => goToStep(2)}
            onCancel={handleCancelCheckout}
            loading={checkoutState.loading}
          />
        )}

        {checkoutState.step.current === 2 &&
          checkoutState.buyer_address &&
          checkoutState.seller_address && (
            <Step2DeliveryOptions
              buyerAddress={checkoutState.buyer_address}
              sellerAddress={checkoutState.seller_address}
              onSelectDelivery={handleDeliverySelection}
              onBack={() => goToStep(1)}
              onCancel={handleCancelCheckout}
              selectedDelivery={checkoutState.selected_delivery}
            />
          )}

        {checkoutState.step.current === 2 && !checkoutState.buyer_address && (
          <AddressInput
            title="Enter Your Delivery Address"
            onAddressSubmit={handleAddressSubmit}
            onSaveToProfile={handleSaveAddressToProfile}
            loading={checkoutState.loading}
          />
        )}

        {checkoutState.step.current === 3 && checkoutState.order_summary && (
          <Step3Payment
            orderSummary={checkoutState.order_summary}
            onBack={() => goToStep(2)}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentError={handlePaymentError}
            userId={user.id}
          />
        )}

        {checkoutState.step.current === 4 && orderConfirmation && (
          <Step4Confirmation
            orderData={orderConfirmation}
            onViewOrders={handleViewOrders}
            onContinueShopping={handleContinueShopping}
          />
        )}
      </div>
    </div>
  );
};

export default CheckoutFlow;

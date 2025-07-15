import React, { useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useRobustCheckout } from "@/hooks/useRobustCheckout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  ArrowRight,
  CreditCard,
  MapPin,
  Package,
  Truck,
  Shield,
  CheckCircle,
  Clock,
  User,
  Edit,
  Loader2,
  Info,
  AlertTriangle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import SimpleAddressInput from "@/components/SimpleAddressInput";
import PaystackPaymentButtonFixed from "@/components/banking/PaystackPaymentButtonFixed";
import SaleSuccessPopup from "@/components/SaleSuccessPopup";
import CommitReminderModal from "@/components/CommitReminderModal";
import { currencyUtils } from "@/types/checkout";
import type { CheckoutAddress } from "@/types/checkout";

const CheckoutRobust = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { clearCart } = useCart();

  const isCartCheckout = id === "cart";
  const cartData = location.state?.cartItems || [];

  // ✅ FIXED: Use robust checkout hook
  const {
    currentStep,
    completedSteps,
    items,
    buyerAddress,
    deliveryQuotes,
    selectedDelivery,
    orderSummary,
    loading,
    error,
    validation,
    goToStep,
    nextStep,
    previousStep,
    canProceedToStep,
    setBuyerAddress,
    setSelectedDelivery,
    processPaymentSuccess,
  } = useRobustCheckout({
    bookId: id && id !== "cart" ? id : undefined,
    cartItems: cartData,
    isCartCheckout,
  });

  // Local UI state
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [showSalePopup, setShowSalePopup] = useState(false);
  const [showCommitReminderModal, setShowCommitReminderModal] = useState(false);
  const [saleData, setSaleData] = useState<any>(null);

  const steps = [
    { id: "items", label: "Review Items", icon: Package },
    { id: "shipping", label: "Shipping Address", icon: MapPin },
    { id: "delivery", label: "Delivery Options", icon: Truck },
    { id: "payment", label: "Payment", icon: CreditCard },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  // ✅ FIXED: Handle payment success with comprehensive error handling
  const handlePaymentSuccess = async (reference: string) => {
    try {
      const result = await processPaymentSuccess(reference);

      if (result.success) {
        setSaleData(result.saleData);
        setShowCommitReminderModal(true);

        // Clear cart if it was a cart checkout
        if (isCartCheckout) {
          clearCart();
        }
      } else {
        toast.error(result.error || "Failed to process payment success");
      }
    } catch (error) {
      console.error("Payment success handling error:", error);
      toast.error(
        "Payment successful but there was an issue processing your order",
      );
    }
  };

  // ✅ FIXED: Handle address updates with validation
  const handleAddressUpdate = (addressData: any) => {
    const newAddress: CheckoutAddress = {
      street: addressData.street,
      city: addressData.city,
      province: addressData.province,
      postalCode: addressData.postalCode,
      country: addressData.country || "South Africa",
    };

    setBuyerAddress(newAddress);
    setIsEditingAddress(false);
    toast.success("Shipping address updated");
  };

  // Loading state
  if (loading.initialization) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-book-600" />
              <p className="text-gray-600">Loading checkout...</p>
              <p className="text-xs text-gray-400 mt-2">
                Initializing secure checkout process...
              </p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Error state
  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-red-900 mb-2">
                Checkout Error
              </h2>
              <p className="text-red-700 mb-6">{error}</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => navigate("/books")} variant="outline">
                  Browse Books
                </Button>
                <Button onClick={() => navigate(-1)}>Go Back</Button>
                <Button
                  onClick={() => window.location.reload()}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            onClick={() => navigate(-1)}
            variant="ghost"
            className="mb-4 text-book-600 hover:text-book-700"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Secure Checkout
              </h1>
              <p className="text-gray-600 mt-1">
                {items.length} {items.length === 1 ? "item" : "items"} • Total:{" "}
                {orderSummary
                  ? currencyUtils.formatRands(orderSummary.totalAmount)
                  : "Calculating..."}
              </p>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="text-sm">
                {isCartCheckout ? "Cart Checkout" : "Single Item"}
              </Badge>
              <Badge
                variant="outline"
                className="text-sm bg-green-50 text-green-700"
              >
                SSL Secured
              </Badge>
            </div>
          </div>

          {/* Validation Warnings */}
          {validation.warnings.length > 0 && (
            <Alert className="mb-4 border-yellow-200 bg-yellow-50">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <strong>Please note:</strong>
                <ul className="mt-1 list-disc list-inside">
                  {validation.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Progress Steps */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              {steps.map((stepItem, index) => {
                const Icon = stepItem.icon;
                const isActive = stepItem.id === currentStep;
                const isCompleted = completedSteps.includes(stepItem.id as any);
                const canAccess =
                  isCompleted ||
                  isActive ||
                  canProceedToStep(stepItem.id as any);

                return (
                  <div key={stepItem.id} className="flex items-center">
                    <div
                      className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200 ${
                        canAccess ? "cursor-pointer" : "cursor-not-allowed"
                      } ${
                        isCompleted
                          ? "bg-green-600 border-green-600 text-white shadow-md"
                          : isActive
                            ? "bg-book-600 border-book-600 text-white shadow-md"
                            : canAccess
                              ? "bg-gray-100 border-gray-300 text-gray-600 hover:border-book-400"
                              : "bg-gray-50 border-gray-200 text-gray-400"
                      }`}
                      onClick={() => {
                        if (canAccess) {
                          goToStep(stepItem.id as any);
                        }
                      }}
                    >
                      {isCompleted ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                    </div>
                    <div className="ml-3 hidden sm:block">
                      <p
                        className={`text-sm font-medium ${
                          isActive
                            ? "text-book-600"
                            : isCompleted
                              ? "text-green-600"
                              : canAccess
                                ? "text-gray-600"
                                : "text-gray-400"
                        }`}
                      >
                        {stepItem.label}
                      </p>
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={`hidden sm:block w-20 h-0.5 mx-4 transition-colors duration-200 ${
                          isCompleted ? "bg-green-600" : "bg-gray-300"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  {(() => {
                    const stepItem = steps.find((s) => s.id === currentStep);
                    const Icon = stepItem?.icon || Package;
                    return (
                      <>
                        <Icon className="h-5 w-5 text-book-600" />
                        {stepItem?.label}
                      </>
                    );
                  })()}
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Items Step */}
                {currentStep === "items" && (
                  <div className="space-y-4">
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        Review your items before proceeding to shipping address.
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-4">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="w-16 h-20 object-cover rounded"
                          />
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">
                              {item.title}
                            </h3>
                            <p className="text-gray-600">by {item.author}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="secondary">
                                {item.condition}
                              </Badge>
                              <Badge variant="outline">{item.category}</Badge>
                              {item.seller.banking_verified && (
                                <Badge
                                  variant="outline"
                                  className="text-green-600 border-green-200"
                                >
                                  <Shield className="h-3 w-3 mr-1" />
                                  Verified Seller
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1 mt-2 text-sm text-gray-500">
                              <User className="h-3 w-3" />
                              Sold by {item.seller.name}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-book-600">
                              {currencyUtils.formatRands(item.price)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Shipping Step */}
                {currentStep === "shipping" && (
                  <div className="space-y-6">
                    <Alert>
                      <MapPin className="h-4 w-4" />
                      <AlertDescription>
                        Provide your shipping address for accurate delivery
                        calculations.
                      </AlertDescription>
                    </Alert>

                    {buyerAddress && !isEditingAddress ? (
                      <Card className="bg-green-50 border-green-200">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-green-900 mb-2">
                                Shipping Address
                              </h3>
                              <p className="text-green-800">
                                {buyerAddress.street}
                                <br />
                                {buyerAddress.city}, {buyerAddress.province}
                                <br />
                                {buyerAddress.postalCode}
                                <br />
                                {buyerAddress.country}
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setIsEditingAddress(true)}
                              className="border-green-300 text-green-700 hover:bg-green-100"
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <div>
                        <h3 className="text-lg font-semibold mb-4">
                          {buyerAddress
                            ? "Edit Shipping Address"
                            : "Add Shipping Address"}
                        </h3>
                        <SimpleAddressInput
                          label="Shipping Address"
                          required
                          onAddressSelect={handleAddressUpdate}
                          defaultValue={buyerAddress || undefined}
                        />
                        {isEditingAddress && (
                          <Button
                            variant="outline"
                            onClick={() => setIsEditingAddress(false)}
                            className="mt-4"
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Delivery Step */}
                {currentStep === "delivery" && (
                  <div className="space-y-6">
                    <Alert>
                      <Truck className="h-4 w-4" />
                      <AlertDescription>
                        Choose your preferred delivery option. Prices include
                        tracking and insurance.
                      </AlertDescription>
                    </Alert>

                    {loading.deliveryQuotes ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mr-3 text-book-600" />
                        <span>Getting delivery quotes...</span>
                      </div>
                    ) : deliveryQuotes.length > 0 ? (
                      <div className="space-y-3">
                        {deliveryQuotes.map((quote, index) => (
                          <Card
                            key={`${quote.courier}-${quote.serviceName}-${index}`}
                            className={`cursor-pointer transition-all ${
                              selectedDelivery?.courier === quote.courier &&
                              selectedDelivery?.serviceName ===
                                quote.serviceName
                                ? "border-book-600 bg-book-50 shadow-md"
                                : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                            }`}
                            onClick={() => setSelectedDelivery(quote)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div
                                    className={`w-4 h-4 rounded-full border-2 transition-colors ${
                                      selectedDelivery?.courier ===
                                        quote.courier &&
                                      selectedDelivery?.serviceName ===
                                        quote.serviceName
                                        ? "border-book-600 bg-book-600"
                                        : "border-gray-300"
                                    }`}
                                  />
                                  <div>
                                    <h3 className="font-semibold">
                                      {quote.serviceName}
                                    </h3>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                      <Clock className="h-3 w-3" />
                                      {quote.estimatedDays} business days
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-xl font-bold text-book-600">
                                    {currencyUtils.formatRands(quote.price)}
                                  </p>
                                  <p className="text-xs text-gray-500 capitalize">
                                    {quote.courier}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <Card className="border-yellow-200 bg-yellow-50">
                        <CardContent className="p-6 text-center">
                          <Truck className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
                          <h3 className="font-semibold text-yellow-900 mb-2">
                            No Delivery Options Available
                          </h3>
                          <p className="text-yellow-700">
                            We couldn't find delivery options for your address.
                            Please check your address or contact support.
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                {/* Payment Step */}
                {currentStep === "payment" && (
                  <div className="space-y-6">
                    <Alert>
                      <Shield className="h-4 w-4" />
                      <AlertDescription>
                        Your payment is secure and encrypted. Funds are
                        automatically split between seller and platform.
                      </AlertDescription>
                    </Alert>

                    {orderSummary && (
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h3 className="font-semibold mb-4">Payment Summary</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span>
                              Books ({items.length}{" "}
                              {items.length === 1 ? "item" : "items"})
                            </span>
                            <span>
                              {currencyUtils.formatRands(orderSummary.subtotal)}
                            </span>
                          </div>
                          {orderSummary.deliveryFee > 0 && (
                            <div className="flex justify-between">
                              <span>
                                Delivery ({selectedDelivery?.serviceName})
                              </span>
                              <span>
                                {currencyUtils.formatRands(
                                  orderSummary.deliveryFee,
                                )}
                              </span>
                            </div>
                          )}
                          <Separator />
                          <div className="flex justify-between text-lg font-bold">
                            <span>Total</span>
                            <span>
                              {currencyUtils.formatRands(
                                orderSummary.totalAmount,
                              )}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-2">
                            <p>
                              Platform fee:{" "}
                              {currencyUtils.formatRands(
                                orderSummary.platformFee,
                              )}{" "}
                              (10%)
                            </p>
                            <p>
                              Seller receives:{" "}
                              {currencyUtils.formatRands(
                                orderSummary.sellerAmount,
                              )}{" "}
                              (90%)
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Payment Button */}
                    {items.length > 0 &&
                      buyerAddress &&
                      selectedDelivery &&
                      items[0]?.seller?.id &&
                      orderSummary && (
                        <PaystackPaymentButtonFixed
                          amount={currencyUtils.randsToKobo(
                            orderSummary.totalAmount,
                          )}
                          bookIds={items.map((item) => item.id)}
                          sellerId={items[0].seller.id}
                          shippingAddress={{
                            street: buyerAddress.street,
                            city: buyerAddress.city,
                            state: buyerAddress.province,
                            postal_code: buyerAddress.postalCode,
                            country: buyerAddress.country,
                          }}
                          deliveryMethod="delivery"
                          deliveryFee={currencyUtils.randsToKobo(
                            orderSummary.deliveryFee,
                          )}
                          onSuccess={handlePaymentSuccess}
                          onError={(error) => {
                            toast.error(`Payment failed: ${error}`);
                          }}
                          onCancel={() => {
                            toast.error("Payment was cancelled");
                          }}
                          disabled={loading.payment}
                          className="w-full bg-book-600 hover:bg-book-700 text-lg py-6"
                        >
                          {loading.payment ? (
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          ) : (
                            <CreditCard className="mr-2 h-5 w-5" />
                          )}
                          {loading.payment
                            ? "Processing..."
                            : `Pay ${currencyUtils.formatRands(orderSummary.totalAmount)}`}
                        </PaystackPaymentButtonFixed>
                      )}
                  </div>
                )}

                {/* Confirmation Step */}
                {currentStep === "confirmation" && (
                  <div className="text-center py-8">
                    <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-green-900 mb-2">
                      Order Confirmed!
                    </h2>
                    <p className="text-green-700 mb-6">
                      Thank you for your purchase. You'll receive a confirmation
                      email shortly.
                    </p>
                    <div className="flex gap-4 justify-center">
                      <Button
                        onClick={() => navigate("/profile")}
                        variant="outline"
                      >
                        View Orders
                      </Button>
                      <Button onClick={() => navigate("/books")}>
                        Continue Shopping
                      </Button>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                {currentStep !== "confirmation" && (
                  <div className="flex justify-between pt-6 border-t">
                    <Button
                      variant="outline"
                      onClick={previousStep}
                      disabled={currentStepIndex === 0}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Previous
                    </Button>

                    {currentStep !== "payment" && (
                      <Button
                        onClick={nextStep}
                        disabled={
                          !canProceedToStep(
                            steps[currentStepIndex + 1]?.id as any,
                          )
                        }
                        className="bg-book-600 hover:bg-book-700"
                      >
                        Next
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-book-600" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Items Preview */}
                <div className="space-y-3">
                  {items.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-12 h-16 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {item.title}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          by {item.author}
                        </p>
                        <p className="text-sm font-semibold text-book-600">
                          {currencyUtils.formatRands(item.price)}
                        </p>
                      </div>
                    </div>
                  ))}
                  {items.length > 3 && (
                    <p className="text-sm text-gray-500 text-center">
                      and {items.length - 3} more{" "}
                      {items.length - 3 === 1 ? "item" : "items"}
                    </p>
                  )}
                </div>

                <Separator />

                {/* Totals */}
                {orderSummary && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>
                        {currencyUtils.formatRands(orderSummary.subtotal)}
                      </span>
                    </div>
                    {orderSummary.deliveryFee > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Delivery</span>
                        <span>
                          {currencyUtils.formatRands(orderSummary.deliveryFee)}
                        </span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>
                        {currencyUtils.formatRands(orderSummary.totalAmount)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Shipping Address Preview */}
                {buyerAddress && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        Shipping To
                      </h4>
                      <p className="text-xs text-gray-600">
                        {buyerAddress.street}
                        <br />
                        {buyerAddress.city}, {buyerAddress.province}
                        <br />
                        {buyerAddress.postalCode}
                      </p>
                    </div>
                  </>
                )}

                {/* Delivery Preview */}
                {selectedDelivery && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                        <Truck className="h-3 w-3" />
                        Delivery Method
                      </h4>
                      <p className="text-xs text-gray-600">
                        {selectedDelivery.serviceName}
                        <br />
                        Estimated: {selectedDelivery.estimatedDays} business
                        days
                      </p>
                    </div>
                  </>
                )}

                {/* Security Info */}
                <Separator />
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-xs text-gray-500 mb-2">
                    <Shield className="h-3 w-3" />
                    <span>Secured by Paystack</span>
                  </div>
                  <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
                    <Lock className="h-3 w-3" />
                    <span>256-bit SSL encryption</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Success Modals */}
      {saleData && (
        <SaleSuccessPopup
          isOpen={showSalePopup}
          onClose={() => {
            setShowSalePopup(false);
            setSaleData(null);
            navigate("/profile");
          }}
          bookTitle={saleData.bookTitle}
          bookPrice={saleData.bookPrice}
          buyerName={saleData.buyerName}
          buyerEmail={saleData.buyerEmail}
          saleId={saleData.saleId}
        />
      )}

      <CommitReminderModal
        isOpen={showCommitReminderModal}
        onClose={() => {
          setShowCommitReminderModal(false);
          setShowSalePopup(true);
        }}
      />
    </Layout>
  );
};

export default CheckoutRobust;

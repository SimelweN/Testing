import React from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useEnhancedCheckout } from "@/hooks/useEnhancedCheckout";
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
import PaystackPaymentButton from "@/components/banking/PaystackPaymentButton";
import SaleSuccessPopup from "@/components/SaleSuccessPopup";
import CommitReminderModal from "@/components/CommitReminderModal";

const EnhancedCheckout = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { clearCart } = useCart();

  const isCartCheckout = id === "cart";
  const cartData = location.state?.cartItems || [];

  const {
    // State
    step,
    items,
    buyer_address,
    delivery_options,
    selected_delivery,
    order_summary,
    loading,
    error,
    validation,

    // Actions
    goToStep,
    nextStep,
    previousStep,
    canProceedToStep,
    setBuyerAddress,
    setSelectedDelivery,
    processPaymentSuccess,
  } = useEnhancedCheckout({
    bookId: id,
    cartItems: cartData,
    isCartCheckout,
  });

  const [isEditingAddress, setIsEditingAddress] = React.useState(false);
  const [showSalePopup, setShowSalePopup] = React.useState(false);
  const [showCommitReminderModal, setShowCommitReminderModal] =
    React.useState(false);
  const [saleData, setSaleData] = React.useState<any>(null);

  const steps = [
    { id: "items", label: "Review Items", icon: Package },
    { id: "shipping", label: "Shipping Address", icon: MapPin },
    { id: "delivery", label: "Delivery Options", icon: Truck },
    { id: "payment", label: "Payment", icon: CreditCard },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === step.current);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

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
      }
    } catch (error) {
      console.error("Payment success handling error:", error);
    }
  };

  const handleAddressUpdate = (addressData: any) => {
    setBuyerAddress({
      street: addressData.street,
      city: addressData.city,
      province: addressData.province,
      postalCode: addressData.postalCode,
      country: addressData.country,
    });
    setIsEditingAddress(false);
  };

  if (loading.checkout) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-book-600" />
              <p className="text-gray-600">Loading checkout...</p>
              <p className="text-xs text-gray-400 mt-2">
                Debug: bookId={id}, cartItems={cartData.length}, user={user?.id}
              </p>
              {/* Fallback link */}
              <div className="mt-4">
                <Button
                  variant="outline"
                  onClick={() => navigate(`/checkout-old/${id}`)}
                  className="text-xs"
                >
                  Use Simple Checkout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

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
                Enhanced Checkout
              </h1>
              <p className="text-gray-600 mt-1">
                {items.length} {items.length === 1 ? "item" : "items"} • Total:
                R{order_summary?.totalAmount.toFixed(2) || "0.00"}
              </p>
            </div>
            <Badge variant="outline" className="text-sm">
              {isCartCheckout ? "Cart Checkout" : "Single Item"}
            </Badge>
          </div>

          {/* Validation Warnings */}
          {validation.warnings.length > 0 && (
            <Alert className="mb-4 border-yellow-200 bg-yellow-50">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <strong>Warnings:</strong>
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
                const isActive = stepItem.id === step.current;
                const isCompleted = step.completed.includes(stepItem.id as any);

                return (
                  <div key={stepItem.id} className="flex items-center">
                    <div
                      className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors cursor-pointer ${
                        isCompleted
                          ? "bg-green-600 border-green-600 text-white"
                          : isActive
                            ? "bg-book-600 border-book-600 text-white"
                            : "bg-gray-100 border-gray-300 text-gray-400"
                      }`}
                      onClick={() => {
                        if (isCompleted || isActive) {
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
                              : "text-gray-500"
                        }`}
                      >
                        {stepItem.label}
                      </p>
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={`hidden sm:block w-20 h-0.5 mx-4 ${
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
                    const stepItem = steps.find((s) => s.id === step.current);
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
                {step.current === "items" && (
                  <div className="space-y-4">
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        Review your items before proceeding to shipping.
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
                              R{item.price.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Shipping Step */}
                {step.current === "shipping" && (
                  <div className="space-y-6">
                    <Alert>
                      <MapPin className="h-4 w-4" />
                      <AlertDescription>
                        Provide your shipping address for delivery calculations.
                      </AlertDescription>
                    </Alert>

                    {buyer_address && !isEditingAddress ? (
                      <Card className="bg-green-50 border-green-200">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-green-900 mb-2">
                                Shipping Address
                              </h3>
                              <p className="text-green-800">
                                {buyer_address.street}
                                <br />
                                {buyer_address.city}, {buyer_address.province}
                                <br />
                                {buyer_address.postalCode}
                                <br />
                                {buyer_address.country}
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
                          {buyer_address
                            ? "Edit Shipping Address"
                            : "Add Shipping Address"}
                        </h3>
                        <SimpleAddressInput
                          label="Shipping Address"
                          required
                          onAddressSelect={handleAddressUpdate}
                          defaultValue={buyer_address || undefined}
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
                {step.current === "delivery" && (
                  <div className="space-y-6">
                    <Alert>
                      <Truck className="h-4 w-4" />
                      <AlertDescription>
                        Choose your preferred delivery option and estimated
                        timeline.
                      </AlertDescription>
                    </Alert>

                    {loading.quotes ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mr-3 text-book-600" />
                        <span>Getting delivery quotes...</span>
                      </div>
                    ) : delivery_options.length > 0 ? (
                      <div className="space-y-3">
                        {delivery_options.map((quote, index) => (
                          <Card
                            key={`${quote.courier}-${quote.serviceName}-${index}`}
                            className={`cursor-pointer transition-all ${
                              selected_delivery?.courier === quote.courier &&
                              selected_delivery?.serviceName ===
                                quote.serviceName
                                ? "border-book-600 bg-book-50"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                            onClick={() => setSelectedDelivery(quote)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div
                                    className={`w-4 h-4 rounded-full border-2 transition-colors ${
                                      selected_delivery?.courier ===
                                        quote.courier &&
                                      selected_delivery?.serviceName ===
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
                                      {quote.estimatedDays} days delivery
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-xl font-bold text-book-600">
                                    R{quote.price.toFixed(2)}
                                  </p>
                                  <p className="text-xs text-gray-500">
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
                {step.current === "payment" && (
                  <div className="space-y-6">
                    <Alert>
                      <Shield className="h-4 w-4" />
                      <AlertDescription>
                        Your payment is secure and encrypted. Split payments
                        automatically route funds to sellers.
                      </AlertDescription>
                    </Alert>

                    {order_summary && (
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h3 className="font-semibold mb-4">Payment Summary</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span>
                              Subtotal ({items.length}{" "}
                              {items.length === 1 ? "item" : "items"})
                            </span>
                            <span>R{order_summary.subtotal.toFixed(2)}</span>
                          </div>
                          {order_summary.deliveryFee > 0 && (
                            <div className="flex justify-between">
                              <span>
                                Delivery ({selected_delivery?.serviceName})
                              </span>
                              <span>
                                R{order_summary.deliveryFee.toFixed(2)}
                              </span>
                            </div>
                          )}
                          <Separator />
                          <div className="flex justify-between text-lg font-bold">
                            <span>Total</span>
                            <span>R{order_summary.totalAmount.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Payment Button */}
                    {items.length > 0 &&
                      buyer_address &&
                      selected_delivery &&
                      items[0]?.seller?.id &&
                      order_summary && (
                        <PaystackPaymentButton
                          amount={Math.round(order_summary.totalAmount * 100)}
                          bookIds={items.map((item) => item.id)}
                          sellerId={items[0].seller.id}
                          shippingAddress={{
                            street: buyer_address.street,
                            city: buyer_address.city,
                            state: buyer_address.province,
                            postal_code: buyer_address.postalCode,
                            country: buyer_address.country,
                          }}
                          deliveryMethod="delivery"
                          deliveryFee={order_summary.deliveryFee * 100}
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
                            : `Pay R${order_summary.totalAmount.toFixed(2)}`}
                        </PaystackPaymentButton>
                      )}
                  </div>
                )}

                {/* Confirmation Step */}
                {step.current === "confirmation" && (
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
                {step.current !== "confirmation" && (
                  <div className="flex justify-between pt-6 border-t">
                    <Button
                      variant="outline"
                      onClick={previousStep}
                      disabled={currentStepIndex === 0}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Previous
                    </Button>

                    {step.current !== "payment" && (
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
                          R{item.price.toFixed(2)}
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
                {order_summary && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>R{order_summary.subtotal.toFixed(2)}</span>
                    </div>
                    {order_summary.deliveryFee > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Delivery</span>
                        <span>R{order_summary.deliveryFee.toFixed(2)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>R{order_summary.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                {/* Shipping Address Preview */}
                {buyer_address && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        Shipping To
                      </h4>
                      <p className="text-xs text-gray-600">
                        {buyer_address.street}
                        <br />
                        {buyer_address.city}, {buyer_address.province}
                        <br />
                        {buyer_address.postalCode}
                      </p>
                    </div>
                  </>
                )}

                {/* Delivery Preview */}
                {selected_delivery && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                        <Truck className="h-3 w-3" />
                        Delivery Method
                      </h4>
                      <p className="text-xs text-gray-600">
                        {selected_delivery.serviceName}
                        <br />
                        Estimated: {selected_delivery.estimatedDays} days
                      </p>
                    </div>
                  </>
                )}
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

export default EnhancedCheckout;

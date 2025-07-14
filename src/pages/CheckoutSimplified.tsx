import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { getBookById } from "@/services/book/bookQueries";
import { getUserAddresses } from "@/services/addressService";
import { getSellerPickupAddress } from "@/services/addressService";
import { getDeliveryQuotes, DeliveryQuote } from "@/services/deliveryService";
import { createSaleCommitment } from "@/services/commitmentService";
import { Book } from "@/types/book";
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
  CheckCircle,
  User,
  Edit,
  Plus,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import SimpleAddressInput from "@/components/SimpleAddressInput";
import PaystackPaymentButton from "@/components/banking/PaystackPaymentButton";
import SaleSuccessPopup from "@/components/SaleSuccessPopup";
import CheckoutSteps from "@/components/checkout/CheckoutSteps";
import CheckoutSummary from "@/components/checkout/CheckoutSummary";

interface CheckoutAddress {
  street: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
}

interface CheckoutItem {
  id: string;
  title: string;
  author: string;
  price: number;
  condition: string;
  category: string;
  imageUrl: string;
  seller: {
    id: string;
    name: string;
    email: string;
  };
}

type CheckoutStep = "items" | "shipping" | "delivery" | "payment";

// Simplified state management
interface CheckoutState {
  step: CheckoutStep;
  items: CheckoutItem[];
  shippingAddress: CheckoutAddress | null;
  selectedDelivery: DeliveryQuote | null;
  deliveryOptions: DeliveryQuote[];
  error: string | null;
  isProcessing: boolean;
  showSuccess: boolean;
}

const initialState: CheckoutState = {
  step: "items",
  items: [],
  shippingAddress: null,
  selectedDelivery: null,
  deliveryOptions: [],
  error: null,
  isProcessing: false,
  showSuccess: false,
};

const CheckoutSimplified = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items: cartItems, clearCart } = useCart();

  // Single state object to reduce complexity
  const [state, setState] = useState<CheckoutState>(initialState);
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [isEditingAddress, setIsEditingAddress] = useState(false);

  const isCartCheckout = id === "cart";
  const cartData = location.state?.cartItems || [];

  // Computed values
  const subtotal = useMemo(() => {
    return state.items.reduce((total, item) => total + (item.price || 0), 0);
  }, [state.items]);

  const deliveryFee = state.selectedDelivery?.price || 0;
  const totalAmount = subtotal + deliveryFee;

  const steps = [
    { id: "items", label: "Review Items", icon: Package },
    { id: "shipping", label: "Shipping Address", icon: MapPin },
    { id: "delivery", label: "Delivery Options", icon: Truck },
    { id: "payment", label: "Payment", icon: CreditCard },
  ];

  const currentStepIndex = steps.findIndex((step) => step.id === state.step);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  // Simplified state update function
  const updateState = useCallback((updates: Partial<CheckoutState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  // Error handler
  const handleError = useCallback(
    (error: any, message = "An error occurred") => {
      console.error("Checkout error:", error);
      const errorMessage = error instanceof Error ? error.message : message;
      updateState({ error: errorMessage, isProcessing: false });
      toast.error(errorMessage);
    },
    [updateState],
  );

  // Initialize checkout - simplified version
  useEffect(() => {
    const initializeCheckout = async () => {
      if (!user?.id) {
        toast.error("Please log in to complete your purchase");
        navigate("/login");
        return;
      }

      updateState({ isProcessing: true, error: null });

      try {
        let checkoutItems: CheckoutItem[] = [];

        if (isCartCheckout) {
          // Use cart data
          checkoutItems = cartData.map((item: any) => ({
            id: item.id,
            title: item.title,
            author: item.author,
            price: item.price,
            condition: item.condition,
            category: item.category,
            imageUrl: item.frontCover || item.imageUrl,
            seller: item.seller || { id: "", name: "Unknown", email: "" },
          }));
        } else if (id) {
          // Fetch single book
          const book = await getBookById(id);
          if (!book) throw new Error("Book not found");
          if (book.sold) throw new Error("This book has already been sold");
          if (book.seller?.id === user.id)
            throw new Error("You cannot purchase your own book");

          checkoutItems = [
            {
              id: book.id,
              title: book.title,
              author: book.author,
              price: book.price,
              condition: book.condition,
              category: book.category,
              imageUrl: book.frontCover || book.imageUrl,
              seller: book.seller || { id: "", name: "Unknown", email: "" },
            },
          ];
        }

        if (checkoutItems.length === 0) {
          throw new Error("No items to checkout");
        }

        // Load saved addresses
        try {
          const addresses = await getUserAddresses(user.id);
          setSavedAddresses(addresses || []);

          // Auto-select first address if available
          if (addresses && addresses.length > 0) {
            const firstAddress = addresses[0];
            updateState({
              items: checkoutItems,
              shippingAddress: {
                street: firstAddress.street,
                city: firstAddress.city,
                province: firstAddress.province,
                postalCode: firstAddress.postal_code,
                country: firstAddress.country || "South Africa",
              },
              isProcessing: false,
            });
          } else {
            updateState({ items: checkoutItems, isProcessing: false });
          }
        } catch (addressError) {
          // Don't fail for address loading issues
          console.warn("Could not load addresses:", addressError);
          updateState({ items: checkoutItems, isProcessing: false });
        }
      } catch (error) {
        handleError(error, "Failed to initialize checkout");
      }
    };

    initializeCheckout();
  }, [id, user?.id, navigate, isCartCheckout, cartData]);

  // Load delivery quotes when address is set and on delivery step
  const loadDeliveryQuotes = useCallback(async () => {
    if (!state.shippingAddress || state.step !== "delivery") return;

    updateState({ isProcessing: true });

    try {
      // Get seller addresses
      const sellerAddresses = await Promise.all(
        state.items.map(async (item) => {
          try {
            const sellerAddr = await getSellerPickupAddress(item.seller.id);
            return (
              sellerAddr || {
                street: "Default Business Address",
                city: "Johannesburg",
                province: "Gauteng",
                postalCode: "2196",
              }
            );
          } catch {
            return {
              street: "Default Business Address",
              city: "Johannesburg",
              province: "Gauteng",
              postalCode: "2196",
            };
          }
        }),
      );

      // Get delivery quotes
      const quotes = await Promise.all(
        sellerAddresses.map(async (pickupAddr) => {
          try {
            return await getDeliveryQuotes(pickupAddr, state.shippingAddress!);
          } catch {
            return []; // Return empty array if quotes fail
          }
        }),
      );

      // Flatten and deduplicate quotes
      const allQuotes = quotes.flat();
      const uniqueQuotes = allQuotes.filter(
        (quote, index, self) =>
          index ===
          self.findIndex(
            (q) => q.service === quote.service && q.courier === quote.courier,
          ),
      );

      updateState({
        deliveryOptions: uniqueQuotes,
        isProcessing: false,
      });

      if (uniqueQuotes.length === 0) {
        toast.warning(
          "No delivery options available. Please check your address.",
        );
      }
    } catch (error) {
      handleError(error, "Failed to load delivery options");
    }
  }, [state.shippingAddress, state.step, state.items]);

  // Load delivery quotes when step changes to delivery
  useEffect(() => {
    if (state.step === "delivery" && state.shippingAddress) {
      loadDeliveryQuotes();
    }
  }, [state.step, loadDeliveryQuotes]);

  // Navigation functions
  const goToNextStep = () => {
    const nextIndex = Math.min(currentStepIndex + 1, steps.length - 1);
    updateState({ step: steps[nextIndex].id as CheckoutStep });
  };

  const goToPreviousStep = () => {
    const prevIndex = Math.max(currentStepIndex - 1, 0);
    updateState({ step: steps[prevIndex].id as CheckoutStep });
  };

  // Step validation
  const isStepValid = () => {
    switch (state.step) {
      case "items":
        return state.items.length > 0;
      case "shipping":
        return state.shippingAddress !== null;
      case "delivery":
        return state.selectedDelivery !== null;
      case "payment":
        return (
          state.selectedDelivery !== null && state.shippingAddress !== null
        );
      default:
        return false;
    }
  };

  // Address selection handler
  const handleAddressSelect = (address: any) => {
    updateState({
      shippingAddress: {
        street: address.street,
        city: address.city,
        province: address.province,
        postalCode: address.postal_code,
        country: address.country || "South Africa",
      },
    });
    setIsEditingAddress(false);
  };

  // Payment success handler
  const handlePaymentSuccess = async (paymentData: any) => {
    updateState({ isProcessing: true });

    try {
      // Create sale commitment
      const saleData = await createSaleCommitment({
        items: state.items,
        shippingAddress: state.shippingAddress!,
        deliveryOption: state.selectedDelivery!,
        paymentData,
        totalAmount,
      });

      // Clear cart if this was a cart checkout
      if (isCartCheckout) {
        clearCart();
      }

      updateState({
        showSuccess: true,
        isProcessing: false,
      });

      toast.success("Purchase completed successfully!");
    } catch (error) {
      handleError(
        error,
        "Payment succeeded but order processing failed. Please contact support.",
      );
    }
  };

  // Render loading state
  if (state.isProcessing && state.items.length === 0) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-book-600" />
              <p className="text-gray-600">Loading checkout...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Render error state
  if (state.error && state.items.length === 0) {
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
              <p className="text-red-700 mb-6">{state.error}</p>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Checkout</h1>
          <p className="text-gray-600">Complete your purchase</p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <CheckoutSteps currentStep={state.step} />
          <Progress value={progress} className="mt-4" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Error Alert */}
            {state.error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            )}

            {/* Step Content */}
            {state.step === "items" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Package className="mr-2 h-5 w-5" />
                    Review Items ({state.items.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {state.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-4 p-4 border rounded-lg"
                    >
                      <img
                        src={item.imageUrl || "/placeholder.svg"}
                        alt={item.title}
                        className="w-16 h-20 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold">{item.title}</h3>
                        <p className="text-sm text-gray-600">
                          by {item.author}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary">{item.condition}</Badge>
                          <Badge variant="outline">{item.category}</Badge>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-sm text-gray-600">
                            Sold by: {item.seller.name}
                          </p>
                          <p className="font-bold text-lg">R{item.price}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {state.step === "shipping" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="mr-2 h-5 w-5" />
                    Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditingAddress ? (
                    <SimpleAddressInput
                      onAddressSubmit={handleAddressSelect}
                      onCancel={() => setIsEditingAddress(false)}
                    />
                  ) : (
                    <div className="space-y-4">
                      {state.shippingAddress ? (
                        <div className="p-4 border rounded-lg bg-green-50 border-green-200">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium">
                                {state.shippingAddress.street}
                              </p>
                              <p className="text-sm text-gray-600">
                                {state.shippingAddress.city},{" "}
                                {state.shippingAddress.province}{" "}
                                {state.shippingAddress.postalCode}
                              </p>
                              <p className="text-sm text-gray-600">
                                {state.shippingAddress.country}
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setIsEditingAddress(true)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Add Shipping Address
                          </h3>
                          <p className="text-gray-600 mb-4">
                            Choose from saved addresses or add a new one
                          </p>
                          <Button onClick={() => setIsEditingAddress(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Address
                          </Button>
                        </div>
                      )}

                      {/* Saved Addresses */}
                      {savedAddresses.length > 0 && !isEditingAddress && (
                        <div>
                          <h4 className="font-medium mb-3">Saved Addresses</h4>
                          <div className="space-y-2">
                            {savedAddresses.map((address) => (
                              <div
                                key={address.id}
                                className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                                onClick={() => handleAddressSelect(address)}
                              >
                                <p className="font-medium">{address.street}</p>
                                <p className="text-sm text-gray-600">
                                  {address.city}, {address.province}{" "}
                                  {address.postal_code}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {state.step === "delivery" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Truck className="mr-2 h-5 w-5" />
                    Delivery Options
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {state.isProcessing ? (
                    <div className="text-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-book-600" />
                      <p className="text-gray-600">
                        Loading delivery options...
                      </p>
                    </div>
                  ) : state.deliveryOptions.length > 0 ? (
                    <div className="space-y-3">
                      {state.deliveryOptions.map((option, index) => (
                        <div
                          key={index}
                          className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                            state.selectedDelivery?.service === option.service
                              ? "border-book-600 bg-book-50"
                              : "border-gray-200 hover:bg-gray-50"
                          }`}
                          onClick={() =>
                            updateState({ selectedDelivery: option })
                          }
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">{option.service}</h4>
                              <p className="text-sm text-gray-600">
                                {option.courier} • {option.estimatedDays} days
                              </p>
                            </div>
                            <p className="font-bold">R{option.price}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No delivery options available
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Please check your shipping address and try again
                      </p>
                      <Button onClick={loadDeliveryQuotes} variant="outline">
                        Retry
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {state.step === "payment" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="mr-2 h-5 w-5" />
                    Payment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Order Summary */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium mb-3">Order Summary</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Subtotal ({state.items.length} items)</span>
                          <span>R{subtotal}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>
                            Delivery ({state.selectedDelivery?.service})
                          </span>
                          <span>R{deliveryFee}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-bold">
                          <span>Total</span>
                          <span>R{totalAmount}</span>
                        </div>
                      </div>
                    </div>

                    {/* Payment Button */}
                    <PaystackPaymentButton
                      amount={totalAmount}
                      onSuccess={handlePaymentSuccess}
                      disabled={state.isProcessing}
                      className="w-full"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Navigation */}
            <div className="flex justify-between">
              <Button
                onClick={goToPreviousStep}
                variant="outline"
                disabled={currentStepIndex === 0 || state.isProcessing}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>

              {state.step !== "payment" && (
                <Button
                  onClick={goToNextStep}
                  disabled={!isStepValid() || state.isProcessing}
                >
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <CheckoutSummary
              items={state.items}
              shippingAddress={state.shippingAddress}
              selectedDelivery={state.selectedDelivery}
              subtotal={subtotal}
              deliveryFee={deliveryFee}
              totalAmount={totalAmount}
              currentStep={state.step}
            />
          </div>
        </div>

        {/* Success Modal */}
        {state.showSuccess && (
          <SaleSuccessPopup
            isOpen={state.showSuccess}
            onClose={() => {
              updateState({ showSuccess: false });
              navigate("/profile");
            }}
            saleData={{
              items: state.items,
              totalAmount,
              shippingAddress: state.shippingAddress,
            }}
          />
        )}
      </div>
    </Layout>
  );
};

export default CheckoutSimplified;

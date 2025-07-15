import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/lib/supabase";
import { getBookById } from "@/services/book/bookQueries";
import { getUserAddresses } from "@/services/addressService";
import {
  RealCourierPricing,
  CourierQuote,
  Address as CourierAddress,
} from "@/services/realCourierPricing";
import { createSaleCommitment } from "@/services/commitmentService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import GoogleMapsAddressAutocomplete, {
  AddressData,
} from "@/components/GoogleMapsAddressAutocomplete";
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
  seller_subaccount_code?: string;
}

interface DeliveryOption {
  courier: string;
  service_name: string;
  price: number;
  estimated_days: number;
  description: string;
  zone_type: string;
}

type CheckoutStep = "items" | "shipping" | "delivery" | "payment";

// Simplified state management
interface CheckoutState {
  step: CheckoutStep;
  items: CheckoutItem[];
  shippingAddress: CheckoutAddress | null;
  selectedDelivery: DeliveryOption | null;
  deliveryOptions: DeliveryOption[];
  error: string | null;
  isProcessing: boolean;
  showSuccess: boolean;
  book: CheckoutItem | null;
  seller_address: CourierAddress | null;
  buyer_address: CheckoutAddress | null;
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
  book: null,
  seller_address: null,
  buyer_address: null,
};

const CheckoutSimplified = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cartData, removeFromCart } = useCart();

  const [state, setState] = useState<CheckoutState>(initialState);
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);

  const isCartCheckout = location.pathname.includes("cart") || !id;

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

  // 📖 CHECKOUT INITIALIZATION - Following your exact specification
  const initializeCheckout = async () => {
    try {
      if (!user?.id) {
        toast.error("Please log in to complete your purchase");
        navigate("/login");
        return;
      }

      updateState({ isProcessing: true, error: null });

      let book: any = null;

      if (isCartCheckout) {
        // Handle cart checkout - take first item for now
        if (!cartData || cartData.length === 0) {
          throw new Error("Cart is empty");
        }
        book = cartData[0]; // For simplicity, handle single book checkout
      } else if (id) {
        // 📖 STEP 1: Get book data with seller info
        const { data: bookData, error: bookError } = await supabase
          .from("books")
          .select("*")
          .eq("id", id)
          .single();

        if (bookError || !bookData) {
          throw new Error("Book not found");
        }

        if (bookData.sold) {
          throw new Error("This book has already been sold");
        }

        if (bookData.seller_id === user.id) {
          throw new Error("You cannot purchase your own book");
        }

        book = bookData;
      }

      if (!book) {
        throw new Error("No book to checkout");
      }

      // 👤 STEP 2: Get seller profile
      const { data: sellerProfile, error: sellerError } = await supabase
        .from("profiles")
        .select("id, name, email")
        .eq("id", book.seller_id)
        .single();

      // 💳 STEP 3: Validate seller has subaccount from books table
      if (!book.subaccount_code) {
        throw new Error(
          "Seller payment setup is incomplete. The seller needs to set up their banking details.",
        );
      }

      // 📍 STEP 4: Get seller pickup address from profile
      const { data: sellerProfileData, error: sellerProfileError } =
        await supabase
          .from("profiles")
          .select("pickup_address")
          .eq("id", book.seller_id)
          .single();

      if (sellerProfileError || !sellerProfileData?.pickup_address) {
        throw new Error(
          "Seller address is incomplete. The seller needs to update their pickup address.",
        );
      }

      // 🏠 STEP 5: Normalize seller address format
      const pickupAddress = sellerProfileData.pickup_address as any;
      const sellerAddress: CourierAddress = {
        street: pickupAddress.streetAddress || pickupAddress.street || "",
        city: pickupAddress.city || "",
        province: pickupAddress.province || "",
        postal_code:
          pickupAddress.postalCode || pickupAddress.postal_code || "",
        country: "South Africa",
      };

      // ✅ STEP 6: Validate address completeness
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

      // 📦 STEP 7: Create updated book object with seller data
      const updatedBook: CheckoutItem = {
        id: book.id,
        title: book.title,
        author: book.author,
        price: book.price,
        condition: book.condition,
        category: book.category,
        imageUrl: book.frontCover || book.imageUrl,
        seller: {
          id: sellerProfile?.id || book.seller_id,
          name: sellerProfile?.name || "Seller",
          email: sellerProfile?.email || "",
        },
        seller_subaccount_code: book.subaccount_code, // ← SUBACCOUNT FROM BOOKS TABLE
      };

      // 🚚 STEP 8: Get buyer address (if available)
      let buyerAddress: CheckoutAddress | null = null;
      try {
        const addressData = await getUserAddresses(user.id);
        setSavedAddresses(addressData ? [addressData] : []);

        if (addressData?.shipping_address) {
          const addr = addressData.shipping_address as any;
          buyerAddress = {
            street: addr.street || "",
            city: addr.city || "",
            province: addr.province || "",
            postalCode: addr.postalCode || "",
            country: addr.country || "South Africa",
          };
        }
      } catch (addressError) {
        console.warn("Could not load buyer addresses:", addressError);
      }

      // 🔄 STEP 9: Update checkout state with all data
      updateState({
        book: updatedBook, // ← Book with subaccount_code
        items: [updatedBook],
        seller_address: sellerAddress, // ← Seller pickup address
        buyer_address: buyerAddress, // ← Buyer delivery address
        shippingAddress: buyerAddress,
        isProcessing: false,
      });
    } catch (error) {
      console.error("❌ Checkout initialization error:", error);
      handleError(error, "Failed to initialize checkout");
    }
  };

  // Initialize checkout
  useEffect(() => {
    if (user?.id) {
      initializeCheckout();
    }
  }, [id, user?.id, isCartCheckout]);

  // 🚚 REAL COURIER PRICING CALCULATION
  const fetchDeliveryOptions = async () => {
    if (!state.seller_address || !state.shippingAddress) {
      console.log("Missing addresses for delivery quotes");
      return;
    }

    try {
      console.log("🚚 Fetching delivery options...", {
        from: state.seller_address, // ← Seller pickup address
        to: state.shippingAddress, // ← Buyer delivery address
      });

      updateState({ isProcessing: true });

      // 🌍 STEP 1: Determine delivery zone based on addresses
      const zoneType = RealCourierPricing.determineDeliveryZone(
        state.seller_address,
        state.shippingAddress,
      );

      // 📦 STEP 2: Prepare quote request with real addresses
      const quoteRequest = {
        from: state.seller_address, // ← Real seller address
        to: state.shippingAddress, // ← Real buyer address
        parcel: {
          weight: 0.5, // Default book weight (500g)
          length: 25, // Default book dimensions
          width: 20,
          height: 5,
          value: state.items[0]?.price || 100, // For insurance
        },
      };

      // 📞 STEP 3: Get real quotes from both courier APIs
      const [courierGuyQuotes, fastwayQuotes] = await Promise.allSettled([
        RealCourierPricing.getCourierGuyQuotes(quoteRequest), // ← Real API call
        RealCourierPricing.getFastwayQuotes(quoteRequest), // ← Real API call
      ]);

      const baseOptions: DeliveryOption[] = [];

      // 🚛 STEP 4: Process Courier Guy quotes
      if (
        courierGuyQuotes.status === "fulfilled" &&
        courierGuyQuotes.value.length > 0
      ) {
        courierGuyQuotes.value.forEach((quote) => {
          baseOptions.push({
            courier: "courier-guy",
            service_name: quote.service_name, // ← Real service name
            price: quote.price, // ← Real price from API
            estimated_days: parseInt(quote.estimated_days) || 1, // ← Real delivery time
            description: quote.description, // ← Real description
            zone_type: zoneType,
          });
        });
      }

      // 🚛 STEP 5: Process Fastway quotes
      if (
        fastwayQuotes.status === "fulfilled" &&
        fastwayQuotes.value.length > 0
      ) {
        fastwayQuotes.value.forEach((quote) => {
          baseOptions.push({
            courier: "fastway",
            service_name: quote.service_name, // ← Real service name
            price: quote.price, // ← Real price from API
            estimated_days: parseInt(quote.estimated_days) || 1, // ← Real delivery time
            description: quote.description, // ← Real description
            zone_type: zoneType,
          });
        });
      }

      // 🔄 STEP 6: Fallback to zone-based pricing if APIs fail
      if (baseOptions.length === 0) {
        console.warn("⚠️ No API quotes available, using fallback pricing");
        // Add fallback options
        baseOptions.push(
          {
            courier: "standard",
            service_name: "Standard Delivery",
            price:
              zoneType === "local" ? 45 : zoneType === "provincial" ? 75 : 95,
            estimated_days:
              zoneType === "local" ? 1 : zoneType === "provincial" ? 2 : 3,
            description: "Reliable standard delivery",
            zone_type: zoneType,
          },
          {
            courier: "express",
            service_name: "Express Delivery",
            price:
              zoneType === "local" ? 65 : zoneType === "provincial" ? 95 : 125,
            estimated_days: 1,
            description: "Fast express delivery",
            zone_type: zoneType,
          },
        );
      }

      updateState({
        deliveryOptions: baseOptions, // ← Set real delivery options
        isProcessing: false,
      });
    } catch (err) {
      console.error("Error fetching delivery options:", err);
      handleError(err, "Failed to load delivery options");
    }
  };

  // Load delivery quotes when address is set and on delivery step
  const loadDeliveryQuotes = useCallback(async () => {
    if (!state.shippingAddress || state.step !== "delivery") return;
    await fetchDeliveryOptions();
  }, [state.shippingAddress, state.step, state.seller_address]);

  // Load delivery quotes when step changes to delivery
  useEffect(() => {
    if (state.step === "delivery" && state.shippingAddress) {
      loadDeliveryQuotes();
    }
  }, [state.step, state.shippingAddress, loadDeliveryQuotes]);

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

  const handleAddressUpdate = (addressData: AddressData) => {
    const address: CheckoutAddress = {
      street: addressData.street,
      city: addressData.city,
      province: addressData.province,
      postalCode: addressData.postalCode,
      country: addressData.country,
    };
    updateState({ shippingAddress: address });
  };

  const handleDeliverySelect = (option: DeliveryOption) => {
    updateState({ selectedDelivery: option });
  };

  const handlePaymentSuccess = async (paymentData: any) => {
    try {
      updateState({ isProcessing: true });

      // Create sale commitment
      if (state.book) {
        await createSaleCommitment({
          bookId: state.book.id,
          buyerId: user!.id,
          sellerId: state.book.seller.id,
          price: totalAmount,
          deliveryAddress: state.shippingAddress!,
          deliveryMethod: state.selectedDelivery!,
          paymentReference: paymentData.reference,
        });
      }

      // Remove from cart if cart checkout
      if (isCartCheckout && state.book) {
        removeFromCart(state.book.id);
      }

      updateState({ showSuccess: true, isProcessing: false });
      toast.success("Order placed successfully!");
    } catch (error) {
      handleError(error, "Failed to complete order");
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 text-center">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-6">
            Please log in to continue with checkout
          </p>
          <Button
            onClick={() => navigate("/login")}
            className="bg-book-600 hover:bg-book-700"
          >
            Log In
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Checkout</h1>
              <p className="text-gray-600">Complete your purchase</p>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>
                Step {currentStepIndex + 1} of {steps.length}
              </span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        {/* Error Alert */}
        {state.error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {state.error}
            </AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Content */}
          <div className="lg:col-span-2 space-y-6">
            <CheckoutSteps
              steps={steps}
              currentStep={state.step}
              onStepClick={(stepId) =>
                updateState({ step: stepId as CheckoutStep })
              }
            />

            {/* Step Content */}
            {state.step === "items" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Review Your Order
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {state.isProcessing ? (
                    <div className="text-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-book-600" />
                      <p>Loading your order...</p>
                    </div>
                  ) : state.items.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No items to checkout</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
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
                              <Badge variant="secondary">
                                {item.condition}
                              </Badge>
                              <Badge variant="outline">{item.category}</Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-book-600">
                              R{item.price}
                            </p>
                            <p className="text-sm text-gray-500">
                              Seller: {item.seller.name}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {state.step === "shipping" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <GoogleMapsAddressAutocomplete
                    onAddressSelect={handleAddressUpdate}
                    label="Shipping Address"
                    required={true}
                    defaultValue={
                      state.shippingAddress
                        ? {
                            formattedAddress: `${state.shippingAddress.street}, ${state.shippingAddress.city}, ${state.shippingAddress.province}, ${state.shippingAddress.postalCode}`,
                            street: state.shippingAddress.street,
                            city: state.shippingAddress.city,
                            province: state.shippingAddress.province,
                            postalCode: state.shippingAddress.postalCode,
                            country: state.shippingAddress.country,
                          }
                        : undefined
                    }
                  />
                </CardContent>
              </Card>
            )}

            {state.step === "delivery" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Delivery Options
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {state.isProcessing ? (
                    <div className="text-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-book-600" />
                      <p>Loading delivery options...</p>
                    </div>
                  ) : state.deliveryOptions.length === 0 ? (
                    <div className="text-center py-8">
                      <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">
                        No delivery options available
                      </p>
                      <Button
                        onClick={fetchDeliveryOptions}
                        variant="outline"
                        className="mt-4"
                      >
                        Retry Loading Options
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {state.deliveryOptions.map((option, index) => (
                        <div
                          key={index}
                          className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                            state.selectedDelivery === option
                              ? "border-book-600 bg-book-50"
                              : "hover:border-gray-300"
                          }`}
                          onClick={() => handleDeliverySelect(option)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-semibold">
                                {option.service_name}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {option.description}
                              </p>
                              <p className="text-sm text-gray-500 mt-1">
                                Estimated delivery: {option.estimated_days} day
                                {option.estimated_days !== 1 ? "s" : ""}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold">
                                R{option.price}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {state.step === "payment" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Order Summary</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Subtotal:</span>
                          <span>R{subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Delivery:</span>
                          <span>R{deliveryFee.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold">
                          <span>Total:</span>
                          <span>R{totalAmount.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {state.book && (
                      <PaystackPaymentButton
                        amount={totalAmount}
                        email={user.email!}
                        bookId={state.book.id}
                        bookTitle={state.book.title}
                        onSuccess={handlePaymentSuccess}
                        disabled={state.isProcessing}
                        subaccountCode={state.book.seller_subaccount_code}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Navigation */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={goToPreviousStep}
                disabled={currentStepIndex === 0 || state.isProcessing}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              {state.step !== "payment" && (
                <Button
                  onClick={goToNextStep}
                  disabled={!isStepValid() || state.isProcessing}
                  className="bg-book-600 hover:bg-book-700"
                >
                  {state.isProcessing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <>
                      Next
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
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
        {state.showSuccess && state.book && (
          <SaleSuccessPopup
            isOpen={state.showSuccess}
            onClose={() => {
              updateState({ showSuccess: false });
              navigate("/profile");
            }}
            bookTitle={state.book.title}
            buyerName={user.name || "Buyer"}
            sellerName={state.book.seller.name}
            salePrice={totalAmount}
            commitmentId="temp-id"
          />
        )}
      </div>
    </Layout>
  );
};

export default CheckoutSimplified;

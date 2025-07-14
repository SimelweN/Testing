import { useState, useEffect, useMemo } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { getBookById } from "@/services/book/bookQueries";
import { getUserAddresses } from "@/services/addressService";
import { getSellerPickupAddress } from "@/services/addressService";
import { getDeliveryQuotes, DeliveryQuote } from "@/services/deliveryService";
import { createSaleCommitment } from "@/services/commitmentService";
import { supabase } from "@/lib/supabase";
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
  Shield,
  CheckCircle,
  Clock,
  User,
  Edit,
  Plus,
  Loader2,
  Info,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import SimpleAddressInput from "@/components/SimpleAddressInput";
import PaystackPaymentButton from "@/components/banking/PaystackPaymentButton";
import SaleSuccessPopup from "@/components/SaleSuccessPopup";
import CommitReminderModal from "@/components/CommitReminderModal";
import CheckoutSteps from "@/components/checkout/CheckoutSteps";
import CheckoutSummary from "@/components/checkout/CheckoutSummary";
import {
  getUserFriendlyErrorMessage,
  isNetworkError,
  logDetailedError,
} from "@/utils/networkUtils";

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

type CheckoutStep =
  | "items"
  | "shipping"
  | "delivery"
  | "payment"
  | "confirmation";

const Checkout = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items: cartItems, clearCart } = useCart();

  // Core state
  const [currentStep, setCurrentStep] = useState<CheckoutStep>("items");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<CheckoutItem[]>([]);

  // Address state
  const [shippingAddress, setShippingAddress] =
    useState<CheckoutAddress | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [isEditingAddress, setIsEditingAddress] = useState(false);

  // Delivery state
  const [deliveryQuotes, setDeliveryQuotes] = useState<DeliveryQuote[]>([]);
  const [selectedDelivery, setSelectedDelivery] =
    useState<DeliveryQuote | null>(null);
  const [loadingQuotes, setLoadingQuotes] = useState(false);

  // Payment state
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [showSalePopup, setShowSalePopup] = useState(false);
  const [showCommitReminderModal, setShowCommitReminderModal] = useState(false);
  const [saleData, setSaleData] = useState<any>(null);

  const isCartCheckout = id === "cart";
  const cartData = location.state?.cartItems || [];

  // Computed values
  const subtotal = useMemo(() => {
    if (!Array.isArray(items) || items.length === 0) return 0;
    return items.reduce((total, item) => {
      const price = typeof item.price === "number" ? item.price : 0;
      return total + price;
    }, 0);
  }, [items]);

  const deliveryFee = selectedDelivery?.price || 0;
  const totalAmount = subtotal + deliveryFee;

  const steps = [
    { id: "items", label: "Review Items", icon: Package },
    { id: "shipping", label: "Shipping Address", icon: MapPin },
    { id: "delivery", label: "Delivery Options", icon: Truck },
    { id: "payment", label: "Payment", icon: CreditCard },
  ];

  const currentStepIndex = steps.findIndex((step) => step.id === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  // Data fetching
  useEffect(() => {
    const initializeCheckout = async () => {
      if (!user?.id) {
        toast.error("Please log in to complete your purchase");
        navigate("/login");
        return;
      }

      setIsLoading(true);
      setError(null);

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
          if (!book) {
            setError("Book not found");
            return;
          }
          if (book.sold) {
            setError("This book has already been sold");
            return;
          }
          if (book.seller?.id === user.id) {
            setError("You cannot purchase your own book");
            return;
          }

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
          setError("No items to checkout");
          return;
        }

        // Validate that all items have seller information
        const invalidItems = checkoutItems.filter((item) => !item.seller?.id);
        if (invalidItems.length > 0) {
          setError(
            "Some items are missing seller information. Please try again.",
          );
          return;
        }

        // Check if we have multiple sellers (for now, we only support single seller checkouts)
        const uniqueSellers = new Set(
          checkoutItems.map((item) => item.seller.id),
        );
        if (uniqueSellers.size > 1) {
          setError(
            "Multiple seller checkout is not yet supported. Please checkout items from one seller at a time.",
          );
          return;
        }

        // STEP 2: CHECKOUT INITIALIZATION - Validate seller banking setup
        if (checkoutItems.length > 0) {
          const sellerId = checkoutItems[0].seller.id;

          try {
            // 🔍 DATABASE QUERY: Get seller profile with banking info
            const { data: sellerProfile, error: sellerError } = await supabase
              .from("profiles")
              .select("id, name, email, pickup_address, subaccount_code")
              .eq("id", sellerId)
              .single();

            if (sellerError || !sellerProfile) {
              setError(
                "Unable to verify seller information. Please try again.",
              );
              return;
            }

            // ✅ VALIDATION CHECKS:
            // - sellerProfile.subaccount_code exists (seller banking setup)
            if (!sellerProfile.subaccount_code) {
              setError(
                "This seller hasn't completed their banking setup. Payment cannot be processed.",
              );
              return;
            }

            // - sellerProfile.pickup_address complete
            if (!sellerProfile.pickup_address) {
              console.warn(
                "Seller pickup address not configured, will use default",
              );
            } else {
              const pickupAddr = sellerProfile.pickup_address;
              // - seller address has street, city, province, postal_code
              if (
                !pickupAddr.street ||
                !pickupAddr.city ||
                !pickupAddr.province ||
                !pickupAddr.postalCode
              ) {
                console.warn(
                  "Seller pickup address incomplete, will use default for delivery calculations",
                );
              }
            }

            console.log("Seller validation passed:", {
              sellerId: sellerProfile.id,
              hasSubaccount: !!sellerProfile.subaccount_code,
              hasPickupAddress: !!sellerProfile.pickup_address,
            });
          } catch (validationError) {
            console.error("Seller validation error:", validationError);
            setError("Unable to validate seller setup. Please try again.");
            return;
          }
        }

        setItems(checkoutItems);

        // Load saved addresses
        try {
          console.log("Loading addresses for user:", user.id);
          const addressData = await getUserAddresses(user.id);

          if (addressData?.shipping_address) {
            const shippingAddr = addressData.shipping_address;
            setShippingAddress({
              street: shippingAddr.street || "",
              city: shippingAddr.city || "",
              province: shippingAddr.province || "",
              postalCode: shippingAddr.postalCode || "",
              country: "South Africa",
            });
          }
          setSavedAddresses(addressData ? [addressData] : []);
          console.log("Successfully loaded address data");
        } catch (addressError) {
          console.error("Error loading addresses:", {
            error: addressError,
            message:
              addressError instanceof Error
                ? addressError.message
                : String(addressError),
            userId: user.id,
          });

          // Show user-friendly error message
          if (
            addressError instanceof Error &&
            addressError.message.includes("Network connection")
          ) {
            toast.error(
              "Network error loading saved addresses. You can still enter your address manually.",
            );
          } else {
            toast.error(
              "Could not load saved addresses. You can still enter your address manually.",
            );
          }

          // Don't fail the entire checkout for address loading issues
        }
      } catch (err) {
        console.error("Checkout initialization error:", err);
        setError(
          err instanceof Error ? err.message : "Failed to initialize checkout",
        );
      } finally {
        setIsLoading(false);
      }
    };

    initializeCheckout();
  }, [id, user?.id, navigate, isCartCheckout, cartData]);

  // Get delivery quotes when address changes
  useEffect(() => {
    const fetchDeliveryQuotes = async () => {
      if (!shippingAddress || currentStep !== "delivery") return;

      setLoadingQuotes(true);
      try {
        // Get seller addresses for accurate delivery calculation
        console.log("Fetching seller addresses for delivery calculation");
        const sellerAddresses = await Promise.all(
          items.map(async (item) => {
            try {
              console.log("Getting pickup address for seller:", item.seller.id);
              const sellerAddr = await getSellerPickupAddress(item.seller.id);

              if (sellerAddr) {
                console.log("Found seller address:", sellerAddr);
                return sellerAddr;
              } else {
                console.log("No seller address found, using default");
                return {
                  street: "Default Business Address",
                  city: "Johannesburg",
                  province: "Gauteng",
                  postalCode: "2196",
                };
              }
            } catch (error) {
              console.error("Error fetching seller address:", {
                error,
                sellerId: item.seller.id,
                message: error instanceof Error ? error.message : String(error),
              });

              return {
                street: "Default Business Address",
                city: "Johannesburg",
                province: "Gauteng",
                postalCode: "2196",
              };
            }
          }),
        );

        // Use the first seller's address as the "from" address
        const fromAddress = {
          streetAddress: sellerAddresses[0].street,
          suburb: sellerAddresses[0].city,
          city: sellerAddresses[0].city,
          province: sellerAddresses[0].province,
          postalCode: sellerAddresses[0].postalCode,
        };

        const toAddress = {
          streetAddress: shippingAddress.street,
          suburb: shippingAddress.city,
          city: shippingAddress.city,
          province: shippingAddress.province,
          postalCode: shippingAddress.postalCode,
        };

        const quotes = await getDeliveryQuotes(
          fromAddress,
          toAddress,
          items.length,
        );
        setDeliveryQuotes(quotes);

        if (quotes.length > 0 && !selectedDelivery) {
          setSelectedDelivery(quotes[0]);
        }
      } catch (error) {
        console.error("Error fetching delivery quotes:", {
          error,
          message: error instanceof Error ? error.message : String(error),
          shippingAddress,
          itemCount: items.length,
        });

        // Show user-friendly error message
        if (
          error instanceof Error &&
          error.message.includes("Network connection")
        ) {
          toast.error(
            "Network error getting delivery quotes. Please check your connection and try again.",
          );
        } else {
          toast.error(
            "Could not get delivery quotes. Please try again or contact support.",
          );
        }
      } finally {
        setLoadingQuotes(false);
      }
    };

    fetchDeliveryQuotes();
  }, [shippingAddress, currentStep, items, selectedDelivery]);

  const handlePaymentSuccess = async (reference: string) => {
    try {
      setPaymentProcessing(true);

      // Create sale commitments
      for (const item of items) {
        await createSaleCommitment({
          bookId: item.id,
          buyerId: user!.id,
          sellerId: item.seller.id,
          commitmentDate: new Date().toISOString(),
          expiryDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        });
      }

      // Show success
      setShowCommitReminderModal(true);

      // Set sale data
      setSaleData({
        bookTitle: items.length > 1 ? `${items.length} books` : items[0].title,
        bookPrice: totalAmount,
        buyerName: user!.email?.split("@")[0] || "Buyer",
        buyerEmail: user!.email || "",
        saleId: reference,
      });

      // Clear cart if it was a cart checkout
      if (isCartCheckout) {
        clearCart();
      }

      toast.success("Payment successful! Order confirmed.");
      setCurrentStep("confirmation");
    } catch (error) {
      console.error("Post-payment processing error:", error);
      toast.error(
        "Payment successful but there was an issue processing your order",
      );
    } finally {
      setPaymentProcessing(false);
    }
  };

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case "items":
        return items.length > 0;
      case "shipping":
        return shippingAddress !== null;
      case "delivery":
        return selectedDelivery !== null;
      case "payment":
        return false; // Payment step doesn't have a "next" - it goes directly to confirmation
      default:
        return false;
    }
  };

  const handleNextStep = () => {
    const stepOrder: CheckoutStep[] = [
      "items",
      "shipping",
      "delivery",
      "payment",
    ];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1]);
    }
  };

  const handlePreviousStep = () => {
    const stepOrder: CheckoutStep[] = [
      "items",
      "shipping",
      "delivery",
      "payment",
    ];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  };

  if (isLoading) {
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
              <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
              <p className="text-gray-600 mt-1">
                {items.length} {items.length === 1 ? "item" : "items"} • Total:
                R{totalAmount.toFixed(2)}
              </p>
            </div>
            <Badge variant="outline" className="text-sm">
              {isCartCheckout ? "Cart Checkout" : "Single Item"}
            </Badge>
          </div>

          {/* Progress Steps */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = step.id === currentStep;
                const isCompleted = index < currentStepIndex;

                return (
                  <div key={step.id} className="flex items-center">
                    <div
                      className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                        isCompleted
                          ? "bg-green-600 border-green-600 text-white"
                          : isActive
                            ? "bg-book-600 border-book-600 text-white"
                            : "bg-gray-100 border-gray-300 text-gray-400"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                    </div>
                    <div className="ml-3 hidden sm:block">
                      <p
                        className={`text-sm font-medium ${isActive ? "text-book-600" : isCompleted ? "text-green-600" : "text-gray-500"}`}
                      >
                        {step.label}
                      </p>
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={`hidden sm:block w-20 h-0.5 mx-4 ${isCompleted ? "bg-green-600" : "bg-gray-300"}`}
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
                    const step = steps.find((s) => s.id === currentStep);
                    const Icon = step?.icon || Package;
                    return (
                      <>
                        <Icon className="h-5 w-5 text-book-600" />
                        {step?.label}
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
                            </div>
                            <div className="flex items-center gap-1 mt-2 text-sm text-gray-500">
                              <User className="h-3 w-3" />
                              Sold by {item.seller.name}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-book-600">
                              R{item.price}
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
                        Provide your shipping address for delivery calculations.
                      </AlertDescription>
                    </Alert>

                    {shippingAddress && !isEditingAddress ? (
                      <Card className="bg-green-50 border-green-200">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-green-900 mb-2">
                                Shipping Address
                              </h3>
                              <p className="text-green-800">
                                {shippingAddress.street}
                                <br />
                                {shippingAddress.city},{" "}
                                {shippingAddress.province}
                                <br />
                                {shippingAddress.postalCode}
                                <br />
                                {shippingAddress.country}
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
                          {shippingAddress
                            ? "Edit Shipping Address"
                            : "Add Shipping Address"}
                        </h3>
                        <SimpleAddressInput
                          label="Shipping Address"
                          required
                          onAddressSelect={(addressData) => {
                            setShippingAddress({
                              street: addressData.street,
                              city: addressData.city,
                              province: addressData.province,
                              postalCode: addressData.postalCode,
                              country: addressData.country,
                            });
                            setIsEditingAddress(false);
                          }}
                          defaultValue={shippingAddress || undefined}
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
                        Choose your preferred delivery option and estimated
                        timeline.
                      </AlertDescription>
                    </Alert>

                    {loadingQuotes ? (
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
                                      selectedDelivery?.courier ===
                                        quote.courier &&
                                      selectedDelivery?.serviceName ===
                                        quote.serviceName
                                        ? "border-book-600 bg-book-600"
                                        : "border-gray-300"
                                    }`}
                                  >
                                    {selectedDelivery?.courier ===
                                      quote.courier &&
                                      selectedDelivery?.serviceName ===
                                        quote.serviceName && (
                                        <div className="w-full h-full rounded-full bg-white border-2 border-book-600" />
                                      )}
                                  </div>
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
                {currentStep === "payment" && (
                  <div className="space-y-6">
                    <Alert>
                      <Shield className="h-4 w-4" />
                      <AlertDescription>
                        Your payment is secure and encrypted. You'll be
                        redirected to Paystack for payment processing.
                      </AlertDescription>
                    </Alert>

                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="font-semibold mb-4">Payment Summary</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span>
                            Subtotal ({items.length}{" "}
                            {items.length === 1 ? "item" : "items"})
                          </span>
                          <span>R{subtotal.toFixed(2)}</span>
                        </div>
                        {selectedDelivery && (
                          <div className="flex justify-between">
                            <span>
                              Delivery ({selectedDelivery.serviceName})
                            </span>
                            <span>R{deliveryFee.toFixed(2)}</span>
                          </div>
                        )}
                        <Separator />
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total</span>
                          <span>R{totalAmount.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {Array.isArray(items) &&
                      items.length > 0 &&
                      shippingAddress &&
                      selectedDelivery &&
                      items[0]?.seller?.id &&
                      totalAmount > 0 && (
                        <PaystackPaymentButton
                          amount={Math.round(totalAmount * 100)}
                          bookIds={items.map((item) => item.id)}
                          sellerId={items[0].seller.id}
                          shippingAddress={{
                            street: shippingAddress.street,
                            city: shippingAddress.city,
                            state: shippingAddress.province,
                            postal_code: shippingAddress.postalCode,
                            country: shippingAddress.country,
                          }}
                          deliveryMethod="delivery"
                          deliveryFee={deliveryFee}
                          onSuccess={handlePaymentSuccess}
                          onError={(error) => {
                            toast.error(`Payment failed: ${error}`);
                            setPaymentProcessing(false);
                          }}
                          onCancel={() => {
                            toast.error("Payment was cancelled");
                            setPaymentProcessing(false);
                          }}
                          disabled={paymentProcessing}
                          className="w-full bg-book-600 hover:bg-book-700 text-lg py-6"
                        >
                          {paymentProcessing ? (
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          ) : (
                            <CreditCard className="mr-2 h-5 w-5" />
                          )}
                          {paymentProcessing
                            ? "Processing..."
                            : `Pay R${totalAmount.toFixed(2)}`}
                        </PaystackPaymentButton>
                      )}

                    {/* Fallback for missing seller information */}
                    {items.length > 0 &&
                      shippingAddress &&
                      selectedDelivery &&
                      !items[0]?.seller?.id && (
                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            There's an issue with the seller information. Please
                            go back and try again, or contact support.
                          </AlertDescription>
                        </Alert>
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
                      onClick={handlePreviousStep}
                      disabled={currentStepIndex === 0}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Previous
                    </Button>

                    {currentStep !== "payment" && (
                      <Button
                        onClick={handleNextStep}
                        disabled={!canProceedToNextStep()}
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
                          R{item.price}
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
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>R{subtotal.toFixed(2)}</span>
                  </div>
                  {selectedDelivery && (
                    <div className="flex justify-between text-sm">
                      <span>Delivery</span>
                      <span>R{deliveryFee.toFixed(2)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>R{totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                {/* Shipping Address Preview */}
                {shippingAddress && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        Shipping To
                      </h4>
                      <p className="text-xs text-gray-600">
                        {shippingAddress.street}
                        <br />
                        {shippingAddress.city}, {shippingAddress.province}
                        <br />
                        {shippingAddress.postalCode}
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
                        Estimated: {selectedDelivery.estimatedDays} days
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

export default Checkout;

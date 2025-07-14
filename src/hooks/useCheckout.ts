import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getBookById } from "@/services/book/bookQueries";
import {
  getUserAddresses,
  getSellerPickupAddress,
} from "@/services/addressService";
import { getDeliveryQuotes, DeliveryQuote } from "@/services/deliveryService";
import { createSaleCommitment } from "@/services/commitmentService";
import { toast } from "sonner";

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

interface CheckoutAddress {
  street: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
}

type CheckoutStep =
  | "items"
  | "shipping"
  | "delivery"
  | "payment"
  | "confirmation";

interface UseCheckoutProps {
  bookId?: string;
  cartItems?: any[];
  isCartCheckout: boolean;
}

export const useCheckout = ({
  bookId,
  cartItems = [],
  isCartCheckout,
}: UseCheckoutProps) => {
  const { user } = useAuth();

  // Core state
  const [currentStep, setCurrentStep] = useState<CheckoutStep>("items");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<CheckoutItem[]>([]);

  // Address state
  const [shippingAddress, setShippingAddress] =
    useState<CheckoutAddress | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);

  // Delivery state
  const [deliveryQuotes, setDeliveryQuotes] = useState<DeliveryQuote[]>([]);
  const [selectedDelivery, setSelectedDelivery] =
    useState<DeliveryQuote | null>(null);
  const [loadingQuotes, setLoadingQuotes] = useState(false);

  // Payment state
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  // Computed values
  const subtotal = items.reduce((total, item) => total + item.price, 0);
  const deliveryFee = selectedDelivery?.price || 0;
  const totalAmount = subtotal + deliveryFee;

  // Initialize checkout data
  const initializeCheckout = useCallback(async () => {
    if (!user?.id) {
      setError("Please log in to complete your purchase");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let checkoutItems: CheckoutItem[] = [];

      if (isCartCheckout && cartItems.length > 0) {
        // Process cart items
        checkoutItems = cartItems.map((item: any) => ({
          id: item.id,
          title: item.title,
          author: item.author,
          price: item.price,
          condition: item.condition || "Good",
          category: item.category || "Unknown",
          imageUrl: item.frontCover || item.imageUrl || "/placeholder.svg",
          seller: item.seller || { id: "", name: "Unknown", email: "" },
        }));
      } else if (bookId) {
        // Fetch single book
        const book = await getBookById(bookId);
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
            imageUrl: book.frontCover || book.imageUrl || "/placeholder.svg",
            seller: book.seller || { id: "", name: "Unknown", email: "" },
          },
        ];
      }

      if (checkoutItems.length === 0) {
        setError("No items to checkout");
        return;
      }

      setItems(checkoutItems);

      // Load saved addresses
      try {
        const addressData = await getUserAddresses(user.id);
        if (addressData?.shipping_address) {
          const addr = addressData.shipping_address;
          setShippingAddress({
            street: addr.street || "",
            city: addr.city || "",
            province: addr.province || "",
            postalCode: addr.postalCode || "",
            country: "South Africa",
          });
        }
        setSavedAddresses(addressData ? [addressData] : []);
      } catch (addressError) {
        console.error("Error loading addresses:", addressError);
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
  }, [user?.id, bookId, cartItems, isCartCheckout]);

  // Fetch delivery quotes
  const fetchDeliveryQuotes = useCallback(async () => {
    if (!shippingAddress || items.length === 0) return;

    setLoadingQuotes(true);
    try {
      // Get seller addresses for accurate delivery calculation
      const sellerAddresses = await Promise.all(
        items.map(async (item) => {
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

      // Use the first seller's address as the "from" address
      // In a real scenario, you might need to handle multiple sellers differently
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

      // Auto-select the first (usually cheapest) option
      if (quotes.length > 0 && !selectedDelivery) {
        setSelectedDelivery(quotes[0]);
      }
    } catch (error) {
      console.error("Error fetching delivery quotes:", error);
      toast.error("Failed to get delivery quotes. Please try again.");
    } finally {
      setLoadingQuotes(false);
    }
  }, [shippingAddress, items, selectedDelivery]);

  // Process payment success
  const processPaymentSuccess = useCallback(
    async (reference: string) => {
      if (!user?.id) return;

      setPaymentProcessing(true);
      try {
        // Create sale commitments for all items
        const commitmentPromises = items.map((item) =>
          createSaleCommitment({
            bookId: item.id,
            buyerId: user.id,
            sellerId: item.seller.id,
            commitmentDate: new Date().toISOString(),
            expiryDate: new Date(
              Date.now() + 48 * 60 * 60 * 1000,
            ).toISOString(),
          }),
        );

        await Promise.all(commitmentPromises);

        toast.success("Payment successful! Order confirmed.");
        setCurrentStep("confirmation");

        return {
          success: true,
          saleData: {
            bookTitle:
              items.length > 1 ? `${items.length} books` : items[0].title,
            bookPrice: totalAmount,
            buyerName: user.email?.split("@")[0] || "Buyer",
            buyerEmail: user.email || "",
            saleId: reference,
          },
        };
      } catch (error) {
        console.error("Post-payment processing error:", error);
        toast.error(
          "Payment successful but there was an issue processing your order",
        );
        return { success: false, error: "Failed to process order" };
      } finally {
        setPaymentProcessing(false);
      }
    },
    [user, items, totalAmount],
  );

  // Step navigation
  const canProceedToNextStep = useCallback(() => {
    switch (currentStep) {
      case "items":
        return items.length > 0;
      case "shipping":
        return shippingAddress !== null;
      case "delivery":
        return selectedDelivery !== null;
      case "payment":
        return false; // Payment step doesn't have a "next"
      default:
        return false;
    }
  }, [currentStep, items.length, shippingAddress, selectedDelivery]);

  const nextStep = useCallback(() => {
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
  }, [currentStep]);

  const previousStep = useCallback(() => {
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
  }, [currentStep]);

  // Effects
  useEffect(() => {
    initializeCheckout();
  }, [initializeCheckout]);

  useEffect(() => {
    if (currentStep === "delivery" && shippingAddress) {
      fetchDeliveryQuotes();
    }
  }, [currentStep, fetchDeliveryQuotes]);

  return {
    // State
    currentStep,
    isLoading,
    error,
    items,
    shippingAddress,
    savedAddresses,
    deliveryQuotes,
    selectedDelivery,
    loadingQuotes,
    paymentProcessing,

    // Computed values
    subtotal,
    deliveryFee,
    totalAmount,

    // Actions
    setCurrentStep,
    setShippingAddress,
    setSelectedDelivery,
    nextStep,
    previousStep,
    canProceedToNextStep,
    processPaymentSuccess,
    fetchDeliveryQuotes,

    // Utils
    setError,
    setPaymentProcessing,
  };
};

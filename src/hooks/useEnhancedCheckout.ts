import { useState, useEffect, useCallback, useReducer } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getBookById } from "@/services/book/bookQueries";
import {
  getUserAddresses,
  getSellerPickupAddress,
} from "@/services/addressService";
import { getDeliveryQuotes, DeliveryQuote } from "@/services/deliveryService";
import { createSaleCommitment } from "@/services/commitmentService";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

// Enhanced types following the architecture pattern
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
    subaccount_code?: string;
    banking_verified?: boolean;
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

interface CheckoutValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// State-driven checkout following the architecture pattern
interface CheckoutState {
  step: {
    current: CheckoutStep;
    completed: CheckoutStep[];
  };
  book: CheckoutItem | null;
  items: CheckoutItem[];
  buyer_address: CheckoutAddress | null;
  seller_address: CheckoutAddress | null;
  delivery_options: DeliveryQuote[];
  selected_delivery: DeliveryQuote | null;
  order_summary: {
    subtotal: number;
    deliveryFee: number;
    totalAmount: number;
    breakdown: string[];
  } | null;
  loading: {
    checkout: boolean;
    quotes: boolean;
    payment: boolean;
    validation: boolean;
  };
  error: string | null;
  validation: CheckoutValidation;
}

type CheckoutAction =
  | {
      type: "SET_LOADING";
      payload: { key: keyof CheckoutState["loading"]; value: boolean };
    }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_STEP"; payload: CheckoutStep }
  | { type: "MARK_STEP_COMPLETED"; payload: CheckoutStep }
  | { type: "SET_ITEMS"; payload: CheckoutItem[] }
  | { type: "SET_BUYER_ADDRESS"; payload: CheckoutAddress }
  | { type: "SET_SELLER_ADDRESS"; payload: CheckoutAddress }
  | { type: "SET_DELIVERY_OPTIONS"; payload: DeliveryQuote[] }
  | { type: "SET_SELECTED_DELIVERY"; payload: DeliveryQuote }
  | { type: "SET_ORDER_SUMMARY"; payload: CheckoutState["order_summary"] }
  | { type: "SET_VALIDATION"; payload: CheckoutValidation }
  | { type: "RESET_CHECKOUT" };

const checkoutReducer = (
  state: CheckoutState,
  action: CheckoutAction,
): CheckoutState => {
  switch (action.type) {
    case "SET_LOADING":
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.payload.key]: action.payload.value,
        },
      };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "SET_STEP":
      return { ...state, step: { ...state.step, current: action.payload } };
    case "MARK_STEP_COMPLETED":
      return {
        ...state,
        step: {
          ...state.step,
          completed: [
            ...state.step.completed.filter((s) => s !== action.payload),
            action.payload,
          ],
        },
      };
    case "SET_ITEMS":
      return { ...state, items: action.payload };
    case "SET_BUYER_ADDRESS":
      return { ...state, buyer_address: action.payload };
    case "SET_SELLER_ADDRESS":
      return { ...state, seller_address: action.payload };
    case "SET_DELIVERY_OPTIONS":
      return { ...state, delivery_options: action.payload };
    case "SET_SELECTED_DELIVERY":
      return { ...state, selected_delivery: action.payload };
    case "SET_ORDER_SUMMARY":
      return { ...state, order_summary: action.payload };
    case "SET_VALIDATION":
      return { ...state, validation: action.payload };
    case "RESET_CHECKOUT":
      return initialCheckoutState;
    default:
      return state;
  }
};

const initialCheckoutState: CheckoutState = {
  step: { current: "items", completed: [] },
  book: null,
  items: [],
  buyer_address: null,
  seller_address: null,
  delivery_options: [],
  selected_delivery: null,
  order_summary: null,
  loading: {
    checkout: false,
    quotes: false,
    payment: false,
    validation: false,
  },
  error: null,
  validation: { isValid: false, errors: [], warnings: [] },
};

interface UseEnhancedCheckoutProps {
  bookId?: string;
  cartItems?: any[];
  isCartCheckout: boolean;
}

export const useEnhancedCheckout = ({
  bookId,
  cartItems = [],
  isCartCheckout,
}: UseEnhancedCheckoutProps) => {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(checkoutReducer, initialCheckoutState);

  // Validation functions following the three-layer approach
  const validateSellerForListing = useCallback(
    async (sellerId: string): Promise<CheckoutValidation> => {
      dispatch({
        type: "SET_LOADING",
        payload: { key: "validation", value: true },
      });

      try {
        const { data: sellerProfile, error } = await supabase
          .from("profiles")
          .select(
            "id, name, email, pickup_address, subaccount_code, banking_verified",
          )
          .eq("id", sellerId)
          .single();

        if (error) {
          return {
            isValid: false,
            errors: ["Could not verify seller information"],
            warnings: [],
          };
        }

        const errors: string[] = [];
        const warnings: string[] = [];

        // Banking validation
        if (!sellerProfile.subaccount_code) {
          errors.push("Seller has not completed banking setup");
        } else if (!sellerProfile.banking_verified) {
          warnings.push("Seller banking verification pending");
        }

        // Address validation
        if (!sellerProfile.pickup_address) {
          warnings.push("Seller pickup address not configured");
        } else {
          const addr = sellerProfile.pickup_address as any;
          if (
            !addr.street ||
            !addr.city ||
            !addr.province ||
            !addr.postalCode
          ) {
            warnings.push("Seller address information incomplete");
          }
        }

        return {
          isValid: errors.length === 0,
          errors,
          warnings,
        };
      } catch (error) {
        return {
          isValid: false,
          errors: ["Failed to validate seller"],
          warnings: [],
        };
      } finally {
        dispatch({
          type: "SET_LOADING",
          payload: { key: "validation", value: false },
        });
      }
    },
    [],
  );

  const validateBuyerForCheckout = useCallback(
    async (buyerId: string): Promise<CheckoutValidation> => {
      try {
        const addressData = await getUserAddresses(buyerId);

        if (!addressData?.shipping_address) {
          return {
            isValid: false,
            errors: ["Shipping address required"],
            warnings: [],
          };
        }

        const addr = addressData.shipping_address;
        const errors: string[] = [];

        if (!addr.street?.trim()) errors.push("Street address required");
        if (!addr.city?.trim()) errors.push("City required");
        if (!addr.province?.trim()) errors.push("Province required");
        if (!addr.postalCode?.trim()) errors.push("Postal code required");

        return {
          isValid: errors.length === 0,
          errors,
          warnings: [],
        };
      } catch (error) {
        return {
          isValid: false,
          errors: ["Could not validate buyer address"],
          warnings: [],
        };
      }
    },
    [],
  );

  // Data loading functions
  const loadBookData = useCallback(
    async (id: string): Promise<CheckoutItem | null> => {
      try {
        const book = await getBookById(id);
        if (!book) return null;

        // Get enhanced seller data with banking info
        const { data: sellerData } = await supabase
          .from("profiles")
          .select("id, name, email, subaccount_code, banking_verified")
          .eq("id", book.seller.id)
          .single();

        return {
          id: book.id,
          title: book.title,
          author: book.author,
          price: book.price,
          condition: book.condition,
          category: book.category,
          imageUrl: book.frontCover || book.imageUrl || "/placeholder.svg",
          seller: {
            id: book.seller.id,
            name: book.seller.name,
            email: book.seller.email,
            subaccount_code: sellerData?.subaccount_code,
            banking_verified: sellerData?.banking_verified,
          },
        };
      } catch (error) {
        console.error("Error loading book data:", error);
        return null;
      }
    },
    [],
  );

  // Initialize checkout following the data flow strategy
  const initializeCheckout = useCallback(async () => {
    console.log("🔄 Initializing checkout...", {
      userId: user?.id,
      bookId,
      isCartCheckout,
      cartItemsLength: cartItems.length,
    });

    if (!user?.id) {
      dispatch({
        type: "SET_ERROR",
        payload: "Please log in to complete your purchase",
      });
      dispatch({
        type: "SET_LOADING",
        payload: { key: "checkout", value: false },
      });
      return;
    }

    dispatch({
      type: "SET_LOADING",
      payload: { key: "checkout", value: true },
    });
    dispatch({ type: "SET_ERROR", payload: null });

    try {
      let checkoutItems: CheckoutItem[] = [];

      // 1. Load book data from URL or cart
      if (isCartCheckout && cartItems.length > 0) {
        console.log("📦 Processing cart items...");
        // Process cart items with enhanced seller data
        const cartPromises = cartItems.map(async (item: any) => {
          try {
            const bookData = await loadBookData(item.id);
            return (
              bookData || {
                id: item.id,
                title: item.title,
                author: item.author,
                price: item.price,
                condition: item.condition || "Good",
                category: item.category || "Unknown",
                imageUrl:
                  item.frontCover || item.imageUrl || "/placeholder.svg",
                seller: item.seller || { id: "", name: "Unknown", email: "" },
              }
            );
          } catch (error) {
            console.error("Error processing cart item:", error);
            // Return fallback item data
            return {
              id: item.id,
              title: item.title,
              author: item.author,
              price: item.price,
              condition: item.condition || "Good",
              category: item.category || "Unknown",
              imageUrl: item.frontCover || item.imageUrl || "/placeholder.svg",
              seller: item.seller || { id: "", name: "Unknown", email: "" },
            };
          }
        });
        checkoutItems = await Promise.all(cartPromises);
      } else if (bookId) {
        console.log("📖 Loading single book data...", bookId);
        try {
          const book = await loadBookData(bookId);
          if (!book) {
            dispatch({ type: "SET_ERROR", payload: "Book not found" });
            dispatch({
              type: "SET_LOADING",
              payload: { key: "checkout", value: false },
            });
            return;
          }
          if (book.seller?.id === user.id) {
            dispatch({
              type: "SET_ERROR",
              payload: "You cannot purchase your own book",
            });
            dispatch({
              type: "SET_LOADING",
              payload: { key: "checkout", value: false },
            });
            return;
          }
          checkoutItems = [book];
        } catch (error) {
          console.error("Error loading book data:", error);
          dispatch({ type: "SET_ERROR", payload: "Failed to load book data" });
          dispatch({
            type: "SET_LOADING",
            payload: { key: "checkout", value: false },
          });
          return;
        }
      }

      if (checkoutItems.length === 0) {
        console.warn("⚠️ No items to checkout");
        dispatch({ type: "SET_ERROR", payload: "No items to checkout" });
        dispatch({
          type: "SET_LOADING",
          payload: { key: "checkout", value: false },
        });
        return;
      }

      console.log("✅ Loaded checkout items:", checkoutItems.length);

      // 2. Validate seller has banking + address
      const sellerId = checkoutItems[0].seller.id;
      const sellerValidation = await validateSellerForListing(sellerId);

      if (!sellerValidation.isValid) {
        // Log errors but don't fail checkout immediately
        console.warn("Seller validation issues:", sellerValidation.errors);
        toast.error("Seller setup incomplete - payment may fail");
      }

      // 3. Set items and proceed
      dispatch({ type: "SET_ITEMS", payload: checkoutItems });
      dispatch({ type: "SET_VALIDATION", payload: sellerValidation });

      // 4. Load buyer address
      try {
        const addressData = await getUserAddresses(user.id);
        if (addressData?.shipping_address) {
          const addr = addressData.shipping_address;
          dispatch({
            type: "SET_BUYER_ADDRESS",
            payload: {
              street: addr.street || "",
              city: addr.city || "",
              province: addr.province || "",
              postalCode: addr.postalCode || "",
              country: "South Africa",
            },
          });
          dispatch({ type: "MARK_STEP_COMPLETED", payload: "shipping" });
        }
      } catch (error) {
        console.warn("Address loading failed:", error);
      }
    } catch (error) {
      console.error("Checkout initialization error:", error);
      dispatch({
        type: "SET_ERROR",
        payload:
          error instanceof Error
            ? error.message
            : "Failed to initialize checkout",
      });
    } finally {
      dispatch({
        type: "SET_LOADING",
        payload: { key: "checkout", value: false },
      });
    }
  }, [
    user?.id,
    bookId,
    cartItems,
    isCartCheckout,
    loadBookData,
    validateSellerForListing,
  ]);

  // Calculate delivery options following the real courier pricing
  const calculateDeliveryOptions = useCallback(async () => {
    if (!state.buyer_address || state.items.length === 0) return;

    dispatch({ type: "SET_LOADING", payload: { key: "quotes", value: true } });

    try {
      // Get seller addresses for accurate delivery calculation
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

      const fromAddress = {
        streetAddress: sellerAddresses[0].street,
        suburb: sellerAddresses[0].city,
        city: sellerAddresses[0].city,
        province: sellerAddresses[0].province,
        postalCode: sellerAddresses[0].postalCode,
      };

      const toAddress = {
        streetAddress: state.buyer_address.street,
        suburb: state.buyer_address.city,
        city: state.buyer_address.city,
        province: state.buyer_address.province,
        postalCode: state.buyer_address.postalCode,
      };

      const quotes = await getDeliveryQuotes(
        fromAddress,
        toAddress,
        state.items.length,
      );
      dispatch({ type: "SET_DELIVERY_OPTIONS", payload: quotes });

      // Auto-select the first (usually cheapest) option
      if (quotes.length > 0) {
        dispatch({ type: "SET_SELECTED_DELIVERY", payload: quotes[0] });
      }
    } catch (error) {
      console.error("Error fetching delivery quotes:", error);
      toast.error("Failed to get delivery quotes. Please try again.");
    } finally {
      dispatch({
        type: "SET_LOADING",
        payload: { key: "quotes", value: false },
      });
    }
  }, [state.buyer_address, state.items]);

  // Update order summary when data changes
  useEffect(() => {
    if (state.items.length > 0) {
      const subtotal = state.items.reduce(
        (total, item) => total + item.price,
        0,
      );
      const deliveryFee = state.selected_delivery?.price || 0;
      const totalAmount = subtotal + deliveryFee;

      const breakdown = [
        `Items (${state.items.length}): R${subtotal.toFixed(2)}`,
        ...(deliveryFee > 0 ? [`Delivery: R${deliveryFee.toFixed(2)}`] : []),
        `Total: R${totalAmount.toFixed(2)}`,
      ];

      dispatch({
        type: "SET_ORDER_SUMMARY",
        payload: { subtotal, deliveryFee, totalAmount, breakdown },
      });
    }
  }, [state.items, state.selected_delivery]);

  // Step navigation with validation gates
  const canProceedToStep = useCallback(
    (step: CheckoutStep): boolean => {
      switch (step) {
        case "shipping":
          return state.items.length > 0;
        case "delivery":
          return state.buyer_address !== null;
        case "payment":
          return state.selected_delivery !== null;
        case "confirmation":
          return false; // Handled by payment success
        default:
          return false;
      }
    },
    [state.items.length, state.buyer_address, state.selected_delivery],
  );

  const goToStep = useCallback(
    (step: CheckoutStep) => {
      if (canProceedToStep(step)) {
        dispatch({ type: "SET_STEP", payload: step });
        if (step === "delivery" && state.buyer_address) {
          calculateDeliveryOptions();
        }
      }
    },
    [canProceedToStep, state.buyer_address, calculateDeliveryOptions],
  );

  const nextStep = useCallback(() => {
    const stepOrder: CheckoutStep[] = [
      "items",
      "shipping",
      "delivery",
      "payment",
    ];
    const currentIndex = stepOrder.indexOf(state.step.current);
    if (currentIndex < stepOrder.length - 1) {
      const nextStepValue = stepOrder[currentIndex + 1];
      dispatch({ type: "MARK_STEP_COMPLETED", payload: state.step.current });
      goToStep(nextStepValue);
    }
  }, [state.step.current, goToStep]);

  const previousStep = useCallback(() => {
    const stepOrder: CheckoutStep[] = [
      "items",
      "shipping",
      "delivery",
      "payment",
    ];
    const currentIndex = stepOrder.indexOf(state.step.current);
    if (currentIndex > 0) {
      dispatch({ type: "SET_STEP", payload: stepOrder[currentIndex - 1] });
    }
  }, [state.step.current]);

  // Process payment success with split functionality
  const processPaymentSuccess = useCallback(
    async (reference: string) => {
      dispatch({
        type: "SET_LOADING",
        payload: { key: "payment", value: true },
      });

      try {
        // Create sale commitments for all items
        const commitmentPromises = state.items.map((item) =>
          createSaleCommitment({
            bookId: item.id,
            buyerId: user!.id,
            sellerId: item.seller.id,
            commitmentDate: new Date().toISOString(),
            expiryDate: new Date(
              Date.now() + 48 * 60 * 60 * 1000,
            ).toISOString(),
          }),
        );

        await Promise.all(commitmentPromises);

        dispatch({ type: "SET_STEP", payload: "confirmation" });
        dispatch({ type: "MARK_STEP_COMPLETED", payload: "payment" });

        toast.success("Payment successful! Order confirmed.");

        return {
          success: true,
          saleData: {
            bookTitle:
              state.items.length > 1
                ? `${state.items.length} books`
                : state.items[0].title,
            bookPrice: state.order_summary?.totalAmount || 0,
            buyerName: user!.email?.split("@")[0] || "Buyer",
            buyerEmail: user!.email || "",
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
        dispatch({
          type: "SET_LOADING",
          payload: { key: "payment", value: false },
        });
      }
    },
    [state.items, state.order_summary, user],
  );

  // Initialize on mount
  useEffect(() => {
    initializeCheckout();
  }, [initializeCheckout]);

  return {
    // State
    ...state,

    // Actions
    goToStep,
    nextStep,
    previousStep,
    canProceedToStep,

    // Data setters
    setBuyerAddress: (address: CheckoutAddress) =>
      dispatch({ type: "SET_BUYER_ADDRESS", payload: address }),
    setSelectedDelivery: (delivery: DeliveryQuote) =>
      dispatch({ type: "SET_SELECTED_DELIVERY", payload: delivery }),

    // Processing
    processPaymentSuccess,
    calculateDeliveryOptions,

    // Validation
    validateSellerForListing,
    validateBuyerForCheckout,

    // Utils
    resetCheckout: () => dispatch({ type: "RESET_CHECKOUT" }),
  };
};

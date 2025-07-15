import { useState, useCallback, useEffect, useReducer } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getBookById } from "@/services/book/bookQueries";
import {
  getUserAddresses,
  getSellerPickupAddress,
} from "@/services/addressService";
import { getDeliveryQuotes } from "@/services/deliveryService";
import { createSaleCommitment } from "@/services/commitmentService";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import type {
  CheckoutState,
  CheckoutActions,
  CheckoutStep,
  CheckoutItem,
  CheckoutAddress,
  CheckoutDeliveryQuote,
  CheckoutValidation,
  CheckoutOrderSummary,
} from "@/types/checkout";
import { currencyUtils, validationUtils } from "@/types/checkout";

// Action types for reducer
type CheckoutAction =
  | {
      type: "SET_LOADING";
      payload: { key: keyof CheckoutState["loading"]; value: boolean };
    }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_STEP"; payload: CheckoutStep }
  | { type: "ADD_COMPLETED_STEP"; payload: CheckoutStep }
  | { type: "SET_ITEMS"; payload: CheckoutItem[] }
  | { type: "SET_BUYER_ADDRESS"; payload: CheckoutAddress }
  | { type: "SET_SELLER_ADDRESS"; payload: CheckoutAddress }
  | { type: "SET_DELIVERY_QUOTES"; payload: CheckoutDeliveryQuote[] }
  | { type: "SET_SELECTED_DELIVERY"; payload: CheckoutDeliveryQuote }
  | { type: "SET_ORDER_SUMMARY"; payload: CheckoutOrderSummary }
  | { type: "SET_VALIDATION"; payload: CheckoutValidation }
  | { type: "SET_PAYMENT_REFERENCE"; payload: string }
  | { type: "RESET_CHECKOUT" };

const initialState: CheckoutState = {
  currentStep: "items",
  completedSteps: [],
  items: [],
  buyerAddress: null,
  sellerAddress: null,
  deliveryQuotes: [],
  selectedDelivery: null,
  orderSummary: null,
  loading: {
    initialization: false,
    addressLoading: false,
    deliveryQuotes: false,
    payment: false,
    validation: false,
  },
  error: null,
  validation: { isValid: false, errors: [], warnings: [], canProceed: false },
  isCartCheckout: false,
  paymentReference: null,
};

function checkoutReducer(
  state: CheckoutState,
  action: CheckoutAction,
): CheckoutState {
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
      return { ...state, currentStep: action.payload };
    case "ADD_COMPLETED_STEP":
      return {
        ...state,
        completedSteps: state.completedSteps.includes(action.payload)
          ? state.completedSteps
          : [...state.completedSteps, action.payload],
      };
    case "SET_ITEMS":
      return { ...state, items: action.payload };
    case "SET_BUYER_ADDRESS":
      return { ...state, buyerAddress: action.payload };
    case "SET_SELLER_ADDRESS":
      return { ...state, sellerAddress: action.payload };
    case "SET_DELIVERY_QUOTES":
      return { ...state, deliveryQuotes: action.payload };
    case "SET_SELECTED_DELIVERY":
      return { ...state, selectedDelivery: action.payload };
    case "SET_ORDER_SUMMARY":
      return { ...state, orderSummary: action.payload };
    case "SET_VALIDATION":
      return { ...state, validation: action.payload };
    case "SET_PAYMENT_REFERENCE":
      return { ...state, paymentReference: action.payload };
    case "RESET_CHECKOUT":
      return { ...initialState };
    default:
      return state;
  }
}

interface UseRobustCheckoutProps {
  bookId?: string;
  cartItems?: any[];
  isCartCheckout: boolean;
}

export const useRobustCheckout = ({
  bookId,
  cartItems = [],
  isCartCheckout,
}: UseRobustCheckoutProps) => {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(checkoutReducer, {
    ...initialState,
    isCartCheckout,
  });

  // ✅ FIXED: Validate seller with comprehensive checks
  const validateSeller = useCallback(
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
            canProceed: false,
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
          const addressErrors = validationUtils.validateAddress(
            sellerProfile.pickup_address,
          );
          if (addressErrors.length > 0) {
            warnings.push("Seller address information incomplete");
          }
        }

        const isValid = errors.length === 0;
        return {
          isValid,
          errors,
          warnings,
          canProceed: isValid || warnings.length === 0, // Can proceed with warnings
        };
      } catch (error) {
        console.error("Seller validation error:", error);
        return {
          isValid: false,
          errors: ["Failed to validate seller"],
          warnings: [],
          canProceed: false,
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

  // ✅ FIXED: Load book data with enhanced seller information
  const loadBookData = useCallback(
    async (id: string): Promise<CheckoutItem | null> => {
      try {
        const book = await getBookById(id);
        if (!book) return null;

        // Get enhanced seller data
        const { data: sellerData } = await supabase
          .from("profiles")
          .select(
            "id, name, email, subaccount_code, banking_verified, pickup_address",
          )
          .eq("id", book.seller.id)
          .single();

        return {
          id: book.id,
          title: book.title,
          author: book.author,
          price: book.price, // Keep in Rands
          condition: book.condition,
          category: book.category,
          imageUrl: book.frontCover || book.imageUrl || "/placeholder.svg",
          seller: {
            id: book.seller.id,
            name: book.seller.name,
            email: book.seller.email,
            subaccount_code: sellerData?.subaccount_code,
            banking_verified: sellerData?.banking_verified,
            pickup_address: sellerData?.pickup_address,
          },
          frontCover: book.frontCover,
          backCover: book.backCover,
          availability: book.availability,
          sold: book.sold,
        };
      } catch (error) {
        console.error("Error loading book data:", error);
        return null;
      }
    },
    [],
  );

  // ✅ FIXED: Initialize checkout with proper error handling and logging
  const initializeCheckout = useCallback(async () => {
    if (!user?.id) {
      dispatch({
        type: "SET_ERROR",
        payload: "Please log in to complete your purchase",
      });
      return;
    }

    console.log("🔄 Initializing robust checkout...", {
      userId: user.id,
      bookId,
      isCartCheckout,
      cartItemsLength: cartItems.length,
    });

    dispatch({
      type: "SET_LOADING",
      payload: { key: "initialization", value: true },
    });
    dispatch({ type: "SET_ERROR", payload: null });

    try {
      let checkoutItems: CheckoutItem[] = [];

      // Load book data
      if (isCartCheckout && cartItems.length > 0) {
        console.log("📦 Processing cart items...");
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
                seller: item.seller || {
                  id: item.sellerId || "",
                  name: item.sellerName || "Unknown",
                  email: "",
                },
              }
            );
          } catch (error) {
            console.error("Error processing cart item:", item.id, error);
            return null;
          }
        });

        const resolvedItems = await Promise.all(cartPromises);
        checkoutItems = resolvedItems.filter(
          (item): item is CheckoutItem => item !== null,
        );
      } else if (bookId) {
        console.log("📖 Loading single book data...", bookId);
        const book = await loadBookData(bookId);
        if (!book) {
          dispatch({ type: "SET_ERROR", payload: "Book not found" });
          return;
        }
        if (book.seller?.id === user.id) {
          dispatch({
            type: "SET_ERROR",
            payload: "You cannot purchase your own book",
          });
          return;
        }
        checkoutItems = [book];
      }

      if (checkoutItems.length === 0) {
        dispatch({ type: "SET_ERROR", payload: "No items to checkout" });
        return;
      }

      // Validate all items
      const itemValidationErrors: string[] = [];
      checkoutItems.forEach((item, index) => {
        const errors = validationUtils.validateCheckoutItem(item);
        errors.forEach((error) => {
          itemValidationErrors.push(`Item ${index + 1}: ${error}`);
        });
      });

      if (itemValidationErrors.length > 0) {
        dispatch({
          type: "SET_ERROR",
          payload: itemValidationErrors.join("; "),
        });
        return;
      }

      // Check for multiple sellers (not supported yet)
      const uniqueSellers = new Set(
        checkoutItems.map((item) => item.seller.id),
      );
      if (uniqueSellers.size > 1) {
        dispatch({
          type: "SET_ERROR",
          payload:
            "Multiple seller checkout is not yet supported. Please checkout items from one seller at a time.",
        });
        return;
      }

      console.log("✅ Loaded checkout items:", checkoutItems.length);
      dispatch({ type: "SET_ITEMS", payload: checkoutItems });

      // Validate seller
      const sellerId = checkoutItems[0].seller.id;
      if (sellerId) {
        const sellerValidation = await validateSeller(sellerId);
        dispatch({ type: "SET_VALIDATION", payload: sellerValidation });

        if (!sellerValidation.canProceed) {
          dispatch({
            type: "SET_ERROR",
            payload: `Seller validation failed: ${sellerValidation.errors.join(", ")}`,
          });
          return;
        }
      }

      // Load buyer address
      try {
        console.log("📍 Loading buyer address...");
        dispatch({
          type: "SET_LOADING",
          payload: { key: "addressLoading", value: true },
        });

        const addressData = await getUserAddresses(user.id);
        if (addressData?.shipping_address) {
          const addr = addressData.shipping_address;
          const buyerAddress: CheckoutAddress = {
            street: addr.street || "",
            city: addr.city || "",
            province: addr.province || "",
            postalCode: addr.postalCode || "",
            country: "South Africa",
          };

          const addressErrors = validationUtils.validateAddress(buyerAddress);
          if (addressErrors.length === 0) {
            dispatch({ type: "SET_BUYER_ADDRESS", payload: buyerAddress });
            dispatch({ type: "ADD_COMPLETED_STEP", payload: "shipping" });
            console.log("✅ Address loaded and validated successfully");
          } else {
            console.log(
              "⚠️ Saved address has validation issues:",
              addressErrors,
            );
          }
        }
      } catch (error) {
        console.warn("Address loading failed:", error);
      } finally {
        dispatch({
          type: "SET_LOADING",
          payload: { key: "addressLoading", value: false },
        });
      }

      console.log("🎉 Checkout initialization complete!");
    } catch (error) {
      console.error("💥 Checkout initialization error:", error);
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
        payload: { key: "initialization", value: false },
      });
    }
  }, [
    user?.id,
    bookId,
    cartItems,
    isCartCheckout,
    loadBookData,
    validateSeller,
  ]);

  // ✅ FIXED: Calculate delivery quotes with proper error handling
  const fetchDeliveryQuotes = useCallback(async () => {
    if (!state.buyerAddress || state.items.length === 0) return;

    dispatch({
      type: "SET_LOADING",
      payload: { key: "deliveryQuotes", value: true },
    });

    try {
      console.log("🚛 Fetching delivery quotes...");

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

      const fromAddress = {
        streetAddress: sellerAddresses[0].street,
        suburb: sellerAddresses[0].city,
        city: sellerAddresses[0].city,
        province: sellerAddresses[0].province,
        postalCode: sellerAddresses[0].postalCode,
      };

      const toAddress = {
        streetAddress: state.buyerAddress.street,
        suburb: state.buyerAddress.city,
        city: state.buyerAddress.city,
        province: state.buyerAddress.province,
        postalCode: state.buyerAddress.postalCode,
      };

      const quotes = await getDeliveryQuotes(
        fromAddress,
        toAddress,
        state.items.length,
      );

      // Validate quotes
      const validQuotes = quotes.filter((quote) => {
        const errors = validationUtils.validateDeliveryQuote(quote);
        return errors.length === 0;
      });

      dispatch({ type: "SET_DELIVERY_QUOTES", payload: validQuotes });

      // Auto-select the first (usually cheapest) option
      if (validQuotes.length > 0) {
        dispatch({ type: "SET_SELECTED_DELIVERY", payload: validQuotes[0] });
        dispatch({ type: "ADD_COMPLETED_STEP", payload: "delivery" });
      }

      console.log("✅ Delivery quotes loaded:", validQuotes.length);
    } catch (error) {
      console.error("Error fetching delivery quotes:", error);
      toast.error("Failed to get delivery quotes. Please try again.");
    } finally {
      dispatch({
        type: "SET_LOADING",
        payload: { key: "deliveryQuotes", value: false },
      });
    }
  }, [state.buyerAddress, state.items]);

  // ✅ FIXED: Calculate order summary when data changes
  useEffect(() => {
    if (state.items.length > 0) {
      const subtotal = state.items.reduce(
        (total, item) => total + item.price,
        0,
      );
      const deliveryFee = state.selectedDelivery?.price || 0;
      const platformFee = subtotal * 0.1; // 10% platform fee
      const sellerAmount = subtotal * 0.9; // 90% to seller
      const totalAmount = subtotal + deliveryFee;

      const breakdown = [
        `Books (${state.items.length}): ${currencyUtils.formatRands(subtotal)}`,
        ...(deliveryFee > 0
          ? [`Delivery: ${currencyUtils.formatRands(deliveryFee)}`]
          : []),
        `Platform fee (10%): ${currencyUtils.formatRands(platformFee)}`,
        `Seller receives: ${currencyUtils.formatRands(sellerAmount)}`,
        `Total: ${currencyUtils.formatRands(totalAmount)}`,
      ];

      const orderSummary: CheckoutOrderSummary = {
        subtotal,
        deliveryFee,
        totalAmount,
        platformFee,
        sellerAmount,
        breakdown,
      };

      dispatch({ type: "SET_ORDER_SUMMARY", payload: orderSummary });
    }
  }, [state.items, state.selectedDelivery]);

  // ✅ FIXED: Step navigation with validation
  const canProceedToStep = useCallback(
    (step: CheckoutStep): boolean => {
      switch (step) {
        case "shipping":
          return state.items.length > 0;
        case "delivery":
          return state.buyerAddress !== null;
        case "payment":
          return state.selectedDelivery !== null;
        case "confirmation":
          return state.paymentReference !== null;
        default:
          return false;
      }
    },
    [
      state.items.length,
      state.buyerAddress,
      state.selectedDelivery,
      state.paymentReference,
    ],
  );

  const goToStep = useCallback(
    (step: CheckoutStep) => {
      if (canProceedToStep(step)) {
        dispatch({ type: "SET_STEP", payload: step });

        // Trigger actions when entering specific steps
        if (
          step === "delivery" &&
          state.buyerAddress &&
          state.deliveryQuotes.length === 0
        ) {
          fetchDeliveryQuotes();
        }
      } else {
        toast.error("Please complete the current step first");
      }
    },
    [
      canProceedToStep,
      state.buyerAddress,
      state.deliveryQuotes.length,
      fetchDeliveryQuotes,
    ],
  );

  const nextStep = useCallback(() => {
    const stepOrder: CheckoutStep[] = [
      "items",
      "shipping",
      "delivery",
      "payment",
    ];
    const currentIndex = stepOrder.indexOf(state.currentStep);
    if (currentIndex < stepOrder.length - 1) {
      const nextStepValue = stepOrder[currentIndex + 1];
      dispatch({ type: "ADD_COMPLETED_STEP", payload: state.currentStep });
      goToStep(nextStepValue);
    }
  }, [state.currentStep, goToStep]);

  const previousStep = useCallback(() => {
    const stepOrder: CheckoutStep[] = [
      "items",
      "shipping",
      "delivery",
      "payment",
    ];
    const currentIndex = stepOrder.indexOf(state.currentStep);
    if (currentIndex > 0) {
      dispatch({ type: "SET_STEP", payload: stepOrder[currentIndex - 1] });
    }
  }, [state.currentStep]);

  // ✅ FIXED: Process payment success with proper error handling
  const processPaymentSuccess = useCallback(
    async (reference: string) => {
      dispatch({
        type: "SET_LOADING",
        payload: { key: "payment", value: true },
      });
      dispatch({ type: "SET_PAYMENT_REFERENCE", payload: reference });

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
        dispatch({ type: "ADD_COMPLETED_STEP", payload: "payment" });

        toast.success("Payment successful! Order confirmed.");

        return {
          success: true,
          saleData: {
            bookTitle:
              state.items.length > 1
                ? `${state.items.length} books`
                : state.items[0].title,
            bookPrice: state.orderSummary?.totalAmount || 0,
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
    [state.items, state.orderSummary, user],
  );

  // Initialize on mount
  useEffect(() => {
    initializeCheckout();
  }, [initializeCheckout]);

  // Return both state and actions
  const actions: CheckoutActions = {
    goToStep,
    nextStep,
    previousStep,
    canProceedToStep,
    setBuyerAddress: (address: CheckoutAddress) =>
      dispatch({ type: "SET_BUYER_ADDRESS", payload: address }),
    setSelectedDelivery: (delivery: CheckoutDeliveryQuote) =>
      dispatch({ type: "SET_SELECTED_DELIVERY", payload: delivery }),
    initializeCheckout,
    fetchDeliveryQuotes,
    processPaymentSuccess,
    validateCurrentStep: async () => state.validation,
    validateSeller,
    validateBuyer: async () => ({
      isValid: true,
      errors: [],
      warnings: [],
      canProceed: true,
    }),
    resetCheckout: () => dispatch({ type: "RESET_CHECKOUT" }),
    setError: (error: string | null) =>
      dispatch({ type: "SET_ERROR", payload: error }),
  };

  return {
    ...state,
    ...actions,
  };
};

// Standardized checkout types to fix interface inconsistencies

export interface CheckoutAddress {
  street: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  phone?: string;
}

export interface CheckoutSeller {
  id: string;
  name: string;
  email: string;
  subaccount_code?: string;
  banking_verified?: boolean;
  pickup_address?: CheckoutAddress;
}

export interface CheckoutItem {
  id: string;
  title: string;
  author: string;
  price: number; // Always in Rands (not cents)
  condition: string;
  category: string;
  imageUrl: string;
  seller: CheckoutSeller;
  // Optional fields for additional data
  frontCover?: string;
  backCover?: string;
  availability?: string;
  sold?: boolean;
}

export interface CheckoutDeliveryQuote {
  courier: string;
  serviceName: string;
  price: number; // Always in Rands (not cents)
  estimatedDays: number;
  serviceCode?: string;
  trackingUrl?: string;
}

export interface CheckoutOrderSummary {
  subtotal: number; // In Rands
  deliveryFee: number; // In Rands
  totalAmount: number; // In Rands
  platformFee: number; // In Rands
  sellerAmount: number; // In Rands
  breakdown: string[];
}

export interface CheckoutValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  canProceed: boolean;
}

export type CheckoutStep =
  | "items"
  | "shipping"
  | "delivery"
  | "payment"
  | "confirmation";

export interface CheckoutState {
  // Current step and progression
  currentStep: CheckoutStep;
  completedSteps: CheckoutStep[];

  // Core data
  items: CheckoutItem[];
  buyerAddress: CheckoutAddress | null;
  sellerAddress: CheckoutAddress | null;

  // Delivery
  deliveryQuotes: CheckoutDeliveryQuote[];
  selectedDelivery: CheckoutDeliveryQuote | null;

  // Order summary
  orderSummary: CheckoutOrderSummary | null;

  // Loading states
  loading: {
    initialization: boolean;
    addressLoading: boolean;
    deliveryQuotes: boolean;
    payment: boolean;
    validation: boolean;
  };

  // Error handling
  error: string | null;
  validation: CheckoutValidation;

  // Metadata
  isCartCheckout: boolean;
  paymentReference: string | null;
}

export interface CheckoutActions {
  // Navigation
  goToStep: (step: CheckoutStep) => void;
  nextStep: () => void;
  previousStep: () => void;
  canProceedToStep: (step: CheckoutStep) => boolean;

  // Data setters
  setBuyerAddress: (address: CheckoutAddress) => void;
  setSelectedDelivery: (delivery: CheckoutDeliveryQuote) => void;

  // Operations
  initializeCheckout: () => Promise<void>;
  fetchDeliveryQuotes: () => Promise<void>;
  processPaymentSuccess: (
    reference: string,
  ) => Promise<{ success: boolean; error?: string }>;

  // Validation
  validateCurrentStep: () => Promise<CheckoutValidation>;
  validateSeller: (sellerId: string) => Promise<CheckoutValidation>;
  validateBuyer: () => Promise<CheckoutValidation>;

  // Utilities
  resetCheckout: () => void;
  setError: (error: string | null) => void;
}

// Payment-specific types
export interface PaymentData {
  amount: number; // In cents for Paystack
  bookIds: string[];
  sellerId: string;
  shippingAddress: CheckoutAddress;
  deliveryMethod: "pickup" | "delivery";
  deliveryFee: number; // In cents for Paystack
  reference: string;
}

export interface PaymentResult {
  success: boolean;
  reference?: string;
  authorizationUrl?: string;
  error?: string;
  orderId?: string;
}

// Utility functions for consistent currency conversion
export const currencyUtils = {
  // Convert Rands to cents for Paystack
  randsToKobo: (rands: number): number => Math.round(rands * 100),

  // Convert cents from Paystack to Rands
  koboToRands: (kobo: number): number => kobo / 100,

  // Format currency display
  formatRands: (rands: number): string => `R${rands.toFixed(2)}`,

  // Validate currency amount
  isValidAmount: (amount: number): boolean => {
    return typeof amount === "number" && amount >= 0 && Number.isFinite(amount);
  },
};

// Validation utilities
export const validationUtils = {
  validateAddress: (address: CheckoutAddress): string[] => {
    const errors: string[] = [];

    if (!address.street?.trim()) errors.push("Street address is required");
    if (!address.city?.trim()) errors.push("City is required");
    if (!address.province?.trim()) errors.push("Province is required");
    if (!address.postalCode?.trim()) errors.push("Postal code is required");

    // South African postal code validation
    if (address.postalCode && !/^\d{4}$/.test(address.postalCode.trim())) {
      errors.push("Postal code must be 4 digits");
    }

    return errors;
  },

  validateCheckoutItem: (item: CheckoutItem): string[] => {
    const errors: string[] = [];

    if (!item.id) errors.push("Book ID is required");
    if (!item.title?.trim()) errors.push("Book title is required");
    if (!currencyUtils.isValidAmount(item.price) || item.price <= 0) {
      errors.push("Valid price is required");
    }
    if (!item.seller?.id) errors.push("Seller information is required");

    return errors;
  },

  validateDeliveryQuote: (quote: CheckoutDeliveryQuote): string[] => {
    const errors: string[] = [];

    if (!quote.courier?.trim()) errors.push("Courier name is required");
    if (!quote.serviceName?.trim()) errors.push("Service name is required");
    if (!currencyUtils.isValidAmount(quote.price) || quote.price < 0) {
      errors.push("Valid delivery price is required");
    }
    if (!quote.estimatedDays || quote.estimatedDays <= 0) {
      errors.push("Valid estimated delivery days required");
    }

    return errors;
  },
};

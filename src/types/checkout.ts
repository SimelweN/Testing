// Updated checkout types for the new step-based checkout system

export interface CheckoutAddress {
  street: string;
  city: string;
  province: string;
  postal_code: string;
  country: string;
  phone?: string;
  additional_info?: string;
}

export interface CheckoutBook {
  id: string;
  title: string;
  author: string;
  price: number;
  condition: string;
  isbn?: string;
  image_url?: string;
  seller_id: string;
  seller_name?: string;
  seller_subaccount_code?: string;
  seller?: {
    id: string;
    name: string;
    email: string;
    hasAddress: boolean;
    hasSubaccount: boolean;
    isReadyForOrders: boolean;
  };
}

export interface DeliveryOption {
  courier: "courier-guy" | "fastway";
  service_name: string;
  price: number;
  estimated_days: number;
  description: string;
  zone_type?: "local" | "provincial" | "national";
}

export interface OrderSummary {
  book: CheckoutBook;
  delivery: DeliveryOption;
  buyer_address: CheckoutAddress;
  seller_address: CheckoutAddress;
  book_price: number;
  delivery_price: number;
  total_price: number;
}

export interface OrderConfirmation {
  order_id: string;
  payment_reference: string;
  book_id: string;
  seller_id: string;
  buyer_id: string;
  book_title: string;
  book_price: number;
  delivery_method: string;
  delivery_price: number;
  total_paid: number;
  created_at: string;
  status: string;
}

export interface CheckoutState {
  step: {
    current: 1 | 2 | 3 | 4;
    completed: number[];
  };
  book: CheckoutBook | null;
  buyer_address: CheckoutAddress | null;
  seller_address: CheckoutAddress | null;
  delivery_options: DeliveryOption[];
  selected_delivery: DeliveryOption | null;
  order_summary: OrderSummary | null;
  loading: boolean;
  error: string | null;
}

// Legacy types for backward compatibility
export interface CheckoutSeller {
  id: string;
  name: string;
  email: string;
  subaccount_code?: string;
  pickup_address?: CheckoutAddress;
}

export interface CheckoutItem {
  id: string;
  title: string;
  author: string;
  price: number;
  condition: string;
  category: string;
  imageUrl: string;
  seller: CheckoutSeller;
  frontCover?: string;
  backCover?: string;
  availability?: string;
  sold?: boolean;
}

export interface CheckoutDeliveryQuote {
  courier: string;
  serviceName: string;
  price: number;
  estimatedDays: number;
  serviceCode?: string;
  trackingUrl?: string;
}

export interface CheckoutOrderSummary {
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  platformFee: number;
  sellerAmount: number;
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

export interface CheckoutActions {
  goToStep: (step: CheckoutStep) => void;
  nextStep: () => void;
  previousStep: () => void;
  canProceedToStep: (step: CheckoutStep) => boolean;
  setBuyerAddress: (address: CheckoutAddress) => void;
  setSelectedDelivery: (delivery: CheckoutDeliveryQuote) => void;
  initializeCheckout: () => Promise<void>;
  fetchDeliveryQuotes: () => Promise<void>;
  processPaymentSuccess: (
    reference: string,
  ) => Promise<{ success: boolean; error?: string }>;
  validateCurrentStep: () => Promise<CheckoutValidation>;
  validateSeller: (sellerId: string) => Promise<CheckoutValidation>;
  validateBuyer: () => Promise<CheckoutValidation>;
  resetCheckout: () => void;
  setError: (error: string | null) => void;
}

export interface PaymentData {
  amount: number;
  bookIds: string[];
  sellerId: string;
  shippingAddress: CheckoutAddress;
  deliveryMethod: "pickup" | "delivery";
  deliveryFee: number;
  reference: string;
}

export interface PaymentResult {
  success: boolean;
  reference?: string;
  authorizationUrl?: string;
  error?: string;
  orderId?: string;
}

// Utility functions
export const currencyUtils = {
  randsToKobo: (rands: number): number => Math.round(rands * 100),
  koboToRands: (kobo: number): number => kobo / 100,
  formatRands: (rands: number): string => `R${rands.toFixed(2)}`,
  isValidAmount: (amount: number): boolean => {
    return typeof amount === "number" && amount >= 0 && Number.isFinite(amount);
  },
};

export const validationUtils = {
  validateAddress: (address: CheckoutAddress): string[] => {
    const errors: string[] = [];
    if (!address.street?.trim()) errors.push("Street address is required");
    if (!address.city?.trim()) errors.push("City is required");
    if (!address.province?.trim()) errors.push("Province is required");
    if (!address.postal_code?.trim()) errors.push("Postal code is required");
    if (address.postal_code && !/^\d{4}$/.test(address.postal_code.trim())) {
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

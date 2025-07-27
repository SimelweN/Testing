// Banking and Payment Types

export interface BankingDetails {
  id?: string;
  userId: string;
  businessName: string;
  email: string;
  phone?: string;
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountHolderName?: string;
  subaccountCode?: string;
  status: "pending" | "active" | "suspended" | "inactive";
  createdAt?: string;
  updatedAt?: string;
}

export interface BankingSubaccount {
  id: string;
  user_id: string;
  subaccount_code: string;
  business_name: string;
  bank_name: string;
  account_number: string;
  bank_code: string;
  email: string;
  status: "active" | "inactive" | "pending";
  created_at: string;
  updated_at?: string;
}

export interface Order {
  id: string;
  buyer_email: string;
  seller_id: string;
  amount: number; // in cents (ZAR)
  paystack_ref: string;
  status: "pending" | "paid" | "collected" | "cancelled";
  payment_held: boolean; // escrow system
  collection_deadline?: string;
  shipping_address?: ShippingAddress;
  metadata?: OrderMetadata;
  created_at: string;
  updated_at?: string;
}

export interface ShippingAddress {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  phoneNumber: string;
}

export interface OrderMetadata {
  books: Array<{
    id: string;
    title: string;
    price: number;
    quantity: number;
  }>;
  delivery_fee?: number;
  delivery_method: "pickup" | "delivery";
  special_instructions?: string;
}



export interface PaymentInitialization {
  email: string;
  amount: number; // in kobo (cents)
  reference: string;
  subaccount?: string;
  metadata?: {
    order_id: string;
    seller_id: string;
    subaccount_code?: string;
    books: Array<{
      id: string;
      title: string;
      price: number;
    }>;
  };
  callback_url?: string;
  channels?: string[];
  currency?: "ZAR";
}

export interface PaymentVerificationResponse {
  status: string;
  reference: string;
  amount: number;
  gateway_response: string;
  paid_at: string;
  created_at: string;
  channel: string;
  currency: string;
  ip_address?: string;
  metadata?: any;
  fees?: number;
  customer?: {
    email: string;
    first_name?: string;
    last_name?: string;
  };
  authorization?: {
    authorization_code: string;
    card_type: string;
    last4: string;
    exp_month: string;
    exp_year: string;
    bin: string;
    bank: string;
    channel: string;
    signature: string;
    reusable: boolean;
    country_code: string;
  };
}

export interface SubaccountCreationRequest {
  business_name: string;
  bank_code: string;
  account_number: string;
  email: string;
  percentage_charge?: number;
  primary_contact_email?: string;
  primary_contact_name?: string;
  primary_contact_phone?: string;
  metadata?: any;
}

export interface SubaccountCreationResponse {
  status: boolean;
  message: string;
  data: {
    subaccount_code: string;
    business_name: string;
    description?: string;
    primary_contact_name?: string;
    primary_contact_email: string;
    primary_contact_phone?: string;
    metadata?: any;
    percentage_charge: number;
    is_verified: boolean;
    settlement_bank: string;
    account_number: string;
    settlement_schedule: string;
    active: boolean;
    migrate: boolean;
    id: number;
    createdAt: string;
    updatedAt: string;
  };
}

export interface BankingFormData {
  businessName: string;
  email: string;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  confirmAccountNumber: string;
}

export interface BankingValidationErrors {
  businessName?: string;
  email?: string;
  bankName?: string;
  accountNumber?: string;
  accountHolderName?: string;
  confirmAccountNumber?: string;
  general?: string;
}

export interface SellerRequirements {
  hasBankingSetup: boolean;
  hasPickupAddress: boolean;
  hasActiveBooks: boolean;
  canReceivePayments: boolean;
  setupCompletionPercentage: number;
}

export interface BankingRequirementsStatus {
  hasBankingInfo: boolean;
  hasPickupAddress: boolean;
  isVerified: boolean;
  canListBooks: boolean;
  missingRequirements: string[];
}

export interface PaymentSummary {
  subtotal: number;
  deliveryFee: number;
  platformFee: number;
  total: number;
  sellerReceives: number;
}

// Enums for better type safety
export enum OrderStatus {
  PENDING = "pending",
  PAID = "paid",
  COLLECTED = "collected",
  CANCELLED = "cancelled",
}



export enum BankingStatusEnum {
  PENDING = "pending",
  ACTIVE = "active",
  SUSPENDED = "suspended",
  INACTIVE = "inactive",
}

export enum DeliveryMethod {
  PICKUP = "pickup",
  DELIVERY = "delivery",
}

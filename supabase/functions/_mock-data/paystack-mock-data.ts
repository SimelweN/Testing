/**
 * Comprehensive Mock Data for Paystack Edge Functions
 * Includes complete mock data for all required fields to ensure proper testing
 */

// Complete User Mock Data
export const mockUser = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  email: "test.user@example.com",
  first_name: "John",
  last_name: "Doe",
  phone: "+27123456789",
  created_at: "2024-01-01T00:00:00.000Z",
  updated_at: "2024-01-01T00:00:00.000Z",
  email_verified: true,
  phone_verified: false,
  profile_complete: true,
};

// Complete Book Mock Data
export const mockBook = {
  id: "book-550e8400-e29b-41d4-a716-446655440001",
  title: "Introduction to Computer Science",
  author: "Jane Smith",
  isbn: "9781234567890",
  price: 299.99,
  condition: "good",
  description: "Well-maintained textbook with minimal highlighting",
  seller_id: mockUser.id,
  university: "University of Cape Town",
  course: "Computer Science",
  category: "textbooks",
  images: ["https://example.com/book1.jpg", "https://example.com/book2.jpg"],
  available: true,
  created_at: "2024-01-01T00:00:00.000Z",
  updated_at: "2024-01-01T00:00:00.000Z",
  location: "Cape Town",
  year_published: 2023,
  edition: "5th Edition",
  pickup_location: "UCT Campus",
};

// Complete Shipping Address Mock Data
export const mockShippingAddress = {
  id: "addr-550e8400-e29b-41d4-a716-446655440002",
  user_id: mockUser.id,
  recipient_name: "John Doe",
  street_address: "123 Main Street",
  suburb: "Gardens",
  city: "Cape Town",
  province: "Western Cape",
  postal_code: "8001",
  country: "South Africa",
  phone: "+27123456789",
  email: "test.user@example.com",
  special_instructions: "Please ring the doorbell",
  is_default: true,
  created_at: "2024-01-01T00:00:00.000Z",
  updated_at: "2024-01-01T00:00:00.000Z",
};

// Complete Payment Data for Initialize Paystack Payment
export const mockInitializePaymentData = {
  user_id: mockUser.id,
  email: mockUser.email,
  amount: 29999, // Amount in kobo (R299.99)
  currency: "ZAR",
  reference:
    "TXN_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9),
  callback_url: "https://rebookedsolutions.co.za/payment/callback",
  metadata: {
    book_id: mockBook.id,
    book_title: mockBook.title,
    seller_id: mockBook.seller_id,
    buyer_id: mockUser.id,
    delivery_fee: 8500, // R85.00 in kobo
    platform_fee: 1500, // R15.00 in kobo
    seller_amount: 19999, // R199.99 in kobo
    order_type: "book_purchase",
    shipping_address: mockShippingAddress,
  },
  channels: ["card", "bank", "ussd", "qr", "mobile_money", "bank_transfer"],
};

// Complete Paystack Webhook Event Data
export const mockPaystackWebhookEvent = {
  event: "charge.success",
  data: {
    id: 302961,
    domain: "live",
    status: "success",
    reference: mockInitializePaymentData.reference,
    amount: 29999,
    currency: "ZAR",
    paid_at: "2024-01-01T12:00:00.000Z",
    created_at: "2024-01-01T11:55:00.000Z",
    channel: "card",
    ip_address: "41.57.87.37",
    metadata: mockInitializePaymentData.metadata,
    log: {
      time_spent: 16,
      attempts: 1,
      authentication: "pin",
      errors: 0,
      success: true,
      mobile: false,
      input: [],
      channel: null,
      history: [
        {
          type: "input",
          message: "Filled these fields: card number, cvv, expiry",
          time: 15,
        },
        {
          type: "action",
          message: "Attempted to pay",
          time: 15,
        },
        {
          type: "auth",
          message: "Authentication Required: pin",
          time: 16,
        },
        {
          type: "input",
          message: "Filled these fields: pin",
          time: 16,
        },
        {
          type: "action",
          message: "Attempted to pay",
          time: 16,
        },
        {
          type: "success",
          message: "Successfully paid",
          time: 16,
        },
      ],
    },
    fees: 1466,
    customer: {
      id: 84312,
      first_name: mockUser.first_name,
      last_name: mockUser.last_name,
      email: mockUser.email,
      customer_code: "CUS_xnxdt6s1zg5f4nx",
      phone: mockUser.phone,
      metadata: {},
      risk_action: "default",
    },
    authorization: {
      authorization_code: "AUTH_pmx3mgawyd",
      bin: "539983",
      last4: "8381",
      exp_month: "10",
      exp_year: "2030",
      card_type: "mastercard DEBIT",
      bank: "Guaranty Trust Bank",
      country_code: "ZA",
      brand: "mastercard",
      reusable: true,
      signature: "SIG_uSYN4fv1adlAuoduLkQA",
      account_name: "JOHN DOE",
    },
    plan: {},
    subaccount: {
      id: 40809,
      subaccount_code: "ACCT_8f4s1eq7ml6rlzj",
      business_name: "John Doe Books",
      description: "Subaccount for book seller John Doe",
      primary_contact_email:
        mockBook.seller_id + "@sellers.rebookedsolutions.co.za",
      primary_contact_name: "John Doe",
      primary_contact_phone: "+27123456789",
      metadata: {
        seller_id: mockBook.seller_id,
      },
      percentage_charge: 85.5, // 85.5% goes to seller
    },
  },
};

// Complete Order Mock Data
export const mockOrder = {
  id: "order-550e8400-e29b-41d4-a716-446655440003",
  user_id: mockUser.id,
  book_id: mockBook.id,
  seller_id: mockBook.seller_id,
  payment_reference: mockInitializePaymentData.reference,
  status: "pending_confirmation",
  total_amount: 299.99,
  delivery_fee: 85.0,
  platform_fee: 15.0,
  seller_amount: 199.99,
  shipping_address: mockShippingAddress,
  delivery_details: {
    courier: "courier_guy",
    tracking_number: "CG123456789ZA",
    estimated_delivery: "2024-01-05",
    delivery_instructions: "Ring doorbell",
  },
  payment_status: "completed",
  payment_method: "card",
  created_at: "2024-01-01T00:00:00.000Z",
  updated_at: "2024-01-01T00:00:00.000Z",
  expires_at: "2024-01-08T00:00:00.000Z",
};

// Complete Banking/Subaccount Mock Data
export const mockBankingDetails = {
  id: "banking-550e8400-e29b-41d4-a716-446655440004",
  user_id: mockUser.id,
  business_name: "John Doe Books",
  account_number: "1234567890",
  bank_code: "058", // GTBank
  bank_name: "Guaranty Trust Bank",
  account_name: "John Doe",
  bvn: "12345678901",
  percentage_charge: 85.5,
  subaccount_code: "ACCT_8f4s1eq7ml6rlzj",
  subaccount_id: "40809",
  is_active: true,
  verified: true,
  created_at: "2024-01-01T00:00:00.000Z",
  updated_at: "2024-01-01T00:00:00.000Z",
};

// Complete Book Purchase Mock Data
export const mockBookPurchaseData = {
  user_id: mockUser.id,
  book_id: mockBook.id,
  email: mockUser.email,
  shipping_address: mockShippingAddress,
  payment_reference: mockInitializePaymentData.reference,
  total_amount: 299.99,
  delivery_details: {
    courier_service: "courier_guy",
    delivery_option: "door_to_door",
    estimated_delivery_days: 3,
    tracking_enabled: true,
    insurance_included: true,
    delivery_fee: 85.0,
  },
};

// Complete Multi-Seller Purchase Mock Data
export const mockMultiSellerPurchaseData = {
  user_id: mockUser.id,
  email: mockUser.email,
  items: [
    {
      book_id: mockBook.id,
      seller_id: mockBook.seller_id,
      price: 199.99,
      delivery_fee: 85.0,
      seller_subaccount: "ACCT_8f4s1eq7ml6rlzj",
    },
    {
      book_id: "book-550e8400-e29b-41d4-a716-446655440005",
      seller_id: "550e8400-e29b-41d4-a716-446655440006",
      price: 149.99,
      delivery_fee: 85.0,
      seller_subaccount: "ACCT_9f5s2fq8nm7smk8",
    },
  ],
  shipping_address: mockShippingAddress,
  payment_reference: "MULTI_TXN_" + Date.now(),
  total_amount: 519.98,
  total_delivery_fee: 170.0,
  platform_fee: 30.0,
};

// Complete Refund Mock Data
export const mockRefundData = {
  transaction_reference: mockInitializePaymentData.reference,
  amount: 29999, // Full refund in kobo
  reason: "Book not as described",
  user_id: mockUser.id,
  order_id: mockOrder.id,
  refund_type: "full", // or "partial"
  admin_notes: "Customer reported book condition not matching description",
  customer_email: mockUser.email,
};

// Complete Health Check Mock Data
export const mockHealthCheckData = {
  health: true,
  timestamp: new Date().toISOString(),
  service: "paystack-webhook",
  version: "1.0.0",
  environment: "test",
};

// Headers for testing (including Paystack webhook signature)
export const mockHeaders = {
  "Content-Type": "application/json",
  "x-paystack-signature":
    "t=1704067200,v1=7fd7b5b2a86e4c5a1f9d8e3b2c4a5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6",
  "user-agent": "Paystack/1.0 (+https://paystack.com/)",
  accept: "application/json",
};

// Export all mock data for easy access
export const PaystackMockData = {
  user: mockUser,
  book: mockBook,
  shippingAddress: mockShippingAddress,
  initializePayment: mockInitializePaymentData,
  webhookEvent: mockPaystackWebhookEvent,
  order: mockOrder,
  banking: mockBankingDetails,
  bookPurchase: mockBookPurchaseData,
  multiSellerPurchase: mockMultiSellerPurchaseData,
  refund: mockRefundData,
  healthCheck: mockHealthCheckData,
  headers: mockHeaders,
};

console.log("✅ Paystack Mock Data loaded with complete field coverage");

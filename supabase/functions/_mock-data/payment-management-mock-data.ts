/**
 * Comprehensive Mock Data for Payment Management Edge Functions
 * Includes complete mock data for refunds, transfers, splits, and verification
 */

// Complete Paystack Refund Management Mock Data
export const mockRefundManagementData = {
  action: "initiate_refund", // or "check_status", "cancel_refund"
  transaction_reference: "TXN_1704067200_abc123xyz",
  refund_amount: 29999, // Full amount in kobo (R299.99)
  refund_reason: "book_not_as_described",
  customer_reason:
    "The book condition was listed as 'good' but received 'poor' condition with pages missing",
  merchant_notes: "Customer complaint verified, proceeding with full refund",
  refund_type: "full", // or "partial"
  order_id: "order-550e8400-e29b-41d4-a716-446655440002",
  customer_id: "550e8400-e29b-41d4-a716-446655440008",
  seller_id: "550e8400-e29b-41d4-a716-446655440000",
  notification_settings: {
    notify_customer: true,
    notify_seller: true,
    notify_admin: true,
    email_customer: true,
    email_seller: true,
  },
  metadata: {
    refund_initiated_by: "admin",
    original_payment_method: "card",
    dispute_id: "DISP_123456789",
    admin_user: "admin@rebookedsolutions.co.za",
    timestamp: "2024-01-05T10:00:00.000Z",
  },
};

// Complete Paystack Transfer Management Mock Data
export const mockTransferManagementData = {
  action: "initiate_transfer", // or "verify_transfer", "list_transfers"
  recipient_code: "RCP_8f4s1eq7ml6rlzj",
  amount: 19999, // Amount in kobo (R199.99)
  currency: "ZAR",
  reason: "book_sale_payout",
  reference:
    "TRANSFER_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9),
  source: "balance", // or "subaccount"
  recipient_details: {
    type: "nuban",
    name: "John Doe",
    account_number: "1234567890",
    bank_code: "058",
    bank_name: "Guaranty Trust Bank",
    currency: "ZAR",
  },
  metadata: {
    order_id: "order-550e8400-e29b-41d4-a716-446655440002",
    seller_id: "550e8400-e29b-41d4-a716-446655440000",
    book_id: "book-550e8400-e29b-41d4-a716-446655440001",
    book_title: "Introduction to Computer Science",
    sale_date: "2024-01-01T00:00:00.000Z",
    delivery_confirmed: true,
    delivery_date: "2024-01-04T10:30:00.000Z",
    platform_fee_deducted: 1500, // R15.00 in kobo
    delivery_fee_deducted: 8500, // R85.00 in kobo
  },
};

// Complete Paystack Split Management Mock Data
export const mockSplitManagementData = {
  action: "create_split", // or "update_split", "fetch_split"
  name: "Multi-Seller Book Order Split",
  type: "percentage", // or "flat"
  currency: "ZAR",
  subaccounts: [
    {
      subaccount: "ACCT_8f4s1eq7ml6rlzj",
      share: 6500, // 65% (seller 1)
      description: "Seller 1 - Computer Science Book",
      metadata: {
        seller_id: "550e8400-e29b-41d4-a716-446655440000",
        book_id: "book-550e8400-e29b-41d4-a716-446655440001",
        book_price: 29999,
      },
    },
    {
      subaccount: "ACCT_9f5s2fq8nm7smk8",
      share: 2500, // 25% (seller 2)
      description: "Seller 2 - Mathematics Book",
      metadata: {
        seller_id: "550e8400-e29b-41d4-a716-446655440001",
        book_id: "book-550e8400-e29b-41d4-a716-446655440002",
        book_price: 24999,
      },
    },
  ],
  bearer_type: "account", // or "subaccount", "all", "all-proportional"
  bearer_subaccount: "ACCT_platform_main",
  metadata: {
    order_id: "order-550e8400-e29b-41d4-a716-446655440010",
    buyer_id: "550e8400-e29b-41d4-a716-446655440008",
    total_amount: 54998, // Combined book prices
    platform_share: 1000, // 10% platform fee
    created_by: "multi_seller_checkout",
    order_type: "multi_seller_purchase",
  },
};

// Complete Payment Verification Mock Data
export const mockPaymentVerificationData = {
  reference: "TXN_1704067200_abc123xyz",
  verify_metadata: true,
  check_order_status: true,
  update_order_on_success: true,
  send_confirmation_email: true,
  expected_amount: 29999, // Amount in kobo for validation
  expected_currency: "ZAR",
  order_context: {
    order_id: "order-550e8400-e29b-41d4-a716-446655440002",
    buyer_id: "550e8400-e29b-41d4-a716-446655440008",
    seller_id: "550e8400-e29b-41d4-a716-446655440000",
    book_id: "book-550e8400-e29b-41d4-a716-446655440001",
  },
};

// Complete Payment Verification Response Mock Data
export const mockPaymentVerificationResponse = {
  success: true,
  payment_verified: true,
  transaction_data: {
    id: 302961,
    domain: "live",
    status: "success",
    reference: "TXN_1704067200_abc123xyz",
    amount: 29999,
    currency: "ZAR",
    paid_at: "2024-01-01T12:00:00.000Z",
    created_at: "2024-01-01T11:55:00.000Z",
    channel: "card",
    fees: 1466,
    customer: {
      id: 84312,
      email: "buyer@example.com",
      customer_code: "CUS_xnxdt6s1zg5f4nx",
    },
    authorization: {
      authorization_code: "AUTH_pmx3mgawyd",
      bin: "539983",
      last4: "8381",
      exp_month: "10",
      exp_year: "2030",
      card_type: "mastercard DEBIT",
      bank: "Guaranty Trust Bank",
    },
  },
  order_updated: true,
  email_sent: true,
  metadata_validation: {
    book_id_match: true,
    seller_id_match: true,
    amount_match: true,
    currency_match: true,
  },
  next_actions: [
    "notify_seller",
    "create_shipping_label",
    "start_commit_timer",
  ],
  timestamp: "2024-01-01T12:05:00.000Z",
};

// Complete Transfer Response Mock Data
export const mockTransferResponse = {
  success: true,
  transfer_code: "TRF_vsyqdmlzble3uii",
  amount: 19999,
  currency: "ZAR",
  reference: "TRANSFER_1704067200_def456ghi",
  status: "pending",
  reason: "book_sale_payout",
  recipient: {
    name: "John Doe",
    account_number: "1234567890",
    bank_code: "058",
    bank_name: "Guaranty Trust Bank",
  },
  transfer_date: "2024-01-05T00:00:00.000Z",
  estimated_arrival: "2024-01-05T16:00:00.000Z",
  fees: 50, // Transfer fee in kobo
  metadata: {
    order_id: "order-550e8400-e29b-41d4-a716-446655440002",
    seller_id: "550e8400-e29b-41d4-a716-446655440000",
  },
};

// Complete Refund Response Mock Data
export const mockRefundResponse = {
  success: true,
  refund_reference: "REFUND_1704153600_abc789xyz",
  status: "pending",
  amount_refunded: 29999,
  currency: "ZAR",
  transaction_reference: "TXN_1704067200_abc123xyz",
  refund_method: "card",
  estimated_settlement: "2024-01-07T00:00:00.000Z",
  customer_notification_sent: true,
  seller_notification_sent: true,
  fees_refunded: 1466,
  net_refund_amount: 28533, // Amount minus fees
  refund_reason: "book_not_as_described",
  processed_by: "admin@rebookedsolutions.co.za",
  timestamp: "2024-01-05T12:00:00.000Z",
};

// Complete Split Response Mock Data
export const mockSplitResponse = {
  success: true,
  split_code: "SPL_e7jnRKjtzd",
  name: "Multi-Seller Book Order Split",
  type: "percentage",
  currency: "ZAR",
  subaccounts: [
    {
      subaccount: "ACCT_8f4s1eq7ml6rlzj",
      share: 6500,
    },
    {
      subaccount: "ACCT_9f5s2fq8nm7smk8",
      share: 2500,
    },
  ],
  bearer_type: "account",
  bearer_subaccount: "ACCT_platform_main",
  active: true,
  created_at: "2024-01-01T00:00:00.000Z",
  updated_at: "2024-01-01T00:00:00.000Z",
};

// Complete Error Responses Mock Data
export const mockPaymentErrors = {
  invalid_reference: {
    success: false,
    error_code: "INVALID_REFERENCE",
    error_message: "Transaction reference not found",
    reference_provided: "INVALID_REF_123",
    timestamp: "2024-01-01T12:00:00.000Z",
  },
  insufficient_balance: {
    success: false,
    error_code: "INSUFFICIENT_BALANCE",
    error_message: "Insufficient balance for transfer",
    available_balance: 1000,
    requested_amount: 19999,
    currency: "ZAR",
    timestamp: "2024-01-01T12:00:00.000Z",
  },
  refund_window_expired: {
    success: false,
    error_code: "REFUND_WINDOW_EXPIRED",
    error_message: "Refund window has expired for this transaction",
    transaction_date: "2023-11-01T12:00:00.000Z",
    days_elapsed: 65,
    max_refund_days: 60,
    timestamp: "2024-01-01T12:00:00.000Z",
  },
};

// Export all payment management mock data
export const PaymentManagementMockData = {
  refundManagement: mockRefundManagementData,
  transferManagement: mockTransferManagementData,
  splitManagement: mockSplitManagementData,
  paymentVerification: mockPaymentVerificationData,
  responses: {
    verification: mockPaymentVerificationResponse,
    transfer: mockTransferResponse,
    refund: mockRefundResponse,
    split: mockSplitResponse,
  },
  errors: mockPaymentErrors,
};

console.log(
  "✅ Payment Management Mock Data loaded with complete field coverage",
);

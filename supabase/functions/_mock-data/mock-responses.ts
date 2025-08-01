/**
 * Mock Responses for Edge Functions
 * Contains realistic mock responses for all edge functions
 */

export const MockResponses = {
  "commit-to-sale": {
    success: true,
    message: "Order committed successfully",
    order_id: "ORD_test_456",
    status: "committed",
    pickup_scheduled: true,
    email_sent: true,
    committed_at: new Date().toISOString(),
    estimated_delivery: "2-3 business days"
  },

  "decline-commit": {
    success: true,
    message: "Order commitment declined and refund processed",
    order_id: "ORD_test_decline",
    status: "declined",
    refund_processed: true,
    refund_amount: 34999,
    refund_reference: "REFUND_test_" + Date.now(),
    reason: "book_not_available",
    email_sent: true
  },

  "mark-collected": {
    success: true,
    message: "Order marked as collected and payment processed",
    order_id: "ORD_collected_test",
    status: "collected",
    collected_at: new Date().toISOString(),
    tracking_number: "TRK_test_123456789",
    payment_processed: true,
    seller_payout_amount: 19999,
    courier_service: "courier_guy"
  },

  // "pay-seller": removed - no automated seller payments

  "process-book-purchase": {
    success: true,
    message: "Book purchase processed successfully",
    transaction_id: "txn_test_" + Date.now(),
    order_id: "ORD_test_book_purchase",
    book_id: "book_test_123",
    buyer_id: "USR_test_buyer_456",
    seller_id: "USR_test_seller_789",
    amount: 34999,
    status: "pending_commit",
    payment_reference: "test_ref_" + Date.now(),
    emails_sent: true,
    expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
  },

  "process-multi-seller-purchase": {
    success: true,
    message: "Multi-seller purchase processed successfully",
    orders_created: 2,
    total_amount: 64998,
    orders: [
      {
        order_id: "550e8400-e29b-41d4-a716-446655440010",
        seller_id: "550e8400-e29b-41d4-a716-446655440003",
        amount: 34999,
        status: "pending_commit",
        book_count: 1
      },
      {
        order_id: "550e8400-e29b-41d4-a716-446655440011",
        seller_id: "550e8400-e29b-41d4-a716-446655440004",
        amount: 29999,
        status: "pending_commit",
        book_count: 1
      }
    ],
    buyer_id: "550e8400-e29b-41d4-a716-446655440000",
    payment_reference: "TXN_" + Date.now(),
    emails_sent: 2,
    split_payments: true
  },

  "create-order": {
    success: true,
    message: "Order(s) created successfully",
    orders_created: 1,
    orders: [
      {
        order_id: "ORD_test_create_order",
        seller_id: "USR_test_seller_order",
        buyer_id: "USR_test_buyer_order",
        status: "pending_commit",
        total_amount: 34999,
        items_count: 1,
        expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
      }
    ],
    notifications_sent: true,
    payment_reference: "test_ref_" + Date.now()
  },

  "create-paystack-subaccount": {
    success: true,
    message: "Paystack subaccount created successfully",
    subaccount_code: "ACCT_" + Date.now(),
    business_name: "John's Textbook Store",
    account_number: "0123456789",
    bank_code: "058",
    bank_name: "Standard Bank",
    currency: "ZAR",
    percentage_charge: 2.5,
    is_verified: false,
    active: true,
    created_at: new Date().toISOString()
  },

  "verify-paystack-payment": {
    success: true,
    message: "Payment verified successfully",
    reference: "bk_" + Date.now() + "_test_use",
    amount: 34999,
    currency: "ZAR",
    status: "success",
    paid_at: new Date().toISOString(),
    customer: {
      email: "buyer@example.com",
      first_name: "John",
      last_name: "Buyer"
    },
    transaction_id: "123456789",
    order_created: true,
    order_id: "550e8400-e29b-41d4-a716-446655440002"
  },

  "paystack-webhook": {
    success: true,
    message: "Webhook processed successfully",
    event: "charge.success.test",
    reference: "test_ref_" + Date.now(),
    amount: 34999,
    status: "success",
    order_created: true,
    order_id: "550e8400-e29b-41d4-a716-446655440002",
    processed_at: new Date().toISOString(),
    signature_verified: true,
    test_mode: true
  },

  "process-order-reminders": {
    success: true,
    message: "Order reminders processed successfully",
    reminders_sent: 3,
    orders_processed: [
      {
        order_id: "550e8400-e29b-41d4-a716-446655440020",
        seller_id: "550e8400-e29b-41d4-a716-446655440021",
        reminder_type: "24_hour_warning",
        email_sent: true,
        expires_in_hours: 24
      },
      {
        order_id: "550e8400-e29b-41d4-a716-446655440022",
        seller_id: "550e8400-e29b-41d4-a716-446655440023",
        reminder_type: "final_warning",
        email_sent: true,
        expires_in_hours: 6
      }
    ],
    total_pending_orders: 15,
    processed_at: new Date().toISOString()
  },

  // "paystack-transfer-management": removed - no automated transfers

  "manage-paystack-subaccount": {
    success: true,
    message: "Subaccount managed successfully",
    action: "update",
    subaccount_code: "ACCT_test_" + Date.now(),
    business_name: "Test Business Updated",
    settlement_bank: "058",
    account_number: "0123456789",
    percentage_charge: 2.5,
    active: true,
    updated_at: new Date().toISOString()
  },

  "paystack-split-management": {
    success: true,
    message: "Split payment configured successfully",
    split_code: "SPL_test_" + Date.now(),
    name: "Test Split Payment",
    type: "percentage",
    currency: "ZAR",
    subaccounts: [
      {
        subaccount: "ACCT_test_1",
        share: 70
      },
      {
        subaccount: "ACCT_test_2",
        share: 30
      }
    ],
    active: true,
    created_at: new Date().toISOString()
  }
};

/**
 * Get mock response for a function
 */
export function getMockResponse(functionName: string) {
  return MockResponses[functionName as keyof typeof MockResponses];
}

/**
 * Create a standardized mock response
 */
export function createMockResponse(functionName: string, additionalData: any = {}) {
  const baseResponse = getMockResponse(functionName);
  if (!baseResponse) {
    return {
      success: true,
      message: `Mock response for ${functionName}`,
      function_name: functionName,
      simulated: true,
      timestamp: new Date().toISOString(),
      ...additionalData
    };
  }

  return {
    ...baseResponse,
    simulated: true,
    timestamp: new Date().toISOString(),
    ...additionalData
  };
}

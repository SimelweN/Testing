/**
 * Comprehensive Mock Data for Commit System Edge Functions
 * Includes complete mock data for all commit-related operations
 */

// Complete Commit to Sale Mock Data
export const mockCommitToSaleData = {
  order_id: "order-550e8400-e29b-41d4-a716-446655440002",
  seller_id: "550e8400-e29b-41d4-a716-446655440000",
  book_id: "book-550e8400-e29b-41d4-a716-446655440001",
  commit_notes: "Ready to ship immediately",
  estimated_ship_date: "2024-01-03T00:00:00.000Z",
  tracking_preference: "email_and_sms",
  special_instructions: "Handle with care - textbook",
};

// Complete Decline Commit Mock Data
export const mockDeclineCommitData = {
  order_id: "order-550e8400-e29b-41d4-a716-446655440002",
  seller_id: "550e8400-e29b-41d4-a716-446655440000",
  decline_reason: "book_damaged",
  decline_notes: "Book was damaged during storage, cannot fulfill order",
  offer_alternative: false,
  refund_immediately: true,
};

// Complete Auto Expire Commits Mock Data - No input needed, but response structure
export const mockAutoExpireResponse = {
  success: true,
  expired_orders_count: 3,
  processed_orders: [
    {
      order_id: "order-550e8400-e29b-41d4-a716-446655440003",
      seller_id: "550e8400-e29b-41d4-a716-446655440001",
      buyer_id: "550e8400-e29b-41d4-a716-446655440004",
      refund_amount: 299.99,
      refund_reference: "REFUND_AUTO_EXPIRE_123",
      notification_sent: true,
    },
  ],
  timestamp: "2024-01-03T12:00:00.000Z",
};

// Complete Check Expired Orders Mock Data
export const mockCheckExpiredOrdersResponse = {
  success: true,
  expired_orders: [
    {
      id: "order-550e8400-e29b-41d4-a716-446655440005",
      buyer_id: "550e8400-e29b-41d4-a716-446655440006",
      seller_id: "550e8400-e29b-41d4-a716-446655440007",
      book_id: "book-550e8400-e29b-41d4-a716-446655440008",
      created_at: "2024-01-01T00:00:00.000Z",
      expires_at: "2024-01-03T00:00:00.000Z",
      hours_overdue: 24,
      amount: 199.99,
      buyer_email: "buyer@example.com",
      seller_email: "seller@example.com",
      book_title: "Advanced Mathematics Textbook",
    },
  ],
  total_expired: 1,
  total_amount_to_refund: 199.99,
  timestamp: "2024-01-04T00:00:00.000Z",
};

// Complete Order Creation Cart Item Mock Data
export const mockCartItems = [
  {
    book_id: "book-550e8400-e29b-41d4-a716-446655440001",
    title: "Introduction to Computer Science",
    author: "Jane Smith",
    price: 299.99,
    seller_id: "550e8400-e29b-41d4-a716-446655440000",
    condition: "good",
    isbn: "9781234567890",
    quantity: 1,
    delivery_fee: 85.0,
    seller_amount: 199.99,
    platform_fee: 15.0,
  },
  {
    book_id: "book-550e8400-e29b-41d4-a716-446655440002",
    title: "Calculus for Engineers",
    author: "Bob Johnson",
    price: 249.99,
    seller_id: "550e8400-e29b-41d4-a716-446655440001",
    condition: "excellent",
    isbn: "9789876543210",
    quantity: 1,
    delivery_fee: 85.0,
    seller_amount: 164.99,
    platform_fee: 15.0,
  },
];

// Complete Create Order Mock Data
export const mockCreateOrderData = {
  buyer_id: "550e8400-e29b-41d4-a716-446655440008",
  user_id: "550e8400-e29b-41d4-a716-446655440008", // Alternative field
  buyer_email: "buyer@example.com",
  email: "buyer@example.com", // Alternative field
  cart_items: mockCartItems,
  items: mockCartItems, // Alternative field
  shipping_address: {
    id: "addr-550e8400-e29b-41d4-a716-446655440009",
    recipient_name: "Jane Buyer",
    street_address: "456 Oak Avenue",
    suburb: "Claremont",
    city: "Cape Town",
    province: "Western Cape",
    postal_code: "7708",
    country: "South Africa",
    phone: "+27987654321",
    email: "buyer@example.com",
    special_instructions: "Apartment 4B, call before delivery",
  },
  payment_reference:
    "TXN_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9),
  total_amount: 719.98, // Sum of both books + delivery fees
  payment_data: {
    payment_method: "card",
    payment_status: "completed",
    transaction_id: "PAY_123456789",
    gateway: "paystack",
    gateway_response: "success",
    paid_at: "2024-01-01T12:00:00.000Z",
  },
};

// Complete Mark Collected Mock Data
export const mockMarkCollectedData = {
  order_id: "order-550e8400-e29b-41d4-a716-446655440002",
  seller_id: "550e8400-e29b-41d4-a716-446655440000",
  collection_method: "courier_pickup",
  tracking_number: "CG123456789ZA",
  collection_date: "2024-01-03T14:00:00.000Z",
  collection_notes: "Package collected by Courier Guy at 2PM",
  collector_name: "Courier Guy Driver",
  collector_id: "CG_DRIVER_001",
  estimated_delivery: "2024-01-04T10:00:00.000Z",
};

// Complete Process Order Reminders Mock Data
export const mockProcessRemindersResponse = {
  success: true,
  reminders_sent: 5,
  reminder_details: [
    {
      order_id: "order-550e8400-e29b-41d4-a716-446655440010",
      seller_id: "550e8400-e29b-41d4-a716-446655440011",
      reminder_type: "first_reminder",
      hours_until_expiry: 24,
      email_sent: true,
      sms_sent: false,
      notification_created: true,
    },
    {
      order_id: "order-550e8400-e29b-41d4-a716-446655440012",
      seller_id: "550e8400-e29b-41d4-a716-446655440013",
      reminder_type: "final_reminder",
      hours_until_expiry: 6,
      email_sent: true,
      sms_sent: true,
      notification_created: true,
    },
  ],
  timestamp: "2024-01-02T12:00:00.000Z",
};

// Complete Pay Seller Mock Data
export const mockPaySellerData = {
  order_id: "order-550e8400-e29b-41d4-a716-446655440002",
  seller_id: "550e8400-e29b-41d4-a716-446655440000",
  amount: 19999, // Amount in kobo (R199.99)
  reason: "book_delivered",
  subaccount_code: "ACCT_8f4s1eq7ml6rlzj",
  transfer_reference: "TRANSFER_" + Date.now(),
  delivery_confirmation: {
    delivered_at: "2024-01-04T10:30:00.000Z",
    delivery_method: "courier",
    tracking_number: "CG123456789ZA",
    recipient_signature: true,
    proof_of_delivery_url:
      "https://tracking.courierguy.co.za/pod/CG123456789ZA.pdf",
  },
};

// Export all commit system mock data
export const CommitSystemMockData = {
  commitToSale: mockCommitToSaleData,
  declineCommit: mockDeclineCommitData,
  autoExpire: mockAutoExpireResponse,
  checkExpired: mockCheckExpiredOrdersResponse,
  cartItems: mockCartItems,
  createOrder: mockCreateOrderData,
  markCollected: mockMarkCollectedData,
  processReminders: mockProcessRemindersResponse,
  paySeller: mockPaySellerData,
};

console.log("✅ Commit System Mock Data loaded with complete field coverage");

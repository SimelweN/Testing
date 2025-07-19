/**
 * Comprehensive Mock Data for Supabase Edge Functions
 * Includes complete mock data for all required fields to ensure proper testing
 */

// Complete User Profile Mock Data
export const mockUserProfile = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  email: "test.user@example.com",
  first_name: "John",
  last_name: "Doe",
  phone: "+27123456789",
  university: "University of Cape Town",
  student_number: "STUUCT001",
  year_of_study: 2,
  course: "Computer Science",
  profile_picture_url: "https://example.com/profile.jpg",
  bio: "Computer Science student passionate about technology",
  location: "Cape Town",
  email_verified: true,
  phone_verified: false,
  profile_complete: true,
  last_active: "2024-01-01T12:00:00.000Z",
  created_at: "2024-01-01T00:00:00.000Z",
  updated_at: "2024-01-01T00:00:00.000Z",
  preferences: {
    email_notifications: true,
    sms_notifications: false,
    marketing_emails: true,
    delivery_updates: true,
  },
  address: {
    street: "123 Main Street",
    suburb: "Gardens",
    city: "Cape Town",
    province: "Western Cape",
    postal_code: "8001",
    country: "South Africa",
  },
};

// Complete Book Listing Mock Data
export const mockBookListing = {
  id: "book-550e8400-e29b-41d4-a716-446655440001",
  title: "Introduction to Computer Science",
  author: "Jane Smith",
  isbn: "9781234567890",
  price: 299.99,
  original_price: 450.0,
  condition: "good",
  description:
    "Well-maintained textbook with minimal highlighting. All pages intact, no missing sections.",
  seller_id: mockUserProfile.id,
  university: "University of Cape Town",
  course: "Computer Science",
  course_code: "CSC1015F",
  faculty: "Engineering & Built Environment",
  department: "Computer Science",
  category: "textbooks",
  subcategory: "programming",
  images: [
    "https://example.com/book1.jpg",
    "https://example.com/book2.jpg",
    "https://example.com/book3.jpg",
  ],
  available: true,
  featured: false,
  views_count: 25,
  favorites_count: 3,
  created_at: "2024-01-01T00:00:00.000Z",
  updated_at: "2024-01-01T00:00:00.000Z",
  expires_at: "2024-04-01T00:00:00.000Z",
  location: "Cape Town",
  year_published: 2023,
  edition: "5th Edition",
  publisher: "Pearson Education",
  language: "English",
  pages: 720,
  pickup_location: "UCT Campus - Computer Science Building",
  pickup_instructions: "Available weekdays 9am-5pm",
  negotiable: true,
  urgent_sale: false,
  tags: ["programming", "algorithms", "data-structures", "textbook"],
  condition_notes:
    "Highlighting in chapters 3-5, otherwise excellent condition",
};

// Complete Order/Transaction Mock Data
export const mockOrder = {
  id: "order-550e8400-e29b-41d4-a716-446655440002",
  buyer_id: "550e8400-e29b-41d4-a716-446655440007",
  seller_id: mockUserProfile.id,
  book_id: mockBookListing.id,
  status: "pending_confirmation",
  payment_status: "completed",
  payment_reference: "TXN_1704067200_abc123xyz",
  payment_method: "card",
  amount: 299.99,
  delivery_fee: 85.0,
  platform_fee: 15.0,
  seller_amount: 199.99,
  currency: "ZAR",
  created_at: "2024-01-01T00:00:00.000Z",
  updated_at: "2024-01-01T00:00:00.000Z",
  expires_at: "2024-01-08T00:00:00.000Z",
  confirmed_at: null,
  shipped_at: null,
  delivered_at: null,
  cancelled_at: null,
  refunded_at: null,
  buyer_email: "buyer@example.com",
  seller_email: mockUserProfile.email,
  shipping_address: {
    id: "addr-550e8400-e29b-41d4-a716-446655440008",
    recipient_name: "Jane Buyer",
    street_address: "456 Oak Avenue",
    suburb: "Claremont",
    city: "Cape Town",
    province: "Western Cape",
    postal_code: "7708",
    country: "South Africa",
    phone: "+27987654321",
    email: "buyer@example.com",
    special_instructions: "Please call before delivery",
  },
  delivery_details: {
    courier: "courier_guy",
    service_type: "overnight",
    tracking_number: "CG123456789ZA",
    estimated_delivery: "2024-01-05T10:00:00.000Z",
    delivery_instructions: "Ring doorbell, apartment 4B",
    insurance_value: 299.99,
    weight_kg: 1.2,
    dimensions: {
      length: 25,
      width: 20,
      height: 3,
    },
  },
  notes: {
    buyer_notes: "Please handle with care",
    seller_notes: "Book packed securely",
    admin_notes: "Order processed successfully",
  },
};

// Complete Commit System Mock Data
export const mockCommitData = {
  id: "commit-550e8400-e29b-41d4-a716-446655440003",
  order_id: mockOrder.id,
  seller_id: mockUserProfile.id,
  book_id: mockBookListing.id,
  committed: false,
  commit_deadline: "2024-01-03T23:59:59.000Z",
  created_at: "2024-01-01T00:00:00.000Z",
  updated_at: "2024-01-01T00:00:00.000Z",
  committed_at: null,
  declined_at: null,
  expired_at: null,
  reminder_sent_at: "2024-01-02T10:00:00.000Z",
  final_reminder_sent_at: null,
  auto_decline_reason: null,
  seller_response: null,
  commit_notes: null,
  penalty_applied: false,
  penalty_amount: 0,
  reputation_impact: 0,
};

// Complete Email Verification Mock Data
export const mockEmailData = {
  to: mockUserProfile.email,
  from: "noreply@rebookedsolutions.co.za",
  reply_to: "support@rebookedsolutions.co.za",
  subject: "Welcome to ReBooked Solutions",
  template_id: "welcome_email",
  template_data: {
    user_name: `${mockUserProfile.first_name} ${mockUserProfile.last_name}`,
    verification_link:
      "https://rebookedsolutions.co.za/verify?token=abc123xyz789",
    login_link: "https://rebookedsolutions.co.za/login",
    support_email: "support@rebookedsolutions.co.za",
    unsubscribe_link:
      "https://rebookedsolutions.co.za/unsubscribe?token=def456uvw012",
  },
  metadata: {
    user_id: mockUserProfile.id,
    email_type: "verification",
    template_version: "v2.1",
    tracking_enabled: true,
  },
};

// Complete Delivery/Shipping Mock Data
export const mockDeliveryQuote = {
  id: "quote-550e8400-e29b-41d4-a716-446655440004",
  order_id: mockOrder.id,
  courier_service: "courier_guy",
  service_type: "overnight",
  collection_address: {
    street: "123 Main Street",
    suburb: "Gardens",
    city: "Cape Town",
    province: "Western Cape",
    postal_code: "8001",
    country: "South Africa",
  },
  delivery_address: mockOrder.shipping_address,
  package_details: {
    weight_kg: 1.2,
    length_cm: 25,
    width_cm: 20,
    height_cm: 3,
    value_rand: 299.99,
    fragile: false,
    description: "Textbook - Introduction to Computer Science",
  },
  quote_details: {
    base_rate: 75.0,
    fuel_surcharge: 8.5,
    insurance_fee: 1.5,
    total_cost: 85.0,
    currency: "ZAR",
    estimated_delivery_days: 1,
    estimated_collection_time: "2024-01-02T14:00:00.000Z",
    estimated_delivery_time: "2024-01-03T10:00:00.000Z",
  },
  created_at: "2024-01-01T00:00:00.000Z",
  expires_at: "2024-01-01T23:59:59.000Z",
  accepted: false,
  tracking_enabled: true,
  insurance_included: true,
  signature_required: true,
};

// Complete Banking/Subaccount Mock Data
export const mockBankingData = {
  id: "banking-550e8400-e29b-41d4-a716-446655440005",
  user_id: mockUserProfile.id,
  business_name: "John Doe Books",
  business_type: "individual",
  account_number: "1234567890",
  bank_code: "058",
  bank_name: "Guaranty Trust Bank",
  account_name: "John Doe",
  bvn: "12345678901",
  id_number: "9001015009088",
  phone: mockUserProfile.phone,
  email: mockUserProfile.email,
  address: mockUserProfile.address,
  percentage_charge: 85.5,
  flat_fee: 0,
  subaccount_code: "ACCT_8f4s1eq7ml6rlzj",
  subaccount_id: "40809",
  paystack_customer_code: "CUS_xnxdt6s1zg5f4nx",
  is_active: true,
  verified: true,
  verification_documents: {
    id_document_url: "https://example.com/id.pdf",
    bank_statement_url: "https://example.com/statement.pdf",
    proof_of_address_url: "https://example.com/address.pdf",
  },
  created_at: "2024-01-01T00:00:00.000Z",
  updated_at: "2024-01-01T00:00:00.000Z",
  verified_at: "2024-01-01T12:00:00.000Z",
  last_payout_at: "2024-01-15T00:00:00.000Z",
  total_earnings: 1250.75,
  pending_balance: 199.99,
  available_balance: 1050.76,
};

// Complete Notification Mock Data
export const mockNotification = {
  id: "notif-550e8400-e29b-41d4-a716-446655440006",
  user_id: mockUserProfile.id,
  type: "order_received",
  title: "New Order Received",
  message:
    "You have received a new order for 'Introduction to Computer Science'",
  data: {
    order_id: mockOrder.id,
    book_id: mockBookListing.id,
    buyer_name: "Jane Buyer",
    amount: 299.99,
    action_required: true,
    deadline: "2024-01-03T23:59:59.000Z",
  },
  read: false,
  action_url: `/orders/${mockOrder.id}`,
  priority: "high",
  category: "order_management",
  created_at: "2024-01-01T00:00:00.000Z",
  read_at: null,
  expires_at: "2024-01-31T00:00:00.000Z",
};

// Complete Activity Log Mock Data
export const mockActivityLog = {
  id: "activity-550e8400-e29b-41d4-a716-446655440007",
  user_id: mockUserProfile.id,
  action: "book_listed",
  description: "Listed a new book: Introduction to Computer Science",
  resource_type: "book",
  resource_id: mockBookListing.id,
  metadata: {
    book_title: mockBookListing.title,
    price: mockBookListing.price,
    category: mockBookListing.category,
    ip_address: "41.57.87.37",
    user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  },
  created_at: "2024-01-01T00:00:00.000Z",
  severity: "info",
  source: "web_app",
  session_id: "sess_abc123xyz789",
};

// Complete Health Check Mock Data
export const mockHealthCheck = {
  status: "healthy",
  timestamp: "2024-01-01T12:00:00.000Z",
  service: "supabase-functions",
  version: "1.0.0",
  environment: "production",
  database: {
    connected: true,
    latency_ms: 12,
    pool_size: 10,
    active_connections: 3,
  },
  external_services: {
    paystack: "connected",
    email_service: "connected",
    delivery_services: {
      courier_guy: "connected",
      fastway: "connected",
      shiplogic: "connected",
    },
  },
  memory_usage: "45MB",
  uptime_seconds: 86400,
  request_count_24h: 1250,
  error_rate_24h: "0.02%",
};

// Export all mock data for easy access
export const SupabaseMockData = {
  userProfile: mockUserProfile,
  bookListing: mockBookListing,
  order: mockOrder,
  commit: mockCommitData,
  email: mockEmailData,
  delivery: mockDeliveryQuote,
  banking: mockBankingData,
  notification: mockNotification,
  activityLog: mockActivityLog,
  healthCheck: mockHealthCheck,
};

console.log("✅ Supabase Mock Data loaded with complete field coverage");

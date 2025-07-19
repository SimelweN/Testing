/**
 * Comprehensive Mock Data for Email and Authentication Edge Functions
 * Includes complete mock data for all email templates and auth operations
 */

// Complete Email Request Mock Data for send-email function
export const mockEmailRequest = {
  to: "recipient@example.com",
  from: "noreply@rebookedsolutions.co.za",
  reply_to: "support@rebookedsolutions.co.za",
  subject: "Welcome to ReBooked Solutions",
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to ReBooked Solutions</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to ReBooked Solutions</h1>
        <p style="color: #f0f0f0; margin: 10px 0 0; font-size: 16px;">Your trusted textbook marketplace</p>
      </div>
      <div style="background: white; padding: 30px; border: 1px solid #ddd; border-top: none;">
        <h2 style="color: #333; margin-top: 0;">Hi John Doe,</h2>
        <p>Welcome to ReBooked Solutions! We're excited to have you join our community of students buying and selling textbooks.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://rebookedsolutions.co.za/verify?token=abc123xyz789" 
             style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            Verify Your Email
          </a>
        </div>
        <p>If you have any questions, feel free to reach out to our support team.</p>
        <p>Best regards,<br>The ReBooked Solutions Team</p>
      </div>
      <div style="background: #f8f9fa; padding: 20px; text-align: center; border: 1px solid #ddd; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="margin: 0; font-size: 12px; color: #666;">
          <a href="https://rebookedsolutions.co.za/unsubscribe?token=def456uvw012" style="color: #666;">Unsubscribe</a> |
          <a href="https://rebookedsolutions.co.za/contact" style="color: #666;">Contact Support</a>
        </p>
      </div>
    </body>
    </html>
  `,
  text: "Welcome to ReBooked Solutions! Please verify your email by visiting: https://rebookedsolutions.co.za/verify?token=abc123xyz789",
  template_data: {
    user_name: "John Doe",
    user_email: "recipient@example.com",
    verification_link:
      "https://rebookedsolutions.co.za/verify?token=abc123xyz789",
    unsubscribe_link:
      "https://rebookedsolutions.co.za/unsubscribe?token=def456uvw012",
    support_email: "support@rebookedsolutions.co.za",
  },
  priority: "normal",
  tags: ["welcome", "verification", "onboarding"],
  metadata: {
    user_id: "550e8400-e29b-41d4-a716-446655440000",
    email_type: "welcome_verification",
    template_version: "v2.1",
    campaign_id: "WELCOME_2024_Q1",
    tracking_enabled: true,
    delivery_time: "immediate",
  },
};

// Complete Email Templates Mock Data
export const mockEmailTemplates = {
  welcome: {
    subject: "Welcome to ReBooked Solutions",
    template_id: "welcome_template_v2",
    variables: ["user_name", "verification_link", "support_email"],
  },
  order_confirmation: {
    subject: "Order Confirmation - {{book_title}}",
    template_id: "order_confirmation_v2",
    variables: [
      "user_name",
      "book_title",
      "order_id",
      "total_amount",
      "tracking_link",
    ],
  },
  commit_reminder: {
    subject: "Action Required: Confirm Your Sale",
    template_id: "commit_reminder_v2",
    variables: [
      "seller_name",
      "book_title",
      "buyer_name",
      "deadline",
      "commit_link",
    ],
  },
  payment_received: {
    subject: "Payment Received - {{book_title}}",
    template_id: "payment_received_v2",
    variables: [
      "seller_name",
      "book_title",
      "amount",
      "payout_date",
      "dashboard_link",
    ],
  },
  book_delivered: {
    subject: "Book Delivered Successfully",
    template_id: "delivery_confirmation_v2",
    variables: [
      "buyer_name",
      "book_title",
      "delivery_date",
      "rate_seller_link",
    ],
  },
};

// Complete Debug Email Template Mock Data
export const mockDebugEmailData = {
  template_name: "order_confirmation",
  recipient_email: "test@example.com",
  test_data: {
    user_name: "Test User",
    book_title: "Introduction to Computer Science",
    order_id: "order-550e8400-e29b-41d4-a716-446655440002",
    total_amount: "R299.99",
    tracking_link:
      "https://rebookedsolutions.co.za/track/order-550e8400-e29b-41d4-a716-446655440002",
    seller_name: "John Doe",
    buyer_name: "Jane Smith",
    deadline: "2024-01-03T23:59:59.000Z",
    commit_link:
      "https://rebookedsolutions.co.za/orders/order-550e8400-e29b-41d4-a716-446655440002/commit",
  },
  send_actual_email: false,
  return_html_preview: true,
  include_text_version: true,
};

// Complete Subaccount Creation Mock Data
export const mockSubaccountCreationData = {
  business_name: "John Doe Books",
  bank_code: "058", // GTBank
  account_number: "1234567890",
  account_name: "John Doe",
  phone: "+27123456789",
  email: "seller@example.com",
  percentage_charge: 85.5, // 85.5% goes to seller
  description: "Subaccount for textbook seller John Doe",
  primary_contact_email: "seller@example.com",
  primary_contact_name: "John Doe",
  primary_contact_phone: "+27123456789",
  metadata: {
    user_id: "550e8400-e29b-41d4-a716-446655440000",
    business_type: "individual",
    registration_date: "2024-01-01T00:00:00.000Z",
    verification_status: "pending",
    kyc_level: "tier_1",
  },
  settlement_bank: "058",
  settlement_schedule: "auto",
};

// Complete Subaccount Management Mock Data
export const mockSubaccountManagementData = {
  action: "update", // or "activate", "deactivate", "delete"
  subaccount_code: "ACCT_8f4s1eq7ml6rlzj",
  updates: {
    business_name: "John Doe Educational Books",
    percentage_charge: 87.0,
    active: true,
    description: "Updated subaccount for educational textbook sales",
    metadata: {
      last_updated: "2024-01-15T00:00:00.000Z",
      update_reason: "Business name change",
      updated_by: "550e8400-e29b-41d4-a716-446655440000",
    },
  },
};

// Complete Authentication Headers Mock Data
export const mockAuthHeaders = {
  Authorization:
    "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNjQzNjE2MDAwLCJzdWIiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDAiLCJlbWFpbCI6InRlc3QudXNlckBleGFtcGxlLmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiXX0sInVzZXJfbWV0YWRhdGEiOnt9LCJyb2xlIjoiYXV0aGVudGljYXRlZCJ9.5n6z8S4jX9kG2hA8pF3vQ7sR4mW8nE1tY6uB7nC9xD0",
  "Content-Type": "application/json",
  apikey:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImticGpxemFxYnF1a3V0Zmx3aXhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1NjMzNzcsImV4cCI6MjA2MzEzOTM3N30.3EdAkGlyFv1JRaRw9OFMyA5AkkKoXp0hdX1bFWpLVMc",
  "x-client-info": "supabase-js/2.0.0",
};

// Complete Health Test Mock Data
export const mockHealthTestData = {
  service_name: "email-service",
  check_database: true,
  check_email_provider: true,
  check_external_apis: true,
  include_metrics: true,
  timestamp: "2024-01-01T12:00:00.000Z",
};

// Complete Health Test Response Mock Data
export const mockHealthTestResponse = {
  status: "healthy",
  timestamp: "2024-01-01T12:00:00.000Z",
  response_time_ms: 45,
  services: {
    database: {
      status: "healthy",
      latency_ms: 12,
      connections: {
        active: 3,
        idle: 7,
        total: 10,
      },
    },
    email_provider: {
      status: "healthy",
      provider: "smtp_gmail",
      last_successful_send: "2024-01-01T11:55:00.000Z",
      queue_size: 0,
    },
    external_apis: {
      paystack: {
        status: "healthy",
        latency_ms: 156,
        last_check: "2024-01-01T12:00:00.000Z",
      },
      delivery_services: {
        courier_guy: "healthy",
        fastway: "healthy",
        shiplogic: "degraded",
      },
    },
  },
  metrics: {
    requests_last_hour: 127,
    errors_last_hour: 2,
    avg_response_time_ms: 67,
    uptime_percentage: 99.8,
  },
  environment: "production",
  version: "2.1.0",
};

// Complete Error Response Mock Data
export const mockEmailErrorResponse = {
  success: false,
  error_code: "RATE_LIMIT_EXCEEDED",
  error_message: "Too many email requests from this sender",
  details: {
    current_rate: 15,
    limit: 10,
    window_ms: 60000,
    reset_time: "2024-01-01T12:01:00.000Z",
    retry_after_seconds: 45,
  },
  timestamp: "2024-01-01T12:00:00.000Z",
  request_id: "req_abc123xyz789",
};

// Export all email and auth mock data
export const EmailAuthMockData = {
  emailRequest: mockEmailRequest,
  emailTemplates: mockEmailTemplates,
  debugEmail: mockDebugEmailData,
  subaccountCreation: mockSubaccountCreationData,
  subaccountManagement: mockSubaccountManagementData,
  authHeaders: mockAuthHeaders,
  healthTest: mockHealthTestData,
  healthResponse: mockHealthTestResponse,
  errorResponse: mockEmailErrorResponse,
};

console.log("✅ Email & Auth Mock Data loaded with complete field coverage");

# Complete Edge Functions Guide

This document provides comprehensive information about all 24 Edge Functions in the ReBooked Solutions platform.

## Overview

Edge Functions are serverless TypeScript functions running on Supabase's global edge network. They handle server-side logic including payments, emails, delivery, and automation.

## Quick Access Testing

Use the Edge Function Tester at `/edge-function-test` to test all functions individually or in bulk.

---

## 📚 ORDER MANAGEMENT FUNCTIONS

### 1. create-order

**Purpose:** Creates new order(s) from cart items and sends notifications to buyers and sellers

**File:** `supabase/functions/create-order/index.ts`

**How it works:**

1. Receives cart items, groups by seller
2. Creates separate orders for each seller
3. Marks books as sold
4. Sends notification emails to both buyer and seller
5. Sets 48-hour expiration timer

**Request Body:**

```json
{
  "user_id": "buyer_uuid",
  "items": [
    {
      "book_id": "book_uuid",
      "seller_id": "seller_uuid",
      "price": 150,
      "title": "Book Title"
    }
  ],
  "total_amount": 150,
  "shipping_address": {
    "streetAddress": "123 Main St",
    "suburb": "Suburb",
    "city": "City",
    "province": "Province",
    "postalCode": "1234"
  },
  "payment_reference": "PAY_REF_123"
}
```

**Response:**

```json
{
  "success": true,
  "orders": [
    {
      "id": "ORD_timestamp_random",
      "buyer_id": "uuid",
      "seller_id": "uuid",
      "status": "pending_commit",
      "total_amount": 150,
      "expires_at": "2024-01-20T12:00:00Z"
    }
  ]
}
```

### 2. commit-to-sale

**Purpose:** Seller commits to fulfill an order, triggers delivery scheduling

**File:** `supabase/functions/commit-to-sale/index.ts`

**How it works:**

1. Updates order status to "committed"
2. Calls automate-delivery function
3. Sends confirmation emails to buyer and seller

**Request Body:**

```json
{
  "order_id": "ORD_123456",
  "seller_id": "seller_uuid"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Order committed successfully",
  "order_id": "ORD_123456",
  "status": "committed",
  "pickup_scheduled": true
}
```

### 3. decline-commit

**Purpose:** Seller declines an order, processes refund and notifications

**File:** `supabase/functions/decline-commit/index.ts`

**How it works:**

1. Updates order status to "declined"
2. Processes refund via Paystack
3. Makes books available again
4. Sends notification emails

**Request Body:**

```json
{
  "order_id": "ORD_123456",
  "seller_id": "seller_uuid",
  "reason": "Book no longer available"
}
```

### 4. mark-collected

**Purpose:** Marks order as delivered and triggers seller payment

**File:** `supabase/functions/mark-collected/index.ts`

**How it works:**

1. Updates order status to "delivered"
2. Calls pay-seller function
3. Sends delivery confirmation emails

**Request Body:**

```json
{
  "order_id": "ORD_123456",
  "tracking_number": "TRK789",
  "delivery_date": "2024-01-20T15:30:00Z"
}
```

### 5. process-book-purchase

**Purpose:** Handles single book purchase transaction

**File:** `supabase/functions/process-book-purchase/index.ts`

**Request Body:**

```json
{
  "book_id": "book_uuid",
  "buyer_id": "buyer_uuid",
  "seller_id": "seller_uuid",
  "amount": 150,
  "payment_reference": "PAY_REF_123"
}
```

### 6. process-multi-seller-purchase

**Purpose:** Handles cart purchases with books from multiple sellers

**File:** `supabase/functions/process-multi-seller-purchase/index.ts`

**Request Body:**

```json
{
  "buyer_id": "buyer_uuid",
  "items": [
    {
      "book_id": "book1_uuid",
      "seller_id": "seller1_uuid",
      "price": 100
    },
    {
      "book_id": "book2_uuid",
      "seller_id": "seller2_uuid",
      "price": 120
    }
  ],
  "total_amount": 220,
  "payment_reference": "PAY_MULTI_123"
}
```

---

## 💳 PAYMENT FUNCTIONS

### 7. initialize-paystack-payment

**Purpose:** Initializes Paystack payment with split configuration for multiple sellers

**File:** `supabase/functions/initialize-paystack-payment/index.ts`

**How it works:**

1. Gets seller subaccount information
2. Calculates 90% seller split (10% platform fee)
3. Creates Paystack payment initialization
4. Returns authorization URL

**Request Body:**

```json
{
  "user_id": "buyer_uuid",
  "items": [
    {
      "seller_id": "seller_uuid",
      "price": 150
    }
  ],
  "total_amount": 150,
  "email": "buyer@example.com",
  "shipping_address": {...}
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "authorization_url": "https://checkout.paystack.com/...",
    "reference": "paystack_ref_123",
    "access_code": "access_code_123"
  }
}
```

### 8. verify-paystack-payment

**Purpose:** Verifies Paystack payment status and processes order

**File:** `supabase/functions/verify-paystack-payment/index.ts`

**Request Body:**

```json
{
  "reference": "paystack_ref_123"
}
```

### 9. paystack-webhook

**Purpose:** Handles Paystack webhook events for real-time payment processing

**File:** `supabase/functions/paystack-webhook/index.ts`

**How it works:**

1. Verifies webhook signature
2. Processes different event types:
   - `charge.success`: Payment successful
   - `charge.failed`: Payment failed
   - `transfer.success`: Seller payment successful
   - `transfer.failed`: Seller payment failed

**Webhook Events Handled:**

```json
{
  "event": "charge.success",
  "data": {
    "reference": "paystack_ref_123",
    "amount": 15000,
    "status": "success"
  }
}
```

### 10. create-paystack-subaccount

**Purpose:** Creates Paystack subaccount for seller payment splitting

**File:** `supabase/functions/create-paystack-subaccount/index.ts`

**Request Body:**

```json
{
  "business_name": "Seller Business Name",
  "bank_code": "058",
  "account_number": "1234567890",
  "percentage_charge": 10.0,
  "description": "Seller subaccount"
}
```

### 11. pay-seller

**Purpose:** Processes payment to seller after successful delivery

**File:** `supabase/functions/pay-seller/index.ts`

**Request Body:**

```json
{
  "order_id": "ORD_123456",
  "seller_id": "seller_uuid",
  "amount": 135
}
```

---

## 🚚 DELIVERY FUNCTIONS

### 12. get-delivery-quotes

**Purpose:** Gets delivery quotes from multiple courier providers

**File:** `supabase/functions/get-delivery-quotes/index.ts`

**How it works:**

1. Calls both Fastway and Courier Guy APIs
2. Returns quotes from all available providers
3. Includes fallback quotes if APIs fail

**Request Body:**

```json
{
  "fromAddress": {
    "streetAddress": "123 Pickup St",
    "suburb": "Suburb",
    "city": "City",
    "province": "Province",
    "postalCode": "1234"
  },
  "toAddress": {
    "streetAddress": "456 Delivery Ave",
    "suburb": "Suburb",
    "city": "City",
    "province": "Province",
    "postalCode": "5678"
  },
  "weight": 0.5
}
```

**Response:**

```json
{
  "quotes": [
    {
      "courier": "fastway",
      "price": 85,
      "estimatedDays": 3,
      "serviceName": "Fastway Standard"
    },
    {
      "courier": "courier-guy",
      "price": 95,
      "estimatedDays": 2,
      "serviceName": "Courier Guy Express"
    }
  ]
}
```

### 13. courier-guy-quote

**Purpose:** Gets specific quote from Courier Guy API

**File:** `supabase/functions/courier-guy-quote/index.ts`

### 14. courier-guy-shipment

**Purpose:** Creates actual shipment with Courier Guy

**File:** `supabase/functions/courier-guy-shipment/index.ts`

### 15. courier-guy-track

**Purpose:** Tracks Courier Guy shipment by tracking number

**File:** `supabase/functions/courier-guy-track/index.ts`

**How it works:**

1. Calls Courier Guy tracking API
2. Formats tracking events
3. Returns current status and history

**Request Body:**

```json
{
  "tracking_number": "CG123456789"
}
```

**Response:**

```json
{
  "success": true,
  "tracking": {
    "tracking_number": "CG123456789",
    "status": "in_transit",
    "current_location": "Johannesburg Hub",
    "estimated_delivery": "2024-01-22",
    "events": [
      {
        "timestamp": "2024-01-20T10:00:00Z",
        "status": "collected",
        "description": "Package collected from sender",
        "location": "Rosebank"
      }
    ],
    "provider": "courier-guy"
  }
}
```

### 16. fastway-quote

**Purpose:** Gets delivery quote from Fastway API

**File:** `supabase/functions/fastway-quote/index.ts`

### 17. fastway-shipment

**Purpose:** Creates shipment with Fastway courier

**File:** `supabase/functions/fastway-shipment/index.ts`

### 18. fastway-track

**Purpose:** Tracks Fastway shipment status

**File:** `supabase/functions/fastway-track/index.ts`

### 19. automate-delivery

**Purpose:** Automatically schedules courier pickup after order commitment

**File:** `supabase/functions/automate-delivery/index.ts`

**Request Body:**

```json
{
  "order_id": "ORD_123456",
  "seller_address": {...},
  "buyer_address": {...},
  "weight": 0.5
}
```

---

## ⚡ AUTOMATION FUNCTIONS

### 20. auto-expire-commits

**Purpose:** Automatically expires orders pending commitment for 48+ hours

**File:** `supabase/functions/auto-expire-commits/index.ts`

**How it works:**

1. Finds orders older than 48 hours in "pending_commit" status
2. Calls decline-commit for each expired order
3. Sends admin report email with summary
4. Processes refunds automatically

**Request Body:** None (automated)

**Response:**

```json
{
  "success": true,
  "processed": 5,
  "errors": 0,
  "processedOrders": [
    {
      "order_id": "ORD_123",
      "buyer_email": "buyer@example.com",
      "seller_email": "seller@example.com",
      "amount": 150,
      "expired_at": "2024-01-20T12:00:00Z"
    }
  ],
  "message": "Processed 5 expired orders, 0 errors"
}
```

### 21. check-expired-orders

**Purpose:** Alternative function to check for expired orders

**File:** `supabase/functions/check-expired-orders/index.ts`

### 22. process-order-reminders

**Purpose:** Sends reminder emails for pending commitments

**File:** `supabase/functions/process-order-reminders/index.ts`

---

## 🔧 UTILITY FUNCTIONS

### 23. send-email

**Purpose:** Sends transactional emails via SMTP (Brevo)

**File:** `supabase/functions/send-email/index.ts`

**How it works:**

1. Uses Brevo SMTP for reliable delivery
2. Supports HTML and text content
3. Includes rate limiting (10 emails/minute)
4. Direct HTML only (template system deprecated)

**Request Body:**

```json
{
  "to": "recipient@example.com",
  "subject": "Email Subject",
  "html": "<h1>HTML Content</h1><p>Email body</p>",
  "text": "Plain text version",
  "from": "sender@rebookedsolutions.co.za",
  "replyTo": "support@rebookedsolutions.co.za"
}
```

**Response:**

```json
{
  "success": true,
  "messageId": "smtp_message_id_123",
  "details": {
    "accepted": ["recipient@example.com"],
    "rejected": [],
    "response": "250 OK"
  }
}
```

**Rate Limiting:**

- 10 emails per minute per IP/recipient combination
- Returns 429 status if limit exceeded

### 24. debug-email-template

**Purpose:** Tests email template rendering and delivery

**File:** `supabase/functions/debug-email-template/index.ts`

**Request Body:**

```json
{
  "template": "order_confirmation",
  "to": "test@example.com",
  "data": {
    "buyer_name": "Test Buyer",
    "order_id": "ORD_TEST_123",
    "total_amount": 150
  }
}
```

---

## 🔐 ENVIRONMENT VARIABLES

### Required for Payment Functions:

- `PAYSTACK_SECRET_KEY` - Paystack API secret key
- `PAYSTACK_PUBLIC_KEY` - Paystack public key

### Required for Email Functions:

- `BREVO_SMTP_KEY` - Brevo SMTP password
- `BREVO_SMTP_USER` - Brevo SMTP username
- `DEFAULT_FROM_EMAIL` - Default sender email

### Required for Delivery Functions:

- `COURIER_GUY_API_KEY` - Courier Guy API key
- `COURIER_GUY_API_URL` - Courier Guy API base URL
- `FASTWAY_API_KEY` - Fastway API key

### Required for Database Access:

- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for admin operations
- `SUPABASE_ANON_KEY` - Anonymous key for client operations

---

## 🚀 TESTING STRATEGIES

### 1. Order Flow Testing

```bash
# Test complete order flow
1. create-order → commit-to-sale → mark-collected
2. create-order → decline-commit (refund flow)
3. auto-expire-commits (cleanup flow)
```

### 2. Payment Flow Testing

```bash
# Test payment processing
1. initialize-paystack-payment → verify-paystack-payment
2. paystack-webhook (simulate events)
3. pay-seller (seller payout)
```

### 3. Delivery Flow Testing

```bash
# Test delivery management
1. get-delivery-quotes → courier-guy-shipment → courier-guy-track
2. fastway-quote → fastway-shipment → fastway-track
```

### 4. Automation Testing

```bash
# Test automated processes
1. auto-expire-commits (run manually)
2. process-order-reminders
3. send-email (test notifications)
```

---

## ⚠️ COMMON ISSUES & SOLUTIONS

### Issue: Payment function fails

**Solution:** Check Paystack API keys and test mode settings

### Issue: Email function not sending

**Solution:** Verify Brevo SMTP credentials and rate limits

### Issue: Delivery quotes returning fallback values

**Solution:** Check courier API keys and API endpoints

### Issue: Order functions failing

**Solution:** Ensure required database records exist (users, books, etc.)

---

## 📊 MONITORING & LOGS

All edge functions log important events:

- Function execution start/end
- API call successes/failures
- Database operation results
- Email delivery status
- Error details with stack traces

Access logs via Supabase Dashboard → Edge Functions → Logs

---

## 🔄 DEPLOYMENT

Edge functions are automatically deployed when files in `supabase/functions/` are updated. Each function runs in an isolated Deno runtime with access to:

- Supabase client libraries
- External API calls (fetch)
- Environment variables
- CORS handling
- Request/response processing

---

This completes the comprehensive guide to all 24 Edge Functions in the ReBooked Solutions platform.

# Comprehensive Mock Data for Edge Functions Testing

This directory contains **COMPLETE** mock data for **ALL** Edge Functions to ensure proper testing with **ALL** required fields populated.

## 📁 Mock Data Files

### 1. `paystack-mock-data.ts`

Complete mock data for all Paystack-related Edge Functions:

- ✅ Initialize Payment requests
- ✅ Webhook events with full transaction data
- ✅ Refund requests
- ✅ Subaccount management
- ✅ Multi-seller purchase data
- ✅ Complete user and order objects

### 2. `supabase-mock-data.ts`

Complete mock data for Supabase Edge Functions:

- ✅ User profiles with all fields
- ✅ Book listings with complete metadata
- ✅ Order management data
- ✅ Commit system data
- ✅ Email verification data
- ✅ Banking/subaccount details
- ✅ Notification system data
- ✅ Activity logging data

### 3. `delivery-mock-data.ts`

Complete mock data for delivery service APIs:

- ✅ Courier Guy integration
- ✅ Fastway integration
- ✅ ShipLogic integration
- ✅ Complete address objects
- ✅ Package details with dimensions
- ✅ Tracking data and updates

### 4. `commit-system-mock-data.ts` **[NEW]**

Complete mock data for commit system Edge Functions:

- ✅ Commit to sale data
- ✅ Decline commit data
- ✅ Auto-expire commit responses
- ✅ Order creation with cart items
- ✅ Mark collected data
- ✅ Pay seller data
- ✅ Process reminders responses

### 5. `email-auth-mock-data.ts` **[NEW]**

Complete mock data for email and authentication Edge Functions:

- ✅ Send email requests with HTML templates
- ✅ Debug email template data
- ✅ Subaccount creation data
- ✅ Subaccount management data
- ✅ Authentication headers
- ✅ Health test data and responses
- ✅ Error response patterns

### 6. `payment-management-mock-data.ts` **[NEW]**

Complete mock data for payment management Edge Functions:

- ✅ Refund management (initiate, check, cancel)
- ✅ Transfer management (initiate, verify, list)
- ✅ Split management (create, update, fetch)
- ✅ Payment verification data
- ✅ Complete response objects
- ✅ Error handling scenarios

### 7. `index.ts` **[NEW]** - Master Index

Complete aggregated access to all mock data:

- ✅ Function-specific mock data mapping
- ✅ Complete test scenarios
- ✅ Validation helpers
- ✅ Quick access functions

## 🧪 Testing Best Practices

### Always Use Complete Mock Data

**✅ DO:**

```typescript
// Import complete mock data
import { PaystackMockData } from "./_mock-data/paystack-mock-data.ts";

// Use complete payment data
const testPayment = PaystackMockData.initializePayment;
// All required fields are included: user_id, email, amount, currency, etc.
```

**❌ DON'T:**

```typescript
// Incomplete mock data - causes validation errors
const incompletePayment = {
  amount: 1000,
  email: "test@example.com",
  // Missing: user_id, currency, reference, callback_url, etc.
};
```

### Testing Individual Functions

#### Paystack Functions

```typescript
// Test initialize-paystack-payment
import { PaystackMockData } from "./_mock-data/paystack-mock-data.ts";

const response = await fetch("/functions/v1/initialize-paystack-payment", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(PaystackMockData.initializePayment),
});

// Test paystack-webhook
const webhookResponse = await fetch("/functions/v1/paystack-webhook", {
  method: "POST",
  headers: {
    ...PaystackMockData.headers,
    "x-paystack-signature": "valid_signature_here",
  },
  body: JSON.stringify(PaystackMockData.webhookEvent),
});
```

#### Supabase Functions

```typescript
// Test process-book-purchase
import { SupabaseMockData } from "./_mock-data/supabase-mock-data.ts";

const purchaseData = {
  user_id: SupabaseMockData.userProfile.id,
  book_id: SupabaseMockData.bookListing.id,
  email: SupabaseMockData.userProfile.email,
  shipping_address: SupabaseMockData.order.shipping_address,
  payment_reference: "TXN_123456789",
  total_amount: SupabaseMockData.bookListing.price,
};

const response = await fetch("/functions/v1/process-book-purchase", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(purchaseData),
});
```

#### Delivery Functions

```typescript
// Test courier-guy-quote
import { DeliveryMockData } from "./_mock-data/delivery-mock-data.ts";

const quoteResponse = await fetch("/functions/v1/courier-guy-quote", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(DeliveryMockData.courierGuy.quoteRequest),
});
```

## 🔍 Mock Data Structure

### Complete User Object

```typescript
{
  id: "uuid-string",
  email: "valid-email@example.com",
  first_name: "string",
  last_name: "string",
  phone: "+27123456789",
  university: "string",
  student_number: "string",
  // ... all other required fields
}
```

### Complete Payment Object

```typescript
{
  user_id: "uuid-string",
  email: "valid-email@example.com",
  amount: 29999, // Amount in kobo
  currency: "ZAR",
  reference: "unique-reference",
  callback_url: "https://valid-url.com/callback",
  metadata: { /* complete metadata object */ },
  // ... all other required fields
}
```

### Complete Order Object

```typescript
{
  id: "uuid-string",
  buyer_id: "uuid-string",
  seller_id: "uuid-string",
  book_id: "uuid-string",
  payment_reference: "string",
  shipping_address: { /* complete address object */ },
  delivery_details: { /* complete delivery object */ },
  // ... all other required fields
}
```

## 🎯 Function Testing Checklist

Before testing any Edge Function, ensure:

- [ ] **All required fields** are provided in mock data
- [ ] **UUIDs** are in proper format
- [ ] **Timestamps** are in ISO 8601 format
- [ ] **Email addresses** are valid format
- [ ] **Phone numbers** include country code
- [ ] **Amounts** are in correct currency format (kobo for ZAR)
- [ ] **References** are unique and properly formatted
- [ ] **Addresses** include all required fields
- [ ] **Metadata** objects are complete
- [ ] **Headers** include required authentication/signatures

## ⚠️ Common Testing Pitfalls

### 1. Missing Required Fields

```typescript
// ❌ This will cause validation errors
const incompleteData = {
  email: "test@example.com",
  amount: 1000,
  // Missing: user_id, currency, reference, etc.
};

// ✅ Use complete mock data instead
const completeData = PaystackMockData.initializePayment;
```

### 2. Invalid Data Types

```typescript
// ❌ Wrong data types
const invalidData = {
  user_id: 123, // Should be string UUID
  amount: "1000", // Should be number
  created_at: "2024-01-01", // Should include time
};

// ✅ Correct data types from mock data
const validData = SupabaseMockData.userProfile;
```

### 3. Missing Headers

```typescript
// ❌ Missing required headers
fetch("/functions/v1/paystack-webhook", {
  method: "POST",
  body: JSON.stringify(data),
  // Missing: x-paystack-signature header
});

// ✅ Include all required headers
fetch("/functions/v1/paystack-webhook", {
  method: "POST",
  headers: PaystackMockData.headers, // Includes all required headers
  body: JSON.stringify(PaystackMockData.webhookEvent),
});
```

## 🚀 Quick Start Testing

1. **Import the appropriate mock data:**

   ```typescript
   import { PaystackMockData } from "./_mock-data/paystack-mock-data.ts";
   import { SupabaseMockData } from "./_mock-data/supabase-mock-data.ts";
   import { DeliveryMockData } from "./_mock-data/delivery-mock-data.ts";
   ```

2. **Use complete objects for testing:**

   ```typescript
   const testData = PaystackMockData.initializePayment;
   // All fields are guaranteed to be present and valid
   ```

3. **Focus on function logic, not validation:**
   - Mock data handles all validation requirements
   - Test actual business logic and error handling
   - Verify proper database operations
   - Check external API integrations

This approach ensures that testing focuses on actual function behavior rather than input validation issues, making debugging more effective and reliable.

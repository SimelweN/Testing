# Banking and Payment System Documentation

This document outlines the comprehensive banking and payment system implemented for the ReBooked platform, providing secure split payments, escrow functionality, and automated seller payouts.

## 🏗️ Architecture Overview

The banking system consists of several interconnected components:

1. **Paystack Integration** - Payment processing and bank account management
2. **Database Schema** - Orders, banking details, and payout tracking
3. **Edge Functions** - Secure server-side payment operations
4. **React Components** - User interfaces for banking setup and payments
5. **Services** - Business logic and API interactions

## 🔧 Core Components

### 1. Configuration (`src/config/paystack.ts`)

Central configuration for Paystack integration with environment detection:

```typescript
export const PAYSTACK_CONFIG = {
  PUBLIC_KEY: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
  isConfigured: () => Boolean(PUBLIC_KEY),
  isTestMode: () => PUBLIC_KEY.startsWith("pk_test_"),
  isLiveMode: () => PUBLIC_KEY.startsWith("pk_live_"),
};
```

### 2. Database Schema (`src/database/banking_schema.sql`)

Three main tables with Row Level Security:

- **banking_subaccounts** - User banking details and Paystack subaccounts
- **orders** - Payment tracking with escrow functionality
- **payout_transactions** - Seller payouts and commission tracking

### 3. Services Layer

#### Banking Service (`src/services/bankingService.ts`)

- Create/update Paystack subaccounts
- Validate South African bank account numbers
- Check seller requirements (banking + address + books)
- Link books to payment accounts

#### Payment Service (`src/services/paymentService.ts`)

- Initialize split payments (90% seller, 10% platform)
- Verify payments with Paystack
- Manage escrow (hold payments until collection)
# - Trigger automatic seller payouts - REMOVED - all payments manual

### 4. React Components

#### Banking Setup Form (`src/components/banking/BankingSetupForm.tsx`)

- Bank selection for all major SA banks
- Real-time account number validation
- Secure form handling with error management

#### Banking Requirement Gate (`src/components/banking/BankingRequirementGate.tsx`)

- Protects seller actions until requirements met
- Progress tracking for setup completion
- Guided setup flow

#### Paystack Payment Button (`src/components/banking/PaystackPaymentButton.tsx`)

- Secure payment processing with Paystack popup
- Development fallbacks when not configured
- Payment verification and error handling

## 💰 Payment Flow

### Phase 1: Seller Setup

1. User fills banking details form
2. System validates account with bank
3. Creates Paystack subaccount via Edge Function
4. Links all user's books to subaccount
5. Seller can now receive payments

### Phase 2: Payment Processing

1. Buyer selects books and proceeds to checkout
2. System calculates split (90% seller, 10% platform)
3. Paystack payment initialized with subaccount routing
4. Payment held in escrow after successful completion
5. Seller notified of sale and collection deadline

### Phase 3: Fulfillment & Payout

1. Buyer collects books from seller
2. Collection confirmed (manual or automated)
3. Escrow released - payment forwarded to seller
4. Platform commission automatically deducted
5. Seller receives funds in 1-2 business days

## 🔒 Security Features

### Payment Escrow System

```typescript
const updateOrderStatus = async (reference, status) => {
  if (status === "paid") {
    const collectionDeadline = new Date(Date.now() + 48 * 60 * 60 * 1000);

    await supabase
      .from("orders")
      .update({
        status: "paid",
        payment_held: true, // Escrow activated
        collection_deadline: collectionDeadline.toISOString(),
      })
      .eq("paystack_ref", reference);
  }
};
```

### Banking Requirements Gate

Protects seller functionality until setup complete:

- Banking details configured
- Pickup address provided
- At least one book listed
- All validations passed

### Row Level Security (RLS)

Database policies ensure users can only access their own:

- Banking details
- Orders (as buyer or seller)
- Payout transactions

## 🏦 Supported Banks

All major South African banks supported via Paystack:

```typescript
export const PAYSTACK_BANK_CODES = {
  "Absa Bank": "632005",
  "Capitec Bank": "470010",
  "First National Bank (FNB)": "250655",
  "Standard Bank": "051001",
  Nedbank: "198765",
  // ... and more
};
```

## 📊 Commission Structure

- **Seller receives**: 90% of book sale price
- **Platform fee**: 10% of book sale price
- **Delivery fee**: 100% to courier (when applicable)
- **Processing**: Automatic via Paystack split payments

## 🔄 Development Fallbacks

The system includes comprehensive fallbacks for development:

```typescript
// Payment verification fallback
const fallbackPaymentVerification = async (reference) => {
  if (import.meta.env.DEV) {
    console.warn("🛠️ Using fallback verification for development");

    return {
      status: "success",
      reference,
      amount: 10000,
      gateway_response: "Successful (development fallback)",
    };
  }
  throw new Error("Payment verification service unavailable");
};
```

## 🚀 Setup Instructions

### 1. Environment Variables

```bash
# Paystack Configuration
VITE_PAYSTACK_PUBLIC_KEY=pk_test_your_test_key
VITE_PAYSTACK_SECRET_KEY=sk_test_your_secret_key # For Edge Functions

# Database URL (Supabase)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Database Setup

Execute the banking schema in your Supabase SQL editor:

```bash
# Run the complete schema
cat src/database/banking_schema.sql | supabase db sql
```

### 3. Edge Functions Setup

Deploy the required Edge Functions to Supabase:

- `create-paystack-subaccount` - Creates seller banking accounts
- `initialize-paystack-payment` - Handles payment initialization
- `verify-paystack-payment` - Verifies completed payments
- `initiate-seller-payout` - Triggers seller payments

### 4. Component Usage

```tsx
import BankingRequirementGate from '@/components/banking/BankingRequirementGate';
import PaystackPaymentButton from '@/components/banking/PaystackPaymentButton';

// Protect seller actions
<BankingRequirementGate action="sell books">
  <SellerDashboard />
</BankingRequirementGate>

// Process payments
<PaystackPaymentButton
  amount={5000} // R50.00 in cents
  bookIds={["book1", "book2"]}
  sellerId="seller-uuid"
  shippingAddress={address}
  onSuccess={(ref) => navigate(`/payment-success?ref=${ref}`)}
/>
```

## 📈 Analytics & Reporting

The system includes views for seller earnings tracking:

```sql
-- Monthly earnings by seller
SELECT
  seller_id,
  month,
  orders_count,
  net_earnings,
  platform_fees,
  gross_sales
FROM monthly_seller_earnings
WHERE seller_id = $1;
```

## 🛠️ Maintenance

### Automated Cleanup

```sql
-- Clean up old pending orders (run via cron)
UPDATE orders
SET status = 'cancelled',
    cancellation_reason = 'Payment timeout',
    cancelled_at = NOW()
WHERE status = 'pending'
  AND created_at < NOW() - INTERVAL '48 hours';
```

### Performance Monitoring

Key indexes for optimal performance:

- Order status and creation date
- Seller earnings queries
- Payment reference lookups

## 🔍 Testing

### Development Mode

- Automatic payment simulation
- Mock bank account validation
- Test subaccount creation
- Console warnings for fallbacks

### Production Validation

- Real Paystack API integration
- Actual bank account verification
- Live payment processing
- Production error handling

## 📞 Support

For banking system issues:

1. Check development console for fallback warnings
2. Verify environment variables are set
3. Ensure database schema is up to date
4. Check Paystack dashboard for transaction status
5. Review Edge Function logs in Supabase

## 🔄 Future Enhancements

Planned improvements:

- Multi-currency support
- Bulk payout processing
- Advanced fraud detection
- Automated dispute resolution
- Enhanced analytics dashboard
- Mobile money integration

---

This banking system provides a secure, scalable foundation for peer-to-peer book sales with automated payment processing and seller protection.

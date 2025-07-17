# Email Integration Guide

This guide explains how to use the email system in ReBooked Solutions, which is powered by Brevo SMTP and includes comprehensive template support.

## Environment Variables Required

Ensure these environment variables are set in your Supabase Edge Functions:

```
BREVO_SMTP_KEY=your_brevo_smtp_key
BREVO_SMTP_USER=your_smtp_user (optional, defaults to 8e237b002@smtp-brevo.com)
DEFAULT_FROM_EMAIL="ReBooked Solutions" <noreply@rebookedsolutions.co.za>
```

## Available Email Templates

### Order Management Templates

1. **ORDER_CONFIRMATION** - Order confirmation emails
2. **ORDER_COMMITTED_BUYER** - Notify buyer when seller commits to order
3. **ORDER_COMMITTED_SELLER** - Notify seller about order commitment confirmation
4. **SELLER_NEW_ORDER** - Notify seller about new order (48-hour window)
5. **BUYER_ORDER_PENDING** - Notify buyer that order is awaiting seller response

### Account Management Templates

6. **WELCOME** - Welcome new users
7. **PASSWORD_RESET** - Password reset emails

### Shipping & Logistics Templates

8. **SHIPPING_NOTIFICATION** - Order shipped notifications
9. **SELLER_PICKUP_NOTIFICATION** - Courier pickup scheduled for sellers
10. **BOOKING_CONFIRMATION** - Pickup/delivery booking confirmations

### Business Templates

11. **CONTACT_FORM** - Contact form submissions
12. **COMMIT_CONFIRMATION_BASIC** - Basic order commitment confirmation

## Usage Examples

### Using the Email Service (Frontend)

```typescript
import { emailService } from "@/services/emailService";

// Send a welcome email
await emailService.sendWelcomeEmail("user@example.com", {
  userName: "John Doe",
  loginUrl: "https://app.rebookedsolutions.co.za/login",
});

// Send order confirmation
await emailService.sendOrderConfirmation("buyer@example.com", {
  orderNumber: "ORD_123456",
  customerName: "John Doe",
  items: [{ name: "Physics Textbook", quantity: 1, price: 250 }],
  total: "250.00",
  estimatedDelivery: "2-3 business days",
});

// Send seller new order notification
await emailService.sendSellerNewOrder("seller@example.com", {
  sellerName: "Jane Smith",
  buyerName: "John Doe",
  orderId: "ORD_123456",
  items: [{ name: "Physics Textbook", quantity: 1, price: 250 }],
  totalAmount: "250.00",
  expiresAt: "2024-01-15T10:00:00Z",
});
```

### Using the Supabase Function Directly

```typescript
// From a Supabase Edge Function
await supabase.functions.invoke("send-email", {
  body: {
    to: "user@example.com",
    subject: "Your Subject",
    template: {
      name: "welcome",
      data: {
        userName: "John Doe",
        loginUrl: "https://app.rebookedsolutions.co.za/login",
      },
    },
  },
});

// Or with custom HTML/text
await supabase.functions.invoke("send-email", {
  body: {
    to: "user@example.com",
    subject: "Custom Email",
    html: "<h1>Hello!</h1><p>This is a custom email.</p>",
    text: "Hello!\n\nThis is a custom email.",
  },
});
```

### Using Direct HTTP Calls

```typescript
const response = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
  },
  body: JSON.stringify({
    to: "user@example.com",
    subject: "Test Email",
    template: {
      name: "order-confirmation",
      data: {
        orderNumber: "ORD_123",
        customerName: "John Doe",
        items: [],
        total: "0.00",
      },
    },
  }),
});
```

## Template Data Requirements

### Welcome Template

```typescript
{
  userName: string;
  loginUrl?: string;
}
```

### Order Confirmation Template

```typescript
{
  orderNumber: string;
  customerName: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  total: string;
  estimatedDelivery?: string;
}
```

### Seller New Order Template

```typescript
{
  sellerName: string;
  buyerName: string;
  orderId: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  totalAmount: string;
  expiresAt: string;
  commitUrl?: string;
}
```

### Order Committed Buyer Template

```typescript
{
  buyer_name: string;
  order_id: string;
  seller_name: string;
  book_titles: string;
  estimated_delivery: string;
}
```

### Seller Pickup Notification Template

```typescript
{
  sellerName: string;
  bookTitle: string;
  orderId: string;
  pickupDate: string;
  pickupTimeWindow: string;
  courierProvider: string;
  trackingNumber: string;
  shippingLabelUrl?: string;
  pickupAddress?: {
    streetAddress?: string;
    city?: string;
    province?: string;
  };
}
```

## Error Handling

The email service includes comprehensive error handling:

- **Rate limiting**: 10 emails per minute per IP/email combination
- **Validation**: Email format validation, required field checking
- **SMTP errors**: Detailed error reporting for connection issues
- **Template errors**: Clear error messages for missing or invalid templates

## Testing

Use the admin email testing component or the utility functions:

```typescript
import { testEmailConfiguration, sendTestEmail } from "@/utils/emailTestUtil";

// Test configuration
const configResult = await testEmailConfiguration();

// Send test email
const emailResult = await sendTestEmail("test@example.com");
```

## Features

- ✅ **Brevo SMTP Integration** - Reliable email delivery
- ✅ **Rate Limiting** - Prevents spam and abuse
- ✅ **Template System** - 12 pre-built email templates
- ✅ **HTML & Text Support** - Dual format emails
- ✅ **Attachment Support** - Send files with emails
- ✅ **Connection Pooling** - Optimized performance
- ✅ **Error Handling** - Comprehensive error reporting
- ✅ **Validation** - Email format and content validation
- ✅ **CORS Support** - Cross-origin request handling

## Architecture

```
Frontend (React)
    ↓
EmailService (src/services/emailService.ts)
    ↓
Supabase Edge Function (/functions/v1/send-email)
    ↓
Brevo SMTP (smtp-relay.brevo.com:587)
    ↓
Email Delivery
```

The system is designed to be reliable, scalable, and easy to maintain with comprehensive template support for all ReBooked Solutions email needs.

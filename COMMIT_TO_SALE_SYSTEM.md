# Commit-to-Sale System with Email Automation

## Overview

This system provides a comprehensive commit-to-sale workflow that automatically handles:

- ✅ Order commitment confirmation
- 🚚 Automatic courier pickup scheduling
- 📧 Professional email notifications
- 📄 Shipping label generation and storage
- 📱 Real-time status tracking

## Architecture

### Edge Functions

1. **`commit-to-sale`** - Main orchestration function
2. **`automate-delivery`** - Handles courier booking and label generation
3. **`send-email`** - Enhanced email service with new templates

### Email Templates

- **Seller Pickup Notification** - Detailed courier pickup instructions
- **Buyer Order Confirmed** - Order confirmation for buyers
- **Commit Confirmation Basic** - Fallback confirmation email

### Frontend Components

- **OrderCommitButton** - Complete commit interface with confirmation dialog
- **useOrderCommit** - Hook for programmatic commits

## Setup Instructions

### 1. Deploy Edge Functions

```bash
# Deploy all functions
supabase functions deploy commit-to-sale
supabase functions deploy automate-delivery
supabase functions deploy send-email

# Verify deployment
supabase functions list
```

### 2. Configure Environment Variables

```bash
# Email service (already configured)
supabase secrets set BREVO_SMTP_KEY="your_brevo_key"

# Optional: Custom email settings
supabase secrets set DEFAULT_FROM_EMAIL='"ReBooked Solutions" <noreply@rebookedsolutions.co.za>'
```

### 3. Database Requirements

Ensure your `orders` table has these columns:

```sql
-- Core order fields
id UUID PRIMARY KEY
seller_id UUID REFERENCES profiles(id)
buyer_id UUID REFERENCES profiles(id)
status TEXT DEFAULT 'pending'
amount INTEGER
book_title TEXT
shipping_address JSONB
pickup_address JSONB

-- Commit tracking
committed_at TIMESTAMPTZ
updated_at TIMESTAMPTZ DEFAULT NOW()

-- Courier information
courier_provider TEXT
courier_tracking_number TEXT
courier_pickup_date DATE
courier_pickup_time TEXT
shipping_label_url TEXT
```

### 4. Storage Setup

Create a storage bucket for shipping labels:

```sql
-- Create bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('order-documents', 'order-documents', true);

-- Set up RLS policies
CREATE POLICY "Authenticated users can view order documents"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'order-documents');

CREATE POLICY "Service role can manage order documents"
ON storage.objects FOR ALL TO service_role
USING (bucket_id = 'order-documents');
```

## Usage Examples

### Frontend Integration

#### Basic Usage

```tsx
import OrderCommitButton from "@/components/orders/OrderCommitButton";

function OrderCard({ order }) {
  return (
    <div className="order-card">
      <h3>{order.book_title}</h3>
      <p>Buyer: {order.buyer_name}</p>

      <OrderCommitButton
        orderId={order.id}
        sellerId={order.seller_id}
        bookTitle={order.book_title}
        buyerName={order.buyer_name}
        orderStatus={order.status}
        onCommitSuccess={() => {
          // Refresh order data
          refetchOrders();
        }}
      />
    </div>
  );
}
```

#### Using the Hook

```tsx
import { useOrderCommit } from "@/components/orders/OrderCommitButton";

function CustomCommitComponent() {
  const { commitToSale, isCommitting } = useOrderCommit();

  const handleCommit = async () => {
    const result = await commitToSale(orderId, sellerId);

    if (result.success) {
      toast.success("Order committed successfully!");
    } else {
      toast.error(`Failed: ${result.error}`);
    }
  };

  return (
    <button onClick={handleCommit} disabled={isCommitting}>
      {isCommitting ? "Committing..." : "Commit to Sale"}
    </button>
  );
}
```

#### Advanced Integration with Order Management

```tsx
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import OrderCommitButton from "@/components/orders/OrderCommitButton";

function SellerOrdersPage() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    // Subscribe to order updates
    const subscription = supabase
      .channel("order-updates")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `seller_id=eq.${userId}`,
        },
        (payload) => {
          // Update local state when order status changes
          setOrders((prev) =>
            prev.map((order) =>
              order.id === payload.new.id ? payload.new : order,
            ),
          );
        },
      )
      .subscribe();

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="orders-grid">
      {orders.map((order) => (
        <div key={order.id} className="order-card">
          <OrderCommitButton
            orderId={order.id}
            sellerId={order.seller_id}
            bookTitle={order.book_title}
            buyerName={order.buyer_name}
            orderStatus={order.status}
            onCommitSuccess={() => {
              // Order will update via real-time subscription
              toast.success("Courier pickup scheduled!");
            }}
          />
        </div>
      ))}
    </div>
  );
}
```

### Backend API Usage

#### Direct Function Call

```typescript
const { data, error } = await supabase.functions.invoke("commit-to-sale", {
  body: {
    order_id: "order-uuid",
    seller_id: "seller-uuid",
  },
});

if (data?.success) {
  console.log("Commit successful:", data.order);
} else {
  console.error("Commit failed:", error || data?.error);
}
```

#### Email Testing

```typescript
import { emailService } from "@/services/emailService";

// Test seller pickup notification
await emailService.sendSellerPickupNotification("seller@example.com", {
  sellerName: "John Doe",
  bookTitle: "Physics Textbook",
  orderId: "ORD-12345",
  pickupDate: "2024-03-15",
  pickupTimeWindow: "09:00 - 17:00",
  courierProvider: "courier-guy",
  trackingNumber: "TR123456789",
  shippingLabelUrl: "https://example.com/label.pdf",
  pickupAddress: {
    streetAddress: "123 Main Street",
    city: "Cape Town",
    province: "Western Cape",
  },
});
```

## System Flow

### 1. Order Commitment

```
User clicks "Commit to Sale"
→ Confirmation dialog appears
→ User confirms commitment
→ `commit-to-sale` function called
```

### 2. Automatic Processing

```
Order status updated to "committed"
→ `automate-delivery` function triggered
→ Courier APIs called (Courier Guy → Fastway fallback)
→ Shipping label downloaded and stored
→ Order updated with courier details
```

### 3. Email Notifications

```
Seller receives pickup notification with:
- Pickup date and time window
- Courier provider details
- Downloadable shipping label
- Step-by-step instructions

Buyer receives confirmation with:
- Order confirmed message
- Expected delivery timeframe
- Seller information
```

## Error Handling

### Common Error Scenarios

1. **Order not found** - Invalid order ID or access denied
2. **Already committed** - Order status prevents re-commitment
3. **Courier booking failed** - Both Courier Guy and Fastway unavailable
4. **Email delivery failed** - SMTP or template errors
5. **Label storage failed** - Supabase storage issues

### Error Recovery

- Graceful degradation for email failures
- Fallback courier options
- Original label URL fallback for storage failures
- Comprehensive error logging for debugging

## Monitoring and Debugging

### Function Logs

Check Supabase function logs for:

```bash
# View recent logs
supabase functions logs commit-to-sale
supabase functions logs automate-delivery
supabase functions logs send-email
```

### Database Monitoring

```sql
-- Check order commitment rates
SELECT
  DATE(committed_at) as date,
  COUNT(*) as commitments,
  COUNT(CASE WHEN status = 'courier_scheduled' THEN 1 END) as courier_scheduled
FROM orders
WHERE committed_at IS NOT NULL
GROUP BY DATE(committed_at)
ORDER BY date DESC;

-- Check courier distribution
SELECT
  courier_provider,
  COUNT(*) as count,
  AVG(EXTRACT(EPOCH FROM (updated_at - committed_at))/60) as avg_processing_minutes
FROM orders
WHERE courier_provider IS NOT NULL
GROUP BY courier_provider;
```

### Email Analytics

Monitor email delivery through Brevo dashboard:

- Delivery rates
- Open rates
- Click rates (for shipping label downloads)
- Bounce rates

## Security Considerations

- **Authentication**: All functions verify user permissions
- **Rate Limiting**: Email service includes rate limiting
- **Input Validation**: Comprehensive validation on all inputs
- **Error Sanitization**: Sensitive data removed from logs
- **CORS Protection**: Proper CORS headers on all functions

## Performance Optimization

- **Connection Pooling**: SMTP connections reused
- **Async Processing**: Non-blocking email sending
- **Fallback Systems**: Multiple courier options
- **Caching**: Template rendering optimized
- **Storage Optimization**: Efficient PDF handling

This system provides a complete, production-ready commit-to-sale workflow with professional email automation and robust error handling.

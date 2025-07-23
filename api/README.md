# ReBooked Solutions - Vercel API Functions

This directory contains Vercel serverless functions for the ReBooked Solutions book marketplace.

## 📁 Structure

```
api/
├── _lib/
│   └── utils.js          # Shared utilities and helpers
├── types.ts              # TypeScript type definitions
├── health.ts             # Health check endpoint
├── create-order.js       # Create new book orders
├── initialize-paystack-payment.js  # Initialize Paystack payments
├── verify-paystack-payment.ts      # Verify payment status
├── paystack-webhook.ts   # Handle Paystack webhooks
├── auto-expire-commits.js # Auto-expire old orders
├── mark-collected.js     # Mark orders as collected
# ├── pay-seller.js         # REMOVED - no automated seller payments
└── ...                   # Other API functions
```

## 🚀 Function Guidelines

### Basic Structure
All functions follow this pattern:

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCORS } from './_lib/utils.js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Handle CORS
  handleCORS(req, res);
  if (req.method === 'OPTIONS') return;

  // Validate HTTP method
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    // Function logic here
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
```

### Environment Variables

Required environment variables:
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `PAYSTACK_SECRET_KEY` - Paystack secret key
- `SMTP_HOST` - Email server host
- `SMTP_USER` - Email server username
- `SMTP_PASS` - Email server password

### Response Format

All functions return JSON in this format:

```typescript
{
  success: boolean;
  data?: any;          // On success
  error?: string;      // On error
  message?: string;    // Optional message
}
```

## 📋 API Endpoints

### Orders
- `POST /api/create-order` - Create new book orders
- `POST /api/auto-expire-commits` - Auto-expire old orders
- `POST /api/mark-collected` - Mark orders as collected

### Payments
- `POST /api/initialize-paystack-payment` - Initialize payment
- `POST /api/verify-paystack-payment` - Verify payment status
- `POST /api/paystack-webhook` - Handle payment webhooks
# - `POST /api/pay-seller` - REMOVED - no automated seller payments

### Utilities
- `GET/POST /api/health` - Health check
- `POST /api/send-email` - Send transactional emails

## 🛠️ Development

### Local Testing
```bash
# Install dependencies
npm install

# Install Vercel CLI
npm install -g vercel

# Run locally
vercel dev
```

### Deployment
```bash
# Deploy to Vercel
vercel

# Set environment variables
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add PAYSTACK_SECRET_KEY
```

## ⚠️ Important Notes

1. **CORS**: All functions include proper CORS headers for frontend integration
2. **Error Handling**: Functions return appropriate HTTP status codes
3. **Logging**: Use `logEvent()` helper for structured logging
4. **Security**: Never expose sensitive keys in responses
5. **Rate Limiting**: Consider implementing rate limiting for public endpoints
6. **Webhooks**: Always return 200 status for webhooks to prevent retries

## 🔒 Security

- All functions validate input data
- Webhook signatures are verified
- Sensitive data is filtered from logs
- Rate limiting is implemented where needed
- CORS is properly configured

## 📚 ReBooked Solutions

These functions power the ReBooked Solutions book marketplace, handling:
- Book order processing
- Payment management with Paystack
- Email notifications
# - Seller payouts - REMOVED - all payments manual
- Order lifecycle management

**"Pre-Loved Pages, New Adventures"** 📚

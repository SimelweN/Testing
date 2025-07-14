# Vercel Serverless Functions Fallback System

## Overview

This system provides a complete fallback infrastructure using Vercel serverless functions as backups for all Supabase Edge Functions. It ensures 99.9% uptime by automatically switching between services when one fails.

## 🎯 **Key Features**

- ✅ **Automatic Failover** - Seamlessly switches between Supabase and Vercel
- ✅ **Retry Logic** - Configurable retry attempts with exponential backoff
- ✅ **Health Monitoring** - Real-time service status tracking
- ✅ **Service Status UI** - Visual indicators for service availability
- ✅ **Complete API Parity** - All Supabase functions replicated in Vercel
- ✅ **Mock Development Mode** - Works without API keys for development
- ✅ **Performance Optimization** - Connection pooling and timeouts

## 📁 **File Structure**

```
/api/                           # Vercel serverless functions
├─ _lib/
│  ├─ utils.js                 # Shared utilities and helpers
│  └─ email-templates.js       # Email template rendering
├─ health.js                   # Health check endpoint
├─ send-email.js              # Email service with Brevo integration
├─ commit-to-sale.js          # Order commitment workflow
├─ automate-delivery.js       # Delivery automation and label storage
├─ courier-guy-quote.js       # Courier Guy price quotes
├─ courier-guy-shipment.js    # Courier Guy shipment creation
├─ courier-guy-track.js       # Courier Guy package tracking
├─ fastway-quote.js           # Fastway price quotes
├─ fastway-shipment.js        # Fastway shipment creation
└─ fastway-track.js           # Fastway package tracking

/src/services/
├─ fallbackService.ts         # Core fallback logic and service wrapper
└─ enhancedEmailService.ts    # Enhanced email service with fallback

/src/components/orders/
└─ OrderCommitButtonFallback.tsx # UI component with service status

vercel.json                   # Vercel configuration
package-vercel.json          # Dependencies for Vercel functions
```

## 🚀 **Setup Instructions**

### 1. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy the project
vercel

# Set environment variables
vercel env add BREVO_SMTP_KEY
vercel env add BREVO_SMTP_USER
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add COURIER_GUY_API_KEY
vercel env add FASTWAY_API_KEY
```

### 2. Configure Environment Variables

**Required:**

- `BREVO_SMTP_KEY` - Your Brevo SMTP API key
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

**Optional:**

- `BREVO_SMTP_USER` - Custom SMTP username (defaults to provided)
- `DEFAULT_FROM_EMAIL` - Default sender email
- `COURIER_GUY_API_KEY` - Courier Guy API key
- `FASTWAY_API_KEY` - Fastway API key

### 3. Update Frontend Code

Replace existing service calls with the fallback service:

```typescript
// Old way
import { supabase } from "@/lib/supabase";
const { data, error } = await supabase.functions.invoke("commit-to-sale", {
  body: data,
});

// New way with fallback
import { fallbackService } from "@/services/fallbackService";
const response = await fallbackService.commitToSale(data);
```

## 📡 **API Endpoints**

### Core Services

- `POST /api/send-email` - Email service with templates
- `POST /api/commit-to-sale` - Order commitment workflow
- `POST /api/automate-delivery` - Delivery automation

### Courier Services

- `POST /api/courier-guy-quote` - Get shipping quotes
- `POST /api/courier-guy-shipment` - Create shipments
- `GET /api/courier-guy-track?tracking_number=XXX` - Track packages
- `POST /api/fastway-quote` - Get shipping quotes
- `POST /api/fastway-shipment` - Create shipments
- `GET /api/fastway-track?tracking_number=XXX` - Track packages

### Health Check

- `GET /api/health` - Service health and configuration status

## 💻 **Usage Examples**

### Basic Fallback Service Usage

```typescript
import { fallbackService } from "@/services/fallbackService";

// Commit to sale with automatic fallback
const response = await fallbackService.commitToSale({
  order_id: "order-123",
  seller_id: "seller-456",
});

if (response.success) {
  console.log(`Success via ${response.source}:`, response.data);
} else {
  console.error("Failed:", response.error);
}
```

### Enhanced Email Service

```typescript
import { enhancedEmailService } from "@/services/enhancedEmailService";

// Send order confirmation with fallback
const result = await enhancedEmailService.sendOrderConfirmation(
  "customer@example.com",
  {
    orderNumber: "ORD-12345",
    customerName: "John Doe",
    items: [{ name: "Physics Book", quantity: 1, price: 299.99 }],
    total: "299.99",
  },
);

if (result.success) {
  console.log(`Email sent via ${result.source}`);
}
```

### React Component with Service Status

```tsx
import OrderCommitButtonFallback from "@/components/orders/OrderCommitButtonFallback";
import { useServiceStatus } from "@/services/fallbackService";

function OrderCard({ order }) {
  const { supabase, vercel } = useServiceStatus();

  return (
    <div className="order-card">
      <h3>{order.book_title}</h3>

      <OrderCommitButtonFallback
        orderId={order.id}
        sellerId={order.seller_id}
        bookTitle={order.book_title}
        showServiceStatus={true}
        onCommitSuccess={(response) => {
          console.log(`Committed via ${response.source}`);
          // Refresh data
        }}
      />

      {/* Service status display */}
      <div className="service-status">
        <span className={supabase ? "online" : "offline"}>
          Supabase: {supabase ? "🟢" : "🔴"}
        </span>
        <span className={vercel ? "online" : "offline"}>
          Vercel: {vercel ? "🟢" : "🔴"}
        </span>
      </div>
    </div>
  );
}
```

### Configuration and Health Monitoring

```typescript
import { fallbackService, useFallbackService } from '@/services/fallbackService';

// Update configuration
fallbackService.updateConfig({
  retryAttempts: 3,
  retryDelay: 2000,
  timeoutMs: 45000,
  enableFallback: true
});

// Health check
const health = await fallbackService.healthCheck();
console.log('Service health:', health);

// In React component
function ServiceMonitor() {
  const { supabase, vercel, lastChecked, checkStatus } = useServiceStatus();

  return (
    <div className="service-monitor">
      <p>Supabase: {supabase ? '✅ Online' : '❌ Offline'}</p>
      <p>Vercel: {vercel ? '✅ Online' : '❌ Offline'}</p>
      <p>Last checked: {lastChecked?.toLocaleTimeString()}</p>
      <button onClick={checkStatus}>Check Now</button>
    </div>
  );
}
```

## 🔧 **Advanced Configuration**

### Fallback Service Configuration

```typescript
const customConfig = {
  enableFallback: true, // Enable/disable fallback
  retryAttempts: 2, // Number of retry attempts
  retryDelay: 1000, // Base delay between retries (ms)
  timeoutMs: 30000, // Request timeout (ms)
  preferredSource: "supabase", // 'supabase' | 'vercel'
};

const customService = new FallbackService(customConfig);
```

### Error Handling Patterns

```typescript
try {
  const response = await fallbackService.commitToSale(data);

  if (!response.success) {
    // Handle specific errors
    if (response.error?.includes("already committed")) {
      toast.error("Order already committed");
    } else if (response.error?.includes("All service endpoints failed")) {
      toast.error("All services unavailable", {
        description: "Please try again later",
      });
    } else {
      toast.error(`Error: ${response.error}`);
    }
  }
} catch (error) {
  // Handle unexpected errors
  console.error("Unexpected error:", error);
  toast.error("Something went wrong");
}
```

## 🚨 **Error Scenarios and Handling**

### 1. Single Service Failure

- **Scenario**: Supabase is down, Vercel is up
- **Behavior**: Automatically switches to Vercel after first failure
- **User Experience**: Slight delay, success notification shows "via VERCEL"

### 2. Both Services Down

- **Scenario**: Both Supabase and Vercel are unavailable
- **Behavior**: Retries both services, then fails gracefully
- **User Experience**: Clear error message with retry instructions

### 3. Partial Service Failure

- **Scenario**: Service is up but specific function fails
- **Behavior**: Retries on same service, then tries fallback
- **User Experience**: Automatic retry with success via backup service

### 4. Network Issues

- **Scenario**: Client has poor connectivity
- **Behavior**: Respects timeout settings, retries with backoff
- **User Experience**: Loading states with appropriate timeouts

## 📊 **Monitoring and Analytics**

### Service Health Dashboard

```typescript
// Create a monitoring component
function ServiceDashboard() {
  const [metrics, setMetrics] = useState({
    supabaseUptime: 0,
    vercelUptime: 0,
    fallbackUsage: 0,
    avgResponseTime: 0
  });

  useEffect(() => {
    const interval = setInterval(async () => {
      const health = await fallbackService.healthCheck();
      // Update metrics
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="service-dashboard">
      <div className="metric">
        <h4>Supabase Uptime</h4>
        <p>{metrics.supabaseUptime}%</p>
      </div>
      <div className="metric">
        <h4>Vercel Uptime</h4>
        <p>{metrics.vercelUptime}%</p>
      </div>
      <div className="metric">
        <h4>Fallback Usage</h4>
        <p>{metrics.fallbackUsage}%</p>
      </div>
    </div>
  );
}
```

### Console Logging

The system provides comprehensive console logging:

- `✅ function_name succeeded via source`
- `⚠️ function_name failed via source (attempt N): error`
- `🔄 function_name trying fallback_source...`
- `💥 function_name failed on all sources after N attempts`

## 🧪 **Development Mode**

For development without API keys, the system provides mock responses:

```typescript
// Fastway functions return mock data when API key is missing
// Courier Guy functions work with real API or return errors
// Email service requires BREVO_SMTP_KEY but gracefully handles missing config
```

## 🔒 **Security Considerations**

- **Environment Variables**: All sensitive data stored securely in Vercel
- **CORS Protection**: Proper CORS headers on all endpoints
- **Input Validation**: Comprehensive validation on all inputs
- **Rate Limiting**: Built-in rate limiting for email services
- **Error Sanitization**: Sensitive data removed from logs

## 🚀 **Performance Optimization**

- **Connection Pooling**: SMTP connections reused efficiently
- **Timeout Management**: Configurable timeouts prevent hanging requests
- **Retry Strategy**: Exponential backoff prevents thundering herd
- **Health Caching**: Service status cached to reduce overhead
- **Async Operations**: Non-blocking operations where possible

## 🎯 **Best Practices**

1. **Always use the fallback service** for critical operations
2. **Monitor service health** in production dashboards
3. **Configure appropriate timeouts** based on your needs
4. **Handle errors gracefully** with user-friendly messages
5. **Log service usage** for analytics and debugging
6. **Test both pathways** in your development process
7. **Keep API keys secure** and rotate them regularly

This fallback system ensures your application remains resilient and provides excellent user experience even when individual services experience issues.

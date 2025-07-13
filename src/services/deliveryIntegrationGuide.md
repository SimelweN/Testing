# Delivery API Integration Guide

## Overview

This project now includes comprehensive delivery API integration supporting:

1. **Courier Guy** (via ShipLogic API)
2. **Fastway Couriers** (direct API integration)
3. **ShipLogic** (existing integration)
4. **Unified Delivery Service** (abstracts all providers)

## API Credentials Setup

### 1. Environment Variables Required

Add these to your Supabase Edge Functions environment:

```bash
# Fastway Couriers API
FASTWAY_API_KEY=your_fastway_api_key
FASTWAY_API_URL=https://api.fastway.org/v2

# Courier Guy (via ShipLogic)
SHIPLOGIC_API_KEY=your_shiplogic_api_key
SHIPLOGIC_API_URL=https://api-docs.shiplogic.com

# Optional: For testing/development
DELIVERY_TEST_MODE=true
```

### 2. Supabase Edge Functions Deployed

The following Edge Functions are now available:

- `fastway-quote` - Get delivery quotes from Fastway
- `fastway-shipment` - Create shipments with Fastway
- `fastway-track` - Track Fastway shipments
- `courier-guy-shipment` - Create Courier Guy shipments (existing)
- `courier-guy-track` - Track Courier Guy shipments (existing)
- `get-delivery-quotes` - Unified quotes from all providers (existing)

## Usage Examples

### 1. Get Quotes from All Providers

```typescript
import { getAllDeliveryQuotes } from "@/services/unifiedDeliveryService";

const quotes = await getAllDeliveryQuotes({
  from: {
    streetAddress: "123 Main St",
    city: "Cape Town",
    province: "Western Cape",
    postalCode: "8001",
  },
  to: {
    streetAddress: "456 Oak Ave",
    city: "Johannesburg",
    province: "Gauteng",
    postalCode: "2000",
  },
  weight: 2.5,
  service_type: "standard",
});
```

### 2. Create Shipment with Preferred Provider

```typescript
import { createUnifiedShipment } from "@/services/unifiedDeliveryService";

const shipment = await createUnifiedShipment({
  collection: {
    contactName: "John Seller",
    phone: "+27123456789",
    email: "seller@example.com",
    streetAddress: "123 Main St",
    city: "Cape Town",
    province: "Western Cape",
    postalCode: "8001",
  },
  delivery: {
    contactName: "Jane Buyer",
    phone: "+27987654321",
    email: "buyer@example.com",
    streetAddress: "456 Oak Ave",
    city: "Johannesburg",
    province: "Gauteng",
    postalCode: "2000",
  },
  parcels: [
    {
      reference: "BOOK001",
      description: "Textbook",
      weight: 1.5,
    },
  ],
  service_type: "standard",
  preferred_provider: "fastway", // or "courier-guy" or "shiplogic"
});
```

### 3. Track Any Shipment

```typescript
import { trackUnifiedShipment } from "@/services/unifiedDeliveryService";

const tracking = await trackUnifiedShipment("FW1234567890");
// Auto-detects provider from tracking number format
```

## React Components

### 1. DeliveryQuoteComparison

Shows quotes from all providers with comparison:

```typescript
import DeliveryQuoteComparison from "@/components/delivery/DeliveryQuoteComparison";

<DeliveryQuoteComparison
  request={quoteRequest}
  onQuoteSelected={(quote) => console.log("Selected:", quote)}
  onCancel={() => setShowQuotes(false)}
/>
```

### 2. UnifiedTrackingComponent

Universal tracking for all courier providers:

```typescript
import UnifiedTrackingComponent from "@/components/delivery/UnifiedTrackingComponent";

<UnifiedTrackingComponent
  initialTrackingNumber="FW1234567890"
  provider="fastway"
  onClose={() => setShowTracking(false)}
/>
```

## API Integration Details

### Fastway Couriers API

- **Base URL**: https://api.fastway.org/v2
- **Authentication**: Bearer token
- **Rate Limits**: Standard commercial limits
- **Features**:
  - Real-time quotes
  - Shipment creation
  - Label generation
  - Tracking with events
  - Service area validation

### Courier Guy (ShipLogic) API

- **Base URL**: https://api-docs.shiplogic.com
- **Authentication**: API key
- **Features**:
  - Multiple service levels
  - Comprehensive tracking
  - Professional waybills
  - Delivery confirmations

## Error Handling & Fallbacks

The system includes comprehensive error handling:

1. **API Failures**: Fallback to mock data in development
2. **Invalid Addresses**: Validation before API calls
3. **Network Issues**: Retry logic with exponential backoff
4. **Provider Downtime**: Automatic failover to other providers

## Testing

Use the admin delivery test service:

```typescript
import DeliveryApiTestService from "@/services/admin/deliveryApiTestService";

const results = await DeliveryApiTestService.runFullDeliveryTest();
console.log("Test Results:", results);
```

## Production Checklist

- [ ] Set up Fastway API credentials
- [ ] Configure Courier Guy/ShipLogic API access
- [ ] Test all providers in staging environment
- [ ] Set up webhook endpoints for delivery status updates
- [ ] Configure monitoring and alerting
- [ ] Test error scenarios and fallbacks
- [ ] Validate address formats for South African addresses
- [ ] Set up logging for delivery events

## Support & Troubleshooting

### Common Issues

1. **"No quotes available"**

   - Check API credentials
   - Verify service areas for postcodes
   - Check network connectivity

2. **"Tracking failed"**

   - Verify tracking number format
   - Check provider-specific requirements
   - Ensure API permissions

3. **"Shipment creation failed"**
   - Validate address formats
   - Check parcel weight/dimensions
   - Verify service type availability

### Debug Mode

Enable debug logging:

```typescript
// In development
console.log("Debug mode enabled");
localStorage.setItem("delivery_debug", "true");
```

### API Rate Limits

- **Fastway**: 1000 requests/hour
- **Courier Guy**: 500 requests/hour
- **ShipLogic**: 2000 requests/hour

Monitor usage and implement caching where appropriate.

## Next Steps

1. **Webhooks**: Implement webhook endpoints for real-time delivery updates
2. **Analytics**: Add delivery performance tracking
3. **Bulk Operations**: Support for multiple shipments
4. **International**: Extend to international courier services
5. **Mobile App**: Create mobile tracking app

For technical support, refer to the individual API documentation or contact the respective courier providers.

# Courier Guy API Integration Setup

This guide explains how to set up and deploy the Courier Guy API integration with the provided API key.

## API Key Details

- **API Key**: `42555ddcb06244d7b81b615ef437dea1`
- **Provider**: Courier Guy
- **Status**: ✅ Integrated and ready for use

## Local Development Setup

### 1. Environment Configuration

The API key has been added to your `.env` file for local development:

```bash
COURIER_GUY_API_KEY=42555ddcb06244d7b81b615ef437dea1
```

### 2. Verify Integration

1. Start your development server: `yarn dev`
2. Navigate to any page with courier tracking functionality
3. The API key will be automatically used by the Supabase functions

## Production Deployment

### For Fly.io Deployment

Set the environment variable using Fly.io CLI:

```bash
fly secrets set COURIER_GUY_API_KEY="42555ddcb06244d7b81b615ef437dea1"
```

Verify the secret is set:

```bash
fly secrets list
```

### For Vercel Deployment

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add a new environment variable:
   - **Name**: `COURIER_GUY_API_KEY`
   - **Value**: `42555ddcb06244d7b81b615ef437dea1`
   - **Environment**: Production (and Preview if needed)

### For Netlify Deployment

1. Go to your Netlify site dashboard
2. Navigate to Site settings → Environment variables
3. Add a new environment variable:
   - **Key**: `COURIER_GUY_API_KEY`
   - **Value**: `42555ddcb06244d7b81b615ef437dea1`

### For Supabase Edge Functions

The API key needs to be set in your Supabase project:

1. Go to your Supabase project dashboard
2. Navigate to Settings → Edge Functions
3. Set the environment variable:
   - **Name**: `COURIER_GUY_API_KEY`
   - **Value**: `42555ddcb06244d7b81b615ef437dea1`

## Features Enabled

With this API key configured, the following features are now available:

### 1. Shipment Creation

- Create shipments through the `courier-guy-shipment` Supabase function
- Automatic tracking number generation
- Full shipment details management

### 2. Package Tracking

- Real-time tracking through the `CourierGuyTracker` component
- Status updates and delivery estimates
- Tracking timeline with location updates

### 3. Delivery Quotes

- Dynamic pricing calculations
- Weight and distance-based estimates
- Integration with the unified delivery service

## API Endpoints Used

The integration uses the following Courier Guy API endpoints:

- **Shipment Creation**: `POST https://api.courierguy.co.za/v1/shipments`
- **Tracking**: `GET https://api.courierguy.co.za/v1/shipments/{tracking_id}`

## Security Notes

- ✅ API key is stored securely as an environment variable
- ✅ Never exposed in client-side code
- ✅ Only accessible through Supabase Edge Functions
- ✅ Proper error handling for API failures

## Testing the Integration

After deployment, you can test the integration:

1. **Tracking Test**: Use the CourierGuyTracker component with a test tracking number
2. **Quote Test**: Request delivery quotes through the delivery service
3. **Shipment Test**: Create a test shipment (be careful with live API calls)

## Troubleshooting

### Common Issues

1. **"API key not configured" error**

   - Verify the environment variable is set correctly
   - Check that it's deployed to your hosting platform
   - Restart your application after setting the variable

2. **Authentication errors**

   - Confirm the API key is valid and active
   - Check for any typos in the key value

3. **CORS errors**
   - Ensure the Supabase functions are deployed properly
   - Verify the CORS configuration in the functions

### Getting Help

If you encounter issues:

1. Check the Supabase function logs
2. Verify the environment variable is set in your deployment platform
3. Test with a simple tracking request first

## Next Steps

With the Courier Guy API now configured, you can:

1. Deploy your application to production
2. Test the tracking and shipment features
3. Monitor API usage and performance
4. Consider adding additional courier services if needed

---

**Note**: Keep your API key secure and never commit it to version control. Always use environment variables for sensitive configuration.

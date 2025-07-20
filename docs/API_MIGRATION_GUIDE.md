# API Functions Migration Guide

## Current Issue
The `/api` folder contains Vercel-style serverless functions, but this project is deployed on Fly.dev where they return 404 errors.

## Solutions

### Option 1: Use Mock Mode (Immediate)
- In the Admin Dashboard → API Testing tab
- Click "Enable Mock Mode"
- Test all functionality with realistic simulated responses
- Perfect for UI testing and development

### Option 2: Deploy to Supabase Edge Functions (Recommended)

#### Step 1: Move Functions
```bash
# Create edge functions directory structure
mkdir -p supabase/functions/create-order
mkdir -p supabase/functions/initialize-paystack-payment
# ... etc for each function
```

#### Step 2: Convert Function Format
From Vercel format:
```javascript
export default async function handler(req, res) {
  // Vercel format
}
```

To Supabase Edge Function format:
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  // Supabase Edge Function format
  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" }
  })
})
```

#### Step 3: Update Imports
- Replace Node.js imports with Deno imports
- Update Supabase client creation for Edge Functions
- Convert CommonJS requires to ES modules

#### Step 4: Deploy
```bash
supabase functions deploy create-order
supabase functions deploy initialize-paystack-payment
# ... etc
```

#### Step 5: Update API Testing URLs
Change from:
```
/api/create-order
```

To:
```
https://your-project.functions.supabase.co/create-order
```

### Option 3: Keep on Vercel
If you prefer to keep using Vercel:
1. Deploy this project to Vercel instead of Fly.dev
2. The `/api` functions will work automatically
3. No code changes needed

## Current Functionality
- ✅ Mock Mode works perfectly for testing
- ✅ Database connectivity works
- ✅ All UI functionality works
- ❌ Real API endpoints return 404 on Fly.dev

## Recommendation
Use **Mock Mode** for immediate testing, then migrate to **Supabase Edge Functions** for production use.

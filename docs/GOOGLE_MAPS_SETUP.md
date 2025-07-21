# Google Maps Setup Guide

## 🗺️ Current Status
Google Maps is currently **disabled** to prevent API errors. The app uses manual address entry as a fallback.

## ✅ Quick Fix
To enable Google Maps smart address autocomplete:

### 1. Get Google Maps API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new project or select existing one
3. Create credentials → API Key
4. Copy the API key (starts with `AIza...`)

### 2. Enable Required APIs
Enable these APIs in Google Cloud Console:
- [Places API](https://console.cloud.google.com/apis/library/places-backend.googleapis.com)
- [Maps JavaScript API](https://console.cloud.google.com/apis/library/maps-backend.googleapis.com)

### 3. Configure Environment
**For Local Development:**
```bash
# Create .env file in project root
echo "VITE_GOOGLE_MAPS_API_KEY=your_api_key_here" > .env
echo "VITE_DISABLE_GOOGLE_MAPS=false" >> .env
```

**For Production (Fly.io):**
```bash
fly secrets set VITE_GOOGLE_MAPS_API_KEY="your_api_key_here"
fly secrets set VITE_DISABLE_GOOGLE_MAPS="false"
fly deploy
```

### 4. Restart Development Server
```bash
npm run dev
# or
yarn dev
```

## 🔧 What This Enables
- ✅ Smart address autocomplete
- ✅ Address validation
- ✅ Latitude/longitude coordinates
- ✅ Better delivery accuracy

## 🛡️ Security Notes
- Restrict your API key to your domain
- Set usage quotas to prevent unexpected charges
- Monitor usage in Google Cloud Console

## 🔄 Fallback Behavior
If Google Maps fails to load:
- Manual address entry is automatically used
- All functionality continues to work
- No errors are shown to users

## 🐛 Troubleshooting

### "API key not valid" error
- Ensure the API key is correct
- Check that Places API is enabled
- Verify domain restrictions

### "Loading forever"
- Check browser console for errors
- Verify VITE_DISABLE_GOOGLE_MAPS=false
- Ensure API key starts with "AIza"

### Still seeing fallback
- Clear browser cache
- Check environment variables are set
- Restart development server

## 💡 Cost Information
Google Maps APIs have free tiers:
- Places API: 1,000 requests/month free
- Maps JavaScript API: $7/1000 requests after free tier

For a typical university marketplace, monthly costs are usually under $20.

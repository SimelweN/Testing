# Google Maps Troubleshooting Guide

## 🚨 Issue: Maps and Autofill Not Working

I've created debugging tools to help identify and fix the Google Maps integration issues.

## 🔧 Quick Fix Steps

### Step 1: Visit the Test Page

Go to: **`/maps-test`** - This will diagnose the exact issue

### Step 2: Check the Debug Info

Go to: **`/google-maps-demo`** - Look at the "Debug Information" section at the top

### Step 3: Common Issues & Solutions

#### ❌ **API Key Not Found**

**Symptoms:** Debug shows "Missing" for API Key
**Solution:**

```bash
# Restart the dev server after creating .env file
yarn dev
# or
npm run dev
```

#### ❌ **Google Maps Script Won't Load**

**Symptoms:** Console errors about loading maps.googleapis.com
**Solutions:**

1. **Network/Firewall Issue:** Check if you can access https://maps.googleapis.com directly
2. **API Key Invalid:** The key might be expired or have restrictions
3. **Browser Cache:** Clear browser cache and hard refresh (Ctrl+Shift+R)

#### ❌ **Script Loads But Autocomplete Fails**

**Symptoms:** Maps loads but typing doesn't show suggestions
**Solutions:**

1. Check if Places API is enabled in Google Cloud Console
2. Verify API key has Places API permissions
3. Check browser console for JavaScript errors

### Step 4: Manual Testing

1. Visit `/maps-test`
2. Click "Load Google Maps Script" button
3. Wait for "Maps Ready" to show green
4. Click "Test Autocomplete" to verify functionality

## 🛠️ Created Debugging Tools

### 1. **MapsTest Page** (`/maps-test`)

- Tests API key availability
- Tests script loading
- Tests autocomplete functionality
- Shows detailed error messages
- Manual load buttons for testing

### 2. **Simplified Component** (`SimpleGoogleMapsInput`)

- Loads Google Maps without external dependencies
- Better error handling and fallbacks
- Shows loading states clearly
- Graceful degradation to manual entry

### 3. **Enhanced Demo** (`/google-maps-demo`)

- Added debug information section
- Shows API key status
- Environment details
- Real-time loading status

## 🔍 What to Check

### Environment Variables

```bash
# Check if .env file exists and contains:
VITE_GOOGLE_MAPS_API_KEY=AIzaSyBqiBwqqiVKE_DJmDeG4imU-q5hTKznlSs
```

### Browser Console

Open browser dev tools (F12) and look for:

- Red errors mentioning "maps.googleapis.com"
- Warnings about API quotas or billing
- JavaScript errors in the console

### Network Tab

Check if the Google Maps script is loading:

1. Open Network tab in dev tools
2. Refresh the page
3. Look for requests to "maps.googleapis.com"
4. Check if they return 200 OK or error codes

## 🚀 Quick Test Commands

### Test 1: Environment Check

Visit: `/maps-test`
Expected: Green checkmarks for API Key, Script Loaded, Maps Ready

### Test 2: Simple Demo

Visit: `/google-maps-demo`
Expected: See debug info showing API key found

### Test 3: Try Address Input

On either page, try typing: "1 Sandton Drive, Sandton"
Expected: Dropdown suggestions appear as you type

## 🔧 Alternative Solutions

### If Google Maps Still Won't Work:

#### Option 1: Use Manual Entry

The components include manual address entry fallbacks that work without Google Maps.

#### Option 2: Check API Key Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Enable Maps JavaScript API
3. Enable Places API
4. Check API key restrictions
5. Verify billing is set up (Google requires a billing account)

#### Option 3: Network Issues

If you're behind a corporate firewall or VPN:

- Try disabling VPN temporarily
- Check if maps.googleapis.com is blocked
- Try on mobile data/different network

## 📞 Next Steps

1. **Visit `/maps-test` first** - This will show exactly what's wrong
2. **Check the browser console** - Look for specific error messages
3. **Try the manual load button** - See if manual loading works
4. **Report specific errors** - Share any error messages you see

The debugging tools will help identify exactly where the issue is occurring!

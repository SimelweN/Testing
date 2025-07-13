# Deployment Guide - Fixing Blank Screen Issues

This guide helps you fix the common blank screen issue when deploying your React app to Vercel or Netlify.

## 🚨 Most Common Issue: Missing Environment Variables

The blank screen is usually caused by missing environment variables in production. Your app requires these environment variables to function:

### Required Environment Variables

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Optional Environment Variables

```
VITE_PAYSTACK_PUBLIC_KEY=your_paystack_public_key
VITE_SHIPLOGIC_API_KEY=your_shiplogic_api_key
VITE_APP_URL=https://yourdomain.com
```

## 📝 How to Set Environment Variables

### For Vercel:

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add each variable:
   - Name: `VITE_SUPABASE_URL`
   - Value: Your Supabase project URL
   - Environment: Production (and Preview if needed)
5. Click **Save**
6. Repeat for `VITE_SUPABASE_ANON_KEY`
7. **Redeploy** your application

### For Netlify:

1. Go to your [Netlify Dashboard](https://app.netlify.com/)
2. Select your site
3. Go to **Site settings** → **Environment variables**
4. Click **Add variable**
5. Add each variable:
   - Key: `VITE_SUPABASE_URL`
   - Value: Your Supabase project URL
6. Click **Save**
7. Repeat for `VITE_SUPABASE_ANON_KEY`
8. **Redeploy** your site

## 🔧 How to Find Your Supabase Credentials

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → Use as `VITE_SUPABASE_URL`
   - **anon/public key** → Use as `VITE_SUPABASE_ANON_KEY`

## ✅ Configuration Files Added

I've added the following configuration files to fix routing and deployment issues:

### `vercel.json`

- Configures SPA routing (redirects all routes to index.html)
- Sets up proper caching headers
- Optimizes build settings

### `netlify.toml`

- Configures SPA routing for Netlify
- Sets up proper caching headers
- Adds security headers

### `public/_redirects`

- Fallback routing configuration for Netlify

## 🔍 Debugging Steps

If you're still experiencing issues:

1. **Check Browser Console:**

   - Open browser dev tools (F12)
   - Look for error messages in the Console tab
   - Red errors usually indicate the problem

2. **Check Network Tab:**

   - Look for failed requests (red status codes)
   - Check if JavaScript files are loading properly

3. **Verify Environment Variables:**

   - The app will now show a helpful error screen if environment variables are missing
   - No more blank screen - you'll see exactly what's wrong

4. **Check Build Logs:**
   - In Vercel/Netlify dashboard, check the build logs
   - Look for any build errors or warnings

## 🚀 Testing the Fix

1. **Local Test:**

   ```bash
   yarn build
   yarn preview
   ```

2. **Production Test:**
   - Deploy to your platform
   - If environment variables are missing, you'll see a helpful error screen instead of blank page
   - The error screen will tell you exactly which variables are missing

## 📞 Still Need Help?

If you're still experiencing issues:

1. Check the browser console for specific error messages
2. Verify all environment variables are set correctly
3. Try redeploying after setting environment variables
4. Contact support with specific error messages

## 🎯 Summary

The main fixes applied:

1. ✅ **Added SPA routing configuration** for Vercel and Netlify
2. ✅ **Fixed environment variable validation** to not crash the app
3. ✅ **Added helpful error UI** instead of blank screen
4. ✅ **Added deployment configuration files**
5. ✅ **Improved error handling** throughout the app

Your app should now:

- ✅ Work properly when environment variables are set
- ✅ Show helpful error messages instead of blank screen
- ✅ Handle client-side routing correctly on deployment platforms
- ✅ Cache static assets properly for better performance

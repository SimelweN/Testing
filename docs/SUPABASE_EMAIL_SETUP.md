# Supabase Email Confirmation Setup Guide

This guide explains how to configure Supabase for proper email confirmation in ReBooked Solutions.

## 🔧 1. Configure Supabase Auth Settings

### Site URL Configuration
1. Go to your **Supabase Project Dashboard**
2. Navigate to **Authentication → URL Configuration**
3. Set the **Site URL** to your deployed website:
   ```
   https://www.rebookedsolutions.co.za
   ```
4. Click **Save**

### Redirect URLs
Add these redirect URLs in the **Redirect URLs** section:
```
https://www.rebookedsolutions.co.za/auth/callback
https://www.rebookedsolutions.co.za/verify
https://www.rebookedsolutions.co.za/reset-password
```

For development, also add:
```
http://localhost:5173/auth/callback
http://localhost:5173/verify
http://localhost:5173/reset-password
```

## ⚙️ 2. Email Template Configuration

### Confirm Email Template
1. Go to **Authentication → Email Templates**
2. Select **Confirm signup**
3. Update the confirmation URL to:
   ```
   {{ .SiteURL }}/auth/callback?access_token={{ .TokenHash }}&type=signup&redirect_to={{ .RedirectTo }}
   ```

### Reset Password Template
1. Select **Reset password**
2. Update the reset URL to:
   ```
   {{ .SiteURL }}/auth/callback?access_token={{ .TokenHash }}&type=recovery&redirect_to={{ .RedirectTo }}
   ```

## 🔄 3. How the Flow Works

### Email Confirmation Flow
1. User registers → Supabase sends confirmation email
2. User clicks link → Redirected to `/auth/callback?access_token=...&type=signup`
3. AuthCallback component processes the tokens
4. User is automatically logged in and redirected to homepage

### Password Reset Flow
1. User requests password reset → Supabase sends reset email
2. User clicks link → Redirected to `/auth/callback?access_token=...&type=recovery`
3. AuthCallback component processes the tokens
4. User is logged in and can change their password

## 📝 Implementation Details

### AuthCallback Component (`/src/pages/AuthCallback.tsx`)
- Handles authentication tokens from Supabase
- Sets user session using `supabase.auth.setSession()`
- Provides user feedback during the process
- Redirects to appropriate pages after success/failure

### Routing Configuration (`/src/App.tsx`)
- Added `/auth/callback` route that renders `AuthCallback` component
- Maintains existing `/verify` route for backward compatibility

### Supabase Client Configuration (`/src/integrations/supabase/client.ts`)
- Configured with `detectSessionInUrl: true`
- Uses PKCE flow for enhanced security
- Auto-refreshes tokens and persists sessions

## 🚨 Important Notes

1. **HTTPS Required**: Supabase requires HTTPS for production email links
2. **URL Matching**: Redirect URLs must exactly match what's configured in Supabase
3. **Token Security**: Access tokens are automatically handled and should not be stored manually
4. **Error Handling**: The AuthCallback component handles various error scenarios
5. **Backward Compatibility**: Existing `/verify` route is maintained for older email links

## 🧪 Testing

### Test Email Confirmation
1. Register a new account
2. Check email for confirmation link
3. Click link → Should redirect to `/auth/callback`
4. Should see "Email verified successfully!" message
5. Should be redirected to homepage while logged in

### Test Password Reset
1. Go to forgot password page
2. Enter email and submit
3. Check email for reset link
4. Click link → Should redirect to `/auth/callback`
5. Should see "Password reset successful!" message
6. Should be logged in automatically

## 🔍 Troubleshooting

### Common Issues
- **404 on callback**: Check that redirect URLs are properly configured in Supabase
- **Token errors**: Ensure HTTPS is used in production
- **No session**: Verify that `supabase.auth.setSession()` is being called correctly
- **Redirect loops**: Check that Site URL matches your domain exactly

### Debug Information
The AuthCallback component logs detailed information to the browser console when in development mode. Check the console for debugging information if issues occur.

# Email Confirmation Fix Guide

## Problem Analysis

The password reset email works correctly, but email confirmation doesn't work. This is because:

1. **Password Reset**: Uses `supabase.auth.resetPasswordForEmail()` - works via Supabase's built-in auth system
2. **Email Confirmation**: Uses `supabase.auth.signUp()` - should also work via Supabase's built-in system but fails

## Root Cause

Supabase's authentication email system is not properly configured in the Supabase Dashboard, even though password reset works (which suggests partial configuration).

## Solution Steps

### 1. Configure Supabase Authentication Email Settings

Go to your Supabase Dashboard → Project → Authentication → Settings → SMTP Settings:

1. **Enable Custom SMTP**: Turn on custom SMTP
2. **SMTP Host**: `smtp-relay.brevo.com` (same as your edge function uses)
3. **SMTP Port**: `587`
4. **SMTP User**: Your Brevo SMTP user (likely `8e237b002@smtp-brevo.com`)
5. **SMTP Password**: Your Brevo SMTP API key
6. **Sender Email**: `noreply@rebookedsolutions.co.za`
7. **Sender Name**: `ReBooked Solutions`

### 2. Configure Auth Templates

In Supabase Dashboard → Authentication → Email Templates:

1. **Confirm signup**: Ensure this template is enabled
2. **Site URL**: Set to `https://rebookedsolutions.co.za`
3. **Redirect URLs**: Add `https://rebookedsolutions.co.za/auth/callback`

### 3. Update Environment Variables (if needed)

The code already uses the correct redirect URL pattern:
```typescript
emailRedirectTo: `${window.location.origin}/auth/callback`
```

### 4. Alternative Solution: Use Supabase's Resend Method

If the above doesn't work immediately, we can implement a manual email verification system using the same approach as password reset:

```typescript
// Add to AuthContext.tsx register method
if (data.user && !data.session) {
  // Try to resend confirmation email using Supabase's resend method
  await supabase.auth.resend({
    type: 'signup',
    email: email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`
    }
  });
}
```

### 5. Verification Steps

1. **Test Password Reset**: Confirm this still works (it should)
2. **Test Registration**: Try registering a new user
3. **Check Email**: Verify confirmation email is received
4. **Test Confirmation**: Click the link and verify it works

## Expected Behavior

After fixing:
1. User registers → Confirmation email sent automatically by Supabase
2. User clicks link → Redirected to `/auth/callback` → Logged in
3. Same reliable system as password reset

## Why This Works

Both password reset and email confirmation will use the same Supabase auth email system, ensuring consistency and reliability.

## Backup Solution

If Supabase SMTP configuration is not available/working, we can implement a hybrid approach where we manually send confirmation emails using the existing edge function while still using Supabase auth for verification.

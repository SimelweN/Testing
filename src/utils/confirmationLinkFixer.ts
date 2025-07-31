import { supabase } from '@/integrations/supabase/client';

/**
 * Helper function to attempt manual verification when confirmation links fail
 */
export const attemptManualVerification = async (params: {
  token_hash?: string | null;
  access_token?: string | null; 
  refresh_token?: string | null;
  type?: string | null;
}) => {
  const { token_hash, access_token, refresh_token, type } = params;

  // Method 1: Try session-based authentication
  if (access_token && refresh_token) {
    try {
      const { data, error } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      });
      
      if (!error && data.session) {
        return { success: true, method: 'session', data };
      }
    } catch (err) {
      console.warn('Session method failed:', err);
    }
  }

  // Method 2: Try OTP verification with token_hash
  if (token_hash && type) {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash,
        type: type as any,
      });
      
      if (!error && data.session) {
        return { success: true, method: 'otp_hash', data };
      }
    } catch (err) {
      console.warn('OTP hash method failed:', err);
    }
  }

  // Method 3: Try to get existing session (user might already be verified)
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (!error && data.session) {
      return { success: true, method: 'existing_session', data };
    }
  } catch (err) {
    console.warn('Existing session check failed:', err);
  }

  return { success: false, method: 'none' };
};

/**
 * Extract parameters from various URL formats
 */
export const extractConfirmationParams = (url?: string) => {
  const targetUrl = url || window.location.href;
  
  // Parse both search params and hash params
  const urlObj = new URL(targetUrl);
  const searchParams = new URLSearchParams(urlObj.search);
  const hashParams = new URLSearchParams(urlObj.hash.substring(1));
  
  const getParam = (name: string) => {
    return searchParams.get(name) || hashParams.get(name) || null;
  };

  return {
    token_hash: getParam('token_hash'),
    access_token: getParam('access_token'),
    refresh_token: getParam('refresh_token'),
    type: getParam('type'),
    error: getParam('error'),
    error_description: getParam('error_description'),
  };
};

/**
 * Check if URL appears to be a valid confirmation link
 */
export const isValidConfirmationLink = (url?: string) => {
  const params = extractConfirmationParams(url);
  
  return !!(
    params.token_hash || 
    (params.access_token && params.refresh_token) ||
    params.type
  );
};

/**
 * Provide user-friendly error messages for common confirmation link issues
 */
export const getConfirmationLinkErrorMessage = (error: any) => {
  const errorMsg = error?.message || error?.toString() || '';
  
  if (errorMsg.includes('expired')) {
    return 'This confirmation link has expired. Please request a new verification email.';
  }
  
  if (errorMsg.includes('invalid') || errorMsg.includes('malformed')) {
    return 'This confirmation link is invalid. Please check the link or request a new one.';
  }
  
  if (errorMsg.includes('already confirmed') || errorMsg.includes('already verified')) {
    return 'Your email is already verified! You can now log in normally.';
  }
  
  if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
    return 'Network error. Please check your internet connection and try again.';
  }
  
  return 'Confirmation link failed. Please try requesting a new verification email.';
};

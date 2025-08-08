/**
 * Password Reset Flow Test Utility
 * 
 * This utility helps verify that the password reset flow is working correctly.
 * It provides debugging information for the authentication callback and reset password pages.
 */

export const testPasswordResetFlow = () => {
  const currentUrl = window.location.href;
  const searchParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  
  console.log("🔍 Password Reset Flow Test");
  console.log("📍 Current URL:", currentUrl);
  console.log("📍 Current Path:", window.location.pathname);
  
  // Check URL parameters
  const access_token = searchParams.get("access_token") || hashParams.get("access_token");
  const refresh_token = searchParams.get("refresh_token") || hashParams.get("refresh_token");
  const type = searchParams.get("type") || hashParams.get("type");
  const token_hash = searchParams.get("token_hash") || hashParams.get("token_hash");
  const token = searchParams.get("token") || hashParams.get("token");
  const error = searchParams.get("error") || hashParams.get("error");
  const error_description = searchParams.get("error_description") || hashParams.get("error_description");
  
  console.log("🔑 Auth Parameters:", {
    hasAccessToken: !!access_token,
    hasRefreshToken: !!refresh_token,
    hasTokenHash: !!token_hash,
    hasToken: !!token,
    type,
    error,
    error_description,
  });
  
  // Determine flow type
  if (window.location.pathname === "/auth/callback") {
    console.log("📍 Currently on AuthCallback page");
    
    if (type === "recovery") {
      console.log("✅ Recovery type detected - should redirect to /reset-password");
      
      if (access_token && refresh_token) {
        console.log("✅ Has access/refresh tokens - token-based flow");
      } else if (token_hash || token) {
        console.log("✅ Has token_hash/token - OTP-based flow");
      } else {
        console.log("❌ Missing required tokens for password reset");
      }
    } else {
      console.log("ℹ️ Not a recovery flow, type:", type);
    }
    
    if (error) {
      console.error("❌ Error in auth callback:", {
        error: error,
        errorDescription: error_description,
        timestamp: new Date().toISOString()
      });
    }
  } else if (window.location.pathname === "/reset-password") {
    console.log("📍 Currently on ResetPassword page");
    console.log("✅ User successfully reached the reset password form");
  } else {
    console.log("📍 On different page:", window.location.pathname);
  }
  
  return {
    currentPath: window.location.pathname,
    isAuthCallback: window.location.pathname === "/auth/callback",
    isResetPassword: window.location.pathname === "/reset-password",
    hasAuthTokens: !!(access_token && refresh_token),
    hasOtpTokens: !!(token_hash || token),
    isRecoveryFlow: type === "recovery",
    hasErrors: !!error,
    parameters: {
      access_token: !!access_token,
      refresh_token: !!refresh_token,
      token_hash: !!token_hash,
      token,
      type,
      error,
      error_description,
    }
  };
};

// Add to window for easy testing in browser console
if (typeof window !== 'undefined') {
  (window as any).testPasswordResetFlow = testPasswordResetFlow;
}

export default testPasswordResetFlow;

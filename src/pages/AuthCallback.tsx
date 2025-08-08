import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getSafeErrorMessage } from "@/utils/errorMessageUtils";
import { useAuth } from "@/contexts/AuthContext";
import { attemptManualVerification, getConfirmationLinkErrorMessage } from "@/utils/confirmationLinkFixer";
import { useEmailConfirmationWelcome } from "@/hooks/useEmailConfirmationWelcome";

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { markEmailConfirmation } = useEmailConfirmationWelcome();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  // Check if user is already authenticated and redirect them
  // BUT NOT for password reset flows - they need to reach the reset form
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      // Enhanced parameter extraction for already authenticated users
      const getParam = (name: string) => {
        let value = searchParams.get(name);
        if (value) return value;
        value = new URLSearchParams(window.location.hash.substring(1)).get(name);
        if (value) return value;
        const fullUrl = window.location.href;
        const decodedUrl = decodeURIComponent(fullUrl);
        const regex = new RegExp(`[?&#]${name}=([^&#]*)`);
        const match = decodedUrl.match(regex);
        return match ? match[1] : null;
      };

      const type = getParam("type");
      const token_hash = getParam("token_hash");
      const access_token = getParam("access_token");

      if (type === "recovery") {
        console.log("🔐 Authenticated user in recovery flow - redirecting directly to reset password");
        navigate("/reset-password", { replace: true });
        return;
      }

      // If user is authenticated but came via confirmation link, show success message
      if (type === "signup" || token_hash || access_token) {
        console.log("✅ User already authenticated via confirmation link");
        toast.success("Email already verified! You are logged in.");
        navigate("/", { replace: true });
        return;
      }

      console.log("🔄 User already authenticated, redirecting from auth callback");
      toast.success("You are already logged in!");
      navigate("/", { replace: true });
      return;
    }
  }, [isAuthenticated, authLoading, navigate, searchParams]);

  useEffect(() => {
    // Don't process auth callback if user is already authenticated or auth is still loading
    if (authLoading || isAuthenticated) {
      return;
    }
    const handleAuthCallback = async () => {
      try {
        console.log("🔍 Processing auth callback");
        console.log("📍 Current URL:", window.location.href);
        console.log("📍 Search params:", window.location.search);
        console.log("📍 Hash:", window.location.hash);

        // FIRST: Check if Supabase has already authenticated the user automatically
        // This happens in many cases where the callback URL contains valid tokens
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

        if (!sessionError && sessionData.session && sessionData.user) {
          console.log("✅ User already authenticated automatically by Supabase!");
          setStatus("success");

          const type = new URLSearchParams(window.location.search).get("type") ||
                      new URLSearchParams(window.location.hash.substring(1)).get("type");

          if (type === "recovery") {
            setMessage("Password reset link verified! Redirecting to reset your password.");
            toast.success("Reset link verified! Set your new password.");
            navigate("/reset-password", { replace: true });
          } else if (type === "signup") {
            markEmailConfirmation();
            setMessage("Email verified successfully! Welcome to ReBooked Solutions.");
            toast.success("Email verified! Welcome!");
            setTimeout(() => navigate("/", { replace: true }), 1500);
          } else {
            setMessage("Authentication successful! You are now logged in.");
            toast.success("Successfully authenticated!");
            setTimeout(() => navigate("/", { replace: true }), 1500);
          }
          return;
        }

        // Enhanced URL parameter extraction - handle multiple formats
        const getParam = (name: string) => {
          // Check search params first
          let value = searchParams.get(name);
          if (value) return value;

          // Check hash params
          value = new URLSearchParams(window.location.hash.substring(1)).get(name);
          if (value) return value;

          // Check for URL-encoded parameters (some email clients encode URLs)
          const fullUrl = window.location.href;
          const encodedParam = encodeURIComponent(name + '=');
          const decodedUrl = decodeURIComponent(fullUrl);

          // Try to extract from decoded URL
          const regex = new RegExp(`[?&#]${name}=([^&#]*)`);
          const match = decodedUrl.match(regex);
          if (match) return match[1];

          return null;
        };

        const access_token = getParam("access_token");
        const refresh_token = getParam("refresh_token");
        const type = getParam("type");

        // Debug password reset flow specifically
        if (type === "recovery") {
          console.log("🔐 PASSWORD RESET FLOW DETECTED");
          console.log("🔐 This should redirect to /reset-password after authentication");
        }
        const error = getParam("error");
        const error_description = getParam("error_description");

        // Also check for token_hash and token (for OTP verification)
        const token_hash = getParam("token_hash");
        const token = getParam("token");

        console.log("🔑 Auth callback parameters:", {
          hasAccessToken: !!access_token,
          hasRefreshToken: !!refresh_token,
          hasTokenHash: !!token_hash,
          hasToken: !!token,
          type,
          error,
          error_description,
          fullSearch: window.location.search,
          fullHash: window.location.hash
        });

        // Handle errors first
        if (error) {
          console.error("❌ Auth callback error:", error, error_description);
          setStatus("error");
          const safeErrorMsg = getSafeErrorMessage(error_description || error, 'Authentication failed');
          setMessage(safeErrorMsg);
          toast.error(`Authentication failed: ${safeErrorMsg}`);
          return;
        }

        // Handle token-based authentication (email confirmation, password reset)
        if (access_token && refresh_token) {
          console.log("🔑 Setting session with access/refresh tokens");

          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });

          if (sessionError) {
            console.error("❌ Session setting error:", sessionError);
            setStatus("error");
            setMessage("Failed to authenticate. Please try logging in manually.");
            toast.error("Authentication failed. Please try logging in.");
            return;
          }

          if (data.session && data.user) {
            console.log("✅ Session set successfully:", data.user.email);
            setStatus("success");

            if (type === "signup") {
              markEmailConfirmation();
              setMessage("Email verified successfully! Welcome to ReBooked Solutions.");
              toast.success("Email verified! Welcome!");
              // Redirect to dashboard/profile or home page after a delay
              setTimeout(() => {
                navigate("/", { replace: true });
              }, 2000);
            } else if (type === "recovery") {
              console.log("🔐 Password recovery type detected (token path) - redirecting to reset password page");
              setMessage("Password reset link verified! Redirecting to reset your password.");
              toast.success("Reset link verified! Set your new password.");
              // Redirect to reset password page immediately for better UX
              console.log("🔄 Navigating to /reset-password from token path");
              navigate("/reset-password", { replace: true });
            } else {
              setMessage("Authentication successful! You are now logged in.");
              toast.success("Successfully authenticated!");
              // Redirect to dashboard/profile or home page after a delay
              setTimeout(() => {
                navigate("/", { replace: true });
              }, 2000);
            }
            return;
          }
        }

        // Handle OTP verification (token_hash or token)
        if ((token_hash || token) && type) {
          console.log("🔐 Attempting OTP verification with:", { hasTokenHash: !!token_hash, hasToken: !!token, type });

          const verificationData = token_hash
            ? {
                token_hash: token_hash,
                type: type as "signup" | "email_change" | "recovery" | "email",
              }
            : {
                token: token!,
                type: type as "signup" | "email_change" | "recovery" | "email",
              };

          const { data, error: otpError } = await supabase.auth.verifyOtp(verificationData);

          if (otpError) {
            console.error("❌ OTP verification error:", otpError);
            setStatus("error");

            // Use helper function for better error messages
            const friendlyErrorMsg = getConfirmationLinkErrorMessage(otpError);
            setMessage(friendlyErrorMsg);

            if (otpError.message?.includes("already confirmed")) {
              toast.success("Email already verified!");
              setTimeout(() => {
                navigate("/login", { replace: true });
              }, 2000);
            } else {
              toast.error(friendlyErrorMsg);
            }
            return;
          }

          if (data.session && data.user) {
            console.log("✅ OTP verification successful:", data.user.email);
            setStatus("success");

            if (type === "signup") {
              markEmailConfirmation();
              setMessage("Email verified successfully! Welcome to ReBooked Solutions.");
              toast.success("Email verified! Welcome!");
              setTimeout(() => {
                navigate("/", { replace: true });
              }, 2000);
            } else if (type === "recovery") {
              console.log("🔐 Password recovery type detected (OTP path) - redirecting to reset password page");
              setMessage("Password reset link verified! Redirecting to reset your password.");
              toast.success("Reset link verified! Set your new password.");
              // Redirect to reset password page immediately for better UX
              console.log("🔄 Navigating to /reset-password from OTP path");
              navigate("/reset-password", { replace: true });
            } else {
              setMessage("Email verification successful! You are now logged in.");
              toast.success("Email verified successfully!");
              setTimeout(() => {
                navigate("/", { replace: true });
              }, 2000);
            }
            return;
          } else {
            console.warn("⚠️ OTP verification succeeded but no session returned");
            setStatus("error");
            setMessage("Verification succeeded but session was not created. Please try logging in.");
            return;
          }
        }

        // Handle other types of auth callbacks (like OAuth)
        if (type) {
          console.log("🔄 Processing auth type:", type);
          
          // Let Supabase handle the session automatically
          const { data, error: authError } = await supabase.auth.getSession();
          
          if (authError) {
            console.error("❌ Session retrieval error:", authError);
            setStatus("error");
            setMessage("Failed to retrieve session. Please try logging in.");
            return;
          }

          if (data.session) {
            console.log("✅ Session retrieved successfully");
            setStatus("success");
            setMessage("Successfully authenticated!");
            
            setTimeout(() => {
              navigate("/", { replace: true });
            }, 2000);
            return;
          }
        }

        // If we get here, check once more if user got authenticated during the process
        const { data: finalSessionCheck } = await supabase.auth.getSession();
        if (finalSessionCheck.session && finalSessionCheck.user) {
          console.log("✅ User authenticated during callback processing!");
          setStatus("success");
          setMessage("Authentication successful! You are now logged in.");
          toast.success("Successfully authenticated!");
          setTimeout(() => navigate("/", { replace: true }), 1500);
          return;
        }

        // Try manual verification as a last resort
        console.warn("⚠️ No valid auth parameters found, attempting manual verification");
        console.log("Available parameters:", {
          searchParams: Object.fromEntries(searchParams.entries()),
          hashParams: window.location.hash ? Object.fromEntries(new URLSearchParams(window.location.hash.substring(1)).entries()) : {}
        });

        try {
          const manualResult = await attemptManualVerification({
            token_hash,
            access_token,
            refresh_token,
            type
          });

          if (manualResult.success) {
            console.log(`✅ Manual verification succeeded via ${manualResult.method}`);
            setStatus("success");

            if (type === "signup") {
              markEmailConfirmation();
              setMessage("Email verified successfully! Welcome to ReBooked Solutions.");
              toast.success("Email verified! Welcome!");
              setTimeout(() => navigate("/", { replace: true }), 1500);
            } else if (type === "recovery") {
              setMessage("Password reset link verified! Redirecting to reset your password.");
              toast.success("Reset link verified! Set your new password.");
              navigate("/reset-password", { replace: true });
            } else {
              setMessage("Authentication successful! You are now logged in.");
              toast.success("Successfully authenticated!");
              setTimeout(() => navigate("/", { replace: true }), 1500);
            }
            return;
          }
        } catch (manualError) {
          console.warn("Manual verification also failed:", manualError);
        }

        // Final check: maybe user is authenticated but we just can't detect the params
        const { data: veryFinalCheck } = await supabase.auth.getSession();
        if (veryFinalCheck.session && veryFinalCheck.user) {
          console.log("✅ User is authenticated despite unclear parameters!");
          setStatus("success");
          setMessage("Authentication successful! You are now logged in.");
          toast.success("Successfully authenticated!");
          setTimeout(() => navigate("/", { replace: true }), 1500);
          return;
        }

        // Only show error if we're really sure auth failed
        setStatus("error");
        setMessage("Authentication link appears to be invalid or expired. Please try logging in directly or request a new verification email.");
        
      } catch (error) {
        console.error("❌ Auth callback exception:", error);
        setStatus("error");
        const safeErrorMsg = getSafeErrorMessage(error, "An unexpected error occurred during authentication");
        setMessage(safeErrorMsg);
        toast.error(`Authentication failed: ${safeErrorMsg}`);
      }
    };

    handleAuthCallback();
  }, [searchParams, navigate, authLoading, isAuthenticated]);

  const handleRetry = () => {
    navigate("/login", { replace: true });
  };

  const handleGoHome = () => {
    navigate("/", { replace: true });
  };

  return (
    <Layout>
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-lg p-6 md:p-8 text-center">
            {status === "loading" && (
              <>
                <Loader2 className="h-12 w-12 text-book-600 mx-auto mb-4 animate-spin" />
                <h2 className="text-xl md:text-2xl font-semibold mb-2 text-gray-800">
                  Authenticating...
                </h2>
                <p className="text-gray-600 text-sm md:text-base">
                  Please wait while we process your authentication.
                </p>
              </>
            )}

            {status === "success" && (
              <>
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h2 className="text-xl md:text-2xl font-semibold mb-2 text-gray-800">
                  Success!
                </h2>
                <p className="text-gray-600 mb-4 text-sm md:text-base">
                  {message}
                </p>
                <p className="text-xs md:text-sm text-gray-500">
                  Redirecting you to the homepage...
                </p>
              </>
            )}

            {status === "error" && (
              <>
                <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl md:text-2xl font-semibold mb-2 text-gray-800">
                  Authentication Failed
                </h2>
                <p className="text-gray-600 mb-6 text-sm md:text-base">
                  {message}
                </p>

                {/* Debug Information for Development */}
                {process.env.NODE_ENV === "development" && (
                  <div className="mb-6 p-4 bg-gray-100 rounded-lg text-left text-xs">
                    <h4 className="font-semibold mb-2">Debug Information:</h4>
                    <div className="space-y-1 text-gray-600">
                      <p><strong>URL:</strong> {window.location.href}</p>
                      <p><strong>Search:</strong> {window.location.search || "none"}</p>
                      <p><strong>Hash:</strong> {window.location.hash || "none"}</p>
                      <p><strong>Available Params:</strong></p>
                      <ul className="ml-4 list-disc">
                        {Array.from(searchParams.entries()).map(([key, value]) => (
                          <li key={key}>{key}: {value}</li>
                        ))}
                        {window.location.hash && Array.from(new URLSearchParams(window.location.hash.substring(1)).entries()).map(([key, value]) => (
                          <li key={`hash-${key}`}>hash-{key}: {value}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Simple diagnostic help */}
                <details className="mb-6">
                  <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800 mb-2">
                    🔧 Need Help? Common Solutions
                  </summary>
                  <div className="border border-gray-200 rounded-lg p-4 text-sm space-y-2">
                    <p><strong>Common issues with confirmation links:</strong></p>
                    <ul className="list-disc list-inside space-y-1 text-gray-600">
                      <li>Link may have expired (confirmation links expire after 24 hours)</li>
                      <li>Email client may have modified the link</li>
                      <li>Link may have already been used</li>
                      <li>Try copying the entire link and pasting it into a new browser tab</li>
                    </ul>
                    <div className="mt-3 p-2 bg-blue-50 rounded">
                      <p><strong>Quick fixes:</strong></p>
                      <ul className="list-disc list-inside text-xs text-blue-800">
                        <li>Request a new verification email</li>
                        <li>Try opening the link in an incognito/private browsing window</li>
                        <li>Clear your browser cache and cookies</li>
                      </ul>
                    </div>
                  </div>
                </details>

                <div className="space-y-3">
                  <Button
                    onClick={handleRetry}
                    className="bg-book-600 hover:bg-book-700 text-white w-full"
                  >
                    Go to Login
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleGoHome}
                    className="w-full"
                  >
                    Go to Homepage
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => navigate("/verify", {
                      replace: true,
                      state: { fromCallback: true, originalUrl: window.location.href }
                    })}
                    className="w-full text-sm text-gray-500"
                  >
                    Try Alternative Verification
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AuthCallback;

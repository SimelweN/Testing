import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getSafeErrorMessage } from "@/utils/errorMessageUtils";
import { useAuth } from "@/contexts/AuthContext";
import ConfirmationLinkDiagnostic from "@/components/ConfirmationLinkDiagnostic";

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  // Check if user is already authenticated and redirect them
  // BUT NOT for password reset flows - they need to reach the reset form
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      // Check if this is a password reset flow by looking at URL parameters
      const type = searchParams.get("type") || new URLSearchParams(window.location.hash.substring(1)).get("type");

      if (type === "recovery") {
        console.log("🔐 Authenticated user in recovery flow - redirecting directly to reset password");
        navigate("/reset-password", { replace: true });
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

        // Get tokens from URL parameters (both search params and hash)
        const access_token = searchParams.get("access_token") || new URLSearchParams(window.location.hash.substring(1)).get("access_token");
        const refresh_token = searchParams.get("refresh_token") || new URLSearchParams(window.location.hash.substring(1)).get("refresh_token");
        const type = searchParams.get("type") || new URLSearchParams(window.location.hash.substring(1)).get("type");

        // Debug password reset flow specifically
        if (type === "recovery") {
          console.log("🔐 PASSWORD RESET FLOW DETECTED");
          console.log("🔐 This should redirect to /reset-password after authentication");
        }
        const error = searchParams.get("error") || new URLSearchParams(window.location.hash.substring(1)).get("error");
        const error_description = searchParams.get("error_description") || new URLSearchParams(window.location.hash.substring(1)).get("error_description");

        // Also check for token_hash and token (for OTP verification)
        const token_hash = searchParams.get("token_hash") || new URLSearchParams(window.location.hash.substring(1)).get("token_hash");
        const token = searchParams.get("token") || new URLSearchParams(window.location.hash.substring(1)).get("token");

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

            // Handle specific OTP errors
            if (otpError.message?.includes("expired") || otpError.message?.includes("OTP expired")) {
              setMessage("The verification link has expired. Please request a new verification email.");
              toast.error("Verification link expired. Please request a new one.");
            } else if (otpError.message?.includes("invalid")) {
              setMessage("Invalid verification link. Please check the link or request a new one.");
              toast.error("Invalid verification link.");
            } else if (otpError.message?.includes("already confirmed")) {
              setMessage("Email already verified! You can now log in.");
              toast.success("Email already verified!");
              setTimeout(() => {
                navigate("/login", { replace: true });
              }, 2000);
            } else {
              const safeErrorMsg = getSafeErrorMessage(otpError.message || otpError, 'OTP verification failed');
              setMessage(safeErrorMsg);
              toast.error(safeErrorMsg);
            }
            return;
          }

          if (data.session && data.user) {
            console.log("✅ OTP verification successful:", data.user.email);
            setStatus("success");

            if (type === "signup") {
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

        // If we get here, no valid auth parameters were found
        console.warn("⚠️ No valid auth parameters found");
        console.log("Available parameters:", {
          searchParams: Object.fromEntries(searchParams.entries()),
          hashParams: window.location.hash ? Object.fromEntries(new URLSearchParams(window.location.hash.substring(1)).entries()) : {}
        });
        setStatus("error");
        setMessage("Invalid authentication link. No valid tokens or verification parameters found. Please try logging in directly or request a new verification email.");
        
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

                {/* Enhanced Diagnostic Tool */}
                <details className="mb-6">
                  <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800 mb-2">
                    🔧 Show Advanced Diagnostics
                  </summary>
                  <div className="border border-gray-200 rounded-lg p-2">
                    <ConfirmationLinkDiagnostic />
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

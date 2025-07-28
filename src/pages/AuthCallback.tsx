import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getSafeErrorMessage } from "@/utils/errorMessageUtils";

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log("🔍 Processing auth callback");
        console.log("📍 Current URL:", window.location.href);

        // Get tokens from URL parameters
        const access_token = searchParams.get("access_token");
        const refresh_token = searchParams.get("refresh_token");
        const type = searchParams.get("type");
        const error = searchParams.get("error");
        const error_description = searchParams.get("error_description");

        console.log("🔑 Auth callback parameters:", {
          hasAccessToken: !!access_token,
          hasRefreshToken: !!refresh_token,
          type,
          error,
          error_description
        });

        // Handle errors first
        if (error) {
          console.error("❌ Auth callback error:", error, error_description);
          setStatus("error");
          setMessage(error_description || error);
          toast.error(`Authentication failed: ${error_description || error}`);
          return;
        }

        // Handle token-based authentication (email confirmation, password reset)
        if (access_token && refresh_token) {
          console.log("🔑 Setting session with tokens");
          
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
              setMessage("Password reset link verified! Redirecting to reset your password.");
              toast.success("Reset link verified! Set your new password.");
              // Redirect to reset password page after a delay
              setTimeout(() => {
                navigate("/reset-password", { replace: true });
              }, 2000);
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
        setStatus("error");
        setMessage("Invalid authentication link. Please try logging in directly.");
        
      } catch (error) {
        console.error("❌ Auth callback exception:", error);
        setStatus("error");
        setMessage("An unexpected error occurred during authentication.");
        toast.error("Authentication failed unexpectedly");
      }
    };

    handleAuthCallback();
  }, [searchParams, navigate]);

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

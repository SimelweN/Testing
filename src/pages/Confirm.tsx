import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useOAuthRedirect } from "@/hooks/useOAuthRedirect";
import Layout from "@/components/Layout";
import { Loader2, CheckCircle, XCircle, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const Confirm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("");

  // Handle OAuth redirect with custom success message for confirmation page
  useOAuthRedirect({
    successMessage: "Account confirmed and logged in successfully!",
    redirectTo: "/",
  });

  useEffect(() => {
    const handleConfirm = async () => {
      try {
        console.log("Starting email confirmation process");

        // Get all possible parameters
        const token_hash = searchParams.get("token_hash");
        const type = searchParams.get("type");
        const access_token = searchParams.get("access_token");
        const refresh_token = searchParams.get("refresh_token");
        const error_code = searchParams.get("error_code");
        const error_description = searchParams.get("error_description");

        console.log("URL params:", {
          token_hash: !!token_hash,
          type,
          access_token: !!access_token,
          refresh_token: !!refresh_token,
          error_code,
          error_description,
        });

        // Check for errors first
        if (error_code || error_description) {
          console.error("Confirmation error from URL:", {
            error_code,
            error_description,
          });
          setStatus("error");
          setMessage(error_description || "Email confirmation failed");
          toast.error(error_description || "Email confirmation failed");
          return;
        }

        // Method 1: Token hash verification (most reliable)
        if (token_hash && type) {
          console.log("Using token hash verification");
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash,
            type: type as
              | "signup"
              | "invite"
              | "email_change"
              | "recovery"
              | "phone_change",
          });

          if (error) {
            console.error(
              "Token hash verification error:",
              error.message || String(error),
            );
            throw error;
          }

          if (data.session) {
            console.log("Email confirmed successfully with token hash");
            setStatus("success");
            setMessage("Email confirmed successfully! You are now logged in.");
            toast.success("Email confirmed successfully!");
            setTimeout(() => navigate("/"), 2000);
            return;
          }
        }

        // Method 2: Check if OAuth redirect is being handled
        if (access_token && refresh_token) {
          console.log(
            "OAuth tokens detected - letting OAuth handler process this",
          );
          // Let the useOAuthRedirect hook handle this
          return;
        }

        // Method 3: Code exchange (last resort)
        console.log("Attempting code exchange method");
        const { data, error } = await supabase.auth.exchangeCodeForSession(
          window.location.href,
        );

        if (error) {
          console.error("Code exchange error:", error.message || String(error));
          throw error;
        }

        if (data.session) {
          console.log("Code exchange successful");
          setStatus("success");
          setMessage("Email confirmed successfully! You are now logged in.");
          toast.success("Email confirmed successfully!");
          setTimeout(() => navigate("/"), 2000);
          return;
        }

        // If we get here, none of the methods worked
        throw new Error("Unable to confirm email with any available method");
      } catch (error: unknown) {
        console.error(
          "Email confirmation error:",
          error instanceof Error ? error.message : String(error),
        );
        setStatus("error");

        let errorMessage = "Email confirmation failed. ";
        const errorMsg = error instanceof Error ? error.message : String(error);
        if (errorMsg?.includes("expired")) {
          errorMessage += "The confirmation link has expired.";
        } else if (errorMsg?.includes("already confirmed")) {
          errorMessage += "This email has already been confirmed.";
        } else if (errorMsg?.includes("invalid")) {
          errorMessage += "The confirmation link is invalid.";
        } else {
          errorMessage += "Please try again or contact support.";
        }

        setMessage(errorMessage);
        toast.error(errorMessage);
      }
    };

    handleConfirm();
  }, [navigate, searchParams]);

  return (
    <Layout>
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-lg p-6 md:p-8 text-center">
            {status === "loading" && (
              <>
                <Loader2 className="h-12 w-12 text-book-600 mx-auto mb-4 animate-spin" />
                <h2 className="text-xl md:text-2xl font-semibold mb-2 text-gray-800">
                  Confirming your email...
                </h2>
                <p className="text-gray-600 text-sm md:text-base">
                  Please wait while we confirm your email address.
                </p>
              </>
            )}

            {status === "success" && (
              <>
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h2 className="text-xl md:text-2xl font-semibold mb-2 text-gray-800">
                  Email Confirmed!
                </h2>
                <p className="text-gray-600 mb-4 text-sm md:text-base">
                  {message}
                </p>
                <p className="text-xs md:text-sm text-gray-500 mb-4">
                  Welcome to ReBooked Solutions - Pre-Loved Pages, New
                  Adventures
                </p>
                <p className="text-xs md:text-sm text-gray-500">
                  Redirecting you to the home page...
                </p>
              </>
            )}

            {status === "error" && (
              <>
                <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl md:text-2xl font-semibold mb-2 text-gray-800">
                  Confirmation Failed
                </h2>
                <p className="text-gray-600 mb-6 text-sm md:text-base">
                  {message}
                </p>
                <div className="space-y-3">
                  <Button
                    onClick={() => navigate("/login")}
                    className="bg-book-600 hover:bg-book-700 text-white px-4 md:px-6 py-2 rounded-lg transition-colors text-sm md:text-base w-full"
                  >
                    Go to Login
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate("/register")}
                    className="px-4 md:px-6 py-2 rounded-lg transition-colors text-sm md:text-base w-full"
                  >
                    Register Again
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => navigate("/")}
                    className="text-sm text-gray-500 w-full"
                  >
                    Go to Home Page
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

export default Confirm;

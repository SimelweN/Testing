import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import Layout from "@/components/Layout";
import { Loader2, CheckCircle, XCircle, Info, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { EmailVerificationService } from "@/services/emailVerificationService";
import { supabase } from "@/integrations/supabase/client";

const Verify = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [status, setStatus] = useState<
    "loading" | "success" | "error" | "debug"
  >("loading");
  const [message, setMessage] = useState("");
  const [debugInfo, setDebugInfo] = useState<{
    url: string;
    params: URLSearchParams;
    queryString: string;
    userAgent: string;
    timestamp: string;
  } | null>(null);
  const [resendEmail, setResendEmail] = useState("");
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    const handleVerification = async () => {
      try {
        console.log("🔍 Starting email verification process");
        console.log("📍 Current URL:", window.location.href);

        // Extract parameters using the service
        const params =
          EmailVerificationService.extractParamsFromUrl(searchParams);

        const urlParams = {
          ...params,
          fullUrl: window.location.href,
          searchString: window.location.search,
          hash: window.location.hash,
        };

        console.log("🔍 All URL parameters:", urlParams);
        setDebugInfo(urlParams);

        // Use the verification service
        const result = await EmailVerificationService.verifyEmail(
          params,
          window.location.href,
        );

        if (result.success) {
          console.log("✅ Email verification successful:", result);
          setStatus("success");
          setMessage(result.message);
          toast.success("Email verified successfully!");

          // Redirect to home page after successful verification
          setTimeout(() => {
            navigate("/", { replace: true });
          }, 2000);
        } else {
          console.error("❌ Email verification failed:", result);

          // Get user-friendly error message
          const errorMessage =
            EmailVerificationService.getFormattedErrorMessage?.(result) ||
            result.message;

          // If no verification parameters found, show debug mode
          if (
            !params.token_hash &&
            !params.token &&
            !params.code &&
            !params.error_code
          ) {
            setStatus("debug");
            setMessage(
              "No verification parameters found in URL. Please see debug information below.",
            );
          } else {
            setStatus("error");
            setMessage(errorMessage);
            toast.error(errorMessage);
          }
        }
      } catch (error: unknown) {
        console.error(
          "❌ Email verification exception:",
          error instanceof Error ? error.message : String(error),
        );
        setStatus("error");

        const errorMessage =
          error?.message || "Unexpected error during verification";
        setMessage(errorMessage);
        toast.error(errorMessage);
      }
    };

    handleVerification();
  }, [navigate, searchParams, location]);

  const handleResendVerification = async () => {
    if (!resendEmail.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    setIsResending(true);
    try {
      const result =
        await EmailVerificationService.resendVerificationEmail(resendEmail);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to resend verification email");
    } finally {
      setIsResending(false);
    }
  };

  const handleManualVerification = async () => {
    const token = searchParams.get("token");
    const tokenHash = searchParams.get("token_hash");
    const type = searchParams.get("type");

    if (!token && !tokenHash) {
      toast.error("No verification token found in URL");
      return;
    }

    if (!type) {
      toast.error("No verification type found in URL");
      return;
    }

    try {
      console.log("🔐 Attempting manual verification");

      const verificationData = tokenHash
        ? {
            token_hash: tokenHash,
            type: type as "signup" | "email_change" | "recovery" | "email",
          }
        : {
            token: token!,
            type: type as "signup" | "email_change" | "recovery" | "email",
          };

      const { data, error } = await supabase.auth.verifyOtp(verificationData);

      if (error) {
        console.error("❌ Manual verification error:", error);
        toast.error(`Manual verification failed: ${error.message}`);
      } else if (data.session) {
        console.log("✅ Manual verification successful");
        setStatus("success");
        setMessage("Email verified successfully! You are now logged in.");
        toast.success("Email verified successfully!");
        setTimeout(() => navigate("/"), 2000);
      } else {
        toast.error("Verification did not return a session");
      }
    } catch (error: unknown) {
      console.error(
        "❌ Exception during manual verification:",
        error instanceof Error ? error.message : String(error),
      );
      const errorMessage =
        error instanceof Error ? error.message : "Manual verification failed";
      toast.error(`Manual verification failed: ${errorMessage}`);
    }
  };

  const hasVerificationParams = () => {
    return searchParams.has("token") || searchParams.has("token_hash");
  };

  return (
    <Layout>
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="w-full max-w-2xl">
          <div className="bg-white rounded-lg shadow-lg p-6 md:p-8 text-center">
            {status === "loading" && (
              <>
                <Loader2 className="h-12 w-12 text-book-600 mx-auto mb-4 animate-spin" />
                <h2 className="text-xl md:text-2xl font-semibold mb-2 text-gray-800">
                  Verifying your email...
                </h2>
                <p className="text-gray-600 text-sm md:text-base">
                  Please wait while we verify your email address.
                </p>
                {debugInfo && (
                  <div className="mt-4 text-xs text-gray-500">
                    Processing: {debugInfo.type || "unknown"} verification
                  </div>
                )}
              </>
            )}

            {status === "success" && (
              <>
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h2 className="text-xl md:text-2xl font-semibold mb-2 text-gray-800">
                  Email Verified!
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
                  Verification Failed
                </h2>
                <p className="text-gray-600 mb-6 text-sm md:text-base">
                  {message}
                </p>

                {debugInfo && (
                  <Card className="mb-6 text-left">
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-2 text-sm">
                        Debug Information:
                      </h4>
                      <div className="text-xs text-gray-600 space-y-1">
                        <div>URL: {debugInfo.fullUrl}</div>
                        <div>Type: {debugInfo.type || "none"}</div>
                        <div>
                          Token Hash:{" "}
                          {debugInfo.token_hash ? "present" : "none"}
                        </div>
                        <div>
                          Legacy Token: {debugInfo.token ? "present" : "none"}
                        </div>
                        <div>Code: {debugInfo.code ? "present" : "none"}</div>
                        {debugInfo.error_code && (
                          <div>Error Code: {debugInfo.error_code}</div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Verification Tools */}
                <Card className="mb-6">
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-4">
                      Email Verification Tools
                    </h4>

                    {hasVerificationParams() && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-3">
                          Verification parameters detected. Try manual
                          verification:
                        </p>
                        <Button
                          onClick={handleManualVerification}
                          className="w-full mb-3"
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          Verify Manually
                        </Button>
                      </div>
                    )}

                    <div className="space-y-3">
                      <p className="text-sm text-gray-600">
                        Didn't receive the verification email? Enter your email
                        to resend:
                      </p>
                      <div className="flex gap-2">
                        <Input
                          type="email"
                          placeholder="your.email@example.com"
                          value={resendEmail}
                          onChange={(e) => setResendEmail(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleResendVerification()
                          }
                        />
                        <Button
                          onClick={handleResendVerification}
                          disabled={isResending || !resendEmail.trim()}
                        >
                          {isResending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Send"
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="text-xs text-gray-500 mt-4 space-y-1">
                      <p>• Check your spam/junk folder</p>
                      <p>• Make sure the email address is correct</p>
                      <p>• Verification links expire after 24 hours</p>
                    </div>
                  </CardContent>
                </Card>

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

            {status === "debug" && (
              <>
                <Info className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                <h2 className="text-xl md:text-2xl font-semibent mb-2 text-gray-800">
                  Debug Information
                </h2>
                <p className="text-gray-600 mb-6 text-sm md:text-base">
                  {message}
                </p>

                {debugInfo && (
                  <Card className="mb-6 text-left">
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-2">
                        Email Verification Debug Info:
                      </h4>
                      <div className="text-sm text-gray-700 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="font-medium">Full URL:</div>
                          <div className="break-all">{debugInfo.fullUrl}</div>

                          <div className="font-medium">Search String:</div>
                          <div>{debugInfo.searchString || "none"}</div>

                          <div className="font-medium">Hash:</div>
                          <div>{debugInfo.hash || "none"}</div>

                          <div className="font-medium">Type:</div>
                          <div>{debugInfo.type || "none"}</div>

                          <div className="font-medium">Token Hash:</div>
                          <div>{debugInfo.token_hash ? "present" : "none"}</div>

                          <div className="font-medium">Legacy Token:</div>
                          <div>{debugInfo.token ? "present" : "none"}</div>

                          <div className="font-medium">PKCE Code:</div>
                          <div>{debugInfo.code ? "present" : "none"}</div>

                          {debugInfo.error_code && (
                            <>
                              <div className="font-medium">Error Code:</div>
                              <div>{debugInfo.error_code}</div>
                            </>
                          )}

                          {debugInfo.error_description && (
                            <>
                              <div className="font-medium">
                                Error Description:
                              </div>
                              <div>{debugInfo.error_description}</div>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="space-y-3">
                  <p className="text-sm text-gray-600 mb-4">
                    Please share this information with support if you need help.
                  </p>
                  <Button
                    onClick={() => window.location.reload()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 md:px-6 py-2 rounded-lg transition-colors text-sm md:text-base w-full"
                  >
                    Try Again
                  </Button>
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

export default Verify;

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EmailChangeService } from "@/services/emailChangeService";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Loader2,
  CheckCircle,
  XCircle,
  Mail,
  LogOut,
  Home,
} from "lucide-react";

const ConfirmEmailChange = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const confirmEmailChange = async () => {
      try {
        const token = searchParams.get("token");

        if (!token) {
          setStatus("error");
          setMessage("Invalid confirmation link - no token provided");
          return;
        }

        console.log("🔍 Confirming email change...");
        const result = await EmailChangeService.confirmEmailChange(token);

        if (result.success) {
          setStatus("success");
          setMessage(result.message);
          toast.success("Email updated successfully!");
        } else {
          setStatus("error");
          setMessage(result.message);
          toast.error(result.message);
        }
      } catch (error: unknown) {
        console.error(
          "Email change confirmation failed:",
          error instanceof Error ? error.message : String(error),
        );
        setStatus("error");
        setMessage("Failed to process email change confirmation");
        toast.error("Failed to process email change confirmation");
      }
    };

    confirmEmailChange();
  }, [searchParams]);

  const handleLoginRedirect = async () => {
    try {
      setIsLoggingOut(true);

      // Log out the user so they can log in with new email
      await logout();

      // Redirect to login with success message
      navigate("/login", {
        state: {
          message:
            "Email updated successfully! Please log in with your new email address.",
        },
        replace: true,
      });
    } catch (error) {
      console.error(
        "Logout failed:",
        error instanceof Error ? error.message : String(error),
      );
      // Navigate anyway
      navigate("/login", { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleGoHome = () => {
    navigate("/", { replace: true });
  };

  return (
    <Layout>
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <Card className="shadow-lg">
            <CardContent className="p-6 md:p-8 text-center">
              {status === "loading" && (
                <>
                  <Loader2 className="h-12 w-12 text-book-600 mx-auto mb-4 animate-spin" />
                  <h2 className="text-xl md:text-2xl font-semibold mb-2 text-gray-800">
                    Confirming Email Change...
                  </h2>
                  <p className="text-gray-600 text-sm md:text-base">
                    Please wait while we update your email address.
                  </p>
                </>
              )}

              {status === "success" && (
                <>
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h2 className="text-xl md:text-2xl font-semibold mb-2 text-gray-800">
                    Email Updated Successfully!
                  </h2>
                  <p className="text-gray-600 mb-6 text-sm md:text-base">
                    {message}
                  </p>

                  <Alert className="mb-6 border-blue-200 bg-blue-50 text-left">
                    <Mail className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-700">
                      <strong>Important:</strong> Please log in again with your
                      new email address to ensure all services work correctly
                      with your updated account.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-3">
                    <Button
                      onClick={handleLoginRedirect}
                      disabled={isLoggingOut}
                      className="w-full bg-book-600 hover:bg-book-700"
                    >
                      {isLoggingOut ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Logging out...
                        </>
                      ) : (
                        <>
                          <LogOut className="h-4 w-4 mr-2" />
                          Log in with New Email
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={handleGoHome}
                      variant="outline"
                      className="w-full"
                    >
                      <Home className="h-4 w-4 mr-2" />
                      Continue to Home
                    </Button>
                  </div>
                </>
              )}

              {status === "error" && (
                <>
                  <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <h2 className="text-xl md:text-2xl font-semibold mb-2 text-gray-800">
                    Email Change Failed
                  </h2>
                  <p className="text-gray-600 mb-6 text-sm md:text-base">
                    {message}
                  </p>

                  <Alert className="mb-6 border-orange-200 bg-orange-50 text-left">
                    <AlertDescription className="text-orange-700">
                      <strong>What to try:</strong>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Check if the confirmation link has expired</li>
                        <li>Request a new email change from your profile</li>
                        <li>
                          Make sure you're using the complete link from the
                          email
                        </li>
                        <li>Contact support if the problem persists</li>
                      </ul>
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-3">
                    <Button
                      onClick={() => navigate("/profile")}
                      className="w-full bg-book-600 hover:bg-book-700"
                    >
                      Go to Profile
                    </Button>

                    <Button
                      onClick={handleGoHome}
                      variant="outline"
                      className="w-full"
                    >
                      <Home className="h-4 w-4 mr-2" />
                      Go to Home
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Mobile-optimized spacing and text */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 leading-relaxed">
              Having trouble? Contact our support team for assistance with your
              account.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ConfirmEmailChange;

import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useOAuthRedirect } from "@/hooks/useOAuthRedirect";
import Layout from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Mail,
  Lock,
  Loader2,
  AlertCircle,
  Key,
  UserPlus,
  RefreshCw,
} from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<
    "verify_email" | "register" | "reset_password" | "general" | null
  >(null);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Handle OAuth redirect with token hash fragment
  useOAuthRedirect();

  useEffect(() => {
    window.scrollTo(0, 0);

    // Show message from registration redirect
    if (location.state?.message) {
      toast.info(location.state.message);
      if (location.state?.email) {
        setEmail(location.state.email);
      }
    }
  }, [location.state]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleResendVerification = async () => {
    if (!email.trim()) {
      toast.error("Please enter your email address first");
      return;
    }

    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/verify`,
        },
      });

      if (error) {
        toast.error(`Failed to resend verification email: ${error.message}`);
      } else {
        toast.success(
          "Verification email sent! Please check your inbox and spam folder.",
        );
        setLoginError(null);
        setErrorType(null);
      }
    } catch (error) {
      toast.error("Failed to resend verification email");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError(null);
    setErrorType(null);

    try {
      if (!email.trim() || !password.trim()) {
        throw new Error("Email and password are required");
      }

      console.log("Attempting login with:", email);
      await login(email, password);
      console.log("Login successful, navigating to home");
      navigate("/", { replace: true });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Login failed";
      console.error("Login error in component:", errorMessage);

      setLoginError(errorMessage);

      // Determine error type for better UX
      if (
        errorMessage.includes("verification") ||
        errorMessage.includes("verified")
      ) {
        setErrorType("verify_email");
      } else if (
        errorMessage.includes("No account") ||
        errorMessage.includes("not found")
      ) {
        setErrorType("register");
      } else if (
        errorMessage.includes("password") ||
        errorMessage.includes("credentials")
      ) {
        setErrorType("reset_password");
      } else {
        setErrorType("general");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderErrorCard = () => {
    if (!loginError) return null;

    const getErrorIcon = () => {
      switch (errorType) {
        case "verify_email":
          return <Mail className="h-5 w-5 text-orange-500" />;
        case "reset_password":
          return <Key className="h-5 w-5 text-yellow-500" />;
        case "register":
          return <UserPlus className="h-5 w-5 text-blue-500" />;
        default:
          return <AlertCircle className="h-5 w-5 text-red-500" />;
      }
    };

    const getErrorTitle = () => {
      switch (errorType) {
        case "verify_email":
          return "Email Verification Required";
        case "reset_password":
          return "Password Issue";
        case "register":
          return "Account Not Found";
        default:
          return "Login Failed";
      }
    };

    return (
      <Card className="mb-6 border-red-200 bg-red-50">
        <CardContent className="p-4">
          <Alert>
            <div className="flex items-start space-x-3">
              {getErrorIcon()}
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-2">
                  {getErrorTitle()}
                </h4>
                <AlertDescription className="text-gray-700 mb-4">
                  {loginError}
                </AlertDescription>

                {errorType === "verify_email" && (
                  <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="text-sm text-orange-800">
                      <p className="font-medium mb-2">
                        📧 Email Verification Steps:
                      </p>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>
                          Check your inbox for an email from ReBooked Solutions
                        </li>
                        <li>If not found, check your spam/junk folder</li>
                        <li>Click the verification link in the email</li>
                        <li>Return here to log in</li>
                      </ol>
                    </div>
                  </div>
                )}

                {errorType === "register" && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">💡 Account Not Found</p>
                      <p>
                        No account exists with the email:{" "}
                        <strong>{email}</strong>
                      </p>
                      <p>
                        Please check the email address or create a new account.
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {errorType === "verify_email" && (
                    <Button
                      onClick={handleResendVerification}
                      className="w-full"
                      variant="default"
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Resend Verification Email
                    </Button>
                  )}

                  {errorType === "reset_password" && (
                    <Button
                      onClick={() =>
                        navigate("/forgot-password", { state: { email } })
                      }
                      className="w-full"
                      variant="default"
                    >
                      <Key className="h-4 w-4 mr-2" />
                      Reset Password
                    </Button>
                  )}

                  {errorType === "register" && (
                    <Button
                      onClick={() =>
                        navigate("/register", { state: { email } })
                      }
                      className="w-full"
                      variant="default"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Create Account
                    </Button>
                  )}

                  <Button
                    onClick={() => {
                      setLoginError(null);
                      setErrorType(null);
                      // Focus on password field for retry
                      setTimeout(() => {
                        const passwordInput =
                          document.getElementById("password");
                        if (passwordInput) {
                          passwordInput.focus();
                        }
                      }, 100);
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                </div>
              </div>
            </div>
          </Alert>
        </CardContent>
      </Card>
    );
  };

  return (
    <Layout>
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {renderErrorCard()}

          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-6 sm:p-8">
              <h1 className="text-2xl font-bold text-center text-gray-800 mb-8">
                Login to ReBooked Solutions
              </h1>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-sm font-medium text-gray-700"
                  >
                    Email
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      className="pl-10 h-12 border-gray-300 focus:border-book-500 focus:ring-book-500 rounded-lg"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="password"
                      className="text-sm font-medium text-gray-700"
                    >
                      Password
                    </Label>
                    <Link
                      to="/forgot-password"
                      className="text-sm text-book-600 hover:text-book-800 font-medium transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10 h-12 border-gray-300 focus:border-book-500 focus:ring-book-500 rounded-lg"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-book-600 hover:bg-book-700 text-white font-medium rounded-lg transition-colors"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    "Log in"
                  )}
                </Button>
              </form>

              <div className="mt-8 text-center">
                <p className="text-sm text-gray-600">
                  Don't have an account?{" "}
                  <Link
                    to="/register"
                    className="text-book-600 hover:text-book-800 font-medium transition-colors"
                  >
                    Sign up
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Login;

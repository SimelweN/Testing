import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Mail, Lock, User, Loader2, BookOpen, Book } from "lucide-react";
import { BackupEmailService } from "@/utils/backupEmailService";


const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  if (isAuthenticated) {
    navigate("/");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    console.log("🚀 Starting registration process...");
    console.log("📧 Email:", email);
    console.log("👤 Name:", name);
    console.log("🔐 Password length:", password.length);
    console.log("✅ Terms accepted:", termsAccepted);

    try {
      if (!name.trim() || !email.trim() || !password.trim()) {
        throw new Error("All fields are required");
      }

      if (!termsAccepted) {
        throw new Error(
          "You must accept the Terms & Conditions and Privacy Policy",
        );
      }

      if (password !== confirmPassword) {
        throw new Error("Passwords do not match");
      }

      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters long");
      }

      console.log("🔄 Calling register function...");
      const result = await register(email, password, name);
      console.log("✅ Register function returned:", result);

      // Handle different registration outcomes
      if (result?.needsVerification) {
        if (result?.isExistingUnverified) {
          // Existing user who needs verification
          toast.info("Account found! Verification email resent.", {
            duration: 4000,
          });

          toast.info(
            "📧 Your account exists but needs email verification. Please check your inbox (including spam folder) for the verification link.",
            {
              duration: 8000,
            },
          );
        } else {
          // New account created
          toast.success("🎉 Account created successfully!", {
            duration: 4000,
          });

          toast.info(
            "📧 Please check your email (including spam folder) for the verification link. If you don't receive it, try the 'Resend Email' option on the login page.",
            {
              duration: 8000,
            },
          );
        }

        // Set email sent state to show confirmation UI
        setEmailSent(true);
        setUserEmail(email);

        setTimeout(() => {
          navigate("/login", {
            state: {
              message: result?.isExistingUnverified
                ? "Your account needs email verification. Check your email for the verification link."
                : "Account created! Please check your email for the verification link. You can resend the email if needed.",
              email,
            },
          });
        }, 3000);
      } else if (result?.emailWarning) {
        // Registration successful but email confirmation may have failed
        toast.success("Account created successfully! You can now log in.", {
          duration: 4000,
        });
        toast.info(
          "📧 Note: Email confirmation service is temporarily unavailable, but your account is fully functional!",
          {
            duration: 8000,
          },
        );

        setTimeout(() => {
          navigate("/login", {
            state: {
              message:
                "Your account has been created successfully. You can now log in.",
              email,
            },
          });
        }, 2000);
      } else {
        // Direct login (no email verification needed)
        toast.success("Registration successful! You are now logged in.", {
          duration: 4000,
        });

        setTimeout(() => {
          navigate("/", { replace: true });
        }, 1000);
      }
    } catch (error: unknown) {
      // Better error logging
      console.group("📝 Registration Error Details");
      console.error("Error:", error);
      console.error("Message:", error instanceof Error ? error.message : String(error));
      console.error("Email:", email);
      console.error("Name:", name);
      console.groupEnd();

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Registration failed. Please try again.";

      // Handle specific error types with better user guidance
      if (errorMessage.includes("already exists") || errorMessage.includes("already registered")) {
        toast.error("Account Already Exists", {
          duration: 6000,
        });

        toast.info(
          "📧 An account with this email already exists. Please try logging in instead. If you forgot your password, use the 'Forgot Password' option.",
          {
            duration: 8000,
          }
        );

        // Redirect to login with the email prefilled
        setTimeout(() => {
          navigate("/login", {
            state: {
              message: "Account already exists. Please log in or reset your password if needed.",
              email,
            },
          });
        }, 2000);
      } else if (
        errorMessage.toLowerCase().includes("email") ||
        errorMessage.toLowerCase().includes("confirmation") ||
        errorMessage.toLowerCase().includes("smtp") ||
        errorMessage.toLowerCase().includes("mail") ||
        errorMessage.toLowerCase().includes("supabase")
      ) {
        // Show user-friendly message for email service issues
        toast.error("📧 Email Service Configuration Required", {
          duration: 8000,
        });

        toast.info(
          "The email confirmation system needs to be set up by an administrator. " +
          "Please contact support or try again later once the email service is configured.",
          {
            duration: 10000,
          }
        );

        console.log("📧 Email service configuration needed - user informed");
      } else {
        // Show the error to the user
        toast.error(errorMessage, {
          duration: 6000,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-6 sm:p-8">
              <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
                Create an Account
              </h1>

              {emailSent && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800">
                    <Mail className="h-5 w-5" />
                    <span className="font-medium">Email Sent Successfully!</span>
                  </div>
                  <p className="text-green-700 text-sm mt-2">
                    A confirmation email has been sent to <strong>{userEmail}</strong>.
                    Please check your inbox (and spam folder) for the verification link.
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      className="pl-10"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-10 pr-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center pr-3 group"
                      onClick={() => setShowPassword(!showPassword)}
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      <div className="relative">
                        {showPassword ? (
                          <BookOpen className="h-5 w-5 text-book-500 hover:text-book-600 transition-all duration-300 ease-in-out transform hover:scale-110 book-open-animation" />
                        ) : (
                          <Book className="h-5 w-5 text-gray-400 hover:text-book-500 transition-all duration-300 ease-in-out transform hover:scale-110 book-close-animation" />
                        )}
                      </div>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-10 pr-10"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center pr-3 group"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      title={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      <div className="relative">
                        {showConfirmPassword ? (
                          <BookOpen className="h-5 w-5 text-book-500 hover:text-book-600 transition-all duration-300 ease-in-out transform hover:scale-110 book-open-animation" />
                        ) : (
                          <Book className="h-5 w-5 text-gray-400 hover:text-book-500 transition-all duration-300 ease-in-out transform hover:scale-110 book-close-animation" />
                        )}
                      </div>
                    </button>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="terms"
                    checked={termsAccepted}
                    onCheckedChange={(checked) =>
                      setTermsAccepted(checked === true)
                    }
                    className="mt-1"
                    required
                  />
                  <Label
                    htmlFor="terms"
                    className="text-sm text-gray-600 leading-relaxed"
                  >
                    I agree to the{" "}
                    <Link
                      to="/policies"
                      className="text-book-600 hover:text-book-800 underline"
                    >
                      Terms & Conditions and Privacy Policy
                    </Link>
                  </Label>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-book-600 hover:bg-book-700"
                  disabled={isLoading || !termsAccepted}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm">
                <p className="text-gray-600">
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="text-book-600 hover:text-book-800 font-medium"
                  >
                    Log in
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

export default Register;

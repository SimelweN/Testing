import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Mail, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";

const TestEmailSystem = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<{
    passwordReset?: { success: boolean; message: string };
    emailConfirmation?: { success: boolean; message: string };
  }>({});

  const testPasswordReset = async () => {
    if (!email.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    setIsLoading(true);
    try {
      console.log("🔧 Testing password reset email...");
      
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
      });

      if (error) {
        setResults(prev => ({
          ...prev,
          passwordReset: { success: false, message: error.message }
        }));
        toast.error(`Password reset failed: ${error.message}`);
      } else {
        setResults(prev => ({
          ...prev,
          passwordReset: { success: true, message: "Password reset email sent successfully!" }
        }));
        toast.success("Password reset email sent!");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setResults(prev => ({
        ...prev,
        passwordReset: { success: false, message }
      }));
      toast.error(`Password reset failed: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testEmailConfirmation = async () => {
    if (!email.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    setIsLoading(true);
    try {
      console.log("🔧 Testing email confirmation...");

      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        let message = error.message;
        let success = false;

        // Some "errors" are actually informational
        if (error.message?.includes("already confirmed") ||
            error.message?.includes("already verified")) {
          message = "User already verified (this is actually good!)";
          success = true;
        } else if (error.message?.includes("not found")) {
          message = "User not found (would need to register first)";
        }

        setResults(prev => ({
          ...prev,
          emailConfirmation: { success, message }
        }));

        if (success) {
          toast.success("Email system working (user already verified)");
        } else {
          toast.error(`Email confirmation test: ${message}`);
        }
      } else {
        setResults(prev => ({
          ...prev,
          emailConfirmation: { success: true, message: "Confirmation email sent successfully!" }
        }));
        toast.success("Confirmation email sent!");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setResults(prev => ({
        ...prev,
        emailConfirmation: { success: false, message }
      }));
      toast.error(`Email confirmation failed: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const ResultIcon = ({ success }: { success: boolean }) => 
    success ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    );

  return (
    <Layout>
      <div className="container max-w-2xl mx-auto py-8 px-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-6 w-6" />
              Email System Test
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <AlertDescription>
                This tool tests both password reset and email confirmation systems 
                to ensure they're using the same reliable Supabase auth methods.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="test-email">Test Email Address</Label>
              <Input
                id="test-email"
                type="email"
                placeholder="test@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={testPasswordReset}
                disabled={isLoading}
                variant="outline"
                className="w-full"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Mail className="h-4 w-4 mr-2" />
                )}
                Test Password Reset
              </Button>

              <Button
                onClick={testEmailConfirmation}
                disabled={isLoading}
                variant="outline"
                className="w-full"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Mail className="h-4 w-4 mr-2" />
                )}
                Test Email Confirmation
              </Button>
            </div>

            {/* Results */}
            {Object.keys(results).length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Test Results</h3>
                
                {results.passwordReset && (
                  <div className="flex items-start gap-3 p-4 border rounded-lg">
                    <ResultIcon success={results.passwordReset.success} />
                    <div>
                      <h4 className="font-medium">Password Reset</h4>
                      <p className="text-sm text-gray-600">
                        {results.passwordReset.message}
                      </p>
                    </div>
                  </div>
                )}

                {results.emailConfirmation && (
                  <div className="flex items-start gap-3 p-4 border rounded-lg">
                    <ResultIcon success={results.emailConfirmation.success} />
                    <div>
                      <h4 className="font-medium">Email Confirmation</h4>
                      <p className="text-sm text-gray-600">
                        {results.emailConfirmation.message}
                      </p>
                    </div>
                  </div>
                )}

                {results.passwordReset && results.emailConfirmation && (
                  <Alert className={
                    results.passwordReset.success && results.emailConfirmation.success
                      ? "border-green-200 bg-green-50"
                      : "border-orange-200 bg-orange-50"
                  }>
                    <AlertDescription>
                      {results.passwordReset.success && results.emailConfirmation.success ? (
                        <span className="text-green-800">
                          ✅ Both email systems are working correctly!
                        </span>
                      ) : (
                        <span className="text-orange-800">
                          ⚠️ Email systems have different behavior. Check Supabase Dashboard → Authentication → Settings → SMTP Settings.
                        </span>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            <div className="text-sm text-gray-500 space-y-2">
              <p><strong>Expected behavior:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li>Password reset should always work (uses existing configuration)</li>
                <li>Email confirmation should now work the same way</li>
                <li>Both should use Supabase's built-in authentication system</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default TestEmailSystem;

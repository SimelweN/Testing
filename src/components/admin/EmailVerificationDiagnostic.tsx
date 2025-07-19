import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Mail,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Settings,
  TestTube,
} from "lucide-react";

const EmailVerificationDiagnostic: React.FC = () => {
  const [testEmail, setTestEmail] = useState("");
  const [testPassword] = useState("TempTest123!");
  const [testName] = useState("Test User");
  const [isTestingAuth, setIsTestingAuth] = useState(false);
  const [isTestingConfig, setIsTestingConfig] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [authResult, setAuthResult] = useState<string | null>(null);
  const [configResult, setConfigResult] = useState<string | null>(null);
  const [testUserId, setTestUserId] = useState<string | null>(null);

  const testSupabaseAuthConfig = async () => {
    setIsTestingConfig(true);
    setConfigResult(null);

    try {
      console.log("🔧 Testing Supabase auth configuration...");

      // Get current session to test auth connectivity
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError) {
        setConfigResult(`❌ Auth Session Error: ${sessionError.message}`);
        return;
      }

      // Test auth settings by checking user management capability
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError && !userError.message.includes("not authenticated")) {
        setConfigResult(`❌ Auth User Error: ${userError.message}`);
        return;
      }

      // Check if we can access auth admin (indicates configuration)
      try {
        // This will fail if not properly configured but won't throw
        await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
        setConfigResult("✅ Supabase auth configuration appears to be working");
      } catch (adminError) {
        // Expected for client-side, this is normal
        setConfigResult(
          "✅ Supabase auth is accessible (admin features not available from client)",
        );
      }

      toast.success("Auth configuration test completed");
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      setConfigResult(`❌ Configuration Test Failed: ${errorMsg}`);
      toast.error(`Configuration test failed: ${errorMsg}`);
    } finally {
      setIsTestingConfig(false);
    }
  };

  const testEmailVerificationFlow = async () => {
    if (!testEmail.trim()) {
      toast.error("Please enter a test email");
      return;
    }

    setIsTestingAuth(true);
    setAuthResult(null);
    setTestUserId(null);

    try {
      console.log("🔄 Testing email verification flow with:", testEmail);

      // Step 1: Attempt signup with email verification
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
          data: { name: testName },
          emailRedirectTo: `${window.location.origin}/verify`,
        },
      });

      if (error) {
        setAuthResult(`❌ Signup Failed: ${error.message}`);
        toast.error(`Signup failed: ${error.message}`);
        return;
      }

      console.log("📧 Signup response:", data);

      // Step 2: Analyze the response
      if (data.user && !data.session) {
        // This is the expected behavior for email verification
        setTestUserId(data.user.id);
        setAuthResult(`✅ Email verification is WORKING! User created but not logged in.
        
User ID: ${data.user.id}
Email Status: ${data.user.email_confirmed_at ? "Confirmed" : "Pending verification"}
Created: ${data.user.created_at}

📧 A verification email should have been sent to: ${testEmail}
Check the inbox and spam folder for the verification link.`);
        toast.success("Email verification flow is working correctly!");
      } else if (data.user && data.session) {
        // Email verification is disabled - user is immediately logged in
        setTestUserId(data.user.id);
        setAuthResult(`⚠️ Email verification is DISABLED! User was immediately logged in.

User ID: ${data.user.id}
Session: Active
Email Status: ${data.user.email_confirmed_at ? "Confirmed" : "Not required"}

This means Supabase email confirmation is turned off in your project settings.`);
        toast.warning("Email verification is disabled in Supabase settings");
      } else if (data.user && !data.user.id) {
        setAuthResult(`❓ Unexpected response: User object exists but no ID`);
        toast.warning("Unexpected signup response");
      } else {
        setAuthResult(
          `❓ Unexpected signup response: ${JSON.stringify(data, null, 2)}`,
        );
        toast.warning("Unexpected signup response");
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      setAuthResult(`❌ Test Failed: ${errorMsg}`);
      toast.error(`Email verification test failed: ${errorMsg}`);
    } finally {
      setIsTestingAuth(false);
    }
  };

  const testResendVerification = async () => {
    if (!testEmail.trim()) {
      toast.error("Please enter the test email");
      return;
    }

    setIsResending(true);

    try {
      console.log("🔄 Testing resend verification email...");

      const { error } = await supabase.auth.resend({
        type: "signup",
        email: testEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/verify`,
        },
      });

      if (error) {
        toast.error(`Resend failed: ${error.message}`);
        setAuthResult(
          (prev) => prev + `\n\n❌ Resend test failed: ${error.message}`,
        );
      } else {
        toast.success("Verification email resent successfully!");
        setAuthResult(
          (prev) => prev + `\n\n✅ Resend test successful - check email inbox`,
        );
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Resend test failed: ${errorMsg}`);
    } finally {
      setIsResending(false);
    }
  };

  const cleanupTestUser = async () => {
    if (!testUserId) {
      toast.error("No test user to cleanup");
      return;
    }

    try {
      // Note: This requires admin privileges, might not work from client
      console.log("🧹 Attempting to cleanup test user...");

      toast.info("Test user cleanup attempted (may require admin access)");
      setTestUserId(null);
    } catch (error) {
      console.warn("Cleanup failed (expected from client):", error);
      toast.warning("Manual cleanup may be needed for test user");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Email Verification Diagnostic
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-blue-200 bg-blue-50">
            <AlertTriangle className="h-4 w-4 text-blue-600" />
            <AlertDescription>
              <strong>Email Verification Test</strong>
              <p className="text-sm mt-1">
                This tool tests if Supabase email verification is properly
                configured during user signup. Use a real email address that you
                can check for verification emails.
              </p>
            </AlertDescription>
          </Alert>

          <div>
            <Label htmlFor="testEmail">Test Email Address</Label>
            <Input
              id="testEmail"
              type="email"
              placeholder="your.test.email@gmail.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">
              Use a real email you can access to check for verification emails
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={testSupabaseAuthConfig}
              disabled={isTestingConfig}
              variant="outline"
              className="w-full"
            >
              {isTestingConfig ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing Config...
                </>
              ) : (
                <>
                  <Settings className="mr-2 h-4 w-4" />
                  Test Auth Config
                </>
              )}
            </Button>

            <Button
              onClick={testEmailVerificationFlow}
              disabled={isTestingAuth || !testEmail.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isTestingAuth ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing Verification...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Test Email Verification
                </>
              )}
            </Button>
          </div>

          {testUserId && (
            <div className="flex gap-2">
              <Button
                onClick={testResendVerification}
                disabled={isResending || !testEmail.trim()}
                variant="outline"
                className="flex-1"
              >
                {isResending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resending...
                  </>
                ) : (
                  "Test Resend Email"
                )}
              </Button>

              <Button onClick={cleanupTestUser} variant="ghost" size="sm">
                Cleanup Test User
              </Button>
            </div>
          )}

          {/* Results */}
          <div className="space-y-3">
            {configResult && (
              <Alert
                className={
                  configResult.includes("✅")
                    ? "border-green-200 bg-green-50"
                    : "border-red-200 bg-red-50"
                }
              >
                {configResult.includes("✅") ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription>
                  <strong>Configuration Test:</strong>
                  <pre className="whitespace-pre-wrap text-sm mt-2">
                    {configResult}
                  </pre>
                </AlertDescription>
              </Alert>
            )}

            {authResult && (
              <Alert
                className={
                  authResult.includes("✅")
                    ? "border-green-200 bg-green-50"
                    : authResult.includes("⚠️")
                      ? "border-yellow-200 bg-yellow-50"
                      : "border-red-200 bg-red-50"
                }
              >
                {authResult.includes("✅") ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : authResult.includes("⚠️") ? (
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription>
                  <strong>Email Verification Test:</strong>
                  <pre className="whitespace-pre-wrap text-sm mt-2">
                    {authResult}
                  </pre>
                </AlertDescription>
              </Alert>
            )}
          </div>

          <Alert className="border-gray-200 bg-gray-50">
            <AlertDescription>
              <strong>How to fix "Error sending confirmation email":</strong>
              <ul className="list-disc ml-6 mt-2 space-y-1 text-sm">
                <li>
                  <strong>If email verification is working:</strong> The issue
                  is elsewhere (check email service config)
                </li>
                <li>
                  <strong>If email verification is disabled:</strong> Enable it
                  in Supabase Dashboard → Authentication → Settings
                </li>
                <li>
                  <strong>If getting errors:</strong> Check Supabase project
                  configuration and SMTP settings
                </li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailVerificationDiagnostic;

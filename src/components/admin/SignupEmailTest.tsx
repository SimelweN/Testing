import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";

const SignupEmailTest: React.FC = () => {
  const [testEmail, setTestEmail] = useState("");
  const [isTestingSupabase, setIsTestingSupabase] = useState(false);
  const [isTestingCustom, setIsTestingCustom] = useState(false);
  const [supabaseResult, setSupabaseResult] = useState<string | null>(null);
  const [customResult, setCustomResult] = useState<string | null>(null);

  const testSupabaseEmailAuth = async () => {
    if (!testEmail.trim()) {
      toast.error("Please enter a test email");
      return;
    }

    setIsTestingSupabase(true);
    setSupabaseResult(null);

    try {
      // Test Supabase's built-in email confirmation
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: "TempTest123!",
        options: {
          data: { name: "Test User" },
          emailRedirectTo: `${window.location.origin}/verify`,
        },
      });

      if (error) {
        setSupabaseResult(`❌ Supabase Error: ${error.message}`);
        toast.error(`Supabase signup failed: ${error.message}`);
        return;
      }

      if (data.user && !data.session) {
        setSupabaseResult(
          "✅ Supabase signup successful - Email verification required",
        );
        toast.success(
          "Supabase signup successful! Check email for confirmation.",
        );
      } else if (data.user && data.session) {
        setSupabaseResult(
          "⚠️ Supabase signup successful but no email verification required (email confirmation disabled)",
        );
        toast.warning(
          "Signup successful but email confirmation appears disabled",
        );
      } else {
        setSupabaseResult("❓ Unexpected Supabase response");
        toast.warning("Unexpected response from Supabase");
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      setSupabaseResult(`❌ Exception: ${errorMsg}`);
      toast.error(`Error testing Supabase: ${errorMsg}`);
    } finally {
      setIsTestingSupabase(false);
    }
  };

  const testCustomEmailService = async () => {
    if (!testEmail.trim()) {
      toast.error("Please enter a test email");
      return;
    }

    setIsTestingCustom(true);
    setCustomResult(null);

    try {
      // Test our custom email service
      const { data, error } = await supabase.functions.invoke("send-email", {
        body: {
          to: testEmail,
          from: "noreply@rebookedsolutions.co.za",
          subject: "[TEST] Email Confirmation Test - ReBooked Solutions",
          html: generateTestConfirmationEmail(testEmail),
          text: `Test Confirmation Email\n\nThis is a test email to verify our email service is working.\n\nEmail: ${testEmail}\n\nReBooked Solutions`,
        },
      });

      if (error) {
        setCustomResult(`❌ Custom Email Error: ${error.message}`);
        toast.error(`Custom email failed: ${error.message}`);
        return;
      }

      if (data?.success) {
        setCustomResult("✅ Custom email service working correctly");
        toast.success("Custom email sent successfully!");
      } else {
        setCustomResult(
          `❌ Custom email failed: ${data?.error || "Unknown error"}`,
        );
        toast.error("Custom email service failed");
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      setCustomResult(`❌ Exception: ${errorMsg}`);
      toast.error(`Error testing custom email: ${errorMsg}`);
    } finally {
      setIsTestingCustom(false);
    }
  };

  const testEmailServiceConfig = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("send-email", {
        body: { test: true },
      });

      if (error) {
        toast.error(`Email service config error: ${error.message}`);
        return;
      }

      if (data?.success) {
        toast.success("Email service configuration is valid");
      } else {
        toast.error("Email service configuration issue");
      }
    } catch (error) {
      toast.error(
        `Config test failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  const generateTestConfirmationEmail = (email: string) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Email Service Test - ReBooked Solutions</title>
      <style>
        body { font-family: Arial, sans-serif; background-color: #f3fef7; padding: 20px; color: #1f4e3d; }
        .container { max-width: 500px; margin: auto; background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05); }
        .success-box { background: #d1fae5; border: 1px solid #10b981; padding: 15px; border-radius: 5px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>📧 Email Service Test</h1>
        
        <div class="success-box">
          <strong>✅ Email service is working correctly!</strong>
        </div>

        <p><strong>Test Details:</strong></p>
        <p>
          Recipient: ${email}<br>
          Service: Custom Email Function<br>
          Time: ${new Date().toISOString()}<br>
        </p>

        <p>If you received this email, the ReBooked Solutions email service is functioning properly.</p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #6b7280;">
          <strong>ReBooked Solutions - Email Service Test</strong><br>
          <em>"Pre-Loved Pages, New Adventures"</em>
        </p>
      </div>
    </body>
    </html>
  `;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Signup Email Confirmation Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="testEmail">Test Email Address</Label>
            <Input
              id="testEmail"
              type="email"
              placeholder="test@example.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={testEmailServiceConfig}
              variant="outline"
              className="w-full"
            >
              Test Email Config
            </Button>

            <Button
              onClick={testSupabaseEmailAuth}
              disabled={isTestingSupabase || !testEmail.trim()}
              className="w-full"
            >
              {isTestingSupabase ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing Supabase...
                </>
              ) : (
                "Test Supabase Auth"
              )}
            </Button>

            <Button
              onClick={testCustomEmailService}
              disabled={isTestingCustom || !testEmail.trim()}
              className="w-full"
            >
              {isTestingCustom ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing Custom...
                </>
              ) : (
                "Test Custom Email"
              )}
            </Button>
          </div>

          {/* Results */}
          <div className="space-y-3">
            {supabaseResult && (
              <Alert
                className={
                  supabaseResult.includes("✅")
                    ? "border-green-200 bg-green-50"
                    : "border-red-200 bg-red-50"
                }
              >
                {supabaseResult.includes("✅") ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription>
                  <strong>Supabase Auth Test:</strong> {supabaseResult}
                </AlertDescription>
              </Alert>
            )}

            {customResult && (
              <Alert
                className={
                  customResult.includes("✅")
                    ? "border-green-200 bg-green-50"
                    : "border-red-200 bg-red-50"
                }
              >
                {customResult.includes("✅") ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription>
                  <strong>Custom Email Test:</strong> {customResult}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <Alert className="border-blue-200 bg-blue-50">
            <AlertDescription>
              <strong>How to use:</strong>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>
                  <strong>Test Email Config:</strong> Check if email service
                  environment is configured
                </li>
                <li>
                  <strong>Test Supabase Auth:</strong> Test Supabase's built-in
                  email confirmation
                </li>
                <li>
                  <strong>Test Custom Email:</strong> Test our custom email
                  service function
                </li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignupEmailTest;

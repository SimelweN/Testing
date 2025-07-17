import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, Send, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface EmailTestResult {
  success: boolean;
  messageId?: string;
  error?: string;
  timing?: number;
}

const EmailTestingComponent = () => {
  const [testEmail, setTestEmail] = useState({
    to: "",
    subject: "✅ Test Email - ReBooked Solutions",
    htmlContent: "",
    textContent: "",
  });

  const [isSending, setIsSending] = useState(false);
  const [lastResult, setLastResult] = useState<EmailTestResult | null>(null);

  const testConnection = async () => {
    try {
      // Test basic Supabase function connectivity
      const { data, error } = await supabase.functions.invoke("send-email", {
        body: { test: true },
      });

      console.log("Connection test result:", { data, error });

      if (error) {
        let errorMsg = "";

        // Extract detailed error information from Supabase function error
        if (error.context?.body) {
          try {
            const errorBody = JSON.parse(error.context.body);
            if (errorBody.error) {
              errorMsg = errorBody.error;

              // Provide specific diagnosis based on error content
              if (
                errorMsg.includes(
                  "BREVO_SMTP_KEY environment variable is required",
                )
              ) {
                errorMsg =
                  "❌ MISSING EMAIL CONFIGURATION\n\nThe Edge Function is missing the BREVO_SMTP_KEY environment variable.\n\nTo fix this:\n1. Go to your Supabase project dashboard\n2. Navigate to Edge Functions → Settings\n3. Add environment variable: BREVO_SMTP_KEY=your_brevo_api_key\n4. Redeploy the send-email function";
              } else if (errorMsg.includes("Invalid JSON")) {
                errorMsg =
                  "❌ REQUEST FORMAT ERROR\n\nThe request format is invalid. This is likely a code issue.";
              } else if (errorMsg.includes("Rate limit")) {
                errorMsg =
                  "❌ RATE LIMIT EXCEEDED\n\nToo many email requests. Please wait a moment before trying again.";
              }
            } else {
              errorMsg = `Edge Function Error: ${JSON.stringify(errorBody)}`;
            }
          } catch (parseError) {
            errorMsg = `Edge Function Error (Status ${error.context?.status || "unknown"}): ${error.message}`;
          }
        } else if (error.message.includes("Failed to send a request")) {
          errorMsg =
            "❌ EDGE FUNCTION NOT ACCESSIBLE\n\nPossible causes:\n1. Edge Function not deployed to Supabase\n2. Network connectivity issues\n3. Supabase project URL incorrect\n4. Function name 'send-email' doesn't exist";
        } else {
          errorMsg = `Connection Error: ${error.message}`;
        }

        throw new Error(errorMsg);
      }

      if (data && !data.success) {
        let errorMsg = data.error || "Unknown configuration error";

        // Provide specific diagnosis for configuration errors
        if (errorMsg.includes("BREVO_SMTP_KEY")) {
          errorMsg =
            "❌ MISSING BREVO SMTP KEY\n\nThe email service configuration is missing the BREVO_SMTP_KEY environment variable in the Edge Function.";
        }

        throw new Error(`Configuration Error: ${errorMsg}`);
      }

      // Log configuration info for debugging
      if (data?.config) {
        console.log("✅ Email service configuration:", data.config);
        toast.success("Email service connection successful!");
      }

      setLastResult({
        success: true,
        error: "",
        timing: 0,
      });

      return true;
    } catch (error: any) {
      console.error("Connection test failed:", error);

      setLastResult({
        success: false,
        error: error.message,
        timing: 0,
      });

      toast.error("Connection test failed - check details below");
      return false;
    }
  };

  const loadDefaultHTML = () => {
    setTestEmail((prev) => ({
      ...prev,
      htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Test Email - ReBooked Solutions</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f3fef7;
      padding: 20px;
      color: #1f4e3d;
      margin: 0;
    }
    .container {
      max-width: 500px;
      margin: auto;
      background-color: #ffffff;
      padding: 30px;
      border-radius: 10px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }
    .btn {
      display: inline-block;
      padding: 12px 20px;
      background-color: #3ab26f;
      color: white;
      text-decoration: none;
      border-radius: 5px;
      margin-top: 20px;
      font-weight: bold;
    }
    .link {
      color: #3ab26f;
    }
    .header {
      background: #3ab26f;
      color: white;
      padding: 20px;
      text-align: center;
      border-radius: 10px 10px 0 0;
      margin: -30px -30px 20px -30px;
    }
    .footer {
      background: #f3fef7;
      color: #1f4e3d;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      line-height: 1.5;
      margin: 30px -30px -30px -30px;
      border-radius: 0 0 10px 10px;
      border-top: 1px solid #e5e7eb;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Test Email</h1>
    </div>

    <h2>Test Email Success!</h2>
    <p>This is a test email from ReBooked Solutions admin panel with proper styling.</p>

    <p>If you're seeing this with beautiful green styling, your email system is working correctly!</p>

    <div class="footer">
      <p><strong>This is an automated message from ReBooked Solutions.</strong><br>
      Please do not reply to this email.</p>
      <p>For assistance, contact: <a href="mailto:support@rebookedsolutions.co.za" class="link">support@rebookedsolutions.co.za</a><br>
      Visit us at: <a href="https://rebookedsolutions.co.za" class="link">https://rebookedsolutions.co.za</a></p>
      <p>T&Cs apply.</p>
      <p><em>"Pre-Loved Pages, New Adventures"</em></p>
    </div>
  </div>
</body>
</html>`,
      textContent: `Test Email Success!

This is a test email from ReBooked Solutions admin panel with proper styling.

If you're receiving this, your email system is working correctly!

ReBooked Solutions
This is an automated message from ReBooked Solutions.
For assistance, contact: support@rebookedsolutions.co.za
Visit us at: https://rebookedsolutions.co.za
T&Cs apply.
"Pre-Loved Pages, New Adventures"`,
    }));
  };

  const sendTestEmail = async () => {
    if (!testEmail.to || !testEmail.subject) {
      toast.error("Please provide email address and subject");
      return;
    }

    setIsSending(true);
    setLastResult(null);
    const startTime = Date.now();

    // First test connectivity
    const isConnected = await testConnection();
    if (!isConnected) {
      setLastResult({
        success: false,
        error:
          "Failed to connect to email service. This could be due to: 1) Edge Function not deployed, 2) Missing environment variables (BREVO_SMTP_KEY), 3) Network issues",
        timing: Date.now() - startTime,
      });
      toast.error(
        "Email service connection failed. Check console for details.",
      );
      setIsSending(false);
      return;
    }

    try {
      let emailPayload: any = {
        to: testEmail.to,
        subject: testEmail.subject,
      };

      // Use direct HTML/text content
      if (testEmail.htmlContent) {
        emailPayload.html = testEmail.htmlContent;
      }
      if (testEmail.textContent) {
        emailPayload.text = testEmail.textContent;
      }

      if (!testEmail.htmlContent && !testEmail.textContent) {
        toast.error("Please provide either HTML content or text content");
        setIsSending(false);
        return;
      }

      console.log("Sending test email with payload:", emailPayload);

      const { data, error } = await supabase.functions.invoke("send-email", {
        body: emailPayload,
      });

      console.log("Supabase function response:", { data, error });

      const timing = Date.now() - startTime;

      // Check for Supabase function errors
      if (error) {
        console.error("Supabase function error:", error);
        throw error;
      }

      // Check if the function returned an error in the response data
      if (data && !data.success && data.error) {
        console.error("Email function returned error:", data);
        throw new Error(data.error);
      }

      setLastResult({
        success: true,
        messageId: data?.messageId,
        timing,
      });

      toast.success(
        `Test email sent successfully! ${data?.messageId ? `Message ID: ${data.messageId}` : ""}`,
      );
    } catch (error: any) {
      console.error("Email send error:", error);
      const timing = Date.now() - startTime;

      // Extract detailed error information
      let detailedError = "Unknown error";

      if (error?.message) {
        detailedError = error.message;
      } else if (error?.error) {
        detailedError = error.error;
      } else if (typeof error === "string") {
        detailedError = error;
      }

      // If it's a Supabase function error, try to extract more details
      if (error?.context?.body) {
        try {
          const errorBody = JSON.parse(error.context.body);
          if (errorBody.error) {
            detailedError = errorBody.error;
            if (errorBody.details) {
              detailedError += ` (Details: ${JSON.stringify(errorBody.details)})`;
            }
          }
        } catch (parseError) {
          console.warn("Could not parse error body:", parseError);
        }
      }

      setLastResult({
        success: false,
        error: detailedError,
        timing,
      });

      toast.error(`Failed to send test email: ${detailedError}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Direct HTML Email Testing
        </CardTitle>
        <CardDescription>
          Test emails using direct HTML content with proper ReBooked Solutions
          styling
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="test-email-to">Test Email Address</Label>
            <Input
              id="test-email-to"
              type="email"
              placeholder="test@example.com"
              value={testEmail.to}
              onChange={(e) =>
                setTestEmail((prev) => ({ ...prev, to: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="test-email-subject">Subject</Label>
            <Input
              id="test-email-subject"
              placeholder="Test Email Subject"
              value={testEmail.subject}
              onChange={(e) =>
                setTestEmail((prev) => ({ ...prev, subject: e.target.value }))
              }
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="html-content">HTML Content</Label>
            <Button onClick={loadDefaultHTML} variant="outline" size="sm">
              Load Default Template
            </Button>
          </div>
          <Textarea
            id="html-content"
            placeholder="<html><body>Your HTML email content here</body></html>"
            value={testEmail.htmlContent}
            onChange={(e) =>
              setTestEmail((prev) => ({
                ...prev,
                htmlContent: e.target.value,
              }))
            }
            rows={12}
            className="font-mono text-sm"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="text-content">Text Content (Optional)</Label>
          <Textarea
            id="text-content"
            placeholder="Your plain text email content here"
            value={testEmail.textContent}
            onChange={(e) =>
              setTestEmail((prev) => ({
                ...prev,
                textContent: e.target.value,
              }))
            }
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <Button
            onClick={() => testConnection()}
            disabled={isSending}
            variant="outline"
            className="w-full"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Test Email Service Connection
          </Button>

          <Button
            onClick={sendTestEmail}
            disabled={isSending || !testEmail.to || !testEmail.subject}
            className="w-full"
          >
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending Test Email...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Test Email
              </>
            )}
          </Button>
        </div>

        {lastResult && (
          <Alert variant={lastResult.success ? "default" : "destructive"}>
            {lastResult.success ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={lastResult.success ? "default" : "destructive"}
                  >
                    {lastResult.success ? "Success" : "Error"}
                  </Badge>
                  {lastResult.timing && (
                    <Badge variant="outline">{lastResult.timing}ms</Badge>
                  )}
                </div>
                {lastResult.success ? (
                  <div>
                    <p>Email sent successfully!</p>
                    {lastResult.messageId && (
                      <p className="text-sm font-mono">
                        Message ID: {lastResult.messageId}
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    <p>
                      <strong>Error:</strong> {lastResult.error}
                    </p>
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">✅ Correct Email Styling:</h4>
          <ul className="text-sm space-y-1 text-blue-800">
            <li>• Light green background (#f3fef7)</li>
            <li>• White container with rounded corners</li>
            <li>• Green header and buttons (#3ab26f)</li>
            <li>• Professional ReBooked Solutions footer</li>
            <li>• "Pre-Loved Pages, New Adventures" signature</li>
            <li>• NO raw CSS visible in email client</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmailTestingComponent;

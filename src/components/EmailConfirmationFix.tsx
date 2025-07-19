import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, AlertTriangle, CheckCircle } from "lucide-react";

interface EmailConfirmationFixProps {
  userEmail?: string;
  onSuccess?: () => void;
}

const EmailConfirmationFix: React.FC<EmailConfirmationFixProps> = ({
  userEmail,
  onSuccess,
}) => {
  const [isFixing, setIsFixing] = useState(false);
  const [fixResult, setFixResult] = useState<string | null>(null);

  const diagnoseAndFix = async () => {
    setIsFixing(true);
    setFixResult(null);

    try {
      console.log("🔧 Starting email confirmation diagnosis...");

      // Step 1: Test email service configuration
      console.log("📧 Testing email service...");
      const { data: configTest, error: configError } =
        await supabase.functions.invoke("send-email", {
          body: { test: true },
        });

      if (configError) {
        console.error("❌ Email service configuration error:", configError);
        setFixResult(`❌ Email Service Error: ${configError.message}`);
        toast.error(
          `Email service configuration issue: ${configError.message}`,
        );
        return;
      }

      if (!configTest?.success) {
        console.error("❌ Email service not working:", configTest);
        setFixResult(
          `❌ Email Service Not Working: ${configTest?.error || "Unknown issue"}`,
        );
        toast.error("Email service is not functioning properly");
        return;
      }

      console.log("✅ Email service configuration is working");

      // Step 2: If user email is provided, send a test confirmation
      if (userEmail) {
        console.log("📨 Sending test confirmation email to:", userEmail);

        const { data: emailTest, error: emailError } =
          await supabase.functions.invoke("send-email", {
            body: {
              to: userEmail,
              from: "noreply@rebookedsolutions.co.za",
              subject: "Account Confirmation - ReBooked Solutions",
              html: generateConfirmationHTML(userEmail),
              text: generateConfirmationText(userEmail),
            },
          });

        if (emailError) {
          console.error("❌ Test confirmation email failed:", emailError);
          setFixResult(`❌ Confirmation Email Failed: ${emailError.message}`);
          toast.error(
            `Failed to send confirmation email: ${emailError.message}`,
          );
          return;
        }

        if (!emailTest?.success) {
          console.error("❌ Confirmation email unsuccessful:", emailTest);
          setFixResult(
            `❌ Confirmation Email Failed: ${emailTest?.error || "Unknown error"}`,
          );
          toast.error("Confirmation email could not be sent");
          return;
        }

        console.log("✅ Test confirmation email sent successfully");
        setFixResult(
          "✅ Email confirmation system is working! Check your inbox.",
        );
        toast.success("Confirmation email sent successfully!");

        if (onSuccess) {
          setTimeout(onSuccess, 2000);
        }
      } else {
        setFixResult("✅ Email service is working correctly");
        toast.success("Email service is functioning properly");
      }
    } catch (error) {
      console.error("❌ Email diagnosis failed:", error);
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      setFixResult(`❌ Diagnosis Failed: ${errorMsg}`);
      toast.error(`Email diagnosis failed: ${errorMsg}`);
    } finally {
      setIsFixing(false);
    }
  };

  const generateConfirmationHTML = (email: string): string => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Account Confirmation - ReBooked Solutions</title>
      <style>
        body { font-family: Arial, sans-serif; background-color: #f3fef7; padding: 20px; color: #1f4e3d; }
        .container { max-width: 500px; margin: auto; background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05); }
        .success-box { background: #d1fae5; border: 1px solid #10b981; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center; }
        .btn { display: inline-block; padding: 12px 20px; background-color: #3ab26f; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🎉 Welcome to ReBooked Solutions!</h1>
        
        <div class="success-box">
          <strong>✅ Your account has been confirmed!</strong>
        </div>

        <p>Hi there!</p>

        <p>Your ReBooked Solutions account (${email}) has been successfully created and confirmed.</p>

        <p>You can now:</p>
        <ul>
          <li>📚 Browse thousands of affordable textbooks</li>
          <li>💰 Sell your textbooks to other students</li>
          <li>🚚 Enjoy convenient doorstep delivery</li>
          <li>🎓 Connect with students at your university</li>
        </ul>

        <div style="text-align: center;">
          <a href="${window.location.origin}/books" class="btn">Start Browsing Books</a>
        </div>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #6b7280; text-align: center;">
          <strong>Thank you for joining ReBooked Solutions!</strong><br>
          For assistance: support@rebookedsolutions.co.za<br>
          <em>"Pre-Loved Pages, New Adventures"</em>
        </p>
      </div>
    </body>
    </html>
  `;

  const generateConfirmationText = (email: string): string => `
    Welcome to ReBooked Solutions!

    Your account (${email}) has been successfully created and confirmed.

    You can now:
    - Browse thousands of affordable textbooks
    - Sell your textbooks to other students  
    - Enjoy convenient doorstep delivery
    - Connect with students at your university

    Visit ${window.location.origin}/books to start browsing!

    Thank you for joining ReBooked Solutions!
    For assistance: support@rebookedsolutions.co.za

    "Pre-Loved Pages, New Adventures"
  `;

  return (
    <div className="space-y-4">
      <Alert className="border-amber-200 bg-amber-50">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription>
          <strong>Email Confirmation Issue Detected</strong>
          <p className="text-sm mt-1">
            There seems to be an issue with the email confirmation system. Click
            the button below to diagnose and attempt to fix the issue.
          </p>
        </AlertDescription>
      </Alert>

      <Button
        onClick={diagnoseAndFix}
        disabled={isFixing}
        className="w-full bg-emerald-600 hover:bg-emerald-700"
      >
        {isFixing ? (
          <>
            <Mail className="mr-2 h-4 w-4 animate-pulse" />
            Diagnosing Email System...
          </>
        ) : (
          <>
            <Mail className="mr-2 h-4 w-4" />
            🔧 Fix Email Confirmation
          </>
        )}
      </Button>

      {fixResult && (
        <Alert
          className={
            fixResult.includes("✅")
              ? "border-green-200 bg-green-50"
              : "border-red-200 bg-red-50"
          }
        >
          {fixResult.includes("✅") ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription>
            <strong>Diagnosis Result:</strong> {fixResult}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default EmailConfirmationFix;

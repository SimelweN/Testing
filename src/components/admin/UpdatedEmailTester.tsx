import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Mail, Send, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import {
  testUpdatedEmailTemplate,
  testUpdatedOrderConfirmationTemplate,
  testManualStyledEmail,
} from "@/utils/emailTemplateTest";

const UpdatedEmailTester = () => {
  const [testEmail, setTestEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  const runTemplateTest = async (testFunction: any, testName: string) => {
    if (!testEmail) {
      toast.error("Please enter an email address");
      return;
    }

    setIsSending(true);
    setLastResult(null);

    try {
      console.log(`Starting ${testName}...`);
      const result = await testFunction(testEmail);

      setLastResult({
        success: result.success,
        test: testName,
        data: result.data,
        error: result.error,
        timing: Date.now(),
      });

      if (result.success) {
        toast.success(`${testName} sent successfully!`);
      } else {
        toast.error(
          `${testName} failed: ${result.error?.message || "Unknown error"}`,
        );
      }
    } catch (error) {
      console.error(`${testName} error:`, error);
      setLastResult({
        success: false,
        test: testName,
        error: error.message,
        timing: Date.now(),
      });
      toast.error(`${testName} failed: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Updated Email Template Tester
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Test the updated ReBooked Solutions email templates with new styling
          and signature
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email">Test Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="test@example.com"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
          />
        </div>

        <div className="space-y-3">
          <h3 className="font-medium">Template Tests</h3>
          <div className="grid gap-2">
            <Button
              onClick={() =>
                runTemplateTest(testUpdatedEmailTemplate, "Welcome Template")
              }
              disabled={isSending}
              variant="outline"
              className="justify-start"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Test Welcome Template (Updated Styling)
            </Button>

            <Button
              onClick={() =>
                runTemplateTest(
                  testUpdatedOrderConfirmationTemplate,
                  "Order Confirmation Template",
                )
              }
              disabled={isSending}
              variant="outline"
              className="justify-start"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Test Order Confirmation Template (Updated Styling)
            </Button>

            <Button
              onClick={() =>
                runTemplateTest(testManualStyledEmail, "Manual Styled Email")
              }
              disabled={isSending}
              variant="outline"
              className="justify-start"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Test Manual Styled Email (Verify Styling Works)
            </Button>
          </div>
        </div>

        {lastResult && (
          <Alert
            className={
              lastResult.success
                ? "border-green-200 bg-green-50"
                : "border-red-200 bg-red-50"
            }
          >
            <div className="flex items-center gap-2">
              {lastResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{lastResult.test}</span>
                  <Badge
                    variant={lastResult.success ? "default" : "destructive"}
                  >
                    {lastResult.success ? "Success" : "Failed"}
                  </Badge>
                </div>
                <AlertDescription>
                  {lastResult.success ? (
                    <div>
                      <p>Email sent successfully!</p>
                      {lastResult.data?.messageId && (
                        <p className="text-xs mt-1">
                          Message ID: {lastResult.data.messageId}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <p>Failed to send email</p>
                      <p className="text-xs mt-1 text-red-600">
                        {lastResult.error?.message ||
                          lastResult.error ||
                          "Unknown error"}
                      </p>
                    </div>
                  )}
                </AlertDescription>
              </div>
            </div>
          </Alert>
        )}

        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">What to Look For:</h4>
          <ul className="text-sm space-y-1 text-blue-800">
            <li>• Light green background (#f3fef7)</li>
            <li>• White container with rounded corners</li>
            <li>• Green header (#3ab26f) and buttons</li>
            <li>• Professional footer with ReBooked Solutions signature</li>
            <li>• "Pre-Loved Pages, New Adventures" tagline</li>
            <li>• Contact: support@rebookedsolutions.co.za</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default UpdatedEmailTester;

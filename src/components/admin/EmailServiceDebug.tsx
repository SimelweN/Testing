import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  testEmailService,
  getEmailServiceStatus,
} from "@/utils/testEmailChangeService";
import { toast } from "sonner";

export const EmailServiceDebug = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const [testResult, setTestResult] = useState<any>(null);

  const checkStatus = async () => {
    setIsLoading(true);
    try {
      const result = await getEmailServiceStatus();
      setStatus(result);
      console.log("Email service status:", result);

      if (result.status === "ready") {
        toast.success("Email service is ready!");
      } else {
        toast.error(`Email service issue: ${result.message}`);
      }
    } catch (error) {
      console.error("Error checking email service:", error);
      toast.error("Failed to check email service status");
    } finally {
      setIsLoading(false);
    }
  };

  const runTest = async () => {
    setIsLoading(true);
    try {
      const result = await testEmailService();
      setTestResult(result);
      console.log("Email service test result:", result);

      if (result.success) {
        toast.success("Email service test passed!");
      } else {
        toast.error(`Email service test failed: ${result.error}`);
      }
    } catch (error) {
      console.error("Error testing email service:", error);
      toast.error("Failed to test email service");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Email Service Debug</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={checkStatus} disabled={isLoading}>
              {isLoading ? "Checking..." : "Check Status"}
            </Button>
            <Button onClick={runTest} disabled={isLoading} variant="outline">
              {isLoading ? "Testing..." : "Run Test"}
            </Button>
          </div>

          {status && (
            <Alert
              variant={status.status === "ready" ? "default" : "destructive"}
            >
              <AlertDescription>
                <strong>Status:</strong> {status.status}
                <br />
                <strong>Message:</strong> {status.message}
                <br />
                {status.config && (
                  <>
                    <strong>Config:</strong>{" "}
                    {JSON.stringify(status.config, null, 2)}
                  </>
                )}
                {status.error && (
                  <>
                    <strong>Error:</strong>{" "}
                    {JSON.stringify(status.error, null, 2)}
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}

          {testResult && (
            <Alert variant={testResult.success ? "default" : "destructive"}>
              <AlertDescription>
                <strong>Test Result:</strong>{" "}
                {testResult.success ? "PASSED" : "FAILED"}
                <br />
                {testResult.message && (
                  <>
                    <strong>Message:</strong> {testResult.message}
                    <br />
                  </>
                )}
                {testResult.error && (
                  <>
                    <strong>Error:</strong> {testResult.error}
                    <br />
                  </>
                )}
                {testResult.details && (
                  <>
                    <strong>Details:</strong>{" "}
                    {JSON.stringify(testResult.details, null, 2)}
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="text-sm text-gray-600">
            <p>
              <strong>Common Issues:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                BREVO_SMTP_KEY not set in Supabase Edge Function environment
              </li>
              <li>send-email function not deployed to Supabase</li>
              <li>Network connectivity issues</li>
              <li>Invalid SMTP configuration</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailServiceDebug;

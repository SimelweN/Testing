import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  TestTube,
  Play,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  RefreshCw,
  Download,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import {
  PaystackSystemTester,
  type PaystackTestResult,
} from "@/utils/paystackSystemTest";

const PaystackSystemTestComponent: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<PaystackTestResult[]>([]);
  const [testReport, setTestReport] = useState<string>("");
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);

  const runSystemTest = async () => {
    setIsRunning(true);
    setResults([]);
    setTestReport("");
    setStartTime(new Date());
    setEndTime(null);

    try {
      console.log("🚀 Starting Paystack system test...");
      toast.info("Running comprehensive Paystack system test...");

      const tester = new PaystackSystemTester();
      const testResults = await tester.runComprehensiveTest();

      setResults(testResults);

      const report = tester.generateReport();
      setTestReport(report);

      setEndTime(new Date());

      const successCount = testResults.filter(
        (r) => r.status === "success",
      ).length;
      const errorCount = testResults.filter((r) => r.status === "error").length;
      const totalTests = testResults.length;

      if (errorCount === 0) {
        toast.success(
          `✅ All ${totalTests} tests passed! Paystack system is operational.`,
        );
      } else {
        toast.error(
          `❌ ${errorCount} tests failed out of ${totalTests}. Check results for details.`,
        );
      }

      console.log("✅ Paystack system test completed");
    } catch (error) {
      console.error("System test error:", error);
            const errorMessage = error?.message || String(error) || 'Unknown error';
      const safeErrorMessage = errorMessage === '[object Object]' ? 'System test execution failed' : errorMessage;
      toast.error(`System test failed to run: ${safeErrorMessage}`);
      setTestReport(
        `❌ TEST EXECUTION FAILED\n\nError: ${error.message}\n\nTime: ${new Date().toLocaleString()}`,
      );
      setEndTime(new Date());
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: PaystackTestResult["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case "info":
        return <Clock className="h-4 w-4 text-blue-600" />;
      default:
        return <TestTube className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: PaystackTestResult["status"]) => {
    const variants = {
      success: "bg-green-100 text-green-800",
      error: "bg-red-100 text-red-800",
      warning: "bg-yellow-100 text-yellow-800",
      info: "bg-blue-100 text-blue-800",
    };

    return (
      <Badge className={variants[status] || "bg-gray-100 text-gray-800"}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const copyReport = () => {
    if (testReport) {
      navigator.clipboard.writeText(testReport);
      toast.success("Test report copied to clipboard");
    }
  };

  const downloadReport = () => {
    if (testReport) {
      const blob = new Blob([testReport], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `paystack-system-test-${new Date().toISOString().split("T")[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Test report downloaded");
    }
  };

  const successCount = results.filter((r) => r.status === "success").length;
  const errorCount = results.filter((r) => r.status === "error").length;
  const warningCount = results.filter((r) => r.status === "warning").length;
  const totalTests = results.length;

  const testDuration =
    startTime && endTime
      ? ((endTime.getTime() - startTime.getTime()) / 1000).toFixed(1)
      : null;

  return (
    <div className="space-y-6">
      {/* Test Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Paystack System Test
          </CardTitle>
          <p className="text-sm text-gray-600">
            Comprehensive test of all Paystack functionality including edge
            functions, API connectivity, and configuration
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button
              onClick={runSystemTest}
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Running Tests...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Run System Test
                </>
              )}
            </Button>

            {results.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {totalTests} tests completed
                  {testDuration && ` in ${testDuration}s`}
                </span>
                {successCount > 0 && (
                  <Badge className="bg-green-100 text-green-800">
                    {successCount} passed
                  </Badge>
                )}
                {errorCount > 0 && (
                  <Badge className="bg-red-100 text-red-800">
                    {errorCount} failed
                  </Badge>
                )}
                {warningCount > 0 && (
                  <Badge className="bg-yellow-100 text-yellow-800">
                    {warningCount} warnings
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Test Results</span>
              <div className="flex gap-2">
                <Button
                  onClick={copyReport}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <Copy className="h-3 w-3" />
                  Copy Report
                </Button>
                <Button
                  onClick={downloadReport}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <Download className="h-3 w-3" />
                  Download
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {results.map((result, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(result.status)}
                    <div>
                      <div className="font-medium">{result.component}</div>
                      <div className="text-sm text-gray-600">
                        {result.message}
                      </div>
                      {result.timing && (
                        <div className="text-xs text-gray-500">
                          {result.timing.toFixed(0)}ms
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(result.status)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Report */}
      {testReport && (
        <Card>
          <CardHeader>
            <CardTitle>Test Report</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={testReport}
              readOnly
              className="font-mono text-xs min-h-[300px]"
            />
          </CardContent>
        </Card>
      )}

      {/* Status Summary */}
      {results.length > 0 && (
        <Alert
          className={
            errorCount > 0
              ? "border-red-200 bg-red-50"
              : successCount === totalTests
                ? "border-green-200 bg-green-50"
                : "border-yellow-200 bg-yellow-50"
          }
        >
          {errorCount > 0 ? (
            <XCircle className="h-4 w-4 text-red-600" />
          ) : successCount === totalTests ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          )}
          <AlertDescription>
            {errorCount > 0 && (
              <div>
                <strong>Critical Issues Found:</strong> {errorCount} test(s)
                failed. Paystack functionality may not work properly. Please
                address the errors before using in production.
              </div>
            )}
            {errorCount === 0 && warningCount > 0 && (
              <div>
                <strong>Warnings Found:</strong> {warningCount} test(s) have
                warnings. Paystack functionality is working but may have
                configuration issues.
              </div>
            )}
            {successCount === totalTests && (
              <div>
                <strong>All Tests Passed:</strong> Paystack system is fully
                operational and ready for use!
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Actions */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {errorCount > 0 && (
                <Alert className="border-red-200 bg-red-50">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription>
                    <div className="font-medium">Errors Found</div>
                    <div className="text-sm">
                      Check edge function logs and environment variables
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {warningCount > 0 && (
                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription>
                    <div className="font-medium">Warnings Found</div>
                    <div className="text-sm">Review configuration settings</div>
                  </AlertDescription>
                </Alert>
              )}

              {successCount === totalTests && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription>
                    <div className="font-medium">System Healthy</div>
                    <div className="text-sm">
                      All Paystack functionality operational
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PaystackSystemTestComponent;

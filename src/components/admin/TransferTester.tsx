import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Play,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowUpRight,
  DollarSign,
  Users,
  AlertCircle,
  Copy,
  Eye,
  Building,
  TestTube,
} from "lucide-react";

interface TestResult {
  success: boolean;
  step: string;
  data?: any;
  error?: string;
  timestamp: string;
}

const TransferTester = () => {
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);

  // Test data
  const [testRecipient, setTestRecipient] = useState({
    name: "John Doe",
    account_number: "1234567890",
    bank_code: "632005", // FNB bank code for testing
    currency: "ZAR",
    type: "nuban",
  });

  const [testTransfer, setTestTransfer] = useState({
    amount: 100.0,
    reason: "Test transfer payment",
    reference: "",
  });

  const addTestResult = (result: TestResult) => {
    setTestResults((prev) => [
      ...prev,
      { ...result, timestamp: new Date().toISOString() },
    ]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const copyTestData = () => {
    const testData = {
      recipient: testRecipient,
      transfer: testTransfer,
    };
    navigator.clipboard.writeText(JSON.stringify(testData, null, 2));
    toast.success("Test data copied to clipboard");
  };

  const runFullTransferTest = async () => {
    setTesting(true);
    clearResults();

    try {
      // Step 1: Test bank list API
      addTestResult({
        success: true,
        step: "1. Starting Transfer API Test",
        data: { test_recipient: testRecipient, test_transfer: testTransfer },
      });

      // Step 2: Get available banks
      addTestResult({
        success: true,
        step: "2. Fetching Available Banks",
        data: { message: "Calling banks API..." },
      });

      const banksResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paystack-transfer-management?action=banks&country=south-africa&currency=ZAR`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
          },
        },
      );

      // Safely parse response to avoid body stream consumption issues
      const banksResponseClone = banksResponse.clone();
      let banksResult;
      try {
        banksResult = await banksResponse.json();
      } catch (parseError) {
        const textContent = await banksResponseClone.text();
        banksResult = {
          success: false,
          error: `Failed to parse response: ${parseError.message}`,
          details: { raw_response: textContent, status: banksResponse.status, statusText: banksResponse.statusText }
        };
      }

      if (banksResult.success) {
        addTestResult({
          success: true,
          step: "3. Banks Retrieved Successfully",
          data: {
            banks_count: Array.isArray(banksResult.data)
              ? banksResult.data.length
              : 0,
            sample_banks: Array.isArray(banksResult.data)
              ? banksResult.data.slice(0, 3)
              : [],
            message: "Available banks loaded successfully",
          },
        });

        // Step 3: Verify account
        addTestResult({
          success: true,
          step: "4. Verifying Bank Account",
          data: {
            account_number: testRecipient.account_number,
            bank_code: testRecipient.bank_code,
          },
        });

        const verifyResponse = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paystack-transfer-management?action=verify-account`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              account_number: testRecipient.account_number,
              bank_code: testRecipient.bank_code,
            }),
          },
        );

        // Safely parse response to avoid body stream consumption issues
        const verifyResponseClone = verifyResponse.clone();
        let verifyResult;
        try {
          verifyResult = await verifyResponse.json();
        } catch (parseError) {
          const textContent = await verifyResponseClone.text();
          verifyResult = {
            success: false,
            error: `Failed to parse response: ${parseError.message}`,
            details: { raw_response: textContent, status: verifyResponse.status, statusText: verifyResponse.statusText }
          };
        }

        if (verifyResult.success) {
          addTestResult({
            success: true,
            step: "5. Account Verification Successful",
            data: {
              account_name: verifyResult.data.account_name,
              account_number: verifyResult.data.account_number,
              message: "Bank account verified successfully",
            },
          });

          // Update recipient name with verified name
          const verifiedName =
            verifyResult.data.account_name || testRecipient.name;

          // Step 4: Create recipient
          addTestResult({
            success: true,
            step: "6. Creating Transfer Recipient",
            data: { verified_name: verifiedName },
          });

          const recipientResponse = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paystack-transfer-management?action=create-recipient`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                ...testRecipient,
                name: verifiedName,
              }),
            },
          );

          // Safely parse response to avoid body stream consumption issues
          const recipientResponseClone = recipientResponse.clone();
          let recipientResult;
          try {
            recipientResult = await recipientResponse.json();
          } catch (parseError) {
            const textContent = await recipientResponseClone.text();
            recipientResult = {
              success: false,
              error: `Failed to parse response: ${parseError.message}`,
              details: { raw_response: textContent, status: recipientResponse.status, statusText: recipientResponse.statusText }
            };
          }

          if (recipientResult.success) {
            addTestResult({
              success: true,
              step: "7. Recipient Created Successfully",
              data: {
                recipient_code: recipientResult.recipient_code,
                name: recipientResult.data.name,
                message: "Transfer recipient created with Paystack",
              },
            });

            // Step 5: Initiate transfer
            addTestResult({
              success: true,
              step: "8. Initiating Transfer",
              data: { recipient_code: recipientResult.recipient_code },
            });

            const transferReference = `TEST_TXN_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

            const transferResponse = await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paystack-transfer-management?action=initiate-transfer`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  recipient: recipientResult.recipient_code,
                  amount: Math.round(testTransfer.amount * 100), // Convert to kobo
                  reason: testTransfer.reason,
                  reference: transferReference,
                  source: "balance",
                }),
              },
            );

            // Safely parse response to avoid body stream consumption issues
            const transferResponseClone = transferResponse.clone();
            let transferResult;
            try {
              transferResult = await transferResponse.json();
            } catch (parseError) {
              const textContent = await transferResponseClone.text();
              transferResult = {
                success: false,
                error: `Failed to parse response: ${parseError.message}`,
                details: { raw_response: textContent, status: transferResponse.status, statusText: transferResponse.statusText }
              };
            }

            if (transferResult.success) {
              addTestResult({
                success: true,
                step: "9. Transfer Initiated Successfully",
                data: {
                  transfer_code: transferResult.transfer_code,
                  reference: transferReference,
                  amount: testTransfer.amount,
                  status: transferResult.data.status,
                  message: "Transfer successfully initiated with Paystack",
                },
              });

              // Step 6: Get transfer status
              addTestResult({
                success: true,
                step: "10. Transfer Test Completed",
                data: {
                  summary: {
                    recipient_created: recipientResult.recipient_code,
                    transfer_initiated: transferResult.transfer_code,
                    amount: testTransfer.amount,
                    currency: testRecipient.currency,
                    status: "All transfer APIs working correctly",
                  },
                  message: "Complete transfer flow tested successfully",
                },
              });
            } else {
              addTestResult({
                success: false,
                step: "9. Transfer Initiation Failed",
                error: transferResult.error || "Unknown transfer error",
                data: transferResult.details || null,
              });
            }
          } else {
            addTestResult({
              success: false,
              step: "7. Recipient Creation Failed",
              error: recipientResult.error || "Unknown recipient error",
              data: recipientResult.details || null,
            });
          }
        } else {
          addTestResult({
            success: false,
            step: "5. Account Verification Failed",
            error: verifyResult.error || "Account verification failed",
            data: verifyResult.details || null,
          });
        }
      } else {
        addTestResult({
          success: false,
          step: "3. Banks Fetch Failed",
          error: banksResult.error || "Unknown banks error",
          data: banksResult.details || null,
        });
      }
    } catch (error) {
      addTestResult({
        success: false,
        step: "Test Error",
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        data: { error_type: "Network or execution error" },
      });
    } finally {
      setTesting(false);
    }
  };

  const testBankVerification = async () => {
    setTesting(true);
    clearResults();

    try {
      addTestResult({
        success: true,
        step: "1. Testing Bank Account Verification",
        data: {
          account_number: testRecipient.account_number,
          bank_code: testRecipient.bank_code,
        },
      });

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paystack-transfer-management?action=verify-account`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            account_number: testRecipient.account_number,
            bank_code: testRecipient.bank_code,
          }),
        },
      );

      // Safely parse response to avoid body stream consumption issues
      const responseClone = response.clone();
      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        const textContent = await responseClone.text();
        result = {
          success: false,
          error: `Failed to parse response: ${parseError.message}`,
          details: { raw_response: textContent, status: response.status, statusText: response.statusText }
        };
      }

      if (result.success) {
        addTestResult({
          success: true,
          step: "2. Account Verification Successful",
          data: {
            account_name: result.data.account_name,
            account_number: result.data.account_number,
            bank_name: result.data.bank_name,
            message: "Account verification API working correctly",
          },
        });
      } else {
        addTestResult({
          success: false,
          step: "2. Account Verification Failed",
          error: result.error || "Verification failed",
          data: result.details || null,
        });
      }
    } catch (error) {
      addTestResult({
        success: false,
        step: "Verification Test Error",
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        data: { error_type: "Network or API error" },
      });
    } finally {
      setTesting(false);
    }
  };

  const testRecipientsAPI = async () => {
    setTesting(true);
    clearResults();

    try {
      addTestResult({
        success: true,
        step: "1. Testing Recipients API",
        data: { message: "Fetching existing recipients..." },
      });

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paystack-transfer-management?action=recipients`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
          },
        },
      );

      // Safely parse response to avoid body stream consumption issues
      const responseClone = response.clone();
      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        const textContent = await responseClone.text();
        result = {
          success: false,
          error: `Failed to parse response: ${parseError.message}`,
          details: { raw_response: textContent, status: response.status, statusText: response.statusText }
        };
      }

      if (result.success) {
        addTestResult({
          success: true,
          step: "2. Recipients API Working",
          data: {
            recipients_count: Array.isArray(result.data)
              ? result.data.length
              : 0,
            recipients_sample: Array.isArray(result.data)
              ? result.data.slice(0, 2)
              : [],
            message: "Recipients API functioning correctly",
          },
        });
      } else {
        addTestResult({
          success: false,
          step: "2. Recipients API Failed",
          error: result.error || "Recipients fetch failed",
          data: result.details || null,
        });
      }
    } catch (error) {
      addTestResult({
        success: false,
        step: "Recipients API Test Error",
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        data: { error_type: "Network or API error" },
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Transfer API Testing
          </h2>
          <p className="text-muted-foreground">
            Test the Paystack Transfer API implementation
          </p>
        </div>
        <Button onClick={clearResults} variant="outline" disabled={testing}>
          Clear Results
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              Test Configuration
            </CardTitle>
            <CardDescription>
              Configure test data for transfer API testing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="test-name">Recipient Name</Label>
              <Input
                id="test-name"
                value={testRecipient.name}
                onChange={(e) =>
                  setTestRecipient((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
              />
            </div>

            <div>
              <Label htmlFor="test-account">Account Number</Label>
              <Input
                id="test-account"
                value={testRecipient.account_number}
                onChange={(e) =>
                  setTestRecipient((prev) => ({
                    ...prev,
                    account_number: e.target.value,
                  }))
                }
              />
            </div>

            <div>
              <Label htmlFor="test-bank">Bank Code</Label>
              <Input
                id="test-bank"
                value={testRecipient.bank_code}
                onChange={(e) =>
                  setTestRecipient((prev) => ({
                    ...prev,
                    bank_code: e.target.value,
                  }))
                }
                placeholder="632005 (FNB)"
              />
            </div>

            <div>
              <Label htmlFor="test-amount">Transfer Amount (ZAR)</Label>
              <Input
                id="test-amount"
                type="number"
                step="0.01"
                value={testTransfer.amount}
                onChange={(e) =>
                  setTestTransfer((prev) => ({
                    ...prev,
                    amount: Number(e.target.value),
                  }))
                }
              />
            </div>

            <div>
              <Label htmlFor="test-reason">Transfer Reason</Label>
              <Textarea
                id="test-reason"
                value={testTransfer.reason}
                onChange={(e) =>
                  setTestTransfer((prev) => ({
                    ...prev,
                    reason: e.target.value,
                  }))
                }
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={copyTestData}
                variant="outline"
                className="flex-1"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Data
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Test Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Test Actions
            </CardTitle>
            <CardDescription>
              Run tests to validate transfer functionality
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={runFullTransferTest}
              disabled={testing}
              className="w-full"
              size="lg"
            >
              {testing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Running Test...
                </>
              ) : (
                <>
                  <ArrowUpRight className="h-4 w-4 mr-2" />
                  Test Full Transfer Flow
                </>
              )}
            </Button>

            <Button
              onClick={testBankVerification}
              disabled={testing}
              className="w-full"
              variant="outline"
            >
              {testing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Building className="h-4 w-4 mr-2" />
                  Test Account Verification
                </>
              )}
            </Button>

            <Button
              onClick={testRecipientsAPI}
              disabled={testing}
              className="w-full"
              variant="outline"
            >
              {testing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Users className="h-4 w-4 mr-2" />
                  Test Recipients API
                </>
              )}
            </Button>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Building className="h-4 w-4" />
                <span>Tests bank account verification</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="h-4 w-4" />
                <span>Tests recipient creation and management</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <ArrowUpRight className="h-4 w-4" />
                <span>Tests transfer initiation and tracking</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <DollarSign className="h-4 w-4" />
                <span>Validates complete transfer workflow</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Test Results ({testResults.length})
            </CardTitle>
            <CardDescription>Results from transfer API testing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    result.success
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {result.success ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className="font-medium">{result.step}</span>
                    <Badge variant={result.success ? "default" : "destructive"}>
                      {result.success ? "Success" : "Failed"}
                    </Badge>
                  </div>

                  {result.error && (
                    <div className="mb-2">
                      <div className="flex items-center gap-2 text-red-700">
                        <AlertCircle className="h-4 w-4" />
                        <span className="font-medium">Error:</span>
                      </div>
                      <p className="text-red-600 text-sm mt-1">
                        {result.error}
                      </p>
                    </div>
                  )}

                  {result.data && (
                    <div className="mt-2">
                      <details className="text-sm">
                        <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                          View Details
                        </summary>
                        <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </details>
                    </div>
                  )}

                  <div className="text-xs text-gray-500 mt-2">
                    {new Date(result.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TransferTester;

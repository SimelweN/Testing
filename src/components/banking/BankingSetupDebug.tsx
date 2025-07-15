import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  CheckCircle,
  Database,
  TestTube,
  Code,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  createBankingSubaccountsTable,
  testBankingSetup,
  getBankingTableCreateSQL,
} from "@/utils/createBankingTable";
import { PaystackSubaccountService } from "@/services/paystackSubaccountService";

const BankingSetupDebug: React.FC = () => {
  const { user } = useAuth();
  const [testResults, setTestResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSQL, setShowSQL] = useState(false);

  const runDiagnostics = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Test 1: Table existence
      const tableTest = await createBankingSubaccountsTable();

      // Test 2: Banking setup functionality
      const setupTest = await testBankingSetup();

      // Test 3: Service layer test
      const serviceTest =
        await PaystackSubaccountService.getUserSubaccountStatus(user.id);

      const results = {
        tableTest,
        setupTest,
        serviceTest,
        timestamp: new Date().toISOString(),
      };

      setTestResults(results);
      console.log("Banking diagnostics completed:", results);
    } catch (error) {
      console.error("Diagnostics failed:", error);
      setTestResults({
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
    }
    setIsLoading(false);
  };

  const createMockSubaccount = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const mockDetails = {
        business_name: "Test Business " + Date.now(),
        email: user.email || "test@example.com",
        bank_name: "First National Bank (FNB)",
        bank_code: "250655",
        account_number: "1234567890",
      };

      const result = await PaystackSubaccountService.createOrUpdateSubaccount(
        mockDetails,
        false,
      );

      console.log("Mock subaccount creation result:", result);

      // Re-run diagnostics to show updated state
      await runDiagnostics();
    } catch (error) {
      console.error("Mock subaccount creation failed:", error);
    }
    setIsLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="border-blue-200">
        <CardHeader className="bg-blue-50">
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <TestTube className="h-5 w-5" />
            Banking Setup Diagnostics
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex gap-3">
              <Button
                onClick={runDiagnostics}
                disabled={isLoading || !user}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <TestTube className="h-4 w-4 mr-2" />
                )}
                Run Diagnostics
              </Button>

              <Button
                onClick={createMockSubaccount}
                disabled={isLoading || !user}
                variant="outline"
                className="border-green-300 text-green-700 hover:bg-green-50"
              >
                Create Test Subaccount
              </Button>

              <Button onClick={() => setShowSQL(!showSQL)} variant="outline">
                <Code className="h-4 w-4 mr-2" />
                {showSQL ? "Hide" : "Show"} SQL
              </Button>
            </div>

            {!user && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  Please sign in to run banking diagnostics.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* SQL Code */}
      {showSQL && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Required SQL Migration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Copy this SQL and run it in your Supabase SQL editor to create
                the required table.
              </AlertDescription>
            </Alert>
            <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
              <code>{getBankingTableCreateSQL()}</code>
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Test Results */}
      {testResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Diagnostic Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {testResults.error ? (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  Error: {testResults.error}
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                {/* Table Test */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">Database Table</span>
                  <Badge
                    variant={
                      testResults.tableTest?.success ? "default" : "destructive"
                    }
                  >
                    {testResults.tableTest?.success ? "EXISTS" : "MISSING"}
                  </Badge>
                </div>

                {/* Setup Test */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">Banking Setup</span>
                  <Badge
                    variant={
                      testResults.setupTest?.success ? "default" : "destructive"
                    }
                  >
                    {testResults.setupTest?.success ? "WORKING" : "ERROR"}
                  </Badge>
                </div>

                {/* Service Test */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">Subaccount Service</span>
                  <Badge
                    variant={
                      testResults.serviceTest?.hasSubaccount
                        ? "default"
                        : "secondary"
                    }
                  >
                    {testResults.serviceTest?.hasSubaccount
                      ? "HAS SUBACCOUNT"
                      : "NO SUBACCOUNT"}
                  </Badge>
                </div>

                {/* Detailed Results */}
                <details className="mt-4">
                  <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900">
                    View Detailed Results
                  </summary>
                  <pre className="mt-2 bg-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(testResults, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BankingSetupDebug;

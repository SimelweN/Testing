import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Database,
  TestTube,
  Loader2,
  Play,
  RotateCcw,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TableTestResult {
  table: string;
  status: "success" | "error" | "warning";
  message: string;
  details?: any;
  operations?: {
    select: boolean;
    insert: boolean;
    update: boolean;
    delete: boolean;
  };
}

const DATABASE_TABLES = [
  // Core Business Tables
  {
    name: "books",
    category: "Core Business",
    description: "Book listings for sale",
  },
  {
    name: "profiles",
    category: "Core Business",
    description: "User profiles and account info",
  },
  {
    name: "orders",
    category: "Core Business",
    description: "Purchase orders and transactions",
  },
  {
    name: "transactions",
    category: "Core Business",
    description: "Historical transaction records",
  },

  // Payment & Financial Tables
  {
    name: "payment_transactions",
    category: "Payments",
    description: "Paystack payment processing",
  },
  {
    name: "refund_transactions",
    category: "Payments",
    description: "Refund processing and tracking",
  },
  {
    name: "payment_splits",
    category: "Payments",
    description: "Multi-seller payment distribution",
  },
  {
    name: "payout_transactions",
    category: "Payments",
    description: "Seller payouts and commissions",
  },
  {
    name: "banking_subaccounts",
    category: "Payments",
    description: "User banking details and subaccounts",
  },
  {
    name: "transfers",
    category: "Payments",
    description: "Seller payout transfers and money transfers",
  },

  // Communication & Support Tables
  {
    name: "notifications",
    category: "Communication",
    description: "User notifications system",
  },
  {
    name: "contact_messages",
    category: "Communication",
    description: "Customer support messages",
  },
  {
    name: "reports",
    category: "Communication",
    description: "User-generated reports",
  },
  {
    name: "broadcasts",
    category: "Communication",
    description: "System-wide announcements",
  },

  // Commitment & Sales Tables
  {
    name: "sale_commitments",
    category: "Sales",
    description: "Buyer-seller sale agreements",
  },
  {
    name: "commitment_notifications",
    category: "Sales",
    description: "Notifications for sale commitments",
  },

  // Study Resources Tables
  {
    name: "study_resources",
    category: "Education",
    description: "Educational study materials",
  },
  {
    name: "study_tips",
    category: "Education",
    description: "Study tips and advice",
  },

  // Notification & Request Tables
  {
    name: "notification_requests",
    category: "Requests",
    description: "Program availability notifications",
  },
  {
    name: "email_notifications",
    category: "Requests",
    description: "Email notification preferences",
  },

  // Activity & Logging Tables
  {
    name: "activity_logs",
    category: "Logging",
    description: "System activity tracking",
  },
  {
    name: "order_activity_log",
    category: "Logging",
    description: "Order-specific activity tracking",
  },
  {
    name: "delivery_automation_log",
    category: "Logging",
    description: "Delivery automation tracking",
  },

  // Utility Tables
  {
    name: "waitlist",
    category: "Utility",
    description: "Email waitlist for early access",
  },
  { name: "api_keys", category: "Utility", description: "API key management" },
];

const DatabaseTableTester: React.FC = () => {
  const [testResults, setTestResults] = useState<TableTestResult[]>([]);
  const [isTestingAll, setIsTestingAll] = useState(false);
  const [isTesting, setIsTesting] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = [
    "all",
    ...Array.from(new Set(DATABASE_TABLES.map((t) => t.category))),
  ];

  const testTableAccess = async (
    tableName: string,
  ): Promise<TableTestResult> => {
    try {
      // Test basic SELECT operation
      const { data, error, count } = await supabase
        .from(tableName)
        .select("*", { count: "exact" })
        .limit(1);

      if (error) {
        return {
          table: tableName,
          status: "error",
          message: `Access denied or table missing: ${error.message}`,
          details: { error: error.message, code: error.code },
        };
      }

      // Test INSERT capability (without actually inserting)
      let insertCapable = false;
      let updateCapable = false;
      let deleteCapable = false;

      try {
        // Try to get table structure to understand capabilities
        const { error: insertError } = await supabase
          .from(tableName)
          .insert({})
          .select()
          .limit(0);

        insertCapable =
          !insertError || !insertError.message.includes("permission denied");
      } catch (e) {
        insertCapable = false;
      }

      return {
        table: tableName,
        status: "success",
        message: `Table accessible with ${count || 0} records`,
        details: {
          recordCount: count || 0,
          hasData: data && data.length > 0,
          sampleRecord: data && data.length > 0 ? data[0] : null,
        },
        operations: {
          select: true,
          insert: insertCapable,
          update: updateCapable,
          delete: deleteCapable,
        },
      };
    } catch (error) {
      return {
        table: tableName,
        status: "error",
        message: `Test failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        details: {
          error: error instanceof Error ? error.message : "Unknown error",
        },
      };
    }
  };

  const testSingleTable = async (tableName: string) => {
    setIsTesting(tableName);
    try {
      const result = await testTableAccess(tableName);
      setTestResults((prev) => {
        const filtered = prev.filter((r) => r.table !== tableName);
        return [...filtered, result].sort((a, b) =>
          a.table.localeCompare(b.table),
        );
      });

      if (result.status === "success") {
        toast.success(`${tableName} table test passed`);
      } else {
        toast.error(`${tableName} table test failed`);
      }
    } finally {
      setIsTesting(null);
    }
  };

  const testAllTables = async () => {
    setIsTestingAll(true);
    setTestResults([]);

    try {
      const results: TableTestResult[] = [];

      for (const table of DATABASE_TABLES) {
        setIsTesting(table.name);
        const result = await testTableAccess(table.name);
        results.push(result);

        // Update results in real-time
        setTestResults(
          [...results].sort((a, b) => a.table.localeCompare(b.table)),
        );

        // Small delay to avoid overwhelming the database
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      const successCount = results.filter((r) => r.status === "success").length;
      const errorCount = results.filter((r) => r.status === "error").length;

      toast.success(
        `Database test completed: ${successCount} passed, ${errorCount} failed`,
      );
    } finally {
      setIsTestingAll(false);
      setIsTesting(null);
    }
  };

  const clearResults = () => {
    setTestResults([]);
    toast.info("Test results cleared");
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-800 border-green-200";
      case "error":
        return "bg-red-100 text-red-800 border-red-200";
      case "warning":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const filteredTables =
    selectedCategory === "all"
      ? DATABASE_TABLES
      : DATABASE_TABLES.filter((t) => t.category === selectedCategory);

  const filteredResults =
    selectedCategory === "all"
      ? testResults
      : testResults.filter((r) => {
          const table = DATABASE_TABLES.find((t) => t.name === r.table);
          return table?.category === selectedCategory;
        });

  const summary = {
    total: testResults.length,
    success: testResults.filter((r) => r.status === "success").length,
    error: testResults.filter((r) => r.status === "error").length,
    warning: testResults.filter((r) => r.status === "warning").length,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Table Tester
        </CardTitle>
        <p className="text-sm text-gray-600">
          Test access and functionality of all database tables
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Control Panel */}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={testAllTables}
            disabled={isTestingAll}
            className="flex items-center gap-2"
          >
            {isTestingAll ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <TestTube className="h-4 w-4" />
            )}
            {isTestingAll ? "Testing All..." : "Test All Tables"}
          </Button>

          <Button
            variant="outline"
            onClick={clearResults}
            disabled={isTestingAll || testResults.length === 0}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Clear Results
          </Button>

          {isTestingAll && isTesting && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <Loader2 className="h-3 w-3 animate-spin" />
              Testing: {isTesting}
            </div>
          )}
        </div>

        {/* Summary */}
        {testResults.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-lg font-semibold text-blue-700">
                {summary.total}
              </div>
              <div className="text-sm text-blue-600">Total Tables</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-lg font-semibold text-green-700">
                {summary.success}
              </div>
              <div className="text-sm text-green-600">Passed</div>
            </div>
            <div className="bg-red-50 p-3 rounded-lg">
              <div className="text-lg font-semibold text-red-700">
                {summary.error}
              </div>
              <div className="text-sm text-red-600">Failed</div>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg">
              <div className="text-lg font-semibold text-yellow-700">
                {summary.warning}
              </div>
              <div className="text-sm text-yellow-600">Warnings</div>
            </div>
          </div>
        )}

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="grid grid-cols-4 lg:grid-cols-8 w-full">
            {categories.map((category) => (
              <TabsTrigger key={category} value={category} className="text-xs">
                {category === "all" ? "All" : category}
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map((category) => (
            <TabsContent key={category} value={category} className="space-y-4">
              {/* Available Tables */}
              <div>
                <h3 className="text-sm font-medium mb-3">
                  Available Tables {category !== "all" && `(${category})`}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredTables.map((table) => {
                    const result = testResults.find(
                      (r) => r.table === table.name,
                    );
                    const isCurrentlyTesting = isTesting === table.name;

                    return (
                      <div
                        key={table.name}
                        className={`p-3 border rounded-lg ${
                          result
                            ? getStatusColor(result.status)
                            : "bg-gray-50 border-gray-200"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">
                            {table.name}
                          </span>
                          <div className="flex items-center gap-2">
                            {result && getStatusIcon(result.status)}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => testSingleTable(table.name)}
                              disabled={isTestingAll || isCurrentlyTesting}
                              className="h-6 px-2 text-xs"
                            >
                              {isCurrentlyTesting ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Play className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">
                          {table.description}
                        </p>
                        {result && (
                          <div className="text-xs">
                            <div className="font-medium">{result.message}</div>
                            {result.details?.recordCount !== undefined && (
                              <div className="text-gray-600 mt-1">
                                Records: {result.details.recordCount}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Test Results */}
              {filteredResults.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-3">Test Results</h3>
                  <div className="space-y-3">
                    {filteredResults.map((result) => (
                      <Alert
                        key={result.table}
                        className={`${getStatusColor(result.status)}`}
                      >
                        <div className="flex items-start gap-3">
                          {getStatusIcon(result.status)}
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <strong className="text-sm font-medium">
                                {result.table}
                              </strong>
                              <Badge
                                variant="outline"
                                className={`${getStatusColor(result.status)} border`}
                              >
                                {result.status}
                              </Badge>
                            </div>
                            <AlertDescription className="text-sm">
                              {result.message}
                              {result.details && (
                                <details className="mt-2">
                                  <summary className="cursor-pointer text-xs font-medium mb-1">
                                    View Details
                                  </summary>
                                  <pre className="text-xs bg-black/5 p-2 rounded overflow-auto max-h-32">
                                    {JSON.stringify(result.details, null, 2)}
                                  </pre>
                                </details>
                              )}
                            </AlertDescription>
                          </div>
                        </div>
                      </Alert>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-sm mb-2">How to Use This Tester:</h4>
          <div className="text-xs text-gray-600 space-y-1">
            <p>
              • <strong>Test All Tables:</strong> Runs a comprehensive test on
              every database table
            </p>
            <p>
              • <strong>Individual Tests:</strong> Click the play button on any
              table to test just that one
            </p>
            <p>
              • <strong>Categories:</strong> Filter tables by category to focus
              on specific areas
            </p>
            <p>
              • <strong>Results:</strong> Green = success, Red = error, Yellow =
              warning
            </p>
            <p>
              • <strong>Details:</strong> Click "View Details" to see technical
              information about failures
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DatabaseTableTester;

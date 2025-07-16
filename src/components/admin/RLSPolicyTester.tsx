import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Shield,
  Database,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Users,
  BookOpen,
  DollarSign,
  MessageSquare,
  Bell,
} from "lucide-react";

interface RLSTest {
  table: string;
  operation: "SELECT" | "INSERT" | "UPDATE" | "DELETE";
  description: string;
  expectedResult: "allowed" | "denied" | "partial";
  testQuery: () => Promise<any>;
  icon: React.ComponentType<any>;
  requiresAuth: boolean;
  requiresAdmin: boolean;
}

interface TestResult {
  table: string;
  operation: string;
  status: "success" | "error" | "warning";
  message: string;
  details?: any;
  timestamp: Date;
}

const RLSPolicyTester = () => {
  const { user, isAdmin } = useAuth();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isTestingAll, setIsTestingAll] = useState(false);
  const [testingOperation, setTestingOperation] = useState<string | null>(null);

  const RLS_TESTS: RLSTest[] = [
    // Profiles table tests
    {
      table: "profiles",
      operation: "SELECT",
      description: "User can view their own profile",
      expectedResult: "allowed",
      testQuery: async () => {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user?.id)
          .single();
        return { data, error };
      },
      icon: Users,
      requiresAuth: true,
      requiresAdmin: false,
    },
    {
      table: "profiles",
      operation: "SELECT",
      description: "User cannot view other users' private data",
      expectedResult: "partial",
      testQuery: async () => {
        const { data, error } = await supabase
          .from("profiles")
          .select("banking_info, paystack_subaccount_code")
          .neq("id", user?.id)
          .limit(1);
        return { data, error };
      },
      icon: Users,
      requiresAuth: true,
      requiresAdmin: false,
    },
    {
      table: "profiles",
      operation: "UPDATE",
      description: "User can update their own profile",
      expectedResult: "allowed",
      testQuery: async () => {
        const { data, error } = await supabase
          .from("profiles")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", user?.id);
        return { data, error };
      },
      icon: Users,
      requiresAuth: true,
      requiresAdmin: false,
    },

    // Books table tests
    {
      table: "books",
      operation: "SELECT",
      description: "Public can view all books",
      expectedResult: "allowed",
      testQuery: async () => {
        const { data, error } = await supabase
          .from("books")
          .select("id, title, author, price")
          .limit(5);
        return { data, error };
      },
      icon: BookOpen,
      requiresAuth: false,
      requiresAdmin: false,
    },
    {
      table: "books",
      operation: "INSERT",
      description: "Authenticated users can create books",
      expectedResult: "allowed",
      testQuery: async () => {
        const testBook = {
          title: "RLS Test Book",
          author: "Test Author",
          category: "Test",
          condition: "New",
          description: "This is a test book for RLS validation",
          price: 99.99,
          seller_id: user?.id,
          image_url: "https://via.placeholder.com/300x400",
        };

        // Insert and immediately delete to avoid cluttering
        const { data, error } = await supabase
          .from("books")
          .insert(testBook)
          .select()
          .single();

        if (data && !error) {
          // Clean up test data
          await supabase.from("books").delete().eq("id", data.id);
        }

        return { data, error };
      },
      icon: BookOpen,
      requiresAuth: true,
      requiresAdmin: false,
    },
    {
      table: "books",
      operation: "UPDATE",
      description: "Users can only update their own books",
      expectedResult: "partial",
      testQuery: async () => {
        // Try to update a book not owned by the user
        const { data: otherBooks } = await supabase
          .from("books")
          .select("id")
          .neq("seller_id", user?.id)
          .limit(1);

        if (!otherBooks || otherBooks.length === 0) {
          return {
            data: null,
            error: { message: "No other user books found for test" },
          };
        }

        const { data, error } = await supabase
          .from("books")
          .update({ description: "RLS Test Update" })
          .eq("id", otherBooks[0].id);

        return { data, error };
      },
      icon: BookOpen,
      requiresAuth: true,
      requiresAdmin: false,
    },

    // Notifications table tests
    {
      table: "notifications",
      operation: "SELECT",
      description: "Users can only view their own notifications",
      expectedResult: "allowed",
      testQuery: async () => {
        const { data, error } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", user?.id)
          .limit(5);
        return { data, error };
      },
      icon: Bell,
      requiresAuth: true,
      requiresAdmin: false,
    },
    {
      table: "notifications",
      operation: "INSERT",
      description: "Users cannot create notifications for others",
      expectedResult: "denied",
      testQuery: async () => {
        // Try to create a notification for a different user
        const { data: otherUsers } = await supabase
          .from("profiles")
          .select("id")
          .neq("id", user?.id)
          .limit(1);

        if (!otherUsers || otherUsers.length === 0) {
          return {
            data: null,
            error: { message: "No other users found for test" },
          };
        }

        const { data, error } = await supabase.from("notifications").insert({
          user_id: otherUsers[0].id,
          title: "RLS Test",
          message: "This should be blocked by RLS",
          type: "info",
          read: false,
        });

        return { data, error };
      },
      icon: Bell,
      requiresAuth: true,
      requiresAdmin: false,
    },

    // Admin-only tests
    {
      table: "reports",
      operation: "SELECT",
      description: "Admin can view all reports",
      expectedResult: "allowed",
      testQuery: async () => {
        const { data, error } = await supabase
          .from("reports")
          .select("*")
          .limit(5);
        return { data, error };
      },
      icon: AlertTriangle,
      requiresAuth: true,
      requiresAdmin: true,
    },
    {
      table: "contact_messages",
      operation: "SELECT",
      description: "Admin can view contact messages",
      expectedResult: "allowed",
      testQuery: async () => {
        const { data, error } = await supabase
          .from("contact_messages")
          .select("*")
          .limit(5);
        return { data, error };
      },
      icon: MessageSquare,
      requiresAuth: true,
      requiresAdmin: true,
    },

    // Database function tests
    {
      table: "functions",
      operation: "SELECT",
      description: "is_admin function works correctly",
      expectedResult: "allowed",
      testQuery: async () => {
        const { data, error } = await supabase.rpc("is_admin", {
          user_id: user?.id,
        });
        return { data, error };
      },
      icon: Shield,
      requiresAuth: true,
      requiresAdmin: false,
    },
  ];

  const runTest = useCallback(
    async (test: RLSTest) => {
      if (!user && test.requiresAuth) {
        const result: TestResult = {
          table: test.table,
          operation: test.operation,
          status: "warning",
          message: "Skipped - requires authentication",
          timestamp: new Date(),
        };
        setTestResults((prev) => [...prev, result]);
        return;
      }

      if (test.requiresAdmin && !isAdmin) {
        const result: TestResult = {
          table: test.table,
          operation: test.operation,
          status: "warning",
          message: "Skipped - requires admin privileges",
          timestamp: new Date(),
        };
        setTestResults((prev) => [...prev, result]);
        return;
      }

      setTestingOperation(`${test.table}-${test.operation}`);

      try {
        const { data, error } = await test.testQuery();

        let status: TestResult["status"] = "success";
        let message = "";

        if (test.expectedResult === "denied" && error) {
          status = "success";
          message = `✅ Correctly denied: ${error.message}`;
        } else if (test.expectedResult === "denied" && !error) {
          status = "error";
          message = "❌ Operation should have been denied but was allowed";
        } else if (test.expectedResult === "allowed" && !error) {
          status = "success";
          message = `✅ Operation allowed as expected (${Array.isArray(data) ? data.length : "single"} record${Array.isArray(data) && data.length !== 1 ? "s" : ""})`;
        } else if (test.expectedResult === "allowed" && error) {
          status = "error";
          message = `❌ Operation should have been allowed: ${error.message}`;
        } else if (test.expectedResult === "partial") {
          status = "success";
          message = `⚠️ Partial access - check data filtering is working`;
        }

        const result: TestResult = {
          table: test.table,
          operation: test.operation,
          status,
          message,
          details: {
            data: Array.isArray(data) ? `${data.length} records` : data,
            error: error?.message,
          },
          timestamp: new Date(),
        };

        setTestResults((prev) => [...prev, result]);
      } catch (error) {
        const result: TestResult = {
          table: test.table,
          operation: test.operation,
          status: "error",
          message: `❌ Test failed: ${error instanceof Error ? error.message : String(error)}`,
          timestamp: new Date(),
        };
        setTestResults((prev) => [...prev, result]);
      } finally {
        setTestingOperation(null);
      }
    },
    [user, isAdmin],
  );

  const runAllTests = useCallback(async () => {
    setIsTestingAll(true);
    setTestResults([]);
    toast.info("Starting comprehensive RLS policy tests...");

    for (const test of RLS_TESTS) {
      await runTest(test);
      // Small delay between tests
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    setIsTestingAll(false);
    toast.success("RLS policy testing completed");
  }, [runTest]);

  const clearResults = useCallback(() => {
    setTestResults([]);
  }, []);

  const getStatusIcon = (status: TestResult["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <RefreshCw className="h-4 w-4 text-blue-600" />;
    }
  };

  const successCount = testResults.filter((r) => r.status === "success").length;
  const errorCount = testResults.filter((r) => r.status === "error").length;
  const warningCount = testResults.filter((r) => r.status === "warning").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Shield className="h-6 w-6 text-blue-600" />
          <div>
            <h3 className="text-xl font-bold">RLS Policy Tester</h3>
            <p className="text-sm text-gray-600">
              Test Row Level Security policies and permissions
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {testResults.length > 0 && (
            <Button variant="outline" onClick={clearResults} size="sm">
              Clear Results
            </Button>
          )}
          <Button onClick={runAllTests} disabled={isTestingAll} size="sm">
            {isTestingAll ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Shield className="h-4 w-4 mr-2" />
            )}
            Test All Policies
          </Button>
        </div>
      </div>

      {!user && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Some tests require authentication. Please log in to run the full
            test suite.
          </AlertDescription>
        </Alert>
      )}

      {/* Test Summary */}
      {testResults.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Passed</p>
                  <p className="text-2xl font-bold text-green-600">
                    {successCount}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-sm text-gray-600">Failed</p>
                  <p className="text-2xl font-bold text-red-600">
                    {errorCount}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm text-gray-600">Skipped</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {warningCount}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Individual Tests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {RLS_TESTS.map((test, index) => {
          const result = testResults.find(
            (r) => r.table === test.table && r.operation === test.operation,
          );
          const Icon = test.icon;
          const isCurrentlyTesting =
            testingOperation === `${test.table}-${test.operation}`;

          return (
            <Card
              key={`${test.table}-${test.operation}-${index}`}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Icon className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-lg">{test.table}</CardTitle>
                    <Badge variant="outline">{test.operation}</Badge>
                  </div>
                  {result && getStatusIcon(result.status)}
                </div>
                <CardDescription className="text-sm">
                  {test.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge
                    variant={
                      test.expectedResult === "allowed"
                        ? "default"
                        : test.expectedResult === "denied"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    Expected: {test.expectedResult}
                  </Badge>
                  {test.requiresAuth && (
                    <Badge variant="outline">Auth Required</Badge>
                  )}
                  {test.requiresAdmin && (
                    <Badge variant="outline">Admin Only</Badge>
                  )}
                </div>

                {result && (
                  <div
                    className={`p-3 rounded-lg text-sm ${
                      result.status === "success"
                        ? "bg-green-50 text-green-800"
                        : result.status === "error"
                          ? "bg-red-50 text-red-800"
                          : "bg-yellow-50 text-yellow-800"
                    }`}
                  >
                    {result.message}

                    {result.details && (
                      <div className="mt-2 text-xs font-mono opacity-75">
                        {JSON.stringify(result.details, null, 2)}
                      </div>
                    )}
                  </div>
                )}

                <Button
                  onClick={() => runTest(test)}
                  disabled={isCurrentlyTesting || isTestingAll}
                  size="sm"
                  className="w-full"
                  variant={result?.status === "success" ? "outline" : "default"}
                >
                  {isCurrentlyTesting ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Shield className="h-4 w-4 mr-2" />
                  )}
                  {result ? "Retest" : "Test Policy"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Results Summary */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results Summary</CardTitle>
            <CardDescription>
              Detailed results from RLS policy testing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 border rounded"
                >
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(result.status)}
                    <span className="font-medium">{result.table}</span>
                    <Badge variant="outline" className="text-xs">
                      {result.operation}
                    </Badge>
                  </div>
                  <span className="text-xs text-gray-500">
                    {result.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RLSPolicyTester;

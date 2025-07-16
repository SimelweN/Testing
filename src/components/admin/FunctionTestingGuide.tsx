import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BookOpen,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Shield,
  Database,
  DollarSign,
  Truck,
  Mail,
  Zap,
  Info,
  Terminal,
  Code,
  FileText,
} from "lucide-react";

const FunctionTestingGuide = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("overview");

  const commonIssues = [
    {
      issue: "Function returns 401 Unauthorized",
      icon: Shield,
      description: "Authentication token is missing or invalid",
      solutions: [
        "Ensure user is logged in before testing auth-required functions",
        "Check if the function requires admin privileges",
        "Verify Supabase JWT token is being passed correctly",
        "Check RLS policies on tables accessed by the function",
      ],
      severity: "high",
    },
    {
      issue: "Function returns 403 Forbidden",
      icon: XCircle,
      description: "User lacks required permissions",
      solutions: [
        "Verify admin role if function requires admin access",
        "Check RLS policies allow the operation",
        "Ensure user owns the resources they're trying to access",
        "Verify service role permissions for system functions",
      ],
      severity: "high",
    },
    {
      issue: "Function returns 500 Internal Server Error",
      icon: AlertTriangle,
      description: "Server-side error in function execution",
      solutions: [
        "Check function logs in Supabase dashboard",
        "Verify all required environment variables are set",
        "Check database table permissions and RLS policies",
        "Validate input payload format matches expected schema",
      ],
      severity: "critical",
    },
    {
      issue: "Function returns 404 Not Found",
      icon: FileText,
      description: "Function endpoint doesn't exist or is misconfigured",
      solutions: [
        "Verify function is deployed in Supabase",
        "Check function name spelling in the endpoint URL",
        "Ensure function is properly exported",
        "Check if function was recently deleted or renamed",
      ],
      severity: "medium",
    },
    {
      issue: "RLS Policy Blocking Operations",
      icon: Database,
      description: "Row Level Security is preventing data access",
      solutions: [
        "Review RLS policies on affected tables",
        "Ensure policies allow the intended operations",
        "Check if user context is properly passed to policies",
        "Verify service role bypasses RLS when appropriate",
      ],
      severity: "high",
    },
  ];

  const rlsGuide = [
    {
      table: "profiles",
      policies: [
        "Users can view/edit their own profile",
        "Users cannot access other users' banking info",
        "Admin can view all profiles",
      ],
      common_issues: [
        "User trying to update another user's profile",
        "Accessing banking_info without proper permissions",
      ],
    },
    {
      table: "books",
      policies: [
        "Anyone can view published books",
        "Users can only edit their own books",
        "Sellers can manage their book listings",
      ],
      common_issues: [
        "User trying to edit books they don't own",
        "Accessing unpublished or private book data",
      ],
    },
    {
      table: "orders/sale_commitments",
      policies: [
        "Buyers can view their orders",
        "Sellers can view orders for their books",
        "Service role can manage all orders",
      ],
      common_issues: [
        "User trying to access orders they're not involved in",
        "Missing service role permissions for system operations",
      ],
    },
    {
      table: "notifications",
      policies: [
        "Users can only view their own notifications",
        "System can create notifications for any user",
        "Users cannot create notifications for others",
      ],
      common_issues: [
        "User trying to create notifications for other users",
        "Accessing notifications without proper user context",
      ],
    },
  ];

  const testingBestPractices = [
    {
      title: "Test in Stages",
      description:
        "Start with basic functions and gradually test more complex ones",
      icon: CheckCircle,
      details: [
        "Begin with read-only functions that don't modify data",
        "Test authentication flows before testing auth-required functions",
        "Validate RLS policies with simple SELECT queries first",
        "Test edge cases and error conditions last",
      ],
    },
    {
      title: "Use Safe Test Data",
      description: "Never test with production data or real user information",
      icon: Shield,
      details: [
        "Create dedicated test accounts for function testing",
        "Use obviously fake data that can be easily identified",
        "Clean up test data immediately after testing",
        "Use test payment tokens, not real payment information",
      ],
    },
    {
      title: "Monitor Function Logs",
      description:
        "Check Supabase function logs for detailed error information",
      icon: Terminal,
      details: [
        "Access logs through Supabase Dashboard > Edge Functions",
        "Look for console.log outputs from your functions",
        "Check for uncaught exceptions and stack traces",
        "Monitor performance metrics and execution times",
      ],
    },
    {
      title: "Test Error Scenarios",
      description: "Verify functions handle errors gracefully",
      icon: AlertTriangle,
      details: [
        "Test with invalid input parameters",
        "Test with missing required fields",
        "Test rate limiting and timeout scenarios",
        "Verify proper error messages are returned",
      ],
    },
  ];

  const environmentChecklist = [
    {
      item: "VITE_SUPABASE_URL",
      description: "Your Supabase project URL",
      critical: true,
    },
    {
      item: "VITE_SUPABASE_ANON_KEY",
      description: "Supabase anonymous/public key",
      critical: true,
    },
    {
      item: "Service Role Key",
      description: "Required for admin functions and bypassing RLS",
      critical: true,
    },
    {
      item: "Paystack Keys",
      description: "For payment-related function testing",
      critical: false,
    },
    {
      item: "Email Service Config",
      description: "For email function testing (Brevo/SMTP)",
      critical: false,
    },
    {
      item: "Shipping API Keys",
      description: "For courier and shipping function testing",
      critical: false,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <BookOpen className="h-6 w-6 text-blue-600" />
        <div>
          <h3 className="text-xl font-bold">Function Testing Guide</h3>
          <p className="text-sm text-gray-600">
            Comprehensive guide to testing Supabase functions and RLS policies
          </p>
        </div>
      </div>

      <Tabs
        value={selectedCategory}
        onValueChange={setSelectedCategory}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="issues">Common Issues</TabsTrigger>
          <TabsTrigger value="rls">RLS Guide</TabsTrigger>
          <TabsTrigger value="practices">Best Practices</TabsTrigger>
          <TabsTrigger value="environment">Environment</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-blue-600" />
                  <span>Function Categories</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Orders & Commerce</span>
                  <Badge>6 functions</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Payment Processing</span>
                  <Badge>5 functions</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Shipping & Delivery</span>
                  <Badge>7 functions</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Communication</span>
                  <Badge>2 functions</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Database Functions</span>
                  <Badge>4 functions</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  <span>Security Features</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Row Level Security (RLS)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>JWT Authentication</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Admin Role Verification</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Service Role Separation</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Input Validation</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> Always test with non-production data.
              Some functions may modify database records or trigger external
              services (payments, emails, shipping).
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="issues" className="space-y-4">
          <div className="space-y-4">
            {commonIssues.map((issue, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <issue.icon className="h-5 w-5" />
                      <span>{issue.issue}</span>
                    </CardTitle>
                    <Badge
                      variant={
                        issue.severity === "critical"
                          ? "destructive"
                          : issue.severity === "high"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {issue.severity}
                    </Badge>
                  </div>
                  <CardDescription>{issue.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div>
                    <h4 className="font-medium mb-2">Solutions:</h4>
                    <ul className="space-y-1">
                      {issue.solutions.map((solution, idx) => (
                        <li
                          key={idx}
                          className="flex items-start space-x-2 text-sm"
                        >
                          <span className="text-blue-600 mt-1">•</span>
                          <span>{solution}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="rls" className="space-y-4">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Row Level Security (RLS) policies control data access at the
              database level. Understanding these policies is crucial for
              debugging function issues.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            {rlsGuide.map((guide, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Database className="h-5 w-5 text-blue-600" />
                    <span>{guide.table}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Active Policies:</h4>
                    <ul className="space-y-1">
                      {guide.policies.map((policy, idx) => (
                        <li
                          key={idx}
                          className="flex items-start space-x-2 text-sm"
                        >
                          <CheckCircle className="h-3 w-3 text-green-600 mt-1" />
                          <span>{policy}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Common Issues:</h4>
                    <ul className="space-y-1">
                      {guide.common_issues.map((issue, idx) => (
                        <li
                          key={idx}
                          className="flex items-start space-x-2 text-sm"
                        >
                          <AlertTriangle className="h-3 w-3 text-yellow-600 mt-1" />
                          <span>{issue}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="practices" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {testingBestPractices.map((practice, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <practice.icon className="h-5 w-5 text-blue-600" />
                    <span>{practice.title}</span>
                  </CardTitle>
                  <CardDescription>{practice.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {practice.details.map((detail, idx) => (
                      <li
                        key={idx}
                        className="flex items-start space-x-2 text-sm"
                      >
                        <span className="text-blue-600 mt-1">•</span>
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="environment" className="space-y-4">
          <Alert>
            <Terminal className="h-4 w-4" />
            <AlertDescription>
              Ensure all required environment variables are properly configured
              before testing functions.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>Environment Variables Checklist</CardTitle>
              <CardDescription>
                Required configuration for comprehensive function testing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {environmentChecklist.map((env, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-2 h-2 rounded-full ${env.critical ? "bg-red-500" : "bg-yellow-500"}`}
                      />
                      <div>
                        <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                          {env.item}
                        </code>
                        <p className="text-sm text-gray-600 mt-1">
                          {env.description}
                        </p>
                      </div>
                    </div>
                    <Badge variant={env.critical ? "destructive" : "secondary"}>
                      {env.critical ? "Required" : "Optional"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Environment Check</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm font-mono bg-gray-50 p-4 rounded-lg">
                <div>
                  VITE_SUPABASE_URL:{" "}
                  {import.meta.env.VITE_SUPABASE_URL ? "✅ Set" : "❌ Missing"}
                </div>
                <div>
                  VITE_SUPABASE_ANON_KEY:{" "}
                  {import.meta.env.VITE_SUPABASE_ANON_KEY
                    ? "✅ Set"
                    : "❌ Missing"}
                </div>
                <div>
                  Development Mode: {import.meta.env.DEV ? "✅ Yes" : "❌ No"}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FunctionTestingGuide;

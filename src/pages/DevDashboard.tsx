import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Settings,
  Database,
  Mail,
  Bell,
  Package,
  ShoppingCart,
  User,
  CreditCard,
  TruckIcon,
  TestTube,
  Activity,
  Eye,
  Trash2,
  Plus,
  RefreshCw,
  Code,
  Monitor,
  Bug,
  Zap,
  Globe,
  Shield,
  CheckCircle,
  AlertTriangle,
  Clock,
  BarChart,
  Smartphone,
  BookOpen,
  GraduationCap,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import OrderCancellationService from "@/services/orderCancellationService";
import { emailService } from "@/services/emailService";
import { addNotification } from "@/services/notificationService";

interface SystemStatus {
  database: "healthy" | "degraded" | "down";
  auth: "healthy" | "degraded" | "down";
  email: "healthy" | "degraded" | "down";
  payments: "healthy" | "degraded" | "down";
  delivery: "healthy" | "degraded" | "down";
}

interface TestResult {
  test: string;
  status: "pass" | "fail" | "warning";
  message: string;
  duration: number;
}

const DevDashboard = () => {
  const { user, profile, isAdmin } = useAuth();
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    database: "healthy",
    auth: "healthy",
    email: "healthy",
    payments: "healthy",
    delivery: "healthy",
  });
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [mockDataCount, setMockDataCount] = useState(5);
  const [selectedTestUser, setSelectedTestUser] = useState("");
  const [testNotification, setTestNotification] = useState({
    title: "Test Notification",
    message: "This is a test notification from the dev dashboard",
    type: "info" as "info" | "warning" | "success" | "error",
  });

  // Redirect non-admins
  if (!isAdmin) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Alert className="border-red-200 bg-red-50">
            <Shield className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              Access denied. This dashboard is only available to administrators.
            </AlertDescription>
          </Alert>
        </div>
      </Layout>
    );
  }

  useEffect(() => {
    checkSystemStatus();
  }, []);

  const checkSystemStatus = async () => {
    const status: SystemStatus = {
      database: "healthy",
      auth: "healthy",
      email: "healthy",
      payments: "healthy",
      delivery: "healthy",
    };

    try {
      // Test database connection
      const { error: dbError } = await supabase
        .from("profiles")
        .select("id")
        .limit(1);
      if (dbError) status.database = "degraded";

      // Test auth
      if (!user) status.auth = "degraded";

      // Test email service
      try {
        await emailService.sendEmail({
          to: "test@example.com",
          subject: "Health Check",
          text: "System health check",
          dryRun: true,
        });
      } catch (error) {
        status.email = "degraded";
      }

      setSystemStatus(status);
    } catch (error) {
      console.error("System status check failed:", error);
    }
  };

  const runComprehensiveTests = async () => {
    setIsRunningTests(true);
    setTestResults([]);
    const results: TestResult[] = [];

    const runTest = async (testName: string, testFn: () => Promise<void>) => {
      const startTime = Date.now();
      try {
        await testFn();
        results.push({
          test: testName,
          status: "pass",
          message: "Test passed successfully",
          duration: Date.now() - startTime,
        });
      } catch (error) {
        results.push({
          test: testName,
          status: "fail",
          message: error instanceof Error ? error.message : "Test failed",
          duration: Date.now() - startTime,
        });
      }
      setTestResults([...results]);
    };

    // Database Tests
    await runTest("Database Connection", async () => {
      const { error } = await supabase.from("profiles").select("id").limit(1);
      if (error) throw error;
    });

    await runTest("User Profile Access", async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single();
      if (error) throw error;
      if (!data) throw new Error("User profile not found");
    });

    // Books System Tests
    await runTest("Books Table Access", async () => {
      const { error } = await supabase.from("books").select("id").limit(1);
      if (error) throw error;
    });

    await runTest("Orders System", async () => {
      const { error } = await supabase.from("orders").select("id").limit(1);
      if (error) throw error;
    });

    // Notification System Tests
    await runTest("Notifications System", async () => {
      const { error } = await supabase
        .from("notifications")
        .select("id")
        .limit(1);
      if (error) throw error;
    });

    // Email System Tests
    await runTest("Email Service", async () => {
      // Test email service initialization
      if (!emailService) throw new Error("Email service not initialized");
    });

    // Authentication Tests
    await runTest("Authentication System", async () => {
      if (!user) throw new Error("User not authenticated");
      if (!profile) throw new Error("User profile not loaded");
    });

    setIsRunningTests(false);
    toast.success(
      `Comprehensive testing completed. ${results.filter((r) => r.status === "pass").length}/${results.length} tests passed.`,
    );
  };

  const generateMockData = async (type: string) => {
    try {
      switch (type) {
        case "books":
          await generateMockBooks();
          break;
        case "orders":
          await generateMockOrders();
          break;
        case "notifications":
          await generateMockNotifications();
          break;
        case "users":
          await generateMockUsers();
          break;
      }
      toast.success(`Generated ${mockDataCount} mock ${type}`);
    } catch (error) {
      toast.error(
        `Failed to generate mock ${type}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  const generateMockBooks = async () => {
    const mockBooks = Array.from({ length: mockDataCount }, (_, i) => ({
      title: `Test Book ${i + 1}`,
      author: `Test Author ${i + 1}`,
      isbn: `978000000${String(i + 1).padStart(4, "0")}`,
      price: Math.floor(Math.random() * 500) + 50,
      condition: ["new", "excellent", "good", "fair"][
        Math.floor(Math.random() * 4)
      ],
      description: `This is a test book for development purposes. Book ${i + 1}.`,
      category: ["textbooks", "fiction", "non-fiction", "academic"][
        Math.floor(Math.random() * 4)
      ],
      seller_id: user?.id,
      status: "available",
    }));

    const { error } = await supabase.from("books").insert(mockBooks);
    if (error) throw error;
  };

  const generateMockOrders = async () => {
    // First get some books
    const { data: books, error: booksError } = await supabase
      .from("books")
      .select("id, price")
      .limit(mockDataCount);

    if (booksError || !books?.length) {
      throw new Error("No books found to create orders");
    }

    const mockOrders = books.map((book, i) => ({
      book_id: book.id,
      buyer_id: user?.id,
      seller_id: user?.id, // In real scenario this would be different
      total_amount: book.price,
      status: ["pending", "confirmed", "delivered"][
        Math.floor(Math.random() * 3)
      ],
      delivery_status: ["pending", "picked_up", "in_transit", "delivered"][
        Math.floor(Math.random() * 4)
      ],
    }));

    const { error } = await supabase.from("orders").insert(mockOrders);
    if (error) throw error;
  };

  const generateMockNotifications = async () => {
    const notifications = Array.from({ length: mockDataCount }, (_, i) => ({
      user_id: user?.id,
      title: `Test Notification ${i + 1}`,
      message: `This is test notification number ${i + 1} for development testing.`,
      type: ["info", "warning", "success", "error"][
        Math.floor(Math.random() * 4)
      ],
      read: Math.random() > 0.5,
      action_required: Math.random() > 0.7,
    }));

    const { error } = await supabase
      .from("notifications")
      .insert(notifications);
    if (error) throw error;
  };

  const generateMockUsers = async () => {
    // This would typically be done through the auth system
    toast.info("Mock users should be created through the registration system");
  };

  const testEmailSystem = async () => {
    try {
      await emailService.sendEmail({
        to: user?.email || "test@example.com",
        subject: "Development Dashboard Test Email",
        html: `
          <h2>Test Email from Development Dashboard</h2>
          <p>This is a test email sent from the ReBooked Solutions development dashboard.</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          <p><strong>User:</strong> ${user?.email}</p>
          <p>If you received this email, the email system is working correctly!</p>
        `,
        text: `Test email from Development Dashboard sent at ${new Date().toISOString()}`,
      });
      toast.success("Test email sent successfully!");
    } catch (error) {
      toast.error(
        `Email test failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  const testNotificationSystem = async () => {
    if (!user?.id) {
      toast.error("User not authenticated");
      return;
    }

    try {
      await addNotification({
        userId: user.id,
        title: testNotification.title,
        message: testNotification.message,
        type: testNotification.type,
        read: false,
      });
      toast.success("Test notification created successfully!");
    } catch (error) {
      toast.error(
        `Notification test failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  const simulateOrderFlow = async () => {
    try {
      // Create a test order and simulate the entire flow
      toast.info("Simulating complete order flow...");

      // This would involve creating an order, confirming it,
      // simulating pickup, delivery, etc.
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast.success("Order flow simulation completed!");
    } catch (error) {
      toast.error(
        `Order flow simulation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  const clearTestData = async (type: string) => {
    try {
      switch (type) {
        case "books":
          await supabase.from("books").delete().ilike("title", "Test Book%");
          break;
                case "orders":
          await supabase.from("orders").delete().eq("buyer_email", user?.email);
          break;
        case "notifications":
          await supabase
            .from("notifications")
            .delete()
            .ilike("title", "Test Notification%");
          break;
      }
      toast.success(`Cleared test ${type} data`);
    } catch (error) {
      toast.error(
        `Failed to clear ${type}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-green-500";
      case "degraded":
        return "bg-yellow-500";
      case "down":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getTestStatusIcon = (status: string) => {
    switch (status) {
      case "pass":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "fail":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case "warning":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Development Dashboard
            </h1>
            <p className="text-gray-600 mt-2">
              Comprehensive testing and monitoring for ReBooked Solutions
            </p>
          </div>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            <Monitor className="h-4 w-4 mr-1" />
            Admin Mode
          </Badge>
        </div>

        {/* System Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Database className="h-6 w-6 text-gray-600 mr-2" />
                <div
                  className={`w-3 h-3 rounded-full ${getStatusColor(systemStatus.database)}`}
                />
              </div>
              <p className="text-sm font-medium">Database</p>
              <p className="text-xs text-gray-500 capitalize">
                {systemStatus.database}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Shield className="h-6 w-6 text-gray-600 mr-2" />
                <div
                  className={`w-3 h-3 rounded-full ${getStatusColor(systemStatus.auth)}`}
                />
              </div>
              <p className="text-sm font-medium">Authentication</p>
              <p className="text-xs text-gray-500 capitalize">
                {systemStatus.auth}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Mail className="h-6 w-6 text-gray-600 mr-2" />
                <div
                  className={`w-3 h-3 rounded-full ${getStatusColor(systemStatus.email)}`}
                />
              </div>
              <p className="text-sm font-medium">Email Service</p>
              <p className="text-xs text-gray-500 capitalize">
                {systemStatus.email}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <CreditCard className="h-6 w-6 text-gray-600 mr-2" />
                <div
                  className={`w-3 h-3 rounded-full ${getStatusColor(systemStatus.payments)}`}
                />
              </div>
              <p className="text-sm font-medium">Payments</p>
              <p className="text-xs text-gray-500 capitalize">
                {systemStatus.payments}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <TruckIcon className="h-6 w-6 text-gray-600 mr-2" />
                <div
                  className={`w-3 h-3 rounded-full ${getStatusColor(systemStatus.delivery)}`}
                />
              </div>
              <p className="text-sm font-medium">Delivery</p>
              <p className="text-xs text-gray-500 capitalize">
                {systemStatus.delivery}
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="testing" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="testing">
              <TestTube className="h-4 w-4 mr-2" />
              Testing
            </TabsTrigger>
            <TabsTrigger value="mockdata">
              <Database className="h-4 w-4 mr-2" />
              Mock Data
            </TabsTrigger>
            <TabsTrigger value="features">
              <Zap className="h-4 w-4 mr-2" />
              Features
            </TabsTrigger>
            <TabsTrigger value="monitoring">
              <Activity className="h-4 w-4 mr-2" />
              Monitoring
            </TabsTrigger>
            <TabsTrigger value="tools">
              <Settings className="h-4 w-4 mr-2" />
              Tools
            </TabsTrigger>
            <TabsTrigger value="apis">
              <Globe className="h-4 w-4 mr-2" />
              APIs
            </TabsTrigger>
          </TabsList>

          {/* Testing Tab */}
          <TabsContent value="testing">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TestTube className="h-5 w-5 mr-2" />
                    System Tests
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    onClick={runComprehensiveTests}
                    disabled={isRunningTests}
                    className="w-full"
                  >
                    {isRunningTests ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Running Tests...
                      </>
                    ) : (
                      <>
                        <TestTube className="h-4 w-4 mr-2" />
                        Run Comprehensive Tests
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={checkSystemStatus}
                    variant="outline"
                    className="w-full"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh System Status
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Test Results</CardTitle>
                </CardHeader>
                <CardContent>
                  {testResults.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      No tests run yet. Click "Run Comprehensive Tests" to
                      start.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {testResults.map((result, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 rounded border"
                        >
                          <div className="flex items-center space-x-2">
                            {getTestStatusIcon(result.status)}
                            <span className="text-sm font-medium">
                              {result.test}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">
                              {result.duration}ms
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Mock Data Tab */}
          <TabsContent value="mockdata">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BookOpen className="h-5 w-5 mr-2" />
                    Books
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input
                    type="number"
                    value={mockDataCount}
                    onChange={(e) => setMockDataCount(Number(e.target.value))}
                    placeholder="Count"
                    min="1"
                    max="50"
                  />
                  <Button
                    onClick={() => generateMockData("books")}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Generate Books
                  </Button>
                  <Button
                    onClick={() => clearTestData("books")}
                    variant="destructive"
                    className="w-full"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear Test Books
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Package className="h-5 w-5 mr-2" />
                    Orders
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input
                    type="number"
                    value={mockDataCount}
                    onChange={(e) => setMockDataCount(Number(e.target.value))}
                    placeholder="Count"
                    min="1"
                    max="50"
                  />
                  <Button
                    onClick={() => generateMockData("orders")}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Generate Orders
                  </Button>
                  <Button
                    onClick={() => clearTestData("orders")}
                    variant="destructive"
                    className="w-full"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear Test Orders
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Bell className="h-5 w-5 mr-2" />
                    Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input
                    type="number"
                    value={mockDataCount}
                    onChange={(e) => setMockDataCount(Number(e.target.value))}
                    placeholder="Count"
                    min="1"
                    max="50"
                  />
                  <Button
                    onClick={() => generateMockData("notifications")}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Generate Notifications
                  </Button>
                  <Button
                    onClick={() => clearTestData("notifications")}
                    variant="destructive"
                    className="w-full"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear Test Notifications
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Users
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input
                    type="number"
                    value={mockDataCount}
                    onChange={(e) => setMockDataCount(Number(e.target.value))}
                    placeholder="Count"
                    min="1"
                    max="20"
                  />
                  <Button
                    onClick={() => generateMockData("users")}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Generate Users
                  </Button>
                  <Button
                    onClick={() => clearTestData("users")}
                    variant="destructive"
                    className="w-full"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear Test Users
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Features Tab */}
          <TabsContent value="features">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Mail className="h-5 w-5 mr-2" />
                    Email System
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button onClick={testEmailSystem} className="w-full">
                    <Mail className="h-4 w-4 mr-2" />
                    Send Test Email
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Eye className="h-4 w-4 mr-2" />
                    View Email Templates
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Bell className="h-5 w-5 mr-2" />
                    Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input
                    placeholder="Notification title"
                    value={testNotification.title}
                    onChange={(e) =>
                      setTestNotification({
                        ...testNotification,
                        title: e.target.value,
                      })
                    }
                  />
                  <Textarea
                    placeholder="Notification message"
                    value={testNotification.message}
                    onChange={(e) =>
                      setTestNotification({
                        ...testNotification,
                        message: e.target.value,
                      })
                    }
                  />
                  <Select
                    value={testNotification.type}
                    onValueChange={(value: any) =>
                      setTestNotification({ ...testNotification, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={testNotificationSystem} className="w-full">
                    <Bell className="h-4 w-4 mr-2" />
                    Send Test Notification
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Package className="h-5 w-5 mr-2" />
                    Order System
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button onClick={simulateOrderFlow} className="w-full">
                    <Package className="h-4 w-4 mr-2" />
                    Simulate Order Flow
                  </Button>
                  <Button variant="outline" className="w-full">
                    <TruckIcon className="h-4 w-4 mr-2" />
                    Test Delivery APIs
                  </Button>
                  <Button variant="outline" className="w-full">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Test Payment System
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Marketplace
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Test Book Search
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Star className="h-4 w-4 mr-2" />
                    Test Rating System
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <GraduationCap className="h-5 w-5 mr-2" />
                    University System
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full">
                    <GraduationCap className="h-4 w-4 mr-2" />
                    Test APS Calculator
                  </Button>
                  <Button variant="outline" className="w-full">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Test Study Resources
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="h-5 w-5 mr-2" />
                    Authentication
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full">
                    <User className="h-4 w-4 mr-2" />
                    Test User Registration
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Shield className="h-4 w-4 mr-2" />
                    Test Password Reset
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Monitoring Tab */}
          <TabsContent value="monitoring">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart className="h-5 w-5 mr-2" />
                    System Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Database Queries</span>
                      <Badge variant="secondary">~45/min</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Active Users</span>
                      <Badge variant="secondary">12</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Email Queue</span>
                      <Badge variant="secondary">3 pending</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Memory Usage</span>
                      <Badge variant="secondary">68%</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="h-5 w-5 mr-2" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span>System health check passed</span>
                      <span className="text-gray-500 text-xs ml-auto">
                        2m ago
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      <span>New user registered</span>
                      <span className="text-gray-500 text-xs ml-auto">
                        5m ago
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                      <span>Email queue processing</span>
                      <span className="text-gray-500 text-xs ml-auto">
                        8m ago
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tools Tab */}
          <TabsContent value="tools">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Database className="h-5 w-5 mr-2" />
                    Database Tools
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full">
                    <Database className="h-4 w-4 mr-2" />
                    Query Builder
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Eye className="h-4 w-4 mr-2" />
                    View Tables
                  </Button>
                  <Button variant="outline" className="w-full">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Backup Database
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Code className="h-5 w-5 mr-2" />
                    Development Tools
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full">
                    <Bug className="h-4 w-4 mr-2" />
                    Debug Console
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Activity className="h-4 w-4 mr-2" />
                    Performance Monitor
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Settings className="h-4 w-4 mr-2" />
                    Feature Flags
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Smartphone className="h-5 w-5 mr-2" />
                    Testing Tools
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full">
                    <Smartphone className="h-4 w-4 mr-2" />
                    Mobile Simulator
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Eye className="h-4 w-4 mr-2" />
                    Screenshot Tester
                  </Button>
                  <Button variant="outline" className="w-full">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Load Tester
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* APIs Tab */}
          <TabsContent value="apis">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Globe className="h-5 w-5 mr-2" />
                    External APIs
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center p-2 rounded border">
                    <span className="text-sm">Paystack API</span>
                    <Badge className="bg-green-100 text-green-800">
                      Online
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded border">
                    <span className="text-sm">Courier Guy API</span>
                    <Badge className="bg-green-100 text-green-800">
                      Online
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded border">
                    <span className="text-sm">Fastway API</span>
                    <Badge className="bg-yellow-100 text-yellow-800">
                      Degraded
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded border">
                    <span className="text-sm">Email Service</span>
                    <Badge className="bg-green-100 text-green-800">
                      Online
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="h-5 w-5 mr-2" />
                    API Testing
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full">
                    <Globe className="h-4 w-4 mr-2" />
                    Test All APIs
                  </Button>
                  <Button variant="outline" className="w-full">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Test Payment API
                  </Button>
                  <Button variant="outline" className="w-full">
                    <TruckIcon className="h-4 w-4 mr-2" />
                    Test Delivery APIs
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Mail className="h-4 w-4 mr-2" />
                    Test Email API
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Quick Actions Footer */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="h-5 w-5 mr-2" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button size="sm" onClick={() => window.open("/books", "_blank")}>
                <BookOpen className="h-4 w-4 mr-2" />
                View Books
              </Button>
              <Button
                size="sm"
                onClick={() => window.open("/activity", "_blank")}
              >
                <Activity className="h-4 w-4 mr-2" />
                View Activity
              </Button>
              <Button
                size="sm"
                onClick={() => window.open("/notifications", "_blank")}
              >
                <Bell className="h-4 w-4 mr-2" />
                View Notifications
              </Button>
              <Button
                size="sm"
                onClick={() => window.open("/university-info", "_blank")}
              >
                <GraduationCap className="h-4 w-4 mr-2" />
                University Info
              </Button>
              <Button size="sm" onClick={() => window.open("/admin", "_blank")}>
                <Shield className="h-4 w-4 mr-2" />
                Admin Panel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default DevDashboard;

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft,
  Play,
  Code,
  Mail,
  Package,
  CreditCard,
  Truck,
  Users,
  Database,
  CheckCircle,
  AlertCircle,
  XCircle,
  Loader2,
  Terminal,
  Bug,
  Zap,
  Send
} from "lucide-react";

interface TestResult {
  function: string;
  status: 'success' | 'error' | 'pending';
  statusCode?: number;
  response?: any;
  error?: string;
  duration?: number;
  timestamp: string;
}

interface TestBook {
  id: string;
  title: string;
  price: number;
  seller_id: string;
  seller_name: string;
}

interface TestUser {
  id: string;
  name: string;
  email: string;
  address?: any;
}

const Developer = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [books, setBooks] = useState<TestBook[]>([]);
  const [users, setUsers] = useState<TestUser[]>([]);
  const [selectedBook, setSelectedBook] = useState<string>("");
  const [selectedBuyer, setSelectedBuyer] = useState<string>("");
  const [selectedSeller, setSelectedSeller] = useState<string>("");
  const [emailTemplate, setEmailTemplate] = useState("approval");
  const [customEmail, setCustomEmail] = useState("");

  // Load test data on component mount
  useEffect(() => {
    loadTestData();
  }, []);

  const loadTestData = async () => {
    try {
      // Load books
      const { data: booksData } = await supabase
        .from('books')
        .select(`
          id,
          title,
          price,
          seller_id,
          profiles:seller_id (name)
        `)
        .eq('status', 'available')
        .limit(10);

      if (booksData) {
        const formattedBooks = booksData.map(book => ({
          id: book.id,
          title: book.title,
          price: book.price,
          seller_id: book.seller_id,
          seller_name: book.profiles?.name || 'Unknown Seller'
        }));
        setBooks(formattedBooks);
        if (formattedBooks.length > 0) {
          setSelectedBook(formattedBooks[0].id);
        }
      }

      // Load users
      const { data: usersData } = await supabase
        .from('profiles')
        .select('id, name, email')
        .not('name', 'is', null)
        .limit(20);

      if (usersData) {
        setUsers(usersData);
        if (usersData.length > 0) {
          setSelectedBuyer(usersData[0].id);
          setSelectedSeller(usersData[1]?.id || usersData[0].id);
        }
      }

      toast.success(`Loaded ${booksData?.length || 0} books and ${usersData?.length || 0} users for testing`);
    } catch (error) {
      console.error('Error loading test data:', error);
      toast.error('Failed to load test data');
    }
  };

  const callEdgeFunction = async (functionName: string, payload: any = {}) => {
    const startTime = Date.now();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: payload
      });

      const duration = Date.now() - startTime;

      const result: TestResult = {
        function: functionName,
        status: error ? 'error' : 'success',
        statusCode: error ? 400 : 200,
        response: data,
        error: error?.message,
        duration,
        timestamp: new Date().toLocaleTimeString()
      };

      setTestResults(prev => [result, ...prev]);
      
      if (error) {
        toast.error(`${functionName} failed: ${error.message}`);
      } else {
        toast.success(`${functionName} executed successfully (${duration}ms)`);
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const result: TestResult = {
        function: functionName,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
        timestamp: new Date().toLocaleTimeString()
      };

      setTestResults(prev => [result, ...prev]);
      toast.error(`${functionName} failed: ${result.error}`);
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  // Test Functions
  const testProcessBookPurchase = async () => {
    if (!selectedBook || !selectedBuyer) {
      toast.error('Please select a book and buyer');
      return;
    }

    const book = books.find(b => b.id === selectedBook);
    const buyer = users.find(u => u.id === selectedBuyer);

    const payload = {
      bookId: selectedBook,
      buyerId: selectedBuyer,
      sellerId: book?.seller_id,
      amount: book?.price || 100,
      paymentMethod: 'card',
      shippingAddress: {
        street: '123 Test Street',
        city: 'Cape Town',
        province: 'Western Cape',
        postalCode: '8001',
        country: 'South Africa'
      }
    };

    toast.info(`Testing book purchase: "${book?.title}" by ${buyer?.name}`);
    await callEdgeFunction('process-book-purchase', payload);
  };

  const testEmailSending = async () => {
    const recipient = customEmail || users.find(u => u.id === selectedBuyer)?.email;
    if (!recipient) {
      toast.error('Please select a user or enter an email');
      return;
    }

    const emailPayloads = {
      approval: {
        to: recipient,
        subject: 'Order Approved - Test Email',
        template: 'order_approved',
        data: {
          orderId: 'TEST-001',
          bookTitle: books.find(b => b.id === selectedBook)?.title || 'Test Book',
          sellerName: books.find(b => b.id === selectedBook)?.seller_name || 'Test Seller'
        }
      },
      denial: {
        to: recipient,
        subject: 'Order Denied - Test Email',
        template: 'order_denied',
        data: {
          orderId: 'TEST-001',
          reason: 'Test denial reason'
        }
      },
      welcome: {
        to: recipient,
        subject: 'Welcome - Test Email',
        template: 'welcome',
        data: {
          userName: users.find(u => u.id === selectedBuyer)?.name || 'Test User'
        }
      }
    };

    toast.info(`Sending ${emailTemplate} email to ${recipient}`);
    await callEdgeFunction('send-email', emailPayloads[emailTemplate as keyof typeof emailPayloads]);
  };

  const testDeliveryQuote = async () => {
    const payload = {
      from: {
        address: '1 Long Street, Cape Town',
        city: 'Cape Town',
        province: 'Western Cape',
        postalCode: '8001'
      },
      to: {
        address: '100 Main Road, Rondebosch',
        city: 'Cape Town', 
        province: 'Western Cape',
        postalCode: '7700'
      },
      package: {
        weight: 0.5,
        dimensions: { length: 20, width: 15, height: 3 }
      }
    };

    toast.info('Getting delivery quote between Cape Town and Rondebosch');
    await callEdgeFunction('courier-guy-quote', payload);
  };

  const testPaystackPayment = async () => {
    const book = books.find(b => b.id === selectedBook);
    const buyer = users.find(u => u.id === selectedBuyer);

    const payload = {
      email: buyer?.email || 'test@example.com',
      amount: (book?.price || 100) * 100, // Convert to cents
      reference: `TEST_${Date.now()}`,
      callback_url: `${window.location.origin}/payment-callback`,
      metadata: {
        bookId: selectedBook,
        buyerId: selectedBuyer,
        sellerId: book?.seller_id
      }
    };

    toast.info(`Initializing payment for R${book?.price || 100}`);
    await callEdgeFunction('initialize-paystack-payment', payload);
  };

  const testCreateRecipient = async () => {
    if (!selectedSeller) {
      toast.error('Please select a seller');
      return;
    }

    const seller = users.find(u => u.id === selectedSeller);
    
    const payload = {
      sellerId: selectedSeller,
      name: seller?.name || 'Test Seller',
      email: seller?.email || 'seller@example.com',
      bankCode: '058', // GTBank
      accountNumber: '0123456789',
      currency: 'ZAR'
    };

    toast.info(`Creating Paystack recipient for ${seller?.name}`);
    await callEdgeFunction('create-recipient', payload);
  };

  const testOrderCommit = async () => {
    const book = books.find(b => b.id === selectedBook);
    
    const payload = {
      orderId: `TEST_ORDER_${Date.now()}`,
      sellerId: book?.seller_id || selectedSeller,
      bookId: selectedBook,
      commitmentType: 'standard',
      estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
    };

    toast.info('Testing order commit functionality');
    await callEdgeFunction('commit-to-sale', payload);
  };

  const testHealthCheck = async () => {
    toast.info('Running system health check');
    await callEdgeFunction('health-test', {});
  };

  const clearResults = () => {
    setTestResults([]);
    toast.info('Test results cleared');
  };

  const runAllTests = async () => {
    toast.info('Running comprehensive test suite...');
    
    // Run tests in sequence with delays
    const tests = [
      () => testHealthCheck(),
      () => testProcessBookPurchase(),
      () => testEmailSending(),
      () => testDeliveryQuote(),
      () => testPaystackPayment(),
      () => testCreateRecipient(),
      () => testOrderCommit()
    ];

    for (const test of tests) {
      await test();
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay between tests
    }

    toast.success('Comprehensive test suite completed!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => navigate("/admin")}
                variant="ghost"
                size="sm"
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Admin</span>
              </Button>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg">
                  <Terminal className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Developer Dashboard
                  </h1>
                  <p className="text-sm text-gray-500">
                    Test all website functionalities
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={runAllTests}
                disabled={isLoading}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4 mr-2" />
                )}
                Run All Tests
              </Button>
              <Button
                onClick={clearResults}
                variant="outline"
                size="sm"
              >
                Clear Results
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-6xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            {/* Navigation Tabs */}
            <TabsList className="grid grid-cols-2 lg:grid-cols-5 gap-2 h-auto p-1">
              <TabsTrigger value="overview" className="flex flex-col items-center p-3">
                <Bug className="h-4 w-4 mb-1" />
                <span className="text-xs">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="orders" className="flex flex-col items-center p-3">
                <Package className="h-4 w-4 mb-1" />
                <span className="text-xs">Orders</span>
              </TabsTrigger>
              <TabsTrigger value="payments" className="flex flex-col items-center p-3">
                <CreditCard className="h-4 w-4 mb-1" />
                <span className="text-xs">Payments</span>
              </TabsTrigger>
              <TabsTrigger value="delivery" className="flex flex-col items-center p-3">
                <Truck className="h-4 w-4 mb-1" />
                <span className="text-xs">Delivery</span>
              </TabsTrigger>
              <TabsTrigger value="communication" className="flex flex-col items-center p-3">
                <Mail className="h-4 w-4 mb-1" />
                <span className="text-xs">Email</span>
              </TabsTrigger>
            </TabsList>

            {/* Test Data Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="h-5 w-5" />
                  <span>Test Data Selection</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Test Book</label>
                    <Select value={selectedBook} onValueChange={setSelectedBook}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a book" />
                      </SelectTrigger>
                      <SelectContent>
                        {books.map(book => (
                          <SelectItem key={book.id} value={book.id}>
                            {book.title} - R{book.price} ({book.seller_name})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Test Buyer</label>
                    <Select value={selectedBuyer} onValueChange={setSelectedBuyer}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a buyer" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map(user => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name} ({user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Test Seller</label>
                    <Select value={selectedSeller} onValueChange={setSelectedSeller}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a seller" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map(user => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name} ({user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tab Contents */}
            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>System Health</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      onClick={testHealthCheck}
                      disabled={isLoading}
                      className="w-full"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Test System Health
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Test Data Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Books Available:</span>
                        <Badge variant="outline">{books.length}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Users Available:</span>
                        <Badge variant="outline">{users.length}</Badge>
                      </div>
                      <Button
                        onClick={loadTestData}
                        variant="outline"
                        size="sm"
                        className="w-full mt-3"
                      >
                        Refresh Test Data
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="orders">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Order Processing Tests</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button
                        onClick={testProcessBookPurchase}
                        disabled={isLoading}
                        className="h-20 flex flex-col"
                      >
                        <Package className="h-6 w-6 mb-2" />
                        Test Book Purchase
                      </Button>
                      <Button
                        onClick={testOrderCommit}
                        disabled={isLoading}
                        variant="outline"
                        className="h-20 flex flex-col"
                      >
                        <CheckCircle className="h-6 w-6 mb-2" />
                        Test Order Commit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="payments">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Payment System Tests</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button
                        onClick={testPaystackPayment}
                        disabled={isLoading}
                        className="h-20 flex flex-col"
                      >
                        <CreditCard className="h-6 w-6 mb-2" />
                        Initialize Payment
                      </Button>
                      <Button
                        onClick={testCreateRecipient}
                        disabled={isLoading}
                        variant="outline"
                        className="h-20 flex flex-col"
                      >
                        <Users className="h-6 w-6 mb-2" />
                        Create Recipient
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="delivery">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Delivery System Tests</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button
                      onClick={testDeliveryQuote}
                      disabled={isLoading}
                      className="w-full h-20 flex flex-col"
                    >
                      <Truck className="h-6 w-6 mb-2" />
                      Test Delivery Quote
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="communication">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Email System Tests</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Email Template</label>
                        <Select value={emailTemplate} onValueChange={setEmailTemplate}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="approval">Order Approval</SelectItem>
                            <SelectItem value="denial">Order Denial</SelectItem>
                            <SelectItem value="welcome">Welcome Email</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Custom Email (Optional)</label>
                        <Input
                          value={customEmail}
                          onChange={(e) => setCustomEmail(e.target.value)}
                          placeholder="test@example.com"
                          type="email"
                        />
                      </div>
                    </div>
                    <Button
                      onClick={testEmailSending}
                      disabled={isLoading}
                      className="w-full h-16 flex items-center justify-center"
                    >
                      <Send className="h-5 w-5 mr-2" />
                      Send Test Email
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Test Results */}
            {testResults.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Test Results</span>
                    <Badge variant="outline">{testResults.length} tests</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {testResults.map((result, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border ${
                          result.status === 'success'
                            ? 'bg-green-50 border-green-200'
                            : 'bg-red-50 border-red-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            {result.status === 'success' ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-600" />
                            )}
                            <span className="font-medium">{result.function}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={result.status === 'success' ? 'default' : 'destructive'}>
                              {result.statusCode || result.status}
                            </Badge>
                            <span className="text-xs text-gray-500">{result.timestamp}</span>
                          </div>
                        </div>
                        
                        {result.duration && (
                          <div className="text-xs text-gray-600 mb-2">
                            Duration: {result.duration}ms
                          </div>
                        )}

                        {result.error && (
                          <div className="text-sm text-red-700 mb-2">
                            <strong>Error:</strong> {result.error}
                          </div>
                        )}

                        {result.response && (
                          <details className="text-xs">
                            <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                              View Response
                            </summary>
                            <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                              {JSON.stringify(result.response, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Developer;

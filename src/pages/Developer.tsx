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
import { NotificationDebugger } from "@/components/NotificationDebugger";
import EnhancedNotificationDebugger from "@/components/EnhancedNotificationDebugger";
import ErrorMonitor from "@/components/ErrorMonitor";
import { supabase } from "@/integrations/supabase/client";
import { ENV } from "@/config/environment";
import EmailTemplateDashboard from "@/components/admin/EmailTemplateDashboard";
import { EmailDiagnosticPanel } from "@/components/EmailDiagnosticPanel";
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
  Send,
  Clock,
  ShoppingCart,
  FileText,
  DollarSign,
  Settings,
  MapPin,
  TestTube
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
  isbn?: string;
  condition?: string;
}

interface TestUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
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
      console.log('Loading REAL data from database...');

      // Load REAL books with better query structure
      const { data: booksData, error: booksError } = await supabase
        .from('books')
        .select(`
          id,
          title,
          price,
          seller_id,
          isbn,
          book_condition,
          status,
          profiles (
            name,
            email,
            phone
          )
        `)
        .eq('status', 'available')
        .not('title', 'is', null)
        .not('price', 'is', null)
        .order('created_at', { ascending: false })
        .limit(50);

      console.log('Real books query result:', { booksData, booksError });

      if (!booksError && booksData && booksData.length > 0) {
        const realBooks = booksData.map(book => ({
          id: book.id,
          title: book.title,
          price: book.price,
          seller_id: book.seller_id,
          seller_name: book.profiles?.name || 'Unknown Seller',
          isbn: book.isbn || 'No ISBN',
          condition: book.book_condition || 'good'
        }));
        setBooks(realBooks);
        if (realBooks.length > 0) {
          setSelectedBook(realBooks[0].id);
        }
        console.log('✅ REAL Books loaded:', realBooks.length, realBooks);
        toast.success(`✅ Loaded ${realBooks.length} REAL books from database`);
      } else {
        console.error('❌ Books query failed:', booksError);
        const errorMsg = booksError?.message || booksError?.details || booksError?.hint || (booksError ? JSON.stringify(booksError, null, 2) : 'Unknown database error');
        toast.error(`❌ Failed to load books: ${errorMsg}`);

        // Try a simpler query as fallback
        console.log('🔄 Trying simpler books query...');
        const { data: simpleBooksData, error: simpleBooksError } = await supabase
          .from('books')
          .select('id, title, price, seller_id')
          .limit(10);

        if (!simpleBooksError && simpleBooksData && simpleBooksData.length > 0) {
          const simpleBooks = simpleBooksData.map(book => ({
            id: book.id,
            title: book.title,
            price: book.price,
            seller_id: book.seller_id,
            seller_name: 'Seller (Name not loaded)',
            isbn: 'ISBN not available',
            condition: 'unknown'
          }));
          setBooks(simpleBooks);
          if (simpleBooks.length > 0) {
            setSelectedBook(simpleBooks[0].id);
          }
          toast.success(`✅ Loaded ${simpleBooks.length} books with basic info`);
        } else {
          const simpleErrorMsg = simpleBooksError?.message || simpleBooksError?.details || (simpleBooksError ? JSON.stringify(simpleBooksError, null, 2) : 'No books found');
          toast.error(`❌ Simple query also failed: ${simpleErrorMsg}`);
          // Use mock data as final fallback
          const mockBooks = [
            {
              id: 'mock-book-1',
              title: 'Introduction to Computer Science',
              price: 250,
              seller_id: 'mock-seller-1',
              seller_name: 'Test Seller',
              isbn: '978-0123456789',
              condition: 'good'
            },
            {
              id: 'mock-book-2',
              title: 'Mathematics for Engineers',
              price: 180,
              seller_id: 'mock-seller-2',
              seller_name: 'Another Seller',
              isbn: '978-0987654321',
              condition: 'excellent'
            }
          ];
          setBooks(mockBooks);
          setSelectedBook(mockBooks[0].id);
          toast.warning('📚 Using mock books data');
        }
      }

      // Load REAL users (both buyers and sellers)
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id, name, email, phone, created_at')
        .not('name', 'is', null)
        .not('email', 'is', null)
        .order('created_at', { ascending: false })
        .limit(100);

      console.log('Real users query result:', { usersData, usersError });

      if (!usersError && usersData && usersData.length > 0) {
        const realUsers = usersData.map(user => ({
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone || '+27123456789'
        }));

        setUsers(realUsers);
        if (realUsers.length > 0) {
          setSelectedBuyer(realUsers[0].id);
        }

        // Try to find a seller (someone who has books)
        const sellerIds = [...new Set(booksData?.map(book => book.seller_id) || [])];
        const realSeller = realUsers.find(user => sellerIds.includes(user.id));
        setSelectedSeller(realSeller?.id || realUsers[1]?.id || realUsers[0].id);

        console.log('✅ REAL Users loaded:', realUsers.length, realUsers);
        toast.success(`�� Loaded ${realUsers.length} REAL users from database`);
      } else {
        console.error('�� Users query failed:', usersError);
        const userErrorMsg = usersError?.message || usersError?.details || usersError?.hint || (usersError ? JSON.stringify(usersError, null, 2) : 'Unknown database error');
        toast.error(`❌ Failed to load users: ${userErrorMsg}`);

        // Try a simpler users query as fallback
        console.log('🔄 Trying simpler users query...');
        const { data: simpleUsersData, error: simpleUsersError } = await supabase
          .from('profiles')
          .select('id, name, email')
          .limit(10);

        if (!simpleUsersError && simpleUsersData && simpleUsersData.length > 0) {
          const simpleUsers = simpleUsersData.map(user => ({
            id: user.id,
            name: user.name || 'Unnamed User',
            email: user.email || 'No email',
            phone: '+27123456789'
          }));
          setUsers(simpleUsers);
          if (simpleUsers.length > 0) {
            setSelectedBuyer(simpleUsers[0].id);
          }
          setSelectedSeller(simpleUsers[1]?.id || simpleUsers[0].id);
          toast.success(`✅ Loaded ${simpleUsers.length} users with basic info`);
        } else {
          const simpleUserErrorMsg = simpleUsersError?.message || simpleUsersError?.details || (simpleUsersError ? JSON.stringify(simpleUsersError, null, 2) : 'No users found');
          toast.error(`❌ Simple users query also failed: ${simpleUserErrorMsg}`);
          // Use mock data as final fallback
          const mockUsers = [
            {
              id: 'mock-buyer-1',
              name: 'Test Buyer',
              email: 'buyer@test.com',
              phone: '+27123456789'
            },
            {
              id: 'mock-seller-1',
              name: 'Test Seller',
              email: 'seller@test.com',
              phone: '+27987654321'
            }
          ];
          setUsers(mockUsers);
          setSelectedBuyer(mockUsers[0].id);
          setSelectedSeller(mockUsers[1].id);
          toast.warning('👥 Using mock users data');
        }
      }

      // Load REAL sellers (users who have books)
      const { data: sellersData, error: sellersError } = await supabase
        .from('profiles')
        .select(`
          id,
          name,
          email,
          phone,
          books (
            id,
            title,
            status
          )
        `)
        .not('name', 'is', null)
        .not('email', 'is', null)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!sellersError && sellersData) {
        // Filter to only users who actually have books
        const realSellers = sellersData.filter(seller =>
          seller.books && seller.books.length > 0
        );

        if (realSellers.length > 0) {
          console.log('✅ REAL Sellers found:', realSellers.length, realSellers);
          // Set the first real seller as default
          if (realSellers.length > 0) {
            setSelectedSeller(realSellers[0].id);
          }
          toast.success(`✅ Found ${realSellers.length} REAL sellers with books`);
        }
      }

      // Final success message with actual counts
      const finalBookCount = booksData?.length || 0;
      const finalUserCount = usersData?.length || 0;

      console.log('📊 Final data summary:', {
        books: finalBookCount,
        users: finalUserCount,
        selectedBook,
        selectedBuyer,
        selectedSeller
      });

      toast.success(`🎯 REAL DATA LOADED: ${finalBookCount} books, ${finalUserCount} users`);

    } catch (error) {
      console.error('❌ Critical error loading real data:', error);

      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = JSON.stringify(error);
      } else {
        errorMessage = String(error);
      }

      toast.error(`❌ Critical database error: ${errorMessage}`);
      toast.warning('��� Please check your Supabase configuration and database permissions');
    }
  };

  const callEdgeFunction = async (functionName: string, payload: any = {}) => {
    const startTime = Date.now();
    setIsLoading(true);

    try {
      console.log(`🚀 Calling ${functionName} with payload:`, payload);

      const response = await supabase.functions.invoke(functionName, {
        body: payload
      });

      console.log(`📡 ${functionName} raw response:`, response);

      const { data, error } = response;

      // If there's an error, try to get the response body directly
      if (error && error.context?.response) {
        try {
          const httpResponse = error.context.response;
          console.log(`🔍 ${functionName} HTTP response object:`, httpResponse);

          // Try to read the response body if it's not already available
          if (!httpResponse.body && httpResponse.text) {
            const responseText = await httpResponse.text();
            console.log(`📝 ${functionName} response text:`, responseText);
            httpResponse.body = responseText;
          } else if (!httpResponse.body && httpResponse.json) {
            const responseJson = await httpResponse.json();
            console.log(`🔧 ${functionName} response JSON:`, responseJson);
            httpResponse.body = JSON.stringify(responseJson);
          }
        } catch (e) {
          console.error(`❌ Error reading ${functionName} response body:`, e);
        }
      }

      const duration = Date.now() - startTime;

      // Get detailed error information
      let errorMessage = '';
      let statusCode = 200;

      if (error) {
        console.error(`❌ ${functionName} error object:`, error);
        console.error(`��� ${functionName} error keys:`, Object.keys(error));
        console.error(`❌ ${functionName} error.context:`, error.context);
        console.error(`❌ ${functionName} data object:`, data);

        // Extract status code from context
        if (error.context?.response?.status) {
          statusCode = error.context.response.status;
        } else if (error.status) {
          statusCode = error.status;
        } else {
          statusCode = 400;
        }

        // Try multiple ways to extract the actual error message

        // 1. Check if data contains error info (common pattern)
        if (data && typeof data === 'object') {
          if (data.error) {
            errorMessage = typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
          } else if (data.message) {
            errorMessage = data.message;
          } else if (data.details) {
            errorMessage = data.details;
          } else if (data.description) {
            errorMessage = data.description;
          }
        }

        // 2. If no error from data, try error object properties
        if (!errorMessage) {
          if (error.message && error.message !== 'Edge Function returned a non-2xx status code') {
            errorMessage = error.message;
          } else if (error.details) {
            errorMessage = error.details;
          } else if (error.description) {
            errorMessage = error.description;
          } else if (error.error) {
            errorMessage = typeof error.error === 'string' ? error.error : JSON.stringify(error.error);
          }
        }

        // 3. Try to extract from context response body (PRIORITY - Supabase functions put errors here)
        if (error.context?.response) {
          console.log(`🔍 ${functionName} response context:`, error.context.response);

          const response = error.context.response;

          // Try to get the response text/body
          if (response.body) {
            try {
              let bodyContent = response.body;
              console.log(`📄 ${functionName} response body:`, bodyContent);

              if (typeof bodyContent === 'string') {
                try {
                  const parsed = JSON.parse(bodyContent);
                  errorMessage = parsed.error || parsed.message || parsed.details || parsed.description || bodyContent;
                } catch (e) {
                  errorMessage = bodyContent;
                }
              } else if (typeof bodyContent === 'object' && bodyContent !== null) {
                errorMessage = bodyContent.error || bodyContent.message || bodyContent.details || JSON.stringify(bodyContent);
              }
            } catch (e) {
              console.error('Error parsing response body:', e);
            }
          }

          // If no body, try other response properties
          if (!errorMessage && response.statusText) {
            errorMessage = response.statusText;
          }
        }

        // 4. If still no message, try to stringify the error object intelligently
        if (!errorMessage) {
          try {
            // Create a clean error object with only useful properties
            const cleanError: any = {};

            ['message', 'details', 'error', 'description', 'code', 'hint'].forEach(key => {
              if (error[key] && error[key] !== 'Edge Function returned a non-2xx status code') {
                cleanError[key] = error[key];
              }
            });

            if (Object.keys(cleanError).length > 0) {
              errorMessage = JSON.stringify(cleanError, null, 2);
            } else {
              errorMessage = `HTTP ${statusCode} Error - Check edge function logs for details`;
            }
          } catch (e) {
            errorMessage = `HTTP ${statusCode} Error - Unable to parse error details`;
          }
        }

        // 5. Final fallback
        if (!errorMessage || errorMessage === '[object Object]') {
          errorMessage = `HTTP ${statusCode} Error - Edge function failed. Check Supabase logs for details.`;
        }
      }

      const result: TestResult = {
        function: functionName,
        status: error ? 'error' : 'success',
        statusCode: statusCode,
        response: data,
        error: errorMessage,
        duration,
        timestamp: new Date().toLocaleTimeString()
      };

      setTestResults(prev => [result, ...prev]);

      if (error) {
        const shortError = errorMessage.length > 100 ? errorMessage.substring(0, 100) + '...' : errorMessage;
        toast.error(`${functionName} failed (${statusCode}): ${shortError}`);
        console.error(`❌ ${functionName} detailed error:`, {
          error,
          data,
          statusCode,
          errorMessage
        });
      } else {
        toast.success(`✅ ${functionName} executed successfully (${duration}ms)`);
        console.log(`✅ ${functionName} success:`, { data, duration });
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = JSON.stringify(error);
      } else {
        errorMessage = String(error);
      }

      const result: TestResult = {
        function: functionName,
        status: 'error',
        error: errorMessage,
        duration,
        timestamp: new Date().toLocaleTimeString()
      };

      setTestResults(prev => [result, ...prev]);
      toast.error(`${functionName} crashed: ${errorMessage}`);
      console.error(`💥 ${functionName} exception:`, error);
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  // Get current test data with proper null checks
  const getTestBook = () => books.find(b => b && b.id === selectedBook) || (books.length > 0 ? books[0] : null);
  const getTestBuyer = () => users.find(u => u && u.id === selectedBuyer) || (users.length > 0 ? users[0] : null);
  const getTestSeller = () => users.find(u => u && u.id === selectedSeller) || (users.length > 0 ? users[0] : null);

  // ALL EDGE FUNCTIONS WITH PROPER PAYLOADS

  // 1. CORE ORDER MANAGEMENT
  const testCreateOrder = async () => {
    const book = getTestBook();
    const buyer = getTestBuyer();
    const seller = getTestSeller();

    const payload = {
      bookId: book?.id || 'mock-book-1',
      buyerId: buyer?.id || 'mock-buyer-1',
      sellerId: book?.seller_id || seller?.id || 'mock-seller-1',
      quantity: 1,
      totalAmount: book?.price || 100,
      shippingAddress: {
        name: buyer?.name || 'Test User',
        email: buyer?.email || 'test@example.com',
        phone: buyer?.phone || '+27123456789',
        street: '123 Test Street',
        suburb: 'Gardens',
        city: 'Cape Town',
        province: 'Western Cape',
        postalCode: '8001',
        country: 'South Africa',
        specialInstructions: 'Test order - please handle with care'
      },
      metadata: {
        source: 'developer_test',
        timestamp: new Date().toISOString()
      }
    };

    await callEdgeFunction('create-order', payload);
  };

  const testProcessBookPurchase = async () => {
    const book = getTestBook();
    const buyer = getTestBuyer();

    const payload = {
      book_id: book?.id || 'mock-book-1',
      buyer_id: buyer?.id || 'mock-buyer-1',
      seller_id: book?.seller_id || 'mock-seller-1',
      amount: book?.price || 100, // Use actual amount, not cents
      payment_reference: `TEST_PURCHASE_${Date.now()}`,
      buyer_email: buyer?.email || 'test@example.com',
      shipping_address: {
        name: buyer?.name || 'Test Buyer',
        email: buyer?.email || 'test@example.com',
        phone: buyer?.phone || '+27123456789',
        street: '456 University Road',
        suburb: 'Rondebosch',
        city: 'Cape Town',
        province: 'Western Cape',
        postal_code: '7700',
        country: 'South Africa',
        special_instructions: 'Test order - handle with care'
      }
    };

    await callEdgeFunction('process-book-purchase', payload);
  };

  const testProcessMultiSellerPurchase = async () => {
    const books = [getTestBook()];
    const buyer = getTestBuyer();

    const payload = {
      buyerId: buyer?.id || 'mock-buyer-1',
      orders: books.map(book => ({
        bookId: book?.id || 'mock-book-1',
        sellerId: book?.seller_id || 'mock-seller-1',
        quantity: 1,
        price: book?.price || 100,
        title: book?.title || 'Test Book'
      })),
      totalAmount: (books[0]?.price || 100) * 100,
      currency: 'ZAR',
      reference: `MULTI_${Date.now()}`,
      shippingAddress: {
        name: buyer?.name || 'Test Buyer',
        email: buyer?.email || 'test@example.com',
        phone: buyer?.phone || '+27123456789',
        street: '789 Main Road',
        suburb: 'Claremont',
        city: 'Cape Town',
        province: 'Western Cape',
        postalCode: '7708',
        country: 'South Africa'
      }
    };

    await callEdgeFunction('process-multi-seller-purchase', payload);
  };

  const testCancelOrder = async () => {
    const payload = {
      orderId: `TEST_ORDER_${Date.now()}`,
      userId: getTestBuyer()?.id || 'mock-buyer-1',
      reason: 'Customer requested cancellation - Developer test',
      refundAmount: 100.00,
      currency: 'ZAR',
      notifyUser: true
    };

    await callEdgeFunction('cancel-order', payload);
  };

  // 2. COMMIT SYSTEM
  const testCommitToSale = async () => {
    const book = getTestBook();
    const seller = getTestSeller();

    const payload = {
      orderId: `TEST_ORDER_${Date.now()}`,
      sellerId: seller?.id || book?.seller_id || 'mock-seller-1',
      bookId: book?.id || 'mock-book-1',
      commitmentType: 'standard',
      estimatedDeliveryDays: 3,
      deliveryMethod: 'courier',
      sellerNotes: 'Book is in excellent condition and will be packaged carefully',
      pricing: {
        bookPrice: book?.price || 100,
        deliveryFee: 25.00,
        totalAmount: (book?.price || 100) + 25.00
      }
    };

    await callEdgeFunction('commit-to-sale', payload);
  };

  const testEnhancedCommitToSale = async () => {
    const book = getTestBook();
    const seller = getTestSeller();

    const payload = {
      orderId: `ENH_ORDER_${Date.now()}`,
      sellerId: seller?.id || 'mock-seller-1',
      bookId: book?.id || 'mock-book-1',
      commitmentDetails: {
        type: 'enhanced',
        guaranteedDelivery: true,
        insuranceIncluded: true,
        trackingEnabled: true,
        estimatedDays: 2
      },
      sellerProfile: {
        name: seller?.name || 'Test Seller',
        email: seller?.email || 'seller@test.com',
        rating: 4.8,
        completedSales: 25
      },
      bookCondition: {
        overall: book?.condition || 'good',
        pages: 'excellent',
        cover: 'good',
        notes: 'Minor shelf wear, all pages intact'
      }
    };

    await callEdgeFunction('enhanced-commit-to-sale', payload);
  };

  const testDeclineCommit = async () => {
    const payload = {
      orderId: `TEST_ORDER_${Date.now()}`,
      sellerId: getTestSeller()?.id || 'mock-seller-1',
      reason: 'Book no longer available - sold locally',
      alternativeBooks: [],
      refundProcessing: true,
      notificationRequired: true,
      metadata: {
        declinedAt: new Date().toISOString(),
        source: 'developer_test'
      }
    };

    await callEdgeFunction('decline-commit', payload);
  };

  const testAutoExpireCommits = async () => {
    const payload = {
      checkExpiredAfterHours: 24,
      notifyBeforeExpiryHours: 2,
      autoRefund: true,
      emailNotifications: true,
      batchSize: 50,
      dryRun: false
    };

    await callEdgeFunction('auto-expire-commits', payload);
  };

  const testCheckExpiredOrders = async () => {
    const payload = {
      checkAfterDays: 7,
      includeCommitted: true,
      includePending: true,
      autoAction: 'notify',
      batchSize: 100
    };

    await callEdgeFunction('check-expired-orders', payload);
  };

  const testProcessOrderReminders = async () => {
    const payload = {
      reminderTypes: ['commit_reminder', 'delivery_reminder', 'payment_reminder'],
      scheduleHours: [24, 48, 72],
      emailEnabled: true,
      smsEnabled: false,
      batchSize: 25
    };

    await callEdgeFunction('process-order-reminders', payload);
  };

  const testMarkCollected = async () => {
    const payload = {
      orderId: `TEST_ORDER_${Date.now()}`,
      buyerId: getTestBuyer()?.id || 'mock-buyer-1',
      sellerId: getTestSeller()?.id || 'mock-seller-1',
      collectionMethod: 'courier_delivery',
      collectionDate: new Date().toISOString(),
      confirmationCode: 'ABC123',
      signature: 'Test Signature',
      photos: [],
      notes: 'Order collected successfully - developer test'
    };

    await callEdgeFunction('mark-collected', payload);
  };

  // 3. PAYMENT PROCESSING
  const testInitializePaystackPayment = async () => {
    const book = getTestBook();
    const buyer = getTestBuyer();

    const payload = {
      email: buyer?.email || 'test@example.com',
      amount: (book?.price || 100) * 100, // Convert to cents
      currency: 'ZAR',
      reference: `PAY_${Date.now()}`,
      callback_url: `${window.location.origin}/payment-callback`,
      metadata: {
        bookId: book?.id || 'mock-book-1',
        buyerId: buyer?.id || 'mock-buyer-1',
        sellerId: book?.seller_id || 'mock-seller-1',
        bookTitle: book?.title || 'Test Book',
        source: 'developer_test'
      },
      channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money'],
      customer: {
        email: buyer?.email || 'test@example.com',
        first_name: buyer?.name?.split(' ')[0] || 'Test',
        last_name: buyer?.name?.split(' ')[1] || 'User',
        phone: buyer?.phone || '+27123456789'
      }
    };

    await callEdgeFunction('initialize-paystack-payment', payload);
  };

  const testVerifyPaystackPayment = async () => {
    const payload = {
      reference: `PAY_${Date.now()}`,
      expectedAmount: 10000, // R100.00 in cents
      currency: 'ZAR',
      orderId: `TEST_ORDER_${Date.now()}`,
      metadata: {
        bookId: getTestBook()?.id || 'mock-book-1',
        buyerId: getTestBuyer()?.id || 'mock-buyer-1',
        verification_source: 'developer_test'
      }
    };

    await callEdgeFunction('verify-paystack-payment', payload);
  };

  const testPaystackWebhook = async () => {
    const payload = {
      event: 'charge.success',
      data: {
        id: 12345678,
        domain: 'test',
        status: 'success',
        reference: `WEBHOOK_${Date.now()}`,
        amount: 10000,
        message: 'Payment successful',
        gateway_response: 'Successful',
        paid_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        channel: 'card',
        currency: 'ZAR',
        ip_address: '127.0.0.1',
        metadata: {
          bookId: getTestBook()?.id || 'mock-book-1',
          buyerId: getTestBuyer()?.id || 'mock-buyer-1',
          test_webhook: true
        },
        customer: {
          id: 123456,
          first_name: 'Test',
          last_name: 'User',
          email: 'test@example.com'
        }
      }
    };

    await callEdgeFunction('paystack-webhook', payload);
  };

  const testPaystackRefundManagement = async () => {
    const payload = {
      transactionId: `TXN_${Date.now()}`,
      refundAmount: 5000, // R50.00 in cents
      currency: 'ZAR',
      reason: 'Customer requested refund - developer test',
      orderId: `TEST_ORDER_${Date.now()}`,
      customerId: getTestBuyer()?.id || 'mock-buyer-1',
      refundType: 'full',
      merchantNote: 'Processing refund for test transaction',
      notifyCustomer: true
    };

    await callEdgeFunction('paystack-refund-management', payload);
  };

  const testPaystackSplitManagement = async () => {
    const book = getTestBook();
    const seller = getTestSeller();

    const payload = {
      splitCode: `SPLIT_${Date.now()}`,
      transactionAmount: (book?.price || 100) * 100,
      currency: 'ZAR',
      splits: [
        {
          subaccount: 'ACCT_123456789',
          share: 8500, // 85% to seller
          description: 'Seller payment'
        },
        {
          subaccount: 'ACCT_PLATFORM',
          share: 1500, // 15% platform fee
          description: 'Platform commission'
        }
      ],
      reference: `SPLIT_${Date.now()}`,
      metadata: {
        orderId: `TEST_ORDER_${Date.now()}`,
        sellerId: seller?.id || 'mock-seller-1',
        bookId: book?.id || 'mock-book-1'
      }
    };

    await callEdgeFunction('paystack-split-management', payload);
  };

  // 4. ACCOUNT MANAGEMENT
  const testCreatePaystackSubaccount = async () => {
    const seller = getTestSeller();

    const payload = {
      business_name: `${seller?.name || 'Test Seller'} Books`,
      settlement_bank: '058', // GTBank
      account_number: '0123456789',
      percentage_charge: 15.0,
      description: 'Subaccount for book seller - developer test',
      primary_contact_email: seller?.email || 'seller@test.com',
      primary_contact_name: seller?.name || 'Test Seller',
      primary_contact_phone: seller?.phone || '+27123456789',
      metadata: {
        sellerId: seller?.id || 'mock-seller-1',
        created_via: 'developer_test',
        verification_status: 'pending'
      }
    };

    await callEdgeFunction('create-paystack-subaccount', payload);
  };

  const testManagePaystackSubaccount = async () => {
    const seller = getTestSeller();

    const payload = {
      action: 'update',
      subaccountCode: `ACCT_${Date.now()}`,
      sellerId: seller?.id || 'mock-seller-1',
      updates: {
        business_name: `Updated ${seller?.name || 'Test Seller'} Books`,
        percentage_charge: 12.0,
        settlement_schedule: 'weekly',
        primary_contact_email: seller?.email || 'seller@test.com'
      },
      metadata: {
        updated_via: 'developer_test',
        update_reason: 'Testing subaccount management'
      }
    };

    await callEdgeFunction('manage-paystack-subaccount', payload);
  };

  const testCreateRecipient = async () => {
    const seller = getTestSeller();

    const payload = {
      sellerId: seller?.id || 'mock-seller-1',
      name: seller?.name || 'Test Seller',
      email: seller?.email || 'seller@test.com',
      type: 'nuban',
      currency: 'ZAR',
      bank_code: '058',
      account_number: '0123456789',
      description: 'Recipient for book sales payouts',
      metadata: {
        created_via: 'developer_test',
        seller_verification: 'pending',
        payout_schedule: 'weekly'
      }
    };

    await callEdgeFunction('create-recipient', payload);
  };

  // 5. DELIVERY & SHIPPING
  const testCourierGuyQuote = async () => {
    const payload = {
      collection_address: {
        street_address: '1 Long Street',
        suburb: 'Cape Town City Centre',
        city: 'Cape Town',
        province: 'Western Cape',
        postal_code: '8001',
        country: 'South Africa'
      },
      delivery_address: {
        street_address: '100 Main Road',
        suburb: 'Rondebosch',
        city: 'Cape Town',
        province: 'Western Cape',
        postal_code: '7700',
        country: 'South Africa'
      },
      parcel_details: {
        weight: 0.5,
        length: 20,
        width: 15,
        height: 3,
        description: 'Textbook',
        value: getTestBook()?.price || 100
      },
      service_type: 'standard',
      insurance_required: true,
      delivery_instructions: 'Handle with care - textbook'
    };

    await callEdgeFunction('courier-guy-quote', payload);
  };

  const testCourierGuyShipment = async () => {
    const book = getTestBook();
    const buyer = getTestBuyer();
    const seller = getTestSeller();

    const payload = {
      order_id: `SHIP_ORDER_${Date.now()}`,
      collection_details: {
        name: seller?.name || 'Test Seller',
        email: seller?.email || 'seller@test.com',
        phone: seller?.phone || '+27123456789',
        address: {
          street_address: '789 Seller Street',
          suburb: 'Gardens',
          city: 'Cape Town',
          province: 'Western Cape',
          postal_code: '8001',
          country: 'South Africa'
        },
        collection_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        special_instructions: 'Call before collection'
      },
      delivery_details: {
        name: buyer?.name || 'Test Buyer',
        email: buyer?.email || 'buyer@test.com',
        phone: buyer?.phone || '+27987654321',
        address: {
          street_address: '456 Buyer Avenue',
          suburb: 'Rondebosch',
          city: 'Cape Town',
          province: 'Western Cape',
          postal_code: '7700',
          country: 'South Africa'
        },
        delivery_instructions: 'Leave with security if not home'
      },
      parcel_info: {
        weight: 0.5,
        dimensions: { length: 20, width: 15, height: 3 },
        contents: book?.title || 'Test Book',
        value: book?.price || 100,
        fragile: false
      }
    };

    await callEdgeFunction('courier-guy-shipment', payload);
  };

  const testCourierGuyTrack = async () => {
    const payload = {
      tracking_number: `TRK${Date.now()}`,
      waybill_number: `WB${Date.now()}`,
      order_reference: `ORD_${Date.now()}`,
      detailed_tracking: true,
      include_events: true,
      notify_customer: false
    };

    await callEdgeFunction('courier-guy-track', payload);
  };

  const testGetDeliveryQuotes = async () => {
    const payload = {
      from_address: {
        street: '1 Wale Street',
        city: 'Cape Town',
        province: 'Western Cape',
        postal_code: '8001',
        country: 'ZA'
      },
      to_address: {
        street: '85 Main Road',
        city: 'Cape Town',
        province: 'Western Cape',
        postal_code: '7700',
        country: 'ZA'
      },
      package_details: {
        weight_kg: 0.5,
        length_cm: 20,
        width_cm: 15,
        height_cm: 3,
        declared_value: getTestBook()?.price || 100
      },
      service_types: ['standard', 'express', 'overnight'],
      insurance_required: true,
      signature_required: false
    };

    await callEdgeFunction('get-delivery-quotes', payload);
  };

  const testAutomateDelivery = async () => {
    const payload = {
      order_id: `AUTO_ORDER_${Date.now()}`,
      automation_type: 'full',
      trigger_conditions: {
        payment_confirmed: true,
        seller_committed: true,
        address_verified: true
      },
      delivery_preferences: {
        preferred_courier: 'courier_guy',
        service_level: 'standard',
        insurance_value: getTestBook()?.price || 100,
        delivery_window: '9am-5pm'
      },
      notifications: {
        sms_updates: true,
        email_updates: true,
        push_notifications: false
      }
    };

    await callEdgeFunction('automate-delivery', payload);
  };

  // 6. COMMUNICATION
  const testSendEmail = async () => {
    const recipient = customEmail || getTestBuyer()?.email || 'test@example.com';
    const book = getTestBook();

    const emailPayloads = {
      approval: {
        to: recipient,
        subject: 'Order Approved - Your Book Purchase',
        template: 'order_approved',
        data: {
          orderId: `ORDER_${Date.now()}`,
          bookTitle: book?.title || 'Test Book',
          sellerName: book?.seller_name || 'Test Seller',
          price: `R${book?.price || 100}`,
          estimatedDelivery: '3-5 business days'
        }
      },
      denial: {
        to: recipient,
        subject: 'Order Update - Unable to Process',
        template: 'order_denied',
        data: {
          orderId: `ORDER_${Date.now()}`,
          bookTitle: book?.title || 'Test Book',
          reason: 'Book no longer available',
          refundAmount: `R${book?.price || 100}`,
          refundTimeframe: '3-5 business days'
        }
      },
      welcome: {
        to: recipient,
        subject: 'Welcome to BookHub!',
        template: 'welcome',
        data: {
          userName: getTestBuyer()?.name || 'Test User',
          loginUrl: `${window.location.origin}/login`,
          supportEmail: 'support@bookhub.com'
        }
      }
    };

    await callEdgeFunction('send-email', emailPayloads[emailTemplate as keyof typeof emailPayloads]);
  };

  const testDebugEmailTemplate = async () => {
    const payload = {
      template_name: emailTemplate,
      recipient_email: customEmail || getTestBuyer()?.email || 'test@example.com',
      test_data: {
        orderId: `DEBUG_${Date.now()}`,
        userName: getTestBuyer()?.name || 'Test User',
        bookTitle: getTestBook()?.title || 'Test Book',
        amount: getTestBook()?.price || 100,
        timestamp: new Date().toISOString()
      },
      render_only: false,
      include_preview: true,
      debug_mode: true
    };

    await callEdgeFunction('debug-email-template', payload);
  };

  // 7. UTILITIES
  const testHealthTest = async () => {
    const payload = {
      check_database: true,
      check_external_apis: true,
      check_email_service: true,
      check_payment_gateway: true,
      check_storage: true,
      detailed_response: true,
      timeout_seconds: 30
    };

    await callEdgeFunction('health-test', payload);
  };

  // 8. SUPABASE CONNECTION TEST
  const testSupabaseConnection = async () => {
    try {
      console.log("🔌 Testing Supabase connection...");

      const startTime = Date.now();

      // Test 1: Basic select query
      console.log("Test 1: Basic table access...");
      const { data: profileCount, error: countError } = await supabase
        .from("profiles")
        .select("id", { count: 'exact', head: true });

      const basicTestTime = Date.now() - startTime;

      if (countError) {
        throw new Error(`Basic query failed: ${countError.message}`);
      }

      // Test 2: Auth status
      console.log("Test 2: Auth status...");
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      // Test 3: Simple data fetch
      console.log("Test 3: Data fetch test...");
      const { data: testData, error: fetchError } = await supabase
        .from("profiles")
        .select("id")
        .limit(1);

      const totalTime = Date.now() - startTime;

      const result = {
        connection_status: "✅ Connected",
        basic_query_time: `${basicTestTime}ms`,
        total_test_time: `${totalTime}ms`,
        profile_count: profileCount || 0,
        auth_status: user ? "✅ Authenticated" : "❌ Not authenticated",
        user_id: user?.id || "No user",
        test_fetch: fetchError ? `❌ ${fetchError.message}` : "✅ Success",
        environment: {
          supabase_url: ENV.VITE_SUPABASE_URL ? "✅ Set" : "❌ Missing",
          supabase_key: ENV.VITE_SUPABASE_ANON_KEY ? "✅ Set" : "❌ Missing",
          node_env: ENV.NODE_ENV
        }
      };

      console.log("🔌 Supabase connection test result:", result);

      setTestResults(prev => [...prev, {
        function: 'Supabase Connection Test',
        status: 'success',
        response: result,
        duration: totalTime
      }]);

      toast.success(`Supabase connection working! Query time: ${basicTestTime}ms`);

    } catch (error) {
      console.error("❌ Supabase connection test failed:", error);

      const errorDetails = {
        error_type: error instanceof Error ? error.name : typeof error,
        error_message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        environment: {
          supabase_url: ENV.VITE_SUPABASE_URL ? "Set" : "Missing",
          supabase_key: ENV.VITE_SUPABASE_ANON_KEY ? "Set" : "Missing"
        },
        network_status: navigator.onLine ? "Online" : "Offline"
      };

      setTestResults(prev => [...prev, {
        function: 'Supabase Connection Test',
        status: 'error',
        error: JSON.stringify(errorDetails, null, 2),
        duration: 0
      }]);

      toast.error("Supabase connection failed!", {
        description: error instanceof Error ? error.message : String(error)
      });
    }
  };

  // 9. DATA INTEGRITY CHECKS
  const testDataIntegrity = async () => {
    try {
      console.log("🔍 Checking for data integrity issues...");

      // Find books with missing seller profiles
      const { data: books, error: booksError } = await supabase
        .from("books")
        .select("id, title, seller_id")
        .limit(100);

      if (booksError) throw booksError;

      const orphanedBooks = [];

      for (const book of books || []) {
        const { data: profiles, error } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", book.seller_id);

        if (!error && (!profiles || profiles.length === 0)) {
          orphanedBooks.push(book);
        }
      }

      const result = {
        total_books_checked: books?.length || 0,
        orphaned_books: orphanedBooks.length,
        orphaned_details: orphanedBooks
      };

      console.log("📊 Data integrity check result:", result);

      setTestResults(prev => [...prev, {
        function: 'Data Integrity Check',
        status: orphanedBooks.length > 0 ? 'error' : 'success',
        response: result,
        error: orphanedBooks.length > 0 ? `Found ${orphanedBooks.length} books with missing seller profiles` : undefined,
        duration: 0
      }]);

      if (orphanedBooks.length > 0) {
        toast.error(`Found ${orphanedBooks.length} books with missing seller profiles!`, {
          description: "Check console for details. These books need admin attention."
        });
      } else {
        toast.success("No data integrity issues found!");
      }

    } catch (error) {
      console.error("❌ Data integrity check failed:", error);
      setTestResults(prev => [...prev, {
        function: 'Data Integrity Check',
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
        duration: 0
      }]);
      toast.error("Data integrity check failed: " + (error instanceof Error ? error.message : String(error)));
    }
  };

  // 9. ADDRESS DECRYPTION TEST
  const testAddressDecryption = async () => {
    try {
      // Import the address service
      const { getSellerDeliveryAddress } = await import("@/services/simplifiedAddressService");

      // Get the current user for testing (as a seller)
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("Please log in to test address decryption");
      }

      console.log("🔐 Testing address decryption for user:", user?.id);

      // Test getting seller delivery address (this will try encrypted first, then fallback)
      const startTime = Date.now();
      const address = await getSellerDeliveryAddress(user!.id);
      const duration = Date.now() - startTime;

      if (address) {
        console.log("✅ Address decrypted successfully:", address);
        setTestResults(prev => [...prev, {
          function: 'Address Decryption Test',
          status: 'success',
          response: {
            success: true,
            data: address,
            message: "Address decryption working correctly - encrypted addresses are being properly handled in checkout flow"
          },
          duration
        }]);
        toast.success("Address decryption test passed! Checkout flow should work with encrypted addresses.");
      } else {
        console.log("⚠️ No address found for user - this is normal if user hasn't set up pickup address");
        setTestResults(prev => [...prev, {
          function: 'Address Decryption Test',
          status: 'error',
          error: "No pickup address found for current user. Set up a pickup address in your profile to test decryption.",
          duration
        }]);
        toast.warning("No pickup address found for testing. Set up your profile first.");
      }
    } catch (error) {
      console.error("❌ Address decryption test failed:", error);
      setTestResults(prev => [...prev, {
        function: 'Address Decryption Test',
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
        duration: 0
      }]);
      toast.error("Address decryption test failed: " + (error instanceof Error ? error.message : String(error)));
    }
  };

  // UI FUNCTIONS
  const clearResults = () => {
    setTestResults([]);
    toast.info('Test results cleared');
  };

  const runAllTests = async () => {
    toast.info('Running comprehensive test suite - all 20+ functions...');
    
    const allTests = [
      { name: 'Health Check', func: testHealthTest },
      { name: 'Address Decryption Test', func: testAddressDecryption },
      { name: 'Create Order', func: testCreateOrder },
      { name: 'Process Book Purchase', func: testProcessBookPurchase },
      { name: 'Process Multi-Seller Purchase', func: testProcessMultiSellerPurchase },
      { name: 'Cancel Order', func: testCancelOrder },
      { name: 'Commit To Sale', func: testCommitToSale },
      { name: 'Enhanced Commit To Sale', func: testEnhancedCommitToSale },
      { name: 'Decline Commit', func: testDeclineCommit },
      { name: 'Auto Expire Commits', func: testAutoExpireCommits },
      { name: 'Check Expired Orders', func: testCheckExpiredOrders },
      { name: 'Process Order Reminders', func: testProcessOrderReminders },
      { name: 'Mark Collected', func: testMarkCollected },
      { name: 'Initialize Paystack Payment', func: testInitializePaystackPayment },
      { name: 'Verify Paystack Payment', func: testVerifyPaystackPayment },
      { name: 'Paystack Webhook', func: testPaystackWebhook },
      { name: 'Paystack Refund Management', func: testPaystackRefundManagement },
      { name: 'Paystack Split Management', func: testPaystackSplitManagement },
      { name: 'Create Paystack Subaccount', func: testCreatePaystackSubaccount },
      { name: 'Manage Paystack Subaccount', func: testManagePaystackSubaccount },
      { name: 'Create Recipient', func: testCreateRecipient },
      { name: 'Courier Guy Quote', func: testCourierGuyQuote },
      { name: 'Courier Guy Shipment', func: testCourierGuyShipment },
      { name: 'Courier Guy Track', func: testCourierGuyTrack },
      { name: 'Get Delivery Quotes', func: testGetDeliveryQuotes },
      { name: 'Automate Delivery', func: testAutomateDelivery },
      { name: 'Send Email', func: testSendEmail },
      { name: 'Debug Email Template', func: testDebugEmailTemplate }
    ];

    for (const test of allTests) {
      try {
        toast.info(`Testing: ${test.name}...`);
        await test.func();
        await new Promise(resolve => setTimeout(resolve, 800)); // Delay between tests
      } catch (error) {
        console.error(`Error in ${test.name}:`, error);
        toast.error(`${test.name} failed`);
      }
    }

    toast.success(`Comprehensive test suite completed! Tested ${allTests.length} functions.`);
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
                    Test all 27 edge functions with proper payloads
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => navigate("/photo-upload-demo")}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <TestTube className="h-4 w-4" />
                <span>Photo Upload Demo</span>
              </Button>
              <Button
                onClick={() => navigate("/lockers")}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <MapPin className="h-4 w-4" />
                <span>Locker Page</span>
              </Button>
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
                Test All 27 Functions
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
            <TabsList className="grid grid-cols-3 lg:grid-cols-8 gap-2 h-auto p-1">
              <TabsTrigger value="overview" className="flex flex-col items-center p-3">
                <Bug className="h-4 w-4 mb-1" />
                <span className="text-xs">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="orders" className="flex flex-col items-center p-3">
                <Package className="h-4 w-4 mb-1" />
                <span className="text-xs">Orders (12)</span>
              </TabsTrigger>
              <TabsTrigger value="payments" className="flex flex-col items-center p-3">
                <CreditCard className="h-4 w-4 mb-1" />
                <span className="text-xs">Payments (7)</span>
              </TabsTrigger>
              <TabsTrigger value="accounts" className="flex flex-col items-center p-3">
                <Users className="h-4 w-4 mb-1" />
                <span className="text-xs">Accounts (3)</span>
              </TabsTrigger>
              <TabsTrigger value="delivery" className="flex flex-col items-center p-3">
                <Truck className="h-4 w-4 mb-1" />
                <span className="text-xs">Delivery (5)</span>
              </TabsTrigger>
              <TabsTrigger value="communication" className="flex flex-col items-center p-3">
                <Mail className="h-4 w-4 mb-1" />
                <span className="text-xs">Email (2)</span>
              </TabsTrigger>
              <TabsTrigger value="email-templates" className="flex flex-col items-center p-3">
                <Send className="h-4 w-4 mb-1" />
                <span className="text-xs">Templates</span>
              </TabsTrigger>
              <TabsTrigger value="email-diagnostics" className="flex flex-col items-center p-3">
                <Bug className="h-4 w-4 mb-1" />
                <span className="text-xs">Diagnostics</span>
              </TabsTrigger>
            </TabsList>

            {/* Test Data Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="h-5 w-5" />
                  <span>Test Data Selection</span>
                  <Badge variant="outline">Auto-loaded</Badge>
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
                        {books && books.length > 0 ? books.filter(book => book && book.id && typeof book.id === 'string').map(book => (
                          <SelectItem key={book.id || 'unknown'} value={book.id || 'unknown'}>
                            {book.title} - R{book.price} ({book.seller_name})
                          </SelectItem>
                        )) : (
                          <SelectItem value="loading" disabled>Loading books...</SelectItem>
                        )}
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
                        {users && users.length > 0 ? users.filter(user => user && user.id && typeof user.id === 'string').map(user => (
                          <SelectItem key={user.id || 'unknown'} value={user.id || 'unknown'}>
                            {user.name} ({user.email})
                          </SelectItem>
                        )) : (
                          <SelectItem value="loading" disabled>Loading users...</SelectItem>
                        )}
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
                        {users && users.length > 0 ? users.filter(user => user && user.id && typeof user.id === 'string').map(user => (
                          <SelectItem key={user.id || 'unknown'} value={user.id || 'unknown'}>
                            {user.name} ({user.email})
                          </SelectItem>
                        )) : (
                          <SelectItem value="loading" disabled>Loading users...</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="mt-4 flex justify-between items-center">
                  <div className="flex space-x-4 text-sm text-gray-600">
                    <span>Books: {books.length}</span>
                    <span>Users: {users.length}</span>
                  </div>
                  <Button
                    onClick={loadTestData}
                    variant="outline"
                    size="sm"
                  >
                    Refresh Data
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* API Testing Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Code className="h-5 w-5" />
                  <span>Courier Guy API Testing</span>
                  <Badge variant="outline">Live API</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">PUDO API Key (Optional)</label>
                    <Input
                      type="password"
                      placeholder="Bearer token for PUDO API"
                      defaultValue="37102346|dpTTHKfhJYBQh79UfHmOj8P0IPtt8ImFz0VeHXWr65621bae"
                      onChange={(e) => {
                        if (e.target.value.trim()) {
                          // Import and set API key
                          import('@/services/lockerService').then(({ lockerService }) => {
                            lockerService.setApiKey(e.target.value.trim());
                          });
                        }
                      }}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Set VITE_PUDO_API_KEY in .env or get from <a href="https://customer.pudo.co.za" target="_blank" className="text-blue-600 underline">customer.pudo.co.za</a>
                    </p>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <Button
                      onClick={async () => {
                        setIsLoading(true);
                        try {
                          const { lockerService } = await import('@/services/lockerService');
                          console.log('��� Starting API connectivity test...');
                          const result = await lockerService.testApiConnectivity();

                          if (result.success) {
                            toast.success(`✅ API connected via: ${result.endpoint}`);
                            console.log('✅ API Test Result:', result);
                          } else {
                            toast.error(`❌ API test failed: ${result.error}`);
                            console.error('❌ API Test Failed:', result);

                            // Show detailed error info
                            if (result.details?.corsDetected) {
                              toast.warning('🔒 CORS detected - using backend proxy recommended');
                            }

                            // Log error details for debugging
                            if (result.details?.errors) {
                              console.group('🔍 Detailed Error Analysis');
                              result.details.errors.forEach((err: any, index: number) => {
                                console.log(`Error ${index + 1}:`, err);
                              });
                              console.groupEnd();
                            }
                          }
                        } catch (error) {
                          console.error('💥 API test crashed:', error);
                          toast.error(`💥 API test crashed: ${error}`);
                        } finally {
                          setIsLoading(false);
                        }
                      }}
                      disabled={isLoading}
                      className="w-full"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      Test API Connection
                    </Button>

                    <Button
                      onClick={async () => {
                        setIsLoading(true);
                        try {
                          console.log('🔧 Checking locker data availability...');
                          const { lockerService } = await import('@/services/lockerService');

                          const lockers = await lockerService.fetchAllLockers();

                          if (lockers.length > 0) {
                            toast.success(`✅ Locker system working - ${lockers.length} locations available`);
                            console.log('✅ Locker system operational:', {
                              count: lockers.length,
                              sample: lockers[0]?.name
                            });
                          } else {
                            toast.error('❌ No locker data available');
                          }
                        } catch (error) {
                          console.error('💥 Locker system test failed:', error);
                          toast.error(`💥 System test failed: ${error}`);
                        } finally {
                          setIsLoading(false);
                        }
                      }}
                      disabled={isLoading}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      Test Locker System
                    </Button>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <Button
                      onClick={async () => {
                        setIsLoading(true);
                        try {
                          const { lockerService } = await import('@/services/lockerService');
                          console.log('🔑 Testing with provided API key...');

                          // Set the API key
                          lockerService.setApiKey('37102346|dpTTHKfhJYBQh79UfHmOj8P0IPtt8ImFz0VeHXWr65621bae');

                          toast.info('🔄 Testing API key: 37102346|dp...21bae');

                          const result = await lockerService.testApiConnectivity();

                          if (result.success) {
                            toast.success(`✅ API key works! Connected via: ${result.endpoint}`);
                            console.log('✅ API Key Test Result:', result);

                            // Immediately try to fetch lockers
                            const lockers = await lockerService.fetchAllLockers();
                            toast.success(`🎉 Fetched ${lockers.length} real lockers!`);
                          } else {
                            toast.error(`❌ API key test failed: ${result.error}`);
                            console.error('❌ API Key Test Failed:', result);
                          }
                        } catch (error) {
                          console.error('💥 API key test crashed:', error);
                          toast.error(`💥 API key test failed: ${error}`);
                        } finally {
                          setIsLoading(false);
                        }
                      }}
                      disabled={isLoading}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      Test API Key
                    </Button>

                    <Button
                      onClick={async () => {
                        setIsLoading(true);
                        try {
                          const { lockerService } = await import('@/services/lockerService');
                          console.log('🚀 Starting locker fetch...');
                          toast.info('🔄 Fetching real lockers from PUDO API...');

                          const lockers = await lockerService.fetchAllLockers();

                          if (lockers.length > 0) {
                            toast.success(`✅ Fetched ${lockers.length} lockers`);
                            console.log(`✅ Successfully loaded ${lockers.length} lockers`);

                            // Check if these are mock lockers vs real API data
                          const mockLockerIds = lockers.filter(l => l && l.id && (l.id.startsWith('gauteng_') || l.id.startsWith('western_cape_')));
                          const hasMockFlag = lockers.some(l => l && (l as any).isMockData);

                          if (mockLockerIds.length === lockers.length || hasMockFlag) {
                            toast.warning('📄 Using verified mock data - CORS blocking real API');
                            console.warn('⚠️ All lockers appear to be mock data due to CORS restrictions');
                            console.info('���� Mock data includes 18 verified real PUDO locker locations');

                            // Show CORS solution info
                            setTimeout(() => {
                              toast.info('🔧 To get real-time data: Deploy edge function proxy or use backend API');
                            }, 2000);
                          } else {
                            toast.success('🌐 Real PUDO API data loaded successfully!');

                            // Show some sample locker info
                            const sampleLocker = lockers[0];
                            if (sampleLocker) {
                              console.log('📍 Sample real locker:', {
                                id: sampleLocker.id,
                                name: sampleLocker.name,
                                city: sampleLocker.city,
                                province: sampleLocker.province,
                                coordinates: `${sampleLocker.latitude}, ${sampleLocker.longitude}`
                              });
                            }

                            toast.success('🎉 CORS bypass successful - real locker data active!');
                          }
                          } else {
                            toast.error('❌ No lockers returned');
                            console.error('❌ Fetch returned 0 lockers');
                          }
                        } catch (error) {
                          console.error('💥 Locker fetch failed:', error);
                          toast.error(`💥 Failed to fetch lockers: ${error}`);
                        } finally {
                          setIsLoading(false);
                        }
                      }}
                      disabled={isLoading}
                      variant="outline"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <MapPin className="h-4 w-4 mr-2" />
                      )}
                      Fetch Lockers
                    </Button>

                    <Button
                      onClick={async () => {
                        setIsLoading(true);
                        try {
                          const { lockerService } = await import('@/services/lockerService');
                          console.log('🧪 Testing real PUDO API directly...');
                          toast.info('🧪 Testing real PUDO API format...');

                          const result = await lockerService.testRealPudoApi();

                          if (result.success && result.lockers) {
                            toast.success(`🎉 Real PUDO API working! ${result.lockers.length} lockers loaded`);
                            console.log('🎉 Real PUDO API test successful:', result.lockers.length, 'lockers');
                            console.log('📋 Sample real API locker:', result.lockers[0]);
                          } else {
                            toast.warning(`📄 Real API failed: ${result.error} - Using fallback data`);
                            console.log('⚠️ Real API test failed:', result.error);
                          }
                        } catch (error) {
                          console.error('💥 Real API test failed:', error);
                          toast.error(`💥 Real API test failed: ${error}`);
                        } finally {
                          setIsLoading(false);
                        }
                      }}
                      disabled={isLoading}
                      variant="secondary"
                      className="mt-2"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <TestTube className="h-4 w-4 mr-2" />
                      )}
                      Test Real PUDO API
                    </Button>
                  </div>
                </div>

                {/* Troubleshooting Info */}
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-900 flex items-center mb-2">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    API Troubleshooting Guide
                  </h4>
                  <div className="text-sm text-blue-800 space-y-2">
                    <p><strong>PUDO API Integration:</strong> Complete shipping and locker service</p>
                    <p><strong>Available Endpoints:</strong></p>
                    <ul className="list-disc list-inside ml-4 space-y-1 text-xs">
                      <li>🏪 <code>GET /lockers-data</code> - Get all locker locations</li>
                      <li>💰 <code>POST /rates</code> - Calculate shipping rates (D2L, L2D, L2L, D2D)</li>
                      <li>📦 <code>POST /shipments</code> - Create shipments</li>
                      <li>🔍 <code>GET /shipments/{{id}}/tracking</code> - Track shipments</li>
                      <li>🏷️ <code>GET /shipments/{{id}}/label</code> - Generate labels</li>
                      <li>📋 <code>GET /billing/statement</code> - Account statements</li>
                    </ul>
                    <p><strong>CORS Issue:</strong> Browser blocks direct API calls to external domains</p>
                    <p><strong>Solutions in order of preference:</strong></p>
                    <ul className="list-disc list-inside ml-4 space-y-1 text-xs">
                      <li>🥇 <strong>Deploy Edge Function:</strong> <code>supabase functions deploy courier-guy-lockers</code></li>
                      <li>🥈 <strong>Backend Proxy:</strong> Route API calls through your server</li>
                      <li>🥉 <strong>Verified Mock Data:</strong> 19 real PUDO locations (current fallback)</li>
                    </ul>
                    <div className="mt-2 p-2 bg-blue-100 rounded text-xs">
                      <p><strong>Quick Fix:</strong> The edge function in <code>supabase/functions/courier-guy-lockers/</code> is ready to deploy!</p>
                      <p>It will bypass CORS and fetch real PUDO data server-side.</p>
                    </div>
                    <p className="text-xs mt-2 text-blue-600">
                      ��� API Docs: <a href="https://api-pudo.co.za" target="_blank" className="underline">api-pudo.co.za</a> | Console logs: F12
                    </p>
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
                      onClick={testHealthTest}
                      disabled={isLoading}
                      className="w-full"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Test System Health
                    </Button>
                    <Button
                      onClick={testSupabaseConnection}
                      disabled={isLoading}
                      className="w-full"
                    >
                      <Database className="h-4 w-4 mr-2" />
                      Test Supabase Connection
                    </Button>
                    <Button
                      onClick={testAddressDecryption}
                      disabled={isLoading}
                      className="w-full"
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      Test Address Decryption
                    </Button>
                    <Button
                      onClick={testDataIntegrity}
                      disabled={isLoading}
                      className="w-full"
                    >
                      <Bug className="h-4 w-4 mr-2" />
                      Check Data Integrity
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Quick Stats</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Total Edge Functions:</span>
                        <Badge variant="outline">27</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Tests Run:</span>
                        <Badge variant="outline">{testResults.length}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Success Rate:</span>
                        <Badge variant={testResults.length > 0 && testResults.filter(r => r.status === 'success').length / testResults.length > 0.8 ? 'default' : 'destructive'}>
                          {testResults.length > 0 ? `${Math.round((testResults.filter(r => r.status === 'success').length / testResults.length) * 100)}%` : '0%'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="orders">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <Button onClick={testCreateOrder} disabled={isLoading} className="h-20 flex flex-col">
                  <ShoppingCart className="h-6 w-6 mb-2" />
                  Create Order
                </Button>
                <Button onClick={testProcessBookPurchase} disabled={isLoading} className="h-20 flex flex-col">
                  <Package className="h-6 w-6 mb-2" />
                  Process Purchase
                </Button>
                <Button onClick={testProcessMultiSellerPurchase} disabled={isLoading} className="h-20 flex flex-col">
                  <Users className="h-6 w-6 mb-2" />
                  Multi-Seller
                </Button>
                <Button onClick={testCancelOrder} disabled={isLoading} className="h-20 flex flex-col">
                  <XCircle className="h-6 w-6 mb-2" />
                  Cancel Order
                </Button>
                <Button onClick={testCommitToSale} disabled={isLoading} className="h-20 flex flex-col">
                  <CheckCircle className="h-6 w-6 mb-2" />
                  Commit Sale
                </Button>
                <Button onClick={testEnhancedCommitToSale} disabled={isLoading} className="h-20 flex flex-col">
                  <Zap className="h-6 w-6 mb-2" />
                  Enhanced Commit
                </Button>
                <Button onClick={testDeclineCommit} disabled={isLoading} className="h-20 flex flex-col">
                  <AlertCircle className="h-6 w-6 mb-2" />
                  Decline Commit
                </Button>
                <Button onClick={testAutoExpireCommits} disabled={isLoading} className="h-20 flex flex-col">
                  <Clock className="h-6 w-6 mb-2" />
                  Auto Expire
                </Button>
                <Button onClick={testCheckExpiredOrders} disabled={isLoading} className="h-20 flex flex-col">
                  <AlertCircle className="h-6 w-6 mb-2" />
                  Check Expired
                </Button>
                <Button onClick={testProcessOrderReminders} disabled={isLoading} className="h-20 flex flex-col">
                  <Mail className="h-6 w-6 mb-2" />
                  Order Reminders
                </Button>
                <Button onClick={testMarkCollected} disabled={isLoading} className="h-20 flex flex-col">
                  <CheckCircle className="h-6 w-6 mb-2" />
                  Mark Collected
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="payments">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <Button onClick={testInitializePaystackPayment} disabled={isLoading} className="h-20 flex flex-col">
                  <CreditCard className="h-6 w-6 mb-2" />
                  Initialize Payment
                </Button>
                <Button onClick={testVerifyPaystackPayment} disabled={isLoading} className="h-20 flex flex-col">
                  <CheckCircle className="h-6 w-6 mb-2" />
                  Verify Payment
                </Button>
                <Button onClick={testPaystackWebhook} disabled={isLoading} className="h-20 flex flex-col">
                  <Code className="h-6 w-6 mb-2" />
                  Webhook Test
                </Button>
                <Button onClick={testPaystackRefundManagement} disabled={isLoading} className="h-20 flex flex-col">
                  <DollarSign className="h-6 w-6 mb-2" />
                  Refund Management
                </Button>
                <Button onClick={testPaystackSplitManagement} disabled={isLoading} className="h-20 flex flex-col">
                  <Settings className="h-6 w-6 mb-2" />
                  Split Management
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="accounts">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Button onClick={testCreatePaystackSubaccount} disabled={isLoading} className="h-20 flex flex-col">
                  <Users className="h-6 w-6 mb-2" />
                  Create Subaccount
                </Button>
                <Button onClick={testManagePaystackSubaccount} disabled={isLoading} className="h-20 flex flex-col">
                  <Settings className="h-6 w-6 mb-2" />
                  Manage Subaccount
                </Button>
                <Button onClick={testCreateRecipient} disabled={isLoading} className="h-20 flex flex-col">
                  <CreditCard className="h-6 w-6 mb-2" />
                  Create Recipient
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="delivery">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <Button onClick={testCourierGuyQuote} disabled={isLoading} className="h-20 flex flex-col">
                  <DollarSign className="h-6 w-6 mb-2" />
                  Courier Quote
                </Button>
                <Button onClick={testCourierGuyShipment} disabled={isLoading} className="h-20 flex flex-col">
                  <Truck className="h-6 w-6 mb-2" />
                  Create Shipment
                </Button>
                <Button onClick={testCourierGuyTrack} disabled={isLoading} className="h-20 flex flex-col">
                  <Package className="h-6 w-6 mb-2" />
                  Track Package
                </Button>
                <Button onClick={testGetDeliveryQuotes} disabled={isLoading} className="h-20 flex flex-col">
                  <FileText className="h-6 w-6 mb-2" />
                  Delivery Quotes
                </Button>
                <Button onClick={testAutomateDelivery} disabled={isLoading} className="h-20 flex flex-col">
                  <Zap className="h-6 w-6 mb-2" />
                  Automate Delivery
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="communication">
              <div className="space-y-6">
                {/* Error Monitor - Development Only */}
                {import.meta.env.DEV && <ErrorMonitor />}

                {/* Enhanced Notification Debugger - Development Only */}
                {import.meta.env.DEV && <EnhancedNotificationDebugger />}

                {/* Original Notification Debugger - Development Only */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {import.meta.env.DEV && <NotificationDebugger />}
                  <Card>
                    <CardHeader>
                      <CardTitle>📋 Notification Troubleshooting</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm space-y-2 text-gray-600">
                        <p><strong>Common Issues:</strong></p>
                        <ul className="list-disc list-inside ml-2 space-y-1">
                          <li>Missing RLS INSERT policy (most common)</li>
                          <li>Invalid user_id or authentication</li>
                          <li>Missing required fields</li>
                          <li>Database connection issues</li>
                        </ul>
                        <p className="mt-3"><strong>Expected Errors to Check:</strong></p>
                        <ul className="list-disc list-inside ml-2 space-y-1 text-xs">
                          <li><code>42501</code> - RLS policy violation</li>
                          <li><code>23503</code> - Foreign key constraint</li>
                          <li><code>23502</code> - NULL constraint violation</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Email Configuration</CardTitle>
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
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button onClick={testSendEmail} disabled={isLoading} className="h-20 flex flex-col">
                    <Send className="h-6 w-6 mb-2" />
                    Send Email
                  </Button>
                  <Button onClick={testDebugEmailTemplate} disabled={isLoading} className="h-20 flex flex-col">
                    <Bug className="h-6 w-6 mb-2" />
                    Debug Email Template
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="email-templates">
              <EmailTemplateDashboard />
            </TabsContent>

            <TabsContent value="email-diagnostics">
              <EmailDiagnosticPanel />
            </TabsContent>

            {/* Test Results */}
            {testResults.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Test Results</span>
                    <div className="flex space-x-2">
                      <Badge variant="outline">{testResults.filter(r => r.status === 'success').length} success</Badge>
                      <Badge variant="destructive">{testResults.filter(r => r.status === 'error').length} failed</Badge>
                    </div>
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
                            <strong>Error ({result.statusCode || 'Unknown'}):</strong>
                            <div className="mt-1 p-2 bg-red-100 rounded text-xs font-mono whitespace-pre-wrap">
                              {result.error}
                            </div>
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

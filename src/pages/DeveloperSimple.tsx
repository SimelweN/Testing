import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Code, ArrowLeft, AlertCircle, Play, User, DollarSign, CheckCircle, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface RealSeller {
  id: string;
  name: string;
  email: string;
  orders: number;
  has_banking: boolean;
  banking_status?: string;
  business_name?: string;
  bank_name?: string;
  account_number?: string;
}

interface PayoutResponse {
  success: boolean;
  recipient_code?: string;
  message: string;
  payment_breakdown?: {
    total_orders: number;
    seller_amount: number;
    platform_earnings: {
      total: number;
    };
  };
  seller_info?: {
    name: string;
    email: string;
    account_number: string;
    bank_name: string;
  };
}

const Developer = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState<string>("");
  const [realSellers, setRealSellers] = useState<RealSeller[]>([]);
  const [loadingSellers, setLoadingSellers] = useState(false);
  const [payoutResponse, setPayoutResponse] = useState<PayoutResponse | null>(null);
  const [payoutLoading, setPayoutLoading] = useState(false);

  const loadSellers = async () => {
    setLoadingSellers(true);
    try {
      console.log('Loading sellers with banking details...');

      // Check environment variables
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        throw new Error('Supabase environment variables not configured');
      }

      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY
      );

      // Get active banking subaccounts
      const { data: bankingAccounts, error: bankingError } = await supabase
        .from('banking_subaccounts')
        .select('user_id, business_name, email, status, bank_name, account_number')
        .eq('status', 'active');

      if (bankingError) {
        console.warn('Banking query error:', bankingError);
        throw new Error(`Banking query failed: ${bankingError.message || 'Database error'}`);
      }

      if (!bankingAccounts || bankingAccounts.length === 0) {
        console.log('No banking accounts found, using demo sellers');
        setRealSellers([
          {
            id: "demo_seller_001",
            name: "Demo Seller 1",
            email: "demo1@example.com",
            orders: 2,
            has_banking: true,
            banking_status: 'active',
            business_name: 'Demo Business 1',
            bank_name: 'Demo Bank',
            account_number: '****DEMO'
          },
          {
            id: "demo_seller_002",
            name: "Demo Seller 2",
            email: "demo2@example.com",
            orders: 1,
            has_banking: true,
            banking_status: 'active',
            business_name: 'Demo Business 2',
            bank_name: 'Demo Bank',
            account_number: '****TEST'
          }
        ]);
        toast.info('Using demo sellers (no real banking accounts found)');
        return;
      }

      // Check orders for each seller
      const sellersWithOrders = await Promise.all(
        bankingAccounts.map(async (banking) => {
          try {
            const { data: orders, error: ordersError } = await supabase
              .from('orders')
              .select('seller_id, delivery_status, status')
              .eq('seller_id', banking.user_id)
              .eq('delivery_status', 'delivered')
              .eq('status', 'delivered');

            if (ordersError) {
              console.warn(`Orders query error for ${banking.user_id}:`, ordersError);
              return null;
            }

            return {
              id: banking.user_id,
              name: banking.business_name || `Seller ${banking.user_id}`,
              email: banking.email,
              orders: orders?.length || 0,
              has_banking: true,
              banking_status: banking.status,
              business_name: banking.business_name,
              bank_name: banking.bank_name,
              account_number: banking.account_number ? `****${banking.account_number.slice(-4)}` : 'Hidden'
            };
          } catch (error) {
            console.error(`Error checking orders for ${banking.user_id}:`, error);
            return null;
          }
        })
      );

      const validSellers = sellersWithOrders
        .filter(seller => seller !== null && seller.orders > 0)
        .sort((a, b) => b.orders - a.orders);

      setRealSellers(validSellers);

      if (validSellers.length === 0) {
        toast.warning('No sellers with delivered orders found');
      } else {
        toast.success(`Found ${validSellers.length} eligible sellers`);
      }

    } catch (error) {
      console.error('Error loading sellers:', error);
      toast.error(`Failed to load sellers: ${error instanceof Error ? error.message : 'Unknown error'}`);

      // Fallback to demo sellers
      setRealSellers([
        {
          id: "demo_seller_001",
          name: "Demo Seller 1 (DB Error)",
          email: "demo1@example.com",
          orders: 2,
          has_banking: true,
          banking_status: 'active'
        }
      ]);
    } finally {
      setLoadingSellers(false);
    }
  };

  const testPayoutFunction = async () => {
    if (!selectedSeller) {
      toast.error('Please select a seller first');
      return;
    }

    setPayoutLoading(true);
    setPayoutResponse(null);

    try {
      const selectedSellerData = realSellers.find(s => s.id === selectedSeller);
      console.log('Testing payout function for:', selectedSellerData);

      // Check if demo seller
      if (selectedSeller.startsWith('demo_seller_')) {
        // Simulate payout function
        await new Promise(resolve => setTimeout(resolve, 2000));

        const demoResponse: PayoutResponse = {
          success: true,
          recipient_code: `DEMO_RCP_${Date.now()}`,
          message: "Demo recipient created successfully (Simulation)",
          payment_breakdown: {
            total_orders: selectedSellerData?.orders || 1,
            seller_amount: (selectedSellerData?.orders || 1) * 180.00,
            platform_earnings: {
              total: (selectedSellerData?.orders || 1) * 45.00
            }
          },
          seller_info: {
            name: selectedSellerData?.name || 'Demo Seller',
            email: selectedSellerData?.email || 'demo@example.com',
            account_number: '****DEMO',
            bank_name: 'Demo Bank'
          }
        };

        setPayoutResponse(demoResponse);
        toast.success('Demo payout function executed successfully!');
        return;
      }

      // Real function call
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pay-seller`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ sellerId: selectedSeller }),
      });

      const responseText = await response.text();
      console.log('Payout function response:', responseText);

      const result = responseText ? JSON.parse(responseText) : {};

      if (!response.ok) {
        throw new Error(result?.error || `HTTP ${response.status}`);
      }

      if (result.success) {
        setPayoutResponse(result);
        toast.success('Real payout function executed successfully!');
      } else {
        throw new Error(result.error || 'Function returned unsuccessful result');
      }

    } catch (error) {
      console.error('Error testing payout function:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Payout function failed: ${errorMessage}`);

      setPayoutResponse({
        success: false,
        message: `Error: ${errorMessage}`
      });
    } finally {
      setPayoutLoading(false);
    }
  };

  useEffect(() => {
    console.log('Developer component mounted successfully');
    toast.success('Developer Dashboard loaded');
    loadSellers();
  }, []);

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
                <div className="p-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg">
                  <Code className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Developer Dashboard
                  </h1>
                  <p className="text-sm text-gray-500">
                    Test and debug system functions
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Basic Test Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Code className="h-5 w-5 text-purple-600" />
                <span>Developer Dashboard - Basic Test</span>
              </CardTitle>
              <p className="text-gray-600">
                This is a simplified version to test basic rendering
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span className="text-green-800">Developer Dashboard is rendering successfully!</span>
              </div>
              
              <Button
                onClick={() => {
                  setIsLoading(true);
                  setTimeout(() => {
                    setIsLoading(false);
                    toast.success('Test button works!');
                  }, 1000);
                }}
                disabled={isLoading}
                className="w-full bg-purple-600 hover:bg-purple-700"
                size="lg"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Testing...</span>
                  </div>
                ) : (
                  <span>Test Basic Functionality</span>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span>Component Rendering</span>
                  <span className="text-green-600 font-medium">✓ Working</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span>Navigation</span>
                  <span className="text-green-600 font-medium">✓ Working</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span>Toast Notifications</span>
                  <span className="text-green-600 font-medium">✓ Working</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                <span>Next Steps</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-gray-600">
                <p>• ✅ Basic component rendering works</p>
                <p>• ⏳ Add payout function testing</p>
                <p>• ⏳ Add seller data fetching</p>
                <p>• ⏳ Add email simulation</p>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
};

export default Developer;

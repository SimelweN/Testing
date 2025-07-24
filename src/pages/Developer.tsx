import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Code,
  Play,
  User,
  DollarSign,
  Clock,
  CheckCircle,
  X,
  AlertCircle,
  CreditCard,
  Building,
  Mail,
  Calendar,
  Package,
  TrendingUp,
  Banknote,
  ArrowLeft,
  Send,
  ShieldAlert,
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PayoutResponse {
  success: boolean;
  recipient_code?: string;
  message: string;
  payment_breakdown?: {
    total_orders: number;
    total_book_sales: number;
    total_delivery_fees: number;
    platform_earnings: {
      book_commission: number;
      delivery_fees: number;
      total: number;
    };
    seller_amount: number;
    commission_structure: {
      book_commission_rate: string;
      delivery_fee_share: string;
    };
    order_details: Array<{
      order_id: string;
      book: {
        title: string;
        price: number;
      };
      buyer: {
        name: string;
        email: string;
      };
      timeline: {
        order_created: string;
        payment_received: string;
        seller_committed: string;
        delivered: string;
      };
      amounts: {
        book_price: number;
        delivery_fee: number;
        platform_commission: number;
        seller_earnings: number;
      };
    }>;
  };
  seller_info?: {
    name: string;
    email: string;
    account_number: string;
    bank_name: string;
  };
}

interface RealSeller {
  id: string;
  name: string;
  email: string;
  orders: number;
  has_banking: boolean;
}

const Developer = () => {
  const navigate = useNavigate();
  const [selectedSeller, setSelectedSeller] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [payoutResponse, setPayoutResponse] = useState<PayoutResponse | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [realSellers, setRealSellers] = useState<RealSeller[]>([]);
  const [loadingSellers, setLoadingSellers] = useState(true);

  // Fetch real sellers with banking details and delivered orders
  useEffect(() => {
    loadRealSellers();
  }, []);

  const loadRealSellers = async () => {
    setLoadingSellers(true);
    try {
      console.log('Fetching real sellers with delivered orders...');

      // Direct Supabase call instead of API route
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY
      );

      // Get all orders that have been delivered
      const { data: deliveredOrders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          seller_id,
          seller_name,
          seller_email,
          delivery_status,
          status
        `)
        .eq('delivery_status', 'delivered')
        .eq('status', 'delivered');

      if (ordersError) {
        throw new Error(`Failed to fetch delivered orders: ${ordersError.message}`);
      }

      if (!deliveredOrders || deliveredOrders.length === 0) {
        toast.info("No delivered orders found in database");
        setRealSellers([]);
        return;
      }

      // Group orders by seller and count them
      const sellerOrderCounts = deliveredOrders.reduce((acc, order) => {
        const sellerId = order.seller_id;
        if (!acc[sellerId]) {
          acc[sellerId] = {
            id: sellerId,
            name: order.seller_name || `Seller ${sellerId}`,
            email: order.seller_email || 'unknown@email.com',
            orders: 0
          };
        }
        acc[sellerId].orders++;
        return acc;
      }, {});

      const sellersWithOrders = Object.values(sellerOrderCounts);
      console.log('Found sellers with delivered orders:', sellersWithOrders.length);

      // For each seller, check if they have banking details
      const sellersWithBanking = await Promise.all(
        sellersWithOrders.map(async (seller) => {
          try {
            const { data: bankingData, error: bankingError } = await supabase
              .from('banking_subaccounts')
              .select('user_id, business_name, email, status')
              .eq('user_id', seller.id)
              .maybeSingle();

            return {
              ...seller,
              has_banking: !bankingError && bankingData !== null,
              banking_status: bankingData?.status || 'none',
              business_name: bankingData?.business_name || seller.name
            };
          } catch (error) {
            console.error(`Error checking banking for seller ${seller.id}:`, error);
            return {
              ...seller,
              has_banking: false,
              banking_status: 'error'
            };
          }
        })
      );

      // Sort by: banking details first, then by order count
      const sortedSellers = sellersWithBanking.sort((a, b) => {
        if (a.has_banking && !b.has_banking) return -1;
        if (!a.has_banking && b.has_banking) return 1;
        return b.orders - a.orders;
      });

      const eligibleSellers = sortedSellers.filter(seller => seller.has_banking);

      console.log('Sellers with banking details:', eligibleSellers.length);
      console.log('Total sellers with delivered orders:', sortedSellers.length);

      setRealSellers(sortedSellers);

      if (sortedSellers.length === 0) {
        toast.info("No sellers with delivered orders found");
      } else if (eligibleSellers.length === 0) {
        toast.warning(`Found ${sortedSellers.length} sellers with delivered orders, but none have banking details configured`);
      } else {
        toast.success(`Found ${eligibleSellers.length} eligible sellers (with banking details) out of ${sortedSellers.length} total`);
      }

    } catch (error) {
      console.error('Error loading real sellers:', error);
      toast.error(`Failed to load sellers: ${error.message}`);

      // Empty state on error
      setRealSellers([]);
    } finally {
      setLoadingSellers(false);
    }
  };

  const handleTestPayoutFunction = async () => {
    if (!selectedSeller) {
      toast.error("Please select a seller first");
      return;
    }

    const selectedSellerData = realSellers.find(s => s.id === selectedSeller);
    if (!selectedSellerData?.has_banking) {
      toast.error("Selected seller does not have banking details configured");
      return;
    }

    setIsLoading(true);
    setPayoutResponse(null);

    try {
      console.log(`Calling pay-seller function for seller: ${selectedSeller}`);

      // Call the actual pay-seller function
      const response = await fetch('/api/pay-seller', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sellerId: selectedSeller
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        setPayoutResponse(result);
        toast.success("Payout function executed successfully - Real recipient created!");
      } else {
        throw new Error(result.error || "Payout function returned unsuccessful result");
      }
    } catch (error) {
      console.error("Error calling pay-seller function:", error);

      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      toast.error(`Failed to execute payout function: ${errorMessage}`);

      // Set error response for display
      setPayoutResponse({
        success: false,
        message: `Error: ${errorMessage}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    setActionLoading("approve");
    try {
      // Simulate sending approval email
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log("Mock: Approval email sent - 'Your payment is on the way!'");
      toast.success("Approval email sent: 'Your payment is on the way!'");
    } catch (error) {
      console.error("Error sending approval email:", error);
      toast.error("Failed to send approval email");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeny = async () => {
    setActionLoading("deny");
    try {
      // Simulate sending denial email
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log("Mock: Denial email sent - 'There was a problem with your delivery. We will be in touch.'");
      toast.success("Denial email sent: 'There was a problem with your delivery. We will be in touch.'");
    } catch (error) {
      console.error("Error sending denial email:", error);
      toast.error("Failed to send denial email");
    } finally {
      setActionLoading(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
          {/* Test Payout Function Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Play className="h-5 w-5 text-purple-600" />
                <span>Test Payout Function</span>
              </CardTitle>
              <p className="text-gray-600">
                Test the "Create Paystack Recipient + Show Payout Info" function with mock data
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Seller Selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    Select Seller (with delivered orders & banking details)
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={loadRealSellers}
                    disabled={loadingSellers}
                    className="flex items-center space-x-1"
                  >
                    <RefreshCw className={`h-3 w-3 ${loadingSellers ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </Button>
                </div>

                {loadingSellers ? (
                  <div className="flex items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <div className="flex items-center space-x-2 text-gray-500">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                      <span>Loading sellers with banking details...</span>
                    </div>
                  </div>
                ) : realSellers.length === 0 ? (
                  <div className="flex items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <div className="text-center">
                      <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 font-medium">No Eligible Sellers Found</p>
                      <p className="text-sm text-gray-500 mt-1">
                        No sellers have both delivered orders and banking details configured.
                      </p>
                    </div>
                  </div>
                ) : (
                  <Select value={selectedSeller} onValueChange={setSelectedSeller}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose a seller to test..." />
                    </SelectTrigger>
                    <SelectContent>
                      {realSellers.map((seller) => (
                        <SelectItem key={seller.id} value={seller.id} disabled={!seller.has_banking}>
                          <div className="flex items-center justify-between w-full">
                            <span className={!seller.has_banking ? "text-gray-400" : ""}>{seller.name}</span>
                            <div className="flex items-center space-x-2 ml-4">
                              <Badge
                                variant={seller.has_banking ? "default" : "secondary"}
                                className="text-xs"
                              >
                                {seller.orders} orders
                              </Badge>
                              <Badge
                                variant={seller.has_banking ? "default" : "destructive"}
                                className="text-xs"
                              >
                                {seller.has_banking ? "Banking ✓" : "No Banking"}
                              </Badge>
                              <span className="text-xs text-gray-500">{seller.email}</span>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Test Button */}
              <Button
                onClick={handleTestPayoutFunction}
                disabled={!selectedSeller || isLoading || realSellers.length === 0 || loadingSellers}
                className="w-full bg-purple-600 hover:bg-purple-700"
                size="lg"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Calling Real Pay-Seller Function...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Play className="h-4 w-4" />
                    <span>Call Real Pay-Seller Function</span>
                  </div>
                )}
              </Button>

              {realSellers.length === 0 && !loadingSellers && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <span className="text-sm text-amber-800">
                      To test this function, you need sellers with both delivered orders and banking details configured.
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payout Response Display */}
          {payoutResponse && (
            <div className="space-y-6">
              {/* Function Response Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>Function Response</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-green-800 font-medium">{payoutResponse.message}</span>
                    </div>
                    {payoutResponse.recipient_code && (
                      <div className="mt-2">
                        <span className="text-sm text-green-700">Recipient Code: </span>
                        <code className="font-mono bg-green-100 px-2 py-1 rounded text-green-800">
                          {payoutResponse.recipient_code}
                        </code>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Seller Information */}
              {payoutResponse.seller_info && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <User className="h-5 w-5" />
                      <span>Seller Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <Building className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Name:</span>
                        <span className="font-medium">{payoutResponse.seller_info.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Email:</span>
                        <span className="font-medium">{payoutResponse.seller_info.email}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CreditCard className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Account:</span>
                        <span className="font-medium">{payoutResponse.seller_info.account_number}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Building className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Bank:</span>
                        <span className="font-medium">{payoutResponse.seller_info.bank_name}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Payment Breakdown */}
              {payoutResponse.payment_breakdown && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <DollarSign className="h-5 w-5" />
                      <span>Payment Breakdown</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Summary Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <Package className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Total Orders</p>
                              <p className="text-2xl font-bold text-blue-600">
                                {payoutResponse.payment_breakdown.total_orders}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                              <Banknote className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Seller Amount</p>
                              <p className="text-2xl font-bold text-green-600">
                                {formatCurrency(payoutResponse.payment_breakdown.seller_amount)}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                              <TrendingUp className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Platform Earnings</p>
                              <p className="text-2xl font-bold text-purple-600">
                                {formatCurrency(payoutResponse.payment_breakdown.platform_earnings.total)}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Separator />

                    {/* Order Details */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900 flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        Order Timeline & Details
                      </h4>
                      {payoutResponse.payment_breakdown.order_details.map((order, index) => (
                        <div key={order.order_id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <h5 className="font-semibold text-gray-900">Order #{order.order_id}</h5>
                            <Badge variant="outline">{formatCurrency(order.amounts.book_price)}</Badge>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="space-y-2">
                              <p><span className="text-gray-600">Book:</span> {order.book.title}</p>
                              <p><span className="text-gray-600">Buyer:</span> {order.buyer.name}</p>
                              <p><span className="text-gray-600">Email:</span> {order.buyer.email}</p>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-600">Created:</span>
                                <span>{formatDate(order.timeline.order_created)}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span className="text-gray-600">Delivered:</span>
                                <span>{formatDate(order.timeline.delivered)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-between items-center pt-2 border-t">
                            <span className="text-sm text-gray-600">Seller Earnings:</span>
                            <span className="font-medium text-green-600">{formatCurrency(order.amounts.seller_earnings)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Approve/Deny Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Send className="h-5 w-5" />
                    <span>Test Email Notifications</span>
                  </CardTitle>
                  <p className="text-gray-600">
                    Simulate sending approval or denial emails to the seller
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center space-x-4">
                    <Button
                      variant="outline"
                      onClick={handleDeny}
                      disabled={actionLoading === "deny"}
                      className="flex items-center space-x-2 border-red-200 text-red-700 hover:bg-red-50"
                    >
                      {actionLoading === "deny" ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                      ) : (
                        <ShieldAlert className="h-4 w-4" />
                      )}
                      <span>{actionLoading === "deny" ? "Sending..." : "Test Deny Email"}</span>
                    </Button>

                    <Button
                      onClick={handleApprove}
                      disabled={actionLoading === "approve"}
                      className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
                    >
                      {actionLoading === "approve" ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                      <span>{actionLoading === "approve" ? "Sending..." : "Test Approve Email"}</span>
                    </Button>
                  </div>

                  <div className="mt-4 text-sm text-gray-600 text-center">
                    <p><strong>Approve:</strong> "Your payment is on the way!"</p>
                    <p><strong>Deny:</strong> "There was a problem with your delivery. We will be in touch."</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Developer;

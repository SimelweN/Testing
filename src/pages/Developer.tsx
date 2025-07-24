import { useState } from "react";
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

const Developer = () => {
  const navigate = useNavigate();
  const [selectedSeller, setSelectedSeller] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [payoutResponse, setPayoutResponse] = useState<PayoutResponse | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Mock sellers with delivered orders
  const mockSellers = [
    { id: "seller_001", name: "John Doe", email: "john.doe@email.com", orders: 3 },
    { id: "seller_002", name: "Jane Smith", email: "jane.smith@email.com", orders: 2 },
    { id: "seller_003", name: "Mike Johnson", email: "mike.johnson@email.com", orders: 1 },
    { id: "seller_004", name: "Sarah Wilson", email: "sarah.wilson@email.com", orders: 4 },
  ];

  const handleTestPayoutFunction = async () => {
    if (!selectedSeller) {
      toast.error("Please select a seller first");
      return;
    }

    setIsLoading(true);
    setPayoutResponse(null);

    try {
      // Simulate API call to pay-seller function
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate network delay

      // Mock response similar to actual pay-seller function
      const mockResponse: PayoutResponse = {
        success: true,
        recipient_code: `RCP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        message: "Mock recipient created - Ready for manual payment (Development Mode)",
        payment_breakdown: {
          total_orders: mockSellers.find(s => s.id === selectedSeller)?.orders || 1,
          total_book_sales: 500.00,
          total_delivery_fees: 50.00,
          platform_earnings: {
            book_commission: 50.00,
            delivery_fees: 50.00,
            total: 100.00
          },
          seller_amount: 450.00,
          commission_structure: {
            book_commission_rate: "10%",
            delivery_fee_share: "100% to platform"
          },
          order_details: [
            {
              order_id: "ORD_001",
              book: {
                title: "Advanced Physics Textbook",
                price: 300.00
              },
              buyer: {
                name: "Sarah Johnson",
                email: "sarah.johnson@uct.ac.za"
              },
              timeline: {
                order_created: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                payment_received: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
                seller_committed: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                delivered: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
              },
              amounts: {
                book_price: 300.00,
                delivery_fee: 30.00,
                platform_commission: 30.00,
                seller_earnings: 270.00
              }
            },
            {
              order_id: "ORD_002",
              book: {
                title: "Mathematics Guide",
                price: 200.00
              },
              buyer: {
                name: "Mike Chen",
                email: "mike.chen@wits.ac.za"
              },
              timeline: {
                order_created: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
                payment_received: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
                seller_committed: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
                delivered: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
              },
              amounts: {
                book_price: 200.00,
                delivery_fee: 20.00,
                platform_commission: 20.00,
                seller_earnings: 180.00
              }
            }
          ]
        },
        seller_info: {
          name: mockSellers.find(s => s.id === selectedSeller)?.name || "Unknown Seller",
          email: mockSellers.find(s => s.id === selectedSeller)?.email || "unknown@email.com",
          account_number: "****1234",
          bank_name: "First National Bank"
        }
      };

      setPayoutResponse(mockResponse);
      toast.success("Payout function executed successfully");
    } catch (error) {
      console.error("Error testing payout function:", error);
      toast.error("Failed to test payout function");
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
                <label className="text-sm font-medium text-gray-700">
                  Select Seller (with delivered orders)
                </label>
                <Select value={selectedSeller} onValueChange={setSelectedSeller}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a seller to test..." />
                  </SelectTrigger>
                  <SelectContent>
                    {mockSellers.map((seller) => (
                      <SelectItem key={seller.id} value={seller.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{seller.name}</span>
                          <div className="flex items-center space-x-2 ml-4">
                            <Badge variant="secondary" className="text-xs">
                              {seller.orders} orders
                            </Badge>
                            <span className="text-xs text-gray-500">{seller.email}</span>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Test Button */}
              <Button
                onClick={handleTestPayoutFunction}
                disabled={!selectedSeller || isLoading}
                className="w-full bg-purple-600 hover:bg-purple-700"
                size="lg"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Testing Payout Function...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Play className="h-4 w-4" />
                    <span>Run Payout Function Test</span>
                  </div>
                )}
              </Button>
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

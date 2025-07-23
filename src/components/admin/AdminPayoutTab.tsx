import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import {
  DollarSign,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  CreditCard,
  Building,
  Mail,
  Calendar,
  Package,
  TrendingUp,
  Banknote,
  Search,
} from "lucide-react";

interface PaymentBreakdown {
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
      category: string;
      condition: string;
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
}

interface SellerInfo {
  name: string;
  email: string;
  account_number: string;
  bank_name: string;
}

interface PayoutResult {
  success: boolean;
  recipient_code?: string;
  message: string;
  already_existed?: boolean;
  development_mode?: boolean;
  payment_breakdown?: PaymentBreakdown;
  seller_info?: SellerInfo;
  instructions?: string;
  error?: string;
}

const AdminPayoutTab = () => {
  const [sellerId, setSellerId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [payoutResult, setPayoutResult] = useState<PayoutResult | null>(null);

  const handleCreateRecipient = async () => {
    if (!sellerId.trim()) {
      toast.error("Please enter a seller ID");
      return;
    }

    setIsLoading(true);
    setPayoutResult(null);

    try {
      const response = await fetch('/api/pay-seller', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sellerId: sellerId.trim() }),
      });

      const result: PayoutResult = await response.json();

      if (result.success) {
        toast.success(result.message);
        setPayoutResult(result);
      } else {
        toast.error(result.error || "Failed to create recipient");
        setPayoutResult(result);
      }
    } catch (error) {
      console.error("Error creating recipient:", error);
      toast.error("Failed to process payout request");
      setPayoutResult({
        success: false,
        message: "Failed to process request",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString || dateString === 'Recently delivered') return dateString;
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-green-100 rounded-lg">
          <DollarSign className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Seller Payouts</h2>
          <p className="text-gray-600">Create recipients and manage seller payments</p>
        </div>
      </div>

      {/* Payout Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Create Payout Recipient</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sellerId">Seller ID</Label>
            <Input
              id="sellerId"
              placeholder="Enter seller ID"
              value={sellerId}
              onChange={(e) => setSellerId(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <Button
            onClick={handleCreateRecipient}
            disabled={isLoading || !sellerId.trim()}
            className="w-full"
          >
            {isLoading ? "Processing..." : "Create Recipient & Show Payout Details"}
          </Button>
        </CardContent>
      </Card>

      {/* Payout Results */}
      {payoutResult && (
        <div className="space-y-6">
          {/* Status Alert */}
          <Alert className={payoutResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
            <div className="flex items-center space-x-2">
              {payoutResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={payoutResult.success ? "text-green-800" : "text-red-800"}>
                {payoutResult.message}
                {payoutResult.development_mode && " (Development Mode)"}
              </AlertDescription>
            </div>
          </Alert>

          {payoutResult.success && payoutResult.payment_breakdown && (
            <>
              {/* Seller Information */}
              {payoutResult.seller_info && (
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
                        <span className="font-medium">{payoutResult.seller_info.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Email:</span>
                        <span className="font-medium">{payoutResult.seller_info.email}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CreditCard className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Account:</span>
                        <span className="font-medium">{payoutResult.seller_info.account_number}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Building className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Bank:</span>
                        <span className="font-medium">{payoutResult.seller_info.bank_name}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Payment Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Package className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Orders</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {payoutResult.payment_breakdown.total_orders}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Banknote className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Seller Amount</p>
                        <p className="text-2xl font-bold text-green-600">
                          {formatCurrency(payoutResult.payment_breakdown.seller_amount)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <TrendingUp className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Platform Earnings</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {formatCurrency(payoutResult.payment_breakdown.platform_earnings.total)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5" />
                    <span>Payment Breakdown</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900">Revenue Details</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Book Sales:</span>
                          <span className="font-medium">{formatCurrency(payoutResult.payment_breakdown.total_book_sales)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Delivery Fees:</span>
                          <span className="font-medium">{formatCurrency(payoutResult.payment_breakdown.total_delivery_fees)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900">Commission Structure</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Book Commission Rate:</span>
                          <Badge variant="secondary">{payoutResult.payment_breakdown.commission_structure.book_commission_rate}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Delivery Fee Share:</span>
                          <Badge variant="secondary">{payoutResult.payment_breakdown.commission_structure.delivery_fee_share}</Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-900">Platform Earnings</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Book Commission:</span>
                        <span className="font-medium">{formatCurrency(payoutResult.payment_breakdown.platform_earnings.book_commission)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Delivery Fees:</span>
                        <span className="font-medium">{formatCurrency(payoutResult.payment_breakdown.platform_earnings.delivery_fees)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 font-semibold">Total Platform:</span>
                        <span className="font-bold text-purple-600">{formatCurrency(payoutResult.payment_breakdown.platform_earnings.total)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Order Timeline */}
              {payoutResult.payment_breakdown.order_details.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Clock className="h-5 w-5" />
                      <span>Order Timeline & Details</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {payoutResult.payment_breakdown.order_details.map((order, index) => (
                        <div key={order.order_id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <h5 className="font-semibold text-gray-900">Order #{order.order_id}</h5>
                            <Badge variant="outline">{formatCurrency(order.amounts.book_price)}</Badge>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="space-y-2">
                              <p><span className="text-gray-600">Buyer:</span> {order.buyer.email}</p>
                              <p><span className="text-gray-600">Seller Earnings:</span> <span className="font-medium text-green-600">{formatCurrency(order.amounts.seller_earnings)}</span></p>
                              <p><span className="text-gray-600">Platform Commission:</span> <span className="font-medium text-purple-600">{formatCurrency(order.amounts.platform_commission)}</span></p>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-600">Created:</span>
                                <span>{formatDate(order.timeline.order_created)}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Clock className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-600">Delivered:</span>
                                <span>{formatDate(order.timeline.delivered)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recipient Code */}
              {payoutResult.recipient_code && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <CreditCard className="h-5 w-5" />
                      <span>Recipient Code</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-2">Use this recipient code for manual payment processing:</p>
                      <p className="font-mono text-lg font-bold text-gray-900">{payoutResult.recipient_code}</p>
                      {payoutResult.instructions && (
                        <p className="text-sm text-gray-600 mt-2">{payoutResult.instructions}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {!payoutResult.success && payoutResult.error && (
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Error Details</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-red-700">{payoutResult.error}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPayoutTab;

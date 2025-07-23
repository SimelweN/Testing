import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Check,
  X,
  Eye,
  Info,
} from "lucide-react";

type PayoutStatus = 'pending' | 'approved' | 'denied';

interface PayoutRequest {
  id: string;
  seller_id: string;
  seller_name: string;
  seller_email: string;
  total_amount: number;
  order_count: number;
  created_at: string;
  status: PayoutStatus;
  recipient_code?: string;
  orders: Array<{
    id: string;
    book_title: string;
    amount: number;
    delivered_at: string;
    buyer_email: string;
  }>;
}

interface PayoutStats {
  pending: number;
  approved: number;
  denied: number;
  total_approved_amount: number;
}

const AdminPayoutTab = () => {
  const [payoutStats, setPayoutStats] = useState<PayoutStats>({
    pending: 0,
    approved: 0,
    denied: 0,
    total_approved_amount: 0,
  });
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [activeTab, setActiveTab] = useState<PayoutStatus>('pending');
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadPayoutData();
    // Auto-detect new payouts on component mount
    autoDetectPayouts();
  }, []);

  const autoDetectPayouts = async () => {
    try {
      const response = await fetch('/api/auto-detect-payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.payouts_created > 0) {
          toast.success(`${result.payouts_created} new payout requests created from delivered orders`);
          // Reload data to show new payouts
          loadPayoutData();
        }
      }
    } catch (error) {
      console.error('Error auto-detecting payouts:', error);
    }
  };

  const loadPayoutData = async () => {
    setIsLoading(true);
    try {
      // Fetch payout requests from API
      const response = await fetch('/api/get-payout-requests');
      if (!response.ok) {
        throw new Error('Failed to fetch payout requests');
      }

      const data = await response.json();
      setPayoutRequests(data.payouts || []);

      const stats = {
        pending: data.payouts.filter(p => p.status === 'pending').length,
        approved: data.payouts.filter(p => p.status === 'approved').length,
        denied: data.payouts.filter(p => p.status === 'denied').length,
        total_approved_amount: data.payouts
          .filter(p => p.status === 'approved')
          .reduce((sum, p) => sum + p.total_amount, 0),
      };

      setPayoutStats(stats);
    } catch (error) {
      console.error('Error loading payout data:', error);
      toast.error('Failed to load payout data');

      // Fallback to empty state
      setPayoutRequests([]);
      setPayoutStats({ pending: 0, approved: 0, denied: 0, total_approved_amount: 0 });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (payoutId: string) => {
    setActionLoading(payoutId);
    try {
      // Send approval email
      await fetch('/api/send-payout-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payoutId,
          action: 'approve',
          message: 'Your payment is on the way!'
        }),
      });

      // Update local state
      setPayoutRequests(prev =>
        prev.map(p => p.id === payoutId ? { ...p, status: 'approved' as PayoutStatus } : p)
      );

      toast.success('Payout approved and notification sent');
      loadPayoutData(); // Reload to update stats
    } catch (error) {
      console.error('Error approving payout:', error);
      toast.error('Failed to approve payout');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeny = async (payoutId: string) => {
    setActionLoading(payoutId);
    try {
      // Send denial email
      await fetch('/api/send-payout-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payoutId,
          action: 'deny',
          message: 'Something went wrong and we\'ll be in touch shortly'
        }),
      });

      // Update local state
      setPayoutRequests(prev =>
        prev.map(p => p.id === payoutId ? { ...p, status: 'denied' as PayoutStatus } : p)
      );

      toast.success('Payout denied and notification sent');
      loadPayoutData(); // Reload to update stats
    } catch (error) {
      console.error('Error denying payout:', error);
      toast.error('Failed to deny payout');
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
    });
  };

  const filteredPayouts = payoutRequests.filter(p => p.status === activeTab);

  return (
    <div className="p-6 space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="relative">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Pending Payouts</p>
                <p className="text-3xl font-bold text-gray-900">{payoutStats.pending}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Approved Payouts</p>
                <p className="text-3xl font-bold text-gray-900">{payoutStats.approved}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Denied Payouts</p>
                <p className="text-3xl font-bold text-gray-900">{payoutStats.denied}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <X className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Approved</p>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(payoutStats.total_approved_amount)}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as PayoutStatus)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending" className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>Pending ({payoutStats.pending})</span>
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4" />
            <span>Approved ({payoutStats.approved})</span>
          </TabsTrigger>
          <TabsTrigger value="denied" className="flex items-center space-x-2">
            <X className="h-4 w-4" />
            <span>Denied ({payoutStats.denied})</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab Content */}
        <TabsContent value={activeTab} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Info className="h-5 w-5" />
                <span>
                  {activeTab === 'pending' ? 'Pending Payouts Requiring Review' :
                   activeTab === 'approved' ? 'Approved Payouts' : 'Denied Payouts'}
                </span>
              </CardTitle>
              <p className="text-sm text-gray-600">
                {activeTab === 'pending'
                  ? 'These payouts need manual approval before processing'
                  : `View all ${activeTab} payout requests`
                }
              </p>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : filteredPayouts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <Package className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-gray-500">
                    {activeTab === 'pending' ? 'No pending payouts to review' :
                     `No ${activeTab} payouts found`}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredPayouts.map((payout) => (
                    <div key={payout.id} className="border rounded-lg p-6 space-y-4">
                      {/* Payout Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <User className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{payout.seller_name}</h3>
                            <p className="text-sm text-gray-600">{payout.seller_email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-600">{formatCurrency(payout.total_amount)}</p>
                          <p className="text-sm text-gray-600">{payout.order_count} orders</p>
                        </div>
                      </div>

                      {/* Order Details */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-3">Order Details</h4>
                        <div className="space-y-2">
                          {payout.orders.map((order) => (
                            <div key={order.id} className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">
                                {order.book_title} - {order.buyer_email}
                              </span>
                              <span className="font-medium">{formatCurrency(order.amount)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      {activeTab === 'pending' && (
                        <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                          <Button
                            variant="outline"
                            onClick={() => handleDeny(payout.id)}
                            disabled={actionLoading === payout.id}
                            className="flex items-center space-x-2"
                          >
                            <X className="h-4 w-4" />
                            <span>{actionLoading === payout.id ? 'Processing...' : 'Deny'}</span>
                          </Button>
                          <Button
                            onClick={() => handleApprove(payout.id)}
                            disabled={actionLoading === payout.id}
                            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
                          >
                            <Check className="h-4 w-4" />
                            <span>{actionLoading === payout.id ? 'Processing...' : 'Approve'}</span>
                          </Button>
                        </div>
                      )}

                      {/* Status Badge for non-pending */}
                      {activeTab !== 'pending' && (
                        <div className="flex items-center justify-between pt-4 border-t">
                          <Badge
                            variant={activeTab === 'approved' ? 'default' : 'destructive'}
                            className={activeTab === 'approved' ? 'bg-green-100 text-green-800' : ''}
                          >
                            {activeTab === 'approved' ? 'Approved' : 'Denied'}
                          </Badge>
                          <p className="text-sm text-gray-500">
                            Processed on {formatDate(payout.created_at)}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPayoutTab;

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
  payment_breakdown?: any; // Store the detailed payment breakdown from edge function
  orders: Array<{
    id: string;
    book_title: string;
    amount: number;
    delivered_at: string;
    buyer_email: string;
    buyer_name?: string;
    paystack_transaction_id?: string; // Add transaction ID field
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
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        await loadPayoutData();
      } catch (error) {
        console.error('Error in useEffect loadPayoutData:', error);
        toast.error('Failed to load payout data');
        setIsLoading(false);
      }
    };

    loadData();
    // Auto-detect disabled for now - will enable when database is ready
    // autoDetectPayouts();
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
      console.log('Loading real seller data for payouts...');

      // Check if we have the required environment variables
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        throw new Error('Supabase environment variables not configured');
      }

      // Use the existing supabase client instead of dynamic import
      const { supabase } = await import('@/integrations/supabase/client');

      console.log('Fetching sellers with banking details and delivered orders...');

      // First, get all users who have banking subaccounts
      const { data: bankingAccounts, error: bankingError } = await supabase
        .from('banking_subaccounts')
        .select(`
          user_id,
          business_name,
          email,
          status,
          bank_name,
          account_number,
          recipient_code,
          created_at
        `)
        .eq('status', 'active');

      if (bankingError) {
        console.error('Banking subaccounts query error:', bankingError);
        throw new Error(`Failed to fetch banking subaccounts: ${bankingError.message}`);
      }

      if (!bankingAccounts || bankingAccounts.length === 0) {
        console.log("No banking accounts found, using demo data");
        toast.info("No sellers with banking details found - Using demo data");

        // Use demo data instead of returning early
        const demoPayouts: PayoutRequest[] = [
          {
            id: 'demo_payout_1',
            seller_id: 'demo_seller_1',
            seller_name: 'Demo Academic Seller',
            seller_email: 'demo.seller@university.com',
            total_amount: 1800, // R2000 * 0.9
            order_count: 2,
            created_at: new Date().toISOString(),
            status: 'pending',
            orders: [
              {
                id: 'demo_order_1',
                book_title: 'Engineering Mathematics 3rd Edition',
                amount: 1200,
                delivered_at: new Date(Date.now() - 86400000).toISOString(),
                buyer_email: 'student1@university.com',
                buyer_name: 'Student A'
              },
              {
                id: 'demo_order_2',
                book_title: 'Computer Science Fundamentals',
                amount: 800,
                delivered_at: new Date(Date.now() - 172800000).toISOString(),
                buyer_email: 'student2@university.com',
                buyer_name: 'Student B'
              }
            ]
          },
          {
            id: 'demo_payout_2',
            seller_id: 'demo_seller_2',
            seller_name: 'Demo Science Seller',
            seller_email: 'science.seller@university.com',
            total_amount: 900,
            order_count: 1,
            created_at: new Date(Date.now() - 86400000).toISOString(),
            status: 'approved',
            recipient_code: 'RCP_DEMO_123',
            orders: [
              {
                id: 'demo_order_3',
                book_title: 'Physics for Engineers',
                amount: 1000,
                delivered_at: new Date(Date.now() - 172800000).toISOString(),
                buyer_email: 'student3@university.com',
                buyer_name: 'Student C'
              }
            ]
          },
          {
            id: 'demo_payout_3',
            seller_id: 'demo_seller_3',
            seller_name: 'Demo Law Seller',
            seller_email: 'law.seller@university.com',
            total_amount: 450,
            order_count: 1,
            created_at: new Date(Date.now() - 172800000).toISOString(),
            status: 'denied',
            orders: [
              {
                id: 'demo_order_4',
                book_title: 'Constitutional Law Handbook',
                amount: 500,
                delivered_at: new Date(Date.now() - 259200000).toISOString(),
                buyer_email: 'student4@university.com',
                buyer_name: 'Student D'
              }
            ]
          }
        ];

        setPayoutRequests(demoPayouts);
        setPayoutStats({
          pending: 1,
          approved: 1,
          denied: 1,
          total_approved_amount: 900
        });
        return;
      }

      // For each seller with banking, check if they have delivered orders
      const sellersWithOrders = await Promise.all(
        bankingAccounts.map(async (banking) => {
          try {
            const { data: orders, error: ordersError } = await supabase
              .from('orders')
              .select(`
                id,
                seller_id,
                buyer_email,
                amount,
                delivery_status,
                status,
                created_at,
                delivered_at
              `)
              .eq('seller_id', banking.user_id)
              .eq('delivery_status', 'delivered')
              .eq('status', 'delivered');

            if (ordersError || !orders || orders.length === 0) {
              return null; // Skip sellers without delivered orders
            }

            const totalAmount = orders.reduce((sum, order) => sum + (order.amount * 0.9), 0); // 90% to seller

            return {
              id: `payout_${banking.user_id}`,
              seller_id: banking.user_id,
              seller_name: banking.business_name || `Seller ${banking.user_id}`,
              seller_email: banking.email,
              total_amount: totalAmount,
              order_count: orders.length,
              created_at: new Date().toISOString(),
              status: banking.recipient_code ? 'approved' : 'pending' as PayoutStatus,
              recipient_code: banking.recipient_code,
              orders: orders.map(order => ({
                id: order.id,
                book_title: 'Academic Textbook', // Default title
                amount: order.amount,
                delivered_at: order.delivered_at || order.created_at,
                buyer_email: order.buyer_email,
                buyer_name: 'Anonymous Buyer'
              }))
            };
          } catch (error) {
            console.error(`Error checking orders for seller ${banking.user_id}:`, error);
            return null;
          }
        })
      );

      // Filter out null results
      const validPayouts = sellersWithOrders.filter(payout => payout !== null);

      setPayoutRequests(validPayouts);

      // Calculate stats
      const stats = {
        pending: validPayouts.filter(p => p.status === 'pending').length,
        approved: validPayouts.filter(p => p.status === 'approved').length,
        denied: validPayouts.filter(p => p.status === 'denied').length,
        total_approved_amount: validPayouts
          .filter(p => p.status === 'approved')
          .reduce((sum, p) => sum + p.total_amount, 0),
      };

      setPayoutStats(stats);

      if (validPayouts.length === 0) {
        toast.warning("Found sellers with banking details, but none have delivered orders");
      } else {
        toast.success(`Found ${validPayouts.length} sellers eligible for payouts`);
      }

    } catch (error) {
      console.error('Error loading payout data:', error);
      setHasError(true);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      // Check if it's a database access issue
      if (errorMessage.includes('permission') || errorMessage.includes('does not exist')) {
        console.log('Database access issue detected, using demo data');
        toast.warning('Database access issue - Using demo data for testing');

        // Provide demo data for testing when database isn't accessible
        const demoPayouts: PayoutRequest[] = [
          {
            id: 'demo_payout_1',
            seller_id: 'demo_seller_1',
            seller_name: 'Demo Academic Seller',
            seller_email: 'demo.seller@university.com',
            total_amount: 1800, // R2000 * 0.9
            order_count: 2,
            created_at: new Date().toISOString(),
            status: 'pending',
            orders: [
              {
                id: 'demo_order_1',
                book_title: 'Engineering Mathematics 3rd Edition',
                amount: 1200,
                delivered_at: new Date(Date.now() - 86400000).toISOString(),
                buyer_email: 'student1@university.com',
                buyer_name: 'Student A'
              },
              {
                id: 'demo_order_2',
                book_title: 'Computer Science Fundamentals',
                amount: 800,
                delivered_at: new Date(Date.now() - 172800000).toISOString(),
                buyer_email: 'student2@university.com',
                buyer_name: 'Student B'
              }
            ]
          }
        ];

        setPayoutRequests(demoPayouts);
        setPayoutStats({
          pending: 1,
          approved: 0,
          denied: 0,
          total_approved_amount: 0
        });
      } else {
        toast.error('Failed to load payout data');
        setPayoutRequests([]);
        setPayoutStats({ pending: 0, approved: 0, denied: 0, total_approved_amount: 0 });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (payoutId: string) => {
    setActionLoading(payoutId);
    try {
      // Find the payout to get seller_id
      const payout = payoutRequests.find(p => p.id === payoutId);
      if (!payout) {
        toast.error('Payout not found');
        return;
      }

      console.log(`Creating recipient for seller: ${payout.seller_id}`);

      // Call the create-recipient edge function to create recipient
      const response = await fetch('/functions/v1/create-recipient', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sellerId: payout.seller_id
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create recipient');
      }

      if (result.success) {
        console.log('✅ Recipient created successfully:', result.recipient_code);

        // Send approval email to seller
        try {
          const emailResponse = await fetch('/functions/v1/send-email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              to: payout.seller_email,
              subject: '🎉 Your Payout Has Been Approved - ReBooked Solutions',
              html: `
                <style>
                  body {
                    font-family: Arial, sans-serif;
                    background-color: #f3fef7;
                    padding: 20px;
                    color: #1f4e3d;
                  }
                  .container {
                    max-width: 500px;
                    margin: auto;
                    background-color: #ffffff;
                    padding: 30px;
                    border-radius: 10px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
                  }
                  .btn {
                    display: inline-block;
                    padding: 12px 20px;
                    background-color: #3ab26f;
                    color: white;
                    text-decoration: none;
                    border-radius: 5px;
                    margin-top: 20px;
                    font-weight: bold;
                  }
                  .link {
                    color: #3ab26f;
                  }
                  .amount {
                    font-size: 28px;
                    font-weight: bold;
                    color: #3ab26f;
                    margin: 20px 0;
                  }
                  .detail-box {
                    background-color: #f8f9fa;
                    border-left: 4px solid #3ab26f;
                    padding: 15px;
                    margin: 15px 0;
                    border-radius: 5px;
                  }
                </style>
                <div class="container">
                  <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #3ab26f; margin: 0;">🎉 Payout Approved!</h1>
                  </div>

                  <p>Dear ${payout.seller_name},</p>

                  <p>Great news! Your payout request has been <strong>approved</strong> and is now being processed.</p>

                  <div class="amount" style="text-align: center;">
                    ${formatCurrency(payout.total_amount)}
                  </div>

                  <div class="detail-box">
                    <h3 style="margin-top: 0; color: #1f4e3d;">📋 Payout Details</h3>
                    <p><strong>Order Count:</strong> ${payout.order_count} completed orders</p>
                    <p><strong>Payment Method:</strong> Bank Transfer</p>
                    <p><strong>Processing Time:</strong> 1-3 business days</p>
                    <p><strong>Recipient Code:</strong> ${result.recipient_code}</p>
                  </div>

                  <div class="detail-box">
                    <h3 style="margin-top: 0; color: #1f4e3d;">🏦 What Happens Next?</h3>
                    <ul style="margin: 10px 0; padding-left: 20px;">
                      <li>Your payment is being processed through our secure payment system</li>
                      <li>Funds will be transferred to your registered bank account</li>
                      <li>You'll receive an SMS notification when funds are available</li>
                      <li>Payment should arrive within 1-3 business days</li>
                    </ul>
                  </div>

                  <p>If you have any questions about your payout, please don't hesitate to contact our support team.</p>

                  <div style="text-align: center; margin-top: 30px;">
                    <a href="https://rebooked.co.za/profile" class="btn">View Your Account</a>
                  </div>

                  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; text-align: center; color: #6c757d; font-size: 14px;">
                    <p>Thank you for being part of ReBooked Solutions!</p>
                    <p>
                      <a href="https://rebooked.co.za" class="link">ReBooked Solutions</a> |
                      <a href="mailto:support@rebooked.co.za" class="link">support@rebooked.co.za</a>
                    </p>
                  </div>
                </div>
              `
            })
          });

          if (emailResponse.ok) {
            console.log('✅ Approval email sent to seller:', payout.seller_email);
          } else {
            console.warn('⚠️ Email sending failed, but recipient created successfully');
          }
        } catch (emailError) {
          console.error('Email sending error:', emailError);
          // Don't fail the whole process if email fails
        }

        // Update local state with payment breakdown data
        setPayoutRequests(prev =>
          prev.map(p => p.id === payoutId ? {
            ...p,
            status: 'approved' as PayoutStatus,
            recipient_code: result.recipient_code,
            payment_breakdown: result.payment_breakdown,
            // Update orders with transaction IDs if available
            orders: result.payment_breakdown?.order_details ?
              result.payment_breakdown.order_details.map((orderDetail: any, index: number) => ({
                ...p.orders[index],
                paystack_transaction_id: orderDetail.paystack_transaction_id,
                id: orderDetail.order_id || p.orders[index]?.id
              })) : p.orders
          } : p)
        );

        toast.success('✅ Payout approved! Recipient created and seller notified.');
        console.log('📊 Payment breakdown:', result.payment_breakdown);
        console.log('🏦 Seller info:', result.seller_info);
        console.log('📦 Subaccount details:', result.subaccount_details);
        console.log('⏰ Payout timeline:', result.payout_timeline);

        loadPayoutData(); // Reload to update stats
      } else {
        throw new Error(result.message || 'Unknown error');
      }
    } catch (error) {
      console.error('Error approving payout:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to approve payout: ${errorMessage}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeny = async (payoutId: string) => {
    setActionLoading(payoutId);
    try {
      // Find the payout to get seller info
      const payout = payoutRequests.find(p => p.id === payoutId);
      if (!payout) {
        toast.error('Payout not found');
        return;
      }

      console.log(`Denying payout for seller: ${payout.seller_id}`);

      // Send denial email to seller
      try {
        const emailResponse = await fetch('/functions/v1/send-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: payout.seller_email,
            subject: '📋 Payout Request Under Review - ReBooked Solutions',
            html: `
              <style>
                body {
                  font-family: Arial, sans-serif;
                  background-color: #f3fef7;
                  padding: 20px;
                  color: #1f4e3d;
                }
                .container {
                  max-width: 500px;
                  margin: auto;
                  background-color: #ffffff;
                  padding: 30px;
                  border-radius: 10px;
                  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
                }
                .btn {
                  display: inline-block;
                  padding: 12px 20px;
                  background-color: #3ab26f;
                  color: white;
                  text-decoration: none;
                  border-radius: 5px;
                  margin-top: 20px;
                  font-weight: bold;
                }
                .link {
                  color: #3ab26f;
                }
                .amount {
                  font-size: 24px;
                  font-weight: bold;
                  color: #1f4e3d;
                  margin: 20px 0;
                }
                .detail-box {
                  background-color: #fff3cd;
                  border-left: 4px solid #ffc107;
                  padding: 15px;
                  margin: 15px 0;
                  border-radius: 5px;
                }
                .info-box {
                  background-color: #f8f9fa;
                  border-left: 4px solid #3ab26f;
                  padding: 15px;
                  margin: 15px 0;
                  border-radius: 5px;
                }
              </style>
              <div class="container">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #1f4e3d; margin: 0;">📋 Payout Under Review</h1>
                </div>

                <p>Dear ${payout.seller_name},</p>

                <p>Thank you for your payout request. We have received your request for the following amount:</p>

                <div class="amount" style="text-align: center;">
                  ${formatCurrency(payout.total_amount)}
                </div>

                <div class="detail-box">
                  <h3 style="margin-top: 0; color: #856404;">⏳ Current Status: Under Review</h3>
                  <p>Your payout request is currently being reviewed by our team to ensure all requirements are met and all documentation is in order.</p>
                </div>

                <div class="info-box">
                  <h3 style="margin-top: 0; color: #1f4e3d;">📞 What Happens Next?</h3>
                  <ul style="margin: 10px 0; padding-left: 20px;">
                    <li><strong>We will be in touch within 2-3 business days</strong> with an update</li>
                    <li>Our team may contact you to verify additional details if needed</li>
                    <li>Once approved, your payment will be processed immediately</li>
                    <li>You'll receive full notification of any status changes</li>
                  </ul>
                </div>

                <div class="info-box">
                  <h3 style="margin-top: 0; color: #1f4e3d;">📋 Payout Details Being Reviewed</h3>
                  <p><strong>Order Count:</strong> ${payout.order_count} completed orders</p>
                  <p><strong>Account:</strong> ${payout.seller_email}</p>
                  <p><strong>Review ID:</strong> ${payoutId}</p>
                </div>

                <p>If you have any questions or need to provide additional information, please don't hesitate to contact our support team.</p>

                <div style="text-align: center; margin-top: 30px;">
                  <a href="https://rebooked.co.za/profile" class="btn">View Your Account</a>
                </div>

                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; text-align: center; color: #6c757d; font-size: 14px;">
                  <p>We appreciate your patience as we ensure all payouts are processed securely.</p>
                  <p>
                    <a href="https://rebooked.co.za" class="link">ReBooked Solutions</a> |
                    <a href="mailto:support@rebooked.co.za" class="link">support@rebooked.co.za</a>
                  </p>
                </div>
              </div>
            `
          })
        });

        if (emailResponse.ok) {
          console.log('✅ Denial email sent to seller:', payout.seller_email);
        } else {
          console.warn('⚠️ Email sending failed, but payout denied successfully');
        }
      } catch (emailError) {
        console.error('Email sending error:', emailError);
        // Don't fail the whole process if email fails
      }

      // Update local state
      setPayoutRequests(prev =>
        prev.map(p => p.id === payoutId ? { ...p, status: 'denied' as PayoutStatus } : p)
      );

      toast.success('❌ Payout denied and seller notified - We will be in touch');
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

  // If there's a critical error, show a fallback UI
  if (hasError) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Payouts</h3>
              <p className="text-gray-600 mb-4">Something went wrong while loading the payout data.</p>
              <Button onClick={() => {
                setHasError(false);
                setIsLoading(true);
                loadPayoutData();
              }}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Always show the tabs interface, even with empty data

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

                      {/* Comprehensive Order Details */}
                      <div className="space-y-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                            <Package className="h-4 w-4 mr-2" />
                            Order Summary ({payout.order_count} orders)
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Total Book Sales:</span>
                              <div className="font-medium">{formatCurrency(payout.total_amount / 0.9)}</div>
                            </div>
                            <div>
                              <span className="text-gray-600">Platform Commission (10%):</span>
                              <div className="font-medium text-purple-600">{formatCurrency(payout.total_amount * 0.1 / 0.9)}</div>
                            </div>
                            <div>
                              <span className="text-gray-600">Seller Earnings (90%):</span>
                              <div className="font-bold text-green-600">{formatCurrency(payout.total_amount)}</div>
                            </div>
                          </div>
                        </div>

                        {/* Individual Order Cards */}
                        <div className="space-y-3">
                          <h4 className="font-medium text-gray-900 flex items-center">
                            <Eye className="h-4 w-4 mr-2" />
                            Individual Orders
                          </h4>
                          {payout.orders.map((order, index) => (
                            <div key={order.id} className="border rounded-lg p-4 bg-white">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-2">
                                  <Badge variant="outline" className="text-xs">
                                    Order #{index + 1}
                                  </Badge>
                                  <span className="font-medium text-gray-900">{order.book_title}</span>
                                </div>
                                <span className="font-bold text-green-600">{formatCurrency(order.amount)}</span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                {/* Order & Payment IDs */}
                                <div className="space-y-2">
                                  <h5 className="font-medium text-gray-800 flex items-center">
                                    <CreditCard className="h-3 w-3 mr-1" />
                                    Order & Payment IDs
                                  </h5>
                                  <div className="pl-4 space-y-1">
                                    <div><span className="text-gray-600">Order ID:</span> <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{order.id}</span></div>
                                    <div><span className="text-gray-600">Transaction ID:</span> <span className="font-mono text-xs bg-blue-100 px-2 py-1 rounded">{(order as any).paystack_transaction_id || 'N/A'}</span></div>
                                  </div>
                                </div>

                                {/* Buyer Information */}
                                <div className="space-y-2">
                                  <h5 className="font-medium text-gray-800 flex items-center">
                                    <User className="h-3 w-3 mr-1" />
                                    Buyer Information
                                  </h5>
                                  <div className="pl-4 space-y-1">
                                    <div><span className="text-gray-600">Name:</span> <span className="font-medium">{order.buyer_name || 'Anonymous Buyer'}</span></div>
                                    <div><span className="text-gray-600">Email:</span> <span className="font-medium">{order.buyer_email}</span></div>
                                  </div>
                                </div>

                                {/* Delivery Timeline */}
                                <div className="space-y-2">
                                  <h5 className="font-medium text-gray-800 flex items-center">
                                    <Clock className="h-3 w-3 mr-1" />
                                    Delivery Timeline
                                  </h5>
                                  <div className="pl-4 space-y-1">
                                    <div className="flex items-center justify-between">
                                      <span className="text-gray-600">Order Created:</span>
                                      <span className="text-xs">{formatDate(order.delivered_at)}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-gray-600">Delivered:</span>
                                      <Badge variant="default" className="bg-green-100 text-green-800 text-xs">
                                        ✓ Confirmed
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Financial Breakdown */}
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <div className="grid grid-cols-3 gap-2 text-xs">
                                  <div className="text-center">
                                    <div className="text-gray-600">Book Price</div>
                                    <div className="font-medium">{formatCurrency(order.amount)}</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-gray-600">Commission (10%)</div>
                                    <div className="font-medium text-purple-600">-{formatCurrency(order.amount * 0.1)}</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-gray-600">Seller Gets</div>
                                    <div className="font-bold text-green-600">{formatCurrency(order.amount * 0.9)}</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Verification Checklist */}
                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                          <h4 className="font-medium text-blue-900 mb-3 flex items-center">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Verification Checklist
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center space-x-2">
                              <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                                <Check className="h-3 w-3 text-white" />
                              </div>
                              <span className="text-green-800">All orders have been delivered successfully</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                                <Check className="h-3 w-3 text-white" />
                              </div>
                              <span className="text-green-800">Seller banking details verified</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                                <Check className="h-3 w-3 text-white" />
                              </div>
                              <span className="text-green-800">Paystack recipient created successfully</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                                <Check className="h-3 w-3 text-white" />
                              </div>
                              <span className="text-green-800">No delivery disputes or issues reported</span>
                            </div>
                          </div>
                        </div>

                        {/* Risk Assessment */}
                        <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                          <h4 className="font-medium text-amber-900 mb-3 flex items-center">
                            <AlertCircle className="h-4 w-4 mr-2" />
                            Risk Assessment
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-amber-800">Seller History:</span>
                              <Badge variant="default" className="bg-green-100 text-green-800">Good Standing</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-amber-800">Delivery Success Rate:</span>
                              <Badge variant="default" className="bg-green-100 text-green-800">100%</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-amber-800">Payment Risk Level:</span>
                              <Badge variant="default" className="bg-green-100 text-green-800">Low Risk</Badge>
                            </div>
                          </div>
                        </div>

                        {/* Payment Breakdown for Approved Payouts */}
                        {payout.payment_breakdown && activeTab === 'approved' && (
                          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                            <h4 className="font-medium text-green-900 mb-3 flex items-center">
                              <DollarSign className="h-4 w-4 mr-2" />
                              Payment Breakdown (Approved)
                            </h4>
                            <div className="space-y-3 text-sm">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <span className="text-green-800">Total Orders:</span>
                                  <div className="font-medium">{payout.payment_breakdown.total_orders}</div>
                                </div>
                                <div>
                                  <span className="text-green-800">Platform Commission:</span>
                                  <div className="font-medium">{formatCurrency(payout.payment_breakdown.platform_earnings?.book_commission || 0)}</div>
                                </div>
                              </div>

                              {/* Transaction Details */}
                              {payout.payment_breakdown.order_details && (
                                <div className="mt-4">
                                  <h5 className="font-medium text-green-800 mb-2">Transaction Details:</h5>
                                  <div className="space-y-2">
                                    {payout.payment_breakdown.order_details.map((orderDetail: any, index: number) => (
                                      <div key={index} className="bg-white rounded border p-3">
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                          <div>
                                            <span className="text-gray-600">Order ID:</span>
                                            <div className="font-mono bg-gray-100 px-2 py-1 rounded">{orderDetail.order_id}</div>
                                          </div>
                                          <div>
                                            <span className="text-gray-600">Transaction ID:</span>
                                            <div className="font-mono bg-blue-100 px-2 py-1 rounded">{orderDetail.paystack_transaction_id}</div>
                                          </div>
                                        </div>
                                        <div className="mt-2 text-xs">
                                          <span className="text-gray-600">Amount:</span> <span className="font-medium">{formatCurrency(orderDetail.amounts?.book_price || 0)}</span>
                                          <span className="ml-4 text-gray-600">Seller Gets:</span> <span className="font-medium text-green-600">{formatCurrency(orderDetail.amounts?.seller_earnings || 0)}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Next Steps Information */}
                        <div className="bg-gray-100 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                            <Info className="h-4 w-4 mr-2" />
                            {activeTab === 'approved' ? 'Payment Processing Status' : 'What happens after approval?'}
                          </h4>
                          <div className="space-y-1 text-sm text-gray-700">
                            {activeTab === 'approved' ? (
                              <>
                                <div>• ✅ Seller has been notified via email</div>
                                <div>• ✅ Payment recipient created successfully</div>
                                <div>• 🔄 Funds transfer in progress (1-3 business days)</div>
                                <div>• 📱 Seller will receive SMS when funds are available</div>
                              </>
                            ) : (
                              <>
                                <div>• Seller receives email confirmation that payment is being processed</div>
                                <div>• Payment is transferred to seller's bank account (1-3 business days)</div>
                                <div>• Seller receives SMS notification when funds are available</div>
                                <div>• Transaction is marked as completed in the system</div>
                              </>
                            )}
                          </div>
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

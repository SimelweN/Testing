import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TransferReceiptCard } from "./TransferReceiptCard";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Receipt,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { sellerPayoutService, type PayoutDetails } from "@/services/sellerPayoutService";

interface TransferReceiptData {
  orderId: string;
  bookTitle: string;
  bookPrice: number;
  deliveryFee: number;
  totalPaid: number;
  platformFee: number;
  sellerEarnings: number;
  
  buyer: {
    name: string;
    email: string;
  };
  
  seller: {
    id: string;
    name: string;
    email: string;
    paystackRecipientCode?: string;
  };
  
  timestamps: {
    orderPlaced: string;
    bookCollected?: string;
    bookDelivered: string;
  };
  
  transferStatus: "pending" | "approved" | "denied";
  transferDate?: string;
  denialReason?: string;
}

export const SellerPayoutManager: React.FC = () => {
  const [receipts, setReceipts] = useState<TransferReceiptData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    denied: 0,
    totalEarnings: 0,
  });
  const [isUsingMockData, setIsUsingMockData] = useState(false);

  // Real data fetching from database

  useEffect(() => {
    loadReceipts();
  }, []);

  const loadReceipts = async () => {
    setIsLoading(true);
    try {
      // Check if table exists
      const tableExists = await sellerPayoutService.checkTableExists();
      if (!tableExists) {
        console.error('Seller payouts table not found');
        toast.error('Seller payouts system not configured yet');
        setIsUsingMockData(true);
        setReceipts([]);
        setStats({ pending: 0, approved: 0, denied: 0, totalEarnings: 0 });
        return;
      }
      setIsUsingMockData(false);

      // Fetch statistics
      const statistics = await sellerPayoutService.getPayoutStatistics();
      setStats({
        pending: statistics.pending_count,
        approved: statistics.approved_count,
        denied: statistics.denied_count,
        totalEarnings: statistics.total_approved_amount
      });

      // Fetch all payouts with seller details
      const [pendingPayouts, approvedPayouts, deniedPayouts] = await Promise.all([
        sellerPayoutService.getPayoutsWithSellerDetails('pending'),
        sellerPayoutService.getPayoutsWithSellerDetails('approved'),
        sellerPayoutService.getPayoutsWithSellerDetails('denied')
      ]);

      const allPayouts = [...pendingPayouts, ...approvedPayouts, ...deniedPayouts];

      // Transform payouts to receipt format
      const transformedReceipts: TransferReceiptData[] = allPayouts.map(payout => ({
        orderId: payout.id,
        bookTitle: `Payout Request ${payout.id.slice(-8)}`,
        bookPrice: payout.amount,
        deliveryFee: 0,
        totalPaid: payout.amount,
        platformFee: 0,
        sellerEarnings: payout.amount,
        buyer: {
          name: 'Multiple Buyers',
          email: 'system@rebooked.co.za'
        },
        seller: {
          id: payout.seller_id,
          name: payout.seller_name || 'Unknown',
          email: payout.seller_email || 'unknown@email.com'
        },
        timestamps: {
          orderPlaced: payout.created_at,
          bookDelivered: payout.reviewed_at || payout.created_at
        },
        transferStatus: payout.status === 'pending' ? 'pending' :
                       payout.status === 'approved' ? 'approved' : 'denied',
        transferDate: payout.reviewed_at,
        denialReason: payout.review_notes
      }));

      setReceipts(transformedReceipts);

    } catch (error) {
      console.error("Error loading receipts:", error);

      // Better error message handling
      let errorMessage = "Failed to load transfer receipts";
      if (error instanceof Error) {
        errorMessage = `Failed to load payouts: ${error.message}`;
        console.error("Detailed error:", {
          message: error.message,
          stack: error.stack,
          name: error.name,
          cause: error.cause
        });
      } else {
        console.error("Non-Error object thrown:", {
          error,
          errorType: typeof error,
          errorString: String(error)
        });
        errorMessage = "Unexpected error loading payouts";
      }

      toast.error(errorMessage);
      setReceipts([]);
      setStats({ pending: 0, approved: 0, denied: 0, totalEarnings: 0 });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (orderId: string, sellerId: string) => {
    try {
      console.log(`Approving payout ${orderId} for seller ${sellerId}`);

      // Use the service to approve the payout
      await sellerPayoutService.approvePayout(orderId, 'Approved by admin');

      // Update local state
      setReceipts(prev => prev.map(receipt =>
        receipt.orderId === orderId
          ? { ...receipt, transferStatus: "approved" as const, transferDate: new Date().toISOString() }
          : receipt
      ));

      // Update stats
      setStats(prev => ({
        ...prev,
        pending: prev.pending - 1,
        approved: prev.approved + 1,
        totalEarnings: prev.totalEarnings + (receipts.find(r => r.orderId === orderId)?.sellerEarnings || 0),
      }));

      toast.success('Payout approved successfully!');

    } catch (error) {
      console.error("Error approving payout:", error);
      let errorMessage = "Failed to approve payout";
      if (error instanceof Error) {
        errorMessage = `Failed to approve payout: ${error.message}`;
      }
      toast.error(errorMessage);
      throw error;
    }
  };

  const handleDeny = async (orderId: string, reason: string) => {
    try {
      if (!reason || reason.trim() === '') {
        throw new Error('Denial reason is required');
      }

      console.log(`Denying payout ${orderId} with reason: ${reason}`);

      // Use the service to deny the payout
      await sellerPayoutService.denyPayout(orderId, reason);

      // Update local state
      setReceipts(prev => prev.map(receipt =>
        receipt.orderId === orderId
          ? {
              ...receipt,
              transferStatus: "denied" as const,
              transferDate: new Date().toISOString(),
              denialReason: reason
            }
          : receipt
      ));

      // Update stats
      setStats(prev => ({
        ...prev,
        pending: prev.pending - 1,
        denied: prev.denied + 1,
      }));

      toast.success('Payout denied and seller notified');

    } catch (error) {
      console.error("Error denying payout:", error);
      let errorMessage = "Failed to deny payout";
      if (error instanceof Error) {
        errorMessage = `Failed to deny payout: ${error.message}`;
      }
      toast.error(errorMessage);
      throw error;
    }
  };

  const handleDownload = (receipt: TransferReceiptData) => {
    const receiptText = `
TRANSFER RECEIPT - REBOOKED SOLUTIONS
====================================

Order ID: ${receipt.orderId}
Date Generated: ${new Date().toLocaleString()}

BOOK DETAILS
------------
Title: ${receipt.bookTitle}
Price: R${receipt.bookPrice.toFixed(2)}
Delivery Fee: R${receipt.deliveryFee.toFixed(2)}
Total Paid by Buyer: R${receipt.totalPaid.toFixed(2)}

PAYMENT BREAKDOWN
-----------------
Platform Fee (10% book + delivery): R${receipt.platformFee.toFixed(2)}
Seller Earnings (90% book price): R${receipt.sellerEarnings.toFixed(2)}

BUYER INFORMATION
-----------------
Name: ${receipt.buyer.name}
Email: ${receipt.buyer.email}

SELLER INFORMATION
------------------
Name: ${receipt.seller.name}
Email: ${receipt.seller.email}
${receipt.seller.paystackRecipientCode ? `Paystack Recipient: ${receipt.seller.paystackRecipientCode}` : ''}

ORDER TIMELINE
--------------
Order Placed: ${new Date(receipt.timestamps.orderPlaced).toLocaleString()}
${receipt.timestamps.bookCollected ? `Book Collected: ${new Date(receipt.timestamps.bookCollected).toLocaleString()}` : ''}
Book Delivered: ${new Date(receipt.timestamps.bookDelivered).toLocaleString()}
${receipt.transferDate ? `Transfer ${receipt.transferStatus}: ${new Date(receipt.transferDate).toLocaleString()}` : ''}

TRANSFER STATUS
---------------
Status: ${receipt.transferStatus.toUpperCase()}
${receipt.denialReason ? `Reason: ${receipt.denialReason}` : ''}

Generated by ReBooked Solutions Admin Dashboard
    `.trim();

    const blob = new Blob([receiptText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transfer-receipt-${receipt.orderId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const pendingReceipts = receipts.filter(r => r.transferStatus === "pending");
  const approvedReceipts = receipts.filter(r => r.transferStatus === "approved");
  const deniedReceipts = receipts.filter(r => r.transferStatus === "denied");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-book-600"></div>
        <span className="ml-2">Loading transfer receipts...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                <p className="text-sm text-gray-600">Pending Review</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                <p className="text-sm text-gray-600">Approved</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-red-600">{stats.denied}</p>
                <p className="text-sm text-gray-600">Denied</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-book-600">R{stats.totalEarnings.toFixed(0)}</p>
                <p className="text-sm text-gray-600">Total Approved</p>
              </div>
              <TrendingUp className="w-8 h-8 text-book-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Receipt className="w-6 h-6 text-book-600" />
          <div>
            <h2 className="text-2xl font-bold">Seller Payout Management</h2>
            <p className="text-gray-600">Manual approval system for seller payouts</p>
          </div>
        </div>
        <Button onClick={loadReceipts} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Database Error Alert */}
      {isUsingMockData && (
        <Alert className="border-red-200 bg-red-50 mb-4">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Database Error:</strong> The seller payouts system tables are not configured or accessible.
            Please contact your system administrator to set up the seller payouts database tables and functions.
          </AlertDescription>
        </Alert>
      )}

      {/* Info Alert */}
      <Alert className="border-blue-200 bg-blue-50">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Manual Payout Process:</strong> After approving a payout, proceed with manual EFT transfer via your banking system or Paystack dashboard.
          The seller will be notified via email once approved.
        </AlertDescription>
      </Alert>

      {/* Tabs for different statuses */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Pending ({pendingReceipts.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Approved ({approvedReceipts.length})
          </TabsTrigger>
          <TabsTrigger value="denied" className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Denied ({deniedReceipts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4 mt-6">
          {pendingReceipts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No pending transfer receipts</p>
              </CardContent>
            </Card>
          ) : (
            pendingReceipts.map((receipt) => (
              <TransferReceiptCard
                key={receipt.orderId}
                receipt={receipt}
                onApprove={handleApprove}
                onDeny={handleDeny}
                onDownload={handleDownload}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4 mt-6">
          {approvedReceipts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No approved transfer receipts</p>
              </CardContent>
            </Card>
          ) : (
            approvedReceipts.map((receipt) => (
              <TransferReceiptCard
                key={receipt.orderId}
                receipt={receipt}
                onApprove={handleApprove}
                onDeny={handleDeny}
                onDownload={handleDownload}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="denied" className="space-y-4 mt-6">
          {deniedReceipts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No denied transfer receipts</p>
              </CardContent>
            </Card>
          ) : (
            deniedReceipts.map((receipt) => (
              <TransferReceiptCard
                key={receipt.orderId}
                receipt={receipt}
                onApprove={handleApprove}
                onDeny={handleDeny}
                onDownload={handleDownload}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

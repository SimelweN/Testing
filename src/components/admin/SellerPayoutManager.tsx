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

  // Mock data for testing - replace with actual data fetching
  const mockReceipts: TransferReceiptData[] = [
    {
      orderId: "ORD-2024-001",
      bookTitle: "Introduction to Computer Science",
      bookPrice: 450,
      deliveryFee: 50,
      totalPaid: 500,
      platformFee: 95, // 10% of 450 (45) + 50 delivery = 95
      sellerEarnings: 405, // 90% of 450 = 405
      buyer: {
        name: "John Smith",
        email: "john.smith@example.com",
      },
      seller: {
        id: "seller-123",
        name: "Sarah Johnson",
        email: "sarah.j@example.com",
        paystackRecipientCode: "RCP_abc123",
      },
      timestamps: {
        orderPlaced: "2024-01-15T10:00:00Z",
        bookCollected: "2024-01-16T14:30:00Z",
        bookDelivered: "2024-01-18T16:45:00Z",
      },
      transferStatus: "pending",
    },
    {
      orderId: "ORD-2024-002",
      bookTitle: "Advanced Mathematics",
      bookPrice: 380,
      deliveryFee: 50,
      totalPaid: 430,
      platformFee: 88, // 10% of 380 (38) + 50 delivery = 88
      sellerEarnings: 342, // 90% of 380 = 342
      buyer: {
        name: "Emma Wilson",
        email: "emma.w@example.com",
      },
      seller: {
        id: "seller-456",
        name: "Mike Chen",
        email: "mike.chen@example.com",
      },
      timestamps: {
        orderPlaced: "2024-01-14T09:15:00Z",
        bookDelivered: "2024-01-17T11:20:00Z",
      },
      transferStatus: "approved",
      transferDate: "2024-01-17T15:00:00Z",
    },
    {
      orderId: "ORD-2024-003",
      bookTitle: "Business Management Fundamentals",
      bookPrice: 320,
      deliveryFee: 50,
      totalPaid: 370,
      platformFee: 82, // 10% of 320 (32) + 50 delivery = 82
      sellerEarnings: 288, // 90% of 320 = 288
      buyer: {
        name: "David Lee",
        email: "david.lee@example.com",
      },
      seller: {
        id: "seller-789",
        name: "Lisa Brown",
        email: "lisa.brown@example.com",
      },
      timestamps: {
        orderPlaced: "2024-01-13T16:30:00Z",
        bookDelivered: "2024-01-16T10:15:00Z",
      },
      transferStatus: "denied",
      transferDate: "2024-01-16T17:00:00Z",
      denialReason: "Buyer reported book condition was not as described. Investigating the matter.",
    },
  ];

  useEffect(() => {
    loadReceipts();
  }, []);

  const loadReceipts = async () => {
    setIsLoading(true);
    try {
      // For now, use mock data
      // In production, this would fetch from your database
      setReceipts(mockReceipts);
      
      // Calculate stats
      const pending = mockReceipts.filter(r => r.transferStatus === "pending").length;
      const approved = mockReceipts.filter(r => r.transferStatus === "approved").length;
      const denied = mockReceipts.filter(r => r.transferStatus === "denied").length;
      const totalEarnings = mockReceipts
        .filter(r => r.transferStatus === "approved")
        .reduce((sum, r) => sum + r.sellerEarnings, 0);

      setStats({ pending, approved, denied, totalEarnings });
    } catch (error) {
      console.error("Error loading receipts:", error);
      toast.error("Failed to load transfer receipts");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (orderId: string, sellerId: string) => {
    try {
      // 1. Create Paystack Recipient if not exists
      console.log(`Creating Paystack recipient for seller ${sellerId}`);
      
      // 2. Update transfer status
      setReceipts(prev => prev.map(receipt => 
        receipt.orderId === orderId 
          ? { ...receipt, transferStatus: "approved" as const, transferDate: new Date().toISOString() }
          : receipt
      ));

      // 3. Send approval email to seller
      console.log(`Sending approval email for order ${orderId}`);
      
      // 4. Update stats
      setStats(prev => ({
        ...prev,
        pending: prev.pending - 1,
        approved: prev.approved + 1,
        totalEarnings: prev.totalEarnings + (receipts.find(r => r.orderId === orderId)?.sellerEarnings || 0),
      }));

      // TODO: Implement actual Paystack integration and email sending
      // await paystackService.createRecipient(seller);
      // await emailService.sendApprovalEmail(seller, orderDetails);
      
    } catch (error) {
      console.error("Error approving payout:", error);
      throw error;
    }
  };

  const handleDeny = async (orderId: string, reason: string) => {
    try {
      // 1. Update transfer status with denial reason
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

      // 2. Send denial email to seller
      console.log(`Sending denial email for order ${orderId} with reason: ${reason}`);

      // 3. Update stats
      setStats(prev => ({
        ...prev,
        pending: prev.pending - 1,
        denied: prev.denied + 1,
      }));

      // TODO: Implement actual email sending
      // await emailService.sendDenialEmail(seller, orderDetails, reason);
      
    } catch (error) {
      console.error("Error denying payout:", error);
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

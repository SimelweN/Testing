import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle,
  XCircle,
  Clock,
  User,
  BookOpen,
  Truck,
  DollarSign,
  Mail,
  Calendar,
  Receipt,
  CreditCard,
  AlertTriangle,
  Download,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";

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

interface TransferReceiptCardProps {
  receipt: TransferReceiptData;
  onApprove: (orderId: string, sellerId: string) => Promise<void>;
  onDeny: (orderId: string, reason: string) => Promise<void>;
  onDownload: (receipt: TransferReceiptData) => void;
  onCreateRecipient?: (receipt: TransferReceiptData) => Promise<void>;
}

export const TransferReceiptCard: React.FC<TransferReceiptCardProps> = ({
  receipt,
  onApprove,
  onDeny,
  onDownload,
  onCreateRecipient,
}) => {
  const [isApproving, setIsApproving] = useState(false);
  const [isDenying, setIsDenying] = useState(false);
  const [showDenialForm, setShowDenialForm] = useState(false);
  const [denialReason, setDenialReason] = useState("");

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await onApprove(receipt.orderId, receipt.seller.id);
      toast.success("Payout approved successfully!");
    } catch (error) {
      console.error("Error approving payout:", error);
      toast.error("Failed to approve payout");
    } finally {
      setIsApproving(false);
    }
  };

  const handleDeny = async () => {
    if (!denialReason.trim()) {
      toast.error("Please provide a reason for denial");
      return;
    }

    setIsDenying(true);
    try {
      await onDeny(receipt.orderId, denialReason);
      toast.success("Payout denied and seller notified");
      setShowDenialForm(false);
      setDenialReason("");
    } catch (error) {
      console.error("Error denying payout:", error);
      toast.error("Failed to deny payout");
    } finally {
      setIsDenying(false);
    }
  };

  const getStatusBadge = () => {
    switch (receipt.transferStatus) {
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending Review</Badge>;
      case "approved":
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case "denied":
        return <Badge variant="secondary" className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Denied</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Receipt className="w-5 h-5 text-book-600" />
            <div>
              <CardTitle className="text-lg">Transfer Receipt #{receipt.orderId.slice(-8)}</CardTitle>
              <p className="text-sm text-gray-500">Delivered: {new Date(receipt.timestamps.bookDelivered).toLocaleDateString()}</p>
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Book Details */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-book-600" />
            <h4 className="font-semibold">Book Details</h4>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">{receipt.bookTitle}</span>
              <span className="text-book-600 font-semibold">R{receipt.bookPrice.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Truck className="w-3 h-3" />
                Delivery Fee
              </span>
              <span>R{receipt.deliveryFee.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Payment Breakdown */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-4 h-4 text-blue-600" />
            <h4 className="font-semibold">Payment Breakdown</h4>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Total Paid by Buyer</span>
              <span className="font-medium">R{receipt.totalPaid.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-sm text-red-600">
              <span>Platform Fee (10% book + delivery)</span>
              <span>-R{receipt.platformFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold text-green-600">
              <span>Seller Earnings (90% book price)</span>
              <span>R{receipt.sellerEarnings.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Parties Involved */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-green-600" />
              <h5 className="font-medium text-green-800">Buyer</h5>
            </div>
            <div className="text-sm space-y-1">
              <p className="font-medium">{receipt.buyer.name}</p>
              <p className="text-gray-600 flex items-center gap-1">
                <Mail className="w-3 h-3" />
                {receipt.buyer.email}
              </p>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="w-4 h-4 text-blue-600" />
              <h5 className="font-medium text-blue-800">Seller</h5>
            </div>
            <div className="text-sm space-y-1">
              <p className="font-medium">{receipt.seller.name}</p>
              <p className="text-gray-600 flex items-center gap-1">
                <Mail className="w-3 h-3" />
                {receipt.seller.email}
              </p>
              {receipt.seller.paystackRecipientCode && (
                <p className="text-xs text-gray-500">
                  Paystack: {receipt.seller.paystackRecipientCode}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-gray-600" />
            <h4 className="font-semibold">Order Timeline</h4>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Order Placed</span>
              <span>{new Date(receipt.timestamps.orderPlaced).toLocaleString()}</span>
            </div>
            {receipt.timestamps.bookCollected && (
              <div className="flex justify-between">
                <span>Book Collected</span>
                <span>{new Date(receipt.timestamps.bookCollected).toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Book Delivered</span>
              <span>{new Date(receipt.timestamps.bookDelivered).toLocaleString()}</span>
            </div>
            {receipt.transferDate && (
              <div className="flex justify-between font-medium">
                <span>Transfer {receipt.transferStatus === "approved" ? "Approved" : "Denied"}</span>
                <span>{new Date(receipt.transferDate).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Denial Reason */}
        {receipt.transferStatus === "denied" && receipt.denialReason && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Denial Reason:</strong> {receipt.denialReason}
            </AlertDescription>
          </Alert>
        )}

        {/* Denial Form */}
        {showDenialForm && (
          <div className="bg-red-50 rounded-lg p-4 space-y-3">
            <h5 className="font-medium text-red-800">Deny Payout</h5>
            <textarea
              value={denialReason}
              onChange={(e) => setDenialReason(e.target.value)}
              placeholder="Please provide a reason for denying this payout..."
              className="w-full p-3 border border-red-200 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
              rows={3}
            />
            <div className="flex gap-2">
              <Button
                onClick={handleDeny}
                disabled={isDenying || !denialReason.trim()}
                variant="destructive"
                size="sm"
              >
                {isDenying ? "Denying..." : "Confirm Denial"}
              </Button>
              <Button
                onClick={() => {
                  setShowDenialForm(false);
                  setDenialReason("");
                }}
                variant="outline"
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 pt-4 border-t">
          <Button
            onClick={() => onDownload(receipt)}
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-none"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Receipt
          </Button>

          {receipt.transferStatus === "pending" && onCreateRecipient && !receipt.seller.paystackRecipientCode && (
            <Button
              onClick={() => onCreateRecipient(receipt)}
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-none border-blue-300 text-blue-600 hover:bg-blue-50"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Create Paystack Recipient
            </Button>
          )}

          {receipt.transferStatus === "pending" && (
            <>
              <Button
                onClick={handleApprove}
                disabled={isApproving}
                className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700"
                size="sm"
              >
                {isApproving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Approving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve Payout
                  </>
                )}
              </Button>

              <Button
                onClick={() => setShowDenialForm(true)}
                variant="destructive"
                size="sm"
                className="flex-1 sm:flex-none"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Deny Payout
              </Button>
            </>
          )}

          {receipt.transferStatus === "approved" && (
            <div className="flex-1 sm:flex-none bg-green-100 text-green-800 px-3 py-2 rounded text-sm font-medium text-center">
              ✅ Payout Approved - Proceed with manual EFT
            </div>
          )}

          {receipt.transferStatus === "denied" && (
            <div className="flex-1 sm:flex-none bg-red-100 text-red-800 px-3 py-2 rounded text-sm font-medium text-center">
              ❌ Payout Denied - Seller Notified
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Shield,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Lock,
  Info,
  ArrowRight,
  Building2,
  Eye,
  Settings,
  Loader2,
  Copy,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { BankingService } from "@/services/bankingService";
import { useBanking } from "@/hooks/useBanking";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { BankingSubaccount } from "@/types/banking";
import SubaccountView from "@/components/banking/SubaccountView";
import SubaccountEditForm from "@/components/banking/SubaccountEditForm";
import BankingForm from "@/components/banking/BankingForm";
import { PaystackSubaccountService } from "@/services/paystackSubaccountService";
import BankingDecryptionService, { type DecryptedBankingDetails } from "@/services/bankingDecryptionService";

const BankingProfileTab = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    bankingDetails,
    isLoading,
    hasBankingSetup,
    isActive,
    businessName,
    bankName,
    maskedAccountNumber,
    refreshBankingDetails,
  } = useBanking();

  const [viewMode, setViewMode] = useState<"summary" | "detailed" | "edit">(
    "summary",
  );
  const [subaccountCode, setSubaccountCode] = useState<string | null>(null);
  const [loadingSubaccount, setLoadingSubaccount] = useState(false);
  const [decryptedDetails, setDecryptedDetails] = useState<DecryptedBankingDetails | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [showFullAccount, setShowFullAccount] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);

  const handleSetupBanking = () => {
    navigate("/banking-setup");
  };

  const handleDecryptAndView = async () => {
    setIsDecrypting(true);
    try {
      const result = await BankingDecryptionService.decryptBankingDetails();
      if (result.success && result.data) {
        setDecryptedDetails(result.data);
        setShowFullAccount(true);
        toast.success("Banking details decrypted successfully");
      } else {
        toast.error(result.error || "Failed to decrypt banking details");
      }
    } catch (error) {
      console.error("Decryption error:", error);
      toast.error("Failed to decrypt banking details");
    } finally {
      setIsDecrypting(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const handleViewDetailed = async () => {
    if (!subaccountCode) {
      setLoadingSubaccount(true);
      try {
        const code = await PaystackSubaccountService.getUserSubaccountCode();
        if (code) {
          setSubaccountCode(code);
          setViewMode("detailed");
        } else {
          toast.error("No subaccount found");
        }
      } catch (error) {
        toast.error("Failed to load subaccount details");
      } finally {
        setLoadingSubaccount(false);
      }
    } else {
      setViewMode("detailed");
    }
  };

  const handleEditSuccess = () => {
    setViewMode("summary");
    refreshBankingDetails();
    toast.success("Banking details updated successfully!");
  };

  const handleBackToSummary = () => {
    setViewMode("summary");
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-book-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show detailed subaccount view
  if (viewMode === "detailed" && subaccountCode) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Button
            onClick={handleBackToSummary}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            ← Back to Summary
          </Button>
        </div>
        <SubaccountView
          onEdit={() => setViewMode("edit")}
          showEditButton={true}
        />
      </div>
    );
  }

  // Show subaccount edit form
  if (viewMode === "edit" && subaccountCode) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Button
            onClick={handleBackToSummary}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            ← Back to Summary
          </Button>
        </div>
        <SubaccountEditForm
          subaccountCode={subaccountCode}
          onSuccess={handleEditSuccess}
          onCancel={handleBackToSummary}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Banking Profile
            {isActive && (
              <Badge variant="default" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            )}
            {bankingDetails && !isActive && (
              <Badge
                variant="outline"
                className="border-orange-500 text-orange-700"
              >
                <AlertTriangle className="h-3 w-3 mr-1" />
                {bankingDetails.status === "pending"
                  ? "Pending Verification"
                  : "Inactive"}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Banking information is required to list books for sale. Your
              information is stored securely and encrypted. This integrates with
              Paystack for secure payment processing.
            </AlertDescription>
          </Alert>

          {!hasBankingSetup && (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Set Up Banking Information
              </h3>
              <p className="text-gray-600 mb-4">
                Add your banking details to start selling books and receive
                payments securely through our integrated payment system.
              </p>
              <Button
                onClick={handleSetupBanking}
                className="bg-book-600 hover:bg-book-700"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Set Up Banking
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}

          {hasBankingSetup && bankingDetails && (
            <div className="space-y-6">
              {/* Banking Overview Card */}
              <div className="bg-gradient-to-r from-book-50 to-green-50 p-6 rounded-lg border border-book-200">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-book-700">
                      Business Name
                    </label>
                    <p className="text-book-900 font-semibold">{businessName}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-book-700">
                      Bank
                    </label>
                    <p className="text-book-900 font-semibold">{bankName}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-book-700">
                      Account Number
                    </label>
                    <div className="flex items-center gap-2">
                      <p className="text-book-900 font-mono font-semibold">
                        {showFullAccount && decryptedDetails?.account_number
                          ? decryptedDetails.account_number
                          : maskedAccountNumber}
                      </p>
                      {showFullAccount && decryptedDetails?.account_number && (
                        <Button
                          onClick={() => copyToClipboard(decryptedDetails.account_number, "Account Number")}
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-book-600 hover:text-book-800"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-book-700">
                      Status
                    </label>
                    <div>
                      <Badge
                        variant={isActive ? "default" : "outline"}
                        className={
                          isActive
                            ? "bg-green-100 text-green-800 border-green-200"
                            : "border-orange-500 text-orange-700"
                        }
                      >
                        {isActive ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {bankingDetails.status}
                          </>
                        )}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-book-700">
                      Email
                    </label>
                    <p className="text-book-900">{bankingDetails.email}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-book-700">
                      Setup Date
                    </label>
                    <p className="text-book-900">
                      {new Date(bankingDetails.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={showFullAccount ? handleViewDetailed : handleDecryptAndView}
                  className="bg-book-600 hover:bg-book-700 flex items-center gap-2"
                  disabled={isDecrypting || loadingSubaccount}
                >
                  {isDecrypting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  {showFullAccount ? "View Full Details" : "View Details"}
                </Button>
                {showFullAccount && (
                  <Button
                    onClick={() => {
                      setShowFullAccount(false);
                      setDecryptedDetails(null);
                    }}
                    variant="outline"
                    className="border-book-200 text-book-600 hover:bg-book-50"
                  >
                    Hide Details
                  </Button>
                )}
                <Button
                  onClick={refreshBankingDetails}
                  variant="outline"
                  size="sm"
                  className="border-book-200 text-book-600 hover:bg-book-50"
                >
                  Refresh Status
                </Button>
              </div>

              {/* Decrypted Details Display */}
              {showFullAccount && decryptedDetails && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Decrypted Banking Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="font-medium text-blue-800">Full Account Number:</label>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="bg-blue-100 px-2 py-1 rounded text-blue-900 font-mono">
                          {decryptedDetails.account_number}
                        </code>
                        <Button
                          onClick={() => copyToClipboard(decryptedDetails.account_number, "Account Number")}
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <label className="font-medium text-blue-800">Bank Code:</label>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="bg-blue-100 px-2 py-1 rounded text-blue-900 font-mono">
                          {decryptedDetails.bank_code}
                        </code>
                        <Button
                          onClick={() => copyToClipboard(decryptedDetails.bank_code, "Bank Code")}
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    {decryptedDetails.subaccount_code && (
                      <div>
                        <label className="font-medium text-blue-800">Subaccount Code:</label>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="bg-blue-100 px-2 py-1 rounded text-blue-900 font-mono">
                            {decryptedDetails.subaccount_code}
                          </code>
                          <Button
                            onClick={() => copyToClipboard(decryptedDetails.subaccount_code!, "Subaccount Code")}
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-900 mb-1">Security & Privacy</h4>
                    <p className="text-sm text-green-800">
                      Your banking details are encrypted at rest and only decrypted when you explicitly
                      click "View Details". All payments are processed through Paystack's secure infrastructure.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {hasBankingSetup && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Payment Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">
                How Payments Work
              </h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• You receive 90% of each book sale</li>
                <li>• ReBooked Marketplace keeps 10% as platform fee</li>
                <li>
                  • Payments are held in escrow until delivery confirmation
                </li>
                <li>
                  • Funds are released to your account within 1-2 business days
                  after delivery
                </li>
                <li>
                  • All transactions are processed securely through Paystack
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Additional information for new banking system */}
      {hasBankingSetup && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              Security & Verification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span className="text-sm font-medium text-blue-900">
                  Paystack Integration
                </span>
                <Badge className="bg-blue-100 text-blue-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-sm font-medium text-green-900">
                  Bank Account Verification
                </span>
                <Badge
                  className={
                    isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-orange-100 text-orange-800"
                  }
                >
                  {isActive ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verified
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Pending
                    </>
                  )}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <span className="text-sm font-medium text-purple-900">
                  Split Payment Setup
                </span>
                <Badge className="bg-purple-100 text-purple-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Configured
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BankingProfileTab;

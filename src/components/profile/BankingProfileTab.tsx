import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Lock,
  Info,
  ArrowRight,
  Building2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { BankingService } from "@/services/bankingService";
import { useBanking } from "@/hooks/useBanking";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { BankingSubaccount } from "@/types/banking";

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

  const handleSetupBanking = () => {
    navigate("/banking-setup");
  };

  const handleEditBanking = () => {
    navigate("/banking-setup");
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
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Business Name
                  </label>
                  <p className="text-sm text-gray-900 mt-1">{businessName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Bank
                  </label>
                  <p className="text-sm text-gray-900 mt-1">{bankName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Account Number
                  </label>
                  <p className="text-sm text-gray-900 mt-1 font-mono">
                    {maskedAccountNumber}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <div className="mt-1">
                    <Badge
                      variant={isActive ? "default" : "outline"}
                      className={
                        isActive
                          ? "bg-green-100 text-green-800"
                          : "border-orange-500 text-orange-700"
                      }
                    >
                      {bankingDetails.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <p className="text-sm text-gray-900 mt-1">
                    {bankingDetails.email}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Setup Date
                  </label>
                  <p className="text-sm text-gray-900 mt-1">
                    {new Date(bankingDetails.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleEditBanking}
                  variant="outline"
                  className="border-book-200 text-book-600 hover:bg-book-50"
                >
                  Update Banking Details
                </Button>
                <Button
                  onClick={refreshBankingDetails}
                  variant="outline"
                  size="sm"
                >
                  Refresh Status
                </Button>
              </div>

              <Alert>
                <Lock className="h-4 w-4" />
                <AlertDescription>
                  Banking details are securely managed through Paystack. Updates
                  require verification to protect your account from unauthorized
                  changes.
                </AlertDescription>
              </Alert>
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
                <li>• ReBooked keeps 10% as platform fee</li>
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

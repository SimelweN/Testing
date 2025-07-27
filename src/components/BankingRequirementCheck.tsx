import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  AlertTriangle,
  CreditCard,
  MapPin,
  Clock,
  ArrowRight,
} from "lucide-react";
import { BankingService } from "@/services/bankingService";
import type { BankingRequirementsStatus } from "@/types/banking";
import { useAuth } from "@/contexts/AuthContext";

interface BankingRequirementCheckProps {
  onCanProceed: (canProceed: boolean) => void;
  children?: React.ReactNode;
}

const BankingRequirementCheck: React.FC<BankingRequirementCheckProps> = ({
  onCanProceed,
  children,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bankingStatus, setBankingStatus] =
    useState<BankingRequirementsStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkRequirements();
    }
  }, [user]);

  const checkRequirements = async (forceRefresh = false) => {
    if (!user) return;

    try {
      setLoading(true);
      console.log("🔍 Checking banking requirements for user:", user.id, forceRefresh ? "(forced refresh)" : "");

      // Force refresh banking details if needed
      if (forceRefresh) {
        // Clear any cached banking data by calling refresh first
        try {
          const freshBankingDetails = await BankingService.getUserBankingDetails(user.id);
          console.log("🔄 Fresh banking details:", freshBankingDetails);
        } catch (refreshError) {
          console.log("Note: Could not refresh banking details, proceeding with check...");
        }
      }

      const status = await BankingService.checkBankingRequirements(user.id);
      console.log("📊 Banking status result:", status);
      setBankingStatus(status);
      onCanProceed(status.canListBooks);
    } catch (error) {
      console.error("Error checking banking requirements:", error);
      onCanProceed(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
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

  if (!bankingStatus) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Unable to verify selling requirements. Please refresh the page.
        </AlertDescription>
      </Alert>
    );
  }

  if (bankingStatus.canListBooks) {
    return <>{children}</>;
  }

  return (
    <div className="space-y-6">
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <AlertTriangle className="h-5 w-5" />
            Setup Required to List Books
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-orange-700">
            To ensure secure transactions and proper payment processing, you
            need to complete the following requirements before listing books for
            sale:
          </p>

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
              <div className="flex-shrink-0">
                {bankingStatus.hasBankingInfo ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                )}
              </div>
              <div className="flex-1">
                <h4 className="font-medium">Banking Information</h4>
                <p className="text-sm text-gray-600">
                  Required for receiving payments (90% of sale price)
                </p>
              </div>
              <div className="flex-shrink-0">
                {bankingStatus.hasBankingInfo ? (
                  bankingStatus.isVerified ? (
                    <Badge
                      variant="default"
                      className="bg-green-100 text-green-800"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="border-orange-500 text-orange-700"
                    >
                      <Clock className="h-3 w-3 mr-1" />
                      Pending
                    </Badge>
                  )
                ) : (
                  <Badge
                    variant="outline"
                    className="border-red-500 text-red-700"
                  >
                    Missing
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
              <div className="flex-shrink-0">
                {bankingStatus.hasPickupAddress ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                )}
              </div>
              <div className="flex-1">
                <h4 className="font-medium">Pickup Address</h4>
                <p className="text-sm text-gray-600">
                  Required for book collection and delivery arrangements
                </p>
              </div>
              <div className="flex-shrink-0">
                {bankingStatus.hasPickupAddress ? (
                  <Badge
                    variant="default"
                    className="bg-green-100 text-green-800"
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Complete
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="border-red-500 text-red-700"
                  >
                    Missing
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {bankingStatus.missingRequirements.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc pl-4 space-y-1">
                  {bankingStatus.missingRequirements.map(
                    (requirement, index) => (
                      <li key={index} className="text-sm">
                        {requirement}
                      </li>
                    ),
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => navigate("/profile")}
              className="bg-book-600 hover:bg-book-700 flex-1 btn-mobile"
            >
              <CreditCard className="btn-mobile-icon" />
              <span className="btn-mobile-text">Set Up Banking & Address</span>
              <ArrowRight className="btn-mobile-icon" />
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/books")}
              className="flex-1 btn-mobile"
            >
              <span className="btn-mobile-text">Browse Books Instead</span>
            </Button>
            <Button
              variant="outline"
              onClick={checkRequirements}
              disabled={loading}
              className="sm:w-auto btn-mobile"
            >
              <span className="btn-mobile-text">Refresh Status</span>
            </Button>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">
              Why is this required?
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Secure payment processing through Paystack</li>
              <li>• 90/10 revenue split automation</li>
              <li>• Fraud prevention and buyer protection</li>
              <li>• Compliance with financial regulations</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BankingRequirementCheck;

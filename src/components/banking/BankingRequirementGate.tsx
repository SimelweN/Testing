import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CreditCard,
  MapPin,
  CheckCircle,
  AlertCircle,
  Settings,
  ArrowRight,
  Loader2,
  ShoppingBag,
  DollarSign,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { BankingService } from "@/services/bankingService";
import type { SellerRequirements } from "@/types/banking";

interface BankingRequirementGateProps {
  children: React.ReactNode;
  action?: string;
  showSetupPrompt?: boolean;
  className?: string;
}

const BankingRequirementGate: React.FC<BankingRequirementGateProps> = ({
  children,
  action = "receive payments",
  showSetupPrompt = true,
  className = "",
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requirements, setRequirements] = useState<SellerRequirements>({
    hasBankingSetup: false,
    hasPickupAddress: false,
    hasActiveBooks: false,
    canReceivePayments: false,
    setupCompletionPercentage: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkRequirements = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const reqs = await BankingService.getSellerRequirements(user.id);
        setRequirements(reqs);
      } catch (error) {
        console.error("Error checking requirements:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkRequirements();
  }, [user]);

  const handleSetupBanking = () => {
    navigate("/banking-setup");
  };

  const handleSetupAddress = () => {
    navigate("/profile?tab=address");
  };

  const handleManageBooks = () => {
    navigate("/dashboard?tab=books");
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-green-600" />
          <span className="text-gray-600">Checking seller requirements...</span>
        </div>
      </div>
    );
  }

  // If user is not authenticated, don't show gate
  if (!user) {
    return <div className={className}>{children}</div>;
  }

  // If all requirements are met, render children
  if (requirements.canReceivePayments) {
    return <div className={className}>{children}</div>;
  }

  // Show setup requirements
  if (!showSetupPrompt) {
    return null;
  }

  return (
    <div className={className}>
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-6 w-6 text-orange-600" />
              Complete Setup to {action}
            </div>
            <Badge variant="outline" className="bg-white">
              {requirements.setupCompletionPercentage}% Complete
            </Badge>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${requirements.setupCompletionPercentage}%` }}
            />
          </div>

          <p className="text-gray-700">
            You need to complete a few more steps before you can {action}:
          </p>

          {/* Requirements List */}
          <div className="space-y-4">
            {/* Banking Setup */}
            <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
              <div className="flex items-center gap-3">
                {requirements.hasBankingSetup ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                )}
                <div>
                  <h4 className="font-medium">Banking Details</h4>
                  <p className="text-sm text-gray-600">
                    Set up your bank account for payments
                  </p>
                </div>
              </div>
              {!requirements.hasBankingSetup && (
                <Button
                  size="sm"
                  onClick={handleSetupBanking}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Set Up
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>

            {/* Pickup Address */}
            <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
              <div className="flex items-center gap-3">
                {requirements.hasPickupAddress ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                )}
                <div>
                  <h4 className="font-medium">Pickup Address</h4>
                  <p className="text-sm text-gray-600">
                    Add your address for book collection
                  </p>
                </div>
              </div>
              {!requirements.hasPickupAddress && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSetupAddress}
                >
                  Add Address
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>

            {/* Active Books */}
            <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
              <div className="flex items-center gap-3">
                {requirements.hasActiveBooks ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                )}
                <div>
                  <h4 className="font-medium">Books for Sale</h4>
                  <p className="text-sm text-gray-600">
                    List at least one book for sale
                  </p>
                </div>
              </div>
              {!requirements.hasActiveBooks && (
                <Button size="sm" variant="outline" onClick={handleManageBooks}>
                  List Books
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </div>

          {/* Benefits Section */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
            <h4 className="font-medium text-green-900 mb-3 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Once setup is complete, you'll be able to:
            </h4>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• Receive payments directly to your bank account</li>
              <li>• Get notified when books are purchased</li>
              <li>• Track all your sales and earnings</li>
              <li>• Automatic payment processing after collection</li>
            </ul>
          </div>

          {/* Quick Setup Action */}
          {!requirements.hasBankingSetup && (
            <div className="pt-4 border-t">
              <Button
                onClick={handleSetupBanking}
                className="w-full bg-green-600 hover:bg-green-700"
                size="lg"
              >
                <CreditCard className="h-5 w-5 mr-2" />
                Start with Banking Setup
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BankingRequirementGate;

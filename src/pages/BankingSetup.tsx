import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  CheckCircle,
  CreditCard,
  Shield,
  TrendingUp,
  Users,
  DollarSign,
  Clock,
} from "lucide-react";
import Layout from "@/components/Layout";
import BankingDetailsForm from "@/components/banking/BankingDetailsForm";

import { useAuth } from "@/contexts/AuthContext";
import { PaystackSubaccountService } from "@/services/paystackSubaccountService";
import { toast } from "sonner";

const BankingSetup: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [existingBanking, setExistingBanking] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);


  useEffect(() => {
    const checkExistingBanking = async () => {
      console.log("🔍 Banking setup: Checking existing banking...", {
        user: user?.id,
      });

      if (!user) {
        console.log("❌ Banking setup: No user found");
        setIsLoading(false);
        return;
      }

      // Set a timeout to prevent infinite loading
      const timeout = setTimeout(() => {
        console.warn("⏰ Banking setup: Timeout reached, stopping loading");
        setIsLoading(false);
        setShowForm(true);
      }, 10000); // 10 second timeout

      try {
        console.log("📞 Banking setup: Calling getUserSubaccountStatus...");
        const status = await PaystackSubaccountService.getUserSubaccountStatus(
          user.id,
        );
        console.log("✅ Banking setup: Got status result:", status);

        if (status.hasSubaccount) {
          console.log(
            "💳 Banking setup: User has existing subaccount, setting up existing banking",
          );
          setExistingBanking({
            business_name: status.businessName,
            bank_name: status.bankName,
            account_number: status.accountNumber,
            email: status.email,
            status: "active",
          });
        } else {
          console.log("📝 Banking setup: No subaccount found, showing form");
          setShowForm(true);
        }
      } catch (error) {
        console.error(
          "❌ Banking setup: Error checking banking details:",
          error,
        );
        // Show form as fallback in case of error
        setShowForm(true);
      } finally {
        clearTimeout(timeout);
        console.log("🏁 Banking setup: Setting loading to false");
        setIsLoading(false);
      }
    };

    checkExistingBanking();
  }, [user]);

  const handleSetupSuccess = () => {
    toast.success("Banking details saved successfully!");
    navigate("/profile");
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleEditBanking = () => {
    setShowForm(true);
  };

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-6 py-8">
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">
              Please sign in to access banking setup.
            </AlertDescription>
          </Alert>
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading banking information...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <Button
              onClick={handleBack}
              variant="ghost"
              className="text-gray-600 hover:bg-gray-100 mb-6 p-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            <div className="text-center max-w-2xl mx-auto">
              <CreditCard className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Banking Setup
              </h1>
              <p className="text-gray-600">
                Set up your banking details to receive payments from book sales
                securely and automatically.
              </p>

            </div>
          </div>

          {/* Debug Tools */}


          {/* Existing Banking Details */}
          {existingBanking && !showForm && (
            <div className="max-w-2xl mx-auto space-y-6">
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="h-6 w-6" />
                    Banking Setup Complete
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-green-700">
                          Business Name
                        </label>
                        <p className="font-semibold text-green-900">
                          {existingBanking.business_name}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-green-700">
                          Bank
                        </label>
                        <p className="font-semibold text-green-900">
                          {existingBanking.bank_name}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-green-700">
                          Account Number
                        </label>
                        <p className="font-semibold text-green-900">
                          ****{existingBanking.account_number.slice(-4)}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-green-700">
                          Status
                        </label>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {existingBanking.status}
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-green-200">
                      <Button
                        onClick={handleEditBanking}
                        variant="outline"
                        className="border-green-300 text-green-700 hover:bg-green-100"
                      >
                        Update Banking Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Benefits Reminder */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    You're All Set!
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-start gap-3">
                      <DollarSign className="h-5 w-5 text-green-600 mt-1" />
                      <div>
                        <h4 className="font-medium">Automatic Payments</h4>
                        <p className="text-sm text-gray-600">
                          Receive 90% of each sale directly to your account
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-green-600 mt-1" />
                      <div>
                        <h4 className="font-medium">Fast Processing</h4>
                        <p className="text-sm text-gray-600">
                          Funds released after buyer collection confirmation
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Shield className="h-5 w-5 text-green-600 mt-1" />
                      <div>
                        <h4 className="font-medium">Secure & Protected</h4>
                        <p className="text-sm text-gray-600">
                          Bank-level security for all transactions
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Users className="h-5 w-5 text-green-600 mt-1" />
                      <div>
                        <h4 className="font-medium">24/7 Support</h4>
                        <p className="text-sm text-gray-600">
                          Get help whenever you need it
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t">
                    <Button
                      onClick={() => navigate("/profile")}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Go to Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Banking Setup Form */}
          {showForm && (
            <div className="space-y-8">
              {/* Benefits Section */}
              {!existingBanking && (
                <div className="max-w-4xl mx-auto">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card className="text-center">
                      <CardContent className="pt-6">
                        <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-3" />
                        <h3 className="font-semibold mb-2">90% Commission</h3>
                        <p className="text-sm text-gray-600">
                          Keep 90% of every sale. Only 10% platform fee.
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="text-center">
                      <CardContent className="pt-6">
                        <Clock className="h-8 w-8 text-green-600 mx-auto mb-3" />
                        <h3 className="font-semibold mb-2">Manual Processing</h3>
                        <p className="text-sm text-gray-600">
                          Payments are processed manually by administration.
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="text-center">
                      <CardContent className="pt-6">
                        <Shield className="h-8 w-8 text-green-600 mx-auto mb-3" />
                        <h3 className="font-semibold mb-2">Secure Payments</h3>
                        <p className="text-sm text-gray-600">
                          Bank-level security with encrypted transactions.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* Form */}
              <BankingDetailsForm
                onSuccess={handleSetupSuccess}
                onCancel={
                  existingBanking ? () => setShowForm(false) : undefined
                }
                editMode={!!existingBanking}
              />
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default BankingSetup;

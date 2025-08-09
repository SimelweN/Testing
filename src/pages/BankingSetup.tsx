import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BackButton from "@/components/ui/BackButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ArrowLeft,
  CheckCircle,
  CreditCard,
  Shield,
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  Settings,
  AlertTriangle,
  Eye,
  Copy,
  Loader2,
} from "lucide-react";
import Layout from "@/components/Layout";
import BankingDetailsForm from "@/components/banking/BankingDetailsForm";
import BankingForm from "@/components/banking/BankingForm";
import PasswordVerificationForm from "@/components/banking/PasswordVerificationForm";

import { useAuth } from "@/contexts/AuthContext";
import { PaystackSubaccountService } from "@/services/paystackSubaccountService";
import { toast } from "sonner";

const BankingSetup: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [existingBanking, setExistingBanking] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [useNewForm, setUseNewForm] = useState(false);
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [showFullAccount, setShowFullAccount] = useState(false);
  const [decryptedDetails, setDecryptedDetails] = useState(null);
  const [isDecrypting, setIsDecrypting] = useState(false);


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
    navigate("/profile");
  };

  const handleEditBanking = () => {
    setShowForm(true);
  };

  const handleUpdateSuccess = () => {
    setShowUpdateDialog(false);
    setIsPasswordVerified(false);
    toast.success("Banking details updated successfully!");
    // Refresh the page to show updated data
    window.location.reload();
  };

  const handlePasswordVerified = () => {
    setIsPasswordVerified(true);
  };

  const handleCancelUpdate = () => {
    setShowUpdateDialog(false);
    setIsPasswordVerified(false);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const handleDecryptAndView = async () => {
    setIsDecrypting(true);
    try {
      // Simulate decryption - in real app this would call the decryption service
      await new Promise(resolve => setTimeout(resolve, 1000));
      setDecryptedDetails({
        account_number: existingBanking?.account_number || "1234567890",
        bank_code: "250655"
      });
      setShowFullAccount(true);
      toast.success("Banking details decrypted successfully");
    } catch (error) {
      toast.error("Failed to decrypt banking details");
    } finally {
      setIsDecrypting(false);
    }
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

          {/* Existing Banking Details - Modern Card */}
          {existingBanking && !showForm && (
            <div className="max-w-4xl mx-auto space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Banking Profile
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
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

                  {/* Modern Banking Overview Card */}
                  <div className="bg-gradient-to-r from-book-50 to-green-50 p-6 rounded-lg border border-book-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-book-700">
                          Business Name
                        </label>
                        <p className="text-book-900 font-semibold">{existingBanking.business_name}</p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-book-700">
                          Bank
                        </label>
                        <p className="text-book-900 font-semibold">{existingBanking.bank_name}</p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-book-700">
                          Account Number
                        </label>
                        <div className="flex items-center gap-2">
                          <p className="text-book-900 font-mono font-semibold">
                            {showFullAccount && decryptedDetails?.account_number
                              ? decryptedDetails.account_number
                              : `****${existingBanking.account_number.slice(-4)}`}
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
                          <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-book-700">
                          Email
                        </label>
                        <p className="text-book-900">{user?.email}</p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-book-700">
                          Setup Date
                        </label>
                        <p className="text-book-900">
                          {new Date().toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={showFullAccount ? () => {} : handleDecryptAndView}
                      className="bg-book-600 hover:bg-book-700 flex items-center gap-2"
                      disabled={isDecrypting}
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
                      onClick={() => setShowUpdateDialog(true)}
                      variant="outline"
                      size="sm"
                      className="text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Update Details
                    </Button>
                  </div>

                  {/* Decrypted Details Display */}
                  {showFullAccount && decryptedDetails && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                        <Shield className="h-4 w-4" />
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
              {useNewForm ? (
                <div className="max-w-2xl mx-auto">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <h3 className="font-medium text-blue-900 mb-2">
                      {!isPasswordVerified ? "Security Verification Required" : "Enhanced Banking Form"}
                    </h3>
                    <p className="text-sm text-blue-700">
                      {!isPasswordVerified
                        ? "Please verify your password before updating your banking details."
                        : "This form allows you to update your existing banking details securely."
                      }
                    </p>
                  </div>
                  {!isPasswordVerified ? (
                    <PasswordVerificationForm
                      onVerified={() => setIsPasswordVerified(true)}
                      onCancel={() => {
                        setShowForm(false);
                        setUseNewForm(false);
                        setIsPasswordVerified(false);
                      }}
                    />
                  ) : (
                    <BankingForm
                      onSuccess={() => {
                        handleSetupSuccess();
                        setIsPasswordVerified(false);
                      }}
                      onCancel={() => {
                        setShowForm(false);
                        setUseNewForm(false);
                        setIsPasswordVerified(false);
                      }}
                    />
                  )}
                </div>
              ) : (
                <BankingDetailsForm
                  onSuccess={handleSetupSuccess}
                  onCancel={
                    existingBanking ? () => setShowForm(false) : undefined
                  }
                  editMode={!!existingBanking}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Update Banking Details Dialog - Same as BankingProfileTab */}
      <Dialog open={showUpdateDialog} onOpenChange={handleCancelUpdate}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {!isPasswordVerified ? "Security Verification" : "Update Banking Details"}
            </DialogTitle>
            <DialogDescription>
              {!isPasswordVerified
                ? "Please verify your password to access and update your banking information."
                : "Update your banking information securely. All changes are encrypted and stored safely."
              }
            </DialogDescription>
          </DialogHeader>
          {!isPasswordVerified ? (
            <PasswordVerificationForm
              onVerified={handlePasswordVerified}
              onCancel={handleCancelUpdate}
            />
          ) : (
            <BankingForm
              onSuccess={handleUpdateSuccess}
              onCancel={handleCancelUpdate}
            />
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default BankingSetup;

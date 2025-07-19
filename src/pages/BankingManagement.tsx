import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CreditCard,
  ArrowLeft,
  Settings,
  Plus,
  Eye,
  Edit3,
  CheckCircle,
  AlertTriangle,
  Building2,
  Shield,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useBanking } from "@/hooks/useBanking";
import { toast } from "sonner";
import { PaystackSubaccountService } from "@/services/paystackSubaccountService";
import SubaccountView from "@/components/banking/SubaccountView";
import SubaccountEditForm from "@/components/banking/SubaccountEditForm";
import BankingDetailsForm from "@/components/banking/BankingDetailsForm";

type ViewMode = "overview" | "create" | "view" | "edit";

const BankingManagement: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
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

  const [viewMode, setViewMode] = useState<ViewMode>("overview");
  const [subaccountCode, setSubaccountCode] = useState<string | null>(null);
  const [loadingSubaccount, setLoadingSubaccount] = useState(false);

  // Handle URL params for deep linking
  useEffect(() => {
    const mode = searchParams.get("mode") as ViewMode;
    if (mode && ["overview", "create", "view", "edit"].includes(mode)) {
      setViewMode(mode);
    }
  }, [searchParams]);

  // Load subaccount code when needed
  useEffect(() => {
    const loadSubaccountCode = async () => {
      if (
        (viewMode === "view" || viewMode === "edit") &&
        !subaccountCode &&
        hasBankingSetup
      ) {
        setLoadingSubaccount(true);
        try {
          const code = await PaystackSubaccountService.getUserSubaccountCode();
          if (code) {
            setSubaccountCode(code);
          } else {
            toast.error("No subaccount found");
            setViewMode("overview");
          }
        } catch (error) {
          toast.error("Failed to load subaccount details");
          setViewMode("overview");
        } finally {
          setLoadingSubaccount(false);
        }
      }
    };

    loadSubaccountCode();
  }, [viewMode, subaccountCode, hasBankingSetup]);

  const updateViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    setSearchParams({ mode });
  };

  const handleCreateBanking = () => {
    updateViewMode("create");
  };

  const handleViewSubaccount = () => {
    updateViewMode("view");
  };

  const handleEditSubaccount = () => {
    updateViewMode("edit");
  };

  const handleBackToOverview = () => {
    updateViewMode("overview");
    refreshBankingDetails();
  };

  const handleCreateSuccess = () => {
    toast.success("Banking setup completed successfully!");
    refreshBankingDetails();
    updateViewMode("overview");
  };

  const handleEditSuccess = () => {
    toast.success("Banking details updated successfully!");
    refreshBankingDetails();
    updateViewMode("overview");
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-book-600"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render different view modes
  const renderContent = () => {
    switch (viewMode) {
      case "create":
        return (
          <BankingDetailsForm
            onSuccess={handleCreateSuccess}
            onCancel={handleBackToOverview}
            editMode={false}
          />
        );

      case "view":
        if (loadingSubaccount) {
          return (
            <Card>
              <CardContent className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-book-600 mx-auto mb-4"></div>
                <p>Loading subaccount details...</p>
              </CardContent>
            </Card>
          );
        }
        return subaccountCode ? (
          <SubaccountView onEdit={handleEditSubaccount} showEditButton={true} />
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <p>No subaccount found</p>
              <Button onClick={handleBackToOverview} className="mt-4">
                Back to Overview
              </Button>
            </CardContent>
          </Card>
        );

      case "edit":
        if (loadingSubaccount) {
          return (
            <Card>
              <CardContent className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-book-600 mx-auto mb-4"></div>
                <p>Loading subaccount details...</p>
              </CardContent>
            </Card>
          );
        }
        return subaccountCode ? (
          <SubaccountEditForm
            subaccountCode={subaccountCode}
            onSuccess={handleEditSuccess}
            onCancel={handleBackToOverview}
          />
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <p>No subaccount found</p>
              <Button onClick={handleBackToOverview} className="mt-4">
                Back to Overview
              </Button>
            </CardContent>
          </Card>
        );

      default:
        return (
          <div className="space-y-6">
            {/* Header Card */}
            <Card className="border-2 border-book-100">
              <CardHeader className="bg-gradient-to-r from-book-50 to-book-100 rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-book-800">
                  <CreditCard className="h-6 w-6" />
                  Banking Management
                </CardTitle>
                <p className="text-book-700">
                  Manage your payment account and banking details for selling
                  books
                </p>
              </CardHeader>
            </Card>

            {/* Banking Status Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Banking Status
                  {isActive && (
                    <Badge
                      variant="default"
                      className="bg-green-100 text-green-800"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  )}
                  {hasBankingSetup && !isActive && (
                    <Badge
                      variant="outline"
                      className="border-orange-500 text-orange-700"
                    >
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Pending
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert className="border-blue-200 bg-blue-50">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    Banking information is required to list books for sale. All
                    data is stored securely and processed through Paystack's
                    encrypted payment system.
                  </AlertDescription>
                </Alert>

                {!hasBankingSetup ? (
                  <div className="text-center py-8">
                    <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Set Up Your Banking Details
                    </h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                      Add your banking information to start selling books and
                      receive payments securely through our integrated Paystack
                      system.
                    </p>
                    <Button
                      onClick={handleCreateBanking}
                      className="bg-book-600 hover:bg-book-700"
                      size="lg"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Set Up Banking
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Banking Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <label className="text-sm font-medium text-gray-600">
                          Business Name
                        </label>
                        <p className="font-semibold text-gray-900 mt-1">
                          {businessName}
                        </p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <label className="text-sm font-medium text-gray-600">
                          Bank
                        </label>
                        <p className="font-semibold text-gray-900 mt-1">
                          {bankName}
                        </p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <label className="text-sm font-medium text-gray-600">
                          Account
                        </label>
                        <p className="font-mono text-gray-900 mt-1">
                          {maskedAccountNumber}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3">
                      <Button
                        onClick={handleViewSubaccount}
                        className="bg-book-600 hover:bg-book-700"
                        disabled={loadingSubaccount}
                      >
                        {loadingSubaccount ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                          <Eye className="h-4 w-4 mr-2" />
                        )}
                        View Full Details
                      </Button>
                      <Button
                        onClick={handleEditSubaccount}
                        variant="outline"
                        className="border-book-200 text-book-600 hover:bg-book-50"
                        disabled={loadingSubaccount}
                      >
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit Details
                      </Button>
                      <Button
                        onClick={refreshBankingDetails}
                        variant="outline"
                        size="sm"
                      >
                        Refresh
                      </Button>
                    </div>

                    {/* Quick Status Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                          Account Verification
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
                          Payment Splits
                        </span>
                        <Badge className="bg-purple-100 text-purple-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          90/10
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Information */}
            {hasBankingSetup && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    How Payments Work
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-green-50 p-6 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-4">
                      Payment Process
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                            1
                          </div>
                          <span className="text-green-800">
                            You receive 90% of each sale
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                            2
                          </div>
                          <span className="text-green-800">
                            ReBooked keeps 10% platform fee
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                            3
                          </div>
                          <span className="text-green-800">
                            Payments held in escrow until delivery
                          </span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                            4
                          </div>
                          <span className="text-green-800">
                            Funds released 1-2 days after delivery
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                            5
                          </div>
                          <span className="text-green-800">
                            All transactions via Paystack
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Navigation */}
      {viewMode !== "overview" && (
        <div className="mb-6">
          <Button
            onClick={handleBackToOverview}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Banking Overview
          </Button>
        </div>
      )}

      {/* Main Content */}
      {renderContent()}
    </div>
  );
};

export default BankingManagement;

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CreditCard,
  Building2,
  Mail,
  Phone,
  Settings,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Edit3,
  RefreshCw,
  Eye,
  Copy,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import {
  PaystackSubaccountService,
  type SubaccountData,
} from "@/services/paystackSubaccountService";
import SubaccountEditForm from "./SubaccountEditForm";

interface SubaccountViewProps {
  onEdit?: () => void;
  showEditButton?: boolean;
}

const SubaccountView: React.FC<SubaccountViewProps> = ({
  onEdit,
  showEditButton = true,
}) => {
  const [subaccountData, setSubaccountData] = useState<{
    subaccount_code: string;
    banking_details: any;
    paystack_data: SubaccountData;
    profile_preferences: any;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSubaccountData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result =
        await PaystackSubaccountService.getCompleteSubaccountInfo();

      if (result.success && result.data) {
        setSubaccountData(result.data);
      } else {
        const errorMessage = result.error || "Failed to load subaccount details";

        // Provide more user-friendly error messages
        if (errorMessage.includes("Edge Function") || errorMessage.includes("non-2xx")) {
          setError("Banking services are temporarily unavailable. Please try again in a few minutes.");
        } else if (errorMessage.includes("Authentication")) {
          setError("Please log out and log back in to refresh your session.");
        } else if (errorMessage.includes("No subaccount")) {
          setError("No banking details found. Please set up your banking information first.");
        } else {
          setError(errorMessage);
        }
      }
    } catch (error) {
      console.error("Error loading subaccount data:", error);
      setError("Failed to load subaccount details");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSubaccountData();
  }, []);

  const handleEdit = () => {
    console.log('Edit button clicked:', { onEdit: !!onEdit, isEditing });
    if (onEdit) {
      try {
        onEdit();
      } catch (error) {
        console.error('Error calling onEdit:', error);
        toast.error('Failed to enter edit mode');
      }
    } else {
      setIsEditing(true);
    }
  };

  const handleEditSuccess = () => {
    setIsEditing(false);
    loadSubaccountData(); // Refresh data
    toast.success("Subaccount updated successfully!");
  };

  const handleEditCancel = () => {
    setIsEditing(false);
  };

  const handleRefresh = () => {
    loadSubaccountData();
    toast.info("Refreshing subaccount data...");
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const formatCurrency = (amount: number, currency: string = "ZAR") => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: currency,
    }).format(amount / 100); // Paystack amounts are in kobo/cents
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="pt-6 text-center">
            <Loader2 className="h-16 w-16 animate-spin mx-auto mb-4 text-book-600" />
            <h3 className="text-xl font-bold mb-2">
              Loading Subaccount Details
            </h3>
            <p className="text-gray-600">
              Fetching your payment account information...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !subaccountData) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-red-900 mb-2">
                Unable to Load Subaccount
              </h3>
              <p className="text-red-800 mb-4">
                {error || "No subaccount data found"}
              </p>
              <Button onClick={loadSubaccountData} className="mr-2">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isEditing) {
    return (
      <SubaccountEditForm
        subaccountCode={subaccountData.subaccount_code}
        onSuccess={handleEditSuccess}
        onCancel={handleEditCancel}
      />
    );
  }

  const { paystack_data, banking_details } = subaccountData;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card className="border-2 border-book-100">
        <CardHeader className="bg-gradient-to-r from-book-50 to-book-100 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-book-800">
                <Eye className="h-6 w-6" />
                Subaccount Overview
              </CardTitle>
              <CardDescription className="text-book-700">
                Your Paystack subaccount details and settings
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <div
                className={`p-2 rounded-full ${paystack_data.active ? "bg-green-100" : "bg-red-100"}`}
              >
                {paystack_data.active ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="font-semibold">
                  {paystack_data.active ? "Active" : "Inactive"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <div
                className={`p-2 rounded-full ${paystack_data.is_verified ? "bg-green-100" : "bg-yellow-100"}`}
              >
                {paystack_data.is_verified ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                )}
              </div>
              <div>
                <p className="text-sm text-gray-600">Verification</p>
                <p className="font-semibold">
                  {paystack_data.is_verified ? "Verified" : "Pending"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <div className="p-2 rounded-full bg-blue-100">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Platform Fee</p>
                <p className="font-semibold">
                  {paystack_data.percentage_charge}%
                </p>
              </div>
            </div>
          </div>

          {/* Subaccount Code */}
          <Alert className="border-blue-200 bg-blue-50 mb-6">
            <CreditCard className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <div className="flex items-center justify-between">
                <div>
                  <strong>Subaccount Code:</strong>{" "}
                  {paystack_data.subaccount_code}
                </div>
                <Button
                  onClick={() =>
                    copyToClipboard(
                      paystack_data.subaccount_code,
                      "Subaccount Code",
                    )
                  }
                  variant="ghost"
                  size="sm"
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Business Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Business Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-600">
                Your Name
              </Label>
              <p className="font-semibold">
                {paystack_data.business_name || "Not provided"}
              </p>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-600">
                Description
              </Label>
              <p className="text-gray-700">
                {paystack_data.description || "No description provided"}
              </p>
            </div>

            {paystack_data.domain && (
              <div>
                <Label className="text-sm font-medium text-gray-600">
                  Domain
                </Label>
                <div className="flex items-center gap-2">
                  <p className="text-gray-700">{paystack_data.domain}</p>
                  <Button
                    onClick={() =>
                      window.open(`https://${paystack_data.domain}`, "_blank")
                    }
                    variant="ghost"
                    size="sm"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-600">
                Subaccount ID
              </Label>
              <p className="font-mono text-gray-700">
                {paystack_data.subaccount_id || "N/A"}
              </p>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-600">
                Settlement Schedule
              </Label>
              <Badge variant="outline" className="capitalize">
                {paystack_data.settlement_schedule || "auto"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-600">
                Primary Contact Email
              </Label>
              <p className="font-semibold">
                {paystack_data.primary_contact_email || "Not provided"}
              </p>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-600">
                Primary Contact Name
              </Label>
              <p className="text-gray-700">
                {paystack_data.primary_contact_name || "Not provided"}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-600">
                Primary Contact Phone
              </Label>
              <p className="text-gray-700">
                {paystack_data.primary_contact_phone || "Not provided"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Banking Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Banking Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-600">
                Settlement Bank
              </Label>
              <p className="font-semibold">
                {paystack_data.settlement_bank || "Not provided"}
              </p>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-600">
                Account Number
              </Label>
              <div className="flex items-center gap-2">
                <p className="font-mono">
                  {paystack_data.account_number
                    ? `****${paystack_data.account_number.slice(-4)}`
                    : "Not provided"}
                </p>
                {paystack_data.account_number && (
                  <Button
                    onClick={() =>
                      copyToClipboard(
                        paystack_data.account_number,
                        "Account Number",
                      )
                    }
                    variant="ghost"
                    size="sm"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {banking_details && (
              <>
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Bank Name (Local)
                  </Label>
                  <p className="text-gray-700">
                    {banking_details.bank_name || "Not provided"}
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Last Updated
                  </Label>
                  <p className="text-gray-700">
                    {banking_details.updated_at
                      ? new Date(
                          banking_details.updated_at,
                        ).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Metadata */}
      {paystack_data.metadata &&
        Object.keys(paystack_data.metadata).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Additional Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(paystack_data.metadata).map(([key, value]) => (
                  <div key={key}>
                    <Label className="text-sm font-medium text-gray-600 capitalize">
                      {key.replace(/_/g, " ")}
                    </Label>
                    <p className="text-gray-700">
                      {typeof value === "object"
                        ? JSON.stringify(value)
                        : String(value)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
    </div>
  );
};

// Helper component for labels
const Label: React.FC<{ className?: string; children: React.ReactNode }> = ({
  className = "",
  children,
}) => (
  <label className={`block text-sm font-medium ${className}`}>{children}</label>
);

export default SubaccountView;

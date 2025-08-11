import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CreditCard,
  Building2,
  Mail,
  Phone,
  Settings,
  CheckCircle,
  AlertCircle,
  Loader2,
  Save,
  RefreshCw,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import {
  PaystackSubaccountService,
  type SubaccountUpdateDetails,
  type SubaccountData,
} from "@/services/paystackSubaccountService";

interface BankInfo {
  name: string;
  branchCode: string;
}

const SOUTH_AFRICAN_BANKS: BankInfo[] = [
  { name: "Absa Bank", branchCode: "632005" },
  { name: "Capitec Bank", branchCode: "470010" },
  { name: "First National Bank (FNB)", branchCode: "250655" },
  { name: "Nedbank", branchCode: "198765" },
  { name: "Standard Bank", branchCode: "051001" },
  { name: "TymeBank", branchCode: "678910" },
  { name: "African Bank", branchCode: "430000" },
  { name: "Bidvest Bank", branchCode: "679000" },
  { name: "Discovery Bank", branchCode: "679000" },
  { name: "Investec Bank", branchCode: "580105" },
  { name: "Mercantile Bank", branchCode: "450905" },
  { name: "Sasfin Bank", branchCode: "683000" },
];

const SETTLEMENT_SCHEDULES = [
  { value: "auto", label: "Automatic (T+1)" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "manual", label: "Manual" },
];

interface SubaccountEditFormProps {
  subaccountCode: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  showAsModal?: boolean;
}

const SubaccountEditForm: React.FC<SubaccountEditFormProps> = ({
  subaccountCode,
  onSuccess,
  onCancel,
  showAsModal = false,
}) => {
  const [formData, setFormData] = useState<SubaccountUpdateDetails>({
    business_name: "",
    primary_contact_email: "",
    primary_contact_name: "",
    primary_contact_phone: "",
    settlement_bank: "",
    account_number: "",
    percentage_charge: 10,
    description: "",
    settlement_schedule: "auto",
  });

  const [originalData, setOriginalData] = useState<SubaccountData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load existing subaccount data
  useEffect(() => {
    const loadSubaccountData = async () => {
      try {
        setIsLoading(true);
        const result =
          await PaystackSubaccountService.getCompleteSubaccountInfo();

        if (result.success && result.data?.paystack_data) {
          const data = result.data.paystack_data;
          setOriginalData(data);

          // Map Paystack data to form fields
          setFormData({
            business_name: data.business_name || "",
            primary_contact_email: data.primary_contact_email || "",
            primary_contact_name: data.primary_contact_name || "",
            primary_contact_phone: data.primary_contact_phone || "",
            settlement_bank: data.settlement_bank || "",
            account_number: data.account_number || "",
            percentage_charge: data.percentage_charge || 10,
            description: data.description || "",
            settlement_schedule: (data.settlement_schedule as any) || "auto",
          });
        } else {
          toast.error("Failed to load subaccount details");
          if (onCancel) onCancel();
        }
      } catch (error) {
        console.error("Error loading subaccount data:", error);
        toast.error("Failed to load subaccount details");
        if (onCancel) onCancel();
      } finally {
        setIsLoading(false);
      }
    };

    loadSubaccountData();
  }, [subaccountCode, onCancel]);

  // Check for changes
  useEffect(() => {
    if (!originalData) return;

    const hasFieldChanges =
      formData.business_name !== (originalData.business_name || "") ||
      formData.primary_contact_email !==
        (originalData.primary_contact_email || "") ||
      formData.primary_contact_name !==
        (originalData.primary_contact_name || "") ||
      formData.primary_contact_phone !==
        (originalData.primary_contact_phone || "") ||
      formData.settlement_bank !== (originalData.settlement_bank || "") ||
      formData.account_number !== (originalData.account_number || "") ||
      formData.percentage_charge !== (originalData.percentage_charge || 10) ||
      formData.description !== (originalData.description || "") ||
      formData.settlement_schedule !==
        (originalData.settlement_schedule || "auto");

    setHasChanges(hasFieldChanges);
  }, [formData, originalData]);

  const handleBankChange = (bankName: string) => {
    const selectedBank = SOUTH_AFRICAN_BANKS.find(
      (bank) => bank.name === bankName,
    );
    setFormData((prev) => ({
      ...prev,
      settlement_bank: selectedBank?.branchCode || "",
    }));
  };

  const handleAccountNumberChange = (value: string) => {
    // Only allow digits, limit to 12 characters
    const digitsOnly = value.replace(/\\D/g, "").slice(0, 12);
    setFormData((prev) => ({ ...prev, account_number: digitsOnly }));
  };

  const handlePercentageChange = (value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      setFormData((prev) => ({ ...prev, percentage_charge: numValue }));
    }
  };

  const validateForm = () => {
    if (!formData.business_name?.trim()) {
      toast.error("Your name is required");
      return false;
    }

    if (
      formData.primary_contact_email &&
      !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(formData.primary_contact_email)
    ) {
      toast.error("Please enter a valid email address");
      return false;
    }

    if (
      formData.account_number &&
      (formData.account_number.length < 8 ||
        formData.account_number.length > 12)
    ) {
      toast.error("Account number must be between 8-12 digits");
      return false;
    }

    if (
      formData.percentage_charge !== undefined &&
      (formData.percentage_charge < 0 || formData.percentage_charge > 100)
    ) {
      toast.error("Percentage charge must be between 0-100%");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;
    if (!hasChanges) {
      toast.info("No changes to save");
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare update data (only include changed fields)
      const updateData: SubaccountUpdateDetails = {};

      if (formData.business_name !== (originalData?.business_name || "")) {
        updateData.business_name = formData.business_name;
      }
      if (
        formData.primary_contact_email !==
        (originalData?.primary_contact_email || "")
      ) {
        updateData.primary_contact_email = formData.primary_contact_email;
      }
      if (
        formData.primary_contact_name !==
        (originalData?.primary_contact_name || "")
      ) {
        updateData.primary_contact_name = formData.primary_contact_name;
      }
      if (
        formData.primary_contact_phone !==
        (originalData?.primary_contact_phone || "")
      ) {
        updateData.primary_contact_phone = formData.primary_contact_phone;
      }
      if (formData.settlement_bank !== (originalData?.settlement_bank || "")) {
        updateData.settlement_bank = formData.settlement_bank;
      }
      if (formData.account_number !== (originalData?.account_number || "")) {
        updateData.account_number = formData.account_number;
      }
      if (
        formData.percentage_charge !== (originalData?.percentage_charge || 10)
      ) {
        updateData.percentage_charge = formData.percentage_charge;
      }
      if (formData.description !== (originalData?.description || "")) {
        updateData.description = formData.description;
      }
      if (
        formData.settlement_schedule !==
        (originalData?.settlement_schedule || "auto")
      ) {
        updateData.settlement_schedule = formData.settlement_schedule;
      }

      console.log("Updating subaccount with data:", updateData);

      const result = await PaystackSubaccountService.updateSubaccountDetails(
        subaccountCode,
        updateData,
      );

      if (result.success) {
        setIsSuccess(true);
        toast.success("Subaccount updated successfully!");

        setTimeout(() => {
          onSuccess?.();
        }, 2000);
      } else {
        throw new Error(result.error || "Failed to update subaccount");
      }
    } catch (error) {
      console.error("Subaccount update error:", error);

      let errorMessage = "There was an error updating your subaccount details.";

      if (error instanceof Error) {
        const msg = error.message.toLowerCase();
        if (msg.includes("authentication") || msg.includes("unauthorized")) {
          errorMessage =
            "Your session has expired. Please log in again and try again.";
        } else if (
          msg.includes("network") ||
          msg.includes("fetch") ||
          msg.includes("connection")
        ) {
          errorMessage =
            "Network error. Please check your internet connection and try again.";
        } else if (msg.includes("validation") || msg.includes("invalid")) {
                    const errorMsg = error?.message || String(error) || 'Details validation failed';
          const safeMsg = errorMsg === '[object Object]' ? 'Details validation failed' : errorMsg;
          errorMessage = `Please check your details and try again. ${safeMsg}`;
        } else if (error.message && error.message.length > 0) {
          errorMessage = error.message;
        }
      }

      toast.error(errorMessage, { duration: 5000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    // Reload data
    const result = await PaystackSubaccountService.getCompleteSubaccountInfo();
    if (result.success && result.data?.paystack_data) {
      const data = result.data.paystack_data;
      setOriginalData(data);
      // Reset form to original values
      setFormData({
        business_name: data.business_name || "",
        primary_contact_email: data.primary_contact_email || "",
        primary_contact_name: data.primary_contact_name || "",
        primary_contact_phone: data.primary_contact_phone || "",
        settlement_bank: data.settlement_bank || "",
        account_number: data.account_number || "",
        percentage_charge: data.percentage_charge || 10,
        description: data.description || "",
        settlement_schedule: (data.settlement_schedule as any) || "auto",
      });
      toast.success("Data refreshed from Paystack");
    } else {
      toast.error("Failed to refresh data");
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="pt-6 text-center">
            <Loader2 className="h-16 w-16 animate-spin mx-auto mb-4 text-book-600" />
            <h3 className="text-xl font-bold mb-2">
              Loading Subaccount Details
            </h3>
            <p className="text-gray-600">
              Fetching your current settings from Paystack...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-green-900 mb-2">
              Subaccount Updated Successfully!
            </h3>
            <p className="text-green-800">
              Your payment account details have been updated in Paystack.
            </p>
            <Button
              onClick={onSuccess}
              className="mt-6 bg-green-600 hover:bg-green-700"
            >
              Done
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="border-2 border-book-100">
        <CardHeader className="bg-gradient-to-r from-book-50 to-book-100 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-book-800">
                <Settings className="h-6 w-6" />
                Edit Subaccount Details
              </CardTitle>
              <CardDescription className="text-book-700">
                Update your Paystack subaccount settings and banking information
              </CardDescription>
            </div>
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Status Information */}
          {originalData && (
            <Alert className="border-blue-200 bg-blue-50">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <strong>Status:</strong>{" "}
                    {originalData.active ? "Active" : "Inactive"}
                  </div>
                  <div>
                    <strong>Code:</strong> {originalData.subaccount_code}
                  </div>
                  <div>
                    <strong>Verified:</strong>{" "}
                    {originalData.is_verified ? "Yes" : "No"}
                  </div>
                  <div>
                    <strong>ID:</strong> {originalData.subaccount_id}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Changes Indicator */}
          {hasChanges && (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                You have unsaved changes. Click "Save Changes" to apply them to
                your Paystack subaccount.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Business Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Business Information
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="businessName">Your Name *</Label>
                  <Input
                    id="businessName"
                    type="text"
                    value={formData.business_name || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        business_name: e.target.value,
                      }))
                    }
                    className="h-11 rounded-lg border-2 focus:border-book-600"
                    placeholder="Your name or trading name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="rounded-lg border-2 focus:border-book-600"
                    placeholder="Brief description of your business"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="percentageCharge">Platform Fee (%)</Label>
                  <Input
                    id="percentageCharge"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.percentage_charge || ""}
                    onChange={(e) => handlePercentageChange(e.target.value)}
                    className="h-11 rounded-lg border-2 focus:border-book-600"
                    placeholder="10"
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Contact Information
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Primary Contact Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={formData.primary_contact_email || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        primary_contact_email: e.target.value,
                      }))
                    }
                    className="h-11 rounded-lg border-2 focus:border-book-600"
                    placeholder="contact@business.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactName">Primary Contact Name</Label>
                  <Input
                    id="contactName"
                    type="text"
                    value={formData.primary_contact_name || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        primary_contact_name: e.target.value,
                      }))
                    }
                    className="h-11 rounded-lg border-2 focus:border-book-600"
                    placeholder="Contact person name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Primary Contact Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="contactPhone"
                      type="tel"
                      value={formData.primary_contact_phone || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          primary_contact_phone: e.target.value,
                        }))
                      }
                      className="pl-10 h-11 rounded-lg border-2 focus:border-book-600"
                      placeholder="+27 12 345 6789"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Banking Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Banking Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Settlement Bank</Label>
                  <Select
                    value={
                      SOUTH_AFRICAN_BANKS.find(
                        (bank) => bank.branchCode === formData.settlement_bank,
                      )?.name || ""
                    }
                    onValueChange={handleBankChange}
                  >
                    <SelectTrigger className="h-11 rounded-lg border-2 focus:border-book-600">
                      <SelectValue placeholder="Choose your bank" />
                    </SelectTrigger>
                    <SelectContent>
                      {SOUTH_AFRICAN_BANKS.map((bank) => (
                        <SelectItem key={bank.name} value={bank.name}>
                          {bank.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input
                    id="accountNumber"
                    type="text"
                    value={formData.account_number || ""}
                    onChange={(e) => handleAccountNumberChange(e.target.value)}
                    className="h-11 rounded-lg border-2 focus:border-book-600"
                    placeholder="Enter account number"
                    maxLength={12}
                    inputMode="numeric"
                    pattern="[0-9]*"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Settlement Schedule</Label>
                <Select
                  value={formData.settlement_schedule || "auto"}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      settlement_schedule: value as any,
                    }))
                  }
                >
                  <SelectTrigger className="h-11 rounded-lg border-2 focus:border-book-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SETTLEMENT_SCHEDULES.map((schedule) => (
                      <SelectItem key={schedule.value} value={schedule.value}>
                        {schedule.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
              <Button
                type="submit"
                disabled={isSubmitting || !hasChanges}
                className="flex-1 h-12 bg-book-600 hover:bg-book-700 text-white font-semibold rounded-lg disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>

              {onCancel && (
                <Button
                  type="button"
                  onClick={onCancel}
                  variant="outline"
                  className="flex-1 h-12 rounded-lg"
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>

          {/* Footer */}
          <div className="text-center pt-4 border-t">
            <p className="text-xs text-gray-500">
              Changes are applied directly to your Paystack subaccount
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubaccountEditForm;

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
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CreditCard,
  Building2,
  Mail,
  Shield,
  CheckCircle,
  AlertCircle,
  Loader2,
  Edit3,
} from "lucide-react";
import { toast } from "sonner";
import { PaystackSubaccountService } from "@/services/paystackSubaccountService";
import { UserAutofillService } from "@/services/userAutofillService";
import { ActivityService } from "@/services/activityService";

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

interface BankingDetailsFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  showAsModal?: boolean;
  editMode?: boolean;
}

const BankingDetailsForm: React.FC<BankingDetailsFormProps> = ({
  onSuccess,
  onCancel,
  showAsModal = false,
  editMode = false,
}) => {
  const [formData, setFormData] = useState({
    businessName: "",
    email: "",
    bankName: "",
    accountNumber: "",
  });

  const [branchCode, setBranchCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(editMode);
  const [hasAutofilled, setHasAutofilled] = useState(false);

  // 🔄 Load existing data if in edit mode (but block editing)
  useEffect(() => {
    const loadExistingData = async () => {
      if (!editMode) return;

      try {
        setIsLoading(true);
        const status =
          await PaystackSubaccountService.getUserSubaccountStatus();

        if (status.hasSubaccount) {
          setFormData({
            businessName: status.businessName || "",
            email: status.email || "",
            bankName: status.bankName || "",
            accountNumber: status.accountNumber || "",
          });

          const selectedBank = SOUTH_AFRICAN_BANKS.find(
            (bank) => bank.name === status.bankName,
          );
          setBranchCode(selectedBank?.branchCode || "");
        }
      } catch (error) {
        toast.error("Failed to load existing banking details");
      } finally {
        setIsLoading(false);
      }
    };

    loadExistingData();
    if (!editMode) {
      autofillUserInfo();
    }
  }, [editMode]);

  // 📝 Auto-fill user info from profile
  const autofillUserInfo = async () => {
    if (hasAutofilled || editMode) return;

    try {
      const userInfo = await UserAutofillService.getUserInfo();
      if (userInfo) {
        setFormData((prev) => ({
          ...prev,
          businessName: prev.businessName || userInfo.name,
          email: prev.email || userInfo.email,
        }));
        setHasAutofilled(true);
      }
    } catch (error) {
      console.error("Error autofilling user info:", error);
    }
  };

  // 🚫 BANKING DETAILS CAN'T BE EDITED - Show contact support message
  if (editMode) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <Edit3 className="h-5 w-5" />
              Need to Edit Your Banking Details?
            </CardTitle>
            <CardDescription className="text-orange-700">
              Contact our support team and we'll help you update your
              information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="border-orange-300 bg-orange-100">
              <Mail className="h-4 w-4" />
              <AlertDescription className="text-orange-800">
                <div className="space-y-3">
                  <p>
                    For security reasons, banking details must be updated
                    through our support team. Please contact us at:
                  </p>
                  <div className="font-medium">
                    contact@rebookedsolutions.co.za
                  </div>
                  <div>
                    <p className="font-medium mb-2">
                      What to include in your email:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Your account email address</li>
                      <li>
                        What you need to change (bank, account number, etc.)
                      </li>
                      <li>Reason for the change</li>
                    </ul>
                  </div>
                </div>
              </AlertDescription>
            </Alert>

            {onCancel && (
              <div className="mt-6">
                <Button onClick={onCancel} variant="outline" className="w-full">
                  Go Back
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleBankChange = (bankName: string) => {
    const selectedBank = SOUTH_AFRICAN_BANKS.find(
      (bank) => bank.name === bankName,
    );
    setFormData((prev) => ({ ...prev, bankName }));
    setBranchCode(selectedBank?.branchCode || "");
  };

  const handleAccountNumberChange = (value: string) => {
    // Only allow digits, limit to 12 characters
    const digitsOnly = value.replace(/\D/g, "").slice(0, 12);
    setFormData((prev) => ({ ...prev, accountNumber: digitsOnly }));
  };

  const validateForm = () => {
    // Clean and validate business name
    const businessName = formData.businessName?.trim();
    if (!businessName || businessName.length < 2) {
      toast.error("Business name must be at least 2 characters long");
      return false;
    }

    // Validate email format more thoroughly
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email.trim())) {
      toast.error("Please enter a valid email address");
      return false;
    }

    // Validate bank selection
    if (!formData.bankName || formData.bankName.trim() === "") {
      toast.error("Please select a bank");
      return false;
    }

    // Validate account number (South African banks typically use 9-11 digits)
    const accountNumber = formData.accountNumber.replace(/\D/g, "");
    if (accountNumber.length < 8 || accountNumber.length > 12) {
      toast.error("Account number must be between 8-12 digits");
      return false;
    }

    // Validate branch code
    if (!branchCode || branchCode.trim() === "") {
      toast.error("Bank branch code is missing. Please reselect your bank.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent any potential scrolling issues
    window.scrollTo({ top: 0, behavior: "smooth" });

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Clean and prepare data
      const subaccountDetails = {
        business_name: formData.businessName.trim(),
        email: formData.email.trim().toLowerCase(),
        bank_name: formData.bankName.trim(),
        bank_code: branchCode.trim(),
        account_number: formData.accountNumber.replace(/\D/g, ""), // Remove all non-digits
      };

      // Additional client-side validation
      if (
        !subaccountDetails.business_name ||
        subaccountDetails.business_name.length < 2
      ) {
        throw new Error("Business name is too short");
      }

      if (
        !subaccountDetails.account_number ||
        subaccountDetails.account_number.length < 8
      ) {
        throw new Error("Account number is invalid");
      }

      console.log("Submitting banking details:", {
        ...subaccountDetails,
        account_number: "***" + subaccountDetails.account_number.slice(-4),
      });

      // 📡 CREATE SUBACCOUNT VIA SERVICE
      const result = await PaystackSubaccountService.createOrUpdateSubaccount(
        subaccountDetails,
        editMode,
      );

      if (result.success) {
        setIsSuccess(true);

        const successMessage = editMode
          ? "Banking details updated successfully!"
          : "Banking setup completed successfully! You can now start selling books.";

        toast.success(successMessage);

        // Log the banking update activity
        try {
          await ActivityService.logBankingUpdate(session.user.id, editMode);
          console.log("✅ Banking update activity logged");
        } catch (activityError) {
          console.warn("⚠️ Failed to log banking update activity:", activityError);
          // Don't fail the entire operation for activity logging issues
        }

        // 🔗 AUTOMATICALLY LINK ALL USER'S BOOKS TO NEW SUBACCOUNT
        if (result.subaccount_code) {
          try {
            console.log("Linking books to subaccount:", result.subaccount_code);
            const linkSuccess =
              await PaystackSubaccountService.linkBooksToSubaccount(
                result.subaccount_code,
              );

            if (linkSuccess) {
              toast.info(
                "All your book listings have been updated with your payment details.",
              );
            }
          } catch (linkError) {
            console.error("Error linking books to subaccount:", linkError);
            // Don't fail the whole process for this
          }
        }

        setTimeout(() => {
          onSuccess?.();
        }, 2000);
      } else {
        throw new Error(
          result.error ||
            `Failed to ${editMode ? "update" : "create"} your banking account`,
        );
      }
    } catch (error) {
      console.error("Banking setup error:", error);

      let errorMessage = "There was an error setting up your banking details.";

      if (error instanceof Error) {
        const msg = error.message.toLowerCase();

        if (msg.includes("authentication") || msg.includes("unauthorized")) {
          errorMessage =
            "Your session has expired. Please log in again and try again.";
        } else if (
          msg.includes("edge function") ||
          msg.includes("non-2xx") ||
          msg.includes("failed to send a request") ||
          msg.includes("functionshttp") ||
          msg.includes("functionsfetch")
        ) {
          errorMessage =
            "Banking services are temporarily unavailable. Please try again in a few minutes, or contact support if the issue persists.";
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
        } else if (msg.includes("account number")) {
          errorMessage =
            "Invalid account number. Please check your account number and try again.";
        } else if (msg.includes("bank")) {
          errorMessage =
            "Bank information error. Please reselect your bank and try again.";
        } else if (error.message && error.message.length > 0) {
          errorMessage = error.message;
        }
      }

      toast.error(errorMessage, {
        duration: 5000, // Show error longer
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-green-900 mb-2">
              Banking Details {editMode ? "Updated" : "Submitted"}!
            </h3>
            <p className="text-green-800">
              Your payment account has been {editMode ? "updated" : "created"}{" "}
              successfully.
              {!editMode && " You can now start listing and selling books."}
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
    <div className="max-w-2xl mx-auto">
      <Card className="border-2 border-book-100">
        <CardHeader className="bg-gradient-to-r from-book-50 to-book-100 rounded-t-lg">
          <CardTitle className="flex items-center gap-2 text-book-800">
            <CreditCard className="h-6 w-6" />
            Add Banking Details
          </CardTitle>
          <CardDescription className="text-book-700">
            Create your secure Paystack subaccount for faster payments
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* 🔒 Security Notice */}
          <Alert className="border-green-200 bg-green-50">
            <Shield className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Secure & Encrypted</strong>
              <br />
              Your banking information is protected with bank-level security.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Business Name */}
            <div className="space-y-2">
              <Label htmlFor="businessName" className="text-sm font-medium">
                Your Name *{" "}
                {hasAutofilled && !editMode && (
                  <span className="text-xs text-gray-500">(from account)</span>
                )}
              </Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="businessName"
                  type="text"
                  value={formData.businessName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      businessName: e.target.value,
                    }))
                  }
                  className={`pl-10 h-11 rounded-lg border-2 focus:border-book-600 focus:ring-book-600 ${
                    formData.businessName.trim().length > 0 &&
                    formData.businessName.trim().length < 2
                      ? "border-red-300 focus:border-red-500"
                      : formData.businessName.trim().length >= 2
                        ? "border-green-300 focus:border-green-500"
                        : ""
                  }`}
                  placeholder="Your full name"
                  required
                  minLength={2}
                  maxLength={100}
                />
                {formData.businessName.trim().length >= 2 && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                )}
              </div>
              {formData.businessName.trim().length > 0 &&
                formData.businessName.trim().length < 2 && (
                  <p className="text-xs text-red-600">
                    Name must be at least 2 characters
                  </p>
                )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address *{" "}
                {hasAutofilled && !editMode && (
                  <span className="text-xs text-gray-500">(from account)</span>
                )}
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className={`pl-10 h-11 rounded-lg border-2 focus:border-book-600 focus:ring-book-600 ${
                    formData.email &&
                    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())
                      ? "border-red-300 focus:border-red-500"
                      : formData.email &&
                          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                            formData.email.trim(),
                          )
                        ? "border-green-300 focus:border-green-500"
                        : ""
                  }`}
                  placeholder="your@email.com"
                  required
                />
                {formData.email &&
                  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim()) && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    </div>
                  )}
              </div>
              {formData.email &&
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim()) && (
                  <p className="text-xs text-red-600">
                    Please enter a valid email address
                  </p>
                )}
            </div>

            {/* Bank Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Select Your Bank *</Label>
              <Select
                value={formData.bankName}
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

            {/* Branch Code (Auto-filled) */}
            {branchCode && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">
                  Branch Code (Auto-filled)
                </Label>
                <div className="px-3 py-2 bg-gray-50 rounded-lg border text-gray-700 font-mono">
                  {branchCode}
                </div>
              </div>
            )}

            {/* Account Number */}
            <div className="space-y-2">
              <Label htmlFor="accountNumber" className="text-sm font-medium">
                Account Number *
              </Label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="accountNumber"
                  type="text"
                  value={formData.accountNumber}
                  onChange={(e) => handleAccountNumberChange(e.target.value)}
                  className={`pl-10 h-11 rounded-lg border-2 focus:border-book-600 focus:ring-book-600 ${
                    formData.accountNumber &&
                    (formData.accountNumber.length < 8 ||
                      formData.accountNumber.length > 12)
                      ? "border-red-300 focus:border-red-500"
                      : formData.accountNumber &&
                          formData.accountNumber.length >= 8 &&
                          formData.accountNumber.length <= 12
                        ? "border-green-300 focus:border-green-500"
                        : ""
                  }`}
                  placeholder="Enter account number (8-12 digits)"
                  maxLength={12}
                  required
                  inputMode="numeric"
                  pattern="[0-9]*"
                />
                {formData.accountNumber &&
                  formData.accountNumber.length >= 8 &&
                  formData.accountNumber.length <= 12 && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    </div>
                  )}
              </div>
              <div className="flex justify-between items-center">
                {formData.accountNumber &&
                  (formData.accountNumber.length < 8 ||
                    formData.accountNumber.length > 12) && (
                    <p className="text-xs text-red-600">
                      Account number must be 8-12 digits
                    </p>
                  )}
                <p className="text-xs text-gray-500 ml-auto">
                  {formData.accountNumber.length}/12 digits
                </p>
              </div>
            </div>

            {/* Validation Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Form Status:
              </h4>
              <div className="space-y-1 text-xs">
                <div
                  className={`flex items-center gap-2 ${
                    formData.businessName.trim().length >= 2
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      formData.businessName.trim().length >= 2
                        ? "bg-green-500"
                        : "bg-red-500"
                    }`}
                  ></div>
                  Business Name{" "}
                  {formData.businessName.trim().length >= 2
                    ? "✓"
                    : "(required, min 2 characters)"}
                </div>
                <div
                  className={`flex items-center gap-2 ${
                    formData.email &&
                    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      formData.email &&
                      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())
                        ? "bg-green-500"
                        : "bg-red-500"
                    }`}
                  ></div>
                  Email Address{" "}
                  {formData.email &&
                  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())
                    ? "✓"
                    : "(required, valid format)"}
                </div>
                <div
                  className={`flex items-center gap-2 ${
                    formData.bankName ? "text-green-600" : "text-red-600"
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      formData.bankName ? "bg-green-500" : "bg-red-500"
                    }`}
                  ></div>
                  Bank Selection {formData.bankName ? "✓" : "(required)"}
                </div>
                <div
                  className={`flex items-center gap-2 ${
                    formData.accountNumber &&
                    formData.accountNumber.length >= 8 &&
                    formData.accountNumber.length <= 12
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      formData.accountNumber &&
                      formData.accountNumber.length >= 8 &&
                      formData.accountNumber.length <= 12
                        ? "bg-green-500"
                        : "bg-red-500"
                    }`}
                  ></div>
                  Account Number{" "}
                  {formData.accountNumber &&
                  formData.accountNumber.length >= 8 &&
                  formData.accountNumber.length <= 12
                    ? "✓"
                    : "(required, 8-12 digits)"}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                !formData.businessName.trim() ||
                !formData.email ||
                !formData.bankName ||
                !formData.accountNumber ||
                formData.accountNumber.length < 8
              }
              className="w-full h-12 bg-book-600 hover:bg-book-700 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Create Payment Account"
              )}
            </Button>

            {onCancel && (
              <Button
                type="button"
                onClick={onCancel}
                variant="outline"
                className="w-full h-12 rounded-lg"
              >
                Cancel
              </Button>
            )}
          </form>

          {/* Footer */}
          <div className="text-center pt-4 border-t">
            <p className="text-xs text-gray-500">
              Powered by Paystack's secure infrastructure
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BankingDetailsForm;

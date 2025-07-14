import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CheckCircle,
  AlertCircle,
  CreditCard,
  Building2,
  Mail,
  User,
  Loader2,
  Shield,
  DollarSign,
} from "lucide-react";
import {
  SA_BANKS,
  getBankCode,
  isValidAccountNumber,
  isValidEmail,
} from "@/config/paystack";
import { BankingService } from "@/services/bankingService";
import { useAuth } from "@/hooks/useAuth";
import type { BankingFormData, BankingValidationErrors } from "@/types/banking";

interface BankingSetupFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialData?: Partial<BankingFormData>;
}

const BankingSetupForm: React.FC<BankingSetupFormProps> = ({
  onSuccess,
  onCancel,
  initialData = {},
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<BankingFormData>({
    businessName: initialData.businessName || "",
    email: initialData.email || user?.email || "",
    bankName: initialData.bankName || "",
    accountNumber: initialData.accountNumber || "",
    accountHolderName: initialData.accountHolderName || "",
    confirmAccountNumber: initialData.confirmAccountNumber || "",
  });

  const [errors, setErrors] = useState<BankingValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidatingAccount, setIsValidatingAccount] = useState(false);
  const [accountValidation, setAccountValidation] = useState<{
    valid?: boolean;
    accountName?: string;
  }>({});

  // Real-time account number validation
  useEffect(() => {
    const validateAccount = async () => {
      if (
        !formData.accountNumber ||
        !formData.bankName ||
        formData.accountNumber.length < 9
      ) {
        setAccountValidation({});
        return;
      }

      setIsValidatingAccount(true);
      const bankCode = getBankCode(formData.bankName as keyof typeof SA_BANKS);
      const result = await BankingService.validateAccountNumber(
        formData.accountNumber,
        bankCode,
      );

      setAccountValidation(result);
      setIsValidatingAccount(false);
    };

    const timeoutId = setTimeout(validateAccount, 1000); // Debounce
    return () => clearTimeout(timeoutId);
  }, [formData.accountNumber, formData.bankName]);

  const validateForm = (): boolean => {
    const newErrors: BankingValidationErrors = {};

    // Business name validation
    if (!formData.businessName.trim()) {
      newErrors.businessName = "Business name is required";
    } else if (formData.businessName.trim().length < 2) {
      newErrors.businessName = "Business name must be at least 2 characters";
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Bank validation
    if (!formData.bankName) {
      newErrors.bankName = "Please select a bank";
    }

    // Account number validation
    if (!formData.accountNumber.trim()) {
      newErrors.accountNumber = "Account number is required";
    } else if (!isValidAccountNumber(formData.accountNumber)) {
      newErrors.accountNumber = "Account number must be 9-11 digits";
    }

    // Account holder name validation
    if (!formData.accountHolderName.trim()) {
      newErrors.accountHolderName = "Account holder name is required";
    }

    // Confirm account number validation
    if (!formData.confirmAccountNumber.trim()) {
      newErrors.confirmAccountNumber = "Please confirm your account number";
    } else if (formData.accountNumber !== formData.confirmAccountNumber) {
      newErrors.confirmAccountNumber = "Account numbers do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !user) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const bankCode = getBankCode(formData.bankName as keyof typeof SA_BANKS);

      const result = await BankingService.createOrUpdateSubaccount(user.id, {
        userId: user.id,
        businessName: formData.businessName,
        email: formData.email,
        bankName: formData.bankName,
        bankCode,
        accountNumber: formData.accountNumber,
        accountHolderName: formData.accountHolderName,
        status: "pending",
      });

      if (result.success) {
        // Link user's books to the new subaccount
        await BankingService.linkBooksToSubaccount(user.id);
        onSuccess?.();
      } else {
        setErrors({
          general: result.error || "Failed to set up banking details",
        });
      }
    } catch (error) {
      console.error("Banking setup error:", error);
      setErrors({ general: "An unexpected error occurred. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof BankingFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear specific field error
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-green-600" />
          Banking Setup
        </CardTitle>
        <p className="text-sm text-gray-600">
          Set up your banking details to receive payments from book sales.
        </p>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* General Error */}
          {errors.general && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {errors.general}
              </AlertDescription>
            </Alert>
          )}

          {/* Business Name */}
          <div className="space-y-2">
            <Label htmlFor="businessName" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Business Name
            </Label>
            <Input
              id="businessName"
              value={formData.businessName}
              onChange={(e) =>
                handleInputChange("businessName", e.target.value)
              }
              placeholder="Your business or personal name"
              className={errors.businessName ? "border-red-300" : ""}
            />
            {errors.businessName && (
              <p className="text-sm text-red-600">{errors.businessName}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="your@email.com"
              className={errors.email ? "border-red-300" : ""}
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Bank Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Bank
            </Label>
            <Select
              value={formData.bankName}
              onValueChange={(value) => handleInputChange("bankName", value)}
            >
              <SelectTrigger
                className={errors.bankName ? "border-red-300" : ""}
              >
                <SelectValue placeholder="Select your bank" />
              </SelectTrigger>
              <SelectContent>
                {SA_BANKS.map((bank) => (
                  <SelectItem key={bank} value={bank}>
                    {bank}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.bankName && (
              <p className="text-sm text-red-600">{errors.bankName}</p>
            )}
          </div>

          {/* Account Number */}
          <div className="space-y-2">
            <Label htmlFor="accountNumber" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Account Number
            </Label>
            <div className="relative">
              <Input
                id="accountNumber"
                value={formData.accountNumber}
                onChange={(e) =>
                  handleInputChange(
                    "accountNumber",
                    e.target.value.replace(/\D/g, ""),
                  )
                }
                placeholder="1234567890"
                maxLength={11}
                className={errors.accountNumber ? "border-red-300" : ""}
              />
              {isValidatingAccount && (
                <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-gray-400" />
              )}
              {!isValidatingAccount && accountValidation.valid === true && (
                <CheckCircle className="absolute right-3 top-3 h-4 w-4 text-green-600" />
              )}
              {!isValidatingAccount && accountValidation.valid === false && (
                <AlertCircle className="absolute right-3 top-3 h-4 w-4 text-red-600" />
              )}
            </div>
            {errors.accountNumber && (
              <p className="text-sm text-red-600">{errors.accountNumber}</p>
            )}
            {accountValidation.accountName && (
              <p className="text-sm text-green-600">
                ✓ Account holder: {accountValidation.accountName}
              </p>
            )}
          </div>

          {/* Confirm Account Number */}
          <div className="space-y-2">
            <Label
              htmlFor="confirmAccountNumber"
              className="flex items-center gap-2"
            >
              <CreditCard className="h-4 w-4" />
              Confirm Account Number
            </Label>
            <Input
              id="confirmAccountNumber"
              value={formData.confirmAccountNumber}
              onChange={(e) =>
                handleInputChange(
                  "confirmAccountNumber",
                  e.target.value.replace(/\D/g, ""),
                )
              }
              placeholder="Confirm your account number"
              maxLength={11}
              className={errors.confirmAccountNumber ? "border-red-300" : ""}
            />
            {errors.confirmAccountNumber && (
              <p className="text-sm text-red-600">
                {errors.confirmAccountNumber}
              </p>
            )}
          </div>

          {/* Account Holder Name */}
          <div className="space-y-2">
            <Label
              htmlFor="accountHolderName"
              className="flex items-center gap-2"
            >
              <User className="h-4 w-4" />
              Account Holder Name
            </Label>
            <Input
              id="accountHolderName"
              value={formData.accountHolderName}
              onChange={(e) =>
                handleInputChange("accountHolderName", e.target.value)
              }
              placeholder="Full name as it appears on your bank account"
              className={errors.accountHolderName ? "border-red-300" : ""}
            />
            {errors.accountHolderName && (
              <p className="text-sm text-red-600">{errors.accountHolderName}</p>
            )}
          </div>

          {/* Commission Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <DollarSign className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 mb-1">
                  Payment Information
                </h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• You receive 90% of each book sale</li>
                  <li>• Platform fee: 10% per transaction</li>
                  <li>• Payments released after buyer collection</li>
                  <li>• Funds typically arrive within 1-2 business days</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-900 mb-1">
                  Secure & Protected
                </h4>
                <p className="text-sm text-green-800">
                  Your banking details are encrypted and securely stored. We use
                  industry-standard security measures to protect your
                  information.
                </p>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Setting up...
                </>
              ) : (
                "Complete Banking Setup"
              )}
            </Button>

            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default BankingSetupForm;

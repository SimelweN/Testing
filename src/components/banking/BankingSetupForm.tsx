import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
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
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  SA_BANKS,
  getBankCode,
  isValidAccountNumber,
  isValidEmail,
} from "@/config/paystack";
import { BankingService } from "@/services/bankingService";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { diagnoseBankingIssues } from "@/utils/bankingDiagnostics";
import type { BankingFormData, BankingValidationErrors } from "@/types/banking";

interface BankingSetupFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialData?: Partial<BankingFormData>;
}

type FormStep = "business" | "banking" | "verification" | "complete";

const BankingSetupForm: React.FC<BankingSetupFormProps> = ({
  onSuccess,
  onCancel,
  initialData = {},
}) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<FormStep>("business");
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
  const [showAccountNumber, setShowAccountNumber] = useState(false);

  const steps = [
    { id: "business", label: "Business Info", icon: Building2 },
    { id: "banking", label: "Bank Details", icon: CreditCard },
    { id: "verification", label: "Verify", icon: Shield },
    { id: "complete", label: "Complete", icon: CheckCircle },
  ];

  const currentStepIndex = steps.findIndex((step) => step.id === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

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
      try {
        const bankCode = getBankCode(
          formData.bankName as keyof typeof SA_BANKS,
        );
        const result = await BankingService.validateAccountNumber(
          formData.accountNumber.replace(/\s/g, ""),
          bankCode,
        );
        setAccountValidation(result);
      } catch (error) {
        console.error("Account validation error:", error);
        setAccountValidation({ valid: false });
      }
      setIsValidatingAccount(false);
    };

    const timeoutId = setTimeout(validateAccount, 1000); // Debounce
    return () => clearTimeout(timeoutId);
  }, [formData.accountNumber, formData.bankName]);

  const validateStep = (step: FormStep): string[] => {
    const stepErrors: string[] = [];

    switch (step) {
      case "business":
        if (!formData.businessName.trim()) {
          stepErrors.push("Your name is required");
        } else if (formData.businessName.trim().length < 2) {
          stepErrors.push("Your name must be at least 2 characters");
        }

        if (!formData.email.trim()) {
          stepErrors.push("Email is required");
        } else if (!isValidEmail(formData.email)) {
          stepErrors.push("Please enter a valid email address");
        }
        break;

      case "banking":
        if (!formData.bankName) {
          stepErrors.push("Please select a bank");
        }

        if (!formData.accountNumber.trim()) {
          stepErrors.push("Account number is required");
        } else if (!isValidAccountNumber(formData.accountNumber)) {
          stepErrors.push("Please enter a valid account number (9-11 digits)");
        }

        if (!formData.accountHolderName.trim()) {
          stepErrors.push("Account holder name is required");
        }

        if (formData.accountNumber !== formData.confirmAccountNumber) {
          stepErrors.push("Account numbers do not match");
        }
        break;

      case "verification":
        if (!accountValidation.valid) {
          stepErrors.push(
            "Account validation failed. Please check your details.",
          );
        }
        break;
    }

    return stepErrors;
  };

  const canProceedToNextStep = () => {
    const stepErrors = validateStep(currentStep);
    setErrors({});

    if (stepErrors.length > 0) {
      const errorObj: BankingValidationErrors = {};
      stepErrors.forEach((error) => {
        if (error.includes("Your name")) errorObj.businessName = error;
        if (error.includes("Email")) errorObj.email = error;
        if (error.includes("bank")) errorObj.bankName = error;
        if (error.includes("Account number")) errorObj.accountNumber = error;
        if (error.includes("Account holder"))
          errorObj.accountHolderName = error;
        if (error.includes("do not match"))
          errorObj.confirmAccountNumber = error;
      });
      setErrors(errorObj);
      return false;
    }

    return true;
  };

  const handleNext = () => {
    if (!canProceedToNextStep()) return;

    const stepOrder: FormStep[] = [
      "business",
      "banking",
      "verification",
      "complete",
    ];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1]);
      // Scroll to top when moving to next step
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 100);
    }
  };

  const handlePrevious = () => {
    const stepOrder: FormStep[] = [
      "business",
      "banking",
      "verification",
      "complete",
    ];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
      // Scroll to top when moving to previous step
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 100);
    }
  };

  const handleSubmit = async () => {
    if (!canProceedToNextStep()) return;

    setIsSubmitting(true);

    try {
      // First, run banking system diagnostics
      console.log("🔍 Running banking system diagnostics before submission...");
      const diagnostics = await diagnoseBankingIssues();

      // Check if we can proceed
      if (diagnostics.userAuth !== "authenticated") {
        toast.error("Authentication required", {
          description: "Please log out and log back in to continue."
        });
        return;
      }

      const bankingDetails = {
        businessName: formData.businessName.trim(),
        email: formData.email.trim(),
        bankName: formData.bankName,
        bankCode: getBankCode(formData.bankName as keyof typeof SA_BANKS),
        accountNumber: formData.accountNumber.replace(/\s/g, ""),
        accountHolderName: formData.accountHolderName.trim(),
      };

      // Show different messages based on system status
      if (diagnostics.edgeFunction === "unavailable") {
        toast.info("Using backup mode", {
          description: "Banking setup will work in development mode",
          duration: 3000
        });
      } else if (diagnostics.database !== "available") {
        toast.warning("Database connection issues", {
          description: "Setup may take longer than usual",
          duration: 4000
        });
      }

      const result = await BankingService.createOrUpdateSubaccount(
        user!.id,
        bankingDetails,
      );

      if (result.success) {
        setCurrentStep("complete");
        toast.success("Banking setup completed successfully!", {
          description: `Subaccount created: ${result.subaccount_code}`,
        });
        setTimeout(() => {
          onSuccess?.();
        }, 2000);
      } else {
        // Enhanced error handling with specific guidance
        const errorMessage = result.error || "Failed to set up banking details";

        if (errorMessage.includes("authentication") || errorMessage.includes("session")) {
          toast.error("Session expired", {
            description: "Please log out and log back in to continue.",
          });
        } else if (errorMessage.includes("database") || errorMessage.includes("schema")) {
          toast.error("Database connection issue", {
            description: "Our technical team has been notified. Please try again in a few minutes.",
          });
        } else if (errorMessage.includes("Paystack") || errorMessage.includes("payment")) {
          toast.error("Payment service issue", {
            description: "Please verify your banking details and try again.",
          });
        } else {
          toast.error("Setup failed", {
            description: errorMessage,
          });
        }
      }
    } catch (error) {
      console.error("Banking setup error:", error);

      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      if (errorMessage.includes("mock subaccount")) {
        toast.success("Development mode setup complete", {
          description: "Banking details saved for testing.",
        });
        setCurrentStep("complete");
        setTimeout(() => {
          onSuccess?.();
        }, 2000);
      } else {
        toast.error("An error occurred during setup", {
          description: "Please check your internet connection and try again.",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (field: keyof BankingFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear related error
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const formatAccountNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, "");
    // Add spaces every 4 digits for display
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress Header */}
      <Card className="border-2 border-purple-100">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-t-lg">
          <CardTitle className="text-center">
            Banking Setup - Step {currentStepIndex + 1} of {steps.length}
          </CardTitle>
          <div className="mt-4">
            <Progress value={progress} className="h-3" />
            <div className="flex justify-between mt-2">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = index === currentStepIndex;
                const isCompleted = index < currentStepIndex;

                return (
                  <div key={step.id} className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                        isCompleted
                          ? "bg-green-600 border-green-600 text-white"
                          : isActive
                            ? "bg-purple-600 border-purple-600 text-white"
                            : "border-gray-300 text-gray-400"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <span
                      className={`text-xs mt-1 ${
                        isActive
                          ? "text-purple-600 font-medium"
                          : isCompleted
                            ? "text-green-600"
                            : "text-gray-500"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Form Content */}
      <Card className="border-2 border-gray-100">
        <CardContent className="p-8">
          {currentStep === "business" && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <Building2 className="h-12 w-12 text-purple-600 mx-auto mb-3" />
                <h2 className="text-xl font-bold">Business Information</h2>
                <p className="text-gray-600">
                  Tell us about your business for payment processing
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="businessName">Your Name *</Label>
                  <Input
                    id="businessName"
                    value={formData.businessName}
                    onChange={(e) =>
                      updateFormData("businessName", e.target.value)
                    }
                    placeholder="Your name or trading name"
                    className={errors.businessName ? "border-red-500" : ""}
                  />
                  {errors.businessName && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.businessName}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateFormData("email", e.target.value)}
                    placeholder="your@email.com"
                    className={errors.email ? "border-red-500" : ""}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {currentStep === "banking" && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <CreditCard className="h-12 w-12 text-purple-600 mx-auto mb-3" />
                <h2 className="text-xl font-bold">Bank Account Details</h2>
                <p className="text-gray-600">
                  Enter your bank account information securely
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="bankName">Bank *</Label>
                  <Select
                    value={formData.bankName}
                    onValueChange={(value) => updateFormData("bankName", value)}
                  >
                    <SelectTrigger
                      className={errors.bankName ? "border-red-500" : ""}
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
                    <p className="text-red-500 text-sm mt-1">
                      {errors.bankName}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="accountNumber">Account Number *</Label>
                  <div className="relative">
                    <Input
                      id="accountNumber"
                      type={showAccountNumber ? "text" : "password"}
                      value={
                        showAccountNumber
                          ? formatAccountNumber(formData.accountNumber)
                          : formData.accountNumber.replace(/./g, "•")
                      }
                      onChange={(e) => {
                        const value = e.target.value.replace(/\s/g, "");
                        updateFormData("accountNumber", value);
                      }}
                      placeholder="Enter your account number"
                      className={
                        errors.accountNumber ? "border-red-500 pr-10" : "pr-10"
                      }
                      maxLength={15}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2"
                      onClick={() => setShowAccountNumber(!showAccountNumber)}
                    >
                      {showAccountNumber ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {isValidatingAccount && (
                    <div className="flex items-center mt-1 text-sm text-blue-600">
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      Validating account...
                    </div>
                  )}
                  {accountValidation.accountName && (
                    <div className="flex items-center mt-1 text-sm text-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Account holder: {accountValidation.accountName}
                    </div>
                  )}
                  {errors.accountNumber && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.accountNumber}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="confirmAccountNumber">
                    Confirm Account Number *
                  </Label>
                  <Input
                    id="confirmAccountNumber"
                    type="password"
                    value={formData.confirmAccountNumber}
                    onChange={(e) =>
                      updateFormData("confirmAccountNumber", e.target.value)
                    }
                    placeholder="Re-enter your account number"
                    className={
                      errors.confirmAccountNumber ? "border-red-500" : ""
                    }
                  />
                  {errors.confirmAccountNumber && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.confirmAccountNumber}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="accountHolderName">
                    Account Holder Name *
                  </Label>
                  <Input
                    id="accountHolderName"
                    value={formData.accountHolderName}
                    onChange={(e) =>
                      updateFormData("accountHolderName", e.target.value)
                    }
                    placeholder="Name as it appears on your bank account"
                    className={errors.accountHolderName ? "border-red-500" : ""}
                  />
                  {errors.accountHolderName && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.accountHolderName}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {currentStep === "verification" && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <Shield className="h-12 w-12 text-purple-600 mx-auto mb-3" />
                <h2 className="text-xl font-bold">Verify Your Information</h2>
                <p className="text-gray-600">
                  Review your details before submitting
                </p>
              </div>

              <div className="space-y-4">
                <Card className="bg-gray-50">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="font-medium">Your Name:</span>
                      <span>{formData.businessName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Email:</span>
                      <span>{formData.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Bank:</span>
                      <span>{formData.bankName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Account Number:</span>
                      <span className="font-mono">
                        {"•".repeat(formData.accountNumber.length - 4) +
                          formData.accountNumber.slice(-4)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Account Holder:</span>
                      <span>{formData.accountHolderName}</span>
                    </div>
                  </CardContent>
                </Card>

                {accountValidation.valid && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Account validation successful! Your banking details are
                      ready to be submitted.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          )}

          {currentStep === "complete" && (
            <div className="text-center space-y-6">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
              <h2 className="text-2xl font-bold text-green-900">
                Setup Complete!
              </h2>
              <p className="text-gray-600">
                Your banking details have been successfully configured. You can
                now start selling books!
              </p>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-medium text-green-900 mb-2">
                  What happens next?
                </h3>
                <ul className="text-sm text-green-800 space-y-1 text-left">
                  <li>• Your account will be verified within 24-48 hours</li>
                  <li>
                    • You'll receive email updates on your verification status
                  </li>
                  <li>• Once verified, you can start receiving payments</li>
                  <li>• Payments are processed securely through Paystack</li>
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      {currentStep !== "complete" && (
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between">
              <Button
                onClick={handlePrevious}
                variant="outline"
                disabled={currentStep === "business"}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              {currentStep === "verification" ? (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !accountValidation.valid}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  {isSubmitting ? "Setting up..." : "Complete Setup"}
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cancel Button */}
      {onCancel && currentStep !== "complete" && (
        <div className="text-center">
          <Button onClick={onCancel} variant="ghost" size="sm">
            Cancel Setup
          </Button>
        </div>
      )}
    </div>
  );
};

export default BankingSetupForm;

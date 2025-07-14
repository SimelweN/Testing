import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Lock,
  Info,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { setupSellerBanking } from "@/services/paystackService";
import { toast } from "sonner";

interface BankingInfo {
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  accountType: string;
  branchCode?: string;
}

const BankingProfileTab = () => {
  const { user } = useAuth();
  const [bankingInfo, setBankingInfo] = useState<BankingInfo | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [formData, setFormData] = useState<BankingInfo>({
    accountHolderName: "",
    bankName: "",
    accountNumber: "",
    accountType: "current",
    branchCode: "",
  });

  const southAfricanBanks = [
    "ABSA",
    "Standard Bank",
    "First National Bank (FNB)",
    "Nedbank",
    "Capitec Bank",
    "African Bank",
    "Bidvest Bank",
    "Discovery Bank",
    "Investec",
    "TymeBank",
    "Bank Zero",
    "Other",
  ];

  useEffect(() => {
    if (user) {
      fetchBankingInfo();
    }
  }, [user]);

  const fetchBankingInfo = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("banking_info, banking_verified, banking_setup_at")
        .eq("id", user?.id)
        .single();

      if (error) {
        console.error("Error fetching banking info:", error);
        return;
      }

      if (data?.banking_info) {
        setBankingInfo(data.banking_info as BankingInfo);
        setFormData(data.banking_info as BankingInfo);
        setIsVerified(data.banking_verified || false);
      } else {
        setIsEditing(true); // Start in edit mode if no banking info exists
      }
    } catch (error) {
      console.error("Error fetching banking info:", error);
      toast.error("Failed to load banking information");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);

      const { error } = await supabase
        .from("profiles")
        .update({
          banking_info: formData,
          banking_setup_at: new Date().toISOString(),
          banking_verified: false, // Requires manual verification
        })
        .eq("id", user?.id);

      if (error) {
        throw error;
      }

      setBankingInfo(formData);
      setIsVerified(false);
      setIsEditing(false);
      toast.success("Banking information saved successfully");
    } catch (error) {
      console.error("Error saving banking info:", error);
      toast.error("Failed to save banking information");
    } finally {
      setSaving(false);
    }
  };

  const validateForm = () => {
    if (!formData.accountHolderName.trim()) {
      toast.error("Account holder name is required");
      return false;
    }
    if (!formData.bankName) {
      toast.error("Bank name is required");
      return false;
    }
    if (!formData.accountNumber.trim()) {
      toast.error("Account number is required");
      return false;
    }
    if (formData.accountNumber.length < 8) {
      toast.error("Account number must be at least 8 digits");
      return false;
    }
    return true;
  };

  const handleInputChange = (field: keyof BankingInfo, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const maskAccountNumber = (accountNumber: string) => {
    if (accountNumber.length <= 4) return accountNumber;
    return `****${accountNumber.slice(-4)}`;
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Banking Profile
            {isVerified && (
              <Badge variant="default" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            )}
            {bankingInfo && !isVerified && (
              <Badge
                variant="outline"
                className="border-orange-500 text-orange-700"
              >
                <AlertTriangle className="h-3 w-3 mr-1" />
                Pending Verification
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Banking information is required to list books for sale. Your
              information is stored securely and encrypted. Once submitted,
              you'll need to contact support to make changes.
            </AlertDescription>
          </Alert>

          {!bankingInfo && !isEditing && (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Set Up Banking Information
              </h3>
              <p className="text-gray-600 mb-4">
                Add your banking details to start selling books and receive
                payments.
              </p>
              <Button
                onClick={() => setIsEditing(true)}
                className="bg-book-600 hover:bg-book-700"
              >
                Add Banking Details
              </Button>
            </div>
          )}

          {bankingInfo && !isEditing && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Account Holder
                  </Label>
                  <p className="text-sm text-gray-900 mt-1">
                    {bankingInfo.accountHolderName}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Bank
                  </Label>
                  <p className="text-sm text-gray-900 mt-1">
                    {bankingInfo.bankName}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Account Number
                  </Label>
                  <p className="text-sm text-gray-900 mt-1 font-mono">
                    {maskAccountNumber(bankingInfo.accountNumber)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Account Type
                  </Label>
                  <p className="text-sm text-gray-900 mt-1 capitalize">
                    {bankingInfo.accountType}
                  </p>
                </div>
                {bankingInfo.branchCode && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      Branch Code
                    </Label>
                    <p className="text-sm text-gray-900 mt-1">
                      {bankingInfo.branchCode}
                    </p>
                  </div>
                )}
              </div>

              <Alert>
                <Lock className="h-4 w-4" />
                <AlertDescription>
                  To change your banking information, please contact our support
                  team. This security measure protects your account from
                  unauthorized changes.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {isEditing && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="accountHolder">Account Holder Name *</Label>
                  <Input
                    id="accountHolder"
                    value={formData.accountHolderName}
                    onChange={(e) =>
                      handleInputChange("accountHolderName", e.target.value)
                    }
                    placeholder="Full name as on bank account"
                  />
                </div>
                <div>
                  <Label htmlFor="bankName">Bank Name *</Label>
                  <Select
                    value={formData.bankName}
                    onValueChange={(value) =>
                      handleInputChange("bankName", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your bank" />
                    </SelectTrigger>
                    <SelectContent>
                      {southAfricanBanks.map((bank) => (
                        <SelectItem key={bank} value={bank}>
                          {bank}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="accountNumber">Account Number *</Label>
                  <Input
                    id="accountNumber"
                    value={formData.accountNumber}
                    onChange={(e) =>
                      handleInputChange(
                        "accountNumber",
                        e.target.value.replace(/\D/g, ""),
                      )
                    }
                    placeholder="Account number"
                    maxLength={12}
                  />
                </div>
                <div>
                  <Label htmlFor="accountType">Account Type</Label>
                  <Select
                    value={formData.accountType}
                    onValueChange={(value) =>
                      handleInputChange("accountType", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="current">Current Account</SelectItem>
                      <SelectItem value="savings">Savings Account</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="branchCode">Branch Code (Optional)</Label>
                  <Input
                    id="branchCode"
                    value={formData.branchCode}
                    onChange={(e) =>
                      handleInputChange(
                        "branchCode",
                        e.target.value.replace(/\D/g, ""),
                      )
                    }
                    placeholder="6-digit branch code"
                    maxLength={6}
                  />
                </div>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Double-check your banking details carefully. Once submitted,
                  changes require contacting support. This information will be
                  used for payment processing through Paystack.
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-book-600 hover:bg-book-700"
                >
                  {saving ? "Saving..." : "Save Banking Details"}
                </Button>
                {bankingInfo && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData(bankingInfo);
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {bankingInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Payment Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">
                How Payments Work
              </h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• You receive 90% of each book sale</li>
                <li>• ReBooked keeps 10% as platform fee</li>
                <li>
                  • Payments are held in escrow until delivery confirmation
                </li>
                <li>
                  • Funds are released to your account within 3-5 business days
                  after delivery
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BankingProfileTab;

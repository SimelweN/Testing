import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { ActivityService } from "@/services/activityService";

const SOUTH_AFRICAN_BANKS = [
  { name: "ABSA Bank", branchCode: "632005" },
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

interface BankingFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function BankingForm({ onSuccess, onCancel }: BankingFormProps) {
  const [formData, setFormData] = useState({
    businessName: "",
    email: "",
    bankName: "",
    accountNumber: "",
  });
  const [branchCode, setBranchCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadExistingBankingDetails();
  }, []);

  const loadExistingBankingDetails = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { 
        navigate("/login"); 
        return; 
      }

      // Read profile to detect existing subaccount (edit mode)
      const { data: profile } = await supabase
        .from("profiles")
        .select("subaccount_code, preferences")
        .eq("id", session.user.id)
        .single();

      if (profile?.subaccount_code) {
        // Prefer secure fetch for sensitive values
        const { data: decRes } = await supabase.functions.invoke(
          "decrypt-banking-details",
          { headers: { Authorization: `Bearer ${session.access_token}` } }
        );

        setFormData({
          businessName: (profile.preferences as any)?.business_name || "",
          email: session.user.email || "",
          bankName: decRes?.data?.bank_name || (profile.preferences as any)?.bank_details?.bank_name || "",
          accountNumber: "", // never prefill full account
        });
        setBranchCode(decRes?.data?.bank_code || (profile.preferences as any)?.bank_details?.bank_code || "");
        setIsEditMode(true);
      } else {
        setFormData((p) => ({ ...p, email: session.user.email || "" }));
      }
    } catch (e) {
      console.error("Error loading banking details:", e);
    }
  };

  const validateForm = () => {
    if (!formData.businessName.trim()) { 
      toast({ title: "Name is required", variant: "destructive" }); 
      return false; 
    }
    if (!formData.email.includes("@")) { 
      toast({ title: "Enter a valid email", variant: "destructive" }); 
      return false; 
    }
    if (!formData.bankName) { 
      toast({ title: "Select a bank", variant: "destructive" }); 
      return false; 
    }
    if (formData.accountNumber.length < 8) { 
      toast({ title: "Account number must be at least 8 digits", variant: "destructive" }); 
      return false; 
    }
    return true;
  };

  const handleBankChange = (bankName: string) => {
    const bank = SOUTH_AFRICAN_BANKS.find(b => b.name === bankName);
    setFormData((p) => ({ ...p, bankName }));
    setBranchCode(bank?.branchCode || "");
  };

  const handleAccountNumberChange = (value: string) => {
    const digitsOnly = value.replace(/\D/g, "");
    setFormData((p) => ({ ...p, accountNumber: digitsOnly }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Please log in to continue");

      const { data, error } = await supabase.functions.invoke(
        "create-paystack-subaccount",
        {
          body: {
            business_name: formData.businessName,
            email: formData.email,
            bank_name: formData.bankName,
            bank_code: branchCode,
            account_number: formData.accountNumber,
            is_update: isEditMode, // <- this flag controls update vs create
          },
          headers: { Authorization: `Bearer ${session.access_token}` },
        }
      );

      if (error) throw new Error(error.message || "Failed to submit banking details");
      if (!data?.success) throw new Error(data?.error || "Failed to process subaccount");

      // Log the banking update activity
      try {
        await ActivityService.logBankingUpdate(session.user.id, isEditMode);
        console.log("✅ Banking update activity logged");
      } catch (activityError) {
        console.warn("⚠️ Failed to log banking update activity:", activityError);
        // Don't fail the entire operation for activity logging issues
      }

      toast({ title: "Success!", description: data.message });
      if (onSuccess) {
        onSuccess();
      } else {
        navigate("/profile");
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Something went wrong", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Business Name */}
      <div className="space-y-2">
        <Label htmlFor="businessName">Your Name *</Label>
        <Input 
          id="businessName" 
          value={formData.businessName}
          onChange={(e) => setFormData((p) => ({ ...p, businessName: e.target.value }))} 
          required 
        />
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input 
          id="email" 
          type="email" 
          value={formData.email}
          onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))} 
          required 
        />
      </div>

      {/* Bank */}
      <div className="space-y-2">
        <Label>Select Bank *</Label>
        <Select onValueChange={handleBankChange} value={formData.bankName}>
          <SelectTrigger>
            <SelectValue placeholder="Choose your bank" />
          </SelectTrigger>
          <SelectContent>
            {SOUTH_AFRICAN_BANKS.map((b) => (
              <SelectItem key={b.name} value={b.name}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Branch code (auto) */}
      {branchCode && (
        <div className="space-y-2">
          <Label>Branch Code (Auto-filled)</Label>
          <Input value={branchCode} readOnly className="bg-gray-50" />
        </div>
      )}

      {/* Account Number */}
      <div className="space-y-2">
        <Label htmlFor="accountNumber">Account Number *</Label>
        <Input 
          id="accountNumber" 
          value={formData.accountNumber}
          onChange={(e) => handleAccountNumberChange(e.target.value)} 
          maxLength={15} 
          required 
          placeholder="Enter your account number"
        />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting 
            ? (isEditMode ? "Updating Account..." : "Creating Account...") 
            : (isEditMode ? "Update Payment Account" : "Create Payment Account")
          }
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

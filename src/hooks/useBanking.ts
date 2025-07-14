import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { BankingService } from "@/services/bankingService";
import type { BankingSubaccount, BankingDetails } from "@/types/banking";

export const useBanking = () => {
  const { user } = useAuth();
  const [bankingDetails, setBankingDetails] =
    useState<BankingSubaccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBankingDetails = async () => {
    if (!user) {
      setIsLoading(false);
      setBankingDetails(null);
      return;
    }

    try {
      setError(null);
      const details = await BankingService.getUserBankingDetails(user.id);
      setBankingDetails(details);
    } catch (err) {
      console.error("Error fetching banking details:", err);
      setError("Failed to load banking details");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBankingDetails();
  }, [user]);

  const setupBanking = async (
    details: BankingDetails,
  ): Promise<{
    success: boolean;
    subaccountCode?: string;
    error?: string;
  }> => {
    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    try {
      const result = await BankingService.createOrUpdateSubaccount(
        user.id,
        details,
      );

      if (result.success) {
        // Refresh banking details after successful setup
        await fetchBankingDetails();

        // Link books to new subaccount
        await BankingService.linkBooksToSubaccount(user.id);
      }

      return result;
    } catch (err) {
      console.error("Error setting up banking:", err);
      return { success: false, error: "An unexpected error occurred" };
    }
  };

  const updateBanking = async (
    details: BankingDetails,
  ): Promise<{
    success: boolean;
    subaccountCode?: string;
    error?: string;
  }> => {
    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    try {
      const result = await BankingService.updateSubaccount(user.id, details);

      if (result.success) {
        // Refresh banking details after successful update
        await fetchBankingDetails();
      }

      return result;
    } catch (err) {
      console.error("Error updating banking:", err);
      return { success: false, error: "An unexpected error occurred" };
    }
  };

  const validateAccountNumber = async (
    accountNumber: string,
    bankCode: string,
  ): Promise<{ valid: boolean; accountName?: string; error?: string }> => {
    try {
      return await BankingService.validateAccountNumber(
        accountNumber,
        bankCode,
      );
    } catch (err) {
      console.error("Error validating account number:", err);
      return { valid: false, error: "Validation service unavailable" };
    }
  };

  const refreshBankingDetails = () => {
    setIsLoading(true);
    fetchBankingDetails();
  };

  return {
    bankingDetails,
    isLoading,
    error,
    setupBanking,
    updateBanking,
    validateAccountNumber,
    refreshBankingDetails,

    // Computed properties
    hasBankingSetup: !!bankingDetails,
    isActive: bankingDetails?.status === "active",
    subaccountCode: bankingDetails?.subaccount_code,
    businessName: bankingDetails?.business_name,
    bankName: bankingDetails?.bank_name,
    maskedAccountNumber: bankingDetails
      ? `****${bankingDetails.account_number.slice(-4)}`
      : undefined,
  };
};

export default useBanking;

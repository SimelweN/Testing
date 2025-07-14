import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { BankingService } from "@/services/bankingService";
import type { SellerRequirements } from "@/types/banking";

export const useSellerRequirements = () => {
  const { user } = useAuth();
  const [requirements, setRequirements] = useState<SellerRequirements>({
    hasBankingSetup: false,
    hasPickupAddress: false,
    hasActiveBooks: false,
    canReceivePayments: false,
    setupCompletionPercentage: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequirements = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      const reqs = await BankingService.getSellerRequirements(user.id);
      setRequirements(reqs);
    } catch (err) {
      console.error("Error fetching seller requirements:", err);
      setError("Failed to load seller requirements");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequirements();
  }, [user]);

  const refreshRequirements = () => {
    setIsLoading(true);
    fetchRequirements();
  };

  return {
    requirements,
    isLoading,
    error,
    refreshRequirements,

    // Computed properties for convenience
    isComplete: requirements.canReceivePayments,
    completionPercentage: requirements.setupCompletionPercentage,
    nextRequiredStep: (() => {
      if (!requirements.hasBankingSetup) return "banking";
      if (!requirements.hasPickupAddress) return "address";
      if (!requirements.hasActiveBooks) return "books";
      return null;
    })(),

    // Step-specific checks
    needsBanking: !requirements.hasBankingSetup,
    needsAddress: !requirements.hasPickupAddress,
    needsBooks: !requirements.hasActiveBooks,
  };
};

export default useSellerRequirements;

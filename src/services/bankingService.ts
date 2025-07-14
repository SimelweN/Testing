import { supabase } from "@/integrations/supabase/client";

export interface BankingStatus {
  hasBankingInfo: boolean;
  isVerified: boolean;
  canListBooks: boolean;
  missingRequirements: string[];
}

export const checkBankingRequirements = async (
  userId: string,
): Promise<BankingStatus> => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("banking_info, banking_verified, pickup_address")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error checking banking requirements:", error);
      throw error;
    }

    const hasBankingInfo =
      data?.banking_info !== null && data?.banking_info !== undefined;
    const isVerified = data?.banking_verified === true;
    const hasAddress =
      data?.pickup_address !== null && data?.pickup_address !== undefined;

    const missingRequirements: string[] = [];

    if (!hasBankingInfo) {
      missingRequirements.push("Banking information must be provided");
    }

    if (!hasAddress) {
      missingRequirements.push("Pickup address must be set");
    }

    if (hasBankingInfo && !isVerified) {
      missingRequirements.push(
        "Banking information requires verification (contact support)",
      );
    }

    const canListBooks = hasBankingInfo && hasAddress && isVerified;

    return {
      hasBankingInfo,
      isVerified,
      canListBooks,
      missingRequirements,
    };
  } catch (error) {
    console.error("Error in checkBankingRequirements:", error);
    return {
      hasBankingInfo: false,
      isVerified: false,
      canListBooks: false,
      missingRequirements: ["Unable to verify requirements - please try again"],
    };
  }
};

export const createPaystackSubaccount = async (
  userId: string,
  bankingInfo: any,
): Promise<string | null> => {
  try {
    // This would integrate with Paystack API to create a subaccount
    // For now, return a mock subaccount code
    const mockSubaccountCode = `ACCT_${userId.slice(0, 8)}_${Date.now()}`;

    // Update user profile with subaccount code
    const { error } = await supabase
      .from("profiles")
      .update({ paystack_subaccount_code: mockSubaccountCode })
      .eq("id", userId);

    if (error) {
      throw error;
    }

    return mockSubaccountCode;
  } catch (error) {
    console.error("Error creating Paystack subaccount:", error);
    return null;
  }
};

export const getBankingInfo = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "banking_info, banking_verified, banking_setup_at, paystack_subaccount_code",
      )
      .eq("id", userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching banking info:", error);
    return null;
  }
};

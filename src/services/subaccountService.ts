import { supabase } from "@/integrations/supabase/client";
import { PAYSTACK_CONFIG } from "@/config/paystack";

export interface SubaccountData {
  business_name: string;
  settlement_bank: string;
  account_number: string;
  percentage_charge: number;
}

export interface SellerSubaccount {
  id: string;
  user_id: string;
  subaccount_code: string;
  business_name: string;
  account_number: string;
  bank_code: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export class SubaccountService {
  /**
   * Create a Paystack subaccount for a seller
   */
  static async createSubaccount(
    sellerId: string,
    subaccountData: SubaccountData,
  ): Promise<{
    success: boolean;
    subaccount?: SellerSubaccount;
    error?: string;
  }> {
    try {
      // In a real implementation, this would call Paystack API to create subaccount
      // For now, we'll simulate this process and store the data in our database

      const { data, error } = await supabase
        .from("banking_subaccounts")
        .insert({
          user_id: sellerId,
          subaccount_code: `ACCT_${sellerId}_${Date.now()}`,
          business_name: subaccountData.business_name,
          account_number: subaccountData.account_number,
          bank_code: subaccountData.settlement_bank,
          email: "", // Will need to be provided
          status: "active",
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating subaccount:", error);
        return { success: false, error: "Failed to create subaccount" };
      }

      return { success: true, subaccount: data };
    } catch (error) {
      console.error("Subaccount creation error:", error);
      return { success: false, error: "An unexpected error occurred" };
    }
  }

  /**
   * Get seller's active subaccount
   */
  static async getSellerSubaccount(sellerId: string): Promise<{
    success: boolean;
    subaccount?: SellerSubaccount;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from("banking_subaccounts")
        .select("*")
        .eq("user_id", sellerId)
        .eq("status", "active")
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No subaccount found
          return { success: true, subaccount: undefined };
        }
        console.error("Error fetching subaccount:", error);
        return { success: false, error: "Failed to fetch subaccount" };
      }

      return { success: true, subaccount: data };
    } catch (error) {
      console.error("Subaccount fetch error:", error);
      return { success: false, error: "An unexpected error occurred" };
    }
  }

  /**
   * Update seller's subaccount
   */
  static async updateSubaccount(
    subaccountId: string,
    updates: Partial<SubaccountData>,
  ): Promise<{
    success: boolean;
    subaccount?: SellerSubaccount;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from("banking_subaccounts")
        .update({
          ...updates,
        })
        .eq("id", subaccountId)
        .select()
        .single();

      if (error) {
        console.error("Error updating subaccount:", error);
        return { success: false, error: "Failed to update subaccount" };
      }

      return { success: true, subaccount: data };
    } catch (error) {
      console.error("Subaccount update error:", error);
      return { success: false, error: "An unexpected error occurred" };
    }
  }

  /**
   * Deactivate seller's subaccount
   */
  static async deactivateSubaccount(
    subaccountId: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from("banking_subaccounts")
        .update({
          status: "failed",
        })
        .eq("id", subaccountId);

      if (error) {
        console.error("Error deactivating subaccount:", error);
        return { success: false, error: "Failed to deactivate subaccount" };
      }

      return { success: true };
    } catch (error) {
      console.error("Subaccount deactivation error:", error);
      return { success: false, error: "An unexpected error occurred" };
    }
  }

  /**
   * Validate subaccount data
   */
  static validateSubaccountData(data: SubaccountData): string[] {
    const errors: string[] = [];

    if (!data.business_name?.trim()) {
      errors.push("Business name is required");
    }

    if (!data.settlement_bank?.trim()) {
      errors.push("Settlement bank is required");
    }

    if (!data.account_number?.trim()) {
      errors.push("Account number is required");
    } else if (!/^\d{9,11}$/.test(data.account_number.replace(/\s/g, ""))) {
      errors.push("Account number must be 9-11 digits");
    }

    if (data.percentage_charge < 0 || data.percentage_charge > 100) {
      errors.push("Percentage charge must be between 0 and 100");
    }

    return errors;
  }
}

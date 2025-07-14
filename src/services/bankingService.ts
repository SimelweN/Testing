import { supabase } from "@/lib/supabase";
import { PAYSTACK_CONFIG } from "@/config/paystack";
import type {
  BankingDetails,
  BankingSubaccount,
  SubaccountCreationRequest,
  SubaccountCreationResponse,
  SellerRequirements,
  BankingRequirementsStatus,
} from "@/types/banking";

export class BankingService {
  /**
   * Get user's banking details
   */
  static async getUserBankingDetails(
    userId: string,
  ): Promise<BankingSubaccount | null> {
    try {
      const { data, error } = await supabase
        .from("banking_subaccounts")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "active")
        .single();

      if (error && error.code !== "PGRST116") {
        // Check if table doesn't exist (development scenario)
        if (
          error.code === "42P01" ||
          error.message?.includes("does not exist")
        ) {
          console.warn(
            "🛠️ Banking table doesn't exist - using development fallback",
          );
          return null; // Return null indicating no banking setup yet
        }

        // Not found is ok
        console.error("Database error fetching banking details:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        throw new Error(
          `Database error: ${error.message || "Failed to fetch banking details"}`,
        );
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        // Check for table doesn't exist error
        if (
          error.message?.includes("does not exist") ||
          (error.message?.includes("relation") &&
            error.message?.includes("banking_subaccounts"))
        ) {
          console.warn(
            "🛠️ Banking table doesn't exist - using development fallback",
          );
          return null; // Return null indicating no banking setup yet
        }
        console.error("Error fetching banking details:", error.message);
        throw error;
      } else {
        console.error("Unknown error fetching banking details:", error);
        throw new Error(
          "An unknown error occurred while fetching banking details",
        );
      }
    }
  }

  /**
   * Create or update Paystack subaccount
   */
  static async createOrUpdateSubaccount(
    userId: string,
    bankingDetails: BankingDetails,
  ): Promise<{ success: boolean; subaccountCode?: string; error?: string }> {
    try {
      // Check if user already has a subaccount
      const existingSubaccount = await this.getUserBankingDetails(userId);

      if (existingSubaccount) {
        // Update existing subaccount
        return this.updateSubaccount(userId, bankingDetails);
      }

      // Create new subaccount via Edge Function
      const { data, error } = await supabase.functions.invoke(
        "create-paystack-subaccount",
        {
          body: {
            userId: userId,
            businessName: bankingDetails.businessName,
            bankCode: bankingDetails.bankCode,
            accountNumber: bankingDetails.accountNumber,
            primaryContactEmail: bankingDetails.email,
            primaryContactName: bankingDetails.businessName,
            primaryContactPhone: bankingDetails.phone || undefined,
            percentageCharge: 10, // 10% platform commission
          },
        },
      );

      if (error) {
        console.error("Error creating subaccount:", error);
        return {
          success: false,
          error: "Failed to create banking account. Please try again.",
        };
      }

      // Save to local database
      await this.saveBankingDetails(userId, {
        ...bankingDetails,
        subaccountCode: data.subaccount_code,
        status: "active",
      });

      return {
        success: true,
        subaccountCode: data.subaccount_code,
      };
    } catch (error) {
      console.error("Banking service error:", error);
      return {
        success: false,
        error: "An unexpected error occurred. Please try again.",
      };
    }
  }

  /**
   * Update existing subaccount
   */
  static async updateSubaccount(
    userId: string,
    bankingDetails: BankingDetails,
  ): Promise<{ success: boolean; subaccountCode?: string; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke(
        "update-paystack-subaccount",
        {
          body: {
            userId: userId,
            businessName: bankingDetails.businessName,
            bankCode: bankingDetails.bankCode,
            accountNumber: bankingDetails.accountNumber,
            primaryContactEmail: bankingDetails.email,
            primaryContactName: bankingDetails.businessName,
            primaryContactPhone: bankingDetails.phone || undefined,
          },
        },
      );

      if (error) {
        return { success: false, error: "Failed to update banking details." };
      }

      // Update local database
      const { error: updateError } = await supabase
        .from("banking_subaccounts")
        .update({
          business_name: bankingDetails.businessName,
          bank_name: bankingDetails.bankName,
          bank_code: bankingDetails.bankCode,
          account_number: bankingDetails.accountNumber,
          email: bankingDetails.email,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (updateError) {
        throw updateError;
      }

      return {
        success: true,
        subaccountCode: data.subaccount_code,
      };
    } catch (error) {
      console.error("Error updating subaccount:", error);
      return {
        success: false,
        error: "Failed to update banking details.",
      };
    }
  }

  /**
   * Save banking details to local database
   */
  private static async saveBankingDetails(
    userId: string,
    bankingDetails: BankingDetails & { subaccountCode: string },
  ): Promise<void> {
    const { error } = await supabase.from("banking_subaccounts").upsert(
      {
        user_id: userId,
        subaccount_code: bankingDetails.subaccountCode,
        business_name: bankingDetails.businessName,
        bank_name: bankingDetails.bankName,
        bank_code: bankingDetails.bankCode,
        account_number: bankingDetails.accountNumber,
        email: bankingDetails.email,
        status: bankingDetails.status,
        created_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      },
    );

    if (error) {
      // Check if table doesn't exist (development scenario)
      if (error.code === "42P01" || error.message?.includes("does not exist")) {
        console.warn(
          "🛠️ Banking table doesn't exist - using development fallback for saving",
        );
        console.log("ℹ️ Banking details would be saved:", {
          user_id: userId,
          business_name: bankingDetails.businessName,
          bank_name: bankingDetails.bankName,
          subaccount_code: bankingDetails.subaccountCode,
        });
        return; // Silently succeed in development
      }

      console.error("Error saving banking details:", error);
      throw new Error("Failed to save banking details to database");
    }
  }

  /**
   * Get seller requirements status
   */
  static async getSellerRequirements(
    userId: string,
  ): Promise<SellerRequirements> {
    try {
      // Check banking setup
      const bankingDetails = await this.getUserBankingDetails(userId);
      const hasBankingSetup = !!bankingDetails;

      // Check pickup address (from user profile)
      const { data: profile } = await supabase
        .from("profiles")
        .select("pickup_address")
        .eq("id", userId)
        .single();

      const hasPickupAddress = !!profile?.pickup_address;

      // Check active books
      const { data: books } = await supabase
        .from("books")
        .select("id")
        .eq("seller_id", userId)
        .eq("status", "available");

      const hasActiveBooks = (books?.length || 0) > 0;

      const canReceivePayments = hasBankingSetup && hasPickupAddress;

      // Calculate completion percentage
      const requirements = [hasBankingSetup, hasPickupAddress, hasActiveBooks];
      const completedCount = requirements.filter(Boolean).length;
      const setupCompletionPercentage = Math.round(
        (completedCount / requirements.length) * 100,
      );

      return {
        hasBankingSetup,
        hasPickupAddress,
        hasActiveBooks,
        canReceivePayments,
        setupCompletionPercentage,
      };
    } catch (error) {
      console.error("Error checking seller requirements:", error);
      return {
        hasBankingSetup: false,
        hasPickupAddress: false,
        hasActiveBooks: false,
        canReceivePayments: false,
        setupCompletionPercentage: 0,
      };
    }
  }

  /**
   * Link user's books to their subaccount
   */
  static async linkBooksToSubaccount(userId: string): Promise<void> {
    try {
      const bankingDetails = await this.getUserBankingDetails(userId);

      if (!bankingDetails?.subaccount_code) {
        throw new Error("No subaccount found for user");
      }

      // Update all user's books to include subaccount code
      const { error } = await supabase
        .from("books")
        .update({ subaccount_code: bankingDetails.subaccount_code })
        .eq("seller_id", userId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error("Error linking books to subaccount:", error);
      throw new Error("Failed to link books to payment account");
    }
  }

  /**
   * Development fallback when Paystack is not configured
   */
  static async createDevelopmentSubaccount(
    userId: string,
    bankingDetails: BankingDetails,
  ): Promise<{ success: boolean; subaccountCode?: string; error?: string }> {
    console.warn("🛠️ Using development fallback for banking setup");

    try {
      const mockSubaccountCode = `ACCT_dev_${userId.slice(0, 8)}_${Date.now()}`;

      await this.saveBankingDetails(userId, {
        ...bankingDetails,
        subaccountCode: mockSubaccountCode,
        status: "active",
      });

      return {
        success: true,
        subaccountCode: mockSubaccountCode,
      };
    } catch (error) {
      return {
        success: false,
        error: "Development fallback failed",
      };
    }
  }

  /**
   * Validate account number with bank
   */
  static async validateAccountNumber(
    accountNumber: string,
    bankCode: string,
  ): Promise<{ valid: boolean; accountName?: string; error?: string }> {
    try {
      if (!PAYSTACK_CONFIG.isConfigured()) {
        // Development fallback
        return {
          valid: true,
          accountName: "John Doe (Development)",
        };
      }

      const { data, error } = await supabase.functions.invoke(
        "validate-account-number",
        {
          body: { accountNumber: accountNumber, bankCode: bankCode },
        },
      );

      if (error) {
        return { valid: false, error: "Could not validate account number" };
      }

      return {
        valid: data.status,
        accountName: data.data?.account_name,
      };
    } catch (error) {
      console.error("Account validation error:", error);
      return { valid: false, error: "Validation service unavailable" };
    }
  }

  /**
   * Check banking requirements for listing books
   */
  static async checkBankingRequirements(
    userId: string,
  ): Promise<BankingRequirementsStatus> {
    try {
      const requirements = await this.getSellerRequirements(userId);
      const bankingDetails = await this.getUserBankingDetails(userId);

      const missingRequirements: string[] = [];

      if (!requirements.hasBankingSetup) {
        missingRequirements.push("Banking details required for payments");
      }

      if (!requirements.hasPickupAddress) {
        missingRequirements.push("Pickup address required for book collection");
      }

      const status: BankingRequirementsStatus = {
        hasBankingInfo: requirements.hasBankingSetup,
        isVerified: bankingDetails?.status === "active",
        canListBooks: requirements.canReceivePayments,
        missingRequirements,
      };

      return status;
    } catch (error) {
      console.error("Error checking banking requirements:", error);
      return {
        hasBankingInfo: false,
        isVerified: false,
        canListBooks: false,
        missingRequirements: ["Unable to verify requirements"],
      };
    }
  }
}

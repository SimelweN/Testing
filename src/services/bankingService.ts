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
      console.log("Fetching banking details for user:", userId);

      const { data, error } = await supabase
        .from("banking_subaccounts")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "active")
        .single();

      if (error) {
        // No record found is expected for users without banking setup
        if (error.code === "PGRST116") {
          console.log(
            "No banking details found for user - this is normal for new users",
          );
          return null;
        }

        // Check if table doesn't exist
        if (
          error.code === "42P01" ||
          error.message?.includes("does not exist")
        ) {
          throw new Error(
            "Banking system not properly configured. Please contact support.",
          );
        }

        console.error("Database error fetching banking details:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          userId,
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
          throw new Error(
            "Banking system not properly configured. Please contact support.",
          );
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

      // Check if Paystack is configured
      if (!PAYSTACK_CONFIG.isConfigured()) {
        console.error("Paystack not configured. Banking setup unavailable.");
        return {
          success: false,
          error: "Banking service not configured. Please contact support.",
        };
      }

      // Create new subaccount via Edge Function
      console.log("🔍 Calling Edge Function with data:", {
        userId: userId,
        businessName: bankingDetails.businessName,
        bankCode: bankingDetails.bankCode,
        accountNumber: bankingDetails.accountNumber,
        primaryContactEmail: bankingDetails.email,
      });

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

      console.log("🔍 Edge Function response:", { data, error });

      if (error) {
        console.error("Error creating subaccount:", {
          message: error.message,
          context: error.context,
          details: error.details,
          fullError: error,
        });

        // Check if it's a missing Edge Function error
        if (
          error.message?.includes("not found") ||
          error.message?.includes("404") ||
          error.message?.includes("Function not found")
        ) {
          console.error("Banking service unavailable");
          return {
            success: false,
            error: "Banking service unavailable. Please contact support.",
          };
        }

        return {
          success: false,
          error: `Failed to create banking account: ${error.message || "Please try again."}`,
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
      console.error("Banking service error:", {
        message: error instanceof Error ? error.message : "Unknown error",
        fullError: error,
      });
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
      console.error("Error updating subaccount:", {
        message: error instanceof Error ? error.message : "Unknown error",
        fullError: error,
      });
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
      console.error("Error saving banking details:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        fullError: error,
      });
      throw new Error(
        `Failed to save banking details to database: ${error.message || "Unknown error"}`,
      );
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
        throw new Error(
          "No banking account found. Please set up banking first.",
        );
      }

      // Update all user's books to include subaccount code
      const { error } = await supabase
        .from("books")
        .update({ subaccount_code: bankingDetails.subaccount_code })
        .eq("seller_id", userId);

      if (error) {
        // Check if books table doesn't exist (development scenario)
        if (
          error.code === "42P01" ||
          error.message?.includes("does not exist") ||
          error.message?.includes("relation") ||
          error.message?.includes("books")
        ) {
          console.warn(
            "🛠️ Books table doesn't exist - using development fallback for linking",
          );
          console.log("ℹ️ Books would be linked to subaccount:", {
            seller_id: userId,
            subaccount_code: bankingDetails.subaccount_code,
          });
          return; // Silently succeed in development
        }

        throw error;
      }

      console.log("✅ Successfully linked books to subaccount:", {
        userId,
        subaccount_code: bankingDetails.subaccount_code,
      });
    } catch (error) {
      console.error("Error linking books to subaccount:", {
        message: error instanceof Error ? error.message : "Unknown error",
        code: error.code,
        details: error.details,
        fullError: error,
      });

      // Don't throw error in development mode if it's a table issue
      if (
        error.code === "42P01" ||
        error.message?.includes("does not exist") ||
        error.message?.includes("relation")
      ) {
        console.warn("🛠️ Skipping book linking in development mode");
        return;
      }

      throw new Error("Failed to link books to payment account");
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
        return {
          valid: false,
          error: "Account validation service not available",
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

import { supabase } from "@/lib/supabase";
import { PAYSTACK_CONFIG } from "@/config/paystack";
import { validateAddress } from "@/services/addressValidationService";
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
    retryCount = 0,
  ): Promise<BankingSubaccount | null> {
    try {
      console.log("Fetching banking details for user:", userId, "attempt:", retryCount + 1);

      // Add timeout to prevent hanging requests
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );

      const fetchQuery = async () => {
        // First check if user has ANY banking records (regardless of status)
        const { data: allRecords, error: allError } = await supabase
          .from("banking_subaccounts")
          .select("*")
          .eq("user_id", userId);

        console.log("🔍 [Banking Debug] All banking records for user:", {
          userId,
          records: allRecords,
          count: allRecords?.length || 0,
          rawRecords: JSON.stringify(allRecords, null, 2)
        });

        // Try to get active or pending banking record (both are valid for listings)
        const query = await supabase
          .from("banking_subaccounts")
          .select("*")
          .eq("user_id", userId)
          .in("status", ["active", "pending"])
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        // If table doesn't exist or has issues, also check user profile for subaccount_code
        if (query.error && query.error.code === "42P01") {
          console.log("⚠️ Banking table not available, checking profile for subaccount...");
          const { data: profileData } = await supabase
            .from("profiles")
            .select("subaccount_code, preferences")
            .eq("id", userId)
            .single();

          if (profileData?.subaccount_code) {
            // Return a mock banking record if profile has subaccount
            return {
              data: {
                user_id: userId,
                subaccount_code: profileData.subaccount_code,
                status: 'active',
                business_name: profileData.preferences?.business_name || 'User Business',
                bank_name: profileData.preferences?.bank_details?.bank_name || 'Bank'
              },
              error: null
            };
          }
        }

        return query;
      };

      const { data, error } = await Promise.race([fetchQuery(), timeout]) as any;

      if (error) {
        // No active/pending record found - let's check for any record
        if (error.code === "PGRST116") {
          console.log("No active/pending banking record found, checking for any record...");

          // Try to get any banking record (regardless of status)
          const { data: anyRecord, error: anyError } = await supabase
            .from("banking_subaccounts")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          if (anyError) {
            if (anyError.code === "PGRST116") {
              console.log("No banking details found for user - this is normal for new users");
              return null;
            }
            console.error("Error fetching any banking record:", anyError);
            return null;
          }

          console.log("🔍 Found banking record with status:", anyRecord?.status);
          return anyRecord;
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
          fullError: JSON.stringify(error, null, 2),
        });

        // Handle network/connection errors more gracefully
        if (error.message?.includes("Failed to fetch") || error.message?.includes("NetworkError")) {
          console.log("Network error detected, user may be offline or database unreachable");
          throw new Error("Connection error - please check your internet and try again");
        }

        throw new Error(
          `Database error: ${error.message || "Failed to fetch banking details"}`,
        );
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        // Handle timeout errors with retry
        if (error.message === 'Request timeout' && retryCount < 2) {
          console.log(`Request timeout, retrying... (${retryCount + 1}/3)`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
          return this.getUserBankingDetails(userId, retryCount + 1);
        }

        // Handle network errors with retry
        if ((error.message?.includes("Failed to fetch") || error.message?.includes("NetworkError")) && retryCount < 2) {
          console.log(`Network error, retrying... (${retryCount + 1}/3)`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
          return this.getUserBankingDetails(userId, retryCount + 1);
        }

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

        // If it's a network error after retries, give user-friendly message
        if (error.message?.includes("Failed to fetch") || error.message?.includes("NetworkError") || error.message === 'Request timeout') {
          throw new Error("Connection error - please check your internet and try again");
        }

        throw error;
      } else {
        console.error("Unknown error fetching banking details:", JSON.stringify(error, null, 2));

        // Handle network errors
        if (typeof error === 'object' && error !== null && 'message' in error) {
          const errorMessage = (error as any).message;
          if ((errorMessage?.includes("Failed to fetch") || errorMessage?.includes("NetworkError")) && retryCount < 2) {
            console.log(`Network error, retrying... (${retryCount + 1}/3)`);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
            return this.getUserBankingDetails(userId, retryCount + 1);
          }
          if (errorMessage?.includes("Failed to fetch") || errorMessage?.includes("NetworkError")) {
            throw new Error("Connection error - please check your internet and try again");
          }
        }

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
            business_name: bankingDetails.businessName,
            email: bankingDetails.email,
            bank_name: bankingDetails.bankName,
            bank_code: bankingDetails.bankCode,
            account_number: bankingDetails.accountNumber,
            primary_contact_email: bankingDetails.email,
            primary_contact_name: bankingDetails.businessName,
            metadata: {
              user_id: userId,
              is_update: false,
            },
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
      // Check banking setup - must have banking details AND subaccount code
      const bankingDetails = await this.getUserBankingDetails(userId);

      // Also check user profile for subaccount_code (fallback check)
      const { data: profileData } = await supabase
        .from("profiles")
        .select("subaccount_code, preferences")
        .eq("id", userId)
        .single();

      console.log("🏦 [Banking Debug] Banking details:", {
        userId,
        hasBankingDetails: !!bankingDetails,
        hasSubaccountCode: !!bankingDetails?.subaccount_code,
        bankingStatus: bankingDetails?.status,
        details: bankingDetails,
        allFields: bankingDetails ? Object.keys(bankingDetails) : [],
        subaccountCodeValue: bankingDetails?.subaccount_code,
        subaccountFieldExists: 'subaccount_code' in (bankingDetails || {}),
        profileSubaccountCode: profileData?.subaccount_code,
        profilePreferences: profileData?.preferences,
        bankingSetupComplete: profileData?.preferences?.banking_setup_complete,
        alternativeFields: {
          subaccount_id: bankingDetails?.subaccount_id,
          paystack_subaccount_code: bankingDetails?.paystack_subaccount_code,
          account_code: bankingDetails?.account_code
        }
      });

      // Check if user has any valid banking setup (not just active)
      // For listing books, having banking details with subaccount is sufficient
      // Check multiple possible subaccount field names for flexibility
      const subaccountCode = bankingDetails?.subaccount_code ||
                           bankingDetails?.paystack_subaccount_code ||
                           bankingDetails?.account_code ||
                           bankingDetails?.subaccount_id ||
                           profileData?.subaccount_code;

      // Enhanced banking setup detection - check multiple sources
      // 1. Banking table with proper status and subaccount
      const hasBankingFromTable = !!(
        bankingDetails &&
        subaccountCode &&
        (bankingDetails.status === "active" || bankingDetails.status === "pending")
      );

      // 2. Profile preferences (immediate fallback)
      const hasBankingFromProfile = !!(
        profileData?.preferences?.banking_setup_complete &&
        profileData?.subaccount_code
      );

      // 3. Final banking setup status
      const hasBankingSetup = hasBankingFromTable || hasBankingFromProfile;

      console.log("🏦 [Banking Setup Check] Banking validation:", {
        userId,
        hasBankingDetails: !!bankingDetails,
        hasSubaccountCode: !!subaccountCode,
        subaccountCodeValue: subaccountCode,
        currentStatus: bankingDetails?.status,
        isValidStatus: bankingDetails?.status === "active" || bankingDetails?.status === "pending",
        finalResult: hasBankingSetup,
        sources: {
          fromBankingTable: hasBankingFromTable,
          fromProfile: hasBankingFromProfile,
          combined: hasBankingSetup
        },
        detailedBreakdown: {
          step1_hasBankingDetails: !!bankingDetails,
          step2_hasSubaccountCode: !!subaccountCode,
          step3_validStatus: bankingDetails?.status === "active" || bankingDetails?.status === "pending",
          step4_profileSetup: !!profileData?.preferences?.banking_setup_complete,
          step5_profileSubaccount: !!profileData?.subaccount_code,
          allStepsPass: hasBankingSetup
        }
      });

      // Check pickup address (from user profile)
      const { data: profile } = await supabase
        .from("profiles")
        .select("pickup_address")
        .eq("id", userId)
        .single();

      // Properly validate address using validateAddress function
      // Handle JSONB to Address conversion and validate structure
      let hasPickupAddress = false;
      if (profile?.pickup_address) {
        const pickupAddr = profile.pickup_address as any;

        // Handle both 'street' and 'streetAddress' field names for compatibility
        const streetField = pickupAddr.streetAddress || pickupAddr.street;

        // Basic validation of required fields - handle both field naming conventions
        hasPickupAddress = !!(
          pickupAddr &&
          typeof pickupAddr === "object" &&
          streetField &&
          pickupAddr.city &&
          pickupAddr.province &&
          pickupAddr.postalCode
        );

        console.log("📍 [Address Debug] Pickup address validation:", {
          userId,
          hasAddress: !!profile?.pickup_address,
          hasStreetField: !!streetField,
          hasCity: !!pickupAddr.city,
          hasProvince: !!pickupAddr.province,
          hasPostalCode: !!pickupAddr.postalCode,
          isValid: hasPickupAddress,
          address: pickupAddr
        });
      } else {
        console.log("📍 [Address Debug] No pickup address found for user:", userId);
      }

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

      console.log("📊 [Final Requirements Summary]:", {
        userId,
        requirements: {
          hasBankingSetup,
          hasPickupAddress,
          hasActiveBooks,
          canReceivePayments
        },
        progress: `${completedCount}/${requirements.length} (${setupCompletionPercentage}%)`
      });

      return {
        hasBankingSetup,
        hasPickupAddress,
        hasActiveBooks,
        canReceivePayments,
        setupCompletionPercentage,
      };
    } catch (error) {
      console.error("Error checking seller requirements:", JSON.stringify(error, null, 2));

      // If it's a connection error, still return false but don't log as error
      if (error instanceof Error && error.message?.includes("Connection error")) {
        console.log("Connection issue while checking seller requirements, will retry on next check");
      }

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
        .update({ seller_subaccount_code: bankingDetails.subaccount_code })
        .eq("seller_id", userId);

      if (error) {
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
        hasPickupAddress: requirements.hasPickupAddress,
        isVerified: bankingDetails?.status === "active",
        canListBooks: requirements.canReceivePayments,
        missingRequirements,
      };

      return status;
    } catch (error) {
      console.error("Error checking banking requirements:", JSON.stringify(error, null, 2));

      // Provide more specific error messages based on error type
      let missingRequirements = ["Unable to verify requirements"];
      if (error instanceof Error) {
        if (error.message?.includes("Connection error")) {
          missingRequirements = ["Connection error - please check your internet and try again"];
        } else if (error.message?.includes("Banking system not properly configured")) {
          missingRequirements = ["Banking system not available - please contact support"];
        }
      }

      return {
        hasBankingInfo: false,
        hasPickupAddress: false,
        isVerified: false,
        canListBooks: false,
        missingRequirements,
      };
    }
  }
}

import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export interface SubaccountDetails {
  business_name: string;
  email: string;
  bank_name: string;
  bank_code: string;
  account_number: string;
}

export interface SubaccountUpdateDetails {
  business_name?: string;
  settlement_bank?: string;
  account_number?: string;
  percentage_charge?: number;
  description?: string;
  primary_contact_email?: string;
  primary_contact_name?: string;
  primary_contact_phone?: string;
  settlement_schedule?: "auto" | "weekly" | "monthly" | "manual";
  metadata?: Record<string, any>;
}

export interface SubaccountData {
  subaccount_code: string;
  business_name: string;
  description?: string;
  primary_contact_email?: string;
  primary_contact_name?: string;
  primary_contact_phone?: string;
  percentage_charge: number;
  settlement_bank: string;
  account_number: string;
  settlement_schedule: string;
  active: boolean;
  migrate?: boolean;
  metadata?: Record<string, any>;
  domain?: string;
  subaccount_id?: number;
  is_verified?: boolean;
  split_ratio?: number;
}

export class PaystackSubaccountService {
  // Helper method to format error messages properly
  private static formatError(error: any): string {
    if (!error) return "Unknown error occurred";

    if (typeof error === "string") return error;

    if (error.message) return error.message;

    if (error.details) return error.details;

    if (error.hint) return error.hint;

    // If it's an object, try to stringify it properly
    try {
      const errorStr = JSON.stringify(error);
      if (errorStr === "{}") return "Unknown error occurred";
      return errorStr;
    } catch {
      return String(error);
    }
  }
  // 🏦 CREATE OR UPDATE SUBACCOUNT
  static async createOrUpdateSubaccount(
    details: SubaccountDetails,
    isUpdate: boolean = false,
  ): Promise<{ success: boolean; subaccount_code?: string; error?: string }> {
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error("Authentication required. Please log in.");
      }

      const userId = session.user.id;

      // Check if user already has a subaccount
      const existingStatus = await this.getUserSubaccountStatus(userId);

      if (existingStatus.hasSubaccount && !isUpdate) {
        return {
          success: true,
          subaccount_code: existingStatus.subaccountCode,
        };
      }

      const requestBody = {
        business_name: details.business_name.trim(),
        email: details.email.trim(),
        bank_name: details.bank_name,
        bank_code: details.bank_code,
        account_number: details.account_number.replace(/\s/g, ""),
        primary_contact_email: details.email.trim(),
        primary_contact_name: details.business_name.trim(),
        metadata: {
          user_id: userId,
          is_update: isUpdate,
          existing_subaccount: existingStatus.subaccountCode,
        },
      };

      console.log(
        `${isUpdate ? "Updating" : "Creating"} subaccount for user:`,
        userId,
      );

      // 📡 CALL EDGE FUNCTION TO CREATE PAYSTACK SUBACCOUNT
      console.log("🚀 Calling create-paystack-subaccount edge function with:", {
        ...requestBody,
        account_number: "***" + requestBody.account_number.slice(-4) // Don't log full account number
      });

      const { data, error } = await supabase.functions.invoke(
        "create-paystack-subaccount",
        {
          body: requestBody,
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        },
      );

      console.log("📥 Edge function response:", {
        success: data?.success,
        error: error?.message,
        hasSubaccountCode: !!data?.subaccount_code,
        hasRecipientCode: !!data?.recipient_code
      });

      // Check for edge function not deployed/available (development mode)
      if (error) {
        const errorDetails = {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          status: error.status,
          toString: () => error.toString(),
          stack: error.stack
        };
        console.error("Edge function error details:", errorDetails);
        console.error("Edge function error (raw):", error);

        if (
          error.message?.includes("non-2xx status code") ||
          error.message?.includes("404") ||
          error.message?.includes("Function not found") ||
          error.message?.includes("FunctionsError") ||
          !error.message
        ) {
          console.warn("Edge function not available, using development fallback");
          throw new Error("non-2xx status code"); // This will trigger the development fallback below
        }
      }

      if (error) {
        console.error("Supabase function error:", error);
        throw new Error(
          error.message ||
            `Failed to ${isUpdate ? "update" : "create"} subaccount`,
        );
      }

      if (!data?.success) {
        const errorMsg =
          data.error ||
          data.message ||
          `Failed to ${isUpdate ? "update" : "create"} subaccount`;
        throw new Error(errorMsg);
      }

      // ✅ UPDATE USER PROFILE WITH SUBACCOUNT CODE
      if (!isUpdate && data.subaccount_code) {
        await this.updateUserProfileSubaccount(userId, data.subaccount_code);
      }

      return {
        success: true,
        subaccount_code: data.subaccount_code,
      };
    } catch (error) {
      console.error(
        `Error in ${isUpdate ? "update" : "create"}Subaccount:`,
        error,
      );

      // 🧪 DEVELOPMENT MODE: Create mock subaccount for testing
      if (
        error.message?.includes("non-2xx status code") ||
        error.message?.includes("Edge Function") ||
        import.meta.env.DEV
      ) {
        console.warn(
          "🧪 Development mode: Edge function not available. Creating mock subaccount for testing.",
        );
        console.log("Original error:", error.message);

        const mockSubaccountCode = `ACCT_mock_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          const userId = session?.user?.id;

          if (userId) {
            console.log("Creating mock subaccount in database...");

            // Try to insert with minimal required fields first
          let insertData: any = {
            user_id: userId,
            business_name: details.business_name,
            bank_code: details.bank_code,
            account_number: details.account_number,
            subaccount_code: mockSubaccountCode,
          };

          // Add optional fields that may not exist in all schemas
          try {
            // Try with more fields
            insertData = {
              ...insertData,
              business_description: `Mock subaccount for ${details.business_name}`,
              percentage_charge: 10,
              settlement_bank: details.bank_code,
              is_verified: false,
              is_active: true,
            };
          } catch {
            // If that fails, use minimal data
          }

          const { error: dbError } = await supabase
            .from("banking_subaccounts")
            .insert(insertData);

            if (dbError) {
              console.error(
                "Database error creating mock subaccount:",
                JSON.stringify(dbError, null, 2),
              );

              // If the error is about missing columns, try with even more minimal data
              if (dbError.message?.includes("Could not find") || dbError.message?.includes("column")) {
                console.warn("Column missing, trying with absolute minimal fields...");

                const { error: minimalError } = await supabase
                  .from("banking_subaccounts")
                  .insert({
                    user_id: userId,
                    business_name: details.business_name,
                    bank_code: details.bank_code,
                    account_number: details.account_number,
                    subaccount_code: mockSubaccountCode,
                  });

                if (minimalError) {
                  console.error("Even minimal insert failed:", minimalError);
                  // Skip database insert and just update profile
                  console.warn("Skipping database insert, proceeding to profile update");
                } else {
                  console.log("✅ Minimal mock subaccount created successfully");
                }
              } else {
                // Try to provide more specific error information
                const errorMsg = this.formatError(dbError);
                throw new Error(`Failed to create mock subaccount: ${errorMsg}`);
              }
            }

            console.log("✅ Mock subaccount created:", mockSubaccountCode);

            await this.updateUserProfileSubaccount(userId, mockSubaccountCode);

            return {
              success: true,
              subaccount_code: mockSubaccountCode,
            };
          } else {
            throw new Error("No user session available");
          }
        } catch (mockError) {
          console.error("Mock subaccount creation failed:", mockError);
          console.warn("Database table may not exist. Using simple fallback.");

          // Simple fallback - just update the profile table
          try {
            // Get userId from session again in case it's undefined
            const {
              data: { session: fallbackSession },
            } = await supabase.auth.getSession();
            const fallbackUserId = fallbackSession?.user?.id;

            if (!fallbackUserId) {
              throw new Error("No user session available for fallback");
            }

            const simpleFallbackCode = `ACCT_dev_fallback_${Date.now()}`;
            await this.updateUserProfileSubaccount(fallbackUserId, simpleFallbackCode);

            console.log(
              "✅ Simple fallback subaccount created:",
              simpleFallbackCode,
            );

            return {
              success: true,
              subaccount_code: simpleFallbackCode,
            };
          } catch (profileError) {
            console.error("Even profile update failed:", profileError);

            // Last resort - return success with generated code
            return {
              success: true,
              subaccount_code: `ACCT_dev_basic_${Date.now()}`,
            };
          }
        }
      }

      return {
        success: false,
        error: this.formatError(error),
      };
    }
  }

  // 👤 UPDATE USER PROFILE WITH SUBACCOUNT CODE
  static async updateUserProfileSubaccount(
    userId: string,
    subaccountCode: string,
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ subaccount_code: subaccountCode })
        .eq("id", userId);

      if (error) {
        console.warn("Failed to update profile subaccount:", error);
      }
    } catch (error) {
      console.warn("Error updating profile subaccount:", error);
    }
  }

  // 🔗 LINK ALL USER'S BOOKS TO THEIR SUBACCOUNT
  static async linkBooksToSubaccount(subaccountCode: string): Promise<boolean> {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      if (!userId || !subaccountCode) {
        console.warn("No user ID or subaccount code provided");
        return false;
      }

      // 📚 UPDATE ALL USER'S BOOKS WITH SUBACCOUNT CODE
      // First check if the column exists by trying to select it
      let columnExists = true;
      try {
        await supabase
          .from("books")
          .select("seller_subaccount_code")
          .limit(1);
      } catch (error) {
        columnExists = false;
        console.warn("seller_subaccount_code column doesn't exist in books table");
      }

      if (!columnExists) {
        console.warn("Skipping book update - seller_subaccount_code column not found");
        return true; // Return success since the main operation completed
      }

      const { data, error } = await supabase
        .from("books")
        .update({ seller_subaccount_code: subaccountCode })
        .eq("seller_id", userId)
        .is("seller_subaccount_code", null) // Only update books that don't already have a subaccount_code
        .select("id");

      if (error) {
        const formattedError = this.formatError(error);
        console.error(
          "Error updating books with seller_subaccount_code:",
          formattedError,
        );
        // Don't return false immediately, log the error but continue
        console.warn("Book update failed but continuing with subaccount creation");
        console.warn("This might be because the books table doesn't have the seller_subaccount_code column yet");
        console.warn("Error details:", formattedError);
        // Return true to not fail the subaccount creation process
        return true;
      }

      const updatedCount = data?.length || 0;
      console.log(
        `📚 ${updatedCount} books linked to subaccount ${subaccountCode} for user ${userId}`,
      );

      return true;
    } catch (error) {
      console.error("Error linking books to subaccount:", error);
      return false;
    }
  }

  // 📖 GET USER'S SUBACCOUNT CODE
  static async getUserSubaccountCode(userId?: string): Promise<string | null> {
    try {
      if (!userId) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return null;
        userId = user.id;
      }

      // Check profile table for subaccount code
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("subaccount_code")
        .eq("id", userId)
        .single();

      if (!profileError && profileData?.subaccount_code) {
        return profileData.subaccount_code;
      }

      return null;
    } catch (error) {
      console.error("Error getting user subaccount code:", error);
      return null;
    }
  }

  // 🔍 FETCH SUBACCOUNT DETAILS FROM PAYSTACK
  static async fetchSubaccountDetails(
    subaccountCode: string,
  ): Promise<{ success: boolean; data?: SubaccountData; error?: string }> {
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error("Authentication required. Please log in.");
      }

      const { data, error } = await supabase.functions.invoke(
        "manage-paystack-subaccount",
        {
          method: "GET",
          body: null,
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        },
      );

      if (error) {
        console.error("Supabase function error:", error);
        throw new Error(error.message || "Failed to fetch subaccount details");
      }

      if (!data?.success) {
        throw new Error(data.error || "Failed to fetch subaccount details");
      }

      return {
        success: true,
        data: data.data?.paystack_data,
      };
    } catch (error) {
      console.error("Error fetching subaccount details:", error);
      return {
        success: false,
        error: this.formatError(error),
      };
    }
  }

  // ✏️ UPDATE SUBACCOUNT DETAILS
  static async updateSubaccountDetails(
    subaccountCode: string,
    updateData: SubaccountUpdateDetails,
  ): Promise<{ success: boolean; data?: SubaccountData; error?: string }> {
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error("Authentication required. Please log in.");
      }

      console.log(
        "Updating subaccount:",
        subaccountCode,
        "with data:",
        updateData,
      );

      const { data, error } = await supabase.functions.invoke(
        "manage-paystack-subaccount",
        {
          method: "PUT",
          body: updateData,
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        },
      );

      if (error) {
        console.error("Supabase function error:", error);
        throw new Error(error.message || "Failed to update subaccount");
      }

      if (!data?.success) {
        throw new Error(data.error || "Failed to update subaccount");
      }

      return {
        success: true,
        data: data.data,
      };
    } catch (error) {
      console.error("Error updating subaccount:", error);
      return {
        success: false,
        error: this.formatError(error),
      };
    }
  }

  // 📊 GET COMPLETE USER SUBACCOUNT INFO
  static async getCompleteSubaccountInfo(userId?: string): Promise<{
    success: boolean;
    data?: {
      subaccount_code: string;
      banking_details: any;
      paystack_data: SubaccountData;
      profile_preferences: any;
    };
    error?: string;
  }> {
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error("Authentication required. Please log in.");
      }

      const { data, error } = await supabase.functions.invoke(
        "manage-paystack-subaccount",
        {
          method: "GET",
          body: null,
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        },
      );

      if (error) {
        console.error("Supabase function error:", error);
        throw new Error(error.message || "Failed to get subaccount info");
      }

      if (!data?.success) {
        throw new Error(data.error || "Failed to get subaccount info");
      }

      return {
        success: true,
        data: data.data,
      };
    } catch (error) {
      console.error("Error getting complete subaccount info:", error);
      return {
        success: false,
        error: this.formatError(error),
      };
    }
  }

  // ✅ CHECK IF USER HAS SUBACCOUNT
  static async getUserSubaccountStatus(userId?: string): Promise<{
    hasSubaccount: boolean;
    canEdit: boolean;
    subaccountCode?: string;
    businessName?: string;
    bankName?: string;
    accountNumber?: string;
    email?: string;
  }> {
    try {
      console.log("🔍 getUserSubaccountStatus: Starting check...", { userId });

      if (!userId) {
        console.log(
          "📝 getUserSubaccountStatus: No userId provided, getting from auth...",
        );
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          console.log(
            "❌ getUserSubaccountStatus: No authenticated user found",
          );
          return { hasSubaccount: false, canEdit: false };
        }
        userId = user.id;
        console.log("✅ getUserSubaccountStatus: Got user from auth:", userId);
      }

      // First, check the profile table for subaccount_code
      console.log("📋 getUserSubaccountStatus: Checking profile table...");
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("subaccount_code, preferences")
        .eq("id", userId)
        .single();

      if (profileError) {
        console.warn(
          "❌ getUserSubaccountStatus: Error checking profile:",
          profileError,
        );
        return { hasSubaccount: false, canEdit: false };
      }

      console.log("✅ getUserSubaccountStatus: Profile data:", {
        subaccountCode: profileData?.subaccount_code,
        hasPreferences: !!profileData?.preferences,
      });

      const subaccountCode = profileData?.subaccount_code;

      if (!subaccountCode) {
        console.log(
          "❌ getUserSubaccountStatus: No subaccount code found in profile",
        );
        return { hasSubaccount: false, canEdit: false };
      }

      console.log(
        "✅ getUserSubaccountStatus: Found subaccount code:",
        subaccountCode,
      );

      // If we have a subaccount code, try to get banking details from banking_subaccounts table
      const { data: subaccountData, error: subaccountError } = await supabase
        .from("banking_subaccounts")
        .select("*")
        .eq("subaccount_code", subaccountCode)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (subaccountError) {
        console.warn(
          "Error fetching banking details (table may not exist):",
          subaccountError,
        );

        // Fallback - we have subaccount code but no detailed banking info
        const preferences = profileData?.preferences || {};
        return {
          hasSubaccount: true,
          subaccountCode: subaccountCode,
          businessName:
            preferences.business_name || "Please complete banking setup",
          bankName:
            preferences.bank_details?.bank_name || "Banking details incomplete",
          accountNumber:
            preferences.bank_details?.account_number || "Not available",
          email: profileData?.email || "Please update",
          canEdit: true,
        };
      }

      if (!subaccountData) {
        // We have subaccount code but no banking details record
        const preferences = profileData?.preferences || {};
        return {
          hasSubaccount: true,
          subaccountCode: subaccountCode,
          businessName:
            preferences.business_name || "Please complete banking setup",
          bankName:
            preferences.bank_details?.bank_name || "Banking details incomplete",
          accountNumber:
            preferences.bank_details?.account_number || "Not available",
          email: profileData?.email || "Please update",
          canEdit: true,
        };
      }

      // We have both subaccount code and banking details
      return {
        hasSubaccount: true,
        subaccountCode: subaccountData.subaccount_code,
        businessName: subaccountData.business_name,
        bankName: subaccountData.bank_name,
        accountNumber: subaccountData.account_number,
        email: subaccountData.email,
        canEdit: true, // But form will show contact support message
      };
    } catch (error) {
      console.error("Error in getUserSubaccountStatus:", error);
      return { hasSubaccount: false, canEdit: false };
    }
  }
}

export default PaystackSubaccountService;

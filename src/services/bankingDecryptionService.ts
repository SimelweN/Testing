import { supabase } from "@/lib/supabase";

export interface DecryptedBankingDetails {
  account_number: string;
  bank_code: string;
  bank_name?: string;
  business_name?: string;
  subaccount_code?: string;
}

export interface DecryptionResult {
  success: boolean;
  data?: DecryptedBankingDetails;
  sources?: Record<string, string>;
  error?: string;
}

export class BankingDecryptionService {
  /**
   * Decrypt user's banking details using the edge function
   */
  static async decryptBankingDetails(): Promise<DecryptionResult> {
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        return {
          success: false,
          error: "Authentication required. Please log in.",
        };
      }

      console.log("🔓 Calling decrypt-banking-details edge function");

      const { data, error } = await supabase.functions.invoke(
        "decrypt-banking-details",
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        },
      );

      if (error) {
        console.error("Edge function error:", error);
        
        // Handle specific edge function errors
        if (error.message?.includes("non-2xx status code") || 
            error.message?.includes("404")) {
          return {
            success: false,
            error: "Banking decryption service is temporarily unavailable. Please try again later.",
          };
        }

        return {
          success: false,
          error: error.message || "Failed to decrypt banking details",
        };
      }

      if (!data?.success) {
        return {
          success: false,
          error: data?.error || "Failed to decrypt banking details",
        };
      }

      console.log("✅ Banking details decrypted successfully");

      return {
        success: true,
        data: data.data,
        sources: data.sources,
      };
    } catch (error) {
      console.error("Error in decryptBankingDetails:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Format account number for display (show full number or mask it)
   */
  static formatAccountNumber(accountNumber: string, showFull: boolean = false): string {
    if (!accountNumber) return "Not available";
    
    if (showFull) {
      return accountNumber;
    }
    
    // Show last 4 digits only
    if (accountNumber.length > 4) {
      return `****${accountNumber.slice(-4)}`;
    }
    
    return accountNumber;
  }

  /**
   * Validate if banking details are complete
   */
  static validateBankingDetails(details: DecryptedBankingDetails): {
    isValid: boolean;
    missingFields: string[];
  } {
    const requiredFields = ['account_number', 'bank_code', 'bank_name', 'business_name'];
    const missingFields: string[] = [];

    for (const field of requiredFields) {
      if (!details[field as keyof DecryptedBankingDetails]) {
        missingFields.push(field.replace('_', ' '));
      }
    }

    return {
      isValid: missingFields.length === 0,
      missingFields,
    };
  }
}

export default BankingDecryptionService;

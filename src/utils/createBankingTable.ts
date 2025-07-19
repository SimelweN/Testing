import { supabase } from "@/lib/supabase";

// This script creates the banking_subaccounts table if it doesn't exist
// It can be run from the browser console or called programmatically

export async function createBankingSubaccountsTable(): Promise<{
  success: boolean;
  message: string;
  error?: string;
}> {
  try {
    // First, test if the table exists by doing a simple query
    const { data: testData, error: testError } = await supabase
      .from("banking_subaccounts")
      .select("id")
      .limit(1);

    if (!testError) {
      console.log("✅ banking_subaccounts table already exists");
      return {
        success: true,
        message: "banking_subaccounts table already exists",
      };
    }

    // If table doesn't exist, the error will contain "does not exist"
    if (testError && testError.message?.includes("does not exist")) {
      console.log("❌ banking_subaccounts table does not exist");
      console.log("💡 Please run the migration manually in Supabase:");
      console.log(
        "Copy the SQL from: supabase/migrations/20250114000003_create_banking_subaccounts.sql",
      );
      console.log("And run it in your Supabase SQL editor");

      return {
        success: false,
        message: "Table does not exist. Manual migration required.",
        error:
          "Run the SQL migration from supabase/migrations/20250114000003_create_banking_subaccounts.sql",
      };
    } else {
      // Some other error occurred
      console.error("Unexpected error testing table:", testError);
      return {
        success: false,
        message: "Error testing table existence",
        error: testError.message,
      };
    }
  } catch (error) {
    console.error("Error in createBankingSubaccountsTable:", error);
    return {
      success: false,
      message: "Unexpected error",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Test function to verify banking setup works
export async function testBankingSetup(): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        message: "No authenticated user found",
      };
    }

    console.log("Testing banking setup for user:", user.id);

    // Test 1: Check if banking_subaccounts table exists
    const tableTest = await createBankingSubaccountsTable();
    if (!tableTest.success) {
      return {
        success: false,
        message: "Banking table not available",
        details: tableTest,
      };
    }

    // Test 2: Try to query user's existing banking details
    const { data: existingBanking, error: bankingError } = await supabase
      .from("banking_subaccounts")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (bankingError) {
      console.error("Error querying banking details:", bankingError);
      return {
        success: false,
        message: "Error accessing banking details",
        details: bankingError,
      };
    }

    // Test 3: Check profile for subaccount code
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("subaccount_code")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Error querying profile:", {
        message: profileError.message,
        code: profileError.code,
        details: profileError.details,
      });
      return {
        success: false,
        message: "Error accessing profile",
        details: profileError.message || "Unknown profile error",
      };
    }

    const results = {
      userId: user.id,
      existingBanking,
      profileSubaccountCode: profile?.subaccount_code,
      hasSubaccount: !!profile?.subaccount_code,
      tableExists: true,
    };

    console.log("Banking setup test results:", results);

    return {
      success: true,
      message: "Banking setup test completed successfully",
      details: results,
    };
  } catch (error) {
    console.error("Error in testBankingSetup:", error);
    return {
      success: false,
      message: "Test failed with error",
      details: error,
    };
  }
}

// Function to help users create the table manually
export function getBankingTableCreateSQL(): string {
  return `
-- Create banking_subaccounts table and related structures
CREATE TABLE IF NOT EXISTS banking_subaccounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subaccount_code TEXT UNIQUE NOT NULL,
    business_name TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  bank_code TEXT NOT NULL,
  email TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'failed')),
  paystack_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_banking_subaccounts_user_id ON banking_subaccounts(user_id);
CREATE INDEX IF NOT EXISTS idx_banking_subaccounts_code ON banking_subaccounts(subaccount_code);

-- Enable RLS
ALTER TABLE banking_subaccounts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own banking details" ON banking_subaccounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own banking details" ON banking_subaccounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own banking details" ON banking_subaccounts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage banking subaccounts" ON banking_subaccounts
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
  `;
}

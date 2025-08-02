import { supabase } from "@/integrations/supabase/client";

/**
 * Helper function to test and fix broadcast RLS policies
 * This can be called from the admin interface if broadcasts are not working
 */
export const testAndFixBroadcastPolicies = async (): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> => {
  try {
    console.log("🔍 Testing broadcast table access...");

    // Test if we can query the broadcasts table
    const { data: testData, error: testError } = await supabase
      .from("broadcasts")
      .select("id")
      .limit(1);

    if (testError) {
      console.error("❌ Cannot access broadcasts table:", testError);
      return {
        success: false,
        message: "Cannot access broadcasts table. Check if table exists and RLS policies are configured.",
        details: testError
      };
    }

    console.log("✅ Can read from broadcasts table");

    // Test if we can insert a test broadcast
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        message: "Authentication required for broadcast policy test"
      };
    }

    // Try to create a test broadcast
    const { data: insertData, error: insertError } = await supabase
      .from("broadcasts")
      .insert({
        title: "Test Broadcast - Policy Check",
        message: "This is a test message to verify RLS policies are working",
        type: "info",
        priority: "normal",
        target_audience: "admin",
        active: false, // Don't make it active so it doesn't appear to users
        created_by: user.id
      })
      .select()
      .single();

    if (insertError) {
      console.error("❌ Cannot insert broadcast:", insertError);
      
      if (insertError.message?.includes("row-level security policy") || insertError.code === "42501") {
        return {
          success: false,
          message: "RLS policy violation detected. Admin privileges may not be properly configured.",
          details: {
            error: insertError,
            suggestion: "Check if your profile has is_admin = true or if you're using the admin email"
          }
        };
      }

      return {
        success: false,
        message: "Failed to create test broadcast",
        details: insertError
      };
    }

    console.log("✅ Successfully created test broadcast");

    // Clean up the test broadcast
    if (insertData?.id) {
      await supabase
        .from("broadcasts")
        .delete()
        .eq("id", insertData.id);
      console.log("🧹 Cleaned up test broadcast");
    }

    return {
      success: true,
      message: "Broadcast RLS policies are working correctly! You can create broadcasts."
    };

  } catch (error) {
    console.error("💥 Error testing broadcast policies:", error);
    return {
      success: false,
      message: "Unexpected error during policy test",
      details: error
    };
  }
};

/**
 * Get current user's admin status for debugging
 */
export const checkCurrentUserAdminStatus = async (): Promise<{
  isAuthenticated: boolean;
  userId?: string;
  email?: string;
  isAdmin?: boolean;
  profile?: any;
}> => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { isAuthenticated: false };
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email, is_admin")
      .eq("id", user.id)
      .single();

    return {
      isAuthenticated: true,
      userId: user.id,
      email: user.email,
      isAdmin: profile?.is_admin || false,
      profile: profile
    };

  } catch (error) {
    console.error("Error checking admin status:", error);
    return { isAuthenticated: false };
  }
};

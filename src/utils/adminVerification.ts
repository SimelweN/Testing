import { supabase } from "@/integrations/supabase/client";

/**
 * Enhanced admin verification with fallback mechanisms
 */
export const verifyAdminStatus = async (userId: string): Promise<boolean> => {
  try {
    if (!userId) {
      return false;
    }

    // First, try to get user profile with admin check
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email, is_admin")
      .eq("id", userId)
      .single();

    if (profileError) {
      // If single() fails, try without single()
      const { data: profiles, error: listError } = await supabase
        .from("profiles")
        .select("email, is_admin")
        .eq("id", userId)
        .limit(1);

      if (listError || !profiles || profiles.length === 0) {
        return false;
      }

      // Use first result
      const userProfile = profiles[0];

      // Check if user has admin flag OR is the specific admin email
      if (userProfile.is_admin === true) {
        return true;
      }

      return isAdminEmail(userProfile.email);
    }

    // Check if user has admin flag OR is the specific admin email
    if (profile.is_admin === true) {
      return true;
    }

    // If user is AdminSimnLi@gmail.com but doesn't have admin flag, set it
    if (isAdminEmail(profile.email)) {
      await ensureAdminPrivileges(userId);
      return true;
    }

    return false;
  } catch (error) {
    // Any exception means not admin
    return false;
  }
};

/**
 * Check if an email is the admin email (case insensitive)
 */
export const isAdminEmail = (email: string): boolean => {
  if (!email) return false;

  const adminEmails = ["AdminSimnLi@gmail.com", "adminsimnli@gmail.com"];

  return adminEmails.includes(email.toLowerCase());
};

/**
 * Ensure admin privileges are set for the admin user
 */
export const ensureAdminPrivileges = async (userId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from("profiles")
      .update({ is_admin: true })
      .eq("id", userId);

    if (error) {
      console.error("Error setting admin privileges:", error);
    } else {
      console.log("✅ Admin privileges ensured for user:", userId);
    }
  } catch (error) {
    console.error("Error in ensureAdminPrivileges:", error);
  }
};

/**
 * Get admin user ID if exists
 */
export const getAdminUserId = async (): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", "AdminSimnLi@gmail.com")
      .limit(1);

    if (error || !data || data.length === 0) {
      return null;
    }

    return data[0].id;
  } catch {
    return null;
  }
};

/**
 * Test admin functionality
 */
export const testAdminFunctions = async (userId: string) => {
  console.log("🧪 Testing admin functions for user:", userId);

  const startTime = Date.now();
  const isAdmin = await verifyAdminStatus(userId);
  const endTime = Date.now();

  console.log(
    `✅ Admin verification result: ${isAdmin} (took ${endTime - startTime}ms)`,
  );

  return {
    userId,
    isAdmin,
    duration: endTime - startTime,
    timestamp: new Date().toISOString(),
  };
};

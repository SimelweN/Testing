import { supabase } from "@/integrations/supabase/client";

/**
 * Safely fetch a user profile, handling cases where the profile might not exist
 * Use this instead of .single() when you're not certain the profile exists
 */
export const safeGetProfile = async <T = any>(
  userId: string,
  selectFields: string = "*",
): Promise<{ data: T | null; error: any }> => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select(selectFields)
      .eq("id", userId)
      .maybeSingle();

    return { data, error };
  } catch (error) {
    console.error(`Error fetching profile for user ${userId}:`, {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return { data: null, error };
  }
};

/**
 * Safely fetch a user profile with error handling and logging
 * Throws an error only if specified, otherwise returns null on failure
 */
export const getUserProfile = async <T = any>(
  userId: string,
  selectFields: string = "*",
  throwOnError: boolean = false,
): Promise<T | null> => {
  const { data, error } = await safeGetProfile<T>(userId, selectFields);

  if (error) {
    const errorMessage = `Failed to fetch profile for user ${userId}: ${error.message}`;

    if (throwOnError) {
      throw new Error(errorMessage);
    }

    console.warn(errorMessage);
    return null;
  }

  return data;
};

/**
 * Check if a user profile exists
 */
export const profileExists = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    return !error && data !== null;
  } catch (error) {
    console.error(
      `Error checking if profile exists for user ${userId}:`,
      error,
    );
    return false;
  }
};

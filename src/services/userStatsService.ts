import { supabase } from "@/integrations/supabase/client";
import { logError } from "@/utils/errorUtils";

interface UserStats {
  totalBooksListed: number;
  totalBooksSold: number;
  canListBooks: boolean;
  addressValidated: boolean;
  lastActive: string;
}

export const getUserStats = async (
  userId: string,
): Promise<UserStats | null> => {
  try {
    // Get basic profile data and count books manually since stats columns don't exist
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("addresses_same")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) {
      logError("Error fetching user profile", profileError);
      return null;
    }

    // Count books listed by user
    const { count: booksListed, error: booksError } = await supabase
      .from("books")
      .select("*", { count: "exact", head: true })
      .eq("seller_id", userId);

    if (booksError) {
      console.error("Error counting books listed:", booksError);
    }

    // Count books sold by user
    const { count: booksSold, error: soldError } = await supabase
      .from("books")
      .select("*", { count: "exact", head: true })
      .eq("seller_id", userId)
      .eq("sold", true);

    if (soldError) {
      console.error("Error counting books sold:", soldError);
    }

    return {
      totalBooksListed: booksListed || 0,
      totalBooksSold: booksSold || 0,
      canListBooks: profile.addresses_same !== null,
      addressValidated: profile.addresses_same !== null,
      lastActive: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error in getUserStats:", error);
    return null;
  }
};

export const updateLastActive = async (userId: string) => {
  try {
    const { error } = await supabase
      .from("profiles")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", userId);

    if (error) {
      console.error("Error updating last active:", error);
    }
  } catch (error) {
    console.error("Error in updateLastActive:", error);
  }
};

import { supabase } from "@/integrations/supabase/client";

export const testContactMessagesAccess = async () => {
  console.log("=== Testing Contact Messages Access ===");
  
  try {
    // Test 1: Check auth session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log("1. Session check:", {
      hasSession: !!session,
      userId: session?.user?.id,
      error: sessionError
    });

    // Test 2: Check user profile
    if (session) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, role, is_admin')
        .eq('id', session.user.id)
        .single();
      
      console.log("2. Profile check:", {
        profile,
        error: profileError
      });
    }

    // Test 3: Try to fetch contact messages
    const { data, error } = await supabase
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false });

    console.log("3. Contact messages query:", {
      dataLength: data?.length,
      error: error ? {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      } : null
    });

    // Test 4: Try with simpler query
    const { count, error: countError } = await supabase
      .from("contact_messages")
      .select("*", { count: 'exact', head: true });

    console.log("4. Count query:", {
      count,
      error: countError ? {
        code: countError.code,
        message: countError.message
      } : null
    });

    return { data, error };
  } catch (error) {
    console.error("Test failed with exception:", error);
    return { data: null, error };
  }
};

// Add this to window for easy testing in console
if (typeof window !== 'undefined') {
  (window as any).testContactMessages = testContactMessagesAccess;
}

import { supabase } from "@/integrations/supabase/client";

// Global debug function that you can call from browser console
export const debugContactMessages = async () => {
  console.log("🔍 DEBUG: Starting contact messages investigation...");
  
  try {
    // 1. Check Supabase client
    console.log("1. Supabase client:", !!supabase);
    
    // 2. Check auth
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    console.log("2. Auth session:", {
      hasSession: !!session,
      userId: session?.user?.id,
      error: authError
    });
    
    // 3. Check profile if authenticated
    if (session) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      console.log("3. User profile:", {
        profile,
        isAdmin: profile?.role === 'admin' || profile?.is_admin === true,
        error: profileError
      });
    }
    
    // 4. Test basic table access
    console.log("4. Testing table access...");
    const { data, error } = await supabase
      .from("contact_messages")
      .select("id, name, email, subject, created_at")
      .limit(5);
    
    console.log("5. Query result:", {
      success: !error,
      dataCount: data?.length || 0,
      firstMessage: data?.[0],
      error: error ? {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      } : null
    });
    
    // 6. Test count query
    const { count, error: countError } = await supabase
      .from("contact_messages")
      .select("*", { count: 'exact', head: true });
    
    console.log("6. Count result:", {
      count,
      error: countError
    });
    
    console.log("✅ DEBUG: Investigation complete!");
    return { data, error, count };
    
  } catch (exception) {
    console.error("❌ DEBUG: Exception occurred:", exception);
    return { error: exception };
  }
};

// Make it globally available
if (typeof window !== 'undefined') {
  (window as any).debugContactMessages = debugContactMessages;
  console.log("🚀 Contact messages debug function available: window.debugContactMessages()");
}

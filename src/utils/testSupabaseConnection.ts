import { supabase } from "@/integrations/supabase/client";

export const testSupabaseConnection = async () => {
  try {
    console.log("🔍 Testing Supabase connection...");
    
    // Test basic connection
    const { data: healthCheck, error: healthError } = await supabase
      .from("books")
      .select("id")
      .limit(1);
    
    if (healthError) {
      console.error("❌ Supabase connection failed:", healthError);
      return false;
    }
    
    console.log("✅ Supabase connection successful");
    
    // Test auth state
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.warn("⚠️ Auth check failed:", authError);
    } else {
      console.log("👤 Current user:", user ? `${user.email} (${user.id})` : "Not authenticated");
    }
    
    // Test profile access (with safe query)
    if (user) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, name, email")
        .eq("id", user.id)
        .maybeSingle();
      
      if (profileError) {
        console.warn("⚠️ Profile access failed:", profileError);
      } else {
        console.log("👤 Profile data:", profile);
      }
    }
    
    return true;
  } catch (error) {
    console.error("💥 Supabase test failed with exception:", error);
    return false;
  }
};

// Auto-run test in development
if (import.meta.env.DEV) {
  testSupabaseConnection();
}

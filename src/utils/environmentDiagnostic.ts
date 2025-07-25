export function diagnoseEnvironment() {
  console.log("🔍 ENVIRONMENT DIAGNOSTIC");
  console.log("========================");
  
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  console.log("📍 Supabase URL:", supabaseUrl);
  console.log("🔑 Supabase Key (first 20 chars):", supabaseKey?.substring(0, 20) + "...");
  
  // Extract project ref from URL
  if (supabaseUrl) {
    const urlMatch = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
    const projectRef = urlMatch ? urlMatch[1] : null;
    console.log("🎯 Project Ref from URL:", projectRef);
    
    // Check known project refs
    const knownRefs = [
      "kbpjqzaqbqukutflwixf", // from config.toml
      "eqamrjcdxdmayamtkpyf"  // from deploy script
    ];
    
    console.log("📋 Known project refs:", knownRefs);
    console.log("✅ URL matches config.toml?", projectRef === "kbpjqzaqbqukutflwixf");
    console.log("✅ URL matches deploy script?", projectRef === "eqamrjcdxdmayamtkpyf");
    
    if (!knownRefs.includes(projectRef)) {
      console.log("⚠️ WARNING: Project ref doesn't match known configurations!");
    }
  }
  
  // Check if we can construct edge function URL
  if (supabaseUrl) {
    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/process-book-purchase`;
    console.log("🔗 Edge Function URL would be:", edgeFunctionUrl);
  }
  
  return {
    supabaseUrl,
    projectRef: supabaseUrl?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1],
    hasKey: !!supabaseKey,
    configMatches: {
      configToml: supabaseUrl?.includes("kbpjqzaqbqukutflwixf"),
      deployScript: supabaseUrl?.includes("eqamrjcdxdmayamtkpyf")
    }
  };
}

// Make available globally
if (typeof window !== 'undefined') {
  (window as any).diagnoseEnvironment = diagnoseEnvironment;
  console.log("🔍 Environment diagnostic loaded. Run: diagnoseEnvironment()");
}

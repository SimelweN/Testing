/**
 * Debug utility for checking environment variables
 * This helps identify missing configuration issues
 */

export const debugEnvironmentVariables = () => {
  const envVars = {
    SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY
      ? "Set"
      : "Missing",
    SHIPLOGIC_API_KEY: import.meta.env.VITE_SHIPLOGIC_API_KEY
      ? "Set"
      : "Missing",
    PAYSTACK_PUBLIC_KEY: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY
      ? "Set"
      : "Missing",
    APP_URL: import.meta.env.VITE_APP_URL,
    NODE_ENV: import.meta.env.NODE_ENV,
    MODE: import.meta.env.MODE,
  };

  console.group("🔧 Environment Variables Debug");
  Object.entries(envVars).forEach(([key, value]) => {
    const status = value === "Missing" ? "❌" : "✅";
    console.log(
      `${status} ${key}:`,
      value === "Missing"
        ? "Missing"
        : typeof value === "string" && value.length > 20
          ? value.substring(0, 10) + "..."
          : value,
    );
  });
  console.groupEnd();

  return envVars;
};

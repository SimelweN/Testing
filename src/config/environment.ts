// Environment configuration with enhanced error handling
const getEnvVar = (key: string, fallback = ""): string => {
  const value = import.meta.env[key];
  if (!value || value === "undefined" || value.trim() === "") {
    return fallback;
  }
  return value;
};

// Development fallback values (only used in development mode)
const DEV_FALLBACKS = {
  VITE_SUPABASE_URL: "",
  VITE_SUPABASE_ANON_KEY: "",
  VITE_APP_URL: "http://localhost:8080",
};

export const ENV = {
  NODE_ENV: import.meta.env.NODE_ENV || "production",
  VITE_SUPABASE_URL: getEnvVar(
    "VITE_SUPABASE_URL",
    import.meta.env.PROD ? "" : DEV_FALLBACKS.VITE_SUPABASE_URL,
  ),
  VITE_SUPABASE_ANON_KEY: getEnvVar(
    "VITE_SUPABASE_ANON_KEY",
    import.meta.env.PROD ? "" : DEV_FALLBACKS.VITE_SUPABASE_ANON_KEY,
  ),
  VITE_PAYSTACK_PUBLIC_KEY: getEnvVar("VITE_PAYSTACK_PUBLIC_KEY"),
  VITE_PAYSTACK_SECRET_KEY: getEnvVar("VITE_PAYSTACK_SECRET_KEY"),
  VITE_APP_URL: getEnvVar(
    "VITE_APP_URL",
    import.meta.env.PROD
      ? "https://rebookedsolutions.co.za"
      : DEV_FALLBACKS.VITE_APP_URL,
  ),
  VITE_COURIER_GUY_API_KEY: getEnvVar("VITE_COURIER_GUY_API_KEY"),
  VITE_FASTWAY_API_KEY: getEnvVar("VITE_FASTWAY_API_KEY"),
  VITE_GOOGLE_MAPS_API_KEY: getEnvVar("VITE_GOOGLE_MAPS_API_KEY"),
  VITE_DISABLE_GOOGLE_MAPS: getEnvVar("VITE_DISABLE_GOOGLE_MAPS", "true") === "true",
  VITE_DEBUG: getEnvVar("VITE_DEBUG", "false") === "true",
  VITE_ENABLE_ANALYTICS: getEnvVar("VITE_ENABLE_ANALYTICS", "true") === "true",
} as const;

export const IS_PRODUCTION = ENV.NODE_ENV === "production";
export const IS_DEVELOPMENT = ENV.NODE_ENV === "development";

// Validate required environment variables
export const validateEnvironment = () => {
  const required = ["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY"];
  // Payment-related environment variables are critical for production
  const paymentRequired = IS_PRODUCTION ? ["VITE_PAYSTACK_PUBLIC_KEY"] : [];
  const allRequired = [...required, ...paymentRequired];
  // Add optional API keys for production warnings
  const optional = [
    "VITE_COURIER_GUY_API_KEY",
    "VITE_FASTWAY_API_KEY",
    ...(IS_PRODUCTION ? [] : ["VITE_PAYSTACK_PUBLIC_KEY"]),
  ];

  const missing = allRequired.filter((key) => {
    const value = ENV[key as keyof typeof ENV];
    return !value || value.trim() === "";
  });

  const missingOptional = optional.filter((key) => {
    const value = ENV[key as keyof typeof ENV];
    return !value || value.trim() === "";
  });

  if (missing.length > 0) {
    const errorMessage = `
🚨 MISSING ENVIRONMENT VARIABLES 🚨

The following required environment variables are not set:
${missing.map((key) => `  - ${key}`).join("\n")}

To fix this issue:

1. For local development, create a .env file in the project root:
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

2. For production deployment, set these environment variables in your hosting platform:

   VERCEL:
   - Go to your project settings in Vercel dashboard
   - Add environment variables in the "Environment Variables" section

   NETLIFY:
   - Go to your site settings in Netlify dashboard
   - Add environment variables in "Environment variables" section

3. For Fly.io deployment, use:
   fly secrets set VITE_SUPABASE_URL=your_url VITE_SUPABASE_ANON_KEY=your_key

Current environment: ${ENV.NODE_ENV}
    `;

    console.error(errorMessage);

    // In production, log error but don't crash the app completely
    // This allows the app to show a proper error UI instead of blank screen
    if (import.meta.env.PROD) {
      console.error(
        `❌ Missing required environment variables: ${missing.join(", ")}`,
      );
      console.error(
        "⚠️ Application may not function correctly without proper configuration",
      );
      // Don't throw - let the app render and show environment error component
    } else {
      console.warn("⚠️ Using fallback environment variables for development");
    }
  }

  // Additional validation for production
  if (
    import.meta.env.PROD &&
    ENV.VITE_SUPABASE_URL === DEV_FALLBACKS.VITE_SUPABASE_URL
  ) {
    console.error(
      "🚨 CRITICAL: Using development Supabase credentials in production! This is a security risk.",
    );
    console.error(
      "Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables for production.",
    );
  }

  if (missing.length === 0) {
    // Only log in development
    if (import.meta.env.DEV) {
      console.log("✅ Environment variables validated successfully");
    }

    // Warn about missing optional API keys in production
    if (import.meta.env.PROD && missingOptional.length > 0) {
      console.warn(
        `⚠️ Optional API keys not set (some features may be limited): ${missingOptional.join(", ")}`,
      );
    }
  }

  return missing.length === 0;
};

// Production-specific configurations
export const PRODUCTION_CONFIG = {
  // Rate limiting (requests per minute)
  RATE_LIMIT: {
    auth: 5,
    booking: 10,
    general: 60,
  },

  // Cache durations (in milliseconds)
  CACHE_DURATION: {
    books: 5 * 60 * 1000, // 5 minutes
    profile: 10 * 60 * 1000, // 10 minutes
    static: 60 * 60 * 1000, // 1 hour
  },

  // Security headers
  SECURITY_HEADERS: {
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
  },
};

/**
 * Environment Debugging Utility
 * Helps diagnose environment configuration issues that may cause fetch errors
 */

import { ENV } from "../config/environment";

export interface EnvironmentDiagnostics {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  debug: Record<string, any>;
}

/**
 * Perform comprehensive environment diagnostics
 */
export const diagnoseEnvironment = (): EnvironmentDiagnostics => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const debug: Record<string, any> = {};

  // Check basic environment
  debug.nodeEnv = ENV.NODE_ENV;
  debug.isProduction = import.meta.env.PROD;
  debug.isDevelopment = import.meta.env.DEV;
  debug.baseUrl = import.meta.env.BASE_URL;
  debug.mode = import.meta.env.MODE;

  // Validate URLs
  if (ENV.VITE_SUPABASE_URL) {
    try {
      const url = new URL(ENV.VITE_SUPABASE_URL);
      debug.supabaseUrl = {
        valid: true,
        protocol: url.protocol,
        hostname: url.hostname,
        origin: url.origin,
      };

      if (url.protocol !== "https:" && import.meta.env.PROD) {
        errors.push("Supabase URL must use HTTPS in production");
      }
    } catch (error) {
      errors.push(`Invalid Supabase URL: ${ENV.VITE_SUPABASE_URL}`);
      debug.supabaseUrl = { valid: false, error: (error as Error).message };
    }
  } else {
    errors.push("VITE_SUPABASE_URL is not set");
  }

  // Validate app URL
  if (ENV.VITE_APP_URL) {
    try {
      const url = new URL(ENV.VITE_APP_URL);
      debug.appUrl = {
        valid: true,
        protocol: url.protocol,
        hostname: url.hostname,
        origin: url.origin,
      };

      if (url.protocol !== "https:" && import.meta.env.PROD) {
        warnings.push("App URL should use HTTPS in production");
      }
    } catch (error) {
      warnings.push(`Invalid App URL: ${ENV.VITE_APP_URL}`);
      debug.appUrl = { valid: false, error: (error as Error).message };
    }
  }

  // Check API keys
  const apiKeys = [
    "VITE_SUPABASE_ANON_KEY",
    "VITE_PAYSTACK_PUBLIC_KEY",
    "VITE_PAYSTACK_SECRET_KEY",
    "VITE_COURIER_GUY_API_KEY",
    "VITE_FASTWAY_API_KEY",
  ];

  apiKeys.forEach((key) => {
    const value = ENV[key as keyof typeof ENV] as string;
    const hasValue = value && value.trim() !== "";
    debug[key] = {
      present: hasValue,
      length: hasValue ? value.length : 0,
      startsCorrectly: hasValue ? checkKeyFormat(key, value) : false,
    };

    if (!hasValue) {
      if (key === "VITE_SUPABASE_ANON_KEY") {
        errors.push(`${key} is required but not set`);
      } else if (key === "VITE_PAYSTACK_PUBLIC_KEY" && import.meta.env.PROD) {
        warnings.push(`${key} is not set (payment features may not work)`);
      } else if (!hasValue) {
        warnings.push(`${key} is not set (related features may be limited)`);
      }
    }
  });

  // Network connectivity checks
  debug.networkInfo = {
    online: navigator.onLine,
    connectionType: (navigator as any).connection?.effectiveType || "unknown",
    serviceWorker: "serviceWorker" in navigator,
  };

  // Check for common development issues
  if (import.meta.env.DEV) {
    debug.development = {
      hmr: import.meta.hot !== undefined,
      devServerHost: window.location.host,
      protocol: window.location.protocol,
    };

    if (
      window.location.protocol !== "http:" &&
      window.location.hostname === "localhost"
    ) {
      warnings.push("Development server should use HTTP for localhost");
    }
  }

  // Check for potential CORS issues
  if (ENV.VITE_SUPABASE_URL && ENV.VITE_APP_URL) {
    try {
      const supabaseHost = new URL(ENV.VITE_SUPABASE_URL).hostname;
      const appHost = new URL(ENV.VITE_APP_URL).hostname;
      debug.cors = {
        supabaseHost,
        appHost,
        sameDomain: supabaseHost === appHost,
      };
    } catch (error) {
      debug.cors = { error: (error as Error).message };
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    debug,
  };
};

/**
 * Check if API key has correct format
 */
const checkKeyFormat = (keyName: string, value: string): boolean => {
  switch (keyName) {
    case "VITE_SUPABASE_ANON_KEY":
      return value.startsWith("eyJ"); // JWT format
    case "VITE_PAYSTACK_PUBLIC_KEY":
      return value.startsWith("pk_");
    case "VITE_PAYSTACK_SECRET_KEY":
      return value.startsWith("sk_");
    default:
      return value.length > 10; // Basic length check
  }
};

/**
 * Test network connectivity to critical services
 */
export const testNetworkConnectivity = async (): Promise<
  Record<string, boolean>
> => {
  const results: Record<string, boolean> = {};

  const endpoints = [
    { name: "supabase", url: ENV.VITE_SUPABASE_URL },
    { name: "paystack", url: "https://api.paystack.co" },
    { name: "google", url: "https://www.google.com" },
  ];

  await Promise.allSettled(
    endpoints.map(async (endpoint) => {
      if (!endpoint.url) {
        results[endpoint.name] = false;
        return;
      }

      try {
        // Use a simple HEAD request with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(endpoint.url, {
          method: "HEAD",
          mode: "no-cors", // Avoid CORS issues for connectivity test
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        results[endpoint.name] = true;
      } catch (error) {
        console.debug(
          `Connectivity test failed for ${endpoint.name}:`,
          (error as Error).message,
        );
        results[endpoint.name] = false;
      }
    }),
  );

  return results;
};

/**
 * Log environment diagnostics to console (development only)
 */
export const logEnvironmentDiagnostics = (): void => {
  if (!import.meta.env.DEV) return;

  const diagnostics = diagnoseEnvironment();

  console.group("🔍 Environment Diagnostics");

  if (diagnostics.errors.length > 0) {
    console.group("❌ Errors");
    diagnostics.errors.forEach((error) => console.error(error));
    console.groupEnd();
  }

  if (diagnostics.warnings.length > 0) {
    console.group("⚠️ Warnings");
    diagnostics.warnings.forEach((warning) => console.warn(warning));
    console.groupEnd();
  }

  console.group("📊 Debug Information");
  console.table(diagnostics.debug);
  console.groupEnd();

  console.groupEnd();
};

// Auto-run diagnostics in development
if (import.meta.env.DEV && ENV.VITE_DEBUG) {
  logEnvironmentDiagnostics();

  // Test connectivity
  testNetworkConnectivity().then((results) => {
    console.group("🌐 Network Connectivity Test");
    console.table(results);
    console.groupEnd();
  });
}

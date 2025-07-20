/**
 * Network Error Handler
 * Provides proper error handling and debugging for network issues
 */

// Known third-party services and development tools that might fail
const THIRD_PARTY_SERVICES = [
  "fullstory.com",
  "edge.fullstory.com",
  "google-analytics.com",
  "googletagmanager.com",
  "maps.googleapis.com",
  "maps.google.com",
];

const DEVELOPMENT_SERVICES = [
  "@vite/client",
  "ping",
  "messageHandler",
  "waitForSuccessfulPing",
];

const GOOGLE_MAPS_RETRY_PATTERNS = [
  "failed to load google maps script",
  "google maps script, retrying",
  "retrying in",
  "failed to load google maps script, retrying in",
  "google maps script error",
  "maps api error",
];

// Check if an error is from a third-party service
const isThirdPartyError = (url: string): boolean => {
  return THIRD_PARTY_SERVICES.some((service) => url.includes(service));
};

// Check if a URL is a Supabase URL that we should never intercept
const isSupabaseUrl = (url: string): boolean => {
  return (
    url.includes("supabase.co") ||
    url.includes("/functions/v1/") ||
    url.includes("/rest/v1/") ||
    url.includes("/auth/v1/")
  );
};

// Check if an error is from development tools (Vite HMR)
const isDevelopmentError = (message: string, stack?: string): boolean => {
  const fullText = `${message} ${stack || ""}`;

  // Check for Vite-specific development errors only
  const isViteError = DEVELOPMENT_SERVICES.some((service) =>
    fullText.includes(service),
  );

  // Also check for specific Vite development server patterns on fly.dev
  const isViteDevServer =
    fullText.includes(".fly.dev/@vite/client") ||
    fullText.includes(".fly.dev/?reload=") ||
    (fullText.includes(".fly.dev") && fullText.includes("ping"));

  return isViteError || isViteDevServer;
};

// Check if an error is from Google Maps retry logic
const isGoogleMapsRetryError = (message: string): boolean => {
  const msg = message.toLowerCase();
  return GOOGLE_MAPS_RETRY_PATTERNS.some((pattern) => msg.includes(pattern));
};

// Override fetch to provide better error handling
const originalFetch = window.fetch;
// Save original fetch for debugging tools
(window.fetch as any).__original__ = originalFetch;

// Simplified fetch override - only handle actual third-party services, not API errors
window.fetch = async function (...args) {
  const url = args[0]?.toString() || "";

  // Only intercept third-party services that are known to fail in development
  const isActualThirdParty = THIRD_PARTY_SERVICES.some((service) => url.includes(service));

  if (!isActualThirdParty) {
    // For all other requests (including Supabase), use original fetch without any interception
    return originalFetch.apply(this, args);
  }

  // Only for actual third-party services, handle gracefully
  try {
    return await originalFetch.apply(this, args);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.debug(`Third-party service unavailable: ${url}`, error);
    }
    return new Response("{}", {
      status: 200,
      statusText: "Service Unavailable",
      headers: { "Content-Type": "application/json" },
    });
  }
};

// Global error handler for script loading errors (including Google Maps)
window.addEventListener("error", (event) => {
  const message = event.message || event.error?.message || "";

  // Suppress Google Maps script loading errors
  if (isGoogleMapsRetryError(message) || message.toLowerCase().includes("google maps")) {
    event.preventDefault();
    return false;
  }
});

// Handle unhandled promise rejections
window.addEventListener("unhandledrejection", (event) => {
  const error = event.reason;
  const message = error?.message || error?.toString() || "";
  const stack = error?.stack || "";

  // Suppress third-party service errors
  if (isThirdPartyError(message)) {
    if (import.meta.env.DEV) {
      console.debug("Third-party service rejection suppressed:", message);
    }
    event.preventDefault();
    return;
  }

  // Suppress development tool errors (Vite HMR)
  if (isDevelopmentError(message, stack)) {
    if (import.meta.env.DEV) {
      console.debug("Development tool rejection suppressed:", message);
    }
    event.preventDefault();
    return;
  }

  // Suppress Google Maps retry messages
  if (isGoogleMapsRetryError(message)) {
    if (import.meta.env.DEV) {
      console.debug("Google Maps retry message suppressed:", message);
    }
    event.preventDefault();
    return;
  }

  // Log all other unhandled rejections properly
  console.error("Unhandled promise rejection:", error);
});

// Handle global errors
window.addEventListener("error", (event) => {
  const { message, filename, error } = event;
  const stack = error?.stack || "";

  // Suppress errors from third-party services
  if (filename && isThirdPartyError(filename)) {
    if (import.meta.env.DEV) {
      console.debug("Third-party script error suppressed:", message);
    }
    event.preventDefault();
    return;
  }

  // Suppress development tool errors
  if (
    isDevelopmentError(message || "", stack) ||
    (filename && isDevelopmentError(filename))
  ) {
    if (import.meta.env.DEV) {
      console.debug("Development tool error suppressed:", message);
    }
    event.preventDefault();
    return;
  }

  // Suppress Google Maps retry messages
  if (isGoogleMapsRetryError(message || "")) {
    if (import.meta.env.DEV) {
      console.debug("Google Maps retry message suppressed:", message);
    }
    event.preventDefault();
    return;
  }

  // Log all other errors properly
  console.error("Global error:", { message, filename, error });
});

export {};

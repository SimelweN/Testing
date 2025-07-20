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
  ".fly.dev",
  "ping",
  "messageHandler",
  "waitForSuccessfulPing",
];

const GOOGLE_MAPS_RETRY_PATTERNS = [
  "failed to load google maps script",
  "google maps script, retrying",
  "retrying in",
];

// Check if an error is from a third-party service
const isThirdPartyError = (url: string): boolean => {
  return THIRD_PARTY_SERVICES.some((service) => url.includes(service));
};

// Check if an error is from development tools (Vite HMR)
const isDevelopmentError = (message: string, stack?: string): boolean => {
  const fullText = `${message} ${stack || ""}`;
  return DEVELOPMENT_SERVICES.some((service) => fullText.includes(service));
};

// Override fetch to provide better error handling
const originalFetch = window.fetch;
window.fetch = async function (...args) {
  const url = args[0]?.toString() || "";

  try {
    const response = await originalFetch.apply(this, args);
    return response;
  } catch (error) {
    const errorMessage = error?.message || error?.toString() || "";
    const errorStack = error?.stack || "";

    // For third-party services, fail silently but log in development
    if (isThirdPartyError(url)) {
      if (import.meta.env.DEV) {
        console.debug(`Third-party service unavailable: ${url}`, error);
      }
      return new Response("{}", {
        status: 200,
        statusText: "Service Unavailable",
        headers: { "Content-Type": "application/json" },
      });
    }

    // For Vite development client errors, handle gracefully
    if (
      isDevelopmentError(errorMessage, errorStack) ||
      isDevelopmentError(url)
    ) {
      if (import.meta.env.DEV) {
        console.debug(
          `Development server connection issue: ${url}`,
          errorMessage,
        );
      }
      return new Response("{}", {
        status: 200,
        statusText: "Development Server Unavailable",
        headers: { "Content-Type": "application/json" },
      });
    }

    // For our own services, log the error properly and re-throw
    console.error(`Network request failed: ${url}`, error);
    throw error;
  }
};

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

  // Log all other errors properly
  console.error("Global error:", { message, filename, error });
});

export {};

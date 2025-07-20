/**
 * Network Error Handler
 * Provides proper error handling and debugging for network issues
 */

// Known third-party services that might fail
const THIRD_PARTY_SERVICES = [
  "fullstory.com",
  "edge.fullstory.com",
  "google-analytics.com",
  "googletagmanager.com",
];

// Check if an error is from a third-party service
const isThirdPartyError = (url: string): boolean => {
  return THIRD_PARTY_SERVICES.some((service) => url.includes(service));
};

// Override fetch to provide better error handling
const originalFetch = window.fetch;
window.fetch = async function (...args) {
  const url = args[0]?.toString() || "";

  try {
    const response = await originalFetch.apply(this, args);
    return response;
  } catch (error) {
    // For third-party services, fail silently but log in development
    if (isThirdPartyError(url)) {
      if (import.meta.env.DEV) {
        console.debug(`Third-party service unavailable: ${url}`, error);
      }
      // Return a successful empty response to prevent application errors
      return new Response("{}", {
        status: 200,
        statusText: "Service Unavailable",
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

  // Only suppress third-party service errors
  if (isThirdPartyError(message)) {
    if (import.meta.env.DEV) {
      console.debug("Third-party service rejection suppressed:", message);
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

  // Only suppress errors from third-party services
  if (filename && isThirdPartyError(filename)) {
    if (import.meta.env.DEV) {
      console.debug("Third-party script error suppressed:", message);
    }
    event.preventDefault();
    return;
  }

  // Log all other errors properly
  console.error("Global error:", { message, filename, error });
});

export {};

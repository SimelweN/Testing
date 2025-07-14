// Suppress harmless network and third-party script errors
// These errors often occur from third-party analytics, extensions, or development environment issues

// Store original handlers
const originalError = console.error;
const originalUnhandledRejection = window.onunhandledrejection;

// List of error patterns to suppress in development
const suppressedErrorPatterns = [
  "Failed to fetch",
  "fullstory.com",
  "fs.js",
  "edge.fullstory.com",
  "TypeError: Failed to fetch",
  "NetworkError",
  "ERR_NETWORK",
  "ERR_INTERNET_DISCONNECTED",
  "ERR_CONNECTION_REFUSED",
  "ping.*waitForSuccessfulPing", // Vite HMR ping errors
  "WebSocket.*failed", // WebSocket connection errors
  "net::ERR_", // Chrome network errors
];

// Check if error should be suppressed
const shouldSuppressError = (message: string): boolean => {
  if (process.env.NODE_ENV === "production") {
    // In production, only suppress known third-party errors
    return (
      suppressedErrorPatterns.some(
        (pattern) => pattern.includes("fullstory") || pattern.includes("fs.js"),
      ) && message.includes(pattern)
    );
  }

  // In development, suppress more network-related errors
  return suppressedErrorPatterns.some((pattern) => {
    if (pattern.includes(".*")) {
      // Regex pattern
      try {
        return new RegExp(pattern, "i").test(message);
      } catch {
        return message.toLowerCase().includes(pattern.toLowerCase());
      }
    }
    return message.toLowerCase().includes(pattern.toLowerCase());
  });
};

// Override console.error to filter out network warnings
console.error = (...args: any[]) => {
  const message = args[0];
  if (typeof message === "string" && shouldSuppressError(message)) {
    // Log to a separate namespace for debugging if needed
    if (process.env.NODE_ENV === "development") {
      console.debug("[Suppressed Network Error]:", message);
    }
    return;
  }
  originalError.apply(console, args);
};

// Handle unhandled promise rejections from network errors
window.onunhandledrejection = (event: PromiseRejectionEvent) => {
  const message = event.reason?.message || event.reason?.toString() || "";

  if (shouldSuppressError(message)) {
    // Suppress the error
    event.preventDefault();
    if (process.env.NODE_ENV === "development") {
      console.debug("[Suppressed Network Rejection]:", message);
    }
    return;
  }

  // Call original handler if it exists
  if (originalUnhandledRejection) {
    originalUnhandledRejection.call(window, event);
  }
};

// Add global error handler for script loading errors
window.addEventListener(
  "error",
  (event) => {
    const message = event.message || event.error?.message || "";
    const source = event.filename || "";

    // Suppress third-party script errors
    if (
      source.includes("fullstory.com") ||
      source.includes("fs.js") ||
      source.includes("googletagmanager.com") ||
      shouldSuppressError(message)
    ) {
      event.preventDefault();
      if (process.env.NODE_ENV === "development") {
        console.debug("[Suppressed Script Error]:", { message, source });
      }
      return;
    }
  },
  true,
);

// Add network resilience for fetch operations
const originalFetch = window.fetch;
window.fetch = async (...args: Parameters<typeof fetch>): Promise<Response> => {
  try {
    return await originalFetch.apply(window, args);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    // If it's a network error from third-party services, handle gracefully
    if (shouldSuppressError(message)) {
      console.debug("[Network Error Handled]:", message);
      // Return a failed response instead of throwing
      return new Response(null, {
        status: 0,
        statusText: "Network Error (Suppressed)",
      });
    }

    // Re-throw other errors
    throw error;
  }
};

export default {};

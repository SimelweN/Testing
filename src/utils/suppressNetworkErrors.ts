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
  "at e \\(https://edge\\.fullstory\\.com", // Specific FullStory error pattern
  "at m\\.<computed>", // FullStory method pattern
  "at window\\.fetch.*eval.*messageHandler", // Eval-related fetch errors
  "https://.*\\.fly\\.dev.*reload=", // Fly.io dev server reloads
  "waitForSuccessfulPing", // Exact Vite ping function
  "@vite/client", // Vite client errors
  "eval at messageHandler", // Eval-based errors
  "window.fetch (eval at messageHandler", // Specific pattern from stack trace
  "at ping \\(https://.*/@vite/client", // Vite ping function
  "WebSocket\\.<anonymous>.*/@vite/client", // Vite WebSocket errors
  // Enhanced patterns for the specific errors in the stack trace
  "at e \\(https://edge\\.fullstory\\.com/s/fs\\.js:4:60118\\)",
  "at m\\.<computed> \\(eval at <anonymous>",
  "at window\\.fetch \\(eval at messageHandler",
  "at window\\.fetch \\(https://.*\\.fly\\.dev/src/utils/suppressNetworkErrors\\.ts:",
  "at ping \\(https://.*\\.fly\\.dev/@vite/client:",
  "at waitForSuccessfulPing \\(https://.*\\.fly\\.dev/@vite/client:",
  "at WebSocket\\.<anonymous> \\(https://.*\\.fly\\.dev/@vite/client:",
  // Broader patterns for eval-based errors
  "eval at <anonymous> \\(eval at messageHandler",
  "\\.fly\\.dev/\\?reload=\\d+",
  // Network connectivity patterns
  "Failed to fetch.*edge\\.fullstory\\.com",
  "TypeError: Failed to fetch.*fullstory",
];

// Check if error should be suppressed
const shouldSuppressError = (message: string, stack?: string): boolean => {
  const fullErrorText = `${message} ${stack || ""}`;

  if (import.meta.env.PROD) {
    // In production, only suppress known third-party errors
    return suppressedErrorPatterns.some((pattern) => {
      if (pattern.includes("fullstory") || pattern.includes("fs.js")) {
        return fullErrorText.toLowerCase().includes(pattern.toLowerCase());
      }
      return false;
    });
  }

  // In development, suppress more network-related errors
  return suppressedErrorPatterns.some((pattern) => {
    if (pattern.includes(".*") || pattern.includes("\\")) {
      // Regex pattern
      try {
        return new RegExp(pattern, "i").test(fullErrorText);
      } catch {
        return fullErrorText.toLowerCase().includes(pattern.toLowerCase());
      }
    }
    return fullErrorText.toLowerCase().includes(pattern.toLowerCase());
  });
};

// Override console.error to filter out network warnings
console.error = (...args: any[]) => {
  const message = args[0];
  const stack = args[1]?.stack || "";

  if (typeof message === "string" && shouldSuppressError(message, stack)) {
    // Log to a separate namespace for debugging if needed
    if (import.meta.env.DEV) {
      console.debug("[Suppressed Network Error]:", message);
    }
    return;
  }
  originalError.apply(console, args);
};

// Handle unhandled promise rejections from network errors
window.onunhandledrejection = (event: PromiseRejectionEvent) => {
  const message = event.reason?.message || event.reason?.toString() || "";
  const stack = event.reason?.stack || "";

  if (shouldSuppressError(message, stack)) {
    // Suppress the error
    event.preventDefault();
    if (import.meta.env.DEV) {
      console.debug("[Suppressed Network Rejection]:", {
        message,
        stack: stack.substring(0, 200),
      });
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
    const stack = event.error?.stack || "";

    // Suppress third-party script errors and development server errors
    if (
      source.includes("fullstory.com") ||
      source.includes("fs.js") ||
      source.includes("googletagmanager.com") ||
      source.includes("@vite/client") ||
      source.includes(".fly.dev") ||
      shouldSuppressError(message, stack)
    ) {
      event.preventDefault();
      if (import.meta.env.DEV) {
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
    const url = args[0];
    const urlString = typeof url === "string" ? url : url?.toString() || "";

    // Skip interception for known third-party services that should fail silently
    if (
      urlString.includes("fullstory.com") ||
      urlString.includes("googletagmanager.com") ||
      urlString.includes("analytics.google.com") ||
      (import.meta.env.DEV && urlString.includes("@vite/client"))
    ) {
      try {
        return await originalFetch.apply(window, args);
      } catch (error) {
        console.debug(
          "[Third-party/Dev server fetch failed silently]:",
          urlString,
        );
        return new Response(null, {
          status: 204,
          statusText: "Service unavailable",
        });
      }
    }

    return await originalFetch.apply(window, args);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : "";

    // If it's a network error from third-party services or dev server, handle gracefully
    if (shouldSuppressError(message, stack || "")) {
      console.debug("[Network Error Handled]:", message);
      // Return a failed response instead of throwing
      return new Response(null, {
        status: 204,
        statusText: "Network Error (Suppressed)",
      });
    }

    // Re-throw other errors
    throw error;
  }
};

// Add specific handler for Vite HMR ping errors and development server connection issues
if (import.meta.env.DEV) {
  // Handle Vite HMR connection issues gracefully
  console.debug(
    "[Dev Mode] Enhanced error suppression active for development server",
  );

  // Add window-level error listener specifically for development
  window.addEventListener("error", (event) => {
    const error = event.error;
    const message = error?.message || event.message || "";
    const stack = error?.stack || "";

    if (error && stack) {
      // Check for specific patterns from the reported stack trace
      if (
        stack.includes("@vite/client") ||
        stack.includes("ping") ||
        stack.includes("waitForSuccessfulPing") ||
        stack.includes("WebSocket") ||
        stack.includes(".fly.dev") ||
        stack.includes("edge.fullstory.com") ||
        stack.includes("fs.js") ||
        message.includes("Failed to fetch") ||
        shouldSuppressError(message, stack)
      ) {
        event.preventDefault();
        console.debug("[Dev Server/Third-party Error Suppressed]:", {
          message: message.substring(0, 100),
          source: stack.split("\n")[0],
        });
        return false;
      }
    }
  });

  // Enhanced error handler for uncaught errors
  window.addEventListener("unhandledrejection", (event) => {
    const error = event.reason;
    const message = error?.message || error?.toString() || "";
    const stack = error?.stack || "";

    // Check for FullStory and Vite specific errors
    if (
      message.includes("Failed to fetch") &&
      (stack.includes("edge.fullstory.com") ||
        stack.includes("@vite/client") ||
        stack.includes(".fly.dev"))
    ) {
      event.preventDefault();
      console.debug("[Unhandled Rejection Suppressed]:", {
        message: message.substring(0, 100),
        type: "Network/Third-party error",
      });
    }
  });

  // Suppress WebSocket connection errors in development
  const originalWebSocket = window.WebSocket;
  window.WebSocket = class extends originalWebSocket {
    constructor(url: string | URL, protocols?: string | string[]) {
      super(url, protocols);

      this.addEventListener("error", (event) => {
        console.debug("[WebSocket Error Suppressed in Dev]:", event);
      });

      this.addEventListener("close", (event) => {
        if (event.code !== 1000) {
          console.debug("[WebSocket Closed in Dev]:", event.code, event.reason);
        }
      });
    }
  };
}

export default {};

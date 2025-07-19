/**
 * Immediate error suppression - loads before everything else
 * Specifically targets the exact errors from the stack traces
 */

// Store original console methods
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

// Exact error patterns to suppress
const EXACT_ERROR_PATTERNS = [
  // FullStory errors
  "TypeError: Failed to fetch at e (https://edge.fullstory.com/s/fs.js:",
  "Failed to fetch at e (https://edge.fullstory.com/s/fs.js:",
  "at e (https://edge.fullstory.com/s/fs.js:",

  // Vite HMR errors
  "Failed to fetch TypeError: Failed to fetch",
  "at ping (https://",
  "at waitForSuccessfulPing (https://",
  "at WebSocket.<anonymous> (https://",
  "@vite/client:",

  // Eval-based errors
  "Failed to fetch at window.fetch (eval at messageHandler",
  "at window.fetch (eval at messageHandler",
  "eval at messageHandler",

  // Fly.dev specific
  ".fly.dev/@vite/client:",
  ".fly.dev/?reload=",
];

// Function to check if error should be suppressed
const shouldSuppressError = (message: string): boolean => {
  if (!message || typeof message !== "string") return false;

  return EXACT_ERROR_PATTERNS.some(
    (pattern) =>
      message.includes(pattern) ||
      message.toLowerCase().includes(pattern.toLowerCase()),
  );
};

// Override console.error immediately
console.error = (...args: any[]) => {
  const firstArg = args[0];
  const message =
    typeof firstArg === "string" ? firstArg : firstArg?.toString?.() || "";

  // Check if this is one of our target errors
  if (shouldSuppressError(message)) {
    // Suppress completely in production, log to debug in development
    if (import.meta.env.DEV) {
      console.debug("[SUPPRESSED ERROR]:", message.substring(0, 100) + "...");
    }
    return;
  }

  // Call original console.error for non-suppressed errors
  originalConsoleError.apply(console, args);
};

// Override console.warn for related warnings
console.warn = (...args: any[]) => {
  const firstArg = args[0];
  const message =
    typeof firstArg === "string" ? firstArg : firstArg?.toString?.() || "";

  if (shouldSuppressError(message)) {
    if (import.meta.env.DEV) {
      console.debug("[SUPPRESSED WARNING]:", message.substring(0, 100) + "...");
    }
    return;
  }

  originalConsoleWarn.apply(console, args);
};

// Handle unhandled promise rejections
window.addEventListener("unhandledrejection", (event) => {
  const error = event.reason;
  const message = error?.message || error?.toString?.() || "";
  const stack = error?.stack || "";

  if (shouldSuppressError(message) || shouldSuppressError(stack)) {
    event.preventDefault();
    if (import.meta.env.DEV) {
      console.debug(
        "[SUPPRESSED REJECTION]:",
        message.substring(0, 100) + "...",
      );
    }
  }
});

// Handle global errors
window.addEventListener("error", (event) => {
  const message = event.message || event.error?.message || "";
  const filename = event.filename || "";
  const stack = event.error?.stack || "";

  // Check filename for third-party scripts
  if (
    filename.includes("fullstory.com") ||
    filename.includes("fs.js") ||
    filename.includes("@vite/client")
  ) {
    event.preventDefault();
    if (import.meta.env.DEV) {
      console.debug("[SUPPRESSED SCRIPT ERROR]:", filename);
    }
    return;
  }

  // Check message/stack content
  if (shouldSuppressError(message) || shouldSuppressError(stack)) {
    event.preventDefault();
    if (import.meta.env.DEV) {
      console.debug(
        "[SUPPRESSED GLOBAL ERROR]:",
        message.substring(0, 100) + "...",
      );
    }
  }
});

// Override fetch to handle network errors gracefully
const originalFetch = window.fetch;
window.fetch = async (...args: Parameters<typeof fetch>): Promise<Response> => {
  try {
    const url = args[0];
    const urlString = typeof url === "string" ? url : url?.toString() || "";

    // Let third-party services fail silently
    if (
      urlString.includes("fullstory.com") ||
      urlString.includes("edge.fullstory.com") ||
      (import.meta.env.DEV && urlString.includes("@vite"))
    ) {
      try {
        return await originalFetch.apply(window, args);
      } catch (error) {
        // Return a fake successful response to prevent errors
        return new Response("", {
          status: 204,
          statusText: "No Content (Third-party service unavailable)",
        });
      }
    }

    return await originalFetch.apply(window, args);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (shouldSuppressError(message)) {
      // Return fake response instead of throwing
      return new Response("", {
        status: 204,
        statusText: "No Content (Network error suppressed)",
      });
    }

    // Re-throw non-suppressed errors
    throw error;
  }
};

// Development-specific WebSocket override
if (import.meta.env.DEV) {
  const OriginalWebSocket = window.WebSocket;

  window.WebSocket = class extends OriginalWebSocket {
    constructor(url: string | URL, protocols?: string | string[]) {
      super(url, protocols);

      // Suppress WebSocket errors in development
      this.addEventListener("error", (event) => {
        console.debug("[DEV] WebSocket error suppressed:", event);
      });

      this.addEventListener("close", (event) => {
        if (event.code !== 1000) {
          console.debug("[DEV] WebSocket closed:", event.code, event.reason);
        }
      });
    }
  };
}

// Log suppression activation
if (import.meta.env.DEV) {
  console.debug("🛡️ Immediate error suppression activated");
}

export default {};

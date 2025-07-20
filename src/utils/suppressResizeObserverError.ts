/**
 * Minimal ResizeObserver Error Suppression
 * Only suppresses known browser ResizeObserver loop limit errors
 */

// Store original console methods
const originalError = console.error;

// Override console.error to suppress specific ResizeObserver errors
console.error = function (...args) {
  const message = args.join(" ").toLowerCase();

  // Only suppress the specific ResizeObserver loop limit error
  if (
    message.includes("resizeobserver") &&
    message.includes("loop limit exceeded")
  ) {
    return; // Silently ignore this known browser quirk
  }

  // Let all other errors through normally
  originalError.apply(this, args);
};

// Also handle as a global error
window.addEventListener("error", (event) => {
  const message = event.message?.toLowerCase() || "";
  if (
    message.includes("resizeobserver") &&
    message.includes("loop limit exceeded")
  ) {
    event.preventDefault();
    return false;
  }
});

export {};

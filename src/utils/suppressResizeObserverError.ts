// Suppress the harmless ResizeObserver loop warning
// This warning occurs when ResizeObserver callbacks trigger layout changes
// that cause the observed elements to resize again

// Immediate and comprehensive suppression - runs as soon as this file is imported
(function suppressResizeObserverErrors() {
  // Store original console methods
  const originalError = console.error;
  const originalWarn = console.warn;
  const originalLog = console.log;

  // Comprehensive console suppression
  console.error = function (...args: any[]) {
    const message = String(args[0] || "");
    if (message.includes("ResizeObserver")) {
      return; // Suppress all ResizeObserver errors
    }
    return originalError.apply(console, args);
  };

  console.warn = function (...args: any[]) {
    const message = String(args[0] || "");
    if (message.includes("ResizeObserver")) {
      return; // Suppress all ResizeObserver warnings
    }
    return originalWarn.apply(console, args);
  };

  // Even suppress logs mentioning ResizeObserver
  console.log = function (...args: any[]) {
    const message = String(args[0] || "");
    if (message.includes("ResizeObserver loop completed")) {
      return; // Suppress ResizeObserver logs
    }
    return originalLog.apply(console, args);
  };

  // Suppress at window level with multiple event listeners
  window.addEventListener(
    "error",
    function (event) {
      if (event.message && event.message.includes("ResizeObserver")) {
        event.stopImmediatePropagation();
        event.preventDefault();
        return false;
      }
    },
    true,
  );

  // Additional window error handler
  const originalWindowError = window.onerror;
  window.onerror = function (message, source, lineno, colno, error) {
    if (typeof message === "string" && message.includes("ResizeObserver")) {
      return true; // Prevent default error handling
    }
    if (originalWindowError) {
      return originalWindowError.call(
        window,
        message,
        source,
        lineno,
        colno,
        error,
      );
    }
    return false;
  };

  // Handle unhandled promise rejections
  const originalUnhandledRejection = window.onunhandledrejection;
  window.onunhandledrejection = function (event) {
    const message = String(event.reason?.message || event.reason || "");
    if (message.includes("ResizeObserver")) {
      event.preventDefault();
      return;
    }
    if (originalUnhandledRejection) {
      originalUnhandledRejection.call(window, event);
    }
  };

  // Console info for debugging (only in dev)
  if (import.meta.env.DEV) {
    console.log("🔇 ResizeObserver errors suppressed");
  }
})();

// Utility functions
const debounce = (fn: Function, delay: number) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(null, args), delay);
  };
};

// Alternative: debounced ResizeObserver for components that need it
export const createDebouncedResizeObserver = (
  callback: ResizeObserverCallback,
  delay: number = 16,
) => {
  const debouncedCallback = debounce(callback, delay);
  try {
    return new ResizeObserver(debouncedCallback);
  } catch (error) {
    // Fallback to noop observer if ResizeObserver fails
    return {
      observe: () => {},
      unobserve: () => {},
      disconnect: () => {},
    } as ResizeObserver;
  }
};

export default {};

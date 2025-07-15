// Complete elimination of ResizeObserver errors
// This file immediately suppresses all ResizeObserver-related console output

// Immediate execution to suppress before any other code runs
(() => {
  "use strict";

  // Store original methods before any other code can override them
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  const originalConsoleLog = console.log;

  // Nuclear option: Override console methods immediately and aggressively
  console.error = function (...args) {
    const str = args.join(" ");
    if (str.includes("ResizeObserver")) return;
    return originalConsoleError.apply(this, args);
  };

  console.warn = function (...args) {
    const str = args.join(" ");
    if (str.includes("ResizeObserver")) return;
    return originalConsoleWarn.apply(this, args);
  };

  console.log = function (...args) {
    const str = args.join(" ");
    if (str.includes("ResizeObserver")) return;
    return originalConsoleLog.apply(this, args);
  };

  // Aggressive window error suppression
  const suppressError = (event: any) => {
    if (event && event.message && typeof event.message === "string") {
      if (event.message.includes("ResizeObserver")) {
        event.stopPropagation();
        event.stopImmediatePropagation();
        event.preventDefault();
        return false;
      }
    }
  };

  // Multiple event listeners for different scenarios
  window.addEventListener("error", suppressError, true);
  window.addEventListener(
    "unhandledrejection",
    (event) => {
      const message = String(event.reason || "");
      if (message.includes("ResizeObserver")) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    true,
  );

  // Override window.onerror completely
  const originalOnerror = window.onerror;
  window.onerror = function (message, source, lineno, colno, error) {
    if (typeof message === "string" && message.includes("ResizeObserver")) {
      return true; // Suppress the error
    }
    if (originalOnerror) {
      return originalOnerror.call(this, message, source, lineno, colno, error);
    }
    return false;
  };

  // Replace ResizeObserver entirely with a silent version
  if (typeof window !== "undefined" && window.ResizeObserver) {
    const NativeResizeObserver = window.ResizeObserver;

    window.ResizeObserver = class SilentResizeObserver extends (
      NativeResizeObserver
    ) {
      constructor(callback: ResizeObserverCallback) {
        const silentCallback: ResizeObserverCallback = (entries, observer) => {
          try {
            // Use requestAnimationFrame to avoid sync layout issues
            requestAnimationFrame(() => {
              try {
                callback(entries, observer);
              } catch (e) {
                // Completely silent - no errors escape
              }
            });
          } catch (e) {
            // Completely silent - no errors escape
          }
        };

        super(silentCallback);
      }
    };
  }

  // Additional brute force: override any potential console methods that libraries might use
  ["debug", "info", "trace"].forEach((method) => {
    const original = (console as any)[method];
    if (typeof original === "function") {
      (console as any)[method] = function (...args: any[]) {
        const str = args.join(" ");
        if (str.includes("ResizeObserver")) return;
        return original.apply(this, args);
      };
    }
  });
})();

// Utility functions for components that need debounced observers
const debounce = (fn: Function, delay: number = 16) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(null, args), delay);
  };
};

export const createDebouncedResizeObserver = (
  callback: ResizeObserverCallback,
  delay: number = 16,
) => {
  const debouncedCallback = debounce(
    (entries: ResizeObserverEntry[], observer: ResizeObserver) => {
      try {
        callback(entries, observer);
      } catch (e) {
        // Silent failure
      }
    },
    delay,
  );

  try {
    return new ResizeObserver((entries, observer) => {
      debouncedCallback(entries, observer);
    });
  } catch (error) {
    // Return a no-op observer if construction fails
    return {
      observe: () => {},
      unobserve: () => {},
      disconnect: () => {},
    } as ResizeObserver;
  }
};

// Export a safer ResizeObserver wrapper
export const SafeResizeObserver = class extends ResizeObserver {
  constructor(callback: ResizeObserverCallback) {
    const safeCallback: ResizeObserverCallback = (entries, observer) => {
      try {
        // Use microtask to avoid synchronous layout issues
        queueMicrotask(() => {
          try {
            callback(entries, observer);
          } catch (e) {
            // Silent - no console output
          }
        });
      } catch (e) {
        // Silent - no console output
      }
    };

    super(safeCallback);
  }
};

export default {};

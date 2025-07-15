// Suppress the harmless ResizeObserver loop warning
// This warning occurs when ResizeObserver callbacks trigger layout changes
// that cause the observed elements to resize again

const debounce = (fn: Function, delay: number) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(null, args), delay);
  };
};

// Override console.error to filter out ResizeObserver warnings
const originalError = console.error;
console.error = (...args: any[]) => {
  const message = args[0];
  if (typeof message === "string") {
    // Check for various ResizeObserver error messages
    const resizeObserverErrors = [
      "ResizeObserver loop completed with undelivered notifications",
      "ResizeObserver loop limit exceeded",
      'Script error for "ResizeObserver"',
    ];

    if (resizeObserverErrors.some((error) => message.includes(error))) {
      // Suppress these ResizeObserver warnings as they're harmless
      return;
    }
  }
  originalError.apply(console, args);
};

// Also catch ResizeObserver errors at the window level
const originalWindowError = window.onerror;
window.onerror = (message, source, lineno, colno, error) => {
  if (typeof message === "string" && message.includes("ResizeObserver")) {
    // Suppress ResizeObserver errors
    return true;
  }

  // Call original handler if it exists
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

// Catch unhandled promise rejections from ResizeObserver
const originalUnhandledRejection = window.onunhandledrejection;
window.onunhandledrejection = (event) => {
  const message = event.reason?.message || event.reason?.toString() || "";

  if (typeof message === "string" && message.includes("ResizeObserver")) {
    // Suppress ResizeObserver promise rejections
    event.preventDefault();
    return;
  }

  // Call original handler if it exists
  if (originalUnhandledRejection) {
    originalUnhandledRejection.call(window, event);
  }
};

// Alternative: debounced ResizeObserver
export const createDebouncedResizeObserver = (
  callback: ResizeObserverCallback,
  delay: number = 16,
) => {
  const debouncedCallback = debounce(callback, delay);
  try {
    return new ResizeObserver(debouncedCallback);
  } catch (error) {
    console.warn(
      "ResizeObserver constructor failed, falling back to noop observer:",
      error,
    );
    // Return a noop observer if ResizeObserver fails
    return {
      observe: () => {},
      unobserve: () => {},
      disconnect: () => {},
    } as ResizeObserver;
  }
};

export default {};

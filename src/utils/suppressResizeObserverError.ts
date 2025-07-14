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
  if (
    typeof message === "string" &&
    message.includes(
      "ResizeObserver loop completed with undelivered notifications",
    )
  ) {
    // Suppress this specific warning as it's harmless
    return;
  }
  originalError.apply(console, args);
};

// Alternative: debounced ResizeObserver
export const createDebouncedResizeObserver = (
  callback: ResizeObserverCallback,
  delay: number = 16,
) => {
  const debouncedCallback = debounce(callback, delay);
  return new ResizeObserver(debouncedCallback);
};

export default {};

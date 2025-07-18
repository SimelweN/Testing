import { useCallback, useRef } from "react";

/**
 * Custom hook to debounce callback functions to prevent rapid successive calls
 * Useful for preventing button spam and improving performance
 */
export function useDebounceCallback<T extends (...args: never[]) => unknown>(
  callback: T,
  delay: number = 300,
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastCallRef = useRef<number>(0);

  return useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now();

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // If last call was very recent, debounce it
      if (now - lastCallRef.current < delay) {
        timeoutRef.current = setTimeout(() => {
          lastCallRef.current = Date.now();
          callback(...args);
        }, delay);
      } else {
        // First call or enough time has passed, execute immediately
        lastCallRef.current = now;
        callback(...args);
      }
    }) as T,
    [callback, delay],
  );
}

/**
 * Simple throttle hook for high-frequency events
 */
export function useThrottleCallback<T extends (...args: never[]) => unknown>(
  callback: T,
  delay: number = 150,
): T {
  const lastCallRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now();

      if (now - lastCallRef.current >= delay) {
        lastCallRef.current = now;
        callback(...args);
      } else if (!timeoutRef.current) {
        timeoutRef.current = setTimeout(
          () => {
            lastCallRef.current = Date.now();
            callback(...args);
            timeoutRef.current = null;
          },
          delay - (now - lastCallRef.current),
        );
      }
    }) as T,
    [callback, delay],
  );
}

/**
 * Network utility functions for handling connection issues and retries
 */

export interface NetworkStatus {
  isOnline: boolean;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
}

export const getNetworkStatus = (): NetworkStatus => {
  const nav = navigator as any;

  return {
    isOnline: navigator.onLine,
    effectiveType: nav.connection?.effectiveType,
    downlink: nav.connection?.downlink,
    rtt: nav.connection?.rtt,
  };
};

export const isNetworkError = (error: unknown): boolean => {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("failed to fetch") ||
      message.includes("network error") ||
      message.includes("networkerror") ||
      message.includes("fetch error") ||
      message.includes("connection") ||
      message.includes("timeout") ||
      error.name === "NetworkError" ||
      (error.name === "TypeError" && message.includes("fetch"))
    );
  }
  return false;
};

export const wait = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  exponentialBackoff: boolean;
  onRetry?: (attempt: number, error: unknown) => void;
}

export const defaultRetryOptions: RetryOptions = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  exponentialBackoff: true,
};

export const retryWithBackoff = async <T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {},
): Promise<T> => {
  const opts = { ...defaultRetryOptions, ...options };
  let lastError: unknown;

  for (let attempt = 1; attempt <= opts.maxRetries + 1; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Don't retry on last attempt
      if (attempt > opts.maxRetries) {
        break;
      }

      // Only retry network errors
      if (!isNetworkError(error)) {
        throw error;
      }

      // Check if we're still online
      if (!navigator.onLine) {
        console.log("Device is offline, waiting for connection...");
        await waitForOnline();
      }

      // Calculate delay with exponential backoff
      let delay = opts.baseDelay;
      if (opts.exponentialBackoff) {
        delay = Math.min(
          opts.baseDelay * Math.pow(2, attempt - 1),
          opts.maxDelay,
        );
      }

      console.log(
        `Network error on attempt ${attempt}/${opts.maxRetries + 1}, retrying in ${delay}ms...`,
      );

      if (opts.onRetry) {
        opts.onRetry(attempt, error);
      }

      await wait(delay);
    }
  }

  throw lastError;
};

export const waitForOnline = (): Promise<void> => {
  return new Promise((resolve) => {
    if (navigator.onLine) {
      resolve();
      return;
    }

    const handleOnline = () => {
      window.removeEventListener("online", handleOnline);
      resolve();
    };

    window.addEventListener("online", handleOnline);
  });
};

export const logNetworkError = (
  context: string,
  error: unknown,
  networkStatus?: NetworkStatus,
) => {
  const status = networkStatus || getNetworkStatus();

  console.error(`[Network Error - ${context}]:`, {
    message: error instanceof Error ? error.message : String(error),
    type: error instanceof Error ? error.constructor.name : typeof error,
    networkStatus: status,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
  });
};

/**
 * Enhanced fetch with automatic retries for network errors
 */
export const fetchWithRetry = async (
  input: RequestInfo,
  init?: RequestInit,
  retryOptions?: Partial<RetryOptions>,
): Promise<Response> => {
  return retryWithBackoff(async () => {
    const response = await fetch(input, init);

    // Check if response is ok
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response;
  }, retryOptions);
};

/**
 * Monitor network status changes
 */
export const createNetworkMonitor = (
  onOnline?: () => void,
  onOffline?: () => void,
  onConnectionChange?: (status: NetworkStatus) => void,
) => {
  let currentStatus = getNetworkStatus();

  const handleOnline = () => {
    currentStatus = getNetworkStatus();
    console.log("[Network Monitor] Connection restored:", currentStatus);
    onOnline?.();
    onConnectionChange?.(currentStatus);
  };

  const handleOffline = () => {
    currentStatus = getNetworkStatus();
    console.log("[Network Monitor] Connection lost:", currentStatus);
    onOffline?.();
    onConnectionChange?.(currentStatus);
  };

  const handleConnectionChange = () => {
    const newStatus = getNetworkStatus();
    if (JSON.stringify(newStatus) !== JSON.stringify(currentStatus)) {
      currentStatus = newStatus;
      console.log("[Network Monitor] Connection changed:", currentStatus);
      onConnectionChange?.(currentStatus);
    }
  };

  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);

  // Monitor connection changes if available
  const nav = navigator as any;
  if (nav.connection) {
    nav.connection.addEventListener("change", handleConnectionChange);
  }

  return {
    getCurrentStatus: () => currentStatus,
    cleanup: () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (nav.connection) {
        nav.connection.removeEventListener("change", handleConnectionChange);
      }
    },
  };
};

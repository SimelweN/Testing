import { toast } from "sonner";

// Utility to wrap async operations with error handling and loading states
export const withAsyncErrorHandling = async <T>(
  asyncFn: () => Promise<T>,
  options: {
    loadingSetter?: (loading: boolean) => void;
    errorMessage?: string;
    successMessage?: string;
    onError?: (error: unknown) => void;
    onSuccess?: (result: T) => void;
  } = {},
): Promise<T | null> => {
  const {
    loadingSetter,
    errorMessage = "Operation failed",
    successMessage,
    onError,
    onSuccess,
  } = options;

  try {
    loadingSetter?.(true);
    const result = await asyncFn();

    if (successMessage) {
      toast.success(successMessage);
    }

    onSuccess?.(result);
    return result;
  } catch (error) {
    console.error("Async operation failed:", error);

    const errorMsg = error instanceof Error ? error.message : String(error);
    toast.error(`${errorMessage}: ${errorMsg}`);

    onError?.(error);
    return null;
  } finally {
    loadingSetter?.(false);
  }
};

// Hook for managing loading states
export const useAsyncOperation = () => {
  const executeAsync = async <T>(
    asyncFn: () => Promise<T>,
    options: Parameters<typeof withAsyncErrorHandling>[1] = {},
  ) => {
    return withAsyncErrorHandling(asyncFn, options);
  };

  return { executeAsync };
};

// Debounce utility to prevent multiple rapid clicks
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Utility to prevent double-clicking on buttons
export const createSafeAsyncHandler = <T extends any[]>(
  handler: (...args: T) => Promise<void>,
  options: {
    debounceMs?: number;
    loadingSetter?: (loading: boolean) => void;
  } = {},
) => {
  const { debounceMs = 1000, loadingSetter } = options;
  let isExecuting = false;

  const safeHandler = async (...args: T) => {
    if (isExecuting) {
      console.log("Handler already executing, ignoring duplicate call");
      return;
    }

    isExecuting = true;
    loadingSetter?.(true);

    try {
      await handler(...args);
    } catch (error) {
      console.error("Safe async handler error:", error);
      throw error;
    } finally {
      loadingSetter?.(false);
      // Reset execution flag after a delay to prevent accidental double-clicks
      setTimeout(() => {
        isExecuting = false;
      }, debounceMs);
    }
  };

  return safeHandler;
};

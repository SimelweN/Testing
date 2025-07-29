import { useCallback } from "react";
import { toast } from "sonner";
import { getSafeErrorMessage } from "@/utils/errorMessageUtils";

interface ErrorHandlerOptions {
  showToast?: boolean;
  logError?: boolean;
  fallbackMessage?: string;
}

export const useErrorHandler = () => {
  const handleError = useCallback(
    (
      error: unknown,
      context: string = "Application",
      options: ErrorHandlerOptions = {},
    ) => {
      const {
        showToast = true,
        logError = true,
        fallbackMessage = "An unexpected error occurred",
      } = options;

      let errorMessage = fallbackMessage;

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      } else if (error && typeof error === "object" && "message" in error) {
        errorMessage = (error as { message: string }).message;
      }

      if (logError) {
        const safeMessage = getSafeErrorMessage(error);
        console.error(`[${context}] Error: ${safeMessage}`, {
          originalError: error,
          context,
          timestamp: new Date().toISOString()
        });
      }

      if (showToast) {
        toast.error(errorMessage);
      }

      return errorMessage;
    },
    [],
  );

  const handleAsyncError = useCallback(
    async <T>(
      asyncFn: () => Promise<T>,
      context: string = "Async Operation",
      options: ErrorHandlerOptions = {},
    ): Promise<T> => {
      try {
        return await asyncFn();
      } catch (error) {
        handleError(error, context, options);
        throw error;
      }
    },
    [handleError],
  );

  return { handleError, handleAsyncError };
};

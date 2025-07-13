import { MouseEvent } from "react";

/**
 * Utility to wrap button click handlers with loading state management
 */
export const createSafeButtonHandler = <T extends any[]>(
  handler: (...args: T) => Promise<void> | void,
  options: {
    loadingSetter?: (loading: boolean) => void;
    disabled?: boolean;
    debounceMs?: number;
    onError?: (error: unknown) => void;
  } = {},
) => {
  const {
    loadingSetter,
    disabled = false,
    debounceMs = 1000,
    onError,
  } = options;

  let isExecuting = false;
  let lastExecution = 0;

  return async (...args: T) => {
    const now = Date.now();

    // Prevent execution if disabled
    if (disabled) {
      console.log("Button handler disabled, ignoring click");
      return;
    }

    // Prevent double-clicks/rapid firing
    if (isExecuting) {
      console.log("Button handler already executing, ignoring click");
      return;
    }

    // Debounce rapid clicks
    if (now - lastExecution < debounceMs) {
      console.log(
        `Button handler debounced (${now - lastExecution}ms < ${debounceMs}ms)`,
      );
      return;
    }

    lastExecution = now;
    isExecuting = true;

    try {
      loadingSetter?.(true);

      const result = handler(...args);

      // Handle both sync and async handlers
      if (result instanceof Promise) {
        await result;
      }
    } catch (error) {
      console.error("Button handler error:", error);

      if (onError) {
        onError(error);
      } else {
        // Default error handling
        const errorMessage =
          error instanceof Error ? error.message : "An error occurred";
        console.error("Button handler failed:", errorMessage);
      }
    } finally {
      loadingSetter?.(false);
      isExecuting = false;
    }
  };
};

/**
 * Hook for managing button loading states
 */
export const useButtonLoadingState = () => {
  const createHandler = <T extends any[]>(
    handler: (...args: T) => Promise<void> | void,
    options?: Parameters<typeof createSafeButtonHandler>[1],
  ) => {
    return createSafeButtonHandler(handler, options);
  };

  return { createHandler };
};

/**
 * Utility to prevent form submission loops
 */
export const createSafeFormHandler = (
  handler: (e: React.FormEvent) => Promise<void> | void,
  options: {
    loadingSetter?: (loading: boolean) => void;
    onError?: (error: unknown) => void;
  } = {},
) => {
  const { loadingSetter, onError } = options;
  let isSubmitting = false;

  return async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isSubmitting) {
      console.log("Form already submitting, ignoring submission");
      return;
    }

    isSubmitting = true;

    try {
      loadingSetter?.(true);

      const result = handler(e);
      if (result instanceof Promise) {
        await result;
      }
    } catch (error) {
      console.error("Form submission error:", error);

      if (onError) {
        onError(error);
      }
    } finally {
      loadingSetter?.(false);
      isSubmitting = false;
    }
  };
};

/**
 * Utility to create safe navigation handlers
 */
export const createSafeNavigationHandler = (
  navigate: (path: string) => void,
  path: string,
  options: {
    delay?: number;
    loadingSetter?: (loading: boolean) => void;
  } = {},
) => {
  const { delay = 0, loadingSetter } = options;

  return () => {
    try {
      loadingSetter?.(true);

      if (delay > 0) {
        setTimeout(() => {
          navigate(path);
          loadingSetter?.(false);
        }, delay);
      } else {
        navigate(path);
        loadingSetter?.(false);
      }
    } catch (error) {
      console.error("Navigation error:", error);
      loadingSetter?.(false);
    }
  };
};

/**
 * Utility to check if an element is currently in a loading state
 */
export const checkElementLoadingState = (element: HTMLElement): boolean => {
  // Check for common loading indicators
  const hasSpinner = element.querySelector(".animate-spin") !== null;
  const hasDisabled = element.hasAttribute("disabled");
  const hasAriaDisabled = element.getAttribute("aria-disabled") === "true";
  const hasLoadingClass = element.classList.contains("loading");

  return hasSpinner || hasDisabled || hasAriaDisabled || hasLoadingClass;
};

/**
 * Global button click monitor for debugging
 */
export const monitorButtonClicks = () => {
  if (process.env.NODE_ENV !== "development") return;

  document.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;

    if (target.tagName === "BUTTON" || target.closest("button")) {
      const button =
        target.tagName === "BUTTON" ? target : target.closest("button")!;
      const isLoading = checkElementLoadingState(button);

      if (isLoading) {
        console.warn("🚨 Button clicked while in loading state:", button);
        event.preventDefault();
        event.stopPropagation();
        return false;
      }

      console.log(
        "✅ Button click:",
        button.textContent?.trim() || "Unnamed button",
      );
    }
  });

  console.log("🔍 Button click monitor activated");
};

// Auto-start monitoring in development
if (process.env.NODE_ENV === "development") {
  // Wait for DOM to load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", monitorButtonClicks);
  } else {
    monitorButtonClicks();
  }
}

/**
 * Utility functions to fix scrolling issues
 */

/**
 * Prevents default form submission behavior that might cause scrolling
 */
export const preventFormScrolling = (event: React.FormEvent) => {
  // Don't prevent default for actual form submissions
  // This is handled by individual form handlers
};

/**
 * Ensures button clicks don't cause unwanted scrolling
 */
export const handleButtonClick = (
  originalHandler: () => void | Promise<void>,
  options?: {
    preventDefault?: boolean;
    scrollToTop?: boolean;
  },
) => {
  return async (event: React.MouseEvent<HTMLButtonElement>) => {
    // Prevent default behavior if it's a button inside a form
    if (options?.preventDefault) {
      event.preventDefault();
    }

    // Execute the original handler
    try {
      await originalHandler();

      // Optionally scroll to top after successful action
      if (options?.scrollToTop) {
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }, 100);
      }
    } catch (error) {
      // Let the error bubble up
      throw error;
    }
  };
};

/**
 * Adds smooth scroll to top functionality
 */
export const scrollToTop = (delay: number = 0) => {
  setTimeout(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, delay);
};

/**
 * Prevents anchor links from causing page jumps
 */
export const preventAnchorJump = (
  event: React.MouseEvent<HTMLAnchorElement>,
) => {
  event.preventDefault();
};

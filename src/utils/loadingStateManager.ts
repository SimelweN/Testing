// Loading state manager to prevent white screen issues
// This helps detect and resolve stuck loading states

interface LoadingState {
  id: string;
  component: string;
  startTime: number;
  timeout?: number;
}

class LoadingStateManager {
  private loadingStates = new Map<string, LoadingState>();
  private defaultTimeout = 15000; // 15 seconds
  private enabled = import.meta.env.DEV;

  startLoading(id: string, component: string, timeout?: number) {
    if (!this.enabled) return;

    const loadingState: LoadingState = {
      id,
      component,
      startTime: Date.now(),
      timeout: timeout || this.defaultTimeout,
    };

    this.loadingStates.set(id, loadingState);

    // Set up timeout to detect stuck states
    setTimeout(() => {
      if (this.loadingStates.has(id)) {
        console.warn(`[LoadingStateManager] Stuck loading state detected:`, {
          id,
          component,
          duration: Date.now() - loadingState.startTime,
        });

        // Force clear the stuck state
        this.clearLoading(id);

        // Trigger a soft reload to recover
        this.recoverFromStuckState(component);
      }
    }, loadingState.timeout);

    console.debug(
      `[LoadingStateManager] Started loading: ${component} (${id})`,
    );
  }

  clearLoading(id: string) {
    if (!this.enabled) return;

    const state = this.loadingStates.get(id);
    if (state) {
      const duration = Date.now() - state.startTime;
      console.debug(
        `[LoadingStateManager] Cleared loading: ${state.component} (${id}) - ${duration}ms`,
      );
      this.loadingStates.delete(id);
    }
  }

  private recoverFromStuckState(component: string) {
    console.warn(
      `[LoadingStateManager] Attempting recovery for stuck component: ${component}`,
    );

    // Try to trigger a re-render by dispatching a custom event
    window.dispatchEvent(
      new CustomEvent("loading-stuck-recovery", {
        detail: { component },
      }),
    );

    // For auth-related components, just clear the loading state without navigation refresh
    // to prevent blank screen flashing
    if (component === "AuthContext") {
      console.warn(
        "[LoadingStateManager] Auth stuck state detected, clearing without navigation refresh",
      );
      this.clearAllStates();
      return;
    }

    // For other components, still allow soft navigation refresh but with longer delay
    setTimeout(() => {
      if (this.hasStuckStates()) {
        console.warn(
          "[LoadingStateManager] Performing soft navigation refresh",
        );
        const currentPath = window.location.pathname;

        // Use React Router navigation if available
        if ((window as any).routerNavigate) {
          (window as any).routerNavigate(currentPath, { replace: true });
        } else {
          // Fallback to history API
          window.history.pushState({}, "", currentPath);
          window.dispatchEvent(new PopStateEvent("popstate"));
        }
      }
    }, 5000); // Increased from 2000 to 5000ms
  }

  hasStuckStates(): boolean {
    return this.loadingStates.size > 0;
  }

  getStuckStates(): LoadingState[] {
    const now = Date.now();
    return Array.from(this.loadingStates.values()).filter(
      (state) => now - state.startTime > (state.timeout || this.defaultTimeout),
    );
  }

  clearAllStates() {
    this.loadingStates.clear();
  }

  getDebugInfo() {
    return {
      activeStates: this.loadingStates.size,
      states: Array.from(this.loadingStates.values()).map((state) => ({
        ...state,
        duration: Date.now() - state.startTime,
      })),
    };
  }
}

// Create singleton instance
const loadingStateManager = new LoadingStateManager();

// Expose to window for debugging
if (import.meta.env.DEV) {
  (window as any).loadingStateManager = loadingStateManager;
}

// Hook for React components
export const useLoadingState = (component: string, timeout?: number) => {
  const startLoading = (id: string = `${component}-${Date.now()}`) => {
    loadingStateManager.startLoading(id, component, timeout);
    return id;
  };

  const clearLoading = (id: string) => {
    loadingStateManager.clearLoading(id);
  };

  return { startLoading, clearLoading };
};

export default loadingStateManager;

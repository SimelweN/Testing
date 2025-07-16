// Network debugging utility for development environment
// This helps track and diagnose network issues

interface NetworkEvent {
  timestamp: number;
  type: "fetch" | "websocket" | "error";
  url?: string;
  status?: number;
  error?: string;
  details?: any;
}

class NetworkDebugger {
  private events: NetworkEvent[] = [];
  private maxEvents = 100; // Keep last 100 events
  private enabled = import.meta.env.DEV;

  log(event: Omit<NetworkEvent, "timestamp">) {
    if (!this.enabled) return;

    const networkEvent: NetworkEvent = {
      ...event,
      timestamp: Date.now(),
    };

    this.events.push(networkEvent);

    // Keep only recent events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Log to console in dev mode
    console.debug("[Network Debug]:", networkEvent);
  }

  getRecentEvents(count = 10): NetworkEvent[] {
    return this.events.slice(-count);
  }

  getErrorEvents(): NetworkEvent[] {
    return this.events.filter((event) => event.type === "error");
  }

  clearEvents() {
    this.events = [];
  }

  getStats() {
    const now = Date.now();
    const last5Minutes = this.events.filter(
      (event) => now - event.timestamp < 5 * 60 * 1000,
    );

    return {
      totalEvents: this.events.length,
      last5Minutes: last5Minutes.length,
      errors: this.getErrorEvents().length,
      byType: this.events.reduce(
        (acc, event) => {
          acc[event.type] = (acc[event.type] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
    };
  }

  // Add to window for debugging
  exposeToWindow() {
    if (this.enabled && typeof window !== "undefined") {
      (window as any).networkDebugger = this;
    }
  }
}

// Create singleton instance
const networkDebugger = new NetworkDebugger();

// Expose to window in development
networkDebugger.exposeToWindow();

// Auto-log network events
if (import.meta.env.DEV) {
  // Track fetch events
  const originalFetch = window.fetch;

  // Monitor WebSocket connections
  const originalWebSocket = window.WebSocket;

  // Track errors
  window.addEventListener("error", (event) => {
    if (
      event.error &&
      (event.error.message?.includes("fetch") ||
        event.error.message?.includes("WebSocket") ||
        event.error.message?.includes("network"))
    ) {
      networkDebugger.log({
        type: "error",
        error: event.error.message,
        details: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    }
  });

  // Track unhandled promise rejections
  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    if (
      reason &&
      (reason.message?.includes("fetch") ||
        reason.message?.includes("WebSocket") ||
        reason.message?.includes("network"))
    ) {
      networkDebugger.log({
        type: "error",
        error: reason.message || "Promise rejection",
        details: reason,
      });
    }
  });
}

export default networkDebugger;

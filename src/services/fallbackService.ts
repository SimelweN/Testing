import { supabase } from "../lib/supabase";

export interface FallbackConfig {
  enableFallback: boolean;
  vercelBaseUrl?: string;
  supabaseBaseUrl?: string;
  retryAttempts: number;
  retryDelay: number;
  timeoutMs: number;
}

export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  source: "supabase" | "vercel";
  retryCount?: number;
}

class FallbackService {
  private config: FallbackConfig;
  private supabaseBaseUrl: string;
  private vercelBaseUrl: string;

  constructor(config?: Partial<FallbackConfig>) {
    this.config = {
      enableFallback: true,
      retryAttempts: 2,
      retryDelay: 1000,
      timeoutMs: 30000,
      ...config,
    };

    this.supabaseBaseUrl = `${supabase.supabaseUrl}/functions/v1`;
    this.vercelBaseUrl = config?.vercelBaseUrl || window.location.origin;
  }

  async callWithFallback<T = any>(
    functionName: string,
    data: any,
    options?: {
      method?: string;
      headers?: Record<string, string>;
      preferredSource?: "supabase" | "vercel";
    },
  ): Promise<ServiceResponse<T>> {
    const {
      method = "POST",
      headers = {},
      preferredSource = "supabase",
    } = options || {};

    // Determine call order based on preference
    const sources: Array<"supabase" | "vercel"> =
      preferredSource === "vercel"
        ? ["vercel", "supabase"]
        : ["supabase", "vercel"];

    let lastError: string = "";
    let retryCount = 0;

    for (const source of sources) {
      for (let attempt = 0; attempt <= this.config.retryAttempts; attempt++) {
        try {
          const result = await this.callService<T>(
            source,
            functionName,
            data,
            method,
            headers,
          );

          if (result.success) {
            console.log(
              `✅ ${functionName} succeeded via ${source}${attempt > 0 ? ` (retry ${attempt})` : ""}`,
            );
            return { ...result, source, retryCount: attempt };
          }

          lastError = result.error || "Unknown error";
          console.warn(
            `⚠️ ${functionName} failed via ${source} (attempt ${attempt + 1}): ${lastError}`,
          );
        } catch (error: any) {
          lastError = error.message;
          console.warn(
            `⚠️ ${functionName} error via ${source} (attempt ${attempt + 1}): ${lastError}`,
          );
        }

        // Wait before retry (except on last attempt)
        if (attempt < this.config.retryAttempts) {
          await this.delay(this.config.retryDelay * (attempt + 1));
        }

        retryCount++;
      }

      // If fallback is disabled, don't try the second source
      if (!this.config.enableFallback) {
        break;
      }
    }

    console.error(
      `💥 ${functionName} failed on all sources after ${retryCount} attempts`,
    );
    return {
      success: false,
      error: lastError || "All service endpoints failed",
      source: sources[0],
      retryCount,
    };
  }

  private async callService<T>(
    source: "supabase" | "vercel",
    functionName: string,
    data: any,
    method: string,
    headers: Record<string, string>,
  ): Promise<ServiceResponse<T>> {
    const baseUrl =
      source === "supabase"
        ? this.supabaseBaseUrl
        : `${this.vercelBaseUrl}/api`;
    const url = `${baseUrl}/${functionName}`;

    const requestHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...headers,
    };

    // Add auth header for Supabase
    if (source === "supabase") {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.access_token) {
        requestHeaders["Authorization"] = `Bearer ${session.access_token}`;
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      this.config.timeoutMs,
    );

    try {
      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: method !== "GET" ? JSON.stringify(data) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error:
            result.error || `HTTP ${response.status}: ${response.statusText}`,
          source,
        };
      }

      return {
        success: result.success !== false, // Handle both explicit false and missing success field
        data: result,
        source,
      };
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error.name === "AbortError") {
        throw new Error(`Request timeout after ${this.config.timeoutMs}ms`);
      }

      throw error;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Convenience methods for specific services
  async sendEmail(data: any): Promise<ServiceResponse> {
    return this.callWithFallback("send-email", data);
  }

  async commitToSale(data: any): Promise<ServiceResponse> {
    return this.callWithFallback("commit-to-sale", data);
  }

  async automateDelivery(data: any): Promise<ServiceResponse> {
    return this.callWithFallback("automate-delivery", data);
  }

  async getCourierGuyQuote(data: any): Promise<ServiceResponse> {
    return this.callWithFallback("courier-guy-quote", data);
  }

  async createCourierGuyShipment(data: any): Promise<ServiceResponse> {
    return this.callWithFallback("courier-guy-shipment", data);
  }

  async trackCourierGuy(trackingNumber: string): Promise<ServiceResponse> {
    return this.callWithFallback("courier-guy-track", {
      tracking_number: trackingNumber,
    });
  }



  // Health check methods
  async healthCheck(): Promise<{ supabase: boolean; vercel: boolean }> {
    const results = await Promise.allSettled([
      this.checkSupabaseHealth(),
      this.checkVercelHealth(),
    ]);

    return {
      supabase: results[0].status === "fulfilled" && results[0].value,
      vercel: results[1].status === "fulfilled" && results[1].value,
    };
  }

  private async checkSupabaseHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.supabaseBaseUrl}/health`, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private async checkVercelHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.vercelBaseUrl}/api/health`, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  // Configuration methods
  updateConfig(newConfig: Partial<FallbackConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): FallbackConfig {
    return { ...this.config };
  }
}

// Export singleton instance
export const fallbackService = new FallbackService();

// Export class for custom instances
export { FallbackService };

// React hook
export function useFallbackService(config?: Partial<FallbackConfig>) {
  if (config) {
    fallbackService.updateConfig(config);
  }
  return fallbackService;
}

// Service status hook
export function useServiceStatus() {
  const [status, setStatus] = React.useState<{
    supabase: boolean;
    vercel: boolean;
    lastChecked: Date | null;
  }>({
    supabase: true,
    vercel: true,
    lastChecked: null,
  });

  const checkStatus = React.useCallback(async () => {
    try {
      const health = await fallbackService.healthCheck();
      setStatus({
        ...health,
        lastChecked: new Date(),
      });
    } catch (error) {
      console.error("Health check failed:", error);
    }
  }, []);

  React.useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [checkStatus]);

  return { ...status, checkStatus };
}

// TypeScript import for React
declare global {
  const React: typeof import("react");
}

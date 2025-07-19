const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");

export interface PaystackApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  error_type?: "network" | "paystack" | "timeout" | "validation";
  status_code?: number;
  details?: any;
}

/**
 * Enhanced Paystack API client with timeout, retry logic, and better error handling
 */
export class PaystackApi {
  private static DEFAULT_TIMEOUT = 30000; // 30 seconds
  private static DEFAULT_RETRIES = 2;
  private static DEFAULT_RETRY_DELAY = 1000; // 1 second

  /**
   * Make a request to Paystack API with improved error handling
   */
  static async request<T = any>(
    endpoint: string,
    options: {
      method?: string;
      body?: any;
      timeout?: number;
      retries?: number;
      retryDelay?: number;
    } = {},
  ): Promise<PaystackApiResponse<T>> {
    if (!PAYSTACK_SECRET_KEY) {
      return {
        success: false,
        error: "PAYSTACK_NOT_CONFIGURED",
        error_type: "validation",
        details: {
          message: "Paystack secret key not configured",
          missing_env_vars: ["PAYSTACK_SECRET_KEY"],
        },
      };
    }

    const {
      method = "GET",
      body,
      timeout = this.DEFAULT_TIMEOUT,
      retries = this.DEFAULT_RETRIES,
      retryDelay = this.DEFAULT_RETRY_DELAY,
    } = options;

    const url = endpoint.startsWith("http")
      ? endpoint
      : `https://api.paystack.co${endpoint}`;

    // Prepare request options
    const requestOptions: RequestInit = {
      method,
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    };

    if (body && ["POST", "PUT", "PATCH"].includes(method.toUpperCase())) {
      requestOptions.body =
        typeof body === "string" ? body : JSON.stringify(body);
    }

    let lastError: any;
    let attempt = 0;

    while (attempt <= retries) {
      try {
        console.log(
          `Paystack API request attempt ${attempt + 1}/${retries + 1}: ${method} ${url}`,
        );

        // Create timeout controller
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        requestOptions.signal = controller.signal;

        const response = await fetch(url, requestOptions);
        clearTimeout(timeoutId);

        // Handle response
        if (!response.ok) {
          let errorData: any = {};
          try {
            errorData = await response.json();
          } catch (parseError) {
            console.error(
              "Failed to parse Paystack error response:",
              parseError,
            );
          }

          // Don't retry for client errors (4xx)
          if (response.status >= 400 && response.status < 500) {
            return {
              success: false,
              error: "PAYSTACK_CLIENT_ERROR",
              error_type: "paystack",
              status_code: response.status,
              details: {
                status_text: response.statusText,
                paystack_error: errorData?.message || "Client error",
                paystack_data: errorData,
                url: url,
                method: method,
              },
            };
          }

          // Retry for server errors (5xx)
          if (response.status >= 500) {
            lastError = {
              type: "server_error",
              status: response.status,
              statusText: response.statusText,
              data: errorData,
            };

            if (attempt < retries) {
              console.log(
                `Server error ${response.status}, retrying in ${retryDelay}ms...`,
              );
              await this.delay(retryDelay);
              attempt++;
              continue;
            }
          }

          return {
            success: false,
            error: "PAYSTACK_SERVER_ERROR",
            error_type: "paystack",
            status_code: response.status,
            details: {
              status_text: response.statusText,
              paystack_error: errorData?.message || "Server error",
              paystack_data: errorData,
              url: url,
              method: method,
            },
          };
        }

        // Success - parse response
        try {
          const result = await response.json();

          if (result.status === false) {
            return {
              success: false,
              error: "PAYSTACK_API_ERROR",
              error_type: "paystack",
              details: {
                paystack_error: result.message || "API returned status false",
                paystack_data: result,
                url: url,
                method: method,
              },
            };
          }

          return {
            success: true,
            data: result.data || result,
            status_code: response.status,
          };
        } catch (parseError) {
          console.error(
            "Failed to parse Paystack success response:",
            parseError,
          );
          return {
            success: false,
            error: "PAYSTACK_RESPONSE_PARSE_ERROR",
            error_type: "network",
            details: {
              parse_error: parseError.message,
              url: url,
              method: method,
            },
          };
        }
      } catch (error) {
        console.error(
          `Paystack API request failed (attempt ${attempt + 1}):`,
          error,
        );
        lastError = error;

        // Handle specific error types
        if (error.name === "AbortError") {
          if (attempt < retries) {
            console.log(`Request timeout, retrying in ${retryDelay}ms...`);
            await this.delay(retryDelay);
            attempt++;
            continue;
          }

          return {
            success: false,
            error: "PAYSTACK_REQUEST_TIMEOUT",
            error_type: "timeout",
            details: {
              timeout_ms: timeout,
              error_message: error.message,
              url: url,
              method: method,
            },
          };
        }

        if (error.name === "TypeError" && error.message.includes("fetch")) {
          if (attempt < retries) {
            console.log(`Network error, retrying in ${retryDelay}ms...`);
            await this.delay(retryDelay);
            attempt++;
            continue;
          }

          return {
            success: false,
            error: "PAYSTACK_NETWORK_ERROR",
            error_type: "network",
            details: {
              error_message: error.message,
              error_name: error.name,
              url: url,
              method: method,
            },
          };
        }

        // Generic network/execution error
        if (attempt < retries) {
          console.log(`Request failed, retrying in ${retryDelay}ms...`);
          await this.delay(retryDelay);
          attempt++;
          continue;
        }

        break;
      }
    }

    // All retries exhausted
    return {
      success: false,
      error: "PAYSTACK_REQUEST_FAILED",
      error_type: "network",
      details: {
        error_message: lastError?.message || "Request failed after all retries",
        error_name: lastError?.name || "Unknown",
        attempts: retries + 1,
        url: url,
        method: method,
        last_error: lastError,
      },
    };
  }

  /**
   * Convenience method for GET requests
   */
  static async get<T = any>(
    endpoint: string,
    options?: { timeout?: number; retries?: number; retryDelay?: number },
  ): Promise<PaystackApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }

  /**
   * Convenience method for POST requests
   */
  static async post<T = any>(
    endpoint: string,
    body?: any,
    options?: { timeout?: number; retries?: number; retryDelay?: number },
  ): Promise<PaystackApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: "POST", body });
  }

  /**
   * Utility method to add delay
   */
  private static delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export default PaystackApi;

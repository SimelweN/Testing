/**
 * Enhanced Edge Function Debugger
 * Provides detailed information about edge function failures
 */

import { supabase } from "@/integrations/supabase/client";

export interface EdgeFunctionDiagnostic {
  functionName: string;
  status: "success" | "error" | "not_found" | "timeout";
  httpStatus?: number;
  httpStatusText?: string;
  response?: any;
  error?: any;
  timing: number;
  url?: string;
  headers?: Record<string, string>;
}

export class EdgeFunctionDebugger {
  private supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  private supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  private validateConfiguration(): { valid: boolean; error?: string } {
    if (!this.supabaseUrl || this.supabaseUrl.trim() === "" || this.supabaseUrl === "undefined") {
      return {
        valid: false,
        error: "VITE_SUPABASE_URL is not set or invalid"
      };
    }

    if (!this.supabaseAnonKey || this.supabaseAnonKey.trim() === "" || this.supabaseAnonKey === "undefined") {
      return {
        valid: false,
        error: "VITE_SUPABASE_ANON_KEY is not set or invalid"
      };
    }

    try {
      new URL(this.supabaseUrl);
    } catch {
      return {
        valid: false,
        error: `Invalid VITE_SUPABASE_URL format: ${this.supabaseUrl}`
      };
    }

    return { valid: true };
  }

  async diagnoseFunction(
    functionName: string,
  ): Promise<EdgeFunctionDiagnostic> {
    const startTime = performance.now();

    // Validate configuration first
    const configValidation = this.validateConfiguration();
    if (!configValidation.valid) {
      return {
        functionName,
        status: "error",
        error: {
          message: "Configuration Error",
          name: "ConfigurationError",
          details: configValidation.error!,
          possibleCauses: [
            "Environment variables not set in deployment",
            "Invalid Supabase URL format",
            "Missing VITE_ prefix in environment variables"
          ],
          troubleshooting: [
            "Check .env file has VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY",
            "Verify environment variables are set in production deployment",
            "Ensure URL format: https://your-project.supabase.co"
          ]
        },
        timing: performance.now() - startTime,
        url: this.supabaseUrl || "undefined"
      };
    }

    try {
      // First try with Supabase client
      const supabaseResult = await this.testWithSupabaseClient(functionName);
      const timing = performance.now() - startTime;

      if (supabaseResult.success) {
        return {
          functionName,
          status: "success",
          response: supabaseResult.data,
          timing,
          url: `${this.supabaseUrl}/functions/v1/${functionName}`,
        };
      }

      // If Supabase client fails, try direct fetch for more details
      return await this.testWithDirectFetch(functionName, startTime);
    } catch (error) {
      const timing = performance.now() - startTime;

      return {
        functionName,
        status: "error",
        error: {
          message: error.message,
          name: error.name,
          stack: error.stack,
          details: this.extractErrorDetails(error),
        },
        timing,
        url: `${this.supabaseUrl}/functions/v1/${functionName}`,
      };
    }
  }

  private async testWithSupabaseClient(functionName: string) {
    try {
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { health: true, debug: true },
      });

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error };
    }
  }

      private async testWithDirectFetch(
    functionName: string,
    startTime: number,
  ): Promise<EdgeFunctionDiagnostic> {
    const url = `${this.supabaseUrl}/functions/v1/${functionName}`;

    try {
      // Create a completely clean fetch to avoid any interceptors
      const originalFetch = globalThis.fetch;

      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

      const response = await Promise.race([
        originalFetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.supabaseAnonKey}`,
            "Content-Type": "application/json",
            Accept: "application/json",
            // Add CORS headers to help with cross-origin requests
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Authorization, Content-Type",
          },
          body: JSON.stringify({ health: true, debug: true }),
          signal: controller.signal,
          // Add no-cors mode as fallback
          mode: "cors",
        }),
        new Promise<Response>((_, reject) =>
          setTimeout(() => reject(new Error("Request timeout")), 8000)
        )
      ]);

      clearTimeout(timeoutId);

      const timing = performance.now() - startTime;
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

            let responseData;
      const responseClone = response.clone();
      try {
        const responseText = await response.text();
        responseData = responseText ? JSON.parse(responseText) : null;
      } catch (parseError) {
        // If JSON parsing fails, try to read from clone
        try {
          responseData = await responseClone.text();
        } catch {
          responseData = { error: "Failed to read response" };
        }
      }

      return {
        functionName,
        status: response.ok ? "success" : "error",
        httpStatus: response.status,
        httpStatusText: response.statusText,
        response: responseData,
        timing,
        url,
        headers: responseHeaders,
      };
                } catch (error: any) {
      const timing = performance.now() - startTime;

      // Handle different types of errors more specifically
      if (error.name === "AbortError" || error.message === "Request timeout") {
        return {
          functionName,
          status: "timeout",
          error: {
            message: "Function call timed out after 8 seconds",
            name: "TimeoutError",
            details: "The function may be taking too long to respond, not be deployed, or have connectivity issues",
            possibleCauses: [
              "Function not deployed to Supabase",
              "Function is cold starting and taking too long",
              "Network connectivity issues",
              "Function has infinite loop or hanging operation"
            ]
          },
          timing,
          url,
        };
      }

      if (error.name === "TypeError" && error.message.includes("Failed to fetch")) {
        return {
          functionName,
          status: "network_error",
          error: {
            message: "Network request failed - likely CORS or connectivity issue",
            name: "NetworkError",
            details: "Unable to reach the Supabase Edge Function endpoint",
            possibleCauses: [
              "Function not deployed to Supabase",
              "CORS configuration issue",
              "Invalid Supabase URL or credentials",
              "Network firewall blocking requests",
              "Supabase project is paused or has issues"
            ],
            troubleshooting: [
              "Check if function is deployed: supabase functions list",
              "Verify Supabase URL is correct",
              "Test function directly in Supabase dashboard",
              "Check browser network tab for specific error"
            ]
          },
          timing,
          url,
        };
      }

      if (error.name === "TypeError" && error.message.includes("fetch")) {
        return {
          functionName,
          status: "not_found",
          error: {
            message: "Function endpoint not reachable",
            details:
              "The edge function URL is not responding. It may not be deployed.",
            originalError: error.message,
          },
          timing,
          url,
        };
      }

      return {
        functionName,
        status: "error",
        error: {
          message: error.message,
          name: error.name,
          details: this.extractErrorDetails(error),
        },
        timing,
        url,
      };
    }
  }

  private extractErrorDetails(error: any): string {
    if (error.details) return error.details;
    if (error.hint) return error.hint;
    if (error.code) return `Error code: ${error.code}`;
    if (error.status)
      return `HTTP ${error.status}: ${error.statusText || "Unknown"}`;

    // Check for common error patterns
    const message = error.message || error.toString();

    if (message.includes("non-2xx status code")) {
      return "Function returned an error status code. Check function logs for details.";
    }

    if (message.includes("fetch")) {
      return "Network error - function may not be deployed or accessible.";
    }

    if (message.includes("timeout")) {
      return "Function execution timed out.";
    }

    return "No additional error details available";
  }

  async diagnoseAllFunctions(): Promise<EdgeFunctionDiagnostic[]> {
    const functions = [
      "paystack-split-management",
      "paystack-transfer-management",
      "manage-paystack-subaccount",
      "paystack-refund-management",
      "initialize-paystack-payment",
      "verify-paystack-payment",
      "create-paystack-subaccount",
    ];

    console.log("🔍 Running enhanced edge function diagnostics...");

    const results = await Promise.all(
      functions.map((funcName) => this.diagnoseFunction(funcName)),
    );

    this.printDiagnosticReport(results);
    return results;
  }

  private printDiagnosticReport(results: EdgeFunctionDiagnostic[]) {
    console.log("\n🔍 EDGE FUNCTION DIAGNOSTIC REPORT");
    console.log("=====================================\n");

    results.forEach((result) => {
      const statusIcon = this.getStatusIcon(result.status);
      console.log(
        `${statusIcon} ${result.functionName} (${result.timing.toFixed(0)}ms)`,
      );
      console.log(`   URL: ${result.url}`);

      if (result.status === "success") {
        console.log(`   ✅ Response:`, result.response);
      } else {
        console.log(
          `   ❌ Status: ${result.httpStatus || "unknown"} ${result.httpStatusText || ""}`,
        );
        console.log(`   ❌ Error:`, result.error?.message || "Unknown error");
        console.log(
          `   ❌ Details:`,
          result.error?.details || "No details available",
        );

        if (result.response) {
          console.log(`   📄 Response:`, result.response);
        }

        if (result.headers) {
          const relevantHeaders = Object.entries(result.headers).filter(
            ([key]) =>
              [
                "content-type",
                "x-edge-function-error",
                "x-sb-gateway-error",
              ].includes(key.toLowerCase()),
          );

          if (relevantHeaders.length > 0) {
            console.log(`   📋 Headers:`, Object.fromEntries(relevantHeaders));
          }
        }
      }

      console.log(""); // Empty line for readability
    });

    const successCount = results.filter((r) => r.status === "success").length;
    const totalCount = results.length;

    console.log(`📊 Summary: ${successCount}/${totalCount} functions working`);

    if (successCount === 0) {
      console.log("\n🚨 CRITICAL: No edge functions are working!");
      console.log("   Possible causes:");
      console.log("   • Edge functions not deployed to Supabase");
      console.log("   • Configuration issues in Supabase project");
      console.log("   • Network connectivity problems");
      console.log("   • Invalid Supabase URL or anon key");
    }
  }

  private getStatusIcon(status: string): string {
    switch (status) {
      case "success":
        return "✅";
      case "error":
        return "❌";
      case "not_found":
        return "🔍";
      case "timeout":
        return "⏱️";
      default:
        return "❓";
    }
  }
}

// Export convenience function
export async function debugEdgeFunctions(): Promise<EdgeFunctionDiagnostic[]> {
  const edgeFunctionDebugger = new EdgeFunctionDebugger();
  return await edgeFunctionDebugger.diagnoseAllFunctions();
}

export default EdgeFunctionDebugger;

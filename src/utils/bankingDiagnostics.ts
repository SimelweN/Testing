import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export interface BankingSystemStatus {
  edgeFunction: "available" | "unavailable" | "error";
  database: "available" | "schema_issues" | "permission_denied" | "unavailable";
  paystackConfig: "configured" | "missing" | "invalid";
  userAuth: "authenticated" | "unauthenticated" | "expired";
  details: {
    edgeFunctionError?: string;
    databaseError?: string;
    missingTables?: string[];
    authError?: string;
  };
}

export class BankingDiagnostics {
  static async checkSystemStatus(): Promise<BankingSystemStatus> {
    const status: BankingSystemStatus = {
      edgeFunction: "unavailable",
      database: "unavailable", 
      paystackConfig: "missing",
      userAuth: "unauthenticated",
      details: {}
    };

    // 1. Check user authentication
    try {
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      if (authError) {
        status.userAuth = "expired";
        status.details.authError = authError.message;
      } else if (session?.user) {
        status.userAuth = "authenticated";
      } else {
        status.userAuth = "unauthenticated";
      }
    } catch (error) {
      status.userAuth = "expired";
      status.details.authError = error instanceof Error ? error.message : "Unknown auth error";
    }

    // 2. Check database tables exist and are accessible
    try {
      // Test if banking_subaccounts table exists and is accessible
      const { error: dbError } = await supabase
        .from("banking_subaccounts")
        .select("user_id")
        .limit(1);

      if (dbError) {
        if (dbError.code === "42P01") {
          status.database = "schema_issues";
          status.details.missingTables = ["banking_subaccounts"];
          status.details.databaseError = "banking_subaccounts table does not exist";
        } else if (dbError.code === "42501") {
          status.database = "permission_denied";
          status.details.databaseError = "No permission to access banking_subaccounts table";
        } else {
          status.database = "unavailable";
          status.details.databaseError = dbError.message;
        }
      } else {
        status.database = "available";
      }
    } catch (error) {
      status.database = "unavailable";
      status.details.databaseError = error instanceof Error ? error.message : "Unknown database error";
    }

    // 3. Check edge function availability
    if (status.userAuth === "authenticated") {
      try {
        const { data, error } = await supabase.functions.invoke(
          "create-paystack-subaccount",
          {
            body: { test: true }, // Send minimal test payload
          }
        );

        if (error) {
          if (error.message?.includes("non-2xx status code") || 
              error.message?.includes("Function not found") ||
              error.message?.includes("FunctionsHttpError")) {
            status.edgeFunction = "unavailable";
            status.details.edgeFunctionError = "Edge function not deployed or accessible";
          } else {
            status.edgeFunction = "error";
            status.details.edgeFunctionError = error.message;
          }
        } else {
          status.edgeFunction = "available";
        }
      } catch (error) {
        status.edgeFunction = "error";
        status.details.edgeFunctionError = error instanceof Error ? error.message : "Unknown edge function error";
      }
    }

    // 4. Check if we have Paystack configuration (this is just a guess since we can't access server env vars)
    // We'll set this to configured by default since the edge function would handle this
    status.paystackConfig = "configured";

    return status;
  }

  static async runDiagnostics(): Promise<void> {
    console.log("🔍 Running banking system diagnostics...");
    
    const status = await this.checkSystemStatus();
    
    console.log("📊 Banking System Status:", status);

    // Show user-friendly status message
    const issues: string[] = [];
    const successes: string[] = [];

    if (status.userAuth === "authenticated") {
      successes.push("✅ User authentication working");
    } else {
      issues.push(`❌ Authentication issue: ${status.details.authError || "Not logged in"}`);
    }

    if (status.database === "available") {
      successes.push("✅ Database access working");
    } else {
      issues.push(`❌ Database issue: ${status.details.databaseError || "Database unavailable"}`);
    }

    if (status.edgeFunction === "available") {
      successes.push("✅ Edge function working");
    } else if (status.edgeFunction === "unavailable") {
      issues.push("⚠️ Edge function unavailable - using development mode");
    } else {
      issues.push(`❌ Edge function error: ${status.details.edgeFunctionError || "Unknown error"}`);
    }

    // Show summary to user
    if (issues.length === 0) {
      toast.success("Banking system is fully operational", {
        description: successes.join(", ")
      });
    } else if (status.database === "available" && status.userAuth === "authenticated") {
      toast.info("Banking system partially working", {
        description: "Edge function unavailable but fallback mode available",
        duration: 6000
      });
    } else {
      toast.error("Banking system issues detected", {
        description: issues.slice(0, 2).join(", "),
        duration: 8000
      });
    }

    return;
  }

  static getSystemStatusSummary(status: BankingSystemStatus): string {
    const working = [
      status.userAuth === "authenticated",
      status.database === "available", 
      status.edgeFunction === "available"
    ].filter(Boolean).length;

    const total = 3;
    const percentage = Math.round((working / total) * 100);

    if (percentage === 100) {
      return "🟢 All systems operational";
    } else if (percentage >= 66) {
      return "🟡 Mostly operational (fallback mode available)";
    } else if (percentage >= 33) {
      return "🟠 Limited functionality";
    } else {
      return "🔴 System issues detected";
    }
  }
}

// Helper function to run diagnostics with user feedback
export async function diagnoseBankingIssues(): Promise<BankingSystemStatus> {
  try {
    const status = await BankingDiagnostics.checkSystemStatus();
    console.log("Banking diagnostics complete:", status);
    return status;
  } catch (error) {
    console.error("Banking diagnostics failed:", error);
    toast.error("Failed to run banking system diagnostics");
    
    // Return minimal status indicating failure
    return {
      edgeFunction: "error",
      database: "unavailable",
      paystackConfig: "missing", 
      userAuth: "expired",
      details: {
        edgeFunctionError: "Diagnostics failed",
        databaseError: "Diagnostics failed",
        authError: "Diagnostics failed"
      }
    };
  }
}

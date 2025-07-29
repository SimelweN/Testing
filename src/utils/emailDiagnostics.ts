import { supabase } from "@/lib/supabase";

export interface EmailDiagnosticResult {
  service: string;
  status: "ok" | "error" | "warning";
  message: string;
  details?: any;
}

export class EmailDiagnostics {
  static async runFullDiagnostic(): Promise<EmailDiagnosticResult[]> {
    const results: EmailDiagnosticResult[] = [];

    // Test 1: Supabase Connection
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        results.push({
          service: "Supabase Connection",
          status: "error",
          message: "Failed to connect to Supabase",
          details: error.message,
        });
      } else {
        results.push({
          service: "Supabase Connection",
          status: "ok",
          message: "Supabase connection successful",
        });
      }
    } catch (error) {
      results.push({
        service: "Supabase Connection",
        status: "error",
        message: "Supabase connection exception",
        details: error.message,
      });
    }

    // Test 2: Email Service Endpoint
    try {
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/send-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ test: true }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        results.push({
          service: "Email Service Endpoint",
          status: "ok",
          message: "Email service endpoint is accessible",
          details: result.config,
        });
      } else {
        results.push({
          service: "Email Service Endpoint",
          status: "error",
          message: "Email service configuration error",
          details: result,
        });
      }
    } catch (error) {
      results.push({
        service: "Email Service Endpoint",
        status: "error",
        message: "Failed to reach email service endpoint",
        details: error.message,
      });
    }

    // Test 3: Mail Queue Processor
    try {
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/process-mail-queue`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      const result = await response.json();

      if (response.ok) {
        results.push({
          service: "Mail Queue Processor",
          status: "ok",
          message: "Mail queue processor is functional",
          details: result,
        });
      } else {
        results.push({
          service: "Mail Queue Processor",
          status: "error",
          message: "Mail queue processor error",
          details: result,
        });
      }
    } catch (error) {
      results.push({
        service: "Mail Queue Processor",
        status: "error",
        message: "Mail queue processor not accessible",
        details: error.message,
      });
    }

    // Test 4: Mail Queue Table
    try {
      const { data, error } = await supabase
        .from("mail_queue")
        .select("id, status, created_at")
        .limit(1);

      if (error) {
        results.push({
          service: "Mail Queue Table",
          status: "error",
          message: "Cannot access mail_queue table",
          details: error.message,
        });
      } else {
        results.push({
          service: "Mail Queue Table",
          status: "ok",
          message: "Mail queue table accessible",
          details: `Found ${data?.length || 0} records in test query`,
        });
      }
    } catch (error) {
      results.push({
        service: "Mail Queue Table",
        status: "error",
        message: "Mail queue table access exception",
        details: error.message,
      });
    }

    // Test 5: Check for pending emails
    try {
      const { count, error } = await supabase
        .from("mail_queue")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      if (error) {
        results.push({
          service: "Pending Emails Check",
          status: "warning",
          message: "Could not check pending emails",
          details: error.message,
        });
      } else {
        const pendingCount = count || 0;
        if (pendingCount > 0) {
          results.push({
            service: "Pending Emails Check",
            status: "warning",
            message: `${pendingCount} emails pending in queue`,
            details: "Consider running mail queue processor",
          });
        } else {
          results.push({
            service: "Pending Emails Check",
            status: "ok",
            message: "No emails pending in queue",
          });
        }
      }
    } catch (error) {
      results.push({
        service: "Pending Emails Check",
        status: "error",
        message: "Error checking pending emails",
        details: error.message,
      });
    }

    return results;
  }

  static async checkEnvironmentVariables(): Promise<EmailDiagnosticResult[]> {
    const results: EmailDiagnosticResult[] = [];

    // Check frontend environment variables
    const frontendVars = [
      "VITE_SUPABASE_URL",
      "VITE_SUPABASE_ANON_KEY",
    ];

    frontendVars.forEach((varName) => {
      const value = import.meta.env[varName];
      if (!value || value === "undefined" || value.trim() === "") {
        results.push({
          service: `Environment Variable: ${varName}`,
          status: "error",
          message: `${varName} is not set or empty`,
        });
      } else {
        results.push({
          service: `Environment Variable: ${varName}`,
          status: "ok",
          message: `${varName} is configured`,
          details: `Length: ${value.length} characters`,
        });
      }
    });

    return results;
  }

  static async testEmailSending(testEmail?: string): Promise<EmailDiagnosticResult> {
    try {
      const { emailService } = await import("@/services/emailService");

      const testEmailAddress = testEmail || "test@example.com";
      
      const result = await emailService.sendEmail({
        to: testEmailAddress,
        subject: "Email Service Test",
        html: `
          <h2>Email Service Test</h2>
          <p>This is a test email sent at ${new Date().toISOString()}</p>
          <p>If you receive this, the email service is working correctly!</p>
        `,
        text: `Email Service Test - This is a test email sent at ${new Date().toISOString()}`,
      });

      if (result.success) {
        return {
          service: "Email Sending Test",
          status: "ok",
          message: "Test email sent successfully",
          details: {
            messageId: result.messageId,
            to: testEmailAddress,
          },
        };
      } else {
        return {
          service: "Email Sending Test",
          status: "error",
          message: "Test email failed to send",
          details: result,
        };
      }
    } catch (error) {
      return {
        service: "Email Sending Test",
        status: "error",
        message: "Email sending test exception",
        details: error.message,
      };
    }
  }

  static async processMailQueue(): Promise<EmailDiagnosticResult> {
    try {
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/process-mail-queue`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        return {
          service: "Manual Mail Queue Processing",
          status: "ok",
          message: "Mail queue processed successfully",
          details: result,
        };
      } else {
        return {
          service: "Manual Mail Queue Processing",
          status: "error",
          message: "Mail queue processing failed",
          details: result,
        };
      }
    } catch (error) {
      return {
        service: "Manual Mail Queue Processing",
        status: "error",
        message: "Mail queue processing exception",
        details: error.message,
      };
    }
  }

  static formatDiagnosticResults(results: EmailDiagnosticResult[]): string {
    let output = "EMAIL SERVICE DIAGNOSTIC REPORT\n";
    output += "=".repeat(50) + "\n\n";

    const okCount = results.filter((r) => r.status === "ok").length;
    const warningCount = results.filter((r) => r.status === "warning").length;
    const errorCount = results.filter((r) => r.status === "error").length;

    output += `SUMMARY: ${okCount} OK, ${warningCount} warnings, ${errorCount} errors\n\n`;

    results.forEach((result, index) => {
      const statusIcon = result.status === "ok" ? "✅" : result.status === "warning" ? "⚠️" : "❌";
      output += `${index + 1}. ${statusIcon} ${result.service}\n`;
      output += `   Status: ${result.status.toUpperCase()}\n`;
      output += `   Message: ${result.message}\n`;
      if (result.details) {
        output += `   Details: ${typeof result.details === "string" ? result.details : JSON.stringify(result.details, null, 2)}\n`;
      }
      output += "\n";
    });

    return output;
  }
}

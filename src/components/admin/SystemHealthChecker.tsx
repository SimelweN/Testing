import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Loader2,
  Database,
  Webhook,
  CreditCard,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PAYSTACK_CONFIG } from "@/config/paystack";

interface SystemCheck {
  component: string;
  status: "healthy" | "warning" | "error" | "checking";
  message: string;
  details?: any;
  icon: React.ComponentType<{ className?: string }>;
}

const SystemHealthChecker: React.FC = () => {
  const [checks, setChecks] = useState<SystemCheck[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runHealthCheck = async () => {
    setIsRunning(true);
    setChecks([]);

    const newChecks: SystemCheck[] = [
      {
        component: "Database Tables",
        status: "checking",
        message: "Checking database connectivity...",
        icon: Database,
      },
      {
        component: "Webhook Setup",
        status: "checking",
        message: "Validating webhook configuration...",
        icon: Webhook,
      },
      {
        component: "Refund System",
        status: "checking",
        message: "Testing refund system...",
        icon: CreditCard,
      },
    ];

    setChecks([...newChecks]);

    // Check Database Tables
    try {
      const tableChecks = await checkDatabaseTables();
      setChecks((prev) =>
        prev.map((check) =>
          check.component === "Database Tables" ? tableChecks : check,
        ),
      );
    } catch (error) {
      setChecks((prev) =>
        prev.map((check) =>
          check.component === "Database Tables"
            ? {
                ...check,
                status: "error",
                message: "Database check failed",
                details: {
                  error:
                    error instanceof Error ? error.message : "Unknown error",
                },
              }
            : check,
        ),
      );
    }

    // Check Webhook Setup
    try {
      const webhookCheck = await checkWebhookSetup();
      setChecks((prev) =>
        prev.map((check) =>
          check.component === "Webhook Setup" ? webhookCheck : check,
        ),
      );
    } catch (error) {
      setChecks((prev) =>
        prev.map((check) =>
          check.component === "Webhook Setup"
            ? {
                ...check,
                status: "error",
                message: "Webhook check failed",
                details: {
                  error:
                    error instanceof Error ? error.message : "Unknown error",
                },
              }
            : check,
        ),
      );
    }

    // Check Refund System
    try {
      const refundCheck = await checkRefundSystem();
      setChecks((prev) =>
        prev.map((check) =>
          check.component === "Refund System" ? refundCheck : check,
        ),
      );
    } catch (error) {
      setChecks((prev) =>
        prev.map((check) =>
          check.component === "Refund System"
            ? {
                ...check,
                status: "error",
                message: "Refund system check failed",
                details: {
                  error:
                    error instanceof Error ? error.message : "Unknown error",
                },
              }
            : check,
        ),
      );
    }

    setIsRunning(false);
  };

  const checkDatabaseTables = async (): Promise<SystemCheck> => {
    try {
      // Check refund_transactions table
      const { data: refundData, error: refundError } = await supabase
        .from("refund_transactions")
        .select("count")
        .limit(1);

      if (refundError) {
        return {
          component: "Database Tables",
          status: "error",
          message: "refund_transactions table missing or inaccessible",
          details: {
            error: refundError.message,
            hint: "Run the database migration: supabase migration up",
          },
          icon: Database,
        };
      }

      // Check payment_transactions table
      const { data: paymentData, error: paymentError } = await supabase
        .from("payment_transactions")
        .select("count")
        .limit(1);

      if (paymentError) {
        return {
          component: "Database Tables",
          status: "error",
          message: "payment_transactions table missing or inaccessible",
          details: { error: paymentError.message },
          icon: Database,
        };
      }

      // Check orders table refund columns
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select("payment_reference, refund_status, refunded_at")
        .limit(1);

      if (orderError) {
        return {
          component: "Database Tables",
          status: "warning",
          message: "Orders table missing refund columns",
          details: {
            error: orderError.message,
            hint: "Update orders table with refund columns",
          },
          icon: Database,
        };
      }

      return {
        component: "Database Tables",
        status: "healthy",
        message: "All database tables accessible",
        details: {
          refund_transactions: "✓ Accessible",
          payment_transactions: "✓ Accessible",
          orders_refund_columns: "✓ Present",
        },
        icon: Database,
      };
    } catch (error) {
      return {
        component: "Database Tables",
        status: "error",
        message: "Database connection failed",
        details: {
          error: error instanceof Error ? error.message : "Unknown error",
        },
        icon: Database,
      };
    }
  };

  const checkWebhookSetup = async (): Promise<SystemCheck> => {
    try {
      // Check if webhook endpoint exists
      const response = await fetch("/api/paystack-webhook", {
        method: "OPTIONS",
      });

      if (!response.ok && response.status !== 405) {
        return {
          component: "Webhook Setup",
          status: "error",
          message: "Webhook endpoint not accessible",
          details: {
            status: response.status,
            webhookUrl: "/api/paystack-webhook",
          },
          icon: Webhook,
        };
      }

      // Check Paystack configuration
      if (!PAYSTACK_CONFIG.isConfigured()) {
        return {
          component: "Webhook Setup",
          status: "warning",
          message: "Paystack not configured - webhook setup incomplete",
          details: {
            publicKey: PAYSTACK_CONFIG.PUBLIC_KEY,
            hint: "Set VITE_PAYSTACK_PUBLIC_KEY environment variable",
          },
          icon: Webhook,
        };
      }

      return {
        component: "Webhook Setup",
        status: "warning",
        message:
          "Webhook endpoint accessible - verify Paystack dashboard config",
        details: {
          webhookUrl: "/api/paystack-webhook",
          paystack: PAYSTACK_CONFIG.isTestMode() ? "Test mode" : "Live mode",
          requiredEvents: [
            "charge.success",
            "charge.failed",
            "transfer.success",
            "transfer.failed",
          ],
        },
        icon: Webhook,
      };
    } catch (error) {
      return {
        component: "Webhook Setup",
        status: "error",
        message: "Webhook validation failed",
        details: {
          error: error instanceof Error ? error.message : "Unknown error",
        },
        icon: Webhook,
      };
    }
  };

  const checkRefundSystem = async (): Promise<SystemCheck> => {
    try {
      // Check refund API endpoint
      const response = await fetch("/api/process-refund", {
        method: "OPTIONS",
      });

      if (!response.ok && response.status !== 405) {
        return {
          component: "Refund System",
          status: "error",
          message: "Refund API endpoint not accessible",
          details: {
            status: response.status,
            endpoint: "/api/process-refund",
          },
          icon: CreditCard,
        };
      }

      // Check refund_transactions table access
      const { error: refundTableError } = await supabase
        .from("refund_transactions")
        .select("count")
        .limit(1);

      if (refundTableError) {
        return {
          component: "Refund System",
          status: "error",
          message: "Refund database table not accessible",
          details: {
            error: refundTableError.message,
            table: "refund_transactions",
          },
          icon: CreditCard,
        };
      }

      return {
        component: "Refund System",
        status: "healthy",
        message: "Refund system operational",
        details: {
          api_endpoint: "✓ Accessible",
          database_table: "✓ Accessible",
          paystack_config: PAYSTACK_CONFIG.isConfigured()
            ? "✓ Configured"
            : "⚠ Not configured",
        },
        icon: CreditCard,
      };
    } catch (error) {
      return {
        component: "Refund System",
        status: "error",
        message: "Refund system validation failed",
        details: {
          error: error instanceof Error ? error.message : "Unknown error",
        },
        icon: CreditCard,
      };
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-green-100 text-green-800 border-green-200";
      case "warning":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "error":
        return "bg-red-100 text-red-800 border-red-200";
      case "checking":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "checking":
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          System Health Check
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={runHealthCheck}
          disabled={isRunning}
          className="w-full"
        >
          {isRunning ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          {isRunning ? "Running Health Check..." : "Run Health Check"}
        </Button>

        {checks.length > 0 && (
          <div className="space-y-3">
            {checks.map((check) => {
              const Icon = check.icon;
              return (
                <Alert
                  key={check.component}
                  className={`${getStatusColor(check.status)}`}
                >
                  <div className="flex items-start gap-3">
                    <Icon className="h-5 w-5 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <strong className="text-sm font-medium">
                          {check.component}
                        </strong>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(check.status)}
                          <Badge
                            variant="outline"
                            className={`${getStatusColor(check.status)} border`}
                          >
                            {check.status}
                          </Badge>
                        </div>
                      </div>
                      <AlertDescription className="text-sm">
                        {check.message}
                        {check.details && (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-xs font-medium mb-1">
                              View Details
                            </summary>
                            <pre className="text-xs bg-black/5 p-2 rounded overflow-auto max-h-32">
                              {JSON.stringify(check.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
              );
            })}
          </div>
        )}

        {checks.length > 0 && !isRunning && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-sm mb-2">Quick Fix Actions:</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <p>• For database issues: Check if migrations have been run</p>
              <p>
                • For webhook issues: Verify Paystack dashboard configuration
              </p>
              <p>• For refund issues: Ensure all API endpoints are deployed</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SystemHealthChecker;

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  ExternalLink,
  CreditCard,
} from "lucide-react";
import { PAYSTACK_CONFIG } from "@/config/paystack";
import { supabase } from "@/integrations/supabase/client";

interface HealthStatus {
  component: string;
  status: "healthy" | "warning" | "error" | "unknown";
  message: string;
}

const PaystackHealthSummary: React.FC = () => {
  const [healthStatus, setHealthStatus] = useState<HealthStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  useEffect(() => {
    checkSystemHealth();
  }, []);

  const checkSystemHealth = async () => {
    setIsLoading(true);
    const statuses: HealthStatus[] = [];

    try {
      // 1. Check Paystack Configuration
      const paystackConfigured = PAYSTACK_CONFIG.isConfigured();
      if (paystackConfigured) {
        if (PAYSTACK_CONFIG.isLiveMode()) {
          statuses.push({
            component: "Paystack Config",
            status: "healthy",
            message: "Live mode configured",
          });
        } else if (PAYSTACK_CONFIG.isTestMode()) {
          statuses.push({
            component: "Paystack Config",
            status: "warning",
            message: "Test mode configured",
          });
        }
      } else {
        statuses.push({
          component: "Paystack Config",
          status: "error",
          message: "Not configured",
        });
      }

      // 2. Check Database Connection
      try {
        await supabase.from("books").select("count").limit(1);
        statuses.push({
          component: "Database",
          status: "healthy",
          message: "Connected",
        });
      } catch (error) {
        statuses.push({
          component: "Database",
          status: "error",
          message: "Connection failed",
        });
      }

      // 3. Check Split Management Function
      try {
        const { data, error } = await supabase.functions.invoke(
          "paystack-split-management",
          {
            body: { health: true },
            method: "GET",
          },
        );

        if (!error && (data?.success || data?.service)) {
          statuses.push({
            component: "Split Management",
            status: "healthy",
            message: "Operational",
          });
        } else {
          statuses.push({
            component: "Split Management",
            status: "warning",
            message: "Limited response",
          });
        }
      } catch (error) {
        statuses.push({
          component: "Split Management",
          status: "error",
          message: "Not responding",
        });
      }

      // 4. Check Transfer Management Function
      try {
        const { data, error } = await supabase.functions.invoke(
          "paystack-transfer-management",
          {
            body: { action: "banks" },
            method: "GET",
          },
        );

        if (!error && data?.success) {
          statuses.push({
            component: "Transfer Management",
            status: "healthy",
            message: "API connected",
          });
        } else {
          statuses.push({
            component: "Transfer Management",
            status: "warning",
            message: "API limited",
          });
        }
      } catch (error) {
        statuses.push({
          component: "Transfer Management",
          status: "error",
          message: "API failed",
        });
      }
    } catch (error) {
      statuses.push({
        component: "System Check",
        status: "error",
        message: "Health check failed",
      });
    }

    setHealthStatus(statuses);
    setLastChecked(new Date());
    setIsLoading(false);
  };

  const getStatusIcon = (status: HealthStatus["status"]) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <ShieldCheck className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: HealthStatus["status"]) => {
    const variants = {
      healthy: "bg-green-100 text-green-800",
      warning: "bg-yellow-100 text-yellow-800",
      error: "bg-red-100 text-red-800",
      unknown: "bg-gray-100 text-gray-800",
    };

    return (
      <Badge className={variants[status] || "bg-gray-100 text-gray-800"}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const overallHealth = () => {
    const errorCount = healthStatus.filter((s) => s.status === "error").length;
    const warningCount = healthStatus.filter(
      (s) => s.status === "warning",
    ).length;

    if (errorCount > 0) return "error";
    if (warningCount > 0) return "warning";
    return healthStatus.length > 0 ? "healthy" : "unknown";
  };

  const healthySummary = healthStatus.filter(
    (s) => s.status === "healthy",
  ).length;
  const totalChecks = healthStatus.length;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="h-5 w-5" />
            Paystack System Health
          </CardTitle>
          <div className="flex items-center gap-2">
            {getStatusBadge(overallHealth())}
            <Button
              onClick={checkSystemHealth}
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              {isLoading ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>
        {lastChecked && (
          <p className="text-xs text-gray-500">
            Last checked: {lastChecked.toLocaleTimeString()}
          </p>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        {healthStatus.length > 0 ? (
          <div className="space-y-3">
            {/* Summary Stats */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                {healthySummary}/{totalChecks} components healthy
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-1 text-xs text-blue-600 hover:text-blue-800"
                onClick={() => {
                  // Navigate to the Paystack System tab
                  const tabTrigger = document.querySelector(
                    '[value="paystack-verification"]',
                  ) as HTMLElement;
                  if (tabTrigger) {
                    tabTrigger.click();
                  }
                }}
              >
                View Details
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            </div>

            {/* Health Status List */}
            <div className="space-y-2">
              {healthStatus.map((status, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-1.5 px-2 rounded border border-gray-100"
                >
                  <div className="flex items-center gap-2">
                    {getStatusIcon(status.status)}
                    <span className="text-sm font-medium">
                      {status.component}
                    </span>
                  </div>
                  <span className="text-xs text-gray-600">
                    {status.message}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <ShieldCheck className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">
              {isLoading
                ? "Checking system health..."
                : "No health data available"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PaystackHealthSummary;

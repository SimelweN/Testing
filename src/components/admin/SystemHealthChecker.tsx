import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Database,
  CreditCard,
  Mail,
  Truck,
  RefreshCw,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface HealthCheck {
  name: string;
  status: "healthy" | "warning" | "error" | "checking";
  message: string;
  icon: React.ReactNode;
  lastChecked?: string;
  details?: string;
}

const SystemHealthChecker: React.FC = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([
    {
      name: "Database Connection",
      status: "checking",
      message: "Not checked",
      icon: <Database className="h-4 w-4" />,
    },
    {
      name: "Paystack API",
      status: "checking",
      message: "Not checked",
      icon: <CreditCard className="h-4 w-4" />,
    },
    {
      name: "Email Service",
      status: "checking",
      message: "Not checked",
      icon: <Mail className="h-4 w-4" />,
    },
    {
      name: "Courier APIs",
      status: "checking",
      message: "Not checked",
      icon: <Truck className="h-4 w-4" />,
    },
  ]);

  const runHealthChecks = async () => {
    setIsChecking(true);
    const results: HealthCheck[] = [];

    try {
      // Check 1: Database Connection
      try {
        await supabase.from("books").select("count").limit(1);
        results.push({
          name: "Database Connection",
          status: "healthy",
          message: "Database is accessible",
          icon: <Database className="h-4 w-4" />,
          lastChecked: new Date().toLocaleTimeString(),
        });
      } catch (error) {
        results.push({
          name: "Database Connection",
          status: "error",
          message: "Database connection failed",
          icon: <Database className="h-4 w-4" />,
          lastChecked: new Date().toLocaleTimeString(),
          details: error instanceof Error ? error.message : "Unknown error",
        });
      }

      // Check 2: Paystack API
      try {
        const { data, error } = await supabase.functions.invoke(
          "initialize-paystack-payment",
          {
            body: { test: true },
          },
        );

        if (error || !data) {
          results.push({
            name: "Paystack API",
            status: "warning",
            message: "Paystack function accessible but test failed",
            icon: <CreditCard className="h-4 w-4" />,
            lastChecked: new Date().toLocaleTimeString(),
            details: error?.message || "Test call failed",
          });
        } else {
          results.push({
            name: "Paystack API",
            status: "healthy",
            message: "Paystack function is accessible",
            icon: <CreditCard className="h-4 w-4" />,
            lastChecked: new Date().toLocaleTimeString(),
          });
        }
      } catch (error) {
        results.push({
          name: "Paystack API",
          status: "error",
          message: "Paystack function failed",
          icon: <CreditCard className="h-4 w-4" />,
          lastChecked: new Date().toLocaleTimeString(),
          details: error instanceof Error ? error.message : "Unknown error",
        });
      }

      // Check 3: Email Service
      try {
        const { data, error } = await supabase.functions.invoke("send-email", {
          body: {
            to: "test@example.com",
            subject: "Health Check Test",
            text: "This is a health check test",
            test: true,
          },
        });

        if (error) {
          results.push({
            name: "Email Service",
            status: "warning",
            message: "Email function accessible but test failed",
            icon: <Mail className="h-4 w-4" />,
            lastChecked: new Date().toLocaleTimeString(),
            details: error.message,
          });
        } else {
          results.push({
            name: "Email Service",
            status: "healthy",
            message: "Email service is functional",
            icon: <Mail className="h-4 w-4" />,
            lastChecked: new Date().toLocaleTimeString(),
          });
        }
      } catch (error) {
        results.push({
          name: "Email Service",
          status: "error",
          message: "Email service failed",
          icon: <Mail className="h-4 w-4" />,
          lastChecked: new Date().toLocaleTimeString(),
          details: error instanceof Error ? error.message : "Unknown error",
        });
      }

      // Check 4: Courier APIs
      try {
        const { data, error } = await supabase.functions.invoke(
          "get-delivery-quotes",
          {
            body: {
              fromAddress: {
                suburb: "Test",
                postal_code: "1234",
                province: "Gauteng",
              },
              toAddress: {
                suburb: "Test",
                postal_code: "5678",
                province: "Western Cape",
              },
              weight: 1,
            },
          },
        );

        if (error) {
          results.push({
            name: "Courier APIs",
            status: "warning",
            message: "Courier functions accessible but quotes failed",
            icon: <Truck className="h-4 w-4" />,
            lastChecked: new Date().toLocaleTimeString(),
            details: error.message,
          });
        } else {
          results.push({
            name: "Courier APIs",
            status: "healthy",
            message: "Courier services are functional",
            icon: <Truck className="h-4 w-4" />,
            lastChecked: new Date().toLocaleTimeString(),
          });
        }
      } catch (error) {
        results.push({
          name: "Courier APIs",
          status: "error",
          message: "Courier APIs failed",
          icon: <Truck className="h-4 w-4" />,
          lastChecked: new Date().toLocaleTimeString(),
          details: error instanceof Error ? error.message : "Unknown error",
        });
      }
    } catch (error) {
      toast.error(
        "Health check failed: " +
          (error instanceof Error ? error.message : "Unknown error"),
      );
    }

    setHealthChecks(results);
    setIsChecking(false);

    const healthyCount = results.filter((r) => r.status === "healthy").length;
    const totalCount = results.length;

    if (healthyCount === totalCount) {
      toast.success("All systems are healthy!");
    } else {
      toast.warning(`${healthyCount}/${totalCount} systems are healthy`);
    }
  };

  const getStatusColor = (status: HealthCheck["status"]) => {
    switch (status) {
      case "healthy":
        return "bg-green-100 text-green-800";
      case "warning":
        return "bg-yellow-100 text-yellow-800";
      case "error":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: HealthCheck["status"]) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case "checking":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Health Check
          </CardTitle>
          <Button
            onClick={runHealthChecks}
            disabled={isChecking}
            size="sm"
            className="flex items-center gap-2"
          >
            {isChecking ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {isChecking ? "Checking..." : "Run Health Check"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {healthChecks.map((check, index) => (
          <Alert key={index} className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="flex items-center gap-2">
                {check.icon}
                {getStatusIcon(check.status)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{check.name}</span>
                  <Badge className={getStatusColor(check.status)}>
                    {check.status}
                  </Badge>
                </div>
                <AlertDescription className="text-sm">
                  {check.message}
                  {check.lastChecked && (
                    <span className="text-gray-500 ml-2">
                      (Last checked: {check.lastChecked})
                    </span>
                  )}
                </AlertDescription>
                {check.details && (
                  <details className="mt-2">
                    <summary className="text-xs cursor-pointer text-gray-600">
                      View Details
                    </summary>
                    <div className="text-xs text-gray-500 mt-1 bg-gray-50 p-2 rounded">
                      {check.details}
                    </div>
                  </details>
                )}
              </div>
            </div>
          </Alert>
        ))}

        {healthChecks.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Click "Run Health Check" to test all systems</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SystemHealthChecker;

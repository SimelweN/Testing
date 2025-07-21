import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Database,
  Play,
  Loader2,
  Copy,
  ExternalLink,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TableStatus {
  name: string;
  exists: boolean;
  recordCount?: number;
  error?: string;
  required: boolean;
  description: string;
}

const PaystackDatabaseSetupChecker: React.FC = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [tableStatuses, setTableStatuses] = useState<TableStatus[]>([]);
  const [showSetupScript, setShowSetupScript] = useState(false);

  const requiredTables = [
    {
      name: "profiles",
      required: true,
      description: "User profiles and account information"
    },
    {
      name: "books",
      required: true,
      description: "Book listings and inventory"
    },
    {
      name: "orders",
      required: true,
      description: "Order management and tracking"
    },
    {
      name: "payment_transactions",
      required: true,
      description: "Paystack payment records"
    },
    {
      name: "banking_subaccounts",
      required: true,
      description: "Seller banking information"
    },
    {
      name: "refund_transactions",
      required: true,
      description: "Refund processing and tracking"
    },
    {
      name: "transfers",
      required: true,
      description: "Seller payout transfers"
    },
    {
      name: "notifications",
      required: false,
      description: "User notification system"
    }
  ];

  const checkDatabaseSetup = async () => {
    setIsChecking(true);
    const statuses: TableStatus[] = [];

    for (const table of requiredTables) {
      try {
        const { count, error } = await supabase
          .from(table.name)
          .select("*", { count: "exact", head: true });

        if (error) {
          statuses.push({
            name: table.name,
            exists: false,
            error: error.message,
            required: table.required,
            description: table.description
          });
        } else {
          statuses.push({
            name: table.name,
            exists: true,
            recordCount: count || 0,
            required: table.required,
            description: table.description
          });
        }
      } catch (error) {
        statuses.push({
          name: table.name,
          exists: false,
          error: error instanceof Error ? error.message : "Unknown error",
          required: table.required,
          description: table.description
        });
      }
    }

    setTableStatuses(statuses);
    setIsChecking(false);

    const missingRequired = statuses.filter(s => s.required && !s.exists);
    if (missingRequired.length === 0) {
      toast.success("✅ Paystack database setup is complete!");
    } else {
      toast.error(`❌ ${missingRequired.length} required table(s) missing`);
    }
  };

  const copySetupScript = () => {
    const script = `-- Run this in your Supabase SQL Editor
-- Go to Dashboard → SQL Editor → New Query → Paste this script

-- Create required tables for Paystack functionality
-- Visit: https://your-project.supabase.co/project/sql

-- Copy the content from database-setup.sql file in your project root
-- Or get it from: ./database-setup.sql`;
    
    navigator.clipboard.writeText(script);
    toast.success("Setup instructions copied to clipboard!");
  };

  const getStatusIcon = (table: TableStatus) => {
    if (table.exists) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    } else if (table.required) {
      return <XCircle className="h-4 w-4 text-red-600" />;
    } else {
      return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (table: TableStatus) => {
    if (table.exists) {
      return "border-green-200 bg-green-50";
    } else if (table.required) {
      return "border-red-200 bg-red-50";
    } else {
      return "border-yellow-200 bg-yellow-50";
    }
  };

  const summary = {
    total: tableStatuses.length,
    existing: tableStatuses.filter(t => t.exists).length,
    missing: tableStatuses.filter(t => !t.exists).length,
    requiredMissing: tableStatuses.filter(t => t.required && !t.exists).length
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Paystack Database Setup Checker
        </CardTitle>
        <p className="text-sm text-gray-600">
          Verify that all required database tables are set up for Paystack functionality
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Control Panel */}
        <div className="flex items-center gap-3">
          <Button
            onClick={checkDatabaseSetup}
            disabled={isChecking}
            className="flex items-center gap-2"
          >
            {isChecking ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Checking Database...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Check Database Setup
              </>
            )}
          </Button>

          {tableStatuses.length > 0 && summary.requiredMissing > 0 && (
            <Button
              variant="outline"
              onClick={() => setShowSetupScript(!showSetupScript)}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Setup Instructions
            </Button>
          )}
        </div>

        {/* Summary */}
        {tableStatuses.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-lg font-semibold text-blue-700">
                {summary.total}
              </div>
              <div className="text-sm text-blue-600">Total Tables</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-lg font-semibold text-green-700">
                {summary.existing}
              </div>
              <div className="text-sm text-green-600">Existing</div>
            </div>
            <div className="bg-red-50 p-3 rounded-lg">
              <div className="text-lg font-semibold text-red-700">
                {summary.missing}
              </div>
              <div className="text-sm text-red-600">Missing</div>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg">
              <div className="text-lg font-semibold text-yellow-700">
                {summary.requiredMissing}
              </div>
              <div className="text-sm text-yellow-600">Required Missing</div>
            </div>
          </div>
        )}

        {/* Setup Instructions */}
        {showSetupScript && (
          <Alert className="border-blue-200 bg-blue-50">
            <Database className="h-4 w-4 text-blue-600" />
            <AlertDescription>
              <div className="space-y-3">
                <div>
                  <strong className="text-blue-900">Database Setup Required</strong>
                  <p className="text-sm text-blue-700 mt-1">
                    Some required tables are missing. Follow these steps to set up your database:
                  </p>
                </div>
                <div className="space-y-2 text-sm">
                  <ol className="list-decimal list-inside space-y-1 text-blue-700">
                    <li>Go to your <strong>Supabase Dashboard</strong></li>
                    <li>Navigate to <strong>SQL Editor</strong></li>
                    <li>Click <strong>New Query</strong></li>
                    <li>Copy the content from <code>database-setup.sql</code> in your project root</li>
                    <li>Paste and <strong>Run</strong> the script</li>
                  </ol>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copySetupScript}
                    className="flex items-center gap-2"
                  >
                    <Copy className="h-3 w-3" />
                    Copy Instructions
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open('https://supabase.com/docs/guides/database/overview', '_blank')}
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Supabase Docs
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Table Status */}
        {tableStatuses.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Database Tables Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {tableStatuses.map((table) => (
                <div
                  key={table.name}
                  className={`p-3 border rounded-lg ${getStatusColor(table)}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{table.name}</span>
                      {table.required && (
                        <Badge variant="secondary" className="text-xs">
                          Required
                        </Badge>
                      )}
                    </div>
                    {getStatusIcon(table)}
                  </div>
                  <p className="text-xs text-gray-600 mb-1">
                    {table.description}
                  </p>
                  <div className="text-xs">
                    {table.exists ? (
                      <span className="text-green-700 font-medium">
                        ✅ Table exists ({table.recordCount || 0} records)
                      </span>
                    ) : (
                      <span className="text-red-700 font-medium">
                        ❌ Table missing
                        {table.error && (
                          <div className="text-red-600 mt-1 text-xs">
                            Error: {table.error}
                          </div>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Overall Status */}
        {tableStatuses.length > 0 && (
          <Alert className={summary.requiredMissing > 0 ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
            <AlertDescription>
              {summary.requiredMissing > 0 ? (
                <div className="text-red-700">
                  <strong>⚠️ Database Setup Incomplete</strong>
                  <p className="text-sm mt-1">
                    {summary.requiredMissing} required table(s) are missing. Please run the database setup script to enable Paystack functionality.
                  </p>
                </div>
              ) : (
                <div className="text-green-700">
                  <strong>✅ Database Setup Complete</strong>
                  <p className="text-sm mt-1">
                    All required tables are present. Your Paystack integration should work correctly.
                  </p>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default PaystackDatabaseSetupChecker;

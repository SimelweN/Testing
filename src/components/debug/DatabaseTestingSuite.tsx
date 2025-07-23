import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Database, 
  Check, 
  X, 
  RefreshCw, 
  Users, 
  BookOpen, 
  CreditCard, 
  MessageSquare, 
  Flag,
  Bell,
  Settings 
} from "lucide-react";
import { toast } from "sonner";

interface TableStatus {
  name: string;
  exists: boolean;
  count: number;
  icon: React.ReactNode;
  description: string;
  error?: string;
}

export const DatabaseTestingSuite = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [tables, setTables] = useState<TableStatus[]>([]);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const tableDefinitions = [
    {
      name: "profiles",
      icon: <Users className="h-4 w-4" />,
      description: "User profiles and basic information"
    },
    {
      name: "books",
      icon: <BookOpen className="h-4 w-4" />,
      description: "Book listings and inventory"
    },
    {
      name: "seller_payouts",
      icon: <CreditCard className="h-4 w-4" />,
      description: "Seller payout requests and tracking"
    },
    {
      name: "payout_items",
      icon: <CreditCard className="h-4 w-4" />,
      description: "Individual sales linked to payouts"
    },
    {
      name: "contact_messages",
      icon: <MessageSquare className="h-4 w-4" />,
      description: "Contact form submissions"
    },
    {
      name: "reports",
      icon: <Flag className="h-4 w-4" />,
      description: "User reports and moderation"
    },
    {
      name: "payout_notifications",
      icon: <Bell className="h-4 w-4" />,
      description: "Notification tracking for payouts"
    },
    {
      name: "commission_settings",
      icon: <Settings className="h-4 w-4" />,
      description: "Platform commission configuration"
    },
    {
      name: "banking_details",
      icon: <CreditCard className="h-4 w-4" />,
      description: "Enhanced banking information"
    }
  ];

  const checkTable = async (tableName: string): Promise<TableStatus> => {
    try {
      // Try to query the table
      const { data, error, count } = await supabase
        .from(tableName)
        .select("*", { count: "exact", head: true });

      const tableInfo = tableDefinitions.find(t => t.name === tableName);

      if (error) {
        return {
          name: tableName,
          exists: false,
          count: 0,
          icon: tableInfo?.icon || <Database className="h-4 w-4" />,
          description: tableInfo?.description || "Unknown table",
          error: error.message
        };
      }

      return {
        name: tableName,
        exists: true,
        count: count || 0,
        icon: tableInfo?.icon || <Database className="h-4 w-4" />,
        description: tableInfo?.description || "Unknown table"
      };
    } catch (error) {
      const tableInfo = tableDefinitions.find(t => t.name === tableName);
      return {
        name: tableName,
        exists: false,
        count: 0,
        icon: tableInfo?.icon || <Database className="h-4 w-4" />,
        description: tableInfo?.description || "Unknown table",
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  };

  const runFullDatabaseTest = async () => {
    setIsLoading(true);
    try {
      console.log("🔍 Running comprehensive database test...");
      
      const tableStatuses = await Promise.all(
        tableDefinitions.map(table => checkTable(table.name))
      );

      setTables(tableStatuses);
      setLastChecked(new Date());

      const existingTables = tableStatuses.filter(t => t.exists).length;
      const totalTables = tableStatuses.length;

      if (existingTables === totalTables) {
        toast.success(`All ${totalTables} database tables are working correctly!`);
      } else {
        toast.warning(`${existingTables}/${totalTables} tables found. Some tables may be missing.`);
      }

    } catch (error) {
      console.error("❌ Database test failed:", error);
      toast.error("Database test failed: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };

  const createSampleData = async () => {
    try {
      console.log("🏗️ Creating sample data...");
      
      // Create sample payout request
      const { data: payout, error: payoutError } = await supabase
        .from('seller_payouts')
        .insert({
          seller_id: (await supabase.auth.getUser()).data.user?.id,
          amount: 150.00,
          currency: 'ZAR',
          status: 'pending',
          bank_name: 'First National Bank',
          account_number: '*****1234',
          account_holder_name: 'Test User',
          net_amount: 150.00,
          notes: 'Sample payout request for testing'
        })
        .select()
        .single();

      if (payoutError && !payoutError.message.includes('duplicate key')) {
        console.error('Error creating sample payout:', payoutError);
      }

      // Create sample contact message
      const { error: contactError } = await supabase
        .from('contact_messages')
        .insert({
          name: 'Test User',
          email: 'test@example.com',
          subject: 'Sample Contact Message',
          message: 'This is a sample contact message for testing the admin dashboard.',
          status: 'unread'
        });

      if (contactError && !contactError.message.includes('duplicate key')) {
        console.error('Error creating sample contact:', contactError);
      }

      toast.success("Sample data created successfully!");
      await runFullDatabaseTest(); // Refresh the data
      
    } catch (error) {
      console.error("Error creating sample data:", error);
      toast.error("Failed to create sample data");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-600" />
              <CardTitle>Database Testing Suite</CardTitle>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={createSampleData}
                variant="outline"
                size="sm"
                disabled={isLoading}
              >
                Create Sample Data
              </Button>
              <Button
                onClick={runFullDatabaseTest}
                disabled={isLoading}
                size="sm"
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Database className="h-4 w-4 mr-2" />
                )}
                Test Database
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {lastChecked && (
            <div className="text-sm text-gray-600 mb-4">
              Last checked: {lastChecked.toLocaleString()}
            </div>
          )}

          {tables.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Click "Test Database" to check all tables
            </div>
          ) : (
            <div className="grid gap-3">
              {tables.map((table) => (
                <div
                  key={table.name}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${table.exists ? 'bg-green-100' : 'bg-red-100'}`}>
                      {table.icon}
                    </div>
                    <div>
                      <div className="font-medium">{table.name}</div>
                      <div className="text-sm text-gray-600">{table.description}</div>
                      {table.error && (
                        <div className="text-xs text-red-600 mt-1">
                          Error: {table.error}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {table.exists && (
                      <Badge variant="secondary" className="text-xs">
                        {table.count} rows
                      </Badge>
                    )}
                    <Badge 
                      className={table.exists ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                    >
                      {table.exists ? (
                        <div className="flex items-center gap-1">
                          <Check className="h-3 w-3" />
                          Exists
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <X className="h-3 w-3" />
                          Missing
                        </div>
                      )}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Database Setup Instructions</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p>• If tables are missing, run the SQL schema files in Supabase</p>
              <p>• Create basic tables first: profiles, books, contact_messages, reports</p>
              <p>• Then add seller payout system tables: seller_payouts, payout_items, etc.</p>
              <p>• Use "Create Sample Data" to add test data for development</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DatabaseTestingSuite;

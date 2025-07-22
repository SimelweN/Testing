import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, Loader2, Database } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const DatabaseSchemaChecker: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const checkSchema = async () => {
    setIsLoading(true);
    setResults(null);
    
    try {
      console.log("🔍 Checking database schema...");
      
      const schemaChecks = {
        banking_subaccounts: {
          table_exists: false,
          columns: [] as string[],
          errors: [] as string[],
        },
        books: {
          table_exists: false,
          columns: [] as string[],
          errors: [] as string[],
        },
      };

      // Check banking_subaccounts table
      try {
        console.log("Checking banking_subaccounts table...");
        const { data, error } = await supabase
          .from("banking_subaccounts")
          .select("*")
          .limit(1);
        
        if (error) {
          schemaChecks.banking_subaccounts.errors.push(error.message);
          console.error("banking_subaccounts error:", error);
        } else {
          schemaChecks.banking_subaccounts.table_exists = true;
          if (data && data.length > 0) {
            schemaChecks.banking_subaccounts.columns = Object.keys(data[0]);
          } else {
            // Try to insert a test record to see what columns are expected
            try {
              await supabase
                .from("banking_subaccounts")
                .insert({
                  user_id: "test",
                  business_name: "test",
                  bank_code: "test",
                  account_number: "test",
                  subaccount_code: "test",
                });
            } catch (insertError: any) {
              // Extract expected columns from error message
              if (insertError.message) {
                schemaChecks.banking_subaccounts.errors.push(`Insert test: ${insertError.message}`);
              }
            }
          }
        }
      } catch (error: any) {
        schemaChecks.banking_subaccounts.errors.push(error.message);
      }

      // Check books table
      try {
        console.log("Checking books table...");
        const { data: booksData, error: booksError } = await supabase
          .from("books")
          .select("id, seller_id, title, seller_subaccount_code")
          .limit(1);
        
        if (booksError) {
          schemaChecks.books.errors.push(booksError.message);
          console.error("books error:", booksError);
          
          // Try without seller_subaccount_code
          const { data: booksData2, error: booksError2 } = await supabase
            .from("books")
            .select("id, seller_id, title")
            .limit(1);
          
          if (!booksError2) {
            schemaChecks.books.table_exists = true;
            schemaChecks.books.errors.push("seller_subaccount_code column missing");
            if (booksData2 && booksData2.length > 0) {
              schemaChecks.books.columns = Object.keys(booksData2[0]);
            }
          }
        } else {
          schemaChecks.books.table_exists = true;
          if (booksData && booksData.length > 0) {
            schemaChecks.books.columns = Object.keys(booksData[0]);
          }
        }
      } catch (error: any) {
        schemaChecks.books.errors.push(error.message);
      }

      console.log("📊 Schema check results:", schemaChecks);
      setResults(schemaChecks);
      
    } catch (error) {
      console.error("Schema check failed:", error);
      setResults({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          🔍 Database Schema Checker
        </CardTitle>
        <p className="text-sm text-gray-600">
          This component checks what columns actually exist in the database tables.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={checkSchema} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Checking Schema...
            </>
          ) : (
            "🔍 Check Database Schema"
          )}
        </Button>

        {results && !results.error && (
          <div className="space-y-4">
            {/* Banking Subaccounts Table */}
            <Alert className={results.banking_subaccounts.table_exists ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              {results.banking_subaccounts.table_exists ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription>
                <div className="font-medium mb-2">banking_subaccounts table</div>
                {results.banking_subaccounts.table_exists ? (
                  <div>
                    <div className="text-sm text-green-800 mb-2">✅ Table exists</div>
                    {results.banking_subaccounts.columns.length > 0 && (
                      <div>
                        <div className="text-sm font-medium mb-1">Available columns:</div>
                        <div className="text-xs bg-green-100 p-2 rounded">
                          {results.banking_subaccounts.columns.join(", ")}
                        </div>
                      </div>
                    )}
                    {results.banking_subaccounts.errors.length > 0 && (
                      <div className="mt-2">
                        <div className="text-sm font-medium mb-1">Issues:</div>
                        <div className="text-xs bg-yellow-100 p-2 rounded">
                          {results.banking_subaccounts.errors.join("; ")}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="text-sm text-red-800 mb-2">❌ Table not accessible</div>
                    <div className="text-xs bg-red-100 p-2 rounded">
                      {results.banking_subaccounts.errors.join("; ")}
                    </div>
                  </div>
                )}
              </AlertDescription>
            </Alert>

            {/* Books Table */}
            <Alert className={results.books.table_exists ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              {results.books.table_exists ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription>
                <div className="font-medium mb-2">books table</div>
                {results.books.table_exists ? (
                  <div>
                    <div className="text-sm text-green-800 mb-2">✅ Table exists</div>
                    {results.books.columns.length > 0 && (
                      <div>
                        <div className="text-sm font-medium mb-1">Available columns:</div>
                        <div className="text-xs bg-green-100 p-2 rounded">
                          {results.books.columns.join(", ")}
                        </div>
                        <div className="text-xs mt-1 text-gray-600">
                          seller_subaccount_code column: {results.books.columns.includes("seller_subaccount_code") ? "✅ EXISTS" : "❌ MISSING"}
                        </div>
                      </div>
                    )}
                    {results.books.errors.length > 0 && (
                      <div className="mt-2">
                        <div className="text-sm font-medium mb-1">Issues:</div>
                        <div className="text-xs bg-yellow-100 p-2 rounded">
                          {results.books.errors.join("; ")}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="text-sm text-red-800 mb-2">❌ Table not accessible</div>
                    <div className="text-xs bg-red-100 p-2 rounded">
                      {results.books.errors.join("; ")}
                    </div>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {results && results.error && (
          <Alert className="border-red-200 bg-red-50">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription>
              <div className="font-medium mb-2">❌ Schema Check Failed</div>
              <div className="text-xs bg-red-100 p-2 rounded">
                {results.error}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
          <div className="font-medium mb-1">What this checker does:</div>
          <ul className="space-y-1 text-xs">
            <li>• Checks if the banking_subaccounts and books tables exist</li>
            <li>• Lists all available columns in each table</li>
            <li>• Identifies missing columns that TypeScript expects</li>
            <li>• Helps debug schema mismatches between code and database</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default DatabaseSchemaChecker;

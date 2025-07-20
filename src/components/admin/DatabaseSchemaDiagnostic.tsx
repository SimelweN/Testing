import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database, RefreshCw, AlertTriangle } from "lucide-react";
import { getTableColumns, checkTableExists } from "@/utils/dbSchemaChecker";
import { supabase } from "@/integrations/supabase/client";

interface TableInfo {
  name: string;
  exists: boolean;
  columns: Array<{
    column_name: string;
    data_type: string;
    is_nullable: string;
  }>;
  sampleData?: any;
}

export default function DatabaseSchemaDiagnostic() {
  const [tableInfo, setTableInfo] = useState<TableInfo[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const tablesToCheck = [
    "study_resources",
    "study_tips",
    "books",
    "users",
    "orders",
  ];

  const runDiagnostic = async () => {
    setIsRunning(true);
    try {
      const results: TableInfo[] = [];

      for (const tableName of tablesToCheck) {
        const exists = await checkTableExists(tableName);
        const columns = exists ? await getTableColumns(tableName) : [];

        let sampleData = null;
        if (exists) {
          try {
            const { data } = await supabase
              .from(tableName)
              .select("*")
              .limit(1);
            sampleData = data?.[0] || null;
          } catch (error) {
            console.warn(
              `Could not fetch sample data for ${tableName}:`,
              error,
            );
          }
        }

        results.push({
          name: tableName,
          exists,
          columns,
          sampleData,
        });
      }

      setTableInfo(results);
    } catch (error) {
      console.error("Schema diagnostic failed:", error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Schema Diagnostic
          </CardTitle>
          <CardDescription>
            Check table schemas and column availability to debug database errors
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={runDiagnostic} disabled={isRunning} className="mb-4">
            {isRunning ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Checking Schema...
              </>
            ) : (
              <>
                <Database className="h-4 w-4 mr-2" />
                Run Schema Diagnostic
              </>
            )}
          </Button>

          {tableInfo.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Results</h3>
                <div className="text-sm text-muted-foreground">
                  {tableInfo.filter((t) => t.exists).length} /{" "}
                  {tableInfo.length} tables exist
                </div>
              </div>

              <div className="grid gap-4">
                {tableInfo.map((table, index) => (
                  <Card
                    key={index}
                    className={`border-l-4 ${table.exists ? "border-l-green-500" : "border-l-red-500"}`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          {table.exists ? "✅" : "❌"}
                          {table.name}
                        </CardTitle>
                        <Badge
                          variant={table.exists ? "default" : "destructive"}
                        >
                          {table.exists ? "EXISTS" : "NOT FOUND"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {table.exists && (
                        <>
                          <div className="text-sm">
                            <div className="font-medium text-muted-foreground mb-2">
                              Columns ({table.columns.length}):
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              {table.columns.map((col, colIndex) => (
                                <div
                                  key={colIndex}
                                  className="bg-muted rounded p-2 text-xs"
                                >
                                  <div className="font-mono font-medium">
                                    {col.column_name}
                                  </div>
                                  <div className="text-muted-foreground">
                                    {col.data_type}
                                  </div>
                                  {col.is_nullable === "YES" && (
                                    <div className="text-blue-600">
                                      nullable
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>

                          {table.sampleData && (
                            <details className="text-sm">
                              <summary className="font-medium text-muted-foreground cursor-pointer">
                                Sample Data
                              </summary>
                              <pre className="bg-muted rounded p-3 text-xs mt-2 overflow-auto">
                                {JSON.stringify(table.sampleData, null, 2)}
                              </pre>
                            </details>
                          )}
                        </>
                      )}

                      {!table.exists && (
                        <div className="text-sm text-red-600 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          Table does not exist. This may require database
                          migration.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

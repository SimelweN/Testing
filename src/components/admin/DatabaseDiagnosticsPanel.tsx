import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Database, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Loader2,
  RefreshCw 
} from "lucide-react";
import { 
  runComprehensiveDiagnostics, 
  testSpecificOrdersTable,
  debugOrdersError,
  type DatabaseDiagnosticReport,
  type TableDiagnostic 
} from "@/utils/databaseDiagnostics";

const DatabaseDiagnosticsPanel = () => {
  const [diagnostics, setDiagnostics] = useState<DatabaseDiagnosticReport | null>(null);
  const [ordersTest, setOrdersTest] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runDiagnostics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("🚀 Running database diagnostics from admin panel...");
      
      const [report, ordersSpecific] = await Promise.all([
        runComprehensiveDiagnostics(),
        testSpecificOrdersTable()
      ]);
      
      setDiagnostics(report);
      setOrdersTest(ordersSpecific);
      
    } catch (err) {
      console.error("Diagnostics failed:", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const testOrdersError = async () => {
    setLoading(true);
    try {
      // Simulate the orders error that's happening
      const mockError = { message: "Test error", code: "TEST" };
      const result = await debugOrdersError(mockError);
      console.log("🔍 Orders error debug result:", result);
      alert("Check console for detailed orders error debugging results");
    } catch (err) {
      console.error("Orders error test failed:", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (diagnostic: TableDiagnostic) => {
    if (diagnostic.accessible) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    } else if (diagnostic.exists) {
      return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    } else {
      return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusText = (diagnostic: TableDiagnostic) => {
    if (diagnostic.accessible) {
      return "Accessible";
    } else if (diagnostic.exists) {
      return "Exists (No Access)";
    } else {
      return "Missing";
    }
  };

  const getStatusColor = (diagnostic: TableDiagnostic) => {
    if (diagnostic.accessible) {
      return "bg-green-100 text-green-800";
    } else if (diagnostic.exists) {
      return "bg-yellow-100 text-yellow-800";
    } else {
      return "bg-red-100 text-red-800";
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Database Diagnostics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={runDiagnostics} 
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Run Full Diagnostics
            </Button>
            
            <Button 
              onClick={testOrdersError} 
              disabled={loading}
              variant="outline"
            >
              Test Orders Error
            </Button>
          </div>

          {error && (
            <Alert>
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {diagnostics && (
        <Card>
          <CardHeader>
            <CardTitle>Database Report</CardTitle>
            <p className="text-sm text-gray-600">
              Generated: {new Date(diagnostics.timestamp).toLocaleString()}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{diagnostics.totalTables}</div>
                <div className="text-sm text-gray-600">Total Tables</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {diagnostics.accessibleTables}
                </div>
                <div className="text-sm text-gray-600">Accessible</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {diagnostics.errors.length}
                </div>
                <div className="text-sm text-gray-600">Errors</div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-semibold mb-3">Table Status</h4>
              <div className="space-y-2">
                {diagnostics.tables.map((table) => (
                  <div 
                    key={table.name} 
                    className="flex items-center justify-between p-3 border rounded"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(table)}
                      <span className="font-medium">{table.name}</span>
                      {table.recordCount !== undefined && (
                        <span className="text-sm text-gray-500">
                          ({table.recordCount} records)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(table)}>
                        {getStatusText(table)}
                      </Badge>
                      {table.columns && (
                        <span className="text-xs text-gray-500">
                          {table.columns.length} cols
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {diagnostics.errors.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3 text-red-600">Errors</h4>
                <div className="space-y-1">
                  {diagnostics.errors.map((error, index) => (
                    <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                      {error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {diagnostics.recommendations.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3 text-blue-600">Recommendations</h4>
                <div className="space-y-1">
                  {diagnostics.recommendations.map((rec, index) => (
                    <div key={index} className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                      • {rec}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {ordersTest && (
        <Card>
          <CardHeader>
            <CardTitle>Orders Table Specific Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h5 className="font-medium mb-2">Basic Access</h5>
                <div className={`p-2 rounded text-sm ${
                  ordersTest.tests.basicAccess?.success 
                    ? 'bg-green-50 text-green-700' 
                    : 'bg-red-50 text-red-700'
                }`}>
                  {ordersTest.tests.basicAccess?.success ? '✅ Success' : '❌ Failed'}
                  {ordersTest.tests.basicAccess?.error && (
                    <div className="mt-1 text-xs">{ordersTest.tests.basicAccess.error}</div>
                  )}
                </div>
              </div>
              
              <div>
                <h5 className="font-medium mb-2">Schema Test</h5>
                <div className={`p-2 rounded text-sm ${
                  ordersTest.tests.schemaTest?.success 
                    ? 'bg-green-50 text-green-700' 
                    : 'bg-red-50 text-red-700'
                }`}>
                  {ordersTest.tests.schemaTest?.success ? '✅ Success' : '❌ Failed'}
                  {ordersTest.tests.schemaTest?.error && (
                    <div className="mt-1 text-xs">{ordersTest.tests.schemaTest.error}</div>
                  )}
                </div>
              </div>
              
              <div>
                <h5 className="font-medium mb-2">Permissions</h5>
                <div className={`p-2 rounded text-sm ${
                  ordersTest.tests.permissionTest?.success 
                    ? 'bg-green-50 text-green-700' 
                    : 'bg-red-50 text-red-700'
                }`}>
                  {ordersTest.tests.permissionTest?.success ? '✅ Success' : '❌ Failed'}
                  {ordersTest.tests.permissionTest?.error && (
                    <div className="mt-1 text-xs">{ordersTest.tests.permissionTest.error}</div>
                  )}
                </div>
              </div>
              
              <div>
                <h5 className="font-medium mb-2">Data & Joins</h5>
                <div className={`p-2 rounded text-sm ${
                  ordersTest.tests.dataTest?.success 
                    ? 'bg-green-50 text-green-700' 
                    : 'bg-red-50 text-red-700'
                }`}>
                  {ordersTest.tests.dataTest?.success ? '✅ Success' : '❌ Failed'}
                  {ordersTest.tests.dataTest?.error && (
                    <div className="mt-1 text-xs">{ordersTest.tests.dataTest.error}</div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DatabaseDiagnosticsPanel;

/**
 * Comprehensive database diagnostics to debug table and schema issues
 */
import { supabase } from "@/integrations/supabase/client";

export interface TableDiagnostic {
  name: string;
  exists: boolean;
  accessible: boolean;
  recordCount?: number;
  columns?: string[];
  error?: string;
  sampleData?: any;
}

export interface DatabaseDiagnosticReport {
  timestamp: string;
  tables: TableDiagnostic[];
  totalTables: number;
  accessibleTables: number;
  errors: string[];
  recommendations: string[];
}

const CRITICAL_TABLES = [
  'orders',
  'books', 
  'profiles',
  'banking_subaccounts',
  'payment_transactions',
  'refund_transactions',
  'sale_commitments',
  'notifications'
];

export async function checkTableExists(tableName: string): Promise<TableDiagnostic> {
  console.log(`🔍 Checking table: ${tableName}`);
  
  const diagnostic: TableDiagnostic = {
    name: tableName,
    exists: false,
    accessible: false
  };

  try {
    // First, try a simple count query to check if table exists and is accessible
    const { data, error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    if (error) {
      diagnostic.error = error.message;
      
      // Check for specific error types
      if (error.message.includes('does not exist') || error.code === '42P01') {
        diagnostic.exists = false;
        diagnostic.accessible = false;
      } else if (error.message.includes('permission') || error.code === '42501') {
        diagnostic.exists = true; // Table exists but no permissions
        diagnostic.accessible = false;
      } else {
        diagnostic.exists = true; // Table probably exists but other error
        diagnostic.accessible = false;
      }
    } else {
      diagnostic.exists = true;
      diagnostic.accessible = true;
      diagnostic.recordCount = count || 0;
    }

    // If accessible, try to get column information
    if (diagnostic.accessible) {
      try {
        const { data: sampleData } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (sampleData && sampleData.length > 0) {
          diagnostic.columns = Object.keys(sampleData[0]);
          diagnostic.sampleData = sampleData[0];
        } else {
          // No data, but try to get columns from an empty result
          const { data: emptyResult } = await supabase
            .from(tableName)
            .select('*')
            .limit(0);
          
          // For empty tables, we won't get column info this way
          diagnostic.columns = ['Unable to determine - table is empty'];
        }
      } catch (columnError) {
        diagnostic.columns = ['Error getting columns'];
      }
    }

  } catch (unexpectedError) {
    diagnostic.error = unexpectedError instanceof Error ? unexpectedError.message : String(unexpectedError);
  }

  return diagnostic;
}

export async function runComprehensiveDiagnostics(): Promise<DatabaseDiagnosticReport> {
  console.log('🚀 Running comprehensive database diagnostics...');
  
  const report: DatabaseDiagnosticReport = {
    timestamp: new Date().toISOString(),
    tables: [],
    totalTables: CRITICAL_TABLES.length,
    accessibleTables: 0,
    errors: [],
    recommendations: []
  };

  // Check each critical table
  for (const tableName of CRITICAL_TABLES) {
    try {
      const diagnostic = await checkTableExists(tableName);
      report.tables.push(diagnostic);
      
      if (diagnostic.accessible) {
        report.accessibleTables++;
      }
      
      if (diagnostic.error) {
        report.errors.push(`${tableName}: ${diagnostic.error}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      report.errors.push(`${tableName}: Unexpected error - ${errorMsg}`);
      
      report.tables.push({
        name: tableName,
        exists: false,
        accessible: false,
        error: errorMsg
      });
    }
  }

  // Generate recommendations
  const missingTables = report.tables.filter(t => !t.exists);
  const inaccessibleTables = report.tables.filter(t => t.exists && !t.accessible);

  if (missingTables.length > 0) {
    report.recommendations.push(
      `Missing tables (${missingTables.length}): ${missingTables.map(t => t.name).join(', ')}`
    );
    report.recommendations.push(
      'Run database migrations to create missing tables'
    );
  }

  if (inaccessibleTables.length > 0) {
    report.recommendations.push(
      `Permission issues (${inaccessibleTables.length}): ${inaccessibleTables.map(t => t.name).join(', ')}`
    );
    report.recommendations.push(
      'Check Row Level Security (RLS) policies and user permissions'
    );
  }

  if (report.accessibleTables === 0) {
    report.recommendations.push(
      'CRITICAL: No tables are accessible. Check database connection and authentication.'
    );
  }

  console.log('📋 Database diagnostic report:', report);
  return report;
}

export async function testSpecificOrdersTable(): Promise<any> {
  console.log('🔍 Running specific orders table diagnostics...');
  
  const tests = {
    basicAccess: null as any,
    schemaTest: null as any,
    permissionTest: null as any,
    dataTest: null as any
  };

  // Test 1: Basic access
  try {
    const { data, error, count } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });
    
    tests.basicAccess = {
      success: !error,
      error: error?.message,
      recordCount: count
    };
  } catch (error) {
    tests.basicAccess = {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }

  // Test 2: Schema test with expected columns
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        buyer_email,
        seller_id,
        amount,
        paystack_ref,
        status,
        created_at
      `)
      .limit(1);
    
    tests.schemaTest = {
      success: !error,
      error: error?.message,
      hasData: !!data?.length
    };
  } catch (error) {
    tests.schemaTest = {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }

  // Test 3: Permission test (try to insert/update)
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('id')
      .limit(1);
    
    tests.permissionTest = {
      success: !error,
      error: error?.message,
      canRead: !error
    };
  } catch (error) {
    tests.permissionTest = {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      canRead: false
    };
  }

  // Test 4: Data test with actual query like OrderManagementView
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        seller:profiles!seller_id(id, name, email)
      `)
      .limit(1);
    
    tests.dataTest = {
      success: !error,
      error: error?.message,
      canJoinProfiles: !error,
      sampleData: data?.[0]
    };
  } catch (error) {
    tests.dataTest = {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      canJoinProfiles: false
    };
  }

  const result = {
    timestamp: new Date().toISOString(),
    tests,
    summary: {
      tableExists: tests.basicAccess?.success,
      schemaValid: tests.schemaTest?.success,
      hasPermissions: tests.permissionTest?.success,
      canJoinData: tests.dataTest?.success
    }
  };

  console.log('📊 Orders table test results:', result);
  return result;
}

// Function to be called from components when errors occur
export async function debugOrdersError(originalError: any) {
  console.log('🔍 Debugging orders error:', originalError);
  
  const diagnostics = await testSpecificOrdersTable();
  const fullReport = await runComprehensiveDiagnostics();
  
  return {
    originalError,
    ordersSpecificTests: diagnostics,
    fullDatabaseReport: fullReport,
    timestamp: new Date().toISOString()
  };
}

/**
 * Utility to test if orders table exists and is accessible
 */
import { supabase } from "@/integrations/supabase/client";

export async function testOrdersTableExistence() {
  try {
    console.log("🔍 Testing orders table existence...");
    
    // Test basic table access
    const { data, error, count } = await supabase
      .from("orders")
      .select("id", { count: "exact" })
      .limit(1);

    if (error) {
      console.error("❌ Orders table error:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      return {
        exists: false,
        error: error.message,
        details: error
      };
    }

    console.log("✅ Orders table exists and is accessible");
    console.log("📊 Orders table info:", { 
      accessible: true, 
      recordCount: count,
      sampleData: data 
    });

    return {
      exists: true,
      recordCount: count,
      sampleData: data
    };

  } catch (error) {
    console.error("❌ Unexpected error testing orders table:", error);
    return {
      exists: false,
      error: error instanceof Error ? error.message : String(error),
      details: error
    };
  }
}

export async function testOrdersTableSchema() {
  try {
    console.log("🔍 Testing orders table schema...");
    
    // Test with all expected columns
    const { data, error } = await supabase
      .from("orders")
      .select(`
        id,
        buyer_email,
        seller_id,
        amount,
        paystack_ref,
        status,
        items,
        shipping_address,
        delivery_data,
        metadata,
        paid_at,
        payment_held,
        created_at,
        updated_at
      `)
      .limit(1);

    if (error) {
      console.error("❌ Orders table schema error:", {
        message: error.message,
        code: error.code,
        details: error.details
      });
      return {
        schemaValid: false,
        error: error.message,
        details: error
      };
    }

    console.log("✅ Orders table schema is valid");
    return {
      schemaValid: true,
      sampleRecord: data?.[0] || null
    };

  } catch (error) {
    console.error("❌ Unexpected error testing orders schema:", error);
    return {
      schemaValid: false,
      error: error instanceof Error ? error.message : String(error),
      details: error
    };
  }
}

// Function to run both tests
export async function runOrdersTableDiagnostics() {
  console.log("🚀 Running orders table diagnostics...");
  
  const existenceResult = await testOrdersTableExistence();
  const schemaResult = await testOrdersTableSchema();
  
  const report = {
    timestamp: new Date().toISOString(),
    tableExists: existenceResult.exists,
    schemaValid: schemaResult.schemaValid,
    recordCount: existenceResult.recordCount,
    errors: []
  };

  if (!existenceResult.exists) {
    report.errors.push(`Table existence error: ${existenceResult.error}`);
  }

  if (!schemaResult.schemaValid) {
    report.errors.push(`Schema error: ${schemaResult.error}`);
  }

  console.log("📋 Orders table diagnostic report:", report);
  return report;
}

import { supabase } from "@/integrations/supabase/client";

export interface TableColumn {
  column_name: string;
  data_type: string;
  is_nullable: string;
}

export async function getTableColumns(
  tableName: string,
): Promise<TableColumn[]> {
  try {
    const { data, error } = await supabase
      .from("information_schema.columns")
      .select("column_name, data_type, is_nullable")
      .eq("table_name", tableName)
      .eq("table_schema", "public");

    if (error) {
      console.warn(`Could not fetch schema for table ${tableName}:`, error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.warn(`Schema check failed for table ${tableName}:`, error);
    return [];
  }
}

export async function checkTableExists(tableName: string): Promise<boolean> {
  try {
    const { error } = await supabase.from(tableName).select("*").limit(1);
    return !error || error.code !== "42P01";
  } catch {
    return false;
  }
}

export async function getAvailableColumns(
  tableName: string,
): Promise<string[]> {
  const columns = await getTableColumns(tableName);
  return columns.map((col) => col.column_name);
}

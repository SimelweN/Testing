import { supabase } from "@/integrations/supabase/client";

/**
 * Diagnostic function to check what columns exist in the study resources tables
 * This helps debug column mismatch errors (42703)
 */
export const checkTableSchema = async () => {
  console.log("=== Database Schema Diagnostic ===");

  try {
    // Test study_resources table
    console.log("\n1. Testing study_resources table...");
    const { data: resourcesData, error: resourcesError } = await supabase
      .from("study_resources")
      .select("*")
      .limit(1);

    if (resourcesError) {
      console.error("study_resources error:", {
        code: resourcesError.code,
        message: resourcesError.message,
        details: resourcesError.details,
        hint: resourcesError.hint,
      });
    } else {
      console.log("✅ study_resources table accessible");
      if (resourcesData && resourcesData.length > 0) {
        console.log("Available columns:", Object.keys(resourcesData[0]));
      } else {
        console.log("Table exists but is empty");
      }
    }

    // Test study_tips table
    console.log("\n2. Testing study_tips table...");
    const { data: tipsData, error: tipsError } = await supabase
      .from("study_tips")
      .select("*")
      .limit(1);

    if (tipsError) {
      console.error("study_tips error:", {
        code: tipsError.code,
        message: tipsError.message,
        details: tipsError.details,
        hint: tipsError.hint,
      });
    } else {
      console.log("✅ study_tips table accessible");
      if (tipsData && tipsData.length > 0) {
        console.log("Available columns:", Object.keys(tipsData[0]));
      } else {
        console.log("Table exists but is empty");
      }
    }

    // Test minimal queries to identify problematic columns
    console.log("\n3. Testing basic columns...");

    const basicColumns = ["id", "title", "created_at"];
    for (const column of basicColumns) {
      try {
        const { error } = await supabase
          .from("study_resources")
          .select(column)
          .limit(1);

        if (error) {
          console.error(`❌ Column '${column}' issue:`, error.message);
        } else {
          console.log(`✅ Column '${column}' works`);
        }
      } catch (e) {
        console.error(`❌ Column '${column}' failed:`, e);
      }
    }
  } catch (error) {
    console.error("Diagnostic failed:", error);
  }

  console.log("\n=== Diagnostic Complete ===");
};

/**
 * Expected columns for study_resources table
 */
export const EXPECTED_STUDY_RESOURCES_COLUMNS = [
  "id",
  "title",
  "description",
  "type",
  "category",
  "difficulty",
  "url",
  "rating",
  "provider",
  "duration",
  "tags",
  "download_url",
  "is_active",
  "is_featured",
  "is_sponsored",
  "sponsor_name",
  "sponsor_logo",
  "sponsor_url",
  "sponsor_cta",
  "created_at",
  "updated_at",
];

/**
 * Expected columns for study_tips table
 */
export const EXPECTED_STUDY_TIPS_COLUMNS = [
  "id",
  "title",
  "content",
  "category",
  "difficulty",
  "tags",
  "is_active",
  "author",
  "estimated_time",
  "effectiveness",
  "is_sponsored",
  "sponsor_name",
  "sponsor_logo",
  "sponsor_url",
  "sponsor_cta",
  "created_at",
  "updated_at",
];

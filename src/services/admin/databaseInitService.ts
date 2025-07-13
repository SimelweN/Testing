import { supabase } from "@/integrations/supabase/client";
import { logError } from "@/utils/errorUtils";

/**
 * Database initialization service to create missing tables
 */
export class DatabaseInitService {
  /**
   * Check if a specific table exists
   */
  static async checkTableExists(tableName: string): Promise<boolean> {
    try {
      const { error } = await supabase.from(tableName).select("*").limit(1);

      return !error || error.code !== "42P01";
    } catch (error) {
      return false;
    }
  }

  /**
   * Create study_resources table if it doesn't exist
   * Since we can't execute raw SQL, we'll try to create a sample record to trigger table creation
   */
  static async createStudyResourcesTable(): Promise<boolean> {
    try {
      console.log("Attempting to access/create study_resources table...");

      // Try to insert a test record - this might create the table if it has auto-creation enabled
      const { error } = await supabase.from("study_resources").insert([
        {
          title: "Database Test Resource",
          description:
            "This is a test resource to verify database connectivity",
          type: "pdf",
          category: "System",
          difficulty: "Beginner",
          tags: ["test"],
          is_active: false, // Keep it inactive so it doesn't show up
        },
      ]);

      if (error) {
        logError("DatabaseInitService.createStudyResourcesTable", error);

        // If error is because table doesn't exist, we can't create it from the client
        if (error.code === "42P01") {
          console.warn(
            "Cannot create study_resources table from client - needs database admin access",
          );
          return false;
        }

        return false;
      }

      console.log("Study resources table is accessible");
      return true;
    } catch (error) {
      logError("DatabaseInitService.createStudyResourcesTable", error);
      return false;
    }
  }

  /**
   * Create study_tips table if it doesn't exist
   */
  static async createStudyTipsTable(): Promise<boolean> {
    try {
      console.log("Attempting to access/create study_tips table...");

      // Try to insert a test record
      const { error } = await supabase.from("study_tips").insert([
        {
          title: "Database Test Tip",
          content: "This is a test tip to verify database connectivity",
          category: "System",
          difficulty: "Beginner",
          tags: ["test"],
          is_active: false, // Keep it inactive so it doesn't show up
        },
      ]);

      if (error) {
        logError("DatabaseInitService.createStudyTipsTable", error);

        // If error is because table doesn't exist, we can't create it from the client
        if (error.code === "42P01") {
          console.warn(
            "Cannot create study_tips table from client - needs database admin access",
          );
          return false;
        }

        return false;
      }

      console.log("Study tips table is accessible");
      return true;
    } catch (error) {
      logError("DatabaseInitService.createStudyTipsTable", error);
      return false;
    }
  }

  /**
   * Initialize all required database tables
   */
  static async initializeDatabase(): Promise<{
    success: boolean;
    message: string;
    tablesCreated: string[];
    errors: string[];
  }> {
    const tablesCreated: string[] = [];
    const errors: string[] = [];

    try {
      console.log("Initializing database tables...");

      // Check and create study_resources table
      const resourcesExists = await this.checkTableExists("study_resources");
      if (!resourcesExists) {
        const created = await this.createStudyResourcesTable();
        if (created) {
          tablesCreated.push("study_resources");
        } else {
          errors.push("Failed to create study_resources table");
        }
      } else {
        console.log("study_resources table already exists");
      }

      // Check and create study_tips table
      const tipsExists = await this.checkTableExists("study_tips");
      if (!tipsExists) {
        const created = await this.createStudyTipsTable();
        if (created) {
          tablesCreated.push("study_tips");
        } else {
          errors.push("Failed to create study_tips table");
        }
      } else {
        console.log("study_tips table already exists");
      }

      const success = errors.length === 0;
      const message = success
        ? `Database initialization completed. ${tablesCreated.length > 0 ? `Created tables: ${tablesCreated.join(", ")}` : "All tables already exist."}`
        : `Database initialization completed with errors: ${errors.join(", ")}`;

      return {
        success,
        message,
        tablesCreated,
        errors,
      };
    } catch (error) {
      logError("DatabaseInitService.initializeDatabase", error);
      return {
        success: false,
        message: `Database initialization failed: ${error instanceof Error ? error.message : String(error)}`,
        tablesCreated,
        errors: [error instanceof Error ? error.message : String(error)],
      };
    }
  }

  /**
   * Get database status information
   */
  static async getDatabaseStatus(): Promise<{
    studyResourcesExists: boolean;
    studyTipsExists: boolean;
    allTablesExist: boolean;
    missingTables: string[];
  }> {
    try {
      const [studyResourcesExists, studyTipsExists] = await Promise.all([
        this.checkTableExists("study_resources"),
        this.checkTableExists("study_tips"),
      ]);

      const missingTables: string[] = [];
      if (!studyResourcesExists) missingTables.push("study_resources");
      if (!studyTipsExists) missingTables.push("study_tips");

      return {
        studyResourcesExists,
        studyTipsExists,
        allTablesExist: missingTables.length === 0,
        missingTables,
      };
    } catch (error) {
      logError("DatabaseInitService.getDatabaseStatus", error);
      return {
        studyResourcesExists: false,
        studyTipsExists: false,
        allTablesExist: false,
        missingTables: ["study_resources", "study_tips"],
      };
    }
  }
}

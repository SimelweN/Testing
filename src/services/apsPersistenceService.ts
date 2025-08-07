import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { UserAPSProfile } from "@/hooks/useAPSAwareCourseAssignment";

// 📦 PRIMARY STORAGE: localStorage with key "userAPSProfile"
const APS_STORAGE_KEY = "userAPSProfile";

/**
 * Enhanced APS Persistence Service
 * Dual Storage Strategy: localStorage (primary) + database (backup for authenticated users)
 */

// ✅ PROFILE STRUCTURE VALIDATION
function isValidAPSProfile(profile: any): profile is UserAPSProfile {
  if (!profile || typeof profile !== "object") return false;

  const required = ["subjects", "totalAPS", "lastUpdated"];
  for (const field of required) {
    if (!(field in profile)) {
      console.warn(`Missing required field: ${field}`);
      return false;
    }
  }

  return (
    Array.isArray(profile.subjects) &&
    typeof profile.totalAPS === "number" &&
    typeof profile.lastUpdated === "string"
  );
}

// 🔄 MIGRATION & RECOVERY
export function migrateSessionToLocal(): boolean {
  try {
    const sessionProfile = sessionStorage.getItem(APS_STORAGE_KEY);
    const localProfile = localStorage.getItem(APS_STORAGE_KEY);

    // If session has data but local doesn't, migrate it
    if (sessionProfile && !localProfile) {
      localStorage.setItem(APS_STORAGE_KEY, sessionProfile);
      sessionStorage.removeItem(APS_STORAGE_KEY);
      console.log(
        "✅ Migrated APS profile from sessionStorage to localStorage",
      );
      return true;
    }
    return false;
  } catch (error) {
    console.warn("❌ Migration failed:", error);
    return false;
  }
}

// 💾 SAVE FUNCTION - Auto-saves with timestamp
export async function saveAPSProfile(
  profile: UserAPSProfile,
  user?: User,
): Promise<{ success: boolean; source?: string; error?: string }> {
  try {
    // Add timestamp for tracking when saved
    const profileWithTimestamp = {
      ...profile,
      lastUpdated: new Date().toISOString(),
      savedAt: Date.now(),
    };

    // 1️⃣ ALWAYS SAVE TO LOCALSTORAGE FIRST (immediate persistence)
    const profileJson = JSON.stringify(profileWithTimestamp);
    localStorage.setItem(APS_STORAGE_KEY, profileJson);
    console.log("💾 [APSPersistence] Saving to localStorage with key:", APS_STORAGE_KEY);
    console.log("💾 [APSPersistence] Profile data size:", profileJson.length, "characters");

    // ✅ VERIFY SAVE SUCCESS
    const verification = localStorage.getItem(APS_STORAGE_KEY);
    const savedSuccessfully = !!verification;
    console.log("🔍 [APSPersistence] Profile saved and verified:", savedSuccessfully);
    console.log("🔍 [APSPersistence] Stored data:", verification ? "EXISTS" : "MISSING");

    if (user) {
      try {
        // 2️⃣ ALSO SAVE TO DATABASE (cloud backup)
        const { data, error } = await supabase.rpc("save_user_aps_profile", {
          profile_data: profileWithTimestamp,
          user_id: user.id,
        });

        if (error) {
          console.warn(
            "⚠️ Database save failed, localStorage still works:",
            error,
          );
          return { success: true, source: "localStorage" };
        }

        return { success: true, source: "database" };
      } catch (dbError) {
        console.warn("⚠️ Database operation failed:", dbError);
        return { success: true, source: "localStorage" };
      }
    }

    // 3️⃣ NON-AUTHENTICATED USERS: localStorage only
    return { success: true, source: "localStorage" };
  } catch (error) {
    console.error("❌ Failed to save APS profile:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// 📂 LOAD PROFILE FUNCTION
export function loadAPSProfile(): UserAPSProfile | null {
  try {
    // 🔄 Try migration first
    migrateSessionToLocal();

    const stored = localStorage.getItem(APS_STORAGE_KEY);
    if (!stored) {
      console.log("📂 No APS profile found in localStorage");
      return null;
    }

    const profile = JSON.parse(stored);

    // ✅ Validate profile structure
    if (!isValidAPSProfile(profile)) {
      console.warn("❌ Invalid APS profile structure, clearing corrupted data");
      localStorage.removeItem(APS_STORAGE_KEY);
      return null;
    }

    console.log("📂 APS profile loaded from localStorage:", {
      subjects: profile.subjects?.length || 0,
      totalAPS: profile.totalAPS,
      lastUpdated: profile.lastUpdated,
    });

    return profile;
  } catch (error) {
    console.error("❌ Error loading APS profile:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    // Clear corrupted data
    localStorage.removeItem(APS_STORAGE_KEY);
    return null;
  }
}

// 🗑️ CLEAR FUNCTION - Only triggered by user action
export function clearAPSProfile(): boolean {
  try {
    console.log("🗑️ [APSPersistence] Starting APS profile clear from localStorage");

    // Store initial state for debugging
    const beforeClear = localStorage.getItem(APS_STORAGE_KEY);
    console.log("🗑️ [APSPersistence] Profile before clear:", beforeClear ? "EXISTS" : "NONE");

    // Clear ALL APS-related storage
    localStorage.removeItem(APS_STORAGE_KEY);
    localStorage.removeItem("apsSearchResults");
    localStorage.removeItem("apsProfileBackup");
    localStorage.removeItem("reBooked-aps-profile"); // Legacy key
    localStorage.removeItem("reBooked-aps-search-results"); // Legacy key
    localStorage.removeItem("rebookedMarketplace-aps-profile"); // Another legacy key
    sessionStorage.removeItem(APS_STORAGE_KEY);
    sessionStorage.removeItem("apsSearchResults");

    // Verify the clear worked
    const afterClear = localStorage.getItem(APS_STORAGE_KEY);
    console.log("🗑️ [APSPersistence] Profile after clear:", afterClear ? "STILL EXISTS" : "CLEARED");

    // 📡 TRIGGER GLOBAL CLEAR EVENT (for other components)
    window.dispatchEvent(new CustomEvent("apsProfileCleared"));
    console.log("🗑️ [APSPersistence] Dispatched apsProfileCleared event");

    const success = afterClear === null;
    console.log(success ? "✅ [APSPersistence] APS Profile cleared successfully" : "❌ [APSPersistence] Clear failed - data still exists");
    return success;
  } catch (error) {
    console.error("❌ [APSPersistence] Failed to clear APS profile:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return false;
  }
}

// 🏛️ FOR AUTHENTICATED USERS: Database + localStorage
export async function loadAPSProfileFromDatabase(
  user: User,
): Promise<UserAPSProfile | null> {
  try {
    const { data, error } = await supabase.rpc("get_user_aps_profile", {
      user_id: user.id,
    });

    if (error || !data) {
      console.log("📂 No database profile found, using localStorage");
      return loadAPSProfile();
    }

    // Validate and save to localStorage for faster future access
    if (isValidAPSProfile(data)) {
      localStorage.setItem(APS_STORAGE_KEY, JSON.stringify(data));
      return data;
    }

    return loadAPSProfile();
  } catch (error) {
    console.warn(
      "❌ Database load failed, falling back to localStorage:",
      error,
    );
    return loadAPSProfile();
  }
}

// 🔄 BACKUP CREATION
export function createAPSBackup(): boolean {
  try {
    const profile = loadAPSProfile();
    if (profile) {
      const backup = {
        ...profile,
        backupCreatedAt: new Date().toISOString(),
      };
      localStorage.setItem("apsProfileBackup", JSON.stringify(backup));
      console.log("💾 APS backup created");
      return true;
    }
    return false;
  } catch (error) {
    console.error("❌ Failed to create backup:", error);
    return false;
  }
}

// 🔄 RESTORE FROM BACKUP
export function restoreAPSBackup(): UserAPSProfile | null {
  try {
    const backup = localStorage.getItem("apsProfileBackup");
    if (backup) {
      const profile = JSON.parse(backup);
      if (isValidAPSProfile(profile)) {
        localStorage.setItem(APS_STORAGE_KEY, JSON.stringify(profile));
        console.log("🔄 APS profile restored from backup");
        return profile;
      }
    }
    return null;
  } catch (error) {
    console.error("❌ Failed to restore backup:", error);
    return null;
  }
}

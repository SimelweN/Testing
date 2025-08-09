import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { APSSubject } from "@/types/university";
import { calculateAPS, validateAPSSubjects } from "@/utils/apsCalculation";
import {
  saveAPSProfile,
  loadAPSProfile,
  clearAPSProfile as clearAPSProfileAsync,
  clearAPSProfileSimple,
  createAPSBackup,
  loadAPSProfileFromDatabase,
} from "@/services/apsPersistenceService";

// 📦 PRIMARY STORAGE: localStorage with key "userAPSProfile"
const APS_STORAGE_KEY = "userAPSProfile";

export interface UserAPSProfile {
  subjects: APSSubject[];
  totalAPS: number;
  lastUpdated: string;
  savedAt?: number;
  isValid?: boolean;
  validationErrors?: string[];
  universitySpecificScores?: import("@/types/university").UniversityAPSResult[];
}

/**
 * Enhanced APS Storage Hook with localStorage Primary Storage
 * Features:
 * - Auto-save on changes
 * - Cross-tab synchronization
 * - Browser restart persistence
 * - Auto-recovery and validation
 */
export function useEnhancedAPSStorage() {
  const { user } = useAuth();
  const [userProfile, setUserProfileState] = useState<UserAPSProfile | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 💾 SAVE FUNCTION - Auto-saves with timestamp
  const saveProfile = useCallback(
    async (profile: UserAPSProfile) => {
      try {
        // Add timestamp for tracking when saved
        const profileWithTimestamp = {
          ...profile,
          lastUpdated: new Date().toISOString(),
          savedAt: Date.now(),
        };

        // 🔄 SAVE TO LOCALSTORAGE (PERSISTS UNTIL MANUALLY CLEARED)
        localStorage.setItem(
          APS_STORAGE_KEY,
          JSON.stringify(profileWithTimestamp),
        );

        // ✅ VERIFY SAVE SUCCESS
        const verification = localStorage.getItem(APS_STORAGE_KEY);
        console.log("🔍 Profile saved and verified:", !!verification);

        // Update state
        setUserProfileState(profileWithTimestamp);

        // Also save to database if user is authenticated
        if (user) {
          try {
            await saveAPSProfile(profileWithTimestamp, user);
          } catch (dbError) {
            console.warn(
              "Database save failed, localStorage still works:",
              dbError,
            );
          }
        }

        return true;
      } catch (error) {
        console.error("❌ Failed to save APS profile:", error);
        setError("Failed to save profile");
        return false;
      }
    },
    [user],
  );

  // 📂 LOAD PROFILE FUNCTION
  const loadProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log("📂 Loading APS profile...");

      let profile: UserAPSProfile | null = null;

      // Try database first if user is authenticated
      if (user) {
        profile = await loadAPSProfileFromDatabase(user);
      }

      // Fallback to localStorage
      if (!profile) {
        profile = loadAPSProfile();
      }

      setUserProfileState(profile);
      console.log("📂 APS profile loaded:", profile ? "✅" : "❌");

      return profile;
    } catch (error) {
      console.error("❌ Error loading profile:", error);
      setError("Failed to load profile");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // �� LOAD PROFILE ON MOUNT - Runs automatically when app starts
  useEffect(() => {
    console.log("🚀 Initializing APS localStorage hook...");
    loadProfile();

    // 📡 LISTEN FOR CHANGES FROM OTHER TABS
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === APS_STORAGE_KEY) {
        console.log("📡 localStorage changed in another tab, reloading...");
        loadProfile();
      }
    };

    // 📡 LISTEN FOR CUSTOM CLEAR EVENTS
    const handleProfileCleared = () => {
      console.log("📡 APS profile cleared event received");
      setUserProfileState(null);
      setError(null);
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("apsProfileCleared", handleProfileCleared);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("apsProfileCleared", handleProfileCleared);
    };
  }, [loadProfile]);

  // 🔄 AUTO-SAVE WHENEVER USER UPDATES SUBJECTS
  const updateUserSubjects = useCallback(
    async (subjects: APSSubject[]) => {
      try {
        setIsLoading(true);
        setError(null);

        // Validate subjects
        const validation = validateAPSSubjects(subjects);

        // Calculate APS from new subjects
        const apsCalculation = calculateAPS(subjects);
        const totalAPS = apsCalculation.totalScore || 0;

        // Create updated profile
        const profile: UserAPSProfile = {
          subjects,
          totalAPS,
          lastUpdated: new Date().toISOString(),
          isValid: validation.isValid,
          validationErrors: validation.errors,
          universitySpecificScores:
            apsCalculation.universitySpecificScores || [],
        };

        // 💾 AUTO-SAVE TO LOCALSTORAGE (PERSISTENT!)
        const success = await saveProfile(profile);
        console.log("📊 [DEBUG] APS profile auto-saved:", success);
        console.log("📊 [DEBUG] Profile being saved:", profile);

        // Verify it was actually saved
        const verification = localStorage.getItem("userAPSProfile");
        console.log(
          "📊 [DEBUG] localStorage after save:",
          verification ? "DATA FOUND" : "NO DATA",
        );

        return success;
      } catch (error) {
        console.error("❌ Error updating subjects:", error);
        setError("Failed to update subjects");
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [saveProfile],
  );

  // 🗑️ CLEAR FUNCTION - Only triggered by user action
  const clearUserProfile = useCallback(async () => {
    try {
      console.log("🗑️ [EnhancedAPSStorage] Starting to clear APS profile from localStorage");
      console.log("���️ [DEBUG] Current userProfile state:", userProfile);

      const success = clearAPSProfileSimple();
      console.log("🗑️ [DEBUG] clearAPSProfileSimple returned:", success);

      if (success) {
        setUserProfileState(null);
        setError(null);
        console.log(
          "✅ [DEBUG] APS Profile cleared successfully - state set to null",
        );

        // Force a re-check of localStorage
        const checkCleared = localStorage.getItem("userAPSProfile");
        console.log("🗑️ [DEBUG] localStorage after clear:", checkCleared);
      } else {
        console.error("❌ [DEBUG] clearAPSProfile returned false");
      }

      return success;
    } catch (error) {
      console.error("❌ [DEBUG] Failed to clear APS profile:", error);
      setError("Failed to clear profile");
      return false;
    }
  }, [userProfile]);

  // 💾 CREATE BACKUP
  const createBackup = useCallback(() => {
    return createAPSBackup();
  }, []);

  // ✅ PROFILE VALIDATION
  const validateProfile = useCallback((profile: UserAPSProfile | null) => {
    if (!profile) return { isValid: false, errors: ["No profile found"] };

    const validation = validateAPSSubjects(profile.subjects);
    return validation;
  }, []);

  // 📊 GET PROFILE STATISTICS
  const getProfileStats = useCallback(() => {
    if (!userProfile) return null;

    return {
      totalSubjects: userProfile.subjects.length,
      totalAPS: userProfile.totalAPS,
      lastUpdated: userProfile.lastUpdated,
      savedAt: userProfile.savedAt,
      isValid: userProfile.isValid,
      hasErrors:
        userProfile.validationErrors && userProfile.validationErrors.length > 0,
    };
  }, [userProfile]);

  return {
    // State
    userProfile,
    isLoading,
    error,

    // Core Functions
    updateUserSubjects,
    clearUserProfile,
    loadProfile,
    saveProfile,

    // Utility Functions
    createBackup,
    validateProfile,
    getProfileStats,

    // Derived State
    hasProfile: !!userProfile,
    totalAPS: userProfile?.totalAPS || 0,
    subjects: userProfile?.subjects || [],
    isValid: userProfile?.isValid || false,

    // Error Handling
    clearError: () => setError(null),
  };
}

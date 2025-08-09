import { useState, useEffect, useMemo, useCallback } from "react";
import { APSSubject } from "@/types/university";
import {
  APSFilterOptions,
  CoursesForUniversityResult,
  getCoursesForUniversityWithAPS,
  getUniversityFacultiesWithAPS,
  APSAwareCourseSearchService,
} from "@/services/apsAwareCourseAssignmentService";
import { calculateAPS, validateAPSSubjects } from "@/utils/apsCalculation";

/**
 * Enhanced hook for APS-aware course assignment with user state management
 * Uses localStorage for persistent storage - data persists across browser sessions
 * Users can manually clear their APS profile when needed
 */

export interface UserAPSProfile {
  subjects: APSSubject[];
  totalAPS: number;
  lastUpdated: string;
  isValid?: boolean;
  validationErrors?: string[];
  universitySpecificScores?: import("@/types/university").UniversityAPSResult[];
}

export interface APSAwareState {
  userProfile: UserAPSProfile | null;
  isLoading: boolean;
  error: string | null;
  lastSearchResults: CoursesForUniversityResult | null;
}

// Enhanced localStorage hook with persistence protection
function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      console.log(`📦 [useLocalStorage] Loading from key: ${key}`);
      const item = localStorage.getItem(key);
      console.log(`📦 [useLocalStorage] Raw stored data:`, item);

      if (item) {
        const parsed = JSON.parse(item);
        console.log(`✅ [useLocalStorage] Parsed data for ${key}:`, parsed);
        return parsed;
      } else {
        console.log(`ℹ️ [useLocalStorage] No data found for ${key}, using initial value`);
        return initialValue;
      }
    } catch (error) {
      console.warn(`❌ [useLocalStorage] Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);

        if (valueToStore === null || valueToStore === undefined) {
          console.log(`🗑️ [useLocalStorage] Removing key: ${key}`);
          localStorage.removeItem(key);
        } else {
          console.log(`💾 [useLocalStorage] Saving to key: ${key}`, valueToStore);
          localStorage.setItem(key, JSON.stringify(valueToStore));

          // Verify save
          const verification = localStorage.getItem(key);
          console.log(`🔍 [useLocalStorage] Save verification:`, !!verification);
        }
      } catch (error) {
        console.warn(`❌ [useLocalStorage] Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue],
  );

  return [storedValue, setValue] as const;
}

export function useAPSAwareCourseAssignment(universityId?: string) {
  // Persistent user APS profile (localStorage)
  const [userProfile, setUserProfile] = useLocalStorage<UserAPSProfile | null>(
    "userAPSProfile",
    null,
  );

  // Load profile from localStorage on mount - Enhanced with debugging
  const loadProfile = useCallback(() => {
    try {
      console.log("📦 [APS Debug] Loading APS profile from localStorage...");
      console.log("📦 [APS Debug] All localStorage keys:", Object.keys(localStorage));
      const stored = localStorage.getItem("userAPSProfile");
      console.log("📦 [APS Debug] Raw stored data:", stored);

      if (stored) {
        const profile = JSON.parse(stored);
        console.log("✅ [APS Debug] APS Profile loaded from localStorage:", profile);
        console.log("✅ [APS Debug] Profile has subjects:", profile.subjects?.length || 0);
        setUserProfile(profile);
        return profile;
      } else {
        console.log("ℹ️ [APS Debug] No APS profile found in localStorage");
        setUserProfile(null);
        return null;
      }
    } catch (error) {
      console.error("❌ [APS Debug] Failed to load APS profile from localStorage:", error);
      setUserProfile(null);
      return null;
    }
  }, [setUserProfile]);

  // Load profile on component mount
  useEffect(() => {
    console.log("🚀 [APS Debug] Component mounted, loading profile...");
    loadProfile();
  }, [loadProfile]);

  // Component state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSearchResults, setLastSearchResults] =
    useState<CoursesForUniversityResult | null>(null);

  // Listen for cross-tab storage changes and APS profile cleared events
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "userAPSProfile" && e.newValue !== e.oldValue) {
        try {
          const newProfile = e.newValue ? JSON.parse(e.newValue) : null;
          setUserProfile(newProfile);
          console.log("🔄 APS Profile synced from another tab");
        } catch (error) {
          console.warn("Error parsing APS profile from storage:", error);
        }
      }
    };

    const handleAPSCleared = () => {
      setUserProfile(null);
      setLastSearchResults(null);
      setError(null);
      console.log("🧹 APS Profile cleared - component state reset");
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("apsProfileCleared", handleAPSCleared);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("apsProfileCleared", handleAPSCleared);
    };
  }, [setUserProfile]);

  // Save profile to localStorage - Enhanced with verification
  const saveProfile = useCallback(async (profile: UserAPSProfile) => {
    try {
      console.log("💾 [APS Debug] Saving APS profile to localStorage:", profile);

      // Add timestamp to ensure we track when it was saved
      const profileWithTimestamp = {
        ...profile,
        lastUpdated: new Date().toISOString(),
        savedAt: Date.now(),
      };

      localStorage.setItem(
        "userAPSProfile",
        JSON.stringify(profileWithTimestamp),
      );
      setUserProfile(profileWithTimestamp);

      // Verify it was actually saved
      const verification = localStorage.getItem("userAPSProfile");
      console.log("🔍 [APS Debug] Verification - saved data exists:", !!verification);

      if (verification) {
        console.log("✅ [APS Debug] APS Profile saved and verified successfully");
        return true;
      } else {
        console.error("❌ [APS Debug] APS Profile save verification failed");
        return false;
      }
    } catch (error) {
      console.error("❌ [APS Debug] Failed to save APS profile:", error);
      return false;
    }
  }, [setUserProfile]);

  /**
   * Update user's APS subjects and recalculate profile
   */
  const updateUserSubjects = useCallback(
    async (subjects: APSSubject[]) => {
      try {
        setIsLoading(true);
        setError(null);

        // Validate subjects
        const validation = validateAPSSubjects(subjects);
        if (!validation.isValid) {
          setError(validation.errors.join("; "));
          return false;
        }

        // Calculate total APS
        const apsResult = calculateAPS(subjects);
        const totalAPS = apsResult.totalScore || 0;

        // Create profile
        const profile: UserAPSProfile = {
          subjects,
          totalAPS,
          lastUpdated: new Date().toISOString(),
          isValid: true,
        };

        // Save to localStorage with enhanced verification
        const saved = await saveProfile(profile);
        console.log("💾 [APS Debug] Profile saved:", {
          saved,
          totalAPS: profile.totalAPS,
          subjectCount: profile.subjects.length
        });

        return saved;
      } catch (error) {
        console.error("Error updating user subjects:", error);
        setError("Failed to update subjects. Please try again.");
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [saveProfile],
  );

  /**
   * Search courses for a specific university using user's APS
   */
  const searchCoursesForUniversity = useCallback(
    async (targetUniversityId: string) => {
      if (!userProfile) {
        console.warn("No user profile available for course search");
        return [];
      }

      try {
        setIsLoading(true);
        setError(null);

        const results = await getUniversityFacultiesWithAPS(
          targetUniversityId,
          userProfile.subjects,
        );

        // Cache results for current university
        if (targetUniversityId === universityId) {
          setLastSearchResults(results);
        }

        return results.programs || [];
      } catch (error) {
        console.error("Error searching courses:", error);
        setError("Failed to search courses. Please try again.");
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [userProfile, universityId],
  );

  /**
   * Check if user qualifies for a specific program
   * Supports both userProfile and direct APS value from URL params
   */
  const checkProgramEligibility = useCallback(
    (
      program: { apsRequirement?: number; defaultAps?: number; name?: string },
      directAPS?: number,
    ) => {
      const apsToUse = directAPS || userProfile?.totalAPS;

      if (!apsToUse) return { eligible: false, reason: "No APS profile" };

      try {
        // Basic eligibility check - can be enhanced
        const requiredAPS = program.apsRequirement || program.defaultAps || 20;

        return {
          eligible: apsToUse >= requiredAPS,
          reason:
            apsToUse >= requiredAPS
              ? "Meets APS requirement"
              : `APS too low (need ${requiredAPS}, have ${apsToUse})`,
        };
      } catch (error) {
        console.error("Error checking eligibility:", error);
        return { eligible: false, reason: "Error checking eligibility" };
      }
    },
    [userProfile],
  );

  // Clear profile from localStorage - Enhanced with verification
  const clearProfile = useCallback(async () => {
    try {
      console.log("🗑️ [APS Debug] Clearing APS profile from localStorage");
      localStorage.removeItem("userAPSProfile");
      localStorage.removeItem("apsSearchResults");
      localStorage.removeItem("rebookedMarketplace-aps-profile");
      localStorage.removeItem("rebookedMarketplace-aps-search-results");
      sessionStorage.removeItem("userAPSProfile");
      sessionStorage.removeItem("apsSearchResults");
      setUserProfile(null);
      setLastSearchResults(null);
      setError(null);

      // Trigger global state reset event
      window.dispatchEvent(new CustomEvent("apsProfileCleared"));
      console.log("✅ [APS Debug] APS Profile cleared successfully");
      return true;
    } catch (error) {
      console.error("❌ [APS Debug] Failed to clear APS profile:", error);
      return false;
    }
  }, [setUserProfile]);

  /**
   * Clear user's APS profile - Only when manually triggered
   */
  const clearAPSProfile = useCallback(() => {
    return clearProfile();
  }, [clearProfile]);

  /**
   * Clear any errors
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    userProfile,
    isLoading,
    error,
    hasValidProfile: !!(
      userProfile?.subjects && userProfile.subjects.length >= 4
    ),
    qualificationSummary: userProfile
      ? {
          totalAPS: userProfile.totalAPS,
          subjectCount: userProfile.subjects.length,
          isValid: userProfile.isValid || false,
        }
      : null,
    updateUserSubjects,
    searchCoursesForUniversity,
    checkProgramEligibility,
    clearAPSProfile,
    clearError,
    saveProfile,
    loadProfile,
    clearProfile,
  };
}

/**
 * Hook for managing APS filtering options
 */
export function useAPSFilterOptions() {
  const [includeAlmostQualified, setIncludeAlmostQualified] = useState(true);
  const [maxAPSGap, setMaxAPSGap] = useState(5);
  const [facultyFilter, setFacultyFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"aps" | "eligibility" | "name">(
    "eligibility",
  );

  const filterOptions: APSFilterOptions = useMemo(
    () => ({
      includeAlmostQualified,
      maxAPSGap,
      facultyFilter,
      sortBy,
    }),
    [includeAlmostQualified, maxAPSGap, facultyFilter, sortBy],
  );

  return {
    filterOptions,
    includeAlmostQualified,
    setIncludeAlmostQualified,
    maxAPSGap,
    setMaxAPSGap,
    facultyFilter,
    setFacultyFilter,
    sortBy,
    setSortBy,
  };
}

/**
 * Enhanced search hook with caching
 */
export function useAPSSearch() {
  const searchWithCache = useCallback(
    async (query: {
      universityId?: string;
      faculty?: string;
      apsRange?: { min: number; max: number };
    }) => {
      return APSAwareCourseSearchService.searchPrograms(query);
    },
    [],
  );

  return { searchWithCache };
}

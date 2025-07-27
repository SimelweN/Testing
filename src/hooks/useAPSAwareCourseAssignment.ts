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

// Custom hook for localStorage (persistent storage)
function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
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
          localStorage.removeItem(key);
        } else {
          localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
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

  // Debug logging to verify persistence
  useEffect(() => {
    const stored = localStorage.getItem("userAPSProfile");
    console.log("🔍 [APS Debug] Initial load check:", {
      hasStoredData: !!stored,
      userProfile: !!userProfile,
      storedLength: stored?.length || 0
    });

    if (stored && !userProfile) {
      console.warn("⚠️ [APS Debug] LocalStorage has data but hook doesn't - potential sync issue");
    }
  }, [userProfile]);

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
        const totalAPS = calculateAPS(subjects);

        // Create profile
        const profile: UserAPSProfile = {
          subjects,
          totalAPS,
          lastUpdated: new Date().toISOString(),
          isValid: true,
        };

        // Save to localStorage (persistent storage)
        setUserProfile(profile);

        // Verify persistence
        const saved = localStorage.getItem("userAPSProfile");
        const persisted = !!saved;
        console.log("💾 [APS Debug] Profile saved:", {
          persisted,
          totalAPS: profile.totalAPS,
          subjectCount: profile.subjects.length
        });

        return persisted;
      } catch (error) {
        console.error("Error updating user subjects:", error);
        setError("Failed to update subjects. Please try again.");
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [setUserProfile],
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

  /**
   * Clear user's APS profile
   */
  const clearAPSProfile = useCallback(() => {
    try {
      localStorage.removeItem("userAPSProfile");
      localStorage.removeItem("apsSearchResults");
      // Also remove legacy keys for migration
      localStorage.removeItem("rebookedMarketplace-aps-profile");
      localStorage.removeItem("rebookedMarketplace-aps-search-results");
      setUserProfile(null);
      setLastSearchResults(null);
      setError(null);

      // Verify clearing worked
      const stillExists = localStorage.getItem("userAPSProfile");
      console.log("🗑️ [APS Debug] Profile cleared:", {
        cleared: !stillExists,
        wasCleared: stillExists === null
      });

      // Trigger global state reset event
      window.dispatchEvent(new CustomEvent("apsProfileCleared"));
    } catch (error) {
      console.error("Error clearing APS profile:", error);
    }
  }, [setUserProfile]);

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

import { University, Degree, Faculty, APSSubject } from "@/types/university";
import {
  COMPREHENSIVE_COURSES,
  ComprehensiveCourse,
  getUniversitiesForCourse,
  getAPSRequirement,
  courseToDegree,
} from "@/constants/universities/comprehensive-course-database";
import { ALL_SOUTH_AFRICAN_UNIVERSITIES } from "@/constants/universities/complete-26-universities";
import { calculateAPS, validateAPSSubjects } from "@/utils/apsCalculation";
import { validateAssignmentRule } from "@/utils/enhancedValidation";
import { logError } from "./systemMonitoringService";
import { checkSubjectRequirements } from "./subjectMatchingService";

/**
 * Enhanced APS-aware course assignment service
 * Addresses critical issues in program assignment logic
 */

export interface APSFilterOptions {
  userAPS?: number;
  userSubjects?: APSSubject[];
  includeAlmostQualified?: boolean; // Include programs where user is within 3 APS points
  maxAPSGap?: number; // Maximum APS gap to show programs
}

export interface ProgramAssignmentValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  universityId: string;
  courseId: string;
}

export interface EnhancedCourseWithEligibility extends ComprehensiveCourse {
  isEligible: boolean;
  apsGap: number;
  subjectMatch: {
    hasRequiredSubjects: boolean;
    missingSubjects: string[];
    subjectScore: number; // 0-100 percentage of subject match
  };
  universityId: string;
  universityInfo: {
    name: string;
    abbreviation: string;
    location: string;
    province: string;
  };
}

export interface CoursesForUniversityResult {
  universityId: string;
  courses: EnhancedCourseWithEligibility[];
  totalCourses: number;
  eligibleCourses: number;
  almostEligibleCourses: number;
  errors: string[];
  warnings: string[];
}

/**
 * Enhanced function to get courses for a university with APS and subject filtering
 */
export function getCoursesForUniversityWithAPS(
  universityId: string,
  apsOptions: APSFilterOptions = {},
): CoursesForUniversityResult {
  const result: CoursesForUniversityResult = {
    universityId,
    courses: [],
    totalCourses: 0,
    eligibleCourses: 0,
    almostEligibleCourses: 0,
    errors: [],
    warnings: [],
  };

  try {
    // Validate university ID
    if (!universityId || typeof universityId !== "string") {
      result.errors.push("Invalid university ID provided");
      return result;
    }

    // Sanitize university ID
    const sanitizedUniversityId = universityId.toLowerCase().trim();

    // Find university info
    const universityInfo = ALL_SOUTH_AFRICAN_UNIVERSITIES.find(
      (uni) => uni.id === sanitizedUniversityId,
    );

    if (!universityInfo) {
      result.errors.push(`University not found: ${universityId}`);
      result.warnings.push("Please check the university ID is correct");
      return result;
    }

    // Validate user APS if provided
    if (apsOptions.userAPS !== undefined) {
      if (
        typeof apsOptions.userAPS !== "number" ||
        apsOptions.userAPS < 0 ||
        apsOptions.userAPS > 49
      ) {
        result.warnings.push("Invalid APS score provided, filtering disabled");
        apsOptions.userAPS = undefined;
      }
    }

    // Validate user subjects if provided
    let validatedSubjects: APSSubject[] = [];
    if (apsOptions.userSubjects && Array.isArray(apsOptions.userSubjects)) {
      const validation = validateAPSSubjects(apsOptions.userSubjects);
      if (!validation.isValid) {
        result.warnings.push(...validation.errors);
      }
      validatedSubjects = apsOptions.userSubjects.filter(
        (s) => s && s.name && typeof s.points === "number" && s.points >= 0,
      );
    }

    // Filter courses by assignment rules with comprehensive error tracking
    const applicableCourses = COMPREHENSIVE_COURSES.filter((course, index) => {
      try {
        // Comprehensive course validation
        if (!course) {
          logError(
            "assignment",
            "high",
            `Null course found at index ${index}`,
            { universityId: sanitizedUniversityId },
          );
          result.errors.push(`Course ${index} is null or undefined`);
          return false;
        }

        if (
          !course.name ||
          typeof course.name !== "string" ||
          course.name.trim().length === 0
        ) {
          logError(
            "assignment",
            "high",
            `Course missing name at index ${index}`,
            {
              course: course,
              universityId: sanitizedUniversityId,
            },
          );
          result.errors.push(
            `Course ${index} has invalid name: "${course.name}"`,
          );
          return false;
        }

        if (!course.assignmentRule) {
          logError(
            "assignment",
            "critical",
            `Course "${course.name}" missing assignment rule`,
            {
              courseIndex: index,
              courseName: course.name,
              universityId: sanitizedUniversityId,
            },
          );
          result.errors.push(`Course "${course.name}" has no assignment rule`);
          return false;
        }

        // Validate assignment rule structure
        const ruleValidation = validateAssignmentRule(course.assignmentRule);
        if (!ruleValidation.isValid) {
          logError(
            "assignment",
            "critical",
            `Course "${course.name}" has invalid assignment rule`,
            {
              courseIndex: index,
              courseName: course.name,
              ruleErrors: ruleValidation.errors,
              universityId: sanitizedUniversityId,
            },
          );
          result.errors.push(
            `Course "${course.name}" has invalid assignment rule: ${ruleValidation.errors.join(", ")}`,
          );
          return false;
        }

        // Log warnings for rule issues
        if (ruleValidation.warnings.length > 0) {
          logError(
            "assignment",
            "medium",
            `Course "${course.name}" has assignment rule warnings`,
            {
              courseIndex: index,
              courseName: course.name,
              ruleWarnings: ruleValidation.warnings,
              universityId: sanitizedUniversityId,
            },
          );
          result.warnings.push(
            ...ruleValidation.warnings.map(
              (w) => `Course "${course.name}": ${w}`,
            ),
          );
        }

        // Validate other required fields
        if (!course.faculty || typeof course.faculty !== "string") {
          result.warnings.push(
            `Course "${course.name}" missing or invalid faculty`,
          );
        }

        if (
          typeof course.defaultAps !== "number" ||
          course.defaultAps < 0 ||
          course.defaultAps > 56
        ) {
          logError(
            "assignment",
            "medium",
            `Course "${course.name}" has invalid APS: ${course.defaultAps}`,
            {
              courseIndex: index,
              courseName: course.name,
              aps: course.defaultAps,
              universityId: sanitizedUniversityId,
            },
          );
          result.warnings.push(
            `Course "${course.name}" has invalid APS: ${course.defaultAps}`,
          );
        }

        const applicableUniversities = getUniversitiesForCourse(
          course.assignmentRule,
        );
        const isApplicable = applicableUniversities.includes(
          sanitizedUniversityId,
        );

        // Log successful processing in dev mode
        if (import.meta.env.DEV && isApplicable) {
          console.log(
            `✓ Course "${course.name}" applicable to ${sanitizedUniversityId}`,
          );
        }

        return isApplicable;
      } catch (error) {
        logError(
          "assignment",
          "critical",
          `Error processing course "${course?.name || "unknown"}"`,
          {
            error: error.toString(),
            courseIndex: index,
            courseName: course?.name,
            universityId: sanitizedUniversityId,
            stack: error.stack,
          },
        );
        result.errors.push(
          `Failed to process course "${course?.name || `index ${index}`}": ${error}`,
        );
        return false;
      }
    });

    result.totalCourses = applicableCourses.length;

    // Process each course with enhanced filtering
    const enhancedCourses = applicableCourses
      .map((course) => {
        try {
          const apsRequirement = getAPSRequirement(
            course,
            sanitizedUniversityId,
          );
          const userAPS = apsOptions.userAPS || 0;

          // Calculate APS eligibility
          const apsGap = Math.max(0, apsRequirement - userAPS);
          const isAPSEligible = userAPS >= apsRequirement;

          // Calculate subject match
          const subjectMatch = calculateSubjectMatch(course, validatedSubjects);

          // Determine overall eligibility
          const isEligible = isAPSEligible && subjectMatch.hasRequiredSubjects;

          // Check if almost eligible (within APS gap threshold)
          const maxGap = apsOptions.maxAPSGap || 5;
          const isAlmostEligible = apsGap > 0 && apsGap <= maxGap;

          return {
            ...course,
            isEligible,
            apsGap,
            subjectMatch,
            universityId: sanitizedUniversityId,
            universityInfo: {
              name: universityInfo.name,
              abbreviation: universityInfo.abbreviation,
              location: universityInfo.location,
              province: universityInfo.province,
            },
          } as EnhancedCourseWithEligibility;
        } catch (error) {
          result.errors.push(
            `Error processing course: ${course.name} - ${error}`,
          );
          return null;
        }
      })
      .filter(Boolean) as EnhancedCourseWithEligibility[];

    // Apply APS filtering if requested
    let filteredCourses = enhancedCourses;
    if (apsOptions.userAPS !== undefined) {
      const includeAlmost = apsOptions.includeAlmostQualified !== false;
      filteredCourses = enhancedCourses.filter((course) => {
        if (course.isEligible) return true;
        if (includeAlmost && course.apsGap <= (apsOptions.maxAPSGap || 5))
          return true;
        return false;
      });
    }

    // Sort courses by eligibility and APS requirement
    filteredCourses.sort((a, b) => {
      // Eligible first
      if (a.isEligible && !b.isEligible) return -1;
      if (!a.isEligible && b.isEligible) return 1;

      // Then by APS requirement (ascending)
      const aAPS = getAPSRequirement(a, sanitizedUniversityId);
      const bAPS = getAPSRequirement(b, sanitizedUniversityId);
      return aAPS - bAPS;
    });

    result.courses = filteredCourses;
    result.eligibleCourses = filteredCourses.filter((c) => c.isEligible).length;
    result.almostEligibleCourses = filteredCourses.filter(
      (c) => !c.isEligible && c.apsGap <= 5,
    ).length;

    return result;
  } catch (error) {
    result.errors.push(
      `Critical error in getCoursesForUniversityWithAPS: ${error}`,
    );
    return result;
  }
}

/**
 * Calculate how well user's subjects match course requirements
 * FIXED: Uses precise subject matching to prevent false positives
 */
function calculateSubjectMatch(
  course: ComprehensiveCourse,
  userSubjects: APSSubject[],
): {
  hasRequiredSubjects: boolean;
  missingSubjects: string[];
  subjectScore: number;
  detailedMatches: Array<{
    required: string;
    matched?: string;
    confidence?: number;
    levelValid?: boolean;
    reason: string;
  }>;
} {
  if (!course.subjects || course.subjects.length === 0) {
    return {
      hasRequiredSubjects: true,
      missingSubjects: [],
      subjectScore: 100,
      detailedMatches: [],
    };
  }

  // Use precise subject matching
  // FIX: Properly map APSSubject to the expected format for checkSubjectRequirements
  const result = checkSubjectRequirements(
    userSubjects.map((s) => ({
      name: s.name,
      level: s.level || s.points || 0, // APSSubject has level property, fallback to points if needed
      points: s.points,
    })),
    course.subjects,
  );

  // Build detailed match information
  const detailedMatches = result.matchedSubjects.map((match) => ({
    required: match.required,
    matched: match.matched,
    confidence: match.confidence,
    levelValid: match.levelValid,
    reason: match.levelValid ? match.matchReason : match.levelReason,
  }));

  // Add missing subjects
  result.missingSubjects.forEach((missing) => {
    detailedMatches.push({
      required: missing.name,
      reason: `Missing ${missing.name} (Level ${missing.level}). Alternatives: ${missing.alternatives.join(", ") || "None"}`,
    });
  });

  const subjectScore =
    course.subjects.filter((s) => s.isRequired).length > 0
      ? Math.round(
          (result.matchedSubjects.filter((m) => m.levelValid).length /
            course.subjects.filter((s) => s.isRequired).length) *
            100,
        )
      : 100;

  return {
    hasRequiredSubjects: result.isEligible,
    missingSubjects: result.missingSubjects.map(
      (s) => `${s.name} (Level ${s.level})`,
    ),
    subjectScore,
    detailedMatches,
  };
}

/**
 * Enhanced function to get university faculties with APS filtering
 */
export function getUniversityFacultiesWithAPS(
  universityId: string,
  apsOptions: APSFilterOptions = {},
): {
  faculties: Faculty[];
  statistics: {
    totalFaculties: number;
    totalDegrees: number;
    eligibleDegrees: number;
    averageAPS: number;
  };
  errors: string[];
  warnings: string[];
} {
  const result = {
    faculties: [] as Faculty[],
    statistics: {
      totalFaculties: 0,
      totalDegrees: 0,
      eligibleDegrees: 0,
      averageAPS: 0,
    },
    errors: [] as string[],
    warnings: [] as string[],
  };

  try {
    const coursesResult = getCoursesForUniversityWithAPS(
      universityId,
      apsOptions,
    );

    // Forward errors and warnings
    result.errors = coursesResult.errors;
    result.warnings = coursesResult.warnings;

    if (coursesResult.errors.length > 0) {
      return result;
    }

    const facultyMap = new Map<string, Faculty>();

    coursesResult.courses.forEach((course) => {
      try {
        // Generate unique faculty ID to prevent collisions
        const facultyKey = `${course.faculty}-${universityId}`;
        const facultyId = course.faculty
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "");

        if (!facultyMap.has(facultyKey)) {
          facultyMap.set(facultyKey, {
            id: facultyId,
            name: `Faculty of ${course.faculty}`,
            description: `${course.faculty} programs and degrees at ${coursesResult.courses[0]?.universityInfo.name || universityId}`,
            degrees: [],
          });
        }

        const faculty = facultyMap.get(facultyKey)!;
        const degree = courseToDegree(course, universityId);

        // Enhance degree with eligibility info
        const enhancedDegree = {
          ...degree,
          apsRequirement: getAPSRequirement(course, universityId),
          isEligible: course.isEligible,
          apsGap: course.apsGap,
          subjectMatchScore: course.subjectMatch.subjectScore,
        };

        faculty.degrees.push(enhancedDegree);
      } catch (error) {
        result.warnings.push(
          `Error processing course for faculty: ${course.name}`,
        );
      }
    });

    const faculties = Array.from(facultyMap.values());

    // Sort faculties by number of eligible degrees
    faculties.sort((a, b) => {
      const aEligible = a.degrees.filter((d: any) => d.isEligible).length;
      const bEligible = b.degrees.filter((d: any) => d.isEligible).length;
      return bEligible - aEligible;
    });

    // Calculate statistics
    const totalDegrees = faculties.reduce(
      (sum, f) => sum + f.degrees.length,
      0,
    );
    const eligibleDegrees = faculties.reduce(
      (sum, f) => sum + f.degrees.filter((d: any) => d.isEligible).length,
      0,
    );

    const totalAPS = faculties.reduce(
      (sum, f) =>
        sum + f.degrees.reduce((fSum, d) => fSum + d.apsRequirement, 0),
      0,
    );
    const averageAPS =
      totalDegrees > 0 ? Math.round(totalAPS / totalDegrees) : 0;

    result.faculties = faculties;
    result.statistics = {
      totalFaculties: faculties.length,
      totalDegrees,
      eligibleDegrees,
      averageAPS,
    };

    return result;
  } catch (error) {
    result.errors.push(
      `Critical error in getUniversityFacultiesWithAPS: ${error}`,
    );
    return result;
  }
}

/**
 * Enhanced search functionality with memoization support
 */
export class APSAwareCourseSearchService {
  private static cache = new Map<string, any>();
  private static cacheExpiry = new Map<string, number>();
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  static getCachedResult(key: string): any | null {
    const now = Date.now();
    const expiry = this.cacheExpiry.get(key);

    if (expiry && now > expiry) {
      this.cache.delete(key);
      this.cacheExpiry.delete(key);
      return null;
    }

    return this.cache.get(key) || null;
  }

  static setCachedResult(key: string, result: any): void {
    this.cache.set(key, result);
    this.cacheExpiry.set(key, Date.now() + this.CACHE_TTL);
  }

  static searchPrograms(query: {
    universityId?: string;
    apsOptions?: APSFilterOptions;
    facultyFilter?: string;
    searchTerm?: string;
  }) {
    const cacheKey = JSON.stringify(query);
    const cached = this.getCachedResult(cacheKey);
    if (cached) return cached;

    let result;
    if (query.universityId) {
      result = getCoursesForUniversityWithAPS(
        query.universityId,
        query.apsOptions,
      );
    } else {
      // Search across all universities - implement as needed
      result = {
        courses: [],
        errors: ["Multi-university search not implemented yet"],
      };
    }

    this.setCachedResult(cacheKey, result);
    return result;
  }
}

/**
 * Get comprehensive statistics about course assignment
 */
export function getSystemStatistics() {
  const stats = {
    totalCourses: COMPREHENSIVE_COURSES.length,
    totalUniversities: ALL_SOUTH_AFRICAN_UNIVERSITIES.length,
    coursesByType: {} as Record<string, number>,
    averageAPSByFaculty: {} as Record<string, number>,
    validationIssues: {
      invalidRules: 0,
      warnings: 0,
    },
  };

  // Analyze assignment rules
  COMPREHENSIVE_COURSES.forEach((course) => {
    const validation = validateCourseAssignmentRule(course);
    if (!validation.isValid) {
      stats.validationIssues.invalidRules++;
    }
    if (validation.warnings.length > 0) {
      stats.validationIssues.warnings++;
    }

    // Count by rule type
    const ruleType = course.assignmentRule?.type || "unknown";
    stats.coursesByType[ruleType] = (stats.coursesByType[ruleType] || 0) + 1;

    // Calculate average APS by faculty
    const faculty = course.faculty;
    if (!stats.averageAPSByFaculty[faculty]) {
      stats.averageAPSByFaculty[faculty] = 0;
    }
    stats.averageAPSByFaculty[faculty] += course.defaultAps;
  });

  // Finalize averages
  Object.keys(stats.averageAPSByFaculty).forEach((faculty) => {
    const courseCount = COMPREHENSIVE_COURSES.filter(
      (c) => c.faculty === faculty,
    ).length;
    stats.averageAPSByFaculty[faculty] = Math.round(
      stats.averageAPSByFaculty[faculty] / courseCount,
    );
  });

  return stats;
}

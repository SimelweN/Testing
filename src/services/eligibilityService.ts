import { APSSubject } from "@/types/university";
import {
  ComprehensiveCourse,
  getAPSRequirement,
} from "@/constants/universities/comprehensive-course-database";
import { checkSubjectRequirements } from "./subjectMatchingService";
import { logError } from "./systemMonitoringService";

/**
 * Centralized Eligibility Service
 * Fixes: Eligibility logic scattered across multiple locations
 */

export interface EligibilityResult {
  isEligible: boolean;
  category: "eligible" | "almost-eligible" | "not-eligible";
  apsStatus: {
    userAPS: number;
    requiredAPS: number;
    meetsAPS: boolean;
    gap: number;
  };
  subjectStatus: {
    meetsSubjects: boolean;
    matchedCount: number;
    requiredCount: number;
    missingSubjects: string[];
    detailedMatches: any[];
  };
  overallReason: string;
  recommendations: string[];
  confidence: number; // 0-100 confidence in the assessment
}

export interface EligibilityOptions {
  maxAPSGap?: number;
  allowAlmostEligible?: boolean;
  strictSubjectMatching?: boolean;
}

/**
 * Single source of truth for eligibility assessment
 */
export function assessEligibility(
  course: ComprehensiveCourse,
  universityId: string,
  userAPS: number,
  userSubjects: APSSubject[],
  options: EligibilityOptions = {},
): EligibilityResult {
  const {
    maxAPSGap = 5,
    allowAlmostEligible = true,
    strictSubjectMatching = true,
  } = options;

  try {
    // Validate inputs
    if (
      !course ||
      typeof userAPS !== "number" ||
      !Array.isArray(userSubjects)
    ) {
      throw new Error("Invalid inputs for eligibility assessment");
    }

    // Get APS requirement for this university
    const requiredAPS = getAPSRequirement(course, universityId);

    // APS Assessment
    const apsGap = Math.max(0, requiredAPS - userAPS);
    const meetsAPS = userAPS >= requiredAPS;
    const almostMeetsAPS = apsGap > 0 && apsGap <= maxAPSGap;

    // Subject Assessment
    const subjectResult = checkSubjectRequirements(
      userSubjects.map((s) => ({
        name: s.name,
        level: s.level,
        points: s.points,
      })),
      course.subjects || [],
    );

    // Determine overall eligibility
    let isEligible = false;
    let category: EligibilityResult["category"] = "not-eligible";
    let confidence = 100;

    if (meetsAPS && subjectResult.isEligible) {
      isEligible = true;
      category = "eligible";
    } else if (
      allowAlmostEligible &&
      almostMeetsAPS &&
      subjectResult.isEligible
    ) {
      isEligible = true; // For filtering purposes
      category = "almost-eligible";
      confidence = Math.max(50, 100 - apsGap * 10); // Reduce confidence based on APS gap
    }

    // Generate detailed reason
    let overallReason = "";
    const reasonParts: string[] = [];

    if (!meetsAPS) {
      if (almostMeetsAPS) {
        reasonParts.push(
          `Need ${apsGap} more APS points (have ${userAPS}, need ${requiredAPS})`,
        );
      } else {
        reasonParts.push(
          `APS too low: ${userAPS}/${requiredAPS} (gap: ${apsGap})`,
        );
      }
    } else {
      reasonParts.push(`APS requirement met: ${userAPS}/${requiredAPS}`);
    }

    if (!subjectResult.isEligible) {
      reasonParts.push(subjectResult.details);
    } else if (course.subjects && course.subjects.length > 0) {
      reasonParts.push(`All subject requirements met`);
    }

    overallReason = reasonParts.join("; ");

    // Generate recommendations
    const recommendations: string[] = [];

    if (!meetsAPS) {
      if (apsGap <= 3) {
        recommendations.push(
          `Improve your weakest subjects to gain ${apsGap} APS points`,
        );
      } else if (apsGap <= 7) {
        recommendations.push(
          "Consider a foundation program or bridging course",
        );
      } else {
        recommendations.push(
          "Consider alternative programs with lower APS requirements",
        );
      }
    }

    if (!subjectResult.isEligible) {
      subjectResult.missingSubjects.forEach((missing) => {
        recommendations.push(
          `Complete ${missing.name} at Level ${missing.level} or find equivalent`,
        );
      });

      // Suggest alternatives for missing subjects
      if (subjectResult.missingSubjects.length > 0) {
        recommendations.push(
          "Check subject alternatives in the program details",
        );
      }
    }

    if (category === "almost-eligible") {
      recommendations.push(
        "You almost qualify! Consider applying as you may still be accepted",
      );
    }

    if (recommendations.length === 0 && isEligible) {
      recommendations.push("You qualify for this program! Consider applying.");
    }

    return {
      isEligible,
      category,
      apsStatus: {
        userAPS,
        requiredAPS,
        meetsAPS,
        gap: apsGap,
      },
      subjectStatus: {
        meetsSubjects: subjectResult.isEligible,
        matchedCount: subjectResult.matchedSubjects.filter((m) => m.levelValid)
          .length,
        requiredCount: (course.subjects || []).filter((s) => s.isRequired)
          .length,
        missingSubjects: subjectResult.missingSubjects.map(
          (s) => `${s.name} (Level ${s.level})`,
        ),
        detailedMatches: subjectResult.matchedSubjects,
      },
      overallReason,
      recommendations,
      confidence,
    };
  } catch (error) {
    // Log error and return safe fallback
    logError("eligibility", "high", `Eligibility assessment failed: ${error}`, {
      courseId: course.name,
      universityId,
      userAPS,
      userSubjects: userSubjects.length,
    });

    return {
      isEligible: false,
      category: "not-eligible",
      apsStatus: {
        userAPS,
        requiredAPS: 0,
        meetsAPS: false,
        gap: 0,
      },
      subjectStatus: {
        meetsSubjects: false,
        matchedCount: 0,
        requiredCount: 0,
        missingSubjects: [],
        detailedMatches: [],
      },
      overallReason: "Error assessing eligibility - please try again",
      recommendations: ["Please refresh and try again, or contact support"],
      confidence: 0,
    };
  }
}

/**
 * Batch eligibility assessment for multiple courses
 */
export function assessMultipleCourses(
  courses: ComprehensiveCourse[],
  universityId: string,
  userAPS: number,
  userSubjects: APSSubject[],
  options: EligibilityOptions = {},
): Map<string, EligibilityResult> {
  const results = new Map<string, EligibilityResult>();

  for (const course of courses) {
    try {
      const result = assessEligibility(
        course,
        universityId,
        userAPS,
        userSubjects,
        options,
      );
      results.set(course.name, result);
    } catch (error) {
      logError(
        "eligibility",
        "medium",
        `Failed to assess course: ${course.name}`,
        { error, universityId },
      );

      // Add error result
      results.set(course.name, {
        isEligible: false,
        category: "not-eligible",
        apsStatus: { userAPS, requiredAPS: 0, meetsAPS: false, gap: 0 },
        subjectStatus: {
          meetsSubjects: false,
          matchedCount: 0,
          requiredCount: 0,
          missingSubjects: [],
          detailedMatches: [],
        },
        overallReason: "Assessment error",
        recommendations: ["Please try again"],
        confidence: 0,
      });
    }
  }

  return results;
}

/**
 * Validate APS score with enhanced boundaries
 */
export function validateAPSScore(aps: number): {
  isValid: boolean;
  normalizedAPS: number;
  warnings: string[];
} {
  const warnings: string[] = [];
  let normalizedAPS = aps;

  // Handle edge cases
  if (typeof aps !== "number" || isNaN(aps)) {
    return {
      isValid: false,
      normalizedAPS: 0,
      warnings: ["APS must be a valid number"],
    };
  }

  if (aps < 0) {
    warnings.push("APS cannot be negative - setting to 0");
    normalizedAPS = 0;
  }

  if (aps > 49) {
    if (aps <= 56) {
      // Allow for bonus points
      warnings.push("APS over 49 detected - may include bonus points");
    } else {
      warnings.push("APS unrealistically high - please verify");
      normalizedAPS = 49; // Cap at maximum reasonable value
    }
  }

  return {
    isValid: true,
    normalizedAPS,
    warnings,
  };
}

/**
 * Get eligibility statistics for a set of results
 */
export function getEligibilityStatistics(
  results: Map<string, EligibilityResult>,
): {
  total: number;
  eligible: number;
  almostEligible: number;
  notEligible: number;
  averageConfidence: number;
  commonIssues: string[];
} {
  const values = Array.from(results.values());

  const eligible = values.filter((r) => r.category === "eligible").length;
  const almostEligible = values.filter(
    (r) => r.category === "almost-eligible",
  ).length;
  const notEligible = values.filter(
    (r) => r.category === "not-eligible",
  ).length;

  const averageConfidence =
    values.length > 0
      ? Math.round(
          values.reduce((sum, r) => sum + r.confidence, 0) / values.length,
        )
      : 0;

  // Find common issues
  const issueFrequency = new Map<string, number>();
  values.forEach((result) => {
    if (!result.apsStatus.meetsAPS) {
      issueFrequency.set("Low APS", (issueFrequency.get("Low APS") || 0) + 1);
    }
    if (!result.subjectStatus.meetsSubjects) {
      issueFrequency.set(
        "Missing subjects",
        (issueFrequency.get("Missing subjects") || 0) + 1,
      );
    }
  });

  const commonIssues = Array.from(issueFrequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([issue, count]) => `${issue} (${count} programs)`);

  return {
    total: values.length,
    eligible,
    almostEligible,
    notEligible,
    averageConfidence,
    commonIssues,
  };
}

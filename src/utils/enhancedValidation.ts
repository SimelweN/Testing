import {
  ComprehensiveCourse,
  AssignmentRule,
  ALL_UNIVERSITY_IDS,
  COMPREHENSIVE_COURSES,
} from "@/constants/universities/comprehensive-course-database";
import { ALL_SOUTH_AFRICAN_UNIVERSITIES } from "@/constants/universities/complete-26-universities";
import { APSSubject, Degree, Faculty, University } from "@/types/university";

/**
 * Enhanced validation utilities addressing critical data integrity issues
 */

export interface ValidationError {
  type: "error" | "warning" | "info";
  code: string;
  message: string;
  context?: string;
  suggestion?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  score: number; // 0-100 quality score
}

/**
 * Comprehensive course validation
 */
export function validateComprehensiveCourse(
  course: ComprehensiveCourse,
): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    score: 100,
  };

  let deductions = 0;

  // 1. Basic required fields validation
  if (
    !course.name ||
    typeof course.name !== "string" ||
    course.name.trim().length === 0
  ) {
    result.errors.push({
      type: "error",
      code: "MISSING_NAME",
      message: "Course name is required",
      context: "course.name",
      suggestion: "Provide a valid course name",
    });
    deductions += 20;
  }

  if (
    !course.faculty ||
    typeof course.faculty !== "string" ||
    course.faculty.trim().length === 0
  ) {
    result.errors.push({
      type: "error",
      code: "MISSING_FACULTY",
      message: "Faculty is required",
      context: "course.faculty",
      suggestion: "Specify the faculty this course belongs to",
    });
    deductions += 15;
  }

  if (
    !course.description ||
    typeof course.description !== "string" ||
    course.description.trim().length < 10
  ) {
    result.warnings.push({
      type: "warning",
      code: "POOR_DESCRIPTION",
      message: "Course description is missing or too short",
      context: "course.description",
      suggestion: "Add a meaningful description (at least 10 characters)",
    });
    deductions += 5;
  }

  if (
    !course.duration ||
    typeof course.duration !== "string" ||
    course.duration.trim().length === 0
  ) {
    result.warnings.push({
      type: "warning",
      code: "MISSING_DURATION",
      message: "Course duration is missing",
      context: "course.duration",
      suggestion: 'Specify duration (e.g., "3 years", "4 years")',
    });
    deductions += 5;
  }

  // 2. APS validation
  if (typeof course.defaultAps !== "number") {
    result.errors.push({
      type: "error",
      code: "INVALID_APS",
      message: "Default APS must be a number",
      context: "course.defaultAps",
      suggestion: "Set a valid APS score (typically 15-49)",
    });
    deductions += 15;
  } else {
    if (course.defaultAps < 15 || course.defaultAps > 49) {
      result.warnings.push({
        type: "warning",
        code: "UNUSUAL_APS",
        message: `APS score ${course.defaultAps} is outside typical range (15-49)`,
        context: "course.defaultAps",
        suggestion: "Verify this APS requirement is correct",
      });
      deductions += 3;
    }
  }

  // 3. Assignment rule validation
  const ruleValidation = validateAssignmentRule(course.assignmentRule);
  if (!ruleValidation.isValid) {
    result.errors.push(...ruleValidation.errors);
    result.warnings.push(...ruleValidation.warnings);
    deductions += 20;
  }

  // 4. University-specific APS validation
  if (course.universitySpecificAps) {
    if (typeof course.universitySpecificAps !== "object") {
      result.errors.push({
        type: "error",
        code: "INVALID_UNI_APS_FORMAT",
        message: "University-specific APS must be an object",
        context: "course.universitySpecificAps",
        suggestion: 'Use format: { "uct": 35, "wits": 38 }',
      });
      deductions += 10;
    } else {
      // Validate each university-specific APS
      Object.entries(course.universitySpecificAps).forEach(([uniId, aps]) => {
        if (!ALL_UNIVERSITY_IDS.includes(uniId)) {
          result.warnings.push({
            type: "warning",
            code: "UNKNOWN_UNIVERSITY_ID",
            message: `Unknown university ID: ${uniId}`,
            context: `course.universitySpecificAps.${uniId}`,
            suggestion: "Verify university ID is correct",
          });
          deductions += 2;
        }

        if (typeof aps !== "number" || aps < 15 || aps > 49) {
          result.warnings.push({
            type: "warning",
            code: "INVALID_UNI_APS",
            message: `Invalid APS ${aps} for ${uniId}`,
            context: `course.universitySpecificAps.${uniId}`,
            suggestion: "APS should be between 15 and 49",
          });
          deductions += 2;
        }
      });
    }
  }

  // 5. Subjects validation
  if (course.subjects && Array.isArray(course.subjects)) {
    course.subjects.forEach((subject, index) => {
      if (!subject.name || typeof subject.name !== "string") {
        result.warnings.push({
          type: "warning",
          code: "INVALID_SUBJECT_NAME",
          message: `Subject ${index + 1} has invalid name`,
          context: `course.subjects[${index}].name`,
          suggestion: "Provide a valid subject name",
        });
        deductions += 2;
      }

      if (
        typeof subject.level !== "number" ||
        subject.level < 1 ||
        subject.level > 7
      ) {
        result.warnings.push({
          type: "warning",
          code: "INVALID_SUBJECT_LEVEL",
          message: `Subject ${index + 1} has invalid level: ${subject.level}`,
          context: `course.subjects[${index}].level`,
          suggestion: "Subject level should be between 1 and 7",
        });
        deductions += 2;
      }

      if (typeof subject.isRequired !== "boolean") {
        result.warnings.push({
          type: "warning",
          code: "MISSING_REQUIRED_FLAG",
          message: `Subject ${index + 1} missing isRequired flag`,
          context: `course.subjects[${index}].isRequired`,
          suggestion: "Set isRequired to true or false",
        });
        deductions += 1;
      }
    });

    // Check for essential subjects
    const hasEnglish = course.subjects.some(
      (s) => s.name.toLowerCase().includes("english") && s.isRequired,
    );
    const hasMaths = course.subjects.some(
      (s) =>
        (s.name.toLowerCase().includes("mathematics") ||
          s.name.toLowerCase().includes("mathematical literacy")) &&
        s.isRequired,
    );

    if (!hasEnglish) {
      result.warnings.push({
        type: "warning",
        code: "MISSING_ENGLISH",
        message: "Course does not require English",
        context: "course.subjects",
        suggestion: "Most courses require English - verify if this is correct",
      });
      deductions += 3;
    }

    if (!hasMaths && course.faculty === "Engineering") {
      result.warnings.push({
        type: "warning",
        code: "ENGINEERING_NO_MATHS",
        message: "Engineering course without Mathematics requirement",
        context: "course.subjects",
        suggestion: "Engineering courses typically require Mathematics",
      });
      deductions += 5;
    }
  }

  // 6. Career prospects validation
  if (
    !course.careerProspects ||
    !Array.isArray(course.careerProspects) ||
    course.careerProspects.length === 0
  ) {
    result.warnings.push({
      type: "warning",
      code: "MISSING_CAREER_PROSPECTS",
      message: "No career prospects provided",
      context: "course.careerProspects",
      suggestion: "Add potential career paths for this course",
    });
    deductions += 5;
  } else if (course.careerProspects.length < 3) {
    result.warnings.push({
      type: "warning",
      code: "FEW_CAREER_PROSPECTS",
      message: `Only ${course.careerProspects.length} career prospects listed`,
      context: "course.careerProspects",
      suggestion: "Consider adding more career options (3-5 recommended)",
    });
    deductions += 2;
  }

  // Calculate final score and validity
  result.score = Math.max(0, 100 - deductions);
  result.isValid = result.errors.length === 0;

  return result;
}

/**
 * Assignment rule validation
 */
export function validateAssignmentRule(rule: AssignmentRule): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    score: 100,
  };

  if (!rule) {
    result.errors.push({
      type: "error",
      code: "MISSING_RULE",
      message: "Assignment rule is required",
      suggestion: "Add a valid assignment rule",
    });
    result.score = 0;
    result.isValid = false;
    return result;
  }

  // Validate rule type
  if (!rule.type || !["all", "exclude", "include_only"].includes(rule.type)) {
    result.errors.push({
      type: "error",
      code: "INVALID_RULE_TYPE",
      message: `Invalid rule type: ${rule.type}`,
      context: "assignmentRule.type",
      suggestion: 'Use "all", "exclude", or "include_only"',
    });
    result.score -= 50;
  }

  // Validate universities array for exclude/include_only rules
  if (rule.type !== "all") {
    if (!rule.universities || !Array.isArray(rule.universities)) {
      result.errors.push({
        type: "error",
        code: "MISSING_UNIVERSITIES",
        message: "Universities array required for exclude/include_only rules",
        context: "assignmentRule.universities",
        suggestion: "Provide array of university IDs",
      });
      result.score -= 40;
    } else {
      // Validate each university ID
      const invalidIds = rule.universities.filter(
        (id) => !ALL_UNIVERSITY_IDS.includes(id),
      );
      if (invalidIds.length > 0) {
        result.warnings.push({
          type: "warning",
          code: "INVALID_UNIVERSITY_IDS",
          message: `Invalid university IDs: ${invalidIds.join(", ")}`,
          context: "assignmentRule.universities",
          suggestion: "Check university IDs against valid list",
        });
        result.score -= invalidIds.length * 5;
      }

      // Logical validation
      if (
        rule.type === "exclude" &&
        rule.universities.length >= ALL_UNIVERSITY_IDS.length
      ) {
        result.errors.push({
          type: "error",
          code: "EXCLUDE_ALL",
          message: "Cannot exclude all universities",
          context: "assignmentRule",
          suggestion: "Reduce exclusions or use include_only rule",
        });
        result.score -= 30;
      }

      if (rule.type === "include_only" && rule.universities.length === 0) {
        result.errors.push({
          type: "error",
          code: "INCLUDE_NONE",
          message: "Include_only rule with empty universities list",
          context: "assignmentRule",
          suggestion: "Add universities to include or use exclude rule",
        });
        result.score -= 30;
      }

      // Best practice warnings
      if (
        rule.type === "exclude" &&
        rule.universities.length > ALL_UNIVERSITY_IDS.length * 0.8
      ) {
        result.warnings.push({
          type: "warning",
          code: "MANY_EXCLUSIONS",
          message: "Excluding most universities - consider using include_only",
          context: "assignmentRule",
          suggestion: "Use include_only for better maintainability",
        });
        result.score -= 10;
      }
    }
  }

  result.isValid = result.errors.length === 0;
  result.score = Math.max(0, result.score);

  return result;
}

/**
 * Faculty ID collision detection
 */
export function detectFacultyIdCollisions(
  courses: ComprehensiveCourse[],
): ValidationError[] {
  const errors: ValidationError[] = [];
  const facultyIdMap = new Map<string, string[]>();

  courses.forEach((course) => {
    if (course.faculty) {
      const facultyId = course.faculty
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");

      if (!facultyIdMap.has(facultyId)) {
        facultyIdMap.set(facultyId, []);
      }
      facultyIdMap.get(facultyId)!.push(course.faculty);
    }
  });

  facultyIdMap.forEach((facultyNames, facultyId) => {
    const uniqueNames = [...new Set(facultyNames)];
    if (uniqueNames.length > 1) {
      errors.push({
        type: "warning",
        code: "FACULTY_ID_COLLISION",
        message: `Faculty ID collision: "${facultyId}" maps to multiple faculties`,
        context: `Faculties: ${uniqueNames.join(", ")}`,
        suggestion: "Consider renaming faculties to avoid ID collisions",
      });
    }
  });

  return errors;
}

/**
 * University ID sanitization and validation
 */
export function sanitizeUniversityId(universityId: string): {
  sanitized: string;
  isValid: boolean;
  errors: ValidationError[];
} {
  const result = {
    sanitized: "",
    isValid: false,
    errors: [] as ValidationError[],
  };

  if (!universityId || typeof universityId !== "string") {
    result.errors.push({
      type: "error",
      code: "INVALID_UNIVERSITY_ID",
      message: "University ID must be a non-empty string",
      suggestion: "Provide a valid university ID",
    });
    return result;
  }

  // Sanitize: lowercase, trim, remove special characters
  const sanitized = universityId
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, "");

  if (sanitized.length === 0) {
    result.errors.push({
      type: "error",
      code: "EMPTY_AFTER_SANITIZATION",
      message: "University ID is empty after sanitization",
      context: `Original: "${universityId}"`,
      suggestion: "Use alphanumeric characters only",
    });
    return result;
  }

  // Check if sanitized ID exists
  const universityExists = ALL_SOUTH_AFRICAN_UNIVERSITIES.some(
    (uni) => uni.id === sanitized,
  );

  if (!universityExists) {
    result.errors.push({
      type: "error",
      code: "UNIVERSITY_NOT_FOUND",
      message: `University not found: ${sanitized}`,
      context: `Original: "${universityId}", Sanitized: "${sanitized}"`,
      suggestion: "Check university ID against valid list",
    });
    return result;
  }

  result.sanitized = sanitized;
  result.isValid = true;
  return result;
}

/**
 * APS subject validation with enhanced checks
 */
export function validateAPSSubjectsEnhanced(
  subjects: APSSubject[],
): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    score: 100,
  };

  let deductions = 0;

  if (!subjects || !Array.isArray(subjects)) {
    result.errors.push({
      type: "error",
      code: "INVALID_SUBJECTS_ARRAY",
      message: "Subjects must be provided as an array",
      suggestion: "Provide an array of APSSubject objects",
    });
    result.score = 0;
    result.isValid = false;
    return result;
  }

  if (subjects.length < 4) {
    result.errors.push({
      type: "error",
      code: "INSUFFICIENT_SUBJECTS",
      message: `Only ${subjects.length} subjects provided, minimum 4 required`,
      suggestion: "Add more subjects to meet minimum requirements",
    });
    deductions += 30;
  }

  if (subjects.length > 7) {
    result.warnings.push({
      type: "warning",
      code: "TOO_MANY_SUBJECTS",
      message: `${subjects.length} subjects provided, typically 6-7 subjects`,
      suggestion: "Consider if all subjects are necessary",
    });
    deductions += 5;
  }

  // Track required subjects
  let hasEnglish = false;
  let hasMathematics = false;
  let hasLifeOrientation = false;

  subjects.forEach((subject, index) => {
    if (!subject) {
      result.errors.push({
        type: "error",
        code: "NULL_SUBJECT",
        message: `Subject ${index + 1} is null or undefined`,
        context: `subjects[${index}]`,
        suggestion: "Remove null subjects or provide valid data",
      });
      deductions += 10;
      return;
    }

    // Validate subject name
    if (
      !subject.name ||
      typeof subject.name !== "string" ||
      subject.name.trim().length === 0
    ) {
      result.errors.push({
        type: "error",
        code: "INVALID_SUBJECT_NAME",
        message: `Subject ${index + 1} has invalid name`,
        context: `subjects[${index}].name`,
        suggestion: "Provide a valid subject name",
      });
      deductions += 8;
    } else {
      const subjectName = subject.name.toLowerCase();
      if (
        subjectName.includes("english") ||
        subjectName.includes("home language")
      )
        hasEnglish = true;
      if (
        subjectName.includes("mathematics") ||
        subjectName.includes("mathematical literacy")
      )
        hasMathematics = true;
      if (subjectName.includes("life orientation")) hasLifeOrientation = true;
    }

    // Validate marks
    if (
      typeof subject.marks !== "number" ||
      subject.marks < 0 ||
      subject.marks > 100
    ) {
      result.errors.push({
        type: "error",
        code: "INVALID_MARKS",
        message: `Subject ${index + 1} has invalid marks: ${subject.marks}`,
        context: `subjects[${index}].marks`,
        suggestion: "Marks must be between 0 and 100",
      });
      deductions += 8;
    }

    // Validate level
    if (
      typeof subject.level !== "number" ||
      subject.level < 1 ||
      subject.level > 7
    ) {
      result.errors.push({
        type: "error",
        code: "INVALID_LEVEL",
        message: `Subject ${index + 1} has invalid level: ${subject.level}`,
        context: `subjects[${index}].level`,
        suggestion: "Level must be between 1 and 7",
      });
      deductions += 8;
    }

    // Validate points
    if (
      typeof subject.points !== "number" ||
      subject.points < 0 ||
      subject.points > 7
    ) {
      result.errors.push({
        type: "error",
        code: "INVALID_POINTS",
        message: `Subject ${index + 1} has invalid points: ${subject.points}`,
        context: `subjects[${index}].points`,
        suggestion: "Points must be between 0 and 7",
      });
      deductions += 8;
    }

    // Cross-validate marks, level, and points
    if (subject.marks && subject.level && subject.points) {
      const expectedLevel = getExpectedLevel(subject.marks);
      if (Math.abs(subject.level - expectedLevel) > 0) {
        result.warnings.push({
          type: "warning",
          code: "MARKS_LEVEL_MISMATCH",
          message: `Subject ${index + 1}: marks ${subject.marks}% suggest level ${expectedLevel}, but level ${subject.level} provided`,
          context: `subjects[${index}]`,
          suggestion: "Verify marks and level alignment",
        });
        deductions += 2;
      }
    }
  });

  // Check for required subjects
  if (!hasEnglish) {
    result.errors.push({
      type: "error",
      code: "MISSING_ENGLISH",
      message: "English (or other official language) is required",
      suggestion: "Add English or another official South African language",
    });
    deductions += 20;
  }

  if (!hasMathematics) {
    result.warnings.push({
      type: "warning",
      code: "MISSING_MATHEMATICS",
      message: "Mathematics or Mathematical Literacy not found",
      suggestion: "Mathematics is required for most university programs",
    });
    deductions += 15;
  }

  if (!hasLifeOrientation) {
    result.warnings.push({
      type: "warning",
      code: "MISSING_LIFE_ORIENTATION",
      message: "Life Orientation not found",
      suggestion:
        "Life Orientation is typically required (though not counted for APS)",
    });
    deductions += 5;
  }

  // Check for duplicate subjects
  const subjectNames = subjects
    .map((s) => s.name?.toLowerCase().trim())
    .filter(Boolean);
  const duplicates = subjectNames.filter(
    (name, index) => subjectNames.indexOf(name) !== index,
  );
  if (duplicates.length > 0) {
    result.warnings.push({
      type: "warning",
      code: "DUPLICATE_SUBJECTS",
      message: `Duplicate subjects found: ${[...new Set(duplicates)].join(", ")}`,
      suggestion: "Remove duplicate subjects",
    });
    deductions += duplicates.length * 5;
  }

  result.score = Math.max(0, 100 - deductions);
  result.isValid = result.errors.length === 0;

  return result;
}

/**
 * Helper function to get expected level from marks
 */
function getExpectedLevel(marks: number): number {
  if (marks >= 80) return 7;
  if (marks >= 70) return 6;
  if (marks >= 60) return 5;
  if (marks >= 50) return 4;
  if (marks >= 40) return 3;
  if (marks >= 30) return 2;
  return 1;
}

/**
 * System-wide validation report
 */
export function generateSystemValidationReport(): {
  summary: {
    totalCourses: number;
    validCourses: number;
    coursesWithErrors: number;
    coursesWithWarnings: number;
    averageScore: number;
  };
  issues: {
    criticalErrors: ValidationError[];
    commonWarnings: ValidationError[];
    facultyCollisions: ValidationError[];
  };
  recommendations: string[];
} {
  // COMPREHENSIVE_COURSES is now imported at the top of the file

  let totalScore = 0;
  let validCourses = 0;
  let coursesWithErrors = 0;
  let coursesWithWarnings = 0;
  const allErrors: ValidationError[] = [];
  const allWarnings: ValidationError[] = [];

  // Validate all courses
  COMPREHENSIVE_COURSES.forEach(
    (course: ComprehensiveCourse, index: number) => {
      const validation = validateComprehensiveCourse(course);

      totalScore += validation.score;

      if (validation.isValid) {
        validCourses++;
      } else {
        coursesWithErrors++;
      }

      if (validation.warnings.length > 0) {
        coursesWithWarnings++;
      }

      // Collect errors and warnings with course context
      validation.errors.forEach((error) => {
        allErrors.push({
          ...error,
          context: `Course ${index + 1}: ${course.name || "Unknown"} - ${error.context || ""}`,
        });
      });

      validation.warnings.forEach((warning) => {
        allWarnings.push({
          ...warning,
          context: `Course ${index + 1}: ${course.name || "Unknown"} - ${warning.context || ""}`,
        });
      });
    },
  );

  // Check for faculty collisions
  const facultyCollisions = detectFacultyIdCollisions(COMPREHENSIVE_COURSES);

  // Generate recommendations
  const recommendations: string[] = [];

  if (coursesWithErrors > 0) {
    recommendations.push(
      `Fix ${coursesWithErrors} courses with critical errors`,
    );
  }

  if (facultyCollisions.length > 0) {
    recommendations.push(
      `Resolve ${facultyCollisions.length} faculty ID collisions`,
    );
  }

  if (coursesWithWarnings > COMPREHENSIVE_COURSES.length * 0.3) {
    recommendations.push(
      "High number of warnings - consider data quality review",
    );
  }

  const averageScore =
    COMPREHENSIVE_COURSES.length > 0
      ? totalScore / COMPREHENSIVE_COURSES.length
      : 0;

  if (averageScore < 80) {
    recommendations.push(
      "Overall data quality below 80% - prioritize data cleanup",
    );
  }

  // Find most common issues
  const errorCounts = new Map<string, number>();
  const warningCounts = new Map<string, number>();

  allErrors.forEach((error) => {
    errorCounts.set(error.code, (errorCounts.get(error.code) || 0) + 1);
  });

  allWarnings.forEach((warning) => {
    warningCounts.set(warning.code, (warningCounts.get(warning.code) || 0) + 1);
  });

  const criticalErrors = [...errorCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([code, count]) => ({
      type: "error" as const,
      code,
      message: `${count} occurrences of ${code}`,
      suggestion:
        allErrors.find((e) => e.code === code)?.suggestion || "Review and fix",
    }));

  const commonWarnings = [...warningCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([code, count]) => ({
      type: "warning" as const,
      code,
      message: `${count} occurrences of ${code}`,
      suggestion:
        allWarnings.find((w) => w.code === code)?.suggestion ||
        "Review and improve",
    }));

  return {
    summary: {
      totalCourses: COMPREHENSIVE_COURSES.length,
      validCourses,
      coursesWithErrors,
      coursesWithWarnings,
      averageScore: Math.round(averageScore),
    },
    issues: {
      criticalErrors,
      commonWarnings,
      facultyCollisions,
    },
    recommendations,
  };
}

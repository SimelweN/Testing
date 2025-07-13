import { University, Faculty, Degree } from "@/types/university";
import {
  COMPREHENSIVE_COURSE_TEMPLATES,
  CourseTemplate,
  getUniversitiesForCourse,
} from "@/constants/comprehensiveCourseTemplates";
import { UNIVERSITY_ABBREVIATIONS } from "@/constants/courseAssignmentSystem";

// Faculty mapping to standardize faculty names
const FACULTY_MAPPING: Record<string, string> = {
  Engineering: "Faculty of Engineering and the Built Environment",
  "Health Sciences": "Faculty of Health Sciences",
  Humanities: "Faculty of Humanities",
  Commerce: "Faculty of Commerce",
  Law: "Faculty of Law",
  Science: "Faculty of Science",
  Education: "Faculty of Education",
  Agriculture: "Faculty of Agriculture",
  "Information Technology": "Faculty of Information Technology",
};

// Get standardized faculty name
function getStandardFacultyName(facultyKey: string): string {
  return FACULTY_MAPPING[facultyKey] || facultyKey;
}

// Convert course template to degree for a specific university
function courseTemplateToDegree(
  template: CourseTemplate,
  universityId: string,
): Degree {
  return {
    id: template.id,
    name: template.name,
    faculty: getStandardFacultyName(template.faculty),
    duration: template.duration,
    apsRequirement:
      template.universitySpecificAps?.[universityId] ||
      template.baseApsRequirement,
    description: template.description,
    subjects: template.subjects,
    careerProspects: template.careerProspects,
  };
}

// Generate courses for a specific university and faculty
export function generateCoursesForUniversityFaculty(
  universityId: string,
  facultyName: string,
): Degree[] {
  const applicableCourses = COMPREHENSIVE_COURSE_TEMPLATES.filter(
    (template) => {
      const assignedUniversities = getUniversitiesForCourse(
        template.assignmentRule,
      );
      const standardFacultyName = getStandardFacultyName(template.faculty);

      return (
        assignedUniversities.includes(universityId) &&
        (standardFacultyName === facultyName ||
          facultyName.includes(template.faculty) ||
          template.faculty === facultyName.split(" ").pop())
      );
    },
  );

  return applicableCourses.map((template) =>
    courseTemplateToDegree(template, universityId),
  );
}

// Get all courses assigned to a university
export function getAllCoursesForUniversity(
  universityId: string,
): CourseTemplate[] {
  return COMPREHENSIVE_COURSE_TEMPLATES.filter((template) => {
    const assignedUniversities = getUniversitiesForCourse(
      template.assignmentRule,
    );
    return assignedUniversities.includes(universityId);
  });
}

// Get assignment statistics for a university
export function getUniversityCourseStats(universityId: string) {
  const assignedCourses = getAllCoursesForUniversity(universityId);

  const facultyStats: Record<string, number> = {};
  assignedCourses.forEach((course) => {
    const facultyName = getStandardFacultyName(course.faculty);
    facultyStats[facultyName] = (facultyStats[facultyName] || 0) + 1;
  });

  return {
    totalCourses: assignedCourses.length,
    facultyBreakdown: facultyStats,
    coursesWithCustomAps: assignedCourses.filter(
      (c) => c.universitySpecificAps && c.universitySpecificAps[universityId],
    ).length,
  };
}

// Get global assignment statistics
export function getGlobalCourseAssignmentStats() {
  const stats = {
    totalCourses: COMPREHENSIVE_COURSE_TEMPLATES.length,
    universityStats: {} as Record<
      string,
      ReturnType<typeof getUniversityCourseStats>
    >,
    facultyStats: {} as Record<string, number>,
    assignmentTypeStats: {
      all: 0,
      exclude: 0,
      includeOnly: 0,
    },
  };

  // Calculate per-university stats
  Object.values(UNIVERSITY_ABBREVIATIONS).forEach((universityId) => {
    stats.universityStats[universityId] =
      getUniversityCourseStats(universityId);
  });

  // Calculate faculty stats
  COMPREHENSIVE_COURSE_TEMPLATES.forEach((template) => {
    const facultyName = getStandardFacultyName(template.faculty);
    stats.facultyStats[facultyName] =
      (stats.facultyStats[facultyName] || 0) + 1;

    // Assignment type stats
    switch (template.assignmentRule.type) {
      case "all":
        stats.assignmentTypeStats.all++;
        break;
      case "exclude":
        stats.assignmentTypeStats.exclude++;
        break;
      case "include_only":
        stats.assignmentTypeStats.includeOnly++;
        break;
    }
  });

  return stats;
}

// Check if a course is available at a specific university
export function isCourseAvailableAtUniversity(
  courseId: string,
  universityId: string,
): boolean {
  const course = COMPREHENSIVE_COURSE_TEMPLATES.find((t) => t.id === courseId);
  if (!course) return false;

  const assignedUniversities = getUniversitiesForCourse(course.assignmentRule);
  return assignedUniversities.includes(universityId);
}

// Get APS requirement for a course at a specific university
export function getCourseApsForUniversity(
  courseId: string,
  universityId: string,
): number | null {
  const course = COMPREHENSIVE_COURSE_TEMPLATES.find((t) => t.id === courseId);
  if (!course || !isCourseAvailableAtUniversity(courseId, universityId)) {
    return null;
  }

  return (
    course.universitySpecificAps?.[universityId] || course.baseApsRequirement
  );
}

// Enhanced university faculty generation with comprehensive course assignment
export function enhanceUniversityWithCourses(
  university: University,
): University {
  const enhancedFaculties: Faculty[] = university.faculties.map((faculty) => {
    // Get additional courses for this faculty
    const additionalCourses = generateCoursesForUniversityFaculty(
      university.id,
      faculty.name,
    );

    // Merge with existing degrees, avoiding duplicates
    const existingIds = new Set(faculty.degrees.map((d) => d.id));
    const newCourses = additionalCourses.filter(
      (course) => !existingIds.has(course.id),
    );

    return {
      ...faculty,
      degrees: [...faculty.degrees, ...newCourses],
    };
  });

  // Check if we need to add any missing faculties
  const existingFacultyNames = new Set(
    enhancedFaculties.map((f) => f.name.toLowerCase()),
  );

  const missingFaculties: Faculty[] = [];

  // Check each faculty type to see if university should have it
  Object.keys(FACULTY_MAPPING).forEach((facultyKey) => {
    const standardName = getStandardFacultyName(facultyKey);
    const hasMatchingFaculty = enhancedFaculties.some(
      (f) =>
        f.name.toLowerCase().includes(facultyKey.toLowerCase()) ||
        f.name === standardName,
    );

    if (!hasMatchingFaculty) {
      const facultyCourses = generateCoursesForUniversityFaculty(
        university.id,
        standardName,
      );

      if (facultyCourses.length > 0) {
        missingFaculties.push({
          id: facultyKey.toLowerCase().replace(/\s+/g, "-"),
          name: standardName,
          description: `${standardName} at ${university.name}`,
          degrees: facultyCourses,
        });
      }
    }
  });

  return {
    ...university,
    faculties: [...enhancedFaculties, ...missingFaculties],
  };
}

// Validate course assignments
export function validateCourseAssignments() {
  const validationResults = {
    totalCourses: COMPREHENSIVE_COURSE_TEMPLATES.length,
    errors: [] as string[],
    warnings: [] as string[],
    universityAssignments: {} as Record<string, number>,
  };

  // Check each course template
  COMPREHENSIVE_COURSE_TEMPLATES.forEach((template) => {
    try {
      const assignedUniversities = getUniversitiesForCourse(
        template.assignmentRule,
      );

      // Check if assignment is valid
      if (assignedUniversities.length === 0) {
        validationResults.errors.push(
          `Course ${template.id} (${template.name}) has no assigned universities`,
        );
      }

      // Check for invalid university IDs in rules
      if (
        template.assignmentRule.type === "exclude" ||
        template.assignmentRule.type === "include_only"
      ) {
        const invalidIds = template.assignmentRule.universities.filter(
          (id) => !Object.values(UNIVERSITY_ABBREVIATIONS).includes(id),
        );
        if (invalidIds.length > 0) {
          validationResults.errors.push(
            `Course ${template.id} references invalid university IDs: ${invalidIds.join(", ")}`,
          );
        }
      }

      // Count assignments per university
      assignedUniversities.forEach((univId) => {
        validationResults.universityAssignments[univId] =
          (validationResults.universityAssignments[univId] || 0) + 1;
      });
    } catch (error) {
      validationResults.errors.push(
        `Error processing course ${template.id}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  });

  // Check for universities with very few courses
  Object.entries(validationResults.universityAssignments).forEach(
    ([univId, count]) => {
      if (count < 10) {
        validationResults.warnings.push(
          `University ${univId} has only ${count} assigned courses`,
        );
      }
    },
  );

  return validationResults;
}

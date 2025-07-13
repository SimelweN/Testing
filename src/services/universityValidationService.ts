import { University, Degree, Faculty } from "@/types/university";
import {
  isProgramAvailable,
  getUniversityPrograms,
  getUniversityType,
  getCorrectFacultyName,
  UNIVERSITY_PROGRAM_MAPPINGS,
} from "@/constants/universities/university-specific-programs";

/**
 * Service for validating and correcting university program assignments
 */

export interface ValidationResult {
  university: University;
  issues: ValidationIssue[];
  correctedFaculties: Faculty[];
}

export interface ValidationIssue {
  type: "invalid_program" | "incorrect_faculty" | "missing_program";
  facultyId: string;
  programId?: string;
  description: string;
  recommendation: string;
}

/**
 * Validates all programs for a specific university
 */
export const validateUniversityPrograms = (
  university: University,
): ValidationResult => {
  const issues: ValidationIssue[] = [];
  const correctedFaculties: Faculty[] = [];
  const availablePrograms = getUniversityPrograms(university.id);

  university.faculties.forEach((faculty) => {
    const correctedFaculty: Faculty = {
      ...faculty,
      name: getCorrectFacultyName(university.id, faculty.id),
      degrees: [],
    };

    faculty.degrees.forEach((degree) => {
      // Check if program actually exists at this university
      if (!isProgramAvailable(university.id, degree.id)) {
        issues.push({
          type: "invalid_program",
          facultyId: faculty.id,
          programId: degree.id,
          description: `Program "${degree.name}" is not actually offered at ${university.name}`,
          recommendation: `Remove this program or verify it exists at this university`,
        });
      } else {
        // Program is valid, but ensure correct faculty assignment
        const correctedDegree: Degree = {
          ...degree,
          faculty: correctedFaculty.name,
        };
        correctedFaculty.degrees.push(correctedDegree);
      }
    });

    // Check for faculty name accuracy
    if (faculty.name !== correctedFaculty.name) {
      issues.push({
        type: "incorrect_faculty",
        facultyId: faculty.id,
        description: `Faculty name "${faculty.name}" should be "${correctedFaculty.name}" for this university type`,
        recommendation: `Update faculty name to match university's actual structure`,
      });
    }

    if (correctedFaculty.degrees.length > 0) {
      correctedFaculties.push(correctedFaculty);
    }
  });

  // Check for missing essential programs that should be available
  const mapping = UNIVERSITY_PROGRAM_MAPPINGS.find(
    (m) => m.universityId === university.id,
  );
  if (mapping) {
    const currentProgramIds = university.faculties.flatMap((f) =>
      f.degrees.map((d) => d.id),
    );
    const expectedProgramIds = mapping.availableFaculties.flatMap(
      (f) => f.programIds,
    );

    expectedProgramIds.forEach((expectedProgramId) => {
      if (!currentProgramIds.includes(expectedProgramId)) {
        issues.push({
          type: "missing_program",
          facultyId: "unknown",
          programId: expectedProgramId,
          description: `Missing expected program: ${expectedProgramId}`,
          recommendation: `Add this program to the appropriate faculty`,
        });
      }
    });
  }

  return {
    university,
    issues,
    correctedFaculties,
  };
};

/**
 * Validates all universities and returns a comprehensive report
 */
export const validateAllUniversities = (
  universities: University[],
): ValidationResult[] => {
  return universities.map(validateUniversityPrograms);
};

/**
 * Fixes common faculty assignment issues
 */
export const getCorrectFacultyAssignments = (
  universityId: string,
): Faculty[] => {
  const mapping = UNIVERSITY_PROGRAM_MAPPINGS.find(
    (m) => m.universityId === universityId,
  );

  if (!mapping) {
    return [];
  }

  return mapping.availableFaculties.map((faculty) => ({
    id: faculty.id,
    name: faculty.name,
    description: faculty.description,
    degrees: [], // Will be populated with actual degree objects
  }));
};

/**
 * Utility to get programs that should definitely NOT be at certain universities
 */
export const getInvalidProgramsForUniversity = (
  universityId: string,
): string[] => {
  const universityType = getUniversityType(universityId);
  const availablePrograms = getUniversityPrograms(universityId);

  // Programs that are unlikely to be at certain university types
  const restrictedPrograms: { [key: string]: string[] } = {
    technology: [
      "mbchb-medicine-surgery", // Most UoTs don't offer medicine
      "bds-dental-surgery", // Most UoTs don't offer dentistry
      "llb-law", // Some UoTs don't have law faculties
    ],
    comprehensive: [
      // Generally more flexible, fewer restrictions
    ],
    traditional: [
      // Traditional universities can offer most programs
    ],
  };

  const restricted = restrictedPrograms[universityType] || [];
  return restricted.filter(
    (programId) => !availablePrograms.includes(programId),
  );
};

/**
 * Get recommended APS score adjustments based on university prestige/selectivity
 */
export const getAPSAdjustments = (universityId: string): number => {
  // Higher-tier universities typically have higher APS requirements
  const prestigeAdjustments: { [key: string]: number } = {
    uct: +3, // UCT is highly selective
    wits: +3, // Wits is highly selective
    up: +2, // UP is selective
    ukzn: +1, // UKZN is moderately selective
    sun: +2, // Stellenbosch is selective
    ru: +1, // Rhodes is selective but smaller
    ufh: 0, // Standard requirements
    uwc: 0, // Standard requirements
    nwu: 0, // Standard requirements
    uj: -1, // Slightly more accessible
    unisa: -2, // Distance learning, more accessible
    cput: -1, // UoT, practical focus
    dut: -1, // UoT, practical focus
    tut: -2, // UoT, more accessible
    vut: -2, // UoT, more accessible
  };

  return prestigeAdjustments[universityId] || 0;
};

/**
 * Generate quality score for university programs
 */
export const calculateProgramQualityScore = (
  university: University,
  degree: Degree,
): number => {
  let score = 50; // Base score

  // Adjust for university reputation
  const reputationBonus: { [key: string]: number } = {
    uct: +15,
    wits: +15,
    up: +12,
    ukzn: +10,
    sun: +12,
    ru: +8,
    ufh: +5,
    uwc: +8,
    nwu: +6,
    uj: +5,
  };
  score += reputationBonus[university.id] || 0;

  // Adjust for program type and university fit
  const universityType = getUniversityType(university.id);
  if (
    universityType === "technology" &&
    degree.faculty.includes("Engineering")
  ) {
    score += 8; // UoTs excel at engineering
  }
  if (universityType === "traditional" && degree.faculty.includes("Medicine")) {
    score += 10; // Traditional unis excel at medicine
  }

  // Adjust for APS requirements (higher = more selective = higher quality perception)
  if (degree.apsRequirement >= 40) score += 8;
  else if (degree.apsRequirement >= 35) score += 5;
  else if (degree.apsRequirement >= 30) score += 2;

  return Math.min(Math.max(score, 0), 100); // Clamp between 0-100
};

/**
 * Export validation utilities
 */
export const ValidationUtils = {
  validateUniversityPrograms,
  validateAllUniversities,
  getCorrectFacultyAssignments,
  getInvalidProgramsForUniversity,
  getAPSAdjustments,
  calculateProgramQualityScore,
};

export default ValidationUtils;

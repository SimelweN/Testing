/**
 * Program Assignment Verification Tool
 * Checks if programs are correctly assigned to universities according to the rules
 */

import {
  PROGRAM_ASSIGNMENT_RULES,
  getUniversitiesForProgram,
  shouldUniversityOfferProgram,
  ALL_UNIVERSITIES,
  ProgramRule,
} from "@/constants/universities/program-assignment-rules";
import { UNIVERSITY_PROGRAM_MAPPINGS } from "@/constants/universities/university-specific-programs";

export interface VerificationResult {
  programId: string;
  programName: string;
  rule: string;
  errors: {
    type: "missing" | "unexpected" | "aps-mismatch";
    universityId: string;
    expected?: any;
    actual?: any;
    message: string;
  }[];
  totalUniversities: number;
  expectedUniversities: number;
  actualUniversities: number;
  isCorrect: boolean;
}

export interface SystemVerificationResult {
  totalPrograms: number;
  correctPrograms: number;
  incorrectPrograms: number;
  results: VerificationResult[];
  summary: {
    missingAssignments: number;
    unexpectedAssignments: number;
    apsIssues: number;
  };
}

/**
 * Get current program assignments from the university mappings
 */
function getCurrentAssignments(): { [programId: string]: string[] } {
  const assignments: { [programId: string]: string[] } = {};

  UNIVERSITY_PROGRAM_MAPPINGS.forEach((mapping) => {
    mapping.availableFaculties.forEach((faculty) => {
      faculty.programIds.forEach((programId) => {
        if (!assignments[programId]) {
          assignments[programId] = [];
        }
        assignments[programId].push(mapping.universityId);
      });
    });
  });

  return assignments;
}

/**
 * Verify a single program's assignment
 */
function verifyProgramAssignment(programRule: ProgramRule): VerificationResult {
  const expectedUniversities = getUniversitiesForProgram(programRule);
  const currentAssignments = getCurrentAssignments();
  const actualUniversities = currentAssignments[programRule.programId] || [];

  const errors: VerificationResult["errors"] = [];

  // Check for missing assignments
  expectedUniversities.forEach((uni) => {
    if (!actualUniversities.includes(uni)) {
      errors.push({
        type: "missing",
        universityId: uni,
        message: `Program should be offered at ${uni.toUpperCase()} but is missing`,
      });
    }
  });

  // Check for unexpected assignments
  actualUniversities.forEach((uni) => {
    if (!expectedUniversities.includes(uni)) {
      errors.push({
        type: "unexpected",
        universityId: uni,
        message: `Program should NOT be offered at ${uni.toUpperCase()} but is present`,
      });
    }
  });

  const ruleDescription =
    programRule.rule.type === "all"
      ? "all universities"
      : programRule.rule.type === "exclude"
        ? `all except: ${programRule.rule.universities.join(", ")}`
        : `only: ${programRule.rule.universities.join(", ")}`;

  return {
    programId: programRule.programId,
    programName: programRule.programName,
    rule: ruleDescription,
    errors,
    totalUniversities: ALL_UNIVERSITIES.length,
    expectedUniversities: expectedUniversities.length,
    actualUniversities: actualUniversities.length,
    isCorrect: errors.length === 0,
  };
}

/**
 * Verify all program assignments in the system
 */
export function verifyAllProgramAssignments(): SystemVerificationResult {
  const results = PROGRAM_ASSIGNMENT_RULES.map((rule) =>
    verifyProgramAssignment(rule),
  );

  const correctPrograms = results.filter((r) => r.isCorrect).length;
  const incorrectPrograms = results.length - correctPrograms;

  const summary = {
    missingAssignments: results.reduce(
      (sum, r) => sum + r.errors.filter((e) => e.type === "missing").length,
      0,
    ),
    unexpectedAssignments: results.reduce(
      (sum, r) => sum + r.errors.filter((e) => e.type === "unexpected").length,
      0,
    ),
    apsIssues: results.reduce(
      (sum, r) =>
        sum + r.errors.filter((e) => e.type === "aps-mismatch").length,
      0,
    ),
  };

  return {
    totalPrograms: results.length,
    correctPrograms,
    incorrectPrograms,
    results: results.sort((a, b) => b.errors.length - a.errors.length), // Show problems first
    summary,
  };
}

/**
 * Get verification results for a specific university
 */
export function verifyUniversityPrograms(universityId: string): {
  universityId: string;
  programs: {
    programId: string;
    shouldHave: boolean;
    actuallyHas: boolean;
    isCorrect: boolean;
    rule: string;
  }[];
  summary: {
    total: number;
    correct: number;
    missing: number;
    unexpected: number;
  };
} {
  const currentAssignments = getCurrentAssignments();
  const universityMapping = UNIVERSITY_PROGRAM_MAPPINGS.find(
    (m) => m.universityId === universityId,
  );
  const actualPrograms = universityMapping
    ? universityMapping.availableFaculties.flatMap((f) => f.programIds)
    : [];

  const programs = PROGRAM_ASSIGNMENT_RULES.map((rule) => {
    const shouldHave = shouldUniversityOfferProgram(universityId, rule);
    const actuallyHas = actualPrograms.includes(rule.programId);
    const isCorrect = shouldHave === actuallyHas;

    const ruleDesc =
      rule.rule.type === "all"
        ? "all"
        : rule.rule.type === "exclude"
          ? `exclude: ${rule.rule.universities.join(", ")}`
          : `include: ${rule.rule.universities.join(", ")}`;

    return {
      programId: rule.programId,
      shouldHave,
      actuallyHas,
      isCorrect,
      rule: ruleDesc,
    };
  });

  const correct = programs.filter((p) => p.isCorrect).length;
  const missing = programs.filter((p) => p.shouldHave && !p.actuallyHas).length;
  const unexpected = programs.filter(
    (p) => !p.shouldHave && p.actuallyHas,
  ).length;

  return {
    universityId,
    programs: programs.sort(
      (a, b) => Number(a.isCorrect) - Number(b.isCorrect),
    ), // Show problems first
    summary: {
      total: programs.length,
      correct,
      missing,
      unexpected,
    },
  };
}

/**
 * Generate a readable verification report
 */
export function generateVerificationReport(): string {
  const verification = verifyAllProgramAssignments();

  let report = `# Program Assignment Verification Report\n\n`;
  report += `**Overall Summary:**\n`;
  report += `- Total Programs: ${verification.totalPrograms}\n`;
  report += `- Correctly Assigned: ${verification.correctPrograms}\n`;
  report += `- Incorrectly Assigned: ${verification.incorrectPrograms}\n`;
  report += `- Missing Assignments: ${verification.summary.missingAssignments}\n`;
  report += `- Unexpected Assignments: ${verification.summary.unexpectedAssignments}\n\n`;

  if (verification.incorrectPrograms > 0) {
    report += `## Programs with Issues:\n\n`;

    verification.results
      .filter((r) => !r.isCorrect)
      .forEach((result) => {
        report += `### ${result.programName} (${result.programId})\n`;
        report += `**Rule:** ${result.rule}\n`;
        report += `**Expected Universities:** ${result.expectedUniversities}\n`;
        report += `**Actual Universities:** ${result.actualUniversities}\n\n`;

        if (result.errors.length > 0) {
          report += `**Issues:**\n`;
          result.errors.forEach((error) => {
            report += `- ${error.message}\n`;
          });
          report += `\n`;
        }
      });
  }

  return report;
}

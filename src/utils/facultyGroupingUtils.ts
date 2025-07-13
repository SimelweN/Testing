/**
 * Faculty Grouping Utilities
 * Provides functions to organize programs and universities by faculties
 */

export interface ProgramsByFaculty {
  [faculty: string]: any[];
}

export interface FacultyStats {
  total: number;
  eligible: number;
  eligibilityRate: number;
}

export interface FacultyCounts {
  [faculty: string]: FacultyStats;
}

/**
 * Standard faculty names used across South African universities
 */
export const STANDARD_FACULTIES = [
  "Agriculture",
  "Arts and Humanities",
  "Business and Economics",
  "Education",
  "Engineering and Built Environment",
  "Health Sciences",
  "Law",
  "Natural and Agricultural Sciences",
  "Science",
  "Technology",
  "Theology and Religion",
  "Veterinary Science",
  "Other",
];

/**
 * Faculty name normalization mapping
 * Maps various faculty name variations to standard names
 */
export const FACULTY_NAME_MAPPING: Record<string, string> = {
  // Engineering variants
  Engineering: "Engineering and Built Environment",
  "Engineering and the Built Environment": "Engineering and Built Environment",
  "Engineering & Built Environment": "Engineering and Built Environment",
  "Built Environment": "Engineering and Built Environment",

  // Science variants
  "Natural Sciences": "Natural and Agricultural Sciences",
  "Agricultural Sciences": "Natural and Agricultural Sciences",
  Sciences: "Science",
  "Natural and Agricultural Science": "Natural and Agricultural Sciences",

  // Business variants
  Commerce: "Business and Economics",
  Business: "Business and Economics",
  Economics: "Business and Economics",
  Management: "Business and Economics",
  "Economic and Management Sciences": "Business and Economics",

  // Health variants
  Medicine: "Health Sciences",
  Health: "Health Sciences",
  "Medical Sciences": "Health Sciences",

  // Arts variants
  Arts: "Arts and Humanities",
  Humanities: "Arts and Humanities",
  "Arts and Social Sciences": "Arts and Humanities",

  // Other common variants
  "Information Technology": "Technology",
  IT: "Technology",
  "Applied Sciences": "Science",
  "Pure and Applied Sciences": "Science",
};

/**
 * Normalize faculty name to standard format
 */
export function normalizeFacultyName(facultyName: string): string {
  if (!facultyName || typeof facultyName !== "string") {
    return "Other";
  }

  const trimmed = facultyName.trim();
  return FACULTY_NAME_MAPPING[trimmed] || trimmed || "Other";
}

/**
 * Group programs by faculty
 */
export function groupProgramsByFaculty<T extends { faculty?: string }>(
  programs: T[],
): ProgramsByFaculty {
  const grouped: ProgramsByFaculty = {};

  programs.forEach((program) => {
    const facultyName = normalizeFacultyName(program.faculty || "Other");

    if (!grouped[facultyName]) {
      grouped[facultyName] = [];
    }
    grouped[facultyName].push(program);
  });

  // Sort programs within each faculty by name
  Object.keys(grouped).forEach((faculty) => {
    grouped[faculty].sort((a, b) => {
      const nameA = a.name || "";
      const nameB = b.name || "";
      return nameA.localeCompare(nameB);
    });
  });

  return grouped;
}

/**
 * Calculate faculty statistics
 */
export function calculateFacultyStats<T extends { eligible?: boolean }>(
  programsByFaculty: Record<string, T[]>,
): FacultyCounts {
  const stats: FacultyCounts = {};

  Object.entries(programsByFaculty).forEach(([faculty, programs]) => {
    const total = programs.length;
    const eligible = programs.filter((p) => p.eligible).length;

    stats[faculty] = {
      total,
      eligible,
      eligibilityRate: total > 0 ? Math.round((eligible / total) * 100) : 0,
    };
  });

  return stats;
}

/**
 * Get sorted faculty names with counts
 */
export function getSortedFacultiesWithCounts(
  facultyCounts: FacultyCounts,
  sortBy: "name" | "total" | "eligible" | "eligibilityRate" = "name",
): Array<{ name: string; stats: FacultyStats }> {
  const faculties = Object.entries(facultyCounts).map(([name, stats]) => ({
    name,
    stats,
  }));

  faculties.sort((a, b) => {
    switch (sortBy) {
      case "total":
        return b.stats.total - a.stats.total;
      case "eligible":
        return b.stats.eligible - a.stats.eligible;
      case "eligibilityRate":
        return b.stats.eligibilityRate - a.stats.eligibilityRate;
      case "name":
      default:
        return a.name.localeCompare(b.name);
    }
  });

  return faculties;
}

/**
 * Filter programs by faculty
 */
export function filterProgramsByFaculty<T extends { faculty?: string }>(
  programs: T[],
  selectedFaculty: string,
): T[] {
  if (selectedFaculty === "all" || !selectedFaculty) {
    return programs;
  }

  return programs.filter((program) => {
    const normalizedFaculty = normalizeFacultyName(program.faculty || "Other");
    return normalizedFaculty === selectedFaculty;
  });
}

/**
 * Get faculty color for UI styling
 */
export function getFacultyColor(facultyName: string): {
  bg: string;
  text: string;
  border: string;
} {
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    "Engineering and Built Environment": {
      bg: "bg-blue-50",
      text: "text-blue-800",
      border: "border-blue-200",
    },
    "Health Sciences": {
      bg: "bg-red-50",
      text: "text-red-800",
      border: "border-red-200",
    },
    "Business and Economics": {
      bg: "bg-green-50",
      text: "text-green-800",
      border: "border-green-200",
    },
    Science: {
      bg: "bg-purple-50",
      text: "text-purple-800",
      border: "border-purple-200",
    },
    "Natural and Agricultural Sciences": {
      bg: "bg-yellow-50",
      text: "text-yellow-800",
      border: "border-yellow-200",
    },
    "Arts and Humanities": {
      bg: "bg-pink-50",
      text: "text-pink-800",
      border: "border-pink-200",
    },
    Education: {
      bg: "bg-indigo-50",
      text: "text-indigo-800",
      border: "border-indigo-200",
    },
    Law: {
      bg: "bg-gray-50",
      text: "text-gray-800",
      border: "border-gray-200",
    },
    Technology: {
      bg: "bg-cyan-50",
      text: "text-cyan-800",
      border: "border-cyan-200",
    },
  };

  return (
    colors[facultyName] || {
      bg: "bg-gray-50",
      text: "text-gray-800",
      border: "border-gray-200",
    }
  );
}

/**
 * Generate faculty overview summary
 */
export function generateFacultyOverview(
  programsByFaculty: Record<string, any[]>,
  facultyCounts: FacultyCounts,
): string {
  const totalFaculties = Object.keys(programsByFaculty).length;
  const totalPrograms = Object.values(facultyCounts).reduce(
    (sum, stats) => sum + stats.total,
    0,
  );
  const totalEligible = Object.values(facultyCounts).reduce(
    (sum, stats) => sum + stats.eligible,
    0,
  );

  const overallEligibilityRate =
    totalPrograms > 0 ? Math.round((totalEligible / totalPrograms) * 100) : 0;

  return `Found ${totalPrograms} programs across ${totalFaculties} faculties. You qualify for ${totalEligible} programs (${overallEligibilityRate}% success rate).`;
}

/**
 * Get top performing faculties by eligibility rate
 */
export function getTopPerformingFaculties(
  facultyCounts: FacultyCounts,
  limit: number = 5,
): Array<{ name: string; stats: FacultyStats }> {
  return getSortedFacultiesWithCounts(facultyCounts, "eligibilityRate")
    .filter((f) => f.stats.total > 0)
    .slice(0, limit);
}

import { University } from "@/types/university";
import {
  ALL_SOUTH_AFRICAN_UNIVERSITIES as COMPLETE_26_UNIVERSITIES,
  UNIVERSITY_STATISTICS,
} from "./complete-26-universities";

// Use the complete 26 university database with comprehensive program allocation
export const ALL_SOUTH_AFRICAN_UNIVERSITIES: University[] =
  COMPLETE_26_UNIVERSITIES;
// Alias for backward compatibility - ensure this uses the complete database
export const SOUTH_AFRICAN_UNIVERSITIES = ALL_SOUTH_AFRICAN_UNIVERSITIES;

// Production-ready university data loaded
if (import.meta.env.DEV) {
  try {
    const totalPrograms = ALL_SOUTH_AFRICAN_UNIVERSITIES.reduce(
      (total, uni) => {
        try {
          return (
            total +
            uni.faculties.reduce((facTotal, fac) => {
              try {
                return facTotal + (fac.degrees ? fac.degrees.length : 0);
              } catch (facError) {
                return facTotal;
              }
            }, 0)
          );
        } catch (uniError) {
          return total;
        }
      },
      0,
    );

    console.log(
      `🏫 ReBooked Campus: ${ALL_SOUTH_AFRICAN_UNIVERSITIES.length} universities loaded with ${totalPrograms} programs`,
    );

    // Detailed logging for debugging
    const traditionalCount = ALL_SOUTH_AFRICAN_UNIVERSITIES.filter(
      (u) => u.type === "Traditional University",
    ).length;
    const technologyCount = ALL_SOUTH_AFRICAN_UNIVERSITIES.filter(
      (u) => u.type === "University of Technology",
    ).length;
    const comprehensiveCount = ALL_SOUTH_AFRICAN_UNIVERSITIES.filter(
      (u) => u.type === "Comprehensive University",
    ).length;

    console.log(`📊 University Breakdown:
    - Traditional: ${traditionalCount}
    - Technology: ${technologyCount}
    - Comprehensive: ${comprehensiveCount}
    - Total: ${ALL_SOUTH_AFRICAN_UNIVERSITIES.length}`);

    // Log universities with no programs
    const universitiesWithoutPrograms = ALL_SOUTH_AFRICAN_UNIVERSITIES.filter(
      (uni) => {
        const totalDegrees = uni.faculties.reduce(
          (total, fac) => total + (fac.degrees ? fac.degrees.length : 0),
          0,
        );
        return totalDegrees === 0;
      },
    );

    if (universitiesWithoutPrograms.length > 0) {
      console.warn(
        `⚠️ Universities with no programs:`,
        universitiesWithoutPrograms.map((u) => u.name),
      );
    }
  } catch (loggingError) {
    console.error("Error in development logging:", loggingError);
  }
}

// Export individual categories derived from comprehensive database
export const TRADITIONAL_UNIVERSITIES = ALL_SOUTH_AFRICAN_UNIVERSITIES.filter(
  (uni) => uni.type === "Traditional University",
);

export const UNIVERSITIES_OF_TECHNOLOGY = ALL_SOUTH_AFRICAN_UNIVERSITIES.filter(
  (uni) => uni.type === "University of Technology",
);

export const COMPREHENSIVE_UNIVERSITIES = ALL_SOUTH_AFRICAN_UNIVERSITIES.filter(
  (uni) => uni.type === "Comprehensive University",
);

// Create simplified list for basic operations
export const SOUTH_AFRICAN_UNIVERSITIES_SIMPLE =
  ALL_SOUTH_AFRICAN_UNIVERSITIES.map((university) => {
    try {
      return {
        id: university.id || "",
        name: university.name || "Unknown University",
        abbreviation:
          university.abbreviation ||
          university.name?.substring(0, 3).toUpperCase() ||
          "UNK",
        fullName:
          university.fullName || university.name || "Unknown University",
        logo: university.logo || "/logos/universities/default.svg",
      };
    } catch (error) {
      console.warn("Error creating simplified university data:", error);
      return {
        id: "unknown",
        name: "Unknown University",
        abbreviation: "UNK",
        fullName: "Unknown University",
        logo: "/logos/universities/default.svg",
      };
    }
  });

// Export metadata for debugging
export const UNIVERSITY_METADATA = {
  totalUniversities: ALL_SOUTH_AFRICAN_UNIVERSITIES.length,
  universityBreakdown: UNIVERSITY_STATISTICS,
  lastUpdated: new Date().toISOString(),
  version: "6.0.0-complete-26-universities",
  source: "complete-26-universities",
  programStatistics: { totalPrograms: 0, programsByFaculty: {} },
  features: [
    "All 26 South African public universities",
    "University-specific APS scores",
    "Comprehensive program allocation rules",
    "Faculty-based organization",
    "Career prospects for all programs",
    "Realistic program distribution",
  ],
};

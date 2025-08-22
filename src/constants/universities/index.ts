import { University } from "@/types/university";
import {
  ALL_SOUTH_AFRICAN_UNIVERSITIES as COMPLETE_26_UNIVERSITIES,
  UNIVERSITY_STATISTICS,
} from "./complete-26-universities";
import {
  UPDATED_UNIVERSITY_PROGRAMS_2025,
  getUniversityPrograms,
  findProgramsByAPS,
  findProgramsByFaculty,
} from "./updated-university-programs-2025";
import {
  COMPREHENSIVE_SA_UNIVERSITIES_2025,
} from "./comprehensive-sa-universities-2025";
import {
  UNIVERSITIES_OF_TECHNOLOGY_2025,
} from "./universities-of-technology-2025";
import {
  COMPLETE_COMPREHENSIVE_UNIVERSITIES_2025,
} from "./complete-comprehensive-universities-2025";
import {
  COMPLETE_ALL_UNIVERSITIES_2025,
} from "./complete-all-universities-2025";

// Merge all university databases with comprehensive 2025 programs
const mergeAllUniversities = (...universitySets: University[][]): University[] => {
  const mergedUniversities: University[] = [];
  const universityMap = new Map<string, University>();

  // Process all university sets
  universitySets.forEach(universitySet => {
    universitySet.forEach(university => {
      const existingUni = universityMap.get(university.id);

      if (existingUni) {
        // Merge programs from both universities
        const mergedFaculties = [...existingUni.faculties];

        university.faculties.forEach(newFaculty => {
          const existingFacultyIndex = mergedFaculties.findIndex(
            f => f.name.toLowerCase() === newFaculty.name.toLowerCase()
          );

          if (existingFacultyIndex >= 0) {
            // Merge degrees in the faculty
            const existingDegreeIds = new Set(
              mergedFaculties[existingFacultyIndex].degrees.map(d => d.id)
            );

            // Add new degrees that don't exist
            newFaculty.degrees.forEach(degree => {
              if (!existingDegreeIds.has(degree.id)) {
                mergedFaculties[existingFacultyIndex].degrees.push(degree);
              }
            });
          } else {
            // Add new faculty
            mergedFaculties.push(newFaculty);
          }
        });

        // Update the university with merged data
        universityMap.set(university.id, {
          ...existingUni,
          faculties: mergedFaculties,
          // Update other properties if the new one is more comprehensive
          description: university.description || existingUni.description,
          studentCount: university.studentCount || existingUni.studentCount,
          campuses: university.campuses?.length > 0 ? university.campuses : existingUni.campuses,
          contactInfo: university.contactInfo || existingUni.contactInfo,
          applicationPeriods: university.applicationPeriods || existingUni.applicationPeriods,
          notableFeatures: university.notableFeatures?.length > 0 ? university.notableFeatures : existingUni.notableFeatures,
        });
      } else {
        // Add new university
        universityMap.set(university.id, university);
      }
    });
  });

  return Array.from(universityMap.values());
};

// Merge all university databases: Complete ALL universities dataset takes highest priority
export const ALL_SOUTH_AFRICAN_UNIVERSITIES: University[] = mergeAllUniversities(
  COMPLETE_26_UNIVERSITIES,
  COMPREHENSIVE_SA_UNIVERSITIES_2025,
  UNIVERSITIES_OF_TECHNOLOGY_2025,
  UPDATED_UNIVERSITY_PROGRAMS_2025,
  COMPLETE_COMPREHENSIVE_UNIVERSITIES_2025,
  COMPLETE_ALL_UNIVERSITIES_2025
);
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
// Calculate comprehensive statistics
const calculateProgramStatistics = () => {
  let totalPrograms = 0;
  const programsByFaculty: Record<string, number> = {};
  const programsByUniversity: Record<string, number> = {};

  ALL_SOUTH_AFRICAN_UNIVERSITIES.forEach(university => {
    let uniPrograms = 0;
    university.faculties.forEach(faculty => {
      const facultyPrograms = faculty.degrees.length;
      totalPrograms += facultyPrograms;
      uniPrograms += facultyPrograms;

      if (!programsByFaculty[faculty.name]) {
        programsByFaculty[faculty.name] = 0;
      }
      programsByFaculty[faculty.name] += facultyPrograms;
    });
    programsByUniversity[university.name] = uniPrograms;
  });

  return { totalPrograms, programsByFaculty, programsByUniversity };
};

const programStats = calculateProgramStatistics();

export const UNIVERSITY_METADATA = {
  totalUniversities: ALL_SOUTH_AFRICAN_UNIVERSITIES.length,
  universityBreakdown: UNIVERSITY_STATISTICS,
  lastUpdated: new Date().toISOString(),
  version: "8.0.0-complete-comprehensive-2025",
  source: "comprehensive-sa-universities-2025-complete",
  programStatistics: programStats,
  features: [
    "ALL South African public universities",
    "University-specific APS scores from official admission documents",
    "Comprehensive program database from university documents",
    "Faculty-based organization",
    "Career prospects for all programs",
    "Extended programme options with correct APS scores",
    "2025 admission requirements",
    "Universities of Technology included",
    "Traditional universities included",
    "Comprehensive universities included",
    "Exact APS scores from official sources",
  ],
  coverage: {
    traditional: ALL_SOUTH_AFRICAN_UNIVERSITIES.filter(u => u.type === "Traditional University").length,
    technology: ALL_SOUTH_AFRICAN_UNIVERSITIES.filter(u => u.type === "University of Technology").length,
    comprehensive: ALL_SOUTH_AFRICAN_UNIVERSITIES.filter(u => u.type === "Comprehensive University").length,
  },
};

// Export utility functions for university program management
export {
  getUniversityPrograms,
  findProgramsByAPS,
  findProgramsByFaculty,
  UPDATED_UNIVERSITY_PROGRAMS_2025,
};

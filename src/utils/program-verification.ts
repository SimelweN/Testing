import { ALL_SOUTH_AFRICAN_UNIVERSITIES } from "@/constants/universities";
import { PROGRAM_STATISTICS } from "@/constants/universities/comprehensive-program-allocation";

/**
 * PROGRAM DISPLAY VERIFICATION
 *
 * This utility verifies that programs are properly allocated and displayed
 * across all universities according to the comprehensive allocation rules.
 */

export const verifyProgramAllocation = () => {
  const verification = {
    totalUniversities: ALL_SOUTH_AFRICAN_UNIVERSITIES.length,
    universitiesWithPrograms: 0,
    totalPrograms: 0,
    programsByFaculty: {} as Record<string, number>,
    programsByUniversity: {} as Record<string, number>,
    universitiesWithoutPrograms: [] as string[],
    samplePrograms: [] as Array<{
      university: string;
      faculty: string;
      program: string;
      aps: number;
    }>,
  };

  ALL_SOUTH_AFRICAN_UNIVERSITIES.forEach((university) => {
    const universityProgramCount = university.faculties.reduce(
      (total, faculty) => total + (faculty.degrees?.length || 0),
      0,
    );

    verification.programsByUniversity[university.name] = universityProgramCount;
    verification.totalPrograms += universityProgramCount;

    if (universityProgramCount > 0) {
      verification.universitiesWithPrograms++;
    } else {
      verification.universitiesWithoutPrograms.push(university.name);
    }

    // Count programs by faculty
    university.faculties.forEach((faculty) => {
      const facultyName = faculty.name;
      verification.programsByFaculty[facultyName] =
        (verification.programsByFaculty[facultyName] || 0) +
        (faculty.degrees?.length || 0);

      // Collect sample programs
      faculty.degrees?.slice(0, 2).forEach((degree) => {
        verification.samplePrograms.push({
          university: university.name,
          faculty: facultyName,
          program: degree.name,
          aps: degree.apsRequirement,
        });
      });
    });
  });

  return verification;
};

// Run verification and log results
export const logProgramVerification = () => {
  const results = verifyProgramAllocation();

  console.log("🔍 PROGRAM ALLOCATION VERIFICATION");
  console.log("==================================");
  console.log(`📊 Total Universities: ${results.totalUniversities}`);
  console.log(
    `✅ Universities with Programs: ${results.universitiesWithPrograms}`,
  );
  console.log(`📚 Total Programs: ${results.totalPrograms}`);
  console.log(
    `🏫 Average Programs per University: ${Math.round(results.totalPrograms / results.universitiesWithPrograms)}`,
  );

  if (results.universitiesWithoutPrograms.length > 0) {
    console.log(
      `⚠️ Universities without programs: ${results.universitiesWithoutPrograms.join(", ")}`,
    );
  }

  console.log("\n📈 Programs by Faculty:");
  Object.entries(results.programsByFaculty)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .forEach(([faculty, count]) => {
      console.log(`  • ${faculty}: ${count} programs`);
    });

  console.log("\n🎯 Sample Programs:");
  results.samplePrograms.slice(0, 10).forEach((sample) => {
    console.log(
      `  • ${sample.program} (${sample.university}) - APS: ${sample.aps}`,
    );
  });

  console.log("\n📋 Program Statistics:");
  console.log(
    `  • Total Program Templates: ${PROGRAM_STATISTICS.totalPrograms}`,
  );
  console.log(`  • Faculty Types: ${PROGRAM_STATISTICS.facultyCount}`);
  console.log(
    `  • Competitive Programs: ${PROGRAM_STATISTICS.competitivePrograms}`,
  );
  console.log(
    `  • Universal Programs: ${PROGRAM_STATISTICS.universalPrograms}`,
  );

  return results;
};

// Auto-run verification in development
if (import.meta.env.DEV) {
  setTimeout(() => {
    logProgramVerification();
  }, 1000);
}

import { APSSubject, APSCalculation, EligibleDegree } from "@/types/university";
import { calculateAPSPoints } from "@/constants/degrees";
import { ALL_SOUTH_AFRICAN_UNIVERSITIES } from "@/constants/universities";
import { isNonContributing } from "@/constants/subjects";
import {
  calculateUniversitySpecificAPS,
  UniversityAPSCalculation,
} from "@/services/universitySpecificAPSService";

export const calculateAPS = (
  subjects: APSSubject[],
  targetUniversities?: string[],
): APSCalculation => {
  try {
    // Validate input
    if (!subjects || !Array.isArray(subjects)) {
      throw new Error("Invalid subjects array provided");
    }

    // Filter out non-contributing subjects (like Life Orientation) for APS calculation
    const contributingSubjects = subjects.filter((subject) => {
      try {
        return (
          subject &&
          subject.name &&
          !isNonContributing(subject.name) &&
          typeof subject.points === "number" &&
          subject.points >= 0
        );
      } catch (error) {
        console.warn("Error filtering subject:", subject, error);
        return false;
      }
    });

    // Calculate total APS score from contributing subjects only
    const totalScore = contributingSubjects.reduce((total, subject) => {
      try {
        return total + (subject.points || 0);
      } catch (error) {
        console.warn("Error adding subject points:", subject, error);
        return total;
      }
    }, 0);

    // Calculate university-specific scores
    const universityAPSCalculation = calculateUniversitySpecificAPS(
      subjects,
      targetUniversities,
    );

    // Find eligible degrees from all universities
    const eligibleDegrees: EligibleDegree[] = [];

    try {
      if (
        !ALL_SOUTH_AFRICAN_UNIVERSITIES ||
        !Array.isArray(ALL_SOUTH_AFRICAN_UNIVERSITIES)
      ) {
        console.error("Universities data not available for APS calculation");
        return {
          subjects: contributingSubjects,
          totalScore,
          eligibleDegrees: [],
        };
      }

      ALL_SOUTH_AFRICAN_UNIVERSITIES.forEach((university) => {
        try {
          if (
            !university ||
            !university.faculties ||
            !Array.isArray(university.faculties)
          ) {
            return;
          }

          university.faculties.forEach((faculty) => {
            try {
              if (
                !faculty ||
                !faculty.degrees ||
                !Array.isArray(faculty.degrees)
              ) {
                return;
              }

              faculty.degrees.forEach((degree) => {
                try {
                  if (
                    !degree ||
                    !degree.id ||
                    !degree.name ||
                    typeof degree.apsRequirement !== "number"
                  ) {
                    return;
                  }

                  const meetsRequirement = totalScore >= degree.apsRequirement;
                  const apsGap = meetsRequirement
                    ? 0
                    : degree.apsRequirement - totalScore;

                  eligibleDegrees.push({
                    degree: {
                      ...degree,
                      faculty:
                        faculty.name || degree.faculty || "Unknown Faculty",
                    },
                    university: {
                      ...university,
                      name: university.name || "Unknown University",
                    },
                    meetsRequirement,
                    apsGap: apsGap > 0 ? apsGap : undefined,
                  });
                } catch (degreeError) {
                  console.warn(
                    "Error processing degree in APS calculation:",
                    degreeError,
                  );
                }
              });
            } catch (facultyError) {
              console.warn(
                "Error processing faculty in APS calculation:",
                facultyError,
              );
            }
          });
        } catch (universityError) {
          console.warn(
            "Error processing university in APS calculation:",
            universityError,
          );
        }
      });

      // Sort by eligibility and APS requirement
      eligibleDegrees.sort((a, b) => {
        try {
          if (a.meetsRequirement && !b.meetsRequirement) return -1;
          if (!a.meetsRequirement && b.meetsRequirement) return 1;
          return (
            (a.degree?.apsRequirement || 0) - (b.degree?.apsRequirement || 0)
          );
        } catch (sortError) {
          console.warn("Error sorting eligible degrees:", sortError);
          return 0;
        }
      });
    } catch (error) {
      console.error("Error finding eligible degrees:", error);
    }

    return {
      subjects: contributingSubjects,
      totalScore,
      eligibleDegrees,
      universitySpecificScores:
        universityAPSCalculation.universitySpecificScores,
    };
  } catch (error) {
    console.error("Error in calculateAPS:", error);

    // Return safe fallback
    return {
      subjects: [],
      totalScore: 0,
      eligibleDegrees: [],
      universitySpecificScores: [],
    };
  }
};

export const convertPercentageToPoints = (percentage: number): number => {
  try {
    if (typeof percentage !== "number" || percentage < 0 || percentage > 100) {
      console.warn("Invalid percentage for APS conversion:", percentage);
      return 0;
    }

    return calculateAPSPoints(percentage);
  } catch (error) {
    console.error("Error converting percentage to points:", error);
    return 0;
  }
};

export const validateSubjectMarks = (marks: number): boolean => {
  try {
    return typeof marks === "number" && marks >= 0 && marks <= 100;
  } catch (error) {
    console.error("Error validating subject marks:", error);
    return false;
  }
};

export const getSubjectLevel = (marks: number): number => {
  try {
    return convertPercentageToPoints(marks);
  } catch (error) {
    console.error("Error getting subject level:", error);
    return 0;
  }
};

export const formatAPSScore = (score: number): string => {
  try {
    if (typeof score !== "number" || isNaN(score)) {
      return "0 points";
    }

    return `${Math.max(0, Math.floor(score))} points`;
  } catch (error) {
    console.error("Error formatting APS score:", error);
    return "0 points";
  }
};

export const getEligibilityStatus = (
  userAPS: number,
  requiredAPS: number,
): {
  eligible: boolean;
  message: string;
  gap?: number;
} => {
  try {
    if (typeof userAPS !== "number" || typeof requiredAPS !== "number") {
      return {
        eligible: false,
        message: "Invalid APS values provided",
      };
    }

    if (userAPS >= requiredAPS) {
      return {
        eligible: true,
        message: "You meet the APS requirement!",
      };
    } else {
      const gap = requiredAPS - userAPS;
      return {
        eligible: false,
        message: `You need ${gap} more APS points`,
        gap,
      };
    }
  } catch (error) {
    console.error("Error getting eligibility status:", error);
    return {
      eligible: false,
      message: "Error checking eligibility",
    };
  }
};

export const getRecommendations = (currentAPS: number): string[] => {
  try {
    if (typeof currentAPS !== "number" || isNaN(currentAPS)) {
      return ["Please calculate your APS score first"];
    }

    const recommendations: string[] = [];

    if (currentAPS < 20) {
      recommendations.push(
        "Consider improving your Mathematics and English marks",
      );
      recommendations.push(
        "Look into bridging courses or alternative pathways",
      );
      recommendations.push("Explore TVET college programs");
      recommendations.push("Consider private colleges and universities");
    } else if (currentAPS < 30) {
      recommendations.push("Focus on improving your strongest subjects");
      recommendations.push(
        "Consider studying part-time or through distance learning",
      );
      recommendations.push(
        "Look into diploma programs at universities of technology",
      );
      recommendations.push("Explore foundation programs");
    } else if (currentAPS < 35) {
      recommendations.push("You qualify for most degree programs!");
      recommendations.push(
        "Consider your career interests when choosing a degree",
      );
      recommendations.push("Look into bursary opportunities");
      recommendations.push(
        "Apply to multiple universities to increase your chances",
      );
    } else {
      recommendations.push(
        "Excellent APS score! You qualify for competitive programs",
      );
      recommendations.push("Consider prestigious universities and programs");
      recommendations.push("Apply for merit-based bursaries and scholarships");
      recommendations.push("Explore honors and specialized programs");
    }

    // Add general recommendations
    recommendations.push("Research career prospects for your chosen field");
    recommendations.push("Attend university open days and career fairs");
    recommendations.push("Consider the location and costs of universities");

    return recommendations;
  } catch (error) {
    console.error("Error getting recommendations:", error);
    return ["Unable to provide recommendations at this time"];
  }
};

// Enhanced validation for APS subjects
export const validateAPSSubjects = (
  subjects: APSSubject[],
): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} => {
  try {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!subjects || !Array.isArray(subjects)) {
      errors.push("Subjects must be provided as an array");
      return { isValid: false, errors, warnings };
    }

    // Check for required subjects - any official SA home language is valid
    const hasEnglish = subjects.some(
      (s) =>
        s.name &&
        s.marks > 0 &&
        (s.name.toLowerCase().includes("english") ||
          s.name.toLowerCase().includes("afrikaans") ||
          s.name.toLowerCase().includes("home language")),
    );

    const hasMath = subjects.some(
      (s) =>
        s.name &&
        s.marks > 0 &&
        (s.name.toLowerCase().includes("mathematics") ||
          s.name.toLowerCase().includes("mathematical literacy")),
    );

    if (!hasEnglish) {
      errors.push(
        "At least one home language subject is required (any official SA language)",
      );
    }

    if (!hasMath) {
      errors.push("Mathematics or Mathematical Literacy is required");
    }

    // Check minimum number of subjects
    const validSubjects = subjects.filter(
      (s) =>
        s.name &&
        s.name.trim() !== "" &&
        !s.name.toLowerCase().includes("additional subject") &&
        s.marks > 0,
    );

    if (validSubjects.length < 4) {
      errors.push("At least 4 valid subjects with marks are required");
    }

    // Check individual subject validity
    subjects.forEach((subject, index) => {
      if (!subject) {
        warnings.push(`Subject ${index + 1} is empty`);
        return;
      }

      if (!subject.name || subject.name.trim() === "") {
        warnings.push(`Subject ${index + 1} has no name`);
      }

      if (
        typeof subject.marks !== "number" ||
        subject.marks < 0 ||
        subject.marks > 100
      ) {
        warnings.push(
          `Subject ${index + 1} has invalid marks: ${subject.marks}`,
        );
      }

      if (
        typeof subject.points !== "number" ||
        subject.points < 0 ||
        subject.points > 7
      ) {
        warnings.push(
          `Subject ${index + 1} has invalid points: ${subject.points}`,
        );
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  } catch (error) {
    console.error("Error validating APS subjects:", error);
    return {
      isValid: false,
      errors: ["Error validating subjects"],
      warnings: [],
    };
  }
};

// Helper function to get APS score range description
export const getAPSScoreDescription = (score: number): string => {
  try {
    if (typeof score !== "number" || isNaN(score)) {
      return "Invalid score";
    }

    if (score >= 40)
      return "Outstanding - Qualifies for most competitive programs";
    if (score >= 35)
      return "Excellent - Qualifies for most university programs";
    if (score >= 30) return "Good - Qualifies for many university programs";
    if (score >= 25)
      return "Satisfactory - Qualifies for some university programs";
    if (score >= 20) return "Basic - May qualify for bridging programs";
    return "Below requirements - Consider alternative pathways";
  } catch (error) {
    console.error("Error getting APS score description:", error);
    return "Unable to determine score level";
  }
};

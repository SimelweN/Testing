import { APSSubject } from "@/types/university";

/**
 * University-Specific APS Scoring Service for South African Universities
 * Implements custom scoring systems for different universities as per their official requirements
 */

export interface UniversityAPSResult {
  universityId: string;
  universityName: string;
  score: number;
  maxScore: number;
  explanation: string;
  methodology: string;
  isEligible?: boolean;
  programSpecificScore?: number;
}

export interface UniversityAPSCalculation {
  standardAPS: number; // Traditional 42-point system
  universitySpecificScores: UniversityAPSResult[];
  subjects: APSSubject[];
  errors: string[];
  warnings: string[];
}

/**
 * Calculate UCT Faculty Points Score (FPS)
 * UCT uses a 9-point scale for top 6 subjects, excluding Life Orientation
 * Based on raw percentages with UCT's custom conversion scale
 */
export function calculateUCTScore(subjects: APSSubject[]): UniversityAPSResult {
  try {
    // Filter out Life Orientation and take top 6 subjects by percentage
    const validSubjects = subjects
      .filter(
        (subject) =>
          subject.name.toLowerCase() !== "life orientation" &&
          subject.marks > 0,
      )
      .sort((a, b) => b.marks - a.marks)
      .slice(0, 6);

    if (validSubjects.length < 6) {
      return {
        universityId: "uct",
        universityName: "University of Cape Town",
        score: 0,
        maxScore: 54,
        explanation: `Only ${validSubjects.length} valid subjects provided. UCT requires 6 subjects.`,
        methodology:
          "UCT Faculty Points Score (FPS) requires your top 6 subjects excluding Life Orientation.",
      };
    }

    // UCT's 9-point conversion scale
    const convertToUCTPoints = (percentage: number): number => {
      if (percentage >= 90) return 9;
      if (percentage >= 80) return 8;
      if (percentage >= 70) return 7;
      if (percentage >= 60) return 6;
      if (percentage >= 50) return 5;
      if (percentage >= 40) return 4;
      if (percentage >= 30) return 3;
      if (percentage >= 20) return 2;
      if (percentage >= 10) return 1;
      return 0;
    };

    const totalScore = validSubjects.reduce((sum, subject) => {
      return sum + convertToUCTPoints(subject.marks);
    }, 0);

    return {
      universityId: "uct",
      universityName: "University of Cape Town",
      score: totalScore,
      maxScore: 54,
      explanation: `UCT Score: ${totalScore} out of 54, calculated using UCT's FPS system based on your top 6 subjects.`,
      methodology: "UCT uses this instead of the normal APS.",
    };
  } catch (error) {
    return {
      universityId: "uct",
      universityName: "University of Cape Town",
      score: 0,
      maxScore: 54,
      explanation: `Error calculating UCT score: ${error}`,
      methodology: "UCT Faculty Points Score (FPS) system",
    };
  }
}

/**
 * Calculate Wits Composite Score
 * Uses subject percentages with program-specific weights
 */
export function calculateWitsScore(
  subjects: APSSubject[],
  programType: "general" | "engineering" | "commerce" | "health" = "general",
): UniversityAPSResult {
  try {
    const validSubjects = subjects.filter(
      (subject) =>
        subject.name.toLowerCase() !== "life orientation" && subject.marks > 0,
    );

    if (validSubjects.length < 4) {
      return {
        universityId: "wits",
        universityName: "University of the Witwatersrand",
        score: 0,
        maxScore: 100,
        explanation: `Insufficient subjects for Wits calculation. Need at least 4 valid subjects.`,
        methodology: "Wits Composite Score requires minimum 4 subjects.",
      };
    }

    // Subject weights based on program type
    const getSubjectWeight = (subjectName: string): number => {
      const name = subjectName.toLowerCase();

      switch (programType) {
        case "engineering":
          if (name.includes("mathematics") || name.includes("maths"))
            return 2.5;
          if (name.includes("physical science") || name.includes("physics"))
            return 2.0;
          if (name.includes("english")) return 1.5;
          return 1.0;

        case "commerce":
          if (name.includes("mathematics") || name.includes("maths"))
            return 2.0;
          if (name.includes("english")) return 2.0;
          if (name.includes("accounting")) return 1.5;
          return 1.0;

        case "health":
          if (name.includes("mathematics") || name.includes("maths"))
            return 2.0;
          if (
            name.includes("physical science") ||
            name.includes("life science")
          )
            return 2.0;
          if (name.includes("english")) return 1.5;
          return 1.0;

        default:
          if (name.includes("english")) return 1.5;
          if (name.includes("mathematics") || name.includes("maths"))
            return 1.5;
          return 1.0;
      }
    };

    let weightedSum = 0;
    let totalWeight = 0;

    validSubjects.forEach((subject) => {
      const weight = getSubjectWeight(subject.name);
      weightedSum += subject.marks * weight;
      totalWeight += weight;
    });

    const compositeScore = Math.round(weightedSum / totalWeight);

    return {
      universityId: "wits",
      universityName: "University of the Witwatersrand",
      score: compositeScore,
      maxScore: 100,
      explanation: `Wits Composite Score: ${compositeScore} — calculated using your subject percentages and program-specific weights.`,
      methodology: "Wits does not use the standard APS system.",
    };
  } catch (error) {
    return {
      universityId: "wits",
      universityName: "University of the Witwatersrand",
      score: 0,
      maxScore: 100,
      explanation: `Error calculating Wits score: ${error}`,
      methodology: "Wits Composite Score system",
    };
  }
}

/**
 * Calculate Stellenbosch TPT (Admission Score)
 * Based on key subject percentages with specific weightings
 */
export function calculateStellenboschScore(
  subjects: APSSubject[],
): UniversityAPSResult {
  try {
    const validSubjects = subjects.filter(
      (subject) =>
        subject.name.toLowerCase() !== "life orientation" && subject.marks > 0,
    );

    if (validSubjects.length < 4) {
      return {
        universityId: "stellenbosch",
        universityName: "Stellenbosch University",
        score: 0,
        maxScore: 100,
        explanation: `Insufficient subjects for Stellenbosch calculation.`,
        methodology: "Stellenbosch TPT requires minimum 4 subjects.",
      };
    }

    // Find key subjects
    const languageSubject = validSubjects.find(
      (s) =>
        s.name.toLowerCase().includes("english") ||
        s.name.toLowerCase().includes("afrikaans"),
    );

    const mathSubject = validSubjects.find(
      (s) =>
        s.name.toLowerCase().includes("mathematics") ||
        s.name.toLowerCase().includes("maths"),
    );

    if (!languageSubject || !mathSubject) {
      return {
        universityId: "stellenbosch",
        universityName: "Stellenbosch University",
        score: 0,
        maxScore: 100,
        explanation: `Missing required subjects. Need Language and Mathematics.`,
        methodology: "Stellenbosch TPT requires Language and Mathematics.",
      };
    }

    // Calculate weighted average (Language 25%, Maths 25%, Best 4 others 50%)
    const otherSubjects = validSubjects
      .filter((s) => s !== languageSubject && s !== mathSubject)
      .sort((a, b) => b.marks - a.marks)
      .slice(0, 4);

    const otherAverage =
      otherSubjects.length > 0
        ? otherSubjects.reduce((sum, s) => sum + s.marks, 0) /
          otherSubjects.length
        : 0;

    const tptScore = Math.round(
      languageSubject.marks * 0.25 +
        mathSubject.marks * 0.25 +
        otherAverage * 0.5,
    );

    return {
      universityId: "stellenbosch",
      universityName: "Stellenbosch University",
      score: tptScore,
      maxScore: 100,
      explanation: `SU Admission Score: ${tptScore} — based on your actual percentages in key subjects like Maths and Language.`,
      methodology: "Stellenbosch does not use the standard APS system.",
    };
  } catch (error) {
    return {
      universityId: "stellenbosch",
      universityName: "Stellenbosch University",
      score: 0,
      maxScore: 100,
      explanation: `Error calculating Stellenbosch score: ${error}`,
      methodology: "Stellenbosch TPT system",
    };
  }
}

/**
 * Calculate Rhodes University Score
 * Based on average percentage across all subjects
 */
export function calculateRhodesScore(
  subjects: APSSubject[],
): UniversityAPSResult {
  try {
    const validSubjects = subjects.filter(
      (subject) =>
        subject.name.toLowerCase() !== "life orientation" && subject.marks > 0,
    );

    if (validSubjects.length < 4) {
      return {
        universityId: "rhodes",
        universityName: "Rhodes University",
        score: 0,
        maxScore: 100,
        explanation: `Insufficient subjects for Rhodes calculation.`,
        methodology: "Rhodes requires minimum 4 subjects.",
      };
    }

    const totalMarks = validSubjects.reduce(
      (sum, subject) => sum + subject.marks,
      0,
    );
    const averageScore = Math.round(totalMarks / validSubjects.length);

    return {
      universityId: "rhodes",
      universityName: "Rhodes University",
      score: averageScore,
      maxScore: 100,
      explanation: `Rhodes Score: ${averageScore}% average — based on your subject percentage average.`,
      methodology:
        "Rhodes does not use APS, but focuses on your averages and key subjects.",
    };
  } catch (error) {
    return {
      universityId: "rhodes",
      universityName: "Rhodes University",
      score: 0,
      maxScore: 100,
      explanation: `Error calculating Rhodes score: ${error}`,
      methodology: "Rhodes percentage average system",
    };
  }
}

/**
 * Calculate UNISA Score
 * Custom ranking based on subject minimums and space availability
 */
export function calculateUNISAScore(
  subjects: APSSubject[],
): UniversityAPSResult {
  try {
    const validSubjects = subjects.filter(
      (subject) =>
        subject.name.toLowerCase() !== "life orientation" && subject.marks > 0,
    );

    if (validSubjects.length < 4) {
      return {
        universityId: "unisa",
        universityName: "University of South Africa",
        score: 0,
        maxScore: 100,
        explanation: `Insufficient subjects for UNISA evaluation.`,
        methodology: "UNISA requires minimum 4 subjects.",
      };
    }

    // Check minimum requirements (typically 50% for most subjects)
    const meetsMinimums = validSubjects.every((subject) => subject.marks >= 50);

    // Calculate ranking score based on averages
    const totalMarks = validSubjects.reduce(
      (sum, subject) => sum + subject.marks,
      0,
    );
    const averageScore = Math.round(totalMarks / validSubjects.length);

    const explanation = meetsMinimums
      ? `UNISA: You meet the subject and mark requirements for this course.`
      : `UNISA: Some subjects below 50% minimum requirement.`;

    return {
      universityId: "unisa",
      universityName: "University of South Africa",
      score: averageScore,
      maxScore: 100,
      explanation,
      methodology:
        "UNISA uses a custom ranking system based on subject minimums and available space.",
    };
  } catch (error) {
    return {
      universityId: "unisa",
      universityName: "University of South Africa",
      score: 0,
      maxScore: 100,
      explanation: `Error calculating UNISA score: ${error}`,
      methodology: "UNISA custom ranking system",
    };
  }
}

/**
 * Calculate standard APS for other universities
 * Traditional 42-point system
 */
export function calculateStandardAPS(subjects: APSSubject[]): number {
  const contributingSubjects = subjects.filter(
    (subject) =>
      subject.name.toLowerCase() !== "life orientation" && subject.points > 0,
  );

  return contributingSubjects.reduce((sum, subject) => sum + subject.points, 0);
}

/**
 * Main function to calculate university-specific APS scores
 */
export function calculateUniversitySpecificAPS(
  subjects: APSSubject[],
  targetUniversities?: string[],
): UniversityAPSCalculation {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate input
  if (!subjects || subjects.length === 0) {
    errors.push("No subjects provided for APS calculation");
    return {
      standardAPS: 0,
      universitySpecificScores: [],
      subjects: [],
      errors,
      warnings,
    };
  }

  // Calculate standard APS
  const standardAPS = calculateStandardAPS(subjects);

  // Calculate university-specific scores
  const universitySpecificScores: UniversityAPSResult[] = [];

  // Define universities that use custom scoring
  const customScoringUniversities = [
    { id: "uct", calculator: () => calculateUCTScore(subjects) },
    { id: "wits", calculator: () => calculateWitsScore(subjects) },
    {
      id: "stellenbosch",
      calculator: () => calculateStellenboschScore(subjects),
    },
    { id: "rhodes", calculator: () => calculateRhodesScore(subjects) },
    { id: "unisa", calculator: () => calculateUNISAScore(subjects) },
  ];

  // Other universities using standard APS (All 21 remaining universities)
  const standardAPSUniversities = [
    { id: "up", name: "University of Pretoria" },
    { id: "uj", name: "University of Johannesburg" },
    { id: "nwu", name: "North-West University" },
    { id: "tut", name: "Tshwane University of Technology" },
    { id: "dut", name: "Durban University of Technology" },
    { id: "mut", name: "Mangosuthu University of Technology" },
    { id: "ukzn", name: "University of KwaZulu-Natal" },
    { id: "ufs", name: "University of the Free State" },
    { id: "uwc", name: "University of the Western Cape" },
    { id: "ufh", name: "University of Fort Hare" },
    { id: "cput", name: "Cape Peninsula University of Technology" },
    { id: "vut", name: "Vaal University of Technology" },
    { id: "cut", name: "Central University of Technology" },
    { id: "ul", name: "University of Limpopo" },
    { id: "univen", name: "University of Venda" },
    { id: "wsu", name: "Walter Sisulu University" },
    { id: "smu", name: "Sefako Makgatho Health Sciences University" },
    { id: "ump", name: "University of Mpumalanga" },
    { id: "unizulu", name: "University of Zululand" },
    { id: "nmu", name: "Nelson Mandela University" },
    { id: "spu", name: "Sol Plaatje University" },
  ];

  // Calculate custom scores
  customScoringUniversities.forEach(({ id, calculator }) => {
    if (!targetUniversities || targetUniversities.includes(id)) {
      try {
        const result = calculator();
        universitySpecificScores.push(result);
      } catch (error) {
        errors.push(`Error calculating score for ${id}: ${error}`);
      }
    }
  });

  // Calculate standard APS scores for other universities
  standardAPSUniversities.forEach(({ id, name }) => {
    if (!targetUniversities || targetUniversities.includes(id)) {
      universitySpecificScores.push({
        universityId: id,
        universityName: name,
        score: standardAPS,
        maxScore: 42,
        explanation: `${name} APS: ${standardAPS} out of 42, calculated using ${name}'s standard APS method.`,
        methodology: `${name} uses the standard South African APS system.`,
      });
    }
  });

  return {
    standardAPS,
    universitySpecificScores,
    subjects,
    errors,
    warnings,
  };
}

/**
 * Get university scoring methodology explanation
 */
export function getUniversityScoringMethodology(universityId: string): string {
  const methodologies: Record<string, string> = {
    uct: "UCT uses a Faculty Points Score (FPS) system with a 9-point scale for your top 6 subjects.",
    wits: "Wits calculates a composite score using subject percentages with program-specific weights.",
    stellenbosch:
      "Stellenbosch uses a TPT (admission score) based on weighted key subject percentages.",
    rhodes:
      "Rhodes focuses on your average percentage across all subjects, not APS.",
    unisa:
      "UNISA uses custom ranking based on subject minimums and available space.",
  };

  return (
    methodologies[universityId] ||
    "This university uses the standard South African APS system (42-point scale)."
  );
}

/**
 * Check if a university uses custom scoring
 */
export function usesCustomScoring(universityId: string): boolean {
  return ["uct", "wits", "stellenbosch", "rhodes", "unisa"].includes(
    universityId,
  );
}

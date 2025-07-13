/**
 * Precise Subject Matching Service
 * Fixes critical issue: Subject matching is too loose causing false positives
 */

export interface SubjectMatchResult {
  isMatch: boolean;
  confidence: number; // 0-100
  reason: string;
  alternatives?: string[];
}

export interface SubjectMapping {
  canonical: string;
  synonyms: string[];
  excludes: string[];
}

// Comprehensive subject mappings to prevent false positives
const SUBJECT_MAPPINGS: SubjectMapping[] = [
  {
    canonical: "Mathematics",
    synonyms: ["Maths", "Math", "Pure Mathematics", "Core Mathematics"],
    excludes: ["Mathematical Literacy", "Maths Lit", "Mathematical Studies"],
  },
  {
    canonical: "Mathematical Literacy",
    synonyms: ["Maths Lit", "Mathematical Studies", "Quantitative Literacy"],
    excludes: ["Mathematics", "Maths", "Math", "Pure Mathematics"],
  },
  {
    canonical: "Physical Sciences",
    synonyms: ["Physics", "Physical Science", "Physics and Chemistry"],
    excludes: ["Life Sciences", "Natural Sciences"],
  },
  {
    canonical: "Life Sciences",
    synonyms: ["Biology", "Life Science", "Biological Sciences"],
    excludes: ["Physical Sciences", "Physics"],
  },
  {
    canonical: "English Home Language",
    synonyms: [
      "English HL",
      "English First Additional Language",
      "English FAL",
      "English",
    ],
    excludes: ["Afrikaans"],
  },
  {
    canonical: "Afrikaans Home Language",
    synonyms: [
      "Afrikaans HL",
      "Afrikaans First Additional Language",
      "Afrikaans FAL",
      "Afrikaans",
    ],
    excludes: ["English"],
  },
  {
    canonical: "Geography",
    synonyms: ["Geo"],
    excludes: ["History", "Economics"],
  },
  {
    canonical: "History",
    synonyms: ["Hist"],
    excludes: ["Geography", "Economics"],
  },
  {
    canonical: "Accounting",
    synonyms: ["Financial Accounting", "Acc"],
    excludes: ["Economics", "Business Studies"],
  },
  {
    canonical: "Economics",
    synonyms: ["Econ"],
    excludes: ["Accounting", "Business Studies"],
  },
  {
    canonical: "Business Studies",
    synonyms: ["Business", "Entrepreneurship"],
    excludes: ["Economics", "Accounting"],
  },
  {
    canonical: "Computer Applications Technology",
    synonyms: ["CAT", "Computer Studies", "Information Technology", "IT"],
    excludes: ["Information Systems"],
  },
  {
    canonical: "Information Technology",
    synonyms: ["IT", "Computer Studies"],
    excludes: ["Computer Applications Technology", "CAT"],
  },
  {
    canonical: "Engineering Graphics and Design",
    synonyms: ["EGD", "Technical Drawing", "Graphics"],
    excludes: ["Visual Arts", "Design"],
  },
  {
    canonical: "Visual Arts",
    synonyms: ["Art", "Fine Arts", "Creative Arts"],
    excludes: ["Engineering Graphics and Design", "EGD"],
  },
];

/**
 * Find the canonical mapping for a subject
 */
function findSubjectMapping(subjectName: string): SubjectMapping | null {
  const normalizedName = subjectName.toLowerCase().trim();

  return (
    SUBJECT_MAPPINGS.find((mapping) => {
      // Check canonical name
      if (mapping.canonical.toLowerCase() === normalizedName) {
        return true;
      }

      // Check synonyms
      return mapping.synonyms.some(
        (synonym) => synonym.toLowerCase() === normalizedName,
      );
    }) || null
  );
}

/**
 * Precise subject matching to prevent false positives
 */
export function matchSubjects(
  userSubject: string,
  requiredSubject: string,
): SubjectMatchResult {
  const userNormalized = userSubject.toLowerCase().trim();
  const requiredNormalized = requiredSubject.toLowerCase().trim();

  // Exact match - highest confidence
  if (userNormalized === requiredNormalized) {
    return {
      isMatch: true,
      confidence: 100,
      reason: "Exact match",
    };
  }

  // Find mappings for both subjects
  const userMapping = findSubjectMapping(userSubject);
  const requiredMapping = findSubjectMapping(requiredSubject);

  // Both subjects have mappings
  if (userMapping && requiredMapping) {
    // Same canonical subject - high confidence
    if (userMapping.canonical === requiredMapping.canonical) {
      return {
        isMatch: true,
        confidence: 95,
        reason: `Both are ${userMapping.canonical}`,
      };
    }

    // Check if explicitly excluded - prevents false positives
    if (
      userMapping.excludes.some(
        (excluded) =>
          excluded.toLowerCase() === requiredMapping.canonical.toLowerCase(),
      )
    ) {
      return {
        isMatch: false,
        confidence: 100,
        reason: `${userSubject} explicitly cannot substitute for ${requiredSubject}`,
        alternatives: requiredMapping.synonyms,
      };
    }
  }

  // User subject has mapping, required doesn't
  if (userMapping && !requiredMapping) {
    // Check if user's synonyms include the required subject
    if (
      userMapping.synonyms.some(
        (synonym) => synonym.toLowerCase() === requiredNormalized,
      )
    ) {
      return {
        isMatch: true,
        confidence: 85,
        reason: `${userSubject} includes ${requiredSubject}`,
      };
    }

    // Check if required subject is in user's canonical name
    if (userMapping.canonical.toLowerCase().includes(requiredNormalized)) {
      return {
        isMatch: true,
        confidence: 75,
        reason: `${requiredSubject} is part of ${userMapping.canonical}`,
      };
    }
  }

  // Required subject has mapping, user doesn't
  if (!userMapping && requiredMapping) {
    // Check if required's synonyms include the user subject
    if (
      requiredMapping.synonyms.some(
        (synonym) => synonym.toLowerCase() === userNormalized,
      )
    ) {
      return {
        isMatch: true,
        confidence: 85,
        reason: `${requiredSubject} includes ${userSubject}`,
      };
    }

    // Check if user subject is in required's canonical name
    if (requiredMapping.canonical.toLowerCase().includes(userNormalized)) {
      return {
        isMatch: true,
        confidence: 75,
        reason: `${userSubject} is part of ${requiredMapping.canonical}`,
      };
    }
  }

  // Partial match as last resort - very low confidence
  if (
    userNormalized.includes(requiredNormalized) ||
    requiredNormalized.includes(userNormalized)
  ) {
    // But not if one is much shorter (prevents "Math" matching "Mathematical Literacy")
    const lengthRatio =
      Math.min(userNormalized.length, requiredNormalized.length) /
      Math.max(userNormalized.length, requiredNormalized.length);

    if (lengthRatio > 0.6) {
      return {
        isMatch: true,
        confidence: 45,
        reason: `Partial match - please verify this is correct`,
        alternatives: requiredMapping?.synonyms || [],
      };
    }
  }

  // No match
  return {
    isMatch: false,
    confidence: 100,
    reason: `${userSubject} does not match ${requiredSubject}`,
    alternatives: requiredMapping?.synonyms || [],
  };
}

/**
 * Validate subject level requirements
 */
export function validateSubjectLevel(
  userLevel: number,
  requiredLevel: number,
  subjectName: string,
): {
  isValid: boolean;
  reason: string;
  gap?: number;
} {
  if (userLevel >= requiredLevel) {
    return {
      isValid: true,
      reason: `${subjectName} Level ${userLevel} meets requirement (Level ${requiredLevel})`,
    };
  }

  const gap = requiredLevel - userLevel;
  return {
    isValid: false,
    reason: `${subjectName} Level ${userLevel} is below requirement (Level ${requiredLevel})`,
    gap,
  };
}

/**
 * Comprehensive subject requirement check
 */
export function checkSubjectRequirements(
  userSubjects: Array<{ name: string; level: number; points: number }>,
  requiredSubjects: Array<{ name: string; level: number; isRequired: boolean }>,
): {
  isEligible: boolean;
  matchedSubjects: Array<{
    required: string;
    matched: string;
    confidence: number;
    levelValid: boolean;
  }>;
  missingSubjects: Array<{
    name: string;
    level: number;
    alternatives: string[];
  }>;
  details: string;
} {
  const matchedSubjects: any[] = [];
  const missingSubjects: any[] = [];

  for (const required of requiredSubjects.filter((s) => s.isRequired)) {
    let bestMatch: any = null;
    let bestMatchConfidence = 0;

    // Find best matching user subject
    for (const userSubject of userSubjects) {
      const matchResult = matchSubjects(userSubject.name, required.name);

      if (matchResult.isMatch && matchResult.confidence > bestMatchConfidence) {
        const levelCheck = validateSubjectLevel(
          userSubject.level,
          required.level,
          required.name,
        );

        bestMatch = {
          required: required.name,
          matched: userSubject.name,
          confidence: matchResult.confidence,
          levelValid: levelCheck.isValid,
          userLevel: userSubject.level,
          requiredLevel: required.level,
          matchReason: matchResult.reason,
          levelReason: levelCheck.reason,
        };
        bestMatchConfidence = matchResult.confidence;
      }
    }

    if (bestMatch) {
      matchedSubjects.push(bestMatch);
    } else {
      // Find alternatives from mapping
      const mapping = findSubjectMapping(required.name);
      missingSubjects.push({
        name: required.name,
        level: required.level,
        alternatives: mapping?.synonyms || [],
      });
    }
  }

  // Check if all required subjects are matched with valid levels
  const validMatches = matchedSubjects.filter((m) => m.levelValid);
  const isEligible =
    missingSubjects.length === 0 &&
    validMatches.length === requiredSubjects.filter((s) => s.isRequired).length;

  // Generate detailed explanation
  let details = "";
  if (isEligible) {
    details = "All subject requirements met";
  } else {
    const issues: string[] = [];

    if (missingSubjects.length > 0) {
      issues.push(
        `Missing: ${missingSubjects.map((s) => `${s.name} (Level ${s.level})`).join(", ")}`,
      );
    }

    const invalidLevels = matchedSubjects.filter((m) => !m.levelValid);
    if (invalidLevels.length > 0) {
      issues.push(
        `Insufficient levels: ${invalidLevels.map((m) => `${m.required} (need Level ${m.requiredLevel}, have Level ${m.userLevel})`).join(", ")}`,
      );
    }

    details = issues.join("; ");
  }

  return {
    isEligible,
    matchedSubjects,
    missingSubjects,
    details,
  };
}

/**
 * Get subject alternatives for user guidance
 */
export function getSubjectAlternatives(subjectName: string): string[] {
  const mapping = findSubjectMapping(subjectName);
  return mapping?.synonyms || [];
}

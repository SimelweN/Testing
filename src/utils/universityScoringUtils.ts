import { UniversityAPSResult } from "@/types/university";

/**
 * Utility functions for university-specific APS scoring and display
 */

export interface ScoringSystemInfo {
  id: string;
  name: string;
  description: string;
  maxScore: number;
  explanation: string;
  advantages: string[];
  considerations: string[];
}

/**
 * Get detailed information about a university's scoring system
 */
export function getScoringSystemInfo(scoringSystem: string): ScoringSystemInfo {
  const systems: Record<string, ScoringSystemInfo> = {
    "uct-fps": {
      id: "uct-fps",
      name: "UCT Faculty Points Score (FPS)",
      description:
        "Uses a 9-point scale for top 6 subjects excluding Life Orientation",
      maxScore: 54,
      explanation:
        "UCT converts your percentage marks to a 9-point scale, then takes your best 6 subjects (excluding Life Orientation) to calculate your Faculty Points Score.",
      advantages: [
        "Rewards high performance with exponential point increases",
        "Focuses on your strongest subjects",
        "Accounts for academic excellence at higher levels",
      ],
      considerations: [
        "Requires consistently high marks across subjects",
        "Cannot be compared directly with standard APS",
        "May include Weighted Points Score (WPS) for disadvantaged students",
      ],
    },
    "wits-composite": {
      id: "wits-composite",
      name: "Wits Composite Score",
      description: "Uses subject percentages with program-specific weightings",
      maxScore: 100,
      explanation:
        "Wits calculates a weighted average of your subject percentages, with different programs giving higher weight to specific subjects (e.g., Engineering prioritizes Maths and Science).",
      advantages: [
        "Considers the relevance of subjects to your chosen program",
        "Rewards strong performance in key subjects",
        "More nuanced than simple APS calculation",
      ],
      considerations: [
        "Different weightings for different programs",
        "Composite score varies by faculty",
        "No fixed total - used for ranking students",
      ],
    },
    "stellenbosch-tpt": {
      id: "stellenbosch-tpt",
      name: "Stellenbosch TPT (Admission Score)",
      description: "Weighted percentage calculation focusing on key subjects",
      maxScore: 100,
      explanation:
        "Stellenbosch calculates a weighted average where Language (25%), Mathematics (25%), and your best 4 other subjects (50%) determine your admission score.",
      advantages: [
        "Clear weighting system that values core subjects",
        "Recognizes importance of language and mathematics",
        "Allows for strength in other subjects to compensate",
      ],
      considerations: [
        "Requires strong performance in Language and Mathematics",
        "Other subjects still important for overall score",
        "Different from standard APS system",
      ],
    },
    "rhodes-average": {
      id: "rhodes-average",
      name: "Rhodes Percentage Average",
      description: "Simple average of all subject percentages",
      maxScore: 100,
      explanation:
        "Rhodes uses your average percentage across all subjects (excluding Life Orientation), typically requiring at least 50% average with specific subject requirements.",
      advantages: [
        "Simple and transparent calculation method",
        "Rewards consistent performance across subjects",
        "Easy to understand and calculate",
      ],
      considerations: [
        "No weighting for different subjects",
        "Requires consistent performance",
        "Some programs have specific subject requirements beyond the average",
      ],
    },
    "unisa-custom": {
      id: "unisa-custom",
      name: "UNISA Custom Ranking",
      description: "Subject minimums with space-based selection",
      maxScore: 100,
      explanation:
        "UNISA uses a combination of meeting subject-specific minimum requirements and space availability. Some qualifications have open access, others use competitive selection.",
      advantages: [
        "Many programs have open access",
        "Flexible entry requirements",
        "Distance learning opportunities",
      ],
      considerations: [
        "Selection varies by program and space availability",
        "Some programs are highly competitive",
        "Meeting minimums doesn't guarantee admission",
      ],
    },
    standard: {
      id: "standard",
      name: "Standard APS System",
      description: "Traditional 42-point South African system",
      maxScore: 42,
      explanation:
        "Uses the standard NSC achievement levels (7 = 80-100%, 6 = 70-79%, etc.) with a maximum of 42 points across 6 contributing subjects.",
      advantages: [
        "Standardized across most South African universities",
        "Easy to compare between institutions",
        "Well-understood by students and schools",
      ],
      considerations: [
        "May not reflect subject-specific requirements",
        "Some universities supplement with additional criteria",
        "Limited differentiation at higher performance levels",
      ],
    },
  };

  return systems[scoringSystem] || systems["standard"];
}

/**
 * Compare university scores and provide insights
 */
export function compareUniversityScores(scores: UniversityAPSResult[]): {
  bestPerformance: UniversityAPSResult[];
  needsImprovement: UniversityAPSResult[];
  eligibleCount: number;
  averagePerformance: number;
  insights: string[];
} {
  if (!scores || scores.length === 0) {
    return {
      bestPerformance: [],
      needsImprovement: [],
      eligibleCount: 0,
      averagePerformance: 0,
      insights: ["No university scores available for comparison."],
    };
  }

  const eligibleScores = scores.filter(
    (score) => score.score / score.maxScore >= 0.6, // 60% threshold for "eligible"
  );

  const sortedByPerformance = [...scores]
    .map((score) => ({
      ...score,
      percentage: (score.score / score.maxScore) * 100,
    }))
    .sort((a, b) => b.percentage - a.percentage);

  const bestPerformance = sortedByPerformance.slice(0, 3);
  const needsImprovement = sortedByPerformance
    .filter((score) => score.percentage < 60)
    .slice(0, 3);

  const averagePerformance =
    sortedByPerformance.reduce((sum, score) => sum + score.percentage, 0) /
    sortedByPerformance.length;

  const insights: string[] = [];

  // Performance insights
  if (averagePerformance >= 80) {
    insights.push(
      "Excellent performance across universities! You qualify for most competitive programs.",
    );
  } else if (averagePerformance >= 60) {
    insights.push(
      "Good performance overall. You qualify for many university programs.",
    );
  } else if (averagePerformance >= 40) {
    insights.push(
      "Moderate performance. Focus on improving key subjects for better opportunities.",
    );
  } else {
    insights.push(
      "Consider foundation programs or alternative pathways to improve your academic standing.",
    );
  }

  // Custom scoring insights
  const customScoringUniversities = scores.filter((score) =>
    [
      "uct-fps",
      "wits-composite",
      "stellenbosch-tpt",
      "rhodes-average",
      "unisa-custom",
    ].includes(score.universityId),
  );

  if (customScoringUniversities.length > 0) {
    insights.push(
      `${customScoringUniversities.length} universities use custom scoring that may provide different opportunities.`,
    );
  }

  // Subject-specific recommendations
  if (needsImprovement.length > 0) {
    insights.push(
      "Consider focusing on Mathematics and English to improve scores at universities with custom systems.",
    );
  }

  return {
    bestPerformance,
    needsImprovement,
    eligibleCount: eligibleScores.length,
    averagePerformance: Math.round(averagePerformance),
    insights,
  };
}

/**
 * Get recommendations based on university scores
 */
export function getUniversityRecommendations(scores: UniversityAPSResult[]): {
  category: string;
  title: string;
  message: string;
  universities: string[];
  actionItems: string[];
}[] {
  const comparison = compareUniversityScores(scores);
  const recommendations: {
    category: string;
    title: string;
    message: string;
    universities: string[];
    actionItems: string[];
  }[] = [];

  // Best opportunities
  if (comparison.bestPerformance.length > 0) {
    recommendations.push({
      category: "opportunities",
      title: "Best Opportunities",
      message:
        "You have strong scores at these universities and should apply with confidence.",
      universities: comparison.bestPerformance.map(
        (score) => score.universityName,
      ),
      actionItems: [
        "Prepare strong application materials",
        "Research specific program requirements",
        "Apply early to increase chances",
        "Consider backup programs at these universities",
      ],
    });
  }

  // Improvement areas
  if (comparison.needsImprovement.length > 0) {
    recommendations.push({
      category: "improvement",
      title: "Areas for Improvement",
      message: "Focus on these areas to expand your university options.",
      universities: comparison.needsImprovement.map(
        (score) => score.universityName,
      ),
      actionItems: [
        "Improve Mathematics and English marks",
        "Consider supplementary exams if available",
        "Look into foundation programs",
        "Explore alternative pathways",
      ],
    });
  }

  // Custom scoring opportunities
  const customScoringScores = scores.filter((score) =>
    ["uct", "wits", "stellenbosch", "rhodes", "unisa"].includes(
      score.universityId,
    ),
  );

  if (customScoringScores.length > 0) {
    const strongCustomScores = customScoringScores.filter(
      (score) => score.score / score.maxScore >= 0.6,
    );

    if (strongCustomScores.length > 0) {
      recommendations.push({
        category: "custom-scoring",
        title: "Custom Scoring Advantages",
        message:
          "These universities use special scoring systems that may work in your favor.",
        universities: strongCustomScores.map((score) => score.universityName),
        actionItems: [
          "Research these universities' unique admission requirements",
          "Understand how their scoring systems work",
          "Consider these as primary options",
          "Prepare for their specific application processes",
        ],
      });
    }
  }

  return recommendations;
}

/**
 * Format university score for display
 */
export function formatUniversityScore(score: UniversityAPSResult): string {
  const percentage = Math.round((score.score / score.maxScore) * 100);
  return `${score.score}/${score.maxScore} (${percentage}%)`;
}

/**
 * Get color class for score display
 */
export function getScoreColorClass(score: UniversityAPSResult): string {
  const percentage = (score.score / score.maxScore) * 100;

  if (percentage >= 80) return "text-green-600";
  if (percentage >= 60) return "text-blue-600";
  if (percentage >= 40) return "text-yellow-600";
  return "text-red-600";
}

/**
 * Get score level description
 */
export function getScoreLevelDescription(score: UniversityAPSResult): string {
  const percentage = (score.score / score.maxScore) * 100;

  if (percentage >= 80) return "Excellent - Strong chance of admission";
  if (percentage >= 60) return "Good - Likely to qualify";
  if (percentage >= 40) return "Moderate - May qualify for some programs";
  return "Below average - Consider foundation programs";
}

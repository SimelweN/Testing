import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calculator, GraduationCap, Info, TrendingUp } from "lucide-react";
import { APSSubject } from "@/types/university";
import { calculateUniversitySpecificAPS } from "@/services/universitySpecificAPSService";
import UniversitySpecificAPSDisplay from "@/components/university-info/UniversitySpecificAPSDisplay";
import {
  compareUniversityScores,
  getUniversityRecommendations,
} from "@/utils/universityScoringUtils";

/**
 * Demo page to test and showcase university-specific APS scoring
 * This demonstrates the comprehensive scoring system implementation
 */

const APSDemo: React.FC = () => {
  const [selectedExample, setSelectedExample] = useState<string>("excellent");

  // Example student profiles for testing
  const exampleProfiles: Record<string, APSSubject[]> = {
    excellent: [
      { name: "English", marks: 85, level: 6, points: 6 },
      { name: "Mathematics", marks: 92, level: 7, points: 7 },
      { name: "Physical Science", marks: 88, level: 6, points: 6 },
      { name: "Life Sciences", marks: 84, level: 6, points: 6 },
      { name: "Geography", marks: 81, level: 6, points: 6 },
      { name: "History", marks: 79, level: 5, points: 5 },
      { name: "Life Orientation", marks: 75, level: 5, points: 5 },
    ],
    good: [
      { name: "English", marks: 75, level: 5, points: 5 },
      { name: "Mathematics", marks: 78, level: 5, points: 5 },
      { name: "Physical Science", marks: 72, level: 5, points: 5 },
      { name: "Life Sciences", marks: 69, level: 4, points: 4 },
      { name: "Business Studies", marks: 74, level: 5, points: 5 },
      { name: "Economics", marks: 71, level: 5, points: 5 },
      { name: "Life Orientation", marks: 68, level: 4, points: 4 },
    ],
    moderate: [
      { name: "English", marks: 65, level: 4, points: 4 },
      { name: "Mathematical Literacy", marks: 68, level: 4, points: 4 },
      { name: "Business Studies", marks: 62, level: 4, points: 4 },
      { name: "Tourism", marks: 71, level: 5, points: 5 },
      { name: "Consumer Studies", marks: 66, level: 4, points: 4 },
      { name: "Drama", marks: 74, level: 5, points: 5 },
      { name: "Life Orientation", marks: 59, level: 3, points: 3 },
    ],
    struggling: [
      { name: "English", marks: 55, level: 3, points: 3 },
      { name: "Mathematical Literacy", marks: 52, level: 3, points: 3 },
      { name: "Business Studies", marks: 48, level: 2, points: 2 },
      { name: "Tourism", marks: 61, level: 4, points: 4 },
      { name: "Consumer Studies", marks: 46, level: 2, points: 2 },
      { name: "Agricultural Science", marks: 58, level: 3, points: 3 },
      { name: "Life Orientation", marks: 51, level: 3, points: 3 },
    ],
  };

  const currentSubjects = exampleProfiles[selectedExample];
  const apsCalculation = calculateUniversitySpecificAPS(currentSubjects);
  const comparison = compareUniversityScores(
    apsCalculation.universitySpecificScores,
  );
  const recommendations = getUniversityRecommendations(
    apsCalculation.universitySpecificScores,
  );

  const getProfileDescription = (profile: string) => {
    switch (profile) {
      case "excellent":
        return "High-achieving student with strong mathematics and science marks";
      case "good":
        return "Solid academic performance across core subjects";
      case "moderate":
        return "Average performance with some strengths in specific areas";
      case "struggling":
        return "Student facing academic challenges, needs support";
      default:
        return "";
    }
  };

  const getProfileColor = (profile: string) => {
    switch (profile) {
      case "excellent":
        return "text-green-600 bg-green-50 border-green-200";
      case "good":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "moderate":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "struggling":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            University-Specific APS Scoring Demo
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            See how different South African universities calculate admission
            scores for the same student profile. Each university uses their own
            unique methodology.
          </p>
        </div>

        {/* Profile Selection */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Choose Student Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.keys(exampleProfiles).map((profile) => (
                <Card
                  key={profile}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedExample === profile
                      ? getProfileColor(profile) + " border-2"
                      : "border"
                  }`}
                  onClick={() => setSelectedExample(profile)}
                >
                  <CardContent className="p-4">
                    <div className="text-center">
                      <h3 className="font-semibold capitalize mb-2">
                        {profile} Student
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        {getProfileDescription(profile)}
                      </p>
                      <Badge
                        variant={
                          selectedExample === profile ? "default" : "outline"
                        }
                      >
                        Standard APS: {apsCalculation.standardAPS}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Current Profile Summary */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Current Profile:{" "}
              {selectedExample.charAt(0).toUpperCase() +
                selectedExample.slice(1)}{" "}
              Student
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Subjects */}
              <div>
                <h3 className="font-semibold mb-3">Subject Results</h3>
                <div className="space-y-2">
                  {currentSubjects.map((subject, index) => (
                    <div
                      key={index}
                      className={`flex justify-between items-center p-2 rounded ${
                        subject.name.toLowerCase().includes("life orientation")
                          ? "bg-gray-100 text-gray-600"
                          : "bg-white border"
                      }`}
                    >
                      <span className="font-medium">{subject.name}</span>
                      <div className="flex items-center gap-2">
                        <span>{subject.marks}%</span>
                        <Badge variant="outline">
                          Level {subject.level} ({subject.points}pts)
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary Stats */}
              <div>
                <h3 className="font-semibold mb-3">Summary Statistics</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {apsCalculation.standardAPS}
                    </div>
                    <div className="text-sm text-blue-700">
                      Standard APS Score
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {comparison.eligibleCount}
                    </div>
                    <div className="text-sm text-green-700">
                      Universities where eligible (60%+)
                    </div>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {comparison.averagePerformance}%
                    </div>
                    <div className="text-sm text-purple-700">
                      Average Performance
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* University-Specific Scores */}
        <UniversitySpecificAPSDisplay
          universityScores={apsCalculation.universitySpecificScores}
          standardAPS={apsCalculation.standardAPS}
          className="mb-8"
        />

        {/* Insights and Recommendations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Performance Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Performance Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {comparison.insights.map((insight, index) => (
                <Alert key={index}>
                  <Info className="h-4 w-4" />
                  <AlertDescription>{insight}</AlertDescription>
                </Alert>
              ))}

              {/* Best Performance */}
              {comparison.bestPerformance.length > 0 && (
                <div>
                  <h4 className="font-semibold text-green-700 mb-2">
                    Best Performance Universities
                  </h4>
                  <div className="space-y-2">
                    {comparison.bestPerformance.map((score, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-2 bg-green-50 rounded"
                      >
                        <span className="font-medium">
                          {score.universityName}
                        </span>
                        <Badge className="bg-green-600">
                          {Math.round((score.score / score.maxScore) * 100)}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recommendations.map((rec, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    {rec.title}
                  </h4>
                  <p className="text-sm text-gray-600 mb-3">{rec.message}</p>

                  {rec.universities.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs text-gray-500 mb-1">
                        Universities:
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {rec.universities.map((uni, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="text-xs"
                          >
                            {uni}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="text-xs text-gray-500 mb-1">
                      Action Items:
                    </div>
                    <ul className="text-xs text-gray-700 space-y-1">
                      {rec.actionItems.slice(0, 3).map((item, idx) => (
                        <li key={idx} className="flex items-center gap-1">
                          <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Important Notice */}
        <Alert className="mb-8">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Important:</strong> This demo showcases the
            university-specific APS scoring system. Each university's scoring
            method is based on their official admission requirements.
            Universities with custom scoring systems cannot be directly compared
            with those using standard APS. Always verify current admission
            requirements with the universities directly.
          </AlertDescription>
        </Alert>

        {/* Technical Details */}
        <Card>
          <CardHeader>
            <CardTitle>Implementation Details</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-600 space-y-2">
            <p>
              <strong>UCT:</strong> Uses Faculty Points Score (FPS) with 9-point
              scale for top 6 subjects
            </p>
            <p>
              <strong>Wits:</strong> Calculates composite score with
              program-specific weightings
            </p>
            <p>
              <strong>Stellenbosch:</strong> Uses TPT with weighted key subjects
              (Language 25%, Maths 25%, Others 50%)
            </p>
            <p>
              <strong>Rhodes:</strong> Simple percentage average across all
              subjects
            </p>
            <p>
              <strong>UNISA:</strong> Custom ranking based on subject minimums
              and space availability
            </p>
            <p>
              <strong>Others:</strong> Standard South African APS system
              (42-point scale)
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default APSDemo;

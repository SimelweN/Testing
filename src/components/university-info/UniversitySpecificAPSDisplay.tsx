import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  GraduationCap,
  Info,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Calculator,
  Building,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UniversityAPSResult } from "@/types/university";
import {
  getUniversityScoringMethodology,
  usesCustomScoring,
} from "@/services/universitySpecificAPSService";

interface UniversitySpecificAPSDisplayProps {
  universityScores: UniversityAPSResult[];
  standardAPS: number;
  className?: string;
  selectedUniversities?: string[];
  onUniversitySelect?: (universityId: string) => void;
}

interface APSScoreCardProps {
  score: UniversityAPSResult;
  isSelected?: boolean;
  onClick?: () => void;
  showDetails?: boolean;
}

const APSScoreCard: React.FC<APSScoreCardProps> = ({
  score,
  isSelected = false,
  onClick,
  showDetails = false,
}) => {
  const [showMethodology, setShowMethodology] = useState(false);
  const navigate = useNavigate();

  const percentage = Math.round((score.score / score.maxScore) * 100);
  const isCustomScoring = usesCustomScoring(score.universityId);

  const handleUniversityNameClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card onClick
    // Pass APS context through URL parameter to ensure it's preserved
    navigate(
      `/university/${score.universityId}?fromAPS=true&aps=${score.score}`,
    );
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 60) return "text-blue-600";
    if (percentage >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreLevel = (percentage: number) => {
    if (percentage >= 80) return "Excellent";
    if (percentage >= 60) return "Good";
    if (percentage >= 40) return "Moderate";
    return "Below Average";
  };

  return (
    <Card
      className={cn(
        "transition-all duration-200 hover:shadow-md cursor-pointer",
        isSelected && "ring-2 ring-blue-500 shadow-md",
        onClick && "hover:shadow-lg",
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <Building className="h-4 w-4" />
              <button
                onClick={handleUniversityNameClick}
                className="text-left hover:text-blue-600 hover:underline transition-colors duration-200 font-semibold"
                title={`View ${score.universityName} profile`}
              >
                {score.universityName}
              </button>
              {isCustomScoring && (
                <Badge variant="secondary" className="text-xs">
                  Custom Scoring
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="mt-1">
              {score.explanation}
            </CardDescription>
          </div>

          <div className="text-right ml-4">
            <div
              className={cn("text-2xl font-bold", getScoreColor(percentage))}
            >
              {score.score}
              <span className="text-sm text-gray-500">/{score.maxScore}</span>
            </div>
            <Badge
              variant={percentage >= 60 ? "default" : "secondary"}
              className="text-xs"
            >
              {getScoreLevel(percentage)}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span>Score Progress</span>
              <span>{percentage}%</span>
            </div>
            <Progress
              value={percentage}
              className="h-2"
              indicatorClassName={cn(
                percentage >= 80
                  ? "bg-green-500"
                  : percentage >= 60
                    ? "bg-blue-500"
                    : percentage >= 40
                      ? "bg-yellow-500"
                      : "bg-red-500",
              )}
            />
          </div>

          <Alert className="py-2">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {score.methodology}
            </AlertDescription>
          </Alert>

          {/* View Programs Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Pass APS context to ensure personalized experience
              navigate(
                `/university/${score.universityId}?fromAPS=true&aps=${score.score}`,
              );
            }}
            className="w-full border-book-600 text-book-600 hover:bg-book-50"
          >
            <GraduationCap className="h-4 w-4 mr-2" />
            View Programs
          </Button>

          {showDetails && (
            <div className="pt-2 border-t">
              <Dialog open={showMethodology} onOpenChange={setShowMethodology}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full">
                    <Calculator className="h-4 w-4 mr-2" />
                    View Calculation Details
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5" />
                      {score.universityName} Scoring System
                    </DialogTitle>
                    <DialogDescription>
                      Detailed explanation of how your score was calculated
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium mb-2">Your Score</h4>
                      <div className="text-3xl font-bold text-blue-600">
                        {score.score}/{score.maxScore}
                      </div>
                      <p className="text-gray-600 mt-1">{score.explanation}</p>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Calculator className="h-4 w-4" />
                        Methodology
                      </h4>
                      <p className="text-gray-700 leading-relaxed">
                        {getUniversityScoringMethodology(score.universityId)}
                      </p>
                    </div>

                    {isCustomScoring && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Important:</strong> This university uses a
                          custom scoring system that differs from the standard
                          South African APS. The score shown above is specific
                          to {score.universityName} and cannot be compared
                          directly with other universities.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const UniversitySpecificAPSDisplay: React.FC<
  UniversitySpecificAPSDisplayProps
> = ({
  universityScores,
  standardAPS,
  className,
  selectedUniversities = [],
  onUniversitySelect,
}) => {
  const [showAllScores, setShowAllScores] = useState(false);

  if (!universityScores || universityScores.length === 0) {
    return (
      <Card className={cn("shadow-sm border border-gray-200", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl text-gray-900">
            <Calculator className="h-5 w-5 text-book-600" />
            University-Specific Scores
          </CardTitle>
          <CardDescription>
            Calculate your subjects first to see university-specific scores
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="border-book-200 bg-book-50">
            <Info className="h-4 w-4 text-book-600" />
            <AlertDescription className="text-book-800">
              Add your subject marks above to see how different South African
              universities calculate your admission scores.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Separate custom scoring from standard APS universities
  const customScoringUniversities = universityScores.filter((score) =>
    usesCustomScoring(score.universityId),
  );

  const standardAPSUniversities = universityScores.filter(
    (score) => !usesCustomScoring(score.universityId),
  );

  const displayedScores = showAllScores
    ? universityScores
    : universityScores.slice(0, 6);

  return (
    <div className={cn("space-y-8", className)}>
      {/* Header with summary */}
      <Card className="shadow-sm border border-gray-200 bg-gradient-to-r from-book-50 to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl text-gray-900">
            <GraduationCap className="h-5 w-5 text-book-600" />
            University-Specific APS Scores
          </CardTitle>
          <CardDescription className="text-gray-700">
            Different universities use different scoring systems. Here's how you
            qualify for each:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-blue-200">
              <div className="text-3xl font-bold text-book-600">
                {standardAPS}
              </div>
              <div className="text-sm font-medium text-gray-700 mt-1">
                Standard APS
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Used by most universities
              </div>
            </div>
            <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-green-200">
              <div className="text-3xl font-bold text-green-600">
                {customScoringUniversities.length}
              </div>
              <div className="text-sm font-medium text-gray-700 mt-1">
                Custom Systems
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Universities with unique scoring
              </div>
            </div>
            <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-purple-200">
              <div className="text-3xl font-bold text-purple-600">
                {universityScores.length}
              </div>
              <div className="text-sm font-medium text-gray-700 mt-1">
                Total Universities
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Scored for comparison
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custom Scoring Universities */}
      {customScoringUniversities.length > 0 && (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h3 className="text-xl font-bold text-gray-900 flex items-center justify-center gap-2">
              <TrendingUp className="h-6 w-6 text-book-600" />
              Universities with Custom Scoring Systems
            </h3>
            <p className="text-gray-600">
              These universities use unique scoring methods that may work in
              your favor
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {customScoringUniversities.map((score) => (
              <APSScoreCard
                key={score.universityId}
                score={score}
                isSelected={selectedUniversities.includes(score.universityId)}
                onClick={() => onUniversitySelect?.(score.universityId)}
                showDetails={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Standard APS Universities */}
      {standardAPSUniversities.length > 0 && (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h3 className="text-xl font-bold text-gray-900 flex items-center justify-center gap-2">
              <CheckCircle className="h-6 w-6 text-book-600" />
              Universities Using Standard APS System
            </h3>
            <p className="text-gray-600">
              These universities use the traditional 42-point APS calculation
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {(showAllScores
              ? standardAPSUniversities
              : standardAPSUniversities.slice(0, 6)
            ).map((score) => (
              <APSScoreCard
                key={score.universityId}
                score={score}
                isSelected={selectedUniversities.includes(score.universityId)}
                onClick={() => onUniversitySelect?.(score.universityId)}
                showDetails={false}
              />
            ))}
          </div>

          {standardAPSUniversities.length > 6 && (
            <div className="text-center mt-6">
              <Button
                variant="outline"
                onClick={() => setShowAllScores(!showAllScores)}
                className="bg-white hover:bg-gray-50 border-gray-300"
              >
                <Eye className="h-4 w-4 mr-2" />
                {showAllScores
                  ? "Show Less"
                  : `Show All ${standardAPSUniversities.length} Universities`}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Important Notice */}
      <Alert className="border-amber-200 bg-amber-50">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          <strong>Important:</strong> Universities with custom scoring systems
          cannot be directly compared with those using standard APS. Each
          university's score is calculated according to their specific
          requirements and should be interpreted within that context.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default UniversitySpecificAPSDisplay;

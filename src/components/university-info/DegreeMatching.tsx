import { useState, useMemo } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle,
  AlertCircle,
  GraduationCap,
  Clock,
  BookOpen,
  TrendingUp,
} from "lucide-react";
import { APSCalculation, EligibleDegree } from "@/types/university";

interface DegreeMatchingProps {
  calculation: APSCalculation;
  onViewBooks: (universityId: string, degreeId?: string) => void;
}

const DegreeMatching = ({ calculation, onViewBooks }: DegreeMatchingProps) => {
  const [selectedFaculty, setSelectedFaculty] = useState<string>("");
  const [selectedUniversity, setSelectedUniversity] = useState<string>("");

  const eligibleDegrees = calculation.eligibleDegrees.filter(
    (ed) => ed.meetsRequirement,
  );
  const almostEligibleDegrees = calculation.eligibleDegrees
    .filter((ed) => !ed.meetsRequirement && ed.apsGap && ed.apsGap <= 5)
    .sort((a, b) => (a.apsGap || 0) - (b.apsGap || 0));

  const faculties = useMemo(() => {
    const facultySet = new Set(
      calculation.eligibleDegrees.map((ed) => ed.degree.faculty),
    );
    return Array.from(facultySet).sort();
  }, [calculation.eligibleDegrees]);

  const universities = useMemo(() => {
    const universitySet = new Set(
      calculation.eligibleDegrees.map((ed) => ed.university.name),
    );
    return Array.from(universitySet).sort();
  }, [calculation.eligibleDegrees]);

  const filteredEligibleDegrees = useMemo(() => {
    return eligibleDegrees.filter((ed) => {
      const matchesFaculty =
        !selectedFaculty || ed.degree.faculty === selectedFaculty;
      const matchesUniversity =
        !selectedUniversity || ed.university.name === selectedUniversity;
      return matchesFaculty && matchesUniversity;
    });
  }, [eligibleDegrees, selectedFaculty, selectedUniversity]);

  const DegreeCard = ({
    eligibleDegree,
    isAlmostEligible = false,
  }: {
    eligibleDegree: EligibleDegree;
    isAlmostEligible?: boolean;
  }) => (
    <Card
      className={`hover:shadow-md transition-shadow ${isAlmostEligible ? "border-orange-200 bg-orange-50" : "border-green-200 bg-green-50"}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              {isAlmostEligible ? (
                <AlertCircle className="h-5 w-5 text-orange-600" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-600" />
              )}
              {eligibleDegree.degree.name}
            </CardTitle>
            <CardDescription className="text-gray-600 mt-1">
              {eligibleDegree.university.name} (
              {eligibleDegree.university.abbreviation})
            </CardDescription>
          </div>
          <Badge
            variant={isAlmostEligible ? "destructive" : "default"}
            className="ml-2"
          >
            {eligibleDegree.degree.apsRequirement} APS
          </Badge>
        </div>

        {isAlmostEligible && eligibleDegree.apsGap && (
          <div className="bg-orange-100 border border-orange-200 rounded p-2 mt-2">
            <span className="text-sm text-orange-800">
              You need {eligibleDegree.apsGap} more APS points to qualify
            </span>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">
          {eligibleDegree.degree.description}
        </p>

        {/* Degree Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600">Faculty:</span>
            <span className="font-medium">{eligibleDegree.degree.faculty}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600">Duration:</span>
            <span className="font-medium">
              {eligibleDegree.degree.duration}
            </span>
          </div>
        </div>

        {/* Required Subjects */}
        <div>
          <h4 className="text-sm font-medium text-gray-800 mb-2">
            Required Subjects:
          </h4>
          <div className="flex flex-wrap gap-1">
            {eligibleDegree.degree.subjects.map((subject, index) => (
              <Badge
                key={index}
                variant={subject.isRequired ? "default" : "secondary"}
                className="text-xs"
              >
                {subject.name} (Level {subject.level}
                {subject.isRequired ? "*" : ""})
              </Badge>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">* Required subjects</p>
        </div>

        {/* Career Prospects */}
        <div>
          <h4 className="text-sm font-medium text-gray-800 mb-2 flex items-center gap-1">
            <TrendingUp className="h-4 w-4" />
            Career Prospects:
          </h4>
          <div className="flex flex-wrap gap-1">
            {eligibleDegree.degree.careerProspects
              .slice(0, 3)
              .map((career, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {career}
                </Badge>
              ))}
            {eligibleDegree.degree.careerProspects.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{eligibleDegree.degree.careerProspects.length - 3} more
              </Badge>
            )}
          </div>
        </div>

        {/* Action Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            onViewBooks(eligibleDegree.university.id, eligibleDegree.degree.id)
          }
          className="w-full"
        >
          <BookOpen className="h-4 w-4 mr-2" />
          View Textbooks for this Program
        </Button>
      </CardContent>
    </Card>
  );

  if (calculation.totalScore === 0) {
    return (
      <div className="text-center py-12">
        <GraduationCap className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Complete Your APS Calculation
        </h3>
        <p className="text-gray-600">
          Calculate your APS score first to see which degree programs you
          qualify for.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-book-800">
          Degree Programs for You
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Based on your APS score of {calculation.totalScore} points, here are
          the degree programs you qualify for.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-green-600">
              {eligibleDegrees.length}
            </div>
            <div className="text-sm text-gray-600">
              Programs You Qualify For
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {almostEligibleDegrees.length}
            </div>
            <div className="text-sm text-gray-600">
              Almost Eligible (≤5 points)
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-book-600">
              {calculation.totalScore}
            </div>
            <div className="text-sm text-gray-600">Your APS Score</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="eligible" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="eligible" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Eligible Programs ({eligibleDegrees.length})
          </TabsTrigger>
          <TabsTrigger value="almost" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Almost Eligible ({almostEligibleDegrees.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="eligible" className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Select
              value={selectedFaculty || "all"}
              onValueChange={(value) =>
                setSelectedFaculty(value === "all" ? "" : value)
              }
            >
              <SelectTrigger className="sm:w-48">
                <SelectValue placeholder="Filter by faculty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Faculties</SelectItem>
                {faculties.map((faculty) => (
                  <SelectItem key={faculty} value={faculty}>
                    {faculty}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedUniversity || "all"}
              onValueChange={(value) =>
                setSelectedUniversity(value === "all" ? "" : value)
              }
            >
              <SelectTrigger className="sm:w-64">
                <SelectValue placeholder="Filter by university" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Universities</SelectItem>
                {universities.map((university) => (
                  <SelectItem key={university} value={university}>
                    {university}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Eligible Degrees Grid */}
          {filteredEligibleDegrees.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredEligibleDegrees.map((eligibleDegree, index) => (
                <DegreeCard key={index} eligibleDegree={eligibleDegree} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">
                No programs match your current filters.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedFaculty("");
                  setSelectedUniversity("");
                }}
                className="mt-4"
              >
                Clear Filters
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="almost" className="space-y-6">
          {almostEligibleDegrees.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {almostEligibleDegrees.map((eligibleDegree, index) => (
                <DegreeCard
                  key={index}
                  eligibleDegree={eligibleDegree}
                  isAlmostEligible
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Great APS Score!
              </h3>
              <p className="text-gray-600">
                You qualify for most programs with your current APS score. No
                programs are just out of reach.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DegreeMatching;

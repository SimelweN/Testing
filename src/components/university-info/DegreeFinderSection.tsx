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
import { Input } from "@/components/ui/input";
import {
  CheckCircle,
  AlertCircle,
  GraduationCap,
  Clock,
  BookOpen,
  TrendingUp,
  Search,
  Filter,
  Target,
  Award,
  Users,
  MapPin,
  DollarSign,
} from "lucide-react";
import { APSCalculation, EligibleDegree } from "@/types/university";

interface DegreeFinderSectionProps {
  calculation: APSCalculation | null;
  onViewBooks: (universityId: string, degreeId?: string) => void;
}

const DegreeFinderSection = ({
  calculation,
  onViewBooks,
}: DegreeFinderSectionProps) => {
  const [selectedFaculty, setSelectedFaculty] = useState<string>("");
  const [selectedUniversity, setSelectedUniversity] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"aps" | "alphabetical">("aps");

  // Calculate derived data, safe for all render paths
  const eligibleDegrees = useMemo(() => {
    if (!calculation) return [];
    return calculation.eligibleDegrees.filter((ed) => ed.meetsRequirement);
  }, [calculation]);

  const almostEligibleDegrees = useMemo(() => {
    if (!calculation) return [];
    return calculation.eligibleDegrees
      .filter((ed) => !ed.meetsRequirement && ed.apsGap && ed.apsGap <= 5)
      .sort((a, b) => (a.apsGap || 0) - (b.apsGap || 0));
  }, [calculation]);

  const faculties = useMemo(() => {
    if (!calculation) return [];
    const facultySet = new Set(
      calculation.eligibleDegrees.map((ed) => ed.degree.faculty),
    );
    return Array.from(facultySet).sort();
  }, [calculation]);

  const universities = useMemo(() => {
    if (!calculation) return [];
    const universitySet = new Set(
      calculation.eligibleDegrees.map((ed) => ed.university.name),
    );
    return Array.from(universitySet).sort();
  }, [calculation]);

  const filteredEligibleDegrees = useMemo(() => {
    const filtered = eligibleDegrees.filter((ed) => {
      const matchesFaculty =
        !selectedFaculty || ed.degree.faculty === selectedFaculty;
      const matchesUniversity =
        !selectedUniversity || ed.university.name === selectedUniversity;
      const matchesSearch =
        !searchQuery ||
        ed.degree.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ed.degree.description
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        ed.university.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFaculty && matchesUniversity && matchesSearch;
    });

    if (sortBy === "aps") {
      filtered.sort(
        (a, b) => a.degree.apsRequirement - b.degree.apsRequirement,
      );
    } else {
      filtered.sort((a, b) => a.degree.name.localeCompare(b.degree.name));
    }

    return filtered;
  }, [
    eligibleDegrees,
    selectedFaculty,
    selectedUniversity,
    searchQuery,
    sortBy,
  ]);

  const DegreeCard = ({
    eligibleDegree,
    isAlmostEligible = false,
  }: {
    eligibleDegree: EligibleDegree;
    isAlmostEligible?: boolean;
  }) => (
    <Card
      className={`group hover:shadow-xl transition-all duration-300 ${
        isAlmostEligible
          ? "border-orange-200 bg-gradient-to-br from-orange-50 to-red-50"
          : "border-green-200 bg-gradient-to-br from-green-50 to-emerald-50"
      }`}
    >
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2 group-hover:text-indigo-600 transition-colors">
              {isAlmostEligible ? (
                <AlertCircle className="h-5 w-5 text-orange-600" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-600" />
              )}
              {eligibleDegree.degree.name}
            </CardTitle>
            <CardDescription className="text-gray-600 mt-1 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {eligibleDegree.university.name} (
              {eligibleDegree.university.abbreviation})
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge
              variant={isAlmostEligible ? "destructive" : "default"}
              className="ml-2"
            >
              {eligibleDegree.degree.apsRequirement} APS
            </Badge>
            {!isAlmostEligible && (
              <Badge
                variant="outline"
                className="text-xs bg-green-100 text-green-700 border-green-300"
              >
                ✓ Qualified
              </Badge>
            )}
          </div>
        </div>

        {isAlmostEligible && eligibleDegree.apsGap && (
          <div className="bg-orange-100 border border-orange-200 rounded-lg p-3 mt-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-800">
                You need {eligibleDegree.apsGap} more APS points to qualify
              </span>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-gray-700 leading-relaxed">
          {eligibleDegree.degree.description}
        </p>

        {/* Degree Details */}
        <div className="grid grid-cols-2 gap-4 text-sm bg-white/50 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600">Faculty:</span>
            <span className="font-medium text-gray-800">
              {eligibleDegree.degree.faculty}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600">Duration:</span>
            <span className="font-medium text-gray-800">
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
                className={`text-xs ${
                  subject.isRequired
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
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
                <Badge
                  key={index}
                  variant="outline"
                  className="text-xs border-purple-200 text-purple-700 bg-purple-50"
                >
                  {career}
                </Badge>
              ))}
            {eligibleDegree.degree.careerProspects.length > 3 && (
              <Badge
                variant="outline"
                className="text-xs border-purple-200 text-purple-700 bg-purple-50"
              >
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
          className="w-full group-hover:bg-indigo-50 group-hover:border-indigo-300 group-hover:text-indigo-700"
        >
          <BookOpen className="h-4 w-4 mr-2" />
          View Textbooks for this Program
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <section id="degrees" className="py-16 bg-book-50">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-4xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-book-100 rounded-full text-book-700 text-sm font-medium mb-6">
            <Award className="h-4 w-4" />
            Degree Programs for You
          </div>
          <h2 className="text-4xl font-bold mb-6">
            <span className="text-book-600">Your Eligible</span>
            <br />
            <span className="text-gray-900">Degree Programs</span>
          </h2>
          <p className="text-xl text-gray-600 leading-relaxed mb-8">
            Based on your APS score of {calculation.totalScore} points, here are
            the degree programs you qualify for.
          </p>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white/60 backdrop-blur-sm border-green-200">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-green-600 mb-1">
                  {eligibleDegrees.length}
                </div>
                <div className="text-sm text-gray-600">
                  Programs You Qualify For
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/60 backdrop-blur-sm border-orange-200">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-orange-600 mb-1">
                  {almostEligibleDegrees.length}
                </div>
                <div className="text-sm text-gray-600">
                  Almost Eligible (≤5 points)
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/60 backdrop-blur-sm border-purple-200">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-purple-600 mb-1">
                  {calculation.totalScore}
                </div>
                <div className="text-sm text-gray-600">Your APS Score</div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Tabs defaultValue="eligible" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 bg-white/60 backdrop-blur-sm">
            <TabsTrigger
              value="eligible"
              className="flex items-center gap-2 data-[state=active]:bg-green-100 data-[state=active]:text-green-800"
            >
              <CheckCircle className="h-4 w-4" />
              Eligible Programs ({eligibleDegrees.length})
            </TabsTrigger>
            <TabsTrigger
              value="almost"
              className="flex items-center gap-2 data-[state=active]:bg-orange-100 data-[state=active]:text-orange-800"
            >
              <AlertCircle className="h-4 w-4" />
              Almost Eligible ({almostEligibleDegrees.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="eligible" className="space-y-8">
            {/* Search and Filters */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5 text-purple-600" />
                  Find Your Perfect Program
                </CardTitle>
                <CardDescription>
                  Filter and search through your eligible degree programs to
                  find the best match.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search programs..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 border-gray-200 focus:border-purple-400"
                    />
                  </div>

                  <Select
                    value={selectedFaculty || "all"}
                    onValueChange={(value) =>
                      setSelectedFaculty(value === "all" ? "" : value)
                    }
                  >
                    <SelectTrigger className="border-gray-200 focus:border-purple-400">
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
                    <SelectTrigger className="border-gray-200 focus:border-purple-400">
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

                  <Select
                    value={sortBy}
                    onValueChange={(value: "aps" | "alphabetical") =>
                      setSortBy(value)
                    }
                  >
                    <SelectTrigger className="border-gray-200 focus:border-purple-400">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aps">
                        Sort by APS Requirement
                      </SelectItem>
                      <SelectItem value="alphabetical">
                        Sort Alphabetically
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Showing {filteredEligibleDegrees.length} programs</span>
                  {(selectedFaculty || selectedUniversity || searchQuery) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedFaculty("");
                        setSelectedUniversity("");
                        setSearchQuery("");
                      }}
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Eligible Degrees Grid */}
            {filteredEligibleDegrees.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredEligibleDegrees.map((eligibleDegree, index) => (
                  <DegreeCard key={index} eligibleDegree={eligibleDegree} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No programs found
                </h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your search terms or filters.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedFaculty("");
                    setSelectedUniversity("");
                    setSearchQuery("");
                  }}
                >
                  Clear All Filters
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="almost" className="space-y-8">
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
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Excellent APS Score!
                </h3>
                <p className="text-gray-600">
                  You qualify for most programs with your current APS score. No
                  programs are just out of reach.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <Card className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-0">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4">Ready to Apply?</h3>
              <p className="text-purple-100 mb-6 max-w-2xl mx-auto">
                Now that you know which programs you qualify for, explore
                bursary opportunities and start browsing textbooks from students
                at your chosen universities.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  size="lg"
                  onClick={() =>
                    document
                      .getElementById("bursaries")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="bg-white text-purple-600 hover:bg-gray-100 font-semibold"
                >
                  <DollarSign className="h-5 w-5 mr-2" />
                  Find Bursaries
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() =>
                    document
                      .getElementById("campus-books")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="border-white text-white hover:bg-white/10"
                >
                  <BookOpen className="h-5 w-5 mr-2" />
                  Browse Textbooks
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default DegreeFinderSection;

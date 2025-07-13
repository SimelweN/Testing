import React, { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import {
  GraduationCap,
  Building,
  Clock,
  Users,
  Trophy,
  BarChart3,
  Eye,
  Filter,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  MapPin,
  Calendar,
  Loader2,
  Star,
  BookOpen,
  Target,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  groupProgramsByFaculty,
  calculateFacultyStats,
  getSortedFacultiesWithCounts,
  getFacultyColor,
  generateFacultyOverview,
  normalizeFacultyName,
} from "@/utils/facultyGroupingUtils";

interface Program {
  id: string;
  name: string;
  faculty: string;
  universityName: string;
  universityId: string;
  duration: string;
  apsRequirement: number;
  eligible: boolean;
  apsGap?: number;
  subjects?: Array<{
    name: string;
    level: number;
    isRequired: boolean;
  }>;
  careerProspects?: string[];
  description?: string;
}

interface Statistics {
  total: number;
  eligible: number;
  almostEligible: number;
  eligibilityRate: number;
}

interface EligibleProgramsSectionProps {
  programs: Program[];
  statistics: Statistics;
  availableFaculties: string[];
  facultyFilter: string;
  setFacultyFilter: (faculty: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  includeAlmostQualified: boolean;
  setIncludeAlmostQualified: (include: boolean) => void;
  onProgramSelect: (program: Program) => void;
  onRefresh: () => void;
  isLoading: boolean;
}

const EligibleProgramsSection: React.FC<EligibleProgramsSectionProps> = ({
  programs,
  statistics,
  availableFaculties,
  facultyFilter,
  setFacultyFilter,
  sortBy,
  setSortBy,
  includeAlmostQualified,
  setIncludeAlmostQualified,
  onProgramSelect,
  onRefresh,
  isLoading,
}) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedFacultyTab, setSelectedFacultyTab] = useState<string>("all");

  // Group programs by faculty using utility functions
  const programsByFaculty = useMemo(() => {
    return groupProgramsByFaculty(programs);
  }, [programs]);

  // Get faculty counts and statistics
  const facultyCounts = useMemo(() => {
    return calculateFacultyStats(programsByFaculty);
  }, [programsByFaculty]);

  // Get sorted faculties for better organization
  const sortedFaculties = useMemo(() => {
    return getSortedFacultiesWithCounts(facultyCounts, "total");
  }, [facultyCounts]);

  // Get filtered programs based on selected faculty tab
  const displayedPrograms = useMemo(() => {
    if (selectedFacultyTab === "all") {
      return programs;
    }
    return programsByFaculty[selectedFacultyTab] || [];
  }, [programs, programsByFaculty, selectedFacultyTab]);

  const ProgramCard: React.FC<{ program: Program }> = ({ program }) => {
    const eligibilityColor = program.eligible
      ? "text-green-600 bg-green-50 border-green-200"
      : "text-red-600 bg-red-50 border-red-200";

    const apsGapColor =
      program.apsGap && program.apsGap <= 3
        ? "text-yellow-600"
        : "text-red-600";

    return (
      <Card
        className="transition-all duration-200 hover:shadow-md cursor-pointer border"
        onClick={() => onProgramSelect(program)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg text-gray-900 line-clamp-2">
                {program.name}
              </CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <Building className="h-3 w-3" />
                {program.universityName}
                <span>•</span>
                <Badge variant="outline" className="text-xs">
                  {program.faculty}
                </Badge>
              </CardDescription>
            </div>
            <Badge className={cn("ml-2", eligibilityColor)} variant="outline">
              {program.eligible ? (
                <CheckCircle className="w-3 h-3 mr-1" />
              ) : (
                <AlertTriangle className="w-3 h-3 mr-1" />
              )}
              {program.eligible ? "Qualified" : "Not Qualified"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="space-y-3">
            {/* Program Details */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-1 text-gray-600">
                <Clock className="h-3 w-3" />
                <span>{program.duration}</span>
              </div>
              <div className="flex items-center gap-1 text-gray-600">
                <BarChart3 className="h-3 w-3" />
                <span>APS: {program.apsRequirement}</span>
              </div>
            </div>

            {/* APS Gap Warning */}
            {!program.eligible && program.apsGap && program.apsGap > 0 && (
              <div className={`text-sm ${apsGapColor} flex items-center gap-1`}>
                <AlertTriangle className="h-3 w-3" />
                <span>Need {program.apsGap} more APS points</span>
              </div>
            )}

            {/* Subject Requirements Preview */}
            {program.subjects && program.subjects.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {program.subjects.slice(0, 3).map((subject, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {subject.name}: L{subject.level}
                  </Badge>
                ))}
                {program.subjects.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{program.subjects.length - 3} more
                  </Badge>
                )}
              </div>
            )}

            {/* Action Button */}
            <Button
              size="sm"
              className="w-full"
              variant={program.eligible ? "default" : "outline"}
            >
              <Eye className="w-3 h-3 mr-1" />
              View Details
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Card className="bg-white shadow-sm border border-gray-200">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl text-gray-900">
              <Target className="h-5 w-5 text-book-600" />
              Program Search Results
            </CardTitle>
            <CardDescription>
              Programs you may qualify for organized by faculty
            </CardDescription>
          </div>

          {/* Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              <Filter className="w-4 h-4 mr-1" />
              Filters
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg mt-4">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Faculty Filter
              </Label>
              <Select value={facultyFilter} onValueChange={setFacultyFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Faculties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Faculties</SelectItem>
                  {availableFaculties.map((faculty) => (
                    <SelectItem key={faculty} value={faculty}>
                      {faculty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Sort By
              </Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="eligibility">Eligibility</SelectItem>
                  <SelectItem value="aps">APS Requirement</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="almost-qualified"
                checked={includeAlmostQualified}
                onCheckedChange={setIncludeAlmostQualified}
              />
              <Label htmlFor="almost-qualified" className="text-sm">
                Include Almost Qualified
              </Label>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="text-2xl font-bold text-green-800">
              {statistics.eligible}
            </div>
            <div className="text-sm text-green-600">Eligible</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="text-2xl font-bold text-yellow-800">
              {statistics.almostEligible}
            </div>
            <div className="text-sm text-yellow-600">Almost Eligible</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-2xl font-bold text-blue-800">
              {statistics.total}
            </div>
            <div className="text-sm text-blue-600">Total Found</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
            <div className="text-2xl font-bold text-purple-800">
              {statistics.eligibilityRate}%
            </div>
            <div className="text-sm text-purple-600">Success Rate</div>
          </div>
        </div>

        {/* Faculty Overview */}
        <div className="mb-6 p-4 bg-gradient-to-r from-book-50 to-blue-50 rounded-lg border">
          <p className="text-sm text-gray-700 text-center">
            {generateFacultyOverview(programsByFaculty, facultyCounts)}
          </p>
        </div>

        {/* Faculty Tabs */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2 border-b">
            <Button
              variant={selectedFacultyTab === "all" ? "default" : "ghost"}
              size="sm"
              onClick={() => setSelectedFacultyTab("all")}
              className="rounded-b-none"
            >
              <Target className="w-3 h-3 mr-1" />
              All Programs ({statistics.total})
            </Button>
            {sortedFaculties.map(({ name: faculty, stats }) => {
              const colors = getFacultyColor(faculty);
              return (
                <Button
                  key={faculty}
                  variant={selectedFacultyTab === faculty ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedFacultyTab(faculty)}
                  className={cn(
                    "rounded-b-none",
                    selectedFacultyTab === faculty &&
                      `${colors.bg} ${colors.text} border-t-2 ${colors.border}`,
                  )}
                >
                  {faculty} ({stats.total})
                  {stats.eligible > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-1 bg-green-100 text-green-800 text-xs"
                    >
                      {stats.eligible}
                    </Badge>
                  )}
                  {stats.eligibilityRate > 0 && (
                    <span className="ml-1 text-xs opacity-75">
                      {stats.eligibilityRate}%
                    </span>
                  )}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Programs Grid */}
        {displayedPrograms.length === 0 ? (
          <div className="text-center py-12">
            <GraduationCap className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No programs found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {selectedFacultyTab === "all"
                ? "Try adjusting your filters or add more subjects."
                : `No programs found in ${selectedFacultyTab} faculty.`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedPrograms.map((program, index) => (
              <ProgramCard key={`${program.id}-${index}`} program={program} />
            ))}
          </div>
        )}

        {/* Faculty Performance Summary */}
        {selectedFacultyTab !== "all" && facultyCounts[selectedFacultyTab] && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-book-600" />
                <span className="font-medium text-gray-900">
                  {selectedFacultyTab} Faculty
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>
                  <strong>{facultyCounts[selectedFacultyTab].eligible}</strong>{" "}
                  of <strong>{facultyCounts[selectedFacultyTab].total}</strong>{" "}
                  programs
                </span>
                <Badge
                  variant="outline"
                  className={cn(
                    facultyCounts[selectedFacultyTab].eligibilityRate >= 50
                      ? "text-green-700 border-green-300"
                      : "text-yellow-700 border-yellow-300",
                  )}
                >
                  {facultyCounts[selectedFacultyTab].eligibilityRate}% Success
                  Rate
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Program count info */}
        {displayedPrograms.length > 12 && (
          <div className="text-center mt-6">
            <p className="text-sm text-gray-600">
              Showing all {displayedPrograms.length} programs
              {selectedFacultyTab !== "all" && ` in ${selectedFacultyTab}`}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EligibleProgramsSection;

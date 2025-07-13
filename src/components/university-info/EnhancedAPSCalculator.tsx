import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Calculator,
  GraduationCap,
  TrendingUp,
  Target,
  BarChart3,
  Building,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  BookOpen,
  Lightbulb,
  Filter,
  Calendar,
  Trophy,
  MapPin,
  Eye,
  Users,
  Clock,
  Star,
  X,
  Plus,
  Loader2,
  Info,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SOUTH_AFRICAN_SUBJECTS } from "@/constants/subjects";
import {
  useAPSAwareCourseAssignment,
  useAPSFilterOptions,
} from "@/hooks/useAPSAwareCourseAssignment";
import { toast } from "sonner";
import { APSSubject } from "@/types/university";
import {
  calculateAPS,
  convertPercentageToPoints,
  getAPSScoreDescription,
} from "@/utils/apsCalculation";
import { validateAPSSubjectsEnhanced } from "@/utils/enhancedValidation";
import UniversitySpecificAPSDisplay from "./UniversitySpecificAPSDisplay";
import EligibleProgramsSection from "./EligibleProgramsSection";

/**
 * Enhanced APS Calculator with two-section layout:
 * 1. Overview Section: Subject input and university-specific APS scores
 * 2. Programs Section: Faculty-grouped eligible programs
 */

interface APSSubjectInput {
  name: string;
  marks: number;
  level: number;
  points: number;
  isRequired: boolean;
}

const EnhancedAPSCalculator: React.FC = () => {
  const navigate = useNavigate();

  // APS-aware state management
  const {
    userProfile,
    isLoading,
    error,
    hasValidProfile,
    qualificationSummary,
    updateUserSubjects,
    searchCoursesForUniversity,
    checkProgramEligibility,
    clearAPSProfile,
    clearError,
  } = useAPSAwareCourseAssignment();

  // Local state
  const [subjects, setSubjects] = useState<APSSubjectInput[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedMarks, setSelectedMarks] = useState<string>("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<any>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [facultyFilter, setFacultyFilter] = useState<string>("all");
  const [includeAlmostQualified, setIncludeAlmostQualified] = useState(true);
  const [sortBy, setSortBy] = useState<string>("eligibility");
  const [maxAPSGap] = useState(5);

  // New state for two-section layout
  const [showProgramsSection, setShowProgramsSection] = useState(false);

  // All 26 South African universities for APS calculation
  const ALL_UNIVERSITY_IDS = [
    "uct",
    "wits",
    "stellenbosch",
    "up",
    "ukzn",
    "ufs",
    "ru",
    "nwu",
    "uwc",
    "uj",
    "unisa",
    "ufh",
    "tut",
    "dut",
    "vut",
    "mut",
    "cput",
    "ul",
    "univen",
    "wsu",
    "smu",
    "ump",
    "unizulu",
    "cut",
    "nmu",
    "spu",
  ];

  // Calculate APS with all validations
  const apsCalculation = useMemo(() => {
    // Convert APSSubjectInput to APSSubject for calculations
    const apsSubjects: APSSubject[] = subjects.map((subject) => ({
      name: subject.name,
      marks: subject.marks,
      level: subject.level,
      points: subject.points,
    }));

    const apsResult = calculateAPS(apsSubjects);
    const validationResult = validateAPSSubjectsEnhanced(apsSubjects);

    // Calculate university-specific scores for all 26 universities
    const universitySpecificCalculation =
      apsSubjects.length > 0
        ? import("@/services/universitySpecificAPSService").then((module) =>
            module.calculateUniversitySpecificAPS(
              apsSubjects,
              ALL_UNIVERSITY_IDS,
            ),
          )
        : null;

    return {
      totalAPS: apsResult.totalScore, // Extract the totalScore property
      validationResult,
      isCalculationValid: validationResult.isValid && apsSubjects.length >= 6,
      fullCalculation: universitySpecificCalculation,
      eligibleDegrees: apsResult.eligibleDegrees, // Also store eligible degrees
    };
  }, [subjects]);

  // Load university-specific calculation
  const [universitySpecificScores, setUniversitySpecificScores] =
    useState<any>(null);

  useEffect(() => {
    if (apsCalculation.fullCalculation) {
      apsCalculation.fullCalculation.then((result) => {
        setUniversitySpecificScores(result);
      });
    }
  }, [apsCalculation.fullCalculation]);

  // Listen for global APS profile clearing event
  useEffect(() => {
    const handleAPSProfileCleared = () => {
      setUniversitySpecificScores(null);
      setSearchResults([]);
      setSelectedProgram(null);
      setIsDetailsModalOpen(false);
      setShowProgramsSection(false);
    };

    window.addEventListener("apsProfileCleared", handleAPSProfileCleared);
    return () => {
      window.removeEventListener("apsProfileCleared", handleAPSProfileCleared);
    };
  }, []);

  // Update validation messages
  useEffect(() => {
    // Extract just the message strings from validation error objects
    const errorMessages = (apsCalculation.validationResult.errors || []).map(
      (error) =>
        typeof error === "string" ? error : error.message || "Validation error",
    );
    const warningMessages = (
      apsCalculation.validationResult.warnings || []
    ).map((warning) =>
      typeof warning === "string"
        ? warning
        : warning.message || "Validation warning",
    );

    setValidationErrors(errorMessages);
    setValidationWarnings(warningMessages);
  }, [apsCalculation.validationResult]);

  // Add subject function
  const addSubject = useCallback(() => {
    if (!selectedSubject || !selectedMarks) {
      toast.error("Please select a subject and enter marks");
      return;
    }

    const marks = parseFloat(selectedMarks);
    if (marks < 0 || marks > 100) {
      toast.error("Marks must be between 0 and 100");
      return;
    }

    // Check if subject already exists
    if (subjects.some((s) => s.name === selectedSubject)) {
      toast.error("This subject has already been added");
      return;
    }

    const newSubject: APSSubjectInput = {
      name: selectedSubject,
      marks,
      level: convertPercentageToPoints(marks),
      points: convertPercentageToPoints(marks),
      isRequired: ["English", "Mathematics", "Mathematical Literacy"].includes(
        selectedSubject,
      ),
    };

    setSubjects((prev) => [...prev, newSubject]);
    setSelectedSubject("");
    setSelectedMarks("");
    toast.success("Subject added successfully");
  }, [selectedSubject, selectedMarks, subjects]);

  // Remove subject function
  const removeSubject = useCallback((index: number) => {
    setSubjects((prev) => prev.filter((_, i) => i !== index));
    toast.success("Subject removed");
  }, []);

  // Clear all subjects function with complete reset
  const clearAllSubjects = useCallback(() => {
    setSubjects([]);
    setSelectedSubject("");
    setSelectedMarks("");
    setSearchResults([]);
    setSelectedProgram(null);
    setIsDetailsModalOpen(false);
    setShowProgramsSection(false);
    clearError();
    toast.success("All data cleared");
  }, [clearError]);

  // Clear APS profile from all universities
  const handleClearAPSProfile = useCallback(() => {
    clearAPSProfile();
    setSubjects([]);
    setSelectedSubject("");
    setSelectedMarks("");
    setSearchResults([]);
    setSelectedProgram(null);
    setIsDetailsModalOpen(false);
    setShowProgramsSection(false);
    setUniversitySpecificScores(null);
    clearError();
    toast.success("APS profile cleared from all universities");
  }, [clearAPSProfile, clearError]);

  // Search programs function
  const searchPrograms = useCallback(async () => {
    if (!apsCalculation.isCalculationValid) {
      toast.error("Please add at least 6 valid subjects first");
      return;
    }

    try {
      // Update user profile with current subjects - properly convert APSSubjectInput to APSSubject
      const apsSubjects: APSSubject[] = subjects.map((subject) => ({
        name: subject.name,
        marks: subject.marks,
        level: subject.level,
        points: subject.points,
      }));
      await updateUserSubjects(apsSubjects);

      // Search across all universities
      const results = [];
      for (const universityId of ALL_UNIVERSITY_IDS) {
        try {
          const universityResults =
            await searchCoursesForUniversity(universityId);
          results.push(...(universityResults || []));
        } catch (err) {
          console.warn(`Failed to search courses for ${universityId}:`, err);
        }
      }

      setSearchResults(results);
      setShowProgramsSection(true);
      toast.success(`Found ${results.length} programs across all universities`);
    } catch (err) {
      console.error("Error searching programs:", err);
      toast.error("Failed to search programs. Please try again.");
    }
  }, [
    apsCalculation.isCalculationValid,
    subjects,
    updateUserSubjects,
    searchCoursesForUniversity,
  ]);

  // Get available faculties from search results
  const availableFaculties = useMemo(() => {
    const faculties = [
      ...new Set(searchResults.map((p) => p.faculty).filter(Boolean)),
    ];
    return faculties.sort();
  }, [searchResults]);

  // Filter and sort programs
  const filteredPrograms = useMemo(() => {
    let filtered = searchResults;

    // Faculty filter
    if (facultyFilter && facultyFilter !== "all") {
      filtered = filtered.filter((p) => p.faculty === facultyFilter);
    }

    // Almost qualified filter
    if (!includeAlmostQualified) {
      filtered = filtered.filter((p) => p.eligible);
    }

    // Sort programs
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "eligibility":
          if (a.eligible !== b.eligible) return a.eligible ? -1 : 1;
          return (a.apsGap || 0) - (b.apsGap || 0);
        case "aps":
          return (a.apsRequirement || 0) - (b.apsRequirement || 0);
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return filtered;
  }, [searchResults, facultyFilter, includeAlmostQualified, sortBy]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const eligible = searchResults.filter((p) => p.eligible);
    const almostEligible = searchResults.filter(
      (p) => !p.eligible && p.apsGap <= maxAPSGap,
    );

    return {
      total: searchResults.length,
      eligible: eligible.length,
      almostEligible: almostEligible.length,
      eligibilityRate:
        searchResults.length > 0
          ? Math.round((eligible.length / searchResults.length) * 100)
          : 0,
    };
  }, [searchResults, maxAPSGap]);

  return (
    <div className="w-full space-y-8">
      {/* Clean Header Section */}
      <div className="text-center space-y-4 bg-gradient-to-r from-book-50 to-blue-50 py-8 px-6 rounded-2xl">
        <div className="inline-flex items-center gap-2 bg-book-100 text-book-800 px-4 py-2 rounded-full text-sm font-medium">
          <Calculator className="w-4 h-4" />
          APS Calculator
        </div>
        <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">
          Calculate Your APS Score
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Enter your matric results to calculate your Admission Point Score and
          discover which university programs you qualify for across all 26 South
          African universities
        </p>
      </div>

      {/* Alerts Section - Compact and Clean */}
      <div className="space-y-3">
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 flex items-center justify-between">
              <span>{error}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={clearError}
                className="h-6 w-6 p-0 text-red-600 hover:text-red-800"
              >
                <X className="w-4 h-4" />
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {validationErrors.length > 0 && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <div className="font-medium mb-2">Please fix these issues:</div>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {validationErrors.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {validationWarnings.length > 0 && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <Info className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <div className="font-medium mb-2">Recommendations:</div>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {validationWarnings.map((warning, i) => (
                  <li key={i}>{warning}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* SECTION 1: APS OVERVIEW */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-book-600 text-white rounded-full flex items-center justify-center font-bold">
            1
          </div>
          <h2 className="text-2xl font-bold text-gray-900">APS Overview</h2>
          <div className="flex-1 h-px bg-gray-300"></div>
        </div>

        {/* Main Content - Better Grid Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
          {/* Calculator Input Section */}
          <Card className="xl:col-span-2 bg-white shadow-sm border border-gray-200">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl text-gray-900">
                <BookOpen className="h-5 w-5 text-book-600" />
                Subject Results
              </CardTitle>
              <CardDescription>
                Add your matric subjects and marks to calculate your APS
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Add Subject Form */}
              <div className="bg-gray-50 p-6 rounded-xl space-y-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Subject
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Subject
                    </Label>
                    <Select
                      value={selectedSubject}
                      onValueChange={setSelectedSubject}
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Choose a subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {SOUTH_AFRICAN_SUBJECTS.map((subject) => (
                          <SelectItem key={subject} value={subject}>
                            {subject}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Final Mark (%)
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={selectedMarks}
                      onChange={(e) => setSelectedMarks(e.target.value)}
                      placeholder="Enter your final mark"
                      className="bg-white"
                    />
                    {selectedMarks && (
                      <div className="text-sm text-book-600 font-medium">
                        Level{" "}
                        {convertPercentageToPoints(
                          parseFloat(selectedMarks) || 0,
                        )}
                        (
                        {convertPercentageToPoints(
                          parseFloat(selectedMarks) || 0,
                        )}{" "}
                        points)
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  onClick={addSubject}
                  disabled={!selectedSubject || !selectedMarks}
                  className="w-full bg-book-600 hover:bg-book-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Subject
                </Button>
              </div>

              {/* Added Subjects List */}
              {subjects.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <GraduationCap className="w-4 h-4" />
                      Your Subjects ({subjects.length})
                    </h3>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={clearAllSubjects}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        Clear All
                      </Button>
                      {hasValidProfile && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleClearAPSProfile}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          Clear Profile
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {subjects.map((subject, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
                      >
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">
                              {subject.name}
                            </span>
                            {subject.isRequired && (
                              <Badge
                                variant="secondary"
                                className="text-xs bg-book-100 text-book-800"
                              >
                                Core Subject
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>{subject.marks}%</span>
                            <span>Level {subject.level}</span>
                            <span className="font-medium text-book-600">
                              {subject.points} points
                            </span>
                          </div>
                          {subject.name
                            .toLowerCase()
                            .includes("life orientation") && (
                            <span className="text-xs text-gray-500 italic">
                              Required but doesn't count towards APS
                            </span>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeSubject(index)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* APS Score Display */}
              {subjects.length > 0 && (
                <div className="bg-gradient-to-br from-book-50 to-blue-50 p-6 rounded-xl border border-book-200">
                  <div className="text-center space-y-4">
                    <div className="space-y-2">
                      <div
                        className={`text-4xl font-bold ${
                          apsCalculation.isCalculationValid
                            ? "text-book-700"
                            : "text-gray-600"
                        }`}
                      >
                        {apsCalculation.totalAPS}
                      </div>
                      <div className="text-sm font-medium text-gray-700">
                        Your APS Score
                      </div>
                      {apsCalculation.totalAPS > 0 && (
                        <Badge
                          variant="secondary"
                          className="bg-book-100 text-book-800 border-book-200"
                        >
                          {getAPSScoreDescription(apsCalculation.totalAPS)}
                        </Badge>
                      )}
                    </div>

                    {apsCalculation.isCalculationValid && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          Quality Score: {apsCalculation.validationResult.score}
                          %
                        </div>
                        <Button
                          onClick={searchPrograms}
                          className="w-full bg-book-600 hover:bg-book-700"
                          disabled={isLoading}
                          size="lg"
                        >
                          {isLoading ? (
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          ) : (
                            <Target className="w-5 h-5 mr-2" />
                          )}
                          Find Your Programs
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* University Scores Section */}
          <div className="xl:col-span-3 space-y-6">
            {apsCalculation.isCalculationValid && universitySpecificScores && (
              <UniversitySpecificAPSDisplay
                universityScores={
                  universitySpecificScores.universitySpecificScores
                }
                standardAPS={apsCalculation.totalAPS}
              />
            )}
          </div>
        </div>
      </div>

      {/* SECTION 2: ELIGIBLE PROGRAMS */}
      {showProgramsSection && searchResults.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-book-600 text-white rounded-full flex items-center justify-center font-bold">
              2
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Eligible Programs
            </h2>
            <div className="flex-1 h-px bg-gray-300"></div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowProgramsSection(!showProgramsSection)}
              className="flex items-center gap-1"
            >
              {showProgramsSection ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
              {showProgramsSection ? "Collapse" : "Expand"}
            </Button>
          </div>

          {/* Programs Section with Faculty Grouping */}
          <EligibleProgramsSection
            programs={filteredPrograms}
            statistics={statistics}
            availableFaculties={availableFaculties}
            facultyFilter={facultyFilter}
            setFacultyFilter={setFacultyFilter}
            sortBy={sortBy}
            setSortBy={setSortBy}
            includeAlmostQualified={includeAlmostQualified}
            setIncludeAlmostQualified={setIncludeAlmostQualified}
            onProgramSelect={(program) => {
              setSelectedProgram(program);
              setIsDetailsModalOpen(true);
            }}
            onRefresh={searchPrograms}
            isLoading={isLoading}
          />
        </div>
      )}

      {/* Program Details Modal */}
      {selectedProgram && (
        <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-green-800">
                {selectedProgram.name}
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                {selectedProgram.universityName} • {selectedProgram.faculty}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Program Overview */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-green-600" />
                    <span className="font-medium">Duration:</span>
                    <span>{selectedProgram.duration}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-green-600" />
                    <span className="font-medium">APS Required:</span>
                    <Badge variant="outline">
                      {selectedProgram.apsRequirement}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-green-600" />
                    <span className="font-medium">Campus:</span>
                    <span>{selectedProgram.universityName}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="font-medium">Eligibility:</span>
                    <Badge
                      variant={
                        selectedProgram.eligible ? "default" : "destructive"
                      }
                      className={
                        selectedProgram.eligible
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }
                    >
                      {selectedProgram.eligible ? "Qualified" : "Not Qualified"}
                    </Badge>
                  </div>
                  {!selectedProgram.eligible && selectedProgram.apsGap > 0 && (
                    <div className="text-yellow-700 text-sm mt-1">
                      You need {selectedProgram.apsGap} more APS points to
                      qualify
                    </div>
                  )}
                </div>
              </div>

              {/* Subject Requirements */}
              {selectedProgram.subjects &&
                selectedProgram.subjects.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-green-800">
                      Subject Requirements
                    </h3>
                    <div className="grid grid-cols-1 gap-2">
                      {selectedProgram.subjects.map(
                        (subject: any, index: number) => (
                          <div
                            key={index}
                            className="flex justify-between items-center p-2 bg-gray-50 rounded"
                          >
                            <span className="font-medium">{subject.name}</span>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={
                                  subject.isRequired ? "default" : "outline"
                                }
                              >
                                Level {subject.level}
                              </Badge>
                              {subject.isRequired && (
                                <Badge
                                  variant="destructive"
                                  className="text-xs"
                                >
                                  Required
                                </Badge>
                              )}
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}

              {/* Career Prospects */}
              {selectedProgram.careerProspects &&
                selectedProgram.careerProspects.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-green-800">
                      Career Opportunities
                    </h3>
                    <div className="grid grid-cols-1 gap-2">
                      {selectedProgram.careerProspects.map(
                        (career: string, index: number) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 p-2 bg-green-50 rounded"
                          >
                            <TrendingUp className="h-4 w-4 text-green-600" />
                            <span className="text-sm">{career}</span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={() =>
                    navigate(`/university/${selectedProgram.universityId}`)
                  }
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <Building className="h-4 w-4 mr-2" />
                  View University Profile
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsDetailsModalOpen(false)}
                  className="border-green-200 text-green-600 hover:bg-green-50"
                >
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default EnhancedAPSCalculator;

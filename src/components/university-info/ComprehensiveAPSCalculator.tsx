import React, { useState, useMemo, useCallback } from "react";
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
  CreditCard,
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SOUTH_AFRICAN_SUBJECTS } from "@/constants/subjects";
import { ALL_SOUTH_AFRICAN_UNIVERSITIES } from "@/constants/universities/complete-26-universities";
import {
  COMPREHENSIVE_COURSES,
  getUniversitiesForCourse,
  getAPSRequirement,
  courseToDegree,
} from "@/constants/universities/comprehensive-course-database";
import { toast } from "sonner";

// Extract all programs from the massive course database
const extractUniversityPrograms = () => {
  const programs: Array<{ university: string; programs: string[] }> = [];

  try {
    // Get all university IDs from the database
    const allUniversityIds = [
      "uct",
      "wits",
      "stellenbosch",
      "up",
      "ukzn",
      "ufs",
      "ru",
      "nwu",
      "uwc",
      "ufh",
      "ul",
      "cput",
      "dut",
      "tut",
      "cut",
      "vut",
      "mut",
      "uj",
      "unisa",
      "unizulu",
      "univen",
      "nmu",
      "wsu",
      "smu",
      "sol",
      "ump",
    ];

    // Find university info by ID
    const getUniversityInfo = (id: string) => {
      return (
        ALL_SOUTH_AFRICAN_UNIVERSITIES.find((u) => u.id === id) || {
          fullName: id.toUpperCase(),
          abbreviation: id.toUpperCase(),
          location: "South Africa",
          province: "Unknown",
        }
      );
    };

    COMPREHENSIVE_COURSES.forEach((courseTemplate) => {
      const applicableUniversities = getUniversitiesForCourse(
        courseTemplate.assignmentRule,
      );

      applicableUniversities.forEach((universityId) => {
        const universityInfo = getUniversityInfo(universityId);

        programs.push({
          university: universityInfo.fullName,
          abbreviation: universityInfo.abbreviation,
          location: `${universityInfo.location}, ${universityInfo.province}`,
          program: courseTemplate.name,
          faculty: courseTemplate.faculty,
          aps: getAPSRequirement(courseTemplate, universityId),
          duration: courseTemplate.duration,
          description: courseTemplate.description,
          subjects: courseTemplate.subjects || [],
          careerProspects: courseTemplate.careerProspects || [],
          universityId: universityId,
          programId: courseTemplate.name
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[()]/g, ""),
        });
      });
    });

    if (import.meta.env.DEV && programs.length > 0) {
      console.log(
        `✅ Extracted ${programs.length} programs from comprehensive course database`,
      );
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error("Error in extractUniversityPrograms:", error);
    }
  }

  return programs;
};

// Get comprehensive university programs data
const UNIVERSITY_PROGRAMS = extractUniversityPrograms();

interface APSSubject {
  name: string;
  level: number;
  countsForAPS?: boolean; // Life Orientation doesn't count for APS
}

interface ProgramDetailsModalProps {
  program: {
    name: string;
    university: string;
    requirements?: {
      minAPS?: number;
      requiredSubjects?: string[];
      additionalInfo?: string;
    };
  };
  isOpen: boolean;
  onClose: () => void;
}

const ProgramDetailsModal: React.FC<ProgramDetailsModalProps> = ({
  program,
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();

  const handleUniversityRedirect = () => {
    if (program.universityId) {
      navigate(`/university/${program.universityId}`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] max-w-[90vw] sm:max-w-2xl max-h-[85vh] mx-auto my-auto overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <GraduationCap className="h-5 w-5 text-green-600" />
            {program.program}
          </DialogTitle>
          <DialogDescription className="text-lg">
            {program.university}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Program Overview */}
          <div className="space-y-3">
            <h3 className="font-semibold text-green-800">Program Overview</h3>
            <p className="text-slate-600">{program.description}</p>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-500" />
                <span className="text-sm">Duration: {program.duration}</span>
              </div>
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-slate-500" />
                <span className="text-sm">Faculty: {program.faculty}</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-slate-500" />
                <span className="text-sm">APS Required: {program.aps}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-slate-500" />
                <span className="text-sm">{program.location}</span>
              </div>
            </div>
          </div>

          {/* Subject Requirements */}
          {program.subjects && program.subjects.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-green-800">
                Subject Requirements
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {program.subjects.map((subject: string, index: number) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-2 bg-slate-50 rounded"
                  >
                    <span className="font-medium">{subject.name}</span>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={subject.isRequired ? "default" : "outline"}
                      >
                        Level {subject.level}
                      </Badge>
                      {subject.isRequired && (
                        <Badge variant="destructive" className="text-xs">
                          Required
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Career Prospects */}
          {program.careerProspects && program.careerProspects.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-green-800">
                Career Opportunities
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {program.careerProspects.map(
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
              onClick={handleUniversityRedirect}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Building className="h-4 w-4 mr-2" />
              View University Profile
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="border-green-200 text-green-600 hover:bg-green-50"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const ComprehensiveAPSCalculator: React.FC = () => {
  // Start with empty subjects array - users add their own subjects and scores
  const [subjects, setSubjects] = useState<APSSubject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [showAllPrograms, setShowAllPrograms] = useState(false);
  const [facultyFilter, setFacultyFilter] = useState("all");
  const [universityFilter, setUniversityFilter] = useState("all");
  const [selectedProgram, setSelectedProgram] = useState<{
    name: string;
    university: string;
    requirements?: {
      minAPS?: number;
      requiredSubjects?: string[];
      additionalInfo?: string;
    };
  } | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Calculate total APS (excluding Life Orientation)
  const totalAPS = useMemo(() => {
    return subjects
      .filter((subject) => subject.countsForAPS !== false)
      .reduce((total, subject) => total + subject.level, 0);
  }, [subjects]);

  // Filter and analyze programs
  const { eligiblePrograms, programsByFaculty, stats } = useMemo(() => {
    let filteredPrograms = UNIVERSITY_PROGRAMS;

    // Apply faculty filter
    if (facultyFilter !== "all") {
      filteredPrograms = filteredPrograms.filter(
        (program) => program.faculty === facultyFilter,
      );
    }

    // Apply university filter
    if (universityFilter !== "all") {
      filteredPrograms = filteredPrograms.filter(
        (program) => program.abbreviation === universityFilter,
      );
    }

    // Calculate eligibility and competitiveness
    const processedPrograms = filteredPrograms.map((program) => {
      const apsGap = program.aps - totalAPS;
      const eligible = totalAPS >= program.aps;

      let competitiveness = "Low";
      if (program.aps >= 40) competitiveness = "High";
      else if (program.aps >= 35) competitiveness = "Moderate";

      return {
        ...program,
        eligible,
        apsGap: Math.max(0, apsGap),
        competitiveness,
      };
    });

    // Group by faculty
    const byFaculty = processedPrograms.reduce(
      (acc, program) => {
        if (!acc[program.faculty]) {
          acc[program.faculty] = [];
        }
        acc[program.faculty].push(program);
        return acc;
      },
      {} as Record<
        string,
        Array<{
          name: string;
          university: string;
          faculty: string;
          requirements?: {
            minAPS?: number;
            requiredSubjects?: string[];
            additionalInfo?: string;
          };
        }>
      >,
    );

    // Convert to array and sort
    const facultyArray = Object.entries(byFaculty)
      .map(([faculty, programs]) => ({
        faculty,
        programs: programs.sort(
          (a, b) => b.eligible - a.eligible || a.aps - b.aps,
        ),
      }))
      .sort((a, b) => {
        const aEligible = a.programs.filter((p) => p.eligible).length;
        const bEligible = b.programs.filter((p) => p.eligible).length;
        return bEligible - aEligible;
      });

    // Calculate statistics
    const eligible = processedPrograms.filter((p) => p.eligible);
    const calculatedStats = {
      totalDegrees: processedPrograms.length,
      eligibleCount: eligible.length,
      topUniversities: [...new Set(eligible.map((p) => p.abbreviation))].slice(
        0,
        5,
      ),
      topFaculties: [...new Set(eligible.map((p) => p.faculty))].slice(0, 5),
    };

    return {
      eligiblePrograms: eligible,
      programsByFaculty: facultyArray,
      stats: calculatedStats,
    };
  }, [totalAPS, facultyFilter, universityFilter]);

  // Get unique faculties and universities for filters
  const availableFaculties = useMemo(() => {
    return [...new Set(UNIVERSITY_PROGRAMS.map((p) => p.faculty))].sort();
  }, []);

  const availableUniversities = useMemo(() => {
    return [...new Set(UNIVERSITY_PROGRAMS.map((p) => p.abbreviation))].sort();
  }, []);

  const addSubject = useCallback(() => {
    if (selectedSubject && selectedLevel) {
      const level = parseInt(selectedLevel);
      const existingIndex = subjects.findIndex(
        (s) => s.name === selectedSubject,
      );

      if (existingIndex >= 0) {
        // Update existing subject
        const newSubjects = [...subjects];
        newSubjects[existingIndex] = {
          name: selectedSubject,
          level,
          countsForAPS: selectedSubject !== "Life Orientation",
        };
        setSubjects(newSubjects);
      } else {
        // Add new subject
        setSubjects((prev) => [
          ...prev,
          {
            name: selectedSubject,
            level,
            countsForAPS: selectedSubject !== "Life Orientation",
          },
        ]);
      }

      setSelectedSubject("");
      setSelectedLevel("");
      toast.success(`Added ${selectedSubject} at Level ${level}`);
    }
  }, [selectedSubject, selectedLevel, subjects]);

  const removeSubject = useCallback((index: number) => {
    setSubjects((prev) => prev.filter((_, i) => i !== index));
    toast.success("Subject removed");
  }, []);

  const handleViewDetails = useCallback(
    (program: {
      name: string;
      university: string;
      requirements?: {
        minAPS?: number;
        requiredSubjects?: string[];
        additionalInfo?: string;
      };
    }) => {
      setSelectedProgram(program);
      setIsDetailsModalOpen(true);
    },
    [],
  );

  return (
    <div className="max-w-7xl mx-auto p-4 lg:p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl lg:text-4xl font-bold text-slate-900">
          APS Calculator & Program Explorer
        </h1>
        <p className="text-lg text-slate-600 max-w-3xl mx-auto">
          Calculate your Admission Point Score and discover all programs you
          qualify for across South African universities with our comprehensive
          database.
        </p>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* APS Calculator Card */}
          <Card className="lg:col-span-1 bg-white border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-xl text-slate-900">
                <Calculator className="h-5 w-5 text-green-600" />
                Calculate Your APS
              </CardTitle>
              <CardDescription>
                Enter your subject results to calculate your Admission Point
                Score
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Subject Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-slate-700">
                  Select Subject
                </Label>
                <Select
                  value={selectedSubject}
                  onValueChange={setSelectedSubject}
                >
                  <SelectTrigger>
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

              {/* Level Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-slate-700">
                  Achievement Level
                </Label>
                <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    {[7, 6, 5, 4, 3, 2, 1].map((level) => (
                      <SelectItem key={level} value={level.toString()}>
                        Level {level} (
                        {level === 7
                          ? "80-100%"
                          : level === 6
                            ? "70-79%"
                            : level === 5
                              ? "60-69%"
                              : level === 4
                                ? "50-59%"
                                : level === 3
                                  ? "40-49%"
                                  : level === 2
                                    ? "30-39%"
                                    : "0-29%"}
                        )
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={addSubject}
                disabled={!selectedSubject || !selectedLevel}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Add Subject
              </Button>

              {/* Added Subjects */}
              {subjects.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">
                    Your Subjects ({subjects.length})
                  </Label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {subjects.map((subject, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-slate-50 rounded"
                      >
                        <div className="flex flex-col">
                          <span className="text-sm">{subject.name}</span>
                          {subject.countsForAPS === false && (
                            <span className="text-xs text-slate-500">
                              (Required but doesn't count for APS)
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            Level {subject.level || 0}
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeSubject(index)}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          >
                            ×
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Total APS Display */}
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-800">
                    {totalAPS}
                  </div>
                  <div className="text-sm text-green-600">Total APS Score</div>
                  <div className="text-xs text-slate-500 mt-1">
                    (Life Orientation not included)
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results Card */}
          <Card className="lg:col-span-2 bg-white border-0 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl text-slate-900">
                    <Target className="h-5 w-5 text-green-600" />
                    Your Eligible Programs
                  </CardTitle>
                  <CardDescription>
                    Programs you qualify for with APS {totalAPS}
                  </CardDescription>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <Select
                    value={facultyFilter}
                    onValueChange={setFacultyFilter}
                  >
                    <SelectTrigger className="w-full sm:w-[150px]">
                      <SelectValue placeholder="Filter by faculty" />
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

                  <Select
                    value={universityFilter}
                    onValueChange={setUniversityFilter}
                  >
                    <SelectTrigger className="w-full sm:w-[120px]">
                      <SelectValue placeholder="Filter by university" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Universities</SelectItem>
                      {availableUniversities.map((university) => (
                        <SelectItem key={university} value={university}>
                          {university}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {totalAPS === 0 ? (
                <div className="text-center py-12">
                  <GraduationCap className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-600 mb-2">
                    Add your subjects to get started
                  </h3>
                  <p className="text-slate-500">
                    Enter your matric results to see which programs you qualify
                    for
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-800">
                        {stats.eligibleCount}
                      </div>
                      <div className="text-sm text-green-600">
                        Eligible Programs
                      </div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-800">
                        {stats.totalDegrees}
                      </div>
                      <div className="text-sm text-blue-600">
                        Total Programs
                      </div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-800">
                        {stats.topUniversities.length}
                      </div>
                      <div className="text-sm text-purple-600">
                        Universities
                      </div>
                    </div>
                  </div>

                  {/* Programs by Faculty */}
                  <div className="space-y-4">
                    {(showAllPrograms
                      ? programsByFaculty
                      : programsByFaculty.slice(0, 3)
                    ).map(({ faculty, programs }) => (
                      <div
                        key={faculty}
                        className="border border-slate-200 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-slate-900">
                            Faculty of {faculty}
                          </h3>
                          <Badge variant="outline" className="text-xs">
                            {programs.length} programs
                          </Badge>
                        </div>

                        <div className="space-y-3">
                          {(showAllPrograms
                            ? programs
                            : programs.slice(0, 3)
                          ).map((program, index) => (
                            <div
                              key={index}
                              className="p-3 bg-slate-50 rounded border border-slate-100"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                <div className="flex-1">
                                  <h4 className="font-semibold text-slate-900 mb-1">
                                    {program.program}
                                  </h4>
                                  <p className="text-sm text-slate-600 mb-2">
                                    {program.university}
                                  </p>
                                  <p className="text-sm text-slate-700">
                                    {program.description}
                                  </p>
                                </div>
                                <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2">
                                  <Badge
                                    variant={
                                      program.eligible
                                        ? "default"
                                        : "destructive"
                                    }
                                    className={`${program.eligible ? "bg-emerald-600 hover:bg-emerald-700" : ""} whitespace-nowrap`}
                                  >
                                    APS {program.aps}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "whitespace-nowrap",
                                      program.competitiveness === "High"
                                        ? "border-red-200 text-red-700 bg-red-50"
                                        : program.competitiveness === "Moderate"
                                          ? "border-orange-200 text-orange-700 bg-orange-50"
                                          : "border-green-200 text-green-700 bg-green-50",
                                    )}
                                  >
                                    {program.competitiveness}
                                  </Badge>
                                </div>
                              </div>

                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm mt-3">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                  <span className="flex items-center gap-1 text-slate-600">
                                    <Calendar className="h-3 w-3" />
                                    {program.duration}
                                  </span>
                                  {program.eligible ? (
                                    <span className="flex items-center gap-1 text-emerald-600">
                                      <CheckCircle className="h-3 w-3" />
                                      Eligible
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1 text-red-600">
                                      <AlertTriangle className="h-3 w-3" />
                                      Need {program.apsGap} more points
                                    </span>
                                  )}
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleViewDetails(program)}
                                  className="border-green-500 text-green-600 hover:bg-green-50 w-full sm:w-auto justify-center sm:justify-start"
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  View Details
                                  <ChevronRight className="h-3 w-3 ml-1" />
                                </Button>
                              </div>
                            </div>
                          ))}

                          {/* Show more programs in this faculty */}
                          {!showAllPrograms && programs.length > 3 && (
                            <div className="text-center pt-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setShowAllPrograms(true)}
                                className="text-slate-600 hover:text-slate-900"
                              >
                                +{programs.length - 3} more in {faculty}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* View More Faculties Button */}
                    {programsByFaculty.length > 3 && (
                      <div className="text-center mt-6 pt-4 border-t border-slate-100">
                        {!showAllPrograms ? (
                          <Button
                            onClick={() => setShowAllPrograms(true)}
                            variant="outline"
                            className="border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                          >
                            View All Faculties ({programsByFaculty.length - 3}{" "}
                            more)
                          </Button>
                        ) : (
                          <Button
                            onClick={() => setShowAllPrograms(false)}
                            variant="outline"
                            className="border-slate-200 text-slate-600 hover:bg-slate-50"
                          >
                            Show Less
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Program Details Modal */}
      {selectedProgram && (
        <ProgramDetailsModal
          program={selectedProgram}
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
        />
      )}
    </div>
  );
};

export default ComprehensiveAPSCalculator;

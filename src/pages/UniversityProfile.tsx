import React, { useState, useEffect, useCallback } from "react";
import {
  useParams,
  Navigate,
  Link,
  useSearchParams,
  useNavigate,
} from "react-router-dom";
import { ALL_SOUTH_AFRICAN_UNIVERSITIES } from "@/constants/universities/index";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  ExternalLink,
  MapPin,
  BookOpen,
  Calculator,
  BarChart3,
  Users,
  Calendar,
  Building2,
  GraduationCap,
  Globe,
  TrendingUp,
  Award,
  Heart,
  Info,
  Eye,
  CheckCircle,
  XCircle,
  Filter,
} from "lucide-react";
import Layout from "@/components/Layout";
import ProgramDetailModal from "@/components/university-info/ProgramDetailModal";
import { Degree } from "@/types/university";

/**
 * University Profile Component - Complete modern redesign
 */
const UniversityProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("programs");

  // Optimized tab change handler
  const handleTabChange = useCallback((value: string) => {
    // Immediate state update for instant visual feedback
    setActiveTab(value);
  }, []);
  const [selectedProgram, setSelectedProgram] = useState<Degree | null>(null);
  const [isProgramModalOpen, setIsProgramModalOpen] = useState(false);
  const [showEligibleOnly, setShowEligibleOnly] = useState(false);
  const [expandedFaculties, setExpandedFaculties] = useState<Set<number>>(
    new Set(),
  );

  // Get APS from URL parameters
  const fromAPS = searchParams.get("fromAPS") === "true";
  const userAPS = parseInt(searchParams.get("aps") || "0");

  useEffect(() => {
    // Scroll to top when component mounts or university changes
    window.scrollTo({ top: 0, behavior: "smooth" });

    // If coming from APS calculator, show eligible programs by default
    if (fromAPS && userAPS > 0) {
      setShowEligibleOnly(true);
    }
  }, [id, fromAPS, userAPS]);

  const handleViewProgram = (program: Degree) => {
    setSelectedProgram(program);
    setIsProgramModalOpen(true);
  };

  const closeProgramModal = () => {
    setIsProgramModalOpen(false);
    setSelectedProgram(null);
  };

  const toggleFacultyExpansion = (facultyIndex: number) => {
    setExpandedFaculties((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(facultyIndex)) {
        newSet.delete(facultyIndex);
      } else {
        newSet.add(facultyIndex);
      }
      return newSet;
    });
  };

  const handleAPSCalculator = () => {
    navigate("/university-info?tool=aps-calculator");
  };

  // Helper function to check if user is eligible for a program
  const isEligibleForProgram = (program: Degree): boolean => {
    if (!userAPS || userAPS === 0) return true;
    return userAPS >= program.apsRequirement;
  };

  // Helper function to filter programs based on eligibility
  const filterPrograms = (programs: Degree[]): Degree[] => {
    if (!showEligibleOnly || !userAPS) return programs;
    return programs.filter(isEligibleForProgram);
  };

  const university = ALL_SOUTH_AFRICAN_UNIVERSITIES.find(
    (uni) =>
      uni.id === id || uni.name.toLowerCase().replace(/\s+/g, "-") === id,
  );

  if (!university) {
    return <Navigate to="/university-info" replace />;
  }

  // Calculate stats
  const totalPrograms =
    university.faculties?.reduce((total, faculty) => {
      return total + (faculty.degrees?.length || 0);
    }, 0) || 0;

  const studentCount = university.studentPopulation
    ? university.studentPopulation > 1000
      ? `${Math.round(university.studentPopulation / 1000)}k+`
      : university.studentPopulation.toString()
    : "N/A";

  return (
    <Layout>
      <div className="bg-white min-h-screen">
        {/* Clean Header */}
        <div className="bg-gradient-to-b from-book-100 via-book-50 to-white border-b border-book-200">
          <div className="container mx-auto px-6 py-8">
            {/* Back Navigation */}
            <Link
              to="/university-info"
              className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-8 group"
            >
              <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Back to Universities</span>
            </Link>

            {/* University Header - Mobile Optimized */}
            <div className="grid lg:grid-cols-4 gap-6 lg:gap-8">
              {/* Main Info */}
              <div className="lg:col-span-3">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6 mb-6 sm:mb-8">
                  {/* Logo */}
                  <div className="relative mx-auto sm:mx-0 flex-shrink-0">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white border-4 border-book-200 rounded-2xl flex items-center justify-center shadow-lg">
                      {university.logo ? (
                        <img
                          src={university.logo}
                          alt={`${university.name} logo`}
                          className="w-12 h-12 sm:w-16 sm:h-16 object-contain"
                          onError={(e) => {
                            // Hide the failed image and show fallback
                            const img = e.currentTarget;
                            img.style.display = "none";
                            const fallback =
                              img.nextElementSibling as HTMLElement;
                            if (fallback) {
                              fallback.style.display = "flex";
                            }
                          }}
                        />
                      ) : null}
                      <span
                        className={`w-12 h-12 sm:w-16 sm:h-16 ${university.logo ? "hidden" : "flex"} items-center justify-center text-lg sm:text-2xl font-bold text-gray-700 bg-gradient-to-br from-book-500 to-book-600 text-white rounded-lg`}
                      >
                        {university.abbreviation ||
                          university.name.substring(0, 3).toUpperCase()}
                      </span>
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-5 h-5 sm:w-6 sm:h-6 bg-book-500 rounded-full flex items-center justify-center">
                      <Award className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-white" />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 space-y-3 sm:space-y-4 text-center sm:text-left">
                    <div>
                      <Badge
                        variant="secondary"
                        className="mb-3 bg-book-50 text-book-700 border-book-200"
                      >
                        {university.type}
                      </Badge>
                      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-3 leading-tight">
                        {university.fullName || university.name}
                      </h1>
                      <div className="flex items-center justify-center sm:justify-start text-gray-600 mb-3 sm:mb-4">
                        <MapPin className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-gray-400" />
                        <span className="text-base sm:text-lg">
                          {university.location}, {university.province}
                        </span>
                      </div>
                    </div>

                    <p className="text-gray-700 leading-relaxed text-sm sm:text-base lg:text-lg max-w-3xl">
                      {university.overview ||
                        "A prestigious South African institution dedicated to academic excellence, research innovation, and developing leaders who shape the future."}
                    </p>
                  </div>
                </div>

                {/* Action Buttons - Mobile Optimized */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <Button
                    size="lg"
                    className="bg-book-600 hover:bg-book-700 text-white w-full sm:w-auto"
                  >
                    <BookOpen className="h-5 w-5 mr-2" />
                    Find Textbooks
                  </Button>

                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-blue-200 text-blue-600 hover:bg-blue-50 w-full sm:w-auto"
                    onClick={handleAPSCalculator}
                  >
                    <Calculator className="h-5 w-5 mr-2" />
                    APS Calculator
                  </Button>

                  {university.website && (
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-2 hover:border-book-500 hover:text-book-600 w-full sm:w-auto"
                      asChild
                    >
                      <a
                        href={university.website}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Globe className="h-5 w-5 mr-2" />
                        <span className="hidden sm:inline">
                          Official Website
                        </span>
                        <span className="sm:hidden">Website</span>
                      </a>
                    </Button>
                  )}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="lg:col-span-1">
                <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-book-50 border-book-200">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center text-gray-800">
                      <BarChart3 className="h-5 w-5 mr-2 text-book-500" />
                      Quick Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600 font-medium">
                        Students
                      </span>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1 text-book-500" />
                        <span className="font-bold text-gray-900">
                          {studentCount}
                        </span>
                      </div>
                    </div>

                    {university.establishedYear && (
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-600 font-medium">
                          Founded
                        </span>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1 text-book-500" />
                          <span className="font-bold text-gray-900">
                            {university.establishedYear}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600 font-medium">
                        Faculties
                      </span>
                      <div className="flex items-center">
                        <Building2 className="h-4 w-4 mr-1 text-book-500" />
                        <span className="font-bold text-gray-900">
                          {university.faculties?.length || 0}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600 font-medium">
                        Programs
                      </span>
                      <div className="flex items-center">
                        <GraduationCap className="h-4 w-4 mr-1 text-book-500" />
                        <span className="font-bold text-gray-900">
                          {totalPrograms}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>

        {/* APS Status Banner */}
        {fromAPS && userAPS > 0 && (
          <div className="bg-book-100 border-b border-book-200">
            <div className="container mx-auto px-6 py-4">
              <Alert className="border-book-300 bg-book-50">
                <Calculator className="h-5 w-5 text-book-600" />
                <AlertDescription className="text-book-800">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <strong>Your APS Score: {userAPS}</strong> -
                      {(() => {
                        const eligibleCount = university.faculties.reduce(
                          (total, faculty) => {
                            const eligiblePrograms = filterPrograms(
                              faculty.degrees || [],
                            );
                            return total + eligiblePrograms.length;
                          },
                          0,
                        );
                        const totalPrograms = university.faculties.reduce(
                          (total, faculty) => {
                            return total + (faculty.degrees?.length || 0);
                          },
                          0,
                        );
                        return (
                          <span className="ml-2">
                            You qualify for <strong>{eligibleCount}</strong> out
                            of <strong>{totalPrograms}</strong> programs
                          </span>
                        );
                      })()}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={showEligibleOnly ? "default" : "outline"}
                        onClick={() => setShowEligibleOnly(!showEligibleOnly)}
                        className="bg-book-600 hover:bg-book-700 text-white"
                      >
                        <Filter className="h-4 w-4 mr-2" />
                        {showEligibleOnly
                          ? "Show All Programs"
                          : "Show Eligible Only"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          // Clear APS by removing URL parameters and reloading
                          window.location.href = `/university/${id}`;
                        }}
                        className="border-gray-300 text-gray-600 hover:bg-gray-50"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Clear APS Profile
                      </Button>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="container mx-auto px-6 py-8">
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full"
          >
            {/* Modern Tab Navigation - Mobile Optimized */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
              {/* Mobile: Vertical Stack */}
              <div className="block md:hidden">
                <TabsList className="bg-transparent p-2 h-auto w-full flex flex-col space-y-2 rounded-xl">
                  <TabsTrigger
                    value="programs"
                    className="w-full rounded-lg py-3 px-4 data-[state=active]:bg-book-50 data-[state=active]:text-book-700 data-[state=active]:shadow-sm font-medium transition-all justify-start"
                  >
                    <GraduationCap className="h-5 w-5 mr-3" />
                    Academic Programs
                  </TabsTrigger>
                  <TabsTrigger
                    value="admissions"
                    className="w-full rounded-lg py-3 px-4 data-[state=active]:bg-book-50 data-[state=active]:text-book-700 data-[state=active]:shadow-sm font-medium transition-all justify-start"
                  >
                    <Calendar className="h-5 w-5 mr-3" />
                    Admissions
                  </TabsTrigger>
                  <TabsTrigger
                    value="student-life"
                    className="w-full rounded-lg py-3 px-4 data-[state=active]:bg-book-50 data-[state=active]:text-book-700 data-[state=active]:shadow-sm font-medium transition-all justify-start"
                  >
                    <Heart className="h-5 w-5 mr-3" />
                    Campus Life
                  </TabsTrigger>
                  <TabsTrigger
                    value="resources"
                    className="w-full rounded-lg py-3 px-4 data-[state=active]:bg-book-50 data-[state=active]:text-book-700 data-[state=active]:shadow-sm font-medium transition-all justify-start"
                  >
                    <Info className="h-5 w-5 mr-3" />
                    Resources
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Desktop: Horizontal Grid */}
              <div className="hidden md:block">
                <TabsList className="bg-transparent p-1 h-auto w-full grid grid-cols-4 rounded-xl">
                  <TabsTrigger
                    value="programs"
                    className="rounded-lg py-4 px-6 data-[state=active]:bg-book-50 data-[state=active]:text-book-700 data-[state=active]:shadow-sm font-medium transition-all"
                  >
                    <GraduationCap className="h-5 w-5 mr-2" />
                    <span className="hidden lg:inline">Academic Programs</span>
                    <span className="lg:hidden">Programs</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="admissions"
                    className="rounded-lg py-4 px-6 data-[state=active]:bg-book-50 data-[state=active]:text-book-700 data-[state=active]:shadow-sm font-medium transition-all"
                  >
                    <Calendar className="h-5 w-5 mr-2" />
                    <span className="hidden lg:inline">Admissions</span>
                    <span className="lg:hidden">Apply</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="student-life"
                    className="rounded-lg py-4 px-6 data-[state=active]:bg-book-50 data-[state=active]:text-book-700 data-[state=active]:shadow-sm font-medium transition-all"
                  >
                    <Heart className="h-5 w-5 mr-2" />
                    <span className="hidden lg:inline">Campus Life</span>
                    <span className="lg:hidden">Life</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="resources"
                    className="rounded-lg py-4 px-6 data-[state=active]:bg-book-50 data-[state=active]:text-book-700 data-[state=active]:shadow-sm font-medium transition-all"
                  >
                    <Info className="h-5 w-5 mr-2" />
                    <span className="hidden lg:inline">Resources</span>
                    <span className="lg:hidden">Info</span>
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>

            {/* Tab Content */}
            <TabsContent value="programs" className="mt-0">
              <div className="space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                      Academic Programs
                    </h2>
                    <p className="text-gray-600">
                      Explore {totalPrograms} programs across{" "}
                      {university.faculties?.length || 0} faculties
                    </p>
                  </div>
                  <Button
                    className="bg-book-600 hover:bg-book-700 text-white shadow-lg"
                    onClick={handleAPSCalculator}
                  >
                    <Calculator className="h-5 w-5 mr-2" />
                    Calculate Your APS
                  </Button>
                </div>

                {university.faculties && university.faculties.length > 0 ? (
                  <div className="grid gap-8">
                    {university.faculties.map((faculty, index) => {
                      const facultyPrograms = faculty.degrees || [];
                      const filteredPrograms = filterPrograms(facultyPrograms);
                      const eligibleCount =
                        facultyPrograms.filter(isEligibleForProgram).length;

                      // Skip faculty if no programs match the filter
                      if (showEligibleOnly && filteredPrograms.length === 0) {
                        return null;
                      }

                      return (
                        <Card key={index} className="border-0 shadow-lg">
                          <CardHeader className="bg-gradient-to-r from-gray-50 to-white">
                            <CardTitle className="text-xl flex items-center justify-between text-gray-900">
                              <div className="flex items-center">
                                <Building2 className="h-6 w-6 mr-3 text-book-500" />
                                {faculty.name}
                              </div>
                              {fromAPS && userAPS > 0 && (
                                <Badge
                                  variant={
                                    eligibleCount > 0 ? "default" : "secondary"
                                  }
                                  className={
                                    eligibleCount > 0
                                      ? "bg-green-100 text-green-800 border-green-300"
                                      : "bg-red-100 text-red-800 border-red-300"
                                  }
                                >
                                  {eligibleCount}/{facultyPrograms.length}{" "}
                                  eligible
                                </Badge>
                              )}
                            </CardTitle>
                            {faculty.description && (
                              <p className="text-gray-600 mt-2">
                                {faculty.description}
                              </p>
                            )}
                          </CardHeader>

                          {filteredPrograms.length > 0 && (
                            <CardContent className="pt-6">
                              <div className="grid gap-4">
                                {filteredPrograms
                                  .slice(
                                    0,
                                    showEligibleOnly ||
                                      expandedFaculties.has(index)
                                      ? filteredPrograms.length
                                      : 3,
                                  )
                                  .map((degree, degreeIndex) => {
                                    const isEligible =
                                      isEligibleForProgram(degree);
                                    return (
                                      <div
                                        key={degreeIndex}
                                        className={`group bg-white border rounded-xl p-5 hover:shadow-md transition-all duration-200 ${
                                          fromAPS && userAPS > 0
                                            ? isEligible
                                              ? "border-green-300 bg-green-50 hover:border-green-400"
                                              : "border-red-300 bg-red-50 hover:border-red-400"
                                            : "border-gray-200 hover:border-book-200"
                                        }`}
                                      >
                                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                                          <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                              {fromAPS &&
                                                userAPS > 0 &&
                                                (isEligible ? (
                                                  <CheckCircle className="h-5 w-5 text-green-600" />
                                                ) : (
                                                  <XCircle className="h-5 w-5 text-red-600" />
                                                ))}
                                              <h5
                                                className={`font-semibold mb-0 group-hover:text-book-700 transition-colors ${
                                                  fromAPS && userAPS > 0
                                                    ? isEligible
                                                      ? "text-green-900"
                                                      : "text-red-900"
                                                    : "text-gray-900"
                                                }`}
                                              >
                                                {degree.name}
                                              </h5>
                                            </div>
                                            {degree.description && (
                                              <p
                                                className={`text-sm leading-relaxed mb-3 ${
                                                  fromAPS && userAPS > 0
                                                    ? isEligible
                                                      ? "text-green-700"
                                                      : "text-red-700"
                                                    : "text-gray-600"
                                                }`}
                                              >
                                                {degree.description}
                                              </p>
                                            )}
                                            {degree.duration && (
                                              <div
                                                className={`flex items-center text-sm ${
                                                  fromAPS && userAPS > 0
                                                    ? isEligible
                                                      ? "text-green-600"
                                                      : "text-red-600"
                                                    : "text-gray-500"
                                                }`}
                                              >
                                                <Calendar className="h-4 w-4 mr-1" />
                                                {degree.duration}
                                              </div>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-2 shrink-0">
                                            <Badge
                                              className={
                                                fromAPS && userAPS > 0
                                                  ? isEligible
                                                    ? "bg-green-100 text-green-800 border-green-300"
                                                    : "bg-red-100 text-red-800 border-red-300"
                                                  : "bg-book-100 text-book-700 border-book-200"
                                              }
                                            >
                                              APS: {degree.apsRequirement}
                                              {fromAPS && userAPS > 0 && (
                                                <span className="ml-1">
                                                  {isEligible ? "✓" : "✗"}
                                                </span>
                                              )}
                                            </Badge>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              className={
                                                fromAPS && userAPS > 0
                                                  ? isEligible
                                                    ? "border-green-300 text-green-700 hover:bg-green-100"
                                                    : "border-red-300 text-red-700 hover:bg-red-100"
                                                  : "border-book-200 text-book-600 hover:bg-book-50"
                                              }
                                              onClick={() =>
                                                handleViewProgram(degree)
                                              }
                                            >
                                              <Eye className="h-4 w-4 mr-1" />
                                              View More
                                            </Button>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                {!showEligibleOnly &&
                                  filteredPrograms.length > 3 &&
                                  !expandedFaculties.has(index) && (
                                    <div className="text-center py-4">
                                      <Button
                                        variant="outline"
                                        className="border-book-200 text-book-600 hover:bg-book-50"
                                        onClick={() =>
                                          toggleFacultyExpansion(index)
                                        }
                                      >
                                        <TrendingUp className="h-4 w-4 mr-2" />
                                        View {filteredPrograms.length - 3} more
                                        programs
                                      </Button>
                                    </div>
                                  )}
                                {!showEligibleOnly &&
                                  filteredPrograms.length > 3 &&
                                  expandedFaculties.has(index) && (
                                    <div className="text-center py-4">
                                      <Button
                                        variant="outline"
                                        className="border-book-200 text-book-600 hover:bg-book-50"
                                        onClick={() =>
                                          toggleFacultyExpansion(index)
                                        }
                                      >
                                        <TrendingUp className="h-4 w-4 mr-2 rotate-180" />
                                        Show Less
                                      </Button>
                                    </div>
                                  )}
                              </div>
                            </CardContent>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <Card className="border-0 shadow-lg">
                    <CardContent className="text-center py-16">
                      <GraduationCap className="h-20 w-20 mx-auto text-gray-300 mb-6" />
                      <h3 className="text-xl font-semibold text-gray-700 mb-3">
                        No Programs Available
                      </h3>
                      <p className="text-gray-500 max-w-md mx-auto">
                        Program information for this university is not yet
                        available. Please check back later or contact the
                        university directly.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="admissions" className="mt-0">
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    Admissions Information
                  </h2>
                  <p className="text-gray-600">
                    Everything you need to know about applying to{" "}
                    {university.name}
                  </p>
                </div>

                {/* Application Dates */}
                <Card className="border-0 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-book-50 to-white">
                    <CardTitle className="text-xl flex items-center text-gray-900">
                      <Calendar className="h-6 w-6 mr-3 text-book-500" />
                      Application Dates & Deadlines
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {university.applicationInfo ? (
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                            <h4 className="font-semibold text-green-800 mb-2">
                              Application Period
                            </h4>
                            <p className="text-green-700">
                              {university.applicationInfo.openingDate} -{" "}
                              {university.applicationInfo.closingDate}
                            </p>
                          </div>
                          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <h4 className="font-semibold text-blue-800 mb-2">
                              Academic Year
                            </h4>
                            <p className="text-blue-700">
                              {university.applicationInfo.academicYear}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                            <h4 className="font-semibold text-orange-800 mb-2">
                              Application Fee
                            </h4>
                            <p className="text-orange-700">
                              {university.applicationInfo.applicationFee ||
                                "No application fee"}
                            </p>
                          </div>
                          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                            <h4 className="font-semibold text-purple-800 mb-2">
                              Application Method
                            </h4>
                            <p className="text-purple-700">
                              {university.applicationInfo.applicationMethod}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 bg-gray-50 rounded-lg text-center">
                        <p className="text-gray-600">
                          Application dates will be published closer to the
                          application period.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Application Process */}
                <Card className="border-0 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-book-50 to-white">
                    <CardTitle className="text-xl flex items-center text-gray-900">
                      <Users className="h-6 w-6 mr-3 text-book-500" />
                      Application Process
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-6">
                      <div className="flex items-start space-x-4">
                        <div className="w-8 h-8 bg-book-500 text-white rounded-full flex items-center justify-center font-bold">
                          1
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">
                            Check Admission Requirements
                          </h4>
                          <p className="text-gray-600">
                            Review the specific requirements for your chosen
                            program, including APS scores and subject
                            requirements.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-4">
                        <div className="w-8 h-8 bg-book-500 text-white rounded-full flex items-center justify-center font-bold">
                          2
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">
                            Prepare Required Documents
                          </h4>
                          <p className="text-gray-600">
                            Gather certified copies of ID, academic transcripts,
                            and any additional documents required for your
                            program.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-4">
                        <div className="w-8 h-8 bg-book-500 text-white rounded-full flex items-center justify-center font-bold">
                          3
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">
                            Submit Online Application
                          </h4>
                          <p className="text-gray-600">
                            Complete the online application form and upload all
                            required documents before the deadline.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-4">
                        <div className="w-8 h-8 bg-book-500 text-white rounded-full flex items-center justify-center font-bold">
                          4
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">
                            Track Application Status
                          </h4>
                          <p className="text-gray-600">
                            Monitor your application status through the student
                            portal and respond to any requests for additional
                            information.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Financial Aid */}
                <Card className="border-0 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-book-50 to-white">
                    <CardTitle className="text-xl flex items-center text-gray-900">
                      <Award className="h-6 w-6 mr-3 text-book-500" />
                      Financial Aid & Funding
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="font-semibold text-lg">
                          Government Funding
                        </h4>
                        <div className="space-y-3">
                          <div className="p-3 bg-green-50 rounded-lg">
                            <h5 className="font-medium text-green-800">
                              NSFAS
                            </h5>
                            <p className="text-sm text-green-700">
                              National Student Financial Aid Scheme for
                              qualifying students
                            </p>
                          </div>
                          <div className="p-3 bg-blue-50 rounded-lg">
                            <h5 className="font-medium text-blue-800">
                              Provincial Bursaries
                            </h5>
                            <p className="text-sm text-blue-700">
                              Provincial government bursary programs available
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h4 className="font-semibold text-lg">
                          University Support
                        </h4>
                        <div className="space-y-3">
                          <div className="p-3 bg-purple-50 rounded-lg">
                            <h5 className="font-medium text-purple-800">
                              Merit Scholarships
                            </h5>
                            <p className="text-sm text-purple-700">
                              Academic excellence scholarships for top
                              performers
                            </p>
                          </div>
                          <div className="p-3 bg-orange-50 rounded-lg">
                            <h5 className="font-medium text-orange-800">
                              Need-Based Aid
                            </h5>
                            <p className="text-sm text-orange-700">
                              Financial assistance for students from
                              disadvantaged backgrounds
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Contact Information */}
                <Card className="border-0 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-book-50 to-white">
                    <CardTitle className="text-xl flex items-center text-gray-900">
                      <Info className="h-6 w-6 mr-3 text-book-500" />
                      Admissions Contact
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3">
                          Get Help With Your Application
                        </h4>
                        <div className="space-y-2">
                          {university.admissionsContact && (
                            <div className="flex items-center">
                              <span className="font-medium w-20">Email:</span>
                              <span className="text-book-600">
                                {university.admissionsContact}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center">
                            <span className="font-medium w-20">Website:</span>
                            <a
                              href={university.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-book-600 hover:text-book-700 underline"
                            >
                              {university.website}
                            </a>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-3">
                        {university.website && (
                          <Button
                            className="bg-book-600 hover:bg-book-700 text-white"
                            asChild
                          >
                            <a
                              href={university.website}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-5 w-5 mr-2" />
                              Visit University Website
                            </a>
                          </Button>
                        )}
                        {university.studentPortal && (
                          <Button
                            variant="outline"
                            className="border-book-200 text-book-600 hover:bg-book-50"
                            asChild
                          >
                            <a
                              href={university.studentPortal}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Users className="h-5 w-5 mr-2" />
                              Student Portal
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="student-life" className="mt-0">
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    Campus Life at {university.name}
                  </h2>
                  <p className="text-gray-600">
                    Discover what makes student life vibrant and engaging
                  </p>
                </div>

                {/* Accommodation */}
                <Card className="border-0 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-book-50 to-white">
                    <CardTitle className="text-xl flex items-center text-gray-900">
                      <Building2 className="h-6 w-6 mr-3 text-book-500" />
                      Student Accommodation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="p-4 bg-book-50 rounded-lg">
                          <h4 className="font-semibold text-book-800 mb-2">
                            On-Campus Residences
                          </h4>
                          <ul className="text-sm text-book-700 space-y-1">
                            {university.id === "uwc" ? (
                              <>
                                <li>• Cassinga Residence</li>
                                <li>• Basil February Residence</li>
                                <li>• Chris Hani Residence</li>
                                <li>• Ruth First Residence</li>
                                <li>• Eduardo Dos Santos Residence</li>
                              </>
                            ) : (
                              <>
                                <li>• Modern residence facilities</li>
                                <li>• Shared and single room options</li>
                                <li>• Meal plan options available</li>
                                <li>• 24/7 security and support</li>
                              </>
                            )}
                          </ul>
                        </div>
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <h4 className="font-semibold text-blue-800 mb-2">
                            Off-Campus Housing
                          </h4>
                          <ul className="text-sm text-blue-700 space-y-1">
                            <li>• Private accommodation options</li>
                            <li>• Shuttle services to campus</li>
                            <li>• Student housing partnerships</li>
                            <li>• Rental assistance programs</li>
                          </ul>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="p-4 bg-green-50 rounded-lg">
                          <h4 className="font-semibold text-green-800 mb-2">
                            Residence Features
                          </h4>
                          <ul className="text-sm text-green-700 space-y-1">
                            <li>• Wi-Fi and study areas</li>
                            <li>• Recreational facilities</li>
                            <li>• Laundry facilities</li>
                            <li>• Common areas and kitchens</li>
                          </ul>
                        </div>
                        <div className="p-4 bg-purple-50 rounded-lg">
                          <h4 className="font-semibold text-purple-800 mb-2">
                            Application Process
                          </h4>
                          <ul className="text-sm text-purple-700 space-y-1">
                            <li>• Online application system</li>
                            <li>• Early application recommended</li>
                            <li>• Various accommodation options</li>
                            <li>• Payment plan options</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Student Activities */}
                <Card className="border-0 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-book-50 to-white">
                    <CardTitle className="text-xl flex items-center text-gray-900">
                      <Heart className="h-6 w-6 mr-3 text-book-500" />
                      Student Activities & Organizations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="space-y-4">
                        <h4 className="font-semibold text-lg">
                          Sports & Recreation
                        </h4>
                        <div className="space-y-3">
                          <div className="p-3 bg-orange-50 rounded-lg">
                            <h5 className="font-medium text-orange-800">
                              Sports Clubs
                            </h5>
                            <p className="text-sm text-orange-700">
                              Rugby, soccer, netball, athletics, and more
                            </p>
                          </div>
                          <div className="p-3 bg-red-50 rounded-lg">
                            <h5 className="font-medium text-red-800">
                              Fitness Facilities
                            </h5>
                            <p className="text-sm text-red-700">
                              Modern gym and fitness centers
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h4 className="font-semibold text-lg">
                          Cultural Activities
                        </h4>
                        <div className="space-y-3">
                          <div className="p-3 bg-purple-50 rounded-lg">
                            <h5 className="font-medium text-purple-800">
                              Cultural Societies
                            </h5>
                            <p className="text-sm text-purple-700">
                              Drama, music, dance, and arts clubs
                            </p>
                          </div>
                          <div className="p-3 bg-pink-50 rounded-lg">
                            <h5 className="font-medium text-pink-800">
                              Events & Festivals
                            </h5>
                            <p className="text-sm text-pink-700">
                              Annual festivals and cultural celebrations
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h4 className="font-semibold text-lg">
                          Academic & Professional
                        </h4>
                        <div className="space-y-3">
                          <div className="p-3 bg-blue-50 rounded-lg">
                            <h5 className="font-medium text-blue-800">
                              Academic Societies
                            </h5>
                            <p className="text-sm text-blue-700">
                              Subject-specific student organizations
                            </p>
                          </div>
                          <div className="p-3 bg-green-50 rounded-lg">
                            <h5 className="font-medium text-green-800">
                              Leadership Programs
                            </h5>
                            <p className="text-sm text-green-700">
                              Student leadership and mentorship
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Campus Facilities */}
                <Card className="border-0 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-book-50 to-white">
                    <CardTitle className="text-xl flex items-center text-gray-900">
                      <Building2 className="h-6 w-6 mr-3 text-book-500" />
                      Campus Facilities
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="p-4 bg-book-50 rounded-lg">
                          <h4 className="font-semibold text-book-800 mb-3">
                            Academic Facilities
                          </h4>
                          <ul className="text-sm text-book-700 space-y-2">
                            <li className="flex items-center">
                              <BookOpen className="h-4 w-4 mr-2" />
                              Modern libraries with digital resources
                            </li>
                            <li className="flex items-center">
                              <Users className="h-4 w-4 mr-2" />
                              State-of-the-art laboratories
                            </li>
                            <li className="flex items-center">
                              <Globe className="h-4 w-4 mr-2" />
                              Computer labs and IT facilities
                            </li>
                            <li className="flex items-center">
                              <Building2 className="h-4 w-4 mr-2" />
                              Lecture halls and seminar rooms
                            </li>
                          </ul>
                        </div>
                        <div className="p-4 bg-green-50 rounded-lg">
                          <h4 className="font-semibold text-green-800 mb-3">
                            Student Support
                          </h4>
                          <ul className="text-sm text-green-700 space-y-2">
                            <li className="flex items-center">
                              <Heart className="h-4 w-4 mr-2" />
                              Counseling and wellness center
                            </li>
                            <li className="flex items-center">
                              <Users className="h-4 w-4 mr-2" />
                              Academic support services
                            </li>
                            <li className="flex items-center">
                              <Award className="h-4 w-4 mr-2" />
                              Career guidance center
                            </li>
                            <li className="flex items-center">
                              <Info className="h-4 w-4 mr-2" />
                              Disability support services
                            </li>
                          </ul>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <h4 className="font-semibold text-blue-800 mb-3">
                            Campus Amenities
                          </h4>
                          <ul className="text-sm text-blue-700 space-y-2">
                            <li className="flex items-center">
                              <Building2 className="h-4 w-4 mr-2" />
                              Student center and dining halls
                            </li>
                            <li className="flex items-center">
                              <MapPin className="h-4 w-4 mr-2" />
                              Campus bookstore and shops
                            </li>
                            <li className="flex items-center">
                              <Users className="h-4 w-4 mr-2" />
                              Banking and postal services
                            </li>
                            <li className="flex items-center">
                              <Heart className="h-4 w-4 mr-2" />
                              Medical center and pharmacy
                            </li>
                          </ul>
                        </div>
                        <div className="p-4 bg-orange-50 rounded-lg">
                          <h4 className="font-semibold text-orange-800 mb-3">
                            Transportation
                          </h4>
                          <ul className="text-sm text-orange-700 space-y-2">
                            <li className="flex items-center">
                              <MapPin className="h-4 w-4 mr-2" />
                              Campus shuttle services
                            </li>
                            <li className="flex items-center">
                              <Users className="h-4 w-4 mr-2" />
                              Public transport links
                            </li>
                            <li className="flex items-center">
                              <Building2 className="h-4 w-4 mr-2" />
                              Parking facilities
                            </li>
                            <li className="flex items-center">
                              <Award className="h-4 w-4 mr-2" />
                              Bicycle-friendly campus
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Student Support Services */}
                <Card className="border-0 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-book-50 to-white">
                    <CardTitle className="text-xl flex items-center text-gray-900">
                      <Users className="h-6 w-6 mr-3 text-book-500" />
                      Student Support Services
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="p-4 bg-gradient-to-r from-book-100 to-book-50 rounded-lg">
                          <h4 className="font-semibold text-book-800 mb-2">
                            Academic Support
                          </h4>
                          <p className="text-sm text-book-700">
                            Tutoring programs, study groups, and academic
                            advising to help you succeed.
                          </p>
                        </div>
                        <div className="p-4 bg-gradient-to-r from-green-100 to-green-50 rounded-lg">
                          <h4 className="font-semibold text-green-800 mb-2">
                            Mental Health & Wellness
                          </h4>
                          <p className="text-sm text-green-700">
                            Professional counseling services and wellness
                            programs for student wellbeing.
                          </p>
                        </div>
                        <div className="p-4 bg-gradient-to-r from-blue-100 to-blue-50 rounded-lg">
                          <h4 className="font-semibold text-blue-800 mb-2">
                            Financial Aid Office
                          </h4>
                          <p className="text-sm text-blue-700">
                            Assistance with funding, bursaries, and financial
                            planning for your studies.
                          </p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="p-4 bg-gradient-to-r from-purple-100 to-purple-50 rounded-lg">
                          <h4 className="font-semibold text-purple-800 mb-2">
                            Career Services
                          </h4>
                          <p className="text-sm text-purple-700">
                            Career guidance, internship placement, and job
                            search assistance.
                          </p>
                        </div>
                        <div className="p-4 bg-gradient-to-r from-orange-100 to-orange-50 rounded-lg">
                          <h4 className="font-semibold text-orange-800 mb-2">
                            International Student Support
                          </h4>
                          <p className="text-sm text-orange-700">
                            Specialized support for international students
                            including visa and cultural assistance.
                          </p>
                        </div>
                        <div className="p-4 bg-gradient-to-r from-pink-100 to-pink-50 rounded-lg">
                          <h4 className="font-semibold text-pink-800 mb-2">
                            Diversity & Inclusion
                          </h4>
                          <p className="text-sm text-pink-700">
                            Programs promoting diversity, equality, and
                            inclusive campus culture.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="resources" className="mt-0">
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    University Resources
                  </h2>
                  <p className="text-gray-600">
                    Essential resources, facilities, and support services at{" "}
                    {university.name}
                  </p>
                </div>

                {/* Library & Learning Resources */}
                <Card className="border-0 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-book-50 to-white">
                    <CardTitle className="text-xl flex items-center text-gray-900">
                      <BookOpen className="h-6 w-6 mr-3 text-book-500" />
                      Library & Learning Resources
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="p-4 bg-book-50 rounded-lg">
                          <h4 className="font-semibold text-book-800 mb-3">
                            Digital Resources
                          </h4>
                          <ul className="text-sm text-book-700 space-y-2">
                            <li className="flex items-center">
                              <Globe className="h-4 w-4 mr-2" />
                              Online databases and journals
                            </li>
                            <li className="flex items-center">
                              <BookOpen className="h-4 w-4 mr-2" />
                              E-books and digital collections
                            </li>
                            <li className="flex items-center">
                              <Users className="h-4 w-4 mr-2" />
                              Research support services
                            </li>
                            <li className="flex items-center">
                              <Info className="h-4 w-4 mr-2" />
                              Citation and writing support
                            </li>
                          </ul>
                        </div>
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <h4 className="font-semibold text-blue-800 mb-3">
                            Study Spaces
                          </h4>
                          <ul className="text-sm text-blue-700 space-y-2">
                            <li className="flex items-center">
                              <Building2 className="h-4 w-4 mr-2" />
                              Quiet study areas
                            </li>
                            <li className="flex items-center">
                              <Users className="h-4 w-4 mr-2" />
                              Group study rooms
                            </li>
                            <li className="flex items-center">
                              <Globe className="h-4 w-4 mr-2" />
                              24/7 access areas
                            </li>
                            <li className="flex items-center">
                              <BookOpen className="h-4 w-4 mr-2" />
                              Computer labs
                            </li>
                          </ul>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="p-4 bg-green-50 rounded-lg">
                          <h4 className="font-semibold text-green-800 mb-3">
                            Library Services
                          </h4>
                          <ul className="text-sm text-green-700 space-y-2">
                            <li className="flex items-center">
                              <Award className="h-4 w-4 mr-2" />
                              Librarian consultations
                            </li>
                            <li className="flex items-center">
                              <TrendingUp className="h-4 w-4 mr-2" />
                              Research training workshops
                            </li>
                            <li className="flex items-center">
                              <Users className="h-4 w-4 mr-2" />
                              Interlibrary loan services
                            </li>
                            <li className="flex items-center">
                              <Info className="h-4 w-4 mr-2" />
                              Subject specialist support
                            </li>
                          </ul>
                        </div>
                        <div className="p-4 bg-purple-50 rounded-lg">
                          <h4 className="font-semibold text-purple-800 mb-3">
                            Technology Access
                          </h4>
                          <ul className="text-sm text-purple-700 space-y-2">
                            <li className="flex items-center">
                              <Globe className="h-4 w-4 mr-2" />
                              Campus-wide Wi-Fi
                            </li>
                            <li className="flex items-center">
                              <Users className="h-4 w-4 mr-2" />
                              Laptop lending program
                            </li>
                            <li className="flex items-center">
                              <Building2 className="h-4 w-4 mr-2" />
                              Printing and scanning
                            </li>
                            <li className="flex items-center">
                              <Award className="h-4 w-4 mr-2" />
                              Software access
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Academic Support */}
                <Card className="border-0 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-book-50 to-white">
                    <CardTitle className="text-xl flex items-center text-gray-900">
                      <GraduationCap className="h-6 w-6 mr-3 text-book-500" />
                      Academic Support Services
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="space-y-4">
                        <h4 className="font-semibold text-lg">
                          Learning Support
                        </h4>
                        <div className="space-y-3">
                          <div className="p-3 bg-book-50 rounded-lg">
                            <h5 className="font-medium text-book-800">
                              Tutoring Services
                            </h5>
                            <p className="text-sm text-book-700">
                              Peer and professional tutoring programs
                            </p>
                          </div>
                          <div className="p-3 bg-green-50 rounded-lg">
                            <h5 className="font-medium text-green-800">
                              Study Skills Workshops
                            </h5>
                            <p className="text-sm text-green-700">
                              Time management and study techniques
                            </p>
                          </div>
                          <div className="p-3 bg-blue-50 rounded-lg">
                            <h5 className="font-medium text-blue-800">
                              Writing Center
                            </h5>
                            <p className="text-sm text-blue-700">
                              Academic writing and research support
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h4 className="font-semibold text-lg">
                          Language Support
                        </h4>
                        <div className="space-y-3">
                          <div className="p-3 bg-purple-50 rounded-lg">
                            <h5 className="font-medium text-purple-800">
                              Language Center
                            </h5>
                            <p className="text-sm text-purple-700">
                              English and multilingual support
                            </p>
                          </div>
                          <div className="p-3 bg-orange-50 rounded-lg">
                            <h5 className="font-medium text-orange-800">
                              ESL Programs
                            </h5>
                            <p className="text-sm text-orange-700">
                              English as Second Language support
                            </p>
                          </div>
                          <div className="p-3 bg-pink-50 rounded-lg">
                            <h5 className="font-medium text-pink-800">
                              Translation Services
                            </h5>
                            <p className="text-sm text-pink-700">
                              Document translation assistance
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h4 className="font-semibold text-lg">Accessibility</h4>
                        <div className="space-y-3">
                          <div className="p-3 bg-red-50 rounded-lg">
                            <h5 className="font-medium text-red-800">
                              Disability Services
                            </h5>
                            <p className="text-sm text-red-700">
                              Accommodation and support services
                            </p>
                          </div>
                          <div className="p-3 bg-yellow-50 rounded-lg">
                            <h5 className="font-medium text-yellow-800">
                              Assistive Technology
                            </h5>
                            <p className="text-sm text-yellow-700">
                              Specialized equipment and software
                            </p>
                          </div>
                          <div className="p-3 bg-indigo-50 rounded-lg">
                            <h5 className="font-medium text-indigo-800">
                              Sign Language
                            </h5>
                            <p className="text-sm text-indigo-700">
                              Interpreter services available
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Research & Innovation */}
                <Card className="border-0 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-book-50 to-white">
                    <CardTitle className="text-xl flex items-center text-gray-900">
                      <TrendingUp className="h-6 w-6 mr-3 text-book-500" />
                      Research & Innovation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="p-4 bg-book-50 rounded-lg">
                          <h4 className="font-semibold text-book-800 mb-3">
                            Research Centers
                          </h4>
                          <ul className="text-sm text-book-700 space-y-2">
                            <li className="flex items-center">
                              <TrendingUp className="h-4 w-4 mr-2" />
                              Specialized research institutes
                            </li>
                            <li className="flex items-center">
                              <Users className="h-4 w-4 mr-2" />
                              Collaborative research projects
                            </li>
                            <li className="flex items-center">
                              <Globe className="h-4 w-4 mr-2" />
                              International partnerships
                            </li>
                            <li className="flex items-center">
                              <Award className="h-4 w-4 mr-2" />
                              Research funding opportunities
                            </li>
                          </ul>
                        </div>
                        <div className="p-4 bg-green-50 rounded-lg">
                          <h4 className="font-semibold text-green-800 mb-3">
                            Innovation Hub
                          </h4>
                          <ul className="text-sm text-green-700 space-y-2">
                            <li className="flex items-center">
                              <Building2 className="h-4 w-4 mr-2" />
                              Entrepreneurship programs
                            </li>
                            <li className="flex items-center">
                              <Users className="h-4 w-4 mr-2" />
                              Startup incubation
                            </li>
                            <li className="flex items-center">
                              <TrendingUp className="h-4 w-4 mr-2" />
                              Technology transfer
                            </li>
                            <li className="flex items-center">
                              <Award className="h-4 w-4 mr-2" />
                              Innovation competitions
                            </li>
                          </ul>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <h4 className="font-semibold text-blue-800 mb-3">
                            Graduate Research
                          </h4>
                          <ul className="text-sm text-blue-700 space-y-2">
                            <li className="flex items-center">
                              <GraduationCap className="h-4 w-4 mr-2" />
                              Masters and PhD programs
                            </li>
                            <li className="flex items-center">
                              <Users className="h-4 w-4 mr-2" />
                              Research supervision
                            </li>
                            <li className="flex items-center">
                              <BookOpen className="h-4 w-4 mr-2" />
                              Thesis writing support
                            </li>
                            <li className="flex items-center">
                              <Globe className="h-4 w-4 mr-2" />
                              Conference funding
                            </li>
                          </ul>
                        </div>
                        <div className="p-4 bg-purple-50 rounded-lg">
                          <h4 className="font-semibold text-purple-800 mb-3">
                            Industry Partnerships
                          </h4>
                          <ul className="text-sm text-purple-700 space-y-2">
                            <li className="flex items-center">
                              <Building2 className="h-4 w-4 mr-2" />
                              Corporate collaborations
                            </li>
                            <li className="flex items-center">
                              <TrendingUp className="h-4 w-4 mr-2" />
                              Internship programs
                            </li>
                            <li className="flex items-center">
                              <Users className="h-4 w-4 mr-2" />
                              Guest lectures and seminars
                            </li>
                            <li className="flex items-center">
                              <Award className="h-4 w-4 mr-2" />
                              Job placement assistance
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Contact Information */}
                <Card className="border-0 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-book-50 to-white">
                    <CardTitle className="text-xl flex items-center text-gray-900">
                      <Info className="h-6 w-6 mr-3 text-book-500" />
                      Contact & Support
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="font-semibold text-lg">
                          General Information
                        </h4>
                        <div className="space-y-3">
                          <div className="flex items-center p-3 bg-book-50 rounded">
                            <Globe className="h-5 w-5 mr-3 text-book-500" />
                            <div>
                              <span className="font-medium">Website:</span>
                              <a
                                href={university.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-book-600 hover:text-book-700 underline ml-2"
                              >
                                {university.website}
                              </a>
                            </div>
                          </div>
                          {university.studentPortal && (
                            <div className="flex items-center p-3 bg-blue-50 rounded">
                              <Users className="h-5 w-5 mr-3 text-blue-500" />
                              <div>
                                <span className="font-medium">
                                  Student Portal:
                                </span>
                                <a
                                  href={university.studentPortal}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-700 underline ml-2"
                                >
                                  Student Services
                                </a>
                              </div>
                            </div>
                          )}
                          <div className="flex items-center p-3 bg-green-50 rounded">
                            <MapPin className="h-5 w-5 mr-3 text-green-500" />
                            <div>
                              <span className="font-medium">Location:</span>
                              <span className="ml-2">
                                {university.location}, {university.province}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h4 className="font-semibold text-lg">Quick Actions</h4>
                        <div className="space-y-3">
                          <Button
                            className="w-full bg-book-600 hover:bg-book-700 text-white"
                            asChild
                          >
                            <a
                              href={university.website}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-5 w-5 mr-2" />
                              Visit Official Website
                            </a>
                          </Button>
                          <Button
                            variant="outline"
                            className="w-full border-book-200 text-book-600 hover:bg-book-50"
                            onClick={handleAPSCalculator}
                          >
                            <Calculator className="h-5 w-5 mr-2" />
                            Calculate My APS Score
                          </Button>
                          <Button
                            variant="outline"
                            className="w-full border-blue-200 text-blue-600 hover:bg-blue-50"
                          >
                            <BookOpen className="h-5 w-5 mr-2" />
                            Find Textbooks for {university.name}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Program Detail Modal */}
      <ProgramDetailModal
        program={selectedProgram}
        university={university}
        isOpen={isProgramModalOpen}
        onClose={closeProgramModal}
      />
    </Layout>
  );
};

export default UniversityProfile;

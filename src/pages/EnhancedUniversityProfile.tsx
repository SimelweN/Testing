import React, { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  ExternalLink,
  MapPin,
  BookOpen,
  Users,
  Calendar,
  Search,
  Building,
  GraduationCap,
  Award,
  ChevronDown,
  ChevronUp,
  Home,
  Globe,
  Mail,
  Phone,
  Star,
  Target,
  TrendingUp,
  CheckCircle,
  BarChart3,
  Briefcase,
  BookMarked,
  CreditCard,
  Clock,
  Shield,
  Lightbulb,
  Zap,
  Heart,
  Trophy,
  Calculator,
  ChevronRight,
  AlertTriangle,
  Filter,
  X,
  Loader2,
  Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { University, Faculty, Degree } from "@/types/university";
import { ALL_SOUTH_AFRICAN_UNIVERSITIES } from "@/constants/universities/index";
import CampusNavbar from "@/components/CampusNavbar";
import SEO from "@/components/SEO";
import {
  useAPSAwareCourseAssignment,
  useAPSFilterOptions,
} from "@/hooks/useAPSAwareCourseAssignment";
import { assessEligibility } from "@/services/eligibilityService";
import {
  getUniversityLogoPath,
  createLogoFallbackHandler,
} from "@/utils/universityLogoUtils";
import { getUniversityFaculties } from "@/constants/universities/comprehensive-course-database";
import { toast } from "sonner";
import "@/styles/university-profile-mobile.css";

/**
 * Enhanced University Profile with APS-aware filtering
 * Addresses critical errors in program assignment and user experience
 */

const EnhancedUniversityProfile: React.FC = () => {
  const { id: universityId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Enhanced state management
  const [expandedFaculties, setExpandedFaculties] = useState<Set<string>>(
    new Set(),
  );
  const [activeTab, setActiveTab] = useState("programs");
  const [showAPSHelper, setShowAPSHelper] = useState(false);

  // APS-aware filtering
  const {
    userProfile,
    isLoading: apsLoading,
    error,
    hasValidProfile,
    qualificationSummary,
    searchCoursesForUniversity,
    checkProgramEligibility,
    clearAPSProfile,
    clearError,
  } = useAPSAwareCourseAssignment(universityId);

  // Detect if coming from APS calculator
  const searchParams = new URLSearchParams(location.search);
  const fromAPS = searchParams.get("fromAPS") === "true";
  const apsScore = searchParams.get("aps");

  // Show APS context message when coming from APS results
  useEffect(() => {
    if (fromAPS && apsScore) {
      console.log(`Navigated from APS calculator with score: ${apsScore}`);
      // Set active tab to programs to show APS-filtered content
      setActiveTab("programs");
    }
  }, [fromAPS, apsScore]);

  const {
    filterOptions,
    includeAlmostQualified,
    setIncludeAlmostQualified,
    maxAPSGap,
    setMaxAPSGap,
    facultyFilter,
    setFacultyFilter,
    sortBy,
    setSortBy,
  } = useAPSFilterOptions();

  // Enhanced university data with comprehensive error handling
  const universityData = useMemo(() => {
    if (!universityId) {
      return {
        university: null,
        error: "No university ID provided",
        isLoading: false,
      };
    }

    try {
      const sanitizedId = universityId.toLowerCase().trim();
      const baseUniversity = ALL_SOUTH_AFRICAN_UNIVERSITIES.find(
        (uni) => uni.id === sanitizedId,
      );

      if (!baseUniversity) {
        return {
          university: null,
          error: `University not found: ${universityId}`,
          isLoading: false,
        };
      }

      return {
        university: baseUniversity,
        error: null,
        isLoading: false,
      };
    } catch (err) {
      return {
        university: null,
        error: `Error loading university data: ${err}`,
        isLoading: false,
      };
    }
  }, [universityId]);

  // Enhanced faculties with APS filtering
  const [facultiesData, setFacultiesData] = useState<{
    faculties: Faculty[];
    statistics: any;
    errors: string[];
    warnings: string[];
    isLoading: boolean;
  }>({
    faculties: [],
    statistics: {
      totalFaculties: 0,
      totalDegrees: 0,
      eligibleDegrees: 0,
      averageAPS: 0,
    },
    errors: [],
    warnings: [],
    isLoading: false,
  });

  // Load faculties when university or APS profile changes
  useEffect(() => {
    if (universityId && universityData.university) {
      setFacultiesData((prev) => ({ ...prev, isLoading: true }));

      // Debug logging
      if (import.meta.env.DEV) {
        console.log(`Loading faculties for university: ${universityId}`);
      }

      try {
        // Get faculties directly from the university data
        const faculties = getUniversityFaculties(universityId);

        // Calculate statistics
        const totalDegrees = faculties.reduce(
          (total, faculty) => total + (faculty.degrees?.length || 0),
          0,
        );
        const eligibleDegrees =
          userProfile || (fromAPS && apsScore)
            ? faculties.reduce((total, faculty) => {
                return (
                  total +
                  (faculty.degrees?.filter((degree) => {
                    const eligibility = checkProgramEligibility(
                      degree,
                      fromAPS && apsScore ? parseInt(apsScore) : undefined,
                    );
                    return eligibility.eligible;
                  }).length || 0)
                );
              }, 0)
            : 0;

        // Debug logging
        if (import.meta.env.DEV) {
          console.log(`Faculty results for ${universityId}:`, {
            facultiesCount: faculties.length,
            totalDegrees,
            eligibleDegrees,
          });
        }

        setFacultiesData({
          faculties,
          statistics: {
            totalFaculties: faculties.length,
            totalDegrees,
            eligibleDegrees,
            averageAPS: 0, // Can be calculated if needed
          },
          errors: [],
          warnings: [],
          isLoading: false,
        });
      } catch (err) {
        console.error(`Error loading faculties for ${universityId}:`, err);
        setFacultiesData({
          faculties: [],
          statistics: {
            totalFaculties: 0,
            totalDegrees: 0,
            eligibleDegrees: 0,
            averageAPS: 0,
          },
          errors: [`Error loading faculties: ${err}`],
          warnings: [],
          isLoading: false,
        });
      }
    }
  }, [
    universityId,
    universityData.university,
    userProfile,
    checkProgramEligibility,
    fromAPS,
    apsScore,
  ]);

  // Listen for global APS profile clearing event
  useEffect(() => {
    const handleAPSProfileCleared = () => {
      // Reset faculties data to clean state
      setFacultiesData((prev) => ({
        ...prev,
        statistics: {
          totalFaculties: prev.faculties.length,
          totalDegrees: prev.faculties.reduce(
            (total, faculty) => total + (faculty.degrees?.length || 0),
            0,
          ),
          eligibleDegrees: 0,
          averageAPS: 0,
        },
      }));
    };

    window.addEventListener("apsProfileCleared", handleAPSProfileCleared);
    return () => {
      window.removeEventListener("apsProfileCleared", handleAPSProfileCleared);
    };
  }, []);

  // Enhanced statistics calculation
  const enhancedStats = useMemo(() => {
    const baseStats = {
      students: universityData.university?.studentPopulation
        ? universityData.university.studentPopulation > 1000
          ? `${Math.round(universityData.university.studentPopulation / 1000)}k+`
          : universityData.university.studentPopulation.toString()
        : "N/A",
      established:
        universityData.university?.establishedYear?.toString() || "N/A",
      faculties: facultiesData.statistics.totalFaculties,
      programs: facultiesData.statistics.totalDegrees,
      province: universityData.university?.province || "N/A",
    };

    // Add APS-aware statistics
    if (hasValidProfile) {
      return {
        ...baseStats,
        eligiblePrograms: facultiesData.statistics.eligibleDegrees,
        averageAPS: facultiesData.statistics.averageAPS,
        eligibilityRate:
          facultiesData.statistics.totalDegrees > 0
            ? Math.round(
                (facultiesData.statistics.eligibleDegrees /
                  facultiesData.statistics.totalDegrees) *
                  100,
              )
            : 0,
      };
    }

    return baseStats;
  }, [universityData.university, facultiesData.statistics, hasValidProfile]);

  // Handle back navigation
  const handleBack = () => {
    navigate("/university-info");
  };

  // Handle faculty expansion with error handling
  const toggleFaculty = (facultyId: string | undefined) => {
    if (!facultyId) return;

    try {
      const newExpanded = new Set(expandedFaculties);
      if (newExpanded.has(facultyId)) {
        newExpanded.delete(facultyId);
      } else {
        newExpanded.add(facultyId);
      }
      setExpandedFaculties(newExpanded);
    } catch (err) {
      console.error("Error toggling faculty:", err);
    }
  };

  // Enhanced website visit with validation
  const handleVisitWebsite = () => {
    try {
      if (universityData.university?.website) {
        // Validate URL format
        const url = universityData.university.website.startsWith("http")
          ? universityData.university.website
          : `https://${universityData.university.website}`;
        window.open(url, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      console.error("Error opening website:", err);
    }
  };

  // Enhanced navigation handlers
  const handleViewBooks = () => {
    if (universityData.university?.id) {
      navigate(`/books?university=${universityData.university.id}`);
    }
  };

  const handleAPSCalculator = () => {
    navigate("/university-info?tool=aps-calculator");
  };

  const handleBursaries = () => {
    navigate("/university-info?tool=bursaries");
  };

  // Filter faculties based on current settings
  const filteredFaculties = useMemo(() => {
    let filtered = facultiesData.faculties;

    // Apply faculty filter
    if (facultyFilter !== "all") {
      filtered = filtered.filter((f) =>
        f.name.toLowerCase().includes(facultyFilter.toLowerCase()),
      );
    }

    // Sort faculties
    filtered.sort((a, b) => {
      if (sortBy === "eligibility" && hasValidProfile) {
        const aEligible = a.degrees.filter((d: any) => d.isEligible).length;
        const bEligible = b.degrees.filter((d: any) => d.isEligible).length;
        return bEligible - aEligible;
      } else if (sortBy === "aps") {
        const aAvgAPS =
          a.degrees.reduce((sum, d) => sum + d.apsRequirement, 0) /
          a.degrees.length;
        const bAvgAPS =
          b.degrees.reduce((sum, d) => sum + d.apsRequirement, 0) /
          b.degrees.length;
        return aAvgAPS - bAvgAPS;
      } else {
        return a.name.localeCompare(b.name);
      }
    });

    return filtered;
  }, [facultiesData.faculties, facultyFilter, sortBy, hasValidProfile]);

  // Get unique faculty names for filter dropdown
  const availableFaculties = useMemo(() => {
    return [
      ...new Set(
        facultiesData.faculties.map((f) => f.name.replace("Faculty of ", "")),
      ),
    ].sort();
  }, [facultiesData.faculties]);

  // Error handling
  if (universityData.error) {
    return (
      <>
        <CampusNavbar />
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              University Not Found
            </h1>
            <p className="text-slate-600 mb-6">{universityData.error}</p>
            <Button
              onClick={handleBack}
              className="bg-book-600 hover:bg-book-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Universities
            </Button>
          </div>
        </div>
      </>
    );
  }

  const university = universityData.university;
  if (!university) return null;

  return (
    <>
      <SEO
        title={`${university.name} - Enhanced University Profile | ReBooked Campus`}
        description={`Comprehensive profile of ${university.fullName || university.name} with APS-aware program filtering. Find programs you qualify for based on your matric results.`}
        keywords={`${university.name}, ${university.abbreviation}, APS calculator, university programs, admission requirements, South African universities`}
        url={`https://www.rebookedsolutions.co.za/university/${university.id}`}
      />

      <CampusNavbar />

      <div className="min-h-screen bg-white">
        {/* Modern Hero Section */}
        <div className="bg-white px-6 py-8">
          <div className="container mx-auto">
            {/* Back Button */}
            <Button
              onClick={handleBack}
              variant="ghost"
              className="text-gray-600 hover:bg-gray-100 mb-8 p-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Universities
            </Button>

            {/* University Header */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              {/* Left: University Info */}
              <div className="lg:col-span-2">
                <div className="flex items-start gap-6 mb-6">
                  <div className="relative flex-shrink-0">
                    <div className="w-20 h-20 bg-white rounded-2xl shadow-lg border-4 border-green-100 p-3 flex items-center justify-center">
                      <img
                        src={
                          getUniversityLogoPath(university.id) ||
                          university.logo ||
                          "/university-logos/default.svg"
                        }
                        alt={`${university.name} logo`}
                        className="w-full h-full object-contain"
                        onError={createLogoFallbackHandler(
                          university.id,
                          university.name,
                        )}
                      />
                    </div>
                    {/* Award Badge */}
                    <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <Award className="w-3 h-3 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <Badge className="bg-green-100 text-green-700 border-green-200 mb-3">
                      {university.type || "Traditional University"}
                    </Badge>
                    <h1 className="text-3xl font-bold text-gray-900 mb-3">
                      {university.name}
                    </h1>
                    <div className="flex items-center gap-2 mb-4">
                      <MapPin className="w-5 h-5 text-gray-400" />
                      <span className="text-lg text-gray-600">
                        {university.location}, {university.province}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-gray-700 max-w-3xl mt-4">
                  {university.overview}
                </p>

                {/* Action Buttons */}
                <div className="flex gap-4 mt-6">
                  <Button
                    onClick={handleViewBooks}
                    className="bg-green-600 hover:bg-green-700 text-white shadow-lg"
                  >
                    <BookOpen className="w-5 h-5 mr-2" />
                    Find Textbooks
                  </Button>
                  <Button
                    onClick={handleAPSCalculator}
                    variant="outline"
                    className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                  >
                    <Calculator className="w-5 h-5 mr-2" />
                    APS Calculator
                  </Button>
                  <Button
                    onClick={handleVisitWebsite}
                    variant="outline"
                    className="bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                  >
                    <Globe className="w-5 h-5 mr-2" />
                    <span className="hidden sm:inline">Official Website</span>
                    <span className="sm:hidden">Website</span>
                  </Button>
                </div>
              </div>

              {/* Right: Stats Card */}
              <div>
                <div className="bg-white border border-gray-200 rounded-xl shadow-lg">
                  <div className="p-6">
                    <div className="flex items-center mb-6">
                      <BarChart3 className="w-5 h-5 text-green-500 mr-3" />
                      <h3 className="text-lg font-semibold text-gray-900">
                        Quick Stats
                      </h3>
                    </div>
                  </div>
                  <div className="px-6 pb-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between py-2">
                        <span className="text-gray-600 font-medium">
                          Students
                        </span>
                        <div className="flex items-center">
                          <Users className="w-4 h-4 text-green-500 mr-1" />
                          <span className="text-gray-900 font-bold">
                            {enhancedStats.students}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between py-2 mt-4">
                        <span className="text-gray-600 font-medium">
                          Founded
                        </span>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 text-green-500 mr-1" />
                          <span className="text-gray-900 font-bold">
                            {enhancedStats.established}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between py-2 mt-4">
                        <span className="text-gray-600 font-medium">
                          Faculties
                        </span>
                        <div className="flex items-center">
                          <Building className="w-4 h-4 text-green-500 mr-1" />
                          <span className="text-gray-900 font-bold">
                            {enhancedStats.faculties}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between py-2 mt-4">
                        <span className="text-gray-600 font-medium">
                          Programs
                        </span>
                        <div className="flex items-center">
                          <GraduationCap className="w-4 h-4 text-green-500 mr-1" />
                          <span className="text-gray-900 font-bold">
                            {enhancedStats.programs}
                          </span>
                        </div>
                      </div>

                      {/* APS-aware stats */}
                      {hasValidProfile && (
                        <>
                          <div className="flex items-center justify-between py-2 mt-4 border-t border-gray-200 pt-2">
                            <span className="text-gray-600 font-medium">
                              Eligible
                            </span>
                            <span className="text-green-600 font-bold">
                              {(enhancedStats as any).eligiblePrograms}
                            </span>
                          </div>
                          <div className="flex items-center justify-between py-2">
                            <span className="text-gray-600 font-medium">
                              Avg APS
                            </span>
                            <span className="text-gray-900 font-bold">
                              {(enhancedStats as any).averageAPS}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Main Content */}
        <div className="container mx-auto px-6 pb-16">
          {/* Error Alerts */}
          {(error || facultiesData.errors.length > 0) && (
            <div className="mb-6">
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {error || facultiesData.errors.join("; ")}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={clearError}
                    className="ml-2 h-auto p-1 text-red-600 hover:text-red-800"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Warning Alerts */}
          {facultiesData.warnings.length > 0 && (
            <div className="mb-6">
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  {facultiesData.warnings.join("; ")}
                </AlertDescription>
              </Alert>
            </div>
          )}

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="university-tabs space-y-6 lg:space-y-8"
          >
            <div className="bg-white border border-gray-200 rounded-xl shadow-lg mb-8">
              {/* Mobile Tab List - Stack vertically */}
              <div className="block sm:hidden">
                <div className="flex flex-col p-2 bg-gray-50 rounded-xl">
                  <TabsTrigger
                    value="programs"
                    className="data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg text-sm px-4 py-3 flex items-center justify-center w-full"
                  >
                    <GraduationCap className="w-5 h-5 mr-3" />
                    Academic Programs
                  </TabsTrigger>
                  <TabsTrigger
                    value="admissions"
                    className="data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg text-sm px-4 py-3 mt-2 flex items-center justify-center w-full"
                  >
                    <Calendar className="w-5 h-5 mr-3" />
                    Admissions
                  </TabsTrigger>
                  <TabsTrigger
                    value="student-life"
                    className="data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg text-sm px-4 py-3 mt-2 flex items-center justify-center w-full"
                  >
                    <Heart className="w-5 h-5 mr-3" />
                    Campus Life
                  </TabsTrigger>
                  <TabsTrigger
                    value="resources"
                    className="data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg text-sm px-4 py-3 mt-2 flex items-center justify-center w-full"
                  >
                    <Info className="w-5 h-5 mr-3" />
                    Resources
                  </TabsTrigger>
                </div>
              </div>

              {/* Desktop Tab List - Grid layout */}
              <div className="hidden sm:block">
                <TabsList className="grid w-full grid-cols-4 bg-gray-50 rounded-xl p-1">
                  <TabsTrigger
                    value="programs"
                    className="data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg text-sm px-4 py-3 flex items-center justify-center"
                  >
                    <GraduationCap className="w-5 h-5 mr-2" />
                    <span className="hidden lg:inline">Academic Programs</span>
                    <span className="lg:hidden">Programs</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="admissions"
                    className="data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg text-sm px-4 py-3 flex items-center justify-center"
                  >
                    <Calendar className="w-5 h-5 mr-2" />
                    <span className="hidden lg:inline">Admissions</span>
                    <span className="lg:hidden">Apply</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="student-life"
                    className="data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg text-sm px-4 py-3 flex items-center justify-center"
                  >
                    <Heart className="w-5 h-5 mr-2" />
                    <span className="hidden lg:inline">Campus Life</span>
                    <span className="lg:hidden">Life</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="resources"
                    className="data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg text-sm px-4 py-3 flex items-center justify-center"
                  >
                    <Info className="w-5 h-5 mr-2" />
                    <span className="hidden lg:inline">Resources</span>
                    <span className="lg:hidden">Info</span>
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>

            {/* Enhanced Programs Tab */}
            <TabsContent value="programs">
              <div className="space-y-6">
                {/* APS Context Banner */}
                {fromAPS && apsScore && (
                  <Alert className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200 mb-6">
                    <Calculator className="h-4 w-4" />
                    <AlertDescription>
                      <strong>APS-Based View:</strong> You're viewing programs
                      at {university.name} based on your APS score of{" "}
                      <strong>{apsScore}</strong>.
                      {hasValidProfile
                        ? " Programs are filtered to show what you qualify for."
                        : " Complete your full APS profile for personalized filtering."}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 relative z-30">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">
                        Academic Programs
                      </h2>
                      <p className="text-slate-600 mt-1">
                        Explore {enhancedStats.programs} programs across{" "}
                        {enhancedStats.faculties} faculties
                      </p>
                    </div>

                    {/* APS Helper */}
                    {!hasValidProfile && (
                      <Button
                        onClick={handleAPSCalculator}
                        className="bg-book-600 hover:bg-book-700"
                      >
                        <Calculator className="w-4 h-4 mr-2" />
                        Calculate Your APS
                      </Button>
                    )}
                  </div>

                  {/* Enhanced Filters */}
                  <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 bg-slate-50 rounded-xl">
                    <div className="flex-1">
                      <Label className="text-sm font-medium text-slate-700 mb-2 block">
                        Filter by Faculty
                      </Label>
                      <Select
                        value={facultyFilter}
                        onValueChange={setFacultyFilter}
                      >
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

                    <div className="flex-1">
                      <Label className="text-sm font-medium text-slate-700 mb-2 block">
                        Sort by
                      </Label>
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="eligibility">
                            Eligibility
                          </SelectItem>
                          <SelectItem value="aps">APS Requirement</SelectItem>
                          <SelectItem value="name">Name</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {hasValidProfile && (
                      <div className="flex flex-col gap-2">
                        <Label className="text-sm font-medium text-slate-700">
                          Show Almost Eligible
                        </Label>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={includeAlmostQualified}
                            onCheckedChange={setIncludeAlmostQualified}
                          />
                          <span className="text-sm text-slate-600">
                            Within {maxAPSGap} points
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Loading State */}
                  {(apsLoading || facultiesData.isLoading) && (
                    <div className="flex items-center justify-center py-12">
                      <div className="flex items-center gap-3">
                        <Loader2 className="h-6 w-6 animate-spin text-green-600" />
                        <span className="text-gray-600">
                          Loading university programs...
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Programs Display */}
                  {!apsLoading && !facultiesData.isLoading && (
                    <>
                      {filteredFaculties.length > 0 ? (
                        <div className="space-y-4">
                          {/* Enhanced Statistics */}
                          {hasValidProfile && qualificationSummary && (
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                              <div className="bg-green-50 rounded-lg p-4 text-center">
                                <div className="text-2xl font-bold text-green-700">
                                  {qualificationSummary.eligible}
                                </div>
                                <div className="text-sm text-green-600">
                                  Eligible
                                </div>
                              </div>
                              <div className="bg-yellow-50 rounded-lg p-4 text-center">
                                <div className="text-2xl font-bold text-yellow-700">
                                  {qualificationSummary.almostEligible}
                                </div>
                                <div className="text-sm text-yellow-600">
                                  Almost Eligible
                                </div>
                              </div>
                              <div className="bg-blue-50 rounded-lg p-4 text-center">
                                <div className="text-2xl font-bold text-blue-700">
                                  {qualificationSummary.totalPrograms}
                                </div>
                                <div className="text-sm text-blue-600">
                                  Total Programs
                                </div>
                              </div>
                              <div className="bg-purple-50 rounded-lg p-4 text-center">
                                <div className="text-2xl font-bold text-purple-700">
                                  {qualificationSummary.percentageEligible}%
                                </div>
                                <div className="text-sm text-purple-600">
                                  Eligibility Rate
                                </div>
                              </div>
                            </div>
                          )}

                          {filteredFaculties.map((faculty) => (
                            <Card
                              key={faculty.id}
                              className="border-2 border-slate-100 hover:border-book-300 transition-all duration-200"
                            >
                              <CardHeader
                                className="cursor-pointer hover:bg-slate-50 transition-colors"
                                onClick={() => toggleFaculty(faculty.id)}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <CardTitle className="text-lg text-slate-900">
                                      {faculty.name}
                                    </CardTitle>
                                    <p className="text-slate-600 mt-1">
                                      {faculty.description}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <Badge variant="outline">
                                      {faculty.degrees?.length || 0} programs
                                    </Badge>
                                    {hasValidProfile && (
                                      <Badge className="bg-green-100 text-green-700">
                                        {
                                          faculty.degrees.filter(
                                            (d: any) => d.isEligible,
                                          ).length
                                        }{" "}
                                        eligible
                                      </Badge>
                                    )}
                                    {expandedFaculties.has(faculty.id) ? (
                                      <ChevronUp className="w-5 h-5 text-slate-400" />
                                    ) : (
                                      <ChevronDown className="w-5 h-5 text-slate-400" />
                                    )}
                                  </div>
                                </div>
                              </CardHeader>

                              {expandedFaculties.has(faculty.id) && (
                                <CardContent className="pt-4">
                                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
                                    {faculty.degrees?.map((degree) => {
                                      // Use centralized eligibility service
                                      const eligibilityResult =
                                        (hasValidProfile && userProfile) ||
                                        (fromAPS && apsScore)
                                          ? assessEligibility(
                                              {
                                                name: degree.name,
                                                faculty: degree.faculty,
                                                description: degree.description,
                                                duration: degree.duration,
                                                defaultAps:
                                                  degree.apsRequirement,
                                                subjects: degree.subjects,
                                                careerProspects:
                                                  degree.careerProspects,
                                                assignmentRule: { type: "all" },
                                              },
                                              universityId!,
                                              fromAPS && apsScore
                                                ? parseInt(apsScore)
                                                : userProfile?.totalAPS || 0,
                                              fromAPS && apsScore
                                                ? []
                                                : userProfile?.subjects || [], // For URL params, we only check APS, not subjects
                                            )
                                          : null;

                                      const isEligible =
                                        eligibilityResult?.isEligible || false;
                                      const category =
                                        eligibilityResult?.category ||
                                        "not-eligible";

                                      return (
                                        <div
                                          key={degree.id}
                                          className={`p-3 lg:p-4 rounded-xl border-2 transition-all ${
                                            category === "eligible"
                                              ? "bg-gradient-to-br from-green-50 to-green-100 border-green-200"
                                              : category === "almost-eligible"
                                                ? "bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200"
                                                : "bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200"
                                          }`}
                                        >
                                          <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-3 gap-2">
                                            <h4 className="font-semibold text-slate-900 leading-tight text-sm lg:text-base flex-1">
                                              {degree.name}
                                            </h4>
                                            <div className="flex gap-2 flex-wrap">
                                              <Badge
                                                className={`text-xs whitespace-nowrap ${
                                                  category === "eligible"
                                                    ? "bg-green-600 hover:bg-green-700"
                                                    : category ===
                                                        "almost-eligible"
                                                      ? "bg-yellow-600 hover:bg-yellow-700"
                                                      : "bg-slate-600 hover:bg-slate-700"
                                                }`}
                                              >
                                                APS {degree.apsRequirement}
                                              </Badge>

                                              {category === "eligible" && (
                                                <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                                                  <CheckCircle className="w-3 h-3 mr-1" />
                                                  Eligible
                                                </Badge>
                                              )}

                                              {category ===
                                                "almost-eligible" && (
                                                <Badge className="bg-yellow-100 text-yellow-700 text-xs">
                                                  <AlertTriangle className="w-3 h-3 mr-1" />
                                                  Almost Eligible
                                                </Badge>
                                              )}

                                              {eligibilityResult &&
                                                eligibilityResult.confidence <
                                                  100 && (
                                                  <Badge
                                                    variant="outline"
                                                    className="text-xs"
                                                  >
                                                    {
                                                      eligibilityResult.confidence
                                                    }
                                                    % confidence
                                                  </Badge>
                                                )}
                                            </div>
                                          </div>

                                          <p className="text-xs lg:text-sm text-slate-600 mb-3 line-clamp-2">
                                            {degree.description}
                                          </p>

                                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 text-xs text-slate-500">
                                            <div className="flex items-center gap-1">
                                              <Clock className="w-3 h-3 flex-shrink-0" />
                                              <span>{degree.duration}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                              <Briefcase className="w-3 h-3 flex-shrink-0" />
                                              <span>
                                                {degree.careerProspects
                                                  ?.length || 0}{" "}
                                                careers
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </CardContent>
                              )}
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <GraduationCap className="w-8 h-8 text-slate-400" />
                          </div>
                          <h3 className="text-lg font-medium text-slate-600 mb-2">
                            {facultiesData.errors.length > 0
                              ? "Error loading programs"
                              : hasValidProfile
                                ? "No programs match your criteria"
                                : "No program information available"}
                          </h3>
                          <p className="text-slate-500">
                            {facultiesData.errors.length > 0
                              ? "Please try again or contact support"
                              : hasValidProfile
                                ? "Try adjusting your filters or APS requirements"
                                : "Program information for this university is being updated"}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Keep existing tabs (admissions, student-life, resources) but enhance them */}
            <TabsContent value="admissions">
              {/* Use existing admissions content but enhance with APS awareness */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-white shadow-xl border-0 rounded-2xl relative z-30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <CreditCard className="w-5 h-5 text-book-600" />
                      Application Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {university.applicationInfo ? (
                      <>
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                          <span className="text-sm font-medium text-green-800">
                            Application Status
                          </span>
                          <Badge
                            className={
                              university.applicationInfo.isOpen
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }
                          >
                            {university.applicationInfo.isOpen
                              ? "Open"
                              : "Closed"}
                          </Badge>
                        </div>

                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-slate-600">
                              Opening Date:
                            </span>
                            <span className="font-medium">
                              {university.applicationInfo.openingDate}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">
                              Closing Date:
                            </span>
                            <span className="font-medium">
                              {university.applicationInfo.closingDate}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">
                              Academic Year:
                            </span>
                            <span className="font-medium">
                              {university.applicationInfo.academicYear}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">
                              Application Fee:
                            </span>
                            <span className="font-medium">
                              {university.applicationInfo.applicationFee}
                            </span>
                          </div>
                        </div>

                        <div className="pt-4 border-t">
                          <p className="text-sm text-slate-600 mb-3">
                            <strong>Application Method:</strong>{" "}
                            {university.applicationInfo.applicationMethod}
                          </p>
                          <Button
                            onClick={handleVisitWebsite}
                            className="w-full bg-book-600 hover:bg-book-700"
                          >
                            Apply Now
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                        <p className="text-slate-600">
                          Application information not available. Please visit
                          the university website for details.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-book-50 to-emerald-50 shadow-xl border-0 rounded-2xl relative z-30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Zap className="w-5 h-5 text-book-600" />
                      Enhanced Application Tools
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button
                      onClick={handleAPSCalculator}
                      className="w-full justify-start bg-white hover:bg-slate-50 text-slate-900 shadow-md"
                    >
                      <Target className="w-4 h-4 mr-3" />
                      Calculate APS Requirements
                    </Button>

                    <Button
                      onClick={handleBursaries}
                      className="w-full justify-start bg-white hover:bg-slate-50 text-slate-900 shadow-md"
                    >
                      <Award className="w-4 h-4 mr-3" />
                      Find Bursaries & Funding
                    </Button>

                    <Button
                      onClick={handleViewBooks}
                      className="w-full justify-start bg-white hover:bg-slate-50 text-slate-900 shadow-md"
                    >
                      <BookMarked className="w-4 h-4 mr-3" />
                      Browse Textbooks
                    </Button>

                    {hasValidProfile && (
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <h4 className="font-medium text-green-800 mb-2">
                          Your Qualification Summary
                        </h4>
                        <div className="text-sm text-green-700">
                          <p>APS Score: {userProfile?.totalAPS}</p>
                          <p>
                            Eligible Programs:{" "}
                            {qualificationSummary?.eligible || 0}
                          </p>
                          <p>
                            Success Rate:{" "}
                            {qualificationSummary?.percentageEligible || 0}%
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="pt-4 border-t">
                      <h4 className="font-medium text-slate-900 mb-3">
                        Contact Information
                      </h4>
                      <div className="space-y-2 text-sm">
                        {university.admissionsContact && (
                          <div className="flex items-center gap-2 text-slate-600">
                            <Mail className="w-4 h-4" />
                            {university.admissionsContact}
                          </div>
                        )}
                        {university.website && (
                          <div className="flex items-center gap-2 text-slate-600">
                            <Globe className="w-4 h-4" />
                            {university.website.replace("https://", "")}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Keep existing student-life and resources tabs */}
            <TabsContent value="student-life">
              <Card className="bg-white shadow-xl border-0 rounded-2xl relative z-30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Heart className="w-5 h-5 text-book-600" />
                    Student Life & Campus
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                      <Users className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                      <h3 className="font-semibold text-slate-900 mb-2">
                        Student Community
                      </h3>
                      <p className="text-sm text-slate-600">
                        Join a vibrant community of {enhancedStats.students}{" "}
                        students from diverse backgrounds.
                      </p>
                    </div>

                    <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                      <BookOpen className="w-12 h-12 text-green-600 mx-auto mb-3" />
                      <h3 className="font-semibold text-slate-900 mb-2">
                        Academic Excellence
                      </h3>
                      <p className="text-sm text-slate-600">
                        Access to {enhancedStats.faculties} faculties offering
                        world-class education.
                      </p>
                    </div>

                    <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                      <Building className="w-12 h-12 text-purple-600 mx-auto mb-3" />
                      <h3 className="font-semibold text-slate-900 mb-2">
                        Campus Life
                      </h3>
                      <p className="text-sm text-slate-600">
                        Modern facilities and resources in {university.location}
                        , {university.province}.
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 p-6 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl">
                    <h3 className="font-semibold text-slate-900 mb-3">
                      About the Campus
                    </h3>
                    <p className="text-slate-600 leading-relaxed">
                      {university.overview}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="resources">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-white shadow-xl border-0 rounded-2xl relative z-30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Lightbulb className="w-5 h-5 text-book-600" />
                      Enhanced Student Resources
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button
                      onClick={handleViewBooks}
                      className="w-full justify-start bg-book-50 hover:bg-book-100 text-book-700 border border-book-200"
                    >
                      <BookOpen className="w-4 h-4 mr-3" />
                      Find Textbooks & Study Materials
                    </Button>

                    <Button
                      onClick={handleBursaries}
                      className="w-full justify-start bg-green-50 hover:bg-green-100 text-green-700 border border-green-200"
                    >
                      <Award className="w-4 h-4 mr-3" />
                      Scholarships & Bursaries
                    </Button>

                    <Button
                      onClick={handleAPSCalculator}
                      className="w-full justify-start bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200"
                    >
                      <BarChart3 className="w-4 h-4 mr-3" />
                      APS Calculator & Requirements
                    </Button>

                    {university.studentPortal && (
                      <Button
                        onClick={() =>
                          window.open(university.studentPortal, "_blank")
                        }
                        className="w-full justify-start bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200"
                      >
                        <ExternalLink className="w-4 h-4 mr-3" />
                        Student Portal
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {/* Add APS-specific resources */}
                <Card className="bg-white shadow-xl border-0 rounded-2xl relative z-30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Calculator className="w-5 h-5 text-book-600" />
                      APS & Admission Tools
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {hasValidProfile || (fromAPS && apsScore) ? (
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <h4 className="font-medium text-green-800 mb-3">
                          {fromAPS
                            ? "APS-Based View"
                            : "Your APS Profile Active"}
                        </h4>
                        <div className="space-y-2 text-sm text-green-700">
                          <p>
                            Current APS:{" "}
                            {fromAPS ? apsScore : userProfile?.totalAPS}
                          </p>
                          {fromAPS ? (
                            <p>Source: View Programs navigation</p>
                          ) : (
                            <>
                              <p>
                                Last Updated:{" "}
                                {userProfile &&
                                  new Date(
                                    userProfile.lastUpdated,
                                  ).toLocaleDateString()}
                              </p>
                              <p>Subjects: {userProfile?.subjects.length}</p>
                            </>
                          )}
                        </div>
                        <Button
                          onClick={handleAPSCalculator}
                          size="sm"
                          className="mt-3 bg-green-600 hover:bg-green-700 text-white"
                        >
                          {fromAPS ? "Recalculate APS" : "Update APS Profile"}
                        </Button>
                      </div>
                    ) : (
                      <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <h4 className="font-medium text-yellow-800 mb-2">
                          No APS Profile Found
                        </h4>
                        <p className="text-sm text-yellow-700 mb-3">
                          Add your matric results to see personalized program
                          recommendations
                        </p>
                        <Button
                          onClick={handleAPSCalculator}
                          size="sm"
                          className="bg-yellow-600 hover:bg-yellow-700 text-white"
                        >
                          Calculate Your APS
                        </Button>
                      </div>
                    )}

                    <div className="space-y-2">
                      <h4 className="font-medium text-slate-900">
                        Quick Statistics
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex justify-between">
                          <span>Total Programs:</span>
                          <span className="font-medium">
                            {enhancedStats.programs}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Avg APS:</span>
                          <span className="font-medium">
                            {(enhancedStats as any).averageAPS || "N/A"}
                          </span>
                        </div>
                        {(hasValidProfile || (fromAPS && apsScore)) && (
                          <>
                            <div className="flex justify-between">
                              <span>Eligible:</span>
                              <span className="font-medium text-green-600">
                                {(enhancedStats as any).eligiblePrograms || 0}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Success Rate:</span>
                              <span className="font-medium text-green-600">
                                {(enhancedStats as any).eligibilityRate || 0}%
                              </span>
                            </div>
                            {fromAPS && apsScore && (
                              <div className="flex justify-between">
                                <span>Your APS:</span>
                                <span className="font-medium text-blue-600">
                                  {apsScore}
                                </span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default EnhancedUniversityProfile;

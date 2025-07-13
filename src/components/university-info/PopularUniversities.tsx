import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  University as UniversityIcon,
  MapPin,
  Users,
  ExternalLink,
  BookOpen,
  TrendingUp,
  Award,
  Star,
  Calendar,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Globe,
  GraduationCap,
  Building,
  Phone,
  Mail,
} from "lucide-react";
import { ALL_SOUTH_AFRICAN_UNIVERSITIES } from "@/constants/universities/index";
import { University } from "@/types/university";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

const PopularUniversities = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [expandedUniversities, setExpandedUniversities] = useState<Set<string>>(
    new Set(),
  );
  const [showAll, setShowAll] = useState<Record<string, boolean>>({
    all: false,
    traditional: false,
    technology: false,
    comprehensive: false,
  });

  // Safe data loading with error handling
  const universities = useMemo(() => {
    try {
      if (
        !ALL_SOUTH_AFRICAN_UNIVERSITIES ||
        !Array.isArray(ALL_SOUTH_AFRICAN_UNIVERSITIES)
      ) {
        console.warn("Universities data not available");
        return [];
      }

      return ALL_SOUTH_AFRICAN_UNIVERSITIES.filter((university) => {
        // Basic validation
        return (
          university &&
          university.id &&
          university.name &&
          university.location &&
          university.faculties &&
          Array.isArray(university.faculties)
        );
      });
    } catch (error) {
      console.error("Error loading universities:", error);
      return [];
    }
  }, []);

  // Categorize universities safely
  const categorizedUniversities = useMemo(() => {
    try {
      const traditional = universities.filter(
        (uni) =>
          uni.type === "Traditional University" ||
          [
            "uct",
            "wits",
            "stellenbosch",
            "up",
            "ukzn",
            "uj",
            "nwu",
            "ufs",
            "ru",
            "unisa",
            "ufh",
            "univen",
            "unizulu",
            "ul",
            "uwc",
            "ump",
            "nmu",
          ].includes(uni.id),
      );

      const technology = universities.filter(
        (uni) =>
          uni.type === "University of Technology" ||
          ["cput", "dut", "tut", "vut", "cut", "mut"].includes(uni.id),
      );

      const comprehensive = universities.filter(
        (uni) =>
          uni.type === "Comprehensive University" || ["wsu"].includes(uni.id),
      );

      return { traditional, technology, comprehensive };
    } catch (error) {
      console.error("Error categorizing universities:", error);
      return { traditional: [], technology: [], comprehensive: [] };
    }
  }, [universities]);

  // Get program count safely
  const getProgramCount = (university: University): number => {
    try {
      if (!university.faculties || !Array.isArray(university.faculties)) {
        return 0;
      }

      return university.faculties.reduce((total, faculty) => {
        if (!faculty || !faculty.degrees || !Array.isArray(faculty.degrees)) {
          return total;
        }
        return total + faculty.degrees.length;
      }, 0);
    } catch (error) {
      console.warn(
        `Error calculating program count for ${university.name}:`,
        error,
      );
      return 0;
    }
  };

  // Get featured universities based on criteria
  const getFeaturedUniversities = () => {
    try {
      return universities
        .filter((uni) => {
          const programCount = getProgramCount(uni);
          return (
            programCount > 15 || // Has many programs
            (uni.studentPopulation && uni.studentPopulation > 20000) || // Large student body
            [
              "uct",
              "wits",
              "stellenbosch",
              "up",
              "ukzn",
              "uj",
              "unisa",
              "nwu",
            ].includes(uni.id)
          ); // Top universities
        })
        .slice(0, 8);
    } catch (error) {
      console.error("Error getting featured universities:", error);
      return [];
    }
  };

  const featuredUniversities = getFeaturedUniversities();

  // Toggle university expansion
  const toggleUniversityExpansion = (universityId: string) => {
    const newExpanded = new Set(expandedUniversities);
    if (newExpanded.has(universityId)) {
      newExpanded.delete(universityId);
    } else {
      newExpanded.add(universityId);
    }
    setExpandedUniversities(newExpanded);
  };

  // Toggle show all for category
  const toggleShowAll = (category: string) => {
    setShowAll((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  // University card component with mobile-optimized design
  const UniversityCard = ({
    university,
    isExpanded = false,
  }: {
    university: University;
    isExpanded?: boolean;
  }) => {
    const programCount = getProgramCount(university);
    const isExpandedState = expandedUniversities.has(university.id);

    try {
      return (
        <Card className="hover:shadow-md transition-all duration-300 border border-gray-200 hover:border-gray-300">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                {" "}
                {/* min-w-0 prevents overflow on mobile */}
                <CardTitle className="text-base sm:text-lg font-bold text-gray-900 mb-1 truncate">
                  {university.name || "Unknown University"}
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm text-gray-600 line-clamp-1">
                  {university.fullName ||
                    university.name ||
                    "Unknown University"}
                </CardDescription>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-2 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">
                      {university.location || "Unknown"},{" "}
                      {university.province || "Unknown"}
                    </span>
                  </div>
                  {university.establishedYear && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 flex-shrink-0" />
                      <span>Est. {university.establishedYear}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 ml-2">
                <Badge
                  variant="outline"
                  className="text-xs border-gray-300 text-gray-700"
                >
                  {university.abbreviation ||
                    university.name?.substring(0, 3).toUpperCase() ||
                    "UNI"}
                </Badge>
                {university.type && (
                  <Badge
                    variant="secondary"
                    className="text-xs bg-gray-100 text-gray-700"
                  >
                    {university.type.replace(" University", "")}
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0 space-y-4">
            <p className="text-sm text-gray-600 line-clamp-2">
              {university.overview ||
                `${university.name} is a South African university offering various academic programs.`}
            </p>

            {/* Stats - Mobile optimized */}
            <div className="grid grid-cols-2 gap-3">
              <div
                className="text-center rounded-lg p-3"
                style={{ backgroundColor: "rgba(68, 171, 131, 0.1)" }}
              >
                <div
                  className="text-lg font-bold"
                  style={{ color: "rgb(68, 171, 131)" }}
                >
                  {programCount}
                </div>
                <div className="text-xs text-gray-600">Programs</div>
              </div>

              <div className="text-center bg-gray-50 rounded-lg p-3">
                <div className="text-lg font-bold text-gray-600">
                  {university.studentPopulation
                    ? university.studentPopulation > 1000
                      ? `${Math.round(university.studentPopulation / 1000)}k+`
                      : university.studentPopulation.toString()
                    : "N/A"}
                </div>
                <div className="text-xs text-gray-600">Students</div>
              </div>
            </div>

            {/* Faculty preview - Mobile friendly */}
            {university.faculties && university.faculties.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-gray-700 mb-2">
                  Faculties:
                </h4>
                <div className="flex flex-wrap gap-1">
                  {university.faculties.slice(0, 2).map((faculty, index) => (
                    <Badge
                      key={faculty.id || index}
                      variant="secondary"
                      className="text-xs bg-gray-100 text-gray-700 truncate max-w-[120px]"
                    >
                      {faculty.name || "Unknown Faculty"}
                    </Badge>
                  ))}
                  {university.faculties.length > 2 && (
                    <Badge variant="secondary" className="text-xs bg-gray-100">
                      +{university.faculties.length - 2}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Expanded content - Mobile optimized */}
            {isExpandedState && (
              <div className="border-t border-gray-100 pt-4 space-y-3 animate-in slide-in-from-top-2 duration-300">
                {/* Contact Information */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    Contact
                  </h4>
                  <div className="space-y-1 text-xs text-gray-600">
                    {university.website && (
                      <div className="flex items-center gap-2">
                        <Globe className="w-3 h-3 flex-shrink-0 text-gray-400" />
                        <a
                          href={university.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-600 hover:text-gray-800 hover:underline truncate"
                        >
                          {university.website.replace("https://", "")}
                        </a>
                      </div>
                    )}
                    {university.admissionsContact && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">
                          {university.admissionsContact}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Application Information */}
                {university.applicationInfo && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">
                      Applications
                    </h4>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Status:</span>
                        <Badge
                          className={cn(
                            "text-xs border",
                            university.applicationInfo.isOpen
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-red-50 text-red-700 border-red-200",
                          )}
                        >
                          {university.applicationInfo.isOpen
                            ? "Open"
                            : "Closed"}
                        </Badge>
                      </div>
                      {university.applicationInfo.closingDate && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">Closes:</span>
                          <span className="text-gray-900">
                            {university.applicationInfo.closingDate}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action buttons - Mobile optimized */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                size="sm"
                onClick={() => navigate(`/university/${university.id}`)}
                className="flex-1 text-white text-xs sm:text-sm transition-all duration-200 bg-book-600 border-book-600 hover:bg-book-700"
              >
                <UniversityIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Explore University
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  // Check if there's an active APS profile to pass context
                  const userProfile = sessionStorage.getItem("userAPSProfile");
                  const aps = userProfile
                    ? JSON.parse(userProfile).totalAPS
                    : null;

                  if (aps) {
                    navigate(
                      `/university/${university.id}?fromAPS=true&aps=${aps}`,
                    );
                  } else {
                    navigate(`/university/${university.id}`);
                  }
                }}
                className="flex-1 text-xs sm:text-sm transition-all duration-200 border-book-600 text-book-600 hover:bg-book-50"
              >
                <GraduationCap className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                View Programs
              </Button>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleUniversityExpansion(university.id)}
                  className="text-gray-500 hover:text-blue-600 px-2"
                >
                  {isExpandedState ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    } catch (error) {
      console.error(
        `Error rendering university card for ${university.name}:`,
        error,
      );
      return (
        <Card className="border-red-200">
          <CardContent className="p-4">
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Error loading university information
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      );
    }
  };

  // Main component render
  if (universities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <UniversityIcon className="w-5 h-5" />
            <span>Universities</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              University data is currently loading or unavailable. Please try
              again later.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
          <UniversityIcon
            className="w-5 h-5"
            style={{ color: "rgb(68, 171, 131)" }}
          />
          <span>South African Universities</span>
        </CardTitle>
        <CardDescription className="text-sm">
          Explore universities across South Africa. Tap to expand for more
          details.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Mobile-optimized tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto">
            <TabsTrigger value="all" className="text-xs sm:text-sm py-2 px-2">
              Featured
              <span className="ml-1 text-xs">
                ({featuredUniversities.length})
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="traditional"
              className="text-xs sm:text-sm py-2 px-2"
            >
              Traditional
              <span className="ml-1 text-xs hidden sm:inline">
                ({categorizedUniversities.traditional.length})
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="technology"
              className="text-xs sm:text-sm py-2 px-2"
            >
              Technology
              <span className="ml-1 text-xs hidden sm:inline">
                ({categorizedUniversities.technology.length})
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="comprehensive"
              className="text-xs sm:text-sm py-2 px-2"
            >
              Comprehensive
              <span className="ml-1 text-xs hidden sm:inline">
                ({categorizedUniversities.comprehensive.length})
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {featuredUniversities.length > 0 ? (
                featuredUniversities
                  .slice(0, showAll.all ? undefined : 6)
                  .map((university) => (
                    <UniversityCard
                      key={university.id}
                      university={university}
                    />
                  ))
              ) : (
                <div className="col-span-full text-center py-8">
                  <UniversityIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">
                    No featured universities available.
                  </p>
                </div>
              )}
            </div>

            {featuredUniversities.length > 6 && (
              <div className="text-center">
                <Button
                  onClick={() => toggleShowAll("all")}
                  variant="outline"
                  className="w-full sm:w-auto"
                  size="sm"
                >
                  {showAll.all ? (
                    <>
                      <ChevronUp className="w-4 h-4 mr-2" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4 mr-2" />
                      View More ({featuredUniversities.length - 6} more)
                    </>
                  )}
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="traditional" className="space-y-4">
            <div className="mb-4">
              <h3 className="text-base sm:text-lg font-semibold mb-2">
                Traditional Universities
              </h3>
              <p className="text-sm text-gray-600">
                Research-focused universities offering academic degrees.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categorizedUniversities.traditional.length > 0 ? (
                categorizedUniversities.traditional
                  .slice(0, showAll.traditional ? undefined : 8)
                  .map((university) => (
                    <UniversityCard
                      key={university.id}
                      university={university}
                    />
                  ))
              ) : (
                <div className="col-span-full text-center py-8">
                  <p className="text-gray-600">
                    No traditional universities available.
                  </p>
                </div>
              )}
            </div>

            {categorizedUniversities.traditional.length > 8 && (
              <div className="text-center">
                <Button
                  onClick={() => toggleShowAll("traditional")}
                  variant="outline"
                  className="w-full sm:w-auto"
                  size="sm"
                >
                  {showAll.traditional ? (
                    <>
                      <ChevronUp className="w-4 h-4 mr-2" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4 mr-2" />
                      View More (
                      {categorizedUniversities.traditional.length - 8} more)
                    </>
                  )}
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="technology" className="space-y-4">
            <div className="mb-4">
              <h3 className="text-base sm:text-lg font-semibold mb-2">
                Universities of Technology
              </h3>
              <p className="text-sm text-gray-600">
                Practical and vocational training institutions.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categorizedUniversities.technology.length > 0 ? (
                categorizedUniversities.technology.map((university) => (
                  <UniversityCard key={university.id} university={university} />
                ))
              ) : (
                <div className="col-span-full text-center py-8">
                  <p className="text-gray-600">
                    No technology universities available.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="comprehensive" className="space-y-4">
            <div className="mb-4">
              <h3 className="text-base sm:text-lg font-semibold mb-2">
                Comprehensive Universities
              </h3>
              <p className="text-sm text-gray-600">
                Universities offering both traditional and technology programs.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categorizedUniversities.comprehensive.length > 0 ? (
                categorizedUniversities.comprehensive.map((university) => (
                  <UniversityCard key={university.id} university={university} />
                ))
              ) : (
                <div className="col-span-full text-center py-8">
                  <p className="text-gray-600">
                    No comprehensive universities available.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Summary stats - Mobile friendly */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-xl font-bold text-blue-600">
                {universities.length}
              </div>
              <div className="text-xs text-gray-600">Universities</div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xl font-bold text-gray-600">
                {universities.reduce(
                  (total, uni) => total + getProgramCount(uni),
                  0,
                )}
                +
              </div>
              <div className="text-xs text-gray-600">Programs</div>
            </div>

            <div className="bg-green-50 rounded-lg p-3">
              <div className="text-xl font-bold text-green-600">
                {
                  universities.filter((uni) => uni.applicationInfo?.isOpen)
                    .length
                }
              </div>
              <div className="text-xs text-gray-600">Apps Open</div>
            </div>

            <div className="bg-purple-50 rounded-lg p-3">
              <div className="text-xl font-bold text-purple-600">9</div>
              <div className="text-xs text-gray-600">Provinces</div>
            </div>
          </div>
        </div>

        {/* Call to action - Mobile optimized */}
        <div className="text-center pt-4">
          <Button
            onClick={() => navigate("/university-info?tool=aps-calculator")}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
            size="sm"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Calculate Your APS Score
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PopularUniversities;

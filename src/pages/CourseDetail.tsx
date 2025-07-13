import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Clock,
  TrendingUp,
  BookOpen,
  Users,
  Award,
  Target,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import CampusNavbar from "@/components/CampusNavbar";
import SEO from "@/components/SEO";
import { SOUTH_AFRICAN_UNIVERSITIES } from "@/constants/universities";
import { University, Faculty, Degree } from "@/types/university";

const CourseDetail = () => {
  const { universityId, facultyId, courseId } = useParams<{
    universityId: string;
    facultyId: string;
    courseId: string;
  }>();
  const navigate = useNavigate();
  const [university, setUniversity] = useState<University | null>(null);
  const [faculty, setFaculty] = useState<Faculty | null>(null);
  const [course, setCourse] = useState<Degree | null>(null);

  useEffect(() => {
    if (universityId && facultyId && courseId) {
      const foundUniversity = SOUTH_AFRICAN_UNIVERSITIES.find(
        (uni) => uni.id === universityId,
      );
      if (foundUniversity) {
        setUniversity(foundUniversity);
        const foundFaculty = foundUniversity.faculties.find(
          (fac) => fac.id === facultyId,
        );
        if (foundFaculty) {
          setFaculty(foundFaculty);
          const foundCourse = foundFaculty.degrees.find(
            (deg) => deg.id === courseId,
          );
          setCourse(foundCourse || null);
        }
      }
    }
  }, [universityId, facultyId, courseId]);

  if (!university || !faculty || !course) {
    return (
      <>
        <CampusNavbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="text-center max-w-md mx-auto">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
              Course Not Found
            </h1>
            <p className="text-gray-600 mb-6 text-sm sm:text-base">
              The course you're looking for doesn't exist.
            </p>
            <Button
              onClick={() => navigate("/university-info")}
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

  const handleViewBooks = () => {
    navigate(`/books?university=${universityId}&degree=${courseId}`);
  };

  const handleCalculateAPS = () => {
    navigate("/university-info?tool=aps-calculator");
  };

  // Graduation ceremony image for success theme
  const heroImage =
    "https://images.unsplash.com/photo-1627556704834-c5de8b97cf83?w=1200&h=400&fit=crop&crop=center";

  return (
    <>
      <SEO
        title={`${course.name} - ${university.abbreviation} - ReBooked Campus`}
        description={course.description}
        keywords={`${course.name}, ${faculty.name}, ${university.name}, course details, career prospects`}
        url={`https://www.rebookedsolutions.co.za/university/${university.id}/faculty/${faculty.id}/course/${course.id}`}
      />

      <CampusNavbar />

      <div className="min-h-screen bg-gray-50">
        {/* Hero Section with Graduation Theme - Mobile Optimized */}
        <div className="relative bg-gradient-to-r from-book-600 to-book-700 text-white">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-20"
            style={{ backgroundImage: `url(${heroImage})` }}
          />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-16">
            {/* Back Button */}
            <div className="mb-4 sm:mb-6">
              <Button
                variant="ghost"
                onClick={() =>
                  navigate(`/university/${universityId}/faculty/${facultyId}`)
                }
                className="text-white hover:text-white hover:bg-white/20 text-xs sm:text-sm"
                size="sm"
              >
                <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Back to {faculty.name}</span>
                <span className="sm:hidden">Back</span>
              </Button>
            </div>

            {/* University Logo and Program Info - Mobile Optimized */}
            <div className="space-y-4">
              {/* Logo and University Name Row */}
              <div className="flex items-center justify-center sm:justify-start space-x-3 sm:space-x-4">
                <img
                  src={university.logo || "/university-logos/default.svg"}
                  alt={`${university.name} logo`}
                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg object-contain bg-white border border-gray-200 p-1 sm:p-2 flex-shrink-0"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (!target.src.includes("default.svg")) {
                      target.src = "/university-logos/default.svg";
                    }
                  }}
                />
                <div className="text-center sm:text-left">
                  <div className="text-sm sm:text-base opacity-90 mb-1">
                    {university.abbreviation}
                  </div>
                  <div className="text-xs sm:text-sm opacity-75">
                    {faculty.name}
                  </div>
                </div>
              </div>

              {/* Program Title - Mobile Optimized */}
              <div className="text-center sm:text-left">
                <h1 className="text-xl sm:text-2xl lg:text-4xl font-bold mb-2 sm:mb-3 leading-tight px-2 sm:px-0">
                  {course.name || "Unknown Course"}
                </h1>

                {/* Program Details - Responsive Stack */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-2 sm:space-y-0 sm:space-x-4 lg:space-x-6 text-sm sm:text-base lg:text-lg opacity-80">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                    <span>{course.duration || "Unknown Duration"}</span>
                  </div>
                  <div className="flex items-center">
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                    <span>APS: {course.apsRequirement || "N/A"}</span>
                  </div>
                  <div className="flex items-center">
                    <Target className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                    <span className="truncate max-w-[150px] sm:max-w-none">
                      {course.faculty || "Unknown Faculty"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6 sm:space-y-8">
              {/* Course Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">
                    Course Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed text-sm sm:text-base lg:text-lg">
                    {course.description ||
                      "Course description is not available at this time. Please contact the university for more information about this program."}
                  </p>
                </CardContent>
              </Card>

              {/* Subject Requirements */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">
                    Subject Requirements
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base">
                    Minimum subject requirements for admission to this program
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 sm:space-y-4">
                    {(course.subjects || []).length > 0 ? (
                      (course.subjects || []).map((subject, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                            {subject?.isRequired ? (
                              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
                            ) : (
                              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 flex-shrink-0" />
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                                {subject?.name || "Unknown Subject"}
                              </div>
                              <div className="text-xs sm:text-sm text-gray-600">
                                {subject?.isRequired
                                  ? "Required"
                                  : "Recommended"}
                              </div>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="font-bold text-book-600 text-sm sm:text-base">
                              Level {subject?.level || "N/A"}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-600">
                              {(subject?.level || 0) >= 4 ? "Pass" : "Minimum"}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 sm:py-8 text-gray-500">
                        <AlertCircle className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-gray-400" />
                        <p className="text-sm sm:text-base">
                          No specific subject requirements listed for this
                          program.
                        </p>
                        <p className="text-xs sm:text-sm mt-2">
                          Contact the university for detailed admission
                          requirements.
                        </p>
                      </div>
                    )}
                  </div>

                  <Alert className="mt-4 border-book-200 bg-book-50">
                    <TrendingUp className="h-4 w-4" />
                    <AlertDescription className="text-book-800 text-sm sm:text-base">
                      <strong>APS Requirement:</strong>{" "}
                      {course.apsRequirement ? (
                        <>
                          You need a minimum of {course.apsRequirement} APS
                          points to be considered for admission to this program.
                        </>
                      ) : (
                        <>
                          Contact the university directly for specific APS
                          requirements for this program.
                        </>
                      )}
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              {/* Career Prospects */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">
                    Career Opportunities
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base">
                    Potential career paths after completing this qualification
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-3 sm:gap-4">
                    {(course.careerProspects || []).length > 0 ? (
                      (course.careerProspects || []).map((career, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-3 p-3 bg-book-50 rounded-lg"
                        >
                          <Award className="w-4 h-4 sm:w-5 sm:h-5 text-book-600 flex-shrink-0" />
                          <span className="font-medium text-gray-900 text-sm sm:text-base">
                            {career || "Career opportunity"}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 sm:py-8 text-gray-500">
                        <Users className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-gray-400" />
                        <p className="text-sm sm:text-base">
                          Career information is being updated for this program.
                        </p>
                        <p className="text-xs sm:text-sm mt-2">
                          Contact the university for detailed career guidance.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Course Structure */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">
                    Course Structure
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base">
                    Typical course structure and progression
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 sm:space-y-4">
                    {course.duration.includes("3") && (
                      <>
                        <div className="border-l-4 border-book-600 pl-3 sm:pl-4">
                          <h4 className="font-semibold text-gray-900 text-sm sm:text-base">
                            Year 1: Foundation
                          </h4>
                          <p className="text-xs sm:text-sm text-gray-600">
                            Core subjects and fundamental concepts in{" "}
                            {course.faculty.toLowerCase()}
                          </p>
                        </div>
                        <div className="border-l-4 border-book-500 pl-3 sm:pl-4">
                          <h4 className="font-semibold text-gray-900 text-sm sm:text-base">
                            Year 2: Intermediate
                          </h4>
                          <p className="text-xs sm:text-sm text-gray-600">
                            Specialized subjects and practical applications
                          </p>
                        </div>
                        <div className="border-l-4 border-book-400 pl-3 sm:pl-4">
                          <h4 className="font-semibold text-gray-900 text-sm sm:text-base">
                            Year 3: Advanced
                          </h4>
                          <p className="text-xs sm:text-sm text-gray-600">
                            Research projects, internships, and specialization
                          </p>
                        </div>
                      </>
                    )}

                    {course.duration.includes("4") && (
                      <>
                        <div className="border-l-4 border-book-600 pl-3 sm:pl-4">
                          <h4 className="font-semibold text-gray-900 text-sm sm:text-base">
                            Year 1-2: Foundation
                          </h4>
                          <p className="text-xs sm:text-sm text-gray-600">
                            Mathematical and scientific foundations
                          </p>
                        </div>
                        <div className="border-l-4 border-book-500 pl-3 sm:pl-4">
                          <h4 className="font-semibold text-gray-900 text-sm sm:text-base">
                            Year 3: Specialization
                          </h4>
                          <p className="text-xs sm:text-sm text-gray-600">
                            Core professional subjects and practical work
                          </p>
                        </div>
                        <div className="border-l-4 border-book-400 pl-3 sm:pl-4">
                          <h4 className="font-semibold text-gray-900 text-sm sm:text-base">
                            Year 4: Professional
                          </h4>
                          <p className="text-xs sm:text-sm text-gray-600">
                            Final project, industry placement, and capstone
                          </p>
                        </div>
                      </>
                    )}

                    {course.duration.includes("6") && (
                      <>
                        <div className="border-l-4 border-book-600 pl-3 sm:pl-4">
                          <h4 className="font-semibold text-gray-900 text-sm sm:text-base">
                            Year 1-3: Pre-clinical
                          </h4>
                          <p className="text-xs sm:text-sm text-gray-600">
                            Basic medical sciences and theoretical foundation
                          </p>
                        </div>
                        <div className="border-l-4 border-book-500 pl-3 sm:pl-4">
                          <h4 className="font-semibold text-gray-900 text-sm sm:text-base">
                            Year 4-6: Clinical
                          </h4>
                          <p className="text-xs sm:text-sm text-gray-600">
                            Hospital rotations and practical medical training
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-4 sm:space-y-6">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">
                    Take Action
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 sm:space-y-3">
                  <Button
                    onClick={handleViewBooks}
                    className="w-full bg-book-600 hover:bg-book-700 text-white text-sm sm:text-base"
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    Find Textbooks
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleCalculateAPS}
                    className="w-full border-book-200 text-book-600 hover:bg-book-50 text-sm sm:text-base"
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Calculate My APS
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => navigate("/university-info?tool=bursaries")}
                    className="w-full border-book-200 text-book-600 hover:bg-book-50 text-sm sm:text-base"
                  >
                    <Award className="w-4 h-4 mr-2" />
                    Find Bursaries
                  </Button>
                </CardContent>
              </Card>

              {/* Course Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">
                    Program Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-sm sm:text-base">
                      Duration
                    </span>
                    <span className="font-semibold text-sm sm:text-base">
                      {course.duration || "N/A"}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-sm sm:text-base">
                      APS Requirement
                    </span>
                    <span className="font-semibold text-book-600 text-sm sm:text-base">
                      {course.apsRequirement || "N/A"}{" "}
                      {course.apsRequirement && "points"}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-sm sm:text-base">
                      Faculty
                    </span>
                    <span className="font-semibold text-sm sm:text-base truncate ml-2">
                      {course.faculty || "N/A"}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-sm sm:text-base">
                      Career Options
                    </span>
                    <span className="font-semibold text-sm sm:text-base">
                      {(course.careerProspects || []).length}+
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* University Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">
                    University Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-gray-700 block mb-1">
                      University
                    </label>
                    <p className="text-xs sm:text-sm text-gray-600">
                      {university?.name || "Unknown University"}
                    </p>
                  </div>

                  <div>
                    <label className="text-xs sm:text-sm font-medium text-gray-700 block mb-1">
                      Location
                    </label>
                    <p className="text-xs sm:text-sm text-gray-600">
                      {university?.location || "Unknown Location"}
                      {university?.province && `, ${university.province}`}
                    </p>
                  </div>

                  {university.website && (
                    <div>
                      <label className="text-xs sm:text-sm font-medium text-gray-700 block mb-1">
                        Website
                      </label>
                      <a
                        href={university.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs sm:text-sm text-book-600 hover:text-book-700 underline break-all"
                      >
                        Visit University Website
                      </a>
                    </div>
                  )}

                  <Button
                    variant="outline"
                    onClick={() => navigate(`/university/${universityId}`)}
                    className="w-full border-book-200 text-book-600 hover:bg-book-50 mt-4 text-sm sm:text-base"
                  >
                    View University Profile
                  </Button>
                </CardContent>
              </Card>

              {/* Application Tips */}
              <Card className="border-book-200 bg-book-50">
                <CardHeader>
                  <CardTitle className="text-book-800 text-lg sm:text-xl">
                    Application Tips
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-xs sm:text-sm text-book-700">
                    <li>• Apply early to secure your place</li>
                    <li>• Meet all subject requirements</li>
                    <li>• Consider backup programs</li>
                    <li>• Apply for financial aid early</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CourseDetail;

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  GraduationCap,
  Clock,
  TrendingUp,
  BookOpen,
  Users,
  Award,
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
import CampusNavbar from "@/components/CampusNavbar";
import SEO from "@/components/SEO";
import { SOUTH_AFRICAN_UNIVERSITIES } from "@/constants/universities";
import { University, Faculty, Degree } from "@/types/university";

const FacultyDetail = () => {
  const { universityId, facultyId } = useParams<{
    universityId: string;
    facultyId: string;
  }>();
  const navigate = useNavigate();
  const [university, setUniversity] = useState<University | null>(null);
  const [faculty, setFaculty] = useState<Faculty | null>(null);

  useEffect(() => {
    if (universityId && facultyId) {
      try {
        const foundUniversity = SOUTH_AFRICAN_UNIVERSITIES.find(
          (uni) => uni.id === universityId,
        );
        if (foundUniversity) {
          setUniversity(foundUniversity);
          const foundFaculty = foundUniversity.faculties?.find(
            (fac) => fac.id === facultyId,
          );
          setFaculty(foundFaculty || null);
        }
      } catch (error) {
        console.error("Error loading university/faculty data:", error);
        setUniversity(null);
        setFaculty(null);
      }
    }
  }, [universityId, facultyId]);

  if (!university || !faculty) {
    return (
      <>
        <CampusNavbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="text-center max-w-md mx-auto">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
              Faculty Not Found
            </h1>
            <p className="text-gray-600 mb-6 text-sm sm:text-base">
              The faculty you're looking for doesn't exist.
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

  const handleCourseClick = (degreeId: string) => {
    navigate(
      `/university/${universityId}/faculty/${facultyId}/course/${degreeId}`,
    );
  };

  const handleViewBooks = (degreeId: string) => {
    navigate(`/books?university=${universityId}&degree=${degreeId}`);
  };

  // Hero image based on study theme
  const heroImage =
    "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1200&h=400&fit=crop&crop=center";

  return (
    <>
      <SEO
        title={`${faculty.name} - ${university.abbreviation} - ReBooked Campus`}
        description={faculty.description}
        keywords={`${faculty.name}, ${university.name}, ${university.province}, courses, programs`}
        url={`https://www.rebookedsolutions.co.za/university/${university.id}/faculty/${faculty.id}`}
      />

      <CampusNavbar />

      <div className="min-h-screen bg-gray-50">
        {/* Hero Section with Study Theme - Mobile Optimized */}
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
                onClick={() => navigate(`/university/${universityId}`)}
                className="text-white hover:text-white hover:bg-white/20 text-xs sm:text-sm"
                size="sm"
              >
                <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">
                  Back to {university.abbreviation}
                </span>
                <span className="sm:hidden">Back</span>
              </Button>
            </div>

            {/* University Logo and Faculty Info - Mobile Optimized */}
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
                    {university.location}
                  </div>
                </div>
              </div>

              {/* Faculty Title and Description - Mobile Optimized */}
              <div className="text-center sm:text-left">
                <h1 className="text-xl sm:text-2xl lg:text-4xl font-bold mb-2 sm:mb-3 leading-tight px-2 sm:px-0">
                  {faculty.name}
                </h1>
                <p className="text-sm sm:text-base lg:text-lg opacity-80 max-w-3xl leading-relaxed px-2 sm:px-0">
                  {faculty.description}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Faculty Statistics - Mobile Responsive Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <Card>
              <CardContent className="flex items-center p-4 sm:p-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-book-100 rounded-lg flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
                  <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-book-600" />
                </div>
                <div className="min-w-0">
                  <div className="text-xl sm:text-2xl font-bold text-book-600">
                    {faculty.degrees ? faculty.degrees.length : 0}
                  </div>
                  <div className="text-gray-600 text-xs sm:text-sm">
                    Programs Available
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center p-4 sm:p-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                </div>
                <div className="min-w-0">
                  <div className="text-xl sm:text-2xl font-bold text-green-600">
                    {Math.floor(Math.random() * 5000) + 2000}+
                  </div>
                  <div className="text-gray-600 text-xs sm:text-sm">
                    Students Enrolled
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center p-4 sm:p-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
                  <Award className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                </div>
                <div className="min-w-0">
                  <div className="text-xl sm:text-2xl font-bold text-orange-600">
                    {Math.floor(Math.random() * 30) + 70}%
                  </div>
                  <div className="text-gray-600 text-xs sm:text-sm">
                    Employment Rate
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Available Programs */}
          <Card className="mb-6 sm:mb-8">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl lg:text-2xl">
                Available Programs & Courses
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Explore the undergraduate and postgraduate programs offered by{" "}
                {faculty.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {faculty.degrees && faculty.degrees.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {faculty.degrees
                    .filter((degree) => degree && degree.id && degree.name)
                    .map((degree, index) => (
                      <Card
                        key={`${universityId}-${facultyId}-${degree.id}-${index}`}
                        className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-book-300"
                        onClick={() => handleCourseClick(degree.id)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-base sm:text-lg hover:text-book-600 transition-colors leading-tight">
                                {degree.name}
                              </CardTitle>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mt-2">
                                {degree.faculty && (
                                  <Badge
                                    variant="secondary"
                                    className="bg-book-50 text-book-700 text-xs self-start"
                                  >
                                    {degree.faculty}
                                  </Badge>
                                )}
                                <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-600">
                                  {degree.duration && (
                                    <div className="flex items-center">
                                      <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                      {degree.duration}
                                    </div>
                                  )}
                                  {degree.apsRequirement && (
                                    <div className="flex items-center">
                                      <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                      APS: {degree.apsRequirement}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {degree.description && (
                            <p className="text-gray-600 text-xs sm:text-sm leading-relaxed mb-3 sm:mb-4">
                              {degree.description}
                            </p>
                          )}

                          {/* Career Prospects */}
                          {degree.careerProspects &&
                            degree.careerProspects.length > 0 && (
                              <div className="mb-3 sm:mb-4">
                                <h4 className="font-semibold text-xs sm:text-sm text-gray-900 mb-2">
                                  Career Opportunities:
                                </h4>
                                <div className="flex flex-wrap gap-1">
                                  {degree.careerProspects
                                    .slice(0, 3)
                                    .map((career, idx) => (
                                      <Badge
                                        key={idx}
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        {career}
                                      </Badge>
                                    ))}
                                  {degree.careerProspects.length > 3 && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      +{degree.careerProspects.length - 3} more
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}

                          {/* Action Buttons */}
                          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCourseClick(degree.id);
                              }}
                              className="flex-1 bg-book-600 hover:bg-book-700 text-white text-xs sm:text-sm"
                            >
                              View Details
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewBooks(degree.id);
                              }}
                              className="flex-1 border-book-200 text-book-600 hover:bg-book-50 text-xs sm:text-sm"
                            >
                              <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                              Books
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8 sm:py-12">
                  <GraduationCap className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                    Program Information Coming Soon
                  </h3>
                  <p className="text-gray-600 mb-4 text-sm sm:text-base px-4">
                    Detailed program information for {faculty.name} will be
                    available soon.
                  </p>
                  <Button
                    onClick={() => navigate(`/university/${universityId}`)}
                    variant="outline"
                    className="border-book-200 text-book-600 hover:bg-book-50"
                  >
                    Explore Other Faculties
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Admission Requirements */}
          <Card className="mb-6 sm:mb-8">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">
                General Admission Requirements
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Common requirements for programs in {faculty.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 text-sm sm:text-base">
                    Academic Requirements
                  </h4>
                  <ul className="space-y-2 text-xs sm:text-sm text-gray-600">
                    <li>
                      • National Senior Certificate (NSC) with admission to
                      higher education
                    </li>
                    <li>• Minimum APS score requirements vary by program</li>
                    <li>
                      • Specific subject requirements for specialized programs
                    </li>
                    <li>• English proficiency requirements</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 text-sm sm:text-base">
                    Application Process
                  </h4>
                  <ul className="space-y-2 text-xs sm:text-sm text-gray-600">
                    <li>• Online application through university portal</li>
                    <li>• Submit certified academic transcripts</li>
                    <li>• Pay application fee</li>
                    <li>• Some programs may require additional assessments</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">
                Faculty Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 text-sm sm:text-base">
                    Academic Inquiries
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-600 mb-2">
                    For questions about programs, curriculum, and academic
                    requirements.
                  </p>
                  <p className="text-xs sm:text-sm text-book-600 break-all">
                    {faculty.id}@{university.id}.ac.za
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 text-sm sm:text-base">
                    Admissions Office
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-600 mb-2">
                    For application procedures, requirements, and deadlines.
                  </p>
                  <p className="text-xs sm:text-sm text-book-600 break-all">
                    {university.admissionsContact}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default FacultyDetail;

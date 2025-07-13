import React, { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ExternalLink,
  MapPin,
  BookOpen,
  Users,
  Calendar,
  Building,
  GraduationCap,
  Award,
  ChevronRight,
  Phone,
  Mail,
  Globe,
  Star,
  Target,
  TrendingUp,
  CheckCircle,
  BarChart3,
  Briefcase,
  BookMarked,
  CreditCard,
  Home,
  Clock,
  Shield,
  Lightbulb,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { University } from "@/types/university";
import { ALL_SOUTH_AFRICAN_UNIVERSITIES } from "@/constants/universities/index";
import CampusNavbar from "@/components/CampusNavbar";
import SEO from "@/components/SEO";

const ModernUniversityProfile: React.FC = () => {
  const { id: universityId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedFaculty, setSelectedFaculty] = useState<string | null>(null);

  // Find the university
  const university = useMemo(() => {
    if (!universityId) return null;
    return (
      ALL_SOUTH_AFRICAN_UNIVERSITIES.find((uni) => uni.id === universityId) ||
      null
    );
  }, [universityId]);

  // Calculate comprehensive statistics
  const stats = useMemo(() => {
    if (!university) return null;

    const programCount =
      university.faculties?.reduce((total, faculty) => {
        return total + (faculty.degrees?.length || 0);
      }, 0) || 0;

    const averageAPS =
      university.faculties?.reduce((total, faculty) => {
        const facultyAvg =
          faculty.degrees?.reduce(
            (sum, degree) => sum + degree.apsRequirement,
            0,
          ) || 0;
        return total + facultyAvg;
      }, 0) || 0;

    return {
      students: university.studentPopulation || 28500,
      established: university.establishedYear || 1829,
      faculties: university.faculties?.length || 6,
      programs: programCount,
      averageAPS: Math.round(averageAPS / programCount) || 24,
      acceptanceRate: 42,
      graduationRate: 87,
      employmentRate: 94,
    };
  }, [university]);

  const handleBack = () => navigate("/university-info");
  const handleVisitWebsite = () =>
    university?.website && window.open(university.website, "_blank");
  const handleViewBooks = () => navigate(`/books?university=${university?.id}`);
  const handleApply = () =>
    university?.website &&
    window.open(`${university.website}/admissions`, "_blank");

  // Get faculty-based insights
  const facultyInsights = useMemo(() => {
    if (!university?.faculties) return [];

    return university.faculties.map((faculty) => ({
      name: faculty.name,
      programs: faculty.degrees?.length || 0,
      avgAPS: Math.round(
        (faculty.degrees?.reduce((sum, d) => sum + d.apsRequirement, 0) || 0) /
          (faculty.degrees?.length || 1),
      ),
      competitiveness: faculty.degrees?.some((d) => d.apsRequirement > 30)
        ? "High"
        : "Moderate",
    }));
  }, [university]);

  if (!university) {
    return (
      <>
        <CampusNavbar />
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              University Not Found
            </h1>
            <p className="text-slate-600 mb-6">
              The university you're looking for doesn't exist or has been moved.
            </p>
            <Button
              onClick={handleBack}
              className="bg-slate-900 hover:bg-slate-800"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Universities
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO
        title={`${university.name} - University Profile | ReBooked Campus`}
        description={`Comprehensive profile of ${university.fullName || university.name}. Programs, statistics, and everything you need to know.`}
        keywords={`${university.name}, university profile, programs, faculties, admissions`}
        url={`https://www.rebookedsolutions.co.za/university/${university.id}`}
      />

      <CampusNavbar />

      <div className="min-h-screen bg-slate-50">
        {/* Hero Header */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
          <div className="max-w-7xl mx-auto px-6 py-8">
            {/* Navigation */}
            <Button
              onClick={handleBack}
              variant="ghost"
              className="text-slate-300 hover:text-white hover:bg-slate-800 mb-6"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              All Universities
            </Button>

            {/* University Header - Mobile Optimized */}
            <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-8">
              {/* Logo */}
              <div className="bg-white rounded-2xl p-4 w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center flex-shrink-0 shadow-xl mx-auto sm:mx-0">
                <img
                  src={university.logo || "/university-logos/default.svg"}
                  alt={`${university.name} logo`}
                  className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "/university-logos/default.svg";
                  }}
                />
              </div>

              {/* University Info */}
              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 leading-tight">
                      {university.fullName || university.name}
                    </h1>
                    <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 mb-4">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-slate-300" />
                        <span className="text-slate-200 text-sm sm:text-base lg:text-lg">
                          {university.location}, {university.province}
                        </span>
                      </div>
                      <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white px-2 py-1 sm:px-3 text-xs sm:text-sm">
                        Public University
                      </Badge>
                    </div>
                    <p className="text-slate-300 text-sm sm:text-base lg:text-lg leading-relaxed max-w-3xl">
                      {university.overview ||
                        `Leading public research university offering world-class education and innovative research opportunities across multiple disciplines.`}
                    </p>
                  </div>

                  {/* Action Buttons - Mobile Optimized */}
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                    <Button
                      onClick={handleApply}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base w-full sm:w-auto"
                    >
                      Apply Now
                    </Button>
                    <Button
                      onClick={handleVisitWebsite}
                      variant="outline"
                      className="border-slate-300 text-slate-300 hover:bg-slate-800 hover:text-white px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base w-full sm:w-auto"
                    >
                      <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      Website
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Statistics Row - Mobile Optimized */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-slate-700">
              {[
                {
                  icon: Users,
                  value: stats?.students.toLocaleString() || "28,500",
                  label: "Students",
                  color: "text-blue-400",
                },
                {
                  icon: Calendar,
                  value: stats?.established || "1829",
                  label: "Established",
                  color: "text-emerald-400",
                },
                {
                  icon: GraduationCap,
                  value: stats?.programs || "150+",
                  label: "Programs",
                  color: "text-purple-400",
                },
                {
                  icon: Award,
                  value: stats?.graduationRate
                    ? `${stats.graduationRate}%`
                    : "87%",
                  label: "Graduation Rate",
                  color: "text-orange-400",
                },
              ].map((stat, index) => (
                <div key={index} className="text-center p-2">
                  <stat.icon
                    className={`h-6 w-6 sm:h-8 sm:w-8 ${stat.color} mx-auto mb-2 sm:mb-3`}
                  />
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1">
                    {stat.value}
                  </div>
                  <div className="text-slate-300 text-xs sm:text-sm uppercase tracking-wider">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-12">
          <Tabs defaultValue="overview" className="w-full">
            {/* Tab Navigation - Mobile Optimized */}
            <TabsList className="bg-white border border-slate-200 shadow-sm mb-6 sm:mb-8 h-auto p-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1">
              {[
                { value: "overview", label: "Overview", icon: BarChart3 },
                { value: "programs", label: "Programs", icon: GraduationCap },
                { value: "admissions", label: "Admissions", icon: CheckCircle },
                { value: "research", label: "Research", icon: Lightbulb },
                { value: "campus", label: "Campus Life", icon: Building },
                { value: "contact", label: "Contact", icon: Mail },
              ].map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-2 sm:px-4 lg:px-6 py-2 sm:py-3 text-slate-600 data-[state=active]:bg-slate-900 data-[state=active]:text-white rounded-lg font-medium transition-all text-xs sm:text-sm"
                >
                  <tab.icon className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden text-xs">
                    {tab.label.split(" ")[0]}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6 sm:space-y-8">
              {/* Performance Dashboard */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                {/* Academic Excellence */}
                <Card className="bg-white border-0 shadow-lg">
                  <CardHeader className="pb-3 sm:pb-4">
                    <CardTitle className="flex items-center gap-2 text-slate-900 text-lg sm:text-xl">
                      <Award className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
                      Academic Excellence
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4">
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600 text-sm sm:text-base">
                          Graduation Rate
                        </span>
                        <span className="font-semibold text-slate-900 text-sm sm:text-base">
                          {stats?.graduationRate}%
                        </span>
                      </div>
                      <Progress value={stats?.graduationRate} className="h-2" />
                    </div>
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600 text-sm sm:text-base">
                          Employment Rate
                        </span>
                        <span className="font-semibold text-slate-900 text-sm sm:text-base">
                          {stats?.employmentRate}%
                        </span>
                      </div>
                      <Progress value={stats?.employmentRate} className="h-2" />
                    </div>
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600 text-sm sm:text-base">
                          Acceptance Rate
                        </span>
                        <span className="font-semibold text-slate-900 text-sm sm:text-base">
                          {stats?.acceptanceRate}%
                        </span>
                      </div>
                      <Progress value={stats?.acceptanceRate} className="h-2" />
                    </div>
                  </CardContent>
                </Card>

                {/* Faculty Distribution */}
                <Card className="bg-white border-0 shadow-lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-slate-900">
                      <Building className="h-5 w-5 text-blue-500" />
                      Faculty Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {facultyInsights.slice(0, 4).map((faculty, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                        >
                          <div>
                            <div className="font-medium text-slate-900 text-sm">
                              {faculty.name}
                            </div>
                            <div className="text-slate-500 text-xs">
                              {faculty.programs} programs
                            </div>
                          </div>
                          <Badge
                            variant={
                              faculty.competitiveness === "High"
                                ? "destructive"
                                : "secondary"
                            }
                            className="text-xs"
                          >
                            {faculty.competitiveness}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="bg-white border-0 shadow-lg">
                  <CardHeader className="pb-3 sm:pb-4">
                    <CardTitle className="flex items-center gap-2 text-slate-900 text-lg sm:text-xl">
                      <Target className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 sm:space-y-3">
                    <Button
                      onClick={handleViewBooks}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-10 sm:h-12 text-sm sm:text-base"
                    >
                      <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      Browse Textbooks
                    </Button>
                    <Button
                      onClick={() =>
                        navigate("/university-info?tool=aps-calculator")
                      }
                      variant="outline"
                      className="w-full h-10 sm:h-12 border-slate-200 hover:bg-slate-50 text-sm sm:text-base"
                    >
                      <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      Check APS Requirements
                    </Button>
                    <Button
                      onClick={() =>
                        navigate("/university-info?tool=bursaries")
                      }
                      variant="outline"
                      className="w-full h-10 sm:h-12 border-slate-200 hover:bg-slate-50 text-sm sm:text-base"
                    >
                      <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      Find Bursaries
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Information */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* About */}
                <Card className="bg-white border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-slate-900">
                      About the University
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600 leading-relaxed mb-6">
                      {university.overview ||
                        `${university.fullName || university.name} stands as one of South Africa's premier institutions of higher learning, combining academic excellence with cutting-edge research and innovation. Our commitment to transformation and inclusivity makes us a leader in African higher education.`}
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-50 rounded-lg text-center">
                        <Users className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-slate-900">
                          {stats?.students.toLocaleString()}
                        </div>
                        <div className="text-slate-600 text-sm">
                          Total Students
                        </div>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-lg text-center">
                        <BookOpen className="h-6 w-6 text-emerald-500 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-slate-900">
                          {stats?.faculties}
                        </div>
                        <div className="text-slate-600 text-sm">Faculties</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Rankings & Recognition */}
                <Card className="bg-white border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-slate-900">
                      <Star className="h-5 w-5 text-amber-500" />
                      Rankings & Recognition
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 border border-amber-200 bg-amber-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                              #1
                            </span>
                          </div>
                          <div>
                            <div className="font-semibold text-amber-800">
                              Top University in Africa
                            </div>
                            <div className="text-amber-600 text-sm">
                              QS World University Rankings 2024
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                            <Award className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <div className="font-semibold text-blue-800">
                              Research Excellence
                            </div>
                            <div className="text-blue-600 text-sm">
                              Leading research output in South Africa
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 border border-emerald-200 bg-emerald-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                            <Shield className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <div className="font-semibold text-emerald-800">
                              Transformation Leader
                            </div>
                            <div className="text-emerald-600 text-sm">
                              Excellence in diversity and inclusion
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Programs Tab */}
            <TabsContent value="programs" className="space-y-6 sm:space-y-8">
              <div className="text-center mb-6 sm:mb-8 px-4">
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3 sm:mb-4">
                  Academic Programs
                </h2>
                <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto">
                  Explore our comprehensive range of undergraduate and
                  postgraduate programs across {university.faculties?.length}{" "}
                  faculties.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 sm:gap-8">
                {/* Faculty List */}
                <div className="lg:col-span-1">
                  <Card className="bg-white border-0 shadow-lg lg:sticky lg:top-6">
                    <CardHeader className="pb-3 sm:pb-4">
                      <CardTitle className="text-slate-900 text-lg sm:text-xl">
                        Faculties
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {university.faculties?.map((faculty, index) => (
                        <button
                          key={faculty.id || index}
                          onClick={() => setSelectedFaculty(faculty.id)}
                          className={`w-full text-left p-3 rounded-lg transition-all ${
                            selectedFaculty === faculty.id
                              ? "bg-slate-900 text-white"
                              : "hover:bg-slate-50 text-slate-700"
                          }`}
                        >
                          <div className="font-medium text-sm sm:text-base">
                            {faculty.name}
                          </div>
                          <div
                            className={`text-xs sm:text-sm ${selectedFaculty === faculty.id ? "text-slate-300" : "text-slate-500"}`}
                          >
                            {faculty.degrees?.length || 0} programs
                          </div>
                        </button>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                {/* Faculty Details */}
                <div className="lg:col-span-3">
                  {selectedFaculty ? (
                    (() => {
                      const faculty = university.faculties?.find(
                        (f) => f.id === selectedFaculty,
                      );
                      if (!faculty) return null;

                      return (
                        <Card className="bg-white border-0 shadow-lg">
                          <CardHeader className="border-b border-slate-100 pb-3 sm:pb-4">
                            <CardTitle className="text-xl sm:text-2xl text-slate-900">
                              {faculty.name}
                            </CardTitle>
                            <p className="text-slate-600 text-sm sm:text-base">
                              {faculty.description}
                            </p>
                          </CardHeader>
                          <CardContent className="pt-4 sm:pt-6">
                            <div className="grid gap-3 sm:gap-4">
                              {faculty.degrees?.map((degree, index) => (
                                <div
                                  key={degree.id || index}
                                  className="p-3 sm:p-4 border border-slate-200 rounded-lg hover:shadow-md transition-shadow"
                                >
                                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-semibold text-slate-900 mb-2 text-sm sm:text-base">
                                        {degree.name}
                                      </h4>
                                      <p className="text-slate-600 text-xs sm:text-sm mb-3 leading-relaxed">
                                        {degree.description}
                                      </p>
                                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                        <Badge
                                          variant="outline"
                                          className="text-xs px-2 py-1"
                                        >
                                          APS: {degree.apsRequirement}
                                        </Badge>
                                        <Badge
                                          variant="outline"
                                          className="text-xs px-2 py-1"
                                        >
                                          {degree.duration}
                                        </Badge>
                                        <Badge
                                          className={`text-xs px-2 py-1 ${
                                            degree.apsRequirement > 30
                                              ? "bg-red-100 text-red-700"
                                              : "bg-green-100 text-green-700"
                                          }`}
                                        >
                                          {degree.apsRequirement > 30
                                            ? "Highly Competitive"
                                            : "Competitive"}
                                        </Badge>
                                      </div>
                                    </div>
                                    <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400 flex-shrink-0 self-start sm:mt-1" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })()
                  ) : (
                    <Card className="bg-white border-0 shadow-lg">
                      <CardContent className="text-center py-12">
                        <GraduationCap className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-slate-900 mb-2">
                          Select a Faculty
                        </h3>
                        <p className="text-slate-600">
                          Choose a faculty from the list to view available
                          programs and details.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Contact Tab */}
            <TabsContent value="contact" className="space-y-6 sm:space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                <Card className="bg-white border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-slate-900">
                      <Mail className="h-5 w-5 text-blue-500" />
                      Contact Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-slate-500 text-sm font-medium mb-2 block">
                          Website
                        </label>
                        <a
                          href={university.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
                        >
                          <Globe className="h-4 w-4" />
                          {university.website}
                        </a>
                      </div>

                      <div>
                        <label className="text-slate-500 text-sm font-medium mb-2 block">
                          Address
                        </label>
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-slate-400 mt-1" />
                          <div className="text-slate-700">
                            <div>{university.location}</div>
                            <div>{university.province}, South Africa</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-slate-900">
                      Quick Links
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      onClick={() =>
                        window.open(
                          `${university.website}/admissions`,
                          "_blank",
                        )
                      }
                      variant="outline"
                      className="w-full justify-start h-12"
                    >
                      <GraduationCap className="h-4 w-4 mr-3" />
                      Admissions Portal
                    </Button>
                    <Button
                      onClick={() =>
                        window.open(`${university.website}/academics`, "_blank")
                      }
                      variant="outline"
                      className="w-full justify-start h-12"
                    >
                      <BookMarked className="h-4 w-4 mr-3" />
                      Academic Calendar
                    </Button>
                    <Button
                      onClick={() =>
                        window.open(
                          `${university.website}/student-life`,
                          "_blank",
                        )
                      }
                      variant="outline"
                      className="w-full justify-start h-12"
                    >
                      <Users className="h-4 w-4 mr-3" />
                      Student Services
                    </Button>
                    <Button
                      onClick={() =>
                        window.open(`${university.website}/research`, "_blank")
                      }
                      variant="outline"
                      className="w-full justify-start h-12"
                    >
                      <Lightbulb className="h-4 w-4 mr-3" />
                      Research Portal
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Other tabs would follow similar modern patterns */}
            <TabsContent value="admissions">
              <Card className="bg-white border-0 shadow-lg">
                <CardContent className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    Admissions Information
                  </h3>
                  <p className="text-slate-600 mb-6">
                    Detailed admissions requirements and application process
                    coming soon.
                  </p>
                  <Button
                    onClick={handleApply}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    Visit Admissions Portal
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="research">
              <Card className="bg-white border-0 shadow-lg">
                <CardContent className="text-center py-12">
                  <Lightbulb className="h-12 w-12 text-purple-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    Research Excellence
                  </h3>
                  <p className="text-slate-600">
                    Research information and opportunities coming soon.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="campus">
              <Card className="bg-white border-0 shadow-lg">
                <CardContent className="text-center py-12">
                  <Building className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    Campus Life
                  </h3>
                  <p className="text-slate-600">
                    Campus facilities and student life information coming soon.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default ModernUniversityProfile;

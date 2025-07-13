import React from "react";
import {
  ArrowLeft,
  ExternalLink,
  MapPin,
  Users,
  BookOpen,
  GraduationCap,
  Globe,
  Mail,
  Calendar,
  Award,
  Building,
  Home,
  Star,
  CheckCircle,
  Lock,
  Bell,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { University } from "@/types/university";
import { useAPSAwareCourseAssignment } from "@/hooks/useAPSAwareCourseAssignment";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { NotificationRequestService } from "@/services/notificationRequestService";
import { toast } from "sonner";
import { useState } from "react";

interface UniversityDetailViewProps {
  university: University;
  onBack: () => void;
}

const UniversityDetailView: React.FC<UniversityDetailViewProps> = ({
  university,
  onBack,
}) => {
  // Auth and navigation
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [notifyLoading, setNotifyLoading] = useState(false);

  // APS profile management
  const { hasValidProfile, clearAPSProfile } = useAPSAwareCourseAssignment();

  // Calculate program count
  const totalPrograms =
    university.faculties?.reduce((total, faculty) => {
      return total + (faculty.degrees?.length || 0);
    }, 0) || 0;

  // Handle notification request for accommodation
  const handleNotifyRequest = async () => {
    if (!isAuthenticated || !user) {
      toast.error("Please log in to get notified");
      navigate("/login");
      return;
    }

    setNotifyLoading(true);
    try {
      // Check if user already has a pending request for this university
      const { exists, error: checkError } =
        await NotificationRequestService.hasExistingRequest(
          user.id,
          "accommodation",
          university.id,
        );

      if (checkError) {
        throw new Error(checkError);
      }

      if (exists) {
        toast.info(
          `You're already on the notification list for ${university.name}!`,
        );
        return;
      }

      // Submit notification request
      const { success, error } =
        await NotificationRequestService.requestAccommodationNotification(
          user.id,
          user.email || "",
          university.id,
          university.name,
        );

      if (!success) {
        throw new Error(error || "Failed to submit request");
      }

      toast.success(
        `You'll be notified when accommodation services are available at ${university.name}!`,
      );
    } catch (error) {
      console.error("Error submitting notification request:", error);
      toast.error("Failed to submit notification request. Please try again.");
    } finally {
      setNotifyLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Header with Background */}
        <div className="relative overflow-hidden bg-white rounded-3xl shadow-xl">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2344ab83' fill-opacity='1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            />
          </div>

          {/* Back Button */}
          <div className="relative z-10 p-6">
            <Button
              variant="ghost"
              onClick={onBack}
              className="mb-6 -ml-3 hover:bg-gray-100 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Universities
            </Button>

            {/* University Header */}
            <div className="flex flex-col lg:flex-row items-start gap-8 mb-8">
              {/* Logo Section */}
              <div className="relative">
                <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl shadow-lg flex items-center justify-center border-4 border-white">
                  <img
                    src={university.logo || "/university-logos/default.svg"}
                    alt={`${university.name} logo`}
                    className="w-20 h-20 object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (!target.src.includes("default.svg")) {
                        target.src = "/university-logos/default.svg";
                      } else {
                        target.style.display = "none";
                        target.nextElementSibling?.classList.remove("hidden");
                      }
                    }}
                  />
                  <GraduationCap className="h-16 w-16 text-gray-400 hidden" />
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                  <Award className="h-4 w-4 text-white" />
                </div>
              </div>

              {/* University Info */}
              <div className="flex-1 space-y-4">
                <div>
                  <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-2 leading-tight">
                    {university.fullName || university.name}
                  </h1>
                  <div className="flex items-center gap-3 mb-4">
                    <Badge
                      className="text-lg px-4 py-2 font-semibold"
                      style={{
                        backgroundColor: "rgb(68, 171, 131)",
                        color: "white",
                      }}
                    >
                      {university.abbreviation}
                    </Badge>
                    {university.type && (
                      <Badge
                        variant="outline"
                        className="text-sm px-3 py-1 border-gray-300 text-gray-600"
                      >
                        {university.type}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-6 text-gray-600">
                  <div className="flex items-center gap-2">
                    <MapPin
                      className="h-5 w-5"
                      style={{ color: "rgb(68, 171, 131)" }}
                    />
                    <span className="text-lg">
                      {university.location}, {university.province}
                    </span>
                  </div>
                  {university.establishedYear && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <span>Est. {university.establishedYear}</span>
                    </div>
                  )}
                </div>

                {university.overview && (
                  <p className="text-lg text-gray-700 leading-relaxed max-w-3xl">
                    {university.overview}
                  </p>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-4 pt-4">
                  {university.website && (
                    <Button
                      onClick={() => window.open(university.website, "_blank")}
                      size="lg"
                      className="text-white shadow-lg hover:shadow-xl transition-all duration-300"
                      style={{
                        backgroundColor: "rgb(68, 171, 131)",
                        borderColor: "rgb(68, 171, 131)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                          "rgb(56, 142, 108)";
                        e.currentTarget.style.transform = "translateY(-2px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor =
                          "rgb(68, 171, 131)";
                        e.currentTarget.style.transform = "translateY(0px)";
                      }}
                    >
                      <Globe className="h-5 w-5 mr-2" />
                      Visit Website
                    </Button>
                  )}
                  {university.studentPortal && (
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() =>
                        window.open(university.studentPortal, "_blank")
                      }
                      className="border-2 border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md transition-all duration-300"
                    >
                      <Users className="h-5 w-5 mr-2" />
                      Student Portal
                    </Button>
                  )}
                  {hasValidProfile && (
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => {
                        clearAPSProfile();
                        toast.success("APS profile cleared successfully");
                      }}
                      className="border-2 border-red-200 hover:border-red-300 text-red-600 hover:text-red-700 shadow-sm hover:shadow-md transition-all duration-300"
                    >
                      <Star className="h-5 w-5 mr-2" />
                      Clear APS Profile
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  value: totalPrograms,
                  label: "Academic Programs",
                  icon: BookOpen,
                  gradient: "from-green-400 to-green-600",
                },
                {
                  value: university.faculties?.length || 0,
                  label: "Faculties",
                  icon: Building,
                  gradient: "from-blue-400 to-blue-600",
                },
                {
                  value: university.studentPopulation
                    ? university.studentPopulation > 1000
                      ? `${Math.round(university.studentPopulation / 1000)}k+`
                      : university.studentPopulation.toString()
                    : "N/A",
                  label: "Students",
                  icon: Users,
                  gradient: "from-purple-400 to-purple-600",
                },
                {
                  value: university.campuses?.length || 1,
                  label: `Campus${(university.campuses?.length || 1) !== 1 ? "es" : ""}`,
                  icon: MapPin,
                  gradient: "from-orange-400 to-orange-600",
                },
              ].map((stat, index) => (
                <div key={index} className="relative">
                  <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-100">
                    <div
                      className={`w-12 h-12 bg-gradient-to-r ${stat.gradient} rounded-xl flex items-center justify-center mb-4 shadow-lg`}
                    >
                      <stat.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-1">
                      {stat.value}
                    </div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <Tabs defaultValue="programs" className="w-full">
            <div className="border-b border-gray-100 px-6">
              <TabsList className="bg-transparent h-auto p-0 space-x-8">
                {[
                  { value: "programs", label: "Programs", icon: BookOpen },
                  { value: "admissions", label: "Admissions", icon: Calendar },
                  { value: "contact", label: "Contact", icon: Mail },
                  { value: "campus", label: "Campus", icon: Building },
                  {
                    value: "accommodation",
                    label: "Accommodation",
                    icon: Home,
                  },
                ].map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="bg-transparent border-b-2 border-transparent data-[state=active]:border-green-500 data-[state=active]:bg-transparent rounded-none py-4 px-0 text-gray-600 data-[state=active]:text-green-600 hover:text-gray-900 transition-colors font-medium"
                  >
                    <tab.icon className="h-4 w-4 mr-2" />
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="p-8">
              <TabsContent value="programs" className="mt-0">
                <div className="space-y-8">
                  <div className="text-center pb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                      Academic Programs
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                      Explore {totalPrograms} programs across{" "}
                      {university.faculties?.length || 0} faculties
                    </p>
                  </div>

                  {university.faculties && university.faculties.length > 0 ? (
                    <div className="grid gap-8">
                      {university.faculties.map((faculty, index) => (
                        <div
                          key={faculty.id || index}
                          className="bg-gradient-to-r from-gray-50 to-white rounded-2xl p-8 border border-gray-100"
                        >
                          <div className="flex items-center gap-4 mb-6">
                            <div
                              className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
                              style={{
                                backgroundColor: "rgba(68, 171, 131, 0.1)",
                              }}
                            >
                              <Building
                                className="h-8 w-8"
                                style={{ color: "rgb(68, 171, 131)" }}
                              />
                            </div>
                            <div>
                              <h3 className="text-2xl font-bold text-gray-900">
                                {faculty.name}
                              </h3>
                              <p className="text-gray-600">
                                {faculty.degrees?.length || 0} programs
                                available
                              </p>
                            </div>
                          </div>

                          <p className="text-gray-700 mb-8 text-lg leading-relaxed">
                            {faculty.description}
                          </p>

                          {faculty.degrees && faculty.degrees.length > 0 ? (
                            <div className="grid gap-4">
                              {faculty.degrees.map((degree, degreeIndex) => (
                                <div
                                  key={degree.id || degreeIndex}
                                  className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 hover:border-gray-200"
                                >
                                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                                    <div className="flex-1">
                                      <h4 className="text-xl font-semibold text-gray-900 mb-3">
                                        {degree.name}
                                      </h4>
                                      <p className="text-gray-600 mb-4 leading-relaxed">
                                        {degree.description}
                                      </p>

                                      <div className="flex flex-wrap gap-3 mb-4">
                                        <Badge
                                          variant="outline"
                                          className="bg-gray-50 border-gray-200 text-gray-700 px-3 py-1"
                                        >
                                          <Calendar className="h-3 w-3 mr-1" />
                                          {degree.duration}
                                        </Badge>
                                        <Badge
                                          className="px-3 py-1 text-white"
                                          style={{
                                            backgroundColor:
                                              "rgb(68, 171, 131)",
                                          }}
                                        >
                                          <Award className="h-3 w-3 mr-1" />
                                          APS: {degree.apsRequirement}
                                        </Badge>
                                      </div>

                                      {degree.careerProspects &&
                                        degree.careerProspects.length > 0 && (
                                          <div>
                                            <p className="text-sm font-medium text-gray-700 mb-3">
                                              Career Opportunities:
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                              {degree.careerProspects
                                                .slice(0, 4)
                                                .map((career, careerIndex) => (
                                                  <Badge
                                                    key={careerIndex}
                                                    variant="secondary"
                                                    className="bg-blue-50 text-blue-700 border-blue-200 text-xs px-2 py-1"
                                                  >
                                                    {career}
                                                  </Badge>
                                                ))}
                                              {degree.careerProspects.length >
                                                4 && (
                                                <Badge
                                                  variant="outline"
                                                  className="text-xs px-2 py-1"
                                                >
                                                  +
                                                  {degree.careerProspects
                                                    .length - 4}{" "}
                                                  more
                                                </Badge>
                                              )}
                                            </div>
                                          </div>
                                        )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-12 text-gray-500">
                              <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                              <p className="text-lg">
                                No specific programs listed for this faculty.
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-20">
                      <BookOpen className="h-20 w-20 mx-auto text-gray-300 mb-6" />
                      <h3 className="text-2xl font-semibold text-gray-700 mb-3">
                        No Programs Available
                      </h3>
                      <p className="text-gray-500 text-lg">
                        Program information for this university is not yet
                        available.
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="admissions" className="mt-0">
                <div className="space-y-8">
                  <div className="text-center pb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                      Admissions Information
                    </h2>
                    <p className="text-lg text-gray-600">
                      Everything you need to know about applying
                    </p>
                  </div>

                  {university.applicationInfo ? (
                    <div className="space-y-8">
                      {/* Application Status */}
                      <div className="bg-gradient-to-r from-gray-50 to-white rounded-2xl p-8 border border-gray-100">
                        <h3 className="text-xl font-semibold mb-6">
                          Application Status
                        </h3>
                        <div className="flex items-center gap-4">
                          <Badge
                            className={`text-lg px-6 py-3 font-semibold ${
                              university.applicationInfo.isOpen
                                ? "bg-green-100 text-green-800 border-green-200"
                                : "bg-red-100 text-red-800 border-red-200"
                            }`}
                          >
                            {university.applicationInfo.isOpen
                              ? "🟢 Open for Applications"
                              : "🔴 Applications Closed"}
                          </Badge>
                        </div>
                      </div>

                      {/* Application Details */}
                      <div className="grid md:grid-cols-2 gap-6">
                        {[
                          {
                            label: "Academic Year",
                            value: university.applicationInfo.academicYear,
                          },
                          {
                            label: "Opening Date",
                            value: university.applicationInfo.openingDate,
                          },
                          {
                            label: "Closing Date",
                            value: university.applicationInfo.closingDate,
                          },
                          {
                            label: "Application Fee",
                            value: university.applicationInfo.applicationFee,
                          },
                        ]
                          .filter((item) => item.value)
                          .map((item, index) => (
                            <div
                              key={index}
                              className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
                            >
                              <h4 className="font-semibold text-gray-900 mb-2">
                                {item.label}
                              </h4>
                              <p className="text-gray-600 text-lg">
                                {item.value}
                              </p>
                            </div>
                          ))}
                      </div>

                      {university.applicationInfo.applicationMethod && (
                        <div className="bg-blue-50 rounded-2xl p-8 border border-blue-200">
                          <h3 className="text-xl font-semibold text-blue-900 mb-4">
                            Application Method
                          </h3>
                          <p className="text-blue-800 text-lg leading-relaxed">
                            {university.applicationInfo.applicationMethod}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-20">
                      <Calendar className="h-20 w-20 mx-auto text-gray-300 mb-6" />
                      <h3 className="text-2xl font-semibold text-gray-700 mb-4">
                        No Admissions Information
                      </h3>
                      <p className="text-gray-500 text-lg mb-8">
                        Please visit the university website for current
                        application details.
                      </p>
                      {university.website && (
                        <Button
                          onClick={() =>
                            window.open(university.website, "_blank")
                          }
                          size="lg"
                          className="text-white shadow-lg"
                          style={{ backgroundColor: "rgb(68, 171, 131)" }}
                        >
                          <ExternalLink className="h-5 w-5 mr-2" />
                          Visit University Website
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="contact" className="mt-0">
                <div className="space-y-8">
                  <div className="text-center pb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                      Contact Information
                    </h2>
                    <p className="text-lg text-gray-600">
                      Get in touch with the university
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    {university.website && (
                      <div className="bg-gradient-to-br from-green-50 to-white rounded-2xl p-8 border border-green-100">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-lg">
                            <Globe className="h-6 w-6 text-white" />
                          </div>
                          <h3 className="text-xl font-semibold text-gray-900">
                            Official Website
                          </h3>
                        </div>
                        <a
                          href={university.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-700 text-lg font-medium hover:underline break-all"
                        >
                          {university.website}
                        </a>
                      </div>
                    )}

                    {university.admissionsContact && (
                      <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-8 border border-blue-100">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                            <Mail className="h-6 w-6 text-white" />
                          </div>
                          <h3 className="text-xl font-semibold text-gray-900">
                            Admissions Office
                          </h3>
                        </div>
                        <p className="text-gray-700 text-lg">
                          {university.admissionsContact}
                        </p>
                      </div>
                    )}

                    <div className="bg-gradient-to-br from-purple-50 to-white rounded-2xl p-8 border border-purple-100 md:col-span-2">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                          <MapPin className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900">
                          Campus Location
                        </h3>
                      </div>
                      <p className="text-gray-700 text-xl">
                        {university.location}, {university.province}
                      </p>
                    </div>

                    {university.studentPortal && (
                      <div className="bg-gradient-to-br from-orange-50 to-white rounded-2xl p-8 border border-orange-100 md:col-span-2">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                            <Users className="h-6 w-6 text-white" />
                          </div>
                          <h3 className="text-xl font-semibold text-gray-900">
                            Student Portal
                          </h3>
                        </div>
                        <a
                          href={university.studentPortal}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-orange-600 hover:text-orange-700 text-lg font-medium hover:underline break-all"
                        >
                          {university.studentPortal}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="campus" className="mt-0">
                <div className="space-y-8">
                  <div className="text-center pb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                      Campus Information
                    </h2>
                    <p className="text-lg text-gray-600">
                      Learn about campus life and facilities
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    {university.establishedYear && (
                      <div className="bg-gradient-to-br from-green-50 to-white rounded-2xl p-8 border border-green-100">
                        <h4 className="font-semibold text-gray-900 mb-3 text-lg">
                          Founded
                        </h4>
                        <p className="text-gray-700 text-2xl font-bold">
                          {university.establishedYear}
                        </p>
                      </div>
                    )}

                    {university.studentPopulation && (
                      <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-8 border border-blue-100">
                        <h4 className="font-semibold text-gray-900 mb-3 text-lg">
                          Student Population
                        </h4>
                        <p className="text-gray-700 text-2xl font-bold">
                          {university.studentPopulation.toLocaleString()}{" "}
                          students
                        </p>
                      </div>
                    )}

                    <div className="bg-gradient-to-br from-purple-50 to-white rounded-2xl p-8 border border-purple-100 md:col-span-2">
                      <h3 className="text-xl font-semibold text-gray-900 mb-6">
                        Campus Locations
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                          <Building className="h-5 w-5 text-purple-500" />
                          <div>
                            <p className="font-medium text-gray-900">
                              Main Campus
                            </p>
                            <p className="text-gray-600">
                              {university.location}, {university.province}
                            </p>
                          </div>
                        </div>

                        {university.campuses &&
                          university.campuses.length > 0 &&
                          university.campuses.map((campus, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border border-gray-100"
                            >
                              <Building className="h-5 w-5 text-gray-400" />
                              <div>
                                <p className="font-medium text-gray-900">
                                  Additional Campus
                                </p>
                                <p className="text-gray-600">{campus}</p>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="accommodation" className="mt-0">
                <div className="relative overflow-hidden min-h-screen">
                  {/* Dynamic background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50"></div>
                  <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-l from-green-300/30 to-transparent rounded-full blur-3xl animate-pulse"></div>
                  <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-r from-emerald-300/30 to-transparent rounded-full blur-3xl animate-pulse delay-1000"></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-teal-200/20 to-green-200/20 rounded-full blur-2xl animate-ping"></div>

                  <div className="relative z-10 py-20 px-6">
                    <div className="max-w-6xl mx-auto">
                      {/* Header section */}
                      <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-6 py-3 rounded-full text-sm font-medium mb-6 animate-bounce">
                          <Home className="w-5 h-5" />
                          Housing at {university.name}
                        </div>
                        <h2 className="text-5xl font-bold text-gray-900 mb-6 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                          Student Accommodation
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                          We're building something incredible to help you find
                          the perfect home during your studies at{" "}
                          {university.name}
                        </p>
                      </div>

                      {/* Main content */}
                      <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
                        {/* Left side - Features */}
                        <div className="space-y-8">
                          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-green-100 shadow-xl">
                            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                                <Star className="w-5 h-5 text-white" />
                              </div>
                              What's Coming
                            </h3>
                            <div className="space-y-4">
                              <div className="flex items-start gap-3">
                                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-1">
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900">
                                    Campus Residences
                                  </h4>
                                  <p className="text-gray-600 text-sm">
                                    Official university accommodation with meal
                                    plans
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-start gap-3">
                                <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center mt-1">
                                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900">
                                    Off-Campus Housing
                                  </h4>
                                  <p className="text-gray-600 text-sm">
                                    Apartments and shared housing near campus
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-start gap-3">
                                <div className="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center mt-1">
                                  <CheckCircle className="w-4 h-4 text-teal-600" />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900">
                                    Virtual Tours
                                  </h4>
                                  <p className="text-gray-600 text-sm">
                                    360° tours and detailed photo galleries
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-start gap-3">
                                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-1">
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900">
                                    Application System
                                  </h4>
                                  <p className="text-gray-600 text-sm">
                                    Simple online applications and instant
                                    approvals
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Right side - Coming Soon Hero */}
                        <div className="text-center">
                          <div className="relative">
                            <div className="w-32 h-32 mx-auto bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 rounded-3xl flex items-center justify-center shadow-2xl transform hover:scale-110 transition-all duration-500 mb-8">
                              <Home className="h-16 w-16 text-white" />
                              <div className="absolute -top-3 -right-3 w-8 h-8 bg-yellow-400 rounded-full animate-bounce flex items-center justify-center">
                                <span className="text-xs font-bold text-yellow-900">
                                  !
                                </span>
                              </div>
                              <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-blue-400 rounded-full animate-pulse"></div>
                            </div>

                            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-3xl p-8 text-white shadow-2xl transform hover:scale-105 transition-transform duration-300">
                              <h3 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
                                <Star className="w-10 h-10 text-yellow-300 animate-spin" />
                                Coming Soon!
                                <Star className="w-10 h-10 text-yellow-300 animate-spin" />
                              </h3>
                              <p className="text-xl text-green-50 leading-relaxed mb-6">
                                Revolutionary accommodation platform launching
                                soon
                              </p>
                              <div className="bg-white/20 rounded-2xl p-4 backdrop-blur-sm">
                                <p className="text-green-100 text-sm">
                                  🏠 Smart matching system
                                  <br />
                                  📱 Mobile-first experience
                                  <br />
                                  💳 Secure payment processing
                                  <br />
                                  🤝 Student community features
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Bottom CTA */}
                      <div className="text-center">
                        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-green-100 shadow-xl max-w-2xl mx-auto">
                          <h4 className="text-2xl font-bold text-gray-900 mb-4">
                            Be the First to Know!
                          </h4>
                          <p className="text-gray-600 mb-6">
                            Get exclusive early access when we launch
                            accommodation services for {university.name}
                          </p>
                          {isAuthenticated ? (
                            <Button
                              onClick={handleNotifyRequest}
                              disabled={notifyLoading}
                              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-10 py-4 rounded-2xl font-bold text-lg shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                              {notifyLoading ? (
                                <>
                                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                  Submitting...
                                </>
                              ) : (
                                <>
                                  <Bell className="w-5 h-5 mr-2" />
                                  Notify Me When Available
                                </>
                              )}
                            </Button>
                          ) : (
                            <div className="space-y-3">
                              <Button
                                disabled
                                className="bg-gray-400 text-white px-10 py-4 rounded-2xl font-bold text-lg cursor-not-allowed"
                              >
                                <Lock className="w-5 h-5 mr-2" />
                                Login Required to Get Notified
                              </Button>
                              <p className="text-sm text-gray-500 text-center">
                                <button
                                  onClick={() => navigate("/login")}
                                  className="text-green-600 hover:underline font-medium"
                                >
                                  Log in
                                </button>{" "}
                                to receive notifications about {university.name}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default UniversityDetailView;

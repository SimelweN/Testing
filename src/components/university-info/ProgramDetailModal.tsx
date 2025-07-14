import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Clock,
  GraduationCap,
  TrendingUp,
  BookOpen,
  Users,
  Calendar,
  Calculator,
  Briefcase,
  DollarSign,
  Award,
  CheckCircle,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { Degree, University } from "@/types/university";

interface ProgramDetailModalProps {
  program: Degree | null;
  university: University | null;
  isOpen: boolean;
  onClose: () => void;
}

const ProgramDetailModal: React.FC<ProgramDetailModalProps> = ({
  program,
  university,
  isOpen,
  onClose,
}) => {
  if (!program || !university) return null;

  // Get expected salary range based on program type
  const getSalaryRange = (programName: string): string => {
    const lowerName = programName.toLowerCase();

    if (lowerName.includes("medicine") || lowerName.includes("dental")) {
      return "R800,000 - R2,500,000+";
    } else if (
      lowerName.includes("engineering") ||
      lowerName.includes("computer")
    ) {
      return "R450,000 - R1,200,000";
    } else if (lowerName.includes("law")) {
      return "R350,000 - R1,500,000";
    } else if (
      lowerName.includes("business") ||
      lowerName.includes("finance") ||
      lowerName.includes("accounting")
    ) {
      return "R300,000 - R800,000";
    } else if (
      lowerName.includes("psychology") ||
      lowerName.includes("social work")
    ) {
      return "R250,000 - R600,000";
    } else if (
      lowerName.includes("education") ||
      lowerName.includes("teaching")
    ) {
      return "R200,000 - R500,000";
    } else if (lowerName.includes("arts") || lowerName.includes("humanities")) {
      return "R180,000 - R450,000";
    } else {
      return "R200,000 - R650,000";
    }
  };

  // Get employment rate based on program type
  const getEmploymentRate = (programName: string): number => {
    const lowerName = programName.toLowerCase();

    if (lowerName.includes("medicine") || lowerName.includes("dental")) {
      return 95;
    } else if (
      lowerName.includes("engineering") ||
      lowerName.includes("computer")
    ) {
      return 92;
    } else if (
      lowerName.includes("accounting") ||
      lowerName.includes("finance")
    ) {
      return 88;
    } else if (lowerName.includes("law")) {
      return 85;
    } else if (lowerName.includes("business")) {
      return 82;
    } else if (
      lowerName.includes("psychology") ||
      lowerName.includes("social work")
    ) {
      return 78;
    } else if (
      lowerName.includes("education") ||
      lowerName.includes("teaching")
    ) {
      return 75;
    } else {
      return 70;
    }
  };

  // Get skills developed in this program
  const getSkillsDeveloped = (programName: string): string[] => {
    const lowerName = programName.toLowerCase();

    if (lowerName.includes("engineering")) {
      return [
        "Problem Solving",
        "Technical Design",
        "Project Management",
        "Mathematical Analysis",
        "Innovation",
        "Critical Thinking",
      ];
    } else if (
      lowerName.includes("computer") ||
      lowerName.includes("information")
    ) {
      return [
        "Programming",
        "Data Analysis",
        "System Design",
        "Problem Solving",
        "Logical Thinking",
        "Technology Integration",
      ];
    } else if (
      lowerName.includes("business") ||
      lowerName.includes("commerce")
    ) {
      return [
        "Leadership",
        "Strategic Thinking",
        "Financial Analysis",
        "Communication",
        "Project Management",
        "Team Work",
      ];
    } else if (lowerName.includes("medicine") || lowerName.includes("health")) {
      return [
        "Clinical Skills",
        "Patient Care",
        "Medical Knowledge",
        "Empathy",
        "Decision Making",
        "Attention to Detail",
      ];
    } else if (lowerName.includes("law")) {
      return [
        "Legal Research",
        "Critical Analysis",
        "Written Communication",
        "Negotiation",
        "Advocacy",
        "Ethical Reasoning",
      ];
    } else if (lowerName.includes("education")) {
      return [
        "Teaching Skills",
        "Curriculum Development",
        "Student Assessment",
        "Communication",
        "Patience",
        "Mentoring",
      ];
    } else if (lowerName.includes("psychology")) {
      return [
        "Human Behavior Analysis",
        "Research Skills",
        "Counseling",
        "Empathy",
        "Data Interpretation",
        "Communication",
      ];
    } else {
      return [
        "Critical Thinking",
        "Research Skills",
        "Communication",
        "Problem Solving",
        "Time Management",
        "Teamwork",
      ];
    }
  };

  // Get study requirements/prerequisites
  const getStudyRequirements = (program: Degree): string[] => {
    const requirements = [];

    program.subjects.forEach((subject) => {
      if (subject.isRequired) {
        requirements.push(`${subject.name} (Level ${subject.level})`);
      }
    });

    if (requirements.length === 0) {
      return [
        "National Senior Certificate (NSC)",
        "English (Home/First Additional Language)",
        "Mathematics or Mathematical Literacy",
      ];
    }

    return requirements;
  };

  const salaryRange = getSalaryRange(program.name);
  const employmentRate = getEmploymentRate(program.name);
  const skillsDeveloped = getSkillsDeveloped(program.name);
  const studyRequirements = getStudyRequirements(program);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl lg:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <DialogTitle className="text-2xl mb-2">
                {program.name}
              </DialogTitle>
              <DialogDescription className="text-lg">
                {university.fullName} • {program.faculty}
              </DialogDescription>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-3">
                <Badge
                  variant="secondary"
                  className="bg-book-100 text-book-700 text-xs sm:text-sm"
                >
                  <Clock className="h-3 w-3 mr-1" />
                  {program.duration}
                </Badge>
                <Badge
                  variant="secondary"
                  className="bg-blue-100 text-blue-700 text-xs sm:text-sm"
                >
                  <Calculator className="h-3 w-3 mr-1" />
                  APS: {program.apsRequirement}
                </Badge>
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-700 text-xs sm:text-sm"
                >
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {employmentRate}% Employment Rate
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full mt-6">
          {/* Mobile: Vertical Tab Stack */}
          <div className="block sm:hidden">
            <TabsList className="bg-transparent p-1 h-auto w-full flex flex-col space-y-1 rounded-lg">
              <TabsTrigger
                value="overview"
                className="w-full rounded-lg py-2 px-3 data-[state=active]:bg-book-50 data-[state=active]:text-book-700 text-sm"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="career"
                className="w-full rounded-lg py-2 px-3 data-[state=active]:bg-book-50 data-[state=active]:text-book-700 text-sm"
              >
                Career Info
              </TabsTrigger>
              <TabsTrigger
                value="requirements"
                className="w-full rounded-lg py-2 px-3 data-[state=active]:bg-book-50 data-[state=active]:text-book-700 text-sm"
              >
                Requirements
              </TabsTrigger>
              <TabsTrigger
                value="financial"
                className="w-full rounded-lg py-2 px-3 data-[state=active]:bg-book-50 data-[state=active]:text-book-700 text-sm"
              >
                Financial Info
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Desktop: Horizontal Grid */}
          <div className="hidden sm:block">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="career">Career Info</TabsTrigger>
              <TabsTrigger value="requirements">Requirements</TabsTrigger>
              <TabsTrigger value="financial">Financial Info</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="mt-6">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BookOpen className="h-5 w-5 mr-2 text-book-500" />
                    Program Description
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">
                    {program.description}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Award className="h-5 w-5 mr-2 text-book-500" />
                    Skills You'll Develop
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {skillsDeveloped.map((skill, index) => (
                      <div
                        key={index}
                        className="flex items-center p-3 bg-book-50 rounded-lg"
                      >
                        <CheckCircle className="h-4 w-4 text-book-500 mr-2" />
                        <span className="text-sm font-medium">{skill}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <GraduationCap className="h-5 w-5 mr-2 text-book-500" />
                    Program Structure
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <span className="font-medium">Duration</span>
                      <span className="text-book-600">{program.duration}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <span className="font-medium">Faculty</span>
                      <span className="text-book-600">{program.faculty}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <span className="font-medium">Qualification Type</span>
                      <span className="text-book-600">
                        {program.name.includes("Bachelor")
                          ? "Undergraduate Degree"
                          : program.name.includes("Honours")
                            ? "Honours Degree"
                            : program.name.includes("Master")
                              ? "Master's Degree"
                              : "Degree"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="career" className="mt-6">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Briefcase className="h-5 w-5 mr-2 text-book-500" />
                    Career Prospects
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {program.careerProspects.map((career, index) => (
                      <div
                        key={index}
                        className="flex items-start p-4 bg-book-50 rounded-lg"
                      >
                        <CheckCircle className="h-5 w-5 text-book-500 mr-3 mt-0.5" />
                        <span className="font-medium">{career}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <DollarSign className="h-5 w-5 mr-2 text-green-500" />
                      Expected Salary Range
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600 mb-2">
                        {salaryRange}
                      </div>
                      <p className="text-sm text-gray-600">
                        Annual salary (Entry to Senior level)
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2 text-blue-500" />
                      Employment Rate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600 mb-2">
                        {employmentRate}%
                      </div>
                      <p className="text-sm text-gray-600">
                        Graduate employment within 6 months
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2 text-book-500" />
                    Industry Demand
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>Job Market Outlook</span>
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-700"
                      >
                        {employmentRate >= 85
                          ? "Excellent"
                          : employmentRate >= 70
                            ? "Good"
                            : "Moderate"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Growth Potential</span>
                      <Badge
                        variant="secondary"
                        className="bg-blue-100 text-blue-700"
                      >
                        {program.name.toLowerCase().includes("computer") ||
                        program.name.toLowerCase().includes("engineering")
                          ? "High"
                          : program.name.toLowerCase().includes("health") ||
                              program.name.toLowerCase().includes("business")
                            ? "Medium-High"
                            : "Medium"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="requirements" className="mt-6">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertCircle className="h-5 w-5 mr-2 text-orange-500" />
                    Admission Requirements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                      <span className="font-medium">Minimum APS Required</span>
                      <Badge className="bg-orange-100 text-orange-700 text-lg">
                        {program.apsRequirement}
                      </Badge>
                    </div>
                    <div>
                      <h4 className="font-medium mb-3">
                        Subject Requirements:
                      </h4>
                      <div className="space-y-2">
                        {studyRequirements.map((requirement, index) => (
                          <div
                            key={index}
                            className="flex items-center p-3 bg-gray-50 rounded"
                          >
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                            <span>{requirement}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-book-500" />
                    Application Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {university.applicationInfo ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-book-50 rounded">
                        <span>Application Period</span>
                        <span className="font-medium">
                          {university.applicationInfo.openingDate} -{" "}
                          {university.applicationInfo.closingDate}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-book-50 rounded">
                        <span>Academic Year</span>
                        <span className="font-medium">
                          {university.applicationInfo.academicYear}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-book-50 rounded">
                        <span>Application Fee</span>
                        <span className="font-medium">
                          {university.applicationInfo.applicationFee ||
                            "No fee"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-book-50 rounded">
                        <span>Application Method</span>
                        <span className="font-medium">
                          {university.applicationInfo.applicationMethod}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-600">
                      Application information not available. Please contact the
                      university directly.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="financial" className="mt-6">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <DollarSign className="h-5 w-5 mr-2 text-green-500" />
                    Financial Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <h4 className="font-medium text-yellow-800 mb-2">
                        Estimated Annual Fees
                      </h4>
                      <p className="text-yellow-700 text-sm">
                        Tuition fees vary by program and are subject to annual
                        increases. Contact the university for current fee
                        structures.
                      </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="p-4 bg-green-50 rounded-lg">
                        <h4 className="font-medium text-green-800 mb-2">
                          Financial Aid Available
                        </h4>
                        <ul className="text-sm text-green-700 space-y-1">
                          <li>• NSFAS funding eligibility</li>
                          <li>• University bursaries</li>
                          <li>• Merit-based scholarships</li>
                          <li>• External bursary programs</li>
                        </ul>
                      </div>

                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-blue-800 mb-2">
                          Payment Options
                        </h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                          <li>• Annual payment (discount available)</li>
                          <li>• Semester payment plans</li>
                          <li>• Monthly installment options</li>
                          <li>• Debit order facilities</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Mobile: Stacked buttons */}
        <div className="block sm:hidden pt-6 border-t space-y-3">
          <div className="flex flex-col gap-3">
            {university.website && (
              <Button variant="outline" className="w-full" asChild>
                <a
                  href={university.website}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  University Website
                </a>
              </Button>
            )}
            <Button className="bg-book-600 hover:bg-book-700 w-full">
              <Calculator className="h-4 w-4 mr-2" />
              Calculate My APS
            </Button>
            <Button variant="outline" onClick={onClose} className="w-full">
              Close
            </Button>
          </div>
        </div>

        {/* Desktop: Horizontal layout */}
        <div className="hidden sm:flex justify-between items-center pt-6 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <div className="flex gap-3">
            {university.website && (
              <Button variant="outline" asChild>
                <a
                  href={university.website}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  University Website
                </a>
              </Button>
            )}
            <Button className="bg-book-600 hover:bg-book-700">
              <Calculator className="h-4 w-4 mr-2" />
              Calculate My APS
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProgramDetailModal;

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  ExternalLink,
  Calendar,
  DollarSign,
  Users,
  MapPin,
  Info,
  CheckCircle,
  AlertCircle,
  GraduationCap,
  BookOpen,
  Star,
  Heart,
  Target,
  TrendingUp,
  Award,
  Banknote,
} from "lucide-react";
import {
  BURSARIES,
  BURSARY_FIELDS_OF_STUDY,
} from "@/constants/enhancedBursaries";
import { PROVINCES } from "@/constants/bursaries";
import { BursaryFilters } from "@/types/university";

const EnhancedBursaryListing = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<BursaryFilters>({});
  const [expandedBursary, setExpandedBursary] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  // Filter bursaries based on current filters - only university bursaries
  const filteredBursaries = useMemo(() => {
    const bursariesToFilter = BURSARIES.filter(
      (b) =>
        !b.studyLevel?.includes("grade-11") &&
        !b.studyLevel?.includes("matric"),
    );

    return bursariesToFilter.filter((bursary) => {
      // Search filter
      const matchesSearch =
        !searchTerm ||
        bursary.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bursary.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bursary.description.toLowerCase().includes(searchTerm.toLowerCase());

      // Field of study filter
      const matchesField =
        !filters.fieldOfStudy ||
        bursary.fieldsOfStudy.includes("All fields") ||
        bursary.fieldsOfStudy.includes(filters.fieldOfStudy);

      // Province filter
      const matchesProvince =
        !filters.province ||
        bursary.provinces.includes("All provinces") ||
        bursary.provinces.includes(filters.province);

      // Financial need filter
      const matchesFinancialNeed =
        filters.financialNeed === undefined ||
        bursary.requirements.financialNeed === filters.financialNeed;

      // Minimum marks filter
      const matchesMinMarks = (() => {
        if (!filters.minMarks) return true;

        if (bursary.requirements.minimumMarks !== undefined) {
          return bursary.requirements.minimumMarks <= filters.minMarks;
        }

        const academicTexts = [
          ...(bursary.requirements?.academicRequirement
            ? [bursary.requirements.academicRequirement]
            : []),
          ...bursary.eligibilityCriteria.filter(
            (criteria) =>
              criteria.toLowerCase().includes("%") ||
              criteria.toLowerCase().includes("average") ||
              criteria.toLowerCase().includes("minimum") ||
              criteria.toLowerCase().includes("academic"),
          ),
        ];

        for (const text of academicTexts) {
          const marksMatch = text.match(/(\d+)%/);
          if (marksMatch) {
            const extractedMarks = parseInt(marksMatch[1]);
            return extractedMarks <= filters.minMarks;
          }
        }

        return true;
      })();

      // Maximum household income filter
      const matchesHouseholdIncome = (() => {
        if (!filters.maxHouseholdIncome) return true;

        if (bursary.requirements.maxHouseholdIncome !== undefined) {
          return (
            bursary.requirements.maxHouseholdIncome >=
            filters.maxHouseholdIncome
          );
        }

        const incomeText = bursary.eligibilityCriteria.find(
          (criteria) =>
            criteria.toLowerCase().includes("income") ||
            criteria.toLowerCase().includes("household") ||
            criteria.toLowerCase().includes("r"),
        );

        if (incomeText) {
          const incomeMatch = incomeText.match(/R?[\s]*(\d[\d,\s]*)/);
          if (incomeMatch) {
            const extractedIncome = parseInt(
              incomeMatch[1].replace(/[,\s]/g, ""),
            );
            return extractedIncome >= filters.maxHouseholdIncome;
          }
        }

        return true;
      })();

      return (
        matchesSearch &&
        matchesField &&
        matchesProvince &&
        matchesFinancialNeed &&
        matchesMinMarks &&
        matchesHouseholdIncome
      );
    });
  }, [searchTerm, filters, activeTab]);

  const updateFilter = (
    key: keyof BursaryFilters,
    value: string | boolean | undefined,
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilters({});
  };

  const getApplicationStatus = (deadline: string) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const timeDiff = deadlineDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    if (daysDiff < 0) {
      return { status: "closed", message: "Application closed", color: "red" };
    } else if (daysDiff <= 30) {
      return {
        status: "closing",
        message: `${daysDiff} days left`,
        color: "orange",
      };
    } else {
      return { status: "open", message: "Application open", color: "green" };
    }
  };

  // High school stats
  const highSchoolStats = useMemo(() => {
    const total = HIGH_SCHOOL_BURSARIES.length;
    const grade11 = HIGH_SCHOOL_BURSARIES.filter((b) =>
      b.studyLevel?.includes("grade-11"),
    ).length;
    const matric = HIGH_SCHOOL_BURSARIES.filter((b) =>
      b.studyLevel?.includes("matric"),
    ).length;
    const totalFunding = HIGH_SCHOOL_BURSARIES.reduce((acc, b) => {
      const amountMatch = b.amount.match(/R?[\s]*(\d[\d,\s]*)/);
      return (
        acc +
        (amountMatch ? parseInt(amountMatch[1].replace(/[,\s]/g, "")) : 50000)
      );
    }, 0);

    return { total, grade11, matric, totalFunding };
  }, []);

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="text-center space-y-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white p-8 rounded-xl">
        <div className="flex items-center justify-center gap-3 mb-4">
          <GraduationCap className="h-12 w-12" />
          <h1 className="text-4xl font-bold">Bursary Opportunities</h1>
        </div>
        <p className="text-xl max-w-3xl mx-auto opacity-90">
          Unlock your educational dreams with comprehensive funding
          opportunities. From high school to university, find the perfect
          bursary for your journey.
        </p>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 max-w-4xl mx-auto">
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
            <div className="text-2xl font-bold">{BURSARIES.length}+</div>
            <div className="text-sm opacity-90">Total Bursaries</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
            <div className="text-2xl font-bold">{highSchoolStats.total}</div>
            <div className="text-sm opacity-90">High School</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
            <div className="text-2xl font-bold">
              R{(highSchoolStats.totalFunding / 1000000).toFixed(0)}M+
            </div>
            <div className="text-sm opacity-90">Available Funding</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
            <div className="text-2xl font-bold">100%</div>
            <div className="text-sm opacity-90">Success Rate</div>
          </div>
        </div>
      </div>

      {/* High School Focus Section */}
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-3xl text-blue-800">
              High School Student Bursaries
            </CardTitle>
          </div>
          <CardDescription className="text-lg text-blue-700">
            Dedicated financial support for Grade 11 and Matric students
            planning their university journey
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* High School Criteria Highlights */}
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white p-6 rounded-lg border border-blue-200 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <Target className="h-8 w-8 text-green-600" />
                <h3 className="text-xl font-semibold text-gray-800">
                  Academic Requirements
                </h3>
              </div>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>
                    <strong>70-75%</strong> average minimum
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Strong math & science performance</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Consistent academic progress</span>
                </li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-lg border border-blue-200 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <Banknote className="h-8 w-8 text-blue-600" />
                <h3 className="text-xl font-semibold text-gray-800">
                  Income Criteria
                </h3>
              </div>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-500" />
                  <span>
                    <strong>R200,000 - R300,000</strong> household income
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-500" />
                  <span>Financial need demonstrated</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-500" />
                  <span>Supporting documentation required</span>
                </li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-lg border border-blue-200 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <Award className="h-8 w-8 text-purple-600" />
                <h3 className="text-xl font-semibold text-gray-800">
                  Benefits Included
                </h3>
              </div>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-purple-500" />
                  <span>School fees coverage</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-purple-500" />
                  <span>Textbooks & stationery</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-purple-500" />
                  <span>Mentorship programs</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap gap-4 justify-center">
            <Button
              onClick={() => setActiveTab("high-school")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
            >
              <GraduationCap className="mr-2 h-5 w-5" />
              View High School Bursaries
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setFilters({ studyLevel: "grade-11" });
                setActiveTab("high-school");
              }}
              className="border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-3 text-lg"
            >
              Grade 11 Only
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setFilters({ studyLevel: "matric" });
                setActiveTab("high-school");
              }}
              className="border-purple-600 text-purple-600 hover:bg-purple-50 px-8 py-3 text-lg"
            >
              Matric Only
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabbed Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            All Bursaries ({BURSARIES.length})
          </TabsTrigger>
          <TabsTrigger value="high-school" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            High School ({HIGH_SCHOOL_BURSARIES.length})
          </TabsTrigger>
          <TabsTrigger value="university" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            University ({BURSARIES.length - HIGH_SCHOOL_BURSARIES.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          {/* Search and Filters for All */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Find Your Perfect Bursary
              </CardTitle>
              <CardDescription>
                Use the filters below to find bursaries that match your needs
                and eligibility.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search bursaries by name, provider, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filter Controls */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select
                  value={filters.fieldOfStudy || "all"}
                  onValueChange={(value) =>
                    updateFilter(
                      "fieldOfStudy",
                      value === "all" ? undefined : value,
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Field of study" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All fields</SelectItem>
                    {BURSARY_FIELDS_OF_STUDY.map((field) => (
                      <SelectItem key={field} value={field}>
                        {field}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={filters.province || "all"}
                  onValueChange={(value) =>
                    updateFilter(
                      "province",
                      value === "all" ? undefined : value,
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Province" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All provinces</SelectItem>
                    {PROVINCES.map((province) => (
                      <SelectItem key={province} value={province}>
                        {province}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="high-school" className="space-y-6">
          {/* High School Specific Filters */}
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <GraduationCap className="h-5 w-5" />
                High School Bursary Filters
              </CardTitle>
              <CardDescription className="text-blue-700">
                Find the perfect bursary for your Grade 11 or Matric year
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-blue-800">
                    Grade Level
                  </label>
                  <Select
                    value={filters.studyLevel || "all"}
                    onValueChange={(value) =>
                      updateFilter(
                        "studyLevel",
                        value === "all" ? undefined : value,
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Grades</SelectItem>
                      <SelectItem value="grade-11">Grade 11</SelectItem>
                      <SelectItem value="matric">Matric (Grade 12)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-blue-800">
                    Min. Academic Average (%)
                  </label>
                  <Input
                    type="number"
                    placeholder="e.g. 70"
                    min="0"
                    max="100"
                    value={filters.minMarks || ""}
                    onChange={(e) =>
                      updateFilter(
                        "minMarks",
                        e.target.value ? parseInt(e.target.value) : undefined,
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-blue-800">
                    Max. Household Income (R)
                  </label>
                  <Input
                    type="number"
                    placeholder="e.g. 200000"
                    min="0"
                    value={filters.maxHouseholdIncome || ""}
                    onChange={(e) =>
                      updateFilter(
                        "maxHouseholdIncome",
                        e.target.value ? parseInt(e.target.value) : undefined,
                      )
                    }
                  />
                </div>

                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="mt-6"
                >
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="university" className="space-y-6">
          {/* University Specific Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                University Bursary Filters
              </CardTitle>
              <CardDescription>
                Find bursaries for undergraduate and postgraduate studies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Same filters as "all" but focused on university */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search university bursaries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select
                  value={filters.fieldOfStudy || "all"}
                  onValueChange={(value) =>
                    updateFilter(
                      "fieldOfStudy",
                      value === "all" ? undefined : value,
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Field of study" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All fields</SelectItem>
                    {BURSARY_FIELDS_OF_STUDY.map((field) => (
                      <SelectItem key={field} value={field}>
                        {field}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={filters.province || "all"}
                  onValueChange={(value) =>
                    updateFilter(
                      "province",
                      value === "all" ? undefined : value,
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Province" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All provinces</SelectItem>
                    {PROVINCES.map((province) => (
                      <SelectItem key={province} value={province}>
                        {province}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Results Summary */}
      <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
        <span className="text-sm text-gray-600">
          Found <strong>{filteredBursaries.length}</strong> bursaries
          {activeTab === "high-school" && (
            <span className="text-blue-600 font-medium">
              {" "}
              for high school students
            </span>
          )}
        </span>
        {filteredBursaries.length > 0 && (
          <div className="flex gap-2">
            <Badge variant="outline">
              {
                filteredBursaries.filter((b) => b.requirements?.financialNeed)
                  .length
              }{" "}
              need-based
            </Badge>
            {activeTab === "high-school" && (
              <Badge variant="outline" className="bg-blue-100 text-blue-700">
                {
                  filteredBursaries.filter((b) =>
                    b.studyLevel?.includes("grade-11"),
                  ).length
                }{" "}
                Grade 11
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* High School Alert */}
      {activeTab === "high-school" && (
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>High School Students:</strong> These bursaries are
            specifically designed for Grade 11 and Matric students. Make sure to
            check the academic requirements and application deadlines carefully.
            Early applications increase your chances of success!
          </AlertDescription>
        </Alert>
      )}

      {/* Bursary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredBursaries.map((bursary) => {
          const applicationStatus = getApplicationStatus(
            bursary.applicationDeadline,
          );
          const isExpanded = expandedBursary === bursary.id;
          const isHighSchool =
            bursary.studyLevel?.includes("grade-11") ||
            bursary.studyLevel?.includes("matric");

          return (
            <Card
              key={bursary.id}
              className={`hover:shadow-lg transition-all duration-200 ${
                isHighSchool
                  ? "border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50"
                  : "hover:shadow-md"
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-book-800 flex items-center gap-2">
                      {isHighSchool && (
                        <GraduationCap className="h-5 w-5 text-blue-600" />
                      )}
                      {bursary.name}
                    </CardTitle>
                    <CardDescription className="text-gray-600 font-medium mt-1">
                      {bursary.provider}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {isHighSchool && (
                      <Badge className="bg-blue-100 text-blue-700 border-blue-300">
                        🎓 High School
                      </Badge>
                    )}
                    <Badge
                      variant={
                        applicationStatus.status === "open"
                          ? "default"
                          : applicationStatus.status === "closing"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {applicationStatus.message}
                    </Badge>
                  </div>
                </div>

                {/* Amount */}
                <div className="flex items-center gap-2 text-lg font-semibold text-green-600 mt-2">
                  <DollarSign className="h-5 w-5" />
                  {bursary.amount}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">{bursary.description}</p>

                {/* High School Specific Info */}
                {isHighSchool && (
                  <div className="bg-blue-100 p-3 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                      🎯 High School Requirements:
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      {bursary.requirements?.academicRequirement && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-blue-700">
                            Academic:
                          </span>
                          <span className="text-blue-600">
                            {bursary.requirements.academicRequirement}
                          </span>
                        </div>
                      )}
                      {bursary.eligibilityCriteria.find(
                        (c) =>
                          c.toLowerCase().includes("income") ||
                          c.toLowerCase().includes("r"),
                      ) && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-blue-700">
                            Income:
                          </span>
                          <span className="text-blue-600">
                            {bursary.eligibilityCriteria.find(
                              (c) =>
                                c.toLowerCase().includes("income") ||
                                c.toLowerCase().includes("r"),
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Key Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">Deadline:</span>
                    <span className="font-medium">
                      {bursary.applicationDeadline}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">Provinces:</span>
                    <span className="font-medium">
                      {bursary.provinces.includes("All provinces")
                        ? "All"
                        : bursary.provinces.slice(0, 2).join(", ")}
                      {bursary.provinces.length > 2 &&
                        !bursary.provinces.includes("All provinces") &&
                        "..."}
                    </span>
                  </div>
                </div>

                {/* Fields of Study */}
                <div>
                  <h4 className="text-sm font-medium text-gray-800 mb-2">
                    Fields of Study:
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {bursary.fieldsOfStudy.slice(0, 3).map((field, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-xs"
                      >
                        {field}
                      </Badge>
                    ))}
                    {bursary.fieldsOfStudy.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{bursary.fieldsOfStudy.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Expand/Collapse Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setExpandedBursary(isExpanded ? null : bursary.id)
                  }
                  className="w-full"
                >
                  {isExpanded ? "Show Less" : "View Details & Requirements"}
                </Button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="space-y-4 pt-4 border-t">
                    {/* Eligibility Criteria */}
                    <div>
                      <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Eligibility Criteria:
                      </h4>
                      <ul className="space-y-1">
                        {bursary.eligibilityCriteria.map((criteria, index) => (
                          <li
                            key={index}
                            className="text-sm flex items-start gap-2"
                          >
                            <span className="text-green-600 mt-1">•</span>
                            {criteria}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Application Process */}
                    <div>
                      <h4 className="font-medium text-gray-800 mb-2">
                        Application Process:
                      </h4>
                      <p className="text-sm text-gray-600">
                        {bursary.applicationProcess}
                      </p>
                    </div>

                    {/* Contact Information */}
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h4 className="font-medium text-gray-800 mb-2">
                        Contact Information:
                      </h4>
                      <p className="text-sm text-gray-600">
                        {bursary.contactInfo}
                      </p>
                      {bursary.website && (
                        <a
                          href={bursary.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mt-2"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Visit Website
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* No Results */}
      {filteredBursaries.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Search className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No bursaries found
          </h3>
          <p className="text-gray-600 mb-4">
            Try adjusting your search terms or filters to find more bursaries.
          </p>
          <Button variant="outline" onClick={clearFilters}>
            Clear All Filters
          </Button>
        </div>
      )}

      {/* Important Notice */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Important:</strong> Application deadlines and requirements may
          change. Always verify information directly with the bursary provider
          before applying. Start your applications early to avoid missing
          deadlines.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default EnhancedBursaryListing;

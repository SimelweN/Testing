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

  // Filter university bursaries only
  const filteredBursaries = useMemo(() => {
    const universityBursaries = BURSARIES.filter(
      (b) =>
        !b.studyLevel?.includes("grade-11") &&
        !b.studyLevel?.includes("matric"),
    );

    return universityBursaries.filter((bursary) => {
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

      // Gender filter
      const matchesGender =
        !filters.genderSpecific ||
        filters.genderSpecific === "any" ||
        !bursary.requirements.genderSpecific ||
        bursary.requirements.genderSpecific === filters.genderSpecific;

      // Race filter
      const matchesRace =
        !filters.raceSpecific ||
        filters.raceSpecific === "any" ||
        !bursary.requirements.raceSpecific ||
        bursary.requirements.raceSpecific === filters.raceSpecific;

      // Special criteria filters
      const matchesDisabilitySupport =
        !filters.disabilitySupport ||
        bursary.requirements.disabilitySupport === true;

      const matchesRuralBackground =
        !filters.ruralBackground ||
        bursary.requirements.ruralBackground === true;

      const matchesFirstGeneration =
        !filters.firstGeneration ||
        bursary.requirements.firstGeneration === true;

      return (
        matchesSearch &&
        matchesField &&
        matchesProvince &&
        matchesFinancialNeed &&
        matchesMinMarks &&
        matchesHouseholdIncome &&
        matchesGender &&
        matchesRace &&
        matchesDisabilitySupport &&
        matchesRuralBackground &&
        matchesFirstGeneration
      );
    });
  }, [searchTerm, filters]);

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

  // Helper function to get high school requirements for university bursaries
  const getHighSchoolRequirements = (bursary: any) => {
    const requirements = [];

    // Extract academic requirements
    if (bursary.requirements?.academicRequirement) {
      const marksMatch =
        bursary.requirements.academicRequirement.match(/(\d+)%/);
      if (marksMatch) {
        requirements.push({
          type: "academic",
          grade11: `Aim for ${Math.max(parseInt(marksMatch[1]) - 5, 60)}%+ average in Grade 11`,
          matric: `Minimum ${marksMatch[1]}% average in Matric`,
        });
      }
    }

    // Extract from eligibility criteria
    bursary.eligibilityCriteria.forEach((criteria: string) => {
      const marksMatch = criteria.match(/(\d+)%/);
      if (marksMatch && criteria.toLowerCase().includes("average")) {
        requirements.push({
          type: "academic",
          grade11: `Target ${Math.max(parseInt(marksMatch[1]) - 5, 60)}%+ in Grade 11`,
          matric: `Need ${marksMatch[1]}% Matric average`,
        });
      }

      if (
        criteria.toLowerCase().includes("nsc") ||
        criteria.toLowerCase().includes("matric")
      ) {
        requirements.push({
          type: "nsc",
          requirement: criteria,
        });
      }
    });

    return requirements;
  };

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="text-center space-y-4 bg-gradient-to-r from-green-600 via-book-600 to-emerald-600 text-white p-8 rounded-xl">
        <div className="flex items-center justify-center gap-3 mb-4">
          <GraduationCap className="h-12 w-12" />
          <h1 className="text-4xl font-bold">
            University Bursary Opportunities
          </h1>
        </div>
        <p className="text-xl max-w-3xl mx-auto opacity-90">
          Unlock your educational dreams with comprehensive university funding
          opportunities. Find the perfect bursary for your degree and career
          aspirations.
        </p>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6 max-w-3xl mx-auto">
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
            <div className="text-2xl font-bold">
              {filteredBursaries.length}+
            </div>
            <div className="text-sm opacity-90">University Bursaries</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
            <div className="text-2xl font-bold">R2B+</div>
            <div className="text-sm opacity-90">Available Funding</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
            <div className="text-2xl font-bold">All Fields</div>
            <div className="text-sm opacity-90">Study Areas</div>
          </div>
        </div>
      </div>

      {/* High School Student Information */}
      <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-green-800 flex items-center justify-center gap-2">
            <BookOpen className="h-6 w-6" />
            For High School Students: Plan Your University Bursary Journey
          </CardTitle>
          <CardDescription className="text-lg text-green-700">
            See what marks you need in Grade 11 and Matric to qualify for
            university bursaries
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Search and Filters */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold text-green-800 flex items-center gap-2">
                <Search className="h-5 w-5" />
                Find Your Perfect Bursary
              </CardTitle>
              <CardDescription className="text-gray-600 mt-1">
                Use the filters below to discover bursaries that match your
                academic goals and financial needs
              </CardDescription>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 border-green-200 text-green-700 hover:bg-green-50"
                >
                  <Info className="h-4 w-4" />
                  Help
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    Understanding Bursaries & Requirements
                  </DialogTitle>
                  <DialogDescription>
                    Your guide to university bursary applications and high
                    school preparation
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 text-sm">
                  <div>
                    <h4 className="font-semibold mb-2">What are Bursaries?</h4>
                    <p>
                      Bursaries are financial assistance programs that help
                      students pay for their education. Unlike loans, bursaries
                      typically don't need to be repaid, making them an
                      excellent form of financial aid.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">
                      For High School Students:
                    </h4>
                    <p>
                      Each bursary shows the Grade 11 and Matric marks you need
                      to achieve. Start preparing early:
                    </p>
                    <ul className="list-disc ml-4 space-y-1 mt-2">
                      <li>
                        <strong>Grade 11:</strong> Aim for 5-10% higher than the
                        minimum requirement
                      </li>
                      <li>
                        <strong>Matric:</strong> Must meet or exceed the stated
                        minimum average
                      </li>
                      <li>
                        <strong>Subject Requirements:</strong> Focus on
                        mathematics and science if required
                      </li>
                      <li>
                        <strong>NSC Requirements:</strong> Ensure you meet
                        National Senior Certificate standards
                      </li>
                    </ul>
                  </div>

                  <div className="bg-green-50 p-3 rounded border border-green-200">
                    <h4 className="font-semibold text-green-800 mb-2">
                      Application Tips:
                    </h4>
                    <ul className="text-green-700 text-xs space-y-1">
                      <li>
                        • Apply early - most bursaries have strict deadlines
                      </li>
                      <li>• Start preparing documents in Grade 11</li>
                      <li>• Maintain consistent academic performance</li>
                      <li>
                        • Apply for multiple bursaries to increase chances
                      </li>
                    </ul>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Search Bar Section */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Search Bursaries
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by name, provider, or field of study..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11 border-gray-200 focus:border-green-400 focus:ring-green-400"
              />
            </div>
          </div>

          {/* Main Filters Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-800 border-b border-gray-200 pb-2">
              Primary Filters
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Field of Study
                </label>
                <Select
                  value={filters.fieldOfStudy || "all"}
                  onValueChange={(value) =>
                    updateFilter(
                      "fieldOfStudy",
                      value === "all" ? undefined : value,
                    )
                  }
                >
                  <SelectTrigger className="h-11 border-gray-200 focus:border-green-400">
                    <SelectValue placeholder="Select field of study" />
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
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Province
                </label>
                <Select
                  value={filters.province || "all"}
                  onValueChange={(value) =>
                    updateFilter(
                      "province",
                      value === "all" ? undefined : value,
                    )
                  }
                >
                  <SelectTrigger className="h-11 border-gray-200 focus:border-green-400">
                    <SelectValue placeholder="Select province" />
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
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Min. Academic Average (%)
                </label>
                <Input
                  type="number"
                  placeholder="e.g. 65"
                  min="0"
                  max="100"
                  value={filters.minMarks || ""}
                  onChange={(e) =>
                    updateFilter(
                      "minMarks",
                      e.target.value ? parseInt(e.target.value) : undefined,
                    )
                  }
                  className="h-11 border-gray-200 focus:border-green-400 focus:ring-green-400"
                />
              </div>
            </div>
          </div>

          {/* Financial & Demographics Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-800 border-b border-gray-200 pb-2">
              Financial & Demographics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Max. Household Income (R)
                </label>
                <Input
                  type="number"
                  placeholder="e.g. 350,000"
                  min="0"
                  value={filters.maxHouseholdIncome || ""}
                  onChange={(e) =>
                    updateFilter(
                      "maxHouseholdIncome",
                      e.target.value ? parseInt(e.target.value) : undefined,
                    )
                  }
                  className="h-11 border-gray-200 focus:border-green-400 focus:ring-green-400"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Gender Requirements
                </label>
                <Select
                  value={filters.genderSpecific || "any"}
                  onValueChange={(value) =>
                    updateFilter(
                      "genderSpecific",
                      value === "any" ? undefined : value,
                    )
                  }
                >
                  <SelectTrigger className="h-11 border-gray-200 focus:border-green-400">
                    <SelectValue placeholder="Any gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Gender</SelectItem>
                    <SelectItem value="female">Female Only</SelectItem>
                    <SelectItem value="male">Male Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Race Requirements
                </label>
                <Select
                  value={filters.raceSpecific || "any"}
                  onValueChange={(value) =>
                    updateFilter(
                      "raceSpecific",
                      value === "any" ? undefined : value,
                    )
                  }
                >
                  <SelectTrigger className="h-11 border-gray-200 focus:border-green-400">
                    <SelectValue placeholder="Any race" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Race</SelectItem>
                    <SelectItem value="african">African</SelectItem>
                    <SelectItem value="coloured">Coloured</SelectItem>
                    <SelectItem value="indian">Indian</SelectItem>
                    <SelectItem value="white">White</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Special Criteria Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-800 border-b border-gray-200 pb-2">
              Special Criteria
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <Checkbox
                  id="financial-need"
                  checked={filters.financialNeed || false}
                  onCheckedChange={(checked) =>
                    updateFilter(
                      "financialNeed",
                      checked === true ? true : undefined,
                    )
                  }
                  className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                />
                <label
                  htmlFor="financial-need"
                  className="text-sm font-medium text-gray-700 cursor-pointer"
                >
                  Financial Need Based
                </label>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <Checkbox
                  id="disability-support"
                  checked={filters.disabilitySupport || false}
                  onCheckedChange={(checked) =>
                    updateFilter(
                      "disabilitySupport",
                      checked === true ? true : undefined,
                    )
                  }
                  className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                />
                <label
                  htmlFor="disability-support"
                  className="text-sm font-medium text-gray-700 cursor-pointer"
                >
                  Disability Support
                </label>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <Checkbox
                  id="rural-background"
                  checked={filters.ruralBackground || false}
                  onCheckedChange={(checked) =>
                    updateFilter(
                      "ruralBackground",
                      checked === true ? true : undefined,
                    )
                  }
                  className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                />
                <label
                  htmlFor="rural-background"
                  className="text-sm font-medium text-gray-700 cursor-pointer"
                >
                  Rural Background
                </label>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <Checkbox
                  id="first-generation"
                  checked={filters.firstGeneration || false}
                  onCheckedChange={(checked) =>
                    updateFilter(
                      "firstGeneration",
                      checked === true ? true : undefined,
                    )
                  }
                  className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                />
                <label
                  htmlFor="first-generation"
                  className="text-sm font-medium text-gray-700 cursor-pointer"
                >
                  First-Generation Student
                </label>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={clearFilters}
              className="flex items-center gap-2 border-gray-300 hover:bg-gray-50"
            >
              <AlertCircle className="h-4 w-4" />
              Clear All Filters
            </Button>
            <div className="text-sm text-gray-500 flex items-center">
              Use filters to narrow down {filteredBursaries.length} available
              bursaries
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
        <span className="text-sm text-gray-600">
          Found <strong>{filteredBursaries.length}</strong> university bursaries
        </span>
        {filteredBursaries.length > 0 && (
          <Badge variant="outline">
            {
              filteredBursaries.filter((b) => b.requirements?.financialNeed)
                .length
            }{" "}
            need-based
          </Badge>
        )}
      </div>

      {/* Bursary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredBursaries.map((bursary) => {
          const applicationStatus = getApplicationStatus(
            bursary.applicationDeadline,
          );
          const isExpanded = expandedBursary === bursary.id;
          const highSchoolReqs = getHighSchoolRequirements(bursary);

          return (
            <Card
              key={bursary.id}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-book-800">
                      {bursary.name}
                    </CardTitle>
                    <CardDescription className="text-gray-600 font-medium mt-1">
                      {bursary.provider}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
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

                {/* High School Requirements Preview */}
                {highSchoolReqs.length > 0 && (
                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                      📚 High School Requirements:
                    </h4>
                    <div className="text-sm text-green-700">
                      {highSchoolReqs.slice(0, 1).map((req, idx) => (
                        <div key={idx} className="space-y-1">
                          {req.grade11 && (
                            <div>
                              • <strong>Grade 11:</strong> {req.grade11}
                            </div>
                          )}
                          {req.matric && (
                            <div>
                              • <strong>Matric:</strong> {req.matric}
                            </div>
                          )}
                        </div>
                      ))}
                      {highSchoolReqs.length > 1 && (
                        <div className="text-green-600 text-xs mt-2">
                          View details for complete requirements
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
                    {/* High School Requirements - Detailed */}
                    {highSchoolReqs.length > 0 && (
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                          🎯 High School Preparation Requirements:
                        </h4>
                        <div className="space-y-3">
                          {highSchoolReqs.map((req, idx) => (
                            <div
                              key={idx}
                              className="bg-white p-3 rounded border border-green-200"
                            >
                              {req.type === "academic" && (
                                <div>
                                  <h5 className="font-medium text-green-800 mb-2">
                                    Academic Performance:
                                  </h5>
                                  <div className="grid md:grid-cols-2 gap-2 text-sm">
                                    {req.grade11 && (
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium text-green-700">
                                          Grade 11:
                                        </span>
                                        <span className="text-green-600">
                                          {req.grade11}
                                        </span>
                                      </div>
                                    )}
                                    {req.matric && (
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium text-green-700">
                                          Matric NSC:
                                        </span>
                                        <span className="text-green-600">
                                          {req.matric}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                              {req.type === "nsc" && (
                                <div>
                                  <h5 className="font-medium text-green-800 mb-2">
                                    NSC Requirements:
                                  </h5>
                                  <p className="text-sm text-green-600">
                                    {req.requirement}
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

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

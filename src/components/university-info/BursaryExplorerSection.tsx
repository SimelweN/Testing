import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Search,
  GraduationCap,
  MapPin,
  DollarSign,
  Clock,
  ExternalLink,
  Phone,
  Mail,
  Info,
  Calendar,
  FileText,
  CheckCircle,
  Filter,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  BURSARIES,
  BURSARY_FIELDS_OF_STUDY,
} from "@/constants/enhancedBursaries";
import { PROVINCES } from "@/constants/bursaries";
import { Bursary } from "@/types/university";

const BursaryExplorerSection = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedField, setSelectedField] = useState("all");
  const [selectedProvince, setSelectedProvince] = useState("all");
  const [showFinancialNeedOnly, setShowFinancialNeedOnly] = useState(false);
  const [expandedBursary, setExpandedBursary] = useState<string | null>(null);

  const filteredBursaries = useMemo(() => {
    return BURSARIES.filter((bursary) => {
      const matchesSearch =
        !searchQuery ||
        bursary.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bursary.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bursary.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesField =
        selectedField === "all" ||
        bursary.fieldsOfStudy.includes(selectedField) ||
        bursary.fieldsOfStudy.includes("All fields");

      const matchesProvince =
        selectedProvince === "all" ||
        bursary.provinces.includes(selectedProvince) ||
        bursary.provinces.includes("All provinces");

      const matchesFinancialNeed =
        !showFinancialNeedOnly || bursary.requirements.financialNeed === true;

      return (
        matchesSearch && matchesField && matchesProvince && matchesFinancialNeed
      );
    });
  }, [searchQuery, selectedField, selectedProvince, showFinancialNeedOnly]);

  const toggleExpanded = (bursaryId: string) => {
    setExpandedBursary(expandedBursary === bursaryId ? null : bursaryId);
  };

  const getBursaryTypeColor = (bursary: Bursary) => {
    if (bursary.id === "nsfas")
      return "bg-blue-100 text-blue-800 border-blue-200";
    if (
      bursary.provider.includes("Government") ||
      bursary.provider.includes("Department")
    ) {
      return "bg-green-100 text-green-800 border-green-200";
    }
    return "bg-purple-100 text-purple-800 border-purple-200";
  };

  const getFundingLevel = (amount: string) => {
    if (amount.toLowerCase().includes("full")) return "Full Funding";
    if (amount.includes("R40,000") || amount.includes("R80,000"))
      return "Partial Funding";
    return "Comprehensive Funding";
  };

  const getDeadlineUrgency = (deadline: string) => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;

    if (deadline.includes("January") || deadline.includes("31 January")) {
      return currentMonth > 1 ? "Closed" : "Urgent";
    }
    if (deadline.includes("March") || deadline.includes("31 March")) {
      return currentMonth > 3
        ? "Closed"
        : currentMonth === 3
          ? "Urgent"
          : "Open";
    }
    if (deadline.includes("April") || deadline.includes("30 April")) {
      return currentMonth > 4
        ? "Closed"
        : currentMonth === 4
          ? "Urgent"
          : "Open";
    }
    return "Open";
  };

  const getDeadlineColor = (urgency: string) => {
    switch (urgency) {
      case "Urgent":
        return "bg-red-100 text-red-800 border-red-200";
      case "Closed":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-green-100 text-green-800 border-green-200";
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 px-2 md:px-0">
      {/* Header with Graduation Image - Mobile optimized */}
      <div className="relative text-center space-y-3 md:space-y-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl md:rounded-2xl p-6 md:p-8 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&h=400&fit=crop&crop=center"
            alt="Graduation celebration with caps in the air"
            className="w-full h-full object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-green-50/80 to-blue-50/80" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center justify-center space-x-2 mb-3 md:mb-4">
            <GraduationCap className="w-6 h-6 md:w-8 md:h-8 text-book-600" />
            <h2 className="text-xl md:text-3xl font-bold text-gray-900">
              <span className="hidden md:inline">
                Bursary & Financial Aid Explorer
              </span>
              <span className="md:hidden">Find Bursaries</span>
            </h2>
          </div>
          <p className="text-sm md:text-lg text-gray-700 max-w-3xl mx-auto px-2">
            <span className="hidden md:inline">
              Discover funding opportunities for your higher education journey.
              Find bursaries, scholarships, and financial aid programs that
              match your profile and field of study.
            </span>
            <span className="md:hidden">
              Find bursaries and scholarships for your studies. Search by field
              or provider.
            </span>
          </p>
        </div>
      </div>

      {/* Filters - Mobile responsive */}
      <Card>
        <CardHeader className="pb-3 md:pb-6">
          <CardTitle className="flex items-center space-x-2 text-lg md:text-xl">
            <Filter className="w-4 h-4 md:w-5 md:h-5" />
            <span className="hidden md:inline">Filter Bursaries</span>
            <span className="md:hidden">Filter</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 md:space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search bursaries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 text-sm md:text-base py-2 md:py-3"
            />
          </div>

          {/* Filter Row - Mobile stacked */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4">
            <Select value={selectedField} onValueChange={setSelectedField}>
              <SelectTrigger className="text-sm md:text-base">
                <SelectValue placeholder="Field of Study" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Fields</SelectItem>
                {BURSARY_FIELDS_OF_STUDY.filter(
                  (field) => field !== "All fields",
                ).map((field) => (
                  <SelectItem key={field} value={field}>
                    {field}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedProvince}
              onValueChange={setSelectedProvince}
            >
              <SelectTrigger className="text-sm md:text-base">
                <SelectValue placeholder="Province" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Provinces</SelectItem>
                {PROVINCES.filter(
                  (province) => province !== "All provinces",
                ).map((province) => (
                  <SelectItem key={province} value={province}>
                    {province}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center space-x-2 p-2 md:p-0 md:col-span-2">
              <input
                type="checkbox"
                id="financialNeed"
                checked={showFinancialNeedOnly}
                onChange={(e) => setShowFinancialNeedOnly(e.target.checked)}
                className="h-4 w-4 text-book-600 focus:ring-book-500 border-gray-300 rounded"
              />
              <label
                htmlFor="financialNeed"
                className="text-xs md:text-sm text-gray-700"
              >
                <span className="hidden md:inline">
                  Financial need based only
                </span>
                <span className="md:hidden">Financial need only</span>
              </label>
            </div>
          </div>

          {/* Clear filters button */}
          {(searchQuery ||
            selectedField !== "all" ||
            selectedProvince !== "all" ||
            showFinancialNeedOnly) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setSelectedField("all");
                setSelectedProvince("all");
                setShowFinancialNeedOnly(false);
              }}
              className="text-xs md:text-sm"
            >
              Clear Filters
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-book-50 rounded-lg p-3 md:p-4">
        <div className="flex items-center space-x-2 mb-2 sm:mb-0">
          <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
          <span className="text-sm md:text-base font-medium text-gray-900">
            {filteredBursaries.length} bursaries found
          </span>
        </div>
        {filteredBursaries.length > 0 && (
          <Badge
            variant="secondary"
            className="bg-book-100 text-book-700 text-xs md:text-sm w-fit"
          >
            {Math.round(
              (filteredBursaries.filter((b) => b.requirements.financialNeed)
                .length /
                filteredBursaries.length) *
                100,
            )}
            % need-based
          </Badge>
        )}
      </div>

      {/* Bursaries List - Mobile optimized cards */}
      <div className="space-y-4 md:space-y-6">
        {filteredBursaries.length === 0 ? (
          <Card className="p-6 md:p-8 text-center">
            <div className="flex flex-col items-center space-y-3 md:space-y-4">
              <Search className="w-12 h-12 md:w-16 md:h-16 text-gray-300" />
              <h3 className="text-lg md:text-xl font-semibold text-gray-900">
                No bursaries found
              </h3>
              <p className="text-sm md:text-base text-gray-600 max-w-md">
                Try adjusting your search criteria or filters to find bursaries
                that match your profile.
              </p>
            </div>
          </Card>
        ) : (
          filteredBursaries.map((bursary) => {
            const isExpanded = expandedBursary === bursary.id;
            const urgency = getDeadlineUrgency(bursary.applicationDeadline);
            const fundingLevel = getFundingLevel(bursary.amount);

            return (
              <Card
                key={bursary.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader className="pb-3 md:pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-2 sm:space-y-0">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <CardTitle className="text-lg md:text-xl font-bold text-gray-900">
                          {bursary.name}
                        </CardTitle>
                        <Badge
                          className={`text-xs ${getBursaryTypeColor(bursary)}`}
                        >
                          {bursary.id === "nsfas"
                            ? "NSFAS"
                            : bursary.provider.includes("Government")
                              ? "Government"
                              : "Private"}
                        </Badge>
                      </div>
                      <CardDescription className="text-sm md:text-base">
                        {bursary.provider}
                      </CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge className={`text-xs ${getDeadlineColor(urgency)}`}>
                        {urgency}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {fundingLevel}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 md:space-y-4">
                  <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                    {bursary.description}
                  </p>

                  {/* Key Info Grid - Mobile stacked */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <div>
                        <div className="text-xs md:text-sm text-gray-500">
                          Amount
                        </div>
                        <div className="text-xs md:text-sm font-medium text-gray-900 line-clamp-2">
                          {bursary.amount}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <div>
                        <div className="text-xs md:text-sm text-gray-500">
                          Deadline
                        </div>
                        <div className="text-xs md:text-sm font-medium text-gray-900">
                          {bursary.applicationDeadline}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <GraduationCap className="w-4 h-4 text-purple-600 flex-shrink-0" />
                      <div>
                        <div className="text-xs md:text-sm text-gray-500">
                          Fields
                        </div>
                        <div className="text-xs md:text-sm font-medium text-gray-900">
                          {bursary.fieldsOfStudy.slice(0, 2).join(", ")}
                          {bursary.fieldsOfStudy.length > 2 && "..."}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expand/Collapse Button */}
                  <div className="flex justify-between items-center pt-2 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpanded(bursary.id)}
                      className="text-book-600 hover:text-book-700 text-sm md:text-base"
                    >
                      {isExpanded ? (
                        <>
                          <span>Less Details</span>
                          <ChevronUp className="w-4 h-4 ml-1" />
                        </>
                      ) : (
                        <>
                          <span>More Details</span>
                          <ChevronDown className="w-4 h-4 ml-1" />
                        </>
                      )}
                    </Button>

                    <Button
                      size="sm"
                      className="bg-book-600 hover:bg-book-700 text-white text-xs md:text-sm"
                      onClick={() => window.open(bursary.website, "_blank")}
                    >
                      Apply Now
                      <ExternalLink className="w-3 h-3 md:w-4 md:h-4 ml-1" />
                    </Button>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="space-y-3 md:space-y-4 pt-3 md:pt-4 border-t">
                      {/* Eligibility Criteria */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2 text-sm md:text-base flex items-center">
                          <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                          Eligibility Criteria
                        </h4>
                        <ul className="space-y-1">
                          {bursary.eligibilityCriteria.map(
                            (criteria, index) => (
                              <li
                                key={index}
                                className="text-xs md:text-sm text-gray-600 flex items-start"
                              >
                                <span className="w-1.5 h-1.5 bg-book-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                {criteria}
                              </li>
                            ),
                          )}
                        </ul>
                      </div>

                      {/* Application Process */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2 text-sm md:text-base flex items-center">
                          <FileText className="w-4 h-4 mr-2 text-blue-600" />
                          Application Process
                        </h4>
                        <p className="text-xs md:text-sm text-gray-600">
                          {bursary.applicationProcess}
                        </p>
                      </div>

                      {/* Contact Information */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2 text-sm md:text-base flex items-center">
                          <Phone className="w-4 h-4 mr-2 text-purple-600" />
                          Contact Information
                        </h4>
                        <p className="text-xs md:text-sm text-gray-600">
                          {bursary.contactInfo}
                        </p>
                      </div>

                      {/* Fields of Study */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2 text-sm md:text-base">
                          Fields of Study
                        </h4>
                        <div className="flex flex-wrap gap-1 md:gap-2">
                          {bursary.fieldsOfStudy.map((field, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs"
                            >
                              {field}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Provinces */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2 text-sm md:text-base flex items-center">
                          <MapPin className="w-4 h-4 mr-2 text-red-600" />
                          Available Provinces
                        </h4>
                        <div className="flex flex-wrap gap-1 md:gap-2">
                          {bursary.provinces.map((province, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="text-xs"
                            >
                              {province}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Help Section */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="text-sm md:text-base">
          <strong>Need help with applications?</strong> Contact your school's
          guidance counselor or university's financial aid office for assistance
          with bursary applications and requirements.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default BursaryExplorerSection;

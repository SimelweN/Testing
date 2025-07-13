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
  Search,
  ExternalLink,
  Calendar,
  DollarSign,
  Users,
  MapPin,
  Info,
  CheckCircle,
  AlertCircle,
  Award,
  TrendingUp,
  Star,
  Clock,
  Phone,
  Mail,
  BookOpen,
} from "lucide-react";
import {
  BURSARIES,
  BURSARY_FIELDS_OF_STUDY,
} from "@/constants/enhancedBursaries";
import { PROVINCES } from "@/constants/bursaries";
import { BursaryFilters } from "@/types/university";

const BursaryExplorer = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<BursaryFilters>({});
  const [expandedBursary, setExpandedBursary] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filteredBursaries = useMemo(() => {
    return BURSARIES.filter((bursary) => {
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

      // Household income filter
      const matchesHouseholdIncome =
        !filters.maxHouseholdIncome ||
        (bursary.requirements.maxHouseholdIncome !== undefined &&
          bursary.requirements.maxHouseholdIncome >=
            filters.maxHouseholdIncome);

      // Academic performance filter
      const matchesAcademicPerformance =
        !filters.minMarks ||
        (bursary.requirements.minMarks !== undefined &&
          bursary.requirements.minMarks <= filters.minMarks);

      return (
        matchesSearch &&
        matchesField &&
        matchesProvince &&
        matchesFinancialNeed &&
        matchesHouseholdIncome &&
        matchesAcademicPerformance
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
      return {
        status: "closed",
        message: "Applications Closed",
        color: "red",
        icon: AlertCircle,
      };
    } else if (daysDiff <= 30) {
      return {
        status: "closing",
        message: `${daysDiff} days left`,
        color: "orange",
        icon: Clock,
      };
    } else {
      return {
        status: "open",
        message: "Applications Open",
        color: "green",
        icon: CheckCircle,
      };
    }
  };

  const featuredBursaries = BURSARIES.slice(0, 3);

  return (
    <section id="bursaries" className="py-0">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-4xl mx-auto mb-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <DollarSign className="h-8 w-8 text-gray-700" />
          </div>
          <h2 className="text-4xl font-bold mb-6 text-gray-900">
            Find Bursaries & Scholarships
          </h2>
          <p className="text-xl text-gray-600 leading-relaxed mb-8">
            Discover comprehensive bursary and scholarship opportunities from
            government, corporate sponsors, and educational institutions across
            South Africa.
          </p>

          {/* Quick Stats */}
          <div className="flex items-center justify-center gap-8 text-sm text-gray-500 mb-12">
            <span>{BURSARIES.length} Bursaries</span>
            <span>•</span>
            <span>R1M+ Total Funding</span>
            <span>•</span>
            <span>All Fields of Study</span>
            <span>•</span>
            <span>9 Provinces</span>
          </div>
        </div>

        {/* Featured Bursaries */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Featured Opportunities
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredBursaries.map((bursary) => {
              const applicationStatus = getApplicationStatus(
                bursary.applicationDeadline,
              );
              const StatusIcon = applicationStatus.icon;

              return (
                <Card
                  key={bursary.id}
                  className="group hover:shadow-2xl transition-all duration-300 bg-white/80 backdrop-blur-sm border-0 hover:-translate-y-2"
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-bold text-gray-900 group-hover:text-yellow-600 transition-colors">
                          {bursary.name}
                        </CardTitle>
                        <CardDescription className="text-gray-600 font-medium mt-1">
                          {bursary.provider}
                        </CardDescription>
                      </div>
                      <Badge
                        variant={
                          applicationStatus.status === "open"
                            ? "default"
                            : applicationStatus.status === "closing"
                              ? "destructive"
                              : "secondary"
                        }
                        className="ml-2"
                      >
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {applicationStatus.message}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 text-lg font-semibold text-green-600 mt-2">
                      <DollarSign className="h-5 w-5" />
                      {bursary.amount.length > 50
                        ? bursary.amount.substring(0, 50) + "..."
                        : bursary.amount}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {bursary.description}
                    </p>

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
                        <span className="text-gray-600">Coverage:</span>
                        <span className="font-medium">
                          {bursary.provinces.includes("All provinces")
                            ? "National"
                            : `${bursary.provinces.length} provinces`}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {bursary.fieldsOfStudy.slice(0, 2).map((field, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-xs"
                        >
                          {field}
                        </Badge>
                      ))}
                      {bursary.fieldsOfStudy.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{bursary.fieldsOfStudy.length - 2} more
                        </Badge>
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setExpandedBursary(
                          expandedBursary === bursary.id ? null : bursary.id,
                        )
                      }
                      className="w-full group-hover:border-book-300 group-hover:bg-book-50"
                    >
                      {expandedBursary === bursary.id
                        ? "Show Less"
                        : "View Full Details"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Search and Filter Section */}
        <Card className="mb-8 bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Search className="h-5 w-5 text-book-600" />
              Find Your Perfect Bursary
            </CardTitle>
            <CardDescription>
              Use the advanced filters below to find bursaries that match your
              profile and needs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search bursaries by name, provider, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-gray-200 focus:border-book-400 focus:ring-book-200"
              />
            </div>

            {/* Filter Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
              <Select
                value={filters.fieldOfStudy || "all"}
                onValueChange={(value) =>
                  updateFilter(
                    "fieldOfStudy",
                    value === "all" ? undefined : value,
                  )
                }
              >
                <SelectTrigger className="border-gray-200 focus:border-yellow-400">
                  <SelectValue placeholder="Field of study" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="all-fields" value="all">
                    All fields
                  </SelectItem>
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
                  updateFilter("province", value === "all" ? undefined : value)
                }
              >
                <SelectTrigger className="border-gray-200 focus:border-yellow-400">
                  <SelectValue placeholder="Province" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="all-provinces" value="all">
                    All provinces
                  </SelectItem>
                  {PROVINCES.map((province) => (
                    <SelectItem key={province} value={province}>
                      {province}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="financial-need"
                  checked={filters.financialNeed === true}
                  onCheckedChange={(checked) =>
                    updateFilter("financialNeed", checked ? true : undefined)
                  }
                />
                <label htmlFor="financial-need" className="text-sm font-medium">
                  Financial need based
                </label>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">
                  Max. Household Income (R)
                </label>
                <Input
                  type="number"
                  placeholder="e.g. 350000"
                  min="0"
                  value={filters.maxHouseholdIncome || ""}
                  onChange={(e) =>
                    updateFilter(
                      "maxHouseholdIncome",
                      e.target.value ? parseInt(e.target.value) : undefined,
                    )
                  }
                  className="border-gray-200 focus:border-yellow-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">
                  Your Average Marks (%)
                </label>
                <Input
                  type="number"
                  placeholder="e.g. 75"
                  min="0"
                  max="100"
                  value={filters.minMarks || ""}
                  onChange={(e) =>
                    updateFilter(
                      "minMarks",
                      e.target.value ? parseInt(e.target.value) : undefined,
                    )
                  }
                  className="border-gray-200 focus:border-yellow-400"
                />
              </div>

              <Select
                value={viewMode}
                onValueChange={(value: "grid" | "list") => setViewMode(value)}
              >
                <SelectTrigger className="border-gray-200 focus:border-yellow-400">
                  <SelectValue placeholder="View mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="view-grid" value="grid">
                    Grid View
                  </SelectItem>
                  <SelectItem key="view-list" value="list">
                    List View
                  </SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={clearFilters}
                className="w-full border-gray-300 hover:border-yellow-400"
              >
                Clear Filters
              </Button>
            </div>

            {/* Active Filters */}
            {(filters.fieldOfStudy ||
              filters.province ||
              filters.financialNeed ||
              filters.maxHouseholdIncome ||
              filters.minMarks ||
              searchTerm) && (
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-gray-600">Active filters:</span>
                {filters.fieldOfStudy && (
                  <Badge variant="secondary">
                    Field: {filters.fieldOfStudy}
                  </Badge>
                )}
                {filters.province && (
                  <Badge variant="secondary">
                    Province: {filters.province}
                  </Badge>
                )}
                {filters.financialNeed && (
                  <Badge variant="secondary">Financial Need Required</Badge>
                )}
                {searchTerm && (
                  <Badge variant="secondary">Search: "{searchTerm}"</Badge>
                )}
              </div>
            )}

            {/* Results Count */}
            <div className="text-sm text-gray-600 border-t pt-4">
              Showing {filteredBursaries.length} of {BURSARIES.length} bursaries
            </div>
          </CardContent>
        </Card>

        {/* Bursary Grid/List */}
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 lg:grid-cols-2 gap-6"
              : "space-y-6"
          }
        >
          {filteredBursaries.map((bursary) => {
            const applicationStatus = getApplicationStatus(
              bursary.applicationDeadline,
            );
            const isExpanded = expandedBursary === bursary.id;
            const StatusIcon = applicationStatus.icon;

            return (
              <Card
                key={bursary.id}
                className="hover:shadow-xl transition-all duration-300 bg-white/60 backdrop-blur-sm border-0"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-gray-800 hover:text-yellow-600 transition-colors">
                        {bursary.name}
                      </CardTitle>
                      <CardDescription className="text-gray-600 font-medium mt-1">
                        {bursary.provider}
                      </CardDescription>
                    </div>
                    <Badge
                      variant={
                        applicationStatus.status === "open"
                          ? "default"
                          : applicationStatus.status === "closing"
                            ? "destructive"
                            : "secondary"
                      }
                      className="ml-2"
                    >
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {applicationStatus.message}
                    </Badge>
                  </div>

                  {/* Amount */}
                  <div className="flex items-center gap-2 text-lg font-semibold text-green-600 mt-2">
                    <DollarSign className="h-5 w-5" />
                    {bursary.amount}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600">{bursary.description}</p>

                  {/* Key Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm bg-white/50 rounded-lg p-3">
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
                          className="text-xs bg-yellow-100 text-yellow-800 border-yellow-300"
                        >
                          {field}
                        </Badge>
                      ))}
                      {bursary.fieldsOfStudy.length > 3 && (
                        <Badge
                          variant="outline"
                          className="text-xs border-yellow-300 text-yellow-700"
                        >
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
                    className="w-full border-yellow-200 hover:bg-yellow-50 hover:border-yellow-300"
                  >
                    {isExpanded
                      ? "Show Less Details"
                      : "View Full Details & Apply"}
                  </Button>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="space-y-4 pt-4 border-t border-gray-100">
                      {/* Eligibility Criteria */}
                      <div>
                        <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Eligibility Criteria:
                        </h4>
                        <ul className="space-y-1">
                          {bursary.eligibilityCriteria.map(
                            (criteria, index) => (
                              <li
                                key={index}
                                className="text-sm text-gray-600 flex items-start gap-2"
                              >
                                <span className="text-green-600 mt-1">•</span>
                                {criteria}
                              </li>
                            ),
                          )}
                        </ul>
                      </div>

                      {/* Application Process */}
                      <div>
                        <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-blue-600" />
                          Application Process:
                        </h4>
                        <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                          {bursary.applicationProcess}
                        </p>
                      </div>

                      {/* Contact Information */}
                      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg border border-yellow-200">
                        <h4 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          Contact Information:
                        </h4>
                        <p className="text-sm text-yellow-700 mb-2">
                          {bursary.contactInfo}
                        </p>
                        {bursary.website && (
                          <a
                            href={bursary.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-yellow-600 hover:text-yellow-800 font-medium"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Visit Official Website & Apply
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

        {filteredBursaries.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-gray-400" />
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
        <Alert className="mt-12 border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Important Reminder:</strong> Application deadlines and
            requirements can change. Always verify information directly with the
            bursary provider before applying. Start your applications early and
            prepare all required documents in advance.
          </AlertDescription>
        </Alert>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <Card className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white border-0">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4">
                Ready to Secure Your Future?
              </h3>
              <p className="text-yellow-100 mb-6 max-w-2xl mx-auto">
                Don't let financial constraints hold you back. Apply for
                multiple bursaries to maximize your chances of getting funding
                for your studies.
              </p>
              <Button
                size="lg"
                onClick={() =>
                  document
                    .getElementById("campus-books")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="bg-white text-yellow-600 hover:bg-gray-100 font-semibold"
              >
                <BookOpen className="h-5 w-5 mr-2" />
                Find Affordable Textbooks
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default BursaryExplorer;

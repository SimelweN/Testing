import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import {
  Search,
  MapPin,
  Users,
  BookOpen,
  ExternalLink,
  GraduationCap,
  ArrowRight,
  Star,
  TrendingUp,
  Filter,
  ChevronDown,
} from "lucide-react";
import { SOUTH_AFRICAN_UNIVERSITIES } from "@/constants/universities";
import { University } from "@/types/university";
import PopularUniversities from "./PopularUniversities";
import UniversityHero from "./UniversityHero";
import UniversityStats from "./UniversityStats";

interface UniversityExplorerProps {
  onUniversitySelect: (university: University) => void;
  onViewBooks: (universityId: string) => void;
}

const UniversityExplorer = ({
  onUniversitySelect,
  onViewBooks,
}: UniversityExplorerProps) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlSearchQuery = searchParams.get("search") || "";

  const [searchTerm, setSearchTerm] = useState(urlSearchQuery);
  const [selectedProvince, setSelectedProvince] = useState<string>("all");
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(
    Boolean(urlSearchQuery),
  );

  // Update search term when URL search parameter changes
  useEffect(() => {
    setSearchTerm(urlSearchQuery);
    if (urlSearchQuery) {
      setShowAdvancedSearch(true);
    }
  }, [urlSearchQuery]);

  const provinces = [
    "Eastern Cape",
    "Free State",
    "Gauteng",
    "KwaZulu-Natal",
    "Limpopo",
    "Mpumalanga",
    "Northern Cape",
    "North West",
    "Western Cape",
  ];

  const filteredUniversities = useMemo(() => {
    return SOUTH_AFRICAN_UNIVERSITIES.filter((university) => {
      const matchesSearch =
        university.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        university.abbreviation
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        university.location.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesProvince =
        selectedProvince === "all" || university.province === selectedProvince;

      return matchesSearch && matchesProvince;
    });
  }, [searchTerm, selectedProvince]);

  const handleUniversitySelect = (university: University) => {
    document
      .getElementById("university-details")
      ?.scrollIntoView({ behavior: "smooth" });
    onUniversitySelect(university);
  };

  const handleSearch = (query: string) => {
    setSearchTerm(query);
  };

  // Check if we're in search mode (have active search or filters)
  const isSearchMode =
    searchTerm || selectedProvince !== "all" || showAdvancedSearch;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* SEARCH RESULTS FIRST - Show immediately when searching */}
      {isSearchMode && (
        <section className="py-8 bg-white border-b">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-6">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                  {searchTerm
                    ? `Search Results for "${searchTerm}"`
                    : "University Search"}
                </h1>
                <p className="text-lg text-gray-600">
                  {filteredUniversities.length} universities match your criteria
                </p>
              </div>

              {/* Advanced Filters */}
              <Card className="mb-6">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Filter className="h-5 w-5" />
                      Search & Filters
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                    >
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${showAdvancedSearch ? "rotate-180" : ""}`}
                      />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Search Input */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Search Universities
                      </label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          placeholder="University name or location..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    {/* Province Filter */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Province
                      </label>
                      <Select
                        value={selectedProvince}
                        onValueChange={setSelectedProvince}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All Provinces" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem key="all-provinces" value="all">
                            All Provinces
                          </SelectItem>
                          {provinces.map((province) => (
                            <SelectItem key={province} value={province}>
                              {province}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Clear Filters */}
                  {(searchTerm || selectedProvince !== "all") && (
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSearchTerm("");
                          setSelectedProvince("all");
                        }}
                      >
                        Clear All Filters
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Search Results Grid */}
              {filteredUniversities.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredUniversities.map((university) => (
                    <Card
                      key={university.id}
                      className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-book-300 border-2 border-transparent hover:scale-[1.02]"
                      onClick={() => handleUniversitySelect(university)}
                    >
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 rounded-lg bg-white border border-gray-200 p-2 flex items-center justify-center">
                              <img
                                src={
                                  university.logo ||
                                  "/university-logos/default.svg"
                                }
                                alt={`${university.name} logo`}
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  if (!target.src.includes("default.svg")) {
                                    target.src =
                                      "/university-logos/default.svg";
                                  }
                                }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-lg text-gray-900 group-hover:text-book-600 transition-colors leading-tight">
                                {university.name}
                              </h3>
                              <p className="text-sm text-gray-500 font-medium">
                                {university.abbreviation}
                              </p>
                            </div>
                          </div>
                          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-book-600 transition-colors" />
                        </div>

                        <div className="flex items-center space-x-2 mt-3">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {university.location}
                          </span>
                          <Badge
                            variant="secondary"
                            className="bg-book-50 text-book-700 text-xs"
                          >
                            {university.province}
                          </Badge>
                        </div>
                      </CardHeader>

                      <CardContent className="pt-0">
                        <p className="text-sm text-gray-600 leading-relaxed mb-4 line-clamp-3">
                          {university.overview}
                        </p>

                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-xs border-book-200 text-book-600 hover:bg-book-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUniversitySelect(university);
                            }}
                          >
                            Learn More
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-xs border-book-200 text-book-600 hover:bg-book-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewBooks(university.id);
                            }}
                          >
                            Books
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                /* No Results */
                <div className="text-center py-12">
                  <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No universities found
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Try adjusting your search criteria to find what you're
                    looking for.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedProvince("all");
                    }}
                    className="border-book-200 text-book-600 hover:bg-book-50"
                  >
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* HERO SECTION - Only show when NOT in search mode */}
      {!isSearchMode && (
        <>
          {/* Hero Section */}
          <UniversityHero onSearch={handleSearch} />

          {/* Popular Universities Section */}
          <div className="bg-white">
            <PopularUniversities
              onUniversitySelect={handleUniversitySelect}
              showViewAll={true}
            />
          </div>
        </>
      )}

      {/* Browse by Region Section - Only show when NOT searching */}
      {!searchTerm && selectedProvince === "all" && !isSearchMode && (
        <section className="py-16 bg-book-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Browse by Region
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Explore universities by province to find institutions in your
                preferred location
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {provinces.map((province) => {
                const provinceUniversities = SOUTH_AFRICAN_UNIVERSITIES.filter(
                  (uni) => uni.province === province,
                );

                return (
                  <Card
                    key={province}
                    className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-book-300 border-2 border-transparent hover:scale-105"
                    onClick={() => setSelectedProvince(province)}
                  >
                    <CardContent className="p-6 text-center">
                      <MapPin className="w-8 h-8 text-book-600 mx-auto mb-3" />
                      <h3 className="font-bold text-lg text-gray-900 mb-2">
                        {province}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {provinceUniversities.length}{" "}
                        {provinceUniversities.length === 1
                          ? "university"
                          : "universities"}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default UniversityExplorer;

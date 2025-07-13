import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  MapPin,
  Users,
  Calendar,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SOUTH_AFRICAN_UNIVERSITIES } from "@/constants/universities";

interface UniversityGridProps {
  searchQuery?: string;
  onUniversitySelect?: (universityId: string) => void;
}

const UniversityGrid = ({
  searchQuery: externalSearchQuery,
  onUniversitySelect,
}: UniversityGridProps) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState(externalSearchQuery || "");
  const [selectedProvince, setSelectedProvince] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");

  const provinces = [
    "all",
    ...Array.from(
      new Set(SOUTH_AFRICAN_UNIVERSITIES.map((uni) => uni.province)),
    ),
  ];

  const filteredUniversities = useMemo(() => {
    return SOUTH_AFRICAN_UNIVERSITIES.filter((university) => {
      const matchesSearch =
        !searchQuery ||
        university.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        university.abbreviation
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        university.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        university.province.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesProvince =
        selectedProvince === "all" || university.province === selectedProvince;

      // For type filtering, we'll use simple classification
      const isTraditional = [
        "uct",
        "wits",
        "stellenbosch",
        "up",
        "ukzn",
        "rhodes",
        "uwc",
        "uj",
        "nmu",
        "unisa",
        "nwu",
        "ufs",
      ].includes(university.id);
      const matchesType =
        selectedType === "all" ||
        (selectedType === "traditional" && isTraditional) ||
        (selectedType === "technology" && !isTraditional);

      return matchesSearch && matchesProvince && matchesType;
    });
  }, [searchQuery, selectedProvince, selectedType]);

  const handleUniversityClick = (universityId: string) => {
    if (onUniversitySelect) {
      onUniversitySelect(universityId);
    } else {
      navigate(`/university/${universityId}`);
    }
  };

  const getUniversityStats = (universityId: string) => {
    const stats = {
      students: "25,000+",
      established: "1959",
      faculties: 6,
    };

    // Set specific stats for major universities
    switch (universityId) {
      case "uct":
        return { students: "29,000+", established: "1829", faculties: 6 };
      case "wits":
        return { students: "40,000+", established: "1922", faculties: 5 };
      case "stellenbosch":
        return { students: "32,000+", established: "1918", faculties: 10 };
      case "up":
        return { students: "53,000+", established: "1908", faculties: 9 };
      case "ukzn":
        return { students: "47,000+", established: "2004", faculties: 4 };
      case "rhodes":
        return { students: "8,200+", established: "1904", faculties: 6 };
      case "uwc":
        return { students: "20,000+", established: "1960", faculties: 7 };
      case "uj":
        return { students: "50,000+", established: "2005", faculties: 9 };
      case "nmu":
        return { students: "27,000+", established: "2005", faculties: 8 };
      case "unisa":
        return { students: "400,000+", established: "1873", faculties: 8 };
      default:
        return stats;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-gray-900">
          Explore South African Universities
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Discover detailed information about universities across South Africa.
          Find the perfect institution for your academic journey.
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by university name, location, or abbreviation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Province Filter */}
            <Select
              value={selectedProvince}
              onValueChange={setSelectedProvince}
            >
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All Provinces" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="all-provinces" value="all">
                  All Provinces
                </SelectItem>
                {provinces.slice(1).map((province) => (
                  <SelectItem key={province} value={province}>
                    {province}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Type Filter */}
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="all-types" value="all">
                  All Types
                </SelectItem>
                <SelectItem key="traditional" value="traditional">
                  Traditional Universities
                </SelectItem>
                <SelectItem key="technology" value="technology">
                  Universities of Technology
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600">
          Showing {filteredUniversities.length} of{" "}
          {SOUTH_AFRICAN_UNIVERSITIES.length} universities
        </p>
      </div>

      {/* University Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUniversities.map((university) => {
          const stats = getUniversityStats(university.id);

          return (
            <Card
              key={university.id}
              className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-book-300 border-2 border-transparent hover:scale-[1.02]"
              onClick={() => handleUniversityClick(university.id)}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-lg bg-white border border-gray-200 p-2 flex items-center justify-center">
                      <img
                        src={university.logo || "/university-logos/default.svg"}
                        alt={`${university.name} logo`}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (!target.src.includes("default.svg")) {
                            target.src = "/university-logos/default.svg";
                          } else {
                            // Show fallback text if even default fails
                            target.style.display = "none";
                            const fallback =
                              target.parentElement?.querySelector(
                                ".logo-fallback",
                              );
                            if (fallback) {
                              (fallback as HTMLElement).style.display = "flex";
                            }
                          }
                        }}
                      />
                      <div
                        className="logo-fallback w-full h-full bg-book-100 rounded flex items-center justify-center"
                        style={{ display: "none" }}
                      >
                        <span className="text-book-600 font-bold text-sm">
                          {university.abbreviation}
                        </span>
                      </div>
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
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-book-600 transition-colors flex-shrink-0" />
                </div>

                <div className="flex items-center space-x-2 mt-3">
                  <MapPin className="w-4 h-4 text-gray-400" />

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

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center bg-gray-50 rounded-lg p-2">
                    <Users className="w-4 h-4 text-book-600 mx-auto mb-1" />
                    <div className="text-xs font-semibold text-book-600">
                      {stats.students}
                    </div>
                    <div className="text-xs text-gray-500">Students</div>
                  </div>
                  <div className="text-center bg-gray-50 rounded-lg p-2">
                    <Calendar className="w-4 h-4 text-book-600 mx-auto mb-1" />
                    <div className="text-xs font-semibold text-book-600">
                      {stats.established}
                    </div>
                    <div className="text-xs text-gray-500">Est.</div>
                  </div>
                  <div className="text-center bg-gray-50 rounded-lg p-2">
                    <ExternalLink className="w-4 h-4 text-book-600 mx-auto mb-1" />
                    <div className="text-xs font-semibold text-book-600">
                      {stats.faculties}
                    </div>
                    <div className="text-xs text-gray-500">Faculties</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs border-book-200 text-book-600 hover:bg-book-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUniversityClick(university.id);
                    }}
                  >
                    View Profile
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs border-book-200 text-book-600 hover:bg-book-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/books?university=${university.id}`);
                    }}
                  >
                    View Books
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* No Results */}
      {filteredUniversities.length === 0 && (
        <div className="text-center py-12">
          <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No universities found
          </h3>
          <p className="text-gray-600 mb-4">
            Try adjusting your search criteria or filters to find what you're
            looking for.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setSearchQuery("");
              setSelectedProvince("all");
              setSelectedType("all");
            }}
            className="border-book-200 text-book-600 hover:bg-book-50"
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
};

export default UniversityGrid;

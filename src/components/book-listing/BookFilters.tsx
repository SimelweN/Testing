import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Filter, Search, School, GraduationCap, BookOpen } from "lucide-react";
import { UniversitySelector } from "@/components/ui/university-selector";
import { UNIVERSITY_YEARS } from "@/constants/universities";

interface BookFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  selectedCondition: string;
  setSelectedCondition: (condition: string) => void;
  selectedGrade: string;
  setSelectedGrade: (grade: string) => void;
  selectedUniversityYear: string;
  setSelectedUniversityYear: (year: string) => void;
  selectedUniversity: string;
  setSelectedUniversity: (university: string) => void;
  priceRange: [number, number];
  setPriceRange: (range: [number, number]) => void;
  bookType: "all" | "school" | "university";
  setBookType: (type: "all" | "school" | "university") => void;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  onSearch: (e: React.FormEvent) => void;
  onUpdateFilters: () => void;
  onClearFilters: () => void;
}

const BookFilters = ({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  selectedCondition,
  setSelectedCondition,
  selectedGrade,
  setSelectedGrade,
  selectedUniversityYear,
  setSelectedUniversityYear,
  selectedUniversity,
  setSelectedUniversity,
  priceRange,
  setPriceRange,
  bookType,
  setBookType,
  showFilters,
  setShowFilters,
  onSearch,
  onUpdateFilters,
  onClearFilters,
}: BookFiltersProps) => {
  const categories = [
    "Computer Science",
    "Mathematics",
    "Biology",
    "Chemistry",
    "Physics",
    "Economics",
    "Psychology",
  ];
  const conditions = ["New", "Good", "Better", "Average", "Below Average"];
  const grades = [
    "Grade 1",
    "Grade 2",
    "Grade 3",
    "Grade 4",
    "Grade 5",
    "Grade 6",
    "Grade 7",
    "Grade 8",
    "Grade 9",
    "Grade 10",
    "Grade 11",
    "Grade 12",
  ];

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category === selectedCategory ? "" : category);
  };

  const handleConditionChange = (condition: string) => {
    setSelectedCondition(condition === selectedCondition ? "" : condition);
  };

  const handleGradeChange = (grade: string) => {
    setSelectedGrade(grade === selectedGrade ? "" : grade);
    if (grade && grade !== selectedGrade) {
      setSelectedUniversityYear("");
      setBookType("school");
    }
  };

  const handleUniversityYearChange = (year: string) => {
    setSelectedUniversityYear(year === selectedUniversityYear ? "" : year);
    if (year && year !== selectedUniversityYear) {
      setSelectedGrade("");
      setBookType("university");
    }
  };

  const handleUniversityChange = (university: string) => {
    setSelectedUniversity(university);
    if (university) {
      setSelectedGrade("");
      setBookType("university");
    }
  };

  const handleBookTypeChange = (type: "all" | "school" | "university") => {
    setBookType(type);
    if (type === "school") {
      setSelectedUniversityYear("");
      setSelectedUniversity("");
    } else if (type === "university") {
      setSelectedGrade("");
    }
  };

  return (
    <>
      {/* Mobile Toggle */}
      <div className="lg:hidden mb-4">
        <Button
          onClick={() => setShowFilters(!showFilters)}
          variant="outline"
          className="w-full flex items-center justify-center"
        >
          <Filter className="mr-2 h-4 w-4" />
          {showFilters ? "Hide Filters" : "Show Filters"}
        </Button>
      </div>

      {/* Filters Section */}
      <div className={`lg:w-1/4 ${showFilters ? "block" : "hidden"} lg:block`}>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-book-800">Filters</h2>
            <Button
              variant="link"
              onClick={onClearFilters}
              className="text-book-600 p-0 h-auto"
            >
              Clear All
            </Button>
          </div>

          {/* Search Filter */}
          <form onSubmit={onSearch} className="mb-6">
            <Label
              htmlFor="search"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Search
            </Label>
            <div className="relative">
              <Input
                id="search"
                placeholder="Search by title, author..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
              <button
                type="submit"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <Search className="h-4 w-4 text-gray-400" />
              </button>
            </div>
          </form>

          {/* Book Type Filter */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Book Type
            </h3>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={bookType === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => handleBookTypeChange("all")}
                className="flex items-center"
              >
                <BookOpen className="mr-1 h-4 w-4" />
                All
              </Button>
              <Button
                variant={bookType === "school" ? "default" : "outline"}
                size="sm"
                onClick={() => handleBookTypeChange("school")}
                className="flex items-center"
              >
                <School className="mr-1 h-4 w-4" />
                School
              </Button>
              <Button
                variant={bookType === "university" ? "default" : "outline"}
                size="sm"
                onClick={() => handleBookTypeChange("university")}
                className="flex items-center"
              >
                <GraduationCap className="mr-1 h-4 w-4" />
                University
              </Button>
            </div>
          </div>

          {/* Grade Filter */}
          {(bookType === "school" || bookType === "all") && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Grade</h3>
              <div className="grid grid-cols-2 gap-2">
                {grades.map((grade) => (
                  <div key={grade} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`grade-${grade}`}
                      checked={selectedGrade === grade}
                      onChange={() => handleGradeChange(grade)}
                      className="h-4 w-4 text-book-600 focus:ring-book-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor={`grade-${grade}`}
                      className="ml-2 text-sm text-gray-700"
                    >
                      {grade}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* University Selection */}
          {(bookType === "university" || bookType === "all") && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                University
              </h3>
              <UniversitySelector
                value={selectedUniversity}
                onValueChange={handleUniversityChange}
                placeholder="Select university..."
              />
            </div>
          )}

          {/* University Year Filter */}
          {(bookType === "university" || bookType === "all") && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                University Year
              </h3>
              <div className="space-y-2">
                {UNIVERSITY_YEARS.map((year) => (
                  <div key={year} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`year-${year}`}
                      checked={selectedUniversityYear === year}
                      onChange={() => handleUniversityYearChange(year)}
                      className="h-4 w-4 text-book-600 focus:ring-book-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor={`year-${year}`}
                      className="ml-2 text-sm text-gray-700"
                    >
                      {year}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Category Filter */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Categories
            </h3>
            <div className="space-y-2">
              {categories.map((category) => (
                <div key={category} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`category-${category}`}
                    checked={selectedCategory === category}
                    onChange={() => handleCategoryChange(category)}
                    className="h-4 w-4 text-book-600 focus:ring-book-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor={`category-${category}`}
                    className="ml-2 text-sm text-gray-700"
                  >
                    {category}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Condition Filter */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Condition
            </h3>
            <div className="space-y-2">
              {conditions.map((condition) => (
                <div key={condition} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`condition-${condition}`}
                    checked={selectedCondition === condition}
                    onChange={() => handleConditionChange(condition)}
                    className="h-4 w-4 text-book-600 focus:ring-book-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor={`condition-${condition}`}
                    className="ml-2 text-sm text-gray-700"
                  >
                    {condition}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Price Range
            </h3>
            <div className="mt-4">
              <Slider
                defaultValue={[0, 1000]}
                max={1000}
                step={10}
                value={priceRange}
                onValueChange={(value) =>
                  setPriceRange(value as [number, number])
                }
                className="mt-2"
              />
              <div className="flex justify-between mt-2 text-sm text-gray-500">
                <span>R{priceRange[0]}</span>
                <span>R{priceRange[1]}</span>
              </div>
            </div>
          </div>

          <Button
            onClick={onUpdateFilters}
            className="w-full bg-book-600 hover:bg-book-700"
          >
            Apply Filters
          </Button>
        </div>
      </div>
    </>
  );
};

export default BookFilters;

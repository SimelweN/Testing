import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, X } from "lucide-react";

interface StudyFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  selectedDifficulty: string;
  onDifficultyChange: (value: string) => void;
  selectedType: string;
  onTypeChange: (value: string) => void;
  onClearFilters: () => void;
  categories: string[];
  hasActiveFilters: boolean;
}

const StudyFilters = ({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedDifficulty,
  onDifficultyChange,
  selectedType,
  onTypeChange,
  onClearFilters,
  categories,
  hasActiveFilters,
}: StudyFiltersProps) => {
  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg border shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold">Filters</h3>
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-gray-500 hover:text-gray-700 min-h-[40px] px-3 text-sm"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline ml-1">Clear</span>
            <span className="sm:hidden sr-only">Clear filters</span>
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {/* Search Bar - Full Width on Mobile */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search resources..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-11"
          />
        </div>

        {/* Filter Selects - Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Select value={selectedCategory} onValueChange={onCategoryChange}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem key="all-categories" value="all">
                All Categories
              </SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedDifficulty} onValueChange={onDifficultyChange}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem key="all-levels" value="all">
                All Levels
              </SelectItem>
              <SelectItem key="beginner" value="Beginner">
                Beginner
              </SelectItem>
              <SelectItem key="intermediate" value="Intermediate">
                Intermediate
              </SelectItem>
              <SelectItem key="advanced" value="Advanced">
                Advanced
              </SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedType} onValueChange={onTypeChange}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem key="all-types" value="all">
                All Types
              </SelectItem>
              <SelectItem key="video" value="video">
                Videos
              </SelectItem>
              <SelectItem key="pdf" value="pdf">
                PDFs
              </SelectItem>
              <SelectItem key="website" value="website">
                Websites
              </SelectItem>
              <SelectItem key="tool" value="tool">
                Tools
              </SelectItem>
              <SelectItem key="course" value="course">
                Courses
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results Info - Mobile Friendly */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <span className="text-sm text-gray-500">Filtered results</span>
          {hasActiveFilters && (
            <span className="text-xs text-blue-600 font-medium">
              Filters active
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudyFilters;

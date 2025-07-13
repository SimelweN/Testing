import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { School, GraduationCap } from "lucide-react";
import { UNIVERSITY_YEARS } from "@/constants/universities";
import { BookFormData } from "@/types/book";

interface BookTypeSectionProps {
  bookType: "school" | "university";
  formData: BookFormData;
  errors: Record<string, string>;
  onBookTypeChange: (type: "school" | "university") => void;
  onSelectChange: (name: string, value: string) => void;
}

export const BookTypeSection = ({
  bookType,
  formData,
  errors,
  onBookTypeChange,
  onSelectChange,
}: BookTypeSectionProps) => {
  const categories = [
    "Computer Science",
    "Mathematics",
    "Biology",
    "Chemistry",
    "Physics",
    "Economics",
    "Psychology",
    "English",
    "History",
    "Geography",
    "Business Studies",
    "Accounting",
    "Life Sciences",
    "Physical Sciences",
    "Engineering",
    "Medicine",
    "Law",
    "Arts",
    "Languages",
    "Other",
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

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base font-medium">
          Book Type <span className="text-red-500">*</span>
        </Label>
        <RadioGroup
          value={bookType}
          onValueChange={(value) =>
            onBookTypeChange(value as "school" | "university")
          }
          className="flex gap-6 mt-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="school" id="school" />
            <Label
              htmlFor="school"
              className="flex items-center cursor-pointer"
            >
              <School className="mr-2 h-4 w-4" />
              School Book
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="university" id="university" />
            <Label
              htmlFor="university"
              className="flex items-center cursor-pointer"
            >
              <GraduationCap className="mr-2 h-4 w-4" />
              University Book
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div>
        <Label htmlFor="category" className="text-base font-medium">
          Category <span className="text-red-500">*</span>
        </Label>
        <Select
          value={formData.category}
          onValueChange={(value) => onSelectChange("category", value)}
        >
          <SelectTrigger className={errors.category ? "border-red-500" : ""}>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.category && (
          <p className="text-sm text-red-500 mt-1">{errors.category}</p>
        )}
      </div>

      <div>
        <Label htmlFor="condition" className="text-base font-medium">
          Condition <span className="text-red-500">*</span>
        </Label>
        <Select
          value={formData.condition}
          onValueChange={(value) => onSelectChange("condition", value)}
        >
          <SelectTrigger className={errors.condition ? "border-red-500" : ""}>
            <SelectValue placeholder="Select condition" />
          </SelectTrigger>
          <SelectContent>
            {conditions.map((condition) => (
              <SelectItem key={condition} value={condition}>
                {condition}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.condition && (
          <p className="text-sm text-red-500 mt-1">{errors.condition}</p>
        )}
      </div>

      {bookType === "school" ? (
        <div>
          <Label htmlFor="grade" className="text-base font-medium">
            Grade <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.grade}
            onValueChange={(value) => onSelectChange("grade", value)}
          >
            <SelectTrigger className={errors.grade ? "border-red-500" : ""}>
              <SelectValue placeholder="Select a grade" />
            </SelectTrigger>
            <SelectContent>
              {grades.map((grade) => (
                <SelectItem key={grade} value={grade}>
                  {grade}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.grade && (
            <p className="text-sm text-red-500 mt-1">{errors.grade}</p>
          )}
        </div>
      ) : (
        <>
          {/* University Year Selection - Optional */}
          <div>
            <Label htmlFor="universityYear" className="text-base font-medium">
              University Year <span className="text-gray-400">(Optional)</span>
            </Label>
            <Select
              value={formData.universityYear || ""}
              onValueChange={(value) => onSelectChange("universityYear", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select university year (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Not specified</SelectItem>
                {UNIVERSITY_YEARS.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}
    </div>
  );
};

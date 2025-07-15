export interface Subject {
  name: string;
  level: number;
  isRequired: boolean;
}

export interface Degree {
  id: string;
  name: string;
  code?: string; // Made optional with default generation
  faculty: string;
  duration: string;
  apsRequirement: number;
  description: string;
  subjects: Subject[];
  careerProspects: string[];
  universitySpecificAPS?: { [universityId: string]: number }; // University-specific APS requirements
  assignmentRule?: "all" | { exclude: string[] }; // Program assignment rule for debugging
}

export interface Faculty {
  id: string;
  name: string;
  description: string;
  degrees: Degree[];
}

export interface ApplicationInfo {
  isOpen: boolean;
  openingDate: string;
  closingDate: string;
  academicYear: string;
  applicationFee?: string;
  applicationMethod: string;
  lateApplications?: {
    available: boolean;
    deadline?: string;
    additionalFee?: string;
  };
}

export interface University {
  id: string;
  name: string;
  abbreviation: string;
  fullName: string;
  location: string;
  province: string;
  logo: string;
  overview: string;
  website: string;
  studentPortal?: string;
  admissionsContact?: string;
  faculties: Faculty[];
  applicationInfo?: ApplicationInfo;
  establishedYear?: number;
  studentPopulation?: number;
  campuses?: string[];
  type?: string;
  scoringSystem?:
    | "standard"
    | "uct-fps"
    | "wits-composite"
    | "stellenbosch-tpt"
    | "rhodes-average"
    | "unisa-custom";
}

// APS Calculator Types
export interface APSSubject {
  name: string;
  marks: number;
  level: number;
  points: number;
}

export interface EligibleDegree {
  degree: Degree;
  university: University;
  meetsRequirement: boolean;
  apsGap?: number;
}

export interface APSCalculation {
  subjects: APSSubject[];
  totalScore: number;
  eligibleDegrees: EligibleDegree[];
  universitySpecificScores?: UniversityAPSResult[];
}

export interface UniversityAPSResult {
  universityId: string;
  universityName: string;
  score: number;
  maxScore: number;
  explanation: string;
  methodology: string;
  isEligible?: boolean;
  programSpecificScore?: number;
}

// Bursary Types
export interface BursaryRequirements {
  academicRequirement: string;
  financialNeed: boolean;
  workCommitment?: boolean;
  citizenship?: string;
  age?: {
    min?: number;
    max?: number;
  };
}

export interface Bursary {
  id: string;
  name: string;
  provider: string;
  description: string;
  amount: string;
  eligibilityCriteria: string[];
  applicationDeadline: string;
  applicationProcess: string;
  contactInfo: string;
  website?: string;
  fieldsOfStudy: string[];
  provinces: string[];
  requirements: BursaryRequirements;
  isActive?: boolean;
  priority?: "high" | "medium" | "low";
  studyLevel?: string; // For high school bursaries: "grade-11,matric"
}

export interface BursaryFilters {
  searchTerm?: string;
  fieldOfStudy?: string;
  province?: string;
  financialNeed?: boolean;
  maxAmount?: number;
  deadline?: string;
  // Enhanced filtering options
  minMarks?: number; // Minimum academic marks/percentage
  maxHouseholdIncome?: number; // Maximum household income
  genderSpecific?: string; // "male" | "female" | "any"
  raceSpecific?: string; // "african" | "coloured" | "indian" | "white" | "any"
  studyLevel?: string; // "grade-11" | "matric" | "undergraduate" | "postgraduate" | "any"
  disabilitySupport?: boolean; // For students with disabilities
  ruralBackground?: boolean; // For students from rural areas
  firstGeneration?: boolean; // First-generation university students
}

// User-submitted Program Types
export interface UserSubmittedProgram {
  id?: string;
  universityId: string;
  universityName: string;
  facultyId: string;
  facultyName: string;
  programName: string;
  duration: string;
  apsRequirement: number;
  description: string;
  subjects: Subject[];
  careerProspects: string[];
  submittedBy: string;
  submittedAt: string;
  status: "pending" | "approved" | "rejected";
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

// Study Resources Types
export interface StudyTip {
  id: string;
  title: string;
  category: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  estimatedTime: string;
  effectiveness?: number;
  tags?: string[];
  content: string;
  author?: string;
  description?: string;
  isActive?: boolean;
  isSponsored?: boolean;
  sponsorName?: string;
  sponsorLogo?: string;
  sponsorUrl?: string;
  sponsorCta?: string;
}

export interface StudyResource {
  id: string;
  title: string;
  description: string;
  type: "pdf" | "video" | "website" | "tool" | "course";
  category: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  url: string;
  rating?: number;
  provider?: string;
  duration?: string;
  tags?: string[];
  downloadUrl?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  isSponsored?: boolean;
  sponsorName?: string;
  sponsorLogo?: string;
  sponsorUrl?: string;
  sponsorCta?: string;
}

export interface TimeTableEntry {
  id: string;
  subject: string;
  startTime: string;
  endTime: string;
  day: string;
  color: string;
  location?: string;
  notes?: string;
}

export interface StudyPlan {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  subjects: string[];
  goals: string[];
  schedule: TimeTableEntry[];
  userId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Type guards and utility functions
export const isDegreeValid = (degree: any): degree is Degree => {
  return (
    degree &&
    typeof degree.id === "string" &&
    typeof degree.name === "string" &&
    typeof degree.faculty === "string" &&
    typeof degree.duration === "string" &&
    typeof degree.apsRequirement === "number" &&
    typeof degree.description === "string" &&
    Array.isArray(degree.subjects) &&
    Array.isArray(degree.careerProspects)
  );
};

export const isFacultyValid = (faculty: any): faculty is Faculty => {
  return (
    faculty &&
    typeof faculty.id === "string" &&
    typeof faculty.name === "string" &&
    typeof faculty.description === "string" &&
    Array.isArray(faculty.degrees)
  );
};

export const isUniversityValid = (
  university: any,
): university is University => {
  return (
    university &&
    typeof university.id === "string" &&
    typeof university.name === "string" &&
    typeof university.abbreviation === "string" &&
    typeof university.fullName === "string" &&
    typeof university.location === "string" &&
    typeof university.province === "string" &&
    typeof university.logo === "string" &&
    typeof university.overview === "string" &&
    typeof university.website === "string" &&
    Array.isArray(university.faculties)
  );
};

export const isAPSSubjectValid = (subject: any): subject is APSSubject => {
  return (
    subject &&
    typeof subject.name === "string" &&
    typeof subject.marks === "number" &&
    typeof subject.level === "number" &&
    typeof subject.points === "number" &&
    subject.marks >= 0 &&
    subject.marks <= 100 &&
    subject.level >= 0 &&
    subject.level <= 7 &&
    subject.points >= 0 &&
    subject.points <= 7
  );
};

// Default values for missing properties
export const getDefaultDegreeCode = (degree: Degree): string => {
  if (degree.code) return degree.code;

  // Generate code from degree name
  const cleanName = degree.name
    .replace(/[^a-zA-Z0-9\s]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .toLowerCase();

  return cleanName.substring(0, 20); // Limit length
};

export const getDefaultFacultyDescription = (faculty: Faculty): string => {
  if (faculty.description) return faculty.description;

  return `Academic programs and courses offered by the ${faculty.name} faculty.`;
};

export const getDefaultUniversityOverview = (
  university: University,
): string => {
  if (university.overview) return university.overview;

  return `${university.fullName} is a South African university offering various academic programs and courses.`;
};

// Error handling types
export interface UniversityDataError {
  type: "university" | "faculty" | "degree" | "subject";
  message: string;
  data?: any;
  universityId?: string;
  facultyId?: string;
  degreeId?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: UniversityDataError[];
  warnings: UniversityDataError[];
}

// Search and filter types
export interface UniversitySearchFilters {
  searchTerm?: string;
  province?: string;
  type?: string;
  minAPS?: number;
  maxAPS?: number;
  faculties?: string[];
  hasApplicationInfo?: boolean;
}

export interface DegreeSearchFilters {
  searchTerm?: string;
  faculty?: string;
  minAPS?: number;
  maxAPS?: number;
  duration?: string;
  university?: string;
  careerField?: string;
}

// Export utility constants
export const UNIVERSITY_TYPES = {
  TRADITIONAL: "Traditional University",
  TECHNOLOGY: "University of Technology",
  COMPREHENSIVE: "Comprehensive University",
  SPECIALIZED: "Specialized University",
} as const;

export const SOUTH_AFRICAN_PROVINCES = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "Northern Cape",
  "North West",
  "Western Cape",
] as const;

export const COMMON_DEGREE_DURATIONS = [
  "3 years",
  "4 years",
  "5 years",
  "6 years",
] as const;

export const APS_SCORE_RANGES = {
  EXCELLENT: { min: 40, max: 49, label: "Excellent" },
  VERY_GOOD: { min: 35, max: 39, label: "Very Good" },
  GOOD: { min: 30, max: 34, label: "Good" },
  SATISFACTORY: { min: 25, max: 29, label: "Satisfactory" },
  BASIC: { min: 20, max: 24, label: "Basic" },
  BELOW_MINIMUM: { min: 0, max: 19, label: "Below Minimum" },
} as const;

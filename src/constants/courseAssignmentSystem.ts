import { Degree } from "@/types/university";

// University abbreviation mapping for course assignments
export const UNIVERSITY_ABBREVIATIONS = {
  // Traditional Universities
  UCT: "uct",
  Wits: "wits",
  SU: "sun",
  UP: "up",
  UKZN: "ukzn",
  Rhodes: "ru",
  NWU: "nwu",
  UFS: "ufs",
  UWC: "uwc",
  UFH: "ufh",
  WSU: "wsu",
  UNIVEN: "univen",
  SMU: "smu",
  // Comprehensive Universities
  UniZulu: "unizulu",
  UJ: "uj",
  UMP: "ump",
  UNISA: "unisa",
  // Universities of Technology
  CPUT: "cput",
  DUT: "dut",
  TUT: "tut",
  VUT: "vut",
  CUT: "cut",
  MUT: "mut",
} as const;

// Reverse mapping for lookups
export const UNIVERSITY_IDS_TO_ABBREV = Object.fromEntries(
  Object.entries(UNIVERSITY_ABBREVIATIONS).map(([abbrev, id]) => [id, abbrev]),
);

// All university IDs
export const ALL_UNIVERSITY_IDS = Object.values(UNIVERSITY_ABBREVIATIONS);

// Course assignment rule types - Updated to match usage
export type CourseAssignmentRule =
  | { type: "all" }
  | { type: "exclude"; universities: string[] }
  | { type: "include_only"; universities: string[] };

// Course with assignment rules and per-university APS requirements
export interface CourseTemplate {
  id: string;
  name: string;
  faculty: string;
  duration: string;
  baseApsRequirement: number;
  description: string;
  subjects: Array<{ name: string; level: number; isRequired: boolean }>;
  careerProspects: string[];
  assignmentRule: CourseAssignmentRule;
  universitySpecificAps?: Record<string, number>; // University ID -> APS requirement
}

// Parse exclusion rules from the provided course list
function parseAssignmentRule(ruleText: string): CourseAssignmentRule {
  if (
    ruleText.includes("all") &&
    !ruleText.includes("except") &&
    !ruleText.includes("exclude")
  ) {
    return { type: "all" };
  }

  if (ruleText.includes("exclude:") || ruleText.includes("except")) {
    // Extract university abbreviations from exclusion text
    const excludeMatch =
      ruleText.match(/exclude:\s*([^)]+)/i) ||
      ruleText.match(/except\s+([^)]+)/i);
    if (excludeMatch) {
      const abbrevs = excludeMatch[1]
        .split(/[,\s]+/)
        .map((s) => s.trim())
        .filter((s) => s && s in UNIVERSITY_ABBREVIATIONS);
      return {
        type: "exclude",
        universities: abbrevs.map(
          (abbrev) =>
            UNIVERSITY_ABBREVIATIONS[
              abbrev as keyof typeof UNIVERSITY_ABBREVIATIONS
            ],
        ),
      };
    }
  }

  if (ruleText.includes("Most except") || ruleText.includes("mostly at")) {
    // Extract universities that SHOULD have the course
    const includeMatch =
      ruleText.match(/except\s+([^)]+)/i) ||
      ruleText.match(/mostly at\s+([^)]+)/i);
    if (includeMatch) {
      const abbrevs = includeMatch[1]
        .split(/[,\s]+/)
        .map((s) => s.trim())
        .filter((s) => s && s in UNIVERSITY_ABBREVIATIONS);
      return {
        type: "include_only",
        universities: abbrevs.map(
          (abbrev) =>
            UNIVERSITY_ABBREVIATIONS[
              abbrev as keyof typeof UNIVERSITY_ABBREVIATIONS
            ],
        ),
      };
    }
  }

  // Default to all if can't parse
  return { type: "all" };
}

// Apply assignment rules to get list of universities for a course
export function getUniversitiesForCourse(rule: CourseAssignmentRule): string[] {
  switch (rule.type) {
    case "all":
      return [...ALL_UNIVERSITY_IDS];

    case "exclude":
      return ALL_UNIVERSITY_IDS.filter((id) => !rule.universities.includes(id));

    case "include_only":
      return rule.universities.filter((id) => ALL_UNIVERSITY_IDS.includes(id));

    default:
      return [...ALL_UNIVERSITY_IDS];
  }
}

// Course templates based on the provided list
export const COURSE_TEMPLATES: CourseTemplate[] = [
  // Faculty of Engineering / Engineering and Built Environment
  {
    id: "bsc-eng-civil",
    name: "BSc Engineering (Civil)",
    faculty: "Engineering",
    duration: "4 years",
    baseApsRequirement: 35,
    description: "Civil engineering with infrastructure development focus.",
    subjects: [
      { name: "Mathematics", level: 6, isRequired: true },
      { name: "Physical Sciences", level: 6, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Civil Engineer",
      "Structural Engineer",
      "Project Manager",
      "Construction Manager",
      "Infrastructure Planner",
    ],
    assignmentRule: parseAssignmentRule("exclude: UWC, UNISA, UFH"),
  },
  {
    id: "bsc-eng-mechanical",
    name: "BSc Engineering (Mechanical)",
    faculty: "Engineering",
    duration: "4 years",
    baseApsRequirement: 35,
    description: "Mechanical engineering with design and manufacturing focus.",
    subjects: [
      { name: "Mathematics", level: 6, isRequired: true },
      { name: "Physical Sciences", level: 6, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Mechanical Engineer",
      "Design Engineer",
      "Manufacturing Engineer",
      "Automotive Engineer",
      "HVAC Engineer",
    ],
    assignmentRule: parseAssignmentRule("exclude: UWC, UNISA, UFH"),
  },
  {
    id: "bsc-eng-electrical",
    name: "BSc Engineering (Electrical)",
    faculty: "Engineering",
    duration: "4 years",
    baseApsRequirement: 35,
    description:
      "Electrical engineering with power systems and electronics focus.",
    subjects: [
      { name: "Mathematics", level: 6, isRequired: true },
      { name: "Physical Sciences", level: 6, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Electrical Engineer",
      "Power Systems Engineer",
      "Electronics Engineer",
      "Control Systems Engineer",
      "Telecommunications Engineer",
    ],
    assignmentRule: parseAssignmentRule("exclude: UWC, UNISA, UFH"),
  },
  {
    id: "bsc-eng-chemical",
    name: "BSc Engineering (Chemical)",
    faculty: "Engineering",
    duration: "4 years",
    baseApsRequirement: 35,
    description:
      "Chemical engineering with process design and optimization focus.",
    subjects: [
      { name: "Mathematics", level: 6, isRequired: true },
      { name: "Physical Sciences", level: 6, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Chemical Engineer",
      "Process Engineer",
      "Plant Manager",
      "Environmental Engineer",
      "Petrochemical Engineer",
    ],
    assignmentRule: parseAssignmentRule("exclude: UJ, UNISA, UFH"),
  },
  {
    id: "bsc-construction-management",
    name: "BSc Construction Management",
    faculty: "Engineering",
    duration: "3 years",
    baseApsRequirement: 30,
    description: "Construction management with project leadership focus.",
    subjects: [
      { name: "Mathematics", level: 5, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Construction Manager",
      "Project Manager",
      "Site Manager",
      "Quantity Surveyor",
      "Construction Consultant",
    ],
    assignmentRule: parseAssignmentRule("all"),
  },
  {
    id: "bsc-quantity-surveying",
    name: "BSc Quantity Surveying",
    faculty: "Engineering",
    duration: "3 years",
    baseApsRequirement: 30,
    description: "Quantity surveying with cost management focus.",
    subjects: [
      { name: "Mathematics", level: 5, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Quantity Surveyor",
      "Cost Estimator",
      "Project Manager",
      "Construction Economist",
      "Contract Administrator",
    ],
    assignmentRule: parseAssignmentRule("all"),
  },

  // Faculty of Health Sciences / Medicine and Health
  {
    id: "mbchb",
    name: "Bachelor of Medicine and Bachelor of Surgery (MBChB)",
    faculty: "Health Sciences",
    duration: "6 years",
    baseApsRequirement: 40,
    description: "Medical degree with comprehensive clinical training.",
    subjects: [
      { name: "Life Sciences", level: 7, isRequired: true },
      { name: "Physical Sciences", level: 6, isRequired: true },
      { name: "Mathematics", level: 6, isRequired: true },
      { name: "English", level: 6, isRequired: true },
    ],
    careerProspects: [
      "Medical Doctor",
      "Specialist Physician",
      "General Practitioner",
      "Medical Researcher",
      "Clinical Director",
    ],
    assignmentRule: parseAssignmentRule("all"),
    universitySpecificAps: {
      uct: 45,
      wits: 44,
      up: 42,
      ukzn: 40,
      sun: 44,
      ufs: 38,
      smu: 40,
      wsu: 38,
    },
  },
  {
    id: "bds",
    name: "Bachelor of Dental Surgery (BDS)",
    faculty: "Health Sciences",
    duration: "5 years",
    baseApsRequirement: 38,
    description: "Dental surgery with comprehensive oral healthcare focus.",
    subjects: [
      { name: "Life Sciences", level: 7, isRequired: true },
      { name: "Physical Sciences", level: 6, isRequired: true },
      { name: "Mathematics", level: 6, isRequired: true },
      { name: "English", level: 6, isRequired: true },
    ],
    careerProspects: [
      "Dentist",
      "Oral Surgeon",
      "Dental Specialist",
      "Dental Practice Owner",
      "Oral Health Researcher",
    ],
    assignmentRule: parseAssignmentRule("exclude: UNISA, UFH, MUT"),
  },
  {
    id: "bpharm",
    name: "Bachelor of Pharmacy (BPharm)",
    faculty: "Health Sciences",
    duration: "4 years",
    baseApsRequirement: 34,
    description: "Pharmacy education with clinical practice focus.",
    subjects: [
      { name: "Physical Sciences", level: 6, isRequired: true },
      { name: "Life Sciences", level: 6, isRequired: true },
      { name: "Mathematics", level: 6, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Pharmacist",
      "Clinical Pharmacist",
      "Hospital Pharmacist",
      "Industrial Pharmacist",
      "Pharmaceutical Researcher",
    ],
    assignmentRule: parseAssignmentRule("all"),
  },
  {
    id: "bns-nursing",
    name: "Bachelor of Nursing Science",
    faculty: "Health Sciences",
    duration: "4 years",
    baseApsRequirement: 28,
    description: "Professional nursing with clinical excellence focus.",
    subjects: [
      { name: "Life Sciences", level: 5, isRequired: true },
      { name: "English", level: 5, isRequired: true },
      { name: "Mathematics", level: 4, isRequired: true },
    ],
    careerProspects: [
      "Professional Nurse",
      "Clinical Nurse Specialist",
      "Nurse Manager",
      "Community Health Nurse",
      "Nursing Researcher",
    ],
    assignmentRule: parseAssignmentRule("all"),
  },

  // Faculty of Humanities / Arts and Social Sciences
  {
    id: "ba-english",
    name: "BA English",
    faculty: "Humanities",
    duration: "3 years",
    baseApsRequirement: 24,
    description: "English literature and language studies.",
    subjects: [{ name: "English", level: 5, isRequired: true }],
    careerProspects: [
      "Teacher",
      "Writer",
      "Editor",
      "Journalist",
      "Content Creator",
    ],
    assignmentRule: parseAssignmentRule("all"),
  },
  {
    id: "ba-psychology",
    name: "BA Psychology",
    faculty: "Humanities",
    duration: "3 years",
    baseApsRequirement: 26,
    description: "Psychology with human behavior focus.",
    subjects: [
      { name: "English", level: 5, isRequired: true },
      { name: "Mathematics", level: 4, isRequired: true },
    ],
    careerProspects: [
      "Psychologist",
      "Counselor",
      "Researcher",
      "HR Specialist",
      "Social Worker",
    ],
    assignmentRule: parseAssignmentRule("all"),
  },

  // Faculty of Commerce / Business and Management
  {
    id: "bcom-accounting",
    name: "BCom Accounting",
    faculty: "Commerce",
    duration: "3 years",
    baseApsRequirement: 28,
    description: "Accounting education with professional qualification focus.",
    subjects: [
      { name: "Mathematics", level: 5, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Chartered Accountant",
      "Financial Manager",
      "Auditor",
      "Tax Consultant",
      "Management Accountant",
    ],
    assignmentRule: parseAssignmentRule("all"),
  },
  {
    id: "bcom-business-management",
    name: "BCom Business Management",
    faculty: "Commerce",
    duration: "3 years",
    baseApsRequirement: 26,
    description: "Business management with entrepreneurship focus.",
    subjects: [
      { name: "Mathematics", level: 4, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Business Manager",
      "Entrepreneur",
      "Project Manager",
      "Business Analyst",
      "Operations Manager",
    ],
    assignmentRule: parseAssignmentRule("all"),
  },

  // Faculty of Law
  {
    id: "llb",
    name: "Bachelor of Laws (LLB)",
    faculty: "Law",
    duration: "4 years",
    baseApsRequirement: 30,
    description: "Legal education with comprehensive law focus.",
    subjects: [{ name: "English", level: 5, isRequired: true }],
    careerProspects: [
      "Attorney",
      "Advocate",
      "Legal Advisor",
      "Magistrate",
      "Corporate Legal Counsel",
    ],
    assignmentRule: parseAssignmentRule("all"),
  },

  // Faculty of Science / Natural Sciences
  {
    id: "bsc-computer-science",
    name: "BSc Computer Science",
    faculty: "Science",
    duration: "3 years",
    baseApsRequirement: 30,
    description: "Computer science with software development focus.",
    subjects: [
      { name: "Mathematics", level: 6, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Software Developer",
      "Systems Analyst",
      "Database Administrator",
      "IT Specialist",
      "Web Developer",
    ],
    assignmentRule: parseAssignmentRule("all"),
  },
  {
    id: "bsc-mathematics",
    name: "BSc Mathematics",
    faculty: "Science",
    duration: "3 years",
    baseApsRequirement: 32,
    description: "Pure and applied mathematics.",
    subjects: [
      { name: "Mathematics", level: 6, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Mathematician",
      "Statistician",
      "Data Analyst",
      "Actuary",
      "Research Scientist",
    ],
    assignmentRule: parseAssignmentRule("all"),
  },

  // Faculty of Education
  {
    id: "bed-foundation-phase",
    name: "BEd Foundation Phase",
    faculty: "Education",
    duration: "4 years",
    baseApsRequirement: 22,
    description: "Teacher training for Grade R to Grade 3.",
    subjects: [
      { name: "English", level: 4, isRequired: true },
      { name: "Mathematics", level: 4, isRequired: true },
    ],
    careerProspects: [
      "Foundation Phase Teacher",
      "Early Childhood Educator",
      "Primary School Teacher",
      "Curriculum Developer",
      "Educational Coordinator",
    ],
    assignmentRule: parseAssignmentRule("all"),
  },
];

// Function to generate degrees for a specific university
export function generateDegreesForUniversity(
  universityId: string,
  facultyName: string,
): Degree[] {
  return COURSE_TEMPLATES.filter((template) => {
    const applicableUniversities = getUniversitiesForCourse(
      template.assignmentRule,
    );
    return (
      applicableUniversities.includes(universityId) &&
      template.faculty === facultyName
    );
  }).map((template) => ({
    id: template.id,
    name: template.name,
    faculty: facultyName,
    duration: template.duration,
    apsRequirement:
      template.universitySpecificAps?.[universityId] ||
      template.baseApsRequirement,
    description: template.description,
    subjects: template.subjects,
    careerProspects: template.careerProspects,
  }));
}

// Function to get all courses assigned to a specific university
export function getCoursesForUniversity(
  universityId: string,
): CourseTemplate[] {
  return COURSE_TEMPLATES.filter((template) => {
    const applicableUniversities = getUniversitiesForCourse(
      template.assignmentRule,
    );
    return applicableUniversities.includes(universityId);
  });
}

// Function to get assignment statistics
export function getCourseAssignmentStats() {
  const stats = {
    totalCourses: COURSE_TEMPLATES.length,
    allUniversityCourses: 0,
    excludedCourses: 0,
    includeOnlyCourses: 0,
    universityCourseCounts: {} as Record<string, number>,
  };

  COURSE_TEMPLATES.forEach((template) => {
    const universities = getUniversitiesForCourse(template.assignmentRule);

    switch (template.assignmentRule.type) {
      case "all":
        stats.allUniversityCourses++;
        break;
      case "exclude":
        stats.excludedCourses++;
        break;
      case "include_only":
        stats.includeOnlyCourses++;
        break;
    }

    universities.forEach((univId) => {
      stats.universityCourseCounts[univId] =
        (stats.universityCourseCounts[univId] || 0) + 1;
    });
  });

  return stats;
}

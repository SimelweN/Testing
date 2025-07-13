/**
 * Program Assignment Rules Engine
 * Handles the three types of program assignment rules:
 * 1. "all" - Program added to all universities
 * 2. "exclude" - Program added to all universities except specified ones
 * 3. "include" - Program added only to specified universities
 */

export type AssignmentRule =
  | { type: "all" }
  | { type: "exclude"; universities: string[] }
  | { type: "include"; universities: string[] };

export interface ProgramRule {
  programId: string;
  programName: string;
  rule: AssignmentRule;
  apsRequirement: number; // Base APS requirement (can be overridden per university)
  faculty: string;
  duration: string;
  description?: string;
}

// All 26 South African Public Universities (using IDs from complete-26-universities.ts)
export const ALL_UNIVERSITIES = [
  "uct",
  "wits",
  "stellenbosch",
  "up",
  "ukzn",
  "ufs",
  "ru",
  "nwu",
  "uwc",
  "ufh",
  "ul",
  "cput",
  "dut",
  "tut",
  "cut",
  "vut",
  "mut",
  "uj",
  "unisa",
  "unizulu",
  "univen",
  "nmu",
  "wsu",
  "smu",
  "spu",
  "ump",
];

// Program Assignment Rules based on official prospectus data
export const PROGRAM_ASSIGNMENT_RULES: ProgramRule[] = [
  // COMMERCE & BUSINESS
  {
    programId: "bcom-accounting",
    programName: "BCom Accounting",
    rule: { type: "all" },
    apsRequirement: 30,
    faculty: "Commerce",
    duration: "3 years",
    description: "Professional accounting qualification with CTA pathway.",
  },
  {
    programId: "bsc-actuarial-science",
    programName: "BSc Actuarial Science",
    rule: { type: "exclude", universities: ["ufh", "mut"] },
    apsRequirement: 42,
    faculty: "Commerce",
    duration: "3 years",
    description: "Mathematical and statistical analysis of risk.",
  },
  {
    programId: "bcom-economics",
    programName: "BCom Economics",
    rule: { type: "all" },
    apsRequirement: 28,
    faculty: "Commerce",
    duration: "3 years",
    description: "Economic theory and policy analysis.",
  },
  {
    programId: "bcom-business-management",
    programName: "BCom Business Management",
    rule: { type: "all" },
    apsRequirement: 26,
    faculty: "Commerce",
    duration: "3 years",
    description: "General business management and strategy.",
  },
  {
    programId: "bcom-finance",
    programName: "BCom Finance",
    rule: { type: "all" },
    apsRequirement: 28,
    faculty: "Commerce",
    duration: "3 years",
    description: "Financial management and investment analysis.",
  },
  {
    programId: "bcom-marketing",
    programName: "BCom Marketing",
    rule: { type: "all" },
    apsRequirement: 26,
    faculty: "Commerce",
    duration: "3 years",
    description: "Marketing strategy and consumer behavior.",
  },
  {
    programId: "bcom-human-resources",
    programName: "BCom Human Resource Management",
    rule: { type: "all" },
    apsRequirement: 26,
    faculty: "Commerce",
    duration: "3 years",
    description: "Human capital management and organizational behavior.",
  },

  // ENGINEERING
  {
    programId: "beng-chemical",
    programName: "BEng Chemical Engineering",
    rule: { type: "exclude", universities: ["uj", "unisa", "ufh"] },
    apsRequirement: 42,
    faculty: "Engineering",
    duration: "4 years",
    description: "Chemical processes and materials engineering.",
  },
  {
    programId: "beng-civil",
    programName: "BEng Civil Engineering",
    rule: { type: "exclude", universities: ["uwc", "unisa", "ufh"] },
    apsRequirement: 42,
    faculty: "Engineering",
    duration: "4 years",
    description: "Infrastructure design and construction.",
  },
  {
    programId: "beng-electrical",
    programName: "BEng Electrical Engineering",
    rule: { type: "exclude", universities: ["uwc", "unisa", "ufh"] },
    apsRequirement: 42,
    faculty: "Engineering",
    duration: "4 years",
    description: "Electrical systems and electronics.",
  },
  {
    programId: "beng-mechanical",
    programName: "BEng Mechanical Engineering",
    rule: { type: "exclude", universities: ["uwc", "unisa", "ufh"] },
    apsRequirement: 42,
    faculty: "Engineering",
    duration: "4 years",
    description: "Mechanical systems and manufacturing.",
  },
  {
    programId: "beng-industrial",
    programName: "BEng Industrial Engineering",
    rule: { type: "exclude", universities: ["uwc", "unisa"] },
    apsRequirement: 40,
    faculty: "Engineering",
    duration: "4 years",
    description: "Systems optimization and operations management.",
  },

  // HEALTH SCIENCES
  {
    programId: "mbchb-medicine",
    programName: "MBChB Medicine",
    rule: { type: "all" },
    apsRequirement: 45,
    faculty: "Health Sciences",
    duration: "6 years",
    description: "Medical degree for practicing doctors.",
  },
  {
    programId: "bnurs-nursing",
    programName: "BNurs Nursing",
    rule: { type: "all" },
    apsRequirement: 28,
    faculty: "Health Sciences",
    duration: "4 years",
    description: "Professional nursing qualification.",
  },
  {
    programId: "bsc-physiotherapy",
    programName: "BSc Physiotherapy",
    rule: { type: "all" },
    apsRequirement: 35,
    faculty: "Health Sciences",
    duration: "4 years",
    description: "Physical rehabilitation and therapy.",
  },
  {
    programId: "bsc-occupational-therapy",
    programName: "BSc Occupational Therapy",
    rule: { type: "all" },
    apsRequirement: 35,
    faculty: "Health Sciences",
    duration: "4 years",
    description: "Occupational rehabilitation and therapy.",
  },
  {
    programId: "bsc-dietetics",
    programName: "BSc Dietetics",
    rule: { type: "all" },
    apsRequirement: 32,
    faculty: "Health Sciences",
    duration: "4 years",
    description: "Nutrition science and dietary management.",
  },

  // SCIENCE
  {
    programId: "bsc-computer-science",
    programName: "BSc Computer Science",
    rule: { type: "all" },
    apsRequirement: 35,
    faculty: "Science",
    duration: "3 years",
    description: "Computer programming and software development.",
  },
  {
    programId: "bsc-mathematical-sciences",
    programName: "BSc Mathematical Sciences",
    rule: { type: "all" },
    apsRequirement: 38,
    faculty: "Science",
    duration: "3 years",
    description: "Pure and applied mathematics.",
  },
  {
    programId: "bsc-physics",
    programName: "BSc Physics",
    rule: { type: "all" },
    apsRequirement: 38,
    faculty: "Science",
    duration: "3 years",
    description: "Physical sciences and natural laws.",
  },
  {
    programId: "bsc-chemistry",
    programName: "BSc Chemistry",
    rule: { type: "all" },
    apsRequirement: 36,
    faculty: "Science",
    duration: "3 years",
    description: "Chemical sciences and molecular studies.",
  },
  {
    programId: "bsc-biological-sciences",
    programName: "BSc Biological Sciences",
    rule: { type: "all" },
    apsRequirement: 35,
    faculty: "Science",
    duration: "3 years",
    description: "Life sciences and biological systems.",
  },
  {
    programId: "bsc-environmental-science",
    programName: "BSc Environmental Science",
    rule: { type: "all" },
    apsRequirement: 32,
    faculty: "Science",
    duration: "3 years",
    description: "Environmental systems and sustainability.",
  },

  // HUMANITIES
  {
    programId: "ba-psychology",
    programName: "BA Psychology",
    rule: { type: "all" },
    apsRequirement: 30,
    faculty: "Humanities",
    duration: "3 years",
    description: "Human behavior and mental processes.",
  },
  {
    programId: "ba-sociology",
    programName: "BA Sociology",
    rule: { type: "all" },
    apsRequirement: 26,
    faculty: "Humanities",
    duration: "3 years",
    description: "Society and social behavior.",
  },
  {
    programId: "ba-political-science",
    programName: "BA Political Science",
    rule: { type: "all" },
    apsRequirement: 28,
    faculty: "Humanities",
    duration: "3 years",
    description: "Political systems and governance.",
  },
  {
    programId: "ba-history",
    programName: "BA History",
    rule: { type: "all" },
    apsRequirement: 26,
    faculty: "Humanities",
    duration: "3 years",
    description: "Historical studies and analysis.",
  },
  {
    programId: "ba-english",
    programName: "BA English",
    rule: { type: "all" },
    apsRequirement: 26,
    faculty: "Humanities",
    duration: "3 years",
    description: "English language and literature.",
  },
  {
    programId: "ba-philosophy",
    programName: "BA Philosophy",
    rule: { type: "all" },
    apsRequirement: 28,
    faculty: "Humanities",
    duration: "3 years",
    description: "Critical thinking and philosophical inquiry.",
  },
  {
    programId: "ba-media-communication",
    programName: "BA Media & Communication",
    rule: { type: "all" },
    apsRequirement: 28,
    faculty: "Humanities",
    duration: "3 years",
    description: "Media studies and communication theory.",
  },

  // EDUCATION
  {
    programId: "bed-foundation-phase",
    programName: "BEd Foundation Phase",
    rule: { type: "all" },
    apsRequirement: 24,
    faculty: "Education",
    duration: "4 years",
    description: "Teacher training for Grade R-3.",
  },
  {
    programId: "bed-intermediate-phase",
    programName: "BEd Intermediate Phase",
    rule: { type: "all" },
    apsRequirement: 24,
    faculty: "Education",
    duration: "4 years",
    description: "Teacher training for Grade 4-6.",
  },
  {
    programId: "bed-senior-fet-phase",
    programName: "BEd Senior & FET Phase",
    rule: { type: "all" },
    apsRequirement: 26,
    faculty: "Education",
    duration: "4 years",
    description: "Teacher training for Grade 7-12.",
  },

  // LAW
  {
    programId: "llb-law",
    programName: "LLB Law",
    rule: { type: "all" },
    apsRequirement: 32,
    faculty: "Law",
    duration: "4 years",
    description: "Legal studies and jurisprudence.",
  },

  // SPECIALIZED PROGRAMS
  {
    programId: "bsw-social-work",
    programName: "Bachelor of Social Work",
    rule: { type: "all" },
    apsRequirement: 26,
    faculty: "Humanities",
    duration: "4 years",
    description: "Professional social work training.",
  },
  {
    programId: "bfa-fine-art",
    programName: "Bachelor of Fine Art",
    rule: { type: "exclude", universities: ["ufh"] },
    apsRequirement: 24,
    faculty: "Humanities",
    duration: "4 years",
    description: "Visual and creative arts.",
  },

  // SPECIALIZED/LIMITED PROGRAMS
  {
    programId: "bsc-marine-biology",
    programName: "BSc Marine Biology",
    rule: { type: "include", universities: ["uct", "ru"] },
    apsRequirement: 38,
    faculty: "Science",
    duration: "3 years",
    description: "Marine ecosystems and organisms.",
  },
  {
    programId: "bsc-astronomy",
    programName: "BSc Astronomy",
    rule: { type: "include", universities: ["uct", "ru"] },
    apsRequirement: 40,
    faculty: "Science",
    duration: "3 years",
    description: "Astronomical sciences and space studies.",
  },
  {
    programId: "barch-architecture",
    programName: "BArch Architecture",
    rule: { type: "exclude", universities: ["unisa", "ufh"] },
    apsRequirement: 38,
    faculty: "Engineering",
    duration: "5 years",
    description: "Architectural design and building sciences.",
  },
];

/**
 * Function to get universities that should offer a specific program
 */
export function getUniversitiesForProgram(programRule: ProgramRule): string[] {
  const { rule } = programRule;

  switch (rule.type) {
    case "all":
      return [...ALL_UNIVERSITIES];

    case "exclude":
      return ALL_UNIVERSITIES.filter((uni) => !rule.universities.includes(uni));

    case "include":
      return rule.universities.filter((uni) => ALL_UNIVERSITIES.includes(uni));

    default:
      return [];
  }
}

/**
 * Function to check if a university should offer a specific program
 */
export function shouldUniversityOfferProgram(
  universityId: string,
  programRule: ProgramRule,
): boolean {
  const universities = getUniversitiesForProgram(programRule);
  return universities.includes(universityId);
}

/**
 * Function to generate faculty mappings for all universities based on assignment rules
 */
export function generateUniversityProgramMappings() {
  const mappings: { [universityId: string]: { [faculty: string]: string[] } } =
    {};

  // Initialize mappings for all universities
  ALL_UNIVERSITIES.forEach((uni) => {
    mappings[uni] = {};
  });

  // Apply program rules
  PROGRAM_ASSIGNMENT_RULES.forEach((programRule) => {
    const universities = getUniversitiesForProgram(programRule);

    universities.forEach((uni) => {
      if (!mappings[uni][programRule.faculty]) {
        mappings[uni][programRule.faculty] = [];
      }
      mappings[uni][programRule.faculty].push(programRule.programId);
    });
  });

  return mappings;
}

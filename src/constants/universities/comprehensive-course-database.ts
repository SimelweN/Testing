import { University, Faculty, Degree } from "@/types/university";

/**
 * COMPREHENSIVE COURSE DATABASE - COMPLETE LIST
 *
 * This implements the complete course list with proper assignment rules
 * and university-specific APS requirements as requested.
 */

// University abbreviation mappings
export const UNIVERSITY_ABBREVIATIONS = {
  UCT: "uct",
  Wits: "wits",
  SU: "stellenbosch",
  UP: "up",
  UKZN: "ukzn",
  UFS: "ufs",
  RU: "ru",
  NWU: "nwu",
  UWC: "uwc",
  UJ: "uj",
  UNISA: "unisa",
  UFH: "ufh",
  TUT: "tut",
  DUT: "dut",
  VUT: "vut",
  MUT: "mut",
  CPUT: "cput",
  UL: "ul",
  UNIVEN: "univen",
  WSU: "wsu",
  SMU: "smu",
  UMP: "ump",
  UNIZULU: "unizulu",
  CUT: "cut",
  NMU: "nmu",
  SPU: "spu",
};

export const ALL_UNIVERSITY_IDS = Object.values(UNIVERSITY_ABBREVIATIONS);

export type AssignmentRule = {
  type: "all" | "exclude" | "include_only";
  universities?: string[];
};

export interface ComprehensiveCourse {
  name: string;
  faculty: string;
  description: string;
  duration: string;
  assignmentRule: AssignmentRule;
  defaultAps: number;
  universitySpecificAps?: Record<string, number>;
  subjects?: Array<{ name: string; level: number; isRequired: boolean }>;
  careerProspects?: string[];
}

// Helper function to parse exclusion rules
function parseExcludeRule(excludeList: string): AssignmentRule {
  const excludeAbbrevs = excludeList.split(", ").map((s) => s.trim());
  const universityIds = excludeAbbrevs
    .map(
      (abbrev) =>
        UNIVERSITY_ABBREVIATIONS[
          abbrev as keyof typeof UNIVERSITY_ABBREVIATIONS
        ],
    )
    .filter(Boolean);

  return { type: "exclude", universities: universityIds };
}

// Helper function to parse include-only rules
function parseIncludeOnlyRule(includeList: string): AssignmentRule {
  const includeAbbrevs = includeList.split(", ").map((s) => s.trim());
  const universityIds = includeAbbrevs
    .map(
      (abbrev) =>
        UNIVERSITY_ABBREVIATIONS[
          abbrev as keyof typeof UNIVERSITY_ABBREVIATIONS
        ],
    )
    .filter(Boolean);

  return { type: "include_only", universities: universityIds };
}

// Parse "Most except" rules
function parseMostExceptRule(exceptList: string): AssignmentRule {
  return parseIncludeOnlyRule(exceptList);
}

// Comprehensive course database
export const COMPREHENSIVE_COURSES: ComprehensiveCourse[] = [
  // ==============================================
  // Faculty of Engineering / Engineering and Built Environment
  // ==============================================
  {
    name: "Civil Engineering",
    faculty: "Engineering",
    description:
      "Design, construct and maintain civil infrastructure including roads, bridges, and buildings.",
    duration: "4 years",
    defaultAps: 35,
    assignmentRule: parseExcludeRule("UWC, UNISA, UFH"),
    universitySpecificAps: { uct: 38, wits: 37, stellenbosch: 36, up: 35 },
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
    ],
  },
  {
    name: "Mechanical Engineering",
    faculty: "Engineering",
    description:
      "Design, develop and manufacture mechanical systems and machinery.",
    duration: "4 years",
    defaultAps: 35,
    assignmentRule: parseExcludeRule("UWC, UNISA, UFH"),
    universitySpecificAps: { uct: 38, wits: 37, stellenbosch: 36, up: 35 },
    subjects: [
      { name: "Mathematics", level: 6, isRequired: true },
      { name: "Physical Sciences", level: 6, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Mechanical Engineer",
      "Design Engineer",
      "Manufacturing Engineer",
      "Project Manager",
    ],
  },
  {
    name: "Electrical Engineering",
    faculty: "Engineering",
    description:
      "Design and develop electrical systems, electronics, and power systems.",
    duration: "4 years",
    defaultAps: 35,
    assignmentRule: parseExcludeRule("UWC, UNISA, UFH"),
    universitySpecificAps: { uct: 38, wits: 37, stellenbosch: 36, up: 35 },
    subjects: [
      { name: "Mathematics", level: 6, isRequired: true },
      { name: "Physical Sciences", level: 6, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Electrical Engineer",
      "Electronics Engineer",
      "Power Systems Engineer",
      "Control Systems Engineer",
    ],
  },
  {
    name: "Chemical Engineering",
    faculty: "Engineering",
    description:
      "Design chemical processes and develop materials for industrial applications.",
    duration: "4 years",
    defaultAps: 35,
    assignmentRule: parseExcludeRule("UJ, UNISA, UFH"),
    universitySpecificAps: { uct: 40, wits: 39, stellenbosch: 38, up: 37 },
    subjects: [
      { name: "Mathematics", level: 6, isRequired: true },
      { name: "Physical Sciences", level: 6, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Chemical Engineer",
      "Process Engineer",
      "Environmental Engineer",
      "Materials Engineer",
    ],
  },
  {
    name: "Industrial Engineering",
    faculty: "Engineering",
    description: "Optimize systems, processes, and operations for efficiency.",
    duration: "4 years",
    defaultAps: 34,
    assignmentRule: parseExcludeRule("UWC, UNISA"),
    subjects: [
      { name: "Mathematics", level: 6, isRequired: true },
      { name: "Physical Sciences", level: 5, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Industrial Engineer",
      "Operations Manager",
      "Quality Manager",
      "Supply Chain Manager",
    ],
  },
  {
    name: "Computer Engineering",
    faculty: "Engineering",
    description: "Design and develop computer hardware and software systems.",
    duration: "4 years",
    defaultAps: 36,
    assignmentRule: parseExcludeRule("UCT, UP, UNISA"),
    subjects: [
      { name: "Mathematics", level: 6, isRequired: true },
      { name: "Physical Sciences", level: 6, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Computer Engineer",
      "Software Engineer",
      "Hardware Engineer",
      "Systems Engineer",
    ],
  },
  {
    name: "Mechatronics",
    faculty: "Engineering",
    description:
      "Integration of mechanical, electrical, and software engineering.",
    duration: "4 years",
    defaultAps: 36,
    assignmentRule: parseExcludeRule("UWC, UNISA, UFH, MUT"),
    subjects: [
      { name: "Mathematics", level: 6, isRequired: true },
      { name: "Physical Sciences", level: 6, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Mechatronics Engineer",
      "Automation Engineer",
      "Robotics Engineer",
      "Control Systems Engineer",
    ],
  },
  {
    name: "Mining Engineering",
    faculty: "Engineering",
    description: "Extraction and processing of mineral resources.",
    duration: "4 years",
    defaultAps: 34,
    assignmentRule: parseExcludeRule("UWC, UNISA, UFH, RU"),
    subjects: [
      { name: "Mathematics", level: 6, isRequired: true },
      { name: "Physical Sciences", level: 6, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Mining Engineer",
      "Mine Manager",
      "Geological Engineer",
      "Safety Engineer",
    ],
  },
  {
    name: "Environmental Engineering",
    faculty: "Engineering",
    description:
      "Environmental protection and sustainable engineering solutions.",
    duration: "4 years",
    defaultAps: 34,
    assignmentRule: parseExcludeRule("UWC, UNISA"),
    subjects: [
      { name: "Mathematics", level: 6, isRequired: true },
      { name: "Physical Sciences", level: 6, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Environmental Engineer",
      "Sustainability Consultant",
      "Water Treatment Engineer",
      "Air Quality Specialist",
    ],
  },
  {
    name: "Agricultural Engineering",
    faculty: "Engineering",
    description: "Engineering solutions for agricultural and food systems.",
    duration: "4 years",
    defaultAps: 32,
    assignmentRule: parseExcludeRule("UWC, UNISA, UFH"),
    subjects: [
      { name: "Mathematics", level: 6, isRequired: true },
      { name: "Physical Sciences", level: 5, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Agricultural Engineer",
      "Irrigation Engineer",
      "Food Processing Engineer",
      "Farm Manager",
    ],
  },
  {
    name: "Structural Engineering",
    faculty: "Engineering",
    description:
      "Design and analysis of building and infrastructure structures.",
    duration: "4 years",
    defaultAps: 36,
    assignmentRule: parseExcludeRule("UWC, UNISA"),
    subjects: [
      { name: "Mathematics", level: 6, isRequired: true },
      { name: "Physical Sciences", level: 6, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Structural Engineer",
      "Bridge Engineer",
      "Building Designer",
      "Construction Engineer",
    ],
  },
  {
    name: "Transport Engineering",
    faculty: "Engineering",
    description: "Transportation systems and infrastructure design.",
    duration: "4 years",
    defaultAps: 32,
    assignmentRule: parseMostExceptRule("TUT, DUT"),
    subjects: [
      { name: "Mathematics", level: 6, isRequired: true },
      { name: "Physical Sciences", level: 5, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Transport Engineer",
      "Traffic Engineer",
      "Urban Planner",
      "Logistics Manager",
    ],
  },
  {
    name: "Water Resources Engineering",
    faculty: "Engineering",
    description: "Water supply, treatment, and management systems.",
    duration: "4 years",
    defaultAps: 34,
    assignmentRule: parseExcludeRule("UWC, UNISA"),
    subjects: [
      { name: "Mathematics", level: 6, isRequired: true },
      { name: "Physical Sciences", level: 6, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Water Engineer",
      "Hydraulic Engineer",
      "Environmental Consultant",
      "Municipal Engineer",
    ],
  },
  {
    name: "Geotechnical Engineering",
    faculty: "Engineering",
    description: "Soil and rock mechanics for construction projects.",
    duration: "4 years",
    defaultAps: 35,
    assignmentRule: parseExcludeRule("UWC, UNISA"),
    subjects: [
      { name: "Mathematics", level: 6, isRequired: true },
      { name: "Physical Sciences", level: 6, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Geotechnical Engineer",
      "Foundation Engineer",
      "Soil Consultant",
      "Mining Engineer",
    ],
  },
  {
    name: "Construction Management",
    faculty: "Engineering",
    description: "Manage construction projects from planning to completion.",
    duration: "3 years",
    defaultAps: 28,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "Mathematics", level: 5, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Construction Manager",
      "Project Manager",
      "Site Manager",
      "Construction Consultant",
    ],
  },
  {
    name: "Quantity Surveying",
    faculty: "Engineering",
    description: "Manage costs and contracts in construction projects.",
    duration: "3 years",
    defaultAps: 28,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "Mathematics", level: 5, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Quantity Surveyor",
      "Cost Estimator",
      "Project Manager",
      "Construction Economist",
    ],
  },
  {
    name: "Urban and Regional Planning",
    faculty: "Engineering",
    description: "Plan and design urban spaces and regional development.",
    duration: "4 years",
    defaultAps: 30,
    assignmentRule: parseExcludeRule("UNISA, UFH"),
    subjects: [
      { name: "Mathematics", level: 5, isRequired: true },
      { name: "English", level: 5, isRequired: true },
      { name: "Geography", level: 4, isRequired: false },
    ],
    careerProspects: [
      "Urban Planner",
      "Regional Planner",
      "Development Consultant",
      "Municipal Planner",
    ],
  },
  {
    name: "Architecture",
    faculty: "Engineering",
    description: "Design and plan buildings and structures.",
    duration: "5 years",
    defaultAps: 32,
    assignmentRule: parseExcludeRule("UNISA, UFH, MUT"),
    universitySpecificAps: { uct: 36, wits: 35, stellenbosch: 34 },
    subjects: [
      { name: "Mathematics", level: 5, isRequired: true },
      { name: "English", level: 5, isRequired: true },
      { name: "Visual Arts", level: 4, isRequired: false },
    ],
    careerProspects: [
      "Architect",
      "Urban Designer",
      "Landscape Architect",
      "Building Designer",
    ],
  },
  {
    name: "Building Science",
    faculty: "Engineering",
    description: "Building technology, materials, and construction methods.",
    duration: "3 years",
    defaultAps: 28,
    assignmentRule: parseExcludeRule("UNISA, UFH"),
    subjects: [
      { name: "Mathematics", level: 5, isRequired: true },
      { name: "Physical Sciences", level: 4, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Building Scientist",
      "Construction Consultant",
      "Building Inspector",
      "Project Manager",
    ],
  },
  {
    name: "Interior Architecture",
    faculty: "Engineering",
    description: "Design and planning of interior spaces.",
    duration: "3 years",
    defaultAps: 28,
    assignmentRule: parseMostExceptRule("SU, UCT, UP"),
    subjects: [
      { name: "English", level: 5, isRequired: true },
      { name: "Visual Arts", level: 4, isRequired: false },
      { name: "Mathematics", level: 4, isRequired: true },
    ],
    careerProspects: [
      "Interior Architect",
      "Interior Designer",
      "Space Planner",
      "Design Consultant",
    ],
  },
  {
    name: "Landscape Architecture",
    faculty: "Engineering",
    description: "Design outdoor spaces and landscape environments.",
    duration: "4 years",
    defaultAps: 30,
    assignmentRule: parseMostExceptRule("SU, UCT"),
    subjects: [
      { name: "English", level: 5, isRequired: true },
      { name: "Visual Arts", level: 4, isRequired: false },
      { name: "Mathematics", level: 4, isRequired: true },
    ],
    careerProspects: [
      "Landscape Architect",
      "Environmental Designer",
      "Urban Designer",
      "Park Planner",
    ],
  },
  {
    name: "Urban Design",
    faculty: "Engineering",
    description: "Design and planning of urban environments.",
    duration: "4 years",
    defaultAps: 32,
    assignmentRule: parseExcludeRule("UNISA, UFH"),
    subjects: [
      { name: "English", level: 5, isRequired: true },
      { name: "Mathematics", level: 5, isRequired: true },
      { name: "Visual Arts", level: 4, isRequired: false },
    ],
    careerProspects: [
      "Urban Designer",
      "City Planner",
      "Development Consultant",
      "Architectural Planner",
    ],
  },

  // ==============================================
  // Faculty of Health Sciences / Medicine and Health
  // ==============================================
  {
    name: "Bachelor of Medicine and Bachelor of Surgery (MBChB)",
    faculty: "Health Sciences",
    description: "Comprehensive medical training to become a qualified doctor.",
    duration: "6 years",
    defaultAps: 42,
    assignmentRule: { type: "all" },
    universitySpecificAps: {
      uct: 45,
      wits: 44,
      stellenbosch: 44,
      up: 42,
      ukzn: 40,
      ufs: 38,
      smu: 40,
    },
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
    ],
  },
  {
    name: "Bachelor of Dental Surgery (BDS)",
    faculty: "Health Sciences",
    description: "Comprehensive dental training for oral healthcare.",
    duration: "5 years",
    defaultAps: 38,
    assignmentRule: parseExcludeRule("UNISA, UFH, MUT"),
    universitySpecificAps: { uct: 42, wits: 41, stellenbosch: 40, up: 39 },
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
    ],
  },
  {
    name: "Bachelor of Pharmacy (BPharm)",
    faculty: "Health Sciences",
    description: "Pharmaceutical sciences and clinical pharmacy practice.",
    duration: "4 years",
    defaultAps: 34,
    assignmentRule: { type: "all" },
    universitySpecificAps: { uct: 38, wits: 37, stellenbosch: 36, up: 35 },
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
      "Pharmaceutical Researcher",
    ],
  },
  {
    name: "Bachelor of Physiotherapy (BSc Physiotherapy)",
    faculty: "Health Sciences",
    description: "Physical rehabilitation and movement therapy.",
    duration: "4 years",
    defaultAps: 36,
    assignmentRule: { type: "all" },
    universitySpecificAps: { uct: 40, wits: 39, stellenbosch: 38, up: 37 },
    subjects: [
      { name: "Life Sciences", level: 6, isRequired: true },
      { name: "Physical Sciences", level: 5, isRequired: true },
      { name: "Mathematics", level: 5, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Physiotherapist",
      "Sports Therapist",
      "Rehabilitation Specialist",
      "Private Practice Owner",
    ],
  },
  {
    name: "Bachelor of Occupational Therapy (BSc Occupational Therapy)",
    faculty: "Health Sciences",
    description:
      "Help people with disabilities participate in daily activities.",
    duration: "4 years",
    defaultAps: 34,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "Life Sciences", level: 6, isRequired: true },
      { name: "English", level: 5, isRequired: true },
      { name: "Mathematics", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Occupational Therapist",
      "Rehabilitation Specialist",
      "Assistive Technology Specialist",
      "Community Health Worker",
    ],
  },
  {
    name: "Bachelor of Radiography (BSc Radiography)",
    faculty: "Health Sciences",
    description: "Medical imaging and radiation therapy.",
    duration: "4 years",
    defaultAps: 32,
    assignmentRule: parseExcludeRule("UFH, MUT"),
    subjects: [
      { name: "Physical Sciences", level: 6, isRequired: true },
      { name: "Life Sciences", level: 5, isRequired: true },
      { name: "Mathematics", level: 5, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Radiographer",
      "Medical Imaging Specialist",
      "Radiation Therapist",
      "Hospital Technician",
    ],
  },
  {
    name: "Bachelor of Nursing Science (BNS)",
    faculty: "Health Sciences",
    description: "Professional nursing education with clinical practice.",
    duration: "4 years",
    defaultAps: 28,
    assignmentRule: { type: "all" },
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
    ],
  },
  {
    name: "Bachelor of Clinical Medical Practice (BCMP)",
    faculty: "Health Sciences",
    description: "Primary healthcare and clinical practice.",
    duration: "3 years",
    defaultAps: 32,
    assignmentRule: parseExcludeRule("UCT, Wits"),
    subjects: [
      { name: "Life Sciences", level: 6, isRequired: true },
      { name: "Physical Sciences", level: 5, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Clinical Medical Practitioner",
      "Primary Healthcare Provider",
      "Emergency Medical Practitioner",
      "Rural Health Practitioner",
    ],
  },
  {
    name: "Bachelor of Emergency Medical Care (BEMC)",
    faculty: "Health Sciences",
    description: "Emergency medical services and critical care.",
    duration: "4 years",
    defaultAps: 30,
    assignmentRule: parseMostExceptRule("DUT, TUT"),
    subjects: [
      { name: "Life Sciences", level: 6, isRequired: true },
      { name: "Physical Sciences", level: 5, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Emergency Medical Technician",
      "Paramedic",
      "Critical Care Practitioner",
      "Emergency Services Manager",
    ],
  },
  {
    name: "Bachelor of Medical Science (BMedSci)",
    faculty: "Health Sciences",
    description: "Medical sciences and biomedical research.",
    duration: "3 years",
    defaultAps: 32,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "Life Sciences", level: 6, isRequired: true },
      { name: "Physical Sciences", level: 5, isRequired: true },
      { name: "Mathematics", level: 5, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Medical Researcher",
      "Laboratory Scientist",
      "Biomedical Scientist",
      "Clinical Research Coordinator",
    ],
  },
  {
    name: "Bachelor of Biomedical Science (BSc Biomedical Science)",
    faculty: "Health Sciences",
    description: "Biomedical research and laboratory sciences.",
    duration: "3 years",
    defaultAps: 32,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "Life Sciences", level: 6, isRequired: true },
      { name: "Physical Sciences", level: 5, isRequired: true },
      { name: "Mathematics", level: 5, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Biomedical Scientist",
      "Laboratory Technologist",
      "Research Scientist",
      "Medical Technologist",
    ],
  },
  {
    name: "Bachelor of Medical Laboratory Science (BMLS)",
    faculty: "Health Sciences",
    description: "Laboratory diagnostics and medical testing.",
    duration: "4 years",
    defaultAps: 30,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "Life Sciences", level: 6, isRequired: true },
      { name: "Physical Sciences", level: 5, isRequired: true },
      { name: "Mathematics", level: 5, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Medical Laboratory Scientist",
      "Laboratory Manager",
      "Clinical Pathologist",
      "Research Technologist",
    ],
  },
  {
    name: "Bachelor of Optometry (BOptom)",
    faculty: "Health Sciences",
    description: "Eye care and vision sciences.",
    duration: "4 years",
    defaultAps: 34,
    assignmentRule: parseExcludeRule("UFH, MUT"),
    subjects: [
      { name: "Physical Sciences", level: 6, isRequired: true },
      { name: "Life Sciences", level: 6, isRequired: true },
      { name: "Mathematics", level: 6, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Optometrist",
      "Eye Care Specialist",
      "Vision Therapist",
      "Optical Practice Owner",
    ],
  },
  {
    name: "Bachelor of Speech-Language Pathology (BSc Speech-Language Pathology)",
    faculty: "Health Sciences",
    description: "Communication disorders and speech therapy.",
    duration: "4 years",
    defaultAps: 32,
    assignmentRule: parseExcludeRule("UFH"),
    subjects: [
      { name: "Life Sciences", level: 5, isRequired: true },
      { name: "English", level: 6, isRequired: true },
      { name: "Mathematics", level: 4, isRequired: true },
    ],
    careerProspects: [
      "Speech-Language Pathologist",
      "Communication Therapist",
      "Educational Therapist",
      "Rehabilitation Specialist",
    ],
  },
  {
    name: "Bachelor of Audiology (BSc Audiology)",
    faculty: "Health Sciences",
    description: "Hearing disorders and audiological rehabilitation.",
    duration: "4 years",
    defaultAps: 32,
    assignmentRule: parseExcludeRule("UFH"),
    subjects: [
      { name: "Physical Sciences", level: 5, isRequired: true },
      { name: "Life Sciences", level: 5, isRequired: true },
      { name: "Mathematics", level: 5, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Audiologist",
      "Hearing Aid Specialist",
      "Cochlear Implant Specialist",
      "Educational Audiologist",
    ],
  },
  {
    name: "Bachelor of Dietetics (BSc Dietetics)",
    faculty: "Health Sciences",
    description: "Nutrition science and dietary therapy.",
    duration: "4 years",
    defaultAps: 30,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "Life Sciences", level: 6, isRequired: true },
      { name: "Physical Sciences", level: 5, isRequired: true },
      { name: "Mathematics", level: 5, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Dietitian",
      "Nutritionist",
      "Sports Nutritionist",
      "Clinical Dietitian",
    ],
  },
  {
    name: "Bachelor of Environmental Health (BSc Environmental Health)",
    faculty: "Health Sciences",
    description: "Environmental factors affecting human health.",
    duration: "4 years",
    defaultAps: 28,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "Life Sciences", level: 5, isRequired: true },
      { name: "Physical Sciences", level: 4, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Environmental Health Officer",
      "Health Inspector",
      "Environmental Consultant",
      "Public Health Specialist",
    ],
  },
  {
    name: "Bachelor of Public Health (BSc Public Health)",
    faculty: "Health Sciences",
    description: "Population health and disease prevention.",
    duration: "3 years",
    defaultAps: 28,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "Life Sciences", level: 5, isRequired: true },
      { name: "English", level: 5, isRequired: true },
      { name: "Mathematics", level: 4, isRequired: true },
    ],
    careerProspects: [
      "Public Health Officer",
      "Epidemiologist",
      "Health Promotion Specialist",
      "Health Policy Analyst",
    ],
  },
  {
    name: "Bachelor of Medical Imaging (BSc Medical Imaging)",
    faculty: "Health Sciences",
    description: "Advanced medical imaging technologies.",
    duration: "4 years",
    defaultAps: 32,
    assignmentRule: parseExcludeRule("UFH"),
    subjects: [
      { name: "Physical Sciences", level: 6, isRequired: true },
      { name: "Mathematics", level: 6, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Medical Imaging Specialist",
      "MRI Technologist",
      "CT Scan Technologist",
      "Ultrasound Technician",
    ],
  },
  {
    name: "Bachelor of Clinical Technology (BSc Clinical Technology)",
    faculty: "Health Sciences",
    description: "Clinical laboratory technology and diagnostics.",
    duration: "4 years",
    defaultAps: 30,
    assignmentRule: parseExcludeRule("UFH"),
    subjects: [
      { name: "Life Sciences", level: 6, isRequired: true },
      { name: "Physical Sciences", level: 5, isRequired: true },
      { name: "Mathematics", level: 5, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Clinical Technologist",
      "Laboratory Supervisor",
      "Medical Equipment Specialist",
      "Quality Control Analyst",
    ],
  },

  // ==============================================
  // Faculty of Humanities / Arts and Social Sciences
  // ==============================================
  {
    name: "Bachelor of Arts (BA) in English",
    faculty: "Humanities",
    description: "English literature, language, and communication studies.",
    duration: "3 years",
    defaultAps: 24,
    assignmentRule: { type: "all" },
    subjects: [{ name: "English", level: 5, isRequired: true }],
    careerProspects: [
      "Teacher",
      "Writer",
      "Editor",
      "Journalist",
      "Communications Specialist",
    ],
  },
  {
    name: "History",
    faculty: "Humanities",
    description: "Study of past events, cultures, and civilizations.",
    duration: "3 years",
    defaultAps: 24,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "English", level: 5, isRequired: true },
      { name: "History", level: 4, isRequired: false },
    ],
    careerProspects: [
      "Historian",
      "Museum Curator",
      "Archivist",
      "Teacher",
      "Cultural Heritage Specialist",
    ],
  },
  {
    name: "Philosophy",
    faculty: "Humanities",
    description: "Critical thinking, logic, and philosophical inquiry.",
    duration: "3 years",
    defaultAps: 26,
    assignmentRule: { type: "all" },
    subjects: [{ name: "English", level: 5, isRequired: true }],
    careerProspects: [
      "Philosopher",
      "Ethicist",
      "Writer",
      "Teacher",
      "Policy Analyst",
    ],
  },
  {
    name: "Sociology",
    faculty: "Humanities",
    description: "Study of society, social behavior, and social structures.",
    duration: "3 years",
    defaultAps: 24,
    assignmentRule: { type: "all" },
    subjects: [{ name: "English", level: 5, isRequired: true }],
    careerProspects: [
      "Social Worker",
      "Community Development Worker",
      "Policy Analyst",
      "Research Analyst",
    ],
  },
  {
    name: "Psychology",
    faculty: "Humanities",
    description: "Study of human behavior, cognition, and mental processes.",
    duration: "3 years",
    defaultAps: 26,
    assignmentRule: { type: "all" },
    universitySpecificAps: { uct: 32, wits: 30, stellenbosch: 29, up: 28 },
    subjects: [
      { name: "English", level: 5, isRequired: true },
      { name: "Mathematics", level: 4, isRequired: true },
    ],
    careerProspects: [
      "Clinical Psychologist",
      "Counselor",
      "Human Resources Specialist",
      "Research Psychologist",
    ],
  },
  {
    name: "Political Science",
    faculty: "Humanities",
    description: "Study of government, politics, and political behavior.",
    duration: "3 years",
    defaultAps: 26,
    assignmentRule: { type: "all" },
    subjects: [{ name: "English", level: 5, isRequired: true }],
    careerProspects: [
      "Political Analyst",
      "Government Official",
      "Diplomat",
      "Policy Researcher",
    ],
  },
  {
    name: "Anthropology",
    faculty: "Humanities",
    description: "Study of human cultures and societies.",
    duration: "3 years",
    defaultAps: 24,
    assignmentRule: parseExcludeRule("UNISA"),
    subjects: [{ name: "English", level: 5, isRequired: true }],
    careerProspects: [
      "Anthropologist",
      "Cultural Consultant",
      "Museum Curator",
      "International Development Worker",
    ],
  },
  {
    name: "Archaeology",
    faculty: "Humanities",
    description: "Study of human history through material remains.",
    duration: "3 years",
    defaultAps: 24,
    assignmentRule: parseExcludeRule("UNISA, MUT"),
    subjects: [{ name: "English", level: 5, isRequired: true }],
    careerProspects: [
      "Archaeologist",
      "Heritage Specialist",
      "Museum Curator",
      "Cultural Resource Manager",
    ],
  },
  {
    name: "Linguistics",
    faculty: "Humanities",
    description: "Scientific study of language and communication.",
    duration: "3 years",
    defaultAps: 26,
    assignmentRule: { type: "all" },
    subjects: [{ name: "English", level: 6, isRequired: true }],
    careerProspects: [
      "Linguist",
      "Language Analyst",
      "Translator",
      "Speech Therapist",
    ],
  },
  {
    name: "Geography",
    faculty: "Humanities",
    description:
      "Study of places, landscapes, and human-environment interactions.",
    duration: "3 years",
    defaultAps: 24,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "English", level: 5, isRequired: true },
      { name: "Geography", level: 4, isRequired: false },
    ],
    careerProspects: [
      "Geographer",
      "Urban Planner",
      "GIS Specialist",
      "Environmental Consultant",
    ],
  },
  {
    name: "Fine Arts",
    faculty: "Humanities",
    description: "Visual arts, painting, sculpture, and artistic expression.",
    duration: "3 years",
    defaultAps: 22,
    assignmentRule: parseExcludeRule("UFH"),
    subjects: [
      { name: "Visual Arts", level: 5, isRequired: true },
      { name: "English", level: 4, isRequired: true },
    ],
    careerProspects: [
      "Artist",
      "Art Teacher",
      "Gallery Curator",
      "Art Therapist",
    ],
  },
  {
    name: "Music",
    faculty: "Humanities",
    description: "Music theory, performance, and composition.",
    duration: "3 years",
    defaultAps: 22,
    assignmentRule: parseExcludeRule("UFH, MUT"),
    subjects: [
      { name: "Music", level: 5, isRequired: true },
      { name: "English", level: 4, isRequired: true },
    ],
    careerProspects: [
      "Musician",
      "Music Teacher",
      "Composer",
      "Music Producer",
    ],
  },
  {
    name: "Theatre Arts",
    faculty: "Humanities",
    description: "Dramatic arts, performance, and theatre production.",
    duration: "3 years",
    defaultAps: 22,
    assignmentRule: parseExcludeRule("UFH, MUT"),
    subjects: [
      { name: "Dramatic Arts", level: 5, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Actor",
      "Theatre Director",
      "Drama Teacher",
      "Theatre Producer",
    ],
  },
  {
    name: "Film and Media Studies",
    faculty: "Humanities",
    description: "Film production, media analysis, and digital communication.",
    duration: "3 years",
    defaultAps: 24,
    assignmentRule: { type: "all" },
    subjects: [{ name: "English", level: 5, isRequired: true }],
    careerProspects: [
      "Filmmaker",
      "Media Analyst",
      "Content Creator",
      "Film Producer",
    ],
  },
  {
    name: "Religious Studies",
    faculty: "Humanities",
    description: "Study of world religions, theology, and spiritual practices.",
    duration: "3 years",
    defaultAps: 22,
    assignmentRule: { type: "all" },
    subjects: [{ name: "English", level: 5, isRequired: true }],
    careerProspects: [
      "Religious Leader",
      "Chaplain",
      "Religious Educator",
      "Community Worker",
    ],
  },
  {
    name: "Gender Studies",
    faculty: "Humanities",
    description: "Study of gender roles, identity, and social equality.",
    duration: "3 years",
    defaultAps: 24,
    assignmentRule: { type: "all" },
    subjects: [{ name: "English", level: 5, isRequired: true }],
    careerProspects: [
      "Gender Specialist",
      "Policy Analyst",
      "Social Worker",
      "Human Rights Advocate",
    ],
  },
  {
    name: "African Studies",
    faculty: "Humanities",
    description: "Study of African cultures, history, and societies.",
    duration: "3 years",
    defaultAps: 22,
    assignmentRule: { type: "all" },
    subjects: [{ name: "English", level: 5, isRequired: true }],
    careerProspects: [
      "African Studies Specialist",
      "Cultural Consultant",
      "International Relations Officer",
      "Researcher",
    ],
  },
  {
    name: "Development Studies",
    faculty: "Humanities",
    description:
      "International development, poverty reduction, and social change.",
    duration: "3 years",
    defaultAps: 26,
    assignmentRule: { type: "all" },
    subjects: [{ name: "English", level: 5, isRequired: true }],
    careerProspects: [
      "Development Worker",
      "NGO Manager",
      "Policy Analyst",
      "Project Manager",
    ],
  },
  {
    name: "International Relations",
    faculty: "Humanities",
    description: "Global politics, diplomacy, and international affairs.",
    duration: "3 years",
    defaultAps: 28,
    assignmentRule: { type: "all" },
    subjects: [{ name: "English", level: 6, isRequired: true }],
    careerProspects: [
      "Diplomat",
      "International Analyst",
      "Foreign Service Officer",
      "Policy Researcher",
    ],
  },
  {
    name: "Communication Science",
    faculty: "Humanities",
    description:
      "Communication theory, media studies, and information systems.",
    duration: "3 years",
    defaultAps: 26,
    assignmentRule: { type: "all" },
    subjects: [{ name: "English", level: 5, isRequired: true }],
    careerProspects: [
      "Communications Specialist",
      "Public Relations Officer",
      "Media Analyst",
      "Content Manager",
    ],
  },
  {
    name: "Journalism",
    faculty: "Humanities",
    description: "News reporting, media ethics, and investigative journalism.",
    duration: "3 years",
    defaultAps: 28,
    assignmentRule: { type: "all" },
    subjects: [{ name: "English", level: 6, isRequired: true }],
    careerProspects: [
      "Journalist",
      "News Reporter",
      "Editor",
      "Media Producer",
    ],
  },
  {
    name: "Public Relations",
    faculty: "Humanities",
    description: "Strategic communication and reputation management.",
    duration: "3 years",
    defaultAps: 26,
    assignmentRule: { type: "all" },
    subjects: [{ name: "English", level: 5, isRequired: true }],
    careerProspects: [
      "Public Relations Manager",
      "Communications Specialist",
      "Brand Manager",
      "Event Coordinator",
    ],
  },
  {
    name: "Publishing",
    faculty: "Humanities",
    description: "Book and digital publishing, editorial work.",
    duration: "3 years",
    defaultAps: 26,
    assignmentRule: parseExcludeRule("UNISA"),
    subjects: [{ name: "English", level: 6, isRequired: true }],
    careerProspects: [
      "Publisher",
      "Editor",
      "Literary Agent",
      "Content Manager",
    ],
  },
  {
    name: "Translation and Interpreting",
    faculty: "Humanities",
    description: "Language translation and interpretation services.",
    duration: "3 years",
    defaultAps: 28,
    assignmentRule: parseMostExceptRule("UCT, SU"),
    subjects: [
      { name: "English", level: 6, isRequired: true },
      { name: "Afrikaans", level: 5, isRequired: false },
    ],
    careerProspects: [
      "Translator",
      "Interpreter",
      "Language Services Manager",
      "Court Interpreter",
    ],
  },
  {
    name: "Creative Writing",
    faculty: "Humanities",
    description: "Fiction, poetry, screenwriting, and literary creation.",
    duration: "3 years",
    defaultAps: 26,
    assignmentRule: { type: "all" },
    subjects: [{ name: "English", level: 6, isRequired: true }],
    careerProspects: ["Writer", "Author", "Screenwriter", "Literary Editor"],
  },
  {
    name: "Visual Arts",
    faculty: "Humanities",
    description: "Painting, sculpture, printmaking, and visual expression.",
    duration: "3 years",
    defaultAps: 22,
    assignmentRule: parseExcludeRule("UFH"),
    subjects: [
      { name: "Visual Arts", level: 5, isRequired: true },
      { name: "English", level: 4, isRequired: true },
    ],
    careerProspects: [
      "Visual Artist",
      "Art Teacher",
      "Gallery Manager",
      "Art Critic",
    ],
  },
  {
    name: "Fashion Design",
    faculty: "Humanities",
    description: "Fashion design, textiles, and apparel creation.",
    duration: "3 years",
    defaultAps: 22,
    assignmentRule: parseMostExceptRule("SU, UCT"),
    subjects: [
      { name: "Visual Arts", level: 4, isRequired: false },
      { name: "English", level: 4, isRequired: true },
    ],
    careerProspects: [
      "Fashion Designer",
      "Textile Designer",
      "Fashion Buyer",
      "Stylist",
    ],
  },
  {
    name: "Interior Design",
    faculty: "Humanities",
    description: "Interior space design and decoration.",
    duration: "3 years",
    defaultAps: 22,
    assignmentRule: parseMostExceptRule("SU, UCT"),
    subjects: [
      { name: "Visual Arts", level: 4, isRequired: false },
      { name: "English", level: 4, isRequired: true },
    ],
    careerProspects: [
      "Interior Designer",
      "Space Planner",
      "Design Consultant",
      "Furniture Designer",
    ],
  },
  {
    name: "Graphic Design",
    faculty: "Humanities",
    description: "Visual communication and graphic design.",
    duration: "3 years",
    defaultAps: 24,
    assignmentRule: parseMostExceptRule("SU, UCT"),
    subjects: [
      { name: "Visual Arts", level: 5, isRequired: true },
      { name: "English", level: 4, isRequired: true },
    ],
    careerProspects: [
      "Graphic Designer",
      "Web Designer",
      "Brand Designer",
      "Art Director",
    ],
  },
  {
    name: "Industrial Design",
    faculty: "Humanities",
    description: "Product design and industrial innovation.",
    duration: "4 years",
    defaultAps: 26,
    assignmentRule: parseMostExceptRule("SU, UCT"),
    subjects: [
      { name: "Visual Arts", level: 4, isRequired: false },
      { name: "Mathematics", level: 5, isRequired: true },
      { name: "English", level: 4, isRequired: true },
    ],
    careerProspects: [
      "Industrial Designer",
      "Product Designer",
      "Design Engineer",
      "Innovation Consultant",
    ],
  },
  {
    name: "Photography",
    faculty: "Humanities",
    description:
      "Photography techniques, digital imaging, and visual storytelling.",
    duration: "3 years",
    defaultAps: 22,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "Visual Arts", level: 4, isRequired: false },
      { name: "English", level: 4, isRequired: true },
    ],
    careerProspects: [
      "Photographer",
      "Photo Editor",
      "Photojournalist",
      "Commercial Photographer",
    ],
  },
  {
    name: "Animation",
    faculty: "Humanities",
    description: "Animation techniques, 3D modeling, and digital storytelling.",
    duration: "3 years",
    defaultAps: 24,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "Visual Arts", level: 4, isRequired: false },
      { name: "English", level: 4, isRequired: true },
    ],
    careerProspects: [
      "Animator",
      "3D Artist",
      "Visual Effects Artist",
      "Game Designer",
    ],
  },
  {
    name: "Film Production",
    faculty: "Humanities",
    description: "Film making, cinematography, and video production.",
    duration: "3 years",
    defaultAps: 24,
    assignmentRule: { type: "all" },
    subjects: [{ name: "English", level: 5, isRequired: true }],
    careerProspects: [
      "Film Producer",
      "Director",
      "Cinematographer",
      "Video Editor",
    ],
  },
  {
    name: "Theatre Production",
    faculty: "Humanities",
    description: "Theatre management, stage design, and production.",
    duration: "3 years",
    defaultAps: 22,
    assignmentRule: { type: "all" },
    subjects: [{ name: "English", level: 5, isRequired: true }],
    careerProspects: [
      "Theatre Producer",
      "Stage Manager",
      "Set Designer",
      "Theatre Director",
    ],
  },

  // ==============================================
  // Faculty of Commerce / Business and Management
  // ==============================================
  {
    name: "Bachelor of Commerce (BCom) in Accounting",
    faculty: "Commerce",
    description: "Professional accounting education with CA(SA) pathway.",
    duration: "3 years",
    defaultAps: 30,
    assignmentRule: { type: "all" },
    universitySpecificAps: { uct: 36, wits: 35, stellenbosch: 34, up: 33 },
    subjects: [
      { name: "Mathematics", level: 5, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Chartered Accountant",
      "Financial Manager",
      "Auditor",
      "Tax Consultant",
    ],
  },
  {
    name: "Finance",
    faculty: "Commerce",
    description:
      "Financial management, investment analysis, and corporate finance.",
    duration: "3 years",
    defaultAps: 30,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "Mathematics", level: 5, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Financial Analyst",
      "Investment Banker",
      "Portfolio Manager",
      "Risk Manager",
    ],
  },
  {
    name: "Economics",
    faculty: "Commerce",
    description: "Economic theory, policy analysis, and market dynamics.",
    duration: "3 years",
    defaultAps: 28,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "Mathematics", level: 5, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Economist",
      "Policy Analyst",
      "Financial Consultant",
      "Market Researcher",
    ],
  },
  {
    name: "Marketing",
    faculty: "Commerce",
    description: "Marketing strategy, consumer behavior, and brand management.",
    duration: "3 years",
    defaultAps: 26,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "English", level: 5, isRequired: true },
      { name: "Mathematics", level: 4, isRequired: true },
    ],
    careerProspects: [
      "Marketing Manager",
      "Brand Manager",
      "Digital Marketer",
      "Market Researcher",
    ],
  },
  {
    name: "Human Resource Management",
    faculty: "Commerce",
    description: "People management, organizational behavior, and HR strategy.",
    duration: "3 years",
    defaultAps: 26,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "English", level: 5, isRequired: true },
      { name: "Mathematics", level: 4, isRequired: true },
    ],
    careerProspects: [
      "HR Manager",
      "Talent Acquisition Specialist",
      "Training Manager",
      "Organizational Development Consultant",
    ],
  },
  {
    name: "Business Management",
    faculty: "Commerce",
    description: "Comprehensive business management and leadership training.",
    duration: "3 years",
    defaultAps: 28,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "Mathematics", level: 4, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Business Manager",
      "Management Consultant",
      "Operations Manager",
      "Project Manager",
    ],
  },
  {
    name: "Supply Chain Management",
    faculty: "Commerce",
    description: "Logistics, procurement, and supply chain optimization.",
    duration: "3 years",
    defaultAps: 26,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "Mathematics", level: 4, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Supply Chain Manager",
      "Logistics Coordinator",
      "Procurement Specialist",
      "Operations Analyst",
    ],
  },
  {
    name: "Logistics",
    faculty: "Commerce",
    description: "Transportation, warehousing, and distribution management.",
    duration: "3 years",
    defaultAps: 24,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "Mathematics", level: 4, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Logistics Manager",
      "Transportation Coordinator",
      "Warehouse Manager",
      "Distribution Specialist",
    ],
  },
  {
    name: "Risk Management",
    faculty: "Commerce",
    description: "Risk assessment, mitigation strategies, and compliance.",
    duration: "3 years",
    defaultAps: 28,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "Mathematics", level: 5, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Risk Manager",
      "Compliance Officer",
      "Insurance Analyst",
      "Credit Analyst",
    ],
  },
  {
    name: "Tourism Management",
    faculty: "Commerce",
    description: "Tourism industry management and hospitality services.",
    duration: "3 years",
    defaultAps: 24,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "English", level: 5, isRequired: true },
      { name: "Mathematics", level: 3, isRequired: true },
    ],
    careerProspects: [
      "Tourism Manager",
      "Travel Agent",
      "Hotel Manager",
      "Event Coordinator",
    ],
  },
  {
    name: "Hospitality Management",
    faculty: "Commerce",
    description: "Hotel and restaurant management, guest services.",
    duration: "3 years",
    defaultAps: 24,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "English", level: 5, isRequired: true },
      { name: "Mathematics", level: 3, isRequired: true },
    ],
    careerProspects: [
      "Hotel Manager",
      "Restaurant Manager",
      "Event Manager",
      "Food Service Director",
    ],
  },
  {
    name: "Public Administration",
    faculty: "Commerce",
    description:
      "Government administration, policy implementation, and public service.",
    duration: "3 years",
    defaultAps: 24,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "English", level: 5, isRequired: true },
      { name: "Mathematics", level: 3, isRequired: true },
    ],
    careerProspects: [
      "Public Administrator",
      "Government Official",
      "Policy Analyst",
      "Municipal Manager",
    ],
  },
  {
    name: "Labour Relations",
    faculty: "Commerce",
    description:
      "Employment law, industrial relations, and workplace mediation.",
    duration: "3 years",
    defaultAps: 26,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "English", level: 5, isRequired: true },
      { name: "Mathematics", level: 4, isRequired: true },
    ],
    careerProspects: [
      "Labour Relations Officer",
      "Industrial Relations Specialist",
      "HR Consultant",
      "Employment Law Adviser",
    ],
  },
  {
    name: "Entrepreneurship",
    faculty: "Commerce",
    description:
      "Business innovation, startup development, and venture creation.",
    duration: "3 years",
    defaultAps: 26,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "English", level: 5, isRequired: true },
      { name: "Mathematics", level: 4, isRequired: true },
    ],
    careerProspects: [
      "Entrepreneur",
      "Business Development Manager",
      "Innovation Consultant",
      "Startup Founder",
    ],
  },
  {
    name: "Banking",
    faculty: "Commerce",
    description:
      "Banking operations, financial services, and credit management.",
    duration: "3 years",
    defaultAps: 28,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "Mathematics", level: 5, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Bank Manager",
      "Credit Analyst",
      "Investment Adviser",
      "Financial Planner",
    ],
  },
  {
    name: "Insurance",
    faculty: "Commerce",
    description: "Insurance products, risk assessment, and claims management.",
    duration: "3 years",
    defaultAps: 26,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "Mathematics", level: 5, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Insurance Broker",
      "Underwriter",
      "Claims Assessor",
      "Risk Analyst",
    ],
  },
  {
    name: "Auditing",
    faculty: "Commerce",
    description:
      "Financial auditing, internal controls, and compliance review.",
    duration: "3 years",
    defaultAps: 30,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "Mathematics", level: 5, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Auditor",
      "Internal Auditor",
      "Forensic Accountant",
      "Compliance Officer",
    ],
  },
  {
    name: "Actuarial Science",
    faculty: "Commerce",
    description: "Mathematical modeling of risk and uncertainty.",
    duration: "3 years",
    defaultAps: 36,
    assignmentRule: parseExcludeRule("UFH, MUT"),
    universitySpecificAps: { uct: 40, wits: 39, stellenbosch: 38, up: 37 },
    subjects: [
      { name: "Mathematics", level: 7, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Actuary",
      "Risk Analyst",
      "Insurance Consultant",
      "Investment Analyst",
    ],
  },
  {
    name: "Taxation",
    faculty: "Commerce",
    description: "Tax law, tax planning, and compliance.",
    duration: "3 years",
    defaultAps: 28,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "Mathematics", level: 5, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Tax Consultant",
      "Tax Adviser",
      "Tax Specialist",
      "Revenue Officer",
    ],
  },
  {
    name: "Investment Management",
    faculty: "Commerce",
    description:
      "Portfolio management, asset allocation, and investment strategy.",
    duration: "3 years",
    defaultAps: 30,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "Mathematics", level: 6, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Investment Manager",
      "Portfolio Manager",
      "Financial Analyst",
      "Investment Adviser",
    ],
  },
  {
    name: "Business Analytics",
    faculty: "Commerce",
    description: "Data analysis, business intelligence, and decision support.",
    duration: "3 years",
    defaultAps: 30,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "Mathematics", level: 6, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Business Analyst",
      "Data Analyst",
      "Business Intelligence Specialist",
      "Data Scientist",
    ],
  },
  {
    name: "Strategic Management",
    faculty: "Commerce",
    description:
      "Corporate strategy, competitive analysis, and organizational planning.",
    duration: "3 years",
    defaultAps: 30,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "English", level: 5, isRequired: true },
      { name: "Mathematics", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Strategic Planner",
      "Management Consultant",
      "Business Development Manager",
      "Corporate Strategist",
    ],
  },
  {
    name: "International Business",
    faculty: "Commerce",
    description:
      "Global business operations, international trade, and cross-cultural management.",
    duration: "3 years",
    defaultAps: 28,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "English", level: 6, isRequired: true },
      { name: "Mathematics", level: 4, isRequired: true },
    ],
    careerProspects: [
      "International Business Manager",
      "Export Manager",
      "Global Marketing Manager",
      "Trade Analyst",
    ],
  },

  // Bachelor of Business Science Programs
  {
    name: "Bachelor of Business Science (BBusSc) in Business Analysis",
    faculty: "Commerce",
    description: "Business process analysis and optimization.",
    duration: "3 years",
    defaultAps: 32,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "Mathematics", level: 6, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Business Analyst",
      "Process Analyst",
      "Systems Analyst",
      "Management Consultant",
    ],
  },
  {
    name: "Business Computing",
    faculty: "Commerce",
    description: "Business applications of computing and information systems.",
    duration: "3 years",
    defaultAps: 30,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "Mathematics", level: 6, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Business Systems Analyst",
      "IT Consultant",
      "Database Administrator",
      "Systems Developer",
    ],
  },
  {
    name: "Business Economics",
    faculty: "Commerce",
    description: "Economic principles applied to business decision-making.",
    duration: "3 years",
    defaultAps: 30,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "Mathematics", level: 6, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Business Economist",
      "Economic Analyst",
      "Market Researcher",
      "Policy Analyst",
    ],
  },
  {
    name: "Business Finance",
    faculty: "Commerce",
    description:
      "Corporate finance, financial markets, and investment analysis.",
    duration: "3 years",
    defaultAps: 32,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "Mathematics", level: 6, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Financial Analyst",
      "Corporate Finance Manager",
      "Investment Banking Analyst",
      "Treasury Manager",
    ],
  },
  {
    name: "Business Law",
    faculty: "Commerce",
    description: "Commercial law, contracts, and business regulations.",
    duration: "3 years",
    defaultAps: 30,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "English", level: 6, isRequired: true },
      { name: "Mathematics", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Corporate Lawyer",
      "Legal Adviser",
      "Compliance Officer",
      "Contract Specialist",
    ],
  },
  {
    name: "Business Marketing",
    faculty: "Commerce",
    description: "Advanced marketing strategy and consumer analytics.",
    duration: "3 years",
    defaultAps: 28,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "English", level: 5, isRequired: true },
      { name: "Mathematics", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Marketing Manager",
      "Brand Strategist",
      "Market Research Analyst",
      "Digital Marketing Manager",
    ],
  },
  {
    name: "Business Statistics",
    faculty: "Commerce",
    description: "Statistical analysis for business decision-making.",
    duration: "3 years",
    defaultAps: 32,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "Mathematics", level: 7, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Business Statistician",
      "Data Analyst",
      "Market Research Manager",
      "Quality Control Analyst",
    ],
  },
  {
    name: "Business Strategy",
    faculty: "Commerce",
    description:
      "Strategic planning, competitive analysis, and organizational design.",
    duration: "3 years",
    defaultAps: 30,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "English", level: 5, isRequired: true },
      { name: "Mathematics", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Strategy Consultant",
      "Business Development Manager",
      "Corporate Planner",
      "Management Consultant",
    ],
  },

  // Bachelor of Administration Programs
  {
    name: "Bachelor of Administration (BAdmin) in Public Administration",
    faculty: "Commerce",
    description: "Government administration and public sector management.",
    duration: "3 years",
    defaultAps: 24,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "English", level: 5, isRequired: true },
      { name: "Mathematics", level: 3, isRequired: true },
    ],
    careerProspects: [
      "Public Administrator",
      "Government Manager",
      "Policy Analyst",
      "Municipal Officer",
    ],
  },
  {
    name: "Local Government",
    faculty: "Commerce",
    description: "Municipal administration and local government management.",
    duration: "3 years",
    defaultAps: 22,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "English", level: 5, isRequired: true },
      { name: "Mathematics", level: 3, isRequired: true },
    ],
    careerProspects: [
      "Municipal Manager",
      "Local Government Officer",
      "Community Development Manager",
      "Public Works Manager",
    ],
  },
  {
    name: "Municipal Governance",
    faculty: "Commerce",
    description:
      "Municipal systems, governance structures, and civic administration.",
    duration: "3 years",
    defaultAps: 22,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "English", level: 5, isRequired: true },
      { name: "Mathematics", level: 3, isRequired: true },
    ],
    careerProspects: [
      "Municipal Governance Specialist",
      "Civic Administrator",
      "Public Policy Analyst",
      "Community Liaison Officer",
    ],
  },

  // ==============================================
  // Faculty of Law
  // ==============================================
  {
    name: "Bachelor of Laws (LLB)",
    faculty: "Law",
    description: "Comprehensive legal education covering all areas of law.",
    duration: "4 years",
    defaultAps: 32,
    assignmentRule: { type: "all" },
    universitySpecificAps: { uct: 38, wits: 36, stellenbosch: 35, up: 34 },
    subjects: [
      { name: "English", level: 6, isRequired: true },
      { name: "Mathematics", level: 4, isRequired: true },
    ],
    careerProspects: [
      "Advocate",
      "Attorney",
      "Legal Advisor",
      "Magistrate",
      "Corporate Lawyer",
    ],
  },
  {
    name: "Bachelor of Criminal Justice",
    faculty: "Law",
    description:
      "Criminal law, criminology, and justice system administration.",
    duration: "3 years",
    defaultAps: 28,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "English", level: 5, isRequired: true },
      { name: "Mathematics", level: 4, isRequired: true },
    ],
    careerProspects: [
      "Police Officer",
      "Probation Officer",
      "Criminal Investigator",
      "Correctional Officer",
    ],
  },
  {
    name: "Bachelor of Forensic Science",
    faculty: "Law",
    description: "Scientific investigation techniques and forensic analysis.",
    duration: "3 years",
    defaultAps: 32,
    assignmentRule: parseExcludeRule("UFH, MUT"),
    subjects: [
      { name: "Physical Sciences", level: 6, isRequired: true },
      { name: "Life Sciences", level: 5, isRequired: true },
      { name: "Mathematics", level: 5, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Forensic Scientist",
      "Crime Scene Investigator",
      "DNA Analyst",
      "Forensic Pathologist",
    ],
  },
  {
    name: "Bachelor of International Law",
    faculty: "Law",
    description:
      "International legal systems, human rights, and diplomatic law.",
    duration: "4 years",
    defaultAps: 34,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "English", level: 6, isRequired: true },
      { name: "Mathematics", level: 4, isRequired: true },
    ],
    careerProspects: [
      "International Lawyer",
      "Diplomat",
      "Human Rights Advocate",
      "International Trade Lawyer",
    ],
  },
  {
    name: "Bachelor of Environmental Law",
    faculty: "Law",
    description:
      "Environmental legislation, sustainability law, and natural resource management.",
    duration: "4 years",
    defaultAps: 32,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "English", level: 6, isRequired: true },
      { name: "Life Sciences", level: 4, isRequired: false },
    ],
    careerProspects: [
      "Environmental Lawyer",
      "Sustainability Consultant",
      "Environmental Compliance Officer",
      "Natural Resource Lawyer",
    ],
  },
  {
    name: "Bachelor of Labour Law",
    faculty: "Law",
    description:
      "Employment law, industrial relations, and workplace legislation.",
    duration: "4 years",
    defaultAps: 30,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "English", level: 6, isRequired: true },
      { name: "Mathematics", level: 4, isRequired: true },
    ],
    careerProspects: [
      "Labour Lawyer",
      "Employment Law Specialist",
      "Industrial Relations Lawyer",
      "Trade Union Adviser",
    ],
  },
  {
    name: "Bachelor of Tax Law",
    faculty: "Law",
    description: "Tax legislation, revenue law, and fiscal policy.",
    duration: "4 years",
    defaultAps: 32,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "English", level: 6, isRequired: true },
      { name: "Mathematics", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Tax Lawyer",
      "Revenue Lawyer",
      "Tax Consultant",
      "Fiscal Policy Analyst",
    ],
  },
  {
    name: "Bachelor of Commercial Law",
    faculty: "Law",
    description:
      "Business law, corporate governance, and commercial transactions.",
    duration: "4 years",
    defaultAps: 32,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "English", level: 6, isRequired: true },
      { name: "Mathematics", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Commercial Lawyer",
      "Corporate Lawyer",
      "Contract Specialist",
      "Business Legal Adviser",
    ],
  },
  {
    name: "Bachelor of Constitutional Law",
    faculty: "Law",
    description:
      "Constitutional principles, government law, and administrative justice.",
    duration: "4 years",
    defaultAps: 34,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "English", level: 6, isRequired: true },
      { name: "History", level: 4, isRequired: false },
    ],
    careerProspects: [
      "Constitutional Lawyer",
      "Government Legal Adviser",
      "Constitutional Court Clerk",
      "Administrative Law Specialist",
    ],
  },
  {
    name: "Bachelor of Human Rights Law",
    faculty: "Law",
    description:
      "Human rights legislation, civil liberties, and social justice.",
    duration: "4 years",
    defaultAps: 32,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "English", level: 6, isRequired: true },
      { name: "History", level: 4, isRequired: false },
    ],
    careerProspects: [
      "Human Rights Lawyer",
      "Civil Rights Advocate",
      "Social Justice Lawyer",
      "NGO Legal Adviser",
    ],
  },

  // ==============================================
  // Faculty of Science / Natural Sciences
  // ==============================================
  {
    name: "Bachelor of Science (BSc) in Biological Sciences",
    faculty: "Science",
    description:
      "Comprehensive study of living organisms from molecular to ecosystem levels.",
    duration: "3 years",
    defaultAps: 30,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "Life Sciences", level: 6, isRequired: true },
      { name: "Mathematics", level: 5, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Biologist",
      "Research Scientist",
      "Conservation Scientist",
      "Biotechnologist",
    ],
  },
  {
    name: "Chemistry",
    faculty: "Science",
    description:
      "Chemical processes, molecular structures, and laboratory analysis.",
    duration: "3 years",
    defaultAps: 32,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "Physical Sciences", level: 6, isRequired: true },
      { name: "Mathematics", level: 6, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Chemist",
      "Laboratory Analyst",
      "Chemical Engineer",
      "Research Scientist",
    ],
  },
  {
    name: "Physics",
    faculty: "Science",
    description: "Physical laws, quantum mechanics, and applied physics.",
    duration: "3 years",
    defaultAps: 34,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "Physical Sciences", level: 7, isRequired: true },
      { name: "Mathematics", level: 7, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Physicist",
      "Research Scientist",
      "Engineering Physicist",
      "Medical Physicist",
    ],
  },
  {
    name: "Mathematics",
    faculty: "Science",
    description: "Pure and applied mathematics with analytical focus.",
    duration: "3 years",
    defaultAps: 34,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "Mathematics", level: 7, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Mathematician",
      "Actuary",
      "Data Scientist",
      "Financial Analyst",
    ],
  },
  {
    name: "Computer Science",
    faculty: "Science",
    description:
      "Comprehensive computer science program with programming and algorithms.",
    duration: "3 years",
    defaultAps: 32,
    assignmentRule: { type: "all" },
    universitySpecificAps: { uct: 38, wits: 36, stellenbosch: 35, up: 34 },
    subjects: [
      { name: "Mathematics", level: 6, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Software Developer",
      "Data Scientist",
      "Systems Analyst",
      "AI Specialist",
    ],
  },
  {
    name: "Environmental Science",
    faculty: "Science",
    description:
      "Environmental systems, conservation, and sustainability science.",
    duration: "3 years",
    defaultAps: 28,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "Life Sciences", level: 5, isRequired: true },
      { name: "Physical Sciences", level: 5, isRequired: true },
      { name: "Mathematics", level: 5, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Environmental Scientist",
      "Conservation Biologist",
      "Environmental Consultant",
      "Sustainability Specialist",
    ],
  },
  {
    name: "Geology",
    faculty: "Science",
    description: "Earth sciences, mineralogy, and geological processes.",
    duration: "3 years",
    defaultAps: 30,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "Physical Sciences", level: 6, isRequired: true },
      { name: "Mathematics", level: 5, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Geologist",
      "Mining Geologist",
      "Environmental Geologist",
      "Petroleum Geologist",
    ],
  },
  {
    name: "Statistics",
    faculty: "Science",
    description: "Statistical analysis, data modeling, and probability theory.",
    duration: "3 years",
    defaultAps: 32,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "Mathematics", level: 6, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Statistician",
      "Data Analyst",
      "Biostatistician",
      "Market Research Analyst",
    ],
  },
  {
    name: "Biochemistry",
    faculty: "Science",
    description: "Chemical processes in living organisms.",
    duration: "3 years",
    defaultAps: 32,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "Life Sciences", level: 6, isRequired: true },
      { name: "Physical Sciences", level: 6, isRequired: true },
      { name: "Mathematics", level: 5, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Biochemist",
      "Research Scientist",
      "Laboratory Manager",
      "Pharmaceutical Researcher",
    ],
  },
  {
    name: "Microbiology",
    faculty: "Science",
    description: "Study of microorganisms and their applications.",
    duration: "3 years",
    defaultAps: 30,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "Life Sciences", level: 6, isRequired: true },
      { name: "Physical Sciences", level: 5, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Microbiologist",
      "Laboratory Technologist",
      "Quality Control Analyst",
      "Public Health Microbiologist",
    ],
  },
  {
    name: "Genetics",
    faculty: "Science",
    description: "Heredity, gene expression, and genetic engineering.",
    duration: "3 years",
    defaultAps: 32,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "Life Sciences", level: 6, isRequired: true },
      { name: "Mathematics", level: 5, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Geneticist",
      "Genetic Counselor",
      "Research Scientist",
      "Biotechnology Specialist",
    ],
  },
  {
    name: "Botany",
    faculty: "Science",
    description: "Plant biology, ecology, and botanical research.",
    duration: "3 years",
    defaultAps: 28,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "Life Sciences", level: 6, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Botanist",
      "Plant Ecologist",
      "Conservation Scientist",
      "Agricultural Researcher",
    ],
  },
  {
    name: "Zoology",
    faculty: "Science",
    description: "Animal biology, behavior, and wildlife conservation.",
    duration: "3 years",
    defaultAps: 28,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "Life Sciences", level: 6, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Zoologist",
      "Wildlife Biologist",
      "Conservation Officer",
      "Animal Behaviorist",
    ],
  },
  {
    name: "Astronomy",
    faculty: "Science",
    description: "Celestial objects, space science, and astrophysics.",
    duration: "3 years",
    defaultAps: 36,
    assignmentRule: parseMostExceptRule("UCT, RU"),
    subjects: [
      { name: "Physical Sciences", level: 7, isRequired: true },
      { name: "Mathematics", level: 7, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Astronomer",
      "Astrophysicist",
      "Space Scientist",
      "Observatory Researcher",
    ],
  },
  {
    name: "Meteorology",
    faculty: "Science",
    description: "Weather patterns, climate science, and atmospheric physics.",
    duration: "3 years",
    defaultAps: 34,
    assignmentRule: parseMostExceptRule("UCT, RU"),
    subjects: [
      { name: "Physical Sciences", level: 6, isRequired: true },
      { name: "Mathematics", level: 6, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Meteorologist",
      "Climate Scientist",
      "Weather Forecaster",
      "Atmospheric Researcher",
    ],
  },
  {
    name: "Marine Biology",
    faculty: "Science",
    description: "Ocean life, marine ecosystems, and aquatic research.",
    duration: "3 years",
    defaultAps: 30,
    assignmentRule: parseMostExceptRule("UCT, RU"),
    subjects: [
      { name: "Life Sciences", level: 6, isRequired: true },
      { name: "Physical Sciences", level: 5, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Marine Biologist",
      "Oceanographer",
      "Aquatic Ecologist",
      "Fisheries Scientist",
    ],
  },
  {
    name: "Biotechnology",
    faculty: "Science",
    description: "Biological processes for technological applications.",
    duration: "3 years",
    defaultAps: 32,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "Life Sciences", level: 6, isRequired: true },
      { name: "Physical Sciences", level: 5, isRequired: true },
      { name: "Mathematics", level: 5, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Biotechnologist",
      "Bioprocess Engineer",
      "Research Scientist",
      "Pharmaceutical Developer",
    ],
  },
  {
    name: "Ecology",
    faculty: "Science",
    description:
      "Ecosystem interactions, biodiversity, and environmental relationships.",
    duration: "3 years",
    defaultAps: 28,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "Life Sciences", level: 6, isRequired: true },
      { name: "Mathematics", level: 4, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Ecologist",
      "Environmental Consultant",
      "Conservation Biologist",
      "Wildlife Manager",
    ],
  },
  {
    name: "Entomology",
    faculty: "Science",
    description: "Study of insects and their role in ecosystems.",
    duration: "3 years",
    defaultAps: 26,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "Life Sciences", level: 5, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Entomologist",
      "Pest Control Specialist",
      "Agricultural Consultant",
      "Vector Control Officer",
    ],
  },
  {
    name: "Mycology",
    faculty: "Science",
    description: "Study of fungi and their applications.",
    duration: "3 years",
    defaultAps: 26,
    assignmentRule: parseExcludeRule("UFH"),
    subjects: [
      { name: "Life Sciences", level: 5, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Mycologist",
      "Fungal Researcher",
      "Agricultural Specialist",
      "Food Safety Inspector",
    ],
  },
  {
    name: "Phycology",
    faculty: "Science",
    description: "Study of algae and aquatic plant life.",
    duration: "3 years",
    defaultAps: 26,
    assignmentRule: parseExcludeRule("UFH"),
    subjects: [
      { name: "Life Sciences", level: 5, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Phycologist",
      "Aquatic Researcher",
      "Environmental Consultant",
      "Marine Scientist",
    ],
  },
  {
    name: "Limnology",
    faculty: "Science",
    description: "Study of freshwater ecosystems and lake environments.",
    duration: "3 years",
    defaultAps: 26,
    assignmentRule: parseExcludeRule("UFH"),
    subjects: [
      { name: "Life Sciences", level: 5, isRequired: true },
      { name: "Physical Sciences", level: 4, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Limnologist",
      "Freshwater Ecologist",
      "Water Quality Specialist",
      "Environmental Consultant",
    ],
  },
  {
    name: "Hydrology",
    faculty: "Science",
    description: "Water cycle, water resources, and hydrological systems.",
    duration: "3 years",
    defaultAps: 28,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "Physical Sciences", level: 5, isRequired: true },
      { name: "Mathematics", level: 5, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Hydrologist",
      "Water Resource Manager",
      "Environmental Engineer",
      "Climate Researcher",
    ],
  },
  {
    name: "Soil Science",
    faculty: "Science",
    description: "Soil formation, composition, and agricultural applications.",
    duration: "3 years",
    defaultAps: 26,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "Life Sciences", level: 5, isRequired: true },
      { name: "Physical Sciences", level: 5, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Soil Scientist",
      "Agricultural Consultant",
      "Environmental Scientist",
      "Land Use Planner",
    ],
  },
  {
    name: "Agricultural Science",
    faculty: "Science",
    description: "Crop production, animal husbandry, and farming systems.",
    duration: "3 years",
    defaultAps: 24,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "Life Sciences", level: 5, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Agricultural Scientist",
      "Farm Manager",
      "Agricultural Extension Officer",
      "Crop Consultant",
    ],
  },

  // ==============================================
  // Faculty of Education
  // ==============================================
  {
    name: "Bachelor of Education (BEd) in Foundation Phase",
    faculty: "Education",
    description: "Teacher training for Grade R to Grade 3.",
    duration: "4 years",
    defaultAps: 22,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "English", level: 5, isRequired: true },
      { name: "Mathematics", level: 4, isRequired: true },
    ],
    careerProspects: [
      "Foundation Phase Teacher",
      "Education Specialist",
      "Curriculum Developer",
      "Educational Consultant",
    ],
  },
  {
    name: "Intermediate Phase",
    faculty: "Education",
    description: "Teacher training for Grade 4 to Grade 6.",
    duration: "4 years",
    defaultAps: 22,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "English", level: 5, isRequired: true },
      { name: "Mathematics", level: 4, isRequired: true },
    ],
    careerProspects: [
      "Intermediate Phase Teacher",
      "Subject Specialist",
      "Educational Coordinator",
      "Curriculum Advisor",
    ],
  },
  {
    name: "Senior Phase",
    faculty: "Education",
    description: "Teacher training for Grade 7 to Grade 9.",
    duration: "4 years",
    defaultAps: 24,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "English", level: 5, isRequired: true },
      { name: "Mathematics", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Senior Phase Teacher",
      "Subject Head",
      "Educational Specialist",
      "Academic Coordinator",
    ],
  },
  {
    name: "Further Education and Training (FET) Phase",
    faculty: "Education",
    description: "Teacher training for Grade 10 to Grade 12.",
    duration: "4 years",
    defaultAps: 26,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "English", level: 5, isRequired: true },
      { name: "Mathematics", level: 5, isRequired: true },
    ],
    careerProspects: [
      "FET Teacher",
      "Subject Specialist",
      "Department Head",
      "Educational Leader",
    ],
  },
  {
    name: "Special Education",
    faculty: "Education",
    description: "Education for learners with special needs and disabilities.",
    duration: "4 years",
    defaultAps: 24,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "English", level: 5, isRequired: true },
      { name: "Mathematics", level: 4, isRequired: true },
    ],
    careerProspects: [
      "Special Needs Teacher",
      "Educational Therapist",
      "Inclusive Education Specialist",
      "Learning Support Coordinator",
    ],
  },
  {
    name: "Adult Education",
    faculty: "Education",
    description: "Education and training for adult learners.",
    duration: "4 years",
    defaultAps: 22,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "English", level: 5, isRequired: true },
      { name: "Mathematics", level: 3, isRequired: true },
    ],
    careerProspects: [
      "Adult Education Coordinator",
      "Skills Development Facilitator",
      "Community Education Officer",
      "Training Specialist",
    ],
  },
  {
    name: "Educational Psychology",
    faculty: "Education",
    description: "Psychology applied to educational settings and learning.",
    duration: "4 years",
    defaultAps: 28,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "English", level: 5, isRequired: true },
      { name: "Mathematics", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Educational Psychologist",
      "School Counselor",
      "Learning Support Specialist",
      "Educational Researcher",
    ],
  },
  {
    name: "Educational Management",
    faculty: "Education",
    description:
      "School administration, leadership, and educational governance.",
    duration: "4 years",
    defaultAps: 26,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "English", level: 5, isRequired: true },
      { name: "Mathematics", level: 4, isRequired: true },
    ],
    careerProspects: [
      "School Principal",
      "Educational Manager",
      "District Official",
      "Educational Administrator",
    ],
  },
  {
    name: "Curriculum Studies",
    faculty: "Education",
    description: "Curriculum development, assessment, and educational design.",
    duration: "4 years",
    defaultAps: 26,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "English", level: 5, isRequired: true },
      { name: "Mathematics", level: 4, isRequired: true },
    ],
    careerProspects: [
      "Curriculum Developer",
      "Educational Consultant",
      "Assessment Specialist",
      "Instructional Designer",
    ],
  },
  {
    name: "Language Education",
    faculty: "Education",
    description: "Teaching of languages and language acquisition.",
    duration: "4 years",
    defaultAps: 24,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "English", level: 6, isRequired: true },
      { name: "Afrikaans", level: 4, isRequired: false },
    ],
    careerProspects: [
      "Language Teacher",
      "Language Coordinator",
      "ESL Instructor",
      "Language Curriculum Developer",
    ],
  },
  {
    name: "Mathematics Education",
    faculty: "Education",
    description: "Teaching of mathematics and mathematical concepts.",
    duration: "4 years",
    defaultAps: 26,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "Mathematics", level: 6, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Mathematics Teacher",
      "Mathematics Coordinator",
      "Educational Specialist",
      "Curriculum Developer",
    ],
  },
  {
    name: "Science Education",
    faculty: "Education",
    description: "Teaching of natural sciences and scientific inquiry.",
    duration: "4 years",
    defaultAps: 26,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "Physical Sciences", level: 5, isRequired: true },
      { name: "Life Sciences", level: 5, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Science Teacher",
      "Science Coordinator",
      "Educational Researcher",
      "STEM Specialist",
    ],
  },
  {
    name: "Technology Education",
    faculty: "Education",
    description: "Teaching of technology and technical skills.",
    duration: "4 years",
    defaultAps: 24,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "Mathematics", level: 5, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Technology Teacher",
      "Technical Skills Instructor",
      "STEM Coordinator",
      "Innovation Educator",
    ],
  },
  {
    name: "Social Sciences Education",
    faculty: "Education",
    description: "Teaching of history, geography, and social studies.",
    duration: "4 years",
    defaultAps: 22,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "English", level: 5, isRequired: true },
      { name: "History", level: 4, isRequired: false },
    ],
    careerProspects: [
      "Social Sciences Teacher",
      "History Teacher",
      "Geography Teacher",
      "Social Studies Coordinator",
    ],
  },
  {
    name: "Life Orientation Education",
    faculty: "Education",
    description: "Teaching of life skills and personal development.",
    duration: "4 years",
    defaultAps: 22,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "English", level: 5, isRequired: true },
      { name: "Life Orientation", level: 4, isRequired: false },
    ],
    careerProspects: [
      "Life Orientation Teacher",
      "Life Skills Coordinator",
      "Guidance Counselor",
      "Youth Development Officer",
    ],
  },
  {
    name: "Arts and Culture Education",
    faculty: "Education",
    description: "Teaching of creative arts and cultural studies.",
    duration: "4 years",
    defaultAps: 22,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "English", level: 5, isRequired: true },
      { name: "Visual Arts", level: 4, isRequired: false },
    ],
    careerProspects: [
      "Arts Teacher",
      "Cultural Education Coordinator",
      "Creative Arts Specialist",
      "Cultural Heritage Educator",
    ],
  },
  {
    name: "Economic and Management Sciences Education",
    faculty: "Education",
    description: "Teaching of business studies and economics.",
    duration: "4 years",
    defaultAps: 24,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "English", level: 5, isRequired: true },
      { name: "Mathematics", level: 4, isRequired: true },
    ],
    careerProspects: [
      "Business Studies Teacher",
      "Economics Teacher",
      "EMS Coordinator",
      "Entrepreneurship Educator",
    ],
  },
  {
    name: "Physical Education",
    faculty: "Education",
    description: "Teaching of physical education and sports science.",
    duration: "4 years",
    defaultAps: 22,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "English", level: 5, isRequired: true },
      { name: "Life Sciences", level: 4, isRequired: false },
    ],
    careerProspects: [
      "Physical Education Teacher",
      "Sports Coach",
      "Fitness Instructor",
      "Recreation Manager",
    ],
  },

  // ==============================================
  // Faculty of Agriculture / Agricultural Sciences
  // ==============================================
  {
    name: "Bachelor of Agriculture in Animal Science",
    faculty: "Agriculture",
    description:
      "Animal husbandry, livestock management, and animal nutrition.",
    duration: "4 years",
    defaultAps: 26,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "Life Sciences", level: 5, isRequired: true },
      { name: "Mathematics", level: 4, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Animal Scientist",
      "Livestock Manager",
      "Animal Nutritionist",
      "Veterinary Technician",
    ],
  },
  {
    name: "Plant Production",
    faculty: "Agriculture",
    description: "Crop science, plant breeding, and agricultural production.",
    duration: "4 years",
    defaultAps: 24,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "Life Sciences", level: 5, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Plant Scientist",
      "Crop Specialist",
      "Agricultural Extension Officer",
      "Farm Manager",
    ],
  },
  {
    name: "Agricultural Economics",
    faculty: "Agriculture",
    description: "Economics applied to agricultural systems and food markets.",
    duration: "4 years",
    defaultAps: 26,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "Mathematics", level: 5, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Agricultural Economist",
      "Farm Business Consultant",
      "Agricultural Policy Analyst",
      "Market Research Specialist",
    ],
  },
  {
    name: "Agricultural Extension",
    faculty: "Agriculture",
    description: "Knowledge transfer and farmer education.",
    duration: "4 years",
    defaultAps: 22,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "English", level: 5, isRequired: true },
      { name: "Life Sciences", level: 4, isRequired: true },
    ],
    careerProspects: [
      "Agricultural Extension Officer",
      "Rural Development Specialist",
      "Farmer Educator",
      "Community Development Officer",
    ],
  },
  {
    name: "Horticulture",
    faculty: "Agriculture",
    description: "Fruit, vegetable, and ornamental plant production.",
    duration: "4 years",
    defaultAps: 24,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "Life Sciences", level: 5, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Horticulturist",
      "Garden Designer",
      "Nursery Manager",
      "Greenhouse Specialist",
    ],
  },
  {
    name: "Viticulture and Oenology",
    faculty: "Agriculture",
    description: "Wine grape production and wine making.",
    duration: "4 years",
    defaultAps: 28,
    assignmentRule: parseMostExceptRule("SU, UCT"),
    subjects: [
      { name: "Life Sciences", level: 5, isRequired: true },
      { name: "Physical Sciences", level: 4, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Viticulturist",
      "Winemaker",
      "Wine Quality Specialist",
      "Vineyard Manager",
    ],
  },
  {
    name: "Agricultural Management",
    faculty: "Agriculture",
    description: "Farm business management and agricultural operations.",
    duration: "4 years",
    defaultAps: 24,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "English", level: 5, isRequired: true },
      { name: "Mathematics", level: 4, isRequired: true },
    ],
    careerProspects: [
      "Farm Manager",
      "Agricultural Business Manager",
      "Rural Development Manager",
      "Agricultural Consultant",
    ],
  },
  {
    name: "Food Science and Technology",
    faculty: "Agriculture",
    description: "Food processing, preservation, and quality control.",
    duration: "4 years",
    defaultAps: 28,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "Physical Sciences", level: 5, isRequired: true },
      { name: "Life Sciences", level: 5, isRequired: true },
      { name: "Mathematics", level: 5, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Food Technologist",
      "Quality Control Manager",
      "Food Safety Inspector",
      "Product Development Specialist",
    ],
  },
  {
    name: "Forestry",
    faculty: "Agriculture",
    description: "Forest management, conservation, and timber production.",
    duration: "4 years",
    defaultAps: 26,
    assignmentRule: parseMostExceptRule("SU, UCT"),
    subjects: [
      { name: "Life Sciences", level: 5, isRequired: true },
      { name: "Mathematics", level: 4, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Forester",
      "Forest Manager",
      "Conservation Officer",
      "Timber Specialist",
    ],
  },
  {
    name: "Game Ranch Management",
    faculty: "Agriculture",
    description: "Wildlife management and game farming.",
    duration: "4 years",
    defaultAps: 24,
    assignmentRule: parseMostExceptRule("UFH, RU"),
    subjects: [
      { name: "Life Sciences", level: 5, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Game Ranch Manager",
      "Wildlife Manager",
      "Conservation Officer",
      "Ecotourism Manager",
    ],
  },
  {
    name: "Irrigation Management",
    faculty: "Agriculture",
    description: "Water management systems for agriculture.",
    duration: "4 years",
    defaultAps: 26,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "Mathematics", level: 5, isRequired: true },
      { name: "Physical Sciences", level: 4, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Irrigation Engineer",
      "Water Management Specialist",
      "Agricultural Engineer",
      "Farm Systems Manager",
    ],
  },
  {
    name: "Organic Farming",
    faculty: "Agriculture",
    description: "Sustainable and organic agricultural practices.",
    duration: "4 years",
    defaultAps: 24,
    assignmentRule: parseMostExceptRule("SU"),
    subjects: [
      { name: "Life Sciences", level: 5, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Organic Farm Manager",
      "Sustainable Agriculture Consultant",
      "Organic Certification Specialist",
      "Environmental Farmer",
    ],
  },
  {
    name: "Precision Agriculture",
    faculty: "Agriculture",
    description: "Technology-enhanced farming and agricultural innovation.",
    duration: "4 years",
    defaultAps: 28,
    assignmentRule: parseMostExceptRule("SU, UCT"),
    subjects: [
      { name: "Mathematics", level: 5, isRequired: true },
      { name: "Life Sciences", level: 5, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Precision Agriculture Specialist",
      "Agricultural Technology Consultant",
      "GPS Farming Specialist",
      "Agricultural Data Analyst",
    ],
  },
  {
    name: "Rural Development",
    faculty: "Agriculture",
    description: "Rural community development and agricultural extension.",
    duration: "4 years",
    defaultAps: 22,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "English", level: 5, isRequired: true },
      { name: "Life Sciences", level: 4, isRequired: false },
    ],
    careerProspects: [
      "Rural Development Officer",
      "Community Development Specialist",
      "Agricultural Extension Officer",
      "NGO Program Manager",
    ],
  },

  // ==============================================
  // Faculty of Information Technology / Computer Science
  // ==============================================
  {
    name: "Bachelor of Information Technology (BIT)",
    faculty: "Information Technology",
    description:
      "Information systems, database management, and IT infrastructure.",
    duration: "3 years",
    defaultAps: 28,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "Mathematics", level: 5, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "IT Specialist",
      "Database Administrator",
      "Systems Analyst",
      "Network Administrator",
    ],
  },
  {
    name: "Bachelor of Science in Computer Science (BSc Computer Science)",
    faculty: "Information Technology",
    description: "Advanced computer science theory and programming.",
    duration: "3 years",
    defaultAps: 32,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "Mathematics", level: 6, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Software Developer",
      "Systems Architect",
      "AI Researcher",
      "Data Scientist",
    ],
  },
  {
    name: "Bachelor of Software Engineering (BSc Software Engineering)",
    faculty: "Information Technology",
    description:
      "Software development methodologies and engineering practices.",
    duration: "4 years",
    defaultAps: 30,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "Mathematics", level: 6, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Software Engineer",
      "Application Developer",
      "Technical Lead",
      "DevOps Engineer",
    ],
  },
  {
    name: "Bachelor of Information Systems (BIS)",
    faculty: "Information Technology",
    description: "Business information systems and technology management.",
    duration: "3 years",
    defaultAps: 28,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "Mathematics", level: 5, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Information Systems Analyst",
      "IT Business Analyst",
      "ERP Consultant",
      "Technology Manager",
    ],
  },
  {
    name: "Bachelor of Cybersecurity",
    faculty: "Information Technology",
    description: "Information security, cyber defense, and digital forensics.",
    duration: "3 years",
    defaultAps: 30,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "Mathematics", level: 6, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Cybersecurity Analyst",
      "Information Security Officer",
      "Penetration Tester",
      "Security Consultant",
    ],
  },
  {
    name: "Bachelor of Data Science",
    faculty: "Information Technology",
    description:
      "Big data analytics, machine learning, and statistical modeling.",
    duration: "3 years",
    defaultAps: 32,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "Mathematics", level: 6, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Data Scientist",
      "Machine Learning Engineer",
      "Business Intelligence Analyst",
      "Research Scientist",
    ],
  },
  {
    name: "Bachelor of Artificial Intelligence",
    faculty: "Information Technology",
    description: "AI algorithms, neural networks, and intelligent systems.",
    duration: "3 years",
    defaultAps: 34,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "Mathematics", level: 7, isRequired: true },
      { name: "Physical Sciences", level: 5, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "AI Engineer",
      "Machine Learning Specialist",
      "AI Researcher",
      "Robotics Engineer",
    ],
  },
  {
    name: "Bachelor of Game Development",
    faculty: "Information Technology",
    description: "Video game programming, design, and interactive media.",
    duration: "3 years",
    defaultAps: 28,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "Mathematics", level: 5, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Game Developer",
      "Game Designer",
      "3D Artist",
      "Interactive Media Developer",
    ],
  },
  {
    name: "Bachelor of Web Development",
    faculty: "Information Technology",
    description: "Web technologies, frontend and backend development.",
    duration: "3 years",
    defaultAps: 26,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "Mathematics", level: 5, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Web Developer",
      "Frontend Developer",
      "Backend Developer",
      "Full-Stack Developer",
    ],
  },
  {
    name: "Bachelor of Mobile Application Development",
    faculty: "Information Technology",
    description: "Mobile app programming for iOS and Android platforms.",
    duration: "3 years",
    defaultAps: 28,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "Mathematics", level: 5, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Mobile App Developer",
      "iOS Developer",
      "Android Developer",
      "Mobile UX Designer",
    ],
  },
  {
    name: "Bachelor of Network Engineering",
    faculty: "Information Technology",
    description: "Computer networks, telecommunications, and infrastructure.",
    duration: "4 years",
    defaultAps: 30,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "Mathematics", level: 6, isRequired: true },
      { name: "Physical Sciences", level: 5, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Network Engineer",
      "Network Administrator",
      "Systems Engineer",
      "Telecommunications Specialist",
    ],
  },
  {
    name: "Bachelor of Cloud Computing",
    faculty: "Information Technology",
    description:
      "Cloud infrastructure, distributed systems, and virtualization.",
    duration: "3 years",
    defaultAps: 30,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "Mathematics", level: 6, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Cloud Engineer",
      "DevOps Engineer",
      "Cloud Architect",
      "Site Reliability Engineer",
    ],
  },
  {
    name: "Bachelor of Digital Media",
    faculty: "Information Technology",
    description:
      "Digital content creation, multimedia design, and interactive media.",
    duration: "3 years",
    defaultAps: 24,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "English", level: 5, isRequired: true },
      { name: "Visual Arts", level: 4, isRequired: false },
    ],
    careerProspects: [
      "Digital Media Specialist",
      "Multimedia Designer",
      "Content Creator",
      "Digital Marketing Specialist",
    ],
  },

  // ==============================================
  // Faculty of Built Environment / Architecture and Planning
  // ==============================================
  {
    name: "Bachelor of Architecture (BArch)",
    faculty: "Built Environment",
    description:
      "Architectural design, building technology, and urban planning.",
    duration: "5 years",
    defaultAps: 32,
    assignmentRule: parseExcludeRule("UNISA, UFH"),
    universitySpecificAps: { uct: 36, wits: 35, stellenbosch: 34 },
    subjects: [
      { name: "Mathematics", level: 5, isRequired: true },
      { name: "English", level: 5, isRequired: true },
      { name: "Visual Arts", level: 4, isRequired: false },
    ],
    careerProspects: [
      "Architect",
      "Urban Designer",
      "Building Designer",
      "Construction Manager",
    ],
  },
  {
    name: "Bachelor of Architectural Studies (BAS)",
    faculty: "Built Environment",
    description: "Foundational architectural education and design principles.",
    duration: "3 years",
    defaultAps: 30,
    assignmentRule: parseExcludeRule("UNISA, UFH"),
    subjects: [
      { name: "Mathematics", level: 5, isRequired: true },
      { name: "English", level: 5, isRequired: true },
      { name: "Visual Arts", level: 4, isRequired: false },
    ],
    careerProspects: [
      "Architectural Technologist",
      "Design Assistant",
      "Building Inspector",
      "Construction Coordinator",
    ],
  },
  {
    name: "Bachelor of Urban and Regional Planning",
    faculty: "Built Environment",
    description: "Urban development, regional planning, and spatial analysis.",
    duration: "4 years",
    defaultAps: 30,
    assignmentRule: parseExcludeRule("UNISA, UFH"),
    subjects: [
      { name: "Mathematics", level: 5, isRequired: true },
      { name: "English", level: 5, isRequired: true },
      { name: "Geography", level: 4, isRequired: false },
    ],
    careerProspects: [
      "Urban Planner",
      "Regional Planner",
      "Development Consultant",
      "Municipal Planner",
    ],
  },
  {
    name: "Bachelor of Construction Studies",
    faculty: "Built Environment",
    description:
      "Construction management, building technology, and project management.",
    duration: "3 years",
    defaultAps: 26,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "Mathematics", level: 5, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Construction Manager",
      "Project Manager",
      "Site Manager",
      "Construction Consultant",
    ],
  },
  {
    name: "Bachelor of Property Studies",
    faculty: "Built Environment",
    description: "Real estate, property management, and valuation.",
    duration: "3 years",
    defaultAps: 26,
    assignmentRule: parseExcludeRule("UNISA"),
    subjects: [
      { name: "Mathematics", level: 5, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Property Manager",
      "Real Estate Agent",
      "Property Valuer",
      "Property Developer",
    ],
  },
  {
    name: "Bachelor of Real Estate",
    faculty: "Built Environment",
    description: "Real estate development, investment, and market analysis.",
    duration: "3 years",
    defaultAps: 24,
    assignmentRule: parseMostExceptRule("TUT, DUT"),
    subjects: [
      { name: "Mathematics", level: 4, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Real Estate Developer",
      "Property Investment Analyst",
      "Real Estate Broker",
      "Property Consultant",
    ],
  },
  {
    name: "Bachelor of Facilities Management",
    faculty: "Built Environment",
    description: "Building operations, maintenance, and facility services.",
    duration: "3 years",
    defaultAps: 24,
    assignmentRule: parseMostExceptRule("TUT, DUT"),
    subjects: [
      { name: "Mathematics", level: 4, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Facilities Manager",
      "Building Operations Manager",
      "Maintenance Coordinator",
      "Property Services Manager",
    ],
  },
  {
    name: "Bachelor of Housing Studies",
    faculty: "Built Environment",
    description: "Housing policy, development, and management.",
    duration: "3 years",
    defaultAps: 24,
    assignmentRule: parseMostExceptRule("TUT, DUT"),
    subjects: [
      { name: "English", level: 5, isRequired: true },
      { name: "Mathematics", level: 4, isRequired: true },
    ],
    careerProspects: [
      "Housing Development Manager",
      "Social Housing Specialist",
      "Housing Policy Analyst",
      "Community Development Officer",
    ],
  },

  // ==============================================
  // Technical and Vocational Programmes (TUT, DUT, MUT, VUT, CPUT mostly)
  // ==============================================
  {
    name: "National Diploma in Engineering (Mechanical)",
    faculty: "Engineering",
    description:
      "Practical engineering training with hands-on experience in mechanical systems.",
    duration: "3 years",
    defaultAps: 26,
    assignmentRule: {
      type: "include_only",
      universities: ["tut", "dut", "mut", "vut", "cput"],
    },
    subjects: [
      { name: "Mathematics", level: 5, isRequired: true },
      { name: "Physical Sciences", level: 5, isRequired: true },
      { name: "English", level: 4, isRequired: true },
    ],
    careerProspects: [
      "Engineering Technician",
      "Maintenance Engineer",
      "Production Supervisor",
      "Quality Controller",
    ],
  },
  {
    name: "National Diploma in Engineering (Electrical)",
    faculty: "Engineering",
    description: "Electrical systems and power engineering technology.",
    duration: "3 years",
    defaultAps: 26,
    assignmentRule: {
      type: "include_only",
      universities: ["tut", "dut", "mut", "vut", "cput"],
    },
    subjects: [
      { name: "Mathematics", level: 5, isRequired: true },
      { name: "Physical Sciences", level: 5, isRequired: true },
      { name: "English", level: 4, isRequired: true },
    ],
    careerProspects: [
      "Electrical Technician",
      "Control Systems Technician",
      "Maintenance Engineer",
      "Power Systems Operator",
    ],
  },
  {
    name: "National Diploma in Information Technology",
    faculty: "Information Technology",
    description: "Practical IT skills and systems administration.",
    duration: "3 years",
    defaultAps: 24,
    assignmentRule: {
      type: "include_only",
      universities: ["tut", "dut", "mut", "vut", "cput"],
    },
    subjects: [
      { name: "Mathematics", level: 4, isRequired: true },
      { name: "English", level: 4, isRequired: true },
    ],
    careerProspects: [
      "IT Support Technician",
      "Network Administrator",
      "Web Developer",
      "Database Operator",
    ],
  },
  {
    name: "National Diploma in Business Studies",
    faculty: "Commerce",
    description: "Business management and administration skills.",
    duration: "3 years",
    defaultAps: 22,
    assignmentRule: {
      type: "include_only",
      universities: ["tut", "dut", "mut", "vut", "cput"],
    },
    subjects: [
      { name: "Mathematics", level: 4, isRequired: true },
      { name: "English", level: 4, isRequired: true },
    ],
    careerProspects: [
      "Business Administrator",
      "Office Manager",
      "Customer Service Manager",
      "Sales Representative",
    ],
  },
  {
    name: "National Diploma in Hospitality Management",
    faculty: "Commerce",
    description: "Hotel and hospitality industry management.",
    duration: "3 years",
    defaultAps: 20,
    assignmentRule: {
      type: "include_only",
      universities: ["tut", "dut", "mut", "vut", "cput"],
    },
    subjects: [
      { name: "English", level: 4, isRequired: true },
      { name: "Mathematics", level: 3, isRequired: true },
    ],
    careerProspects: [
      "Hotel Manager",
      "Restaurant Manager",
      "Event Coordinator",
      "Tourism Officer",
    ],
  },
  {
    name: "National Diploma in Tourism Management",
    faculty: "Commerce",
    description: "Tourism industry operations and destination management.",
    duration: "3 years",
    defaultAps: 20,
    assignmentRule: {
      type: "include_only",
      universities: ["tut", "dut", "mut", "vut", "cput"],
    },
    subjects: [
      { name: "English", level: 4, isRequired: true },
      { name: "Mathematics", level: 3, isRequired: true },
    ],
    careerProspects: [
      "Tourism Manager",
      "Travel Consultant",
      "Tour Guide",
      "Destination Marketing Specialist",
    ],
  },
  {
    name: "National Diploma in Public Management",
    faculty: "Commerce",
    description: "Public sector administration and governance.",
    duration: "3 years",
    defaultAps: 22,
    assignmentRule: {
      type: "include_only",
      universities: ["tut", "dut", "mut", "vut", "cput"],
    },
    subjects: [
      { name: "English", level: 4, isRequired: true },
      { name: "Mathematics", level: 3, isRequired: true },
    ],
    careerProspects: [
      "Public Administrator",
      "Government Officer",
      "Municipal Manager",
      "Policy Analyst",
    ],
  },
  {
    name: "National Diploma in Graphic Design",
    faculty: "Humanities",
    description: "Visual communication design and digital media.",
    duration: "3 years",
    defaultAps: 22,
    assignmentRule: {
      type: "include_only",
      universities: ["tut", "dut", "mut", "vut", "cput"],
    },
    subjects: [
      { name: "Visual Arts", level: 4, isRequired: true },
      { name: "English", level: 4, isRequired: true },
    ],
    careerProspects: [
      "Graphic Designer",
      "Digital Designer",
      "Brand Designer",
      "Marketing Designer",
    ],
  },
  {
    name: "National Diploma in Environmental Health",
    faculty: "Health Sciences",
    description: "Environmental health monitoring and safety.",
    duration: "3 years",
    defaultAps: 24,
    assignmentRule: {
      type: "include_only",
      universities: ["tut", "dut", "mut", "vut", "cput"],
    },
    subjects: [
      { name: "Life Sciences", level: 4, isRequired: true },
      { name: "English", level: 4, isRequired: true },
      { name: "Mathematics", level: 3, isRequired: true },
    ],
    careerProspects: [
      "Environmental Health Officer",
      "Health Inspector",
      "Safety Officer",
      "Water Quality Analyst",
    ],
  },
  {
    name: "National Diploma in Food Technology",
    faculty: "Agriculture",
    description: "Food processing and quality control.",
    duration: "3 years",
    defaultAps: 24,
    assignmentRule: {
      type: "include_only",
      universities: ["tut", "dut", "mut", "vut", "cput"],
    },
    subjects: [
      { name: "Life Sciences", level: 4, isRequired: true },
      { name: "Physical Sciences", level: 4, isRequired: true },
      { name: "English", level: 4, isRequired: true },
    ],
    careerProspects: [
      "Food Technologist",
      "Quality Controller",
      "Production Manager",
      "Food Safety Inspector",
    ],
  },
  {
    name: "National Diploma in Building Construction",
    faculty: "Engineering",
    description: "Construction management and building technology.",
    duration: "3 years",
    defaultAps: 24,
    assignmentRule: {
      type: "include_only",
      universities: ["tut", "dut", "mut", "vut", "cput"],
    },
    subjects: [
      { name: "Mathematics", level: 4, isRequired: true },
      { name: "Physical Sciences", level: 4, isRequired: true },
      { name: "English", level: 4, isRequired: true },
    ],
    careerProspects: [
      "Construction Supervisor",
      "Building Inspector",
      "Site Manager",
      "Quantity Surveyor Assistant",
    ],
  },

  // ==============================================
  // MISSING ENGINEERING PROGRAMS
  // ==============================================
  {
    name: "Metallurgical Engineering",
    faculty: "Engineering",
    description:
      "Materials processing, metal extraction, and material properties.",
    duration: "4 years",
    defaultAps: 36,
    assignmentRule: parseMostExceptRule("Wits, UP, NWU"),
    subjects: [
      { name: "Mathematics", level: 6, isRequired: true },
      { name: "Physical Sciences", level: 6, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Metallurgical Engineer",
      "Materials Engineer",
      "Mining Engineer",
      "Quality Control Engineer",
    ],
  },
  {
    name: "Petroleum Engineering",
    faculty: "Engineering",
    description: "Oil and gas exploration, extraction, and processing.",
    duration: "4 years",
    defaultAps: 38,
    assignmentRule: parseMostExceptRule("Wits, UP"),
    subjects: [
      { name: "Mathematics", level: 6, isRequired: true },
      { name: "Physical Sciences", level: 6, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Petroleum Engineer",
      "Reservoir Engineer",
      "Drilling Engineer",
      "Production Engineer",
    ],
  },
  {
    name: "Materials Engineering",
    faculty: "Engineering",
    description: "Development and characterization of engineering materials.",
    duration: "4 years",
    defaultAps: 36,
    assignmentRule: parseMostExceptRule("Wits"),
    subjects: [
      { name: "Mathematics", level: 6, isRequired: true },
      { name: "Physical Sciences", level: 6, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Materials Engineer",
      "Research Scientist",
      "Quality Engineer",
      "Product Development Engineer",
    ],
  },
  {
    name: "Engineering Management",
    faculty: "Engineering",
    description:
      "Management principles applied to engineering projects and organizations.",
    duration: "4 years",
    defaultAps: 34,
    assignmentRule: parseMostExceptRule("UP"),
    subjects: [
      { name: "Mathematics", level: 6, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Engineering Manager",
      "Project Manager",
      "Operations Manager",
      "Technical Director",
    ],
  },
  {
    name: "Energy Engineering",
    faculty: "Engineering",
    description:
      "Renewable energy systems, power generation, and energy efficiency.",
    duration: "4 years",
    defaultAps: 35,
    assignmentRule: parseMostExceptRule("NWU, UJ"),
    subjects: [
      { name: "Mathematics", level: 6, isRequired: true },
      { name: "Physical Sciences", level: 6, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Energy Engineer",
      "Renewable Energy Specialist",
      "Power Systems Engineer",
      "Sustainability Consultant",
    ],
  },
  {
    name: "Marine Engineering",
    faculty: "Engineering",
    description: "Ship propulsion, marine systems, and naval architecture.",
    duration: "4 years",
    defaultAps: 34,
    assignmentRule: parseMostExceptRule("CPUT"),
    subjects: [
      { name: "Mathematics", level: 6, isRequired: true },
      { name: "Physical Sciences", level: 6, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Marine Engineer",
      "Naval Architect",
      "Ship Designer",
      "Port Engineer",
    ],
  },
  {
    name: "Systems Engineering",
    faculty: "Engineering",
    description: "Complex systems design, integration, and management.",
    duration: "4 years",
    defaultAps: 36,
    assignmentRule: parseMostExceptRule("UP"),
    subjects: [
      { name: "Mathematics", level: 6, isRequired: true },
      { name: "Physical Sciences", level: 5, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Systems Engineer",
      "Systems Analyst",
      "Integration Engineer",
      "Technical Lead",
    ],
  },

  // ==============================================
  // MISSING HEALTH SCIENCES PROGRAMS
  // ==============================================
  {
    name: "Bachelor of Homoeopathy",
    faculty: "Health Sciences",
    description: "Alternative medicine and homeopathic treatment principles.",
    duration: "5 years",
    defaultAps: 30,
    assignmentRule: parseMostExceptRule("DUT"),
    subjects: [
      { name: "Life Sciences", level: 5, isRequired: true },
      { name: "English", level: 5, isRequired: true },
      { name: "Mathematics", level: 4, isRequired: true },
    ],
    careerProspects: [
      "Homeopath",
      "Alternative Medicine Practitioner",
      "Natural Health Consultant",
      "Wellness Practitioner",
    ],
  },
  {
    name: "Bachelor of Complementary Medicine",
    faculty: "Health Sciences",
    description: "Integrative and complementary healthcare approaches.",
    duration: "4 years",
    defaultAps: 30,
    assignmentRule: parseMostExceptRule("UJ"),
    subjects: [
      { name: "Life Sciences", level: 5, isRequired: true },
      { name: "English", level: 5, isRequired: true },
      { name: "Mathematics", level: 4, isRequired: true },
    ],
    careerProspects: [
      "Complementary Medicine Practitioner",
      "Integrative Health Specialist",
      "Wellness Consultant",
      "Natural Therapist",
    ],
  },
  {
    name: "Bachelor of Chiropractic",
    faculty: "Health Sciences",
    description: "Spinal manipulation and musculoskeletal treatment.",
    duration: "6 years",
    defaultAps: 34,
    assignmentRule: parseMostExceptRule("DUT"),
    subjects: [
      { name: "Life Sciences", level: 6, isRequired: true },
      { name: "Physical Sciences", level: 5, isRequired: true },
      { name: "Mathematics", level: 5, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Chiropractor",
      "Spinal Specialist",
      "Sports Chiropractor",
      "Rehabilitation Specialist",
    ],
  },
  {
    name: "Medical Orthotics & Prosthetics",
    faculty: "Health Sciences",
    description: "Design and fitting of orthotic devices and prosthetic limbs.",
    duration: "4 years",
    defaultAps: 32,
    assignmentRule: parseMostExceptRule("UP, DUT"),
    subjects: [
      { name: "Life Sciences", level: 5, isRequired: true },
      { name: "Physical Sciences", level: 5, isRequired: true },
      { name: "Mathematics", level: 5, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Orthotist",
      "Prosthetist",
      "Rehabilitation Technologist",
      "Medical Device Specialist",
    ],
  },
  {
    name: "Bachelor of Social Work",
    faculty: "Health Sciences",
    description: "Social welfare, community development, and human services.",
    duration: "4 years",
    defaultAps: 26,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "English", level: 5, isRequired: true },
      { name: "Mathematics", level: 4, isRequired: true },
    ],
    careerProspects: [
      "Social Worker",
      "Community Development Officer",
      "Family Counselor",
      "Child Protection Officer",
    ],
  },
  {
    name: "Hearing Acoustics",
    faculty: "Health Sciences",
    description: "Hearing aid technology and audiological equipment.",
    duration: "3 years",
    defaultAps: 30,
    assignmentRule: parseMostExceptRule("SMU, UP"),
    subjects: [
      { name: "Physical Sciences", level: 5, isRequired: true },
      { name: "Mathematics", level: 5, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Hearing Aid Acoustician",
      "Audiological Technician",
      "Hearing Device Specialist",
      "Acoustic Engineer",
    ],
  },
  {
    name: "Medical Rescue",
    faculty: "Health Sciences",
    description: "Emergency rescue operations and pre-hospital care.",
    duration: "3 years",
    defaultAps: 28,
    assignmentRule: parseMostExceptRule("TUT"),
    subjects: [
      { name: "Life Sciences", level: 5, isRequired: true },
      { name: "Physical Sciences", level: 4, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Medical Rescue Practitioner",
      "Emergency Medical Technician",
      "Rescue Operator",
      "Disaster Response Specialist",
    ],
  },

  // ==============================================
  // MISSING EDUCATION PROGRAMS
  // ==============================================
  {
    name: "Bachelor of Education in Early Childhood Development (ECD)",
    faculty: "Education",
    description: "Early childhood education and development for ages 0-6.",
    duration: "4 years",
    defaultAps: 22,
    assignmentRule: parseMostExceptRule("UNISA, NWU"),
    subjects: [
      { name: "English", level: 5, isRequired: true },
      { name: "Mathematics", level: 3, isRequired: true },
    ],
    careerProspects: [
      "ECD Teacher",
      "Preschool Principal",
      "Child Development Specialist",
      "Early Learning Coordinator",
    ],
  },
  {
    name: "Inclusive Education",
    faculty: "Education",
    description: "Education for learners with diverse needs and abilities.",
    duration: "4 years",
    defaultAps: 24,
    assignmentRule: parseMostExceptRule("UNISA, NWU"),
    subjects: [
      { name: "English", level: 5, isRequired: true },
      { name: "Mathematics", level: 4, isRequired: true },
    ],
    careerProspects: [
      "Inclusive Education Specialist",
      "Learning Support Teacher",
      "Special Needs Coordinator",
      "Educational Therapist",
    ],
  },
  {
    name: "ICT in Education",
    faculty: "Education",
    description: "Technology integration in teaching and learning.",
    duration: "4 years",
    defaultAps: 26,
    assignmentRule: { type: "all" },
    subjects: [
      { name: "Mathematics", level: 5, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Educational Technology Specialist",
      "E-Learning Developer",
      "Digital Learning Coordinator",
      "STEM Education Specialist",
    ],
  },

  // ==============================================
  // MISSING HUMANITIES/SOCIAL SCIENCES PROGRAMS
  // ==============================================
  {
    name: "Social Work",
    faculty: "Humanities",
    description: "Social services, community development, and human welfare.",
    duration: "4 years",
    defaultAps: 26,
    assignmentRule: parseMostExceptRule("UJ, UNISA, NWU, UKZN"),
    subjects: [
      { name: "English", level: 5, isRequired: true },
      { name: "Mathematics", level: 4, isRequired: true },
    ],
    careerProspects: [
      "Social Worker",
      "Community Development Officer",
      "Family Counselor",
      "NGO Program Manager",
    ],
  },
  {
    name: "Criminology",
    faculty: "Humanities",
    description: "Crime patterns, criminal behavior, and justice systems.",
    duration: "3 years",
    defaultAps: 26,
    assignmentRule: parseMostExceptRule("UCT, UP, UJ"),
    subjects: [
      { name: "English", level: 5, isRequired: true },
      { name: "Mathematics", level: 4, isRequired: true },
    ],
    careerProspects: [
      "Criminologist",
      "Crime Analyst",
      "Police Officer",
      "Correctional Officer",
    ],
  },
  {
    name: "Media Studies",
    faculty: "Humanities",
    description: "Media theory, digital communication, and media production.",
    duration: "3 years",
    defaultAps: 26,
    assignmentRule: { type: "all" },
    subjects: [{ name: "English", level: 5, isRequired: true }],
    careerProspects: [
      "Media Analyst",
      "Content Producer",
      "Digital Media Specialist",
      "Media Researcher",
    ],
  },
  {
    name: "Library & Information Science",
    faculty: "Humanities",
    description:
      "Information management, library systems, and knowledge organization.",
    duration: "3 years",
    defaultAps: 24,
    assignmentRule: parseMostExceptRule("UNISA, UWC"),
    subjects: [
      { name: "English", level: 5, isRequired: true },
      { name: "Mathematics", level: 4, isRequired: true },
    ],
    careerProspects: [
      "Librarian",
      "Information Manager",
      "Knowledge Manager",
      "Digital Archivist",
    ],
  },
  {
    name: "Cultural & Heritage Studies",
    faculty: "Humanities",
    description:
      "Cultural preservation, heritage management, and cultural analysis.",
    duration: "3 years",
    defaultAps: 24,
    assignmentRule: parseMostExceptRule("UKZN, UFS"),
    subjects: [
      { name: "English", level: 5, isRequired: true },
      { name: "History", level: 4, isRequired: false },
    ],
    careerProspects: [
      "Heritage Officer",
      "Museum Curator",
      "Cultural Coordinator",
      "Tourism Heritage Specialist",
    ],
  },
  {
    name: "Peace & Conflict Studies",
    faculty: "Humanities",
    description:
      "Conflict resolution, peace building, and international relations.",
    duration: "3 years",
    defaultAps: 28,
    assignmentRule: parseMostExceptRule("UKZN, UCT"),
    subjects: [
      { name: "English", level: 6, isRequired: true },
      { name: "History", level: 4, isRequired: false },
    ],
    careerProspects: [
      "Peace Mediator",
      "Conflict Resolution Specialist",
      "International Relations Officer",
      "NGO Peace Worker",
    ],
  },
  {
    name: "Youth Development",
    faculty: "Humanities",
    description: "Youth programs, community engagement, and youth empowerment.",
    duration: "3 years",
    defaultAps: 22,
    assignmentRule: parseMostExceptRule("UNISA, DUT"),
    subjects: [
      { name: "English", level: 5, isRequired: true },
      { name: "Life Orientation", level: 4, isRequired: false },
    ],
    careerProspects: [
      "Youth Development Officer",
      "Community Worker",
      "Youth Program Coordinator",
      "Skills Development Facilitator",
    ],
  },
  {
    name: "Ethics",
    faculty: "Humanities",
    description:
      "Moral philosophy, applied ethics, and ethical decision-making.",
    duration: "3 years",
    defaultAps: 28,
    assignmentRule: parseMostExceptRule("UCT, SU"),
    subjects: [
      { name: "English", level: 6, isRequired: true },
      { name: "Philosophy", level: 4, isRequired: false },
    ],
    careerProspects: [
      "Ethics Consultant",
      "Corporate Ethics Officer",
      "Policy Analyst",
      "Bioethics Specialist",
    ],
  },

  // ==============================================
  // MISSING COMMERCE/BUSINESS PROGRAMS
  // ==============================================
  {
    name: "Retail Business Management",
    faculty: "Commerce",
    description:
      "Retail operations, merchandising, and customer experience management.",
    duration: "3 years",
    defaultAps: 24,
    assignmentRule: parseMostExceptRule("CPUT, DUT"),
    subjects: [
      { name: "English", level: 5, isRequired: true },
      { name: "Mathematics", level: 4, isRequired: true },
    ],
    careerProspects: [
      "Retail Manager",
      "Store Manager",
      "Merchandising Manager",
      "Customer Experience Manager",
    ],
  },
  {
    name: "Financial Planning",
    faculty: "Commerce",
    description:
      "Personal financial planning, investment advice, and wealth management.",
    duration: "3 years",
    defaultAps: 28,
    assignmentRule: parseMostExceptRule("UJ, UNISA"),
    subjects: [
      { name: "Mathematics", level: 5, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Financial Planner",
      "Investment Adviser",
      "Wealth Manager",
      "Financial Consultant",
    ],
  },
  {
    name: "Office Management & Technology",
    faculty: "Commerce",
    description:
      "Administrative systems, office technology, and business communication.",
    duration: "3 years",
    defaultAps: 22,
    assignmentRule: parseMostExceptRule("TUT, DUT"),
    subjects: [
      { name: "English", level: 5, isRequired: true },
      { name: "Mathematics", level: 3, isRequired: true },
    ],
    careerProspects: [
      "Office Manager",
      "Administrative Manager",
      "Executive Assistant",
      "Business Administrator",
    ],
  },
  {
    name: "Business Intelligence",
    faculty: "Commerce",
    description:
      "Data analytics, business reporting, and decision support systems.",
    duration: "3 years",
    defaultAps: 30,
    assignmentRule: parseMostExceptRule("NWU"),
    subjects: [
      { name: "Mathematics", level: 6, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Business Intelligence Analyst",
      "Data Analyst",
      "Business Analyst",
      "Reporting Specialist",
    ],
  },
  {
    name: "E-Commerce",
    faculty: "Commerce",
    description:
      "Digital business, online marketing, and e-commerce platforms.",
    duration: "3 years",
    defaultAps: 26,
    assignmentRule: parseMostExceptRule("UJ"),
    subjects: [
      { name: "English", level: 5, isRequired: true },
      { name: "Mathematics", level: 4, isRequired: true },
    ],
    careerProspects: [
      "E-Commerce Manager",
      "Digital Marketing Manager",
      "Online Business Developer",
      "Digital Strategy Consultant",
    ],
  },

  // ==============================================
  // MISSING LAW PROGRAMS
  // ==============================================
  {
    name: "Bachelor of Paralegal Studies",
    faculty: "Law",
    description:
      "Legal assistance, document preparation, and legal support services.",
    duration: "3 years",
    defaultAps: 26,
    assignmentRule: parseMostExceptRule("UNISA, NWU"),
    subjects: [
      { name: "English", level: 5, isRequired: true },
      { name: "Mathematics", level: 4, isRequired: true },
    ],
    careerProspects: [
      "Paralegal",
      "Legal Assistant",
      "Court Clerk",
      "Legal Support Officer",
    ],
  },
  {
    name: "Legal Support",
    faculty: "Law",
    description:
      "Legal administration, case management, and legal office operations.",
    duration: "3 years",
    defaultAps: 24,
    assignmentRule: parseMostExceptRule("CPUT, UNISA"),
    subjects: [
      { name: "English", level: 5, isRequired: true },
      { name: "Mathematics", level: 3, isRequired: true },
    ],
    careerProspects: [
      "Legal Support Officer",
      "Legal Administrator",
      "Court Administrator",
      "Legal Secretary",
    ],
  },

  // ==============================================
  // MISSING SCIENCE PROGRAMS
  // ==============================================
  {
    name: "Marine Science",
    faculty: "Science",
    description: "Ocean sciences, marine ecosystems, and coastal management.",
    duration: "3 years",
    defaultAps: 30,
    assignmentRule: parseMostExceptRule("UCT, UWC"),
    subjects: [
      { name: "Life Sciences", level: 6, isRequired: true },
      { name: "Physical Sciences", level: 5, isRequired: true },
      { name: "Mathematics", level: 5, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Marine Scientist",
      "Oceanographer",
      "Marine Conservationist",
      "Fisheries Scientist",
    ],
  },
  {
    name: "Space Science",
    faculty: "Science",
    description: "Astrophysics, space technology, and astronomical research.",
    duration: "3 years",
    defaultAps: 36,
    assignmentRule: parseMostExceptRule("Wits, UCT"),
    subjects: [
      { name: "Physical Sciences", level: 7, isRequired: true },
      { name: "Mathematics", level: 7, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Space Scientist",
      "Astrophysicist",
      "Space Systems Engineer",
      "Observatory Researcher",
    ],
  },
  {
    name: "Climate & Atmospheric Science",
    faculty: "Science",
    description: "Climate modeling, atmospheric physics, and weather systems.",
    duration: "3 years",
    defaultAps: 32,
    assignmentRule: parseMostExceptRule("UKZN, NWU"),
    subjects: [
      { name: "Physical Sciences", level: 6, isRequired: true },
      { name: "Mathematics", level: 6, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Climatologist",
      "Atmospheric Scientist",
      "Weather Forecaster",
      "Climate Researcher",
    ],
  },
  {
    name: "Applied Physics",
    faculty: "Science",
    description: "Physics applications in technology and engineering.",
    duration: "3 years",
    defaultAps: 34,
    assignmentRule: parseMostExceptRule("SU, UP"),
    subjects: [
      { name: "Physical Sciences", level: 7, isRequired: true },
      { name: "Mathematics", level: 7, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Applied Physicist",
      "Research Scientist",
      "Technology Developer",
      "Medical Physicist",
    ],
  },
  {
    name: "Actuarial Mathematics",
    faculty: "Science",
    description: "Mathematical modeling for risk assessment and insurance.",
    duration: "3 years",
    defaultAps: 38,
    assignmentRule: parseMostExceptRule("UCT, SU, UP"),
    subjects: [
      { name: "Mathematics", level: 7, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Actuary",
      "Risk Analyst",
      "Insurance Mathematician",
      "Financial Modeler",
    ],
  },
  {
    name: "Mathematical Statistics",
    faculty: "Science",
    description: "Advanced statistical theory and applications.",
    duration: "3 years",
    defaultAps: 34,
    assignmentRule: parseMostExceptRule("NWU, UP"),
    subjects: [
      { name: "Mathematics", level: 7, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Statistician",
      "Data Scientist",
      "Research Analyst",
      "Statistical Consultant",
    ],
  },
  {
    name: "Physics with Electronics",
    faculty: "Science",
    description: "Physics principles applied to electronic systems.",
    duration: "3 years",
    defaultAps: 34,
    assignmentRule: parseMostExceptRule("Wits, UJ"),
    subjects: [
      { name: "Physical Sciences", level: 7, isRequired: true },
      { name: "Mathematics", level: 6, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Electronics Engineer",
      "Systems Developer",
      "Research Physicist",
      "Technology Specialist",
    ],
  },

  // ==============================================
  // MISSING IT/COMPUTER SCIENCE PROGRAMS
  // ==============================================
  {
    name: "UX/UI Design",
    faculty: "Information Technology",
    description: "User experience design and interface development.",
    duration: "3 years",
    defaultAps: 26,
    assignmentRule: parseMostExceptRule("UNISA, UJ"),
    subjects: [
      { name: "English", level: 5, isRequired: true },
      { name: "Visual Arts", level: 4, isRequired: false },
      { name: "Mathematics", level: 4, isRequired: true },
    ],
    careerProspects: [
      "UX Designer",
      "UI Designer",
      "Product Designer",
      "Interaction Designer",
    ],
  },
  {
    name: "Digital Transformation",
    faculty: "Information Technology",
    description:
      "Digital innovation, technology strategy, and organizational change.",
    duration: "3 years",
    defaultAps: 28,
    assignmentRule: parseMostExceptRule("NWU"),
    subjects: [
      { name: "English", level: 5, isRequired: true },
      { name: "Mathematics", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Digital Transformation Manager",
      "Innovation Consultant",
      "Technology Strategist",
      "Change Management Specialist",
    ],
  },
  {
    name: "IT Management",
    faculty: "Information Technology",
    description:
      "Technology management, IT strategy, and systems administration.",
    duration: "3 years",
    defaultAps: 28,
    assignmentRule: parseMostExceptRule("UJ"),
    subjects: [
      { name: "Mathematics", level: 5, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "IT Manager",
      "Technology Director",
      "Systems Manager",
      "IT Consultant",
    ],
  },
  {
    name: "Tech Entrepreneurship",
    faculty: "Information Technology",
    description:
      "Technology startups, innovation management, and digital business.",
    duration: "3 years",
    defaultAps: 26,
    assignmentRule: parseMostExceptRule("NWU, UJ"),
    subjects: [
      { name: "English", level: 5, isRequired: true },
      { name: "Mathematics", level: 4, isRequired: true },
    ],
    careerProspects: [
      "Tech Entrepreneur",
      "Startup Founder",
      "Innovation Manager",
      "Technology Consultant",
    ],
  },
  {
    name: "Robotics",
    faculty: "Information Technology",
    description: "Robotics systems, automation, and artificial intelligence.",
    duration: "4 years",
    defaultAps: 32,
    assignmentRule: parseMostExceptRule("TUT, UP"),
    subjects: [
      { name: "Mathematics", level: 6, isRequired: true },
      { name: "Physical Sciences", level: 6, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Robotics Engineer",
      "Automation Specialist",
      "AI Engineer",
      "Systems Integration Engineer",
    ],
  },
  {
    name: "Embedded Systems",
    faculty: "Information Technology",
    description:
      "Microcontrollers, embedded programming, and hardware integration.",
    duration: "3 years",
    defaultAps: 30,
    assignmentRule: parseMostExceptRule("UP, UNISA"),
    subjects: [
      { name: "Mathematics", level: 6, isRequired: true },
      { name: "Physical Sciences", level: 5, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Embedded Systems Engineer",
      "Firmware Developer",
      "Hardware Engineer",
      "IoT Developer",
    ],
  },

  // ==============================================
  // MISSING AGRICULTURE PROGRAMS
  // ==============================================
  {
    name: "Poultry Science",
    faculty: "Agriculture",
    description: "Poultry production, breeding, and management systems.",
    duration: "4 years",
    defaultAps: 24,
    assignmentRule: parseMostExceptRule("UFS"),
    subjects: [
      { name: "Life Sciences", level: 5, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Poultry Specialist",
      "Farm Manager",
      "Livestock Consultant",
      "Animal Nutritionist",
    ],
  },
  {
    name: "Agribusiness",
    faculty: "Agriculture",
    description: "Agricultural business management and market systems.",
    duration: "4 years",
    defaultAps: 26,
    assignmentRule: parseMostExceptRule("UFS, UP"),
    subjects: [
      { name: "English", level: 5, isRequired: true },
      { name: "Mathematics", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Agribusiness Manager",
      "Agricultural Consultant",
      "Farm Business Advisor",
      "Agricultural Economist",
    ],
  },
  {
    name: "Post-Harvest Technology",
    faculty: "Agriculture",
    description: "Food preservation, storage, and processing technologies.",
    duration: "4 years",
    defaultAps: 26,
    assignmentRule: parseMostExceptRule("UFS"),
    subjects: [
      { name: "Life Sciences", level: 5, isRequired: true },
      { name: "Physical Sciences", level: 4, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Post-Harvest Specialist",
      "Food Technologist",
      "Storage Manager",
      "Quality Control Specialist",
    ],
  },
  {
    name: "Agroecology",
    faculty: "Agriculture",
    description: "Sustainable farming systems and ecological agriculture.",
    duration: "4 years",
    defaultAps: 24,
    assignmentRule: parseMostExceptRule("UFH, UNISA"),
    subjects: [
      { name: "Life Sciences", level: 5, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Agroecologist",
      "Sustainable Agriculture Specialist",
      "Environmental Farmer",
      "Ecological Consultant",
    ],
  },
  {
    name: "Climate-Smart Agriculture",
    faculty: "Agriculture",
    description: "Climate-resilient farming and adaptation strategies.",
    duration: "4 years",
    defaultAps: 26,
    assignmentRule: parseMostExceptRule("UNISA"),
    subjects: [
      { name: "Life Sciences", level: 5, isRequired: true },
      { name: "Geography", level: 4, isRequired: false },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Climate-Smart Agriculture Specialist",
      "Agricultural Adaptation Consultant",
      "Sustainable Farming Advisor",
      "Climate Researcher",
    ],
  },
  {
    name: "Agricultural Extension & Rural Resource Management",
    faculty: "Agriculture",
    description:
      "Rural development, extension services, and resource management.",
    duration: "4 years",
    defaultAps: 22,
    assignmentRule: parseMostExceptRule("UKZN, UNISA"),
    subjects: [
      { name: "English", level: 5, isRequired: true },
      { name: "Life Sciences", level: 4, isRequired: true },
    ],
    careerProspects: [
      "Agricultural Extension Officer",
      "Rural Development Specialist",
      "Resource Manager",
      "Community Development Officer",
    ],
  },

  // ==============================================
  // MISSING BUILT ENVIRONMENT PROGRAMS
  // ==============================================
  {
    name: "Urban Studies",
    faculty: "Built Environment",
    description: "Urban development, housing policy, and city planning.",
    duration: "3 years",
    defaultAps: 28,
    assignmentRule: parseMostExceptRule("Wits, UJ"),
    subjects: [
      { name: "English", level: 5, isRequired: true },
      { name: "Mathematics", level: 4, isRequired: true },
      { name: "Geography", level: 4, isRequired: false },
    ],
    careerProspects: [
      "Urban Planner",
      "Housing Specialist",
      "Community Development Officer",
      "Policy Analyst",
    ],
  },
  {
    name: "Heritage & Conservation Studies",
    faculty: "Built Environment",
    description: "Cultural heritage preservation and conservation management.",
    duration: "3 years",
    defaultAps: 26,
    assignmentRule: parseMostExceptRule("SU, UP"),
    subjects: [
      { name: "English", level: 5, isRequired: true },
      { name: "History", level: 4, isRequired: false },
      { name: "Visual Arts", level: 4, isRequired: false },
    ],
    careerProspects: [
      "Heritage Officer",
      "Conservation Specialist",
      "Museum Curator",
      "Cultural Tourism Manager",
    ],
  },
  {
    name: "Property Development",
    faculty: "Built Environment",
    description:
      "Real estate development, project management, and investment analysis.",
    duration: "3 years",
    defaultAps: 28,
    assignmentRule: parseMostExceptRule("UCT, UJ"),
    subjects: [
      { name: "Mathematics", level: 5, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Property Developer",
      "Real Estate Investment Manager",
      "Development Project Manager",
      "Property Consultant",
    ],
  },
  {
    name: "Urban Infrastructure",
    faculty: "Built Environment",
    description:
      "Infrastructure planning, utilities management, and city systems.",
    duration: "4 years",
    defaultAps: 30,
    assignmentRule: parseMostExceptRule("NWU, UP"),
    subjects: [
      { name: "Mathematics", level: 6, isRequired: true },
      { name: "Physical Sciences", level: 5, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Infrastructure Planner",
      "Utilities Engineer",
      "Municipal Engineer",
      "Transport Planner",
    ],
  },

  // ==============================================
  // MISSING TVET PROGRAMS
  // ==============================================
  {
    name: "Diploma in Mechanical Engineering (Heavy Current)",
    faculty: "Engineering",
    description:
      "Heavy machinery, industrial equipment, and mechanical systems.",
    duration: "3 years",
    defaultAps: 24,
    assignmentRule: {
      type: "include_only",
      universities: ["tut", "dut", "mut", "vut"],
    },
    subjects: [
      { name: "Mathematics", level: 4, isRequired: true },
      { name: "Physical Sciences", level: 4, isRequired: true },
      { name: "English", level: 4, isRequired: true },
    ],
    careerProspects: [
      "Mechanical Technician",
      "Heavy Equipment Operator",
      "Industrial Mechanic",
      "Maintenance Supervisor",
    ],
  },
  {
    name: "Diploma in Electrical Engineering (Process Instrumentation)",
    faculty: "Engineering",
    description: "Industrial automation, control systems, and instrumentation.",
    duration: "3 years",
    defaultAps: 26,
    assignmentRule: {
      type: "include_only",
      universities: ["tut", "dut", "mut", "vut"],
    },
    subjects: [
      { name: "Mathematics", level: 5, isRequired: true },
      { name: "Physical Sciences", level: 5, isRequired: true },
      { name: "English", level: 4, isRequired: true },
    ],
    careerProspects: [
      "Instrumentation Technician",
      "Process Control Specialist",
      "Automation Engineer",
      "Control Systems Technician",
    ],
  },
  {
    name: "Diploma in Cosmetology",
    faculty: "Humanities",
    description: "Beauty therapy, cosmetic science, and aesthetic treatments.",
    duration: "2 years",
    defaultAps: 18,
    assignmentRule: {
      type: "include_only",
      universities: ["tut", "dut", "mut", "vut"],
    },
    subjects: [
      { name: "English", level: 4, isRequired: true },
      { name: "Life Sciences", level: 3, isRequired: false },
    ],
    careerProspects: [
      "Cosmetologist",
      "Beauty Therapist",
      "Spa Manager",
      "Aesthetic Practitioner",
    ],
  },
  {
    name: "Diploma in Public Relations Practice",
    faculty: "Humanities",
    description:
      "Strategic communication, media relations, and public engagement.",
    duration: "3 years",
    defaultAps: 22,
    assignmentRule: {
      type: "include_only",
      universities: ["tut", "dut", "mut", "vut"],
    },
    subjects: [
      { name: "English", level: 5, isRequired: true },
      { name: "Mathematics", level: 3, isRequired: true },
    ],
    careerProspects: [
      "Public Relations Officer",
      "Communications Coordinator",
      "Media Relations Specialist",
      "Corporate Communications Manager",
    ],
  },
  {
    name: "Diploma in Journalism",
    faculty: "Humanities",
    description: "News reporting, media production, and digital journalism.",
    duration: "3 years",
    defaultAps: 24,
    assignmentRule: {
      type: "include_only",
      universities: ["tut", "dut", "mut", "vut"],
    },
    subjects: [
      { name: "English", level: 5, isRequired: true },
      { name: "Mathematics", level: 3, isRequired: true },
    ],
    careerProspects: [
      "Journalist",
      "News Reporter",
      "Media Producer",
      "Digital Content Creator",
    ],
  },
  {
    name: "Diploma in Events Management",
    faculty: "Commerce",
    description:
      "Event planning, project coordination, and hospitality management.",
    duration: "3 years",
    defaultAps: 20,
    assignmentRule: {
      type: "include_only",
      universities: ["tut", "dut", "mut", "vut"],
    },
    subjects: [
      { name: "English", level: 4, isRequired: true },
      { name: "Mathematics", level: 3, isRequired: true },
    ],
    careerProspects: [
      "Events Manager",
      "Event Coordinator",
      "Wedding Planner",
      "Conference Organizer",
    ],
  },
  {
    name: "Diploma in Library and Information Services",
    faculty: "Humanities",
    description:
      "Library management, information systems, and digital archives.",
    duration: "3 years",
    defaultAps: 22,
    assignmentRule: {
      type: "include_only",
      universities: ["tut", "dut", "mut", "vut"],
    },
    subjects: [
      { name: "English", level: 5, isRequired: true },
      { name: "Mathematics", level: 3, isRequired: true },
    ],
    careerProspects: [
      "Library Assistant",
      "Information Officer",
      "Records Manager",
      "Digital Archivist",
    ],
  },
];

// Debug logging for course assignment
if (typeof window !== "undefined" && import.meta.env.DEV) {
  console.log(`Total courses in database: ${COMPREHENSIVE_COURSES.length}`);
  const coursesForMUT = COMPREHENSIVE_COURSES.filter((course) => {
    const applicableUniversities = getUniversitiesForCourse(
      course.assignmentRule,
    );
    return applicableUniversities.includes("mut");
  });
  console.log(
    `Courses available for MUT: ${coursesForMUT.length}`,
    coursesForMUT.map((c) => c.name),
  );
}

// Apply assignment rules and get universities for a course
export function getUniversitiesForCourse(rule: AssignmentRule): string[] {
  switch (rule.type) {
    case "all":
      return [...ALL_UNIVERSITY_IDS];
    case "exclude":
      return ALL_UNIVERSITY_IDS.filter(
        (id) => !rule.universities?.includes(id),
      );
    case "include_only":
      return (
        rule.universities?.filter((id) => ALL_UNIVERSITY_IDS.includes(id)) || []
      );
    default:
      return [...ALL_UNIVERSITY_IDS];
  }
}

// Get APS requirement for a course at a specific university
export function getAPSRequirement(
  course: ComprehensiveCourse,
  universityId: string,
): number {
  return course.universitySpecificAps?.[universityId] || course.defaultAps;
}

// Convert course to degree format
export function courseToDegree(
  course: ComprehensiveCourse,
  universityId: string,
): Degree {
  return {
    id: course.name.toLowerCase().replace(/\s+/g, "-").replace(/[()]/g, ""),
    name: course.name,
    faculty: course.faculty,
    duration: course.duration,
    apsRequirement: getAPSRequirement(course, universityId),
    description: course.description,
    subjects: course.subjects || [],
    careerProspects: course.careerProspects || [],
  };
}

// Get all courses for a specific university
export function getCoursesForUniversity(
  universityId: string,
): ComprehensiveCourse[] {
  return COMPREHENSIVE_COURSES.filter((course) => {
    const applicableUniversities = getUniversitiesForCourse(
      course.assignmentRule,
    );
    return applicableUniversities.includes(universityId);
  });
}

// Organize courses by faculty for a university
export function getUniversityFaculties(universityId: string): Faculty[] {
  const courses = getCoursesForUniversity(universityId);
  const facultyMap = new Map<string, Faculty>();

  courses.forEach((course) => {
    if (!facultyMap.has(course.faculty)) {
      facultyMap.set(course.faculty, {
        id: course.faculty.toLowerCase().replace(/\s+/g, "-"),
        name: `Faculty of ${course.faculty}`,
        description: `${course.faculty} programs and degrees`,
        degrees: [],
      });
    }

    const faculty = facultyMap.get(course.faculty)!;
    faculty.degrees.push(courseToDegree(course, universityId));
  });

  return Array.from(facultyMap.values());
}

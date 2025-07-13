import { Degree } from "@/types/university";
import {
  generateUniversityProgramMappings,
  PROGRAM_ASSIGNMENT_RULES,
  getUniversitiesForProgram,
  ALL_UNIVERSITIES,
} from "./program-assignment-rules";

// University-specific program mappings based on official prospectus assignment rules
// Automatically generated using the program assignment rules engine

export interface UniversityProgramMapping {
  universityId: string;
  availableFaculties: {
    id: string;
    name: string;
    description: string;
    programIds: string[]; // IDs of programs actually offered by this faculty at this university
  }[];
}

// Specific faculty structures with accurate names for different university types
export const FACULTY_STRUCTURES = {
  // Traditional Research Universities (UCT, Wits, UP, UKZN, etc.)
  traditional: {
    engineering: {
      id: "engineering",
      name: "Faculty of Engineering and the Built Environment",
      commonPrograms: [
        "beng-civil",
        "beng-mechanical",
        "beng-electrical",
        "beng-chemical",
        "beng-industrial",
      ],
    },
    health: {
      id: "health-sciences",
      name: "Faculty of Health Sciences",
      commonPrograms: [
        "mbchb-medicine",
        "bsc-physiotherapy",
        "bnurs-nursing",
        "bsc-occupational-therapy",
      ],
    },
    commerce: {
      id: "commerce",
      name: "Faculty of Commerce",
      commonPrograms: [
        "bcom-accounting",
        "bcom-finance",
        "bcom-economics",
        "bcom-marketing",
        "bcom-business-management",
        "bcom-human-resources",
      ],
    },
    humanities: {
      id: "humanities",
      name: "Faculty of Humanities",
      commonPrograms: [
        "ba-english",
        "ba-history",
        "ba-psychology",
        "ba-sociology",
        "ba-political-science",
        "ba-philosophy",
      ],
    },
    science: {
      id: "science",
      name: "Faculty of Science",
      commonPrograms: [
        "bsc-computer-science",
        "bsc-mathematical-sciences",
        "bsc-physics",
        "bsc-chemistry",
        "bsc-biological-sciences",
      ],
    },
    law: {
      id: "law",
      name: "Faculty of Law",
      commonPrograms: ["llb-law"],
    },
    education: {
      id: "education",
      name: "Faculty of Education",
      commonPrograms: [
        "bed-foundation-phase",
        "bed-intermediate-phase",
        "bed-senior-fet-phase",
      ],
    },
  },

  // Universities of Technology (CPUT, DUT, TUT, etc.)
  technology: {
    engineering: {
      id: "engineering",
      name: "Faculty of Engineering and the Built Environment",
      commonPrograms: [
        "beng-civil",
        "beng-mechanical",
        "beng-electrical",
        "beng-industrial",
      ],
    },
    informationTechnology: {
      id: "information-technology",
      name: "Faculty of Informatics and Design",
      commonPrograms: ["bsc-computer-science"],
    },
    business: {
      id: "business",
      name: "Faculty of Business and Management Sciences",
      commonPrograms: [
        "bcom-accounting",
        "bcom-business-management",
        "bcom-marketing",
        "bcom-human-resources",
      ],
    },
    health: {
      id: "health",
      name: "Faculty of Health and Wellness Sciences",
      commonPrograms: ["bnurs-nursing", "bsc-medical-laboratory-sciences"],
    },
    appliedSciences: {
      id: "applied-sciences",
      name: "Faculty of Applied Sciences",
      commonPrograms: ["bsc-environmental-science"],
    },
  },

  // Comprehensive Universities (UJ, UWC, NWU, etc.)
  comprehensive: {
    engineering: {
      id: "engineering",
      name: "Faculty of Engineering and the Built Environment",
      commonPrograms: ["beng-civil", "beng-mechanical", "beng-electrical"],
    },
    health: {
      id: "health-sciences",
      name: "Faculty of Health Sciences",
      commonPrograms: [
        "mbchb-medicine",
        "bnurs-nursing",
        "bsc-physiotherapy",
        "bsc-occupational-therapy",
        "bsc-dietetics",
      ],
    },
    management: {
      id: "management",
      name: "Faculty of Management",
      commonPrograms: [
        "bcom-accounting",
        "bcom-finance",
        "bcom-business-management",
        "bcom-marketing",
      ],
    },
    humanities: {
      id: "humanities",
      name: "Faculty of Humanities",
      commonPrograms: [
        "ba-english",
        "ba-psychology",
        "ba-sociology",
        "ba-media-communication",
      ],
    },
    science: {
      id: "science",
      name: "Faculty of Science",
      commonPrograms: [
        "bsc-computer-science",
        "bsc-mathematical-sciences",
        "bsc-environmental-science",
      ],
    },
    education: {
      id: "education",
      name: "Faculty of Education",
      commonPrograms: [
        "bed-foundation-phase",
        "bed-intermediate-phase",
        "bed-senior-fet-phase",
      ],
    },
  },
};

// Faculty naming conventions by university type
const FACULTY_NAMES = {
  commerce: "Faculty of Commerce",
  engineering: "Faculty of Engineering and the Built Environment",
  science: "Faculty of Science",
  humanities: "Faculty of Humanities",
  education: "Faculty of Education",
  law: "Faculty of Law",
  "health-sciences": "Faculty of Health Sciences",
};

// Generate university program mappings using assignment rules
function generateProgramMappings(): UniversityProgramMapping[] {
  const programMappings = generateUniversityProgramMappings();

  return ALL_UNIVERSITIES.map((universityId) => {
    const facultyPrograms = programMappings[universityId];
    const availableFaculties = Object.keys(facultyPrograms).map((faculty) => ({
      id: faculty.toLowerCase().replace(/\s+/g, "-"),
      name:
        FACULTY_NAMES[faculty as keyof typeof FACULTY_NAMES] ||
        `Faculty of ${faculty}`,
      description: `${faculty} programs and education`,
      programIds: facultyPrograms[faculty].sort(),
    }));

    return {
      universityId,
      availableFaculties: availableFaculties.filter(
        (f) => f.programIds.length > 0,
      ),
    };
  });
}

// University-specific program mappings based on assignment rules
export const UNIVERSITY_PROGRAM_MAPPINGS: UniversityProgramMapping[] =
  generateProgramMappings();

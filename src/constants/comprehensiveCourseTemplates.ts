import { CourseAssignmentRule } from "./courseAssignmentSystem";

// University mappings for comprehensive course assignments
export const UNIVERSITY_PROGRAM_MAPPINGS = [
  {
    universityId: "uct",
    availableFaculties: [
      {
        id: "engineering",
        name: "Faculty of Engineering & the Built Environment",
        description: "Engineering and related programs",
        programIds: [
          "bsc-eng-civil",
          "bsc-eng-mechanical",
          "bsc-eng-electrical",
          "bsc-eng-chemical",
          "bsc-construction-management",
          "bsc-quantity-surveying",
        ],
      },
      {
        id: "health-sciences",
        name: "Faculty of Health Sciences",
        description: "Medical and health-related programs",
        programIds: ["mbchb", "bds", "bpharm", "bns-nursing"],
      },
      {
        id: "humanities",
        name: "Faculty of Humanities",
        description: "Arts, social sciences, and humanities programs",
        programIds: ["ba-english", "ba-psychology"],
      },
      {
        id: "commerce",
        name: "Faculty of Commerce",
        description: "Business, management, and accounting programs",
        programIds: ["bcom-accounting", "bcom-business-management"],
      },
      {
        id: "law",
        name: "Faculty of Law",
        description: "Law programs",
        programIds: ["llb"],
      },
      {
        id: "science",
        name: "Faculty of Science",
        description: "Science and mathematics programs",
        programIds: ["bsc-computer-science", "bsc-mathematics"],
      },
    ],
  },
  {
    universityId: "wits",
    availableFaculties: [
      {
        id: "engineering",
        name: "Faculty of Engineering & the Built Environment",
        description: "Engineering and related programs",
        programIds: [
          "bsc-eng-civil",
          "bsc-eng-mechanical",
          "bsc-eng-electrical",
          "bsc-eng-chemical",
          "bsc-construction-management",
          "bsc-quantity-surveying",
        ],
      },
      {
        id: "health-sciences",
        name: "Faculty of Health Sciences",
        description: "Medical and health-related programs",
        programIds: ["mbchb", "bds", "bpharm", "bns-nursing"],
      },
      {
        id: "humanities",
        name: "Faculty of Humanities",
        description: "Arts, social sciences, and humanities programs",
        programIds: ["ba-english", "ba-psychology"],
      },
      {
        id: "commerce",
        name: "Faculty of Commerce",
        description: "Business, management, and accounting programs",
        programIds: ["bcom-accounting", "bcom-business-management"],
      },
      {
        id: "law",
        name: "Faculty of Law",
        description: "Law programs",
        programIds: ["llb"],
      },
      {
        id: "science",
        name: "Faculty of Science",
        description: "Science and mathematics programs",
        programIds: ["bsc-computer-science", "bsc-mathematics"],
      },
    ],
  },
  {
    universityId: "up",
    availableFaculties: [
      {
        id: "engineering",
        name: "Faculty of Engineering & the Built Environment",
        description: "Engineering and related programs",
        programIds: [
          "bsc-eng-civil",
          "bsc-eng-mechanical",
          "bsc-eng-electrical",
          "bsc-eng-chemical",
          "bsc-construction-management",
          "bsc-quantity-surveying",
        ],
      },
      {
        id: "health-sciences",
        name: "Faculty of Health Sciences",
        description: "Medical and health-related programs",
        programIds: ["mbchb", "bds", "bpharm", "bns-nursing"],
      },
      {
        id: "humanities",
        name: "Faculty of Humanities",
        description: "Arts, social sciences, and humanities programs",
        programIds: ["ba-english", "ba-psychology"],
      },
      {
        id: "commerce",
        name: "Faculty of Commerce",
        description: "Business, management, and accounting programs",
        programIds: ["bcom-accounting", "bcom-business-management"],
      },
      {
        id: "law",
        name: "Faculty of Law",
        description: "Law programs",
        programIds: ["llb"],
      },
      {
        id: "science",
        name: "Faculty of Science",
        description: "Science and mathematics programs",
        programIds: ["bsc-computer-science", "bsc-mathematics"],
      },
      {
        id: "education",
        name: "Faculty of Education",
        description: "Teacher training programs",
        programIds: ["bed-foundation-phase"],
      },
    ],
  },
];

// Assignment rule type that matches the CourseAssignmentRule
export type AssignmentRule = CourseAssignmentRule;

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
  assignmentRule: AssignmentRule;
  universitySpecificAps?: Record<string, number>; // University ID -> APS requirement
}


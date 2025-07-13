import { Degree, University } from "@/types/university";

export const COMMON_DEGREES: Degree[] = [
  // Business & Commerce
  {
    id: "bcom-accounting",
    name: "BCom Accounting",
    faculty: "Commerce",
    duration: "3 years",
    apsRequirement: 34,
    description:
      "Comprehensive accounting program covering financial accounting, management accounting, auditing, and taxation.",
    subjects: [
      { name: "Mathematics", level: 4, isRequired: true },
      { name: "English", level: 4, isRequired: true },
      { name: "Accounting", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Chartered Accountant",
      "Financial Manager",
      "Auditor",
      "Tax Advisor",
      "Financial Analyst",
    ],
  },
  {
    id: "bcom-business-management",
    name: "BCom Business Management",
    faculty: "Commerce",
    duration: "3 years",
    apsRequirement: 32,
    description:
      "Business fundamentals including management, marketing, human resources, and strategic planning.",
    subjects: [
      { name: "Mathematics", level: 4, isRequired: true },
      { name: "English", level: 4, isRequired: true },
      { name: "Business Studies", level: 4, isRequired: false },
    ],
    careerProspects: [
      "Business Manager",
      "Project Manager",
      "Marketing Manager",
      "HR Manager",
      "Entrepreneur",
    ],
  },
  {
    id: "bcom-economics",
    name: "BCom Economics",
    faculty: "Commerce",
    duration: "3 years",
    apsRequirement: 35,
    description:
      "Study of economic theory, policy, and analysis for understanding market dynamics and policy making.",
    subjects: [
      { name: "Mathematics", level: 5, isRequired: true },
      { name: "English", level: 4, isRequired: true },
      { name: "Economics", level: 4, isRequired: false },
    ],
    careerProspects: [
      "Economist",
      "Policy Analyst",
      "Financial Consultant",
      "Research Analyst",
      "Banking Professional",
    ],
  },

  // Engineering
  {
    id: "beng-civil",
    name: "BEng Civil Engineering",
    faculty: "Engineering",
    duration: "4 years",
    apsRequirement: 38,
    description:
      "Design and construction of infrastructure including buildings, bridges, roads, and water systems.",
    subjects: [
      { name: "Mathematics", level: 6, isRequired: true },
      { name: "Physical Sciences", level: 6, isRequired: true },
      { name: "English", level: 4, isRequired: true },
    ],
    careerProspects: [
      "Civil Engineer",
      "Structural Engineer",
      "Project Manager",
      "Construction Manager",
      "Infrastructure Planner",
    ],
  },
  {
    id: "beng-electrical",
    name: "BEng Electrical Engineering",
    faculty: "Engineering",
    duration: "4 years",
    apsRequirement: 40,
    description:
      "Study of electrical systems, electronics, power generation, and control systems.",
    subjects: [
      { name: "Mathematics", level: 6, isRequired: true },
      { name: "Physical Sciences", level: 6, isRequired: true },
      { name: "English", level: 4, isRequired: true },
    ],
    careerProspects: [
      "Electrical Engineer",
      "Electronics Engineer",
      "Power Systems Engineer",
      "Control Systems Engineer",
      "Telecommunications Engineer",
    ],
  },
  {
    id: "beng-mechanical",
    name: "BEng Mechanical Engineering",
    faculty: "Engineering",
    duration: "4 years",
    apsRequirement: 39,
    description:
      "Design and manufacture of mechanical systems, machines, and thermal systems.",
    subjects: [
      { name: "Mathematics", level: 6, isRequired: true },
      { name: "Physical Sciences", level: 6, isRequired: true },
      { name: "English", level: 4, isRequired: true },
    ],
    careerProspects: [
      "Mechanical Engineer",
      "Design Engineer",
      "Manufacturing Engineer",
      "Automotive Engineer",
      "HVAC Engineer",
    ],
  },
  {
    id: "beng-computer",
    name: "BEng Computer Engineering",
    faculty: "Engineering",
    duration: "4 years",
    apsRequirement: 40,
    description:
      "Combination of electrical engineering and computer science, focusing on hardware and software integration.",
    subjects: [
      { name: "Mathematics", level: 6, isRequired: true },
      { name: "Physical Sciences", level: 6, isRequired: true },
      { name: "English", level: 4, isRequired: true },
      { name: "Information Technology", level: 5, isRequired: false },
    ],
    careerProspects: [
      "Computer Engineer",
      "Software Engineer",
      "Systems Engineer",
      "Network Engineer",
      "Embedded Systems Developer",
    ],
  },

  // Science
  {
    id: "bsc-computer-science",
    name: "BSc Computer Science",
    faculty: "Science",
    duration: "3 years",
    apsRequirement: 35,
    description:
      "Programming, algorithms, software development, and computer systems.",
    subjects: [
      { name: "Mathematics", level: 5, isRequired: true },
      { name: "English", level: 4, isRequired: true },
      { name: "Information Technology", level: 4, isRequired: false },
    ],
    careerProspects: [
      "Software Developer",
      "Data Scientist",
      "System Analyst",
      "IT Consultant",
      "Cybersecurity Specialist",
    ],
  },
  {
    id: "bsc-mathematics",
    name: "BSc Mathematics",
    faculty: "Science",
    duration: "3 years",
    apsRequirement: 36,
    description:
      "Pure and applied mathematics, statistics, and mathematical modeling.",
    subjects: [
      { name: "Mathematics", level: 6, isRequired: true },
      { name: "English", level: 4, isRequired: true },
      { name: "Physical Sciences", level: 5, isRequired: false },
    ],
    careerProspects: [
      "Mathematician",
      "Statistician",
      "Actuary",
      "Data Analyst",
      "Research Scientist",
    ],
  },
  {
    id: "bsc-physics",
    name: "BSc Physics",
    faculty: "Science",
    duration: "3 years",
    apsRequirement: 36,
    description:
      "Study of matter, energy, and the fundamental laws of the universe.",
    subjects: [
      { name: "Mathematics", level: 6, isRequired: true },
      { name: "Physical Sciences", level: 6, isRequired: true },
      { name: "English", level: 4, isRequired: true },
    ],
    careerProspects: [
      "Physicist",
      "Research Scientist",
      "Engineering Consultant",
      "Data Scientist",
      "Science Teacher",
    ],
  },

  // Health Sciences
  {
    id: "mbchb",
    name: "MBChB Medicine",
    faculty: "Health Sciences",
    duration: "6 years",
    apsRequirement: 42,
    description: "Comprehensive medical education to become a medical doctor.",
    subjects: [
      { name: "Mathematics", level: 5, isRequired: true },
      { name: "Physical Sciences", level: 6, isRequired: true },
      { name: "Life Sciences", level: 6, isRequired: true },
      { name: "English", level: 5, isRequired: true },
    ],
    careerProspects: [
      "Medical Doctor",
      "Specialist Physician",
      "Surgeon",
      "General Practitioner",
      "Medical Researcher",
    ],
  },
  {
    id: "bpharm",
    name: "BPharm Pharmacy",
    faculty: "Health Sciences",
    duration: "4 years",
    apsRequirement: 38,
    description:
      "Study of pharmaceutical sciences, drug development, and patient care.",
    subjects: [
      { name: "Mathematics", level: 4, isRequired: true },
      { name: "Physical Sciences", level: 6, isRequired: true },
      { name: "Life Sciences", level: 5, isRequired: true },
      { name: "English", level: 4, isRequired: true },
    ],
    careerProspects: [
      "Pharmacist",
      "Clinical Pharmacist",
      "Industrial Pharmacist",
      "Pharmaceutical Researcher",
      "Regulatory Affairs Specialist",
    ],
  },

  // Law
  {
    id: "llb",
    name: "LLB Law",
    faculty: "Law",
    duration: "4 years",
    apsRequirement: 36,
    description:
      "Comprehensive legal education covering various areas of law and legal practice.",
    subjects: [
      { name: "English", level: 5, isRequired: true },
      { name: "Mathematics", level: 4, isRequired: true },
    ],
    careerProspects: [
      "Attorney",
      "Advocate",
      "Legal Advisor",
      "Prosecutor",
      "Magistrate",
      "Corporate Lawyer",
    ],
  },

  // Humanities
  {
    id: "ba-psychology",
    name: "BA Psychology",
    faculty: "Humanities",
    duration: "3 years",
    apsRequirement: 30,
    description:
      "Study of human behavior, mental processes, and psychological research methods.",
    subjects: [
      { name: "English", level: 4, isRequired: true },
      { name: "Mathematics", level: 3, isRequired: true },
      { name: "Life Sciences", level: 4, isRequired: false },
    ],
    careerProspects: [
      "Psychologist",
      "Clinical Psychologist",
      "Counselor",
      "HR Specialist",
      "Research Psychologist",
    ],
  },
  {
    id: "ba-social-work",
    name: "BA Social Work",
    faculty: "Humanities",
    duration: "4 years",
    apsRequirement: 28,
    description:
      "Training to help individuals, families, and communities address social challenges.",
    subjects: [
      { name: "English", level: 4, isRequired: true },
      { name: "Mathematics", level: 3, isRequired: true },
    ],
    careerProspects: [
      "Social Worker",
      "Community Development Officer",
      "Child Protection Officer",
      "Family Counselor",
      "Policy Advisor",
    ],
  },

  // Education
  {
    id: "bed-foundation-phase",
    name: "BEd Foundation Phase",
    faculty: "Education",
    duration: "4 years",
    apsRequirement: 26,
    description: "Training to teach children from Grade R to Grade 3.",
    subjects: [
      { name: "English", level: 4, isRequired: true },
      { name: "Mathematics", level: 4, isRequired: true },
    ],
    careerProspects: [
      "Foundation Phase Teacher",
      "Early Childhood Development Specialist",
      "Educational Consultant",
      "Curriculum Developer",
    ],
  },
  {
    id: "bed-intermediate-phase",
    name: "BEd Intermediate Phase",
    faculty: "Education",
    duration: "4 years",
    apsRequirement: 26,
    description: "Training to teach children from Grade 4 to Grade 6.",
    subjects: [
      { name: "English", level: 4, isRequired: true },
      { name: "Mathematics", level: 4, isRequired: true },
    ],
    careerProspects: [
      "Intermediate Phase Teacher",
      "Subject Specialist",
      "Educational Consultant",
      "School Principal",
    ],
  },
];

// APS Point System (South African standard)
export const APS_POINTS_SYSTEM = {
  7: 7, // 80-100%
  6: 6, // 70-79%
  5: 5, // 60-69%
  4: 4, // 50-59%
  3: 3, // 40-49%
  2: 2, // 30-39%
  1: 1, // 0-29%
};

// Import from the new subjects file for consistency
export { SOUTH_AFRICAN_SUBJECTS as SUBJECTS_LIST } from "./subjects";

export const calculateAPSPoints = (percentage: number): number => {
  if (percentage >= 80) return 7;
  if (percentage >= 70) return 6;
  if (percentage >= 60) return 5;
  if (percentage >= 50) return 4;
  if (percentage >= 40) return 3;
  if (percentage >= 30) return 2;
  return 1;
};

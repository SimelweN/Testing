import React, { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calculator,
  GraduationCap,
  TrendingUp,
  Target,
  BarChart3,
  Building,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  CreditCard,
  BookOpen,
  Lightbulb,
  Filter,
  Calendar,
  Trophy,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SOUTH_AFRICAN_SUBJECTS } from "@/constants/subjects";
import { ALL_SOUTH_AFRICAN_UNIVERSITIES } from "@/constants/universities";
import { toast } from "sonner";

// Extract all programs from real university data
const extractUniversityPrograms = () => {
  const programs: Array<{ university: string; programs: string[] }> = [];

  try {
    if (
      !ALL_SOUTH_AFRICAN_UNIVERSITIES ||
      !Array.isArray(ALL_SOUTH_AFRICAN_UNIVERSITIES)
    ) {
      return programs;
    }

    ALL_SOUTH_AFRICAN_UNIVERSITIES.forEach((university) => {
      if (university.faculties && Array.isArray(university.faculties)) {
        university.faculties.forEach((faculty) => {
          if (faculty.degrees && Array.isArray(faculty.degrees)) {
            faculty.degrees.forEach((degree) => {
              programs.push({
                university: university.fullName || university.name,
                abbreviation: university.abbreviation || university.name,
                location: `${university.location}, ${university.province}`,
                program: degree.name,
                faculty: faculty.name,
                aps: degree.apsRequirement || 0,
                duration: degree.duration || "Not specified",
                description:
                  degree.description ||
                  `Study ${degree.name} at ${university.name}`,
              });
            });
          }
        });
      }
    });

    if (import.meta.env.DEV && programs.length > 0) {
      console.log(
        `✅ Extracted ${programs.length} programs from ${ALL_SOUTH_AFRICAN_UNIVERSITIES.length} universities`,
      );
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error("Error in extractUniversityPrograms:", error);
    }
  }

  return programs;
};

// Get real university programs data
const UNIVERSITY_PROGRAMS = extractUniversityPrograms();

// Comprehensive fallback data to ensure page renders
const FALLBACK_PROGRAMS = [
  // UCT Programs
  {
    university: "University of Cape Town",
    abbreviation: "UCT",
    location: "Cape Town, Western Cape",
    program: "Medicine",
    faculty: "Health Sciences",
    aps: 42,
    duration: "6 years",
    description: "Comprehensive medical training to become a qualified doctor.",
  },
  {
    university: "University of Cape Town",
    abbreviation: "UCT",
    location: "Cape Town, Western Cape",
    program: "Civil Engineering",
    faculty: "Engineering",
    aps: 38,
    duration: "4 years",
    description: "Design, construct and maintain civil infrastructure.",
  },
  {
    university: "University of Cape Town",
    abbreviation: "UCT",
    location: "Cape Town, Western Cape",
    program: "Computer Science",
    faculty: "Science",
    aps: 34,
    duration: "3 years",
    description: "Programming, algorithms, and computational theory.",
  },
  {
    university: "University of Cape Town",
    abbreviation: "UCT",
    location: "Cape Town, Western Cape",
    program: "Bachelor of Commerce",
    faculty: "Commerce",
    aps: 33,
    duration: "3 years",
    description: "Business and commerce studies.",
  },
  {
    university: "University of Cape Town",
    abbreviation: "UCT",
    location: "Cape Town, Western Cape",
    program: "Law (LLB)",
    faculty: "Law",
    aps: 36,
    duration: "4 years",
    description: "Comprehensive legal education.",
  },

  // Wits Programs
  {
    university: "University of the Witwatersrand",
    abbreviation: "Wits",
    location: "Johannesburg, Gauteng",
    program: "Medicine",
    faculty: "Health Sciences",
    aps: 40,
    duration: "6 years",
    description: "Medical training at Africa's leading research university.",
  },
  {
    university: "University of the Witwatersrand",
    abbreviation: "Wits",
    location: "Johannesburg, Gauteng",
    program: "Mining Engineering",
    faculty: "Engineering",
    aps: 37,
    duration: "4 years",
    description: "Leading mining engineering program in Africa.",
  },
  {
    university: "University of the Witwatersrand",
    abbreviation: "Wits",
    location: "Johannesburg, Gauteng",
    program: "Actuarial Science",
    faculty: "Commerce",
    aps: 40,
    duration: "3 years",
    description: "Mathematical analysis of financial risk.",
  },

  // Stellenbosch Programs
  {
    university: "Stellenbosch University",
    abbreviation: "SU",
    location: "Stellenbosch, Western Cape",
    program: "Medicine",
    faculty: "Health Sciences",
    aps: 39,
    duration: "6 years",
    description: "Medical program at prestigious research university.",
  },
  {
    university: "Stellenbosch University",
    abbreviation: "SU",
    location: "Stellenbosch, Western Cape",
    program: "Engineering",
    faculty: "Engineering",
    aps: 36,
    duration: "4 years",
    description: "Comprehensive engineering programs.",
  },

  // UP Programs
  {
    university: "University of Pretoria",
    abbreviation: "UP",
    location: "Pretoria, Gauteng",
    program: "Veterinary Science",
    faculty: "Veterinary Science",
    aps: 38,
    duration: "6 years",
    description: "Leading veterinary program in Africa.",
  },
  {
    university: "University of Pretoria",
    abbreviation: "UP",
    location: "Pretoria, Gauteng",
    program: "Engineering",
    faculty: "Engineering",
    aps: 35,
    duration: "4 years",
    description: "Diverse engineering disciplines.",
  },

  // Additional programs for variety
  {
    university: "University of KwaZulu-Natal",
    abbreviation: "UKZN",
    location: "Durban, KwaZulu-Natal",
    program: "Medicine",
    faculty: "Health Sciences",
    aps: 38,
    duration: "6 years",
    description: "Medical training in coastal setting.",
  },
  {
    university: "Rhodes University",
    abbreviation: "RU",
    location: "Grahamstown, Eastern Cape",
    program: "Pharmacy",
    faculty: "Pharmacy",
    aps: 35,
    duration: "4 years",
    description: "Pharmaceutical sciences and practice.",
  },
  {
    university: "University of the Western Cape",
    abbreviation: "UWC",
    location: "Cape Town, Western Cape",
    program: "Dentistry",
    faculty: "Dentistry",
    aps: 36,
    duration: "5 years",
    description: "Comprehensive dental training.",
  },
  {
    university: "University of Cape Town",
    abbreviation: "UCT",
    location: "Cape Town, Western Cape",
    program: "Civil Engineering",
    faculty: "Engineering",
    aps: 38,
    duration: "4 years",
    description: "Design, construct and maintain civil infrastructure.",
  },
  {
    university: "University of Cape Town",
    abbreviation: "UCT",
    location: "Cape Town, Western Cape",
    program: "Computer Science",
    faculty: "Science",
    aps: 34,
    duration: "3 years",
    description: "Programming, algorithms, and computational theory.",
  },
  {
    university: "University of Cape Town",
    abbreviation: "UCT",
    location: "Cape Town, Western Cape",
    program: "Bachelor of Commerce (Accounting)",
    faculty: "Commerce",
    aps: 33,
    duration: "3 years",
    description: "Financial accounting, auditing, and business finance.",
  },
  {
    university: "University of Cape Town",
    abbreviation: "UCT",
    location: "Cape Town, Western Cape",
    program: "Law (LLB)",
    faculty: "Law",
    aps: 36,
    duration: "4 years",
    description: "Comprehensive legal education and jurisprudence.",
  },
  {
    university: "University of Cape Town",
    abbreviation: "UCT",
    location: "Cape Town, Western Cape",
    program: "Psychology",
    faculty: "Humanities",
    aps: 35,
    duration: "3 years",
    description: "Study of human behavior and mental processes.",
  },
  {
    university: "University of Cape Town",
    abbreviation: "UCT",
    location: "Cape Town, Western Cape",
    program: "Architecture",
    faculty: "Built Environment",
    aps: 35,
    duration: "5 years",
    description: "Architectural design and building design.",
  },
  {
    university: "University of Cape Town",
    abbreviation: "UCT",
    location: "Cape Town, Western Cape",
    program: "Physiotherapy",
    faculty: "Health Sciences",
    aps: 36,
    duration: "4 years",
    description: "Treatment of movement disorders and physical rehabilitation.",
  },
  {
    university: "University of Cape Town",
    abbreviation: "UCT",
    location: "Cape Town, Western Cape",
    program: "English Literature",
    faculty: "Humanities",
    aps: 27,
    duration: "3 years",
    description: "Study of English language, literature, and communication.",
  },
  {
    university: "University of Cape Town",
    abbreviation: "UCT",
    location: "Cape Town, Western Cape",
    program: "Environmental Science",
    faculty: "Science",
    aps: 31,
    duration: "3 years",
    description: "Study of environmental problems and solutions.",
  },

  // Wits
  {
    university: "University of the Witwatersrand",
    abbreviation: "Wits",
    location: "Johannesburg, Gauteng",
    program: "Medicine",
    faculty: "Health Sciences",
    aps: 40,
    duration: "6 years",
    description: "Comprehensive medical training to become a qualified doctor.",
  },
  {
    university: "University of the Witwatersrand",
    abbreviation: "Wits",
    location: "Johannesburg, Gauteng",
    program: "Mechanical Engineering",
    faculty: "Engineering",
    aps: 38,
    duration: "4 years",
    description: "Design, develop and manufacture mechanical systems.",
  },
  {
    university: "University of the Witwatersrand",
    abbreviation: "Wits",
    location: "Johannesburg, Gauteng",
    program: "Computer Science",
    faculty: "Science",
    aps: 33,
    duration: "3 years",
    description: "Programming, algorithms, and computational theory.",
  },
  {
    university: "University of the Witwatersrand",
    abbreviation: "Wits",
    location: "Johannesburg, Gauteng",
    program: "Bachelor of Commerce (Finance)",
    faculty: "Commerce",
    aps: 32,
    duration: "3 years",
    description:
      "Corporate finance, investment analysis, and financial markets.",
  },
  {
    university: "University of the Witwatersrand",
    abbreviation: "Wits",
    location: "Johannesburg, Gauteng",
    program: "Law (LLB)",
    faculty: "Law",
    aps: 35,
    duration: "4 years",
    description: "Comprehensive legal education and jurisprudence.",
  },
  {
    university: "University of the Witwatersrand",
    abbreviation: "Wits",
    location: "Johannesburg, Gauteng",
    program: "Psychology",
    faculty: "Humanities",
    aps: 34,
    duration: "3 years",
    description: "Study of human behavior and mental processes.",
  },
  {
    university: "University of the Witwatersrand",
    abbreviation: "Wits",
    location: "Johannesburg, Gauteng",
    program: "Mining Engineering",
    faculty: "Engineering",
    aps: 37,
    duration: "4 years",
    description: "Extract minerals and resources from the earth safely.",
  },
  {
    university: "University of the Witwatersrand",
    abbreviation: "Wits",
    location: "Johannesburg, Gauteng",
    program: "Actuarial Science",
    faculty: "Commerce",
    aps: 40,
    duration: "3 years",
    description: "Mathematical analysis of financial risk and uncertainty.",
  },
  {
    university: "University of the Witwatersrand",
    abbreviation: "Wits",
    location: "Johannesburg, Gauteng",
    program: "History",
    faculty: "Humanities",
    aps: 26,
    duration: "3 years",
    description: "Study of past events and their significance.",
  },
  {
    university: "University of the Witwatersrand",
    abbreviation: "Wits",
    location: "Johannesburg, Gauteng",
    program: "Chemistry",
    faculty: "Science",
    aps: 33,
    duration: "3 years",
    description: "Organic, inorganic, analytical, and physical chemistry.",
  },

  // Stellenbosch University
  {
    university: "Stellenbosch University",
    abbreviation: "SU",
    location: "Stellenbosch, Western Cape",
    program: "Medicine",
    faculty: "Health Sciences",
    aps: 39,
    duration: "6 years",
    description: "Comprehensive medical training to become a qualified doctor.",
  },
  {
    university: "Stellenbosch University",
    abbreviation: "SU",
    location: "Stellenbosch, Western Cape",
    program: "Engineering",
    faculty: "Engineering",
    aps: 36,
    duration: "4 years",
    description: "Various engineering disciplines.",
  },
  {
    university: "Stellenbosch University",
    abbreviation: "SU",
    location: "Stellenbosch, Western Cape",
    program: "Business Management",
    faculty: "Economic Sciences",
    aps: 32,
    duration: "3 years",
    description: "General business administration and management principles.",
  },
  {
    university: "Stellenbosch University",
    abbreviation: "SU",
    location: "Stellenbosch, Western Cape",
    program: "Agriculture",
    faculty: "Agriculture",
    aps: 28,
    duration: "4 years",
    description: "Scientific principles applied to agriculture.",
  },
  {
    university: "Stellenbosch University",
    abbreviation: "SU",
    location: "Stellenbosch, Western Cape",
    program: "Education",
    faculty: "Education",
    aps: 26,
    duration: "4 years",
    description: "Teaching methodology for various phases.",
  },
  {
    university: "Stellenbosch University",
    abbreviation: "SU",
    location: "Stellenbosch, Western Cape",
    program: "Viticulture and Oenology",
    faculty: "Agriculture",
    aps: 29,
    duration: "4 years",
    description: "Grape growing and wine making.",
  },
  {
    university: "Stellenbosch University",
    abbreviation: "SU",
    location: "Stellenbosch, Western Cape",
    program: "Psychology",
    faculty: "Arts",
    aps: 33,
    duration: "3 years",
    description: "Study of human behavior and mental processes.",
  },
  {
    university: "Stellenbosch University",
    abbreviation: "SU",
    location: "Stellenbosch, Western Cape",
    program: "Law (LLB)",
    faculty: "Law",
    aps: 34,
    duration: "4 years",
    description: "Comprehensive legal education and jurisprudence.",
  },
  {
    university: "Stellenbosch University",
    abbreviation: "SU",
    location: "Stellenbosch, Western Cape",
    program: "Computer Science",
    faculty: "Science",
    aps: 32,
    duration: "3 years",
    description: "Programming, algorithms, and computational theory.",
  },
  {
    university: "Stellenbosch University",
    abbreviation: "SU",
    location: "Stellenbosch, Western Cape",
    program: "Accounting",
    faculty: "Economic Sciences",
    aps: 31,
    duration: "3 years",
    description: "Financial accounting, auditing, and business finance.",
  },

  // University of Pretoria
  {
    university: "University of Pretoria",
    abbreviation: "UP",
    location: "Pretoria, Gauteng",
    program: "Veterinary Science",
    faculty: "Veterinary Science",
    aps: 38,
    duration: "6 years",
    description: "Comprehensive veterinary medicine training.",
  },
  {
    university: "University of Pretoria",
    abbreviation: "UP",
    location: "Pretoria, Gauteng",
    program: "Engineering",
    faculty: "Engineering",
    aps: 35,
    duration: "4 years",
    description: "Various engineering disciplines.",
  },
  {
    university: "University of Pretoria",
    abbreviation: "UP",
    location: "Pretoria, Gauteng",
    program: "Medicine",
    faculty: "Health Sciences",
    aps: 38,
    duration: "6 years",
    description: "Comprehensive medical training to become a qualified doctor.",
  },
  {
    university: "University of Pretoria",
    abbreviation: "UP",
    location: "Pretoria, Gauteng",
    program: "BCom",
    faculty: "Economic Sciences",
    aps: 30,
    duration: "3 years",
    description: "Bachelor of Commerce with various specializations.",
  },
  {
    university: "University of Pretoria",
    abbreviation: "UP",
    location: "Pretoria, Gauteng",
    program: "Information Technology",
    faculty: "Engineering",
    aps: 29,
    duration: "3 years",
    description: "Information systems, networking, and technology management.",
  },
  {
    university: "University of Pretoria",
    abbreviation: "UP",
    location: "Pretoria, Gauteng",
    program: "Education",
    faculty: "Education",
    aps: 25,
    duration: "4 years",
    description: "Teaching methodology for various phases.",
  },
  {
    university: "University of Pretoria",
    abbreviation: "UP",
    location: "Pretoria, Gauteng",
    program: "Law (LLB)",
    faculty: "Law",
    aps: 33,
    duration: "4 years",
    description: "Comprehensive legal education and jurisprudence.",
  },
  {
    university: "University of Pretoria",
    abbreviation: "UP",
    location: "Pretoria, Gauteng",
    program: "Psychology",
    faculty: "Humanities",
    aps: 32,
    duration: "3 years",
    description: "Study of human behavior and mental processes.",
  },
  {
    university: "University of Pretoria",
    abbreviation: "UP",
    location: "Pretoria, Gauteng",
    program: "Architecture",
    faculty: "Built Environment",
    aps: 33,
    duration: "5 years",
    description: "Architectural design and building design.",
  },
  {
    university: "University of Pretoria",
    abbreviation: "UP",
    location: "Pretoria, Gauteng",
    program: "Social Work",
    faculty: "Humanities",
    aps: 25,
    duration: "4 years",
    description: "Social services and community development.",
  },

  // UKZN
  {
    university: "University of KwaZulu-Natal",
    abbreviation: "UKZN",
    location: "Durban, KwaZulu-Natal",
    program: "Medicine",
    faculty: "Health Sciences",
    aps: 37,
    duration: "6 years",
    description: "Comprehensive medical training to become a qualified doctor.",
  },
  {
    university: "University of KwaZulu-Natal",
    abbreviation: "UKZN",
    location: "Durban, KwaZulu-Natal",
    program: "Engineering",
    faculty: "Engineering",
    aps: 32,
    duration: "4 years",
    description: "Various engineering disciplines.",
  },
  {
    university: "University of KwaZulu-Natal",
    abbreviation: "UKZN",
    location: "Durban, KwaZulu-Natal",
    program: "Science",
    faculty: "Science",
    aps: 28,
    duration: "3 years",
    description: "Bachelor of Science with various specializations.",
  },
  {
    university: "University of KwaZulu-Natal",
    abbreviation: "UKZN",
    location: "Durban, KwaZulu-Natal",
    program: "Education",
    faculty: "Education",
    aps: 24,
    duration: "4 years",
    description: "Teaching methodology for various phases.",
  },
  {
    university: "University of KwaZulu-Natal",
    abbreviation: "UKZN",
    location: "Durban, KwaZulu-Natal",
    program: "Arts",
    faculty: "Humanities",
    aps: 22,
    duration: "3 years",
    description: "Bachelor of Arts with various specializations.",
  },
  {
    university: "University of KwaZulu-Natal",
    abbreviation: "UKZN",
    location: "Durban, KwaZulu-Natal",
    program: "Commerce",
    faculty: "Management Studies",
    aps: 26,
    duration: "3 years",
    description: "Bachelor of Commerce with various specializations.",
  },
  {
    university: "University of KwaZulu-Natal",
    abbreviation: "UKZN",
    location: "Durban, KwaZulu-Natal",
    program: "Law (LLB)",
    faculty: "Law",
    aps: 31,
    duration: "4 years",
    description: "Comprehensive legal education and jurisprudence.",
  },
  {
    university: "University of KwaZulu-Natal",
    abbreviation: "UKZN",
    location: "Durban, KwaZulu-Natal",
    program: "Nursing",
    faculty: "Health Sciences",
    aps: 28,
    duration: "4 years",
    description:
      "Comprehensive nursing care across various healthcare settings.",
  },
  {
    university: "University of KwaZulu-Natal",
    abbreviation: "UKZN",
    location: "Durban, KwaZulu-Natal",
    program: "Agriculture",
    faculty: "Science and Agriculture",
    aps: 26,
    duration: "4 years",
    description: "Scientific principles applied to agriculture.",
  },
  {
    university: "University of KwaZulu-Natal",
    abbreviation: "UKZN",
    location: "Durban, KwaZulu-Natal",
    program: "Pharmacy",
    faculty: "Health Sciences",
    aps: 34,
    duration: "4 years",
    description: "Study of drugs, their properties, and pharmaceutical care.",
  },

  // UJ
  {
    university: "University of Johannesburg",
    abbreviation: "UJ",
    location: "Johannesburg, Gauteng",
    program: "Engineering",
    faculty: "Engineering",
    aps: 31,
    duration: "4 years",
    description: "Various engineering disciplines.",
  },
  {
    university: "University of Johannesburg",
    abbreviation: "UJ",
    location: "Johannesburg, Gauteng",
    program: "Health Sciences",
    faculty: "Health Sciences",
    aps: 30,
    duration: "4 years",
    description: "Various health science programs.",
  },
  {
    university: "University of Johannesburg",
    abbreviation: "UJ",
    location: "Johannesburg, Gauteng",
    program: "Business and Economics",
    faculty: "Management",
    aps: 27,
    duration: "3 years",
    description: "Business and economic studies.",
  },
  {
    university: "University of Johannesburg",
    abbreviation: "UJ",
    location: "Johannesburg, Gauteng",
    program: "Education",
    faculty: "Education",
    aps: 24,
    duration: "4 years",
    description: "Teaching methodology for various phases.",
  },
  {
    university: "University of Johannesburg",
    abbreviation: "UJ",
    location: "Johannesburg, Gauteng",
    program: "Arts and Philosophy",
    faculty: "Humanities",
    aps: 23,
    duration: "3 years",
    description: "Liberal arts and philosophy studies.",
  },
  {
    university: "University of Johannesburg",
    abbreviation: "UJ",
    location: "Johannesburg, Gauteng",
    program: "Science",
    faculty: "Science",
    aps: 26,
    duration: "3 years",
    description: "Bachelor of Science with various specializations.",
  },
  {
    university: "University of Johannesburg",
    abbreviation: "UJ",
    location: "Johannesburg, Gauteng",
    program: "Law (LLB)",
    faculty: "Law",
    aps: 30,
    duration: "4 years",
    description: "Comprehensive legal education and jurisprudence.",
  },
  {
    university: "University of Johannesburg",
    abbreviation: "UJ",
    location: "Johannesburg, Gauteng",
    program: "Information Technology",
    faculty: "Science",
    aps: 28,
    duration: "3 years",
    description: "Information systems, networking, and technology management.",
  },
  {
    university: "University of Johannesburg",
    abbreviation: "UJ",
    location: "Johannesburg, Gauteng",
    program: "Tourism Management",
    faculty: "Management",
    aps: 25,
    duration: "3 years",
    description: "Tourism industry management and hospitality.",
  },
  {
    university: "University of Johannesburg",
    abbreviation: "UJ",
    location: "Johannesburg, Gauteng",
    program: "Sport Science",
    faculty: "Health Sciences",
    aps: 27,
    duration: "3 years",
    description: "Science applied to sports and exercise.",
  },

  // TUT (Technology Focus)
  {
    university: "Tshwane University of Technology",
    abbreviation: "TUT",
    location: "Pretoria, Gauteng",
    program: "National Diploma Engineering",
    faculty: "Engineering",
    aps: 26,
    duration: "3 years",
    description: "Technical engineering training in various specializations.",
  },
  {
    university: "Tshwane University of Technology",
    abbreviation: "TUT",
    location: "Pretoria, Gauteng",
    program: "Information Technology",
    faculty: "Information Technology",
    aps: 25,
    duration: "3 years",
    description: "Technical IT skills and computer systems.",
  },
  {
    university: "Tshwane University of Technology",
    abbreviation: "TUT",
    location: "Pretoria, Gauteng",
    program: "Business Studies",
    faculty: "Management Sciences",
    aps: 24,
    duration: "3 years",
    description: "Practical business skills and management.",
  },
  {
    university: "Tshwane University of Technology",
    abbreviation: "TUT",
    location: "Pretoria, Gauteng",
    program: "Hospitality Management",
    faculty: "Management Sciences",
    aps: 23,
    duration: "3 years",
    description: "Hotel and hospitality industry management.",
  },
  {
    university: "Tshwane University of Technology",
    abbreviation: "TUT",
    location: "Pretoria, Gauteng",
    program: "Tourism Management",
    faculty: "Management Sciences",
    aps: 23,
    duration: "3 years",
    description: "Tourism industry operations and management.",
  },
  {
    university: "Tshwane University of Technology",
    abbreviation: "TUT",
    location: "Pretoria, Gauteng",
    program: "Marketing",
    faculty: "Management Sciences",
    aps: 24,
    duration: "3 years",
    description: "Consumer behavior, advertising, and brand management.",
  },
  {
    university: "Tshwane University of Technology",
    abbreviation: "TUT",
    location: "Pretoria, Gauteng",
    program: "Human Resource Management",
    faculty: "Management Sciences",
    aps: 24,
    duration: "3 years",
    description:
      "Employee management, recruitment, and organizational behavior.",
  },
  {
    university: "Tshwane University of Technology",
    abbreviation: "TUT",
    location: "Pretoria, Gauteng",
    program: "Public Management",
    faculty: "Management Sciences",
    aps: 24,
    duration: "3 years",
    description: "Public sector administration and management.",
  },
  {
    university: "Tshwane University of Technology",
    abbreviation: "TUT",
    location: "Pretoria, Gauteng",
    program: "Environmental Health",
    faculty: "Science",
    aps: 26,
    duration: "3 years",
    description: "Environmental health and safety management.",
  },
  {
    university: "Tshwane University of Technology",
    abbreviation: "TUT",
    location: "Pretoria, Gauteng",
    program: "Food Technology",
    faculty: "Science",
    aps: 26,
    duration: "3 years",
    description: "Food processing and quality control.",
  },

  // UNISA (Distance Learning - Lower APS)
  {
    university: "University of South Africa",
    abbreviation: "UNISA",
    location: "Pretoria, Gauteng",
    program: "Bachelor of Commerce",
    faculty: "Economic and Management Sciences",
    aps: 23,
    duration: "3 years",
    description: "Commerce studies via distance learning.",
  },
  {
    university: "University of South Africa",
    abbreviation: "UNISA",
    location: "Pretoria, Gauteng",
    program: "Bachelor of Arts",
    faculty: "Human Sciences",
    aps: 21,
    duration: "3 years",
    description: "Liberal arts studies via distance learning.",
  },
  {
    university: "University of South Africa",
    abbreviation: "UNISA",
    location: "Pretoria, Gauteng",
    program: "Bachelor of Education",
    faculty: "Education",
    aps: 22,
    duration: "4 years",
    description: "Teaching qualification via distance learning.",
  },
  {
    university: "University of South Africa",
    abbreviation: "UNISA",
    location: "Pretoria, Gauteng",
    program: "Law (LLB)",
    faculty: "Law",
    aps: 26,
    duration: "4 years",
    description: "Legal education via distance learning.",
  },
  {
    university: "University of South Africa",
    abbreviation: "UNISA",
    location: "Pretoria, Gauteng",
    program: "Psychology",
    faculty: "Human Sciences",
    aps: 28,
    duration: "3 years",
    description: "Psychology studies via distance learning.",
  },
  {
    university: "University of South Africa",
    abbreviation: "UNISA",
    location: "Pretoria, Gauteng",
    program: "Information Systems",
    faculty: "Science Engineering and Technology",
    aps: 25,
    duration: "3 years",
    description: "Information systems via distance learning.",
  },
  {
    university: "University of South Africa",
    abbreviation: "UNISA",
    location: "Pretoria, Gauteng",
    program: "Accounting",
    faculty: "Economic and Management Sciences",
    aps: 25,
    duration: "3 years",
    description: "Accounting studies via distance learning.",
  },
  {
    university: "University of South Africa",
    abbreviation: "UNISA",
    location: "Pretoria, Gauteng",
    program: "Public Administration",
    faculty: "Economic and Management Sciences",
    aps: 23,
    duration: "3 years",
    description: "Public administration via distance learning.",
  },
  {
    university: "University of South Africa",
    abbreviation: "UNISA",
    location: "Pretoria, Gauteng",
    program: "Social Work",
    faculty: "Human Sciences",
    aps: 24,
    duration: "4 years",
    description: "Social work qualification via distance learning.",
  },
  {
    university: "University of South Africa",
    abbreviation: "UNISA",
    location: "Pretoria, Gauteng",
    program: "Criminology",
    faculty: "Human Sciences",
    aps: 23,
    duration: "3 years",
    description: "Criminology studies via distance learning.",
  },

  // Additional Universities and Programs
  // UFS (University of the Free State)
  {
    university: "University of the Free State",
    abbreviation: "UFS",
    location: "Bloemfontein, Free State",
    program: "Medicine",
    faculty: "Health Sciences",
    aps: 37,
    duration: "6 years",
    description: "Comprehensive medical training to become a qualified doctor.",
  },
  {
    university: "University of the Free State",
    abbreviation: "UFS",
    location: "Bloemfontein, Free State",
    program: "Engineering",
    faculty: "Natural and Agricultural Sciences",
    aps: 33,
    duration: "4 years",
    description: "Various engineering disciplines.",
  },
  {
    university: "University of the Free State",
    abbreviation: "UFS",
    location: "Bloemfontein, Free State",
    program: "Agriculture",
    faculty: "Natural and Agricultural Sciences",
    aps: 27,
    duration: "4 years",
    description: "Scientific principles applied to agriculture.",
  },
  {
    university: "University of the Free State",
    abbreviation: "UFS",
    location: "Bloemfontein, Free State",
    program: "Law (LLB)",
    faculty: "Law",
    aps: 32,
    duration: "4 years",
    description: "Comprehensive legal education and jurisprudence.",
  },
  {
    university: "University of the Free State",
    abbreviation: "UFS",
    location: "Bloemfontein, Free State",
    program: "Education",
    faculty: "Education",
    aps: 24,
    duration: "4 years",
    description: "Teaching methodology for various phases.",
  },
  {
    university: "University of the Free State",
    abbreviation: "UFS",
    location: "Bloemfontein, Free State",
    program: "Psychology",
    faculty: "Humanities",
    aps: 31,
    duration: "3 years",
    description: "Study of human behavior and mental processes.",
  },
  {
    university: "University of the Free State",
    abbreviation: "UFS",
    location: "Bloemfontein, Free State",
    program: "Social Work",
    faculty: "Humanities",
    aps: 25,
    duration: "4 years",
    description: "Social services and community development.",
  },
  {
    university: "University of the Free State",
    abbreviation: "UFS",
    location: "Bloemfontein, Free State",
    program: "Pharmacy",
    faculty: "Health Sciences",
    aps: 34,
    duration: "4 years",
    description: "Study of drugs, their properties, and pharmaceutical care.",
  },

  // DUT (Durban University of Technology)
  {
    university: "Durban University of Technology",
    abbreviation: "DUT",
    location: "Durban, KwaZulu-Natal",
    program: "Engineering Technology",
    faculty: "Engineering and the Built Environment",
    aps: 27,
    duration: "3 years",
    description: "Technical engineering training in various specializations.",
  },
  {
    university: "Durban University of Technology",
    abbreviation: "DUT",
    location: "Durban, KwaZulu-Natal",
    program: "Information Technology",
    faculty: "Applied Sciences",
    aps: 26,
    duration: "3 years",
    description: "Technical IT skills and computer systems.",
  },
  {
    university: "Durban University of Technology",
    abbreviation: "DUT",
    location: "Durban, KwaZulu-Natal",
    program: "Business Studies",
    faculty: "Management Sciences",
    aps: 24,
    duration: "3 years",
    description: "Practical business skills and management.",
  },
  {
    university: "Durban University of Technology",
    abbreviation: "DUT",
    location: "Durban, KwaZulu-Natal",
    program: "Biotechnology",
    faculty: "Applied Sciences",
    aps: 28,
    duration: "3 years",
    description:
      "Application of biological systems for technological advances.",
  },
  {
    university: "Durban University of Technology",
    abbreviation: "DUT",
    location: "Durban, KwaZulu-Natal",
    program: "Health Sciences",
    faculty: "Health Sciences",
    aps: 29,
    duration: "4 years",
    description: "Various health science programs.",
  },
  {
    university: "Durban University of Technology",
    abbreviation: "DUT",
    location: "Durban, KwaZulu-Natal",
    program: "Design",
    faculty: "Arts and Design",
    aps: 26,
    duration: "3 years",
    description: "Visual design and creative arts.",
  },
  {
    university: "Durban University of Technology",
    abbreviation: "DUT",
    location: "Durban, KwaZulu-Natal",
    program: "Accounting",
    faculty: "Accounting and Informatics",
    aps: 26,
    duration: "3 years",
    description: "Financial accounting and business finance.",
  },

  // NWU (North-West University)
  {
    university: "North-West University",
    abbreviation: "NWU",
    location: "Potchefstroom, North West",
    program: "Medicine",
    faculty: "Health Sciences",
    aps: 36,
    duration: "6 years",
    description: "Comprehensive medical training to become a qualified doctor.",
  },
  {
    university: "North-West University",
    abbreviation: "NWU",
    location: "Potchefstroom, North West",
    program: "Engineering",
    faculty: "Engineering",
    aps: 32,
    duration: "4 years",
    description: "Various engineering disciplines.",
  },
  {
    university: "North-West University",
    abbreviation: "NWU",
    location: "Potchefstroom, North West",
    program: "Pharmacy",
    faculty: "Health Sciences",
    aps: 33,
    duration: "4 years",
    description: "Study of drugs, their properties, and pharmaceutical care.",
  },
  {
    university: "North-West University",
    abbreviation: "NWU",
    location: "Potchefstroom, North West",
    program: "Law (LLB)",
    faculty: "Law",
    aps: 31,
    duration: "4 years",
    description: "Comprehensive legal education and jurisprudence.",
  },
  {
    university: "North-West University",
    abbreviation: "NWU",
    location: "Potchefstroom, North West",
    program: "Education",
    faculty: "Education Sciences",
    aps: 23,
    duration: "4 years",
    description: "Teaching methodology for various phases.",
  },
  {
    university: "North-West University",
    abbreviation: "NWU",
    location: "Potchefstroom, North West",
    program: "Business Management",
    faculty: "Economic Sciences",
    aps: 27,
    duration: "3 years",
    description: "General business administration and management principles.",
  },
  {
    university: "North-West University",
    abbreviation: "NWU",
    location: "Potchefstroom, North West",
    program: "Psychology",
    faculty: "Humanities",
    aps: 30,
    duration: "3 years",
    description: "Study of human behavior and mental processes.",
  },

  // UWC (University of the Western Cape)
  {
    university: "University of the Western Cape",
    abbreviation: "UWC",
    location: "Cape Town, Western Cape",
    program: "Medicine",
    faculty: "Community and Health Sciences",
    aps: 35,
    duration: "6 years",
    description: "Comprehensive medical training to become a qualified doctor.",
  },
  {
    university: "University of the Western Cape",
    abbreviation: "UWC",
    location: "Cape Town, Western Cape",
    program: "Dentistry",
    faculty: "Dentistry",
    aps: 36,
    duration: "5 years",
    description: "Training in dental medicine and oral health care.",
  },
  {
    university: "University of the Western Cape",
    abbreviation: "UWC",
    location: "Cape Town, Western Cape",
    program: "Pharmacy",
    faculty: "Natural Sciences",
    aps: 32,
    duration: "4 years",
    description: "Study of drugs, their properties, and pharmaceutical care.",
  },
  {
    university: "University of the Western Cape",
    abbreviation: "UWC",
    location: "Cape Town, Western Cape",
    program: "Law (LLB)",
    faculty: "Law",
    aps: 30,
    duration: "4 years",
    description: "Comprehensive legal education and jurisprudence.",
  },
  {
    university: "University of the Western Cape",
    abbreviation: "UWC",
    location: "Cape Town, Western Cape",
    program: "Education",
    faculty: "Education",
    aps: 23,
    duration: "4 years",
    description: "Teaching methodology for various phases.",
  },
  {
    university: "University of the Western Cape",
    abbreviation: "UWC",
    location: "Cape Town, Western Cape",
    program: "Psychology",
    faculty: "Community and Health Sciences",
    aps: 29,
    duration: "3 years",
    description: "Study of human behavior and mental processes.",
  },
  {
    university: "University of the Western Cape",
    abbreviation: "UWC",
    location: "Cape Town, Western Cape",
    program: "Social Work",
    faculty: "Community and Health Sciences",
    aps: 24,
    duration: "4 years",
    description: "Social services and community development.",
  },

  // Rhodes University
  {
    university: "Rhodes University",
    abbreviation: "RU",
    location: "Grahamstown, Eastern Cape",
    program: "Journalism",
    faculty: "Humanities",
    aps: 29,
    duration: "3 years",
    description: "News gathering, writing, and media production.",
  },
  {
    university: "Rhodes University",
    abbreviation: "RU",
    location: "Grahamstown, Eastern Cape",
    program: "Computer Science",
    faculty: "Science",
    aps: 30,
    duration: "3 years",
    description: "Programming, algorithms, and computational theory.",
  },
  {
    university: "Rhodes University",
    abbreviation: "RU",
    location: "Grahamstown, Eastern Cape",
    program: "Psychology",
    faculty: "Humanities",
    aps: 31,
    duration: "3 years",
    description: "Study of human behavior and mental processes.",
  },
  {
    university: "Rhodes University",
    abbreviation: "RU",
    location: "Grahamstown, Eastern Cape",
    program: "Law (LLB)",
    faculty: "Law",
    aps: 32,
    duration: "4 years",
    description: "Comprehensive legal education and jurisprudence.",
  },
  {
    university: "Rhodes University",
    abbreviation: "RU",
    location: "Grahamstown, Eastern Cape",
    program: "English Literature",
    faculty: "Humanities",
    aps: 27,
    duration: "3 years",
    description: "Study of English language, literature, and communication.",
  },
  {
    university: "Rhodes University",
    abbreviation: "RU",
    location: "Grahamstown, Eastern Cape",
    program: "Environmental Science",
    faculty: "Science",
    aps: 29,
    duration: "3 years",
    description: "Study of environmental problems and solutions.",
  },
  {
    university: "Rhodes University",
    abbreviation: "RU",
    location: "Grahamstown, Eastern Cape",
    program: "Drama",
    faculty: "Humanities",
    aps: 26,
    duration: "3 years",
    description: "Performance, directing, and theatrical production.",
  },

  // CPUT (Cape Peninsula University of Technology)
  {
    university: "Cape Peninsula University of Technology",
    abbreviation: "CPUT",
    location: "Cape Town, Western Cape",
    program: "Engineering",
    faculty: "Engineering",
    aps: 28,
    duration: "4 years",
    description: "Technical engineering training in various specializations.",
  },
  {
    university: "Cape Peninsula University of Technology",
    abbreviation: "CPUT",
    location: "Cape Town, Western Cape",
    program: "Information Technology",
    faculty: "Informatics and Design",
    aps: 26,
    duration: "3 years",
    description: "Technical IT skills and computer systems.",
  },
  {
    university: "Cape Peninsula University of Technology",
    abbreviation: "CPUT",
    location: "Cape Town, Western Cape",
    program: "Business Studies",
    faculty: "Business and Management Sciences",
    aps: 24,
    duration: "3 years",
    description: "Practical business skills and management.",
  },
  {
    university: "Cape Peninsula University of Technology",
    abbreviation: "CPUT",
    location: "Cape Town, Western Cape",
    program: "Design",
    faculty: "Informatics and Design",
    aps: 25,
    duration: "3 years",
    description: "Visual design and creative arts.",
  },
  {
    university: "Cape Peninsula University of Technology",
    abbreviation: "CPUT",
    location: "Cape Town, Western Cape",
    program: "Health Sciences",
    faculty: "Health and Wellness Sciences",
    aps: 27,
    duration: "4 years",
    description: "Various health science programs.",
  },
  {
    university: "Cape Peninsula University of Technology",
    abbreviation: "CPUT",
    location: "Cape Town, Western Cape",
    program: "Education",
    faculty: "Education and Social Sciences",
    aps: 23,
    duration: "4 years",
    description: "Teaching methodology for various phases.",
  },

  // VUT (Vaal University of Technology)
  {
    university: "Vaal University of Technology",
    abbreviation: "VUT",
    location: "Vanderbijlpark, Gauteng",
    program: "Engineering",
    faculty: "Engineering and Technology",
    aps: 26,
    duration: "4 years",
    description: "Technical engineering training in various specializations.",
  },
  {
    university: "Vaal University of Technology",
    abbreviation: "VUT",
    location: "Vanderbijlpark, Gauteng",
    program: "Information Technology",
    faculty: "Applied and Computer Sciences",
    aps: 24,
    duration: "3 years",
    description: "Technical IT skills and computer systems.",
  },
  {
    university: "Vaal University of Technology",
    abbreviation: "VUT",
    location: "Vanderbijlpark, Gauteng",
    program: "Business Management",
    faculty: "Management Sciences",
    aps: 23,
    duration: "3 years",
    description: "Practical business skills and management.",
  },
  {
    university: "Vaal University of Technology",
    abbreviation: "VUT",
    location: "Vanderbijlpark, Gauteng",
    program: "Education",
    faculty: "Human Sciences",
    aps: 22,
    duration: "4 years",
    description: "Teaching methodology for various phases.",
  },
  {
    university: "Vaal University of Technology",
    abbreviation: "VUT",
    location: "Vanderbijlpark, Gauteng",
    program: "Applied Sciences",
    faculty: "Applied and Computer Sciences",
    aps: 25,
    duration: "3 years",
    description: "Applied science and technology programs.",
  },

  // UFH (University of Fort Hare)
  {
    university: "University of Fort Hare",
    abbreviation: "UFH",
    location: "Alice, Eastern Cape",
    program: "Medicine",
    faculty: "Health Sciences",
    aps: 34,
    duration: "6 years",
    description: "Comprehensive medical training to become a qualified doctor.",
  },
  {
    university: "University of Fort Hare",
    abbreviation: "UFH",
    location: "Alice, Eastern Cape",
    program: "Agriculture",
    faculty: "Science and Agriculture",
    aps: 25,
    duration: "4 years",
    description: "Scientific principles applied to agriculture.",
  },
  {
    university: "University of Fort Hare",
    abbreviation: "UFH",
    location: "Alice, Eastern Cape",
    program: "Education",
    faculty: "Education",
    aps: 22,
    duration: "4 years",
    description: "Teaching methodology for various phases.",
  },
  {
    university: "University of Fort Hare",
    abbreviation: "UFH",
    location: "Alice, Eastern Cape",
    program: "Law (LLB)",
    faculty: "Law",
    aps: 28,
    duration: "4 years",
    description: "Comprehensive legal education and jurisprudence.",
  },
  {
    university: "University of Fort Hare",
    abbreviation: "UFH",
    location: "Alice, Eastern Cape",
    program: "Social Work",
    faculty: "Social Sciences and Humanities",
    aps: 23,
    duration: "4 years",
    description: "Social services and community development.",
  },
  {
    university: "University of Fort Hare",
    abbreviation: "UFH",
    location: "Alice, Eastern Cape",
    program: "Economics",
    faculty: "Management and Commerce",
    aps: 25,
    duration: "3 years",
    description: "Economic theory, policy analysis, and market behavior.",
  },

  // Additional Programs for existing universities to make the dataset more comprehensive
  {
    university: "University of Cape Town",
    abbreviation: "UCT",
    location: "Cape Town, Western Cape",
    program: "Actuarial Science",
    faculty: "Commerce",
    aps: 40,
    duration: "3 years",
    description: "Mathematical analysis of financial risk and uncertainty.",
  },
  {
    university: "University of Cape Town",
    abbreviation: "UCT",
    location: "Cape Town, Western Cape",
    program: "Economics",
    faculty: "Commerce",
    aps: 31,
    duration: "3 years",
    description: "Economic theory, policy analysis, and market behavior.",
  },
  {
    university: "University of Cape Town",
    abbreviation: "UCT",
    location: "Cape Town, Western Cape",
    program: "Philosophy",
    faculty: "Humanities",
    aps: 29,
    duration: "3 years",
    description: "Critical thinking and analysis of fundamental questions.",
  },
  {
    university: "University of Cape Town",
    abbreviation: "UCT",
    location: "Cape Town, Western Cape",
    program: "Fine Arts",
    faculty: "Humanities",
    aps: 28,
    duration: "3 years",
    description:
      "Creative visual arts including painting, sculpture, and drawing.",
  },
  {
    university: "University of Cape Town",
    abbreviation: "UCT",
    location: "Cape Town, Western Cape",
    program: "Social Work",
    faculty: "Humanities",
    aps: 28,
    duration: "4 years",
    description: "Social services and community development.",
  },

  {
    university: "University of the Witwatersrand",
    abbreviation: "Wits",
    location: "Johannesburg, Gauteng",
    program: "Architecture",
    faculty: "Engineering and Built Environment",
    aps: 36,
    duration: "5 years",
    description: "Architectural design and building design.",
  },
  {
    university: "University of the Witwatersrand",
    abbreviation: "Wits",
    location: "Johannesburg, Gauteng",
    program: "Electrical Engineering",
    faculty: "Engineering and Built Environment",
    aps: 39,
    duration: "4 years",
    description:
      "Design and develop electrical systems, electronics, and power systems.",
  },
  {
    university: "University of the Witwatersrand",
    abbreviation: "Wits",
    location: "Johannesburg, Gauteng",
    program: "Chemical Engineering",
    faculty: "Engineering and Built Environment",
    aps: 40,
    duration: "4 years",
    description:
      "Apply chemistry and physics principles to transform raw materials.",
  },
  {
    university: "University of the Witwatersrand",
    abbreviation: "Wits",
    location: "Johannesburg, Gauteng",
    program: "Economics",
    faculty: "Commerce",
    aps: 30,
    duration: "3 years",
    description: "Economic theory, policy analysis, and market behavior.",
  },
  {
    university: "University of the Witwatersrand",
    abbreviation: "Wits",
    location: "Johannesburg, Gauteng",
    program: "Political Studies",
    faculty: "Humanities",
    aps: 28,
    duration: "3 years",
    description: "Study of political systems, behavior, and governance.",
  },

  {
    university: "Stellenbosch University",
    abbreviation: "SU",
    location: "Stellenbosch, Western Cape",
    program: "Industrial Engineering",
    faculty: "Engineering",
    aps: 37,
    duration: "4 years",
    description: "Optimize complex processes and systems for efficiency.",
  },
  {
    university: "Stellenbosch University",
    abbreviation: "SU",
    location: "Stellenbosch, Western Cape",
    program: "Mechanical Engineering",
    faculty: "Engineering",
    aps: 37,
    duration: "4 years",
    description: "Design, develop and manufacture mechanical systems.",
  },
  {
    university: "Stellenbosch University",
    abbreviation: "SU",
    location: "Stellenbosch, Western Cape",
    program: "Mathematical Sciences",
    faculty: "Science",
    aps: 33,
    duration: "3 years",
    description:
      "Pure and applied mathematics, statistics, and mathematical modeling.",
  },
  {
    university: "Stellenbosch University",
    abbreviation: "SU",
    location: "Stellenbosch, Western Cape",
    program: "Information Technology",
    faculty: "Engineering",
    aps: 31,
    duration: "3 years",
    description: "Information systems, networking, and technology management.",
  },
  {
    university: "Stellenbosch University",
    abbreviation: "SU",
    location: "Stellenbosch, Western Cape",
    program: "Theology",
    faculty: "Theology",
    aps: 26,
    duration: "3 years",
    description: "Religious studies and theological education.",
  },
];

// Use real data if available, otherwise fallback - ensure we always have data
const FINAL_UNIVERSITY_PROGRAMS =
  UNIVERSITY_PROGRAMS.length > 0 ? UNIVERSITY_PROGRAMS : FALLBACK_PROGRAMS;

// Safety check - ensure we have at least some programs
if (FINAL_UNIVERSITY_PROGRAMS.length === 0) {
  console.error(
    "No university programs available - this will cause a blank screen",
  );
}

// Debug logging in development
if (import.meta.env.DEV) {
  console.log(
    `🎓 APS Calculator: Using ${FINAL_UNIVERSITY_PROGRAMS.length} programs from ${UNIVERSITY_PROGRAMS.length > 0 ? "real" : "fallback"} data`,
  );
}

// Types
interface APSSubject {
  name: string;
  marks: number;
  level: number;
  points: number;
}

interface DegreeInsight {
  name: string;
  university: string;
  faculty: string;
  apsRequirement: number;
  duration: string;
  description: string;
  eligible: boolean;
  apsGap?: number;
  competitiveness: "High" | "Moderate" | "Accessible";
}

// Default subjects
const CORE_SUBJECTS: APSSubject[] = [
  { name: "English Home Language", marks: 0, level: 4, points: 0 },
  { name: "Mathematics", marks: 0, level: 4, points: 0 },
  { name: "Select Subject", marks: 0, level: 4, points: 0 },
  { name: "Select Subject", marks: 0, level: 4, points: 0 },
  { name: "Select Subject", marks: 0, level: 4, points: 0 },
  { name: "Select Subject", marks: 0, level: 4, points: 0 },
];

// Sample subjects with good marks
const SAMPLE_SUBJECTS: APSSubject[] = [
  { name: "English Home Language", marks: 75, level: 4, points: 6 },
  { name: "Mathematics", marks: 80, level: 4, points: 7 },
  { name: "Physical Sciences", marks: 70, level: 4, points: 6 },
  { name: "Life Sciences", marks: 65, level: 4, points: 5 },
  { name: "Geography", marks: 72, level: 4, points: 6 },
  {
    name: "Afrikaans First Additional Language",
    marks: 68,
    level: 4,
    points: 5,
  },
];

// APS calculation function
const calculateAPSPoints = (marks: number): number => {
  if (isNaN(marks) || marks < 0) return 0;
  if (marks >= 80) return 7;
  if (marks >= 70) return 6;
  if (marks >= 60) return 5;
  if (marks >= 50) return 4;
  if (marks >= 40) return 3;
  if (marks >= 30) return 2;
  return 1;
};

// Performance level
const getPerformanceLevel = (
  aps: number,
): { level: string; color: string; description: string } => {
  if (aps >= 36)
    return {
      level: "Outstanding",
      color: "text-purple-600 bg-purple-100",
      description: "Elite performance - access to any program",
    };
  if (aps >= 30)
    return {
      level: "Excellent",
      color: "text-emerald-600 bg-emerald-100",
      description: "Strong performance - most programs available",
    };
  if (aps >= 24)
    return {
      level: "Good",
      color: "text-book-600 bg-book-100",
      description: "Solid performance - many options available",
    };
  if (aps >= 18)
    return {
      level: "Fair",
      color: "text-orange-600 bg-orange-100",
      description: "Basic performance - limited options",
    };
  return {
    level: "Needs Improvement",
    color: "text-red-600 bg-red-100",
    description: "Consider improvement strategies",
  };
};

const SimpleAPSCalculator: React.FC = () => {
  const navigate = useNavigate();

  // State
  const [subjects, setSubjects] = useState<APSSubject[]>(CORE_SUBJECTS);
  const [activeInsight, setActiveInsight] = useState<"overview" | "programs">(
    "programs",
  );
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "eligible" | "competitive"
  >("all");
  const [showAllPrograms, setShowAllPrograms] = useState(false);

  // Calculate total APS
  const totalAPS = useMemo(() => {
    const total = subjects.reduce(
      (total, subject) => total + (subject.points || 0),
      0,
    );
    return isNaN(total) ? 0 : total;
  }, [subjects]);

  // Performance analysis
  const performance = useMemo(() => getPerformanceLevel(totalAPS), [totalAPS]);

  // Update subject marks
  const updateSubjectMarks = useCallback((index: number, marks: number) => {
    setSubjects((prevSubjects) => {
      const newSubjects = [...prevSubjects];
      newSubjects[index].marks = Math.max(0, Math.min(100, marks));
      newSubjects[index].points = calculateAPSPoints(newSubjects[index].marks);
      return newSubjects;
    });
  }, []);

  // Update subject name
  const updateSubjectName = useCallback((index: number, name: string) => {
    setSubjects((prevSubjects) => {
      const newSubjects = [...prevSubjects];
      newSubjects[index].name = name;
      return newSubjects;
    });
  }, []);

  // Available subjects
  const availableSubjects = useMemo(() => {
    return SOUTH_AFRICAN_SUBJECTS.filter(
      (subject) =>
        !subjects.some((s) => s.name === subject) || subject.includes("Select"),
    );
  }, [subjects]);

  // Degree analysis using simplified data
  const degreeAnalysis = useMemo(() => {
    const degrees: DegreeInsight[] = [];

    FINAL_UNIVERSITY_PROGRAMS.forEach((prog) => {
      const eligible = totalAPS >= prog.aps;
      const apsGap = eligible ? 0 : prog.aps - totalAPS;

      let competitiveness: "High" | "Moderate" | "Accessible" = "Accessible";
      if (prog.aps >= 32) competitiveness = "High";
      else if (prog.aps >= 26) competitiveness = "Moderate";

      degrees.push({
        name: prog.program,
        university: prog.university,
        faculty: prog.faculty,
        apsRequirement: prog.aps,
        duration: prog.duration,
        description: prog.description,
        eligible,
        apsGap,
        competitiveness,
      });
    });

    return degrees.sort((a, b) => {
      if (a.eligible && !b.eligible) return -1;
      if (!a.eligible && b.eligible) return 1;
      return a.apsRequirement - b.apsRequirement;
    });
  }, [totalAPS]);

  // University matches
  const universityMatches = useMemo(() => {
    const universityMap = new Map();

    FINAL_UNIVERSITY_PROGRAMS.forEach((prog) => {
      const key = prog.abbreviation;
      if (!universityMap.has(key)) {
        universityMap.set(key, {
          university: prog.university,
          abbreviation: prog.abbreviation,
          location: prog.location,
          programs: [],
          eligiblePrograms: 0,
          totalPrograms: 0,
        });
      }

      const uni = universityMap.get(key);
      uni.programs.push(prog);
      uni.totalPrograms++;
      if (totalAPS >= prog.aps) {
        uni.eligiblePrograms++;
      }
    });

    return Array.from(universityMap.values())
      .map((uni) => {
        const avgAPS = Math.round(
          uni.programs.reduce(
            (sum: number, p: { aps: number }) => sum + p.aps,
            0,
          ) / uni.programs.length,
        );
        let competitiveness: "High" | "Moderate" | "Accessible" = "Accessible";
        if (avgAPS >= 30) competitiveness = "High";
        else if (avgAPS >= 24) competitiveness = "Moderate";

        return {
          ...uni,
          averageAPS: avgAPS,
          competitiveness,
        };
      })
      .sort((a, b) => b.eligiblePrograms - a.eligiblePrograms);
  }, [totalAPS]);

  // Statistics
  const stats = useMemo(() => {
    const totalDegrees = degreeAnalysis.length;
    const eligibleCount =
      totalAPS > 0 ? degreeAnalysis.filter((d) => d.eligible).length : 0;
    const eligibilityRate =
      totalDegrees > 0 && totalAPS > 0
        ? Math.round((eligibleCount / totalDegrees) * 100)
        : 0;
    const topUniversities = universityMatches.filter(
      (u) => u.eligiblePrograms > 0,
    ).length;
    const averageRequirement =
      totalDegrees > 0
        ? Math.round(
            degreeAnalysis.reduce((sum, d) => sum + d.apsRequirement, 0) /
              totalDegrees,
          )
        : 0;

    return {
      totalDegrees,
      eligibleCount,
      eligibilityRate: isNaN(eligibilityRate) ? 0 : eligibilityRate,
      topUniversities,
      averageRequirement: isNaN(averageRequirement) ? 0 : averageRequirement,
      performancePercentile:
        isNaN(totalAPS) || totalAPS === 0
          ? 0
          : Math.min(100, Math.round((totalAPS / 42) * 100)),
    };
  }, [degreeAnalysis, universityMatches, totalAPS]);

  // Filter degrees with pagination and grouping by faculty
  const filteredDegrees = useMemo(() => {
    let filtered = degreeAnalysis;

    // Apply filtering based on selected filter, regardless of APS score
    switch (selectedFilter) {
      case "eligible":
        filtered = filtered.filter((d) => d.eligible);
        break;
      case "competitive":
        filtered = filtered.filter((d) => d.competitiveness === "High");
        break;
      case "all":
      default:
        if (totalAPS === 0) {
          // When no APS is entered, show all programs sorted by APS requirement
          filtered = filtered.sort(
            (a, b) => a.apsRequirement - b.apsRequirement,
          );
        } else {
          // Show all programs, but prioritize eligible ones
          filtered = filtered.sort((a, b) => {
            if (a.eligible && !b.eligible) return -1;
            if (!a.eligible && b.eligible) return 1;
            return a.apsRequirement - b.apsRequirement;
          });
        }
        break;
    }

    return filtered;
  }, [degreeAnalysis, selectedFilter, totalAPS]);

  // Group programs by faculty
  const programsByFaculty = useMemo(() => {
    const grouped = filteredDegrees.reduce(
      (acc, program) => {
        const faculty = program.faculty || "Other";
        if (!acc[faculty]) {
          acc[faculty] = [];
        }
        acc[faculty].push(program);
        return acc;
      },
      {} as Record<string, typeof filteredDegrees>,
    );

    // Sort faculties by number of eligible programs
    const sortedFaculties = Object.entries(grouped)
      .map(([faculty, programs]) => ({
        faculty,
        programs,
        eligibleCount: programs.filter((p) => p.eligible).length,
        totalCount: programs.length,
      }))
      .sort((a, b) => b.eligibleCount - a.eligibleCount);

    return sortedFaculties;
  }, [filteredDegrees]);

  // Pagination for programs display
  const displayedPrograms = useMemo(() => {
    const limit = showAllPrograms ? filteredDegrees.length : 6;
    return filteredDegrees.slice(0, limit);
  }, [filteredDegrees, showAllPrograms]);

  const handleReset = () => {
    setSubjects(CORE_SUBJECTS);
    toast.success("Calculator reset");
  };

  const handleLoadSample = () => {
    setSubjects(SAMPLE_SUBJECTS);
    toast.success("Sample marks loaded (APS: 35)");
    setActiveInsight("programs");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500 rounded-2xl mb-6">
              <Calculator className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">
              Professional APS Calculator
            </h1>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Calculate your Admission Point Score and discover which university
              programs you qualify for. Enter your matric marks to see your
              eligibility across South African universities.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            <div className="bg-slate-800 rounded-xl p-6 text-center border border-slate-700">
              <TrendingUp className="h-8 w-8 text-emerald-400 mx-auto mb-3" />
              <div className="text-3xl font-bold text-white mb-1">
                {totalAPS}
              </div>
              <div className="text-slate-300 text-sm uppercase tracking-wider">
                Current APS
              </div>
            </div>
            <div className="bg-slate-800 rounded-xl p-6 text-center border border-slate-700">
              <Target className="h-8 w-8 text-book-400 mx-auto mb-3" />
              <div className="text-3xl font-bold text-white mb-1">
                {stats.eligibilityRate}%
              </div>
              <div className="text-slate-300 text-sm uppercase tracking-wider">
                Eligibility Rate
              </div>
            </div>
            <div className="bg-slate-800 rounded-xl p-6 text-center border border-slate-700">
              <Building className="h-8 w-8 text-purple-400 mx-auto mb-3" />
              <div className="text-3xl font-bold text-white mb-1">
                {stats.topUniversities}
              </div>
              <div className="text-slate-300 text-sm uppercase tracking-wider">
                Universities
              </div>
            </div>
            <div className="bg-slate-800 rounded-xl p-6 text-center border border-slate-700">
              <GraduationCap className="h-8 w-8 text-orange-400 mx-auto mb-3" />
              <div className="text-3xl font-bold text-white mb-1">
                {stats.eligibleCount}
              </div>
              <div className="text-slate-300 text-sm uppercase tracking-wider">
                Eligible Programs
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Calculator */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-white border-0 shadow-xl">
              <CardHeader className="border-b border-slate-100 pb-4">
                <CardTitle className="flex items-center gap-3 text-slate-900">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Calculator className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-lg font-semibold">APS Calculator</div>
                    <div className="text-sm text-slate-500">
                      Enter your marks below
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {subjects.map((subject, index) => (
                  <div key={index} className="space-y-2">
                    <Label className="text-slate-700 font-medium">{`Subject ${index + 1}`}</Label>
                    <div className="flex flex-col sm:grid sm:grid-cols-12 gap-2 sm:gap-3 items-start sm:items-center">
                      <div className="w-full sm:col-span-7">
                        <Select
                          value={subject.name}
                          onValueChange={(value) =>
                            updateSubjectName(index, value)
                          }
                        >
                          <SelectTrigger className="bg-slate-50 border-slate-200 w-full">
                            <SelectValue placeholder="Select subject" />
                          </SelectTrigger>
                          <SelectContent>
                            {subject.name !== "Select Subject" && (
                              <SelectItem
                                key={`current-${subject.name}`}
                                value={subject.name}
                              >
                                {subject.name}
                              </SelectItem>
                            )}
                            {availableSubjects.map((availableSubject) => (
                              <SelectItem
                                key={availableSubject}
                                value={availableSubject}
                              >
                                {availableSubject}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex w-full sm:col-span-5 gap-2 items-center">
                        <div className="flex-1 sm:flex-none sm:w-20">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={subject.marks || ""}
                            onChange={(e) =>
                              updateSubjectMarks(
                                index,
                                parseInt(e.target.value) || 0,
                              )
                            }
                            className="bg-slate-50 border-slate-200 text-center font-medium"
                            placeholder="Enter marks"
                          />
                        </div>
                        <div className="flex-shrink-0">
                          <div
                            className={cn(
                              "inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold",
                              subject.points >= 5
                                ? "bg-emerald-100 text-emerald-700"
                                : subject.points >= 3
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-slate-100 text-slate-600",
                            )}
                          >
                            {subject.points}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* APS Result */}
                <div className="mt-8 p-6 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl border border-emerald-200">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-slate-900 mb-2">
                      {totalAPS}
                    </div>
                    <div className="text-slate-600 mb-4">Total APS Score</div>
                    <Badge className={performance.color} variant="secondary">
                      {performance.level}
                    </Badge>
                    <div className="text-sm text-slate-600 mt-2">
                      {performance.description}
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">
                        Performance Percentile
                      </span>
                      <span className="font-medium text-slate-900">
                        {stats.performancePercentile}%
                      </span>
                    </div>
                    <Progress
                      value={stats.performancePercentile}
                      className="h-2"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3 pt-4">
                  <div className="flex gap-3">
                    <Button
                      onClick={handleReset}
                      variant="outline"
                      className="flex-1 border-slate-200 hover:bg-slate-50"
                    >
                      Reset
                    </Button>
                    <Button
                      onClick={handleLoadSample}
                      variant="outline"
                      className="flex-1 border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                    >
                      Try Sample
                    </Button>
                  </div>
                  {totalAPS === 0 && (
                    <div className="text-center">
                      <p className="text-sm text-slate-600 mb-2">
                        👆 Click "Try Sample" to see the calculator in action
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <div className="lg:col-span-2">
            <Tabs
              value={activeInsight}
              onValueChange={(value: string) => setActiveInsight(value)}
              className="w-full"
            >
              <TabsList className="grid grid-cols-1 sm:grid-cols-2 w-full mb-6 bg-white border border-slate-200 h-auto sm:h-10">
                <TabsTrigger
                  value="overview"
                  className="data-[state=active]:bg-slate-900 data-[state=active]:text-white"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Program Overview
                </TabsTrigger>
                <TabsTrigger
                  value="programs"
                  className="data-[state=active]:bg-slate-900 data-[state=active]:text-white"
                >
                  <GraduationCap className="h-4 w-4 mr-2" />
                  Programs
                </TabsTrigger>
              </TabsList>

              <TabsContent value="programs" className="space-y-6">
                {/* Filter Controls */}
                <Card className="bg-white border-0 shadow-lg">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-slate-900">
                      <Filter className="h-5 w-5 text-slate-600" />
                      Program Filters
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <Button
                        variant={
                          selectedFilter === "all" ? "default" : "outline"
                        }
                        onClick={() => setSelectedFilter("all")}
                        className={`w-full sm:w-auto ${selectedFilter === "all" ? "bg-slate-900 hover:bg-slate-800" : ""}`}
                        size="sm"
                      >
                        All Programs
                      </Button>
                      <Button
                        variant={
                          selectedFilter === "eligible" ? "default" : "outline"
                        }
                        onClick={() => setSelectedFilter("eligible")}
                        className={`w-full sm:w-auto ${selectedFilter === "eligible" ? "bg-emerald-600 hover:bg-emerald-700" : ""}`}
                        size="sm"
                      >
                        Eligible Only
                      </Button>
                      <Button
                        variant={
                          selectedFilter === "competitive"
                            ? "default"
                            : "outline"
                        }
                        onClick={() => setSelectedFilter("competitive")}
                        className={`w-full sm:w-auto ${selectedFilter === "competitive" ? "bg-red-600 hover:bg-red-700" : ""}`}
                        size="sm"
                      >
                        Highly Competitive
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Program Results */}
                <Card className="bg-white border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-slate-900">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-5 w-5 text-purple-500" />
                        {totalAPS === 0
                          ? "Available Programs"
                          : "Program Matches"}
                      </div>
                      <Badge variant="outline">
                        {showAllPrograms
                          ? filteredDegrees.length
                          : Math.min(6, filteredDegrees.length)}{" "}
                        of {filteredDegrees.length}{" "}
                        {totalAPS === 0 ? "samples" : "results"}
                      </Badge>
                    </CardTitle>
                    {totalAPS === 0 && (
                      <CardDescription className="text-slate-600">
                        Enter your marks above to see which programs you're
                        eligible for. Below is a sample of available programs.
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    {filteredDegrees.length === 0 ? (
                      <div className="text-center py-8">
                        <GraduationCap className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-slate-600 mb-2">
                          No Programs Available
                        </h3>
                        <p className="text-slate-500 mb-4">
                          Enter your marks above or try the sample data to see
                          available programs.
                        </p>
                        <Button
                          onClick={handleLoadSample}
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          Load Sample Data
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Faculty Grouped Display */}
                        {programsByFaculty
                          .slice(
                            0,
                            showAllPrograms ? programsByFaculty.length : 3,
                          )
                          .map(
                            ({
                              faculty,
                              programs,
                              eligibleCount,
                              totalCount,
                            }) => (
                              <div
                                key={faculty}
                                className="border border-slate-200 rounded-lg p-4"
                              >
                                {/* Faculty Header */}
                                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                                  <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                                    <Building className="h-5 w-5 text-book-500" />
                                    {faculty}
                                  </h3>
                                  <div className="flex items-center gap-2">
                                    <Badge
                                      variant="outline"
                                      className="bg-emerald-50 text-emerald-700 border-emerald-200"
                                    >
                                      {eligibleCount} eligible
                                    </Badge>
                                    <Badge variant="outline">
                                      {totalCount} total
                                    </Badge>
                                  </div>
                                </div>

                                {/* Programs in this faculty */}
                                <div className="space-y-3">
                                  {programs
                                    .slice(
                                      0,
                                      showAllPrograms ? programs.length : 3,
                                    )
                                    .map((degree, index) => (
                                      <div
                                        key={index}
                                        className={`p-3 rounded-lg border transition-shadow hover:shadow-md ${degree.eligible ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50"}`}
                                      >
                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                          <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-slate-900 mb-1">
                                              {degree.name}
                                            </h4>
                                            <p className="text-sm text-slate-600 mb-2">
                                              {degree.university}
                                            </p>
                                            <p className="text-sm text-slate-700">
                                              {degree.description}
                                            </p>
                                          </div>
                                          <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2">
                                            <Badge
                                              variant={
                                                degree.eligible
                                                  ? "default"
                                                  : "destructive"
                                              }
                                              className={`${degree.eligible ? "bg-emerald-600 hover:bg-emerald-700" : ""} whitespace-nowrap`}
                                            >
                                              APS {degree.apsRequirement}
                                            </Badge>
                                            <Badge
                                              variant="outline"
                                              className={cn(
                                                "whitespace-nowrap",
                                                degree.competitiveness ===
                                                  "High"
                                                  ? "border-red-200 text-red-700 bg-red-50"
                                                  : degree.competitiveness ===
                                                      "Moderate"
                                                    ? "border-orange-200 text-orange-700 bg-orange-50"
                                                    : "border-green-200 text-green-700 bg-green-50",
                                              )}
                                            >
                                              {degree.competitiveness}
                                            </Badge>
                                          </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm mt-3">
                                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                            <span className="flex items-center gap-1 text-slate-600">
                                              <Calendar className="h-3 w-3" />
                                              {degree.duration}
                                            </span>
                                            {degree.eligible ? (
                                              <span className="flex items-center gap-1 text-emerald-600">
                                                <CheckCircle className="h-3 w-3" />
                                                Eligible
                                              </span>
                                            ) : (
                                              <span className="flex items-center gap-1 text-red-600">
                                                <AlertTriangle className="h-3 w-3" />
                                                Need {degree.apsGap} more points
                                              </span>
                                            )}
                                          </div>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="border-green-500 text-green-600 hover:bg-green-50 w-full sm:w-auto justify-center sm:justify-start"
                                          >
                                            View Details
                                            <ChevronRight className="h-3 w-3 ml-1" />
                                          </Button>
                                        </div>
                                      </div>
                                    ))}

                                  {/* Show more programs in this faculty */}
                                  {!showAllPrograms && programs.length > 3 && (
                                    <div className="text-center pt-2">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setShowAllPrograms(true)}
                                        className="text-slate-600 hover:text-slate-900"
                                      >
                                        +{programs.length - 3} more in {faculty}
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ),
                          )}

                        {/* View More Faculties Button */}
                        {programsByFaculty.length > 3 && (
                          <div className="text-center mt-6 pt-4 border-t border-slate-100">
                            {!showAllPrograms ? (
                              <Button
                                onClick={() => setShowAllPrograms(true)}
                                variant="outline"
                                className="border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                              >
                                View All Faculties (
                                {programsByFaculty.length - 3} more)
                              </Button>
                            ) : (
                              <Button
                                onClick={() => setShowAllPrograms(false)}
                                variant="outline"
                                className="border-slate-200 text-slate-600 hover:bg-slate-50"
                              >
                                Show Less
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                  <Card className="bg-white border-0 shadow-lg">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
                        <Trophy className="h-5 w-5 text-amber-500" />
                        Eligibility Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600">Total Programs</span>
                          <span className="text-xl font-bold text-slate-900">
                            {stats.totalDegrees}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600">
                            {totalAPS === 0
                              ? "Enter APS to see eligible"
                              : "Eligible Programs"}
                          </span>
                          <span
                            className={`text-xl font-bold ${totalAPS === 0 ? "text-slate-400" : "text-emerald-600"}`}
                          >
                            {totalAPS === 0 ? "?" : stats.eligibleCount}
                          </span>
                        </div>
                        <div className="pt-2">
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-slate-600">
                              Eligibility Rate
                            </span>
                            <span className="font-medium">
                              {totalAPS === 0
                                ? "Calculate APS first"
                                : `${stats.eligibilityRate}%`}
                            </span>
                          </div>
                          <Progress
                            value={totalAPS === 0 ? 0 : stats.eligibilityRate}
                            className="h-3"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border-0 shadow-lg">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
                        <TrendingUp className="h-5 w-5 text-book-500" />
                        Performance Metrics
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600">Your APS</span>
                          <span className="text-xl font-bold text-slate-900">
                            {totalAPS}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600">
                            Average Required
                          </span>
                          <span className="text-xl font-bold text-slate-600">
                            {stats.averageRequirement}
                          </span>
                        </div>
                        <div className="pt-2">
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-slate-600">
                              Performance Level
                            </span>
                            <span className="font-medium">
                              {performance.level}
                            </span>
                          </div>
                          <Progress
                            value={
                              isNaN(totalAPS) || totalAPS === 0
                                ? 0
                                : Math.min(100, (totalAPS / 42) * 100)
                            }
                            className="h-3"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Quick Actions Footer */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card
            className="bg-white border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
            onClick={() => navigate("/university-info?tool=bursaries")}
          >
            <CardContent className="p-6 text-center">
              <CreditCard className="h-8 w-8 text-emerald-500 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-900 mb-2">
                Find Bursaries
              </h3>
              <p className="text-sm text-slate-600">
                Discover funding opportunities for your studies
              </p>
            </CardContent>
          </Card>

          <Card
            className="bg-white border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
            onClick={() => navigate("/books")}
          >
            <CardContent className="p-6 text-center">
              <BookOpen className="h-8 w-8 text-book-500 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-900 mb-2">
                Browse Textbooks
              </h3>
              <p className="text-sm text-slate-600">
                Find books for your chosen programs
              </p>
            </CardContent>
          </Card>

          <Card
            className="bg-white border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
            onClick={() => navigate("/university-info")}
          >
            <CardContent className="p-6 text-center">
              <Lightbulb className="h-8 w-8 text-purple-500 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-900 mb-2">
                University Guide
              </h3>
              <p className="text-sm text-slate-600">
                Explore universities and programs in detail
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SimpleAPSCalculator;

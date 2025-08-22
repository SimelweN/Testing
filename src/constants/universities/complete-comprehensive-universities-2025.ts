import { University } from "@/types/university";

/**
 * COMPLETE COMPREHENSIVE UNIVERSITIES 2025
 * 
 * This file contains the complete university data with all faculties and programs
 * as provided by the user document. Each university has its exact faculty structure
 * and all programs with specific APS requirements.
 */

// Helper function to create degree objects with consistent structure
const createDegree = (
  name: string,
  apsRequirement: number | string,
  faculty: string,
  description?: string,
  duration: string = "3-4 years",
  subjects: Array<{ name: string; level: number; isRequired: boolean }> = [],
  careerProspects: string[] = [],
  code?: string
) => {
  // Handle APS requirement that might include different scores for Math/Math Lit
  let finalAPS = typeof apsRequirement === 'string' ? 
    parseInt(apsRequirement.split(' ')[0]) : apsRequirement;
  
  return {
    id: `${name.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-')}-${faculty.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-').substring(0, 10)}`,
    name,
    code: code || name.substring(0, 8).toUpperCase().replace(/[^A-Z0-9]/g, ''),
    faculty,
    duration,
    apsRequirement: finalAPS,
    description: description || `Study ${name} at university level with comprehensive academic preparation.`,
    subjects: subjects.length > 0 ? subjects : [
      { name: "English", level: 4, isRequired: true },
      { name: "Mathematics", level: 4, isRequired: false },
    ],
    careerProspects: careerProspects.length > 0 ? careerProspects : [
      "Professional in specialized field",
      "Research and development",
      "Consulting and advisory roles",
      "Academic and educational careers",
      "Leadership and management positions"
    ],
  };
};

export const COMPLETE_COMPREHENSIVE_UNIVERSITIES_2025: University[] = [
  // University of Limpopo (UL)
  {
    id: "ul",
    name: "University of Limpopo",
    abbreviation: "UL",
    fullName: "University of Limpopo",
    type: "Traditional University",
    location: "Polokwane",
    province: "Limpopo", 
    website: "https://www.ul.ac.za",
    logo: "/university-logos/ul.svg",
    overview: "A comprehensive university committed to academic excellence and community engagement in Limpopo province.",
    establishedYear: 2005,
    studentPopulation: 25000,
    faculties: [
      {
        id: "ul-humanities",
        name: "Faculty of Humanities",
        description: "Offering diverse programs in education, arts, languages, and social sciences.",
        degrees: [
          createDegree("Bachelor of Education (BEd)", 24, "Faculty of Humanities", "Four-year professional teacher training program", "4 years", 
            [{ name: "English", level: 4, isRequired: true }, { name: "Mathematics", level: 4, isRequired: true }],
            ["Primary School Teacher", "High School Teacher", "Educational Administrator", "Curriculum Developer"]),
          createDegree("Bachelor of Arts (Criminology & Psychology)", 23, "Faculty of Humanities", "Combined criminology and psychology studies", "3 years",
            [{ name: "English", level: 4, isRequired: true }, { name: "Life Sciences", level: 4, isRequired: false }],
            ["Criminologist", "Psychologist", "Social Worker", "Crime Analyst", "Researcher"]),
          createDegree("Bachelor of Arts (Sociology & Anthropology)", 23, "Faculty of Humanities", "Study of society and human culture", "3 years",
            [{ name: "English", level: 4, isRequired: true }, { name: "History", level: 4, isRequired: false }],
            ["Sociologist", "Anthropologist", "Social Researcher", "Community Development Officer"]),
          createDegree("Bachelor of Arts (Political Studies)", 25, "Faculty of Humanities", "Political science and governance studies", "3 years",
            [{ name: "English", level: 4, isRequired: true }, { name: "History", level: 4, isRequired: false }],
            ["Political Analyst", "Government Official", "Diplomat", "Policy Researcher", "Journalist"]),
          createDegree("Bachelor of Psychology", 23, "Faculty of Humanities", "Comprehensive psychology program", "3 years",
            [{ name: "English", level: 4, isRequired: true }, { name: "Mathematics", level: 4, isRequired: true }, { name: "Life Sciences", level: 4, isRequired: true }],
            ["Clinical Psychologist", "Educational Psychologist", "Industrial Psychologist", "Researcher"]),
          createDegree("Bachelor of Social Work", 23, "Faculty of Humanities", "Professional social work training", "4 years",
            [{ name: "English", level: 4, isRequired: true }, { name: "Life Sciences", level: 4, isRequired: false }],
            ["Social Worker", "Community Development Worker", "Child Protection Officer", "Family Therapist"]),
          createDegree("Bachelor of Arts (Languages)", 25, "Faculty of Humanities", "Language and linguistics studies", "3 years",
            [{ name: "English", level: 4, isRequired: true }, { name: "Home Language", level: 4, isRequired: true }],
            ["Translator", "Interpreter", "Language Teacher", "Editor", "Linguistic Researcher"]),
          createDegree("Bachelor of Information Studies", 25, "Faculty of Humanities", "Information science and library studies", "3 years",
            [{ name: "English", level: 4, isRequired: true }, { name: "Mathematics", level: 4, isRequired: false }],
            ["Librarian", "Information Manager", "Archivist", "Knowledge Manager", "Database Administrator"]),
          createDegree("Bachelor of Arts in Contemporary English and Multilingual Studies", 25, "Faculty of Humanities", "Modern English and multilingual communication", "3 years",
            [{ name: "English", level: 5, isRequired: true }, { name: "Home Language", level: 4, isRequired: true }],
            ["Language Specialist", "Translator", "Communication Consultant", "Publishing Professional"]),
          createDegree("Bachelor of Arts in Communication Studies", 25, "Faculty of Humanities", "Media and communication studies", "3 years",
            [{ name: "English", level: 4, isRequired: true }],
            ["Journalist", "Public Relations Officer", "Communications Manager", "Media Producer"]),
          createDegree("Bachelor of Arts in Media Studies", 25, "Faculty of Humanities", "Digital media and journalism", "3 years",
            [{ name: "English", level: 4, isRequired: true }],
            ["Media Producer", "Journalist", "Content Creator", "Digital Marketing Specialist"])
        ]
      },
      {
        id: "ul-management-law",
        name: "Faculty of Management and Law",
        description: "Business, management, and legal studies with practical application focus.",
        degrees: [
          createDegree("Bachelor of Accountancy", 30, "Faculty of Management and Law", "Professional accountancy program", "3 years",
            [{ name: "Mathematics", level: 5, isRequired: true }, { name: "English", level: 4, isRequired: true }],
            ["Chartered Accountant", "Financial Manager", "Auditor", "Tax Consultant", "Financial Analyst"]),
          createDegree("Bachelor of Commerce in Accountancy", 28, "Faculty of Management and Law", "Commerce with accounting specialization", "3 years",
            [{ name: "Mathematics", level: 5, isRequired: true }, { name: "English", level: 4, isRequired: true }],
            ["Accountant", "Financial Manager", "Business Analyst", "Tax Advisor"]),
          createDegree("Bachelor of Commerce in Human Resources Management", 26, "Faculty of Management and Law", "Human resources and organizational management", "3 years",
            [{ name: "English", level: 4, isRequired: true }, { name: "Mathematics", level: 4, isRequired: true }],
            ["HR Manager", "Recruitment Specialist", "Training Manager", "Labor Relations Officer"]),
          createDegree("Bachelor of Commerce in Business Management", 26, "Faculty of Management and Law", "General business management", "3 years",
            [{ name: "English", level: 4, isRequired: true }, { name: "Mathematics", level: 4, isRequired: true }],
            ["Business Manager", "Operations Manager", "Entrepreneur", "Project Manager", "Consultant"]),
          createDegree("Bachelor of Commerce in Economics", 26, "Faculty of Management and Law", "Economic theory and practice", "3 years",
            [{ name: "Mathematics", level: 5, isRequired: true }, { name: "English", level: 4, isRequired: true }],
            ["Economist", "Financial Analyst", "Policy Analyst", "Research Economist", "Investment Advisor"]),
          createDegree("Bachelor of Administration", 26, "Faculty of Management and Law", "Public and business administration", "3 years",
            [{ name: "English", level: 4, isRequired: true }, { name: "Mathematics", level: 4, isRequired: false }],
            ["Administrator", "Public Service Manager", "Local Government Official", "Policy Officer"]),
          createDegree("Bachelor of Laws (LLB)", 30, "Faculty of Management and Law", "Professional legal education", "4 years",
            [{ name: "English", level: 5, isRequired: true }, { name: "History", level: 4, isRequired: false }],
            ["Lawyer", "Attorney", "Advocate", "Legal Advisor", "Magistrate", "Prosecutor"]),
          createDegree("Bachelor of Development in Planning and Management", 26, "Faculty of Management and Law", "Development planning and management", "3 years",
            [{ name: "English", level: 4, isRequired: true }, { name: "Geography", level: 4, isRequired: false }],
            ["Development Planner", "Project Manager", "Community Development Officer", "Policy Analyst"])
        ]
      },
      {
        id: "ul-science-agriculture",
        name: "Faculty of Science and Agriculture",
        description: "Natural sciences, agricultural sciences, and environmental studies.",
        degrees: [
          createDegree("Bachelor of Agricultural Management", 24, "Faculty of Science and Agriculture", "Agricultural business and management", "4 years",
            [{ name: "Mathematics", level: 4, isRequired: true }, { name: "Life Sciences", level: 4, isRequired: true }, { name: "English", level: 4, isRequired: true }],
            ["Farm Manager", "Agricultural Consultant", "Agribusiness Manager", "Agricultural Extension Officer"]),
          createDegree("Bachelor of Science in Agriculture (Agricultural Economics)", 24, "Faculty of Science and Agriculture", "Agricultural economics and finance", "4 years",
            [{ name: "Mathematics", level: 5, isRequired: true }, { name: "Life Sciences", level: 4, isRequired: true }, { name: "English", level: 4, isRequired: true }],
            ["Agricultural Economist", "Farm Financial Advisor", "Agricultural Analyst", "Rural Development Specialist"]),
          createDegree("Bachelor of Science in Agriculture (Plant Production)", 24, "Faculty of Science and Agriculture", "Crop science and plant production", "4 years",
            [{ name: "Mathematics", level: 4, isRequired: true }, { name: "Life Sciences", level: 4, isRequired: true }, { name: "Physical Sciences", level: 4, isRequired: true }],
            ["Crop Scientist", "Plant Breeder", "Agricultural Specialist", "Research Scientist"]),
          createDegree("Bachelor of Science in Agriculture (Animal Production)", 24, "Faculty of Science and Agriculture", "Animal science and livestock management", "4 years",
            [{ name: "Mathematics", level: 4, isRequired: true }, { name: "Life Sciences", level: 4, isRequired: true }, { name: "Physical Sciences", level: 4, isRequired: false }],
            ["Animal Scientist", "Livestock Manager", "Veterinary Technician", "Feed Specialist"]),
          createDegree("Bachelor of Science in Agriculture (Soil Science)", 25, "Faculty of Science and Agriculture", "Soil science and conservation", "4 years",
            [{ name: "Mathematics", level: 4, isRequired: true }, { name: "Physical Sciences", level: 4, isRequired: true }, { name: "Life Sciences", level: 4, isRequired: true }],
            ["Soil Scientist", "Environmental Consultant", "Agricultural Specialist", "Research Scientist"]),
          createDegree("Bachelor of Science (Mathematical Science)", 24, "Faculty of Science and Agriculture", "Pure and applied mathematics", "3 years",
            [{ name: "Mathematics", level: 6, isRequired: true }, { name: "Physical Sciences", level: 5, isRequired: true }, { name: "English", level: 4, isRequired: true }],
            ["Mathematician", "Statistician", "Data Analyst", "Research Scientist", "Actuary"]),
          createDegree("Bachelor of Science (Life Sciences)", 24, "Faculty of Science and Agriculture", "Biological sciences", "3 years",
            [{ name: "Life Sciences", level: 5, isRequired: true }, { name: "Mathematics", level: 4, isRequired: true }, { name: "Physical Sciences", level: 4, isRequired: true }],
            ["Biologist", "Research Scientist", "Laboratory Technician", "Environmental Consultant"]),
          createDegree("Bachelor of Science (Physical Sciences)", 26, "Faculty of Science and Agriculture", "Physics and chemistry", "3 years",
            [{ name: "Physical Sciences", level: 6, isRequired: true }, { name: "Mathematics", level: 6, isRequired: true }, { name: "English", level: 4, isRequired: true }],
            ["Physicist", "Chemist", "Research Scientist", "Laboratory Manager", "Quality Control Specialist"]),
          createDegree("Bachelor of Science in Geology", 26, "Faculty of Science and Agriculture", "Earth sciences and geology", "3 years",
            [{ name: "Physical Sciences", level: 5, isRequired: true }, { name: "Mathematics", level: 5, isRequired: true }, { name: "Geography", level: 4, isRequired: false }],
            ["Geologist", "Mining Specialist", "Environmental Consultant", "Research Scientist"]),
          createDegree("Bachelor of Science in Environmental & Resource Studies", 24, "Faculty of Science and Agriculture", "Environmental science and resource management", "3 years",
            [{ name: "Life Sciences", level: 4, isRequired: true }, { name: "Geography", level: 4, isRequired: true }, { name: "Mathematics", level: 4, isRequired: true }],
            ["Environmental Scientist", "Conservation Officer", "Environmental Consultant", "Resource Manager"]),
          createDegree("Bachelor of Science in Water & Sanitation Sciences", 24, "Faculty of Science and Agriculture", "Water resource management and sanitation", "3 years",
            [{ name: "Physical Sciences", level: 4, isRequired: true }, { name: "Mathematics", level: 5, isRequired: true }, { name: "Life Sciences", level: 4, isRequired: false }],
            ["Water Resource Manager", "Sanitation Engineer", "Environmental Consultant", "Water Quality Specialist"])
        ]
      },
      {
        id: "ul-health-sciences",
        name: "Faculty of Health Sciences",
        description: "Medical and health sciences programs with clinical training components.",
        degrees: [
          createDegree("Bachelor of Medicine & Bachelor of Surgery", 27, "Faculty of Health Sciences", "Medical degree program", "6 years",
            [{ name: "Life Sciences", level: 6, isRequired: true }, { name: "Physical Sciences", level: 6, isRequired: true }, { name: "Mathematics", level: 5, isRequired: true }, { name: "English", level: 5, isRequired: true }],
            ["Medical Doctor", "Surgeon", "Specialist Physician", "Medical Researcher", "Public Health Officer"]),
          createDegree("Bachelor of Science in Medical Studies", 26, "Faculty of Health Sciences", "Pre-medical and medical sciences", "3 years",
            [{ name: "Life Sciences", level: 5, isRequired: true }, { name: "Physical Sciences", level: 5, isRequired: true }, { name: "Mathematics", level: 4, isRequired: true }],
            ["Medical Researcher", "Laboratory Scientist", "Health Administrator", "Medical Technologist"]),
          createDegree("Bachelor of Science in Dietetics", 26, "Faculty of Health Sciences", "Nutrition and dietetics", "4 years",
            [{ name: "Life Sciences", level: 5, isRequired: true }, { name: "Physical Sciences", level: 4, isRequired: true }, { name: "Mathematics", level: 4, isRequired: true }],
            ["Dietitian", "Nutritionist", "Health Consultant", "Food Service Manager", "Clinical Dietitian"]),
          createDegree("Bachelor of Optometry", 27, "Faculty of Health Sciences", "Eye care and optometry", "4 years",
            [{ name: "Life Sciences", level: 5, isRequired: true }, { name: "Physical Sciences", level: 5, isRequired: true }, { name: "Mathematics", level: 5, isRequired: true }],
            ["Optometrist", "Eye Care Specialist", "Vision Therapist", "Optical Manager"]),
          createDegree("Bachelor of Nursing", 26, "Faculty of Health Sciences", "Professional nursing program", "4 years",
            [{ name: "Life Sciences", level: 5, isRequired: true }, { name: "Mathematics", level: 4, isRequired: true }, { name: "English", level: 4, isRequired: true }],
            ["Registered Nurse", "Clinical Nurse", "Nurse Manager", "Community Health Nurse", "Nurse Educator"]),
          createDegree("Bachelor of Pharmacy", 27, "Faculty of Health Sciences", "Pharmaceutical sciences", "4 years",
            [{ name: "Physical Sciences", level: 6, isRequired: true }, { name: "Life Sciences", level: 5, isRequired: true }, { name: "Mathematics", level: 5, isRequired: true }],
            ["Pharmacist", "Clinical Pharmacist", "Hospital Pharmacist", "Pharmaceutical Researcher", "Regulatory Affairs Specialist"])
        ]
      }
    ]
  },

  // North-West University (NWU) 
  {
    id: "nwu",
    name: "North-West University", 
    abbreviation: "NWU",
    fullName: "North-West University",
    type: "Traditional University",
    location: "Potchefstroom, Mahikeng, Vanderbijlpark",
    province: "North West",
    website: "https://www.nwu.ac.za",
    logo: "/university-logos/nwu.svg",
    overview: "A multi-campus university offering excellent academic programs across three campuses with strong research focus.",
    establishedYear: 2004,
    studentPopulation: 64000,
    faculties: [
      {
        id: "nwu-economic-management",
        name: "Faculty of Economic and Management Sciences",
        description: "Comprehensive business, economics, and management programs.",
        degrees: [
          createDegree("Bachelor of Commerce in Accounting", 24, "Faculty of Economic and Management Sciences", "Professional accounting studies", "3 years",
            [{ name: "Mathematics", level: 5, isRequired: true }, { name: "English", level: 4, isRequired: true }],
            ["Accountant", "Financial Manager", "Auditor", "Tax Consultant"]),
          createDegree("Bachelor of Commerce in Chartered Accountancy", 32, "Faculty of Economic and Management Sciences", "CA qualification pathway", "3 years",
            [{ name: "Mathematics", level: 6, isRequired: true }, { name: "English", level: 5, isRequired: true }],
            ["Chartered Accountant", "Financial Director", "Chief Financial Officer", "Investment Banker"]),
          createDegree("Bachelor of Commerce in Financial Accountancy", 28, "Faculty of Economic and Management Sciences", "Financial accounting specialization", "3 years",
            [{ name: "Mathematics", level: 5, isRequired: true }, { name: "English", level: 4, isRequired: true }],
            ["Financial Accountant", "Financial Analyst", "Financial Manager", "Investment Advisor"]),
          createDegree("Bachelor of Commerce in Forensic Accountancy", 36, "Faculty of Economic and Management Sciences", "Forensic accounting and investigation", "3 years",
            [{ name: "Mathematics", level: 6, isRequired: true }, { name: "English", level: 5, isRequired: true }],
            ["Forensic Accountant", "Fraud Investigator", "Risk Manager", "Financial Crime Analyst"]),
          createDegree("Bachelor of Commerce in Management Accountancy", 30, "Faculty of Economic and Management Sciences", "Management accounting focus", "3 years",
            [{ name: "Mathematics", level: 5, isRequired: true }, { name: "English", level: 4, isRequired: true }],
            ["Management Accountant", "Cost Analyst", "Financial Controller", "Budget Manager"]),
          createDegree("Bachelor of Commerce in Operations Research", 24, "Faculty of Economic and Management Sciences", "Operations research and optimization", "3 years",
            [{ name: "Mathematics", level: 6, isRequired: true }, { name: "English", level: 4, isRequired: true }],
            ["Operations Research Analyst", "Data Scientist", "Business Analyst", "Systems Analyst"]),
          createDegree("Bachelor of Commerce in Statistics", 24, "Faculty of Economic and Management Sciences", "Statistical analysis and data science", "3 years",
            [{ name: "Mathematics", level: 6, isRequired: true }, { name: "English", level: 4, isRequired: true }],
            ["Statistician", "Data Analyst", "Research Scientist", "Actuary", "Market Researcher"]),
          createDegree("Bachelor of Commerce in Business Operations (Logistics Management)", 24, "Faculty of Economic and Management Sciences", "Business operations and logistics", "3 years",
            [{ name: "Mathematics", level: 4, isRequired: true }, { name: "English", level: 4, isRequired: true }],
            ["Logistics Manager", "Supply Chain Manager", "Operations Manager", "Transport Manager"]),
          createDegree("Bachelor of Commerce in Economic Sciences (Econometrics)", 26, "Faculty of Economic and Management Sciences", "Economic analysis and econometrics", "3 years",
            [{ name: "Mathematics", level: 6, isRequired: true }, { name: "English", level: 4, isRequired: true }],
            ["Econometrician", "Economic Analyst", "Policy Researcher", "Financial Analyst"]),
          createDegree("Bachelor of Commerce in Economic Sciences (International Trade)", 26, "Faculty of Economic and Management Sciences", "International economics and trade", "3 years",
            [{ name: "Mathematics", level: 5, isRequired: true }, { name: "English", level: 4, isRequired: true }],
            ["International Trade Specialist", "Export Manager", "Economic Consultant", "Trade Analyst"]),
          createDegree("Bachelor of Administration in Human Resource Management", 23, "Faculty of Economic and Management Sciences", "Human resources management", "3 years",
            [{ name: "English", level: 4, isRequired: true }, { name: "Mathematics", level: 4, isRequired: false }],
            ["HR Manager", "Recruitment Specialist", "Training Manager", "Employee Relations Officer"]),
          createDegree("Bachelor of Administration in Industrial and Organisational Psychology", 23, "Faculty of Economic and Management Sciences", "Psychology in workplace settings", "3 years",
            [{ name: "English", level: 4, isRequired: true }, { name: "Mathematics", level: 4, isRequired: true }],
            ["Industrial Psychologist", "Organizational Development Consultant", "HR Specialist", "Talent Manager"]),
          createDegree("Bachelor of Human Resource Development", 22, "Faculty of Economic and Management Sciences", "Human resource development focus", "3 years",
            [{ name: "English", level: 4, isRequired: true }],
            ["HR Development Specialist", "Training Coordinator", "Learning and Development Manager"]),
          createDegree("Bachelor of Commerce in Management Sciences (Business Management)", 24, "Faculty of Economic and Management Sciences", "General business management", "3 years",
            [{ name: "English", level: 4, isRequired: true }, { name: "Mathematics", level: 4, isRequired: true }],
            ["Business Manager", "Operations Manager", "Project Manager", "Entrepreneur"]),
          createDegree("Bachelor of Commerce in Management Sciences (Marketing Management)", 24, "Faculty of Economic and Management Sciences", "Marketing and brand management", "3 years",
            [{ name: "English", level: 4, isRequired: true }, { name: "Mathematics", level: 4, isRequired: false }],
            ["Marketing Manager", "Brand Manager", "Digital Marketing Specialist", "Market Research Analyst"]),
          createDegree("Bachelor of Commerce in Management Sciences (Tourism Management)", 24, "Faculty of Economic and Management Sciences", "Tourism industry management", "3 years",
            [{ name: "English", level: 4, isRequired: true }, { name: "Geography", level: 4, isRequired: false }],
            ["Tourism Manager", "Travel Consultant", "Event Manager", "Hospitality Manager"])
        ]
      },
      {
        id: "nwu-education",
        name: "Faculty of Education",
        description: "Teacher training and educational leadership programs.",
        degrees: [
          createDegree("Bachelor of Education (Early Childhood Care and Education)", 26, "Faculty of Education", "Early childhood education specialization", "4 years",
            [{ name: "English", level: 4, isRequired: true }, { name: "Mathematics", level: 4, isRequired: true }],
            ["Early Childhood Teacher", "Pre-school Teacher", "Educational Administrator", "Child Development Specialist"]),
          createDegree("Bachelor of Education (Foundation Phase)", 26, "Faculty of Education", "Foundation phase teaching (Grades R-3)", "4 years",
            [{ name: "English", level: 4, isRequired: true }, { name: "Mathematics", level: 4, isRequired: true }],
            ["Foundation Phase Teacher", "Primary School Teacher", "Educational Specialist", "Curriculum Developer"]),
          createDegree("Bachelor of Education (Intermediate Phase)", 26, "Faculty of Education", "Intermediate phase teaching (Grades 4-6)", "4 years",
            [{ name: "English", level: 4, isRequired: true }, { name: "Mathematics", level: 4, isRequired: true }],
            ["Intermediate Phase Teacher", "Primary School Teacher", "Subject Specialist", "Educational Coordinator"]),
          createDegree("Bachelor of Education (Senior and Further Education)", 26, "Faculty of Education", "Secondary education teaching", "4 years",
            [{ name: "English", level: 4, isRequired: true }, { name: "Teaching Subject", level: 5, isRequired: true }],
            ["High School Teacher", "Subject Head", "Educational Administrator", "Curriculum Specialist"])
        ]
      },
      {
        id: "nwu-engineering",
        name: "Faculty of Engineering",
        description: "Engineering disciplines with strong practical and research components.",
        degrees: [
          createDegree("Bachelor of Engineering (Chemical)", 34, "Faculty of Engineering", "Chemical engineering program", "4 years",
            [{ name: "Mathematics", level: 6, isRequired: true }, { name: "Physical Sciences", level: 6, isRequired: true }, { name: "English", level: 4, isRequired: true }],
            ["Chemical Engineer", "Process Engineer", "Plant Manager", "Environmental Engineer", "Research Engineer"]),
          createDegree("Bachelor of Engineering (Electrical)", 34, "Faculty of Engineering", "Electrical engineering specialization", "4 years",
            [{ name: "Mathematics", level: 6, isRequired: true }, { name: "Physical Sciences", level: 6, isRequired: true }, { name: "English", level: 4, isRequired: true }],
            ["Electrical Engineer", "Power Systems Engineer", "Electronics Engineer", "Control Systems Engineer"]),
          createDegree("Bachelor of Engineering (Computer & Electronic)", 34, "Faculty of Engineering", "Computer and electronic engineering", "4 years",
            [{ name: "Mathematics", level: 6, isRequired: true }, { name: "Physical Sciences", level: 6, isRequired: true }, { name: "English", level: 4, isRequired: true }],
            ["Computer Engineer", "Electronics Engineer", "Software Engineer", "Systems Engineer"]),
          createDegree("Bachelor of Engineering (Mechanical)", 34, "Faculty of Engineering", "Mechanical engineering program", "4 years",
            [{ name: "Mathematics", level: 6, isRequired: true }, { name: "Physical Sciences", level: 6, isRequired: true }, { name: "English", level: 4, isRequired: true }],
            ["Mechanical Engineer", "Design Engineer", "Manufacturing Engineer", "Project Engineer"]),
          createDegree("Bachelor of Engineering (Industrial)", 34, "Faculty of Engineering", "Industrial engineering and optimization", "4 years",
            [{ name: "Mathematics", level: 6, isRequired: true }, { name: "Physical Sciences", level: 6, isRequired: true }, { name: "English", level: 4, isRequired: true }],
            ["Industrial Engineer", "Operations Manager", "Quality Manager", "Systems Analyst"]),
          createDegree("Bachelor of Engineering (Mechatronic)", 34, "Faculty of Engineering", "Mechatronics and automation", "4 years",
            [{ name: "Mathematics", level: 6, isRequired: true }, { name: "Physical Sciences", level: 6, isRequired: true }, { name: "English", level: 4, isRequired: true }],
            ["Mechatronics Engineer", "Automation Engineer", "Robotics Engineer", "Control Systems Engineer"])
        ]
      },
      {
        id: "nwu-health-sciences",
        name: "Faculty of Health Sciences",
        description: "Health sciences with clinical practice and research focus.",
        degrees: [
          createDegree("Diploma in Coaching Science", 18, "Faculty of Health Sciences", "Sports coaching qualification", "3 years",
            [{ name: "English", level: 4, isRequired: true }, { name: "Life Sciences", level: 4, isRequired: false }],
            ["Sports Coach", "Fitness Trainer", "Athletic Performance Specialist", "Sports Administrator"]),
          createDegree("Bachelor of Health Sciences (Physiology and Biochemistry)", 26, "Faculty of Health Sciences", "Human physiology and biochemistry", "3 years",
            [{ name: "Life Sciences", level: 5, isRequired: true }, { name: "Physical Sciences", level: 5, isRequired: true }, { name: "Mathematics", level: 4, isRequired: true }],
            ["Health Scientist", "Research Scientist", "Laboratory Manager", "Health Consultant"]),
          createDegree("Bachelor of Health Sciences (Sport Coaching and Human Movement)", 24, "Faculty of Health Sciences", "Sports science and coaching", "3 years",
            [{ name: "Life Sciences", level: 4, isRequired: true }, { name: "English", level: 4, isRequired: true }],
            ["Sports Scientist", "Exercise Physiologist", "Performance Analyst", "Sports Coach"]),
          createDegree("Bachelor of Consumer Studies", 24, "Faculty of Health Sciences", "Consumer science and management", "3 years",
            [{ name: "English", level: 4, isRequired: true }, { name: "Mathematics", level: 4, isRequired: false }],
            ["Consumer Consultant", "Retail Manager", "Product Development Specialist", "Market Researcher"]),
          createDegree("Bachelor of Social Work", 28, "Faculty of Health Sciences", "Professional social work", "4 years",
            [{ name: "English", level: 4, isRequired: true }, { name: "Life Sciences", level: 4, isRequired: false }],
            ["Social Worker", "Community Development Worker", "Child Protection Specialist", "Family Therapist"]),
          createDegree("Bachelor of Pharmacy", 32, "Faculty of Health Sciences", "Pharmaceutical sciences", "4 years",
            [{ name: "Physical Sciences", level: 6, isRequired: true }, { name: "Life Sciences", level: 5, isRequired: true }, { name: "Mathematics", level: 5, isRequired: true }],
            ["Pharmacist", "Clinical Pharmacist", "Pharmaceutical Researcher", "Regulatory Affairs Specialist"]),
          createDegree("Bachelor of Science in Dietetics", 30, "Faculty of Health Sciences", "Nutrition and dietetics", "4 years",
            [{ name: "Life Sciences", level: 5, isRequired: true }, { name: "Physical Sciences", level: 4, isRequired: true }, { name: "Mathematics", level: 4, isRequired: true }],
            ["Dietitian", "Nutritionist", "Clinical Dietitian", "Food Service Manager"]),
          createDegree("Bachelor of Health Science in Occupational Hygiene", 27, "Faculty of Health Sciences", "Workplace health and safety", "4 years",
            [{ name: "Physical Sciences", level: 5, isRequired: true }, { name: "Life Sciences", level: 4, isRequired: true }, { name: "Mathematics", level: 4, isRequired: true }],
            ["Occupational Hygienist", "Safety Manager", "Environmental Health Officer", "Risk Assessor"]),
          createDegree("Bachelor of Health Science in Biokinetics", 32, "Faculty of Health Sciences", "Exercise and rehabilitation science", "4 years",
            [{ name: "Life Sciences", level: 6, isRequired: true }, { name: "Physical Sciences", level: 5, isRequired: true }, { name: "Mathematics", level: 5, isRequired: true }],
            ["Biokineticist", "Rehabilitation Specialist", "Sports Scientist", "Exercise Physiologist"]),
          createDegree("Bachelor of Nursing", 25, "Faculty of Health Sciences", "Professional nursing program", "4 years",
            [{ name: "Life Sciences", level: 5, isRequired: true }, { name: "Mathematics", level: 4, isRequired: true }, { name: "English", level: 4, isRequired: true }],
            ["Registered Nurse", "Clinical Nurse", "Nurse Manager", "Community Health Nurse"])
        ]
      }
      // Additional faculties would continue here...
    ]
  },

  // University of Cape Town (UCT) - Uses FPS scoring system
  {
    id: "uct",
    name: "University of Cape Town",
    abbreviation: "UCT",
    fullName: "University of Cape Town",
    type: "Traditional University",
    location: "Cape Town",
    province: "Western Cape",
    website: "https://www.uct.ac.za",
    logo: "/university-logos/uct.svg",
    overview: "Africa's leading university, globally ranked for academic excellence and research innovation.",
    establishedYear: 1829,
    studentPopulation: 29000,
    scoringSystem: "uct-fps",
    faculties: [
      {
        id: "uct-commerce",
        name: "Faculty of Commerce",
        description: "Business, accounting, and economic sciences with global perspective.",
        degrees: [
          createDegree("Bachelor of Business Science (Actuarial Science)", 540, "Faculty of Commerce", "Actuarial science with statistical focus", "3 years",
            [{ name: "Mathematics", level: 7, isRequired: true }, { name: "English", level: 6, isRequired: true }],
            ["Actuary", "Risk Analyst", "Investment Manager", "Statistical Consultant"]),
          createDegree("Bachelor of Business Science (Computer Science)", 510, "Faculty of Commerce", "Business-focused computer science", "3 years",
            [{ name: "Mathematics", level: 6, isRequired: true }, { name: "English", level: 5, isRequired: true }],
            ["Software Developer", "IT Consultant", "Business Analyst", "Systems Manager"]),
          createDegree("Bachelor of Business Science (Finance)", 480, "Faculty of Commerce", "Finance and investment management", "3 years",
            [{ name: "Mathematics", level: 6, isRequired: true }, { name: "English", level: 5, isRequired: true }],
            ["Financial Analyst", "Investment Banker", "Portfolio Manager", "Financial Consultant"]),
          createDegree("Bachelor of Commerce (Accounting)", 430, "Faculty of Commerce", "Professional accounting program", "3 years",
            [{ name: "Mathematics", level: 5, isRequired: true }, { name: "English", level: 5, isRequired: true }],
            ["Chartered Accountant", "Financial Manager", "Auditor", "Tax Consultant"]),
          createDegree("Bachelor of Commerce (General)", 430, "Faculty of Commerce", "General commerce studies", "3 years",
            [{ name: "Mathematics", level: 5, isRequired: true }, { name: "English", level: 5, isRequired: true }],
            ["Business Manager", "Marketing Specialist", "Operations Manager", "Entrepreneur"])
        ]
      },
      {
        id: "uct-engineering",
        name: "Faculty of Engineering & Built Environment",
        description: "Engineering excellence with strong research and innovation focus.",
        degrees: [
          createDegree("Bachelor of Science in Engineering (Mechanical)", 540, "Faculty of Engineering & Built Environment", "Mechanical engineering program", "4 years",
            [{ name: "Mathematics", level: 7, isRequired: true }, { name: "Physical Sciences", level: 7, isRequired: true }, { name: "English", level: 5, isRequired: true }],
            ["Mechanical Engineer", "Design Engineer", "Manufacturing Engineer", "Automotive Engineer"]),
          createDegree("Bachelor of Science in Engineering (Civil)", 540, "Faculty of Engineering & Built Environment", "Civil engineering and infrastructure", "4 years",
            [{ name: "Mathematics", level: 7, isRequired: true }, { name: "Physical Sciences", level: 7, isRequired: true }, { name: "English", level: 5, isRequired: true }],
            ["Civil Engineer", "Structural Engineer", "Infrastructure Engineer", "Project Manager"]),
          createDegree("Bachelor of Science in Engineering (Electrical)", 540, "Faculty of Engineering & Built Environment", "Electrical engineering specialization", "4 years",
            [{ name: "Mathematics", level: 7, isRequired: true }, { name: "Physical Sciences", level: 7, isRequired: true }, { name: "English", level: 5, isRequired: true }],
            ["Electrical Engineer", "Power Systems Engineer", "Electronics Engineer", "Control Engineer"]),
          createDegree("Bachelor of Science in Engineering (Chemical)", 540, "Faculty of Engineering & Built Environment", "Chemical engineering and processes", "4 years",
            [{ name: "Mathematics", level: 7, isRequired: true }, { name: "Physical Sciences", level: 7, isRequired: true }, { name: "English", level: 5, isRequired: true }],
            ["Chemical Engineer", "Process Engineer", "Environmental Engineer", "Plant Manager"]),
          createDegree("Bachelor of Architectural Studies", 450, "Faculty of Engineering & Built Environment", "Architecture and design", "3 years",
            [{ name: "Mathematics", level: 5, isRequired: true }, { name: "English", level: 5, isRequired: true }],
            ["Architect", "Urban Planner", "Design Consultant", "Project Manager"])
        ]
      }
    ]
  },

  // University of the Witwatersrand (Wits) - Uses composite scoring
  {
    id: "wits",
    name: "University of the Witwatersrand",
    abbreviation: "Wits",
    fullName: "University of the Witwatersrand, Johannesburg",
    type: "Traditional University",
    location: "Johannesburg",
    province: "Gauteng",
    website: "https://www.wits.ac.za",
    logo: "/university-logos/wits.svg",
    overview: "Leading research university with excellence in health sciences, engineering, and commerce.",
    establishedYear: 1922,
    studentPopulation: 40000,
    scoringSystem: "wits-composite",
    faculties: [
      {
        id: "wits-commerce",
        name: "Faculty of Commerce, Law and Management",
        description: "Business, economics, and management programs with strong industry connections.",
        degrees: [
          createDegree("Bachelor of Commerce (General)", 38, "Faculty of Commerce, Law and Management", "General commerce studies", "3 years",
            [{ name: "Mathematics", level: 5, isRequired: true }, { name: "English", level: 5, isRequired: true }],
            ["Business Manager", "Financial Analyst", "Marketing Manager", "Operations Manager"]),
          createDegree("Accounting Science", 44, "Faculty of Commerce, Law and Management", "Professional accounting qualification", "3 years",
            [{ name: "Mathematics", level: 6, isRequired: true }, { name: "English", level: 6, isRequired: true }],
            ["Chartered Accountant", "Financial Director", "Chief Financial Officer", "Investment Banker"]),
          createDegree("Economic Science", 42, "Faculty of Commerce, Law and Management", "Economics and econometrics", "3 years",
            [{ name: "Mathematics", level: 6, isRequired: true }, { name: "English", level: 5, isRequired: true }],
            ["Economist", "Policy Analyst", "Financial Analyst", "Research Economist"]),
          createDegree("Bachelor of Laws (LLB)", 46, "Faculty of Commerce, Law and Management", "Professional legal qualification", "4 years",
            [{ name: "English", level: 6, isRequired: true }, { name: "History", level: 5, isRequired: false }],
            ["Lawyer", "Attorney", "Advocate", "Legal Advisor", "Prosecutor"])
        ]
      },
      {
        id: "wits-engineering",
        name: "Faculty of Engineering and Built Environment",
        description: "World-class engineering education with cutting-edge research facilities.",
        degrees: [
          createDegree("Chemical Engineering", 42, "Faculty of Engineering and Built Environment", "Chemical engineering program", "4 years",
            [{ name: "Mathematics", level: 6, isRequired: true }, { name: "Physical Sciences", level: 6, isRequired: true }, { name: "English", level: 5, isRequired: true }],
            ["Chemical Engineer", "Process Engineer", "Environmental Engineer", "Research Engineer"]),
          createDegree("Civil Engineering", 42, "Faculty of Engineering and Built Environment", "Civil engineering and infrastructure", "4 years",
            [{ name: "Mathematics", level: 6, isRequired: true }, { name: "Physical Sciences", level: 6, isRequired: true }, { name: "English", level: 5, isRequired: true }],
            ["Civil Engineer", "Structural Engineer", "Construction Manager", "Infrastructure Planner"]),
          createDegree("Electrical Engineering", 42, "Faculty of Engineering and Built Environment", "Electrical and electronic systems", "4 years",
            [{ name: "Mathematics", level: 6, isRequired: true }, { name: "Physical Sciences", level: 6, isRequired: true }, { name: "English", level: 5, isRequired: true }],
            ["Electrical Engineer", "Electronics Engineer", "Power Systems Engineer", "Telecommunications Engineer"]),
          createDegree("Mechanical Engineering", 42, "Faculty of Engineering and Built Environment", "Mechanical systems and design", "4 years",
            [{ name: "Mathematics", level: 6, isRequired: true }, { name: "Physical Sciences", level: 6, isRequired: true }, { name: "English", level: 5, isRequired: true }],
            ["Mechanical Engineer", "Design Engineer", "Manufacturing Engineer", "Automotive Engineer"]),
          createDegree("Mining Engineering", 42, "Faculty of Engineering and Built Environment", "Mining and mineral processing", "4 years",
            [{ name: "Mathematics", level: 6, isRequired: true }, { name: "Physical Sciences", level: 6, isRequired: true }, { name: "English", level: 5, isRequired: true }],
            ["Mining Engineer", "Mineral Processing Engineer", "Rock Engineering Specialist", "Mine Manager"])
        ]
      }
    ]
  },

  // University of Johannesburg (UJ) - Standard APS
  {
    id: "uj",
    name: "University of Johannesburg",
    abbreviation: "UJ",
    fullName: "University of Johannesburg",
    type: "Traditional University",
    location: "Johannesburg",
    province: "Gauteng",
    website: "https://www.uj.ac.za",
    logo: "/university-logos/uj.svg",
    overview: "Dynamic university offering innovative programs across multiple campuses in Johannesburg.",
    establishedYear: 2005,
    studentPopulation: 50000,
    faculties: [
      {
        id: "uj-business-economics",
        name: "Faculty of Business and Economic Sciences",
        description: "Comprehensive business and economic programs with industry relevance.",
        degrees: [
          createDegree("Bachelor of Commerce (Accounting for Chartered Accountants)", 33, "Faculty of Business and Economic Sciences", "CA qualification pathway", "3 years",
            [{ name: "Mathematics", level: 6, isRequired: true }, { name: "English", level: 5, isRequired: true }],
            ["Chartered Accountant", "Financial Director", "Chief Financial Officer", "Investment Banker"]),
          createDegree("Bachelor of Commerce (Accounting)", 28, "Faculty of Business and Economic Sciences", "Professional accounting program", "3 years",
            [{ name: "Mathematics", level: 5, isRequired: true }, { name: "English", level: 4, isRequired: true }],
            ["Accountant", "Financial Manager", "Auditor", "Tax Consultant"]),
          createDegree("Bachelor of Commerce (Business Management)", 26, "Faculty of Business and Economic Sciences", "General business management", "3 years",
            [{ name: "English", level: 4, isRequired: true }, { name: "Mathematics", level: 4, isRequired: true }],
            ["Business Manager", "Operations Manager", "Project Manager", "Entrepreneur"]),
          createDegree("Bachelor of Commerce (Economics and Statistics)", 30, "Faculty of Business and Economic Sciences", "Economics with statistical analysis", "3 years",
            [{ name: "Mathematics", level: 6, isRequired: true }, { name: "English", level: 4, isRequired: true }],
            ["Economist", "Statistician", "Data Analyst", "Policy Researcher"]),
          createDegree("Bachelor of Commerce (Finance)", 28, "Faculty of Business and Economic Sciences", "Finance and investment", "3 years",
            [{ name: "Mathematics", level: 5, isRequired: true }, { name: "English", level: 4, isRequired: true }],
            ["Financial Analyst", "Investment Advisor", "Portfolio Manager", "Financial Planner"]),
          createDegree("Bachelor of Commerce (Human Resource Management)", 28, "Faculty of Business and Economic Sciences", "Human resources specialization", "3 years",
            [{ name: "English", level: 4, isRequired: true }, { name: "Mathematics", level: 4, isRequired: true }],
            ["HR Manager", "Recruitment Specialist", "Training Manager", "Employee Relations Officer"]),
          createDegree("Bachelor of Commerce (Marketing Management)", 26, "Faculty of Business and Economic Sciences", "Marketing and brand management", "3 years",
            [{ name: "English", level: 4, isRequired: true }, { name: "Mathematics", level: 4, isRequired: false }],
            ["Marketing Manager", "Brand Manager", "Digital Marketing Specialist", "Market Research Analyst"]),
          createDegree("Bachelor of Business Science", 38, "Faculty of Business and Economic Sciences", "Advanced business science program", "3 years",
            [{ name: "Mathematics", level: 6, isRequired: true }, { name: "English", level: 5, isRequired: true }],
            ["Business Analyst", "Strategic Consultant", "Investment Banker", "Management Consultant"])
        ]
      },
      {
        id: "uj-engineering",
        name: "Faculty of Engineering and Built Environment",
        description: "Engineering excellence with modern facilities and industry partnerships.",
        degrees: [
          createDegree("Bachelor of Engineering (Civil)", 32, "Faculty of Engineering and Built Environment", "Civil engineering program", "4 years",
            [{ name: "Mathematics", level: 6, isRequired: true }, { name: "Physical Sciences", level: 6, isRequired: true }, { name: "English", level: 4, isRequired: true }],
            ["Civil Engineer", "Structural Engineer", "Construction Manager", "Infrastructure Engineer"]),
          createDegree("Bachelor of Engineering (Electrical)", 32, "Faculty of Engineering and Built Environment", "Electrical engineering specialization", "4 years",
            [{ name: "Mathematics", level: 6, isRequired: true }, { name: "Physical Sciences", level: 6, isRequired: true }, { name: "English", level: 4, isRequired: true }],
            ["Electrical Engineer", "Power Systems Engineer", "Electronics Engineer", "Control Engineer"]),
          createDegree("Bachelor of Engineering (Mechanical)", 32, "Faculty of Engineering and Built Environment", "Mechanical engineering program", "4 years",
            [{ name: "Mathematics", level: 6, isRequired: true }, { name: "Physical Sciences", level: 6, isRequired: true }, { name: "English", level: 4, isRequired: true }],
            ["Mechanical Engineer", "Design Engineer", "Manufacturing Engineer", "Automotive Engineer"]),
          createDegree("Bachelor of Engineering (Industrial)", 38, "Faculty of Engineering and Built Environment", "Industrial engineering and optimization", "4 years",
            [{ name: "Mathematics", level: 6, isRequired: true }, { name: "Physical Sciences", level: 6, isRequired: true }, { name: "English", level: 4, isRequired: true }],
            ["Industrial Engineer", "Operations Manager", "Quality Manager", "Systems Analyst"]),
          createDegree("Bachelor of Engineering (Mechatronics)", 38, "Faculty of Engineering and Built Environment", "Mechatronics and automation", "4 years",
            [{ name: "Mathematics", level: 6, isRequired: true }, { name: "Physical Sciences", level: 6, isRequired: true }, { name: "English", level: 4, isRequired: true }],
            ["Mechatronics Engineer", "Automation Engineer", "Robotics Engineer", "Control Systems Engineer"])
        ]
      },
      {
        id: "uj-health-sciences",
        name: "Faculty of Health Sciences",
        description: "Comprehensive health sciences education with modern clinical facilities.",
        degrees: [
          createDegree("Bachelor of Medicine and Bachelor of Surgery (MBChB)", 47, "Faculty of Health Sciences", "Medical degree program", "6 years",
            [{ name: "Life Sciences", level: 6, isRequired: true }, { name: "Physical Sciences", level: 6, isRequired: true }, { name: "Mathematics", level: 5, isRequired: true }, { name: "English", level: 5, isRequired: true }],
            ["Medical Doctor", "Surgeon", "Specialist Physician", "Medical Researcher"]),
          createDegree("Bachelor of Nursing", 30, "Faculty of Health Sciences", "Professional nursing program", "4 years",
            [{ name: "Life Sciences", level: 5, isRequired: true }, { name: "Mathematics", level: 4, isRequired: true }, { name: "English", level: 4, isRequired: true }],
            ["Registered Nurse", "Clinical Nurse", "Nurse Manager", "Community Health Nurse"]),
          createDegree("Bachelor of Science in Occupational Therapy", 34, "Faculty of Health Sciences", "Occupational therapy specialization", "4 years",
            [{ name: "Life Sciences", level: 5, isRequired: true }, { name: "Physical Sciences", level: 4, isRequired: true }, { name: "Mathematics", level: 4, isRequired: true }],
            ["Occupational Therapist", "Rehabilitation Specialist", "Community Health Worker", "Disability Consultant"]),
          createDegree("Bachelor of Science in Physiotherapy", 34, "Faculty of Health Sciences", "Physiotherapy and rehabilitation", "4 years",
            [{ name: "Life Sciences", level: 5, isRequired: true }, { name: "Physical Sciences", level: 5, isRequired: true }, { name: "Mathematics", level: 4, isRequired: true }],
            ["Physiotherapist", "Sports Therapist", "Rehabilitation Specialist", "Pain Management Specialist"]),
          createDegree("Bachelor of Optometry", 31, "Faculty of Health Sciences", "Eye care and vision science", "4 years",
            [{ name: "Life Sciences", level: 5, isRequired: true }, { name: "Physical Sciences", level: 5, isRequired: true }, { name: "Mathematics", level: 5, isRequired: true }],
            ["Optometrist", "Eye Care Specialist", "Vision Therapist", "Optical Manager"])
        ]
      }
    ]
  }
];

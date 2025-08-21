import { Faculty, Degree } from "@/types/university";

/**
 * NEW UNIVERSITY PROGRAMS DATA - 2025
 * 
 * This file contains the comprehensive university programs data
 * extracted from the provided university faculties and APS document.
 * All APS requirements and program information have been updated.
 */

// University ID mappings
export const UNIVERSITY_NAME_TO_ID_MAPPING: Record<string, string> = {
  "University of Limpopo": "ul",
  "North-West University": "nwu", 
  "Walter Sisulu University": "wsu",
  "University of Zululand": "unizulu",
  "Sol Plaatje University": "spu",
  "University of Mpumalanga": "ump",
  "Cape Peninsula University of Technology": "cput",
  "Central University of Technology": "cut",
  "Durban University of Technology": "dut",
  "Mangosuthu University of Technology": "mut",
  "Tshwane University of Technology": "tut",
  "Vaal University of Technology": "vut",
  "University of Cape Town": "uct",
  "University of Fort Hare": "ufh",
  "University of Free State": "ufs",
  "University of KwaZulu-Natal": "ukzn",
  "University of Pretoria": "up",
  "Rhodes University": "ru",
  "Stellenbosch University": "stellenbosch",
  "University of Western Cape": "uwc",
  "University of Witswaterstrand": "wits",
  "Nelson Mandela University": "nmu",
  "University of Johannesburg": "uj",
  "University of South Africa": "unisa",
  "University of Venda": "univen",
  "Sefako Makgatho Health Sciences University": "smu"
};

// Helper function to create degrees from program data
function createDegree(
  name: string, 
  faculty: string, 
  apsRequirement: number, 
  description?: string,
  duration: string = "3 years"
): Degree {
  return {
    id: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
    name,
    faculty,
    duration,
    apsRequirement,
    description: description || `${name} program offered by the ${faculty} faculty.`,
    subjects: [
      { name: "English", level: 4, isRequired: true },
      { name: "Mathematics", level: 4, isRequired: true }
    ],
    careerProspects: [`Graduate opportunities in ${name}`]
  };
}

// University of Limpopo (UL) Programs
export const UL_FACULTIES: Faculty[] = [
  {
    id: "humanities",
    name: "Faculty of Humanities",
    description: "Humanities and social sciences programs",
    degrees: [
      createDegree("Bachelor of Education (BEd)", "Humanities", 24),
      createDegree("Bachelor of Arts (Criminology & Psychology stream)", "Humanities", 23),
      createDegree("Bachelor of Arts (Sociology & Anthropology stream)", "Humanities", 23),
      createDegree("Bachelor of Arts (Political studies stream)", "Humanities", 25),
      createDegree("Bachelor of Psychology", "Humanities", 23),
      createDegree("Bachelor of Arts (Criminology & Psychology stream extended curricular programme)", "Humanities", 22),
      createDegree("Bachelor of Social Work", "Humanities", 23),
      createDegree("Bachelor of Arts (Languages stream)", "Humanities", 25),
      createDegree("Bachelor of Arts (Translation and linguistics team)", "Humanities", 25),
      createDegree("Bachelor of Information Studies", "Humanities", 25),
      createDegree("Bachelor of Arts in Contemporary English and Multilingual Studies", "Humanities", 25),
      createDegree("Bachelor of Arts in Communication Studies", "Humanities", 25),
      createDegree("Bachelor of Arts in Media Studies", "Humanities", 25),
      createDegree("Bachelor of Arts in Media Studies Extended Curricular Programme", "Humanities", 23)
    ]
  },
  {
    id: "management-law",
    name: "Faculty of Management and Law",
    description: "Management and legal studies programs",
    degrees: [
      createDegree("Bachelor of Accountancy", "Management and Law", 30),
      createDegree("Bachelor of Commerce in Accountancy", "Management and Law", 28),
      createDegree("Bachelor of Commerce in Accountancy Extended Curricular Programme", "Management and Law", 26),
      createDegree("Bachelor of Commerce in Human Resources Management", "Management and Law", 26),
      createDegree("Bachelor of Commerce in Business Management", "Management and Law", 26),
      createDegree("Bachelor of Commerce in Business Management Extended Curricular Programme", "Management and Law", 22),
      createDegree("Bachelor of Commerce in Economics", "Management and Law", 26),
      createDegree("Bachelor of Commerce in Economics Extended Curricular Programme", "Management and Law", 22),
      createDegree("Bachelor of Administration", "Management and Law", 26),
      createDegree("Bachelor of Administration Local Government", "Management and Law", 26),
      createDegree("Bachelor of Development in Planning and Management", "Management and Law", 26),
      createDegree("Bachelor of Laws (LLB)", "Management and Law", 30),
      createDegree("Bachelor of Laws (LLB) Extended Curricular Programme", "Management and Law", 26)
    ]
  },
  {
    id: "science-agriculture",
    name: "Faculty of Science and Agriculture",
    description: "Science and agricultural programs",
    degrees: [
      createDegree("Bachelor of Agricultural Management", "Science and Agriculture", 24),
      createDegree("Bachelor of Science in Agriculture in Agricultural Economics", "Science and Agriculture", 24),
      createDegree("Bachelor of Science in Agriculture in Plant Production", "Science and Agriculture", 24),
      createDegree("Bachelor of Science in Agriculture in Animal Production", "Science and Agriculture", 24),
      createDegree("Bachelor of Science in Agriculture in Soil Science", "Science and Agriculture", 25),
      createDegree("Bachelor of Science in Environmental & Resource Studies", "Science and Agriculture", 24),
      createDegree("Bachelor of Science in Water & Sanitation Sciences", "Science and Agriculture", 24),
      createDegree("Bachelor of Science (Mathematical science stream)", "Science and Agriculture", 24),
      createDegree("Bachelor of Science (Mathematical science stream) Extended Curricular Programme", "Science and Agriculture", 22),
      createDegree("Bachelor of Science (Life sciences stream)", "Science and Agriculture", 24),
      createDegree("Bachelor of Science (Life sciences stream) Extended Curricular Programme", "Science and Agriculture", 22),
      createDegree("Bachelor of Science (Physical sciences stream)", "Science and Agriculture", 26),
      createDegree("Bachelor of Science (Physical sciences stream) Extended Curricular Programme", "Science and Agriculture", 22),
      createDegree("Bachelor of Science in Geology", "Science and Agriculture", 26)
    ]
  },
  {
    id: "health-sciences",
    name: "Faculty of Health Sciences",
    description: "Health sciences and medical programs",
    degrees: [
      createDegree("Bachelor of Medicine & Bachelor of Surgery", "Health Sciences", 27),
      createDegree("Bachelor of Science in Medical Studies", "Health Sciences", 26),
      createDegree("Bachelor of Science in Dietetics", "Health Sciences", 26),
      createDegree("Bachelor of Optometry", "Health Sciences", 27),
      createDegree("Bachelor of Nursing", "Health Sciences", 26),
      createDegree("Bachelor of Pharmacy", "Health Sciences", 27)
    ]
  }
];

// North-West University (NWU) Programs
export const NWU_FACULTIES: Faculty[] = [
  {
    id: "economic-management",
    name: "Faculty of Economic and Management Sciences",
    description: "Economic and management programs",
    degrees: [
      createDegree("Bachelor of Commerce in Accounting", "Economic and Management Sciences", 24),
      createDegree("Bachelor of Commerce in Chartered Accountancy", "Economic and Management Sciences", 32),
      createDegree("Extended Bachelor of Commerce in Chartered Accountancy", "Economic and Management Sciences", 28),
      createDegree("Bachelor of Commerce in Financial Accountancy", "Economic and Management Sciences", 28),
      createDegree("Extended Bachelor of Commerce in Financial Accountancy", "Economic and Management Sciences", 24),
      createDegree("Bachelor of Commerce in Forensic Accountancy", "Economic and Management Sciences", 36),
      createDegree("Bachelor of Commerce in Management Accountancy", "Economic and Management Sciences", 30),
      createDegree("Bachelor of Commerce in Operations Research", "Economic and Management Sciences", 24),
      createDegree("Bachelor of Commerce in Statistics", "Economic and Management Sciences", 24),
      createDegree("Extended Bachelor of Commerce in Statistics", "Economic and Management Sciences", 20),
      createDegree("Bachelor of Commerce in Business Operations (with logistics management)", "Economic and Management Sciences", 24),
      createDegree("Extended Bachelor of Commerce in Business Operations (with logistics management)", "Economic and Management Sciences", 20),
      createDegree("Bachelor of Commerce in Business Operations (with transport economics)", "Economic and Management Sciences", 24),
      createDegree("Extended Bachelor of Commerce in Business Operations (with transport economics)", "Economic and Management Sciences", 20),
      createDegree("Bachelor of Commerce in Economic Sciences (with agricultural economics and risk management)", "Economic and Management Sciences", 26),
      createDegree("Bachelor of Commerce in Economic Sciences (with econometrics)", "Economic and Management Sciences", 26),
      createDegree("Extended Bachelor of Commerce in Economic Sciences (with econometrics)", "Economic and Management Sciences", 20),
      createDegree("Bachelor of Commerce in Economic Sciences (with international trade)", "Economic and Management Sciences", 26),
      createDegree("Extended Bachelor of Commerce in Economic Sciences (with international trade)", "Economic and Management Sciences", 20),
      createDegree("Bachelor of Commerce in Economic Sciences (with informatics)", "Economic and Management Sciences", 26),
      createDegree("Bachelor of Commerce in Economic Sciences (with information systems)", "Economic and Management Sciences", 26),
      createDegree("Extended Bachelor of Commerce in Economic Sciences (with information systems)", "Economic and Management Sciences", 20),
      createDegree("Bachelor of Commerce in Economic Sciences (with risk management)", "Economic and Management Sciences", 26),
      createDegree("Extended Bachelor of Commerce in Economic Sciences (with risk management)", "Economic and Management Sciences", 24),
      createDegree("Bachelor of Administration in Human Resource Management", "Economic and Management Sciences", 23),
      createDegree("Extended Bachelor of Administration in Human Resource Management", "Economic and Management Sciences", 21),
      createDegree("Bachelor of Administration in Industrial and Organisational Psychology", "Economic and Management Sciences", 23),
      createDegree("Extended Bachelor of Administration in Industrial and Organisational Psychology", "Economic and Management Sciences", 21),
      createDegree("Bachelor of Arts (with industrial and organisational psychology and labour relations management)", "Economic and Management Sciences", 26),
      createDegree("Bachelor of Commerce (Human resource management)", "Economic and Management Sciences", 30),
      createDegree("Bachelor of Commerce (in industrial and organisational psychology)", "Economic and Management Sciences", 30),
      createDegree("Bachelor of Human Resource Development", "Economic and Management Sciences", 22),
      createDegree("Bachelor of Arts (with tourism management)", "Economic and Management Sciences", 22),
      createDegree("Bachelor of Commerce in Management Sciences (with tourism management)", "Economic and Management Sciences", 24),
      createDegree("Bachelor of Commerce in Management Sciences (with tourism and recreation skills)", "Economic and Management Sciences", 24),
      createDegree("Bachelor of Commerce in Management Sciences (with business management)", "Economic and Management Sciences", 24),
      createDegree("Extended Bachelor of Commerce in Management Sciences (with business management)", "Economic and Management Sciences", 24),
      createDegree("Bachelor of Commerce in Management Sciences (with communication management)", "Economic and Management Sciences", 24),
      createDegree("Bachelor of Commerce in Management Sciences (with marketing management)", "Economic and Management Sciences", 24),
      createDegree("Extended Bachelor of Commerce in Management Sciences (with marketing management)", "Economic and Management Sciences", 20),
      createDegree("Bachelor of Commerce in Management Sciences (with sport and business management)", "Economic and Management Sciences", 24),
      createDegree("Bachelor of Commerce in Management Sciences (with safety management)", "Economic and Management Sciences", 24),
      createDegree("Bachelor of Commerce in Management Sciences (with marketing & tourism management)", "Economic and Management Sciences", 24)
    ]
  },
  {
    id: "education",
    name: "Faculty of Education",
    description: "Education programs",
    degrees: [
      createDegree("Bachelor of Education Early Childhood Care and Education", "Education", 26),
      createDegree("Bachelor of Education Foundation Phase", "Education", 26),
      createDegree("Bachelor of Education Intermediate Phase", "Education", 26),
      createDegree("Bachelor of Education Senior and Further Education", "Education", 26)
    ]
  },
  {
    id: "engineering",
    name: "Faculty of Engineering",
    description: "Engineering programs",
    degrees: [
      createDegree("Bachelor of Engineering (Chemical)", "Engineering", 34),
      createDegree("Bachelor of Engineering (Electrical)", "Engineering", 34),
      createDegree("Bachelor of Engineering (Computer & Electronic)", "Engineering", 34),
      createDegree("Bachelor of Engineering (Electromechanical)", "Engineering", 34),
      createDegree("Bachelor of Engineering (Mechanical)", "Engineering", 34),
      createDegree("Bachelor of Engineering (Industrial)", "Engineering", 34),
      createDegree("Bachelor of Engineering (Mechatronic)", "Engineering", 34)
    ]
  },
  {
    id: "health-sciences",
    name: "Faculty of Health Sciences",
    description: "Health sciences programs",
    degrees: [
      createDegree("Diploma in Coaching Science", "Health Sciences", 18),
      createDegree("Bachelor of Health Sciences (with physiology and biochemistry)", "Health Sciences", 26),
      createDegree("Bachelor of Health Sciences (with physiology and psychology)", "Health Sciences", 26),
      createDegree("Bachelor of Health Sciences (with sport coaching and human movement sciences)", "Health Sciences", 24),
      createDegree("Bachelor of Health Sciences (with recreation sciences and psychology)", "Health Sciences", 26),
      createDegree("Bachelor of Health Sciences (with recreation science and tourism management)", "Health Sciences", 24),
      createDegree("Bachelor of Arts in Behavioural Sciences (with psychology and geography)", "Health Sciences", 26),
      createDegree("Bachelor of Social Sciences (with psychology)", "Health Sciences", 26),
      createDegree("Bachelor of Consumer Studies", "Health Sciences", 24),
      createDegree("Bachelor of Consumer Studies (in food production management)", "Health Sciences", 24),
      createDegree("Bachelor of Consumer Studies (in fashion retail management)", "Health Sciences", 24),
      createDegree("Bachelor of Social Work", "Health Sciences", 28),
      createDegree("Bachelor of Pharmacy", "Health Sciences", 32),
      createDegree("Bachelor of Science in Dietetics", "Health Sciences", 30),
      createDegree("Bachelor of Health Science in Occupational Hygiene", "Health Sciences", 27),
      createDegree("Bachelor of Health Science in Biokinetics", "Health Sciences", 32),
      createDegree("Bachelor of Nursing", "Health Sciences", 25)
    ]
  },
  {
    id: "humanities",
    name: "Faculty of Humanities",
    description: "Humanities programs",
    degrees: [
      createDegree("Bachelor of Arts (BA) in Public Governance (with Public Administration)", "Humanities", 25),
      createDegree("Bachelor of Arts (BA) in Public Governance (with Municipal Management and Leadership)", "Humanities", 25),
      createDegree("Bachelor of Arts (BA) in Public Governance (with Policing Practice)", "Humanities", 25),
      createDegree("Bachelor of Social Sciences (BSocSc) (with Political Studies and International Relations)", "Humanities", 24),
      createDegree("Bachelor of Administration in Development and Management (with Local Government Management)", "Humanities", 21),
      createDegree("Extended Bachelor of Administration in Development and Management (with Local Government Management)", "Humanities", 20),
      createDegree("Bachelor of Arts (BA) in Communication", "Humanities", 24),
      createDegree("Bachelor of Arts (BA) in Graphic Design", "Humanities", 24),
      createDegree("Bachelor of Arts (BA) in Graphic Design (with Communication)", "Humanities", 24),
      createDegree("Bachelor of Arts (BA) in Language and Literary Studies", "Humanities", 24),
      createDegree("Bachelor of Arts (BA) in Language Technology", "Humanities", 24),
      createDegree("Diploma in Music (DM)", "Humanities", 18),
      createDegree("Bachelor of Arts (BA) in Music and Society", "Humanities", 21),
      createDegree("Baccalaureus Musicae (BMus)", "Humanities", 24),
      createDegree("Bachelor of Philosophy (BPhil) (with Philosophy, Politics and Economics)", "Humanities", 26),
      createDegree("Bachelor of Arts (BA) Humanities (with Afrikaans and Dutch)", "Humanities", 24),
      createDegree("Bachelor of Arts (BA) Humanities (with English)", "Humanities", 24),
      createDegree("Bachelor of Arts (BA) Humanities (with Setswana)", "Humanities", 24),
      createDegree("Bachelor of Arts (BA) Humanities (with Sesotho)", "Humanities", 24),
      createDegree("Bachelor of Arts (BA) Humanities (with Social Sciences)", "Humanities", 24),
      createDegree("Bachelor of Social Sciences (BSocSc)", "Humanities", 22),
      createDegree("Bachelor of Social Sciences (BSocSc) (with Economics)", "Humanities", 22),
      createDegree("Bachelor of Arts (BA) (with Sociology and Geography)", "Humanities", 22),
      createDegree("Bachelor of Arts (BA) in Behavioural Sciences (with Sociology and Psychology)", "Humanities", 22)
    ]
  },
  {
    id: "law",
    name: "Faculty of Law",
    description: "Legal studies programs",
    degrees: [
      createDegree("Bachelor of Arts in Law (BA in Law) (with Psychology)", "Law", 28),
      createDegree("Bachelor of Arts in Law (BA in Law) (with Politics)", "Law", 28),
      createDegree("Bachelor of Arts in Law (BA in Law) (with Industrial Psychology)", "Law", 28),
      createDegree("Bachelor of Commerce in Law (BCom in Law)", "Law", 30),
      createDegree("Bachelor of Laws (LLB)", "Law", 30),
      createDegree("Extended Bachelor of Laws (LLB)", "Law", 28)
    ]
  },
  {
    id: "natural-agricultural",
    name: "Faculty of Natural and Agricultural Sciences",
    description: "Natural and agricultural sciences programs",
    degrees: [
      createDegree("Diploma in Animal Health", "Natural and Agricultural Sciences", 22),
      createDegree("Diploma in Animal Science", "Natural and Agricultural Sciences", 22),
      createDegree("Diploma in Plant Science (Crop Production)", "Natural and Agricultural Sciences", 22),
      createDegree("Bachelor of Science (with Chemistry and Physics)", "Natural and Agricultural Sciences", 26),
      createDegree("Bachelor of Science (with Physics and Mathematics)", "Natural and Agricultural Sciences", 26),
      createDegree("Bachelor of Science (with Physics and Applied Mathematics)", "Natural and Agricultural Sciences", 26),
      createDegree("Bachelor of Science (with Physics and Computer Sciences)", "Natural and Agricultural Sciences", 26),
      createDegree("Bachelor of Science (with Computer Sciences and Mathematics)", "Natural and Agricultural Sciences", 26),
      createDegree("Bachelor of Science (with Biochemistry and Chemistry)", "Natural and Agricultural Sciences", 26),
      createDegree("Bachelor of Science (with Geography and Applied Mathematics)", "Natural and Agricultural Sciences", 26),
      createDegree("Bachelor of Science (with Applied Mathematics and Chemistry)", "Natural and Agricultural Sciences", 26),
      createDegree("Bachelor of Science (with Chemistry and Mathematics)", "Natural and Agricultural Sciences", 26),
      createDegree("Bachelor of Science (with Applied Mathematics and Electronics)", "Natural and Agricultural Sciences", 26),
      createDegree("Bachelor of Science (with Electronics and Mathematics)", "Natural and Agricultural Sciences", 26),
      createDegree("Bachelor of Science (with Electronics and Physics)", "Natural and Agricultural Sciences", 26),
      createDegree("Bachelor of Science (with Chemistry and Computer Science)", "Natural and Agricultural Sciences", 26),
      createDegree("Bachelor of Science (with Computer Science and Electronics)", "Natural and Agricultural Sciences", 26),
      createDegree("Bachelor of Science (with Computer Sciences and Statistics)", "Natural and Agricultural Sciences", 26),
      createDegree("Bachelor of Science (with Computer Sciences and Economics)", "Natural and Agricultural Sciences", 26),
      createDegree("Bachelor of Science (with Mathematics and Economy)", "Natural and Agricultural Sciences", 26),
      createDegree("Extended Bachelor of Science", "Natural and Agricultural Sciences", 24),
      createDegree("Bachelor of Science in Information Technology", "Natural and Agricultural Sciences", 26),
      createDegree("Extended Bachelor of Science in Information Technology", "Natural and Agricultural Sciences", 24),
      createDegree("Bachelor of Science in Mathematical Sciences (with Statistics and Mathematics)", "Natural and Agricultural Sciences", 26),
      createDegree("Bachelor of Science in Mathematical Sciences (with Mathematics)", "Natural and Agricultural Sciences", 26),
      createDegree("Bachelor of Science in Mathematical Sciences (with Applied Mathematics and Mathematics)", "Natural and Agricultural Sciences", 26),
      createDegree("Bachelor of Science in Biological Sciences (with Microbiology and Biochemistry)", "Natural and Agricultural Sciences", 26),
      createDegree("Bachelor of Science in Biological Sciences (with Microbiology and Botany)", "Natural and Agricultural Sciences", 26),
      createDegree("Bachelor of Science in Biological Sciences (with Botany and Biochemistry)", "Natural and Agricultural Sciences", 26),
      createDegree("Bachelor of Science in Biological Sciences (with Zoology and Biochemistry)", "Natural and Agricultural Sciences", 26),
      createDegree("Bachelor of Science in Biological Sciences (with Chemistry and Physiology)", "Natural and Agricultural Sciences", 26),
      createDegree("Bachelor of Science in Biological Sciences (with Zoology and Botany)", "Natural and Agricultural Sciences", 26),
      createDegree("Bachelor of Science in Biological Sciences (with Zoology and Microbiology)", "Natural and Agricultural Sciences", 26),
      createDegree("Bachelor of Science in Biological Sciences (with Zoology and Physiology)", "Natural and Agricultural Sciences", 26),
      createDegree("Bachelor of Science in Biological Sciences (with Microbiology and Physiology)", "Natural and Agricultural Sciences", 26),
      createDegree("Bachelor of Science in Environmental Sciences (with Chemistry and Microbiology)", "Natural and Agricultural Sciences", 26),
      createDegree("Bachelor of Science in Environmental Sciences (with Botany and Chemistry)", "Natural and Agricultural Sciences", 26),
      createDegree("Bachelor of Science in Environmental Sciences (with Geography and Computer Sciences)", "Natural and Agricultural Sciences", 26),
      createDegree("Bachelor of Science in Environmental Sciences (with Geography and Botany)", "Natural and Agricultural Sciences", 26),
      createDegree("Bachelor of Science in Environmental Sciences (with Zoology and Chemistry)", "Natural and Agricultural Sciences", 26),
      createDegree("Bachelor of Science in Environmental Sciences (with Chemistry and Geology)", "Natural and Agricultural Sciences", 26),
      createDegree("Bachelor of Science in Environmental Sciences (with Geology and Geography)", "Natural and Agricultural Sciences", 26),
      createDegree("Bachelor of Science in Environmental Sciences (with Zoology and Geography)", "Natural and Agricultural Sciences", 26),
      createDegree("Bachelor of Science in Environmental Sciences (with Geology and Botany)", "Natural and Agricultural Sciences", 26),
      createDegree("Bachelor of Science in Environmental Sciences (with Zoology and Geology)", "Natural and Agricultural Sciences", 26),
      createDegree("Bachelor of Science in Environmental Sciences (with Geology and Microbiology)", "Natural and Agricultural Sciences", 26),
      createDegree("Bachelor of Science in Environmental Sciences (with Tourism and Zoology)", "Natural and Agricultural Sciences", 26),
      createDegree("Bachelor of Science in Environmental Sciences (with Tourism and Geography)", "Natural and Agricultural Sciences", 26),
      createDegree("Bachelor of Science in Environmental Sciences (with Tourism and Botany)", "Natural and Agricultural Sciences", 26),
      createDegree("Bachelor of Science in Environmental Sciences (with Chemistry and Geography)", "Natural and Agricultural Sciences", 26),
      createDegree("Extended Bachelor of Science in Financial Mathematics", "Natural and Agricultural Sciences", 28),
      createDegree("Bachelor of Science in Business Analytics", "Natural and Agricultural Sciences", 32),
      createDegree("Extended Bachelor of Science in Business Analytics", "Natural and Agricultural Sciences", 28),
      createDegree("Bachelor of Science in Quantitative Risk Management", "Natural and Agricultural Sciences", 32),
      createDegree("Extended Bachelor of Science in Quantitative Risk Management", "Natural and Agricultural Sciences", 28),
      createDegree("Bachelor of Science in Actuarial Science", "Natural and Agricultural Sciences", 32),
      createDegree("Bachelor of Science in Urban and Regional Planning", "Natural and Agricultural Sciences", 28),
      createDegree("Bachelor of Science in Agricultural Sciences (with Agricultural Economics)", "Natural and Agricultural Sciences", 26),
      createDegree("Bachelor of Science in Agricultural Sciences (with Animal Sciences)", "Natural and Agricultural Sciences", 26),
      createDegree("Bachelor of Science in Agricultural Sciences (with Animal Health)", "Natural and Agricultural Sciences", 26),
      createDegree("Bachelor of Science in Agricultural Sciences (with Agronomy and Horticulture)", "Natural and Agricultural Sciences", 26),
      createDegree("Bachelor of Science in Agricultural Sciences (with Agronomy and Soil Sciences)", "Natural and Agricultural Sciences", 26),
      createDegree("Bachelor of Science in Agricultural Sciences (with Agronomy and Agricultural Economics)", "Natural and Agricultural Sciences", 26),
      createDegree("Bachelor of Science in Indigenous Knowledge Systems", "Natural and Agricultural Sciences", 26)
    ]
  },
  {
    id: "theology",
    name: "Faculty of Theology",
    description: "Theology programs",
    degrees: [
      createDegree("BA in Ancient Languages", "Theology", 24),
      createDegree("Bachelor of Divinity (BDiv)", "Theology", 24),
      createDegree("BTh with Bible Languages & Bible Translation", "Theology", 24),
      createDegree("BA in Pastoral Psychology", "Theology", 24),
      createDegree("BTh in Christian Ministry", "Theology", 24)
    ]
  }
];

// Walter Sisulu University (WSU) Programs
export const WSU_FACULTIES: Faculty[] = [
  {
    id: "education",
    name: "Faculty of Education",
    description: "Education programs",
    degrees: [
      createDegree("Bachelor of Education in Foundation Phase Teaching", "Education", 26),
      createDegree("Bachelor of Education in Senior Phase and Further Education and Training Teaching (Economic & Management Sciences)", "Education", 26),
      createDegree("Bachelor of Education in Senior Phase and Further Education and Training Teaching (Consumer and Management Sciences)", "Education", 26),
      createDegree("Bachelor of Education in Senior Phase and Further Education and Training Teaching (Creative Arts)", "Education", 26),
      createDegree("Bachelor of Education in Senior Phase and Further Education and Training Teaching (Humanities)", "Education", 26),
      createDegree("Bachelor of Education in Senior Phase and Further Education and Training Teaching (Languages)", "Education", 26),
      createDegree("Bachelor of Education in Senior Phase and Further Education and Training Teaching (Mathematics, Science & Technology)", "Education", 26),
      createDegree("Diploma in Adult and Community Education and Training (ACET)", "Education", 21)
    ]
  },
  {
    id: "law-humanities-social",
    name: "Faculty of Law, Humanities and Social Sciences",
    description: "Law, humanities and social sciences programs",
    degrees: [
      createDegree("Diploma in Fine Art", "Law, Humanities and Social Sciences", 20),
      createDegree("Advanced Diploma in Fine Art", "Law, Humanities and Social Sciences", 20),
      createDegree("Diploma in Fashion", "Law, Humanities and Social Sciences", 21),
      createDegree("Bachelor of Arts", "Law, Humanities and Social Sciences", 27),
      createDegree("Bachelor of Social Science", "Law, Humanities and Social Sciences", 27),
      createDegree("Bachelor of Social Science (Extended Curriculum Programme)", "Law, Humanities and Social Sciences", 26),
      createDegree("Bachelor of Laws (LLB)", "Law, Humanities and Social Sciences", 28),
      createDegree("Bachelor of Social Work", "Law, Humanities and Social Sciences", 28),
      createDegree("Bachelor of Psychology", "Law, Humanities and Social Sciences", 28)
    ]
  },
  {
    id: "management-public-admin",
    name: "Faculty of Management and Public Administration Sciences",
    description: "Management and public administration programs",
    degrees: [
      createDegree("Bachelor of Administration", "Management and Public Administration Sciences", 30),
      createDegree("Diploma in Administrative Management", "Management and Public Administration Sciences", 21),
      createDegree("Diploma in Journalism", "Management and Public Administration Sciences", 21),
      createDegree("Diploma in Public Relations", "Management and Public Administration Sciences", 21),
      createDegree("Diploma in Public Management", "Management and Public Administration Sciences", 21),
      createDegree("Diploma in Policing", "Management and Public Administration Sciences", 21),
      createDegree("Diploma in Local Government Finance", "Management and Public Administration Sciences", 21),
      createDegree("Diploma in Management", "Management and Public Administration Sciences", 21),
      createDegree("Diploma in Small Business Management", "Management and Public Administration Sciences", 21),
      createDegree("Diploma in Office Management and Technology", "Management and Public Administration Sciences", 21),
      createDegree("Diploma in Human Resources Management", "Management and Public Administration Sciences", 21),
      createDegree("Diploma in Tourism Management", "Management and Public Administration Sciences", 21),
      createDegree("Diploma in Hospitality Management", "Management and Public Administration Sciences", 21),
      createDegree("Diploma in Sport Management", "Management and Public Administration Sciences", 22),
      createDegree("Diploma in Financial Information Systems", "Management and Public Administration Sciences", 21),
      createDegree("Diploma in Accountancy", "Management and Public Administration Sciences", 21),
      createDegree("Diploma in Internal Auditing", "Management and Public Administration Sciences", 21),
      createDegree("Higher Certificate in Versatile Broadcasting", "Management and Public Administration Sciences", 18)
    ]
  }
];

// University data mapping for easy replacement
export const NEW_UNIVERSITY_PROGRAMS: Record<string, Faculty[]> = {
  "ul": UL_FACULTIES,
  "nwu": NWU_FACULTIES,
  "wsu": WSU_FACULTIES
  // Will continue adding other universities...
};

// Export all faculty data
export const ALL_NEW_FACULTIES = {
  UL_FACULTIES,
  NWU_FACULTIES,
  WSU_FACULTIES
};

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

// University of Zululand (UNIZULU) Programs
export const UNIZULU_FACULTIES: Faculty[] = [
  {
    id: "commerce-admin-law",
    name: "Faculty of Commerce, Administration & Law",
    description: "Commerce, administration and law programs",
    degrees: [
      createDegree("Bachelor of Commerce in Accounting", "Commerce, Administration & Law", 28),
      createDegree("Bachelor of Commerce in Accounting Science (CTA stream)", "Commerce, Administration & Law", 28),
      createDegree("Extended Bachelor of Commerce (Extended Programme)", "Commerce, Administration & Law", 26),
      createDegree("Bachelor of Commerce in Management Information Systems", "Commerce, Administration & Law", 28),
      createDegree("Bachelor of Administration", "Commerce, Administration & Law", 28),
      createDegree("Bachelor of Laws (LLB)", "Commerce, Administration & Law", 30),
      createDegree("Higher Certificate in Accountancy", "Commerce, Administration & Law", 22)
    ]
  },
  {
    id: "science-agriculture-engineering",
    name: "Faculty of Science, Agriculture & Engineering",
    description: "Science, agriculture and engineering programs",
    degrees: [
      createDegree("Bachelor of Engineering (Mechanical Engineering)", "Science, Agriculture & Engineering", 30),
      createDegree("Bachelor of Engineering (Electrical Engineering)", "Science, Agriculture & Engineering", 30),
      createDegree("Bachelor of Science (Mainstream BSc)", "Science, Agriculture & Engineering", 28),
      createDegree("Bachelor of Science in Agriculture (Agronomy / Animal Science)", "Science, Agriculture & Engineering", 28),
      createDegree("Bachelor of Science Foundational/Augmented Stream", "Science, Agriculture & Engineering", 28),
      createDegree("Bachelor of Education stream BSc", "Science, Agriculture & Engineering", 26),
      createDegree("Bachelor of Nursing Science", "Science, Agriculture & Engineering", 30),
      createDegree("Bachelor of Consumer Science: Extension & Rural Development", "Science, Agriculture & Engineering", 28),
      createDegree("Bachelor of Consumer Science: Hospitality & Tourism", "Science, Agriculture & Engineering", 28),
      createDegree("Diploma in Sport & Exercise", "Science, Agriculture & Engineering", 26),
      createDegree("Diploma in Hospitality Management", "Science, Agriculture & Engineering", 26)
    ]
  },
  {
    id: "education",
    name: "Faculty of Education",
    description: "Education programs",
    degrees: [
      createDegree("Bachelor of Education (Foundation Phase Teaching)", "Education", 26),
      createDegree("Bachelor of Education (Intermediate Phase Teaching: Languages)", "Education", 26),
      createDegree("Bachelor of Education (Intermediate Phase: Languages, Maths, Natural Science & Tech)", "Education", 26),
      createDegree("Bachelor of Education (Senior & Social Science Education)", "Education", 26),
      createDegree("Bachelor of Education (Senior Science & Technology Education)", "Education", 26),
      createDegree("Bachelor of Education (Senior Management Sciences – EMS)", "Education", 26)
    ]
  },
  {
    id: "humanities-social",
    name: "Faculty of Humanities & Social Sciences",
    description: "Humanities and social sciences programs",
    degrees: [
      createDegree("Diploma in Public Relations Management", "Humanities & Social Sciences", 24),
      createDegree("Diploma in Media Studies", "Humanities & Social Sciences", 24),
      createDegree("Diploma in Tourism Management", "Humanities & Social Sciences", 24),
      createDegree("Bachelor of Arts (Anthropology & History)", "Humanities & Social Sciences", 26),
      createDegree("Bachelor of Arts (Linguistics & English)", "Humanities & Social Sciences", 26),
      createDegree("Bachelor of Arts (Geography & History)", "Humanities & Social Sciences", 26),
      createDegree("Bachelor of Arts (Geography & Tourism)", "Humanities & Social Sciences", 26),
      createDegree("Bachelor of Arts (History & IsiZulu)", "Humanities & Social Sciences", 26),
      createDegree("Bachelor of Arts (Philosophy & Psychology)", "Humanities & Social Sciences", 26),
      createDegree("Bachelor of Arts in Correctional Studies", "Humanities & Social Sciences", 26),
      createDegree("Bachelor of Arts in Development Studies", "Humanities & Social Sciences", 26),
      createDegree("Bachelor of Social Work", "Humanities & Social Sciences", 28),
      createDegree("Bachelor of Arts in Environmental Planning & Development", "Humanities & Social Sciences", 26),
      createDegree("Bachelor of Arts in Industrial Sociology", "Humanities & Social Sciences", 26),
      createDegree("Bachelor of Arts in Intercultural Communication", "Humanities & Social Sciences", 26),
      createDegree("Bachelor of Library & Information Science", "Humanities & Social Sciences", 26),
      createDegree("Bachelor of Psychology", "Humanities & Social Sciences", 28),
      createDegree("Bachelor of Social Science in Political & International Studies", "Humanities & Social Sciences", 30),
      createDegree("Bachelor of Tourism Studies", "Humanities & Social Sciences", 26)
    ]
  }
];

// Sol Plaatje University (SPU) Programs
export const SPU_FACULTIES: Faculty[] = [
  {
    id: "education",
    name: "Faculty of Education",
    description: "Education programs",
    degrees: [
      createDegree("Bachelor of Education (Foundation Phase, Grade R–3)", "Education", 30),
      createDegree("Bachelor of Education (Intermediate Phase, Grades 4–6)", "Education", 30),
      createDegree("Bachelor of Education (Senior & FET Phase, Grades 7–12)", "Education", 30)
    ]
  },
  {
    id: "natural-applied",
    name: "Faculty of Natural & Applied Sciences",
    description: "Natural and applied sciences programs",
    degrees: [
      createDegree("Bachelor of Science (BSc)", "Natural & Applied Sciences", 30),
      createDegree("Bachelor of Science in Data Science", "Natural & Applied Sciences", 30)
    ]
  },
  {
    id: "economic-management",
    name: "Faculty of Economic & Management Sciences",
    description: "Economic and management programs",
    degrees: [
      createDegree("Bachelor of Commerce in Accounting", "Economic & Management Sciences", 30),
      createDegree("Bachelor of Commerce in Economics", "Economic & Management Sciences", 30),
      createDegree("Diploma in Retail Business Management", "Economic & Management Sciences", 25)
    ]
  },
  {
    id: "humanities-heritage",
    name: "Faculty of Humanities & Heritage Studies",
    description: "Humanities and heritage programs",
    degrees: [
      createDegree("Bachelor of Arts (BA)", "Humanities & Heritage Studies", 30),
      createDegree("Higher Certificate in Heritage Studies", "Humanities & Heritage Studies", 25),
      createDegree("Higher Certificate in Court Interpreting", "Humanities & Heritage Studies", 25)
    ]
  },
  {
    id: "ict",
    name: "School of ICT",
    description: "Information and communication technology programs",
    degrees: [
      createDegree("Diploma in Information & Communication Technology (Applications Development)", "ICT", 25)
    ]
  }
];

// University of Mpumalanga (UMP) Programs
export const UMP_FACULTIES: Faculty[] = [
  {
    id: "social-sciences",
    name: "Faculty of Social Sciences",
    description: "Social sciences programs",
    degrees: [
      createDegree("Bachelor of Arts (General)", "Social Sciences", 28),
      createDegree("Bachelor of Social Work", "Social Sciences", 32)
    ]
  },
  {
    id: "agriculture-natural",
    name: "Faculty of Agriculture & Natural Sciences",
    description: "Agriculture and natural sciences programs",
    degrees: [
      createDegree("Bachelor of Science in Agriculture (Agricultural Extension & Rural Resource Management)", "Agriculture & Natural Sciences", 26),
      createDegree("Bachelor of Science in Forestry", "Agriculture & Natural Sciences", 30),
      createDegree("Bachelor of Science (General)", "Agriculture & Natural Sciences", 30),
      createDegree("Bachelor of Science in Environmental Science", "Agriculture & Natural Sciences", 30),
      createDegree("Diploma in Plant Production", "Agriculture & Natural Sciences", 23),
      createDegree("Diploma in Animal Production", "Agriculture & Natural Sciences", 24)
    ]
  },
  {
    id: "development-business",
    name: "Faculty of Development Studies & Business Sciences",
    description: "Development studies and business programs",
    degrees: [
      createDegree("Bachelor of Commerce (General)", "Development Studies & Business Sciences", 30),
      createDegree("Bachelor of Administration", "Development Studies & Business Sciences", 32),
      createDegree("Bachelor of Development Studies", "Development Studies & Business Sciences", 32)
    ]
  },
  {
    id: "education",
    name: "Faculty of Education",
    description: "Education programs",
    degrees: [
      createDegree("Bachelor of Education (Foundation Phase Teaching)", "Education", 26)
    ]
  },
  {
    id: "ict-computing",
    name: "Faculty of ICT & Computing",
    description: "ICT and computing programs",
    degrees: [
      createDegree("Bachelor of Information & Communication Technology (ICT)", "ICT & Computing", 32),
      createDegree("Diploma in ICT (Applications Development)", "ICT & Computing", 24),
      createDegree("Higher Certificate in ICT (User Support)", "ICT & Computing", 20)
    ]
  },
  {
    id: "hospitality-tourism",
    name: "Faculty of Hospitality & Tourism",
    description: "Hospitality and tourism programs",
    degrees: [
      createDegree("Diploma in Hospitality Management", "Hospitality & Tourism", 24),
      createDegree("Higher Certificate in Event Management", "Hospitality & Tourism", 19)
    ]
  }
];

// Stellenbosch University (SU) Programs
export const STELLENBOSCH_FACULTIES: Faculty[] = [
  {
    id: "agrisciences",
    name: "Faculty of AgriSciences",
    description: "Agricultural sciences programs",
    degrees: [
      createDegree("Bachelor of Science in Agriculture (Various streams: Animal Production Systems, Plant and Soil Sciences, etc.)", "AgriSciences", 30),
      createDegree("Bachelor of Science in Food Science", "AgriSciences", 35),
      createDegree("Bachelor of Science in Forestry", "AgriSciences", 30),
      createDegree("Bachelor of Science in Viticulture and Oenology", "AgriSciences", 30)
    ]
  },
  {
    id: "economic-management",
    name: "Faculty of Economic and Management Sciences",
    description: "Economic and management programs",
    degrees: [
      createDegree("Bachelor of Commerce in Accounting", "Economic and Management Sciences", 36),
      createDegree("Bachelor of Commerce in Economic Sciences", "Economic and Management Sciences", 36),
      createDegree("Bachelor of Commerce in Financial Accounting", "Economic and Management Sciences", 36),
      createDegree("Bachelor of Commerce in Mathematical Sciences", "Economic and Management Sciences", 36),
      createDegree("Bachelor of Commerce in Management Sciences", "Economic and Management Sciences", 36),
      createDegree("Bachelor of Commerce (General)", "Economic and Management Sciences", 36)
    ]
  },
  {
    id: "education",
    name: "Faculty of Education",
    description: "Education programs",
    degrees: [
      createDegree("Bachelor of Education in Foundation Phase Teaching", "Education", 30),
      createDegree("Bachelor of Education in Intermediate Phase Teaching", "Education", 30),
      createDegree("Bachelor of Education in Further Education and Training (FET)", "Education", 30)
    ]
  },
  {
    id: "engineering",
    name: "Faculty of Engineering",
    description: "Engineering programs",
    degrees: [
      createDegree("Bachelor of Engineering (All specialisations: Civil, Electrical, Mechanical, etc.)", "Engineering", 42)
    ]
  },
  {
    id: "law",
    name: "Faculty of Law",
    description: "Legal studies programs",
    degrees: [
      createDegree("Bachelor of Laws (LLB)", "Law", 36),
      createDegree("BA (Law)", "Law", 36),
      createDegree("BCom (Law)", "Law", 36)
    ]
  },
  {
    id: "medicine-health",
    name: "Faculty of Medicine and Health Sciences",
    description: "Medicine and health sciences programs",
    degrees: [
      createDegree("Bachelor of Medicine and Bachelor of Surgery (MBChB)", "Medicine and Health Sciences", 38),
      createDegree("Bachelor of Science in Dietetics", "Medicine and Health Sciences", 36),
      createDegree("Bachelor of Science in Speech-Language and Hearing Therapy", "Medicine and Health Sciences", 36),
      createDegree("Bachelor of Occupational Therapy", "Medicine and Health Sciences", 36),
      createDegree("Bachelor of Physiotherapy", "Medicine and Health Sciences", 36),
      createDegree("Bachelor of Nursing and Midwifery", "Medicine and Health Sciences", 36)
    ]
  },
  {
    id: "science",
    name: "Faculty of Science",
    description: "Science programs",
    degrees: [
      createDegree("Bachelor of Science (with Biological Sciences, Chemistry, Earth Sciences, Mathematical Sciences, Physics, etc.)", "Science", 34),
      createDegree("Bachelor of Science in Molecular Biology and Biotechnology", "Science", 34),
      createDegree("Bachelor of Science in Biodiversity and Ecology", "Science", 34),
      createDegree("Bachelor of Science in Human Life Sciences (Biology or Psychology)", "Science", 34),
      createDegree("Bachelor of Science in Sport Science", "Science", 34)
    ]
  },
  {
    id: "theology",
    name: "Faculty of Theology",
    description: "Theology programs",
    degrees: [
      createDegree("Bachelor of Theology", "Theology", 28),
      createDegree("Bachelor of Divinity (extended)", "Theology", 26)
    ]
  },
  {
    id: "arts-social",
    name: "Faculty of Arts and Social Sciences",
    description: "Arts and social sciences programs",
    degrees: [
      createDegree("Bachelor of Arts (General)", "Arts and Social Sciences", 30),
      createDegree("Bachelor of Arts in Humanities", "Arts and Social Sciences", 30),
      createDegree("Bachelor of Arts in Social Dynamics", "Arts and Social Sciences", 30),
      createDegree("Bachelor of Music", "Arts and Social Sciences", 30),
      createDegree("Bachelor of Drama and Theatre Studies", "Arts and Social Sciences", 30),
      createDegree("Bachelor of Fine Arts", "Arts and Social Sciences", 30)
    ]
  }
];

// Default faculties for universities not yet updated with specific data
const DEFAULT_FACULTIES: Faculty[] = [
  {
    id: "general",
    name: "General Programs",
    description: "General academic programs (data being updated)",
    degrees: [
      createDegree("Bachelor of Arts", "General Programs", 24),
      createDegree("Bachelor of Science", "General Programs", 26),
      createDegree("Bachelor of Commerce", "General Programs", 28)
    ]
  }
];

// University of Free State (UFS) Programs
export const UFS_FACULTIES: Faculty[] = [
  {
    id: "economic-management",
    name: "Faculty of Economic and Management Sciences",
    description: "Economic and management sciences programs",
    degrees: [
      createDegree("Bachelor of Chartered Accountancy", "Economic and Management Sciences", 34),
      createDegree("Bachelor of Commerce in Management", "Economic and Management Sciences", 28),
      createDegree("Bachelor of Commerce in Economics", "Economic and Management Sciences", 28),
      createDegree("Bachelor of Commerce in Marketing", "Economic and Management Sciences", 28),
      createDegree("Bachelor of Commerce in Business and Financial Analytics", "Economic and Management Sciences", 34),
      createDegree("Bachelor of Commerce in Human Resource Management", "Economic and Management Sciences", 28),
      createDegree("Bachelor of Administration", "Economic and Management Sciences", 28),
      createDegree("Extended Curriculum Programmes (Commerce and Administration)", "Economic and Management Sciences", 28),
      createDegree("Bachelor of Commerce in Accounting", "Economic and Management Sciences", 28),
      createDegree("Bachelor of Commerce", "Economic and Management Sciences", 28)
    ]
  },
  {
    id: "education",
    name: "Faculty of Education",
    description: "Education programs",
    degrees: [
      createDegree("Bachelor of Education in Foundation Phase Teaching", "Education", 30),
      createDegree("Bachelor of Education in Intermediate Phase Teaching", "Education", 30),
      createDegree("Bachelor of Education in Senior Phase and FET Teaching", "Education", 30),
      createDegree("Extended Curriculum Programmes (Education)", "Education", 28)
    ]
  },
  {
    id: "health-sciences",
    name: "Faculty of Health Sciences",
    description: "Health sciences programs",
    degrees: [
      createDegree("Bachelor of Medicine and Bachelor of Surgery (MBChB)", "Health Sciences", 38),
      createDegree("Bachelor of Occupational Therapy", "Health Sciences", 33),
      createDegree("Bachelor of Optometry", "Health Sciences", 33),
      createDegree("Bachelor of Physiotherapy", "Health Sciences", 33),
      createDegree("Bachelor of Medicine specialising in Radiation Science", "Health Sciences", 30),
      createDegree("Bachelor of Biokinetics", "Health Sciences", 30),
      createDegree("Bachelor of Nursing", "Health Sciences", 30),
      createDegree("Bachelor of Medicine and Bachelor of Surgery", "Health Sciences", 36),
      createDegree("Bachelor of Dietetics", "Health Sciences", 33),
      createDegree("Bachelor of Sport Coaching", "Health Sciences", 30)
    ]
  },
  {
    id: "humanities",
    name: "Faculty of the Humanities",
    description: "Humanities programs",
    degrees: [
      createDegree("Bachelor of Social Sciences", "Humanities", 30),
      createDegree("Bachelor of Arts", "Humanities", 30),
      createDegree("Bachelor of Community Development", "Humanities", 30),
      createDegree("Bachelor of Governance and Political Transformation", "Humanities", 30),
      createDegree("Bachelor of Language Practice", "Humanities", 30),
      createDegree("Bachelor of Drama and Theatre Arts", "Humanities", 30),
      createDegree("Bachelor of Music", "Humanities", 30),
      createDegree("Bachelor of Fine Arts", "Humanities", 30),
      createDegree("Bachelor of Theology", "Humanities", 30),
      createDegree("Extended Curriculum Programmes (Humanities)", "Humanities", 28),
      createDegree("Higher Certificate in Music Performance", "Humanities", 20),
      createDegree("Diploma in Music", "Humanities", 25)
    ]
  },
  {
    id: "law",
    name: "Faculty of Law",
    description: "Legal studies programs",
    degrees: [
      createDegree("Bachelor of Laws (LLB)", "Law", 33)
    ]
  },
  {
    id: "natural-agricultural",
    name: "Faculty of Natural and Agricultural Sciences",
    description: "Natural and agricultural sciences programs",
    degrees: [
      createDegree("Bachelor of Science (with Actuarial Science)", "Natural and Agricultural Sciences", 34),
      createDegree("Bachelor of Science (with Agricultural Economics)", "Natural and Agricultural Sciences", 32),
      createDegree("Bachelor of Science (with Animal Science)", "Natural and Agricultural Sciences", 32),
      createDegree("Bachelor of Science (with Biochemistry)", "Natural and Agricultural Sciences", 32),
      createDegree("Bachelor of Science (with Chemistry)", "Natural and Agricultural Sciences", 32),
      createDegree("Bachelor of Science (with Consumer Sciences)", "Natural and Agricultural Sciences", 32),
      createDegree("Bachelor of Science (with Environmental Geography)", "Natural and Agricultural Sciences", 32),
      createDegree("Bachelor of Science (with Genetics)", "Natural and Agricultural Sciences", 32),
      createDegree("Bachelor of Science (with Geology)", "Natural and Agricultural Sciences", 32),
      createDegree("Bachelor of Science (with Geography)", "Natural and Agricultural Sciences", 32),
      createDegree("Bachelor of Science (with Human Physiology)", "Natural and Agricultural Sciences", 32),
      createDegree("Bachelor of Science (with Mathematics)", "Natural and Agricultural Sciences", 32),
      createDegree("Bachelor of Science (with Microbiology)", "Natural and Agricultural Sciences", 32),
      createDegree("Bachelor of Science (with Physics)", "Natural and Agricultural Sciences", 32),
      createDegree("Bachelor of Science (with Plant Sciences)", "Natural and Agricultural Sciences", 32),
      createDegree("Bachelor of Science (with Quantity Surveying)", "Natural and Agricultural Sciences", 34),
      createDegree("Bachelor of Science (with Soil Science)", "Natural and Agricultural Sciences", 32),
      createDegree("Bachelor of Science (with Zoology)", "Natural and Agricultural Sciences", 32),
      createDegree("Bachelor of Science (with Computer Science and Informatics)", "Natural and Agricultural Sciences", 32),
      createDegree("Extended Curriculum Programmes (BSc)", "Natural and Agricultural Sciences", 28),
      createDegree("Bachelor of Architecture", "Natural and Agricultural Sciences", 30)
    ]
  },
  {
    id: "theology-religion",
    name: "Faculty of Theology and Religion",
    description: "Theology and religion programs",
    degrees: [
      createDegree("Bachelor of Divinity", "Theology and Religion", 28)
    ]
  }
];

// University of Fort Hare (UFH) Programs
export const UFH_FACULTIES: Faculty[] = [
  {
    id: "education",
    name: "Faculty of Education",
    description: "Education programs",
    degrees: [
      createDegree("Bachelor of Education in Foundation Phase Teaching (FP)", "Education", 28),
      createDegree("Bachelor of Education in Intermediate Phase Teaching (IP)", "Education", 28),
      createDegree("Bachelor of Education in Senior and FET Phase Teaching (BEd SP & FET)", "Education", 30),
      createDegree("Higher Certificate in Education (HCertEd)", "Education", 20)
    ]
  },
  {
    id: "health-sciences",
    name: "Faculty of Health Sciences",
    description: "Health sciences programs",
    degrees: [
      createDegree("Bachelor of Nursing", "Health Sciences", 32),
      createDegree("Bachelor of Science in Human Movement Science", "Health Sciences", 30),
      createDegree("Bachelor of Science in Dietetics", "Health Sciences", 34),
      createDegree("Bachelor of Science in Speech-Language Pathology", "Health Sciences", 32),
      createDegree("Bachelor of Science in Occupational Therapy", "Health Sciences", 34)
    ]
  },
  {
    id: "law",
    name: "Faculty of Law",
    description: "Legal studies programs",
    degrees: [
      createDegree("Bachelor of Laws (LLB)", "Law", 32)
    ]
  },
  {
    id: "management-commerce",
    name: "Faculty of Management & Commerce",
    description: "Management and commerce programs",
    degrees: [
      createDegree("Bachelor of Commerce in Accounting", "Management & Commerce", 30),
      createDegree("Bachelor of Commerce in Business Management", "Management & Commerce", 28),
      createDegree("Bachelor of Commerce in Economics", "Management & Commerce", 28),
      createDegree("Bachelor of Administration (Public Administration)", "Management & Commerce", 26),
      createDegree("Bachelor of Commerce in Information Systems", "Management & Commerce", 28),
      createDegree("Bachelor of Commerce in Industrial Psychology", "Management & Commerce", 28),
      createDegree("Bachelor of Commerce (Extended)", "Management & Commerce", 24),
      createDegree("Bachelor of Administration (Extended)", "Management & Commerce", 24)
    ]
  },
  {
    id: "science-agriculture",
    name: "Faculty of Science and Agriculture",
    description: "Science and agriculture programs",
    degrees: [
      createDegree("Bachelor of Science (BSc) in Agriculture: Agricultural Economics", "Science and Agriculture", 28),
      createDegree("Bachelor of Science in Agriculture: Agronomy", "Science and Agriculture", 28),
      createDegree("Bachelor of Science in Agriculture: Animal Production", "Science and Agriculture", 28),
      createDegree("Bachelor of Science in Agriculture: Soil Science", "Science and Agriculture", 28),
      createDegree("Bachelor of Science in Agriculture: Extension and Rural Development", "Science and Agriculture", 28),
      createDegree("Bachelor of Science (General) with various majors including Computer Science, Statistics, Biochemistry", "Science and Agriculture", 30),
      createDegree("BSc (Extended): Agriculture", "Science and Agriculture", 26),
      createDegree("BSc (Extended): General", "Science and Agriculture", 26)
    ]
  },
  {
    id: "social-sciences-humanities",
    name: "Faculty of Social Sciences and Humanities",
    description: "Social sciences and humanities programs",
    degrees: [
      createDegree("Bachelor of Social Science", "Social Sciences and Humanities", 26),
      createDegree("Bachelor of Arts", "Social Sciences and Humanities", 26),
      createDegree("Bachelor of Psychology", "Social Sciences and Humanities", 28),
      createDegree("Bachelor of Library and Information Science", "Social Sciences and Humanities", 26),
      createDegree("Bachelor of Theology", "Social Sciences and Humanities", 26),
      createDegree("Bachelor of Social Science (Extended)", "Social Sciences and Humanities", 24),
      createDegree("Bachelor of Arts (Extended)", "Social Sciences and Humanities", 24)
    ]
  }
];

// Tshwane University of Technology (TUT) Programs
export const TUT_FACULTIES: Faculty[] = [
  {
    id: "arts-design",
    name: "Faculty of Arts and Design",
    description: "Arts and design programs",
    degrees: [
      createDegree("Bachelor of Arts in Fine Art", "Arts and Design", 24),
      createDegree("Bachelor of Arts in Fashion Design and Technology", "Arts and Design", 24),
      createDegree("Bachelor of Arts in Integrated Communication Design", "Arts and Design", 24),
      createDegree("Bachelor of Arts in Jewellery Design and Manufacture", "Arts and Design", 24),
      createDegree("Bachelor of Arts in Performing Arts", "Arts and Design", 24),
      createDegree("Bachelor of Arts in Visual Communication", "Arts and Design", 24),
      createDegree("Bachelor of Arts in Interior Design", "Arts and Design", 24),
      createDegree("Higher Certificate in Performing Arts", "Arts and Design", 18)
    ]
  },
  {
    id: "economics-finance",
    name: "Faculty of Economics and Finance",
    description: "Economics and finance programs",
    degrees: [
      createDegree("Bachelor of Accounting", "Economics and Finance", 28),
      createDegree("Diploma in Accounting", "Economics and Finance", 22),
      createDegree("Bachelor of Economics", "Economics and Finance", 28),
      createDegree("Diploma in Economics", "Economics and Finance", 22),
      createDegree("Diploma in Public Finance and Accounting", "Economics and Finance", 22),
      createDegree("Diploma in Taxation", "Economics and Finance", 22),
      createDegree("Higher Certificate in Accounting", "Economics and Finance", 18)
    ]
  },
  {
    id: "engineering-built",
    name: "Faculty of Engineering and the Built Environment",
    description: "Engineering and built environment programs",
    degrees: [
      createDegree("Bachelor of Engineering Technology in Civil Engineering", "Engineering and the Built Environment", 30),
      createDegree("Bachelor of Engineering Technology in Electrical Engineering", "Engineering and the Built Environment", 30),
      createDegree("Bachelor of Engineering Technology in Mechanical Engineering", "Engineering and the Built Environment", 30),
      createDegree("Bachelor of Engineering Technology in Chemical Engineering", "Engineering and the Built Environment", 30),
      createDegree("Bachelor of Engineering Technology in Industrial Engineering", "Engineering and the Built Environment", 30),
      createDegree("Bachelor of Engineering Technology in Computer Engineering", "Engineering and the Built Environment", 30),
      createDegree("Diploma in Civil Engineering", "Engineering and the Built Environment", 26),
      createDegree("Diploma in Electrical Engineering", "Engineering and the Built Environment", 26),
      createDegree("Diploma in Mechanical Engineering", "Engineering and the Built Environment", 26),
      createDegree("Diploma in Industrial Engineering", "Engineering and the Built Environment", 26),
      createDegree("Diploma in Computer Systems Engineering", "Engineering and the Built Environment", 26),
      createDegree("Diploma in Architecture", "Engineering and the Built Environment", 26),
      createDegree("Diploma in Building", "Engineering and the Built Environment", 26),
      createDegree("Diploma in Geomatics", "Engineering and the Built Environment", 26),
      createDegree("Higher Certificate in Electrical Engineering", "Engineering and the Built Environment", 18),
      createDegree("Higher Certificate in Mechanical Engineering", "Engineering and the Built Environment", 18)
    ]
  },
  {
    id: "humanities",
    name: "Faculty of Humanities",
    description: "Humanities programs",
    degrees: [
      createDegree("Bachelor of Education in Foundation Phase Teaching", "Humanities", 25),
      createDegree("Bachelor of Education in Senior Phase and FET Teaching", "Humanities", 25),
      createDegree("Diploma in Correctional and Rehabilitation Studies", "Humanities", 22),
      createDegree("Diploma in Language Practice", "Humanities", 22),
      createDegree("Diploma in Policing", "Humanities", 22),
      createDegree("Diploma in Traffic Safety and Municipal Policing", "Humanities", 22),
      createDegree("Diploma in Integrated Communication", "Humanities", 22),
      createDegree("Diploma in Journalism", "Humanities", 22),
      createDegree("Diploma in Public Relations Management", "Humanities", 22),
      createDegree("Higher Certificate in Law Enforcement", "Humanities", 18),
      createDegree("Higher Certificate in Public Relations", "Humanities", 18)
    ]
  },
  {
    id: "ict",
    name: "Faculty of Information and Communication Technology",
    description: "ICT programs",
    degrees: [
      createDegree("Bachelor of Information Technology", "Information and Communication Technology", 28),
      createDegree("Diploma in Computer Science", "Information and Communication Technology", 24),
      createDegree("Diploma in Computer Systems Engineering", "Information and Communication Technology", 26),
      createDegree("Diploma in Multimedia Computing", "Information and Communication Technology", 24),
      createDegree("Diploma in Software Development", "Information and Communication Technology", 24),
      createDegree("Diploma in Informatics", "Information and Communication Technology", 24),
      createDegree("Diploma in Information Technology", "Information and Communication Technology", 24),
      createDegree("Diploma in Web and Application Development", "Information and Communication Technology", 24),
      createDegree("Higher Certificate in Information and Communication Technology", "Information and Communication Technology", 18)
    ]
  },
  {
    id: "management-sciences",
    name: "Faculty of Management Sciences",
    description: "Management sciences programs",
    degrees: [
      createDegree("Bachelor of Management Sciences in Business Administration", "Management Sciences", 26),
      createDegree("Bachelor of Management Sciences in Human Resource Management", "Management Sciences", 26),
      createDegree("Bachelor of Management Sciences in Marketing", "Management Sciences", 26),
      createDegree("Bachelor of Management Sciences in Retail Business Management", "Management Sciences", 26),
      createDegree("Diploma in Administrative Information Management", "Management Sciences", 22),
      createDegree("Diploma in Business Administration", "Management Sciences", 22),
      createDegree("Diploma in Human Resource Management", "Management Sciences", 22),
      createDegree("Diploma in Marketing", "Management Sciences", 22),
      createDegree("Diploma in Public Management", "Management Sciences", 22),
      createDegree("Diploma in Retail Business Management", "Management Sciences", 22),
      createDegree("Diploma in Supply Chain Management", "Management Sciences", 22),
      createDegree("Higher Certificate in Administrative Information Management", "Management Sciences", 18),
      createDegree("Higher Certificate in Business Studies", "Management Sciences", 18)
    ]
  },
  {
    id: "science",
    name: "Faculty of Science",
    description: "Science programs",
    degrees: [
      createDegree("Bachelor of Science in Chemistry", "Science", 26),
      createDegree("Bachelor of Science in Industrial Physics", "Science", 26),
      createDegree("Bachelor of Science in Mathematical Technology", "Science", 26),
      createDegree("Bachelor of Science in Statistics", "Science", 26),
      createDegree("Bachelor of Science in Biotechnology", "Science", 26),
      createDegree("Diploma in Analytical Chemistry", "Science", 24),
      createDegree("Diploma in Biotechnology", "Science", 24),
      createDegree("Diploma in Environmental Sciences", "Science", 24),
      createDegree("Diploma in Food Technology", "Science", 24),
      createDegree("Diploma in Geology", "Science", 24),
      createDegree("Diploma in Industrial Physics", "Science", 24),
      createDegree("Diploma in Mathematical Technology", "Science", 24),
      createDegree("Diploma in Nature Conservation", "Science", 24),
      createDegree("Diploma in Polymer Technology", "Science", 24),
      createDegree("Diploma in Water Care", "Science", 24),
      createDegree("Higher Certificate in Science and Technology", "Science", 18)
    ]
  },
  {
    id: "health-sciences",
    name: "Faculty of Health Sciences",
    description: "Health sciences programs",
    degrees: [
      createDegree("Bachelor of Health Sciences in Dental Technology", "Health Sciences", 28),
      createDegree("Bachelor of Health Sciences in Medical Orthotics and Prosthetics", "Health Sciences", 28),
      createDegree("Bachelor of Health Sciences in Nursing", "Health Sciences", 28),
      createDegree("Bachelor of Health Sciences in Radiography", "Health Sciences", 28),
      createDegree("Bachelor of Health Sciences in Biomedical Sciences", "Health Sciences", 28),
      createDegree("Bachelor of Health Sciences in Environmental Health", "Health Sciences", 28),
      createDegree("Bachelor of Health Sciences in Clinical Technology", "Health Sciences", 28),
      createDegree("Bachelor of Health Sciences in Somatology", "Health Sciences", 28),
      createDegree("Diploma in Dental Assisting", "Health Sciences", 24),
      createDegree("Diploma in Nursing", "Health Sciences", 26),
      createDegree("Diploma in Somatology", "Health Sciences", 24),
      createDegree("Higher Certificate in Dental Assisting", "Health Sciences", 18),
      createDegree("Higher Certificate in Nursing Care", "Health Sciences", 18)
    ]
  }
];

// Durban University of Technology (DUT) Programs
export const DUT_FACULTIES: Faculty[] = [
  {
    id: "accounting-informatics",
    name: "Faculty of Accounting and Informatics",
    description: "Accounting and informatics programs",
    degrees: [
      createDegree("Bachelor of Information and Communications Technology", "Accounting and Informatics", 30),
      createDegree("Bachelor of ICT: Internet of Things (IoT)", "Accounting and Informatics", 30),
      createDegree("Diploma ICT: Applications Development", "Accounting and Informatics", 23),
      createDegree("Diploma ICT: Business Analysis", "Accounting and Informatics", 23),
      createDegree("Diploma Business & Information Management", "Accounting and Informatics", 23),
      createDegree("Diploma in Accounting", "Accounting and Informatics", 23),
      createDegree("Diploma in Internal Auditing", "Accounting and Informatics", 23),
      createDegree("Diploma in Library and Information Studies", "Accounting and Informatics", 23),
      createDegree("Diploma in Management Accounting", "Accounting and Informatics", 23),
      createDegree("Diploma in Taxation", "Accounting and Informatics", 23)
    ]
  },
  {
    id: "applied-sciences",
    name: "Faculty of Applied Sciences",
    description: "Applied sciences programs",
    degrees: [
      createDegree("Bachelor of Applied Science in Biotechnology", "Applied Sciences", 28),
      createDegree("Bachelor of Applied Science in Food Science and Technology", "Applied Sciences", 28),
      createDegree("Bachelor of Applied Science in Industrial Chemistry", "Applied Sciences", 28),
      createDegree("Bachelor of Applied Science in Textile Science", "Applied Sciences", 28),
      createDegree("Bachelor of Sport Science and Management", "Applied Sciences", 28),
      createDegree("Diploma in Shipping & Logistics", "Applied Sciences", 23),
      createDegree("Diploma in Analytical Chemistry", "Applied Sciences", 23),
      createDegree("Diploma in Clothing Management", "Applied Sciences", 23),
      createDegree("Diploma in Consumer Sciences in Food and Nutrition", "Applied Sciences", 23),
      createDegree("Diploma in Nautical Science", "Applied Sciences", 23),
      createDegree("Diploma in Sustainable Horticulture and Landscaping", "Applied Sciences", 23),
      createDegree("Higher Certificate in Sport Management Science", "Applied Sciences", 24)
    ]
  },
  {
    id: "arts-design",
    name: "Faculty of Arts and Design",
    description: "Arts and design programs",
    degrees: [
      createDegree("Bachelor of Applied Arts in Commercial Photography", "Arts and Design", 26),
      createDegree("Bachelor of Applied Arts in Screen Arts and Technology", "Arts and Design", 36),
      createDegree("Bachelor of Design in Visual Communication Design", "Arts and Design", 26),
      createDegree("Bachelor of Education in Senior Phase & FET: Economic and Management Sciences", "Arts and Design", 28),
      createDegree("Bachelor of Education in Senior Phase & FET: Electrical Technology", "Arts and Design", 28),
      createDegree("Bachelor of Education in Senior Phase & FET: Mechanical Technology", "Arts and Design", 28),
      createDegree("Bachelor of Education in Senior Phase & FET: Languages", "Arts and Design", 28),
      createDegree("Bachelor of Education in Senior Phase & FET: Natural Sciences", "Arts and Design", 28),
      createDegree("Bachelor of Education in Senior Phase & FET: Civil Technology", "Arts and Design", 28),
      createDegree("Bachelor of Journalism", "Arts and Design", 26),
      createDegree("Diploma in Drama", "Arts and Design", 24),
      createDegree("Diploma in Fashion Design", "Arts and Design", 23),
      createDegree("Diploma in Fine Art", "Arts and Design", 23),
      createDegree("Diploma in Interior Design", "Arts and Design", 23),
      createDegree("Diploma in Jewellery Design and Manufacture", "Arts and Design", 23),
      createDegree("Diploma in Language Practice", "Arts and Design", 23),
      createDegree("Higher Certificate in Performing Arts Technology", "Arts and Design", 23)
    ]
  },
  {
    id: "engineering-built",
    name: "Faculty of Engineering and the Built Environment",
    description: "Engineering and built environment programs",
    degrees: [
      createDegree("Bachelor of the Built Environment: Urban and Regional Planning", "Engineering and the Built Environment", 26),
      createDegree("Bachelor of Engineering Technology in Chemical Engineering", "Engineering and the Built Environment", 26),
      createDegree("Bachelor of Engineering Technology in Electronic Engineering", "Engineering and the Built Environment", 26),
      createDegree("Bachelor of Engineering Technology in Industrial Engineering", "Engineering and the Built Environment", 26),
      createDegree("Bachelor of Engineering Technology in Mechanical Engineering", "Engineering and the Built Environment", 26),
      createDegree("Bachelor of Engineering Technology in Power Engineering", "Engineering and the Built Environment", 26),
      createDegree("Bachelor of the Built Environment in Architecture", "Engineering and the Built Environment", 26),
      createDegree("Bachelor of the Built Environment in Construction Studies", "Engineering and the Built Environment", 26),
      createDegree("Bachelor of the Built Environment in Geomatics", "Engineering and the Built Environment", 26),
      createDegree("Bachelor of Engineering Technology in Civil Engineering", "Engineering and the Built Environment", 26),
      createDegree("Diploma in Engineering Technology in Civil Engineering", "Engineering and the Built Environment", 26),
      createDegree("Diploma in the Built Environment in Construction Studies", "Engineering and the Built Environment", 26),
      createDegree("Diploma in Pulp and Paper Technology", "Engineering and the Built Environment", 23)
    ]
  },
  {
    id: "health-sciences",
    name: "Faculty of Health Sciences",
    description: "Health sciences programs",
    degrees: [
      createDegree("Bachelor of Child & Youth Care", "Health Sciences", 26),
      createDegree("Bachelor of Health Sciences in Environmental Health", "Health Sciences", 26),
      createDegree("Bachelor of Health Sciences in Radiography: Diagnostic", "Health Sciences", 28),
      createDegree("Bachelor of Health Sciences in Radiography: Sonography", "Health Sciences", 28),
      createDegree("Bachelor of Health Sciences in Radiography: Therapy and Oncology", "Health Sciences", 28),
      createDegree("Bachelor of Health Sciences in Clinical Technology", "Health Sciences", 26),
      createDegree("Bachelor of Health Sciences in Emergency Medical Care", "Health Sciences", 30),
      createDegree("Bachelor of Health Sciences in Homeopathy", "Health Sciences", 26),
      createDegree("Bachelor of Health Sciences in Chiropractic", "Health Sciences", 26),
      createDegree("Bachelor of Health Sciences in Medical Laboratory Science", "Health Sciences", 26),
      createDegree("Bachelor in Nursing", "Health Sciences", 28),
      createDegree("Diploma in Somatology", "Health Sciences", 23),
      createDegree("Higher Certificate in Dental Assisting", "Health Sciences", 23)
    ]
  },
  {
    id: "management-sciences",
    name: "Faculty of Management Sciences",
    description: "Management sciences programs",
    degrees: [
      createDegree("Diploma in Management Sciences: Business Administration", "Management Sciences", 25),
      createDegree("Diploma in Management Sciences: Business Law", "Management Sciences", 25),
      createDegree("Diploma in Management Sciences: Human Resources", "Management Sciences", 25),
      createDegree("Diploma in Management Sciences: Marketing", "Management Sciences", 25),
      createDegree("Diploma in Management Sciences: Operations", "Management Sciences", 25),
      createDegree("Diploma in Management Sciences: Public Relations and Communication", "Management Sciences", 25),
      createDegree("Diploma in Management Sciences: Retail", "Management Sciences", 25),
      createDegree("Diploma in Public Administration: Disaster & Risk Management", "Management Sciences", 25),
      createDegree("Diploma in Public Administration: Local Government", "Management Sciences", 25),
      createDegree("Diploma in Public Administration: Public Management", "Management Sciences", 25),
      createDegree("Diploma in Public Administration: Supply Chain Management", "Management Sciences", 25),
      createDegree("Diploma in Catering Management", "Management Sciences", 23),
      createDegree("Diploma in Hospitality Management", "Management Sciences", 23),
      createDegree("Diploma in Tourism Management", "Management Sciences", 26),
      createDegree("Diploma in Eco Tourism", "Management Sciences", 25)
    ]
  }
];

// Vaal University of Technology (VUT) Programs
export const VUT_FACULTIES: Faculty[] = [
  {
    id: "applied-computer",
    name: "Faculty of Applied and Computer Sciences",
    description: "Applied and computer sciences programs",
    degrees: [
      createDegree("Diploma in Analytical Chemistry", "Applied and Computer Sciences", 21),
      createDegree("Diploma in Agricultural Management", "Applied and Computer Sciences", 21),
      createDegree("Diploma in Biotechnology", "Applied and Computer Sciences", 23),
      createDegree("Diploma in Non-Destructive Testing", "Applied and Computer Sciences", 19),
      createDegree("Diploma in Information Technology", "Applied and Computer Sciences", 26),
      createDegree("Extended Diploma in Information Technology", "Applied and Computer Sciences", 24)
    ]
  },
  {
    id: "engineering-technology",
    name: "Faculty of Engineering and Technology",
    description: "Engineering and technology programs",
    degrees: [
      createDegree("Diploma in Chemical Engineering", "Engineering and Technology", 24),
      createDegree("Diploma in Civil Engineering", "Engineering and Technology", 24),
      createDegree("Diploma in Industrial Engineering", "Engineering and Technology", 24),
      createDegree("Diploma in Mechanical Engineering", "Engineering and Technology", 24),
      createDegree("Diploma in Metallurgical Engineering", "Engineering and Technology", 24),
      createDegree("Diploma in Electronic Engineering", "Engineering and Technology", 24),
      createDegree("Diploma in Power Engineering", "Engineering and Technology", 24),
      createDegree("Diploma in Process Control Engineering", "Engineering and Technology", 24),
      createDegree("Diploma in Computer Systems Engineering", "Engineering and Technology", 24),
      createDegree("Diploma in Operations Management", "Engineering and Technology", 23),
      createDegree("Extended Diplomas (4 years)", "Engineering and Technology", 22)
    ]
  },
  {
    id: "human-sciences",
    name: "Faculty of Human Sciences",
    description: "Human sciences programs",
    degrees: [
      createDegree("Diploma in Fashion, Photography, Graphic Design & Fine Art", "Human Sciences", 21),
      createDegree("Diploma in Food Service Management", "Human Sciences", 20),
      createDegree("Diploma in Public Relations", "Human Sciences", 20),
      createDegree("Diploma in Tourism Management", "Human Sciences", 20),
      createDegree("Diploma in Ecotourism Management", "Human Sciences", 20),
      createDegree("Diploma in Labour Law", "Human Sciences", 23),
      createDegree("Diploma in Legal Assistance", "Human Sciences", 21),
      createDegree("Diploma in Safety Management", "Human Sciences", 20),
      createDegree("Diploma in Policing", "Human Sciences", 20),
      createDegree("Bachelor of Communication Studies", "Human Sciences", 20),
      createDegree("Bachelor of Education in Senior Phase & FET Teaching", "Human Sciences", 22)
    ]
  },
  {
    id: "management-sciences",
    name: "Faculty of Management Sciences",
    description: "Management sciences programs",
    degrees: [
      createDegree("Diploma in Financial Information Systems", "Management Sciences", 20),
      createDegree("Diploma in Cost and Management Accounting", "Management Sciences", 20),
      createDegree("Diploma in Internal Auditing", "Management Sciences", 20),
      createDegree("Diploma in Human Resource Management", "Management Sciences", 20),
      createDegree("Diploma in Logistics and Supply Chain Management", "Management Sciences", 20),
      createDegree("Diploma in Marketing", "Management Sciences", 20),
      createDegree("Diploma in Retail Business Management", "Management Sciences", 20),
      createDegree("Diploma in Sport Management", "Management Sciences", 20)
    ]
  },
  {
    id: "health-sciences",
    name: "Faculty of Health Sciences",
    description: "Health sciences programs",
    degrees: [
      createDegree("Bachelor of Health Sciences in Medical Laboratory Sciences", "Health Sciences", 27)
    ]
  }
];

// Mangosuthu University of Technology (MUT) Programs
export const MUT_FACULTIES: Faculty[] = [
  {
    id: "engineering",
    name: "Faculty of Engineering",
    description: "Engineering programs",
    degrees: [
      createDegree("Diploma in Chemical Engineering", "Engineering", 26),
      createDegree("Diploma in Civil Engineering", "Engineering", 26),
      createDegree("Diploma in Surveying", "Engineering", 26),
      createDegree("Diploma in Building", "Engineering", 26),
      createDegree("Diploma in Electrical Engineering", "Engineering", 26),
      createDegree("Diploma in Mechanical Engineering", "Engineering", 26),
      createDegree("Bridging: Chemical Engineering", "Engineering", 20),
      createDegree("Bridging: Civil Engineering", "Engineering", 20),
      createDegree("Bridging: Electrical Engineering", "Engineering", 20),
      createDegree("Bridging: Mechanical Engineering", "Engineering", 20),
      createDegree("Bridging: Building", "Engineering", 20),
      createDegree("Bridging: Surveying", "Engineering", 20)
    ]
  },
  {
    id: "management-sciences",
    name: "Faculty of Management Sciences",
    description: "Management sciences programs",
    degrees: [
      createDegree("Diploma in Accounting", "Management Sciences", 25),
      createDegree("Diploma in Finance & Accounting: Public", "Management Sciences", 25),
      createDegree("Diploma in Human Resource Management", "Management Sciences", 25),
      createDegree("Diploma in Marketing", "Management Sciences", 25),
      createDegree("Diploma in Office Management & Technology", "Management Sciences", 25),
      createDegree("Diploma in Public Management", "Management Sciences", 25)
    ]
  },
  {
    id: "natural-sciences",
    name: "Faculty of Natural Sciences",
    description: "Natural sciences programs",
    degrees: [
      createDegree("BSc in Environmental Health", "Natural Sciences", 26),
      createDegree("Bachelor of Health Science in Medical Laboratory Sciences (BHSc-MLS)", "Natural Sciences", 26),
      createDegree("Diploma in Agriculture", "Natural Sciences", 23),
      createDegree("Diploma in Biomedical Science", "Natural Sciences", 26),
      createDegree("Diploma in Analytical Chemistry", "Natural Sciences", 26),
      createDegree("Diploma in Community Extension", "Natural Sciences", 23),
      createDegree("Diploma in Nature Conservation", "Natural Sciences", 23),
      createDegree("Diploma in Information Technology (with entrance test)", "Natural Sciences", 23)
    ]
  }
];

// University of Western Cape (UWC) Programs
export const UWC_FACULTIES: Faculty[] = [
  {
    id: "community-health",
    name: "Faculty of Community and Health Sciences",
    description: "Community and health sciences programs",
    degrees: [
      createDegree("Bachelor of Social Work", "Community and Health Sciences", 34),
      createDegree("Bachelor of Community Development", "Community and Health Sciences", 30),
      createDegree("BA Sport, Recreation and Exercise Science", "Community and Health Sciences", 30),
      createDegree("BSc Sport and Exercise Science", "Community and Health Sciences", 33),
      createDegree("BSc Occupational Therapy", "Community and Health Sciences", 33),
      createDegree("BSc Physiotherapy", "Community and Health Sciences", 39),
      createDegree("B Nursing and Midwifery", "Community and Health Sciences", 30),
      createDegree("BSc Dietetics and Nutrition", "Community and Health Sciences", 33)
    ]
  },
  {
    id: "dentistry",
    name: "Faculty of Dentistry",
    description: "Dentistry programs",
    degrees: [
      createDegree("Bachelor of Dental Surgery (BDS)", "Dentistry", 40),
      createDegree("Bachelor of Oral Health (BOH)", "Dentistry", 33)
    ]
  },
  {
    id: "education",
    name: "Faculty of Education",
    description: "Education programs",
    degrees: [
      createDegree("BEd Foundation Phase Teaching", "Education", 33),
      createDegree("BEd Accounting (FET), EMS (SP) & Mathematics (SP)", "Education", 33),
      createDegree("BEd Mathematics (SP), Math Literacy (SP & FET) & Natural Science (SP)", "Education", 33),
      createDegree("BEd Languages (SP & FET) & Life Orientation (SP)", "Education", 33),
      createDegree("BEd Languages (SP & FET) & Mathematics (SP)", "Education", 33),
      createDegree("BEd Languages (SP & FET) & Social Sciences (SP)", "Education", 33)
    ]
  },
  {
    id: "natural-sciences",
    name: "Faculty of Natural Sciences",
    description: "Natural sciences programs",
    degrees: [
      createDegree("BSc Environmental and Water Science", "Natural Sciences", 33),
      createDegree("BSc Biotechnology", "Natural Sciences", 33),
      createDegree("BSc Biodiversity and Conservation Biology", "Natural Sciences", 33),
      createDegree("BSc Medical Bioscience", "Natural Sciences", 33),
      createDegree("BSc Chemical Sciences", "Natural Sciences", 33),
      createDegree("BSc Applied Geology", "Natural Sciences", 33),
      createDegree("BSc Physical Science", "Natural Sciences", 33),
      createDegree("BSc Mathematical & Statistical Sciences", "Natural Sciences", 33),
      createDegree("BSc Computer Science", "Natural Sciences", 33),
      createDegree("Bachelor of Pharmacy (BPharm)", "Natural Sciences", 38)
    ]
  },
  {
    id: "arts-humanities",
    name: "Faculty of Arts and Humanities",
    description: "Arts and humanities programs",
    degrees: [
      createDegree("Bachelor of Arts (BA)", "Arts and Humanities", 35),
      createDegree("Bachelor of Theology (BTh)", "Arts and Humanities", 35),
      createDegree("Bachelor of Library and Information Science (BLIS)", "Arts and Humanities", 35)
    ]
  },
  {
    id: "law",
    name: "Faculty of Law",
    description: "Legal studies programs",
    degrees: [
      createDegree("Bachelor of Laws (LLB) (4-year)", "Law", 37),
      createDegree("BA (Law) (3-year)", "Law", 37),
      createDegree("BCom (Law)", "Law", 30)
    ]
  },
  {
    id: "economic-management",
    name: "Faculty of Economic and Management Sciences",
    description: "Economic and management sciences programs",
    degrees: [
      createDegree("Bachelor of Administration (BAdmin)", "Economic and Management Sciences", 30),
      createDegree("BCom", "Economic and Management Sciences", 30),
      createDegree("BCom Financial Accounting", "Economic and Management Sciences", 30),
      createDegree("BCom Information Systems", "Economic and Management Sciences", 30),
      createDegree("BCom Accounting", "Economic and Management Sciences", 30),
      createDegree("BCom (Extended)", "Economic and Management Sciences", 30),
      createDegree("BCom Accounting (Extended)", "Economic and Management Sciences", 30)
    ]
  }
];

// University of South Africa (UNISA) Programs
export const UNISA_FACULTIES: Faculty[] = [
  {
    id: "science-engineering-technology",
    name: "Faculty of Science Engineering and Technology",
    description: "Science, engineering and technology programs",
    degrees: [
      createDegree("Diploma in Chemical Engineering", "Science Engineering and Technology", 18),
      createDegree("Diploma in Civil Engineering", "Science Engineering and Technology", 18),
      createDegree("Diploma in Electrical Engineering", "Science Engineering and Technology", 18),
      createDegree("Diploma in Industrial Engineering", "Science Engineering and Technology", 18),
      createDegree("Diploma in Information Technology", "Science Engineering and Technology", 18),
      createDegree("Diploma in Mechanical Engineering", "Science Engineering and Technology", 18),
      createDegree("Diploma in Mining Engineering", "Science Engineering and Technology", 18),
      createDegree("Diploma in Pulp and Paper Technology", "Science Engineering and Technology", 18),
      createDegree("BSc Applied Mathematics and Computer Science", "Science Engineering and Technology", 20),
      createDegree("BSc Applied Mathematics and Physics", "Science Engineering and Technology", 20),
      createDegree("BSc Applied Mathematics and Statistics", "Science Engineering and Technology", 20),
      createDegree("BSc Chemistry and Applied Mathematics", "Science Engineering and Technology", 20),
      createDegree("BSc Chemistry and Computer Science", "Science Engineering and Technology", 20),
      createDegree("BSc Chemistry and Information Systems", "Science Engineering and Technology", 20),
      createDegree("BSc Chemistry and Physics", "Science Engineering and Technology", 20),
      createDegree("BSc Chemistry and Statistics", "Science Engineering and Technology", 20),
      createDegree("BSc General", "Science Engineering and Technology", 20),
      createDegree("BSc Mathematics and Applied Mathematics", "Science Engineering and Technology", 20),
      createDegree("BSc Mathematics and Chemistry", "Science Engineering and Technology", 20),
      createDegree("BSc Mathematics and Computer Science", "Science Engineering and Technology", 20),
      createDegree("BSc Mathematics and Information Science", "Science Engineering and Technology", 20),
      createDegree("BSc Mathematics and Physics", "Science Engineering and Technology", 20),
      createDegree("BSc Mathematics and Statistics", "Science Engineering and Technology", 20),
      createDegree("BSc Statistics and Physics", "Science Engineering and Technology", 20),
      createDegree("BSc Computing", "Science Engineering and Technology", 20),
      createDegree("BSc Informatics", "Science Engineering and Technology", 20)
    ]
  },
  {
    id: "accounting-sciences",
    name: "Accounting Sciences",
    description: "Accounting sciences programs",
    degrees: [
      createDegree("Higher Certificate in Accounting Sciences", "Accounting Sciences", 14),
      createDegree("Diploma in Accounting Sciences", "Accounting Sciences", 18),
      createDegree("Bachelor of Accounting Sciences in Financial Accounting", "Accounting Sciences", 21),
      createDegree("Bachelor of Accounting Sciences in Internal Auditing", "Accounting Sciences", 21),
      createDegree("Bachelor of Accounting Sciences in Management Accounting", "Accounting Sciences", 21),
      createDegree("Bachelor of Accounting Sciences in Taxation", "Accounting Sciences", 21)
    ]
  },
  {
    id: "economic-management",
    name: "Economic & Management Sciences",
    description: "Economic and management sciences programs",
    degrees: [
      createDegree("Higher Certificate in Banking", "Economic & Management Sciences", 15),
      createDegree("Higher Certificate in Economic and Management Sciences", "Economic & Management Sciences", 15),
      createDegree("Higher Certificate in Marketing", "Economic & Management Sciences", 15),
      createDegree("Higher Certificate in Retailing", "Economic & Management Sciences", 15),
      createDegree("Higher Certificate in Supervisory Management", "Economic & Management Sciences", 15),
      createDegree("Higher Certificate in Tourism Management", "Economic & Management Sciences", 15),
      createDegree("Diploma in Administrative Management", "Economic & Management Sciences", 17),
      createDegree("Diploma in Human Resource Management", "Economic & Management Sciences", 17),
      createDegree("Diploma in Marketing Management", "Economic & Management Sciences", 17),
      createDegree("Diploma in Operations Management", "Economic & Management Sciences", 17),
      createDegree("Diploma in Public Administration and Management", "Economic & Management Sciences", 17),
      createDegree("Diploma in Safety Management", "Economic & Management Sciences", 17),
      createDegree("Diploma in Small Business Management", "Economic & Management Sciences", 17),
      createDegree("Diploma in Tourism Management", "Economic & Management Sciences", 17),
      createDegree("Bachelor of Administration", "Economic & Management Sciences", 21),
      createDegree("Bachelor of Business Administration", "Economic & Management Sciences", 21),
      createDegree("Bachelor of Commerce", "Economic & Management Sciences", 21),
      createDegree("Bachelor of Commerce in Business Management", "Economic & Management Sciences", 21),
      createDegree("Bachelor of Commerce in Economics", "Economic & Management Sciences", 21),
      createDegree("Bachelor of Commerce in Financial Management", "Economic & Management Sciences", 21),
      createDegree("Bachelor of Commerce in Human Resource Management", "Economic & Management Sciences", 21),
      createDegree("Bachelor of Commerce in Marketing Management", "Economic & Management Sciences", 21)
    ]
  },
  {
    id: "education",
    name: "Education",
    description: "Education programs",
    degrees: [
      createDegree("Higher Certificate in Education Foundation Phase and Intermediate Phase", "Education", 18),
      createDegree("Higher Certificate in Education Senior Phase Maths and Science Education", "Education", 18),
      createDegree("Higher Certificate in Education Senior Phase and Further Education and Training Teaching", "Education", 18),
      createDegree("Diploma in Early Childhood Care and Education", "Education", 18),
      createDegree("Bachelor of Education in Foundation Phase Teaching", "Education", 23),
      createDegree("Bachelor of Education in Intermediate Phase Teaching", "Education", 23),
      createDegree("Bachelor of Education in Senior Phase and Further Education and Training Teaching", "Education", 23)
    ]
  },
  {
    id: "human-sciences",
    name: "Human Sciences",
    description: "Human sciences programs",
    degrees: [
      createDegree("Higher Certificate in Archives and Records Management", "Human Sciences", 15),
      createDegree("Higher Certificate in Social Auxiliary Work", "Human Sciences", 15),
      createDegree("Diploma in Public Relations", "Human Sciences", 18),
      createDegree("Bachelor of Arts African Languages and African Politics", "Human Sciences", 20),
      createDegree("Bachelor of Arts African Languages and Criminology", "Human Sciences", 20),
      createDegree("Bachelor of Arts African Languages and Economics", "Human Sciences", 20),
      createDegree("Bachelor of Arts African Languages and Psychology", "Human Sciences", 20),
      createDegree("Bachelor of Arts English Studies and Economics", "Human Sciences", 20),
      createDegree("Bachelor of Arts English Studies and Psychology", "Human Sciences", 20),
      createDegree("Bachelor of Arts History and Economics", "Human Sciences", 20),
      createDegree("Bachelor of Arts Information Science and Economics", "Human Sciences", 20),
      createDegree("Bachelor of Arts Linguistics and Psychology", "Human Sciences", 20)
    ]
  },
  {
    id: "law",
    name: "Law",
    description: "Legal studies programs",
    degrees: [
      createDegree("Higher Certificate in Criminal Justice", "Law", 17),
      createDegree("Higher Certificate in Law", "Law", 17),
      createDegree("Diploma in Corrections Management", "Law", 18),
      createDegree("Diploma in Law", "Law", 18),
      createDegree("Diploma in Policing", "Law", 18),
      createDegree("Diploma in Security Management", "Law", 18),
      createDegree("Bachelor of Arts in Criminology", "Law", 20),
      createDegree("Bachelor of Arts in Forensic Science and Technology", "Law", 20),
      createDegree("Bachelor of Arts in Police Science", "Law", 20),
      createDegree("Bachelor of Commerce in Law", "Law", 20),
      createDegree("Bachelor of Laws", "Law", 20)
    ]
  }
];

// Rhodes University (RU) Programs
export const RU_FACULTIES: Faculty[] = [
  {
    id: "commerce",
    name: "Faculty of Commerce",
    description: "Commerce programs",
    degrees: [
      createDegree("BCom Programmes", "Commerce", 40),
      createDegree("Bachelor of Business Science", "Commerce", 45)
    ]
  },
  {
    id: "education",
    name: "Faculty of Education",
    description: "Education programs",
    degrees: [
      createDegree("Bachelor of Education", "Education", 44)
    ]
  },
  {
    id: "humanities",
    name: "Faculty of Humanities",
    description: "Humanities programs",
    degrees: [
      createDegree("Bachelor of Humanities", "Humanities", 45)
    ]
  },
  {
    id: "pharmacy",
    name: "Faculty of Pharmacy",
    description: "Pharmacy programs",
    degrees: [
      createDegree("Bachelor of Pharmacy", "Pharmacy", 45)
    ]
  },
  {
    id: "science",
    name: "Faculty of Science",
    description: "Science programs",
    degrees: [
      createDegree("BSc Programmes", "Science", 45),
      createDegree("Bachelor of Science (Information Systems)", "Science", 45)
    ]
  },
  {
    id: "law",
    name: "Faculty of Law",
    description: "Legal studies programs",
    degrees: [
      createDegree("Bachelor of Law", "Law", 45)
    ]
  }
];

// University of Venda (UNIVEN) Programs
export const UNIVEN_FACULTIES: Faculty[] = [
  {
    id: "commerce",
    name: "Commerce",
    description: "Commerce programs",
    degrees: [
      createDegree("Bachelor of Administration", "Commerce", 32),
      createDegree("Bachelor of Commerce in Accounting Sciences", "Commerce", 35),
      createDegree("Bachelor of Commerce in Accounting", "Commerce", 32),
      createDegree("Bachelor of Commerce in Business Information Systems", "Commerce", 32),
      createDegree("Bachelor of Commerce in Business Management", "Commerce", 32),
      createDegree("Bachelor of Commerce in Cost and Management Accounting", "Commerce", 32),
      createDegree("Bachelor of Commerce in Economics", "Commerce", 32),
      createDegree("Bachelor of Commerce in Human Resource Management", "Commerce", 32),
      createDegree("Bachelor of Commerce in Industrial Psychology", "Commerce", 32),
      createDegree("Bachelor of Commerce in Tourism Management", "Commerce", 32),
      createDegree("Extended Bachelor of Administration", "Commerce", 28),
      createDegree("Extended Bachelor of Commerce in Accounting", "Commerce", 28),
      createDegree("Extended Bachelor of Commerce in Business Information Systems", "Commerce", 28),
      createDegree("Extended Bachelor of Commerce in Business Management", "Commerce", 28),
      createDegree("Extended Bachelor of Commerce in Economics", "Commerce", 28)
    ]
  },
  {
    id: "law",
    name: "Law",
    description: "Legal studies programs",
    degrees: [
      createDegree("Bachelor of Laws", "Law", 38),
      createDegree("Bachelor of Arts in Criminal Justice", "Law", 34)
    ]
  },
  {
    id: "health-sciences",
    name: "Health Sciences",
    description: "Health sciences programs",
    degrees: [
      createDegree("Bachelor of Nursing", "Health Sciences", 36),
      createDegree("BSc in Nutrition", "Health Sciences", 34),
      createDegree("BSc in Sports and Exercise Science", "Health Sciences", 34),
      createDegree("BSc in Recreation and Leisure Studies", "Health Sciences", 34),
      createDegree("Bachelor of Psychology", "Health Sciences", 36)
    ]
  },
  {
    id: "science-engineering-agriculture",
    name: "Science, Engineering and Agriculture",
    description: "Science, engineering and agriculture programs",
    degrees: [
      createDegree("Diploma in Freshwater Technology", "Science, Engineering and Agriculture", 24),
      createDegree("BSc in Biochemistry and Microbiology", "Science, Engineering and Agriculture", 26),
      createDegree("BSc in Biochemistry and Biology", "Science, Engineering and Agriculture", 26),
      createDegree("BSc in Microbiology and Botany", "Science, Engineering and Agriculture", 26),
      createDegree("BSc in Mathematics and Applied Math", "Science, Engineering and Agriculture", 26),
      createDegree("BSc in Mathematics and Physics", "Science, Engineering and Agriculture", 26),
      createDegree("BSc in Mathematics and Statistics", "Science, Engineering and Agriculture", 26),
      createDegree("BSc in Physics and Chemistry", "Science, Engineering and Agriculture", 26),
      createDegree("BSc in Chemistry and Mathematics", "Science, Engineering and Agriculture", 26),
      createDegree("BSc in Chemistry and Biochemistry", "Science, Engineering and Agriculture", 26),
      createDegree("BSc in Chemistry", "Science, Engineering and Agriculture", 26),
      createDegree("BSc in Botany and Zoology", "Science, Engineering and Agriculture", 26),
      createDegree("BSc in Computer Science", "Science, Engineering and Agriculture", 26),
      createDegree("BSc in Computer Science and Mathematics", "Science, Engineering and Agriculture", 26),
      createDegree("Bachelor of Environmental Sciences", "Science, Engineering and Agriculture", 32),
      createDegree("Bachelor of Earth Sciences in Mining and Environmental Geology", "Science, Engineering and Agriculture", 35),
      createDegree("Bachelor of Earth Sciences in Hydrology and Water Resources", "Science, Engineering and Agriculture", 35),
      createDegree("Bachelor of Urban and Regional Planning", "Science, Engineering and Agriculture", 35),
      createDegree("Bachelor of Environmental Sciences in Disaster Risk Reduction", "Science, Engineering and Agriculture", 35),
      createDegree("Bachelor of Science in Agriculture (Agricultural Economics)", "Science, Engineering and Agriculture", 26),
      createDegree("Bachelor of Science in Agriculture (Agribusiness Management)", "Science, Engineering and Agriculture", 26),
      createDegree("Bachelor of Science in Agriculture (Animal Science)", "Science, Engineering and Agriculture", 26),
      createDegree("Bachelor of Science in Agriculture (Horticultural Sciences)", "Science, Engineering and Agriculture", 26),
      createDegree("Bachelor of Science in Agriculture (Plant Production)", "Science, Engineering and Agriculture", 26),
      createDegree("Bachelor of Science in Soil Science", "Science, Engineering and Agriculture", 26),
      createDegree("Bachelor of Science in Forestry", "Science, Engineering and Agriculture", 26),
      createDegree("Bachelor of Science in Agricultural and Biosystems Engineering", "Science, Engineering and Agriculture", 32)
    ]
  }
];

// Sefako Makgatho Health Sciences University (SMU) Programs
export const SMU_FACULTIES: Faculty[] = [
  {
    id: "medicine",
    name: "School of Medicine",
    description: "Medicine programs",
    degrees: [
      createDegree("Diploma of Medicine (Extended)", "Medicine", 32),
      createDegree("Diploma in Emergency Medical Care", "Medicine", 18),
      createDegree("Higher Certificate in Medical Care", "Medicine", 15),
      createDegree("Bachelor of Diagnostic Radiography", "Medicine", 16)
    ]
  },
  {
    id: "dentistry",
    name: "School of Dentistry",
    description: "Dentistry programs",
    degrees: [
      createDegree("Bachelor of Dental Surgery", "Dentistry", 37),
      createDegree("Bachelor of Dental Therapy", "Dentistry", 28),
      createDegree("Bachelor of Oral Hygiene", "Dentistry", 28)
    ]
  },
  {
    id: "pharmacy",
    name: "School of Pharmacy",
    description: "Pharmacy programs",
    degrees: [
      createDegree("Bachelor of Pharmacy", "Pharmacy", 32)
    ]
  },
  {
    id: "health-care-sciences",
    name: "School of Health Care Sciences",
    description: "Health care sciences programs",
    degrees: [
      createDegree("Bachelor of Nursing and Midwifery", "Health Care Sciences", 26),
      createDegree("Bachelor of Occupational Therapy", "Health Care Sciences", 25),
      createDegree("Bachelor of Science in Physiotherapy", "Health Care Sciences", 28),
      createDegree("Bachelor of Audiology", "Health Care Sciences", 25),
      createDegree("Bachelor of Speech Language Pathology", "Health Care Sciences", 25)
    ]
  },
  {
    id: "science-technology",
    name: "School of Science and Technology",
    description: "Science and technology programs",
    degrees: [
      createDegree("General Science and Technology Programs", "Science and Technology", 20, "Science and technology programs with Level 4 requirements for maths, physics, life sciences and English")
    ]
  }
];

// Cape Peninsula University of Technology (CPUT) Programs
export const CPUT_FACULTIES: Faculty[] = [
  {
    id: "agriculture-natural",
    name: "Faculty of Agriculture & Natural Sciences",
    description: "Agriculture and natural sciences programs",
    degrees: [
      createDegree("Diploma in Agriculture", "Agriculture & Natural Sciences", 28),
      createDegree("Diploma in Agricultural Management", "Agriculture & Natural Sciences", 28),
      createDegree("Diploma in Analytical Chemistry", "Agriculture & Natural Sciences", 28),
      createDegree("Diploma in Biotechnology", "Agriculture & Natural Sciences", 28),
      createDegree("Diploma in Consumer Science: Food & Nutrition", "Agriculture & Natural Sciences", 26),
      createDegree("Diploma in Environmental Management", "Agriculture & Natural Sciences", 26)
    ]
  },
  {
    id: "health-wellness",
    name: "Faculty of Health & Wellness Sciences",
    description: "Health and wellness sciences programs",
    degrees: [
      createDegree("Bachelor of Health Sciences: Medical Laboratory Science", "Health & Wellness Sciences", 38),
      createDegree("Bachelor of Health Sciences: Medical Laboratory Science (Extended)", "Health & Wellness Sciences", 30)
    ]
  }
];

// Central University of Technology (CUT) Programs
export const CUT_FACULTIES: Faculty[] = [
  {
    id: "engineering-built-it",
    name: "Faculty of Engineering, Built Environment & Information Technology",
    description: "Engineering, built environment and IT programs",
    degrees: [
      createDegree("Diploma in Civil Engineering", "Engineering, Built Environment & Information Technology", 27),
      createDegree("Diploma in Mechanical Engineering Technology", "Engineering, Built Environment & Information Technology", 27),
      createDegree("Bachelor of Engineering Technology in Mechanical Engineering", "Engineering, Built Environment & Information Technology", 32),
      createDegree("Diploma in Information Technology", "Engineering, Built Environment & Information Technology", 27),
      createDegree("Bachelor's-level IT (BTech/Bachelor)", "Engineering, Built Environment & Information Technology", 30)
    ]
  },
  {
    id: "health-environmental",
    name: "Faculty of Health & Environmental Sciences",
    description: "Health and environmental sciences programs",
    degrees: [
      createDegree("Bachelor of Health Sciences: Medical Laboratory Sciences", "Health & Environmental Sciences", 30),
      createDegree("Diploma in Environmental Health", "Health & Environmental Sciences", 27),
      createDegree("Diploma in Dental Assisting", "Health & Environmental Sciences", 27)
    ]
  },
  {
    id: "management-humanities",
    name: "Faculty of Management Sciences & Humanities",
    description: "Management sciences and humanities programs",
    degrees: [
      createDegree("Diploma in Public Management", "Management Sciences & Humanities", 27),
      createDegree("Diploma in Marketing", "Management Sciences & Humanities", 27),
      createDegree("Diploma in Internal Auditing", "Management Sciences & Humanities", 28),
      createDegree("Diploma in Office Management & Technology", "Management Sciences & Humanities", 27),
      createDegree("Bachelor of Hospitality Management", "Management Sciences & Humanities", 30),
      createDegree("Bachelor of Accountancy", "Management Sciences & Humanities", 30),
      createDegree("Bachelor of Tourism Management", "Management Sciences & Humanities", 30)
    ]
  },
  {
    id: "education",
    name: "Faculty of Education",
    description: "Education programs",
    degrees: [
      createDegree("Bachelor of Education (Foundation Phase)", "Education", 27),
      createDegree("Bachelor of Education (SP & FET – various streams)", "Education", 27)
    ]
  }
];

// Nelson Mandela University (NMU) Programs - Note: NMU uses percentage system
export const NMU_FACULTIES: Faculty[] = [
  {
    id: "business-economic",
    name: "Faculty of Business and Economic Sciences",
    description: "Business and economic sciences programs",
    degrees: [
      createDegree("Higher Certificate Accounting", "Business and Economic Sciences", 29),
      createDegree("Higher Certificate Business Studies", "Business and Economic Sciences", 29),
      createDegree("Diploma in Accountancy", "Business and Economic Sciences", 35),
      createDegree("Diploma in Economics", "Business and Economic Sciences", 33),
      createDegree("Diploma in Human Resource Management", "Business and Economic Sciences", 33),
      createDegree("Diploma in Marketing", "Business and Economic Sciences", 33),
      createDegree("BCom General", "Business and Economic Sciences", 39),
      createDegree("BCom Accounting", "Business and Economic Sciences", 41),
      createDegree("BCom Computer Science & Information Systems", "Business and Economic Sciences", 39),
      createDegree("BCom Economics & Statistics", "Business and Economic Sciences", 39),
      createDegree("BCom Industrial Psychology & Human Resource Management", "Business and Economic Sciences", 39),
      createDegree("BCom Accounting Science", "Business and Economic Sciences", 41)
    ]
  },
  {
    id: "education",
    name: "Faculty of Education",
    description: "Education programs",
    degrees: [
      createDegree("Bachelor of Foundation Phase", "Education", 35),
      createDegree("Bachelor of Intermediate Phase", "Education", 35),
      createDegree("Bachelor of Senior Phase & Further Education & Training", "Education", 39)
    ]
  },
  {
    id: "engineering-built-technology",
    name: "Faculty of Engineering the Built Environment and Technology",
    description: "Engineering, built environment and technology programs",
    degrees: [
      createDegree("Higher Certificate Mechatronic Engineering", "Engineering the Built Environment and Technology", 33),
      createDegree("BEng Mechatronics", "Engineering the Built Environment and Technology", 41),
      createDegree("BEngTech Electrical Engineering", "Engineering the Built Environment and Technology", 37),
      createDegree("BEngTech Industrial Engineering", "Engineering the Built Environment and Technology", 37),
      createDegree("BEngTech Mechanical Engineering", "Engineering the Built Environment and Technology", 37),
      createDegree("Bachelor of Architectural Studies Architecture", "Engineering the Built Environment and Technology", 37),
      createDegree("Bachelor of Information Technology", "Engineering the Built Environment and Technology", 37)
    ]
  },
  {
    id: "health-sciences",
    name: "Faculty of Health Sciences",
    description: "Health sciences programs",
    degrees: [
      createDegree("Bachelor of Environmental Health", "Health Sciences", 39),
      createDegree("BA Psychology", "Health Sciences", 35),
      createDegree("BSW (Social Work)", "Health Sciences", 35),
      createDegree("BSc Dietetics", "Health Sciences", 39),
      createDegree("Bachelor of Human Movement Science", "Health Sciences", 35),
      createDegree("Bachelor of Biokinetics", "Health Sciences", 37),
      createDegree("Bachelor of Nursing", "Health Sciences", 37),
      createDegree("Bachelor of Medicine and Bachelor of Surgery", "Health Sciences", 43)
    ]
  },
  {
    id: "humanities",
    name: "Faculty of Humanities",
    description: "Humanities programs",
    degrees: [
      createDegree("Bachelor of Visual Arts", "Humanities", 35),
      createDegree("Bachelor of Music", "Humanities", 35),
      createDegree("BA", "Humanities", 35),
      createDegree("BA Media, Communication & Culture", "Humanities", 35),
      createDegree("BA Politics & Economics", "Humanities", 35),
      createDegree("BAdmin Public Administration", "Humanities", 35)
    ]
  },
  {
    id: "law",
    name: "Faculty of Law",
    description: "Legal studies programs",
    degrees: [
      createDegree("Higher Certificate Law Enforcement", "Law", 31),
      createDegree("Diploma Law Enforcement", "Law", 33),
      createDegree("BA Law", "Law", 39),
      createDegree("BCom Law", "Law", 39),
      createDegree("LLB Law", "Law", 39)
    ]
  },
  {
    id: "science",
    name: "Faculty of Science",
    description: "Science programs",
    degrees: [
      createDegree("Diploma Agricultural Management", "Science", 33),
      createDegree("Diploma Analytical Chemistry", "Science", 35),
      createDegree("BSc Biological Sciences", "Science", 41),
      createDegree("BSc Environmental Sciences", "Science", 41),
      createDegree("BSc Computer Sciences", "Science", 41),
      createDegree("BSc Physical Science & Mathematics", "Science", 41)
    ]
  }
];

// This will be defined at the end of the file after all faculty declarations

// University of Cape Town (UCT) - Using FPS system, converting to approximate APS
export const UCT_FACULTIES: Faculty[] = [
  {
    id: "commerce",
    name: "Faculty of Commerce",
    description: "Commerce and business programs",
    degrees: [
      createDegree("Bachelor of Business Science (Actuarial Science)", "Commerce", 45),
      createDegree("Bachelor of Business Science (Computer Science)", "Commerce", 42),
      createDegree("Bachelor of Business Science (Finance, Economics, Marketing, Analytics)", "Commerce", 40),
      createDegree("Bachelor of Commerce (Accounting, General, Law, PPE)", "Commerce", 36)
    ]
  },
  {
    id: "engineering-built",
    name: "Faculty of Engineering & the Built Environment",
    description: "Engineering and built environment programs",
    degrees: [
      createDegree("Bachelor of Science in Engineering (Mechanical, Civil, Electrical, Mechatronics, Chemical, Electro-Mechanical, Mining)", "Engineering & the Built Environment", 45),
      createDegree("Bachelor of Science in Geomatics", "Engineering & the Built Environment", 40),
      createDegree("Bachelor of Science in Property Studies", "Engineering & the Built Environment", 38),
      createDegree("Bachelor of Architectural Studies", "Engineering & the Built Environment", 37)
    ]
  },
  {
    id: "health-sciences",
    name: "Faculty of Health Sciences",
    description: "Health sciences programs",
    degrees: [
      createDegree("Bachelor of Medicine and Bachelor of Surgery (MBChB)", "Health Sciences", 48),
      createDegree("Bachelor of Science in Physiotherapy", "Health Sciences", 45),
      createDegree("Bachelor of Science in Occupational Therapy", "Health Sciences", 43),
      createDegree("Bachelor of Science in Audiology", "Health Sciences", 42),
      createDegree("Bachelor of Science in Speech-Language Pathology", "Health Sciences", 42)
    ]
  },
  {
    id: "humanities",
    name: "Faculty of Humanities",
    description: "Humanities programs",
    degrees: [
      createDegree("Bachelor of Arts (General)", "Humanities", 36),
      createDegree("Bachelor of Arts in Fine Art", "Humanities", 36),
      createDegree("Bachelor of Social Science", "Humanities", 36),
      createDegree("Bachelor of Music", "Humanities", 36),
      createDegree("Bachelor of Arts in Theatre and Performance", "Humanities", 36),
      createDegree("Bachelor of Social Work", "Humanities", 36)
    ]
  },
  {
    id: "law",
    name: "Faculty of Law",
    description: "Legal studies programs",
    degrees: [
      createDegree("Bachelor of Laws (LLB)", "Law", 37),
      createDegree("Bachelor of Arts with Law", "Law", 36),
      createDegree("Bachelor of Social Science with Law", "Law", 36)
    ]
  },
  {
    id: "science",
    name: "Faculty of Science",
    description: "Science programs",
    degrees: [
      createDegree("Bachelor of Science in Actuarial Science", "Science", 46),
      createDegree("Bachelor of Science in Computer Science", "Science", 42),
      createDegree("Bachelor of Science (General Sciences)", "Science", 40),
      createDegree("Bachelor of Science in Applied Biology, Chemistry, Environmental & Geographical Science, Ocean & Atmosphere Science, Physics, Mathematics, Statistics", "Science", 40)
    ]
  }
];

// University of the Witwatersrand (Wits) - Using composite system
export const WITS_FACULTIES: Faculty[] = [
  {
    id: "commerce-law-management",
    name: "Faculty of Commerce, Law and Management",
    description: "Commerce, law and management programs",
    degrees: [
      createDegree("Bachelor of Commerce (General)", "Commerce, Law and Management", 38),
      createDegree("Bachelor of Commerce (Information Systems)", "Commerce, Law and Management", 38),
      createDegree("Bachelor of Commerce (Politics, Philosophy and Economics)", "Commerce, Law and Management", 38),
      createDegree("Accounting Science", "Commerce, Law and Management", 44),
      createDegree("Accounting", "Commerce, Law and Management", 34),
      createDegree("Economic Science", "Commerce, Law and Management", 42),
      createDegree("Bachelor of Commerce (Law)", "Commerce, Law and Management", 43),
      createDegree("LLB (four year stream)", "Commerce, Law and Management", 46)
    ]
  },
  {
    id: "engineering-built",
    name: "Faculty of Engineering and the Built Environment",
    description: "Engineering and built environment programs",
    degrees: [
      createDegree("Chemical Engineering", "Engineering and the Built Environment", 42),
      createDegree("Metallurgy and Materials Engineering", "Engineering and the Built Environment", 42),
      createDegree("Civil Engineering", "Engineering and the Built Environment", 42),
      createDegree("Electrical Engineering", "Engineering and the Built Environment", 42),
      createDegree("Biomedical Engineering", "Engineering and the Built Environment", 42),
      createDegree("Digital Arts", "Engineering and the Built Environment", 42),
      createDegree("Aeronautical Engineering", "Engineering and the Built Environment", 42),
      createDegree("Industrial Engineering", "Engineering and the Built Environment", 42),
      createDegree("Mechanical Engineering", "Engineering and the Built Environment", 42),
      createDegree("Mining Engineering", "Engineering and the Built Environment", 42),
      createDegree("Architectural Studies", "Engineering and the Built Environment", 34),
      createDegree("Urban and Regional Planning", "Engineering and the Built Environment", 36),
      createDegree("Construction Studies", "Engineering and the Built Environment", 36),
      createDegree("Property Studies", "Engineering and the Built Environment", 36)
    ]
  },
  {
    id: "humanities",
    name: "Faculty of Humanities",
    description: "Humanities programs",
    degrees: [
      createDegree("Arts (BA)", "Humanities", 36),
      createDegree("Arts (Law)", "Humanities", 43),
      createDegree("Arts in Digital Arts", "Humanities", 36),
      createDegree("Arts in Theatre Performance", "Humanities", 34),
      createDegree("Arts in Film and Television", "Humanities", 34),
      createDegree("Arts in Fine Arts", "Humanities", 34),
      createDegree("Music", "Humanities", 34),
      createDegree("Speech Language Pathology", "Humanities", 34),
      createDegree("Audiology", "Humanities", 34),
      createDegree("Social Work", "Humanities", 34)
    ]
  },
  {
    id: "education",
    name: "Faculty of Education",
    description: "Education programs",
    degrees: [
      createDegree("Foundation Phase Teaching", "Education", 37),
      createDegree("Intermediate Phase Teaching", "Education", 37),
      createDegree("Senior Phase and Further and Training Teaching", "Education", 37)
    ]
  },
  {
    id: "science",
    name: "Faculty of Science",
    description: "Science programs",
    degrees: [
      createDegree("Science (BSc) General", "Science", 42),
      createDegree("Biological Sciences", "Science", 43),
      createDegree("Geographical and Archaeological", "Science", 42),
      createDegree("Geospatial Sciences", "Science", 42),
      createDegree("Environmental Studies", "Science", 42),
      createDegree("Geological Sciences", "Science", 42),
      createDegree("Actuarial Sciences", "Science", 42),
      createDegree("Computational and Applied Mathematics", "Science", 44),
      createDegree("Computer Sciences", "Science", 42),
      createDegree("Mathematical Sciences", "Science", 42),
      createDegree("Physical Sciences (Chemistry/Physics)", "Science", 42),
      createDegree("Chemistry with Chemical Engineering", "Science", 43),
      createDegree("Materials Sciences", "Science", 43),
      createDegree("Astronomy and Astrophysics", "Science", 43)
    ]
  }
];

// University of Pretoria (UP) Programs
export const UP_FACULTIES: Faculty[] = [
  {
    id: "economic-management",
    name: "Faculty of Economic and Management Sciences",
    description: "Economic and management programs",
    degrees: [
      createDegree("Bachelor of Commerce (General)", "Economic and Management Sciences", 30),
      createDegree("Bachelor of Commerce in Accounting Sciences", "Economic and Management Sciences", 34),
      createDegree("Bachelor of Commerce in Financial Sciences", "Economic and Management Sciences", 32),
      createDegree("Bachelor of Commerce in Financial Investment Management", "Economic and Management Sciences", 32),
      createDegree("Bachelor of Commerce in Law", "Economic and Management Sciences", 32),
      createDegree("Bachelor of Commerce in Economics", "Economic and Management Sciences", 32),
      createDegree("Bachelor of Commerce in Information Systems", "Economic and Management Sciences", 32),
      createDegree("Bachelor of Commerce in Marketing Management", "Economic and Management Sciences", 30),
      createDegree("Bachelor of Commerce in Human Resource Management", "Economic and Management Sciences", 30),
      createDegree("Bachelor of Business Administration", "Economic and Management Sciences", 30),
      createDegree("Bachelor of Administration in Public Administration", "Economic and Management Sciences", 28),
      createDegree("Bachelor of Statistics and Data Science", "Economic and Management Sciences", 32),
      createDegree("Bachelor of Agribusiness Management", "Economic and Management Sciences", 30),
      createDegree("Bachelor of Business Management", "Economic and Management Sciences", 30),
      createDegree("Bachelor of Supply Chain Management", "Economic and Management Sciences", 30),
      createDegree("Bachelor of Commerce (Extended)", "Economic and Management Sciences", 26)
    ]
  },
  {
    id: "education",
    name: "Faculty of Education",
    description: "Education programs",
    degrees: [
      createDegree("Bachelor of Education in Foundation Phase Teaching", "Education", 28),
      createDegree("Bachelor of Education in Intermediate Phase Teaching", "Education", 28),
      createDegree("Bachelor of Education in Senior Phase and FET Teaching", "Education", 28),
      createDegree("Higher Certificate in Sport Sciences", "Education", 20)
    ]
  },
  {
    id: "engineering-built-it",
    name: "Faculty of Engineering, Built Environment and Information Technology",
    description: "Engineering, built environment and IT programs",
    degrees: [
      createDegree("Bachelor of Engineering in Civil Engineering", "Engineering, Built Environment and Information Technology", 35),
      createDegree("Bachelor of Engineering in Chemical Engineering", "Engineering, Built Environment and Information Technology", 35),
      createDegree("Bachelor of Engineering in Electrical Engineering", "Engineering, Built Environment and Information Technology", 35),
      createDegree("Bachelor of Engineering in Electronic Engineering", "Engineering, Built Environment and Information Technology", 35),
      createDegree("Bachelor of Engineering in Industrial Engineering", "Engineering, Built Environment and Information Technology", 35),
      createDegree("Bachelor of Engineering in Mechanical Engineering", "Engineering, Built Environment and Information Technology", 35),
      createDegree("Bachelor of Engineering in Mining Engineering", "Engineering, Built Environment and Information Technology", 35),
      createDegree("Bachelor of Town and Regional Planning", "Engineering, Built Environment and Information Technology", 30),
      createDegree("Bachelor of Science in Construction Management", "Engineering, Built Environment and Information Technology", 30),
      createDegree("Bachelor of Science in Quantity Surveying", "Engineering, Built Environment and Information Technology", 30),
      createDegree("Bachelor of Science in Real Estate", "Engineering, Built Environment and Information Technology", 30),
      createDegree("Bachelor of Information Technology", "Engineering, Built Environment and Information Technology", 34),
      createDegree("Bachelor of Science in Computer Engineering", "Engineering, Built Environment and Information Technology", 35),
      createDegree("Bachelor of Metallurgical Engineering", "Engineering, Built Environment and Information Technology", 35),
      createDegree("Bachelor of Commerce Specialising in Information Systems", "Engineering, Built Environment and Information Technology", 30),
      createDegree("Bachelor of Information Science", "Engineering, Built Environment and Information Technology", 28),
      createDegree("Bachelor of Information Science in Publishing", "Engineering, Built Environment and Information Technology", 28),
      createDegree("Bachelor of Information Science Specialising in Multimedia", "Engineering, Built Environment and Information Technology", 30),
      createDegree("Bachelor of Information Systems", "Engineering, Built Environment and Information Technology", 30),
      createDegree("Bachelor of Science in Computer Science", "Engineering, Built Environment and Information Technology", 30),
      createDegree("Bachelor of Information and Knowledge Systems", "Engineering, Built Environment and Information Technology", 30)
    ]
  }
];

// University of Johannesburg (UJ) Programs
export const UJ_FACULTIES: Faculty[] = [
  {
    id: "business-economic",
    name: "Faculty of Business and Economic Sciences",
    description: "Business and economic sciences programs",
    degrees: [
      createDegree("Higher Certificate in Business Studies", "Business and Economic Sciences", 22),
      createDegree("Diploma in Accountancy", "Business and Economic Sciences", 22),
      createDegree("Diploma in Economics", "Business and Economic Sciences", 26),
      createDegree("Diploma in Human Resource Management", "Business and Economic Sciences", 26),
      createDegree("Diploma in Logistics", "Business and Economic Sciences", 24),
      createDegree("Diploma in Business Management", "Business and Economic Sciences", 26),
      createDegree("Diploma in Marketing", "Business and Economic Sciences", 22),
      createDegree("Diploma in Retail Business Management", "Business and Economic Sciences", 22),
      createDegree("Diploma in Tourism Management", "Business and Economic Sciences", 22),
      createDegree("Bachelor of Commerce in Accounting for Chartered Accountants", "Business and Economic Sciences", 33),
      createDegree("Bachelor of Commerce in Accounting", "Business and Economic Sciences", 28),
      createDegree("Bachelor of Commerce in Business Management", "Business and Economic Sciences", 26),
      createDegree("Bachelor of Commerce in Economics and Statistics", "Business and Economic Sciences", 30),
      createDegree("Bachelor of Commerce in Finance", "Business and Economic Sciences", 28),
      createDegree("Bachelor of Commerce in Human Resource Management", "Business and Economic Sciences", 28),
      createDegree("Bachelor of Commerce in Industrial Psychology", "Business and Economic Sciences", 26),
      createDegree("Bachelor of Commerce in Logistics and Transport Economics", "Business and Economic Sciences", 30),
      createDegree("Bachelor of Commerce in Marketing Management", "Business and Economic Sciences", 26),
      createDegree("Bachelor of Commerce in Tourism & Development Management", "Business and Economic Sciences", 26),
      createDegree("Bachelor of Business Science", "Business and Economic Sciences", 38),
      createDegree("Bachelor in Hospitality Management", "Business and Economic Sciences", 26),
      createDegree("Bachelor in Public Management and Governance", "Business and Economic Sciences", 26),
      createDegree("Bachelor in Entrepreneurial Management", "Business and Economic Sciences", 26)
    ]
  },
  {
    id: "education",
    name: "Faculty of Education",
    description: "Education programs",
    degrees: [
      createDegree("Bachelor of Education in Foundation Phase Teaching", "Education", 26),
      createDegree("Bachelor of Education in Intermediate Phase Teaching", "Education", 26),
      createDegree("Bachelor of Education in Senior and FET Phase Teaching", "Education", 26)
    ]
  },
  {
    id: "engineering-built",
    name: "Faculty of Engineering, the Built Environment and Technology",
    description: "Engineering and technology programs",
    degrees: [
      createDegree("Higher Certificate in Mechatronic Engineering", "Engineering, the Built Environment and Technology", 22),
      createDegree("Diploma in Building", "Engineering, the Built Environment and Technology", 26),
      createDegree("Diploma in Civil Engineering", "Engineering, the Built Environment and Technology", 26),
      createDegree("Diploma in Electrical Engineering", "Engineering, the Built Environment and Technology", 26),
      createDegree("Diploma in Industrial Engineering", "Engineering, the Built Environment and Technology", 26),
      createDegree("Diploma in Mechanical Engineering", "Engineering, the Built Environment and Technology", 26),
      createDegree("Bachelor of Engineering in Civil Engineering", "Engineering, the Built Environment and Technology", 32),
      createDegree("Bachelor of Engineering in Electrical Engineering", "Engineering, the Built Environment and Technology", 32),
      createDegree("Bachelor of Engineering in Industrial Engineering", "Engineering, the Built Environment and Technology", 38),
      createDegree("Bachelor of Engineering in Mechanical Engineering", "Engineering, the Built Environment and Technology", 32),
      createDegree("Bachelor of Chemical Engineering", "Engineering, the Built Environment and Technology", 30),
      createDegree("Bachelor of Extraction Metallurgy", "Engineering, the Built Environment and Technology", 30),
      createDegree("Bachelor of Mining Engineering", "Engineering, the Built Environment and Technology", 23),
      createDegree("Bachelor of Engineering in Mechatronics", "Engineering, the Built Environment and Technology", 38),
      createDegree("Bachelor of Urban and Regional Planning", "Engineering, the Built Environment and Technology", 30),
      createDegree("Bachelor of Construction Studies", "Engineering, the Built Environment and Technology", 30)
    ]
  },
  {
    id: "health-sciences",
    name: "Faculty of Health Sciences",
    description: "Health sciences programs",
    degrees: [
      createDegree("Bachelor of Medicine and Bachelor of Surgery (MBChB)", "Health Sciences", 47),
      createDegree("Bachelor of Radiography in Diagnostics", "Health Sciences", 31),
      createDegree("Bachelor of Emergency Medical Care", "Health Sciences", 26),
      createDegree("Bachelor of Science in Dietetics", "Health Sciences", 34),
      createDegree("Bachelor of Science in Environmental Health", "Health Sciences", 24),
      createDegree("Bachelor of Science in Medical Laboratory Sciences", "Health Sciences", 30),
      createDegree("Bachelor of Science in Occupational Therapy", "Health Sciences", 34),
      createDegree("Bachelor of Science in Physiotherapy", "Health Sciences", 34),
      createDegree("Bachelor of Nursing", "Health Sciences", 30),
      createDegree("Bachelor of Biokinetics", "Health Sciences", 31),
      createDegree("Bachelor of Chiropractic", "Health Sciences", 26),
      createDegree("Bachelor of Optometry", "Health Sciences", 31),
      createDegree("Bachelor of Sport and Exercise Science", "Health Sciences", 27)
    ]
  },
  {
    id: "humanities",
    name: "Faculty of Humanities",
    description: "Humanities programs",
    degrees: [
      createDegree("Bachelor of Arts (General)", "Humanities", 27),
      createDegree("BA Social Work", "Humanities", 31),
      createDegree("BA Linguistics", "Humanities", 27),
      createDegree("BA Strategic Communication", "Humanities", 27),
      createDegree("BA Politics, Economics and Technology", "Humanities", 27),
      createDegree("BA Community Development Leadership", "Humanities", 27)
    ]
  },
  {
    id: "law",
    name: "Faculty of Law",
    description: "Legal studies programs",
    degrees: [
      createDegree("Bachelor of Laws (LLB)", "Law", 31),
      createDegree("Bachelor of Arts in Law", "Law", 31),
      createDegree("Bachelor of Commerce in Law", "Law", 31)
    ]
  },
  {
    id: "science",
    name: "Faculty of Science",
    description: "Science programs",
    degrees: [
      createDegree("Higher Certificate in Information Technology in User Support Services", "Science", 22),
      createDegree("Diploma in Information Technology in Software Development", "Science", 26),
      createDegree("Bachelor of Science (with Computer Science and Information Systems)", "Science", 30),
      createDegree("Bachelor of Science (with Biochemistry, Chemistry and Microbiology)", "Science", 30),
      createDegree("Bachelor of Science (with Biological Sciences)", "Science", 30),
      createDegree("Bachelor of Science (with Environmental Sciences)", "Science", 30),
      createDegree("Bachelor of Science (with Geosciences)", "Science", 30),
      createDegree("Bachelor of Science (with Mathematics and Statistics)", "Science", 30),
      createDegree("Bachelor of Science (with Physics and Electronics)", "Science", 30),
      createDegree("Bachelor of Science (with Life Sciences)", "Science", 30),
      createDegree("Bachelor of Science (with Agricultural Sciences)", "Science", 30),
      createDegree("Bachelor of Information Technology", "Science", 30),
      createDegree("Bachelor of Computer Science and Informatics specialising in AI", "Science", 30)
    ]
  }
];

// University of KwaZulu-Natal (UKZN) Programs
export const UKZN_FACULTIES: Faculty[] = [
  {
    id: "agriculture-engineering-science",
    name: "College of Agriculture, Engineering and Science",
    description: "Agriculture, engineering and science programs",
    degrees: [
      createDegree("Bachelor of Science in Agriculture (Agricultural Economics, Agronomy, Animal and Poultry Science, Plant Pathology, Soil Science)", "Agriculture, Engineering and Science", 28),
      createDegree("Bachelor of Science in Dietetics", "Agriculture, Engineering and Science", 33),
      createDegree("Bachelor of Science in Environmental Earth Science", "Agriculture, Engineering and Science", 28),
      createDegree("Bachelor of Science in Geological Sciences", "Agriculture, Engineering and Science", 28),
      createDegree("Bachelor of Science in Industrial and Applied Biotechnology", "Agriculture, Engineering and Science", 30),
      createDegree("Bachelor of Science in Life and Earth Sciences", "Agriculture, Engineering and Science", 28),
      createDegree("Bachelor of Science in Marine Biology", "Agriculture, Engineering and Science", 30),
      createDegree("Bachelor of Science in Mathematics, Statistics and Computer Science", "Agriculture, Engineering and Science", 30),
      createDegree("Bachelor of Science in Physics and Chemistry", "Agriculture, Engineering and Science", 30),
      createDegree("Bachelor of Science in Applied Chemistry", "Agriculture, Engineering and Science", 30),
      createDegree("Bachelor of Science in Biological Sciences", "Agriculture, Engineering and Science", 30),
      createDegree("Bachelor of Science in Crop and Horticultural Sciences", "Agriculture, Engineering and Science", 28),
      createDegree("Bachelor of Science in Computer Science and IT", "Agriculture, Engineering and Science", 30),
      createDegree("Bachelor of Science in Engineering (Agricultural, Chemical, Civil, Computer, Electrical, Electronic, Mechanical)", "Agriculture, Engineering and Science", 33),
      createDegree("Diploma in Music Performance", "Agriculture, Engineering and Science", 28)
    ]
  },
  {
    id: "health-sciences",
    name: "College of Health Sciences",
    description: "Health sciences programs",
    degrees: [
      createDegree("Bachelor of Medicine and Bachelor of Surgery (MBChB)", "Health Sciences", 48),
      createDegree("Bachelor of Dental Therapy", "Health Sciences", 33),
      createDegree("Bachelor of Medical Science in Physiology", "Health Sciences", 33),
      createDegree("Bachelor of Medical Science in Anatomy", "Health Sciences", 33),
      createDegree("Bachelor of Nursing", "Health Sciences", 30),
      createDegree("Bachelor of Occupational Therapy", "Health Sciences", 36),
      createDegree("Bachelor of Optometry", "Health Sciences", 36),
      createDegree("Bachelor of Pharmacy", "Health Sciences", 36),
      createDegree("Bachelor of Physiotherapy", "Health Sciences", 36),
      createDegree("Bachelor of Speech Language Therapy", "Health Sciences", 36)
    ]
  },
  {
    id: "humanities",
    name: "College of Humanities",
    description: "Humanities programs",
    degrees: [
      createDegree("Bachelor of Arts (General)", "Humanities", 28),
      createDegree("Bachelor of Arts in Cultural and Heritage Tourism", "Humanities", 30),
      createDegree("Bachelor of Arts in Criminology and Forensic Studies", "Humanities", 30),
      createDegree("Bachelor of Arts in Philosophy, Politics and Law", "Humanities", 30),
      createDegree("Bachelor of Arts in Visual Art", "Humanities", 30),
      createDegree("Bachelor of Arts in Music", "Humanities", 30),
      createDegree("Bachelor of Education (Foundation Phase, Intermediate Phase, Senior and FET Phase)", "Humanities", 30),
      createDegree("Bachelor of Social Science (General)", "Humanities", 30),
      createDegree("Bachelor of Social Science in Criminology and Forensic Studies", "Humanities", 30),
      createDegree("Bachelor of Social Work", "Humanities", 30),
      createDegree("Bachelor of Theology", "Humanities", 28),
      createDegree("Higher Certificate in Music", "Humanities", 25)
    ]
  },
  {
    id: "law-management",
    name: "College of Law and Management Studies",
    description: "Law and management programs",
    degrees: [
      createDegree("Bachelor of Business Administration", "Law and Management Studies", 32),
      createDegree("Bachelor of Commerce (Accounting, Economics, Finance, Information Systems, Marketing, Supply Chain, Human Resources)", "Law and Management Studies", 32),
      createDegree("Bachelor of Commerce in Accounting (Chartered Accountancy stream)", "Law and Management Studies", 38),
      createDegree("Bachelor of Laws (LLB)", "Law and Management Studies", 32),
      createDegree("Higher Certificate in Business Administration", "Law and Management Studies", 28)
    ]
  }
];

// University data mapping for easy replacement - defined after all faculty declarations
export const NEW_UNIVERSITY_PROGRAMS: Record<string, Faculty[]> = {
  "ul": UL_FACULTIES,
  "nwu": NWU_FACULTIES,
  "wsu": WSU_FACULTIES,
  "unizulu": UNIZULU_FACULTIES,
  "spu": SPU_FACULTIES,
  "ump": UMP_FACULTIES,
  "uct": UCT_FACULTIES,
  "wits": WITS_FACULTIES,
  "up": UP_FACULTIES,
  "uj": UJ_FACULTIES,
  "ukzn": UKZN_FACULTIES,
  "stellenbosch": STELLENBOSCH_FACULTIES,
  "ufs": UFS_FACULTIES,
  "ufh": UFH_FACULTIES,
  "tut": TUT_FACULTIES,
  "dut": DUT_FACULTIES,
  "vut": VUT_FACULTIES,
  "mut": MUT_FACULTIES,
  "uwc": UWC_FACULTIES,
  "unisa": UNISA_FACULTIES,
  "ru": RU_FACULTIES,
  "univen": UNIVEN_FACULTIES,
  "smu": SMU_FACULTIES,
  "cput": CPUT_FACULTIES,
  "cut": CUT_FACULTIES,
  "nmu": NMU_FACULTIES
};

// Export all faculty data
export const ALL_NEW_FACULTIES = {
  UL_FACULTIES,
  NWU_FACULTIES,
  WSU_FACULTIES,
  UNIZULU_FACULTIES,
  SPU_FACULTIES,
  UMP_FACULTIES,
  UCT_FACULTIES,
  WITS_FACULTIES,
  UP_FACULTIES,
  UJ_FACULTIES,
  UKZN_FACULTIES,
  STELLENBOSCH_FACULTIES,
  UFS_FACULTIES,
  UFH_FACULTIES,
  TUT_FACULTIES,
  DUT_FACULTIES,
  VUT_FACULTIES,
  MUT_FACULTIES,
  UWC_FACULTIES,
  UNISA_FACULTIES,
  RU_FACULTIES,
  UNIVEN_FACULTIES,
  SMU_FACULTIES,
  CPUT_FACULTIES,
  CUT_FACULTIES,
  NMU_FACULTIES
};

export interface UniversityApplicationInfo {
  id: string;
  name: string;
  abbreviation: string;
  openingDate: string;
  closingDate: string;
  closingDateNotes?: string;
  applicationFee: string;
  feeNotes?: string;
  specialNotes?: string;
  isFree: boolean;
  logo?: string;
  type: string;
}

export const UNIVERSITY_APPLICATIONS_2025: UniversityApplicationInfo[] = [
  {
    id: "uct",
    name: "University of Cape Town",
    abbreviation: "UCT",
    openingDate: "2 April 2025",
    closingDate: "31 July 2025",
    applicationFee: "R100 (SADC), R300 (non-SADC)",
    feeNotes: "SADC applicants pay R100, non-SADC applicants pay R300",
    isFree: false,
    type: "Traditional University",
    logo: "https://cdn.builder.io/api/v1/assets/aa876bee812e456d8594f765f547fed4/uct-f42185?format=webp&width=800",
  },
  {
    id: "uwc",
    name: "University of the Western Cape",
    abbreviation: "UWC",
    openingDate: "2 April 2025",
    closingDate: "30 Aug (Dentistry), 30 Sept (other)",
    closingDateNotes:
      "Dentistry closes 30 August, other programmes close 30 September",
    applicationFee: "Free online",
    specialNotes: "Free for online applications",
    isFree: true,
    type: "Traditional University",
  },
  {
    id: "stellenbosch",
    name: "Stellenbosch University",
    abbreviation: "SU",
    openingDate: "1 April 2025",
    closingDate: "31 July 2025",
    applicationFee: "R100",
    isFree: false,
    type: "Traditional University",
  },
  {
    id: "uj",
    name: "University of Johannesburg",
    abbreviation: "UJ",
    openingDate: "1 April 2025",
    closingDate: "1 October 2025",
    applicationFee: "Free online, R200 manual",
    feeNotes: "Free for online applications, R200 for manual applications",
    specialNotes: "Free online applications available",
    isFree: true,
    type: "Traditional University",
  },
  {
    id: "up",
    name: "University of Pretoria",
    abbreviation: "UP",
    openingDate: "1-2 April 2025",
    closingDate: "31 May (Vet Science), 30 June (other)",
    closingDateNotes:
      "Veterinary Science closes 31 May, other programmes close 30 June",
    applicationFee: "R300 (waived if household < R150k)",
    feeNotes:
      "R300 application fee, waived for households earning less than R150,000",
    specialNotes: "Fee waiver available for low-income households",
    isFree: false,
    type: "Traditional University",
  },
  {
    id: "wits",
    name: "University of the Witwatersrand",
    abbreviation: "WITS",
    openingDate: "1 March - April 2025",
    closingDate: "30 September 2025",
    applicationFee: "R100",
    isFree: false,
    type: "Traditional University",
  },
  {
    id: "ukzn",
    name: "University of KwaZulu-Natal",
    abbreviation: "UKZN",
    openingDate: "1 April 2025",
    closingDate: "30 June (Medicine), 30 Sept (others)",
    closingDateNotes:
      "Medicine closes 30 June, other programmes close 30 September",
    applicationFee: "R250 SA, R420 late SA, R490 international",
    feeNotes:
      "R250 for SA applicants, R420 for late SA applications, R490 for international",
    isFree: false,
    type: "Traditional University",
  },
  {
    id: "ul",
    name: "University of Limpopo",
    abbreviation: "UL",
    openingDate: "March/April 2025",
    closingDate: "30 September 2025",
    applicationFee: "R200 SA, R750 international",
    feeNotes:
      "R200 for South African applicants, R750 for international applicants",
    isFree: false,
    type: "Traditional University",
  },
  {
    id: "ufh",
    name: "University of Fort Hare",
    abbreviation: "UFH",
    openingDate: "1 March 2025",
    closingDate: "30 September 2025",
    applicationFee: "Free online, R120 manual SA, R500 manual international",
    feeNotes:
      "Free online, R120 manual for SA applicants, R500 manual for international",
    specialNotes: "Free online applications available",
    isFree: true,
    type: "Traditional University",
  },
  {
    id: "unisa",
    name: "University of South Africa",
    abbreviation: "UNISA",
    openingDate: "1 September 2025",
    closingDate: "1 January 2026",
    applicationFee: "R135",
    isFree: false,
    type: "Traditional University",
  },
  {
    id: "nwu",
    name: "North-West University",
    abbreviation: "NWU",
    openingDate: "1 April 2025",
    closingDate: "31 August 2025",
    applicationFee: "Free",
    specialNotes: "No application fee",
    isFree: true,
    type: "Traditional University",
  },
  {
    id: "ufs",
    name: "University of the Free State",
    abbreviation: "UFS",
    openingDate: "1 April 2025",
    closingDate: "30 September 2025",
    applicationFee: "Free",
    specialNotes: "No application fee",
    isFree: true,
    type: "Traditional University",
  },
  {
    id: "nmu",
    name: "Nelson Mandela University",
    abbreviation: "NMU",
    openingDate: "1 April 2025",
    closingDate: "30 June (Health), 30 Sept (others)",
    closingDateNotes:
      "Health Sciences close 30 June, other programmes close 30 September",
    applicationFee: "Free SA",
    specialNotes: "Free for South African applicants",
    isFree: true,
    type: "Comprehensive University",
  },
  {
    id: "cput",
    name: "Cape Peninsula University of Technology",
    abbreviation: "CPUT",
    openingDate: "May 2025",
    closingDate: "September 2025",
    applicationFee: "Free online, R100 manual",
    feeNotes: "Free for online applications, R100 for manual applications",
    specialNotes: "Free online applications available",
    isFree: true,
    type: "University of Technology",
  },
  {
    id: "cut",
    name: "Central University of Technology",
    abbreviation: "CUT",
    openingDate: "1 April 2025",
    closingDate: "30 September 2025",
    applicationFee: "Free online, R250 manual",
    feeNotes: "Free for online applications, R250 for manual applications",
    specialNotes: "Free online applications available",
    isFree: true,
    type: "University of Technology",
  },
  {
    id: "dut",
    name: "Durban University of Technology",
    abbreviation: "DUT",
    openingDate: "1 April 2025",
    closingDate: "30 September 2025",
    applicationFee: "R250",
    isFree: false,
    type: "University of Technology",
  },
  {
    id: "mut",
    name: "Mangosuthu University of Technology",
    abbreviation: "MUT",
    openingDate: "1 April 2025",
    closingDate: "30 September 2025",
    applicationFee: "R250",
    isFree: false,
    type: "University of Technology",
  },
  {
    id: "tut",
    name: "Tshwane University of Technology",
    abbreviation: "TUT",
    openingDate: "1 April 2025",
    closingDate: "30 September 2025",
    applicationFee: "R240",
    isFree: false,
    type: "University of Technology",
  },
  {
    id: "vut",
    name: "Vaal University of Technology",
    abbreviation: "VUT",
    openingDate: "1 April 2025",
    closingDate: "30 September 2025",
    applicationFee: "R100",
    isFree: false,
    type: "University of Technology",
  },
  {
    id: "wsu",
    name: "Walter Sisulu University",
    abbreviation: "WSU",
    openingDate: "1 April 2025",
    closingDate: "31 October 2025",
    applicationFee: "Free",
    specialNotes: "No application fee",
    isFree: true,
    type: "Comprehensive University",
  },
  {
    id: "univen",
    name: "University of Venda",
    abbreviation: "UNIVEN",
    openingDate: "May 2025",
    closingDate: "Sept/Oct 2025",
    closingDateNotes: "Closes September to October depending on programme",
    applicationFee: "R100",
    isFree: false,
    type: "Traditional University",
  },
  {
    id: "ru",
    name: "Rhodes University",
    abbreviation: "RU",
    openingDate: "1 April 2025",
    closingDate: "30 September 2025",
    applicationFee: "R100",
    isFree: false,
    type: "Traditional University",
  },
  {
    id: "smu",
    name: "Sefako Makgatho Health Sciences University",
    abbreviation: "SMU",
    openingDate: "2 April 2025",
    closingDate: "31 July 2025",
    applicationFee: "R300",
    isFree: false,
    type: "Traditional University",
  },
  {
    id: "spu",
    name: "Sol Plaatje University",
    abbreviation: "SPU",
    openingDate: "April/May 2025",
    closingDate: "November 2025",
    applicationFee: "R100",
    isFree: false,
    type: "Traditional University",
  },
  {
    id: "ump",
    name: "University of Mpumalanga",
    abbreviation: "UMP",
    openingDate: "1 June 2025",
    closingDate: "30 November 2025",
    applicationFee: "R150",
    isFree: false,
    type: "Comprehensive University",
  },
  {
    id: "unizulu",
    name: "University of Zululand",
    abbreviation: "UNIZULU",
    openingDate: "1 April 2025",
    closingDate: "30 September 2025",
    applicationFee: "R150",
    isFree: false,
    type: "Traditional University",
  },
];

// Helper function to get application info by university ID
export const getApplicationInfo = (
  universityId: string,
): UniversityApplicationInfo | undefined => {
  return UNIVERSITY_APPLICATIONS_2025.find((uni) => uni.id === universityId);
};

// Helper function to get free universities
export const getFreeApplicationUniversities =
  (): UniversityApplicationInfo[] => {
    return UNIVERSITY_APPLICATIONS_2025.filter((uni) => uni.isFree);
  };

// Helper function to get universities by type
export const getUniversitiesByType = (
  type: string,
): UniversityApplicationInfo[] => {
  return UNIVERSITY_APPLICATIONS_2025.filter((uni) => uni.type === type);
};

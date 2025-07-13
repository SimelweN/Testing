// South African School Subjects for APS Calculation - Alphabetically Sorted
export const SOUTH_AFRICAN_SUBJECTS = [
  "Accounting",
  "Afrikaans First Additional Language",
  "Afrikaans Home Language",
  "Agricultural Management Practices",
  "Agricultural Sciences",
  "Agricultural Technology",
  "Anthropology",
  "Arabic",
  "Astronomy",
  "Biology",
  "Business Studies",
  "Chemistry",
  "Civil Technology",
  "Computer Applications Technology",
  "Consumer Studies",
  "Dance Studies",
  "Design",
  "Design Studies",
  "Dramatic Arts",
  "Earth and Environmental Sciences",
  "Economics",
  "Electrical Technology",
  "Engineering Graphics and Design",
  "English First Additional Language",
  "English Home Language",
  "Equine Studies",
  "Forestry",
  "French",
  "Geography",
  "German",
  "Greek",
  "Hebrew",
  "Hindi",
  "History",
  "Hospitality Studies",
  "Information Technology",
  "isiNdebele First Additional Language",
  "isiNdebele Home Language",
  "isiXhosa First Additional Language",
  "isiXhosa Home Language",
  "isiZulu First Additional Language",
  "isiZulu Home Language",
  "Italian",
  "Latin",
  "Life Orientation",
  "Life Sciences",
  "Mandarin",
  "Marine Sciences",
  "Marketing",
  "Mathematical Literacy",
  "Mathematics",
  "Mechanical Technology",
  "Music",
  "Nautical Science",
  "Nature Conservation",
  "Sepedi First Additional Language",
  "Sepedi Home Language",
  "Sesotho First Additional Language",
  "Sesotho Home Language",
  "Setswana First Additional Language",
  "Setswana Home Language",
  "Philosophy",
  "Physical Education",
  "Physical Sciences",
  "Physics",
  "Political Studies",
  "Portuguese",
  "Psychology",
  "Religion Studies",
  "Sign Language",
  "siSwati First Additional Language",
  "siSwati Home Language",
  "Sociology",
  "Spanish",
  "Sport and Exercise Science",
  "Tamil",
  "Technical Mathematics",
  "Technical Sciences",
  "Telegu",
  "Textile Studies",
  "Tourism",
  "Tshivenda First Additional Language",
  "Tshivenda Home Language",
  "Urdu",
  "Visual Arts",
  "Xitsonga First Additional Language",
  "Xitsonga Home Language",
].sort(); // Ensure alphabetical order is maintained

// For the "Others" option
export const SUBJECT_CATEGORIES = {
  CORE: "Core Subjects",
  SCIENCES: "Science Subjects",
  COMMERCIAL: "Commercial Subjects",
  TECHNICAL: "Technical Subjects",
  HUMANITIES: "Humanities & Social Sciences",
  LANGUAGES: "Languages",
  ARTS: "Arts & Culture",
  SPECIALIZED: "Specialized Subjects",
  OTHERS: "Others",
};

// Non-contributing subjects (mainly LO, but kept flexible)
export const NON_CONTRIBUTING_SUBJECTS = ["Life Orientation"];

// Subject requirements validation
export const REQUIRED_SUBJECTS = [
  "Mathematics",
  "Mathematical Literacy", // One of these is required
];

export const LANGUAGE_REQUIREMENTS = [
  "English Home Language",
  "English First Additional Language",
  "Afrikaans Home Language",
  "Afrikaans First Additional Language",
  // At least one language is required
];

// Helper functions
export const isNonContributing = (subjectName: string): boolean => {
  return NON_CONTRIBUTING_SUBJECTS.includes(subjectName);
};

export const isLanguageSubject = (subjectName: string): boolean => {
  return (
    subjectName.includes("Language") ||
    LANGUAGE_REQUIREMENTS.includes(subjectName)
  );
};

export const isMathSubject = (subjectName: string): boolean => {
  return (
    subjectName.includes("Mathematics") ||
    subjectName === "Mathematical Literacy"
  );
};

export const getSubjectCategory = (subjectName: string): string => {
  if (
    [
      "English Home Language",
      "English First Additional Language",
      "Afrikaans Home Language",
      "Afrikaans First Additional Language",
      "Mathematics",
      "Mathematical Literacy",
      "Life Orientation",
    ].includes(subjectName)
  ) {
    return SUBJECT_CATEGORIES.CORE;
  }

  if (
    [
      "Physical Sciences",
      "Life Sciences",
      "Chemistry",
      "Physics",
      "Biology",
      "Earth and Environmental Sciences",
      "Agricultural Sciences",
      "Agricultural Management Practices",
      "Agricultural Technology",
    ].includes(subjectName)
  ) {
    return SUBJECT_CATEGORIES.SCIENCES;
  }

  if (
    [
      "Accounting",
      "Business Studies",
      "Economics",
      "Consumer Studies",
      "Tourism",
      "Hospitality Studies",
      "Marketing",
    ].includes(subjectName)
  ) {
    return SUBJECT_CATEGORIES.COMMERCIAL;
  }

  if (
    [
      "Information Technology",
      "Computer Applications Technology",
      "Engineering Graphics and Design",
      "Technical Mathematics",
      "Technical Sciences",
      "Electrical Technology",
      "Mechanical Technology",
      "Civil Technology",
      "Design",
      "Textile Studies",
    ].includes(subjectName)
  ) {
    return SUBJECT_CATEGORIES.TECHNICAL;
  }

  if (
    [
      "History",
      "Geography",
      "Religion Studies",
      "Philosophy",
      "Sociology",
      "Anthropology",
      "Psychology",
      "Political Studies",
    ].includes(subjectName)
  ) {
    return SUBJECT_CATEGORIES.HUMANITIES;
  }

  if (isLanguageSubject(subjectName)) {
    return SUBJECT_CATEGORIES.LANGUAGES;
  }

  if (
    [
      "Visual Arts",
      "Music",
      "Dramatic Arts",
      "Dance Studies",
      "Design Studies",
    ].includes(subjectName)
  ) {
    return SUBJECT_CATEGORIES.ARTS;
  }

  return SUBJECT_CATEGORIES.SPECIALIZED;
};

// Export for backward compatibility
export const SUBJECTS_LIST = SOUTH_AFRICAN_SUBJECTS;

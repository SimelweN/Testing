import { Book } from "@/types/book";

// Fallback books data to use when database is unreachable
export const fallbackBooksData: Book[] = [
  {
    id: "fallback-1",
    title: "Introduction to Computer Science",
    author: "John Smith",
    price: 450,
    condition: "Good",
    grade: "1st Year",
    category: "Computer Science",
    university: "University of Cape Town",
    universityYear: "1",
    description: "Comprehensive introduction to computer science concepts. Excellent condition, barely used.",
    imageUrl: "/placeholder.svg",
    frontCover: "/placeholder.svg",
    createdAt: "2024-01-15T10:00:00Z",
    sold: false,
    seller: {
      id: "fallback-seller-1",
      name: "Book Seller",
      email: "seller@example.com"
    }
  },
  {
    id: "fallback-2",
    title: "Advanced Mathematics",
    author: "Jane Doe",
    price: 380,
    condition: "Good",
    grade: "2nd Year",
    category: "Mathematics",
    university: "University of the Witwatersrand",
    universityYear: "2",
    description: "Advanced mathematics textbook for second year students.",
    imageUrl: "/placeholder.svg",
    frontCover: "/placeholder.svg",
    createdAt: "2024-01-14T14:30:00Z",
    sold: false,
    seller: {
      id: "fallback-seller-2",
      name: "Math Student",
      email: "math@example.com"
    }
  },
  {
    id: "fallback-3",
    title: "Business Management Fundamentals",
    author: "Robert Johnson",
    price: 320,
    condition: "Average",
    grade: "1st Year",
    category: "Business",
    university: "University of Cape Town",
    universityYear: "1",
    description: "Essential business management concepts and principles.",
    imageUrl: "/placeholder.svg",
    frontCover: "/placeholder.svg",
    createdAt: "2024-01-13T09:15:00Z",
    sold: false,
    seller: {
      id: "fallback-seller-3",
      name: "Business Student",
      email: "business@example.com"
    }
  }
];

export const getFallbackBooks = (): Book[] => {
  console.warn("Using fallback books data due to database connectivity issues");
  return fallbackBooksData;
};

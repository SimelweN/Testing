// Fallback books data to use when database is unreachable
export const fallbackBooksData = [
  {
    id: "fallback-1",
    title: "Introduction to Computer Science",
    author: "John Smith",
    price: 450,
    condition: "excellent",
    grade: "1st Year",
    category: "Computer Science",
    university: "University of Cape Town",
    university_year: "1",
    description: "Comprehensive introduction to computer science concepts. Excellent condition, barely used.",
    images: ["/placeholder.svg"],
    seller_id: "fallback-seller-1",
    seller_name: "Book Seller",
    seller_email: "seller@example.com",
    created_at: "2024-01-15T10:00:00Z",
    sold: false,
    is_available: true
  },
  {
    id: "fallback-2", 
    title: "Advanced Mathematics",
    author: "Jane Doe",
    price: 380,
    condition: "good",
    grade: "2nd Year",
    category: "Mathematics",
    university: "University of the Witwatersrand",
    university_year: "2",
    description: "Advanced mathematics textbook for second year students.",
    images: ["/placeholder.svg"],
    seller_id: "fallback-seller-2",
    seller_name: "Math Student",
    seller_email: "math@example.com",
    created_at: "2024-01-14T14:30:00Z",
    sold: false,
    is_available: true
  },
  {
    id: "fallback-3",
    title: "Business Management Fundamentals",
    author: "Robert Johnson",
    price: 320,
    condition: "fair",
    grade: "1st Year",
    category: "Business",
    university: "University of Cape Town",
    university_year: "1",
    description: "Essential business management concepts and principles.",
    images: ["/placeholder.svg"],
    seller_id: "fallback-seller-3",
    seller_name: "Business Student",
    seller_email: "business@example.com",
    created_at: "2024-01-13T09:15:00Z",
    sold: false,
    is_available: true
  }
];

export const getFallbackBooks = () => {
  console.warn("Using fallback books data due to database connectivity issues");
  return fallbackBooksData.map(book => ({
    ...book,
    // Add fallback indicator
    _isFallback: true
  }));
};

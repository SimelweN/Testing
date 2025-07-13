import { StudyTip, StudyResource } from "@/types/university";

// Sample sponsored content - this would typically come from the admin panel
export const SPONSORED_STUDY_TIPS: StudyTip[] = [
  {
    id: "sponsored-tip-1",
    title: "Master Accounting with AI-Powered Practice",
    category: "Study Techniques",
    difficulty: "Intermediate",
    estimatedTime: "45 min setup",
    effectiveness: 88,
    tags: ["accounting", "practice", "AI", "personalized"],
    content: `**Revolutionize your accounting studies with personalized AI tutoring.**

**Why Traditional Study Methods Fall Short:**
• Generic textbook problems don't adapt to your weaknesses
• No immediate feedback on calculation errors
• Hard to track progress across different accounting topics
• Difficult to identify knowledge gaps before exams

**How AI-Powered Practice Changes Everything:**

**1. Adaptive Problem Generation**
• AI creates problems based on your performance
• Focuses on your weak areas automatically
• Gradually increases difficulty as you improve
• Covers all accounting principles and standards

**2. Instant Feedback & Explanations**
• Get immediate corrections on journal entries
• Step-by-step explanations for complex calculations
• Visual guides for financial statement preparation
• Common mistake prevention tips

**3. Progress Tracking**
• See your improvement in real-time
• Identify which topics need more work
• Track study streaks and consistency
• Compare your progress to accounting students nationwide

**4. Exam Preparation Mode**
• Practice with past paper questions
• Timed mock exams with instant scoring
• Personalized study plans for upcoming tests
• Topic-specific revision recommendations

**Getting Started:**
• Sign up and complete the initial assessment
• Practice 15-20 minutes daily for optimal results
• Focus on consistent practice rather than long sessions
• Use the mobile app for quick revision on the go`,
    author: "StudyAI Team",
    isSponsored: true,
    sponsorName: "StudyAI Platform",
    sponsorLogo: "/placeholder.svg",
    sponsorUrl: "https://studyai.co.za",
    sponsorCta: "Start Free Trial",
  },
];

export const SPONSORED_STUDY_RESOURCES: StudyResource[] = [
  {
    id: "sponsored-resource-1",
    title: "EduTech Pro - Complete Study Management Suite",
    description:
      "All-in-one study platform designed for South African students. Features note-taking, flashcards, study scheduling, and progress tracking with local curriculum alignment.",
    category: "Study Tools",
    type: "tool",
    difficulty: "Beginner",
    url: "https://edutechpro.co.za",
    rating: 4.7,
    provider: "EduTech Solutions",
    duration: "Ongoing",
    tags: ["study-management", "south-african", "curriculum", "mobile-app"],
    isSponsored: true,
    sponsorName: "EduTech Solutions",
    sponsorLogo: "/placeholder.svg",
    sponsorUrl: "https://edutechpro.co.za/student-special",
    sponsorCta: "Get 50% Off",
  },
  {
    id: "sponsored-resource-2",
    title: "MathMaster Online Tutoring",
    description:
      "One-on-one math tutoring with certified South African teachers. Specializing in Grade 10-12 mathematics and university-level calculus and statistics.",
    category: "Tutoring",
    type: "website",
    difficulty: "Intermediate",
    url: "https://mathmaster.co.za",
    rating: 4.9,
    provider: "MathMaster Tutoring",
    duration: "1-hour sessions",
    tags: ["math", "tutoring", "one-on-one", "certified-teachers"],
    isSponsored: true,
    sponsorName: "MathMaster",
    sponsorLogo: "/placeholder.svg",
    sponsorUrl: "https://mathmaster.co.za/book-trial",
    sponsorCta: "Book Free Trial",
  },
];

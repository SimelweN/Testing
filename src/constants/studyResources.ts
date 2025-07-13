import { StudyTip, StudyResource } from "@/types/university";

export const STUDY_TIPS: StudyTip[] = [
  {
    id: "tip-1",
    title: "The Science-Backed Reading Method (SQ3R)",
    category: "Reading & Comprehension",
    difficulty: "Beginner",
    estimatedTime: "15 min to learn",
    effectiveness: 85,
    tags: ["reading", "comprehension", "note-taking"],
    content: `**Most students read textbooks wrong. Here's how to read like a top achiever.**

**BEFORE you start reading:**
• **Preview the chapter** - Read headings, subheadings, and summary first
• **Set a purpose** - What do you need to learn from this?
• **Check your knowledge** - What do you already know about this topic?
• **Time yourself** - How long will this take? Set realistic goals

**The SQ3R Method (proven for 70+ years):**

**1. SURVEY (2-3 minutes)**
• Read the chapter title and introduction
• Look at all headings and subheadings
• Read the summary or conclusion
• Look at pictures, graphs, and charts
• Get the "big picture" before diving in

**2. QUESTION (1-2 minutes)**
• Turn headings into questions
• "Photosynthesis" becomes "What is photosynthesis? How does it work?"
• Write down 3-5 questions you want answered
• This gives your brain something to search for while reading

**3. READ (actual reading time)**
• Read actively, not passively
• Look for answers to your questions
• Slow down at important parts
• Speed up through examples and stories
• Take notes in margins or separate paper

**4. RECITE (after each section)**
• Stop and summarize what you just read
• Say it out loud or write it down
• If you can't explain it simply, you don't understand it yet
• Go back and re-read confusing parts

**5. REVIEW (5-10 minutes at the end)**
• Go through your notes and summaries
• Answer your original questions
• Connect new information to what you already knew
• Plan what you'll study next time`,
  },
  {
    id: "tip-2",
    title: "Memory Palace Technique for Exam Success",
    category: "Memory & Retention",
    difficulty: "Intermediate",
    estimatedTime: "30 min to master",
    effectiveness: 90,
    tags: ["memory", "visualization", "exam-prep"],
    content: `**Turn your memory into a superpower using ancient techniques.**

**What is the Memory Palace?**
• Also called "Method of Loci"
• Used by memory champions worldwide
• Stores information in familiar locations
• Can increase recall by 400%+

**How to Build Your Memory Palace:**

**1. Choose a familiar place**
• Your home, school, or daily route
• Must be a place you know very well
• Should have a clear path through it

**2. Plan your route**
• Walk through your chosen location
• Identify 10-20 specific spots (couch, kitchen table, front door)
• Always follow the same path
• Make sure each spot is visually distinct

**3. Place information at each spot**
• Create vivid, bizarre mental images
• Connect the information to the location
• Make it emotional, funny, or shocking
• The weirder the image, the better you'll remember

**Example: Remembering the periodic table**
• Front door = Hydrogen (huge balloon blocking the door)
• Living room couch = Helium (couch floating in the air)
• Kitchen = Lithium (batteries powering all appliances)

**Advanced Memory Palace Tips:**
• Use action and movement in your images
• Include yourself in the scenes
• Make images colorful and exaggerated
• Practice walking through your palace daily`,
  },
  {
    id: "tip-3",
    title: "Active Recall: The Most Powerful Study Method",
    category: "Study Techniques",
    difficulty: "Beginner",
    estimatedTime: "20 min to implement",
    effectiveness: 95,
    tags: ["active-recall", "testing", "flashcards"],
    content: `**Stop re-reading. Start testing yourself. This method is proven by 100+ studies.**

**What is Active Recall?**
• Testing yourself on material instead of just reviewing
• Forces your brain to retrieve information
• Strengthens memory pathways
• Identifies knowledge gaps immediately

**How to Use Active Recall:**

**1. The Closed-Book Method**
• Read a section of your textbook
• Close the book completely
• Write down everything you remember
• Check your notes against the original
• Focus extra time on what you missed

**2. The Question-Answer Method**
• Turn chapter headings into questions
• Create questions from your notes
• Test yourself regularly
• Answer questions without looking at materials first

**3. The Feynman Technique**
• Explain the concept to someone else (or pretend to)
• Use simple language, no jargon
• If you get stuck, you've found a knowledge gap
• Go back to study that specific area

**4. Spaced Repetition Schedule**
• Day 1: Learn new material
• Day 2: Test yourself (first review)
• Day 4: Test yourself again (second review)
• Day 8: Third review
• Day 16: Fourth review
• Continue doubling the intervals

**Digital Tools for Active Recall:**
• Anki (spaced repetition flashcards)
• Quizlet (online flashcards)
• RemNote (note-taking with built-in spaced repetition)`,
  },
];

export const STUDY_RESOURCES: StudyResource[] = [
  {
    id: "resource-1",
    title: "Khan Academy - Free World-Class Education",
    description:
      "Comprehensive video lessons covering high school and university subjects including mathematics, science, economics, and more.",
    category: "Online Learning",
    type: "video",
    difficulty: "Beginner",
    url: "https://www.khanacademy.org",
    rating: 4.8,
    provider: "Khan Academy",
    duration: "Varies",
    tags: ["math", "science", "free", "video-lessons"],
  },
  {
    id: "resource-2",
    title: "Anki - Powerful Spaced Repetition",
    description:
      "The most effective flashcard system for long-term retention. Used by medical students and language learners worldwide.",
    category: "Study Tools",
    type: "tool",
    difficulty: "Intermediate",
    url: "https://apps.ankiweb.net",
    rating: 4.6,
    provider: "AnkiWeb",
    tags: ["flashcards", "spaced-repetition", "memory", "mobile-app"],
  },
  {
    id: "resource-3",
    title: "Coursera University Courses",
    description:
      "Access courses from top universities like Stanford, Yale, and University of Cape Town. Many free audit options available.",
    category: "Online Learning",
    type: "course",
    difficulty: "Intermediate",
    url: "https://www.coursera.org",
    rating: 4.5,
    provider: "Coursera",
    duration: "4-12 weeks",
    tags: ["university-courses", "certificates", "professional-development"],
  },
  {
    id: "resource-4",
    title: "Pomodoro Timer for Focus",
    description:
      "Web-based Pomodoro timer to improve focus and productivity. Includes statistics and customizable work/break intervals.",
    category: "Productivity",
    type: "tool",
    difficulty: "Beginner",
    url: "https://pomofocus.io",
    rating: 4.4,
    provider: "PomoFocus",
    tags: ["focus", "time-management", "pomodoro", "productivity"],
  },
  {
    id: "resource-5",
    title: "MIT OpenCourseWare",
    description:
      "Free access to course materials from MIT classes. Includes lecture notes, assignments, and exams from actual MIT courses.",
    category: "Online Learning",
    type: "website",
    difficulty: "Advanced",
    url: "https://ocw.mit.edu",
    rating: 4.7,
    provider: "MIT",
    tags: ["mit", "engineering", "science", "free", "university-level"],
  },
];

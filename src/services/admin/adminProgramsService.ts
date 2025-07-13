import { supabase } from "@/integrations/supabase/client";
import { UserSubmittedProgram } from "@/types/university";

export interface AdminProgramSubmission extends UserSubmittedProgram {
  id: string;
  submittedBy: string;
  submittedAt: string;
  status: "pending" | "approved" | "rejected";
  adminComments?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  submitterName?: string;
  submitterEmail?: string;
}

// Get all submitted programs for admin review
export const getPendingPrograms = async (): Promise<
  AdminProgramSubmission[]
> => {
  try {
    // In a real implementation, this would query the database
    // For now, we'll simulate data
    console.log("Fetching pending programs for admin review...");

    await new Promise((resolve) => setTimeout(resolve, 500));

    // Simulated data - in production this would be real database data
    const mockPrograms: AdminProgramSubmission[] = [
      {
        id: "prog-1",
        universityId: "uct",
        universityName: "University of Cape Town",
        facultyId: "engineering",
        facultyName: "Faculty of Engineering",
        programName: "Bachelor of Engineering in Biomedical Engineering",
        duration: "4 years",
        apsRequirement: 38,
        description:
          "This program combines engineering principles with biological sciences to develop medical devices and systems.",
        subjects: [
          { name: "Mathematics", level: 7, isRequired: true },
          { name: "Physical Sciences", level: 6, isRequired: true },
          { name: "Life Sciences", level: 5, isRequired: false },
        ],
        careerProspects: [
          "Biomedical Engineer",
          "Medical Device Designer",
          "Research Scientist",
        ],
        submittedBy: "user-123",
        submittedAt: "2024-01-15T10:30:00Z",
        status: "pending",
        submitterName: "John Doe",
        submitterEmail: "john.doe@example.com",
      },
      {
        id: "prog-2",
        universityId: "wits",
        universityName: "University of the Witwatersrand",
        facultyId: "commerce",
        facultyName: "Faculty of Commerce",
        programName: "Bachelor of Commerce in Digital Marketing",
        duration: "3 years",
        apsRequirement: 32,
        description:
          "A modern commerce degree focusing on digital marketing strategies and data analytics.",
        subjects: [
          { name: "Mathematics", level: 5, isRequired: true },
          { name: "English", level: 6, isRequired: true },
          { name: "Business Studies", level: 5, isRequired: false },
        ],
        careerProspects: [
          "Digital Marketing Manager",
          "Social Media Strategist",
          "Marketing Analyst",
        ],
        submittedBy: "user-456",
        submittedAt: "2024-01-12T14:20:00Z",
        status: "pending",
        submitterName: "Sarah Smith",
        submitterEmail: "sarah.smith@example.com",
      },
    ];

    return mockPrograms.filter((p) => p.status === "pending");
  } catch (error) {
    console.error("Error fetching pending programs:", error);
    throw new Error("Failed to fetch pending programs");
  }
};

// Get all program submissions (approved, rejected, pending)
export const getAllProgramSubmissions = async (): Promise<
  AdminProgramSubmission[]
> => {
  try {
    console.log("Fetching all program submissions...");

    await new Promise((resolve) => setTimeout(resolve, 500));

    // Include approved and rejected programs as well
    const allPrograms: AdminProgramSubmission[] = [
      ...(await getPendingPrograms()),
      {
        id: "prog-3",
        universityId: "stellenbosch",
        universityName: "Stellenbosch University",
        facultyId: "science",
        facultyName: "Faculty of Science",
        programName: "Bachelor of Science in Data Science",
        duration: "3 years",
        apsRequirement: 35,
        description:
          "An interdisciplinary program combining statistics, computer science, and domain expertise.",
        subjects: [
          { name: "Mathematics", level: 7, isRequired: true },
          { name: "Information Technology", level: 6, isRequired: true },
        ],
        careerProspects: [
          "Data Scientist",
          "Machine Learning Engineer",
          "Business Analyst",
        ],
        submittedBy: "user-789",
        submittedAt: "2024-01-10T09:15:00Z",
        status: "approved",
        submitterName: "Michael Johnson",
        submitterEmail: "michael.j@example.com",
        reviewedBy: "admin-1",
        reviewedAt: "2024-01-11T11:30:00Z",
        adminComments: "Excellent submission with comprehensive details.",
      },
    ];

    return allPrograms;
  } catch (error) {
    console.error("Error fetching all program submissions:", error);
    throw new Error("Failed to fetch program submissions");
  }
};

// Approve a program submission
export const approveProgram = async (
  programId: string,
  adminComments?: string,
): Promise<void> => {
  try {
    console.log(`Approving program ${programId}...`);

    // In a real implementation, this would update the database
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Simulate database update
    console.log(`Program ${programId} approved successfully`);

    // In production, this would also:
    // 1. Add the program to the main programs database
    // 2. Send notification to the submitter
    // 3. Update the submission status
  } catch (error) {
    console.error("Error approving program:", error);
    throw new Error("Failed to approve program");
  }
};

// Reject a program submission
export const rejectProgram = async (
  programId: string,
  adminComments: string,
): Promise<void> => {
  try {
    console.log(`Rejecting program ${programId}...`);

    if (!adminComments.trim()) {
      throw new Error("Comments are required when rejecting a program");
    }

    // In a real implementation, this would update the database
    await new Promise((resolve) => setTimeout(resolve, 800));

    console.log(`Program ${programId} rejected successfully`);

    // In production, this would also:
    // 1. Update the submission status
    // 2. Send notification to the submitter with feedback
    // 3. Store admin comments for submitter reference
  } catch (error) {
    console.error("Error rejecting program:", error);
    throw new Error("Failed to reject program");
  }
};

// Get program submission statistics
export const getProgramStats = async (): Promise<{
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}> => {
  try {
    const allPrograms = await getAllProgramSubmissions();

    return {
      total: allPrograms.length,
      pending: allPrograms.filter((p) => p.status === "pending").length,
      approved: allPrograms.filter((p) => p.status === "approved").length,
      rejected: allPrograms.filter((p) => p.status === "rejected").length,
    };
  } catch (error) {
    console.error("Error fetching program stats:", error);
    throw new Error("Failed to fetch program statistics");
  }
};

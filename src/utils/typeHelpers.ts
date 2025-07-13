
import { StudyTip, StudyResource } from "@/types/university";

export const normalizeDifficulty = (
  difficulty: string,
): "Beginner" | "Intermediate" | "Advanced" => {
  switch (difficulty.toLowerCase()) {
    case "beginner":
      return "Beginner";
    case "intermediate":
      return "Intermediate";
    case "advanced":
      return "Advanced";
    default:
      return "Beginner";
  }
};

export const normalizeResourceType = (
  type: string,
): "pdf" | "video" | "website" | "tool" | "course" => {
  switch (type.toLowerCase()) {
    case "pdf":
      return "pdf";
    case "video":
      return "video";
    case "website":
      return "website";
    case "tool":
      return "tool";
    case "course":
      return "course";
    case "template":
      return "pdf"; // Convert template to pdf
    default:
      return "pdf";
  }
};

export const normalizeTagsToArray = (tags: string | string[]): string[] => {
  if (Array.isArray(tags)) {
    return tags;
  }
  if (typeof tags === "string") {
    return tags.split(",").map((tag) => tag.trim()).filter(Boolean);
  }
  return [];
};

export const normalizeTagsToString = (tags: string | string[]): string => {
  if (Array.isArray(tags)) {
    return tags.join(", ");
  }
  if (typeof tags === "string") {
    return tags;
  }
  return "";
};

// Helper to ensure StudyTip has all required properties
export const normalizeStudyTip = (tip: Partial<StudyTip>): StudyTip => {
  return {
    id: tip.id || "",
    title: tip.title || "",
    category: tip.category || "",
    difficulty: tip.difficulty ? normalizeDifficulty(tip.difficulty) : "Beginner",
    estimatedTime: tip.estimatedTime || "",
    effectiveness: tip.effectiveness,
    tags: tip.tags || [],
    content: tip.content || "",
    author: tip.author,
    description: tip.description || "", // Ensure description exists
    isActive: tip.isActive ?? true, // Default to active
    isSponsored: tip.isSponsored,
    sponsorName: tip.sponsorName,
    sponsorLogo: tip.sponsorLogo,
    sponsorUrl: tip.sponsorUrl,
    sponsorCta: tip.sponsorCta,
  };
};

// Helper to ensure StudyResource has all required properties
export const normalizeStudyResource = (resource: Partial<StudyResource>): StudyResource => {
  return {
    id: resource.id || "",
    title: resource.title || "",
    description: resource.description || "",
    type: resource.type ? normalizeResourceType(resource.type) : "pdf",
    category: resource.category || "",
    difficulty: resource.difficulty ? normalizeDifficulty(resource.difficulty) : "Beginner",
    url: resource.url || "",
    rating: resource.rating,
    provider: resource.provider,
    duration: resource.duration,
    tags: resource.tags || [],
    downloadUrl: resource.downloadUrl, // Include downloadUrl
    isActive: resource.isActive ?? true, // Default to active
    isFeatured: resource.isFeatured ?? false, // Default to not featured
    isSponsored: resource.isSponsored,
    sponsorName: resource.sponsorName,
    sponsorLogo: resource.sponsorLogo,
    sponsorUrl: resource.sponsorUrl,
    sponsorCta: resource.sponsorCta,
  };
};

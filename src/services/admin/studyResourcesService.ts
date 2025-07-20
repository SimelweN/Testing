import { supabase } from "@/integrations/supabase/client";
import { logError } from "@/utils/errorUtils";
import { StudyTip, StudyResource } from "@/types/university";

interface StudyResourcePayload {
  title: string;
  description: string;
  type: "pdf" | "video" | "website" | "tool" | "course";
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  category: string;
  tags: string[];
  url?: string;
  provider?: string;
  duration?: string;
  rating?: number;
  downloadUrl?: string;
  isActive: boolean;
  isFeatured?: boolean;
  isSponsored?: boolean;
  sponsorName?: string;
  sponsorLogo?: string;
  sponsorUrl?: string;
  sponsorCta?: string;
}

interface StudyTipPayload {
  title: string;
  content: string;
  category: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  tags: string[];
  isActive: boolean;
  author?: string;
  estimatedTime?: string;
  effectiveness?: number;
  isSponsored?: boolean;
  sponsorName?: string;
  sponsorLogo?: string;
  sponsorUrl?: string;
  sponsorCta?: string;
}

// Create study resource in database
export const createStudyResource = async (
  data: StudyResourcePayload,
): Promise<StudyResource> => {
  try {
    console.log("Creating study resource:", data);

    // Check if table exists first
    const tableExists = await checkTableExists("study_resources");
    if (!tableExists) {
      const errorMessage =
        "Study resources database table is not available. Please contact your administrator to run the required database migrations.";
      console.error("Database migration required:", errorMessage);
      throw new Error(errorMessage);
    }

    const resourceData = {
      title: data.title,
      description: data.description,
      type: data.type,
      difficulty: data.difficulty,
      category: data.category,
      tags: data.tags,
      url: data.url,
      rating: data.rating || 0,
      sponsored: data.isSponsored || false,
    };

    const { data: result, error } = await supabase
      .from("study_resources")
      .insert([resourceData])
      .select()
      .single();

    if (error) {
      console.error("studyResourcesService.createStudyResource error:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });

      if (error.code === "42P01") {
        throw new Error(
          "Study resources table not found. Database migration needed.",
        );
      }

      if (error.code === "42501") {
        throw new Error(
          "Permission denied: You don't have permission to create study resources. Please check table permissions or RLS policies.",
        );
      }

      throw new Error(`Failed to create study resource: ${error.message}`);
    }

    return {
      id: result.id,
      title: result.title,
      description: result.description,
      type: result.type,
      category: result.category,
      difficulty: result.difficulty,
      url: result.url,
      rating: result.rating,
      provider: "",
      duration: "",
      tags: result.tags || [],
      downloadUrl: "",
      isActive: true,
      isFeatured: false,
      isSponsored: result.sponsored || false,
      sponsorName: "",
      sponsorLogo: "",
      sponsorUrl: "",
      sponsorCta: "",
      createdAt: result.created_at,
      updatedAt: result.updated_at,
    };
  } catch (error) {
    logError("studyResourcesService.createStudyResource", error);
    throw error;
  }
};

// Update study resource
export const updateStudyResource = async (
  id: string,
  data: Partial<StudyResourcePayload>,
): Promise<StudyResource> => {
  try {
    console.log(`Updating study resource ${id}:`, data);

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.difficulty !== undefined) updateData.difficulty = data.difficulty;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.url !== undefined) updateData.url = data.url;
    if (data.provider !== undefined) updateData.provider = data.provider;
    if (data.duration !== undefined) updateData.duration = data.duration;
    if (data.rating !== undefined) updateData.rating = data.rating;
    if (data.downloadUrl !== undefined)
      updateData.download_url = data.downloadUrl;
    if (data.isActive !== undefined) updateData.is_active = data.isActive;
    if (data.isFeatured !== undefined) updateData.is_featured = data.isFeatured;
    if (data.isSponsored !== undefined)
      updateData.is_sponsored = data.isSponsored;
    if (data.sponsorName !== undefined)
      updateData.sponsor_name = data.sponsorName;
    if (data.sponsorLogo !== undefined)
      updateData.sponsor_logo = data.sponsorLogo;
    if (data.sponsorUrl !== undefined) updateData.sponsor_url = data.sponsorUrl;
    if (data.sponsorCta !== undefined) updateData.sponsor_cta = data.sponsorCta;

    const { data: result, error } = await supabase
      .from("study_resources")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      logError("studyResourcesService.updateStudyResource", error);
      throw new Error("Failed to update study resource");
    }

    return {
      id: result.id,
      title: result.title,
      description: result.description,
      type: result.type,
      category: result.category,
      difficulty: result.difficulty,
      url: result.url,
      rating: result.rating,
      provider: result.provider,
      duration: result.duration,
      tags: result.tags || [],
      downloadUrl: result.download_url,
      isActive: result.is_active,
      isFeatured: result.is_featured,
      isSponsored: result.is_sponsored,
      sponsorName: result.sponsor_name,
      sponsorLogo: result.sponsor_logo,
      sponsorUrl: result.sponsor_url,
      sponsorCta: result.sponsor_cta,
      createdAt: result.created_at,
      updatedAt: result.updated_at,
    };
  } catch (error) {
    logError("studyResourcesService.updateStudyResource", error);
    throw error;
  }
};

// Delete study resource
export const deleteStudyResource = async (id: string): Promise<void> => {
  try {
    console.log(`Deleting study resource ${id}`);

    const { error } = await supabase
      .from("study_resources")
      .delete()
      .eq("id", id);

    if (error) {
      logError("studyResourcesService.deleteStudyResource", error);
      throw new Error("Failed to delete study resource");
    }
  } catch (error) {
    logError("studyResourcesService.deleteStudyResource", error);
    throw error;
  }
};

// Create study tip in database
export const createStudyTip = async (
  data: StudyTipPayload,
): Promise<StudyTip> => {
  try {
    console.log("Creating study tip:", data);

    // Check if table exists first
    const tableExists = await checkTableExists("study_tips");
    if (!tableExists) {
      const errorMessage =
        "Study tips database table is not available. Please contact your administrator to run the required database migrations.";
      console.error("Database migration required:", errorMessage);
      throw new Error(errorMessage);
    }

    const tipData = {
      title: data.title,
      description: data.content, // Map content to description for database
      is_active: data.isActive,
    };

    const { data: result, error } = await supabase
      .from("study_tips")
      .insert([tipData])
      .select()
      .single();

    if (error) {
      console.error("studyResourcesService.createStudyTip error:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });

      if (error.code === "42P01") {
        throw new Error(
          "Study tips table not found. Database migration needed.",
        );
      }

      if (error.code === "42501") {
        throw new Error(
          "Permission denied: You don't have permission to create study tips. Please check table permissions or RLS policies.",
        );
      }

      throw new Error(`Failed to create study tip: ${error.message}`);
    }

    return {
      id: result.id,
      title: result.title,
      content: result.description,
      category: "General",
      difficulty: "Beginner",
      tags: [],
      isActive: result.is_active,
      author: "",
      estimatedTime: "",
      effectiveness: 0,
      isSponsored: false,
      sponsorName: "",
      sponsorLogo: "",
      sponsorUrl: "",
      sponsorCta: "",
      createdAt: result.created_at,
      updatedAt: result.updated_at,
    };
  } catch (error) {
    logError("studyResourcesService.createStudyTip", error);
    throw error;
  }
};

// Update study tip
export const updateStudyTip = async (
  id: string,
  data: Partial<StudyTipPayload>,
): Promise<StudyTip> => {
  try {
    console.log(`Updating study tip ${id}:`, data);

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.difficulty !== undefined) updateData.difficulty = data.difficulty;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.isActive !== undefined) updateData.is_active = data.isActive;
    if (data.author !== undefined) updateData.author = data.author;
    if (data.estimatedTime !== undefined)
      updateData.estimated_time = data.estimatedTime;
    if (data.effectiveness !== undefined)
      updateData.effectiveness = data.effectiveness;
    if (data.isSponsored !== undefined)
      updateData.is_sponsored = data.isSponsored;
    if (data.sponsorName !== undefined)
      updateData.sponsor_name = data.sponsorName;
    if (data.sponsorLogo !== undefined)
      updateData.sponsor_logo = data.sponsorLogo;
    if (data.sponsorUrl !== undefined) updateData.sponsor_url = data.sponsorUrl;
    if (data.sponsorCta !== undefined) updateData.sponsor_cta = data.sponsorCta;

    const { data: result, error } = await supabase
      .from("study_tips")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      logError("studyResourcesService.updateStudyTip", error);
      throw new Error("Failed to update study tip");
    }

    return {
      id: result.id,
      title: result.title,
      content: result.content,
      category: result.category,
      difficulty: result.difficulty,
      tags: result.tags || [],
      isActive: result.is_active,
      author: result.author,
      estimatedTime: result.estimated_time,
      effectiveness: result.effectiveness,
      isSponsored: result.is_sponsored,
      sponsorName: result.sponsor_name,
      sponsorLogo: result.sponsor_logo,
      sponsorUrl: result.sponsor_url,
      sponsorCta: result.sponsor_cta,
      createdAt: result.created_at,
      updatedAt: result.updated_at,
    };
  } catch (error) {
    logError("studyResourcesService.updateStudyTip", error);
    throw error;
  }
};

// Delete study tip
export const deleteStudyTip = async (id: string): Promise<void> => {
  try {
    console.log(`Deleting study tip ${id}`);

    const { error } = await supabase.from("study_tips").delete().eq("id", id);

    if (error) {
      logError("studyResourcesService.deleteStudyTip", error);
      throw new Error("Failed to delete study tip");
    }
  } catch (error) {
    logError("studyResourcesService.deleteStudyTip", error);
    throw error;
  }
};

// Check if study resources table exists
const checkTableExists = async (tableName: string): Promise<boolean> => {
  try {
    const { error } = await supabase.from(tableName).select("id").limit(1);

    return !error || error.code !== "42P01";
  } catch (error) {
    return false;
  }
};

// Get all study resources
export const getStudyResources = async (): Promise<StudyResource[]> => {
  try {
    console.log("Fetching study resources...");

    // Check if table exists first
    const tableExists = await checkTableExists("study_resources");
    if (!tableExists) {
      console.warn("Study resources table does not exist.");
      // Return empty array but don't fail
      return [];
    }

    // First, let's try a simple query to see what columns exist
    const { data, error } = await supabase
      .from("study_resources")
      .select("*")
      .limit(10)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("studyResourcesService.getStudyResources error:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });

      // Handle specific database errors
      if (error.code === "42P01") {
        console.warn(
          "Study resources table not found. Database migration may be needed.",
        );
        return [];
      }

      if (error.code === "42703") {
        console.error(
          "Column not found in study_resources table. Check table schema:",
          error.message,
        );
        return [];
      }

      throw new Error(`Failed to fetch study resources: ${error.message}`);
    }

    return (data || []).map((item) => ({
      id: item.id || "",
      title: item.title || "Untitled Resource",
      description:
        item.description || item.content || "No description available",
      type: item.type || item.resource_type || "website",
      category: item.category || "General",
      difficulty: item.difficulty || "Beginner",
      url: item.url || item.link || "",
      rating: item.rating || 0,
      provider: item.provider || "",
      duration: item.duration || "",
      tags: item.tags || [],
      downloadUrl: item.download_url || item.downloadUrl || "",
      isActive: item.is_active !== undefined ? item.is_active : true,
      isFeatured: item.is_featured || false,
      isSponsored: item.sponsored || item.is_sponsored || false,
      sponsorName: item.sponsor_name || "",
      sponsorLogo: item.sponsor_logo || "",
      sponsorUrl: item.sponsor_url || "",
      sponsorCta: item.sponsor_cta || "",
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));
  } catch (error) {
    logError("studyResourcesService.getStudyResources", error);
    return []; // Return empty array on error
  }
};

// Get all study tips
export const getStudyTips = async (): Promise<StudyTip[]> => {
  try {
    console.log("Fetching study tips...");

    // Check if table exists first
    const tableExists = await checkTableExists("study_tips");
    if (!tableExists) {
      console.warn("Study tips table does not exist.");
      // Return empty array but don't fail
      return [];
    }

    // First, let's try a simple query to see what columns exist
    const { data, error } = await supabase
      .from("study_tips")
      .select("*")
      .limit(10)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("studyResourcesService.getStudyTips error:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });

      if (error.code === "42P01") {
        console.warn(
          "Study tips table not found. Database migration may be needed.",
        );
        return [];
      }

      if (error.code === "42703") {
        console.error(
          "Column not found in study_tips table. Check table schema:",
          error.message,
        );
        return [];
      }

      throw new Error(`Failed to fetch study tips: ${error.message}`);
    }

    return (data || []).map((item) => ({
      id: item.id || "",
      title: item.title || "Untitled Tip",
      content:
        item.description ||
        item.content ||
        item.tip_content ||
        "No content available",
      category: item.category || "General",
      difficulty: item.difficulty || "Beginner",
      tags: item.tags || [],
      isActive: item.is_active !== undefined ? item.is_active : true,
      author: item.author || "",
      estimatedTime: item.estimated_time || item.estimatedTime || "",
      effectiveness: item.effectiveness || 0,
      isSponsored: item.is_sponsored || false,
      sponsorName: item.sponsor_name || "",
      sponsorLogo: item.sponsor_logo || "",
      sponsorUrl: item.sponsor_url || "",
      sponsorCta: item.sponsor_cta || "",
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));
  } catch (error) {
    logError("studyResourcesService.getStudyTips", error);
    return []; // Return empty array on error
  }
};

// Legacy service object for backwards compatibility
export const studyResourcesService = {
  getStudyResources,
  createStudyResource,
  updateStudyResource,
  deleteStudyResource,
  getStudyTips,
  createStudyTip,
  updateStudyTip,
  deleteStudyTip,
  getAllStudyContent: async () => {
    const [tips, resources] = await Promise.all([
      getStudyTips(),
      getStudyResources(),
    ]);
    return { tips, resources };
  },
};

// Get all study content (tips and resources)
export const getAllStudyContent = async (): Promise<{
  tips: StudyTip[];
  resources: StudyResource[];
}> => {
  try {
    console.log("Fetching all study content...");

    const [tips, resources] = await Promise.all([
      getStudyTips(),
      getStudyResources(),
    ]);

    return { tips, resources };
  } catch (error) {
    logError("studyResourcesService.getAllStudyContent", error);
    return { tips: [], resources: [] };
  }
};

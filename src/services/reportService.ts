import { supabase } from "@/integrations/supabase/client";

export interface ReportData {
  reportedUserId: string;
  reporterUserId: string;
  bookId?: string;
  bookTitle: string;
  sellerName: string;
  reason: string;
}

export interface GeneralReportData {
  userId: string | null;
  name: string;
  email: string;
  category: string;
  subject: string;
  description: string;
  priority: string;
  status: string;
}

export const submitReport = async (
  reportData: GeneralReportData,
): Promise<void> => {
  try {
    console.log("Submitting general report:", reportData);
    
    const { error } = await supabase.from("contact_messages").insert({
      name: reportData.name,
      email: reportData.email,
      subject: `${reportData.category}: ${reportData.subject}`,
      message: reportData.description,
      status: reportData.status === "open" ? "unread" : reportData.status,
    });

    if (error) {
      console.error("Error submitting general report:", error);
      throw error;
    }

    console.log("General report submitted successfully");
  } catch (error) {
    console.error("Error in submitReport:", error);
    throw error;
  }
};

export const submitBookReport = async (
  reportData: ReportData,
): Promise<void> => {
  try {
    console.log("Submitting book report:", reportData);
    
    const { error } = await supabase.from("reports").insert({
      reported_user_id: reportData.reportedUserId,
      reporter_user_id: reportData.reporterUserId,
      book_id: reportData.bookId,
      book_title: reportData.bookTitle,
      seller_name: reportData.sellerName,
      reason: reportData.reason,
      status: "pending",
    });

    if (error) {
      console.error("Error submitting book report:", error);
      throw error;
    }

    console.log("Book report submitted successfully");
  } catch (error) {
    console.error("Error in submitBookReport:", error);
    throw error;
  }
};

export const getAllReports = async (): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching reports:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Error in getAllReports:", error);
    throw error;
  }
};

export const getReportsByStatus = async (
  status: "pending" | "resolved" | "dismissed",
): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .eq("status", status)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching reports by status:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Error in getReportsByStatus:", error);
    throw error;
  }
};

export const getSuspendedUsers = async (): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("status", "suspended")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching suspended users:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Error in getSuspendedUsers:", error);
    throw error;
  }
};

export const dismissReport = async (reportId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from("reports")
      .update({ status: "dismissed", updated_at: new Date().toISOString() })
      .eq("id", reportId);

    if (error) {
      console.error("Error dismissing report:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error in dismissReport:", error);
    throw error;
  }
};

export const banUserFromReport = async (
  reportId: string,
  reason: string,
): Promise<void> => {
  try {
    // First get the report to find the reported user
    const { data: report, error: reportError } = await supabase
      .from("reports")
      .select("reported_user_id")
      .eq("id", reportId)
      .single();

    if (reportError || !report) {
      throw new Error("Report not found");
    }

    // Ban the user
    const { error: banError } = await supabase
      .from("profiles")
      .update({
        status: "banned",
        suspension_reason: reason,
        suspended_at: new Date().toISOString(),
      })
      .eq("id", report.reported_user_id);

    if (banError) {
      throw banError;
    }

    // Mark report as resolved
    const { error: resolveError } = await supabase
      .from("reports")
      .update({ status: "resolved", updated_at: new Date().toISOString() })
      .eq("id", reportId);

    if (resolveError) {
      throw resolveError;
    }
  } catch (error) {
    console.error("Error banning user from report:", error);
    throw error;
  }
};

export const suspendUserFromReport = async (
  reportId: string,
  reason: string,
): Promise<void> => {
  try {
    // First get the report to find the reported user
    const { data: report, error: reportError } = await supabase
      .from("reports")
      .select("reported_user_id")
      .eq("id", reportId)
      .single();

    if (reportError || !report) {
      throw new Error("Report not found");
    }

    // Suspend the user
    const { error: suspendError } = await supabase
      .from("profiles")
      .update({
        status: "suspended",
        suspension_reason: reason,
        suspended_at: new Date().toISOString(),
      })
      .eq("id", report.reported_user_id);

    if (suspendError) {
      throw suspendError;
    }

    // Mark report as resolved
    const { error: resolveError } = await supabase
      .from("reports")
      .update({ status: "resolved", updated_at: new Date().toISOString() })
      .eq("id", reportId);

    if (resolveError) {
      throw resolveError;
    }
  } catch (error) {
    console.error("Error suspending user from report:", error);
    throw error;
  }
};

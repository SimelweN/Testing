import { supabase } from "@/integrations/supabase/client";

export interface NotificationRequest {
  id?: string;
  user_id: string;
  user_email: string;
  notification_type: "accommodation" | "program" | "general";
  university_id?: string;
  university_name?: string;
  program_id?: string;
  program_name?: string;
  message?: string;
  created_at?: string;
  status?: "pending" | "sent" | "cancelled";
}

export class NotificationRequestService {
  /**
   * Submit a notification request for accommodation
   */
  static async requestAccommodationNotification(
    userId: string,
    userEmail: string,
    universityId: string,
    universityName: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.from("notification_requests").insert({
        user_id: userId,
        user_email: userEmail,
        notification_type: "accommodation",
        university_id: universityId,
        university_name: universityName,
        message: `User requested notification for accommodation services at ${universityName}`,
        status: "pending",
      });

      if (error) {
        console.error(
          "Error submitting accommodation notification request:",
          error,
        );
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error("Error in requestAccommodationNotification:", {
        message: error instanceof Error ? error.message : String(error),
        code: error?.code,
        details: error?.details
      });
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to submit notification request",
      };
    }
  }

  /**
   * Submit a notification request for program updates
   */
  static async requestProgramNotification(
    userId: string,
    userEmail: string,
    universityId: string,
    universityName: string,
    programId?: string,
    programName?: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.from("notification_requests").insert({
        user_id: userId,
        user_email: userEmail,
        notification_type: "program",
        university_id: universityId,
        university_name: universityName,
        program_id: programId,
        program_name: programName,
        message: `User requested notification for program updates at ${universityName}${programName ? ` for ${programName}` : ""}`,
        status: "pending",
      });

      if (error) {
        console.error("Error submitting program notification request:", {
          message: error.message || String(error),
          code: error.code,
          details: error.details
        });
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error("Error in requestProgramNotification:", {
        message: error instanceof Error ? error.message : String(error),
        code: error?.code,
        details: error?.details
      });
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to submit notification request",
      };
    }
  }

  /**
   * Check if user already has a pending notification request
   */
  static async hasExistingRequest(
    userId: string,
    notificationType: "accommodation" | "program",
    universityId: string,
    programId?: string,
  ): Promise<{ exists: boolean; error?: string }> {
    try {
      let query = supabase
        .from("notification_requests")
        .select("id")
        .eq("user_id", userId)
        .eq("notification_type", notificationType)
        .eq("university_id", universityId)
        .eq("status", "pending");

      if (programId) {
        query = query.eq("program_id", programId);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error checking existing notification request:", {
          message: error.message || String(error),
          code: error.code,
          details: error.details
        });
        return { exists: false, error: error.message };
      }

      return { exists: (data?.length || 0) > 0 };
    } catch (error) {
      console.error("Error in hasExistingRequest:", {
        message: error instanceof Error ? error.message : String(error),
        code: error?.code,
        details: error?.details
      });
      return {
        exists: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to check existing request",
      };
    }
  }

  /**
   * Get user's notification requests
   */
  static async getUserNotificationRequests(
    userId: string,
  ): Promise<{ requests: NotificationRequest[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from("notification_requests")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching user notification requests:", {
          message: error.message || String(error),
          code: error.code,
          details: error.details
        });
        return { requests: [], error: error.message };
      }

      return { requests: data || [] };
    } catch (error) {
      console.error("Error in getUserNotificationRequests:", {
        message: error instanceof Error ? error.message : String(error),
        code: error?.code,
        details: error?.details
      });
      return {
        requests: [],
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch notification requests",
      };
    }
  }

  /**
   * Cancel a notification request
   */
  static async cancelNotificationRequest(
    requestId: string,
    userId: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from("notification_requests")
        .update({ status: "cancelled" })
        .eq("id", requestId)
        .eq("user_id", userId);

      if (error) {
        console.error("Error cancelling notification request:", {
          message: error.message || String(error),
          code: error.code,
          details: error.details
        });
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error("Error in cancelNotificationRequest:", {
        message: error instanceof Error ? error.message : String(error),
        code: error?.code,
        details: error?.details
      });
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to cancel notification request",
      };
    }
  }
}

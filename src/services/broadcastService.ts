import { supabase } from "@/integrations/supabase/client";
import { Broadcast } from "@/types/broadcast"; // Ensure this type is updated as well

// Circuit breaker to prevent spam errors
let circuitBreakerState = {
  isOpen: false,
  failureCount: 0,
  lastFailure: 0,
  cooldownPeriod: 300000, // 5 minutes
  failureThreshold: 3,
};

const checkCircuitBreaker = (): boolean => {
  if (!circuitBreakerState.isOpen) return true;

  const now = Date.now();
  if (
    now - circuitBreakerState.lastFailure >
    circuitBreakerState.cooldownPeriod
  ) {
    // Reset circuit breaker after cooldown
    circuitBreakerState.isOpen = false;
    circuitBreakerState.failureCount = 0;
    console.log(
      "📢 [BroadcastService] Circuit breaker reset - retrying broadcasts",
    );
    return true;
  }

  return false;
};

const recordFailure = (): void => {
  circuitBreakerState.failureCount++;
  circuitBreakerState.lastFailure = Date.now();

  if (
    circuitBreakerState.failureCount >= circuitBreakerState.failureThreshold
  ) {
    circuitBreakerState.isOpen = true;
    console.warn(
      "📢 [BroadcastService] Circuit breaker opened - disabling broadcasts for 5 minutes due to repeated failures",
    );
  }
};

const recordSuccess = (): void => {
  circuitBreakerState.failureCount = 0;
  if (circuitBreakerState.isOpen) {
    circuitBreakerState.isOpen = false;
    console.log(
      "📢 [BroadcastService] Circuit breaker closed - broadcasts restored",
    );
  }
};

// Helper to map Supabase broadcast to our Broadcast type
const mapSupabaseBroadcast = (sbBroadcast: any): Broadcast => ({
  id: sbBroadcast.id,
  title: sbBroadcast.title,
  message: sbBroadcast.message,
  type: sbBroadcast.type,
  priority: sbBroadcast.priority,
  targetAudience: sbBroadcast.target_audience,
  active: sbBroadcast.active,
  createdBy: sbBroadcast.created_by,
  createdAt: sbBroadcast.created_at,
  expiresAt: sbBroadcast.expires_at,
});

export const broadcastService = {
  createBroadcast: async (
    broadcastData: Omit<Broadcast, "id" | "createdAt" | "updatedAt">,
  ): Promise<Broadcast> => {
    try {
      const { data, error } = await supabase
        .from("broadcasts")
        .insert([
          {
            title: broadcastData.title,
            message: broadcastData.message,
            type: broadcastData.type,
            priority: broadcastData.priority,
            target_audience: broadcastData.targetAudience,
            active: broadcastData.active,
            created_by: broadcastData.createdBy,
            expires_at: broadcastData.expiresAt,
          },
        ])
        .select()
        .single();

      if (error) {
        const errorMessage = error.message || "Unknown error";
        console.error("Error creating broadcast:", {
          message: errorMessage,
          code: error.code,
          details: error.details,
        });
        throw new Error(`Failed to create broadcast: ${errorMessage}`);
      }
      if (!data) {
        throw new Error("No data returned after creating broadcast");
      }
      return mapSupabaseBroadcast(data);
    } catch (error) {
      console.error("Broadcast creation failed:", error);
      throw error instanceof Error
        ? error
        : new Error("Unknown error occurred");
    }
  },

  getBroadcasts: async (): Promise<Broadcast[]> => {
    try {
      const { data, error } = await supabase
        .from("broadcasts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        const errorMessage = error.message || "Unknown error";
        console.error("Error fetching broadcasts:", {
          message: errorMessage,
          code: error.code,
          details: error.details,
        });
        return [];
      }
      return data?.map(mapSupabaseBroadcast) || [];
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("Failed to fetch broadcasts:", errorMessage);
      return [];
    }
  },

  getActiveBroadcasts: async (): Promise<Broadcast[]> => {
    try {
      const { data, error } = await supabase
        .from("broadcasts")
        .select("*")
        .eq("active", true)
        .or("expires_at.is.null,expires_at.gt.now()")
        .order("priority", { ascending: false }) // Ensure priority enum matches DB
        .order("created_at", { ascending: false });

      if (error) {
        const errorMessage = error.message || "Unknown error";
        console.error("Error fetching active broadcasts:", {
          message: errorMessage,
          code: error.code,
          details: error.details,
        });
        return [];
      }
      return data?.map(mapSupabaseBroadcast) || [];
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("Failed to fetch active broadcasts:", errorMessage);
      return [];
    }
  },

  updateBroadcast: async (
    id: string,
    updates: Partial<
      Omit<Broadcast, "id" | "createdAt" | "createdBy" | "updatedAt">
    >,
  ): Promise<Broadcast> => {
    try {
      const updateData: any = {};
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.message !== undefined) updateData.message = updates.message;
      if (updates.type !== undefined) updateData.type = updates.type;
      if (updates.priority !== undefined)
        updateData.priority = updates.priority;
      if (updates.targetAudience !== undefined)
        updateData.target_audience = updates.targetAudience;
      if (updates.active !== undefined) updateData.active = updates.active;
      if (updates.expiresAt !== undefined)
        updateData.expires_at = updates.expiresAt;
      // created_by should not be updatable here

      const { data, error } = await supabase
        .from("broadcasts")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Error updating broadcast:", error);
        throw new Error(`Failed to update broadcast: ${error.message}`);
      }
      if (!data) {
        throw new Error("No data returned after updating broadcast");
      }
      return mapSupabaseBroadcast(data);
    } catch (error) {
      console.error("Broadcast update failed:", error);
      throw error instanceof Error
        ? error
        : new Error("Unknown error occurred");
    }
  },

  deleteBroadcast: async (id: string): Promise<void> => {
    try {
      const { error } = await supabase.from("broadcasts").delete().eq("id", id);

      if (error) {
        console.error("Error deleting broadcast:", error);
        throw new Error(`Failed to delete broadcast: ${error.message}`);
      }
    } catch (error) {
      console.error("Broadcast deletion failed:", error);
      throw error instanceof Error
        ? error
        : new Error("Unknown error occurred");
    }
  },

  // --- New functions for BroadcastManager ---
  getLatestBroadcast: async (): Promise<Broadcast | null> => {
    // Check circuit breaker - if open, don't attempt the request
    if (!checkCircuitBreaker()) {
      return null;
    }

    // Check if broadcasts are disabled/available
    if (
      typeof window !== "undefined" &&
      localStorage.getItem("broadcasts_disabled") === "true"
    ) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from("broadcasts")
        .select("*")
        .eq("active", true)
        .or("expires_at.is.null,expires_at.gt.now()")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        recordFailure();

        // Check for table not found error and disable broadcasts for this session
        if (
          error.code === "42P01" ||
          error.message?.includes('relation "public.broadcasts" does not exist')
        ) {
          if (typeof window !== "undefined") {
            localStorage.setItem("broadcasts_disabled", "true");
          }
          return null;
        }

        // Log error only if circuit breaker allows it
        if (circuitBreakerState.failureCount <= 2) {
          const errorDetails = {
            message: error.message || "Unknown error",
            code: error.code || "NO_CODE",
            details: error.details || "No details",
            hint: error.hint || "No hint",
          };
          console.error("Error fetching latest broadcast:", errorDetails);
        }

        return null;
      }

      // Record success
      recordSuccess();

      return data ? mapSupabaseBroadcast(data) : null;
    } catch (error) {
      recordFailure();

      // Log error only if circuit breaker allows it
      if (circuitBreakerState.failureCount <= 2) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error("Failed to fetch latest broadcast:", errorMessage);
      }

      return null;
    }
  },

  hasBroadcastBeenViewed: async (
    userId: string,
    broadcastId: string,
  ): Promise<boolean> => {
    // This needs a mechanism to store viewed broadcasts per user.
    // E.g., a 'user_viewed_broadcasts' table or using local storage for guests.
    // For now, we'll simulate with localStorage for simplicity if no user.
    // If there's a user, ideally check a DB table.
    // Let's assume for now a `viewed_broadcasts` table: user_id, broadcast_id, viewed_at
    console.log(
      `Checking if user ${userId} viewed broadcast ${broadcastId}. Placeholder.`,
    );
    // Placeholder: for real implementation, query a table like `user_broadcast_views`
    // const { data, error } = await supabase
    //   .from('user_broadcast_views')
    //   .select('id')
    //   .eq('user_id', userId)
    //   .eq('broadcast_id', broadcastId)
    //   .maybeSingle();
    // return !!data;
    const viewedInStorage = JSON.parse(
      localStorage.getItem("viewedBroadcasts") || "[]",
    );
    if (viewedInStorage.includes(broadcastId)) return true;

    // If a real user, check a (hypothetical) user_broadcast_views table
    // For now, returning false as we don't have this table.
    return false;
  },

  dismissBroadcast: async (
    userId: string,
    broadcastId: string,
  ): Promise<void> => {
    // Mark broadcast as viewed for the user.
    // If guest, could use localStorage. If logged in, update DB.
    console.log(
      `User ${userId} dismissed broadcast ${broadcastId}. Placeholder.`,
    );
    // Placeholder: for real implementation, insert into `user_broadcast_views`
    // await supabase.from('user_broadcast_views').insert([{ user_id: userId, broadcast_id: broadcastId }]);
    const viewedBroadcasts = JSON.parse(
      localStorage.getItem("viewedBroadcasts") || "[]",
    );
    if (!viewedBroadcasts.includes(broadcastId)) {
      viewedBroadcasts.push(broadcastId);
      localStorage.setItem(
        "viewedBroadcasts",
        JSON.stringify(viewedBroadcasts),
      );
    }
  },

  saveBroadcastToNotifications: async (
    broadcast: Broadcast,
    userId: string,
  ): Promise<void> => {
    // Save this broadcast as a notification for the user.
    // This would typically involve inserting into a 'notifications' table.
    try {
      await supabase.from("notifications").insert({
        user_id: userId,
        title: `System Announcement: ${broadcast.title}`,
        message: broadcast.message,
        type: "broadcast", // or map broadcast.type to a notification type
        // You might want to add a link or reference to the broadcast itself
      });
      console.log(
        `Broadcast ${broadcast.id} saved to notifications for user ${userId}`,
      );
    } catch (error) {
      console.error(
        `Failed to save broadcast ${broadcast.id} to notifications for user ${userId}:`,
        error,
      );
    }
  },
};

// Named exports for backward compatibility and new functions
export const {
  createBroadcast,
  getBroadcasts,
  getActiveBroadcasts,
  updateBroadcast,
  deleteBroadcast,
  getLatestBroadcast,
  hasBroadcastBeenViewed,
  dismissBroadcast,
  saveBroadcastToNotifications,
} = broadcastService;

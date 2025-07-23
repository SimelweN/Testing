import { supabase } from "@/integrations/supabase/client";

export interface ContactMessageData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: "unread" | "read";
  created_at: string;
  updated_at: string;
}

export const submitContactMessage = async (
  messageData: ContactMessageData,
): Promise<void> => {
  try {
    const { error } = await supabase.from("contact_messages").insert({
      name: messageData.name,
      email: messageData.email,
      subject: messageData.subject,
      message: messageData.message,
      status: "unread",
    });

    if (error) {
      console.error("Error submitting contact message:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error in submitContactMessage:", error);
    throw new Error("Failed to submit contact message");
  }
};

export const getAllContactMessages = async (): Promise<ContactMessage[]> => {
  try {
    const { data, error } = await supabase
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      // Handle specific database errors gracefully
      if (error.code === '42P01') {
        // Table doesn't exist - return empty array
        console.log("Contact messages table not found - returning empty array");
        return [];
      } else if (error.code === '42501') {
        // Permission denied - return empty array for non-admin users
        console.log("No permission to access contact messages - returning empty array");
        return [];
      } else {
        console.error("Error fetching contact messages:", error.message);
        return []; // Return empty array instead of throwing
      }
    }

    // Type assertion to ensure status is properly typed
    return (data || []).map((message) => ({
      ...message,
      status: message.status as "unread" | "read",
    }));
  } catch (error) {
    console.error("Error in getAllContactMessages:", error);
    // Return empty array instead of throwing to prevent UI breaks
    return [];
  }
};

export const markMessageAsRead = async (messageId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from("contact_messages")
      .update({
        status: "read",
        updated_at: new Date().toISOString(),
      })
      .eq("id", messageId);

    if (error) {
      console.error("Error marking message as read:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error in markMessageAsRead:", error);
    throw new Error("Failed to mark message as read");
  }
};

export const clearAllMessages = async (): Promise<void> => {
  try {
    console.log("Clearing all contact messages...");

    const { error } = await supabase
      .from("contact_messages")
      .delete()
      .gte("created_at", "1900-01-01"); // This will match all records safely

    if (error) {
      console.error("Error clearing messages:", error.message || String(error));
      throw error;
    }

    console.log("All contact messages cleared successfully");
  } catch (error) {
    console.error(
      "Error in clearAllMessages:",
      error instanceof Error ? error.message : String(error),
    );
    throw new Error("Failed to clear all messages");
  }
};

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import {
  getAllContactMessages,
  markMessageAsRead,
  clearAllMessages,
  ContactMessage,
} from "@/services/contactService";
import { useIsMobile } from "@/hooks/use-mobile";
import { ContactMessageTable } from "./contact/ContactMessageTable";

const AdminContactTab = () => {
  const isMobile = useIsMobile();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log("Loading contact messages...");
      const data = await getAllContactMessages();
      console.log("Loaded messages:", data.length);
      setMessages(data);

      if (data.length === 0) {
        console.log("No contact messages found");
      }
    } catch (error) {
      console.error("Error loading messages:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setError(errorMessage);
      toast.error(`Failed to load contact messages: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (messageId: string) => {
    try {
      await markMessageAsRead(messageId);
      setMessages(
        messages.map((msg) =>
          msg.id === messageId ? { ...msg, status: "read" } : msg,
        ),
      );
      toast.success("Message marked as read");
    } catch (error) {
      console.error("Error marking message as read:", error);
      toast.error("Failed to mark message as read");
    }
  };

  const handleClearAllMessages = async () => {
    if (messages.length === 0) {
      toast.info("No messages to clear");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to clear all ${messages.length} contact messages? This action cannot be undone.`,
    );

    if (!confirmed) return;

    try {
      setIsLoading(true);
      await clearAllMessages();
      setMessages([]);
      toast.success("All contact messages cleared successfully");
    } catch (error) {
      console.error("Error clearing messages:", error);
      toast.error("Failed to clear messages");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-600" />
              <CardTitle>Contact Messages</CardTitle>
            </div>
          {messages.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleClearAllMessages}
              disabled={isLoading}
            >
              Clear All Messages
            </Button>
          )}
        </div>
          <CardDescription>Manage and respond to user inquiries</CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-8">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700 font-medium mb-2">Error loading contact messages:</p>
                <p className="text-red-600 text-sm">{error}</p>
                <Button
                  onClick={loadMessages}
                  variant="outline"
                  size="sm"
                  className="mt-3"
                >
                  Retry
                </Button>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No contact messages yet</p>
            </div>
          ) : (
            <ContactMessageTable
              messages={messages}
              isMobile={isMobile}
              onMarkAsRead={handleMarkAsRead}
            />
          )}
        </CardContent>
      </Card>
  );
};

export default AdminContactTab;

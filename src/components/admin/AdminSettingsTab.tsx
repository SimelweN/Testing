
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { createBroadcast } from "@/services/broadcastService";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Settings, MessageSquare, Megaphone } from "lucide-react";

interface AdminSettingsTabProps {
  broadcastMessage: string;
  setBroadcastMessage: (message: string) => void;
  onSendBroadcast: () => void;
}

const AdminSettingsTab = ({
  broadcastMessage,
  setBroadcastMessage,
  onSendBroadcast,
}: AdminSettingsTabProps) => {
  const { user } = useAuth();
  const [newBroadcast, setNewBroadcast] = useState({
    title: "",
    message: "",
    type: "info" as "info" | "warning" | "success" | "error",
    priority: "normal" as "low" | "normal" | "medium" | "high" | "urgent",
    targetAudience: "all" as "all" | "users" | "admin",
    active: true,
    expiresAt: "",
  });
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateBroadcast = async () => {
    if (!user || !newBroadcast.title.trim() || !newBroadcast.message.trim()) {
      toast.error("Please fill in title and message fields");
      return;
    }

    setIsCreating(true);
    try {
      await createBroadcast({
        title: newBroadcast.title,
        message: newBroadcast.message,
        type: newBroadcast.type,
        priority: newBroadcast.priority,
        targetAudience: newBroadcast.targetAudience,
        active: newBroadcast.active,
        expiresAt: newBroadcast.expiresAt || undefined,
        createdBy: user.id,
      });

      toast.success(
        "Broadcast created successfully! Users will see it when they next visit the site.",
      );

      // Reset form
      setNewBroadcast({
        title: "",
        message: "",
        type: "info",
        priority: "normal",
        targetAudience: "all",
        active: true,
        expiresAt: "",
      });
    } catch (error) {
      console.error("Error creating broadcast:", error);
      toast.error("Failed to create broadcast");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            Create System Broadcast
          </CardTitle>
          <CardDescription>
            Create announcements that appear to users when they visit the site
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="broadcast-title">Title</Label>
              <Input
                id="broadcast-title"
                placeholder="Broadcast title..."
                value={newBroadcast.title}
                onChange={(e) =>
                  setNewBroadcast((prev) => ({
                    ...prev,
                    title: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="broadcast-type">Type</Label>
              <Select
                value={newBroadcast.type}
                onValueChange={(value: "info" | "warning" | "success" | "error") =>
                  setNewBroadcast((prev) => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="broadcast-priority">Priority</Label>
              <Select
                value={newBroadcast.priority}
                onValueChange={(value: "low" | "normal" | "medium" | "high" | "urgent") =>
                  setNewBroadcast((prev) => ({ ...prev, priority: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="broadcast-audience">Target Audience</Label>
              <Select
                value={newBroadcast.targetAudience}
                onValueChange={(value: "all" | "users" | "admin") =>
                  setNewBroadcast((prev) => ({
                    ...prev,
                    targetAudience: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="users">Registered Users Only</SelectItem>
                  <SelectItem value="admin">Admin Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="broadcast-expires">Expires At (Optional)</Label>
            <Input
              id="broadcast-expires"
              type="datetime-local"
              value={newBroadcast.expiresAt}
              onChange={(e) =>
                setNewBroadcast((prev) => ({
                  ...prev,
                  expiresAt: e.target.value,
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="broadcast-message">Message</Label>
            <Textarea
              id="broadcast-message"
              placeholder="Enter broadcast message..."
              className="min-h-[100px]"
              rows={4}
              value={newBroadcast.message}
              onChange={(e) =>
                setNewBroadcast((prev) => ({
                  ...prev,
                  message: e.target.value,
                }))
              }
            />
          </div>

          <Button
            onClick={handleCreateBroadcast}
            disabled={
              isCreating ||
              !newBroadcast.title.trim() ||
              !newBroadcast.message.trim()
            }
            className="w-full md:w-auto"
          >
            {isCreating ? "Creating..." : "Create Broadcast"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Direct Notifications
          </CardTitle>
          <CardDescription>
            Send immediate notifications to all registered users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <Label htmlFor="direct-message">Message</Label>
              <Textarea
                id="direct-message"
                placeholder="Enter message to send as notification to all users..."
                className="min-h-[100px]"
                rows={4}
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
              />
            </div>
            <Button
              onClick={onSendBroadcast}
              className="w-full md:w-auto md:self-start"
            >
              Send as Notification
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Site Configuration
          </CardTitle>
          <CardDescription>
            Manage site-wide settings and features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm">Auto-approve new listings</span>
              <Badge variant="default" className="text-xs">
                Enabled
              </Badge>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm">User registration</span>
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0 md:h-8 md:w-auto md:px-2"
              >
                <Settings className="h-3 w-3 md:h-4 md:w-4" />
              </Button>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm">Maximum images per listing</span>
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0 md:h-8 md:w-auto md:px-2"
              >
                <Settings className="h-3 w-3 md:h-4 md:w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettingsTab;

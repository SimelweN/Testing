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
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { MessageSquare } from "lucide-react";



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
  const [isTesting, setIsTesting] = useState(false);


  const handleTestBroadcastPolicies = async () => {
    setIsTesting(true);
    try {
      // First check admin status
      const adminStatus = await checkCurrentUserAdminStatus();
      console.log("Current user admin status:", adminStatus);

      if (!adminStatus.isAuthenticated) {
        toast.error("You must be logged in to test broadcast policies");
        return;
      }

      if (!adminStatus.isAdmin) {
        toast.warning("You don't appear to have admin privileges. Testing policies anyway...");
      }

      // Run the policy test
      const result = await testAndFixBroadcastPolicies();

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
        console.error("Policy test details:", result.details);
      }

    } catch (error) {
      console.error("Error testing broadcast policies:", error);
      toast.error("Failed to test broadcast policies");
    } finally {
      setIsTesting(false);
    }
  };

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








    </div>
  );
};

export default AdminSettingsTab;

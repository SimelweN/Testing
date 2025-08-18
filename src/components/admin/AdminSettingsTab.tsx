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

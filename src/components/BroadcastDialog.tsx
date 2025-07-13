import { Broadcast } from "@/types/broadcast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Megaphone, AlertTriangle, Info, Zap } from "lucide-react";

interface BroadcastDialogProps {
  broadcast: Broadcast;
  isOpen: boolean;
  onDismiss: () => void;
}

const BroadcastDialog = ({
  broadcast,
  isOpen,
  onDismiss,
}: BroadcastDialogProps) => {
  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "urgent":
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case "high":
        return <Zap className="h-5 w-5 text-orange-500" />;
      case "normal":
        return <Megaphone className="h-5 w-5 text-blue-500" />;
      case "low":
        return <Info className="h-5 w-5 text-gray-500" />;
      default:
        return <Megaphone className="h-5 w-5 text-blue-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "border-red-200 bg-red-50";
      case "high":
        return "border-orange-200 bg-orange-50";
      case "normal":
        return "border-blue-200 bg-blue-50";
      case "low":
        return "border-gray-200 bg-gray-50";
      default:
        return "border-blue-200 bg-blue-50";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onDismiss}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getPriorityIcon(broadcast.priority)}
            {broadcast.title}
          </DialogTitle>
          <DialogDescription>
            System announcement •{" "}
            {new Date(broadcast.createdAt).toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>

        <Alert className={getPriorityColor(broadcast.priority)}>
          <AlertDescription className="text-sm leading-relaxed">
            {broadcast.message}
          </AlertDescription>
        </Alert>

        {broadcast.expiresAt && (
          <p className="text-xs text-gray-500 text-center">
            This message expires on{" "}
            {new Date(broadcast.expiresAt).toLocaleDateString()}
          </p>
        )}

        <DialogFooter>
          <Button onClick={onDismiss} className="w-full">
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BroadcastDialog;

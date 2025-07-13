import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Clock, CheckCircle, Eye, Copy } from "lucide-react";
import { ContactMessage } from "@/services/contactService";
import { copyEmailToClipboard } from "@/utils/emailCopyUtils";

interface ContactMessageCardProps {
  message: ContactMessage;
  isMobile: boolean;
  onMarkAsRead: (messageId: string) => void;
}

export const ContactMessageCard = ({
  message,
  isMobile,
  onMarkAsRead,
}: ContactMessageCardProps) => {
  return (
    <div className="flex justify-end gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={() => copyEmailToClipboard(message.email)}
        title="Copy Email Address"
      >
        <Copy className="h-4 w-4" />
        {!isMobile && <span className="ml-1">Copy Email</span>}
      </Button>

      <Dialog>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline">
            <Eye className="h-4 w-4" />
            {!isMobile && <span className="ml-1">View</span>}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Contact Message Details</DialogTitle>
            <DialogDescription>
              From {message.name} ({message.email})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <strong>Subject:</strong> {message.subject}
            </div>
            <div>
              <strong>Date:</strong>{" "}
              {new Date(message.created_at).toLocaleString()}
            </div>
            <div>
              <strong>Message:</strong>
              <ScrollArea className="h-40 w-full border rounded p-3 mt-2">
                <div className="whitespace-pre-wrap break-words">
                  {message.message}
                </div>
              </ScrollArea>
            </div>
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => copyEmailToClipboard(message.email)}
                className="flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                Copy Email Address
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {message.status === "unread" && (
        <Button size="sm" onClick={() => onMarkAsRead(message.id)}>
          <CheckCircle className="h-4 w-4" />
          {!isMobile && <span className="ml-1">Mark Read</span>}
        </Button>
      )}
    </div>
  );
};

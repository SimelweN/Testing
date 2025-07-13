import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Clock, CheckCircle } from "lucide-react";
import { ContactMessage } from "@/services/contactService";
import { ContactMessageCard } from "./ContactMessageCard";

interface ContactMessageTableProps {
  messages: ContactMessage[];
  isMobile: boolean;
  onMarkAsRead: (messageId: string) => void;
}

export const ContactMessageTable = ({
  messages,
  isMobile,
  onMarkAsRead,
}: ContactMessageTableProps) => {
  const truncateMessage = (message: string, maxLength: number = 100) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + "...";
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs md:text-sm">Status</TableHead>
            <TableHead className="text-xs md:text-sm">Name</TableHead>
            <TableHead className="text-xs md:text-sm">Email</TableHead>
            <TableHead className="text-xs md:text-sm">Subject</TableHead>
            <TableHead className="text-xs md:text-sm">Preview</TableHead>
            <TableHead className="text-xs md:text-sm">Date</TableHead>
            <TableHead className="text-xs md:text-sm text-right">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {messages.map((message) => (
            <TableRow key={message.id}>
              <TableCell>
                <Badge
                  variant={
                    message.status === "unread" ? "destructive" : "secondary"
                  }
                >
                  {message.status === "unread" ? (
                    <Clock className="h-3 w-3 mr-1" />
                  ) : (
                    <CheckCircle className="h-3 w-3 mr-1" />
                  )}
                  {message.status}
                </Badge>
              </TableCell>
              <TableCell className="text-xs md:text-sm font-medium">
                {message.name}
              </TableCell>
              <TableCell className="text-xs md:text-sm">
                <div className="max-w-[150px] truncate">{message.email}</div>
              </TableCell>
              <TableCell className="text-xs md:text-sm">
                <div className="max-w-[200px] truncate">{message.subject}</div>
              </TableCell>
              <TableCell className="text-xs md:text-sm">
                <div className="max-w-[200px] break-words">
                  {truncateMessage(message.message)}
                </div>
              </TableCell>
              <TableCell className="text-xs md:text-sm">
                {new Date(message.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right">
                <ContactMessageCard
                  message={message}
                  isMobile={isMobile}
                  onMarkAsRead={onMarkAsRead}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { submitBookReport } from "@/services/reportService";
import { toast } from "sonner";

interface ReportBookDialogProps {
  isOpen: boolean;
  onClose: () => void;
  bookId: string;
  bookTitle: string;
  sellerId?: string;
  sellerName?: string;
}

const ReportBookDialog = ({
  isOpen,
  onClose,
  bookId,
  bookTitle,
  sellerId,
  sellerName,
}: ReportBookDialogProps) => {
  const { user } = useAuth();
  const [reason, setReason] = useState("");
  const [category, setCategory] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      toast.error("You must be logged in to report a listing");
      return;
    }

    if (!category || !reason.trim()) {
      toast.error("Please select a category and provide a reason");
      return;
    }

    if (!sellerId || !sellerName) {
      toast.error("Seller information not available");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitBookReport({
        reportedUserId: sellerId,
        reporterUserId: user.id,
        bookId,
        bookTitle,
        sellerName,
        reason: `${category}: ${reason}`,
      });

      toast.success("Report submitted successfully");
      onClose();
      setReason("");
      setCategory("");
    } catch (error) {
      console.error("Error submitting report:", error);
      toast.error("Failed to submit report");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] max-w-[90vw] sm:max-w-md mx-auto my-auto">
        <DialogHeader>
          <DialogTitle>Report Book Listing</DialogTitle>
          <DialogDescription>
            Help us maintain a safe marketplace by reporting inappropriate
            content or suspicious activity.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Book Title</Label>
            <p className="text-sm text-gray-600">{bookTitle}</p>
          </div>

          <div>
            <Label>Seller</Label>
            <p className="text-sm text-gray-600">{sellerName || "Unknown"}</p>
          </div>

          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  key="inappropriate-content"
                  value="inappropriate-content"
                >
                  Inappropriate Content
                </SelectItem>
                <SelectItem key="misleading-info" value="misleading-info">
                  Misleading Information
                </SelectItem>
                <SelectItem key="counterfeit" value="counterfeit">
                  Counterfeit/Fake Book
                </SelectItem>
                <SelectItem key="overpriced" value="overpriced">
                  Unreasonably Overpriced
                </SelectItem>
                <SelectItem key="duplicate" value="duplicate">
                  Duplicate Listing
                </SelectItem>
                <SelectItem key="spam" value="spam">
                  Spam
                </SelectItem>
                <SelectItem key="other" value="other">
                  Other
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="reason">Additional Details</Label>
            <Textarea
              id="reason"
              placeholder="Please provide specific details about why you're reporting this listing..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!category || !reason.trim() || isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReportBookDialog;

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertTriangle, Loader2, Star } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface DeleteProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const DeleteProfileDialog = ({ isOpen, onClose }: DeleteProfileDialogProps) => {
  const { user, profile } = useAuth();
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [step, setStep] = useState<"confirm" | "feedback">("confirm");

  // Feedback form state
  const [rating, setRating] = useState<number>(0);
  const [reason, setReason] = useState("");
  const [feedback, setFeedback] = useState("");

  const handleConfirmDelete = () => {
    if (!user || confirmText !== "DELETE") {
      toast.error("Please type 'DELETE' to confirm");
      return;
    }
    setStep("feedback");
  };

  const handleFinalDelete = async () => {
    setIsDeleting(true);
    try {
      // Submit feedback to admin (would be stored in database)
      const feedbackData = {
        userId: user?.id,
        userName: profile?.name || "Anonymous",
        rating,
        reason,
        feedback,
        deletedAt: new Date().toISOString(),
      };

      // Store feedback for admin dashboard (placeholder - would be actual API call)
      console.log("Feedback data for admin:", feedbackData);

      // Here you would implement the actual profile deletion logic
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast.success(
        "Profile deletion request submitted. Thank you for your feedback. You will receive an email confirmation.",
      );
      onClose();

      // Reset form
      setConfirmText("");
      setStep("confirm");
      setRating(0);
      setReason("");
      setFeedback("");
    } catch (error) {
      toast.error("Failed to delete profile. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (isDeleting) return;
    onClose();
    setStep("confirm");
    setConfirmText("");
    setRating(0);
    setReason("");
    setFeedback("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md w-[95vw] max-w-[95vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            {step === "confirm" ? "Delete Profile" : "Feedback (Optional)"}
          </DialogTitle>
          <DialogDescription>
            {step === "confirm"
              ? "This action cannot be undone. This will permanently delete your account and remove all your data from our servers."
              : "Help us improve by sharing your feedback (optional)."}
          </DialogDescription>
        </DialogHeader>

        {step === "confirm" ? (
          <div className="space-y-4">
            <div className="bg-red-50 p-3 rounded-lg border border-red-200">
              <p className="text-sm text-red-800 font-semibold mb-2">
                What will be deleted:
              </p>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• Your profile and account information</li>
                <li>• All your book listings</li>
                <li>• Your transaction history</li>
                <li>• Your saved addresses</li>
                <li>• All notifications and messages</li>
              </ul>
            </div>

            <p className="text-sm text-gray-600">
              Please type <strong>DELETE</strong> to confirm you want to
              permanently delete your account.
            </p>

            <div className="space-y-2">
              <Label htmlFor="confirm-delete">Type 'DELETE' to confirm</Label>
              <Input
                id="confirm-delete"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                className="font-mono"
                disabled={isDeleting}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Rate your experience with ReBooked Marketplace (1-5 stars)
              </Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1"
                  >
                    <Star
                      className={`h-6 w-6 ${
                        star <= rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">
                Why are you leaving?
              </Label>
              <RadioGroup value={reason} onValueChange={setReason}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="not-useful" id="not-useful" />
                  <Label htmlFor="not-useful" className="text-sm">
                    Not useful for my needs
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="too-complex" id="too-complex" />
                  <Label htmlFor="too-complex" className="text-sm">
                    Too complex to use
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="poor-service" id="poor-service" />
                  <Label htmlFor="poor-service" className="text-sm">
                    Poor customer service
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value="found-alternative"
                    id="found-alternative"
                  />
                  <Label htmlFor="found-alternative" className="text-sm">
                    Found a better alternative
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value="privacy-concerns"
                    id="privacy-concerns"
                  />
                  <Label htmlFor="privacy-concerns" className="text-sm">
                    Privacy concerns
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="other" id="other" />
                  <Label htmlFor="other" className="text-sm">
                    Other
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label
                htmlFor="feedback"
                className="text-sm font-medium mb-2 block"
              >
                Additional feedback (optional)
              </Label>
              <Textarea
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Tell us how we could improve..."
                className="min-h-[80px]"
                maxLength={500}
              />
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isDeleting}>
            Cancel
          </Button>
          {step === "confirm" ? (
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={confirmText !== "DELETE" || isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Continue
            </Button>
          ) : (
            <Button
              variant="destructive"
              onClick={handleFinalDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Delete Profile
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteProfileDialog;

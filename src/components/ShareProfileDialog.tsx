import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Share2, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface ShareProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  isOwnProfile: boolean;
}

const ShareProfileDialog = ({
  isOpen,
  onClose,
  userId,
  userName,
  isOwnProfile,
}: ShareProfileDialogProps) => {
  const profileUrl = `${window.location.origin}/user/${userId}`;

  const copyProfileLink = () => {
    navigator.clipboard.writeText(profileUrl);
    toast.success("Profile link copied to clipboard!");
  };

  const shareToSocial = (platform: string) => {
    const text = `Check out ${userName}'s textbook listings on Rebooked Solutions!`;

    let shareUrl = "";

    switch (platform) {
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(profileUrl)}`;
        break;
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}`;
        break;
      case "whatsapp":
        shareUrl = `https://wa.me/?text=${encodeURIComponent(text + " " + profileUrl)}`;
        break;
      case "instagram": {
        // Instagram doesn't support direct URL sharing, so we copy the text and URL
        const instagramText = `${text}\n\n${profileUrl}`;
        navigator.clipboard.writeText(instagramText);
        toast.success(
          "Text and link copied! Paste it in your Instagram story or post.",
        );
        return;
      }
      default:
        return;
    }

    window.open(shareUrl, "_blank", "width=600,height=400");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Share2 className="h-5 w-5 text-book-600 mr-2" />
            Share Profile
          </DialogTitle>
          <DialogDescription>
            Share {isOwnProfile ? "your" : `${userName}'s`} profile to boost{" "}
            {isOwnProfile ? "your" : "their"} chances of hitting a sale :)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium mb-2 block">
              Profile Link
            </Label>
            <div className="flex items-center space-x-2">
              <Input readOnly value={profileUrl} className="flex-1 text-sm" />
              <Button variant="outline" size="sm" onClick={copyProfileLink}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 block">
              Share on Social Media
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() => shareToSocial("twitter")}
                className="flex items-center justify-center"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Twitter
              </Button>
              <Button
                variant="outline"
                onClick={() => shareToSocial("facebook")}
                className="flex items-center justify-center"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Facebook
              </Button>
              <Button
                variant="outline"
                onClick={() => shareToSocial("whatsapp")}
                className="flex items-center justify-center"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                WhatsApp
              </Button>
              <Button
                variant="outline"
                onClick={() => shareToSocial("instagram")}
                className="flex items-center justify-center"
              >
                <Copy className="h-4 w-4 mr-2" />
                Instagram
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShareProfileDialog;

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
  const profileUrl = `${window.location.origin}/seller/${userId}`;

      const copyProfileLink = () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(profileUrl);
        toast.success("Profile link copied! 📋 Share it everywhere to sell faster!");
      } else {
        // Fallback for environments where clipboard API is restricted
        const textArea = document.createElement('textarea');
        textArea.value = profileUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
        toast.success("Profile link copied! 📋 Share it everywhere to sell faster!");
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      toast.error("Couldn't copy link automatically. Please copy it manually from the input field.");
    }
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
        try {
          if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(instagramText);
          } else {
            // Fallback for restricted environments
            const textArea = document.createElement('textarea');
            textArea.value = instagramText;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            document.execCommand('copy');
            textArea.remove();
          }
          toast.success(
            "Text and link copied! Paste it in your Instagram story or post.",
          );
        } catch (error) {
          console.error('Failed to copy Instagram text:', error);
          toast.success("Opening Instagram... You can manually copy the profile link from above!");
        }
        return;
      }
      default:
        return;
    }

        window.open(shareUrl, "_blank", "width=600,height=400");
    toast.success("Great! 🚀 Sharing your profile helps sell books faster!");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] max-w-[90vw] sm:max-w-md mx-auto my-auto">
                <DialogHeader>
          <DialogTitle className="flex items-center">
            <Share2 className="h-5 w-5 text-book-600 mr-2" />
            Share {isOwnProfile ? "Your" : `${userName}'s`} ReBooked Mini Page
          </DialogTitle>
                    <DialogDescription>
            {isOwnProfile ? (
              <div className="space-y-2">
                <div>🚀 Share your ReBooked Mini page to sell your books faster!</div>
                <div className="text-sm text-gray-600">Post it on social media, send to classmates, or share in study groups - the more people see your books, the quicker they'll sell.</div>
              </div>
            ) : (
              <>Help {userName} sell their books by sharing their ReBooked Mini page!</>
            )}
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

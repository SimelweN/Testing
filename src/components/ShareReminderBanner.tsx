import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Share2, X } from 'lucide-react';

interface ShareReminderBannerProps {
  userId: string;
  userName: string;
  onShare: () => void;
}

const ShareReminderBanner = ({ userId, userName, onShare }: ShareReminderBannerProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
        // Check if user has dismissed this banner recently
    let dismissed;
    try {
      dismissed = localStorage.getItem('shareReminderDismissed');
    } catch (error) {
      dismissed = null;
    }
    const now = Date.now();
    
    if (dismissed && now - parseInt(dismissed) < 86400000) { // 24 hours
      return;
    }

    // Show banner randomly (30% chance) when component mounts
    if (Math.random() < 0.3) {
      setIsVisible(true);
    }
  }, []);

    const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    try {
      localStorage.setItem('shareReminderDismissed', Date.now().toString());
    } catch (error) {
      // Silently fail if localStorage is not available
    }
  };

  const handleShare = () => {
    onShare();
    handleDismiss();
  };

  if (!isVisible || isDismissed) {
    return null;
  }

  return (
    <Alert className="bg-gradient-to-r from-book-50 to-blue-50 border-book-200 mb-4">
      <Share2 className="h-4 w-4 text-book-600" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex-1">
          <span className="font-medium text-book-800">
            💡 Tip: Share your ReBooked Mini page to sell books faster!
          </span>
          <p className="text-sm text-book-700 mt-1">
            Post it on social media or send to classmates who might need your books.
          </p>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <Button 
            onClick={handleShare}
            size="sm"
            className="bg-book-600 hover:bg-book-700 text-white"
          >
            Share Now
          </Button>
          <Button 
            onClick={handleDismiss}
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-gray-700 p-1"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default ShareReminderBanner;

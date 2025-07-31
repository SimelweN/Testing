import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import { Sparkles, Share2 } from 'lucide-react';

interface FirstUploadSuccessDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onShareProfile: () => void;
}

const FirstUploadSuccessDialog = ({ isOpen, onClose, onShareProfile }: FirstUploadSuccessDialogProps) => {
  const handleShareAndClose = () => {
    onShareProfile();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] max-w-[90vw] sm:max-w-md mx-auto my-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-green-600">
            <Sparkles className="h-6 w-6 mr-2" />
            Good job!
          </DialogTitle>
          <DialogDescription className="text-base">
            You're one step closer to making money. Share this link on social media to advertise your listings and get them off your hands faster!
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handleShareAndClose} className="bg-book-600 hover:bg-book-700">
            <Share2 className="h-4 w-4 mr-2" />
            Share Profile
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FirstUploadSuccessDialog;


import { Button } from '@/components/ui/button';
import { User, Share2, HelpCircle } from 'lucide-react';

interface ProfileActionsProps {
  onEditProfile: () => void;
  onShareProfile: () => void;
  onBookNotSelling: () => void;
}

const ProfileActions = ({ 
  onEditProfile, 
  onShareProfile, 
  onBookNotSelling 
}: ProfileActionsProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-2 mt-4">
      <Button
        onClick={onEditProfile}
        variant="outline"
        className="border-book-600 text-book-600 hover:bg-book-50 text-sm px-4 py-2 h-9"
        size="sm"
      >
        <User className="h-4 w-4 mr-2" />
        Edit Profile
      </Button>
      
      <Button
        onClick={onShareProfile}
        variant="outline"
        className="border-book-600 text-book-600 hover:bg-book-50 text-sm px-4 py-2 h-9"
        size="sm"
      >
        <Share2 className="h-4 w-4 mr-2" />
        Share Profile
      </Button>
      
      <Button
        onClick={onBookNotSelling}
        className="bg-book-600 hover:bg-book-700 text-white text-sm px-4 py-2 h-9"
        size="sm"
      >
        <HelpCircle className="h-4 w-4 mr-2" />
        Book not selling?
      </Button>
    </div>
  );
};

export default ProfileActions;

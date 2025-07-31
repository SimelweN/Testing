import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, Mail, Package, Truck, Star } from 'lucide-react';

interface PostListingSuccessDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onShareProfile: () => void;
}

const PostListingSuccessDialog = ({
  isOpen,
  onClose,
  onShareProfile
}: PostListingSuccessDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] max-w-[90vw] sm:max-w-md mx-auto my-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-green-600">
            <CheckCircle className="mr-2 h-6 w-6" />
            Listing Created Successfully!
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <h3 className="font-semibold text-lg">What to Expect Next:</h3>
          
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <Mail className="h-5 w-5 text-book-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Watch your email and dashboard</p>
                <p className="text-sm text-gray-600">We'll notify you when someone is interested in your book</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <Package className="h-5 w-5 text-book-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Prepare for collection</p>
                <p className="text-sm text-gray-600">When your book sells, have it ready for pickup or shipping</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <Star className="h-5 w-5 text-book-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Keep it in good condition</p>
                <p className="text-sm text-gray-600">Ensure your book matches the description you provided</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <Truck className="h-5 w-5 text-book-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Shipping instructions</p>
                <p className="text-sm text-gray-600">We'll provide detailed instructions when a sale is confirmed</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Got it
          </Button>
          <Button onClick={onShareProfile} className="bg-book-600 hover:bg-book-700">
            Go to Profile
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PostListingSuccessDialog;

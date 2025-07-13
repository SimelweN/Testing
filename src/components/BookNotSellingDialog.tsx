
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, DollarSign, Camera, MessageSquare, Eye } from 'lucide-react';

interface BookNotSellingDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const BookNotSellingDialog = ({ isOpen, onClose }: BookNotSellingDialogProps) => {
  const tips = [
    {
      icon: <DollarSign className="h-5 w-5 text-green-600" />,
      title: "Competitive Pricing",
      description: "Check similar books and price yours competitively. Consider market demand."
    },
    {
      icon: <Camera className="h-5 w-5 text-blue-600" />,
      title: "High-Quality Photos",
      description: "Upload clear, well-lit photos showing the book's condition from multiple angles."
    },
    {
      icon: <MessageSquare className="h-5 w-5 text-purple-600" />,
      title: "Detailed Description",
      description: "Write a comprehensive description including condition, edition, and any notes."
    },
    {
      icon: <Eye className="h-5 w-5 text-orange-600" />,
      title: "Book Visibility",
      description: "Share your listing on social media or with classmates who might need the book."
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Book Not Selling? Here's What To Do
          </DialogTitle>
          <DialogDescription>
            Follow these proven tips to increase your book's visibility and chances of selling.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {tips.map((tip, index) => (
            <div key={index} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0 w-10 h-10 bg-white rounded-full flex items-center justify-center border">
                {tip.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">{tip.title}</h3>
                <p className="text-gray-600 text-sm">{tip.description}</p>
              </div>
            </div>
          ))}

          <div className="bg-book-50 border border-book-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-book-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-book-800 mb-1">Pro Tip</h4>
                <p className="text-book-700 text-sm">
                  Books typically sell faster at the beginning and end of each semester. 
                  Consider timing your listings accordingly for maximum visibility.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={onClose} className="bg-book-600 hover:bg-book-700">
              Got it, thanks!
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookNotSellingDialog;

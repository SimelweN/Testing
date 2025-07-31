import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { HelpCircle, Share2, Camera, DollarSign, Users, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

const BookNotSellingHelp = () => {
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const handleShareTips = () => {
    const tips = `💡 Book selling tips from ReBooked Marketplace:
1. Take clear, well-lit photos
2. Price competitively 
3. Write detailed descriptions
4. Share your listing on social media
5. Be responsive to inquiries

Visit ReBooked Solutions for great deals on textbooks! 📚`;

    if (navigator.share) {
      navigator.share({
        title: 'Book Selling Tips - ReBooked Marketplace',
        text: tips
      });
    } else {
      navigator.clipboard.writeText(tips);
      toast.success('Tips copied to clipboard!');
    }
  };

  const tips = [
    {
      icon: Camera,
      title: 'Better Photos',
      description: 'Take clear, well-lit photos from multiple angles. Show the cover, spine, and any damage clearly.'
    },
    {
      icon: DollarSign,
      title: 'Competitive Pricing',
      description: 'Research similar books and price yours competitively. Consider the condition and market demand.'
    },
    {
      icon: BookOpen,
      title: 'Detailed Description',
      description: 'Write a thorough description including condition, edition, and any included materials.'
    },
    {
      icon: Share2,
      title: 'Share Your Listing',
      description: 'Share your book listing on social media, study groups, and with classmates who might need it.'
    },
    {
      icon: Users,
      title: 'Be Responsive',
      description: 'Respond quickly to interested buyers and be flexible with meetup arrangements.'
    }
  ];

  return (
    <>
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <HelpCircle className="h-5 w-5 text-amber-600" />
              <span className="text-sm font-medium text-amber-800">
                Book not selling?
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsHelpOpen(true)}
              className="border-amber-600 text-amber-700 hover:bg-amber-100"
            >
              Get Tips
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isHelpOpen} onOpenChange={setIsHelpOpen}>
        <DialogContent className="w-[90vw] max-w-[90vw] sm:max-w-2xl max-h-[85vh] mx-auto my-auto overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-book-600" />
              Book Not Selling? Here's What to Do
            </DialogTitle>
            <DialogDescription>
              Follow these proven tips to increase your chances of selling your books quickly
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {tips.map((tip, index) => (
              <div key={index} className="flex gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-book-100 rounded-lg flex items-center justify-center">
                    <tip.icon className="h-5 w-5 text-book-600" />
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">{tip.title}</h4>
                  <p className="text-sm text-gray-600">{tip.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-blue-900">Share These Tips</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Help other students by sharing these selling tips
                </p>
              </div>
              <Button
                onClick={handleShareTips}
                variant="outline"
                size="sm"
                className="border-blue-600 text-blue-700 hover:bg-blue-100"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share Tips
              </Button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Button
              onClick={() => setIsHelpOpen(false)}
              className="bg-book-600 hover:bg-book-700"
            >
              Got it, thanks!
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BookNotSellingHelp;

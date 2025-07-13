import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  BookOpen,
  Search,
  ShoppingCart,
  Truck,
  DollarSign,
  Share2,
  Package,
  CheckCircle,
  Eye,
  CreditCard,
} from "lucide-react";

interface HowItWorksDialogProps {
  isOpen: boolean;
  onClose: () => void;
  type: "seller" | "buyer";
}

const HowItWorksDialog = ({ isOpen, onClose, type }: HowItWorksDialogProps) => {
  const sellerSteps = [
    {
      icon: <BookOpen className="h-6 w-6 text-book-600" />,
      title: "List Your Book",
      description:
        "Upload a photo, set your price, add course details — and publish!",
    },
    {
      icon: <Search className="h-6 w-6 text-blue-600" />,
      title: "Wait for a Buyer",
      description:
        "Buyers will find your listing and place an order. You'll be notified immediately.",
    },
    {
      icon: <Package className="h-6 w-6 text-orange-600" />,
      title: "Ship the Book",
      description: (
        <div className="space-y-2">
          <p>Use our built-in courier system to get a shipping label.</p>
          <div className="text-sm text-gray-600 space-y-1">
            <p>
              <strong>No printer?</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Print at your campus or library</li>
              <li>Choose "Driver brings label" (if available)</li>
              <li>
                Show the waybill number at a courier branch — they'll print it
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      icon: <DollarSign className="h-6 w-6 text-green-600" />,
      title: "Get Paid",
      description:
        "Once the buyer confirms delivery, your money is sent (minus our 10% commission).",
    },
    {
      icon: <Share2 className="h-6 w-6 text-purple-600" />,
      title: "Boost Your Sales",
      description: "Share your listing and profile for more visibility!",
    },
  ];

  const buyerSteps = [
    {
      icon: <Search className="h-6 w-6 text-blue-600" />,
      title: "Search for Books",
      description: "Browse by course, title, university, or seller.",
    },
    {
      icon: <Eye className="h-6 w-6 text-indigo-600" />,
      title: "Check the Details",
      description: "See the condition, photos, and price before buying.",
    },
    {
      icon: <ShoppingCart className="h-6 w-6 text-orange-600" />,
      title: "Place Your Order",
      description:
        "Checkout with secure payment. You'll receive updates as the book ships.",
    },
    {
      icon: <Truck className="h-6 w-6 text-red-600" />,
      title: "Track Your Delivery",
      description:
        "Use the tracking number from our courier partners to follow the journey.",
    },
    {
      icon: <CheckCircle className="h-6 w-6 text-green-600" />,
      title: "Receive Your Book",
      description: "Confirm when it arrives — then dive into your studies!",
    },
  ];

  const steps = type === "seller" ? sellerSteps : buyerSteps;
  const title =
    type === "seller" ? "How Being a Seller Works" : "How Being a Buyer Works";
  const subtitle =
    type === "seller"
      ? "Turn your old textbooks into cash in a few simple steps:"
      : "Find affordable textbooks with confidence:";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={'max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full"'}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            {type === "seller" ? (
              <DollarSign className="h-6 w-6 text-book-600" />
            ) : (
              <BookOpen className="h-6 w-6 text-book-600" />
            )}
            {title}
          </DialogTitle>
          <DialogDescription className="text-gray-600 text-base">
            {subtitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-6">
          {steps.map((step, index) => (
            <Card
              key={index}
              className="border border-gray-200 hover:border-book-300 transition-colors"
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center border-2 border-gray-200">
                      {step.icon}
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs font-medium">
                        Step {index + 1}
                      </Badge>
                      <h3 className="font-semibold text-gray-900">
                        {step.title}
                      </h3>
                    </div>
                    <div className="text-gray-600 text-sm leading-relaxed">
                      {step.description}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {type === "buyer" && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800 font-medium">
              If there's any issue, we're here to help.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default HowItWorksDialog;

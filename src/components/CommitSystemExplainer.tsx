import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  CheckCircle,
  RefreshCw,
  AlertTriangle,
  HelpCircle,
  User,
  ShoppingCart,
} from "lucide-react";

interface CommitSystemExplainerProps {
  trigger?: React.ReactNode;
  isOpen?: boolean;
  onClose?: () => void;
}

const CommitSystemExplainer = ({
  trigger,
  isOpen,
  onClose,
}: CommitSystemExplainerProps) => {
  const content = (
    <DialogContent className="w-[90vw] max-w-[90vw] sm:max-w-2xl max-h-[85vh] mx-auto my-auto overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-book-600">
          <Clock className="h-5 w-5" />
          How Our Commit System Works
        </DialogTitle>
        <DialogDescription className="text-left">
          Understanding the 48-hour seller commit process for secure
          transactions
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-6">
        {/* Overview */}
        <div className="bg-book-50 p-4 rounded-lg border border-book-200">
          <h3 className="font-semibold text-book-800 mb-2">
            📚 What is the Commit System?
          </h3>
          <p className="text-sm text-book-700">
            Our commit system ensures that book sales are reliable and protects
            both buyers and sellers. When a book is marked as sold, the seller
            has 48 hours to confirm they can fulfill the order.
          </p>
        </div>

        {/* Timeline */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Transaction Timeline
          </h3>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
              <ShoppingCart className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-green-800">
                    Step 1: Book Purchase
                  </span>
                  <Badge variant="outline" className="text-xs">
                    Instant
                  </Badge>
                </div>
                <p className="text-sm text-green-700">
                  Buyer purchases the book and payment is processed securely
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg border-l-4 border-orange-400">
              <Clock className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-orange-800">
                    Step 2: Seller Commit Window
                  </span>
                  <Badge variant="outline" className="text-xs bg-orange-100">
                    48 Hours
                  </Badge>
                </div>
                <p className="text-sm text-orange-700">
                  Seller must click "Commit Sale" to confirm they can fulfill
                  the order
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
              <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-blue-800">
                    Step 3: Order Processing
                  </span>
                  <Badge variant="outline" className="text-xs">
                    After Commit
                  </Badge>
                </div>
                <p className="text-sm text-blue-700">
                  Delivery process begins and courier collection is arranged
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* For Sellers */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <User className="h-4 w-4" />
            For Sellers
          </h3>

          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-4 w-4 text-green-600 mt-1" />
              <div>
                <p className="font-medium text-sm">What you need to do:</p>
                <ul className="text-sm text-gray-600 mt-1 space-y-1">
                  <li>• Click "Commit Sale" within 48 hours</li>
                  <li>• Ensure your book is ready for collection</li>
                  <li>• Be available for courier pickup</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <AlertTriangle className="h-4 w-4 text-red-600 mt-1" />
              <div>
                <p className="font-medium text-sm text-red-700">
                  If you don't commit in time:
                </p>
                <ul className="text-sm text-red-600 mt-1 space-y-1">
                  <li>• Transaction is automatically cancelled</li>
                  <li>• Buyer receives full refund (including delivery fee)</li>
                  <li>• Your book remains available for sale</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* For Buyers */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            For Buyers
          </h3>

          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-4 w-4 text-green-600 mt-1" />
              <div>
                <p className="font-medium text-sm">Your protection:</p>
                <ul className="text-sm text-gray-600 mt-1 space-y-1">
                  <li>• Payment is held securely until seller commits</li>
                  <li>• Automatic refund if seller doesn't commit</li>
                  <li>• Full refund includes delivery fees</li>
                  <li>• No charges if transaction is cancelled</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <RefreshCw className="h-4 w-4 text-blue-600 mt-1" />
              <div>
                <p className="font-medium text-sm">What happens next:</p>
                <ul className="text-sm text-gray-600 mt-1 space-y-1">
                  <li>• You'll get email notifications about the status</li>
                  <li>• Once committed, delivery process begins</li>
                  <li>• Track your order through our dashboard</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="bg-book-50 p-4 rounded-lg border border-book-200">
          <h3 className="font-semibold text-book-800 mb-2">
            🛡️ Why This System Works
          </h3>
          <ul className="text-sm text-book-700 space-y-1">
            <li>
              • <strong>Reduces failed deliveries:</strong> Sellers confirm
              availability before courier dispatch
            </li>
            <li>
              • <strong>Protects buyers:</strong> No payment lost on uncommitted
              sales
            </li>
            <li>
              • <strong>Builds trust:</strong> Only committed sellers proceed
              with orders
            </li>
            <li>
              • <strong>Saves costs:</strong> No wasted courier trips for
              unavailable books
            </li>
          </ul>
        </div>
      </div>
    </DialogContent>
  );

  if (trigger) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        {content}
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {content}
    </Dialog>
  );
};

export default CommitSystemExplainer;

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Clock,
  DollarSign,
  Package,
  AlertTriangle,
  CheckCircle,
  BookOpen,
} from "lucide-react";

interface SellerPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SellerPolicyModal = ({ isOpen, onClose }: SellerPolicyModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] w-[95vw] max-w-[95vw] sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-book-600">
            <Shield className="h-5 w-5" />
            Seller Policy & Platform Rules
          </DialogTitle>
          <DialogDescription>
            Terms and conditions for selling books on ReBooked
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[70vh] pr-4">
          <div className="space-y-6">
            {/* Overview */}
            <div className="bg-book-50 p-4 rounded-lg border border-book-200">
              <h3 className="font-semibold text-book-800 mb-2 flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Welcome to ReBooked Marketplace
              </h3>
              <p className="text-sm text-book-700">
                By listing books on ReBooked, you agree to follow our platform
                rules and provide a reliable service to student buyers. These
                policies protect both buyers and sellers.
              </p>
            </div>

            {/* Seller Responsibilities */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Your Responsibilities as a Seller
              </h3>

              <div className="space-y-3">
                <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-800">
                      Book Condition & Accuracy
                    </span>
                  </div>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• Provide accurate descriptions of book condition</li>
                    <li>• Upload clear, recent photos of the actual book</li>
                    <li>• Ensure the book matches the listing description</li>
                    <li>• Report any damage honestly in the description</li>
                  </ul>
                </div>

                <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-800">
                      48-Hour Commit Rule
                    </span>
                    <Badge variant="outline" className="text-xs">
                      Critical
                    </Badge>
                  </div>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>
                      • Commit to sales within 48 hours of receiving
                      notification
                    </li>
                    <li>• Be available for courier pickup as scheduled</li>
                    <li>
                      • Failure to commit results in automatic cancellation
                    </li>
                    <li>
                      • Repeated failures may result in account restrictions
                    </li>
                  </ul>
                </div>

                <div className="p-3 bg-orange-50 rounded-lg border-l-4 border-orange-400">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-orange-600" />
                    <span className="font-medium text-orange-800">
                      Pickup Requirements
                    </span>
                  </div>
                  <ul className="text-sm text-orange-700 space-y-1">
                    <li>• Maintain a valid pickup address at all times</li>
                    <li>
                      • Be available during standard pickup hours (8 AM - 5 PM)
                    </li>
                    <li>• Package books securely for transport</li>
                    <li>• Hand over books to authorized couriers only</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Pricing and Fees */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Pricing & Fees
              </h3>

              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div>
                  <p className="font-medium text-sm">ReBooked Commission:</p>
                  <p className="text-sm text-gray-600">
                    A small service fee is deducted from your sale amount to
                    cover platform costs and payment processing.
                  </p>
                </div>
                <div>
                  <p className="font-medium text-sm">Pricing Guidelines:</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>
                      • Price books fairly based on condition and market value
                    </li>
                    <li>
                      • Consider the original retail price and current demand
                    </li>
                    <li>• Competitive pricing leads to faster sales</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Prohibited Activities */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Prohibited Activities
              </h3>

              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <div className="space-y-2">
                  <p className="font-medium text-sm text-red-800">
                    The following are strictly prohibited:
                  </p>
                  <ul className="text-sm text-red-700 space-y-1">
                    <li>
                      • Selling counterfeit, stolen, or illegally obtained books
                    </li>
                    <li>• Misrepresenting book condition or content</li>
                    <li>
                      • Direct contact with buyers to circumvent the platform
                    </li>
                    <li>• Listing books you don't physically possess</li>
                    <li>• Price manipulation or false scarcity tactics</li>
                    <li>• Harassment or inappropriate communication</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Account Consequences */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800">
                Account Actions & Consequences
              </h3>

              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <div className="space-y-3">
                  <div>
                    <p className="font-medium text-sm text-yellow-800">
                      Warning System:
                    </p>
                    <p className="text-sm text-yellow-700">
                      Minor violations result in warnings. Multiple warnings may
                      lead to restrictions.
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-yellow-800">
                      Account Restrictions:
                    </p>
                    <p className="text-sm text-yellow-700">
                      Repeated policy violations may result in temporary selling
                      restrictions or account suspension.
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-yellow-800">
                      Appeal Process:
                    </p>
                    <p className="text-sm text-yellow-700">
                      If you believe an action was taken in error, you can
                      appeal through our support system.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Support and Help */}
            <div className="bg-book-50 p-4 rounded-lg border border-book-200">
              <h3 className="font-semibold text-book-800 mb-2">Need Help?</h3>
              <p className="text-sm text-book-700">
                If you have questions about these policies or need assistance
                with your listings, contact our support team through the help
                section in your profile.
              </p>
            </div>

            {/* Agreement */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-700">
                <strong>
                  By checking the agreement box, you confirm that:
                </strong>
              </p>
              <ul className="text-sm text-gray-700 mt-2 space-y-1">
                <li>• You have read and understood these policies</li>
                <li>• You agree to follow all seller requirements</li>
                <li>• You understand the consequences of policy violations</li>
                <li>• You will maintain accurate and up-to-date listings</li>
              </ul>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default SellerPolicyModal;

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertTriangle, CheckCircle, Mail, Package, Truck, Star } from "lucide-react";

interface SellerInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SellerInfoModal = ({
  isOpen,
  onClose,
}: SellerInfoModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] max-w-[90vw] sm:max-w-lg mx-auto my-auto max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-book-600">
            <Clock className="h-5 w-5" />
            Seller Reminders
          </DialogTitle>
          <DialogDescription className="text-left">
            Quick reminders for your book listings
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 48-Hour Commit Rule */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              48-Hour Commit Rule
            </h3>
            
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <p className="font-medium text-orange-800 mb-2">
                    📌 Remember: Quick Response Required
                  </p>
                  <p className="text-sm text-orange-700">
                    When your book sells, you'll have{" "}
                    <strong>48 hours</strong> to confirm the sale. If you do not
                    commit in time, the order will be cancelled and the full
                    amount will be refunded to the buyer.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-800 text-sm">
                  Quick checklist:
                </span>
              </div>
              <ul className="text-xs text-green-700 space-y-1">
                <li>• Check your email and notifications regularly</li>
                <li>• Have your book ready for pickup</li>
                <li>• Be available during pickup hours (8 AM - 5 PM)</li>
              </ul>
            </div>
          </div>

          {/* What to Expect */}
          <div className="space-y-4">
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
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={onClose} className="bg-book-600 hover:bg-book-700">
            Got it
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SellerInfoModal;

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertTriangle, CheckCircle } from "lucide-react";

interface CommitReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "seller" | "buyer";
}

const CommitReminderModal = ({
  isOpen,
  onClose,
  type,
}: CommitReminderModalProps) => {
  if (type === "seller") {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-[90vw] max-w-[90vw] sm:max-w-md mx-auto my-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              <Clock className="h-5 w-5" />
              Important: 48-Hour Commit Rule
            </DialogTitle>
            <DialogDescription className="text-left">
              Please read this important information about your listing
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <p className="font-medium text-orange-800 mb-2">
                    📌 Seller Commitment Required
                  </p>
                  <p className="text-sm text-orange-700">
                    Once your book is sold, you'll have{" "}
                    <strong>48 hours</strong> to confirm the sale. If you do not
                    commit in time, the order will be cancelled and the full
                    amount will be refunded to the buyer.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-book-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  1
                </div>
                <div>
                  <p className="font-medium text-sm">When your book sells:</p>
                  <p className="text-xs text-gray-600">
                    You'll receive an email and platform notification
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-book-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  2
                </div>
                <div>
                  <p className="font-medium text-sm">You have 48 hours:</p>
                  <p className="text-xs text-gray-600">
                    Click "Commit Sale" to confirm you can fulfill the order
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-book-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  3
                </div>
                <div>
                  <p className="font-medium text-sm">After committing:</p>
                  <p className="text-xs text-gray-600">
                    Courier pickup will be arranged for your book
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-red-50 p-3 rounded-lg border border-red-200">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="font-medium text-red-800 text-sm">
                  If you don't commit:
                </span>
              </div>
              <ul className="text-xs text-red-700 space-y-1">
                <li>• Order is automatically cancelled</li>
                <li>• Buyer gets full refund (including delivery)</li>
                <li>• Your book remains available for sale</li>
              </ul>
            </div>

            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-800 text-sm">
                  Make sure you:
                </span>
              </div>
              <ul className="text-xs text-green-700 space-y-1">
                <li>• Check your email and notifications regularly</li>
                <li>• Have your book ready for pickup</li>
                <li>• Are available during pickup hours (8 AM - 5 PM)</li>
              </ul>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={onClose} className="bg-book-600 hover:bg-book-700">
              I Understand
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Buyer version
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] max-w-[90vw] sm:max-w-md mx-auto my-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-600">
            <Clock className="h-5 w-5" />
            Purchase Protection
          </DialogTitle>
          <DialogDescription className="text-left">
            How we protect your purchase
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-800 mb-2">
                  🕒 Seller Confirmation Period
                </p>
                <p className="text-sm text-blue-700">
                  The seller has <strong>48 hours</strong> to confirm your
                  order. If they do not commit within that time, your payment
                  (including delivery) will be fully refunded.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                1
              </div>
              <div>
                <p className="font-medium text-sm">Order placed:</p>
                <p className="text-xs text-gray-600">
                  Your payment is held securely
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                2
              </div>
              <div>
                <p className="font-medium text-sm">Seller has 48 hours:</p>
                <p className="text-xs text-gray-600">
                  To confirm they can fulfill your order
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                3
              </div>
              <div>
                <p className="font-medium text-sm">If confirmed:</p>
                <p className="text-xs text-gray-600">
                  Your book will be shipped to you
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-800 text-sm">
                Your protection:
              </span>
            </div>
            <ul className="text-xs text-green-700 space-y-1">
              <li>• Payment held until seller commits</li>
              <li>• Automatic refund if seller doesn't respond</li>
              <li>• Full refund includes delivery fees</li>
              <li>• Email updates on order status</li>
            </ul>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-xs text-gray-600">
              <strong>What's next?</strong> You'll receive email notifications
              about your order status. Once the seller commits, delivery will
              begin and you'll get tracking information.
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={onClose} className="bg-blue-600 hover:bg-blue-700">
            Got It
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CommitReminderModal;

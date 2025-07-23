import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Package,
  Truck,
  Bell,
  ArrowRight,
  DollarSign,
} from "lucide-react";
import { addNotification } from "@/services/notificationService";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface SaleSuccessPopupProps {
  isOpen: boolean;
  onClose: () => void;
  bookTitle: string;
  bookPrice: number;
  buyerName?: string;
  buyerEmail?: string;
  saleId?: string;
}

const SaleSuccessPopup = ({
  isOpen,
  onClose,
  bookTitle,
  bookPrice,
  buyerName,
  buyerEmail,
  saleId,
}: SaleSuccessPopupProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [isAddingNotification, setIsAddingNotification] = useState(false);


  const steps = [
    {
      icon: <CheckCircle className="h-12 w-12 text-green-500" />,
      title: "🎉 Congratulations! Your book has been sold!",
      description: `"${bookTitle}" sold for R${bookPrice}`,
    },
    {
      icon: <Package className="h-12 w-12 text-blue-500" />,
      title: "📦 Prepare Your Book for Delivery",
      description: "Get your book ready for our courier service",
    },
    {
      icon: <DollarSign className="h-12 w-12 text-green-500" />,
      title: "💰 Payment Processing",
      description: "Payment will be processed manually by administration",
    },
  ];

  const nextSteps = [
    {
      icon: "📦",
      title: "Prepare Your Book",
      description:
        "Ensure the book is in the condition described and package it securely",
      action: "Clean and package the book",
    },
    {
      icon: "🚚",
      title: "Delivery Will Be Arranged",
      description:
        "Our system will handle all delivery logistics automatically",
      action: "Wait for delivery notification",
    },
    {
      icon: "📱",
      title: "Track Progress",
      description: "Monitor delivery status in your notifications",
      action: "Check notification updates",
    },
    {
      icon: "💰",
      title: "Get Paid After Delivery",
      description: `You'll receive R${Math.round(bookPrice * 0.9)} (90%) after delivery confirmation`,
      action: "Payment processed automatically",
    },
  ];

  useEffect(() => {
    if (isOpen && user) {
      // Add immediate notification and initiate buyer contact
      saveNotificationToHistory();
    }
  }, [isOpen, user]);

  const saveNotificationToHistory = async () => {
    if (!user || isAddingNotification) return;

    setIsAddingNotification(true);
    try {
      // Save notification WITHOUT any contact details
      await addNotification({
        userId: user.id,
        title: "🎉 Book Sold Successfully!",
        message: `Your book "${bookTitle}" sold for R${bookPrice}! Delivery will be arranged automatically. You'll receive R${Math.round(bookPrice * 0.9)} (90%) after delivery confirmation.`,
        type: "success",
        read: false,
      });
    } catch (error) {
      console.error("Error saving sale notification:", error);
      // Don't show error to user as this is background operation
    } finally {
      setIsAddingNotification(false);
    }
  };



  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    }
  };

  const handleClose = () => {
    setStep(0);
    onClose();
    toast.success("Sale notification saved to your notifications!");
  };

  const handleViewNotifications = () => {
    handleClose();
    navigate("/notifications");
  };

  const handleViewSale = () => {
    handleClose();
    if (saleId) {
      navigate("/activity");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">{steps[step].title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step Content */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">{steps[step].icon}</div>

            {step === 0 && (
              <div className="space-y-3">
                <p className="text-lg font-semibold text-gray-900">
                  {steps[step].description}
                </p>
                {buyerName && (
                  <Badge variant="outline" className="text-sm">
                    Buyer: {buyerName}
                  </Badge>
                )}
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-800">
                    💰 <strong>R{Math.round(bookPrice * 0.9)}</strong> (90% of R
                    {bookPrice}) will be transferred after delivery confirmation
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    Platform fee: R{bookPrice - Math.round(bookPrice * 0.9)}
                  </p>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <p className="text-gray-600 text-sm">
                  {steps[step].description}
                </p>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Automated Delivery System
                  </h4>
                  <div className="space-y-1 text-sm text-blue-800">
                    <p>• Our system handles all delivery arrangements</p>
                    <p>• No need to contact the buyer directly</p>
                    <p>• You'll be notified of delivery progress</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {nextSteps.map((nextStep, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border"
                    >
                      <span className="text-lg">{nextStep.icon}</span>
                      <div className="flex-1 text-left">
                        <h4 className="font-semibold text-sm">
                          {nextStep.title}
                        </h4>
                        <p className="text-xs text-gray-600">
                          {nextStep.description}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400 mt-1" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <p className="text-gray-600 text-sm">
                  {steps[step].description}
                </p>

                <div className="space-y-3">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Manual Payment Process
                    </h4>
                    <div className="space-y-1 text-sm text-green-800">
                      <p>
                        <strong>Book Price:</strong> R{bookPrice.toFixed(2)}
                      </p>
                      <p>
                        <strong>Payment:</strong> Processed manually by admin
                      </p>
                      <p>
                        <strong>Note:</strong> You'll be contacted for payment details
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-2">
                      Payment Timeline
                    </h4>
                    <div className="space-y-1 text-xs text-blue-800">
                      <p>✅ 1. Book sold and buyer contacted</p>
                      <p>🚚 2. Arrange delivery with buyer</p>
                      <p>📦 3. Confirm delivery completion</p>
                      <p>💰 4. Manual payment by admin (contact for details)</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <p className="text-gray-600 text-sm">
                  {steps[step].description}
                </p>

                <div className="space-y-3">
                  {nextSteps.map((nextStep, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border"
                    >
                      <span className="text-lg">{nextStep.icon}</span>
                      <div className="flex-1 text-left">
                        <h4 className="font-semibold text-sm">
                          {nextStep.title}
                        </h4>
                        <p className="text-xs text-gray-600">
                          {nextStep.description}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400 mt-1" />
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 text-blue-800">
                    <Bell className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      This notification has been saved to your notification
                      history
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {step === 0 && (
              <>
                <Button onClick={handleNext} className="flex-1">
                  See Next Steps
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </>
            )}

            {step === 1 && (
              <>
                <Button
                  variant="outline"
                  onClick={handleViewNotifications}
                  className="flex-1"
                >
                  <Bell className="h-4 w-4 mr-2" />
                  View Notifications
                </Button>
                <Button onClick={handleViewSale} className="flex-1">
                  View Sale Details
                </Button>
              </>
            )}
          </div>

          {step === 1 && (
            <Button
              variant="ghost"
              onClick={handleClose}
              className="w-full text-sm"
            >
              I'll handle this later
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SaleSuccessPopup;

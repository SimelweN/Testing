import { Progress } from "@/components/ui/progress";
import { CheckCircle, Package, MapPin, Truck, CreditCard } from "lucide-react";

type CheckoutStep =
  | "items"
  | "shipping"
  | "delivery"
  | "payment"
  | "confirmation";

interface CheckoutStepsProps {
  currentStep: CheckoutStep;
  onStepClick?: (step: CheckoutStep) => void;
  allowStepNavigation?: boolean;
}

const CheckoutSteps = ({
  currentStep,
  onStepClick,
  allowStepNavigation = false,
}: CheckoutStepsProps) => {
  const steps = [
    {
      id: "items" as CheckoutStep,
      label: "Review Items",
      icon: Package,
      description: "Confirm your order",
    },
    {
      id: "shipping" as CheckoutStep,
      label: "Shipping",
      icon: MapPin,
      description: "Delivery address",
    },
    {
      id: "delivery" as CheckoutStep,
      label: "Delivery",
      icon: Truck,
      description: "Choose method",
    },
    {
      id: "payment" as CheckoutStep,
      label: "Payment",
      icon: CreditCard,
      description: "Complete order",
    },
  ];

  const currentStepIndex = steps.findIndex((step) => step.id === currentStep);
  const progress =
    currentStep === "confirmation"
      ? 100
      : ((currentStepIndex + 1) / steps.length) * 100;

  const handleStepClick = (step: CheckoutStep, index: number) => {
    if (allowStepNavigation && index <= currentStepIndex && onStepClick) {
      onStepClick(step);
    }
  };

  return (
    <div className="w-full">
      {/* Desktop Steps */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between mb-6">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = step.id === currentStep;
            const isCompleted = index < currentStepIndex;
            const isClickable =
              allowStepNavigation && index <= currentStepIndex;

            return (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex flex-col items-center ${isClickable ? "cursor-pointer" : ""}`}
                  onClick={() => handleStepClick(step.id, index)}
                >
                  <div
                    className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-200 ${
                      isCompleted
                        ? "bg-green-600 border-green-600 text-white shadow-lg"
                        : isActive
                          ? "bg-book-600 border-book-600 text-white shadow-lg"
                          : "bg-white border-gray-300 text-gray-400"
                    } ${isClickable ? "hover:scale-105" : ""}`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="h-6 w-6" />
                    ) : (
                      <Icon className="h-6 w-6" />
                    )}
                  </div>
                  <div className="mt-3 text-center">
                    <p
                      className={`text-sm font-medium transition-colors ${
                        isActive
                          ? "text-book-600"
                          : isCompleted
                            ? "text-green-600"
                            : "text-gray-500"
                      }`}
                    >
                      {step.label}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {step.description}
                    </p>
                  </div>
                </div>

                {index < steps.length - 1 && (
                  <div
                    className={`w-24 h-0.5 mx-6 transition-colors ${
                      isCompleted ? "bg-green-600" : "bg-gray-300"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile Steps */}
      <div className="md:hidden mb-6">
        <div className="flex items-center justify-center mb-4">
          <div className="flex items-center">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = index < currentStepIndex;

              return (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors ${
                      isCompleted
                        ? "bg-green-600 border-green-600 text-white"
                        : isActive
                          ? "bg-book-600 border-book-600 text-white"
                          : "bg-gray-100 border-gray-300 text-gray-400"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`w-8 h-0.5 mx-2 ${isCompleted ? "bg-green-600" : "bg-gray-300"}`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900">
            {steps.find((s) => s.id === currentStep)?.label}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Step {currentStepIndex + 1} of {steps.length}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <Progress value={progress} className="h-2 bg-gray-200" />
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>Start</span>
          <span className="font-medium">{progress.toFixed(0)}% Complete</span>
          <span>Finish</span>
        </div>
      </div>
    </div>
  );
};

export default CheckoutSteps;

import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertTriangle,
  CreditCard,
  RefreshCw,
  MessageCircle,
  ExternalLink,
} from "lucide-react";

export interface PaymentError {
  type: "network" | "validation" | "paystack" | "server" | "auth" | "unknown";
  code?: string;
  message: string;
  details?: any;
  retryable: boolean;
}

interface PaymentErrorHandlerProps {
  error: PaymentError | string;
  onRetry?: () => void;
  onContactSupport?: () => void;
  onBack?: () => void;
  className?: string;
}

export const PaymentErrorHandler: React.FC<PaymentErrorHandlerProps> = ({
  error,
  onRetry,
  onContactSupport,
  onBack,
  className,
}) => {
  const errorObj =
    typeof error === "string"
      ? { type: "unknown" as const, message: error, retryable: true }
      : error;

  const getErrorConfig = (error: PaymentError) => {
    switch (error.type) {
      case "network":
        return {
          title: "Connection Problem",
          description:
            "Unable to connect to payment servers. Please check your internet connection and try again.",
          icon: <RefreshCw className="h-4 w-4" />,
          variant: "default" as const,
          actions: ["retry", "back"],
        };

      case "validation":
        return {
          title: "Invalid Payment Information",
          description:
            error.message || "Please check your payment details and try again.",
          icon: <CreditCard className="h-4 w-4" />,
          variant: "destructive" as const,
          actions: ["back"],
        };

      case "paystack":
        return {
          title: "Payment Processing Error",
          description:
            error.message ||
            "Payment could not be processed. Please try a different payment method.",
          icon: <AlertTriangle className="h-4 w-4" />,
          variant: "destructive" as const,
          actions: error.retryable ? ["retry", "support"] : ["support"],
        };

      case "server":
        return {
          title: "Server Error",
          description:
            "Our servers are experiencing issues. Please try again in a few minutes.",
          icon: <RefreshCw className="h-4 w-4" />,
          variant: "destructive" as const,
          actions: ["retry", "support"],
        };

      case "auth":
        return {
          title: "Authentication Required",
          description: "Please log in again to continue with your payment.",
          icon: <CreditCard className="h-4 w-4" />,
          variant: "default" as const,
          actions: ["back"],
        };

      default:
        return {
          title: "Payment Failed",
          description:
            error.message ||
            "An unexpected error occurred during payment processing.",
          icon: <AlertTriangle className="h-4 w-4" />,
          variant: "destructive" as const,
          actions: error.retryable ? ["retry", "support"] : ["support", "back"],
        };
    }
  };

  const config = getErrorConfig(errorObj);

  const handleContactSupport = () => {
    if (onContactSupport) {
      onContactSupport();
    } else {
      // Default support contact
      const subject = `Payment Error: ${config.title}`;
      const body = `
I encountered a payment error:

Error Type: ${errorObj.type}
Error Message: ${errorObj.message}
${errorObj.code ? `Error Code: ${errorObj.code}` : ""}
${errorObj.details ? `Details: ${JSON.stringify(errorObj.details, null, 2)}` : ""}

Time: ${new Date().toISOString()}
`;

      const mailtoLink = `mailto:support@rebookedsolutions.co.za?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.open(mailtoLink, "_blank");
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-600">
          {config.icon}
          {config.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant={config.variant}>
          <AlertDescription>{config.description}</AlertDescription>
        </Alert>

        {/* Error details for debugging (development only) */}
        {process.env.NODE_ENV === "development" && errorObj.details && (
          <div className="text-xs text-gray-500 p-3 bg-gray-50 rounded-md">
            <strong>Debug Info:</strong>
            <pre className="mt-1 overflow-auto">
              {JSON.stringify(errorObj.details, null, 2)}
            </pre>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          {config.actions.includes("retry") && onRetry && (
            <Button onClick={onRetry} variant="default" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}

          {config.actions.includes("support") && (
            <Button onClick={handleContactSupport} variant="outline" size="sm">
              <MessageCircle className="h-4 w-4 mr-2" />
              Contact Support
            </Button>
          )}

          {config.actions.includes("back") && onBack && (
            <Button onClick={onBack} variant="outline" size="sm">
              Go Back
            </Button>
          )}
        </div>

        {/* Additional help text */}
        <div className="text-sm text-gray-600 space-y-2">
          {errorObj.type === "paystack" && (
            <p>
              💡 <strong>Tip:</strong> If you're using a debit card, ensure you
              have sufficient funds and that online payments are enabled.
            </p>
          )}

          {errorObj.type === "network" && (
            <p>
              💡 <strong>Tip:</strong> Try switching to a different network
              connection or wait a few minutes before retrying.
            </p>
          )}

          {errorObj.type === "validation" && (
            <p>
              💡 <strong>Tip:</strong> Double-check your card details, including
              the expiry date and CVV number.
            </p>
          )}

          <p className="text-xs">
            If you continue experiencing issues, please contact our support team
            at{" "}
            <button
              onClick={handleContactSupport}
              className="text-blue-600 hover:text-blue-800 underline"
            >
              support@rebookedsolutions.co.za
            </button>{" "}
            for assistance.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Helper function to classify errors into appropriate types
 */
export const classifyPaymentError = (error: any): PaymentError => {
  if (!error) {
    return {
      type: "unknown",
      message: "An unknown error occurred",
      retryable: true,
    };
  }

      let errorMessage = error.message || (typeof error === 'string' ? error : 'Payment error occurred');

  // Prevent [object Object] from being used
  if (errorMessage === '[object Object]') {
    errorMessage = 'Payment processing error occurred';
  }

  const errorLower = errorMessage.toLowerCase();

  // Network errors
  if (
    errorLower.includes("network") ||
    errorLower.includes("fetch") ||
    errorLower.includes("connection") ||
    errorLower.includes("timeout")
  ) {
    return {
      type: "network",
      message:
        "Network connection failed. Please check your internet connection.",
      retryable: true,
      details: error,
    };
  }

  // Authentication errors
  if (
    errorLower.includes("auth") ||
    errorLower.includes("unauthorized") ||
    errorLower.includes("login")
  ) {
    return {
      type: "auth",
      message: "Authentication required. Please log in again.",
      retryable: false,
      details: error,
    };
  }

  // Validation errors
  if (
    errorLower.includes("validation") ||
    errorLower.includes("invalid") ||
    errorLower.includes("required field") ||
    errorLower.includes("missing")
  ) {
    return {
      type: "validation",
      message: errorMessage,
      retryable: false,
      details: error,
    };
  }

  // Paystack specific errors
  if (
    errorLower.includes("paystack") ||
    errorLower.includes("payment declined") ||
    errorLower.includes("insufficient funds") ||
    errorLower.includes("card")
  ) {
    return {
      type: "paystack",
      message: errorMessage,
      retryable: true,
      details: error,
    };
  }

  // Server errors
  if (
    errorLower.includes("server") ||
    errorLower.includes("internal") ||
    errorLower.includes("500") ||
    errorLower.includes("503")
  ) {
    return {
      type: "server",
      message: "Server error. Please try again in a few minutes.",
      retryable: true,
      details: error,
    };
  }

  // Default unknown error
  return {
    type: "unknown",
    message: errorMessage || "An unexpected error occurred",
    retryable: true,
    details: error,
  };
};

export default PaymentErrorHandler;

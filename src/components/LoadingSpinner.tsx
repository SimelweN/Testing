
import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  text?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  variant?: "default" | "primary" | "secondary";
}

const LoadingSpinner = ({ 
  text = "Loading...", 
  size = "md", 
  className = "",
  variant = "default"
}: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6", 
    lg: "h-8 w-8"
  };

  const variantClasses = {
    default: "text-gray-600",
    primary: "text-blue-600",
    secondary: "text-purple-600"
  };

  return (
    <div className={`flex flex-col items-center justify-center space-y-2 ${className}`}>
      <Loader2 className={`animate-spin ${sizeClasses[size]} ${variantClasses[variant]}`} />
      {text && (
        <p className={`text-sm ${variantClasses[variant]}`}>
          {text}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;

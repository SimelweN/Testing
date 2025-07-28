import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
  fallbackPath?: string;
  children?: React.ReactNode;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

const BackButton: React.FC<BackButtonProps> = ({
  fallbackPath = "/",
  children,
  className = "",
  variant = "ghost",
  size = "default",
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    // Check if we can go back in the browser history
    if (window.history.length > 1 && window.history.state?.idx > 0) {
      console.log("📱 BackButton: Going back in history");
      navigate(-1);
    } else {
      // Fallback to a specific path if no history
      console.log("📱 BackButton: No history, navigating to fallback:", fallbackPath);
      navigate(fallbackPath);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleBack}
      className={`flex items-center gap-2 ${className}`}
    >
      <ArrowLeft className="h-4 w-4" />
      {children || "Back"}
    </Button>
  );
};

export default BackButton;

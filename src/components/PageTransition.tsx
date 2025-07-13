import { ReactNode, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

const PageTransition = ({ children, className = "" }: PageTransitionProps) => {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const [displayLocation, setDisplayLocation] = useState(location);

  useEffect(() => {
    if (location !== displayLocation) {
      setIsVisible(false);

      const timeoutId = setTimeout(() => {
        setDisplayLocation(location);
        setIsVisible(true);
      }, 150);

      return () => clearTimeout(timeoutId);
    } else {
      setIsVisible(true);
    }
  }, [location, displayLocation]);

  const transitionClasses = `
    transition-all duration-300 ease-in-out
    ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
    ${className}
  `;

  return <div className={transitionClasses}>{children}</div>;
};

export default PageTransition;

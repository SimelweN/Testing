import React from "react";
import ModernAPSCalculator from "./ModernAPSCalculator";
import APSErrorBoundary from "./APSErrorBoundary";

const APSCalculatorSection = () => {
  return (
    <div className="container mx-auto px-4 py-6">
      <APSErrorBoundary>
        <ModernAPSCalculator />
      </APSErrorBoundary>
    </div>
  );
};

export default APSCalculatorSection;

// Legacy University Profile - redirect to enhanced version
import React from "react";
import { useParams } from "react-router-dom";
import EnhancedUniversityProfile from "./EnhancedUniversityProfile";

/**
 * Legacy University Profile - now uses enhanced version with APS filtering
 * This wrapper ensures backward compatibility while providing enhanced features
 */
const UniversityProfile: React.FC = () => {
  // Redirect to enhanced version that fixes all critical issues
  return <EnhancedUniversityProfile />;
};

export default UniversityProfile;

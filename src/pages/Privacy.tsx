import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Privacy = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Auto-redirect after 5 seconds
    const timer = setTimeout(() => {
      navigate("/policies");
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-4 sm:py-8">
        <Card className="max-w-4xl mx-auto">
          <CardHeader className="pb-4 sm:pb-6">
            <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold text-book-800">
              Privacy Policy
            </CardTitle>
            <p className="text-gray-600 text-sm sm:text-base">
              Page moved - redirecting you to our comprehensive policies
            </p>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-8 px-4 sm:px-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-red-700 mb-3 sm:mb-4">
                ⚠️ IMPORTANT NOTICE
              </h2>
              <p className="mb-3 sm:mb-4 text-red-800 text-sm sm:text-base">
                <strong>This page has been moved!</strong> Our complete Privacy
                Policy is now part of our comprehensive policies page that
                includes all legal documentation.
              </p>
              <p className="mb-3 sm:mb-4 text-red-700 text-sm sm:text-base">
                Our Privacy Policy is fully compliant with the Protection of
                Personal Information Act (POPIA) and includes detailed coverage
                of data collection, usage, storage, and your rights.
              </p>
              <button
                onClick={() => {
                  console.log("Button clicked - navigating to /policies");
                  navigate("/policies");
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center bg-red-600 hover:bg-red-700 text-white px-4 sm:px-6 py-3 rounded-lg font-medium transition-colors text-sm sm:text-base"
              >
                Go to Complete Privacy Policy →
              </button>
              <p className="text-xs sm:text-sm text-red-600 mt-3">
                You will be automatically redirected in 5 seconds...
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-blue-700 mb-4">
                🔒 Enhanced Privacy Protection
              </h2>
              <p className="mb-4 text-blue-800">
                Our comprehensive Privacy Policy now includes:
              </p>
              <ul className="list-disc list-inside mb-4 ml-4 text-blue-700">
                <li>
                  <strong>POPIA Compliance</strong> - Full Protection of
                  Personal Information Act coverage
                </li>
                <li>
                  <strong>Data Collection Details</strong> - Exactly what
                  information we collect and why
                </li>
                <li>
                  <strong>Your Rights</strong> - How to access, correct, or
                  delete your personal data
                </li>
                <li>
                  <strong>Security Measures</strong> - How we protect your
                  information
                </li>
                <li>
                  <strong>International Transfers</strong> - Safeguards for data
                  processed outside South Africa
                </li>
                <li>
                  <strong>Contact Information</strong> - How to reach us about
                  privacy concerns
                </li>
              </ul>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-green-700 mb-3">
                ✅ Professional Legal Framework:
              </h3>
              <ul className="list-disc list-inside text-green-700 space-y-2">
                <li>
                  15 comprehensive sections covering all aspects of privacy
                </li>
                <li>Clear explanations in plain language</li>
                <li>Specific contact details for privacy inquiries</li>
                <li>Professional tabbed interface for easy navigation</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Privacy;

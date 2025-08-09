import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";

const BankingSetup: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to profile page since banking setup is now handled via popup
    navigate("/profile", { replace: true });
  }, [navigate]);

  return (
    <Layout>
      <div className="container mx-auto px-6 py-8">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to profile...</p>
        </div>
      </div>
    </Layout>
  );
};

export default BankingSetup;

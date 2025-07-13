import React from "react";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import MobileShippingDashboard from "@/components/MobileShippingDashboard";

const Shipping = () => {
  return (
    <Layout>
      <SEO
        title="Shipping & Delivery - ReBooked Solutions"
        description="Track your textbook deliveries with Courier Guy, Fastway, and ShipLogic. Real-time tracking for all your orders."
        keywords="shipping, delivery, courier guy, fastway, shiplogic, tracking, textbook delivery"
        url="https://www.rebookedsolutions.co.za/shipping"
      />

      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-book-800 mb-2 sm:mb-4">
              Track Your Orders
            </h1>
            <p className="text-gray-600 text-sm sm:text-base max-w-3xl mx-auto px-4">
              Track your textbook deliveries with our integrated shipping
              providers including Courier Guy, Fastway, and ShipLogic. Shipments
              are automatically created when you purchase books.
            </p>
          </div>

          <MobileShippingDashboard />
        </div>
      </div>
    </Layout>
  );
};

export default Shipping;

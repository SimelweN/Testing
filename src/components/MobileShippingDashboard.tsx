import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Package,
  Search,
  Calculator,
  CheckCircle,
  Globe,
  Smartphone,
  Clock,
  Truck,
} from "lucide-react";

// Import tracking-only components
import CourierGuyTrackingOnly from "@/components/courier-guy/CourierGuyTrackingOnly";
import FastwayTrackingOnly from "@/components/fastway/FastwayTrackingOnly";
import ShipLogicTrackingOnly from "@/components/shiplogic/ShipLogicTrackingOnly";
import ShipLogicRateQuote from "@/components/shiplogic/ShipLogicRateQuote";

interface MobileShippingDashboardProps {
  defaultProvider?: "courierGuy" | "shipLogic" | "fastway";
}

const MobileShippingDashboard = ({
  defaultProvider = "courierGuy",
}: MobileShippingDashboardProps) => {
  const navigate = useNavigate();
  const [selectedProvider, setSelectedProvider] = useState<
    "courierGuy" | "shipLogic" | "fastway"
  >(defaultProvider);

  const providers = [
    {
      id: "courierGuy",
      name: "Courier Guy",
      logo: "🚚",
      description: "Local courier service",
      features: ["Local SA courier", "Reliable tracking", "2-3 business days"],
      color: "blue",
    },
    {
      id: "fastway",
      name: "Fastway",
      logo: "🏃‍♂️",
      description: "Express courier service",
      features: ["Express delivery", "Wide coverage", "Competitive rates"],
      color: "orange",
    },
    {
      id: "shipLogic",
      name: "ShipLogic",
      logo: "📦",
      description: "Advanced logistics",
      features: [
        "Multiple service levels",
        "Real-time tracking",
        "Professional service",
      ],
      color: "green",
    },
  ];

  const currentProvider = providers.find((p) => p.id === selectedProvider);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 px-4">
      {/* Mobile-First Provider Selection */}
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-lg">
            <Smartphone className="mr-2 h-5 w-5" />
            Choose Shipping Provider
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3">
            {providers.map((provider) => (
              <div
                key={provider.id}
                className={`flex-1 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedProvider === provider.id
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => setSelectedProvider(provider.id as "shipLogic")}
              >
                <div className="flex items-start space-x-3">
                  <div className="text-xl sm:text-2xl">{provider.logo}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-sm sm:text-base truncate">
                        {provider.name}
                      </h3>
                      {selectedProvider === provider.id && (
                        <Badge
                          variant="default"
                          className="text-xs bg-green-600"
                        >
                          Selected
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 mb-2 line-clamp-2">
                      {provider.description}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {provider.features.map((feature, index) => (
                        <span
                          key={index}
                          className="text-xs bg-gray-100 px-2 py-1 rounded"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Mobile-Optimized Tabs */}
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-lg">
            <div className="text-xl sm:text-2xl mr-2">
              {currentProvider?.logo}
            </div>
            <span className="truncate">{currentProvider?.name}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="track" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger
                value="track"
                className="flex items-center text-xs sm:text-sm"
              >
                <Search className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Track Shipment</span>
                <span className="sm:hidden">Track</span>
              </TabsTrigger>
              <TabsTrigger
                value="quote"
                className="flex items-center text-xs sm:text-sm"
              >
                <Calculator className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Get Quote</span>
                <span className="sm:hidden">Quote</span>
              </TabsTrigger>
            </TabsList>

            {/* Tracking Tab */}
            <TabsContent value="track" className="mt-0">
              <div className="space-y-4">
                <div className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-500">
                  <div className="flex items-start space-x-2">
                    <Package className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-blue-900 text-sm">
                        Track Your Order
                      </h4>
                      <p className="text-blue-700 text-xs mt-1">
                        Shipments are automatically created when you purchase
                        books. Use your order confirmation to track delivery.
                      </p>
                    </div>
                  </div>
                </div>

                <ShipLogicTrackingOnly
                  placeholder="Enter tracking number"
                  showBranding={false}
                />
              </div>
            </TabsContent>

            {/* Quote Tab */}
            <TabsContent value="quote" className="mt-0">
              <div className="space-y-4">
                <div className="bg-green-50 p-3 rounded-lg border-l-4 border-green-500">
                  <div className="flex items-start space-x-2">
                    <Calculator className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-green-900 text-sm">
                        Shipping Estimates
                      </h4>
                      <p className="text-green-700 text-xs mt-1">
                        Get instant shipping quotes for your textbook orders.
                      </p>
                    </div>
                  </div>
                </div>
                <ShipLogicRateQuote />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Mobile-Friendly Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="text-center">
          <CardContent className="p-4">
            <Package className="h-8 w-8 text-gray-600 mx-auto mb-2" />
            <h3 className="text-sm font-semibold mb-1">Auto Processing</h3>
            <p className="text-xs text-gray-600">
              Shipments created automatically when you buy books
            </p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="p-4">
            <Search className="h-8 w-8 text-gray-600 mx-auto mb-2" />
            <h3 className="text-sm font-semibold mb-1">Real-time Tracking</h3>
            <p className="text-xs text-gray-600">
              Track your orders every step of the way
            </p>
          </CardContent>
        </Card>

        <Card className="text-center sm:col-span-2 lg:col-span-1">
          <CardContent className="p-4">
            <Clock className="h-8 w-8 text-gray-600 mx-auto mb-2" />
            <h3 className="text-sm font-semibold mb-1">Fast Delivery</h3>
            <p className="text-xs text-gray-600">
              2-3 business days across South Africa
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Help Section */}
      <Card className="bg-gradient-to-r from-blue-50 to-green-50">
        <CardContent className="p-4">
          <div className="text-center">
            <Truck className="h-8 w-8 text-gray-700 mx-auto mb-2" />
            <h3 className="font-semibold text-sm mb-2">Need Help?</h3>
            <p className="text-xs text-gray-600 mb-3">
              Shipments are automatically created when you purchase textbooks.
              You'll receive tracking information via email.
            </p>
            <Button
              size="sm"
              variant="outline"
              className="text-xs"
              onClick={() => navigate("/contact")}
            >
              Contact Support
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MobileShippingDashboard;

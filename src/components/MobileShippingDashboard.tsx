import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Package,
  Truck,
  Search,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Star,
  ChevronRight,
} from "lucide-react";
import CourierGuyTracker from "@/components/courier-guy/CourierGuyTracker";


interface MobileShippingDashboardProps {
  defaultProvider?: "courierGuy";
}

const MobileShippingDashboard = ({
  defaultProvider = "courierGuy",
}: MobileShippingDashboardProps) => {
  const [selectedProvider, setSelectedProvider] = useState<
    "courierGuy"
  >(defaultProvider);
  const [activeTab, setActiveTab] = useState<"track" | "quote">("track");

  // Mock data for demonstration
  const recentShipments = [
    {
      id: "CG123456789",
      status: "delivered",
      recipient: "John Doe",
      date: "2024-01-15",
      provider: "courierGuy",
    },

  ];

  const providers = [
    {
      id: "courierGuy",
      name: "Courier Guy",
      logo: "🚚",
      rating: 4.5,
      features: ["Same day delivery", "Tracking", "Insurance"],
    },
    {
      id: "fastway",
      name: "Fastway",
      logo: "📦",
      rating: 4.2,
      features: ["Express delivery", "Parcel tracking", "Nationwide"],
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "in_transit":
        return <Truck className="h-4 w-4 text-blue-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Package className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800";
      case "in_transit":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-4 py-3">
        <h1 className="text-xl font-semibold text-gray-900">Shipping</h1>
        <p className="text-sm text-gray-600">Track packages and get quotes</p>
      </div>

      {/* Provider Selection */}
      <div className="px-4 py-3 bg-white border-b">
        <div className="grid grid-cols-2 gap-3">
          {providers.map((provider) => (
            <Button
              key={provider.id}
              variant={
                selectedProvider === provider.id ? "default" : "outline"
              }
              className="h-auto p-3 flex flex-col items-center space-y-1"
              onClick={() =>
                setSelectedProvider(
                  provider.id as "courierGuy" | "fastway",
                )
              }
            >
              <span className="text-2xl">{provider.logo}</span>
              <span className="text-xs font-medium">{provider.name}</span>
              <div className="flex items-center space-x-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs text-gray-600">{provider.rating}</span>
              </div>
            </Button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-4 space-y-4">
        {/* Quick Actions */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "track" | "quote")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="track" className="flex items-center space-x-2">
              <Search className="h-4 w-4" />
              <span>Track</span>
            </TabsTrigger>
            <TabsTrigger value="quote" className="flex items-center space-x-2">
              <Package className="h-4 w-4" />
              <span>Quote</span>
            </TabsTrigger>
          </TabsList>

          {/* Recent Shipments */}
          <Card className="mt-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                Recent Shipments
                <RefreshCw className="h-4 w-4 text-gray-500" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentShipments.map((shipment) => (
                <div
                  key={shipment.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(shipment.status)}
                    <div>
                      <p className="font-medium text-sm">{shipment.id}</p>
                      <p className="text-xs text-gray-600">
                        To: {shipment.recipient}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant="secondary"
                      className={`text-xs ${getStatusColor(shipment.status)}`}
                    >
                      {shipment.status.replace("_", " ")}
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <TabsContent value="track" className="space-y-4">
            {/* Tracking */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Search className="h-5 w-5" />
                  <span>Track Package</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedProvider === "courierGuy" ? (
                  <CourierGuyTracker
                    placeholder="Enter Courier Guy tracking number"
                    showBranding={false}
                  />
                ) : (
                  <FastwayTrackingOnly
                    placeholder="Enter Fastway tracking number"
                    showBranding={false}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quote" className="space-y-4">
            {/* Quote Request */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Package className="h-5 w-5" />
                  <span>Get Quote</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">
                      Get instant shipping quotes
                    </p>
                    <Button className="w-full">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Get Quote
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Provider Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {providers.find((p) => p.id === selectedProvider)?.name} Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-2">
              {providers
                .find((p) => p.id === selectedProvider)
                ?.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Contact Support */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Need Help?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <Phone className="h-4 w-4 mr-2" />
              Call Support
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Mail className="h-4 w-4 mr-2" />
              Email Support
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MobileShippingDashboard;

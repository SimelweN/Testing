import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  MapPin,
  Clock,
  Package,
  Truck,
  Search,
  CheckCircle,
  Star,
  Shield,
  Calendar,
  ArrowRight,
  Info,
  RefreshCw,
  HelpCircle,
} from "lucide-react";
import CourierGuyTracker from "@/components/courier-guy/CourierGuyTracker";

const InformativeShippingDashboard = () => {
  const [activeTab, setActiveTab] = useState<"process" | "track">("process");

  // No demo data - recent shipments will be loaded from actual user orders
  const recentShipments: any[] = [];

  const shippingProcess = [
    {
      step: 1,
      title: "Order Confirmation",
      description: "Your order is confirmed and payment processed",
      timeframe: "Immediate",
      icon: <CheckCircle className="h-5 w-5 text-green-600" />,
    },
    {
      step: 2,
      title: "Seller Preparation",
      description: "Seller prepares your textbook for shipment",
      timeframe: "1-2 business days",
      icon: <Package className="h-5 w-5 text-blue-600" />,
    },
    {
      step: 3,
      title: "Courier Collection",
      description: "Courier Guy collects the package from seller",
      timeframe: "Next business day",
      icon: <Truck className="h-5 w-5 text-purple-600" />,
    },
    {
      step: 4,
      title: "In Transit",
      description: "Your package is on its way to you",
      timeframe: "2-5 business days",
      icon: <MapPin className="h-5 w-5 text-orange-600" />,
    },
    {
      step: 5,
      title: "Delivery",
      description: "Package delivered to your address",
      timeframe: "During business hours",
      icon: <CheckCircle className="h-5 w-5 text-green-600" />,
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
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with courier partner info */}
      <div className="bg-white shadow-sm border-b px-4 py-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-3">
            <span className="text-4xl">🚚</span>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Courier Guy Partnership</h2>
              <div className="flex items-center justify-center space-x-2 mt-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm text-gray-600">4.5 • Trusted Delivery Partner</span>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-600 max-w-2xl mx-auto">
            All orders are automatically processed through our trusted delivery partner, 
            ensuring reliable and trackable shipping across South Africa.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "process" | "track")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="process" className="flex items-center space-x-2">
              <Info className="h-4 w-4" />
              <span>Shipping Process</span>
            </TabsTrigger>
            <TabsTrigger value="track" className="flex items-center space-x-2">
              <Search className="h-4 w-4" />
              <span>Track Orders</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="process" className="space-y-6">
            {/* Shipping Process Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Package className="h-5 w-5" />
                  <span>How Your Order Gets to You</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {shippingProcess.map((step, index) => (
                    <div key={step.step} className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          {step.icon}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-gray-900">
                            Step {step.step}: {step.title}
                          </h3>
                          <Badge variant="outline" className="text-xs">
                            {step.timeframe}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {step.description}
                        </p>
                      </div>
                      {index < shippingProcess.length - 1 && (
                        <ArrowRight className="h-4 w-4 text-gray-300 mt-3" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Service Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-green-600" />
                    <span>Delivery Features</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Real-time tracking</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Nationwide coverage</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Package insurance</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Delivery notifications</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-2 border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Package className="h-5 w-5 text-blue-600" />
                    <span>🆕 Locker-to-Door</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="bg-green-100 border border-green-300 rounded p-2">
                      <p className="text-sm font-semibold text-green-800">💰 Get Paid Earlier!</p>
                    </div>
                    <ul className="space-y-2">
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                        <span className="text-sm">Drop off at secure lockers</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                        <span className="text-sm">QR code access system</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                        <span className="text-sm">Faster processing</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                        <span className="text-sm">Available at major malls</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <span>Delivery Times</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium">Major Cities</p>
                      <p className="text-xs text-gray-600">2-3 business days</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Regional Areas</p>
                      <p className="text-xs text-gray-600">3-5 business days</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Remote Areas</p>
                      <p className="text-xs text-gray-600">5-7 business days</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Important Notes */}
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Info className="h-5 w-5 text-blue-600" />
                  <span>Important Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li>• Shipping costs are automatically calculated during checkout</li>
                  <li>• You'll receive tracking information via email once your order ships</li>
                  <li>• Deliveries are made during business hours (8 AM - 5 PM)</li>
                  <li>• Please ensure someone is available to receive the package</li>
                  <li>• Contact us immediately if you have any delivery issues</li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="track" className="space-y-6">
            {/* Recent Orders */}
            {recentShipments.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center justify-between">
                    Recent Orders
                    <RefreshCw className="h-4 w-4 text-gray-500" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {recentShipments.map((shipment) => (
                    <div
                      key={shipment.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(shipment.status)}
                        <div>
                          <p className="font-medium text-sm">{shipment.id}</p>
                          <p className="text-xs text-gray-600">
                            To: {shipment.recipient}
                          </p>
                          <p className="text-xs text-gray-500">
                            Ordered: {new Date(shipment.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant="secondary"
                          className={`text-xs ${getStatusColor(shipment.status)}`}
                        >
                          {shipment.status.replace("_", " ")}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          Est: {new Date(shipment.estimatedDelivery).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Order Tracking */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Search className="h-5 w-5" />
                  <span>Track Any Order</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CourierGuyTracker />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>


      </div>
    </div>
  );
};

export default InformativeShippingDashboard;

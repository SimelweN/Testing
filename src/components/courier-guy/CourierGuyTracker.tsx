import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Search,
  Package,
  MapPin,
  Clock,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  trackCourierGuyShipment,
  CourierGuyTrackingInfo,
} from "@/services/courierGuyService";

interface CourierGuyTrackerProps {
  placeholder?: string;
  showBranding?: boolean;
  compact?: boolean;
}

const CourierGuyTracker = ({
  placeholder = "Enter your Courier Guy tracking number",
  showBranding = true,
  compact = false
}: CourierGuyTrackerProps = {}) => {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [trackingInfo, setTrackingInfo] =
    useState<CourierGuyTrackingInfo | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!trackingNumber.trim()) {
      toast.error("Please enter a tracking number");
      return;
    }

    // Validate tracking number format
    const trackingNumberRegex = /^[A-Za-z0-9]{6,15}$/;
    if (!trackingNumberRegex.test(trackingNumber.trim())) {
      toast.error(
        "Please enter a valid tracking number (6-15 alphanumeric characters)",
      );
      return;
    }

    setIsLoading(true);
    setTrackingInfo(null);

    try {
      const info = await trackCourierGuyShipment(trackingNumber.trim());
      setTrackingInfo(info);
      toast.success("Tracking information retrieved successfully!");
    } catch (error) {
      console.error("Error tracking shipment:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to track shipment";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return "bg-green-100 text-green-800";
      case "in_transit":
      case "out_for_delivery":
        return "bg-blue-100 text-blue-800";
      case "pending":
      case "processing":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return <CheckCircle className="h-4 w-4" />;
      case "in_transit":
      case "out_for_delivery":
        return <Package className="h-4 w-4" />;
      case "pending":
      case "processing":
        return <Clock className="h-4 w-4" />;
      default:
        return <MapPin className="h-4 w-4" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Tracking Form */}
      <Card>
        {showBranding && (
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="mr-2 h-5 w-5" />
              Track Your Shipment
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="trackingNumber">Tracking Number</Label>
              <div className="flex space-x-2">
                <Input
                  id="trackingNumber"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder={placeholder}
                  className="flex-1"
                />
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Track
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Tracking Results */}
      {trackingInfo && (
        <div className="space-y-6">
          {/* Shipment Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="mr-2 h-5 w-5" />
                Shipment Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm font-medium">Tracking Number</Label>
                  <p className="text-sm bg-gray-100 p-2 rounded">
                    {trackingInfo.tracking_number}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge className={getStatusColor(trackingInfo.status)}>
                    {getStatusIcon(trackingInfo.status)}
                    <span className="ml-1">
                      {trackingInfo.status_description}
                    </span>
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Created</Label>
                  <p className="text-sm bg-gray-100 p-2 rounded">
                    {new Date(trackingInfo.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Last Updated</Label>
                  <p className="text-sm bg-gray-100 p-2 rounded">
                    {new Date(trackingInfo.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {trackingInfo.estimated_delivery_date && (
                <div className="mt-4">
                  <Label className="text-sm font-medium">
                    Estimated Delivery
                  </Label>
                  <p className="text-lg font-semibold text-blue-600">
                    {new Date(
                      trackingInfo.estimated_delivery_date,
                    ).toLocaleDateString()}
                  </p>
                </div>
              )}

              {trackingInfo.actual_delivery_date && (
                <div className="mt-4">
                  <Label className="text-sm font-medium">Delivered On</Label>
                  <p className="text-lg font-semibold text-green-600">
                    {new Date(
                      trackingInfo.actual_delivery_date,
                    ).toLocaleDateString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tracking Timeline */}
          {trackingInfo.tracking_events &&
            trackingInfo.tracking_events.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="mr-2 h-5 w-5" />
                    Tracking Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {trackingInfo.tracking_events
                      .sort(
                        (a, b) =>
                          new Date(b.timestamp).getTime() -
                          new Date(a.timestamp).getTime(),
                      )
                      .map((event, index) => (
                        <div
                          key={index}
                          className="flex items-start space-x-4 p-4 border rounded-lg"
                        >
                          <div className="flex-shrink-0">
                            <div
                              className={`p-2 rounded-full ${getStatusColor(event.status)}`}
                            >
                              {getStatusIcon(event.status)}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-medium">
                                {event.description}
                              </h4>
                              <Badge variant="outline" className="text-xs">
                                {event.status}
                              </Badge>
                            </div>
                            {event.location && (
                              <p className="text-sm text-gray-600 flex items-center mt-1">
                                <MapPin className="h-3 w-3 mr-1" />
                                {event.location}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(event.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-sm text-gray-600">
                Fetching tracking information...
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CourierGuyTracker;

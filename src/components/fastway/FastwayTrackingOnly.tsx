import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  Search,
  Package,
  MapPin,
  Clock,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import {
  trackFastwayShipment,
  FastwayTrackingResponse,
} from "@/services/fastwayService";

interface FastwayTrackingOnlyProps {
  placeholder?: string;
  showBranding?: boolean;
}

const FastwayTrackingOnly = ({
  placeholder = "Enter Fastway tracking number",
  showBranding = true,
}: FastwayTrackingOnlyProps) => {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [trackingInfo, setTrackingInfo] =
    useState<FastwayTrackingResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!trackingNumber.trim()) {
      toast.error("Please enter a tracking number");
      return;
    }

    // Basic validation for tracking number
    if (trackingNumber.trim().length < 6) {
      toast.error("Please enter a valid tracking number");
      return;
    }

    setIsLoading(true);
    setTrackingInfo(null);

    try {
      const info = await trackFastwayShipment(trackingNumber.trim());
      setTrackingInfo(info);
      toast.success("Tracking information retrieved successfully!");
    } catch (error) {
      console.error("Error tracking Fastway shipment:", error);
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
      case "collected":
        return "bg-yellow-100 text-yellow-800";
      case "pending":
        return "bg-gray-100 text-gray-800";
      case "failed":
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
      case "collected":
        return <Clock className="h-4 w-4" />;
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "failed":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <MapPin className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Tracking Form */}
      {showBranding && (
        <div className="text-center mb-4">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <span className="text-2xl">🏃‍♂️</span>
            <h3 className="text-lg font-semibold text-orange-600">
              Fastway Tracking
            </h3>
          </div>
          <p className="text-sm text-gray-600">
            Track your Fastway courier shipment
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex space-x-2">
          <Input
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder={placeholder}
            className="flex-1"
            disabled={isLoading}
          />
          <Button
            type="submit"
            disabled={isLoading || !trackingNumber.trim()}
            className="bg-orange-600 hover:bg-orange-700"
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
      </form>

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-orange-600" />
              <p className="text-sm text-gray-600">
                Fetching tracking information from Fastway...
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tracking Results */}
      {trackingInfo && (
        <div className="space-y-4">
          {/* Shipment Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-base">
                <Package className="mr-2 h-5 w-5 text-orange-600" />
                Shipment Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Tracking Number
                  </p>
                  <p className="text-sm bg-gray-100 p-2 rounded font-mono">
                    {trackingInfo.tracking_number}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Status
                  </p>
                  <Badge className={getStatusColor(trackingInfo.status)}>
                    {getStatusIcon(trackingInfo.status)}
                    <span className="ml-1 capitalize">
                      {trackingInfo.status.replace("_", " ")}
                    </span>
                  </Badge>
                </div>
                {trackingInfo.current_location && (
                  <div className="sm:col-span-2">
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Current Location
                    </p>
                    <p className="text-sm flex items-center">
                      <MapPin className="h-3 w-3 mr-1 text-gray-500" />
                      {trackingInfo.current_location}
                    </p>
                  </div>
                )}
              </div>

              {trackingInfo.estimated_delivery && (
                <div className="mt-4 p-3 bg-orange-50 rounded-lg border-l-4 border-orange-500">
                  <p className="text-sm font-medium text-orange-900">
                    Estimated Delivery
                  </p>
                  <p className="text-lg font-semibold text-orange-800">
                    {new Date(
                      trackingInfo.estimated_delivery,
                    ).toLocaleDateString()}
                  </p>
                </div>
              )}

              {trackingInfo.actual_delivery && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                  <p className="text-sm font-medium text-green-900">
                    Delivered On
                  </p>
                  <p className="text-lg font-semibold text-green-800">
                    {new Date(
                      trackingInfo.actual_delivery,
                    ).toLocaleDateString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tracking Events */}
          {trackingInfo.events && trackingInfo.events.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-base">
                  <Clock className="mr-2 h-5 w-5 text-orange-600" />
                  Tracking Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {trackingInfo.events
                    .sort(
                      (a, b) =>
                        new Date(b.timestamp).getTime() -
                        new Date(a.timestamp).getTime(),
                    )
                    .map((event, index) => (
                      <div
                        key={index}
                        className="flex items-start space-x-3 p-3 border rounded-lg"
                      >
                        <div className="flex-shrink-0">
                          <div
                            className={`p-2 rounded-full ${getStatusColor(event.status)}`}
                          >
                            {getStatusIcon(event.status)}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-sm font-medium">
                              {event.description}
                            </h4>
                            <Badge variant="outline" className="text-xs">
                              {event.status.replace("_", " ")}
                            </Badge>
                          </div>
                          {event.location && (
                            <p className="text-sm text-gray-600 flex items-center">
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

          {/* Delivery Confirmation */}
          {trackingInfo.recipient_signature && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Package delivered and signed for by:{" "}
                {trackingInfo.recipient_signature}
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Help Text */}
      {!trackingInfo && !isLoading && (
        <div className="text-center py-6">
          <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">
            Enter your Fastway tracking number to get real-time updates
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Tracking numbers are usually 8-12 characters long
          </p>
        </div>
      )}
    </div>
  );
};

export default FastwayTrackingOnly;

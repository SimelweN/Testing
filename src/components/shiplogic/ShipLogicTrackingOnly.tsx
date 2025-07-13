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
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { trackShipLogicShipment } from "@/services/shipLogicService";
import {
  ShipLogicTrackingInfo,
  ShipLogicTrackingEvent,
} from "@/types/shiplogic";

interface ShipLogicTrackingOnlyProps {
  placeholder?: string;
  showBranding?: boolean;
}

const ShipLogicTrackingOnly = ({
  placeholder = "Enter ShipLogic shipment ID or waybill number",
  showBranding = true,
}: ShipLogicTrackingOnlyProps) => {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [trackingInfo, setTrackingInfo] =
    useState<ShipLogicTrackingInfo | null>(null);

  const getStatusColor = (status: string): string => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes("delivered")) return "bg-green-100 text-green-800";
    if (lowerStatus.includes("transit") || lowerStatus.includes("collection"))
      return "bg-blue-100 text-blue-800";
    if (lowerStatus.includes("pending") || lowerStatus.includes("created"))
      return "bg-yellow-100 text-yellow-800";
    if (lowerStatus.includes("cancelled") || lowerStatus.includes("failed"))
      return "bg-red-100 text-red-800";
    return "bg-gray-100 text-gray-800";
  };

  const getStatusIcon = (status: string) => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes("delivered"))
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (lowerStatus.includes("transit"))
      return <Package className="h-4 w-4 text-blue-600" />;
    if (lowerStatus.includes("cancelled") || lowerStatus.includes("failed"))
      return <AlertCircle className="h-4 w-4 text-red-600" />;
    return <Clock className="h-4 w-4 text-gray-600" />;
  };

  const handleTrack = async () => {
    if (!trackingNumber.trim()) {
      toast.error("Please enter a tracking number");
      return;
    }

    setIsLoading(true);
    setTrackingInfo(null);

    try {
      const response = await trackShipLogicShipment(trackingNumber.trim());
      setTrackingInfo(response.tracking);
      toast.success("Tracking information retrieved!");
    } catch (error) {
      console.error("Error tracking shipment:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to track shipment";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Tracking Input */}
      <Card>
        <CardHeader>
          {showBranding && (
            <CardTitle className="flex items-center">
              📦 ShipLogic Tracking
            </CardTitle>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="trackingNumber">
                Shipment ID or Waybill Number
              </Label>
              <Input
                id="trackingNumber"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder={placeholder}
                onKeyPress={(e) => e.key === "Enter" && handleTrack()}
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleTrack}
                disabled={isLoading || !trackingNumber.trim()}
                className="bg-green-600 hover:bg-green-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Tracking...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Track
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tracking Results */}
      {trackingInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Package className="mr-2 h-5 w-5" />
                Shipment Details
              </span>
              <Badge className={getStatusColor(trackingInfo.status)}>
                {trackingInfo.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-xs font-medium text-gray-500">
                    Waybill Number
                  </Label>
                  <p className="text-sm font-mono">
                    {trackingInfo.waybill_number}
                  </p>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-500">
                    Service Level
                  </Label>
                  <p className="text-sm">{trackingInfo.service_level_code}</p>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-500">
                    Collection Date
                  </Label>
                  <p className="text-sm">
                    {new Date(
                      trackingInfo.collection_date,
                    ).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-500">
                    Estimated Delivery
                  </Label>
                  <p className="text-sm">
                    {new Date(
                      trackingInfo.estimated_delivery_date,
                    ).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {trackingInfo.actual_delivery_date && (
                <div className="bg-green-50 p-3 rounded border-l-4 border-green-500">
                  <Label className="text-sm font-medium text-green-800">
                    Delivered
                  </Label>
                  <p className="text-sm text-green-700">
                    {formatDate(trackingInfo.actual_delivery_date)}
                  </p>
                </div>
              )}

              {/* Tracking Events - Simplified */}
              {trackingInfo.tracking_events &&
                trackingInfo.tracking_events.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium mb-3 block">
                      Latest Updates
                    </Label>
                    <div className="space-y-2">
                      {trackingInfo.tracking_events
                        .slice(0, 3)
                        .map((event: ShipLogicTrackingEvent, index: number) => (
                          <div
                            key={index}
                            className="flex items-start gap-3 p-3 bg-gray-50 rounded"
                          >
                            {getStatusIcon(event.status)}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs">
                                  {event.status}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  {formatDate(event.timestamp)}
                                </span>
                              </div>
                              <p className="text-sm">{event.description}</p>
                              {event.location && (
                                <p className="text-xs text-gray-600 flex items-center mt-1">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {event.location}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}

                      {trackingInfo.tracking_events.length > 3 && (
                        <p className="text-xs text-gray-500 text-center">
                          + {trackingInfo.tracking_events.length - 3} more
                          events
                        </p>
                      )}
                    </div>
                  </div>
                )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Results Message */}
      {!trackingInfo && !isLoading && (
        <Card>
          <CardContent className="text-center py-6 sm:py-8">
            <Package className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-4 opacity-50" />
            <p className="text-gray-500 text-sm sm:text-base px-4">
              Enter a shipment ID or waybill number to track your order.
              Tracking numbers are provided when your book purchase is shipped.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ShipLogicTrackingOnly;

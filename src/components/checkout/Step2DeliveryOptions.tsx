import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Truck,
  MapPin,
  Clock,
  Package,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { CheckoutAddress, DeliveryOption } from "@/types/checkout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Step2DeliveryOptionsProps {
  buyerAddress: CheckoutAddress;
  sellerAddress: CheckoutAddress;
  onSelectDelivery: (option: DeliveryOption) => void;
  onBack: () => void;
  selectedDelivery?: DeliveryOption;
}

const Step2DeliveryOptions: React.FC<Step2DeliveryOptionsProps> = ({
  buyerAddress,
  sellerAddress,
  onSelectDelivery,
  onBack,
  selectedDelivery,
}) => {
  const [deliveryOptions, setDeliveryOptions] = useState<DeliveryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDeliveryOptions();
  }, [buyerAddress, sellerAddress]);

  /**
   * 🚚 API Equivalent: POST /api/delivery/calculate
   * Uses seller address + buyer address + courier APIs to get delivery options
   */
  const fetchDeliveryOptions = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log(
        "🚚 POST /api/delivery/calculate - Fetching delivery options...",
        {
          from: sellerAddress,
          to: buyerAddress,
        },
      );

      // Determine zone type based on provinces
      const isLocal =
        buyerAddress.province === sellerAddress.province &&
        buyerAddress.city === sellerAddress.city;
      const isProvincial =
        buyerAddress.province === sellerAddress.province && !isLocal;
      const isNational = buyerAddress.province !== sellerAddress.province;

      let zoneType: "local" | "provincial" | "national";
      if (isLocal) zoneType = "local";
      else if (isProvincial) zoneType = "provincial";
      else zoneType = "national";

      // ✅ Use real courier API pricing instead of hardcoded values
      const { RealCourierPricing } = await import(
        "@/services/realCourierPricing"
      );

      const quoteRequest = {
        from: {
          street: sellerAddress.street,
          city: sellerAddress.city,
          province: sellerAddress.province,
          postal_code: sellerAddress.postal_code,
          country: sellerAddress.country,
        },
        to: {
          street: buyerAddress.street,
          city: buyerAddress.city,
          province: buyerAddress.province,
          postal_code: buyerAddress.postal_code,
          country: buyerAddress.country,
        },
        parcel: {
          weight: 0.5, // Default book weight
          length: 25,
          width: 20,
          height: 5,
          value: 100, // Default value for insurance
        },
      };

      console.log("📞 Fetching real courier quotes:", quoteRequest);

      // Get real quotes from both couriers
      const [courierGuyQuotes, fastwayQuotes] = await Promise.allSettled([
        RealCourierPricing.getCourierGuyQuotes(quoteRequest),
        RealCourierPricing.getFastwayQuotes(quoteRequest),
      ]);

      const baseOptions: DeliveryOption[] = [];

      // Process Courier Guy quotes
      if (
        courierGuyQuotes.status === "fulfilled" &&
        courierGuyQuotes.value.length > 0
      ) {
        courierGuyQuotes.value.forEach((quote) => {
          baseOptions.push({
            courier: "courier-guy",
            service_name: quote.service_name,
            price: quote.price,
            estimated_days: parseInt(quote.estimated_days) || 1,
            description: quote.description,
            zone_type: zoneType,
          });
        });
      }

      // Process Fastway quotes
      if (
        fastwayQuotes.status === "fulfilled" &&
        fastwayQuotes.value.length > 0
      ) {
        fastwayQuotes.value.forEach((quote) => {
          baseOptions.push({
            courier: "fastway",
            service_name: quote.service_name,
            price: quote.price,
            estimated_days: parseInt(quote.estimated_days) || 1,
            description: quote.description,
            zone_type: zoneType,
          });
        });
      }

      // Fallback to zone-based pricing if APIs fail
      if (baseOptions.length === 0) {
        console.warn("⚠️ No API quotes available, using fallback pricing");
        if (zoneType === "local") {
          baseOptions.push(
            {
              courier: "courier-guy",
              service_name: "Courier Guy Local",
              price: 85,
              estimated_days: 1,
              description: "Same city delivery within 1 business day",
              zone_type: "local",
            },
            {
              courier: "fastway",
              service_name: "Fastway Local",
              price: 95,
              estimated_days: 1,
              description: "Same city express delivery",
              zone_type: "local",
            },
          );
        } else if (zoneType === "provincial") {
          baseOptions.push(
            {
              courier: "courier-guy",
              service_name: "Courier Guy Provincial",
              price: 120,
              estimated_days: 2,
              description: "Within province delivery, 2-3 business days",
              zone_type: "provincial",
            },
            {
              courier: "fastway",
              service_name: "Fastway Provincial",
              price: 135,
              estimated_days: 2,
              description: "Provincial express delivery",
              zone_type: "provincial",
            },
          );
        } else {
          baseOptions.push(
            {
              courier: "courier-guy",
              service_name: "Courier Guy National",
              price: 180,
              estimated_days: 3,
              description: "Cross-province delivery, 3-5 business days",
              zone_type: "national",
            },
            {
              courier: "fastway",
              service_name: "Fastway National",
              price: 200,
              estimated_days: 3,
              description: "National express delivery",
              zone_type: "national",
            },
          );
        }
      }

      // Use the real courier pricing we fetched above
      console.log("✅ Setting delivery options:", baseOptions);
      setDeliveryOptions(baseOptions);
    } catch (err) {
      console.error("Error fetching delivery options:", err);
      setError("Failed to load delivery options. Please try again.");
      toast.error("Failed to load delivery options");
    } finally {
      setLoading(false);
    }
  };

  const getZoneBadgeColor = (zoneType: string) => {
    switch (zoneType) {
      case "local":
        return "bg-green-100 text-green-800";
      case "provincial":
        return "bg-blue-100 text-blue-800";
      case "national":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
            <h3 className="text-lg font-semibold mb-2">
              Loading Delivery Options
            </h3>
            <p className="text-gray-600">Calculating shipping costs...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || deliveryOptions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-8 h-8 mx-auto mb-4 text-red-500" />
            <h3 className="text-lg font-semibold mb-2">
              Unable to Load Delivery Options
            </h3>
            <p className="text-gray-600 mb-4">
              {error || "No delivery options available for this route"}
            </p>
            <div className="space-x-4">
              <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button onClick={fetchDeliveryOptions}>Try Again</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Delivery Options
        </h1>
        <p className="text-gray-600">
          Choose how you'd like to receive your book
        </p>
      </div>

      {/* Address Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Delivery Route
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-600">From (Seller)</p>
              <p className="text-sm">
                {sellerAddress.city}, {sellerAddress.province}
              </p>
            </div>
            <div className="border-t pt-3">
              <p className="text-sm font-medium text-gray-600">To (You)</p>
              <p className="text-sm">
                {buyerAddress.street}, {buyerAddress.city},{" "}
                {buyerAddress.province} {buyerAddress.postal_code}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delivery Options */}
      <div className="space-y-4">
        {deliveryOptions.map((option, index) => (
          <Card
            key={index}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedDelivery?.service_name === option.service_name
                ? "ring-2 ring-blue-500 bg-blue-50"
                : "hover:border-gray-300"
            }`}
            onClick={() => onSelectDelivery(option)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gray-100 rounded-lg">
                    <Truck className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{option.service_name}</h3>
                      <Badge className={getZoneBadgeColor(option.zone_type)}>
                        {option.zone_type}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {option.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {option.estimated_days} day
                        {option.estimated_days > 1 ? "s" : ""}
                      </div>
                      <div className="flex items-center gap-1">
                        <Package className="w-4 h-4" />
                        {option.courier}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-green-600">
                    R{option.price.toFixed(2)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!selectedDelivery && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Please select a delivery option to continue.
          </AlertDescription>
        </Alert>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Button
          onClick={() => selectedDelivery && onSelectDelivery(selectedDelivery)}
          disabled={!selectedDelivery}
        >
          Next: Payment
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default Step2DeliveryOptions;

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ProvinceSelector } from "@/components/ui/province-selector";
import {
  Calculator,
  Package,
  Truck,
  Clock,
  DollarSign,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  getShipLogicRates,
  validateShipLogicAddress,
} from "@/services/shipLogicService";
import { ShipLogicQuoteRequest, ShipLogicRate } from "@/types/shiplogic";

interface ShipLogicRateQuoteProps {
  onRateSelected?: (rate: ShipLogicRate) => void;
  initialData?: Partial<ShipLogicQuoteRequest>;
}

const ShipLogicRateQuote = ({
  onRateSelected,
  initialData,
}: ShipLogicRateQuoteProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [rates, setRates] = useState<ShipLogicRate[]>([]);

  const [formData, setFormData] = useState<ShipLogicQuoteRequest>({
    fromAddress: {
      street: initialData?.fromAddress?.street || "",
      suburb: initialData?.fromAddress?.suburb || "",
      city: initialData?.fromAddress?.city || "",
      province: initialData?.fromAddress?.province || "",
      postalCode: initialData?.fromAddress?.postalCode || "",
    },
    toAddress: {
      street: initialData?.toAddress?.street || "",
      suburb: initialData?.toAddress?.suburb || "",
      city: initialData?.toAddress?.city || "",
      province: initialData?.toAddress?.province || "",
      postalCode: initialData?.toAddress?.postalCode || "",
    },
    parcel: {
      weight: initialData?.parcel?.weight || 1,
      length: initialData?.parcel?.length || 25,
      width: initialData?.parcel?.width || 20,
      height: initialData?.parcel?.height || 5,
      description: initialData?.parcel?.description || "Textbook",
      value: initialData?.parcel?.value || 100,
    },
  });

  const handleInputChange = (
    section: "fromAddress" | "toAddress" | "parcel",
    field: string,
    value: string | number,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const validateForm = (): boolean => {
    // Validate from address
    const fromValidation = validateShipLogicAddress(formData.fromAddress);
    if (!fromValidation.isValid) {
      toast.error(`From address errors: ${fromValidation.errors.join(", ")}`);
      return false;
    }

    // Validate to address
    const toValidation = validateShipLogicAddress(formData.toAddress);
    if (!toValidation.isValid) {
      toast.error(`To address errors: ${toValidation.errors.join(", ")}`);
      return false;
    }

    // Validate parcel details
    if (!formData.parcel.description.trim()) {
      toast.error("Package description is required");
      return false;
    }

    if (formData.parcel.weight <= 0) {
      toast.error("Weight must be greater than 0");
      return false;
    }

    if (
      formData.parcel.length <= 0 ||
      formData.parcel.width <= 0 ||
      formData.parcel.height <= 0
    ) {
      toast.error("All dimensions must be greater than 0");
      return false;
    }

    if (formData.parcel.value <= 0) {
      toast.error("Package value must be greater than 0");
      return false;
    }

    return true;
  };

  const handleGetRates = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setRates([]);

    try {
      const fetchedRates = await getShipLogicRates(formData);
      setRates(fetchedRates);

      if (fetchedRates.length === 0) {
        toast.warning("No rates available for this route");
      } else {
        toast.success(
          `Found ${fetchedRates.length} shipping option${fetchedRates.length > 1 ? "s" : ""}`,
        );
      }
    } catch (error) {
      console.error("Error getting rates:", error);

      let userFriendlyMessage =
        "Failed to get shipping rates. Please try again.";

      if (error instanceof Error) {
        if (error.message.includes("Request validation failed")) {
          userFriendlyMessage =
            "Please check that all address fields are properly filled out.";
        } else if (error.message.includes("Authentication failed")) {
          userFriendlyMessage =
            "Shipping service temporarily unavailable. Fallback rates will be used.";
        } else if (error.message.includes("server error")) {
          userFriendlyMessage =
            "Shipping service is experiencing issues. Please try again later.";
        } else if (
          error.message.includes("network") ||
          error.message.includes("timeout")
        ) {
          userFriendlyMessage =
            "Network connection issue. Please check your internet and try again.";
        } else {
          userFriendlyMessage = error.message;
        }
      }

      toast.error(userFriendlyMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Quote Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calculator className="mr-2 h-5 w-5" />
            Get ShipLogic Rate Quote
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* From Address */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Package className="mr-2 h-4 w-4" />
                From Address
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="fromStreet">Street Address *</Label>
                  <Input
                    id="fromStreet"
                    value={formData.fromAddress.street}
                    onChange={(e) =>
                      handleInputChange("fromAddress", "street", e.target.value)
                    }
                    placeholder="Street address"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="fromSuburb">Suburb *</Label>
                  <Input
                    id="fromSuburb"
                    value={formData.fromAddress.suburb}
                    onChange={(e) =>
                      handleInputChange("fromAddress", "suburb", e.target.value)
                    }
                    placeholder="Suburb/Area"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="fromCity">City *</Label>
                  <Input
                    id="fromCity"
                    value={formData.fromAddress.city}
                    onChange={(e) =>
                      handleInputChange("fromAddress", "city", e.target.value)
                    }
                    placeholder="City"
                    required
                  />
                </div>
                <div>
                  <ProvinceSelector
                    label="Province"
                    value={formData.fromAddress.province}
                    onValueChange={(value) =>
                      handleInputChange("fromAddress", "province", value)
                    }
                    placeholder="Select province"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="fromPostalCode">Postal Code *</Label>
                  <Input
                    id="fromPostalCode"
                    value={formData.fromAddress.postalCode}
                    onChange={(e) =>
                      handleInputChange(
                        "fromAddress",
                        "postalCode",
                        e.target.value,
                      )
                    }
                    placeholder="4-digit postal code"
                    maxLength={4}
                    required
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* To Address */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Truck className="mr-2 h-4 w-4" />
                To Address
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="toStreet">Street Address *</Label>
                  <Input
                    id="toStreet"
                    value={formData.toAddress.street}
                    onChange={(e) =>
                      handleInputChange("toAddress", "street", e.target.value)
                    }
                    placeholder="Street address"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="toSuburb">Suburb *</Label>
                  <Input
                    id="toSuburb"
                    value={formData.toAddress.suburb}
                    onChange={(e) =>
                      handleInputChange("toAddress", "suburb", e.target.value)
                    }
                    placeholder="Suburb/Area"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="toCity">City *</Label>
                  <Input
                    id="toCity"
                    value={formData.toAddress.city}
                    onChange={(e) =>
                      handleInputChange("toAddress", "city", e.target.value)
                    }
                    placeholder="City"
                    required
                  />
                </div>
                <div>
                  <ProvinceSelector
                    label="Province"
                    value={formData.toAddress.province}
                    onValueChange={(value) =>
                      handleInputChange("toAddress", "province", value)
                    }
                    placeholder="Select province"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="toPostalCode">Postal Code *</Label>
                  <Input
                    id="toPostalCode"
                    value={formData.toAddress.postalCode}
                    onChange={(e) =>
                      handleInputChange(
                        "toAddress",
                        "postalCode",
                        e.target.value,
                      )
                    }
                    placeholder="4-digit postal code"
                    maxLength={4}
                    required
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Package Details */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Package Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="weight">Weight (kg) *</Label>
                  <Input
                    id="weight"
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={formData.parcel.weight}
                    onChange={(e) =>
                      handleInputChange(
                        "parcel",
                        "weight",
                        parseFloat(e.target.value) || 0,
                      )
                    }
                    placeholder="1.5"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="length">Length (cm) *</Label>
                  <Input
                    id="length"
                    type="number"
                    min="1"
                    value={formData.parcel.length}
                    onChange={(e) =>
                      handleInputChange(
                        "parcel",
                        "length",
                        parseFloat(e.target.value) || 0,
                      )
                    }
                    placeholder="25"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="width">Width (cm) *</Label>
                  <Input
                    id="width"
                    type="number"
                    min="1"
                    value={formData.parcel.width}
                    onChange={(e) =>
                      handleInputChange(
                        "parcel",
                        "width",
                        parseFloat(e.target.value) || 0,
                      )
                    }
                    placeholder="20"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="height">Height (cm) *</Label>
                  <Input
                    id="height"
                    type="number"
                    min="1"
                    value={formData.parcel.height}
                    onChange={(e) =>
                      handleInputChange(
                        "parcel",
                        "height",
                        parseFloat(e.target.value) || 0,
                      )
                    }
                    placeholder="5"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="description">Description *</Label>
                  <Input
                    id="description"
                    value={formData.parcel.description}
                    onChange={(e) =>
                      handleInputChange("parcel", "description", e.target.value)
                    }
                    placeholder="Mathematics Textbook Grade 12"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="value">Value (ZAR) *</Label>
                  <Input
                    id="value"
                    type="number"
                    min="1"
                    value={formData.parcel.value}
                    onChange={(e) =>
                      handleInputChange(
                        "parcel",
                        "value",
                        parseFloat(e.target.value) || 0,
                      )
                    }
                    placeholder="250"
                    required
                  />
                </div>
              </div>
            </div>

            <Button
              onClick={handleGetRates}
              disabled={isLoading}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Getting Rates...
                </>
              ) : (
                <>
                  <Calculator className="mr-2 h-4 w-4" />
                  Get Shipping Rates
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Rate Results */}
      {rates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="mr-2 h-5 w-5" />
              Available Shipping Options
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rates.map((rate, index) => (
                <Card
                  key={index}
                  className="border-2 hover:border-green-300 transition-colors"
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-lg">
                          {rate.service_level_name}
                        </h4>
                        <Badge variant="outline">
                          {rate.service_level_code}
                        </Badge>
                      </div>

                      <p className="text-sm text-gray-600">
                        {rate.service_level_description}
                      </p>

                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-green-600">
                          {formatCurrency(rate.total_charge_value)}
                        </span>
                        <div className="text-right">
                          <div className="flex items-center text-sm text-gray-600">
                            <Clock className="h-3 w-3 mr-1" />
                            {rate.transit_days} day
                            {rate.transit_days !== 1 ? "s" : ""}
                          </div>
                        </div>
                      </div>

                      <div className="text-xs text-gray-500 space-y-1">
                        <div>Rate: {formatCurrency(rate.rate_value)}</div>
                        <div>
                          Est. Collection:{" "}
                          {formatDate(rate.estimated_collection_date)}
                        </div>
                        <div>
                          Est. Delivery:{" "}
                          {formatDate(rate.estimated_delivery_date)}
                        </div>
                      </div>

                      {onRateSelected && (
                        <Button
                          onClick={() => onRateSelected(rate)}
                          variant="outline"
                          className="w-full mt-4"
                        >
                          Select This Option
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Results */}
      {rates.length === 0 && !isLoading && (
        <Card>
          <CardContent className="text-center py-8">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-gray-500">
              Enter address details and click "Get Shipping Rates" to see
              available options
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ShipLogicRateQuote;

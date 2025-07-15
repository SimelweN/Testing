import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  MapPin,
  Plus,
  Edit,
  Truck,
  Home,
  CheckCircle,
  AlertTriangle,
  Navigation,
  Package,
  Loader2,
  Info,
} from "lucide-react";
import GoogleMapsAddressAutocomplete, {
  AddressData as GoogleAddressData,
} from "@/components/GoogleMapsAddressAutocomplete";
import { AddressData, Address } from "@/types/address";

interface ModernAddressTabProps {
  addressData: AddressData | null;
  onSaveAddresses?: (
    pickup: Address,
    shipping: Address,
    same: boolean,
  ) => Promise<void>;
  isLoading?: boolean;
}

const ModernAddressTab = ({
  addressData,
  onSaveAddresses,
  isLoading = false,
}: ModernAddressTabProps) => {
  const [editMode, setEditMode] = useState<
    "none" | "pickup" | "shipping" | "both"
  >("none");
  const [pickupAddress, setPickupAddress] = useState<Address | null>(null);
  const [shippingAddress, setShippingAddress] = useState<Address | null>(null);
  const [sameAsPickup, setSameAsPickup] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (addressData) {
      setPickupAddress(addressData.pickup_address);
      setShippingAddress(addressData.shipping_address);
      setSameAsPickup(addressData.same_as_pickup || false);
    }
  }, [addressData]);

  const formatAddress = (address: Address | null | undefined) => {
    if (!address) return null;
    return `${address.street}, ${address.city}, ${address.province} ${address.postalCode}`;
  };

  const handleSave = async () => {
    if (!pickupAddress || !shippingAddress || !onSaveAddresses) return;

    setIsSaving(true);
    try {
      await onSaveAddresses(pickupAddress, shippingAddress, sameAsPickup);
      setEditMode("none");
    } catch (error) {
      console.error("Error saving addresses:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const startEditing = (mode: "pickup" | "shipping" | "both") => {
    setEditMode(mode);
    // Initialize addresses if they don't exist
    if (!pickupAddress) {
      setPickupAddress({
        street: "",
        city: "",
        province: "",
        postalCode: "",
        country: "South Africa",
      });
    }
    if (!shippingAddress) {
      setShippingAddress({
        street: "",
        city: "",
        province: "",
        postalCode: "",
        country: "South Africa",
      });
    }
  };

  const handlePickupAddressChange = (address: GoogleAddressData) => {
    const formattedAddress: Address = {
      street: address.street,
      city: address.city,
      province: address.province,
      postalCode: address.postalCode,
      country: address.country,
    };
    setPickupAddress(formattedAddress);

    if (sameAsPickup) {
      setShippingAddress(formattedAddress);
    }
  };

  const handleShippingAddressChange = (address: GoogleAddressData) => {
    const formattedAddress: Address = {
      street: address.street,
      city: address.city,
      province: address.province,
      postalCode: address.postalCode,
      country: address.country,
    };
    setShippingAddress(formattedAddress);
  };

  if (isLoading) {
    return (
      <Card className="border-2 border-orange-100 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-2 border-orange-100 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-t-lg">
          <CardTitle className="text-xl md:text-2xl flex items-center gap-3">
            <MapPin className="h-6 w-6 text-orange-600" />
            Address Management
            {pickupAddress && shippingAddress && (
              <Badge className="bg-green-600 text-white">
                <CheckCircle className="h-3 w-3 mr-1" />
                Configured
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Set up your pickup and shipping addresses to enable book sales and
              deliveries. The pickup address is where buyers can collect books,
              and the shipping address is where you'll receive books you
              purchase.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Address Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pickup Address */}
        <Card className="border-2 border-blue-100 hover:shadow-lg transition-shadow">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              Pickup Address
              {pickupAddress && (
                <Badge
                  variant="outline"
                  className="border-blue-300 text-blue-700"
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Set
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Where buyers can meet you to collect their books
              </p>

              {pickupAddress && editMode !== "pickup" && editMode !== "both" ? (
                <div className="space-y-3">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start gap-3">
                      <Home className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-blue-900">
                          Current Address
                        </p>
                        <p className="text-sm text-blue-800 mt-1">
                          {formatAddress(pickupAddress)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => startEditing("pickup")}
                    variant="outline"
                    className="w-full border-blue-300 text-blue-700 hover:bg-blue-50"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Pickup Address
                  </Button>
                </div>
              ) : editMode === "pickup" || editMode === "both" ? (
                <div className="space-y-4">
                  <SimpleAddressInput
                    label="Pickup Address"
                    required
                    onAddressSelect={handlePickupAddressChange}
                    defaultValue={pickupAddress || undefined}
                  />
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="font-medium text-gray-600 mb-2">
                    No Pickup Address Set
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Add a pickup address to start selling books
                  </p>
                  <Button
                    onClick={() => startEditing("pickup")}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Pickup Address
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Shipping Address */}
        <Card className="border-2 border-green-100 hover:shadow-lg transition-shadow">
          <CardHeader className="bg-gradient-to-r from-green-50 to-green-100">
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-green-600" />
              Shipping Address
              {shippingAddress && (
                <Badge
                  variant="outline"
                  className="border-green-300 text-green-700"
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Set
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Where you want to receive books that are shipped to you
              </p>

              {shippingAddress &&
              editMode !== "shipping" &&
              editMode !== "both" ? (
                <div className="space-y-3">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-start gap-3">
                      <Navigation className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-green-900">
                          Current Address
                        </p>
                        <p className="text-sm text-green-800 mt-1">
                          {formatAddress(shippingAddress)}
                        </p>
                        {sameAsPickup && (
                          <Badge className="mt-2 bg-green-100 text-green-800 border-0">
                            Same as pickup address
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => startEditing("shipping")}
                    variant="outline"
                    className="w-full border-green-300 text-green-700 hover:bg-green-50"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Shipping Address
                  </Button>
                </div>
              ) : editMode === "shipping" || editMode === "both" ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                    <input
                      type="checkbox"
                      id="same-as-pickup"
                      checked={sameAsPickup}
                      onChange={(e) => {
                        setSameAsPickup(e.target.checked);
                        if (e.target.checked && pickupAddress) {
                          setShippingAddress(pickupAddress);
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <label
                      htmlFor="same-as-pickup"
                      className="text-sm font-medium"
                    >
                      Use pickup address for shipping
                    </label>
                  </div>

                  {!sameAsPickup && (
                    <SimpleAddressInput
                      label="Shipping Address"
                      required
                      onAddressSelect={handleShippingAddressChange}
                      defaultValue={shippingAddress || undefined}
                    />
                  )}

                  {sameAsPickup && (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        Your shipping address will be the same as your pickup
                        address.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Truck className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="font-medium text-gray-600 mb-2">
                    No Shipping Address Set
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Add a shipping address to receive deliveries
                  </p>
                  <Button
                    onClick={() => startEditing("shipping")}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Shipping Address
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons for Edit Mode */}
      {editMode !== "none" && (
        <Card className="border-2 border-purple-100">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <Button
                onClick={() => setEditMode("none")}
                variant="outline"
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!pickupAddress || !shippingAddress || isSaving}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                {isSaving ? "Saving..." : "Save Addresses"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Setup */}
      {!pickupAddress && !shippingAddress && editMode === "none" && (
        <Card className="border-2 border-indigo-100">
          <CardContent className="p-6 text-center">
            <MapPin className="h-16 w-16 text-indigo-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Quick Address Setup
            </h3>
            <p className="text-gray-600 mb-6">
              Set up both addresses at once to get started quickly
            </p>
            <Button
              onClick={() => startEditing("both")}
              className="bg-indigo-600 hover:bg-indigo-700"
              size="lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              Set Up Both Addresses
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ModernAddressTab;

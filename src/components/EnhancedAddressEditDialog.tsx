import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ProvinceSelector } from "@/components/ui/province-selector";
import { MapPin, Loader2, Navigation } from "lucide-react";
import { toast } from "sonner";
import { Address, AddressData } from "@/types/address";
import { Autocomplete, GoogleMap, Marker } from "@react-google-maps/api";
import { useGoogleMaps } from "@/contexts/GoogleMapsContext";

const mapContainerStyle = { width: "100%", height: "300px" };
const defaultCenter = { lat: -26.2041, lng: 28.0473 }; // Johannesburg

interface EnhancedAddressEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  addressData: AddressData | null;
  onSave: (pickup: Address, shipping: Address, same: boolean) => Promise<void>;
  isLoading: boolean;
}

const EnhancedAddressEditDialog = ({
  isOpen,
  onClose,
  addressData,
  onSave,
  isLoading,
}: EnhancedAddressEditDialogProps) => {
  const [pickupAddress, setPickupAddress] = useState({
    street: "",
    city: "",
    province: "",
    postalCode: "",
  });

  const [shippingAddress, setShippingAddress] = useState({
    street: "",
    city: "",
    province: "",
    postalCode: "",
  });

  const [sameAsPickup, setSameAsPickup] = useState(false);
  const [useGoogleMaps, setUseGoogleMaps] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Google Maps context
  const googleMapsContext = useGoogleMaps();

  // Google Maps refs and state
  const pickupAutocompleteRef = useRef(null);
  const shippingAutocompleteRef = useRef(null);
  const [pickupCoords, setPickupCoords] = useState(null);
  const [shippingCoords, setShippingCoords] = useState(null);

  useEffect(() => {
    if (isOpen && addressData) {
      // Handle pickup address
      if (addressData.pickup_address) {
        const pickup = addressData.pickup_address;
        setPickupAddress({
          street: pickup.street || "",
          city: pickup.city || "",
          province: pickup.province || "",
          postalCode: pickup.postalCode || pickup.postal_code || "",
        });
      }

      // Handle shipping address
      if (addressData.shipping_address) {
        const shipping = addressData.shipping_address;
        setShippingAddress({
          street: shipping.street || "",
          city: shipping.city || "",
          province: shipping.province || "",
          postalCode: shipping.postalCode || shipping.postal_code || "",
        });
      }

      // Check if addresses are the same
      const pickup = addressData.pickup_address;
      const shipping = addressData.shipping_address;
      if (pickup && shipping) {
        const isSame =
          pickup.street === shipping.street &&
          pickup.city === shipping.city &&
          pickup.province === shipping.province &&
          pickup.postalCode === shipping.postalCode;
        setSameAsPickup(isSame);
      }
    }
  }, [isOpen, addressData]);

  useEffect(() => {
    if (sameAsPickup) {
      setShippingAddress({ ...pickupAddress });
      setShippingCoords(pickupCoords);
    }
  }, [sameAsPickup, pickupAddress, pickupCoords]);

  // Google Maps place selection handlers
  const handlePickupPlaceChanged = () => {
    if (!pickupAutocompleteRef.current) return;

    const place = pickupAutocompleteRef.current.getPlace();
    if (!place || !place.geometry) {
      toast.error("Please select a valid address from the suggestions.");
      return;
    }

    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();

    // Extract address components
    let street = "",
      city = "",
      province = "",
      postalCode = "";

    if (place.address_components) {
      for (const component of place.address_components) {
        const types = component.types;
        if (types.includes("street_number") || types.includes("route")) {
          street = (street + " " + component.long_name).trim();
        } else if (
          types.includes("locality") ||
          types.includes("administrative_area_level_2")
        ) {
          city = component.long_name;
        } else if (types.includes("administrative_area_level_1")) {
          province = component.long_name;
        } else if (types.includes("postal_code")) {
          postalCode = component.long_name;
        }
      }
    }

    const newAddress = {
      street: street || place.formatted_address?.split(",")[0] || "",
      city,
      province,
      postalCode,
    };

    setPickupAddress(newAddress);
    setPickupCoords({ lat, lng });

    if (sameAsPickup) {
      setShippingAddress(newAddress);
      setShippingCoords({ lat, lng });
    }

    console.log("Pickup address selected:", newAddress);
  };

  const handleShippingPlaceChanged = () => {
    if (!shippingAutocompleteRef.current) return;

    const place = shippingAutocompleteRef.current.getPlace();
    if (!place || !place.geometry) {
      toast.error("Please select a valid address from the suggestions.");
      return;
    }

    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();

    // Extract address components
    let street = "",
      city = "",
      province = "",
      postalCode = "";

    if (place.address_components) {
      for (const component of place.address_components) {
        const types = component.types;
        if (types.includes("street_number") || types.includes("route")) {
          street = (street + " " + component.long_name).trim();
        } else if (
          types.includes("locality") ||
          types.includes("administrative_area_level_2")
        ) {
          city = component.long_name;
        } else if (types.includes("administrative_area_level_1")) {
          province = component.long_name;
        } else if (types.includes("postal_code")) {
          postalCode = component.long_name;
        }
      }
    }

    const newAddress = {
      street: street || place.formatted_address?.split(",")[0] || "",
      city,
      province,
      postalCode,
    };

    setShippingAddress(newAddress);
    setShippingCoords({ lat, lng });

    console.log("Shipping address selected:", newAddress);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate pickup address
    if (
      !pickupAddress.street ||
      !pickupAddress.city ||
      !pickupAddress.province ||
      !pickupAddress.postalCode
    ) {
      toast.error("Please fill in all pickup address fields");
      return;
    }

    // Validate shipping address if not using same address
    if (
      !sameAsPickup &&
      (!shippingAddress.street ||
        !shippingAddress.city ||
        !shippingAddress.province ||
        !shippingAddress.postalCode)
    ) {
      toast.error("Please fill in all shipping address fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const finalShippingAddress = sameAsPickup
        ? pickupAddress
        : shippingAddress;
      await onSave(pickupAddress, finalShippingAddress, sameAsPickup);
      toast.success("Addresses updated successfully!");
      onClose();
    } catch (error) {
      console.error("Error saving addresses:", error);
      toast.error("Failed to save addresses. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatAddressForDisplay = (address: any) => {
    if (!address?.street) return "";
    return `${address.street}, ${address.city}, ${address.province} ${address.postalCode}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] max-w-[90vw] sm:max-w-4xl max-h-[85vh] mx-auto my-auto overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5 text-book-600" />
            Edit Addresses with Google Maps
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Google Maps Toggle */}
          <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <Checkbox
              id="use-google-maps"
              checked={useGoogleMaps}
              onCheckedChange={(checked) => setUseGoogleMaps(checked === true)}
              disabled={!googleMapsContext.isLoaded}
            />
            <Label htmlFor="use-google-maps" className="text-sm font-medium">
              🗺️ Use Google Maps for precise address selection
              {googleMapsContext.isLoaded ? " (recommended)" : " (loading...)"}
            </Label>
          </div>

          {/* Google Maps Error */}
          {googleMapsContext.loadError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                <strong>Maps Error:</strong> Could not load Google Maps. You can
                still use manual address entry.
              </p>
            </div>
          )}

          {/* Pickup Address */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <MapPin className="h-5 w-5 text-book-600" />
              Pickup Address *
            </h3>

            {useGoogleMaps && googleMapsContext.isLoaded ? (
              <div className="space-y-4">
                <div>
                  <Label
                    htmlFor="pickup-google-input"
                    className="text-sm font-medium"
                  >
                    Search for your pickup address
                  </Label>
                  <Autocomplete
                    onLoad={(autocomplete) =>
                      (pickupAutocompleteRef.current = autocomplete)
                    }
                    onPlaceChanged={handlePickupPlaceChanged}
                  >
                    <Input
                      id="pickup-google-input"
                      placeholder="Start typing your pickup address..."
                      className="w-full"
                      defaultValue={formatAddressForDisplay(pickupAddress)}
                    />
                  </Autocomplete>
                  <p className="text-xs text-gray-600 mt-1">
                    Try: "1 Sandton Drive, Sandton" or "V&A Waterfront, Cape
                    Town"
                  </p>
                </div>

                {pickupCoords && (
                  <div className="space-y-3">
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800">
                        <strong>✅ Pickup Address Selected:</strong>
                        <br />
                        {formatAddressForDisplay(pickupAddress)}
                      </p>
                    </div>
                    <GoogleMap
                      mapContainerStyle={mapContainerStyle}
                      center={pickupCoords}
                      zoom={15}
                    >
                      <Marker position={pickupCoords} title="Pickup Location" />
                    </GoogleMap>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pickup-street">Street Address *</Label>
                  <Input
                    id="pickup-street"
                    value={pickupAddress.street}
                    onChange={(e) =>
                      setPickupAddress({
                        ...pickupAddress,
                        street: e.target.value,
                      })
                    }
                    placeholder="123 Main Street"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="pickup-city">City *</Label>
                  <Input
                    id="pickup-city"
                    value={pickupAddress.city}
                    onChange={(e) =>
                      setPickupAddress({
                        ...pickupAddress,
                        city: e.target.value,
                      })
                    }
                    placeholder="Johannesburg"
                    required
                  />
                </div>
                <div>
                  <ProvinceSelector
                    label="Province"
                    value={pickupAddress.province || ""}
                    onValueChange={(value) =>
                      setPickupAddress((prev) => ({ ...prev, province: value }))
                    }
                    placeholder="Select province"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="pickup-postal">Postal Code *</Label>
                  <Input
                    id="pickup-postal"
                    value={pickupAddress.postalCode}
                    onChange={(e) =>
                      setPickupAddress({
                        ...pickupAddress,
                        postalCode: e.target.value,
                      })
                    }
                    placeholder="2000"
                    required
                  />
                </div>
              </div>
            )}
          </div>

          {/* Same Address Checkbox */}
          <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
            <Checkbox
              id="same-address"
              checked={sameAsPickup}
              onCheckedChange={(checked) => setSameAsPickup(checked === true)}
            />
            <Label htmlFor="same-address" className="font-medium">
              📦 Shipping address is the same as pickup address
            </Label>
          </div>

          {/* Shipping Address */}
          {!sameAsPickup && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <MapPin className="h-5 w-5 text-book-600" />
                Shipping Address *
              </h3>

              {useGoogleMaps && googleMapsContext.isLoaded ? (
                <div className="space-y-4">
                  <div>
                    <Label
                      htmlFor="shipping-google-input"
                      className="text-sm font-medium"
                    >
                      Search for your shipping address
                    </Label>
                    <Autocomplete
                      onLoad={(autocomplete) =>
                        (shippingAutocompleteRef.current = autocomplete)
                      }
                      onPlaceChanged={handleShippingPlaceChanged}
                    >
                      <Input
                        id="shipping-google-input"
                        placeholder="Start typing your shipping address..."
                        className="w-full"
                        defaultValue={formatAddressForDisplay(shippingAddress)}
                      />
                    </Autocomplete>
                  </div>

                  {shippingCoords && (
                    <div className="space-y-3">
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-800">
                          <strong>✅ Shipping Address Selected:</strong>
                          <br />
                          {formatAddressForDisplay(shippingAddress)}
                        </p>
                      </div>
                      <GoogleMap
                        mapContainerStyle={mapContainerStyle}
                        center={shippingCoords}
                        zoom={15}
                      >
                        <Marker
                          position={shippingCoords}
                          title="Shipping Location"
                        />
                      </GoogleMap>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="shipping-street">Street Address *</Label>
                    <Input
                      id="shipping-street"
                      value={shippingAddress.street}
                      onChange={(e) =>
                        setShippingAddress({
                          ...shippingAddress,
                          street: e.target.value,
                        })
                      }
                      placeholder="123 Main Street"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="shipping-city">City *</Label>
                    <Input
                      id="shipping-city"
                      value={shippingAddress.city}
                      onChange={(e) =>
                        setShippingAddress({
                          ...shippingAddress,
                          city: e.target.value,
                        })
                      }
                      placeholder="Johannesburg"
                      required
                    />
                  </div>
                  <div>
                    <ProvinceSelector
                      label="Province"
                      value={shippingAddress.province || ""}
                      onValueChange={(value) =>
                        setShippingAddress((prev) => ({
                          ...prev,
                          province: value,
                        }))
                      }
                      placeholder="Select province"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="shipping-postal">Postal Code *</Label>
                    <Input
                      id="shipping-postal"
                      value={shippingAddress.postalCode}
                      onChange={(e) =>
                        setShippingAddress({
                          ...shippingAddress,
                          postalCode: e.target.value,
                        })
                      }
                      placeholder="2000"
                      required
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </form>

        <DialogFooter className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || isLoading}
            className="bg-book-600 hover:bg-book-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <MapPin className="h-4 w-4 mr-2" />
                Save Addresses
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedAddressEditDialog;

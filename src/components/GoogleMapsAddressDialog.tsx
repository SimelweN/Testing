import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { MapPin, Loader2, Navigation, Info } from "lucide-react";
import { toast } from "sonner";
import { Address, AddressData } from "@/types/address";
import { Autocomplete, GoogleMap, Marker } from "@react-google-maps/api";
import { useGoogleMaps } from "@/contexts/GoogleMapsContext";
import {
  extractProvince,
  extractCity,
  extractPostalCode,
} from "@/utils/googleMapsUtils";

const mapContainerStyle = { width: "100%", height: "300px" };

interface GoogleMapsAddressDialogProps {
  isOpen: boolean;
  onClose: () => void;
  addressData: AddressData | null;
  onSave: (pickup: Address, shipping: Address, same: boolean) => Promise<void>;
  isLoading: boolean;
}

const GoogleMapsAddressDialog = ({
  isOpen,
  onClose,
  addressData,
  onSave,
  isLoading,
}: GoogleMapsAddressDialogProps) => {
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

  const [pickupInstructions, setPickupInstructions] = useState("");
  const [shippingInstructions, setShippingInstructions] = useState("");
  const [sameAsPickup, setSameAsPickup] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Google Maps context and refs
  const googleMapsContext = useGoogleMaps();
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
        setPickupInstructions(pickup.instructions || "");
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
        setShippingInstructions(shipping.instructions || "");
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
      setShippingInstructions(pickupInstructions);
    }
  }, [sameAsPickup, pickupAddress, pickupCoords, pickupInstructions]);

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

    // Extract address components using utility functions
    const province = extractProvince(place);
    const city = extractCity(place);
    const postalCode = extractPostalCode(place);

    // Extract street address from formatted address or components
    let street = "";
    if (place.address_components) {
      for (const component of place.address_components) {
        const types = component.types;
        if (types.includes("street_number") || types.includes("route")) {
          street = (street + " " + component.long_name).trim();
        }
      }
    }

    const newAddress = {
      street: street || place.formatted_address?.split(",")[0] || "",
      city: city || "",
      province: province || "",
      postalCode: postalCode || "",
    };

    setPickupAddress(newAddress);
    setPickupCoords({ lat, lng });

    if (sameAsPickup) {
      setShippingAddress(newAddress);
      setShippingCoords({ lat, lng });
    }

    console.log("Pickup address selected:", newAddress);
    console.log("Province extracted:", province);
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

    // Extract address components using utility functions
    const province = extractProvince(place);
    const city = extractCity(place);
    const postalCode = extractPostalCode(place);

    // Extract street address from formatted address or components
    let street = "";
    if (place.address_components) {
      for (const component of place.address_components) {
        const types = component.types;
        if (types.includes("street_number") || types.includes("route")) {
          street = (street + " " + component.long_name).trim();
        }
      }
    }

    const newAddress = {
      street: street || place.formatted_address?.split(",")[0] || "",
      city: city || "",
      province: province || "",
      postalCode: postalCode || "",
    };

    setShippingAddress(newAddress);
    setShippingCoords({ lat, lng });

    console.log("Shipping address selected:", newAddress);
    console.log("Province extracted:", province);
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
      toast.error(
        "Please select a complete pickup address from Google Maps suggestions",
      );
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
      toast.error(
        "Please select a complete shipping address from Google Maps suggestions",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const finalPickupAddress = {
        ...pickupAddress,
        instructions: pickupInstructions,
      };

      const finalShippingAddress = sameAsPickup
        ? finalPickupAddress
        : {
            ...shippingAddress,
            instructions: shippingInstructions,
          };

      await onSave(finalPickupAddress, finalShippingAddress, sameAsPickup);
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

  if (!googleMapsContext.isLoaded) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center p-6">
            <Loader2 className="h-8 w-8 animate-spin text-book-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Loading Google Maps</h3>
            <p className="text-sm text-gray-600 text-center">
              Please wait while we load the map for precise address selection...
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (googleMapsContext.loadError) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center p-6">
            <MapPin className="h-8 w-8 text-red-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-red-800">
              Maps Unavailable
            </h3>
            <p className="text-sm text-gray-600 text-center mb-4">
              Google Maps couldn't load. Please check your internet connection
              and try again.
            </p>
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5 text-book-600" />
            Set Your Addresses with Google Maps
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Pickup Address */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <MapPin className="h-5 w-5 text-book-600" />
              Pickup Address *
            </h3>

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
                  Try: "1 Sandton Drive, Sandton" or "V&A Waterfront, Cape Town"
                </p>
              </div>

              {/* Pickup Instructions */}
              <div>
                <Label
                  htmlFor="pickup-instructions"
                  className="text-sm font-medium flex items-center gap-2"
                >
                  <Info className="h-4 w-4" />
                  Additional Pickup Instructions
                </Label>
                <Textarea
                  id="pickup-instructions"
                  placeholder="e.g., Unit 5B, Building A, Green Estate, Gate code: 1234, Buzzer: Smith"
                  value={pickupInstructions}
                  onChange={(e) => setPickupInstructions(e.target.value)}
                  className="min-h-[80px]"
                />
                <p className="text-xs text-gray-600 mt-1">
                  Add details like unit number, building, estate name, gate
                  codes, or special instructions
                </p>
              </div>

              {pickupCoords && (
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      <strong>✅ Pickup Location Selected:</strong>
                      <br />
                      {formatAddressForDisplay(pickupAddress)}
                      {pickupInstructions && (
                        <>
                          <br />
                          <strong>Instructions:</strong> {pickupInstructions}
                        </>
                      )}
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
          </div>

          {/* Same Address Checkbox */}
          <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
            <Checkbox
              id="same-address"
              checked={sameAsPickup}
              onCheckedChange={(checked) => setSameAsPickup(checked === true)}
            />
            <Label htmlFor="same-address" className="font-medium">
              📦 My shipping address is the same as pickup address
            </Label>
          </div>

          {/* Shipping Address */}
          {!sameAsPickup && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <MapPin className="h-5 w-5 text-book-600" />
                Shipping Address *
              </h3>

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

                {/* Shipping Instructions */}
                <div>
                  <Label
                    htmlFor="shipping-instructions"
                    className="text-sm font-medium flex items-center gap-2"
                  >
                    <Info className="h-4 w-4" />
                    Additional Shipping Instructions
                  </Label>
                  <Textarea
                    id="shipping-instructions"
                    placeholder="e.g., Apartment 3A, Block C, Blue Ridge Complex, Leave with security"
                    value={shippingInstructions}
                    onChange={(e) => setShippingInstructions(e.target.value)}
                    className="min-h-[80px]"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    Add delivery details like apartment number, complex name, or
                    special delivery instructions
                  </p>
                </div>

                {shippingCoords && (
                  <div className="space-y-3">
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800">
                        <strong>✅ Shipping Location Selected:</strong>
                        <br />
                        {formatAddressForDisplay(shippingAddress)}
                        {shippingInstructions && (
                          <>
                            <br />
                            <strong>Instructions:</strong>{" "}
                            {shippingInstructions}
                          </>
                        )}
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
            </div>
          )}
        </form>

        <DialogFooter className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              isLoading ||
              !pickupCoords ||
              (!sameAsPickup && !shippingCoords)
            }
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

export default GoogleMapsAddressDialog;

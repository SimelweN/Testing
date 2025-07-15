import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import GoogleMapsAddressAutocomplete, {
  AddressData as GoogleAddressData,
} from "@/components/GoogleMapsAddressAutocomplete";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapPin, AlertCircle } from "lucide-react";

interface AddressData {
  formattedAddress: string;
  latitude: number;
  longitude: number;
  street?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  country?: string;
}

interface Address {
  street: string;
  city: string;
  province: string;
  postalCode: string;
}

interface PickupAddressInputProps {
  onAddressUpdate: (address: Address) => void;
  initialAddress?: Address;
  error?: string;
  className?: string;
}

const PickupAddressInput = ({
  onAddressUpdate,
  initialAddress,
  error,
  className = "",
}: PickupAddressInputProps) => {
  const [address, setAddress] = useState<Address>(
    initialAddress || {
      street: "",
      city: "",
      province: "",
      postalCode: "",
    },
  );

  const [useManualEntry, setUseManualEntry] = useState(false);
  const [hasSelectedAddress, setHasSelectedAddress] = useState(
    !!initialAddress?.street,
  );

  const handleGoogleMapsSelect = (addressData: GoogleAddressData) => {
    const newAddress: Address = {
      street: addressData.street || "",
      city: addressData.city || "",
      province: addressData.province || "",
      postalCode: addressData.postalCode || "",
    };

    setAddress(newAddress);
    setHasSelectedAddress(true);
    onAddressUpdate(newAddress);
  };

  const handleManualUpdate = (field: keyof Address, value: string) => {
    const newAddress = { ...address, [field]: value };
    setAddress(newAddress);

    // Check if address is complete
    const isComplete = Object.values(newAddress).every(
      (val) => val.trim() !== "",
    );
    if (isComplete) {
      setHasSelectedAddress(true);
      onAddressUpdate(newAddress);
    }
  };

  const formatAddressForDisplay = (addr: Address) => {
    if (!addr.street) return "";
    return `${addr.street}, ${addr.city}, ${addr.province} ${addr.postalCode}`;
  };

  const isAddressComplete =
    address.street && address.city && address.province && address.postalCode;

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="space-y-2">
        <Label className="text-base font-medium">
          Pickup Address <span className="text-red-500">*</span>
        </Label>
        <p className="text-sm text-gray-600">
          This is where buyers will collect the book from you.
        </p>
      </div>

      {/* Address Entry Method Toggle */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="manual-entry-pickup"
          checked={useManualEntry}
          onCheckedChange={(checked) => setUseManualEntry(checked === true)}
        />
        <Label htmlFor="manual-entry-pickup" className="text-sm">
          Enter address manually instead of using Google Maps
        </Label>
      </div>

      {/* Google Maps or Manual Entry */}
      {!useManualEntry ? (
        <GoogleMapsAddressAutocomplete
          onAddressSelect={handleGoogleMapsSelect}
          placeholder="Enter your pickup address..."
          required
          error={error}
          defaultValue={{
            formattedAddress: formatAddressForDisplay(address),
            street: address.street,
            city: address.city,
            province: address.province,
            postalCode: address.postalCode,
            country: "South Africa",
          }}
        />
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="manual-street">Street Address *</Label>
              <Input
                id="manual-street"
                value={address.street}
                onChange={(e) => handleManualUpdate("street", e.target.value)}
                placeholder="123 Main Street"
                required
                className={error ? "border-red-500" : ""}
              />
            </div>
            <div>
              <Label htmlFor="manual-city">City *</Label>
              <Input
                id="manual-city"
                value={address.city}
                onChange={(e) => handleManualUpdate("city", e.target.value)}
                placeholder="Johannesburg"
                required
                className={error ? "border-red-500" : ""}
              />
            </div>
            <div>
              <Label htmlFor="manual-province">Province *</Label>
              <Input
                id="manual-province"
                value={address.province}
                onChange={(e) => handleManualUpdate("province", e.target.value)}
                placeholder="Gauteng"
                required
                className={error ? "border-red-500" : ""}
              />
            </div>
            <div>
              <Label htmlFor="manual-postal">Postal Code *</Label>
              <Input
                id="manual-postal"
                value={address.postalCode}
                onChange={(e) =>
                  handleManualUpdate("postalCode", e.target.value)
                }
                placeholder="2000"
                required
                className={error ? "border-red-500" : ""}
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
      )}

      {/* Address Confirmation */}
      {hasSelectedAddress && isAddressComplete && (
        <Alert className="border-green-200 bg-green-50">
          <MapPin className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Pickup Address Confirmed:</strong>
            <br />
            {formatAddressForDisplay(address)}
          </AlertDescription>
        </Alert>
      )}

      {/* Warning if address incomplete */}
      {!isAddressComplete && (error || hasSelectedAddress) && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            Please ensure all address fields are completed before creating your
            listing.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default PickupAddressInput;

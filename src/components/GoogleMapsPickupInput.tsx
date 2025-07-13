import { useRef, useState } from "react";
import {
  LoadScript,
  Autocomplete,
  GoogleMap,
  Marker,
} from "@react-google-maps/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { MapPin, CheckCircle } from "lucide-react";

const libraries = ["places"];
const mapContainerStyle = { width: "100%", height: "300px" };

interface AddressData {
  formattedAddress: string;
  lat: number;
  lng: number;
  street?: string;
  city?: string;
  province?: string;
  postalCode?: string;
}

interface GoogleMapsPickupInputProps {
  onAddressSelect: (data: AddressData) => void;
  error?: string;
  className?: string;
}

const GoogleMapsPickupInput = ({
  onAddressSelect,
  error,
  className = "",
}: GoogleMapsPickupInputProps) => {
  const autocompleteRef = useRef(null);
  const [coords, setCoords] = useState(null);
  const [address, setAddress] = useState("");
  const [useManualEntry, setUseManualEntry] = useState(false);

  const onPlaceChanged = () => {
    if (!autocompleteRef.current) return;

    const place = autocompleteRef.current.getPlace();

    if (!place || !place.geometry) {
      alert("Please select a valid address from the suggestions.");
      return;
    }

    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();
    const formattedAddress = place.formatted_address;

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

    setCoords({ lat, lng });
    setAddress(formattedAddress);

    const addressData: AddressData = {
      formattedAddress,
      lat,
      lng,
      street: street || formattedAddress.split(",")[0] || "",
      city,
      province,
      postalCode,
    };

    console.log("Pickup address selected:", addressData);
    onAddressSelect(addressData);
  };

  if (useManualEntry) {
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

        <div className="flex items-center space-x-2">
          <Checkbox
            id="use-google-maps"
            checked={!useManualEntry}
            onCheckedChange={(checked) => setUseManualEntry(!checked)}
          />
          <Label htmlFor="use-google-maps" className="text-sm">
            Use Google Maps for address selection
          </Label>
        </div>

        <Alert>
          <MapPin className="h-4 w-4" />
          <AlertDescription>
            Manual entry mode. You'll need to fill in address fields manually in
            your profile.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <LoadScript
      googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
      libraries={libraries}
    >
      <div className={`space-y-4 ${className}`}>
        <div className="space-y-2">
          <Label className="text-base font-medium">
            Pickup Address <span className="text-red-500">*</span>
          </Label>
          <p className="text-sm text-gray-600">
            This is where buyers will collect the book from you. Use Google Maps
            for precise location.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="use-manual-entry"
            checked={useManualEntry}
            onCheckedChange={(checked) => setUseManualEntry(checked === true)}
          />
          <Label htmlFor="use-manual-entry" className="text-sm">
            Use manual address entry instead
          </Label>
        </div>

        <div>
          <Label htmlFor="pickup-address-input" className="text-sm font-medium">
            Search for your pickup address
          </Label>
          <Autocomplete
            onLoad={(autocomplete) => (autocompleteRef.current = autocomplete)}
            onPlaceChanged={onPlaceChanged}
          >
            <Input
              id="pickup-address-input"
              placeholder="Start typing your address... (e.g., 1 Sandton Drive, Sandton)"
              className={`w-full ${error ? "border-red-500" : ""}`}
            />
          </Autocomplete>
          {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
          <p className="text-xs text-gray-600 mt-1">
            Select from the dropdown suggestions for best results
          </p>
        </div>

        {coords && address && (
          <div className="space-y-3">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>✅ Pickup Address Selected:</strong>
                <br />
                {address}
              </AlertDescription>
            </Alert>

            <div className="border rounded-lg overflow-hidden">
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={coords}
                zoom={15}
              >
                <Marker position={coords} title="Your Pickup Location" />
              </GoogleMap>
            </div>
          </div>
        )}
      </div>
    </LoadScript>
  );
};

export default GoogleMapsPickupInput;

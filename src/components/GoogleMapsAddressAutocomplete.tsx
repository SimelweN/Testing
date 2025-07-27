import React, { useRef, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { useGoogleMaps } from "@/contexts/GoogleMapsContext";

export interface AddressData {
  formattedAddress: string;
  street: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
  additional_info?: string;
}

interface GoogleMapsAddressAutocompleteProps {
  onAddressSelect: (addressData: AddressData) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  className?: string;
  defaultValue?: Partial<AddressData>;
}

// South African provinces for validation
const SA_PROVINCES = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "Northern Cape",
  "North West",
  "Western Cape",
];

const GoogleMapsAddressAutocomplete: React.FC<
  GoogleMapsAddressAutocompleteProps
> = ({
  onAddressSelect,
  label = "Address",
  placeholder = "Start typing an address...",
  required = false,
  error,
  className = "",
  defaultValue = {},
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  // Use Google Maps context instead of manual loading
  const { isLoaded: mapsLoaded, loadError: mapsLoadError } = useGoogleMaps();

  const [selectedAddress, setSelectedAddress] = useState<AddressData | null>(
    null,
  );
  const [inputValue, setInputValue] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [isLoading, setIsLoading] = useState(!mapsLoaded);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Check if Google Maps is already loaded
  const checkGoogleMapsLoaded = () => {
    return window.google?.maps?.places?.Autocomplete;
  };

  // Initialize autocomplete
  const initializeAutocomplete = () => {
    if (!checkGoogleMapsLoaded() || !inputRef.current) {
      console.log("Google Maps not ready yet");
      return false;
    }

    try {
      const autocomplete = new window.google.maps.places.Autocomplete(
        inputRef.current,
        {
          types: ["geocode"], // only show addresses (like the example)
          componentRestrictions: { country: "za" }, // restrict to South Africa (lowercase like example)
          fields: ["formatted_address", "geometry", "address_components"],
        },
      );

      autocompleteRef.current = autocomplete;

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();

        if (!place.geometry) {
          console.warn("No details available for input: '" + place.name + "'");
          return;
        }

        console.log("Full address:", place.formatted_address);

        // Extract address components (like the example)
        let street = "";
        let city = "";
        let province = "";
        let postalCode = "";

        const addressComponents = place.address_components;
        for (let component of addressComponents) {
          const type = component.types[0];
          console.log(type + ": " + component.long_name);

          if (component.types.includes("street_number")) {
            street = component.long_name + " ";
          } else if (component.types.includes("route")) {
            street += component.long_name;
          } else if (
            component.types.includes("sublocality") ||
            component.types.includes("locality")
          ) {
            city = component.long_name;
          } else if (component.types.includes("administrative_area_level_1")) {
            province = component.long_name;
          } else if (component.types.includes("postal_code")) {
            postalCode = component.long_name;
          }
        }

        // Validate province is in South Africa
        const normalizedProvince =
          SA_PROVINCES.find(
            (p) =>
              p.toLowerCase().includes(province.toLowerCase()) ||
              province.toLowerCase().includes(p.toLowerCase()),
          ) || province;

        // Optional: Store lat/lng (like the example)
        const location = place.geometry.location;
        console.log("Latitude:", location.lat());
        console.log("Longitude:", location.lng());

        const addressData: AddressData = {
          formattedAddress: place.formatted_address || "",
          street: street.trim(),
          city: city || "",
          province: normalizedProvince,
          postalCode: postalCode || "",
          country: "South Africa",
          latitude: location.lat(),
          longitude: location.lng(),
          additional_info: additionalInfo.trim() || undefined,
        };

        setSelectedAddress(addressData);
        setInputValue(place.formatted_address || "");
        onAddressSelect(addressData);
      });

      setIsLoading(false);
      setLoadError(null);
      return true;
    } catch (err: any) {
      console.error("Failed to initialize autocomplete:", err);
      setLoadError(`Failed to initialize: ${err.message}`);
      setIsLoading(false);
      return false;
    }
  };

  // Initialize autocomplete when Google Maps is ready
  const initializeGoogleMaps = () => {
    if (mapsLoaded && checkGoogleMapsLoaded()) {
      console.log(
        "Google Maps loaded via context, initializing autocomplete...",
      );
      initializeAutocomplete();
    }
  };

  useEffect(() => {
    // Set default value if provided
    if (defaultValue?.formattedAddress) {
      setInputValue(defaultValue.formattedAddress);
      setSelectedAddress(defaultValue as AddressData);
    }
    if (defaultValue?.additional_info) {
      setAdditionalInfo(defaultValue.additional_info);
    }

    return () => {
      // Cleanup
      if (autocompleteRef.current) {
        window.google?.maps?.event?.clearInstanceListeners(
          autocompleteRef.current,
        );
      }
    };
  }, []);

  // Initialize Google Maps when context is ready
  useEffect(() => {
    if (mapsLoaded) {
      setIsLoading(true);
      initializeGoogleMaps();
    } else if (mapsLoadError) {
      setIsLoading(false);
      setLoadError(mapsLoadError.message);
    }
  }, [mapsLoaded, mapsLoadError]);

  const handleRetry = () => {
    // Retry by attempting to initialize again
    if (mapsLoaded) {
      initializeGoogleMaps();
    }
  };

  // Show loading state while Google Maps is loading from context
  const shouldShowLoading =
    !mapsLoaded && !mapsLoadError && !defaultValue?.formattedAddress;

  if (shouldShowLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {label && (
          <Label className="text-base font-medium flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {label} {required && <span className="text-red-500">*</span>}
          </Label>
        )}
        <Card>
          <CardContent className="p-6 text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-600" />
            <p className="text-sm text-gray-600">Loading Google Maps...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error from context or local error, but fall back to manual input
  const displayError = mapsLoadError?.message || error;

  if (displayError) {
    return (
      <div className={`space-y-4 ${className}`}>
        {label && (
          <Label className="text-base font-medium flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {label} {required && <span className="text-red-500">*</span>}
          </Label>
        )}

        {/* Show error but continue with manual input */}
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Google Maps unavailable - using manual input</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetry}
                  className="ml-2"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry Maps
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>

        {/* Manual address input fallback */}
        <Card>
          <CardContent className="p-4">
            <Input
              ref={inputRef}
              type="text"
              placeholder="Enter your full address manually..."
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                // Create a basic address object from manual input
                if (e.target.value.trim()) {
                  const manualAddress: AddressData = {
                    formattedAddress: e.target.value.trim(),
                    street: e.target.value.trim(),
                    city: "",
                    province: "",
                    postalCode: "",
                    country: "South Africa",
                    additional_info: additionalInfo.trim() || undefined,
                  };
                  setSelectedAddress(manualAddress);
                  onAddressSelect(manualAddress);
                }
              }}
              className={`${error ? "border-red-500" : ""} text-base`}
              required={required}
            />
            <p className="text-xs text-gray-500 mt-2">
              Please enter your complete address manually (Google Maps is not available)
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {label && (
        <Label className="text-base font-medium flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}

      <Card>
        <CardContent className="p-4">
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className={`${error ? "border-red-500" : ""} text-base`}
            required={required}
          />
          <p className="text-xs text-gray-500 mt-2">
            Start typing your address and select from the suggestions
          </p>
        </CardContent>
      </Card>

      {/* Additional Information */}
      <Card>
        <CardContent className="p-4">
          <Label htmlFor="additional_info" className="text-sm font-medium mb-2 block">
            Additional Information (Optional)
          </Label>
          <Textarea
            id="additional_info"
            placeholder="e.g., Building entrance details, security gate code, special instructions..."
            value={additionalInfo}
            onChange={(e) => {
              setAdditionalInfo(e.target.value);
              // Update selected address with new additional info
              if (selectedAddress) {
                const updatedAddress = {
                  ...selectedAddress,
                  additional_info: e.target.value.trim() || undefined,
                };
                setSelectedAddress(updatedAddress);
                onAddressSelect(updatedAddress);
              }
            }}
            rows={3}
            className="text-base"
          />
          <p className="text-xs text-gray-500 mt-1">
            Include any helpful details for pickup/delivery (gate codes, building access, etc.)
          </p>
        </CardContent>
      </Card>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Address Preview */}
      {selectedAddress && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800 mb-1">
                  Selected Address:
                </p>
                <p className="text-sm text-green-700">
                  {selectedAddress.formattedAddress}
                </p>
                <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-green-600">
                  <span>
                    <strong>City:</strong> {selectedAddress.city}
                  </span>
                  <span>
                    <strong>Province:</strong> {selectedAddress.province}
                  </span>
                  <span>
                    <strong>Postal:</strong> {selectedAddress.postalCode}
                  </span>
                  <span>
                    <strong>Country:</strong> {selectedAddress.country}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GoogleMapsAddressAutocomplete;

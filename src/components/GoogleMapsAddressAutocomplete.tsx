import React, { useRef, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { MapPin, Loader2, AlertCircle, RefreshCw } from "lucide-react";

export interface AddressData {
  formattedAddress: string;
  street: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
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

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<AddressData | null>(
    null,
  );
  const [inputValue, setInputValue] = useState("");

  // Initialize Google Maps
  const initializeAutocomplete = () => {
    if (!window.google?.maps?.places) {
      setLoadError("Google Maps Places API failed to load");
      setIsLoading(false);
      return;
    }

    if (!inputRef.current) return;

    try {
      const autocomplete = new window.google.maps.places.Autocomplete(
        inputRef.current,
        {
          types: ["address"],
          componentRestrictions: { country: "ZA" }, // South Africa only
          fields: ["formatted_address", "geometry", "address_components"],
        },
      );

      autocompleteRef.current = autocomplete;

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();

        if (!place?.geometry?.location || !place.address_components) {
          console.warn("Invalid place data");
          return;
        }

        // Extract address components
        let street = "";
        let city = "";
        let province = "";
        let postalCode = "";

        place.address_components.forEach((component: any) => {
          const types = component.types;

          if (types.includes("street_number")) {
            street = component.long_name + " ";
          } else if (types.includes("route")) {
            street += component.long_name;
          } else if (
            types.includes("sublocality") ||
            types.includes("locality")
          ) {
            city = component.long_name;
          } else if (types.includes("administrative_area_level_1")) {
            province = component.long_name;
          } else if (types.includes("postal_code")) {
            postalCode = component.long_name;
          }
        });

        // Validate province is in South Africa
        const normalizedProvince =
          SA_PROVINCES.find(
            (p) =>
              p.toLowerCase().includes(province.toLowerCase()) ||
              province.toLowerCase().includes(p.toLowerCase()),
          ) || province;

        const addressData: AddressData = {
          formattedAddress: place.formatted_address || "",
          street: street.trim(),
          city: city || "",
          province: normalizedProvince,
          postalCode: postalCode || "",
          country: "South Africa",
          latitude: place.geometry.location.lat(),
          longitude: place.geometry.location.lng(),
        };

        setSelectedAddress(addressData);
        setInputValue(place.formatted_address || "");
        onAddressSelect(addressData);
      });

      setIsLoading(false);
      setLoadError(null);
    } catch (err: any) {
      setLoadError(`Failed to initialize: ${err.message}`);
      setIsLoading(false);
    }
  };

  // Load Google Maps script
  const loadGoogleMaps = () => {
    if (window.google?.maps?.places) {
      initializeAutocomplete();
      return;
    }

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      setLoadError("Google Maps API key not found");
      setIsLoading(false);
      return;
    }

    // Create script element
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMapsAutocomplete`;
    script.async = true;
    script.defer = true;

    // Set up callback
    (window as any).initGoogleMapsAutocomplete = initializeAutocomplete;

    script.onerror = () => {
      setLoadError("Failed to load Google Maps script");
      setIsLoading(false);
    };

    document.head.appendChild(script);
  };

  useEffect(() => {
    loadGoogleMaps();

    // Set default value if provided
    if (defaultValue?.formattedAddress) {
      setInputValue(defaultValue.formattedAddress);
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

  const handleRetry = () => {
    setIsLoading(true);
    setLoadError(null);
    loadGoogleMaps();
  };

  if (isLoading) {
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

  if (loadError) {
    return (
      <div className={`space-y-4 ${className}`}>
        {label && (
          <Label className="text-base font-medium flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {label} {required && <span className="text-red-500">*</span>}
          </Label>
        )}
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <div className="flex items-center justify-between">
              <span>{loadError}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetry}
                className="ml-2"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            </div>
          </AlertDescription>
        </Alert>
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

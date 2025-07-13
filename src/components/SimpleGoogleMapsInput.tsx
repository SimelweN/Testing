import { useRef, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapPin, Loader2, AlertCircle } from "lucide-react";

// Simple interface for address data
interface AddressData {
  formattedAddress: string;
  latitude: number;
  longitude: number;
  street?: string;
  city?: string;
  province?: string;
  postalCode?: string;
}

interface SimpleGoogleMapsInputProps {
  onAddressSelect: (addressData: AddressData) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  className?: string;
  defaultValue?: string;
}

declare global {
  interface Window {
    google: any;
    initGoogleMaps: () => void;
  }
}

const SimpleGoogleMapsInput = ({
  onAddressSelect,
  label = "Address",
  placeholder = "Type your address...",
  required = false,
  error,
  className = "",
  defaultValue = "",
}: SimpleGoogleMapsInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedAddress, setSelectedAddress] = useState(defaultValue);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);

  // Initialize Google Maps
  const initializeGoogleMaps = useCallback(() => {
    if (!window.google || !window.google.maps) {
      setLoadError("Google Maps failed to load");
      setIsLoading(false);
      return;
    }

    try {
      // Initialize autocomplete
      if (inputRef.current) {
        const autocomplete = new window.google.maps.places.Autocomplete(
          inputRef.current,
          {
            types: ["address"],
            componentRestrictions: { country: "za" }, // Restrict to South Africa
            fields: [
              "formatted_address",
              "geometry",
              "address_components",
              "name",
            ],
          },
        );

        autocompleteRef.current = autocomplete;

        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();

          if (!place || !place.geometry || !place.geometry.location) {
            console.warn("No valid place data received");
            return;
          }

          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          const formattedAddress = place.formatted_address || "";

          // Extract address components
          const addressComponents: Partial<AddressData> = {};

          if (place.address_components) {
            for (const component of place.address_components) {
              const types = component.types;

              if (types.includes("street_number") || types.includes("route")) {
                addressComponents.street =
                  (addressComponents.street || "") + " " + component.long_name;
              } else if (
                types.includes("locality") ||
                types.includes("administrative_area_level_2")
              ) {
                addressComponents.city = component.long_name;
              } else if (types.includes("administrative_area_level_1")) {
                addressComponents.province = component.long_name;
              } else if (types.includes("postal_code")) {
                addressComponents.postalCode = component.long_name;
              }
            }
          }

          // Clean up street address
          if (addressComponents.street) {
            addressComponents.street = addressComponents.street.trim();
          }

          const addressData: AddressData = {
            formattedAddress,
            latitude: lat,
            longitude: lng,
            ...addressComponents,
          };

          setSelectedAddress(formattedAddress);
          setCoords({ lat, lng });

          // Initialize map if not already done
          if (mapRef.current && !mapInstanceRef.current) {
            mapInstanceRef.current = new window.google.maps.Map(
              mapRef.current,
              {
                center: { lat, lng },
                zoom: 15,
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: false,
              },
            );
          }

          // Update map center and marker
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setCenter({ lat, lng });

            // Remove existing marker
            if (markerRef.current) {
              markerRef.current.setMap(null);
            }

            // Add new marker
            markerRef.current = new window.google.maps.Marker({
              position: { lat, lng },
              map: mapInstanceRef.current,
              title: formattedAddress,
            });
          }

          // Call parent callback
          onAddressSelect(addressData);
        });
      }

      setGoogleMapsLoaded(true);
      setIsLoading(false);
      setLoadError(null);
    } catch (error) {
      console.error("Error initializing Google Maps:", error);
      setLoadError("Failed to initialize Google Maps");
      setIsLoading(false);
    }
  }, [onAddressSelect]);

  // Load Google Maps script
  const loadGoogleMapsScript = useCallback(() => {
    if (window.google && window.google.maps) {
      initializeGoogleMaps();
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
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps`;
    script.async = true;
    script.defer = true;

    // Set up callback
    window.initGoogleMaps = initializeGoogleMaps;

    script.onerror = () => {
      setLoadError("Failed to load Google Maps script");
      setIsLoading(false);
    };

    document.head.appendChild(script);
  }, [initializeGoogleMaps]);

  // Load script on component mount
  useState(() => {
    loadGoogleMapsScript();
  });

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Address Input */}
      <div>
        {label && (
          <Label className="text-base font-medium">
            {label} {required && <span className="text-red-500">*</span>}
          </Label>
        )}

        <div className="relative">
          <Input
            ref={inputRef}
            type="text"
            placeholder={isLoading ? "Loading Google Maps..." : placeholder}
            className={`pl-10 ${error ? "border-red-500" : ""}`}
            defaultValue={defaultValue}
            required={required}
            disabled={isLoading || !!loadError}
          />

          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />

          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
          )}
        </div>

        {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
      </div>

      {/* Loading State */}
      {isLoading && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>Loading Google Maps...</AlertDescription>
        </Alert>
      )}

      {/* Error State */}
      {loadError && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Maps Error:</strong> {loadError}
            <br />
            <small>
              You can still enter your address manually in the input field
              above.
            </small>
          </AlertDescription>
        </Alert>
      )}

      {/* Address Preview */}
      {selectedAddress && coords && googleMapsLoaded && !loadError && (
        <div className="space-y-3">
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              <strong>Selected Address:</strong> {selectedAddress}
            </p>
            <p className="text-xs text-green-600 mt-1">
              Coordinates: {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
            </p>
          </div>

          {/* Map Preview */}
          <div className="border rounded-lg overflow-hidden">
            <div
              ref={mapRef}
              style={{ width: "100%", height: "300px" }}
              className="bg-gray-100"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleGoogleMapsInput;

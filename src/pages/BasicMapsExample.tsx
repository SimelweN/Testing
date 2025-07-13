import { useRef, useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, MapPin } from "lucide-react";

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

const BasicMapsExample = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<any>(null);

  const loadScript = () => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      setError("API key not found");
      return;
    }

    // Clean up any existing scripts
    const existingScript = document.querySelector(
      'script[src*="maps.googleapis.com"]',
    );
    if (existingScript) {
      existingScript.remove();
    }

    // Set up the callback function
    window.initMap = () => {
      console.log("Google Maps loaded!");
      setIsLoaded(true);
      setError(null);
      initializeComponents();
    };

    // Create and load the script
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initMap`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      setError(
        "Failed to load Google Maps. Check your internet connection and API key.",
      );
    };

    document.head.appendChild(script);
  };

  const initializeComponents = () => {
    if (!window.google || !inputRef.current || !mapRef.current) return;

    try {
      // Initialize the map
      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: -26.2041, lng: 28.0473 }, // Johannesburg
        zoom: 10,
      });

      // Initialize autocomplete
      const autocomplete = new window.google.maps.places.Autocomplete(
        inputRef.current,
        {
          types: ["address"],
          componentRestrictions: { country: "za" },
          fields: ["formatted_address", "geometry", "address_components"],
        },
      );

      // Handle place selection
      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();

        if (!place.geometry || !place.geometry.location) {
          console.log("No details available for input: '" + place.name + "'");
          return;
        }

        // Update map and marker
        map.setCenter(place.geometry.location);
        map.setZoom(15);

        // Add marker
        new window.google.maps.Marker({
          position: place.geometry.location,
          map: map,
          title: place.formatted_address,
        });

        setSelectedPlace(place);
        console.log("Selected place:", place);
      });

      console.log("Components initialized successfully");
    } catch (err) {
      console.error("Error initializing components:", err);
      setError(`Initialization error: ${err}`);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-book-800 mb-4">
            Basic Google Maps Example
          </h1>
          <p className="text-gray-600">
            Simple, working Google Maps integration without external libraries
          </p>
        </div>

        {/* Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card className="text-center">
            <CardContent className="pt-6">
              {isLoaded ? (
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              ) : (
                <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
              )}
              <h3 className="font-semibold">Google Maps Status</h3>
              <p className="text-sm text-gray-600">
                {isLoaded ? "Loaded and Ready" : "Not Loaded"}
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <MapPin className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold">API Key</h3>
              <p className="text-sm text-gray-600">
                {import.meta.env.VITE_GOOGLE_MAPS_API_KEY
                  ? "Available"
                  : "Missing"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Load Button */}
        {!isLoaded && (
          <Card className="mb-6">
            <CardContent className="pt-6 text-center">
              <Button onClick={loadScript} className="mb-4">
                Load Google Maps
              </Button>
              <p className="text-sm text-gray-600">
                Click to manually load Google Maps and initialize components
              </p>
            </CardContent>
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <Alert className="border-red-200 bg-red-50 mb-6">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Error:</strong> {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Address Input */}
        {isLoaded && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Address Search</CardTitle>
            </CardHeader>
            <CardContent>
              <input
                ref={inputRef}
                type="text"
                placeholder="Type a South African address..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-sm text-gray-600 mt-2">
                Try typing: "1 Sandton Drive, Sandton" or "V&A Waterfront, Cape
                Town"
              </p>
            </CardContent>
          </Card>
        )}

        {/* Selected Place Info */}
        {selectedPlace && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Selected Location</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p>
                  <strong>Address:</strong> {selectedPlace.formatted_address}
                </p>
                <p>
                  <strong>Coordinates:</strong>{" "}
                  {selectedPlace.geometry.location.lat()},{" "}
                  {selectedPlace.geometry.location.lng()}
                </p>
                {selectedPlace.address_components && (
                  <div>
                    <strong>Components:</strong>
                    <ul className="list-disc list-inside ml-4 text-sm">
                      {selectedPlace.address_components.map(
                        (component: any, index: number) => (
                          <li key={index}>
                            {component.long_name} ({component.types.join(", ")})
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Map */}
        {isLoaded && (
          <Card>
            <CardHeader>
              <CardTitle>Map View</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                ref={mapRef}
                style={{ width: "100%", height: "400px" }}
                className="border rounded-lg"
              />
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default BasicMapsExample;

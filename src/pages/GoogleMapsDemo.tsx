import { useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import GoogleMapsAddressInput from "@/components/GoogleMapsAddressInput";
import SimpleGoogleMapsInput from "@/components/SimpleGoogleMapsInput";
import GoogleMapsAddressDialog from "@/components/GoogleMapsAddressDialog";
import PickupAddressInput from "@/components/PickupAddressInput";
import { MapPin, Navigation, Users, Clock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

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

const GoogleMapsDemo = () => {
  const [selectedAddress, setSelectedAddress] = useState<AddressData | null>(
    null,
  );
  const [pickupAddress, setPickupAddress] = useState<Address>({
    street: "",
    city: "",
    province: "",
    postalCode: "",
  });
  const [showDialog, setShowDialog] = useState(false);

  const handleAddressSelect = (addressData: AddressData) => {
    setSelectedAddress(addressData);
    console.log("Selected address:", addressData);
  };

  const handlePickupAddressUpdate = (address: Address) => {
    setPickupAddress(address);
    console.log("Pickup address updated:", address);
  };

  const handleSaveAddresses = async (pickup: Address, shipping: Address) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log("Saving addresses:", { pickup, shipping });
    toast.success("Addresses saved successfully!");
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-book-800 mb-4">
            Google Maps Address Integration Demo
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Experience our enhanced address input system using Google Maps
            Places Autocomplete and interactive map previews for accurate
            location selection.
          </p>
        </div>

        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="text-center">
            <CardContent className="pt-6">
              <MapPin className="h-8 w-8 text-book-600 mx-auto mb-2" />
              <h3 className="font-semibold mb-2">Smart Autocomplete</h3>
              <p className="text-sm text-gray-600">
                Real-time address suggestions powered by Google Places API
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <Navigation className="h-8 w-8 text-book-600 mx-auto mb-2" />
              <h3 className="font-semibold mb-2">Interactive Maps</h3>
              <p className="text-sm text-gray-600">
                Visual map preview with precise location markers
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <Users className="h-8 w-8 text-book-600 mx-auto mb-2" />
              <h3 className="font-semibold mb-2">Better UX</h3>
              <p className="text-sm text-gray-600">
                Simplified address entry with automatic validation
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Debug Information */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-5 w-5" />
              Debug Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong>API Key Status:</strong>{" "}
                {import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? (
                  <Badge className="bg-green-600">✓ Found</Badge>
                ) : (
                  <Badge variant="destructive">✗ Missing</Badge>
                )}
              </div>
              <div>
                <strong>API Key Preview:</strong>{" "}
                {import.meta.env.VITE_GOOGLE_MAPS_API_KEY
                  ? `${import.meta.env.VITE_GOOGLE_MAPS_API_KEY.substring(0, 10)}...`
                  : "Not found"}
              </div>
              <div>
                <strong>Environment Mode:</strong>{" "}
                <Badge variant="outline">{import.meta.env.MODE}</Badge>
              </div>
              <div>
                <strong>Google Maps Script:</strong>{" "}
                {typeof window !== "undefined" && window.google ? (
                  <Badge className="bg-green-600">✓ Loaded</Badge>
                ) : (
                  <Badge variant="secondary">⧗ Loading</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Demo Sections */}
        <div className="space-y-8">
          {/* Simple Google Maps Component (for debugging) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Simple Google Maps Component (Debugging)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                This simplified version loads Google Maps directly without
                external libraries.
              </p>
              <SimpleGoogleMapsInput
                onAddressSelect={handleAddressSelect}
                label="Test Google Maps Loading"
                placeholder="Try typing: 1 Sandton Drive, Sandton..."
              />
            </CardContent>
          </Card>

          {/* Basic Address Input Demo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Basic Address Input Component
              </CardTitle>
            </CardHeader>
            <CardContent>
              <GoogleMapsAddressInput
                onAddressSelect={handleAddressSelect}
                label="Enter Any Address"
                placeholder="Type an address to see autocomplete in action..."
              />

              {selectedAddress && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2">
                    Selected Address Details:
                  </h4>
                  <div className="space-y-1 text-sm">
                    <p>
                      <strong>Formatted:</strong>{" "}
                      {selectedAddress.formattedAddress}
                    </p>
                    <p>
                      <strong>Street:</strong> {selectedAddress.street || "N/A"}
                    </p>
                    <p>
                      <strong>City:</strong> {selectedAddress.city || "N/A"}
                    </p>
                    <p>
                      <strong>Province:</strong>{" "}
                      {selectedAddress.province || "N/A"}
                    </p>
                    <p>
                      <strong>Postal Code:</strong>{" "}
                      {selectedAddress.postalCode || "N/A"}
                    </p>
                    <p>
                      <strong>Coordinates:</strong>{" "}
                      {selectedAddress.latitude.toFixed(6)},{" "}
                      {selectedAddress.longitude.toFixed(6)}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pickup Address Component Demo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Pickup Address for Listings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PickupAddressInput
                onAddressUpdate={handlePickupAddressUpdate}
                initialAddress={pickupAddress}
              />

              {(pickupAddress.street ||
                pickupAddress.city ||
                pickupAddress.province ||
                pickupAddress.postalCode) && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">
                    Current Pickup Address:
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <div>
                      <strong>Street:</strong>
                      <br />
                      {pickupAddress.street || "Not set"}
                    </div>
                    <div>
                      <strong>City:</strong>
                      <br />
                      {pickupAddress.city || "Not set"}
                    </div>
                    <div>
                      <strong>Province:</strong>
                      <br />
                      {pickupAddress.province || "Not set"}
                    </div>
                    <div>
                      <strong>Postal Code:</strong>
                      <br />
                      {pickupAddress.postalCode || "Not set"}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Full Dialog Demo */}
          <Card>
            <CardHeader>
              <CardTitle>Full Address Management Dialog</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Experience the complete address management interface with pickup
                and shipping addresses.
              </p>
              <Button
                onClick={() => setShowDialog(true)}
                className="bg-book-600 hover:bg-book-700"
              >
                Open Address Dialog
              </Button>
            </CardContent>
          </Card>

          {/* Implementation Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Implementation Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">
                    ✅ Implemented Features
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="text-green-600 border-green-600"
                      >
                        ✓
                      </Badge>
                      Google Places Autocomplete
                    </li>
                    <li className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="text-green-600 border-green-600"
                      >
                        ✓
                      </Badge>
                      Interactive map preview with markers
                    </li>
                    <li className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="text-green-600 border-green-600"
                      >
                        ✓
                      </Badge>
                      Address component extraction
                    </li>
                    <li className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="text-green-600 border-green-600"
                      >
                        ✓
                      </Badge>
                      Manual entry fallback option
                    </li>
                    <li className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="text-green-600 border-green-600"
                      >
                        ✓
                      </Badge>
                      Coordinates capture (lat/lng)
                    </li>
                    <li className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="text-green-600 border-green-600"
                      >
                        ✓
                      </Badge>
                      South Africa geo-restriction
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">🔧 Technical Details</h4>
                  <ul className="space-y-2 text-sm">
                    <li>
                      <strong>Package:</strong> @react-google-maps/api
                    </li>
                    <li>
                      <strong>API Key:</strong> Configured via environment
                    </li>
                    <li>
                      <strong>Libraries:</strong> places
                    </li>
                    <li>
                      <strong>Restrictions:</strong> South Africa only
                    </li>
                    <li>
                      <strong>Fallback:</strong> Manual address entry
                    </li>
                    <li>
                      <strong>Validation:</strong> Required field checking
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Google Maps Address Dialog */}
        <GoogleMapsAddressDialog
          isOpen={showDialog}
          onClose={() => setShowDialog(false)}
          onSave={handleSaveAddresses}
        />
      </div>
    </Layout>
  );
};

export default GoogleMapsDemo;

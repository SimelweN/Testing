import Layout from "@/components/Layout";
import WorkingGoogleMaps from "@/components/WorkingGoogleMaps";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, MapPin, Zap } from "lucide-react";

const WorkingMapsDemo = () => {
  const handleAddressSelect = (data: any) => {
    console.log("Address selected:", data);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-book-800 mb-4">
            ✅ Working Google Maps Integration
          </h1>
          <p className="text-gray-600">
            This is the simplified, working version based on your provided code.
          </p>
        </div>

        {/* Status Check */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="text-center">
            <CardContent className="pt-6">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold">API Key</h3>
              <Badge className="bg-green-600">
                {import.meta.env.VITE_GOOGLE_MAPS_API_KEY
                  ? "✓ Found"
                  : "✗ Missing"}
              </Badge>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <MapPin className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold">Library</h3>
              <Badge variant="outline">@react-google-maps/api</Badge>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <Zap className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <h3 className="font-semibold">Status</h3>
              <Badge className="bg-green-600">Ready to Test</Badge>
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>🧪 Test Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>
                <strong>1.</strong> Start typing in the address field below
              </p>
              <p>
                <strong>2.</strong> Try: "1 Sandton Drive, Sandton" or "V&A
                Waterfront, Cape Town"
              </p>
              <p>
                <strong>3.</strong> Select an address from the dropdown
                suggestions
              </p>
              <p>
                <strong>4.</strong> Watch the map center on your selection with
                a marker
              </p>
              <p>
                <strong>5.</strong> Check browser console for logged coordinates
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Working Google Maps Component */}
        <Card>
          <CardHeader>
            <CardTitle>Google Maps Address Input</CardTitle>
          </CardHeader>
          <CardContent>
            <WorkingGoogleMaps
              onAddressSelect={handleAddressSelect}
              title="Enter Your Pickup Address"
              placeholder="Start typing a South African address..."
            />
          </CardContent>
        </Card>

        {/* Environment Info */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Environment Check</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-1">
              <p>
                <strong>API Key Status:</strong>{" "}
                {import.meta.env.VITE_GOOGLE_MAPS_API_KEY
                  ? "✅ Available"
                  : "❌ Missing"}
              </p>
              <p>
                <strong>API Key Preview:</strong>{" "}
                {import.meta.env.VITE_GOOGLE_MAPS_API_KEY
                  ? `${import.meta.env.VITE_GOOGLE_MAPS_API_KEY.substring(0, 15)}...`
                  : "Not found"}
              </p>
              <p>
                <strong>Environment:</strong> {import.meta.env.MODE}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default WorkingMapsDemo;

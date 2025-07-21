import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, ExternalLink, Settings, CheckCircle } from "lucide-react";

interface GoogleMapsSetupHelperProps {
  isForAdmin?: boolean;
}

const GoogleMapsSetupHelper: React.FC<GoogleMapsSetupHelperProps> = ({
  isForAdmin = false,
}) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const isDisabled = import.meta.env.VITE_DISABLE_GOOGLE_MAPS === "true";
  const hasValidKey = apiKey && apiKey.startsWith("AIza") && apiKey.length > 30;

  if (hasValidKey && !isDisabled) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          Google Maps is configured and available for enhanced address input.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-amber-800">
          <MapPin className="h-5 w-5" />
          Google Maps Setup Required
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-amber-700">
          <p className="mb-2">
            Google Maps is currently disabled. To enable smart address
            autocomplete:
          </p>
          <ol className="list-decimal list-inside space-y-1 mb-4">
            <li>Get a Google Maps API key from Google Cloud Console</li>
            <li>Enable Places API and Maps JavaScript API</li>
            <li>
              {isForAdmin
                ? "Configure VITE_GOOGLE_MAPS_API_KEY in deployment settings"
                : "Contact your administrator to configure the API key"}
            </li>
            <li>Set VITE_DISABLE_GOOGLE_MAPS=false</li>
          </ol>
          <p className="text-xs">
            <strong>Note:</strong> Manual address entry is available as a
            fallback.
          </p>
        </div>

        {isForAdmin && (
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                window.open(
                  "https://console.cloud.google.com/apis/credentials",
                  "_blank"
                )
              }
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Get API Key
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                window.open(
                  "https://console.cloud.google.com/apis/library/places-backend.googleapis.com",
                  "_blank"
                )
              }
            >
              <Settings className="h-3 w-3 mr-1" />
              Enable APIs
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GoogleMapsSetupHelper;

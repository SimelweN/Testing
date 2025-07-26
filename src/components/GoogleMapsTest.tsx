import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useGoogleMaps } from '@/contexts/GoogleMapsContext';
import { MapPin, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const GoogleMapsTest: React.FC = () => {
  const { isLoaded, loadError } = useGoogleMaps();

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const isDisabled = import.meta.env.VITE_DISABLE_GOOGLE_MAPS === 'true';

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Google Maps Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">API Key:</span>
          <Badge variant={apiKey ? "default" : "destructive"}>
            {apiKey ? "Configured" : "Missing"}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Maps Disabled:</span>
          <Badge variant={isDisabled ? "destructive" : "default"}>
            {isDisabled ? "Yes" : "No"}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Maps Loaded:</span>
          <Badge variant={isLoaded ? "default" : loadError ? "destructive" : "secondary"}>
            {isLoaded ? (
              <>
                <CheckCircle className="h-3 w-3 mr-1" />
                Loaded
              </>
            ) : loadError ? (
              <>
                <AlertCircle className="h-3 w-3 mr-1" />
                Error
              </>
            ) : (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Loading
              </>
            )}
          </Badge>
        </div>
        
        {loadError && (
          <div className="text-xs text-red-600 bg-red-50 p-2 rounded border">
            {loadError}
          </div>
        )}
        
        {isLoaded && (
          <div className="text-xs text-green-600 bg-green-50 p-2 rounded border">
            ✅ Google Maps is ready for address autocomplete!
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GoogleMapsTest;

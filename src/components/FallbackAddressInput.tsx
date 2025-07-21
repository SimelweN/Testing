import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  MapPin, 
  AlertCircle, 
  CheckCircle, 
  RefreshCw, 
  Keyboard,
  MapIcon,
  Wifi,
  WifiOff
} from "lucide-react";
import GoogleMapsAddressAutocomplete, {
  AddressData as GoogleAddressData,
} from "@/components/GoogleMapsAddressAutocomplete";
import { useGoogleMaps } from "@/contexts/GoogleMapsContext";

export interface FallbackAddressData {
  formattedAddress: string;
  street: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
  source: 'google_maps' | 'manual_entry';
  timestamp: string;
}

interface FallbackAddressInputProps {
  onAddressSelect: (addressData: FallbackAddressData) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  className?: string;
  defaultValue?: Partial<FallbackAddressData>;
  showMethodIndicator?: boolean;
  autoFallback?: boolean; // Automatically switch to manual if Google Maps fails
}

const southAfricanProvinces = [
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

const FallbackAddressInput: React.FC<FallbackAddressInputProps> = ({
  onAddressSelect,
  label = "Address",
  placeholder = "Start typing an address...",
  required = false,
  error,
  className = "",
  defaultValue,
  showMethodIndicator = true,
  autoFallback = true,
}) => {
  const { isLoaded: mapsLoaded, loadError: mapsLoadError } = useGoogleMaps();
  
  const [inputMethod, setInputMethod] = useState<'auto' | 'google' | 'manual'>('auto');
  const [forceManual, setForceManual] = useState(false);
  const [googleMapsAttempted, setGoogleMapsAttempted] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline'>('online');
  
  // Manual address state
  const [manualAddress, setManualAddress] = useState({
    street: defaultValue?.street || "",
    city: defaultValue?.city || "",
    province: defaultValue?.province || "",
    postalCode: defaultValue?.postalCode || "",
  });

  const [selectedAddress, setSelectedAddress] = useState<FallbackAddressData | null>(null);

  // Check network connectivity
  useEffect(() => {
    const handleOnline = () => setConnectionStatus('online');
    const handleOffline = () => setConnectionStatus('offline');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    setConnectionStatus(navigator.onLine ? 'online' : 'offline');

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-fallback logic
  useEffect(() => {
    if (autoFallback) {
      // If Google Maps failed to load or we're offline, switch to manual
      if (mapsLoadError || connectionStatus === 'offline') {
        if (!googleMapsAttempted) {
          console.log('Auto-falling back to manual entry:', { 
            mapsLoadError: !!mapsLoadError, 
            offline: connectionStatus === 'offline' 
          });
          setForceManual(true);
          setInputMethod('manual');
        }
      }
      // If Google Maps loads successfully and we're online, prefer it
      else if (mapsLoaded && connectionStatus === 'online' && !forceManual) {
        setInputMethod('google');
      }
    }
    setGoogleMapsAttempted(true);
  }, [mapsLoaded, mapsLoadError, connectionStatus, autoFallback, googleMapsAttempted, forceManual]);

  // Determine which input method to show
  const getActiveInputMethod = (): 'google' | 'manual' => {
    if (forceManual || inputMethod === 'manual') return 'manual';
    if (connectionStatus === 'offline') return 'manual';
    if (mapsLoadError) return 'manual';
    if (!mapsLoaded && inputMethod === 'auto') return 'manual'; // Fallback while loading
    return 'google';
  };

  const activeMethod = getActiveInputMethod();

  // Handle Google Maps address selection
  const handleGoogleMapsSelect = (addressData: GoogleAddressData) => {
    const fallbackData: FallbackAddressData = {
      formattedAddress: addressData.formattedAddress,
      street: addressData.street,
      city: addressData.city,
      province: addressData.province,
      postalCode: addressData.postalCode,
      country: addressData.country,
      latitude: addressData.latitude,
      longitude: addressData.longitude,
      source: 'google_maps',
      timestamp: new Date().toISOString(),
    };

    setSelectedAddress(fallbackData);
    
    // Update manual fields too (for consistency)
    setManualAddress({
      street: addressData.street,
      city: addressData.city,
      province: addressData.province,
      postalCode: addressData.postalCode,
    });

    onAddressSelect(fallbackData);
  };

  // Handle manual address input
  const handleManualUpdate = (field: keyof typeof manualAddress, value: string) => {
    const newAddress = { ...manualAddress, [field]: value };
    setManualAddress(newAddress);

    // Check if address is complete
    const isComplete = Object.values(newAddress).every(val => val.trim() !== "");
    
    if (isComplete) {
      const formattedAddress = [
        newAddress.street,
        newAddress.city,
        newAddress.province,
        newAddress.postalCode,
        "South Africa"
      ].filter(Boolean).join(", ");

      const fallbackData: FallbackAddressData = {
        formattedAddress,
        street: newAddress.street,
        city: newAddress.city,
        province: newAddress.province,
        postalCode: newAddress.postalCode,
        country: "South Africa",
        source: 'manual_entry',
        timestamp: new Date().toISOString(),
      };

      setSelectedAddress(fallbackData);
      onAddressSelect(fallbackData);
    }
  };

  // Toggle between methods
  const handleMethodToggle = (method: 'google' | 'manual') => {
    setInputMethod(method);
    if (method === 'manual') {
      setForceManual(true);
    } else {
      setForceManual(false);
    }
  };

  // Retry Google Maps
  const handleRetryGoogleMaps = () => {
    setForceManual(false);
    setInputMethod('google');
    window.location.reload(); // Force reload to retry Google Maps
  };

  const renderMethodIndicator = () => {
    if (!showMethodIndicator) return null;

    return (
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Badge variant={activeMethod === 'google' ? 'default' : 'secondary'} className="flex items-center gap-1">
            {activeMethod === 'google' ? <MapIcon className="h-3 w-3" /> : <Keyboard className="h-3 w-3" />}
            {activeMethod === 'google' ? 'Smart Address' : 'Manual Entry'}
          </Badge>
          
          <Badge variant={connectionStatus === 'online' ? 'default' : 'destructive'} className="flex items-center gap-1">
            {connectionStatus === 'online' ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {connectionStatus === 'online' ? 'Online' : 'Offline'}
          </Badge>
        </div>

        <div className="flex gap-2">
          {activeMethod === 'manual' && mapsLoaded && connectionStatus === 'online' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleMethodToggle('google')}
              className="text-xs"
            >
              <MapIcon className="h-3 w-3 mr-1" />
              Use Smart Address
            </Button>
          )}
          
          {activeMethod === 'google' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleMethodToggle('manual')}
              className="text-xs"
            >
              <Keyboard className="h-3 w-3 mr-1" />
              Manual Entry
            </Button>
          )}
        </div>
      </div>
    );
  };

  const renderAddressPreview = () => {
    if (!selectedAddress) return null;

    return (
      <Card className="bg-green-50 border-green-200 mt-4">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-medium text-green-800">
                  Address Saved
                </p>
                <Badge variant="outline" className="text-xs">
                  {selectedAddress.source === 'google_maps' ? 'Smart Address' : 'Manual Entry'}
                </Badge>
              </div>
              <p className="text-sm text-green-700">
                {selectedAddress.formattedAddress}
              </p>
              <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-green-600">
                <span><strong>City:</strong> {selectedAddress.city}</span>
                <span><strong>Province:</strong> {selectedAddress.province}</span>
                <span><strong>Postal:</strong> {selectedAddress.postalCode}</span>
                <span><strong>Country:</strong> {selectedAddress.country}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {label && (
        <Label className="text-base font-medium flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}

      {renderMethodIndicator()}

      {/* Address Input */}
      {activeMethod === 'google' ? (
        <GoogleMapsAddressAutocomplete
          onAddressSelect={handleGoogleMapsSelect}
          placeholder={placeholder}
          required={required}
          error={error}
          defaultValue={{
            formattedAddress: defaultValue?.formattedAddress || "",
            street: defaultValue?.street || "",
            city: defaultValue?.city || "",
            province: defaultValue?.province || "",
            postalCode: defaultValue?.postalCode || "",
            country: defaultValue?.country || "South Africa",
          }}
        />
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Manual Address Entry</CardTitle>
              {mapsLoadError && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetryGoogleMaps}
                  className="text-xs"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry Smart Address
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Street Address */}
            <div>
              <Label htmlFor="manual-street" className="text-sm font-medium">
                Street Address {required && <span className="text-red-500">*</span>}
              </Label>
              <Input
                id="manual-street"
                type="text"
                placeholder="e.g., 123 Main Street"
                value={manualAddress.street}
                onChange={(e) => handleManualUpdate("street", e.target.value)}
                className={error ? "border-red-500" : ""}
                required={required}
              />
            </div>

            {/* City */}
            <div>
              <Label htmlFor="manual-city" className="text-sm font-medium">
                City {required && <span className="text-red-500">*</span>}
              </Label>
              <Input
                id="manual-city"
                type="text"
                placeholder="e.g., Cape Town"
                value={manualAddress.city}
                onChange={(e) => handleManualUpdate("city", e.target.value)}
                className={error ? "border-red-500" : ""}
                required={required}
              />
            </div>

            {/* Province and Postal Code */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="manual-province" className="text-sm font-medium">
                  Province {required && <span className="text-red-500">*</span>}
                </Label>
                <Select
                  value={manualAddress.province}
                  onValueChange={(value) => handleManualUpdate("province", value)}
                >
                  <SelectTrigger className={error ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select province" />
                  </SelectTrigger>
                  <SelectContent>
                    {southAfricanProvinces.map((province) => (
                      <SelectItem key={province} value={province}>
                        {province}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="manual-postal" className="text-sm font-medium">
                  Postal Code {required && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  id="manual-postal"
                  type="text"
                  placeholder="e.g., 8001"
                  value={manualAddress.postalCode}
                  onChange={(e) => handleManualUpdate("postalCode", e.target.value)}
                  className={error ? "border-red-500" : ""}
                  required={required}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Show fallback notification */}
      {activeMethod === 'manual' && autoFallback && (mapsLoadError || connectionStatus === 'offline') && (
        <Alert className="border-blue-200 bg-blue-50">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            {connectionStatus === 'offline' 
              ? "You're offline. Using manual address entry."
              : "Smart address lookup isn't available right now. Using manual entry as backup."
            }
          </AlertDescription>
        </Alert>
      )}

      {renderAddressPreview()}
    </div>
  );
};

export default FallbackAddressInput;

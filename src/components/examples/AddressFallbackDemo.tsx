import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MapPin, 
  CheckCircle, 
  AlertTriangle, 
  Wifi, 
  WifiOff,
  RefreshCw,
  Save,
  Trash2
} from 'lucide-react';

import FallbackAddressInput, { FallbackAddressData } from '@/components/FallbackAddressInput';
import { useAddressFallback } from '@/hooks/useAddressFallback';
import { fallbackAddressService } from '@/services/fallbackAddressService';

const AddressFallbackDemo: React.FC = () => {
  const [selectedAddress, setSelectedAddress] = useState<FallbackAddressData | null>(null);
  const [saveStatus, setSaveStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const {
    state,
    addresses,
    saveGoogleMapsAddress,
    saveManualAddress,
    getBestAddress,
    getAddressConfidence,
    validateAddress,
    clearAddresses,
  } = useAddressFallback();

  // Simulate offline mode for demo
  const toggleOnlineMode = () => {
    setIsOnline(!isOnline);
    if (!isOnline) {
      window.dispatchEvent(new Event('online'));
    } else {
      window.dispatchEvent(new Event('offline'));
    }
  };

  const handleAddressSelect = async (addressData: FallbackAddressData) => {
    setSelectedAddress(addressData);
    
    // Save to the hook state based on source
    if (addressData.source === 'google_maps') {
      saveGoogleMapsAddress(addressData);
    } else {
      saveManualAddress(addressData);
    }

    // Clear any previous save status
    setSaveStatus(null);
  };

  const handleSaveToDatabase = async () => {
    if (!selectedAddress) return;

    setSaveStatus(null);
    
    try {
      // In a real app, you'd get the user ID from auth context
      const mockUserId = 'demo-user-123';
      
      const result = await fallbackAddressService.saveAddress(
        mockUserId,
        selectedAddress,
        'shipping',
        true // Set as primary
      );

      if (result.success) {
        setSaveStatus({ 
          success: true, 
          message: `Address saved successfully using ${selectedAddress.source === 'google_maps' ? 'Smart Address' : 'Manual Entry'}!` 
        });
      } else {
        setSaveStatus({ 
          success: false, 
          message: `Failed to save: ${result.error}` 
        });
      }
    } catch (error) {
      setSaveStatus({ 
        success: false, 
        message: 'An error occurred while saving the address' 
      });
    }
  };

  const handleClearAddresses = () => {
    clearAddresses();
    setSelectedAddress(null);
    setSaveStatus(null);
  };

  const validation = selectedAddress ? validateAddress(selectedAddress) : null;
  const confidence = getAddressConfidence();
  const bestAddress = getBestAddress();

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Address Fallback System Demo</h1>
        <p className="text-gray-600">
          Experience how the system automatically switches between Google Maps and manual entry
        </p>
      </div>

      {/* Demo Controls */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            🧪 Demo Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Network Status:</span>
              <Badge variant={isOnline ? 'default' : 'destructive'} className="flex items-center gap-1">
                {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                {isOnline ? 'Online' : 'Offline'}
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleOnlineMode}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Simulate {isOnline ? 'Offline' : 'Online'}
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium">Google Maps:</span>
              <div className={`text-xs ${state.isGoogleMapsAvailable ? 'text-green-600' : 'text-red-600'}`}>
                {state.isGoogleMapsAvailable ? 'Available' : 'Unavailable'}
              </div>
            </div>
            <div>
              <span className="font-medium">Recommended:</span>
              <div className="text-xs text-blue-600">
                {state.recommendedMethod === 'google_maps' ? 'Smart Address' : 'Manual Entry'}
              </div>
            </div>
            <div>
              <span className="font-medium">Auto Fallback:</span>
              <div className={`text-xs ${state.shouldAutoFallback ? 'text-green-600' : 'text-gray-600'}`}>
                {state.shouldAutoFallback ? 'Enabled' : 'Disabled'}
              </div>
            </div>
            <div>
              <span className="font-medium">Retry Count:</span>
              <div className="text-xs text-gray-600">
                {state.retryCount}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="input" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="input">Address Input</TabsTrigger>
          <TabsTrigger value="state">System State</TabsTrigger>
          <TabsTrigger value="storage">Storage Demo</TabsTrigger>
        </TabsList>

        <TabsContent value="input" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Fallback Address Input
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FallbackAddressInput
                onAddressSelect={handleAddressSelect}
                label="Delivery Address"
                placeholder="Enter your address..."
                required
                showMethodIndicator
                autoFallback
                className="mb-4"
              />

              {/* Validation Results */}
              {validation && (
                <Alert className={`mt-4 ${validation.isValid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                  {validation.isValid ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  )}
                  <AlertDescription className={validation.isValid ? 'text-green-800' : 'text-red-800'}>
                    {validation.isValid 
                      ? `Address is valid! Confidence level: ${confidence || 'unknown'}`
                      : `Missing fields: ${validation.missingFields.join(', ')}`
                    }
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="state" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Current State */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">System State</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Google Maps Available:</span>
                    <Badge variant={state.isGoogleMapsAvailable ? 'default' : 'secondary'}>
                      {state.isGoogleMapsAvailable ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Network Status:</span>
                    <Badge variant={state.isOnline ? 'default' : 'destructive'}>
                      {state.isOnline ? 'Online' : 'Offline'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Recommended Method:</span>
                    <Badge variant="outline">
                      {state.recommendedMethod === 'google_maps' ? 'Smart Address' : 'Manual Entry'}
                    </Badge>
                  </div>
                  {state.lastError && (
                    <div className="p-2 bg-red-50 rounded text-xs text-red-700">
                      <strong>Last Error:</strong> {state.lastError}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Stored Addresses */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Stored Addresses</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {addresses.google && (
                  <div className="p-3 bg-green-50 rounded">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="default" className="text-xs">Google Maps</Badge>
                      <Badge variant="outline" className="text-xs">High Confidence</Badge>
                    </div>
                    <p className="text-sm text-green-800">{addresses.google.formattedAddress}</p>
                  </div>
                )}
                
                {addresses.manual && (
                  <div className="p-3 bg-blue-50 rounded">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-xs">Manual Entry</Badge>
                      <Badge variant="outline" className="text-xs">Medium Confidence</Badge>
                    </div>
                    <p className="text-sm text-blue-800">{addresses.manual.formattedAddress}</p>
                  </div>
                )}

                {!addresses.google && !addresses.manual && (
                  <p className="text-sm text-gray-500">No addresses stored yet</p>
                )}

                {(addresses.google || addresses.manual) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearAddresses}
                    className="w-full flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Clear Addresses
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="storage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Database Storage Demo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedAddress ? (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded">
                    <h4 className="font-medium mb-2">Selected Address:</h4>
                    <p className="text-sm text-gray-700 mb-2">{selectedAddress.formattedAddress}</p>
                    <div className="flex gap-2">
                      <Badge variant={selectedAddress.source === 'google_maps' ? 'default' : 'secondary'}>
                        {selectedAddress.source === 'google_maps' ? 'Smart Address' : 'Manual Entry'}
                      </Badge>
                      <Badge variant="outline">
                        {selectedAddress.source === 'google_maps' ? 'High Confidence' : 'Medium Confidence'}
                      </Badge>
                    </div>
                  </div>

                  <Button
                    onClick={handleSaveToDatabase}
                    className="w-full flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    Save to Database
                  </Button>

                  {saveStatus && (
                    <Alert className={saveStatus.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                      {saveStatus.success ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      )}
                      <AlertDescription className={saveStatus.success ? 'text-green-800' : 'text-red-800'}>
                        {saveStatus.message}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Please enter an address using the input above to test database storage.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AddressFallbackDemo;

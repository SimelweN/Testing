import { useState, useEffect, useCallback } from 'react';
import { useGoogleMaps } from '@/contexts/GoogleMapsContext';

export interface AddressData {
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
  confidence?: 'high' | 'medium' | 'low';
}

export interface AddressFallbackState {
  isGoogleMapsAvailable: boolean;
  isOnline: boolean;
  recommendedMethod: 'google_maps' | 'manual_entry';
  shouldAutoFallback: boolean;
  retryCount: number;
  lastError?: string;
}

export const useAddressFallback = () => {
  const { isLoaded: mapsLoaded, loadError: mapsLoadError } = useGoogleMaps();
  
  const [state, setState] = useState<AddressFallbackState>({
    isGoogleMapsAvailable: false,
    isOnline: navigator.onLine,
    recommendedMethod: 'manual_entry',
    shouldAutoFallback: true,
    retryCount: 0,
  });

  const [addresses, setAddresses] = useState<{
    google?: AddressData;
    manual?: AddressData;
    selected?: AddressData;
  }>({});

  // Update online status
  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true }));
    };
    
    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false, recommendedMethod: 'manual_entry' }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update Google Maps availability
  useEffect(() => {
    const isAvailable = mapsLoaded && !mapsLoadError && state.isOnline;
    
    setState(prev => ({
      ...prev,
      isGoogleMapsAvailable: isAvailable,
      recommendedMethod: isAvailable ? 'google_maps' : 'manual_entry',
      lastError: mapsLoadError?.message,
    }));
  }, [mapsLoaded, mapsLoadError, state.isOnline]);

  // Save Google Maps address
  const saveGoogleMapsAddress = useCallback((addressData: Omit<AddressData, 'source' | 'timestamp' | 'confidence'>) => {
    const address: AddressData = {
      ...addressData,
      source: 'google_maps',
      timestamp: new Date().toISOString(),
      confidence: 'high', // Google Maps data is usually high confidence
    };

    setAddresses(prev => ({
      ...prev,
      google: address,
      selected: address,
    }));

    return address;
  }, []);

  // Save manual address
  const saveManualAddress = useCallback((addressData: Omit<AddressData, 'source' | 'timestamp' | 'confidence'>) => {
    const address: AddressData = {
      ...addressData,
      source: 'manual_entry',
      timestamp: new Date().toISOString(),
      confidence: 'medium', // Manual entry is medium confidence
    };

    setAddresses(prev => ({
      ...prev,
      manual: address,
      selected: address,
    }));

    return address;
  }, []);

  // Validate address completeness
  const validateAddress = useCallback((address: Partial<AddressData>): { isValid: boolean; missingFields: string[] } => {
    const requiredFields = ['street', 'city', 'province', 'postalCode'];
    const missingFields = requiredFields.filter(field => 
      !address[field as keyof AddressData] || 
      (address[field as keyof AddressData] as string).trim() === ''
    );

    return {
      isValid: missingFields.length === 0,
      missingFields,
    };
  }, []);

  // Compare two addresses for similarity
  const compareAddresses = useCallback((addr1: AddressData, addr2: AddressData): { similarity: number; differences: string[] } => {
    const fields = ['street', 'city', 'province', 'postalCode'];
    const differences: string[] = [];
    let matches = 0;

    fields.forEach(field => {
      const val1 = (addr1[field as keyof AddressData] as string)?.toLowerCase().trim();
      const val2 = (addr2[field as keyof AddressData] as string)?.toLowerCase().trim();
      
      if (val1 === val2) {
        matches++;
      } else {
        differences.push(field);
      }
    });

    return {
      similarity: matches / fields.length,
      differences,
    };
  }, []);

  // Retry Google Maps
  const retryGoogleMaps = useCallback(() => {
    setState(prev => ({
      ...prev,
      retryCount: prev.retryCount + 1,
      lastError: undefined,
    }));
    
    // Force reload Google Maps context (this would need to be implemented in the context)
    window.location.reload();
  }, []);

  // Get the best available address
  const getBestAddress = useCallback((): AddressData | null => {
    if (addresses.selected) return addresses.selected;
    if (addresses.google) return addresses.google;
    if (addresses.manual) return addresses.manual;
    return null;
  }, [addresses]);

  // Clear all addresses
  const clearAddresses = useCallback(() => {
    setAddresses({});
  }, []);

  // Get confidence level for current address
  const getAddressConfidence = useCallback((): 'high' | 'medium' | 'low' | null => {
    const best = getBestAddress();
    if (!best) return null;
    
    // Google Maps = high confidence
    if (best.source === 'google_maps') return 'high';
    
    // Manual with coordinates = medium confidence
    if (best.source === 'manual_entry' && best.latitude && best.longitude) return 'medium';
    
    // Manual without coordinates = low confidence
    return 'low';
  }, [getBestAddress]);

  // Export address data for storage
  const exportAddressData = useCallback(() => {
    return {
      addresses,
      state,
      timestamp: new Date().toISOString(),
    };
  }, [addresses, state]);

  // Import address data from storage
  const importAddressData = useCallback((data: any) => {
    if (data.addresses) {
      setAddresses(data.addresses);
    }
  }, []);

  return {
    // State
    state,
    addresses,
    
    // Actions
    saveGoogleMapsAddress,
    saveManualAddress,
    retryGoogleMaps,
    clearAddresses,
    
    // Utilities
    validateAddress,
    compareAddresses,
    getBestAddress,
    getAddressConfidence,
    exportAddressData,
    importAddressData,
    
    // Computed values
    hasAddress: !!getBestAddress(),
    isGoogleMapsPreferred: state.isGoogleMapsAvailable && state.recommendedMethod === 'google_maps',
    shouldShowFallback: !state.isGoogleMapsAvailable || !!state.lastError,
  };
};

export type UseAddressFallbackReturn = ReturnType<typeof useAddressFallback>;

import React, { createContext, useContext, ReactNode } from "react";
import { useJsApiLoader } from "@react-google-maps/api";

// Define the libraries array with proper typing
const libraries: "places"[] = ["places"];

// Define the context type
interface GoogleMapsContextType {
  isLoaded: boolean;
  loadError: Error | undefined;
}

// Create the context with undefined as default
const GoogleMapsContext = createContext<GoogleMapsContextType | undefined>(
  undefined,
);

// Custom hook to use the Google Maps context
export const useGoogleMaps = (): GoogleMapsContextType => {
  const context = useContext(GoogleMapsContext);
  if (context === undefined) {
    throw new Error("useGoogleMaps must be used within a GoogleMapsProvider");
  }
  return context;
};

// Provider props interface
interface GoogleMapsProviderProps {
  children: ReactNode;
}

// Google Maps Provider component
export const GoogleMapsProvider: React.FC<GoogleMapsProviderProps> = ({
  children,
}) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // Check if API key is valid (not empty, undefined, or placeholder)
  const isValidApiKey =
    apiKey &&
    apiKey.trim() !== "" &&
    apiKey !== "your_google_maps_api_key" &&
    apiKey.startsWith("AIza");

  // Only attempt to load Google Maps if we have a valid API key
  const shouldLoadMaps = isValidApiKey;

  // Use conditional hook calling to completely avoid loading
  const loaderResult = shouldLoadMaps
    ? useJsApiLoader({
        id: "google-map-script",
        googleMapsApiKey: apiKey,
        libraries,
        preventGoogleFontsLoading: true,
      })
    : { isLoaded: false, loadError: undefined };

  const { isLoaded, loadError } = loaderResult;

  const value: GoogleMapsContextType = {
    isLoaded: shouldLoadMaps ? isLoaded : false,
    loadError: shouldLoadMaps
      ? loadError
      : new Error("Google Maps API key not configured or invalid"),
  };

  // Log warning in development if API key is missing or invalid
  if (import.meta.env.DEV && !isValidApiKey) {
    console.warn(
      "Google Maps API key is missing or invalid. Google Maps features will be disabled.",
      { providedKey: apiKey ? `${apiKey.substring(0, 10)}...` : "none" },
    );
  }

  return (
    <GoogleMapsContext.Provider value={value}>
      {children}
    </GoogleMapsContext.Provider>
  );
};

export default GoogleMapsProvider;

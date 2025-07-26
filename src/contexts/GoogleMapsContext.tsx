import React, { createContext, useContext, ReactNode, useEffect } from "react";
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
  const disableMaps = import.meta.env.VITE_DISABLE_GOOGLE_MAPS !== "false";

  // Check if API key is valid (not empty, undefined, or placeholder)
  const isValidApiKey =
    apiKey &&
    apiKey.trim() !== "" &&
    apiKey !== "your_google_maps_api_key" &&
    apiKey.startsWith("AIza");

  // Only attempt to load Google Maps if we have a valid API key and it's not disabled
  const shouldLoadMaps = isValidApiKey && !disableMaps;

  // Always suppress Google Maps retry errors to prevent console spam
  useEffect(() => {

    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;

    const isGoogleMapsError = (message: string) => {
      const msg = message.toLowerCase();
      return (
        msg.includes("failed to load google maps script") ||
        msg.includes("google maps script, retrying") ||
        msg.includes("retrying in") ||
        msg.includes("google maps javascript api") ||
        msg.includes("maps.googleapis.com") ||
        msg.includes("google maps api") ||
        msg.includes("gmaps")
      );
    };

    console.error = function (...args) {
      const message = args.join(" ");
      if (isGoogleMapsError(message)) {
        // Suppress Google Maps retry errors to prevent spam
        return;
      }
      originalConsoleError.apply(this, args);
    };

    console.warn = function (...args) {
      const message = args.join(" ");
      if (isGoogleMapsError(message)) {
        // Suppress Google Maps retry warnings to prevent spam
        return;
      }
      originalConsoleWarn.apply(this, args);
    };

    return () => {
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
    };
  }, []);

  // Load Google Maps if we have a valid API key
  const { isLoaded, loadError } = shouldLoadMaps
    ? useJsApiLoader({
        id: "google-map-script",
        googleMapsApiKey: apiKey!,
        libraries,
        preventGoogleFontsLoading: true,
        region: "ZA", // South Africa region
        retries: 2, // Reduce retry attempts
        nonce: undefined,
        language: "en"
      })
    : { isLoaded: false, loadError: undefined };

  const value: GoogleMapsContextType = {
    isLoaded: shouldLoadMaps && isLoaded,
    loadError: shouldLoadMaps && loadError
      ? loadError
      : !shouldLoadMaps
      ? new Error(
          "Google Maps is disabled. Please configure VITE_GOOGLE_MAPS_API_KEY in your environment variables."
        )
      : undefined,
  };

  // Log helpful message in development if API key is missing or invalid
  if (import.meta.env.DEV && !isValidApiKey) {
    console.info(
      "🗺️ Google Maps is disabled: API key not configured.\n" +
      "To enable Google Maps:\n" +
      "1. Get an API key from https://console.cloud.google.com/apis/credentials\n" +
      "2. Enable Places API and Maps JavaScript API\n" +
      "3. Add VITE_GOOGLE_MAPS_API_KEY=your_key to .env\n" +
      "4. Set VITE_DISABLE_GOOGLE_MAPS=false\n" +
      "\nFalling back to manual address entry."
    );
  }

  return (
    <GoogleMapsContext.Provider value={value}>
      {children}
    </GoogleMapsContext.Provider>
  );
};

export default GoogleMapsProvider;

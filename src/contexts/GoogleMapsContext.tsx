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

    // Aggressive Google Maps error suppression
  useEffect(() => {
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;

        const isGoogleMapsError = (message: string) => {
      const msg = message.toLowerCase();
      return (
        msg.includes("failed to load google maps script") ||
        msg.includes("google maps script, retrying") ||
        msg.includes("google maps script") ||
        msg.includes("retrying in") ||
        msg.includes("maps api") ||
        msg.includes("places api") ||
        msg.includes("google.maps") ||
        msg.includes("googleapis.com") ||
        msg.includes("maps javascript api") ||
        msg.includes("map api") ||
        msg.includes("script retrying") ||
        msg.includes("google api")
      );
    };

    console.error = function (...args) {
      const message = args.join(" ");
      if (isGoogleMapsError(message)) {
        // Completely suppress Google Maps retry messages
        return;
      }
      originalConsoleError.apply(this, args);
    };

    console.warn = function (...args) {
      const message = args.join(" ");
      if (isGoogleMapsError(message)) {
        // Completely suppress Google Maps retry messages
        return;
      }
      originalConsoleWarn.apply(this, args);
    };

    return () => {
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
    };
  }, []);

  // Check if API key is valid (not empty, undefined, or placeholder)
  const isValidApiKey =
    apiKey &&
    apiKey.trim() !== "" &&
    apiKey !== "your_google_maps_api_key" &&
    apiKey.startsWith("AIza");

  // Only attempt to load Google Maps if we have a valid API key and it's not disabled
  const shouldLoadMaps =
    isValidApiKey && !import.meta.env.VITE_DISABLE_GOOGLE_MAPS;

  // Temporarily disable Google Maps completely to stop retry messages
  // TODO: Re-enable once Google Maps API issues are resolved
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: "", // Empty string to prevent loading
    libraries,
    preventGoogleFontsLoading: true,
    loadingElement: null, // Prevent loading
  });

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

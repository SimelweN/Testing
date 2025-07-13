import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

const MapsTest = () => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [googleMapsReady, setGoogleMapsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<any[]>([]);

  useEffect(() => {
    // Check API key
    const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    setApiKey(key);

    const results = [];

    // Test 1: Environment variable
    results.push({
      test: "Environment Variable",
      result: key ? "✅ Found" : "❌ Missing",
      details: key
        ? `Key starts with: ${key.substring(0, 10)}...`
        : "VITE_GOOGLE_MAPS_API_KEY not found",
      status: key ? "success" : "error",
    });

    // Test 2: Google object
    results.push({
      test: "Google Maps Object",
      result: window.google ? "✅ Available" : "❌ Not loaded",
      details: window.google
        ? "window.google exists"
        : "Google Maps script not loaded",
      status: window.google ? "success" : "warning",
    });

    // Test 3: Console errors
    const originalError = console.error;
    const errors: string[] = [];
    console.error = (...args) => {
      errors.push(args.join(" "));
      originalError(...args);
    };

    setTimeout(() => {
      console.error = originalError;
      results.push({
        test: "Console Errors",
        result:
          errors.length === 0 ? "✅ No errors" : `❌ ${errors.length} errors`,
        details:
          errors.length > 0
            ? errors.join(", ")
            : "No Google Maps related errors",
        status: errors.length === 0 ? "success" : "error",
      });

      setTestResults(results);
    }, 2000);
  }, []);

  const loadGoogleMapsManually = () => {
    if (!apiKey) {
      setError("No API key available");
      return;
    }

    setError(null);
    setScriptLoaded(false);
    setGoogleMapsReady(false);

    console.log("🚀 Starting manual Google Maps load...");
    console.log("📍 API Key:", apiKey.substring(0, 10) + "...");

    // Remove existing script if any
    const existingScript = document.querySelector(
      'script[src*="maps.googleapis.com"]',
    );
    if (existingScript) {
      console.log("🗑️ Removing existing script");
      existingScript.remove();
    }

    // Clean up existing Google objects
    if ((window as any).google) {
      console.log("🧹 Cleaning up existing Google object");
      delete (window as any).google;
    }

    const script = document.createElement("script");
    const scriptUrl = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps`;
    script.src = scriptUrl;
    script.async = true;
    script.defer = true;

    console.log("📡 Loading script from:", scriptUrl);

    // Set up callback
    (window as any).initGoogleMaps = () => {
      console.log("✅ Google Maps callback fired!");
      setScriptLoaded(true);
      setGoogleMapsReady(true);

      // Test if Places API is available
      if (window.google && window.google.maps && window.google.maps.places) {
        console.log("🎯 Places API confirmed available!");
      } else {
        console.warn("⚠️ Places API not available");
        setError(
          "Places API not available - check Google Cloud Console settings",
        );
      }
    };

    script.onload = () => {
      console.log("📜 Script element loaded successfully");
      setScriptLoaded(true);
    };

    script.onerror = (e) => {
      console.error("❌ Script loading failed:", e);
      setError(`Script loading failed. This could be due to:
      1. Invalid API key
      2. Network/firewall blocking maps.googleapis.com
      3. API not enabled in Google Cloud Console
      4. Billing not set up in Google Cloud`);
    };

    document.head.appendChild(script);

    // Timeout check
    setTimeout(() => {
      if (!window.google) {
        console.warn(
          "⏰ Timeout: Google Maps still not loaded after 10 seconds",
        );
        setError(
          "Timeout: Google Maps took too long to load. Check network connection.",
        );
      }
    }, 10000);
  };

  const testAutocomplete = () => {
    console.log("🧪 Testing autocomplete...");

    if (!window.google || !window.google.maps || !window.google.maps.places) {
      const msg = "Google Maps Places API not available";
      console.error("❌", msg);
      setError(msg);
      return;
    }

    try {
      // Create a temporary input element
      const input = document.createElement("input");
      input.placeholder = "Test input for autocomplete";
      input.style.position = "fixed";
      input.style.top = "-1000px";
      document.body.appendChild(input);

      const autocomplete = new window.google.maps.places.Autocomplete(input, {
        types: ["address"],
        componentRestrictions: { country: "za" },
        fields: ["formatted_address", "geometry"],
      });

      console.log("✅ Autocomplete created successfully!", autocomplete);
      setError(null);

      // Test autocomplete methods
      console.log("🔧 Testing autocomplete methods...");
      console.log("- setBounds method:", typeof autocomplete.setBounds);
      console.log("- setFields method:", typeof autocomplete.setFields);
      console.log("- getPlace method:", typeof autocomplete.getPlace);

      // Clean up
      document.body.removeChild(input);

      console.log("🎉 All tests passed!");
    } catch (err) {
      console.error("❌ Autocomplete test failed:", err);
      setError(`Autocomplete test failed: ${err}`);
    }
  };

  const testDirectURL = () => {
    if (!apiKey) {
      setError("No API key to test");
      return;
    }

    const testUrl = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    console.log("🌐 Testing direct URL access...");
    console.log("URL:", testUrl);

    // Open in new tab to test manually
    window.open(testUrl, "_blank");
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-book-800 mb-4">
            Google Maps API Test Page
          </h1>
          <p className="text-gray-600">
            Debugging Google Maps integration issues
          </p>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="text-center">
            <CardContent className="pt-6">
              {apiKey ? (
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              ) : (
                <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
              )}
              <h3 className="font-semibold mb-2">API Key</h3>
              <Badge variant={apiKey ? "default" : "destructive"}>
                {apiKey ? "Available" : "Missing"}
              </Badge>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              {scriptLoaded ? (
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              ) : (
                <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
              )}
              <h3 className="font-semibold mb-2">Script Loaded</h3>
              <Badge variant={scriptLoaded ? "default" : "secondary"}>
                {scriptLoaded ? "Loaded" : "Not Loaded"}
              </Badge>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              {googleMapsReady ? (
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              ) : (
                <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
              )}
              <h3 className="font-semibold mb-2">Maps Ready</h3>
              <Badge variant={googleMapsReady ? "default" : "secondary"}>
                {googleMapsReady ? "Ready" : "Not Ready"}
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Error Display */}
        {error && (
          <Alert className="border-red-200 bg-red-50 mb-6">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Error:</strong> {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Test Results */}
        {testResults.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Diagnostic Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {testResults.map((result, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <div className="font-medium">{result.test}</div>
                      <div className="text-sm text-gray-600">
                        {result.details}
                      </div>
                    </div>
                    <Badge
                      variant={
                        result.status === "success"
                          ? "default"
                          : result.status === "error"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {result.result}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Manual Tests */}
        <Card>
          <CardHeader>
            <CardTitle>Manual Tests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                onClick={loadGoogleMapsManually}
                disabled={!apiKey}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Load Maps Script
              </Button>

              <Button
                onClick={testAutocomplete}
                disabled={!googleMapsReady}
                variant="outline"
                className="flex items-center gap-2"
              >
                <MapPin className="h-4 w-4" />
                Test Autocomplete
              </Button>

              <Button
                onClick={testDirectURL}
                disabled={!apiKey}
                variant="secondary"
                className="flex items-center gap-2"
              >
                🌐 Test API Key
              </Button>
            </div>

            <div className="text-sm text-gray-600 space-y-2">
              <p>
                <strong>Step 1:</strong> Open browser console (F12) to see
                detailed logs
              </p>
              <p>
                <strong>Step 2:</strong> Click "Load Maps Script" - watch
                console for errors
              </p>
              <p>
                <strong>Step 3:</strong> Click "Test API Key" to verify key
                works in browser
              </p>
              <p>
                <strong>Step 4:</strong> Once loaded, test autocomplete
                functionality
              </p>
            </div>

            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Console Output:</strong> Detailed debug information is
                logged to the browser console. Press F12 and look at the Console
                tab for step-by-step loading details.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Environment Info */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Environment Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Mode:</strong> {import.meta.env.MODE}
              </div>
              <div>
                <strong>Dev:</strong> {import.meta.env.DEV ? "Yes" : "No"}
              </div>
              <div>
                <strong>Prod:</strong> {import.meta.env.PROD ? "Yes" : "No"}
              </div>
              <div>
                <strong>Base URL:</strong> {import.meta.env.BASE_URL}
              </div>
              <div className="md:col-span-2">
                <strong>API Key (first 20 chars):</strong>{" "}
                {apiKey ? apiKey.substring(0, 20) + "..." : "Not found"}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default MapsTest;

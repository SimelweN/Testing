import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Copy, TestTube, RefreshCw } from "lucide-react";

const AuthVerificationTester = () => {
  const [testUrl, setTestUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<{
    urlAnalysis: any;
    verificationAttempt: any;
  } | null>(null);

  const analyzeUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      const searchParams = new URLSearchParams(urlObj.search);
      const hashParams = new URLSearchParams(urlObj.hash.substring(1));
      
      const analysis = {
        valid: true,
        protocol: urlObj.protocol,
        host: urlObj.host,
        pathname: urlObj.pathname,
        searchParams: Object.fromEntries(searchParams.entries()),
        hashParams: Object.fromEntries(hashParams.entries()),
        allParams: {
          ...Object.fromEntries(searchParams.entries()),
          ...Object.fromEntries(hashParams.entries())
        },
        hasAccessToken: !!(searchParams.get("access_token") || hashParams.get("access_token")),
        hasRefreshToken: !!(searchParams.get("refresh_token") || hashParams.get("refresh_token")),
        hasTokenHash: !!(searchParams.get("token_hash") || hashParams.get("token_hash")),
        hasToken: !!(searchParams.get("token") || hashParams.get("token")),
        hasType: !!(searchParams.get("type") || hashParams.get("type")),
        hasError: !!(searchParams.get("error") || hashParams.get("error")),
        type: searchParams.get("type") || hashParams.get("type"),
        error: searchParams.get("error") || hashParams.get("error"),
        expectedRoute: urlObj.pathname.includes("/auth/callback") ? "AuthCallback" : 
                      urlObj.pathname.includes("/verify") ? "Verify" : "Unknown"
      };

      return analysis;
    } catch (error) {
      return {
        valid: false,
        error: "Invalid URL format"
      };
    }
  };

  const testVerification = async () => {
    if (!testUrl.trim()) {
      toast.error("Please enter a verification URL");
      return;
    }

    setIsLoading(true);
    try {
      const urlAnalysis = analyzeUrl(testUrl);
      
      let verificationAttempt = null;
      
      if (urlAnalysis.valid && urlAnalysis.allParams) {
        const params = urlAnalysis.allParams;
        
        // Try different verification methods
        if (params.access_token && params.refresh_token) {
          try {
            const { data, error } = await supabase.auth.setSession({
              access_token: params.access_token,
              refresh_token: params.refresh_token,
            });
            verificationAttempt = {
              method: "setSession",
              success: !error && !!data.session,
              error: error?.message,
              hasSession: !!data?.session,
              userEmail: data?.user?.email
            };
          } catch (error: any) {
            verificationAttempt = {
              method: "setSession",
              success: false,
              error: error.message,
              hasSession: false
            };
          }
        } else if ((params.token_hash || params.token) && params.type) {
          try {
            const verificationData = params.token_hash
              ? { token_hash: params.token_hash, type: params.type }
              : { token: params.token, type: params.type };
            
            const { data, error } = await supabase.auth.verifyOtp(verificationData as any);
            verificationAttempt = {
              method: "verifyOtp",
              success: !error && !!data.session,
              error: error?.message,
              hasSession: !!data?.session,
              userEmail: data?.user?.email,
              verificationData
            };
          } catch (error: any) {
            verificationAttempt = {
              method: "verifyOtp",
              success: false,
              error: error.message,
              hasSession: false
            };
          }
        }
      }

      setResults({
        urlAnalysis,
        verificationAttempt
      });

      if (verificationAttempt?.success) {
        toast.success("Verification test successful!");
      } else {
        toast.error("Verification test failed");
      }
    } catch (error: any) {
      toast.error(`Test failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const getCurrentUrl = () => {
    setTestUrl(window.location.href);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Email Verification URL Tester
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Paste your verification URL here..."
            value={testUrl}
            onChange={(e) => setTestUrl(e.target.value)}
            className="flex-1"
          />
          <Button
            variant="outline"
            onClick={getCurrentUrl}
            title="Use current page URL"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            onClick={testVerification}
            disabled={isLoading || !testUrl.trim()}
          >
            {isLoading ? "Testing..." : "Test URL"}
          </Button>
        </div>

        {results && (
          <div className="space-y-4">
            {/* URL Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">URL Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                {results.urlAnalysis.valid ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <Badge variant={results.urlAnalysis.hasAccessToken ? "default" : "secondary"}>
                          Access Token: {results.urlAnalysis.hasAccessToken ? "✓" : "✗"}
                        </Badge>
                      </div>
                      <div>
                        <Badge variant={results.urlAnalysis.hasRefreshToken ? "default" : "secondary"}>
                          Refresh Token: {results.urlAnalysis.hasRefreshToken ? "✓" : "✗"}
                        </Badge>
                      </div>
                      <div>
                        <Badge variant={results.urlAnalysis.hasTokenHash ? "default" : "secondary"}>
                          Token Hash: {results.urlAnalysis.hasTokenHash ? "✓" : "✗"}
                        </Badge>
                      </div>
                      <div>
                        <Badge variant={results.urlAnalysis.hasToken ? "default" : "secondary"}>
                          Token: {results.urlAnalysis.hasToken ? "✓" : "✗"}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="text-sm space-y-2">
                      <p><strong>Route:</strong> {results.urlAnalysis.pathname} ({results.urlAnalysis.expectedRoute})</p>
                      <p><strong>Type:</strong> {results.urlAnalysis.type || "none"}</p>
                      {results.urlAnalysis.error && (
                        <p><strong>Error:</strong> <span className="text-red-600">{results.urlAnalysis.error}</span></p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-semibold">All Parameters:</h4>
                      <div className="bg-gray-50 p-3 rounded text-xs font-mono max-h-32 overflow-y-auto">
                        {Object.entries(results.urlAnalysis.allParams).length > 0 ? (
                          Object.entries(results.urlAnalysis.allParams).map(([key, value]) => (
                            <div key={key} className="flex items-center gap-2">
                              <span className="font-bold">{key}:</span> 
                              <span className="break-all">{String(value)}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(String(value))}
                                className="p-1 h-auto"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-500">No parameters found</p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-red-600">Invalid URL: {results.urlAnalysis.error}</p>
                )}
              </CardContent>
            </Card>

            {/* Verification Attempt */}
            {results.verificationAttempt && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Verification Test Result</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant={results.verificationAttempt.success ? "default" : "destructive"}>
                        {results.verificationAttempt.success ? "SUCCESS" : "FAILED"}
                      </Badge>
                      <span className="text-sm">Method: {results.verificationAttempt.method}</span>
                    </div>
                    
                    {results.verificationAttempt.error && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded">
                        <p className="text-red-800 text-sm">
                          <strong>Error:</strong> {results.verificationAttempt.error}
                        </p>
                      </div>
                    )}
                    
                    {results.verificationAttempt.hasSession && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded">
                        <p className="text-green-800 text-sm">
                          <strong>Session Created:</strong> {results.verificationAttempt.userEmail || "User logged in"}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>How to use:</strong></p>
          <p>1. Paste a verification URL (from email or browser) into the input above</p>
          <p>2. Click "Test URL" to analyze and test the verification</p>
          <p>3. Check the results to see what's wrong with the URL</p>
          <p>4. If you're seeing "OTP expired" immediately, the URL might be missing parameters or using the wrong format</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AuthVerificationTester;

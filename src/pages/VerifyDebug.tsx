import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { diagnoseVerificationUrl, formatDiagnosticReport, type UrlDiagnostic } from "@/utils/verificationUrlDiagnostics";
import { Copy, TestTube, AlertTriangle, CheckCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";

const VerifyDebug = () => {
  const [searchParams] = useSearchParams();
  const [testUrl, setTestUrl] = useState("");
  const [diagnostic, setDiagnostic] = useState<UrlDiagnostic | null>(null);
  const [autoTested, setAutoTested] = useState(false);

  useEffect(() => {
    // Auto-test current URL if it has parameters
    const currentUrl = window.location.href;
    if (currentUrl.includes('?') || currentUrl.includes('#')) {
      setTestUrl(currentUrl);
      if (!autoTested) {
        testUrl();
        setAutoTested(true);
      }
    }
  }, [autoTested]);

  const analyzeUrl = () => {
    if (!testUrl.trim()) {
      toast.error("Please enter a URL to test");
      return;
    }

    try {
      const result = diagnoseVerificationUrl(testUrl);
      setDiagnostic(result);

      if (result.isValid) {
        toast.success("URL analysis complete - no issues found!");
      } else {
        toast.error(`URL analysis complete - ${result.issues.length} issue(s) found`);
      }
    } catch (error) {
      toast.error("Failed to analyze URL");
      console.error(error);
    }
  };

  const copyReport = () => {
    if (!diagnostic) return;
    
    const report = formatDiagnosticReport(diagnostic);
    navigator.clipboard.writeText(report);
    toast.success("Diagnostic report copied to clipboard");
  };

  const getCurrentUrl = () => {
    setTestUrl(window.location.href);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Email Verification URL Debugger
            </h1>
            <p className="text-gray-600">
              Test and diagnose email verification links to troubleshoot "OTP expired" and other verification issues
            </p>
          </div>

          {/* URL Input Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                Test Verification URL
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
                  Current URL
                </Button>
                <Button
                  onClick={testUrl}
                  disabled={!testUrl.trim()}
                >
                  Analyze
                </Button>
              </div>
              
              <div className="text-sm text-gray-600">
                <p><strong>How to use:</strong> Copy the verification link from your email and paste it above, then click "Analyze"</p>
              </div>
            </CardContent>
          </Card>

          {/* Diagnostic Results */}
          {diagnostic && (
            <div className="space-y-4">
              {/* Overall Status */}
              <Alert className={diagnostic.isValid ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                {diagnostic.isValid ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription className={diagnostic.isValid ? "text-green-800" : "text-red-800"}>
                  {diagnostic.isValid 
                    ? "✅ Verification URL looks valid! Should work for email verification."
                    : `❌ Verification URL has ${diagnostic.issues.length} issue(s) that may prevent verification.`
                  }
                </AlertDescription>
              </Alert>

              {/* Technical Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Technical Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <Badge variant={diagnostic.hasTokens ? "default" : "destructive"}>
                        {diagnostic.hasTokens ? "✓" : "✗"} Tokens
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">Auth tokens present</p>
                    </div>
                    <div className="text-center">
                      <Badge variant={diagnostic.hasType ? "default" : "destructive"}>
                        {diagnostic.hasType ? "✓" : "✗"} Type
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">Verification type</p>
                    </div>
                    <div className="text-center">
                      <Badge variant={diagnostic.hasError ? "destructive" : "default"}>
                        {diagnostic.hasError ? "✗" : "✓"} Error-free
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">No Supabase errors</p>
                    </div>
                    <div className="text-center">
                      <Badge variant={diagnostic.route !== 'unknown' ? "default" : "secondary"}>
                        {diagnostic.route}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">Route detected</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <p><strong>Method:</strong> {diagnostic.method}</p>
                    <p><strong>Type:</strong> {diagnostic.tokens.type || "none"}</p>
                    {diagnostic.tokens.error && (
                      <p><strong>Error:</strong> <span className="text-red-600">{diagnostic.tokens.error}</span></p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Issues Found */}
              {diagnostic.issues.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-red-700">Issues Found</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {diagnostic.issues.map((issue, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{issue}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Recommendations */}
              {diagnostic.recommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-blue-700">Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {diagnostic.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      onClick={copyReport}
                      className="flex items-center gap-2"
                    >
                      <Copy className="h-4 w-4" />
                      Copy Full Report
                    </Button>
                    
                    {!diagnostic.isValid && (
                      <Button
                        onClick={() => window.open("/register", "_blank")}
                        className="flex items-center gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Get New Verification Email
                      </Button>
                    )}
                    
                    {diagnostic.isValid && diagnostic.route === 'callback' && (
                      <Button
                        onClick={() => window.open(testUrl, "_blank")}
                        className="flex items-center gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Test This URL
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Help Section */}
          <Card>
            <CardHeader>
              <CardTitle>Common "OTP Expired" Causes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-red-50 border border-red-200 rounded">
                  <p className="font-semibold text-red-800">❌ Missing tokens in URL</p>
                  <p className="text-red-700">The verification link doesn't contain access_token, refresh_token, or token_hash parameters</p>
                </div>
                
                <div className="p-3 bg-orange-50 border border-orange-200 rounded">
                  <p className="font-semibold text-orange-800">⚠️ Wrong route configuration</p>
                  <p className="text-orange-700">Email templates point to wrong URL or redirect URLs not configured properly in Supabase</p>
                </div>
                
                <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                  <p className="font-semibold text-blue-800">🔄 Browser/client issues</p>
                  <p className="text-blue-700">Email client or browser modifies the URL, stripping important parameters</p>
                </div>

                <div className="p-3 bg-green-50 border border-green-200 rounded">
                  <p className="font-semibold text-green-800">✅ Quick fix</p>
                  <p className="text-green-700">Copy the full verification link from your email instead of clicking it, then paste into browser</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default VerifyDebug;

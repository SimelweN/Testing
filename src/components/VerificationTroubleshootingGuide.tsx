import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Clock, Mail, RefreshCw, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

const VerificationTroubleshootingGuide = () => {
  const navigate = useNavigate();

  const commonIssues = [
    {
      issue: "OTP Expired immediately after clicking",
      cause: "URL parameters missing or malformed",
      solution: "Check if the email link contains proper tokens. The URL should have access_token, refresh_token, and type parameters.",
      action: "Request new verification email",
      severity: "high"
    },
    {
      issue: "Link redirects to wrong page",
      cause: "Old email templates or wrong redirect URL configuration",
      solution: "Ensure Supabase redirect URLs are set to /auth/callback",
      action: "Check Supabase settings",
      severity: "medium"
    },
    {
      issue: "Email already confirmed error",
      cause: "User already verified but trying to verify again",
      solution: "User can log in directly, no need to verify again",
      action: "Go to login page",
      severity: "low"
    },
    {
      issue: "Invalid token/token not found",
      cause: "Token corrupted, expired, or email client modified the URL",
      solution: "Request a fresh verification email",
      action: "Resend verification",
      severity: "high"
    },
    {
      issue: "Browser blocking verification",
      cause: "Ad blockers, security extensions, or browser settings",
      solution: "Try in incognito mode or different browser",
      action: "Try different browser",
      severity: "medium"
    }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high": return "destructive";
      case "medium": return "default";
      case "low": return "secondary";
      default: return "secondary";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "high": return <AlertTriangle className="h-4 w-4" />;
      case "medium": return <Clock className="h-4 w-4" />;
      case "low": return <CheckCircle className="h-4 w-4" />;
      default: return <CheckCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Verification Troubleshooting
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              If you're seeing "OTP expired" immediately after clicking a fresh verification link, 
              this usually means the email link is missing required parameters or your browser is 
              not properly handling the URL.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Quick Fixes to Try First:</h3>
            <div className="grid gap-3">
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <div className="bg-blue-100 rounded-full p-1 mt-1">
                  <span className="text-blue-600 font-bold text-sm">1</span>
                </div>
                <div>
                  <p className="font-semibold">Copy the full verification link</p>
                  <p className="text-sm text-gray-600">Instead of clicking the email link, copy it and paste into your browser address bar</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <div className="bg-green-100 rounded-full p-1 mt-1">
                  <span className="text-green-600 font-bold text-sm">2</span>
                </div>
                <div>
                  <p className="font-semibold">Try incognito/private browsing</p>
                  <p className="text-sm text-gray-600">Browser extensions or cached data might interfere with verification</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                <div className="bg-orange-100 rounded-full p-1 mt-1">
                  <span className="text-orange-600 font-bold text-sm">3</span>
                </div>
                <div>
                  <p className="font-semibold">Request a new verification email</p>
                  <p className="text-sm text-gray-600">The old link might be corrupted or expired</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => navigate("/register")}
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Get New Email
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Common Issues & Solutions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {commonIssues.map((item, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-start gap-3 mb-3">
                  <Badge variant={getSeverityColor(item.severity)} className="flex items-center gap-1">
                    {getSeverityIcon(item.severity)}
                    {item.severity.toUpperCase()}
                  </Badge>
                  <div className="flex-1">
                    <h4 className="font-semibold text-red-700">{item.issue}</h4>
                  </div>
                </div>
                
                <div className="ml-6 space-y-2 text-sm">
                  <p><strong>Cause:</strong> {item.cause}</p>
                  <p><strong>Solution:</strong> {item.solution}</p>
                  <div className="flex items-center gap-2">
                    <strong>Action:</strong> 
                    <span className="text-blue-600">{item.action}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>What a Valid Verification URL Should Look Like</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <h4 className="font-semibold text-green-700">✅ Good URL (Modern Format):</h4>
              <div className="bg-green-50 p-3 rounded font-mono text-xs break-all">
                https://rebookedsolutions.co.za/auth/callback?access_token=eyJ...&refresh_token=ABC...&type=signup
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-blue-700">✅ Good URL (Legacy Format):</h4>
              <div className="bg-blue-50 p-3 rounded font-mono text-xs break-all">
                https://rebookedsolutions.co.za/verify?token_hash=ABC123...&type=signup
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-red-700">❌ Bad URL (Missing Parameters):</h4>
              <div className="bg-red-50 p-3 rounded font-mono text-xs break-all">
                https://rebookedsolutions.co.za/verify
              </div>
            </div>
          </div>

          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              The URL must contain authentication tokens (access_token + refresh_token) OR 
              OTP tokens (token_hash or token) along with a type parameter.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Still Having Issues?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Button 
              onClick={() => navigate("/register")}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Register Again
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => navigate("/login")}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Try Logging In
            </Button>
          </div>
          
          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>If none of the above solutions work:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Check your spam/junk folder for the verification email</li>
              <li>Make sure you're clicking the most recent email link</li>
              <li>Try using a different email client or browser</li>
              <li>Contact support if the problem persists</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerificationTroubleshootingGuide;

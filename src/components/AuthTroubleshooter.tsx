import React from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, RefreshCw, Mail, Key, UserPlus } from 'lucide-react';

interface AuthTroubleshooterProps {
  error: string;
  onRetry?: () => void;
  context: 'login' | 'register';
}

const AuthTroubleshooter: React.FC<AuthTroubleshooterProps> = ({ 
  error, 
  onRetry, 
  context 
}) => {
  const getErrorType = (errorMessage: string) => {
    const msg = errorMessage.toLowerCase();
    
    if (msg.includes('password') || msg.includes('credentials')) return 'credentials';
    if (msg.includes('email') || msg.includes('confirmation') || msg.includes('verify')) return 'email';
    if (msg.includes('already registered') || msg.includes('already exists')) return 'existing';
    if (msg.includes('too many')) return 'rate_limit';
    return 'general';
  };

  const errorType = getErrorType(error);

  const getTroubleshootingSteps = () => {
    switch (errorType) {
      case 'credentials':
        return {
          icon: <Key className="h-5 w-5" />,
          title: "Login Issues",
          steps: [
            "Double-check your email address for typos",
            "Ensure your password is correct (case-sensitive)",
            "Try using 'Forgot Password' if you're unsure",
            "Make sure your account is verified"
          ]
        };
      
      case 'email':
        return {
          icon: <Mail className="h-5 w-5" />,
          title: "Email Verification Issues",
          steps: [
            "Check your inbox and spam/junk folder",
            "Wait 5-10 minutes and try again",
            "Try registering with a different email provider",
            "Contact support if the issue persists"
          ]
        };
      
      case 'existing':
        return {
          icon: <UserPlus className="h-5 w-5" />,
          title: "Account Already Exists",
          steps: [
            "Try logging in instead of registering",
            "Use 'Forgot Password' if you can't remember your password",
            "Check if you signed up with a different email",
            "Contact support if you need account recovery"
          ]
        };
      
      case 'rate_limit':
        return {
          icon: <AlertCircle className="h-5 w-5" />,
          title: "Too Many Attempts",
          steps: [
            "Wait 5-10 minutes before trying again",
            "Clear your browser cache and cookies",
            "Try using a different browser or incognito mode",
            "Contact support if the issue persists"
          ]
        };
      
      default:
        return {
          icon: <AlertCircle className="h-5 w-5" />,
          title: "General Troubleshooting",
          steps: [
            "Check your internet connection",
            "Try refreshing the page",
            "Clear browser cache and cookies",
            "Try using a different browser"
          ]
        };
    }
  };

  const troubleshooting = getTroubleshootingSteps();

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {troubleshooting.icon}
          {troubleshooting.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Error:</strong> {error}
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <h4 className="font-medium text-sm">Try these steps:</h4>
          <ol className="text-sm space-y-2">
            {troubleshooting.steps.map((step, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="font-medium text-muted-foreground min-w-[20px]">
                  {index + 1}.
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {onRetry && (
          <div className="mt-4 flex gap-2">
            <Button 
              onClick={onRetry} 
              variant="outline" 
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          </div>
        )}

        <div className="mt-4 pt-3 border-t text-xs text-muted-foreground">
          <p>
            Still having trouble? Email us at{" "}
            <a 
              href="mailto:support@rebookedsolutions.co.za" 
              className="text-primary hover:underline"
            >
              support@rebookedsolutions.co.za
            </a>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AuthTroubleshooter;

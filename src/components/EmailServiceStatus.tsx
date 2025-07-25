import React from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Mail, RefreshCw } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface EmailServiceStatusProps {
  onRetry?: () => void;
  showRetry?: boolean;
}

const EmailServiceStatus: React.FC<EmailServiceStatusProps> = ({ 
  onRetry, 
  showRetry = true 
}) => {
  return (
    <div className="space-y-4">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-3">
            <div>
              <h4 className="font-medium text-sm mb-2">Email Service Temporarily Unavailable</h4>
              <p className="text-sm text-muted-foreground">
                We're experiencing temporary issues with our email confirmation service. 
                This is typically due to email provider maintenance or high volume.
              </p>
            </div>
            
            <div className="space-y-2">
              <h5 className="font-medium text-sm flex items-center gap-2">
                <Mail className="h-4 w-4" />
                What you can do:
              </h5>
              <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                <li>• Wait 5-10 minutes and try registering again</li>
                <li>• Check if you have an existing account and try logging in</li>
                <li>• Contact support if the issue persists</li>
                <li>• Try using a different email address if needed</li>
              </ul>
            </div>

            {showRetry && onRetry && (
              <div className="pt-2">
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
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default EmailServiceStatus;

import React from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, Mail, CheckCircle } from 'lucide-react';

const RegistrationStatusBanner: React.FC = () => {
  const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost';
  
  return (
    <Alert className="mb-6">
      <Info className="h-4 w-4" />
      <AlertDescription>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="font-medium">Registration Available</span>
          </div>
          
          {isDevelopment ? (
            <p className="text-sm text-muted-foreground">
              <strong>Development Mode:</strong> Email confirmation is disabled for faster testing. 
              Accounts are created immediately without email verification.
            </p>
          ) : (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Due to temporary email service issues, some accounts may be created without 
                email confirmation. You'll still be able to use your account normally.
              </p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Mail className="h-3 w-3" />
                <span>Email services will be restored soon. Thank you for your patience.</span>
              </div>
            </div>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default RegistrationStatusBanner;

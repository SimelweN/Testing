import { AlertTriangle, RefreshCw, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";

interface EnvironmentErrorProps {
  missingVariables?: string[];
  error?: string;
}

export default function EnvironmentError({
  missingVariables = [],
  error,
}: EnvironmentErrorProps) {
  const navigate = useNavigate();

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleHome = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-xl text-gray-900">
            Configuration Error
          </CardTitle>
          <CardDescription className="text-gray-600">
            The application needs to be properly configured before it can run.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {missingVariables.length > 0 && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3">
              <h4 className="text-sm font-medium text-red-800 mb-2">
                Missing Environment Variables:
              </h4>
              <ul className="text-sm text-red-700 space-y-1">
                {missingVariables.map((variable) => (
                  <li key={variable} className="font-mono">
                    • {variable}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3">
              <h4 className="text-sm font-medium text-red-800 mb-2">
                Error Details:
              </h4>
              <p className="text-sm text-red-700 font-mono">{error}</p>
            </div>
          )}

          <div className="rounded-md bg-blue-50 border border-blue-200 p-3">
            <h4 className="text-sm font-medium text-blue-800 mb-2">
              <Settings className="inline h-4 w-4 mr-1" />
              How to Fix:
            </h4>
            <div className="text-sm text-blue-700 space-y-2">
              <p>
                <strong>For Vercel:</strong>
              </p>
              <ul className="ml-4 space-y-1 list-disc">
                <li>Go to your project dashboard</li>
                <li>Navigate to Settings → Environment Variables</li>
                <li>Add the missing variables</li>
                <li>Redeploy your application</li>
              </ul>

              <p className="mt-3">
                <strong>For Netlify:</strong>
              </p>
              <ul className="ml-4 space-y-1 list-disc">
                <li>Go to your site dashboard</li>
                <li>Navigate to Site settings → Environment variables</li>
                <li>Add the missing variables</li>
                <li>Redeploy your application</li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              onClick={handleRefresh}
              variant="outline"
              className="flex-1"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
            <Button onClick={handleHome} className="flex-1">
              Go Home
            </Button>
          </div>

          <div className="text-center pt-4 border-t">
            <p className="text-xs text-gray-500">
              ReBooked Solutions
              <br />
              Need help? Contact: support@rebookedsolutions.co.za
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

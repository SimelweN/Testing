import React, { Component, ReactNode } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class AuthErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Use proper error serialization to prevent [object Object] logging
    console.error("[AUTH ERROR BOUNDARY] Error:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
      type: error.constructor.name,
    });

    console.error("[AUTH ERROR BOUNDARY] Error Info:", {
      componentStack: errorInfo.componentStack,
      errorBoundary: "AuthErrorBoundary",
      timestamp: new Date().toISOString(),
    });

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
          <div className="max-w-md w-full">
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <div className="ml-3">
                <h3 className="text-lg font-semibold text-red-800 mb-2">
                  Authentication System Error
                </h3>
                <AlertDescription className="text-red-700 mb-4">
                  There was an error initializing the authentication system.
                  This might be due to a temporary issue.
                </AlertDescription>

                {process.env.NODE_ENV === "development" && this.state.error && (
                  <div className="mb-4 p-3 bg-red-100 border border-red-200 rounded text-sm">
                    <div className="font-medium text-red-800 mb-1">
                      Error Details:
                    </div>
                    <div className="text-red-700 font-mono text-xs">
                      {this.state.error.message}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Button
                    onClick={this.handleReload}
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reload Page
                  </Button>
                  <Button
                    onClick={this.handleReset}
                    variant="outline"
                    className="w-full"
                  >
                    Try Again
                  </Button>
                </div>

                <div className="mt-4 text-xs text-red-600">
                  If this problem persists, please contact support or try
                  clearing your browser cache.
                </div>
              </div>
            </Alert>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AuthErrorBoundary;

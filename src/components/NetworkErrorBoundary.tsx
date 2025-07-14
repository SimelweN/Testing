import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasNetworkError: boolean;
  isOnline: boolean;
  retryCount: number;
}

class NetworkErrorBoundary extends Component<Props, State> {
  private retryTimer?: NodeJS.Timeout;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasNetworkError: false,
      isOnline: navigator.onLine,
      retryCount: 0,
    };
  }

  componentDidMount() {
    // Listen for network status changes
    window.addEventListener("online", this.handleOnline);
    window.addEventListener("offline", this.handleOffline);

    // Listen for unhandled network errors
    window.addEventListener(
      "unhandledrejection",
      this.handleUnhandledRejection,
    );
  }

  componentWillUnmount() {
    window.removeEventListener("online", this.handleOnline);
    window.removeEventListener("offline", this.handleOffline);
    window.removeEventListener(
      "unhandledrejection",
      this.handleUnhandledRejection,
    );

    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }
  }

  private handleOnline = () => {
    this.setState({ isOnline: true, hasNetworkError: false });
  };

  private handleOffline = () => {
    this.setState({ isOnline: false });
  };

  private handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    const message = event.reason?.message || "";

    // Check if it's a network-related error
    const isNetworkError =
      message.includes("Failed to fetch") ||
      message.includes("NetworkError") ||
      message.includes("ERR_NETWORK") ||
      message.includes("ERR_INTERNET_DISCONNECTED");

    if (isNetworkError && this.state.retryCount < 3) {
      this.setState({ hasNetworkError: true });

      // Auto-retry after a delay
      this.retryTimer = setTimeout(() => {
        this.handleRetry();
      }, 5000);
    }
  };

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Check if the error is network-related
    const isNetworkError =
      error.message.includes("Failed to fetch") ||
      error.message.includes("NetworkError") ||
      error.message.includes("fetch");

    if (isNetworkError) {
      return { hasNetworkError: true };
    }

    return {};
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Only log non-network errors to avoid spam
    if (
      !error.message.includes("Failed to fetch") &&
      !error.message.includes("fullstory")
    ) {
      console.error("NetworkErrorBoundary caught an error:", error, errorInfo);
    }
  }

  private handleRetry = () => {
    this.setState((prevState) => ({
      hasNetworkError: false,
      retryCount: prevState.retryCount + 1,
    }));

    // Force a re-render of children
    this.forceUpdate();
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    const { hasNetworkError, isOnline } = this.state;

    // Show network status alert if offline
    if (!isOnline) {
      return (
        <div className="min-h-screen flex flex-col">
          <Alert className="border-orange-200 bg-orange-50 m-4">
            <WifiOff className="h-4 w-4" />
            <AlertDescription className="text-orange-800">
              <strong>No internet connection.</strong> Please check your network
              connection and try again.
            </AlertDescription>
          </Alert>
          {this.props.children}
        </div>
      );
    }

    // Show network error message if there are network issues
    if (hasNetworkError) {
      return (
        <div className="min-h-screen flex flex-col">
          <Alert className="border-yellow-200 bg-yellow-50 m-4">
            <Wifi className="h-4 w-4" />
            <AlertDescription className="text-yellow-800 flex items-center justify-between">
              <span>
                <strong>Connection issues detected.</strong> Some features may
                not work properly. We're automatically retrying...
              </span>
              <div className="flex gap-2 ml-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={this.handleRetry}
                  className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={this.handleReload}
                  className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                >
                  Reload
                </Button>
              </div>
            </AlertDescription>
          </Alert>
          {this.props.children}
        </div>
      );
    }

    return this.props.children;
  }
}

export default NetworkErrorBoundary;

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Package,
  Info,
  MapPin,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { checkShipmentEligibility } from "@/services/automaticShipmentService";
import CourierGuyTracker from "./CourierGuyTracker";
import { useNavigate } from "react-router-dom";

const CourierGuyTrackingOnly = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [eligibility, setEligibility] = useState<{
    canSell: boolean;
    canBuy: boolean;
    errors: string[];
  }>({ canSell: false, canBuy: false, errors: [] });
  const [isLoading, setIsLoading] = useState(false);

  const loadEligibilityData = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const userEligibility = await checkShipmentEligibility(user.id);
      setEligibility(
        userEligibility || {
          canSell: false,
          canBuy: false,
          errors: ["Error loading eligibility"],
        },
      );
    } catch (error) {
      console.error("Error loading eligibility data:", error);
      setEligibility({
        canSell: false,
        canBuy: false,
        errors: ["Error loading user information"],
      });
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      loadEligibilityData();
    } else {
      setEligibility({ canSell: false, canBuy: false, errors: [] });
    }
  }, [user?.id, loadEligibilityData]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-sm text-gray-600">
                Loading shipping information...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* Information Alert */}
      <Alert className="mx-2 sm:mx-0">
        <Info className="h-4 w-4" />
        <AlertDescription className="text-sm">
          <strong>Automatic Shipping:</strong> Shipments are automatically
          created when you buy or sell books using your saved addresses.
        </AlertDescription>
      </Alert>

      {/* User Eligibility Status */}
      {user && (
        <Card className="mx-2 sm:mx-0">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <MapPin className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              Your Shipping Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="flex items-center space-x-2">
                <Badge
                  className={
                    eligibility.canSell
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }
                >
                  {eligibility.canSell ? (
                    <CheckCircle className="h-3 w-3 mr-1" />
                  ) : (
                    <AlertTriangle className="h-3 w-3 mr-1" />
                  )}
                  {eligibility.canSell ? "Can Sell Books" : "Cannot Sell Books"}
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                <Badge
                  className={
                    eligibility.canBuy
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }
                >
                  {eligibility.canBuy ? (
                    <CheckCircle className="h-3 w-3 mr-1" />
                  ) : (
                    <AlertTriangle className="h-3 w-3 mr-1" />
                  )}
                  {eligibility.canBuy ? "Can Buy Books" : "Cannot Buy Books"}
                </Badge>
              </div>
            </div>

            {eligibility.errors.length > 0 && (
              <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm font-medium text-red-600 mb-2">
                  Address Requirements:
                </p>
                <ul className="list-disc list-inside text-xs sm:text-sm text-red-600 space-y-1 mb-3">
                  {eligibility.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                  onClick={() => navigate("/profile")}
                >
                  Update Addresses in Profile
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* User's Shipments */}
      {user && (
        <Card className="mx-2 sm:mx-0">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <Package className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              Your Shipments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6 sm:py-8">
              <Package className="h-8 w-8 sm:h-12 sm:w-12 text-gray-300 mx-auto mb-3 sm:mb-4" />
              <p className="text-gray-600 mb-2 text-sm sm:text-base">
                Shipment history will appear here
              </p>
              <p className="text-xs sm:text-sm text-gray-500 px-4">
                When you buy or sell books, tracking information will be
                displayed here.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Information Card */}
      <Card className="mx-2 sm:mx-0">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-lg">
            <Info className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            How Shipping Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-gray-600 text-sm sm:text-base">
              Shipments are automatically created when books are purchased:
            </p>
            <ul className="space-y-2 text-xs sm:text-sm text-gray-600">
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                <span>
                  <strong>Automatic Setup:</strong> Uses saved seller and buyer
                  addresses
                </span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                <span>
                  <strong>Package Details:</strong> Includes book information
                  and pricing
                </span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                <span>
                  <strong>Tracking:</strong> Both parties receive tracking
                  numbers via email
                </span>
              </li>
            </ul>

            <Alert className="mt-4">
              <Package className="h-4 w-4" />
              <AlertDescription className="text-xs sm:text-sm">
                <strong>Note:</strong> Shipments are only created automatically
                during book purchases. Manual creation is not available.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      {/* Tracking Section */}
      <div id="courier-guy-tracker">
        <CourierGuyTracker />
      </div>
    </div>
  );
};

export default CourierGuyTrackingOnly;

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, DollarSign } from "lucide-react";

export const TransferTester: React.FC = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Transfer Testing
          </CardTitle>
          <CardDescription>
            Transfer testing functionality has been disabled
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Transfer Testing Disabled:</strong> All automated transfer testing through Paystack 
              has been permanently disabled. No money will be sent through API calls. All payments are handled 
              manually by administrators.
            </AlertDescription>
          </Alert>
          
          <div className="mt-6 p-6 bg-gray-50 rounded-lg text-center">
            <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">Manual Payment System</h3>
            <p className="text-gray-500">
              Transfer testing and automated payments have been removed for security.
              <br />
              All payments are processed manually by administrators.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

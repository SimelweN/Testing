import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, DollarSign } from "lucide-react";

export const PaystackTransferTester: React.FC = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Paystack Transfer Testing
          </CardTitle>
          <CardDescription>
            Automated transfer functionality has been disabled
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="border-blue-200 bg-blue-50">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Transfers Disabled:</strong> All automated money transfers through Paystack have been disabled. 
              No money will be sent through API calls. All seller payments are handled manually by administrators.
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

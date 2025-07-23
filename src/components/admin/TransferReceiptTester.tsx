import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Receipt } from "lucide-react";

export const TransferReceiptTester: React.FC = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Transfer Receipt Generator
          </CardTitle>
          <CardDescription>
            Automated receipt generation has been disabled
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="border-blue-200 bg-blue-50">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Receipt Generation Disabled:</strong> Automated transfer receipt generation and Paystack recipient 
              creation have been disabled. All seller payments are handled manually by administrators.
            </AlertDescription>
          </Alert>
          
          <div className="mt-6 p-6 bg-gray-50 rounded-lg text-center">
            <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">Manual Receipt System</h3>
            <p className="text-gray-500">
              Automated receipt generation for seller payments has been removed.
              <br />
              All payment records are maintained manually by administrators.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

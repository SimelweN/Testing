import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, DollarSign } from "lucide-react";

export const SellerPayoutManager: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <DollarSign className="w-6 h-6 text-book-600" />
        <div>
          <h2 className="text-2xl font-bold">Seller Payments</h2>
          <p className="text-gray-600">All seller payments are processed manually</p>
        </div>
      </div>

      <Alert className="border-blue-200 bg-blue-50">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Manual Payment Process:</strong> All seller payments are handled manually outside of this system. 
          No automated transfers or API-based payments are processed. Please handle seller payments through your preferred 
          banking or payment system.
        </AlertDescription>
      </Alert>

      <Card>
        <CardContent className="py-12 text-center">
          <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Manual Payment System</h3>
          <p className="text-gray-500">
            Automated seller payment functionality has been disabled.
            <br />
            All payments are processed manually by administrators.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

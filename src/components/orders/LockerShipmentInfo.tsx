import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

interface LockerShipmentInfoProps {
  trackingNumber?: string;
  qrCodeUrl?: string;
  waybillUrl?: string;
  lockerName?: string;
  lockerAddress?: string;
  operatingHours?: string;
  dropOffDeadline?: string;
  estimatedPaymentDate?: string;
  className?: string;
}

const LockerShipmentInfo: React.FC<LockerShipmentInfoProps> = ({
  className = "",
}) => {
  // DISABLED - Locker functionality has been removed
  return (
    <Card className={`border-yellow-200 bg-yellow-50 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-yellow-800">
          <AlertTriangle className="w-5 h-5" />
          Locker Functionality Disabled
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          <p className="text-yellow-700 text-sm">
            Locker drop-off functionality has been disabled system-wide. All deliveries now use standard home pickup service.
          </p>
          
          <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3">
            <p className="text-sm text-yellow-800 font-medium">
              What this means:
            </p>
            <ul className="text-sm text-yellow-700 mt-1 space-y-1 ml-4">
              <li>• All orders will use courier home pickup</li>
              <li>• No locker drop-off options available</li>
              <li>• Standard payment processing timelines apply</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LockerShipmentInfo;

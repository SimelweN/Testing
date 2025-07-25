import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  QrCode, 
  MapPin, 
  Clock, 
  Download, 
  Package, 
  ExternalLink,
  CheckCircle,
  DollarSign
} from "lucide-react";

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
  trackingNumber,
  qrCodeUrl,
  waybillUrl,
  lockerName,
  lockerAddress,
  operatingHours,
  dropOffDeadline,
  estimatedPaymentDate,
  className = "",
}) => {
  const handleDownloadWaybill = () => {
    if (waybillUrl) {
      window.open(waybillUrl, '_blank');
    }
  };

  const handleViewQRCode = () => {
    if (qrCodeUrl) {
      window.open(qrCodeUrl, '_blank');
    }
  };

  return (
    <Card className={`border-green-200 bg-green-50 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-green-800">
          <Package className="w-5 h-5" />
          Locker Drop-Off Instructions
          <Badge className="bg-green-600 text-white">
            Ready for Drop-Off
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Payment Incentive */}
        <div className="bg-green-100 border border-green-300 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-green-700" />
            <span className="font-semibold text-green-800">Early Payment Benefit</span>
          </div>
          <p className="text-sm text-green-700">
            🎉 You'll be paid 3 days earlier! 
            {estimatedPaymentDate && (
              <span className="font-medium">
                {" "}Expected payment: {new Date(estimatedPaymentDate).toLocaleDateString()}
              </span>
            )}
          </p>
        </div>

        {/* Tracking Information */}
        {trackingNumber && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-green-700">Tracking Number</Label>
              <div className="flex items-center gap-2 mt-1">
                <code className="bg-white px-2 py-1 rounded border text-sm font-mono">
                  {trackingNumber}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigator.clipboard.writeText(trackingNumber)}
                >
                  Copy
                </Button>
              </div>
            </div>
            
            {dropOffDeadline && (
              <div>
                <Label className="text-sm font-medium text-green-700">Drop-Off Deadline</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-700">
                    {new Date(dropOffDeadline).toLocaleDateString()} at 6:00 PM
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* QR Code and Waybill */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {qrCodeUrl && (
            <div className="text-center">
              <div className="bg-white p-4 rounded-lg border inline-block">
                <img 
                  src={qrCodeUrl} 
                  alt="Drop-off QR Code"
                  className="w-32 h-32 mx-auto"
                />
              </div>
              <div className="mt-2">
                <Button
                  size="sm"
                  onClick={handleViewQRCode}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  View QR Code
                </Button>
              </div>
            </div>
          )}

          {waybillUrl && (
            <div className="text-center">
              <div className="bg-white p-6 rounded-lg border">
                <Package className="w-16 h-16 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">Waybill Document</p>
              </div>
              <div className="mt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDownloadWaybill}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Waybill
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Locker Information */}
        {lockerName && (
          <div className="bg-white border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-gray-900">Drop-Off Location</span>
            </div>
            <div className="space-y-1">
              <p className="font-medium text-gray-800">{lockerName}</p>
              {lockerAddress && (
                <p className="text-sm text-gray-600">{lockerAddress}</p>
              )}
              {operatingHours && (
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <span className="text-sm text-gray-600">Hours: {operatingHours}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step-by-step Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Drop-Off Steps
          </h4>
          <ol className="text-sm text-blue-700 space-y-2">
            <li className="flex items-start gap-2">
              <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">1</span>
              <span>Visit the locker location during operating hours</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">2</span>
              <span>Scan the QR code at the locker terminal</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">3</span>
              <span>Place your securely packaged item in the opened locker</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">4</span>
              <span>Close the locker door and confirm completion</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-green-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">✓</span>
              <span className="font-medium">Done! Tracking will update automatically</span>
            </li>
          </ol>
        </div>

        {/* Support */}
        <div className="text-center pt-2 border-t border-green-200">
          <p className="text-xs text-green-600 mb-2">
            Need help? Contact our support team or visit the locker location for assistance.
          </p>
          <Button
            size="sm"
            variant="ghost"
            className="text-green-700 hover:text-green-800"
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            Get Help
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Helper component for Label (if not imported from ui)
const Label: React.FC<{ className?: string; children: React.ReactNode }> = ({ 
  className = "", 
  children 
}) => (
  <label className={`block text-sm font-medium ${className}`}>
    {children}
  </label>
);

export default LockerShipmentInfo;

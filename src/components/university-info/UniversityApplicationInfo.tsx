import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  ExternalLink,
  Clock,
  DollarSign,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { ApplicationInfo } from "@/types/university";

interface UniversityApplicationInfoProps {
  applicationInfo?: ApplicationInfo;
  universityName: string;
  universityAbbreviation?: string;
  website?: string;
}

const UniversityApplicationInfo = ({
  applicationInfo,
  universityName,
  universityAbbreviation,
  website,
}: UniversityApplicationInfoProps) => {
  // If applicationInfo is not provided, return a default message
  if (!applicationInfo) {
    return (
      <Card className="border-2">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-lg">
            <span className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Application Information
            </span>
            <Badge className="bg-gray-100 text-gray-800 border-gray-200 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              Information Unavailable
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-sm font-medium text-gray-600">
              Application information for {universityName} will be available
              soon.
            </p>
          </div>

          {website && (
            <div className="pt-2">
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base"
                onClick={() => window.open(website, "_blank")}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">
                  Visit {universityName} Website
                </span>
                <span className="sm:hidden">
                  Visit {universityAbbreviation || universityName}
                </span>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  const isApplicationOpen = applicationInfo.isOpen ?? false;
  const currentDate = new Date();

  // Safely handle date parsing
  let openingDate: Date;
  let closingDate: Date;

  try {
    openingDate = new Date(applicationInfo.openingDate + ", 2024");
    closingDate = new Date(applicationInfo.closingDate + ", 2024");

    // Check if dates are valid
    if (isNaN(openingDate.getTime())) {
      openingDate = new Date(); // fallback to current date
    }
    if (isNaN(closingDate.getTime())) {
      closingDate = new Date(); // fallback to current date
    }
  } catch (error) {
    console.error("Error parsing application dates:", error);
    openingDate = new Date();
    closingDate = new Date();
  }

  const isBeforeOpening = currentDate < openingDate;
  const isAfterClosing = currentDate > closingDate;
  const isCurrentlyOpen =
    !isBeforeOpening && !isAfterClosing && isApplicationOpen;

  const getStatusInfo = () => {
    if (isBeforeOpening) {
      return {
        status: "Opening Soon",
        color: "bg-blue-100 text-blue-800 border-blue-200",
        icon: <Clock className="h-4 w-4" />,
        message: `Applications open on ${applicationInfo.openingDate || "TBD"}`,
      };
    } else if (isCurrentlyOpen) {
      return {
        status: "Open Now",
        color: "bg-green-100 text-green-800 border-green-200",
        icon: <CheckCircle className="h-4 w-4" />,
        message: `Applications close on ${applicationInfo.closingDate || "TBD"}`,
      };
    } else {
      return {
        status: "Closed",
        color: "bg-red-100 text-red-800 border-red-200",
        icon: <AlertCircle className="h-4 w-4" />,
        message: applicationInfo.lateApplications?.available
          ? `Late applications until ${applicationInfo.lateApplications.deadline}`
          : "Applications are closed for this year",
      };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <Card className="border-2">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <span className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Application Information
          </span>
          <Badge className={`${statusInfo.color} flex items-center gap-1`}>
            {statusInfo.icon}
            {statusInfo.status}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Message */}
        <div
          className={`p-3 rounded-lg ${statusInfo.color.replace("text-", "bg-").replace("border-", "border-")} border`}
        >
          <p className="text-sm font-medium">{statusInfo.message}</p>
        </div>

        {/* Application Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-gray-700">
              Application Period
            </h4>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-3 w-3 text-green-600" />
                <span className="text-gray-600">Opens:</span>
                <span className="font-medium">
                  {applicationInfo.openingDate || "TBD"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-3 w-3 text-red-600" />
                <span className="text-gray-600">Closes:</span>
                <span className="font-medium">
                  {applicationInfo.closingDate || "TBD"}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-gray-700">
              Application Details
            </h4>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="h-3 w-3 text-blue-600" />
                <span className="text-gray-600">Fee:</span>
                <span className="font-medium">
                  {applicationInfo.applicationFee || "TBC"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <ExternalLink className="h-3 w-3 text-purple-600" />
                <span className="text-gray-600">Method:</span>
                <span className="font-medium text-xs">
                  {applicationInfo.applicationMethod}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Late Applications Info */}
        {applicationInfo.lateApplications?.available && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-semibold text-sm text-yellow-800 mb-1">
              Late Applications
            </h4>
            <div className="text-xs text-yellow-700 space-y-1">
              <p>
                Available until:{" "}
                <strong>{applicationInfo.lateApplications.deadline}</strong>
              </p>
              <p>
                Additional fee:{" "}
                <strong>
                  {applicationInfo.lateApplications.additionalFee}
                </strong>
              </p>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2">
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base"
            onClick={() => window.open(website, "_blank")}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Apply at {universityName}</span>
            <span className="sm:hidden">
              Apply at {universityAbbreviation || universityName}
            </span>
          </Button>
        </div>

        {/* Academic Year Info */}
        <div className="text-center pt-2 border-t">
          <p className="text-xs text-gray-500">
            Applications for{" "}
            <strong>{applicationInfo.academicYear || "Current"}</strong>{" "}
            academic year
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default UniversityApplicationInfo;

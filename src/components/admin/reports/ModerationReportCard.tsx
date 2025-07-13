import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Flag, UserX, Copy, Loader2 } from "lucide-react";
import ReportActions from "./ReportActions";

interface Report {
  id: string;
  book_title: string;
  seller_name: string;
  reason: string;
  status: "pending" | "resolved" | "dismissed";
  created_at: string;
  reporter_user_id: string;
  reported_user_id: string;
  book_id?: string;
  reporter_email?: string;
  reporter_name?: string;
}

interface SuspendedUser {
  id: string;
  name: string;
  email: string;
  status: string;
  suspended_at: string;
  suspension_reason: string;
}

interface ModerationReportCardProps {
  data: Report | SuspendedUser;
  isReport: boolean;
  onUpdateStatus: (reportId: string, status: "resolved" | "dismissed") => void;
  onUserAction: (
    userId: string,
    action: "ban" | "suspend",
    reason: string,
  ) => void;
  onUnsuspendUser: (userId: string) => void;
  onCopyEmail: (email: string) => void;
  isLoading?: boolean;
}

const getSeverityColor = (reportCount: number) => {
  if (reportCount >= 5) return "bg-red-100 text-red-800";
  if (reportCount >= 3) return "bg-orange-100 text-orange-800";
  if (reportCount >= 2) return "bg-yellow-100 text-yellow-800";
  return "bg-blue-100 text-blue-800";
};

const getSeverityText = (reportCount: number) => {
  if (reportCount >= 5) return "High Risk";
  if (reportCount >= 3) return "Moderate Risk";
  if (reportCount >= 2) return "Low Risk";
  return "Single Report";
};

export const ModerationReportCard = ({
  data,
  isReport,
  onUpdateStatus,
  onUserAction,
  onUnsuspendUser,
  onCopyEmail,
  isLoading = false,
}: ModerationReportCardProps) => {
  if (!data) {
    return (
      <Card className="border border-gray-200 shadow-sm">
        <CardContent className="p-4">
          <div className="text-center text-gray-500">No data available</div>
        </CardContent>
      </Card>
    );
  }

  if (!isReport) {
    // Suspended user view
    const user = data as SuspendedUser;

    const handleCopyEmail = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onCopyEmail(user.email);
    };

    const handleUnsuspend = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onUnsuspendUser(user.id);
    };

    return (
      <Card className="border border-gray-200 shadow-sm">
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate">
                  {user.name}
                </div>
                <div className="text-sm text-gray-600 truncate">
                  {user.email}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCopyEmail}
                  className="h-8 w-8 p-0"
                  title="Copy Email Address"
                  disabled={isLoading}
                >
                  <Copy className="h-3 w-3" />
                </Button>
                <Badge
                  className={
                    user.status === "banned"
                      ? "bg-red-100 text-red-800"
                      : "bg-orange-100 text-orange-800"
                  }
                >
                  {user.status === "banned" ? "Banned" : "Suspended"}
                </Badge>
              </div>
            </div>

            {/* Reason */}
            <div>
              <div className="text-sm font-medium text-gray-700 mb-1">
                Reason:
              </div>
              <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                {user.suspension_reason || "No reason provided"}
              </div>
            </div>

            {/* Date */}
            <div className="text-sm text-gray-500">
              Suspended: {new Date(user.suspended_at).toLocaleDateString()}
            </div>

            {/* Action Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleUnsuspend}
              disabled={isLoading}
              className="w-full text-green-600 hover:text-green-700 hover:bg-green-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Unsuspending...
                </>
              ) : (
                "Unsuspend User"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  } else {
    // Report view
    const report = data as Report;

    // Safely calculate report count - for now just show as single report
    // This would need to be passed as a prop if we want accurate counts
    const reportCount = 1;

    const handleCopyReporterEmail = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (report.reporter_email) {
        onCopyEmail(report.reporter_email);
      }
    };

    return (
      <Card className="border border-gray-200 shadow-sm">
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                {report.book_id ? (
                  <div className="flex items-center gap-2 text-blue-600">
                    <Flag className="h-4 w-4 flex-shrink-0" />
                    <span className="font-medium text-sm">Listing Report</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-purple-600">
                    <UserX className="h-4 w-4 flex-shrink-0" />
                    <span className="font-medium text-sm">User Report</span>
                  </div>
                )}
              </div>
              <Badge className={getSeverityColor(reportCount)}>
                {getSeverityText(reportCount)}
              </Badge>
            </div>

            {/* Subject */}
            <div>
              <div className="font-medium text-gray-900 mb-1">
                {report.book_id ? report.book_title : report.seller_name}
              </div>
            </div>

            {/* Reporter Info */}
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="text-sm text-gray-500">
                  Reporter:{" "}
                  {report.reporter_name ||
                    `User #${report.reporter_user_id?.slice(-8) || "Unknown"}`}
                </div>
                {report.reporter_email && (
                  <div className="text-xs text-gray-400 truncate">
                    {report.reporter_email}
                  </div>
                )}
              </div>
              {report.reporter_email && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCopyReporterEmail}
                  className="h-6 w-6 p-0 flex-shrink-0"
                  title="Copy Reporter Email"
                  disabled={isLoading}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              )}
            </div>

            {/* Reason */}
            <div>
              <div className="text-sm font-medium text-gray-700 mb-1">
                Reason:
              </div>
              <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded break-words">
                {report.reason || "No reason provided"}
              </div>
            </div>

            {/* Date */}
            <div className="text-sm text-gray-500">
              {new Date(report.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>

            {/* Status */}
            <div className="flex items-center gap-2">
              <div className="text-sm text-gray-500">Status:</div>
              <Badge
                variant={
                  report.status === "pending"
                    ? "destructive"
                    : report.status === "resolved"
                      ? "default"
                      : "secondary"
                }
                className="capitalize"
              >
                {report.status}
              </Badge>
            </div>

            {/* Actions - Only show for pending reports */}
            {report.status === "pending" && (
              <div className="pt-2 border-t border-gray-100 space-y-2">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onUpdateStatus(report.id, "resolved")}
                    disabled={isLoading}
                    className="flex-1 text-green-600 hover:text-green-700 hover:bg-green-50"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    Resolve
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onUpdateStatus(report.id, "dismissed")}
                    disabled={isLoading}
                    className="flex-1 text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    Dismiss
                  </Button>
                </div>

                {/* User action buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      onUserAction(
                        report.reported_user_id,
                        "suspend",
                        "Multiple reports",
                      )
                    }
                    disabled={isLoading}
                    className="flex-1 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    Suspend User
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      onUserAction(
                        report.reported_user_id,
                        "ban",
                        "Severe violation",
                      )
                    }
                    disabled={isLoading}
                    className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    Ban User
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
};

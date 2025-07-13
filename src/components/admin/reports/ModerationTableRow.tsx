import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Flag, UserX, Copy, Loader2 } from "lucide-react";

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

interface ModerationTableRowProps {
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

export const ModerationTableRow = ({
  data,
  isReport,
  onUpdateStatus,
  onUserAction,
  onUnsuspendUser,
  onCopyEmail,
  isLoading = false,
}: ModerationTableRowProps) => {
  if (!data) {
    return (
      <TableRow>
        <TableCell colSpan={6} className="text-center text-gray-500">
          No data available
        </TableCell>
      </TableRow>
    );
  }

  if (!isReport) {
    // Suspended user row
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
      <TableRow>
        <TableCell className="font-medium">{user.name}</TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <span className="truncate">{user.email}</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCopyEmail}
              className="h-6 w-6 p-0"
              title="Copy Email"
              disabled={isLoading}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </TableCell>
        <TableCell>
          <Badge
            className={
              user.status === "banned"
                ? "bg-red-100 text-red-800"
                : "bg-orange-100 text-orange-800"
            }
          >
            {user.status === "banned" ? "Banned" : "Suspended"}
          </Badge>
        </TableCell>
        <TableCell>
          {new Date(user.suspended_at).toLocaleDateString()}
        </TableCell>
        <TableCell>
          <div className="max-w-xs truncate">
            {user.suspension_reason || "No reason provided"}
          </div>
        </TableCell>
        <TableCell>
          <Button
            variant="outline"
            size="sm"
            onClick={handleUnsuspend}
            disabled={isLoading}
            className="text-green-600 hover:text-green-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Unsuspending...
              </>
            ) : (
              "Unsuspend"
            )}
          </Button>
        </TableCell>
      </TableRow>
    );
  } else {
    // Report row
    const report = data as Report;
    const reportCount = 1; // Simplified for now

    const handleCopyReporterEmail = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (report.reporter_email) {
        onCopyEmail(report.reporter_email);
      }
    };

    return (
      <TableRow>
        <TableCell>
          <div className="flex items-center gap-2">
            {report.book_id ? (
              <>
                <Flag className="h-4 w-4 text-blue-600" />
                <span className="font-medium">
                  {report.book_title || "Unknown Book"}
                </span>
              </>
            ) : (
              <>
                <UserX className="h-4 w-4 text-purple-600" />
                <span className="font-medium">
                  {report.seller_name || "Unknown User"}
                </span>
              </>
            )}
          </div>
        </TableCell>
        <TableCell>
          <div className="space-y-1">
            <div className="font-medium">
              {report.seller_name || "Unknown Seller"}
            </div>
            <div className="text-sm text-gray-500">
              Reporter:{" "}
              {report.reporter_name ||
                `User #${report.reporter_user_id?.slice(-8) || "Unknown"}`}
              {report.reporter_email && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCopyReporterEmail}
                  className="h-4 w-4 p-0 ml-1"
                  title="Copy Reporter Email"
                  disabled={isLoading}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </TableCell>
        <TableCell>
          <div className="max-w-xs">
            <div className="truncate">
              {report.reason || "No reason provided"}
            </div>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
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
            <Badge className={getSeverityColor(reportCount)}>
              {getSeverityText(reportCount)}
            </Badge>
          </div>
        </TableCell>
        <TableCell>
          <div className="text-sm text-gray-500">
            {new Date(report.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </TableCell>
        <TableCell>
          {report.status === "pending" ? (
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onUpdateStatus(report.id, "resolved")}
                disabled={isLoading}
                className="text-green-600 hover:text-green-700"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Resolve"
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onUpdateStatus(report.id, "dismissed")}
                disabled={isLoading}
                className="text-gray-600 hover:text-gray-700"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Dismiss"
                )}
              </Button>
            </div>
          ) : (
            <span className="text-sm text-gray-400">No actions available</span>
          )}
        </TableCell>
      </TableRow>
    );
  }
};

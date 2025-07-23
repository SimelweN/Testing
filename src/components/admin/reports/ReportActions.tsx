import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle,
  AlertCircle,
  Clock,
  Eye,
  X,
  Ban,
  UserX,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";

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
}

interface ReportActionsProps {
  report: Report;
  actionReason: string;
  setActionReason: (reason: string) => void;
  isSubmitting: boolean;
  onUpdateStatus: (reportId: string, status: "resolved" | "dismissed") => void;
  onUserAction: (
    userId: string,
    action: "ban" | "suspend",
    reason: string,
  ) => void;
}

const ReportActions = ({
  report,
  actionReason,
  setActionReason,
  isSubmitting,
  onUpdateStatus,
  onUserAction,
}: ReportActionsProps) => {
  const isMobile = useIsMobile();
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isBanDialogOpen, setIsBanDialogOpen] = useState(false);
  const [isSuspendDialogOpen, setIsSuspendDialogOpen] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "resolved":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "dismissed":
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "resolved":
        return "bg-green-100 text-green-800";
      case "dismissed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  if (report.status !== "pending") {
    return (
      <Badge className={getStatusColor(report.status)}>
        <span className="flex items-center gap-1">
          {getStatusIcon(report.status)}
          {report.status}
        </span>
      </Badge>
    );
  }

  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onUpdateStatus(report.id, "dismissed");
  };

  const handleBanUser = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (actionReason.trim()) {
      onUserAction(report.reported_user_id, "ban", actionReason);
      setIsBanDialogOpen(false);
    }
  };

  const handleSuspendUser = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (actionReason.trim()) {
      onUserAction(report.reported_user_id, "suspend", actionReason);
      setIsSuspendDialogOpen(false);
    }
  };

  if (isMobile) {
    return (
      <div className="space-y-2 w-full">
        {/* View Details Button */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-none mx-2">
            <DialogHeader>
              <DialogTitle>Report Details</DialogTitle>
              <DialogDescription>
                Review the report and take appropriate action
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700">Reported Item:</label>
                  <div className="mt-1 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    {report.book_id ? (
                      <div>
                        <div className="font-medium text-blue-900">{report.book_title}</div>
                        <div className="text-sm text-blue-700">Book ID: {report.book_id}</div>
                      </div>
                    ) : (
                      <div>
                        <div className="font-medium text-blue-900">{report.seller_name}</div>
                        <div className="text-sm text-blue-700">User Report</div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700">Report Reason:</label>
                  <div className="mt-1 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="text-sm text-red-900 whitespace-pre-wrap leading-relaxed">
                      {report.reason || 'No reason provided'}
                    </div>
                  </div>
                </div>

                {report.description && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Additional Details:</label>
                    <div className="mt-1 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">
                        {report.description}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-gray-600 pt-2 border-t">
                  <div>
                    <strong>Reported on:</strong> {new Date(report.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                  <div>
                    <strong>Status:</strong> <span className="capitalize">{report.status}</span>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Action Buttons Row */}
        <div className="grid grid-cols-3 gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleDismiss}
            disabled={isSubmitting}
            className="text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Dismiss
          </Button>

          <Dialog open={isBanDialogOpen} onOpenChange={setIsBanDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                variant="destructive"
                className="text-xs"
                onClick={(e) => e.stopPropagation()}
              >
                <Ban className="h-3 w-3 mr-1" />
                Ban
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-none mx-2">
              <DialogHeader>
                <DialogTitle>Ban User</DialogTitle>
                <DialogDescription>
                  Provide a reason for banning this user. This action cannot be
                  undone.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Textarea
                  placeholder="Enter reason for banning..."
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
              <DialogFooter className="flex-col gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setActionReason("");
                    setIsBanDialogOpen(false);
                  }}
                  className="w-full"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  disabled={!actionReason.trim() || isSubmitting}
                  onClick={handleBanUser}
                  className="w-full"
                >
                  {isSubmitting ? "Banning..." : "Ban User"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog
            open={isSuspendDialogOpen}
            onOpenChange={setIsSuspendDialogOpen}
          >
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="bg-orange-600 hover:bg-orange-700 text-xs"
                onClick={(e) => e.stopPropagation()}
              >
                <UserX className="h-3 w-3 mr-1" />
                Suspend
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-none mx-2">
              <DialogHeader>
                <DialogTitle>Suspend User</DialogTitle>
                <DialogDescription>
                  Provide a reason for suspending this user. They can be
                  reinstated later.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Textarea
                  placeholder="Enter reason for suspension..."
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
              <DialogFooter className="flex-col gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setActionReason("");
                    setIsSuspendDialogOpen(false);
                  }}
                  className="w-full"
                >
                  Cancel
                </Button>
                <Button
                  className="bg-orange-600 hover:bg-orange-700 w-full"
                  disabled={!actionReason.trim() || isSubmitting}
                  onClick={handleSuspendUser}
                >
                  {isSubmitting ? "Suspending..." : "Suspend User"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="flex gap-2 items-center">
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogTrigger asChild>
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => e.stopPropagation()}
          >
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Details</DialogTitle>
            <DialogDescription>
              Review the report and take appropriate action
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <strong>Reported:</strong>{" "}
              {report.book_id ? report.book_title : report.seller_name}
            </div>
            <div>
              <strong>Reason:</strong>
              <div className="mt-1 text-sm bg-gray-50 p-2 rounded">
                {report.reason}
              </div>
            </div>
            <div>
              <strong>Date:</strong>{" "}
              {new Date(report.created_at).toLocaleString()}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Button
        size="sm"
        variant="outline"
        onClick={handleDismiss}
        disabled={isSubmitting}
      >
        <X className="h-4 w-4 mr-1" />
        Dismiss
      </Button>

      <Dialog open={isBanDialogOpen} onOpenChange={setIsBanDialogOpen}>
        <DialogTrigger asChild>
          <Button
            size="sm"
            variant="destructive"
            onClick={(e) => e.stopPropagation()}
          >
            <Ban className="h-4 w-4 mr-1" />
            Ban
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ban User</DialogTitle>
            <DialogDescription>
              Provide a reason for banning this user. This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Enter reason for banning..."
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setActionReason("");
                setIsBanDialogOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!actionReason.trim() || isSubmitting}
              onClick={handleBanUser}
            >
              {isSubmitting ? "Banning..." : "Ban User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isSuspendDialogOpen} onOpenChange={setIsSuspendDialogOpen}>
        <DialogTrigger asChild>
          <Button
            size="sm"
            className="bg-orange-600 hover:bg-orange-700"
            onClick={(e) => e.stopPropagation()}
          >
            <UserX className="h-4 w-4 mr-1" />
            Suspend
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend User</DialogTitle>
            <DialogDescription>
              Provide a reason for suspending this user. They can be reinstated
              later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Enter reason for suspension..."
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setActionReason("");
                setIsSuspendDialogOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-orange-600 hover:bg-orange-700"
              disabled={!actionReason.trim() || isSubmitting}
              onClick={handleSuspendUser}
            >
              {isSubmitting ? "Suspending..." : "Suspend User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReportActions;

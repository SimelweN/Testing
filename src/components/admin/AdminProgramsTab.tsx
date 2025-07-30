import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar,
  GraduationCap,
  BookOpen,
  Users,
  AlertCircle,
  Eye,
} from "lucide-react";
import {
  getPendingPrograms,
  getAllProgramSubmissions,
  approveProgram,
  rejectProgram,
  getProgramStats,
  AdminProgramSubmission,
} from "@/services/admin/adminProgramsService";
import { toast } from "sonner";
import LoadingSpinner from "@/components/LoadingSpinner";

const AdminProgramsTab = () => {
  const [programs, setPrograms] = useState<AdminProgramSubmission[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProgram, setSelectedProgram] =
    useState<AdminProgramSubmission | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [adminComments, setAdminComments] = useState("");
  const [filter, setFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("pending");
  const [isProcessing, setIsProcessing] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [allPrograms, programStats] = await Promise.all([
        getAllProgramSubmissions(),
        getProgramStats(),
      ]);

      setPrograms(allPrograms);
      setStats(programStats);
    } catch (error) {
      console.error("Error loading program data:", error);
      toast.error("Failed to load program submissions");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredPrograms = programs.filter((program) => {
    if (filter === "all") return true;
    return program.status === filter;
  });

  const handleApprove = async () => {
    if (!selectedProgram) return;

    try {
      setIsProcessing(true);
      await approveProgram(selectedProgram.id, adminComments);

      toast.success("Program approved successfully!");
      setShowApproveDialog(false);
      setAdminComments("");
      setSelectedProgram(null);
      await loadData(); // Refresh data
    } catch (error) {
      console.error("Error approving program:", error);
      toast.error("Failed to approve program");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedProgram || !adminComments.trim()) {
      toast.error("Please provide comments for rejection");
      return;
    }

    try {
      setIsProcessing(true);
      await rejectProgram(selectedProgram.id, adminComments);

      toast.success("Program rejected with feedback sent to submitter");
      setShowRejectDialog(false);
      setAdminComments("");
      setSelectedProgram(null);
      await loadData(); // Refresh data
    } catch (error) {
      console.error("Error rejecting program:", error);
      toast.error("Failed to reject program");
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "approved":
        return <CheckCircle className="h-4 w-4" />;
      case "rejected":
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner size="lg" text="Loading program submissions..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <GraduationCap className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {stats.pending}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.approved}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.rejected}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        {["all", "pending", "approved", "rejected"].map((filterOption) => (
          <Button
            key={filterOption}
            variant={filter === filterOption ? "default" : "outline"}
            onClick={() => setFilter(filterOption as typeof filter)}
            className="capitalize"
          >
            {filterOption}
          </Button>
        ))}
      </div>

      {/* Programs List */}
      <div className="space-y-4">
        {filteredPrograms.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                No programs found
              </h3>
              <p className="text-gray-500">
                {filter === "pending"
                  ? "No programs are waiting for review at the moment."
                  : `No ${filter} programs found.`}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredPrograms.map((program) => (
            <Card
              key={program.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg mb-1 line-clamp-2">
                      {program.programName}
                    </CardTitle>
                    <CardDescription className="flex flex-wrap items-center gap-2 text-sm">
                      <span>{program.universityName}</span>
                      <span>•</span>
                      <span>{program.facultyName}</span>
                      <span>•</span>
                      <span>{program.duration}</span>
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(program.status)}>
                    {getStatusIcon(program.status)}
                    <span className="ml-1 capitalize">{program.status}</span>
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-3">
                  <p className="text-gray-600 line-clamp-2">
                    {program.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <span>{program.submitterName}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {new Date(program.submittedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      <span>APS: {program.apsRequirement}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedProgram(program);
                        setShowDetails(true);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>

                    {program.status === "pending" && (
                      <>
                        <Button
                          variant="default"
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => {
                            setSelectedProgram(program);
                            setShowApproveDialog(true);
                          }}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>

                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setSelectedProgram(program);
                            setShowRejectDialog(true);
                          }}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Program Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="w-[90vw] max-w-[90vw] sm:max-w-2xl max-h-[85vh] mx-auto my-auto overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedProgram?.programName}</DialogTitle>
            <DialogDescription>
              {selectedProgram?.universityName} • {selectedProgram?.facultyName}
            </DialogDescription>
          </DialogHeader>

          {selectedProgram && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Duration</Label>
                  <p className="text-sm text-gray-600">
                    {selectedProgram.duration}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">APS Requirement</Label>
                  <p className="text-sm text-gray-600">
                    {selectedProgram.apsRequirement}
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Description</Label>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedProgram.description}
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium">
                  Subject Requirements
                </Label>
                <div className="mt-2 space-y-2">
                  {selectedProgram.subjects?.map((subject, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Badge
                        variant={subject.isRequired ? "default" : "secondary"}
                      >
                        {subject.isRequired ? "Required" : "Recommended"}
                      </Badge>
                      <span className="text-sm">
                        {subject.name} (Level {subject.level})
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Career Prospects</Label>
                <div className="mt-2 flex flex-wrap gap-1">
                  {selectedProgram.careerProspects?.map((career, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {career}
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Submitted By</Label>
                  <p className="text-sm text-gray-600">
                    {selectedProgram.submitterName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {selectedProgram.submitterEmail}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Submitted On</Label>
                  <p className="text-sm text-gray-600">
                    {new Date(selectedProgram.submittedAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {selectedProgram.adminComments && (
                <div>
                  <Label className="text-sm font-medium">Admin Comments</Label>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedProgram.adminComments}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Program</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve "{selectedProgram?.programName}"?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="approveComments">Comments (Optional)</Label>
              <Textarea
                id="approveComments"
                placeholder="Add any comments about the approval..."
                value={adminComments}
                onChange={(e) => setAdminComments(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowApproveDialog(false);
                setAdminComments("");
              }}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve Program
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Program</DialogTitle>
            <DialogDescription>
              Please provide feedback for why "{selectedProgram?.programName}"
              is being rejected.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="rejectComments">Rejection Reason *</Label>
              <Textarea
                id="rejectComments"
                placeholder="Explain why this program is being rejected and how it can be improved..."
                value={adminComments}
                onChange={(e) => setAdminComments(e.target.value)}
                rows={4}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setAdminComments("");
              }}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isProcessing || !adminComments.trim()}
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Rejecting...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject Program
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProgramsTab;

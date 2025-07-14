import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  Package,
  Clock,
  Award,
  TrendingUp,
  ExternalLink,
} from "lucide-react";

const CommitTab = () => {
  const navigate = useNavigate();

  return (
    <Card className="border-2 border-indigo-100 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-100 rounded-t-lg">
        <CardTitle className="text-xl md:text-2xl flex items-center gap-3">
          <Award className="h-6 w-6 text-indigo-600" />
          Commit System - Moved to Activity Center
        </CardTitle>
      </CardHeader>
      <CardContent className="p-8">
        <div className="text-center">
          <div className="bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
            <Activity className="h-12 w-12 text-indigo-600" />
          </div>

          <h3 className="text-2xl font-bold text-gray-800 mb-3">
            Enhanced Commit System Available
          </h3>

          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            We've moved the commit system to our dedicated Activity Center for a better experience.
            Manage all your sale commitments with enhanced features and real-time tracking.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto mb-8">
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <Package className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <h4 className="font-semibold text-orange-900">Pending Commits</h4>
              <p className="text-orange-700 text-sm">48-hour commitment window</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h4 className="font-semibold text-green-900">Performance Stats</h4>
              <p className="text-green-700 text-sm">Track your seller metrics</p>
            </div>
          </div>

          <div className="space-y-4">
            <Button
              onClick={() => navigate("/activity")}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold px-8 py-3 text-lg shadow-lg hover:shadow-xl transition-all"
            >
              <Activity className="h-5 w-5 mr-2" />
              Go to Activity Center
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>

            <p className="text-gray-500 text-sm">
              Manage commitments • View statistics • Track performance
            </p>
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2">
              ✨ New Features in Activity Center:
            </h4>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• Real-time commit countdown timers</li>
              <li>• Enhanced visual indicators for urgent commits</li>
              <li>• Comprehensive seller performance metrics</li>
              <li>• Complete activity history and tracking</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
  >([]);
  const [allCommitments, setAllCommitments] = useState<CommitmentWithDetails[]>(
    [],
  );
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Try to fetch data, but handle gracefully if tables don't exist
      try {
        const [pending, all, commitmentStats] = await Promise.all([
          getPendingCommitments(user.id),
          getAllCommitments(user.id),
          getCommitmentStats(user.id),
        ]);

        setPendingCommitments(pending);
        setAllCommitments(all);
        setStats(commitmentStats);
      } catch (tableError) {
        console.log(
          "Commitment system not available yet - tables may not exist",
        );
        // Set empty defaults
        setPendingCommitments([]);
        setAllCommitments([]);
        setStats({
          totalCommitments: 0,
          committedCount: 0,
          declinedCount: 0,
          expiredCount: 0,
          averageResponseTimeHours: 0,
          reliabilityScore: 0,
        });
      }
    } catch (error) {
      console.error("Error fetching commitment data:", error);
      toast.error(
        "Commitment system is being set up. Please check back later.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCommitToSale = async (commitmentId: string) => {
    if (!user) return;

    try {
      setActionLoading(commitmentId);
      const success = await commitToSale(commitmentId, user.id);

      if (success) {
        toast.success(
          "Sale committed successfully! You can now proceed with delivery.",
        );
        await fetchData(); // Refresh data
      } else {
        toast.error("Failed to commit to sale - it may have expired");
      }
    } catch (error) {
      console.error("Error committing to sale:", error);
      toast.error("Failed to commit to sale");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeclineSale = async (commitmentId: string) => {
    if (!user) return;

    try {
      setActionLoading(commitmentId);
      const success = await declineSale(commitmentId, user.id);

      if (success) {
        toast.success(
          "Sale declined. The book is now available for other buyers.",
        );
        await fetchData(); // Refresh data
      } else {
        toast.error(
          "Failed to decline sale - it may have already been processed",
        );
      }
    } catch (error) {
      console.error("Error declining sale:", error);
      toast.error("Failed to decline sale");
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: {
        color: "bg-orange-100 text-orange-800",
        icon: Clock,
        label: "Pending",
      },
      committed: {
        color: "bg-green-100 text-green-800",
        icon: CheckCircle,
        label: "Committed",
      },
      declined: {
        color: "bg-red-100 text-red-800",
        icon: XCircle,
        label: "Declined",
      },
      expired: {
        color: "bg-gray-100 text-gray-800",
        icon: AlertTriangle,
        label: "Expired",
      },
      completed: {
        color: "bg-blue-100 text-blue-800",
        icon: Package,
        label: "Completed",
      },
      refunded: {
        color: "bg-purple-100 text-purple-800",
        icon: XCircle,
        label: "Refunded",
      },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getUrgencyBadge = (timeRemaining?: string) => {
    if (!timeRemaining || timeRemaining === "Expired") return null;

    const hoursMatch = timeRemaining.match(/(\d+)h/);
    const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;

    if (hours <= 1) {
      return <Badge className="bg-red-100 text-red-800 ml-2">URGENT</Badge>;
    } else if (hours <= 6) {
      return <Badge className="bg-orange-100 text-orange-800 ml-2">Soon</Badge>;
    }
    return null;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-book-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-book-600" />
                <div>
                  <p className="text-sm text-gray-600">Reliability Score</p>
                  <p className="text-2xl font-bold text-book-600">
                    {stats.reliabilityScore}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Avg Response Time</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {Math.round(stats.averageResponseTimeHours)}h
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Committed</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.committedCount}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending">
            Pending ({pendingCommitments.length})
          </TabsTrigger>
          <TabsTrigger value="all">
            All Commitments ({allCommitments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingCommitments.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Pending Commitments
                </h3>
                <p className="text-gray-600">
                  When someone purchases your books, they'll appear here for you
                  to commit within 48 hours.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Action Required:</strong> You have{" "}
                  {pendingCommitments.length} sale(s) waiting for your
                  commitment. You must respond within 48 hours or the sale will
                  be automatically refunded.
                </AlertDescription>
              </Alert>

              {pendingCommitments.map((commitment) => (
                <Card key={commitment.id} className="border-orange-200">
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <img
                        src={commitment.book_image_url || "/placeholder.svg"}
                        alt={commitment.book_title}
                        className="w-16 h-20 object-cover rounded"
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-lg">
                            {commitment.book_title}
                          </h3>
                          <div className="flex items-center">
                            {getStatusBadge(commitment.status)}
                            {getUrgencyBadge(commitment.time_remaining)}
                          </div>
                        </div>

                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>Buyer: {commitment.buyer_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span
                              className={
                                commitment.time_remaining === "Expired"
                                  ? "text-red-600 font-medium"
                                  : ""
                              }
                            >
                              {commitment.time_remaining}
                            </span>
                          </div>
                        </div>

                        <div className="flex justify-between items-center mt-4 pt-4 border-t">
                          <div>
                            <span className="text-lg font-bold text-book-600">
                              R{commitment.total_amount.toFixed(2)}
                            </span>
                            <div className="text-xs text-gray-500">
                              Book: R{commitment.purchase_amount.toFixed(2)} +
                              Delivery: R{commitment.delivery_fee.toFixed(2)}
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeclineSale(commitment.id)}
                              disabled={actionLoading === commitment.id}
                              className="border-red-300 text-red-700 hover:bg-red-50"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Decline
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleCommitToSale(commitment.id)}
                              disabled={actionLoading === commitment.id}
                              className="bg-book-600 hover:bg-book-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              {actionLoading === commitment.id
                                ? "Processing..."
                                : "Commit to Sale"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {allCommitments.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Sale History
                </h3>
                <p className="text-gray-600">
                  Your sale commitments and purchase history will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            allCommitments.map((commitment) => (
              <Card key={commitment.id}>
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <img
                      src={commitment.book_image_url || "/placeholder.svg"}
                      alt={commitment.book_title}
                      className="w-16 h-20 object-cover rounded"
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold">
                          {commitment.book_title}
                        </h3>
                        {getStatusBadge(commitment.status)}
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <strong>Role:</strong>{" "}
                          {commitment.seller_id === user?.id
                            ? "Seller"
                            : "Buyer"}
                        </div>
                        <div>
                          <strong>Amount:</strong> R
                          {commitment.total_amount.toFixed(2)}
                        </div>
                        <div>
                          <strong>Created:</strong>{" "}
                          {new Date(commitment.created_at).toLocaleDateString()}
                        </div>
                        {commitment.committed_at && (
                          <div>
                            <strong>Committed:</strong>{" "}
                            {new Date(
                              commitment.committed_at,
                            ).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CommitTab;
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  BookOpen,
  DollarSign,
  TrendingUp,
  Flag,
  Mail,
  UserPlus,
  ShoppingCart,
  AlertTriangle,
  Activity,
} from "lucide-react";
import { AdminStats as AdminStatsType } from "@/services/admin/adminQueries";

interface AdminStatsProps {
  stats: AdminStatsType;
}

const AdminStats = ({ stats }: AdminStatsProps) => {
  const primaryStats = [
    {
      title: "Total Users",
      value: stats.totalUsers.toString(),
      icon: Users,
      description: "Registered users",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      trend: `+${stats.newUsersThisWeek} this week`,
    },
    {
      title: "Active Listings",
      value: stats.activeListings.toString(),
      icon: BookOpen,
      description: "Books for sale",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      trend: "Currently available",
    },
    {
      title: "Books Sold",
      value: stats.booksSold.toString(),
      icon: TrendingUp,
      description: "Completed sales",
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      trend: `R${stats.salesThisMonth.toFixed(2)} this month`,
    },
    {
      title: "Monthly Commission",
      value: `R${stats.monthlyCommission.toFixed(2)}`,
      icon: DollarSign,
      description: "Commission earned",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
      trend: `R${stats.weeklyCommission.toFixed(2)} this week`,
    },
  ];

  const alertStats = [
    {
      title: "Pending Reports",
      value: stats.pendingReports,
      icon: Flag,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      description: "Reports awaiting review",
      priority: "high",
      actionText: "Review Now",
    },
    {
      title: "Unread Messages",
      value: stats.unreadMessages,
      icon: Mail,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      description: "Contact form messages",
      priority: "medium",
      actionText: "Check Messages",
    },
    {
      title: "Reported Issues",
      value: stats.reportedIssues,
      icon: AlertTriangle,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
      description: "Issues requiring attention",
      priority: "medium",
      actionText: "View Issues",
    },
  ];

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-book-600 rounded-lg">
          <Activity className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Dashboard Overview
          </h2>
          <p className="text-gray-600">
            Real-time platform statistics and metrics
          </p>
        </div>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {primaryStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={index}
              className={`relative overflow-hidden border-l-4 ${stat.borderColor} hover:shadow-lg transition-all duration-300 ${stat.bgColor}`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">
                  {stat.title}
                </CardTitle>
                <div
                  className={`p-2 rounded-lg ${stat.bgColor} border ${stat.borderColor}`}
                >
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${stat.color} mb-1`}>
                  {stat.value}
                </div>
                <p className="text-xs text-gray-600 mb-2">{stat.description}</p>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-green-600 font-medium">
                    {stat.trend}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Alert & Action Items */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          Attention Required
        </h3>

        <div className="grid gap-4 md:grid-cols-3">
          {alertStats.map((stat, index) => {
            const Icon = stat.icon;
            const hasItems = stat.value > 0;

            return (
              <Card
                key={index}
                className={`border-l-4 ${stat.borderColor} ${hasItems ? stat.bgColor : "bg-gray-50"} hover:shadow-md transition-all duration-200`}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <div className="flex items-center gap-2">
                    <Icon
                      className={`h-5 w-5 ${hasItems ? stat.color : "text-gray-400"}`}
                    />
                    <CardTitle className="text-sm font-medium">
                      {stat.title}
                    </CardTitle>
                  </div>
                  {hasItems && (
                    <Badge className={getPriorityBadge(stat.priority)}>
                      {stat.priority}
                    </Badge>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-between">
                    <div>
                      <div
                        className={`text-3xl font-bold ${hasItems ? stat.color : "text-gray-400"} mb-1`}
                      >
                        {stat.value}
                      </div>
                      <p className="text-xs text-gray-600">
                        {stat.description}
                      </p>
                    </div>
                    {hasItems && (
                      <button
                        className={`text-xs ${stat.color} hover:underline font-medium`}
                      >
                        {stat.actionText}
                      </button>
                    )}
                  </div>

                  {!hasItems && (
                    <div className="mt-2 flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs text-green-600 font-medium">
                        All clear
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-book-600 to-book-700 rounded-lg p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold mb-1">Quick Actions</h3>
            <p className="text-book-100 text-sm">Common administrative tasks</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="px-4 py-2 bg-white text-book-600 rounded-lg text-sm font-medium hover:bg-book-50 transition-colors">
              Send Broadcast
            </button>
            <button className="px-4 py-2 bg-book-500 text-white rounded-lg text-sm font-medium hover:bg-book-400 transition-colors">
              Generate Report
            </button>
            <button className="px-4 py-2 bg-book-500 text-white rounded-lg text-sm font-medium hover:bg-book-400 transition-colors">
              System Health
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminStats;

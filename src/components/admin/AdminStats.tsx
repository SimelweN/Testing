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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-sm">
          <Activity className="h-7 w-7 text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-gray-900">
            Platform Analytics
          </h2>
          <p className="text-gray-600 text-lg">
            Real-time insights and performance metrics
          </p>
        </div>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {primaryStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={index}
              className={`relative overflow-hidden border-0 shadow-sm hover:shadow-lg transition-all duration-300 bg-white`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-gray-700">
                  {stat.title}
                </CardTitle>
                <div
                  className={`p-2.5 rounded-xl ${stat.bgColor} border-0`}
                >
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${stat.color} mb-2`}>
                  {stat.value}
                </div>
                <p className="text-sm text-gray-600 mb-3">{stat.description}</p>
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600 font-medium">
                    {stat.trend}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Alert & Action Items */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-amber-600" />
          Attention Required
        </h3>

        <div className="grid gap-6 lg:grid-cols-4">
          {/* Alert Stats */}
          {alertStats.map((stat, index) => {
            const Icon = stat.icon;
            const hasItems = stat.value > 0;

            return (
              <Card
                key={index}
                className={`border-0 ${hasItems ? "bg-white shadow-sm" : "bg-gray-50"} hover:shadow-md transition-all duration-200`}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${hasItems ? stat.bgColor : "bg-gray-100"}`}>
                      <Icon
                        className={`h-5 w-5 ${hasItems ? stat.color : "text-gray-400"}`}
                      />
                    </div>
                    <CardTitle className="text-sm font-semibold">
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
                        className={`text-3xl font-bold ${hasItems ? stat.color : "text-gray-400"} mb-2`}
                      >
                        {stat.value}
                      </div>
                      <p className="text-sm text-gray-600">
                        {stat.description}
                      </p>
                    </div>
                    {hasItems && (
                      <button
                        className={`text-sm ${stat.color} hover:underline font-medium`}
                      >
                        {stat.actionText}
                      </button>
                    )}
                  </div>

                  {!hasItems && (
                    <div className="mt-3 flex items-center gap-2">
                      <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-green-600 font-medium">
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
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-8 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold mb-2">Quick Actions</h3>
            <p className="text-blue-100 text-base">Common administrative tasks and tools</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="px-6 py-3 bg-white text-blue-600 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-colors shadow-sm">
              Send Broadcast
            </button>
            <button className="px-6 py-3 bg-blue-500 text-white rounded-lg text-sm font-semibold hover:bg-blue-400 transition-colors">
              Generate Report
            </button>
            <button className="px-6 py-3 bg-blue-500 text-white rounded-lg text-sm font-semibold hover:bg-blue-400 transition-colors">
              System Health
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminStats;

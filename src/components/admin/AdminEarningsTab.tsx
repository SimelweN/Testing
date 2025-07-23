import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AdminStats } from "@/services/admin/adminQueries";
import { TrendingUp, DollarSign, Calendar, Target } from "lucide-react";

interface AdminEarningsTabProps {
  stats: AdminStats;
}

const AdminEarningsTab = ({ stats }: AdminEarningsTabProps) => {
  const earningsData = [
    {
      title: "Weekly Commission",
      value: `R${stats.weeklyCommission.toFixed(2)}`,
      description: "Commission earned this week",
      icon: Calendar,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
    },
    {
      title: "Monthly Commission",
      value: `R${stats.monthlyCommission.toFixed(2)}`,
      description: "Commission earned this month",
      icon: DollarSign,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
    },
    {
      title: "Total Sales",
      value: `R${stats.salesThisMonth.toFixed(2)}`,
      description: "Total sales this month",
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
    },
    {
      title: "Books Sold",
      value: stats.booksSold.toString(),
      description: "Total books sold",
      icon: Target,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl">
            <DollarSign className="h-7 w-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Revenue & Earnings
            </h2>
            <p className="text-gray-600 text-base">
              Track commission earnings and sales performance
            </p>
          </div>
        </div>
      </div>

      {/* Earnings Grid */}
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {earningsData.map((item, index) => {
            const Icon = item.icon;
            return (
              <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl ${item.bgColor}`}>
                      <Icon className={`h-6 w-6 ${item.color}`} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-gray-700">
                      {item.title}
                    </h3>
                    <div className={`text-3xl font-bold ${item.color}`}>
                      {item.value}
                    </div>
                    <p className="text-sm text-gray-600">
                      {item.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Commission Information */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Commission Structure
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-700">Standard Commission</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900 mb-1">10%</div>
                    <p className="text-sm text-gray-600">
                      Platform commission on each book sale
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-700">Delivery Fee</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900 mb-1">100%</div>
                    <p className="text-sm text-gray-600">
                      Full delivery cost retained by platform
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Commission rates are automatically calculated on each sale.
                  Earnings are tracked and recorded for administrative purposes.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminEarningsTab;


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminStats } from '@/services/adminService';

interface AdminEarningsTabProps {
  stats: AdminStats;
}

const AdminEarningsTab = ({ stats }: AdminEarningsTabProps) => {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg md:text-xl">Commission Earnings</CardTitle>
        <CardDescription className="text-sm">Track your earnings from book sales</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="space-y-3 md:space-y-4">
            <h4 className="text-base md:text-lg font-semibold">Weekly Summary</h4>
            <div className="bg-green-50 p-3 md:p-4 rounded-lg">
              <div className="text-2xl md:text-3xl font-bold text-green-600">
                R{stats.weeklyCommission.toFixed(2)}
              </div>
              <p className="text-xs md:text-sm text-gray-600">Commission earned this week</p>
            </div>
          </div>
          
          <div className="space-y-3 md:space-y-4">
            <h4 className="text-base md:text-lg font-semibold">Monthly Summary</h4>
            <div className="bg-blue-50 p-3 md:p-4 rounded-lg">
              <div className="text-2xl md:text-3xl font-bold text-blue-600">
                R{stats.monthlyCommission.toFixed(2)}
              </div>
              <p className="text-xs md:text-sm text-gray-600">Commission earned this month</p>
            </div>
          </div>
        </div>
        
        <div className="mt-4 md:mt-6 p-3 md:p-4 bg-gray-50 rounded-lg">
          <h5 className="font-medium mb-2 text-sm md:text-base">Commission Rate</h5>
          <p className="text-xs md:text-sm text-gray-600">
            You earn a commission on every book sold through the platform. 
            Commission rates may vary based on book category and price.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminEarningsTab;

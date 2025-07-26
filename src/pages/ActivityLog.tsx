import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  Activity, 
  Clock, 
  ShoppingBag, 
  Package, 
  CreditCard, 
  User, 
  Calendar,
  TrendingUp,
  RefreshCw,
  Filter,
  Search,
  MoreVertical,
  Check,
  X,
  AlertCircle
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

interface ActivityItem {
  id: string;
  type: 'purchase' | 'sale' | 'payment' | 'notification' | 'profile';
  title: string;
  description: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
  amount?: number;
  metadata?: any;
}

interface ActivityStats {
  totalActivities: number;
  completedActions: number;
  pendingActions: number;
  failedActions: number;
}

const ActivityLog: React.FC = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [stats, setStats] = useState<ActivityStats>({
    totalActivities: 0,
    completedActions: 0,
    pendingActions: 0,
    failedActions: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Load activities from multiple sources
  const loadActivities = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Fetch from multiple tables and combine
      const [ordersResponse, notificationsResponse] = await Promise.all([
        supabase
          .from('orders')
          .select('*')
          .eq('buyer_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10)
      ]);

      const combinedActivities: ActivityItem[] = [];

      // Process orders
      if (ordersResponse.data) {
        ordersResponse.data.forEach(order => {
          combinedActivities.push({
            id: `order-${order.id}`,
            type: 'purchase',
            title: `Book Purchase`,
            description: `Order for book ID ${order.book_id}`,
            timestamp: order.created_at,
            status: order.status === 'completed' ? 'completed' : 
                   order.status === 'pending' ? 'pending' : 'failed',
            amount: order.total_price,
            metadata: order
          });
        });
      }

      // Process notifications
      if (notificationsResponse.data) {
        notificationsResponse.data.forEach(notification => {
          combinedActivities.push({
            id: `notification-${notification.id}`,
            type: 'notification',
            title: notification.title || 'Notification',
            description: notification.message || 'System notification',
            timestamp: notification.created_at,
            status: notification.is_read ? 'completed' : 'pending',
            metadata: notification
          });
        });
      }

      // Sort by timestamp
      combinedActivities.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setActivities(combinedActivities);

      // Calculate stats
      const stats = combinedActivities.reduce((acc, activity) => {
        acc.totalActivities++;
        if (activity.status === 'completed') acc.completedActions++;
        if (activity.status === 'pending') acc.pendingActions++;
        if (activity.status === 'failed') acc.failedActions++;
        return acc;
      }, {
        totalActivities: 0,
        completedActions: 0,
        pendingActions: 0,
        failedActions: 0
      });

      setStats(stats);

    } catch (error) {
      console.error('Error loading activities:', error);
      toast.error('Failed to load activity data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, [user]);

  // Filter activities based on type and search
  const filteredActivities = activities.filter(activity => {
    const matchesType = filterType === 'all' || activity.type === filterType;
    const matchesSearch = searchTerm === '' || 
      activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const getActivityIcon = (type: string, status: string) => {
    const baseClasses = "w-5 h-5";
    
    switch (type) {
      case 'purchase':
        return <ShoppingBag className={`${baseClasses} text-blue-500`} />;
      case 'sale':
        return <Package className={`${baseClasses} text-green-500`} />;
      case 'payment':
        return <CreditCard className={`${baseClasses} text-purple-500`} />;
      case 'notification':
        return <AlertCircle className={`${baseClasses} text-yellow-500`} />;
      case 'profile':
        return <User className={`${baseClasses} text-gray-500`} />;
      default:
        return <Activity className={`${baseClasses} text-gray-400`} />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
          <Check className="w-3 h-3 mr-1" />
          Completed
        </Badge>;
      case 'pending':
        return <Badge variant="default" className="bg-yellow-100 text-yellow-800 border-yellow-200">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </Badge>;
      case 'failed':
        return <Badge variant="default" className="bg-red-100 text-red-800 border-red-200">
          <X className="w-3 h-3 mr-1" />
          Failed
        </Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) {
      return 'Just now';
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffHours < 168) { // 7 days
      return `${Math.floor(diffHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const clearAllActivities = async () => {
    const confirmed = window.confirm(
      "⚠️ This will clear your activity history. Are you sure?"
    );
    
    if (!confirmed) return;

    try {
      setActivities([]);
      setStats({
        totalActivities: 0,
        completedActions: 0,
        pendingActions: 0,
        failedActions: 0
      });
      toast.success("Activity history cleared");
    } catch (error) {
      toast.error("Failed to clear activities");
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Sign In Required
            </h3>
            <p className="text-gray-600">
              Please sign in to view your activity history.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Activity Log</h1>
          <p className="text-gray-600 mt-1">Track your recent actions and transactions</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadActivities}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllActivities}
            className="text-red-600 hover:text-red-700"
          >
            <X className="w-4 h-4 mr-2" />
            Clear History
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Activities</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalActivities}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completedActions}</p>
              </div>
              <Check className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pendingActions}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Failed</p>
                <p className="text-2xl font-bold text-red-600">{stats.failedActions}</p>
              </div>
              <X className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search activities..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              {['all', 'purchase', 'sale', 'payment', 'notification'].map((type) => (
                <Button
                  key={type}
                  variant={filterType === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterType(type)}
                  className="capitalize"
                >
                  {type === 'all' ? 'All' : type}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activities List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Recent Activities
            <Badge variant="outline" className="ml-2">
              {filteredActivities.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                  <Separator className="my-4" />
                </div>
              ))}
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Activities Found
              </h3>
              <p className="text-gray-600">
                {searchTerm || filterType !== 'all' 
                  ? 'Try adjusting your filters or search terms.'
                  : 'Start using the platform to see your activity history here.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredActivities.map((activity, index) => (
                <div key={activity.id}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        {getActivityIcon(activity.type, activity.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {activity.title}
                          </h4>
                          <div className="flex items-center space-x-2">
                            {activity.amount && (
                              <span className="text-sm font-medium text-gray-900">
                                R{activity.amount.toFixed(2)}
                              </span>
                            )}
                            {getStatusBadge(activity.status)}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {activity.description}
                        </p>
                        <div className="flex items-center mt-2 text-xs text-gray-500">
                          <Calendar className="w-3 h-3 mr-1" />
                          {formatTimestamp(activity.timestamp)}
                        </div>
                      </div>
                    </div>
                  </div>
                  {index < filteredActivities.length - 1 && (
                    <Separator className="my-4" />
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivityLog;

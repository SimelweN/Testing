import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Truck,
  CheckCircle,
  XCircle,
  AlertCircle,
  Bell,
  MessageSquare,
  Edit,
  BookOpen,
  MapPin,
  Timer,
  Eye,
  DollarSign,
  Star,
  FileText,
  Home,
  Building,
  ArrowLeft
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import Layout from "@/components/Layout";

interface Order {
  id: string;
  status: string;
  total_price: number;
  created_at: string;
  updated_at: string;
  buyer_id: string;
  seller_id: string;
  shipping_method: string;
  tracking_number?: string;
  courier_reference?: string;
  buyer_address: any;
  committed_at?: string;
  book: {
    title: string;
    author: string;
    price: number;
    images?: string[];
  };
  seller: {
    name: string;
    email: string;
  };
}

interface Commit {
  id: string;
  order_id: string;
  seller_id: string;
  buyer_id: string;
  status: string;
  committed_at: string;
  expires_at: string;
  created_at: string;
  order: {
    id: string;
    total_price: number;
    status: string;
    book: {
      title: string;
      author: string;
      price: number;
    };
    buyer: {
      name: string;
      email: string;
    };
  };
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  created_at: string;
  is_read: boolean;
  user_id: string;
  metadata?: any;
}

interface ActivityItem {
  id: string;
  type: 'order' | 'listing' | 'message' | 'edit' | 'notification' | 'commit';
  title: string;
  description: string;
  timestamp: string;
  status: string;
  amount?: number;
  metadata?: any;
  icon: React.ReactNode;
}

const ActivityLog: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');

  // Load all user data
  const loadUserData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Load orders (both as buyer and seller)
      const [buyerOrdersRes, sellerOrdersRes] = await Promise.all([
        supabase
          .from('orders')
          .select(`
            *,
            book:books(*),
            seller:profiles!seller_id(name, email)
          `)
          .eq('buyer_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('orders')
          .select(`
            *,
            book:books(*),
            buyer:profiles!buyer_id(name, email)
          `)
          .eq('seller_id', user.id)
          .order('created_at', { ascending: false })
      ]);

      // Load commits (as seller)
      const commitsRes = await supabase
        .from('sale_commitments')
        .select(`
          *,
          order:orders(
            id,
            total_price,
            status,
            book:books(title, author, price),
            buyer:profiles!buyer_id(name, email)
          )
        `)
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

      // Load notifications
      const notificationsRes = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      // Process and combine data
      const allOrders = [
        ...(buyerOrdersRes.data || []),
        ...(sellerOrdersRes.data || [])
      ];

      setOrders(allOrders);
      setCommits(commitsRes.data || []);
      setNotifications(notificationsRes.data || []);

      // Generate activity timeline
      generateActivityTimeline(
        allOrders,
        commitsRes.data || [],
        notificationsRes.data || []
      );

    } catch (error) {
      console.error('Error loading user data:', error);
      toast.error('Failed to load activity data');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate comprehensive activity timeline
  const generateActivityTimeline = (
    orders: Order[],
    commits: Commit[],
    notifications: Notification[]
  ) => {
    const timeline: ActivityItem[] = [];

    // Add order activities
    orders.forEach(order => {
      const isAsBuyer = order.buyer_id === user?.id;
      
      timeline.push({
        id: `order-${order.id}`,
        type: 'order',
        title: isAsBuyer ? 'Book Purchase' : 'Book Sale',
        description: `${order.book?.title} by ${order.book?.author} - R${order.total_price}`,
        timestamp: order.created_at,
        status: order.status,
        amount: order.total_price,
        metadata: { order, isAsBuyer },
        icon: isAsBuyer ? <ShoppingBag className="w-4 h-4" /> : <Package className="w-4 h-4" />
      });

      // Add status updates for orders
      if (order.committed_at) {
        timeline.push({
          id: `commit-${order.id}`,
          type: 'commit',
          title: isAsBuyer ? 'Seller Committed' : 'Order Committed',
          description: `${order.book?.title} - Order confirmed`,
          timestamp: order.committed_at,
          status: 'completed',
          metadata: { order, isAsBuyer },
          icon: <CheckCircle className="w-4 h-4" />
        });
      }
    });

    // Add commit activities
    commits.forEach(commit => {
      timeline.push({
        id: `sale-commit-${commit.id}`,
        type: 'commit',
        title: 'Sale Commitment',
        description: `${commit.order?.book?.title} - Committed to ${commit.order?.buyer?.name}`,
        timestamp: commit.committed_at || commit.created_at,
        status: commit.status,
        amount: commit.order?.total_price,
        metadata: { commit },
        icon: <FileText className="w-4 h-4" />
      });
    });

    // Add notification activities
    notifications.forEach(notification => {
      timeline.push({
        id: `notification-${notification.id}`,
        type: 'notification',
        title: notification.title || 'Notification',
        description: notification.message,
        timestamp: notification.created_at,
        status: notification.is_read ? 'read' : 'unread',
        metadata: { notification },
        icon: <Bell className="w-4 h-4" />
      });
    });

    // Sort by timestamp (newest first)
    timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    setActivities(timeline);
  };

  useEffect(() => {
    loadUserData();
  }, [user]);

  // Filter activities
  const filteredActivities = activities.filter(activity => {
    const matchesSearch = searchTerm === '' || 
      activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getStatusBadge = (status: string, type: string) => {
    const statusConfig = {
      'pending_commit': { color: 'bg-yellow-100 text-yellow-800', label: 'Pending', icon: <Clock className="w-3 h-3" /> },
      'committed': { color: 'bg-blue-100 text-blue-800', label: 'Committed', icon: <CheckCircle className="w-3 h-3" /> },
      'shipped': { color: 'bg-purple-100 text-purple-800', label: 'Shipped', icon: <Truck className="w-3 h-3" /> },
      'delivered': { color: 'bg-green-100 text-green-800', label: 'Delivered', icon: <CheckCircle className="w-3 h-3" /> },
      'cancelled': { color: 'bg-red-100 text-red-800', label: 'Cancelled', icon: <XCircle className="w-3 h-3" /> },
      'completed': { color: 'bg-green-100 text-green-800', label: 'Completed', icon: <CheckCircle className="w-3 h-3" /> },
      'read': { color: 'bg-gray-100 text-gray-800', label: 'Read', icon: <Eye className="w-3 h-3" /> },
      'unread': { color: 'bg-blue-100 text-blue-800', label: 'Unread', icon: <AlertCircle className="w-3 h-3" /> },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || 
      { color: 'bg-gray-100 text-gray-800', label: status, icon: <AlertCircle className="w-3 h-3" /> };

    return (
      <Badge variant="outline" className={config.color}>
        {config.icon}
        <span className="ml-1">{config.label}</span>
      </Badge>
    );
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffHours < 168) return `${Math.floor(diffHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  const getDeliveryTimeline = (order: Order) => {
    const steps = [
      { 
        key: 'ordered', 
        label: 'Order Placed', 
        completed: true, 
        timestamp: order.created_at,
        icon: <ShoppingBag className="w-4 h-4" />
      },
      { 
        key: 'committed', 
        label: 'Seller Committed', 
        completed: !!order.committed_at, 
        timestamp: order.committed_at,
        icon: <CheckCircle className="w-4 h-4" />
      },
      { 
        key: 'collected', 
        label: 'Collected', 
        completed: order.status === 'shipped' || order.status === 'delivered', 
        timestamp: order.status === 'shipped' ? order.updated_at : null,
        icon: <Package className="w-4 h-4" />
      },
      { 
        key: 'in_transit', 
        label: 'In Transit', 
        completed: order.status === 'shipped' || order.status === 'delivered', 
        timestamp: order.status === 'shipped' ? order.updated_at : null,
        icon: <Truck className="w-4 h-4" />
      },
      { 
        key: 'delivered', 
        label: 'Delivered', 
        completed: order.status === 'delivered', 
        timestamp: order.status === 'delivered' ? order.updated_at : null,
        icon: <Home className="w-4 h-4" />
      }
    ];

    return steps;
  };

  const OrderTimeline: React.FC<{ order: Order }> = ({ order }) => {
    const timeline = getDeliveryTimeline(order);
    
    return (
      <div className="space-y-3">
        {timeline.map((step, index) => (
          <div key={step.key} className="flex items-center space-x-3">
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              step.completed 
                ? 'bg-green-100 text-green-600' 
                : 'bg-gray-100 text-gray-400'
            }`}>
              {step.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${
                  step.completed ? 'text-green-800' : 'text-gray-500'
                }`}>
                  {step.label}
                </span>
                {step.timestamp && (
                  <span className="text-xs text-gray-500">
                    {formatTimestamp(step.timestamp)}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
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
              Please sign in to view your activity.
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
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Activity</h1>
            <p className="text-gray-600 mt-1">Track your orders, commits, and platform activity</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadUserData}
          disabled={isLoading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
              </div>
              <ShoppingBag className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Commits</p>
                <p className="text-2xl font-bold text-green-600">
                  {commits.filter(c => c.status === 'pending' || c.status === 'active').length}
                </p>
              </div>
              <FileText className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Unread Notifications</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {notifications.filter(n => !n.is_read).length}
                </p>
              </div>
              <Bell className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-purple-600">
                  R{orders.reduce((sum, order) => sum + (order.total_price || 0), 0).toFixed(2)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="orders">My Orders</TabsTrigger>
          <TabsTrigger value="commits">Commits</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Orders */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5" />
                  Recent Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orders.slice(0, 5).map(order => (
                    <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{order.book?.title}</p>
                        <p className="text-sm text-gray-600">R{order.total_price}</p>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(order.status, 'order')}
                        <p className="text-xs text-gray-500 mt-1">
                          {formatTimestamp(order.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Active Commits */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Active Commits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {commits.filter(c => c.status === 'pending' || c.status === 'active').slice(0, 5).map(commit => (
                    <div key={commit.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{commit.order?.book?.title}</p>
                        <p className="text-sm text-gray-600">
                          To: {commit.order?.buyer?.name}
                        </p>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(commit.status, 'commit')}
                        <p className="text-xs text-gray-500 mt-1">
                          {formatTimestamp(commit.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                All Orders
                <Badge variant="outline">{orders.length}</Badge>
              </CardTitle>
              <div className="flex gap-4 mt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search orders..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orders.map(order => {
                  const isAsBuyer = order.buyer_id === user.id;
                  return (
                    <Card key={order.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {isAsBuyer ? <ShoppingBag className="w-4 h-4" /> : <Package className="w-4 h-4" />}
                              <h4 className="font-semibold">
                                {isAsBuyer ? 'Purchase' : 'Sale'}: {order.book?.title}
                              </h4>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              by {order.book?.author} • R{order.total_price}
                            </p>
                            <p className="text-sm text-gray-500">
                              {isAsBuyer ? 'Seller' : 'Buyer'}: {isAsBuyer ? order.seller?.name : order.buyer?.name}
                            </p>
                            <div className="mt-3">
                              <p className="text-xs font-medium text-gray-700 mb-2">Delivery Status:</p>
                              <OrderTimeline order={order} />
                            </div>
                          </div>
                          <div className="text-right">
                            {getStatusBadge(order.status, 'order')}
                            <p className="text-xs text-gray-500 mt-1">
                              {formatTimestamp(order.created_at)}
                            </p>
                            {order.tracking_number && (
                              <p className="text-xs text-blue-600 mt-1">
                                Tracking: {order.tracking_number}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Commits Tab */}
        <TabsContent value="commits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Sale Commitments
                <Badge variant="outline">{commits.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {commits.map(commit => (
                  <Card key={commit.id} className="border-l-4 border-l-green-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="w-4 h-4" />
                            <h4 className="font-semibold">{commit.order?.book?.title}</h4>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            by {commit.order?.book?.author} • R{commit.order?.total_price}
                          </p>
                          <p className="text-sm text-gray-500">
                            Buyer: {commit.order?.buyer?.name}
                          </p>
                          <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                            <span>Created: {formatTimestamp(commit.created_at)}</span>
                            {commit.committed_at && (
                              <span>Committed: {formatTimestamp(commit.committed_at)}</span>
                            )}
                            {commit.expires_at && (
                              <span>Expires: {formatTimestamp(commit.expires_at)}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          {getStatusBadge(commit.status, 'commit')}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notifications
                <Badge variant="outline">{notifications.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {notifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-lg border-l-4 ${
                      notification.is_read 
                        ? 'bg-gray-50 border-l-gray-300' 
                        : 'bg-blue-50 border-l-blue-500'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Bell className="w-4 h-4" />
                          <h4 className="font-medium">{notification.title}</h4>
                        </div>
                        <p className="text-sm text-gray-600">{notification.message}</p>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(notification.is_read ? 'read' : 'unread', 'notification')}
                        <p className="text-xs text-gray-500 mt-1">
                          {formatTimestamp(notification.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Activity Timeline
                <Badge variant="outline">{filteredActivities.length}</Badge>
              </CardTitle>
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search timeline..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
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
                    {searchTerm 
                      ? 'Try adjusting your search terms.'
                      : 'Start using the platform to see your activity here.'
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredActivities.map((activity, index) => (
                    <div key={activity.id}>
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          {activity.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-900">
                              {activity.title}
                            </h4>
                            <div className="flex items-center space-x-2">
                              {activity.amount && (
                                <span className="text-sm font-medium text-gray-900">
                                  R{activity.amount.toFixed(2)}
                                </span>
                              )}
                              {getStatusBadge(activity.status, activity.type)}
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
                      {index < filteredActivities.length - 1 && (
                        <Separator className="my-4" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default ActivityLog;

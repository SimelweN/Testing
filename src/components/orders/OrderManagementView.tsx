import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Package,
  Clock,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  TruckIcon,
  ShoppingCart,
  DollarSign,
  Calendar,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import OrderActionsPanel from "./OrderActionsPanel";
import { Order } from "@/services/orderCancellationService";
import { logError, getUserFriendlyErrorMessage } from "@/utils/errorLogging";
import { runOrdersTableDiagnostics } from "@/utils/testOrdersTable";

interface OrderManagementViewProps {
  initialFilter?: "all" | "pending" | "active" | "completed" | "cancelled";
}

const OrderManagementView: React.FC<OrderManagementViewProps> = ({
  initialFilter = "all",
}) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialFilter);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user, activeTab]);

    const fetchOrders = async () => {
    if (!user) {
      console.log("🔍 No user found for order fetching");
      return;
    }

    console.log("🔍 Fetching orders for user:", {
      userId: user.id,
      userEmail: user.email,
      activeTab
    });

    setLoading(true);
    try {
            let query = supabase
        .from("orders")
        .select(
          `
          *,
          seller:profiles!seller_id(id, name, email)
        `,
        )
        .or(`buyer_email.eq.${user?.email},seller_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      // Apply filters based on active tab
      switch (activeTab) {
        case "pending":
          query = query.in("status", ["pending", "confirmed"]);
          break;
        case "active":
          query = query.in("status", ["confirmed", "dispatched"]);
          break;
        case "completed":
          query = query.eq("status", "delivered");
          break;
        case "cancelled":
          query = query.in("status", [
            "cancelled_by_buyer",
            "declined_by_seller",
            "cancelled_by_seller_after_missed_pickup",
          ]);
          break;
            }

      console.log("🔍 About to execute orders query for activeTab:", activeTab);
      const { data, error } = await query;
      console.log("🔍 Orders query result:", { data, error, dataLength: data?.length });

                                    if (error) {
        // Direct error logging for debugging
        console.log("🔍 ORDER FETCH ERROR - Type:", typeof error);
        console.log("🔍 ORDER FETCH ERROR - Constructor:", error?.constructor?.name);
        console.log("🔍 ORDER FETCH ERROR - Raw:", error);
        console.log("🔍 ORDER FETCH ERROR - Message:", error?.message);
        console.log("🔍 ORDER FETCH ERROR - Details:", error?.details);

        logError("Error fetching orders (Supabase query)", error, { activeTab });

        // Run diagnostics if it's a table-related error
        if (error?.message?.includes("does not exist") || error?.message?.includes("relation") || error?.code === "42P01") {
          console.log("🔍 Running orders table diagnostics due to table-related error...");
          runOrdersTableDiagnostics().catch(diagError => {
            console.error("Failed to run diagnostics:", diagError);
          });
        }

        // Simple error message extraction
        let errorMsg = 'Failed to load orders';
        if (error?.message) {
          errorMsg = error.message;
        } else if (error?.details) {
          errorMsg = error.details;
        } else if (typeof error === 'string') {
          errorMsg = error;
        }

        toast.error(errorMsg);
        return;
      }

      setOrders(data || []);
        } catch (error) {
      // Direct error logging for debugging
      console.log("🔍 ORDER FETCH CATCH ERROR - Type:", typeof error);
      console.log("🔍 ORDER FETCH CATCH ERROR - Raw:", error);
      console.log("🔍 ORDER FETCH CATCH ERROR - Message:", error?.message);

      logError("Error fetching orders (catch block)", error, { activeTab });

      // Simple error message extraction
      let errorMsg = 'Failed to load orders';
      if (error?.message) {
        errorMsg = error.message;
      } else if (typeof error === 'string') {
        errorMsg = error;
      }

      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const getUserRole = (order: Order): "buyer" | "seller" => {
    return order.buyer_id === user?.id ? "buyer" : "seller";
  };

  const getOrderStats = () => {
    const stats = {
      total: orders.length,
      pending: orders.filter((o) => ["pending", "confirmed"].includes(o.status))
        .length,
      active: orders.filter((o) =>
        ["confirmed", "dispatched"].includes(o.status),
      ).length,
      completed: orders.filter((o) => o.status === "delivered").length,
      cancelled: orders.filter((o) =>
        [
          "cancelled_by_buyer",
          "declined_by_seller",
          "cancelled_by_seller_after_missed_pickup",
        ].includes(o.status),
      ).length,
    };
    return stats;
  };

  const OrderCard: React.FC<{ order: Order }> = ({ order }) => {
    const userRole = getUserRole(order);
    const isMyPurchase = userRole === "buyer";

    return (
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold">
                {order.book?.title || "Unknown Book"}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Order #{order.id.slice(-8)}
              </p>
              <p className="text-sm text-gray-500">
                {isMyPurchase
                  ? `Seller: ${order.seller?.name}`
                  : `Buyer: ${order.buyer?.name}`}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold">R{order.total_amount}</p>
              <p className="text-xs text-gray-500">
                {new Date(order.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Order Status Alerts */}
          {order.delivery_status === "pickup_failed" &&
            userRole === "seller" && (
              <Alert className="border-orange-200 bg-orange-50">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  <strong>Action Required:</strong> Courier attempted pickup but
                  you were unavailable. Please reschedule or cancel the order
                  within 24 hours.
                </AlertDescription>
              </Alert>
            )}

          {order.delivery_status === "pickup_failed" &&
            userRole === "buyer" && (
              <Alert className="border-blue-200 bg-blue-50">
                <Clock className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Pickup Delayed:</strong> The seller missed the
                  scheduled pickup. They must reschedule or cancel. We'll update
                  you once they take action.
                </AlertDescription>
              </Alert>
            )}

          {order.delivery_status === "rescheduled_by_seller" && (
            <Alert className="border-blue-200 bg-blue-50">
              <Calendar className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Pickup Rescheduled:</strong> New pickup date:{" "}
                {order.pickup_scheduled_at
                  ? new Date(order.pickup_scheduled_at).toLocaleDateString(
                      "en-ZA",
                      {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      },
                    )
                  : "TBD"}
              </AlertDescription>
            </Alert>
          )}

          {/* Delivery Timeline */}
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  ["confirmed", "dispatched", "delivered"].includes(
                    order.status,
                  )
                    ? "bg-green-500"
                    : "bg-gray-300"
                }`}
              />
              <span>Confirmed</span>
            </div>
            <div className="flex-1 h-px bg-gray-200" />
            <div className="flex items-center space-x-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  ["dispatched", "delivered"].includes(order.status)
                    ? "bg-green-500"
                    : order.delivery_status === "pickup_failed"
                      ? "bg-red-500"
                      : "bg-gray-300"
                }`}
              />
              <span>Pickup</span>
            </div>
            <div className="flex-1 h-px bg-gray-200" />
            <div className="flex items-center space-x-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  order.status === "delivered" ? "bg-green-500" : "bg-gray-300"
                }`}
              />
              <span>Delivered</span>
            </div>
          </div>

          {/* Order Actions */}
          <OrderActionsPanel
            order={order}
            userRole={userRole}
            onOrderUpdate={fetchOrders}
          />
        </CardContent>
      </Card>
    );
  };

  const stats = getOrderStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600">Loading orders...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Package className="h-6 w-6 mx-auto mb-2 text-gray-600" />
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-sm text-gray-600">Total Orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-6 w-6 mx-auto mb-2 text-yellow-600" />
            <p className="text-2xl font-bold">{stats.pending}</p>
            <p className="text-sm text-gray-600">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TruckIcon className="h-6 w-6 mx-auto mb-2 text-blue-600" />
            <p className="text-2xl font-bold">{stats.active}</p>
            <p className="text-sm text-gray-600">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-600" />
            <p className="text-2xl font-bold">{stats.completed}</p>
            <p className="text-sm text-gray-600">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-red-600" />
            <p className="text-2xl font-bold">{stats.cancelled}</p>
            <p className="text-sm text-gray-600">Cancelled</p>
          </CardContent>
        </Card>
      </div>

      {/* Orders Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All Orders</TabsTrigger>
          <TabsTrigger value="pending">
            Pending
            {stats.pending > 0 && (
              <Badge variant="secondary" className="ml-1">
                {stats.pending}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="active">
            Active
            {stats.active > 0 && (
              <Badge variant="secondary" className="ml-1">
                {stats.active}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {orders.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">No orders found</h3>
                <p className="text-gray-600">
                  {activeTab === "all"
                    ? "You haven't made any orders yet."
                    : `No ${activeTab} orders at the moment.`}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OrderManagementView;

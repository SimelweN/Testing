import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { 
  Clock, 
  CheckCircle, 
  Package, 
  Truck, 
  Home, 
  X,
  AlertTriangle,
  Info
} from "lucide-react";
import { OrderWithDetails, canCancelOrder, getOrderStatusDisplay } from "@/utils/orderManagementUtils";

interface OrderFlowStatusProps {
  order: OrderWithDetails;
  userId: string;
  onCancelOrder?: (orderId: string) => void;
  onViewDetails?: (orderId: string) => void;
}

const OrderFlowStatus: React.FC<OrderFlowStatusProps> = ({
  order,
  userId,
  onCancelOrder,
  onViewDetails
}) => {
  const isBuyer = order.buyer_id === userId;
  const isSeller = order.seller_id === userId;
  const statusDisplay = getOrderStatusDisplay(order.status);
  const cancelInfo = canCancelOrder(order, userId);

  // Define the order flow steps
  const steps = [
    {
      id: 'ordered',
      label: 'Order Placed',
      icon: CheckCircle,
      status: 'completed',
      description: 'Your order has been placed'
    },
    {
      id: 'pending_commit',
      label: 'Awaiting Confirmation',
      icon: Clock,
      status: order.status === 'pending_commit' ? 'current' : 
              ['committed', 'pending_delivery', 'in_transit', 'completed'].includes(order.status) ? 'completed' : 'pending',
      description: 'Seller has 48 hours to confirm'
    },
    {
      id: 'committed',
      label: 'Confirmed',
      icon: CheckCircle,
      status: order.status === 'committed' ? 'current' :
              ['pending_delivery', 'in_transit', 'completed'].includes(order.status) ? 'completed' : 'pending',
      description: 'Seller confirmed they have the book'
    },
    {
      id: 'pickup',
      label: 'Pickup Arranged',
      icon: Package,
      status: order.status === 'pending_delivery' ? 'current' :
              ['in_transit', 'completed'].includes(order.status) ? 'completed' : 'pending',
      description: 'Courier pickup scheduled'
    },
    {
      id: 'transit',
      label: 'In Transit',
      icon: Truck,
      status: order.status === 'in_transit' ? 'current' :
              order.status === 'completed' ? 'completed' : 'pending',
      description: 'Book is on its way to you'
    },
    {
      id: 'delivered',
      label: 'Delivered',
      icon: Home,
      status: order.status === 'completed' ? 'completed' : 'pending',
      description: 'Book delivered successfully'
    }
  ];

  // Handle cancelled orders
  if (order.status === 'cancelled') {
    return (
      <Card className="border-destructive/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center">
              <X className="w-5 h-5 mr-2 text-destructive" />
              Order Cancelled
            </CardTitle>
            <Badge variant="destructive">Cancelled</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This order was cancelled{order.cancelled_at && ` on ${new Date(order.cancelled_at).toLocaleDateString()}`}. 
              {isBuyer && " You received a full refund."}
            </AlertDescription>
          </Alert>
          {onViewDetails && (
            <Button 
              variant="outline" 
              onClick={() => onViewDetails(order.id)}
              className="mt-4"
            >
              View Details
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {order.book?.title} by {order.book?.author}
          </CardTitle>
          <Badge variant={statusDisplay.color}>
            {statusDisplay.label}
          </Badge>
        </div>
        <div className="text-sm text-muted-foreground">
          Order #{order.id.slice(0, 8)}... • R{(order.total_amount / 100).toFixed(2)}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Steps */}
        <div className="space-y-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = step.status === 'current';
            const isCompleted = step.status === 'completed';
            
            return (
              <div key={step.id} className="flex items-center space-x-3">
                <div className={`
                  flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center
                  ${isCompleted ? 'bg-green-100 border-green-500 text-green-600' :
                    isActive ? 'bg-blue-100 border-blue-500 text-blue-600' :
                    'bg-gray-100 border-gray-300 text-gray-400'}
                `}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className={`font-medium ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'}`}>
                    {step.label}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {step.description}
                  </div>
                </div>
                {isActive && (
                  <div className="flex-shrink-0">
                    <Clock className="w-4 h-4 text-blue-500 animate-pulse" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Order Info */}
        <div className="bg-muted/50 p-4 rounded-lg space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {isBuyer ? 'Seller' : 'Buyer'}:
            </span>
            <span>
              {isBuyer ? order.seller?.name : order.buyer?.name}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Order Date:</span>
            <span>{new Date(order.created_at).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Your Role:</span>
            <span>{isBuyer ? 'Buyer' : 'Seller'}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col space-y-2">
          {/* Cancel order button for buyers */}
          {isBuyer && cancelInfo.canCancel && onCancelOrder && (
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => onCancelOrder(order.id)}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel Order & Get Refund
            </Button>
          )}
          
          {/* Info for buyers who can't cancel */}
          {isBuyer && !cancelInfo.canCancel && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                {cancelInfo.reason}
              </AlertDescription>
            </Alert>
          )}

          {/* View details button */}
          {onViewDetails && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onViewDetails(order.id)}
            >
              View Full Details
            </Button>
          )}
        </div>

        {/* Order flow explanation for new users */}
        {order.status === 'pending_commit' && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>What happens next:</strong> The seller has 48 hours to confirm they have your book. 
              Once confirmed, we'll automatically arrange courier pickup and delivery. 
              You can cancel anytime before the book is collected for a full refund.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default OrderFlowStatus;

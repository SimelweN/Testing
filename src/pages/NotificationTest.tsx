import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { NotificationService } from '@/services/notificationService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  X, 
  Package, 
  ShoppingCart, 
  Truck,
  DollarSign,
  Clock,
  Bell
} from 'lucide-react';

const NotificationTest: React.FC = () => {
  const { user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);

  const sampleNotifications = [
    {
      type: 'success',
      title: '🛒 Order Confirmed!',
      message: 'Your order for "Introduction to Computer Science" has been confirmed. Total: R150.00. The seller will commit within 48 hours.',
      icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      color: 'bg-green-50 border-green-200'
    },
    {
      type: 'info',
      title: '📦 New Order Received!',
      message: 'Great news! You have received a new order for "Calculus Made Easy" worth R200.00. Please commit within 48 hours.',
      icon: <Package className="h-5 w-5 text-blue-500" />,
      color: 'bg-blue-50 border-blue-200'
    },
    {
      type: 'success',
      title: '✅ Order Confirmed',
      message: 'Your order for "Physics Fundamentals" has been confirmed by the seller. Pickup will be scheduled.',
      icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      color: 'bg-green-50 border-green-200'
    },
    {
      type: 'info',
      title: '📦 Your Order Has Shipped!',
      message: 'Great news! Your order for "Biology Textbook" has been shipped and is on its way to you. Tracking: CG12345678',
      icon: <Truck className="h-5 w-5 text-blue-500" />,
      color: 'bg-blue-50 border-blue-200'
    },
    {
      type: 'info',
      title: '🚚 Your Order is on the Way!',
      message: 'Good news! Your order for "Chemistry Lab Manual" is now in transit and on its way to you. Expected delivery: 1-3 business days.',
      icon: <Truck className="h-5 w-5 text-blue-500" />,
      color: 'bg-blue-50 border-blue-200'
    },
    {
      type: 'info',
      title: '🚛 Your Order is Out for Delivery!',
      message: 'Your order for "Mathematics Workbook" is out for delivery and should arrive today! Please be available to receive it.',
      icon: <Truck className="h-5 w-5 text-blue-500" />,
      color: 'bg-blue-50 border-blue-200'
    },
    {
      type: 'success',
      title: '✅ Order Delivered Successfully!',
      message: 'Excellent news! Your order for "History of South Africa" has been successfully delivered. Enjoy your purchase!',
      icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      color: 'bg-green-50 border-green-200'
    },
    {
      type: 'success',
      title: '📦 Order Collected Successfully!',
      message: 'Order for "Engineering Design" has been collected and is being shipped to the buyer.',
      icon: <Package className="h-5 w-5 text-green-500" />,
      color: 'bg-green-50 border-green-200'
    },
    {
      type: 'error',
      title: '❌ Order Cancelled',
      message: 'Your order has been cancelled by the seller. Refund processed and will appear in 3-5 business days.',
      icon: <X className="h-5 w-5 text-red-500" />,
      color: 'bg-red-50 border-red-200'
    },
    {
      type: 'error',
      title: '❌ Order Declined',
      message: 'Your order has been declined by the seller. Refund processed and will appear in 3-5 business days.',
      icon: <X className="h-5 w-5 text-red-500" />,
      color: 'bg-red-50 border-red-200'
    },
    {
      type: 'success',
      title: '💳 Payment Successful',
      message: 'Payment of R180.00 for "Statistics Textbook" has been processed successfully. Your order is now confirmed.',
      icon: <DollarSign className="h-5 w-5 text-green-500" />,
      color: 'bg-green-50 border-green-200'
    },
    {
      type: 'warning',
      title: '⏰ Commit to Sale Reminder',
      message: 'You have 12 hours remaining to commit to selling "Economics 101". Please complete your commitment to avoid order cancellation.',
      icon: <Clock className="h-5 w-5 text-yellow-500" />,
      color: 'bg-yellow-50 border-yellow-200'
    },
    {
      type: 'info',
      title: '🔔 Account Update',
      message: 'Your profile information has been successfully updated. Thank you for keeping your details current!',
      icon: <Info className="h-5 w-5 text-blue-500" />,
      color: 'bg-blue-50 border-blue-200'
    },
    {
      type: 'success',
      title: '🎉 Welcome to ReBooked!',
      message: 'Welcome to ReBooked Solutions! Your account has been created successfully. Start buying and selling textbooks today!',
      icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      color: 'bg-green-50 border-green-200'
    },
    {
      type: 'info',
      title: '📚 Auto-Expire: 5 books back on market',
      message: '5 books have been freed up and are back on the market! Total value: R750.00.',
      icon: <Bell className="h-5 w-5 text-blue-500" />,
      color: 'bg-blue-50 border-blue-200'
    }
  ];

  const createSampleNotifications = async () => {
    if (!user) {
      toast.error('Please log in to create sample notifications');
      return;
    }

    setIsCreating(true);
    
    try {
      // Create a few sample notifications for the current user
      const promises = sampleNotifications.slice(0, 8).map((notification, index) => 
        NotificationService.createNotification({
          userId: user.id,
          type: notification.type,
          title: notification.title,
          message: notification.message
        })
      );

      await Promise.all(promises);
      
      toast.success('Sample notifications created! Check your notification center.');
    } catch (error) {
      console.error('Error creating sample notifications:', error);
      toast.error('Failed to create sample notifications');
    } finally {
      setIsCreating(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Please log in to test the notification system.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">📱 Notification System Demo</h1>
        <p className="text-gray-600">
          This page shows examples of all the different types of notifications users receive in the ReBooked system.
        </p>
        
        <Button 
          onClick={createSampleNotifications}
          disabled={isCreating}
          size="lg"
          className="bg-book-600 hover:bg-book-700"
        >
          {isCreating ? 'Creating...' : 'Create Sample Notifications for Me'}
        </Button>
        
        <Alert className="max-w-2xl mx-auto">
          <Bell className="h-4 w-4" />
          <AlertDescription>
            Click the button above to add these sample notifications to your account. 
            Then check the notification icon in the header to see them in action!
          </AlertDescription>
        </Alert>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sampleNotifications.map((notification, index) => (
          <Card key={index} className={`cursor-pointer transition-all hover:shadow-md ${notification.color}`}>
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  {notification.icon}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-gray-900">
                        {notification.title}
                      </h4>
                      <p className="text-sm mt-1 text-gray-700">
                        {notification.message.length > 100
                          ? `${notification.message.substring(0, 100)}...`
                          : notification.message}
                      </p>
                    </div>
                    
                    <div className="flex flex-col items-end space-y-2 ml-4">
                      <Badge 
                        className={`text-white text-xs ${
                          notification.type === 'success' ? 'bg-green-500' :
                          notification.type === 'warning' ? 'bg-yellow-500' :
                          notification.type === 'error' ? 'bg-red-500' :
                          'bg-blue-500'
                        }`}
                      >
                        {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        Just now
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" title="Unread" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Types Implemented
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">✅ Order Flow Notifications</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• Order confirmations and receipts</li>
                <li>• New sale notifications for sellers</li>
                <li>• Commit confirmations</li>
                <li>• Payment confirmations</li>
                <li>• Order cancellations and declines</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">📦 Delivery Notifications</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• Shipment notifications</li>
                <li>• In transit updates</li>
                <li>• Out for delivery alerts</li>
                <li>• Delivery confirmations</li>
                <li>• Collection confirmations</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">⏰ System Notifications</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• Commit deadline reminders</li>
                <li>• Account updates</li>
                <li>• Welcome messages</li>
                <li>• Admin system alerts</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">🔧 Technical Features</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• Real-time updates via WebSocket</li>
                <li>• Database persistence</li>
                <li>• Email + in-app notifications</li>
                <li>• Read/unread status tracking</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationTest;

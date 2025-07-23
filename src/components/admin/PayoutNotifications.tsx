import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Bell, X, Eye, Clock, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface PayoutNotification {
  id: string;
  count: number;
  amount: number;
  lastUpdated: string;
}

interface PayoutNotificationsProps {
  className?: string;
}

export const PayoutNotifications: React.FC<PayoutNotificationsProps> = ({ className }) => {
  const [notification, setNotification] = useState<PayoutNotification | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkPendingPayouts();
    
    // Check for updates every 30 seconds
    const interval = setInterval(checkPendingPayouts, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const checkPendingPayouts = async () => {
    try {
      const { data: payouts, error } = await supabase
        .from('seller_payouts')
        .select('id, amount, request_date')
        .eq('status', 'pending')
        .order('request_date', { ascending: false });

      if (error) {
        // Handle specific errors without spamming console
        if (error.code === '42P01') {
          // Table doesn't exist - silently ignore
          console.log('Seller payouts table not found - skipping notifications');
        } else if (error.code === '42501') {
          // Permission denied - silently ignore for non-admin users
          console.log('No permission to access seller payouts - skipping notifications');
        } else {
          // Only log unexpected errors
          console.error('Error fetching pending payouts:', error.message);
        }
        setNotification(null);
        setIsVisible(false);
        return;
      }

      if (payouts && payouts.length > 0) {
        const totalAmount = payouts.reduce((sum, payout) => sum + payout.amount, 0);
        const lastUpdated = payouts[0].request_date;
        
        setNotification({
          id: `pending-payouts-${payouts.length}`,
          count: payouts.length,
          amount: totalAmount,
          lastUpdated
        });
        setIsVisible(true);
      } else {
        setNotification(null);
        setIsVisible(false);
      }
    } catch (error) {
      // Silently handle errors to prevent console spam
      // This is likely due to missing table or permissions
      setNotification(null);
      setIsVisible(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewPayouts = () => {
    setIsVisible(false);
    navigate('/admin');
    // Small delay to ensure navigation happens, then switch to payouts tab
    setTimeout(() => {
      // The admin dashboard should automatically show the seller payouts tab
      // You might need to add state management or URL params to auto-select the tab
    }, 100);
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (isLoading || !notification || !isVisible) {
    return null;
  }

  return (
    <Card className={`fixed top-20 right-4 z-50 w-80 shadow-lg border-orange-200 bg-orange-50 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-orange-100 rounded-full">
            <Bell className="h-5 w-5 text-orange-600" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-orange-900">
                Pending Payouts
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="h-6 w-6 p-0 text-orange-600 hover:text-orange-800"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-600" />
                <span className="text-sm text-orange-800">
                  {notification.count} payout request{notification.count !== 1 ? 's' : ''} awaiting approval
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-orange-600" />
                <span className="text-sm text-orange-800">
                  Total: R{notification.amount.toFixed(2)}
                </span>
              </div>
              
              <div className="text-xs text-orange-700">
                Last request: {new Date(notification.lastUpdated).toLocaleDateString()}
              </div>
            </div>
            
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                onClick={handleViewPayouts}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                <Eye className="h-3 w-3 mr-1" />
                Review Payouts
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDismiss}
                className="border-orange-300 text-orange-700 hover:bg-orange-100"
              >
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PayoutNotifications;

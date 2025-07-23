import React from "react";

interface PayoutNotificationsProps {
  className?: string;
}

export const PayoutNotifications: React.FC<PayoutNotificationsProps> = ({ className }) => {
  // Payout notifications disabled - all payments are manual
  return null;
};

export default PayoutNotifications;

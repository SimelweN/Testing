// Commission calculation functions
export const calculateCommission = (price: number): number => {
  return price * 0.1; // 10% commission
};

export const calculateSellerReceives = (price: number): number => {
  return price - calculateCommission(price);
};

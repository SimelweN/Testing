
export interface CartItem {
  id: string;
  bookId: string;
  title: string;
  author: string;
  price: number;
  imageUrl: string;
  sellerId: string;
  sellerName: string;
  quantity: number;
}

export interface CartContextType {
  items: CartItem[];
  addToCart: (book: any) => void;
  removeFromCart: (bookId: string) => void;
  updateQuantity: (bookId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
  getSellerTotals: () => { [sellerId: string]: { total: number; commission: number; sellerReceives: number; sellerName: string } };
}

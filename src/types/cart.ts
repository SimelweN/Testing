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

export interface SellerCart {
  sellerId: string;
  sellerName: string;
  items: CartItem[];
  totalPrice: number;
  createdAt: string;
}

export interface CartContextType {
  // Legacy single cart support (for backward compatibility)
  items: CartItem[];
  addToCart: (book: any) => void;
  removeFromCart: (bookId: string) => void;
  updateQuantity: (bookId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
  getSellerTotals: () => { [sellerId: string]: { total: number; commission: number; sellerReceives: number; sellerName: string } };

  // Multi-cart system
  sellerCarts: SellerCart[];
  getCartBySeller: (sellerId: string) => SellerCart | undefined;
  removeFromSellerCart: (sellerId: string, bookId: string) => void;
  clearSellerCart: (sellerId: string) => void;
  getTotalCarts: () => number;
  getActiveCart: () => SellerCart | undefined;
  setActiveCart: (sellerId: string) => void;
  activeCartId: string | null;
}

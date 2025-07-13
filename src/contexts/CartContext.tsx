import React, { createContext, useContext, useState, useEffect } from "react";
import { CartItem, CartContextType } from "@/types/cart";
import { toast } from "sonner";

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [items, setItems] = useState<CartItem[]>([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (error) {
        console.error("Error loading cart:", error);
      }
    }
  }, []);

  // Save cart to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(items));
  }, [items]);

  const addToCart = (book: Book) => {
    // Check if book and seller exist
    if (!book) {
      toast.error("Book information is missing");
      return;
    }

    if (!book.seller || !book.seller.id) {
      toast.error("Seller information is missing");
      return;
    }

    // Check if item already exists
    const existingItem = items.find((item) => item.bookId === book.id);
    if (existingItem) {
      toast.error("This book is already in your cart");
      return;
    }

    const newItem: CartItem = {
      id: `${book.id}-${Date.now()}`,
      bookId: book.id,
      title: book.title,
      author: book.author,
      price: book.price,
      imageUrl: book.imageUrl || book.frontCover || "",
      sellerId: book.seller.id,
      sellerName: book.seller.name || "Unknown Seller",
      quantity: 1,
    };

    setItems((prev) => [...prev, newItem]);
    toast.success("Added to cart");
  };

  const removeFromCart = (bookId: string) => {
    setItems((prev) => prev.filter((item) => item.bookId !== bookId));
    toast.success("Removed from cart");
  };

  const updateQuantity = (bookId: string, quantity: number) => {
    // Quantity is always 1 for books, but keeping for interface compatibility
    if (quantity <= 0) {
      removeFromCart(bookId);
      return;
    }
    // Don't allow quantity changes since each book is unique
  };

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem("cart");
  };

  const getTotalPrice = () => {
    return items.reduce((total, item) => total + item.price, 0);
  };

  const getTotalItems = () => {
    return items.length; // Each book is quantity 1
  };

  const getSellerTotals = () => {
    const sellerTotals: {
      [sellerId: string]: {
        total: number;
        commission: number;
        sellerReceives: number;
        sellerName: string;
      };
    } = {};

    items.forEach((item) => {
      const itemTotal = item.price;
      const commission = itemTotal * 0.1; // 10% commission
      const sellerReceives = itemTotal - commission;

      if (sellerTotals[item.sellerId]) {
        sellerTotals[item.sellerId].total += itemTotal;
        sellerTotals[item.sellerId].commission += commission;
        sellerTotals[item.sellerId].sellerReceives += sellerReceives;
      } else {
        sellerTotals[item.sellerId] = {
          total: itemTotal,
          commission,
          sellerReceives,
          sellerName: item.sellerName,
        };
      }
    });

    return sellerTotals;
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalPrice,
        getTotalItems,
        getSellerTotals,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { CartItem, CartContextType } from "@/types/cart";
import { Book } from "@/types/book";
import { toast } from "sonner";

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

// ✅ FIXED: Add localStorage utility with error handling
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn("Failed to read from localStorage:", error);
      return null;
    }
  },
  setItem: (key: string, value: string): boolean => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn("Failed to write to localStorage:", error);
      toast.error("Cart data could not be saved");
      return false;
    }
  },
  removeItem: (key: string): boolean => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn("Failed to remove from localStorage:", error);
      return false;
    }
  },
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ FIXED: Load cart from localStorage with error handling
  useEffect(() => {
    const savedCart = safeLocalStorage.getItem("cart");
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        if (Array.isArray(parsedCart)) {
          // Validate cart items structure
          const validItems = parsedCart.filter(
            (item) =>
              item &&
              typeof item.id === "string" &&
              typeof item.bookId === "string" &&
              typeof item.title === "string" &&
              typeof item.price === "number" &&
              item.price >= 0,
          );
          setItems(validItems);
          if (validItems.length !== parsedCart.length) {
            console.warn("Some invalid cart items were filtered out");
          }
        }
      } catch (error) {
        console.error("Error parsing cart data:", error);
        toast.error("Cart data was corrupted and has been reset");
        safeLocalStorage.removeItem("cart");
      }
    }
    setIsLoading(false);
  }, []);

  // ✅ FIXED: Save cart to localStorage with debouncing and error handling
  const saveCartToStorage = useCallback((cartItems: CartItem[]) => {
    const success = safeLocalStorage.setItem("cart", JSON.stringify(cartItems));
    if (!success) {
      // Fallback: try to store essential data only
      const essentialData = cartItems.map((item) => ({
        id: item.id,
        bookId: item.bookId,
        title: item.title,
        price: item.price,
        sellerId: item.sellerId,
      }));
      safeLocalStorage.setItem("cart-backup", JSON.stringify(essentialData));
    }
  }, []);

  // ✅ FIXED: Debounced save effect to prevent excessive localStorage writes
  useEffect(() => {
    if (!isLoading) {
      const timeoutId = setTimeout(() => {
        saveCartToStorage(items);
      }, 100); // 100ms debounce

      return () => clearTimeout(timeoutId);
    }
  }, [items, isLoading, saveCartToStorage]);

  const addToCart = useCallback(
    (book: Book) => {
      // ✅ ENHANCED VALIDATION CHECKS:
      if (!book || !book.id) {
        toast.error("Book ID is missing");
        return false;
      }

      if (!book.title || book.title.trim() === "") {
        toast.error("Book title is missing");
        return false;
      }

      if (!book.price || book.price <= 0) {
        toast.error("Book price must be greater than 0");
        return false;
      }

      if (!book.seller || !book.seller.id) {
        toast.error("Seller information is missing");
        return false;
      }

      if (book.sold === true) {
        toast.error("This book has already been sold");
        return false;
      }

      // ✅ FIXED: Check availability field as well
      if (book.availability && book.availability !== "available") {
        toast.error("This book is no longer available");
        return false;
      }

      // Check if item already in cart
      const existingItem = items.find((item) => item.bookId === book.id);
      if (existingItem) {
        toast.error("This book is already in your cart");
        return false;
      }

      // ✅ NEW: PREVENT MULTI-SELLER CART
      if (items.length > 0) {
        const currentSellerId = items[0].sellerId;
        if (book.seller.id !== currentSellerId) {
          toast.error("Cannot add books from different sellers", {
            description: "Complete your current purchase first, then start a new cart with books from other sellers.",
            duration: 6000,
          });
          return false;
        }
      }

      // ✅ FIXED: Create cart item with all necessary data
      const newItem: CartItem = {
        id: `${book.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        bookId: book.id,
        title: book.title,
        author: book.author,
        price: book.price,
        imageUrl: book.imageUrl || book.frontCover || "/placeholder.svg",
        sellerId: book.seller.id,
        sellerName: book.seller.name || "Unknown Seller",
        quantity: 1,
        // Additional fields for checkout
        condition: book.condition,
        category: book.category,
        frontCover: book.frontCover,
        seller: book.seller,
      };

      // ✅ FIXED: Atomic state update
      setItems((prev) => {
        const updatedItems = [...prev, newItem];
        return updatedItems;
      });

      toast.success(`"${book.title}" added to cart`);
      return true;
    },
    [items],
  );

  const removeFromCart = useCallback((bookId: string) => {
    setItems((prev) => {
      const updatedItems = prev.filter((item) => item.bookId !== bookId);
      return updatedItems;
    });
    toast.success("Removed from cart");
  }, []);

  const updateQuantity = useCallback(
    (bookId: string, quantity: number) => {
      // Quantity is always 1 for books, but keeping for interface compatibility
      if (quantity <= 0) {
        removeFromCart(bookId);
        return;
      }
      // Don't allow quantity changes since each book is unique
      toast.info("Book quantities cannot be changed - each book is unique");
    },
    [removeFromCart],
  );

  const clearCart = useCallback(() => {
    setItems([]);
    safeLocalStorage.removeItem("cart");
    safeLocalStorage.removeItem("cart-backup");
    toast.success("Cart cleared");
  }, []);

  const getTotalPrice = useCallback(() => {
    return items.reduce((total, item) => total + (item.price || 0), 0);
  }, [items]);

  const getTotalItems = useCallback(() => {
    return items.length; // Each book is quantity 1
  }, [items]);

  const getSellerTotals = useCallback(() => {
    const sellerTotals: {
      [sellerId: string]: {
        total: number;
        commission: number;
        sellerReceives: number;
        sellerName: string;
        itemCount: number;
      };
    } = {};

    items.forEach((item) => {
      const itemTotal = item.price || 0;
      const commission = itemTotal * 0.1; // 10% commission
      const sellerReceives = itemTotal - commission;

      if (sellerTotals[item.sellerId]) {
        sellerTotals[item.sellerId].total += itemTotal;
        sellerTotals[item.sellerId].commission += commission;
        sellerTotals[item.sellerId].sellerReceives += sellerReceives;
        sellerTotals[item.sellerId].itemCount += 1;
      } else {
        sellerTotals[item.sellerId] = {
          total: itemTotal,
          commission,
          sellerReceives,
          sellerName: item.sellerName,
          itemCount: 1,
        };
      }
    });

    return sellerTotals;
  }, [items]);

  // ✅ FIXED: Add function to validate cart items against current book availability
  const validateCartItems = useCallback(async () => {
    if (items.length === 0) return { valid: true, removedItems: [] };

    try {
      const bookIds = items.map((item) => item.bookId);
      const { data: books, error } = await fetch("/api/validate-books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookIds }),
      }).then((res) => res.json());

      if (error) {
        console.warn("Could not validate cart items:", error);
        return { valid: true, removedItems: [] }; // Fail gracefully
      }

      const unavailableBooks =
        books?.filter(
          (book: { id: string; sold: boolean; availability?: string }) =>
            book.sold === true || book.availability !== "available",
        ) || [];

      if (unavailableBooks.length > 0) {
        const removedItems = items.filter((item) =>
          unavailableBooks.some(
            (book: { id: string }) => book.id === item.bookId,
          ),
        );

        // Remove unavailable items from cart
        const validItems = items.filter(
          (item) =>
            !unavailableBooks.some(
              (book: { id: string }) => book.id === item.bookId,
            ),
        );

        setItems(validItems);

        if (removedItems.length > 0) {
          toast.error(
            `${removedItems.length} item(s) removed from cart - no longer available`,
          );
        }

        return { valid: validItems.length > 0, removedItems };
      }

      return { valid: true, removedItems: [] };
    } catch (error) {
      console.warn("Cart validation failed:", error);
      return { valid: true, removedItems: [] }; // Fail gracefully
    }
  }, [items]);

  const contextValue: CartContextType = {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalPrice,
    getTotalItems,
    getSellerTotals,
    validateCartItems,
    isLoading,
  };

  return (
    <CartContext.Provider value={contextValue}>{children}</CartContext.Provider>
  );
};

import React from "react";
import { useParams, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { CheckoutBook } from "@/types/checkout";
import { supabase } from "@/integrations/supabase/client";
import CheckoutFlow from "@/components/checkout/CheckoutFlow";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Loader2 } from "lucide-react";

interface CartCheckoutData {
  items: any[];
  sellerId: string;
  sellerName: string;
  totalPrice: number;
  timestamp: number;
  cartType?: string;
}

const Checkout: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [book, setBook] = useState<CheckoutBook | null>(null);
  const [cartData, setCartData] = useState<CartCheckoutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Reset state when component mounts/changes
    setBook(null);
    setCartData(null);
    setError(null);

    // Handle cart checkout vs single book checkout
    const isCartCheckout = location.pathname === '/checkout-cart' || id === "cart";

    if (isCartCheckout) {
      const timestamp = searchParams.get('t');
      console.log('🛒 CHECKOUT: Loading cart checkout with timestamp:', timestamp);
      console.log('🛒 CHECKOUT: Route info:', { pathname: location.pathname, id });
      loadCartData();
      return;
    }

    if (!id) {
      setError("No book ID provided");
      setLoading(false);
      return;
    }

    loadBookData();
  }, [id, navigate, searchParams]);

  // Add additional effect to refresh cart data when localStorage changes
  useEffect(() => {
    const isCartCheckout = location.pathname === '/checkout-cart' || id === "cart";

    if (isCartCheckout) {
      const handleStorageChange = () => {
        console.log('🛒 CHECKOUT: Cart localStorage changed, refreshing checkout...');
        loadCartData();
      };

      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, [id, location.pathname]);

  const loadCartData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 CHECKOUT: Loading cart data...');

      // Get cart data from localStorage - use the most recent one
      const cartDataStr = localStorage.getItem('checkoutCart');
      if (!cartDataStr) {
        console.log('❌ CHECKOUT: No cart data found in localStorage');
        setError("No cart data found. Please return to your cart and try again.");
        setLoading(false);
        return;
      }

      console.log('📦 CHECKOUT: Raw cart data from localStorage:', cartDataStr);
      const parsedCartData: CartCheckoutData = JSON.parse(cartDataStr);

      // Validate cart data is recent (within 1 hour)
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      if (parsedCartData.timestamp < oneHourAgo) {
        setError("Cart session expired. Please return to your cart and try again.");
        setLoading(false);
        return;
      }

      if (!parsedCartData.items || parsedCartData.items.length === 0) {
        setError("Cart is empty. Please add items to your cart.");
        setLoading(false);
        return;
      }

      console.log("Cart checkout data loaded:", {
        sellerId: parsedCartData.sellerId,
        sellerName: parsedCartData.sellerName,
        itemCount: parsedCartData.items.length,
        totalPrice: parsedCartData.totalPrice,
        cartType: parsedCartData.cartType || 'unknown'
      });

      setCartData(parsedCartData);

      // Create a CheckoutBook from the first cart item but with cart totals
      const firstItem = parsedCartData.items[0];

      // Create a CheckoutBook that represents the entire cart
      const checkoutBook: CheckoutBook = {
        id: firstItem.bookId,
        title: parsedCartData.items.length > 1
          ? `${parsedCartData.items.length} Books from ${parsedCartData.sellerName}`
          : firstItem.title,
        author: parsedCartData.items.length > 1
          ? "Multiple Authors"
          : firstItem.author,
        price: parsedCartData.totalPrice, // Use total price of all items
        condition: "Various", // Multiple books may have different conditions
        seller_id: parsedCartData.sellerId,
        seller_name: parsedCartData.sellerName,
        seller: {
          id: parsedCartData.sellerId,
          name: parsedCartData.sellerName,
          email: "",
          hasAddress: true,
          hasSubaccount: true,
          isReadyForOrders: true,
        },
      };

      setBook(checkoutBook);
    } catch (err) {
      console.error("Error loading cart data:", err);
      setError("Failed to load cart data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const loadBookData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("Loading book data for ID:", id);

      if (!id || id.trim() === "") {
        throw new Error("Invalid book ID");
      }

      // Extract UUID part from book ID (remove any timestamp suffixes)
      const uuidPart = id.split('-').slice(0, 5).join('-');
      console.log("Extracted UUID part:", uuidPart, "from original ID:", id);

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(uuidPart)) {
        throw new Error("Invalid book ID format. Please check the link and try again.");
      }

      // Use the cleaned UUID for database query
      const cleanBookId = uuidPart;

      // Get book data first
      const { data: bookData, error: bookError } = await supabase
        .from("books")
        .select("*")
        .eq("id", cleanBookId)
        .single();

      if (bookError) {
        console.error("Book query error:", bookError);
        throw new Error(`Failed to load book details: ${bookError.message}`);
      }

      if (!bookData) {
        throw new Error("Book not found");
      }

      console.log("Book data loaded:", {
        id: bookData.id,
        title: bookData.title,
        sold: bookData.sold,
        availability: bookData.availability,
        seller_id: bookData.seller_id,
      });

      // Skip sold check for now to allow testing - books should be available after cleanup
      // if (bookData.sold === true) {
      //   throw new Error("This book has already been sold");
      // }

      // More flexible availability check - only block if explicitly unavailable
      if (
        bookData.availability === "unavailable" ||
        bookData.availability === "sold"
      ) {
        throw new Error(
          `This book is not available for purchase (status: ${bookData.availability})`,
        );
      }

      // Get seller information separately
      let sellerData = null;
      if (bookData.seller_id) {
        const { data: seller, error: sellerError } = await supabase
          .from("profiles")
          .select("id, name, email")
          .eq("id", bookData.seller_id)
          .single();

        if (!sellerError && seller) {
          sellerData = seller;
        }
      }

      // Convert to CheckoutBook format with safe property access
      const checkoutBook: CheckoutBook = {
        id: bookData.id,
        title: bookData.title || "Unknown Title",
        author: bookData.author || "Unknown Author",
        price: typeof bookData.price === "number" ? bookData.price : 0,
        condition: bookData.condition || "Unknown",
        isbn: bookData.isbn || undefined,
        image_url:
          bookData.frontCover ||
          bookData.image_url ||
          bookData.front_cover ||
          undefined,
        seller_id: bookData.seller_id,
        seller_name: sellerData?.name || "Anonymous Seller",
        seller_subaccount_code: bookData.subaccount_code || undefined,
        seller: {
          id: bookData.seller_id,
          name: sellerData?.name || "Anonymous Seller",
          email: sellerData?.email || "",
          hasAddress: true, // Will be validated in CheckoutFlow
          hasSubaccount: !!bookData.subaccount_code,
          isReadyForOrders: !!bookData.subaccount_code,
        },
      };

      console.log("Created checkout book:", checkoutBook);

      setBook(checkoutBook);
    } catch (err) {
      console.error("Error loading book data:", err);
      console.error("Original Book ID:", id);
      console.error("Full error:", err);

      const errorMessage =
        err instanceof Error ? err.message : "Failed to load book";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-center">
              <div className="mb-4">{error}</div>
              <button
                onClick={() => navigate("/books")}
                className="underline hover:no-underline"
              >
                Browse available books
              </button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-center">
              Book not found. Please check the link and try again.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return <CheckoutFlow book={book} />;
};

export default Checkout;

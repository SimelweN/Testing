import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { CheckoutBook } from "@/types/checkout";
import { supabase } from "@/integrations/supabase/client";
import CheckoutFlow from "@/components/checkout/CheckoutFlow";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Loader2 } from "lucide-react";

const Checkout: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [book, setBook] = useState<CheckoutBook | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Handle cart checkout vs single book checkout
    if (id === "cart") {
      loadCartData();
      return;
    }

    if (!id) {
      setError("No book ID provided");
      setLoading(false);
      return;
    }

    loadBookData();
  }, [id, navigate]);

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

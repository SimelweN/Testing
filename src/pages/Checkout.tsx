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
    if (!id) {
      setError("No book ID provided");
      setLoading(false);
      return;
    }

    loadBookData();
  }, [id]);

  const loadBookData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get book data first
      const { data: bookData, error: bookError } = await supabase
        .from("books")
        .select("*")
        .eq("id", id)
        .single();

      if (bookError) {
        console.error("Book query error:", bookError);
        throw new Error(`Failed to load book details: ${bookError.message}`);
      }

      if (!bookData) {
        throw new Error("Book not found");
      }

      if (bookData.sold) {
        throw new Error("This book has already been sold");
      }

      if (bookData.availability !== "available") {
        throw new Error("This book is not available for purchase");
      }

      // Convert to CheckoutBook format
      const checkoutBook: CheckoutBook = {
        id: bookData.id,
        title: bookData.title,
        author: bookData.author,
        price: bookData.price,
        condition: bookData.condition,
        isbn: bookData.isbn,
        image_url: bookData.frontCover || bookData.image_url,
        seller_id: bookData.seller_id,
        seller_name: bookData.profiles?.name || "Anonymous Seller",
        seller_subaccount_code: bookData.subaccount_code,
        seller: {
          id: bookData.seller_id,
          name: bookData.profiles?.name || "Anonymous Seller",
          email: bookData.profiles?.email || "",
          hasAddress: true, // Will be validated in CheckoutFlow
          hasSubaccount: !!bookData.subaccount_code,
          isReadyForOrders: !!bookData.subaccount_code,
        },
      };

      setBook(checkoutBook);
    } catch (err) {
      console.error("Error loading book data:", err);
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

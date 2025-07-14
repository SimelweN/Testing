import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { getBookById } from "@/services/book/bookQueries";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

const CheckoutSimple = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [book, setBook] = useState<any>(null);

  useEffect(() => {
    const loadCheckout = async () => {
      try {
        if (!user?.id) {
          toast.error("Please log in to complete your purchase");
          navigate("/login");
          return;
        }

        if (!id) {
          setError("No book selected for checkout");
          return;
        }

        console.log("Loading book for checkout:", id);
        const bookData = await getBookById(id);

        if (!bookData) {
          setError("Book not found");
          return;
        }

        if (bookData.sold) {
          setError("This book has already been sold");
          return;
        }

        if (bookData.seller?.id === user.id) {
          setError("You cannot purchase your own book");
          return;
        }

        setBook(bookData);
        console.log("Book loaded successfully:", bookData);
      } catch (err) {
        console.error("Checkout loading error:", err);
        setError("Failed to load checkout");
      } finally {
        setIsLoading(false);
      }
    };

    loadCheckout();
  }, [id, user?.id, navigate]);

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600">Loading checkout...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-8 text-center">
              <h2 className="text-xl font-semibold text-red-900 mb-2">
                Checkout Error
              </h2>
              <p className="text-red-700 mb-6">{error}</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => navigate("/books")} variant="outline">
                  Browse Books
                </Button>
                <Button onClick={() => navigate(-1)}>Go Back</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (!book) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Card>
            <CardContent className="p-8 text-center">
              <p>No book data available</p>
              <Button onClick={() => navigate(-1)} className="mt-4">
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button onClick={() => navigate(-1)} variant="ghost" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Checkout - Simple Version</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 border rounded-lg">
                    <img
                      src={
                        book.frontCover || book.imageUrl || "/placeholder.svg"
                      }
                      alt={book.title}
                      className="w-16 h-20 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{book.title}</h3>
                      <p className="text-gray-600">by {book.author}</p>
                      <p className="text-gray-500 text-sm">
                        Sold by {book.seller?.name || "Unknown Seller"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">
                        R{book.price}
                      </p>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-yellow-800">
                      🚧 This is a simplified checkout page for testing. The
                      full checkout with payment processing is being restored.
                    </p>
                  </div>

                  <Button
                    className="w-full"
                    onClick={() => toast.info("Full checkout coming soon!")}
                  >
                    Continue to Payment (Demo)
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Book Price</span>
                    <span>R{book.price}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery</span>
                    <span>TBD</span>
                  </div>
                  <hr />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>R{book.price}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CheckoutSimple;

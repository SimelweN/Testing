import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Trash2, Info } from "lucide-react";
import { toast } from "sonner";

const Cart = () => {
  const { items, removeFromCart, clearCart, getTotalPrice, getSellerTotals } =
    useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }

  const sellerTotals = getSellerTotals();
  const totalPrice = getTotalPrice();

  const handleCheckout = async () => {
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setIsProcessing(true);
    try {
      // For now, redirect to single book checkout for first item
      // TODO: Implement proper multi-book cart checkout
      if (items.length === 1) {
        navigate(`/checkout/${items[0].id}`);
      } else {
        // For multiple items, we'll handle each separately for now
        toast.info("Processing multiple items - checking out first book");
        navigate(`/checkout/${items[0].id}`);
      }
    } catch (error) {
      toast.error("Failed to proceed to checkout");
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6 text-book-600"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>

          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-semibold mb-4">
                Your cart is empty
              </h2>
              <p className="text-gray-600 mb-6">
                Add some books to get started!
              </p>
              <Button
                onClick={() => navigate("/books")}
                className="bg-book-600 hover:bg-book-700"
              >
                Browse Books
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-4 md:py-8 max-w-6xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="text-book-600 p-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold">Shopping Cart</h1>
          </div>
          <Button variant="outline" onClick={clearCart} className="text-sm">
            Clear Cart
          </Button>
        </div>

        {/* Single-Seller Policy Info */}
        <Alert className="border-blue-200 bg-blue-50 mb-6">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Single-Seller Cart Policy:</strong> You can only purchase books from one seller at a time.
            This ensures faster delivery and avoids double delivery charges, as each seller ships from a different location.
            Complete your current purchase, then start a new cart for books from other sellers.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items - Single Seller */}
          <div className="lg:col-span-2 space-y-6">
            {/* Get the first (and only) seller */}
            {(() => {
              const [sellerId, seller] = Object.entries(sellerTotals)[0];
              const sellerItems = items.filter(
                (item) => item.sellerId === sellerId,
              );

              return (
                <Card className="border-2 border-book-200">
                  <CardHeader className="bg-book-50 rounded-t-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-lg">
                          {seller.sellerName}'s Store
                        </CardTitle>
                        <p className="text-sm text-gray-600">
                          {sellerItems.length} item(s)
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/seller/${sellerId}`)}
                        className="text-book-600 border-book-600 hover:bg-book-50"
                      >
                        Visit Store
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    {sellerItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex gap-4 p-3 bg-gray-50 rounded-lg"
                      >
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-16 h-20 md:w-20 md:h-28 object-cover rounded flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm md:text-base truncate">
                            {item.title}
                          </h3>
                          <p className="text-gray-600 text-xs md:text-sm truncate">
                            by {item.author}
                          </p>
                          <p className="font-bold text-book-600 mt-2 text-sm md:text-base">
                            R{item.price}
                          </p>
                        </div>
                        <div className="flex flex-col items-end justify-between">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromCart(item.bookId)}
                            className="p-2"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <div className="text-xs text-gray-500">Qty: 1</div>
                        </div>
                      </div>
                    ))}

                    {/* Seller Subtotal */}
                    <div className="border-t pt-3 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">
                          Subtotal:
                        </span>
                        <span className="font-bold text-book-600">
                          R{seller.total.toFixed(2)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        • Seller receives: R{seller.sellerReceives.toFixed(2)}{" "}
                        (90%)
                      </div>
                      <div className="text-xs text-gray-600">
                        • Platform fee: R{seller.commission.toFixed(2)} (10%)
                      </div>
                      <div className="text-xs text-orange-600 mt-2">
                        📦 Delivery charges will be calculated at checkout
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })()}
          </div>

          {/* Order Summary */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg md:text-xl">
                  Order Summary
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Single-seller checkout from {Object.values(sellerTotals)[0]?.sellerName}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-green-50 p-3 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">
                    ✅ Benefits of single-seller checkout:
                  </h4>
                  <ul className="text-xs text-green-800 space-y-1">
                    <li>• Faster delivery from one location</li>
                    <li>• Single delivery fee (no double charges)</li>
                    <li>• One tracking number to follow</li>
                    <li>• Simpler order management</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Books subtotal:</span>
                    <span className="text-sm">R{totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Delivery fee:</span>
                    <span className="text-sm text-orange-600">
                      Calculated at checkout
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-base md:text-lg font-bold">
                      Current Total
                    </span>
                    <span className="text-base md:text-lg font-bold">
                      R{totalPrice.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 text-center">
                    + delivery fee (shown at checkout)
                  </p>
                </div>

                <Button
                  onClick={handleCheckout}
                  disabled={isProcessing}
                  className="w-full bg-book-600 hover:bg-book-700 text-sm md:text-base py-2 md:py-3"
                >
                  {isProcessing
                    ? "Processing..."
                    : "Proceed to Checkout"}
                </Button>

                <div className="bg-blue-50 p-3 rounded-lg mt-4">
                  <p className="text-xs text-blue-800">
                    💡 <strong>Want books from other sellers?</strong><br/>
                    Complete this purchase first, then browse and add books from other sellers to a new cart.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Cart;

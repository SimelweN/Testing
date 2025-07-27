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
  const {
    items,
    removeFromCart,
    clearCart,
    getTotalPrice,
    getSellerTotals,
    sellerCarts,
    removeFromSellerCart,
    clearSellerCart,
    getTotalCarts,
    getActiveCart,
    setActiveCart,
    activeCartId
  } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }

  const sellerTotals = getSellerTotals();
  const totalPrice = getTotalPrice();
  const totalCarts = getTotalCarts();
  const hasMultipleCarts = totalCarts > 1;
  const activeCart = getActiveCart();

  const handleCheckout = async (sellerId?: string) => {
    let cartToCheckout = null;
    let itemsToCheckout = [];
    let actualSellerId = sellerId;

    if (sellerId) {
      // Explicit seller cart checkout
      cartToCheckout = sellerCarts.find(cart => cart.sellerId === sellerId);
      if (!cartToCheckout) {
        toast.error("Selected cart not found");
        return;
      }
      itemsToCheckout = cartToCheckout.items;
      actualSellerId = cartToCheckout.sellerId;
    } else {
      // Legacy cart checkout (items array)
      if (items.length === 0) {
        toast.error("Cart is empty");
        return;
      }
      itemsToCheckout = items;
      actualSellerId = items[0]?.sellerId;
    }

    if (itemsToCheckout.length === 0) {
      toast.error("Selected cart is empty");
      return;
    }

    setIsProcessing(true);
    try {
      if (itemsToCheckout.length === 1) {
        // Single item checkout
        navigate(`/checkout/${itemsToCheckout[0].bookId}`);
      } else {
        // Multiple items from same seller - store cart data and navigate to cart checkout
        const checkoutCartData = {
          items: itemsToCheckout,
          sellerId: actualSellerId,
          sellerName: cartToCheckout?.sellerName || (Object.values(getSellerTotals())[0]?.sellerName),
          totalPrice: cartToCheckout?.totalPrice || getTotalPrice(),
          timestamp: Date.now(),
          cartType: sellerId ? 'seller-cart' : 'legacy-cart' // Add identifier
        };

        // Use a unique key that includes seller info to avoid conflicts
        const storageKey = `checkoutCart_${actualSellerId}_${Date.now()}`;
        localStorage.setItem('checkoutCart', JSON.stringify(checkoutCartData));
        localStorage.setItem('activeCheckoutKey', storageKey); // Store which cart is being checked out

        toast.success(`Proceeding to checkout with ${itemsToCheckout.length} books from ${checkoutCartData.sellerName}`);
        navigate('/checkout/cart');
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Failed to proceed to checkout");
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0 && sellerCarts.length === 0) {
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

        {/* Multi-Cart Policy Info */}
        {hasMultipleCarts ? (
          <Alert className="border-orange-200 bg-orange-50 mb-6">
            <Info className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>Multiple Seller Carts:</strong> You have books from {totalCarts} different sellers.
              You can only checkout one seller at a time to ensure proper delivery coordination.
              Choose which seller's cart to checkout first below.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="border-blue-200 bg-blue-50 mb-6">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Single-Seller Cart:</strong> All items are from the same seller, ensuring
              faster delivery and no double delivery charges.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items - Multiple Sellers or Single Seller */}
          <div className="lg:col-span-2 space-y-6">

            {/* Legacy single cart */}
            {items.length > 0 && (() => {
              const [sellerId, seller] = Object.entries(sellerTotals)[0];
              const sellerItems = items.filter(
                (item) => item.sellerId === sellerId,
              );

              return (
                <Card className={`border-2 ${!hasMultipleCarts ? 'border-book-200' : 'border-gray-200'}`}>
                  <CardHeader className={`${!hasMultipleCarts ? 'bg-book-50' : 'bg-gray-50'} rounded-t-lg`}>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-lg">
                          {seller.sellerName}'s Store
                        </CardTitle>
                        <p className="text-sm text-gray-600">
                          {sellerItems.length} item(s)
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/seller/${sellerId}`)}
                          className="text-book-600 border-book-600 hover:bg-book-50"
                        >
                          Visit Store
                        </Button>
                        {hasMultipleCarts && (
                          <Button
                            size="sm"
                            onClick={() => handleCheckout()}
                            className="bg-book-600 hover:bg-book-700"
                          >
                            Checkout This Cart
                          </Button>
                        )}
                      </div>
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

            {/* Multi-seller carts */}
            {sellerCarts.map((cart) => (
              <Card
                key={cart.sellerId}
                className={`border-2 ${activeCartId === cart.sellerId ? 'border-book-200 bg-book-25' : 'border-gray-200'}`}
              >
                <CardHeader className={`${activeCartId === cart.sellerId ? 'bg-book-50' : 'bg-gray-50'} rounded-t-lg`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {cart.sellerName}'s Store
                        {activeCartId === cart.sellerId && (
                          <span className="text-xs bg-book-600 text-white px-2 py-1 rounded-full">
                            Active
                          </span>
                        )}
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        {cart.items.length} item(s) • R{cart.totalPrice.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/seller/${cart.sellerId}`)}
                        className="text-book-600 border-book-600 hover:bg-book-50"
                      >
                        Visit Store
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleCheckout(cart.sellerId)}
                        className="bg-book-600 hover:bg-book-700"
                      >
                        Checkout This Cart
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  {cart.items.map((item) => (
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
                          onClick={() => removeFromSellerCart(cart.sellerId, item.bookId)}
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
                        R{cart.totalPrice.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      • Seller receives: R{(cart.totalPrice * 0.9).toFixed(2)} (90%)
                    </div>
                    <div className="text-xs text-gray-600">
                      • Platform fee: R{(cart.totalPrice * 0.1).toFixed(2)} (10%)
                    </div>
                    <div className="text-xs text-orange-600 mt-2">
                      📦 Delivery charges will be calculated at checkout
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg md:text-xl">
                  {hasMultipleCarts ? 'Multiple Carts Summary' : 'Order Summary'}
                </CardTitle>
                <p className="text-sm text-gray-600">
                  {hasMultipleCarts
                    ? `${totalCarts} separate carts from different sellers`
                    : `Single-seller checkout from ${Object.values(sellerTotals)[0]?.sellerName || (sellerCarts[0]?.sellerName)}`
                  }
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {hasMultipleCarts ? (
                  <>
                    <div className="bg-orange-50 p-3 rounded-lg">
                      <h4 className="font-medium text-orange-900 mb-2">
                        🛒 Multiple Seller Carts:
                      </h4>
                      <div className="space-y-2">
                        {/* Legacy cart */}
                        {items.length > 0 && Object.entries(sellerTotals).map(([sellerId, seller]) => (
                          <div key={sellerId} className="flex justify-between items-center text-xs">
                            <span>{seller.sellerName}</span>
                            <span className="font-medium">R{seller.total.toFixed(2)}</span>
                          </div>
                        ))}
                        {/* Seller carts */}
                        {sellerCarts.map((cart) => (
                          <div key={cart.sellerId} className="flex justify-between items-center text-xs">
                            <span>{cart.sellerName}</span>
                            <span className="font-medium">R{cart.totalPrice.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-blue-50 p-3 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">
                        📋 How to checkout:
                      </h4>
                      <ul className="text-xs text-blue-800 space-y-1">
                        <li>1. Choose which seller's cart to checkout first</li>
                        <li>2. Click "Checkout This Cart" on the desired seller</li>
                        <li>3. Complete payment and delivery for that seller</li>
                        <li>4. Return to checkout remaining carts</li>
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Total across all carts:</span>
                        <span className="text-sm font-medium">
                          R{(totalPrice + sellerCarts.reduce((sum, cart) => sum + cart.totalPrice, 0)).toFixed(2)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 text-center">
                        Note: Each cart will have separate delivery fees
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <h4 className="font-medium text-green-900 mb-2">
                        ✅ Single-seller benefits:
                      </h4>
                      <ul className="text-xs text-green-800 space-y-1">
                        <li>• Faster delivery from one location</li>
                        <li>• Single delivery fee (no multiple charges)</li>
                        <li>• One tracking number to follow</li>
                        <li>• Simpler order management</li>
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Books subtotal:</span>
                        <span className="text-sm">
                          R{(totalPrice + sellerCarts.reduce((sum, cart) => sum + cart.totalPrice, 0)).toFixed(2)}
                        </span>
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
                          R{(totalPrice + sellerCarts.reduce((sum, cart) => sum + cart.totalPrice, 0)).toFixed(2)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 text-center">
                        + delivery fee (shown at checkout)
                      </p>
                    </div>

                    <Button
                      onClick={() => handleCheckout()}
                      disabled={isProcessing}
                      className="w-full bg-book-600 hover:bg-book-700 text-sm md:text-base py-2 md:py-3"
                    >
                      {isProcessing
                        ? "Processing..."
                        : "Proceed to Checkout"}
                    </Button>
                  </>
                )}

                <div className="bg-blue-50 p-3 rounded-lg mt-4">
                  <p className="text-xs text-blue-800">
                    💡 <strong>Want to add more books?</strong><br/>
                    {hasMultipleCarts
                      ? 'Books from new sellers will create additional carts automatically.'
                      : 'Books from other sellers will create separate carts for organized checkout.'
                    }
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

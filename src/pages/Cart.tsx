
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const Cart = () => {
  const { items, removeFromCart, clearCart, getTotalPrice, getSellerTotals } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  const sellerTotals = getSellerTotals();
  const totalPrice = getTotalPrice();

  const handleCheckout = async () => {
    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setIsProcessing(true);
    try {
      navigate('/checkout/cart', { state: { cartItems: items } });
    } catch (error) {
      toast.error('Failed to proceed to checkout');
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 text-book-600">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-semibold mb-4">Your cart is empty</h2>
              <p className="text-gray-600 mb-6">Add some books to get started!</p>
              <Button onClick={() => navigate('/books')} className="bg-book-600 hover:bg-book-700">
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
            <Button variant="ghost" onClick={() => navigate(-1)} className="text-book-600 p-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold">Shopping Cart</h1>
          </div>
          <Button variant="outline" onClick={clearCart} className="text-sm">
            Clear Cart
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-16 h-20 md:w-20 md:h-28 object-cover rounded flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm md:text-base truncate">{item.title}</h3>
                      <p className="text-gray-600 text-xs md:text-sm truncate">by {item.author}</p>
                      <p className="text-xs md:text-sm text-gray-500 truncate">Seller: {item.sellerName}</p>
                      <p className="font-bold text-book-600 mt-2 text-sm md:text-base">R{item.price}</p>
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
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg md:text-xl">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(sellerTotals).map(([sellerId, seller]) => (
                  <div key={sellerId} className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium text-sm truncate">{seller.sellerName}</p>
                    <p className="text-sm text-gray-600">Items: R{seller.total.toFixed(2)}</p>
                  </div>
                ))}
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-base md:text-lg font-bold">Total</span>
                    <span className="text-base md:text-lg font-bold">R{totalPrice.toFixed(2)}</span>
                  </div>
                </div>

                <Button
                  onClick={handleCheckout}
                  disabled={isProcessing}
                  className="w-full bg-book-600 hover:bg-book-700 text-sm md:text-base py-2 md:py-3"
                >
                  {isProcessing ? 'Processing...' : `Checkout - R${totalPrice.toFixed(2)}`}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Cart;

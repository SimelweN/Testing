import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useNavigate } from 'react-router-dom';

const CartButton = () => {
  const { getTotalItems, sellerCarts } = useCart();
  const navigate = useNavigate();
  const legacyItemCount = getTotalItems();
  const sellerCartItemCount = sellerCarts.reduce((total, cart) => total + cart.items.length, 0);
  const itemCount = legacyItemCount + sellerCartItemCount;

  return (
    <Button
      variant="ghost"
      className="relative"
      onClick={() => navigate('/cart')}
    >
      <ShoppingCart className="h-5 w-5" />
      {itemCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-book-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
          {itemCount}
        </span>
      )}
    </Button>
  );
};

export default CartButton;

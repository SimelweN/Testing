
import { Card, CardContent } from '@/components/ui/card';

interface BookPricingProps {
  price: number;
  commission: number;
  sellerReceives: number;
  showCommissionDetails: boolean;
}

const BookPricing = ({ price, commission, sellerReceives, showCommissionDetails }: BookPricingProps) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="text-center">
          <div className="text-3xl font-bold text-green-600 mb-2">
            R{price.toFixed(2)}
          </div>
          {showCommissionDetails && (
            <div className="text-sm text-gray-500">
              Commission: R{commission.toFixed(2)} | Seller receives: R{sellerReceives.toFixed(2)}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BookPricing;

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Star } from "lucide-react";

interface CheckoutItem {
  id: string;
  title: string;
  author: string;
  price: number;
  condition: string;
  category: string;
  imageUrl: string;
  seller: {
    id: string;
    name: string;
    email: string;
  };
}

interface CheckoutItemCardProps {
  item: CheckoutItem;
  isCompact?: boolean;
}

const CheckoutItemCard = ({
  item,
  isCompact = false,
}: CheckoutItemCardProps) => {
  if (isCompact) {
    return (
      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
        <img
          src={item.imageUrl}
          alt={item.title}
          className="w-12 h-16 object-cover rounded shadow-sm"
          onError={(e) => {
            e.currentTarget.src = "/placeholder.svg";
          }}
        />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate text-gray-900">
            {item.title}
          </p>
          <p className="text-xs text-gray-500 truncate">by {item.author}</p>
          <div className="flex items-center gap-1 mt-1">
            <Badge variant="secondary" className="text-xs px-1 py-0">
              {item.condition}
            </Badge>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-book-600">R{item.price}</p>
        </div>
      </div>
    );
  }

  return (
    <Card className="overflow-hidden border-book-100 hover:shadow-lg transition-all duration-200">
      <CardContent className="p-0">
        <div className="flex items-center gap-4 p-4">
          {/* Book Image */}
          <div className="relative flex-shrink-0">
            <img
              src={item.imageUrl}
              alt={item.title}
              className="w-20 h-28 md:w-24 md:h-32 object-cover rounded-lg shadow-md"
              onError={(e) => {
                e.currentTarget.src = "/placeholder.svg";
              }}
            />
            <div className="absolute -top-2 -right-2">
              <Badge variant="secondary" className="text-xs font-medium">
                {item.condition}
              </Badge>
            </div>
          </div>

          {/* Book Details */}
          <div className="flex-1 min-w-0 space-y-2">
            <div>
              <h3 className="font-semibold text-lg text-gray-900 line-clamp-2 leading-tight">
                {item.title}
              </h3>
              <p className="text-gray-600 text-sm mt-1">by {item.author}</p>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {item.category}
              </Badge>
            </div>

            {/* Seller Info */}
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <User className="h-3 w-3" />
              <span className="truncate">Sold by {item.seller.name}</span>
            </div>

            {/* Rating placeholder - could be enhanced with actual ratings */}
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${
                    i < 4 ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                  }`}
                />
              ))}
              <span className="text-xs text-gray-500 ml-1">(4.0)</span>
            </div>
          </div>

          {/* Price */}
          <div className="text-right flex-shrink-0">
            <div className="bg-book-50 px-3 py-2 rounded-lg border border-book-200">
              <p className="text-2xl font-bold text-book-600">R{item.price}</p>
              <p className="text-xs text-book-500">including VAT</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CheckoutItemCard;

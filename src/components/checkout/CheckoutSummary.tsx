import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Package, MapPin, Truck, CreditCard } from "lucide-react";

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

interface CheckoutAddress {
  street: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
}

interface DeliveryQuote {
  courier: string;
  price: number;
  estimatedDays: number;
  serviceName: string;
}

interface CheckoutSummaryProps {
  items: CheckoutItem[];
  shippingAddress?: CheckoutAddress | null;
  selectedDelivery?: DeliveryQuote | null;
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  currentStep: string;
}

const CheckoutSummary = ({
  items,
  shippingAddress,
  selectedDelivery,
  subtotal,
  deliveryFee,
  totalAmount,
  currentStep,
}: CheckoutSummaryProps) => {
  return (
    <Card className="sticky top-8 shadow-lg border-book-100">
      <CardHeader className="bg-gradient-to-r from-book-50 to-book-100 rounded-t-lg">
        <CardTitle className="flex items-center gap-2 text-book-800">
          <Package className="h-5 w-5" />
          Order Summary
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Items Preview */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
            <Package className="h-4 w-4" />
            Items ({items.length})
          </h4>

          <div className="space-y-3 max-h-64 overflow-y-auto">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
              >
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
                  <p className="text-xs text-gray-500 truncate">
                    by {item.author}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <Badge variant="secondary" className="text-xs px-1 py-0">
                      {item.condition}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-book-600">
                    R{item.price}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator className="bg-book-200" />

        {/* Pricing Breakdown */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Price Breakdown
          </h4>

          <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                Subtotal ({items.length} {items.length === 1 ? "item" : "items"}
                )
              </span>
              <span className="font-medium">R{(subtotal || 0).toFixed(2)}</span>
            </div>

            {selectedDelivery ? (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">
                  Delivery ({selectedDelivery.serviceName})
                </span>
                <span className="font-medium">R{deliveryFee.toFixed(2)}</span>
              </div>
            ) : currentStep === "delivery" || currentStep === "payment" ? (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Delivery</span>
                <span className="text-gray-400 italic">Select option</span>
              </div>
            ) : null}

            <Separator className="my-2" />

            <div className="flex justify-between text-base font-bold">
              <span>Total</span>
              <span className="text-book-600">R{totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Shipping Address Preview */}
        {shippingAddress && (
          <>
            <Separator className="bg-book-200" />
            <div>
              <h4 className="font-semibold text-sm mb-3 text-gray-700 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Shipping Address
              </h4>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-800 leading-relaxed">
                  {shippingAddress.street}
                  <br />
                  {shippingAddress.city}, {shippingAddress.province}
                  <br />
                  {shippingAddress.postalCode}
                  <br />
                  {shippingAddress.country}
                </p>
              </div>
            </div>
          </>
        )}

        {/* Delivery Method Preview */}
        {selectedDelivery && (
          <>
            <Separator className="bg-book-200" />
            <div>
              <h4 className="font-semibold text-sm mb-3 text-gray-700 flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Delivery Method
              </h4>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm font-medium text-blue-900">
                  {selectedDelivery.serviceName}
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Estimated delivery: {selectedDelivery.estimatedDays} days
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Via {selectedDelivery.courier}
                </p>
              </div>
            </div>
          </>
        )}

        {/* Security Badge */}
        <div className="bg-gray-50 border rounded-lg p-3">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
            <span>Secure checkout powered by Paystack</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CheckoutSummary;

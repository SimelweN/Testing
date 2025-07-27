import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, User, MapPin, ArrowRight, X } from "lucide-react";
import { CheckoutBook, CheckoutAddress } from "@/types/checkout";

interface Step1OrderSummaryProps {
  book: CheckoutBook;
  sellerAddress: CheckoutAddress | null;
  onNext: () => void;
  onCancel?: () => void;
  loading?: boolean;
}

const Step1OrderSummary: React.FC<Step1OrderSummaryProps> = ({
  book,
  sellerAddress,
  onNext,
  onCancel,
  loading = false,
}) => {
  // Check for cart data from localStorage
  const getCartData = () => {
    try {
      const cartDataStr = localStorage.getItem('checkoutCart');
      if (cartDataStr) {
        const cartData = JSON.parse(cartDataStr);
        // Validate cart data is recent (within 1 hour)
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        if (cartData.timestamp && cartData.timestamp > oneHourAgo) {
          return cartData;
        }
      }
    } catch (error) {
      console.error("Error parsing cart data:", error);
    }
    return null;
  };

  const cartData = getCartData();
  const isCartCheckout = cartData && cartData.items && cartData.items.length > 1;
  return (
    <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6 px-4 sm:px-0">
      <div className="text-center mb-4 sm:mb-8">
        <h1 className="text-xl sm:text-3xl font-bold text-gray-900 mb-2">Order Summary</h1>
        <p className="text-sm sm:text-base text-gray-600">
          {isCartCheckout
            ? `Review your ${cartData.items.length} books from ${cartData.sellerName}`
            : "Review your book purchase details"
          }
        </p>
      </div>

      {/* Book Details Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            {isCartCheckout ? `Books in Your Order (${cartData.items.length})` : 'Book Details'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isCartCheckout ? (
            <div className="space-y-4">
              {cartData.items.map((item: any, index: number) => (
                <div key={item.id || index} className={`flex flex-col sm:flex-row gap-3 sm:gap-4 ${index > 0 ? 'pt-4 border-t' : ''}`}>
                  {item.imageUrl && (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-16 h-20 sm:w-20 sm:h-26 object-cover rounded-lg border mx-auto sm:mx-0 flex-shrink-0"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.svg";
                      }}
                    />
                  )}
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="text-sm sm:text-base font-semibold mb-1">{item.title}</h3>
                    <p className="text-xs sm:text-sm text-gray-600 mb-2">by {item.author}</p>
                    <div className="text-lg sm:text-xl font-bold text-green-600">
                      R{item.price.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total Amount:</span>
                  <span className="text-xl sm:text-2xl font-bold text-green-600">
                    R{cartData.totalPrice.toFixed(2)}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  {cartData.items.length} books from {cartData.sellerName}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              {book.image_url && (
                <img
                  src={book.image_url}
                  alt={book.title}
                  className="w-20 h-24 sm:w-24 sm:h-32 object-cover rounded-lg border mx-auto sm:mx-0 flex-shrink-0"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.svg";
                  }}
                />
              )}
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-base sm:text-lg font-semibold mb-2">{book.title}</h3>
                <p className="text-sm sm:text-base text-gray-600 mb-2">by {book.author}</p>
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-3 flex-wrap">
                  <Badge variant="outline" className="text-xs sm:text-sm">{book.condition}</Badge>
                  {book.isbn && (
                    <span className="text-xs sm:text-sm text-gray-500">
                      ISBN: {book.isbn}
                    </span>
                  )}
                </div>
                <div className="text-xl sm:text-2xl font-bold text-green-600">
                  R{book.price.toFixed(2)}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Seller Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Seller Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <p className="font-medium">
                {isCartCheckout ? cartData.sellerName : (book.seller_name || "Anonymous Seller")}
              </p>
              <p className="text-sm text-gray-600">
                Seller ID: {isCartCheckout ? cartData.sellerId : book.seller_id}
              </p>
              {isCartCheckout && (
                <p className="text-sm text-blue-600 mt-1">
                  ✅ All {cartData.items.length} books are from this seller
                </p>
              )}
            </div>

            {sellerAddress && (
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-1 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">Location</p>
                  <p className="text-sm text-gray-600">
                    {sellerAddress.city}, {sellerAddress.province}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-6">
        <Button
          onClick={onCancel}
          variant="outline"
          disabled={loading}
          className="px-6 py-3"
        >
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>

        <Button
          onClick={onNext}
          disabled={loading}
          className="px-8 py-3 text-lg"
          size="lg"
        >
          {loading ? (
            "Loading..."
          ) : (
            <>
              Next: Delivery Options
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default Step1OrderSummary;

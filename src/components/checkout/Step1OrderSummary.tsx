import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, User, MapPin, ArrowRight } from "lucide-react";
import { CheckoutBook, CheckoutAddress } from "@/types/checkout";

interface Step1OrderSummaryProps {
  book: CheckoutBook;
  sellerAddress: CheckoutAddress | null;
  onNext: () => void;
  loading?: boolean;
}

const Step1OrderSummary: React.FC<Step1OrderSummaryProps> = ({
  book,
  sellerAddress,
  onNext,
  loading = false,
}) => {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Summary</h1>
        <p className="text-gray-600">Review your book purchase details</p>
      </div>

      {/* Book Details Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Book Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            {book.image_url && (
              <img
                src={book.image_url}
                alt={book.title}
                className="w-24 h-32 object-cover rounded-lg border"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg";
                }}
              />
            )}
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">{book.title}</h3>
              <p className="text-gray-600 mb-2">by {book.author}</p>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline">{book.condition}</Badge>
                {book.isbn && (
                  <span className="text-sm text-gray-500">
                    ISBN: {book.isbn}
                  </span>
                )}
              </div>
              <div className="text-2xl font-bold text-green-600">
                R{book.price.toFixed(2)}
              </div>
            </div>
          </div>
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
                {book.seller_name || "Anonymous Seller"}
              </p>
              <p className="text-sm text-gray-600">
                Seller ID: {book.seller_id}
              </p>
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

      {/* Next Button */}
      <div className="flex justify-center pt-6">
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

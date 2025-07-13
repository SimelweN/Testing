import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import {
  Truck,
  Clock,
  Shield,
  CheckCircle,
  AlertCircle,
  Package,
  MapPin,
  Calendar,
} from "lucide-react";
import {
  getAllDeliveryQuotes,
  UnifiedQuoteRequest,
  UnifiedQuote,
} from "@/services/unifiedDeliveryService";
import { toast } from "sonner";

interface DeliveryQuoteComparisonProps {
  request: UnifiedQuoteRequest;
  onQuoteSelected: (quote: UnifiedQuote) => void;
  onCancel?: () => void;
}

const DeliveryQuoteComparison: React.FC<DeliveryQuoteComparisonProps> = ({
  request,
  onQuoteSelected,
  onCancel,
}) => {
  const [quotes, setQuotes] = useState<UnifiedQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<UnifiedQuote | null>(null);

  useEffect(() => {
    fetchQuotes();
  }, [request]);

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("Fetching delivery quotes for:", request);

      const quotesData = await getAllDeliveryQuotes(request);
      setQuotes(quotesData);

      if (quotesData.length === 0) {
        setError("No delivery quotes available for this route");
      }
    } catch (err) {
      console.error("Error fetching quotes:", err);
      setError("Failed to fetch delivery quotes. Please try again.");
      toast.error("Failed to get delivery quotes");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectQuote = (quote: UnifiedQuote) => {
    setSelectedQuote(quote);
    onQuoteSelected(quote);
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case "courier-guy":
        return "🚚";
      case "fastway":
        return "📦";
      case "shiplogic":
        return "🏢";
      default:
        return "🚛";
    }
  };

  const getServiceBadgeColor = (serviceCode: string) => {
    if (serviceCode.includes("EXPRESS") || serviceCode.includes("OVERNIGHT")) {
      return "bg-red-100 text-red-700 border-red-200";
    } else if (serviceCode.includes("STANDARD")) {
      return "bg-blue-100 text-blue-700 border-blue-200";
    } else {
      return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center p-8">
          <LoadingSpinner />
          <span className="ml-2">Getting delivery quotes...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="flex flex-col items-center justify-center p-8">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Unable to Get Quotes
          </h3>
          <p className="text-gray-600 text-center mb-4">{error}</p>
          <div className="flex gap-2">
            <Button onClick={fetchQuotes} variant="outline">
              Try Again
            </Button>
            {onCancel && (
              <Button onClick={onCancel} variant="ghost">
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Compare Delivery Options
        </h2>
        <p className="text-gray-600">
          Choose the best delivery option for your package
        </p>
      </div>

      {/* Route Summary */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              <span className="text-sm text-blue-800">
                {request.from.city} → {request.to.city}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-blue-600" />
              <span className="text-sm text-blue-800">{request.weight}kg</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quotes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {quotes.map((quote, index) => (
          <Card
            key={index}
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
              selectedQuote?.provider === quote.provider &&
              selectedQuote?.service_code === quote.service_code
                ? "ring-2 ring-blue-500 bg-blue-50"
                : "hover:bg-gray-50"
            }`}
            onClick={() => handleSelectQuote(quote)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">
                    {getProviderIcon(quote.provider)}
                  </span>
                  <div>
                    <CardTitle className="text-lg">
                      {quote.provider_name}
                    </CardTitle>
                    <p className="text-sm text-gray-600">
                      {quote.service_name}
                    </p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={getServiceBadgeColor(quote.service_code)}
                >
                  {quote.service_code}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Price */}
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">
                  R{quote.cost.toFixed(2)}
                </div>
                {quote.cost_breakdown && (
                  <div className="text-sm text-gray-500">
                    Excl. VAT: R{quote.cost_breakdown.base_cost.toFixed(2)}
                  </div>
                )}
              </div>

              <Separator />

              {/* Transit Time */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Delivery</span>
                </div>
                <span className="text-sm font-medium">
                  {quote.transit_days} day{quote.transit_days !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Collection Cutoff */}
              {quote.collection_cutoff && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Cutoff</span>
                  </div>
                  <span className="text-sm font-medium">
                    {quote.collection_cutoff}
                  </span>
                </div>
              )}

              {/* Features */}
              <div className="space-y-2">
                {quote.features.slice(0, 3).map((feature, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-gray-600">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Terms */}
              {quote.terms && (
                <div className="text-xs text-gray-500 italic">
                  {quote.terms}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No Quotes Message */}
      {quotes.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Truck className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Delivery Options Available
            </h3>
            <p className="text-gray-600 text-center">
              We couldn't find any delivery options for this route. Please check
              your addresses and try again.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-center space-x-3">
        <Button onClick={fetchQuotes} variant="outline" disabled={loading}>
          Refresh Quotes
        </Button>
        {onCancel && (
          <Button onClick={onCancel} variant="ghost">
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
};

export default DeliveryQuoteComparison;

import { getCourierGuyQuote } from "@/services/courierGuyService";
import { getShipLogicQuickQuote } from "@/services/shipLogicService";

export interface ShippingProvider {
  id: "courierGuy" | "shipLogic" | "unified";
  name: string;
  description: string;
  logo: string;
  features: string[];
  serviceTypes: ServiceType[];
  color: string;
}

export interface ServiceType {
  code: string;
  name: string;
  description: string;
  estimatedDays: number;
  features: string[];
}

export interface QuickQuoteRequest {
  fromCity: string;
  toCity: string;
  weight: number;
}

export interface QuickQuoteResponse {
  provider: "courierGuy" | "shipLogic" | "unified";
  price: number;
  estimatedDays: number;
  serviceName: string;
  currency: string;
}

export const SHIPPING_PROVIDERS: ShippingProvider[] = [
  {
    id: "courierGuy",
    name: "Courier Guy",
    description:
      "Established local courier service with reliable delivery across South Africa",
    logo: "🚚",
    features: [
      "Local South African courier",
      "Reliable tracking system",
      "Cost-effective for local deliveries",
      "Established network nationwide",
      "Good for standard deliveries",
    ],
    serviceTypes: [
      {
        code: "STANDARD",
        name: "Standard",
        description: "Regular delivery service",
        estimatedDays: 3,
        features: ["Standard tracking", "Cost-effective", "Reliable"],
      },
    ],
    color: "blue",
  },
  {
    id: "shipLogic",
    name: "ShipLogic",
    description:
      "Advanced logistics platform with multiple service levels and comprehensive tracking",
    logo: "📦",
    features: [
      "Multiple service levels available",
      "Real-time tracking with events",
      "Professional waybill generation",
      "API-first comprehensive integration",
      "Flexible delivery options",
    ],
    serviceTypes: [
      {
        code: "ECO",
        name: "Economy",
        description: "Standard delivery service (3-5 business days)",
        estimatedDays: 4,
        features: ["Cost-effective", "Standard tracking", "3-5 business days"],
      },
      {
        code: "STD",
        name: "Standard",
        description: "Reliable delivery service (2-3 business days)",
        estimatedDays: 3,
        features: ["Faster delivery", "Enhanced tracking", "2-3 business days"],
      },
      {
        code: "EXP",
        name: "Express",
        description: "Fast delivery service (1-2 business days)",
        estimatedDays: 2,
        features: [
          "Next-day delivery",
          "Priority handling",
          "1-2 business days",
        ],
      },
      {
        code: "OVN",
        name: "Overnight",
        description: "Next business day delivery",
        estimatedDays: 1,
        features: ["Guaranteed next day", "Premium service", "1 business day"],
      },
    ],
    color: "green",
  },
];

/**
 * Get quick quotes from all available providers
 */
export const getAllQuickQuotes = async (
  request: QuickQuoteRequest,
): Promise<QuickQuoteResponse[]> => {
  const quotes: QuickQuoteResponse[] = [];

  try {
    // Get Courier Guy quote
    const courierGuyQuote = await getCourierGuyQuote(
      request.fromCity,
      request.toCity,
      request.weight,
    );

    quotes.push({
      provider: "courierGuy",
      price: courierGuyQuote.price,
      estimatedDays: courierGuyQuote.estimatedDays,
      serviceName: "Standard",
      currency: "ZAR",
    });
  } catch (error) {
    console.error("Error getting Courier Guy quote:", error);
  }

  try {
    // Get ShipLogic quote
    const shipLogicQuote = await getShipLogicQuickQuote(
      request.fromCity,
      request.toCity,
      request.weight,
    );

    quotes.push({
      provider: "shipLogic",
      price: shipLogicQuote.price,
      estimatedDays: shipLogicQuote.estimatedDays,
      serviceName: shipLogicQuote.serviceName,
      currency: "ZAR",
    });
  } catch (error) {
    console.error("Error getting ShipLogic quote:", error);
  }

  return quotes;
};

/**
 * Compare providers and return recommendations
 */
export const compareProviders = (
  quotes: QuickQuoteResponse[],
): {
  cheapest: QuickQuoteResponse | null;
  fastest: QuickQuoteResponse | null;
  recommended: QuickQuoteResponse | null;
} => {
  if (quotes.length === 0) {
    return { cheapest: null, fastest: null, recommended: null };
  }

  // Find cheapest
  const cheapest = quotes.reduce((prev, current) =>
    current.price < prev.price ? current : prev,
  );

  // Find fastest
  const fastest = quotes.reduce((prev, current) =>
    current.estimatedDays < prev.estimatedDays ? current : prev,
  );

  // Recommendation logic: balance of price and speed
  const recommended = quotes.reduce((prev, current) => {
    const prevScore = 1 / prev.estimatedDays + 1000 / prev.price;
    const currentScore = 1 / current.estimatedDays + 1000 / current.price;
    return currentScore > prevScore ? current : prev;
  });

  return { cheapest, fastest, recommended };
};

/**
 * Format currency for display
 */
export const formatCurrency = (
  amount: number,
  currency: string = "ZAR",
): string => {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: currency,
  }).format(amount);
};

/**
 * Get provider by ID
 */
export const getProviderById = (
  id: "courierGuy" | "shipLogic",
): ShippingProvider | undefined => {
  return SHIPPING_PROVIDERS.find((provider) => provider.id === id);
};

/**
 * Get service type by provider and code
 */
export const getServiceType = (
  providerId: "courierGuy" | "shipLogic",
  serviceCode: string,
): ServiceType | undefined => {
  const provider = getProviderById(providerId);
  return provider?.serviceTypes.find((service) => service.code === serviceCode);
};

/**
 * Validate South African postal code
 */
export const validateSAPostalCode = (postalCode: string): boolean => {
  const postalCodeRegex = /^[0-9]{4}$/;
  return postalCodeRegex.test(postalCode);
};

/**
 * Validate South African phone number
 */
export const validateSAPhoneNumber = (phoneNumber: string): boolean => {
  // Remove spaces and special characters
  const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, "");

  // South African phone number patterns
  const patterns = [
    /^(\+27|0)[1-9][0-9]{8}$/, // Standard landline and mobile
    /^(\+27|0)[6-8][0-9]{8}$/, // Mobile specific
  ];

  return patterns.some((pattern) => pattern.test(cleanPhone));
};

/**
 * Get estimated delivery date
 */
export const getEstimatedDeliveryDate = (
  collectionDate: Date,
  estimatedDays: number,
): Date => {
  const deliveryDate = new Date(collectionDate);
  deliveryDate.setDate(deliveryDate.getDate() + estimatedDays);

  // Skip weekends (basic implementation)
  while (deliveryDate.getDay() === 0 || deliveryDate.getDay() === 6) {
    deliveryDate.setDate(deliveryDate.getDate() + 1);
  }

  return deliveryDate;
};

/**
 * Calculate package dimensions for textbooks
 */
export const getDefaultBookDimensions = (
  weight: number,
): {
  length: number;
  width: number;
  height: number;
} => {
  // Default dimensions based on weight
  if (weight <= 0.5) {
    return { length: 20, width: 15, height: 3 }; // Small textbook
  } else if (weight <= 1.5) {
    return { length: 25, width: 20, height: 5 }; // Standard textbook
  } else if (weight <= 3) {
    return { length: 30, width: 25, height: 8 }; // Large textbook or multiple books
  } else {
    return { length: 35, width: 30, height: 10 }; // Very large or multiple books
  }
};

/**
 * Generate tracking URL for different providers
 */
export const getTrackingUrl = (
  provider: "courierGuy" | "shipLogic",
  trackingNumber: string,
): string => {
  switch (provider) {
    case "courierGuy":
      // Courier Guy tracking would go to their website
      return `https://www.courierguy.co.za/track/${trackingNumber}`;
    case "shipLogic":
      // ShipLogic tracking through their system
      return `https://track.shiplogic.com/${trackingNumber}`;
    default:
      return "#";
  }
};

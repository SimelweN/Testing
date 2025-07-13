import { supabase } from "@/integrations/supabase/client";

// Fastway API Types
export interface FastwayAddress {
  company?: string;
  contact: string;
  phone: string;
  email?: string;
  addr1: string;
  addr2?: string;
  city: string;
  province: string;
  postcode: string;
  country: string;
}

export interface FastwayParcel {
  reference: string;
  weight: number; // in kg
  length?: number; // in cm
  width?: number; // in cm
  height?: number; // in cm
  description: string;
  value?: number; // for insurance
}

export interface FastwayShipmentRequest {
  collection: FastwayAddress;
  delivery: FastwayAddress;
  parcels: FastwayParcel[];
  service_type: "Standard" | "Express" | "Overnight";
  collection_date?: string; // YYYY-MM-DD
  special_instructions?: string;
  require_signature?: boolean;
  insurance?: boolean;
  reference?: string;
}

export interface FastwayQuoteRequest {
  collection_postcode: string;
  delivery_postcode: string;
  weight: number;
  length?: number;
  width?: number;
  height?: number;
  service_type?: string;
}

export interface FastwayQuoteResponse {
  service_code: string;
  service_name: string;
  cost: number;
  cost_ex_gst: number;
  gst: number;
  transit_days: number;
  collection_cutoff?: string;
  delivery_guarantee?: string;
}

export interface FastwayShipment {
  consignment_id: string;
  tracking_number: string;
  barcode: string;
  labels: string[]; // Base64 encoded labels
  cost: number;
  service_code: string;
  collection_date: string;
  estimated_delivery_date: string;
  reference?: string;
}

export interface FastwayTrackingEvent {
  timestamp: string;
  status: string;
  location: string;
  description: string;
  signature?: string;
}

export interface FastwayTrackingResponse {
  tracking_number: string;
  status:
    | "pending"
    | "collected"
    | "in_transit"
    | "out_for_delivery"
    | "delivered"
    | "failed";
  current_location?: string;
  estimated_delivery: string;
  actual_delivery?: string;
  events: FastwayTrackingEvent[];
  recipient_signature?: string;
  proof_of_delivery?: string;
}

// Service type mappings
export const FASTWAY_SERVICE_TYPES = {
  standard: {
    code: "STANDARD",
    name: "Standard",
    description: "2-3 business days delivery",
    features: ["Standard tracking", "Reliable delivery", "Cost effective"],
  },
  express: {
    code: "EXPRESS",
    name: "Express",
    description: "Next business day delivery",
    features: ["Next day delivery", "Priority handling", "Enhanced tracking"],
  },
  overnight: {
    code: "OVERNIGHT",
    name: "Overnight",
    description: "Same day or overnight delivery",
    features: ["Urgent delivery", "Same day option", "Premium service"],
  },
};

/**
 * Get delivery quotes from Fastway Couriers
 */
export const getFastwayQuote = async (
  fromPostcode: string,
  toPostcode: string,
  weight: number,
  dimensions?: { length: number; width: number; height: number },
): Promise<FastwayQuoteResponse[]> => {
  try {
    console.log("Getting Fastway quote:", {
      fromPostcode,
      toPostcode,
      weight,
      dimensions,
    });

    const quoteRequest: FastwayQuoteRequest = {
      collection_postcode: fromPostcode,
      delivery_postcode: toPostcode,
      weight,
      ...dimensions,
    };

    const { data, error } = await supabase.functions.invoke("fastway-quote", {
      body: quoteRequest,
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (error) {
      console.error("Fastway quote error:", error);
      throw new Error(`Failed to get Fastway quote: ${error.message}`);
    }

    if (!data || !data.quotes) {
      console.warn("No Fastway quotes returned, using fallback");
      return generateFallbackFastwayQuotes(weight);
    }

    console.log("Fastway quotes received:", data.quotes);
    return data.quotes;
  } catch (error) {
    console.error("Error getting Fastway quote:", error);
    // Return fallback quotes for development
    return generateFallbackFastwayQuotes(weight);
  }
};

/**
 * Create a shipment with Fastway Couriers
 */
export const createFastwayShipment = async (
  shipmentData: FastwayShipmentRequest,
): Promise<FastwayShipment> => {
  try {
    console.log("Creating Fastway shipment:", shipmentData);

    const { data, error } = await supabase.functions.invoke(
      "fastway-shipment",
      {
        body: shipmentData,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (error) {
      console.error("Fastway shipment creation error:", error);
      throw new Error(`Failed to create Fastway shipment: ${error.message}`);
    }

    if (!data || !data.shipment) {
      throw new Error("Invalid response from Fastway shipment API");
    }

    console.log("Fastway shipment created:", data.shipment);
    return data.shipment;
  } catch (error) {
    console.error("Error creating Fastway shipment:", error);
    throw error;
  }
};

/**
 * Track a Fastway shipment
 */
export const trackFastwayShipment = async (
  trackingNumber: string,
): Promise<FastwayTrackingResponse> => {
  try {
    console.log("Tracking Fastway shipment:", trackingNumber);

    const { data, error } = await supabase.functions.invoke(`fastway-track`, {
      body: { tracking_number: trackingNumber },
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (error) {
      console.error("Fastway tracking error:", error);
      throw new Error(`Failed to track Fastway shipment: ${error.message}`);
    }

    if (!data || !data.tracking) {
      throw new Error("Invalid response from Fastway tracking API");
    }

    console.log("Fastway tracking info:", data.tracking);
    return data.tracking;
  } catch (error) {
    console.error("Error tracking Fastway shipment:", error);
    throw error;
  }
};

/**
 * Get Fastway service areas (postcodes they deliver to)
 */
export const getFastwayServiceAreas = async (
  postcode?: string,
): Promise<string[]> => {
  try {
    console.log("Getting Fastway service areas for:", postcode);

    const { data, error } = await supabase.functions.invoke(
      "fastway-service-areas",
      {
        body: postcode ? { postcode } : {},
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (error) {
      console.error("Fastway service areas error:", error);
      throw new Error(`Failed to get Fastway service areas: ${error.message}`);
    }

    return data?.service_areas || [];
  } catch (error) {
    console.error("Error getting Fastway service areas:", error);
    // Return common South African postcodes as fallback
    return [
      "1000",
      "2000",
      "3000",
      "4000",
      "5000",
      "6000",
      "7000",
      "8000",
      "9000",
    ];
  }
};

/**
 * Generate fallback quotes for development/testing
 */
function generateFallbackFastwayQuotes(weight: number): FastwayQuoteResponse[] {
  const basePrice = Math.max(45, weight * 12);

  return [
    {
      service_code: "STANDARD",
      service_name: "Fastway Standard",
      cost: Math.round(basePrice * 1.15), // Include GST
      cost_ex_gst: basePrice,
      gst: Math.round(basePrice * 0.15),
      transit_days: 3,
      collection_cutoff: "16:00",
    },
    {
      service_code: "EXPRESS",
      service_name: "Fastway Express",
      cost: Math.round(basePrice * 1.4 * 1.15), // Include GST
      cost_ex_gst: Math.round(basePrice * 1.4),
      gst: Math.round(basePrice * 1.4 * 0.15),
      transit_days: 1,
      collection_cutoff: "14:00",
      delivery_guarantee: "Next business day",
    },
  ];
}

/**
 * Validate Fastway address format
 */
export const validateFastwayAddress = (
  address: Partial<FastwayAddress>,
): boolean => {
  return !!(
    address.contact &&
    address.phone &&
    address.addr1 &&
    address.city &&
    address.province &&
    address.postcode &&
    address.country
  );
};

/**
 * Format address for Fastway API
 */
export const formatAddressForFastway = (address: any): FastwayAddress => {
  return {
    contact: address.contactName || address.name || "Customer",
    phone: address.phone || address.phoneNumber || "+27000000000",
    email: address.email || "",
    addr1: `${address.unitNumber ? address.unitNumber + " " : ""}${address.streetAddress}`,
    addr2: address.complex || address.buildingName || "",
    city: address.city,
    province: address.province,
    postcode: address.postalCode,
    country: "ZA",
  };
};

/**
 * Calculate estimated delivery date
 */
export const calculateFastwayDeliveryDate = (
  serviceCode: string,
  collectionDate?: Date,
): Date => {
  const startDate = collectionDate || new Date();
  const service = Object.values(FASTWAY_SERVICE_TYPES).find(
    (s) => s.code === serviceCode,
  );

  let daysToAdd = 3; // Default
  switch (serviceCode) {
    case "EXPRESS":
    case "OVERNIGHT":
      daysToAdd = 1;
      break;
    case "STANDARD":
      daysToAdd = 3;
      break;
  }

  const deliveryDate = new Date(startDate);
  deliveryDate.setDate(deliveryDate.getDate() + daysToAdd);

  // Skip weekends
  while (deliveryDate.getDay() === 0 || deliveryDate.getDay() === 6) {
    deliveryDate.setDate(deliveryDate.getDate() + 1);
  }

  return deliveryDate;
};

export default {
  getFastwayQuote,
  createFastwayShipment,
  trackFastwayShipment,
  getFastwayServiceAreas,
  validateFastwayAddress,
  formatAddressForFastway,
  calculateFastwayDeliveryDate,
  FASTWAY_SERVICE_TYPES,
};

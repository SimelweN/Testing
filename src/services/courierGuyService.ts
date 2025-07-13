import { supabase } from "@/integrations/supabase/client";

export interface CourierGuyShipmentData {
  senderName: string;
  senderAddress: string;
  senderCity: string;
  senderProvince: string;
  senderPostalCode: string;
  senderPhone?: string;
  recipientName: string;
  recipientAddress: string;
  recipientCity: string;
  recipientProvince: string;
  recipientPostalCode: string;
  recipientPhone?: string;
  weight: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  description: string;
  value: number;
  reference?: string;
}

export interface CourierGuyShipment {
  id: string;
  tracking_number: string;
  status: string;
  created_at: string;
  collection: {
    name: string;
    address: {
      street: string;
      city: string;
      province: string;
      postal_code: string;
    };
  };
  delivery: {
    name: string;
    address: {
      street: string;
      city: string;
      province: string;
      postal_code: string;
    };
  };
  parcels: Array<{
    weight: number;
    dimensions: {
      length: number;
      width: number;
      height: number;
    };
    description: string;
    value: number;
  }>;
  reference: string;
  service_type: string;
  estimated_delivery_date?: string;
}

export interface CourierGuyTrackingInfo {
  shipment_id: string;
  tracking_number: string;
  status: string;
  status_description: string;
  created_at: string;
  updated_at: string;
  estimated_delivery_date?: string;
  actual_delivery_date?: string;
  tracking_events: Array<{
    timestamp: string;
    status: string;
    description: string;
    location?: string;
  }>;
}

/**
 * Create a shipment with Courier Guy
 */
export const createCourierGuyShipment = async (
  shipmentData: CourierGuyShipmentData,
): Promise<CourierGuyShipment> => {
  try {
    console.log("Creating Courier Guy shipment:", shipmentData);

    const { data, error } = await supabase.functions.invoke(
      "courier-guy-shipment",
      {
        body: shipmentData,
      },
    );

    if (error) {
      console.error("Error creating shipment:", error);
      throw new Error(`Failed to create shipment: ${error.message}`);
    }

    if (!data.success) {
      throw new Error(data.error || "Failed to create shipment");
    }

    console.log("Shipment created successfully:", data.shipment);
    return data.shipment;
  } catch (error) {
    console.error("Error in createCourierGuyShipment:", error);

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Failed to create shipment. Please try again.");
  }
};

/**
 * Track a shipment using Courier Guy tracking number
 */
export const trackCourierGuyShipment = async (
  trackingNumber: string,
): Promise<CourierGuyTrackingInfo> => {
  try {
    console.log("Tracking Courier Guy shipment:", trackingNumber);

    const { data, error } = await supabase.functions.invoke(
      `courier-guy-track/${trackingNumber}`,
      {
        method: "GET",
      },
    );

    if (error) {
      console.error("Error tracking shipment:", error);
      throw new Error(`Failed to track shipment: ${error.message}`);
    }

    if (!data.success) {
      throw new Error(data.error || "Failed to track shipment");
    }

    console.log("Tracking data received:", data.tracking);
    return data.tracking;
  } catch (error) {
    console.error("Error in trackCourierGuyShipment:", error);

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Failed to track shipment. Please try again.");
  }
};

/**
 * Get delivery quote from Courier Guy with proper address and parcel calculations
 */
export const getCourierGuyQuote = async (
  fromCity: string,
  toCity: string,
  weight: number,
): Promise<{ price: number; estimatedDays: number }> => {
  try {
    console.log("Getting Courier Guy quote:", { fromCity, toCity, weight });

    // Enhanced quote calculation based on real world factors
    let basePrice = 75; // Base price for textbooks

    // Weight multiplier (more accurate for textbooks)
    let weightMultiplier = 1;
    if (weight <= 0.5) {
      weightMultiplier = 1;
    } else if (weight <= 1) {
      weightMultiplier = 1.2;
    } else if (weight <= 2) {
      weightMultiplier = 1.5;
    } else if (weight <= 3) {
      weightMultiplier = 1.8;
    } else {
      weightMultiplier = 2.2;
    }

    // Distance/location multiplier (South African cities)
    let distanceMultiplier = 1;
    const majorCities = [
      "cape town",
      "johannesburg",
      "durban",
      "pretoria",
      "port elizabeth",
      "bloemfontein",
    ];
    const fromCityLower = fromCity.toLowerCase();
    const toCityLower = toCity.toLowerCase();

    if (fromCityLower === toCityLower) {
      // Same city
      distanceMultiplier = 1;
    } else if (
      majorCities.includes(fromCityLower) &&
      majorCities.includes(toCityLower)
    ) {
      // Between major cities
      distanceMultiplier = 1.4;
    } else if (
      majorCities.includes(fromCityLower) ||
      majorCities.includes(toCityLower)
    ) {
      // One major city, one smaller
      distanceMultiplier = 1.6;
    } else {
      // Between smaller cities
      distanceMultiplier = 1.8;
    }

    // Calculate final price
    const calculatedPrice = basePrice * weightMultiplier * distanceMultiplier;
    const price = Math.round(calculatedPrice);

    // Estimate delivery days based on distance
    let estimatedDays = 2;
    if (fromCityLower === toCityLower) {
      estimatedDays = 1; // Same city
    } else if (
      majorCities.includes(fromCityLower) &&
      majorCities.includes(toCityLower)
    ) {
      estimatedDays = 2; // Between major cities
    } else {
      estimatedDays = 3; // Involving smaller cities
    }

    console.log("Courier Guy quote calculated:", {
      basePrice,
      weightMultiplier,
      distanceMultiplier,
      finalPrice: price,
      estimatedDays,
    });

    return {
      price,
      estimatedDays,
    };
  } catch (error) {
    console.error("Error getting Courier Guy quote:", error);

    // Return fallback quote
    return {
      price: 95,
      estimatedDays: 3,
    };
  }
};

/**
 * Validate South African address format
 */
export const validateSAAddress = (address: {
  street: string;
  city: string;
  province: string;
  postalCode: string;
}): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!address.street || address.street.trim().length < 5) {
    errors.push("Street address must be at least 5 characters long");
  }

  if (!address.city || address.city.trim().length < 2) {
    errors.push("City is required");
  }

  if (!address.province || address.province.trim().length < 2) {
    errors.push("Province is required");
  }

  // South African postal code validation (4 digits)
  const postalCodeRegex = /^[0-9]{4}$/;
  if (!address.postalCode || !postalCodeRegex.test(address.postalCode)) {
    errors.push("Postal code must be exactly 4 digits");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

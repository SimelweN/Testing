import axios, { AxiosInstance } from "axios";
import {
  ShipLogicRateRequest,
  ShipLogicRateResponse,
  ShipLogicShipmentRequest,
  ShipLogicShipmentResponse,
  ShipLogicTrackingResponse,
  ShipLogicQuoteRequest,
  ShipLogicRate,
  ShipLogicServiceLevel,
  ShipLogicAddress,
  ShipLogicParcel,
  ShipLogicContact,
} from "@/types/shiplogic";
import { debugEnvironmentVariables } from "@/utils/debugEnvVars";

const SHIPLOGIC_BASE_URL = "https://api.shiplogic.com/v2";
const SHIPLOGIC_API_KEY = import.meta.env.VITE_SHIPLOGIC_API_KEY || "";

// Debug environment variables (only in development)
if (import.meta.env.MODE === "development") {
  debugEnvironmentVariables();
}

// Validate API key is configured
if (!SHIPLOGIC_API_KEY) {
  console.warn(
    "⚠️ ShipLogic API key is not configured. ShipLogic services will return fallback data.",
  );
  console.warn(
    "💡 To fix this, add VITE_SHIPLOGIC_API_KEY to your environment variables.",
  );
  console.warn("📋 Copy .env.example to .env and add your ShipLogic API key");
} else {
  console.log(
    "✅ ShipLogic API key configured:",
    SHIPLOGIC_API_KEY.substring(0, 10) + "...",
  );
}

// Create axios client for ShipLogic API
const shiplogicClient: AxiosInstance = axios.create({
  baseURL: SHIPLOGIC_BASE_URL,
  headers: {
    Authorization: `Bearer ${SHIPLOGIC_API_KEY}`,
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 seconds timeout
});

// Add request/response interceptors for logging and error handling
shiplogicClient.interceptors.request.use(
  (config) => {
    console.log("ShipLogic API Request:", {
      url: config.url,
      method: config.method,
      data: config.data,
    });
    return config;
  },
  (error) => {
    console.error("ShipLogic API Request Error:", error);
    return Promise.reject(error);
  },
);

shiplogicClient.interceptors.response.use(
  (response) => {
    console.log("ShipLogic API Response:", {
      url: response.config.url,
      status: response.status,
      data: response.data,
    });
    return response;
  },
  (error) => {
    const errorDetails = {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data
        ? JSON.stringify(error.response.data, null, 2)
        : "No data",
      message: error.message,
    };
    console.error("ShipLogic API Response Error:", errorDetails);
    return Promise.reject(error);
  },
);

/**
 * Available service levels for ShipLogic
 */
export const SHIPLOGIC_SERVICE_LEVELS: ShipLogicServiceLevel[] = [
  {
    code: "ECO",
    name: "Economy",
    description: "Standard delivery service (3-5 business days)",
    features: ["Cost-effective", "Standard tracking", "3-5 business days"],
  },
  {
    code: "STD",
    name: "Standard",
    description: "Reliable delivery service (2-3 business days)",
    features: ["Faster delivery", "Enhanced tracking", "2-3 business days"],
  },
  {
    code: "EXP",
    name: "Express",
    description: "Fast delivery service (1-2 business days)",
    features: ["Next-day delivery", "Priority handling", "1-2 business days"],
  },
  {
    code: "OVN",
    name: "Overnight",
    description: "Next business day delivery",
    features: ["Guaranteed next day", "Premium service", "1 business day"],
  },
];

/**
 * Convert form data to ShipLogic address format
 */
const convertToShipLogicAddress = (
  street: string,
  suburb: string,
  city: string,
  province: string,
  postalCode: string,
  company?: string,
): ShipLogicAddress => ({
  type: company ? "business" : "residential",
  company: company || "",
  street_address: street,
  local_area: suburb,
  city: city,
  zone: province,
  country: "ZA",
  code: postalCode,
});

/**
 * Convert form data to ShipLogic contact format
 */
const convertToShipLogicContact = (
  name: string,
  phone: string,
  email: string,
): ShipLogicContact => ({
  name,
  mobile_number: phone,
  email,
});

/**
 * Convert form data to ShipLogic parcel format
 */
const convertToShipLogicParcel = (
  weight: number,
  length: number,
  width: number,
  height: number,
  description: string,
): ShipLogicParcel => ({
  packaging: "BookBox",
  parcel_description: description,
  submitted_length_cm: length,
  submitted_width_cm: width,
  submitted_height_cm: height,
  submitted_weight_kg: weight,
});

/**
 * Generate fallback rates when API is unavailable
 */
const getFallbackRates = (): ShipLogicRate[] => {
  const today = new Date();
  const collectionDate = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const deliveryDate = new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000);

  return [
    {
      service_level_code: "ECO",
      service_level_name: "Economy",
      service_level_description:
        "Standard delivery service (3-5 business days)",
      rate_value: 85,
      rate_currency: "ZAR",
      total_charge_value: 95,
      estimated_collection_date: collectionDate.toISOString(),
      estimated_delivery_date: deliveryDate.toISOString(),
      transit_days: 4,
    },
  ];
};

/**
 * Get shipping rate quotes from ShipLogic with proper validation and error handling
 */
export const getShipLogicRates = async (
  request: ShipLogicQuoteRequest,
): Promise<ShipLogicRate[]> => {
  try {
    // Check if API key is configured
    if (!SHIPLOGIC_API_KEY) {
      console.warn(
        "ShipLogic API key not configured, returning fallback rates",
      );
      return getFallbackRates();
    }

    // Validate input parameters
    if (!request.fromAddress || !request.toAddress || !request.parcel) {
      throw new Error("Missing required address or parcel information");
    }

    // Validate addresses
    const fromValidation = validateShipLogicAddress(request.fromAddress);
    if (!fromValidation.isValid) {
      throw new Error(
        `Invalid from address: ${fromValidation.errors.join(", ")}`,
      );
    }

    const toValidation = validateShipLogicAddress(request.toAddress);
    if (!toValidation.isValid) {
      throw new Error(`Invalid to address: ${toValidation.errors.join(", ")}`);
    }

    // Validate parcel details
    if (request.parcel.weight <= 0 || request.parcel.weight > 50) {
      throw new Error("Parcel weight must be between 0.1kg and 50kg");
    }

    if (
      request.parcel.length <= 0 ||
      request.parcel.width <= 0 ||
      request.parcel.height <= 0
    ) {
      throw new Error("All parcel dimensions must be greater than 0");
    }

    const collectionAddress = convertToShipLogicAddress(
      request.fromAddress.street,
      request.fromAddress.suburb,
      request.fromAddress.city,
      request.fromAddress.province,
      request.fromAddress.postalCode,
    );

    const deliveryAddress = convertToShipLogicAddress(
      request.toAddress.street,
      request.toAddress.suburb,
      request.toAddress.city,
      request.toAddress.province,
      request.toAddress.postalCode,
    );

    const parcel = convertToShipLogicParcel(
      request.parcel.weight,
      request.parcel.length,
      request.parcel.width,
      request.parcel.height,
      request.parcel.description,
    );

    // Set collection date to tomorrow (business day)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    // If tomorrow is weekend, move to Monday
    while (tomorrow.getDay() === 0 || tomorrow.getDay() === 6) {
      tomorrow.setDate(tomorrow.getDate() + 1);
    }

    const collectionDate = tomorrow.toISOString();

    const rateRequest: ShipLogicRateRequest = {
      collection_address: collectionAddress,
      delivery_address: deliveryAddress,
      parcels: [parcel],
      declared_value: Math.max(request.parcel.value || 100, 50), // Minimum R50 declared value
      collection_min_date: collectionDate,
      collection_after: "08:00",
      collection_before: "16:00",
      delivery_after: "10:00",
      delivery_before: "17:00",
      service_level_code: "ECO", // Default service level for quotes
    };

    console.log(
      "Getting ShipLogic rates with validated request:",
      JSON.stringify(rateRequest, null, 2),
    );

    const response = await shiplogicClient.post<ShipLogicRateResponse>(
      "/rates",
      rateRequest,
    );

    if (response.data.errors && response.data.errors.length > 0) {
      const errorMessage = response.data.errors.join(", ");
      console.error("ShipLogic API errors:", errorMessage);
      throw new Error(`ShipLogic rate error: ${errorMessage}`);
    }

    if (!response.data.rates || response.data.rates.length === 0) {
      console.warn("No rates returned from ShipLogic API");
      return getFallbackRates();
    }

    console.log(
      "ShipLogic rates received:",
      response.data.rates.length,
      "rates",
    );
    return response.data.rates;
  } catch (error) {
    console.error("Error fetching ShipLogic rates:", error);

    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const errorData = error.response?.data;

      // Extract error message from various possible error response formats
      let errorMessage = "Unknown error";
      if (errorData) {
        if (typeof errorData === "string") {
          errorMessage = errorData;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.errors && Array.isArray(errorData.errors)) {
          errorMessage = errorData.errors.join(", ");
        } else if (typeof errorData === "object") {
          errorMessage = JSON.stringify(errorData);
        }
      }

      if (status === 400) {
        console.error(`ShipLogic API validation error: ${errorMessage}`);
        throw new Error(`Request validation failed: ${errorMessage}`);
      } else if (status === 401) {
        console.error("ShipLogic API authentication failed");
        throw new Error("Authentication failed. Please check API credentials.");
      } else if (status === 403) {
        console.error("ShipLogic API access denied");
        throw new Error("Access denied. Insufficient permissions.");
      } else if (status === 404) {
        console.warn(
          "ShipLogic service not available, returning fallback rates",
        );
        return getFallbackRates();
      } else if (status >= 500) {
        console.warn("ShipLogic server error, returning fallback rates");
        return getFallbackRates();
      } else {
        console.error(`ShipLogic API error (${status}): ${errorMessage}`);
        throw new Error(`Failed to get shipping rates: ${errorMessage}`);
      }
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Failed to get shipping rates. Please try again.");
  }
};

// Note: Manual shipment creation has been disabled.
// Shipments are now created automatically during book purchases only.

/**
 * Track a shipment using ShipLogic shipment ID
 */
export const trackShipLogicShipment = async (
  shipmentId: string,
): Promise<ShipLogicTrackingResponse> => {
  try {
    console.log("Tracking ShipLogic shipment:", shipmentId);

    const response = await shiplogicClient.get<ShipLogicTrackingResponse>(
      `/shipments/${shipmentId}`,
    );

    if (response.data.errors && response.data.errors.length > 0) {
      throw new Error(
        `ShipLogic tracking error: ${response.data.errors.join(", ")}`,
      );
    }

    console.log("ShipLogic tracking data received:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error tracking ShipLogic shipment:", error);

    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        throw new Error("Shipment not found. Please check your shipment ID.");
      }

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message;
      throw new Error(`Failed to track shipment: ${errorMessage}`);
    }

    throw new Error("Failed to track shipment. Please try again.");
  }
};

/**
 * Get shipment notes from ShipLogic
 */
export const getShipLogicShipmentNotes = async (
  shipmentId: string,
): Promise<Record<string, unknown>> => {
  try {
    console.log("Getting ShipLogic shipment notes:", shipmentId);

    const response = await shiplogicClient.get(
      `/shipments/notes/external?shipment_id=${shipmentId}`,
    );

    console.log("ShipLogic shipment notes received:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error getting ShipLogic shipment notes:", error);

    if (axios.isAxiosError(error)) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message;
      throw new Error(`Failed to get shipment notes: ${errorMessage}`);
    }

    throw new Error("Failed to get shipment notes. Please try again.");
  }
};

/**
 * Cancel a ShipLogic shipment
 */
export const cancelShipLogicShipment = async (
  shipmentId: string,
): Promise<Record<string, unknown>> => {
  try {
    console.log("Cancelling ShipLogic shipment:", shipmentId);

    const response = await shiplogicClient.put(
      `/shipments/${shipmentId}/cancel`,
    );

    console.log("ShipLogic shipment cancelled:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error cancelling ShipLogic shipment:", error);

    if (axios.isAxiosError(error)) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message;
      throw new Error(`Failed to cancel shipment: ${errorMessage}`);
    }

    throw new Error("Failed to cancel shipment. Please try again.");
  }
};

/**
 * Get available service levels from ShipLogic
 */
export const getShipLogicServiceLevels = async (): Promise<
  ShipLogicServiceLevel[]
> => {
  try {
    console.log("Getting ShipLogic service levels");

    const response = await shiplogicClient.get("/service-levels");

    console.log("ShipLogic service levels received:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error getting ShipLogic service levels:", error);

    // Return default service levels if API call fails
    return SHIPLOGIC_SERVICE_LEVELS;
  }
};

/**
 * Validate South African address format for ShipLogic
 */
export const validateShipLogicAddress = (address: {
  street: string;
  suburb: string;
  city: string;
  province: string;
  postalCode: string;
}): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!address.street || address.street.trim().length < 5) {
    errors.push("Street address must be at least 5 characters long");
  }

  if (!address.suburb || address.suburb.trim().length < 2) {
    errors.push("Suburb/Local area is required");
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

/**
 * Get a simplified quote for quick estimates
 */
export const getShipLogicQuickQuote = async (
  fromCity: string,
  toCity: string,
  weight: number,
): Promise<{ price: number; estimatedDays: number; serviceName: string }> => {
  try {
    // Create a simplified request for quick quotes
    const quickRequest: ShipLogicQuoteRequest = {
      fromAddress: {
        street: "123 Main Street",
        suburb: "City Centre",
        city: fromCity,
        province: "Gauteng", // Default province
        postalCode: "2000", // Default postal code
      },
      toAddress: {
        street: "123 Main Street",
        suburb: "City Centre",
        city: toCity,
        province: "Western Cape", // Default province
        postalCode: "8000", // Default postal code
      },
      parcel: {
        weight: weight,
        length: 25, // Default book dimensions
        width: 20,
        height: 5,
        description: "Textbook",
        value: 100,
      },
    };

    const rates = await getShipLogicRates(quickRequest);

    if (rates.length > 0) {
      // Return the first (usually cheapest) rate
      const rate = rates[0];
      return {
        price: Math.round(rate.total_charge_value),
        estimatedDays: rate.transit_days,
        serviceName: rate.service_level_name,
      };
    } else {
      // Fallback calculation if no rates returned
      const basePrice = 95;
      const weightMultiplier = Math.max(1, Math.ceil(weight));
      const distanceMultiplier = fromCity !== toCity ? 1.3 : 1;

      return {
        price: Math.round(basePrice * weightMultiplier * distanceMultiplier),
        estimatedDays: fromCity !== toCity ? 3 : 2,
        serviceName: "Economy",
      };
    }
  } catch (error) {
    console.error("Error getting ShipLogic quick quote:", error);

    // Return fallback quote
    const basePrice = 95;
    const weightMultiplier = Math.max(1, Math.ceil(weight));
    const distanceMultiplier = fromCity !== toCity ? 1.3 : 1;

    return {
      price: Math.round(basePrice * weightMultiplier * distanceMultiplier),
      estimatedDays: fromCity !== toCity ? 3 : 2,
      serviceName: "Economy",
    };
  }
};

import { supabase } from "@/integrations/supabase/client";
import {
  getCourierGuyQuote,
  createCourierGuyShipment,
  trackCourierGuyShipment,
  CourierGuyShipmentData,
} from "./courierGuyService";


// Unified delivery types
export interface UnifiedAddress {
  name?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  company?: string;
  streetAddress: string;
  unitNumber?: string;
  complex?: string;
  suburb?: string;
  city: string;
  province: string;
  postalCode: string;
  country?: string;
}

export interface UnifiedParcel {
  reference: string;
  description: string;
  weight: number; // in kg
  length?: number; // in cm
  width?: number; // in cm
  height?: number; // in cm
  value?: number; // for insurance
}

export interface UnifiedShipmentRequest {
  collection: UnifiedAddress;
  delivery: UnifiedAddress;
  parcels: UnifiedParcel[];
  service_type: "standard" | "express" | "overnight";
  collection_date?: string;
  special_instructions?: string;
  require_signature?: boolean;
  insurance?: boolean;
  reference?: string;
  preferred_provider?: "courier-guy";
}

export interface UnifiedQuoteRequest {
  from: UnifiedAddress;
  to: UnifiedAddress;
  weight: number;
  length?: number;
  width?: number;
  height?: number;
  service_type?: "standard" | "express" | "overnight";
}

export interface UnifiedQuote {
  provider: "courier-guy";
  provider_name: string;
  service_code: string;
  service_name: string;
  cost: number;
  cost_breakdown?: {
    base_cost: number;
    gst?: number;
    fuel_surcharge?: number;
    insurance?: number;
  };
  transit_days: number;
  collection_cutoff?: string;
  estimated_delivery: string;
  features: string[];
  terms?: string;
}

export interface UnifiedShipment {
  provider: "courier-guy";
  shipment_id: string;
  tracking_number: string;
  barcode?: string;
  labels: string[]; // Base64 encoded labels
  cost: number;
  service_code: string;
  collection_date: string;
  estimated_delivery_date: string;
  reference?: string;
  tracking_url: string;
}

export interface UnifiedTrackingEvent {
  timestamp: string;
  status: string;
  location: string;
  description: string;
  signature?: string;
}

export interface UnifiedTrackingResponse {
  provider: "courier-guy";
  tracking_number: string;
  status:
    | "pending"
    | "collected"
    | "in_transit"
    | "out_for_delivery"
    | "delivered"
    | "failed"
    | "cancelled";
  current_location?: string;
  estimated_delivery: string;
  actual_delivery?: string;
  events: UnifiedTrackingEvent[];
  recipient_signature?: string;
  proof_of_delivery?: string;
  tracking_url: string;
}

/**
 * Get quotes from all available courier providers
 */
export const getAllDeliveryQuotes = async (
  request: UnifiedQuoteRequest,
): Promise<UnifiedQuote[]> => {
  try {
    console.log("Getting quotes from all providers:", request);

    const quotes: UnifiedQuote[] = [];
    const errors: string[] = [];

    // Get quotes from all providers in parallel
    const quotePromises = [
      getCourierGuyQuotes(request).catch((err) => {
        errors.push(`Courier Guy: ${err.message}`);
        return [];
      }),

    ];

    const results = await Promise.allSettled(quotePromises);

    results.forEach((result, index) => {
      if (result.status === "fulfilled" && result.value) {
        quotes.push(...result.value);
      }
    });

    // Sort by cost (cheapest first)
    quotes.sort((a, b) => a.cost - b.cost);

    if (quotes.length === 0) {
      console.warn("No quotes available from any provider. Errors:", errors);
      return generateFallbackQuotes(request);
    }

    console.log(`Retrieved ${quotes.length} quotes from providers`);
    return quotes;
  } catch (error) {
    console.error("Error getting delivery quotes:", error);
    return generateFallbackQuotes(request);
  }
};

/**
 * Create shipment with specified or best provider
 */
export const createUnifiedShipment = async (
  request: UnifiedShipmentRequest,
  selectedQuote?: UnifiedQuote,
): Promise<UnifiedShipment> => {
  try {
    console.log("Creating unified shipment:", { request, selectedQuote });

    let provider = request.preferred_provider;

    // If no provider specified, get quotes and use cheapest
    if (!provider && !selectedQuote) {
      const quotes = await getAllDeliveryQuotes({
        from: request.collection,
        to: request.delivery,
        weight: request.parcels[0]?.weight || 1,
        service_type: request.service_type,
      });

      if (quotes.length > 0) {
        selectedQuote = quotes[0]; // Cheapest option
        provider = selectedQuote.provider;
      } else {
        provider = "courier-guy"; // Fallback
      }
    } else if (selectedQuote) {
      provider = selectedQuote.provider;
    }

    console.log(`Creating shipment with provider: ${provider}`);

    switch (provider) {
      case "courier-guy":
        return await createCourierGuyShipmentUnified(request);

      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  } catch (error) {
    console.error("Error creating unified shipment:", error);
    throw error;
  }
};

/**
 * Track shipment from any provider
 */
export const trackUnifiedShipment = async (
  trackingNumber: string,
  provider?: "courier-guy",
): Promise<UnifiedTrackingResponse> => {
  try {
    console.log("Tracking shipment:", { trackingNumber, provider });

    // If provider not specified, try to detect from tracking number format
    if (!provider) {
      provider = detectProviderFromTrackingNumber(trackingNumber);
    }

    switch (provider) {
      case "courier-guy":
        return await trackCourierGuyShipmentUnified(trackingNumber);

      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  } catch (error) {
    console.error("Error tracking shipment:", error);
    throw error;
  }
};

// Provider-specific quote functions
async function getCourierGuyQuotes(
  request: UnifiedQuoteRequest,
): Promise<UnifiedQuote[]> {
  const quote = await getCourierGuyQuote(
    request.from.city,
    request.to.city,
    request.weight,
  );

  return [
    {
      provider: "courier-guy",
      provider_name: "Courier Guy",
      service_code: "STANDARD",
      service_name: "Courier Guy Standard",
      cost: quote.price,
      transit_days: quote.estimatedDays,
      estimated_delivery: new Date(
        Date.now() + quote.estimatedDays * 24 * 60 * 60 * 1000,
      ).toISOString(),
      features: ["Local courier", "Reliable tracking", "Door-to-door delivery"],
    },
  ];
}



// Provider-specific shipment creation functions
async function createCourierGuyShipmentUnified(
  request: UnifiedShipmentRequest,
): Promise<UnifiedShipment> {
  const shipmentData: CourierGuyShipmentData = {
    senderName:
      request.collection.contactName || request.collection.name || "Sender",
    senderPhone: request.collection.phone || "+27000000000",
    senderEmail: request.collection.email || "",
    senderAddress: `${request.collection.streetAddress}, ${request.collection.city}, ${request.collection.province}`,
    recipientName:
      request.delivery.contactName || request.delivery.name || "Recipient",
    recipientPhone: request.delivery.phone || "+27000000000",
    recipientEmail: request.delivery.email || "",
    recipientAddress: `${request.delivery.streetAddress}, ${request.delivery.city}, ${request.delivery.province}`,
    parcelDescription: request.parcels[0]?.description || "Package",
    parcelWeight: request.parcels[0]?.weight || 1,
    parcelValue: request.parcels[0]?.value || 100,
    specialInstructions: request.special_instructions,
    requireSignature: request.require_signature || false,
  };

  const shipment = await createCourierGuyShipment(shipmentData);

  return {
    provider: "courier-guy",
    shipment_id: shipment.id,
    tracking_number: shipment.tracking_number,
    barcode: shipment.barcode,
    labels: shipment.labels,
    cost: shipment.cost,
    service_code: shipment.service_code,
    collection_date: shipment.collection_date,
    estimated_delivery_date: shipment.estimated_delivery_date,
    reference: request.reference,
    tracking_url: `https://www.courierguy.co.za/track/${shipment.tracking_number}`,
  };
}



// Provider-specific tracking functions
async function trackCourierGuyShipmentUnified(
  trackingNumber: string,
): Promise<UnifiedTrackingResponse> {
  const tracking = await trackCourierGuyShipment(trackingNumber);

  return {
    provider: "courier-guy",
    tracking_number: trackingNumber,
    status: mapCourierGuyStatus(tracking.status),
    current_location: tracking.current_location,
    estimated_delivery: tracking.estimated_delivery,
    actual_delivery: tracking.actual_delivery,
    events:
      tracking.events?.map((e) => ({
        timestamp: e.timestamp,
        status: e.status,
        location: e.location,
        description: e.description,
        signature: e.signature,
      })) || [],
    recipient_signature: tracking.recipient_signature,
    proof_of_delivery: tracking.proof_of_delivery,
    tracking_url: `https://www.courierguy.co.za/track/${trackingNumber}`,
  };
}



// Helper functions
function detectProviderFromTrackingNumber(
  trackingNumber: string,
): "courier-guy" {
  // Only using Courier Guy now
  return "courier-guy";
}

function mapCourierGuyStatus(
  status: string,
): UnifiedTrackingResponse["status"] {
  switch (status?.toLowerCase()) {
    case "pending":
    case "created":
      return "pending";
    case "collected":
    case "picked_up":
      return "collected";
    case "in_transit":
    case "in_delivery":
      return "in_transit";
    case "out_for_delivery":
      return "out_for_delivery";
    case "delivered":
      return "delivered";
    case "failed":
    case "exception":
      return "failed";
    default:
      return "pending";
  }
}

function generateFallbackQuotes(request: UnifiedQuoteRequest): UnifiedQuote[] {
  const basePrice = Math.max(50, request.weight * 15);

  return [
    {
      provider: "courier-guy",
      provider_name: "Courier Guy",
      service_code: "STANDARD",
      service_name: "Standard Delivery",
      cost: Math.round(basePrice),
      transit_days: 3,
      estimated_delivery: new Date(
        Date.now() + 3 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      features: ["Reliable delivery", "Local courier", "Tracking included"],
    },

  ];
}

export default {
  getAllDeliveryQuotes,
  createUnifiedShipment,
  trackUnifiedShipment,
  detectProviderFromTrackingNumber,
};

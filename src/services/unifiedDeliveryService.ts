import { supabase } from "@/integrations/supabase/client";
import {
  getCourierGuyQuote,
  createCourierGuyShipment,
  trackCourierGuyShipment,
  CourierGuyShipmentData,
} from "./courierGuyService";
import {
  getFastwayQuote,
  createFastwayShipment,
  trackFastwayShipment,
  FastwayShipmentRequest,
  formatAddressForFastway,
} from "./fastwayService";
import {
  getShipLogicQuickQuote,
  createShipLogicShipment,
  trackShipLogicShipment,
} from "./shipLogicService";

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
  preferred_provider?: "courier-guy" | "fastway" | "shiplogic";
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
  provider: "courier-guy" | "fastway" | "shiplogic";
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
  provider: "courier-guy" | "fastway" | "shiplogic";
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
  provider: "courier-guy" | "fastway" | "shiplogic";
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
      getFastwayQuotes(request).catch((err) => {
        errors.push(`Fastway: ${err.message}`);
        return [];
      }),
      getShipLogicQuotes(request).catch((err) => {
        errors.push(`ShipLogic: ${err.message}`);
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
      case "fastway":
        return await createFastwayShipmentUnified(request);
      case "shiplogic":
        return await createShipLogicShipmentUnified(request);
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
  provider?: "courier-guy" | "fastway" | "shiplogic",
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
      case "fastway":
        return await trackFastwayShipmentUnified(trackingNumber);
      case "shiplogic":
        return await trackShipLogicShipmentUnified(trackingNumber);
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

async function getFastwayQuotes(
  request: UnifiedQuoteRequest,
): Promise<UnifiedQuote[]> {
  const quotes = await getFastwayQuote(
    request.from.postalCode,
    request.to.postalCode,
    request.weight,
    request.length && request.width && request.height
      ? {
          length: request.length,
          width: request.width,
          height: request.height,
        }
      : undefined,
  );

  return quotes.map((q) => ({
    provider: "fastway" as const,
    provider_name: "Fastway Couriers",
    service_code: q.service_code,
    service_name: q.service_name,
    cost: q.cost,
    cost_breakdown: {
      base_cost: q.cost_ex_gst,
      gst: q.gst,
    },
    transit_days: q.transit_days,
    collection_cutoff: q.collection_cutoff,
    estimated_delivery: new Date(
      Date.now() + q.transit_days * 24 * 60 * 60 * 1000,
    ).toISOString(),
    features: ["Express delivery", "Parcel tracking", "Delivery confirmation"],
    terms: q.delivery_guarantee,
  }));
}

async function getShipLogicQuotes(
  request: UnifiedQuoteRequest,
): Promise<UnifiedQuote[]> {
  const quote = await getShipLogicQuickQuote({
    fromAddress: {
      street: request.from.streetAddress,
      city: request.from.city,
      province: request.from.province,
      postalCode: request.from.postalCode,
    },
    toAddress: {
      street: request.to.streetAddress,
      city: request.to.city,
      province: request.to.province,
      postalCode: request.to.postalCode,
    },
    weight: request.weight,
    dimensions:
      request.length && request.width && request.height
        ? {
            length: request.length,
            width: request.width,
            height: request.height,
          }
        : undefined,
  });

  return [
    {
      provider: "shiplogic",
      provider_name: "ShipLogic",
      service_code: quote.service_level_code,
      service_name: quote.service_level_description,
      cost: quote.rate_value,
      transit_days: quote.transit_days,
      estimated_delivery: quote.estimated_delivery_date,
      features: [
        "Professional logistics",
        "Advanced tracking",
        "Business delivery",
      ],
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

async function createFastwayShipmentUnified(
  request: UnifiedShipmentRequest,
): Promise<UnifiedShipment> {
  const shipmentData: FastwayShipmentRequest = {
    collection: formatAddressForFastway(request.collection),
    delivery: formatAddressForFastway(request.delivery),
    parcels: request.parcels.map((p) => ({
      reference: p.reference,
      weight: p.weight,
      length: p.length,
      width: p.width,
      height: p.height,
      description: p.description,
      value: p.value,
    })),
    service_type:
      request.service_type === "standard"
        ? "Standard"
        : request.service_type === "express"
          ? "Express"
          : "Overnight",
    collection_date: request.collection_date,
    special_instructions: request.special_instructions,
    require_signature: request.require_signature,
    insurance: request.insurance,
    reference: request.reference,
  };

  const shipment = await createFastwayShipment(shipmentData);

  return {
    provider: "fastway",
    shipment_id: shipment.consignment_id,
    tracking_number: shipment.tracking_number,
    barcode: shipment.barcode,
    labels: shipment.labels,
    cost: shipment.cost,
    service_code: shipment.service_code,
    collection_date: shipment.collection_date,
    estimated_delivery_date: shipment.estimated_delivery_date,
    reference: shipment.reference,
    tracking_url: `https://www.fastway.org/track/${shipment.tracking_number}`,
  };
}

async function createShipLogicShipmentUnified(
  request: UnifiedShipmentRequest,
): Promise<UnifiedShipment> {
  // Implementation for ShipLogic shipment creation
  throw new Error("ShipLogic shipment creation not yet implemented");
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

async function trackFastwayShipmentUnified(
  trackingNumber: string,
): Promise<UnifiedTrackingResponse> {
  const tracking = await trackFastwayShipment(trackingNumber);

  return {
    provider: "fastway",
    tracking_number: trackingNumber,
    status: tracking.status,
    current_location: tracking.current_location,
    estimated_delivery: tracking.estimated_delivery,
    actual_delivery: tracking.actual_delivery,
    events: tracking.events,
    recipient_signature: tracking.recipient_signature,
    proof_of_delivery: tracking.proof_of_delivery,
    tracking_url: `https://www.fastway.org/track/${trackingNumber}`,
  };
}

async function trackShipLogicShipmentUnified(
  trackingNumber: string,
): Promise<UnifiedTrackingResponse> {
  const tracking = await trackShipLogicShipment(trackingNumber);

  return {
    provider: "shiplogic",
    tracking_number: trackingNumber,
    status: mapShipLogicStatus(tracking.status),
    current_location: tracking.current_location,
    estimated_delivery: tracking.estimated_delivery_date,
    actual_delivery: tracking.actual_delivery_date,
    events:
      tracking.tracking_events?.map((e) => ({
        timestamp: e.timestamp,
        status: e.status,
        location: e.location,
        description: e.description,
      })) || [],
    tracking_url: `https://www.shiplogic.com/track/${trackingNumber}`,
  };
}

// Helper functions
function detectProviderFromTrackingNumber(
  trackingNumber: string,
): "courier-guy" | "fastway" | "shiplogic" {
  // Basic heuristics to detect provider from tracking number format
  if (trackingNumber.startsWith("CG") || trackingNumber.length === 10) {
    return "courier-guy";
  } else if (trackingNumber.startsWith("FW") || trackingNumber.length === 12) {
    return "fastway";
  } else if (trackingNumber.startsWith("SL") || trackingNumber.includes("-")) {
    return "shiplogic";
  }

  return "courier-guy"; // Default fallback
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

function mapShipLogicStatus(status: string): UnifiedTrackingResponse["status"] {
  switch (status?.toLowerCase()) {
    case "created":
    case "booked":
      return "pending";
    case "collected":
      return "collected";
    case "in_transit":
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
    {
      provider: "fastway",
      provider_name: "Fastway Couriers",
      service_code: "EXPRESS",
      service_name: "Express Delivery",
      cost: Math.round(basePrice * 1.3),
      transit_days: 1,
      estimated_delivery: new Date(
        Date.now() + 1 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      features: ["Next day delivery", "Priority handling", "Enhanced tracking"],
    },
  ];
}

export default {
  getAllDeliveryQuotes,
  createUnifiedShipment,
  trackUnifiedShipment,
  detectProviderFromTrackingNumber,
};

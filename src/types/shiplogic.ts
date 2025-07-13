export interface ShipLogicAddress {
  type: "residential" | "business";
  company?: string;
  street_address: string;
  local_area: string;
  city: string;
  zone: string;
  country: string;
  code: string;
}

export interface ShipLogicContact {
  name: string;
  mobile_number: string;
  email: string;
}

export interface ShipLogicParcel {
  packaging?: string;
  parcel_description: string;
  submitted_length_cm: number;
  submitted_width_cm: number;
  submitted_height_cm: number;
  submitted_weight_kg: number;
}

export interface ShipLogicRateRequest {
  collection_address: ShipLogicAddress;
  delivery_address: ShipLogicAddress;
  parcels: ShipLogicParcel[];
  declared_value: number;
  collection_min_date: string;
  collection_after: string;
  collection_before: string;
  delivery_after: string;
  delivery_before: string;
  service_level_code: string;
}

export interface ShipLogicShipmentRequest extends ShipLogicRateRequest {
  collection_contact: ShipLogicContact;
  delivery_contact: ShipLogicContact;
  customer_reference?: string;
  mute_notifications: boolean;
}

export interface ShipLogicRate {
  service_level_code: string;
  service_level_name: string;
  service_level_description: string;
  rate_value: number;
  rate_currency: string;
  total_charge_value: number;
  estimated_collection_date: string;
  estimated_delivery_date: string;
  transit_days: number;
}

export interface ShipLogicRateResponse {
  rates: ShipLogicRate[];
  errors?: string[];
}

export interface ShipLogicShipment {
  id: string;
  waybill_number: string;
  status: string;
  service_level_code: string;
  collection_address: ShipLogicAddress;
  delivery_address: ShipLogicAddress;
  collection_contact: ShipLogicContact;
  delivery_contact: ShipLogicContact;
  parcels: ShipLogicParcel[];
  declared_value: number;
  collection_date: string;
  estimated_delivery_date: string;
  customer_reference?: string;
  tracking_url?: string;
  created_at: string;
  updated_at: string;
}

export interface ShipLogicShipmentResponse {
  shipment: ShipLogicShipment;
  waybill_pdf_url?: string;
  errors?: string[];
}

export interface ShipLogicTrackingEvent {
  timestamp: string;
  status: string;
  description: string;
  location?: string;
  comment?: string;
}

export interface ShipLogicTrackingInfo {
  shipment_id: string;
  waybill_number: string;
  status: string;
  status_description: string;
  service_level_code: string;
  collection_date: string;
  estimated_delivery_date: string;
  actual_delivery_date?: string;
  tracking_events: ShipLogicTrackingEvent[];
  created_at: string;
  updated_at: string;
}

export interface ShipLogicTrackingResponse {
  tracking: ShipLogicTrackingInfo;
  errors?: string[];
}

// Note: ShipLogicShipmentFormData removed as manual shipment creation is disabled

export interface ShipLogicServiceLevel {
  code: string;
  name: string;
  description: string;
  features: string[];
}

export interface ShipLogicQuoteRequest {
  fromAddress: {
    street: string;
    suburb: string;
    city: string;
    province: string;
    postalCode: string;
  };
  toAddress: {
    street: string;
    suburb: string;
    city: string;
    province: string;
    postalCode: string;
  };
  parcel: {
    weight: number;
    length: number;
    width: number;
    height: number;
    description: string;
    value: number;
  };
}

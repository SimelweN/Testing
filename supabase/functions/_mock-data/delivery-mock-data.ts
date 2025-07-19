/**
 * Comprehensive Mock Data for Delivery/Courier Edge Functions
 * Includes complete mock data for Courier Guy, Fastway, and ShipLogic APIs
 */

// Complete Address Mock Data
export const mockCollectionAddress = {
  name: "John Doe",
  company: "John Doe Books",
  street: "123 Main Street",
  suburb: "Gardens",
  city: "Cape Town",
  province: "Western Cape",
  postal_code: "8001",
  country: "South Africa",
  phone: "+27123456789",
  email: "seller@example.com",
  special_instructions: "Ring doorbell at reception",
};

export const mockDeliveryAddress = {
  name: "Jane Buyer",
  company: "",
  street: "456 Oak Avenue",
  suburb: "Claremont",
  city: "Cape Town",
  province: "Western Cape",
  postal_code: "7708",
  country: "South Africa",
  phone: "+27987654321",
  email: "buyer@example.com",
  special_instructions: "Apartment 4B, call before delivery",
};

// Complete Package Details Mock Data
export const mockPackageDetails = {
  reference: "BOOK_SHIP_" + Date.now(),
  description: "Textbook - Introduction to Computer Science",
  contents: [
    {
      description: "Computer Science Textbook",
      quantity: 1,
      value: 299.99,
      weight_kg: 1.2,
      category: "books",
    },
  ],
  total_value: 299.99,
  total_weight_kg: 1.2,
  dimensions: {
    length_cm: 25,
    width_cm: 20,
    height_cm: 3,
  },
  fragile: false,
  hazardous: false,
  perishable: false,
  requires_signature: true,
  insurance_required: true,
  delivery_confirmation: true,
};

// Courier Guy Mock Data
export const mockCourierGuyQuoteRequest = {
  collection_address: mockCollectionAddress,
  delivery_address: mockDeliveryAddress,
  package_details: mockPackageDetails,
  service_type: "overnight",
  collection_date: "2024-01-02",
  collection_time: "14:00",
  delivery_date: "2024-01-03",
  special_services: ["insurance", "tracking", "signature_required"],
  account_code: "REBOOK001",
};

export const mockCourierGuyQuoteResponse = {
  success: true,
  quote_id: "CG_QUOTE_123456789",
  service_type: "overnight",
  collection_date: "2024-01-02",
  delivery_date: "2024-01-03",
  cost_breakdown: {
    base_rate: 75.0,
    fuel_surcharge: 8.5,
    insurance_fee: 1.5,
    total_cost: 85.0,
    currency: "ZAR",
  },
  estimated_delivery_time: "10:00",
  tracking_enabled: true,
  insurance_included: true,
  quote_expires: "2024-01-01T23:59:59.000Z",
  terms_and_conditions: "Standard Courier Guy terms apply",
};

export const mockCourierGuyShipmentRequest = {
  quote_id: "CG_QUOTE_123456789",
  customer_reference: mockPackageDetails.reference,
  collection_address: mockCollectionAddress,
  delivery_address: mockDeliveryAddress,
  package_details: mockPackageDetails,
  service_options: {
    insurance: true,
    tracking: true,
    signature_required: true,
    email_notifications: true,
    sms_notifications: false,
  },
  billing_details: {
    account_code: "REBOOK001",
    cost_center: "BOOKS_DELIVERY",
    purchase_order: "PO_" + Date.now(),
  },
};

export const mockCourierGuyShipmentResponse = {
  success: true,
  waybill_number: "CG123456789ZA",
  tracking_url: "https://www.courierguy.co.za/track?waybill=CG123456789ZA",
  estimated_delivery: "2024-01-03T10:00:00.000Z",
  collection_scheduled: "2024-01-02T14:00:00.000Z",
  total_cost: 85.0,
  currency: "ZAR",
  status: "shipment_created",
  labels: {
    shipping_label_url: "https://labels.courierguy.co.za/CG123456789ZA.pdf",
    collection_slip_url:
      "https://labels.courierguy.co.za/collection_CG123456789ZA.pdf",
  },
};

// Fastway Mock Data
export const mockFastwayQuoteRequest = {
  from_postcode: "8001",
  to_postcode: "7708",
  weight_kg: 1.2,
  length_cm: 25,
  width_cm: 20,
  height_cm: 3,
  declared_value: 299.99,
  service_type: "standard",
  insurance_required: true,
};

export const mockFastwayQuoteResponse = {
  success: true,
  quote_id: "FW_QUOTE_987654321",
  service_options: [
    {
      service_type: "standard",
      delivery_days: 2,
      cost: 65.0,
      description: "Standard delivery service",
    },
    {
      service_type: "express",
      delivery_days: 1,
      cost: 95.0,
      description: "Express next-day delivery",
    },
  ],
  currency: "ZAR",
  quote_valid_until: "2024-01-01T23:59:59.000Z",
  insurance_available: true,
  tracking_included: true,
};

export const mockFastwayShipmentRequest = {
  quote_id: "FW_QUOTE_987654321",
  service_type: "standard",
  customer_reference: mockPackageDetails.reference,
  sender: mockCollectionAddress,
  recipient: mockDeliveryAddress,
  package: {
    weight_kg: mockPackageDetails.total_weight_kg,
    dimensions: mockPackageDetails.dimensions,
    value: mockPackageDetails.total_value,
    description: mockPackageDetails.description,
    contents: mockPackageDetails.contents,
  },
  delivery_instructions: mockDeliveryAddress.special_instructions,
  insurance: true,
  signature_required: true,
};

export const mockFastwayShipmentResponse = {
  success: true,
  consignment_number: "FW987654321ZA",
  tracking_url:
    "https://www.fastway.co.za/track-your-parcel?consignment=FW987654321ZA",
  estimated_delivery: "2024-01-04T16:00:00.000Z",
  cost: 65.0,
  currency: "ZAR",
  status: "booked",
  label_url: "https://labels.fastway.co.za/FW987654321ZA.pdf",
};

// ShipLogic Mock Data
export const mockShipLogicQuoteRequest = {
  collection_address: {
    street_address: mockCollectionAddress.street,
    suburb: mockCollectionAddress.suburb,
    city: mockCollectionAddress.city,
    postal_code: mockCollectionAddress.postal_code,
    province: mockCollectionAddress.province,
    country: mockCollectionAddress.country,
  },
  delivery_address: {
    street_address: mockDeliveryAddress.street,
    suburb: mockDeliveryAddress.suburb,
    city: mockDeliveryAddress.city,
    postal_code: mockDeliveryAddress.postal_code,
    province: mockDeliveryAddress.province,
    country: mockDeliveryAddress.country,
  },
  parcel_details: {
    weight: mockPackageDetails.total_weight_kg,
    length: mockPackageDetails.dimensions.length_cm,
    width: mockPackageDetails.dimensions.width_cm,
    height: mockPackageDetails.dimensions.height_cm,
    declared_value: mockPackageDetails.total_value,
  },
  service_level: "express",
  collection_date: "2024-01-02",
};

export const mockShipLogicQuoteResponse = {
  success: true,
  quote_reference: "SL_QUOTE_555888999",
  rates: [
    {
      courier: "CourierGuy",
      service: "Overnight",
      rate: 85.0,
      delivery_days: 1,
      delivery_date: "2024-01-03",
    },
    {
      courier: "Fastway",
      service: "Express",
      rate: 95.0,
      delivery_days: 1,
      delivery_date: "2024-01-03",
    },
    {
      courier: "PostNet",
      service: "Standard",
      rate: 55.0,
      delivery_days: 3,
      delivery_date: "2024-01-05",
    },
  ],
  currency: "ZAR",
  quote_expires: "2024-01-01T23:59:59.000Z",
  insurance_included: true,
  tracking_included: true,
};

export const mockShipLogicShipmentRequest = {
  quote_reference: "SL_QUOTE_555888999",
  selected_rate_index: 0,
  customer_reference: mockPackageDetails.reference,
  collection_contact: {
    name: mockCollectionAddress.name,
    phone: mockCollectionAddress.phone,
    email: mockCollectionAddress.email,
  },
  delivery_contact: {
    name: mockDeliveryAddress.name,
    phone: mockDeliveryAddress.phone,
    email: mockDeliveryAddress.email,
  },
  collection_instructions: mockCollectionAddress.special_instructions,
  delivery_instructions: mockDeliveryAddress.special_instructions,
  goods_description: mockPackageDetails.description,
  insurance_required: true,
};

export const mockShipLogicShipmentResponse = {
  success: true,
  shipment_id: "SL_SHIP_777666555",
  tracking_number: "SL777666555ZA",
  courier: "CourierGuy",
  service: "Overnight",
  tracking_url: "https://tracking.shiplogic.com/SL777666555ZA",
  estimated_delivery: "2024-01-03T12:00:00.000Z",
  cost: 85.0,
  currency: "ZAR",
  status: "dispatched",
  waybill_url: "https://waybills.shiplogic.com/SL777666555ZA.pdf",
};

// Tracking Mock Data
export const mockTrackingUpdate = {
  tracking_number: "CG123456789ZA",
  status: "in_transit",
  status_description: "Package collected and in transit",
  location: "Cape Town Distribution Center",
  timestamp: "2024-01-02T16:30:00.000Z",
  estimated_delivery: "2024-01-03T10:00:00.000Z",
  delivery_attempt: 0,
  signature_required: true,
  events: [
    {
      timestamp: "2024-01-02T14:00:00.000Z",
      status: "collected",
      description: "Package collected from sender",
      location: "Gardens, Cape Town",
    },
    {
      timestamp: "2024-01-02T16:30:00.000Z",
      status: "in_transit",
      description: "Package in transit to destination",
      location: "Cape Town Distribution Center",
    },
  ],
};

// Error Response Mock Data
export const mockDeliveryError = {
  success: false,
  error_code: "INVALID_POSTAL_CODE",
  error_message: "The delivery postal code is not serviced by this courier",
  details: {
    field: "delivery_address.postal_code",
    provided_value: "0000",
    valid_examples: ["7708", "8001", "2196"],
    suggestion: "Please provide a valid South African postal code",
  },
  timestamp: "2024-01-01T12:00:00.000Z",
};

// Export all delivery mock data
export const DeliveryMockData = {
  addresses: {
    collection: mockCollectionAddress,
    delivery: mockDeliveryAddress,
  },
  package: mockPackageDetails,
  courierGuy: {
    quoteRequest: mockCourierGuyQuoteRequest,
    quoteResponse: mockCourierGuyQuoteResponse,
    shipmentRequest: mockCourierGuyShipmentRequest,
    shipmentResponse: mockCourierGuyShipmentResponse,
  },
  fastway: {
    quoteRequest: mockFastwayQuoteRequest,
    quoteResponse: mockFastwayQuoteResponse,
    shipmentRequest: mockFastwayShipmentRequest,
    shipmentResponse: mockFastwayShipmentResponse,
  },
  shipLogic: {
    quoteRequest: mockShipLogicQuoteRequest,
    quoteResponse: mockShipLogicQuoteResponse,
    shipmentRequest: mockShipLogicShipmentRequest,
    shipmentResponse: mockShipLogicShipmentResponse,
  },
  tracking: mockTrackingUpdate,
  error: mockDeliveryError,
};

console.log(
  "✅ Delivery Services Mock Data loaded with complete field coverage",
);

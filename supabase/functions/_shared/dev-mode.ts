// Development mode utilities for testing functions without external dependencies

export const isDevelopmentMode = () => {
  return (
    Deno.env.get("ENVIRONMENT") === "development" ||
    Deno.env.get("DENO_DEPLOYMENT_ID") === undefined
  );
};

export interface MockResponse {
  success: boolean;
  data?: any;
  message?: string;
}

// Mock responses for external services when in development mode
export const mockResponses = {
  email: {
    success: true,
    messageId: "mock-message-id-" + Date.now(),
    details: {
      accepted: ["test@example.com"],
      rejected: [],
      response: "250 Message accepted for delivery",
    },
  },

  paystack: {
    payment: {
      success: true,
      data: {
        authorization_url: "https://checkout.paystack.com/mock-url",
        access_code: "mock-access-code",
        reference: "mock-ref-" + Date.now(),
      },
    },
    verification: {
      success: true,
      data: {
        status: "success",
        reference: "mock-reference",
        amount: 25000,
        currency: "ZAR",
        transaction_date: new Date().toISOString(),
      },
    },
    subaccount: {
      success: true,
      data: {
        subaccount_code: "ACCT_mock_subaccount",
        business_name: "Test Business",
        account_number: "0123456789",
      },
    },
  },

  courier: {
    quote: {
      success: true,
      quotes: [
        {
          service_name: "Standard Delivery",
          price: 85.5,
          estimated_days: 2,
          service_code: "STD",
        },
        {
          service_name: "Express Delivery",
          price: 125.0,
          estimated_days: 1,
          service_code: "EXP",
        },
      ],
    },
    shipment: {
      success: true,
      tracking_number: "TRK" + Date.now(),
      shipment_id: "SHIP" + Date.now(),
      estimated_delivery: new Date(
        Date.now() + 2 * 24 * 60 * 60 * 1000,
      ).toISOString(),
    },
    tracking: {
      success: true,
      status: "in_transit",
      tracking_events: [
        {
          timestamp: new Date().toISOString(),
          status: "collected",
          location: "Cape Town",
        },
        {
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          status: "in_transit",
          location: "Johannesburg",
        },
      ],
    },
  },

  fastway: {
    quote: {
      success: true,
      quotes: [
        {
          service_name: "Fastway Local",
          price: 75.0,
          estimated_days: 3,
          service_code: "LOCAL",
        },
      ],
    },
    shipment: {
      success: true,
      tracking_number: "FW" + Date.now(),
      consignment_id: "FW" + Date.now(),
    },
    tracking: {
      success: true,
      status: "delivered",
      tracking_events: [
        {
          timestamp: new Date().toISOString(),
          status: "delivered",
          location: "Delivery Address",
        },
      ],
    },
  },
};

export function createMockResponse(
  service: string,
  operation: string,
): MockResponse {
  const serviceResponses = mockResponses[service as keyof typeof mockResponses];

  if (!serviceResponses) {
    return {
      success: true,
      message: `Mock response for ${service} service`,
      data: { mock: true, service, operation },
    };
  }

  const operationResponse =
    serviceResponses[operation as keyof typeof serviceResponses];

  if (!operationResponse) {
    return {
      success: true,
      message: `Mock response for ${service}.${operation}`,
      data: { mock: true, service, operation },
    };
  }

  return {
    success: true,
    ...operationResponse,
  };
}

export function requiresExternalService(functionName: string): boolean {
  const externalServiceFunctions = [
    "send-email",
    "courier-guy-quote",
    "courier-guy-shipment",
    "courier-guy-track",
    "fastway-quote",
    "fastway-shipment",
    "fastway-track",
    "initialize-paystack-payment",
    "verify-paystack-payment",
    "create-paystack-subaccount",
    "paystack-webhook",
  ];

  return externalServiceFunctions.includes(functionName);
}

export function getServiceFromFunction(functionName: string): {
  service: string;
  operation: string;
} {
  if (functionName.includes("email")) {
    return { service: "email", operation: "send" };
  }

  if (functionName.includes("paystack")) {
    if (functionName.includes("initialize"))
      return { service: "paystack", operation: "payment" };
    if (functionName.includes("verify"))
      return { service: "paystack", operation: "verification" };
    if (functionName.includes("subaccount"))
      return { service: "paystack", operation: "subaccount" };
    if (functionName.includes("webhook"))
      return { service: "paystack", operation: "webhook" };
  }

  if (functionName.includes("courier-guy")) {
    if (functionName.includes("quote"))
      return { service: "courier", operation: "quote" };
    if (functionName.includes("shipment"))
      return { service: "courier", operation: "shipment" };
    if (functionName.includes("track"))
      return { service: "courier", operation: "tracking" };
  }

  if (functionName.includes("fastway")) {
    if (functionName.includes("quote"))
      return { service: "fastway", operation: "quote" };
    if (functionName.includes("shipment"))
      return { service: "fastway", operation: "shipment" };
    if (functionName.includes("track"))
      return { service: "fastway", operation: "tracking" };
  }

  return { service: "unknown", operation: "unknown" };
}

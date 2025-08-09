import { supabase } from "@/integrations/supabase/client";
import { getBookPickupAddress, getOrderShippingAddress } from "./addressService";

export interface DeliveryQuote {
  courier: 'fastway' | 'courier-guy';
  price: number;
  estimatedDays: number;
  serviceName: string;
}

export interface DeliveryAddress {
  streetAddress: string;
  suburb: string;
  city: string;
  province: string;
  postalCode: string;
}

export const getDeliveryQuotes = async (
  fromAddress: DeliveryAddress,
  toAddress: DeliveryAddress,
  weight: number = 1 // Default weight in kg
): Promise<DeliveryQuote[]> => {
  try {
    console.log("Getting delivery quotes for:", { fromAddress, toAddress, weight });
    
    const { data, error } = await supabase.functions.invoke('get-delivery-quotes', {
      body: {
        fromAddress,
        toAddress,
        weight
      }
    });

    if (error) {
      console.error("Error getting delivery quotes:", error);
      throw error;
    }

    console.log("Delivery quotes received:", data);
    return data.quotes || [];
  } catch (error) {
    console.error("Error in getDeliveryQuotes:", error);
    // Return fallback quotes if API fails
    return [
      {
        courier: 'fastway',
        price: 85,
        estimatedDays: 3,
        serviceName: 'Fastway Standard'
      },
      {
        courier: 'courier-guy',
        price: 95,
        estimatedDays: 2,
        serviceName: 'Courier Guy Express'
      }
    ];
  }
};

export const createDeliveryBooking = async (
  quote: DeliveryQuote,
  fromAddress: DeliveryAddress,
  toAddress: DeliveryAddress,
  packageDetails: {
    weight: number;
    description: string;
    value: number;
  }
) => {
  try {
    console.log("Creating delivery booking:", { quote, fromAddress, toAddress, packageDetails });

    const { data, error } = await supabase.functions.invoke('create-delivery-booking', {
      body: {
        quote,
        fromAddress,
        toAddress,
        packageDetails
      }
    });

    if (error) {
      console.error("Error creating delivery booking:", error);
      throw error;
    }

    console.log("Delivery booking created:", data);
    return data;
  } catch (error) {
    console.error("Error in createDeliveryBooking:", error);
    throw error;
  }
};

// Get delivery quotes using encrypted addresses from order and book
export const getDeliveryQuotesForOrder = async (
  orderId: string,
  bookId: string,
  weight: number = 1
): Promise<DeliveryQuote[]> => {
  try {
    console.log("Getting delivery quotes for order using encrypted addresses:", { orderId, bookId, weight });

    // Get encrypted addresses
    const [pickupAddress, shippingAddress] = await Promise.all([
      getBookPickupAddress(bookId),
      getOrderShippingAddress(orderId)
    ]);

    if (!pickupAddress) {
      throw new Error("Pickup address not found for book");
    }

    if (!shippingAddress) {
      throw new Error("Shipping address not found for order");
    }

    // Convert to DeliveryAddress format
    const fromAddress: DeliveryAddress = {
      streetAddress: pickupAddress.streetAddress || pickupAddress.street || '',
      suburb: pickupAddress.suburb || pickupAddress.city || '',
      city: pickupAddress.city || pickupAddress.suburb || '',
      province: pickupAddress.province || '',
      postalCode: pickupAddress.postalCode || ''
    };

    const toAddress: DeliveryAddress = {
      streetAddress: shippingAddress.streetAddress || shippingAddress.street || '',
      suburb: shippingAddress.suburb || shippingAddress.city || '',
      city: shippingAddress.city || shippingAddress.suburb || '',
      province: shippingAddress.province || '',
      postalCode: shippingAddress.postalCode || ''
    };

    return getDeliveryQuotes(fromAddress, toAddress, weight);
  } catch (error) {
    console.error("Error in getDeliveryQuotesForOrder:", error);
    throw error;
  }
};

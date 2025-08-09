import { supabase } from "@/integrations/supabase/client";
import { CheckoutAddress } from "@/types/checkout";

interface SimpleAddress {
  streetAddress: string;
  city: string;
  province: string;
  postalCode: string;
}

// Decrypt an address using the decrypt-address edge function
const decryptAddress = async (params: { table: string; target_id: string; address_type?: string }) => {
  try {
    const { data, error } = await supabase.functions.invoke('decrypt-address', {
      body: {
        fetch: params
      }
    });

    if (error) {
      console.warn("Decryption not available:", error.message);
      return null;
    }

    return data?.data || null;
  } catch (error) {
    console.warn("Decryption service unavailable:", error instanceof Error ? error.message : String(error));
    return null;
  }
};

// Encrypt an address using the encrypt-address edge function
const encryptAddress = async (address: SimpleAddress, options?: { save?: { table: string; target_id: string; address_type: string } }) => {
  try {
    const { data, error } = await supabase.functions.invoke('encrypt-address', {
      body: {
        object: address,
        ...options
      }
    });

    if (error) {
      console.error("Error encrypting address:", error);
      throw new Error(`Encryption failed: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error("Error in encryptAddress:", error);
    throw error;
  }
};

export const getSellerDeliveryAddress = async (
  sellerId: string,
): Promise<CheckoutAddress | null> => {
  try {
    // Try to get encrypted address first
    const decryptedAddress = await decryptAddress({
      table: 'profiles',
      target_id: sellerId,
      address_type: 'pickup'
    });

    if (decryptedAddress) {
      return {
        street: decryptedAddress.streetAddress || decryptedAddress.street || "",
        city: decryptedAddress.city || "",
        province: decryptedAddress.province || "",
        postal_code: decryptedAddress.postalCode || decryptedAddress.postal_code || "",
        country: "South Africa",
      };
    }

    // Fallback to plaintext address
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("pickup_address")
      .eq("id", sellerId)
      .single();

    if (error || !profile?.pickup_address) {
      return null;
    }

    const addr = profile.pickup_address as any;
    return {
      street: addr.streetAddress || addr.street || "",
      city: addr.city || "",
      province: addr.province || "",
      postal_code: addr.postalCode || addr.postal_code || "",
      country: "South Africa",
    };
  } catch (error) {
    console.error("Error getting seller address:", error);
    return null;
  }
};

export const getSimpleUserAddresses = async (userId: string) => {
  try {
    // Try to get encrypted addresses first
    const [decryptedPickup, decryptedShipping] = await Promise.all([
      decryptAddress({
        table: 'profiles',
        target_id: userId,
        address_type: 'pickup'
      }),
      decryptAddress({
        table: 'profiles',
        target_id: userId,
        address_type: 'shipping'
      })
    ]);

    if (decryptedPickup || decryptedShipping) {
      return {
        pickup_address: decryptedPickup,
        shipping_address: decryptedShipping || decryptedPickup,
      };
    }

    // Fallback to plaintext addresses
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("pickup_address, shipping_address")
      .eq("id", userId)
      .single();

    if (error || !profile) {
      return null;
    }

    return {
      pickup_address: profile.pickup_address,
      shipping_address: profile.shipping_address,
    };
  } catch (error) {
    console.error("Error getting addresses:", error);
    return null;
  }
};

export const saveSimpleUserAddresses = async (
  userId: string,
  pickupAddress: SimpleAddress,
  shippingAddress: SimpleAddress,
  addressesAreSame: boolean = false,
) => {
  try {
    // Encrypt and save pickup address
    if (pickupAddress) {
      await encryptAddress(pickupAddress, {
        save: {
          table: 'profiles',
          target_id: userId,
          address_type: 'pickup'
        }
      });
    }

    // Encrypt and save shipping address (if different)
    if (shippingAddress && !addressesAreSame) {
      await encryptAddress(shippingAddress, {
        save: {
          table: 'profiles',
          target_id: userId,
          address_type: 'shipping'
        }
      });
    }

    // Also update plaintext addresses for backward compatibility (transition period)
    const updateData: any = {};
    if (pickupAddress) {
      updateData.pickup_address = pickupAddress;
    }
    if (shippingAddress) {
      updateData.shipping_address = shippingAddress;
    }

    const { error } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", userId);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error("Error saving addresses:", error);
    throw error;
  }
};

// Function to save encrypted shipping address to orders table during checkout
export const saveOrderShippingAddress = async (
  orderId: string,
  shippingAddress: SimpleAddress
) => {
  try {
    // Encrypt and save shipping address to orders table
    await encryptAddress(shippingAddress, {
      save: {
        table: 'orders',
        target_id: orderId,
        address_type: 'shipping'
      }
    });

    // Also save plaintext for backward compatibility
    const { error } = await supabase
      .from("orders")
      .update({ shipping_address: shippingAddress })
      .eq("id", orderId);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error("Error saving order shipping address:", error);
    throw error;
  }
};

import { supabase } from "@/integrations/supabase/client";
import { CheckoutAddress } from "@/types/checkout";

interface SimpleAddress {
  streetAddress: string;
  city: string;
  province: string;
  postalCode: string;
}

// Decrypt an address using the improved decrypt-address edge function
const decryptAddress = async (params: { table: string; target_id: string; address_type?: string }) => {
  try {
    console.log("🔐 Calling decrypt-address edge function with params:", params);

    // Use the legacy format for backward compatibility
    const { data, error } = await supabase.functions.invoke('decrypt-address', {
      body: {
        table: params.table,
        target_id: params.target_id,
        address_type: params.address_type || 'pickup'
      }
    });

    console.log("🔐 Edge function response:", { data, error });

    // Handle 404 errors specifically (function not deployed)
    if (error && (error.message?.includes('404') || error.message?.includes('Not Found'))) {
      console.warn("🚫 Edge function not deployed/available in this environment, falling back to plaintext");
      return null;
    }

    if (error) {
      console.warn("Decryption failed:", error.message);
      return null;
    }

    // The new function returns { success: boolean, data?: any, error?: any }
    if (data?.success) {
      const result = data.data || null;
      console.log("🔐 Final decryption result:", result);
      return result;
    } else {
      console.warn("Decryption failed:", data?.error?.message || "Unknown error");
      return null;
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (errorMsg.includes('404') || errorMsg.includes('Not Found')) {
      console.warn("🚫 Edge function service unavailable (404), falling back to plaintext");
    } else {
      console.warn("Decryption service error:", errorMsg);
    }
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
      console.warn("Encryption not available:", error.message);
      return null;
    }

    return data;
  } catch (error) {
    console.warn("Encryption service unavailable:", error instanceof Error ? error.message : String(error));
    return null;
  }
};

export const getSellerDeliveryAddress = async (
  sellerId: string,
): Promise<CheckoutAddress | null> => {
  try {
    console.log("🔍 getSellerDeliveryAddress called for seller:", sellerId);

    // Get encrypted address only
    console.log("Step 1: Attempting to decrypt address...");
    const decryptedAddress = await decryptAddress({
      table: 'profiles',
      target_id: sellerId,
      address_type: 'pickup'
    });

    console.log("🔐 Decryption result:", decryptedAddress);

    if (decryptedAddress) {
      const address = {
        street: decryptedAddress.streetAddress || decryptedAddress.street || "",
        city: decryptedAddress.city || "",
        province: decryptedAddress.province || "",
        postal_code: decryptedAddress.postalCode || decryptedAddress.postal_code || "",
        country: "South Africa",
      };
      console.log("✅ Returning encrypted address:", address);
      return address;
    }

    console.log("❌ No encrypted address found for seller, trying plaintext fallback...");

    // Fallback to plaintext address if encryption is unavailable
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('pickup_address')
      .eq('id', sellerId)
      .maybeSingle();

    if (profileError || !profile?.pickup_address) {
      console.log("❌ No plaintext address found either");
      return null;
    }

    try {
      const address = typeof profile.pickup_address === 'string'
        ? JSON.parse(profile.pickup_address)
        : profile.pickup_address;

      console.log("✅ Using plaintext fallback address");
      return {
        street: address.street || address.line1 || "",
        city: address.city || "",
        state: address.state || address.province || "",
        postal_code: address.postalCode || address.postal_code || "",
        country: "South Africa",
      };
    } catch (error) {
      console.error("❌ Error parsing plaintext address:", error);
      return null;
    }
  } catch (error) {
    console.error("❌ Error getting seller address:", error);
    return null;
  }
};

export const getSimpleUserAddresses = async (userId: string) => {
  try {
    // Get encrypted addresses only
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

    console.log("❌ No encrypted addresses found for user");
    return null;
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
    let pickupEncrypted = false;
    let shippingEncrypted = false;

    // Encrypt and save pickup address (required)
    if (pickupAddress) {
      try {
        const result = await encryptAddress(pickupAddress, {
          save: {
            table: 'profiles',
            target_id: userId,
            address_type: 'pickup'
          }
        });
        if (result && result.success) {
          console.log("✅ Pickup address encrypted successfully");
          pickupEncrypted = true;
        }
      } catch (encryptError) {
        console.error("❌ Pickup address encryption failed:", encryptError);
      }
    }

    // Encrypt and save shipping address (if different, required)
    if (shippingAddress && !addressesAreSame) {
      try {
        const result = await encryptAddress(shippingAddress, {
          save: {
            table: 'profiles',
            target_id: userId,
            address_type: 'shipping'
          }
        });
        if (result && result.success) {
          console.log("✅ Shipping address encrypted successfully");
          shippingEncrypted = true;
        }
      } catch (encryptError) {
        console.error("❌ Shipping address encryption failed:", encryptError);
      }
    } else {
      shippingEncrypted = pickupEncrypted;
    }

    // Check if encryption was successful
    if (pickupAddress && !pickupEncrypted) {
      throw new Error("Failed to encrypt pickup address. Address not saved for security reasons.");
    }
    if (shippingAddress && !addressesAreSame && !shippingEncrypted) {
      throw new Error("Failed to encrypt shipping address. Address not saved for security reasons.");
    }

    // Update only metadata
    const updateData: any = {
      addresses_same: addressesAreSame,
      encryption_status: 'encrypted'
    };

    const { error } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", userId);

    if (error) {
      throw error;
    }

    console.log("✅ Addresses encrypted and saved successfully");
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
    // Encrypt and save shipping address to orders table only
    const result = await encryptAddress(shippingAddress, {
      save: {
        table: 'orders',
        target_id: orderId,
        address_type: 'shipping'
      }
    });

    if (!result || !result.success) {
      throw new Error("Failed to encrypt shipping address for order");
    }

    console.log("✅ Order shipping address encrypted successfully");
    return { success: true };
  } catch (error) {
    console.error("Error saving order shipping address:", error);
    throw error;
  }
};

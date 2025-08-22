import { supabase } from "@/integrations/supabase/client";
import { CheckoutAddress } from "@/types/checkout";

interface SimpleAddress {
  streetAddress: string;
  city: string;
  province: string;
  postalCode: string;
}

// Detect if we're on mobile for better error handling
const isMobileDevice = () => {
  return typeof window !== 'undefined' && (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    window.innerWidth < 768
  );
};

// Retry logic for mobile network issues
const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: any;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const errorMsg = error instanceof Error ? error.message : String(error);

      // Don't retry certain types of errors
      if (errorMsg.includes('404') || errorMsg.includes('Not Found') ||
          errorMsg.includes('401') || errorMsg.includes('403')) {
        throw error;
      }

      if (attempt === maxAttempts) {
        throw error;
      }

      // Exponential backoff with jitter for mobile networks
      const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 500;
      console.log(`🔄 Retry attempt ${attempt + 1}/${maxAttempts} after ${delay}ms delay`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};

// Decrypt an address using the improved decrypt-address edge function with mobile-specific improvements
const decryptAddress = async (params: { table: string; target_id: string; address_type?: string }) => {
  const isMobile = isMobileDevice();
  console.log(`🔐 Calling decrypt-address edge function (${isMobile ? 'MOBILE' : 'DESKTOP'}) with params:`, params);

  try {
    // Use retry logic for mobile devices due to network instability
    const makeRequest = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), isMobile ? 15000 : 10000); // Longer timeout for mobile

      try {
        const requestBody = {
          table: params.table,
          target_id: params.target_id,
          address_type: params.address_type || 'pickup'
        };

        console.log("🔍 Exact request body being sent:", JSON.stringify(requestBody, null, 2));
        console.log("🔍 Request body size:", JSON.stringify(requestBody).length, "bytes");

        const { data, error } = await supabase.functions.invoke('decrypt-address', {
          body: requestBody,
          headers: {
            'Content-Type': 'application/json',
            ...(isMobile && { 'X-Mobile-Request': 'true' })
          }
        });

        clearTimeout(timeoutId);
        return { data, error };
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    };

    const { data, error } = await (isMobile ? retryWithBackoff(makeRequest, 3, 1000) : makeRequest());

    console.log("🔐 Edge function response:", { data, error });
    console.log("🔐 Data structure:", JSON.stringify(data, null, 2));
    console.log("🔐 Data.success:", data?.success);

    // Handle 404 errors specifically (function not deployed)
    if (error && (error.message?.includes('404') || error.message?.includes('Not Found'))) {
      console.warn("🚫 Edge function not deployed/available in this environment, falling back to plaintext");
      return null;
    }

    // Handle network timeout errors (common on mobile)
    if (error && (error.message?.includes('timeout') || error.message?.includes('AbortError'))) {
      console.warn(`⏱️ ${isMobile ? 'Mobile' : 'Desktop'} network timeout, will fall back to plaintext`);
      return null;
    }

    // Handle CORS errors (can happen on mobile)
    if (error && error.message?.includes('CORS')) {
      console.warn(`🌐 ${isMobile ? 'Mobile' : 'Desktop'} CORS error, will fall back to plaintext`);
      return null;
    }

    if (error) {
      console.warn(`Decryption failed on ${isMobile ? 'mobile' : 'desktop'}:`, error.message);
      return null;
    }

    // Handle different response formats from the edge function
    if (data?.success) {
      // Check for different nested formats
      const result = data.address || data.data || null;
      console.log("🔐 Final decryption result (success format):", result);
      return result;
    } else if (data && typeof data === 'object' && !data.success && !data.error) {
      // Direct data format: the decrypted object itself
      console.log("🔐 Final decryption result (direct format):", data);
      return data;
    } else {
      console.warn("Decryption failed:", data?.error?.message || "Unknown error");
      console.log("🔐 Full data object for debugging:", data);
      return null;
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (errorMsg.includes('404') || errorMsg.includes('Not Found')) {
      console.warn("🚫 Edge function service unavailable (404), falling back to plaintext");
    } else if (errorMsg.includes('timeout') || errorMsg.includes('AbortError')) {
      console.warn(`⏱️ ${isMobile ? 'Mobile' : 'Desktop'} request timeout, falling back to plaintext`);
    } else {
      console.warn(`Decryption service error on ${isMobile ? 'mobile' : 'desktop'}:`, errorMsg);
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

    // Validate sellerId
    if (!sellerId || typeof sellerId !== 'string' || sellerId.length < 10) {
      console.error("❌ Invalid seller ID provided:", sellerId);
      return null;
    }

    // Get encrypted address only
    console.log("Step 1: Attempting to decrypt address for specific seller:", sellerId);
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
    // First check if there's any encrypted data we can access directly
    console.log("🔍 Querying profiles table for seller:", sellerId);
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('pickup_address_encrypted, pickup_address, id, name')
      .eq('id', sellerId)
      .maybeSingle();

    if (profileError) {
      console.log("❌ Error fetching profile:", profileError);
      return null;
    }

    if (!profile) {
      console.log("❌ No profile found for seller:", sellerId);
      return null;
    }

    console.log("📊 Profile found:", {
      id: profile.id,
      name: profile.name,
      has_encrypted: !!profile.pickup_address_encrypted,
      has_plaintext: !!profile.pickup_address
    });

    // Mobile-specific handling for encrypted data decryption failures
    if (profile.pickup_address_encrypted) {
      const isMobile = isMobileDevice();

      if (isMobile) {
        console.log("📱 Mobile device detected with encrypted address that failed decryption");
        console.log("📱 Applying mobile-specific fallback policy...");

        // On mobile, we're more permissive due to network instability
        // Try one more time with a different approach
        try {
          console.log("📱 Attempting mobile-specific decryption retry...");
          const mobileRetryResult = await retryWithBackoff(async () => {
            return await decryptAddress({
              table: 'profiles',
              target_id: sellerId,
              address_type: 'pickup'
            });
          }, 2, 2000);

          if (mobileRetryResult) {
            console.log("📱 Mobile retry successful!");
            const address = {
              street: mobileRetryResult.streetAddress || mobileRetryResult.street || "",
              city: mobileRetryResult.city || "",
              province: mobileRetryResult.province || "",
              postal_code: mobileRetryResult.postalCode || mobileRetryResult.postal_code || "",
              country: "South Africa",
            };
            return address;
          }
        } catch (retryError) {
          console.log("📱 Mobile retry also failed:", retryError);
        }

        // If we still can't decrypt on mobile and there's a plaintext fallback available,
        // use it with a warning (mobile networks are unreliable)
        if (profile.pickup_address) {
          console.warn("📱 MOBILE FALLBACK: Using plaintext address due to mobile network issues");
          try {
            const address = typeof profile.pickup_address === 'string'
              ? JSON.parse(profile.pickup_address)
              : profile.pickup_address;

            return {
              street: address.street || address.line1 || "",
              city: address.city || "",
              province: address.state || address.province || "",
              postal_code: address.postalCode || address.postal_code || "",
              country: "South Africa",
            };
          } catch (parseError) {
            console.error("📱 Mobile fallback address parsing failed:", parseError);
          }
        }
      }

      // Check if decryption failed due to authorization (400 error)
      // This happens when buyers try to access seller addresses
      // In this case, use the alternative address service as fallback for checkout
      console.log("🔐 Encrypted address exists but decryption failed - checking if authorization issue...");

      // Try to use the alternative address service for checkout
      try {
        console.log("🔄 Attempting fallback with alternative address service...");
        const { getSellerPickupAddress } = await import("@/services/addressService");
        const fallbackAddress = await getSellerPickupAddress(sellerId);

        if (fallbackAddress) {
          console.log("✅ Alternative address service provided fallback address:", fallbackAddress);

          // Ensure proper field mapping for checkout validation
          const mappedAddress = {
            street: fallbackAddress.streetAddress || fallbackAddress.street || fallbackAddress.line1 || "",
            city: fallbackAddress.city || "",
            province: fallbackAddress.province || fallbackAddress.state || "",
            postal_code: fallbackAddress.postalCode || fallbackAddress.postal_code || fallbackAddress.zip || "",
            country: "South Africa",
          };

          console.log("🔄 Mapped address format for checkout:", mappedAddress);

          // Validate that we have all required fields
          if (mappedAddress.street && mappedAddress.city && mappedAddress.province && mappedAddress.postal_code) {
            console.log("✅ Address validation passed - returning mapped address");
            return mappedAddress;
          } else {
            console.warn("⚠️ Mapped address missing required fields:", {
              street: !!mappedAddress.street,
              city: !!mappedAddress.city,
              province: !!mappedAddress.province,
              postal_code: !!mappedAddress.postal_code
            });
          }
        }
      } catch (fallbackError) {
        console.error("❌ Alternative address service also failed:", fallbackError);
      }

      console.log("🔐 All decryption methods failed - unable to retrieve seller address");
      return null;
    }

    // Only use plaintext if no encrypted version exists
    if (profile.pickup_address) {
      try {
        const address = typeof profile.pickup_address === 'string'
          ? JSON.parse(profile.pickup_address)
          : profile.pickup_address;

        console.log("✅ Using plaintext fallback address for seller:", sellerId);
        console.log("📍 Plaintext address data:", address);
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
    }

    console.log("❌ No address data found");
    return null;
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

    console.log("❌ No encrypted addresses found for user, checking profile...");

    // Check if user has any encrypted address data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('pickup_address_encrypted, shipping_address_encrypted, pickup_address, shipping_address')
      .eq('id', userId)
      .maybeSingle();

    if (profileError || !profile) {
      console.log("❌ No profile found or error:", profileError);
      return null;
    }

    // If encrypted data exists but decryption failed, don't fallback to plaintext for security
    if (profile.pickup_address_encrypted || profile.shipping_address_encrypted) {
      console.log("��� Encrypted addresses exist but decryption failed - not falling back to plaintext for security");
      return null;
    }

    // Only use plaintext if no encrypted versions exist
    if (profile.pickup_address || profile.shipping_address) {
      console.log("✅ Using plaintext addresses (no encrypted versions found)");
      return {
        pickup_address: profile.pickup_address,
        shipping_address: profile.shipping_address || profile.pickup_address,
      };
    }

    console.log("❌ No address data found for user");
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

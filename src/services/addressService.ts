import { supabase } from "@/integrations/supabase/client";
import { updateAddressValidation } from "./addressValidationService";
import { safeLogError } from "@/utils/errorHandling";
import { safeLogError as safelog, formatSupabaseError } from "@/utils/safeErrorLogger";

interface Address {
  complex: string;
  unitNumber: string;
  streetAddress: string;
  suburb: string;
  city: string;
  province: string;
  postalCode: string;
  [key: string]: string | number | boolean | null;
}

// Encrypt an address using the encrypt-address edge function
const encryptAddress = async (address: Address, options?: { save?: { table: string; target_id: string; address_type: string } }) => {
  try {
    const { data, error } = await supabase.functions.invoke('encrypt-address', {
      body: {
        object: address,
        ...options
      }
    });

    if (error) {
      console.warn("Encryption not available or failed:", error.message);
      return null; // Return null instead of throwing error
    }

    return data;
  } catch (error) {
    console.warn("Encryption service unavailable, continuing without encryption:", error instanceof Error ? error.message : String(error));
    return null; // Return null for graceful fallback
  }
};

// Decrypt an address using the improved decrypt-address edge function
const decryptAddress = async (params: { table: string; target_id: string; address_type?: string }) => {
  try {
    // Use the legacy format for backward compatibility
    const { data, error } = await supabase.functions.invoke('decrypt-address', {
      body: {
        table: params.table,
        target_id: params.target_id,
        address_type: params.address_type || 'pickup'
      }
    });

    if (error) {
      console.warn("Decryption not available or failed:", error.message);
      return null; // Return null instead of throwing error for graceful fallback
    }

    // The new function returns { success: boolean, data?: any, error?: any }
    if (data?.success) {
      return data.data || null;
    } else {
      console.warn("Decryption failed:", data?.error?.message || "Unknown error");
      return null;
    }
  } catch (error) {
    console.warn("Decryption service unavailable, falling back to plaintext:", error instanceof Error ? error.message : String(error));
    return null; // Return null for graceful fallback
  }
};

export const saveUserAddresses = async (
  userId: string,
  pickupAddress: Address,
  shippingAddress: Address,
  addressesSame: boolean,
) => {
  try {
    // First validate addresses (keep existing validation)
    const result = await updateAddressValidation(
      userId,
      pickupAddress,
      shippingAddress,
      addressesSame,
    );

    let encryptionResults = {
      pickup: false,
      shipping: false
    };

    // Try to encrypt and save pickup address
    try {
      const pickupResult = await encryptAddress(pickupAddress, {
        save: {
          table: 'profiles',
          target_id: userId,
          address_type: 'pickup'
        }
      });

      if (pickupResult && pickupResult.success) {
        console.log("✅ Pickup address encrypted and saved successfully");
        encryptionResults.pickup = true;
      } else {
        console.warn("⚠️ Pickup address encryption failed:", pickupResult?.error || "Unknown error");
      }
    } catch (encryptError) {
      console.warn("⚠️ Pickup address encryption exception:", encryptError);
    }

    // Try to encrypt and save shipping address (if different)
    if (!addressesSame) {
      try {
        const shippingResult = await encryptAddress(shippingAddress, {
          save: {
            table: 'profiles',
            target_id: userId,
            address_type: 'shipping'
          }
        });

        if (shippingResult && shippingResult.success) {
          console.log("✅ Shipping address encrypted and saved successfully");
          encryptionResults.shipping = true;
        } else {
          console.warn("⚠️ Shipping address encryption failed:", shippingResult?.error || "Unknown error");
        }
      } catch (encryptError) {
        console.warn("⚠️ Shipping address encryption exception:", encryptError);
      }
    } else {
      // If addresses are the same, mark shipping encryption as successful if pickup succeeded
      encryptionResults.shipping = encryptionResults.pickup;
    }

    // Only update encryption status and addresses_same flag - no plaintext storage
    const updateData: any = {
      addresses_same: addressesSame,
    };

    // Check encryption results and fail if encryption didn't work
    if (!encryptionResults.pickup) {
      console.error("❌ Pickup address encryption failed - cannot save addresses without encryption");
      updateData.encryption_status = 'failed';
      throw new Error("Failed to encrypt pickup address. Please try again.");
    } else if (!addressesSame && !encryptionResults.shipping) {
      console.error("❌ Shipping address encryption failed - cannot save addresses without encryption");
      updateData.encryption_status = 'failed';
      throw new Error("Failed to encrypt shipping address. Please try again.");
    } else {
      console.log("✅ All addresses encrypted successfully - no plaintext storage");
      updateData.encryption_status = 'encrypted';
    }

    const { error } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", userId);

    if (error) {
      safeLogError("Error updating profile metadata", error);
      throw error;
    }

    console.log(`Address save complete - Encryption status: pickup=${encryptionResults.pickup}, shipping=${encryptionResults.shipping}`);

    return {
      pickup_address: pickupAddress,
      shipping_address: addressesSame ? pickupAddress : shippingAddress,
      addresses_same: addressesSame,
      canListBooks: result.canListBooks,
      encryption_status: {
        pickup: encryptionResults.pickup,
        shipping: encryptionResults.shipping
      }
    };
  } catch (error) {
    safeLogError("Error saving addresses", error);
    throw error;
  }
};

export const getSellerPickupAddress = async (sellerId: string) => {
  try {
    console.log("Fetching encrypted pickup address for seller:", sellerId);

    // Get encrypted address only - no plaintext fallback
    const decryptedAddress = await decryptAddress({
      table: 'profiles',
      target_id: sellerId,
      address_type: 'pickup'
    });

    if (decryptedAddress) {
      console.log("✅ Successfully fetched encrypted seller pickup address");
      return decryptedAddress;
    }

    console.log("❌ No encrypted pickup address found for seller");
    return null;
  } catch (error) {
    console.error("Error in getSellerPickupAddress:", {
      sellerId,
      message: error instanceof Error ? error.message : String(error),
      code: error?.code,
      details: error?.details,
    });

    // Handle network errors
    if (
      error instanceof TypeError &&
      error.message.includes("Failed to fetch")
    ) {
      throw new Error(
        "Network connection error while fetching seller address.",
      );
    }

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    throw new Error(`Failed to get seller pickup address: ${errorMessage}`);
  }
};

export const getUserAddresses = async (userId: string) => {
  try {
    console.log("Fetching encrypted addresses for user:", userId);

    // Get encrypted addresses only - no plaintext fallback
    const pickupAddress = await decryptAddress({
      table: 'profiles',
      target_id: userId,
      address_type: 'pickup'
    });

    const shippingAddress = await decryptAddress({
      table: 'profiles',
      target_id: userId,
      address_type: 'shipping'
    });

    if (pickupAddress || shippingAddress) {
      console.log("✅ Successfully fetched encrypted addresses");

      // Get addresses_same flag from profile metadata
      const { data: profileData } = await supabase
        .from("profiles")
        .select("addresses_same")
        .eq("id", userId)
        .single();

      const addressesSame = profileData?.addresses_same ?? (
        pickupAddress && shippingAddress ?
          JSON.stringify(pickupAddress) === JSON.stringify(shippingAddress) :
          !shippingAddress
      );

      return {
        pickup_address: pickupAddress,
        shipping_address: shippingAddress || pickupAddress,
        addresses_same: addressesSame,
      };
    }

    console.log("❌ No encrypted addresses found for user");
    return null;
  } catch (error) {
    safelog("Error in getUserAddresses", error, {
      userId,
    });

    // Handle network errors specifically
    if (
      error instanceof TypeError &&
      error.message.includes("Failed to fetch")
    ) {
      throw new Error(
        "Network connection error. Please check your internet connection and try again.",
      );
    }

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    throw new Error(`Failed to load addresses: ${errorMessage}`);
  }
};

// Update all user's book listings with new pickup address and province
export const updateBooksPickupAddress = async (
  userId: string,
  newPickupAddress: any,
): Promise<{ success: boolean; updatedCount: number; error?: string }> => {
  try {
    console.log("Updating pickup address and province for all books of user:", userId);

    // Extract province from the new pickup address
    let province = null;
    if (newPickupAddress?.province) {
      province = newPickupAddress.province;
    } else if (typeof newPickupAddress === "string") {
      // Fallback for string-based addresses
      const addressStr = newPickupAddress.toLowerCase();
      if (addressStr.includes("western cape")) province = "Western Cape";
      else if (addressStr.includes("gauteng")) province = "Gauteng";
      else if (addressStr.includes("kwazulu")) province = "KwaZulu-Natal";
      else if (addressStr.includes("eastern cape")) province = "Eastern Cape";
      else if (addressStr.includes("free state")) province = "Free State";
      else if (addressStr.includes("limpopo")) province = "Limpopo";
      else if (addressStr.includes("mpumalanga")) province = "Mpumalanga";
      else if (addressStr.includes("northern cape")) province = "Northern Cape";
      else if (addressStr.includes("north west")) province = "North West";
    }

    // Get all user's books
    const { data: books, error: fetchError } = await supabase
      .from("books")
      .select("id")
      .eq("seller_id", userId);

    if (fetchError) {
      console.error("Error fetching user books:", fetchError);
      return {
        success: false,
        updatedCount: 0,
        error: fetchError.message || "Failed to fetch book listings",
      };
    }

    if (!books || books.length === 0) {
      return {
        success: true,
        updatedCount: 0,
      };
    }

    // Encrypt address for each book
    const encryptPromises = books.map(book => 
      encryptAddress(newPickupAddress, {
        save: {
          table: 'books',
          target_id: book.id,
          address_type: 'pickup'
        }
      })
    );

    await Promise.all(encryptPromises);

    // Update only province metadata - addresses are encrypted only
    const updateData: any = {};
    if (province) {
      updateData.province = province;
    }

    // Only update if we have something to update
    if (Object.keys(updateData).length === 0) {
      return {
        success: true,
        updatedCount: books.length,
      };
    }

    const { data, error } = await supabase
      .from("books")
      .update(updateData)
      .eq("seller_id", userId)
      .select("id");

    if (error) {
      console.error("Error updating books pickup address and province:", error);
      return {
        success: false,
        updatedCount: 0,
        error: error.message || "Failed to update book listings",
      };
    }

    const updatedCount = data?.length || 0;
    console.log(
      `Successfully updated pickup address and province for ${updatedCount} book listings${province ? ` with province: ${province}` : ""}`,
    );

    return {
      success: true,
      updatedCount,
    };
  } catch (error) {
    console.error("Error in updateBooksPickupAddress:", error);
    return {
      success: false,
      updatedCount: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

// Get encrypted book pickup address for shipping calculations
export const getBookPickupAddress = async (bookId: string) => {
  try {
    console.log("Fetching encrypted pickup address for book:", bookId);

    // Get encrypted address only - no plaintext fallback
    const decryptedAddress = await decryptAddress({
      table: 'books',
      target_id: bookId,
      address_type: 'pickup'
    });

    if (decryptedAddress) {
      console.log("✅ Successfully fetched encrypted book pickup address");
      return decryptedAddress;
    }

    console.log("❌ No encrypted pickup address found for book");
    return null;
  } catch (error) {
    console.error("Error in getBookPickupAddress:", error);
    throw error;
  }
};

// Get encrypted order shipping address for delivery
export const getOrderShippingAddress = async (orderId: string) => {
  try {
    console.log("Fetching encrypted shipping address for order:", orderId);

    // Get encrypted address only - no plaintext fallback
    const decryptedAddress = await decryptAddress({
      table: 'orders',
      target_id: orderId,
      address_type: 'shipping'
    });

    if (decryptedAddress) {
      console.log("✅ Successfully fetched encrypted order shipping address");
      return decryptedAddress;
    }

    console.log("❌ No encrypted shipping address found for order");
    return null;
  } catch (error) {
    console.error("Error in getOrderShippingAddress:", error);
    throw error;
  }
};

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

// Decrypt an address using the decrypt-address edge function
const decryptAddress = async (params: { table: string; target_id: string; address_type?: string }) => {
  try {
    const { data, error } = await supabase.functions.invoke('decrypt-address', {
      body: {
        fetch: params
      }
    });

    if (error) {
      console.warn("Decryption not available or failed:", error.message);
      return null; // Return null instead of throwing error for graceful fallback
    }

    return data?.data || null;
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

    // Try to encrypt and save pickup address (non-blocking)
    try {
      await encryptAddress(pickupAddress, {
        save: {
          table: 'profiles',
          target_id: userId,
          address_type: 'pickup'
        }
      });
      console.log("✅ Pickup address encrypted successfully");
    } catch (encryptError) {
      console.warn("⚠️ Pickup address encryption failed, continuing with plaintext only");
    }

    // Try to encrypt and save shipping address (if different, non-blocking)
    if (!addressesSame) {
      try {
        await encryptAddress(shippingAddress, {
          save: {
            table: 'profiles',
            target_id: userId,
            address_type: 'shipping'
          }
        });
        console.log("✅ Shipping address encrypted successfully");
      } catch (encryptError) {
        console.warn("⚠️ Shipping address encryption failed, continuing with plaintext only");
      }
    }

    // Update addresses_same flag and keep legacy plaintext (always save plaintext)
    const { error } = await supabase
      .from("profiles")
      .update({
        pickup_address: pickupAddress,
        shipping_address: addressesSame ? pickupAddress : shippingAddress,
        addresses_same: addressesSame,
      })
      .eq("id", userId);

    if (error) {
      safeLogError("Error updating profile addresses", error);
      throw error;
    }

    return {
      pickup_address: pickupAddress,
      shipping_address: addressesSame ? pickupAddress : shippingAddress,
      addresses_same: addressesSame,
      canListBooks: result.canListBooks,
    };
  } catch (error) {
    safeLogError("Error saving addresses", error);
    throw error;
  }
};

export const getSellerPickupAddress = async (sellerId: string) => {
  try {
    console.log("Fetching pickup address for seller:", sellerId);

    // Try to get encrypted address first (non-blocking)
    const decryptedAddress = await decryptAddress({
      table: 'profiles',
      target_id: sellerId,
      address_type: 'pickup'
    });

    if (decryptedAddress) {
      console.log("✅ Successfully fetched encrypted seller pickup address");
      return decryptedAddress;
    }

    console.log("ℹ️ No encrypted address found, using plaintext fallback");

    // Fallback to plaintext address (during transition period)
    const { data, error } = await supabase
      .from("profiles")
      .select("pickup_address")
      .eq("id", sellerId)
      .single();

    if (error) {
      const errorMsg =
        error.message || error.details || "Unknown database error";
      console.error("Database error fetching seller pickup address:", {
        message: errorMsg,
        code: error.code,
        sellerId,
      });

      // Handle no data found case
      if (error.code === "PGRST116") {
        console.log("No pickup address found for seller");
        return null;
      }

      throw new Error(`Failed to fetch seller pickup address: ${errorMsg}`);
    }

    console.log(
      "Successfully fetched seller pickup address:",
      data?.pickup_address,
    );
    return data?.pickup_address || null;
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
    console.log("Fetching addresses for user:", userId);

    // Try to get encrypted addresses first (non-blocking)
    let pickupAddress = null;
    let shippingAddress = null;

    try {
      pickupAddress = await decryptAddress({
        table: 'profiles',
        target_id: userId,
        address_type: 'pickup'
      });

      shippingAddress = await decryptAddress({
        table: 'profiles',
        target_id: userId,
        address_type: 'shipping'
      });

      if (pickupAddress || shippingAddress) {
        console.log("✅ Successfully fetched encrypted addresses");
        // Determine if addresses are the same
        const addressesSame = pickupAddress && shippingAddress ?
          JSON.stringify(pickupAddress) === JSON.stringify(shippingAddress) :
          !shippingAddress;

        return {
          pickup_address: pickupAddress,
          shipping_address: shippingAddress || pickupAddress,
          addresses_same: addressesSame,
        };
      }
    } catch (error) {
      console.warn("⚠️ Encryption service unavailable, using plaintext addresses");
    }

    // Fallback to plaintext addresses (during transition period)
    const { data, error } = await supabase
      .from("profiles")
      .select("pickup_address, shipping_address, addresses_same")
      .eq("id", userId)
      .single();

    if (error) {
      const errorMsg =
        error.message || error.details || "Unknown database error";
      safelog("Database error fetching addresses", error, {
        code: error.code,
        hint: error.hint,
      });

      // Handle specific error cases
      if (error.code === "PGRST116") {
        // No row found - this is acceptable, return null
        console.log("No address data found for user, returning null");
        return null;
      }

      throw new Error(`Database error: ${errorMsg}`);
    }

    console.log("Successfully fetched address data:", data);
    return data;
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

    // Update both pickup_address (plaintext) and province for backward compatibility
    const updateData: any = { pickup_address: newPickupAddress };
    if (province) {
      updateData.province = province;
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
    console.log("Fetching pickup address for book:", bookId);

    // Try to get encrypted address first
    try {
      const decryptedAddress = await decryptAddress({
        table: 'books',
        target_id: bookId,
        address_type: 'pickup'
      });

      if (decryptedAddress) {
        console.log("Successfully fetched encrypted book pickup address");
        return decryptedAddress;
      }
    } catch (error) {
      console.log("Encrypted address not found or failed to decrypt, falling back to plaintext");
    }

    // Fallback to plaintext address (during transition period)
    const { data, error } = await supabase
      .from("books")
      .select("pickup_address")
      .eq("id", bookId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        console.log("No pickup address found for book");
        return null;
      }
      throw new Error(`Failed to fetch book pickup address: ${error.message}`);
    }

    return data?.pickup_address || null;
  } catch (error) {
    console.error("Error in getBookPickupAddress:", error);
    throw error;
  }
};

// Get encrypted order shipping address for delivery
export const getOrderShippingAddress = async (orderId: string) => {
  try {
    console.log("Fetching shipping address for order:", orderId);

    // Try to get encrypted address first
    try {
      const decryptedAddress = await decryptAddress({
        table: 'orders',
        target_id: orderId,
        address_type: 'shipping'
      });

      if (decryptedAddress) {
        console.log("Successfully fetched encrypted order shipping address");
        return decryptedAddress;
      }
    } catch (error) {
      console.log("Encrypted address not found or failed to decrypt, falling back to plaintext");
    }

    // Fallback to plaintext address (during transition period)
    const { data, error } = await supabase
      .from("orders")
      .select("shipping_address")
      .eq("id", orderId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        console.log("No shipping address found for order");
        return null;
      }
      throw new Error(`Failed to fetch order shipping address: ${error.message}`);
    }

    return data?.shipping_address || null;
  } catch (error) {
    console.error("Error in getOrderShippingAddress:", error);
    throw error;
  }
};

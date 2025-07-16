import { supabase } from "@/integrations/supabase/client";
import { updateAddressValidation } from "./addressValidationService";
import { safeLogError } from "@/utils/errorHandling";

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

export const saveUserAddresses = async (
  userId: string,
  pickupAddress: Address,
  shippingAddress: Address,
  addressesSame: boolean,
) => {
  try {
    const result = await updateAddressValidation(
      userId,
      pickupAddress,
      shippingAddress,
      addressesSame,
    );

    const { data, error } = await supabase
      .from("profiles")
      .select("pickup_address, shipping_address, addresses_same")
      .eq("id", userId)
      .single();

    if (error) {
      safeLogError("Error fetching updated addresses", error);
      throw error;
    }

    return {
      pickup_address: data.pickup_address,
      shipping_address: data.shipping_address,
      addresses_same: data.addresses_same,
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
      error,
      sellerId,
      message: error instanceof Error ? error.message : String(error),
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

    const { data, error } = await supabase
      .from("profiles")
      .select("pickup_address, shipping_address, addresses_same")
      .eq("id", userId)
      .single();

    if (error) {
      const errorMsg =
        error.message || error.details || "Unknown database error";
      console.error("Database error fetching addresses:", {
        message: errorMsg,
        code: error.code,
        details: error.details,
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
    console.error("Error in getUserAddresses:", {
      error,
      userId,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
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

// Update all user's book listings with new pickup address
export const updateBooksPickupAddress = async (
  userId: string,
  newPickupAddress: any,
): Promise<{ success: boolean; updatedCount: number; error?: string }> => {
  try {
    console.log("Updating pickup address for all books of user:", userId);

    const { data, error } = await supabase
      .from("books")
      .update({ pickup_address: newPickupAddress })
      .eq("seller_id", userId)
      .select("id");

    if (error) {
      console.error("Error updating books pickup address:", error);
      return {
        success: false,
        updatedCount: 0,
        error: error.message || "Failed to update book listings",
      };
    }

    const updatedCount = data?.length || 0;
    console.log(
      `Successfully updated pickup address for ${updatedCount} book listings`,
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

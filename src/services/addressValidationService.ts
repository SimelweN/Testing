import { supabase } from "@/integrations/supabase/client";
import { safeLogError } from "@/utils/errorHandling";

interface Address {
  complex?: string;
  unitNumber?: string;
  streetAddress: string;
  suburb?: string;
  city: string;
  province: string;
  postalCode: string;
  [key: string]: string | number | boolean | null; // Make it compatible with Json type
}

export const validateAddress = (address: Address): boolean => {
  return !!(
    address.streetAddress &&
    address.city &&
    address.province &&
    address.postalCode
  );
};

export const canUserListBooks = async (userId: string): Promise<boolean> => {
  try {
    // Check if user has valid pickup address
    const { data, error } = await supabase
      .from("profiles")
      .select("pickup_address, addresses_same")
      .eq("id", userId)
      .single();

    if (error) {
      safeLogError("Error checking if user can list books", error, { userId });
      return false;
    }

    // Must have completed address setup AND have valid pickup address
    if (data?.addresses_same === null) {
      console.log(`📍 User ${userId} has not completed address setup`);
      return false;
    }

    if (!data?.pickup_address) {
      console.log(`📍 User ${userId} has no pickup address`);
      return false;
    }

    // Validate pickup address content
    const pickupAddr = data.pickup_address as any;
    const streetField = pickupAddr.streetAddress || pickupAddr.street;
    const isValidAddress = !!(
      pickupAddr &&
      typeof pickupAddr === "object" &&
      streetField &&
      pickupAddr.city &&
      pickupAddr.province &&
      pickupAddr.postalCode
    );

    if (!isValidAddress) {
      console.log(`📍 User ${userId} has incomplete pickup address:`, {
        hasStreet: !!streetField,
        hasCity: !!pickupAddr.city,
        hasProvince: !!pickupAddr.province,
        hasPostalCode: !!pickupAddr.postalCode
      });
      return false;
    }

    console.log(`✅ User ${userId} can list books - valid pickup address`);
    return true;
  } catch (error) {
    safeLogError("Error in canUserListBooks", error, { userId });
    return false;
  }
};

export const updateAddressValidation = async (
  userId: string,
  pickupAddress: Address,
  shippingAddress: Address,
  addressesSame: boolean,
) => {
  try {
    const isPickupValid = validateAddress(pickupAddress);
    const isShippingValid = addressesSame
      ? isPickupValid
      : validateAddress(shippingAddress);
    const canList = isPickupValid && isShippingValid;

    // Ensure address objects have both field names for compatibility
    const normalizedPickupAddress = {
      ...pickupAddress,
      streetAddress:
        pickupAddress.streetAddress || (pickupAddress as any).street,
    };
    const normalizedShippingAddress = {
      ...shippingAddress,
      streetAddress:
        shippingAddress.streetAddress || (shippingAddress as any).street,
    };

    const { error } = await supabase
      .from("profiles")
      .update({
        pickup_address: normalizedPickupAddress as Record<string, unknown>,
        shipping_address: normalizedShippingAddress as Record<string, unknown>,
        addresses_same: addressesSame,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) {
      safeLogError("Error updating address validation", error, { userId });
      throw new Error(
        `Failed to update address validation: ${error.message || "Unknown error"}`,
      );
    }

    return { canListBooks: canList };
  } catch (error) {
    safeLogError("Error in updateAddressValidation", error, { userId });
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Address validation failed: ${errorMessage}`);
  }
};

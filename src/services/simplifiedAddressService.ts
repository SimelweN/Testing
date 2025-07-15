import { supabase } from "@/integrations/supabase/client";
import { CheckoutAddress } from "@/types/checkout";

interface SimpleAddress {
  streetAddress: string;
  city: string;
  province: string;
  postalCode: string;
}

export const getSellerDeliveryAddress = async (
  sellerId: string,
): Promise<CheckoutAddress | null> => {
  try {
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
    console.error("Error getting user addresses:", error);
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

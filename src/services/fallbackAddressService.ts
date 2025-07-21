import { supabase } from '@/lib/supabase';
import { AddressData } from '@/hooks/useAddressFallback';

export interface StoredAddress {
  id: string;
  user_id: string;
  type: 'shipping' | 'pickup' | 'billing';
  google_maps_data?: AddressData;
  manual_entry_data?: AddressData;
  selected_method: 'google_maps' | 'manual_entry';
  is_primary: boolean;
  created_at: string;
  updated_at: string;
  metadata?: {
    confidence_level?: 'high' | 'medium' | 'low';
    validation_attempts?: number;
    last_validated?: string;
    fallback_reason?: string;
  };
}

class FallbackAddressService {
  /**
   * Save address with dual storage - both Google Maps and manual entry data
   */
  async saveAddress(
    userId: string,
    addressData: AddressData,
    type: 'shipping' | 'pickup' | 'billing' = 'shipping',
    isPrimary: boolean = false
  ): Promise<{ success: boolean; address?: StoredAddress; error?: string }> {
    try {
      // Prepare the data structure for dual storage
      const addressRecord = {
        user_id: userId,
        type,
        is_primary: isPrimary,
        selected_method: addressData.source,
        metadata: {
          confidence_level: this.calculateConfidenceLevel(addressData),
          validation_attempts: 1,
          last_validated: new Date().toISOString(),
          fallback_reason: addressData.source === 'manual_entry' ? 'google_maps_unavailable' : undefined,
        },
      };

      // Store based on source
      if (addressData.source === 'google_maps') {
        Object.assign(addressRecord, {
          google_maps_data: addressData,
          manual_entry_data: this.convertToManualFormat(addressData), // Also store as manual for fallback
        });
      } else {
        Object.assign(addressRecord, {
          manual_entry_data: addressData,
          google_maps_data: null, // No Google Maps data available
        });
      }

      // If this is primary, unset other primary addresses of the same type
      if (isPrimary) {
        await supabase
          .from('user_addresses')
          .update({ is_primary: false })
          .eq('user_id', userId)
          .eq('type', type);
      }

      const { data, error } = await supabase
        .from('user_addresses')
        .insert(addressRecord)
        .select()
        .single();

      if (error) {
        console.error('Failed to save address:', error);
        return { success: false, error: error.message };
      }

      return { success: true, address: data };
    } catch (error) {
      console.error('Address save error:', error);
      return { success: false, error: 'Failed to save address' };
    }
  }

  /**
   * Update existing address with new data
   */
  async updateAddress(
    addressId: string,
    addressData: AddressData,
    userId: string
  ): Promise<{ success: boolean; address?: StoredAddress; error?: string }> {
    try {
      const updateData: any = {
        selected_method: addressData.source,
        updated_at: new Date().toISOString(),
        metadata: {
          confidence_level: this.calculateConfidenceLevel(addressData),
          last_validated: new Date().toISOString(),
          fallback_reason: addressData.source === 'manual_entry' ? 'google_maps_unavailable' : undefined,
        },
      };

      // Update the appropriate data field
      if (addressData.source === 'google_maps') {
        updateData.google_maps_data = addressData;
        updateData.manual_entry_data = this.convertToManualFormat(addressData);
      } else {
        updateData.manual_entry_data = addressData;
      }

      const { data, error } = await supabase
        .from('user_addresses')
        .update(updateData)
        .eq('id', addressId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, address: data };
    } catch (error) {
      console.error('Address update error:', error);
      return { success: false, error: 'Failed to update address' };
    }
  }

  /**
   * Get all addresses for a user
   */
  async getUserAddresses(
    userId: string,
    type?: 'shipping' | 'pickup' | 'billing'
  ): Promise<{ success: boolean; addresses?: StoredAddress[]; error?: string }> {
    try {
      let query = supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', userId)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: false });

      if (type) {
        query = query.eq('type', type);
      }

      const { data, error } = await query;

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, addresses: data || [] };
    } catch (error) {
      console.error('Get addresses error:', error);
      return { success: false, error: 'Failed to fetch addresses' };
    }
  }

  /**
   * Get the best available address (prioritizing Google Maps data)
   */
  async getBestAddress(
    userId: string,
    type: 'shipping' | 'pickup' | 'billing'
  ): Promise<{ success: boolean; address?: AddressData; source?: StoredAddress; error?: string }> {
    try {
      const result = await this.getUserAddresses(userId, type);
      
      if (!result.success || !result.addresses?.length) {
        return { success: false, error: 'No addresses found' };
      }

      // Find primary address first
      const primaryAddress = result.addresses.find(addr => addr.is_primary);
      const targetAddress = primaryAddress || result.addresses[0];

      // Return the best available data (prioritize Google Maps if available)
      const bestData = targetAddress.google_maps_data || targetAddress.manual_entry_data;
      
      if (!bestData) {
        return { success: false, error: 'No valid address data found' };
      }

      return { 
        success: true, 
        address: bestData,
        source: targetAddress 
      };
    } catch (error) {
      console.error('Get best address error:', error);
      return { success: false, error: 'Failed to get best address' };
    }
  }

  /**
   * Delete an address
   */
  async deleteAddress(
    addressId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('user_addresses')
        .delete()
        .eq('id', addressId)
        .eq('user_id', userId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Delete address error:', error);
      return { success: false, error: 'Failed to delete address' };
    }
  }

  /**
   * Set an address as primary
   */
  async setPrimaryAddress(
    addressId: string,
    userId: string,
    type: 'shipping' | 'pickup' | 'billing'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // First, unset all primary addresses of this type
      await supabase
        .from('user_addresses')
        .update({ is_primary: false })
        .eq('user_id', userId)
        .eq('type', type);

      // Then set the target address as primary
      const { error } = await supabase
        .from('user_addresses')
        .update({ is_primary: true })
        .eq('id', addressId)
        .eq('user_id', userId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Set primary address error:', error);
      return { success: false, error: 'Failed to set primary address' };
    }
  }

  /**
   * Validate and clean address data
   */
  validateAddressData(address: Partial<AddressData>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!address.street?.trim()) errors.push('Street address is required');
    if (!address.city?.trim()) errors.push('City is required');
    if (!address.province?.trim()) errors.push('Province is required');
    if (!address.postalCode?.trim()) errors.push('Postal code is required');
    
    // Validate postal code format (basic South African postal code validation)
    if (address.postalCode && !/^\d{4}$/.test(address.postalCode.trim())) {
      errors.push('Postal code must be 4 digits');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Calculate confidence level based on address data
   */
  private calculateConfidenceLevel(address: AddressData): 'high' | 'medium' | 'low' {
    if (address.source === 'google_maps' && address.latitude && address.longitude) {
      return 'high';
    }
    
    if (address.source === 'manual_entry' && address.latitude && address.longitude) {
      return 'medium';
    }
    
    return 'low';
  }

  /**
   * Convert Google Maps address to manual entry format for fallback storage
   */
  private convertToManualFormat(googleMapsAddress: AddressData): AddressData {
    return {
      ...googleMapsAddress,
      source: 'manual_entry',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Merge Google Maps and manual data (useful for validation)
   */
  mergeAddressData(
    googleData?: AddressData,
    manualData?: AddressData
  ): AddressData | null {
    if (!googleData && !manualData) return null;
    
    // Prefer Google Maps data for accuracy, fall back to manual
    const baseData = googleData || manualData!;
    
    return {
      formattedAddress: googleData?.formattedAddress || manualData?.formattedAddress || '',
      street: googleData?.street || manualData?.street || '',
      city: googleData?.city || manualData?.city || '',
      province: googleData?.province || manualData?.province || '',
      postalCode: googleData?.postalCode || manualData?.postalCode || '',
      country: googleData?.country || manualData?.country || 'South Africa',
      latitude: googleData?.latitude || manualData?.latitude,
      longitude: googleData?.longitude || manualData?.longitude,
      source: googleData ? 'google_maps' : 'manual_entry',
      timestamp: new Date().toISOString(),
    };
  }
}

export const fallbackAddressService = new FallbackAddressService();
export default fallbackAddressService;

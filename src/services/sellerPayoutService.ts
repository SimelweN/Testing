import { supabase } from "@/integrations/supabase/client";

export interface SellerPayout {
  id: string;
  seller_id: string;
  amount: number;
  status: string;
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  bank_details_snapshot?: any;
  paystack_transfer_code?: string;
  paystack_recipient_code?: string;
  created_at: string;
  updated_at: string;
  metadata?: any;
}

export interface PayoutStatistics {
  pending_count: number;
  approved_count: number;
  denied_count: number;
  total_approved_amount: number;
}

export interface PayoutItem {
  id: string;
  book_title: string;
  sale_amount: number;
  commission_amount: number;
  seller_amount: number;
  sale_date: string;
}

export interface PayoutDetails extends SellerPayout {
  seller_name?: string;
  seller_email?: string;
  reviewer_name?: string;
  payout_items?: PayoutItem[];
}

class SellerPayoutService {
  async getPayoutStatistics(): Promise<PayoutStatistics> {
    const { data, error } = await supabase.rpc('get_payout_statistics');
    
    if (error) {
      console.error('Error fetching payout statistics:', error);
      throw new Error('Failed to fetch payout statistics');
    }
    
    return data[0] || {
      pending_count: 0,
      approved_count: 0,
      denied_count: 0,
      total_approved_amount: 0
    };
  }

  async getPayoutsByStatus(status: string): Promise<SellerPayout[]> {
    const { data, error } = await supabase
      .from('seller_payouts')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching payouts:', error);
      throw new Error('Failed to fetch payouts');
    }

    return data || [];
  }

  async getPayoutsWithSellerDetails(status: string): Promise<PayoutDetails[]> {
    const payouts = await this.getPayoutsByStatus(status);

    // Get seller details for each payout
    const payoutsWithDetails = await Promise.all(
      payouts.map(async (payout) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name, email')
          .eq('id', payout.seller_id)
          .single();

        return {
          ...payout,
          seller_name: profile?.name || 'Unknown',
          seller_email: profile?.email || 'unknown@email.com'
        } as PayoutDetails;
      })
    );

    return payoutsWithDetails;
  }

  async getPayoutDetails(payoutId: string): Promise<PayoutDetails | null> {
    const { data, error } = await supabase
      .from('seller_payouts')
      .select('*')
      .eq('id', payoutId)
      .single();

    if (error) {
      console.error('Error fetching payout details:', error);
      throw new Error('Failed to fetch payout details');
    }

    // Get seller details separately from profiles table
    if (data) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, email')
        .eq('id', data.seller_id)
        .single();

      if (profile) {
        data.seller_name = profile.name;
        data.seller_email = profile.email;
      }
    }

    return data || null;
  }

  async approvePayout(payoutId: string, notes?: string): Promise<boolean> {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user.user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase.rpc('approve_seller_payout', {
      p_payout_id: payoutId,
      p_reviewer_id: user.user.id,
      p_notes: notes || null
    });

    if (error) {
      console.error('Error approving payout:', error);
      throw new Error('Failed to approve payout: ' + error.message);
    }

    return data;
  }

  async denyPayout(payoutId: string, reason: string): Promise<boolean> {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user.user) {
      throw new Error('User not authenticated');
    }

    if (!reason || reason.trim() === '') {
      throw new Error('Denial reason is required');
    }

    const { data, error } = await supabase.rpc('deny_seller_payout', {
      p_payout_id: payoutId,
      p_reviewer_id: user.user.id,
      p_reason: reason
    });

    if (error) {
      console.error('Error denying payout:', error);
      throw new Error('Failed to deny payout: ' + error.message);
    }

    return data;
  }

  async createPayoutNotification(
    payoutId: string,
    type: 'approval' | 'denial' | 'completion',
    emailAddress: string,
    templateData?: any
  ): Promise<void> {
    const { error } = await supabase
      .from('payout_notifications')
      .insert({
        payout_id: payoutId,
        notification_type: type,
        email_address: emailAddress,
        template_data: templateData,
        status: 'pending'
      });

    if (error) {
      console.error('Error creating notification:', error);
      throw new Error('Failed to create notification');
    }
  }

  async getAuditLog(payoutId: string) {
    const { data, error } = await supabase
      .from('payout_audit_log')
      .select('*')
      .eq('payout_id', payoutId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching audit log:', error);
      throw new Error('Failed to fetch audit log');
    }

    return data || [];
  }

  calculateCommission(bookPrice: number, deliveryFee: number = 0): {
    sellerAmount: number;
    platformFee: number;
    totalAmount: number;
  } {
    const platformCommissionRate = 0.10; // 10%
    const platformCommission = bookPrice * platformCommissionRate;
    const sellerAmount = bookPrice - platformCommission;
    const platformFee = platformCommission + deliveryFee;
    const totalAmount = bookPrice + deliveryFee;

    return {
      sellerAmount: Number(sellerAmount.toFixed(2)),
      platformFee: Number(platformFee.toFixed(2)),
      totalAmount: Number(totalAmount.toFixed(2))
    };
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2
    }).format(amount);
  }
}

export const sellerPayoutService = new SellerPayoutService();

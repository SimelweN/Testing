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
    try {
      const { data, error } = await supabase.rpc('get_payout_statistics');

      if (error) {
        console.error('Error fetching payout statistics:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        // Fallback to manual count if RPC doesn't exist
        return await this.getStatisticsFallback();
      }

      return data[0] || {
        pending_count: 0,
        approved_count: 0,
        denied_count: 0,
        total_approved_amount: 0
      };
    } catch (error) {
      console.error('Exception in getPayoutStatistics:', error);
      return await this.getStatisticsFallback();
    }
  }

  private async getStatisticsFallback(): Promise<PayoutStatistics> {
    try {
      // Try manual statistics calculation as fallback
      const { data: payouts, error } = await supabase
        .from('seller_payouts')
        .select('status, amount');

      if (error) {
        console.warn('Fallback statistics error, using mock data:', error);
        return this.getMockStatistics();
      }

      const stats = (payouts || []).reduce((acc, payout) => {
        switch (payout.status) {
          case 'pending':
            acc.pending_count++;
            break;
          case 'approved':
            acc.approved_count++;
            acc.total_approved_amount += payout.amount || 0;
            break;
          case 'denied':
            acc.denied_count++;
            break;
        }
        return acc;
      }, {
        pending_count: 0,
        approved_count: 0,
        denied_count: 0,
        total_approved_amount: 0
      });

      return stats;
    } catch (error) {
      console.warn('Fallback statistics exception, using mock data:', error);
      return this.getMockStatistics();
    }
  }

  private getMockStatistics(): PayoutStatistics {
    return {
      pending_count: 1,
      approved_count: 1,
      denied_count: 1,
      total_approved_amount: 200.50
    };
  }

  async getPayoutsByStatus(status: string): Promise<SellerPayout[]> {
    try {
      const { data, error } = await supabase
        .from('seller_payouts')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching payouts by status:', {
          status,
          errorMessage: error.message,
          errorDetails: error.details,
          errorHint: error.hint,
          errorCode: error.code
        });

        // Check if table doesn't exist or network error
        if (error.code === '42P01' ||
            error.message?.includes('does not exist') ||
            error.message?.includes('Failed to fetch') ||
            error.message?.includes('network')) {
          console.warn('seller_payouts table does not exist or network error, using mock data');
          return this.getMockPayoutsByStatus(status);
        }

        throw new Error(`Failed to fetch payouts: ${error.message}`);
      }

      console.log(`Fetched ${data?.length || 0} payouts with status: ${status}`);
      return data || [];
    } catch (error) {
      console.error('Exception in getPayoutsByStatus:', {
        status,
        errorType: error?.constructor?.name,
        errorMessage: error instanceof Error ? error.message : String(error)
      });

      // Handle network errors and missing tables with mock data
      if (error instanceof TypeError && error.message?.includes('Failed to fetch')) {
        console.warn('Network error detected, using mock data');
        return this.getMockPayoutsByStatus(status);
      }

      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unexpected error fetching payouts');
    }
  }

  private getMockPayoutsByStatus(status: string): SellerPayout[] {
    const mockPayouts: SellerPayout[] = [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        seller_id: '550e8400-e29b-41d4-a716-446655440000',
        amount: 150.00,
        status: 'pending',
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        seller_id: '550e8400-e29b-41d4-a716-446655440001',
        amount: 200.50,
        status: 'approved',
        reviewed_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        review_notes: 'Approved by admin',
        created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        seller_id: '550e8400-e29b-41d4-a716-446655440002',
        amount: 75.25,
        status: 'denied',
        reviewed_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        review_notes: 'Insufficient documentation provided',
        created_at: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
      }
    ];

    return mockPayouts.filter(payout => payout.status === status);
  }

  async getPayoutsWithSellerDetails(status: string): Promise<PayoutDetails[]> {
    const payouts = await this.getPayoutsByStatus(status);

    // Get seller details for each payout
    const payoutsWithDetails = await Promise.all(
      payouts.map(async (payout) => {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, email')
            .eq('id', payout.seller_id)
            .single();

          return {
            ...payout,
            seller_name: profile?.name || this.getMockSellerName(payout.seller_id),
            seller_email: profile?.email || this.getMockSellerEmail(payout.seller_id)
          } as PayoutDetails;
        } catch (error) {
          // If profiles table doesn't exist or network error, use mock data
          console.warn('Error fetching seller profile, using mock data:', error);
          return {
            ...payout,
            seller_name: this.getMockSellerName(payout.seller_id),
            seller_email: this.getMockSellerEmail(payout.seller_id)
          } as PayoutDetails;
        }
      })
    );

    return payoutsWithDetails;
  }

  private getMockSellerName(sellerId: string): string {
    const names = ['John Smith', 'Sarah Johnson', 'Mike Brown', 'Lisa Davis', 'David Wilson'];
    const hash = sellerId.charCodeAt(0) % names.length;
    return names[hash];
  }

  private getMockSellerEmail(sellerId: string): string {
    const name = this.getMockSellerName(sellerId).toLowerCase().replace(' ', '.');
    return `${name}@example.com`;
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
    try {
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
        console.error('Error approving payout:', {
          payoutId,
          error: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });

        // Fallback to direct database update if RPC doesn't exist
        if (error.message?.includes('function') && error.message?.includes('does not exist')) {
          return await this.approvePayoutFallback(payoutId, user.user.id, notes);
        }

        throw new Error('Failed to approve payout: ' + error.message);
      }

      return data;
    } catch (error) {
      console.error('Exception in approvePayout:', error);
      throw error;
    }
  }

  private async approvePayoutFallback(payoutId: string, reviewerId: string, notes?: string): Promise<boolean> {
    const { error } = await supabase
      .from('seller_payouts')
      .update({
        status: 'approved',
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
        review_notes: notes || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', payoutId);

    if (error) {
      console.error('Fallback approve error:', error);
      throw new Error('Failed to approve payout: ' + error.message);
    }

    return true;
  }

  async denyPayout(payoutId: string, reason: string): Promise<boolean> {
    try {
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
        console.error('Error denying payout:', {
          payoutId,
          error: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });

        // Fallback to direct database update if RPC doesn't exist
        if (error.message?.includes('function') && error.message?.includes('does not exist')) {
          return await this.denyPayoutFallback(payoutId, user.user.id, reason);
        }

        throw new Error('Failed to deny payout: ' + error.message);
      }

      return data;
    } catch (error) {
      console.error('Exception in denyPayout:', error);
      throw error;
    }
  }

  private async denyPayoutFallback(payoutId: string, reviewerId: string, reason: string): Promise<boolean> {
    const { error } = await supabase
      .from('seller_payouts')
      .update({
        status: 'denied',
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
        review_notes: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', payoutId);

    if (error) {
      console.error('Fallback deny error:', error);
      throw new Error('Failed to deny payout: ' + error.message);
    }

    return true;
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

  async checkTableExists(): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('seller_payouts')
        .select('id')
        .limit(1);

      if (error && (
        error.code === '42P01' ||
        error.message?.includes('does not exist') ||
        error.message?.includes('Failed to fetch')
      )) {
        console.warn('seller_payouts table does not exist or network error');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking table existence:', {
        errorType: error?.constructor?.name,
        errorMessage: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  async createTestPayouts(): Promise<void> {
    try {
      console.log('Creating test payout data...');

      const testPayouts = [
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          seller_id: '550e8400-e29b-41d4-a716-446655440000',
          amount: 150.00,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440002',
          seller_id: '550e8400-e29b-41d4-a716-446655440000',
          amount: 200.50,
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      const { error } = await supabase
        .from('seller_payouts')
        .insert(testPayouts);

      if (error) {
        console.error('Error creating test payouts:', error);
      } else {
        console.log('Test payouts created successfully');
      }
    } catch (error) {
      console.error('Exception creating test payouts:', error);
    }
  }
}

export const sellerPayoutService = new SellerPayoutService();

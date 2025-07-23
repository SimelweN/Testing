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
        throw new Error(`Failed to fetch payout statistics: ${error.message}`);
      }

      return data[0] || {
        pending_count: 0,
        approved_count: 0,
        denied_count: 0,
        total_approved_amount: 0
      };
    } catch (error) {
      console.error('Exception in getPayoutStatistics:', error);
      throw error;
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
        .select(`
          id,
          seller_id,
          amount,
          status,
          reviewed_by,
          reviewed_at,
          review_notes,
          bank_details_snapshot,
          paystack_transfer_code,
          paystack_recipient_code,
          created_at,
          updated_at,
          metadata
        `)
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
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('name, email')
            .eq('id', payout.seller_id)
            .single();

          if (error) {
            console.error('Error fetching seller profile:', error);
          }

          return {
            ...payout,
            seller_name: profile?.name || 'Unknown Seller',
            seller_email: profile?.email || 'unknown@email.com'
          } as PayoutDetails;
        } catch (error) {
          console.error('Exception fetching seller profile:', error);
          return {
            ...payout,
            seller_name: 'Unknown Seller',
            seller_email: 'unknown@email.com'
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

    if (!data) {
      return null;
    }

    // Get seller details separately from profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, email')
      .eq('id', data.seller_id)
      .single();

    // Get payout items
    const { data: payoutItems } = await supabase
      .from('payout_items')
      .select(`
        id,
        book_title,
        sale_amount,
        commission_amount,
        seller_amount,
        sale_date
      `)
      .eq('payout_id', payoutId);

    // Get reviewer details if available
    let reviewerName = null;
    if (data.reviewed_by) {
      const { data: reviewer } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', data.reviewed_by)
        .single();
      reviewerName = reviewer?.name;
    }

    return {
      ...data,
      seller_name: profile?.name || 'Unknown Seller',
      seller_email: profile?.email || 'unknown@email.com',
      reviewer_name: reviewerName,
      payout_items: payoutItems || []
    } as PayoutDetails;
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



        throw new Error('Failed to approve payout: ' + error.message);
      }

      return data;
    } catch (error) {
      console.error('Exception in approvePayout:', error);
      throw error;
    }
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



        throw new Error('Failed to deny payout: ' + error.message);
      }

      return data;
    } catch (error) {
      console.error('Exception in denyPayout:', error);
      throw error;
    }
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

  async createPaystackRecipient(sellerId: string): Promise<{
    success: boolean;
    recipient_code?: string;
    payment_breakdown?: any;
    seller_info?: any;
    message?: string;
    error?: string;
  }> {
    try {
      console.log('Creating Paystack recipient for seller:', sellerId);

      const { data, error } = await supabase.functions.invoke('create-paystack-subaccount', {
        method: 'POST',
        body: { sellerId }
      });

      if (error) {
        console.error('Error creating Paystack recipient:', error);
        throw new Error(`Failed to create recipient: ${error.message}`);
      }

      console.log('Paystack recipient created successfully:', data);
      return data;
    } catch (error) {
      console.error('Exception creating Paystack recipient:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error creating recipient'
      };
    }
  }

  async generatePayoutReceipt(payoutId: string): Promise<{
    success: boolean;
    receipt?: string;
    payment_breakdown?: any;
    error?: string;
  }> {
    try {
      // Get payout details
      const payoutDetails = await this.getPayoutDetails(payoutId);
      if (!payoutDetails) {
        throw new Error('Payout not found');
      }

      // Create Paystack recipient if needed
      const recipientResult = await this.createPaystackRecipient(payoutDetails.seller_id);

      if (!recipientResult.success) {
        throw new Error(recipientResult.error || 'Failed to create recipient');
      }

      // Generate receipt text
      const receiptText = this.formatReceiptText(payoutDetails, recipientResult);

      return {
        success: true,
        receipt: receiptText,
        payment_breakdown: recipientResult.payment_breakdown
      };
    } catch (error) {
      console.error('Error generating payout receipt:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error generating receipt'
      };
    }
  }

  private formatReceiptText(payoutDetails: PayoutDetails, recipientResult: any): string {
    const date = new Date().toLocaleString();
    const breakdown = recipientResult.payment_breakdown || {};
    const sellerInfo = recipientResult.seller_info || {};

    return `
SELLER PAYOUT RECEIPT - REBOOKED SOLUTIONS
==========================================

Receipt Generated: ${date}
Payout ID: ${payoutDetails.id}
Status: ${payoutDetails.status.toUpperCase()}

SELLER INFORMATION
------------------
Name: ${payoutDetails.seller_name || 'Unknown'}
Email: ${payoutDetails.seller_email || 'Unknown'}
Account: ${sellerInfo.account_number || 'N/A'}
Bank: ${sellerInfo.bank_name || 'N/A'}

PAYMENT BREAKDOWN
-----------------
Total Orders: ${breakdown.total_orders || 0}
Total Book Sales: ${this.formatCurrency(breakdown.total_book_sales || 0)}
Total Delivery Fees: ${this.formatCurrency(breakdown.total_delivery_fees || 0)}

Platform Commission (10%): ${this.formatCurrency(breakdown.platform_earnings?.book_commission || 0)}
Platform Delivery Fees: ${this.formatCurrency(breakdown.platform_earnings?.delivery_fees || 0)}
Total Platform Earnings: ${this.formatCurrency(breakdown.platform_earnings?.total || 0)}

SELLER PAYOUT AMOUNT: ${this.formatCurrency(breakdown.seller_amount || payoutDetails.amount)}

PAYSTACK DETAILS
----------------
Recipient Code: ${recipientResult.recipient_code || 'N/A'}
Development Mode: ${recipientResult.development_mode ? 'Yes' : 'No'}

ORDER DETAILS
-------------
${this.formatOrderDetails(breakdown.order_details || [])}

PAYOUT ITEMS
------------
${this.formatPayoutItems(payoutDetails.payout_items || [])}

REVIEW INFORMATION
------------------
${payoutDetails.status === 'approved' ? `Approved: ${payoutDetails.reviewed_at || 'Recently'}` : ''}
${payoutDetails.status === 'denied' ? `Denied: ${payoutDetails.reviewed_at || 'Recently'}` : ''}
${payoutDetails.review_notes ? `Notes: ${payoutDetails.review_notes}` : ''}
${payoutDetails.reviewer_name ? `Reviewed by: ${payoutDetails.reviewer_name}` : ''}

INSTRUCTIONS
------------
${recipientResult.instructions || 'Recipient created successfully. You can now manually process payment using this recipient code.'}

Generated by ReBooked Solutions Admin Dashboard
Time: ${date}
    `.trim();
  }

  private formatOrderDetails(orderDetails: any[]): string {
    if (!orderDetails || orderDetails.length === 0) {
      return 'No order details available';
    }

    return orderDetails.map((order, index) => `
${index + 1}. ${order.book?.title || 'Unknown Book'}
   Price: ${this.formatCurrency(order.book?.price || 0)}
   Buyer: ${order.buyer?.name || 'Unknown'} (${order.buyer?.email || 'N/A'})
   Delivered: ${order.timeline?.delivered || 'Recently'}
   Seller Earnings: ${this.formatCurrency(order.amounts?.seller_earnings || 0)}
`).join('\n');
  }

  private formatPayoutItems(items: PayoutItem[]): string {
    if (!items || items.length === 0) {
      return 'No payout items available';
    }

    return items.map((item, index) => `
${index + 1}. ${item.book_title}
   Sale Amount: ${this.formatCurrency(item.sale_amount)}
   Commission: ${this.formatCurrency(item.commission_amount)}
   Seller Amount: ${this.formatCurrency(item.seller_amount)}
   Sale Date: ${new Date(item.sale_date).toLocaleDateString()}
`).join('\n');
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

      if (error) {
        console.error('seller_payouts table check failed:', {
          code: error.code,
          message: error.message,
          details: error.details
        });
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


}

export const sellerPayoutService = new SellerPayoutService();

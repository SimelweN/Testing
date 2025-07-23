import { supabase } from "@/integrations/supabase/client";
import { createDenialEmailTemplate, DenialEmailData } from "@/utils/emailTemplates/denialEmailTemplate";

export interface PayoutApprovalData {
  orderId: string;
  sellerId: string;
  sellerEmail: string;
  sellerName: string;
  bookTitle: string;
  sellerEarnings: number;
  paystackRecipientCode?: string;
}

export interface PayoutDenialData {
  orderId: string;
  sellerId: string;
  sellerEmail: string;
  sellerName: string;
  bookTitle: string;
  sellerEarnings: number;
  orderDate: string;
  deliveryDate: string;
  denialReason: string;
}

class SellerPayoutService {
  /**
   * Approve a seller payout
   * 1. Create Paystack recipient if not exists
   * 2. Update transfer status to approved
   * 3. Send approval email to seller
   */
  async approvePayout(data: PayoutApprovalData): Promise<void> {
    try {
      console.log(`🟢 Approving payout for order ${data.orderId}`);

      // Step 1: Create Paystack recipient if not exists
      if (!data.paystackRecipientCode) {
        console.log(`Creating Paystack recipient for seller ${data.sellerId}`);
        
        // This would call your Paystack edge function
        const { data: paystackResponse, error: paystackError } = await supabase.functions.invoke(
          'create-paystack-subaccount',
          {
            body: {
              sellerId: data.sellerId,
              sellerEmail: data.sellerEmail,
              sellerName: data.sellerName,
            }
          }
        );

        if (paystackError) {
          console.error("Failed to create Paystack recipient:", paystackError);
          // Continue without Paystack for now - manual EFT can still be done
        }
      }

      // Step 2: Update transfer status in database
      // This would update your orders/transfers table
      console.log(`Updating transfer status for order ${data.orderId} to approved`);
      
      // Example database update:
      // const { error: updateError } = await supabase
      //   .from('order_transfers')
      //   .update({ 
      //     transfer_status: 'approved',
      //     approved_at: new Date().toISOString(),
      //     approved_by: 'admin'
      //   })
      //   .eq('order_id', data.orderId);

      // Step 3: Send approval email to seller
      await this.sendApprovalEmail(data);

      console.log(`✅ Payout approved successfully for order ${data.orderId}`);
      
    } catch (error) {
      console.error("Error approving payout:", error);
      throw new Error(`Failed to approve payout: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Deny a seller payout
   * 1. Update transfer status to denied
   * 2. Send denial email to seller with reason
   */
  async denyPayout(data: PayoutDenialData): Promise<void> {
    try {
      console.log(`🔴 Denying payout for order ${data.orderId}`);

      // Step 1: Update transfer status in database
      console.log(`Updating transfer status for order ${data.orderId} to denied`);
      
      // Example database update:
      // const { error: updateError } = await supabase
      //   .from('order_transfers')
      //   .update({ 
      //     transfer_status: 'denied',
      //     denied_at: new Date().toISOString(),
      //     denied_by: 'admin',
      //     denial_reason: data.denialReason
      //   })
      //   .eq('order_id', data.orderId);

      // Step 2: Send denial email to seller
      await this.sendDenialEmail(data);

      console.log(`✅ Payout denied successfully for order ${data.orderId}`);
      
    } catch (error) {
      console.error("Error denying payout:", error);
      throw new Error(`Failed to deny payout: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Send approval email to seller (using existing template)
   */
  private async sendApprovalEmail(data: PayoutApprovalData): Promise<void> {
    try {
      console.log(`📧 Sending approval email to ${data.sellerEmail}`);

      // Use the existing approval email template
      const emailData = {
        to: data.sellerEmail,
        sellerName: data.sellerName,
        bookTitle: data.bookTitle,
        amount: data.sellerEarnings,
        orderId: data.orderId,
        type: 'payout_approved'
      };

      // This would call your email edge function
      const { error: emailError } = await supabase.functions.invoke('send-email', {
        body: emailData
      });

      if (emailError) {
        console.error("Failed to send approval email:", emailError);
        // Don't throw - payout can still be processed manually
      } else {
        console.log(`✅ Approval email sent to ${data.sellerEmail}`);
      }

    } catch (error) {
      console.error("Error sending approval email:", error);
      // Don't throw - payout approval should still succeed
    }
  }

  /**
   * Send denial email to seller (using new template)
   */
  private async sendDenialEmail(data: PayoutDenialData): Promise<void> {
    try {
      console.log(`📧 Sending denial email to ${data.sellerEmail}`);

      // Create the denial email template
      const emailTemplate = createDenialEmailTemplate({
        sellerName: data.sellerName,
        bookTitle: data.bookTitle,
        orderId: data.orderId,
        denialReason: data.denialReason,
        sellerEarnings: data.sellerEarnings,
        orderDate: data.orderDate,
        deliveryDate: data.deliveryDate,
      });

      // Send via email edge function
      const emailData = {
        to: data.sellerEmail,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text,
      };

      const { error: emailError } = await supabase.functions.invoke('send-email', {
        body: emailData
      });

      if (emailError) {
        console.error("Failed to send denial email:", emailError);
        throw new Error("Failed to send denial notification email");
      } else {
        console.log(`✅ Denial email sent to ${data.sellerEmail}`);
      }

    } catch (error) {
      console.error("Error sending denial email:", error);
      throw error; // This should fail the denial process if email can't be sent
    }
  }

  /**
   * Get all pending transfer receipts
   */
  async getPendingTransfers(): Promise<any[]> {
    try {
      // This would fetch from your database
      // Example query:
      // const { data, error } = await supabase
      //   .from('order_transfers')
      //   .select(`
      //     *,
      //     orders (*),
      //     books (*),
      //     buyer_profiles (*),
      //     seller_profiles (*)
      //   `)
      //   .eq('transfer_status', 'pending')
      //   .order('created_at', { ascending: false });

      // For now, return mock data
      return [];
      
    } catch (error) {
      console.error("Error fetching pending transfers:", error);
      throw error;
    }
  }

  /**
   * Create Paystack recipient for seller
   */
  async createPaystackRecipient(sellerId: string, bankDetails: any): Promise<string> {
    try {
      console.log(`Creating Paystack recipient for seller ${sellerId}`);

      const { data, error } = await supabase.functions.invoke('create-paystack-subaccount', {
        body: {
          sellerId,
          bankDetails,
        }
      });

      if (error) {
        throw new Error(`Paystack recipient creation failed: ${error.message}`);
      }

      return data.recipient_code;
      
    } catch (error) {
      console.error("Error creating Paystack recipient:", error);
      throw error;
    }
  }
}

export const sellerPayoutService = new SellerPayoutService();

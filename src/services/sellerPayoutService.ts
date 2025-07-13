import { supabase } from "@/integrations/supabase/client";
import { addNotification } from "@/services/notificationService";
import { toast } from "sonner";

export interface PayoutInfo {
  saleId: string;
  sellerId: string;
  bookTitle: string;
  originalPrice: number;
  sellerPayout: number; // 90% of original price
  platformFee: number; // 10% platform commission
  status: "pending" | "processing" | "completed" | "failed";
  paymentMethod: "bank_transfer" | "ewallet" | "store_credit";
  deliveryConfirmed: boolean;
  createdAt: string;
  processedAt?: string;
}

export interface BankDetails {
  accountHolder: string;
  bankName: string;
  accountNumber: string;
  branchCode: string;
  accountType: "savings" | "cheque";
}

/**
 * Service for managing seller payouts with 90% commission structure
 */
export class SellerPayoutService {
  private static readonly PLATFORM_COMMISSION = 0.1; // 10% platform fee
  private static readonly SELLER_PERCENTAGE = 0.9; // 90% to seller

  /**
   * Calculate payout breakdown
   */
  static calculatePayout(originalPrice: number): {
    originalPrice: number;
    sellerPayout: number;
    platformFee: number;
    breakdown: string;
  } {
    const sellerPayout = Math.round(originalPrice * this.SELLER_PERCENTAGE);
    const platformFee = originalPrice - sellerPayout;

    return {
      originalPrice,
      sellerPayout,
      platformFee,
      breakdown: `R${originalPrice} = R${sellerPayout} (seller) + R${platformFee} (platform fee)`,
    };
  }

  /**
   * Create payout record after delivery confirmation
   */
  static async createPayout(
    saleId: string,
    sellerId: string,
    bookTitle: string,
    originalPrice: number,
  ): Promise<PayoutInfo> {
    try {
      const payout = this.calculatePayout(originalPrice);

      const payoutInfo: PayoutInfo = {
        saleId,
        sellerId,
        bookTitle,
        originalPrice,
        sellerPayout: payout.sellerPayout,
        platformFee: payout.platformFee,
        status: "pending",
        paymentMethod: "bank_transfer", // Default
        deliveryConfirmed: true,
        createdAt: new Date().toISOString(),
      };

      // Try to save to payouts table (graceful failure if table doesn't exist)
      try {
        const { data, error } = await supabase
          .from("seller_payouts")
          .insert([
            {
              sale_id: payoutInfo.saleId,
              seller_id: payoutInfo.sellerId,
              book_title: payoutInfo.bookTitle,
              original_price: payoutInfo.originalPrice,
              seller_payout: payoutInfo.sellerPayout,
              platform_fee: payoutInfo.platformFee,
              status: payoutInfo.status,
              payment_method: payoutInfo.paymentMethod,
              delivery_confirmed: payoutInfo.deliveryConfirmed,
              created_at: payoutInfo.createdAt,
            },
          ])
          .select()
          .single();

        if (error) {
          console.warn(
            "[SellerPayoutService] Could not save to payouts table:",
            error.message,
          );
        }
      } catch (dbError) {
        console.warn(
          "[SellerPayoutService] Payouts table not available, using notifications only",
        );
      }

      // Send notification to seller about payout
      await addNotification({
        userId: sellerId,
        title: "💰 Payout Ready - 90% Commission",
        message: `Your book "${bookTitle}" has been delivered! Payout of R${payoutInfo.sellerPayout} (90% of R${originalPrice}) is being processed. You'll receive payment within 2-3 business days.`,
        type: "success",
        read: false,
      });

      console.log("[SellerPayoutService] Payout created:", payoutInfo);
      return payoutInfo;
    } catch (error) {
      console.error("[SellerPayoutService] Error creating payout:", error);
      throw new Error("Failed to create seller payout");
    }
  }

  /**
   * Process payout (simulate bank transfer)
   */
  static async processPayout(
    payoutId: string,
    bankDetails: BankDetails,
  ): Promise<void> {
    try {
      console.log("[SellerPayoutService] Processing payout:", payoutId);

      // Simulate payout processing (in real app, this would integrate with payment gateway)
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Update payout status
      try {
        await supabase
          .from("seller_payouts")
          .update({
            status: "completed",
            processed_at: new Date().toISOString(),
            bank_details: bankDetails,
          })
          .eq("id", payoutId);
      } catch (dbError) {
        console.warn(
          "[SellerPayoutService] Could not update payout status in database",
        );
      }

      console.log("[SellerPayoutService] Payout processed successfully");
    } catch (error) {
      console.error("[SellerPayoutService] Error processing payout:", error);
      throw new Error("Failed to process payout");
    }
  }

  /**
   * Get seller's payout history
   */
  static async getSellerPayouts(sellerId: string): Promise<PayoutInfo[]> {
    try {
      const { data, error } = await supabase
        .from("seller_payouts")
        .select("*")
        .eq("seller_id", sellerId)
        .order("created_at", { ascending: false });

      if (error) {
        console.warn(
          "[SellerPayoutService] Could not fetch payouts:",
          error.message,
        );
        return [];
      }

      return (
        data?.map((payout) => ({
          saleId: payout.sale_id,
          sellerId: payout.seller_id,
          bookTitle: payout.book_title,
          originalPrice: payout.original_price,
          sellerPayout: payout.seller_payout,
          platformFee: payout.platform_fee,
          status: payout.status,
          paymentMethod: payout.payment_method,
          deliveryConfirmed: payout.delivery_confirmed,
          createdAt: payout.created_at,
          processedAt: payout.processed_at,
        })) || []
      );
    } catch (error) {
      console.error(
        "[SellerPayoutService] Error fetching seller payouts:",
        error,
      );
      return [];
    }
  }

  /**
   * Generate payout summary for display
   */
  static generatePayoutSummary(originalPrice: number): {
    summary: string;
    breakdown: string;
    timeline: string;
  } {
    const payout = this.calculatePayout(originalPrice);

    return {
      summary: `You'll receive R${payout.sellerPayout} from your R${originalPrice} sale`,
      breakdown: `
💰 Payout Breakdown:
• Book Price: R${originalPrice}
• Your Share (90%): R${payout.sellerPayout}
• Platform Fee (10%): R${payout.platformFee}
• Total Payout: R${payout.sellerPayout}
      `.trim(),
      timeline: `
📅 Payment Timeline:
1. ✅ Book sold and payment received
2. 🚚 Delivery arranged and confirmed
3. 💰 Payout processed (90% of sale price)
4. 🏦 Payment sent to your account (2-3 business days)

Your payout is processed only after delivery confirmation to ensure buyer satisfaction.
      `.trim(),
    };
  }

  /**
   * Simulate delivery confirmation (triggers payout)
   */
  static async confirmDelivery(
    saleId: string,
    sellerId: string,
    bookTitle: string,
    originalPrice: number,
  ): Promise<PayoutInfo> {
    try {
      console.log(
        "[SellerPayoutService] Confirming delivery for sale:",
        saleId,
      );

      // Create the payout
      const payoutInfo = await this.createPayout(
        saleId,
        sellerId,
        bookTitle,
        originalPrice,
      );

      // Send additional confirmation notification
      await addNotification({
        userId: sellerId,
        title: "📦 Delivery Confirmed",
        message: `Delivery confirmed for "${bookTitle}"! Your payout of R${payoutInfo.sellerPayout} is now being processed.`,
        type: "success",
        read: false,
      });

      return payoutInfo;
    } catch (error) {
      console.error("[SellerPayoutService] Error confirming delivery:", error);
      throw new Error("Failed to confirm delivery and process payout");
    }
  }
}

export default SellerPayoutService;

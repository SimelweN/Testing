import { supabase } from "@/integrations/supabase/client";

const PAYSTACK_SECRET_KEY = import.meta.env.VITE_PAYSTACK_SECRET_KEY;

export interface RefundRequest {
  orderId: string;
  transactionReference: string;
  amount: number;
  reason: string;
}

export interface RefundResult {
  success: boolean;
  refundId?: string;
  refundReference?: string;
  amount?: number;
  status?: "pending" | "processing" | "success" | "failed";
  expectedDate?: string;
  error?: string;
}

export class RefundService {
  /**
   * Process a full refund for an order
   */
  static async processRefund(
    orderId: string,
    transactionReference: string,
    amount: number,
    reason: string,
  ): Promise<RefundResult> {
    try {
      console.log(`💸 Processing refund for order ${orderId}: R${amount}`);

      // Get the original transaction from our database
      const { data: transaction, error: transactionError } = await supabase
        .from("payment_transactions")
        .select("*")
        .eq("reference", transactionReference)
        .single();

      if (transactionError || !transaction) {
        throw new Error("Original transaction not found");
      }

      // Check if refund already exists
      const { data: existingRefund } = await supabase
        .from("refund_transactions")
        .select("*")
        .eq("order_id", orderId)
        .single();

      if (existingRefund && existingRefund.status === "success") {
        return {
          success: true,
          refundId: existingRefund.id,
          refundReference: existingRefund.refund_reference,
          amount: existingRefund.amount,
          status: "success",
          expectedDate: existingRefund.completed_at,
        };
      }

      // Create refund with Paystack
      const refundResult = await this.createPaystackRefund(
        transactionReference,
        amount,
        reason,
      );

      if (!refundResult.success) {
        throw new Error(refundResult.error || "Paystack refund failed");
      }

      // Store refund in database
      const refundData = {
        id: `refund_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        order_id: orderId,
        transaction_reference: transactionReference,
        refund_reference: refundResult.refundReference,
        amount: amount,
        reason: reason,
        status: refundResult.status || "pending",
        paystack_response: refundResult.paystackData,
        created_at: new Date().toISOString(),
      };

      const { error: insertError } = await supabase
        .from("refund_transactions")
        .insert(refundData);

      if (insertError) {
        console.error("Failed to store refund in database:", insertError);
        // Continue anyway since Paystack refund was successful
      }

      // Update order status
      await supabase
        .from("orders")
        .update({
          status: "refunded",
          refund_status: refundResult.status,
          refund_reference: refundResult.refundReference,
          refunded_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      console.log(`✅ Refund processed successfully for order ${orderId}`);

      return {
        success: true,
        refundId: refundData.id,
        refundReference: refundResult.refundReference,
        amount: amount,
        status: refundResult.status,
        expectedDate: refundResult.expectedDate,
      };
    } catch (error) {
      console.error("Refund processing failed:", error);

      // Store failed refund attempt
      try {
        await supabase.from("refund_transactions").insert({
          id: `refund_fail_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          order_id: orderId,
          transaction_reference: transactionReference,
          amount: amount,
          reason: reason,
          status: "failed",
          error_message:
            error instanceof Error ? error.message : "Unknown error",
          created_at: new Date().toISOString(),
        });
      } catch (dbError) {
        console.error("Failed to store failed refund:", dbError);
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown refund error",
      };
    }
  }

  /**
   * Create refund through Paystack API
   */
  private static async createPaystackRefund(
    transactionReference: string,
    amount: number,
    reason: string,
  ): Promise<{
    success: boolean;
    refundReference?: string;
    status?: string;
    expectedDate?: string;
    paystackData?: any;
    error?: string;
  }> {
    try {
      if (!PAYSTACK_SECRET_KEY) {
        throw new Error("Paystack secret key not configured");
      }

      const refundData = {
        transaction: transactionReference,
        amount: Math.round(amount * 100), // Convert to kobo
        currency: "ZAR",
        customer_note: reason,
        merchant_note: `Refund processed for transaction ${transactionReference}`,
      };

      const response = await fetch("https://api.paystack.co/refund", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(refundData),
      });

      const result = await response.json();

      if (!result.status) {
        throw new Error(result.message || "Paystack refund request failed");
      }

      // Calculate expected refund date (usually 3-5 business days)
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() + 5);

      return {
        success: true,
        refundReference: result.data.id,
        status: result.data.status || "pending",
        expectedDate: expectedDate.toISOString(),
        paystackData: result.data,
      };
    } catch (error) {
      console.error("Paystack refund API error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Paystack API error",
      };
    }
  }

  /**
   * Check refund status from Paystack
   */
  static async checkRefundStatus(refundId: string): Promise<{
    success: boolean;
    status?: string;
    amount?: number;
    processedAt?: string;
    error?: string;
  }> {
    try {
      if (!PAYSTACK_SECRET_KEY) {
        throw new Error("Paystack secret key not configured");
      }

      const response = await fetch(
        `https://api.paystack.co/refund/${refundId}`,
        {
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          },
        },
      );

      const result = await response.json();

      if (!result.status) {
        throw new Error(result.message || "Failed to fetch refund status");
      }

      return {
        success: true,
        status: result.data.status,
        amount: result.data.amount / 100, // Convert from kobo
        processedAt: result.data.created_at,
      };
    } catch (error) {
      console.error("Failed to check refund status:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Status check failed",
      };
    }
  }

  /**
   * Get all refunds for a user
   */
  static async getUserRefunds(userId: string): Promise<{
    success: boolean;
    refunds?: any[];
    error?: string;
  }> {
    try {
      const { data: refunds, error } = await supabase
        .from("refund_transactions")
        .select(
          `
          *,
          order:orders(
            id,
            total_amount,
            buyer_id,
            seller_id,
            created_at
          )
        `,
        )
        .eq("order.buyer_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        refunds: refunds || [],
      };
    } catch (error) {
      console.error("Failed to fetch user refunds:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch refunds",
      };
    }
  }
}

import { supabase } from "@/lib/supabase";
import { PAYSTACK_CONFIG, calculatePaymentSplit } from "@/config/paystack";
import type {
  Order,
  PaymentInitialization,
  PaymentVerificationResponse,
  OrderMetadata,
  ShippingAddress,
} from "@/types/banking";

export class PaymentService {
  /**
   * Create order record in database
   */
  static async createOrder(orderData: {
    buyer_email: string;
    seller_id: string;
    amount: number; // in cents
    paystack_ref: string;
    shipping_address: ShippingAddress;
    metadata: OrderMetadata;
  }): Promise<{ success: boolean; order?: Order; error?: string }> {
    try {
      const { data, error } = await supabase
        .from("orders")
        .insert({
          buyer_email: orderData.buyer_email,
          seller_id: orderData.seller_id,
          amount: orderData.amount,
          paystack_ref: orderData.paystack_ref,
          status: "pending",
          payment_held: false,
          shipping_address: orderData.shipping_address,
          metadata: orderData.metadata,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating order:", error);
        return { success: false, error: "Failed to create order" };
      }

      return { success: true, order: data };
    } catch (error) {
      console.error("Order creation error:", error);
      return { success: false, error: "An unexpected error occurred" };
    }
  }

  /**
   * Initialize payment with Paystack
   */
  static async initializePayment(paymentData: {
    email: string;
    amount: number; // in cents (will be converted to kobo)
    bookIds: string[];
    sellerId: string;
    shipping_address: ShippingAddress;
    delivery_method: "pickup" | "delivery";
    delivery_fee?: number;
  }): Promise<{
    success: boolean;
    authorization_url?: string;
    reference?: string;
    error?: string;
  }> {
    try {
      // Get books and seller details
      const { data: books, error: booksError } = await supabase
        .from("books")
        .select(
          `
          *,
          profiles!books_seller_id_fkey(subaccount_code, full_name)
        `,
        )
        .in("id", paymentData.bookIds);

      if (booksError || !books?.length) {
        return { success: false, error: "Books not found" };
      }

      // Ensure all books belong to the same seller
      const uniqueSellers = [...new Set(books.map((book) => book.seller_id))];
      if (uniqueSellers.length > 1) {
        return {
          success: false,
          error:
            "Cannot purchase books from multiple sellers in one transaction",
        };
      }

      if (uniqueSellers[0] !== paymentData.sellerId) {
        return { success: false, error: "Seller mismatch" };
      }

      // Calculate total amount
      const booksTotal = books.reduce((sum, book) => sum + book.price, 0);
      const deliveryFee = paymentData.delivery_fee || 0;
      const totalAmount = booksTotal + deliveryFee;

      // Ensure amount matches
      if (paymentData.amount !== totalAmount) {
        return { success: false, error: "Amount mismatch" };
      }

      // Generate reference
      const reference = `RS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create order metadata
      const metadata: OrderMetadata = {
        books: books.map((book) => ({
          id: book.id,
          title: book.title,
          price: book.price,
          quantity: 1,
        })),
        delivery_fee: deliveryFee,
        delivery_method: paymentData.delivery_method,
        special_instructions: "",
      };

      // Create order record
      const orderResult = await this.createOrder({
        buyer_email: paymentData.email,
        seller_id: paymentData.sellerId,
        amount: totalAmount,
        paystack_ref: reference,
        shipping_address: paymentData.shipping_address,
        metadata,
      });

      if (!orderResult.success) {
        return { success: false, error: orderResult.error };
      }

      // Get subaccount code
      const subaccountCode = books[0].profiles?.subaccount_code;

      if (!subaccountCode && PAYSTACK_CONFIG.isConfigured()) {
        return {
          success: false,
          error: "Seller payment account not configured",
        };
      }

      // Calculate payment split
      const split = calculatePaymentSplit(booksTotal, deliveryFee);

      // Initialize payment via Edge Function
      const { data, error } = await supabase.functions.invoke(
        "initialize-paystack-payment",
        {
          body: {
            email: paymentData.email,
            amount: split.totalAmountKobo, // total amount in kobo (books + delivery)
            reference,
            subaccount: subaccountCode,
            transaction_charge: split.platformAmountKobo, // 10% of book price to platform
            bearer: "subaccount",
            metadata: {
              order_id: orderResult.order!.id,
              seller_id: paymentData.sellerId,
              subaccount_code: subaccountCode,
              books: metadata.books,
              payment_split: {
                seller_amount: split.sellerAmountKobo, // 90% of book price
                platform_amount: split.platformAmountKobo, // 10% of book price
                delivery_amount: split.deliveryAmountKobo, // 100% of delivery fee
                total_amount: split.totalAmountKobo,
              },
              delivery_fee: deliveryFee,
              book_total: booksTotal,
            },
          },
        },
      );

      if (error) {
        console.error("Payment initialization error:", error);
        return { success: false, error: "Failed to initialize payment" };
      }

      return {
        success: true,
        authorization_url: data.authorization_url,
        reference,
      };
    } catch (error) {
      console.error("Payment service error:", error);
      return { success: false, error: "An unexpected error occurred" };
    }
  }

  /**
   * Verify payment with Paystack
   */
  static async verifyPayment(reference: string): Promise<{
    success: boolean;
    verification?: PaymentVerificationResponse;
    error?: string;
  }> {
    try {
      if (!PAYSTACK_CONFIG.isConfigured() && PAYSTACK_CONFIG.isDevelopment()) {
        // Development fallback
        return this.developmentPaymentVerification(reference);
      }

      const { data, error } = await supabase.functions.invoke(
        "verify-paystack-payment",
        {
          body: { reference },
        },
      );

      if (error) {
        console.error("Payment verification error:", error);
        return { success: false, error: "Failed to verify payment" };
      }

      // Update order status if payment successful
      if (data.status === "success") {
        await this.updateOrderStatus(reference, "paid", data);
      }

      return { success: true, verification: data };
    } catch (error) {
      console.error("Payment verification error:", error);
      return { success: false, error: "Payment verification failed" };
    }
  }

  /**
   * Update order status
   */
  static async updateOrderStatus(
    reference: string,
    status: "pending" | "paid" | "collected" | "payout_completed" | "cancelled",
    paymentData?: any,
  ): Promise<void> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (status === "paid") {
        // Activate escrow - hold payment for 48 hours
        const collectionDeadline = new Date(Date.now() + 48 * 60 * 60 * 1000);
        updateData.payment_held = true;
        updateData.collection_deadline = collectionDeadline.toISOString();

        if (paymentData) {
          updateData.payment_verification = paymentData;
        }
      } else if (status === "collected") {
        // Release escrow when collection confirmed
        updateData.payment_held = false;
        updateData.collection_confirmed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("orders")
        .update(updateData)
        .eq("paystack_ref", reference);

      if (error) {
        console.error("Error updating order status:", error);
        throw error;
      }

      // Trigger payout if order collected
      if (status === "collected") {
        await this.initiateSellerPayout(reference);
      }
    } catch (error) {
      console.error("Update order status error:", error);
      throw error;
    }
  }

  /**
   * Initiate seller payout
   */
  static async initiateSellerPayout(reference: string): Promise<void> {
    try {
      const { data: order, error } = await supabase
        .from("orders")
        .select("*")
        .eq("paystack_ref", reference)
        .eq("status", "collected")
        .single();

      if (error || !order) {
        console.error("Order not found for payout:", error);
        return;
      }

      // Calculate payout amounts
      const split = calculatePaymentSplit(order.amount);

      // Initiate payout via Edge Function
      const { error: payoutError } = await supabase.functions.invoke(
        "initiate-seller-payout",
        {
          body: {
            order_id: order.id,
            seller_id: order.seller_id,
            amount: split.sellerAmount,
            platform_fee: split.platformAmount,
            reference: `PAYOUT_${order.id}_${Date.now()}`,
          },
        },
      );

      if (payoutError) {
        console.error("Payout initiation error:", payoutError);
      }
    } catch (error) {
      console.error("Seller payout error:", error);
    }
  }

  /**
   * Get order by reference
   */
  static async getOrderByReference(reference: string): Promise<Order | null> {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("paystack_ref", reference)
        .single();

      if (error) {
        console.error("Error fetching order:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Get order error:", error);
      return null;
    }
  }

  /**
   * Development fallback for payment verification
   */
  private static async developmentPaymentVerification(
    reference: string,
  ): Promise<{
    success: boolean;
    verification?: PaymentVerificationResponse;
    error?: string;
  }> {
    console.warn("🛠️ Using development fallback for payment verification");

    try {
      // Get order details
      const order = await this.getOrderByReference(reference);

      if (!order) {
        return { success: false, error: "Order not found" };
      }

      const mockVerification: PaymentVerificationResponse = {
        status: "success",
        reference,
        amount: order.amount * 100, // Convert to kobo for consistency
        gateway_response: "Successful (development fallback)",
        paid_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        channel: "card",
        currency: "ZAR",
        metadata: {
          order_id: order.id,
          seller_id: order.seller_id,
        },
        customer: {
          email: order.buyer_email,
        },
      };

      // Update order status
      await this.updateOrderStatus(reference, "paid", mockVerification);

      return { success: true, verification: mockVerification };
    } catch (error) {
      console.error("Development verification error:", error);
      return { success: false, error: "Development verification failed" };
    }
  }

  /**
   * Cancel order
   */
  static async cancelOrder(
    reference: string,
    reason?: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from("orders")
        .update({
          status: "cancelled",
          cancellation_reason: reason,
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("paystack_ref", reference);

      if (error) {
        console.error("Error cancelling order:", error);
        return { success: false, error: "Failed to cancel order" };
      }

      return { success: true };
    } catch (error) {
      console.error("Cancel order error:", error);
      return { success: false, error: "An unexpected error occurred" };
    }
  }
}

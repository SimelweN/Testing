import { supabase } from "@/integrations/supabase/client";

export interface PaymentValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  details?: any;
}

export interface PaymentTransaction {
  id: string;
  reference: string;
  amount: number;
  status: string;
  order_id?: string;
  user_id?: string;
  customer_email?: string;
  created_at: string;
}

export class PaymentValidator {
  /**
   * Validate a payment transaction
   */
  static async validatePayment(
    paymentReference: string,
  ): Promise<PaymentValidationResult> {
    const result: PaymentValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    try {
      // Check if payment exists
      const { data: payment, error } = await supabase
        .from("payment_transactions")
        .select("*")
        .eq("reference", paymentReference)
        .single();

      if (error || !payment) {
        result.isValid = false;
        result.errors.push(
          `Payment with reference ${paymentReference} not found`,
        );
        return result;
      }

      result.details = payment;

      // Validate payment status
      if (payment.status !== "success") {
        result.warnings.push(
          `Payment status is '${payment.status}', expected 'success'`,
        );
      }

      // Validate amount
      if (!payment.amount || payment.amount <= 0) {
        result.errors.push("Payment amount is invalid or zero");
        result.isValid = false;
      }

      // Check for corresponding order
      if (payment.order_id) {
        const { data: order, error: orderError } = await supabase
          .from("orders")
          .select("*")
          .eq("id", payment.order_id)
          .single();

        if (orderError || !order) {
          result.warnings.push(
            `No corresponding order found for payment ${paymentReference}`,
          );
        } else {
          // Validate order-payment consistency
          if (order.paystack_ref !== payment.reference) {
            result.errors.push("Order and payment reference mismatch");
            result.isValid = false;
          }

          if (Math.abs(order.amount - payment.amount) > 1) {
            // Allow 1 kobo difference
            result.warnings.push(
              `Order amount (${order.amount}) doesn't match payment amount (${payment.amount})`,
            );
          }
        }
      }

      // Validate customer information
      if (!payment.customer_email) {
        result.warnings.push("Payment missing customer email");
      }

      // Check payment age
      const paymentDate = new Date(payment.created_at);
      const daysSincePayment =
        (Date.now() - paymentDate.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSincePayment > 90) {
        result.warnings.push(
          `Payment is ${Math.floor(daysSincePayment)} days old`,
        );
      }
    } catch (error) {
      result.isValid = false;
      result.errors.push(
        `Validation error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }

    return result;
  }

  /**
   * Validate a refund request
   */
  static async validateRefund(
    orderId: string,
  ): Promise<PaymentValidationResult> {
    const result: PaymentValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    try {
      // Check if order exists
      const { data: order, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (error || !order) {
        result.isValid = false;
        result.errors.push(`Order ${orderId} not found`);
        return result;
      }

      result.details = order;

      // Check order status for refund eligibility
      const refundableStatuses = ["pending_commit", "declined", "cancelled"];
      if (!refundableStatuses.includes(order.status)) {
        result.errors.push(
          `Order status '${order.status}' is not eligible for refund`,
        );
        result.isValid = false;
      }

      // Check if payment exists
      const { data: payment, error: paymentError } = await supabase
        .from("payment_transactions")
        .select("*")
        .eq("reference", order.paystack_ref)
        .single();

      if (paymentError || !payment) {
        result.errors.push(`No payment found for order ${orderId}`);
        result.isValid = false;
      } else if (payment.status !== "success") {
        result.errors.push(
          `Original payment status is '${payment.status}', cannot refund`,
        );
        result.isValid = false;
      }

      // Check for existing refunds
      const { data: existingRefunds, error: refundError } = await supabase
        .from("refund_transactions")
        .select("*")
        .eq("order_id", orderId);

      if (!refundError && existingRefunds && existingRefunds.length > 0) {
        const totalRefunded = existingRefunds.reduce(
          (sum, refund) => sum + refund.amount,
          0,
        );
        if (totalRefunded >= order.amount) {
          result.errors.push("Order has already been fully refunded");
          result.isValid = false;
        } else {
          result.warnings.push(
            `Partial refund exists: R${totalRefunded / 100} already refunded`,
          );
        }
      }

      // Check order age
      const orderDate = new Date(order.created_at);
      const daysSinceOrder =
        (Date.now() - orderDate.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSinceOrder > 30) {
        result.warnings.push(
          `Order is ${Math.floor(daysSinceOrder)} days old - may require manual approval`,
        );
      }
    } catch (error) {
      result.isValid = false;
      result.errors.push(
        `Validation error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }

    return result;
  }

  /**
   * Validate seller payout eligibility
   */
  static async validateSellerPayout(
    orderId: string,
  ): Promise<PaymentValidationResult> {
    const result: PaymentValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    try {
      // Check if order exists and is completed
      const { data: order, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (error || !order) {
        result.isValid = false;
        result.errors.push(`Order ${orderId} not found`);
        return result;
      }

      result.details = order;

      // Check order status for payout eligibility
      const payoutEligibleStatuses = ["delivered", "completed"];
      if (!payoutEligibleStatuses.includes(order.status)) {
        result.errors.push(
          `Order status '${order.status}' is not eligible for payout`,
        );
        result.isValid = false;
      }

      // Check if seller has banking details
      const { data: seller, error: sellerError } = await supabase
        .from("profiles")
        .select("subaccount_code, bank_details")
        .eq("id", order.seller_id)
        .single();

      if (sellerError || !seller) {
        result.errors.push("Seller profile not found");
        result.isValid = false;
      } else {
        if (!seller.subaccount_code) {
          result.errors.push("Seller has no Paystack subaccount configured");
          result.isValid = false;
        }

        if (!seller.bank_details) {
          result.warnings.push("Seller banking details may be incomplete");
        }
      }

      // Check for existing payouts
      const { data: existingPayouts, error: payoutError } = await supabase
        .from("seller_payouts")
        .select("*")
        .eq("order_id", orderId);

      if (!payoutError && existingPayouts && existingPayouts.length > 0) {
        result.warnings.push("Seller has already been paid for this order");
      }
    } catch (error) {
      result.isValid = false;
      result.errors.push(
        `Validation error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }

    return result;
  }

  /**
   * Validate payment amount format
   */
  static validateAmount(
    amount: number,
    currency: string = "ZAR",
  ): PaymentValidationResult {
    const result: PaymentValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    if (typeof amount !== "number" || isNaN(amount)) {
      result.isValid = false;
      result.errors.push("Amount must be a valid number");
      return result;
    }

    if (amount <= 0) {
      result.isValid = false;
      result.errors.push("Amount must be greater than zero");
    }

    if (amount > 100000000) {
      // R1,000,000 in kobo
      result.warnings.push("Amount is unusually large - please verify");
    }

    if (amount < 100) {
      // R1.00 in kobo
      result.warnings.push("Amount is very small - please verify");
    }

    // Check if amount has proper kobo format (should be integer)
    if (amount % 1 !== 0) {
      result.warnings.push("Amount should be in kobo (integer) format");
    }

    return result;
  }

  /**
   * Validate email format
   */
  static validateEmail(email: string): PaymentValidationResult {
    const result: PaymentValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      result.isValid = false;
      result.errors.push("Email is required");
    } else if (!emailRegex.test(email)) {
      result.isValid = false;
      result.errors.push("Invalid email format");
    }

    return result;
  }
}

export default PaymentValidator;

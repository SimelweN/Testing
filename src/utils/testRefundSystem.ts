import { supabase } from "@/integrations/supabase/client";

/**
 * Test utility for refund system functionality
 */
export class RefundSystemTester {
  /**
   * Test the refund system end-to-end
   */
  static async testRefundSystem(): Promise<void> {
    console.log("🧪 Starting Refund System Tests...\n");

    // 1. Test database structure
    console.log("1️⃣ Testing Database Structure...");
    await this.testDatabaseStructure();

    console.log("\n" + "=".repeat(50) + "\n");

    // 2. Test automatic refunds
    console.log("2️⃣ Testing Automatic Refund Scenarios...");
    await this.testAutomaticRefunds();

    console.log("\n" + "=".repeat(50) + "\n");

    // 3. Test manual refunds
    console.log("3️⃣ Testing Manual Refund Processing...");
    await this.testManualRefunds();

    console.log("\n🏁 Refund System Tests Complete!");
  }

  /**
   * Test if all required database tables exist
   */
  private static async testDatabaseStructure(): Promise<void> {
    try {
      // Test refund_transactions table
      const { data: refundData, error: refundError } = await supabase
        .from("refund_transactions")
        .select("count")
        .limit(1);

      if (refundError) {
        console.log("❌ refund_transactions table:", refundError.message);
      } else {
        console.log("✅ refund_transactions table: Accessible");
      }

      // Test orders table refund columns
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("refund_status, refund_reference, refunded_at")
        .limit(1);

      if (ordersError) {
        console.log("❌ orders table refund columns:", ordersError.message);
      } else {
        console.log("✅ orders table refund columns: Available");
      }

      // Test payment_transactions table
      const { data: paymentData, error: paymentError } = await supabase
        .from("payment_transactions")
        .select("count")
        .limit(1);

      if (paymentError) {
        console.log("❌ payment_transactions table:", paymentError.message);
      } else {
        console.log("✅ payment_transactions table: Accessible");
      }
    } catch (error) {
      console.error("❌ Database structure test failed:", error);
    }
  }

  /**
   * Test automatic refund scenarios
   */
  private static async testAutomaticRefunds(): Promise<void> {
    try {
      console.log(
        "🔍 Checking for orders that should trigger automatic refunds...",
      );

      // Check for orders in states that should trigger refunds
      const { data: pendingOrders, error: pendingError } = await supabase
        .from("orders")
        .select(
          `
          id, 
          status, 
          created_at, 
          expires_at,
          payment_reference,
          total_amount,
          refund_status
        `,
        )
        .eq("status", "pending_commit")
        .lt("expires_at", new Date().toISOString())
        .is("refund_status", null)
        .limit(5);

      if (pendingError) {
        console.log("❌ Failed to fetch expired orders:", pendingError.message);
        return;
      }

      if (pendingOrders && pendingOrders.length > 0) {
        console.log(
          `⚠️ Found ${pendingOrders.length} expired orders that may need automatic refunds:`,
        );
        pendingOrders.forEach((order) => {
          console.log(
            `   - Order ${order.id}: ${order.status} (expired: ${order.expires_at})`,
          );
        });
        console.log(
          "   💡 These should be processed by auto-expire-commits function",
        );
      } else {
        console.log("✅ No expired orders requiring automatic refunds found");
      }

      // Check for declined orders without refunds
      const { data: declinedOrders, error: declinedError } = await supabase
        .from("orders")
        .select("id, status, payment_reference, refund_status")
        .eq("status", "declined")
        .is("refund_status", null)
        .limit(5);

      if (declinedError) {
        console.log(
          "❌ Failed to fetch declined orders:",
          declinedError.message,
        );
      } else if (declinedOrders && declinedOrders.length > 0) {
        console.log(
          `⚠️ Found ${declinedOrders.length} declined orders without refunds processed`,
        );
      } else {
        console.log("✅ All declined orders have refunds processed");
      }
    } catch (error) {
      console.error("❌ Automatic refunds test failed:", error);
    }
  }

  /**
   * Test manual refund processing
   */
  private static async testManualRefunds(): Promise<void> {
    try {
      console.log("🔍 Checking manual refund capabilities...");

      // Test if process-refund API endpoint is accessible
      try {
        const response = await fetch("/api/process-refund", {
          method: "OPTIONS",
        });
        if (response.ok || response.status === 405) {
          console.log("✅ Manual refund API endpoint: Accessible");
        } else {
          console.log("❌ Manual refund API endpoint: Not accessible");
        }
      } catch (error) {
        console.log("❌ Manual refund API endpoint: Connection failed");
      }

      // Check recent refund transactions
      const { data: recentRefunds, error: refundsError } = await supabase
        .from("refund_transactions")
        .select(
          `
          id,
          status,
          amount,
          reason,
          created_at,
          order:orders(id, status)
        `,
        )
        .order("created_at", { ascending: false })
        .limit(3);

      if (refundsError) {
        console.log("❌ Failed to fetch recent refunds:", refundsError.message);
      } else if (recentRefunds && recentRefunds.length > 0) {
        console.log(
          `✅ Found ${recentRefunds.length} recent refund transactions:`,
        );
        recentRefunds.forEach((refund) => {
          console.log(
            `   - Refund ${refund.id}: R${refund.amount} (${refund.status}) - ${refund.reason}`,
          );
        });
      } else {
        console.log("ℹ️ No recent refund transactions found");
      }
    } catch (error) {
      console.error("❌ Manual refunds test failed:", error);
    }
  }

  /**
   * Test refund for a specific order (dry run)
   */
  static async testOrderRefund(orderId: string): Promise<void> {
    console.log(`🧪 Testing refund for order ${orderId}...\n`);

    try {
      // Get order details
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select(
          `
          id,
          status,
          total_amount,
          payment_reference,
          refund_status,
          buyer_id,
          seller_id
        `,
        )
        .eq("id", orderId)
        .single();

      if (orderError || !order) {
        console.log("❌ Order not found or inaccessible");
        return;
      }

      console.log("📋 Order Details:");
      console.log(`   - ID: ${order.id}`);
      console.log(`   - Status: ${order.status}`);
      console.log(`   - Amount: R${order.total_amount}`);
      console.log(
        `   - Payment Reference: ${order.payment_reference || "N/A"}`,
      );
      console.log(`   - Refund Status: ${order.refund_status || "None"}`);

      // Check if refund is eligible
      const isEligible = this.checkRefundEligibility(order);
      console.log(
        `\n💰 Refund Eligibility: ${isEligible.eligible ? "✅ Eligible" : "❌ Not Eligible"}`,
      );
      if (!isEligible.eligible) {
        console.log(`   Reason: ${isEligible.reason}`);
      }

      // Check if refund already exists
      const { data: existingRefund, error: refundError } = await supabase
        .from("refund_transactions")
        .select("*")
        .eq("order_id", orderId)
        .single();

      if (existingRefund) {
        console.log("\n🔄 Existing Refund Found:");
        console.log(`   - Refund ID: ${existingRefund.id}`);
        console.log(`   - Status: ${existingRefund.status}`);
        console.log(`   - Amount: R${existingRefund.amount}`);
        console.log(
          `   - Reference: ${existingRefund.refund_reference || "N/A"}`,
        );
      } else {
        console.log("\n🆕 No existing refund found");
      }
    } catch (error) {
      console.error("❌ Order refund test failed:", error);
    }
  }

  /**
   * Check if an order is eligible for refund
   */
  private static checkRefundEligibility(order: any): {
    eligible: boolean;
    reason?: string;
  } {
    // Already refunded
    if (
      order.refund_status === "completed" ||
      order.refund_status === "success"
    ) {
      return { eligible: false, reason: "Order already refunded" };
    }

    // No payment reference
    if (!order.payment_reference) {
      return { eligible: false, reason: "No payment reference found" };
    }

    // Check status eligibility
    const refundableStatuses = [
      "pending_commit",
      "declined",
      "cancelled",
      "expired",
      "pickup_failed",
    ];

    if (!refundableStatuses.includes(order.status)) {
      return {
        eligible: false,
        reason: `Status '${order.status}' not eligible for refund`,
      };
    }

    return { eligible: true };
  }

  /**
   * Show summary of refund system health
   */
  static async showRefundSystemHealth(): Promise<void> {
    console.log("🏥 Refund System Health Check\n");

    try {
      // Count orders by status
      const { data: orderStats, error: statsError } = await supabase
        .from("orders")
        .select("status")
        .neq("status", "completed");

      if (statsError) {
        console.log("❌ Failed to get order statistics");
        return;
      }

      const statusCounts =
        orderStats?.reduce((acc: any, order: any) => {
          acc[order.status] = (acc[order.status] || 0) + 1;
          return acc;
        }, {}) || {};

      console.log("📊 Orders by Status:");
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`   - ${status}: ${count}`);
      });

      // Count refunds by status
      const { data: refundStats, error: refundStatsError } = await supabase
        .from("refund_transactions")
        .select("status");

      if (refundStatsError) {
        console.log("\n❌ Failed to get refund statistics");
      } else {
        const refundCounts =
          refundStats?.reduce((acc: any, refund: any) => {
            acc[refund.status] = (acc[refund.status] || 0) + 1;
            return acc;
          }, {}) || {};

        console.log("\n💰 Refunds by Status:");
        if (Object.keys(refundCounts).length === 0) {
          console.log("   - No refunds found");
        } else {
          Object.entries(refundCounts).forEach(([status, count]) => {
            console.log(`   - ${status}: ${count}`);
          });
        }
      }
    } catch (error) {
      console.error("❌ Health check failed:", error);
    }
  }
}

// Export for console access
if (typeof window !== "undefined") {
  (window as any).RefundSystemTester = RefundSystemTester;
  console.log("💡 Refund testing tools available:");
  console.log(
    "   RefundSystemTester.testRefundSystem() - Full refund system test",
  );
  console.log(
    "   RefundSystemTester.testOrderRefund('ORDER_ID') - Test specific order refund",
  );
  console.log(
    "   RefundSystemTester.showRefundSystemHealth() - System health overview",
  );
}

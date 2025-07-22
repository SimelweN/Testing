import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface RefundRequest {
  transaction: string;
  amount?: number;
  currency?: string;
  customer_note?: string;
  merchant_note?: string;
}

interface RefundScenario {
  type:
    | "full"
    | "partial"
    | "dispute"
    | "cancellation"
    | "return"
    | "damage"
    | "seller_fault";
  reason: string;
  amount?: number;
  customer_note?: string;
  merchant_note?: string;
  order_id?: string;
  user_id?: string;
  seller_id?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Handle health check first
    const url = new URL(req.url);
    const isHealthCheck =
      url.pathname.endsWith("/health") ||
      url.searchParams.get("health") === "true";

        // For health checks, check URL params only (no body consumption)
    if (isHealthCheck) {
      return new Response(
        JSON.stringify({
          success: true,
          service: "paystack-refund-management",
          status: "healthy",
          timestamp: new Date().toISOString(),
          environment: {
            paystack_configured: !!PAYSTACK_SECRET_KEY,
            supabase_configured: !!(SUPABASE_URL && SUPABASE_SERVICE_KEY),
          },
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Validate request method for non-health endpoints
    if (!["POST", "GET", "PUT"].includes(req.method)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "METHOD_NOT_ALLOWED",
          details: {
            provided_method: req.method,
            allowed_methods: ["POST", "GET", "PUT"],
            message:
              "Refund management endpoint accepts POST, GET, PUT requests",
          },
          fix_instructions:
            "Use POST to create refunds, GET to retrieve, PUT to update",
        }),
        {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Check environment configuration
    if (!PAYSTACK_SECRET_KEY) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "PAYSTACK_NOT_CONFIGURED",
          details: {
            missing_env_vars: ["PAYSTACK_SECRET_KEY"],
            message: "Paystack integration is not configured",
          },
          fix_instructions:
            "Configure PAYSTACK_SECRET_KEY environment variable",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Handle different HTTP methods
    switch (req.method) {
      case "POST":
        return await handleCreateRefund(req);
      case "GET":
        return await handleGetRefunds(req);
      case "PUT":
        return await handleUpdateRefund(req);
      default:
        return new Response(
          JSON.stringify({
            success: false,
            error: "METHOD_NOT_SUPPORTED",
            message: `Method ${req.method} is not supported`,
          }),
          {
            status: 405,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
    }
  } catch (error) {
    console.error("Refund management error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "UNEXPECTED_REFUND_MANAGEMENT_ERROR",
        details: {
          error_message: error.message,
          error_stack: error.stack,
          error_type: error.constructor.name,
          timestamp: new Date().toISOString(),
        },
        fix_instructions:
          "This is an unexpected server error. Check server logs for details.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

async function handleCreateRefund(req: Request): Promise<Response> {
  try {
    const requestData = await req.json();
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    let transactionReference = requestData.transaction_reference;

    // If no transaction reference but order_id provided, get it from order
    if (!transactionReference && requestData.order_id) {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('payment_reference')
        .eq('id', requestData.order_id)
        .single();

      if (orderError || !order) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "ORDER_NOT_FOUND",
            details: {
              order_id: requestData.order_id,
              message: "Order not found or has no payment reference"
            }
          }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      transactionReference = order.payment_reference;
    }

    if (!transactionReference) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "TRANSACTION_REFERENCE_REQUIRED",
          details: {
            message: "Either transaction_reference or order_id with valid payment reference is required"
          }
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Handle test/mock references
    if (transactionReference.includes('test_') || transactionReference.includes('mock_')) {
      console.log('Processing mock refund for reference:', transactionReference);

      // Create mock refund response
      const mockRefund = {
        id: Date.now(),
        transaction: {
          reference: transactionReference,
          amount: requestData.refund_amount || 10000, // Default R100 in kobo
          currency: 'ZAR'
        },
        amount: requestData.refund_amount || 10000,
        currency: 'ZAR',
        status: 'pending',
        refunded_at: new Date().toISOString(),
        customer_note: requestData.reason || 'Admin test refund',
        merchant_note: 'Mock refund processed successfully'
      };

      // Store refund record in database
      await supabase.from('refund_transactions').insert({
        transaction_reference: transactionReference,
        order_id: requestData.order_id,
        amount: requestData.refund_amount || 10000,
        reason: requestData.reason || 'Admin test refund',
        status: 'completed',
        admin_initiated: requestData.admin_initiated || false,
        paystack_response: mockRefund,
        created_at: new Date().toISOString()
      });

      return new Response(
        JSON.stringify({
          success: true,
          data: mockRefund,
          mock: true,
          message: 'Mock refund processed successfully',
          timestamp: new Date().toISOString(),
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Prepare refund data for Paystack
    const refundData: RefundRequest = {
      transaction: transactionReference,
      amount: requestData.refund_amount,
      currency: requestData.currency || 'ZAR',
      customer_note: requestData.reason || 'Refund processed',
      merchant_note: requestData.admin_initiated ? 'Admin initiated refund' : 'Customer refund request'
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

    // Store refund record in database
    if (response.ok) {
      await supabase.from('refund_transactions').insert({
        transaction_reference: transactionReference,
        order_id: requestData.order_id,
        amount: requestData.refund_amount,
        reason: requestData.reason,
        status: result.data?.status || 'pending',
        admin_initiated: requestData.admin_initiated || false,
        paystack_response: result.data,
        created_at: new Date().toISOString()
      });
    }

    return new Response(
      JSON.stringify({
        success: response.ok,
        data: result,
        timestamp: new Date().toISOString(),
      }),
      {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "CREATE_REFUND_FAILED",
        details: { error_message: error.message },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
}

async function handleGetRefunds(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const reference = url.searchParams.get("reference");

    let apiUrl = "https://api.paystack.co/refund";
    if (reference) {
      apiUrl += `/${reference}`;
    }

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();

    return new Response(
      JSON.stringify({
        success: response.ok,
        data: result,
        timestamp: new Date().toISOString(),
      }),
      {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "GET_REFUNDS_FAILED",
        details: { error_message: error.message },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
}

async function handleUpdateRefund(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const refundId = url.searchParams.get("refund_id");

    if (!refundId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "REFUND_ID_REQUIRED",
          details: {
            message: "refund_id query parameter is required for updates",
          },
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const updateData = await req.json();

    const response = await fetch(`https://api.paystack.co/refund/${refundId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateData),
    });

    const result = await response.json();

    return new Response(
      JSON.stringify({
        success: response.ok,
        data: result,
        timestamp: new Date().toISOString(),
      }),
      {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "UPDATE_REFUND_FAILED",
        details: { error_message: error.message },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
}

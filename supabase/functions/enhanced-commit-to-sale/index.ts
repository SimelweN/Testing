import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CommitRequest {
  order_id: string;
  seller_id: string;
  delivery_method: "home" | "locker";
  locker_id?: string;
  use_locker_api?: boolean;
}

interface LockerShipmentData {
  senderName: string;
  senderPhone: string;
  senderEmail: string;
  receiverName: string;
  receiverPhone: string;
  receiverEmail: string;
  receiverAddress: string;
  lockerId: string;
  orderId: string;
  weight?: number;
  size?: "S" | "M" | "L";
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { order_id, seller_id, delivery_method, locker_id, use_locker_api }: CommitRequest = await req.json();

    console.log('🚀 Enhanced commit request:', { 
      order_id, 
      seller_id, 
      delivery_method, 
      locker_id, 
      use_locker_api 
    });

    // Validate required fields
    if (!order_id || !seller_id || !delivery_method) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: order_id, seller_id, delivery_method' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate locker delivery requirements
    if (delivery_method === "locker" && !locker_id) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Locker ID is required for locker delivery method' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get order details
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select(`
        *,
        book:books(*),
        buyer:profiles!buyer_id(*),
        seller:profiles!seller_id(*)
      `)
      .eq('id', order_id)
      .eq('seller_id', seller_id)
      .single();

    if (orderError || !order) {
      console.error('❌ Order not found or access denied:', orderError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Order not found or access denied' 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check if already committed
    if (order.status === 'committed' || order.status === 'shipped') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Order is already committed' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    let shipmentResult = null;

    // Handle locker delivery
    if (delivery_method === "locker" && use_locker_api) {
      console.log('📦 Creating locker shipment...');
      
      try {
        // Prepare shipment data
        const shipmentData: LockerShipmentData = {
          senderName: order.seller.name || 'Seller',
          senderPhone: order.seller.phone || '',
          senderEmail: order.seller.email || '',
          receiverName: order.buyer.name || 'Buyer',
          receiverPhone: order.buyer.phone || '',
          receiverEmail: order.buyer.email || '',
          receiverAddress: order.delivery_address || '',
          lockerId: locker_id!,
          orderId: order_id,
          weight: 0.5,
          size: "S"
        };

        // Create locker shipment via Courier Guy API
        shipmentResult = await createLockerShipment(shipmentData);
        
        if (!shipmentResult.success) {
          throw new Error(shipmentResult.error || 'Failed to create locker shipment');
        }

        console.log('✅ Locker shipment created:', shipmentResult);
      } catch (error) {
        console.error('❌ Locker shipment creation failed:', error);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Failed to create locker shipment: ${error.message}` 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    // Update order status
    const updateData: any = {
      status: 'committed',
      delivery_method: delivery_method,
      committed_at: new Date().toISOString(),
    };

    // Add locker-specific data
    if (delivery_method === "locker") {
      updateData.locker_id = locker_id;
      if (shipmentResult) {
        updateData.tracking_number = shipmentResult.trackingNumber;
        updateData.qr_code_url = shipmentResult.qrCodeUrl;
        updateData.waybill_url = shipmentResult.waybillUrl;
      }
      // Set earlier payment date (3 days earlier)
      const paymentDate = new Date();
      paymentDate.setDate(paymentDate.getDate() + 4); // 7 days standard - 3 days = 4 days
      updateData.estimated_payment_date = paymentDate.toISOString();
    }

    const { data: updatedOrder, error: updateError } = await supabaseClient
      .from('orders')
      .update(updateData)
      .eq('id', order_id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Failed to update order:', updateError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to update order status' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create notification for buyer
    const notificationMessage = delivery_method === "locker" 
      ? `Your order for "${order.book?.title}" has been committed with locker delivery. Tracking: ${shipmentResult?.trackingNumber || 'N/A'}`
      : `Your order for "${order.book?.title}" has been committed. Courier pickup scheduled.`;

    await supabaseClient
      .from('notifications')
      .insert({
        user_id: order.buyer_id,
        title: 'Order Committed',
        message: notificationMessage,
        type: 'order_committed',
        metadata: {
          order_id: order_id,
          delivery_method: delivery_method,
          ...(shipmentResult && {
            tracking_number: shipmentResult.trackingNumber,
            qr_code_url: shipmentResult.qrCodeUrl
          })
        }
      });

    console.log('✅ Enhanced commit completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Order committed with ${delivery_method} delivery`,
        order: updatedOrder,
        shipment: shipmentResult
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('💥 Enhanced commit error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function createLockerShipment(shipmentData: LockerShipmentData) {
  const API_KEY = Deno.env.get('VITE_COURIER_GUY_LOCKER_API_KEY');
  
  if (!API_KEY) {
    throw new Error('Locker API key not configured');
  }

  const requestBody = {
    sender: {
      name: shipmentData.senderName,
      phone: shipmentData.senderPhone,
      email: shipmentData.senderEmail,
    },
    receiver: {
      name: shipmentData.receiverName,
      phone: shipmentData.receiverPhone,
      email: shipmentData.receiverEmail,
      address: shipmentData.receiverAddress,
    },
    parcel: {
      weight: shipmentData.weight || 0.5,
      size: shipmentData.size || "S",
    },
    serviceType: "LockerToDoor",
    lockerId: shipmentData.lockerId,
    reference: shipmentData.orderId,
  };

  const response = await fetch("https://api.pudo.co.za/shipment", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "ApiKey": API_KEY,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const result = await response.json();
  
  return {
    success: true,
    trackingNumber: result.trackingNumber,
    qrCodeUrl: result.qrCodeUrl,
    waybillUrl: result.waybillUrl,
    reference: result.reference,
  };
}

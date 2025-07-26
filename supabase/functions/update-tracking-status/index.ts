import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Courier Guy API tracking statuses
const DELIVERY_STATUS_MAPPING = {
  'COLLECTED': 'shipped',
  'DELIVERED': 'delivered', 
  'IN_TRANSIT': 'in_transit',
  'OUT_FOR_DELIVERY': 'out_for_delivery',
  'DELIVERED_TO_RECIPIENT': 'delivered',
  'COLLECTION_FAILED': 'collection_failed',
  'DELIVERY_FAILED': 'delivery_failed',
  'RETURNED_TO_SENDER': 'returned',
}

interface CourierTrackingResponse {
  tracking_number: string
  status: string
  status_description: string
  events: Array<{
    status: string
    description: string
    date_time: string
    location?: string
  }>
}

interface OrderToTrack {
  order_id: string
  tracking_number: string
  delivery_status: string
  courier: string
  buyer_email: string
  seller_id: string
  buyer_name?: string
  seller_name?: string
  seller_email?: string
}

// Email template function
function createEmailTemplate(title: string, emoji: string, content: string, trackingNumber?: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title} - ReBooked Solutions</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f3fef7;
      padding: 20px;
      color: #1f4e3d;
      margin: 0;
    }
    .container {
      max-width: 500px;
      margin: auto;
      background-color: #ffffff;
      padding: 30px;
      border-radius: 10px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }
    .header {
      background: #3ab26f;
      color: white;
      padding: 20px;
      text-align: center;
      border-radius: 10px 10px 0 0;
      margin: -30px -30px 20px -30px;
    }
    .footer {
      background: #f3fef7;
      color: #1f4e3d;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      line-height: 1.5;
      margin: 30px -30px -30px -30px;
      border-radius: 0 0 10px 10px;
      border-top: 1px solid #e5e7eb;
    }
    .info-box {
      background: #f3fef7;
      border: 1px solid #3ab26f;
      padding: 15px;
      border-radius: 5px;
      margin: 15px 0;
    }
    .link { color: #3ab26f; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${emoji} ${title}</h1>
    </div>

    ${content}

    ${trackingNumber ? `
    <div class="info-box">
      <h3>📱 Tracking Information</h3>
      <p><strong>Tracking Number:</strong> ${trackingNumber}</p>
      <p><strong>Carrier:</strong> Courier Guy</p>
    </div>
    ` : ''}

    <p>Thank you for choosing ReBooked Solutions!</p>

    <div class="footer">
      <p><strong>This is an automated message from ReBooked Solutions.</strong><br>
      Please do not reply to this email.</p>
      <p>For help, contact support@rebookedsolutions.co.za<br>
      Visit our website: www.rebookedsolutions.co.za<br>
      T&Cs apply</p>
      <p><em>"Pre-Loved Pages, New Adventures"</em></p>
    </div>
  </div>
</body>
</html>`;
}

async function sendEmailNotification(
  supabase: any,
  email: string,
  subject: string,
  htmlContent: string,
  textContent: string
) {
  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: email,
        subject: subject,
        html: htmlContent,
        text: textContent,
      }),
    });
    console.log(`Email sent successfully to ${email}`);
  } catch (emailError) {
    console.error(`Failed to send email to ${email}:`, emailError);
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('🔄 Starting automated tracking status update...')

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const courierApiKey = Deno.env.get('COURIER_GUY_API_KEY')

    if (!courierApiKey) {
      throw new Error('COURIER_GUY_API_KEY not configured')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get orders that need tracking updates
    const { data: ordersToTrack, error: fetchError } = await supabase
      .rpc('get_orders_for_tracking_update')

    if (fetchError) {
      console.error('❌ Error fetching orders for tracking:', fetchError)
      throw fetchError
    }

    console.log(`📦 Found ${ordersToTrack?.length || 0} orders to track`)

    if (!ordersToTrack || ordersToTrack.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No orders to track',
          updated_orders: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let updatedOrders = 0
    const updateResults = []

    // Process each order
    for (const order of ordersToTrack as OrderToTrack[]) {
      try {
        console.log(`🔍 Checking tracking for order ${order.order_id}, tracking: ${order.tracking_number}`)

        // Call Courier Guy tracking API
        const trackingResponse = await fetch(
          `https://api.courierguy.co.za/v1/track/${order.tracking_number}`,
          {
            headers: {
              'Authorization': `Bearer ${courierApiKey}`,
              'Content-Type': 'application/json',
            },
          }
        )

        if (!trackingResponse.ok) {
          console.error(`❌ Courier API error for ${order.tracking_number}:`, trackingResponse.status)
          updateResults.push({
            order_id: order.order_id,
            tracking_number: order.tracking_number,
            status: 'api_error',
            error: `Courier API returned ${trackingResponse.status}`
          })
          continue
        }

        const trackingData: CourierTrackingResponse = await trackingResponse.json()
        console.log(`📨 Tracking response for ${order.tracking_number}:`, trackingData.status)

        // Map courier status to our delivery status
        const newStatus = DELIVERY_STATUS_MAPPING[trackingData.status] || order.delivery_status

        // Only update if status changed
        if (newStatus !== order.delivery_status) {
          console.log(`📝 Updating order ${order.order_id} from ${order.delivery_status} to ${newStatus}`)

          // Update order status in database
          const { error: updateError } = await supabase
            .rpc('update_order_tracking_status', {
              p_order_id: order.order_id,
              p_new_status: newStatus,
              p_tracking_data: {
                last_checked: new Date().toISOString(),
                courier_status: trackingData.status,
                status_description: trackingData.status_description,
                events: trackingData.events
              }
            })

          if (updateError) {
            console.error(`❌ Error updating order ${order.order_id}:`, updateError)
            updateResults.push({
              order_id: order.order_id,
              tracking_number: order.tracking_number,
              status: 'update_error',
              error: updateError.message
            })
          } else {
            updatedOrders++
            updateResults.push({
              order_id: order.order_id,
              tracking_number: order.tracking_number,
              status: 'updated',
              old_status: order.delivery_status,
              new_status: newStatus
            })

            // Send email notifications based on status
            await sendStatusChangeEmails(supabase, order, newStatus)
          }
        } else {
          updateResults.push({
            order_id: order.order_id,
            tracking_number: order.tracking_number,
            status: 'no_change',
            current_status: newStatus
          })
        }

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))

      } catch (error) {
        console.error(`❌ Error processing order ${order.order_id}:`, error)
        updateResults.push({
          order_id: order.order_id,
          tracking_number: order.tracking_number,
          status: 'processing_error',
          error: error.message
        })
      }
    }

    console.log(`✅ Tracking update completed. Updated ${updatedOrders} orders.`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Tracking update completed`,
        total_orders_checked: ordersToTrack.length,
        updated_orders: updatedOrders,
        results: updateResults
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Fatal error in tracking update:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function sendStatusChangeEmails(supabase: any, order: OrderToTrack, newStatus: string) {
  const customerName = order.buyer_name || "Customer";
  const sellerName = order.seller_name || "Seller";

  switch (newStatus) {
    case 'in_transit':
      // Notify buyer - package is in transit
      if (order.buyer_email) {
        const buyerHtml = createEmailTemplate(
          "Your Order is on the Way!",
          "🚚",
          `<h2>Hello ${customerName}!</h2>
          <p>Good news! Your order #${order.order_id} is now in transit and on its way to you.</p>
          <p>Your package has been collected from the seller and is being transported by our courier partner.</p>
          <p>You can expect delivery within the next 1-3 business days depending on your location.</p>`,
          order.tracking_number
        );

        await sendEmailNotification(
          supabase,
          order.buyer_email,
          "📦 Your Order is on the Way - ReBooked Solutions",
          buyerHtml,
          `Your Order is on the Way!\n\nHello ${customerName}!\n\nGood news! Your order #${order.order_id} is now in transit and on its way to you.\n\nTracking Number: ${order.tracking_number}\nCarrier: Courier Guy\n\nThank you for choosing ReBooked Solutions!`
        );
      }

      // Notify seller - package collected
      if (order.seller_email) {
        const sellerHtml = createEmailTemplate(
          "Your Package has been Collected",
          "📦",
          `<h2>Hello ${sellerName}!</h2>
          <p>Your order #${order.order_id} has been successfully collected by our courier and is now in transit to the buyer.</p>
          <p>Thank you for your prompt preparation and handover of the package.</p>
          <p>Once the package is delivered, your payment will be processed according to our payment schedule.</p>`,
          order.tracking_number
        );

        await sendEmailNotification(
          supabase,
          order.seller_email,
          "📦 Package Collected Successfully - ReBooked Solutions",
          sellerHtml,
          `Package Collected Successfully!\n\nHello ${sellerName}!\n\nYour order #${order.order_id} has been successfully collected by our courier and is now in transit to the buyer.\n\nTracking Number: ${order.tracking_number}\n\nThank you for choosing ReBooked Solutions!`
        );
      }
      break;

    case 'delivered':
      // Notify buyer - delivery confirmed
      if (order.buyer_email) {
        const buyerHtml = createEmailTemplate(
          "Order Delivered Successfully!",
          "✅",
          `<h2>Hello ${customerName}!</h2>
          <p>Excellent news! Your order #${order.order_id} has been successfully delivered.</p>
          <p>We hope you enjoy your purchase! If you have any issues with your order, please don't hesitate to contact our support team.</p>
          <div class="info-box">
            <h3>📝 What's Next?</h3>
            <p>• If you're satisfied with your purchase, consider leaving a review</p>
            <p>• For any issues, contact us within 7 days</p>
            <p>• Keep your order number for future reference</p>
          </div>`,
          order.tracking_number
        );

        await sendEmailNotification(
          supabase,
          order.buyer_email,
          "✅ Order Delivered Successfully - ReBooked Solutions",
          buyerHtml,
          `Order Delivered Successfully!\n\nHello ${customerName}!\n\nExcellent news! Your order #${order.order_id} has been successfully delivered.\n\nTracking Number: ${order.tracking_number}\n\nThank you for choosing ReBooked Solutions!`
        );
      }

      // Notify seller - order completed
      if (order.seller_email) {
        const sellerHtml = createEmailTemplate(
          "Order Completed Successfully!",
          "🎉",
          `<h2>Hello ${sellerName}!</h2>
          <p>Great news! Your order #${order.order_id} has been successfully delivered to the buyer.</p>
          <p>The order is now complete and your payment will be processed according to our standard payment schedule.</p>
          <div class="info-box">
            <h3>💰 Payment Processing</h3>
            <p>Your earnings from this sale will be processed and transferred to your registered bank account within our standard payment cycle.</p>
            <p>You can track your earnings in your seller dashboard.</p>
          </div>`,
          order.tracking_number
        );

        await sendEmailNotification(
          supabase,
          order.seller_email,
          "🎉 Order Completed - Payment Processing - ReBooked Solutions",
          sellerHtml,
          `Order Completed Successfully!\n\nHello ${sellerName}!\n\nGreat news! Your order #${order.order_id} has been successfully delivered to the buyer.\n\nThe order is now complete and your payment will be processed according to our standard payment schedule.\n\nTracking Number: ${order.tracking_number}\n\nThank you for choosing ReBooked Solutions!`
        );
      }
      break;

    case 'out_for_delivery':
      // Notify buyer - out for delivery
      if (order.buyer_email) {
        const buyerHtml = createEmailTemplate(
          "Your Order is Out for Delivery!",
          "🚛",
          `<h2>Hello ${customerName}!</h2>
          <p>Your order #${order.order_id} is out for delivery and should arrive today!</p>
          <p>Please ensure someone is available to receive the package at your delivery address.</p>
          <div class="info-box">
            <h3>📋 Delivery Tips</h3>
            <p>• Please be available at your delivery address</p>
            <p>• Have your ID ready for verification if required</p>
            <p>• Check that you receive the correct package</p>
          </div>`,
          order.tracking_number
        );

        await sendEmailNotification(
          supabase,
          order.buyer_email,
          "🚛 Your Order is Out for Delivery - ReBooked Solutions",
          buyerHtml,
          `Your Order is Out for Delivery!\n\nHello ${customerName}!\n\nYour order #${order.order_id} is out for delivery and should arrive today!\n\nTracking Number: ${order.tracking_number}\n\nThank you for choosing ReBooked Solutions!`
        );
      }
      break;
  }
}

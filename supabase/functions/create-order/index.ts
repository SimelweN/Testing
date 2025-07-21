import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders, getCorsHeaders } from "../_shared/cors.ts";
import { handleOptionsRequest, isOptionsRequest } from "../_shared/options-handler.ts";
import { enhancedParseRequestBody } from "../_shared/enhanced-body-parser.ts";
import { validateUUIDs } from "../_shared/uuid-validator.ts";
import { validateEnvironment } from "../_shared/auth-utils.ts";
import { jsonResponse, errorResponse, handleCorsPreflightRequest, safeErrorResponse } from "../_shared/response-utils.ts";
import { logError } from "../_shared/error-utils.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? '';
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? '';

interface CartItem {
  book_id: string;
  title: string;
  author: string;
  price: number;
  seller_id: string;
  condition?: string;
  isbn?: string;
}

interface CreateOrderRequest {
  buyer_id?: string;
  user_id?: string;
  buyer_email?: string;
  email?: string;
  cart_items?: CartItem[];
  items?: CartItem[];
  shipping_address: any;
  payment_reference?: string;
  payment_data?: any;
}

serve(async (req) => {
  if (isOptionsRequest(req)) {
    return handleOptionsRequest(req);
  }

  try {
    const envValidation = validateEnvironment();
    if (!envValidation.success) return envValidation.errorResponse!;

    const bodyResult = await enhancedParseRequestBody<CreateOrderRequest>(req, corsHeaders);
    if (!bodyResult.success) return bodyResult.errorResponse!;

    const {
      buyer_id,
      user_id,
      buyer_email,
      email,
      cart_items,
      items,
      shipping_address,
      payment_reference,
      payment_data
    } = bodyResult.data!;

    const finalBuyerId = buyer_id || user_id;
    const finalBuyerEmail = buyer_email || email;
    const finalItems = cart_items || items;

    // Enhanced validation
    const validationErrors = [];

    if (!finalBuyerId) {
      validationErrors.push("buyer_id or user_id is required");
    }

    if (!finalBuyerEmail) {
      validationErrors.push("buyer_email or email is required");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(finalBuyerEmail)) {
      validationErrors.push("buyer_email must be a valid email address");
    }

    if (!Array.isArray(finalItems) || finalItems.length === 0) {
      validationErrors.push("cart_items or items must be a non-empty array");
    }

    if (!shipping_address) {
      validationErrors.push("shipping_address is required");
    }

    // Validate each cart item
    if (finalItems && Array.isArray(finalItems)) {
      finalItems.forEach((item, index) => {
        if (!item.book_id) validationErrors.push(`cart_items[${index}].book_id is required`);
        if (!item.title) validationErrors.push(`cart_items[${index}].title is required`);
        if (!item.author) validationErrors.push(`cart_items[${index}].author is required`);
        if (!item.seller_id) validationErrors.push(`cart_items[${index}].seller_id is required`);
        if (typeof item.price !== 'number' || item.price <= 0) {
          validationErrors.push(`cart_items[${index}].price must be a positive number`);
        }
      });
    }

    if (validationErrors.length > 0) {
      return errorResponse("VALIDATION_FAILED", {
        validation_errors: validationErrors,
        provided_fields: Object.keys(bodyResult.data!),
        expected_format: {
          buyer_id: "string (UUID)",
          buyer_email: "string (valid email)",
          cart_items: "array of cart items",
          shipping_address: "object with address details"
        }
      }, { status: 400 });
    }

    const uuidValidation = validateUUIDs({
      buyer_id: finalBuyerId,
      ...finalItems.reduce((acc, item, index) => {
        acc[`book_${index}_id`] = item.book_id;
        acc[`seller_${index}_id`] = item.seller_id;
        return acc;
      }, {} as Record<string, string>)
    });

    if (!uuidValidation.isValid) {
      return errorResponse("UUID_VALIDATION_FAILED", {
        validation_errors: uuidValidation.errors
      }, { status: 400 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Get buyer information
    const { data: buyer, error: buyerError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", finalBuyerId)
      .single();

    if (buyerError || !buyer) {
      return errorResponse("BUYER_NOT_FOUND", {
        buyer_id: finalBuyerId,
        error_message: buyerError?.message || "Buyer profile not found"
      }, { status: 404 });
    }

    // Group items by seller
    const ordersBySeller = finalItems.reduce((acc, item) => {
      if (!acc[item.seller_id]) acc[item.seller_id] = [];
      acc[item.seller_id].push(item);
      return acc;
    }, {} as Record<string, CartItem[]>);

    const bookIds = finalItems.map(item => item.book_id);

    // Mark books as sold atomically
    const { error: booksUpdateError } = await supabase
      .from("books")
      .update({
        sold: true,
        updated_at: new Date().toISOString(),
        sold_at: new Date().toISOString(),
        buyer_id: finalBuyerId
      })
      .in("id", bookIds)
      .eq("sold", false);

    if (booksUpdateError) {
      return errorResponse("BOOKS_UPDATE_FAILED", {
        message: booksUpdateError.message
      }, { status: 500 });
    }

    const createdOrders = [];
    const finalPaymentRef = payment_reference || `test_ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create orders for each seller
    for (const [sellerId, sellerItems] of Object.entries(ordersBySeller)) {
      // Get seller information
      const { data: seller, error: sellerError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", sellerId)
        .single();

      if (sellerError || !seller) {
        console.error(`Seller ${sellerId} not found:`, sellerError);
        continue;
      }

      const totalAmount = sellerItems.reduce((sum, item) => sum + (item.price || 0), 0);
      const commitDeadline = new Date(Date.now() + 48 * 60 * 60 * 1000);

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          buyer_id: finalBuyerId,
          buyer_email: finalBuyerEmail,
          seller_id: sellerId,
          items: sellerItems,
          amount: Math.round(totalAmount * 100),
          total_amount: totalAmount,
          status: "pending_commit",
          payment_status: "paid",
          payment_reference: finalPaymentRef,
          shipping_address,
          commit_deadline: commitDeadline.toISOString(),
          paid_at: new Date().toISOString(),
          // Additional fields for compatibility
          buyer_name: buyer.name,
          seller_name: seller.name,
          seller_email: seller.email,
          expires_at: commitDeadline.toISOString(),
          created_at: new Date().toISOString(),
          paystack_ref: finalPaymentRef,
          delivery_address: shipping_address,
          metadata: {
            item_count: sellerItems.length,
            created_at: new Date().toISOString(),
            created_from: "cart",
            payment_data: payment_data || null
          }
        })
        .select()
        .single();

      if (orderError) {
        console.error(`Failed to create order for seller ${sellerId}:`, orderError);
        continue;
      }

      createdOrders.push(order);

      // Create notifications
      await supabase.from("order_notifications").insert([
        {
          order_id: order.id,
          user_id: finalBuyerId,
          type: "order_confirmed",
          title: "Order Confirmed!",
          message: `Your order for ${sellerItems.length} book(s) has been confirmed. Total: R${totalAmount.toFixed(2)}`
        },
        {
          order_id: order.id,
          user_id: sellerId,
          type: "new_order",
          title: "New Order Received!",
          message: `You have a new order worth R${totalAmount.toFixed(2)}. Please commit within 48 hours.`
        }
      ]);

      // Log activity
      await supabase.from("order_activity_log").insert({
        order_id: order.id,
        user_id: finalBuyerId,
        action: "order_created",
        new_status: "pending_commit",
        metadata: {
          total_amount: totalAmount,
          items_count: sellerItems.length,
          payment_reference: finalPaymentRef
        }
      });
    }

    if (createdOrders.length === 0) {
      return errorResponse("ORDER_CREATION_FAILED", {
        message: "Failed to create any orders - no valid sellers found"
      }, { status: 500 });
    }

    // Prepare beautiful HTML email templates (preserved from original)
    const buyerHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order Confirmed - Thank You!</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f3fef7;
      padding: 20px;
      color: #1f4e3d;
      margin: 0;
    }
    .container {
      max-width: 600px;
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
    .order-item {
      background: #f9fafb;
      border-left: 3px solid #3ab26f;
      padding: 10px;
      margin: 5px 0;
    }
    .btn {
      display: inline-block;
      padding: 12px 20px;
      background-color: #3ab26f;
      color: white;
      text-decoration: none;
      border-radius: 5px;
      margin-top: 20px;
      font-weight: bold;
    }
    .link { color: #3ab26f; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Order Confirmed!</h1>
    </div>

    <h2>Thank you, ${buyer.name}!</h2>
    <p>Your order has been confirmed and the sellers have been notified.</p>

    <div class="info-box">
      <h3>📊 Order Summary</h3>
      <p><strong>Total Orders:</strong> ${createdOrders.length}</p>
      <p><strong>Total Amount:</strong> R${createdOrders.reduce((sum, order) => sum + order.total_amount, 0).toFixed(2)}</p>
      <p><strong>Total Books:</strong> ${finalItems.length}</p>
    </div>

    ${createdOrders
      .map(
        (order) => `
    <div class="order-item">
      <h4>Order #${order.id}</h4>
      <p><strong>Seller:</strong> ${order.seller_name}</p>
      <p><strong>Items:</strong> ${order.items.length} book(s)</p>
      <p><strong>Amount:</strong> R${order.total_amount.toFixed(2)}</p>
      <p><strong>Expires:</strong> ${new Date(order.expires_at).toLocaleString()}</p>
    </div>
    `,
      )
      .join("")}

    <div class="info-box">
      <h3>📦 What happens next?</h3>
      <ul>
        <li>Each seller has 48 hours to commit to their orders</li>
        <li>Once committed, we'll arrange pickup and delivery</li>
        <li>You'll receive tracking information via email</li>
        <li>Your books will be delivered within 2-3 business days</li>
      </ul>
    </div>

    <p>We'll notify you as soon as each seller confirms their order!</p>

    <a href="https://rebookedsolutions.co.za/activity" class="btn">Track Your Orders</a>

    <div class="footer">
      <p><strong>This is an automated message from ReBooked Solutions.</strong><br>
      Please do not reply to this email.</p>
      <p>For assistance, contact: <a href="mailto:support@rebookedsolutions.co.za" class="link">support@rebookedsolutions.co.za</a><br>
      Visit us at: <a href="https://rebookedsolutions.co.za" class="link">https://rebookedsolutions.co.za</a></p>
      <p>T&Cs apply.</p>
      <p><em>"Pre-Loved Pages, New Adventures"</em></p>
    </div>
  </div>
</body>
</html>`;

    // Add buyer email to mail queue
    await supabase.from("mail_queue").insert({
      user_id: finalBuyerId,
      email: finalBuyerEmail,
      subject: "🎉 Order Confirmed - Thank You!",
      body: buyerHtml,
      status: "pending",
      created_at: new Date().toISOString()
    });

    // Add seller notification emails to mail queue
    for (const order of createdOrders) {
      const sellerHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Order - Action Required</title>
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
    .warning {
      background: #fff3cd;
      border: 1px solid #ffeaa7;
      padding: 10px;
      border-radius: 5px;
      margin: 10px 0;
    }
    .btn {
      display: inline-block;
      padding: 12px 20px;
      background-color: #3ab26f;
      color: white;
      text-decoration: none;
      border-radius: 5px;
      margin-top: 20px;
      font-weight: bold;
    }
    .link { color: #3ab26f; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📚 New Order - Action Required!</h1>
    </div>

    <h2>Hi ${order.seller_name}!</h2>
    <p>Great news! You have a new order from <strong>${buyer.name}</strong>.</p>

    <div class="info-box">
      <h3>📋 Order Details</h3>
      <p><strong>Order ID:</strong> ${order.id}</p>
      <p><strong>Buyer:</strong> ${buyer.name} (${finalBuyerEmail})</p>
      <p><strong>Items:</strong> ${order.items.length} book(s)</p>
      <p><strong>Total Amount:</strong> R${order.total_amount.toFixed(2)}</p>
    </div>

    <div class="info-box">
      <h3>📚 Books Ordered</h3>
      ${order.items
        .map(
          (item) => `
        <p><strong>${item.title}</strong> by ${item.author}<br>
        Condition: ${item.condition || "Not specified"} - R${item.price.toFixed(2)}</p>
      `,
        )
        .join("")}
    </div>

    <div class="warning">
      <h3>⏰ Action Required Within 48 Hours</h3>
      <p><strong>Expires:</strong> ${new Date(order.expires_at).toLocaleString()}</p>
      <p>You must commit to this order within 48 hours or it will be automatically cancelled and refunded.</p>
    </div>

    <p>Once you commit, we'll arrange pickup and you'll be paid after delivery!</p>

    <a href="https://rebookedsolutions.co.za/activity" class="btn">Commit to Order</a>

    <div class="footer">
      <p><strong>This is an automated message from ReBooked Solutions.</strong><br>
      Please do not reply to this email.</p>
      <p>For assistance, contact: <a href="mailto:support@rebookedsolutions.co.za" class="link">support@rebookedsolutions.co.za</a><br>
      Visit us at: <a href="https://rebookedsolutions.co.za" class="link">https://rebookedsolutions.co.za</a></p>
      <p>T&Cs apply.</p>
      <p><em>"Pre-Loved Pages, New Adventures"</em></p>
    </div>
  </div>
</body>
</html>`;

      await supabase.from("mail_queue").insert({
        user_id: order.seller_id,
        email: order.seller_email,
        subject: "📚 New Order - Action Required (48 hours)",
        body: sellerHtml,
        status: "pending",
        created_at: new Date().toISOString()
      });
    }

    return jsonResponse({
      success: true,
      message: `Successfully created ${createdOrders.length} order(s)`,
      orders: createdOrders.map((order) => ({
        id: order.id,
        seller_id: order.seller_id,
        seller_name: order.seller_name,
        total_amount: order.total_amount,
        item_count: order.items.length,
        commit_deadline: order.expires_at,
        status: order.status,
      })),
      total_orders: createdOrders.length,
      total_amount: createdOrders.reduce((sum, order) => sum + order.total_amount, 0),
      books_marked_sold: bookIds.length,
      payment_reference: finalPaymentRef,
      emails_queued: createdOrders.length + 1 // buyer + sellers
    });
  } catch (error) {
    logError("Create order", error);

    return safeErrorResponse(
      "ORDER_CREATION_FAILED",
      error,
      "Failed to create orders",
      { status: 500 }
    );
  }
});

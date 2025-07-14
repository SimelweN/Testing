import {
  handleCORS,
  createSupabaseClient,
  validateFields,
  logEvent,
  parseRequestBody,
} from "./_lib/utils.js";

export default async function handler(req, res) {
  // Handle CORS
  handleCORS(req, res);
  if (req.method === "OPTIONS") return;

  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed. Use POST.",
    });
  }

  try {
    const body = await parseRequestBody(req);
    const { order_id, trigger } = body;

    // Validate required fields
    validateFields(body, ["order_id"]);

    logEvent("delivery_automation_started", { order_id, trigger });

    // Initialize Supabase
    const supabase = createSupabaseClient();

    // 📦 STEP 1: Get order with full details
    const { data: order, error } = await supabase
      .from("orders")
      .select(
        `
        *,
        seller:profiles!orders_seller_id_fkey(name, email, pickup_address, phone),
        buyer:profiles!orders_buyer_id_fkey(name, email, phone),
        books(title, price, weight)
      `,
      )
      .eq("id", order_id)
      .single();

    if (error || !order) {
      logEvent("order_not_found", { order_id, error });
      return res.status(404).json({
        success: false,
        error: "Order not found",
      });
    }

    logEvent("order_found", { order_id, seller: order.seller?.name });

    // 🚚 STEP 2: CALL REAL COURIER APIs FOR PICKUP BOOKING
    const pickupData = {
      pickup_address: {
        name: order.seller?.name || "Seller",
        street:
          order.seller?.pickup_address?.streetAddress ||
          order.pickup_address?.streetAddress ||
          "",
        city:
          order.seller?.pickup_address?.city ||
          order.pickup_address?.city ||
          "",
        province:
          order.seller?.pickup_address?.province ||
          order.pickup_address?.province ||
          "",
        postal_code:
          order.seller?.pickup_address?.postalCode ||
          order.pickup_address?.postalCode ||
          "0000",
        phone: order.seller?.phone || "",
        email: order.seller?.email || "",
      },
      delivery_address: order.shipping_address || order.delivery_address,
      parcel: {
        weight: order.books?.[0]?.weight || 0.5, // Book weight in kg
        length: 25,
        width: 20,
        height: 5,
        description: `Book: ${order.books?.[0]?.title || order.book_title || "Textbook"}`,
        value: (order.amount || order.total_amount || 0) / 100, // Convert from cents to rands
      },
      service_level: "standard",
      reference: order_id,
    };

    logEvent("courier_booking_attempt", { order_id, pickupData });

    let bookingResult;
    let bookingError;

    // 📞 TRY COURIER GUY FIRST
    try {
      const courierGuyResponse = await fetch(
        `${req.headers.host}/api/courier-guy-shipment`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(pickupData),
        },
      );

      const courierGuyResult = await courierGuyResponse.json();

      if (courierGuyResult?.success) {
        bookingResult = courierGuyResult;
        bookingResult.courier_provider = "courier-guy";
        logEvent("courier_guy_success", { order_id, booking: bookingResult });
      } else {
        bookingError = courierGuyResult.error || "Courier Guy booking failed";
        logEvent("courier_guy_failed", { order_id, error: bookingError });
      }
    } catch (error) {
      bookingError = error.message;
      logEvent("courier_guy_error", { order_id, error: error.message });
    }

    // 📞 FALLBACK TO FASTWAY IF COURIER GUY FAILS
    if (!bookingResult) {
      try {
        logEvent("fastway_fallback_attempt", { order_id });

        const fastwayResponse = await fetch(
          `${req.headers.host}/api/fastway-shipment`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(pickupData),
          },
        );

        const fastwayResult = await fastwayResponse.json();

        if (fastwayResult?.success) {
          bookingResult = fastwayResult;
          bookingResult.courier_provider = "fastway";
          logEvent("fastway_success", { order_id, booking: bookingResult });
        } else {
          bookingError = fastwayResult.error || "Fastway booking failed";
          logEvent("fastway_failed", { order_id, error: bookingError });
        }
      } catch (error) {
        logEvent("fastway_error", { order_id, error: error.message });
        bookingError = error.message;
      }
    }

    if (!bookingResult) {
      throw new Error(`Failed to book courier pickup: ${bookingError}`);
    }

    // 📄 STEP 3: DOWNLOAD & STORE SHIPPING LABEL PDF
    let labelUrl = bookingResult.label_url;

    if (bookingResult.label_url) {
      try {
        labelUrl = await downloadAndStoreLabel(
          bookingResult.label_url,
          order_id,
          supabase,
        );
        logEvent("label_stored", { order_id, labelUrl });
      } catch (error) {
        logEvent("label_storage_failed", { order_id, error: error.message });
        // Use original URL as fallback
      }
    }

    // 📊 STEP 4: UPDATE ORDER WITH DELIVERY INFO
    const updateData = {
      courier_provider: bookingResult.courier_provider || "courier-guy",
      courier_tracking_number:
        bookingResult.waybill_number || bookingResult.tracking_number,
      courier_pickup_date: bookingResult.pickup_date,
      courier_pickup_time:
        bookingResult.pickup_time_window || bookingResult.pickup_time,
      shipping_label_url: labelUrl,
      status: "courier_scheduled",
      updated_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id", order_id);

    if (updateError) {
      logEvent("order_update_failed", { order_id, error: updateError });
      // Don't fail the entire operation for database update errors
    } else {
      logEvent("order_updated", { order_id });
    }

    const response = {
      success: true,
      pickup_date: bookingResult.pickup_date,
      pickup_time_window:
        bookingResult.pickup_time_window || bookingResult.pickup_time,
      courier_provider: bookingResult.courier_provider || "courier-guy",
      tracking_number:
        bookingResult.waybill_number || bookingResult.tracking_number,
      shipping_label_url: labelUrl,
    };

    logEvent("delivery_automation_completed", { order_id, response });

    return res.status(200).json(response);
  } catch (error) {
    logEvent("delivery_automation_error", {
      error: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      success: false,
      error: error.message || "Delivery automation failed",
    });
  }
}

// 📄 DOWNLOAD & STORE PDF FUNCTION
async function downloadAndStoreLabel(labelUrl, orderId, supabase) {
  try {
    logEvent("label_download_started", { orderId, labelUrl });

    // Download the PDF from courier API
    const response = await fetch(labelUrl);
    if (!response.ok) {
      throw new Error(`Failed to download label: ${response.statusText}`);
    }

    const blob = await response.blob();
    logEvent("label_downloaded", { orderId, size: blob.size });

    // Upload to Supabase Storage
    const fileName = `shipping-labels/${orderId}-${Date.now()}.pdf`;
    const { data, error } = await supabase.storage
      .from("order-documents")
      .upload(fileName, blob, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (error) {
      logEvent("storage_upload_failed", { orderId, error: error.message });
      throw new Error(`Failed to store label: ${error.message}`);
    }

    logEvent("label_uploaded", { orderId, fileName });

    // Get public URL for download
    const { data: urlData } = supabase.storage
      .from("order-documents")
      .getPublicUrl(fileName);

    if (!urlData?.publicUrl) {
      throw new Error("Failed to get public URL for stored label");
    }

    logEvent("public_url_generated", { orderId, publicUrl: urlData.publicUrl });
    return urlData.publicUrl;
  } catch (error) {
    logEvent("label_storage_error", { orderId, error: error.message });
    // Return original URL as fallback
    return labelUrl;
  }
}

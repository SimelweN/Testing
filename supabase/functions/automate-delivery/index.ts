import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Method not allowed. Use POST.",
      }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const { order_id, trigger } = await req.json();

    if (!order_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing order_id",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    console.log(
      `🚚 Starting delivery automation for order: ${order_id}, trigger: ${trigger}`,
    );

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
      console.error("Order not found:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Order not found",
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    console.log(`📋 Order found: ${order.id}, seller: ${order.seller?.name}`);

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

    console.log(`📞 Calling courier service with data:`, pickupData);

    let bookingResult;
    let bookingError;

    // 📞 TRY COURIER GUY FIRST
    try {
      const response = await supabase.functions.invoke("courier-guy-shipment", {
        body: pickupData,
      });

      if (response.data?.success) {
        bookingResult = response.data;
        console.log("✅ Courier Guy booking successful:", bookingResult);
      } else {
        bookingError = response.error || "Courier Guy booking failed";
        console.warn("⚠️ Courier Guy booking failed:", bookingError);
      }
    } catch (error) {
      bookingError = error;
      console.warn("⚠️ Courier Guy API error:", error);
    }

    // 📞 FALLBACK TO FASTWAY IF COURIER GUY FAILS
    if (!bookingResult) {
      try {
        console.log("🔄 Trying Fastway as fallback...");
        const response = await supabase.functions.invoke("fastway-shipment", {
          body: pickupData,
        });

        if (response.data?.success) {
          bookingResult = response.data;
          bookingResult.courier_provider = "fastway";
          console.log("✅ Fastway booking successful:", bookingResult);
        } else {
          bookingError = response.error || "Fastway booking failed";
          console.warn("⚠️ Fastway booking also failed:", bookingError);
        }
      } catch (error) {
        console.error("⚠️ Fastway API error:", error);
        bookingError = error;
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
        console.log("📄 Shipping label stored:", labelUrl);
      } catch (error) {
        console.warn("⚠️ Failed to store shipping label:", error);
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
      console.error("⚠️ Failed to update order:", updateError);
      // Don't fail the entire operation for database update errors
    } else {
      console.log("✅ Order updated with delivery info");
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

    console.log("🎉 Delivery automation completed successfully:", response);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("💥 Delivery automation error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Delivery automation failed",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

// 📄 DOWNLOAD & STORE PDF FUNCTION
async function downloadAndStoreLabel(
  labelUrl: string,
  orderId: string,
  supabase: any,
): Promise<string> {
  try {
    console.log(`📄 Downloading shipping label from: ${labelUrl}`);

    // Download the PDF from courier API
    const response = await fetch(labelUrl);
    if (!response.ok) {
      throw new Error(`Failed to download label: ${response.statusText}`);
    }

    const blob = await response.blob();
    console.log(`📄 Downloaded label, size: ${blob.size} bytes`);

    // Upload to Supabase Storage
    const fileName = `shipping-labels/${orderId}-${Date.now()}.pdf`;
    const { data, error } = await supabase.storage
      .from("order-documents")
      .upload(fileName, blob, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (error) {
      console.error("Storage error:", error);
      throw new Error(`Failed to store label: ${error.message}`);
    }

    console.log(`📄 Label stored successfully: ${fileName}`);

    // Get public URL for download
    const { data: urlData } = supabase.storage
      .from("order-documents")
      .getPublicUrl(fileName);

    if (!urlData?.publicUrl) {
      throw new Error("Failed to get public URL for stored label");
    }

    console.log(`📄 Public URL generated: ${urlData.publicUrl}`);
    return urlData.publicUrl;
  } catch (error) {
    console.error("📄 Failed to store shipping label:", error);
    // Return original URL as fallback
    return labelUrl;
  }
}

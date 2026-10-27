// ==============================================================================
// SETLLA BACKEND - PAYSTACK WEBHOOK EDGE FUNCTION
// Location: supabase/functions/paystack-webhook/index.ts
// Runtime: Deno (Supabase Edge Network)
// ==============================================================================
// This serverless function runs on Supabase's cloud backend, completely
// isolated from the frontend browser. It securely verifies payments from Paystack
// using your secret key (PAYSTACK_SECRET_KEY) and updates the database using
// the Supabase Service Role Key.
// ==============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-paystack-signature",
};

serve(async (req: Request) => {
  // 1. Handle CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!PAYSTACK_SECRET_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("[Paystack Webhook] Missing required environment secrets.");
      return new Response(
        JSON.stringify({ error: "Server configuration error: missing secrets" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Validate HMAC SHA512 Signature from Paystack
    const signature = req.headers.get("x-paystack-signature");
    const bodyText = await req.text();

    if (!signature) {
      console.warn("[Paystack Webhook] Request missing x-paystack-signature header.");
      return new Response(
        JSON.stringify({ error: "Missing signature header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Compute expected HMAC SHA-512
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(PAYSTACK_SECRET_KEY),
      { name: "HMAC", hash: "SHA-512" },
      false,
      ["sign"]
    );

    const sigBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(bodyText));
    const expectedSignature = Array.from(new Uint8Array(sigBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (signature.toLowerCase() !== expectedSignature.toLowerCase()) {
      console.warn("[Paystack Webhook] Invalid signature detected. Rejected request.");
      return new Response(
        JSON.stringify({ error: "Invalid signature verification" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Signature is Verified! Parse the Paystack Event
    const payload = JSON.parse(bodyText);
    const event = payload.event;
    const data = payload.data;

    console.log(`[Paystack Webhook] Verified event: ${event} | Reference: ${data?.reference}`);

    // Initialize elevated Supabase Admin client with Service Role Key
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    if (event === "charge.success") {
      const reference = data.reference;
      const amountPaid = (data.amount || 0) / 100; // Paystack sends amounts in Kobo
      const metadata = data.metadata || {};

      // SCENARIO A: Property Inspection Booking Fee
      if (metadata.booking_id) {
        console.log(`[Paystack Webhook] Unlocking inspection booking: ${metadata.booking_id}`);
        const { error: bookingError } = await supabase
          .from("bookings")
          .update({
            status: "CONFIRMED_UNLOCKED",
            payment_reference: reference,
            inspection_fee_amount: amountPaid,
            payment_method: data.channel ? `Card (${data.channel})` : "Paystack",
            confirmed_at: new Date().toISOString(),
          })
          .eq("id", metadata.booking_id);

        if (bookingError) {
          console.error("[Paystack Webhook] Error updating booking:", bookingError);
        }
      }

      // SCENARIO B: Sponsored Ad Campaign
      if (metadata.ad_id) {
        console.log(`[Paystack Webhook] Activating sponsored advert campaign: ${metadata.ad_id}`);
        const { error: adError } = await supabase
          .from("adverts")
          .update({
            status: "active",
            budget_amount: amountPaid,
            updated_at: new Date().toISOString(),
          })
          .eq("id", metadata.ad_id);

        if (adError) {
          console.error("[Paystack Webhook] Error activating advert:", adError);
        }
      }

      // SCENARIO C: Advertiser Wallet Top-Up
      if (metadata.advertiser_id && metadata.type === "wallet_topup") {
        console.log(`[Paystack Webhook] Crediting advertiser wallet: ${metadata.advertiser_id}`);
        
        // Fetch current balance
        const { data: advertiser } = await supabase
          .from("advertisers")
          .select("wallet_balance, total_spent")
          .eq("id", metadata.advertiser_id)
          .single();

        if (advertiser) {
          const newBalance = (Number(advertiser.wallet_balance) || 0) + amountPaid;
          await supabase
            .from("advertisers")
            .update({
              wallet_balance: newBalance,
              updated_at: new Date().toISOString(),
            })
            .eq("id", metadata.advertiser_id);
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: "Webhook processed and verified" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[Paystack Webhook] Exception occurred:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

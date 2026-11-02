// ==============================================================================
// SETLLA BACKEND - SERVER-SIDE PAYSTACK VERIFICATION EDGE FUNCTION
// Location: supabase/functions/verify-payment/index.ts
// Runtime: Deno (Supabase Edge Network)
// ==============================================================================
// Calls Paystack's REST API directly from Supabase's secure edge servers using
// PAYSTACK_SECRET_KEY. Never exposes the secret key to browser clients.
// Verifies status === 'success' and validates expected amount.
// ==============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!PAYSTACK_SECRET_KEY) {
      return new Response(
        JSON.stringify({ error: "PAYSTACK_SECRET_KEY not set in environment secrets." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { reference, expectedAmountNaira, recordType, recordId } = await req.json();

    if (!reference) {
      return new Response(
        JSON.stringify({ error: "Transaction reference is required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Call Paystack REST API server-side
    const paystackRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const paystackData = await paystackRes.json();

    if (!paystackRes.ok || !paystackData.status || paystackData.data?.status !== "success") {
      return new Response(
        JSON.stringify({
          verified: false,
          message: paystackData.message || "Payment verification failed on Paystack.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tx = paystackData.data;
    const paidNaira = (tx.amount || 0) / 100;

    // Validate amount if expected amount was provided (allowing 1% rounding tolerance)
    if (expectedAmountNaira && paidNaira < expectedAmountNaira * 0.99) {
      return new Response(
        JSON.stringify({
          verified: false,
          message: `Amount paid (₦${paidNaira}) is less than expected amount (₦${expectedAmountNaira}).`,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If Supabase Service Role is configured, update the target database row safely from backend
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY && recordType && recordId) {
      const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

      if (recordType === "advert") {
        await supabaseAdmin
          .from("adverts")
          .update({
            status: "active",
            payment_status: "paid",
            payment_reference: reference,
            budget_amount: paidNaira,
            updated_at: new Date().toISOString(),
          })
          .eq("id", recordId);
      } else if (recordType === "booking") {
        await supabaseAdmin
          .from("bookings")
          .update({
            status: "CONFIRMED_UNLOCKED",
            payment_reference: reference,
            inspection_fee_amount: paidNaira,
            confirmed_at: new Date().toISOString(),
          })
          .eq("id", recordId);
      }
    }

    return new Response(
      JSON.stringify({
        verified: true,
        reference: tx.reference,
        amountNaira: paidNaira,
        channel: tx.channel,
        customerEmail: tx.customer?.email,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal verification error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});


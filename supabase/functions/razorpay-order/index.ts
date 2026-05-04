import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RAZORPAY_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID")!;
const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const { action, plan, userId, orderId, paymentId, signature } = await req.json();

  // ── CREATE ORDER ──
  if (action === "create") {
    const PRICES: Record<string, number> = {
      pro: 39900,    // ₹399 in paise
      scale: 99900,  // ₹999 in paise
    };
    const amount = PRICES[plan];
    if (!amount) {
      return new Response(JSON.stringify({ error: "Invalid plan" }), {
        status: 400, headers: corsHeaders,
      });
    }

    const credentials = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);
    const orderRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${credentials}`,
      },
      body: JSON.stringify({
        amount,
        currency: "INR",
        receipt: `receipt_${userId}_${plan}_${Date.now()}`,
        notes: { plan, userId },
      }),
    });

    const order = await orderRes.json();
    if (!order.id) {
      return new Response(JSON.stringify({ error: "Failed to create order", detail: order }), {
        status: 500, headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify({ orderId: order.id, amount: order.amount }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ── VERIFY PAYMENT ──
  if (action === "verify") {
    // HMAC SHA256 verification
    const body = `${orderId}|${paymentId}`;
    const key = new TextEncoder().encode(RAZORPAY_KEY_SECRET);
    const msg = new TextEncoder().encode(body);
    const cryptoKey = await crypto.subtle.importKey(
      "raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
    );
    const signatureBytes = await crypto.subtle.sign("HMAC", cryptoKey, msg);
    const expectedSignature = Array.from(new Uint8Array(signatureBytes))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (expectedSignature !== signature) {
      return new Response(JSON.stringify({ error: "Invalid payment signature" }), {
        status: 400, headers: corsHeaders,
      });
    }

    // Signature valid — update plan in DB
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { error } = await supabase
      .from("user_settings")
      .upsert({
        user_id: userId,
        subscription_plan: plan,
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify({ success: true, plan }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ error: "Unknown action" }), {
    status: 400, headers: corsHeaders,
  });
});

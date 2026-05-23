import Stripe from "npm:stripe@17";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "");

// Price ID of the $79 one-time audit product — set this in Supabase secrets
const AUDIT_PRICE_ID = Deno.env.get("STRIPE_AUDIT_PRICE_ID") ?? "";

const SITE_URL = "https://virallized.com";

// Annual price IDs — promo codes are not allowed on these
const ANNUAL_PRICE_IDS = new Set([
  // IG Growth Service (existing)
  "price_1NddgCHDWey36HYKv6txlP5o", // STANDARD annual
  "price_1NddgwHDWey36HYKRqQTb9YA", // PRO annual
  "price_1NddRPHDWey36HYKNyQfnD8X", // MAX annual
  "price_1R0F3mHDWey36HYKpxmw10D4", // MANAGED annual
  // Creator Studio annual (no promo needed — already discounted)
  "price_1TZnFrHDWey36HYKhIl3mx9c", // CS Standard annual
  "price_1TZnFsHDWey36HYKzXYL8xOe", // CS Pro annual
  "price_1TZnFsHDWey36HYKW6k7hNYi", // CS Max annual
]);

// Creator Studio one-time top-up price
const CS_TOPUP_LOOKUP_KEY = "cs_topup_10_gens";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { priceId, includeAudit, referralId, isTopup, isCreatorStudio, trialDays } = await req.json();

    if (!priceId) {
      throw new Error("Missing priceId");
    }

    // ── Resolve logged-in Supabase user (so webhook can skip email lookup) ───
    let supabaseUserId: string | undefined;
    try {
      const authHeader = req.headers.get("Authorization") ?? "";
      const token = authHeader.replace("Bearer ", "").trim();
      if (token) {
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_ANON_KEY") ?? "",
        );
        const { data: { user } } = await supabase.auth.getUser(token);
        supabaseUserId = user?.id;
      }
    } catch (_) { /* non-fatal — fall back to email lookup in webhook */ }

    // ── Creator Studio one-time top-up ──────────────────────────────────────
    if (isTopup) {
      // Look up the topup price by lookup key if needed
      let topupPriceId = priceId;
      if (priceId === "topup") {
        const prices = await stripe.prices.list({ lookup_keys: [CS_TOPUP_LOOKUP_KEY], limit: 1 });
        if (!prices.data.length) throw new Error("Top-up price not found");
        topupPriceId = prices.data[0].id;
      }

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [{ price: topupPriceId, quantity: 1 }],
        success_url: `${SITE_URL}/content-studio?topup=success`,
        cancel_url: `${SITE_URL}/content-studio`,
        payment_intent_data: {
          metadata: { product_type: "topup", generations_added: "10" },
        },
      });

      return new Response(JSON.stringify({ url: session.url }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // ── Regular subscription (IG growth or Creator Studio) ───────────────────
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      { price: priceId, quantity: 1 },
    ];

    if (includeAudit && AUDIT_PRICE_ID) {
      lineItems.push({ price: AUDIT_PRICE_ID, quantity: 1 });
    }

    // Build subscription_data — always embed user_id in metadata for CS plans
    const subscriptionData: Stripe.Checkout.SessionCreateParams.SubscriptionData = {};
    if (isCreatorStudio) {
      if (trialDays) subscriptionData.trial_period_days = Number(trialDays);
      if (supabaseUserId) subscriptionData.metadata = { user_id: supabaseUserId };
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      line_items: lineItems,
      success_url: isCreatorStudio ? `${SITE_URL}/content-studio?subscribed=success&session_id={CHECKOUT_SESSION_ID}` : `${SITE_URL}/set-up`,
      cancel_url: isCreatorStudio ? `${SITE_URL}/#creator-studio` : `${SITE_URL}/#pricing`,
      allow_promotion_codes: !ANNUAL_PRICE_IDS.has(priceId),
      ...(Object.keys(subscriptionData).length ? { subscription_data: subscriptionData } : {}),
      metadata: {
        hasAudit: includeAudit ? "true" : "false",
        product_type: isCreatorStudio ? "creator_studio" : "ig_growth",
      },
    };

    // Preserve Rewardful affiliate tracking
    if (referralId) {
      sessionParams.client_reference_id = referralId;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("create-checkout error:", message);

    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

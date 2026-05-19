import Stripe from "npm:stripe@17";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "");

// Price ID of the $79 one-time audit product — set this in Supabase secrets
const AUDIT_PRICE_ID = Deno.env.get("STRIPE_AUDIT_PRICE_ID") ?? "";

const SITE_URL = "https://virallized.com";

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
    const { priceId, includeAudit, referralId } = await req.json();

    if (!priceId) {
      throw new Error("Missing priceId");
    }

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      { price: priceId, quantity: 1 },
    ];

    if (includeAudit && AUDIT_PRICE_ID) {
      lineItems.push({ price: AUDIT_PRICE_ID, quantity: 1 });
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      line_items: lineItems,
      success_url: `${SITE_URL}/set-up`,
      cancel_url: `${SITE_URL}/#pricing`,
      metadata: {
        hasAudit: includeAudit ? "true" : "false",
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

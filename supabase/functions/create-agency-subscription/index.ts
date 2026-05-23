import Stripe from "npm:stripe@17";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "");
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Plan name → monthly Stripe Price ID
const PLAN_PRICE_IDS: Record<string, string> = {
  Standard: "price_1IbUHGHDWey36HYKtX574WCZ",
  Pro: "price_1LtxxXHDWey36HYK9u5kfjGV",
  Max: "price_1NaRdbHDWey36HYKnrjdmjlL",
  Managed: "price_1R0F38HDWey36HYKtwtJBQWg",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { clientId, plan } = await req.json();

    if (!clientId || !plan) {
      throw new Error("Missing required fields: clientId, plan");
    }

    // Extract user from JWT
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace("Bearer ", "");

    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        apikey: supabaseServiceKey,
        Authorization: `Bearer ${jwt}`,
      },
    });
    const userJson = await userRes.json();
    const userId = userJson?.id;

    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Fetch agency record
    const agencyRes = await fetch(
      `${supabaseUrl}/rest/v1/agencies?user_id=eq.${userId}&select=*&limit=1`,
      {
        headers: {
          apikey: supabaseServiceKey,
          Authorization: `Bearer ${supabaseServiceKey}`,
        },
      },
    );
    const agencies = await agencyRes.json();
    const agency = agencies[0];

    if (!agency) {
      throw new Error("Agency record not found");
    }

    if (!agency.stripe_customer_id) {
      throw new Error(
        "No payment method on file. Please set up your payment method first.",
      );
    }

    const priceId = PLAN_PRICE_IDS[plan];
    if (!priceId) {
      throw new Error(`Unknown plan: ${plan}`);
    }

    // Create a coupon for the agency's discount (one-time use, 100% toward this sub)
    let couponId: string | undefined;
    if (agency.discount_percent && agency.discount_percent > 0) {
      const coupon = await stripe.coupons.create({
        percent_off: agency.discount_percent,
        duration: "forever",
        name: `Agency discount ${agency.discount_percent}%`,
      });
      couponId = coupon.id;
    }

    // Create the subscription
    const subscriptionParams: Stripe.SubscriptionCreateParams = {
      customer: agency.stripe_customer_id,
      items: [{ price: priceId }],
      metadata: {
        agency_id: agency.id,
        client_id: clientId,
      },
    };

    if (couponId) {
      subscriptionParams.coupon = couponId;
    }

    const subscription = await stripe.subscriptions.create(subscriptionParams);

    // Save stripe_subscription_id to client record
    await fetch(
      `${supabaseUrl}/rest/v1/clients?id=eq.${clientId}`,
      {
        method: "PATCH",
        headers: {
          apikey: supabaseServiceKey,
          Authorization: `Bearer ${supabaseServiceKey}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          stripe_subscription_id: subscription.id,
          payment_authorized: true,
        }),
      },
    );

    return new Response(
      JSON.stringify({ success: true, subscriptionId: subscription.id }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("create-agency-subscription error:", message);

    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

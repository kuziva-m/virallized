import Stripe from "npm:stripe@17";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "");
const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ── Price map: PLAN × TIER → Stripe price ID ─────────────────────────────────
const AGENCY_PRICES: Record<string, Record<number, string>> = {
  standard: {
    20: "price_1TZ3fwHDWey36HYKvp83MXXk",
    25: "price_1TZ3fyHDWey36HYKwMk9w8Vv",
    30: "price_1TZ3g0HDWey36HYKd3LrUiTs",
    35: "price_1TZ3g2HDWey36HYKFzforVfi",
  },
  pro: {
    20: "price_1TZ3g4HDWey36HYKWYzIJVkg",
    25: "price_1TZ3g6HDWey36HYKcqApNsWd",
    30: "price_1TZ3g7HDWey36HYKeRam0BTA",
    35: "price_1TZ3g9HDWey36HYK5K4TudSY",
  },
  max: {
    20: "price_1TZ3gBHDWey36HYKDuXrsznA",
    25: "price_1TZ3gDHDWey36HYKRabKteQY",
    30: "price_1TZ3gEHDWey36HYKWdjfFzBI",
    35: "price_1TZ3gGHDWey36HYKRf3xMwz3",
  },
  managed: {
    20: "price_1TZ3gIHDWey36HYKlUyeX7IL",
    25: "price_1TZ3gKHDWey36HYKrAR9W4GM",
    30: "price_1TZ3gMHDWey36HYKQODm768p",
    35: "price_1TZ3gNHDWey36HYK1IvFOcUo",
  },
};

// ── Tier calculation based on active client count ─────────────────────────────
const getTierDiscount = (activeCount: number): number => {
  if (activeCount >= 16) return 35;
  if (activeCount >= 8)  return 30;
  if (activeCount >= 4)  return 25;
  return 20;
};

const getPriceId = (plan: string, tierDiscount: number): string => {
  const planKey = plan.toLowerCase().replace(/\s+/g, "");
  const prices = AGENCY_PRICES[planKey];
  if (!prices) throw new Error(`Unknown plan: ${plan}`);
  const price = prices[tierDiscount];
  if (!price) throw new Error(`No price for plan ${plan} at ${tierDiscount}% tier`);
  return price;
};

// ── Count active clients for an agency ───────────────────────────────────────
const getActiveClientCount = async (agencyId: string): Promise<number> => {
  const { count } = await supabase
    .from("clients")
    .select("id", { count: "exact", head: true })
    .eq("agency_id", agencyId)
    .not("status", "eq", "cancelled");
  return count ?? 0;
};

// ── Update all agency subscriptions when tier changes ────────────────────────
const updateAllSubscriptionTiers = async (
  agencyId: string,
  newTier: number,
): Promise<void> => {
  // Get all clients with active Stripe subscriptions
  const { data: clients } = await supabase
    .from("clients")
    .select("id, plan, stripe_subscription_id")
    .eq("agency_id", agencyId)
    .not("status", "eq", "cancelled")
    .not("stripe_subscription_id", "is", null);

  if (!clients?.length) return;

  for (const client of clients) {
    try {
      const newPriceId = getPriceId(client.plan, newTier);
      const sub = await stripe.subscriptions.retrieve(client.stripe_subscription_id);
      const itemId = sub.items.data[0]?.id;
      if (!itemId) continue;

      await stripe.subscriptions.update(client.stripe_subscription_id, {
        items: [{ id: itemId, price: newPriceId }],
        proration_behavior: "none", // take effect at next billing cycle
      });
    } catch (err) {
      console.error(`Failed to update subscription for client ${client.id}:`, err);
    }
  }

  // Update agency's discount_percent in DB
  await supabase
    .from("agencies")
    .update({ discount_percent: newTier })
    .eq("id", agencyId);
};

// ── Main handler ─────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { action, agencyId, clientId, plan } = await req.json();

    if (!agencyId) throw new Error("Missing agencyId");

    // ── GET AGENCY ─────────────────────────────────────────────────────────
    const { data: agency, error: agencyErr } = await supabase
      .from("agencies")
      .select("id, stripe_customer_id, discount_percent")
      .eq("id", agencyId)
      .single();

    if (agencyErr || !agency) throw new Error("Agency not found");
    if (!agency.stripe_customer_id) throw new Error("Agency has no payment method on file");

    // ── ADD CLIENT: create subscription ───────────────────────────────────
    if (action === "add_client") {
      if (!clientId || !plan) throw new Error("Missing clientId or plan");

      const activeCount = await getActiveClientCount(agencyId);
      const tier = getTierDiscount(activeCount); // count already includes this new client
      const priceId = getPriceId(plan, tier);

      const subscription = await stripe.subscriptions.create({
        customer: agency.stripe_customer_id,
        items: [{ price: priceId }],
        metadata: { agency_id: agencyId, client_id: clientId, plan },
      });

      // Save subscription ID to client record
      await supabase
        .from("clients")
        .update({ stripe_subscription_id: subscription.id })
        .eq("id", clientId);

      // Check if tier changed and update all other subscriptions
      const previousTier = getTierDiscount(activeCount - 1);
      if (tier !== previousTier) {
        console.log(`Tier upgraded: ${previousTier}% → ${tier}%`);
        await updateAllSubscriptionTiers(agencyId, tier);
      } else {
        // Just update agency discount_percent
        await supabase.from("agencies").update({ discount_percent: tier }).eq("id", agencyId);
      }

      return new Response(
        JSON.stringify({ success: true, subscriptionId: subscription.id, tier, priceId }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    // ── REMOVE CLIENT: cancel subscription ────────────────────────────────
    if (action === "remove_client") {
      if (!clientId) throw new Error("Missing clientId");

      const { data: client } = await supabase
        .from("clients")
        .select("stripe_subscription_id")
        .eq("id", clientId)
        .single();

      if (client?.stripe_subscription_id) {
        await stripe.subscriptions.update(client.stripe_subscription_id, {
          cancel_at_period_end: true,
        });
        await supabase
          .from("clients")
          .update({ status: "cancelled" })
          .eq("id", clientId);
      }

      // Recalculate tier after removal
      const newActiveCount = await getActiveClientCount(agencyId);
      const newTier = getTierDiscount(newActiveCount);
      const currentTier = agency.discount_percent;

      if (newTier !== currentTier) {
        console.log(`Tier downgraded: ${currentTier}% → ${newTier}%`);
        await updateAllSubscriptionTiers(agencyId, newTier);
      }

      return new Response(
        JSON.stringify({ success: true, tier: newTier }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    throw new Error(`Unknown action: ${action}`);

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("agency-billing error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
    );
  }
});

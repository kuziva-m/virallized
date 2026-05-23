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
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const results: Record<string, string> = {};

    // ── 1. Create products ────────────────────────────────────────────────────
    const productDefs = [
      { key: "standard", name: "Virallized Creator Studio — Standard", tier: "standard", gens: 20,  profiles: 1 },
      { key: "pro",      name: "Virallized Creator Studio — Pro",      tier: "pro",      gens: 60,  profiles: 3 },
      { key: "max",      name: "Virallized Creator Studio — Max",      tier: "max",      gens: 175, profiles: 10 },
      { key: "topup",    name: "Virallized Creator Studio — +10 Generation Top-up", tier: "topup", gens: 10, profiles: 0 },
    ];

    const productIds: Record<string, string> = {};
    for (const p of productDefs) {
      const product = await stripe.products.create({
        name: p.name,
        metadata: {
          plan_tier: p.tier,
          generations_per_month: String(p.gens),
          brand_profile_limit: String(p.profiles),
          product_type: p.key === "topup" ? "topup" : "subscription",
        },
      });
      productIds[p.key] = product.id;
      results[`product_${p.key}`] = product.id;
    }

    // ── 2. Create subscription prices ─────────────────────────────────────────
    const priceDefs = [
      { key: "standard_monthly", productKey: "standard", amount: 4900,   interval: "month", slug: "cs_standard_monthly", tier: "standard", period: "monthly", gens: 20,  profiles: 1  },
      { key: "pro_monthly",      productKey: "pro",      amount: 8900,   interval: "month", slug: "cs_pro_monthly",      tier: "pro",      period: "monthly", gens: 60,  profiles: 3  },
      { key: "max_monthly",      productKey: "max",      amount: 19900,  interval: "month", slug: "cs_max_monthly",      tier: "max",      period: "monthly", gens: 175, profiles: 10 },
      { key: "standard_annual",  productKey: "standard", amount: 29000,  interval: "year",  slug: "cs_standard_annual",  tier: "standard", period: "annual",  gens: 20,  profiles: 1  },
      { key: "pro_annual",       productKey: "pro",      amount: 59000,  interval: "year",  slug: "cs_pro_annual",       tier: "pro",      period: "annual",  gens: 60,  profiles: 3  },
      { key: "max_annual",       productKey: "max",      amount: 129000, interval: "year",  slug: "cs_max_annual",       tier: "max",      period: "annual",  gens: 175, profiles: 10 },
    ];

    const priceIds: Record<string, string> = {};
    for (const p of priceDefs) {
      const price = await stripe.prices.create({
        product: productIds[p.productKey],
        unit_amount: p.amount,
        currency: "usd",
        recurring: { interval: p.interval as "month" | "year" },
        lookup_key: p.slug,
        metadata: {
          plan_tier: p.tier,
          billing_period: p.period,
          generations_per_month: String(p.gens),
          brand_profile_limit: String(p.profiles),
        },
      });
      priceIds[p.key] = price.id;
      results[`price_${p.key}`] = price.id;

      // Update stripe_plan_config with the real Stripe price ID
      await supabase.from("stripe_plan_config").upsert({
        stripe_price_id: price.id,
        plan_tier: p.tier,
        billing_period: p.period,
        generations_per_month: p.gens,
        brand_profile_limit: p.profiles,
        display_name: p.key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
      });
    }

    // Top-up one-time price
    const topupPrice = await stripe.prices.create({
      product: productIds["topup"],
      unit_amount: 1900,
      currency: "usd",
      lookup_key: "cs_topup_10_gens",
      metadata: { generations_added: "10", product_type: "topup" },
    });
    priceIds["topup"] = topupPrice.id;
    results["price_topup"] = topupPrice.id;

    // ── 3. EARLYBIRD coupon ───────────────────────────────────────────────────
    let coupon: Stripe.Coupon;
    try {
      coupon = await stripe.coupons.create({
        id: "EARLYBIRD",
        percent_off: 40,
        duration: "forever",
        max_redemptions: 500,
        redeem_by: Math.floor(new Date("2026-10-01T00:00:00Z").getTime() / 1000),
        applies_to: {
          products: [productIds["standard"], productIds["pro"], productIds["max"]],
        },
        metadata: { description: "40% off monthly plans — lifetime price lock" },
      });
    } catch (e: any) {
      // Coupon may already exist
      coupon = await stripe.coupons.retrieve("EARLYBIRD");
    }
    results["coupon_earlybird"] = coupon.id;

    // ── 4. Promotion code ─────────────────────────────────────────────────────
    const existingCodes = await stripe.promotionCodes.list({ code: "EARLYBIRD", limit: 1 });
    let promoCode: Stripe.PromotionCode;
    if (existingCodes.data.length > 0) {
      promoCode = existingCodes.data[0];
    } else {
      promoCode = await stripe.promotionCodes.create({
        coupon: coupon.id,
        code: "EARLYBIRD",
        active: true,
      });
    }
    results["promo_code_id"] = promoCode.id;

    console.log("✅ Stripe Creator Studio setup complete:", results);

    return new Response(JSON.stringify({ success: true, ids: results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("stripe-cs-setup error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

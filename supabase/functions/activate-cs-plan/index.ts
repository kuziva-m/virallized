/**
 * activate-cs-plan
 *
 * Called by the client immediately after Stripe redirects back.
 * Receives the Stripe checkout session_id, retrieves the subscription directly,
 * and writes user_plans — no email matching, no webhook dependency.
 */
import Stripe from "npm:stripe@17";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "");
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const CS_PLAN_MAP: Record<string, { tier: string; gens: number; period: string }> = {
  "price_1TZnFpHDWey36HYKKaJt7JvB": { tier: "standard", gens: 20,  period: "monthly" },
  "price_1TZnFqHDWey36HYKLtGVCVsQ": { tier: "pro",      gens: 60,  period: "monthly" },
  "price_1TZnFrHDWey36HYKcrGY46aS": { tier: "max",      gens: 175, period: "monthly" },
  "price_1TZnFrHDWey36HYKhIl3mx9c": { tier: "standard", gens: 20,  period: "annual"  },
  "price_1TZnFsHDWey36HYKzXYL8xOe": { tier: "pro",      gens: 60,  period: "annual"  },
  "price_1TZnFsHDWey36HYKW6k7hNYi": { tier: "max",      gens: 175, period: "annual"  },
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // ── 1. Authenticate the calling user ────────────────────────────────────
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) throw new Error("Missing auth token");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    // ── 2. Get the session ID from the request body ──────────────────────────
    const { sessionId } = await req.json().catch(() => ({}));
    if (!sessionId) throw new Error("Missing sessionId");

    // ── 3. Retrieve the checkout session from Stripe ─────────────────────────
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });

    if (session.status !== "complete") {
      return new Response(
        JSON.stringify({ activated: false, reason: `Session status: ${session.status}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    const sub = session.subscription as Stripe.Subscription | null;
    if (!sub) {
      return new Response(
        JSON.stringify({ activated: false, reason: "No subscription on session" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    const priceId = sub.items.data[0]?.price?.id ?? "";
    const config = CS_PLAN_MAP[priceId];

    if (!config) {
      return new Response(
        JSON.stringify({ activated: false, reason: `Unknown price ID: ${priceId}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    // ── 4. Upsert user_plans ─────────────────────────────────────────────────
    const resetDate = new Date(sub.current_period_end * 1000).toISOString();
    const couponId = sub.discount?.coupon?.id ?? null;

    // During a free trial the subscription status is "trialing" — give 3 free
    // generations. The webhook will upgrade to full limits when the trial ends
    // and the first payment succeeds (status flips to "active").
    const isTrialing = sub.status === "trialing";
    const planStatus = isTrialing ? "trialing" : "active";
    const generationsLimit = isTrialing ? 3 : config.gens;

    const { error: upsertError } = await supabase.from("user_plans").upsert(
      {
        user_id:                user.id,
        stripe_customer_id:     sub.customer as string,
        stripe_subscription_id: sub.id,
        stripe_price_id:        priceId,
        plan_tier:              config.tier,
        billing_period:         config.period,
        generations_limit:      generationsLimit,
        generations_reset_date: resetDate,
        status:                 planStatus,
        earlybird:              couponId === "EARLYBIRD",
      },
      { onConflict: "user_id", ignoreDuplicates: false },
    );

    if (upsertError) {
      console.error("upsert error:", upsertError.message);
      throw new Error("Failed to activate plan: " + upsertError.message);
    }

    console.log(`✓ Plan ${planStatus} via session ${sessionId}: ${user.id} → ${config.tier} (${generationsLimit} gens)`);

    return new Response(
      JSON.stringify({ activated: true, tier: config.tier, period: config.period }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("activate-cs-plan error:", message);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

import Stripe from "npm:stripe@17";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "");
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ── Creator Studio price → plan config ───────────────────────────────────────
const CS_PLAN_MAP: Record<string, { tier: string; gens: number; period: string }> = {
  "price_1TZnFpHDWey36HYKKaJt7JvB": { tier: "standard", gens: 20,  period: "monthly" },
  "price_1TZnFqHDWey36HYKLtGVCVsQ": { tier: "pro",      gens: 60,  period: "monthly" },
  "price_1TZnFrHDWey36HYKcrGY46aS": { tier: "max",      gens: 175, period: "monthly" },
  "price_1TZnFrHDWey36HYKhIl3mx9c": { tier: "standard", gens: 20,  period: "annual"  },
  "price_1TZnFsHDWey36HYKzXYL8xOe": { tier: "pro",      gens: 60,  period: "annual"  },
  "price_1TZnFsHDWey36HYKW6k7hNYi": { tier: "max",      gens: 175, period: "annual"  },
};

// ── Upsert user plan record ───────────────────────────────────────────────────
async function upsertUserPlan(
  userId: string,
  subscriptionId: string,
  customerId: string,
  priceId: string,
  status: string,
  periodEnd: number,
  couponId?: string | null,
) {
  const config = CS_PLAN_MAP[priceId];
  if (!config) {
    console.warn(`Unknown CS price ID: ${priceId} — skipping user_plans upsert`);
    return;
  }

  const resetDate = new Date(periodEnd * 1000).toISOString();
  const isEarlybird = couponId === "EARLYBIRD";

  // During a free trial the subscription status is "trialing" — give 3 free
  // generations only. When the trial ends and the first payment succeeds,
  // Stripe fires subscription.updated with status "active" and we upgrade.
  const isTrialing = status === "trialing";
  const generationsLimit = isTrialing ? 3 : config.gens;
  const planStatus = (status === "active" || status === "trialing") ? status : status;

  const { error } = await supabase.from("user_plans").upsert(
    {
      user_id:                userId,
      stripe_customer_id:     customerId,
      stripe_subscription_id: subscriptionId,
      stripe_price_id:        priceId,
      plan_tier:              config.tier,
      billing_period:         config.period,
      generations_limit:      generationsLimit,
      generations_reset_date: resetDate,
      status:                 planStatus,
      earlybird:              isEarlybird,
    },
    { onConflict: "user_id", ignoreDuplicates: false },
  );

  if (error) console.error("user_plans upsert error:", error.message);
  else console.log(`✓ user_plans updated: ${userId} → ${config.tier} (${config.period}) status=${planStatus} gens=${generationsLimit}`);
}

// ── Resolve Stripe customer → Supabase user_id ────────────────────────────────
async function getUserIdFromCustomer(customerId: string): Promise<string | null> {
  // First try user_plans table
  const { data } = await supabase
    .from("user_plans")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .single();
  if (data?.user_id) return data.user_id;

  // Fall back: look up Stripe customer email → auth.users directly via SQL
  try {
    const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
    if (customer.email) {
      const { data, error } = await supabase
        .rpc("get_user_id_by_email", { p_email: customer.email });
      if (!error && data) return data as string;
      // Last resort: paginated list (handles small user bases)
      const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000, page: 1 });
      const match = users.find(u => u.email === customer.email);
      if (match) return match.id;
    }
  } catch (e) {
    console.error("Error resolving customer to user:", e);
  }
  return null;
}

Deno.serve(async (req) => {
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  // Must read body as raw text before anything else for signature verification
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Webhook signature verification failed:", message);
    return new Response(`Webhook Error: ${message}`, { status: 400 });
  }

  // ── Creator Studio subscription events ─────────────────────────────────────
  if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated"
  ) {
    const sub = event.data.object as Stripe.Subscription;
    const priceId = sub.items.data[0]?.price?.id;
    const customerId = sub.customer as string;

    if (priceId && CS_PLAN_MAP[priceId]) {
      // Prefer user_id baked into subscription metadata (set at checkout time)
      const userId = (sub.metadata?.user_id as string | undefined) || await getUserIdFromCustomer(customerId);
      if (userId) {
        const couponId = (sub.discount?.coupon?.id) ?? null;
        await upsertUserPlan(
          userId,
          sub.id,
          customerId,
          priceId,
          sub.status,
          sub.current_period_end,
          couponId,
        );
      } else {
        console.warn(`Could not resolve customer ${customerId} to a user`);
      }
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    if (CS_PLAN_MAP[sub.items.data[0]?.price?.id]) {
      await supabase
        .from("user_plans")
        .update({ status: "canceled", plan_tier: "free", generations_limit: 0 })
        .eq("stripe_subscription_id", sub.id);
    }
  }

  // ── Topup: one-time payment succeeded ──────────────────────────────────────
  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object as Stripe.PaymentIntent;
    if (pi.metadata?.product_type === "topup") {
      const customerId = pi.customer as string;
      const userId = await getUserIdFromCustomer(customerId);
      if (userId) {
        // Get the user's current reset date for expiry
        const { data: plan } = await supabase
          .from("user_plans")
          .select("generations_reset_date")
          .eq("user_id", userId)
          .single();

        await supabase.from("generation_topups").insert({
          user_id: userId,
          stripe_payment_intent: pi.id,
          generations_added: 10,
          expires_at: plan?.generations_reset_date ?? null,
        });
        console.log(`✓ Topup +10 gens recorded for user ${userId}`);
      }
    }
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    // Handle agency payment method setup
    if (session.mode === "setup" && session.setup_intent) {
      try {
        const setupIntent = await stripe.setupIntents.retrieve(
          session.setup_intent as string,
        );
        const paymentMethodId = setupIntent.payment_method as string;

        if (paymentMethodId && session.customer) {
          // Set as default payment method on the customer
          await stripe.customers.update(session.customer as string, {
            invoice_settings: { default_payment_method: paymentMethodId },
          });

          // Save stripe_customer_id to the agencies table
          const agencyId = session.metadata?.agency_id;
          if (agencyId) {
            await fetch(`${supabaseUrl}/rest/v1/agencies?id=eq.${agencyId}`, {
              method: "PATCH",
              headers: {
                apikey: supabaseServiceKey,
                Authorization: `Bearer ${supabaseServiceKey}`,
                "Content-Type": "application/json",
                Prefer: "return=minimal",
              },
              body: JSON.stringify({ stripe_customer_id: session.customer }),
            });
            console.log(`Saved stripe_customer_id for agency ${agencyId}`);
          }
        }
      } catch (setupErr) {
        console.error("Failed to set default payment method:", setupErr);
      }
    }

    const hasAudit = session.metadata?.hasAudit === "true";

    if (hasAudit) {
      const customerEmail = session.customer_details?.email ?? "Unknown";
      const customerName = session.customer_details?.name ?? "A client";

      const emailHtml = `
        <div style="font-family: sans-serif; padding: 25px; border: 1px solid #eee; border-radius: 12px; max-width: 600px;">
          <h2 style="color: #f80d5d; margin-top: 0;">🎯 New Instagram Strategy Audit Purchased!</h2>
          <p style="font-size: 16px; color: #0b0d1f;">
            <strong>${customerName}</strong> just purchased the $79 Instagram Strategy Audit alongside their subscription.
          </p>
          <div style="background-color: #f8f9fa; padding: 16px; border-radius: 8px; margin-top: 16px; border-left: 4px solid #f80d5d;">
            <p style="margin: 0; font-size: 14px;"><strong>Customer email:</strong> ${customerEmail}</p>
            <p style="margin: 8px 0 0; font-size: 14px;"><strong>Stripe session:</strong> ${session.id}</p>
          </div>
          <p style="margin-top: 20px; font-size: 14px; color: #64748b;">
            Please complete their audit and deliver the written report within 48 hours.
          </p>
        </div>
      `;

      try {
        await fetch(`${supabaseUrl}/functions/v1/send-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            to: "jay@virallized.com",
            subject: `🎯 New Audit Purchase: ${customerEmail}`,
            html: emailHtml,
          }),
        });
      } catch (emailErr) {
        console.error("Failed to send audit notification email:", emailErr);
      }
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
});

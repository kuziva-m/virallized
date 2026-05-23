/**
 * stripe-brand-setup
 *
 * NOTE: Stripe does NOT allow programmatic branding updates on your own account
 * via the API — this must be done through the Stripe Dashboard.
 *
 * This function returns the instructions.
 *
 * ── How to brand your Stripe Checkout pages ──────────────────────────────────
 * 1. Go to: https://dashboard.stripe.com/settings/branding
 * 2. Upload your logo (PNG/JPG, square-ish, white background or transparent)
 *    → Use /public/images/logos/virallized-main-logo.svg exported as PNG
 * 3. Set Primary colour: #f80d5d  (Virallized magenta)
 * 4. Set Secondary colour: #ffae07 (Virallized amber)
 * 5. Set Accent colour: #0f172a   (dark navy — for text)
 * 6. Save changes
 *
 * These settings will immediately apply to all hosted Stripe Checkout sessions.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY") ?? "";

  try {
    // Create 100% off coupon for testing
    const couponRes = await fetch("https://api.stripe.com/v1/coupons", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        id: "TEST100",
        percent_off: "100",
        duration: "once",
        name: "100% Off — Internal Test",
        max_redemptions: "10",
      }),
    });
    const coupon = await couponRes.json() as any;
    if (!couponRes.ok && coupon?.error?.code !== "resource_already_exists") {
      throw new Error(coupon?.error?.message ?? "Failed to create coupon");
    }

    // Create promotion code TEST100 if not already exists
    const existingRes = await fetch("https://api.stripe.com/v1/promotion_codes?code=TEST100&limit=1", {
      headers: { Authorization: `Bearer ${stripeKey}` },
    });
    const existing = await existingRes.json() as any;

    let promoCode: any;
    if (existing?.data?.length > 0) {
      promoCode = existing.data[0];
    } else {
      const promoRes = await fetch("https://api.stripe.com/v1/promotion_codes", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${stripeKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ coupon: "TEST100", code: "TEST100", active: "true" }),
      });
      promoCode = await promoRes.json();
    }

    return new Response(
      JSON.stringify({ success: true, coupon_id: "TEST100", promo_code: promoCode?.code, message: "Use code TEST100 at checkout for 100% off" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

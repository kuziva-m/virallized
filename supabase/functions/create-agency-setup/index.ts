import Stripe from "npm:stripe@17";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "");
const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

const SITE_URL = "https://virallized.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    const { data: agency, error: agencyErr } = await supabase
      .from("agencies")
      .select("id, email, company_name, stripe_customer_id")
      .eq("user_id", user.id)
      .single();

    if (agencyErr || !agency) throw new Error("Agency not found");

    // Create Stripe customer if not yet created
    let customerId = agency.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: agency.email ?? user.email,
        name: agency.company_name ?? undefined,
        metadata: { agency_id: agency.id, supabase_user_id: user.id },
      });
      customerId = customer.id;
      await supabase
        .from("agencies")
        .update({ stripe_customer_id: customerId })
        .eq("id", agency.id);
    }

    // Checkout session in setup mode to capture payment method
    const session = await stripe.checkout.sessions.create({
      mode: "setup",
      customer: customerId,
      currency: "usd",
      success_url: `${SITE_URL}/agency-dashboard?payment_setup=success`,
      cancel_url:  `${SITE_URL}/agency-dashboard`,
      metadata: { agency_id: agency.id },
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("create-agency-setup error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
    );
  }
});

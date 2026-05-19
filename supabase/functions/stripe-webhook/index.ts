import Stripe from "npm:stripe@17";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "");
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

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

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
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

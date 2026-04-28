const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await req.json();

    // Variables to handle list updates and signups
    const { eventType, plan, clientName, igHandle, listType, action, item } =
      payload;

    if (!RESEND_API_KEY) {
      throw new Error("Missing RESEND_API_KEY");
    }

    let finalSubject = "";
    let finalHtml = "";

    // 1. ROUTER: Check what kind of email we are sending
    if (eventType === "update") {
      // --- THE TARGETING UPDATE EMAIL ---
      finalSubject = `Update: ${clientName} ${action} a ${listType}`;

      // Make the action pop visually (Green for added, Red for removed)
      const actionColor =
        action.toLowerCase() === "added" ? "#10b981" : "#ef4444";

      finalHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 30px; max-width: 600px; background-color: #f8fafc; border-radius: 12px;">
          <h2 style="color: #0f172a; margin-top: 0;">Targeting Update 🎯</h2>
          <div style="background-color: white; padding: 24px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <p style="margin: 0; font-size: 16px;">
              <strong>${clientName}</strong> (@${igHandle}) has <span style="color: ${actionColor}; font-weight: bold;">${action}</span> <strong>${item}</strong> as a ${listType}.
            </p>
          </div>
        </div>
      `;
    } else {
      // --- THE NEW SIGNUP EMAIL ---
      finalSubject = `New IG signup ${plan || "Unknown"}`;
      finalHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 30px; max-width: 600px; background-color: #ffefe9; border-radius: 12px;">
          <h2 style="color: #f80d5d; margin-top: 0;">New Client Alert 🚀</h2>
          <div style="background-color: white; padding: 24px; border-radius: 8px; border: 1px solid #fda6e1;">
            <p style="margin: 0 0 12px 0; font-size: 16px;"><strong>Name:</strong> ${clientName}</p>
            <p style="margin: 0 0 12px 0; font-size: 16px;"><strong>IG Handle:</strong> @${igHandle}</p>
            <p style="margin: 0; font-size: 16px;"><strong>Plan Purchased:</strong> $${plan}</p>
          </div>
          <p style="margin-top: 24px; font-size: 14px; color: #4b5563;">
            Log into the <a href="https://virallized.com/admin" style="color: #f80d5d; font-weight: bold;">Virallized Command Center</a> to view their full targeting details.
          </p>
        </div>
      `;
    }

    // 2. Send to Resend
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Virallized Alerts <onboarding@virallized.com>", // Make sure this domain is verified in Resend!
        to: ["jay@virallized.com"], // Where you want the alerts delivered
        subject: finalSubject,
        html: finalHtml,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

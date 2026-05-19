const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

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
    const payload = await req.json();

    if (!RESEND_API_KEY) {
      throw new Error("Missing RESEND_API_KEY");
    }

    // ======================================================
    // ROUTE 1: Direct emails from Dashboard / Canceled Leads
    // Expected payload: { to, subject, html }
    // ======================================================
    if (payload.to && payload.subject && payload.html) {
      const to = Array.isArray(payload.to) ? payload.to : [payload.to];

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Jay <jay@virallized.com>", // 🚨 CHANGED SENDER TO JAY
          to,
          subject: payload.subject,
          html: payload.html,
          reply_to: payload.reply_to || "jay@virallized.com", // 🚨 REPLIES GO TO JAY
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Resend direct email failed:", data);
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }

      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // ======================================================
    // ROUTE 2: Legacy targeting update alerts
    // Expected payload: { eventType: "update", clientName, igHandle, listType, action, item }
    // ======================================================
    if (payload.eventType === "update") {
      const { clientName, igHandle, listType, action, item } = payload;

      const finalSubject = `Update: ${clientName || "Client"} ${
        action || "updated"
      } a ${listType || "list item"}`;

      const actionColor =
        String(action).toLowerCase() === "added" ? "#10b981" : "#ef4444";

      const finalHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 30px; max-width: 600px; background-color: #f8fafc; border-radius: 12px;">
          <h2 style="color: #0f172a; margin-top: 0;">Targeting Update 🎯</h2>
          <div style="background-color: white; padding: 24px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <p style="margin: 0; font-size: 16px;">
              <strong>${clientName || "A client"}</strong> (@${igHandle || "unknown"}) has 
              <span style="color: ${actionColor}; font-weight: bold;">${action || "updated"}</span> 
              <strong>${item || "an item"}</strong> as a ${listType || "list item"}.
            </p>
          </div>
        </div>
      `;

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Virallized Alerts <support@virallized.com>",
          to: ["jay@virallized.com"],
          subject: finalSubject,
          html: finalHtml,
          reply_to: "support@virallized.com",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Resend update alert failed:", data);
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }

      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // ======================================================
    // ROUTE 3: Legacy signup alert fallback
    // Expected payload: { plan, clientName, igHandle }
    // ======================================================
    if (payload.plan && payload.clientName && payload.igHandle) {
      const { plan, clientName, igHandle } = payload;

      const finalSubject = `New IG signup ${plan || "Unknown"}`;

      const finalHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 30px; max-width: 600px; background-color: #ffefe9; border-radius: 12px;">
          <h2 style="color: #f80d5d; margin-top: 0;">New Client Alert 🚀</h2>
          <div style="background-color: white; padding: 24px; border-radius: 8px; border: 1px solid #fda6e1;">
            <p style="margin: 0 0 12px 0; font-size: 16px;"><strong>Name:</strong> ${clientName || "Unknown"}</p>
            <p style="margin: 0 0 12px 0; font-size: 16px;"><strong>IG Handle:</strong> @${String(igHandle || "unknown").replace(/^@/, "")}</p>
            <p style="margin: 0; font-size: 16px;"><strong>Plan Purchased:</strong> ${plan || "Unknown"}</p>
          </div>
          <p style="margin-top: 24px; font-size: 14px; color: #4b5563;">
            Log into the <a href="https://virallized.com/admin" style="color: #f80d5d; font-weight: bold;">Virallized Command Center</a> to view their full targeting details.
          </p>
        </div>
      `;

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Virallized Alerts <support@virallized.com>",
          to: ["jay@virallized.com"],
          subject: finalSubject,
          html: finalHtml,
          reply_to: "support@virallized.com",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Resend signup alert failed:", data);
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }

      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ error: "Invalid email payload" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";

    console.error("send-email function error:", message);

    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

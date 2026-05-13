const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await req.json();

    if (!RESEND_API_KEY) {
      throw new Error(
        "Missing RESEND_API_KEY. Did you set it in Supabase secrets?",
      );
    }

    // =====================================================================
    // ROUTE 1: LEGACY TARGETING UPDATES
    // Keeps your old targeting alerts working
    // =====================================================================
    if (payload.eventType === "update") {
      const { clientName, igHandle, listType, action, item } = payload;

      const finalSubject = `Update: ${clientName} ${action} a ${listType}`;
      const actionColor =
        String(action).toLowerCase() === "added" ? "#10b981" : "#ef4444";

      const finalHtml = `
        <div style="font-family: sans-serif; padding: 30px; max-width: 600px; background-color: #f8fafc; border-radius: 12px;">
          <h2 style="color: #0f172a; margin-top: 0;">Targeting Update 🎯</h2>
          <div style="background-color: white; padding: 24px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <p style="margin: 0; font-size: 16px;">
              <strong>${clientName}</strong> (@${igHandle}) has 
              <span style="color: ${actionColor}; font-weight: bold;">${action}</span> 
              <strong>${item}</strong> as a ${listType}.
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
          to: "virallizedhost@gmail.com",
          subject: finalSubject,
          html: finalHtml,
          reply_to: "support@virallized.com",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || "Failed to send email.");
      }

      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // =====================================================================
    // ROUTE 2: DYNAMIC HTML INJECTION
    // Admin emails, analyzer lead emails, setup emails, and broadcasts
    // =====================================================================
    if (payload.to && payload.subject && payload.html) {
      const {
        to,
        subject,
        html,
        reply_to = "support@virallized.com",
      } = payload;

      // SCENARIO A: Batch / mass broadcast
      if (Array.isArray(to)) {
        const emailPayload = to.map((email: string) => ({
          from: "Virallized Support <support@virallized.com>",
          to: [email],
          subject,
          html,
          reply_to,
        }));

        const res = await fetch("https://api.resend.com/emails/batch", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify(emailPayload),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(
            data.message || data.error || "Failed to send batch email.",
          );
        }

        return new Response(JSON.stringify({ success: true, data }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      // SCENARIO B: Single email
      // This is what your Analyzer Lead email uses.
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Virallized Support <support@virallized.com>",
          to,
          subject,
          html,
          reply_to,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || "Failed to send email.");
      }

      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // =====================================================================
    // ERROR: INVALID PAYLOAD
    // =====================================================================
    throw new Error(
      "Invalid payload. Missing 'eventType' for updates, or 'to/subject/html' for emails.",
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";

    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

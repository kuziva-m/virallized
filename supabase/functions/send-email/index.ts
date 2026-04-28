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

    if (!RESEND_API_KEY) {
      throw new Error(
        "Missing RESEND_API_KEY. Did you set it in Supabase secrets?",
      );
    }

    // =====================================================================
    // ROUTE 1: LEGACY TARGETING UPDATES (Keeps your old targeting alerts working)
    // =====================================================================
    if (payload.eventType === "update") {
      const { clientName, igHandle, listType, action, item } = payload;

      const finalSubject = `Update: ${clientName} ${action} a ${listType}`;
      const actionColor =
        action.toLowerCase() === "added" ? "#10b981" : "#ef4444";
      const finalHtml = `
        <div style="font-family: sans-serif; padding: 30px; max-width: 600px; background-color: #f8fafc; border-radius: 12px;">
          <h2 style="color: #0f172a; margin-top: 0;">Targeting Update 🎯</h2>
          <div style="background-color: white; padding: 24px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <p style="margin: 0; font-size: 16px;">
              <strong>${clientName}</strong> (@${igHandle}) has <span style="color: ${actionColor}; font-weight: bold;">${action}</span> <strong>${item}</strong> as a ${listType}.
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
          from: "Virallized Alerts <onboarding@virallized.com>",
          to: "virallizedhost@gmail.com", // Sent to your admin inbox
          subject: finalSubject,
          html: finalHtml,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      return new Response(JSON.stringify({ success: true, data }), {
        headers: corsHeaders,
        status: 200,
      });
    }

    // =====================================================================
    // ROUTE 2: DYNAMIC HTML INJECTION (Admin Alerts & Command Center Broadcasts)
    // =====================================================================
    else if (payload.to && payload.subject && payload.html) {
      const { to, subject, html } = payload;

      // SCENARIO A: Command Center Mass Broadcast (If 'to' is an array of emails)
      if (Array.isArray(to)) {
        const emailPayload = to.map((email: string) => ({
          from: "Virallized Support <support@virallized.com>",
          to: [email],
          subject: subject,
          html: html,
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
        if (!res.ok) throw new Error(data.message);
        return new Response(JSON.stringify({ success: true, data }), {
          headers: corsHeaders,
          status: 200,
        });
      }

      // SCENARIO B: New Setup Page Alert (If 'to' is a single string email)
      else {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "Virallized Alerts <onboarding@virallized.com>",
            to: to, // Sends to whichever email you put in the React code
            subject: subject,
            html: html,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        return new Response(JSON.stringify({ success: true, data }), {
          headers: corsHeaders,
          status: 200,
        });
      }
    }

    // =====================================================================
    // ERROR: INVALID PAYLOAD
    // =====================================================================
    else {
      throw new Error(
        "Invalid payload. Missing 'eventType' for updates, or 'to/subject/html' for emails.",
      );
    }
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

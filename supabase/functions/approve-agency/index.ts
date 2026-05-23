const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

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
    const { agencyId, discountPercent, tempPassword } = await req.json();

    if (!agencyId || tempPassword === undefined) {
      throw new Error("Missing required fields: agencyId, tempPassword");
    }

    // Default to tier 1 (20%) — auto-upgrades as they add clients
    const resolvedDiscount = discountPercent ?? 20;

    // 1. Fetch agency record
    const agencyRes = await fetch(
      `${supabaseUrl}/rest/v1/agencies?id=eq.${agencyId}&select=*`,
      {
        headers: {
          apikey: supabaseServiceKey,
          Authorization: `Bearer ${supabaseServiceKey}`,
        },
      },
    );
    const agencies = await agencyRes.json();
    const agency = agencies[0];

    if (!agency) {
      throw new Error(`Agency ${agencyId} not found`);
    }

    // 2. Find or create Supabase auth user
    let userId: string;

    // Try to create the user first
    const createUserRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: "POST",
      headers: {
        apikey: supabaseServiceKey,
        Authorization: `Bearer ${supabaseServiceKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: agency.email,
        password: tempPassword,
        email_confirm: true,
      }),
    });

    const newUser = await createUserRes.json();

    if (createUserRes.ok) {
      // Fresh user created
      userId = newUser.id;
    } else {
      // User likely already exists — list users and find by email
      console.log("Create user failed:", JSON.stringify(newUser));

      const listRes = await fetch(
        `${supabaseUrl}/auth/v1/admin/users?page=1&per_page=1000`,
        {
          headers: {
            apikey: supabaseServiceKey,
            Authorization: `Bearer ${supabaseServiceKey}`,
          },
        },
      );
      const listJson = await listRes.json();
      console.log("List users status:", listRes.status);

      const userList: Array<{ id: string; email: string }> =
        listJson.users ?? listJson ?? [];
      const existingUser = userList.find(
        (u) => u.email === agency.email,
      );

      if (existingUser) {
        userId = existingUser.id;
        // Update password so they can log in with the new temp password
        const updatePwRes = await fetch(
          `${supabaseUrl}/auth/v1/admin/users/${userId}`,
          {
            method: "PUT",
            headers: {
              apikey: supabaseServiceKey,
              Authorization: `Bearer ${supabaseServiceKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ password: tempPassword, email_confirm: true }),
          },
        );
        if (!updatePwRes.ok) {
          const pwErr = await updatePwRes.json();
          throw new Error(
            `Failed to update password: ${pwErr.msg || pwErr.message || pwErr.error || JSON.stringify(pwErr)}`,
          );
        }
      } else {
        // Truly failed — surface the real error
        throw new Error(
          newUser.msg || newUser.message || newUser.error || JSON.stringify(newUser),
        );
      }
    }

    // 3. Update agency record with approval details
    const updateRes = await fetch(
      `${supabaseUrl}/rest/v1/agencies?id=eq.${agencyId}`,
      {
        method: "PATCH",
        headers: {
          apikey: supabaseServiceKey,
          Authorization: `Bearer ${supabaseServiceKey}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          status: "approved",
          discount_percent: resolvedDiscount,
          user_id: userId,
          approved_at: new Date().toISOString(),
        }),
      },
    );

    if (!updateRes.ok) {
      const updateErr = await updateRes.text();
      throw new Error(`Failed to update agency: ${updateErr}`);
    }

    // 4. Send "your dashboard is ready" email to agency
    const emailHtml = `
      <div style="font-family: sans-serif; padding: 32px; max-width: 600px; background-color: #fafafa; border-radius: 16px;">
        <div style="height: 4px; background: linear-gradient(to right, #ffae07, #ff2429, #f1078d); border-radius: 4px; margin-bottom: 28px;"></div>
        <h1 style="color: #0f172a; font-size: 24px; font-weight: 900; margin: 0 0 8px;">Your Agency Dashboard is Ready 🚀</h1>
        <p style="color: #64748b; font-size: 15px; margin: 0 0 28px;">Hi ${agency.contact_name || agency.company_name}, welcome to Virallized Partner Program!</p>

        <div style="background: white; border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
          <p style="margin: 0 0 12px; font-size: 14px; color: #0f172a;"><strong>Your login credentials:</strong></p>
          <p style="margin: 0 0 6px; font-size: 14px; color: #475569;">Email: <strong>${agency.email}</strong></p>
          <p style="margin: 0; font-size: 14px; color: #475569;">Temporary Password: <strong style="font-family: monospace; background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">${tempPassword}</strong></p>
        </div>

        <div style="background: #fff1f2; border-radius: 12px; padding: 20px; border: 1px solid #fda6e1; margin-bottom: 28px;">
          <p style="margin: 0; font-size: 13px; color: #9f1239; font-weight: 700;">⚡ You start at ${resolvedDiscount}% off — your discount grows automatically as you add more clients.</p>
        </div>

        <p style="font-size: 14px; color: #64748b; margin: 0 0 8px;">To get started:</p>
        <ol style="color: #64748b; font-size: 14px; margin: 0 0 28px; padding-left: 20px; line-height: 2;">
          <li>Log in to your agency dashboard</li>
          <li>Set up your payment method (one-time setup)</li>
          <li>Add your first client account</li>
          <li>Check the payment authorization box to activate their subscription</li>
        </ol>

        <a href="https://virallized.com/agency-dashboard" style="display: inline-block; background: linear-gradient(to right, #ffae07, #ff2429, #f1078d); color: white; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 900; font-size: 14px;">
          Access My Dashboard →
        </a>

        <p style="color: #94a3b8; font-size: 12px; margin-top: 28px;">
          Please change your password after your first login. If you have any questions reply to this email and we'll be happy to help.
        </p>
      </div>
    `;

    await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        to: agency.email,
        subject: "Your Virallized Agency Dashboard is Ready 🚀",
        html: emailHtml,
        reply_to: "support@virallized.com",
      }),
    });

    return new Response(
      JSON.stringify({ success: true, userId }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("approve-agency error:", message);

    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

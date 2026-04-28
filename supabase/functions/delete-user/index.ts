// deno-lint-ignore no-import-prefix
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // We only want to process POST requests
    if (req.method !== "POST") {
      throw new Error("Method not allowed");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    // Initialize the client with the Service Role Key (Admin privileges)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract the user ID sent from the frontend
    const { userId } = await req.json();

    if (!userId) {
      throw new Error("User ID is required.");
    }

    // 1. Delete from the Auth schema (This is the crucial part)
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);

    if (authError) {
      throw authError;
    }

    // Note: If you have foreign key constraints set to "ON DELETE CASCADE" in your database,
    // deleting the Auth user will automatically delete the row in the 'clients' table.
    // If not, we manually delete it here just to be safe.
    await supabase.from("clients").delete().eq("id", userId);

    return new Response(
      JSON.stringify({ success: true, message: "User completely deleted." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: msg }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

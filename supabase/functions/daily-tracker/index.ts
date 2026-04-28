// deno-lint-ignore no-import-prefix
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// 1. Initialize Supabase with the ADMIN key (bypasses RLS perfectly)
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

Deno.serve(async (req) => {
  try {
    // 1. Check if a specific client ID was passed (e.g., from Setup.tsx)
    const payload =
      req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const targetClientId = payload?.clientId;

    if (targetClientId) {
      console.log(`Running targeted Day 1 track for client: ${targetClientId}`);
    } else {
      console.log("Running full daily batch track for all clients...");
    }

    // 2. Fetch clients (Either just the new user, or everyone)
    let query = supabase.from("clients").select("id, ig_handle");

    if (targetClientId) {
      query = query.eq("id", targetClientId);
    }

    const { data: clients, error: clientError } = await query;

    if (clientError) {
      console.error("Failed to fetch clients:", clientError);
      throw clientError;
    }

    console.log(`Found ${clients?.length || 0} client(s) to process.`);

    // 3. Loop through the result
    for (const client of clients || []) {
      if (!client.ig_handle) continue;

      const cleanHandle = client.ig_handle.replace("@", "").trim();
      console.log(`Fetching data for @${cleanHandle}...`);

      let followersCount = 0;
      let engagementRate = 0;

      // 4. Ping Instagram Looter
      try {
        const response = await fetch(
          `https://instagram-looter2.p.rapidapi.com/profile?username=${cleanHandle}`,
          {
            method: "GET",
            headers: {
              "x-rapidapi-host": "instagram-looter2.p.rapidapi.com",
              "x-rapidapi-key":
                "f54a5ef69dmsh9c37b97a8ae81f8p1ee666jsn6fc899090819", // Remember to cycle this later!
            },
          },
        );

        const apiData = await response.json();

        // Log the raw response if it fails so we can debug later
        if (!response.ok || apiData.message) {
          console.error(`RapidAPI Error for ${cleanHandle}:`, apiData);
        }

        // 5. Extract data safely
        followersCount =
          apiData?.followers ??
          apiData?.edge_followed_by?.count ??
          apiData?.data?.user?.edge_followed_by?.count ??
          0;

        engagementRate = apiData?.engagement_rate ?? 0;

        console.log(`Result for @${cleanHandle}: ${followersCount} followers.`);
      } catch (apiError) {
        console.error(`Fetch request crashed for @${cleanHandle}:`, apiError);
      }

      // 6. Save to database (ALWAYS INSERT, EVEN IF 0)
      const { error: insertError } = await supabase
        .from("growth_metrics")
        .insert({
          client_id: client.id,
          followers: followersCount,
          // engagement_rate: engagementRate, // Uncomment if you created this column in your DB
        });

      if (insertError) {
        console.error(
          `Database Insert Failed for @${cleanHandle}:`,
          insertError,
        );
      } else {
        console.log(`Successfully saved row for @${cleanHandle}.`);
      }
    }

    console.log("Tracking run complete!");
    return new Response(
      JSON.stringify({ success: true, message: "Tracking complete!" }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("Fatal function error:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
    });
  }
});

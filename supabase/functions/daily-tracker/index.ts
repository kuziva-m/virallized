// deno-lint-ignore no-import-prefix
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const rapidApiKey = Deno.env.get("RAPIDAPI_KEY") ?? "";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const RAPIDAPI_HOST = "instagram-scraper-stable-api.p.rapidapi.com";
const ACCOUNT_DATA_ENDPOINT =
  "https://instagram-scraper-stable-api.p.rapidapi.com/ig_get_fb_profile_v3.php";

const toNumber = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const cleaned = value
      .replace(/,/g, "")
      .replace(/%/g, "")
      .trim()
      .toLowerCase();

    if (cleaned.endsWith("k")) {
      const parsed = Number(cleaned.replace("k", ""));
      return Number.isFinite(parsed) ? Math.round(parsed * 1000) : 0;
    }

    if (cleaned.endsWith("m")) {
      const parsed = Number(cleaned.replace("m", ""));
      return Number.isFinite(parsed) ? Math.round(parsed * 1000000) : 0;
    }

    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

const normalizeHandle = (handle?: string | null): string => {
  return handle?.replace(/^@/, "").trim() || "";
};

const parseApiResponse = async (response: Response, label: string) => {
  const text = await response.text();

  if (!response.ok) {
    console.error(`${label} failed with status ${response.status}:`, text);
    throw new Error(`${label} failed with status ${response.status}`);
  }

  try {
    return JSON.parse(text);
  } catch {
    console.error(`${label} returned non-JSON:`, text);
    throw new Error(`${label} returned an invalid JSON response.`);
  }
};

const fetchAccountData = async (cleanHandle: string) => {
  if (!rapidApiKey) {
    throw new Error("Missing RAPIDAPI_KEY. Set it in Supabase secrets.");
  }

  const response = await fetch(ACCOUNT_DATA_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "x-rapidapi-host": RAPIDAPI_HOST,
      "x-rapidapi-key": rapidApiKey,
    },
    body: new URLSearchParams({
      username_or_url: cleanHandle,
    }),
  });

  const apiData = await parseApiResponse(response, "Account Data V2 API");

  const followersCount = toNumber(
    apiData?.follower_count ??
      apiData?.followers_count ??
      apiData?.followers ??
      apiData?.edge_followed_by?.count ??
      apiData?.data?.follower_count ??
      apiData?.data?.user?.follower_count ??
      apiData?.data?.user?.edge_followed_by?.count,
  );

  const engagementRate = toNumber(
    apiData?.engagement_rate ??
      apiData?.engagementRate ??
      apiData?.data?.engagement_rate ??
      apiData?.data?.user?.engagement_rate,
  );

  const username =
    apiData?.username ||
    apiData?.data?.username ||
    apiData?.data?.user?.username ||
    cleanHandle;

  return {
    username,
    followersCount,
    engagementRate,
    raw: apiData,
  };
};

Deno.serve(async (req) => {
  try {
    const payload =
      req.method === "POST" ? await req.json().catch(() => ({})) : {};

    const targetClientId = payload?.clientId;

    if (targetClientId) {
      console.log(`Running targeted tracker for client: ${targetClientId}`);
    } else {
      console.log("Running full daily batch tracker for all clients...");
    }

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

    const results: {
      client_id: string;
      ig_handle: string;
      status: "saved" | "skipped" | "failed";
      followers?: number;
      engagement_rate?: number;
      reason?: string;
    }[] = [];

    for (const client of clients || []) {
      const cleanHandle = normalizeHandle(client.ig_handle);

      if (!cleanHandle) {
        results.push({
          client_id: client.id,
          ig_handle: "",
          status: "skipped",
          reason: "Missing Instagram handle",
        });
        continue;
      }

      console.log(`Fetching Account Data V2 for @${cleanHandle}...`);

      try {
        const { followersCount, engagementRate } =
          await fetchAccountData(cleanHandle);

        if (!followersCount || followersCount <= 0) {
          console.warn(
            `Skipping @${cleanHandle}: API returned invalid follower count.`,
          );

          results.push({
            client_id: client.id,
            ig_handle: cleanHandle,
            status: "skipped",
            followers: followersCount,
            engagement_rate: engagementRate || 0,
            reason: "Invalid follower count returned by API",
          });

          continue;
        }

        const { error: insertError } = await supabase
          .from("growth_metrics")
          .insert({
            client_id: client.id,
            followers: followersCount,
            engagement_rate: Number.isFinite(engagementRate)
              ? engagementRate
              : 0,
          });

        if (insertError) {
          console.error(
            `Database insert failed for @${cleanHandle}:`,
            insertError,
          );

          results.push({
            client_id: client.id,
            ig_handle: cleanHandle,
            status: "failed",
            followers: followersCount,
            engagement_rate: engagementRate || 0,
            reason: insertError.message,
          });

          continue;
        }

        console.log(
          `Saved @${cleanHandle}: ${followersCount} followers, ${engagementRate || 0}% engagement.`,
        );

        results.push({
          client_id: client.id,
          ig_handle: cleanHandle,
          status: "saved",
          followers: followersCount,
          engagement_rate: engagementRate || 0,
        });
      } catch (apiError) {
        const message =
          apiError instanceof Error ? apiError.message : String(apiError);

        console.error(`Tracking failed for @${cleanHandle}:`, message);

        results.push({
          client_id: client.id,
          ig_handle: cleanHandle,
          status: "failed",
          reason: message,
        });
      }
    }

    console.log("Tracking run complete.");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Tracking complete.",
        processed: results.length,
        saved: results.filter((result) => result.status === "saved").length,
        skipped: results.filter((result) => result.status === "skipped").length,
        failed: results.filter((result) => result.status === "failed").length,
        results,
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);

    console.error("Fatal function error:", errorMessage);

    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});

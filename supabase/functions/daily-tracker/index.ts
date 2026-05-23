import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const rapidApiKey = Deno.env.get("RAPIDAPI_KEY") ?? "";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const RAPIDAPI_HOST = "instagram-scraper-stable-api.p.rapidapi.com";
const BASE_URL = `https://${RAPIDAPI_HOST}`;

// ── Endpoint URLs ─────────────────────────────────────────────────────────────
const ACCOUNT_DATA_ENDPOINT = `${BASE_URL}/ig_get_fb_profile_v3.php`;
const USER_POSTS_ENDPOINT   = `${BASE_URL}/get_ig_user_posts.php`;
const USER_REELS_ENDPOINT   = `${BASE_URL}/get_ig_user_reels.php`;
// ─────────────────────────────────────────────────────────────────────────────

const BATCH_SIZE = 5; // clients processed in parallel per batch

// ── Helpers ───────────────────────────────────────────────────────────────────

const toNumber = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/,/g, "").replace(/%/g, "").trim().toLowerCase();
    if (cleaned.endsWith("k")) return Math.round(Number(cleaned.replace("k", "")) * 1000);
    if (cleaned.endsWith("m")) return Math.round(Number(cleaned.replace("m", "")) * 1_000_000);
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const normalizeHandle = (handle?: string | null): string =>
  handle?.replace(/^@/, "").trim() || "";

const rapidPost = async (url: string, handle: string): Promise<unknown> => {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "x-rapidapi-host": RAPIDAPI_HOST,
      "x-rapidapi-key": rapidApiKey,
    },
    body: new URLSearchParams({ username_or_url: handle }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  const text = await res.text();
  try { return JSON.parse(text); } catch { throw new Error(`Non-JSON from ${url}`); }
};

// ── Per-client data fetchers ──────────────────────────────────────────────────

const fetchAccountData = async (handle: string) => {
  const d = await rapidPost(ACCOUNT_DATA_ENDPOINT, handle) as Record<string, unknown>;

  const followers = toNumber(
    d?.follower_count ?? d?.followers_count ?? d?.followers ??
    (d?.edge_followed_by as any)?.count ?? (d?.data as any)?.follower_count ??
    (d?.data as any)?.user?.follower_count,
  );
  const following = toNumber(
    d?.following_count ?? d?.follow_count ??
    (d?.edge_follow as any)?.count ?? (d?.data as any)?.following_count,
  );
  const postCount = toNumber(
    d?.media_count ?? d?.post_count ??
    (d?.edge_owner_to_timeline_media as any)?.count ?? (d?.data as any)?.media_count,
  );
  return { followers, following, postCount };
};

const fetchPostStats = async (handle: string): Promise<{ avgLikes: number; avgComments: number }> => {
  try {
    const d = await rapidPost(USER_POSTS_ENDPOINT, handle) as Record<string, unknown>;
    // Response: { posts: [ { node: { like_count, comment_count, ... } } ] }
    const items: unknown[] = (d as any)?.posts ?? [];

    if (!Array.isArray(items) || items.length === 0) return { avgLikes: 0, avgComments: 0 };

    const recent = items.slice(0, 12) as Record<string, unknown>[];
    const avgLikes    = recent.reduce((s, p) => s + toNumber((p as any)?.node?.like_count), 0) / recent.length;
    const avgComments = recent.reduce((s, p) => s + toNumber((p as any)?.node?.comment_count), 0) / recent.length;

    return { avgLikes: Math.round(avgLikes), avgComments: Math.round(avgComments) };
  } catch (e) {
    console.warn(`Post stats unavailable for @${handle}:`, (e as Error).message);
    return { avgLikes: 0, avgComments: 0 };
  }
};

const fetchReelStats = async (handle: string): Promise<{ avgReelPlays: number }> => {
  try {
    const d = await rapidPost(USER_REELS_ENDPOINT, handle) as Record<string, unknown>;
    // Response: { reels: [ { node: { media: { play_count, like_count, comment_count } } } ] }
    const items: unknown[] = (d as any)?.reels ?? [];

    if (!Array.isArray(items) || items.length === 0) return { avgReelPlays: 0 };

    const recent = items.slice(0, 12) as Record<string, unknown>[];
    const avgReelPlays = recent.reduce((s, r) => s + toNumber((r as any)?.node?.media?.play_count), 0) / recent.length;

    return { avgReelPlays: Math.round(avgReelPlays) };
  } catch (e) {
    console.warn(`Reel stats unavailable for @${handle}:`, (e as Error).message);
    return { avgReelPlays: 0 };
  }
};

// ── Process a single client ───────────────────────────────────────────────────

type ClientResult = {
  client_id: string;
  ig_handle: string;
  status: "saved" | "skipped" | "failed";
  followers?: number;
  reason?: string;
};

const processClient = async (client: { id: string; ig_handle: string }): Promise<ClientResult> => {
  const cleanHandle = normalizeHandle(client.ig_handle);

  if (!cleanHandle) {
    return { client_id: client.id, ig_handle: "", status: "skipped", reason: "Missing handle" };
  }

  try {
    // Always fetch account data (required)
    const { followers, following, postCount } = await fetchAccountData(cleanHandle);

    if (!followers || followers <= 0) {
      console.warn(`Skipping @${cleanHandle}: invalid follower count (${followers})`);
      return { client_id: client.id, ig_handle: cleanHandle, status: "skipped", reason: "Invalid follower count" };
    }

    // Fetch post & reel stats (best-effort — failures don't block saving)
    const [postStats, reelStats] = await Promise.all([
      fetchPostStats(cleanHandle),
      fetchReelStats(cleanHandle),
    ]);

    // Calculate engagement rate from actual post data: (likes + comments) / followers * 100
    const engagementRate = followers > 0 && (postStats.avgLikes + postStats.avgComments) > 0
      ? Number(((postStats.avgLikes + postStats.avgComments) / followers * 100).toFixed(4))
      : null;

    const { error } = await supabase
      .from("growth_metrics")
      .upsert(
        {
          client_id:       client.id,
          followers,
          following_count: following   || null,
          post_count:      postCount   || null,
          engagement_rate: engagementRate,
          avg_likes:       postStats.avgLikes    || null,
          avg_comments:    postStats.avgComments || null,
          avg_reel_plays:  reelStats.avgReelPlays || null,
        },
        { onConflict: "client_id,recorded_at", ignoreDuplicates: false },
      );

    if (error) {
      console.error(`DB upsert failed for @${cleanHandle}:`, error);
      return { client_id: client.id, ig_handle: cleanHandle, status: "failed", followers, reason: error.message };
    }

    console.log(`✓ @${cleanHandle}: ${followers} followers, ${following} following, ${postStats.avgLikes} avg likes, ${reelStats.avgReelPlays} avg reel plays`);
    return { client_id: client.id, ig_handle: cleanHandle, status: "saved", followers };

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`Failed @${cleanHandle}:`, msg);
    return { client_id: client.id, ig_handle: cleanHandle, status: "failed", reason: msg };
  }
};

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const payload = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const targetClientId: string | undefined = payload?.clientId;

    console.log(targetClientId
      ? `Targeted tracker: client ${targetClientId}`
      : `Full batch tracker starting...`
    );

    // When doing a full batch run, skip clients already processed today
    // so repeated runs make forward progress instead of re-processing the same clients
    let query = supabase.from("clients").select("id, ig_handle");
    if (targetClientId) {
      query = query.eq("id", targetClientId);
    } else {
      // Fetch client IDs already updated today
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { data: alreadyDone } = await supabase
        .from("growth_metrics")
        .select("client_id")
        .gte("recorded_at", todayStart.toISOString());

      const doneIds = (alreadyDone ?? []).map((r: { client_id: string }) => r.client_id);
      if (doneIds.length > 0) {
        console.log(`Skipping ${doneIds.length} clients already processed today`);
        query = query.not("id", "in", `(${doneIds.map(id => `"${id}"`).join(",")})`);
      }
    }

    const { data: clients, error: clientError } = await query;
    if (clientError) throw clientError;

    const allClients = clients ?? [];
    console.log(`Processing ${allClients.length} client(s) in batches of ${BATCH_SIZE}`);

    const allResults: ClientResult[] = [];

    // Process in parallel batches to avoid timeouts
    for (let i = 0; i < allClients.length; i += BATCH_SIZE) {
      const batch = allClients.slice(i, i + BATCH_SIZE);
      const settled = await Promise.allSettled(batch.map(processClient));

      for (const outcome of settled) {
        if (outcome.status === "fulfilled") {
          allResults.push(outcome.value);
        } else {
          console.error("Unexpected batch error:", outcome.reason);
          allResults.push({ client_id: "unknown", ig_handle: "unknown", status: "failed", reason: String(outcome.reason) });
        }
      }
    }

    const saved   = allResults.filter(r => r.status === "saved").length;
    const skipped = allResults.filter(r => r.status === "skipped").length;
    const failed  = allResults.filter(r => r.status === "failed").length;

    console.log(`Done — saved: ${saved}, skipped: ${skipped}, failed: ${failed}`);

    return new Response(
      JSON.stringify({ success: true, processed: allResults.length, saved, skipped, failed, results: allResults }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Fatal error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

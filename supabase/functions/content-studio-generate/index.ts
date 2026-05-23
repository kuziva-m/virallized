const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
const OPENAI_API_KEY    = Deno.env.get("OPENAI_API_KEY") ?? "";
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface BrandProfile {
  brandName?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  brandVoice?: string;
  businessDescription?: string;
  examplePostUrls?: string[];
}

interface CreationElement {
  base64: string;
  description: string;
}

// ── Claude call ───────────────────────────────────────────────────────────────
async function callClaude(
  systemPrompt: string,
  userPrompt: string,
  model = "claude-haiku-4-5-20251001",
  examplePostUrls: string[] = [],
  generatedImageBase64?: string,
  elements: CreationElement[] = [],
): Promise<string> {
  if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not configured. Add it in Supabase → Settings → Edge Functions → Secrets.");

  const messages: unknown[] = [];

  if (examplePostUrls.length > 0) {
    const imageContent = examplePostUrls.map((url) => ({
      type: "image",
      source: { type: "url", url },
    }));
    messages.push({
      role: "user",
      content: [
        ...imageContent,
        { type: "text", text: "These are example posts from this brand. Study their visual style, copywriting tone, content structure, and personality. You will use this as style reference for the content you are about to generate." },
      ],
    });
    messages.push({
      role: "assistant",
      content: "I've analysed the brand's content. I can see their tone, style, and visual approach. I'll replicate this in the content I generate.",
    });
  }

  // Brand elements uploaded by the user for this creation
  if (elements.length > 0) {
    const elemContent: unknown[] = [];
    for (const el of elements) {
      const raw = el.base64.includes(",") ? el.base64.split(",")[1] : el.base64;
      const mediaType = el.base64.startsWith("data:image/png") ? "image/png" : el.base64.startsWith("data:image/gif") ? "image/gif" : "image/jpeg";
      elemContent.push({ type: "image", source: { type: "base64", media_type: mediaType, data: raw } });
      if (el.description) elemContent.push({ type: "text", text: `Description: ${el.description}` });
    }
    elemContent.push({ type: "text", text: "These are specific brand elements the user has uploaded — products, packaging, logos, or photos. You MUST reference and mention these specific items in headlines, copy, captions, and hashtags. Do not be vague — name and describe them directly." });
    messages.push({ role: "user", content: elemContent });
    messages.push({ role: "assistant", content: "I can clearly see the uploaded brand elements. I'll reference and mention them specifically and directly in all copy I generate." });
  }

  // If a generated image is provided, show it to Claude so it can tailor copy to match
  if (generatedImageBase64) {
    messages.push({
      role: "user",
      content: [
        { type: "image", source: { type: "base64", media_type: "image/png", data: generatedImageBase64 } },
        { type: "text", text: "This is the AI-generated image that will be used as the visual background for this content. Study its mood, atmosphere, colour palette, composition, and subject matter carefully. Tailor ALL of your copy — headlines, captions, hooks, and body text — to feel cohesive with and complementary to this specific image. The words and visuals should feel like they were made for each other." },
      ],
    });
    messages.push({
      role: "assistant",
      content: "I've studied the generated image — its mood, colours, and composition. I'll craft copy that feels made for this specific visual.",
    });
  }

  messages.push({ role: "user", content: userPrompt });

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({ model, max_tokens: 4096, system: systemPrompt, messages }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error(`Claude API error ${res.status} (model: ${model}):`, errText);
    throw new Error(`Claude API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return data.content[0]?.text ?? "";
}

// ── Image generation (gpt-image-1) ───────────────────────────────────────────
async function generateImage(prompt: string, throwOnError = false): Promise<string> {
  if (!OPENAI_API_KEY) {
    if (throwOnError) throw new Error("OPENAI_API_KEY is not configured. Add it in Supabase → Settings → Edge Functions → Secrets.");
    return "";
  }

  try {
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: "gpt-image-1", prompt, size: "1024x1024" }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error("Image API error:", errBody);
      if (throwOnError) {
        let msg = errBody;
        try { msg = JSON.parse(errBody)?.error?.message ?? errBody; } catch { /* keep raw */ }
        throw new Error(`OpenAI Image API ${res.status}: ${msg}`);
      }
      return "";
    }

    const data = await res.json();
    const b64 = data.data?.[0]?.b64_json;
    if (!b64) {
      if (throwOnError) throw new Error("No image returned from OpenAI");
      return "";
    }
    return `data:image/png;base64,${b64}`;
  } catch (err) {
    console.error("Image generation exception:", err);
    if (throwOnError) throw err;
    return "";
  }
}

// ── Brand context injector ────────────────────────────────────────────────────
function buildBrandContext(brand?: BrandProfile): string {
  if (!brand) return "";
  const parts: string[] = ["--- BRAND CONTEXT (apply to all content) ---"];
  if (brand.brandName) parts.push(`Brand name: ${brand.brandName}`);
  if (brand.businessDescription) parts.push(`IMPORTANT — What this business does: ${brand.businessDescription}\nDo NOT make assumptions about the industry. Use this description to keep all content accurate.`);
  if (brand.brandVoice) parts.push(`Brand voice & personality: ${brand.brandVoice}`);
  if (brand.primaryColor || brand.secondaryColor || brand.accentColor) {
    parts.push(`Brand colors: primary ${brand.primaryColor ?? "#ffae07"}, secondary ${brand.secondaryColor ?? "#ff2429"}, accent ${brand.accentColor ?? "#f1078d"}`);
  }
  parts.push("Always write in this brand's unique voice. Reference the brand name where appropriate.");
  parts.push("---");
  return "\n" + parts.join("\n") + "\n";
}

// ── Prompts ───────────────────────────────────────────────────────────────────
const JSON_SYSTEM = "You are an expert Instagram content strategist and copywriter. Respond with valid JSON only — no markdown fences, no explanation, just the raw JSON object.";

function carouselPrompt(topic: string, tone: string, style: string, slideCount: number, brand?: BrandProfile): string {
  return `${buildBrandContext(brand)}Create a ${slideCount}-slide Instagram carousel about: "${topic}"
Tone: ${tone}
Visual style: ${style}

Return this exact JSON shape:
{
  "slides": [
    // { "type": "title",  "headline": string, "sub": string }
    // { "type": "stat",   "stat": string, "body": string }
    // { "type": "tip",    "num": "01", "headline": string, "body": string }
    // { "type": "quote",  "quote": string, "author": string }
    // { "type": "cta",    "headline": string, "sub": string }
    // { "type": "follow", "headline": string, "sub": string }
  ],
  "caption": string,
  "hashtags": string
}

Rules:
- Slide 1: always "title"
- Slide ${slideCount}: always "follow" — sub should be the brand's Instagram handle if known, else "@virallized"
- Slide ${slideCount - 1}: always "cta"
- Include exactly 1 "stat" and 1 "quote"
- Rest are "tip", numbered 01, 02...
- tip body max 120 chars
- quote max 140 chars
- Caption: 2-3 short paragraphs, conversational, ends with a question
- Hashtags: 8-10 tags as a single string`;
}

function singleImagePrompt(topic: string, tone: string, style: string, brand?: BrandProfile): string {
  return `${buildBrandContext(brand)}Create an Instagram single-image post about: "${topic}"
Tone: ${tone} | Visual style: ${style}

Return:
{ "headline": string, "subheadline": string, "caption": string, "hashtags": string }

Rules: headline max 8 words, subheadline max 15 words, caption 2 paragraphs + question, hashtags 8-10 tags`;
}

function researchPrompt(handle: string, niche: string, brand?: BrandProfile): string {
  return `${buildBrandContext(brand)}Generate 8 high-performing Instagram content ideas for a ${niche || "personal brand / service business"} account.
${handle ? `Account: ${handle}` : ""}

Return:
{
  "topics": [
    { "title": string, "hook": string, "format": "Carousel" | "Single Image" | "Reel", "why": string }
  ]
}

Rules: title max 10 words, hook max 20 words, why 1 sentence. Mix formats.`;
}

function competitorPrompt(handles: string[], niche: string): string {
  return `Analyse content strategy gaps for Instagram accounts in the "${niche || "service business"}" niche.
Competitors: ${handles.join(", ")}

Return:
{
  "gaps": [string],
  "opportunities": [{ "angle": string, "description": string }],
  "topFormats": [string]
}

Rules: 4-5 gaps, 4-5 opportunities (1-sentence description each), 3-4 topFormats with brief reason`;
}

function blogPrompt(topic: string, tone: string, brand?: BrandProfile): string {
  return `${buildBrandContext(brand)}Write a complete SEO-optimised blog article about: "${topic}"
Tone: ${tone}

Return:
{
  "titleOptions": [string, string, string],
  "metaDescription": string,
  "intro": string,
  "sections": [{ "heading": string, "body": string }],
  "conclusion": string,
  "suggestedTags": [string]
}

Rules:
- 3 title options (curiosity / how-to / list-based)
- metaDescription under 155 chars with primary keyword
- intro: 2 paragraphs
- 5-6 sections, each 2-3 paragraphs
- conclusion: 1-2 paragraphs with CTA
- 4-6 suggestedTags`;
}

// ── Safe JSON parse (strips markdown fences if model adds them) ───────────────
function parseJSON(raw: string): unknown {
  const stripped = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  return JSON.parse(stripped);
}

// ── Main handler ──────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // Verify auth
    const token = (req.headers.get("authorization") ?? "").replace("Bearer ", "");
    if (!token) throw new Error("Unauthorized");

    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { apikey: supabaseServiceKey, Authorization: `Bearer ${token}` },
    });
    if (!userRes.ok) throw new Error("Unauthorized");
    const { id: userId } = await userRes.json();

    const { action, topic, tone, style, slideCount, handle, niche, competitors, brand, elements } = await req.json();
    const creationElements: CreationElement[] = Array.isArray(elements) ? elements : [];

    // ── Monthly generation limit check ────────────────────────────────────────
    const MONTHLY_LIMIT = 50;
    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);

    const countRes = await fetch(
      `${supabaseUrl}/rest/v1/generated_content?user_id=eq.${userId}&created_at=gte.${monthStart.toISOString()}&select=id`,
      { headers: { apikey: supabaseServiceKey, Authorization: `Bearer ${supabaseServiceKey}`, Prefer: "count=exact" } },
    );
    const countHeader = countRes.headers.get("content-range");
    const usedThisMonth = countHeader ? parseInt(countHeader.split("/")[1] ?? "0", 10) : 0;

    if (usedThisMonth >= MONTHLY_LIMIT) {
      return new Response(
        JSON.stringify({ error: `Monthly limit reached (${MONTHLY_LIMIT} generations). Resets on the 1st.` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 429 },
      );
    }

    // Load brand profile from DB if not passed (fallback)
    let brandProfile: BrandProfile | undefined = brand;
    if (!brandProfile && userId) {
      const bpRes = await fetch(
        `${supabaseUrl}/rest/v1/brand_profiles?user_id=eq.${userId}&select=*&limit=1`,
        { headers: { apikey: supabaseServiceKey, Authorization: `Bearer ${supabaseServiceKey}` } },
      );
      const bpData = await bpRes.json();
      if (bpData?.[0]) {
        const bp = bpData[0];
        brandProfile = {
          brandName: bp.brand_name,
          primaryColor: bp.primary_color,
          secondaryColor: bp.secondary_color,
          accentColor: bp.accent_color,
          brandVoice: bp.brand_voice,
          businessDescription: bp.business_description,
          examplePostUrls: bp.example_post_urls ?? [],
        };
      }
    }

    const exampleUrls = brandProfile?.examplePostUrls?.filter(Boolean) ?? [];

    let result: unknown;

    if (action === "carousel") {
      const raw = await callClaude(JSON_SYSTEM, carouselPrompt(topic, tone, style, slideCount ?? 10, brandProfile), "claude-haiku-4-5-20251001", exampleUrls, undefined, creationElements);
      result = parseJSON(raw);
    } else if (action === "single") {
      const raw = await callClaude(JSON_SYSTEM, singleImagePrompt(topic, tone, style, brandProfile), "claude-haiku-4-5-20251001", exampleUrls, undefined, creationElements);
      result = parseJSON(raw);
    } else if (action === "ai-carousel") {
      const elementDescs = creationElements.map(e => e.description || "uploaded brand element").join("; ");
      const bizCtx = brandProfile?.businessDescription ? ` This is for a business that does the following: ${brandProfile.businessDescription}. The image must reflect this business type accurately.` : "";
      const elemCtx = creationElements.length > 0 ? ` The image MUST prominently feature these specific items: ${elementDescs}.` : "";
      const imgPrompt = `Cinematic background photograph for an Instagram carousel about "${topic}".${bizCtx}${elemCtx} ${style} aesthetic, ${tone} mood. No text, no words, no letters. Photorealistic, visually stunning, high production quality, suitable as a social media slide background.`;
      const imageUrl = await generateImage(imgPrompt);
      const base64 = imageUrl ? imageUrl.replace("data:image/png;base64,", "") : undefined;
      const raw = await callClaude(JSON_SYSTEM, carouselPrompt(topic, tone, style, slideCount ?? 10, brandProfile), "claude-haiku-4-5-20251001", exampleUrls, base64, creationElements);
      result = { ...(parseJSON(raw) as Record<string, unknown>), imageUrl };
    } else if (action === "ai-single") {
      const elementDescs = creationElements.map(e => e.description || "uploaded brand element").join("; ");
      const bizCtx = brandProfile?.businessDescription ? ` This is for a business that does the following: ${brandProfile.businessDescription}. The image must reflect this business type accurately.` : "";
      const elemCtx = creationElements.length > 0 ? ` The image MUST prominently feature these specific items: ${elementDescs}.` : "";
      const imgPrompt = `Stunning editorial photograph for an Instagram post about "${topic}".${bizCtx}${elemCtx} ${tone} mood, ${style} aesthetic. No text, no words, no letters. Cinematic lighting, ultra high quality, magazine-worthy, suitable for social media.`;
      const imageUrl = await generateImage(imgPrompt);
      const base64 = imageUrl ? imageUrl.replace("data:image/png;base64,", "") : undefined;
      const raw = await callClaude(JSON_SYSTEM, singleImagePrompt(topic, tone, style, brandProfile), "claude-haiku-4-5-20251001", exampleUrls, base64, creationElements);
      result = { ...(parseJSON(raw) as Record<string, unknown>), imageUrl };
    } else if (action === "research") {
      const raw = await callClaude(JSON_SYSTEM, researchPrompt(handle ?? "", niche ?? topic, brandProfile), "claude-haiku-4-5-20251001", exampleUrls, undefined, creationElements);
      result = parseJSON(raw);
    } else if (action === "competitor") {
      const raw = await callClaude(JSON_SYSTEM, competitorPrompt(competitors ?? [], niche ?? topic), "claude-sonnet-4-6");
      result = parseJSON(raw);
    } else if (action === "blog") {
      const raw = await callClaude(JSON_SYSTEM, blogPrompt(topic, tone, brandProfile), "claude-sonnet-4-6", exampleUrls, undefined, creationElements);
      result = parseJSON(raw);
    } else if (action === "image") {
      const imgPrompt = topic?.trim()
        ? `${topic}. High quality, photorealistic, professional, suitable for social media. No text, no words, no letters.`
        : "A stunning professional social media photograph. High quality, photorealistic, vibrant.";
      const imageUrl = await generateImage(imgPrompt, true);
      result = { imageUrl, prompt: imgPrompt };
    } else {
      throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("content-studio-generate error:", message);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

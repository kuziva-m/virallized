import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Image,
  Search,
  Users,
  Download,
  Copy,
  ZoomIn,
  X,
  RotateCcw,
  Wand2,
  Hash,
  AlignLeft,
  Layers,
  Check,
  Lightbulb,
  TrendingUp,
  Shuffle,
  Plus,
  Zap,
  LogOut,
  ChevronRight,
  ChevronDown,
  FileText,
  Tag,
  Mic2,
  AlertCircle,
  ExternalLink,
  Palette,
  Upload,
  Trash2,
  Save,
  HelpCircle,
  SlidersHorizontal,
  History,
  Crown,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";

// ── Types ─────────────────────────────────────────────────────────────────────
type SlideType =
  | { type: "title"; headline: string; sub: string }
  | { type: "stat"; stat: string; body: string }
  | { type: "tip"; num: string; headline: string; body: string }
  | { type: "quote"; quote: string; author: string }
  | { type: "cta"; headline: string; sub: string }
  | { type: "follow"; headline: string; sub: string };

type ResearchTopic = {
  title: string;
  hook: string;
  format: string;
  why: string;
};
type Opportunity = { angle: string; description: string };
type BlogSection = { heading: string; body: string };

type GeneratedResult =
  | {
      type: "carousel";
      slides: SlideType[];
      caption: string;
      hashtags: string;
      imageUrl?: string;
    }
  | {
      type: "single";
      headline: string;
      subheadline: string;
      caption: string;
      hashtags: string;
      imageUrl?: string;
    }
  | {
      type: "ai-carousel";
      slides: SlideType[];
      caption: string;
      hashtags: string;
      imageUrl?: string;
    }
  | {
      type: "ai-single";
      headline: string;
      subheadline: string;
      caption: string;
      hashtags: string;
      imageUrl?: string;
    }
  | { type: "research"; topics: ResearchTopic[] }
  | {
      type: "competitor";
      gaps: string[];
      opportunities: Opportunity[];
      topFormats: string[];
    }
  | {
      type: "blog";
      titleOptions: string[];
      metaDescription: string;
      intro: string;
      sections: BlogSection[];
      conclusion: string;
      suggestedTags: string[];
    }
  | { type: "image"; imageUrl: string; prompt: string };

type Mode = "carousel" | "single" | "ai-carousel" | "ai-single" | "image" | "research" | "competitor" | "blog";

interface SavedContent {
  id: string;
  type: Mode;
  title: string;
  content: GeneratedResult;
  imageUrl?: string;
  createdAt: string;
}

interface BrandProfile {
  id?: string;
  brandName: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  brandVoice: string;
  businessDescription: string;
  examplePostUrls: string[];
}

const EMPTY_BRAND: BrandProfile = {
  brandName: "",
  logoUrl: "",
  primaryColor: "#ffae07",
  secondaryColor: "#ff2429",
  accentColor: "#f1078d",
  brandVoice: "",
  businessDescription: "",
  examplePostUrls: [],
};

const TONES = ["Inspirational", "Educational", "Entertaining", "Promotional"];
const STYLES = ["Minimalist", "Bold", "Luxury", "Vibrant"];
const SLIDE_COUNTS = [5, 6, 7, 8, 9, 10];
const ASPECT_RATIOS = [
  { label: "4:5", value: "4/5", desc: "Portrait" },
  { label: "1:1", value: "1/1", desc: "Square" },
  { label: "3:4", value: "3/4", desc: "Tall" },
  { label: "9:16", value: "9/16", desc: "Story" },
] as const;
type AspectRatio = typeof ASPECT_RATIOS[number]["value"];
const SUGGESTED = [
  "Growth tips",
  "Behind the scenes",
  "Client results",
  "How-to guide",
  "Common mistakes",
];

const MODES = [
  {
    key: "carousel" as Mode,
    label: "Carousel",
    icon: Layers,
    desc: "Clean branded cards",
    group: "Simple Cards",
  },
  {
    key: "single" as Mode,
    label: "Single Post",
    icon: Image,
    desc: "One-frame branded post",
    group: "Simple Cards",
  },
  {
    key: "ai-carousel" as Mode,
    label: "AI Carousel",
    icon: Sparkles,
    desc: "Cards + AI background",
    group: "AI Enhanced",
  },
  {
    key: "ai-single" as Mode,
    label: "AI Post",
    icon: Wand2,
    desc: "Post + AI image",
    group: "AI Enhanced",
  },
  {
    key: "image" as Mode,
    label: "Generate Image",
    icon: Zap,
    desc: "Pure AI image",
    group: "AI Tools",
  },
  {
    key: "research" as Mode,
    label: "Content Research",
    icon: Search,
    desc: "AI topic ideas",
    group: "AI Tools",
  },
  {
    key: "competitor" as Mode,
    label: "Competitor Analysis",
    icon: Users,
    desc: "Find content gaps",
    group: "AI Tools",
  },
  {
    key: "blog" as Mode,
    label: "Blog Article",
    icon: FileText,
    desc: "Full SEO article",
    group: "AI Tools",
  },
] as const;

// ── Plan tier gating ──────────────────────────────────────────────────────────
// "free" = legacy IG clients (50 gen default, all modes unlocked for them)
// Standard → carousel, single, research
// Pro      → + ai-carousel, ai-single, image, competitor
// Max      → + blog
const MODE_MIN_TIER: Record<Mode, "standard" | "pro" | "max" | null> = {
  carousel:   null,       // all paid plans
  single:     null,
  research:   null,
  "ai-carousel": "pro",
  "ai-single":   "pro",
  image:         "pro",
  competitor:    "max",
  blog:          "max",
};

const TIER_RANK: Record<"free" | "standard" | "pro" | "max", number> = {
  free: 0, standard: 1, pro: 2, max: 3,
};

const TIER_LABELS: Record<string, string> = {
  standard: "Standard", pro: "Pro", max: "Max",
};

const HOW_IT_WORKS: Record<Mode, { what: string; tips: string[] }> = {
  carousel: {
    what: "AI builds a complete carousel — title, tips, stat, quote, and CTA — with clean branded gradient cards.",
    tips: [
      "Be specific: '5 mistakes coaches make on Instagram' beats just 'Instagram mistakes'",
      "10 slides for depth, 5 slides for punchy quick posts",
      "Inspirational tone consistently outperforms for growth audiences",
    ],
  },
  single: {
    what: "Creates a bold branded post with a headline, subheadline, caption, and hashtags. Clean gradient design.",
    tips: [
      "Works best for quotes, announcements, or a single key stat",
      "Bold + Vibrant style produces the most scroll-stopping visuals",
      "Pair with your Brand Kit for fully on-brand output",
    ],
  },
  "ai-carousel": {
    what: "AI writes the full carousel copy AND generates a cinematic background image — blended together for a premium aesthetic.",
    tips: [
      "Describe a visual scene in your topic for better image results",
      "The AI image is generated specifically to match your topic and style",
      "Download the background image separately to use in your own designs",
    ],
  },
  "ai-single": {
    what: "AI writes compelling copy AND generates a stunning editorial photo — one cohesive, scroll-stopping post.",
    tips: [
      "Works best when your topic has a strong visual angle",
      "The image is generated at cinematic quality to match your mood and style",
      "Download the raw image to use independently in Canva or Photoshop",
    ],
  },
  research: {
    what: "Returns 8 high-performing content ideas for your niche, each with a hook and best format.",
    tips: [
      "Enter your Instagram handle for personalised ideas",
      "Click any idea to instantly load it as your carousel topic",
      "Mix formats — Reels, Carousels, and Singles all reach differently",
    ],
  },
  competitor: {
    what: "Finds content gaps your competitors are missing so you can dominate those angles first.",
    tips: [
      "Enter 2–3 competitor handles, comma separated",
      "Add your niche in the topic field for sharper, more targeted gaps",
      "Opportunities highlight angles nobody in your space is covering yet",
    ],
  },
  blog: {
    what: "Writes a full SEO article with intro, 5–6 sections, meta description, and tags — export as PDF.",
    tips: [
      "Specific topics rank higher: 'Instagram for dentists in 2025' beats 'Instagram tips'",
      "Educational or Promotional tone works best for blog content",
      "Use Download PDF to send directly to clients or publish on your site",
    ],
  },
  image: {
    what: "Generates a standalone AI image — no text overlays, just a pure high-quality photo.",
    tips: [
      "Describe the scene in detail: subject, mood, lighting, and style",
      "e.g. 'Aerial view of a busy café at golden hour, warm tones, cinematic'",
      "Use the downloaded image as a background for your own designs or posts",
    ],
  },
};

const DEFAULT_GRAD = "linear-gradient(135deg, #ffae07, #ff2429, #f1078d)";

function brandGrad(brand: BrandProfile | null): string {
  if (
    !brand ||
    (!brand.primaryColor && !brand.secondaryColor && !brand.accentColor)
  )
    return DEFAULT_GRAD;
  return `linear-gradient(135deg, ${brand.primaryColor || "#ffae07"}, ${brand.secondaryColor || "#ff2429"}, ${brand.accentColor || "#f1078d"})`;
}

// ── Slide card renderer ───────────────────────────────────────────────────────
function SlideCard({
  slide,
  small = false,
  onClick,
  grad = DEFAULT_GRAD,
  logoUrl,
  bgImageUrl,
  aspectRatio = "1/1",
}: {
  slide: SlideType;
  small?: boolean;
  onClick?: () => void;
  grad?: string;
  logoUrl?: string;
  bgImageUrl?: string;
  aspectRatio?: string;
}) {
  const wrap = `overflow-hidden ${small ? "rounded-lg cursor-pointer" : "rounded-2xl"} select-none`;
  const showBg = !!bgImageUrl;
  const ratio = small ? "1/1" : aspectRatio;

  if (
    slide.type === "title" ||
    slide.type === "cta" ||
    slide.type === "follow"
  ) {
    return (
      <div
        className={`${wrap} relative flex flex-col items-center justify-center text-white text-center`}
        style={{ aspectRatio: ratio }}
        onClick={onClick}
      >
        {showBg && (
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${bgImageUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        )}
        <div
          className="absolute inset-0"
          style={{ background: grad, opacity: showBg ? 0.78 : 1 }}
        />
        <div className={`relative z-10 ${small ? "p-2" : "p-8"}`}>
          <div
            className={`font-black leading-tight ${small ? "text-[9px]" : "text-2xl sm:text-3xl"}`}
          >
            {slide.headline}
          </div>
          <div
            className={`font-medium opacity-80 mt-1 ${small ? "text-[7px]" : "text-base"}`}
          >
            {slide.sub}
          </div>
          {!small && (
            <div className="mt-5 w-10 h-[3px] bg-white/40 rounded-full mx-auto" />
          )}
        </div>
        {logoUrl && !small && (
          <img
            src={logoUrl}
            alt="logo"
            className="absolute bottom-3 right-3 h-8 object-contain max-w-[80px] z-10 drop-shadow-lg"
          />
        )}
      </div>
    );
  }

  if (slide.type === "stat") {
    return (
      <div
        className={`${wrap} relative flex flex-col items-center justify-center text-white text-center`}
        style={{ aspectRatio: ratio }}
        onClick={onClick}
      >
        {showBg && (
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${bgImageUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        )}
        <div
          className="absolute inset-0"
          style={{ background: grad, opacity: showBg ? 0.78 : 1 }}
        />
        <div className={`relative z-10 ${small ? "p-2" : "p-8"}`}>
          <div
            className={`font-black leading-none ${small ? "text-2xl" : "text-6xl"}`}
          >
            {slide.stat}
          </div>
          <div
            className={`opacity-85 mt-2 max-w-xs ${small ? "text-[6px]" : "text-sm"}`}
          >
            {slide.body}
          </div>
        </div>
        {logoUrl && !small && (
          <img
            src={logoUrl}
            alt="logo"
            className="absolute bottom-3 right-3 h-8 object-contain max-w-[80px] z-10 drop-shadow-lg"
          />
        )}
      </div>
    );
  }

  if (slide.type === "tip") {
    return (
      <div
        className={`${wrap} relative flex flex-col justify-between ${showBg ? "" : "bg-white"}`}
        style={{ aspectRatio: ratio }}
        onClick={onClick}
      >
        {showBg && (
          <div className="absolute inset-0" style={{ backgroundImage: `url(${bgImageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }} />
        )}
        {showBg && <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.62)" }} />}
        <div className={`relative z-10 flex flex-col h-full ${small ? "p-2" : "p-6"}`}>
          <div className={`font-black leading-none ${showBg ? "text-white/20" : "opacity-[0.08] text-slate-900"} ${small ? "text-lg" : "text-5xl"}`}>
            {slide.num}
          </div>
          <div className={`font-black ${showBg ? "text-white" : "text-slate-900"} ${small ? "text-[8px] mt-0.5" : "text-lg mt-3"}`}>
            {slide.headline}
          </div>
          <div className={`${showBg ? "text-white/70" : "text-slate-500"} ${small ? "text-[6px] mt-0.5" : "text-sm mt-2"}`}>
            {slide.body}
          </div>
          {!small && (
            <div className="mt-auto h-[3px] w-8 rounded-full" style={{ background: grad }} />
          )}
        </div>
        {logoUrl && !small && (
          <img src={logoUrl} alt="logo" className="absolute bottom-3 right-3 h-8 object-contain max-w-[80px] z-10 drop-shadow-lg" />
        )}
      </div>
    );
  }

  if (slide.type === "quote") {
    return (
      <div
        className={`${wrap} relative flex flex-col items-center justify-center text-center ${showBg ? "" : "bg-[#fafafa]"}`}
        style={{ aspectRatio: ratio }}
        onClick={onClick}
      >
        {showBg && (
          <div className="absolute inset-0" style={{ backgroundImage: `url(${bgImageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }} />
        )}
        {showBg && <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.58)" }} />}
        <div className={`relative z-10 ${small ? "p-2" : "p-8"}`}>
          <div
            className={`font-black leading-none ${small ? "text-xl" : "text-5xl"}`}
            style={showBg ? { color: "rgba(255,255,255,0.9)" } : { background: grad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
          >
            "
          </div>
          <div className={`font-semibold italic ${showBg ? "text-white" : "text-slate-800"} ${small ? "text-[7px]" : "text-sm"}`}>
            {slide.quote}
          </div>
          <div className={`mt-1 ${showBg ? "text-white/60" : "text-slate-400"} ${small ? "text-[6px]" : "text-xs"}`}>
            — {slide.author}
          </div>
        </div>
        {logoUrl && !small && (
          <img src={logoUrl} alt="logo" className="absolute bottom-3 right-3 h-8 object-contain max-w-[80px] z-10 drop-shadow-lg" />
        )}
      </div>
    );
  }

  return null;
}

// ── Canvas slide renderer (for ZIP download) ──────────────────────────────────
async function renderSlideToCanvas(
  slide: SlideType,
  W: number,
  H: number,
  gradColors: [string, string, string],
  bgImageUrl: string | undefined,
  logoUrl: string | undefined,
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const pad = W * 0.074;
  const showBg = !!bgImageUrl;

  const loadImg = async (src: string): Promise<HTMLImageElement> => {
    try {
      const res = await fetch(src);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      return new Promise((resolve, reject) => {
        const img = document.createElement("img");
        img.onload = () => { URL.revokeObjectURL(blobUrl); resolve(img); };
        img.onerror = reject;
        img.src = blobUrl;
      });
    } catch {
      return new Promise((resolve, reject) => {
        const img = document.createElement("img");
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });
    }
  };

  const makeGrad = () => {
    const angle = (135 * Math.PI) / 180;
    const len = Math.sqrt(W * W + H * H) / 2;
    const cx = W / 2, cy = H / 2;
    const g = ctx.createLinearGradient(
      cx - Math.cos(angle) * len, cy - Math.sin(angle) * len,
      cx + Math.cos(angle) * len, cy + Math.sin(angle) * len,
    );
    g.addColorStop(0, gradColors[0]);
    g.addColorStop(0.5, gradColors[1]);
    g.addColorStop(1, gradColors[2]);
    return g;
  };

  const wrapText = (text: string, maxW: number, font: string): string[] => {
    ctx.font = font;
    const words = text.split(" ");
    const lines: string[] = [];
    let line = "";
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (ctx.measureText(test).width > maxW) { if (line) lines.push(line); line = w; }
      else line = test;
    }
    if (line) lines.push(line);
    return lines;
  };

  // Background
  if (showBg && bgImageUrl) {
    try {
      const bg = await loadImg(bgImageUrl);
      const scale = Math.max(W / bg.width, H / bg.height);
      const sw = bg.width * scale, sh = bg.height * scale;
      ctx.drawImage(bg, (W - sw) / 2, (H - sh) / 2, sw, sh);
    } catch { ctx.fillStyle = "#111"; ctx.fillRect(0, 0, W, H); }
  } else {
    ctx.fillStyle = makeGrad();
    ctx.fillRect(0, 0, W, H);
  }

  if (slide.type === "title" || slide.type === "cta" || slide.type === "follow") {
    if (showBg) {
      const ov = ctx.createLinearGradient(0, 0, 0, H);
      ov.addColorStop(0, "rgba(0,0,0,0.15)"); ov.addColorStop(1, "rgba(0,0,0,0.62)");
      ctx.fillStyle = ov; ctx.fillRect(0, 0, W, H);
    }
    ctx.textAlign = "center"; ctx.fillStyle = "white";
    ctx.shadowColor = "rgba(0,0,0,0.4)"; ctx.shadowBlur = 16;
    const hlFont = `900 ${W * 0.055}px system-ui,sans-serif`;
    const subFont = `500 ${W * 0.032}px system-ui,sans-serif`;
    const hlLines = wrapText(slide.headline, W - pad * 2, hlFont);
    const subLines = wrapText(slide.sub, W - pad * 2, subFont);
    const hlLineH = W * 0.068, subLineH = W * 0.044;
    const totalH = hlLines.length * hlLineH + 28 + subLines.length * subLineH;
    const startY = H / 2 - totalH / 2;
    ctx.font = hlFont;
    hlLines.forEach((l, i) => ctx.fillText(l, W / 2, startY + i * hlLineH + hlLineH * 0.8));
    ctx.font = subFont; ctx.globalAlpha = 0.8; ctx.shadowBlur = 0;
    subLines.forEach((l, i) => ctx.fillText(l, W / 2, startY + hlLines.length * hlLineH + 28 + i * subLineH + subLineH * 0.8));
    ctx.globalAlpha = 1;
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.fillRect(W / 2 - W * 0.046, startY + hlLines.length * hlLineH + 28 + subLines.length * subLineH + 20, W * 0.093, 3);
  } else if (slide.type === "stat") {
    if (showBg) {
      const ov = ctx.createLinearGradient(0, 0, 0, H);
      ov.addColorStop(0, "rgba(0,0,0,0.15)"); ov.addColorStop(1, "rgba(0,0,0,0.62)");
      ctx.fillStyle = ov; ctx.fillRect(0, 0, W, H);
    }
    ctx.textAlign = "center"; ctx.fillStyle = "white";
    ctx.shadowColor = "rgba(0,0,0,0.4)"; ctx.shadowBlur = 16;
    const statFont = `900 ${W * 0.11}px system-ui,sans-serif`;
    const bodyFont = `400 ${W * 0.032}px system-ui,sans-serif`;
    const bodyLines = wrapText(slide.body, W - pad * 2, bodyFont);
    const statH = W * 0.11 * 1.1, bodyLineH = W * 0.044;
    const totalH = statH + 24 + bodyLines.length * bodyLineH;
    const startY = H / 2 - totalH / 2;
    ctx.font = statFont; ctx.fillText(slide.stat, W / 2, startY + statH);
    ctx.font = bodyFont; ctx.globalAlpha = 0.85; ctx.shadowBlur = 0;
    bodyLines.forEach((l, i) => ctx.fillText(l, W / 2, startY + statH + 24 + i * bodyLineH + bodyLineH * 0.8));
    ctx.globalAlpha = 1;
  } else if (slide.type === "tip") {
    if (!showBg) { ctx.fillStyle = "white"; ctx.fillRect(0, 0, W, H); }
    else { ctx.fillStyle = "rgba(0,0,0,0.62)"; ctx.fillRect(0, 0, W, H); }
    ctx.textAlign = "left"; ctx.shadowBlur = 0;
    const numFont = `900 ${W * 0.28}px system-ui,sans-serif`;
    ctx.font = numFont; ctx.fillStyle = showBg ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.06)";
    ctx.fillText(slide.num, pad - W * 0.02, pad + W * 0.28);
    const hlFont = `900 ${W * 0.05}px system-ui,sans-serif`;
    const hlLines = wrapText(slide.headline, W - pad * 2, hlFont);
    const hlLineH = W * 0.063, hlStartY = pad + W * 0.3;
    ctx.font = hlFont; ctx.fillStyle = showBg ? "white" : "#111";
    hlLines.forEach((l, i) => ctx.fillText(l, pad, hlStartY + i * hlLineH));
    const bodyFont = `400 ${W * 0.031}px system-ui,sans-serif`;
    const bodyLines = wrapText(slide.body, W - pad * 2, bodyFont);
    const bodyLineH = W * 0.044, bodyStartY = hlStartY + hlLines.length * hlLineH + W * 0.025;
    ctx.font = bodyFont; ctx.fillStyle = showBg ? "rgba(255,255,255,0.7)" : "#666";
    bodyLines.forEach((l, i) => ctx.fillText(l, pad, bodyStartY + i * bodyLineH));
    ctx.fillStyle = makeGrad();
    ctx.fillRect(pad, H - pad - W * 0.007, W * 0.074, W * 0.007);
  } else if (slide.type === "quote") {
    if (!showBg) { ctx.fillStyle = "#f8f8f8"; ctx.fillRect(0, 0, W, H); }
    else { ctx.fillStyle = "rgba(0,0,0,0.58)"; ctx.fillRect(0, 0, W, H); }
    ctx.textAlign = "center"; ctx.shadowBlur = 0;
    ctx.font = `900 ${W * 0.2}px Georgia,serif`;
    ctx.fillStyle = showBg ? "rgba(255,255,255,0.9)" : makeGrad() as CanvasFillStrokeStyles["fillStyle"];
    ctx.fillText('"', W / 2, H * 0.38);
    const quoteFont = `600 italic ${W * 0.034}px system-ui,sans-serif`;
    const quoteLines = wrapText(slide.quote, W - pad * 2.5, quoteFont);
    const quoteLineH = W * 0.048, quoteStartY = H * 0.43;
    ctx.font = quoteFont; ctx.fillStyle = showBg ? "white" : "#222";
    quoteLines.forEach((l, i) => ctx.fillText(l, W / 2, quoteStartY + i * quoteLineH));
    ctx.font = `400 ${W * 0.026}px system-ui,sans-serif`;
    ctx.fillStyle = showBg ? "rgba(255,255,255,0.6)" : "#999";
    ctx.fillText(`— ${slide.author}`, W / 2, quoteStartY + quoteLines.length * quoteLineH + W * 0.04);
  }

  // Logo with backdrop pill
  if (logoUrl) {
    try {
      const logo = await loadImg(logoUrl);
      const lh = W * 0.065, lw = (logo.width / logo.height) * lh;
      const bPad = W * 0.015, margin = W * 0.037;
      const bX = W - lw - margin - bPad, bY = H - lh - margin - bPad;
      ctx.fillStyle = "rgba(0,0,0,0.32)";
      ctx.beginPath();
      const r = W * 0.009;
      ctx.moveTo(bX + r, bY);
      ctx.lineTo(bX + lw + bPad * 2 - r, bY);
      ctx.quadraticCurveTo(bX + lw + bPad * 2, bY, bX + lw + bPad * 2, bY + r);
      ctx.lineTo(bX + lw + bPad * 2, bY + lh + bPad * 2 - r);
      ctx.quadraticCurveTo(bX + lw + bPad * 2, bY + lh + bPad * 2, bX + lw + bPad * 2 - r, bY + lh + bPad * 2);
      ctx.lineTo(bX + r, bY + lh + bPad * 2);
      ctx.quadraticCurveTo(bX, bY + lh + bPad * 2, bX, bY + lh + bPad * 2 - r);
      ctx.lineTo(bX, bY + r);
      ctx.quadraticCurveTo(bX, bY, bX + r, bY);
      ctx.closePath();
      ctx.fill();
      ctx.drawImage(logo, W - lw - margin, H - lh - margin, lw, lh);
    } catch { /* skip */ }
  }

  return new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), "image/png"));
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ContentStudio() {
  const navigate = useNavigate();
  const location = useLocation();

  // Sidebar state
  const [mode, _setMode] = useState<Mode>("carousel");
  const setMode = (m: Mode) => {
    _setMode(m);
    setHowItWorksOpen(false);
    setTopic("");
  };
  const [topic, setTopic] = useState("");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("4/5");
  const [tone, setTone] = useState("Inspirational");
  const [style, setStyle] = useState("Bold");
  const [slideCount, setSlideCount] = useState(10);
  const [competitors, setCompetitors] = useState("");

  // Brand Kit state
  const [brand, setBrand] = useState<BrandProfile | null>(null);
  const [brandDraft, setBrandDraft] = useState<BrandProfile>(EMPTY_BRAND);
  const [isBrandKitOpen, setIsBrandKitOpen] = useState(false);
  const [isSavingBrand, setIsSavingBrand] = useState(false);
  const [brandSaved, setBrandSaved] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingPost, setIsUploadingPost] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const postInputRef = useRef<HTMLInputElement>(null);

  // Per-creation elements
  type CreationElement = { id: string; base64: string; description: string; name: string };
  const [elements, setElements] = useState<CreationElement[]>([]);
  const elementInputRef = useRef<HTMLInputElement>(null);

  const handleElementUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.slice(0, 5 - elements.length).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = ev.target?.result as string;
        setElements((prev) => [...prev, { id: Math.random().toString(36).slice(2), base64, description: "", name: file.name }]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  // Generation state
  const [result, setResult] = useState<GeneratedResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Saved content state
  const [savedItems, setSavedItems] = useState<SavedContent[]>([]);
  const [generationsThisMonth, setGenerationsThisMonth] = useState(0);
  const [MONTHLY_LIMIT, setMonthlyLimit] = useState(50); // updated from user_plans
  const [planTier, setPlanTier] = useState<"free" | "standard" | "pro" | "max">("free");
  const [_planStatus, setPlanStatus] = useState<"active" | "none">("none");

  // Auth / loading state
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isAwaitingWebhook, setIsAwaitingWebhook] = useState(false);

  // Paywall state
  const [isPaywalled, setIsPaywalled] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<"limit" | "feature">("limit");
  const [upgradeTargetTier, setUpgradeTargetTier] = useState<"pro" | "max">("pro");
  const [showTopupSuccess, setShowTopupSuccess] = useState(false);
  const [isTopupLoading, setIsTopupLoading] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [isPricingAnnual, setIsPricingAnnual] = useState(false);
  const [isPricingCheckoutLoading, setIsPricingCheckoutLoading] = useState<string | null>(null);

  // Mobile / UX state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Generating step tracker
  const [generatingStep, setGeneratingStep] = useState(0);

  // UI state
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);
  const [selectedTitle, setSelectedTitle] = useState(0);

  // ── Auth check + load brand profile + saved content on mount ─────────────
  useEffect(() => {
    (async () => {
      try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      // ── Creator Studio plan check ─────────────────────────────────────────
      const { data: userPlan } = await supabase
        .from("user_plans")
        .select("plan_tier, generations_limit, generations_used, status, generations_reset_date")
        .eq("user_id", user.id)
        .maybeSingle();

      // ── Legacy IG growth service paywall (keep for existing clients) ───────
      const { data: clientById } = await supabase
        .from("clients")
        .select("payment_authorized, stripe_subscription_id")
        .eq("id", user.id)
        .maybeSingle();
      const clientRecord =
        clientById ??
        (user.email
          ? (
              await supabase
                .from("clients")
                .select("payment_authorized, stripe_subscription_id")
                .eq("email", user.email)
                .maybeSingle()
            ).data
          : null);
      const hasLegacyAccess =
        clientRecord?.payment_authorized === true ||
        !!clientRecord?.stripe_subscription_id;

      const hasCsplan = (userPlan?.status === "active" || userPlan?.status === "trialing") && !!userPlan?.plan_tier && userPlan.plan_tier !== "free";
      const hasPaid = hasCsplan || hasLegacyAccess;

      if (!hasPaid) {
        setIsPaywalled(true);
        setIsAuthChecking(false);
        return;
      }

      // Set plan-based generation limit
      if (hasCsplan && userPlan) {
        const tier = userPlan.plan_tier as "standard" | "pro" | "max";
        setPlanTier(tier);
        setPlanStatus("active");
        setMonthlyLimit(userPlan.generations_limit ?? 50);
      } else {
        // Legacy clients get default 50 gens
        setPlanTier("free");
        setPlanStatus("active");
        setMonthlyLimit(50);
      }

      // Count gens since the last reset date (or start of month for legacy)
      const resetDate = userPlan?.generations_reset_date
        ? new Date(userPlan.generations_reset_date)
        : (() => { const d = new Date(); d.setUTCDate(1); d.setUTCHours(0,0,0,0); return d; })();

      // Subtract one period (reset_date is end of period, so go back ~30 days)
      const periodStart = new Date(resetDate);
      periodStart.setMonth(periodStart.getMonth() - 1);

      const [brandRes, savedRes, countRes] = await Promise.all([
        supabase
          .from("brand_profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("generated_content")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("generated_content")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .gte("created_at", periodStart.toISOString()),
      ]);

      setGenerationsThisMonth(countRes.count ?? 0);

      if (savedRes.data) {
        setSavedItems(
          savedRes.data.map((i: Record<string, unknown>) => ({
            id: i.id as string,
            type: i.type as Mode,
            title: i.title as string,
            content: i.content as GeneratedResult,
            imageUrl: i.image_url as string | undefined,
            createdAt: i.created_at as string,
          })),
        );
      }

      const data = brandRes.data;
      if (data) {
        const bp: BrandProfile = {
          id: data.id,
          brandName: data.brand_name ?? "",
          logoUrl: data.logo_url ?? "",
          primaryColor: data.primary_color ?? "#ffae07",
          secondaryColor: data.secondary_color ?? "#ff2429",
          accentColor: data.accent_color ?? "#f1078d",
          brandVoice: data.brand_voice ?? "",
          businessDescription: data.business_description ?? "",
          examplePostUrls: data.example_post_urls ?? [],
        };
        setBrand(bp);
        setBrandDraft(bp);
      }

      setIsAuthChecking(false);
      } catch (err) {
        console.error("ContentStudio auth check error:", err);
        setIsAuthChecking(false);
      }
    })();
  }, []);

  // ── Handle post-checkout URL params ──────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("topup") === "success") {
      setShowTopupSuccess(true);
      setGenerationsThisMonth((prev) => prev + 10);
      navigate("/content-studio", { replace: true });
      setTimeout(() => setShowTopupSuccess(false), 5000);
    }
    if (params.get("subscribed") === "success") {
      const sessionId = params.get("session_id") ?? "";
      navigate("/content-studio", { replace: true });
      setIsAwaitingWebhook(true);
      const activate = async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) { window.location.reload(); return; }

          const tryActivate = async (token: string) => {
            const res = await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/activate-cs-plan`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ sessionId }),
              },
            );
            return res.json();
          };

          const result = await tryActivate(session.access_token);
          if (result.activated) { window.location.reload(); return; }

          // Retry up to 5 times in case Stripe is still processing
          let attempts = 0;
          const interval = setInterval(async () => {
            attempts++;
            const { data: { session: s } } = await supabase.auth.getSession();
            if (!s) { clearInterval(interval); window.location.reload(); return; }
            const data = await tryActivate(s.access_token);
            if (data.activated || attempts >= 5) {
              clearInterval(interval);
              window.location.reload();
            }
          }, 3000);
        } catch {
          window.location.reload();
        }
      };
      activate();
    }
  }, [location.search]);

  // ── Generation step progress tracker (must be before early returns) ────────
  useEffect(() => {
    if (!isGenerating) { setGeneratingStep(0); return; }
    const steps = GENERATION_STEPS[mode];
    const totalMs = MODE_DURATION[mode];
    const interval = totalMs / steps.length;
    const timers: ReturnType<typeof setTimeout>[] = [];
    steps.forEach((_, i) => {
      if (i === 0) return;
      timers.push(setTimeout(() => setGeneratingStep(i), interval * i));
    });
    return () => timers.forEach(clearTimeout);
  }, [isGenerating, mode]);

  // ── Feature access helper ─────────────────────────────────────────────────
  const canAccessMode = (m: Mode): boolean => {
    const minTier = MODE_MIN_TIER[m];
    if (!minTier) return true; // available on all paid plans
    return TIER_RANK[planTier] >= TIER_RANK[minTier];
  };

  // ── Top-up purchase ────────────────────────────────────────────────────────
  const handleTopup = async () => {
    setIsTopupLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId: "topup", isTopup: true },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (err) {
      console.error("Topup checkout error:", err);
    } finally {
      setIsTopupLoading(false);
    }
  };

  // ── Creator Studio plan checkout ──────────────────────────────────────────
  const CS_PLANS = [
    {
      key: "standard",
      label: "Standard",
      badge: "Get Started",
      monthlyPrice: 49,
      annualTotal: 290,
      annualMonthly: 24,
      gens: 20,
      profiles: 1,
      monthlyPriceId: "price_1TZnFpHDWey36HYKKaJt7JvB",
      annualPriceId:  "price_1TZnFrHDWey36HYKhIl3mx9c",
      features: [
        "20 AI generations / month",
        "1 Brand Profile",
        "Carousel & Single Post",
        "Content Research",
        "Priority support",
      ],
    },
    {
      key: "pro",
      label: "Pro",
      badge: "Most Popular",
      monthlyPrice: 89,
      annualTotal: 590,
      annualMonthly: 49,
      gens: 60,
      profiles: 3,
      monthlyPriceId: "price_1TZnFqHDWey36HYKLtGVCVsQ",
      annualPriceId:  "price_1TZnFsHDWey36HYKzXYL8xOe",
      features: [
        "60 AI generations / month",
        "3 Brand Profiles",
        "Everything in Standard",
        "AI Carousel & AI Post",
        "Generate Image",
        "Competitor Analysis",
      ],
    },
    {
      key: "max",
      label: "Max",
      badge: "Full Power",
      monthlyPrice: 199,
      annualTotal: 1290,
      annualMonthly: 107,
      gens: 175,
      profiles: 10,
      monthlyPriceId: "price_1TZnFrHDWey36HYKcrGY46aS",
      annualPriceId:  "price_1TZnFsHDWey36HYKW6k7hNYi",
      features: [
        "175 AI generations / month",
        "10 Brand Profiles",
        "Everything in Pro",
        "Blog Article Writer",
        "White-label exports",
        "Dedicated account manager",
      ],
    },
  ] as const;

  const handleCSCheckout = async (priceId: string) => {
    setIsPricingCheckoutLoading(priceId);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId, isCreatorStudio: true, trialDays: 7 },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (err) {
      console.error("CS checkout error:", err);
    } finally {
      setIsPricingCheckoutLoading(null);
    }
  };

  // ── Brand Kit handlers ────────────────────────────────────────────────────
  const uploadFile = async (file: File, path: string): Promise<string> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not logged in");
    const fullPath = `${user.id}/${path}`;
    const { error } = await supabase.storage
      .from("brand-assets")
      .upload(fullPath, file, { upsert: true });
    if (error) throw error;
    const {
      data: { publicUrl },
    } = supabase.storage.from("brand-assets").getPublicUrl(fullPath);
    return publicUrl;
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingLogo(true);
    try {
      const url = await uploadFile(
        file,
        `logo-${Date.now()}.${file.name.split(".").pop()}`,
      );
      setBrandDraft((d) => ({ ...d, logoUrl: url }));
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleExamplePostUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (brandDraft.examplePostUrls.length >= 3) return;
    setIsUploadingPost(true);
    try {
      const url = await uploadFile(
        file,
        `post-${Date.now()}.${file.name.split(".").pop()}`,
      );
      setBrandDraft((d) => ({
        ...d,
        examplePostUrls: [...d.examplePostUrls, url],
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploadingPost(false);
    }
  };

  const handleSaveBrand = async () => {
    setIsSavingBrand(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");
      const payload = {
        user_id: user.id,
        brand_name: brandDraft.brandName,
        logo_url: brandDraft.logoUrl,
        primary_color: brandDraft.primaryColor,
        secondary_color: brandDraft.secondaryColor,
        accent_color: brandDraft.accentColor,
        brand_voice: brandDraft.brandVoice,
        business_description: brandDraft.businessDescription,
        example_post_urls: brandDraft.examplePostUrls,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase
        .from("brand_profiles")
        .upsert(payload, { onConflict: "user_id" });
      if (error) throw error;
      setBrand({ ...brandDraft });
      setBrandSaved(true);
      setTimeout(() => {
        setBrandSaved(false);
        setIsBrandKitOpen(false);
      }, 1200);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingBrand(false);
    }
  };

  // ── Loading screen (while auth + plan check runs) ────────────────────────
  if (isAuthChecking || isAwaitingWebhook) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center px-6">
          <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-[#f80d5d] animate-spin" />
          {isAwaitingWebhook ? (
            <>
              <p className="text-base font-black text-slate-900">Setting up your account…</p>
              <p className="text-sm text-slate-400 max-w-xs">This takes just a few seconds. Don't close this tab.</p>
            </>
          ) : (
            <p className="text-sm font-bold text-slate-400">Loading Creator Studio…</p>
          )}
        </div>
      </div>
    );
  }

  // ── Paywall / pricing page ────────────────────────────────────────────────
  if (isPaywalled) {
    const FEATURES_BY_TIER: Record<string, string[]> = {
      standard: ["Carousel & Single Post", "Content Research (8 ideas)", "1 Brand Profile", "Priority support"],
      pro:      ["Everything in Standard", "AI Carousel & AI Post", "Image Generator", "Competitor Analysis", "3 Brand Profiles"],
      max:      ["Everything in Pro", "Blog Article Writer", "10 Brand Profiles", "White-label exports", "Dedicated account manager"],
    };
    const TIER_ICONS: Record<string, React.ElementType> = { standard: Zap, pro: Sparkles, max: Crown };

    return (
      <div className="min-h-screen bg-[#fafafa] font-sans overflow-y-auto">
        {/* Top nav */}
        <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-100">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <img src="/images/logos/virallized-main-logo.svg" alt="Virallized" className="h-6" />
            <button
              onClick={() => navigate("/dashboard")}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>

        {/* Hero */}
        <div className="max-w-4xl mx-auto px-6 pt-16 pb-10 text-center">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#ffae07]/10 via-[#ff2429]/10 to-[#f1078d]/10 border border-[#f80d5d]/20 text-[#f80d5d] text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full mb-6">
            <Sparkles size={12} /> Creator Studio — Beta
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-[1.1] mb-5">
            AI-Powered Content,<br />
            <span className="bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] bg-clip-text text-transparent">Built for Instagram Growth</span>
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed mb-4">
            Generate on-brand carousels, AI-enhanced posts, competitor analysis, blog articles and more — all in one place, powered by Virallized AI.
          </p>
          <p className="text-sm font-bold text-[#f80d5d] mb-6">
            Use code <span className="font-black bg-[#fff1f2] px-2 py-0.5 rounded-lg">EARLYBIRD</span> for 40% off monthly plans — locked in forever.
          </p>

          {/* Trial trust bar */}
          <div className="inline-flex flex-wrap justify-center gap-x-5 gap-y-2 bg-emerald-50 border border-emerald-200 rounded-2xl px-6 py-3.5 mb-12">
            <span className="flex items-center gap-1.5 text-sm font-bold text-emerald-700"><Check size={14} className="shrink-0" /> 3 free AI generations included</span>
            <span className="flex items-center gap-1.5 text-sm font-bold text-emerald-700"><Check size={14} className="shrink-0" /> No charge for 7 days</span>
            <span className="flex items-center gap-1.5 text-sm font-bold text-emerald-700"><Check size={14} className="shrink-0" /> Cancel any time</span>
            <span className="flex items-center gap-1.5 text-sm font-bold text-slate-500"><Check size={14} className="shrink-0 text-emerald-500" /> Card required — not charged today</span>
          </div>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-3 bg-white border border-slate-200 rounded-2xl p-1.5 shadow-sm mb-12">
            <button
              onClick={() => setIsPricingAnnual(false)}
              className={`px-5 py-2 rounded-xl text-sm font-black transition-all ${!isPricingAnnual ? "bg-slate-900 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsPricingAnnual(true)}
              className={`px-5 py-2 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${isPricingAnnual ? "bg-slate-900 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              Annual
              <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Save 2 months</span>
            </button>
          </div>

          {/* Pricing cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
            {CS_PLANS.map((plan) => {
              const priceId = isPricingAnnual ? plan.annualPriceId : plan.monthlyPriceId;
              const price = isPricingAnnual ? plan.annualMonthly : plan.monthlyPrice;
              const isLoading = isPricingCheckoutLoading === priceId;
              const isPro = plan.key === "pro";
              return (
                <div
                  key={plan.key}
                  className={`relative bg-white rounded-3xl border-2 p-7 text-left flex flex-col shadow-sm transition-all hover:shadow-lg ${
                    isPro
                      ? "border-[#f80d5d] shadow-[#f80d5d]/10"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {isPro && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] text-white text-[10px] font-black uppercase tracking-wider px-4 py-1.5 rounded-full whitespace-nowrap shadow-lg">
                      Most Popular
                    </div>
                  )}
                  {(() => { const TierIcon = TIER_ICONS[plan.key]; return TierIcon ? <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#ffefe9] to-white border border-[#fda6e1]/30 flex items-center justify-center mb-3"><TierIcon size={18} className="text-[#f80d5d]" /></div> : null; })()}
                  <div className="text-sm font-black uppercase tracking-widest text-slate-400 mb-1">{plan.label}</div>
                  <div className="flex items-end gap-1.5 mb-1">
                    <span className="text-4xl font-black text-slate-900">${price}</span>
                    <span className="text-slate-400 font-medium text-sm mb-1.5">/mo</span>
                  </div>
                  {isPricingAnnual && (
                    <p className="text-xs text-emerald-600 font-bold mb-1">${plan.annualTotal}/yr · 2 months free</p>
                  )}
                  <p className="text-xs text-slate-400 font-semibold mb-5">{plan.gens} AI generations/month</p>

                  <ul className="space-y-2.5 mb-7 flex-1">
                    {(FEATURES_BY_TIER[plan.key] ?? []).map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                        <Check size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleCSCheckout(priceId)}
                    disabled={isLoading}
                    className={`w-full py-3.5 rounded-2xl font-black text-sm transition-all ${
                      isPro
                        ? "bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] text-white shadow-lg shadow-[#ff2429]/25 hover:shadow-xl hover:shadow-[#ff2429]/35"
                        : "bg-slate-900 text-white hover:bg-slate-800"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Redirecting...
                      </span>
                    ) : (
                      `Start free — try ${plan.label} →`
                    )}
                  </button>
                  <p className="text-center text-[11px] text-slate-400 mt-2.5 font-medium">7-day free trial · card required · cancel anytime</p>
                </div>
              );
            })}
          </div>

          {/* What you can create */}
          <div className="bg-white border border-slate-200 rounded-3xl p-8 text-left mb-10 shadow-sm">
            <h2 className="text-lg font-black text-slate-900 mb-5 text-center">What you can create with Creator Studio</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { icon: Layers, label: "Branded Carousels", desc: "Clean gradient slide decks" },
                { icon: Sparkles, label: "AI Carousels", desc: "Cards + cinematic AI art" },
                { icon: Wand2, label: "AI Posts", desc: "Copy + AI-generated image" },
                { icon: Search, label: "Content Ideas", desc: "8 niche-specific hooks" },
                { icon: Users, label: "Competitor Analysis", desc: "Find content gaps (Pro+)" },
                { icon: FileText, label: "Blog Articles", desc: "Full SEO posts (Max)" },
                { icon: Zap, label: "Image Generator", desc: "Pure AI photography (Pro+)" },
                { icon: Image, label: "Single Posts", desc: "Headline + caption cards" },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex flex-col items-center text-center p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <Icon size={20} className="text-[#f80d5d] mb-2" />
                  <div className="text-xs font-black text-slate-800">{label}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{desc}</div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-slate-400">
            Already subscribed?{" "}
            <a href="mailto:support@virallized.com" className="text-[#f80d5d] hover:underline font-bold">
              Contact support
            </a>{" "}
            and we'll sort it out right away.
          </p>
        </div>
      </div>
    );
  }

  const GRAD = brandGrad(brand);

  // ── Save generated content ────────────────────────────────────────────────
  const saveContent = async (res: GeneratedResult, title: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    let permanentImageUrl = "";
    if ((res.type === "carousel" || res.type === "single" || res.type === "ai-carousel" || res.type === "ai-single") && res.imageUrl) {
      try {
        const imgRes = await fetch(res.imageUrl);
        const blob = await imgRes.blob();
        const fileName = `${user.id}/${Date.now()}.jpg`;
        const { error: upErr } = await supabase.storage
          .from("generated-images")
          .upload(fileName, blob, { contentType: "image/jpeg" });
        if (!upErr) {
          const {
            data: { publicUrl },
          } = supabase.storage.from("generated-images").getPublicUrl(fileName);
          permanentImageUrl = publicUrl;
        }
      } catch (e) {
        console.error("Image upload failed:", e);
      }
    }

    const contentToSave = permanentImageUrl
      ? { ...res, imageUrl: permanentImageUrl }
      : res;

    const { data, error } = await supabase
      .from("generated_content")
      .insert({
        user_id: user.id,
        type: res.type,
        title: title.slice(0, 120),
        content: contentToSave,
        image_url: permanentImageUrl || null,
      })
      .select("*")
      .single();

    if (!error && data) {
      if (
        permanentImageUrl &&
        (res.type === "carousel" || res.type === "single" || res.type === "ai-carousel" || res.type === "ai-single")
      ) {
        setResult({ ...res, imageUrl: permanentImageUrl } as GeneratedResult);
      }
      setSavedItems((prev) => [
        {
          id: data.id,
          type: data.type as Mode,
          title: data.title,
          content: data.content as GeneratedResult,
          imageUrl: data.image_url ?? undefined,
          createdAt: data.created_at,
        },
        ...prev,
      ]);
    }
  };

  // ── PDF export ────────────────────────────────────────────────────────────
  const handleExportPDF = () => {
    if (result?.type !== "blog") return;
    const title = result.titleOptions[selectedTitle];
    const win = window.open("", "_blank");
    if (!win) return;
    win.document
      .write(`<!DOCTYPE html><html><head><title>${title}</title><style>
      body{font-family:Georgia,serif;max-width:780px;margin:40px auto;padding:24px;color:#1a1a1a;line-height:1.8}
      h1{font-size:2rem;margin-bottom:6px;color:#0f172a}
      .meta{color:#64748b;font-size:.85rem;margin-bottom:28px;padding-bottom:16px;border-bottom:1px solid #e2e8f0}
      h2{font-size:1.2rem;margin-top:28px;color:#0f172a;font-weight:800}
      p{margin:10px 0;font-size:.95rem}
      .tags{margin-top:28px;padding-top:16px;border-top:1px solid #e2e8f0}
      .tag{display:inline-block;background:#f1f5f9;padding:3px 10px;border-radius:20px;font-size:.78rem;margin:3px;color:#475569}
      @media print{body{margin:0}}
    </style></head><body>
      <h1>${title}</h1>
      <div class="meta"><b>SEO Meta:</b> ${result.metaDescription}</div>
      <p>${result.intro.replace(/\n\n/g, "</p><p>")}</p>
      ${result.sections.map((s) => `<h2>${s.heading}</h2><p>${s.body.replace(/\n\n/g, "</p><p>")}</p>`).join("")}
      <p>${result.conclusion.replace(/\n\n/g, "</p><p>")}</p>
      <div class="tags"><b>Tags: </b>${result.suggestedTags.map((t) => `<span class="tag">${t}</span>`).join("")}</div>
      <script>window.onload=()=>{window.print();}</script>
    </body></html>`);
    win.document.close();
  };

  // ── Step advancement during generation ───────────────────────────────────
  const GENERATION_STEPS: Record<Mode, string[]> = {
    carousel:     ["Analysing topic & brand context", "Structuring slides", "Writing copy & captions", "Finalising output"],
    single:       ["Analysing topic & brand context", "Crafting headline", "Writing caption & hashtags", "Finalising output"],
    "ai-carousel":["Analysing topic & brand context", "Generating background image", "Writing slide copy", "Crafting caption & hashtags"],
    "ai-single":  ["Analysing topic & brand context", "Generating post image", "Writing copy & caption", "Finalising output"],
    image:        ["Processing your prompt", "Generating image", "Applying quality refinements"],
    research:     ["Analysing your niche", "Identifying content opportunities", "Curating 8 topic ideas"],
    competitor:   ["Analysing competitor accounts", "Identifying content gaps", "Mapping opportunities"],
    blog:         ["Analysing topic & keywords", "Structuring article outline", "Writing sections", "Optimising for SEO"],
  };
  const MODE_DURATION: Record<Mode, number> = {
    carousel: 8000, single: 7000, "ai-carousel": 32000, "ai-single": 22000,
    image: 16000, research: 8000, competitor: 10000, blog: 16000,
  };

  // ── Generate ──────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (isGenerating) return;

    // Feature gate check
    if (!canAccessMode(mode)) {
      const minTier = MODE_MIN_TIER[mode] as "pro" | "max";
      setUpgradeTargetTier(minTier);
      setUpgradeReason("feature");
      setShowUpgradeModal(true);
      return;
    }

    // Generation limit check
    if (generationsThisMonth >= MONTHLY_LIMIT) {
      setUpgradeReason("limit");
      setShowUpgradeModal(true);
      return;
    }

    setIsGenerating(true);
    setResult(null);
    setError(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session)
        throw new Error("You must be logged in to generate content.");

      const payload: Record<string, unknown> = {
        action: mode,
        topic,
        tone,
        style,
      };
      if (mode === "carousel" || mode === "ai-carousel") payload.slideCount = slideCount;
      if (brand) payload.brand = { brandName: brand.brandName, primaryColor: brand.primaryColor, secondaryColor: brand.secondaryColor, accentColor: brand.accentColor, brandVoice: brand.brandVoice, businessDescription: brand.businessDescription, examplePostUrls: brand.examplePostUrls };
      if (elements.length > 0) payload.elements = elements.map(e => ({ base64: e.base64, description: e.description.trim() || e.name }));
      if (mode === "research") payload.handle = topic;
      if (mode === "competitor") {
        payload.competitors = competitors
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        payload.niche = topic;
      }

      const { data, error: fnErr } = await supabase.functions.invoke(
        "content-studio-generate",
        { body: payload },
      );
      if (fnErr) throw new Error(fnErr.message);
      if (data?.error) throw new Error(data.error);

      const newResult = {
        type: mode,
        ...data.data,
      } as GeneratedResult;
      setResult(newResult);
      setSelectedTitle(0);
      setGenerationsThisMonth((prev) => prev + 1);
      saveContent(newResult, topic).catch(console.error);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadComposited = async (
    imageUrl: string,
    headline: string,
    subheadline: string,
    logoUrl?: string,
  ) => {
    const W = 1080;
    const H = 1350; // 4:5
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const loadImg = async (src: string): Promise<HTMLImageElement> => {
      // Fetch as blob to avoid canvas CORS taint from cross-origin URLs
      try {
        const fetchRes = await fetch(src);
        const blob = await fetchRes.blob();
        const blobUrl = URL.createObjectURL(blob);
        return new Promise<HTMLImageElement>((resolve, reject) => {
          const img = document.createElement("img");
          img.onload = () => { URL.revokeObjectURL(blobUrl); resolve(img); };
          img.onerror = reject;
          img.src = blobUrl;
        });
      } catch {
        return new Promise<HTMLImageElement>((resolve, reject) => {
          const img = document.createElement("img");
          img.crossOrigin = "anonymous";
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = src;
        });
      }
    };

    // Background
    try {
      const bg = await loadImg(imageUrl);
      ctx.drawImage(bg, 0, 0, W, H);
    } catch {
      ctx.fillStyle = "#111";
      ctx.fillRect(0, 0, W, H);
    }

    // Gradient overlay
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, "rgba(0,0,0,0.15)");
    grad.addColorStop(1, "rgba(0,0,0,0.60)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Word-wrap helper
    const wrapText = (text: string, maxW: number, font: string) => {
      ctx.font = font;
      const words = text.split(" ");
      const lines: string[] = [];
      let line = "";
      for (const w of words) {
        const test = line ? `${line} ${w}` : w;
        if (ctx.measureText(test).width > maxW) { lines.push(line); line = w; }
        else line = test;
      }
      if (line) lines.push(line);
      return lines;
    };

    ctx.textAlign = "center";
    ctx.fillStyle = "white";

    // Headline
    const hlFont = "900 72px system-ui, sans-serif";
    const hlLines = wrapText(headline, W - 160, hlFont);
    const hlLineH = 84;
    const hlTotalH = hlLines.length * hlLineH;
    const startY = H / 2 - hlTotalH / 2 - 30;
    ctx.font = hlFont;
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 12;
    hlLines.forEach((l, i) => ctx.fillText(l, W / 2, startY + i * hlLineH));

    // Subheadline (wrapped)
    const shFont = "400 40px system-ui, sans-serif";
    const shLines = wrapText(subheadline, W - 180, shFont);
    const shLineH = 54;
    ctx.font = shFont;
    ctx.globalAlpha = 0.85;
    ctx.shadowBlur = 0;
    shLines.forEach((l, i) => ctx.fillText(l, W / 2, startY + hlTotalH + 56 + i * shLineH));
    ctx.globalAlpha = 1;

    // Logo with backdrop pill
    if (logoUrl) {
      try {
        const logo = await loadImg(logoUrl);
        const lh = 72;
        const lw = (logo.width / logo.height) * lh;
        const bPad = 16, bX = W - lw - 40 - bPad, bY = H - lh - 40 - bPad;
        ctx.fillStyle = "rgba(0,0,0,0.32)";
        ctx.beginPath();
        const r = 10;
        ctx.moveTo(bX + r, bY);
        ctx.lineTo(bX + lw + bPad * 2 - r, bY);
        ctx.quadraticCurveTo(bX + lw + bPad * 2, bY, bX + lw + bPad * 2, bY + r);
        ctx.lineTo(bX + lw + bPad * 2, bY + lh + bPad * 2 - r);
        ctx.quadraticCurveTo(bX + lw + bPad * 2, bY + lh + bPad * 2, bX + lw + bPad * 2 - r, bY + lh + bPad * 2);
        ctx.lineTo(bX + r, bY + lh + bPad * 2);
        ctx.quadraticCurveTo(bX, bY + lh + bPad * 2, bX, bY + lh + bPad * 2 - r);
        ctx.lineTo(bX, bY + r);
        ctx.quadraticCurveTo(bX, bY, bX + r, bY);
        ctx.closePath();
        ctx.fill();
        ctx.drawImage(logo, W - lw - 40, H - lh - 40, lw, lh);
      } catch { /* skip */ }
    }

    const a = document.createElement("a");
    a.download = "ai-post.png";
    a.href = canvas.toDataURL("image/png");
    a.click();
  };

  const downloadCarouselZip = async () => {
    if (!slides.length) return;
    const { default: JSZip } = await import("jszip");
    const zip = new JSZip();
    const [numStr, denStr] = aspectRatio.split("/");
    const W = 1080;
    const H = Math.round(W * parseInt(denStr) / parseInt(numStr));
    const gradColors: [string, string, string] = [
      brand?.primaryColor || "#ffae07",
      brand?.secondaryColor || "#ff2429",
      brand?.accentColor || "#f1078d",
    ];
    const bgUrl = (result?.type === "carousel" || result?.type === "ai-carousel") ? result.imageUrl : undefined;
    for (let i = 0; i < slides.length; i++) {
      const blob = await renderSlideToCanvas(slides[i], W, H, gradColors, bgUrl, brand?.logoUrl);
      zip.file(`slide-${String(i + 1).padStart(2, "0")}.png`, blob);
    }
    // Add caption + hashtags as text file
    if (result && (result.type === "carousel" || result.type === "ai-carousel")) {
      zip.file("caption.txt", `${result.caption}\n\n${result.hashtags}`);
    }
    const zipBlob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(topic || "carousel").replace(/\s+/g, "-").toLowerCase()}-slides.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copy = (text: string, which: "caption" | "hash") => {
    navigator.clipboard.writeText(text).catch(() => {});
    if (which === "caption") {
      setCopiedCaption(true);
      setTimeout(() => setCopiedCaption(false), 2000);
    } else {
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    }
  };

  const slides = (result?.type === "carousel" || result?.type === "ai-carousel") ? result.slides : [];

  // ── Topic label per mode ──────────────────────────────────────────────────
  const topicLabel: Record<Mode, string> = {
    carousel: "Topic",
    single: "Topic",
    "ai-carousel": "Topic",
    "ai-single": "Topic",
    image: "Image Description",
    research: "Your Instagram Handle",
    competitor: "Your Niche",
    blog: "Article Topic",
  };
  const topicPlaceholder: Record<Mode, string> = {
    carousel: "e.g. 5 Instagram growth mistakes to avoid",
    single: "e.g. Why consistency beats virality",
    "ai-carousel": "e.g. 5 morning habits that changed my life",
    "ai-single": "e.g. The power of showing up every day",
    image: "e.g. Aerial view of a coffee shop at golden hour, warm cinematic tones",
    research: "@yourusername",
    competitor: "e.g. social media marketing agency",
    blog: "e.g. How to grow on Instagram in 2025",
  };

  return (
    <div className="min-h-screen bg-[#fafafa] font-sans selection:bg-[#ffefe9] selection:text-[#f80d5d]">
      {/* ── Header ── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-6">
            <button
              className="lg:hidden p-2 -ml-1 rounded-xl hover:bg-slate-100 transition-colors"
              onClick={() => setIsMobileSidebarOpen(true)}
              aria-label="Open settings"
            >
              <SlidersHorizontal size={18} className="text-slate-600" />
            </button>
            <img
              src="/images/logos/virallized-main-logo.svg"
              alt="Virallized"
              className="h-6 sm:h-7"
            />
            <div className="hidden md:block w-px h-7 bg-slate-200" />
            <h1 className="hidden md:block text-base font-black text-slate-900 tracking-tight">
              Content Studio
            </h1>
            <span className="hidden md:inline text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-[#ffefe9] text-[#f80d5d]">
              Beta
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg transition-colors"
              title="View history"
            >
              <History size={14} />
              <span className="hidden sm:inline">History</span>
              {savedItems.length > 0 && (
                <span className="hidden sm:inline text-[10px] font-black bg-[#f80d5d] text-white rounded-full px-1.5 py-0.5 leading-none">
                  {savedItems.length}
                </span>
              )}
            </button>
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${generationsThisMonth >= MONTHLY_LIMIT ? "bg-red-50" : "bg-slate-100"}`}
            >
              <Zap
                size={12}
                className={
                  generationsThisMonth >= MONTHLY_LIMIT
                    ? "text-red-400"
                    : "text-[#ffae07]"
                }
                strokeWidth={2.5}
              />
              <span className="text-[11px] font-bold text-slate-700">
                <span
                  className={
                    generationsThisMonth >= MONTHLY_LIMIT
                      ? "text-red-500"
                      : "text-slate-900"
                  }
                >
                  {generationsThisMonth}
                </span>
                /{MONTHLY_LIMIT} generations
              </span>
            </div>
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 sm:px-4 py-2 rounded-lg transition-colors"
            >
              <LogOut size={13} />
              <span className="hidden sm:inline">Dashboard</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile mode tabs ── */}
      <div className="lg:hidden bg-white border-b border-slate-100 px-4 py-2 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {MODES.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setMode(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                mode === key
                  ? "bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] text-white shadow-sm"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              <Icon size={12} strokeWidth={2.5} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Mobile sidebar backdrop ── */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4 sm:py-6 flex gap-6 items-start">
        {/* ── Sidebar ── */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-50 w-[300px] bg-white flex flex-col gap-3 p-4 overflow-y-auto shadow-2xl
            transition-transform duration-300 ease-in-out
            lg:relative lg:inset-auto lg:z-auto lg:bg-transparent lg:shadow-none lg:p-0 lg:w-72 lg:shrink-0 lg:flex lg:flex-col lg:gap-4 lg:sticky lg:top-[80px] lg:translate-x-0 lg:max-h-[calc(100vh-100px)] lg:overflow-y-auto
            ${isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          `}
        >
          {/* Mobile drawer header */}
          <div className="lg:hidden flex items-center justify-between pb-3 border-b border-slate-100 mb-1">
            <span className="text-sm font-black text-slate-900">Settings</span>
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
            >
              <X size={14} className="text-slate-500" />
            </button>
          </div>
          {/* Mode — hidden on mobile (tabs above handle it) */}
          <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
              Mode
            </p>
            <div className="flex flex-col gap-0.5">
              {["Simple Cards", "AI Enhanced", "AI Tools"].map((group) => (
                <div key={group}>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-300 px-3 pt-3 pb-1.5">{group}</p>
                  {MODES.filter((m) => m.group === group).map(({ key, label, icon: Icon, desc }) => {
                    const locked = !canAccessMode(key);
                    const minTier = MODE_MIN_TIER[key];
                    return (
                      <button
                        key={key}
                        onClick={() => {
                          if (locked) {
                            setUpgradeTargetTier(minTier as "pro" | "max");
                            setUpgradeReason("feature");
                            setShowUpgradeModal(true);
                          } else {
                            setMode(key);
                          }
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all text-left ${
                          locked
                            ? "text-slate-400 hover:bg-slate-50"
                            : mode === key
                              ? "bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] text-white shadow-md shadow-[#ff2429]/20"
                              : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <Icon size={15} strokeWidth={2.5} className={locked ? "opacity-40" : ""} />
                        <div className="flex-1 min-w-0">
                          <div className="leading-tight flex items-center gap-1.5">
                            {label}
                            {locked && minTier && (
                              <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-gradient-to-r from-[#ffae07] to-[#f1078d] text-white uppercase tracking-wide">
                                {TIER_LABELS[minTier]}
                              </span>
                            )}
                          </div>
                          <div className={`text-[10px] font-medium leading-tight mt-0.5 ${mode === key ? "text-white/70" : "text-slate-400"}`}>{desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Mode — mobile only (inside drawer, full list) */}
          <div className="lg:hidden bg-slate-50 rounded-2xl p-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
              Mode
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {MODES.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => {
                    setMode(key);
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                    mode === key
                      ? "bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] text-white shadow-sm"
                      : "bg-white text-slate-600 border border-slate-200"
                  }`}
                >
                  <Icon size={13} strokeWidth={2.5} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Inputs */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                {topicLabel[mode]}
              </p>
              <textarea
                rows={3}
                placeholder={topicPlaceholder[mode]}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-sm p-3 resize-none outline-none focus:border-[#f80d5d]/40 focus:ring-2 focus:ring-[#f80d5d]/10 transition-all text-slate-900 placeholder:text-slate-400"
              />
              {mode !== "research" && mode !== "competitor" && mode !== "image" && (
                <div className="flex gap-2 mt-2 flex-wrap">
                  <button
                    onClick={() =>
                      setTopic("Surprise me — pick a trending topic")
                    }
                    className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
                  >
                    <Shuffle size={11} />
                    Surprise me
                  </button>
                  <button className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
                    <Lightbulb size={11} />
                    Suggest topics
                  </button>
                </div>
              )}

              {/* How it works accordion */}
              <button
                onClick={() => setHowItWorksOpen(!howItWorksOpen)}
                className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-[#f80d5d] transition-colors mt-1"
              >
                <HelpCircle size={11} />
                How does this work?
                <ChevronDown
                  size={11}
                  className={`transition-transform duration-200 ${howItWorksOpen ? "rotate-180" : ""}`}
                />
              </button>
              {howItWorksOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-[#ffefe9]/60 border border-[#fda6e1]/30 rounded-xl p-3 overflow-hidden"
                >
                  <p className="text-[11px] text-slate-600 leading-relaxed mb-2">
                    {HOW_IT_WORKS[mode].what}
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {HOW_IT_WORKS[mode].tips.map((tip, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#f80d5d] shrink-0 mt-1.5" />
                        <p className="text-[10px] text-slate-500 leading-relaxed">
                          {tip}
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {mode === "competitor" && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                  Competitor Handles
                </p>
                <input
                  type="text"
                  placeholder="@handle1, @handle2, @handle3"
                  value={competitors}
                  onChange={(e) => setCompetitors(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl text-sm p-3 outline-none focus:border-[#f80d5d]/40 focus:ring-2 focus:ring-[#f80d5d]/10 transition-all text-slate-900 placeholder:text-slate-400"
                />
                <p className="text-[10px] text-slate-400 mt-1.5">
                  Separate up to 3 handles with commas
                </p>
              </div>
            )}
          </div>

          {/* Elements upload */}
          {mode !== "research" && mode !== "competitor" && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Elements</p>
                {elements.length < 5 && (
                  <label className="cursor-pointer flex items-center gap-1 text-xs font-bold text-[#f80d5d] hover:opacity-70 transition-opacity">
                    <Plus size={11} />Add
                    <input ref={elementInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleElementUpload} />
                  </label>
                )}
              </div>
              {elements.length === 0 ? (
                <p className="text-[11px] text-slate-400 leading-relaxed">Upload logos, product photos, etc. — AI will incorporate them into the content.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {elements.map((el) => (
                    <div key={el.id} className="flex items-center gap-2 bg-slate-50 rounded-xl border border-slate-100 p-2">
                      <img src={el.base64} alt={el.name} className="w-9 h-9 object-cover rounded-lg shrink-0 border border-slate-200" />
                      <input
                        type="text"
                        value={el.description}
                        onChange={(e) => setElements((prev) => prev.map((x) => x.id === el.id ? { ...x, description: e.target.value } : x))}
                        placeholder="Describe this (e.g. company logo)…"
                        className="flex-1 min-w-0 text-[11px] bg-transparent outline-none text-slate-700 placeholder:text-slate-400"
                      />
                      <button onClick={() => setElements((prev) => prev.filter((x) => x.id !== el.id))} className="text-slate-300 hover:text-red-400 transition-colors shrink-0">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  {elements.length < 5 && (
                    <label className="cursor-pointer flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-[#f80d5d] transition-colors">
                      <Plus size={11} />Add another
                      <input type="file" accept="image/*" multiple className="hidden" onChange={handleElementUpload} />
                    </label>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tone + Style (not for research/competitor) */}
          {mode !== "research" && mode !== "competitor" && mode !== "image" && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2.5">
                  Tone
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {TONES.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTone(t)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all ${
                        tone === t
                          ? "bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] text-white shadow-sm shadow-[#ff2429]/20"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {mode !== "blog" && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2.5">
                    Visual Style
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {STYLES.map((s) => (
                      <button
                        key={s}
                        onClick={() => setStyle(s)}
                        className={`py-2 rounded-xl text-xs font-bold transition-all ${
                          style === s
                            ? "bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] text-white shadow-sm shadow-[#ff2429]/20"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {(mode === "carousel" || mode === "ai-carousel") && (
                <>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2.5">
                      Slide Count
                    </p>
                    <div className="grid grid-cols-6 gap-1">
                      {SLIDE_COUNTS.map((n) => (
                        <button
                          key={n}
                          onClick={() => setSlideCount(n)}
                          className={`py-2 rounded-xl text-xs font-black transition-all ${
                            slideCount === n
                              ? "bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] text-white shadow-sm shadow-[#ff2429]/20"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2.5">
                      Aspect Ratio
                    </p>
                    <div className="grid grid-cols-4 gap-1.5">
                      {ASPECT_RATIOS.map(({ label, value, desc }) => (
                        <button
                          key={value}
                          onClick={() => setAspectRatio(value)}
                          className={`flex flex-col items-center py-2 rounded-xl text-[10px] font-black transition-all ${
                            aspectRatio === value
                              ? "bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] text-white shadow-sm shadow-[#ff2429]/20"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          <span>{label}</span>
                          <span className={`text-[8px] font-medium mt-0.5 ${aspectRatio === value ? "text-white/70" : "text-slate-400"}`}>{desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Low-balance warning */}
          {MONTHLY_LIMIT > 0 && generationsThisMonth / MONTHLY_LIMIT >= 0.8 && generationsThisMonth < MONTHLY_LIMIT && (
            <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-amber-50 border border-amber-200 mb-3">
              <div className="flex items-center gap-2 min-w-0">
                <Zap size={13} className="text-amber-500 shrink-0" />
                <span className="text-[12px] font-bold text-amber-700 truncate">
                  {MONTHLY_LIMIT - generationsThisMonth} generation{MONTHLY_LIMIT - generationsThisMonth !== 1 ? "s" : ""} left
                </span>
              </div>
              <button
                onClick={handleTopup}
                disabled={isTopupLoading}
                className="shrink-0 text-[11px] font-black text-white bg-gradient-to-r from-[#ffae07] to-[#f1078d] px-2.5 py-1 rounded-lg whitespace-nowrap disabled:opacity-60"
              >
                {isTopupLoading ? "…" : "+ Buy 10 more"}
              </button>
            </div>
          )}

          {/* Generate */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className={`w-full py-3.5 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-2 transition-all ${
              isGenerating
                ? "bg-slate-300 cursor-not-allowed"
                : !canAccessMode(mode) || generationsThisMonth >= MONTHLY_LIMIT
                  ? "bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] opacity-70 hover:opacity-100 active:scale-[0.98]"
                  : "bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] shadow-lg shadow-[#ff2429]/25 hover:shadow-xl hover:shadow-[#ff2429]/30 active:scale-[0.98]"
            }`}
          >
            {isGenerating ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles size={15} />
                </motion.div>
                Generating…
              </>
            ) : !canAccessMode(mode) ? (
              <>
                <Sparkles size={15} />
                Upgrade to {TIER_LABELS[MODE_MIN_TIER[mode]!]} to unlock
              </>
            ) : generationsThisMonth >= MONTHLY_LIMIT ? (
              <>
                <Zap size={15} />
                Monthly limit reached
              </>
            ) : (
              <>
                <Sparkles size={15} />
                {mode === "research"
                  ? "Research Topics"
                  : mode === "competitor"
                    ? "Analyse Competitors"
                    : mode === "blog"
                      ? "Write Article"
                      : mode === "image"
                        ? "Generate Image"
                        : mode === "ai-carousel"
                          ? "Generate AI Carousel"
                          : mode === "ai-single"
                            ? "Generate AI Post"
                            : "Generate Content"}
              </>
            )}
          </button>

          {/* Brand Kit */}
          <button
            onClick={() => setIsBrandKitOpen(true)}
            className="w-full flex items-center gap-3 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 hover:border-[#f80d5d]/40 hover:shadow-md transition-all text-left"
          >
            {brand?.logoUrl ? (
              <img
                src={brand.logoUrl}
                alt="logo"
                className="w-9 h-9 rounded-xl object-contain border border-slate-200 bg-slate-50 shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#ffefe9] to-white border border-[#fda6e1]/40 flex items-center justify-center shrink-0">
                <Palette size={16} className="text-[#f80d5d]" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-slate-900">
                {brand?.brandName || "Set up Brand Kit"}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {brand?.brandName
                  ? "Logo · Colors · Voice"
                  : "Logo, colors, brand voice"}
              </p>
            </div>
            <ChevronRight size={13} className="text-slate-400 shrink-0" />
          </button>

        </aside>

        {/* ── Main ── */}
        <div className="flex-1 min-w-0 pb-24 lg:pb-0">
          <AnimatePresence mode="wait">
            {/* Generating */}
            {isGenerating && (
              <motion.div
                key="generating"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="w-full"
              >
                {/* Progress bar */}
                <div className="w-full h-[2px] bg-slate-100 rounded-full overflow-hidden mb-8">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: GRAD }}
                    initial={{ width: "0%" }}
                    animate={{ width: "88%" }}
                    transition={{ duration: MODE_DURATION[mode] / 1000 * 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
                  />
                </div>

                <div className="flex flex-col gap-8">
                  {/* Header */}
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">
                      {mode === "blog" ? "Writing article" : mode === "research" ? "Researching topics" : mode === "competitor" ? "Analysing competitors" : mode === "image" ? "Generating image" : mode === "ai-carousel" ? `Generating AI carousel` : mode === "ai-single" ? "Generating AI post" : "Generating content"}
                    </h3>
                    <p className="text-sm text-slate-400 mt-1">
                      {mode === "ai-carousel" ? `${slideCount} slides · custom background image · caption` : mode === "ai-single" ? "Post image · headline · caption · hashtags" : mode === "blog" ? "Introduction · sections · meta · tags" : mode === "carousel" ? `${slideCount} slides · caption · hashtags` : "This usually takes a few seconds"}
                    </p>
                  </div>

                  {/* Step tracker */}
                  <div className="flex flex-col gap-3">
                    {GENERATION_STEPS[mode].map((step, i) => {
                      const done = i < generatingStep;
                      const active = i === generatingStep;
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -4 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.06 }}
                          className="flex items-center gap-3"
                        >
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all duration-500 ${done ? "bg-emerald-500" : active ? "border-2 border-slate-300" : "border-2 border-slate-200"}`}>
                            {done ? (
                              <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            ) : active ? (
                              <motion.div
                                className="w-2 h-2 rounded-full bg-slate-400"
                                animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                              />
                            ) : null}
                          </div>
                          <span className={`text-sm transition-all duration-300 ${done ? "text-slate-400 line-through decoration-slate-300" : active ? "text-slate-900 font-semibold" : "text-slate-400"}`}>
                            {step}
                          </span>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Skeleton preview */}
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 overflow-hidden">
                    {(mode === "carousel" || mode === "ai-carousel") ? (
                      <div className="grid gap-2.5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))" }}>
                        {Array.from({ length: slideCount }).map((_, i) => (
                          <motion.div
                            key={i}
                            className="rounded-xl bg-slate-200/70"
                            style={{ aspectRatio: "1/1" }}
                            animate={{ opacity: [0.4, 0.7, 0.4] }}
                            transition={{ duration: 1.8, delay: i * 0.08, repeat: Infinity, ease: "easeInOut" }}
                          />
                        ))}
                      </div>
                    ) : mode === "single" || mode === "ai-single" ? (
                      <div className="flex gap-4">
                        <motion.div className="rounded-xl bg-slate-200/70 shrink-0" style={{ width: 80, height: 80 }}
                          animate={{ opacity: [0.4, 0.7, 0.4] }} transition={{ duration: 1.8, repeat: Infinity }} />
                        <div className="flex flex-col gap-2 flex-1 justify-center">
                          <motion.div className="h-3.5 rounded-full bg-slate-200/70 w-3/4"
                            animate={{ opacity: [0.4, 0.7, 0.4] }} transition={{ duration: 1.8, delay: 0.1, repeat: Infinity }} />
                          <motion.div className="h-2.5 rounded-full bg-slate-200/70 w-full"
                            animate={{ opacity: [0.4, 0.7, 0.4] }} transition={{ duration: 1.8, delay: 0.2, repeat: Infinity }} />
                          <motion.div className="h-2.5 rounded-full bg-slate-200/70 w-2/3"
                            animate={{ opacity: [0.4, 0.7, 0.4] }} transition={{ duration: 1.8, delay: 0.3, repeat: Infinity }} />
                        </div>
                      </div>
                    ) : mode === "image" ? (
                      <motion.div className="rounded-xl bg-slate-200/70 w-full aspect-square max-w-[140px] mx-auto"
                        animate={{ opacity: [0.4, 0.7, 0.4] }} transition={{ duration: 1.8, repeat: Infinity }} />
                    ) : (
                      <div className="flex flex-col gap-2.5">
                        {[1, 0.9, 0.75, 0.85, 0.6].map((w, i) => (
                          <motion.div key={i} className="h-2.5 rounded-full bg-slate-200/70"
                            style={{ width: `${w * 100}%` }}
                            animate={{ opacity: [0.4, 0.7, 0.4] }}
                            transition={{ duration: 1.8, delay: i * 0.1, repeat: Infinity }} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Error */}
            {error && !isGenerating && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-24 gap-4 text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center">
                  <AlertCircle size={26} className="text-red-400" />
                </div>
                <div>
                  <p className="font-black text-lg text-slate-900">
                    Generation failed
                  </p>
                  <p className="text-sm text-slate-500 mt-1 max-w-sm">
                    {error}
                  </p>
                </div>
                <button
                  onClick={handleGenerate}
                  className="flex items-center gap-2 text-sm font-bold text-white bg-gradient-to-r from-[#ffae07] to-[#f1078d] px-5 py-2.5 rounded-xl"
                >
                  <RotateCcw size={13} />
                  Try again
                </button>
              </motion.div>
            )}

            {/* Empty state */}
            {!result && !isGenerating && !error && (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-28 gap-5 text-center"
              >
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#ffefe9] to-white border border-[#fda6e1]/40 flex items-center justify-center shadow-sm">
                  <Wand2 size={30} className="text-[#f80d5d]" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900">
                    What will you create today?
                  </h2>
                  <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">
                    Choose a mode on the left, enter your topic, and let AI do
                    the heavy lifting.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center max-w-md">
                  {SUGGESTED.map((s) => (
                    <button
                      key={s}
                      onClick={() => setTopic(s)}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white border border-slate-200 text-slate-600 hover:border-[#f80d5d]/40 hover:text-[#f80d5d] transition-colors shadow-sm"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── CAROUSEL RESULT ── */}
            {result?.type === "carousel" && !isGenerating && (
              <motion.div
                key="carousel-result"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="font-black text-slate-900 text-lg">
                      {slides.length} Slides Generated
                    </h2>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {tone} · {style} · Click any slide to zoom
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleGenerate}
                      className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 px-3 py-2 rounded-xl transition-colors shadow-sm"
                    >
                      <RotateCcw size={12} />
                      Regenerate
                    </button>
                    <button onClick={downloadCarouselZip} className="flex items-center gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] px-4 py-2 rounded-xl shadow-sm shadow-[#ff2429]/20">
                      <Download size={12} />
                      Download ZIP
                    </button>
                  </div>
                </div>

                <div
                  className="grid gap-3"
                  style={{
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(160px, 1fr))",
                  }}
                >
                  {slides.map((slide, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.04 }}
                      className="relative group cursor-pointer"
                      onClick={() => setLightboxIdx(i)}
                    >
                      <SlideCard
                        slide={slide}
                        small
                        grad={GRAD}
                        logoUrl={brand?.logoUrl}
                        bgImageUrl={result.type === "carousel" ? result.imageUrl : undefined}
                      />
                      <div className="absolute inset-0 rounded-2xl bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <ZoomIn size={20} color="white" />
                      </div>
                      <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-black/50 flex items-center justify-center text-[9px] font-black text-white">
                        {i + 1}
                      </div>
                    </motion.div>
                  ))}
                  <button
                    className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 hover:border-[#f80d5d]/40 hover:text-[#f80d5d] text-slate-400 transition-colors"
                    style={{ aspectRatio: "1/1" }}
                  >
                    <Plus size={20} />
                    <span className="text-xs font-bold">Add slide</span>
                  </button>
                </div>

                {result.imageUrl && (
                  <div className="mt-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Image
                          size={13}
                          className="text-[#f80d5d]"
                          strokeWidth={2.5}
                        />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          AI Generated Background
                        </span>
                      </div>
                      <a
                        href={result.imageUrl}
                        download
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
                      >
                        <Download size={12} />
                        Download
                      </a>
                    </div>
                    <img
                      src={result.imageUrl}
                      alt="AI generated background"
                      className="w-full rounded-xl object-cover"
                      style={{ maxHeight: 320 }}
                    />
                  </div>
                )}

                <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <AlignLeft
                          size={14}
                          className="text-[#f80d5d]"
                          strokeWidth={2.5}
                        />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Caption
                        </span>
                      </div>
                      <button
                        onClick={() => copy(result.caption, "caption")}
                        className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
                      >
                        {copiedCaption ? (
                          <Check size={12} className="text-emerald-500" />
                        ) : (
                          <Copy size={12} />
                        )}
                        {copiedCaption ? "Copied!" : "Copy"}
                      </button>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                      {result.caption}
                    </p>
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Hash
                          size={14}
                          className="text-[#f80d5d]"
                          strokeWidth={2.5}
                        />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Hashtags
                        </span>
                      </div>
                      <button
                        onClick={() => copy(result.hashtags, "hash")}
                        className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
                      >
                        {copiedHash ? (
                          <Check size={12} className="text-emerald-500" />
                        ) : (
                          <Copy size={12} />
                        )}
                        {copiedHash ? "Copied!" : "Copy"}
                      </button>
                    </div>
                    <p
                      className="text-sm leading-loose"
                      style={{
                        background: GRAD,
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      {result.hashtags}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-3 bg-[#ffefe9] border border-[#fda6e1]/40 rounded-2xl p-4">
                  <TrendingUp
                    size={16}
                    className="text-[#f80d5d] shrink-0"
                    strokeWidth={2.5}
                  />
                  <p className="text-sm font-medium text-slate-700 flex-1">
                    Not the angle you wanted? Regenerate for a fresh take — uses
                    1 credit.
                  </p>
                  <button
                    onClick={handleGenerate}
                    className="shrink-0 flex items-center gap-1.5 text-xs font-black text-white bg-gradient-to-r from-[#ffae07] to-[#f1078d] px-3 py-2 rounded-xl"
                  >
                    <RotateCcw size={11} />
                    Try again
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── AI CAROUSEL RESULT ── */}
            {result?.type === "ai-carousel" && !isGenerating && (
              <motion.div key="ai-carousel-result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-black text-slate-900 text-lg">{slides.length} AI-Enhanced Slides</h2>
                    <p className="text-[11px] text-slate-400 mt-0.5">{tone} · {style} · Click any slide to zoom</p>
                  </div>
                  <div className="flex gap-2">
                    {result.imageUrl && (
                      <a href={result.imageUrl} download target="_blank" rel="noreferrer"
                        className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 bg-white border border-slate-200 px-3 py-2 rounded-xl shadow-sm transition-colors">
                        <Download size={12} />Background
                      </a>
                    )}
                    <button onClick={handleGenerate} className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 px-3 py-2 rounded-xl shadow-sm">
                      <RotateCcw size={12} />Regenerate
                    </button>
                  </div>
                </div>
                <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
                  {slides.map((slide, i) => (
                    <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}
                      className="relative group cursor-pointer" onClick={() => setLightboxIdx(i)}>
                      <SlideCard slide={slide} small grad={GRAD} logoUrl={brand?.logoUrl} bgImageUrl={result.imageUrl} />
                      <div className="absolute inset-0 rounded-2xl bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <ZoomIn size={20} color="white" />
                      </div>
                      <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-black/50 flex items-center justify-center text-[9px] font-black text-white">{i + 1}</div>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2"><AlignLeft size={14} className="text-[#f80d5d]" strokeWidth={2.5} /><span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Caption</span></div>
                      <button onClick={() => copy(result.caption, "caption")} className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors">
                        {copiedCaption ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}{copiedCaption ? "Copied!" : "Copy"}
                      </button>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{result.caption}</p>
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2"><Hash size={14} className="text-[#f80d5d]" strokeWidth={2.5} /><span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Hashtags</span></div>
                      <button onClick={() => copy(result.hashtags, "hash")} className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors">
                        {copiedHash ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}{copiedHash ? "Copied!" : "Copy"}
                      </button>
                    </div>
                    <p className="text-sm leading-loose" style={{ background: GRAD, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{result.hashtags}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── AI SINGLE POST RESULT ── */}
            {result?.type === "ai-single" && !isGenerating && (
              <motion.div key="ai-single-result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-black text-slate-900 text-lg">AI Post Generated</h2>
                  <button onClick={handleGenerate} className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 px-3 py-2 rounded-xl shadow-sm">
                    <RotateCcw size={12} />Regenerate
                  </button>
                </div>
                {/* Full AI image with text overlay */}
                <div className="rounded-2xl overflow-hidden relative flex flex-col items-center justify-center text-white text-center shadow-xl" style={{ aspectRatio: "4/5" }}>
                  {result.imageUrl && (
                    <div className="absolute inset-0" style={{ backgroundImage: `url(${result.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }} />
                  )}
                  <div className="absolute inset-0" style={{ background: result.imageUrl ? "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 100%)" : GRAD }} />
                  <div className="relative z-10 p-10">
                    <div className="font-black text-3xl leading-tight drop-shadow-lg">{result.headline}</div>
                    <div className="font-medium opacity-90 mt-3 text-lg drop-shadow">{result.subheadline}</div>
                    <div className="mt-6 w-12 h-[3px] bg-white/60 rounded-full mx-auto" />
                    {brand?.logoUrl && <img src={brand.logoUrl} alt="logo" className="absolute bottom-3 right-3 h-9 object-contain max-w-[90px] drop-shadow-lg" />}
                  </div>
                </div>
                <div className="mt-3 flex gap-2 justify-end">
                  {result.imageUrl && (
                    <button
                      onClick={() => downloadComposited(result.imageUrl!, result.headline, result.subheadline, brand?.logoUrl)}
                      className="flex items-center gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] px-3 py-2 rounded-xl shadow-sm transition-colors"
                    >
                      <Download size={12} />Download Post
                    </button>
                  )}
                  {result.imageUrl && (
                    <a href={result.imageUrl} download target="_blank" rel="noreferrer"
                      className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 bg-white border border-slate-200 px-3 py-2 rounded-xl shadow-sm transition-colors">
                      <Download size={12} />Image only
                    </a>
                  )}
                </div>
                <div className="mt-4 grid grid-cols-1 gap-4">
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2"><AlignLeft size={14} className="text-[#f80d5d]" strokeWidth={2.5} /><span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Caption</span></div>
                      <button onClick={() => copy(result.caption, "caption")} className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors">
                        {copiedCaption ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}{copiedCaption ? "Copied!" : "Copy"}
                      </button>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{result.caption}</p>
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2"><Hash size={14} className="text-[#f80d5d]" strokeWidth={2.5} /><span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Hashtags</span></div>
                      <button onClick={() => copy(result.hashtags, "hash")} className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors">
                        {copiedHash ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}{copiedHash ? "Copied!" : "Copy"}
                      </button>
                    </div>
                    <p className="text-sm leading-loose" style={{ background: GRAD, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{result.hashtags}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── SINGLE IMAGE RESULT ── */}
            {result?.type === "single" && !isGenerating && (
              <motion.div
                key="single-result"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-xl"
              >
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-black text-slate-900 text-lg">
                    Single Image Generated
                  </h2>
                  <button
                    onClick={handleGenerate}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 px-3 py-2 rounded-xl shadow-sm"
                  >
                    <RotateCcw size={12} />
                    Regenerate
                  </button>
                </div>

                {/* Preview slide */}
                <div
                  className="rounded-2xl overflow-hidden relative flex flex-col items-center justify-center text-white text-center"
                  style={{ aspectRatio: "1/1" }}
                >
                  {result.imageUrl && (
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundImage: `url(${result.imageUrl})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    />
                  )}
                  <div
                    className="absolute inset-0"
                    style={{
                      background: GRAD,
                      opacity: result.imageUrl ? 0.78 : 1,
                    }}
                  />
                  <div className="relative z-10 p-10">
                    <div className="font-black text-3xl leading-tight">
                      {result.headline}
                    </div>
                    <div className="font-medium opacity-80 mt-3 text-lg">
                      {result.subheadline}
                    </div>
                    <div className="mt-6 w-12 h-[3px] bg-white/40 rounded-full mx-auto" />
                    {brand?.logoUrl && (
                      <img
                        src={brand.logoUrl}
                        alt="logo"
                        className="absolute bottom-3 right-3 h-9 object-contain max-w-[90px] drop-shadow-lg"
                      />
                    )}
                  </div>
                </div>

                {result.imageUrl && (
                  <div className="mt-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Image
                          size={13}
                          className="text-[#f80d5d]"
                          strokeWidth={2.5}
                        />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          AI Generated Image
                        </span>
                      </div>
                      <a
                        href={result.imageUrl}
                        download
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
                      >
                        <Download size={12} />
                        Download
                      </a>
                    </div>
                    <img
                      src={result.imageUrl}
                      alt="AI generated image"
                      className="w-full rounded-xl object-cover"
                    />
                  </div>
                )}

                <div className="mt-4 grid grid-cols-1 gap-4">
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <AlignLeft
                          size={14}
                          className="text-[#f80d5d]"
                          strokeWidth={2.5}
                        />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Caption
                        </span>
                      </div>
                      <button
                        onClick={() => copy(result.caption, "caption")}
                        className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
                      >
                        {copiedCaption ? (
                          <Check size={12} className="text-emerald-500" />
                        ) : (
                          <Copy size={12} />
                        )}
                        {copiedCaption ? "Copied!" : "Copy"}
                      </button>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                      {result.caption}
                    </p>
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Hash
                          size={14}
                          className="text-[#f80d5d]"
                          strokeWidth={2.5}
                        />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Hashtags
                        </span>
                      </div>
                      <button
                        onClick={() => copy(result.hashtags, "hash")}
                        className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
                      >
                        {copiedHash ? (
                          <Check size={12} className="text-emerald-500" />
                        ) : (
                          <Copy size={12} />
                        )}
                        {copiedHash ? "Copied!" : "Copy"}
                      </button>
                    </div>
                    <p
                      className="text-sm leading-loose"
                      style={{
                        background: GRAD,
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      {result.hashtags}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── RESEARCH RESULT ── */}
            {result?.type === "research" && !isGenerating && (
              <motion.div
                key="research-result"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="font-black text-slate-900 text-lg">
                      {result.topics.length} Content Ideas
                    </h2>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Click any idea to use it as your carousel topic
                    </p>
                  </div>
                  <button
                    onClick={handleGenerate}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 px-3 py-2 rounded-xl shadow-sm"
                  >
                    <RotateCcw size={12} />
                    Refresh ideas
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {result.topics.map((t, i) => (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      onClick={() => {
                        setTopic(t.title);
                        setMode("carousel");
                        setResult(null);
                      }}
                      className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 text-left hover:border-[#f80d5d]/40 hover:shadow-md transition-all group"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-sm font-black text-slate-900">
                          {t.title}
                        </span>
                        <span
                          className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            t.format === "Carousel"
                              ? "bg-[#ffefe9] text-[#f80d5d]"
                              : t.format === "Reel"
                                ? "bg-purple-50 text-purple-600"
                                : "bg-blue-50 text-blue-600"
                          }`}
                        >
                          {t.format}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 italic mb-2">
                        "{t.hook}"
                      </p>
                      <p className="text-[11px] text-slate-400">{t.why}</p>
                      <div className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-[#f80d5d] opacity-0 group-hover:opacity-100 transition-opacity">
                        <Wand2 size={11} />
                        Use this topic
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── COMPETITOR RESULT ── */}
            {result?.type === "competitor" && !isGenerating && (
              <motion.div
                key="competitor-result"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-black text-slate-900 text-lg">
                    Competitor Analysis
                  </h2>
                  <button
                    onClick={handleGenerate}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 px-3 py-2 rounded-xl shadow-sm"
                  >
                    <RotateCcw size={12} />
                    Re-analyse
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Search
                        size={14}
                        className="text-[#f80d5d]"
                        strokeWidth={2.5}
                      />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Content Gaps
                      </span>
                    </div>
                    <div className="flex flex-col gap-2">
                      {result.gaps.map((g, i) => (
                        <div key={i} className="flex items-start gap-2.5">
                          <div
                            className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-[9px] font-black text-white mt-0.5"
                            style={{ background: GRAD }}
                          >
                            {i + 1}
                          </div>
                          <p className="text-sm text-slate-700">{g}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <TrendingUp
                          size={14}
                          className="text-[#f80d5d]"
                          strokeWidth={2.5}
                        />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Your Opportunities
                        </span>
                      </div>
                      <div className="flex flex-col gap-3">
                        {result.opportunities.map((o, i) => (
                          <div key={i}>
                            <p className="text-xs font-black text-slate-900">
                              {o.angle}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {o.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <Mic2
                          size={14}
                          className="text-[#f80d5d]"
                          strokeWidth={2.5}
                        />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Top Formats for You
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {result.topFormats.map((f, i) => (
                          <span
                            key={i}
                            className="text-xs font-bold px-3 py-1.5 rounded-full bg-[#ffefe9] text-[#f80d5d]"
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── IMAGE RESULT ── */}
            {result?.type === "image" && !isGenerating && (
              <motion.div key="image-result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="font-black text-slate-900 text-lg">AI Image Generated</h2>
                    <p className="text-[11px] text-slate-400 mt-0.5">AI Image · 1024 × 1024</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleGenerate}
                      className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 px-3 py-2 rounded-xl shadow-sm">
                      <RotateCcw size={12} />Regenerate
                    </button>
                    <a href={result.imageUrl} download target="_blank" rel="noreferrer"
                      className="flex items-center gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] px-4 py-2 rounded-xl shadow-sm shadow-[#ff2429]/20">
                      <Download size={12} />Download
                    </a>
                  </div>
                </div>
                <img
                  src={result.imageUrl}
                  alt="AI generated"
                  className="w-full rounded-2xl shadow-xl border border-slate-200"
                />
                <div className="mt-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Prompt used</p>
                  <p className="text-xs text-slate-500 leading-relaxed">{result.prompt}</p>
                </div>
                <div className="mt-3 flex items-center gap-3 bg-[#ffefe9] border border-[#fda6e1]/40 rounded-2xl p-4">
                  <TrendingUp size={15} className="text-[#f80d5d] shrink-0" strokeWidth={2.5} />
                  <p className="text-sm font-medium text-slate-700 flex-1">Want to use this as a slide background? Switch to Carousel or Single Image mode and generate — the same style will apply automatically.</p>
                </div>
              </motion.div>
            )}

            {/* ── BLOG RESULT ── */}
            {result?.type === "blog" && !isGenerating && (
              <motion.div
                key="blog-result"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="font-black text-slate-900 text-lg">
                      Blog Article Generated
                    </h2>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Pick a title, then open in Blog Editor to publish
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleGenerate}
                      className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 px-3 py-2 rounded-xl shadow-sm"
                    >
                      <RotateCcw size={12} />
                      Regenerate
                    </button>
                    <button
                      onClick={handleExportPDF}
                      className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 px-4 py-2 rounded-xl shadow-sm transition-colors"
                    >
                      <Download size={12} />
                      Download PDF
                    </button>
                    <button
                      onClick={() => navigate("/blog-admin")}
                      className="flex items-center gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] px-4 py-2 rounded-xl shadow-sm shadow-[#ff2429]/20"
                    >
                      <ExternalLink size={12} />
                      Open in Blog Editor
                    </button>
                  </div>
                </div>

                {/* Title options */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                    Choose a Title
                  </p>
                  <div className="flex flex-col gap-2">
                    {result.titleOptions.map((title, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedTitle(i)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-left transition-all ${
                          selectedTitle === i
                            ? "bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] text-white shadow-sm"
                            : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${selectedTitle === i ? "bg-white/30 text-white" : "bg-slate-200 text-slate-500"}`}
                        >
                          {i + 1}
                        </span>
                        {title}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Meta description */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Search size={13} className="text-[#f80d5d]" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      SEO Meta Description
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">
                    {result.metaDescription}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-2">
                    {result.metaDescription.length} / 155 characters
                  </p>
                </div>

                {/* Article body */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-4">
                  <div className="prose prose-sm max-w-none">
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line mb-6">
                      {result.intro}
                    </p>
                    {result.sections.map((s, i) => (
                      <div key={i} className="mb-6">
                        <h3 className="text-base font-black text-slate-900 mb-2">
                          {s.heading}
                        </h3>
                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                          {s.body}
                        </p>
                      </div>
                    ))}
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                      {result.conclusion}
                    </p>
                  </div>
                </div>

                {/* Tags */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Tag size={13} className="text-[#f80d5d]" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Suggested Tags
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {result.suggestedTags.map((tag, i) => (
                      <span
                        key={i}
                        className="text-xs font-bold px-3 py-1.5 rounded-full bg-slate-100 text-slate-600"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── History Panel ── */}
      <AnimatePresence>
        {isHistoryOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => setIsHistoryOpen(false)}
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-[320px] sm:w-[360px] bg-white shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#ffefe9] to-white border border-[#fda6e1]/40 flex items-center justify-center">
                    <History size={14} className="text-[#f80d5d]" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900">History</p>
                    <p className="text-[10px] text-slate-400">{savedItems.length} saved generations</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsHistoryOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
                >
                  <X size={14} className="text-slate-500" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {savedItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                      <History size={22} className="text-slate-300" />
                    </div>
                    <p className="text-sm font-bold text-slate-400">Nothing here yet</p>
                    <p className="text-xs text-slate-400">Your generated content will appear here</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {savedItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setResult(item.content);
                          _setMode(item.type);
                          setTopic(item.title);
                          setError(null);
                          setIsHistoryOpen(false);
                        }}
                        className="flex items-start gap-3 px-3.5 py-3 rounded-2xl bg-slate-50 hover:bg-[#ffefe9]/60 border border-slate-100 hover:border-[#fda6e1]/40 transition-all text-left group"
                      >
                        <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                          {item.type === "carousel" && <Layers size={13} className="text-[#f80d5d]" />}
                          {item.type === "single" && <Image size={13} className="text-[#f80d5d]" />}
                          {item.type === "image" && <Sparkles size={13} className="text-[#f80d5d]" />}
                          {item.type === "research" && <Search size={13} className="text-[#f80d5d]" />}
                          {item.type === "competitor" && <Users size={13} className="text-[#f80d5d]" />}
                          {item.type === "blog" && <FileText size={13} className="text-[#f80d5d]" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">{item.title}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] font-bold text-slate-400 capitalize">{item.type}</span>
                            <span className="text-[10px] text-slate-300">·</span>
                            <span className="text-[10px] text-slate-400">{new Date(item.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <ChevronRight size={13} className="text-slate-300 group-hover:text-[#f80d5d] transition-colors shrink-0 mt-1" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Mobile sticky generate bar ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 shadow-lg">
        {/* Low-balance strip */}
        {MONTHLY_LIMIT > 0 && generationsThisMonth / MONTHLY_LIMIT >= 0.8 && generationsThisMonth < MONTHLY_LIMIT && (
          <div className="flex items-center justify-between gap-2 px-4 py-2 bg-amber-50 border-b border-amber-100">
            <div className="flex items-center gap-1.5">
              <Zap size={11} className="text-amber-500 shrink-0" />
              <span className="text-[11px] font-bold text-amber-700">
                {MONTHLY_LIMIT - generationsThisMonth} gen{MONTHLY_LIMIT - generationsThisMonth !== 1 ? "s" : ""} left
              </span>
            </div>
            <button
              onClick={handleTopup}
              disabled={isTopupLoading}
              className="text-[10px] font-black text-white bg-gradient-to-r from-[#ffae07] to-[#f1078d] px-2 py-1 rounded-lg disabled:opacity-60"
            >
              {isTopupLoading ? "…" : "+ Buy 10"}
            </button>
          </div>
        )}
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1.5 rounded-lg shrink-0">
            <Zap
              size={11}
              className={
                generationsThisMonth >= MONTHLY_LIMIT
                  ? "text-red-400"
                  : "text-[#ffae07]"
              }
              strokeWidth={2.5}
            />
            <span className="text-[10px] font-bold text-slate-600">
              <span
                className={
                  generationsThisMonth >= MONTHLY_LIMIT
                    ? "text-red-500"
                    : "text-slate-900"
                }
              >
                {generationsThisMonth}
              </span>
              /{MONTHLY_LIMIT}
            </span>
          </div>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className={`flex-1 py-3 rounded-xl font-black text-sm text-white flex items-center justify-center gap-2 transition-all ${
              isGenerating
                ? "bg-slate-300 cursor-not-allowed"
                : !canAccessMode(mode) || generationsThisMonth >= MONTHLY_LIMIT
                  ? "bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] opacity-70 hover:opacity-100 active:scale-[0.98]"
                  : "bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] shadow-md shadow-[#ff2429]/20 active:scale-[0.98]"
            }`}
          >
            {isGenerating ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles size={14} />
                </motion.div>
                Generating…
              </>
            ) : !canAccessMode(mode) ? (
              <>
                <Sparkles size={14} />
                Upgrade to {TIER_LABELS[MODE_MIN_TIER[mode]!]}
              </>
            ) : generationsThisMonth >= MONTHLY_LIMIT ? (
              <>
                <Zap size={14} />
                Limit reached
              </>
            ) : (
              <>
                <Sparkles size={14} />
                {mode === "research"
                  ? "Research Topics"
                  : mode === "competitor"
                    ? "Analyse Competitors"
                    : mode === "blog"
                      ? "Write Article"
                      : mode === "image"
                        ? "Generate Image"
                        : mode === "ai-carousel"
                          ? "Generate AI Carousel"
                          : mode === "ai-single"
                            ? "Generate AI Post"
                            : "Generate Content"}
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Lightbox ── */}
      <AnimatePresence>
        {lightboxIdx !== null && slides.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{
              background: "rgba(15,23,42,0.8)",
              backdropFilter: "blur(4px)",
            }}
            onClick={() => setLightboxIdx(null)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="relative"
              style={{ width: 400, maxWidth: "90vw" }}
              onClick={(e) => e.stopPropagation()}
            >
              <SlideCard
                slide={slides[lightboxIdx]}
                grad={GRAD}
                logoUrl={brand?.logoUrl}
                bgImageUrl={
                  result?.type === "carousel" ? result.imageUrl : undefined
                }
                aspectRatio={aspectRatio}
              />
              <button
                onClick={() => setLightboxIdx(null)}
                className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors shadow-lg"
              >
                <X size={14} color="white" />
              </button>
              <div className="flex items-center justify-between mt-4">
                <button
                  onClick={() => setLightboxIdx(Math.max(0, lightboxIdx - 1))}
                  disabled={lightboxIdx === 0}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 disabled:opacity-30 transition-colors"
                >
                  ← Prev
                </button>
                <span className="text-xs font-bold text-slate-400">
                  {lightboxIdx + 1} / {slides.length}
                </span>
                <button
                  onClick={() =>
                    setLightboxIdx(Math.min(slides.length - 1, lightboxIdx + 1))
                  }
                  disabled={lightboxIdx === slides.length - 1}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 disabled:opacity-30 transition-colors"
                >
                  Next →
                </button>
              </div>
              <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                {slides.map((slide, i) => (
                  <div
                    key={i}
                    className="shrink-0 rounded-lg overflow-hidden cursor-pointer transition-all"
                    style={{
                      width: 44,
                      height: 44,
                      outline:
                        i === lightboxIdx
                          ? "2px solid #f80d5d"
                          : "2px solid transparent",
                      outlineOffset: 2,
                    }}
                    onClick={() => setLightboxIdx(i)}
                  >
                    <SlideCard slide={slide} small grad={GRAD} />
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Brand Kit Modal ── */}
      <AnimatePresence>
        {isBrandKitOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8 overflow-y-auto"
            style={{
              background: "rgba(15,23,42,0.7)",
              backdropFilter: "blur(4px)",
            }}
            onClick={() => setIsBrandKitOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#ffefe9] to-white border border-[#fda6e1]/40 flex items-center justify-center">
                    <Palette size={16} className="text-[#f80d5d]" />
                  </div>
                  <div>
                    <h2 className="font-black text-slate-900">Brand Kit</h2>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Set once — applied to every generation
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsBrandKitOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
                >
                  <X size={14} className="text-slate-500" />
                </button>
              </div>

              <div className="p-6 flex flex-col gap-5">
                {/* Logo + Brand Name */}
                <div className="flex items-start gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                      Logo
                    </p>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoUpload}
                    />
                    <button
                      onClick={() => logoInputRef.current?.click()}
                      className="w-20 h-20 rounded-2xl border-2 border-dashed border-slate-200 hover:border-[#f80d5d]/40 flex flex-col items-center justify-center gap-1 transition-colors overflow-hidden relative"
                    >
                      {isUploadingLogo ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                        >
                          <Sparkles size={18} className="text-[#f80d5d]" />
                        </motion.div>
                      ) : brandDraft.logoUrl ? (
                        <img
                          src={brandDraft.logoUrl}
                          alt="logo"
                          className="w-full h-full object-contain p-2"
                        />
                      ) : (
                        <>
                          <Upload size={16} className="text-slate-400" />
                          <span className="text-[10px] text-slate-400 font-semibold">
                            Upload
                          </span>
                        </>
                      )}
                    </button>
                    {brandDraft.logoUrl && (
                      <button
                        onClick={() =>
                          setBrandDraft((d) => ({ ...d, logoUrl: "" }))
                        }
                        className="flex items-center gap-1 mt-1.5 text-[10px] text-slate-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={10} />
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                      Brand Name
                    </p>
                    <input
                      type="text"
                      placeholder="e.g. Acme Agency"
                      value={brandDraft.brandName}
                      onChange={(e) =>
                        setBrandDraft((d) => ({
                          ...d,
                          brandName: e.target.value,
                        }))
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl text-sm p-3 outline-none focus:border-[#f80d5d]/40 focus:ring-2 focus:ring-[#f80d5d]/10 transition-all text-slate-900 placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Brand Colors */}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2.5">
                    Brand Colors
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {(
                      ["primaryColor", "secondaryColor", "accentColor"] as const
                    ).map((key, i) => (
                      <div key={key}>
                        <p className="text-[10px] text-slate-400 mb-1.5">
                          {["Primary", "Secondary", "Accent"][i]}
                        </p>
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                          <input
                            type="color"
                            value={brandDraft[key]}
                            onChange={(e) =>
                              setBrandDraft((d) => ({
                                ...d,
                                [key]: e.target.value,
                              }))
                            }
                            className="w-6 h-6 rounded-md cursor-pointer border-0 bg-transparent p-0"
                          />
                          <input
                            type="text"
                            value={brandDraft[key]}
                            onChange={(e) =>
                              setBrandDraft((d) => ({
                                ...d,
                                [key]: e.target.value,
                              }))
                            }
                            className="flex-1 bg-transparent text-xs font-mono text-slate-700 outline-none w-0"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Live preview */}
                  <div
                    className="mt-3 h-8 rounded-xl"
                    style={{
                      background: `linear-gradient(to right, ${brandDraft.primaryColor}, ${brandDraft.secondaryColor}, ${brandDraft.accentColor})`,
                    }}
                  />
                </div>

                {/* Business Description */}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    What does your business do?
                  </p>
                  <p className="text-[10px] text-slate-400 mb-2">This helps AI generate relevant content — be specific about your industry.</p>
                  <textarea
                    rows={2}
                    placeholder="e.g. 'We sell and operate vending machines stocked with ramen noodles across Sydney. We are in the vending machine industry, not a restaurant.'"
                    value={brandDraft.businessDescription}
                    onChange={(e) =>
                      setBrandDraft((d) => ({ ...d, businessDescription: e.target.value }))
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-sm p-3 resize-none outline-none focus:border-[#f80d5d]/40 focus:ring-2 focus:ring-[#f80d5d]/10 transition-all placeholder:text-slate-400"
                  />
                </div>

                {/* Brand Voice */}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    Brand Voice
                  </p>
                  <textarea
                    rows={3}
                    placeholder="Describe your brand's tone and personality. e.g. 'Direct, no-nonsense, speaks to busy entrepreneurs. Uses short sentences. Avoids jargon.'"
                    value={brandDraft.brandVoice}
                    onChange={(e) =>
                      setBrandDraft((d) => ({
                        ...d,
                        brandVoice: e.target.value,
                      }))
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-sm p-3 resize-none outline-none focus:border-[#f80d5d]/40 focus:ring-2 focus:ring-[#f80d5d]/10 transition-all text-slate-900 placeholder:text-slate-400"
                  />
                </div>

                {/* Example Posts */}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                    Example Posts{" "}
                    <span className="normal-case font-medium">(up to 3)</span>
                  </p>
                  <p className="text-[11px] text-slate-400 mb-2.5">
                    AI will analyse these to match your content style
                  </p>
                  <input
                    ref={postInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleExamplePostUpload}
                  />
                  <div className="flex gap-2 flex-wrap">
                    {brandDraft.examplePostUrls.map((url, i) => (
                      <div
                        key={i}
                        className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 group"
                      >
                        <img
                          src={url}
                          alt={`example ${i + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() =>
                            setBrandDraft((d) => ({
                              ...d,
                              examplePostUrls: d.examplePostUrls.filter(
                                (_, j) => j !== i,
                              ),
                            }))
                          }
                          className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={14} color="white" />
                        </button>
                      </div>
                    ))}
                    {brandDraft.examplePostUrls.length < 3 && (
                      <button
                        onClick={() => postInputRef.current?.click()}
                        disabled={isUploadingPost}
                        className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-200 hover:border-[#f80d5d]/40 flex flex-col items-center justify-center gap-1 transition-colors"
                      >
                        {isUploadingPost ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              ease: "linear",
                            }}
                          >
                            <Sparkles size={14} className="text-[#f80d5d]" />
                          </motion.div>
                        ) : (
                          <>
                            <Plus size={16} className="text-slate-400" />
                            <span className="text-[10px] text-slate-400 font-semibold">
                              Add
                            </span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Save */}
                <button
                  onClick={handleSaveBrand}
                  disabled={isSavingBrand}
                  className={`w-full py-3.5 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-2 transition-all ${
                    isSavingBrand
                      ? "bg-slate-300 cursor-not-allowed"
                      : brandSaved
                        ? "bg-emerald-500"
                        : "bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] shadow-lg shadow-[#ff2429]/25"
                  }`}
                >
                  {brandSaved ? (
                    <>
                      <Check size={15} />
                      Saved!
                    </>
                  ) : isSavingBrand ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      >
                        <Save size={15} />
                      </motion.div>
                      Saving…
                    </>
                  ) : (
                    <>
                      <Save size={15} />
                      Save Brand Kit
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Upgrade Modal ── */}
      <AnimatePresence>
        {showUpgradeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center px-4"
            style={{ background: "rgba(15,23,42,0.75)", backdropFilter: "blur(6px)" }}
            onClick={() => setShowUpgradeModal(false)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.92, y: 20, opacity: 0 }}
              transition={{ type: "spring", damping: 22, stiffness: 300 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-7 text-center relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X size={16} />
              </button>

              {upgradeReason === "limit" ? (
                <>
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-50 to-rose-50 border border-rose-100 flex items-center justify-center mx-auto mb-4">
                    <Zap size={26} className="text-[#f80d5d]" />
                  </div>
                  <h2 className="text-xl font-black text-slate-900 mb-2">Generation limit reached</h2>
                  <p className="text-sm text-slate-500 mb-5">
                    You've used all <strong>{MONTHLY_LIMIT}</strong> generations for this period.
                    Upgrade your plan for more, or grab a quick top-up.
                  </p>
                  <div className="flex flex-col gap-2.5">
                    <button
                      onClick={handleTopup}
                      disabled={isTopupLoading}
                      className="w-full py-3.5 rounded-2xl font-black text-sm text-white bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] shadow-lg shadow-[#ff2429]/25 hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {isTopupLoading ? (
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                          <Zap size={15} />
                        </motion.div>
                      ) : (
                        <Plus size={15} />
                      )}
                      +10 Generations — $19
                    </button>
                    <button
                      onClick={() => { setShowUpgradeModal(false); setShowPricingModal(true); }}
                      className="w-full py-3 rounded-2xl font-black text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                    >
                      <ChevronRight size={15} />
                      Upgrade Plan
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-50 to-rose-50 border border-rose-100 flex items-center justify-center mx-auto mb-4">
                    <Sparkles size={26} className="text-[#f80d5d]" />
                  </div>
                  <h2 className="text-xl font-black text-slate-900 mb-1">
                    {upgradeTargetTier === "max" ? "Max" : "Pro"} feature
                  </h2>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-[#ffae07] to-[#f1078d] text-white text-xs font-black mb-4">
                    <Sparkles size={11} />
                    {upgradeTargetTier === "max" ? "Max Plan" : "Pro Plan"} required
                  </div>
                  <p className="text-sm text-slate-500 mb-5">
                    {upgradeTargetTier === "max"
                      ? "Blog Article and Competitor Analysis are available on the Max plan."
                      : "AI Carousel, AI Post, and Generate Image are available on the Pro plan and above."}
                    {" "}Upgrade to unlock.
                  </p>
                  <button
                    onClick={() => { setShowUpgradeModal(false); setShowPricingModal(true); }}
                    className="w-full py-3.5 rounded-2xl font-black text-sm text-white bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] shadow-lg shadow-[#ff2429]/25 hover:shadow-xl transition-all flex items-center justify-center gap-2"
                  >
                    <ChevronRight size={15} />
                    View Plans & Upgrade
                  </button>
                  <button
                    onClick={() => setShowUpgradeModal(false)}
                    className="mt-2.5 w-full py-3 rounded-2xl font-bold text-sm text-slate-500 hover:text-slate-700 transition-colors"
                  >
                    Maybe later
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Creator Studio Pricing Modal ── */}
      <AnimatePresence>
        {showPricingModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto py-8 px-4"
            style={{ background: "rgba(15,23,42,0.8)", backdropFilter: "blur(6px)" }}
            onClick={() => setShowPricingModal(false)}
          >
            <motion.div
              initial={{ scale: 0.94, y: 24, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.94, y: 24, opacity: 0 }}
              transition={{ type: "spring", damping: 22, stiffness: 280 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl p-6 lg:p-8 relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close */}
              <button
                onClick={() => setShowPricingModal(false)}
                className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors z-10"
              >
                <X size={18} />
              </button>

              {/* Header */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#ffae07]/10 to-[#f1078d]/10 border border-[#f1078d]/20 mb-3">
                  <Sparkles size={13} className="text-[#f80d5d]" />
                  <span className="text-xs font-black text-[#f80d5d] uppercase tracking-wide">Creator Studio</span>
                </div>
                <h2 className="text-2xl lg:text-3xl font-black text-slate-900 mb-1">Upgrade your plan</h2>
                <p className="text-sm text-slate-500">Use code <span className="font-black text-[#f80d5d]">EARLYBIRD</span> at checkout for <strong>40% off monthly</strong> — locked in forever.</p>
              </div>

              {/* Monthly / Annual toggle */}
              <div className="flex items-center justify-center gap-4 mb-7">
                <button
                  onClick={() => setIsPricingAnnual(false)}
                  className={`text-sm font-black transition-colors ${!isPricingAnnual ? "text-slate-900" : "text-slate-400 hover:text-slate-600"}`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setIsPricingAnnual(!isPricingAnnual)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${isPricingAnnual ? "bg-gradient-to-r from-[#ffae07] to-[#f1078d]" : "bg-slate-200"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isPricingAnnual ? "translate-x-5" : "translate-x-0"}`} />
                </button>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setIsPricingAnnual(true)}
                    className={`text-sm font-black transition-colors ${isPricingAnnual ? "text-slate-900" : "text-slate-400 hover:text-slate-600"}`}
                  >
                    Annual
                  </button>
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">2 months free</span>
                </div>
              </div>

              {/* Plan cards */}
              <div className="grid sm:grid-cols-3 gap-4">
                {CS_PLANS.map((plan) => {
                  const isPro = plan.key === "pro";
                  const isCurrent = planTier === plan.key;
                  const displayPrice = isPricingAnnual ? plan.annualMonthly : plan.monthlyPrice;
                  const priceId = isPricingAnnual ? plan.annualPriceId : plan.monthlyPriceId;
                  const loading = isPricingCheckoutLoading === priceId;

                  return (
                    <div
                      key={plan.key}
                      className={`relative rounded-2xl flex flex-col ${
                        isPro
                          ? "p-[2px] bg-gradient-to-b from-[#ffae07] via-[#ff2429] to-[#f1078d]"
                          : "border border-slate-200"
                      }`}
                    >
                      <div className={`flex flex-col h-full rounded-[14px] p-5 ${isPro ? "bg-white" : "bg-white"}`}>
                        {/* Badge */}
                        <div className={`self-start text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full mb-3 ${
                          isPro
                            ? "bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] text-white"
                            : "bg-slate-100 text-slate-500"
                        }`}>
                          {isCurrent ? "Current Plan" : plan.badge}
                        </div>

                        <h3 className="text-xl font-black text-slate-900 mb-0.5">{plan.label}</h3>
                        <p className="text-xs text-slate-400 mb-3">{plan.gens} gens / month · {plan.profiles} brand profile{plan.profiles > 1 ? "s" : ""}</p>

                        {/* Price */}
                        <div className="flex items-baseline gap-1 mb-1">
                          <span className="text-3xl font-black text-slate-900">${displayPrice}</span>
                          <span className="text-sm text-slate-400 font-medium">/mo</span>
                        </div>
                        {isPricingAnnual && (
                          <p className="text-[11px] text-slate-400 mb-4">
                            <span className="line-through text-slate-300">${plan.monthlyPrice}/mo</span>{" "}
                            billed ${plan.annualTotal}/yr
                          </p>
                        )}
                        {!isPricingAnnual && (
                          <p className="text-[11px] text-[#f80d5d] font-bold mb-4">Use EARLYBIRD for ${Math.round(plan.monthlyPrice * 0.6)}/mo</p>
                        )}

                        {/* Features */}
                        <ul className="space-y-2 mb-5 flex-1">
                          {plan.features.map((f, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs font-medium text-slate-600">
                              <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                                <Check size={9} className="text-emerald-600" strokeWidth={3} />
                              </div>
                              {f}
                            </li>
                          ))}
                        </ul>

                        {/* CTA */}
                        <button
                          onClick={() => !isCurrent && handleCSCheckout(priceId)}
                          disabled={loading || isCurrent}
                          className={`w-full py-3 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 ${
                            isCurrent
                              ? "bg-slate-100 text-slate-400 cursor-default"
                              : isPro
                                ? "bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] text-white shadow-lg shadow-[#ff2429]/25 hover:shadow-xl hover:shadow-[#ff2429]/30 active:scale-[0.98]"
                                : "bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.98]"
                          } disabled:opacity-60`}
                        >
                          {loading ? (
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                              <Sparkles size={14} />
                            </motion.div>
                          ) : isCurrent ? (
                            "Current Plan"
                          ) : (
                            `Get ${plan.label} →`
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Topup option */}
              <div className="mt-5 flex items-center justify-between gap-4 px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div>
                  <p className="text-sm font-black text-slate-900">Need a quick top-up instead?</p>
                  <p className="text-xs text-slate-500 mt-0.5">+10 generations added instantly, expires with your current period.</p>
                </div>
                <button
                  onClick={handleTopup}
                  disabled={isTopupLoading}
                  className="shrink-0 px-4 py-2.5 rounded-xl font-black text-sm text-white bg-gradient-to-r from-[#ffae07] to-[#f1078d] shadow-md hover:shadow-lg transition-all disabled:opacity-60 whitespace-nowrap"
                >
                  {isTopupLoading ? "…" : "+10 Gens — $19"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Topup success toast ── */}
      <AnimatePresence>
        {showTopupSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-emerald-500 text-white shadow-xl shadow-emerald-500/30"
          >
            <Check size={18} />
            <span className="font-black text-sm">+10 generations added!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

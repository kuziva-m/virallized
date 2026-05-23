import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Layers, Sparkles, Wand2, Search, Users, FileText, Zap, Palette,
  CheckCircle2, ChevronDown, ArrowRight,
} from "lucide-react";
import SEO from "../components/SEO";
import { toast } from "../lib/toast";

const CS_PLANS = [
  {
    key: "standard",
    label: "Standard",
    badge: null,
    monthlyPrice: 49,
    annualMonthly: 24,
    annualTotal: 290,
    gens: 20,
    profiles: 1,
    monthlyPriceId: "price_1TZnFpHDWey36HYKKaJt7JvB",
    annualPriceId: "price_1TZnFrHDWey36HYKhIl3mx9c",
    features: [
      "20 AI generations / month",
      "Branded carousels & single posts",
      "Content research (8 ideas/run)",
      "1 brand profile",
      "Priority support",
    ],
  },
  {
    key: "pro",
    label: "Pro",
    badge: "Most Popular",
    monthlyPrice: 89,
    annualMonthly: 49,
    annualTotal: 590,
    gens: 60,
    profiles: 3,
    monthlyPriceId: "price_1TZnFqHDWey36HYKLtGVCVsQ",
    annualPriceId: "price_1TZnFsHDWey36HYKzXYL8xOe",
    features: [
      "60 AI generations / month",
      "Everything in Standard",
      "AI Carousel & AI Post (cinematic)",
      "AI Image Generator",
      "Competitor analysis",
      "3 brand profiles",
    ],
  },
  {
    key: "max",
    label: "Max",
    badge: "Full Power",
    monthlyPrice: 199,
    annualMonthly: 107,
    annualTotal: 1290,
    gens: 175,
    profiles: 10,
    monthlyPriceId: "price_1TZnFrHDWey36HYKcrGY46aS",
    annualPriceId: "price_1TZnFsHDWey36HYKW6k7hNYi",
    features: [
      "175 AI generations / month",
      "Everything in Pro",
      "Blog article writer (SEO-ready)",
      "10 brand profiles",
      "White-label PDF exports",
      "Dedicated account manager",
    ],
  },
] as const;

const FEATURES = [
  {
    icon: Layers,
    title: "Branded Carousels",
    desc: "Full slide decks built with your brand colours, fonts and logo. Ready to post in seconds.",
    badge: null,
  },
  {
    icon: Sparkles,
    title: "AI Carousels",
    desc: "Every slide gets a cinematic AI-generated background. Premium editorial look, zero design effort.",
    badge: "Pro+",
  },
  {
    icon: Wand2,
    title: "AI Posts",
    desc: "Compelling caption copy paired with a stunning AI-created editorial image — one click.",
    badge: "Pro+",
  },
  {
    icon: Search,
    title: "Content Research",
    desc: "8 data-backed content ideas tailored to your exact niche, audience and trending formats.",
    badge: null,
  },
  {
    icon: Users,
    title: "Competitor Analysis",
    desc: "Uncover exactly what your competitors post, when they post it, and the gaps you can dominate.",
    badge: "Pro+",
  },
  {
    icon: FileText,
    title: "Blog Articles",
    desc: "Full SEO-ready articles with meta titles, tags and structured sections. Export as PDF.",
    badge: "Max",
  },
  {
    icon: Zap,
    title: "Image Generator",
    desc: "Pure cinematic AI photography — use standalone or as post and carousel backgrounds.",
    badge: "Pro+",
  },
  {
    icon: Palette,
    title: "Brand Kit",
    desc: "Set your colours, logo, fonts and voice once. Every output stays on-brand automatically.",
    badge: null,
  },
];

const FAQS = [
  {
    q: "Do I need to be a Virallized growth client to use Creator Studio?",
    a: "No — Creator Studio is completely standalone. Anyone can sign up for a plan, whether or not they're on a growth package.",
  },
  {
    q: "What is a 'generation'?",
    a: "A generation is one complete content output: a carousel, an AI post, a set of 8 research ideas, a competitor report, or a blog article. Each counts as one generation.",
  },
  {
    q: "What happens during the 7-day free trial?",
    a: "You get immediate access to Creator Studio and 3 free generations to try it out. Your card is saved but not charged until the 7-day trial ends. Cancel any time before then and you'll never pay a cent.",
  },
  {
    q: "What is the EARLYBIRD code?",
    a: "EARLYBIRD gives you 40% off all monthly plans — permanently. It's a limited offer for our earliest subscribers. Enter the code at checkout before it expires.",
  },
  {
    q: "Can I switch plans later?",
    a: "Yes. You can upgrade or downgrade your Creator Studio plan at any time. Prorated credits are applied automatically.",
  },
  {
    q: "What's included in a Brand Profile?",
    a: "A brand profile stores your logo, colour palette, brand voice, tone of voice and example content. Every generation automatically uses this profile so your output is always on-brand.",
  },
  {
    q: "Is there a contract or lock-in?",
    a: "No contracts. Monthly plans can be cancelled any time. Annual plans come with a prorated refund for unused months if you're not satisfied.",
  },
];

const STEPS = [
  {
    num: "01",
    title: "Set up your Brand Kit",
    desc: "Upload your logo, set your colours and write your brand voice. Takes 2 minutes. Creator Studio uses this for every output.",
  },
  {
    num: "02",
    title: "Pick your content type",
    desc: "Choose from Branded Carousel, AI Post, Content Research, Competitor Analysis, Blog Article or Image Generator.",
  },
  {
    num: "03",
    title: "Generate, edit & export",
    desc: "Your content is ready in seconds. Edit if you like, then download or copy directly to your scheduler.",
  },
];

export default function CreatorStudioPage() {
  const [annual, setAnnual] = useState(false);
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleCheckout = async (priceId: string) => {
    setLoadingPriceId(priceId);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ priceId, isCreatorStudio: true, trialDays: 7 }),
        },
      );
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else toast.error("Something went wrong. Please try again.");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoadingPriceId(null);
    }
  };

  return (
    <>
      <SEO
        title="Creator Studio | Virallized"
        description="AI content generation built for Instagram growth accounts. Carousels, posts, blog articles, competitor intelligence — generated in seconds, branded to you."
        path="/creator-studio"
      />

      <div className="min-h-screen bg-[#fafafa] font-sans selection:bg-[#ffefe9] selection:text-[#f80d5d]">

        {/* ── HEADER ────────────────────────────────────────────────────────── */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
          <div className="container mx-auto px-6 h-16 md:h-20 flex items-center justify-between max-w-[90rem]">
            <Link to="/">
              <img src="/images/logos/virallized-main-logo.svg" alt="Virallized" className="h-6 md:h-8" />
            </Link>
            <div className="flex items-center gap-4">
              <Link
                to="/#pricing"
                className="hidden sm:block text-xs md:text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors"
              >
                ← Growth Plans
              </Link>
              <Link
                to="/login"
                className="bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] text-white px-4 py-2 md:px-5 md:py-2.5 rounded-xl font-bold text-xs md:text-sm hover:opacity-90 transition-opacity shadow-md"
              >
                Log in
              </Link>
            </div>
          </div>
        </header>

        {/* ── HERO ──────────────────────────────────────────────────────────── */}
        <section className="relative bg-white overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-28">
          {/* Soft gradient orbs */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-[#ffae07]/10 via-[#ff2429]/8 to-[#f1078d]/10 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-[350px] h-[350px] rounded-full bg-gradient-to-tr from-[#f1078d]/8 to-[#ffae07]/6 blur-3xl" />
          </div>

          <div className="relative container mx-auto px-6 max-w-5xl text-center">
            {/* Badge */}
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#ffae07]/10 via-[#ff2429]/10 to-[#f1078d]/10 border border-[#f80d5d]/20 text-[#f80d5d] text-[11px] font-black uppercase tracking-widest px-4 py-2 rounded-full">
                <Sparkles size={12} />
                Powered by Virallized AI
                <span className="bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide">New</span>
              </div>
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-6xl lg:text-[4.5rem] font-black text-slate-900 leading-[1.05] tracking-tight mb-6">
              Your growth is handled.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d]">
                Now make content to match.
              </span>
            </h1>

            <p className="text-lg md:text-xl text-slate-500 leading-relaxed max-w-2xl mx-auto mb-10">
              Creator Studio is the AI content engine built for Instagram growth accounts. Carousels, posts, blog articles, competitor intelligence — generated in seconds, always on-brand.
            </p>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <a
                href="#pricing"
                className="bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] text-white px-8 py-4 rounded-2xl font-black text-base shadow-xl shadow-[#ff2429]/20 hover:opacity-90 transition-opacity flex items-center gap-2"
              >
                Start free trial <ArrowRight size={16} />
              </a>
              <Link
                to="/login"
                className="text-slate-600 font-bold text-sm hover:text-slate-900 transition-colors underline underline-offset-4"
              >
                Already have an account? Log in →
              </Link>
            </div>

            {/* Trust bar */}
            <div className="inline-flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-semibold text-slate-500">
              {[
                "3 free AI generations on trial",
                "No charge for 7 days",
                "Cancel any time",
                "Card required — not charged today",
              ].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0" /> {t}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── EARLYBIRD BANNER ──────────────────────────────────────────────── */}
        <div className="bg-gradient-to-r from-[#ffae07]/10 via-[#ff2429]/8 to-[#f1078d]/10 border-y border-[#f80d5d]/15 py-4">
          <div className="container mx-auto px-6 max-w-4xl flex flex-col sm:flex-row items-center justify-center gap-3 text-center sm:text-left">
            <span className="text-xl">🎉</span>
            <p className="text-sm text-slate-600">
              <span className="font-black text-slate-900">Early adopter offer: </span>
              Use code{" "}
              <code className="font-black text-[#f80d5d] bg-[#fff1f2] px-2 py-0.5 rounded-lg">EARLYBIRD</code>
              {" "}at checkout for{" "}
              <span className="font-black text-slate-900">40% off monthly plans — locked in forever.</span>
              <span className="text-slate-500"> Limited spots.</span>
            </p>
          </div>
        </div>

        {/* ── WHAT IS CREATOR STUDIO ────────────────────────────────────────── */}
        <section className="py-20 lg:py-28 bg-white">
          <div className="container mx-auto px-6 max-w-[90rem]">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <p className="text-[11px] font-black uppercase tracking-widest text-[#f80d5d] mb-4">What is Creator Studio?</p>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 leading-tight tracking-tight mb-5">
                Every content format you need,<br className="hidden md:block" /> generated in one place.
              </h2>
              <p className="text-base md:text-lg text-slate-500 leading-relaxed">
                Creator Studio plugs straight into your Virallized brand kit and turns your niche, audience and goals into scroll-stopping Instagram content — no design skills required.
              </p>
            </div>

            {/* Feature grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
              {FEATURES.map(({ icon: Icon, title, desc, badge }) => (
                <div
                  key={title}
                  className="bg-[#fafafa] border border-slate-100 rounded-2xl p-6 hover:border-[#f80d5d]/25 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ffefe9] to-white border border-[#fda6e1]/30 flex items-center justify-center shadow-sm">
                      <Icon size={18} className="text-[#f80d5d]" />
                    </div>
                    {badge && (
                      <span className="text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                        {badge}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-black text-slate-900 mb-1.5">{title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ──────────────────────────────────────────────────── */}
        <section className="py-20 lg:py-28 bg-[#fafafa] border-y border-slate-100">
          <div className="container mx-auto px-6 max-w-5xl">
            <div className="text-center mb-14">
              <p className="text-[11px] font-black uppercase tracking-widest text-[#f80d5d] mb-4">How it works</p>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                From brand kit to finished content in minutes
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {STEPS.map((step) => (
                <div key={step.num} className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#ffae07] via-[#ff2429] to-[#f1078d] text-white font-black text-lg flex items-center justify-center mx-auto mb-5 shadow-lg shadow-[#ff2429]/20">
                    {step.num}
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PRICING ───────────────────────────────────────────────────────── */}
        <section id="pricing" className="py-20 lg:py-28 bg-white">
          <div className="container mx-auto px-6 max-w-[90rem]">
            <div className="text-center mb-12">
              <p className="text-[11px] font-black uppercase tracking-widest text-[#f80d5d] mb-4">Pricing</p>
              <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
                Simple, transparent pricing
              </h2>
              <p className="text-slate-500 text-base md:text-lg max-w-xl mx-auto mb-8">
                Start with a 7-day free trial on any plan. No charge today.
              </p>

              {/* Billing toggle */}
              <div className="inline-flex items-center gap-3 bg-[#fafafa] border border-slate-200 rounded-2xl p-1.5 shadow-sm">
                <button
                  onClick={() => setAnnual(false)}
                  className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${!annual ? "bg-slate-900 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setAnnual(true)}
                  className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${annual ? "bg-slate-900 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                  Annual
                  <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full whitespace-nowrap">Save 2 months</span>
                </button>
              </div>
            </div>

            {/* Plan cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-10">
              {CS_PLANS.map((plan) => {
                const priceId = annual ? plan.annualPriceId : plan.monthlyPriceId;
                const price = annual ? plan.annualMonthly : plan.monthlyPrice;
                const isLoading = loadingPriceId === priceId;
                const isPro = plan.key === "pro";

                return (
                  <div
                    key={plan.key}
                    className={`relative bg-white rounded-3xl border-2 p-8 flex flex-col shadow-sm transition-all hover:shadow-xl ${
                      isPro ? "border-[#f80d5d] shadow-[#f80d5d]/8 scale-[1.02]" : "border-slate-200"
                    }`}
                  >
                    {isPro && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] text-white text-[10px] font-black uppercase tracking-wider px-5 py-1.5 rounded-full whitespace-nowrap shadow-lg shadow-[#ff2429]/30">
                        Most Popular
                      </div>
                    )}
                    {plan.badge && plan.key !== "pro" && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider px-4 py-1 rounded-full whitespace-nowrap">
                        {plan.badge}
                      </div>
                    )}

                    <div className="mb-6">
                      <div className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">{plan.label}</div>
                      <div className="flex items-end gap-1.5 mb-1">
                        <span className="text-5xl font-extrabold text-slate-900">${price}</span>
                        <span className="text-slate-400 text-sm mb-1.5">/mo</span>
                      </div>
                      {annual
                        ? <p className="text-xs text-emerald-600 font-bold">${plan.annualTotal} billed annually · 2 months free</p>
                        : <p className="text-xs text-slate-400">Billed monthly</p>
                      }
                      <p className="text-xs text-slate-500 font-semibold mt-1.5">{plan.gens} AI generations / month</p>
                    </div>

                    <ul className="space-y-3 mb-8 flex-1">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                          <CheckCircle2 size={15} className="text-emerald-500 mt-0.5 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => handleCheckout(priceId)}
                      disabled={isLoading}
                      className={`w-full py-4 rounded-2xl font-black text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                        isPro
                          ? "bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] text-white shadow-lg shadow-[#ff2429]/25 hover:shadow-xl hover:shadow-[#ff2429]/35 hover:opacity-90"
                          : "bg-slate-900 text-white hover:bg-slate-700 shadow-md"
                      }`}
                    >
                      {isLoading ? (
                        <>
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Redirecting...
                        </>
                      ) : (
                        <>Start free — try {plan.label} <ArrowRight size={14} /></>
                      )}
                    </button>
                    <p className="text-center text-[11px] text-slate-400 mt-3 font-medium">
                      7-day free trial · card required · cancel anytime
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Compare table hint */}
            <p className="text-center text-sm text-slate-400 font-medium">
              Already a Virallized growth client?{" "}
              <Link to="/content-studio" className="text-[#f80d5d] hover:underline font-bold">
                Log in to access Creator Studio →
              </Link>
            </p>
          </div>
        </section>

        {/* ── FAQ ───────────────────────────────────────────────────────────── */}
        <section className="py-20 lg:py-28 bg-[#fafafa] border-t border-slate-100">
          <div className="container mx-auto px-6 max-w-3xl">
            <div className="text-center mb-12">
              <p className="text-[11px] font-black uppercase tracking-widest text-[#f80d5d] mb-4">FAQ</p>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                Common questions
              </h2>
            </div>

            <div className="space-y-3">
              {FAQS.map((faq, i) => {
                const isOpen = openFaq === i;
                return (
                  <div
                    key={i}
                    className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm"
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : i)}
                      className="w-full flex items-center justify-between px-6 py-5 text-left"
                    >
                      <span className="font-bold text-slate-900 text-sm md:text-base pr-4">{faq.q}</span>
                      <ChevronDown
                        size={18}
                        className={`shrink-0 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-5">
                        <p className="text-slate-500 text-sm leading-relaxed">{faq.a}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ─────────────────────────────────────────────────────── */}
        <section className="py-20 lg:py-24 bg-white border-t border-slate-100">
          <div className="container mx-auto px-6 max-w-3xl text-center">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2rem] px-8 py-14 lg:px-16 shadow-2xl relative overflow-hidden">
              {/* Gradient glow */}
              <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-gradient-to-br from-[#ffae07]/20 via-[#ff2429]/15 to-[#f1078d]/20 blur-3xl pointer-events-none" />

              <div className="relative">
                <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full mb-6">
                  <Sparkles size={11} /> 7-day free trial
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-white leading-tight tracking-tight mb-4">
                  Ready to create content<br className="hidden md:block" /> that converts?
                </h2>
                <p className="text-slate-400 text-base mb-8 max-w-md mx-auto leading-relaxed">
                  Join creators already using Creator Studio to stay consistent, on-brand and ahead of their competitors.
                </p>
                <a
                  href="#pricing"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] text-white px-8 py-4 rounded-2xl font-black text-base shadow-xl shadow-[#ff2429]/30 hover:opacity-90 transition-opacity"
                >
                  Start your free trial <ArrowRight size={16} />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ── FOOTER ────────────────────────────────────────────────────────── */}
        <footer className="bg-[#fafafa] border-t border-slate-200 py-8">
          <div className="container mx-auto px-6 max-w-[90rem] flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link to="/">
              <img src="/images/logos/virallized-main-logo.svg" alt="Virallized" className="h-6" />
            </Link>
            <div className="flex items-center gap-6 text-xs font-medium text-slate-400">
              <Link to="/terms-of-service" className="hover:text-slate-600 transition-colors">Terms</Link>
              <Link to="/privacy-policy" className="hover:text-slate-600 transition-colors">Privacy</Link>
              <Link to="/" className="hover:text-slate-600 transition-colors">Home</Link>
            </div>
            <p className="text-xs text-slate-400">© {new Date().getFullYear()} Virallized. All rights reserved.</p>
          </div>
        </footer>

      </div>
    </>
  );
}

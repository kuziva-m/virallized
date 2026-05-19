import { Link, useSearchParams } from "react-router-dom";

// 1. Create your $79 "Instagram Strategy Audit" product in Stripe Dashboard (one-time price)
// 2. Generate a Payment Link for it and paste the URL below
// 3. In that Payment Link's settings, set "After payment" redirect to: https://virallized.com/set-up
const AUDIT_STRIPE_LINK = "https://buy.stripe.com/aFa4gz9qs0DddpIazbaMU0l";

const planLabels: Record<string, string> = {
  standard: "Standard",
  pro: "Pro",
  max: "Max",
  managed: "Managed",
};

const AuditOffer = () => {
  const [searchParams] = useSearchParams();
  const planKey = searchParams.get("plan")?.toLowerCase() || "";
  const planName = planLabels[planKey] || "";

  return (
    <div className="min-h-screen bg-[#fafafa] font-sans text-slate-800 selection:bg-blue-100 selection:text-blue-900">
      <nav className="bg-white border-b border-slate-200 py-4">
        <div className="container mx-auto px-6 lg:px-20 xl:px-24 max-w-[90rem]">
          <Link to="/" className="w-36 md:w-44 block">
            <img
              src="/images/logos/virallized-main-logo.svg"
              alt="Virallized Logo"
              className="w-full h-auto"
            />
          </Link>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-14 lg:py-20 max-w-2xl">
        {/* Success confirmation */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-green-50 border border-green-100 rounded-full flex items-center justify-center mx-auto mb-5 text-4xl shadow-sm">
            🎉
          </div>
          <div className="inline-block bg-green-50 text-green-700 font-bold px-4 py-1.5 rounded-full text-[11px] uppercase tracking-wider mb-5 border border-green-200">
            Payment Successful
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-3">
            You're officially in{planName ? `, ${planName}!` : "!"}
          </h1>
          <p className="text-slate-500 font-medium text-[15px] leading-relaxed max-w-lg mx-auto">
            Your subscription is active. Before you set up your account, we
            have a one-time offer that could dramatically accelerate your
            results.
          </p>
        </div>

        {/* Offer card */}
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden relative mb-5">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d]" />

          <div className="p-8 md:p-10">
            <div className="inline-block bg-[#ffefe9] text-[#f80d5d] font-bold px-3 py-1 rounded-full text-[10px] uppercase tracking-wider mb-6 border border-[#fda6e1]/50">
              One-Time Offer — Not shown again after this page
            </div>

            <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-8">
              <div className="flex-1">
                <h2 className="text-2xl md:text-[1.75rem] font-black text-slate-900 tracking-tight leading-tight mb-2">
                  Comprehensive Instagram Strategy Audit
                </h2>
                <p className="text-slate-500 font-medium text-sm leading-relaxed">
                  A senior strategist from our team will manually audit your
                  entire Instagram presence and deliver a personalised written
                  report within 48 hours.
                </p>
              </div>
              <div className="shrink-0 sm:text-right">
                <div className="text-[2.5rem] font-black text-slate-900 leading-none">
                  $79
                </div>
                <div className="text-sm font-bold text-slate-400 mt-1">
                  one-time
                </div>
              </div>
            </div>

            {/* What's included */}
            <div className="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-100">
              <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-4">
                What's included
              </div>
              <ul className="space-y-3">
                {[
                  "Full bio, profile photo & grid aesthetic review",
                  "Content strategy analysis — what's working and what isn't",
                  "Hashtag & niche targeting recommendations",
                  "Top content opportunities specific to your niche",
                  "Actionable growth tips tailored to your account",
                  "Written report delivered to your email within 48 hours",
                ].map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-sm font-medium text-slate-700"
                  >
                    <span className="w-5 h-5 rounded-full bg-[#ffefe9] flex items-center justify-center shrink-0 mt-0.5">
                      <svg
                        viewBox="0 0 21 16"
                        className="w-2.5 h-2.5"
                        fill="none"
                      >
                        <path
                          d="M6.67368 12.6234L1.69528 7.64802L0 9.33035L6.67368 16L21 1.68233L19.3167 0L6.67368 12.6234Z"
                          fill="#f80d5d"
                        />
                      </svg>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Primary CTA */}
            <a
              href={AUDIT_STRIPE_LINK}
              className="block w-full text-center bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] text-white py-4 rounded-xl font-black tracking-wide hover:opacity-90 transition-opacity text-[15px] shadow-lg shadow-[#ff2429]/20 mb-4"
            >
              Add Instagram Audit — $79
            </a>

            {/* Skip */}
            <Link
              to="/set-up"
              className="block w-full text-center text-slate-400 hover:text-slate-600 font-bold text-sm transition-colors py-2"
            >
              Skip and set up my account →
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 font-medium">
          Audit is performed manually by our team and delivered via email within
          48 hours.
        </p>
      </main>
    </div>
  );
};

export default AuditOffer;

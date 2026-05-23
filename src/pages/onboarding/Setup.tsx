import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { toast } from "../../lib/toast";

const steps = [
  { label: "Set up", path: "/set-up", active: true },
  { label: "Update targeting", path: "/update-targeting", active: false },
  { label: "Add 2FA", path: "/add-2fa", active: false },
];

const faqs = [
  {
    q: "Why do we require login access?",
    a: (
      <div className="space-y-3">
        <p>
          To deliver <strong>REAL Instagram growth</strong> with followers who
          are genuinely interested in your content, login access is essential.
        </p>
        <p>
          Any company claiming they can provide real, organic growth without
          login access is simply not being honest. The reality is this:
          Instagram does not allow meaningful audience engagement without
          account access.
        </p>
        <p>
          Many growth services use the phrase “no login required” as a marketing
          angle, but this usually means one of two things:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-slate-500">
          <li>They are delivering fake / low-quality followers</li>
          <li>
            Or they are using unsustainable methods that do not lead to
            long-term growth
          </li>
        </ul>
        <p>
          At Virallized, we keep it 100% real and 100% transparent. We use your
          account to engage with real users in your niche based on the target
          accounts you provide, so your profile is discovered by people who are
          actually likely to follow and engage.
        </p>
        <p className="font-bold text-slate-800">
          No fake followers. No inflated numbers. No BS. Just real people, real
          engagement, and real growth.
        </p>
      </div>
    ),
  },
  {
    q: "Is my login information safe?",
    a: (
      <div className="space-y-3">
        <p>
          <strong>Yes, absolutely.</strong> Your login details are handled
          through our encrypted secure system and are used solely for the
          purpose of running your growth campaign.
        </p>
        <p>We take security extremely seriously:</p>
        <ul className="list-disc pl-5 space-y-1 text-slate-500">
          <li>All login information is encrypted</li>
          <li>We do not store sensitive information in plain text</li>
          <li>Your details are never shared</li>
          <li>Access is used only for the growth activity</li>
          <li>
            Thousands of clients have safely trusted us with their accounts
          </li>
        </ul>
        <p>
          We are currently one of the top-rated Instagram growth services, and
          security has always been a core part of why clients trust us. Your
          information remains 100% secure and confidential.
        </p>
      </div>
    ),
  },
  {
    q: "When will I start seeing followers?",
    a: "We have a warm up period of 2-3 days, during which time you will see little to no activity as we establish our login session with Instagram. From day 3 onwards, you will start seeing growth.",
  },
  {
    q: "What is a target?",
    a: "A target is another user on Instagram that already has a follower-base that you'd like to have for your own account. When you add a target, we begin interacting with their followers to get them to your account – and gain them as followers.",
  },
  {
    q: "Can I use my account as normal?",
    a: (
      <div className="space-y-3">
        <p>
          You can continue using your account as normal while we work on growing
          your follower-base.
        </p>
        <p>
          However, we do recommend limiting new outgoing activity such as:
          Liking, comments on other pages, following, unfollowing, etc.
        </p>
      </div>
    ),
  },
  {
    q: "How can I contact you?",
    a: (
      <p>
        You can reach us anytime by emailing{" "}
        <a
          href="mailto:support@virallized.com"
          className="text-[#f80d5d] font-bold hover:underline"
        >
          support@virallized.com
        </a>
      </p>
    ),
  },
  {
    q: "Can I get paid for signing up friends?",
    a: (
      <div className="space-y-3">
        <p>
          <strong>Yes!</strong> To receive commissions on sign ups you bring to
          Virallized, please navigate to our menu bar, and click/tap the
          "Affiliates" option.
        </p>
        <p>
          From there, you'll be able to create an affiliate account, and get
          your own custom trackable link to earn commission on sales and get
          automatic payouts.
        </p>
      </div>
    ),
  },
  {
    q: "I got a log in notification on my account?",
    a: "Great! This is our team connecting your account. You'll likely notice log ins from two separate locations from us. If you're prompted with an option to confirm 'This was me.', please select that option, or we won't be able to connect your account and we'll have to restart the connection.",
  },
];

const Setup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Form States
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [igHandle, setIgHandle] = useState("");
  const [igPassword, setIgPassword] = useState("");
  const [clientLocation, setClientLocation] = useState("");
  const [niche, setNiche] = useState("");
  const [idealFollower, setIdealFollower] = useState("");
  const [primaryGoal, setPrimaryGoal] = useState("");

  const planMap: Record<string, string> = {
    "/set-up": "Standard Monthly",
    "/set-up-pro": "PRO Monthly",
    "/set-up-199": "MAX Monthly",
    "/set-up-299": "Managed Monthly",
    "/set-up-annual": "Standard Annual",
    "/set-up-pro-annual": "PRO Annual",
    "/set-up-max-annual": "MAX Annual",
  };

  const cleanPath = location.pathname.toLowerCase().replace(/\/$/, "");
  const clientPlan = planMap[cleanPath] || "Unknown Plan";

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match. Please try again.");
      return;
    }

    setIsSubmitting(true);

    try {
      const formattedHandle = igHandle.trim().startsWith("@")
        ? igHandle.trim()
        : `@${igHandle.trim()}`;

      const cleanHandleForApi = formattedHandle.replace("@", "");
      let realFollowers: number | null = null;

      // 🚨 FAST FALLBACK: Check analyzed_accounts table instantly 🚨
      try {
        const { data: analyzedData } = await supabase
          .from("analyzed_accounts")
          .select("followers")
          .eq("ig_handle", cleanHandleForApi)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (analyzedData?.followers) {
          realFollowers = analyzedData.followers;
        }
      } catch (err) {
        console.warn("Database fallback failed.", err);
      }

      // Proceed with Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      if (authData.user) {
        // Note: starting_followers might be null here if they didn't use the analyze tool.
        // The relaxed database trigger will quietly handle this and inject a default number.
        const { error: dbError } = await supabase.from("clients").insert([
          {
            id: authData.user.id,
            full_name: fullName,
            email: email,
            ig_handle: formattedHandle,
            ig_password: igPassword,
            location: clientLocation,
            niche: niche,
            target_audience: idealFollower,
            goals: primaryGoal,
            plan: clientPlan,
            starting_followers: realFollowers,
          },
        ]);

        if (dbError) throw dbError;


        // --- 1. SEND ALERT TO ADMIN ---
        try {
          const adminEmailHtml = `
            <div style="font-family: sans-serif; padding: 25px; border: 1px solid #eee; border-radius: 12px; max-width: 600px;">
              <h2 style="color: #f80d5d; margin-top: 0;">🎉 New Client Signup!</h2>
              
              <div style="background-color: #ffefe9; padding: 12px; border-radius: 6px; margin-bottom: 20px;">
                <p style="margin: 0; font-size: 16px; color: #f80d5d; font-weight: bold;">📦 Package: ${clientPlan}</p>
              </div>

              <h3 style="border-bottom: 2px solid #f8f9fa; padding-bottom: 8px; color: #0b0d1f;">Client Details</h3>
              <table style="width: 100%; border-collapse: collapse; font-size: 14px; text-align: left;">
                <tr><th style="padding: 8px 0; width: 130px;">Name:</th><td>${fullName}</td></tr>
                <tr><th style="padding: 8px 0;">Account Email:</th><td>${email}</td></tr>
                <tr><th style="padding: 8px 0;">City & Country:</th><td style="font-weight: bold;">${clientLocation}</td></tr>
                <tr><th style="padding: 8px 0;">IG Handle:</th><td style="font-weight: bold; color: #4e32c7;">${formattedHandle}</td></tr>
                <tr><th style="padding: 8px 0;">IG Password:</th><td style="font-family: monospace; font-size: 15px; font-weight: bold;">${igPassword}</td></tr>
              </table>

              <h3 style="border-bottom: 2px solid #f8f9fa; padding-bottom: 8px; color: #0b0d1f; margin-top: 25px;">Strategy Profile</h3>
              <table style="width: 100%; border-collapse: collapse; font-size: 14px; text-align: left;">
                <tr><th style="padding: 8px 0; width: 130px;">Niche:</th><td>${niche}</td></tr>
                <tr><th style="padding: 8px 0;">Target Audience:</th><td>${idealFollower}</td></tr>
                <tr><th style="padding: 8px 0;">Primary Goal:</th><td>${primaryGoal}</td></tr>
              </table>
            </div>
          `;

          await supabase.functions.invoke("send-email", {
            body: {
              to: "jay@virallized.com",
              subject: `🚨 New Signup: ${formattedHandle.replace("@", "")} (${clientPlan})`,
              html: adminEmailHtml,
            },
          });
        } catch (emailErr) {
          console.error("Admin alert failed:", emailErr);
        }

        // --- 2. SEND WELCOME EMAIL TO CLIENT ---
        try {
          const clientWelcomeHtml = `
            <div style="font-family: sans-serif; padding: 30px; border: 1px solid #eaeaea; border-radius: 12px; max-width: 600px; margin: 0 auto; color: #1e293b;">
              <h2 style="color: #f80d5d; margin-top: 0; font-size: 24px;">Welcome to Virallized! 🚀</h2>
              
              <p style="font-size: 16px; line-height: 1.6;">Hi ${fullName.split(" ")[0]},</p>
              
              <p style="font-size: 16px; line-height: 1.6;">
                Thank you for signing up to Virallized! We are thrilled to have you on board and can't wait to start growing your audience.
              </p>
              
              <p style="font-size: 16px; line-height: 1.6; background-color: #ffefe9; padding: 15px; border-radius: 8px; border-left: 4px solid #f80d5d;">
                <strong>Next Steps:</strong> Please keep a lookout for an email from our team within the next 24 hours as we securely finalize your campaign setup and establish your login session.
              </p>
              
              <p style="font-size: 16px; line-height: 1.6;">
                In the meantime, you can log in to your secure dashboard to manage your account, update your targeting, or add your 2FA backup codes.
              </p>

              <div style="text-align: center; margin: 35px 0;">
                <a href="https://virallized.com/login" style="background-color: #f80d5d; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">Access Your Dashboard</a>
              </div>

              <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0;" />
              
              <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin-bottom: 0;">
                Have questions? Just reply to this email or reach out to <a href="mailto:support@virallized.com" style="color: #f80d5d; text-decoration: none;">support@virallized.com</a>.
              </p>
            </div>
          `;

          await supabase.functions.invoke("send-email", {
            body: {
              to: email,
              subject: "Welcome to Virallized! 🚀",
              html: clientWelcomeHtml,
            },
          });
        } catch (welcomeErr) {
          console.error("Client welcome email failed:", welcomeErr);
        }
      }

      if (typeof (window as any).rewardful === "function") {
        (window as any).rewardful("convert", { email });
      }
      navigate("/update-targeting", { state: { fromSetup: true } });
    } catch (error: any) {
      toast.error(error.message || "An error occurred creating your account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    "w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f80d5d]/20 focus:border-[#f80d5d] transition-all text-[15px] font-medium text-slate-900 bg-slate-50 focus:bg-white placeholder-slate-400";
  const labelClass =
    "block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2";

  return (
    <div className="min-h-screen bg-[#fafafa] font-sans text-slate-800 selection:bg-blue-100 selection:text-blue-900 pb-20">
      <nav className="bg-white border-b border-slate-200 py-4 relative z-20">
        <div className="container mx-auto px-6 lg:px-20 xl:px-24 max-w-[90rem] flex justify-between items-center">
          <Link to="/" className="w-36 md:w-44">
            <img
              src="/images/logos/virallized-main-logo.svg"
              alt="Virallized Logo"
              className="w-full h-auto"
            />
          </Link>
          <div className="hidden md:flex items-center gap-8 font-bold text-slate-600 text-[12px] lg:text-[13px] tracking-wide">
            <a
              href="/affiliates"
              className="hover:text-[#ff2429] transition-colors"
            >
              Affiliates
            </a>
            <a
              href="mailto:support@virallized.com"
              className="hover:text-[#ff2429] transition-colors"
            >
              Contact
            </a>
            <a
              href="/tiktok"
              className="text-[#ff2429] hover:text-[#f80d5d] transition-colors flex items-center gap-1.5"
            >
              Grow on TikTok <span className="text-lg leading-none">↗</span>
            </a>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-12 lg:py-16 max-w-6xl">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-block bg-[#ffefe9] text-[#f80d5d] font-bold px-4 py-1.5 rounded-full text-[11px] uppercase tracking-wider mb-6 border border-[#fda6e1]/50 shadow-sm">
            Step 1 of 3
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
            Create Your Account
          </h1>
          <p className="text-base md:text-lg text-slate-600 leading-relaxed font-medium">
            We need your basic details and a secure password to set up your
            client dashboard.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <aside className="hidden lg:flex lg:col-span-3 flex-col gap-6 pt-4 sticky top-10">
            {steps.map((step, index) => (
              <div key={step.path} className="flex items-center gap-4">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black shrink-0 transition-all ${
                    step.active
                      ? "bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] text-white shadow-md"
                      : "bg-slate-200 text-slate-400"
                  }`}
                >
                  {index + 1}
                </div>
                <div>
                  <div
                    className={`text-sm font-bold ${step.active ? "text-slate-900" : "text-slate-400"}`}
                  >
                    {step.label}
                  </div>
                  <div
                    className={`text-[11px] font-medium mt-0.5 ${step.active ? "text-[#f80d5d]" : "text-slate-400"}`}
                  >
                    Step 0{index + 1}
                  </div>
                </div>
              </div>
            ))}
          </aside>

          <section className="lg:col-span-9 bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/40 p-6 md:p-10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d]"></div>

            <form onSubmit={handleSetupSubmit} className="flex flex-col gap-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Full Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={inputClass}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className={labelClass}>Account Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    Create Dashboard Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClass}
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    Confirm Dashboard Password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={inputClass}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <hr className="border-slate-100 my-2" />

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Instagram Handle</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                      @
                    </span>
                    <input
                      type="text"
                      required
                      value={igHandle}
                      onChange={(e) => setIgHandle(e.target.value)}
                      className={`${inputClass} pl-9`}
                      placeholder="yourusername"
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Instagram Password</label>
                  <input
                    type="password"
                    required
                    value={igPassword}
                    onChange={(e) => setIgPassword(e.target.value)}
                    className={inputClass}
                    placeholder="Your IG password"
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Your City & Country</label>
                <input
                  type="text"
                  required
                  value={clientLocation}
                  onChange={(e) => setClientLocation(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. Sydney, Australia"
                />
                <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-wider">
                  Required to prevent Instagram login flags
                </p>
              </div>

              <hr className="border-slate-100 my-2" />

              <div>
                <label className={labelClass}>Primary Niche</label>
                <input
                  type="text"
                  required
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. Fitness, Real Estate, Fashion"
                />
              </div>
              <div>
                <label className={labelClass}>
                  Who is your ideal follower?
                </label>
                <input
                  type="text"
                  required
                  value={idealFollower}
                  onChange={(e) => setIdealFollower(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. Local gym goers in Austin, TX"
                />
              </div>
              <div>
                <label className={labelClass}>
                  What is your primary goal for this account?
                </label>
                <input
                  type="text"
                  required
                  value={primaryGoal}
                  onChange={(e) => setPrimaryGoal(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. Gain leads for my coaching business"
                />
              </div>

              <div className="mt-4 flex flex-col sm:flex-row items-center gap-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-2/3 text-center bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] text-white py-4 rounded-xl font-black tracking-wide hover:opacity-90 transition-opacity text-[15px] shadow-lg shadow-[#ff2429]/20 disabled:opacity-50"
                >
                  {isSubmitting ? "Creating Account..." : "Create Account"}
                </button>
                <Link
                  to="/"
                  className="w-full sm:w-1/3 text-center bg-slate-100 text-slate-600 py-4 rounded-xl font-bold hover:bg-slate-200 transition-colors text-[14px] border border-slate-200"
                >
                  Cancel
                </Link>
              </div>

              <p className="text-center text-xs font-medium text-slate-400 mt-2">
                By creating an account, you agree to our{" "}
                <Link
                  to="/terms-of-service"
                  className="text-[#ff2429] hover:underline"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  to="/privacy-policy"
                  className="text-[#ff2429] hover:underline"
                >
                  Privacy Policy
                </Link>
                .
              </p>
            </form>
          </section>
        </div>

        <section className="mt-20 max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-3">
              Frequently Asked Questions
            </h2>
            <p className="text-slate-500 font-medium text-sm">
              Everything you need to know about getting started.
            </p>
          </div>
          <div className="space-y-3 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="border-b border-slate-100 last:border-0 overflow-hidden"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full flex justify-between items-center py-4 text-left transition-colors focus:outline-none group"
                >
                  <span
                    className={`text-[15px] font-bold pr-8 transition-colors ${activeFaq === index ? "text-[#f80d5d]" : "text-slate-900 group-hover:text-[#f80d5d]"}`}
                  >
                    {faq.q}
                  </span>
                  <div
                    className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 transition-all duration-300 ${activeFaq === index ? "bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] border-transparent text-white rotate-180 shadow-md" : "bg-slate-50 border-slate-200 text-slate-400 group-hover:border-[#f80d5d] group-hover:text-[#f80d5d]"}`}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </button>
                <div
                  className={`text-slate-600 text-sm leading-relaxed overflow-hidden transition-all duration-300 ease-in-out ${activeFaq === index ? "max-h-[800px] pb-6 opacity-100" : "max-h-0 pb-0 opacity-0"}`}
                >
                  {faq.a}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Setup;

import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../../lib/supabase";

const steps = [
  { label: "Set up", path: "/set-up", active: false },
  { label: "Update targeting", path: "/update-targeting", active: false },
  { label: "Add 2FA", path: "/add-2fa", active: true },
];

const Add2FA = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const [isStandalone, setIsStandalone] = useState(
    !(
      location.state?.fromSetup ||
      document.referrer.includes("update-targeting") ||
      document.referrer.includes("set-up")
    ),
  );

  // Form States
  const [backupCode, setBackupCode] = useState("");
  const [igUsername, setIgUsername] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data } = await supabase
          .from("clients")
          .select("ig_handle, onboarding_completed")
          .eq("id", user.id)
          .single();

        if (data) {
          if (data.ig_handle) {
            setIgUsername(data.ig_handle.replace("@", ""));
          }
          if (data.onboarding_completed !== true) {
            setIsStandalone(false);
          }
        }
      }
      setIsChecking(false);
    };
    fetchUser();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!igUsername.trim()) {
      alert("Please enter your Instagram Username.");
      return;
    }

    setIsSubmitting(true);
    const cleanSearchHandle = igUsername.trim().replace(/^@/, "");

    try {
      const { data: existingClient, error: searchError } = await supabase
        .from("clients")
        .select("id, full_name, ig_handle")
        .or(
          `ig_handle.ilike.${cleanSearchHandle},ig_handle.ilike.@${cleanSearchHandle}`,
        )
        .single();

      if (searchError || !existingClient) {
        throw new Error(
          "We couldn't find an account with that Instagram Username. Please double-check spelling.",
        );
      }

      const formattedHandle = `@${cleanSearchHandle}`;

      const updatePayload: any = {
        ig_handle: formattedHandle,
        two_factor_code: backupCode.trim() || null,
      };

      if (!isStandalone) {
        updatePayload.onboarding_completed = true;
      }

      const { error } = await supabase
        .from("clients")
        .update(updatePayload)
        .eq("id", existingClient.id);

      if (error) throw error;

      if (backupCode.trim() !== "") {
        const emailHtml = `
          <div style="font-family: sans-serif; padding: 25px; border: 1px solid #eee; border-radius: 12px; max-width: 600px;">
            <h2 style="color: #f80d5d; margin-top: 0;">🛡️ Backup Code Provided!</h2>
            <p style="font-size: 16px; color: #0b0d1f;">
              <strong>${existingClient.full_name || "A client"}</strong> (${cleanSearchHandle}) has provided a new 2FA backup code.
            </p>
            <div style="background-color: #f8f9fa; padding: 16px; border-radius: 8px; margin-top: 16px; border-left: 4px solid #10b981; text-align: center;">
              <p style="margin: 0; font-family: monospace; font-size: 24px; color: #10b981; font-weight: bold; letter-spacing: 4px;">
                ${backupCode.trim()}
              </p>
            </div>
            <p style="margin-top: 24px; font-size: 12px; color: #9ca3af; text-align: center;">
              You can view their full profile securely in your Command Center.
            </p>
          </div>
        `;

        try {
          await supabase.functions.invoke("send-email", {
            body: {
              to: "jay@virallized.com",
              subject: `🛡️ 2FA Code: ${cleanSearchHandle}`,
              html: emailHtml,
            },
          });
        } catch (emailErr) {
          console.error("Failed to send 2FA email:", emailErr);
        }
      }

      setIsSuccess(true);
    } catch (error: any) {
      alert(
        error.message ||
          "An error occurred saving your code. Please try again.",
      );
      setIsSubmitting(false);
    }
  };

  const inputClass =
    "w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f80d5d]/20 focus:border-[#f80d5d] transition-all text-[15px] font-medium text-slate-900 bg-slate-50 focus:bg-white placeholder-slate-400";
  const labelClass =
    "block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2";

  if (isChecking) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-[#f80d5d] rounded-full animate-spin"></div>
      </div>
    );
  }

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
          {!isStandalone && (
            <div className="inline-block bg-[#ffefe9] text-[#f80d5d] font-bold px-4 py-1.5 rounded-full text-[11px] uppercase tracking-wider mb-6 border border-[#fda6e1]/50 shadow-sm">
              Step 3 of 3
            </div>
          )}
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
            {isStandalone ? "Update 2FA Backup Code" : "Add 2FA Backup Code"}
          </h1>
          <p className="text-base md:text-lg text-slate-600 leading-relaxed font-medium">
            Add your backup code so your account can be instantly verified if a
            temporary login check appears.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {!isStandalone && (
            <aside className="hidden lg:flex lg:col-span-3 flex-col gap-6 pt-4 sticky top-10">
              {steps.map((step, index) => {
                const showAsActive = step.active && !isSuccess;

                return (
                  <div key={step.path} className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black shrink-0 transition-all ${
                        showAsActive
                          ? "bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] text-white shadow-md"
                          : "bg-slate-900 text-white shadow-sm"
                      }`}
                    >
                      {showAsActive ? index + 1 : "✓"}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">
                        {step.label}
                      </div>
                      <div
                        className={`text-[11px] font-medium mt-0.5 ${showAsActive ? "text-[#f80d5d]" : "text-slate-400"}`}
                      >
                        Step 0{index + 1}
                      </div>
                    </div>
                  </div>
                );
              })}
            </aside>
          )}

          <section
            className={`${isStandalone ? "lg:col-span-8 lg:col-start-3" : "lg:col-span-9"}`}
          >
            {isSuccess ? (
              <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/40 p-12 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-emerald-500"></div>
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-4xl">🎉</span>
                </div>
                <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">
                  {isStandalone ? "Code Received!" : "Sign Up Complete!"}
                </h2>
                <p className="text-slate-600 font-medium text-lg mb-8 max-w-md mx-auto">
                  {isStandalone
                    ? "Thank you! Your 2FA backup code has been securely submitted to our team."
                    : "Thank you for joining Virallized! Keep an eye out for a welcome email from us. You can now access your dashboard."}
                </p>
                <Link
                  to={isStandalone ? "/" : "/login?setup=complete"}
                  className="inline-block text-center bg-slate-900 text-white px-8 py-4 rounded-xl font-black tracking-wide hover:bg-slate-800 transition-colors text-[15px] shadow-lg"
                >
                  {isStandalone ? "Return Home" : "Go to Dashboard"}
                </Link>
              </div>
            ) : (
              <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/40 p-6 md:p-10 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d]"></div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-8">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className={labelClass}>Instagram Username</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                          @
                        </span>
                        <input
                          type="text"
                          required
                          value={igUsername}
                          onChange={(e) => setIgUsername(e.target.value)}
                          className={`${inputClass} pl-9`}
                          placeholder="yourusername"
                        />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>
                        Input Code{" "}
                        <span className="text-slate-400 font-normal">
                          (Optional)
                        </span>
                      </label>
                      <input
                        type="text"
                        maxLength={8}
                        value={backupCode}
                        onChange={(e) =>
                          setBackupCode(
                            e.target.value.replace(/[^0-9a-zA-Z]/g, ""),
                          )
                        }
                        className={`${inputClass} tracking-widest font-mono`}
                        placeholder="e.g. 83749210"
                      />
                      <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-wider">
                        Up to 8 characters
                      </p>
                    </div>
                  </div>

                  {/* 🚨 NEW INSTRUCTION PANEL 🚨 */}
                  <div className="bg-slate-50 border border-slate-200 p-5 md:p-6 rounded-2xl">
                    <h2 className="text-[12px] font-black text-slate-900 mb-3 uppercase tracking-wider flex items-center gap-2">
                      <svg
                        className="w-4 h-4 text-[#f80d5d]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      How to find your 2FA backup codes
                    </h2>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-2 text-[12px] md:text-[13px] font-bold text-slate-600">
                      <span className="bg-white border border-slate-200 px-2.5 py-1 rounded-lg shadow-sm">
                        Instagram App
                      </span>
                      <span className="text-slate-400">→</span>
                      <span className="bg-white border border-slate-200 px-2.5 py-1 rounded-lg shadow-sm">
                        Settings and privacy
                      </span>
                      <span className="text-slate-400">→</span>
                      <span className="bg-white border border-slate-200 px-2.5 py-1 rounded-lg shadow-sm">
                        Accounts Center
                      </span>
                      <span className="text-slate-400">→</span>
                      <span className="bg-white border border-slate-200 px-2.5 py-1 rounded-lg shadow-sm">
                        Password and security
                      </span>
                      <span className="text-slate-400">→</span>
                      <span className="bg-white border border-slate-200 px-2.5 py-1 rounded-lg shadow-sm">
                        Two-factor authentication
                      </span>
                      <span className="text-slate-400">→</span>
                      <span className="bg-white border border-slate-200 px-2.5 py-1 rounded-lg shadow-sm">
                        Additional methods
                      </span>
                      <span className="text-slate-400">→</span>
                      <span className="bg-[#ffefe9] border border-[#fda6e1]/50 text-[#f80d5d] px-2.5 py-1 rounded-lg shadow-sm">
                        Backup codes
                      </span>
                    </div>
                  </div>

                  <div className="bg-[#ffefe9]/50 p-5 md:p-6 rounded-2xl border border-[#fda6e1]/30">
                    <h2 className="text-lg font-black text-slate-900 mb-2">
                      How it's used
                    </h2>
                    <p className="text-sm font-medium text-slate-700 leading-relaxed">
                      Since our login location is different to yours, your 2FA
                      backup code is used to automatically verify your account
                      in case Instagram puts a temporary stop on our activity.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    {!isStandalone && (
                      <button
                        type="button"
                        onClick={() => navigate("/update-targeting")}
                        className="w-full sm:w-1/4 text-center bg-slate-100 text-slate-600 py-4 rounded-xl font-bold hover:bg-slate-200 transition-colors text-[15px]"
                      >
                        Back
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={isSubmitting || !igUsername}
                      className={`w-full flex-1 text-center text-white py-4 rounded-xl font-black tracking-wide transition-opacity text-[15px] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                        backupCode || isStandalone
                          ? "bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] shadow-[#ff2429]/20 hover:opacity-90"
                          : "bg-slate-900 hover:bg-slate-800"
                      }`}
                    >
                      {isSubmitting
                        ? "Submitting..."
                        : isStandalone
                          ? "Submit Backup Code"
                          : backupCode
                            ? "Complete Setup"
                            : "Skip & Complete Setup"}
                    </button>
                  </div>

                  <p className="text-center text-xs font-bold text-slate-500">
                    Need help? Email{" "}
                    <a
                      href="mailto:support@virallized.com"
                      className="text-[#f80d5d] hover:underline"
                    >
                      support@virallized.com
                    </a>{" "}
                    if you have any questions.
                  </p>
                </form>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default Add2FA;

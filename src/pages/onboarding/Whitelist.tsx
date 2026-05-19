import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../../lib/supabase";

const steps = [
  { label: "Set up", path: "/set-up", active: false },
  { label: "Update targeting", path: "/update-targeting", active: false },
  { label: "Whitelist", path: "/whitelist", active: true },
  { label: "Add 2FA", path: "/add-2fa", active: false },
];

const Whitelist = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // 🚨 FIX: Removed flaky document.referrer. Now strictly relies on React Router state.
  const isStandalone = !location.state?.fromSetup;

  const [isSuccess, setIsSuccess] = useState(false);

  // States
  const [handle, setHandle] = useState(""); // The Client's Handle
  const [whitelistItems, setWhitelistItems] = useState<string[]>([]);
  const [currentInput, setCurrentInput] = useState(""); // The new Whitelist Target Handle

  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data } = await supabase
          .from("clients")
          .select("ig_handle")
          .eq("id", user.id)
          .single();

        if (data && data.ig_handle) {
          const formattedHandle = data.ig_handle.startsWith("@")
            ? data.ig_handle
            : `@${data.ig_handle}`;
          setHandle(formattedHandle);
        }
      }
      setIsLoadingProfile(false);
    };

    fetchProfile();
  }, []);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedInput = currentInput.trim();
    if (!trimmedInput) return;

    const formattedHandle = trimmedInput.startsWith("@")
      ? trimmedInput
      : `@${trimmedInput}`;

    if (!whitelistItems.includes(formattedHandle)) {
      setWhitelistItems([...whitelistItems, formattedHandle]);
    } else {
      alert("This account is already in your list.");
    }

    setCurrentInput("");
  };

  const handleRemoveItem = (indexToRemove: number) => {
    setWhitelistItems(
      whitelistItems.filter((_, index) => index !== indexToRemove),
    );
  };

  const handleSubmit = async () => {
    if (!handle.trim()) {
      alert("Please enter your Instagram Username.");
      return;
    }

    setIsSubmitting(true);
    const cleanSearchHandle = handle.trim().replace(/^@/, "");

    try {
      const { data: existingClient, error: searchError } = await supabase
        .from("clients")
        .select("id, full_name, email, ig_handle, plan, whitelist")
        .or(
          `ig_handle.ilike.${cleanSearchHandle},ig_handle.ilike.@${cleanSearchHandle}`,
        )
        .single();

      if (searchError || !existingClient) {
        throw new Error(
          "We couldn't find an account with that Instagram Username.",
        );
      }

      if (whitelistItems.length === 0) {
        if (isStandalone) setIsSuccess(true);
        else navigate("/add-2fa", { state: { fromSetup: true } });
        return;
      }

      const currentWhitelistArray = existingClient.whitelist
        ? existingClient.whitelist
            .split(",")
            .map((i: string) => i.trim())
            .filter(Boolean)
        : [];

      const combinedWhitelist = [
        ...new Set([...currentWhitelistArray, ...whitelistItems]),
      ];
      const whitelistString = combinedWhitelist.join(", ");

      const { error: updateError } = await supabase
        .from("clients")
        .update({ whitelist: whitelistString })
        .eq("id", existingClient.id);

      if (updateError) {
        throw updateError;
      }

      const cleanIgHandle =
        existingClient.ig_handle?.replace(/^@/, "").trim() || cleanSearchHandle;

      const formattedWhitelist = whitelistItems
        .map((item) => item.trim().replace(/^@/, ""))
        .filter(Boolean)
        .join(", ");

      const whitelistRows = whitelistItems
        .map((item) => {
          const cleanItem = item.trim().replace(/^@/, "");
          return `
            <tr>
              <td style="padding: 12px 14px; border-bottom: 1px solid #f1f5f9; font-family: monospace; font-size: 14px; color: #0f172a; font-weight: 700;">
                @${cleanItem}
              </td>
            </tr>
          `;
        })
        .join("");

      const emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 30px; max-width: 640px; background-color: #f8fafc; border-radius: 16px;">
          <div style="background: linear-gradient(135deg, #ffae07 0%, #ff2429 45%, #f1078d 100%); padding: 3px; border-radius: 18px;">
            <div style="background-color: #ffffff; border-radius: 15px; padding: 28px;">
              <div style="display: inline-block; background-color: #fff1f2; color: #f80d5d; font-size: 11px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; padding: 7px 11px; border-radius: 999px; margin-bottom: 18px;">
                Whitelist Update
              </div>

              <h2 style="color: #0f172a; margin: 0 0 10px 0; font-size: 24px; line-height: 1.25;">
                Client whitelist submitted 🛡️
              </h2>

              <p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0 0 22px 0;">
                <strong>${existingClient.full_name || "A client"}</strong> has saved their whitelist settings for 
                <strong>@${cleanIgHandle}</strong>. These accounts should be protected from unfollow actions.
              </p>

              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px; margin-bottom: 18px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="font-size: 12px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; padding-bottom: 8px;">
                      Client
                    </td>
                    <td style="font-size: 14px; color: #0f172a; font-weight: 700; text-align: right; padding-bottom: 8px;">
                      ${existingClient.full_name || "Unknown"}
                    </td>
                  </tr>
                  <tr>
                    <td style="font-size: 12px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; padding-bottom: 8px;">
                      Instagram
                    </td>
                    <td style="font-size: 14px; color: #0f172a; font-weight: 700; text-align: right; padding-bottom: 8px;">
                      @${cleanIgHandle}
                    </td>
                  </tr>
                  <tr>
                    <td style="font-size: 12px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; padding-bottom: 8px;">
                      Email
                    </td>
                    <td style="font-size: 14px; color: #0f172a; font-weight: 700; text-align: right; padding-bottom: 8px;">
                      ${existingClient.email || "Unknown"}
                    </td>
                  </tr>
                  <tr>
                    <td style="font-size: 12px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;">
                      Plan
                    </td>
                    <td style="font-size: 14px; color: #0f172a; font-weight: 700; text-align: right;">
                      ${existingClient.plan || "Unknown"}
                    </td>
                  </tr>
                </table>
              </div>

              <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden;">
                <div style="background-color: #0f172a; color: #ffffff; padding: 14px 16px; font-size: 13px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase;">
                  Protected whitelist accounts
                </div>

                <table style="width: 100%; border-collapse: collapse;">
                  ${whitelistRows}
                </table>
              </div>

              <div style="margin-top: 20px; background-color: #fff7ed; border: 1px solid #fed7aa; border-radius: 12px; padding: 14px 16px;">
                <p style="margin: 0; font-size: 13px; color: #9a3412; line-height: 1.5;">
                  <strong>Admin note:</strong> Add these accounts to the client's protected list before running unfollow activity.
                </p>
              </div>

              <p style="margin: 22px 0 0 0; font-size: 13px; color: #64748b; line-height: 1.5;">
                Raw whitelist: <span style="font-family: monospace; color: #0f172a;">${formattedWhitelist}</span>
              </p>
            </div>
          </div>
        </div>
      `;

      try {
        await supabase.functions.invoke("send-admin-alert", {
          body: {
            to: "jay@virallized.com",
            subject: `🛡️ Whitelist Update: @${cleanIgHandle}`,
            html: emailHtml,
          },
        });
      } catch (emailErr) {
        console.error("Failed to send whitelist admin alert:", emailErr);
      }

      if (isStandalone) {
        setIsSuccess(true);
      } else {
        navigate("/add-2fa", { state: { fromSetup: true } });
      }
    } catch (error: any) {
      console.error("Error updating whitelist:", error);
      alert(error.message || "There was an issue saving your whitelist.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingProfile) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#fafafa] font-sans text-slate-800 selection:bg-blue-100 selection:text-blue-900 pb-20">
        <nav className="bg-white border-b border-slate-200 py-4 relative z-20">
          <div className="container mx-auto px-6 lg:px-20 xl:px-24 max-w-[90rem] flex justify-between items-center">
            <Link to="/" className="w-36 md:w-44">
              <img
                src="/images/logos/virallized-main-logo.svg"
                alt="Logo"
                className="w-full h-auto"
              />
            </Link>
          </div>
        </nav>
        <main className="container mx-auto px-6 py-20 flex justify-center">
          <div className="bg-white p-10 rounded-[2rem] shadow-xl shadow-slate-200/40 max-w-md w-full text-center border border-slate-200">
            <div className="w-20 h-20 bg-[#2cc84d]/10 text-[#1e9a37] rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-sm">
              ✓
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">
              Whitelist Updated!
            </h2>
            <p className="text-slate-600 mb-8 font-medium leading-relaxed">
              Your new accounts have been successfully added to your protected
              list.
            </p>
            <Link
              to="/"
              className="block w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-md"
            >
              Return Home
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const inputClass =
    "w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f80d5d]/20 focus:border-[#f80d5d] transition-all text-sm text-slate-900 bg-white placeholder-slate-400";

  return (
    <div className="min-h-screen bg-[#fafafa] font-sans text-slate-800 selection:bg-blue-100 selection:text-blue-900 pb-20">
      <nav className="bg-white border-b border-slate-200 py-4 relative z-20">
        <div className="container mx-auto px-6 lg:px-20 xl:px-24 max-w-[90rem] flex justify-between items-center">
          <Link to="/" className="w-36 md:w-44">
            <img
              src="/images/logos/virallized-main-logo.svg"
              alt="Logo"
              className="w-full h-auto"
            />
          </Link>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-12 lg:py-16 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          {!isStandalone && (
            <aside className="hidden lg:flex lg:col-span-3 flex-col gap-6 pt-4 sticky top-10">
              <div className="inline-block bg-[#ffefe9] text-[#f80d5d] font-bold px-3 py-1.5 rounded-full text-[11px] uppercase tracking-wider mb-2 w-max border border-[#fda6e1]/50 shadow-sm">
                Account Protection
              </div>

              {steps.map((step, index) => (
                <div key={step.path} className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black shrink-0 transition-all ${
                      step.active
                        ? "bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] text-white shadow-md"
                        : index < 2
                          ? "bg-slate-800 text-white"
                          : "bg-slate-200 text-slate-400"
                    }`}
                  >
                    {index < 2 ? "✓" : index + 1}
                  </div>
                  <div>
                    <div
                      className={`text-sm font-bold ${step.active || index < 2 ? "text-slate-900" : "text-slate-400"}`}
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

              <div className="mt-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-3 text-sm flex items-center gap-2">
                  🛡️ How it works
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium mb-3">
                  By default, accounts you personally followed{" "}
                  <strong>before</strong> starting Virallized are not
                  unfollowed.
                </p>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Only accounts followed by our engine will be candidates for
                  unfollowing. You only need to whitelist an account if you
                  notice one was followed and you want to keep following it
                  permanently!
                </p>
              </div>
            </aside>
          )}

          <section
            className={`${isStandalone ? "lg:col-span-10 lg:col-start-2" : "lg:col-span-9"} bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/40 p-6 md:p-10 lg:p-12 relative overflow-hidden transition-all duration-300`}
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d]"></div>

            <div className="mb-10 text-center lg:text-left">
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-4">
                {isStandalone
                  ? "Manage Your Whitelist"
                  : "Set up your Whitelist"}
              </h1>
              <p className="text-base text-slate-600 leading-relaxed max-w-xl mx-auto lg:mx-0">
                Add usernames you never want our AI to unfollow. This preserves
                important connections like family, friends, or brand deals.
              </p>
            </div>

            {/* 🚨 FIX: EXPLICIT 2-COLUMN GRID FOR INPUTS 🚨 */}
            <div className="grid lg:grid-cols-2 gap-8 items-start">
              {/* COLUMN 1: Client Account Lookup */}
              <div className="bg-slate-50 p-6 md:p-8 rounded-2xl border border-slate-200 h-full flex flex-col justify-center">
                <label className="block text-sm font-black text-slate-900 uppercase tracking-wider mb-2">
                  Your Account
                </label>
                <p className="text-[13px] text-slate-500 font-medium mb-5">
                  Enter your Instagram handle so we can apply these whitelist
                  rules to your profile.
                </p>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                    @
                  </span>
                  <input
                    type="text"
                    required
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    className={`${inputClass} pl-9 bg-white shadow-sm border-slate-300`}
                    placeholder="yourusername"
                  />
                </div>
              </div>

              {/* COLUMN 2: Add to Whitelist */}
              <div className="bg-slate-50 p-6 md:p-8 rounded-2xl border border-slate-200">
                <label className="block text-sm font-black text-slate-900 uppercase tracking-wider mb-2">
                  Accounts to Protect
                </label>
                <p className="text-[13px] text-slate-500 font-medium mb-5">
                  Add the handles of competitors, friends, or brands you never
                  want us to unfollow.
                </p>

                {/* INLINE ADD FORM */}
                <form onSubmit={handleAddItem} className="flex gap-3 mb-6">
                  <input
                    value={currentInput}
                    onChange={(e) => setCurrentInput(e.target.value)}
                    placeholder="@targetusername"
                    className={`${inputClass} bg-white shadow-sm flex-1 border-slate-300`}
                  />
                  <button
                    type="submit"
                    disabled={!currentInput.trim()}
                    className={`px-6 py-3 rounded-xl font-bold text-sm shadow-sm transition-all ${
                      currentInput.trim()
                        ? "bg-slate-900 text-white hover:bg-slate-800"
                        : "bg-slate-200 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    Add
                  </button>
                </form>

                {/* DYNAMIC LIST DISPLAY */}
                <div className="flex flex-col gap-3 max-h-[240px] overflow-y-auto pr-2">
                  {whitelistItems.length === 0 ? (
                    <p className="text-slate-400 text-xs italic text-center py-6 bg-white rounded-xl border border-slate-200 border-dashed">
                      No accounts added yet.
                    </p>
                  ) : (
                    whitelistItems.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-sm"
                      >
                        <span className="font-bold text-slate-700 text-sm">
                          {item}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="text-slate-400 hover:text-red-500 transition-colors font-bold text-lg leading-none px-2"
                          title="Remove account"
                        >
                          ×
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* MAIN SUBMIT BUTTONS */}
            <div className="flex flex-col sm:flex-row items-center gap-4 mt-10">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !handle.trim()}
                className="w-full sm:w-2/3 text-center bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] text-white py-4 rounded-xl font-black tracking-wide hover:opacity-90 transition-opacity text-[14px] shadow-lg shadow-[#ff2429]/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting
                  ? "Saving..."
                  : isStandalone
                    ? "Save Changes"
                    : "Save & Continue"}
              </button>

              <Link
                to="/update-targeting"
                className="w-full sm:w-1/3 text-center bg-slate-100 text-slate-600 py-4 rounded-xl font-bold hover:bg-slate-200 transition-colors text-[14px] border border-slate-200"
              >
                Back
              </Link>
            </div>

            {/* Mobile-only help text */}
            <p className="text-[11px] text-center text-slate-500 font-medium lg:hidden mt-6">
              Need help? Email{" "}
              <a
                href="mailto:support@virallized.com"
                className="text-[#f80d5d] hover:underline"
              >
                support@virallized.com
              </a>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Whitelist;

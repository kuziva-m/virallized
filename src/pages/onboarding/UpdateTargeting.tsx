import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../../lib/supabase";

const steps = [
  { label: "Set up", path: "/set-up", active: false },
  { label: "Update targeting", path: "/update-targeting", active: true },
  { label: "Add 2FA", path: "/add-2fa", active: false },
];

const UpdateTargeting = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  const isStandalone = !(
    location.state?.fromSetup || document.referrer.includes("set-up")
  );
  const [isSuccess, setIsSuccess] = useState(false);

  // States
  const [handle, setHandle] = useState("");
  const [targetItems, setTargetItems] = useState<string[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [password, setPassword] = useState("");

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

  // 🚨 UPDATED: Instant addition, no API tokens wasted!
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = currentInput.trim();
    if (!trimmedInput) return;

    const formattedHandle = trimmedInput.startsWith("@")
      ? trimmedInput
      : `@${trimmedInput}`;

    if (!targetItems.some((item) => item.split(":")[0] === formattedHandle)) {
      setTargetItems([...targetItems, formattedHandle]);
    } else {
      alert("This account is already in your list.");
    }
    setCurrentInput("");
  };

  const handleRemoveItem = (indexToRemove: number) => {
    setTargetItems(targetItems.filter((_, index) => index !== indexToRemove));
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
        .select("id, targets, full_name, ig_password")
        .or(
          `ig_handle.ilike.${cleanSearchHandle},ig_handle.ilike.@${cleanSearchHandle}`,
        )
        .single();

      if (searchError || !existingClient) {
        throw new Error(
          "We couldn't find an account with that Instagram Username.",
        );
      }

      const currentTargetsArray = existingClient.targets
        ? existingClient.targets
            .split(",")
            .map((i: string) => i.trim())
            .filter(Boolean)
        : [];

      const combinedTargets = [
        ...new Set([...currentTargetsArray, ...targetItems]),
      ];

      const hasNewTargets = targetItems.length > 0;
      const hasPasswordChange = password.trim() !== "";

      if (!hasNewTargets && !hasPasswordChange) {
        if (isStandalone) setIsSuccess(true);
        else navigate("/add-2fa");
        return;
      }

      const updatePayload: any = {};
      if (hasNewTargets) {
        updatePayload.targets = combinedTargets.join(", ");
      }
      if (hasPasswordChange) {
        updatePayload.ig_password = password;
      }

      const { error: updateError } = await supabase
        .from("clients")
        .update(updatePayload)
        .eq("id", existingClient.id);

      if (updateError) throw updateError;

      // Email Logic
      let emailContent = "";
      let emailSubject = `🔄 Update: ${cleanSearchHandle}`;

      if (hasNewTargets) {
        const cleanNewTargets = targetItems
          .map((t) => t.split(":")[0].replace(/^@/, ""))
          .join(", ");

        emailContent += `
          <h3 style="color: #0b0d1f; border-bottom: 2px solid #f8f9fa; padding-bottom: 8px; margin-top: 20px;">🎯 New Targets Added</h3>
          <div style="background-color: #f8f9fa; padding: 16px; border-radius: 8px; border-left: 4px solid #4e32c7;">
            <p style="margin: 0; font-family: monospace; font-size: 15px; color: #4e32c7; font-weight: bold; line-height: 1.6;">
              ${cleanNewTargets}
            </p>
          </div>
        `;
      }

      if (hasPasswordChange) {
        emailSubject = `🔐 Password Change: ${cleanSearchHandle}`;
        emailContent += `
          <h3 style="color: #0b0d1f; border-bottom: 2px solid #f8f9fa; padding-bottom: 8px; margin-top: 20px;">🔐 Instagram Password Updated</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; text-align: left;">
            <tr>
              <th style="padding: 10px 0; width: 130px; color: #6b7280; border-bottom: 1px solid #f3f4f6;">Old Password:</th>
              <td style="font-family: monospace; font-size: 15px; border-bottom: 1px solid #f3f4f6;">
                ${existingClient.ig_password ? existingClient.ig_password : "<span style='color: #9ca3af;'>[None previously set]</span>"}
              </td>
            </tr>
            <tr>
              <th style="padding: 10px 0; width: 130px; color: #6b7280;">New Password:</th>
              <td style="font-family: monospace; font-size: 15px; font-weight: bold; color: #f80d5d;">
                ${password}
              </td>
            </tr>
          </table>
        `;
      }

      const finalHtml = `
        <div style="font-family: sans-serif; padding: 25px; border: 1px solid #eee; border-radius: 12px; max-width: 600px;">
          <h2 style="color: #f80d5d; margin-top: 0;">Client Update Alert!</h2>
          <p style="font-size: 16px; color: #0b0d1f;">
            <strong>${existingClient.full_name || "A client"}</strong> (${cleanSearchHandle}) just updated their account details.
          </p>
          ${emailContent}
        </div>
      `;

      try {
        await supabase.functions.invoke("send-email", {
          body: {
            to: "jay@virallized.com",
            subject: emailSubject,
            html: finalHtml,
          },
        });
      } catch (emailErr) {
        console.error("Failed to send update email:", emailErr);
      }

      if (isStandalone) {
        setIsSuccess(true);
      } else {
        navigate("/add-2fa");
      }
    } catch (error: any) {
      alert(error.message || "An error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  if (isLoadingProfile)
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        Loading...
      </div>
    );

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
              Successfully Updated!
            </h2>
            <p className="text-slate-600 mb-8 font-medium leading-relaxed">
              Your new settings have been securely saved and automatically added
              to your growth strategy.
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
    "w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f80d5d]/20 focus:border-[#f80d5d] transition-all text-sm text-slate-900 bg-slate-50 focus:bg-white placeholder-slate-400";
  const labelClass =
    "block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2";

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
              {steps.map((step, index) => (
                <div key={step.path} className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black shrink-0 transition-all ${
                      step.active
                        ? "bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] text-white shadow-md"
                        : index < 1
                          ? "bg-slate-800 text-white"
                          : "bg-slate-200 text-slate-400"
                    }`}
                  >
                    {index < 1 ? "✓" : index + 1}
                  </div>
                  <div>
                    <div
                      className={`text-sm font-bold ${step.active || index < 1 ? "text-slate-900" : "text-slate-400"}`}
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
          )}

          <section
            className={`${isStandalone ? "lg:col-span-8 lg:col-start-3" : "lg:col-span-9"} bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/40 p-6 md:p-10 relative overflow-hidden transition-all duration-300`}
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d]"></div>

            <div className="mb-10">
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-4">
                Update Targeting
              </h1>
              <p className="text-base text-slate-600 leading-relaxed">
                Adding new targets here will{" "}
                <span className="font-bold text-slate-900">not override</span>{" "}
                your current targeting.
              </p>
            </div>

            <div className="flex flex-col gap-8">
              <div>
                <label className={labelClass}>Instagram Username</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                    @
                  </span>
                  <input
                    type="text"
                    required
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    className={`${inputClass} pl-9`}
                    placeholder="yourusername"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-5 md:p-6 rounded-2xl border border-slate-200">
                <label className="block text-[13px] font-bold text-slate-900 mb-4">
                  New Targets
                </label>
                <form onSubmit={handleAddItem} className="flex gap-3 mb-6">
                  <input
                    value={currentInput}
                    onChange={(e) => setCurrentInput(e.target.value)}
                    placeholder="@competitor"
                    className={`${inputClass} bg-white shadow-sm flex-1`}
                  />
                  <button
                    type="submit"
                    disabled={!currentInput.trim()}
                    className="px-6 py-3 rounded-xl font-bold text-sm bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-200 transition-colors"
                  >
                    Add
                  </button>
                </form>

                <div className="flex flex-col gap-3">
                  {targetItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-sm"
                    >
                      <span className="font-bold text-slate-700 text-sm">
                        {item.split(":")[0]}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="text-slate-400 hover:text-red-500 font-bold px-2 text-xl leading-none"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelClass}>Update Instagram Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Only if changed"
                  className={inputClass}
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !handle.trim()}
                className="w-full text-center bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] text-white py-4 rounded-xl font-black tracking-wide hover:opacity-90 disabled:opacity-50 transition-opacity shadow-lg shadow-[#ff2429]/20"
              >
                {isSubmitting
                  ? "Saving..."
                  : isStandalone
                    ? "Save Changes"
                    : "Save & Continue"}
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default UpdateTargeting;

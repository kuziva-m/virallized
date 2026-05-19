import { useState } from "react";
import { Link } from "react-router-dom";
import SEO from "../components/SEO";
import { supabase } from "../lib/supabase";

const AgencyPricing = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [formData, setFormData] = useState({
    agencyName: "",
    contactName: "",
    email: "",
    website: "",
    igHandle: "",
    startingAccounts: "3",
    expectedAccounts: "3-5",
    interestedPlans: [] as string[],
    needsLocal: false,
    notes: "",
  });

  const handlePlanToggle = (plan: string) => {
    setFormData((prev) => ({
      ...prev,
      interestedPlans: prev.interestedPlans.includes(plan)
        ? prev.interestedPlans.filter((p) => p !== plan)
        : [...prev.interestedPlans, plan],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 1. Send the application alert to the admin
      const emailHtml = `
        <div style="font-family: sans-serif; padding: 20px; max-width: 600px;">
          <h2>🚀 New Agency Application</h2>
          <p><strong>Agency:</strong> ${formData.agencyName}</p>
          <p><strong>Contact:</strong> ${formData.contactName} (${formData.email})</p>
          <p><strong>Website:</strong> ${formData.website}</p>
          <p><strong>IG Handle:</strong> @${formData.igHandle.replace("@", "")}</p>
          <hr />
          <p><strong>Starting Accounts:</strong> ${formData.startingAccounts}</p>
          <p><strong>Expected (3mo):</strong> ${formData.expectedAccounts}</p>
          <p><strong>Interested Plans:</strong> ${formData.interestedPlans.join(", ") || "None selected"}</p>
          <p><strong>Needs Local Targeting:</strong> ${formData.needsLocal ? "Yes" : "No"}</p>
          <p><strong>Notes:</strong> ${formData.notes || "None"}</p>
        </div>
      `;

      await supabase.functions.invoke("send-admin-alert", {
        body: {
          to: "jay@virallized.com",
          subject: `🚨 Agency App: ${formData.agencyName}`,
          html: emailHtml,
        },
      });

      setIsSuccess(true);
    } catch (error) {
      alert(
        "Something went wrong submitting your application. Please email support@virallized.com directly.",
      );
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f80d5d]/20 focus:border-[#f80d5d] transition-all text-sm font-medium";
  const labelClass =
    "block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2";

  return (
    <>
      <SEO
        title="Agency Pricing | Virallized"
        description="Manage multiple client Instagram campaigns with discounted agency pricing and a centralized dashboard."
        path="/agency-pricing"
      />

      <div className="min-h-screen bg-[#fafafa] font-sans selection:bg-[#ffefe9] selection:text-[#f80d5d]">
        {/* HEADER */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
          <div className="container mx-auto px-6 h-16 md:h-20 flex items-center justify-between max-w-5xl">
            <Link to="/">
              <img
                src="/images/logos/virallized-main-logo.svg"
                alt="Virallized"
                className="h-6 md:h-8"
              />
            </Link>
            <Link
              to="/#pricing"
              className="text-xs md:text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors whitespace-nowrap"
            >
              ← Back to standard
            </Link>
          </div>
        </header>

        <main className="container mx-auto px-5 md:px-6 py-12 md:py-16 lg:py-24 max-w-5xl">
          <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-[10px] md:text-[11px] font-bold uppercase tracking-widest mb-6">
              Virallized Partners
            </div>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight mb-4 md:mb-6 leading-tight">
              Instagram Growth Fulfillment for Agencies
            </h1>
            <p className="text-base md:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Manage multiple client campaigns through Virallized with
              discounted agency pricing, centralized account management, and one
              simple dashboard.
            </p>
          </div>

          <div className="flex flex-col lg:grid lg:grid-cols-12 gap-10 lg:gap-16 items-start">
            {/* LEFT COLUMN: BENEFITS & INFO */}
            <div className="w-full lg:col-span-5 space-y-8 md:space-y-12 lg:sticky lg:top-32">
              <div>
                <h3 className="text-xl font-black text-slate-900 mb-6 border-b border-slate-200 pb-4">
                  Agency Dashboard Features
                </h3>
                <ul className="space-y-4">
                  {[
                    "Discounted pricing for multiple accounts",
                    "Manage all client accounts from one dashboard",
                    "Add new client accounts easily",
                    "Track campaign status for each client",
                    "View growth performance per account",
                    "Manage and update targets per client",
                    "View billing, plans, and statuses in one place",
                    "Dedicated support for agency accounts",
                  ].map((benefit, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 text-slate-700 font-medium text-sm md:text-base leading-snug"
                    >
                      <div className="w-5 h-5 rounded-full bg-[#10b981]/10 flex items-center justify-center shrink-0 mt-0.5">
                        <svg
                          className="w-3 h-3 text-[#10b981]"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-lg">
                <h4 className="font-black text-lg mb-2 flex items-center gap-2">
                  <span className="text-2xl">🤝</span> Partnership Requirements
                </h4>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Agency pricing is available for agencies managing{" "}
                  <strong className="text-white">
                    3 or more active client accounts
                  </strong>
                  . Discounts scale based on your monthly account volume and
                  selected plans.
                </p>
              </div>
            </div>

            {/* RIGHT COLUMN: APPLICATION FORM */}
            <div className="w-full lg:col-span-7">
              {isSuccess ? (
                <div className="bg-white rounded-[2rem] border border-slate-200 p-8 md:p-10 text-center shadow-xl">
                  <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl border border-green-100">
                    ✓
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 mb-4">
                    Application Received!
                  </h2>
                  <p className="text-slate-600 mb-8 leading-relaxed text-sm md:text-base">
                    Thank you for applying. Our team will review your request
                    and get back to you shortly with your approved agency
                    pricing and dashboard setup instructions.
                  </p>
                  <Link
                    to="/"
                    className="inline-block w-full md:w-auto bg-slate-900 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-slate-800 transition-colors"
                  >
                    Return to Homepage
                  </Link>
                </div>
              ) : (
                <div className="bg-white rounded-[2rem] border border-slate-200 p-6 md:p-10 shadow-xl shadow-slate-200/50">
                  <div className="mb-8">
                    <h2 className="text-xl md:text-2xl font-black text-slate-900 mb-2">
                      Apply for Access
                    </h2>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">
                      Fill out the form below. Our team will review your
                      request, confirm your agency pricing, and manually
                      provision your dashboard.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6">
                      <div>
                        <label className={labelClass}>Agency Name *</label>
                        <input
                          type="text"
                          required
                          value={formData.agencyName}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              agencyName: e.target.value,
                            })
                          }
                          className={inputClass}
                          placeholder="Acme Media"
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Contact Name *</label>
                        <input
                          type="text"
                          required
                          value={formData.contactName}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              contactName: e.target.value,
                            })
                          }
                          className={inputClass}
                          placeholder="Jane Doe"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6">
                      <div>
                        <label className={labelClass}>Email Address *</label>
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          className={inputClass}
                          placeholder="jane@acmemedia.com"
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Agency Website</label>
                        <input
                          type="text"
                          value={formData.website}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              website: e.target.value,
                            })
                          }
                          className={inputClass}
                          placeholder="acmemedia.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>
                        Agency Instagram Handle
                      </label>
                      <input
                        type="text"
                        value={formData.igHandle}
                        onChange={(e) =>
                          setFormData({ ...formData, igHandle: e.target.value })
                        }
                        className={inputClass}
                        placeholder="@acmemedia"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6 border-t border-slate-100 pt-6">
                      <div>
                        <label className={labelClass}>
                          Starting Accounts? *
                        </label>
                        <select
                          required
                          value={formData.startingAccounts}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              startingAccounts: e.target.value,
                            })
                          }
                          className={inputClass}
                        >
                          <option value="1-2">
                            1-2 (Does not qualify yet)
                          </option>
                          <option value="3">3 (Minimum required)</option>
                          <option value="4-5">4-5</option>
                          <option value="6-10">6-10</option>
                          <option value="11-20">11-20</option>
                          <option value="20+">20+</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>
                          Expected Accounts (3 mo)?
                        </label>
                        <select
                          value={formData.expectedAccounts}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              expectedAccounts: e.target.value,
                            })
                          }
                          className={inputClass}
                        >
                          <option value="3-5">3-5</option>
                          <option value="6-10">6-10</option>
                          <option value="11-20">11-20</option>
                          <option value="20-50">20-50</option>
                          <option value="50+">50+</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>
                        Interested Plans? (Select all that apply)
                      </label>
                      <div className="flex flex-wrap gap-2 md:gap-3">
                        {["STANDARD", "PRO", "MAX", "MANAGED"].map((plan) => (
                          <button
                            key={plan}
                            type="button"
                            onClick={() => handlePlanToggle(plan)}
                            className={`px-3 py-2 md:px-4 md:py-2 rounded-lg text-[10px] md:text-xs font-bold transition-all border ${
                              formData.interestedPlans.includes(plan)
                                ? "bg-slate-900 text-white border-slate-900"
                                : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            {plan}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-start gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <input
                        type="checkbox"
                        id="localTargeting"
                        checked={formData.needsLocal}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            needsLocal: e.target.checked,
                          })
                        }
                        className="mt-1 w-4 h-4 rounded border-slate-300 text-[#f80d5d] focus:ring-[#f80d5d]"
                      />
                      <label
                        htmlFor="localTargeting"
                        className="text-sm font-medium text-slate-700 cursor-pointer leading-tight"
                      >
                        Do any of your clients require specific local or city
                        targeting?
                      </label>
                    </div>

                    <div>
                      <label className={labelClass}>Additional Notes</label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) =>
                          setFormData({ ...formData, notes: e.target.value })
                        }
                        rows={3}
                        className={inputClass}
                        placeholder="Tell us about your agency, your clients, or ask any questions here..."
                      ></textarea>
                    </div>

                    <div className="pt-2 md:pt-4">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] text-white py-4 rounded-xl font-black text-sm md:text-base hover:opacity-90 transition-opacity shadow-lg shadow-[#ff2429]/20 disabled:opacity-50"
                      >
                        {isSubmitting
                          ? "Submitting..."
                          : "Apply for Agency Access"}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default AgencyPricing;

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";

const steps = [
  { label: "Set up", path: "/set-up", active: false },
  { label: "Update targeting", path: "/update-targeting", active: false },
  { label: "Whitelist", path: "/whitelist", active: true },
  { label: "Add 2FA", path: "/add-2fa", active: false },
];

const Whitelist = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dynamic List States
  const [whitelistItems, setWhitelistItems] = useState<string[]>([]);
  const [currentInput, setCurrentInput] = useState("");

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault(); // Prevent form submission

    const trimmedInput = currentInput.trim();
    if (!trimmedInput) return;

    // Ensure it starts with an @ symbol for consistency
    const formattedHandle = trimmedInput.startsWith("@")
      ? trimmedInput
      : `@${trimmedInput}`;

    // Prevent duplicates
    if (!whitelistItems.includes(formattedHandle)) {
      setWhitelistItems([...whitelistItems, formattedHandle]);
    }

    setCurrentInput(""); // Clear the input field for the next one
  };

  const handleRemoveItem = (indexToRemove: number) => {
    setWhitelistItems(
      whitelistItems.filter((_, index) => index !== indexToRemove),
    );
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    // 1. SECURE CHECK: Get the currently logged-in user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Your session expired! Please log in.");
      navigate("/set-up");
      return;
    }

    // 2. Format the array back into a comma-separated string for the database
    const whitelistString = whitelistItems.join(", ");

    // 3. Update their specific row
    const { error } = await supabase
      .from("clients")
      .update({ whitelist: whitelistString })
      .eq("id", user.id);

    if (error) {
      console.error("Error updating whitelist:", error);
      alert("There was an issue saving your whitelist. Please try again.");
      setIsSubmitting(false);
    } else {
      // 4. Send them to the final 2FA step!
      navigate("/add-2fa");
    }
  };

  // Reusable input styling class
  const inputClass =
    "w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f80d5d]/20 focus:border-[#f80d5d] transition-all text-sm text-slate-900 bg-white placeholder-slate-400";

  return (
    <main className="min-h-screen bg-[#fafafa] py-12 px-6 lg:px-8 flex items-center justify-center font-sans selection:bg-[#ffefe9] selection:text-[#f80d5d]">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
        {/* LEFT SIDE: TEXT AND STEPS */}
        <aside className="lg:col-span-5 flex flex-col pt-4">
          <div className="inline-block bg-[#ffefe9] text-[#f80d5d] font-bold px-3 py-1.5 rounded-full text-[11px] uppercase tracking-wider mb-6 w-max border border-[#fda6e1]/50 shadow-sm">
            Account Protection
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-4">
            Set up your{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d]">
              Whitelist.
            </span>
          </h1>

          <p className="text-slate-600 text-sm md:text-base leading-relaxed mb-12 max-w-sm">
            Add usernames you never want our AI to unfollow. This preserves
            important connections like family, friends, or brand deals.
          </p>

          <div className="hidden lg:flex flex-col gap-6">
            {steps.map((step, index) => (
              <div key={step.path} className="flex items-center gap-5">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black shrink-0 transition-all ${
                    step.active
                      ? "bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] text-white shadow-md"
                      : index < 2 // Steps 1 and 2 are done
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
          </div>

          {/* Educational Sidebar Box */}
          <div className="mt-12 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hidden lg:block">
            <h3 className="font-bold text-slate-900 mb-3 text-sm flex items-center gap-2">
              🛡️ How it works
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium mb-3">
              By default, accounts you personally followed{" "}
              <strong>before</strong> starting Virallized are not unfollowed.
            </p>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Only accounts followed by our engine will be candidates for
              unfollowing. You only need to whitelist an account if you notice
              one was followed and you want to keep following it permanently!
            </p>
          </div>
        </aside>

        {/* RIGHT SIDE: THE FORM */}
        <section className="lg:col-span-7 bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/40 p-6 md:p-10 lg:p-12">
          <div className="flex flex-col gap-8">
            <div className="bg-slate-50 p-5 md:p-6 rounded-2xl border border-slate-200">
              <label className="block text-[13px] font-bold text-slate-900 mb-4">
                Add an Instagram Handle
              </label>

              {/* INLINE ADD FORM */}
              <form onSubmit={handleAddItem} className="flex gap-3 mb-6">
                <input
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  placeholder="@username"
                  className={`${inputClass} shadow-sm flex-1`}
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
              <div className="flex flex-col gap-3">
                {whitelistItems.length === 0 ? (
                  <p className="text-slate-400 text-xs italic text-center py-4 bg-white rounded-xl border border-slate-200 border-dashed">
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

            {/* MAIN SUBMIT BUTTONS */}
            <div className="flex flex-col sm:flex-row items-center gap-4 mt-2">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full sm:w-2/3 text-center bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] text-white py-4 rounded-xl font-black tracking-wide hover:opacity-90 transition-opacity text-[13px] shadow-lg shadow-[#ff2429]/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Saving..." : "Save & Continue"}
              </button>

              <Link
                to="/update-targeting"
                className="w-full sm:w-1/3 text-center bg-slate-100 text-slate-600 py-4 rounded-xl font-bold hover:bg-slate-200 transition-colors text-[13px] border border-slate-200"
              >
                Back
              </Link>
            </div>

            {/* Mobile-only help text (since sidebar is hidden on mobile) */}
            <p className="text-[11px] text-center text-slate-500 font-medium lg:hidden mt-2">
              Need help? Email{" "}
              <a
                href="mailto:support@virallized.com"
                className="text-[#f80d5d] hover:underline"
              >
                support@virallized.com
              </a>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Whitelist;

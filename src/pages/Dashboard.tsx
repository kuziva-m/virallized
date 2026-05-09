import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Settings from "./Settings";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Data States
  const [profile, setProfile] = useState<any>(null);
  const [metrics, setMetrics] = useState<any[]>([]);

  // Dynamic Form States
  const [newTarget, setNewTarget] = useState("");
  const [newWhitelist, setNewWhitelist] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Tracks if they have unsaved changes requiring an email send
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // 🚨 NEW: 3-STRIKES LIMIT STATES 🚨
  const [updatesRemaining, setUpdatesRemaining] = useState(3);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    checkLimits(); // Run limit check on load
  }, []);

  // 🚨 NEW: LIMIT ENGINE 🚨
  const checkLimits = () => {
    const stored = localStorage.getItem("virallized_target_updates") || "[]";
    let timestamps: number[] = [];
    try {
      timestamps = JSON.parse(stored);
    } catch (e) {}

    const now = Date.now();
    const last24h = timestamps.filter(
      (ts: number) => now - ts < 24 * 60 * 60 * 1000,
    );

    localStorage.setItem("virallized_target_updates", JSON.stringify(last24h));

    const remaining = Math.max(0, 3 - last24h.length);
    setUpdatesRemaining(remaining);
    setIsLocked(remaining === 0);
  };

  const recordUpdate = () => {
    const stored = localStorage.getItem("virallized_target_updates") || "[]";
    let timestamps: number[] = [];
    try {
      timestamps = JSON.parse(stored);
    } catch (e) {}
    timestamps.push(Date.now());
    localStorage.setItem(
      "virallized_target_updates",
      JSON.stringify(timestamps),
    );
    checkLimits();
  };

  const fetchDashboardData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      navigate("/login");
      return;
    }

    const { data: clientData, error: clientError } = await supabase
      .from("clients")
      .select("*")
      .eq("id", user.id)
      .single();

    if (clientError) console.error("Error fetching profile:", clientError);
    if (clientData) setProfile(clientData);

    const { data: metricData, error: metricError } = await supabase
      .from("growth_metrics")
      .select("*")
      .eq("client_id", user.id)
      .order("recorded_at", { ascending: true });

    if (metricError) console.error("Error fetching metrics:", metricError);
    if (metricData) {
      const formattedMetrics = metricData.map((m) => ({
        ...m,
        followers: Number(m.total_followers) || Number(m.followers) || 0,
        displayDate: new Date(m.recorded_at).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
      }));
      setMetrics(formattedMetrics);
    }

    setLoading(false);
  };

  const handleAddItem = async (
    field: "targets" | "whitelist",
    e: React.FormEvent,
  ) => {
    e.preventDefault();
    if (isLocked) return;

    setIsUpdating(true);

    const inputValue = field === "targets" ? newTarget : newWhitelist;
    const trimmedInput = inputValue.trim();

    if (!trimmedInput) {
      setIsUpdating(false);
      return;
    }

    const formattedHandle = trimmedInput.startsWith("@")
      ? trimmedInput
      : `@${trimmedInput}`;

    const currentItems = profile[field]
      ? profile[field]
          .split(",")
          .map((i: string) => i.trim())
          .filter(Boolean)
      : [];

    const handleExists = currentItems.some(
      (item: string) => item.split(":")[0] === formattedHandle,
    );

    if (!handleExists) {
      const updatedString = [...currentItems, formattedHandle].join(", ");

      const { error } = await supabase
        .from("clients")
        .update({ [field]: updatedString })
        .eq("id", profile.id);

      if (!error) {
        setProfile({ ...profile, [field]: updatedString });
        setHasUnsavedChanges(true); // Flag that a change was made!
      } else {
        alert(`Error updating ${field}.`);
      }
    } else {
      alert("This account is already in your list.");
    }

    if (field === "targets") setNewTarget("");
    if (field === "whitelist") setNewWhitelist("");
    setIsUpdating(false);
  };

  const handleRemoveItem = async (
    field: "targets" | "whitelist",
    itemToRemove: string,
  ) => {
    if (isLocked) return;

    setIsUpdating(true);
    const currentItems = profile[field]
      .split(",")
      .map((i: string) => i.trim())
      .filter(Boolean);

    const updatedString = currentItems
      .filter((i: string) => i !== itemToRemove)
      .join(", ");

    const { error } = await supabase
      .from("clients")
      .update({ [field]: updatedString })
      .eq("id", profile.id);

    if (!error) {
      setProfile({ ...profile, [field]: updatedString });
      setHasUnsavedChanges(true); // Flag that a change was made!
    } else {
      alert(`Error updating ${field}.`);
    }
    setIsUpdating(false);
  };

  const handleBulkEmailUpdate = async () => {
    setIsSendingEmail(true);

    const cleanIgHandle = profile.ig_handle?.replace("@", "") || "unknown";

    const currentTargets = profile?.targets
      ? profile.targets
          .split(",")
          .map((i: string) => i.trim().split(":")[0].replace("@", ""))
          .filter(Boolean)
          .join(", ")
      : "None";

    const currentWhitelist = profile?.whitelist
      ? profile.whitelist
          .split(",")
          .map((i: string) => i.trim().replace("@", ""))
          .filter(Boolean)
          .join(", ")
      : "None";

    const emailHtml = `
      <div style="font-family: sans-serif; padding: 30px; max-width: 600px; background-color: #f8fafc; border-radius: 12px;">
        <h2 style="color: #0f172a; margin-top: 0;">🔄 Strategy Update Saved</h2>
        <p style="font-size: 16px; color: #475569;">
          <strong>${profile.full_name || "A client"}</strong> (@${cleanIgHandle}) just updated their Dashboard strategy. Below is their complete, active list:
        </p>
        
        <div style="background-color: white; padding: 24px; border-radius: 8px; border: 1px solid #e2e8f0; margin-top: 20px;">
          <h3 style="color: #f80d5d; margin-top: 0; font-size: 14px; text-transform: uppercase; tracking: widest;">🎯 Active Targets</h3>
          <p style="margin: 0; font-family: monospace; font-size: 15px; color: #1e293b; font-weight: bold; line-height: 1.6;">
            ${currentTargets}
          </p>
        </div>

        <div style="background-color: white; padding: 24px; border-radius: 8px; border: 1px solid #e2e8f0; margin-top: 16px;">
          <h3 style="color: #10b981; margin-top: 0; font-size: 14px; text-transform: uppercase; tracking: widest;">🛡️ Active Whitelist</h3>
          <p style="margin: 0; font-family: monospace; font-size: 15px; color: #1e293b; font-weight: bold; line-height: 1.6;">
            ${currentWhitelist}
          </p>
        </div>
      </div>
    `;

    try {
      await fetch(
        "https://qbxkdxfsfjyxtrpnsavu.supabase.co/functions/v1/send-email",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: "jay@virallized.com",
            subject: `🔄 Strategy Update: @${cleanIgHandle}`,
            html: emailHtml,
          }),
        },
      );

      setHasUnsavedChanges(false);
      recordUpdate(); // 🚨 LOG THE STRIKE
      alert("Changes have been permanently saved to your strategy.");
    } catch (err) {
      console.error("Failed to send email alert", err);
      alert("Saved locally, but failed to notify admin. Please try again.");
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-[#f80d5d] rounded-full animate-spin"></div>
          <p className="text-slate-500 font-bold tracking-widest text-xs uppercase">
            Loading Command Center
          </p>
        </div>
      </div>
    );
  }

  const targetsArray = profile?.targets
    ? profile.targets
        .split(",")
        .map((i: string) => i.trim())
        .filter(Boolean)
        .map((item: string) => {
          const [handle, followers] = item.split(":");
          return { raw: item, handle, followers };
        })
    : [];

  const whitelistArray = profile?.whitelist
    ? profile.whitelist
        .split(",")
        .map((i: string) => i.trim())
        .filter(Boolean)
    : [];

  const isMissingInfo =
    !profile?.ig_handle || profile?.ig_handle === "@" || !profile?.ig_password;

  return (
    <main className="min-h-screen bg-[#fafafa] font-sans pb-20 selection:bg-[#ffefe9] selection:text-[#f80d5d]">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between max-w-6xl">
          <div className="flex items-center gap-6">
            <img
              src="/images/logos/virallized-main-logo.svg"
              alt="Virallized"
              className="h-7 md:h-8"
            />
            <div className="hidden md:block w-px h-8 bg-slate-200"></div>
            <h1 className="hidden md:block text-xl font-black text-slate-900 tracking-tight">
              Command Center
            </h1>
          </div>

          <div className="flex items-center gap-4 md:gap-6">
            <div className="text-right hidden sm:block flex items-center gap-4">
              <div className="inline-block align-middle">
                <p className="text-sm font-bold text-slate-900 leading-tight">
                  {profile?.ig_handle && profile?.ig_handle !== "@"
                    ? profile.ig_handle
                    : profile?.full_name}
                </p>
                <p className="text-[10px] font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[#ffae07] to-[#f80d5d]">
                  {profile?.plan || "Standard"} Plan
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-xs font-bold text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 max-w-6xl mt-8 lg:mt-12">
        <nav className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-8 lg:mb-10">
          {["overview", "targeting", "whitelist", "billing", "settings"].map(
            (tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 rounded-xl font-bold text-sm capitalize whitespace-nowrap transition-all ${
                  activeTab === tab
                    ? "bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] text-white shadow-md shadow-[#ff2429]/20"
                    : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 shadow-sm"
                }`}
              >
                {tab}
              </button>
            ),
          )}
        </nav>

        {/* TAB: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="flex flex-col gap-8">
            {isMissingInfo && (
              <div className="bg-[#ffefe9] border border-[#fda6e1] rounded-[2rem] p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                <div>
                  <h3 className="text-[#f80d5d] font-black text-xl mb-1 flex items-center gap-2">
                    ⚠️ Action Required: Missing Details
                  </h3>
                  <p className="text-slate-700 text-sm font-medium">
                    Your automated growth cannot start until you securely
                    provide your Instagram handle and password.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("settings")}
                  className="bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] text-white px-8 py-3 rounded-xl font-black text-sm shadow-md whitespace-nowrap hover:opacity-90 transition-opacity"
                >
                  Complete Setup
                </button>
              </div>
            )}

            <section className="bg-white p-6 lg:p-8 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/40">
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    Growth Trajectory 📈
                  </h2>
                </div>
              </div>

              <div className="w-full h-[350px] lg:h-[400px]">
                {metrics.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={metrics}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="colorGradient"
                          x1="0%"
                          y1="0%"
                          x2="100%"
                          y2="0%"
                        >
                          <stop offset="0%" stopColor="#ffae07" />
                          <stop offset="50%" stopColor="#ff2429" />
                          <stop offset="100%" stopColor="#f1078d" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#f1f5f9"
                      />
                      <XAxis
                        dataKey="displayDate"
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fill: "#94a3b8",
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                        dy={10}
                      />
                      <YAxis
                        domain={["dataMin", "auto"]}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) => {
                          if (value >= 1000)
                            return `${(value / 1000).toFixed(1)}k`;
                          return value;
                        }}
                        tick={{
                          fill: "#94a3b8",
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                        dx={-10}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "12px",
                          border: "none",
                          boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                          fontWeight: "bold",
                          color: "#0f172a",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="followers"
                        stroke="url(#colorGradient)"
                        strokeWidth={4}
                        dot={{
                          r: 5,
                          fill: "#f80d5d",
                          strokeWidth: 3,
                          stroke: "white",
                        }}
                        activeDot={{
                          r: 8,
                          fill: "#ffae07",
                          stroke: "white",
                          strokeWidth: 2,
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                    <img
                      src="/images/icons/calendar.svg"
                      alt="Wait"
                      className="w-12 opacity-20 mb-3"
                    />
                    <p className="text-slate-400 font-bold text-sm">
                      Awaiting initial data synchronization...
                    </p>
                  </div>
                )}
              </div>
            </section>

            <section className="bg-white p-6 lg:p-8 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/40">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-8">
                Current Strategy
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <div className="w-8 h-8 rounded-full bg-[#ffefe9] flex items-center justify-center mb-3">
                    📱
                  </div>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Instagram Handle
                  </h3>
                  <p className="text-slate-900 font-bold text-base truncate">
                    {profile?.ig_handle && profile?.ig_handle !== "@"
                      ? `@${profile.ig_handle.replace("@", "")}`
                      : "Not Set"}
                  </p>
                </div>

                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <div className="w-8 h-8 rounded-full bg-[#ffefe9] flex items-center justify-center mb-3">
                    🎯
                  </div>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Primary Niche
                  </h3>
                  <p className="text-slate-900 font-bold text-base truncate">
                    {profile?.niche || "Not Set"}
                  </p>
                </div>

                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <div className="w-8 h-8 rounded-full bg-[#ffefe9] flex items-center justify-center mb-3">
                    👥
                  </div>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Ideal Follower
                  </h3>
                  <p className="text-slate-900 font-bold text-sm line-clamp-2">
                    {profile?.target_audience || "Not Set"}
                  </p>
                </div>

                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <div className="w-8 h-8 rounded-full bg-[#ffefe9] flex items-center justify-center mb-3">
                    🚀
                  </div>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Primary Goal
                  </h3>
                  <p className="text-slate-900 font-bold text-sm line-clamp-2">
                    {profile?.goals || "Not Set"}
                  </p>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* TAB: TARGETING */}
        {activeTab === "targeting" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative pb-20">
            <aside className="lg:col-span-4 bg-gradient-to-br from-[#1e293b] to-[#0f172a] text-white p-8 rounded-[2rem] shadow-xl">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6 text-2xl">
                🎯
              </div>
              <h3 className="text-xl font-black mb-4 tracking-tight">
                Targeting Strategy
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed mb-6">
                Ensure your targets represent high-affinity audiences. Broad or
                inactive targeting dilutes campaign efficiency.
              </p>
              <ul className="space-y-3 text-sm font-medium text-slate-300">
                <li className="flex items-center gap-2">
                  <span className="text-[#f80d5d]">✓</span> 25k–500k followers
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#f80d5d]">✓</span> High engagement
                  rates
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#f80d5d]">✓</span> Similar content to
                  yours
                </li>
              </ul>
            </aside>

            <section className="lg:col-span-8 bg-white p-6 lg:p-8 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/40">
              <h2 className="text-2xl font-black text-slate-900 mb-6 tracking-tight">
                Target Configuration
              </h2>

              {/* 🚨 THE LIMIT NOTIFICATION BANNER 🚨 */}
              <div
                className={`mb-8 p-4 rounded-2xl border text-sm font-bold flex items-center gap-3 ${
                  isLocked
                    ? "bg-red-50 text-red-600 border-red-200"
                    : "bg-blue-50 text-blue-600 border-blue-200"
                }`}
              >
                <div className="text-xl">{isLocked ? "🔒" : "💡"}</div>
                <div>
                  {isLocked
                    ? "Daily optimization limit reached to protect account safety. Please try again tomorrow."
                    : `You have ${updatesRemaining} target update${updatesRemaining !== 1 ? "s" : ""} remaining today.`}
                </div>
              </div>

              <form
                onSubmit={(e) => handleAddItem("targets", e)}
                className="flex flex-col sm:flex-row gap-3 mb-8 bg-slate-50 p-2 rounded-2xl border border-slate-200"
              >
                <input
                  value={newTarget}
                  disabled={isLocked}
                  onChange={(e) => setNewTarget(e.target.value)}
                  placeholder="Enter @competitor handle"
                  className={`flex-1 px-4 py-3 rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-[#f80d5d] focus:ring-1 focus:ring-[#f80d5d] text-sm font-medium ${isLocked ? "opacity-50 cursor-not-allowed bg-slate-100" : ""}`}
                />
                <button
                  type="submit"
                  disabled={isUpdating || !newTarget.trim() || isLocked}
                  className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add
                </button>
              </form>

              <div className="flex flex-col gap-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
                  Active Targets ({targetsArray.length})
                </h3>
                {targetsArray.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                    <p className="text-slate-400 font-medium text-sm">
                      No targets currently active.
                    </p>
                  </div>
                ) : (
                  targetsArray.map((target: any) => (
                    <div
                      key={target.raw}
                      className="flex justify-between items-center px-5 py-4 bg-white border border-slate-200 shadow-sm rounded-2xl hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-900 text-sm">
                          {target.handle}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRemoveItem("targets", target.raw)}
                        disabled={isLocked}
                        className="text-slate-400 hover:text-red-500 transition-colors text-2xl leading-none px-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Remove Target"
                      >
                        ×
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>

            {hasUnsavedChanges && (
              <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-lg bg-white rounded-2xl p-4 shadow-2xl border border-slate-200 flex items-center justify-between z-50 animate-bounce-short">
                <div className="text-sm font-bold text-slate-700 ml-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#f80d5d] animate-pulse"></span>
                  Unsaved changes
                </div>
                <button
                  onClick={handleBulkEmailUpdate}
                  disabled={isSendingEmail || isLocked}
                  className="bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] text-white px-8 py-3 rounded-xl font-black text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSendingEmail ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB: WHITELIST */}
        {activeTab === "whitelist" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative pb-20">
            <aside className="lg:col-span-4 bg-gradient-to-br from-[#1e293b] to-[#0f172a] text-white p-8 rounded-[2rem] shadow-xl">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6 text-2xl">
                🛡️
              </div>
              <h3 className="text-xl font-black mb-4 tracking-tight">
                Protection Rules
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed mb-4">
                Accounts added to this directory bypass the automated unfollow
                protocols entirely.
              </p>
              <div className="bg-white/10 p-4 rounded-xl text-xs font-medium leading-relaxed text-slate-200 border border-white/5">
                <strong>Note:</strong> Accounts you followed manually prior to
                onboarding are already protected by default.
              </div>
            </aside>

            <section className="lg:col-span-8 bg-white p-6 lg:p-8 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/40">
              <h2 className="text-2xl font-black text-slate-900 mb-6 tracking-tight">
                Whitelist Configuration
              </h2>

              {/* 🚨 THE LIMIT NOTIFICATION BANNER 🚨 */}
              <div
                className={`mb-8 p-4 rounded-2xl border text-sm font-bold flex items-center gap-3 ${
                  isLocked
                    ? "bg-red-50 text-red-600 border-red-200"
                    : "bg-blue-50 text-blue-600 border-blue-200"
                }`}
              >
                <div className="text-xl">{isLocked ? "🔒" : "💡"}</div>
                <div>
                  {isLocked
                    ? "Daily optimization limit reached to protect account safety. Please try again tomorrow."
                    : `You have ${updatesRemaining} target update${updatesRemaining !== 1 ? "s" : ""} remaining today.`}
                </div>
              </div>

              <form
                onSubmit={(e) => handleAddItem("whitelist", e)}
                className="flex flex-col sm:flex-row gap-3 mb-8 bg-slate-50 p-2 rounded-2xl border border-slate-200"
              >
                <input
                  value={newWhitelist}
                  disabled={isLocked}
                  onChange={(e) => setNewWhitelist(e.target.value)}
                  placeholder="Enter @handle to protect"
                  className={`flex-1 px-4 py-3 rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-[#ffae07] focus:ring-1 focus:ring-[#ffae07] text-sm font-medium ${isLocked ? "opacity-50 cursor-not-allowed bg-slate-100" : ""}`}
                />
                <button
                  type="submit"
                  disabled={isUpdating || !newWhitelist.trim() || isLocked}
                  className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Protect
                </button>
              </form>

              <div className="flex flex-col gap-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
                  Protected Accounts ({whitelistArray.length})
                </h3>
                {whitelistArray.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                    <p className="text-slate-400 font-medium text-sm">
                      No accounts whitelisted.
                    </p>
                  </div>
                ) : (
                  whitelistArray.map((wl: string) => (
                    <div
                      key={wl}
                      className="flex justify-between items-center px-5 py-4 bg-white border border-slate-200 shadow-sm rounded-2xl hover:border-slate-300 transition-colors"
                    >
                      <span className="font-bold text-slate-900 text-sm">
                        {wl}
                      </span>
                      <button
                        onClick={() => handleRemoveItem("whitelist", wl)}
                        disabled={isLocked}
                        className="text-slate-400 hover:text-red-500 transition-colors text-2xl leading-none px-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Remove Protection"
                      >
                        ×
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* 🚨 THE SAVE BUTTON ACTION BAR */}
            {hasUnsavedChanges && (
              <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-lg bg-white rounded-2xl p-4 shadow-2xl border border-slate-200 flex items-center justify-between z-50 animate-bounce-short">
                <div className="text-sm font-bold text-slate-700 ml-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#f80d5d] animate-pulse"></span>
                  Unsaved changes
                </div>
                <button
                  onClick={handleBulkEmailUpdate}
                  disabled={isSendingEmail || isLocked}
                  className="bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] text-white px-8 py-3 rounded-xl font-black text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSendingEmail ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB: BILLING */}
        {activeTab === "billing" && (
          <section className="bg-white p-8 lg:p-12 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/40 max-w-2xl mx-auto text-center">
            <div className="w-16 h-16 bg-[#ffefe9] rounded-full flex items-center justify-center mx-auto mb-6 text-3xl shadow-sm border border-[#fda6e1]/30">
              💳
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
              Subscription Management
            </h2>
            <p className="text-sm text-slate-500 font-medium mb-8">
              Active Tier:{" "}
              <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-[#ffae07] to-[#f80d5d]">
                {profile?.plan || "Standard"}
              </span>
            </p>

            <div className="flex flex-col gap-4 w-full max-w-sm mx-auto">
              <a
                href="https://billing.stripe.com/p/login/aEUcPy76VfQ4cxy8ww" // 🚨 CORRECTED STRIPE LINK 🚨
                target="_blank"
                rel="noreferrer"
                className="w-full text-center bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] text-white py-4 rounded-xl font-black hover:opacity-90 transition-opacity text-sm shadow-lg shadow-[#ff2429]/20"
              >
                Access Stripe Billing Portal
              </a>
              <a
                href={`mailto:support@virallized.com?subject=Cancellation Request: ${profile?.full_name}&body=Please process my cancellation request for ${profile?.ig_handle}.`}
                className="w-full text-center bg-slate-50 text-slate-600 py-4 rounded-xl font-bold hover:bg-slate-100 transition-colors text-sm border border-slate-200"
              >
                Request Manual Cancellation
              </a>
            </div>

            <div className="mt-10 bg-slate-50 p-5 rounded-2xl border border-slate-200 text-left">
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                <strong className="text-slate-900">Notice:</strong>{" "}
                Modifications to payment methods and tier scaling are handled
                securely via the Stripe portal. Account cancellations require a
                manual security review by our team to safely decommission the
                automated infrastructure connected to your Instagram profile.
              </p>
            </div>
          </section>
        )}

        {/* TAB: SETTINGS */}
        {activeTab === "settings" && (
          <div className="-mt-6">
            <Settings profile={profile} onUpdate={fetchDashboardData} />
          </div>
        )}
      </div>
    </main>
  );
};

export default Dashboard;

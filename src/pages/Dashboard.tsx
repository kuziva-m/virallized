import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { toast } from "../lib/toast";
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
import {
  TrendingUp,
  Users,
  UserCheck,
  Scale,
  Sparkles,
  Heart,
  MessageCircle,
  Play,
  Zap,
  BarChart2,
  Smartphone,
  Target,
  Rocket,
  Shield,
  CreditCard,
  AlertTriangle,
  Lock,
  Lightbulb,
  LogOut,
  X,
  Check,
} from "lucide-react";

// ── Shared stat card ──────────────────────────────────────────────────────────
const StatCard = ({
  label,
  value,
  description,
  badge,
  icon: Icon,
  highlight = false,
  positive,
  iconColor = "#f80d5d",
}: {
  label: string;
  value: string;
  description?: string;
  badge?: { text: string; color: string };
  icon: React.ElementType;
  highlight?: boolean;
  positive?: boolean;
  iconColor?: string;
}) => (
  <div
    className={`p-4 sm:p-5 rounded-2xl border flex flex-col gap-2 ${
      highlight
        ? "bg-gradient-to-br from-[#fff8f0] to-white border-[#fda6e1]/40"
        : "bg-white border-slate-200"
    } shadow-sm`}
  >
    <Icon size={18} color={iconColor} strokeWidth={2.5} />
    <div className="flex items-end gap-2 flex-wrap">
      <div
        className={`text-xl sm:text-2xl font-black leading-none ${
          positive === true
            ? "text-emerald-500"
            : positive === false
            ? "text-red-400"
            : "text-slate-900"
        }`}
      >
        {value}
      </div>
      {badge && (
        <span
          className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md leading-none mb-0.5"
          style={{ background: badge.color + "20", color: badge.color }}
        >
          {badge.text}
        </span>
      )}
    </div>
    <div>
      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-tight">
        {label}
      </div>
      {description && (
        <div className="text-[11px] text-slate-400 font-medium mt-0.5 leading-snug">
          {description}
        </div>
      )}
    </div>
  </div>
);

// ── Formatted Y-axis tick ─────────────────────────────────────────────────────
const formatYAxis = (value: number) => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return String(value);
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const [profile, setProfile] = useState<any>(null);
  const [metrics, setMetrics] = useState<any[]>([]);

  const [newTarget, setNewTarget] = useState("");
  const [newWhitelist, setNewWhitelist] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const [updatesRemaining, setUpdatesRemaining] = useState(3);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    checkLimits();
  }, []);

  const checkLimits = () => {
    const stored = localStorage.getItem("virallized_target_updates") || "[]";
    let timestamps: number[] = [];
    try { timestamps = JSON.parse(stored); } catch {}
    const now = Date.now();
    const last24h = timestamps.filter((ts: number) => now - ts < 24 * 60 * 60 * 1000);
    localStorage.setItem("virallized_target_updates", JSON.stringify(last24h));
    const remaining = Math.max(0, 3 - last24h.length);
    setUpdatesRemaining(remaining);
    setIsLocked(remaining === 0);
  };

  const recordUpdate = () => {
    const stored = localStorage.getItem("virallized_target_updates") || "[]";
    let timestamps: number[] = [];
    try { timestamps = JSON.parse(stored); } catch {}
    timestamps.push(Date.now());
    localStorage.setItem("virallized_target_updates", JSON.stringify(timestamps));
    checkLimits();
  };

  const formatMetrics = (data: any[]) =>
    data.map((m) => ({
      ...m,
      followers:       Number(m.total_followers) || Number(m.followers) || 0,
      following_count: Number(m.following_count) || 0,
      post_count:      Number(m.post_count)      || 0,
      avg_likes:       Number(m.avg_likes)        || 0,
      avg_comments:    Number(m.avg_comments)     || 0,
      avg_reel_plays:  Number(m.avg_reel_plays)   || 0,
      engagement_rate: Number(m.engagement_rate)  || 0,
      displayDate: new Date(m.recorded_at).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
    }));

  const fetchDashboardData = async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/login"); return; }

    let resolvedClient: any = null;

    const { data: clientById, error: clientByIdError } = await supabase
      .from("clients").select("*").eq("id", user.id).maybeSingle();
    if (clientByIdError) console.error("Error fetching profile by auth ID:", clientByIdError);
    resolvedClient = clientById;

    if (!resolvedClient && user.email) {
      const { data: clientByEmail, error: clientByEmailError } = await supabase
        .from("clients").select("*").eq("email", user.email).maybeSingle();
      if (clientByEmailError) console.error("Error fetching profile by email:", clientByEmailError);
      resolvedClient = clientByEmail;
    }

    if (!resolvedClient) {
      console.error("No client profile found:", user.id, user.email);
      setProfile(null);
      setMetrics([]);
      setLoading(false);
      return;
    }

    setProfile(resolvedClient);

    // Fire-and-forget: refresh analytics in background on every login
    supabase.functions.invoke("daily-tracker", { body: { clientId: resolvedClient.id } })
      .then(() => {
        supabase.from("growth_metrics").select("*")
          .eq("client_id", resolvedClient.id)
          .order("recorded_at", { ascending: true })
          .then(({ data }) => { if (data) setMetrics(formatMetrics(data)); });
      })
      .catch(() => {});

    const { data: metricData, error: metricError } = await supabase
      .from("growth_metrics").select("*")
      .eq("client_id", resolvedClient.id)
      .order("recorded_at", { ascending: true });

    if (metricError) console.error("Error fetching metrics:", metricError);
    setMetrics(metricData ? formatMetrics(metricData) : []);
    setLoading(false);
  };

  const handleAddItem = async (field: "targets" | "whitelist", e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;
    setIsUpdating(true);

    const inputValue = field === "targets" ? newTarget : newWhitelist;
    const trimmedInput = inputValue.trim();
    if (!trimmedInput) { setIsUpdating(false); return; }

    const formattedHandle = trimmedInput.startsWith("@") ? trimmedInput : `@${trimmedInput}`;
    const currentItems = profile[field]
      ? profile[field].split(",").map((i: string) => i.trim()).filter(Boolean)
      : [];

    if (!currentItems.some((item: string) => item.split(":")[0] === formattedHandle)) {
      const updatedString = [...currentItems, formattedHandle].join(", ");
      const { error } = await supabase.from("clients").update({ [field]: updatedString }).eq("id", profile.id);
      if (!error) { setProfile({ ...profile, [field]: updatedString }); setHasUnsavedChanges(true); }
      else toast.error(`Error updating ${field}.`);
    } else {
      toast.info("This account is already in your list.");
    }

    if (field === "targets") setNewTarget("");
    if (field === "whitelist") setNewWhitelist("");
    setIsUpdating(false);
  };

  const handleRemoveItem = async (field: "targets" | "whitelist", itemToRemove: string) => {
    if (isLocked) return;
    setIsUpdating(true);
    const updatedString = profile[field]
      .split(",").map((i: string) => i.trim()).filter(Boolean)
      .filter((i: string) => i !== itemToRemove).join(", ");
    const { error } = await supabase.from("clients").update({ [field]: updatedString }).eq("id", profile.id);
    if (!error) { setProfile({ ...profile, [field]: updatedString }); setHasUnsavedChanges(true); }
    else toast.error(`Error updating ${field}.`);
    setIsUpdating(false);
  };

  const handleBulkEmailUpdate = async () => {
    setIsSendingEmail(true);
    const cleanIgHandle = profile.ig_handle?.replace("@", "") || "unknown";
    const currentTargets = profile?.targets
      ? profile.targets.split(",").map((i: string) => i.trim().split(":")[0].replace("@", "")).filter(Boolean).join(", ")
      : "None";
    const currentWhitelist = profile?.whitelist
      ? profile.whitelist.split(",").map((i: string) => i.trim().replace("@", "")).filter(Boolean).join(", ")
      : "None";

    const emailHtml = `
      <div style="font-family: sans-serif; padding: 30px; max-width: 600px; background-color: #f8fafc; border-radius: 12px;">
        <h2 style="color: #0f172a; margin-top: 0;">Strategy Update Saved</h2>
        <p style="font-size: 16px; color: #475569;">
          <strong>${profile.full_name || "A client"}</strong> (@${cleanIgHandle}) just updated their Dashboard strategy.
        </p>
        <div style="background-color: white; padding: 24px; border-radius: 8px; border: 1px solid #e2e8f0; margin-top: 20px;">
          <h3 style="color: #f80d5d; margin-top: 0; font-size: 14px; text-transform: uppercase;">Active Targets</h3>
          <p style="margin: 0; font-family: monospace; font-size: 15px; color: #1e293b; font-weight: bold; line-height: 1.6;">${currentTargets}</p>
        </div>
        <div style="background-color: white; padding: 24px; border-radius: 8px; border: 1px solid #e2e8f0; margin-top: 16px;">
          <h3 style="color: #10b981; margin-top: 0; font-size: 14px; text-transform: uppercase;">Active Whitelist</h3>
          <p style="margin: 0; font-family: monospace; font-size: 15px; color: #1e293b; font-weight: bold; line-height: 1.6;">${currentWhitelist}</p>
        </div>
      </div>
    `;

    try {
      const { error } = await supabase.functions.invoke("send-admin-alert", {
        body: { to: "jay@virallized.com", subject: `Strategy Update: @${cleanIgHandle}`, html: emailHtml },
      });
      if (error) throw error;
      setHasUnsavedChanges(false);
      recordUpdate();
      toast.success("Changes have been permanently saved to your strategy.");
    } catch (err) {
      console.error("Failed to send email alert", err);
      toast.error("Saved locally, but failed to notify admin. Please try again.");
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
          <div className="w-10 h-10 border-4 border-slate-200 border-t-[#f80d5d] rounded-full animate-spin" />
          <p className="text-slate-500 font-bold tracking-widest text-xs uppercase">Loading Command Center</p>
        </div>
      </div>
    );
  }

  const targetsArray = profile?.targets
    ? profile.targets.split(",").map((i: string) => i.trim()).filter(Boolean)
        .map((item: string) => { const [handle, followers] = item.split(":"); return { raw: item, handle, followers }; })
    : [];

  const whitelistArray = profile?.whitelist
    ? profile.whitelist.split(",").map((i: string) => i.trim()).filter(Boolean)
    : [];

  const isMissingInfo = !profile?.ig_handle || profile?.ig_handle === "@" || !profile?.ig_password;

  const TABS = ["overview", "targeting", "whitelist", "billing", "settings"];

  return (
    <main className="min-h-screen bg-[#fafafa] font-sans pb-24 selection:bg-[#ffefe9] selection:text-[#f80d5d]">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between max-w-6xl">
          <div className="flex items-center gap-4 sm:gap-6">
            <img src="/images/logos/virallized-main-logo.svg" alt="Virallized" className="h-6 sm:h-8" />
            <div className="hidden md:block w-px h-8 bg-slate-200" />
            <h1 className="hidden md:block text-xl font-black text-slate-900 tracking-tight">Command Center</h1>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-bold text-slate-900 leading-tight">
                {profile?.ig_handle && profile?.ig_handle !== "@" ? profile.ig_handle : profile?.full_name}
              </p>
              <p className="text-[10px] font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[#ffae07] to-[#f80d5d]">
                {profile?.plan || "Standard"} Plan
              </p>
            </div>
            <button
              onClick={() => navigate("/content-studio")}
              className="flex items-center gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] px-3 py-2 rounded-lg shadow-sm shadow-[#ff2429]/20 transition-all hover:shadow-md"
            >
              <Sparkles size={13} />
              <span className="hidden sm:inline">Content </span>Studio
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 sm:px-4 py-2 rounded-lg transition-colors"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 max-w-6xl mt-6 sm:mt-10">
        {/* ── Tab nav ────────────────────────────────────────────────────────── */}
        <nav className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-6 sm:mb-10">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm capitalize whitespace-nowrap transition-all ${
                activeTab === tab
                  ? "bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] text-white shadow-md shadow-[#ff2429]/20"
                  : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 shadow-sm"
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>

        {/* ── TAB: OVERVIEW ──────────────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <div className="flex flex-col gap-6 sm:gap-8">
            {/* Missing info banner */}
            {isMissingInfo && (
              <div className="bg-[#ffefe9] border border-[#fda6e1] rounded-[2rem] p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={20} className="text-[#f80d5d] mt-0.5 shrink-0" strokeWidth={2.5} />
                  <div>
                    <h3 className="text-[#f80d5d] font-black text-lg sm:text-xl mb-1">Action Required: Missing Details</h3>
                    <p className="text-slate-700 text-sm font-medium">
                      Your automated growth cannot start until you securely provide your Instagram handle and password.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab("settings")}
                  className="bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] text-white px-6 py-3 rounded-xl font-black text-sm shadow-md whitespace-nowrap hover:opacity-90 transition-opacity w-full sm:w-auto text-center"
                >
                  Complete Setup
                </button>
              </div>
            )}

            {/* Growth Trajectory chart */}
            <section className="bg-white p-5 sm:p-8 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/40">
              <div className="flex items-center gap-3 mb-6 sm:mb-8">
                <TrendingUp size={22} color="#f80d5d" strokeWidth={2.5} />
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Growth Trajectory</h2>
              </div>

              <div className="w-full h-[280px] sm:h-[360px]">
                {metrics.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={metrics} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#ffae07" />
                          <stop offset="50%" stopColor="#ff2429" />
                          <stop offset="100%" stopColor="#f1078d" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="displayDate"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 600 }}
                        dy={10}
                      />
                      <YAxis
                        domain={["dataMin", "auto"]}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={formatYAxis}
                        tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 600 }}
                        width={52}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "12px",
                          border: "none",
                          boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                          fontWeight: "bold",
                          color: "#0f172a",
                          fontSize: "13px",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="followers"
                        stroke="url(#colorGradient)"
                        strokeWidth={4}
                        dot={{ r: 5, fill: "#f80d5d", strokeWidth: 3, stroke: "white" }}
                        activeDot={{ r: 8, fill: "#ffae07", stroke: "white", strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl gap-3">
                    <BarChart2 size={32} className="text-slate-300" />
                    <p className="text-slate-400 font-bold text-sm">Awaiting initial data synchronization...</p>
                  </div>
                )}
              </div>
            </section>

            {/* ── Analytics Stats ── */}
            {metrics.length > 0 && (() => {
              const latest = metrics[metrics.length - 1];
              const first  = metrics[0];
              const followersGained = latest.followers - first.followers;
              const ffRatioNum = latest.following_count > 0
                ? latest.followers / latest.following_count
                : null;
              const ffRatio = ffRatioNum !== null ? ffRatioNum.toFixed(2) : "—";
              const hasEngagement = latest.avg_likes > 0 || latest.avg_comments > 0 || latest.avg_reel_plays > 0;

              // F/F ratio quality badge
              const ffBadge = ffRatioNum !== null
                ? ffRatioNum >= 5   ? { text: "Excellent", color: "#10b981" }
                : ffRatioNum >= 2   ? { text: "Healthy",   color: "#ffae07" }
                : ffRatioNum >= 1   ? { text: "Balanced",  color: "#94a3b8" }
                :                    { text: "Low",        color: "#ef4444" }
                : undefined;

              // Engagement rate quality badge (industry benchmarks)
              const er = Number(latest.engagement_rate);
              const erBadge = er > 0
                ? er >= 6  ? { text: "Viral",    color: "#f1078d" }
                : er >= 3  ? { text: "Strong",   color: "#10b981" }
                : er >= 1  ? { text: "Average",  color: "#ffae07" }
                :            { text: "Low",      color: "#ef4444" }
                : undefined;

              return (
                <section className="flex flex-col gap-4 sm:gap-6">
                  {/* Row 1: growth stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    <StatCard
                      label="Total Followers"
                      value={latest.followers.toLocaleString()}
                      description="Your current audience size"
                      icon={Users}
                      highlight
                      iconColor="#f80d5d"
                    />
                    <StatCard
                      label="Followers Gained"
                      value={followersGained >= 0 ? `+${followersGained.toLocaleString()}` : followersGained.toLocaleString()}
                      description="Net growth since tracking began"
                      icon={TrendingUp}
                      positive={followersGained > 0 ? true : followersGained < 0 ? false : undefined}
                      iconColor={followersGained >= 0 ? "#10b981" : "#ef4444"}
                    />
                    <StatCard
                      label="Following"
                      value={latest.following_count > 0 ? latest.following_count.toLocaleString() : "—"}
                      description="Accounts you currently follow"
                      icon={UserCheck}
                      iconColor="#ffae07"
                    />
                    <StatCard
                      label="F/F Ratio"
                      value={String(ffRatio)}
                      description="Followers ÷ following — higher = more authority"
                      badge={ffBadge}
                      icon={Scale}
                      iconColor="#ff2429"
                    />
                  </div>

                  {/* Row 2: engagement stats */}
                  {hasEngagement && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                      <StatCard
                        label="Avg Likes / Post"
                        value={latest.avg_likes > 0 ? latest.avg_likes.toLocaleString() : "—"}
                        description="Average across your last 12 posts"
                        icon={Heart}
                        iconColor="#f80d5d"
                      />
                      <StatCard
                        label="Avg Comments / Post"
                        value={latest.avg_comments > 0 ? latest.avg_comments.toLocaleString() : "—"}
                        description="Conversation depth per post"
                        icon={MessageCircle}
                        iconColor="#ff2429"
                      />
                      <StatCard
                        label="Avg Reel Plays"
                        value={latest.avg_reel_plays > 0 ? latest.avg_reel_plays.toLocaleString() : "—"}
                        description="Average views across last 12 reels"
                        icon={Play}
                        iconColor="#ffae07"
                      />
                      <StatCard
                        label="Engagement Rate"
                        value={er > 0 ? `${er.toFixed(2)}%` : "—"}
                        description="Industry avg: 1–3% · Strong: 3%+"
                        badge={erBadge}
                        icon={Zap}
                        iconColor="#f1078d"
                      />
                    </div>
                  )}

                  {/* Engagement trend chart */}
                  {metrics.some(m => m.avg_likes > 0) && (
                    <div className="bg-white p-5 sm:p-8 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/40">
                      <div className="flex items-center gap-3 mb-6 sm:mb-8">
                        <BarChart2 size={22} color="#f1078d" strokeWidth={2.5} />
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Engagement Trend</h2>
                      </div>
                      <div className="w-full h-[220px] sm:h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={metrics} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                            <defs>
                              <linearGradient id="likesGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#ffae07" />
                                <stop offset="100%" stopColor="#ff2429" />
                              </linearGradient>
                              <linearGradient id="commentsGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#f1078d" />
                                <stop offset="100%" stopColor="#7c3aed" />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 600 }} dy={10} />
                            <YAxis
                              axisLine={false}
                              tickLine={false}
                              tickFormatter={formatYAxis}
                              tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 600 }}
                              width={52}
                            />
                            <Tooltip
                              contentStyle={{
                                borderRadius: "12px",
                                border: "none",
                                boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                                fontWeight: "bold",
                                color: "#0f172a",
                                fontSize: "13px",
                              }}
                            />
                            <Line type="monotone" dataKey="avg_likes" name="Avg Likes" stroke="url(#likesGradient)" strokeWidth={3} dot={{ r: 4, fill: "#ff2429", strokeWidth: 2, stroke: "white" }} activeDot={{ r: 6 }} />
                            <Line type="monotone" dataKey="avg_comments" name="Avg Comments" stroke="url(#commentsGradient)" strokeWidth={3} dot={{ r: 4, fill: "#f1078d", strokeWidth: 2, stroke: "white" }} activeDot={{ r: 6 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </section>
              );
            })()}

            {/* Current Strategy */}
            <section className="bg-white p-5 sm:p-8 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/40">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-6 sm:mb-8">Current Strategy</h2>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {[
                  { icon: Smartphone, label: "Instagram Handle", value: profile?.ig_handle && profile?.ig_handle !== "@" ? `@${profile.ig_handle.replace("@", "")}` : "Not Set", color: "#f80d5d" },
                  { icon: Target,     label: "Primary Niche",     value: profile?.niche || "Not Set",             color: "#ff2429" },
                  { icon: Users,      label: "Ideal Follower",    value: profile?.target_audience || "Not Set",   color: "#ffae07" },
                  { icon: Rocket,     label: "Primary Goal",      value: profile?.goals || "Not Set",             color: "#f1078d" },
                ].map(({ icon: Icon, label, value, color }) => (
                  <div key={label} className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-100">
                    <div className="w-8 h-8 rounded-full bg-[#ffefe9] flex items-center justify-center mb-3">
                      <Icon size={16} color={color} strokeWidth={2.5} />
                    </div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</h3>
                    <p className="text-slate-900 font-bold text-sm line-clamp-2">{value}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* ── TAB: TARGETING ─────────────────────────────────────────────────── */}
        {activeTab === "targeting" && (
          <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 sm:gap-8 items-start relative pb-20">
            <aside className="lg:col-span-4 bg-gradient-to-br from-[#1e293b] to-[#0f172a] text-white p-6 sm:p-8 rounded-[2rem] shadow-xl">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-5">
                <Target size={22} color="#f80d5d" strokeWidth={2.5} />
              </div>
              <h3 className="text-xl font-black mb-3 tracking-tight">Targeting Strategy</h3>
              <p className="text-slate-300 text-sm leading-relaxed mb-5">
                Ensure your targets represent high-affinity audiences. Broad or inactive targeting dilutes campaign efficiency.
              </p>
              <ul className="space-y-3 text-sm font-medium text-slate-300">
                {["25k–500k followers", "High engagement rates", "Similar content to yours"].map((tip) => (
                  <li key={tip} className="flex items-center gap-2">
                    <Check size={14} color="#f80d5d" strokeWidth={3} />
                    {tip}
                  </li>
                ))}
              </ul>
            </aside>

            <section className="lg:col-span-8 bg-white p-5 sm:p-8 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/40">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-6 tracking-tight">Target Configuration</h2>

              <div className={`mb-6 p-4 rounded-2xl border text-sm font-bold flex items-center gap-3 ${isLocked ? "bg-red-50 text-red-600 border-red-200" : "bg-blue-50 text-blue-600 border-blue-200"}`}>
                {isLocked ? <Lock size={16} strokeWidth={2.5} /> : <Lightbulb size={16} strokeWidth={2.5} />}
                <span>
                  {isLocked
                    ? "Daily optimization limit reached to protect account safety. Please try again tomorrow."
                    : `You have ${updatesRemaining} target update${updatesRemaining !== 1 ? "s" : ""} remaining today.`}
                </span>
              </div>

              <form onSubmit={(e) => handleAddItem("targets", e)} className="flex flex-col sm:flex-row gap-3 mb-6 bg-slate-50 p-2 rounded-2xl border border-slate-200">
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
                  className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add
                </button>
              </form>

              <div className="flex flex-col gap-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Active Targets ({targetsArray.length})</h3>
                {targetsArray.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                    <p className="text-slate-400 font-medium text-sm">No targets currently active.</p>
                  </div>
                ) : (
                  targetsArray.map((target: any) => (
                    <div key={target.raw} className="flex justify-between items-center px-4 py-3 sm:px-5 sm:py-4 bg-white border border-slate-200 shadow-sm rounded-2xl hover:border-slate-300 transition-colors">
                      <span className="font-bold text-slate-900 text-sm">{target.handle}</span>
                      <button
                        onClick={() => handleRemoveItem("targets", target.raw)}
                        disabled={isLocked}
                        className="text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed p-1"
                        title="Remove Target"
                      >
                        <X size={18} strokeWidth={2.5} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>

            {hasUnsavedChanges && (
              <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-lg bg-white rounded-2xl p-4 shadow-2xl border border-slate-200 flex items-center justify-between z-50">
                <div className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#f80d5d] animate-pulse" />
                  Unsaved changes
                </div>
                <button
                  onClick={handleBulkEmailUpdate}
                  disabled={isSendingEmail || isLocked}
                  className="bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] text-white px-6 py-2.5 rounded-xl font-black text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSendingEmail ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── TAB: WHITELIST ─────────────────────────────────────────────────── */}
        {activeTab === "whitelist" && (
          <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 sm:gap-8 items-start relative pb-20">
            <aside className="lg:col-span-4 bg-gradient-to-br from-[#1e293b] to-[#0f172a] text-white p-6 sm:p-8 rounded-[2rem] shadow-xl">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-5">
                <Shield size={22} color="#ffae07" strokeWidth={2.5} />
              </div>
              <h3 className="text-xl font-black mb-3 tracking-tight">Protection Rules</h3>
              <p className="text-slate-300 text-sm leading-relaxed mb-4">
                Accounts added to this directory bypass the automated unfollow protocols entirely.
              </p>
              <div className="bg-white/10 p-4 rounded-xl text-xs font-medium leading-relaxed text-slate-200 border border-white/5">
                <strong>Note:</strong> Accounts you followed manually prior to onboarding are already protected by default.
              </div>
            </aside>

            <section className="lg:col-span-8 bg-white p-5 sm:p-8 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/40">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-6 tracking-tight">Whitelist Configuration</h2>

              <div className={`mb-6 p-4 rounded-2xl border text-sm font-bold flex items-center gap-3 ${isLocked ? "bg-red-50 text-red-600 border-red-200" : "bg-blue-50 text-blue-600 border-blue-200"}`}>
                {isLocked ? <Lock size={16} strokeWidth={2.5} /> : <Lightbulb size={16} strokeWidth={2.5} />}
                <span>
                  {isLocked
                    ? "Daily optimization limit reached to protect account safety. Please try again tomorrow."
                    : `You have ${updatesRemaining} target update${updatesRemaining !== 1 ? "s" : ""} remaining today.`}
                </span>
              </div>

              <form onSubmit={(e) => handleAddItem("whitelist", e)} className="flex flex-col sm:flex-row gap-3 mb-6 bg-slate-50 p-2 rounded-2xl border border-slate-200">
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
                  className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Protect
                </button>
              </form>

              <div className="flex flex-col gap-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Protected Accounts ({whitelistArray.length})</h3>
                {whitelistArray.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                    <p className="text-slate-400 font-medium text-sm">No accounts whitelisted.</p>
                  </div>
                ) : (
                  whitelistArray.map((wl: string) => (
                    <div key={wl} className="flex justify-between items-center px-4 py-3 sm:px-5 sm:py-4 bg-white border border-slate-200 shadow-sm rounded-2xl hover:border-slate-300 transition-colors">
                      <span className="font-bold text-slate-900 text-sm">{wl}</span>
                      <button
                        onClick={() => handleRemoveItem("whitelist", wl)}
                        disabled={isLocked}
                        className="text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed p-1"
                        title="Remove Protection"
                      >
                        <X size={18} strokeWidth={2.5} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>

            {hasUnsavedChanges && (
              <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-lg bg-white rounded-2xl p-4 shadow-2xl border border-slate-200 flex items-center justify-between z-50">
                <div className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#f80d5d] animate-pulse" />
                  Unsaved changes
                </div>
                <button
                  onClick={handleBulkEmailUpdate}
                  disabled={isSendingEmail || isLocked}
                  className="bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] text-white px-6 py-2.5 rounded-xl font-black text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSendingEmail ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── TAB: BILLING ───────────────────────────────────────────────────── */}
        {activeTab === "billing" && (
          <section className="bg-white p-6 sm:p-12 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/40 max-w-2xl mx-auto text-center">
            <div className="w-16 h-16 bg-[#ffefe9] rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-[#fda6e1]/30">
              <CreditCard size={28} color="#f80d5d" strokeWidth={2} />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-2">Subscription Management</h2>
            <p className="text-sm text-slate-500 font-medium mb-8">
              Active Tier:{" "}
              <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-[#ffae07] to-[#f80d5d]">
                {profile?.plan || "Standard"}
              </span>
            </p>

            <div className="flex flex-col gap-4 w-full max-w-sm mx-auto">
              <a
                href="https://billing.stripe.com/p/login/aEUcPy76VfQ4cxy8ww"
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

            <div className="mt-8 bg-slate-50 p-5 rounded-2xl border border-slate-200 text-left">
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                <strong className="text-slate-900">Notice:</strong>{" "}
                Modifications to payment methods and tier scaling are handled securely via the Stripe portal. Account cancellations require a manual security review by our team to safely decommission the automated infrastructure connected to your Instagram profile.
              </p>
            </div>
          </section>
        )}

        {/* ── TAB: SETTINGS ──────────────────────────────────────────────────── */}
        {activeTab === "settings" && (
          <div className="-mt-4">
            <Settings profile={profile} onUpdate={fetchDashboardData} />
          </div>
        )}
      </div>
    </main>
  );
};

export default Dashboard;

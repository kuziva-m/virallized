import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabase";
import { toast } from "../lib/toast";
import Settings from "./Settings";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";

// --- INTERFACES ---
interface AgencyClient {
  id: string;
  full_name: string;
  ig_handle: string;
  email: string;
  plan: string;
  status:
    | "running"
    | "needs_2fa"
    | "needs_password"
    | "needs_targets"
    | "paused"
    | "cancelled"
    | "pending";
  next_billing_date: string;
  targets: string;
  whitelist: string;
  ig_password?: string;
  two_factor_code?: string;
  agency_id?: string;
  followers_gained?: number;
}

interface GrowthMetric {
  recorded_at: string;
  followers: number;
}

interface AgencyRecord {
  id: string;
  status: string;
  discount_percent: number;
  stripe_customer_id: string | null;
  company_name: string | null;
  email: string | null;
}

const AgencyDashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [agency, setAgency] = useState<AgencyRecord | null>(null);
  const [isSettingUpPayment, setIsSettingUpPayment] = useState(false);
  const [paymentSetupSuccess] = useState(
    searchParams.get("payment_setup") === "success",
  );
  const [clients, setClients] = useState<AgencyClient[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Drill-down states
  const [selectedClient, setSelectedClient] = useState<AgencyClient | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState("settings");

  // Growth Tracking States
  const [chartData, setChartData] = useState<GrowthMetric[]>([]);
  const [isChartLoading, setIsChartLoading] = useState(false);

  // Add Client Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newClientForm, setNewClientForm] = useState({
    ig_handle: "",
    ig_password: "",
    two_factor_code: "",
    plan: "Standard",
    initial_targets: "",
    notes: "",
    payment_authorized: false,
  });

  useEffect(() => {
    fetchAgencyClients();
  }, []);

  // Fetch Chart Data when tab switches to growth_tracking
  useEffect(() => {
    if (selectedClient && activeTab === "growth_tracking") {
      fetchChartData(selectedClient.id);
    }
  }, [selectedClient, activeTab]);

  const handleSetupPayment = async () => {
    setIsSettingUpPayment(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const jwt = sessionData?.session?.access_token;
      if (!jwt) throw new Error("Not authenticated");

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-agency-setup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwt}`,
          },
        },
      );
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || "Something went wrong. Please try again.");
      }
    } catch (err: any) {
      toast.error("Failed to start payment setup: " + err.message);
    } finally {
      setIsSettingUpPayment(false);
    }
  };

  const fetchAgencyClients = async () => {
    setIsLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      navigate("/login");
      return;
    }

    // Fetch agency record first
    const { data: agencyData } = await supabase
      .from("agencies")
      .select("id, status, discount_percent, stripe_customer_id, company_name, email")
      .eq("user_id", user.id)
      .single();

    setAgency(agencyData ?? null);

    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("agency_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      const formattedClients = data.map((c: any) => {
        let currentStatus = "running";

        if (!c.ig_password) currentStatus = "needs_password";
        else if (!c.targets || c.targets.trim() === "")
          currentStatus = "needs_targets";
        else if (c.status === "needs_2fa") currentStatus = "needs_2fa";
        else if (c.status === "paused") currentStatus = "paused";
        else if (c.status === "cancelled") currentStatus = "cancelled";

        return {
          ...c,
          status: currentStatus,
          // Mocking billing date - in a real app, pull from Stripe or a DB column
          next_billing_date: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000,
          ).toLocaleDateString(),
          followers_gained: Math.floor(Math.random() * 500) + 100, // Replace with real diff once table is populated
        };
      });

      setClients(formattedClients);
    }
    setIsLoading(false);
  };

  const fetchChartData = async (clientId: string) => {
    setIsChartLoading(true);
    const { data, error } = await supabase
      .from("growth_metrics")
      .select("recorded_at, followers")
      .eq("client_id", clientId)
      .order("recorded_at", { ascending: true });

    if (!error && data) {
      setChartData(data);
    } else {
      setChartData([]); // Default empty if no records
    }
    setIsChartLoading(false);
  };

  const handleCancelClient = async (client: AgencyClient) => {
    if (!agency?.id) return;
    const confirmed = window.confirm(
      `Cancel @${client.ig_handle}? Their subscription will end at the current billing period.`,
    );
    if (!confirmed) return;

    try {
      const { error } = await supabase.functions.invoke("agency-billing", {
        body: { action: "remove_client", agencyId: agency.id, clientId: client.id },
      });
      if (error) throw new Error(error.message);
      await supabase.from("clients").update({ status: "cancelled" }).eq("id", client.id);
      if (selectedClient?.id === client.id) setSelectedClient(null);
      fetchAgencyClients();
    } catch (err: any) {
      toast.error("Failed to cancel client: " + err.message);
    }
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newClientForm.payment_authorized) {
      toast.info("You must authorize payment to add a new client.");
      return;
    }

    setIsAdding(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const cleanHandle = newClientForm.ig_handle.replace(/^@/, "").toLowerCase();
    let realFollowers = null;

    // 🚨 NEW: Fetch real follower count live from Instagram via RapidAPI
    try {
      const rapidApiKey = import.meta.env.VITE_RAPIDAPI_KEY;
      if (rapidApiKey) {
        const res = await fetch(
          "https://instagram-scraper-stable-api.p.rapidapi.com/ig_get_fb_profile_v3.php",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              "x-rapidapi-host": "instagram-scraper-stable-api.p.rapidapi.com",
              "x-rapidapi-key": rapidApiKey,
            },
            body: new URLSearchParams({ username_or_url: cleanHandle }),
          },
        );

        if (res.ok) {
          const json = await res.json();
          const userObj =
            json?.data?.user || json?.user || json?.graphql?.user || json;
          const followers =
            userObj?.follower_count ??
            userObj?.followers_count ??
            userObj?.edge_followed_by?.count;

          if (followers) {
            realFollowers = Number(followers);
            console.log(
              `Successfully fetched real followers for @${cleanHandle}: ${realFollowers}`,
            );
          }
        }
      }
    } catch (err) {
      console.warn(
        "Could not fetch live Instagram data, falling back to default.",
        err,
      );
    }

    try {
      const { data: insertData, error } = await supabase
        .from("clients")
        .insert([
          {
            ig_handle: cleanHandle,
            full_name: cleanHandle,
            ig_password: newClientForm.ig_password,
            two_factor_code: newClientForm.two_factor_code,
            plan: newClientForm.plan,
            targets: newClientForm.initial_targets,
            agency_notes: newClientForm.notes,
            payment_authorized: newClientForm.payment_authorized,
            agency_id: user.id,
            starting_followers: realFollowers,
          },
        ])
        .select("id")
        .single();

      if (error) throw error;

      // Create Stripe subscription for this client seat via agency-billing
      if (newClientForm.payment_authorized && insertData?.id && agency?.id) {
        try {
          const { error: billingError } = await supabase.functions.invoke("agency-billing", {
            body: {
              action: "add_client",
              agencyId: agency.id,
              clientId: insertData.id,
              plan: newClientForm.plan,
            },
          });
          if (billingError) console.error("Billing setup failed:", billingError.message);
        } catch (subErr) {
          console.error("Failed to create subscription:", subErr);
        }
      }

      toast.success(
        `Successfully added @${cleanHandle} to your agency roster! Our team will begin setup.`,
      );

      // Send alert to admin
      await supabase.functions.invoke("send-admin-alert", {
        body: {
          to: "jay@virallized.com",
          subject: `🚨 Agency Added Client: @${cleanHandle}`,
          html: `<p>An agency just provisioned a new seat for @${cleanHandle} on the ${newClientForm.plan} plan.</p>`,
        },
      });

      setIsAddModalOpen(false);
      setNewClientForm({
        ig_handle: "",
        ig_password: "",
        two_factor_code: "",
        plan: "Standard",
        initial_targets: "",
        notes: "",
        payment_authorized: false,
      });
      fetchAgencyClients();
    } catch (err: any) {
      toast.error("Failed to add client: " + err.message);
    } finally {
      setIsAdding(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case "running":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#10b981]/10 text-[#10b981] text-[10px] font-black uppercase tracking-wider border border-[#10b981]/20">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse"></span>{" "}
            Running
          </span>
        );
      case "needs_2fa":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-wider border border-red-200">
            Action: Needs 2FA Backup Code
          </span>
        );
      case "needs_password":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-wider border border-red-200">
            Action: Needs Password Update
          </span>
        );
      case "needs_targets":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-orange-50 text-orange-600 text-[10px] font-black uppercase tracking-wider border border-orange-200">
            Action: Needs Targets
          </span>
        );
      case "paused":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-wider border border-slate-200">
            Growth Paused
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 text-white text-[10px] font-black uppercase tracking-wider border border-slate-700">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-wider border border-slate-200">
            Pending
          </span>
        );
    }
  };

  const filteredClients = clients.filter(
    (c) =>
      c.ig_handle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.full_name?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Derived metrics for Growth Tracking Tab
  const startingFollowers = chartData.length > 0 ? chartData[0].followers : 0;
  const currentFollowers =
    chartData.length > 0 ? chartData[chartData.length - 1].followers : 0;
  const realFollowersGained = currentFollowers - startingFollowers;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-[#f80d5d] rounded-full animate-spin"></div>
          <p className="text-slate-500 font-bold tracking-widest text-xs uppercase">
            Loading Agency Hub
          </p>
        </div>
      </div>
    );
  }

  // Agency application is pending approval
  if (!agency || agency.status === "pending") {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center font-sans p-6">
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl p-10 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-amber-50 border border-amber-100 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
            ⏳
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-3">
            Application Under Review
          </h2>
          <p className="text-slate-500 font-medium text-sm leading-relaxed mb-8">
            Your agency application has been received. Our team will review it
            and email you with your approved dashboard access and pricing
            shortly.
          </p>
          <button
            onClick={handleLogout}
            className="text-xs font-bold text-slate-500 hover:text-red-600 bg-slate-50 hover:bg-red-50 border border-slate-200 px-4 py-2 rounded-lg transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  // Agency approved but no payment method set up yet
  if (agency.status === "approved" && !agency.stripe_customer_id) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center font-sans p-6">
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl p-10 max-w-md w-full text-center">
          <div className="h-1.5 w-full bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] rounded-full mb-8" />
          <div className="w-20 h-20 bg-green-50 border border-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
            🎉
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-3">
            Welcome to the Agency Hub!
          </h2>
          <p className="text-slate-500 font-medium text-sm leading-relaxed mb-2">
            Your account is approved with a{" "}
            <strong className="text-slate-700">
              {agency.discount_percent}% agency discount
            </strong>
            .
          </p>
          <p className="text-slate-500 font-medium text-sm leading-relaxed mb-8">
            Set up your payment method once to activate billing. You only get
            charged per client seat you authorize.
          </p>
          <button
            onClick={handleSetupPayment}
            disabled={isSettingUpPayment}
            className="w-full bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] text-white py-4 rounded-xl font-black text-sm hover:opacity-90 transition-opacity shadow-lg shadow-[#ff2429]/20 disabled:opacity-50"
          >
            {isSettingUpPayment
              ? "Redirecting to Stripe..."
              : "Set Up Payment Method →"}
          </button>
          <button
            onClick={handleLogout}
            className="mt-4 text-xs font-bold text-slate-400 hover:text-red-500 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW: DRILL-DOWN (INDIVIDUAL CLIENT)
  // ==========================================
  if (selectedClient) {
    return (
      <div className="min-h-screen bg-[#fafafa] font-sans pb-20">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
          <div className="container mx-auto px-6 h-20 flex items-center justify-between max-w-6xl">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  setSelectedClient(null);
                  fetchAgencyClients();
                }}
                className="w-10 h-10 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center text-slate-600 transition-colors"
              >
                ←
              </button>
              <div>
                <h1 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
                  @{selectedClient.ig_handle}
                </h1>
                <p className="text-xs font-bold text-slate-400">
                  Client Management
                </p>
              </div>
            </div>
            <StatusBadge status={selectedClient.status} />
          </div>
        </header>

        <div className="container mx-auto px-6 max-w-6xl mt-8">
          <nav className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-8 border-b border-slate-200">
            {["settings", "growth_tracking", "billing"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-3 font-bold text-sm capitalize whitespace-nowrap transition-all border-b-2 ${
                  activeTab === tab
                    ? "border-[#f80d5d] text-[#f80d5d]"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                {tab.replace("_", " ")}
              </button>
            ))}
          </nav>

          {activeTab === "settings" && (
            <div className="bg-white p-6 lg:p-10 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/40">
              <h2 className="text-xl font-black text-slate-900 mb-6">
                Target Management & Security
              </h2>
              <div className="-mx-6 lg:-mx-10 -mt-6">
                <Settings
                  profile={selectedClient}
                  onUpdate={fetchAgencyClients}
                />
              </div>
            </div>
          )}

          {activeTab === "growth_tracking" && (
            <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/40">
              <h3 className="text-xl font-black text-slate-900 mb-8">
                Growth Trajectory 📈
              </h3>

              {isChartLoading ? (
                <div className="py-20 text-center text-slate-400 font-medium">
                  Loading metrics...
                </div>
              ) : chartData.length === 0 ? (
                <div className="py-20 text-center text-slate-400 font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  Awaiting initial data synchronization. <br />
                  Metrics will appear once the campaign starts running.
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
                      <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1">
                        Starting Followers
                      </div>
                      <div className="text-2xl font-black text-slate-900">
                        {new Intl.NumberFormat().format(startingFollowers)}
                      </div>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
                      <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1">
                        Current Followers
                      </div>
                      <div className="text-2xl font-black text-slate-900">
                        {new Intl.NumberFormat().format(currentFollowers)}
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-[#fff6f8] to-[#fff1e6] border border-[#f80d5d]/20 rounded-2xl p-5 shadow-sm">
                      <div className="text-[11px] font-black uppercase tracking-wider text-[#f80d5d] mb-1">
                        Total Followers Gained
                      </div>
                      <div className="text-2xl font-black text-[#f80d5d]">
                        +{new Intl.NumberFormat().format(realFollowersGained)}
                      </div>
                    </div>
                  </div>

                  <div className="h-[350px] w-full mt-4 bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={chartData}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#f1f5f9"
                        />
                        <XAxis
                          dataKey="recorded_at"
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(val) =>
                            new Date(val).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                            })
                          }
                          tick={{
                            fill: "#94a3b8",
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                          dy={10}
                        />
                        <YAxis
                          domain={["dataMin", "dataMax"]}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(val) => {
                            if (val >= 1000000)
                              return `${(val / 1000000).toFixed(1)}M`;
                            if (val >= 1000)
                              return `${(val / 1000).toFixed(1)}k`;
                            return val;
                          }}
                          tick={{
                            fill: "#94a3b8",
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        />
                        <RechartsTooltip
                          contentStyle={{
                            borderRadius: "12px",
                            border: "1px solid #e2e8f0",
                            boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                            fontWeight: "bold",
                          }}
                          labelFormatter={(label) =>
                            new Date(label).toLocaleDateString(undefined, {
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            })
                          }
                        />
                        <Line
                          type="monotone"
                          dataKey="followers"
                          name="Followers"
                          stroke="#f80d5d"
                          strokeWidth={4}
                          dot={{
                            r: 4,
                            fill: "#f80d5d",
                            stroke: "white",
                            strokeWidth: 2,
                          }}
                          activeDot={{
                            r: 8,
                            fill: "#f80d5d",
                            stroke: "white",
                            strokeWidth: 2,
                          }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === "billing" && (
            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
              <h3 className="text-lg font-black text-slate-900 mb-6">
                Client Billing Status
              </h3>
              <div className="grid grid-cols-2 gap-4 max-w-md">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-xs text-slate-500 font-bold uppercase mb-1">
                    Current Plan
                  </div>
                  <div className="font-black text-slate-900">
                    {selectedClient.plan}
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-xs text-slate-500 font-bold uppercase mb-1">
                    Next Billing
                  </div>
                  <div className="font-black text-slate-900">
                    {selectedClient.next_billing_date}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW: MAIN AGENCY DASHBOARD
  // ==========================================
  return (
    <div className="min-h-screen bg-[#fafafa] font-sans pb-20 selection:bg-[#ffefe9] selection:text-[#f80d5d]">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between max-w-7xl">
          <div className="flex items-center gap-6">
            <img
              src="/images/logos/virallized-main-logo.svg"
              alt="Virallized"
              className="h-7 md:h-8"
            />
            <div className="hidden md:block w-px h-8 bg-slate-200"></div>
            <h1 className="hidden md:block text-xl font-black text-slate-900 tracking-tight">
              Agency Hub
            </h1>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs font-bold text-slate-500 hover:text-red-600 bg-slate-50 hover:bg-red-50 border border-slate-200 px-4 py-2 rounded-lg transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="container mx-auto px-6 max-w-7xl mt-12">
        {paymentSetupSuccess && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-black text-green-800 text-sm">
                Payment method set up successfully!
              </p>
              <p className="text-green-600 text-xs font-medium">
                You can now add client accounts and authorize billing per seat.
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Client Overview
            </h2>
            <p className="text-slate-500 font-medium mt-1">
              Manage, scale, and monitor your sub-accounts.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                🔍
              </span>
              <input
                type="text"
                placeholder="Search clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#f80d5d] focus:ring-1 focus:ring-[#f80d5d] text-sm font-medium transition-all shadow-sm"
              />
            </div>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] text-white px-6 py-2.5 rounded-xl text-sm font-black shadow-md shadow-[#ff2429]/20 hover:opacity-90 transition-opacity whitespace-nowrap"
            >
              + Add New Client
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              Total Seats
            </div>
            <div className="text-2xl font-black text-slate-900">
              {clients.length}
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <div className="text-[10px] font-bold text-[#10b981] uppercase tracking-widest mb-1">
              Running
            </div>
            <div className="text-2xl font-black text-slate-900">
              {clients.filter((c) => c.status === "running").length}
            </div>
          </div>
          <div className="bg-[#fff1f2] border border-[#fda6e1] rounded-2xl p-5 shadow-sm">
            <div className="text-[10px] font-bold text-[#f80d5d] uppercase tracking-widest mb-1">
              Action Needed
            </div>
            <div className="text-2xl font-black text-[#f80d5d]">
              {clients.filter((c) => c.status.includes("needs")).length}
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-sm text-left whitespace-nowrap min-w-[900px]">
              <thead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Instagram Handle</th>
                  <th className="px-6 py-4">Status & Action Needed</th>
                  <th className="px-6 py-4">Plan</th>
                  <th className="px-6 py-4">Followers Gained</th>
                  <th className="px-6 py-4">Next Billing Date</th>
                  <th className="px-6 py-4 text-right">Dashboard</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClients.map((client) => (
                  <tr
                    key={client.id}
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    onClick={() => setSelectedClient(client)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-800 to-slate-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
                          {client.ig_handle?.charAt(0).toUpperCase() || "@"}
                        </div>
                        <div className="font-black text-slate-900 text-[15px] group-hover:text-[#f80d5d] transition-colors">
                          @{client.ig_handle}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={client.status} />
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-700">
                        {client.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-[#10b981]">
                        +{client.followers_gained}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-500 font-medium">
                        {client.next_billing_date}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="bg-white border border-slate-200 hover:border-slate-300 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900">
                          Manage →
                        </button>
                        {client.status !== "cancelled" && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleCancelClient(client); }}
                            className="bg-white border border-red-200 hover:border-red-400 text-red-400 hover:text-red-600 px-3 py-2 rounded-xl text-xs font-bold shadow-sm transition-all"
                            title="Cancel subscription"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredClients.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="text-slate-400 font-medium mb-2">
                        No clients found matching your search.
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {isAddModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-full max-w-md bg-[#fafafa] shadow-2xl z-50 overflow-y-auto border-l border-slate-200"
            >
              <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 py-5 flex items-center justify-between z-10 shadow-sm">
                <h2 className="text-lg font-black text-slate-900">
                  Add New Client
                </h2>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-slate-400 hover:text-slate-800 font-bold text-xl px-2"
                >
                  ×
                </button>
              </div>

              <div className="p-6">
                <form
                  onSubmit={handleAddClient}
                  className="space-y-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"
                >
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                      Instagram Handle
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                        @
                      </span>
                      <input
                        type="text"
                        required
                        value={newClientForm.ig_handle}
                        onChange={(e) =>
                          setNewClientForm({
                            ...newClientForm,
                            ig_handle: e.target.value,
                          })
                        }
                        className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f80d5d]/20 focus:border-[#f80d5d] bg-slate-50 focus:bg-white text-sm font-medium"
                        placeholder="username"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                      Instagram Password
                    </label>
                    <input
                      type="password"
                      required
                      value={newClientForm.ig_password}
                      onChange={(e) =>
                        setNewClientForm({
                          ...newClientForm,
                          ig_password: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f80d5d]/20 focus:border-[#f80d5d] bg-slate-50 focus:bg-white text-sm font-medium"
                      placeholder="Required for setup"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                      2FA Backup Code (Optional)
                    </label>
                    <input
                      type="text"
                      value={newClientForm.two_factor_code}
                      onChange={(e) =>
                        setNewClientForm({
                          ...newClientForm,
                          two_factor_code: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f80d5d]/20 focus:border-[#f80d5d] bg-slate-50 focus:bg-white text-sm font-medium"
                      placeholder="8-digit code if 2FA is active"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                      Select Plan
                    </label>
                    <select
                      value={newClientForm.plan}
                      onChange={(e) =>
                        setNewClientForm({
                          ...newClientForm,
                          plan: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f80d5d]/20 focus:border-[#f80d5d] bg-slate-50 focus:bg-white text-sm font-medium"
                    >
                      <option value="Standard">Standard</option>
                      <option value="Pro">Pro</option>
                      <option value="Max">Max</option>
                      <option value="Managed">Managed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                      Initial Targets
                    </label>
                    <input
                      type="text"
                      value={newClientForm.initial_targets}
                      onChange={(e) =>
                        setNewClientForm({
                          ...newClientForm,
                          initial_targets: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f80d5d]/20 focus:border-[#f80d5d] bg-slate-50 focus:bg-white text-sm font-medium"
                      placeholder="e.g. @competitor1, @competitor2"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                      Notes for Virallized Team
                    </label>
                    <textarea
                      rows={2}
                      value={newClientForm.notes}
                      onChange={(e) =>
                        setNewClientForm({
                          ...newClientForm,
                          notes: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f80d5d]/20 focus:border-[#f80d5d] bg-slate-50 focus:bg-white text-sm font-medium"
                      placeholder="Specific locations? Do not engage rules?"
                    />
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <label className="flex items-start gap-3 p-3 bg-red-50 border border-red-100 rounded-xl cursor-pointer">
                      <input
                        type="checkbox"
                        required
                        checked={newClientForm.payment_authorized}
                        onChange={(e) =>
                          setNewClientForm({
                            ...newClientForm,
                            payment_authorized: e.target.checked,
                          })
                        }
                        className="mt-0.5 w-4 h-4 text-red-600 rounded border-red-300 focus:ring-red-500"
                      />
                      <span className="text-[11px] font-bold text-red-800 leading-tight">
                        I authorize Virallized to charge my payment method on
                        file for this client account according to my approved
                        agency pricing.
                      </span>
                    </label>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isAdding || !newClientForm.payment_authorized}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-xl font-black text-sm shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isAdding ? "Provisioning Seat..." : "Add Client Account"}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AgencyDashboard;

import { useState, useEffect, useRef, useMemo } from "react";
import type { FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabase";
import { toast } from "../lib/toast";
import type { Session } from "@supabase/supabase-js";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { CanceledLeadsTab } from "./CanceledLeadsTab";
import {
  Search, BarChart2, Zap, Sparkles, Crown, CheckCircle2,
  XCircle, Edit2, Save, X, Users, Wand2, TrendingUp,
} from "lucide-react";

// --- INTERFACES ---
interface Client {
  id: string;
  created_at: string;
  full_name: string;
  email: string;
  ig_handle: string;
  location: string | null;
  niche: string;
  target_audience: string;
  goals: string;
  plan: string;
  targets: string | null;
  whitelist: string | null;
  ig_password?: string;
  two_factor_code?: string;
}

interface BlogPost {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image_url: string;
  status: "draft" | "published";
  category: string;
  tags: string[];
  meta_title: string;
  meta_description: string;
  created_at?: string;
  updated_at?: string;
}

const BLOG_CATEGORIES = [
  "Instagram Growth", "Content Strategy", "Social Media Tips",
  "Case Studies", "Tools & Resources", "Industry News", "Agency Updates",
];

const EMPTY_BLOG_POST: BlogPost = {
  title: "", slug: "", excerpt: "", content: "", image_url: "",
  status: "draft", category: "", tags: [], meta_title: "", meta_description: "",
};

const blogGenerateSlug = (t: string) =>
  t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

const blogReadingTime = (html: string) => {
  const words = html.replace(/<[^>]+>/g, "").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
};

const blogWordCount = (html: string) =>
  html.replace(/<[^>]+>/g, "").trim().split(/\s+/).filter(Boolean).length;

const blogFormatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

interface AnalyzedAccount {
  id: string;
  created_at: string;
  email: string;
  ig_handle: string;
  followers: number | null;
  profile_image_url: string | null;
  avg_likes: number | null;
  avg_comments: number | null;
  engagement_rate: number | null;
  projected_with_us: number | null;
  projected_without_us: number | null;
  gain_with_us: number | null;
  gain_without_us: number | null;
  posts_analyzed: number | null;
  has_posts: boolean | null;
  source: string | null;
}

interface AgencyApplication {
  id: string;
  created_at: string;
  company_name: string | null;
  contact_name: string | null;
  email: string;
  website: string | null;
  ig_handle: string | null;
  status: string;
  discount_percent: number;
  notes: string | null;
  stripe_customer_id: string | null;
  approved_at: string | null;
}

type AdminRole = "superadmin" | "blogger" | null;
type DashboardTab = "clients" | "blogs" | "analyzed" | "canceled" | "agencies" | "creator-studio";

interface CsSubscriber {
  user_id: string;
  email: string;
  plan_tier: string;
  status: string;
  generations_used: number;
  generations_limit: number;
  billing_period: string;
  created_at: string;
  updated_at: string;
  is_earlybird: boolean;
  stripe_subscription_id: string | null;
}

const AdminDashboard = () => {
  // --- AUTH & ROLE STATE ---
  const [session, setSession] = useState<Session | null>(null);
  const [adminRole, setAdminRole] = useState<AdminRole>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // --- NAVIGATION STATE ---
  const [activeTab, setActiveTab] = useState<DashboardTab>("clients");

  // --- DASHBOARD STATE ---
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [analyzedAccounts, setAnalyzedAccounts] = useState<AnalyzedAccount[]>(
    [],
  );
  const [analyzedSearchQuery, setAnalyzedSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // --- CLIENT EDITING & DELETING STATE ---
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isEditingClient, setIsEditingClient] = useState(false);
  const [clientForm, setClientForm] = useState<Partial<Client>>({});
  const [isSavingClient, setIsSavingClient] = useState(false);

  // Email Loading States
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isSending2FAEmail, setIsSending2FAEmail] = useState(false);
  const [isSendingSetupEmail, setIsSendingSetupEmail] = useState(false);
  const [isSendingVerifyLoginEmail, setIsSendingVerifyLoginEmail] =
    useState(false);
  const [isSendingTargetsEmail, setIsSendingTargetsEmail] = useState(false);
  const [sendingAnalyzerLeadId, setSendingAnalyzerLeadId] = useState<
    string | null
  >(null);
  const [sendingAnalyzerLeadOfferId, setSendingAnalyzerLeadOfferId] = useState<
    string | null
  >(null);
  const [deletingAnalyzerLeadId, setDeletingAnalyzerLeadId] = useState<
    string | null
  >(null);

  // Gorgeous Modal States
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [auditPdfFile, setAuditPdfFile] = useState<File | null>(null);
  const [isSendingAudit, setIsSendingAudit] = useState(false);

  // Agencies state
  const [agencies, setAgencies] = useState<AgencyApplication[]>([]);
  const [isApprovingAgency, setIsApprovingAgency] = useState(false);
  const [agencyToApprove, setAgencyToApprove] = useState<AgencyApplication | null>(null);
  const [approveForm, setApproveForm] = useState({ discountPercent: 15, tempPassword: "" });

  // Creator Studio state
  const [csSubscribers, setCsSubscribers] = useState<CsSubscriber[]>([]);
  const [csEditingId, setCsEditingId] = useState<string | null>(null);
  const [csEditForm, setCsEditForm] = useState<Partial<CsSubscriber>>({});
  const [isSavingCs, setIsSavingCs] = useState(false);

  // --- BLOG EDITOR STATE ---
  const [isBlogEditorOpen, setIsBlogEditorOpen] = useState(false);
  const [isSavingBlog, setIsSavingBlog] = useState(false);
  const [blogForm, setBlogForm] = useState<BlogPost>(EMPTY_BLOG_POST);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [blogTagInput, setBlogTagInput] = useState("");
  const [blogActiveSection, setBlogActiveSection] = useState<"content" | "seo">("content");
  const [blogDragOver, setBlogDragOver] = useState(false);
  const [blogIsDirty, setBlogIsDirty] = useState(false);
  const [blogDeleteConfirmId, setBlogDeleteConfirmId] = useState<string | null>(null);
  const [isBlogDeleting, setIsBlogDeleting] = useState(false);
  const [blogHtmlPasteOpen, setBlogHtmlPasteOpen] = useState(false);
  const [blogHtmlPasteValue, setBlogHtmlPasteValue] = useState("");
  const [blogSearch, setBlogSearch] = useState("");
  const [blogFilterStatus, setBlogFilterStatus] = useState<"all" | "published" | "draft">("all");
  const [blogSortBy, setBlogSortBy] = useState<"newest" | "oldest" | "az">("newest");

  const quillRef = useRef<any>(null);
  const blogFileInputRef = useRef<HTMLInputElement>(null);

  // Prevent stale background-tab requests from leaving the dashboard stuck in loading state.
  const isMountedRef = useRef(true);
  const latestFetchIdRef = useRef(0);

  const withTimeout = async <T,>(
    promise: PromiseLike<T>,
    label: string,
    timeoutMs = 15000,
  ): Promise<T> => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(`${label} timed out. Please check your connection.`));
      }, timeoutMs);
    });

    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  };

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      latestFetchIdRef.current += 1;
    };
  }, []);

  // --- INITIALIZE AUTH & CHECK ROLES ---
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!isMountedRef.current) return;

      setSession(session);

      if (session?.user?.email) {
        await verifyAndSetRole(session.user.email);
      } else {
        setAdminRole(null);
        setIsLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);

      if (session?.user?.email) {
        // Keep Supabase auth callbacks light. Heavy async work inside this
        // callback can freeze after a browser tab is suspended/resumed.
        setTimeout(() => {
          void verifyAndSetRole(session.user.email || "", { silent: true });
        }, 0);
      } else {
        setAdminRole(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const verifyAndSetRole = async (
    userEmail: string,
    options: { silent?: boolean } = {},
  ) => {
    if (!userEmail) return null;

    try {
      const { data, error } = await withTimeout(
        supabase
          .from("admin_roles")
          .select("role")
          .eq("email", userEmail)
          .single(),
        "Admin role check",
      );

      if (error || !data) {
        if (!options.silent) {
          toast.error(
            "Access Denied: This email is not registered as an authorized admin.",
          );
        }

        await supabase.auth.signOut();

        if (isMountedRef.current) {
          setAdminRole(null);
          setIsLoading(false);
        }

        return null;
      }

      const role = data.role as AdminRole;

      if (isMountedRef.current) {
        setAdminRole(role);

        if (role === "blogger") {
          setActiveTab("blogs");
        }
      }

      return role;
    } catch (error) {
      console.error("Admin role check failed:", error);

      if (isMountedRef.current) {
        setIsLoading(false);
      }

      return null;
    }
  };

  // --- FETCH DATA ---
  useEffect(() => {
    if (session && adminRole) {
      void fetchData();
    } else {
      setIsLoading(false);
    }
  }, [session, activeTab, adminRole]);

  const fetchData = async (options: { silent?: boolean } = {}) => {
    if (!session || !adminRole) {
      setIsLoading(false);
      return;
    }

    const fetchId = latestFetchIdRef.current + 1;
    latestFetchIdRef.current = fetchId;

    if (!options.silent) {
      setIsLoading(true);
    }

    try {
      if (activeTab === "clients" && adminRole === "superadmin") {
        const { data, error } = await withTimeout(
          supabase
            .from("clients")
            .select("*")
            .order("created_at", { ascending: false }),
          "Loading clients",
        );

        if (fetchId !== latestFetchIdRef.current || !isMountedRef.current) {
          return;
        }

        if (error) throw error;

        setClients((data as Client[]) || []);
      } else if (activeTab === "analyzed" && adminRole === "superadmin") {
        const { data, error } = await withTimeout(
          supabase
            .from("analyzed_accounts")
            .select("*")
            .order("created_at", { ascending: false }),
          "Loading analyzer leads",
        );

        if (fetchId !== latestFetchIdRef.current || !isMountedRef.current) {
          return;
        }

        if (error) throw error;

        setAnalyzedAccounts((data as AnalyzedAccount[]) || []);
      } else if (activeTab === "agencies" && adminRole === "superadmin") {
        const { data, error } = await withTimeout(
          supabase
            .from("agencies")
            .select("*")
            .order("created_at", { ascending: false }),
          "Loading agency applications",
        );

        if (fetchId !== latestFetchIdRef.current || !isMountedRef.current) {
          return;
        }

        if (error) throw error;

        setAgencies((data as AgencyApplication[]) || []);
      } else if (activeTab === "creator-studio" && adminRole === "superadmin") {
        const { data, error } = await withTimeout(
          supabase.rpc("get_cs_subscribers"),
          "Loading Creator Studio subscribers",
        );

        if (fetchId !== latestFetchIdRef.current || !isMountedRef.current) {
          return;
        }

        if (error) throw error;

        setCsSubscribers((data as CsSubscriber[]) || []);
      } else if (activeTab === "blogs") {
        const { data, error } = await withTimeout(
          supabase
            .from("blogs")
            .select("*")
            .order("created_at", { ascending: false }),
          "Loading posts",
        );

        if (fetchId !== latestFetchIdRef.current || !isMountedRef.current) {
          return;
        }

        if (error) throw error;

        setBlogs((data as BlogPost[]) || []);
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      if (fetchId === latestFetchIdRef.current && isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  // Refresh session and data when returning to the tab after browser suspension.
  useEffect(() => {
    const recoverDashboard = async () => {
      if (document.visibilityState !== "visible") return;

      try {
        const { data } = await supabase.auth.getSession();
        const freshSession = data.session;

        if (!isMountedRef.current) return;

        setSession(freshSession);

        if (freshSession?.user?.email) {
          const role = await verifyAndSetRole(freshSession.user.email, {
            silent: true,
          });

          if (role) {
            await fetchData({ silent: true });
          }
        } else {
          setAdminRole(null);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Dashboard resume recovery failed:", error);
        setIsLoading(false);
      }
    };

    window.addEventListener("focus", recoverDashboard);
    window.addEventListener("online", recoverDashboard);
    document.addEventListener("visibilitychange", recoverDashboard);

    return () => {
      window.removeEventListener("focus", recoverDashboard);
      window.removeEventListener("online", recoverDashboard);
      document.removeEventListener("visibilitychange", recoverDashboard);
    };
  }, [session, adminRole, activeTab]);

  // --- AUTH HANDLERS ---
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setAuthError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) setAuthError(error.message);
    setIsLoggingIn(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // --- AGENCY APPROVAL ---
  const handleApproveAgency = async () => {
    if (!agencyToApprove || !approveForm.tempPassword) return;
    setIsApprovingAgency(true);
    try {
      const { error } = await supabase.functions.invoke("approve-agency", {
        body: {
          agencyId: agencyToApprove.id,
          discountPercent: approveForm.discountPercent,
          tempPassword: approveForm.tempPassword,
        },
      });
      if (error) {
        // Extract actual error body from FunctionsHttpError
        let msg = error.message;
        try {
          const body = await (error as any).context?.json?.();
          if (body?.error) msg = body.error;
        } catch {}
        throw new Error(msg);
      }
      toast.success(`Agency "${agencyToApprove.company_name || agencyToApprove.email}" approved! Email sent with credentials.`);
      setAgencyToApprove(null);
      setApproveForm({ discountPercent: 15, tempPassword: "" });
      void fetchData({ silent: true });
    } catch (err: any) {
      toast.error("Failed to approve agency: " + err.message);
    } finally {
      setIsApprovingAgency(false);
    }
  };

  // --- CREATOR STUDIO EDIT HANDLER ---
  const handleSaveCs = async (userId: string) => {
    setIsSavingCs(true);
    try {
      const { error } = await supabase
        .from("user_plans")
        .update({
          plan_tier: csEditForm.plan_tier,
          status: csEditForm.status,
          generations_limit: Number(csEditForm.generations_limit),
        })
        .eq("user_id", userId);
      if (error) throw error;
      toast.success("Creator Studio plan updated successfully.");
      setCsEditingId(null);
      void fetchData({ silent: true });
    } catch (err: any) {
      toast.error("Failed to update plan: " + err.message);
    } finally {
      setIsSavingCs(false);
    }
  };

  // --- CLIENT SEARCH & FILTERING ---
  const filteredClients = clients.filter((client) => {
    const query = searchQuery.toLowerCase();

    return (
      client.ig_handle?.toLowerCase().includes(query) ||
      client.full_name?.toLowerCase().includes(query) ||
      client.email?.toLowerCase().includes(query)
    );
  });

  const filteredAnalyzedAccounts = analyzedAccounts.filter((lead) => {
    const query = analyzedSearchQuery.toLowerCase();

    return (
      lead.ig_handle?.toLowerCase().includes(query) ||
      lead.email?.toLowerCase().includes(query)
    );
  });

  const formatDashboardNumber = (value?: number | null) => {
    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) return "0";

    return new Intl.NumberFormat().format(numericValue);
  };

  const formatDashboardPercent = (value?: number | null) => {
    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) return "0.00%";

    return `${numericValue.toFixed(numericValue < 1 ? 2 : 1)}%`;
  };

  const normalizeInstagramHandle = (handle?: string | null) => {
    return handle?.replace(/^@/, "").trim() || "";
  };

  const buildInstagramUrl = (handle?: string | null) => {
    const normalizedHandle = normalizeInstagramHandle(handle);

    return normalizedHandle ? `https://instagram.com/${normalizedHandle}` : "#";
  };

  const escapeHtml = (value?: string | number | null) => {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  const averageAnalyzedFollowers =
    analyzedAccounts.length > 0
      ? Math.round(
          analyzedAccounts.reduce(
            (total, lead) => total + (Number(lead.followers) || 0),
            0,
          ) / analyzedAccounts.length,
        )
      : 0;

  const isNewClient = (createdAt: string) => {
    const clientDate = new Date(createdAt).getTime();
    const sevenDaysAgo = new Date().getTime() - 7 * 24 * 60 * 60 * 1000;

    return clientDate > sevenDaysAgo;
  };

  const getFirstName = (fullName?: string) => {
    return fullName?.trim().split(" ")[0] || "there";
  };

  const formatPlanName = (plan?: string) => {
    return plan?.trim().toUpperCase() || "STANDARD";
  };

  // --- ANALYZER LEAD EMAIL HANDLER ---
  const sendAnalyzerLeadFollowUpEmail = async (lead: AnalyzedAccount) => {
    if (!lead.email) {
      toast.info("This lead does not have an email address attached.");
      return;
    }

    const normalizedHandle = normalizeInstagramHandle(lead.ig_handle);
    const confirmSend = window.confirm(
      `Send growth invitation email to ${lead.email}?`,
    );

    if (!confirmSend) return;

    setSendingAnalyzerLeadId(lead.id);

    const followers = formatDashboardNumber(lead.followers);
    const engagementRate = formatDashboardPercent(lead.engagement_rate);
    const projectedGrowth = formatDashboardNumber(lead.gain_with_us);
    const projectedFollowers = formatDashboardNumber(lead.projected_with_us);
    const safeHandle = escapeHtml(normalizedHandle || "your account");
    const pricingUrl = "https://www.virallized.com/#pricing";

    const emailHtml = `
      <div style="font-family: sans-serif; padding: 30px; border: 1px solid #eaeaea; border-radius: 12px; max-width: 600px; margin: 0 auto; color: #1e293b;">
        <h2 style="color: #f80d5d; margin-top: 0; font-size: 24px;">Your Instagram Growth Analysis Is Ready</h2>

        <p style="font-size: 16px; line-height: 1.6;">Hi there,</p>

        <p style="font-size: 16px; line-height: 1.6;">
          Thanks for analyzing <strong>@${safeHandle}</strong> with Virallized. We took a look at the numbers from your public Instagram profile and your account has a clear opportunity to grow with the right targeting.
        </p>

        <div style="background-color: #f8f9fa; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin: 26px 0;">
          <div style="font-size: 12px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 12px;">Your snapshot</div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px;">
              <div style="font-size: 11px; font-weight: bold; color: #94a3b8; text-transform: uppercase; margin-bottom: 5px;">Current followers</div>
              <div style="font-size: 20px; font-weight: 900; color: #0f172a;">${followers}</div>
            </div>

            <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px;">
              <div style="font-size: 11px; font-weight: bold; color: #94a3b8; text-transform: uppercase; margin-bottom: 5px;">Engagement</div>
              <div style="font-size: 20px; font-weight: 900; color: #0f172a;">${engagementRate}</div>
            </div>

            <div style="background-color: #fff1f2; border: 1px solid #fda6e1; border-radius: 10px; padding: 14px;">
              <div style="font-size: 11px; font-weight: bold; color: #f80d5d; text-transform: uppercase; margin-bottom: 5px;">Potential 12-month gain</div>
              <div style="font-size: 20px; font-weight: 900; color: #0f172a;">+${projectedGrowth}</div>
            </div>

            <div style="background-color: #fff1f2; border: 1px solid #fda6e1; border-radius: 10px; padding: 14px;">
              <div style="font-size: 11px; font-weight: bold; color: #f80d5d; text-transform: uppercase; margin-bottom: 5px;">Projected followers</div>
              <div style="font-size: 20px; font-weight: 900; color: #0f172a;">${projectedFollowers}</div>
            </div>
          </div>
        </div>

        <p style="font-size: 16px; line-height: 1.6;">
          Virallized helps accounts grow through real targeted exposure — no bots, no fake followers, and no posting on your behalf. Our team helps put your profile in front of people who are more likely to care about your content and follow you naturally.
        </p>

        <div style="text-align: center; margin: 35px 0;">
          <a href="${pricingUrl}" style="background-color: #f80d5d; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
            View Growth Plans
          </a>
        </div>

        <p style="font-size: 14px; line-height: 1.6; color: #64748b; background-color: #f8f9fa; padding: 15px; border-radius: 8px; font-style: italic;">
          Not sure which plan fits <strong>@${safeHandle}</strong>? Just reply to this email and we’ll recommend the best option for your account size and goals.
        </p>

        <p style="font-size: 16px; line-height: 1.6;">
          Questions? <a href="mailto:support@virallized.com" style="color: #f80d5d; font-weight: bold; text-decoration: none;">support@virallized.com</a>
        </p>
      </div>
    `;

    try {
      await supabase.functions.invoke("send-email", {
        body: {
          to: lead.email,
          reply_to: "support@virallized.com",
          subject: `Your Instagram Growth Analysis for @${normalizedHandle}`,
          html: emailHtml,
        },
      });

      toast.success(`Success! Growth invitation sent to ${lead.email}`);
    } catch (error) {
      console.error("Failed to send analyzer lead email:", error);
      toast.error("Failed to send email. Please check the console or try again.");
    } finally {
      setSendingAnalyzerLeadId(null);
    }
  };

  const sendAnalyzerLeadDiscountEmail = async (lead: AnalyzedAccount) => {
    if (!lead.email) {
      toast.info("This lead does not have an email address attached.");
      return;
    }

    const normalizedHandle = normalizeInstagramHandle(lead.ig_handle);
    const confirmSend = window.confirm(
      `Send 50% off first month offer to ${lead.email}?`,
    );

    if (!confirmSend) return;

    setSendingAnalyzerLeadOfferId(lead.id);

    const followers = formatDashboardNumber(lead.followers);
    const engagementRate = formatDashboardPercent(lead.engagement_rate);
    const projectedGrowth = formatDashboardNumber(lead.gain_with_us);
    const projectedFollowers = formatDashboardNumber(lead.projected_with_us);
    const safeHandle = escapeHtml(normalizedHandle || "your account");
    const pricingUrl = "https://www.virallized.com/#pricing";
    const discountCode = "50OFF";

    const emailHtml = `
      <div style="font-family: sans-serif; padding: 30px; border: 1px solid #eaeaea; border-radius: 12px; max-width: 600px; margin: 0 auto; color: #1e293b;">
        <h2 style="color: #f80d5d; margin-top: 0; font-size: 24px;">A quick note about @${safeHandle}</h2>

        <p style="font-size: 16px; line-height: 1.6;">Hey, Jay here — account manager at Virallized.</p>

        <p style="font-size: 16px; line-height: 1.6;">
          I noticed you analyzed <strong>@${safeHandle}</strong> with us, so I had a quick look through the metrics. Based on the numbers, I think we can make a lot happen with your account if we get the targeting right.
        </p>

        <div style="background-color: #f8f9fa; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin: 26px 0;">
          <div style="font-size: 12px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 12px;">Your account snapshot</div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px;">
              <div style="font-size: 11px; font-weight: bold; color: #94a3b8; text-transform: uppercase; margin-bottom: 5px;">Current followers</div>
              <div style="font-size: 20px; font-weight: 900; color: #0f172a;">${followers}</div>
            </div>

            <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px;">
              <div style="font-size: 11px; font-weight: bold; color: #94a3b8; text-transform: uppercase; margin-bottom: 5px;">Engagement</div>
              <div style="font-size: 20px; font-weight: 900; color: #0f172a;">${engagementRate}</div>
            </div>

            <div style="background-color: #fff1f2; border: 1px solid #fda6e1; border-radius: 10px; padding: 14px;">
              <div style="font-size: 11px; font-weight: bold; color: #f80d5d; text-transform: uppercase; margin-bottom: 5px;">Potential 12-month gain</div>
              <div style="font-size: 20px; font-weight: 900; color: #0f172a;">+${projectedGrowth}</div>
            </div>

            <div style="background-color: #fff1f2; border: 1px solid #fda6e1; border-radius: 10px; padding: 14px;">
              <div style="font-size: 11px; font-weight: bold; color: #f80d5d; text-transform: uppercase; margin-bottom: 5px;">Projected followers</div>
              <div style="font-size: 20px; font-weight: 900; color: #0f172a;">${projectedFollowers}</div>
            </div>
          </div>
        </div>

        <p style="font-size: 16px; line-height: 1.6;">
          If you want to get started, I set aside an exclusive first-month deal for you. You can get <strong>50% off your first month on any plan</strong> using the code below at checkout.
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <div style="display: inline-block; background-color: #fff1f2; border: 1px dashed #f80d5d; color: #f80d5d; padding: 12px 24px; border-radius: 10px; font-size: 24px; font-weight: 900; letter-spacing: 0.12em; margin-bottom: 16px;">
            ${discountCode}
          </div>

          <br />

          <a href="${pricingUrl}" style="background-color: #f80d5d; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
            Claim 50% Off First Month
          </a>
        </div>

        <p style="font-size: 14px; line-height: 1.6; color: #64748b; background-color: #f8f9fa; padding: 15px; border-radius: 8px; font-style: italic;">
          Use code <strong>${discountCode}</strong> at checkout. The offer applies to the first month only. If you’re not sure which plan is best for <strong>@${safeHandle}</strong>, just reply and I’ll point you in the right direction.
        </p>

        <p style="font-size: 16px; line-height: 1.6;">
          Speak soon,<br />
          <strong>Jay</strong><br />
          Account Manager, Virallized
        </p>
      </div>
    `;

    try {
      await supabase.functions.invoke("send-email", {
        body: {
          to: lead.email,
          reply_to: "support@virallized.com",
          subject: `Jay from Virallized — 50% off your first month for @${normalizedHandle}`,
          html: emailHtml,
        },
      });

      toast.success(`Success! 50% offer sent to ${lead.email}`);
    } catch (error) {
      console.error("Failed to send analyzer discount email:", error);
      toast.error(
        "Failed to send discount email. Please check the console or try again.",
      );
    } finally {
      setSendingAnalyzerLeadOfferId(null);
    }
  };

  const deleteAnalyzerLead = async (lead: AnalyzedAccount) => {
    const normalizedHandle = normalizeInstagramHandle(lead.ig_handle);
    const leadLabel = normalizedHandle ? `@${normalizedHandle}` : lead.email;

    const confirmDelete = window.confirm(
      `Delete analyzer lead ${leadLabel}? This will permanently remove the lead from the database.`,
    );

    if (!confirmDelete) return;

    setDeletingAnalyzerLeadId(lead.id);

    try {
      const { error } = await supabase
        .from("analyzed_accounts")
        .delete()
        .eq("id", lead.id);

      if (error) throw error;

      setAnalyzedAccounts((currentLeads) =>
        currentLeads.filter((currentLead) => currentLead.id !== lead.id),
      );

      toast.success(`Deleted analyzer lead ${leadLabel}.`);
    } catch (error: any) {
      console.error("Failed to delete analyzer lead:", error);
      toast.error(
        "Failed to delete analyzer lead: " +
          (error?.message || "Please check the console or try again."),
      );
    } finally {
      setDeletingAnalyzerLeadId(null);
    }
  };

  // --- ONE-CLICK EMAIL HANDLERS ---
  const sendPasswordUpdateEmail = async () => {
    if (!selectedClient) return;

    const confirmSend = window.confirm(
      `Send 'Incorrect Password' email to ${selectedClient.email}?`,
    );

    if (!confirmSend) return;

    setIsSendingEmail(true);

    const emailHtml = `
      <div style="font-family: sans-serif; padding: 30px; border: 1px solid #eaeaea; border-radius: 12px; max-width: 600px; margin: 0 auto; color: #1e293b;">
        <h2 style="color: #f80d5d; margin-top: 0; font-size: 24px;">Action Required: Connection Lost</h2>
        
        <p style="font-size: 16px; line-height: 1.6;">Hi ${getFirstName(selectedClient.full_name)},</p>
        
        <p style="font-size: 16px; line-height: 1.6;">
          It looks like your password has been changed and we have lost connection to your account.
        </p>
        
        <p style="font-size: 16px; line-height: 1.6;">
          To update your password and resume growth, please login to your dashboard and go to settings using the following link:
        </p>

        <div style="text-align: center; margin: 35px 0;">
          <a href="https://www.virallized.com/login" style="background-color: #f80d5d; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">Login to Dashboard</a>
        </div>
        
        <p style="font-size: 14px; line-height: 1.6; color: #64748b; background-color: #f8f9fa; padding: 15px; border-radius: 8px; font-style: italic;">
          (If it is your first time logging in, use your signup email to reset your password and gain access)
        </p>
      </div>
    `;

    try {
      await supabase.functions.invoke("send-email", {
        body: {
          to: selectedClient.email,
          reply_to: "support@virallized.com",
          subject: "Action Required: Reconnect your Virallized Account",
          html: emailHtml,
        },
      });

      toast.success(`Success! Email sent to ${selectedClient.email}`);
    } catch (error) {
      console.error("Failed to send email:", error);
      toast.error("Failed to send email. Please check the console or try again.");
    } finally {
      setIsSendingEmail(false);
    }
  };

  const send2FAUpdateEmail = async () => {
    if (!selectedClient) return;

    const confirmSend = window.confirm(
      `Send '2FA Required' email to ${selectedClient.email}?`,
    );

    if (!confirmSend) return;

    setIsSending2FAEmail(true);

    const emailHtml = `
      <div style="font-family: sans-serif; padding: 30px; border: 1px solid #eaeaea; border-radius: 12px; max-width: 600px; margin: 0 auto; color: #1e293b;">
        <h2 style="color: #f80d5d; margin-top: 0; font-size: 24px;">Action Required: 2FA Code Needed</h2>
        
        <p style="font-size: 16px; line-height: 1.6;">Hi ${getFirstName(selectedClient.full_name)},</p>
        
        <p style="font-size: 16px; line-height: 1.6;">
          It looks like we are unable to connect to your account due to Two-Factor Authentication (2FA) being enabled.
        </p>
        
        <p style="font-size: 16px; line-height: 1.6;">
          To allow our team to securely connect and begin your growth campaign, please submit an 8-digit backup code. You can do this by choosing one of the two options below:
        </p>

        <div style="margin: 30px 0;">
          <div style="margin-bottom: 15px;">
            <a href="https://www.virallized.com/login" style="background-color: #f80d5d; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; text-align: center;">Option 1: Login to Dashboard</a>
          </div>

          <div>
            <a href="https://virallized.com/add-2fa" style="background-color: #1e293b; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; text-align: center;">Option 2: Use Direct 2FA Portal</a>
          </div>
        </div>
        
        <p style="font-size: 14px; line-height: 1.6; color: #64748b; background-color: #f8f9fa; border-left: 4px solid #cbd5e1; padding: 15px; border-radius: 8px; font-style: italic;">
          <strong>Note:</strong> If you use the Direct 2FA Portal (Option 2), you do not need to log in. You will simply need your Instagram handle to update the code.
        </p>
      </div>
    `;

    try {
      await supabase.functions.invoke("send-email", {
        body: {
          to: selectedClient.email,
          reply_to: "support@virallized.com",
          subject: "Action Required: 2FA Backup Code Needed",
          html: emailHtml,
        },
      });

      toast.success(`Success! 2FA Email sent to ${selectedClient.email}`);
    } catch (error) {
      console.error("Failed to send email:", error);
      toast.error("Failed to send email. Please check the console or try again.");
    } finally {
      setIsSending2FAEmail(false);
    }
  };

  const sendVerifyLoginEmail = async () => {
    if (!selectedClient) return;

    const confirmSend = window.confirm(
      `Send 'Verify Login Attempt (This Was Me)' email to ${selectedClient.email}?`,
    );

    if (!confirmSend) return;

    setIsSendingVerifyLoginEmail(true);

    const emailHtml = `
      <div style="font-family: sans-serif; padding: 30px; border: 1px solid #eaeaea; border-radius: 12px; max-width: 600px; margin: 0 auto; color: #1e293b;">
        <h2 style="color: #f80d5d; margin-top: 0; font-size: 24px;">Action Required: Verify Login Attempt</h2>
        
        <p style="font-size: 16px; line-height: 1.6;">Hi ${getFirstName(selectedClient.full_name)},</p>
        
        <p style="font-size: 16px; line-height: 1.6;">
          Our team is currently attempting to securely connect to your Instagram account to start your growth campaign. However, Instagram has blocked the login attempt as a standard security precaution.
        </p>
        
        <p style="font-size: 16px; line-height: 1.6;">
          To allow us access, please follow these quick steps:
        </p>

        <ol style="font-size: 16px; line-height: 1.6; padding-left: 20px;">
          <li style="margin-bottom: 10px;">Open the <strong>Instagram app</strong> on your phone.</li>
          <li style="margin-bottom: 10px;">You should see a pop-up saying "We noticed a new login from a device you don't usually use."</li>
          <li style="margin-bottom: 10px;">Tap <strong>"This Was Me"</strong>.</li>
        </ol>

        <p style="font-size: 16px; line-height: 1.6; background-color: #ffefe9; padding: 15px; border-radius: 8px; border-left: 4px solid #f80d5d;">
          <strong>Once you have clicked "This Was Me", please reply directly to this email (or message <a href="mailto:support@virallized.com" style="color: #f80d5d; text-decoration: none;">support@virallized.com</a>) to let us know</strong> so our team can immediately finish the connection and start your growth!
        </p>
      </div>
    `;

    try {
      await supabase.functions.invoke("send-email", {
        body: {
          to: selectedClient.email,
          reply_to: "support@virallized.com",
          subject: "Action Required: Verify Instagram Login Attempt",
          html: emailHtml,
        },
      });

      toast.success(`Success! Verify Login email sent to ${selectedClient.email}`);
    } catch (error) {
      console.error("Failed to send email:", error);
      toast.error("Failed to send email. Please check the console or try again.");
    } finally {
      setIsSendingVerifyLoginEmail(false);
    }
  };

  const sendTargetsReminderEmail = async () => {
    if (!selectedClient) return;

    const confirmSend = window.confirm(
      `Send 'Add More Targets' email to ${selectedClient.email}?`,
    );

    if (!confirmSend) return;

    setIsSendingTargetsEmail(true);

    const emailHtml = `
      <div style="font-family: sans-serif; padding: 30px; border: 1px solid #eaeaea; border-radius: 12px; max-width: 600px; margin: 0 auto; color: #1e293b;">
        <h2 style="color: #f80d5d; margin-top: 0; font-size: 24px;">Recommended: Add More Targets</h2>

        <p style="font-size: 16px; line-height: 1.6;">Hi ${getFirstName(selectedClient.full_name)},</p>

        <p style="font-size: 16px; line-height: 1.6;">
          To get the most out of your growth plan, and to allow our team to optimize your target list, we strongly recommend adding 5-10 more targets using your dashboard.
        </p>

        <p style="font-size: 16px; line-height: 1.6;">
          Adding more targets gives our team more high-quality data to work with, helping us refine your campaign and reach the right audience more effectively.
        </p>

        <div style="text-align: center; margin: 35px 0;">
          <a href="https://www.virallized.com/login" style="background-color: #f80d5d; color: #ffffff; padding: 14px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; display: inline-block; margin: 6px;">
            Login to Add Targets
          </a>

          <a href="https://www.virallized.com/update-targeting" style="background-color: #1e293b; color: #ffffff; padding: 14px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; display: inline-block; margin: 6px;">
            Add via Update Targeting Page
          </a>
        </div>

        <p style="font-size: 14px; line-height: 1.6; color: #64748b; background-color: #f8f9fa; padding: 15px; border-radius: 8px; font-style: italic;">
          Recommended: add 5-10 relevant competitor accounts, niche accounts, or audience sources that closely match the type of followers you want to attract.
        </p>

        <p style="font-size: 16px; line-height: 1.6;">
          Questions? <a href="mailto:support@virallized.com" style="color: #f80d5d; font-weight: bold; text-decoration: none;">support@virallized.com</a>
        </p>
      </div>
    `;

    try {
      await supabase.functions.invoke("send-email", {
        body: {
          to: selectedClient.email,
          reply_to: "support@virallized.com",
          subject: "Recommended: Add More Targets to Optimize Your Growth",
          html: emailHtml,
        },
      });

      toast.success(`Success! Targets email sent to ${selectedClient.email}`);
    } catch (error) {
      console.error("Failed to send targets email:", error);
      toast.error("Failed to send email. Please check the console or try again.");
    } finally {
      setIsSendingTargetsEmail(false);
    }
  };

  const sendSetupCompleteEmail = async () => {
    if (!selectedClient) return;

    const confirmSend = window.confirm(
      `Send 'Setup Complete' email to ${selectedClient.email}?`,
    );

    if (!confirmSend) return;

    setIsSendingSetupEmail(true);

    const planName = formatPlanName(selectedClient.plan);
    const activeTargetList =
      selectedClient.targets?.trim() || "No targets added yet.";

    const emailHtml = `
      <div style="font-family: sans-serif; padding: 30px; border: 1px solid #eaeaea; border-radius: 12px; max-width: 600px; margin: 0 auto; color: #1e293b;">
        <h2 style="color: #f80d5d; margin-top: 0; font-size: 24px;">Setup Complete</h2>

        <p style="font-size: 16px; line-height: 1.6;">Hi ${getFirstName(selectedClient.full_name)},</p>

        <p style="font-size: 16px; line-height: 1.6;">
          Your <strong>${planName}</strong> setup is complete. Your current active target list is:
        </p>

        <div style="font-size: 15px; line-height: 1.7; color: #1e293b; background-color: #f8f9fa; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin: 24px 0; white-space: pre-wrap;">
          ${activeTargetList}
        </div>

        <p style="font-size: 16px; line-height: 1.6;">
          To make changes to your targeting &amp; view your growth, access your dashboard here:
        </p>

        <div style="text-align: center; margin: 35px 0;">
          <a href="https://www.virallized.com/login" style="background-color: #f80d5d; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
            Access Your Dashboard
          </a>
        </div>

        <p style="font-size: 16px; line-height: 1.6;">
          Growth starts within 24 hours and will reach full speed by day 2-3.
        </p>

        <p style="font-size: 16px; line-height: 1.6;">
          Questions? <a href="mailto:support@virallized.com" style="color: #f80d5d; font-weight: bold; text-decoration: none;">support@virallized.com</a>
        </p>
      </div>
    `;

    try {
      await supabase.functions.invoke("send-email", {
        body: {
          to: selectedClient.email,
          reply_to: "support@virallized.com",
          subject: "Your Virallized Setup Is Complete",
          html: emailHtml,
        },
      });

      toast.success(`Success! Setup Complete email sent to ${selectedClient.email}`);
    } catch (error) {
      console.error("Failed to send setup complete email:", error);
      toast.error("Failed to send email. Please check the console or try again.");
    } finally {
      setIsSendingSetupEmail(false);
    }
  };

  const sendAuditReport = async () => {
    if (!selectedClient || !auditPdfFile) return;
    setIsSendingAudit(true);
    try {
      const arrayBuffer = await auditPdfFile.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      let binary = "";
      uint8Array.forEach((b) => (binary += String.fromCharCode(b)));
      const base64 = btoa(binary);

      const firstName = getFirstName(selectedClient.full_name);
      const emailHtml = `
        <div style="font-family: sans-serif; padding: 30px; border: 1px solid #eaeaea; border-radius: 12px; max-width: 600px; margin: 0 auto; color: #1e293b;">
          <h2 style="color: #f80d5d; margin-top: 0; font-size: 24px;">Your Instagram Strategy Audit Is Ready 🎯</h2>
          <p style="font-size: 16px; line-height: 1.6;">Hi ${firstName},</p>
          <p style="font-size: 16px; line-height: 1.6;">
            Great news — your personalised <strong>Instagram Strategy Audit</strong> is complete and attached to this email as a PDF.
          </p>
          <p style="font-size: 16px; line-height: 1.6;">
            Inside you'll find a full breakdown of your account, what's working, what's holding you back, and a custom action plan to take your growth to the next level.
          </p>
          <div style="background-color: #f8f9fa; border-left: 4px solid #f80d5d; padding: 16px; border-radius: 0 8px 8px 0; margin: 24px 0;">
            <p style="margin: 0; font-size: 15px; color: #1e293b; font-weight: 500;">
              Have questions about your audit? Just reply to this email or reach out directly to your personal account manager — we're here to help you action everything inside.
            </p>
          </div>
          <div style="text-align: center; margin: 35px 0;">
            <a href="https://www.virallized.com/login" style="background-color: #f80d5d; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
              View Your Dashboard
            </a>
          </div>
          <p style="font-size: 16px; line-height: 1.6;">
            Questions? <a href="mailto:support@virallized.com" style="color: #f80d5d; font-weight: bold; text-decoration: none;">support@virallized.com</a>
          </p>
        </div>
      `;

      const { error } = await supabase.functions.invoke("send-email", {
        body: {
          to: selectedClient.email,
          subject: "Your Instagram Strategy Audit Is Ready 🎯",
          html: emailHtml,
          reply_to: "support@virallized.com",
          attachments: [
            {
              filename: `Instagram-Strategy-Audit-${(selectedClient.ig_handle || "report").replace("@", "")}.pdf`,
              content: base64,
            },
          ],
        },
      });

      if (error) throw error;
      toast.success(`Audit report sent to ${selectedClient.email}!`);
      setIsAuditModalOpen(false);
      setAuditPdfFile(null);
    } catch (err: any) {
      console.error("Failed to send audit report:", err);
      toast.error("Failed to send audit report. Please try again.");
    } finally {
      setIsSendingAudit(false);
    }
  };

  // --- CLIENT EDIT & DELETE HANDLERS ---
  const handleSaveClient = async (e: FormEvent) => {
    e.preventDefault();

    if (!selectedClient) return;

    setIsSavingClient(true);

    try {
      const { error } = await supabase
        .from("clients")
        .update(clientForm)
        .eq("id", selectedClient.id);

      if (error) throw error;

      const updatedClient = { ...selectedClient, ...clientForm } as Client;

      setSelectedClient(updatedClient);
      setIsEditingClient(false);

      fetchData();
    } catch (error: any) {
      toast.error("Failed to update client: " + error.message);
    } finally {
      setIsSavingClient(false);
    }
  };

  const confirmDeleteClient = async () => {
    if (!selectedClient) return;

    setIsDeleting(true);

    try {
      const response = await fetch(
        "https://qbxkdxfsfjyxtrpnsavu.supabase.co/functions/v1/delete-user",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: selectedClient.id }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete user completely.");
      }

      setIsDeleteDialogOpen(false);
      setSelectedClient(null);
      setIsEditingClient(false);
      fetchData();
    } catch (error: any) {
      toast.error("Failed to delete client: " + error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // --- BLOG HANDLERS ---
  const imageHandler = async () => {
    const input = document.createElement("input");

    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();

    input.onchange = async () => {
      const file = input.files ? input.files[0] : null;

      if (!file) return;

      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `post-body-images/${fileName}`;

      try {
        const { error: uploadError } = await supabase.storage
          .from("blog-images")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from("blog-images")
          .getPublicUrl(filePath);

        const quill = quillRef.current?.getEditor();

        if (quill) {
          const range = quill.getSelection();
          const position = range ? range.index : 0;

          quill.insertEmbed(position, "image", data.publicUrl);
        }
      } catch (error: any) {
        toast.error("Failed to upload image into post: " + error.message);
      }
    };
  };

  const quillModules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [2, 3, 4, false] }],
          ["bold", "italic", "underline", "strike", "blockquote"],
          [{ list: "ordered" }, { list: "bullet" }],
          ["link", "image"],
          ["clean"],
        ],
        handlers: {
          image: imageHandler,
        },
      },
    }),
    [],
  );

  const saveBlogPost = async (e: FormEvent) => {
    e.preventDefault();
    setIsSavingBlog(true);

    let finalImageUrl = blogForm.image_url;

    if (selectedImage) {
      const fileExt = selectedImage.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
      const filePath = `post-images/${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from("blog-images").upload(filePath, selectedImage);
      if (uploadError) {
        toast.error("Error uploading featured image: " + uploadError.message);
        setIsSavingBlog(false);
        return;
      }
      const { data } = supabase.storage.from("blog-images").getPublicUrl(filePath);
      finalImageUrl = data.publicUrl;
    }

    const payload: any = {
      title: blogForm.title,
      slug: blogForm.slug.trim() || blogGenerateSlug(blogForm.title),
      excerpt: blogForm.excerpt,
      content: blogForm.content,
      image_url: finalImageUrl,
      status: blogForm.status,
      category: blogForm.category,
      tags: blogForm.tags,
      meta_title: blogForm.meta_title,
      meta_description: blogForm.meta_description,
    };
    if (blogForm.created_at) payload.created_at = blogForm.created_at;

    let error;
    if (blogForm.id) {
      ({ error } = await supabase.from("blogs").update(payload).eq("id", blogForm.id));
    } else {
      ({ error } = await supabase.from("blogs").insert([payload]));
    }

    if (error) {
      toast.error("Error saving blog post: " + error.message);
    } else {
      setIsBlogEditorOpen(false);
      resetBlogForm();
      fetchData({ silent: true });
    }
    setIsSavingBlog(false);
  };

  const resetBlogForm = () => {
    setBlogForm(EMPTY_BLOG_POST);
    setSelectedImage(null);
    setImagePreview(null);
    setBlogTagInput("");
    setBlogIsDirty(false);
    setBlogActiveSection("content");
  };

  const setBlogField = <K extends keyof BlogPost>(key: K, value: BlogPost[K]) => {
    setBlogForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "title" && (!prev.slug || prev.slug === blogGenerateSlug(prev.title))) {
        next.slug = blogGenerateSlug(String(value));
      }
      return next;
    });
    setBlogIsDirty(true);
  };

  const addBlogTag = () => {
    const t = blogTagInput.trim().toLowerCase();
    if (t && !blogForm.tags.includes(t)) setBlogField("tags", [...blogForm.tags, t]);
    setBlogTagInput("");
  };

  const removeBlogTag = (tag: string) => {
    setBlogField("tags", blogForm.tags.filter((t) => t !== tag));
  };

  const openBlogEdit = (post: BlogPost) => {
    setBlogForm({
      ...post,
      tags: post.tags || [],
      meta_title: post.meta_title || "",
      meta_description: post.meta_description || "",
      category: post.category || "",
      status: post.status || "draft",
    });
    setSelectedImage(null);
    setImagePreview(post.image_url || null);
    setBlogTagInput("");
    setBlogIsDirty(false);
    setBlogActiveSection("content");
    setIsBlogEditorOpen(true);
  };

  const closeBlogEditor = () => {
    if (blogIsDirty && !window.confirm("You have unsaved changes. Discard them?")) return;
    setIsBlogEditorOpen(false);
  };

  const duplicateBlogPost = async (post: BlogPost) => {
    await supabase.from("blogs").insert([{
      title: `${post.title} (Copy)`, slug: `${post.slug}-copy-${Date.now()}`,
      excerpt: post.excerpt, content: post.content, image_url: post.image_url,
      status: "draft", category: post.category, tags: post.tags,
      meta_title: post.meta_title, meta_description: post.meta_description,
    }]);
    fetchData({ silent: true });
  };

  const confirmBlogDelete = async () => {
    if (!blogDeleteConfirmId) return;
    setIsBlogDeleting(true);
    const { error } = await supabase.from("blogs").delete().eq("id", blogDeleteConfirmId);
    if (error) toast.error("Failed to delete: " + error.message);
    else { setBlogDeleteConfirmId(null); fetchData({ silent: true }); }
    setIsBlogDeleting(false);
  };

  const processBlogImage = (file: File) => {
    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
    setBlogIsDirty(true);
  };

  const filteredBlogs = useMemo(() => {
    let list = [...blogs];
    if (blogFilterStatus !== "all") list = list.filter((b) => b.status === blogFilterStatus);
    if (blogSearch.trim()) {
      const q = blogSearch.toLowerCase();
      list = list.filter((b) =>
        b.title.toLowerCase().includes(q) ||
        b.category?.toLowerCase().includes(q) ||
        b.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (blogSortBy === "newest") list.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    else if (blogSortBy === "oldest") list.sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());
    else if (blogSortBy === "az") list.sort((a, b) => a.title.localeCompare(b.title));
    return list;
  }, [blogs, blogFilterStatus, blogSearch, blogSortBy]);

  const inputClass =
    "w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f80d5d]/20 focus:border-[#f80d5d] bg-slate-50 focus:bg-white text-sm font-medium";

  const labelClass =
    "block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5";

  // ==========================================
  // VIEW 1: LOGIN SCREEN
  // ==========================================
  if (!session) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex flex-col justify-center py-12 px-5 sm:px-6 lg:px-8 relative selection:bg-[#ffefe9] selection:text-[#f80d5d]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sm:mx-auto sm:w-full sm:max-w-md relative z-10"
        >
          <div className="flex justify-center mb-8">
            <img
              src="/images/logos/virallized-main-logo.svg"
              alt="Virallized"
              className="h-8 sm:h-10 w-auto object-contain"
            />
          </div>

          <h2 className="text-center text-3xl font-black text-slate-900 mb-8 tracking-tight">
            Admin Access
          </h2>

          <div className="bg-white py-10 px-6 sm:px-10 shadow-xl shadow-slate-200/50 rounded-[2rem] border border-slate-200">
            <form onSubmit={handleLogin} className="space-y-6">
              {authError && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-bold text-center">
                  {authError}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Admin Email
                </label>

                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f80d5d]/20 focus:border-[#f80d5d] bg-slate-50 focus:bg-white text-sm"
                  placeholder="admin@virallized.com"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Password
                </label>

                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f80d5d]/20 focus:border-[#f80d5d] bg-slate-50 focus:bg-white text-sm"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full text-center bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] text-white py-4 rounded-xl font-black tracking-wide hover:opacity-90 transition-opacity text-[14px] shadow-lg shadow-[#ff2429]/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoggingIn ? "Authenticating..." : "Access Admin Portal"}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    );
  }

  // ==========================================
  // VIEW 1.5: LOADING ROLE
  // ==========================================
  if (session && !adminRole) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-[#f80d5d] rounded-full animate-spin"></div>

          <p className="text-slate-500 font-bold tracking-widest text-xs uppercase">
            Verifying Admin Permissions...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: ADMIN DASHBOARD
  // ==========================================
  return (
    <div className="min-h-screen bg-[#fafafa] font-sans selection:bg-[#ffefe9] selection:text-[#f80d5d]">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <img
              src="/images/logos/virallized-main-logo.svg"
              alt="Virallized"
              className="h-7 sm:h-8 w-auto"
            />

            <div className="hidden sm:block w-px h-6 bg-slate-200"></div>

            <h1 className="hidden sm:block text-lg font-black text-slate-900 tracking-tight">
              {adminRole === "superadmin" ? "Admin Portal" : "Writer Portal"}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden md:block text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-wider">
              {adminRole}
            </span>

            <button
              onClick={handleLogout}
              className="text-xs font-bold text-slate-500 hover:text-red-600 bg-slate-50 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors border border-slate-200 hover:border-red-200"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="flex gap-3 mb-8 border-b border-slate-200 pb-4 overflow-x-auto scrollbar-hide">
          {adminRole === "superadmin" && (
            <button
              onClick={() => setActiveTab("clients")}
              className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                activeTab === "clients"
                  ? "bg-slate-900 text-white shadow-md"
                  : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-200"
              }`}
            >
              Client Directory
            </button>
          )}

          {adminRole === "superadmin" && (
            <button
              onClick={() => setActiveTab("analyzed")}
              className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                activeTab === "analyzed"
                  ? "bg-slate-900 text-white shadow-md"
                  : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-200"
              }`}
            >
              Analyzer Leads
            </button>
          )}

          {adminRole === "superadmin" && (
            <button
              onClick={() => setActiveTab("canceled")}
              className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                activeTab === "canceled"
                  ? "bg-slate-900 text-white shadow-md"
                  : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-200"
              }`}
            >
              Canceled Leads
            </button>
          )}

          {adminRole === "superadmin" && (
            <button
              onClick={() => setActiveTab("agencies")}
              className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                activeTab === "agencies"
                  ? "bg-slate-900 text-white shadow-md"
                  : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-200"
              }`}
            >
              Agencies{" "}
              {agencies.filter((a) => a.status === "pending").length > 0 && (
                <span className="ml-1.5 bg-[#f80d5d] text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                  {agencies.filter((a) => a.status === "pending").length}
                </span>
              )}
            </button>
          )}

          {adminRole === "superadmin" && (
            <button
              onClick={() => setActiveTab("creator-studio")}
              className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                activeTab === "creator-studio"
                  ? "bg-slate-900 text-white shadow-md"
                  : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-200"
              }`}
            >
              Creator Studio
            </button>
          )}

          <button
            onClick={() => setActiveTab("blogs")}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
              activeTab === "blogs"
                ? "bg-slate-900 text-white shadow-md"
                : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-200"
            }`}
          >
            Blog Manager
          </button>
        </div>

        {/* --- CLIENTS TAB --- */}
        {activeTab === "clients" && adminRole === "superadmin" && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Total Clients
                </div>

                <div className="text-3xl font-black text-slate-900">
                  {clients.length}
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-slate-50/50">
                <h2 className="text-lg font-black text-slate-900">
                  Client Roster
                </h2>

                <div className="relative max-w-sm w-full">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Search size={15} />
                  </span>

                  <input
                    type="text"
                    placeholder="Search handle or name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#f80d5d] focus:ring-1 focus:ring-[#f80d5d] text-sm font-medium transition-all"
                  />
                </div>
              </div>

              {isLoading ? (
                <div className="p-10 text-center text-slate-400 font-bold animate-pulse">
                  Loading clients...
                </div>
              ) : filteredClients.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-slate-500 font-medium">
                    No clients found matching your search.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredClients.map((client) => (
                    <div
                      key={client.id}
                      onClick={() => {
                        setSelectedClient(client);
                        setClientForm(client);
                        setIsEditingClient(false);
                      }}
                      className="px-6 py-5 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors group"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#ffae07] to-[#f80d5d] text-white flex items-center justify-center font-black text-lg shrink-0 shadow-md">
                          {client.full_name?.charAt(0).toUpperCase() || "@"}
                        </div>

                        <div className="min-w-0 flex items-center gap-3">
                          <div>
                            <p className="text-base font-bold text-slate-900 truncate">
                              {client.full_name || "Unknown"}
                            </p>

                            <p className="text-sm text-[#f80d5d] font-medium truncate mt-0.5">
                              {client.ig_handle}
                            </p>
                          </div>

                          {isNewClient(client.created_at) && (
                            <span className="bg-green-100 text-green-700 border border-green-200 text-[10px] font-black uppercase px-2 py-0.5 rounded-full self-start mt-1">
                              New
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="hidden md:flex flex-col items-end">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Plan
                        </span>

                        <span className="text-sm font-black text-slate-700">
                          {client.plan || "Unknown"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* --- ANALYZER LEADS TAB --- */}
        {activeTab === "analyzed" && adminRole === "superadmin" && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Total Leads
                </div>

                <div className="text-3xl font-black text-slate-900">
                  {analyzedAccounts.length}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Emails Captured
                </div>

                <div className="text-3xl font-black text-slate-900">
                  {
                    analyzedAccounts.filter((lead) => Boolean(lead.email))
                      .length
                  }
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                  With Posts
                </div>

                <div className="text-3xl font-black text-slate-900">
                  {analyzedAccounts.filter((lead) => lead.has_posts).length}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Avg Followers
                </div>

                <div className="text-3xl font-black text-slate-900">
                  {formatDashboardNumber(averageAnalyzedFollowers)}
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-slate-50/50">
                <div>
                  <h2 className="text-lg font-black text-slate-900">
                    Analyzer Leads
                  </h2>

                  <p className="text-xs font-bold text-slate-400 mt-1">
                    People who entered an email and analyzed an Instagram
                    account.
                  </p>
                </div>

                <div className="relative max-w-sm w-full">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Search size={15} />
                  </span>

                  <input
                    type="text"
                    placeholder="Search email or handle..."
                    value={analyzedSearchQuery}
                    onChange={(e) => setAnalyzedSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#f80d5d] focus:ring-1 focus:ring-[#f80d5d] text-sm font-medium transition-all"
                  />
                </div>
              </div>

              {isLoading ? (
                <div className="p-10 text-center text-slate-400 font-bold animate-pulse">
                  Loading analyzer leads...
                </div>
              ) : filteredAnalyzedAccounts.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-slate-500 font-medium">
                    No analyzer leads found yet.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredAnalyzedAccounts.map((lead) => {
                    const normalizedHandle = normalizeInstagramHandle(
                      lead.ig_handle,
                    );

                    return (
                      <div
                        key={lead.id}
                        className="px-6 py-5 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                          <div className="flex items-start gap-4 min-w-0">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#ffae07] to-[#f80d5d] text-white flex items-center justify-center font-black text-lg shrink-0 shadow-md">
                              @
                            </div>

                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <a
                                  href={buildInstagramUrl(lead.ig_handle)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-base font-black text-slate-900 hover:text-[#f80d5d] transition-colors truncate"
                                >
                                  @{normalizedHandle || "unknown"}
                                </a>

                                {isNewClient(lead.created_at) && (
                                  <span className="bg-green-100 text-green-700 border border-green-200 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                                    New
                                  </span>
                                )}

                                {!lead.has_posts && (
                                  <span className="bg-slate-100 text-slate-500 border border-slate-200 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                                    No posts
                                  </span>
                                )}
                              </div>

                              <a
                                href={`mailto:${lead.email}`}
                                className="text-sm text-[#f80d5d] font-bold hover:underline break-all"
                              >
                                {lead.email}
                              </a>

                              <div className="text-xs font-medium text-slate-400 mt-1">
                                Analyzed:{" "}
                                {new Date(lead.created_at).toLocaleString()}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:min-w-[520px]">
                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                              <div className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">
                                Followers
                              </div>

                              <div className="text-sm font-black text-slate-900">
                                {formatDashboardNumber(lead.followers)}
                              </div>
                            </div>

                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                              <div className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">
                                Engagement
                              </div>

                              <div className="text-sm font-black text-slate-900">
                                {formatDashboardPercent(lead.engagement_rate)}
                              </div>
                            </div>

                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                              <div className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">
                                With Us
                              </div>

                              <div className="text-sm font-black text-slate-900">
                                +{formatDashboardNumber(lead.gain_with_us)}
                              </div>
                            </div>

                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                              <div className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">
                                Posts
                              </div>

                              <div className="text-sm font-black text-slate-900">
                                {formatDashboardNumber(lead.posts_analyzed)}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-3 mt-5 lg:justify-end">
                          <button
                            type="button"
                            onClick={() => sendAnalyzerLeadFollowUpEmail(lead)}
                            disabled={
                              sendingAnalyzerLeadId === lead.id || !lead.email
                            }
                            className="bg-[#f80d5d] hover:bg-[#df0b54] text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {sendingAnalyzerLeadId === lead.id
                              ? "Sending..."
                              : "Email Lead"}
                          </button>

                          <button
                            type="button"
                            onClick={() => sendAnalyzerLeadDiscountEmail(lead)}
                            disabled={
                              sendingAnalyzerLeadOfferId === lead.id ||
                              !lead.email
                            }
                            className="bg-[#fff1f2] hover:bg-[#ffe4e9] text-[#f80d5d] border border-[#fda6e1] px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {sendingAnalyzerLeadOfferId === lead.id
                              ? "Sending Offer..."
                              : "Send 50% Offer"}
                          </button>

                          <a
                            href={buildInstagramUrl(lead.ig_handle)}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-white border border-slate-200 text-slate-600 hover:text-[#f80d5d] hover:border-[#fda6e1] px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow-sm"
                          >
                            View Instagram
                          </a>

                          <button
                            type="button"
                            onClick={() => deleteAnalyzerLead(lead)}
                            disabled={deletingAnalyzerLeadId === lead.id}
                            className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {deletingAnalyzerLeadId === lead.id
                              ? "Deleting..."
                              : "Delete Lead"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* --- CANCELED LEADS TAB --- */}
        {activeTab === "canceled" && adminRole === "superadmin" && (
          <CanceledLeadsTab supabase={supabase} />
        )}

        {/* --- AGENCIES TAB --- */}
        {activeTab === "agencies" && adminRole === "superadmin" && (
          <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-lg font-black text-slate-900">Agency Applications</h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Review and approve agency partner applications</p>
            </div>
            {isLoading ? (
              <div className="p-10 text-center text-slate-400 font-bold animate-pulse">Loading agencies...</div>
            ) : agencies.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-slate-400 font-medium">No agency applications yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {agencies.map((agency) => (
                  <div key={agency.id} className="px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-black text-slate-900 text-base">{agency.company_name || "Unnamed Agency"}</span>
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          agency.status === "approved"
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }`}>
                          {agency.status}
                        </span>
                        {agency.discount_percent > 0 && (
                          <span className="text-[10px] font-black bg-pink-100 text-[#f80d5d] px-2 py-0.5 rounded-full">
                            {agency.discount_percent}% discount
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
                        <span>{agency.contact_name}</span>
                        <span className="text-[#f80d5d]">{agency.email}</span>
                        {agency.ig_handle && <span>@{agency.ig_handle}</span>}
                        {agency.website && <span>{agency.website}</span>}
                      </div>
                      {agency.notes && (
                        <p className="text-xs text-slate-400 mt-1.5 whitespace-pre-line leading-relaxed">{agency.notes}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {agency.stripe_customer_id && (
                        <span className="text-[10px] font-bold text-green-600 bg-green-50 border border-green-200 px-2 py-1 rounded-lg">
                          💳 Card on file
                        </span>
                      )}
                      {agency.status === "pending" && (
                        <button
                          onClick={() => {
                            setAgencyToApprove(agency);
                            setApproveForm({ discountPercent: 15, tempPassword: "" });
                          }}
                          className="bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] text-white px-4 py-2 rounded-xl text-xs font-black shadow-sm hover:opacity-90 transition-opacity"
                        >
                          Approve →
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- CREATOR STUDIO TAB --- */}
        {activeTab === "creator-studio" && adminRole === "superadmin" && (
          <div className="space-y-6">
            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Users size={14} className="text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Subscribers</span>
                </div>
                <div className="text-3xl font-black text-slate-900">{csSubscribers.length}</div>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active</span>
                </div>
                <div className="text-3xl font-black text-emerald-600">
                  {csSubscribers.filter((s) => s.status === "active").length}
                </div>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Wand2 size={14} className="text-violet-500" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Credits Used</span>
                </div>
                <div className="text-3xl font-black text-slate-900">
                  {csSubscribers.reduce((sum, s) => sum + (s.generations_used || 0), 0)}
                </div>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={14} className="text-[#f80d5d]" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Early Bird</span>
                </div>
                <div className="text-3xl font-black text-[#f80d5d]">
                  {csSubscribers.filter((s) => s.is_earlybird).length}
                </div>
              </div>
            </div>

            {/* Subscriber list */}
            <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Creator Studio Subscribers</h2>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">Manage plans, credits and billing</p>
                </div>
              </div>

              {isLoading ? (
                <div className="p-10 text-center text-slate-400 font-bold animate-pulse">Loading subscribers...</div>
              ) : csSubscribers.length === 0 ? (
                <div className="p-12 text-center">
                  <Sparkles size={32} className="mx-auto text-slate-300 mb-3" />
                  <p className="text-slate-400 font-medium">No Creator Studio subscribers yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {csSubscribers.map((sub) => {
                    const isEditing = csEditingId === sub.user_id;
                    const usedPct = sub.generations_limit > 0
                      ? Math.min(100, Math.round((sub.generations_used / sub.generations_limit) * 100))
                      : 0;

                    return (
                      <div key={sub.user_id} className="px-6 py-5 hover:bg-slate-50/60 transition-colors">
                        {!isEditing ? (
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            {/* Left: identity + badges */}
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                <span className="font-black text-slate-900">{sub.email}</span>
                                {/* Plan badge */}
                                {sub.plan_tier === "pro" ? (
                                  <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">
                                    <Crown size={10} /> Pro
                                  </span>
                                ) : sub.plan_tier === "starter" ? (
                                  <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full">
                                    <Zap size={10} /> Starter
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                                    {sub.plan_tier || "—"}
                                  </span>
                                )}
                                {/* Status badge */}
                                {sub.status === "active" ? (
                                  <span className="flex items-center gap-1 text-[10px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                                    <CheckCircle2 size={10} /> Active
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-[10px] font-black bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                                    <XCircle size={10} /> {sub.status}
                                  </span>
                                )}
                                {sub.is_earlybird && (
                                  <span className="flex items-center gap-1 text-[10px] font-black bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                                    <Sparkles size={10} /> Early Bird
                                  </span>
                                )}
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                  {sub.billing_period === "annual" ? "Annual" : "Monthly"}
                                </span>
                              </div>
                              {/* Credits progress bar */}
                              <div className="flex items-center gap-3 mt-2">
                                <div className="flex-1 max-w-[220px] bg-slate-100 rounded-full h-2 overflow-hidden">
                                  <div
                                    className={`h-2 rounded-full transition-all ${
                                      usedPct >= 90 ? "bg-red-500" : usedPct >= 70 ? "bg-amber-500" : "bg-violet-500"
                                    }`}
                                    style={{ width: `${usedPct}%` }}
                                  />
                                </div>
                                <span className="text-xs font-bold text-slate-500 whitespace-nowrap">
                                  {sub.generations_used} / {sub.generations_limit} credits
                                </span>
                              </div>
                              <div className="mt-1.5 text-[11px] text-slate-400 font-medium">
                                Subscribed {new Date(sub.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                              </div>
                            </div>

                            {/* Edit button */}
                            <button
                              onClick={() => {
                                setCsEditingId(sub.user_id);
                                setCsEditForm({
                                  plan_tier: sub.plan_tier,
                                  status: sub.status,
                                  generations_limit: sub.generations_limit,
                                });
                              }}
                              className="shrink-0 flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
                            >
                              <Edit2 size={13} /> Edit Plan
                            </button>
                          </div>
                        ) : (
                          /* --- INLINE EDIT FORM --- */
                          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
                            <p className="text-sm font-black text-slate-700 mb-1">Editing: <span className="text-[#f80d5d]">{sub.email}</span></p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Plan Tier</label>
                                <select
                                  value={csEditForm.plan_tier || ""}
                                  onChange={(e) => setCsEditForm({ ...csEditForm, plan_tier: e.target.value })}
                                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#f80d5d] focus:ring-1 focus:ring-[#f80d5d]"
                                >
                                  <option value="starter">Starter</option>
                                  <option value="pro">Pro</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Status</label>
                                <select
                                  value={csEditForm.status || ""}
                                  onChange={(e) => setCsEditForm({ ...csEditForm, status: e.target.value })}
                                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#f80d5d] focus:ring-1 focus:ring-[#f80d5d]"
                                >
                                  <option value="active">Active</option>
                                  <option value="canceled">Canceled</option>
                                  <option value="past_due">Past Due</option>
                                  <option value="trialing">Trialing</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Credits Limit</label>
                                <input
                                  type="number"
                                  min={0}
                                  value={csEditForm.generations_limit ?? ""}
                                  onChange={(e) => setCsEditForm({ ...csEditForm, generations_limit: Number(e.target.value) })}
                                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#f80d5d] focus:ring-1 focus:ring-[#f80d5d]"
                                />
                              </div>
                            </div>
                            <div className="flex items-center gap-3 pt-1">
                              <button
                                onClick={() => handleSaveCs(sub.user_id)}
                                disabled={isSavingCs}
                                className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white font-black text-xs rounded-xl hover:bg-slate-700 transition-colors disabled:opacity-50"
                              >
                                <Save size={13} /> {isSavingCs ? "Saving..." : "Save Changes"}
                              </button>
                              <button
                                onClick={() => setCsEditingId(null)}
                                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-50 transition-colors"
                              >
                                <X size={13} /> Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- BLOGS TAB --- */}
        {activeTab === "blogs" && (
          <div className="space-y-5">
            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Total Posts", value: blogs.length, color: "text-slate-900" },
                { label: "Published", value: blogs.filter((b) => b.status === "published").length, color: "text-emerald-600" },
                { label: "Drafts", value: blogs.filter((b) => b.status === "draft").length, color: "text-amber-600" },
              ].map((s) => (
                <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm text-center">
                  <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
                <input value={blogSearch} onChange={(e) => setBlogSearch(e.target.value)}
                  placeholder="Search posts, tags, categories…"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f80d5d]/20 bg-white text-sm" />
              </div>
              <select value={blogFilterStatus} onChange={(e) => setBlogFilterStatus(e.target.value as any)}
                className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-600 focus:outline-none">
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Drafts</option>
              </select>
              <select value={blogSortBy} onChange={(e) => setBlogSortBy(e.target.value as any)}
                className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-600 focus:outline-none">
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="az">A → Z</option>
              </select>
              <button onClick={() => { resetBlogForm(); setIsBlogEditorOpen(true); }}
                className="bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] text-white px-5 py-2.5 rounded-xl text-xs font-black hover:opacity-90 transition-opacity shadow-md shadow-[#ff2429]/20 whitespace-nowrap">
                + New Post
              </button>
            </div>

            {/* Post list */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              {isLoading ? (
                <div className="p-10 text-center">
                  <div className="w-8 h-8 border-4 border-slate-200 border-t-[#f80d5d] rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-sm font-bold text-slate-400">Loading posts…</p>
                </div>
              ) : filteredBlogs.length === 0 ? (
                <div className="p-12 text-center text-slate-400 font-medium">
                  {blogSearch || blogFilterStatus !== "all" ? "No posts match your filters." : "No blog posts yet. Create your first one!"}
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredBlogs.map((post) => (
                    <div key={post.id} className="p-4 flex flex-col sm:flex-row gap-4 hover:bg-slate-50/60 transition-colors">
                      <img src={post.image_url || "/images/blog/placeholder.jpg"} alt=""
                        className="w-full sm:w-24 h-32 sm:h-16 object-cover rounded-xl border border-slate-200 shrink-0"
                        onError={(e) => { (e.target as HTMLImageElement).src = "/images/blog/placeholder.jpg"; }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          {(post.status || "draft") === "published" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 uppercase tracking-wider">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>Published
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200 uppercase tracking-wider">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block"></span>Draft
                            </span>
                          )}
                          {post.category && (
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full uppercase tracking-wider">{post.category}</span>
                          )}
                          <span className="text-[10px] text-slate-400">{blogReadingTime(post.content)} min read · {post.created_at ? blogFormatDate(post.created_at) : "—"}</span>
                        </div>
                        <p className="text-sm font-black text-slate-900 line-clamp-1 mb-0.5">{post.title}</p>
                        <p className="text-xs text-slate-400 line-clamp-1">/blog/{post.slug}</p>
                        {post.tags?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {post.tags.slice(0, 3).map((t) => (
                              <span key={t} className="text-[10px] font-medium text-[#f80d5d] bg-[#ffefe9] px-2 py-0.5 rounded-full">{t}</span>
                            ))}
                            {post.tags.length > 3 && <span className="text-[10px] text-slate-400">+{post.tags.length - 3}</span>}
                          </div>
                        )}
                      </div>
                      <div className="flex sm:flex-col gap-1.5 items-start sm:items-end shrink-0">
                        <button onClick={() => openBlogEdit(post)}
                          className="text-xs font-bold text-slate-600 hover:text-[#f80d5d] bg-white hover:bg-[#ffefe9] border border-slate-200 hover:border-[#fda6e1] px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">
                          Edit
                        </button>
                        {(post.status || "draft") === "published" && (
                          <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer"
                            className="text-xs font-bold text-slate-500 hover:text-emerald-600 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">
                            View Live
                          </a>
                        )}
                        <button onClick={() => duplicateBlogPost(post)}
                          className="text-xs font-bold text-slate-500 hover:text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">
                          Duplicate
                        </button>
                        <button onClick={() => setBlogDeleteConfirmId(post.id!)}
                          className="text-xs font-bold text-slate-400 hover:text-red-600 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ==========================================
          SLIDE-OVER PANELS & MODALS
      ========================================== */}
      <AnimatePresence>
        {/* APPROVE AGENCY MODAL */}
        {agencyToApprove && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAgencyToApprove(null)}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-slate-200 pointer-events-auto">
                <div className="h-1 w-full bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] rounded-full mb-6" />
                <h3 className="text-xl font-black text-slate-900 mb-1">Approve Agency</h3>
                <p className="text-sm text-slate-500 font-medium mb-6">
                  {agencyToApprove.company_name || agencyToApprove.email}
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Discount Percentage
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        max={50}
                        value={approveForm.discountPercent}
                        onChange={(e) => setApproveForm({ ...approveForm, discountPercent: Number(e.target.value) })}
                        className="w-full px-4 py-3 pr-8 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f80d5d]/20 focus:border-[#f80d5d] text-sm font-bold"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Temporary Password *
                    </label>
                    <input
                      type="text"
                      required
                      value={approveForm.tempPassword}
                      onChange={(e) => setApproveForm({ ...approveForm, tempPassword: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f80d5d]/20 focus:border-[#f80d5d] text-sm font-medium font-mono"
                      placeholder="e.g. Agency@V1rall1zed"
                    />
                    <p className="text-[11px] text-slate-400 mt-1.5">This will be emailed to the agency as their login password.</p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 mt-6">
                  <button
                    onClick={handleApproveAgency}
                    disabled={isApprovingAgency || !approveForm.tempPassword}
                    className="w-full bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] text-white font-bold py-3.5 rounded-xl transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isApprovingAgency ? "Approving..." : "Approve & Send Access Email"}
                  </button>
                  <button
                    onClick={() => setAgencyToApprove(null)}
                    disabled={isApprovingAgency}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3.5 rounded-xl transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(selectedClient || isBlogEditorOpen || isDeleteDialogOpen) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (isDeleteDialogOpen || blogDeleteConfirmId) return;
              setSelectedClient(null);
              if (isBlogEditorOpen) { closeBlogEditor(); return; }
            }}
            className={`fixed inset-0 backdrop-blur-sm z-40 ${
              isDeleteDialogOpen ? "bg-slate-900/60 z-[60]" : "bg-slate-900/40"
            }`}
          />
        )}

        {/* DELETE CONFIRMATION MODAL */}
        {isDeleteDialogOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-slate-200 pointer-events-auto text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl shadow-sm border border-red-200">
                !
              </div>

              <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
                Delete Client?
              </h3>

              <p className="text-slate-500 font-medium text-sm mb-8 leading-relaxed">
                You are about to permanently delete{" "}
                <strong>{selectedClient?.full_name}</strong> (
                {selectedClient?.ig_handle}). This action will wipe their
                profile, targeting data, and settings from the database and
                cannot be undone.
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={confirmDeleteClient}
                  disabled={isDeleting}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-50"
                >
                  {isDeleting ? "Deleting..." : "Yes, Delete Client"}
                </button>

                <button
                  onClick={() => setIsDeleteDialogOpen(false)}
                  disabled={isDeleting}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3.5 rounded-xl transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* AUDIT REPORT MODAL */}
        {isAuditModalOpen && selectedClient && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-slate-200 pointer-events-auto">
              <div className="h-1 w-full bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] rounded-full mb-6" />
              <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-1">
                Send Audit Report
              </h3>
              <p className="text-slate-500 text-sm font-medium mb-6">
                Upload the PDF and it'll be emailed directly to{" "}
                <strong className="text-slate-700">{selectedClient.full_name}</strong> at{" "}
                <span className="text-[#f80d5d]">{selectedClient.email}</span>
              </p>

              <label className="block w-full cursor-pointer">
                <div className={`w-full border-2 border-dashed rounded-2xl p-6 text-center transition-colors ${auditPdfFile ? "border-[#f80d5d] bg-pink-50" : "border-slate-200 bg-slate-50 hover:border-[#f80d5d]"}`}>
                  <div className="text-3xl mb-2">📄</div>
                  {auditPdfFile ? (
                    <>
                      <p className="text-sm font-bold text-slate-900 truncate">{auditPdfFile.name}</p>
                      <p className="text-xs text-slate-400 mt-1">{(auditPdfFile.size / 1024).toFixed(0)} KB · Click to replace</p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-bold text-slate-600">Click to upload PDF</p>
                      <p className="text-xs text-slate-400 mt-1">Audit report PDF only</p>
                    </>
                  )}
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => setAuditPdfFile(e.target.files?.[0] ?? null)}
                  />
                </div>
              </label>

              <div className="flex flex-col gap-3 mt-6">
                <button
                  onClick={sendAuditReport}
                  disabled={!auditPdfFile || isSendingAudit}
                  className="w-full bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] text-white font-bold py-3.5 rounded-xl transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isSendingAudit ? "Sending..." : "Send Audit Report"}
                </button>
                <button
                  onClick={() => { setIsAuditModalOpen(false); setAuditPdfFile(null); }}
                  disabled={isSendingAudit}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3.5 rounded-xl transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* CLIENT DETAILS / EDIT PANEL */}
        {selectedClient && adminRole === "superadmin" && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full max-w-md bg-[#fafafa] shadow-2xl z-50 overflow-y-auto border-l border-slate-200"
          >
            <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 py-5 flex items-center justify-between z-10 shadow-sm">
              <h2 className="text-lg font-black text-slate-900">
                {isEditingClient ? "Edit Profile" : "Client Details"}
              </h2>

              <div className="flex items-center gap-3">
                {!isEditingClient && (
                  <>
                    <button
                      onClick={() => setIsEditingClient(true)}
                      className="text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => setIsDeleteDialogOpen(true)}
                      type="button"
                      className="text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Delete
                    </button>
                  </>
                )}

                <button
                  onClick={() => setSelectedClient(null)}
                  className="text-slate-400 hover:text-slate-800 font-bold text-xl px-2"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6">
              {!isEditingClient ? (
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm text-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#ffae07] to-[#f80d5d] text-white flex items-center justify-center font-black text-2xl mx-auto mb-4 shadow-md">
                      {selectedClient.full_name?.charAt(0).toUpperCase()}
                    </div>

                    <div className="text-2xl font-black text-slate-900 mb-1">
                      {selectedClient.full_name}
                    </div>

                    <a
                      href={`https://instagram.com/${selectedClient.ig_handle?.replace("@", "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#f80d5d] font-bold hover:underline"
                    >
                      {selectedClient.ig_handle}
                    </a>

                    <div className="text-xs font-bold text-slate-400 mt-2">
                      {selectedClient.email}
                    </div>

                    <div className="text-xs font-medium text-slate-400 mt-1">
                      Joined:{" "}
                      {new Date(selectedClient.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 shadow-sm">
                      <DataRow
                        label="Selected Plan"
                        value={selectedClient.plan || "Not provided"}
                      />

                      <DataRow
                        label="City & Country"
                        value={selectedClient.location || "Not provided"}
                      />

                      <DataRow
                        label="Niche"
                        value={selectedClient.niche || "Not provided"}
                      />

                      <DataRow
                        label="Target Audience"
                        value={selectedClient.target_audience || "Not provided"}
                      />

                      <DataRow
                        label="Primary Goal"
                        value={selectedClient.goals || "Not provided"}
                      />
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 shadow-sm">
                      <DataRow
                        label="Competitor Targets"
                        value={selectedClient.targets || "None added"}
                      />

                      <DataRow
                        label="Whitelist"
                        value={selectedClient.whitelist || "None added"}
                      />
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 shadow-sm">
                      <DataRow
                        label="IG Password"
                        value={selectedClient.ig_password || "Not provided"}
                      />

                      <DataRow
                        label="2FA Code"
                        value={selectedClient.two_factor_code || "Not provided"}
                      />
                    </div>
                  </div>

                  {/* QUICK-ACTION EMAIL BUTTONS */}
                  <div className="pt-2 flex flex-col gap-3">
                    <button
                      onClick={() => { setIsAuditModalOpen(true); setAuditPdfFile(null); }}
                      className="w-full bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] text-white font-bold py-3.5 rounded-xl transition-opacity text-[13px] shadow-sm hover:opacity-90 flex items-center justify-center gap-2"
                    >
                      <BarChart2 size={15} /> Send Audit Report
                    </button>

                    <button
                      onClick={sendSetupCompleteEmail}
                      disabled={isSendingSetupEmail}
                      className="w-full bg-green-50 hover:bg-green-100 text-green-700 font-bold py-3.5 rounded-xl transition-colors border border-green-200 text-[13px] shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSendingSetupEmail
                        ? "Sending..."
                        : "Send 'Setup Complete' Email"}
                    </button>

                    <button
                      onClick={sendTargetsReminderEmail}
                      disabled={isSendingTargetsEmail}
                      className="w-full bg-pink-50 hover:bg-pink-100 text-[#f80d5d] font-bold py-3.5 rounded-xl transition-colors border border-pink-200 text-[13px] shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSendingTargetsEmail
                        ? "Sending..."
                        : "Send 'Add More Targets' Email"}
                    </button>

                    <button
                      onClick={sendPasswordUpdateEmail}
                      disabled={isSendingEmail}
                      className="w-full bg-orange-50 hover:bg-orange-100 text-orange-600 font-bold py-3.5 rounded-xl transition-colors border border-orange-200 text-[13px] shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSendingEmail
                        ? "Sending..."
                        : "Send 'Incorrect Password' Email"}
                    </button>

                    <button
                      onClick={send2FAUpdateEmail}
                      disabled={isSending2FAEmail}
                      className="w-full bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold py-3.5 rounded-xl transition-colors border border-blue-200 text-[13px] shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSending2FAEmail
                        ? "Sending..."
                        : "Send '2FA Required' Email"}
                    </button>

                    <button
                      onClick={sendVerifyLoginEmail}
                      disabled={isSendingVerifyLoginEmail}
                      className="w-full bg-purple-50 hover:bg-purple-100 text-purple-600 font-bold py-3.5 rounded-xl transition-colors border border-purple-200 text-[13px] shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSendingVerifyLoginEmail
                        ? "Sending..."
                        : "Send 'Verify Login / This Was Me' Email"}
                    </button>
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={handleSaveClient}
                  className="space-y-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Full Name</label>

                      <input
                        type="text"
                        value={clientForm.full_name || ""}
                        onChange={(e) =>
                          setClientForm({
                            ...clientForm,
                            full_name: e.target.value,
                          })
                        }
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>IG Handle</label>

                      <input
                        type="text"
                        value={clientForm.ig_handle || ""}
                        onChange={(e) =>
                          setClientForm({
                            ...clientForm,
                            ig_handle: e.target.value,
                          })
                        }
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Account Email</label>

                    <input
                      type="email"
                      value={clientForm.email || ""}
                      onChange={(e) =>
                        setClientForm({ ...clientForm, email: e.target.value })
                      }
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>City & Country</label>

                    <input
                      type="text"
                      value={clientForm.location || ""}
                      onChange={(e) =>
                        setClientForm({
                          ...clientForm,
                          location: e.target.value,
                        })
                      }
                      className={inputClass}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>IG Password</label>

                      <input
                        type="text"
                        value={clientForm.ig_password || ""}
                        onChange={(e) =>
                          setClientForm({
                            ...clientForm,
                            ig_password: e.target.value,
                          })
                        }
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>2FA Code</label>

                      <input
                        type="text"
                        value={clientForm.two_factor_code || ""}
                        onChange={(e) =>
                          setClientForm({
                            ...clientForm,
                            two_factor_code: e.target.value,
                          })
                        }
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Plan Tier</label>

                    <input
                      type="text"
                      value={clientForm.plan || ""}
                      onChange={(e) =>
                        setClientForm({ ...clientForm, plan: e.target.value })
                      }
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Niche</label>

                    <input
                      type="text"
                      value={clientForm.niche || ""}
                      onChange={(e) =>
                        setClientForm({ ...clientForm, niche: e.target.value })
                      }
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Target Audience</label>

                    <input
                      type="text"
                      value={clientForm.target_audience || ""}
                      onChange={(e) =>
                        setClientForm({
                          ...clientForm,
                          target_audience: e.target.value,
                        })
                      }
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Goals</label>

                    <input
                      type="text"
                      value={clientForm.goals || ""}
                      onChange={(e) =>
                        setClientForm({ ...clientForm, goals: e.target.value })
                      }
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>
                      Targets (Comma Separated)
                    </label>

                    <textarea
                      rows={3}
                      value={clientForm.targets || ""}
                      onChange={(e) =>
                        setClientForm({
                          ...clientForm,
                          targets: e.target.value,
                        })
                      }
                      className={`${inputClass} resize-y`}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>
                      Whitelist (Comma Separated)
                    </label>

                    <textarea
                      rows={2}
                      value={clientForm.whitelist || ""}
                      onChange={(e) =>
                        setClientForm({
                          ...clientForm,
                          whitelist: e.target.value,
                        })
                      }
                      className={`${inputClass} resize-y`}
                    />
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="submit"
                      disabled={isSavingClient}
                      className="flex-1 bg-[#1e293b] hover:bg-[#0f172a] text-white py-3 rounded-xl font-bold text-sm shadow-sm transition-colors disabled:opacity-50"
                    >
                      {isSavingClient ? "Saving..." : "Save Changes"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setClientForm(selectedClient);
                        setIsEditingClient(false);
                      }}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold text-sm transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        )}

        {/* BLOG HTML PASTE MODAL */}
        {blogHtmlPasteOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[70]"
              onClick={() => setBlogHtmlPasteOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[80] bg-white rounded-2xl shadow-2xl border border-slate-200 w-[95vw] max-w-2xl flex flex-col overflow-hidden"
              style={{ maxHeight: "85vh" }}
            >
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Paste HTML from Claude</h3>
                    <p className="text-[10px] font-medium text-slate-400">Ask Claude to write your blog as HTML, then paste it below</p>
                  </div>
                </div>
                <button onClick={() => setBlogHtmlPasteOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="px-5 py-3 bg-violet-50 border-b border-violet-100 shrink-0">
                <p className="text-xs text-violet-700 font-medium">
                  💡 <strong>Tip:</strong> In Claude, say: <em>"Write this blog post as clean HTML using &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;strong&gt;, and &lt;img&gt; tags. Do not include &lt;html&gt;, &lt;head&gt;, or &lt;body&gt; tags."</em>
                </p>
              </div>
              <div className="flex-1 overflow-y-auto p-5">
                <textarea
                  value={blogHtmlPasteValue}
                  onChange={(e) => setBlogHtmlPasteValue(e.target.value)}
                  className="w-full h-64 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-400/30 bg-slate-50 text-xs font-mono text-slate-700 resize-none"
                  placeholder={'<h2>Your Heading</h2>\n<p>Your paragraph text here...</p>\n<img src="https://..." alt="description" />\n<ul>\n  <li>Point one</li>\n  <li>Point two</li>\n</ul>'}
                  spellCheck={false}
                />
                <p className="text-[10px] text-slate-400 mt-2">
                  {blogHtmlPasteValue.trim() ? `${blogHtmlPasteValue.length} characters` : "Paste your HTML from Claude above"}
                </p>
              </div>
              <div className="px-5 py-4 border-t border-slate-100 flex gap-3 shrink-0">
                <button type="button" onClick={() => setBlogHtmlPasteOpen(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50">
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!blogHtmlPasteValue.trim()}
                  onClick={() => {
                    setBlogField("content", blogHtmlPasteValue);
                    setBlogHtmlPasteOpen(false);
                    setBlogHtmlPasteValue("");
                  }}
                  className="flex-1 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-black transition-colors disabled:opacity-40 shadow-md shadow-violet-500/20"
                >
                  Apply to Editor
                </button>
              </div>
            </motion.div>
          </>
        )}

        {/* BLOG DELETE CONFIRM */}
        {blogDeleteConfirmId && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[70]"
              onClick={() => setBlogDeleteConfirmId(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-[80] flex items-center justify-center p-4 pointer-events-none">
              <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 w-[90vw] max-w-sm pointer-events-auto text-center">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                </div>
                <h3 className="font-black text-slate-900 text-lg mb-2">Delete Post?</h3>
                <p className="text-slate-500 text-sm mb-5">This action cannot be undone.</p>
                <div className="flex gap-3">
                  <button onClick={() => setBlogDeleteConfirmId(null)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
                  <button onClick={confirmBlogDelete} disabled={isBlogDeleting}
                    className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold disabled:opacity-50">
                    {isBlogDeleting ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}

        {/* BLOG EDITOR PANEL */}
        {isBlogEditorOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 220 }}
            className="fixed inset-y-0 right-0 w-full max-w-4xl bg-[#fafafa] shadow-2xl z-50 flex flex-col border-l border-slate-200"
          >
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-5 py-4 flex items-center justify-between shrink-0 shadow-sm">
              <div className="flex items-center gap-3">
                <button onClick={closeBlogEditor} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <div>
                  <h2 className="text-base font-black text-slate-900">{blogForm.id ? "Edit Post" : "New Post"}</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {blogWordCount(blogForm.content)} words · {blogReadingTime(blogForm.content)} min read
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button type="button"
                  onClick={() => setBlogField("status", blogForm.status === "published" ? "draft" : "published")}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border transition-colors ${
                    blogForm.status === "published" ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-amber-50 text-amber-600 border-amber-200"
                  }`}>
                  <span className={`w-2 h-2 rounded-full ${blogForm.status === "published" ? "bg-emerald-500" : "bg-amber-400"}`}></span>
                  {blogForm.status === "published" ? "Published" : "Draft"}
                </button>
                <button type="button" disabled={isSavingBlog} onClick={(e) => saveBlogPost(e as any)}
                  className="bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] text-white px-5 py-2 rounded-lg text-xs font-black hover:opacity-90 transition-opacity shadow-md disabled:opacity-50">
                  {isSavingBlog ? "Saving…" : blogForm.status === "published" ? "Save & Publish" : "Save Draft"}
                </button>
              </div>
            </div>

            {/* Section tabs */}
            <div className="bg-white border-b border-slate-100 px-5 flex shrink-0">
              {(["content", "seo"] as const).map((s) => (
                <button key={s} onClick={() => setBlogActiveSection(s)}
                  className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
                    blogActiveSection === s ? "border-[#f80d5d] text-[#f80d5d]" : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}>
                  {s === "content" ? "Content" : "SEO & Meta"}
                </button>
              ))}
            </div>

            {/* Scrollable form body */}
            <div className="flex-1 overflow-y-auto">
              <form onSubmit={saveBlogPost} className="p-5 space-y-5">
                {blogActiveSection === "content" && (
                  <>
                    {/* Featured Image */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Featured Image</span>
                        {imagePreview && (
                          <button type="button" onClick={() => { setImagePreview(null); setSelectedImage(null); setBlogField("image_url", ""); }}
                            className="text-[10px] font-bold text-red-500 hover:text-red-700">Remove</button>
                        )}
                      </div>
                      <div className="p-4">
                        {imagePreview ? (
                          <div className="relative group cursor-pointer" onClick={() => blogFileInputRef.current?.click()}>
                            <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-xl border border-slate-200" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                              <span className="text-white text-xs font-bold">Click to change</span>
                            </div>
                          </div>
                        ) : (
                          <div
                            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
                              blogDragOver ? "border-[#f80d5d] bg-[#ffefe9]" : "border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100"
                            }`}
                            onClick={() => blogFileInputRef.current?.click()}
                            onDragOver={(e) => { e.preventDefault(); setBlogDragOver(true); }}
                            onDragLeave={() => setBlogDragOver(false)}
                            onDrop={(e) => { e.preventDefault(); setBlogDragOver(false); const f = e.dataTransfer.files?.[0]; if (f?.type.startsWith("image/")) processBlogImage(f); }}>
                            <svg className="w-8 h-8 text-slate-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                            </svg>
                            <p className="text-sm font-bold text-slate-500 mb-1">Drop image or click to upload</p>
                            <p className="text-xs text-slate-400">PNG, JPG, WEBP up to 10MB</p>
                          </div>
                        )}
                        <input ref={blogFileInputRef} type="file" accept="image/*"
                          onChange={(e) => { if (e.target.files?.[0]) processBlogImage(e.target.files[0]); }}
                          className="hidden" />
                      </div>
                    </div>

                    {/* Core fields */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">Title <span className="text-red-500">*</span></label>
                        <input type="text" required value={blogForm.title} onChange={(e) => setBlogField("title", e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f80d5d]/20 bg-slate-50 text-sm font-medium"
                          placeholder="Article title…" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">URL Slug</label>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400 shrink-0">/blog/</span>
                          <input type="text" value={blogForm.slug} onChange={(e) => setBlogField("slug", e.target.value)}
                            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f80d5d]/20 bg-slate-50 text-sm font-medium"
                            placeholder="auto-generated-from-title" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">Category</label>
                          <select value={blogForm.category} onChange={(e) => setBlogField("category", e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f80d5d]/20 bg-slate-50 text-sm text-slate-600">
                            <option value="">No Category</option>
                            {BLOG_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">Publish Date</label>
                          <input type="date"
                            value={blogForm.created_at ? new Date(blogForm.created_at).toISOString().split("T")[0] : ""}
                            onChange={(e) => setBlogField("created_at", e.target.value ? new Date(e.target.value).toISOString() : undefined as any)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f80d5d]/20 bg-slate-50 text-sm text-slate-600" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">Excerpt <span className="text-red-500">*</span></label>
                        <textarea required rows={3} value={blogForm.excerpt} onChange={(e) => setBlogField("excerpt", e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f80d5d]/20 bg-slate-50 text-sm font-medium resize-y"
                          placeholder="Short summary for blog listing cards…" />
                      </div>
                      {/* Tags */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">Tags</label>
                        <div className="flex gap-2 mb-2">
                          <input value={blogTagInput} onChange={(e) => setBlogTagInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addBlogTag(); } }}
                            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f80d5d]/20 bg-slate-50 text-sm"
                            placeholder="Add tag, press Enter…" />
                          <button type="button" onClick={addBlogTag}
                            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-600 hover:bg-slate-50">Add</button>
                        </div>
                        {blogForm.tags?.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {blogForm.tags.map((t) => (
                              <span key={t} className="flex items-center gap-1.5 text-xs font-bold text-[#f80d5d] bg-[#ffefe9] border border-[#fda6e1]/50 px-3 py-1 rounded-full">
                                {t}
                                <button type="button" onClick={() => removeBlogTag(t)} className="hover:text-red-700">
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Body Content */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Body Content</span>
                        <button
                          type="button"
                          onClick={() => { setBlogHtmlPasteValue(blogForm.content); setBlogHtmlPasteOpen(true); }}
                          className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-violet-600 bg-slate-50 hover:bg-violet-50 border border-slate-200 hover:border-violet-200 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                          </svg>
                          Paste HTML
                        </button>
                      </div>
                      <div className="p-4 relative z-0">
                        <ReactQuill
                          ref={quillRef}
                          theme="snow"
                          value={blogForm.content}
                          onChange={(c) => setBlogField("content", c)}
                          modules={quillModules}
                          className="bg-slate-50 rounded-xl overflow-hidden"
                          placeholder="Write your article here, or click 'Paste HTML' to import from Claude…"
                        />
                        <style>{`
                          .ql-toolbar { border-top-left-radius: 0.75rem; border-top-right-radius: 0.75rem; background-color: white; border-color: #e2e8f0 !important; }
                          .ql-container { border-bottom-left-radius: 0.75rem; border-bottom-right-radius: 0.75rem; border-color: #e2e8f0 !important; min-height: 360px; font-size: 15px; font-family: inherit; }
                          .ql-editor { padding: 1.25rem 1.5rem; }
                          .ql-editor img { max-width: 100%; height: auto; border-radius: 0.75rem; margin: 1.5rem auto; display: block; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
                          .ql-editor p { margin-bottom: 0.75em; }
                        `}</style>
                      </div>
                    </div>
                  </>
                )}

                {blogActiveSection === "seo" && (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5">
                    <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
                      <svg className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                      </svg>
                      <p className="text-xs text-blue-700 font-medium leading-relaxed">Leave blank to use the post title and excerpt automatically.</p>
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Meta Title</label>
                        <span className={`text-[10px] font-bold ${blogForm.meta_title.length > 60 ? "text-red-500" : "text-slate-400"}`}>{blogForm.meta_title.length}/60</span>
                      </div>
                      <input type="text" maxLength={80} value={blogForm.meta_title} onChange={(e) => setBlogField("meta_title", e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f80d5d]/20 bg-slate-50 text-sm font-medium"
                        placeholder="SEO-optimised page title…" />
                      <p className="text-[10px] text-slate-400 mt-1">Ideal: 50–60 characters</p>
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Meta Description</label>
                        <span className={`text-[10px] font-bold ${blogForm.meta_description.length > 160 ? "text-red-500" : "text-slate-400"}`}>{blogForm.meta_description.length}/160</span>
                      </div>
                      <textarea rows={4} maxLength={200} value={blogForm.meta_description} onChange={(e) => setBlogField("meta_description", e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f80d5d]/20 bg-slate-50 text-sm font-medium resize-none"
                        placeholder="Compelling description for search results…" />
                      <p className="text-[10px] text-slate-400 mt-1">Ideal: 120–160 characters</p>
                    </div>
                    {(blogForm.meta_title || blogForm.title) && (
                      <div>
                        <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">Search Preview</p>
                        <div className="border border-slate-200 rounded-xl p-4 bg-white">
                          <p className="text-[13px] font-medium text-blue-700 truncate">{blogForm.meta_title || blogForm.title}</p>
                          <p className="text-[11px] text-green-700 truncate mb-1">virallized.com/blog/{blogForm.slug || "your-slug"}</p>
                          <p className="text-[12px] text-slate-600 line-clamp-2">{blogForm.meta_description || blogForm.excerpt || "No description yet."}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-3 pt-2 pb-4">
                  <button type="button" onClick={closeBlogEditor}
                    className="flex-1 py-3.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
                  <button type="submit" disabled={isSavingBlog}
                    className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] text-white text-sm font-black hover:opacity-90 shadow-lg disabled:opacity-50">
                    {isSavingBlog ? "Saving…" : blogForm.status === "published" ? "Save & Publish" : "Save as Draft"}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Helper component for clean data rows
const DataRow = ({ label, value }: { label: string; value: string }) => (
  <div className="p-4">
    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
      {label}
    </div>

    <div className="text-sm font-bold text-slate-800 leading-relaxed break-words whitespace-pre-wrap">
      {value}
    </div>
  </div>
);

export default AdminDashboard;

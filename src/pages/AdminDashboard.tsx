import { useState, useEffect, useRef, useMemo } from "react";
import type { FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabase";
import type { Session } from "@supabase/supabase-js";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

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
  created_at?: string;
}

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

type AdminRole = "superadmin" | "blogger" | null;
type DashboardTab = "clients" | "blogs" | "analyzed";

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

  // --- BLOG EDITOR STATE ---
  const [isBlogEditorOpen, setIsBlogEditorOpen] = useState(false);
  const [isSavingBlog, setIsSavingBlog] = useState(false);
  const [blogForm, setBlogForm] = useState<BlogPost>({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    image_url: "",
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const quillRef = useRef<any>(null);

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
          alert(
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
      alert("This lead does not have an email address attached.");
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

      alert(`Success! Growth invitation sent to ${lead.email}`);
    } catch (error) {
      console.error("Failed to send analyzer lead email:", error);
      alert("Failed to send email. Please check the console or try again.");
    } finally {
      setSendingAnalyzerLeadId(null);
    }
  };

  const sendAnalyzerLeadDiscountEmail = async (lead: AnalyzedAccount) => {
    if (!lead.email) {
      alert("This lead does not have an email address attached.");
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

      alert(`Success! 50% offer sent to ${lead.email}`);
    } catch (error) {
      console.error("Failed to send analyzer discount email:", error);
      alert(
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

      alert(`Deleted analyzer lead ${leadLabel}.`);
    } catch (error: any) {
      console.error("Failed to delete analyzer lead:", error);
      alert(
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

      alert(`Success! Email sent to ${selectedClient.email}`);
    } catch (error) {
      console.error("Failed to send email:", error);
      alert("Failed to send email. Please check the console or try again.");
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

      alert(`Success! 2FA Email sent to ${selectedClient.email}`);
    } catch (error) {
      console.error("Failed to send email:", error);
      alert("Failed to send email. Please check the console or try again.");
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

      alert(`Success! Verify Login email sent to ${selectedClient.email}`);
    } catch (error) {
      console.error("Failed to send email:", error);
      alert("Failed to send email. Please check the console or try again.");
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

      alert(`Success! Targets email sent to ${selectedClient.email}`);
    } catch (error) {
      console.error("Failed to send targets email:", error);
      alert("Failed to send email. Please check the console or try again.");
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

      alert(`Success! Setup Complete email sent to ${selectedClient.email}`);
    } catch (error) {
      console.error("Failed to send setup complete email:", error);
      alert("Failed to send email. Please check the console or try again.");
    } finally {
      setIsSendingSetupEmail(false);
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
      alert("Failed to update client: " + error.message);
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
      alert("Failed to delete client: " + error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // --- BLOG HANDLERS ---
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  };

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
        alert("Failed to upload image into post: " + error.message);
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
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `post-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("blog-images")
        .upload(filePath, selectedImage);

      if (uploadError) {
        alert("Error uploading featured image: " + uploadError.message);
        setIsSavingBlog(false);
        return;
      }

      const { data } = supabase.storage
        .from("blog-images")
        .getPublicUrl(filePath);

      finalImageUrl = data.publicUrl;
    }

    const finalSlug = blogForm.slug.trim() || generateSlug(blogForm.title);

    const postData: any = {
      title: blogForm.title,
      slug: finalSlug,
      excerpt: blogForm.excerpt,
      content: blogForm.content,
      image_url: finalImageUrl,
    };

    if (blogForm.created_at) {
      postData.created_at = blogForm.created_at;
    }

    let error;

    if (blogForm.id) {
      const { error: updateError } = await supabase
        .from("blogs")
        .update(postData)
        .eq("id", blogForm.id);

      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from("blogs")
        .insert([postData]);

      error = insertError;
    }

    if (error) {
      alert("Error saving blog post: " + error.message);
    } else {
      setIsBlogEditorOpen(false);
      resetBlogForm();
      fetchData();
    }

    setIsSavingBlog(false);
  };

  const resetBlogForm = () => {
    setBlogForm({
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      image_url: "",
      created_at: undefined,
    });

    setSelectedImage(null);
    setImagePreview(null);
  };

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
                    🔍
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
                    🔍
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

        {/* --- BLOGS TAB --- */}
        {activeTab === "blogs" && (
          <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-lg font-black text-slate-900">
                Published Articles
              </h2>

              <button
                onClick={() => {
                  resetBlogForm();
                  setIsBlogEditorOpen(true);
                }}
                className="bg-[#1e293b] hover:bg-[#0f172a] text-white px-5 py-2 rounded-xl text-xs font-bold transition-colors shadow-sm"
              >
                + New Post
              </button>
            </div>

            {isLoading ? (
              <div className="p-10 text-center text-slate-400 font-bold animate-pulse">
                Loading posts...
              </div>
            ) : blogs.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-slate-500 font-medium">
                  No blog posts found. Create your first one!
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {blogs.map((post) => (
                  <div
                    key={post.id}
                    className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-6 min-w-0 flex-1">
                      <img
                        src={post.image_url || "/images/blog/placeholder.jpg"}
                        alt="Thumbnail"
                        className="w-24 h-16 object-cover rounded-lg border border-slate-200 shrink-0"
                      />

                      <div className="min-w-0">
                        <h3 className="text-base font-black text-slate-900 truncate mb-1">
                          {post.title}
                        </h3>

                        <p className="text-xs font-bold text-slate-400 truncate">
                          /{post.slug}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setBlogForm(post);
                        setImagePreview(post.image_url);
                        setIsBlogEditorOpen(true);
                      }}
                      className="bg-white border border-slate-200 text-slate-600 hover:text-[#f80d5d] hover:border-[#fda6e1] px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow-sm whitespace-nowrap"
                    >
                      Edit Post
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ==========================================
          SLIDE-OVER PANELS & MODALS
      ========================================== */}
      <AnimatePresence>
        {(selectedClient || isBlogEditorOpen || isDeleteDialogOpen) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (isDeleteDialogOpen) return;

              setSelectedClient(null);
              setIsBlogEditorOpen(false);
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

        {/* BLOG EDITOR PANEL */}
        {isBlogEditorOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full max-w-4xl bg-[#fafafa] shadow-2xl z-50 overflow-y-auto border-l border-slate-200"
          >
            <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 py-5 flex items-center justify-between z-10 shadow-sm">
              <h2 className="text-lg font-black text-slate-900">
                {blogForm.id ? "Edit Post" : "Create New Post"}
              </h2>

              <button
                onClick={() => setIsBlogEditorOpen(false)}
                className="text-slate-400 hover:text-red-500 font-bold text-xl px-2"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={saveBlogPost} className="space-y-6">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-3">
                    Featured Image
                  </label>

                  {imagePreview && (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-xl mb-4 border border-slate-200"
                    />
                  )}

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#ffefe9] file:text-[#f80d5d] hover:file:bg-[#fda6e1]/30 transition-colors cursor-pointer"
                  />
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                      Title
                    </label>

                    <input
                      type="text"
                      required
                      value={blogForm.title}
                      onChange={(e) =>
                        setBlogForm({ ...blogForm, title: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f80d5d]/20 focus:border-[#f80d5d] bg-slate-50 focus:bg-white text-sm font-medium"
                      placeholder="Article title..."
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                      Publish Date (Optional)
                    </label>

                    <input
                      type="date"
                      value={
                        blogForm.created_at
                          ? new Date(blogForm.created_at)
                              .toISOString()
                              .split("T")[0]
                          : ""
                      }
                      onChange={(e) => {
                        if (e.target.value) {
                          setBlogForm({
                            ...blogForm,
                            created_at: new Date(e.target.value).toISOString(),
                          });
                        } else {
                          setBlogForm({
                            ...blogForm,
                            created_at: undefined,
                          });
                        }
                      }}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f80d5d]/20 focus:border-[#f80d5d] bg-slate-50 focus:bg-white text-sm font-medium text-slate-500"
                    />

                    <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-wider">
                      Leave blank to use current date and time
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                      URL Slug (Optional)
                    </label>

                    <input
                      type="text"
                      value={blogForm.slug}
                      onChange={(e) =>
                        setBlogForm({ ...blogForm, slug: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f80d5d]/20 focus:border-[#f80d5d] bg-slate-50 focus:bg-white text-sm font-medium"
                      placeholder="auto-generated-if-empty"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                      Excerpt
                    </label>

                    <textarea
                      required
                      rows={3}
                      value={blogForm.excerpt}
                      onChange={(e) =>
                        setBlogForm({ ...blogForm, excerpt: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f80d5d]/20 focus:border-[#f80d5d] bg-slate-50 focus:bg-white text-sm font-medium resize-y"
                      placeholder="Short summary for the blog card..."
                    />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative z-0">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                    Body Content
                  </label>

                  <ReactQuill
                    ref={quillRef}
                    theme="snow"
                    value={blogForm.content}
                    onChange={(content: string) =>
                      setBlogForm({ ...blogForm, content })
                    }
                    modules={quillModules}
                    className="bg-slate-50 rounded-xl overflow-hidden"
                    placeholder="Write your beautiful article here... Drag and drop images, or click the image icon in the toolbar!"
                  />

                  <style>{`
                    .ql-toolbar {
                      border-top-left-radius: 0.75rem;
                      border-top-right-radius: 0.75rem;
                      background-color: white;
                      border-color: #e2e8f0 !important;
                    }

                    .ql-container {
                      border-bottom-left-radius: 0.75rem;
                      border-bottom-right-radius: 0.75rem;
                      border-color: #e2e8f0 !important;
                      min-height: 400px;
                      font-size: 15px;
                      font-family: inherit;
                    }

                    .ql-editor {
                      padding: 1.5rem;
                    }

                    .ql-editor img {
                      max-width: 100%;
                      height: auto;
                      border-radius: 0.75rem;
                      margin: 2rem auto;
                      display: block;
                      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
                    }
                  `}</style>
                </div>

                <button
                  type="submit"
                  disabled={isSavingBlog}
                  className="w-full text-center bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] text-white py-4 rounded-xl font-black tracking-wide hover:opacity-90 transition-opacity text-[14px] shadow-lg shadow-[#ff2429]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSavingBlog ? "Saving Post..." : "Publish Article"}
                </button>
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

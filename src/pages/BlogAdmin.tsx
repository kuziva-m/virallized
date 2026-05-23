import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabase";
import type { Session } from "@supabase/supabase-js";
import { toast } from "../lib/toast";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

// ─── Types ────────────────────────────────────────────────────────────────────

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

const EMPTY_POST: BlogPost = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  image_url: "",
  status: "draft",
  category: "",
  tags: [],
  meta_title: "",
  meta_description: "",
};

const CATEGORIES = [
  "Instagram Growth",
  "Content Strategy",
  "Social Media Tips",
  "Case Studies",
  "Tools & Resources",
  "Industry News",
  "Agency Updates",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const generateSlug = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

const readingTime = (html: string) => {
  const text = html.replace(/<[^>]+>/g, "");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
};

const wordCount = (html: string) => {
  const text = html.replace(/<[^>]+>/g, "");
  return text.trim().split(/\s+/).filter(Boolean).length;
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: "draft" | "published" }) =>
  status === "published" ? (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 uppercase tracking-wider">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
      Published
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200 uppercase tracking-wider">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block"></span>
      Draft
    </span>
  );

// ─── Main Component ───────────────────────────────────────────────────────────

const BlogAdmin = () => {
  // Auth
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isCheckingRole, setIsCheckingRole] = useState(true);

  // List
  const [isLoading, setIsLoading] = useState(false);
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "published" | "draft">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "az">("newest");

  // Editor
  const [editorOpen, setEditorOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [form, setForm] = useState<BlogPost>(EMPTY_POST);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [activeSection, setActiveSection] = useState<"content" | "seo">("content");
  const [htmlPasteOpen, setHtmlPasteOpen] = useState(false);
  const [htmlPasteValue, setHtmlPasteValue] = useState("");

  const quillRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Derived helpers ───────────────────────────────────────────────────────
  const isFullPageHtml = form.content.trim().toLowerCase().startsWith("<!doctype html");
  const isPasteFullPage = htmlPasteValue.trim().toLowerCase().startsWith("<!doctype html");

  // ── Auth ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) verifyAndSetRole(session);
      else setIsCheckingRole(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      if (s) verifyAndSetRole(s);
      else { setSession(null); setIsCheckingRole(false); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const verifyAndSetRole = async (s: Session) => {
    setIsCheckingRole(true);
    const { data, error } = await supabase
      .from("admin_roles")
      .select("role")
      .eq("email", s.user.email?.toLowerCase())
      .single();
    if (error || !data || (data.role !== "blogger" && data.role !== "superadmin")) {
      toast.error("Unauthorized access. You do not have writer permissions.");
      await supabase.auth.signOut();
      setSession(null);
    } else {
      setSession(s);
      fetchBlogs();
    }
    setIsCheckingRole(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setAuthError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setAuthError(error.message);
    setIsLoggingIn(false);
  };

  // ── Data ──────────────────────────────────────────────────────────────────

  const fetchBlogs = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("blogs")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setBlogs((data as BlogPost[]) || []);
    setIsLoading(false);
  };

  // ── Filtered / sorted list ────────────────────────────────────────────────

  const filteredBlogs = useMemo(() => {
    let list = [...blogs];
    if (filterStatus !== "all") list = list.filter((b) => b.status === filterStatus);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.category?.toLowerCase().includes(q) ||
          b.tags?.some((t) => t.toLowerCase().includes(q)),
      );
    }
    if (sortBy === "newest") list.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    else if (sortBy === "oldest") list.sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());
    else if (sortBy === "az") list.sort((a, b) => a.title.localeCompare(b.title));
    return list;
  }, [blogs, search, filterStatus, sortBy]);

  const stats = useMemo(() => ({
    total: blogs.length,
    published: blogs.filter((b) => b.status === "published").length,
    drafts: blogs.filter((b) => b.status === "draft").length,
  }), [blogs]);

  // ── Image upload ──────────────────────────────────────────────────────────

  const processImage = (file: File) => {
    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
    setIsDirty(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) processImage(e.target.files[0]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) processImage(file);
  };

  // ── Quill in-body image handler ───────────────────────────────────────────

  const imageHandler = useCallback(async () => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
      const filePath = `post-body-images/${fileName}`;
      try {
        const { error: uploadError } = await supabase.storage
          .from("blog-images")
          .upload(filePath, file);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from("blog-images").getPublicUrl(filePath);
        const quill = quillRef.current?.getEditor();
        if (quill) {
          const range = quill.getSelection();
          quill.insertEmbed(range ? range.index : 0, "image", data.publicUrl);
        }
      } catch (err: any) {
        toast.error("Failed to upload image: " + err.message);
      }
    };
  }, []);

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
        handlers: { image: imageHandler },
      },
    }),
    [imageHandler],
  );

  // ── Form helpers ──────────────────────────────────────────────────────────

  const setField = <K extends keyof BlogPost>(key: K, value: BlogPost[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      // Auto-generate slug when title changes if slug is empty or was auto-gen
      if (key === "title" && (!prev.slug || prev.slug === generateSlug(prev.title))) {
        next.slug = generateSlug(String(value));
      }
      return next;
    });
    setIsDirty(true);
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !form.tags.includes(t)) {
      setField("tags", [...form.tags, t]);
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setField("tags", form.tags.filter((t) => t !== tag));
  };

  const openNew = () => {
    setForm(EMPTY_POST);
    setSelectedImage(null);
    setImagePreview(null);
    setTagInput("");
    setIsDirty(false);
    setActiveSection("content");
    setEditorOpen(true);
  };

  const openEdit = (post: BlogPost) => {
    setForm({
      ...post,
      tags: post.tags || [],
      meta_title: post.meta_title || "",
      meta_description: post.meta_description || "",
      category: post.category || "",
      status: post.status || "draft",
    });
    setSelectedImage(null);
    setImagePreview(post.image_url || null);
    setTagInput("");
    setIsDirty(false);
    setActiveSection("content");
    setEditorOpen(true);
  };

  const closeEditor = () => {
    if (isDirty) {
      if (!window.confirm("You have unsaved changes. Discard them?")) return;
    }
    setEditorOpen(false);
  };

  // ── Duplicate ─────────────────────────────────────────────────────────────

  const duplicatePost = async (post: BlogPost) => {
    const { error } = await supabase.from("blogs").insert([{
      title: `${post.title} (Copy)`,
      slug: `${post.slug}-copy-${Date.now()}`,
      excerpt: post.excerpt,
      content: post.content,
      image_url: post.image_url,
      status: "draft",
      category: post.category,
      tags: post.tags,
      meta_title: post.meta_title,
      meta_description: post.meta_description,
    }]);
    if (error) toast.error("Failed to duplicate: " + error.message);
    else fetchBlogs();
  };

  // ── Delete ────────────────────────────────────────────────────────────────

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    setIsDeleting(true);
    const { error } = await supabase.from("blogs").delete().eq("id", deleteConfirmId);
    if (error) toast.error("Failed to delete: " + error.message);
    else {
      setDeleteConfirmId(null);
      fetchBlogs();
    }
    setIsDeleting(false);
  };

  // ── Save ──────────────────────────────────────────────────────────────────

  const savePost = async (e: React.FormEvent, publishOverride?: "draft" | "published") => {
    e.preventDefault();
    setIsSaving(true);

    let finalImageUrl = form.image_url;

    if (selectedImage) {
      const fileExt = selectedImage.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
      const filePath = `post-images/${fileName}`;
      const { error: upErr } = await supabase.storage
        .from("blog-images")
        .upload(filePath, selectedImage);
      if (upErr) {
        toast.error("Error uploading image: " + upErr.message);
        setIsSaving(false);
        return;
      }
      const { data } = supabase.storage.from("blog-images").getPublicUrl(filePath);
      finalImageUrl = data.publicUrl;
    }

    const payload: any = {
      title: form.title,
      slug: form.slug.trim() || generateSlug(form.title),
      excerpt: form.excerpt,
      content: form.content,
      image_url: finalImageUrl,
      status: publishOverride ?? form.status,
      category: form.category,
      tags: form.tags,
      meta_title: form.meta_title,
      meta_description: form.meta_description,
    };
    if (form.created_at) payload.created_at = form.created_at;

    let error;
    if (form.id) {
      ({ error } = await supabase.from("blogs").update(payload).eq("id", form.id));
    } else {
      ({ error } = await supabase.from("blogs").insert([payload]));
    }

    if (error) {
      toast.error("Error saving post: " + error.message);
    } else {
      setEditorOpen(false);
      setIsDirty(false);
      fetchBlogs();
    }
    setIsSaving(false);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // VIEWS
  // ─────────────────────────────────────────────────────────────────────────

  if (isCheckingRole) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-[#f80d5d] rounded-full animate-spin"></div>
          <p className="text-slate-500 font-bold tracking-widest text-xs uppercase">Verifying Access…</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex flex-col justify-center py-12 px-5 sm:px-6 lg:px-8 selection:bg-[#ffefe9] selection:text-[#f80d5d]">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center mb-8">
            <img src="/images/logos/virallized-main-logo.svg" alt="Virallized" className="h-9 w-auto" />
          </div>
          <h2 className="text-center text-3xl font-black text-slate-900 mb-8 tracking-tight">Writer Access</h2>
          <div className="bg-white py-10 px-6 sm:px-10 shadow-xl shadow-slate-200/50 rounded-[2rem] border border-slate-200">
            <form onSubmit={handleLogin} className="space-y-6">
              {authError && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-bold text-center">{authError}</div>
              )}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">Writer Email</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f80d5d]/20 bg-slate-50 focus:bg-white text-sm"
                  placeholder="writer@virallized.com" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">Password</label>
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f80d5d]/20 bg-slate-50 focus:bg-white text-sm"
                  placeholder="••••••••" />
              </div>
              <button type="submit" disabled={isLoggingIn}
                className="w-full bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] text-white py-4 rounded-xl font-black tracking-wide hover:opacity-90 transition-opacity text-sm shadow-lg shadow-[#ff2429]/20 disabled:opacity-50">
                {isLoggingIn ? "Authenticating…" : "Access Portal"}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Main Dashboard ────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#fafafa] font-sans selection:bg-[#ffefe9] selection:text-[#f80d5d]">

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/images/logos/virallized-main-logo.svg" alt="Virallized" className="h-7 sm:h-8 w-auto" />
            <div className="hidden sm:block w-px h-6 bg-slate-200"></div>
            <h1 className="hidden sm:block text-base font-black text-slate-900 tracking-tight">Blog Manager</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden md:block text-[10px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-wider">Writer</span>
            <button onClick={() => supabase.auth.signOut()}
              className="text-xs font-bold text-slate-500 hover:text-red-600 bg-slate-50 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors border border-slate-200 hover:border-red-200">
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total Posts", value: stats.total, color: "text-slate-900" },
            { label: "Published", value: stats.published, color: "text-emerald-600" },
            { label: "Drafts", value: stats.drafts, color: "text-amber-600" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm text-center">
              <div className={`text-2xl sm:text-3xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search posts, tags, categories…"
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f80d5d]/20 bg-white text-sm" />
          </div>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#f80d5d]/20 text-slate-600">
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#f80d5d]/20 text-slate-600">
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="az">A → Z</option>
          </select>
          <button onClick={openNew}
            className="bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] text-white px-5 py-3 rounded-xl text-sm font-black hover:opacity-90 transition-opacity shadow-md shadow-[#ff2429]/20 whitespace-nowrap">
            + New Post
          </button>
        </div>

        {/* Post List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-10 text-center">
              <div className="w-8 h-8 border-4 border-slate-200 border-t-[#f80d5d] rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-sm font-bold text-slate-400">Loading posts…</p>
            </div>
          ) : filteredBlogs.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <p className="text-slate-700 font-bold mb-1">{search || filterStatus !== "all" ? "No posts match your filters" : "No posts yet"}</p>
              <p className="text-slate-400 text-sm">
                {search || filterStatus !== "all" ? "Try adjusting your search or filters" : "Create your first blog post to get started"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredBlogs.map((post) => (
                <div key={post.id} className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 hover:bg-slate-50/60 transition-colors group">
                  {/* Thumbnail */}
                  <div className="relative shrink-0">
                    <img
                      src={post.image_url || "/images/blog/placeholder.jpg"}
                      alt=""
                      className="w-full sm:w-28 h-32 sm:h-20 object-cover rounded-xl border border-slate-200"
                      onError={(e) => { (e.target as HTMLImageElement).src = "/images/blog/placeholder.jpg"; }}
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <StatusBadge status={post.status || "draft"} />
                      {post.category && (
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          {post.category}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 font-medium">
                        {readingTime(post.content)} min read · {post.created_at ? formatDate(post.created_at) : "—"}
                      </span>
                    </div>
                    <h3 className="text-sm font-black text-slate-900 line-clamp-1 mb-1">{post.title}</h3>
                    <p className="text-xs text-slate-500 line-clamp-1 mb-2">{post.excerpt}</p>
                    {post.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {post.tags.slice(0, 4).map((t) => (
                          <span key={t} className="text-[10px] font-medium text-[#f80d5d] bg-[#ffefe9] px-2 py-0.5 rounded-full">{t}</span>
                        ))}
                        {post.tags.length > 4 && (
                          <span className="text-[10px] font-medium text-slate-400">+{post.tags.length - 4}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex sm:flex-col gap-2 items-start sm:items-end justify-start sm:justify-center shrink-0">
                    <button onClick={() => openEdit(post)}
                      className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#f80d5d] bg-white hover:bg-[#ffefe9] border border-slate-200 hover:border-[#fda6e1] px-3 py-2 rounded-lg transition-colors shadow-sm whitespace-nowrap">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
                      Edit
                    </button>
                    {post.status === "published" && (
                      <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-600 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 px-3 py-2 rounded-lg transition-colors shadow-sm whitespace-nowrap">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>
                        View Live
                      </a>
                    )}
                    <button onClick={() => duplicatePost(post)}
                      className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 px-3 py-2 rounded-lg transition-colors shadow-sm whitespace-nowrap">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.375" /></svg>
                      Duplicate
                    </button>
                    <button onClick={() => setDeleteConfirmId(post.id!)}
                      className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-red-600 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 px-3 py-2 rounded-lg transition-colors shadow-sm whitespace-nowrap">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* ── HTML Paste Modal ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {htmlPasteOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60]"
              onClick={() => setHtmlPasteOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] bg-white rounded-2xl shadow-2xl border border-slate-200 w-[95vw] max-w-2xl flex flex-col overflow-hidden"
              style={{ maxHeight: "90vh" }}
            >
              {/* Modal header */}
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isPasteFullPage ? "bg-violet-600" : "bg-violet-100"}`}>
                    <svg className={`w-4 h-4 ${isPasteFullPage ? "text-white" : "text-violet-600"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black text-slate-900">Paste HTML from Claude</h3>
                      {isPasteFullPage && (
                        <span className="text-[10px] font-black text-violet-700 bg-violet-100 border border-violet-300 px-2 py-0.5 rounded-full uppercase tracking-wider">Full Page Mode</span>
                      )}
                    </div>
                    <p className="text-[10px] font-medium text-slate-400">
                      {isPasteFullPage ? "Full-page HTML detected — your entire Claude design will render as-is" : "Paste HTML from Claude, then click Apply"}
                    </p>
                  </div>
                </div>
                <button onClick={() => setHtmlPasteOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {/* Step-by-step instructions */}
              <div className="px-5 pt-4 pb-3 bg-slate-50 border-b border-slate-100 shrink-0 space-y-3">
                <p className="text-[11px] font-black text-slate-500 uppercase tracking-wider">How to use</p>
                <ol className="space-y-2">
                  <li className="flex gap-2.5 items-start">
                    <span className="w-5 h-5 rounded-full bg-violet-600 text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">1</span>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">In Claude, ask it to write your blog post as HTML. For simple posts: <em>"write as clean HTML with h2, p, ul tags"</em>. For a fully designed page: <em>"write as a complete standalone HTML page with inline CSS"</em>.</p>
                  </li>
                  <li className="flex gap-2.5 items-start">
                    <span className="w-5 h-5 rounded-full bg-violet-600 text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">2</span>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">Copy Claude's <strong>entire raw HTML output</strong> — including the <code className="bg-slate-200 px-1 rounded text-[10px]">&lt;!DOCTYPE html&gt;</code> if it's a full page. Do <strong>not</strong> copy from a browser preview.</p>
                  </li>
                  <li className="flex gap-2.5 items-start">
                    <span className="w-5 h-5 rounded-full bg-violet-600 text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">3</span>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">Paste it in the box below and click <strong>Apply</strong>. For full-page posts, skip the Featured Image — it's already in your HTML.</p>
                  </li>
                </ol>
              </div>

              {/* Auto-detected full-page warning */}
              {isPasteFullPage && (
                <div className="mx-5 mt-4 p-3 bg-violet-50 border border-violet-200 rounded-xl flex gap-2.5 items-start shrink-0">
                  <svg className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <p className="text-[11px] text-violet-700 font-medium leading-relaxed">
                    <strong>Full-page HTML detected!</strong> This post will render as a fully designed standalone page — your custom CSS, fonts, and layout are all preserved. After applying: <strong>don't upload a featured image</strong> (your hero is already in the HTML).
                  </p>
                </div>
              )}

              {/* Textarea */}
              <div className="flex-1 overflow-y-auto p-5">
                <textarea
                  value={htmlPasteValue}
                  onChange={(e) => setHtmlPasteValue(e.target.value)}
                  className={`w-full h-60 px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 bg-slate-50 text-xs font-mono text-slate-700 resize-none transition-colors ${
                    isPasteFullPage
                      ? "border-violet-300 focus:ring-violet-400/30"
                      : "border-slate-200 focus:ring-violet-400/30"
                  }`}
                  placeholder={"Paste Claude's HTML here…\n\nFor a standard post: <h2>Heading</h2><p>Paragraph…</p>\n\nFor a custom-designed post: paste the entire output starting with <!DOCTYPE html>"}
                  spellCheck={false}
                />
                <p className="text-[10px] text-slate-400 mt-2">
                  {htmlPasteValue.trim()
                    ? `${htmlPasteValue.length.toLocaleString()} characters · ${isPasteFullPage ? "Full-page HTML (standalone render)" : "Fragment HTML (renders inside blog wrapper)"}`
                    : "Paste your HTML from Claude above"}
                </p>
              </div>

              {/* Actions */}
              <div className="px-5 py-4 border-t border-slate-100 flex gap-3 shrink-0">
                <button type="button" onClick={() => setHtmlPasteOpen(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!htmlPasteValue.trim()}
                  onClick={() => {
                    setField("content", htmlPasteValue);
                    setHtmlPasteOpen(false);
                    setHtmlPasteValue("");
                  }}
                  className={`flex-1 py-3 rounded-xl text-white text-sm font-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-md ${
                    isPasteFullPage
                      ? "bg-violet-600 hover:bg-violet-700 shadow-violet-500/20"
                      : "bg-violet-600 hover:bg-violet-700 shadow-violet-500/20"
                  }`}
                >
                  Apply to Post
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Delete Confirm Modal ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {deleteConfirmId && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50"
              onClick={() => setDeleteConfirmId(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 w-[90vw] max-w-sm">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <h3 className="text-center font-black text-slate-900 text-lg mb-2">Delete Post?</h3>
              <p className="text-center text-slate-500 text-sm mb-6">This action cannot be undone. The post will be permanently removed.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button onClick={confirmDelete} disabled={isDeleting}
                  className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-colors disabled:opacity-50">
                  {isDeleting ? "Deleting…" : "Delete Post"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Editor Drawer ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {editorOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={closeEditor}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40" />

            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 220 }}
              className="fixed inset-y-0 right-0 w-full max-w-4xl bg-[#fafafa] shadow-2xl z-50 flex flex-col border-l border-slate-200"
            >
              {/* Drawer Header */}
              <div className="bg-white border-b border-slate-200 px-5 py-4 flex items-center justify-between shrink-0 shadow-sm">
                <div className="flex items-center gap-3">
                  <button onClick={closeEditor} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                  <div>
                    <h2 className="text-base font-black text-slate-900">{form.id ? "Edit Post" : "New Post"}</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {wordCount(form.content)} words · {readingTime(form.content)} min read
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Status toggle — prominent pill so it's impossible to miss */}
                  <button
                    type="button"
                    onClick={() => setField("status", form.status === "published" ? "draft" : "published")}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black border-2 transition-all shadow-sm ${
                      form.status === "published"
                        ? "bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600 hover:border-emerald-600 shadow-emerald-200"
                        : "bg-amber-400 text-white border-amber-400 hover:bg-amber-500 hover:border-amber-500 shadow-amber-200"
                    }`}
                    title={form.status === "published" ? "Click to switch back to Draft" : "Click to mark as Published"}
                  >
                    <span className="w-2 h-2 rounded-full bg-white/80 inline-block"></span>
                    {form.status === "published" ? "✓ Published" : "⚬ Draft — click to publish"}
                  </button>
                  <button
                    type="button"
                    form="blog-form"
                    disabled={isSaving}
                    onClick={(e) => savePost(e)}
                    className="bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] text-white px-5 py-2 rounded-lg text-xs font-black hover:opacity-90 transition-opacity shadow-md shadow-[#ff2429]/20 disabled:opacity-50">
                    {isSaving ? "Saving…" : form.status === "published" ? "Save & Publish" : "Save Draft"}
                  </button>
                </div>
              </div>

              {/* Section tabs */}
              <div className="bg-white border-b border-slate-100 px-5 flex gap-0 shrink-0">
                {(["content", "seo"] as const).map((s) => (
                  <button key={s} onClick={() => setActiveSection(s)}
                    className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
                      activeSection === s
                        ? "border-[#f80d5d] text-[#f80d5d]"
                        : "border-transparent text-slate-400 hover:text-slate-600"
                    }`}>
                    {s === "content" ? "Content" : "SEO & Meta"}
                  </button>
                ))}
              </div>

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto">
                <form id="blog-form" onSubmit={savePost} className="p-5 space-y-5">

                  {activeSection === "content" && (
                    <>
                      {/* Featured Image */}
                      <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${isFullPageHtml ? "border-violet-200" : "border-slate-200"}`}>
                        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Featured Image</span>
                            {isFullPageHtml && (
                              <span className="text-[10px] font-bold text-violet-600 bg-violet-100 border border-violet-200 px-2 py-0.5 rounded-full">Not used in Full Page mode</span>
                            )}
                          </div>
                          {imagePreview && !isFullPageHtml && (
                            <button type="button" onClick={() => { setImagePreview(null); setSelectedImage(null); setField("image_url", ""); }}
                              className="text-[10px] font-bold text-red-500 hover:text-red-700 transition-colors">Remove</button>
                          )}
                        </div>
                        {isFullPageHtml && (
                          <div className="mx-4 mt-4 mb-0 p-3.5 bg-violet-50 border border-violet-200 rounded-xl flex gap-2.5 items-start">
                            <svg className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>
                            <p className="text-[11px] text-violet-700 font-medium leading-relaxed">
                              This post uses <strong>Full Page HTML mode</strong> — the featured image here is ignored. Your hero image is already inside the HTML from Claude. Do <strong>not</strong> upload an image here or it will appear twice.
                            </p>
                          </div>
                        )}
                        <div className={`p-4 ${isFullPageHtml ? "opacity-40 pointer-events-none" : ""}`}>
                          {imagePreview ? (
                            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                              <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-xl border border-slate-200" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                                <span className="text-white text-xs font-bold">Click to change</span>
                              </div>
                            </div>
                          ) : (
                            <div
                              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
                                dragOver ? "border-[#f80d5d] bg-[#ffefe9]" : "border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100"
                              }`}
                              onClick={() => fileInputRef.current?.click()}
                              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                              onDragLeave={() => setDragOver(false)}
                              onDrop={handleDrop}>
                              <svg className="w-8 h-8 text-slate-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                              </svg>
                              <p className="text-sm font-bold text-slate-500 mb-1">Drop image here or click to upload</p>
                              <p className="text-xs text-slate-400">PNG, JPG, WEBP up to 10MB</p>
                            </div>
                          )}
                          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                        </div>
                      </div>

                      {/* Core fields */}
                      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">Title <span className="text-red-500">*</span></label>
                          <input type="text" required value={form.title} onChange={(e) => setField("title", e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f80d5d]/20 bg-slate-50 text-sm font-medium"
                            placeholder="Enter article title…" />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">URL Slug</label>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400 font-medium shrink-0">/blog/</span>
                            <input type="text" value={form.slug} onChange={(e) => setField("slug", e.target.value)}
                              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f80d5d]/20 bg-slate-50 text-sm font-medium"
                              placeholder="auto-generated-from-title" />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">Category</label>
                            <select value={form.category} onChange={(e) => setField("category", e.target.value)}
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f80d5d]/20 bg-slate-50 text-sm font-medium text-slate-600">
                              <option value="">No Category</option>
                              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">Publish Date</label>
                            <input type="date"
                              value={form.created_at ? new Date(form.created_at).toISOString().split("T")[0] : ""}
                              onChange={(e) => setField("created_at", e.target.value ? new Date(e.target.value).toISOString() : undefined as any)}
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f80d5d]/20 bg-slate-50 text-sm font-medium text-slate-600" />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">Excerpt <span className="text-red-500">*</span></label>
                          <textarea required rows={3} value={form.excerpt} onChange={(e) => setField("excerpt", e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f80d5d]/20 bg-slate-50 text-sm font-medium resize-y"
                            placeholder="Short summary shown on blog listing cards…" />
                        </div>

                        {/* Tags */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">Tags</label>
                          <div className="flex gap-2 mb-2.5">
                            <input value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f80d5d]/20 bg-slate-50 text-sm"
                              placeholder="Add tag and press Enter…" />
                            <button type="button" onClick={addTag}
                              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">Add</button>
                          </div>
                          {form.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {form.tags.map((t) => (
                                <span key={t} className="flex items-center gap-1.5 text-xs font-bold text-[#f80d5d] bg-[#ffefe9] border border-[#fda6e1]/50 px-3 py-1 rounded-full">
                                  {t}
                                  <button type="button" onClick={() => removeTag(t)} className="hover:text-red-700 transition-colors">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Body Content */}
                      <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${isFullPageHtml ? "border-violet-300" : "border-slate-200"}`}>
                        <div className={`px-5 py-3.5 border-b flex items-center justify-between ${isFullPageHtml ? "border-violet-100 bg-violet-50" : "border-slate-100"}`}>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Body Content</span>
                            {isFullPageHtml && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black text-violet-700 bg-violet-100 border border-violet-300 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" /></svg>
                                Full Page HTML
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => { setHtmlPasteValue(form.content); setHtmlPasteOpen(true); }}
                            className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-violet-600 bg-slate-50 hover:bg-violet-50 border border-slate-200 hover:border-violet-200 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                            </svg>
                            Paste HTML from Claude
                          </button>
                        </div>
                        {isFullPageHtml && (
                          <div className="mx-4 mt-4 p-3 bg-violet-50 border border-violet-200 rounded-xl flex gap-2 items-start">
                            <svg className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <p className="text-[11px] text-violet-700 font-medium leading-relaxed">
                              Full-page HTML detected — this post will render as a <strong>standalone designed page</strong> (like Claude's output with custom CSS, fonts, and layout). The Quill editor below is inactive for this mode.
                            </p>
                          </div>
                        )}
                        <div className={`p-4 relative z-0 ${isFullPageHtml ? "opacity-30 pointer-events-none select-none" : ""}`}>
                          <ReactQuill
                            ref={quillRef}
                            theme="snow"
                            value={form.content}
                            onChange={(c) => setField("content", c)}
                            modules={quillModules}
                            className="bg-slate-50 rounded-xl overflow-hidden"
                            placeholder="Write your article here, or click 'Paste HTML from Claude' to import…"
                          />
                          <style>{`
                            .ql-toolbar { border-top-left-radius: 0.75rem; border-top-right-radius: 0.75rem; background-color: white; border-color: #e2e8f0 !important; }
                            .ql-container { border-bottom-left-radius: 0.75rem; border-bottom-right-radius: 0.75rem; border-color: #e2e8f0 !important; min-height: 380px; font-size: 15px; font-family: inherit; }
                            .ql-editor { padding: 1.25rem 1.5rem; }
                            .ql-editor img { max-width: 100%; height: auto; border-radius: 0.75rem; margin: 1.5rem auto; display: block; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
                            .ql-editor p { margin-bottom: 0.75em; }
                          `}</style>
                        </div>
                      </div>
                    </>
                  )}

                  {activeSection === "seo" && (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5">
                      <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
                        <svg className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                        </svg>
                        <p className="text-xs text-blue-700 font-medium leading-relaxed">
                          These fields override what search engines and social media platforms display. Leave blank to use the post title and excerpt automatically.
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Meta Title</label>
                          <span className={`text-[10px] font-bold ${form.meta_title.length > 60 ? "text-red-500" : "text-slate-400"}`}>
                            {form.meta_title.length}/60
                          </span>
                        </div>
                        <input type="text" maxLength={80} value={form.meta_title} onChange={(e) => setField("meta_title", e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f80d5d]/20 bg-slate-50 text-sm font-medium"
                          placeholder="SEO-optimised page title…" />
                        <p className="text-[10px] text-slate-400 mt-1.5">Ideal: 50–60 characters</p>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Meta Description</label>
                          <span className={`text-[10px] font-bold ${form.meta_description.length > 160 ? "text-red-500" : "text-slate-400"}`}>
                            {form.meta_description.length}/160
                          </span>
                        </div>
                        <textarea rows={4} maxLength={200} value={form.meta_description} onChange={(e) => setField("meta_description", e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f80d5d]/20 bg-slate-50 text-sm font-medium resize-none"
                          placeholder="Compelling description for search results…" />
                        <p className="text-[10px] text-slate-400 mt-1.5">Ideal: 120–160 characters</p>
                      </div>

                      {/* Google preview */}
                      {(form.meta_title || form.title) && (
                        <div>
                          <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">Search Preview</p>
                          <div className="border border-slate-200 rounded-xl p-4 bg-white">
                            <p className="text-[13px] font-medium text-blue-700 truncate">{form.meta_title || form.title}</p>
                            <p className="text-[11px] text-green-700 truncate mb-1">virallized.com/blog/{form.slug || "your-slug"}</p>
                            <p className="text-[12px] text-slate-600 line-clamp-2">{form.meta_description || form.excerpt || "No description yet."}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Bottom save bar */}
                  <div className="flex gap-3 pt-2 pb-4">
                    <button type="button" onClick={closeEditor}
                      className="flex-1 py-3.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                      Cancel
                    </button>
                    <button type="submit" disabled={isSaving}
                      className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] text-white text-sm font-black hover:opacity-90 transition-opacity shadow-lg shadow-[#ff2429]/20 disabled:opacity-50">
                      {isSaving ? "Saving…" : form.status === "published" ? "Save & Publish" : "Save as Draft"}
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

export default BlogAdmin;

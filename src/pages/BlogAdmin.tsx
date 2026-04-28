import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabase";
import type { Session } from "@supabase/supabase-js";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

interface BlogPost {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image_url: string;
  created_at?: string; // Used for the editable date
}

const BlogAdmin = () => {
  // Auth & Role State
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isCheckingRole, setIsCheckingRole] = useState(true);

  // Data State
  const [isLoading, setIsLoading] = useState(false);
  const [blogs, setBlogs] = useState<BlogPost[]>([]);

  // Blog Editor State
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

  // Init Auth and Protect Route
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        verifyAndSetRole(session);
      } else {
        setIsCheckingRole(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        verifyAndSetRole(session);
      } else {
        setSession(null);
        setIsCheckingRole(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const verifyAndSetRole = async (currentSession: Session) => {
    setIsCheckingRole(true);
    const { data, error } = await supabase
      .from("admin_roles")
      .select("role")
      .eq("email", currentSession.user.email?.toLowerCase())
      .single();

    if (
      error ||
      !data ||
      (data.role !== "blogger" && data.role !== "superadmin")
    ) {
      alert("Unauthorized access. You do not have writer permissions.");
      await supabase.auth.signOut();
      setSession(null);
    } else {
      setSession(currentSession);
      fetchBlogs();
    }
    setIsCheckingRole(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
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

  const fetchBlogs = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("blogs")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setBlogs((data as BlogPost[]) || []);
    setIsLoading(false);
  };

  // Editor Handlers
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
        handlers: { image: imageHandler },
      },
    }),
    [],
  );

  const saveBlogPost = async (e: React.FormEvent) => {
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

    // 🚨 UPDATED PAYLOAD: Includes the custom created_at date if provided
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
      fetchBlogs();
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
      created_at: undefined, // 🚨 Reset the date field too
    });
    setSelectedImage(null);
    setImagePreview(null);
  };

  // ==========================================
  // VIEW 1: CHECKING ROLE
  // ==========================================
  if (isCheckingRole) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-[#f80d5d] rounded-full animate-spin"></div>
          <p className="text-slate-500 font-bold tracking-widest text-xs uppercase">
            Verifying Access...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: LOGIN SCREEN
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
            Writer Access
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
                  Writer Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f80d5d]/20 bg-slate-50 focus:bg-white text-sm"
                  placeholder="writer@virallized.com"
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
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f80d5d]/20 bg-slate-50 focus:bg-white text-sm"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full text-center bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] text-white py-4 rounded-xl font-black tracking-wide hover:opacity-90 transition-opacity text-[14px] shadow-lg shadow-[#ff2429]/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoggingIn ? "Authenticating..." : "Access Portal"}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    );
  }

  // ==========================================
  // VIEW 3: BLOGGER DASHBOARD
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
              Writer Portal
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden md:block text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-wider">
              Blogger
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
        <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden mt-6">
          <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="text-lg font-black text-slate-900">
              Published Articles
            </h2>
            <button
              onClick={() => {
                resetBlogForm();
                setIsBlogEditorOpen(true);
              }}
              className="bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-opacity hover:opacity-90 shadow-md shadow-[#ff2429]/20"
            >
              + New Post
            </button>
          </div>

          {isLoading ? (
            <div className="p-10 text-center text-slate-400 font-bold animate-pulse">
              Loading posts...
            </div>
          ) : blogs.length === 0 ? (
            <div className="p-12 text-center text-slate-500 font-medium">
              No blog posts found. Create your first one!
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
      </main>

      <AnimatePresence>
        {isBlogEditorOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsBlogEditorOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
          />
        )}

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
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f80d5d]/20 bg-slate-50 text-sm font-medium"
                      placeholder="Article title..."
                    />
                  </div>

                  {/* 🚨 NEW FIELD: EDITABLE PUBLISH DATE 🚨 */}
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
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f80d5d]/20 bg-slate-50 text-sm font-medium text-slate-500"
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
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f80d5d]/20 bg-slate-50 text-sm font-medium"
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
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f80d5d]/20 bg-slate-50 text-sm font-medium resize-y"
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
                    placeholder="Write your beautiful article here..."
                  />
                  <style>{`
                    .ql-toolbar { border-top-left-radius: 0.75rem; border-top-right-radius: 0.75rem; background-color: white; border-color: #e2e8f0 !important; }
                    .ql-container { border-bottom-left-radius: 0.75rem; border-bottom-right-radius: 0.75rem; border-color: #e2e8f0 !important; min-height: 400px; font-size: 15px; font-family: inherit; }
                    .ql-editor { padding: 1.5rem; }
                    .ql-editor img { max-width: 100%; height: auto; border-radius: 0.75rem; margin: 2rem auto; display: block; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
                  `}</style>
                </div>

                <button
                  type="submit"
                  disabled={isSavingBlog}
                  className="w-full text-center bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] text-white py-4 rounded-xl font-black tracking-wide hover:opacity-90 transition-opacity text-[14px] shadow-lg shadow-[#ff2429]/20 disabled:opacity-50"
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

export default BlogAdmin;

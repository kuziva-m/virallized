import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import SEO from "../components/SEO";

export default function BlogPost() {
  const { slug } = useParams(); // Grabs the article name from the URL
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      const { data, error } = await supabase
        .from("blogs")
        .select("*")
        .eq("slug", slug)
        .single(); // We only want one exact match

      if (error) {
        console.error("Error fetching post:", error);
      } else if (data) {
        setPost(data);
      }
      setLoading(false);
    };

    if (slug) {
      fetchPost();
    }
  }, [slug]);

  if (loading) {
    return (
      <>
        <SEO
          title="Loading Article | Virallized"
          description="Loading Virallized blog article."
          path={`/blog/${slug || ""}`}
          noIndex
        />

        <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-[#f80d5d] rounded-full animate-spin"></div>
        </div>
      </>
    );
  }

  if (!post) {
    return (
      <>
        <SEO
          title="Article Not Found | Virallized"
          description="The requested Virallized blog article could not be found."
          path={`/blog/${slug || ""}`}
          noIndex
        />

        <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center px-6 text-center">
          <h1 className="text-4xl font-black text-slate-900 mb-4">
            Article Not Found
          </h1>
          <p className="text-slate-500 mb-8">
            We couldn't find the blog post you're looking for.
          </p>
          <Link
            to="/blog"
            className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors"
          >
            Back to Blog
          </Link>
        </div>
      </>
    );
  }

  // 🚨 Intercept the text and destroy the non-breaking spaces from Quill
  const cleanContent = (post.content || "").replace(/&nbsp;/g, " ");

  // ── Full-page HTML post: bypass React wrapper and render the entire template ──
  if (cleanContent.trim().startsWith("<!DOCTYPE html>") || cleanContent.trim().startsWith("<!DOCTYPE HTML>")) {
    // Inject <base target="_top"> so every link navigates the parent window, not the iframe
    const injected = cleanContent.replace(/<head([^>]*)>/i, "<head$1><base target=\"_top\">");
    return (
      <iframe
        srcDoc={injected}
        title={post.title}
        style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", border: "none", zIndex: 9999 }}
        sandbox="allow-same-origin allow-popups allow-top-navigation allow-top-navigation-by-user-activation"
      />
    );
  }

  return (
    <>
      <SEO
        title={`${post.title} | Virallized`}
        description={
          post.excerpt ||
          "Read this Virallized article for Instagram growth tips, audience-building strategies, and organic follower growth insights."
        }
        path={`/blog/${post.slug}`}
        ogType="article"
        image={post.image_url || "/images/og/virallized-og.jpg"}
        imageAlt={post.title}
        publishedTime={post.created_at}
        modifiedTime={post.updated_at || post.created_at}
        section="Instagram Growth"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.title,
          description:
            post.excerpt ||
            "Read this Virallized article for Instagram growth tips, audience-building strategies, and organic follower growth insights.",
          image:
            post.image_url ||
            "https://www.virallized.com/images/og/virallized-og.jpg",
          datePublished: post.created_at,
          dateModified: post.updated_at || post.created_at,
          author: {
            "@type": "Organization",
            name: "Virallized",
          },
          publisher: {
            "@type": "Organization",
            name: "Virallized",
            logo: {
              "@type": "ImageObject",
              url: "https://www.virallized.com/images/logos/virallized-main-logo.svg",
            },
          },
          mainEntityOfPage: {
            "@type": "WebPage",
            "@id": `https://www.virallized.com/blog/${post.slug}`,
          },
        }}
      />

      <main className="min-h-screen bg-white pb-24 selection:bg-[#ffefe9] selection:text-[#f80d5d] flex flex-col overflow-x-hidden">
        {/* CUSTOM NAV / HEADER - FIXED LAYOUT */}
        <nav className="bg-white border-b border-slate-200 shrink-0 sticky top-0 z-50">
          <div className="container mx-auto px-6 py-4 flex justify-between items-center max-w-[90rem]">
            {/* Logo on the Left */}
            <Link to="/" className="w-24 lg:w-32 flex justify-start">
              <img
                src="/images/logos/virallized-main-logo.svg"
                alt="Virallized Logo"
                className="w-full h-auto object-contain"
              />
            </Link>

            {/* CTA Button on the Right */}
            <Link
              to="/#pricing"
              className="flex-none text-center bg-gradient-to-r from-[#ffae07] from-[0%] via-[#ff2429] via-[25%] to-[#f1078d] to-[85%] text-white px-6 py-3 lg:px-5 lg:py-2.5 rounded-xl font-bold text-[14px] lg:text-[11px] hover:opacity-90 transition-opacity shadow-lg whitespace-nowrap"
            >
              Start My Growth
            </Link>
          </div>
        </nav>

        {/* ARTICLE HEADER */}
        <article className="container mx-auto px-6 max-w-3xl mt-12 lg:mt-20">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#f80d5d] transition-colors mb-8"
          >
            <span>←</span> Back to all articles
          </Link>

          <div className="text-[11px] lg:text-xs text-[#f80d5d] font-bold mb-4 uppercase tracking-wider">
            {new Date(post.created_at).toLocaleDateString(undefined, {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </div>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-[1.15] mb-6">
            {post.title}
          </h1>

          <p className="text-lg text-slate-500 font-medium leading-relaxed mb-10">
            {post.excerpt}
          </p>

          {/* 🚨 REPAIRED FEATURED IMAGE: Flexible height + object-contain so it never crops 🚨 */}
          {post.image_url && (
            <div className="w-full mb-12 shadow-sm border border-slate-200 rounded-3xl overflow-hidden bg-slate-50 flex items-center justify-center">
              <img
                src={post.image_url}
                alt={post.title}
                className="w-full h-auto max-h-[400px] md:max-h-[500px] object-contain"
              />
            </div>
          )}

          {/* 🚨 REPAIRED RICH TEXT CONTENT RENDERER 🚨 */}
          {/* Added strict !max-w-full and !h-auto to force Quill images to stay inside mobile bounds */}
          <div
            className="
            w-full break-words text-base md:text-lg text-slate-700 leading-relaxed font-medium
            [&_p]:mb-6 
            [&_h1]:text-3xl [&_h1]:font-black [&_h1]:text-slate-900 [&_h1]:mt-10 [&_h1]:mb-5
            [&_h2]:text-2xl [&_h2]:md:text-3xl [&_h2]:font-black [&_h2]:text-slate-900 [&_h2]:mt-12 [&_h2]:mb-6 [&_h2]:tracking-tight
            [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-slate-900 [&_h3]:mt-10 [&_h3]:mb-4 
            [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-8 [&_ul_li]:mb-2 [&_ul_li]:pl-2
            [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-8 [&_ol_li]:mb-2 [&_ol_li]:pl-2
            [&_strong]:text-slate-900 [&_strong]:font-bold
            [&_a]:text-[#f80d5d] [&_a]:underline [&_a]:break-all
            [&_img]:!max-w-full [&_img]:!w-auto [&_img]:!h-auto [&_img]:object-contain [&_img]:rounded-2xl [&_img]:mx-auto [&_img]:my-8 [&_img]:shadow-md
          "
            dangerouslySetInnerHTML={{ __html: cleanContent }}
          />

          {/* BOTTOM CTA */}
          <div className="mt-16 pt-12 border-t border-slate-200 text-center bg-[#fafafa] rounded-3xl p-8 lg:p-12 border border-slate-200">
            <h3 className="text-2xl font-black text-slate-900 mb-4">
              Ready to implement these strategies?
            </h3>
            <p className="text-slate-600 mb-8 max-w-md mx-auto">
              Let our AI technology handle the growth while you focus on
              creating amazing content.
            </p>
            <Link
              to="/#pricing"
              className="inline-block bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] text-white px-8 py-4 rounded-xl font-black text-sm hover:opacity-90 transition-opacity shadow-lg shadow-[#ff2429]/20"
            >
              Start your growth today
            </Link>
          </div>
        </article>
      </main>
    </>
  );
}

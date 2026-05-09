import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import SEO from "../components/SEO";
import { supabase } from "../lib/supabase";

export default function Blog() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      const { data, error } = await supabase
        .from("blogs")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching blogs:", error);
      } else if (data) {
        setPosts(data);
      }
      setLoading(false);
    };

    fetchPosts();
  }, []);

  if (loading) {
    return (
      <>
        <SEO
          title="Instagram Growth Blog | Virallized"
          description="Read the Virallized blog for Instagram growth strategies, social media tips, audience-building advice, and organic follower growth insights."
          path="/blog"
        />

        <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-[#f80d5d] rounded-full animate-spin"></div>
        </div>
      </>
    );
  }

  const featuredPost = posts[0];
  const standardPosts = posts.slice(1);

  return (
    <>
      <SEO
        title="Instagram Growth Blog | Virallized"
        description="Read the Virallized blog for Instagram growth strategies, social media tips, audience-building advice, and organic follower growth insights."
        path="/blog"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "Blog",
          name: "Virallized Blog",
          url: "https://www.virallized.com/blog",
          description:
            "Instagram growth strategies, social media tips, audience-building advice, and organic follower growth insights from Virallized.",
          publisher: {
            "@type": "Organization",
            name: "Virallized",
            logo: {
              "@type": "ImageObject",
              url: "https://www.virallized.com/images/logos/virallized-main-logo.svg",
            },
          },
        }}
      />

      <main className="min-h-screen bg-[#fafafa] pb-24 selection:bg-[#ffefe9] selection:text-[#f80d5d] flex flex-col">
        {/* CUSTOM NAV / HEADER */}
        <nav className="bg-white border-b border-slate-200 shrink-0">
          <div className="container mx-auto px-6 py-5 flex justify-between items-center max-w-[90rem]">
            {/* Top Left: Logo (Increased size by ~15%) */}
            <Link to="/" className="w-28 lg:w-36 flex justify-start">
              <img
                src="/images/logos/virallized-main-logo.svg"
                alt="Virallized Logo"
                className="w-full h-auto object-contain"
              />
            </Link>

            {/* Top Right: Button */}
            <Link
              to="/#pricing"
              className="flex-1 lg:flex-none text-center bg-gradient-to-r from-[#ffae07] from-[0%] via-[#ff2429] via-[25%] to-[#f1078d] to-[85%] text-white px-6 py-4 lg:px-5 lg:py-2.5 rounded-xl font-bold text-[14px] lg:text-[11px] hover:opacity-90 transition-opacity shadow-lg whitespace-nowrap"
            >
              Start My Growth
            </Link>
          </div>
        </nav>

        {/* BLOG HEADER SECTION */}
        <section className="bg-white border-b border-slate-200 pt-16 pb-12 lg:pt-24 lg:pb-16">
          <div className="container mx-auto px-6 max-w-6xl text-center">
            <div className="inline-block font-bold text-[11px] lg:text-xs uppercase tracking-wider mb-4">
              📚{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d]">
                Virallized Blog
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight mb-6">
              Insights for massive growth.
            </h1>
            <p className="text-slate-500 text-base md:text-lg max-w-2xl mx-auto font-medium">
              Learn the latest strategies, algorithm updates, and secrets to
              building a hyper-engaged audience on Instagram.
            </p>
          </div>
        </section>

        <div className="container mx-auto px-6 max-w-6xl mt-12 lg:mt-16">
          {/* NO POSTS FALLBACK */}
          {posts.length === 0 && (
            <div className="text-center py-20">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">
                No articles yet!
              </h3>
              <p className="text-slate-500">
                Check back soon for our latest content.
              </p>
            </div>
          )}

          {/* FEATURED POST (Latest) */}
          {featuredPost && (
            <Link
              to={`/blog/${featuredPost.slug}`}
              className="block mb-12 lg:mb-16 group"
            >
              <div className="bg-white rounded-[2rem] overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col md:flex-row">
                <div className="w-full md:w-1/2 lg:w-3/5 h-64 md:h-auto relative overflow-hidden">
                  <img
                    src={
                      featuredPost.image_url || "/images/blog/placeholder.jpg"
                    }
                    alt={featuredPost.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
                <div className="w-full md:w-1/2 lg:w-2/5 p-8 lg:p-12 flex flex-col justify-center">
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-bold mb-4 uppercase tracking-wider">
                    <span className="text-[#f80d5d]">Featured</span> •{" "}
                    {new Date(featuredPost.created_at).toLocaleDateString(
                      undefined,
                      {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      },
                    )}
                  </div>
                  <h2 className="text-2xl lg:text-3xl font-black text-slate-900 mb-4 group-hover:text-[#f80d5d] transition-colors leading-tight">
                    {featuredPost.title}
                  </h2>
                  <p className="text-slate-600 text-sm lg:text-base leading-relaxed mb-8">
                    {featuredPost.excerpt}
                  </p>
                  <div className="text-[#f80d5d] font-bold text-sm flex items-center gap-2 mt-auto">
                    Read Article{" "}
                    <span className="text-lg group-hover:translate-x-1 transition-transform">
                      →
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* STANDARD POSTS GRID */}
          {standardPosts.length > 0 && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {standardPosts.map((post) => (
                <Link key={post.id} to={`/blog/${post.slug}`} className="group">
                  <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 h-full flex flex-col">
                    <div className="w-full h-48 overflow-hidden relative">
                      <img
                        src={post.image_url || "/images/blog/placeholder.jpg"}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    </div>
                    <div className="p-6 flex flex-col flex-1">
                      <div className="text-[11px] text-slate-500 font-bold mb-3 uppercase tracking-wider">
                        {new Date(post.created_at).toLocaleDateString(
                          undefined,
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          },
                        )}
                      </div>
                      <h3 className="text-lg font-black text-slate-900 mb-3 group-hover:text-[#f80d5d] transition-colors leading-snug">
                        {post.title}
                      </h3>
                      <p className="text-slate-600 text-sm leading-relaxed mb-6 line-clamp-3">
                        {post.excerpt}
                      </p>
                      <div className="text-[#f80d5d] font-bold text-[13px] flex items-center gap-1.5 mt-auto">
                        Read More{" "}
                        <span className="group-hover:translate-x-1 transition-transform">
                          →
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}

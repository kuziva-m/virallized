import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// Helper for formatting large numbers (e.g. 1500 -> 1.5K)
const formatNum = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
};

// Helper for small engagement rates so 0.03% does not display as 0.0%
const formatEngagementRate = (rate: number) => {
  if (!Number.isFinite(rate)) return "0.00";

  if (rate > 0 && rate < 0.1) {
    return rate.toFixed(2);
  }

  if (rate < 1) {
    return rate.toFixed(2);
  }

  return rate.toFixed(1);
};

const isValidEmail = (value: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
};

const ANALYZED_POST_LIMIT = 3;

const LandingPage = () => {
  const [isAnnual, setIsAnnual] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentReview, setCurrentReview] = useState(0);

  // 🚨 ANALYZE TOOL STATES 🚨
  const [analyzeHandle, setAnalyzeHandle] = useState("");
  const [analyzeEmail, setAnalyzeEmail] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState("");
  const [analyzeResults, setAnalyzeResults] = useState<{
    handle: string;
    email: string;
    image: string;
    followersRaw: number;
    followersFormatted: string;
    avgLikes: string;
    avgComments: string;
    engagementRate: string;
    lostEngagement: string;
    projectedWithUs: string;
    projectedWithoutUs: string;
    gainWithUs: string;
    gainWithoutUs: string;
    posts: { url: string; likes: number; isTop: boolean }[];
    chartData: any[]; // 🚨 ADDED THIS LINE TO FIX THE ERROR 🚨
  } | null>(null);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const faqs = [
    {
      q: "How quickly will I start seeing followers?",
      a: "You’ll typically start seeing new followers within 24–72 hours of signing up. Growth ramps up gradually, and most accounts reach full speed within the first 5–7 days, depending on targeting and account activity.",
    },
    {
      q: "Are there any risks in using Virallized?",
      a: "No. Account safety is our top priority. Since 2017, we’ve helped thousands of clients grow on Instagram using organic methods, and none of our clients’ accounts have ever been put at risk. We don’t use bots, fake followers, or aggressive tactics — just real exposure to the right audience.",
    },
    {
      q: "How does Virallized actually grow my Instagram?",
      a: "Virallized works by promoting your profile to real users who are already interested in your niche, content, or industry. This increases genuine discovery and profile visits, allowing people to follow you organically because they’re genuinely interested — not because they were forced or incentivized.",
    },
    {
      q: "Are the followers I gain real people?",
      a: "Yes — every follower gained through Virallized is a real Instagram user. We don’t use bots, fake accounts, or purchased followers. Our system focuses on real exposure, which means the people who follow you do so by choice.",
    },
    {
      q: "Can I choose who my account is targeted to?",
      a: "Absolutely. Your growth is fully tailored to your goals. You can specify niches, locations, interests, competitor accounts, and audience types so your account is shown to people who are most likely to engage with your content.",
    },
    {
      q: "Is Virallized suitable for my type of account?",
      a: "Virallized works for creators, businesses, brands, and personal accounts across a wide range of niches. As long as your profile has content and a clear theme, our targeting can be adjusted to reach people who are genuinely interested in what you offer.",
    },
    {
      q: "Do you post content or send messages on my behalf?",
      a: "No. Virallized never posts content, comments, or sends DMs on your behalf. Your content, voice, and interactions remain 100% yours — we simply help the right people discover your account organically.",
    },
  ];

  // Auto-scroll logic for the reviews carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentReview((prev) => (prev < 5 ? prev + 1 : 0));
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  // 🚨 ADVANCED RAPID-API FETCH LOGIC (PROFILE + POSTS) 🚨
  const handleAnalyzeAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanEmail = analyzeEmail.trim().toLowerCase();

    if (!analyzeHandle.trim() || !cleanEmail) return;

    if (!isValidEmail(cleanEmail)) {
      setAnalyzeResults(null);
      setAnalyzeError(
        "Please enter a valid email address before analyzing your account.",
      );
      return;
    }

    setIsAnalyzing(true);
    setAnalyzeError("");
    setAnalyzeResults(null);

    let cleanHandle = analyzeHandle.trim();

    if (cleanHandle.includes("instagram.com/")) {
      cleanHandle = cleanHandle
        .split("instagram.com/")[1]
        .split("?")[0]
        .split("#")[0]
        .replace(/\//g, "")
        .trim();
    } else {
      cleanHandle = cleanHandle.replace(/^@/, "").trim();
    }

    const toNumber = (value: unknown): number => {
      if (typeof value === "number" && Number.isFinite(value)) return value;
      if (typeof value === "string") {
        const cleaned = value.replace(/,/g, "").trim();
        const parsed = Number(cleaned);
        return Number.isFinite(parsed) ? parsed : 0;
      }
      return 0;
    };

    const toArray = (value: any): any[] => {
      if (!value) return [];
      if (Array.isArray(value)) return value;
      if (typeof value === "object") return Object.values(value);
      return [];
    };

    const getFirstValue = (source: any, paths: string[]): any => {
      for (const path of paths) {
        const value = path
          .split(".")
          .reduce((current, key) => current?.[key], source);

        if (value !== undefined && value !== null && value !== "") {
          return value;
        }
      }

      return undefined;
    };

    const findFirstImageUrl = (item: any): string => {
      const directUrl = getFirstValue(item, [
        "thumbnail_url",
        "thumbnail_src",
        "display_url",
        "media_url",
        "image_url",
        "cover_frame_url",
        "video_url",
        "image_versions2.candidates.0.url",
        "image_versions2.additional_candidates.first_frame.url",
        "image_versions2.additional_candidates.igtv_first_frame.url",
        "carousel_media.0.image_versions2.candidates.0.url",
        "carousel_media.0.thumbnail_url",
        "carousel_media.0.display_url",
        "video_versions.0.url",
        "node.thumbnail_src",
        "node.display_url",
        "node.thumbnail_url",
      ]);

      if (typeof directUrl === "string" && directUrl.startsWith("http")) {
        return directUrl;
      }

      const seen = new Set<any>();
      const queue = [item];

      while (queue.length > 0) {
        const current = queue.shift();
        if (!current || typeof current !== "object" || seen.has(current))
          continue;
        seen.add(current);

        for (const value of Object.values(current)) {
          if (typeof value === "string" && value.startsWith("http")) {
            const lower = value.toLowerCase();
            const looksLikeMedia =
              lower.includes("cdninstagram") ||
              lower.includes("fbcdn") ||
              lower.includes("scontent") ||
              lower.includes(".jpg") ||
              lower.includes(".jpeg") ||
              lower.includes(".png") ||
              lower.includes(".webp") ||
              lower.includes(".mp4");

            if (looksLikeMedia) return value;
          }

          if (value && typeof value === "object") {
            queue.push(value);
          }
        }
      }

      return "";
    };

    const extractPosts = (
      postsData: any,
      profileData: any,
      userObj: any,
    ): any[] => {
      const possibleSources = [
        postsData?.data?.items,
        postsData?.items,
        postsData?.data?.posts,
        postsData?.posts,
        postsData?.data?.media,
        postsData?.media,
        postsData?.data?.edges,
        postsData?.edges,
        postsData?.data,
        postsData?.data?.user?.edge_owner_to_timeline_media?.edges,
        postsData?.user?.edge_owner_to_timeline_media?.edges,
        postsData?.data?.user?.timeline_media?.edges,
        postsData?.data?.user?.media?.edges,
        profileData?.data?.user?.edge_owner_to_timeline_media?.edges,
        profileData?.user?.edge_owner_to_timeline_media?.edges,
        userObj?.edge_owner_to_timeline_media?.edges,
      ];

      for (const source of possibleSources) {
        const array = toArray(source)
          .map((entry: any) => entry?.node ?? entry)
          .filter((entry: any) => entry && typeof entry === "object");

        const likelyPosts = array.filter((entry: any) => {
          const hasEngagement =
            entry?.like_count !== undefined ||
            entry?.likes_count !== undefined ||
            entry?.likes !== undefined ||
            entry?.comment_count !== undefined ||
            entry?.comments_count !== undefined ||
            entry?.comments !== undefined ||
            entry?.edge_media_preview_like?.count !== undefined ||
            entry?.edge_liked_by?.count !== undefined ||
            entry?.edge_media_to_comment?.count !== undefined;

          const hasMedia = Boolean(findFirstImageUrl(entry));

          return hasEngagement || hasMedia;
        });

        if (likelyPosts.length > 0) return likelyPosts;
      }

      return [];
    };

    try {
      const rapidApiKey = import.meta.env.VITE_RAPIDAPI_KEY;

      if (!rapidApiKey) {
        throw new Error(
          "Missing RapidAPI key. Add VITE_RAPIDAPI_KEY to your .env file.",
        );
      }

      const headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        "x-rapidapi-host": "instagram-scraper-stable-api.p.rapidapi.com",
        "x-rapidapi-key": rapidApiKey,
      };

      const [profileRes, postsRes] = await Promise.all([
        fetch(
          "https://instagram-scraper-stable-api.p.rapidapi.com/ig_get_fb_profile_v3.php",
          {
            method: "POST",
            headers,
            body: new URLSearchParams({
              username_or_url: cleanHandle,
            }),
          },
        ),
        fetch(
          "https://instagram-scraper-stable-api.p.rapidapi.com/get_ig_user_posts.php",
          {
            method: "POST",
            headers,
            body: new URLSearchParams({
              username_or_url: cleanHandle,
              amount: String(ANALYZED_POST_LIMIT),
            }),
          },
        ),
      ]);

      const parseResponse = async (res: Response, endpointName: string) => {
        const text = await res.text();

        if (!res.ok) {
          console.error(`${endpointName} failed:`, res.status, text);
          throw new Error(
            `${endpointName} failed with status ${res.status}. Check RapidAPI logs.`,
          );
        }

        try {
          const json = JSON.parse(text);
          console.log(`${endpointName} response:`, json);
          return json;
        } catch {
          console.error(`${endpointName} returned non-JSON response:`, text);
          throw new Error(`${endpointName} returned an invalid response.`);
        }
      };

      const profileData = await parseResponse(profileRes, "Profile API");
      const postsData = await parseResponse(postsRes, "Posts API");

      const userObj =
        profileData?.data?.user ||
        profileData?.data?.data?.user ||
        profileData?.data ||
        profileData?.user ||
        profileData?.graphql?.user ||
        profileData;

      const followerCount = toNumber(
        userObj?.follower_count ??
          userObj?.followers_count ??
          userObj?.followers ??
          userObj?.edge_followed_by?.count ??
          userObj?.edge_followed_by_count ??
          userObj?.data?.follower_count ??
          userObj?.data?.followers,
      );

      const profilePicUrl =
        userObj?.profile_pic_url_hd ||
        userObj?.profile_pic_url ||
        userObj?.hd_profile_pic_url_info?.url ||
        userObj?.profile_pic_url_hd_proxy ||
        userObj?.profile_pic_url_proxy ||
        "";

      if (!followerCount && !profilePicUrl) {
        console.error(
          "Profile API response did not contain usable profile data:",
          profileData,
        );
        throw new Error(
          "Could not get real profile data for this username. The account may be private, restricted, or the RapidAPI endpoint did not return the expected data.",
        );
      }

      const itemsList = extractPosts(postsData, profileData, userObj);

      const hasUsablePosts = itemsList.length > 0;

      if (!hasUsablePosts) {
        console.warn(
          "Profile data loaded, but no usable recent posts were found. Rendering profile and projection only.",
          postsData,
        );
      }

      let totalLikes = 0;
      let totalComments = 0;
      let maxLikes = -1;
      let topPostIndex = -1;

      const recentPosts = itemsList
        .slice(0, ANALYZED_POST_LIMIT)
        .map((element: any, idx: number) => {
          const item = element?.node ? element.node : element;

          const likes = toNumber(
            item?.like_count ??
              item?.likes_count ??
              item?.likes ??
              item?.edge_media_preview_like?.count ??
              item?.edge_liked_by?.count ??
              item?.preview_like_count,
          );

          const comments = toNumber(
            item?.comment_count ??
              item?.comments_count ??
              item?.comments ??
              item?.edge_media_to_comment?.count,
          );

          totalLikes += likes;
          totalComments += comments;

          if (likes > maxLikes) {
            maxLikes = likes;
            topPostIndex = idx;
          }

          return {
            url: findFirstImageUrl(item),
            likes,
            isTop: false,
          };
        });

      if (topPostIndex !== -1 && recentPosts[topPostIndex]) {
        recentPosts[topPostIndex].isTop = true;
      }

      const validPostCount = recentPosts.length;

      const avgLikesNum =
        validPostCount > 0 ? Math.floor(totalLikes / validPostCount) : 0;

      const avgCommentsNum =
        validPostCount > 0 ? Math.floor(totalComments / validPostCount) : 0;

      const actualEngRate =
        followerCount > 0 && validPostCount > 0
          ? ((avgLikesNum + avgCommentsNum) / followerCount) * 100
          : 0;

      const top1Benchmark = 9.2;
      const leavingOnTable = Math.max(0, top1Benchmark - actualEngRate).toFixed(
        2,
      );

      const getOrganicAnnualRate = (
        followers: number,
        engagementRate: number,
      ) => {
        const baseRate =
          followers < 1000
            ? 0.18
            : followers < 10000
              ? 0.12
              : followers < 50000
                ? 0.08
                : followers < 250000
                  ? 0.045
                  : followers < 1000000
                    ? 0.03
                    : 0.02;

        const engagementAdjustment =
          engagementRate >= 3
            ? 0.02
            : engagementRate >= 1
              ? 0.01
              : engagementRate >= 0.3
                ? 0
                : engagementRate > 0
                  ? -0.01
                  : -0.015;

        return Math.max(0.01, baseRate + engagementAdjustment);
      };

      const getVirallizedMonthlyGrowth = (
        followers: number,
        engagementRate: number,
        hasPosts: boolean,
      ) => {
        // Match the projection to the real pricing bands:
        // Standard: 150-500/mo, Pro: 250-1,000/mo,
        // Max: 500-2,000/mo, Managed: 750-3,000/mo.
        const planRange =
          followers < 5000
            ? { min: 150, max: 500 }
            : followers < 25000
              ? { min: 250, max: 1000 }
              : followers < 100000
                ? { min: 500, max: 2000 }
                : { min: 750, max: 3000 };

        const engagementScore = !hasPosts
          ? 0.2
          : engagementRate >= 5
            ? 0.95
            : engagementRate >= 3
              ? 0.8
              : engagementRate >= 1
                ? 0.62
                : engagementRate >= 0.3
                  ? 0.45
                  : engagementRate > 0
                    ? 0.28
                    : 0.2;

        const followerSizeScore = Math.min(
          1,
          Math.max(0, (Math.log10(Math.max(followers, 10)) - 2) / 4),
        );

        const blendedScore = engagementScore * 0.7 + followerSizeScore * 0.3;
        const estimatedMonthlyGrowth = Math.round(
          planRange.min + (planRange.max - planRange.min) * blendedScore,
        );

        return Math.min(
          planRange.max,
          Math.max(planRange.min, estimatedMonthlyGrowth),
        );
      };

      const organicAnnualRate = getOrganicAnnualRate(
        followerCount,
        actualEngRate,
      );
      const gainWithoutUsNum = Math.floor(followerCount * organicAnnualRate);
      const projectedWithoutUsNum = followerCount + gainWithoutUsNum;

      const monthlyVirallizedGrowth = getVirallizedMonthlyGrowth(
        followerCount,
        actualEngRate,
        hasUsablePosts,
      );
      const gainWithUsNum = monthlyVirallizedGrowth * 12;
      const projectedWithUsNum = followerCount + gainWithUsNum;

      const months = [
        "Month 1",
        "Month 2",
        "Month 3",
        "Month 4",
        "Month 5",
        "Month 6",
        "Month 7",
        "Month 8",
        "Month 9",
        "Month 10",
        "Month 11",
        "Month 12",
      ];

      const chartData = months.map((month, index) => {
        const progress = (index + 1) / 12;
        const withoutUsAtMonth = Math.floor(
          followerCount + gainWithoutUsNum * progress,
        );
        // Exponential-looking acceleration: slower early growth, much stronger separation later.
        const curveFactor = Math.pow(progress, 1.85);
        const withUsAtMonth = Math.floor(
          followerCount + gainWithUsNum * curveFactor,
        );

        return {
          name: month,
          "Without Virallized": withoutUsAtMonth,
          "With Virallized": withUsAtMonth,
        };
      });

      const proxiedImage = profilePicUrl
        ? `https://wsrv.nl/?url=${encodeURIComponent(profilePicUrl)}`
        : "";

      const formattedPosts = recentPosts.map((post: any) => ({
        ...post,
        url: post.url
          ? `https://wsrv.nl/?url=${encodeURIComponent(post.url)}`
          : "",
      }));

      const { error: analyzedAccountError } = await supabase
        .from("analyzed_accounts")
        .insert([
          {
            email: cleanEmail,
            ig_handle: cleanHandle,
            followers: followerCount,
            profile_image_url: profilePicUrl || null,
            avg_likes: avgLikesNum,
            avg_comments: avgCommentsNum,
            engagement_rate: Number(actualEngRate.toFixed(4)),
            projected_with_us: projectedWithUsNum,
            projected_without_us: projectedWithoutUsNum,
            gain_with_us: gainWithUsNum,
            gain_without_us: gainWithoutUsNum,
            posts_analyzed: validPostCount,
            has_posts: hasUsablePosts,
            source: "landing_page_analyzer",
          },
        ]);

      if (analyzedAccountError) {
        console.error(
          "Failed to save analyzed account lead:",
          analyzedAccountError,
        );
      }

      setAnalyzeResults({
        handle: cleanHandle,
        email: cleanEmail,
        image: proxiedImage,
        followersRaw: followerCount,
        followersFormatted: new Intl.NumberFormat().format(followerCount),
        avgLikes: formatNum(avgLikesNum),
        avgComments: formatNum(avgCommentsNum),
        engagementRate: formatEngagementRate(actualEngRate),
        lostEngagement: leavingOnTable,
        projectedWithUs: formatNum(projectedWithUsNum),
        projectedWithoutUs: formatNum(projectedWithoutUsNum),
        gainWithUs: formatNum(gainWithUsNum),
        gainWithoutUs: formatNum(gainWithoutUsNum),
        posts: formattedPosts,
        chartData,
      });
    } catch (err: any) {
      console.error("Analyze Error:", err);
      setAnalyzeError(
        err.message || "Could not analyze account. Please check the handle.",
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800 selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden">
      {/* 100VH HEADER & HERO WRAPPER */}
      <div className="bg-white min-h-screen lg:min-h-[calc(100vh-44px)] flex flex-col relative overflow-hidden pb-12 lg:pb-0">
        {/* SOLID BACKGROUND BLOCK WITH LOGO WATERMARK - SHIFTED RIGHT */}
        <div className="hidden lg:flex absolute inset-y-0 right-0 w-[30%] lg:w-[43%] bg-[#ffefe9] z-0 pointer-events-none overflow-hidden justify-center items-center lg:translate-x-[10%]">
          {/* FADED LOGO WATERMARK - SHIFTED RIGHT */}
          <div className="absolute w-[75%] max-w-[500px] translate-x-[10%] translate-y-[-20%]">
            <img
              src="/images/logos/shadow.svg"
              alt="Background Watermark"
              className="w-full h-auto"
            />
          </div>
        </div>

        {/* NAVBAR */}
        <nav className="container mx-auto px-6 lg:px-20 xl:px-24 py-4 flex justify-between items-center max-w-[90rem] relative z-50 shrink-0">
          <div className="flex items-center gap-10">
            {/* LOGO CONTAINER */}
            <Link to="/" className="w-[108px] md:w-[122px] lg:w-[135px]">
              <img
                src="/images/logos/virallized-main-logo.svg"
                alt="Virallized Logo"
                className="w-full h-auto"
              />
            </Link>
            {/* NAVIGATION LINKS - FONT INCREASED ~30% */}
            <div className="hidden md:flex gap-6 font-medium text-slate-600 text-[13px] lg:text-[14.5px]">
              <a
                href="#how-it-works"
                className="hover:text-blue-600 transition"
              >
                How it works
              </a>
              <a href="#pricing" className="hover:text-blue-600 transition">
                Pricing
              </a>
              <a href="/blog" className="hover:text-blue-600 transition">
                Blog
              </a>
              <a href="#pricing" className="hover:text-blue-600 transition">
                Get Started
              </a>
            </div>
          </div>

          {/* DESKTOP CTA BUTTON - FONT INCREASED ~30% */}
          <div className="hidden md:block">
            {window.location.pathname === "/" ? (
              <a
                href="#pricing"
                className="bg-gradient-to-r from-[#ffae07] from-[0%] via-[#ff2429] via-[25%] to-[#f1078d] to-[85%] text-white px-5 py-2.5 lg:px-6 lg:py-3 rounded-xl font-bold text-[13px] lg:text-[14.5px] hover:opacity-90 transition-opacity shadow-md"
              >
                Start My Growth
              </a>
            ) : (
              <Link
                to="/#pricing"
                className="bg-gradient-to-r from-[#ffae07] from-[0%] via-[#ff2429] via-[25%] to-[#f1078d] to-[85%] text-white px-5 py-2.5 lg:px-6 lg:py-3 rounded-xl font-bold text-[13px] lg:text-[14.5px] hover:opacity-90 transition-opacity shadow-md"
              >
                Start My Growth
              </Link>
            )}
          </div>

          {/* MOBILE HAMBURGER BUTTON */}
          <button
            className="md:hidden p-2 text-slate-900 hover:text-[#ff2429] transition-colors focus:outline-none"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle Menu"
          >
            {isMobileMenuOpen ? (
              <svg
                className="w-7 h-7"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="w-7 h-7"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M4 6h16M4 12h16m-7 6h7"
                />
              </svg>
            )}
          </button>

          {/* MOBILE MENU DROPDOWN */}
          {isMobileMenuOpen && (
            <div className="absolute top-full left-0 w-full bg-white/95 backdrop-blur-md shadow-2xl border-t border-slate-100 flex flex-col p-6 gap-6 md:hidden animate-in fade-in slide-in-from-top-4 duration-200">
              <a
                href="#how-it-works"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-slate-800 font-extrabold text-lg tracking-tight hover:text-[#ff2429] transition-colors"
              >
                How it works
              </a>
              <a
                href="#pricing"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-slate-800 font-extrabold text-lg tracking-tight hover:text-[#ff2429] transition-colors"
              >
                Pricing
              </a>
              <a
                href="/blog"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-slate-800 font-extrabold text-lg tracking-tight hover:text-[#ff2429] transition-colors"
              >
                Blog
              </a>
              <div className="h-px w-full bg-slate-100 my-1"></div>
              {window.location.pathname === "/" ? (
                <a
                  href="#pricing"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-center bg-gradient-to-r from-[#ffae07] from-[0%] via-[#ff2429] via-[25%] to-[#f1078d] to-[85%] text-white px-6 py-4 rounded-xl font-bold text-[15px] hover:opacity-90 transition-opacity shadow-lg"
                >
                  Start My Growth
                </a>
              ) : (
                <Link
                  to="/#pricing"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-center bg-gradient-to-r from-[#ffae07] from-[0%] via-[#ff2429] via-[25%] to-[#f1078d] to-[85%] text-white px-6 py-4 rounded-xl font-bold text-[15px] hover:opacity-90 transition-opacity shadow-lg"
                >
                  Start My Growth
                </Link>
              )}
            </div>
          )}
        </nav>

        {/* HERO SECTION */}
        <header className="flex-1 container mx-auto px-0 lg:px-20 xl:px-24 flex flex-col justify-center max-w-[90rem] relative z-10 py-12 lg:py-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-10">
            {/* TEXT CONTAINER - PERFECTLY VERTICALLY CENTERED BY FLEXBOX */}
            <div className="flex-1 text-center lg:text-left w-full lg:max-w-[460px] xl:max-w-[500px] mx-auto lg:mx-0 lg:translate-x-[10%]">
              {/* Account Managers Online Badge */}
              <div className="inline-flex items-center gap-2.5 bg-white px-4 py-2 lg:px-4 lg:py-2 rounded-full border border-slate-200 mb-6 lg:mb-5 shadow-sm relative mx-auto lg:mx-0">
                <div className="relative flex items-center justify-center h-2.5 w-2.5 rounded-full bg-green-100 border border-green-200">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                  </span>
                </div>
                <span className="text-[10px] lg:text-[10.5px] font-extrabold text-slate-800 tracking-wide uppercase">
                  Account Managers Online
                </span>
              </div>

              {/* Main Heading (UPDATED H1 FOR SEO) */}
              <h1 className="text-[2.6rem] md:text-5xl lg:text-[2.65rem] xl:text-[3rem] font-extrabold text-slate-900 leading-[1.15] mb-6 lg:mb-5 tracking-tight w-[90%] mx-auto lg:w-full lg:mx-0">
                Get{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d]">
                  Real
                </span>
                , Organic Instagram Followers
              </h1>

              {/* Subheading */}
              <p className="text-[15px] lg:text-[15px] text-slate-600 mb-8 lg:mb-6 leading-relaxed w-[90%] mx-auto lg:mx-0">
                Get as many as 3,000 real and targeted Instagram followers every
                month that actually like, comment, and engage with your content.
              </p>

              {/* Checks */}
              <div className="flex items-center justify-center lg:justify-start gap-6 lg:gap-5 mb-10 lg:mb-8 w-[90%] mx-auto lg:w-full lg:mx-0">
                <div className="flex items-center gap-2 lg:gap-2 font-bold text-[14px] lg:text-[13px] text-slate-700">
                  <img
                    src="/images/check.svg"
                    alt="Check"
                    className="w-5 h-5 lg:w-4 lg:h-4"
                  />
                  Not bots
                </div>
                <div className="flex items-center gap-2 lg:gap-2 font-bold text-[14px] lg:text-[13px] text-slate-700">
                  <img
                    src="/images/check.svg"
                    alt="Check"
                    className="w-5 h-5 lg:w-4 lg:h-4"
                  />
                  No fake followers
                </div>
              </div>

              {/* HERO CTA BUTTONS */}
              <div className="flex flex-col xl:flex-row items-center justify-center lg:justify-start gap-5 lg:gap-4 mb-12 lg:mb-10 w-[90%] mx-auto lg:w-full lg:mx-0">
                <div className="flex flex-row items-center justify-center lg:justify-start gap-3 w-full lg:w-auto">
                  {window.location.pathname === "/" ? (
                    <a
                      href="#pricing"
                      className="flex-1 lg:flex-none text-center bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] text-white px-6 py-4 lg:px-6 lg:py-3 rounded-xl font-bold text-[14px] lg:text-[13px] shadow-lg whitespace-nowrap"
                    >
                      Start My Growth
                    </a>
                  ) : (
                    <Link
                      to="/#pricing"
                      className="flex-1 lg:flex-none text-center bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] text-white px-6 py-4 lg:px-6 lg:py-3 rounded-xl font-bold text-[14px] lg:text-[13px] shadow-lg whitespace-nowrap"
                    >
                      Start My Growth
                    </Link>
                  )}
                  <a
                    href="#learn-more"
                    className="flex-1 lg:flex-none text-center bg-slate-900 text-white px-6 py-4 lg:px-6 lg:py-3 rounded-xl font-bold text-[14px] lg:text-[13px] shadow-md hover:bg-slate-800 transition-colors"
                  >
                    Learn More
                  </a>
                </div>
                {/* Trust Badge */}
                <div className="flex items-center gap-3 mt-2 xl:mt-0 xl:ml-3 bg-slate-50 xl:bg-transparent px-4 py-2 xl:p-0 rounded-xl border border-slate-100 xl:border-none">
                  <img
                    src="/images/trusted-by-group.avif"
                    alt="Trusted Users"
                    className="h-7 lg:h-7"
                  />
                  <div className="text-[10px] lg:text-[9px] font-bold text-slate-500 leading-tight text-left">
                    Trusted by
                    <br />
                    <span className="text-slate-900 text-[12px] lg:text-[11px]">
                      12,000+ users
                    </span>
                  </div>
                </div>
              </div>

              {/* Review Callout */}
              <div className="bg-white p-5 lg:p-4 rounded-2xl shadow-lg border border-slate-100 w-[90%] max-w-[360px] lg:max-w-[340px] flex items-start gap-4 lg:gap-3 relative mx-auto lg:mx-0 text-left">
                <img
                  src="/images/Erica-Henlyh.avif"
                  alt="Erica"
                  className="w-10 h-10 lg:w-9 lg:h-9 rounded-full shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2 mb-1 lg:mb-1">
                    <div className="font-bold text-slate-900 text-[13px] lg:text-[11px]">
                      Erica Henley
                    </div>
                    <img
                      src="/images/5stars.svg"
                      alt="5 Stars"
                      className="h-3 lg:h-2.5"
                    />
                  </div>
                  <p className="text-[12px] lg:text-[11px] text-slate-600 leading-relaxed">
                    Virallized got me{" "}
                    <span className="font-bold text-slate-900">
                      over 3K new followers
                    </span>{" "}
                    in my first month! 😍
                  </p>
                </div>
                <img
                  src="/images/decorations/confetti-small.svg"
                  className="absolute -bottom-4 -right-4 w-8 lg:w-7"
                  alt=""
                />
              </div>
            </div>

            {/* Mock iPhone */}
            <div className="hidden lg:flex flex-1 relative w-full lg:max-w-[28rem] xl:max-w-[32rem] mx-auto justify-start lg:translate-x-[20%] lg:translate-y-16 xl:translate-y-20 lg:scale-105 xl:scale-110 origin-bottom">
              <img
                src="/images/iphone-mockup-main.avif"
                alt="Mockup"
                className="w-full h-auto z-10 relative drop-shadow-2xl"
              />
            </div>
          </div>
        </header>
      </div>

      {/* BRAND LOGOS */}
      <section className="bg-white py-10 lg:py-12 border-t border-slate-100">
        <div className="container mx-auto px-6 max-w-5xl flex flex-wrap justify-center md:justify-between items-center gap-8 brightness-0 opacity-40 hover:opacity-60 transition-opacity duration-300">
          <img
            src="/images/entrepreneur-logo.svg"
            alt="Entrepreneur"
            className="h-5 lg:h-6"
          />
          <img src="/images/huff.svg" alt="HuffPost" className="h-5 lg:h-6" />
          <img
            src="/images/socialmedia.svg"
            alt="Social Media Today"
            className="h-5 lg:h-6"
          />
          <img src="/images/forbes.svg" alt="Forbes" className="h-5 lg:h-6" />
        </div>
      </section>

      {/* REVIEWS SECTION */}
      <section
        id="Reviews"
        className="py-20 lg:py-24 bg-[#fafafa] overflow-hidden"
      >
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="text-center mb-12 flex flex-col items-center">
            <img
              src="/images/Group10.svg"
              alt="Trust Badge"
              className="w-14 lg:w-16 mb-6"
            />
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 mb-6 tracking-tight">
              Don't just take our word for it
            </h2>
            <p className="text-lg lg:text-xl text-slate-600 max-w-2xl mx-auto">
              Over 12,000 clients trust Virallized and rave in reviews about us.
            </p>
          </div>

          <div className="relative max-w-4xl mx-auto">
            {/* CAROUSEL TRACK */}
            <div
              className="flex transition-transform duration-500 ease-in-out items-stretch"
              style={{ transform: `translateX(-${currentReview * 100}%)` }}
            >
              {[
                {
                  name: "@tonys_mma_corner",
                  count: "27.9K Followers",
                  img: "tonys_mma_corner.avif",
                  link: "https://www.trustpilot.com/reviews/66e1a30e6a5e4a178bb582c5",
                  text: "My experience has been great with Virallized. They have made good on all of their promises and they are easy to work with. Growing from scratch like I have on Instagram is tough by yourself. I know because I have tried. Virallized does the grunt for you so you don't have to worry about it - I just get to worry about making content and Virallized helped me build a following of real followers, not bot accounts. Definitely recommended if you are starting from scratch.",
                },
                {
                  name: "@erikagivens_art",
                  count: "4.6K Followers",
                  img: "erikagivens_art.avif",
                  link: "https://www.trustpilot.com/reviews/673ca91a93c0d26b15290133",
                  text: "As a busy artist, I don’t have time for marketing or networking on social media, and Virallized has genuinely made that part easy. The growth hasn’t felt random at all - the outreach has been clearly targeted to the artistic styles and themes I specified, and I’ve connected with real artists who actually engage with my work. If you’re an artist looking to get out of your bubble and gain exposure within your field, I’d absolutely recommend Virallized.",
                },
                {
                  name: "@thewellbeingchannel",
                  count: "38.3K Followers",
                  img: "thewellbeingchannel.avif",
                  link: "https://www.trustpilot.com/reviews/686cb21cb33813291e73da98",
                  text: "Virallized and their team have been very supportive in growing my Instagram and answered all my queries promptly. I would highly recommend their service to anyone looking to grow their Instagram without the usual stress or guesswork.",
                },
                {
                  name: "@_leilovesit",
                  count: "3.3K Followers",
                  img: "t3.avif",
                  link: "https://www.trustpilot.com/users/67f73d10959ac3801827cec6",
                  text: "Virallized has been such a helpful service in growing my Instagram organically. I’ve seen a steady increase in followers who are genuinely interested in my content and actually stick around—no bots, just real engagement.",
                },
                {
                  name: "@ashlie.m.smith",
                  count: "11.6K Followers",
                  img: "t1.avif",
                  link: "https://www.trustpilot.com/review/virallized.com",
                  text: "Thank you Virallized!!!! You are THE go-to for social media growth + engagement! I love the results I’ve seen with you! Smart, FAST & personable. Your company packs a powerful punch and you’ve got huge hearts.",
                },
                {
                  name: "@savnhale",
                  count: "104K Followers",
                  img: "t2.avif",
                  link: "https://www.trustpilot.com/review/virallized.com",
                  text: "I am so grateful to have found Virallized and their services! They helped me grow my account steadily and safely, and I felt comfortable trusting the process all the way through. I am excited for our future! Highly recommend.",
                },
              ].map((review, i) => (
                <div
                  key={i}
                  className="w-full h-full flex-shrink-0 px-2 lg:px-4 flex items-center justify-center"
                >
                  <a
                    href={review.link}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full block bg-white rounded-[2rem] p-8 md:p-12 border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col relative cursor-pointer"
                  >
                    <div className="absolute top-6 right-6 md:top-8 md:right-8 opacity-20">
                      <img
                        src="/images/trustpilot.svg"
                        alt="Trustpilot"
                        className="h-6 md:h-8"
                      />
                    </div>

                    <p className="text-base md:text-lg leading-relaxed text-slate-600 flex-1 mb-10 pr-4 mt-4">
                      "{review.text}"
                    </p>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-6">
                      <div className="flex items-center gap-4">
                        <img
                          src={`/images/${review.img}`}
                          alt={review.name}
                          className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover shadow-sm"
                        />
                        <div>
                          <div className="font-black text-slate-900 text-[15px] md:text-[17px]">
                            {review.name}
                          </div>
                          <div className="text-[13px] text-[#f80d5d] font-bold tracking-wide">
                            {review.count}
                          </div>
                        </div>
                      </div>
                    </div>
                  </a>
                </div>
              ))}
            </div>

            {/* CAROUSEL NAVIGATION ARROWS */}
            <button
              onClick={() =>
                setCurrentReview((prev) => (prev > 0 ? prev - 1 : 5))
              }
              className="absolute -left-2 md:-left-6 top-1/2 -translate-y-1/2 bg-white rounded-full p-3 md:p-4 shadow-lg border border-slate-100 text-slate-900 hover:text-[#f80d5d] hover:scale-110 transition-all z-10"
              aria-label="Previous Review"
            >
              <svg
                className="w-5 h-5 md:w-6 md:h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            <button
              onClick={() =>
                setCurrentReview((prev) => (prev < 5 ? prev + 1 : 0))
              }
              className="absolute -right-2 md:-right-6 top-1/2 -translate-y-1/2 bg-white rounded-full p-3 md:p-4 shadow-lg border border-slate-100 text-slate-900 hover:text-[#f80d5d] hover:scale-110 transition-all z-10"
              aria-label="Next Review"
            >
              <svg
                className="w-5 h-5 md:w-6 md:h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>

            {/* DOT INDICATORS */}
            <div className="flex justify-center gap-2 md:gap-3 mt-8">
              {[0, 1, 2, 3, 4, 5].map((idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentReview(idx)}
                  className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full transition-all duration-300 ${
                    currentReview === idx
                      ? "bg-gradient-to-r from-[#ffae07] to-[#f80d5d] w-6 md:w-8"
                      : "bg-slate-300 hover:bg-slate-400"
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trustpilot glow card */}
      <section className="px-6 py-12">
        <a
          href="https://www.trustpilot.com/review/virallized.com"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-green-500/10 hover:shadow-green-500/30 hover:-translate-y-1 transition-all duration-300 p-8 lg:py-12 lg:px-16 flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-16 w-full max-w-7xl mx-auto"
        >
          <h3 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight max-w-[320px] text-center lg:text-left leading-[1.15] shrink-0">
            We help people grow their Instagram fast
          </h3>
          <div className="flex flex-wrap justify-center lg:justify-between items-center gap-8 md:gap-10 lg:gap-4 flex-1 w-full">
            <img
              src="/images/insta.svg"
              alt="Insta"
              className="h-16 md:h-20 lg:h-24 object-contain"
            />
            <img
              src="/images/trustpilot.svg"
              alt="Trustpilot"
              className="h-16 md:h-20 lg:h-24 object-contain"
            />
            <img
              src="/images/badge-shield.svg"
              alt="Shield"
              className="h-16 md:h-20 lg:h-24 object-contain"
            />
            <img
              src="/images/badge-secure.svg"
              alt="Secure"
              className="h-16 md:h-20 lg:h-24 object-contain"
            />
          </div>
        </a>
      </section>

      {/* TESTIMONIALS / LEARN MORE */}
      <section
        id="learn-more"
        className="py-20 lg:py-24 bg-white border-y border-slate-200"
      >
        <div className="container mx-auto px-6 lg:px-20 xl:px-24 max-w-[90rem] flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          <div className="flex-1 text-left lg:translate-x-2">
            <h2 className="text-3xl md:text-4xl lg:text-[2.6rem] font-extrabold text-slate-900 mb-6 tracking-tight leading-[1.15]">
              Our unique approach grows your Instagram{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ffae07] from-[0%] via-[#ff2429] via-[25%] to-[#f1078d] to-[85%]">
                for you
              </span>{" "}
              so you can focus on your content
            </h2>
            <p className="text-sm lg:text-[15px] text-slate-600 mb-8 leading-relaxed max-w-xl">
              We work with you to identify the type of followers your account
              needs, and then specifically focus our work on that audience. The
              result is your profile gaining up to 3,000 new real and targeted
              followers every month that will actually engage with your content.
            </p>
            <div className="flex items-center gap-5">
              {window.location.pathname === "/" ? (
                <a
                  href="#pricing"
                  className="bg-gradient-to-r from-[#ffae07] from-[0%] via-[#ff2429] via-[25%] to-[#f1078d] to-[85%] text-white px-6 py-3 lg:px-7 lg:py-3.5 rounded-xl font-bold hover:opacity-90 transition-opacity shadow-md text-sm"
                >
                  Start My Growth
                </a>
              ) : (
                <Link
                  to="/#pricing"
                  className="bg-gradient-to-r from-[#ffae07] from-[0%] via-[#ff2429] via-[25%] to-[#f1078d] to-[85%] text-white px-6 py-3 lg:px-7 lg:py-3.5 rounded-xl font-bold hover:opacity-90 transition-opacity shadow-md text-sm"
                >
                  Start My Growth
                </Link>
              )}
              <div className="flex items-center gap-2 text-[13px] lg:text-sm font-bold text-slate-700">
                <img
                  src="/images/sheild.svg"
                  alt="Guarantee"
                  className="w-4 lg:w-5"
                />
                Results Guaranteed *
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-20 lg:py-24 bg-[#fafafa]">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="text-center mb-16 lg:mb-20">
            <div className="inline-block font-bold text-[15px] lg:text-[16px] uppercase tracking-wider mb-6">
              🚀{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ffae07] from-[0%] via-[#ff2429] via-[25%] to-[#f1078d] to-[85%]">
                Get up to 3,000 followers / month
              </span>
            </div>
            <h2 className="text-5xl md:text-[48px] lg:text-[63px] font-black text-slate-900 tracking-tight">
              How it works in 3 simple steps
            </h2>
          </div>

          <div className="space-y-6">
            {/* Step 1 */}
            <div className="bg-white rounded-3xl p-8 md:p-12 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-10 lg:gap-12">
              <div className="w-full md:w-1/2 flex justify-center">
                <img
                  src="/images/step1.svg"
                  alt="Find Target Audience"
                  className="w-full max-w-[280px] lg:max-w-sm"
                />
              </div>
              <div className="w-full md:w-1/2">
                <div className="bg-[#ffefe9] text-[#ffae07] w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center font-black text-[21px] lg:text-[24px] mb-5 lg:mb-6">
                  1
                </div>
                <h3 className="text-[26px] lg:text-[32px] font-bold text-slate-900 mb-3 lg:mb-4 flex items-center gap-2">
                  We find your target audience{" "}
                  <img
                    src="/images/confetti.svg"
                    className="w-6 lg:w-7"
                    alt=""
                  />
                </h3>
                <p className="text-[18px] lg:text-[21px] text-slate-600 mb-6 lg:mb-8 leading-relaxed">
                  With your help, we nail down the exact type of followers that
                  will benefit your page the most.
                </p>
                <div className="flex flex-row items-center gap-4">
                  {window.location.pathname === "/" ? (
                    <a
                      href="#pricing"
                      className="bg-gradient-to-r from-[#ffae07] from-[0%] via-[#ff2429] via-[25%] to-[#f1078d] to-[85%] text-white px-5 py-2.5 lg:px-6 lg:py-3 rounded-xl font-bold hover:opacity-90 transition-opacity text-[17px] lg:text-[18px] shadow-md whitespace-nowrap"
                    >
                      Start My Growth
                    </a>
                  ) : (
                    <Link
                      to="/#pricing"
                      className="bg-gradient-to-r from-[#ffae07] from-[0%] via-[#ff2429] via-[25%] to-[#f1078d] to-[85%] text-white px-5 py-2.5 lg:px-6 lg:py-3 rounded-xl font-bold hover:opacity-90 transition-opacity text-[17px] lg:text-[18px] shadow-md whitespace-nowrap"
                    >
                      Start My Growth
                    </Link>
                  )}
                  <div className="flex items-center gap-1.5 lg:gap-2 text-[15px] lg:text-[17px] font-bold text-slate-500">
                    <img
                      src="/images/sheild.svg"
                      alt="Guarantee"
                      className="w-4 lg:w-5 opacity-75"
                    />
                    Results Guaranteed *
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-3xl p-8 md:p-12 border border-slate-200 shadow-sm flex flex-col md:flex-row-reverse items-center gap-10 lg:gap-12">
              <div className="w-full md:w-1/2 flex justify-center">
                <img
                  src="/images/step2.avif"
                  alt="Get them to profile"
                  className="w-full max-w-[280px] lg:max-w-sm"
                />
              </div>
              <div className="w-full md:w-1/2">
                <div className="bg-[#ffefe9] text-[#ff2429] w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center font-black text-[21px] lg:text-[24px] mb-5 lg:mb-6">
                  2
                </div>
                <h3 className="text-[26px] lg:text-[32px] font-bold text-slate-900 mb-3 lg:mb-4 flex items-center gap-2">
                  We get them to your profile{" "}
                  <img
                    src="/images/icons/confetti-small.svg"
                    className="w-6 lg:w-7"
                    alt=""
                  />
                </h3>
                <p className="text-[18px] lg:text-[21px] text-slate-600 mb-6 lg:mb-8 leading-relaxed">
                  You’ll get thousands of new people seeing your page and
                  content, and what you have to offer.
                </p>
                <div className="flex flex-row items-center gap-4">
                  {window.location.pathname === "/" ? (
                    <a
                      href="#pricing"
                      className="bg-gradient-to-r from-[#ffae07] from-[0%] via-[#ff2429] via-[25%] to-[#f1078d] to-[85%] text-white px-5 py-2.5 lg:px-6 lg:py-3 rounded-xl font-bold hover:opacity-90 transition-opacity text-[17px] lg:text-[18px] shadow-md whitespace-nowrap"
                    >
                      Start My Growth
                    </a>
                  ) : (
                    <Link
                      to="/#pricing"
                      className="bg-gradient-to-r from-[#ffae07] from-[0%] via-[#ff2429] via-[25%] to-[#f1078d] to-[85%] text-white px-5 py-2.5 lg:px-6 lg:py-3 rounded-xl font-bold hover:opacity-90 transition-opacity text-[17px] lg:text-[18px] shadow-md whitespace-nowrap"
                    >
                      Start My Growth
                    </Link>
                  )}
                  <div className="flex items-center gap-1.5 lg:gap-2 text-[15px] lg:text-[17px] font-bold text-slate-500">
                    <img
                      src="/images/sheild.svg"
                      alt="Guarantee"
                      className="w-4 lg:w-5 opacity-75"
                    />
                    Results Guaranteed *
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-[#ffefe9]/40 rounded-3xl p-8 md:p-12 border border-[#ffefe9] shadow-sm flex flex-col md:flex-row items-center gap-10 lg:gap-12">
              <div className="w-full md:w-1/2 relative flex justify-center">
                <img
                  src="/images/step3.avif"
                  alt="Get real followers"
                  className="w-full max-w-[280px] lg:max-w-sm"
                />
              </div>
              <div className="w-full md:w-1/2">
                <div className="bg-[#ffefe9] text-[#f1078d] w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center font-black text-[21px] lg:text-[24px] mb-5 lg:mb-6">
                  3
                </div>
                <h3 className="text-[26px] lg:text-[32px] font-bold text-slate-900 mb-3 lg:mb-4 flex items-center gap-2">
                  You get up to 3,000 real followers every month{" "}
                  <img
                    src="/images/icons/confetti-small.svg"
                    className="w-6 lg:w-7"
                    alt=""
                  />
                </h3>
                <p className="text-[18px] lg:text-[21px] text-slate-600 mb-6 lg:mb-8 leading-relaxed">
                  Because the thousands of people seeing your page are within
                  your target audience, a lot of them will end up following you.
                </p>
                <div className="flex flex-row items-center gap-4">
                  {window.location.pathname === "/" ? (
                    <a
                      href="#pricing"
                      className="bg-gradient-to-r from-[#ffae07] from-[0%] via-[#ff2429] via-[25%] to-[#f1078d] to-[85%] text-white px-5 py-2.5 lg:px-6 lg:py-3 rounded-xl font-bold hover:opacity-90 transition-opacity text-[17px] lg:text-[18px] shadow-md whitespace-nowrap"
                    >
                      Start My Growth
                    </a>
                  ) : (
                    <Link
                      to="/#pricing"
                      className="bg-gradient-to-r from-[#ffae07] from-[0%] via-[#ff2429] via-[25%] to-[#f1078d] to-[85%] text-white px-5 py-2.5 lg:px-6 lg:py-3 rounded-xl font-bold hover:opacity-90 transition-opacity text-[17px] lg:text-[18px] shadow-md whitespace-nowrap"
                    >
                      Start My Growth
                    </Link>
                  )}
                  <div className="flex items-center gap-1.5 lg:gap-2 text-[15px] lg:text-[17px] font-bold text-slate-500">
                    <img
                      src="/images/sheild.svg"
                      alt="Guarantee"
                      className="w-4 lg:w-5 opacity-75"
                    />
                    Results Guaranteed *
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🚨 NEW: ANALYZE YOUR ACCOUNT SECTION 🚨 */}
      <section className="py-24 lg:py-32 bg-white relative overflow-hidden border-y border-slate-200">
        <div className="container mx-auto px-6 max-w-3xl relative z-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#f80d5d]/20 bg-[#f80d5d]/5 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-[#f80d5d] mb-6">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#f80d5d] shadow-[0_0_8px_rgba(248,13,93,0.8)]"></span>
            See your numbers
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-[3.5rem] font-black text-slate-900 tracking-tight leading-[1.1] mb-5">
            Analyze{" "}
            <span className="bg-brand-gradient bg-clip-text text-transparent bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d]">
              your
            </span>{" "}
            account.
          </h2>
          <p className="text-slate-500 text-[15px] lg:text-[17px] leading-[1.55] mb-8 max-w-lg mx-auto font-medium">
            Drop your email and Instagram handle. We'll show you exactly how
            your account could grow with us.
          </p>

          <form
            onSubmit={handleAnalyzeAccount}
            className="w-full max-w-[520px] mx-auto mb-4 flex flex-col gap-3"
          >
            <div className="relative flex w-full items-center bg-slate-50 border border-slate-200 rounded-full p-1.5 focus-within:border-[#ff2429]/50 focus-within:bg-white focus-within:shadow-lg focus-within:shadow-[#ff2429]/10 transition-all">
              <span className="pl-5 pr-2 text-[15px] font-bold text-slate-400 select-none">
                ✉
              </span>
              <input
                type="email"
                required
                value={analyzeEmail}
                onChange={(e) => setAnalyzeEmail(e.target.value)}
                placeholder="you@email.com"
                className="min-w-0 flex-1 bg-transparent text-slate-900 focus:outline-none placeholder:text-slate-400 font-bold py-3.5 px-1.5"
              />
            </div>

            <div className="relative flex w-full items-center bg-slate-50 border border-slate-200 rounded-full p-1.5 focus-within:border-[#ff2429]/50 focus-within:bg-white focus-within:shadow-lg focus-within:shadow-[#ff2429]/10 transition-all">
              <span className="pl-5 pr-1 text-[17px] font-bold text-slate-400 select-none">
                @
              </span>
              <input
                type="text"
                required
                value={analyzeHandle}
                onChange={(e) => setAnalyzeHandle(e.target.value)}
                placeholder="yourusername"
                className="min-w-0 flex-1 bg-transparent text-slate-900 focus:outline-none placeholder:text-slate-400 font-bold py-3.5 px-1.5"
              />
              <button
                type="submit"
                disabled={
                  isAnalyzing || !analyzeHandle.trim() || !analyzeEmail.trim()
                }
                className="shrink-0 bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] text-white px-4 sm:px-7 py-3.5 rounded-full font-bold text-sm hover:-translate-y-px disabled:translate-y-0 disabled:opacity-50 transition-all shadow-md flex items-center gap-2 whitespace-nowrap"
              >
                {isAnalyzing ? "Analyzing..." : "Analyze"}
                {!isAnalyzing && (
                  <svg
                    viewBox="0 0 24 24"
                    className="h-3.5 w-3.5 stroke-white"
                    fill="none"
                    strokeWidth="3"
                  >
                    <path d="M5 12h14M13 5l7 7-7 7"></path>
                  </svg>
                )}
              </button>
            </div>
          </form>

          <div className="mt-3.5 inline-flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <svg
              viewBox="0 0 24 24"
              className="h-3 w-3 stroke-slate-400"
              fill="none"
              strokeWidth="2.5"
            >
              <rect x="3" y="11" width="18" height="11" rx="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            No login required. Email is used only to follow up on your analysis.
          </div>

          {/* ERROR NOTIFICATION */}
          {analyzeError && (
            <div className="mt-8 bg-red-50 border border-red-200 text-red-600 p-4 rounded-2xl text-sm font-bold animate-in fade-in slide-in-from-bottom-2 max-w-[520px] mx-auto shadow-sm">
              {analyzeError}
            </div>
          )}
        </div>

        {/* RESULTS DASHBOARD */}
        {analyzeResults && !analyzeError && (
          <div className="container mx-auto px-6 max-w-4xl relative z-10 mt-16 animate-in fade-in slide-in-from-bottom-8">
            <div className="bg-white border border-slate-200 p-6 md:p-10 rounded-[32px] shadow-2xl shadow-slate-200/50 text-left">
              {/* Header */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10 pb-8 border-b border-slate-100">
                <div className="flex flex-col items-center md:items-start">
                  <h3 className="text-2xl font-black text-slate-900">
                    Your growth trajectory,
                  </h3>
                  <div className="text-2xl font-black bg-gradient-to-r from-[#ffae07] to-[#f80d5d] bg-clip-text text-transparent">
                    @{analyzeResults.handle}.
                  </div>
                  <p className="text-slate-500 font-medium mt-2 text-center md:text-left text-sm max-w-sm">
                    We analyzed your account. Here's what the next 12 months
                    look like with Virallized.
                  </p>
                </div>
                <div className="flex items-center gap-4 bg-slate-50 border border-slate-100 py-3 px-5 rounded-full">
                  <img
                    src={analyzeResults.image}
                    alt="Profile"
                    className="w-12 h-12 rounded-full object-cover border border-slate-200"
                  />
                  <div>
                    <div className="text-sm font-black text-slate-900">
                      @{analyzeResults.handle}
                    </div>
                    <div className="text-xs font-bold text-green-500 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>{" "}
                      Account analyzed
                    </div>
                  </div>
                </div>
              </div>

              {/* 3 Metric Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 flex flex-col justify-center">
                  <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1">
                    Your followers
                  </div>
                  <div className="text-3xl font-black text-slate-900">
                    {analyzeResults.followersFormatted}
                  </div>
                  <div className="text-xs font-bold text-slate-400 mt-2">
                    Today
                  </div>
                </div>
                <div className="bg-gradient-to-br from-[#fff6f8] to-[#fff1e6] border border-[#f80d5d]/20 rounded-2xl p-5 shadow-sm">
                  <div className="text-[11px] font-black uppercase tracking-wider text-[#f80d5d] mb-1">
                    With Virallized
                  </div>
                  <div className="text-3xl font-black text-slate-900">
                    {analyzeResults.projectedWithUs}
                  </div>
                  <div className="text-xs font-bold text-green-600 mt-2">
                    ↑ +{analyzeResults.gainWithUs} in 12 months
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
                  <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1">
                    Without us
                  </div>
                  <div className="text-3xl font-black text-slate-900">
                    {analyzeResults.projectedWithoutUs}
                  </div>
                  <div className="text-xs font-bold text-slate-400 mt-2">
                    ↑ +{analyzeResults.gainWithoutUs} in 12 months
                  </div>
                </div>
              </div>

              {/* Posts Grid & Engagement Details */}
              {analyzeResults.posts.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  {/* Recent Posts Grid */}
                  <div>
                    <h4 className="font-black text-slate-900 mb-1 text-lg">
                      Your recent posts
                    </h4>
                    <p className="text-xs font-bold text-slate-400 mb-6">
                      · 3 most recent · top performer highlighted
                    </p>

                    <div className="grid grid-cols-4 gap-2">
                      {analyzeResults.posts.map((post, idx) => (
                        <div
                          key={idx}
                          className={`aspect-square rounded-xl overflow-hidden relative ${post.isTop ? "ring-4 ring-[#ffae07] ring-offset-2" : ""}`}
                        >
                          {post.url ? (
                            <img
                              src={post.url}
                              alt={`Post ${idx}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400">
                              <svg
                                className="w-6 h-6 opacity-30"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                              </svg>
                            </div>
                          )}
                          {post.isTop && (
                            <div className="absolute bottom-0 left-0 right-0 bg-[#ffae07] text-white text-[9px] font-black text-center py-0.5 uppercase tracking-wider">
                              ★ Top
                            </div>
                          )}
                        </div>
                      ))}
                      {/* Fill empty spots if less than 3 posts */}
                      {Array.from({
                        length: Math.max(
                          0,
                          ANALYZED_POST_LIMIT - analyzeResults.posts.length,
                        ),
                      }).map((_, i) => (
                        <div
                          key={`empty-${i}`}
                          className="aspect-square bg-slate-100 rounded-xl border border-dashed border-slate-200"
                        ></div>
                      ))}
                    </div>
                  </div>

                  {/* Engagement Metrics */}
                  <div className="flex flex-col justify-between">
                    <div>
                      <h4 className="font-black text-slate-900 mb-1 text-lg">
                        Engagement reality check
                      </h4>
                      <p className="text-xs font-bold text-slate-400 mb-6">
                        · based on your last{" "}
                        {analyzeResults.posts.length > 0
                          ? analyzeResults.posts.length
                          : ANALYZED_POST_LIMIT}{" "}
                        posts
                      </p>

                      <div className="flex flex-col gap-4 mb-8">
                        <div className="flex justify-between items-center bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
                          <div>
                            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                              Your avg likes now
                            </div>
                            <div className="text-xs text-slate-400">
                              Per post · last {ANALYZED_POST_LIMIT}
                            </div>
                          </div>
                          <div className="text-xl font-black text-slate-900">
                            {analyzeResults.avgLikes}
                          </div>
                        </div>

                        <div className="flex justify-between items-center bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
                          <div>
                            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                              Your avg comments now
                            </div>
                            <div className="text-xs text-slate-400">
                              Per post · last {ANALYZED_POST_LIMIT}
                            </div>
                          </div>
                          <div className="text-xl font-black text-slate-900">
                            {analyzeResults.avgComments}
                          </div>
                        </div>

                        <div className="flex justify-between items-center bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
                          <div>
                            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                              Your engagement rate now
                            </div>
                            <div className="text-xs text-slate-400">
                              Account average
                            </div>
                          </div>
                          <div className="text-xl font-black text-slate-900">
                            {analyzeResults.engagementRate}%
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Benchmark */}
                    <div className="bg-[#fff1f2] border border-[#f80d5d]/20 p-5 rounded-2xl">
                      <p className="text-sm font-bold text-slate-700 mb-2">
                        You're leaving{" "}
                        <span className="text-[#f80d5d]">
                          {analyzeResults.lostEngagement}%
                        </span>{" "}
                        on the table.
                      </p>
                      <p className="text-xs font-medium text-slate-600 mb-4">
                        Top 1% of accounts your size average 9.2% engagement. We
                        help you close the gap.
                      </p>

                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-[10px] font-bold uppercase mb-1">
                            <span className="text-slate-500">You</span>
                            <span className="text-slate-700">
                              {analyzeResults.engagementRate}%
                            </span>
                          </div>
                          <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-slate-400 rounded-full"
                              style={{
                                width: `${Math.min(100, (parseFloat(analyzeResults.engagementRate) / 9.2) * 100)}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-[10px] font-bold uppercase mb-1">
                            <span className="text-[#f80d5d]">Top 1%</span>
                            <span className="text-[#f80d5d]">9.2%</span>
                          </div>
                          <div className="h-2 w-full bg-[#f80d5d]/20 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#f80d5d] rounded-full"
                              style={{ width: "100%" }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 🚨 NEW: RECHARTS LINE GRAPH 🚨 */}
              <div className="mt-12 pt-10 border-t border-slate-100">
                <h4 className="font-black text-slate-900 mb-6 text-xl text-center">
                  Projected 12-Month Growth Curve
                </h4>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={analyzeResults.chartData}
                      margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#f1f5f9"
                      />
                      <XAxis
                        dataKey="name"
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
                        domain={[
                          (dataMin: number) =>
                            Math.max(0, Math.floor(dataMin * 0.98)),
                          (dataMax: number) => Math.ceil(dataMax * 1.02),
                        ]}
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
                      <RechartsTooltip
                        contentStyle={{
                          borderRadius: "12px",
                          border: "none",
                          boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                          fontWeight: "bold",
                        }}
                      />
                      <Legend
                        iconType="circle"
                        wrapperStyle={{
                          paddingTop: "20px",
                          fontWeight: "bold",
                          fontSize: "14px",
                        }}
                      />
                      <Line
                        type="monotone"
                        name="With Virallized"
                        dataKey="With Virallized"
                        stroke="#f80d5d"
                        strokeWidth={4}
                        dot={false}
                        activeDot={{
                          r: 8,
                          fill: "#f80d5d",
                          stroke: "white",
                          strokeWidth: 2,
                        }}
                      />
                      <Line
                        type="monotone"
                        name="Without us"
                        dataKey="Without Virallized"
                        stroke="#94a3b8"
                        strokeWidth={3}
                        strokeDasharray="5 5"
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 🚨 UPDATED FINAL CTA 🚨 */}
              <div className="mt-12 text-center">
                {window.location.pathname === "/" ? (
                  <a
                    href="#pricing"
                    className="inline-flex bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] text-white px-8 py-4 rounded-full font-black text-sm hover:-translate-y-px transition-all shadow-[0_0_24px_rgba(255,36,41,0.3)] items-center gap-2"
                  >
                    Start your growth →
                  </a>
                ) : (
                  <Link
                    to="/#pricing"
                    className="inline-flex bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] text-white px-8 py-4 rounded-full font-black text-sm hover:-translate-y-px transition-all shadow-[0_0_24px_rgba(255,36,41,0.3)] items-center gap-2"
                  >
                    Start your growth →
                  </Link>
                )}
              </div>

              <div className="mt-6 mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-slate-50/80 px-5 py-3 text-center shadow-sm">
                <p className="text-[11px] sm:text-xs font-semibold leading-relaxed text-slate-400">
                  All figures are projections and not guarantees. Actual results
                  may vary based on your niche, content quality, posting
                  consistency, targeting, and account activity.
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-20 lg:py-24 bg-[#fafafa]">
        <div className="container mx-auto px-6 max-w-[90rem]">
          <div className="text-center mb-14 lg:mb-16">
            <div className="inline-block font-bold text-[15px] lg:text-[16px] uppercase tracking-wider mb-6">
              🚀{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ffae07] from-[0%] via-[#ff2429] via-[25%] to-[#f1078d] to-[85%]">
                Get up to 3,000 followers / month
              </span>
            </div>
            <h2 className="text-5xl md:text-[48px] lg:text-[63px] font-black text-slate-900 mb-8 tracking-tight">
              Affordable pricing, pick a plan for you
            </h2>

            {/* Custom Text Toggle */}
            <div className="flex items-center justify-center gap-6">
              <button
                onClick={() => setIsAnnual(true)}
                className={`text-[21px] lg:text-[24px] font-black tracking-wide transition-all ${
                  isAnnual
                    ? "text-transparent bg-clip-text bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d]"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                Annually
              </button>

              <div className="w-px h-6 bg-slate-300"></div>

              <button
                onClick={() => setIsAnnual(false)}
                className={`text-[21px] lg:text-[24px] font-black tracking-wide transition-all ${
                  !isAnnual
                    ? "text-transparent bg-clip-text bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d]"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                Monthly
              </button>
            </div>

            {/* Guarantee Text Underneath */}
            {isAnnual && (
              <div className="text-[15px] lg:text-[16px] font-medium text-slate-500 mt-4">
                60-day money back guarantee, prorated refund for unused time if
                unhappy
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {/* MANAGED PLAN */}
            <div className="bg-white rounded-3xl p-6 lg:p-7 border border-slate-200 shadow-sm flex flex-col">
              <div className="bg-slate-100 text-slate-600 text-[13px] lg:text-[15px] font-bold uppercase tracking-widest py-1.5 px-3 rounded-md self-start mb-4">
                Fully Managed
              </div>
              <h3 className="text-[26px] lg:text-[32px] font-black text-slate-900 mb-1">
                Managed
              </h3>
              <p className="text-slate-500 mb-6 font-medium text-[16px] lg:text-[17px]">
                750-3,000 Followers / Mo.*
              </p>

              <div className="flex items-baseline mb-2">
                <span className="text-5xl lg:text-[48px] font-black text-slate-900">
                  ${isAnnual ? "225" : "299"}
                </span>
                <span className="text-slate-500 font-medium ml-1 text-[16px] lg:text-[17px]">
                  /mo
                </span>
              </div>

              <div className="min-h-[3rem] mb-4">
                {isAnnual ? (
                  <>
                    <div className="text-[15px] lg:text-[16px] font-bold text-[#ff2429] mb-1">
                      Save 25%
                    </div>
                    <div className="text-[15px] lg:text-[16px] text-slate-500 font-medium">
                      $2,691 Paid Annually
                    </div>
                  </>
                ) : (
                  <div className="text-[15px] lg:text-[16px] text-slate-400 font-medium mt-1">
                    Paid Monthly
                  </div>
                )}
              </div>

              <ul className="space-y-3 lg:space-y-3.5 mb-8 flex-1">
                {[
                  "100% Organic Growth",
                  "Our Latest AI Technology",
                  "Real Followers (No Bots)",
                  "Increased Engagement",
                  "Personal Account Manager",
                  "Quick-Start Results",
                  "Optimize Account Daily",
                  "Priority Support",
                ].map((feature, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 text-[16px] lg:text-[17px] font-bold text-slate-700 leading-tight"
                  >
                    <img
                      src="/images/tick.svg"
                      alt="Check"
                      className="w-5 h-5 lg:w-5 lg:h-5 shrink-0"
                    />
                    {feature}
                  </li>
                ))}
              </ul>
              {/* MANAGED PLAN DYNAMIC STRIPE LINK */}
              <a
                href={
                  isAnnual
                    ? "https://buy.stripe.com/aEU5mc9yV6ZDgZq00g"
                    : "https://buy.stripe.com/9AQbKAaCZ6ZD4cE3cr"
                }
                className="w-full text-center bg-slate-100 text-slate-900 py-3.5 rounded-xl font-bold hover:bg-slate-200 transition-colors text-[17px] border border-slate-200"
              >
                Start my growth
              </a>
            </div>

            {/* MAX PLAN */}
            <div className="bg-white rounded-3xl p-6 lg:p-7 border border-slate-200 shadow-sm flex flex-col">
              <div className="bg-[#ffefe9] text-[#ff2429] text-[13px] lg:text-[15px] font-bold uppercase tracking-widest py-1.5 px-3 rounded-md self-start mb-4">
                Fastest Growth
              </div>
              <h3 className="text-[26px] lg:text-[32px] font-black text-slate-900 mb-1">
                Max
              </h3>
              <p className="text-slate-500 mb-6 font-medium text-[16px] lg:text-[17px]">
                500-2,000 Followers / Mo.*
              </p>

              <div className="flex items-baseline mb-2">
                <span className="text-5xl lg:text-[48px] font-black text-slate-900">
                  ${isAnnual ? "149" : "199"}
                </span>
                <span className="text-slate-500 font-medium ml-1 text-[16px] lg:text-[17px]">
                  /mo
                </span>
              </div>

              <div className="min-h-[3rem] mb-4">
                {isAnnual ? (
                  <>
                    <div className="text-[15px] lg:text-[16px] font-bold text-[#ff2429] mb-1">
                      Save 25%
                    </div>
                    <div className="text-[15px] lg:text-[16px] text-slate-500 font-medium">
                      $1,791 Paid Annually
                    </div>
                  </>
                ) : (
                  <div className="text-[15px] lg:text-[16px] text-slate-400 font-medium mt-1">
                    Paid Monthly
                  </div>
                )}
              </div>

              <ul className="space-y-3 lg:space-y-3.5 mb-8 flex-1">
                {[
                  "100% Organic Growth",
                  "Our Latest AI Technology",
                  "Real Followers (No Bots)",
                  "Increased Engagement",
                  "Personal Account Manager",
                  "Quick-Start Results",
                ].map((feature, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 text-[16px] lg:text-[17px] font-bold text-slate-700 leading-tight"
                  >
                    <img
                      src="/images/tick.svg"
                      alt="Check"
                      className="w-5 h-5 lg:w-5 lg:h-5 shrink-0"
                    />
                    {feature}
                  </li>
                ))}
              </ul>
              {/* MAX PLAN DYNAMIC STRIPE LINK */}
              <a
                href={
                  isAnnual
                    ? "https://buy.stripe.com/7sI3e48uR1Fj10s14b"
                    : "https://buy.stripe.com/6oE7uk7qN1Fj7oQ28d"
                }
                className="w-full text-center bg-slate-100 text-slate-900 py-3.5 rounded-xl font-bold hover:bg-slate-200 transition-colors text-[17px] border border-slate-200"
              >
                Start my growth
              </a>
            </div>

            {/* PRO PLAN (HIGHLIGHTED - FULL GRADIENT) */}
            <div className="bg-gradient-to-b from-[#ffae07] via-[#ff2429] to-[#f1078d] text-white rounded-3xl p-6 lg:p-7 shadow-xl flex flex-col transform lg:-translate-y-4 relative z-10 border border-white/20">
              <div className="bg-white/20 backdrop-blur-sm text-white text-[13px] lg:text-[15px] font-bold uppercase tracking-widest py-1.5 px-3 rounded-md self-start mb-4 shadow-sm border border-white/10">
                Most Popular
              </div>
              <h3 className="text-[26px] lg:text-[32px] font-black mb-1 text-white">
                Pro
              </h3>
              <p className="text-white/80 mb-6 font-medium text-[16px] lg:text-[17px]">
                250-1,000 Followers / Mo.*
              </p>

              <div className="flex items-baseline mb-2">
                <span className="text-5xl lg:text-[48px] font-black text-white">
                  ${isAnnual ? "112" : "149"}
                </span>
                <span className="text-white/80 font-medium ml-1 text-[16px] lg:text-[17px]">
                  /mo
                </span>
              </div>

              <div className="min-h-[3rem] mb-4">
                {isAnnual ? (
                  <>
                    <div className="text-[15px] lg:text-[16px] font-bold text-[#ffeb3b] mb-1">
                      Save 25%
                    </div>
                    <div className="text-[15px] lg:text-[16px] text-white/90 font-medium">
                      $1,341 Paid Annually
                    </div>
                  </>
                ) : (
                  <div className="text-[15px] lg:text-[16px] text-white/70 font-medium mt-1">
                    Paid Monthly
                  </div>
                )}
              </div>

              <ul className="space-y-3 lg:space-y-3.5 mb-8 flex-1">
                {[
                  "100% Organic Growth",
                  "Our Latest AI Technology",
                  "Real Followers (No Bots)",
                  "Increased Engagement",
                  "Personal Account Manager",
                  "Quick-Start Results",
                ].map((feature, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 text-[16px] lg:text-[17px] font-bold text-white leading-tight"
                  >
                    <svg
                      width="20"
                      height="16"
                      viewBox="0 0 21 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="text-white shrink-0 mt-0.5"
                    >
                      <path
                        d="M6.67368 12.6234L1.69528 7.64802L0 9.33035L6.67368 16L21 1.68233L19.3167 0L6.67368 12.6234Z"
                        fill="currentColor"
                      />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              {/* PRO PLAN DYNAMIC STRIPE LINK */}
              <a
                href={
                  isAnnual
                    ? "https://buy.stripe.com/28odSIh1n1Fj8sUfZ6"
                    : "https://buy.stripe.com/6oE7uk5iFdo14cEfYY"
                }
                className="w-full text-center bg-white text-[#ff2429] py-3.5 rounded-xl font-black hover:bg-slate-50 transition-colors text-[17px] shadow-lg"
              >
                Start my growth
              </a>
            </div>

            {/* STANDARD PLAN */}
            <div className="bg-white rounded-3xl p-6 lg:p-7 border border-slate-200 shadow-sm flex flex-col">
              <div className="bg-slate-100 text-slate-600 text-[13px] lg:text-[15px] font-bold uppercase tracking-widest py-1.5 px-3 rounded-md self-start mb-4">
                Most Affordable
              </div>
              <h3 className="text-[26px] lg:text-[32px] font-black text-slate-900 mb-1">
                Standard
              </h3>
              <p className="text-slate-500 mb-6 font-medium text-[16px] lg:text-[17px]">
                150-500 Followers / Mo.*
              </p>

              <div className="flex items-baseline mb-2">
                <span className="text-5xl lg:text-[48px] font-black text-slate-900">
                  ${isAnnual ? "75" : "99"}
                </span>
                <span className="text-slate-500 font-medium ml-1 text-[16px] lg:text-[17px]">
                  /mo
                </span>
              </div>

              <div className="min-h-[3rem] mb-4">
                {isAnnual ? (
                  <>
                    <div className="text-[15px] lg:text-[16px] font-bold text-[#ff2429] mb-1">
                      Save 25%
                    </div>
                    <div className="text-[15px] lg:text-[16px] text-slate-500 font-medium">
                      $891 Paid Annually
                    </div>
                  </>
                ) : (
                  <div className="text-[15px] lg:text-[16px] text-slate-400 font-medium mt-1">
                    Paid Monthly
                  </div>
                )}
              </div>

              <ul className="space-y-3 lg:space-y-3.5 mb-8 flex-1">
                {isAnnual
                  ? [
                      "100% Organic Growth",
                      "Real Followers (No Bots)",
                      "Increased Engagement",
                      "Personal Account Manager",
                      "Quick-Start Results",
                    ].map((feature, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2.5 text-[16px] lg:text-[17px] font-bold text-slate-700 leading-tight"
                      >
                        <img
                          src="/images/tick.svg"
                          alt="Check"
                          className="w-5 h-5 lg:w-5 lg:h-5 shrink-0"
                        />
                        {feature}
                      </li>
                    ))
                  : [
                      "100% Organic Growth",
                      "Real Followers (No Bots)",
                      "Increased Engagement",
                      "Email Support",
                    ].map((feature, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2.5 text-[16px] lg:text-[17px] font-bold text-slate-700 leading-tight"
                      >
                        <img
                          src="/images/tick.svg"
                          alt="Check"
                          className="w-5 h-5 lg:w-5 lg:h-5 shrink-0"
                        />
                        {feature}
                      </li>
                    ))}
              </ul>
              {/* STANDARD PLAN DYNAMIC STRIPE LINK */}
              <a
                href={
                  isAnnual
                    ? "https://buy.stripe.com/8wM8yo4eBfw9bF614d"
                    : "https://buy.stripe.com/aEUeWMbH3fw9cJa7st"
                }
                className="w-full text-center bg-slate-100 text-slate-900 py-3.5 rounded-xl font-bold hover:bg-slate-200 transition-colors text-[17px] border border-slate-200 mt-auto"
              >
                Start my growth
              </a>
            </div>
          </div>
          <p className="text-center text-slate-500 mt-10 text-[15px] lg:text-[16px] font-medium mb-12">
            * Listed growth figures based on avg. client results. Results may
            vary depending on your niche and content
          </p>
        </div>
      </section>

      {/* BLOG SECTION */}
      <section className="py-20 lg:py-24 bg-white border-y border-slate-200">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-end mb-10 lg:mb-12 gap-4">
            <div>
              <h2 className="text-[32px] md:text-5xl lg:text-[48px] font-black text-slate-900 tracking-tight">
                Explore Our{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d]">
                  Articles
                </span>{" "}
                and Insights.
              </h2>
            </div>
            <Link
              to="/blog"
              className="bg-slate-900 text-white px-5 py-2.5 lg:px-6 lg:py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors text-[17px] lg:text-[18px] whitespace-nowrap shadow-md"
            >
              View All Blogs
            </Link>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
            {/* LEFT: Featured Article */}
            <Link
              to="/blog/does-instagram-growth-actually-work-in-2026"
              className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm flex flex-col group cursor-pointer hover:shadow-md transition-shadow"
            >
              <img
                src="/images/b1.avif"
                alt="Does Instagram Growth Actually Work in 2026?"
                className="w-full h-56 lg:h-[300px] object-cover"
              />
              <div className="p-6 lg:p-8 flex flex-col flex-1">
                <div className="flex items-center gap-2 text-[15px] lg:text-[16px] text-slate-500 font-bold mb-3 uppercase tracking-wider">
                  <img
                    src="/images/calendar.png"
                    alt="Date"
                    className="w-4 lg:w-5"
                  />{" "}
                  January 02, 2026
                </div>
                <h3 className="text-[26px] lg:text-5xl font-black text-slate-900 mb-3 group-hover:text-[#f80d5d] transition-colors leading-tight">
                  Does Instagram Growth Actually Work in 2026?
                </h3>
                <p className="text-slate-600 text-[17px] lg:text-[18px] mb-6 leading-relaxed">
                  From Algorithm Myths to Real Growth: Instagram Strategies That
                  Work in 2026
                </p>
                <div className="text-[#f80d5d] font-bold text-[17px] lg:text-[18px] flex items-center gap-2 mt-auto">
                  Read More{" "}
                  <span className="text-xl lg:text-[24px] group-hover:translate-x-1 transition-transform">
                    →
                  </span>
                </div>
              </div>
            </Link>

            {/* RIGHT: Stacked Standard Articles */}
            <div className="flex flex-col gap-4 lg:gap-6">
              {/* Stacked Article 1 */}
              <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm flex flex-row items-center group cursor-pointer hover:shadow-md transition-shadow p-3 lg:p-4 gap-4 lg:gap-6">
                <img
                  src="/images/b2.avif"
                  alt="Is Organic Instagram Growth Better Than Ads?"
                  className="w-24 h-24 lg:w-32 lg:h-32 object-cover rounded-xl shrink-0"
                />
                <div className="flex flex-col justify-center py-2 pr-2">
                  <div className="flex items-center gap-2 text-[13px] lg:text-[15px] text-slate-500 font-bold mb-1.5 uppercase tracking-wider">
                    <img
                      src="/images/calendar.png"
                      alt="Date"
                      className="w-3.5 lg:w-4"
                    />{" "}
                    March 13, 2026
                  </div>
                  <h3 className="text-[18px] lg:text-[23px] font-black text-slate-900 mb-2 group-hover:text-[#f80d5d] transition-colors leading-snug">
                    Is Organic Instagram Growth Better Than Ads?
                  </h3>
                  <div className="text-[#f80d5d] font-bold text-[15px] lg:text-[17px] flex items-center gap-1.5">
                    Read More{" "}
                    <span className="text-[18px] lg:text-[21px]">→</span>
                  </div>
                </div>
              </div>

              {/* Stacked Article 2 */}
              <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm flex flex-row items-center group cursor-pointer hover:shadow-md transition-shadow p-3 lg:p-4 gap-4 lg:gap-6">
                <img
                  src="/images/b3.avif"
                  alt="How Long Does Instagram Growth Actually Take?"
                  className="w-24 h-24 lg:w-32 lg:h-32 object-cover rounded-xl shrink-0"
                />
                <div className="flex flex-col justify-center py-2 pr-2">
                  <div className="flex items-center gap-2 text-[13px] lg:text-[15px] text-slate-500 font-bold mb-1.5 uppercase tracking-wider">
                    <img
                      src="/images/calendar.png"
                      alt="Date"
                      className="w-3.5 lg:w-4"
                    />{" "}
                    March 13, 2026
                  </div>
                  <h3 className="text-[18px] lg:text-[23px] font-black text-slate-900 mb-2 group-hover:text-[#f80d5d] transition-colors leading-snug">
                    How Long Does Instagram Growth Actually Take?
                  </h3>
                  <div className="text-[#f80d5d] font-bold text-[15px] lg:text-[17px] flex items-center gap-1.5">
                    Read More{" "}
                    <span className="text-[18px] lg:text-[21px]">→</span>
                  </div>
                </div>
              </div>

              {/* Stacked Article 3 */}
              <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm flex flex-row items-center group cursor-pointer hover:shadow-md transition-shadow p-3 lg:p-4 gap-4 lg:gap-6">
                <img
                  src="/images/b4.avif"
                  alt="Instagram Growth Services Explained: What You Should Know"
                  className="w-24 h-24 lg:w-32 lg:h-32 object-cover rounded-xl shrink-0"
                />
                <div className="flex flex-col justify-center py-2 pr-2">
                  <div className="flex items-center gap-2 text-[13px] lg:text-[15px] text-slate-500 font-bold mb-1.5 uppercase tracking-wider">
                    <img
                      src="/images/calendar.png"
                      alt="Date"
                      className="w-3.5 lg:w-4"
                    />{" "}
                    March 13, 2026
                  </div>
                  <h3 className="text-[18px] lg:text-[23px] font-black text-slate-900 mb-2 group-hover:text-[#f80d5d] transition-colors leading-snug">
                    Instagram Growth Services Explained: What You Should Know
                  </h3>
                  <div className="text-[#f80d5d] font-bold text-[15px] lg:text-[17px] flex items-center gap-1.5">
                    Read More{" "}
                    <span className="text-[18px] lg:text-[21px]">→</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="py-20 lg:py-24 bg-[#fafafa]">
        <div className="container mx-auto px-6 max-w-3xl">
          <div className="text-center mb-12 lg:mb-16 flex flex-col items-center">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#ffefe9] text-[#f80d5d] mb-6 shadow-sm border border-[#fda6e1]/30">
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>

            <h2 className="text-5xl md:text-[48px] lg:text-[63px] font-black text-slate-900 mb-4 lg:mb-6 tracking-tight">
              Frequently asked questions
            </h2>
            <p className="text-[21px] lg:text-[24px] text-slate-600 max-w-xl mx-auto">
              Still have questions? Reach out to us on live chat or{" "}
              <a
                href="mailto:support@virallized.com"
                className="text-[#f80d5d] font-bold hover:underline transition-all"
              >
                email us
              </a>{" "}
              to get answers to questions not listed here.
            </p>
          </div>

          <div className="space-y-3 lg:space-y-4 border-t border-slate-200 pt-6 lg:pt-8">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="border-b border-slate-200 overflow-hidden"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full flex justify-between items-center py-4 lg:py-5 text-left transition-colors focus:outline-none group"
                >
                  <span
                    className={`text-[20px] lg:text-[21px] font-bold pr-8 transition-colors ${activeFaq === index ? "text-[#f80d5d]" : "text-slate-900 group-hover:text-[#f80d5d]"}`}
                  >
                    {faq.q}
                  </span>
                  <div
                    className={`w-8 h-8 lg:w-9 lg:h-9 rounded-full border flex items-center justify-center shrink-0 transition-all duration-300 ${
                      activeFaq === index
                        ? "bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] border-transparent text-white rotate-180 shadow-md"
                        : "bg-white border-slate-200 text-slate-400 group-hover:border-[#f80d5d] group-hover:text-[#f80d5d]"
                    }`}
                  >
                    <svg
                      className="w-4 h-4 lg:w-5 lg:h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </button>
                <div
                  className={`text-slate-600 text-[17px] lg:text-[18px] leading-relaxed overflow-hidden transition-all duration-300 ease-in-out ${
                    activeFaq === index
                      ? "max-h-96 pb-5 lg:pb-6 opacity-100"
                      : "max-h-0 pb-0 opacity-0"
                  }`}
                >
                  {faq.a}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER CTA */}
      <section className="bg-[#fff1f2] py-16 lg:py-24 relative overflow-hidden border-t border-[#f80d5d]/10">
        {/* Background Decorative Blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#fda6e1] rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#ffefe9] rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>

        <div className="container mx-auto px-6 max-w-6xl relative z-10 flex flex-col md:flex-row items-center justify-between gap-10 lg:gap-12">
          {/* Left Text Content */}
          <div className="max-w-xl text-left">
            <h2 className="text-2xl md:text-3xl lg:text-[2.6rem] font-black text-slate-900 mb-4 lg:mb-6 tracking-tight leading-tight">
              Get real, organic, and targeted Instagram followers today!
            </h2>
            <p className="text-sm lg:text-base text-slate-600 mb-6 lg:mb-8 leading-relaxed max-w-md">
              Get started with the #1 Instagram Growth Service today and watch
              your account sky-rocket!
            </p>
            <div className="flex flex-row items-center gap-5 lg:gap-6">
              {window.location.pathname === "/" ? (
                <a
                  href="#pricing"
                  className="bg-gradient-to-r from-[#ffae07] from-[0%] via-[#ff2429] via-[25%] to-[#f1078d] to-[85%] text-white px-6 py-3 lg:px-8 lg:py-4 rounded-xl font-bold hover:opacity-90 transition-opacity text-[13px] lg:text-sm shadow-md whitespace-nowrap"
                >
                  Start my growth today
                </a>
              ) : (
                <Link
                  to="/#pricing"
                  className="bg-gradient-to-r from-[#ffae07] from-[0%] via-[#ff2429] via-[25%] to-[#f1078d] to-[85%] text-white px-6 py-3 lg:px-8 lg:py-4 rounded-xl font-bold hover:opacity-90 transition-opacity text-[13px] lg:text-sm shadow-md whitespace-nowrap"
                >
                  Start my growth today
                </Link>
              )}
              <div className="flex items-center gap-2 text-[11px] lg:text-xs font-bold text-slate-500">
                <img
                  src="/images/sheild.svg"
                  alt="Guarantee"
                  className="w-3.5 lg:w-4 opacity-75"
                />
                Results Guaranteed *
              </div>
            </div>
          </div>

          {/* Right Image Content */}
          <div className="flex-shrink-0 w-full md:w-auto flex flex-col items-center lg:items-end">
            <div className="flex gap-3 lg:gap-4 mb-5 lg:mb-6">
              <div className="bg-white rounded-lg px-3 py-1.5 lg:px-4 lg:py-2 flex items-center gap-2 text-slate-700 font-bold text-[11px] lg:text-[13px] border border-slate-100 shadow-sm">
                <svg
                  width="14"
                  height="11"
                  viewBox="0 0 21 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-3 h-3 lg:w-auto lg:h-auto"
                >
                  <defs>
                    <linearGradient
                      id="checkGrad"
                      x1="0"
                      y1="8"
                      x2="21"
                      y2="8"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop offset="0%" stopColor="#ffae07" />
                      <stop offset="45%" stopColor="#ff2429" />
                      <stop offset="100%" stopColor="#f1078d" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M6.67368 12.6234L1.69528 7.64802L0 9.33035L6.67368 16L21 1.68233L19.3167 0L6.67368 12.6234Z"
                    fill="url(#checkGrad)"
                  />
                </svg>
                No Bots
              </div>
              <div className="bg-white rounded-lg px-3 py-1.5 lg:px-4 lg:py-2 flex items-center gap-2 text-slate-700 font-bold text-[11px] lg:text-[13px] border border-slate-100 shadow-sm">
                <svg
                  width="14"
                  height="11"
                  viewBox="0 0 21 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-3 h-3 lg:w-auto lg:h-auto"
                >
                  <path
                    d="M6.67368 12.6234L1.69528 7.64802L0 9.33035L6.67368 16L21 1.68233L19.3167 0L6.67368 12.6234Z"
                    fill="url(#checkGrad)"
                  />
                </svg>
                No Fake Followers
              </div>
            </div>
            <img
              src="/images/fcta.avif"
              alt="Devices"
              className="w-full max-w-[320px] lg:max-w-[420px] object-contain drop-shadow-xl"
            />
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-white text-slate-500 py-12 lg:py-16 border-t border-slate-200">
        <div className="container mx-auto px-6 max-w-7xl flex flex-col md:flex-row justify-between items-start gap-10 lg:gap-12">
          <div className="flex flex-col md:flex-row gap-12 lg:gap-16 w-full md:w-1/2">
            <div className="flex flex-col gap-3 lg:gap-4">
              <div className="font-bold text-slate-900 text-[11px] lg:text-sm tracking-wider uppercase mb-1 lg:mb-2">
                Product
              </div>
              <a
                href="#how-it-works"
                className="text-[13px] lg:text-sm font-medium hover:text-blue-600 transition"
              >
                How it works
              </a>
              <a
                href="#pricing"
                className="text-[13px] lg:text-sm font-medium hover:text-blue-600 transition"
              >
                Pricing
              </a>
              <a
                href="#faq"
                className="text-[13px] lg:text-sm font-medium hover:text-blue-600 transition"
              >
                FAQ
              </a>
            </div>

            {/* LEGAL SECTION */}
            <div className="flex flex-col gap-3 lg:gap-4">
              <div className="font-bold text-slate-900 text-[11px] lg:text-sm tracking-wider uppercase mb-1 lg:mb-2">
                Legal
              </div>
              <Link
                to="/terms-of-service"
                className="text-[13px] lg:text-sm font-medium hover:text-blue-600 transition"
              >
                Terms of service
              </Link>
              <Link
                to="/privacy-policy"
                className="text-[13px] lg:text-sm font-medium hover:text-blue-600 transition"
              >
                Privacy policy
              </Link>
            </div>

            <div className="flex flex-col gap-3 lg:gap-4">
              <div className="font-bold text-slate-900 text-[11px] lg:text-sm tracking-wider uppercase mb-1 lg:mb-2">
                Contact
              </div>
              <a
                href="mailto:support@virallized.com"
                className="text-[13px] lg:text-sm font-medium hover:text-blue-600 transition"
              >
                Email us
              </a>
            </div>
          </div>

          <div className="w-full md:w-1/3 flex flex-col items-start md:items-end text-left md:text-right mt-6 md:mt-0">
            <img
              src="/images/logos/virallized-main-logo.svg"
              alt="Virallized"
              className="w-32 lg:w-40 mb-3 lg:mb-4"
            />
            <p className="text-[12px] lg:text-sm font-medium text-slate-500 max-w-[280px] lg:max-w-xs">
              The #1 Instagram Growth Service in the U.S., helping clients grow
              faster on Instagram
            </p>
          </div>
        </div>
        <div className="container mx-auto px-6 max-w-7xl mt-12 lg:mt-16 pt-6 lg:pt-8 border-t border-slate-100 flex justify-center text-[12px] lg:text-sm font-medium">
          © Virallized 2026. All Rights Reserved
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

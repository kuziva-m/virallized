import { lazy, Suspense, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

// Keep the main homepage eager so the homepage does not get a loading flash.
import LandingPage from "./pages/LandingPage";

// Lazy-loaded public pages
const InstagramGrowth50Off = lazy(
  () => import("./pages/LandingPage-instagram-growth-50-off"),
);
const Off50 = lazy(() => import("./pages/LandingPage-50-off"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const AgencyPricing = lazy(() => import("./pages/AgencyPricing")); // 🚨 NEW AGENCY PRICING PAGE

// Lazy-loaded onboarding pages
const Setup = lazy(() => import("./pages/onboarding/Setup"));
const UpdateTargeting = lazy(
  () => import("./pages/onboarding/UpdateTargeting"),
);
const Whitelist = lazy(() => import("./pages/onboarding/Whitelist"));
const Add2FA = lazy(() => import("./pages/onboarding/Add2FA"));
const AuditOffer = lazy(() => import("./pages/AuditOffer"));

// Lazy-loaded private/auth/admin/agency pages
const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Settings = lazy(() => import("./pages/Settings"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const BlogAdmin = lazy(() => import("./pages/BlogAdmin"));
const AgencyDashboard = lazy(() => import("./pages/AgencyDashboard")); // 🚨 NEW AGENCY HUB

type RewardfulQueue = ((...args: any[]) => void) & {
  q?: IArguments[];
};

declare global {
  interface Window {
    _rwq?: string;
    rewardful?: RewardfulQueue;
    Rewardful?: {
      referral?: string;
      affiliate?: any;
      campaign?: any;
      coupon?: any;
    };
  }
}

const REWARDFUL_CAMPAIGN_ID = "da4581";
const REWARDFUL_SCRIPT_SRC = "https://r.wdfl.co/rw.js";
const STRIPE_PAYMENT_LINK_HOST = "buy.stripe.com";

const REWARDFUL_ENABLED_PATHS = new Set([
  "/50-off",
  "/instagram-growth-50-off",
]);

function PageFallback() {
  return (
    <div
      className="min-h-screen bg-white"
      aria-label="Loading page"
      role="status"
    />
  );
}

function isRewardfulEnabledPath(pathname: string) {
  const normalizedPath = pathname.replace(/\/+$/, "") || "/";
  return REWARDFUL_ENABLED_PATHS.has(normalizedPath);
}

function initialiseRewardfulQueue() {
  window._rwq = "rewardful";

  window.rewardful =
    window.rewardful ||
    function () {
      (window.rewardful!.q = window.rewardful!.q || []).push(arguments);
    };
}

function loadRewardfulScript() {
  const existingScript = document.querySelector(
    `script[data-rewardful="${REWARDFUL_CAMPAIGN_ID}"]`,
  );

  if (existingScript) return;

  const script = document.createElement("script");
  script.async = true;
  script.src = REWARDFUL_SCRIPT_SRC;
  script.setAttribute("data-rewardful", REWARDFUL_CAMPAIGN_ID);
  document.head.appendChild(script);
}

function getRewardfulReferralId() {
  return window.Rewardful?.referral || "";
}

function appendRewardfulReferralToStripeUrl(rawUrl: string) {
  const referralId = getRewardfulReferralId();

  if (!referralId) {
    return rawUrl;
  }

  try {
    const url = new URL(rawUrl, window.location.href);

    if (url.hostname !== STRIPE_PAYMENT_LINK_HOST) {
      return rawUrl;
    }

    url.searchParams.set("client_reference_id", referralId);

    return url.toString();
  } catch {
    return rawUrl;
  }
}

function patchStripePaymentLinks() {
  const links = document.querySelectorAll<HTMLAnchorElement>(
    `a[href*="${STRIPE_PAYMENT_LINK_HOST}"]`,
  );

  links.forEach((link) => {
    link.setAttribute("data-rewardful", "");

    const patchedHref = appendRewardfulReferralToStripeUrl(link.href);

    if (patchedHref !== link.href) {
      link.href = patchedHref;
    }
  });
}

function RewardfulPromoTracker() {
  const location = useLocation();

  useEffect(() => {
    if (!isRewardfulEnabledPath(location.pathname)) {
      return;
    }

    initialiseRewardfulQueue();
    loadRewardfulScript();

    // Use Rewardful's official ready queue pattern.
    window.rewardful?.("ready", () => {
      patchStripePaymentLinks();

      // Extra passes for lazy-loaded page content.
      window.setTimeout(patchStripePaymentLinks, 250);
      window.setTimeout(patchStripePaymentLinks, 1000);
    });

    // Patch any Stripe links already rendered.
    patchStripePaymentLinks();

    // Keep links patched when lazy route content renders.
    const observer = new MutationObserver(() => {
      patchStripePaymentLinks();
    });

    if (document.body) {
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }

    // Final safety net: patch the clicked Stripe link before navigation.
    const handleStripeLinkClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const link = target?.closest<HTMLAnchorElement>(
        `a[href*="${STRIPE_PAYMENT_LINK_HOST}"]`,
      );

      if (!link) return;

      link.setAttribute("data-rewardful", "");

      const patchedHref = appendRewardfulReferralToStripeUrl(link.href);

      if (patchedHref !== link.href) {
        link.href = patchedHref;
      }
    };

    document.addEventListener("click", handleStripeLinkClick, true);

    const fallbackTimer = window.setTimeout(patchStripePaymentLinks, 2000);

    return () => {
      observer.disconnect();
      document.removeEventListener("click", handleStripeLinkClick, true);
      window.clearTimeout(fallbackTimer);
    };
  }, [location.pathname]);

  return null;
}

function App() {
  return (
    <BrowserRouter>
      <RewardfulPromoTracker />

      <Suspense fallback={<PageFallback />}>
        <Routes>
          {/* Main Landing Page */}
          <Route path="/" element={<LandingPage />} />
          {/* Promo Pages */}
          <Route
            path="/instagram-growth-50-off"
            element={<InstagramGrowth50Off />}
          />
          <Route path="/50-off" element={<Off50 />} />
          <Route path="/agency-pricing" element={<AgencyPricing />} />{" "}
          {/* 🚨 NEW AGENCY PRICING */}
          {/* Legal Pages */}
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          {/* Blog Pages */}
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          {/* Post-purchase upsell */}
          <Route path="/audit-offer" element={<AuditOffer />} />
          {/* Onboarding Flow - Dynamic Pricing Routes */}
          <Route path="/set-up" element={<Setup />} />
          <Route path="/set-up-199" element={<Setup />} />
          <Route path="/set-up-pro" element={<Setup />} />
          <Route path="/set-up-299" element={<Setup />} />
          {/* Rest of Onboarding */}
          <Route path="/update-targeting" element={<UpdateTargeting />} />
          <Route path="/whitelist" element={<Whitelist />} />
          <Route path="/add-2fa" element={<Add2FA />} />
          {/* Auth & Command Center */}
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/settings" element={<Settings />} />
          {/* Agency Portal */}
          <Route path="/agency" element={<AgencyDashboard />} />
          {/* Admin Portal */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/blog-admin" element={<BlogAdmin />} />
          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;

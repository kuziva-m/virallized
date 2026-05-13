import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

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

// Lazy-loaded onboarding pages
const Setup = lazy(() => import("./pages/onboarding/Setup"));
const UpdateTargeting = lazy(
  () => import("./pages/onboarding/UpdateTargeting"),
);
const Whitelist = lazy(() => import("./pages/onboarding/Whitelist"));
const Add2FA = lazy(() => import("./pages/onboarding/Add2FA"));

// Lazy-loaded private/auth/admin pages
const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Settings = lazy(() => import("./pages/Settings"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const BlogAdmin = lazy(() => import("./pages/BlogAdmin"));

function PageFallback() {
  return (
    <div
      className="min-h-screen bg-white"
      aria-label="Loading page"
      role="status"
    />
  );
}

function App() {
  // Global Rewardful tracker.
  // Kept as-is to avoid breaking affiliate/referral tracking.
  useEffect(() => {
    (window as any)._rwq = "rewardful";
    (window as any).rewardful =
      (window as any).rewardful ||
      function () {
        ((window as any).rewardful.q = (window as any).rewardful.q || []).push(
          arguments,
        );
      };

    if (!document.querySelector("script[data-rewardful]")) {
      const script = document.createElement("script");
      script.async = true;
      script.src = "https://r.wdfl.co/rw.js";
      script.setAttribute("data-rewardful", "da4581");
      document.head.appendChild(script);
    }
  }, []);

  return (
    <BrowserRouter>
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

          {/* Legal Pages */}
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />

          {/* Blog Pages */}
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />

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
